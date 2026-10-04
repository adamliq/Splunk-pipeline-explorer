# Builder handoff: canvas UX improvements (Build 161 canvas review)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `abe5ce5` (Build 161), Builder canvas only.
- **Desktop:** 1440×900 and 1920×1080.
- **Topologies:** the default topology and the 17-component reference topology (`docs/mockups/ov1-reference-topology.json`).
- **States checked:** all four layout modes, the Group by options, selection, hover, keyboard focus and zoom levels.

**Works alongside:** [`builder-handoff-build162.md`](builder-handoff-build162.md) (performance and hygiene). Do this list after, or alongside, it. Layout changes affect redraw time, so keep `tools/builder-perf-check.js` in budget.

**Screenshots** (`docs/mockups/compare/`):

| File | Shows |
|---|---|
| `build161-canvas-ref-fit-1440.png` | reference topology after Fit at 1440: **23% zoom** |
| `build161-canvas-ref-fit-1920.png` | the same at 1920: **34% zoom**, right half of the canvas empty |
| `build161-canvas-ref-100.png` | reference topology at 100% |
| `build161-canvas-click-menu-and-inspector.png` | one click on a card opens the action menu **and** the inspector |
| `build161-canvas-tier-lanes-strips.png` | Group by → Tier lanes: two strips at the top, both partly under the left rail |

## What's already good

- **Default topology:** clean. Straight, labelled connectors, review badges on the line, labels above the line with a leader when space is short.
- **Connectors:** no connector crosses a card (connector tool all OK).
- **Panels:** panel and toolbar chrome fits at all desktop sizes (space tool 4/4).
- **Text and paths:** card text is 11.5–15px at 100%; paths are cached and fast at this size.
- **Hover detail:** every connector has a wide invisible hit path with a pointer cursor and a descriptive tooltip.

## Summary

| # | Issue | Impact | Size |
|---|---|---|---|
| 1 | Auto layout makes a tall, narrow world for real topologies; **Fit lands at 23% (1440) / 34% (1920)** | P1: real topologies can't be read without zooming in and panning | large |
| 2 | No level of detail: below ~60% zoom, card text is under 7px | P1 | medium |
| 3 | One click on a card opens the action menu **and** the inspector; the menu covers the card and is clipped by the drawer | P1 | small |
| 4 | Overlays and strips take canvas space: the help box is always on, the SOAR strip and the type-chip bar sit under the rail, the inspector auto-opens on import, and Fit ignores the drawer | P2 | small–medium |
| 5 | Card consistency: 13 different card heights, tier labels wrap to 4 lines, chip text cut off, an "Unconnected" heading over a connected component | P2 | small |
| 6 | Connector readability: repeated fan-out labels, no hover highlight, grey badges, "TLS Not applicable" for syslog | P2 | small–medium |
| 7 | Keyboard focus ring invisible on the canvas | P2 (accessibility) | small |
| 8 | Vertical layout on desktop is one 5,000px column, and Fit doesn't fit it | P3 | medium |

---

## 1. Auto layout: use the width, align rows (P1)

**Now** (reference topology, Auto → horizontal at 1440):
- **World size:** 1628 × **2118** px, portrait, while the canvas is landscape (about 1400 × 700 visible).
- **Fit:** zoom **0.23** at 1440, **0.34** at 1920. Card names render at about 3–4px. At 1920, the right half of the canvas is empty.

**Card positions** from `unifiedBuilderPositions()` (x,y):
```
column x=48 : authUser 58 · ds 288 · syslogSource 518 · syslogSource 748 · awsLambda 978 · soarCloud 1208 ·
              authProviderCloud 1438 · licenseManager 1668 · monitoringConsole 1898     ← 9 cards stacked
column x=368: syslog 748 · syslog 978 · hf 1208
column x=688: uf 863 · uf 1093
column x=1008: idx 978      column x=1328: search 978      x=-192: windowsEvent 58 ("Unconnected")
```

**Two causes:**
1. **Everything without a data parent goes into column 0.** That's the Administrator, the Deployment Server, the SOAR platform, the auth provider, the License Manager and the Monitoring Console. These are management, identity and platform components, not data sources, and they make the first column 9 cards tall.
2. **Each source sits one row above its first child:**
   - Firewalls y=518 → Syslog Server 1 y=748;
   - Syslog Source 2 748 → Syslog Server 2 978;
   - Lambda 978 → Heavy Forwarder 1208.

   So every first hop has an elbow instead of a straight line.

**Fix** (in the horizontal auto layout, the `unifiedBuilderPositions` chain, via a v-block wrapper):
1. **Data flow only in the columns:** columns from sources to search as now, with only components on the event-data path.
2. **Align rows:** a parent takes the y of its first child, or is centred on its children. A single-child chain must be one straight row.
3. **Platform band:** one horizontal row under the data flow, titled "Platform and access".
   - Place each card under the column it serves:
     - Deployment Server under the forwarder column;
     - License Manager and Monitoring Console under the indexer/search columns;
     - Auth provider and Administrator under the search column;
     - SOAR beside the search column.
   - Keep their management and authentication lines routed in the gap between the flow and the band.
4. **Unconnected tray:** components with no links at all go in a small tray at the bottom-left of the band, never at negative x.
   - The current "Unconnected · drag to connect" heading also sits over **Administrator 1**, which **does** have a SAML link. Only components with no relationship in any plane belong in the tray.

**Expected result** for the reference topology: a world of about 1650 × 1000 (3 data rows + 1 band). Fit then lands at about **0.6–0.65 at 1440** and **0.85–0.9 at 1920**, nearly 3× larger text.

**Check:**
- Reference topology, Auto, inspector closed: Fit zoom ≥ **0.55** at 1440 and ≥ **0.8** at 1920.
- No card at negative x.
- Every one-to-one data hop is a straight horizontal line.
- The default topology looks the same as now.
- Connector tool all OK; perf in budget.

## 2. Level of detail at low zoom (P1)

At 50% zoom the chips render at about 6px and names at about 7px (see `i-zoom50` in the review). At Fit on large topologies (even after item 1, about 0.6), most text sits around the readability limit.

**Fix:** a class on `.unifiedBuilderWorld`, set from `state.builderViewport.zoom` in `applyBuilderViewport`:

| Zoom | Card shows | Connectors show |
|---|---|---|
| ≥ 0.75 | everything (as now) | labels + badges |
| 0.45–0.75 | tier icon, **name** (keep ≥ 11px on screen: `font-size: calc(11px / var(--zoom))`, capped at 20px), one status line; chips hidden | badges only; labels on hover |
| < 0.45 | coloured block with the name only (same rule), issue dot | lines only |

Toggle classes only; no re-render. This must not trigger `renderBuilder` (perf budget).

**Check:** at Fit on the reference topology, every component name is readable (≥ 11px on screen); zooming in restores the full cards without a redraw.

## 3. One click, two overlays (P1)

**Now:** a single click on a card opens:
- the **object menu** (`showBuilderObjectMenu`, `.builderObjectMenu`, about 205×200–330), drawn **over the card itself**. It covers the card's rows and its connection handles ("Event data / Fleet management / …");
- **and** the **inspector drawer** (340px) on the right.

Where the card is near the drawer, the menu slides **under** it and is cut off: "Replace the generated component name wit…" in `build161-canvas-click-menu-and-inspector.png`. The menu's actions (Connect, Trace, Inspect settings, Remove, View findings) duplicate the inspector.

**Fix:**
- **Single click:** select and open the inspector (as now). **No** object menu.
- **Object menu:** open it on right-click, long-press (touch), the context-menu key, or a small "⋯" button that appears on the selected card's top-right corner.
- **Menu placement:** beside the card on the side away from the drawer. Never over the card's own handles, and never under the drawer (clamp to `canvas.right − drawer.width − 8`).

**Check:** clicking a card shows only the selection outline, the handles and the inspector. Right-click shows the menu fully visible, not covering the handles.

## 4. Overlays and strips that take canvas space (P2)

1. **Help box** ("Pan drag blank space · Zoom wheel …", `.builderSpaceHelpPopover140`, 370×82): shown permanently at the bottom-left, over content. It only hides when "?" is clicked, and comes back on reload.
   - Show it on the first visit only, with a "Got it" button.
   - Remember the dismissal (`localStorage`, in try/catch).
   - "?" re-opens it.
2. **"Splunk SOAR response · 1 platform · 0 playbooks"** (`#builderSoarGuide`, 37px tall, full width): its first ~40px is under the left tool rail ("…unk SOAR response").
3. **Group-by chip bar** (`.builderGroupChips130.groupStrip131`, 37px): also under the rail (its first item "Highlight" is hidden). It also scrolls sideways (1859px of chips in 1404px) with no visible sign that there's more.

   For items 2 and 3:
   - Indent both strips by the rail width + 12px (about 56px), or start the rail below them.
   - Add the same right-edge fade as the phone nav (v160) to the chip bar.
   - Make the SOAR guide collapsible to a one-line chip ("SOAR · 0 playbooks ⓘ"). It's guidance, not canvas content.
4. **Inspector auto-opens on import:** `loadTopologyDocument` leaves `builderSelected` set (the first component). The drawer opens and covers 25% of the canvas. After import, select nothing and keep the drawer closed.
5. **Fit ignores the drawer and bottom bar.** Fit uses the whole canvas, so at higher zooms content ends up under the inspector or the bottom toolbar.
   - Fit into the **visible** rectangle: canvas minus an open drawer, minus the bottom toolbar (46px), minus the help box if shown.
6. **Import toast:** it sits top-centre over the canvas for several seconds. Move it to the bottom-centre, above the toolbar.

**Check:**
- Nothing on the canvas is covered by the rail.
- After import, no drawer is open.
- Fit leaves every card outside the drawer and the toolbar.
- The help box doesn't return after "Got it" and a reload.

## 5. Card consistency (P2)

On the reference topology at 100%:
- **13 different card heights (142–217px).** Tier labels wrap to 2–4 lines:

  | Tier label | Lines |
  |---|---|
  | "Cloud-hosted security orchestration platform" | 4 |
  | "Splunk Enterprise deployment monitoring" | 3 |
  | "Splunk forwarding tier", "Splunk management tier", "AWS serverless collector", "Cloud identity provider", "Splunk Enterprise licensing authority" | 2 |

  Rows look ragged, and each wrapped line pushes the card's content down.
  - Keep the tier label to **one line** (ellipsis + `title`), with shorter names: "SOAR · cloud", "Monitoring Console", "Licensing", "Forwarding tier", "Identity provider".
  - Give cards in the same row the same height (the tallest in the row).
- **Chip text cut off with "…":** "Windows Event Log service", "IAM role & Secrets Manager", "Distributed instance inventory", "Internal metrics and health". Allow two lines for stage rows, or widen cards from 190 to 210px.
- **"Unspecified" chip:** an unset region shows as a bare "Unspecified" chip, with no word saying what's unspecified. Use "Region not set", muted, with the review badge.
- **Green tick on the selected card's corner** reads as "valid". Use the selection outline and handles only.

**Check:** at most one card height per row; no tier label wraps; no chip text is cut off.

## 6. Connector readability (P2)

1. **Repeated fan-out labels:** the Deployment Server's three management links show **"Phone-home and app delivery" three times**, on three parallel dashed lines running side by side for about 300px.
   - When one source has ≥ 2 links of the same plane and protocol, draw one trunk from the source to a split point.
   - Put **one** label on the trunk: "Phone-home and app delivery · 3 clients".
   - Branch only after the split.
2. **No hover highlight:** hovering a connector (on its hit path) changes the cursor and shows the tooltip, but the line itself doesn't change.
   - **On hover:** thicken the line by 1.5px, raise it above the others, and brighten its two end cards.
   - **On selection:** keep the highlight and dim the other connectors to 40%.
3. **Badges:** grey numbered circles on cards and lines. Their meaning is only in the tooltip ("1 review **findings** for …"; use the singular for 1).
   - Colour them by the worst severity: red for errors, amber for review.
   - Add "● review findings" to the plane legend.
4. **Tooltip text:** the syslog tooltip says "TCP/TLS or UDP · **TLS Not applicable**". Use "TLS not confirmed", the same as TM-1's "None" for this flow.

**Check:** the reference topology shows one "Phone-home and app delivery" label; hovering a line highlights it; badges are coloured by severity.

## 7. Keyboard focus ring (P2, accessibility)

Tabbing into the canvas focuses a connection handle (`button.connectionHandle`) whose outline is `auto 1px rgb(16,16,16)`: near-black on the dark canvas, so effectively invisible.

**Fix:** a shared `:focus-visible` style for:
- cards (`.builderNode`);
- connection handles;
- edge labels;
- review badges;
- the canvas toolbar.

Use `outline: 2px solid #7dd3fc; outline-offset: 2px`. Cards should be focusable (`tabindex="0"`, `role="group"`, `aria-label` with name + tier), with arrow keys moving between them (`builderV…` already supports arrows for panning; use Alt+arrows for focus moves).

**Check:** Tab through the canvas; every focused item shows a visible ring.

## 8. Vertical layout on desktop (P3)

Choosing **Vertical** at 1440 stacks every card in **one column**, 1360 × **4995** px. Fit stays at **100%** (it doesn't fit), so the user scrolls through 5,000px. On desktop, Vertical should be a top-to-bottom flow with siblings side by side (the horizontal algorithm, transposed), and Fit should fit it. Keep the one-column version for phones only.

**Check:** Vertical on the reference topology at 1440: Fit zoom ≥ 0.5, and all cards visible.

---

## Order of work

1. Item 3, item 4 (overlays) and item 7: small, local changes with visible gains.
2. Item 1 (layout), then item 2 (level of detail): the biggest gain for real topologies. Re-run perf and the connector tool after each.
3. Items 5, 6 and 8.

## How to verify

1. 0 `pageerror` events; button sweep (189) and grouping sweep are clean.
2. All three tools pass (perf `allOk` on three runs, space 4/4, connector all OK).
3. Reference topology at 1440 and 1920, Auto layout, inspector closed: Fit zoom ≥ 0.55 / ≥ 0.8; names readable at Fit (item 2); straight first hops (item 1).
4. The default topology looks unchanged (pixel comparison with Build 161, apart from the intended changes).
5. Click, right-click, hover and Tab behave as in items 3, 6 and 7.
6. Phones at 360 and 390: unchanged or better (Build 159 checks).
7. A `changeRegister` entry and the build stamp for each new block.

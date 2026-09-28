# Builder handoff: tasks for Build 128

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** `main` at `e4a1009` (Build 127, 29 Sep 2026), also merged into branch `claude/build-page-layout-bl6jk1`. There is no newer build; this is a new version of the task list, not a new review.
**History:** `builder-handoff-build127.md` (the Build 127 review this list comes from) and earlier.
**Tool:** `node tools/builder-connector-check.js index.html [screenshot-dir]` (Playwright/Chromium).
**Mockup:** `docs/mockups/builder-grouping-mockup.html` (standalone; open it in a browser) for item 7.

## TL;DR

Build 127 is in very good shape: 0 errors, 179 buttons clean, and every connector scenario passes. This list has **six small fixes carried over from the Build 127 review** (items 1–6; 1–4 are in the architecture pack) and **one new feature, "Group by" on the canvas** (item 7), with an interactive mockup. Suggested order: items 1–6, then item 7 (tier lanes first, component type second).

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v127`).
- **Never redeclare a top-level `const`, `let` or `function` name** (all classic scripts share one global scope; a duplicate makes the browser skip the whole script). Suffix new names with the block number.
- One version number per block; the next is `…-v128`. Build 128 may contain several blocks (for example `…-v128` for the fixes and `…-v129` for Group by); keep the build stamp on the highest.
- Move existing DOM elements rather than recreating them; layout code must be idempotent.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- Before uploading: zero `pageerror` events at 1440×900 and 390×844 after clicking **Builder**, run `tools/builder-connector-check.js`, and export the architecture pack once.

---

## Baseline: verified in Build 127

| Area | Result |
|---|---|
| Load, resize, button sweep | ✅ 0 errors; 179 buttons |
| Connector check (8 scenarios, while dragging and after drop) | ✅ **all OK** |
| Pack: cover | ✅ table of contents with page numbers; owner (or "Not set"); scope; build 127; counts; "Valid · 0 errors · 12 to review" |
| Pack: tables | ✅ inventory 4 rows; event-data connections 3 rows (14 columns); findings 12; rules 10; header rows repeat in print |
| Pack: security, ownership, resilience, deployment, appendix | ✅ present when enabled |
| Pack: duplicate diagram pages | ✅ removed ("Region · Unspecified" gone) |
| Pack: printing | ✅ page number and footer on all 17 pages; cover prints |
| Pack: light theme | ✅ white page; 0 of 536 HTML text elements below 4.5:1 |
| Pack: "Not set" and secrets | ✅ 23 "Not set" markers; no secret or credential values |
| Pack: re-import | ✅ exported a 5-node / 4-connection topology, re-imported on a fresh page, got 5 / 4 including the renamed node; a non-pack file gives a clear error |
| Palette pin (v126) | ✅ docks beside the canvas (canvas narrows; 0 cards covered); stays open after add and after selecting a card; persists across reload |
| Relationship authentication (v127) | ✅ "Authentication required" (Unknown/Yes/No) and "Authentication type" (13 mechanisms) per connection; **no password or secret inputs**; the chosen type is stored and appears in the pack and in the topology JSON |

---

## Items 1–6: fixes carried over from the Build 127 review

### 1. Pack diagrams: the "Splunk-to-Splunk" label is detached from its line
**Now:** in the pack's overview diagram (both themes), the UF → Indexer connector is now straight (the earlier loop over the top is fixed), but its label "Splunk-to-Splunk" sits **128px above the line**. The other two labels are 8px from their lines.
**Cause:** v125 re-routes the export connectors with the 320px layout, but the label keeps a position calculated for the old looping route (or for `routeMidpoint` of the old points).
**Fix:** in the export SVG, place each label at the midpoint of the **final** path: after building each `<path d>`, compute its midpoint (with a DOM SVG, `getPointAtLength(total/2)`; or compute the midpoint of the final polyline, since the export draws straight segments with rounded corners). Apply any user `labelOffset` afterwards. Put the edge badge at the label's right end, as on the canvas.
**Check:** in the exported overview, every connector label's centre is ≤ 12px from its own path, and no label overlaps a card.

### 2. Pack tables are too small to read in print
**Now:** table `td` and `th` are **8px** (about 6pt when printed on A4 landscape).
**Fix:** use at least **9.5pt** body text and 9pt headers in print (`@media print{td,th{font-size:9.5pt}}`), and 12–13px on screen. Let wide tables (the 14-column connection register) wrap cell text rather than shrink it; if they still don't fit, split into two tables ("Transport" and "Service levels").
**Check:** `getComputedStyle(td).fontSize` ≥ 12.6px (9.5pt) under `emulateMedia('print')`, and no table overflows the page width in the Chromium PDF.

### 3. Pack light theme: the diagram's classification text is faint
**Now:** in the light theme, the SVG text "SECURITY TELEMETRY + PII" (the `.classification` element, fill `rgb(243,189,97)`) measures **1.7:1** against the white page. The diagram cards stay dark, which is fine: their own text is readable.
**Fix:** in the light theme, use a dark amber for `.classification` (for example `#8a5a00`, about 6:1 on white), and check the legend and subtitle colours the same way. Apply it only in the light theme; the dark theme is fine.
**Check:** every SVG text element drawn directly on the page background (legend, title, subtitles, classification; not text inside cards) is ≥ 4.5:1 in the light theme.

### 4. Pack: empty connection planes take a full page each
**Now:** with no fleet-management or authentication connections, "Fleet management connections" and "Interactive authentication connections" are each a full page with one line, "No entries in this section."
**Fix:** omit empty plane tables, and add one line to the event-data connections page (or the cover): "No fleet-management or interactive-authentication connections in this topology." Recompute the table of contents and page numbers. Apply the same rule to any other section whose tables are all empty (for example Deployment management when there's no Deployment Server).
**Check:** with the default topology and all sections on, the pack has no page whose only content is "No entries in this section."

### 5. The pinned palette also opens on mobile
**Now:** after pinning on desktop (stored in `localStorage` key `splunkPipelineExplorer.palettePinned.v1`), resizing to 390×844, or opening on a phone, shows the palette **open at 310×781px**, covering nearly the whole screen and the canvas. v126's own comment says "docks on desktop".
**Fix:** in the v126 `syncCanvasPanels` wrapper, only force the palette open when the desktop media query matches (for example `(min-width:1121px)`, as v113 and v116 use). On mobile, a pinned preference is remembered but ignored, and the palette opens only from ＋ Add. Hide or disable the Pin button on mobile, with a title such as "Pin is available on wider screens".
**Check:** with pin on, at 390×844 the palette is closed on load and after resizing from 1440 to 390; back at 1440 it's docked again.

### 6. Relationship authentication is hard to find
**Now:** the two new dropdowns live inside the collapsed **"Advanced settings and assurance"** section of the connection inspector, so most users won't discover them, and nothing on the canvas or in the inspector's main view shows the authentication state.
**Fix:** in the connection inspector's main (always-visible) area, add a one-line summary with a direct edit link, for example "Authentication: Mutual TLS certificate · required" or "Authentication: not specified · Set…". Clicking it opens the Advanced section and focuses the "Authentication type" dropdown. Optionally, add a small lock icon to the connection label on the canvas when authentication is specified (with a tooltip naming the type), and flag "Authentication required = Yes" with "type = Not specified" as a review finding.
**Check:** selecting a connection shows the summary line without expanding anything; the link focuses the dropdown; changing the type updates the summary, the pack and the topology JSON.

---

## Item 7. New feature: "Group by" on the canvas (tier lanes and component type)

**Mockup:** open `docs/mockups/builder-grouping-mockup.html` in a browser; it's a standalone, interactive page. It shows the three modes on an example 14-component topology and is the visual reference for this item. It's a mockup only: its layout and connectors are simplified, so build on the Builder's real layout, routing (v123/v124) and export code rather than copying its drawing code.

### What exists today (don't duplicate)
- **Isolate by** (`#builderIsolateBy`): complete topology / region / environment. Filters what's shown.
- **Group containers** (`#builderNavigationGroup`, `state.builderGroups`): user-created boxes, collapsible (`largeNavCollapsed()`).
- **Palette categories:** Sources, Collection, Processing, Destinations, Access & management, Deployment configuration, the clustering add-ons, Stream, SOAR, S3 federated search.
- **Collapsed-group export:** `withArchitectureExportScope()` already turns a collapsed group into one proxy node and merges its edges. Reuse that logic for collapsed types.

### Control
Add **Group by** to the Navigate row (next to Isolate by), with options `None` · `Tier lanes` · `Component type` · `Region` · `Environment` · `My containers`. Store the choice in `state.builderGrouping = {mode, collapsedTypes:[]}`, and save it in navigation bookmarks, layout profiles and `topologyDocument()`.

### Mode: Tier lanes (build first)
- Labelled vertical bands in pipeline order (Sources, Collection, Forwarding, Processing, Indexing, Search), each with a count ("Forwarding · 3"). Derive a component's tier from its type (one lookup table, shared with the palette categories).
- A separate **Management** lane along the bottom for Deployment Server, License Manager, Monitoring Console, cluster managers, identity providers and other non-event-data roles, placed under the column of the tier they manage, so fleet-management and authentication lines don't cross the event-data path.
- Empty tiers collapse to a thin labelled strip.
- In auto and horizontal layout, the lanes decide the x position (column = tier). In **free layout, never move nodes**: draw the lane backgrounds behind the user's positions instead, based on each lane's members.
- Lanes are drawn behind nodes and connectors (not interactive), and they're included in SVG, PNG and architecture pack exports when this mode is on.

### Mode: Component type (build second)
- A dashed box per component type, inside its tier column, with a header "Universal Forwarder · 3" and a ▾ toggle. The header is a keyboard-focusable button.
- **Collapse** turns the box into one summary node: "Universal Forwarder ×3", a meta line with regions ("2 regions") and review count ("1 to review"), and a stacked-card look. Clicking the summary node (or Enter) expands it again.
- **Merged connectors:** while a type is collapsed, its members' connections to the same endpoint merge into one line with a count badge ("3"). Its tooltip and a click list the member connections. Connections between members of the same collapsed type are hidden.
- Toolbar actions in this mode: "Collapse types with 3+" and "Expand all".
- **Manual containers take priority:** a node in a user container stays in that container, and type boxes only group ungrouped nodes (or offer "Ignore my containers" as an explicit choice).
- The architecture pack's "Current navigation view" scope exports the same collapsed view.

### Highlight chips (works in every mode)
A chip row under the controls: one chip per component type present, with a count. Click to highlight that type (dim the others and their unrelated connectors); Shift-click to add types; click again to clear. In the Builder, Shift-click could also select those nodes for bulk edit. Chips change no positions.

### Rules
- Grouping is a **view**. It never creates, edits or deletes `state.builderGroups`, and it never changes free-layout positions.
- Must be idempotent across re-renders (`renderBuilder`, layout switches, resize) and must not redeclare any existing top-level name (suffix new names with the block number).
- Keep the connector geometry guarantees: run `tools/builder-connector-check.js` in every grouping mode. Extend it with a scenario per mode, and one with Universal Forwarder collapsed, checking the merged line and its badge.
- Mobile (≤760px): lanes stack vertically in pipeline order (tier headers as row labels); type groups collapse by default for types with 3 or more.

### Acceptance check
- Tier lanes: with the default topology, every node sits inside its tier's band; Deployment Server and License Manager are in the Management lane; lane counts match the node counts; in free layout, positions before and after switching are identical.
- Component type: collapsing Universal Forwarder in a topology with 3 UFs managed by one Deployment Server shows one summary node and one Deployment Server → UF line with badge "3"; expanding restores the 3 nodes and 3 lines; Undo isn't affected (it's a view change).
- The mode and collapsed types survive a reload through a saved layout profile or bookmark, and appear in the exported pack.
- Chips: clicking "Indexer" dims every non-Indexer node; Shift-click "Search Head" adds it; clicking again clears.
- 0 `pageerror` events; the button sweep and connector check pass in all modes.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. `node tools/builder-connector-check.js index.html shots/`: every scenario `OK`, while dragging and after drop.
3. Button sweep: every `#topologyBuilder` button, on a fresh page, with its context revealed, gives no errors and a visible effect.
4. Architecture pack: export with all sections and diagram pages on, then check the items above plus the Build 124 acceptance list (counts, "Not set", no secrets, page numbers in the PDF, re-import).
5. Group by: the item 7 acceptance check, and the connector check in every grouping mode.
6. Add a `changeRegister` entry for each new block.

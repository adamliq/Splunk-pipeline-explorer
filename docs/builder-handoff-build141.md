# Builder handoff: Build 141 review

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `dbaff23` (Build 141, 29 Sep 2026: `builder-ov2-visual-v138`, `builder-ov3-visual-v139`, `builder-canvas-space-v140`, `builder-canvas-sharp-v141`), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build137.md` plus the four rework specs it links: `builder-handoff-ov2-diagram.md`, `builder-handoff-ov3-matrix.md`, `builder-handoff-canvas-space.md` and `builder-handoff-zoom-sharpness.md`. This file replaces them as the task list; they stay as the full specs.
**Tools:**
- `node tools/builder-connector-check.js index.html [shots]`
- `node tools/builder-space-check.js index.html [shots]`

Both are on branch `claude/build-page-layout-bl6jk1`; copy `tools/` to `main`.

**Screenshots (now):** `docs/mockups/compare/builder-build141-1440.png`, `ov1-build141.png`, `ov2-build141.png` and `ov3-build141.png` (made with `docs/mockups/ov1-reference-topology.json`). Compare with `ov1-mockup.png`, `ov2-mockup.png` and `ov3-mockup.png`.

## TL;DR

- **Very large step.** The canvas now gets **80–91% of the screen** (was 31–63%), with no page scroll. Focus mode fills the window, and the inspector docks beside the canvas at ≥ 1680px. The zoom-sharpness fix is in. OV-2 and OV-3 now look like their mockups.
- **0 errors:** load at 4 sizes, resize, **185 buttons**, all Group-by modes, the OV tab (desktop, mobile, both themes), pack export, and re-import. Connector check: 8 of 8 scenarios OK. Space check: all 4 sizes meet the target.
- **One P1:** from 1440 to 1919px, the merged header row overflows, so the plane toggles stack into a column and **Group by sits under the Navigate menu** (item 1).
- **Next in importance:**
  - OV-2 draws needlines from a node to **itself** (item 2).
  - OV-3's sticky columns cover the first letters of the Producer column, and the plane chips show their labels twice (item 3).
  - OV-1 items 1–2 from the Build 137 list are still open (item 5).

## Rules (unchanged, plus one)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v141`). The next block is `…-v142`. Never redeclare a top-level name.
- Pages inside the app inherit the base CSS; scope resets to your root.
- Before uploading, run the connector tool, the space tool, the button and grouping sweeps, and the three OV tabs.
- **New:** check the header at **1280, 1440, 1680, 1920 and 2560 px wide**. Merged rows must never wrap inside a group or overlap another control (item 1 has a test).

---

## Verified in Build 141

| Area | Result |
|---|---|
| Canvas space | ✅ 1280×800 → 1246×659 (80%); 1440×900 → 1406×795 (86%); 1920×1080 → 1886×975 (89%); 2560×1440 → 2526×1335 (91%); chrome above the canvas 93px (129px at 1280); no page scroll; 17px gutters |
| Validation bar and footer | ✅ gone from the Builder view; "12 to review" is on the Validate menu |
| Panels rail | ✅ icon rail on the canvas's left edge |
| In-canvas controls | ✅ one 40px row; hint behind "?" (auto-shown once) |
| Inspector at ≥ 1680 | ✅ docked beside the canvas (1920: canvas 1546 + inspector 340) |
| Focus canvas | ✅ fills the window (1920×1080 and 2560×1440), no scroll |
| Zoom sharpness | ✅ `will-change` is `auto` when idle and `transform` during a wheel zoom; pan offsets are whole pixels |
| OV-2 | ✅ site rows (Sydney, Melbourne, Cloud · AWS), Platform and Security operations frames; role names; ID chips; arrowheads; inferred alerts-and-response and licence needlines; the shared transport formatter ("HTTPS HEC 8088 · TLS", "S2S TCP · TLS"); derived resource and activity values; a Needlines column in the nodes table; 1200-wide drawing at 1:1 |
| OV-3 | ✅ one scrolling matrix on screen (18 columns, sticky Flow/Resource), one control bar with chips, large summary figures, compact grid (34×30 cells) with legend and node list, readable hover (fixes the navy-row bug), `aria-expanded` on rows, "(derived)" values |
| OV-1 | ✅ SOAR no longer "not connected" |
| Mobile | ✅ lanes, OV tab, no horizontal scroll |

---

## 1. P1: the merged header row overflows between 1440 and 1919px

**Now:** at ≥ 1440 the builder head and plane bar merge into one row. The row only fits from about 1920px:

| Width | Plane toggles | Group by |
|---|---|---|
| 1280 | ✅ one row (two-row layout) | ✅ visible |
| 1440 | **stacked vertically:** "Event data" at y 24 (inside the view tabs), "Interactive authentication" at y 88 (behind the canvas top at 93) | **under the Navigate menu** (x 571) |
| 1680 | "Event data" and "Fleet management" at y 40 (in the tabs), "Interactive authentication" behind the canvas | under the menus |
| 1920+ | ✅ one row | ✅ |

**Fix:**
- **Switch to the merged row only when it fits.** Measure with a `ResizeObserver` on the header: if the merged row's content width is more than its box, use the two-row layout (which works at 1280). Don't use a fixed breakpoint.
- **Never wrap inside the plane-toggle group** (`flex-wrap:nowrap` on the group); let whole groups move to the second row instead.
- **Optional:** use compact plane toggles at 1440–1919 ("Data", "Fleet", "Auth" with the line swatch; full names in `title`).
- **Keep the "Use in explorer" label whole** ("Use in explo…" now), or shorten it to "Use".

**Check** (add to the space tool): at 1280, 1440, 1680, 1920 and 2560:
- no header control intersects another control, the view tabs or the canvas;
- all three plane toggles and Group by are fully visible (their rectangles are inside the header and not covered: test with `document.elementFromPoint` at each control's centre);
- the canvas top is ≤ 150px.

## 2. OV-2 draws needlines from a node to itself

**Now:** with the reference topology, the Syslog Server and the Universal Forwarder of a site are both in that site's "Site collection" node, so the Syslog Server → UF file handoff becomes **N2 ON-2 → ON-2** and **N5 ON-4 → ON-4**. Their pills overlap N3 and N9/N10, and the grid gets a diagonal cell. The same happens in the 3-UF + Deployment Server test topology.

**Fix:** a flow whose producer and consumer are the same operational node is **internal**:
- no needline, no pill and no grid cell;
- keep it in the register and in OV-3 with Needline "— (internal to ON-2)" and Producer → Consumer "ON-2 (internal)";
- mention it in the node's row ("Internal: file handoff Syslog Server → UF").

Renumber the needlines after removing them.

**Check:** no needline has the same from and to; the pill-overlap count on OV-2 is 0 (11 pairs now: N2/N3, N2/N9, N5/N9, N5/N10, N7/N8, N9/N10, N13/N14, N13/N15, N13/N16, N14/N16, N15/N16). The last six are around Search and detection; spread pills along their own paths as in `builder-handoff-ov2-diagram.md` item 4.

## 3. OV-3 on screen: two visible bugs

- **Sticky columns cover the Producer column.** The second sticky column (Resource) is wider than its `left` offset allows, so it covers the first ~6px of the Producer Node column: the header reads "ODE", and the cells "Sydney event sources" and "Indexing service" lose their first letters. Set the Resource column's `left` to the Flow column's **measured** width (read it after layout, and on resize), give both sticky columns fixed widths (Flow 88px, Resource 200px), and add a 1px right-edge shadow on the Resource column.
- **Plane chips show the label twice:** "Event dataEvent data", "Fleet managementFleet management", "AuthenticationAuthentication", "Alerts and responseAlerts and response". The swatch element carries text as well as the label. Make the swatch an empty `<i aria-hidden="true">`.

**Check:** at scroll 0 no Producer cell text is covered (compare the text's bounding box with the Resource column's right edge); each plane chip's text equals its label once.

## 4. OV-2 and OV-3 values still breaking the rules

With the reference topology:
- **Periodicity and Timeliness identical:** RF-10 and RF-11 "Per sign-in / per sign-in"; RF-07 "On demand / on demand" (with Volume also "on demand"). Timeliness for SAML: "≤ 5 s"; for search: "≤ 10 s (p95)" or "Not set"; Volume for search: "n/a (results, not ingest)".
- **Alerts and response:**
  - RF-12 and RF-13 show Periodicity "On demand" and Trigger "Request (default)"; notable events are event-driven, so use Trigger "Event" and Periodicity "Near real time".
  - RF-14 shows Periodicity "Event" (the trigger value leaking into the wrong column); use "Per case".
- **Inferred management flow RF-08:** Periodicity "On demand" should be "5 min". Transport shows the description "licence usage and health (inferred)"; use "Internal logs · REST 8089 (inferred)". The producer and consumer activities are both "Manage capacity and licence"; the producer's should be "Report usage".
- **SAML transport repeats:** "SAML 2.0 · TLS · SAML SSO". Drop "SAML SSO" when "SAML 2.0" is present.
- **Volume notation:** "≈ <1 GB/day" should read "< 1 GB/day".
- **Availability:** 99.9% on authentication rows; show it only when set on the connection (event data inherits the event-path SLO).
- **Platform management location:** "Multisite", although the Deployment Server, License Manager and Monitoring Console are all in Sydney. Use the members' common region; "Multisite" only when they differ.

**Check:** the value rules in `builder-handoff-ov3-matrix.md` item 4, applied to all 14 rows of the reference topology.

## 5. OV-1: still open from the Build 137 list

Compare `ov1-build141.png` with `ov1-mockup.png`:
- **Zone heading covered (Build 137 item 1):** "ENTERPRISE SITES & CLOUD" is still under the Sydney box.
- **Thread markers stacked (item 2):** 2, 4, 1 and 6 are still stacked in the Sites → Collection gutter; 2, 4 and 6 belong beside their own lines.
- **Tags on box borders (item 3):** "licence usage and health · TLS" and "phone-home · 8089 · TLS ×2" cross the Indexing and Management box borders; "S2S · · TLS" has an empty part (`· ·`).
- **Line through a card (new):** a response-coloured line runs vertically through the Authentication Provider card between User / Administrator and Splunk SOAR. The dotted authentication arrow from User to the IdP is drawn as a small orange star. Route response lines around cards, and draw the authentication arrow as a dotted line with an arrowhead.
- **Wording (item 5):**
  - "AWS · AWS ap-southeast-2";
  - License Manager and Monitoring Console "not connected";
  - grammar: "AWS Lambda deliver", "Search Head run";
  - "29 Sept 2026".
- **Legend thread sample (item 6):** still the pill with "ⓝ".

## 6. OV-2 legend layout

The OV-2 legend draws each line sample inside a long empty pill (about 400px wide) with the label far to the right. Use the OV-1 legend layout: 36px sample, 8px gap, label.

## 7. Canvas text and Fit (from the zoom-sharpness spec)

- The smallest canvas text is still **10.5px** (target 11.5px, spec item 4).
- Fit on the default topology at 1440×900 lands on **103%**. Snap to 100% when within ±3% (spec item 3, currently just outside).
- **Manual check still owed:** in desktop Chrome with GPU on, zoom to 180% and confirm that text and 1px borders are crisp. Headless tests can't show this.

## 8. Connectors (carried over)

- In Group by = None with 3 UFs + Deployment Server, "Syslog Server → Universal Forwarder 3" still has its **label over a node**.
- **New in 141:** in Tier lanes and Component type, the Deployment Server → UF 1 and UF 3 badges sit **over a label** (both were OK in 137).
- Add scenario 9 (fan-out 1 → 3, run in None, Tier lanes and Component type) to `tools/builder-connector-check.js`, and upload `tools/` with `index.html`.

## 9. Small

- The rail's Review findings label is cut off ("Review findings· 12 to r…"); also there's a missing space before "·".
- Mobile OV: the first page still starts at y 432 (target < 400).

---

## How to verify
1. 0 `pageerror` events at 1280/1440/1680/1920/2560 and 390, and across resizes.
2. `node tools/builder-space-check.js index.html shots/`: all `meetsTarget: true`, **plus the header check from item 1** at 1680 as well.
3. `node tools/builder-connector-check.js index.html shots/`: all OK, including scenario 9.
4. Button sweep (185 now) and grouping sweep: 0 errors.
5. OV tab with `docs/mockups/ov1-reference-topology.json`: OV-1/2/3 screenshots against the mockups; no self-needlines; no pill overlaps; no covered Producer text; single chip labels.
6. Pack: OV-1/2/3 on by default, 9.5pt print tables, OV-3 split into tables in print only.
7. A `changeRegister` entry per new block.

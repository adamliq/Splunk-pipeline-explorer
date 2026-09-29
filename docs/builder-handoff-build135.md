# Builder handoff: Build 135 review

> **Superseded by [`builder-handoff-build137.md`](builder-handoff-build137.md)** (Build 137 review: items 1–12 are fixed or nearly so; the remaining work is listed there). Kept as the Build 135 review record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `3e539ea` (Build 135, 29 Sep 2026: `builder-grouping-polish-v131`, `builder-ov1-v132`, `builder-ov2-v133`, `builder-ov3-v134`, `builder-ov-workspace-v135`), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build131.md` (the task list this build implements: items 1–5 and the OV-1/OV-2/OV-3 specs in items 7–9) and earlier.
**Tool:** `node tools/builder-connector-check.js index.html [screenshot-dir]` (Playwright/Chromium).
**Mockups (reference for the OV pages):** `docs/mockups/architecture-ov1-mockup.html`, `architecture-ov2-mockup.html`, `architecture-ov3-mockup.html`.

## TL;DR

- **Big step forward.** The Build 130 P0 is fixed, Group by works in every mode, and all three operational views exist: in the architecture pack and in a new **OV** tab (a read-only workspace). The data model is right: node, needline and flow IDs match across OV-2 and OV-3, multi-consumer flows work, regions split nodes, and every new field survives export → re-import.
- **0 errors** everywhere (load at 4 sizes, resize, 183 Builder buttons, all six Group-by modes, OV tabs and filters, pack export). Connector check: 8 of 8 scenarios OK.
- **The OV tab has two layout bugs that break it visually** (items 1 and 2): OV-2's table pages leak into every tab, and every table's header row is drawn on top of its second row. Both have a small, specific cause and fix below.
- Then: OV-3 columns crushed (3), OV-3 off by default in the pack (4), wrong per-flow volume (5), and diagram layout and polish (6–12).
- From the Build 131 list, items 1, 2 and 4 are done; 3 and 5 are mostly done (item 13).

**Suggested order:** 1 → 2 → 3 → 4 → 5, then 6–13.

## Rules for every future build

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v135`).
- **Never redeclare a top-level `const`, `let` or `function` name** (all classic scripts share one global scope). Suffix new names with the block number. The next block is `…-v136`.
- Move existing DOM elements rather than recreating them; layout code must be idempotent.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- Use one form for keys (lowercase key + separate display label).
- **New for pages inside the app** (the OV tab, the pack preview): the app's base CSS applies to them. In particular `th{position:sticky;top:75px}` (line 28) and the dark `input` styles. Reset what you don't want inside your own root (see item 2).
- Before uploading: zero `pageerror` events at 1440×900 and 390×844, the grouping sweep, `tools/builder-connector-check.js`, one pack export, **and open the OV tab and click all three sub-tabs** (see "How to verify").

---

## Verified in Build 135

| Area | Result |
|---|---|
| Load, resize, buttons, connectors | ✅ 0 errors at 1280/1440/1920/390 and across 1440→1000→700→1440; 183 buttons, 0 errors; connector check 8 of 8 OK while dragging and after drop |
| Previous item 1 (P0 Group-by crash) | ✅ fixed: all six modes, 0 errors, desktop and mobile |
| Previous item 2 (hidden Group-by) | ✅ "Group by" is now in the plane bar, and the Highlight row (chips, Collapse types with 3+, Expand all) shows above the canvas |
| Previous item 4 (mobile lanes) | ✅ at 390×844 with 3 UFs + Deployment Server, every lane contains its tier's nodes and no lanes overlap |
| Tier lanes (desktop) | ✅ every node inside its lane; counts correct (Forwarding · 3, Management · 1) |
| OV tab | ✅ new **OV** button after Builder; Refresh, Dark theme, Print / PDF, Download architecture pack, Edit in Builder; OV-1 / OV-2 / OV-3 sub-tabs; no horizontal scroll at 390 |
| Model: default topology | ✅ 4 operational nodes, 3 needlines, 3 flows (the item 8 acceptance check) |
| Model: 3 UFs + Deployment Server, UF 2 in Melbourne | ✅ 6 nodes (Forwarding split into Sydney and Melbourne); the Deployment Server's phone-home becomes one flow (RF-06) with two consumers; the grid's counts add up to the 7 flow–consumer pairs; the cross-region hop is flagged |
| OV-3 interactions | ✅ a row expands to "Realised by", the finding and "Traces to"; "Only to review" shows 3; a grid cell filters to 1 flow and shows the pair; Esc resets to 6 |
| OV-2 interactions | ✅ clicking N1 highlights N1, ON-1 and ON-2 |
| New fields | ✅ Resource exchanged, Activity supported, Trigger (Event (default) / Event / Schedule / Request / Sign-in) and Criticality on connections; Instances represented on components (visible in Component identity); mission statement. All survive `topologyDocument()` → `loadTopologyDocument()`, as do `flowClassification` and region |
| OV-1 | ✅ mission line shows when set; UF count uses instances ("Universal Forwarder · 153"); threads 1, 2, 5 appear only when present; key measures use instances for "Sending hosts" (154) |
| Pack (with OV-3 turned on) | ✅ 19 pages; contents in order OV-1, OV-2 ×3, OV-3 ×3, then inventory…; print table text 9.5pt; OV-3 split into two tables plus a grid page, with the Flow and Resource columns in both; filters hidden in print; the header rows render correctly in the pack (unlike the OV tab, item 2) |

---

## 1. P1: OV tab: OV-2's table pages appear under every tab

**Now:** OV-2 pages 2 and 3 ("Resource flows", "Operational nodes") are shown below OV-1 on the OV-1 tab, and again on the OV-2 and OV-3 tabs. The OV-2 panel holds only 1 sheet; the other two are outside any panel (`orphan: ov2-flows-1, ov2-nodes-1`), so hiding panels never hides them.

**Cause:** in `builderOvRender135` (v135), each page's content goes through
```js
page.content.replace('<svg class="ov1Diagram132"','<div class="ov1Figure135"><svg class="ov1Diagram132"')
            .replace(/(<\/svg>)(?![\s\S]*<\/svg>)/,'$1</div>')
```
The first replace only matches OV-1, but **the second runs on every page with an SVG**. On the OV-2 diagram page it adds a `</div>` with no matching opener, which closes the `<article>`/panel early, so the next two pages land outside the OV-2 panel.

**Fix:** only add the closing tag when the opening one was added:
```js
const content=page.content.includes('<svg class="ov1Diagram132"')
  ? page.content.replace('<svg class="ov1Diagram132"','<div class="ov1Figure135"><svg class="ov1Diagram132"').replace(/(<\/svg>)(?![\s\S]*<\/svg>)/,'$1</div>')
  : page.content;
```
(Better: wrap the figure in `builderOvPage132` itself, or with DOM methods after insertion, instead of editing HTML strings.)

**Check:** each `[data-ov-panel]` contains all its sheets (OV-1: 1, OV-2: 3, OV-3: 3); no `.ovSheet135` outside a panel; each tab shows only its own pages.

## 2. P1: OV tab: table header rows are drawn over the second row

**Now:** in every table in the OV tab (OV-2 resource flow register, OV-2 operational nodes, both OV-3 tables, the OV-3 producer × consumer grid), the first row is empty, and the dark header row sits **75px down, on top of the next data row**, hiding its text (for example the RF-01 finding "…must not cross this unencrypted handoff" is half covered; the ON-2 row is unreadable). In the grid, the row labels ON-2 and ON-3 stack in one row and the counts sit in the header. The downloaded pack is fine; it's only inside the app.

**Cause:** the app's base CSS (line 28) has `th{position:sticky;top:75px;background:#101e2b;…}`, meant for the Matrix view. Inside the OV tab, each table sits in an `overflow-x:auto` wrapper, which becomes the sticky container, so every `th` sticks 75px below the top of its wrapper.

**Fix:** reset it inside the workspace (and check the pack preview overlay `#builderPresentationOverlay`, which also lives inside the app, for the same problem):
```css
.ovWorkspace135 th{position:static;top:auto}
/* OV-3 keeps its sticky first two columns, horizontally only: */
.ovWorkspace135 .ov3Matrix134 th:nth-child(-n+2),
.ovWorkspace135 .ov3Matrix134 td:nth-child(-n+2){position:sticky;top:auto}
```
Also reset the base `th` colours if they don't suit the light theme.

**Check:** in the OV tab, every table's header row is its first row and no data row is covered; the grid shows ON-1…ON-n as row labels, one per row. Take a screenshot of each sub-tab at 1440 and 390.

## 3. P1: OV-3 matrix: the first two columns are crushed and overlap

**Now:** the fixed columns "Flow / needline" and "Resource exchanged" are about 30px wide, so their text breaks letter by letter ("FLO W / NEED LINE", "Resou rce excha nged", "revie w"), and in the OV tab, text from the second column overlaps the Producer column. The sticky columns have `position:sticky` but no `left` offset. The print version has the same narrow columns ("Resou / rce / excha / nged").

**Fix:** give the fixed columns real widths and offsets:
```css
.ov3Matrix134 th:nth-child(1),.ov3Matrix134 td:nth-child(1){min-width:76px;left:0;white-space:nowrap}
.ov3Matrix134 th:nth-child(2),.ov3Matrix134 td:nth-child(2){min-width:180px;left:76px}
```
Let the table be wider than its box on screen (`min-width` about 1100px, scrolling inside its wrapper). In print, keep `left:auto` and use `table-layout:fixed` with column widths such as Flow 9%, Resource 16%.

**Check:** no header or cell text breaks mid-word; scrolling the matrix sideways keeps Flow and Resource in view without overlapping other columns; same in the PDF.

## 4. OV-3 is off by default in the pack

**Now:** OV-1 and OV-2 default to on (`if(state.builderExport.sections.ov1===undefined)…=true`), but OV-3 has no default, so a fresh pack has no OV-3 pages.
**Fix:** in v134, add `if(state.builderExport.sections.ov3===undefined)state.builderExport.sections.ov3=true;` where the other defaults are set. Keep honouring a saved `false` from `exportPreferences.packSections.ov3`.
**Check:** on a fresh page, `architecturePackHtml()` contains the three OV-3 pages and the "OV-3 resource flow matrix" checkbox is ticked.

## 5. OV-3 "Volume" shows the whole topology's ingest on every flow

**Now:** every data flow shows "1244 GB/day modelled", which is the licensed ingest for the entire topology (the same figure as OV-1's "Licensed ingest" tile). `builderOv3Volume134(flow)` returns 1244 for RF-01 to RF-05.
**Fix:** per flow, sum the modelled daily volume of the **sources upstream of that connection** (walk `parent` links back to the sources, weight by `instancesRepresented`, and split evenly when a node forwards to several targets, unless the capacity model has a better split). Show "Not set" when the capacity model has no figure for those sources. Management and authentication flows show "Not set" unless a size is given.
**Check:** with the 3-UF topology, the three Syslog Server → UF flows add up to the Syslog Server's inbound volume, and no flow shows more than the total.

## 6. OV-2 diagram: truncated names, hidden pills, empty space

**Now (OV tab and pack):**
- The node boxes are narrower than their names: "ON-1 Site sources · Unspecifi", "ON-2 Site collection · Unspec".
- Needline pills sit under the next node box ("N1 · RI", "N2 · RI", "N3 · RI").
- The figure is about 350px tall, but the content uses only the top 90px.

**Fix:**
- Size each node box to its longest line (measure with `getComputedTextLength`, or wrap the name onto two lines at about 26 characters).
- Make the gap between columns at least the widest pill + 24px, and centre each pill in the gap between its two nodes.
- Set the SVG `viewBox` height from the lowest node or frame + 24px.

**Check:** no text in the OV-2 SVG is clipped (compare each text's bounding box with its box); every pill is fully visible and doesn't overlap a node; no more than 40px of empty space under the lowest frame.

## 7. OV tab: OV-2 legend and footer run together

**Now:** below the OV-2 diagram in the OV tab, the legend reads "━ Event data┄ Fleet management·· Authentication━ Alerts and response⚠ To reviewNode / Location frame", and the footer reads "Security telemetry + PIIGenerated from Builder topology", unstyled and in large text. The pack version is fine, so the OV tab is missing the pack's CSS for `.ov2Legend133` and the OV-2 footer.
**Fix:** load the same OV-2 page CSS in the workspace (or scope the pack CSS so both use it).
**Check:** the legend items are spaced and in the legend style; the footer matches OV-1's (banner text left, "Generated from Builder topology" right).

## 8. OV-1 graphic: layout

> **Full spec now in [`builder-handoff-ov1-diagram.md`](builder-handoff-ov1-diagram.md)** (a comparison with the mockup, and a visual rework of the whole diagram). The points below are a subset; follow that file.

**Now (default and 3-UF topologies):**
- All four zones are about 320px tall, while their contents use the top 100px.
- "People and response" is drawn empty when the topology has no such components.
- Connector labels collide with cards: "TCP/TLS or…" is cut at the Syslog Server card, "File handoff ×3" is hidden behind the UF card, and "phone-home · TLS · 8089" is behind the Deployment Server.
- The dashed Management box overlaps the Indexer card.

**Fix:**
- Size the zones to their content (with a minimum of about 140px).
- Omit a zone with no components, or draw it at minimum height with the muted text "None in this topology".
- Put connector labels in the gutter between zones (stacked when several lines share a gutter), not on the line where it enters a card.
- Place the Management box below the platform cards, with a 12px gap.

**Check:** no label overlaps a card or another label (same rule as the connector tool); no zone has more than 60px of empty space below its last item.

## 9. Criticality options don't match; per-flow Classification has no control

**Now:**
- The Criticality dropdown offers Critical / High / Medium / Low and has **no "Not set" option**, so it can't show an unset value. The spec, the OV-3 chips and the mockup use Mission critical / Essential / Routine.
- `flowClassification` exists in the data (it round-trips and OV-2 shows it), but the connection inspector has **no Classification control**.

**Fix:** Criticality options: "Not set" (the default, empty value), Mission critical, Essential, Routine. Map any saved Critical/High → Mission critical, Medium → Essential, Low → Routine when loading. Add a Classification dropdown next to Criticality: "Same as pack (<pack classification>)" first, then the pack's classification values.
**Check:** a new connection shows Criticality "Not set" and OV-3 counts it as not set; choosing a classification changes the OV-2 and OV-3 cells; both survive re-import.

## 10. "To review" mixes security findings with open questions

**Now:** OV-2 and OV-3 flag a flow for any finding, including open questions such as "Universal Forwarder 1 → Indexer 1 needs receiver port or TLS confirmation". On the default topology, 2 of 3 flows show ⚠. The spec (item 8, "Flows to review") only flags **security** findings.
**Fix:** flag a flow with ⚠ and the review colour only for security findings (unencrypted PII, crossing regions without TLS, authentication required but no type). List open questions in the OV-3 row detail as "Open questions", count them in "attributes not set", and leave them unflagged.
**Check:** default topology: only RF-01 (syslog without TLS) is flagged.

## 11. Mobile: the OV header takes a third of the screen

**Now:** at 390×844, the OV header plus buttons is 256px tall, and the first page starts at y 589.
**Fix:** on narrow screens, put the five actions in one "Actions ▾" menu (keep "Edit in Builder" visible), shorten the subtitle, and make the tab row sticky.
**Check:** at 390×844 the first page starts above y 400.

## 12. Polish

- Page counters say "OV1 · 1 / 1", "OV2 · 2 / 3" (from `key.toUpperCase()`). Use "OV-2 · 2 of 3".
- Dates show "September 29, 2026"; the rest of the app uses "29 Sep 2026".
- OV-3 filter labels are lowercase keys ("data management authentication response", "exchange performance assurance security"). Use "Event data", "Fleet management", "Authentication", "Alerts and response" and "Exchange", "Performance", "Assurance", "Security", with the line-style swatch on the plane chips as in the mockup. The Plane cell also shows "data"; use the label.
- The OV-3 search box is dark (`rgb(8,19,29)`) on the light workspace. Style it from the workspace theme tokens.
- OV-1 grammar: "1 relationships", "Syslog Source · 1 instances represented". Pluralise.
- Management flows show Timeliness "Not set"; use the poll interval (for example "60 s poll"), as the spec says.
- OV-1 has 6 text elements under 10px (the key-measure captions). Use at least 11px on screen.
- The OV tab opens in the light theme even when the system is dark. Start from `prefers-color-scheme` and remember the toggle.

## 13. Carried over from Build 131 (partly done)

- **Fan-out connectors (was item 3):** stubs now spread along the card border (better), but labels still collide. With 3 UFs + Deployment Server: in None, "Syslog Server → UF 3" has its **label over a node**, and all three Deployment Server → UF lines have their **badge over a label**. In Tier lanes and Component type, the Syslog Server → UF 1 and UF 3 labels sit over nodes. `tools/builder-connector-check.js` still has no scenario 9. **Add it** ("fan-out 1 → 3", run in None, Tier lanes and Component type) and make it pass.
- **Type-box headers (was item 5):** the header chip now sits inside the box (13px from the left edge), but a short piece of the dashed border still shows at the chip's left end. Give the chip a background that matches the canvas, with 6px of padding on both sides.
- **Optional (was item 6):** lock icon and the "required but no type" finding. Not re-checked.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. Grouping sweep: switch `#builderGroupBy130` through all six options in auto/horizontal and free layout, with the default topology and 3 UFs + Deployment Server. Expect 0 errors and every node inside its lane (desktop and mobile).
3. `node tools/builder-connector-check.js index.html shots/`: every scenario `OK`, including the new scenario 9.
4. Button sweep of `#topologyBuilder`: 0 errors, and a visible effect for every button.
5. **OV tab:** open OV, click OV-1, OV-2 and OV-3 at 1440 and 390 in both themes. Each panel holds only its own sheets (item 1); every table's header is its first row (item 2); no horizontal page scroll; the OV-3 filters, row detail, grid-cell filter and Esc work.
6. Architecture pack with every section on (OV-3 on by default): contents order, 9.5pt print tables, OV-3 split tables, and 0 errors. Compare the OV pages against the mockups.
7. Add a `changeRegister` entry for each new block.

# Builder handoff: Build 137 review

> **Superseded by [`builder-handoff-build141.md`](builder-handoff-build141.md)** (Build 141 review). Kept for reference.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `fffb43f` (Build 137, 29 Sep 2026: `builder-ov-review-v136`, `builder-ov1-visual-v137`), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build135.md` and `builder-handoff-ov1-diagram.md` (the task lists this build implements). This file replaces both as the task list.
**Tool:** `node tools/builder-connector-check.js index.html [screenshot-dir]`.
**References:** `docs/mockups/architecture-ov1-mockup.html`, `docs/mockups/ov1-reference-topology.json` (load with `loadTopologyDocument`), and side-by-side images `docs/mockups/compare/ov1-mockup.png`, `ov1-build135.png` and **`ov1-build137.png`** (now).
**OV-2 rework:** [`builder-handoff-ov2-diagram.md`](builder-handoff-ov2-diagram.md): a comparison with the OV-2 mockup and a full spec for the page (layout by site, needlines, pills, response needlines, naming, one transport formatter, derived defaults). Do it after items 1–6 below.
**OV-3 rework:** [`builder-handoff-ov3-matrix.md`](builder-handoff-ov3-matrix.md): a comparison with the OV-3 mockup (including a P1 row-hover bug that makes text unreadable) and a spec for one on-screen matrix, filter chips, correct per-plane values and a compact grid. Do it after the OV-2 rework.
**Canvas space (Build 138 check):** [`builder-handoff-canvas-space.md`](builder-handoff-canvas-space.md): give the Builder canvas the whole desktop screen (full width, window height, chrome above ≤ 150px, docked panels on wide screens); measured by `tools/builder-space-check.js`.
**Zoom sharpness (Build 138 check):** [`builder-handoff-zoom-sharpness.md`](builder-handoff-zoom-sharpness.md): canvas text and shapes blur when zoomed because `#builderTree` has a permanent `will-change: transform`; fix plus pixel snapping and minimum text size.

## TL;DR

- **Excellent build.** Every P1 from the Build 135 review is fixed, and the OV-1 rework closes most of the gap to the mockup: cards with pictograms, curved arrowed connectors in four styles, a title block, a mission callout, thread sentences written from the model, legend samples and large key measures.
- **0 errors** everywhere: load at 4 sizes, resize, 183 Builder buttons, all six Group-by modes, the OV tab (desktop and mobile), pack export, and re-import. Connector check: 8 of 8 OK.
- **What's left is polish, mostly on OV-1** (items 1–6), plus a few small items (7–12). No P0 or P1.

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v137`). The next block is `…-v138`.
- Never redeclare a top-level `const`, `let` or `function` name; suffix new names with the block number.
- Pages inside the app inherit the app's base CSS (sticky `th`, dark inputs); scope resets to your own root.
- Before uploading: 0 `pageerror` events at 1440×900 and 390×844, the grouping sweep, the connector tool, one pack export, and all three OV tabs.
- **If you change `tools/`, upload it too.** Only `index.html` has been uploaded so far, so the tool still lacks scenario 9 (item 8).

---

## Verified in Build 137

| Build 135 item | Result |
|---|---|
| 1. OV-2 pages leaking into every tab | ✅ each panel holds its own sheets (1 / 3 / 3); no orphans |
| 2. Header rows drawn over the second row | ✅ `th` is static in the OV tab; every table's header is its first row; the grid is correct |
| 3. OV-3 crushed columns | ✅ Flow and Resource columns are readable; sticky scroll works |
| 4. OV-3 off by default | ✅ a fresh pack includes the three OV-3 pages |
| 5. Volume per flow | ✅ split across branches: default chain 1244 → 1244; with 3 UFs, 1244 → 415 per branch |
| 6. OV-2 diagram | ✅ names on two lines; pills in the gutters and visible; figure height fits the content |
| 7. OV-2 legend and footer in the OV tab | ✅ styled |
| 8. OV-1 layout | ✅ largely done (see items 1–6 for what remains) |
| 9. Criticality and Classification | ✅ "Flow criticality" (Not set / Mission critical / Essential / Routine) and "Flow classification" ("Same as pack (…)" + levels); old values are mapped |
| 10. To-review flags | ✅ default topology: only RF-01 (syslog without TLS) is flagged |
| 11. Mobile OV header | ✅ "Actions ▾" menu + Edit in Builder; header 195px (was 256), first page at y 432 (see item 11) |
| 12. Polish | ✅ "OV-2 · 1 of 3"; proper plane and column-group labels; "Event data" in the Plane cell; light search box |
| Group by, lanes, mobile lanes | ✅ no errors; every node in its lane at 1440 and 390; Tier lanes and Component type connectors all OK |
| New fields round-trip | ✅ resource, activity, trigger, flow criticality, flow classification, instances, mission and region survive export → re-import |
| Pack print | ✅ tables 9.5pt; OV-3 split into two tables; filters hidden |

---

## OV-1: what's left against the mockup

Load `docs/mockups/ov1-reference-topology.json`, open OV → OV-1, and compare with `docs/mockups/compare/ov1-mockup.png`. The numbers refer to `ov1-build137.png`.

### 1. The Sites zone heading is covered
"ENTERPRISE SITES & CLOUD" is drawn under the top of the "Sydney · site 1" box, so it appears struck through. The other zones are fine.
**Fix:** start the first sub-box in every zone at the same offset below the heading (about 34px, as in Collection & forwarding).
**Check:** every zone heading's bbox is clear of every box.

### 2. Thread markers are in the wrong places
Markers 1, 2, 4 and 6 are stacked in the Sites → Collection gutter, on top of the lines and the "syslog" tags. Marker 2 (Forward) belongs on the UF → Indexers line in the Collection → Platform gutter; 4 (Search and detect) beside the Indexers → Search Head line; 6 (Authenticate) beside the SAML line in People & response. It looks as if every marker falls back to the first gutter.
**Fix:** anchor each marker on its own thread's first bundle (the per-thread anchors in `builder-handoff-ov1-diagram.md` item 6), 14px off the line on the side away from its tag. Only if the thread has no line, place it beside its first card.
**Check:** with the reference topology, markers 1, 2, 4, 5, 6 and 7 are each within 30px of a line of their own thread; no marker overlaps a tag, another marker or a line junction.

### 3. Some flow tags sit on box borders
- "S2S · TLS" sits on the top border of the Indexing box.
- "Search dispatch · TLS" and "phone-home · TLS · 8089 ×2" cross the Indexing box's bottom border.
- The second "phone-home · TLS · 8089" sits on the Management box's top border.

**Fix:** place tags in a gutter, or in the clear band between two sub-boxes, never across a box edge. Use the same bbox test as for cards, and include sub-box borders as obstacles.
**Check:** no tag bbox intersects any box border.

### 4. Two arrowheads meet at the same point on the UF card
The S2S line leaves the UF card's right edge where the Deployment Server's dashed line arrives, so a start and an arrowhead overlap.
**Fix:** spread endpoints on a shared card side by 8–10px (as in `builder-handoff-ov1-diagram.md` item 4), with outgoing and incoming lines on different slots.
**Check:** no two connector endpoints on the same card are within 6px of each other.

### 5. Card and sentence wording
- **"AWS · AWS ap-southeast-2":** the cloud name is repeated. Use "AWS · ap-southeast-2" (strip the provider prefix from the region).
- **People card "≈12 instances":** say "≈12 people" (or the role, for example "SOC analysts · 24×7" when roles are set).
- **"not connected" is misleading in two cases:**
  - Splunk SOAR shows "not connected" although thread 7's line reaches it. Base the flag on the drawn lines (any plane), not only on data parents.
  - License Manager and Monitoring Console don't need a relationship to do their job. Show their role ("licence tracking", "health monitoring") instead of flagging them.
- **Thread sentences:** fix the grammar ("AWS Lambda deliver" → "delivers", "Search Head run" → "runs") and leave unconnected components out of thread 1 ("Syslog sources, Windows servers send…" lists the unconnected Windows servers).
- **Dates:** "29 Sept 2026" (the `en-GB` locale's month). The app uses "29 Sep 2026", so format with a fixed month-abbreviation list.
- **Key measures:** "≈ 1,244 GB/day modelled" repeats the approximation. Use "≈ 1,244 GB/day" with the caption "licensed ingest (modelled)".

### 6. Legend thread sample
The thread sample is a pill with "ⓝ" in it. Draw the same 22px circle with "n" used on the graphic.

---

## Other items

### 7. Two criticality fields next to each other
The connection inspector now has **"Criticality"** (Critical / High / Medium / Low, the existing connection field, default "High") directly next to **"Flow criticality"** (Not set / Mission critical / Essential / Routine, the new OV-3 field). Users won't know which to set.
**Fix (choose one):**
- Rename the old one "Business impact" (or "Connection criticality") and add a one-line hint under each.
- Or derive the flow value from the old one when it's not set (Critical/High → Mission critical, Medium → Essential, Low → Routine), shown as "(from Criticality)", and keep only one control visible.

### 8. Fan-out: one label still over a node; scenario 9 not in the tool
With 3 UFs + Deployment Server in Group by = None, "Syslog Server 1 → Universal Forwarder 3" still has its **label over a node**. The Deployment Server badges and the Tier/Type modes are now all OK. Add scenario 9 ("fan-out 1 → 3", run in None, Tier lanes and Component type) to `tools/builder-connector-check.js`, **upload the tool**, and make it pass.

### 9. OV-3 headers and cells break mid-word
"AUTHENTICATI ON", "CLASSIFICATIO N", "acknowledgem ent". Give those columns a `min-width` that fits the header word (about 120px), use `overflow-wrap:normal; word-break:normal` with `hyphens:auto`, and let the table scroll inside its wrapper.

### 10. OV-2 pill details
The "⚠" on the flagged pill "N1 · RF-01 ⚠" overlaps the pill's right border; size the pill to include the glyph. On the default topology, the N2 pill sits below its line rather than on it; centre each pill vertically on its line.

### 11. Mobile OV: first page still starts at y 432
Target: above 400. Make the summary line a single scrollable row, or tuck it under Actions.

### 12. Review flag for cross-region hops (question)
In Build 135, "Syslog Server → Universal Forwarder 2 crosses regions without confirmed TLS" was flagged; in 137 it isn't (the flag only counts security findings now, which is right). If crossing regions without TLS is meant to be a security finding, classify it as one; otherwise leave it as an open question. Decide and note it in the rules.

---

## How to verify (run before every upload)
1. 0 `pageerror` events at 1280/1440/1920/390 and across a resize.
2. Grouping sweep (six modes × auto/free × default and 3-UF + DS topologies): 0 errors; nodes inside lanes.
3. `node tools/builder-connector-check.js index.html shots/`: every scenario OK, **including scenario 9**.
4. Button sweep of `#topologyBuilder`: 0 errors.
5. OV tab with the default topology and `ov1-reference-topology.json`: all three sub-tabs at 1440 and 390, both themes; compare OV-1 with `compare/ov1-mockup.png` (items 1–6).
6. Pack: OV-1/2/3 on by default, 9.5pt print tables, 0 errors.
7. A `changeRegister` entry for each new block.

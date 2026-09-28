# Builder handoff: tasks for Build 131

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** `main` at `44f1086` (Build 130, 29 Sep 2026), also merged into branch `claude/build-page-layout-bl6jk1`. There is no newer build; this is a new version of the task list, not a new review.
**History:** `builder-handoff-build130.md` (the Build 130 review these items come from) and earlier.
**Tool:** `node tools/builder-connector-check.js index.html [screenshot-dir]` (Playwright/Chromium).
**Mockups:** `docs/mockups/builder-grouping-mockup.html` (Group by), **`docs/mockups/architecture-ov1-mockup.html` (the new OV-1 page, item 7)** and **`docs/mockups/architecture-ov2-mockup.html` (the new OV-2 page, item 8)**. All are standalone; open them in a browser.

## TL;DR

1. **P0 first:** Group by → Tier lanes / Component type crashes in the normal layout. A tested one-line fix is in item 1.
2. **Items 2–6:** smaller Group-by, connector and mobile issues, plus optional authentication extras, carried over from the Build 130 review.
3. **Item 7 (new feature): an OV-1 High-Level Operational Concept page** in the architecture pack, generated mostly from data the Builder already holds, with three new optional fields.
4. **Item 8 (new feature): an OV-2 Operational Resource Flow page** (operational nodes, needlines, a resource flow table and an operational node table). It reuses item 7's tier and region grouping and adds three optional per-connection fields.

Suggested order: item 1, then 2–5, then item 7, then item 8 (6 is optional).

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v130`).
- **Never redeclare a top-level `const`, `let` or `function` name** (all classic scripts share one global scope). Suffix new names with the block number.
- One version number per block; the next is `…-v131` (for example `…-v131` for the fixes and `…-v132` for the OV-1 page; keep the build stamp on the highest).
- Move existing DOM elements rather than recreating them; layout code must be idempotent.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- **Use one form for keys.** When a value is both a lookup key and a display label (like tier names), keep a lowercase key and a separate label: `{key:'sources', label:'Sources'}`. Never look a map up with its display label. This is exactly how the P0 happened.
- Before uploading: zero `pageerror` events at 1440×900 and 390×844 after clicking **Builder**, **then switch Group by through every option**; run `tools/builder-connector-check.js`; export the architecture pack once.

---

## Baseline: verified in Build 130

| Item | Result |
|---|---|
| Load, resize, button sweep, connector check | ✅ 0 load errors; 183 buttons with 0 errors; 8 of 8 connector scenarios OK while dragging and after drop (default grouping "None") |
| Previous item 1: authentication summary | ✅ Unknown/Not specified → "not specified"; Unknown/Mutual TLS → "Mutual TLS certificate · requirement unknown"; Unknown/Not applicable → "not applicable"; Yes/Not specified or Not applicable → "required · type not set"; Yes/Mutual TLS → "Mutual TLS certificate · required"; No/Not specified or Not applicable → "not required"; No/Mutual TLS → "Mutual TLS certificate · not required" |
| Group by: control | ✅ `#builderGroupBy130` with None / Tier lanes / Component type / Region / Environment / My containers, in the Navigate row. ⚠️ See item 2 |
| Group by: Region / Environment / My containers / None | ✅ render with no errors |
| **Group by: Tier lanes / Component type** | ❌ **P0 crash** (item 1) |

**With the item 1 fix applied** (tested on a scratch copy, using a topology with 3 Universal Forwarders fed by one Syslog Server and managed by one Deployment Server):

| Acceptance check (from the Build 128 handoff) | Result |
|---|---|
| No errors in any mode | ✅ 0 `pageerror` events across all six options, both topologies |
| Tier lanes: nodes in the correct lanes, counts match | ✅ Sources 1, Collection 1, Forwarding 3, Indexing 1, Management 1 (Deployment Server); no node outside its lane |
| Free layout: positions unchanged; lanes drawn behind | ✅ `state.builderFreePositions` and the DOM positions are identical across None → Tier → Type → None; 7 lanes drawn in free layout |
| Component type: collapse Universal Forwarder | ✅ one summary node "Universal Forwarder ×3 · 1 region · 21 to review · Expand group"; UF cards hidden |
| Merged connectors | ✅ Syslog Server → UF and Deployment Server → UF merge to one line each with badge **3**; UF → Indexer shows 1; clicking a badge lists the member connections; merged lines start and end on card borders, with the arrow pointing in |
| Undo unaffected | ✅ `builderHistory.past` length unchanged by collapse or expand |
| Expand, Collapse types with 3+, Expand all | ✅ |
| Export | ✅ the "Current navigation view" SVG contains the collapsed "×3" view |
| Chips | ✅ Indexer dims every other type; Shift-click Universal Forwarder adds it; a plain click selects just that type |
| Persistence | ✅ `topologyDocument()` contains `"grouping":{"mode":"type","collapsedTypes":["uf"]}`; layout profiles and bookmarks include it; `loadTopologyDocument` restores it on a fresh page |
| Mobile: types with 3+ collapsed by default | ✅ `["uf"]` collapsed, 1 summary node; no horizontal scroll |

---

## 1. P0: Tier lanes and Component type crash in the normal layout

**Symptom:** choose Group by → **Tier lanes** or **Component type** in auto/horizontal layout. `TypeError: Cannot read properties of undefined (reading 'push')` is thrown from `unifiedBuilderPositions` (v130), and no lanes or type boxes are drawn. It only appears to work in free layout, because that path doesn't reposition nodes.

**Cause:** in `<script id="builder-grouping-v130">`:
- `builderTierNames130 = ['Sources','Collection','Forwarding','Processing','Indexing','Search']` (display labels);
- `builderTierOf130(node)` returns **lowercase** keys (`'sources'`, `'collection'`, …, `'management'`);
- `unifiedBuilderPositions` builds `const byTier=new Map([...builderTierNames130,'management'].map(tier=>[tier,[]]))` (capitalised keys), then calls `byTier.get(builderTierOf130(node)).push(node)` with the lowercase key, gets `undefined`, and throws. Only `'management'` matches.
- The same function also calls `byTier.get(tier)` with capitalised names (`builderTierNames130.forEach((tier,column)=>slots(byTier.get(tier))…)`), while the lane drawer compares `builderTierOf130(n)===tier.toLowerCase()`. **The code mixes both forms.** (Making `builderTierOf130` return capitalised names removes the crash but leaves the lanes empty, because the lane drawer expects lowercase.)

**Fix (tested):** make the tier map case-insensitive, one line:
```js
// was:
const byTier=new Map([...builderTierNames130,'management'].map(tier=>[tier,[]]));
// now:
const byTier=new (class extends Map{get(key){return super.get(String(key).toLowerCase())}set(key,value){return super.set(String(key).toLowerCase(),value)}has(key){return super.has(String(key).toLowerCase())}})([...builderTierNames130,'management'].map(tier=>[tier,[]]));
```
The cleaner long-term fix is one list of `{key, label}` pairs with lowercase keys everywhere and labels only for display, as in the rules above. Either way, **check that every `byTier.get(…)`, the lane filter and the mobile ordering use the same form.**

**Check:** switch Group by through all six options in auto/horizontal layout, with the default topology and with the 3-UF topology. The result must be 0 `pageerror` events, and every node inside its tier lane (lane counts equal to node counts).

## 2. The Group-by controls are hidden and they squeeze the Navigate row
**Now:** Group by, the highlight chips, "Collapse types with 3+" and "Expand all" all sit in the Navigate row inside the **collapsed "Find & navigate" dock panel** (v113), so nobody sees them by default. With the new dropdown, the row's controls are truncated at 1440: Group by shows "Componen…", the group containers dropdown "Group conta…", bookmarks "No bookmar…".
**Fix:**
- Make the grouping visible without opening the panel: show the current mode as a compact control in the plane bar (next to the Navigate/Build/Validate/Export menus), for example "Group: Tier lanes ▾", and keep the chips row directly above the canvas while a grouping mode or highlight is active.
- In the Navigate row, give the dropdowns a `min-width` that fits their longest option ("Component type", "Group containers", "No bookmarks"), and let the row wrap to a second line instead of truncating.
**Check:** at 1440×900 with the dock closed, the current grouping is visible and changeable in one click; no dropdown in the Navigate row shows truncated text.

## 3. Fan-out connectors overlap labels and cards (every mode)
**Now:** when one node feeds several (Syslog Server → Universal Forwarder 1, 2 and 3), the three connectors run through each other's labels (the "File handoff" label is visibly struck through) and two labels sit on UF cards. This happens with Group by = None as well. `tools/builder-connector-check.js` didn't catch it, because its scenarios only use a single chain.
**Fix:** for edges that share a source (or target), spread their stubs along the shared side (offset each anchor by about 16px), and place labels on the segment after the split, staggered so they don't overlap. If labels still collide, show one shared label ("File handoff ×3") on the common trunk.
**Tool:** add a scenario 9 to `tools/builder-connector-check.js`, "fan-out 1 → 3": Syslog Server feeding three UFs, with a Deployment Server managing all three. Run it in None, Tier lanes and Component type (expanded and collapsed).
**Check:** scenario 9 reports `OK` for every connector in every mode (no label over a card, no badge over a label, labels ≤ 12px from their line).

## 4. Mobile tier lanes are placed above the canvas
**Now:** at 390×844 with Tier lanes, the lanes are positioned at **negative y** (Forwarding at y −378, Collection −551, Sources −724, relative to the page), above the canvas, while the nodes stay in the canvas. Lane borders and labels pile up across the nodes, and several route labels ("Phone-home and app delivery") overlap.
**Fix:** in `builderGroupLane130`'s mobile branch, compute each lane's top from the **rendered** first node of that tier (in world coordinates), not from the running `prior` offsets. Make sure `unifiedBuilderPositions` (mobile stacked order) and the lane drawer use the same order and spacing.
**Check:** at 390×844, every lane box lies within the canvas world and contains its tier's nodes; no two lanes overlap.

## 5. Type-box headers overlap their box border
**Now:** in Component type mode, single-member boxes (for example "Syslog Source · 1 ▾") draw the header chip across the dashed box's left edge, leaving stray characters ("!", "(") at the left.
**Fix:** position `.builderTypeHeader130` inside the box with about 8px left padding and a background matching the canvas, so the dashed border stops behind the chip (like a fieldset legend).
**Check:** no header text or chip overlaps the box border; screenshot at 1440 and 390.

## 6. Optional (carried over)
- A small lock icon on a connection's canvas label when an authentication type is set (tooltip names the type).
- A review finding when "Authentication required = Yes" and "type = Not specified" (the review count is currently unchanged in that state).

---

## 7. New feature: OV-1 High-Level Operational Concept page in the architecture pack

**Mockup:** `docs/mockups/architecture-ov1-mockup.html` (example data: Sydney and Melbourne sites, AWS, a multisite indexer cluster). It's the visual and content reference. Its SVG is hand-drawn, so generate the real page from the model rather than copying coordinates.

### What the page contains (in order)
1. **Classification banners** at top and bottom (the pack's existing classification text), plus a **title block**: view name "OV-1 · High-Level Operational Concept Graphic", architecture title, scope, owner/author ("Not set" when empty), build number and prepared date.
2. **Mission line:** one sentence (new field, see below). Omit the line when empty; don't print a placeholder.
3. **Concept graphic** (SVG) with four zones, left to right:
   - **Sites and cloud:** one box per distinct component **region** (e.g. "Sydney data centre · site 1"), plus one box per cloud source family (AWS Lambda, Azure Function, …). Inside each box are that region's **source** components.
   - **Collection and forwarding:** collection and forwarding tiers (syslog relays, UFs, HF/HEC, Edge/Ingest Processor).
   - **Platform:** indexing and search tiers, with a nested **Management** box (Deployment Server, License Manager, Monitoring Console, cluster managers).
   - **People and response:** user/administrator components, identity providers and SOAR.
   Use the same tier lookup as Group by → Tier lanes (after the item 1 fix), so zones and lanes always agree.
4. **Collapse by type:** within each site box and zone, show one pictogram per component **type** with a count or "instances represented" figure ("Universal Forwarders · ≈165"), not one card per node. Reuse the Group by → Component type aggregation (v130), and the collapsed-group export (`withArchitectureExportScope`).
5. **Line styles by plane,** the same colours as the canvas: event data solid, fleet management dashed, interactive authentication dotted, plus **alerts and response** (search → SOAR, search → people) in a fourth colour. Merge parallel relationships between the same two aggregated shapes into one line.
6. **Flow tags** from relationship details, kept short: protocol · TLS · port · acknowledgement, and the authentication type where set (for example "S2S · TLS · 9997 · ACK", "SAML · MFA", "phone-home · 8089").
7. **Numbered operational threads** (circled numbers on the graphic, and a matching list below it), in this fixed order, each shown only when present:
   1 Collect (sources → collection), 2 Forward (collection → indexing), 3 Index and replicate (indexer cluster / multisite), 4 Search and detect (search tier), 5 Manage the fleet (management plane), 6 Authenticate (authentication plane), 7 Respond (SOAR).
   Each list item is one or two plain sentences, generated from the components and relationship details in that thread.
8. **Legend** (the four line styles and the thread marker) and **key measures** (6 tiles): availability SLO and latency SLO (from relationship details on the event path; show the strictest), licensed ingest (capacity model), copies across sites (indexer cluster settings), sending hosts and services (sum of "instances represented"), and items to review (review findings, in the review colour).
9. **Footer:** architecture title, owner, "Generated from Builder topology", and "Page n of N · OV-1".

### New optional fields
- **Mission statement:** one sentence in the pack options (`state.builderExport.ov1.mission`).
- **People and roles:** a small list in the pack options, each entry {name, coverage (for example "24×7"), notes}. It is shown in the People zone next to any user/identity components already in the topology.
- **Instances represented:** an optional number on source and forwarder components (Inspector → Component identity), used for the counts in step 4 and the "sending hosts" measure. Store it on the node, and include it in `topologyDocument()`, the inventory table and re-import.
All three are saved in the topology document and layout profiles. Empty values show as "Not set" in the pack's open-questions appendix.

### Pack integration
- Add **"OV-1 operational concept"** to the pack's Sections checkboxes, on by default. It goes straight after the cover, before the inventory, and appears in the table of contents.
- Light and dark themes via the pack's existing theme tokens. In the light theme, check that every text on the page background is ≥ 4.5:1 (the Build 128 rule).
- Print: the graphic fits one A4-landscape page at ≥ 9pt text; the numbered list may continue onto the next page.
- In the on-screen pack preview, hovering over or selecting a thread number highlights that thread's lines and list item, as in the mockup. This is optional in the downloaded HTML and absent in print.

### Acceptance check
- Default topology: the OV-1 page shows one site box ("Unspecified" region), zones with Syslog Source / Syslog Server / Universal Forwarder / Indexer, threads 1–2 only, 3 event-data lines, and review count 12. Nothing appears for planes or tiers that aren't present.
- The Build 130 test topology (3 UFs + Deployment Server): UFs shown as one "Universal Forwarder · 3" pictogram; thread 5 appears with a dashed line from Deployment Server to it, tagged "phone-home · 8089".
- Two regions: two site boxes, each containing only its own sources.
- Mission, people and instance counts show when set and are absent (or "Not set" in the appendix) when not; values survive export → re-import.
- Light theme contrast ≥ 4.5:1 for page text; the Chromium PDF has the OV-1 on page 2 with page numbers; 0 `pageerror` events while previewing and downloading.

---

## 8. New feature: OV-2 Operational Resource Flow page in the architecture pack

**Mockup:** `docs/mockups/architecture-ov2-mockup.html` (same example data as the OV-1 mockup). It's the visual and content reference. Its SVG coordinates and the `NEEDLINES`/`FLOWS`/`NODES` arrays in its script are hand-written sample data; generate the real page from the model.

**Idea:** OV-2 is the same topology seen one level up. **Operational nodes** replace components, **needlines** replace individual connections, and a **resource flow** table lists what each needline carries. OV-1 shows the concept; OV-2 is the table an assessor checks.

### What the page contains (in order)
1. **Classification banners and title block,** as on the OV-1 page, with the view name "OV-2 · Operational Resource Flow Description", and a one-line purpose: "Who exchanges what information with whom, to support which activity, and how it's protected."
2. **Diagram** (SVG):
   - **Location frames:** one per region; one "Cloud" frame for cloud source types and cloud identity/SOAR components; platform tiers that span several regions go in one **"Multisite"** frame. People and response components go in a **"Security operations"** frame.
   - **Operational nodes** (`ON-1`, `ON-2`, …): one per **tier × region** group, using the same tier lookup as Group by → Tier lanes (item 1 fix) and the same zones as OV-1. Management components (Deployment Server, License Manager, Monitoring Console, cluster managers) form one "Platform management" node per region. Each node box shows its ID, name, activity (from the tier, for example "Collect, buffer and forward") and a short "realised by" line.
   - **Default node names:** "<Tier label> · <Region>" (for example "Site collection · Sydney"), editable in the pack options (`state.builderExport.ov2.nodeNames[nodeKey]`, where `nodeKey` is `tier|region`).
   - **Needlines** (`N1`, `N2`, …): all connections between the same two operational nodes merge into one needline. Number them in pipeline order (sources → collection → indexing → search → people), then management, authentication and response. Line style by plane, the same as OV-1 (event data solid, fleet management dashed, authentication dotted, alerts and response in the fourth colour). Each needline has a pill with its ID and the IDs of its flows ("N1 · RF-01, RF-02").
   - A needline carrying a flagged flow (see "Flows to review") gets the review colour on its pill.
3. **Legend:** the four line styles, the review marker, and "Node" / "Location frame".
4. **Resource flows table** (the core of the page). One row per connection, or per distinct resource when a connection has several. Columns:
   | Column | Source |
   |---|---|
   | Flow ID (`RF-01`…) | Generated, in needline order |
   | Needline | Its needline ID |
   | From → To | Operational node IDs (a chain such as "ON-10 → ON-11 → ON-8" for authentication) |
   | Resource exchanged | **New field** (see below); "Not set" when empty |
   | Activity supported | **New field**; "Not set" when empty |
   | Transport and protection | Relationship details: protocol, port, TLS, acknowledgement, authentication type ("S2S TCP 9997 · TLS · indexer ACK") |
   | Timeliness | Latency SLO; poll interval for management flows; "on demand" for search |
   | Classification | **New field**; defaults to the pack classification |

   Flagged rows show a review marker and the finding text (for example RF-02, "PII over an unencrypted handoff").
5. **Operational nodes table:** ID, name, activity, location, and **Realised by** (the member component types with counts or "instances represented", as in OV-1). This traces each OV-2 node to the component diagrams later in the pack.
6. **Footer:** as on OV-1, with "Page n of N · OV-2".

### Flows to review
Mark a flow (and its needline) when the review rules already produce a **security** finding on that connection, for example sensitive data over a handoff without TLS, or "Authentication required = Yes" with no type (item 6). Use `evaluateArchitectureRules()`; don't add new rules for this page.

### New optional fields (per connection, in the connection inspector's Advanced section, next to authentication)
- **Resource exchanged:** short text, for example "Windows Security and Sysmon events".
- **Activity supported:** short text, or a pick from a per-pack list of activities (`state.builderExport.ov2.activities`), for example "Detect host compromise".
- **Classification:** a dropdown whose first option is "Same as pack (<pack classification>)", then the pack's classification values. Use it when a flow carries less than the pack level (for example configuration bundles → "Internal").
Store all three in the relationship details (`ensureRelationshipDetails(edge)`), and include them in `topologyDocument()`, the connection register table and re-import. **No free-text fields for secrets**, as with authentication. Empty "Resource exchanged" and "Activity supported" values go in the open-questions appendix as "Not set".

### Interaction (on-screen preview only)
Hovering over or clicking a needline pill, a flow row or a node row highlights the matching needline, its two end nodes and its rows in both tables, and dims the rest; Esc clears it (as in the mockup). This is optional in the downloaded HTML and absent in print.

### Pack integration
- Add **"OV-2 operational resource flows"** to the pack's Sections checkboxes, on by default, straight after OV-1, in the table of contents.
- Light and dark themes via the pack's theme tokens; light theme text on the page background ≥ 4.5:1.
- Print: the diagram fits one A4-landscape page at ≥ 9pt; the tables follow at ≥ 9.5pt (the Build 128 rule), with header rows repeating; wide tables wrap cell text rather than shrink it.
- At phone width, the diagram and tables scroll inside their own boxes; the page itself never scrolls sideways.

### Acceptance check
- **Default topology:** 4 operational nodes (sources, collection, forwarding, indexing, all in the "Unspecified" region frame), 3 needlines, 3 flows; "Resource exchanged" and "Activity supported" show "Not set" and are listed in the appendix.
- **Build 130 test topology** (3 UFs + Deployment Server): the UFs sit in one node; the Deployment Server is a "Platform management" node with one dashed needline to it; the three phone-home connections merge into one needline with one flow row per distinct resource.
- **Two regions:** separate location frames and nodes per region; the indexing and search nodes go in the "Multisite" frame when their components span both regions.
- **A flagged connection** (syslog without TLS carrying PII): its flow row and needline pill show the review marker, and the finding text matches the findings table.
- The three new fields survive export → re-import; "Classification" falls back to the pack classification when not set.
- Every connection in the topology appears in exactly one flow row (flow count ≥ connection count; no connection missing).
- The Chromium PDF has OV-2 after OV-1, with page numbers; 0 `pageerror` events while previewing and downloading.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. **Grouping sweep:** switch `#builderGroupBy130` through all six options in auto/horizontal layout and in free layout, with the default topology and a 3-UF + Deployment Server topology. Expect 0 errors, and nodes inside their lanes.
3. `node tools/builder-connector-check.js index.html shots/`: every scenario `OK` (scenario 9 once added, in each grouping mode).
4. Button sweep: every `#topologyBuilder` button, on a fresh page, with its context revealed, gives no errors and a visible effect. Note that dropdowns such as Group by aren't covered by the button sweep, so step 2 above covers them.
5. Architecture pack: export with all sections on (including OV-1 and OV-2), in both themes; the Build 128 checks and the item 7 and item 8 acceptance checks pass.
6. Add a `changeRegister` entry for each new block.

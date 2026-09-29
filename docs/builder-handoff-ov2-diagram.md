# Builder handoff: make the OV-2 page match the mockup

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 137 (`builder-ov2-v133`, adjusted by `builder-ov-review-v136`; shown in the pack and the OV tab). Companion to [`builder-handoff-build137.md`](builder-handoff-build137.md); do that file's OV-1 items 1–6 first or alongside, since several fixes here share code with OV-1 (the flow-tag formatter, title block, banners and legend).
**Reference:** `docs/mockups/architecture-ov2-mockup.html` (open it in a browser; click a needline pill or a table row to see the highlighting).
**Side by side:** `docs/mockups/compare/ov2-mockup.png` (target), `ov2-build137-diagram.png` and `ov2-build137-register.png` (now).
**Test topology:** `docs/mockups/ov1-reference-topology.json` (load with `loadTopologyDocument`). It is the same shape as the mockup: Sydney, Melbourne and AWS sources, a multisite indexer, search, people, an identity provider, SOAR and management. All checks below use it unless stated.

## Where Build 137 stands

The **model** is right and matches OV-3:
- 13 operational nodes by tier × region, 11 needlines and 10 flows;
- the Deployment Server flow has two consumers;
- clicking a pill highlights the needline, its two nodes and its table rows, and dims the rest.

The **drawing and the tables** fall short of the mockup:

| # | Mockup | Build 137 |
|---|---|---|
| A | **Location-first layout:** one row per site (Sydney, Melbourne, Cloud), each holding that site's sources → collection nodes; a Platform frame; a Security operations frame | Tier columns with location frames drawn around nodes in different columns, so **frames overlap**: the Melbourne frame covers the Sydney nodes, the "Sydney" label sits inside it, and the AWS frame spans ON-3 and ON-6 |
| B | Curved needlines, **one per node pair**, with **arrowheads** | Orthogonal lines that **share vertical trunks** (N1 and N2 use one trunk, so ON-1 appears linked to ON-5); no arrowheads (0 markers) |
| C | Pills sit in clear space on their own line | Pills overlap each other (N3/N4, N6/N8, N8/N9) and sit on nodes (N7 over ON-8/ON-9, N11 over ON-10/ON-11); the ⚠ is cut off the pill |
| D | Fixed 1200-wide drawing; text 11–13px | viewBox 1825 wide, shrunk to 1242 → text renders at about **8.6px** |
| E | Node box: dark **ID chip**, bold name, activity line, muted "realised by" lines | Plain text; names break oddly ("ON-1 Site sources · / Melbourne"); realised-by text is **cut mid-word without "…"** ("Windows Even", "Heavy", "License M") |
| F | Nodes numbered by site row (Sydney first) | Numbered by tier, then location **alphabetically** (Melbourne before Sydney) |
| G | **Alerts and response needlines:** search → SOC, search → SOAR, SOAR → SOC; plus indexing → management (usage and health) | None; SOAR (ON-13) is an island. OV-1 draws thread 7 to SOAR, so **OV-1 and OV-2 disagree** |
| H | Role names: "Security operations centre", "Identity services", "Response and cases", "Cloud event sources", "Cloud ingestion" | Generic: "People and identity · Cloud", "People and identity · Security operations", "Security response · Cloud", "Site collection · AWS ap-southeast-2" (AWS Lambda treated as collection) |
| I | Title block grid, filled banners, purpose sentence with counts, 36px legend line samples | One metadata line, outlined banners, a generic purpose line, and a tiny glyph legend. **OV-1 now has all of these; OV-2 should reuse them** |
| J | Register: plane swatch + needline, short transport ("S2S TCP 9997 · TLS · indexer ACK"), timeliness "≤ 60 s" / "on demand", review note inline | Transport strings **repeat and include junk**: "Direct HEC HTTPS 8088 · 8088 · TLS", "SAML SSO · TLS · Session established · SAML SSO", "Phone-home and app delivery · 8089 · TLS · Application response"; "60 s SLO" on search dispatch; long bold finding text in the classification column |
| K | Resource and activity filled in | Every row "Not set" (the fields are empty), so the core OV-2 columns are all chips |
| L | Nodes table has a **Needlines** column | No Needlines column |
| M | Realised by uses instance counts ("Indexer cluster (8 peers)") | "Indexer ×1" while OV-1 says "≈8": the counts are inconsistent between pages |

Work through the sections below in order. Each has a check.

---

## 1. Layout: sites as rows (fixes A, D and F)

- **Fixed viewBox width 1200.** The height comes from content. Never scale the drawing below 1:1 on screen: if the container is narrower, scroll inside the figure box. In print, scale to the page width, with text ≥ 9pt equivalent.
- **Three column groups:**
  1. **Site rows** (left, about 440 wide): one location frame per site/region, stacked vertically. Inside each frame, two slots left to right: *sources* → *collection and forwarding* (collection and forwarding nodes of that site share the right slot, stacked if there are several). Cloud regions form their own row ("CLOUD · AWS AP-SOUTHEAST-2").
  2. **Platform** (middle, about 240 wide): one frame. Rows: Indexing (top), Search (middle), Platform management (bottom). Title it "SPLUNK PLATFORM · MULTISITE" when the indexing or search nodes span several sites, otherwise "SPLUNK PLATFORM · <site>".
  3. **Security operations** (right, about 220 wide): people (SOC and users) top, identity services middle, response and cases bottom.
- 60px gutters between the three groups for the needlines and pills.
- **Frames never overlap.** Each node belongs to exactly one frame.
- **Node numbering follows reading order:** site rows top to bottom (sources, then collection within each row), then Platform top to bottom, then Security operations. **Site order:** the order regions first appear in the topology, with a region named like the pack scope or owner site first. Cloud rows go after the data centres; never sort alphabetically. OV-3 must use the same IDs (it already shares the model), so renumber in the model, not in the drawing.

**Check:** with the test topology, no two frames intersect; no node's box extends outside its frame; ON-1 is Sydney sources; SVG text renders at ≥ 11px on a 1280-wide screen (`getBoundingClientRect().height` of a 12px text ≥ 11).

## 2. Node boxes (fixes E)

- Box 200×70 (grows for wrapped lines), white fill, 1.3px `--ink-2` stroke, radius 4.
- **ID chip:** dark (`--ink`) rounded rectangle with the ID in 10px bold mono, white text, top-left.
- **Name:** 13px semibold after the chip, wrapped to at most two lines at the box width. The site goes in the frame title, so drop "· Sydney" from the name when it repeats the frame ("Site collection · Sydney" inside the Sydney frame → "Site collection").
- **Activity:** 10.5px, `--ink-2`, one line.
- **Realised by:** 10px `--muted`, up to two lines, using **instance counts** ("Windows servers ≈120 · firewalls 30", "Indexer cluster · 8 peers"). If it doesn't fit, end with "+2 more" and put the full list in a `<title>` tooltip and in the nodes table. **Never cut a word.**

**Check:** no text overflows its box (bbox test, as the Build 137 tests do); no word is cut (no text node ends in a partial word from a `slice`); every node has an ID chip.

## 3. Needlines (fixes B)

- **One path per needline, node to node:** from the source box's right edge (or bottom/top for same-column links) to the target box's left edge, as a cubic Bézier. **No shared trunks**: two needlines never share a segment. When several leave one box, spread their start points by 10px.
- **Arrowhead** at the consumer end (`marker-end`, 7px, line colour). Two-way flows (search ↔ indexing) get arrows at both ends.
- The same four styles as OV-1 and the canvas: event data solid, management dashed, authentication dotted, alerts and response solid in `--resp`.
- A multi-consumer management flow (RF-08: Deployment Server → ON-6, ON-7) draws **one needline per consumer** (N8, N9), each with its own pill, as now.
- A path never passes under a node box other than its own two ends (sample `getPointAtLength` every 8px).

**Check:** every needline has exactly one path, starts and ends within 2px of its two boxes, has an arrowhead, and crosses no other box; no two paths overlap for more than 10px.

## 4. Pills (fixes C)

- One pill per needline: "N3", plus "⚠" when it carries a flow to review. Keep the pill short and put the flow IDs ("RF-03") in its `<title>` and in the table; the mockup's pills show only the needline ID.
- Size the pill to its text (including the ⚠) with 6px padding each side; review pills get the review-colour stroke.
- Place the pill **on its own line** at the path midpoint. If it overlaps another pill, a box or a frame title, slide it along its own path (t = 0.35 … 0.65, then 0.2 … 0.8) until it's clear.

**Check:** no pill overlaps another pill, a node box or a frame title; every pill's centre is within 2px of its own path; the ⚠ is inside the pill.

## 5. Alerts and response needlines (fixes G)

OV-1 already infers the "Respond" thread (search → SOAR). OV-2 must show the same exchanges, from the same rule, so the two pages agree:
- **Search → Security operations centre** (notable events and dashboards) when both a search node and people exist.
- **Search → Response and cases** (notable events for playbooks) when SOAR exists.
- **Response and cases → Security operations centre** (cases and ticket updates) when both exist.
- **Indexing → Platform management** (licence usage and health metrics) when a License Manager or Monitoring Console exists.

Mark inferred needlines in the model (`inferred:true`) and show "(inferred)" in the register's Transport column until a real relationship replaces them. Put the rule in one function used by OV-1, OV-2 and OV-3.

**Check:** with the test topology, OV-2 has alerts-and-response needlines to ON-SOC and ON-SOAR; ON-SOAR is not an island; OV-1 thread 7 and OV-2's response needlines name the same nodes.

## 6. Node naming by role (fixes H)

| Members | Default name | Activity |
|---|---|---|
| Sources in a data-centre region | "<Region> event sources" | Generate host and network events |
| Cloud collection types (AWS Lambda, Azure Function, cloud API collector) | "Cloud event sources" (in the cloud row) | Emit audit and threat findings |
| UF / syslog relay in a site | "Site collection" | Collect, buffer and forward |
| HEC endpoint / Heavy Forwarder fed from cloud sources | "Cloud ingestion" | Receive HEC, parse, mask PII |
| Indexers / indexer cluster | "Indexing service" | Index and replicate across sites |
| Search heads / SHC | "Search and detection" | Correlate, alert, serve searches |
| DS, LM, MC, cluster managers | "Platform management" | Configure fleet, track licence and health |
| User / Administrator | "Security operations centre" (or the role name if roles are set) | Triage and investigate |
| Identity providers | "Identity services" | Authenticate people |
| SOAR | "Response and cases" | Run playbooks, track cases |

Treat cloud collection types as sources for OV-2, as OV-1 now does. Split a Heavy Forwarder fed by cloud sources into its own "Cloud ingestion" node instead of merging it into "Forwarding · Sydney". Names stay editable through `state.builderExport.ov2.nodeNames`.

**Check:** with the test topology, the node names match the mockup's (Sydney event sources, Melbourne event sources, Cloud event sources, Site collection ×2, Cloud ingestion, Indexing service, Search and detection, Platform management, Security operations centre, Identity services, Response and cases).

## 7. Page furniture (fixes I)

Reuse the OV-1 components from Build 137:
- filled classification banners;
- the five-cell title block ("OV-2 · Operational Resource Flow Description");
- a **purpose callout** with counts, generated: "Shows who exchanges what in the telemetry service: 12 operational nodes grouped by location, joined by 13 needlines that carry 15 resource flows. Each flow lists the resource exchanged, the activity it supports, how it's protected and how fast it must arrive.";
- frame titles in 10.5px mono uppercase with letter-spacing ("SYDNEY DATA CENTRE · SITE 1");
- a legend with 36px line samples for the four planes, plus the "Nn" review pill sample: "Needline with a flow to review";
- the footer "… · Page n of N · OV-2".

**Check:** OV-1 and OV-2 have identical banners, title-block layout and legend style.

## 8. One flow-tag formatter for every page (fixes J)

Write one `builderOvTransport138(flow)` used by the OV-1 tags, the OV-2 register and the OV-3 Transport column:
- **Protocol short names:** Splunk-to-Splunk → "S2S TCP <port>"; "Direct HEC HTTPS…" → "HTTPS HEC <port>"; "TCP/TLS or UDP" → "Syslog UDP/TCP <port>" (or "Syslog TCP · TLS <port>" when TLS); "Phone-home and app delivery" → "Phone-home HTTPS <port>"; "Search dispatch" → "Distributed search · HTTPS <port>"; "SAML SSO" → "SAML 2.0".
- Then TLS, then "indexer ACK" when acknowledgement is on, then the authentication type if it isn't already in the protocol ("· HEC token", "· MFA").
- **Never repeat a value** (the port appears once, the protocol once).
- **Drop acknowledgement values that aren't acknowledgement** ("Application response", "Session established" come from the relationship's response field; leave them out).
- **Timeliness:** "≤ 60 s" from the latency SLO; "on demand" for search dispatch and authentication ("per sign-in" for SAML); "60 s poll" for phone-home.
- **Review note:** put a short note in the review colour at the end of the Transport cell: "· review: PII over an unencrypted handoff". Keep Classification to the classification only. Put the full finding text in the row's `title` and in OV-3's detail row.

**Check:** with the test topology, no Transport cell repeats a word or number; RF-03 reads "HTTPS HEC 8088 · TLS"; the SAML rows read "SAML 2.0 · TLS"; search dispatch timeliness is "on demand".

## 9. Resource and activity defaults (fixes K)

The two columns are the point of OV-2, but they're empty until someone types them. Show a **derived default** in muted italic, marked "(derived)", until the user sets a value:
- **Resource** from the source types and plane: "Syslog events", "Windows Security events", "CloudTrail and GuardDuty findings", "Forwarded events · <site>", "Search jobs and results", "Notable events", "Apps and configuration bundles", "Authentication assertion", "Licence usage and health metrics".
- **Activity** from the consumer node's activity ("Detect host compromise" for sources → collection is too specific to derive; use "Collect and forward" for that hop, "Store and replicate evidence" into indexing, "Correlate and investigate" into search, "Triage alerts" into the SOC, "Keep collection configured" for phone-home, "Grant analyst access" for authentication).

Keep "Not set" in the open-questions appendix for anything still derived, so owners know to confirm it. OV-3 uses the same defaults.

**Check:** a fresh default topology shows no "Not set" chips in the Resource and Activity columns; each derived value is italic with "(derived)"; setting a value in the inspector replaces it on OV-2 and OV-3.

## 10. Nodes table (fixes L and M)

- Add a **Needlines** column listing every needline touching the node ("N1, N4, N10").
- Columns: Node (chip style ID), Operational node (bold), Activities performed, Location (with "site n"), Realised by (Builder components, with instance counts), Needlines.
- Use the same instance counts as OV-1 everywhere ("Indexer cluster · 8 peers", not "Indexer ×1").

**Check:** each needline appears in exactly two rows; the realised-by counts equal OV-1's card counts.

## 11. Interaction (keep)

Clicking a pill, a register row or a node row highlights the needline, its two nodes and its rows, and dims the rest; Esc clears. This works in Build 137; keep it through the rework, and add the hint line "Select a row or a needline ID to highlight it on the graphic. Esc clears." above the register (on screen only).

---

## Acceptance (screenshot and compare)
1. Load `docs/mockups/ov1-reference-topology.json`, open OV → OV-2 and the pack's OV-2 pages at 1280 wide, light and dark. Compare with `docs/mockups/compare/ov2-mockup.png`: rows A–M of the gap table should now match in kind.
2. Automated: 0 `pageerror` events; no frame overlaps (1); no text overflow or cut words (2); one path per needline with an arrowhead, crossing no box (3); no pill collisions (4); response needlines present (5); no repeated words in Transport (8); no "Not set" in Resource or Activity on a fresh topology (9).
3. OV-3 still lists the same flow and node IDs, in the same order, as OV-2 (after the renumbering in 1).
4. Default topology (4 components): a single site row plus Platform; clean, no empty frames.
5. Add a `changeRegister` entry for the new block.

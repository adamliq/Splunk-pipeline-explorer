# Builder handoff: Build 124 review

> **Superseded by [`builder-handoff-build127.md`](builder-handoff-build127.md).** Builds 125–127 address the items below; see that file for what remains. Kept as history.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `9e7e2da` (Build 124, 28 Sep 2026), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build123.md` and earlier. This file replaces them as the task list.
**Tool:** `node tools/builder-connector-check.js index.html [screenshot-dir]` (Playwright/Chromium) prints JSON per scenario; `OK` means that connector passed every check.

## TL;DR

- **Connectors are now in good shape.** Build 124 passes the connector check fully in 5 of 8 scenarios after drop, and 7 of 8 while dragging. Three small items remain (section A).
- **New feature work: the architecture pack export.** Today it's diagrams only. The app already computes inventory, relationship details, findings, rules, security, ownership and resilience data that never reach the pack. Section B specifies what to add, in priority order.

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v124`).
- **Never redeclare a top-level `const`, `let` or `function` name** (all classic scripts share one global scope; a duplicate makes the browser skip the whole script). Suffix new names with the block number.
- One version number per block; the next is `…-v125`.
- Move existing DOM elements rather than recreating them; layout code must be idempotent.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- Before uploading: zero `pageerror` events at 1440×900 and 390×844 after clicking **Builder**, and run `tools/builder-connector-check.js`.

---

## A. Connector follow-ups (small)

Build 124 results from `tools/builder-connector-check.js`, after drop:

| Scenario | Result |
|---|---|
| 1 Default horizontal | ✅ OK |
| 2 ＋ Add HEC client (UF selected) | ✅ OK |
| 3 Syslog Server dragged down-right | ✅ OK |
| 4 Syslog Server below Syslog Source | ✅ OK |
| 5 Syslog Server dropped onto Syslog Source | ⚠️ Syslog Source → Syslog Server: label over a card |
| 6 Syslog Server up-right, close to UF | ⚠️ Syslog Server → UF: label over a card, and badge over label; while dragging, it leaves the right side going ↓ |
| 7 UF into Syslog Server's column | ✅ OK |
| 8 Indexer below-left of UF | ⚠️ UF → Indexer: start point inside the source border |

**A1. Labels over cards (scenarios 5 and 6).** When the midpoint label's box intersects a card, slide the label along the drawn path (try t = 0.5, 0.35, 0.65, 0.25, 0.75), keeping the first position that clears every card (padded by 4px). If none clears, hide the text and show it on hover over the connector. Keep the badge attached to the label.
**A2. Stub direction while dragging (scenario 6).** A route that leaves a right-side anchor must travel → for its first 22px. While dragging, the first segment goes ↓: make sure the drag-time route uses the same `[anchor, stub, …, stub, anchor]` construction as the post-drop route.
**A3. Start point inside the border (scenario 8).** Start the path 1px outside the source border, and end it about 2px outside the target border (the arrow marker's tip extends past the path end).
**Check:** every scenario reports `OK` both while dragging and after drop.

---

## B. Architecture pack export: add content (feature)

### Current state
- **Entry points:** Export → **Architecture pack** (`#builderExportPack` → `openArchitecturePack()`), then **Download HTML pack** (`downloadArchitecturePack()` → `architecturePackHtml()`).
- **Pages:** `architecturePageSpecs()` returns an overview plus optional diagram pages per dimension, set by `state.builderExport.pack` = `{region, environment, group, plane, failure}` (checkboxes `[data-pack-dimension]`). Each page is one SVG from `presentationSvgForArchitecturePage(page)`.
- **Header:** `.packHead` with title, date, classification and page count.
- **With every dimension on, the default topology gives 7 diagram pages and no text or tables.**

### Data that already exists but isn't in the pack
| Source | Fields (verified in Build 124) |
|---|---|
| `builderInventoryRows()` | `name, componentType, role, group, environment, region, pipelineSets, incoming, outgoing, managementAuthority, authenticatedUsers, validation` |
| `builderTraceEdges('all')` + `ensureRelationshipDetails(edge)` | `protocol, endpoint, port, tls, acknowledgement, direction, owner, availabilitySlo, latencySloSeconds, retryPolicy, criticality, validation, dependency, notes` |
| `unresolvedValues()` (Review findings) | `severity, title, detail, nodeId, edge` (12 in the default topology) |
| `evaluateArchitectureRules()` | an array of `{id, title, severity, description, status, evidence, nodes, edges, profiles}` (10 rules) |
| `builderValidation()` | `{errors, warnings}` |
| `securityBoundaryModel()` | `nodes, levels, handoffs, crossings, findings, classification, environment` |
| `responsibilityModel()` | `nodes, levels, handoffs, accountable, findings, rasci` |
| `deploymentManagementJson()` | `managementPlane, eventDataPlane, outageBehaviour, failureScenarios` |
| `architectureReportMarkdown()` / `architectureReportJson()` | capacity, recovery, disaster recovery, performance guardrails, data quality, custody, detection lineage, parsing (the Operate → Report content) |
| `topologyDocument(name)` | the full re-importable topology JSON (schema, topology, governance, changeHistory, canvas, …) |

### B1. Cover and summary page (priority 1)
Replace the `.packHead` strip with a real first page:
- title, author or owner (new optional field in the pack options, saved in `state.builderExport`), build number (`#topologyBuilder.dataset.buildNumber`), prepared date, classification and scope;
- counts: components, relationships per plane, groups;
- validation status in the same wording as the Builder ("Valid · 0 errors · 12 to review");
- architecture profile (for example "Splunk Enterprise");
- a table of contents listing every following page, with page numbers.

### B2. Component inventory table (priority 1)
One table from `builderInventoryRows()`: Name, Type, Role, Environment, Region, Group, Pipeline sets, In/Out, Management authority, Validation. Sort by pipeline order (sources → collection → processing → destinations → management). Repeat the header row on each printed page (`thead{display:table-header-group}`).

### B3. Connection register (priority 1)
One table per plane (Event data, Fleet management, Interactive authentication), one row per relationship: From → To, Protocol, Endpoint, Port, TLS, Acknowledgement, Direction, Owner, Availability SLO, Latency SLO, Retry, Criticality, Validation, Notes. Show an empty port or "Unspecified" as a highlighted "Not set" so it reads as an open item. **Never include secrets**; the authentication plane already stores metadata only, so keep it that way.

### B4. Review findings and rule results (priority 1)
- Findings from `unresolvedValues()`: Severity, Component or relationship (resolve `nodeId` / `edge` to names), Title, Detail. Group errors first, then review items.
- Rules from `evaluateArchitectureRules()`: Rule, Severity, Status (pass / fail / not applicable), Evidence, Affected components.
- Summary line at the top: "0 errors · 12 to review · 10 rules: N pass, N fail".

### B5. Security and identity page (priority 2)
From `securityBoundaryModel()`: trust zones with their components, cross-zone connections (`crossings`) with protocol and TLS, and security findings. Authentication plane: identity providers, MFA, role mapping and audit evidence (metadata only).

### B6. Ownership page (priority 2)
From `responsibilityModel()`: accountable owner, owner per component, handover contracts (`handoffs`), and the `rasci` matrix as a table.

### B7. Resilience summary (priority 2)
One page summarising the models already in the architecture report: time to fill the buffer and data beyond durability (capacity), recovery time and data-loss targets met or missed (disaster recovery), capacity headroom and critical guardrail findings (performance). Link each figure to the assumption it depends on, since these are modelled values.

### B8. Deployment management (priority 3)
Server classes, deployment apps, Deployment Server → client relationships and the phone-home endpoint (`deploymentManagementJson()`).

### B9. Appendix (priority 3)
Assumptions and open questions (every "Not set", "Unspecified" or review item), a legend and glossary (planes, line styles, badge meanings), the change history (`topologyDocument().changeHistory`), and the **topology JSON** embedded in a `<script type="application/json" id="topology">` block, so the pack can be re-imported. Add an "Import from architecture pack" option to Import JSON that reads that block.

### Pack options UI
Extend `#builderPackOptions` with a second group, "Sections", with checkboxes for Cover, Inventory, Connections, Findings & rules, Security, Ownership, Resilience, Deployment, Appendix. Store them in `state.builderExport.sections`, default to the priority-1 sections on, and keep the existing diagram-dimension checkboxes as "Diagram pages". Show the live page count.

---

## C. Architecture pack: fix what's there

**C1. Skip duplicate diagram pages.** With one region ("Unspecified"), "Region · Unspecified" is identical to the overview. In `architecturePageSpecs()`, drop any page whose `nodeIds` set (and planes) equals the overview's, and drop dimensions with a single value that covers every component.
**C2. Printing loses the cover and page numbers.** The pack's print CSS has `@media print{.packHead{display:none} … .pageNo{display:none}}`, so a printed or PDF pack has no header and no page numbers. With B1's cover page in place, keep page numbers in print (for example a footer "Page n of N · <section>" on each `.page`), and remove the `display:none` rules.
**C3. Light print theme.** Add a "Print theme: Dark / Light" option. The light theme uses a white background, dark text, and darker plane colours with at least 4.5:1 contrast. Default to Light when printing (`@media print`), since the dark theme wastes ink and reads poorly on paper.
**C4. Export diagrams take a detour.** In the pack's diagrams, the UF → Indexer "Splunk-to-Splunk" connector loops up over the top instead of running straight, because the export diagram (`builderDiagramSvgBeforeNavigationExport`) uses its own tighter column spacing. Use the same 320px column pitch and the v123/v124 routing for export SVGs, then check that straight rows export with straight connectors.
**C5. Page notes (optional).** Allow an optional note per page (stored by page id in `state.builderExport.notes`), shown under the page title, so reviewers see why each view matters.

### Acceptance check for B and C
- With the default topology and all sections on, the pack has a cover with a table of contents, then Inventory (4 rows), Connections (3 event-data rows), Findings (12) and Rules (10), then the diagrams, with no page duplicating the overview.
- Every field shown matches the Builder (spot-check 3 components and 3 connections against the Inspector).
- Printing to PDF from Chromium (`page.pdf()`) gives page numbers on every page and a cover on page 1; the light theme passes 4.5:1 text contrast.
- A connection with an unset port shows "Not set", and no secret or credential field appears anywhere.
- Import JSON → "from architecture pack" restores the same topology (node and relationship counts equal).
- 0 `pageerror` events while opening the pack preview, downloading, and printing.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. `node tools/builder-connector-check.js index.html shots/`: every scenario `OK`, while dragging and after drop.
3. Button sweep: every `#topologyBuilder` button, on a fresh page, with its context revealed, gives no errors and a visible effect.
4. The architecture pack acceptance check above.
5. Add a `changeRegister` entry for each new block.

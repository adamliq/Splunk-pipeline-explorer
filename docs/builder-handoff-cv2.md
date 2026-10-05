# Builder handoff: add CV-2 (Capability Taxonomy)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** the build that adds CV-1 ([`builder-handoff-cv1.md`](builder-handoff-cv1.md)). CV-2 depends on CV-1's shared capability list, its increments and its pack wiring. If both go into one build, do CV-1 first. Add one new block, `<script id="builder-cv2-v1xx">`. Use wrappers only.
**Mockup (the target):** [`docs/mockups/architecture-cv2-mockup.html`](mockups/architecture-cv2-mockup.html), screenshot `docs/mockups/compare/cv2-mockup.png`.

## What CV-2 is

In DoDAF V2.0, CV-2 is the **Capability Taxonomy**. It breaks the CV-1 capabilities into parts that can be built, measured and assigned. Each part has one measure: a current value, a target, the increment it is due in, and the Splunk source the value comes from.

Like CV-1, it mixes **derived** and **edited** content:
- **From the Builder:** the taxonomy itself (fixed in this build), whether each part is realised in the topology, and a few measures the topology can count.
- **From the owner:** the other current values, the targets, the increments and the conditions.

## Where it goes

Follow the CV-1 / TM-1 pattern:

| Step | CV-2 |
|---|---|
| Section | Wrap `builderOvSections135` again and add `cv2: [builderCv2Page(true)]` |
| Tab | "CV-2 · Taxonomy", directly after CV-1 |
| Active key | Add `'cv2'` to `builderOvShow135` (keep every existing key) |
| Save / load | `doc.capabilityTaxonomy` ↔ `state.builderCv2`, through a `builderCv2Clean(raw)` function |
| Pack | `state.builderExport.sections.cv2` / `exportPreferences.packSections.cv2`, default `true`; read-only in the pack and Print / PDF |

## Taxonomy and realisation rules

Extend CV-1's shared `builderCapabilities169` with the level-2 parts. Give each part its own rule and keep the rules in that shared object, not in the renderer. CV-4, CV-6 and CV-7 reuse them.

"Path reaches an indexer" means the source's downstream chain (`parent` links, directly or through collectors) ends at `idx`, `indexerCluster` or `cloudIndexer148`.

| ID | Part | In topology when | Partial when | Otherwise |
|---|---|---|---|---|
| C1.1 | Network and syslog collection | every `syslogSource` path reaches an indexer | some do and some stop (reference: Melbourne stops at Universal Forwarder 2) | Planned |
| C1.2 | Endpoint collection | every `windowsEvent` / `fileSource` / `scriptSource` path reaches an indexer | any of them is unconnected or stops (reference: Windows Event Log 1) | Planned |
| C1.3 | Cloud and API collection | every `awsLambda` / `azureFunction` / `apiSource` / `hecClient` path reaches an indexer | any stops (reference: AWS Lambda 1 → Heavy Forwarder 1) | Planned |
| C1.4 | Filtering and masking at source | `edgeProcessor` or `ip` is on a path | — | Planned |
| C2.1 | Configuration as code | `ds` with at least one management relationship | `ds` with none | Planned |
| C2.2 | Forwarder fleet health | `ds` with clients **and** `monitoringConsole` | only one of them | Planned |
| C3.1 | Event indexing | any indexing tier | — | Planned |
| C3.2 | Retention management | any indexing tier | — | Planned |
| C3.3 | Data replication | `indexerCluster` or `indexerClusterManager` | a single indexer only | Planned |
| C4.1 | Ad hoc investigation | a search tier with an authentication relationship to it | a search tier without one | Planned |
| C4.2 | Normalised data (CIM) | any search tier | — | Planned |
| C4.3 | Search high availability | `shcCluster`, two or more `shcMember`, or `cloudSearchTier` | a single `search` | Planned |
| C5.1 | Correlation detections | never (no Enterprise Security component) | — | Planned |
| C5.2 | Risk-based alerting | never | — | Planned |
| C6.1 | Case management | SOAR plus a relationship from a search tier to it | SOAR with no such relationship (reference) | Planned |
| C6.2 | Playbook automation | `soarPlaybook` | SOAR with no playbook node (reference) | Planned |
| C7.1 | Single sign-on | an authentication provider with an authentication relationship to a search tier | a provider with none | Planned |
| C7.2 | Data access control | as C7.1 | as C7.1 | Planned |
| C7.3 | Access review | any search tier | — | Planned |
| C8.1 | Licence management | `licenseManager` | — | Planned |
| C8.2 | Health monitoring | `monitoringConsole` | — | Planned |
| C8.3 | Capacity planning | `licenseManager` and a search tier | only one of them | Planned |

**Level 1 becomes a roll-up** once CV-2 exists:
- "In topology" if every part is in the topology;
- "Planned" if every part is planned;
- "Partial" otherwise.

CV-1 then shows the same status. This replaces CV-1's own level-1 rules, so add a short note to the change register.

Effect on the reference topology: **C6 Automated response moves from "In topology" to "Partial"**. SOAR exists, but no relationship sends findings to it. CV-7 and SV-1 found the same gap. This is intended.

**Reasons:** show the reason for each Partial or Planned in the detail strip and the register, for example "Universal Forwarder 2: path stops before an indexer". Build them from the rule that failed.

**Correction to the mockup:** the reference topology has a Monitoring Console, so C2.2 and C8.2 are **In topology**. The mockup's "Partial · no Monitoring Console" is wrong.

## Measures

Each part has one measure. The **name** and **Splunk source** are fixed text from the mockup. For example, C1.2 is "In-scope hosts forwarding", measured from "Monitoring Console · Forwarders: Deployment". Copy all 22 from the mockup's `CAPS` data.

**Derived (read-only, badge "From topology"):**

| Part | Current value |
|---|---|
| C4.3 | Number of search heads: count of `shcMember`, else 1 per `search`, else 0 |
| C6.2 | Number of `soarPlaybook` nodes |
| C1.3 | Cloud sources whose path reaches an indexer, out of all cloud sources: "0 of 1" on the reference topology |

**Edited, saved in `state.builderCv2`:**

```js
{
  measures: {
    'C1.2': {current:'', target:'', due:'i1'}   // due = a CV-1 increment key; '' current shows "Not measured"
  },
  conditions: ['']                              // 0–6, ≤ 200 chars each
}
```

`builderCv2Clean`:
- Accept only the 22 known part IDs.
- Cap `current` and `target` at 40 chars.
- Drop a `due` that names a missing CV-1 increment.
- Ignore a stored `current` for derived measures.

**Example content:** "Load example" (the CV-1 button) also fills the mockup's example values: current, target, due and the four conditions.

### Progress bar

Draw the bar only when both `current` and `target` parse to a number:
- **Parsing:** take the first number in the string and ignore `≥ ≤ < >` and `%`. For "x of y", use x and y.
- **Lower is better:** when the target starts with `≤` or `<` and the target is below the current value.
- **Bar maximum:** the larger of current and target, × 1.1.
- **Marker:** the target is the vertical marker.

Otherwise show "Current … · Target …" as text (for example "1 / 1 → 2 / 2 multisite").

## Page layout (match the mockup)

1. **Header:** banners and title block. Title "CV-2 · Capability Taxonomy"; the capability owner is the same field as CV-1 (`state.builderCv1.owner`).
2. **Purpose line and summary:** counts of level-1 and level-2 parts and measures, how many are realised, partial or planned, and how many are not measured.
3. **Tree:**
   - A root ("Security telemetry operations"), the 8 level-1 cards with their domain colour, and the level-2 parts hanging off a spine under each.
   - Each part shows its status dot, ID, name and `current → target`.
   - The tree scrolls inside its figure (minimum width about 1120px).
   - Nothing is dimmed on load.
4. **Detail strip:** the selected part's definition, measure, bar, source, due increment, the Builder components that realise it, its status with the reason, and the CV-1 goal it serves (the level-1 primary goal).
   - Editable inputs for current (except derived measures), target and due.
   - For a level-1 card: its parts and the roll-up status.
   - Default: C1.2. Esc clears.
5. **Measures register:** grouped by level 1, with the columns ID, part, measure, current, target, by, measured from, in topology. Clicking a row selects the part.
6. **Conditions:** an editable list.
7. **Footer:** `CV-2 · 1 of 1 · Build <n>`.

**Themes:** use the OV theme tokens.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events; sweeps clean;
   - OV-1/2/3 and TM-1 unchanged;
   - CV-1 unchanged except the C6 roll-up;
   - perf, space and connector tools all pass.
2. **Reference topology:**
   - **In topology (12):** C2.1, C2.2, C3.1, C3.2, C4.1, C4.2, C7.1, C7.2, C7.3, C8.1, C8.2, C8.3.
   - **Partial (7):** C1.1, C1.2, C1.3, C3.3, C4.3, C6.1, C6.2.
   - **Planned (3):** C1.4, C5.1, C5.2.
   - **Roll-up:** C2, C7 and C8 in topology; C1, C3, C4 and C6 partial; C5 planned.
3. **Default topology** (`syslogSource`, `syslog`, `uf`, `idx`):
   - **In topology:** C1.1, C3.1, C3.2.
   - **Partial:** C3.3.
   - **Planned:** everything else.
   - **Roll-up:** C1 partial (endpoint and cloud collection are planned), C3 partial, the rest planned.
4. **Derived measures:** C4.3 shows 1, C6.2 shows 0 and C1.3 shows "0 of 1" on the reference topology. Adding a `soarPlaybook` updates C6.2 and moves it to In topology.
5. **Save and load:**
   - Edited measures and conditions round-trip through save, reload and import.
   - An older file without `capabilityTaxonomy` opens with empty values.
   - Junk input loads cleaned.
6. **Progress bar:**
   - C8.1 "104%" → "≤ 85%" draws as lower-is-better.
   - "1 / 1" → "2 / 2 multisite" shows as text, with no bar.
7. **Pack and themes:**
   - The pack and Print / PDF include CV-2 after CV-1, read-only.
   - Dark and light themes are both readable; no page-level sideways scroll at 768px.
8. **Records:** a `changeRegister` entry ("Adds CV-2 Capability Taxonomy; level-1 status now rolls up from level-2 parts") and the build stamp.

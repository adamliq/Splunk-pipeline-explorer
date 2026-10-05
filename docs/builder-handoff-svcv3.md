# Builder handoff: add SvcV-3a (Systems-Services Matrix) and SvcV-3b (Services-Services Matrix)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** the build that adds SvcV-6 ([`builder-handoff-svcv6.md`](builder-handoff-svcv6.md)). Both matrices reuse its shared service catalogue (`builderServices1xx`, with `providers`) and service flows (`builderServiceFlows1xx`). If they go into the same build, do SvcV-6 first. SvcV-4 ([`builder-handoff-svcv4.md`](builder-handoff-svcv4.md)) is independent of these two.
Add one new block, `<script id="builder-svcv3-v1xx">`, for both pages. Use wrappers only.
**Mockups (the targets):**
- [`docs/mockups/architecture-svcv3a-mockup.html`](mockups/architecture-svcv3a-mockup.html), screenshot `docs/mockups/compare/svcv3a-mockup.png`;
- [`docs/mockups/architecture-svcv3b-mockup.html`](mockups/architecture-svcv3b-mockup.html), screenshot `docs/mockups/compare/svcv3b-mockup.png`.

Row and column selection, the plane filter (3b) and Esc all work in them.
**Test topology:** `docs/mockups/ov1-reference-topology.json` (load with `loadTopologyDocument`).

## What they are

In DoDAF V2.0:
- **SvcV-3a** shows which **systems** provide or use which **services**: rows are systems, columns are services.
- **SvcV-3b** shows which **services** exchange resources with which **services**: rows are producers, columns are consumers, and each cell holds the flow between them.

Both are summaries. Every value is **derived** from the topology through the SvcV-6 helpers, so there is **no saved state** and no editing. Only the pack switches are stored.

## Where they go

| Step | SvcV-3a | SvcV-3b |
|---|---|---|
| Section | Wrap `builderOvSections135` once and add `svcv3a: [builderSvcv3aPage1xx(true)]` and `svcv3b: [builderSvcv3bPage1xx(true)]` | |
| Tab | "SvcV-3a · Systems × services" | "SvcV-3b · Services × services" |
| Tab order | SvcV-1, SvcV-2, SvcV-3a, SvcV-3b, SvcV-4, SvcV-6 | |
| Active key | Add `'svcv3a'` and `'svcv3b'` to `builderOvShow135` (keep every existing key) | |
| Pack | `sections.svcv3a` / `packSections.svcv3a`, default `true` | `sections.svcv3b` / `packSections.svcv3b`, default `true` |

Both pages are read-only in the pack and Print / PDF. `topologyDocument` and `loadTopologyDocument` need no wrapper, because nothing is saved.

**Shared look:** both use the CV-6/CV-7 matrix styles (`.mx` in the mockups):
- a sticky first column;
- a family header row grouping the services by layer (Collection · Indexing · Search · Detection and response · Platform and access);
- group rows in the body;
- a summary row at the foot;
- a detail strip above the matrix.

Each matrix scrolls inside its own wrapper; the page never scrolls sideways. At 1280px the matrix should fit without scrolling: 16 service columns of 50px and a first column of 220px.

---

## Part A: SvcV-3a, systems × services

### A1. Rows and columns

- **Rows:** one per `state.builderNodes` node, in five groups by type. Inside a group, order by site, then name (as OV-2):

  | Group | Types |
  |---|---|
  | Sources | `syslogSource`, `windowsEvent`, `fileSource`, `scriptSource`, cloud and API sources |
  | Collection tier | `syslog`, `uf`, `hf`, `edgeProcessor`, `ip` |
  | Indexing and search | indexing and search tiers, cluster managers, `shcCluster`, `shcMember` |
  | Response and access | SOAR types, authentication providers, `authUser` |
  | Platform management | `ds`, `licenseManager`, `monitoringConsole` |

  Row header: the instance name, then "type · site" in small mono.
- **Columns:** all 16 services in catalogue order within their layer (S3, S1, S4, S2, S6 · S7, S8 · S9, S10, S11 · S12, S13 · S5, S14, S15, S16). Each column header shows the ID and a short name (the mockup's `SVC` short names), with the full name in `title`. A service with no provider has its ID in the stop colour.

### A2. Cells

**Provides (●).** A node provides a service when it is in that service's `providers` (SvcV-6 section 1). The mark turns amber, **"provides it but is cut off"**, when:
- a `uf` has no path to an indexing tier (S1);
- an `hf` has no path to an indexing tier (S2);
- a SOAR node receives no relationship from a search tier (S13, because SF-11 is not In place).

Each cut-off cell keeps a one-line reason for the detail strip, for example "Forwards nothing: no output to Indexer 1".

**Uses (○).** A node uses a service on these conditions:

| Node type | Uses |
|---|---|
| `syslogSource` | S3, when it has a data edge to a `syslog` |
| cloud and API sources | S4, when it has a data edge to the HEC receiver |
| `windowsEvent`, `fileSource`, `scriptSource` | S1, when it has a data edge to a `uf` |
| `syslog` | S1, when a `uf` reads from it |
| `uf`, `hf` | S7 (always: they exist to feed indexing; a missing output shows as the amber provider cell, not a missing use); S5, when they are a deployment client |
| indexing tier | S15, when `licenseManager` exists; S16, when `monitoringConsole` exists |
| search tier | S7, when it has a data edge from an indexing tier; S14, when an authentication edge reaches it; **S12 always** |
| SOAR | S9, when a search tier exists |
| `authUser` | S14, when it has an authentication edge; S9, when a search tier exists; S13, when SOAR exists |
| `monitoringConsole` | S9, when a search tier exists |

A "uses" mark on a service that **no node provides** is a red ring: "uses a service nothing provides" (on the reference topology: Search Head 1 → S12).

**Role column (last):**
- "n provided · m used" in a neutral chip;
- amber when any of the node's provider cells is cut off;
- **"Unconnected"** in red when the node has no marks at all (reference: Windows Event Log 1).

**Foot row "Provided by":** per service, the number of providers in a chip (green when all are live, amber when any is cut off) and "n live" under it. **"None"** in red for a service no node provides.

### A3. Detail and selection

- Clicking a **row header** (system) selects it and shows:
  - its site and type, with the role chip;
  - **Provides:** each service as a chip (green, or amber with the cut-off reason);
  - **Uses:** each service as a chip (neutral, or red with "not deployed");
  - **Interfaces:** every edge touching the node from `builderTraceEdges('all')`, as "A → B" with a plane chip, plus any missing or inferred pseudo-interface from the SvcV-6 handoff. An unconnected node shows "In the topology with no interface: it provides and uses nothing".
- Clicking a **column header** (service) selects it and shows its layer and deployed status, **Provided by** (Live / Cut off, each with its reason) and **Used by**. A service with no provider shows "No system provides it", with the reason: "No Enterprise Security component" for S12, "Not in the topology" for the others.
- **Highlighting:** the selection dims every row that isn't involved. For a service, that means the rows that provide or use it; for a system, its own row. The selected column is tinted.
- **Default:** the first `hf`, or else the first node. Esc clears.

### A4. Summary and findings

**Summary:** systems, services, mappings (all marks), provider cells, then three counts in the review colour: services with no system, providers cut off, and systems unconnected.

**Findings** (generated; show each only when it applies):

| Finding | Shown when |
|---|---|
| No system | Any service has no provider. List them, and name any node that uses one (Search Head 1 uses S12) |
| Cut off | Any provider cell is cut off. Name each node, service and reason |
| Single provider | Any deployed service in Indexing or Search has exactly one provider node. Also name the services with two or more providers, noting any that include a cut-off one |
| Unconnected | Any node has no marks. Suggest connecting it to a forwarder or removing it |
| Platform | All of S5, S14, S15 and S16 that exist have only live providers |

---

## Part B: SvcV-3b, services × services

### B1. Rows, columns and cells

- **Rows (producers)** and **columns (consumers):** the 16 services in the same layer order as 3a, plus one **"Outside the platform"** row and column for the external parties (the producer in SF-01 and SF-04; the consumer in SF-12 and SF-13). A service no node provides keeps its row and column, with its ID in the stop colour and "Not deployed" under the name.
- **Cells:** expand every flow from `builderServiceFlows1xx()` into producer × consumer pairs. A flow with two consumers (SF-14, SF-17) fills two cells.
  - The cell shows the flow number without the prefix ("07") in a small chip styled by the SvcV-6 status: In place green tint; In place, gap amber tint; Planned or inferred amber dashed outline; Missing red tint.
  - The `title` holds "SF-07 · Search results".
- **Diagonal** cells (a service with itself) are hatched.
- **Last column "Outbound"** and **foot row "Inbound":** the number of pairs. Green when every flow counted is In place, amber otherwise, and a neutral "0" when there are none.

### B2. Filter, detail and selection

- **Plane filter:** All / Data / Platform (segmented buttons beside the legend). It fades the flow cells of the other plane to 18% and leaves the rest of the table alone.
- **Clicking a flow cell** selects that flow:
  - outlines every cell of that flow;
  - highlights the producer row and the consumer columns;
  - shows the flow's plane, its status chip and reason (from SvcV-6), data and format, frequency, the interfaces that carry it, and its OV-3 RF IDs.
- **Clicking a service** (row or column header) selects it:
  - highlights its row, the rows of the services that send to it, and its column;
  - shows **Receives from** and **Sends to**, each flow as a status chip with the other service and the data.
  - A not-deployed service with no flows shows "No flows designed yet. Design them before the service is built."
- **Default:** S12 when a search tier exists, else S7. Esc clears.
- **Keyboard:** flow cells and row headers are focusable; Enter or Space selects.

### B3. Summary and findings

**Summary:** services, flows, service pairs, in place, then two counts in the review colour: gap, planned or missing; and services with no flows.

**Findings** (generated; show each only when it applies):

| Finding | Shown when |
|---|---|
| Detection | Any of SF-09 to SF-12 is not In place. Describe the chain S9/S10 → S12 → S13 → service desk. If no flow into S13 is In place, say so |
| Hub | Name the service in the most pairs (in + out) and its counts. Flag it when any of its inputs is Missing or a gap |
| No flows | Any not-deployed service has no flows (S6, S8, S11). Suggest the pairs to design: S7 ↔ S8, S9 ↔ S11, S6 ↔ S1/S2 |
| Monitoring | S16 exists and its outbound consumers leave out any deployed Collection or Detection service. List the services it doesn't watch |
| Platform | SF-14 and SF-15 are both In place |

---

## Corrections to the mockups

- **3b, SF-15:** the mockup draws S14 → S13 as well as S14 → S9. Derive the consumers from the authentication edges. On the reference topology that gives **19 pairs, not 20**, and S13's inbound count is 1 (the planned SF-11) instead of 2.
- **3b, Detection finding:** with that correction, "SOAR today receives only sign-in (SF-15)" becomes "SOAR today receives no flow that is in place". Generate the wording from the data.
- **3a, interface IDs:** the mockup lists SV-1 `SI-n` IDs in the system detail. Use edge names until SV-1 exists, as in the SvcV-6 handoff.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events; sweeps clean;
   - OV-1/2/3, TM-1, DIV-1, CV-1, SvcV-4 and SvcV-6 unchanged;
   - perf, space and connector tools all pass.
2. **SvcV-3a, reference topology:**
   - 17 systems, 16 services, 35 mappings, 14 provider cells.
   - **Cut off (3):** Universal Forwarder 2 (S1), Heavy Forwarder 1 (S2), Splunk SOAR · Cloud 1 (S13).
   - **No provider (4):** S6, S8, S11, S12. Search Head 1 shows a red ring under S12.
   - **Unconnected (1):** Windows Event Log 1.
   - **Two providers:** S3 (Syslog Server 1, 2) and S1 (Universal Forwarder 1, 2; one cut off).
   - Every other provided service has one provider.
   - All five findings appear.
3. **SvcV-3b, reference topology:**
   - 17 flows and 19 pairs.
   - **In place (8):** SF-02, 04, 05, 07, 08, 13, 14, 15.
   - **Not in place (9):** the other nine.
   - S7 is the hub with 6 pairs (3 in, 3 out).
   - S6, S8 and S11 have no flows.
   - S16 sends to S7 and S9 only.
   - All five findings appear.
4. **Default topology** (`syslogSource`, `syslog`, `uf`, `idx`):
   - **3a:** 4 systems; Syslog Source 1 uses S3; Syslog Server 1 provides S3 and uses S1; Universal Forwarder 1 provides S1 and uses S7; Indexer 1 provides S7. Nothing is cut off.
   - **3b:** 3 pairs (Outside → S3, S3 → S1, S1 → S7). No Detection or Monitoring finding.
5. **Edits to the topology:**
   - Adding Heavy Forwarder 1 → Indexer 1 clears HF1's amber S2 cell (3a) and turns the S2 → S7 cell green (3b).
   - Adding a search → SOAR relationship clears SOAR's amber cell and turns SF-11's cell from planned to In place.
   - Deleting Windows Event Log 1 removes its row and the Unconnected finding.
6. **Interaction:**
   - **3a:** selecting S12 highlights Search Head 1's row only; selecting Universal Forwarder 2 shows the cut-off reason and its missing interface.
   - **3b:** selecting SF-17 outlines both its cells and highlights the S16 row and the S7 and S9 columns; the Platform filter fades the data cells only.
   - Esc clears on both pages.
7. **Layout:**
   - Both matrices fit at 1280px with no inner scroll.
   - At 400px and 768px they scroll inside their wrappers, with no page-level sideways scroll.
   - Readable in dark and light.
8. **Pack:**
   - SvcV-3a and SvcV-3b appear before SvcV-4, read-only, with the legend.
   - In print, the detail strip shows the default selection and nothing is dimmed.
9. **Records:** a `changeRegister` entry ("Adds SvcV-3a Systems-Services Matrix and SvcV-3b Services-Services Matrix") and the build stamp.

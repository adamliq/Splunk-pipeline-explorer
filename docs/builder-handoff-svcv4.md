# Builder handoff: add SvcV-4 (Services Functionality Description)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** the build that adds SvcV-6 ([`builder-handoff-svcv6.md`](builder-handoff-svcv6.md)). SvcV-4 reuses its shared service catalogue (`builderServices1xx`) and service flows (`builderServiceFlows1xx`). If both go into one build, do SvcV-6 first. Add one new block, `<script id="builder-svcv4-v1xx">`. Use wrappers only.
**Mockup (the target):** [`docs/mockups/architecture-svcv4-mockup.html`](mockups/architecture-svcv4-mockup.html), screenshot `docs/mockups/compare/svcv4-mockup.png`. The thread buttons, function selection, allocation table and Esc all work in it.
**Test topology:** `docs/mockups/ov1-reference-topology.json` (load with `loadTopologyDocument`).

## What SvcV-4 is

In DoDAF V2.0, SvcV-4 is the **Services Functionality Description**. It shows:
- the functions each service performs;
- how resources flow between those functions.

Here, each SvcV-1 service is broken into 1–6 functions (35 in all), and each SvcV-6 flow is drawn from the function that sends it to the function that receives it. The view answers "which part of which service does this, and which parts are missing", which SvcV-6 can't show.

Content is **derived** from the topology (function status) and **fixed** text (the function list, names, OV-5 activity and the Splunk mechanism). The owner can add a note per function; nothing else is edited.

## Where it goes

Follow the CV-1 / SvcV-6 pattern:

| Step | SvcV-4 |
|---|---|
| Section | Wrap `builderOvSections135` again and add `svcv4: [builderSvcv4Page1xx(true)]` |
| Tab | "SvcV-4 · Service functions", directly before SvcV-6 |
| Active key | Add `'svcv4'` to `builderOvShow135` (keep every existing key) |
| Save / load | `doc.serviceFunctions` ↔ `state.builderSvcv4`, through `builderSvcv4Clean1xx(raw)` |
| Pack | `state.builderExport.sections.svcv4` / `exportPreferences.packSections.svcv4`, default `true`; read-only in the pack and Print / PDF |

## 1. Function catalogue (shared): `window.builderServiceFunctions1xx`

Copy the 35 functions from the mockup's `FN` data, keeping the same IDs, names, OV-5 activities and "how it is realised" text. The ID is the service ID plus a number (S7.4). Keep the list in the shared object, not in the renderer, so SvcV-5 and SvcV-10a can reuse it.

**Status** is one of: Realised · Partly realised · Planned · Not realised.

**General rule:** when a function's service is not deployed (SvcV-6 section 1), all its functions are **Planned**. The two exceptions are:
- **S12** functions are **Not realised** when S9 exists. The detection chain needs them and no component can provide them.
- **S12** functions are **Planned** when S9 does not exist.

"Path reaches an indexer" means the same as in the CV-2 handoff.

Where a rule names an SF flow, it maps that flow's SvcV-6 status: In place → Realised; In place, gap → Partly realised; Planned or inferred → Partly realised if an inferred interface exists, else Planned; Missing → Not realised. If SvcV-6 does not return the flow (one end is absent), the function is Planned.

When the service is deployed:

| ID | Function | Realised when | Partly when | Otherwise |
|---|---|---|---|---|
| S3.1 | Receive syslog | every `syslogSource` → `syslog` edge has TLS Required/Enabled and no UDP | any edge allows UDP or has no TLS (reference) | — |
| S3.2 | Write host files | always | — | — |
| S4.1 | Accept HEC events | always | — | — |
| S4.2 | Queue to parser | the HEC receiver is an `hf` or indexing tier | — | — |
| S1.1 | Tail host files | a `uf` has a `syslog` parent | — | Planned |
| S1.2 | Forward raw (S2S) | SF-03 rule | | |
| S1.3 | Read event logs | every `windowsEvent` path reaches an indexer | some do | **Not realised** if none do (reference: Windows Event Log 1); **Planned** if there are no `windowsEvent` nodes |
| S2.1 | Parse, timestamp | always | — | — |
| S2.2 | Mask PII | always | — | — |
| S2.3 | Forward cooked | SF-06 rule | | |
| S6.1 | Filter at the edge | always | — | — |
| S7.1 | Receive S2S | every `uf` and `hf` reaches an indexing tier | some do (reference) | Not realised if none do |
| S7.2 | Parse raw, mask | a `uf` → indexing tier edge exists | — | Planned |
| S7.3 | Write, roll buckets | always | — | — |
| S7.4 | Serve search | S9 exists | — | Planned |
| S7.5 | Store summaries | S10 exists | — | Planned |
| S7.6 | Report licence use | SF-16 rule; on the reference it is Partly (inferred interface) | | |
| S8.1 | Replicate buckets | always | — | — |
| S9.1 | Dispatch, merge | always | — | — |
| S9.2 | Serve dashboards | always | — | — |
| S9.3 | Run schedules | S12 exists (never in this build) | — | Planned |
| S9.4 | Check SAML session | an authentication edge reaches the search tier | — | Planned |
| S10.1 | Build CIM summaries | always | — | — |
| S10.2 | Serve tstats | S12 exists | — | Planned |
| S11.1 | Replicate config | always | — | — |
| S12.1, S12.2 | Correlate events · Raise risk findings | never | — | see the exception above |
| S13.1 | Ingest findings | a relationship from a search tier to SOAR exists | — | **Not realised** (reference) |
| S13.2 | Run playbooks | a `soarPlaybook` node exists | SOAR without one (reference) | — |
| S13.3 | Update tickets | never (no service desk component) | — | Not realised |
| S5.1 | Serve app bundles | `ds` with at least one management edge | `ds` with none | — |
| S14.1 | Issue SAML assertion | a provider with an authentication edge to a search tier | a provider with none | — |
| S15.1 | Pool, enforce licence | a management edge links `licenseManager` and an indexer | inferred interface only (reference) | — |
| S16.1 | Poll health (REST) | SF-17 rule; Partly on the reference (inferred) | | |
| S16.2 | Alert on silence | `monitoringConsole` has a management edge to `ds` or to a forwarder | — | **Not realised** when S16 exists (reference) |

**Reason text:** for every status other than Realised, keep a one-line reason built from the rule that failed, for example "Universal Forwarder 2: no output to an indexer". Show it in the detail strip.

## 2. Function flows

Each SvcV-6 flow gets a **sending function** and a **receiving function** (the mockup's `FL` and `PTF` data).

**Data flows** run function to function:

| Flow | From | To |
|---|---|---|
| SF-01 | Network devices | S3.1 |
| SF-02 | S3.2 | S1.1 |
| SF-03 | S1.2 | S7.1 |
| SF-04 | AWS workloads | S4.1 |
| SF-05 | S4.2 | S2.1 |
| SF-06 | S2.3 | S7.1 |
| SF-07 | S7.4 | S9.1 |
| SF-08 | S7.5 | S10.1 |
| SF-09 | S9.3 | S12.1 |
| SF-10 | S10.2 | S12.1 |
| SF-11 | S12.2 | S13.1 |
| SF-12 | S13.3 | Service desk |
| SF-13 | S9.2 | SOC analysts |

**Platform flows** are drawn service to service, but each has a receiving function so the detail and the table can list it:

| Flow | From | Receiving function per target |
|---|---|---|
| SF-14 | S5.1 | S1 → S1.1, S2 → S2.1 |
| SF-15 | S14.1 | S9 → S9.4, S13 → S13.2 |
| SF-16 | S7.6 | S15 → S15.1 |
| SF-17 | S16.1 | S7 → S7.3, S9 → S9.2 |

Take each flow's existence, status and consumers from `builderServiceFlows1xx()`. A flow that SvcV-6 does not return is not drawn. **SF-15 goes to S9 only on the reference topology**, because its consumers come from the authentication edges; the mockup's S13 branch is example content.

## 3. Page layout (match the mockup)

1. **Header:** banners, title block ("SvcV-4 · Services Functionality Description"; same owner as SvcV-6), the purpose line and the summary figures:
   - services, functions and flows;
   - realised;
   - partly, planned and not realised (each in the review colour).
2. **Thread buttons:** All flows / Telemetry in (SF-01 to SF-06) / Detect and respond (SF-07 to SF-13) / Platform (SF-14 to SF-17). A thread dims everything outside it and shows a one-line note (the mockup's `TNOTE`).
3. **Function flow diagram** (SVG, inside a horizontally scrolling figure, minimum width 1000px; viewBox about 1260 × 476):
   - **Seven columns:** Sources · Receive · Forward · Index · Search · Detect and respond · Consumers.
   - **Placement:**
     - Receive: S3, S4.
     - Forward: S1, S2, S6.
     - Index: S7, S8.
     - Search: S9, S10, S11.
     - Detect and respond: S12, then S13 below it.
     - Sources: Network devices, AWS workloads.
     - Consumers: SOC analysts, Service desk.
     - A dashed rule and a "Platform and access services" band below hold S5, S15, S16 and S14 under the Forward, Index, Search and Detect columns.
   - **Service card:** a 22px header ("S7 · Indexing"; use the mockup's `SHORT` names where the full name would overflow 150px) and one 22px row per function: a status dot (filled green, filled amber, amber ring, filled red) and the name. A not-deployed service has a dashed amber border. Externals are dashed zone-filled boxes.
   - **Vertical placement:** align each card so its sending row sits level with the row it feeds where possible (for example, Network devices level with S3.1). Use the mockup's `y` values as the starting layout.
   - **Data flows:** horizontal cubic curves from the right edge of the sending row to the left edge of the receiving row, labelled with the SF ID at the midpoint. When both ends are in one column (SF-11), draw a vertical arrow between the cards.
   - **Platform flows:** thinner vertical curves from the platform card to the bottom of the target card (or from the S7 card down to S15), offset so several arrows into one card don't overlap. Draw them under the cards.
   - **Line styles** by the flow's SvcV-6 status: In place solid; gap solid amber; Planned dashed amber; Missing dashed red.
4. **Selection:**
   - Clicking a function row, or pressing Enter/Space on it, highlights that row and the flows it sends or receives, and the functions at their other ends; everything else dims.
   - A platform flow lights only the receiving function of the target it ends at, not every function in that card.
   - Selecting again clears; Esc clears both the selection and the thread.
   - Choosing a thread clears the selection.
5. **Detail strip** below the diagram, in three columns on wide screens:
   - **Selected function:** its service and layer, ID and name, status chip and reason, the OV-5 activity, the "how it is realised" text (plus the owner's note), and what it receives and sends as SF chips with the other end named.
   - **No selection:** "Where telemetry stops" (S1.2, S2.3) and "Where response stops" (S12, S13.3), each shown only if that function is not Realised.
6. **Function allocation table,** grouped by layer. Columns:
   - Function (ID, name, service);
   - Receives and Sends (SF chips coloured by flow status);
   - OV-5;
   - Status (dot and label).

   Clicking a row selects the function and scrolls the diagram into view.
7. **Findings,** generated by these rules and shown only when they apply:
   - **Response:** count the Not realised functions among S12.1, S12.2, S13.1 and S13.3, and mention S9.3 and S13.2 when they are not Realised.
   - **Dead ends:** S1.2 or S2.3 not Realised. Name the forwarder nodes that have no output.
   - **Masking:** S2.2 and S7.2 both Realised (masking in two places), plus "Receive syslog still accepts clear text" when S3.1 is Partly.
   - **Blind spots:** S1.3 or S16.2 Not realised.
   - **Search:** S9.1, S9.2, S10.1, S9.4 and S14.1 all Realised.
8. **Footer:** `SvcV-4 · 1 of 1 · Build <n>`.

**Themes:** use the OV theme tokens. The status dots and line colours must stay distinct in both themes.
**Print and pack:**
- The diagram scales to the page width, with no dimming.
- The allocation table follows on the next page.
- The controls are hidden.

## 4. Saved state

```js
state.builderSvcv4 = { notes: { 'S7.2': '' } }   // owner note per function, ≤ 200 chars
```

`builderSvcv4Clean1xx`:
- Accept only the 35 function IDs.
- Trim and cap each note at 200 chars.
- Drop empty notes.

An older file without `serviceFunctions` opens with no notes.

## Corrections to the mockup

- **SF-15 → S13:** derive the consumers from the authentication edges (S9 only on the reference).
- **S15.1:** the mockup gives the reason as "over entitlement on 4 of 7 days (SV-7)". The Builder can't see licence usage, so it marks Partly from the inferred interface instead. The status is the same on the reference topology; use the topology reason.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events; sweeps clean;
   - OV-1/2/3, TM-1, DIV-1, CV-1 and SvcV-6 unchanged;
   - perf, space and connector tools all pass.
2. **Reference topology:**
   - **35 functions:**
     - **Realised (16):** S3.2, S4.1, S4.2, S1.1, S2.1, S2.2, S7.2, S7.3, S7.4, S7.5, S9.1, S9.2, S9.4, S10.1, S5.1, S14.1.
     - **Partly (7):** S3.1, S1.2, S7.1, S7.6, S13.2, S15.1, S16.1.
     - **Planned (5):** S6.1, S8.1, S9.3, S10.2, S11.1.
     - **Not realised (7):** S1.3, S2.3, S12.1, S12.2, S13.1, S13.3, S16.2.
   - **Flows:** 17 drawn, SF-15 with one arrow (to S9).
   - **All five findings** appear.
3. **Default topology** (`syslogSource`, `syslog`, `uf`, `idx`):
   - **Realised:** S3.2, S1.1, S1.2, S7.1, S7.2 and S7.3, plus S3.1 when its edge has TLS and no UDP (otherwise Partly).
   - **Planned:** every other function, including S12.1 and S12.2 (no search tier).
   - **Flows:** only SF-01, SF-02 and SF-03.
   - **Findings:** no Response, Dead ends or Blind spots findings.
4. **Edits to the topology:**
   - Adding Heavy Forwarder 1 → Indexer 1 makes S2.3 Realised. S7.1 stays Partly until Universal Forwarder 2 also has an output.
   - Adding a `soarPlaybook` makes S13.2 Realised.
   - Deleting Windows Event Log 1 makes S1.3 Planned.
5. **Interaction:**
   - Selecting S9.2 lights SF-13 and SF-17 (from S16.1), but **not** S7.3.
   - Selecting S7.1 lights SF-03 and SF-06 only.
   - Each thread dims everything outside it; Esc clears.
6. **Layout:**
   - No function name or card header overflows its card (check each `getBBox` against its box).
   - No flow label overlaps another label.
   - No page-level sideways scroll at 400px or 768px; the diagram and table scroll inside their boxes.
7. **Save and load:** notes round-trip through save, reload and import; junk input loads cleaned.
8. **Pack:** SvcV-4 appears directly before SvcV-6, read-only; readable in dark and light.
9. **Records:** a `changeRegister` entry ("Adds SvcV-4 Services Functionality Description and the shared service function catalogue") and the build stamp.

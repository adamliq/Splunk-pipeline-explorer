# Builder handoff: add SvcV-1 (Services Context Description) and SvcV-2 (Services Resource Flow Description)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 170 (`builder-cv1-v170`) or later. Add one new block, `<script id="builder-svcv12-v1xx">`, for both pages. Use wrappers only.
**Mockups (the targets):**
- [`docs/mockups/architecture-svcv1-mockup.html`](mockups/architecture-svcv1-mockup.html), screenshot `docs/mockups/compare/svcv1-mockup.png`;
- [`docs/mockups/architecture-svcv2-mockup.html`](mockups/architecture-svcv2-mockup.html), screenshot `docs/mockups/compare/svcv2-mockup.png`.

**Test topology:** `docs/mockups/ov1-reference-topology.json` (load with `loadTopologyDocument`).

## Order of the services handoffs

These two pages are the foundation of the Services viewpoint. Build them **first**, then SvcV-3a/3b ([`builder-handoff-svcv3.md`](builder-handoff-svcv3.md)), SvcV-4 ([`builder-handoff-svcv4.md`](builder-handoff-svcv4.md)) and SvcV-6 ([`builder-handoff-svcv6.md`](builder-handoff-svcv6.md)).

The shared helpers are specified in the SvcV-6 handoff but belong in **this** build:
- **the service catalogue** (`builderServices1xx`, SvcV-6 section 1);
- **the service flows** (`builderServiceFlows1xx()`, SvcV-6 section 2);
- **the attribute resolver** (SvcV-6 section 3), exposed as `builderServiceFlowAttributes1xx(flow)`. It returns each attribute with its source: edited, topology, default or not set.

Put all three in this block; SvcV-6 then adds only its page and its editing.

Tab order for the viewpoint: **SvcV-1 · Services context**, **SvcV-2 · Flow description**, SvcV-3a, SvcV-3b, SvcV-4, **SvcV-6 · Flow matrix**. The SvcV-6 handoff has been updated to use that tab name.

## Where they go

| Step | SvcV-1 | SvcV-2 |
|---|---|---|
| Section | Wrap `builderOvSections135` once and add `svcv1: [builderSvcv1Page1xx(true)]` and `svcv2: [builderSvcv2Page1xx(true)]` | |
| Tab | "SvcV-1 · Services context" | "SvcV-2 · Flow description" |
| Active key | Add `'svcv1'` and `'svcv2'` to `builderOvShow135` (keep every existing key) | |
| Save / load | `doc.serviceCatalogue` ↔ `state.builderSvcv1`, through `builderSvcv1Clean1xx(raw)` | Nothing of its own. It reads the SvcV-6 attribute state when it exists, otherwise derived values and defaults |
| Pack | `sections.svcv1` / `packSections.svcv1`, default `true` | `sections.svcv2` / `packSections.svcv2`, default `true` |

Both pages are read-only in the pack and Print / PDF. Wrap `topologyDocument` and `loadTopologyDocument` for `serviceCatalogue`, as CV-1 does.

**Shared page furniture,** the same as the other architecture pages:
- banners;
- the five-cell title block (Viewpoint "Services (DoDAF V2.0)"; service owner from `state.builderCv1.owner` until a services owner field exists);
- the purpose line;
- the summary figures;
- findings;
- the footer `SvcV-n · 1 of 1 · Build <n>`.

Use the OV theme tokens. Each figure scrolls inside its box; the page never scrolls sideways.

---

## Part A: SvcV-1, Services Context Description

### A1. What it shows

The platform as a set of services, in layers from collection up to response. For each service it shows:
- what provides it;
- what it uses;
- who uses it;
- the interface it is reached on.

People and outside parties appear as **consumers**.

### A2. Content

**Services:** the 16 from `builderServices1xx`.
- **Provided by:**
  - the provider nodes' instance names, joined, for example "Syslog Server 1, 2" or "Universal Forwarder 1, 2";
  - for HEC, "HEC on Heavy Forwarder 1";
  - for a service no node provides, the component that would provide it, in muted text: Edge Processor, Indexer Cluster Manager, Search Head Cluster Deployer, Splunk Enterprise Security.
- **Status:** Deployed / Not deployed.

**Interface and availability target** are **edited** per service. The defaults are the mockup's values, for example "S2S 9997 · TLS" and "99.9%".

**Consumers:**

| ID | Consumer | Shown when | "Provided by" text |
|---|---|---|---|
| P1 | SOC analysts and responders | a search tier or `authUser` exists | "OV-4 team" |
| P2 | Detection engineering | a search tier exists | "OV-4 team" |
| P3 | Network devices | `syslogSource` exists | the source instance names |
| P4 | AWS workloads | a cloud or API source exists | the source instance names |
| P5 | Service desk | SOAR exists | "OV-4 team" |

**Dependencies** ("uses" / "used by") come from two places:
1. **Every service flow pair** from `builderServiceFlows1xx()`:
   - external ends map to P3 (SF-01), P4 (SF-04), P1 (SF-13) and P5 (SF-12);
   - the kind is **data** for the data plane and **supports** for platform flows;
   - the status is the flow's SvcV-6 status;
   - the label is the flow's data (for example "per-host files").
2. **Context dependencies** that are not service flows. Each is shown when its deployed end exists:

   | From → to | Kind | Label | Status |
   |---|---|---|---|
   | S6 → S7 | data | filtered events | Planned unless S6 is deployed **and** has a data edge to an indexing tier |
   | S7 → S8 | data | bucket copies | Planned unless S8 is deployed |
   | S11 → S9 | supports | search head cluster | Planned unless S11 is deployed |
   | S13 → P1 | data | cases | In place when SOAR exists |
   | S10 → P2 | data | data model coverage | In place |
   | S12 → P2 | data | detection tuning | Planned |

Saved state:

```js
state.builderSvcv1 = { services: { 'S7': {interface:'', availability:''} } }
```

`builderSvcv1Clean1xx`:
- Accept only the 16 service IDs.
- Cap `interface` at 60 chars and `availability` at 12.
- Drop empty values; a blank value falls back to the default.

### A3. Diagram (match the mockup)

- **SVG**, viewBox about 1200 × 600, minimum width 1000px.
- **Six horizontal layer bands,** 96px high, alternately tinted, labelled at top left:
  1. Consumers · People and external sources
  2. Detection and response
  3. Search
  4. Indexing
  5. Collection
  6. Platform and access
- **Boxes:** 150 × 46.
  - **Service box:** a 4px domain-colour bar on top, then "S7" (or "S12 · not deployed") in small mono, then the name over two lines (wrap at about 21 characters). When the name fits on one line, show the provider under it, truncated with "…".
  - **Not-deployed service:** a dashed amber border.
  - **Consumer box:** fully rounded and dotted, labelled "consumer".
- **x positions (left edge):**

  | Layer | Positions |
  |---|---|
  | Consumers | P1 140, P2 330, P3 520, P4 710, P5 900 |
  | Detection and response | S12 330, S13 710 |
  | Search | S9 140, S10 420, S11 710 |
  | Indexing | S7 330, S8 710 |
  | Collection | S3 140, S1 330, S6 520, S4 710, S2 900 |
  | Platform and access | S5 140, S14 330, S15 520, S16 710 |

  Hide a consumer that isn't shown (A2); always show the 16 services.
- **Dependency lines:**
  - **Between layers:** vertical cubic curves from box edge to box edge, offset ±14px by index so parallel lines separate.
  - **Within a layer:** straight horizontal lines.
  - **Styles:** data solid; supports dashed 5/4; planned or inferred dotted amber; missing dashed red; "In place, gap" drawn as in place, with the gap shown in the detail.
  - Arrowheads at the consuming end.
- **Selecting a service or consumer,** by click or Enter/Space:
  - highlights it, its dependencies and the boxes at their other ends, and dims the rest;
  - selects its catalogue row.
  - Selecting again or pressing Esc clears.

### A4. Detail, catalogue and findings

- **Detail:**
  - **No selection:** "n of 16 services deployed" and the list of those not deployed.
  - **Service:** its layer, provider and interface, Deployed chip, availability target, **Uses** and **Used by** (status chip, the other end and the label). The interface and availability are editable here.
  - **Consumer:** what it uses.
- **Service catalogue table,** grouped by layer, with the columns ID, Service, Provided by, Interface, Uses (IDs), Used by (IDs), Availability and Status. Clicking a row selects the service.
- **Summary:**
  - services, deployed;
  - not deployed (review colour);
  - consumers, dependencies;
  - missing and planned or inferred (review colour).
- **Findings** (generated; show each only when it applies):

  | Finding | Shown when |
  |---|---|
  | Dead end | A deployed service has data dependencies in but every outbound data dependency is Missing (reference: S2) |
  | Response | S13 is deployed and has no in-place data dependency in. Also say whether its output to P5 is missing |
  | Most used | The service with the most "used by" dependencies. Name its provider count. When it has one provider and its high-availability service is not deployed (S7 → S8, S9 → S11), name that service |
  | Not deployed | Any services are not deployed. List them with the component each needs |
  | Platform | S5 and S14 dependencies are all In place |

### A5. Expected on the reference topology

- **16 services:** 12 deployed; not deployed S6, S8, S11, S12.
- **Consumers:** 5.
- **Dependencies (25):** 19 from service flows (SF-15 gives S14 → S9 only) and 6 context dependencies.
- **Missing (2):** S2 → S7 and S13 → P5.
- **Planned or inferred (10):** S9 → S12, S10 → S12, S12 → S13, S7 → S15, S16 → S7, S16 → S9, S6 → S7, S7 → S8, S11 → S9, S12 → P2.
- **Most used:** S7 Indexing, with 4 consumers (S8, S9, S10, S15), one provider (Indexer 1) and S8 not deployed.
- **Findings:** all five appear.

**Default topology** (`syslogSource`, `syslog`, `uf`, `idx`):
- **Deployed (3):** S3, S1, S7. The other 13 are not deployed.
- **Consumers:** P3 only.
- **Dependencies:** P3 → S3, S3 → S1, S1 → S7, S7 → S8 (planned) and S6 → S7 (planned).
- **Findings:** no Dead end or Response finding.

---

## Part B: SvcV-2, Services Resource Flow Description

### B1. What it shows

The data each service passes to the next, end to end:
- what is exchanged and on which interface;
- how much and how fast;
- how it is protected.

**Data flows** are drawn as a pipeline. **Platform flows** are listed as cards. All flows are in one register table.

### B2. Content

- **Flows:** `builderServiceFlows1xx()` (17 on the reference). **Every attribute** comes from `builderServiceFlowAttributes1xx`:

  | SvcV-2 field | From |
  |---|---|
  | Data | Data (DIV-2) |
  | Protocol · port | The OV-2 transport formatter (`builderOv2Transport133`) on the carrying edge; "Internal" for internal flows; the default text for inferred ones |
  | GB/day today → target | Today and target |
  | Latency | Latency |
  | Security | Confidentiality, Integrity and Authentication joined with ", ", leaving out "—" values. "None" or "Not set" in any part shows in the stop colour |
  | Implements | The carrying interfaces, then " · " and the OV-3 RF IDs |
  | Status, note | SvcV-6 status and reason |

  Values from the topology appear in normal text and defaults in muted text. Editing happens on SvcV-6; on SvcV-2, an "Edit in SvcV-6" link in the detail opens that tab with the flow selected.
- **Needs attention:** the SvcV-6 rule.

### B3. Pipeline diagram (match the mockup)

- **SVG**, viewBox about 1200 × 270. **Two rows:** A at y 40 and B at y 150. **Columns** at x = 20 + col × 148. **Boxes** are 130 × 46.

  | Column | Row A | Row B |
  |---|---|---|
  | 0 | Network devices | AWS workloads |
  | 1 | S3 | S4 |
  | 2 | S1 | S2 |
  | 3 | S7 | |
  | 4 | S9 | SOC analysts |
  | 5 | S12 | S10 |
  | 6 | S13 | |
  | 7 | Service desk | |

  Show a box when any flow returned touches it. Externals are fully rounded. Services have the domain bar. Not-deployed services have a dashed amber border and "S12 · not deployed".
- **Data flows only.** Straight lines between neighbours, plus these routes:

  | Flow | Route |
  |---|---|
  | SF-06 | Row B → right of S2 → up into the bottom of S7 |
  | SF-08 | Down from S7 → along under row B → up into S10 |
  | SF-10 | Up from S10 into S12 |
  | SF-13 | Down from S9 into SOC analysts |

  Line styles by status:
  - in place: solid;
  - gap: dashed 6/3 amber;
  - planned: dotted amber;
  - missing: dashed red.

  Each flow carries a pill tag with its number ("06") at the middle of its longest segment, nudged up when the segment is short. Lines and tags are clickable, with a wide transparent hit path.
- **Platform flow cards** under the figure (heading "Platform flows"): one button per platform flow showing:
  - "SF-14 · S5 Deployment → S1, S2";
  - the data in bold;
  - "protocol · in place / planned or inferred".

  The left border is in the govern colour when in place and amber otherwise.
- **Selection:**
  - **A flow** (line, tag, card or table row) highlights its line and the boxes at both ends.
  - **A service or external box** highlights the box, every flow in or out of it, and the boxes at their other ends.
  - The rest dims, and the matching cards and rows are marked.
  - Selecting again or pressing Esc clears.

### B4. Detail, register and findings

- **Detail:**
  - **No selection:** "n of N service flows in place", and the flows with a gap or missing.
  - **Flow:** the plane, "producer → consumer", data, protocol, status chip, volume today and target, latency, security, "Implemented by" and the note.
  - **Service:** **Receives** and **Sends**, each flow with its data and status chip, plus the Not deployed chip where it applies.
- **Filter buttons** above the table, each with its count: All flows · Data · Platform · Needs attention.
- **Register table:** Flow, From → to, Data, Protocol · port, GB/day today → target (right-aligned; "—" for none), Latency, Security, Implements, Status. Clicking a row selects the flow.
- **Summary:**
  - service flows, data, platform, in place;
  - with a gap, planned or inferred, and missing (review colour).
- **Findings** (generated; show each only when it applies):

  | Finding | Shown when |
  |---|---|
  | Volume lost | SF-03 has a gap or SF-06 is missing. Compare the volume entering (SF-01 and SF-04 today and target) with the volume reaching S7 (SF-03, plus SF-06 when in place). When volumes are "Not set", state the flows without numbers |
  | Response | Any of SF-09 to SF-12 is not In place. Say which need Enterprise Security and which have no interface |
  | Protection | Any data flow's Security starts with "None". List them |
  | Platform | Any platform flow is only inferred (SF-16, SF-17). Ask for the edges to be added |
  | Search | SF-07 and SF-13 are both In place |

### B5. Expected on the reference topology

- **Flows:** 17 (13 data, 4 platform).
- **Status:** 8 in place; 2 with a gap (SF-01, SF-03); 5 planned or inferred (SF-09, 10, 11, 16, 17); 2 missing (SF-06, SF-12).
- **Diagram:** 13 boxes, S12 not deployed, 13 data lines.
- **Platform cards:** 4. SF-15 reads "S14 SAML sign-in → S9".
- **Needs attention:** includes SF-01 (security "None"), SF-12 (security "Not set") and every flow not in place.
- **Findings:** all five appear. The Volume lost figures follow the OV-3 Volume column.

**Default topology:**
- **Flows:** 3 (SF-01, SF-02, SF-03), all data; no platform cards.
- **Diagram:** Network devices, S3, S1 and S7 only.
- **Findings:** only Protection, when SF-01 is UDP. No Volume lost, Response or Search finding.

---

## Corrections to the mockups

- **SvcV-1 and SvcV-2, SF-15:** both mockups draw S14 → S13. Derive the consumers from the authentication edges, which gives S9 only on the reference topology. SvcV-1 then has 25 dependencies, not 26.
- **SvcV-1, "Correction" finding:** the mockup says CV-7 wrongly shows S16 as not deployed. That note is about the static mockups. Don't generate it; the Builder's catalogue rule already marks S16 as deployed when a `monitoringConsole` exists.
- **SvcV-2, interface IDs:** "Implements" shows edge names and RF IDs until SV-1 exists, as in the SvcV-6 handoff.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events; sweeps clean;
   - OV-1/2/3, TM-1, DIV-1 and CV-1 unchanged;
   - perf, space and connector tools all pass.
2. **Shared helpers:**
   - `builderServices1xx`, `builderServiceFlows1xx()` and `builderServiceFlowAttributes1xx` exist on `window`.
   - On the reference topology they give the counts in the SvcV-6 handoff's checks.
3. **SvcV-1:** the counts in A5. Selecting S7 highlights S1, S2, S6, S8, S9, S10, S15 and S16 and their lines.
4. **SvcV-2:** the counts in B5.
   - Selecting SF-06 highlights the S2 → S7 route and both boxes.
   - The Platform filter shows 4 rows.
   - "Edit in SvcV-6" opens SvcV-6 on that flow, once SvcV-6 exists; until then the link is hidden.
5. **Edits to the topology:**
   - Adding Heavy Forwarder 1 → Indexer 1 turns SF-06 and S2 → S7 In place on both pages and removes the Dead end finding.
   - Adding a `shcMember` pair marks S11 deployed and turns S11 → S9 In place.
6. **Save and load:**
   - SvcV-1 interface and availability edits round-trip through save, reload and import.
   - An older file without `serviceCatalogue` opens with defaults.
   - Junk input loads cleaned.
7. **Layout:**
   - No service name or provider text overflows its box (check each `getBBox`).
   - No flow tag overlaps another.
   - No page-level sideways scroll at 400px or 768px; dark and light both readable.
8. **Pack:**
   - SvcV-1 and SvcV-2 appear first in the Services viewpoint, read-only.
   - In print, nothing is dimmed and the register follows its figure.
9. **Records:** a `changeRegister` entry ("Adds SvcV-1 Services Context and SvcV-2 Services Resource Flow Description, with the shared service catalogue, service flows and attribute resolver") and the build stamp.

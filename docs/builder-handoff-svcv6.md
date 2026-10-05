# Builder handoff: add SvcV-6 (Services Resource Flow Matrix)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 170 (`builder-cv1-v170`). Add one new block, `<script id="builder-svcv6-v1xx">`. Use wrappers only.
**Mockup (the target):** [`docs/mockups/architecture-svcv6-mockup.html`](mockups/architecture-svcv6-mockup.html), screenshot `docs/mockups/compare/svcv6-mockup.png`. The column groups, filters, row detail and "Carried by" grid all work in it.
**Test topology:** `docs/mockups/ov1-reference-topology.json` (load with `loadTopologyDocument`).

## What SvcV-6 is

In DoDAF V2.0, SvcV-6 is the **Services Resource Flow Matrix**. It has one row per resource flow between services, with the attributes a service owner commits to:
- what is exchanged and in what format;
- how often, how much and how fast, and at what service level;
- how the flow is protected and handled.

Each flow also names the system interfaces that carry it and the OV-3 operational flow it realises.

The Builder has no services pages yet, so this build adds two **shared helpers** as well as the page:
- a service catalogue (SvcV-1's list);
- service flows (SvcV-2's list).

SvcV-1, 2, 3a, 3b, 4 and 5 will reuse both helpers later. **Don't build those pages here.**

Like CV-2, the page mixes **derived** and **edited** content:
- **From the Builder:** which flows exist, their status, and the attributes the relationships already hold (transport, TLS, acknowledgement, authentication, latency, volume, classification).
- **From the owner:** data, format, frequency, the target volume, the service level, and the handling rule where the topology can't supply them.

## Where it goes

Follow the CV-1 pattern (`builder-cv1-v170`):

| Step | SvcV-6 |
|---|---|
| Section | Wrap `builderOvSections135` again and add `svcv6: [builderSvcv6Page1xx(true)]` |
| Tab | "SvcV-6 · Service flows", after the last CV tab. Later services tabs go next to it |
| Active key | Add `'svcv6'` to `builderOvShow135` (keep every existing key) |
| Save / load | `doc.serviceFlowAttributes` ↔ `state.builderSvcv6`, through `builderSvcv6Clean1xx(raw)`. Wrap `topologyDocument` and `loadTopologyDocument` as CV-1 does |
| Pack | `state.builderExport.sections.svcv6` / `exportPreferences.packSections.svcv6`, default `true`; read-only in the pack and Print / PDF |

## 1. Service catalogue (shared): `window.builderServices1xx`

Sixteen services, fixed IDs and names, matching the SvcV-1 mockup. A service is **deployed** when at least one node of a listed type exists. Match on `builderComponents` keys. The keys below are the ones used by the reference topology and the CV-2 handoff; check any others against `builderComponents` and match by category if a key differs.

| ID | Service | Layer | Deployed when the topology has |
|---|---|---|---|
| S1 | Universal forwarding | Collection | `uf` |
| S2 | Heavy forwarding and parsing | Collection | `hf` |
| S3 | Syslog reception | Collection | `syslog` |
| S4 | HTTP Event Collector | Collection | a node whose data parent is a cloud or API source (`awsLambda`, `azureFunction`, `apiSource`, `hecClient`) |
| S5 | Deployment | Platform and access | `ds` |
| S6 | Edge pipelines | Collection | `edgeProcessor` or `ip` |
| S7 | Indexing | Indexing | any indexing tier (`idx`, `indexerCluster`, `cloudIndexer148`) |
| S8 | Index replication | Indexing | `indexerCluster` or `indexerClusterManager` |
| S9 | Search and REST API | Search | any search tier (`search`, `shcMember`, `cloudSearchTier`) |
| S10 | Data model acceleration | Search | any search tier |
| S11 | Search head clustering | Search | `shcCluster` or two or more `shcMember` |
| S12 | Correlation and risk | Detection and response | never (no Enterprise Security component) |
| S13 | Cases and playbooks | Detection and response | any SOAR type (`soarCloud`, `soar`, `soarPlaybook`) |
| S14 | SAML sign-in | Platform and access | any authentication provider (`authProviderCloud`, `authProvider`) |
| S15 | Licence management | Platform and access | `licenseManager` |
| S16 | Platform monitoring | Platform and access | `monitoringConsole` |

Each service also returns the nodes that provide it (`providers: [node]`). SvcV-3a needs this later.

**External parties** are not services. They are consumers and producers outside the platform:
- Network devices (`syslogSource`);
- AWS workloads (cloud and API sources);
- SOC analysts (`authUser`);
- Service desk (no component; always the consumer of SF-12).

## 2. Service flows (shared): `window.builderServiceFlows1xx()`

The function returns the flows below **in this order with these IDs**. A flow appears only when the service on its **deployed side** exists:
- the producer for SF-09 to SF-12;
- otherwise both ends.

Each flow lists the edges that carry it. Edges come from `builderTraceEdges('all')`, with their details from `ensureRelationshipDetails(edge.edge)`.

| ID | Producer → consumer | Plane | Carried by | Status rule |
|---|---|---|---|---|
| SF-01 | Network devices → S3 | data | data edges `syslogSource` → `syslog` | **In place, gap** if any carrying edge's protocol allows UDP or its TLS is not Required/Enabled **and** the pack classification includes PII; else In place |
| SF-02 | S3 → S1 | data | `syslog` → `uf` | In place |
| SF-03 | S1 → S7 | data | `uf` → indexing tier | In place if every `uf` reaches an indexing tier; **In place, gap** if some do; **Missing** if none |
| SF-04 | AWS workloads → S4 | data | cloud source → its receiver | In place |
| SF-05 | S4 → S2 | data | none: internal to the HEC receiver | In place when the receiver is an `hf` |
| SF-06 | S2 → S7 | data | `hf` → indexing tier | As SF-03, over `hf` nodes |
| SF-07 | S7 → S9 | data | indexing tier → search tier | In place |
| SF-08 | S7 → S10 | data | none: internal | In place when S7 and S10 both exist |
| SF-09 | S9 → S12 | data | none | **Planned** (S12 never exists) |
| SF-10 | S10 → S12 | data | none | Planned |
| SF-11 | S12 → S13 | data | inferred search → SOAR interface | Planned, shown when S13 exists |
| SF-12 | S13 → Service desk | data | none | **Missing**, shown when S13 exists |
| SF-13 | S9 → SOC analysts | data | the authentication edge from the provider into the search tier | In place when a user reaches the search tier through a provider |
| SF-14 | S5 → S1, S2 | platform | management edges from `ds` | In place. The consumers are the services of the client nodes |
| SF-15 | S14 → S9, S13 | platform | authentication edges to and from the provider (user → provider, provider → search tier) | In place. The consumers come from the edges: on the reference topology that is **S9 only** (the mockup's S13 is example content) |
| SF-16 | S7 → S15 | platform | inferred `licenseManager` ↔ indexer interface | Planned (inferred) unless a management edge exists |
| SF-17 | S16 → S7, S9 | platform | inferred `monitoringConsole` → indexer and search interface | Planned (inferred) unless management edges exist |

**Interfaces.** The Builder has no SV-1 page, so it has no `SI-n` numbers.
- **"Carried by"** lists each edge as "Universal Forwarder 1 → Indexer 1", with its OV-3 `RF-nn`. Take the RF ID from `builderOv2Model133().flows`, matching on `flow.edge`.
- **Pseudo-interfaces.** Add two kinds, styled like the mockup's missing and inferred cards:
  - **missing:** each `uf` or `hf` with no downstream indexing tier, labelled "Universal Forwarder 2 → indexer (missing)";
  - **inferred:** search → SOAR, licence manager → indexer, and Monitoring Console → indexer and search, each when both ends exist and no edge connects them.
- When SV-1 is added, swap the edge labels for its `SI-n` IDs.
- **Internal flows** (SF-05, SF-08) show "Inside one system". Their OV-3 is the RF of the edge into the same node.

## 3. Attributes

Use this precedence:
1. a value the owner edited;
2. a value derived from the carrying edges;
3. the mockup's default text for that flow;
4. "Not set".

Mark derived values "(from topology)" in muted text, and defaults "(default)". When a flow has several carrying edges, use the **worst** value: the highest latency, the lowest availability, and the weakest TLS or acknowledgement.

| Group | Column | Source |
|---|---|---|
| Exchange | Data (DIV-2) | Edited; default from the mockup's `F` data |
| | Format | Edited; default from the mockup |
| | Interfaces | Section 2 |
| | OV-3 | Section 2 |
| | Status | Section 2 |
| Performance | Frequency | Management: `relation.phoneHomeSeconds` → "Phone-home every n s"; otherwise edited, with the mockup default |
| | GB/day today | The OV-3 Volume value of the carrying edge (the Build 137 capacity split; event data only). Internal flows inherit the edge into the node. Platform flows: "Not set" unless edited |
| | GB/day target | Edited |
| | Average bytes | Edited (mockup default) |
| | Events/s | Derived: GB/day × 10⁹ ÷ bytes ÷ 86 400, today and target |
| | Latency | `latencySloSeconds` of the edge → "≤ n s"; edited for flows with no edge |
| | Service level | The OV-3 availability rule (`builderOv3Availability139`): the edge's SLO for event data; **"Not set"** for planned flows and for platform flows unless given |
| Security | Classification | The OV-3 classification rule: `flowClassification`, else the pack classification for event data, else "Internal (default)" |
| | Confidentiality | `tls` Required/Enabled → "TLS 1.2+"; UDP in `protocol` → "None (UDP n)"; "File handoff" → "Local disk"; internal → "Same instance"; else "Not set" |
| | Integrity | The OV-3 integrity rule: acknowledgement or queue, never "Application response" or "Session established" |
| | Authentication | `authenticationType` when set (not "Not specified" or "Not applicable"); else "Not set" |
| | Handling | Edited; default to the pack's PII caveat on PII flows |

**Saved state:**

```js
state.builderSvcv6 = {
  flows: {
    'SF-03': {data:'', format:'', frequency:'', target:'', bytes:'', latency:'', serviceLevel:'', handling:''}
  }
}
```

**`builderSvcv6Clean1xx`:**
- Accept only the 17 flow IDs and these 8 fields.
- Cap each text value at 80 chars.
- `target` and `bytes` must parse as non-negative numbers, or they're dropped.
- Ignore stored values for derived fields.

**Load example** (as in CV-1) fills the mockup's example values.

**Needs attention** is true for a flow when any of these holds:
- its status is not In place;
- any attribute shows "Not set";
- Confidentiality starts with "None".

## 4. Page layout (match the mockup)

1. **Header:** banners and title block ("SvcV-6 · Services Resource Flow Matrix"; service owner from `state.builderCv1.owner` until a services owner field exists), the purpose line and the summary figures:
   - service flows;
   - flows carrying PII;
   - in place;
   - gap, planned or missing (review colour);
   - attributes not set (review colour);
   - flows with no system interface.
2. **Toolbar:**
   - column-group segmented buttons: Exchange / Performance and service level / Security and handling;
   - plane chips: All / Data / Platform;
   - a "Needs attention only" toggle.
3. **Matrix:**
   - The sticky first column holds the flow ID, "producer → consumer" and the plane.
   - The group columns follow, with numbers right-aligned in tabular figures and "Not set" chips in the review style.
   - It scrolls inside its own wrapper; the page never scrolls sideways.
4. **Detail panel** beside the matrix, below it on narrow screens. It shows every attribute for the selected flow, with edited fields as inputs. With no row selected, it lists "attributes not set" per flow. Esc clears.
5. **"Carried by" grid:** one card per edge or pseudo-interface, listing the flows on it; missing interfaces in red, inferred ones in amber.
6. **Findings**, generated from these rules (shown only when they apply):
   - **Not designed:** a Missing flow with no interface (SF-12).
   - **Service level:** the count of flows whose Service level is "Not set".
   - **Handling:** more than one distinct Handling value across the PII data flows SF-01, SF-03 and SF-06.
   - **Internal flows:** the count of flows with no edge, split into internal, inferred and not designed.
   - **Coverage:** any edge that carries no flow (an orphan interface); otherwise "every interface carries at least one flow".
7. **Footer:** `SvcV-6 · 1 of 1 · Build <n>`.

**Themes:** use the OV theme tokens.

## Corrections to the mockup

- The **interface IDs** are SV-1 `SI-n` in the mockup. Use edge names and RF IDs until SV-1 exists.
- **SF-15** lists S13 in the mockup. Derive its consumers from the authentication edges instead.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events; sweeps clean;
   - OV-1/2/3, TM-1, DIV-1 and CV-1 unchanged;
   - perf, space and connector tools all pass.
2. **Reference topology:**
   - **17 flows**, in the order SF-01 to SF-17.
   - **In place (8):** SF-02, 04, 05, 07, 08, 13, 14, 15.
   - **In place, gap (2):** SF-01 (UDP syslog with PII) and SF-03 (Universal Forwarder 2 has no output).
   - **Planned or inferred (5):** SF-09, 10, 11, 16, 17.
   - **Missing (2):** SF-06 (Heavy Forwarder 1 has no output) and SF-12.
   - **13** flows carry PII (SF-01 to SF-13).
   - **Pseudo-interfaces:** two missing (Universal Forwarder 2 → indexer, Heavy Forwarder 1 → indexer) and four inferred (search → SOAR, licence manager → indexer, Monitoring Console → indexer, Monitoring Console → search).
   - All 12 real edges carry at least one flow.
3. **Default topology** (`syslogSource`, `syslog`, `uf`, `idx`):
   - **3 flows:** SF-01, SF-02 and SF-03.
   - SF-03 is In place.
   - SF-01 is In place, gap only when its edge allows UDP and the classification includes PII.
4. **Edits to the topology:**
   - Adding a data edge Heavy Forwarder 1 → Indexer 1 turns SF-06 In place and removes its missing card.
   - Adding Universal Forwarder 2 → Indexer 1 turns SF-03 In place.
   - Deleting the SOAR node removes SF-11 and SF-12.
5. **Derived values:**
   - No platform flow shows a GB/day figure unless one is edited.
   - Events/s equals GB/day × 10⁹ ÷ bytes ÷ 86 400, rounded.
   - No Integrity cell contains "response" or "established".
6. **Save and load:**
   - Edited attributes round-trip through save, reload and import.
   - An older file without `serviceFlowAttributes` opens with defaults.
   - Junk input loads cleaned.
7. **Pack and themes:**
   - The pack and Print / PDF include SvcV-6, read-only; in print all three column groups appear as stacked tables with the flow column repeated.
   - Dark and light themes are both readable; no page-level sideways scroll at 400px or 768px.
8. **Records:** a `changeRegister` entry ("Adds SvcV-6 Services Resource Flow Matrix and the shared service catalogue and service flows") and the build stamp.

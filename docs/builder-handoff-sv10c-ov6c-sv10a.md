# Builder handoff: add SV-10c and OV-6c (event traces) and SV-10a (rules by system)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 193 (`builder-review-v193`). It has all the models these views read:
- SV-1 (`builderSystemModel1xx()`);
- OV-2 and OV-3 (`builderOv2Model133()`, `builderOv3Timeliness139()`);
- Validate's rules (`evaluateArchitectureRules()`).

**One new block:** `<script id="builder-traces-rules-v1xx">`, with wrappers only.
**One in-place edit:** the plurals in two threat-model rule texts (section 6).
**Mockups (the targets):** these replace the Build 167 mockups, whose content was fixed text.

| Mockup | Screenshot | Scenes |
|---|---|---|
| [`architecture-sv10c-mockup.html`](mockups/architecture-sv10c-mockup.html) | `compare/sv10c-mockup.png` | reference, zoned (through a syslog load balancer), default (no search head) |
| [`architecture-ov6c-mockup.html`](mockups/architecture-ov6c-mockup.html) | `compare/ov6c-mockup.png` | reference, default |
| [`architecture-sv10a-mockup.html`](mockups/architecture-sv10a-mockup.html) | `compare/sv10a-mockup.png` | reference (Splunk Enterprise), zoned (Splunk Enterprise), reference (Hybrid) |

**Tested first:** the three models were prototyped on a copy of Build 193. The mockups' data and the expected results under "Check before uploading" come from that run.

## What the three views are

- **SV-10c · Systems Event-Trace Description.** One syslog event, from the source of SI-1 to the search head that finds it, one SV-1 interface per step. On the reference topology that's SI-1 to SI-4:
  - Firewalls and network devices → Syslog Server 1;
  - → Universal Forwarder 1;
  - → Indexer 1;
  - → Search Head 1.

  Each step shows its protocol, port, TLS and latency target. A running total gives when the event should be searchable and when a search can find it.
- **OV-6c · Operational Event-Trace Description.** The same event, through:
  - the OV-2 operational nodes that handle it;
  - the OV-3 resource flows between them.

  Each step names the activity at the receiving node and the SV-1 interface that carries the flow, with that interface's port, TLS and latency target.
- **SV-10a · Systems Rules Model.** The rules Validate checks for the active profile, by system. A matrix has systems as rows and rules as columns. Each mark means the rule binds that system, and shows its result. The rules and results are Validate's; this view adds the systems each rule binds.

**All three are derived. They add no saved state** apart from their pack switches.

## Where they go

**Tabs:**
- OV-6c after OV-5a;
- SV-10a, then SV-10c, after SV-6.

**Title block:**

| | SV-10c | OV-6c | SV-10a |
|---|---|---|---|
| Viewpoint | Systems · DoDAF V2.0 | Operational · DoDAF V2.0 | Systems · DoDAF V2.0 |
| Owner label | System owner | Owner / author | System owner |
| Footer, left | Interfaces from SV-1 · latency targets from each link | Nodes from OV-2 · flows from OV-3 · interfaces from SV-1 | Rules and results from Validate · systems from SV-1 |

**Pack:**
- Pages in the same order as the tabs.
- **Switches:**
  - labelled "SV-10a Systems Rules Model", "SV-10c Systems Event-Trace Description" and "OV-6c Operational Event-Trace Description";
  - saved in `exportPreferences.packSections` as `sv10a`, `sv10c` and `ov6c`;
  - an older file opens with them on.
- **Print copies:**
  - the diagrams as SVG;
  - no buttons or scene controls;
  - the steps and rules tables in full.

**AV-1's registry:**

| View | Viewpoint | Name | Answers | Content |
|---|---|---|---|---|
| OV-6c | Operational | Operational Event-Trace Description | How does one event pass between operational nodes? | Generated |
| SV-10a | Systems | Systems Rules Model | Which rules bind each system? | Generated |
| SV-10c | Systems | Systems Event-Trace Description | How does one event travel through the systems? | Generated |

**AV-1's issue lists:**
- I-02 (personal information in the clear): add SV-10c and OV-6c;
- I-05 (architecture rules fail): add SV-10a;
- I-08 (links with no port): add SV-10c.

## 1. The trace (`builderEventTrace1xx()`)

**Interfaces:** the event-data interfaces of `builderSystemModel1xx()`, in SI order.

**Start:** the source system of the first one (SI-1).

**Each step:**
- From the current system, take the first event-data interface, in SI order, whose target hasn't been visited.
- A missing interface has no target and still counts.
- Inferred interfaces are followed and drawn as planned.

**Stop:**
1. **At a search head** (`search`, `searchHead`, `shcMember`, `shcCluster`, `cloudSearchTier`, `cloudEsSearchHead`): the trace is complete.
2. **After a missing interface:** "The event stops at `<system>`: it has no output to an indexer (`<SI>` missing)."
3. **With no next interface,** at an indexer (`idx`, `indexerCluster` or Splunk Cloud indexing): "`<system>` indexes the event, but no search head in the topology searches it."
4. **With no next interface,** anywhere else: "The event stops at `<system>`: it has no outgoing event-data interface."
5. **With no event-data interface at all:** "There is no event-data interface in SV-1, so there is nothing to trace."

**Milestones:**
- **Searchable:** the first step whose target is an indexer.
- **Found by a search:** the step that reaches the search head.

**Step fields:**

| Field | From |
|---|---|
| Interface, from, to | the SV-1 interface |
| Protocol, port, usual port, TLS, status, same host (`local`) | the SV-1 interface |
| Resource flow | the interface's `rf` |
| Latency target | the link's `latencySloSeconds` when above 0, else Not set |
| Running total | the sum of the targets so far |
| Pulled | the interface's SV-2 connection is opened by its target, for example the search head opening SI-4 |
| At the receiver | the target component's catalogue stages |

**Missing targets:** once a step has no latency target, later totals are lower bounds and read "≥ T+…".

**Times:** "45 s", "1 min", "2 min 30 s". Running totals read "T+1 min".

## 2. SV-10c page

**Layout:** title block, purpose, summary, legend, the sequence diagram, a detail panel, the steps table, findings. See the mockup.

**Purpose:** "One syslog event, traced from the system where it starts to the search head that finds it. Each step is an SV-1 interface with its protocol, port and TLS, and the latency target recorded on the link. The running total on the left shows when the event should be searchable, and when a search can find it."

**Summary:**
- systems;
- steps;
- "T+`<t>` searchable" and "T+`<t>` found by a search", or "— no search head";
- "`<n>` without TLS";
- "`<n>` ports not set".

**Diagram:**
- **Lifelines:** the trace's systems in order. Each header has the name (up to two lines), the component and the location.
- **Running total:** the left column.
- **Message label:** "`<SI>` · `<protocol>` · `<port>`". The port is the number, or "`<usual>` (not set)", or "same host".
- **Line under the message:** "TLS `<value>` · target ≤ `<t>`". A same-host step has no TLS part.

**Message styles:**

| Step | Line |
|---|---|
| Declared | solid, event-data colour |
| Same host (file handoff) | dotted |
| Plaintext | stop colour |
| Port not set or inferred | review colour |
| Missing | dashed, stop colour |

**Pulled steps** take two rows:
1. **The request:** from the receiver back to the sender. "`<SI>` · search request · `<port>`", then "opened by `<receiver>` · TLS `<value>`".
2. **The reply:** "results with the event", with the target and the running total.

**Notes:**
- At each receiver, its stages.
- Up to three stages wrap at about 26 characters.
- More than three read "`<first>` → …", then "→ `<last>` (`<n>` stages)".
- At the last lifeline, the note sits to the left.

**Markers:**
- **Milestones:** a dotted line across the diagram, labelled "Searchable at `<indexer>` · T+`<t>`" and "Found by a search at `<search head>` · T+`<t>`".
- **Stop:** a cross on the last lifeline, with "No search head searches it" or "The event stops here".

**Interaction:** selecting a message or a table row selects the step. Esc clears.

**Steps table:**

| Column | Content |
|---|---|
| Step | the number |
| Interface | the SI |
| From → to | the two systems, plus "opened by `<receiver>`" for a pulled step |
| Protocol | "File handoff" for a same-host step |
| Port | the number; "`<usual>` (usual; not set)" in the review colour; "— (same host)" |
| TLS | the value; "None" in the stop colour when Plaintext; "Not needed (same host)" |
| Latency target | "≤ `<t>`", or Not set in the review colour |
| Running total | "T+`<t>`", or "≥ T+`<t>`" |
| Status | the SV-1 status chip |

**Detail panel:**
- **Nothing selected:**
  - "`<first system>` to `<last system>`";
  - "`<n>` steps across `<m>` systems";
  - the milestones, with "if each step meets its latency target";
  - the stop text;
  - a "Needs attention" list of steps whose status isn't ok.
- **A step selected:**
  - protocol, port, TLS, latency target and running total;
  - the receiver's stages and the resource flow;
  - buttons "Open `<SI>` in SV-1" and "`<RF>` in OV-6c".

**Findings,** each only when it applies:

| Chip | Text |
|---|---|
| Timing | "**If every step meets its latency target, the event is searchable at `<indexer>` within `<t>` and found by a search at `<search head>` within `<t>`.**" Add "Every step has a `<t>` target." when all are equal. |
| No TLS | "**`<SIs>` carries/carry the event without TLS.** Use syslog over TLS on 6514, or keep the hop inside one network zone." |
| Port not set | "**`<SIs>` has/have no port set.** The trace assumes `<usual ports>`. Set it/them on the link(s) in the Builder." |
| Search | "**`<search head>` opens the last connection (`<SI>`).** The event reaches it only when a search runs, so the search schedule adds to the time to detect." |
| Same host | "**`<SIs>` is a file handoff / are file handoffs on one host,** with no network, port or TLS." |
| Load balancer | "**The event passes through `<load balancers>`,** which adds a step and its own latency target." |
| No target | "**`<SIs>` has/have no latency target,** so the running total from step `<n>` is a lower bound." |
| No search head / Stops | the stop text |

## 3. OV-6c page (`builderOperationalTrace1xx()`)

**Model:** the trace from section 1, with each step mapped to the OV-3 flow named by its interface's `rf`:
- **From `builderOv2Model133().flows`:** the flow's needline, its from and to nodes (`needline.from`, `consumers[0]` or `needline.to`), and the activity (`details.activitySupported` or the receiving node's activity).
- **From `builderOv3Timeliness139(flow)`:** OV-3's timeliness.

**Lifelines:** the OV-2 nodes, in order of first appearance. Each header has:
- "`<ON>` · `<name>`";
- the trace's systems in that node;
- the node's activity.

**Messages:**
- **A flow whose needline is internal ("— (internal to ON-n)"):** a self-message, "`<RF>` · inside `<node>`".
- **Other flows:** an arrow, "`<RF>` · `<needline>` · `<carried data>`" (the interface's DIV-2 entities, for example "Event").
- **Line under the message:** "`<SI>` · `<port>` · TLS `<value>` · ≤ `<t>`".
- **Pulled steps:** request and reply, as in SV-10c.

**Notes:** the receiving node's activity, once per node.

**Latency targets:** the same as SV-10c, the carrying interface's.
- OV-3 gives search flows no timeliness, because they run on demand. So where OV-3 reads "Not set" and the interface has a target, the table adds "OV-3: not set" under the target.
- A finding explains it (below).

**Summary:**
- operational nodes;
- resource flows;
- "inside one node";
- the two milestones;
- "carried without TLS".

**Steps table columns:**
- step;
- resource flow, with "needline `<N>`" or "inside one node" under it;
- from → to (nodes);
- activity at the receiver;
- carried by (SI and systems);
- port, TLS, latency target and running total, as SV-10c.

**Detail panel:**
- **Nothing selected:** the nodes on the trace, with activity and systems.
- **A step selected:**
  - needline, activity, carrying interface, port and TLS, target and total;
  - buttons "`<RF>` in OV-3" and "`<SI>` in SV-10c".

**Findings:**

| Chip | Text |
|---|---|
| Timing | as SV-10c, with "flow" for "step" |
| Nodes | "**The event crosses `<n>` operational nodes in `<m>` resource flows.** `<RFs>` stays/stay inside `<nodes>`." |
| Timeliness | "**OV-3 gives `<RFs>` no timeliness,** because searches run on demand. The trace uses `<SIs>`'s latency target instead." |
| No TLS | "**`<RFs>` is/are carried without TLS** (`<SIs>`)." |
| Port not set | "**`<RFs>` is/are carried by interface(s) with no port set** (`<SIs>`)." |
| No search node / Stops | the stop text |

## 4. SV-10a page (`builderRulesBySystem1xx()`)

**Rules:**
- `evaluateArchitectureRules()`: the active profile's rules, as Validate shows them.
- A disabled rule reads Disabled.
- The threat-model rules TM-OPEN-HIGH and TM-OWNER are included.

**Systems:** SV-1's systems, grouped by location in SV-3's order.

**Scope:** each rule binds the systems below.
- Use the global helpers:
  - `builderTraceEdges`;
  - `builderIsCloudIndexer148`;
  - `builderIsSplunkManaged176`;
  - `builderIsStackComponent176`;
  - `builderIsCloudReceiver176`;
  - `builderLbMembers`;
  - `builderLbClients`.
- "Ends of" means both systems of each such link.
- A system the rule flags (`nodes`) is in scope, even when this table misses it.

| Rule | Binds | Systems |
|---|---|---|
| AR-001 | Production forwarders that need Deployment Server management | `uf`/`hf`, environment Production, `managementRequired` |
| AR-002 | Event-data sources | no incoming data link; not `ds`, people, identity providers, `idx`, `s3`, `search` or `loadBalancer` |
| AR-003 | Systems on data links between regions | ends of data links whose two regions are set and differ |
| AR-004 | Production route-entry sources | no incoming data link, Production; not `ds`, people, identity providers or load balancers |
| AR-005 | People, identity providers and what they sign in to | ends of authentication relations |
| AR-006 | Amazon S3 and the systems writing to it | ends of data links into `s3` |
| AR-007 | Systems with a relationship | ends of every relationship, all planes |
| AR-008 | Production components | environment Production |
| PR-ENT-01 | Ingest Processors | `ip` |
| PR-ENT-02 | Forwarders and indexers on Splunk-to-Splunk links | ends of `uf`/`hf` → `idx` data links |
| PR-CLOUD-01, PR-CLOUD-02 | Forwarders sending to Splunk Cloud indexing, and the indexing | ends of `uf`/`hf` → cloud indexing data links |
| PR-HYB-01 | Splunk-managed components and Cloud tenant members | managed, or in a "Cloud tenant" group |
| PR-HYB-02 | Systems on data links across the Cloud boundary | ends of data links with one end managed or in a Cloud tenant group |
| PR-CLOUD-10 | Syslog sources sending to Splunk Cloud indexing | ends of `syslogSource` → cloud indexing links |
| PR-CLOUD-11, -14, -15 | Senders to Splunk Cloud receivers, and the receivers | ends of data links into a cloud receiver, except from `syslog` or `syslogSource` |
| PR-CLOUD-12 | Splunk-managed components, and what manages or signs in to them | managed; ends of management links into them; ends of authentication links into cloud indexing |
| PR-CLOUD-13 | Splunk Cloud stack components and SOAR Cloud | stack components, `soarCloud` |
| PR-HYB-05 | Systems sending to both cloud and self-managed indexers | as the rule checks |
| PR-CLOUD-16 | Splunk Cloud indexing | cloud indexing |
| PR-CLOUD-17 | Search heads searching Splunk Cloud indexing | ends of cloud indexing → `search`/`shcMember` links |
| PR-CLOUD-18 | Ingest Processor and stack components on data links | ends of `ip` → `idx` links and of stack → stack links |
| PR-CLOUD-19, -20, -21 | ES search heads | `cloudEsSearchHead` |
| AR-009 | Syslog load balancers and their members | `lbServes` syslog, plus members |
| AR-010 | HEC load balancers and their clients | `lbServes` hec, plus clients |
| AR-011, AR-012 | Deployment load balancers and their Deployment Servers | `lbServes` deployment, plus members |
| AR-013 | Load balancers that proxy | `lbMethod` proxy |
| AR-014 | Load balancers and their members | all, plus members |
| AR-015 | Load balancers that end TLS, and their members | `lbTls` terminate, plus members |
| TM-OPEN-HIGH, TM-OWNER | The whole topology (threat model) | none: listed as topology-wide |

**Cells**, for each rule and each system in its scope:
- the rule's status (Fail or Advisory) when the rule isn't Pass and its `nodes` include the system;
- Disabled when the rule is disabled;
- otherwise Pass.

A rule with no system in scope, and not topology-wide, has nothing to check here.

**Tiles:**
- rules checked;
- pass;
- fail;
- advisory;
- "nothing to check here";
- "systems with a failure".

**Profile line:** "Validated for `<profile name>` (`<n>` rules). `<Other profile>` checks `<n>` and `<other>` checks `<n>`. Change it with "Validate for" in the Builder." Profile names come from `builderRuleProfiles`.

**Legend:**
- ✓ passes;
- ✕ fails;
- ! advisory;
- – rule disabled;
- "Blank: the rule doesn't bind that system."

**Matrix:**
- **Columns:** the rules with a system in scope, in Validate's order.
- **Column header:** the ID and the severity (CRIT, HIGH, MED), with a top border in the result's colour.
- **Rows:** one per system, under its location's group row.
- **Cells:** a mark on a tinted cell for Fail and Advisory.
- **Row end:** "`<n>` fail · `<n>` advisory", or "`<n>` pass", or "No rule".
- **Footer row:** "Rule result".

**Under the matrix:**
- "**Nothing to check here:** `<IDs>`. No system in this topology is in their scope." Run IDs together, as in "AR-009 to AR-015".
- "**Whole topology:** `<ID>` `<result>` (`<description>`); …".

**Detail panel:**
- **Nothing selected:** the failing rules, with their first finding.
- **A system:** each rule that binds it, with its result and its finding that names the system.
- **A rule:**
  - statement, severity and result;
  - "Binds", and its systems with their marks;
  - its findings;
  - an "Open in Validate" button.
- **A cell:** the result and the findings that name the system.

**Rules table:**
- **Columns:** Rule, Statement (title, with the description under it), Severity, Binds, Systems (count, "Whole topology" or "None here"), Result, Findings.
- **Findings column:** the first finding, then "and `<n>` more".
- **Rules with nothing to check:** muted, with result "Nothing to check".

**Findings:**

| Chip | Text |
|---|---|
| Fail | "**`<n>` rules fail:** `<ID>` `<title>` (`<up to 3 systems>` and `<n>` more); …" |
| Advisory | "**`<n>` rules are advisory.**" Add "`<IDs>` flags most systems: `<first finding>`." when a rule flags three quarters or more of the systems. |
| Most bound | "**`<system>`** is bound by `<n>` rules and fails `<n>`." Most failures first, then most rules. |
| Nothing to check | "**`<IDs>`** have no system in scope in this topology, so they pass with nothing to check." |
| Profile | "**Validated for `<profile>`.** `<Other>` checks `<n>` rules and `<other>` checks `<n>`." |

## 5. Interaction and layout

**Selection:**
- Each view keeps one selection.
- Esc clears it.
- Changing the topology clears it.

**Diagrams:**
- An SVG inside a frame that scrolls sideways; the page never does.
- At 400px, the summary, panel and tables stack.
- Tables scroll in their own frames.

**Theme:** colours come from the OV tokens, as SV-3 does, so both themes work.

## 6. In-place edit: threat-model rule texts

In `builder-threat-review-v152`, two descriptions get the plural wrong. They show in Validate, and now in SV-10a's "Whole topology" line.

| Rule | Now | Should read |
|---|---|---|
| TM-OPEN-HIGH | "1 high-risk threat require a recorded decision." | "1 high-risk threat requires a recorded decision." The plural ("14 high-risk threats require…") is right. |
| TM-OWNER | "14 open high-risk threat lack an owner." and "1 open high-risk threats lack an owner." (inverted) | "14 open high-risk threats lack an owner." and "1 open high-risk threat lacks an owner." |

## Not in scope

- **Other traces,** such as other sources, a chosen source, or management and authentication scenarios. The model takes a start system, so a picker can come later.
- **OV-6a, OV-6b and SV-10b.** Their Build 167 mockups stay as they are.
- **Measured latency.** The targets are what the links record.

## Check before uploading

### 1. Regression

- 0 `pageerror` events.
- Other views are unchanged, apart from AV-1's three new rows and issue lists, and the threat-model texts.

### 2. Reference topology

**SV-10c:**
- 5 systems and 4 steps:

| Step | Interface | Port | TLS | Target | Total | Status |
|---|---|---|---|---|---|---|
| 1 | SI-1 Firewalls and network devices → Syslog Server 1, "TCP/TLS or UDP" | 514, or 6514 with TLS (usual; not set) | None | ≤ 1 min | T+1 min | Plaintext |
| 2 | SI-2 Syslog Server 1 → Universal Forwarder 1, file handoff | — (same host) | Not needed (same host) | ≤ 1 min | T+2 min | Local |
| 3 | SI-3 Universal Forwarder 1 → Indexer 1, Splunk-to-Splunk | 9997 (usual; not set) | Required | ≤ 1 min | T+3 min | Port not set |
| 4 | SI-4 Indexer 1 → Search Head 1, search dispatch, opened by Search Head 1 | 8089 (usual; not set) | Required | ≤ 1 min | T+4 min | Port not set |

- **Milestones:** "Searchable at Indexer 1 · T+3 min" and "Found by a search at Search Head 1 · T+4 min".
- **Findings:** Timing ("… within 3 min and … within 4 min. Every step has a 1 min target."), No TLS (SI-1), Port not set ("SI-1, SI-3 and SI-4 … assumes 514, 9997 and 8089"), Search, Same host.

**OV-6c:**
- **Nodes:** ON-1 Sydney event sources → ON-2 Site collection → ON-9 Indexing service → ON-10 Search and detection.
- **Flows:** RF-01 (N1), RF-02 (inside ON-2), RF-03 (N2), RF-07 (N5).
- **RF-07:** shows "≤ 1 min" with "OV-3: not set".
- **Findings:** Timing, Nodes ("RF-02 stays inside Site collection"), Timeliness (RF-07, SI-4), No TLS (RF-01), Port not set (RF-01, RF-03 and RF-07).

**SV-10a (Splunk Enterprise):**
- **Results:** 19 rules: 12 pass, 3 fail (AR-002, AR-005, TM-OPEN-HIGH) and 4 advisory (AR-004, AR-008, PR-ENT-02, TM-OWNER).
- **Nothing to check:** "AR-006, PR-ENT-01, AR-009 to AR-015".
- **Systems with a failure:** 9.
- **Matrix columns:** AR-001, AR-002, AR-003, AR-004, AR-005, AR-007, AR-008, PR-ENT-02.
- **Scopes:**
  - AR-001: Universal Forwarder 1, Universal Forwarder 2, Heavy Forwarder 1;
  - AR-003: Universal Forwarder 1, Indexer 1, AWS Lambda 1, Heavy Forwarder 1;
  - AR-005: Administrator 1, Authentication Provider · Cloud 1, Search Head 1;
  - AR-007: 13 systems;
  - AR-008: all 17;
  - PR-ENT-02: Universal Forwarder 1, Indexer 1.
- **Profile line:** "Splunk Cloud checks 29 and Hybrid checks 33".

### 3. Other topologies and profiles

**Zoned:**
- **SV-10c:** 6 systems and 5 steps through Syslog VIP (SI-1 to SI-5); searchable T+4 min; found T+5 min; a Load balancer finding.
- **SV-10a:**
  - AR-009 binds Syslog VIP, Syslog Server 1 and Syslog Server 3;
  - AR-013 binds Syslog VIP;
  - nothing to check: AR-006, PR-ENT-01, AR-010 to AR-012, AR-015.

**Default:**
- **SV-10c:** 4 systems and 3 steps; searchable at Indexer 1 T+3 min; stop text "Indexer 1 indexes the event, but no search head in the topology searches it.", and a stop cross.
- **OV-6c:** 3 nodes.

**Reference, validated for Hybrid:** 33 rules. In scope: AR-001, AR-002, AR-003, AR-004, AR-005, AR-007, AR-008, PR-HYB-01, PR-CLOUD-12, PR-CLOUD-13.

### 4. Edits on the reference topology

| Edit | Expected |
|---|---|
| Port 9997 on SI-3 | Step 3 reads 9997, Declared; Port not set lists SI-1 and SI-4 |
| Latency target 30 s on SI-1 | T+30 s, T+1 min 30 s, T+2 min 30 s (searchable), T+3 min 30 s (found) |
| Latency target 0 on SI-2 | Step 2 target Not set; totals "≥ T+1 min", "≥ T+2 min", "≥ T+3 min"; a No target finding |
| Remove Universal Forwarder 1 → Indexer 1 | Step 3 is the missing SI-12; "The event stops at Universal Forwarder 1: it has no output to an indexer (SI-12 missing)." |
| Disable AR-005 in Validate | Its three systems read – (Disabled) |

### 5. Layout and pack

- No sideways page scroll at 400 (light and dark), 768 or 1440 pixels.
- The diagram scrolls inside its frame.
- No text crosses a box or the diagram's edge.
- The pack's three pages and print copies have no controls.

**Records:** a `changeRegister` entry ("Adds SV-10c and OV-6c event traces of one syslog event with port, TLS and latency targets per step, and SV-10a, the rules Validate checks by system"), and the build stamp.

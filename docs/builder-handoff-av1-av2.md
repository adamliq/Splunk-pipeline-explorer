# Builder handoff: add AV-1 (Overview and Summary Information) and AV-2 (Integrated Dictionary)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** the build that adds SV-1, SV-2 and SV-6 ([`builder-handoff-sv1-sv2-sv6.md`](builder-handoff-sv1-sv2-sv6.md)). AV-1's issues read its model, `builderSystemModel1xx()`. Add one block, `<script id="builder-av-v1xx">`, with wrappers only.

Both pages read whatever views the pack has. StdV-1, OV-5a, SvcV-5 and CV-6 ([`builder-handoff-stdv1.md`](builder-handoff-stdv1.md), [`builder-handoff-ov5a-svcv5-cv6.md`](builder-handoff-ov5a-svcv5-cv6.md)) appear in them once they are built, with no change here.

**Mockups (the targets):**
- [`docs/mockups/architecture-av1-mockup.html`](mockups/architecture-av1-mockup.html), screenshot `docs/mockups/compare/av1-mockup.png`;
- [`docs/mockups/architecture-av2-mockup.html`](mockups/architecture-av2-mockup.html), screenshot `docs/mockups/compare/av2-mockup.png`.

Each mockup has two examples: the reference topology with CV-1's example loaded, and the default topology with nothing entered. Their data was exported from Build 187 with the SV prototype and the rules below, so the numbers are the expected ones. The mockups list the whole pack as it will be when all the handoffs are built. They replace the Build 167 AV mockups.

## What the two views are

- **AV-1 · Overview and Summary Information** is the front page of the pack. It covers:
  - what the architecture covers, why it was described, and over what timeframe;
  - what the views found: the issues that recur across them, each listed once with the views that show it;
  - where to read each view, with its page number.
- **AV-2 · Integrated Dictionary** defines every term, identifier scheme and abbreviation the pack uses. It gives the Splunk setting each one maps to where there is one, and the views that use it.

Both are generated from the topology and the catalogues the other views already hold. The only new saved data is AV-1's status, assumptions and constraints.

## Where they go

Follow the SvcV-1 and SvcV-2 pattern (`builder-svcv12-v175`).

| Step | AV-1 | AV-2 |
|---|---|---|
| Section key | `av1` | `av2` |
| Tab | "AV-1 · Overview", first | "AV-2 · Dictionary", second |
| Active key | Add both to `builderOvShow135`, keeping every existing key | |
| Save / load | `doc.architectureOverview` ↔ `state.builderAv1` (1.5) | Nothing |
| Pack | Right after the cover | After the last view, before the component inventory |
| Pack checkboxes | "AV-1 overview", first | "AV-2 dictionary" |
| `packSections` key | `av1`, default `true` | `av2`, default `true` |

**Page furniture,** as on the SvcV pages:
- banners;
- the title block, with Viewpoint "All (DoDAF V2.0)" and "Accountable" from `state.builderCv1.owner`;
- the purpose line (take the text from the mockup);
- the summary figures, with Build 185's singular forms;
- the footer `AV-n · 1 of 1 · Build <n>`.

Use the OV theme tokens as the SvcV-6 page does.

**View chips** appear in AV-1's issues and views table and in AV-2's entries. A chip opens its tab with `builderOvShow135(key)`. The "Rules" chip opens the architecture rules: `switchView('builder')`, then `state.builderRules.open=true`, then `renderBuilder()`. In print, chips are plain text.

## 1. AV-1 · Overview and Summary Information

### 1.1 Views registry

A fixed table. Show a row only for views whose section exists in `builderOvSections135()`.

| Key | View | Viewpoint | Name | Answers | Content |
|---|---|---|---|---|---|
| `av1` | AV-1 | All | Overview and Summary Information | What is this architecture, and what does the pack say? | Mixed |
| `av2` | AV-2 | All | Integrated Dictionary | What do the terms and identifiers mean? | Generated |
| `cv1` | CV-1 | Capability | Vision | What are we trying to achieve, and by when? | Owner-entered |
| `cv2` | CV-2 | Capability | Capability Taxonomy | Which capabilities, and how are they measured? | Mixed |
| `cv6` | CV-6 | Capability | Capability to Operational Activities Mapping | Which capabilities carry out each activity? | Generated |
| `ov1` | OV-1 | Operational | High-Level Operational Concept Graphic | What does the operation look like? | Mixed |
| `ov2` | OV-2 | Operational | Operational Resource Flow Description | Who exchanges what with whom? | Generated |
| `ov3` | OV-3 | Operational | Operational Resource Flow Matrix | What are the attributes of each exchange? | Generated |
| `ov5a` | OV-5a | Operational | Operational Activity Decomposition Tree | Which activities make up the operation? | Generated |
| `div1` | DIV-1 | Data and Information | Conceptual Data Model | Which data concepts exist, and how do they relate? | Generated |
| `svcv1` | SvcV-1 | Services | Services Context Description | Which services exist, and who uses them? | Mixed |
| `svcv2` | SvcV-2 | Services | Services Resource Flow Description | What does each service pass to the next? | Generated |
| `svcv3a` | SvcV-3a | Services | Systems-Services Matrix | Which systems provide each service? | Generated |
| `svcv3b` | SvcV-3b | Services | Services-Services Matrix | Which services depend on which? | Generated |
| `svcv4` | SvcV-4 | Services | Services Functionality Description | What does each service do? | Mixed |
| `svcv5` | SvcV-5 | Services | Operational Activity to Services Traceability Matrix | Which services carry out each activity? | Generated |
| `svcv6` | SvcV-6 | Services | Services Resource Flow Matrix | What are the attributes of each service flow? | Mixed |
| `sv1` | SV-1 | Systems | Systems Interface Description | Which systems connect, and how? | Generated |
| `sv2` | SV-2 | Systems | Systems Resource Flow Description | How does each interface cross the network? | Generated |
| `sv6` | SV-6 | Systems | Systems Resource Flow Matrix | What are the attributes of each system exchange? | Generated |
| `stdv1` | StdV-1 | Standards | Standards Profile | Which standards apply, and are they met? | Mixed |
| `tm1` | TM-1 | Security (not DoDAF) | Threat Model | Which threats apply to the telemetry paths? | Mixed |

What the content values mean:
- **Generated:** from the topology and fixed catalogues only.
- **Mixed:** also shows values an owner typed.
- **Owner-entered:** mostly owner text.

**Page:** the 1-based position, in `builderV125PackPages125()`, of the view's first page: its id is the key, or starts with the key followed by "-". It is "—" when the view isn't in the pack.

**Also in the pack:** the other pack pages, grouped by title. Strip a trailing " · n", and fold "Event data · …", "Region · …" and the like into "Connections · Event data", "Diagrams · Region" and so on. Show each group with its first page.

### 1.2 Title block and fact cards

**Title block:**
- AV-1 · Overview and Summary Information;
- Architecture: the pack title;
- Viewpoint;
- Accountable: CV-1 owner, or Not set;
- "Build · prepared · status", for example "189 · 14 Oct 2026 · Draft".

**Three fact cards:**

| Card | Content |
|---|---|
| Scope | CV-1 scope, or Not set, marked "(CV-1)". Then three bullets: "n systems in m locations: <SV-1 locations>." · "n interfaces: d declared, m missing, i inferred (SV-1)." · "Splunk Enterprise with Splunk-managed components in Splunk Cloud." when any SV-1 system is managed, else "Splunk Enterprise, self-managed." |
| Purpose and vision | CV-1 vision, or Not set. "Mission (OV-1)": `state.builderExport.ov1.mission`, when set. "Goals (CV-1)": each goal name with its due increment's name in brackets; "None set." when there are none |
| Timeframe | CV-1 timeframe, or Not set. One bullet per increment: "Name · Mon YYYY – Mon YYYY", or "Name · dates not set" |

**Three more cards** after the views table:
- **Assumptions** and **Constraints** (1.5).
- **How the pack was made:**
  - "Generated by the Builder (Build n) from the topology on <date>."
  - "n views include values owners typed: <IDs>": the Mixed and Owner-entered views in the pack.
  - "Classification: <classification>."
  - On screen, a Status select.

### 1.3 Summary

- views (rows in 1.1);
- generated from the topology (Generated rows);
- pages (the pack page count);
- systems, locations and interfaces (SV-1);
- high issues, in the stop colour;
- medium issues, in the review colour.

### 1.4 Cross-cutting issues

Eleven detectors with fixed IDs. Show each one only when its condition holds.

**Order:** High first. Within a severity, by the number of views it lists that are in the pack (plus Rules), largest first; then by ID.

Each card shows:
- the ID and severity, coloured;
- the title;
- the text;
- "Do: <action>";
- "Shown in n views", with the view chips;
- a bar sized against the longest view list.

A severity filter (All / High / Medium, with counts) sits above the cards. Join names as a list ("A, B and C").

| ID | Severity | Title | When | Text | Do | Views |
|---|---|---|---|---|---|---|
| I-01 | High | Forwarders with no output | SV-1 has missing interfaces | "<forwarders> receive(s) data but send(s) it nowhere", plus ": about N GB/day reaches no indexer" when their planned volumes add to 1 or more | Connect each to an indexer in the Builder. | sv1, sv2, sv6, svcv1, svcv2, svcv4, svcv5, svcv6, ov5a, cv2 |
| I-02 | High | Personal information crosses the network in clear | Declared interfaces whose SV-6 classification contains PII and whose Confidentiality starts with "None" | "<SI IDs> carries/carry PII without TLS (<their protocols>)." | Send syslog over TLS on 6514, or keep the syslog hop inside one network zone. | sv1, sv2, sv6, svcv2, svcv6, stdv1, tm1 |
| I-03 | High | Detection and response chain not in place | Any of SF-09 to SF-12 exists and isn't In place | "No Enterprise Security search head, so there are no correlation searches or findings. " when S12 isn't deployed, then "<IDs> is/are not in place", plus ", and SOAR has no interface to the service desk" when SF-12 is Missing | Add the Splunk Cloud ES search head, link it to SOAR, and design the service desk interface. | svcv1, svcv2, svcv4, svcv5, svcv6, cv2, cv6, ov5a |
| I-04 | High | High-risk threats are open | TM-1 threats with risk High and status Open | "n high-risk threat(s) is/are open", plus ", m with no owner" | Record a control and an owner for each in TM-1, or accept the risk. | tm1 |
| I-05 | High | Architecture rules fail | `evaluateArchitectureRules()` results with status `fail`, leaving out IDs starting "TM-" (I-04 covers those) | "<id> <title>; …" | Open Validate for each rule's evidence and fix the topology. | Rules |
| I-06 | Medium | Systems with no interface | SV-1 systems with no interface | "<names> is/are in the topology with no interface, so it sends/they send nothing." | Connect each one, or remove it. | sv1, svcv3a, cv2 |
| I-07 | Medium | Exchanges the topology doesn't have | SV-1 inferred interfaces | "<from → to; …> is/are needed by other views but has/have no link." | Add the links so their ports and TLS are recorded. | sv1, sv6, svcv2, svcv6 |
| I-08 | Medium | Links with no port | SV-1 interfaces with the port issue | "n link(s) has/have no port", plus ", so m firewall rule(s) can't be written" when SV-2 has declared rules with no port | Set the port on each link in the relationship inspector. | sv1, sv2, sv6 |
| I-09 | Medium | No high availability for indexing or search | S7 has one provider and S8 isn't deployed; or S9 has one provider and S11 isn't deployed | "Indexing runs on one indexer with no index replication", and/or "search runs on one search head with no search head cluster", joined with ", and ", capitalised | Plan an indexer cluster and a search head cluster. | svcv1, svcv3a, svcv4, cv2 |
| I-10 | Medium | Owners not set | CV-1 owner is blank, or open threats have no owner | "No architecture owner in CV-1." and/or "n open threat(s) has/have no owner." | Name the owners in CV-1 and TM-1. | cv1, tm1, av1 |
| I-11 | Medium | Capabilities with nothing in the topology | CV-2 parts with status Planned | "<IDs> is/are planned: no component in the topology provides it/them." Above six IDs, show the first six and "and n more" | Add the components, or confirm the increment that brings them. | cv2, cv6, svcv1 |

A view's "Issues shown" column lists the IDs whose views include it.

### 1.5 Assumptions, constraints and status

```js
state.builderAv1 = { status: 'Draft', assumptions: [], constraints: [] }
```

**`builderAv1Clean1xx(raw)`:**
- `status` is one of Draft, For review or Approved, else Draft;
- each list keeps up to 10 strings, trimmed, at most 200 characters each, dropping empty ones.

**On screen:**
- Each card shows its list, or "None recorded.", with an **Edit** button. Edit turns the list into a textarea, one item per line, and **Save** writes it back.
- The Status select sits in "How the pack was made".
- **Load example** (as CV-1 has) fills the mockup's example lists:
  - assumptions: "The reference topology is the intended production design." · "Volumes are estimates until measured." · "One indexer and one search head until Increment 3.";
  - constraints: "The Australian Government ISM and the Privacy Act 1988 apply." · "Licence entitlement is 180 GB/day." · "Network changes run in a weekly window."

The pack and print show the lists read-only, with the status in the title block. Wrap `topologyDocument` and `loadTopologyDocument` for `architectureOverview`, as CV-1 does. Clear (with no components left) resets it.

## 2. AV-2 · Integrated Dictionary

### 2.1 Entries

Each entry has:
- **term**;
- **also known as**: abbreviations and synonyms, searchable;
- **category**;
- **definition**;
- **Splunk setting or source**, shown in mono under the definition;
- **used in**: view keys, shown as chips for the views in the pack.

Build the entries from six sources.

**DoDAF terms** (fixed):

| Term | Also known as | Definition | Used in |
|---|---|---|---|
| Activity | operational activity | Work done to achieve an operational goal, whoever or whatever does it. | ov5a, svcv4, svcv5, cv6 |
| Capability | | The ability to achieve an objective under stated conditions: what the platform must be able to do. | cv1, cv2, cv6 |
| Needline | | A need for two operational nodes to exchange information, carried by one or more resource flows. | ov2, ov3 |
| Operational node | | A role or place that performs activities and exchanges information, such as site collection. | ov2, ov3 |
| Resource flow | operational resource flow | An exchange of information between operational nodes, with its attributes in OV-3. | ov2, ov3, sv6 |
| Service | | A unit of work the platform provides to a consumer, such as Indexing. | svcv1, svcv2, svcv3a, svcv4, svcv5, svcv6 |
| Service flow | | An exchange between two services or a service and its consumer. | svcv2, svcv6, sv6 |
| Service function | | A step a service performs, such as Receive syslog. | svcv4, svcv5 |
| System | | A Builder component in the topology, such as Indexer 1. | sv1, sv2, sv6, svcv3a |
| System interface | interface | A link between two systems that carries data, with its protocol, port and protection. | sv1, sv2, sv6 |
| Viewpoint | | A group of views with one concern: All, Capability, Operational, Data, Services, Systems, Standards. | av1 |
| Standard | | A technical standard, vendor specification or policy the architecture follows. | stdv1 |

**Builder terms** (fixed):

| Term | Also known as | Definition | Setting | Used in |
|---|---|---|---|---|
| Architecture pack | | The views printed or downloaded together from the operational views page. | Builder: Download architecture pack | av1 |
| Topology | | The components and links drawn in the Builder; the source for every generated value. | Builder: File › Export | av1, sv1 |
| Relationship plane | plane | The kind of link: event data, fleet management or interactive authentication. | | sv1, sv6 |
| Network zone | zone | A network segment a component sits in. Without one, the component falls back to its group or environment. | Builder: component inspector, Network zone | sv2 |
| Network segment | segment | A location and network zone together. A connection between two segments crosses a boundary. | | sv2 |
| Load balancer | VIP | One address in front of a pool of syslog receivers, HEC endpoints or Deployment Servers. | Builder: Network › Load balancer | sv1, sv2 |

**Identifier schemes** (live). The term is the range in use, "first–last" (one ID alone when there is one). Leave a scheme out when nothing uses it.

| Range from | Also known as | Definition | Used in |
|---|---|---|---|
| OV-2 node IDs (ON-1…) | operational nodes | "n OV-2 operational nodes." | ov2, ov3 |
| OV-3 flow IDs (RF-01…) | resource flows | "n OV-3 resource flows." | ov3, sv6 |
| Activities: A1–A9 once OV-5a exists, until then SvcV-4's A2–A9 | operational activities | "The operational activities, from <first name> (<first ID>) to <last name> (<last ID>)." | ov5a, svcv4, svcv5, cv6 |
| CV-2: "C1–C8, C1.1–C8.3" | capabilities | "n capabilities and their m parts." | cv1, cv2, cv6 |
| Services: S1–S16 | services | "The 16 services in the SvcV-1 catalogue." | svcv1, svcv2, svcv3a, svcv3b, svcv4, svcv5 |
| SvcV-4 functions (S3.1…) | service functions | "n SvcV-4 functions, numbered within their service." | svcv4, svcv5 |
| Service flows (SF-01…) | service flows | "n service flows in this topology." | svcv2, svcv6, sv6 |
| SV-1 interfaces (SI-1…) | system interfaces | "n SV-1 interfaces, numbered in pipeline order." | sv1, sv2, sv6 |
| SV-2 paths (NP-1…) | network paths | "Pairs of network segments that connections cross." | sv2 |
| SV-2 rules (FW-1…) | firewall rules | "Firewall rules the connections need where they cross a boundary." | sv2 |
| Architecture rules (AR-001…) | architecture rules | "n architecture rules checked by Validate." | Rules |
| AV-1 issues: I-01–I-11 | cross-cutting issues | "Issues that recur across views, each listed once in AV-1." | av1 |
| StdV-1 standards (STD-01…), once StdV-1 exists | standards | "n standards in the profile." | stdv1 |

**Splunk components** (live): one entry for each component type in the topology. The term is `builderComponents[type].name`. The rest comes from this table; a type missing from it uses `builderComponents[type].type` as its definition. All are used in sv1, svcv3a and ov2.

| Type | Also known as | Definition | Setting |
|---|---|---|---|
| syslogSource | | A network device or appliance that sends syslog, such as a firewall. | |
| windowsEvent | | Windows hosts whose event logs a forwarder reads. | inputs.conf [WinEventLog://Security] |
| fileSource | | Log files on a host that a forwarder monitors. | inputs.conf [monitor://&lt;path&gt;] |
| scriptSource | | A script a Universal Forwarder runs to collect data. | inputs.conf [script://&lt;path&gt;] |
| apiSource | | A REST or vendor API that a collector polls. | |
| sqlDatabase | | A relational database that DB Connect reads. | |
| hecClient | | An application that sends events to HEC. | |
| awsLambda | | An AWS function that sends cloud audit events to HEC. | |
| azureFunction | | An Azure function that sends cloud events to HEC. | |
| syslog | | A syslog daemon (rsyslog or syslog-ng) that writes per-host files for a forwarder to read. | rsyslog.conf or syslog-ng.conf |
| uf | UF | A lightweight agent that reads data and forwards it unparsed. | inputs.conf; outputs.conf |
| hf | HF | A full Splunk instance that receives, parses and forwards data. | inputs.conf; props.conf; outputs.conf |
| hecEndpoint | HEC | The HTTP Event Collector input on a Splunk instance. | inputs.conf [http] |
| dbConnect | | The DB Connect app on a Heavy Forwarder, reading databases over JDBC. | db_inputs.conf |
| apiCollector | | A modular input or add-on that polls an API. | inputs.conf (modular input) |
| edgeProcessor | EP | Customer-hosted Splunk processing that filters, masks and routes data before indexing. | SPL2 pipelines |
| ip | | Splunk Cloud processing that filters, masks and routes data before indexing. | SPL2 pipelines |
| idx | | Stores events in indexes and runs the searches the search head sends. | indexes.conf |
| indexerCluster | | A group of indexers that replicate buckets between them. | server.conf [clustering] |
| indexerClusterManager | CM | Coordinates replication and bundles for an indexer cluster. | server.conf [clustering] mode = manager |
| cloudIndexer148 | | Indexing run by Splunk in Splunk Cloud. | |
| s3 | | Amazon S3 object storage used as a destination. | |
| search | SH | Where users search; it sends searches to the indexers and merges the results. | authentication.conf; savedsearches.conf |
| shcCluster | SHC | A group of search heads that share knowledge objects and schedules. | server.conf [shclustering] |
| shcMember | | A search head in a search head cluster. | server.conf [shclustering] |
| shcDeployer | | Pushes apps and configuration to search head cluster members. | shclustering stanza on the deployer |
| cloudSearchTier | | Search run by Splunk in Splunk Cloud. | |
| cloudEsSearchHead | ES | The Splunk Cloud search head that runs Enterprise Security. | |
| soarCloud | SOAR | Splunk-hosted SOAR: turns findings into cases and runs playbooks. | |
| soarOnPrem | SOAR | Customer-hosted SOAR: turns findings into cases and runs playbooks. | |
| authUser | | A person who signs in to search, triage or administer. | |
| authProviderCloud | IdP | A cloud identity provider that signs SAML assertions. | authentication.conf [saml] |
| authProviderOnPrem | IdP | An on-premises directory or identity provider. | authentication.conf |
| ds | DS | Sends apps and configuration to forwarders, which phone home to it. | serverclass.conf; deploymentclient.conf |
| licenseManager | LM | Tracks daily ingest against the licence entitlement. | server.conf [license] |
| monitoringConsole | MC | Splunk's health and performance dashboards for the platform. | distsearch.conf |
| streamServer | | Hosts the Splunk App for Stream configuration. | |
| loadBalancer | VIP | One address in front of a pool of receivers. | |

**Data concepts** (live): each concept of `builderDiv1Model169().concepts` gives:
- term: its `name`;
- definition: its `def`;
- setting: its `splunk`, with tags stripped and entities decoded.

They are used in div1. Add svcv6 and sv6 when the name, with spaces removed or as it stands, appears in any SvcV-6 Data value (Event, Bucket, DeploymentApp and so on).

**Standards** (live, once StdV-1 exists): one entry per profile row in this table. The definition ends with " (<STD id>, <reference>)". They are used in stdv1, sv1 and sv6.

| Row | Term | Also known as | Definition | Setting |
|---|---|---|---|---|
| STD-01 | TLS | Transport Layer Security | Encrypts a connection between two systems. Required at 1.2 or later here. | sslVersions = tls1.2 |
| STD-02 | X.509 certificate | | The certificate a TLS server presents; clients verify its chain and name. | sslVerifyServerCert = true |
| STD-03 | Syslog | | The standard for sending log messages from devices: UDP or TCP 514, or TCP with TLS on 6514. | rsyslog or syslog-ng; [udp://514] or [tcp://514] inputs |
| STD-06 | S2S | Splunk-to-Splunk | Splunk's forwarding protocol from forwarders to indexers, on 9997 with TLS. | outputs.conf [tcpout] useACK = true; inputs.conf [splunktcp-ssl] |
| STD-07 | HEC | HTTP Event Collector | Receives events over HTTPS on 8088, each source with its own token. | inputs.conf [http://&lt;token&gt;] |
| STD-08 | splunkd | management port | Splunk's REST and management service on 8089: phone-home, distributed search, licensing. | server.conf; web.conf mgmtHostPort |
| STD-09 | SAML | Security Assertion Markup Language | Single sign-on: the identity provider signs an assertion the Splunk component trusts. | authentication.conf [saml] |
| STD-10 | OIDC | OpenID Connect | Single sign-on built on OAuth 2.0. | |
| STD-11 | LDAP | Lightweight Directory Access Protocol | Directory sign-in; LDAPS adds TLS on 636. | authentication.conf [&lt;ldap strategy&gt;] |
| STD-12 | MFA | multi-factor authentication | Sign-in with a second factor, required for administrators. | |
| STD-14 | CIM | Common Information Model | Splunk's shared field names and data models, so one search works across vendors' data. | datamodels.conf; Splunk_SA_CIM |
| STD-15 | MITRE ATT&CK | | A catalogue of attacker techniques that detections are tagged with. | |
| STD-16 | NTP | Network Time Protocol | Keeps system clocks in step, so event times line up. | |
| STD-17 | ISM | Information Security Manual | The Australian Government's cybersecurity framework, published by ASD. | |
| STD-19 | PII | personal information | Information about an identifiable person, such as usernames and IP addresses in telemetry. Protected under the Privacy Act 1988. | |

### 2.2 Page

1. **Summary:** terms; then a count for each category present, labelled DoDAF terms, Builder terms, identifier schemes, Splunk components, data concepts or standards; then "mapped to a Splunk setting".
2. **Search:**
   - matches term, also known as, definition and setting, without case;
   - highlights matches with `<mark>`;
   - shows "n of N terms";
   - with no match: "No terms match. Try an ID prefix such as SI- or a setting such as useACK."
3. **Category chips** with counts, in this order: DoDAF, Builder, Identifier, Splunk component, Data concept, Standard.
4. **The list,** A–Z without case, with numbers in numeric order:
   - a letter heading where the first letter changes;
   - each entry in three columns: term (with also known as and a category badge), definition (with the setting), and the used-in chips.
5. **Pack and print:** the full list. No search box or chips; the "used in" IDs show as plain text.

## 3. Registration

As SvcV-1 and SvcV-2 do:
- wrap `builderOvSections135`, `builderOvShow135` and `builderOvRender135` to add the two tabs at the front;
- wrap `builderV125PackPages125` to place the pages (AV-1 after the cover, AV-2 after the last view) and rebuild the cover's table of contents;
- wrap `ensurePresentationOverlay` for the pack checkboxes;
- wrap `topologyDocument` and `loadTopologyDocument` for `architectureOverview` and the pack switches;
- refresh the print copy on `beforeprint`.

Compute AV-1's page numbers after the other pack wrappers run, so they match the printed pack.

**Records:** a `changeRegister` entry ("Adds AV-1 Overview and Summary Information, with cross-cutting issues found across the views, and AV-2 Integrated Dictionary, generated from the topology and the view catalogues"), and the build stamp.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Every other tab and pack page is unchanged, apart from page numbers and the table of contents moving.
2. **Reference topology, CV-1 example loaded:**
   - **AV-1, all eleven issues show:**
     - I-01 "Universal Forwarder 2 and Heavy Forwarder 1 receive data but send it nowhere: about 92 GB/day reaches no indexer.";
     - I-02 "SI-1, SI-5 carry PII without TLS (TCP/TLS or UDP).";
     - I-04 "14 high-risk threats are open, 14 with no owner.";
     - I-05 "AR-002 Data routes terminate at an approved destination; AR-005 Interactive administration uses MFA.";
     - I-08 "6 links have no port, so 3 firewall rules can't be written.";
     - I-10 "No architecture owner in CV-1. 26 open threats have no owner.";
     - I-11 "C1.4, C5.1, C5.2, C5.3 are planned: no component in the topology provides them."
   - **Order:** I-01 (10 views), I-03 (8), I-02 (7), I-04, I-05, then I-07 (4), I-09 (4), I-06, I-08, I-10, I-11 (3 each), once every view in the registry exists. With fewer views built, the counts drop to the views present.
   - **Facts:**
     - Scope: "Sydney and Melbourne sites, Windows estate, AWS workloads" (CV-1), "17 systems in 6 locations", "18 interfaces: 12 declared, 2 missing, 4 inferred (SV-1)", and the Splunk-managed line (SOAR Cloud).
     - Purpose: the OV-1 mission, and four goals.
     - Timeframe: Oct 2026 – Dec 2027, with Foundation, Detection, and Response and resilience.
   - **AV-2:** 79 terms with every view built: 12 DoDAF, 6 Builder, 13 identifier schemes, 14 Splunk components, 21 data concepts and 13 standards. Searching "SI-" finds "SI-1–SI-18", and "useACK" finds S2S.
3. **Default topology, nothing entered:**
   - **AV-1:** I-02 (SI-1), I-04 (2 threats), I-08 ("2 links have no port."), I-09 (indexing only), I-10 and I-11 ("C1.2, C1.3, C1.4, C2.1, C2.2, C4.1 and 13 more are planned…"). Scope and vision read Not set, with "4 systems in 1 location: Location not set".
   - **AV-2:** 50 terms. No network path or firewall rule schemes, and 4 Splunk components.
4. **Edits:**
   - Connecting Heavy Forwarder 1 to Indexer 1 leaves I-01 naming Universal Forwarder 2 only.
   - Setting the CV-1 owner, and every open threat's owner, removes I-10.
   - Adding an ES search head linked to SOAR changes I-03.
5. **Assumptions, constraints and status:** edits round-trip through save, reload and import. An older file opens with Draft and empty lists, and junk loads cleaned.
6. **Pack and print:**
   - AV-1 is the first page after the cover; AV-2 follows the last view.
   - AV-1's page numbers match the table of contents.
   - Chips print as text.
7. **Layout:** no page-level sideways scroll at 400px or 768px. Dark and light are both readable.

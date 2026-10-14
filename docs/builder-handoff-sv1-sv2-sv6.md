# Builder handoff: add SV-1, SV-2 and SV-6 (systems interfaces and resource flows)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 187 (`builder-review-v187`). Add one block, `<script id="builder-sv-v1xx">`, for the shared model and the three pages. Use wrappers, plus one in-place edit in `builder-svcv6-v172` (section 7).
**Mockups (the targets):**
- [`docs/mockups/architecture-sv1-mockup.html`](mockups/architecture-sv1-mockup.html), screenshot `docs/mockups/compare/sv1-mockup.png`;
- [`docs/mockups/architecture-sv2-mockup.html`](mockups/architecture-sv2-mockup.html), screenshots `docs/mockups/compare/sv2-mockup.png` and `sv2-reference.png`;
- [`docs/mockups/architecture-sv6-mockup.html`](mockups/architecture-sv6-mockup.html), screenshot `docs/mockups/compare/sv6-mockup.png`.

Each mockup has two examples, switched at the top. Their data was exported from Build 187 with the rules below, so their numbers are the expected numbers. They replace the Build 167 SV mockups.

**Test topologies:**
- the default topology;
- the reference topology, `docs/mockups/ov1-reference-topology.json`;
- [`docs/mockups/sv-zones-topology.json`](mockups/sv-zones-topology.json): the reference topology plus network zones, subnets and ports, and a syslog load balancer ("Syslog VIP", DNAT) in front of Syslog Server 1 and a new Syslog Server 3. It is the mockups' second example.

Load both files with `loadTopologyDocument`.

## What the three views are

In DoDAF V2.0, the Systems viewpoint describes the systems that realise the operational and service views:

- **SV-1 · Systems Interface Description.** The systems, where they run, and every interface between them, with protocol, port and protection.
- **SV-2 · Systems Resource Flow Description.** How those interfaces travel over the network:
  - which network segment each system is in;
  - which system opens each connection, and on what port;
  - which connections cross a boundary, and the bandwidth each boundary carries;
  - the firewall rules that follow.
- **SV-6 · Systems Resource Flow Matrix.** One row per SV-1 interface with the attributes needed to build and accredit it: content, rate, service levels and protection. It is the systems counterpart of SvcV-6.

**All three are derived from the canvas. They add no saved state** apart from their pack switches. The canvas already holds what they need:
- for each link: protocol, port, TLS, acknowledgement, authentication, latency and availability targets, classification;
- for each component: region, network zone and subnet, and the load balancer fields.

What a link can't hold (data, format, frequency and event size) comes from the SvcV-6 service flow the link carries. To change a value, the user edits the link: every declared interface has **Edit link in the Builder** (section 6).

## Where they go

Follow the SvcV-1 and SvcV-2 pattern (`builder-svcv12-v175`).

| Step | SV-1 | SV-2 | SV-6 |
|---|---|---|---|
| Section key | `sv1` | `sv2` | `sv6` |
| Tab, after "SvcV-6 · Flow matrix" | "SV-1 · Interfaces" | "SV-2 · Resource flows" | "SV-6 · Flow matrix" |
| Active key | Add each key to `builderOvShow135`, keeping every existing key | | |
| Save / load | Nothing new. Only `exportPreferences.packSections.sv1`, `sv2` and `sv6`, default `true` | | |
| Pack | After SvcV-6, read-only, with the table of contents updated. Pack checkboxes after `#builderPackSvcv6_172`: "SV-1 interfaces", "SV-2 resource flows", "SV-6 flow matrix" | | |

**Page furniture,** as on the SvcV pages:
- banners;
- the title block from `builderOv3Furniture139`, with Viewpoint "Systems · DoDAF V2.0" and "System owner" from `state.builderCv1.owner` (until a systems owner field exists);
- the purpose line (take the text from the mockup);
- the summary figures, with Build 185's singular forms at a count of one;
- findings;
- the footer `SV-n · 1 of 1 · Build <n>`.

**Colours:** use the OV theme tokens as SvcV-6 does (`--ink`, `--muted`, `--rule`, `--zone`, `--sheet`, `--node`, `--sel`, `--review`, `--ok` and `--stop` from `.svcv6Page172`). The planes are:
- event data: `--ovData`;
- management: `--ovMgmt`;
- authentication: `--ovAuth`.

Inferred and planned lines use `--review`; missing outputs and plaintext crossings use `--stop`. The page never scrolls sideways; figures and tables scroll inside their own boxes.

## 1. Shared model: `window.builderSystemModel1xx()`

Returns `{systems, interfaces, connections, paths, rules, segments}`. Cache it as SvcV-2's `shared()` does. Key the cache on nodes, all three relation lists, groups, capacity, `state.builderSvcv6`, the handling caveat and the classification.

### 1.1 Systems

One system per node, except these definitions (they aren't running systems, and their links are ignored): `serverClass`, `deploymentApp`, `streamDefinition` and `soarPlaybook`.

| Field | Rule |
|---|---|
| Name | `componentInstanceLabel(node)` |
| Component | `builderComponents[type].name` |
| Kind | `person`: `authUser`. `network`: `loadBalancer`. `managed`: Splunk-managed by the Build 176 rule (`builderIsCloudIndexer148`, or `cloudSearchTier`, `cloudEsSearchHead`, `ip`, `soarCloud`). `external`: `componentSecurityZone[type]` is `source`, `aws` or `azure`. Otherwise `platform` |
| Location | `region`, or "Location not set" when it is blank or "Unspecified" |
| Zone | `networkNodeZone(node)`, shown as `securityZones[zone].name` when that exists (`splunkCloud` → "Splunk Cloud (provider managed)") |
| Zone set | `networkZone` is not empty, or the node is in a group. Otherwise the zone is the environment fallback |
| Segment | location + zone |
| Segment label | The location, when every system there shares one zone and it isn't set. The zone alone, when its name contains the location ("Sydney DMZ"). Otherwise "location · zone" ("Multisite · Splunk core") |
| Subnet, owner, instances | `subnet`; `responsibilityOwner(node)`; `instancesRepresented` |

**Tier column**, from `builderOvPlace138(node)`:

| Column | Systems |
|---|---|
| 0 People and sources | tier `people` (except identity) or `sources` |
| 1 Collection and processing | tier `collection`, `forwarding` or `processing`; a load balancer that doesn't serve deployment |
| 2 Indexing and storage | tier `indexing`, except `indexerClusterManager` |
| 3 Search | tier `search` |
| 4 Response | tier `response` |
| 5 Platform management | `indexerClusterManager`, a load balancer serving deployment, anything else |
| 6 Identity | role `identity` |

**Rank:** the index of the first interface (in SI order, 1.2) that touches the system. Systems with no interface come after, by node id.

### 1.2 Interfaces (SI-n)

**Order.** Number them SI-1, SI-2 and so on, in this order. Like OV-3's RF IDs, the numbers change when the topology does.

1. **Declared:** the items of `builderTraceEdges('all')` whose two ends are systems.
   - **Event data, depth first.** Take each system in node id order that has no incoming data edge. Follow its outgoing data edges in order of target id, recursively, taking each edge once. Then add any data edge not reached, in trace order. This keeps one pipeline together: SI-1 to SI-4 are Firewalls → Syslog Server 1 → Universal Forwarder 1 → Indexer 1 → Search Head 1.
   - Then the management edges, sorted by `from` and then `to`.
   - Then the authentication edges, sorted the same way.
2. **Missing:** the `missing` items of the SvcV service model's `interfaces` (key `missing:<forwarder id>:index`), in order. The target is the only indexing system (`idx`, `indexerCluster`, `cloudIndexer148`) when there is exactly one; otherwise there is none.
3. **Inferred:** the `inferred` items (key `inferred:<from id>:<to id>`), in order.

Read the service model's items by their keys. After section 7 their labels start with the SI ID, so never parse labels.

**Fields:**

| Field | Declared | Missing | Inferred |
|---|---|---|---|
| Plane | The edge's | Event data | Management when any of its service flows is a platform flow, else event data |
| Protocol | `details.protocol` | "Splunk-to-Splunk" | "REST (HTTPS)" to SOAR, else "REST (management)" |
| Port | `details.port` when above 0, else Not set | Not set | Not set |
| TLS | `details.tls` | Not set | Not set |
| OV-3 | The RF whose edges include this edge (`builderOv2Model133().flows`) | The first OV-3 flow whose needline joins the two systems' operational nodes, in either direction (`needline.from.parts`, `needline.to.parts`); else none | as Missing |
| SvcV-6 | The `flows` of the service model's interface item: the edge key `plane:id` for declared links, the item itself otherwise | | |

`details` is `ensureRelationshipDetails(edge.edge)`.

**Usual port.** Show it under "Not set" as a hint ("usually 9997"), and never use it as the value. The first match wins:

| Protocol or link label contains | Usually |
|---|---|
| 9997, Splunk-to-Splunk, S2S | 9997 |
| syslog, "TCP/TLS or UDP", or is exactly UDP or TCP/TLS | 514, or 6514 with TLS |
| HEC, 8088 | 8088 |
| LDAP | 636 (LDAPS) or 389 |
| Authentication plane, from a user | 443 |
| Authentication plane, otherwise | 8000 (Splunk Web) |
| Search dispatch, Splunk Cloud search, 8089, phone-home, management, REST; or the management plane | 8089 |
| S3, HTTPS | 443 |
| JDBC | the database port |

Missing interfaces are usually 9997. Inferred ones are usually 443 to SOAR, and 8089 otherwise.

**Local:** the link label or protocol is File handoff, File monitor input, Scripted input or WinEventLog input, or both ends have the same `hostId`. A local interface has no port, and no network connection.

**Carries (DIV-2):** the SvcV-6 Data values of the service flows it carries on the matching plane. Event data matches data flows; management and authentication match platform flows. Join distinct values with "; ". When none match, show the plane's default, marked as a default:
- event data: "Event";
- management: "DeploymentApp, ServerClass, DataInput";
- authentication: "User, UserRole".

Matching by plane is why Authentication Provider → Search Head carries "User, UserRole" and not SF-13's "Event, Finding".

**Status,** the first that applies:

| Status | Chip | When |
|---|---|---|
| Missing output | stop | missing |
| Add to topology | review | inferred |
| Local | ok | local |
| Plaintext | review | TLS is not Required (Optional, Not applicable or Unknown) |
| Port not set | review | no port |
| Declared | ok | otherwise |

### 1.3 Connections (SV-2)

A connection is one TCP or UDP conversation: who opens it, and who listens. Make one for each declared interface that isn't local. Also make a **planned** connection for each missing interface with a target, and for each inferred interface.

| Interface | Opens | Listens |
|---|---|---|
| Event data, by default | from | to |
| Event data labelled Search dispatch or Splunk Cloud search (the search head connects to the indexer); REST/HTTPS polling, REST modular input, REST/HTTPS collection or JDBC (the collector polls) | to | from |
| Management: deployment client, content promotion, load balancer pool. Clients phone home, and a load balancer opens to its pool | to | from |
| Authentication from a user | the user | the provider |
| Authentication from a provider using LDAP (relation `method`, authentication type, or the provider's `providerProtocol`) | to: the Splunk component binds | the provider, usually 636 (LDAPS) or 389 |
| Authentication from a provider using SAML or OpenID Connect | each user linked to that provider (their browser) | to |
| Missing or inferred (planned) | from | to |

For SAML and OpenID Connect, the browser carries the assertion, so the provider never connects to the component. Make one connection per linked user, listed under the provider → component interface. The user's sign-in interface keeps its own connection. With no linked user, there is no connection.

A connection takes its interface's port, TLS and protocol.

**Load balancers:**
- **Load balancer** (`lbMethod` `proxy`): client → load balancer and load balancer → member, as the table gives. The member sees:
  - the clients' addresses when `lbClientIp` is `dnat`;
  - the load balancer's address for `snat`, `proxyProtocol` or `xff`;
  - an unknown source for `notSet`.
- **DNS round robin or floating virtual IP** (`dns`, `vip`): nothing connects to or from the load balancer. Make one connection from each client to each member instead. It takes the member-side interface's port and TLS, and lists both interfaces ("SI-7 + SI-8"). The same applies to deployment clients through a pool.

**Crossing:** the opener's segment differs from the listener's. The **source segments** are the segments the listener sees: the opener's, or the clients' segments with DNAT.

**Volume (event data):** the interface's OV-3 volume, using SvcV-6's per-edge rule: `builderOvVolume136` on the OV-3 flow reduced to this edge. There is none when `builderOv3Volume139` reads n/a, Not set or on demand (search results).
- DNS and floating-IP connections take the member-side interface's volume.
- A missing output's **planned volume** is the sum of the known volumes into its forwarder. That is about 92 GB/day for Universal Forwarder 2 in the reference topology.

### 1.4 Network paths (NP-n)

**Grouping:** crossing connections, grouped by opener's segment and listener's segment, numbered in order of their first connection.

**Fields:**
- connections, as SI IDs;
- ports, as "TCP 9997", "TCP/UDP 514" (TCP/UDP from the protocol text), or "port not set";
- GB/day: the sum of the known volumes of declared connections;
- Mbps average: GB/day × 8,000 ÷ 86,400, to one decimal place;
- planned GB/day: the sum of planned volumes.

**Status:**
- Plaintext, if any declared connection's TLS isn't Required;
- otherwise Port not set, if any declared connection has no port;
- otherwise Planned, if any connection is planned;
- otherwise Ready.

### 1.5 Firewall rules (FW-n)

**Grouping:** one rule per source segment, listener, port (or usual port when not set) and plane, over the crossing connections. A DNAT connection gives one rule per client segment. Number them in order of their first connection.

**Fields:**

| Field | Rule |
|---|---|
| Source | The segment label, and the distinct subnets of the systems in it whose addresses the listener sees; "subnet not set" when none |
| Destination | The listener's name, its `lbAddress` (a load balancer) or `subnet`, and its segment |
| Port | Protocol (TCP, UDP or TCP/UDP) and port, or Not set with the usual port |
| Carries | The SI IDs, and the protocol |
| TLS | The TLS values of its declared connections |

**Status,** the first that applies:

| Status | Chip | When |
|---|---|---|
| Planned: add the link first | ext | all its connections are planned |
| Plaintext across a boundary | stop | a declared connection's TLS isn't Required |
| Review: DMZ to internal | stop | the source zone's name contains "DMZ" and the listener's zone's doesn't |
| Port not set | review | no port |
| Client IP handling not set | review | a load balancer connection with `lbClientIp` `notSet` |
| Ready to request | ok | otherwise |

### 1.6 SV-6 attributes

These attributes are per interface. "The carried flows" means the SvcV-6 flows on the matching plane (1.2 Carries).

| Group | Attribute | Rule |
|---|---|---|
| Exchange | Data (DIV-2) | Carries |
| | Format | The carried flows' Format, distinct, joined; else Not set |
| | OV-3 | The RF, or "None" |
| | SvcV-6 | All its SF IDs, any plane, or "None" |
| | Status | 1.2 |
| Performance | Frequency | Management with `relation.phoneHome` → "Phone-home every n s"; else the carried flows' Frequency; else Not set |
| | GB/day | Event data only, else "—". Declared: the volume, "< 1" below 1, "n/a (results)" for search dispatch, Not set when unknown. Missing: "≈ n planned" when its planned volume is above 0, else Not set. Inferred: "—" |
| | Mbps average | GB/day × 8,000 ÷ 86,400, one decimal place, when there is a number of 0.01 or more; else "—" |
| | Events/s | GB/day × 10⁹ ÷ event size ÷ 86,400, rounded with thousands separators, when exactly one carried data flow has a numeric Average bytes; else "—" |
| | Latency | Declared: `latencySloSeconds` above 0 → "≤ n s", else Not set. Otherwise: the carried flows' Latency, or Not set |
| | Availability | Declared event data: `builderOv3Availability139` on the reduced OV-3 flow. Other declared: `availabilitySlo` above 0 → "n%", else Not set. Otherwise Not set |
| Security and boundary | Classification | `flowClassification`; else the pack classification for event data; else "Internal" (default) |
| | Confidentiality | Not declared: Not set. Local: "Same host (local disk)". UDP in the protocol: "None (UDP port)", using 514 when the port isn't set. TLS Required: "TLS 1.2+" (as SvcV-6). Optional: "TLS optional". Not applicable: "None (no TLS)". Unknown: Not set |
| | Integrity | Declared: `builderOv3Integrity139` on the reduced OV-3 flow, with "response" or "established" turned into Not set (as SvcV-6). Otherwise Not set |
| | Authentication | Declared: `authenticationType` unless Not specified or Not applicable; else Not set |
| | Boundary | Local: "Same host". Otherwise, from its connections (the provider → component interface owns the browser connections): "From segment → to segment" when crossing, "Inside segment" when not. "—" with no connection |

**Origin marks:** values taken from SvcV-6 show "from SF-03" in muted text under them, and plane defaults show "default". Values from the link show no mark.

**Flags:**
- **PII:** the classification contains PII.
- **Needs attention:** the status isn't Declared or Local, or any attribute is Not set, or Confidentiality starts with "None".

## 2. Diagram layout (SV-1 and SV-2)

Both diagrams use one layout. It is drawn as SVG, with the viewBox at the computed size and `width:100%; min-width:900px; max-width:<width>px`. It shrinks to fit a narrower sheet, and scrolls inside its box below 900px.

**Columns:**
- the tier columns of 1.1, keeping only those with at least one system;
- column `i` at x = 24 + i × 190;
- boxes are 150 × 46, so each gutter between columns is 40px wide;
- column headings in small mono uppercase at y = 16.

**Bands:**
- One band per location. Order them by the lowest column of their systems, then by their lowest rank.
- The band starts at y = 28. Each band is a dashed, rounded frame with the location in small mono uppercase at the top left. Bands are 12px apart.
- Inside a cell (band × column), systems stack in rank order, 56px apart.

**Zone boxes (SV-2 only):**
- Inside each band, group systems by segment. A group's span is its lowest to highest column.
- Order the groups by lowest column, then rank. Put each in the first row where its span overlaps no other group's.
- Each row gets a 24px label strip. The zone box covers its span (10px outside the boxes) and the row's height.
- Labels: the zone name, or "Splunk Cloud" for managed, or "`<environment>` (environment)" when the zone isn't set. Under it, the subnets, "subnet not set", "managed by Splunk" or "zone not set". Truncate both with "…".
- Styles:
  - a zone with "DMZ" in its name is amber;
  - Splunk Cloud is purple (`--ovAuth`);
  - an unset zone has a dotted outline and no fill.
- When a band has one group and its zone isn't set, draw no zone box; add "zone not set" after the band label instead.

**System boxes:**
- Rounded 5, or 23 for a person. Show the name in up to two lines (wrapping at about 21 characters, with "…" on the second line). When the name fits on one line, show a second line in small mono:
  - the component;
  - "⇄ Load balancer", "⇄ DNS round robin" or "⇄ Floating VIP";
  - for managed systems, the component and " · managed".
- Border by kind:
  - external: dashed;
  - person: dotted;
  - managed: `--ovAuth`;
  - network: `--ovMgmt`, 1.6px;
  - SV-1 only, a system with no interface: amber dashed.
- Each box is focusable (tabindex 0, `role="button"`, `aria-pressed`), with a `<title>` giving the name, component and subnet.

**Routing (orthogonal):**
1. **Type of route:**
   - Same column, same band and zone group, neighbouring rows: a straight drop between the facing edges.
   - Same column otherwise: a bracket on the left, along a lane in the gutter left of the column.
   - Different columns: out of the right side and into the left side going rightward; left into right going leftward.
   - Same row of the same group with no box between: a straight run.
2. **Attach points:** gather the lines on each box side, and sort them by the y of their other end. One line attaches at the middle; several spread evenly from 8px below the top to 8px above the bottom. A straight run whose two ends now differ in y becomes a lane route.
3. **Lane routes:** out of the box at its attach y, along to a lane, vertically to the other end's y, then into the box. The lane is in the gutter beside the target's column: left of it going rightward, right of it going leftward. Use the gutter beside the source's column instead when that crosses fewer boxes with its two horizontal runs. Each line takes the next lane in its gutter (6px in, then every 5px, cycling after 6).
4. Corners are rounded with a radius of 6, and there is an 8px arrowhead at the end. Lines are drawn under the boxes. Each has a transparent 12px hit path.
5. **A missing output with no target:** a 22px red dashed stub from the right side, ending in a small circle with "?".

**Tags:**
- A pill with mono 9px text (SV-1: the SI ID; SV-2: the port, or "?").
- On a lane route, try the vertical segment first at 0.5, 0.3, 0.7, 0.15 and 0.85 of its length (when it is at least 28px). Then try the whole path at 0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12 and 0.88.
- Keep the first spot that overlaps no box and no earlier tag. Otherwise use the middle.

**Selection:**
- Click, or Enter or Space, selects. The selected item and its connected items stay; everything else dims (systems to 0.25, lines and tags to 0.1). The register rows involved are marked.
- Selecting again, or pressing Esc, clears.

## 3. SV-1 page

1. **Summary:**
   - systems, locations, declared interfaces, on one host;
   - in the review colour: missing outputs, inferred (not in the topology), plaintext, ports not set (port issues, including plaintext interfaces without a port), unconnected systems.
2. **Figure:** the layout of section 2, without zone boxes. Lines are the interfaces, styled by plane:
   - event data: solid;
   - management: dashed 7 4;
   - authentication: dotted 2 4, round caps.

   Inferred lines are amber dotted and missing ones red dashed. Tags carry the SI ID: red outline for missing or plaintext; amber dashed for inferred or no port. Arrows follow the Builder link. The legend is the mockup's.
3. **Detail panel,** below the figure (the figure needs the width). Its fields form a grid of pairs.
   - **Nothing selected:** "n of N interfaces ready", the interfaces that aren't (chip, ID and ends), unconnected systems, and the hint.
   - **System:** its location, component, managed note and instances. Then:
     - the network zone and subnet ("(environment; no zone set)" when unset);
     - load balancer method, client address handling and address;
     - its interfaces (ID, direction, other end, protocol and port, and the chip when not ready);
     - owner.
   - **Interface:**
     - protocol;
     - port, with the usual port when not set;
     - TLS;
     - carries;
     - implements (OV-3 RF and SvcV-6 SF);
     - status;
     - a hint for the status;
     - "Edit link in the Builder" on declared interfaces.
4. **Interface register:** ID, From, To ("An indexer" with no target), Plane (swatch and name, no wrap), Protocol, Port (with the usual port under "Not set"), TLS (Required plain; others as chips; Not set), Carries (DIV-2), Source (Declared / Missing output / Inferred (OV-2, SvcV-6)), Status. Rows select.
5. **System register:** System (with "≈ n instances"), Builder component ("Managed" chip), Location, Network zone · subnet, Interfaces (count, or a "None" chip), Owner. Rows select.
6. **Findings** (show each only when it applies):

| Finding | When | Text (follow the mockup) |
|---|---|---|
| Missing output (stop) | missing interfaces | Names the forwarders, the planned volume when 1 GB/day or more ("Universal Forwarder 2 receives about 92 GB/day that reaches no indexer"), and the SI IDs |
| Inferred | inferred interfaces | Lists them with IDs; asks for links so port and TLS are recorded |
| Plaintext | plaintext interfaces | Lists them; says which carry PII; suggests TLS on 6514 or keeping the hop inside one zone |
| Port not set | port issues | Lists them with their usual ports |
| Unconnected | systems with no interface | Names them |
| TLS (ok when all) | always | "n of m network interfaces require TLS", plus the count on one host |

## 4. SV-2 page

1. **Summary:**
   - network segments;
   - "n of m systems with a network zone" (leaving out managed systems);
   - connections, cross a boundary, network paths, firewall rules;
   - in the stop colour: plaintext across a boundary, and DMZ to internal;
   - in the review colour: ports not set, and planned.

   Show the last four only when they are above zero.
2. **Figure:** the layout of section 2 with zone boxes. Lines are the connections, from the opener to the listener:
   - crossing: 2.6px;
   - inside one segment: 1.1px at 0.75 opacity;
   - plaintext across a boundary: `--stop`;
   - planned: amber dotted.

   Tags show the listening port, or "?" with an amber dashed outline. Zone boxes are focusable and select their segment. The legend is the mockup's.
3. **Detail panel,** below the figure:
   - **Nothing selected:** "n of N rules ready to request", and the rules that aren't.
   - **System:** zone, subnet, address (load balancers), Opens, and Listens for. Opens and Listens for list each connection's other end, port, and a "Crosses" chip.
   - **Connection:**
     - port (or Not set, with the usual port);
     - protocol and TLS (red when it crosses without TLS);
     - boundary;
     - network path with its volume;
     - firewall rules with status;
     - volume, or the planned volume;
     - the SAML note on browser connections ("The browser carries the SAML assertion: the identity provider never connects to Search Head 1");
     - the load balancer note: DNAT, SNAT, PROXY protocol, X-Forwarded-For, Not set, or DNS and floating IP (see the mockup's texts);
     - "Edit link in the Builder" when declared.
   - **Segment:** location and zone, subnets, systems, paths in and out.
   - **Path or rule:** its connections, bandwidth or fields.
4. **Network paths table:**
   - ID, From segment, To segment, Connections, Ports;
   - GB/day: "< 1" when only small values are known, "—" when none;
   - Mbps average;
   - Planned GB/day;
   - Status: Ready, Planned, Port not set or Plaintext.
5. **Firewall rules table:** ID, Source, Destination, Port, Carries, TLS, Status (1.5).
   - A **Download CSV** button beside the heading, using `downloadText`, file `sv2-firewall-rules.csv`.
   - Columns: Rule, Source segment, Source subnets, Destination, Destination address, Protocol, Port, Interfaces, TLS, Status.
6. **Connections inside one segment:** a closed `<details>`, "n connections stay inside one segment and need no boundary rule". It holds a table with Interface, Opened by, Listener, Port and Segment.
7. **Findings:**

| Finding | When | Text |
|---|---|---|
| Zones (review) | No system has a zone; or some don't | "No network zones are set. Each segment is a location…"; or "n of m systems have no network zone…" with their names |
| In clear (stop) | Plaintext rules | The rules and the segments they cross. The events include PII. Move the syslog hop inside the source zone, or use TLS on 6514 |
| DMZ to internal (stop) | DMZ rules | Rule, source, listener and port; confirm or move the receiver |
| Port not set (review) | Port rules | "n rules can't be written until the link has a port", with SI IDs and usual ports |
| Planned (ext) | Planned rules | "…follow from interfaces the topology doesn't have yet…" |
| Bandwidth (ok) | Any path above 0 Mbps | The busiest path's GB/day and Mbps; each path with a planned volume ("NP-10 will carry about 92 GB/day (8.5 Mbps) once its link is added"); "Size links for the peak, not the average." |
| Load balancer (ext) | Each load balancer | Its client address handling. With DNAT: when its member connections cross, say rules toward members use the clients' subnets; when they don't, say no extra boundary rule is needed but the members' host firewalls must allow the clients' subnets. DNS or floating IP: clients connect to members directly |
| Same host (ok) | Local interfaces | Their count and IDs; they need no network rule |

## 5. SV-6 page

Follow SvcV-6's page (`builder-svcv6-v172`) for structure, sticky column, scrolling, detail panel and print.

1. **Summary:**
   - system interfaces, OV-3 flows, carry PII;
   - PII in clear (stop, only when above zero);
   - in the review colour: attributes not set, with no Builder link (missing and inferred), and OV-3 flows with no interface.
2. **Toolbar:**
   - segmented column groups: Exchange / Performance / Security and boundary;
   - plane chips with counts: All, Event data, Management, Authentication;
   - "Needs attention only (n)".

   There is no Load example; nothing is edited here.
3. **Matrix** (`min-width: 760px`, so the Exchange group fits beside the panel):
   - The sticky first column shows the plane swatch, the SI ID, "from → to", and a small line with the protocol and "port n", "port not set" or "same host".
   - Numbers are right-aligned in tabular figures.
   - "Not set" shows as the review chip. A Confidentiality starting with "None" is red; Integrity "None" is red on PII rows.
   - Status chips may wrap.
4. **Detail panel:**
   - **Nothing selected:** "n attributes not set", one line per interface needing attention: "PII in clear", its status, or the attributes not set. Then "n of N interfaces carry PII", and the hint.
   - **Interface:** every attribute with its origin mark, then the buttons "Edit link in the Builder" (declared) and "Open SF-nn in SvcV-6" (its first SF).
5. **Trace to OV-3:** one card per OV-3 flow with its ID, its needline ("from → to") and its interfaces. Mark missing or inferred ones "(missing)" or "(inferred)". A flow with no interface reads "No system interface" in the review style.
6. **Findings:**

| Finding | When | Text |
|---|---|---|
| In clear (stop) | PII with confidentiality None | The IDs and values; add "Their integrity is None too…" when it is |
| No link | missing or inferred interfaces | "n interfaces have no Builder link, so their protection is not set", with the list |
| Not set | declared interfaces with Not set values | Per attribute, the count ("Authentication is not set on 10 interfaces"). When authentication is among them: "TLS without a client certificate or token encrypts the stream but does not prove who sent it." |
| Unmet | OV-3 flows with no interface | Their IDs and needlines |
| Rate (ok) | Any GB/day of 1 or more | The busiest interface, its GB/day, Mbps and events/s |

## 6. Edit links and service flows

- **Edit link in the Builder:**
  1. `switchView('builder')`;
  2. `selectBuilderEdge(plane, id)`, with the trace edge's own `id`;
  3. scroll `#builderRelationshipInspector` into view;
  4. when the port is the issue, focus `[data-relationship-field="port"]`.

  Checked on Build 187: this opens the canvas inspector with the link's relationship fields.
- **Open SF-nn in SvcV-6:** as SvcV-2's "Edit in SvcV-6":
  1. `builderOvShow135('svcv6')`;
  2. clear its plane and attention filters;
  3. select the row and scroll it into view.

## 7. Trace from the services views (one in-place edit)

The SvcV-6 handoff asked for the SI IDs once SV-1 exists.

**In-place edit.** In `builder-svcv6-v172`, at the end of `model172`, replace:

```js
return{services,flows,interfaces:[...interfaceMap.values()],rfByEdge};
```

with:

```js
const result={services,flows,interfaces:[...interfaceMap.values()],rfByEdge};window.builderSvInterfaceIds1xx?.(result);return result;
```

**The hook.** The SV block defines `builderSvInterfaceIds1xx(model)`. It numbers the interfaces as in 1.2, using this `model` and `builderTraceEdges('all')`, and does not call the service model again. For each interface item:
- it sets `item.si`;
- it prefixes the label: "SI-3 · Universal Forwarder 1 → Indexer 1".

SvcV-2 ("Implements"), SvcV-3a, SvcV-3b, SvcV-4 and SvcV-6 ("Interfaces", "Carried by") then name interfaces by SI ID. Nothing else in those pages changes.

The SV model itself numbers from keys, never labels.

## 8. Print and pack

**Print** (`beforeprint`):
- SV-1 and SV-2 print the figure at page width, nothing dimmed, then the tables. The SV-2 inside-segment table is included, open.
- SV-6 prints the three column groups as stacked tables, with the interface column repeated, as SvcV-6 does.
- An unticked section is hidden.

**Pack:** the same read-only pages.

**Records:** a `changeRegister` entry ("Adds SV-1 Systems Interface Description, SV-2 Systems Resource Flow Description and SV-6 Systems Resource Flow Matrix, derived from the canvas links, zones, subnets and load balancers"), and the build stamp.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - All tabs render. The architecture pack builds with the three new pages after SvcV-6.
   - OV-1/2/3, DIV-1, TM-1, CV-1/2 and SvcV-1 to 6 are unchanged, except that interface names gain their SI prefix (section 7).
2. **Default topology:**
   - **SV-1:** 4 systems in 1 location ("Location not set"). Interfaces:
     - SI-1 Syslog Source 1 → Syslog Server 1: Plaintext;
     - SI-2 Syslog Server 1 → Universal Forwarder 1: Local;
     - SI-3 Universal Forwarder 1 → Indexer 1: Port not set, usually 9997.
   - **SV-2:** 1 segment and 2 connections, none crossing. No paths or rules. The Zones finding shows.
   - **SV-6:** 3 interfaces, all PII; 1 in clear; 4 attributes not set.
3. **Reference topology:**
   - **SV-1:**
     - 17 systems in 6 locations;
     - 18 interfaces: 12 declared (2 local), 2 missing, 4 inferred;
     - 2 plaintext; 6 ports not set; unconnected: Windows Event Log 1.

     | SI | Interface | Status |
     |---|---|---|
     | SI-1 | Firewalls and network devices → Syslog Server 1 | Plaintext |
     | SI-2 | Syslog Server 1 → Universal Forwarder 1 | Local |
     | SI-3 | Universal Forwarder 1 → Indexer 1 | Port not set |
     | SI-4 | Indexer 1 → Search Head 1 | Port not set |
     | SI-5 | Syslog Source 2 → Syslog Server 2 | Plaintext |
     | SI-6 | Syslog Server 2 → Universal Forwarder 2 | Local |
     | SI-7 | AWS Lambda 1 → Heavy Forwarder 1 | Declared |
     | SI-8 to SI-10 | Deployment Server 1 → Universal Forwarder 1, Universal Forwarder 2, Heavy Forwarder 1 | Declared |
     | SI-11 | Administrator 1 → Authentication Provider · Cloud 1 | Port not set |
     | SI-12 | Authentication Provider · Cloud 1 → Search Head 1 | Port not set |
     | SI-13, SI-14 | Universal Forwarder 2 → Indexer 1; Heavy Forwarder 1 → Indexer 1 | Missing output |
     | SI-15 to SI-18 | Search Head 1 → SOAR Cloud; License Manager 1 → Indexer 1; Monitoring Console 1 → Indexer 1; Monitoring Console 1 → Search Head 1 | Add to topology |

     OV-3: SI-15 traces to RF-13, and SI-16 and SI-17 trace to RF-09. SI-18 has none.
   - **SV-2:**
     - 7 segments; 0 of 16 systems with a network zone;
     - 16 connections, 11 crossing;
     - 7 paths. NP-1 is Sydney → Multisite: SI-3, SI-14, SI-16, SI-17 and SI-18, 230 GB/day, 21.3 Mbps. NP-6 is Melbourne → Multisite, with ≈ 92 GB/day planned.
     - 9 rules:
       - FW-1 Sydney ⇒ Indexer 1 (SI-3, SI-14): Port not set;
       - FW-2 AWS ap-southeast-2 ⇒ Heavy Forwarder 1, TCP 8088: Ready to request;
       - FW-3 Melbourne ⇒ Deployment Server 1, TCP 8089: Ready to request;
       - FW-4 and FW-5 (the SAML pair): Port not set;
       - FW-6 to FW-9: Planned.
     - The browser connection is Administrator 1 ⇒ Search Head 1, under SI-12.
   - **SV-6:**
     - 18 interfaces and 14 OV-3 flows; 10 carry PII;
     - 2 in clear (SI-1 and SI-5, "None (UDP 514)");
     - 41 attributes not set; 6 with no Builder link;
     - RF-12 and RF-14 have no interface; all 18 need attention.
     - SI-1 reads 230 GB/day, 21.3 Mbps and 6,655 events/s. SI-13 reads "≈ 92 planned".
4. **`sv-zones-topology.json`:**
   - **SV-1:** 20 systems, 22 interfaces (16 declared, 3 local); 4 plaintext (SI-1, SI-2, SI-6, SI-9); 0 ports not set.
   - **SV-2:**
     - 12 segments; 19 of 19 systems with a network zone;
     - 19 connections, 16 crossing; 13 paths;
     - 14 rules:
       - FW-1 Sydney network ⇒ Syslog VIP and FW-3 Melbourne network ⇒ Syslog Server 2: Plaintext across a boundary;
       - FW-7 Sydney DMZ ⇒ Deployment Server 1, 8089: Review: DMZ to internal;
       - FW-2, 4, 5, 6, 8 and 9: Ready to request;
       - FW-10 to 14: Planned.
     - The Syslog VIP → members connections stay inside Sydney collection with the firewalls' addresses (DNAT). The Load balancer finding says no extra boundary rule is needed.
   - **SV-6:** 22 interfaces and 18 OV-3 flows; 14 PII; 4 in clear; 46 not set; RF-16 and RF-18 have no interface.
5. **Edits to the reference topology:**
   - **Port 9997 on Universal Forwarder 1 → Indexer 1:** SI-3 becomes Declared and FW-1 becomes "Ready to request" (still SI-3 and SI-14).
   - **A data link Heavy Forwarder 1 → Indexer 1:** it becomes SI-8 (Port not set), and the later IDs move up by one. 1 missing output is left, and SvcV-6 SF-06 is In place.
   - **Network zone "DMZ" on Heavy Forwarder 1:** 8 segments; FW-4 "Sydney · DMZ ⇒ Deployment Server 1, 8089" is "Review: DMZ to internal"; 11 rules.
6. **Load balancers** (on the reference topology, with new components in Sydney):
   - **Load balancer "Deploy VIP", SNAT, in front of Deployment Server 1, plus Deployment Server 2 in its pool:**
     - SI-8 Deployment Server 1 → Deploy VIP;
     - SI-9 to SI-11 Deploy VIP → Universal Forwarder 1, Universal Forwarder 2, Heavy Forwarder 1;
     - SI-12 Deployment Server 2 → Deploy VIP;
     - FW-3 "Melbourne ⇒ Deploy VIP, TCP 8089" is Ready to request. Deploy VIP opens to both Deployment Servers inside Sydney.
   - **DNS round robin "HEC DNS" in front of Heavy Forwarder 1 and a new Heavy Forwarder 2:**
     - SI-7 AWS Lambda 1 → HEC DNS, SI-8 and SI-9 HEC DNS → each Heavy Forwarder;
     - the connections are "SI-7 + SI-8" and "SI-7 + SI-9", straight from AWS Lambda 1 to each Heavy Forwarder;
     - FW-2 and FW-3 allow AWS ap-southeast-2 to each Heavy Forwarder on TCP 8088;
     - HEC DNS has no connections, and the Load balancer finding says clients connect directly.
7. **Edit links:**
   - "Edit link in the Builder" on SI-3 opens the Builder with Universal Forwarder 1 → Indexer 1 selected and the Port field focused.
   - "Open SF-03 in SvcV-6" selects SF-03.
8. **Services trace:**
   - SvcV-6's "Carried by" card reads "SI-3 · Universal Forwarder 1 → Indexer 1" over "RF-03 · SF-03".
   - SF-03's Interfaces attribute starts "SI-3 · Universal Forwarder 1 → Indexer 1 · RF-03".
   - SvcV-2's "Implements" uses the same names.
9. **Layout:**
   - No two system boxes overlap.
   - No tag overlaps a box or another tag on the three test topologies.
   - Every line has its own lane in its gutter.
   - No page-level sideways scroll at 400px or 768px. Dark and light are both readable.
10. **Save and load:**
    - The pack switches round-trip.
    - An older file without them opens with all three on.
    - No other new field is written.
11. **Pack and print:** SV-1, SV-2 and SV-6 come after SvcV-6, read-only. In print, nothing is dimmed and each figure is followed by its tables.

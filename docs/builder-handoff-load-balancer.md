# Builder handoff: Load balancer

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 184 (`builder-review-v184`). The Build 184 recheck's plural fix ([`builder-handoff-build184.md`](builder-handoff-build184.md)) can go in the same build.
**Two new blocks:**
- `<script id="builder-load-balancer-helpers-v185">`, placed right after `builder-multi-input-relations`. It holds only the helper functions in item 7a, because earlier blocks call them while the page loads.
- `<script id="builder-load-balancer-v185">` with its own `<style>`, after `builder-review-v184`. Everything else goes here.

**Wrappers, plus a few in-place edits:** some type checks sit inside closures that no wrapper can reach. Item 10 lists them. Make only those.
**Mockup (the target):** [`docs/mockups/builder-load-balancer-mockup.html`](mockups/builder-load-balancer-mockup.html). It has three scenes: syslog servers, HEC endpoints and Deployment Servers. Screenshots: `docs/mockups/compare/load-balancer-syslog.png` and `load-balancer-deployment.png`.
**Tested first:** the view changes in items 7 and 10 were tried on a copy of Build 184. With them, a topology with a load balancer gives the same CV, SvcV, DIV-1 and OV results as the same clients linked straight to the members, apart from the differences listed under "Check before uploading". Topologies without a load balancer are unchanged.

## Why

**What it's for:** a load balancer gives a pool of identical components one address. Clients send to the address, and the load balancer passes each connection to one member. In Splunk deployments it most often sits in front of:
- **syslog receivers** (Syslog Servers or SC4S);
- **HTTP Event Collector** receivers;
- **Deployment Servers**: from Splunk Enterprise 9.2, up to 3 Deployment Servers can form a cluster behind a load balancer or a DNS name.

**Splunk's guidance,** which the rules in item 8 follow:
- **Syslog:** SC4S calls load balancers not a best practice, except for senders on the untrusted internet. UDP only works through DNAT, which keeps the sender's address. TCP and TLS can use DNAT, or SNAT with the PROXY protocol (`SC4S_SOURCE_PROXYCONNECT=yes`). TCP connections tend to stay on one member, and the load balancer becomes a new single point of failure. For high availability, SC4S recommends MetalLB in BGP mode.
- **HEC with acknowledgement:** use sticky sessions with the longest cookie timeout the load balancer allows. Duplicates are still possible.
- **Deployment server cluster:** every server runs 9.2 or later, with `deployment_apps` and `client_events` on a shared drive. At most 3 servers, about 25,000 clients each. Clients can run older versions; they connect to the load balancer or DNS name.
- **Forwarders to indexers:** no load balancer. Forwarders balance across indexers themselves (autoLB), or use indexer discovery.

**What the Builder does today:**
- **No component:** load balancers appear only in text: an access route value, the Splunk Web endpoint "through search-tier load balancer", and some failure descriptions.
- **Wrong picture:** to show two syslog servers behind one address, you have to link the source to each server. The canvas and the firewall matrix then show connections that don't exist.

Sources are listed at the end.

---

## 1. The component

| Property | Value |
|---|---|
| Type | `loadBalancer` |
| `builderComponents` entry | name "Load Balancer"; type "Network load balancer"; colour `#9db4cc`; stages Virtual IP listener, Health checks, Member selection, Client address handling, Session persistence. The stages are Failure Lab's fault points. The card shows its own facts instead (item 3) |
| Default instance name | "Load Balancer 1", by the usual instance naming |
| Owner | `componentDefaultOwner.loadBalancer='Network team'` (an existing party) |
| Security zone | `componentSecurityZone.loadBalancer='customer'`. The Network zone field works as for any component |
| Static data table | Push `'loadBalancer'` onto `builderDataCapabilities` for `syslogSource`, `hecClient`, `awsLambda`, `azureFunction` and `apiCollector`. Set `builderDataCapabilities.loadBalancer=['syslog','hecEndpoint','hf','idx','edgeProcessor']`. File import checks this table, so the links need it; the real checks are in item 4 |
| Region and environment | When it gets its first link, copy that component's region and environment, unless they were already changed from the defaults. This keeps OV-2 locations as they were |

**New fields** on the node:

| Field | Values | Default |
|---|---|---|
| `lbServes` | `'syslog'` (Syslog receivers), `'hec'` (HTTP Event Collector), `'deployment'` (Deployment Servers) | from the first link (item 4a), otherwise `'syslog'` |
| `lbMethod` | `'proxy'` (Load balancer), `'dns'` (DNS round robin), `'vip'` (Floating virtual IP: keepalived, MetalLB) | `'proxy'` |
| `lbProduct` | Not set, F5 BIG-IP, Citrix NetScaler ADC, HAProxy, NGINX, AWS Network Load Balancer, AWS Application Load Balancer, Azure Load Balancer, Google Cloud Load Balancing, MetalLB, keepalived, Other | Not set |
| `lbAddress` | host name or IP address: `^[A-Za-z0-9.:-]{1,253}$` | `''` |
| `lbListeners` | listener IDs from the table below, at least one | syslog `['udp514','tcp514']`; HEC `['https8088']`; deployment `['https8089']` |
| `lbLayer` | `'l4'`, `'l7'` | `'l4'` |
| `lbTls` | `'passthrough'`, `'terminate'`, `'reencrypt'` | `'passthrough'` |
| `lbClientIp` | `'notSet'`, `'dnat'` (Kept: DNAT), `'proxyProtocol'`, `'xff'` (X-Forwarded-For, layer 7 only), `'snat'` (Not kept: SNAT) | `'notSet'` |
| `lbPersistence` | `'notSet'`, `'none'`, `'sourceIp'`, `'cookie'` (layer 7 only) | `'notSet'` |
| `lbHealthCheck` | `'notSet'`, `'tcp'`, `'http'`, `'none'` | `'notSet'` |
| `lbHa` | `'notSet'`, `'single'`, `'pair'` (Active–standby pair), `'cluster'` (Active–active cluster), `'cloud'` (Cloud-managed across zones) | `'notSet'` |
| `lbDsVersion` | `'notRecorded'`, `'yes'`, `'no'`: "All members run Splunk Enterprise 9.2 or later" | `'notRecorded'` |
| `lbDsSharedDrive` | `'notRecorded'`, `'yes'`, `'no'`: "deployment_apps and client_events are on a shared drive" | `'notRecorded'` |

**Listeners:**

| ID | Shown as | Serves | Port | TLS |
|---|---|---|---|---|
| `udp514` | UDP 514 | syslog | 514 | No |
| `tcp514` | TCP 514 | syslog | 514 | No |
| `tls6514` | TLS 6514 | syslog | 6514 | Yes |
| `https8088` | HTTPS 8088 | HEC | 8088 | Yes |
| `https443` | HTTPS 443 | HEC | 443 | Yes |
| `https8089` | HTTPS 8089 | deployment | 8089 | Yes |

**Method rules:** DNS round robin and a floating virtual IP don't proxy. For them, `lbLayer`, `lbTls`, `lbClientIp`, `lbPersistence` and `lbHa` are kept in the file but aren't used. Clients keep their own address, and there's no single box in the path.

## 2. Palette

**New group "Network",** placed right after Collection:
- Create it like v148 created the Splunk Cloud group: insert it after the Collection group in the palette, in `builderPaletteBaseGroups` and in `accordionGroups`.
- Add `'Network'` to `builderPaletteGroupOrder` after `'Collection'`, so later sorts keep it there.

**The item:**

| Icon | Name | Subtitle |
|---|---|---|
| LB | Load balancer | One address in front of a pool |

- **Search terms:** "load balancer lb vip virtual ip address pool f5 big-ip netscaler citrix adc haproxy nginx nlb alb elb azure google metallb keepalived dns round robin syslog hec deployment server cluster".
- **Button:** create it as v106 and v179 do (`draggable`, click and drag handlers). Register it with the group: `builderPaletteBaseItems`, `builderPaletteOriginalIndex` and `syncPaletteAccordion()`. The group count is 1.

**Adding it.** Clicking the item, or dropping it on a card, depends on what's selected or dropped on. Each is one Undo step.

| Selected component | Result | Undo label |
|---|---|---|
| A possible pool member: Syslog Server, HEC Endpoint, Heavy Forwarder, Indexer, Edge Processor or Deployment Server | **Put it in front.** The load balancer takes over the member's incoming links: the member's `parent` and incoming `builderDataRelations` move to the load balancer, then load balancer → member. For a Deployment Server, its `deployment_client` relations move to the load balancer (`from` becomes the load balancer), then a pool link Deployment Server → load balancer (item 4c). Content promotion links stay on the Deployment Server. `lbServes` comes from the incoming links, or from the member when it has none (Syslog Server → syslog; HEC Endpoint, Heavy Forwarder, Indexer or Edge Processor → HEC; Deployment Server → deployment) | "Put load balancer in front of `<name>`" |
| A client: Syslog Source, HEC Client, AWS Lambda, Azure Function or API Collector; or, on the fleet-management plane, a Universal or Heavy Forwarder | Add it after the client, linked from it | "Add load balancer" |
| Nothing, or anything else | Add it unlinked, serving syslog | "Add load balancer" |

**Refused insertion:** if any incoming link of the selected member couldn't go through a load balancer (item 4d), nothing changes. The message names the first such link, for example "Indexer 1 receives Splunk-to-Splunk from Universal Forwarder 1. Forwarders balance across indexers themselves (autoLB), or use indexer discovery."

## 3. Canvas card

Wrap `unifiedNodeMarkup` for `loadBalancer` and replace the generic body. The size is the Builder's usual card size.

| Part | Content |
|---|---|
| Tier label | ⇄ Load balancer |
| Name | its instance name, for example "Syslog VIP" |
| Badges | High availability: HA PAIR, HA CLUSTER, CLOUD HA, or SINGLE and HA NOT SET in the review colour. DNS round robin shows DNS ROUND ROBIN; a floating virtual IP shows FLOATING VIP. Then a product tag with a short name (F5 BIG-IP, NetScaler, HAProxy, NGINX, AWS NLB, AWS ALB, Azure LB, Google Cloud LB, MetalLB, keepalived, Other) and the full name in its tooltip |
| Address | `lbAddress` in the mono face, or "Address not set" in the review colour |
| Fact 1 | Listeners: "UDP 514 · TCP 514", "HTTPS 8088" or "HTTPS 8089" |
| Fact 2 | "Pool · 2 Syslog Servers", plus " · no health check" in the review colour when the health check is None or Not set. "No pool yet" in the review colour with no members |
| Fact 3, syslog | "Sender address kept (DNAT)", "Sender address via PROXY protocol" (review colour with a UDP listener), "Sender address lost (SNAT)" in the bad colour, or "Sender address not recorded" in the review colour. DNS or floating virtual IP: "Senders reach members directly" |
| Fact 3, HEC | "Sticky sessions (cookie)", "Sticky by source IP", or "Not sticky", in the review colour with " · acknowledgement in use" when a client link records HEC acknowledgement |
| Facts 3 and 4, deployment | "Cluster · 9.2+ · shared drive", or "Cluster not confirmed" in the review colour; then "`<n>` clients phone home here" |
| Footer | "Serves syslog receivers", "Serves HEC" or "Serves Deployment Servers" |

- **Fit:** use the fit guard the managed cards use (Build 177 fix 2). When space runs out it hides fact lines from the last one up; the inspector still shows them all.
- **Accessible name:** "`<name>`, load balancer for `<serves>`, `<address or 'address not set'>`, `<n>` members".
- **Handles:** a syslog or HEC load balancer keeps the data handle. A deployment load balancer loses the data handle (strip it as v101 does) and gets the management handle, `connectionHandle('management',id)`, when the fleet-management plane is visible.
- **No generic badges:** drop the "N management links" line. Its pool links aren't management of the load balancer.

## 4. Links

### a. What it serves

`lbServes` decides the plane, the clients and the members:

| Serves | Plane | Clients (send to its address) | Pool members |
|---|---|---|---|
| Syslog receivers | Event data | Syslog Source | Syslog Server, Heavy Forwarder, Indexer, Edge Processor |
| HTTP Event Collector | Event data | HEC Client, AWS Lambda, Azure Function, API Collector | HEC Endpoint, Heavy Forwarder, Indexer, Edge Processor |
| Deployment Servers | Fleet management | Universal Forwarder, Heavy Forwarder | Deployment Server |

- **Set by the first link:** a Syslog Source or Syslog Server link sets syslog; a HEC client or HEC Endpoint link sets HEC; a Deployment Server or fleet-management link sets deployment. A first link to a Heavy Forwarder, Indexer or Edge Processor keeps the current value.
- **Changing it later:** the inspector allows it only while every link stays valid. Options that would break a link are disabled.

### b. Event data: syslog and HEC

**Wrap `dataCapability(source,target)`.** When either end is a load balancer:
- **Client → load balancer:** valid when the client type is a client of `lbServes`, and the client could link straight to every current member (`builderDataCapabilities[client.type]` includes the member's type).
- **Load balancer → member:** valid when the member type is a member type of `lbServes`, it's the same type as the current members, it isn't Splunk-managed (`builderIsSplunkManaged176` or Splunk Cloud indexing), and every current client could link straight to it.
- **Storage is unchanged:** the load balancer's first incoming link is its `parent`, and more go in `builderDataRelations`. Each member's link from the load balancer is the member's `parent` when it had none, or a data relation otherwise. The existing multi-input code does this.

### c. Fleet management: Deployment Servers

Wrap `managementCapability(a,b)` and `addManagementRelation(aId,bId)`:
- **Deployment Server ↔ load balancer** creates a **pool link**: `fleetRelation(dsId,lbId,{type:'load_balancer_pool',authority:'active',targetUri:'',clientName:''})`. It goes in `state.builderRelations`, so Undo, selection, drawing and the file work as for other management links.
- **Load balancer ↔ Universal or Heavy Forwarder** creates a client relation from the load balancer: `fleetRelation(lbId,clientId,{type:'deployment_client',authority:'active',targetUri:lb.lbAddress})`, and sets the client's `managementRequired`.
- **Label:** `builderEdgeRecord` labels a pool link "Load-balanced phone-home". Client relations keep "Phone-home and app delivery".
- **Address changes:** when `lbAddress` changes, update `targetUri` on its client relations that still hold the old address.
- **Clients still on a member:** when a pool member still manages clients directly, the inspector offers "Move `<n>` clients to `<name>`". It re-points those relations' `from` to the load balancer in one Undo step.

### d. Refused links

| Attempt | Message |
|---|---|
| Universal or Heavy Forwarder → load balancer on the data plane (Splunk-to-Splunk) | "Forwarders balance across receivers themselves (autoLB). Link `<forwarder>` straight to the indexers, or use indexer discovery." |
| A Splunk-managed member | "Splunk Cloud already balances its own inputs. Link straight to `<member>`." |
| A second member type | "A pool holds one kind of component. `<name>` already pools `<type>`s." |
| A client or member that doesn't fit `lbServes` | "`<name>` serves `<serves>`, so it can't take `<component>`." |
| Load balancer → load balancer | "A load balancer can't sit in front of another load balancer." |
| A data link to a deployment load balancer, or a fleet-management link to a syslog or HEC one | "`<name>` serves `<serves>`: draw its links on the `<plane>` plane." The plane is Fleet management or Event data |

### e. Link labels and details

**Labels.** Wrap `builderHandoff(parent,child)`. A transport the user set (`child.transport` not Automatic) still wins.

| Link | Label |
|---|---|
| Client → syslog load balancer | "Syslog " + its listeners, for example "Syslog UDP 514 · TCP 514" |
| Client → HEC load balancer | "HEC HTTPS 8088", "HEC HTTPS 443", or "HEC HTTPS 8088 · 443" |
| Load balancer → member, TLS pass-through or re-encrypted | the same label as the client side |
| Load balancer → member, TLS terminated | the label without TLS: "Syslog TCP 6514, decrypted at `<name>`" or "HEC HTTP 8088, decrypted at `<name>`" |

**Never compute pool membership from `builderTraceEdges` or `builderEdgeRecord`.** They call `builderHandoff` for labels, and `builderHandoff` needs the pool, so the page loops until the stack overflows. The helpers in item 7a read the raw links instead.

**Details defaults.** Wrap `defaultRelationshipDetails(edge)`:
- **Client → load balancer:** start from the defaults a direct link from the client to the first member would get, then:
  - endpoint `lbAddress` (or the load balancer's name);
  - port: the first listener's port;
  - TLS: Required when every listener is TLS or HTTPS, Optional when some are, Not applicable when none are.
- **Load balancer → member:** start from the defaults a direct link from the first client to the member would get, with the same port. TLS is as on the client side, or Not applicable when TLS is terminated.

Starting from the direct defaults keeps attributes such as "HEC token" authentication the same as without the load balancer.

## 5. Inspector

Wrap `renderBuilderInstanceInspector` as v183 does for Amazon S3.

**Identity box:** the usual fields, plus **Owner**, a select of the responsibility parties. It reads `responsibilityOwner(node)` and writes `state.responsibilityOwners[node.id]`, as v183 does.

**Then a "⇄ Load balancer" box, in this order:**
1. **Serves:** a select with the three values (item 4a). Hint: "Set by its first link. Options that would break a link are disabled."
2. **Method:** Load balancer (proxy), DNS round robin, Floating virtual IP (keepalived, MetalLB).
3. **Product.**
4. **Address.** Hint: "Clients send to this address. It becomes the endpoint on their links." For deployment, add: "…and the targetUri they phone home to." Invalid input shows "Enter a host name or IP address, such as syslog-vip.example.gov.au." and isn't saved.
5. **Listeners:** a checkbox per listener of the Serves value. The last checked one can't be cleared.
6. **Layer** and **TLS**, side by side. Layer is fixed at layer 4 for syslog, with the hint "Syslog needs layer 4." TLS is disabled with "No TLS listener." when there's none.
7. **Sender address (client IP).** X-Forwarded-For is offered at layer 7 only. Syslog hint: "UDP needs DNAT. TCP and TLS: DNAT, or SNAT with the PROXY protocol."
8. **Persistence** and **Health check,** side by side. Cookie is offered at layer 7 only. Switching to layer 4 turns Cookie into Source IP and X-Forwarded-For into Not set.
9. **High availability.**
10. **Guidance note,** by Serves:
    - **Syslog:** "SC4S guidance: load balancers aren't a best practice for syslog, except for senders on the untrusted internet. TCP connections tend to stay on one member, and the load balancer becomes a new single point of failure. For high availability, SC4S recommends MetalLB in BGP mode."
    - **HEC:** "With HEC acknowledgement, use sticky sessions with the longest cookie timeout the load balancer allows. Duplicates are still possible when a client moves to another member under load."
    - **Deployment:** "Two or more Deployment Servers behind one address are a deployment server cluster (Splunk Enterprise 9.2 or later): up to 3 servers, about 25,000 clients each, sharing deployment_apps and client_events on a shared drive. Clients can run older versions. If server classes match clients by IP address, keep the client's address or match by host name."

**DNS round robin or floating virtual IP:**
- Layer, TLS and Persistence are hidden.
- Sender address and High availability become read-only lines: "Kept: clients connect to members directly" (or "Kept: the floating address isn't translated"), and "Several DNS records" (or "The address moves between nodes").
- The health check stays. For DNS its hint is "Without health-checked DNS, clients keep reaching a failed member until its record is removed."

**Deployment only, a "Deployment server cluster" box:** the two `lbDs…` selects, then "`<n>` clients phone home here, within `<cap>` (`<members>` × 25,000). A cluster has at most 3 servers." Clients count by `instancesRepresented`.

**Links box:** each client and member, with its plane and label, and "Move `<n>` clients to `<name>`" when item 4c applies.

**Undo:** each change is one Undo step, "Update load balancer".

**Subtitle:** "Network load balancer · `<environment>` · `<region>`".

## 6. Volume and Failure Lab

- **Volume:** no change. `builderOvVolume136` already splits a component's volume evenly across its outgoing links, so each member gets an equal share and nothing is counted twice.
- **Failure Lab:** the load balancer can be the target, with its stages as the fault points. When the target is a pool member, and the load balancer has two or more members and a health check, add to the assessment: "`<name>` sends new connections to the other `<n−1>` members while its health check passes. UDP in flight to this member is lost."

## 7. Seeing through the load balancer

**The rule:**
- **Views about systems and services see through it:** CV-1, CV-2, SvcV-1 to SvcV-6 and DIV-1 give the same results as clients linked straight to the members.
- **Views about networks, threats and inventory show it:** the canvas, the network and firewall overlay, the threat model, inventory and the pack.
- **OV-1, OV-2 and OV-3:** it's part of its pool's operational node. It adds no node or needline, and its links to members become internal flows.

### a. Helpers (`builder-load-balancer-helpers-v185`)

They read `dataGraphEdges()` and `state.builderRelations` only (item 4e).

| Helper | Returns |
|---|---|
| `builderLbMembers(lb)` | its members: data-plane targets of its links, or the Deployment Servers with a pool link to it |
| `builderLbClients(lb)` | its clients: data-plane sources of links into it, or targets of its `deployment_client` relations |
| `builderLbEffectiveType(node)` | for a load balancer, its first member's type, or with no members a stand-in by Serves (`'syslog'`, `'hecEndpoint'`, `'ds'`). For anything else, `node?.type` |
| `builderLbResolve(id)` | for a load balancer, its members' IDs; otherwise `[id]` |
| `builderLbServerIds(id)` | for a load balancer, its Deployment Server members' IDs; otherwise `[id]` |

### b. Wrappers in the main block

| Function | Change |
|---|---|
| `builderTierOf130` | A load balancer takes its first member's tier. With no members: `collection` for syslog and HEC, `management` for deployment. Tier grouping then places it in its pool's column |
| `builderOvPlace138` | A load balancer takes its first member's place. With no members: the "Site collection" place at its region for syslog and HEC, and the "Platform management" place for deployment. A Heavy Forwarder or HEC Endpoint whose load balancer has a cloud source as a client (`builderOvCloud138`) gets the "Cloud ingestion" place, as it would linked straight from that source |
| `deploymentActiveRelation(dsId,clientId)` | Also accept an active `deployment_client` relation from a load balancer whose pool includes `dsId`. Server classes on any member then match the clients behind the load balancer |
| `builderThreatModel150` | Add two node threats. **D**, "A single load balancer stops every client behind it when it fails", risk High: method proxy with HA Single or Not set. **I**, "TLS ends on the load balancer, so it holds the key and sees the traffic", risk Medium: TLS Terminate or Terminate and re-encrypt. Use the same overrides as other threats |
| `builderInventoryRows` | The load balancer's Management authority reads "None", because pool links aren't authority. A client behind a deployment load balancer reads "`<name>` (`<member names>`)" |

## 8. Review rules

**Updated:**
- **AR-001** (production forwarders have management authority): a relation also counts when its `from` is a load balancer with a Deployment Server member. Pool links don't count.
- **AR-002** (data routes reach a destination): a load balancer is never a source (item 10).
- **AR-004** (redundant first hops): a load balancer is never a source. A child load balancer counts as its member count when its method is DNS round robin or floating virtual IP, or its HA is pair, cluster or cloud-managed; otherwise it counts as one.

**New,** in every profile (no `profiles`). Return node IDs and `data:<id>` or `management:<id>` edge keys, as the other rules do. With no load balancer of the right kind they pass with no evidence, as AR-006 does without Amazon S3. The mockup marks those as "Not applicable" only to explain the scene.

| ID | Title | Severity | Result |
|---|---|---|---|
| AR-009 | Load-balanced syslog keeps the sender's address | Critical | For syslog, method proxy. **Fail** with a UDP listener and any sender address but DNAT. **Fail** with SNAT. **Advisory** when Not set. **Pass** with DNAT, or the PROXY protocol without UDP. DNS and floating virtual IP pass |
| AR-010 | HEC acknowledgement through a load balancer is sticky | High | For HEC, when a client link's acknowledgement is HEC acknowledgement or Indexer acknowledgement. **Fail** with persistence None or Not set. **Pass** with Cookie or Source IP. DNS or floating virtual IP: **Advisory** |
| AR-011 | Deployment Servers behind one address form a cluster | High | For deployment with two or more members. **Fail** when either cluster check is No. **Advisory** while either is Not recorded. **Pass** when both are Yes |
| AR-012 | Deployment server cluster stays within Splunk's limits | Medium | For deployment with two or more members. **Fail** with more than 3 members. **Advisory** when the clients (by `instancesRepresented`) exceed 25,000 × members |
| AR-013 | A load balancer isn't a single point of failure | High | For method proxy with at least one client and one member. **Fail** with HA Single in Production (Advisory otherwise). **Advisory** with HA Not set |
| AR-014 | Load balancers check member health | Medium | **Advisory** with health check None or Not set, or with only one member |
| AR-015 | TLS that ends on a load balancer is re-encrypted | Medium | For method proxy with a TLS or HTTPS listener and TLS Terminate. **Fail** when a member's network zone differs from the load balancer's (`networkNodeZone`). **Advisory** otherwise |

**Finding text:**

| ID | Text |
|---|---|
| AR-009 | "`<LB>` listens on UDP 514 but replaces the sender's address (SNAT)." or "…but relies on the PROXY protocol." followed by "Every event's host becomes the load balancer: UDP needs DNAT." Without UDP: "`<LB>` replaces the sender's address (SNAT). Every event's host becomes the load balancer: use DNAT, or SNAT with the PROXY protocol." Not set: "Record how `<LB>` handles the sender's address." (plus " UDP needs DNAT." with UDP). A pass with the PROXY protocol keeps the evidence "Set SC4S_SOURCE_PROXYCONNECT=yes on `<members>`." |
| AR-010 | "`<clients>` uses HEC acknowledgement, so `<LB>` needs sticky sessions, with the longest cookie timeout. Otherwise acknowledgement checks reach another member and events are sent again." (use "use" for more than one client) |
| AR-011 | Fail: "`<LB>` pools `<n>` Deployment Servers without a cluster. Clients would get different apps from each one: run 9.2 or later on each, with deployment_apps and client_events on a shared drive." Advisory: "Confirm the deployment server cluster: `<missing items>`." |
| AR-012 | "`<n>` Deployment Servers: a cluster has at most 3." / "`<n>` clients is more than `<m>` × 25,000." |
| AR-013 | "`<LB>` is a single instance: if it fails, every client behind it stops. Use an active–standby pair, a cluster or a cloud-managed load balancer." / "Record `<LB>`'s high availability." |
| AR-014 | "`<LB>` has no health check recorded, so it can keep sending to a failed member." / "`<LB>` has one member: there's nothing to balance." |
| AR-015 | "`<LB>` ends TLS and sends to `<members>` unencrypted. Re-encrypt unless both sit in one trusted zone." / Fail: "…sends to `<member>` in `<zone>` unencrypted. Re-encrypt." |

## 9. Topology file

- **Save:** the `lb…` fields on `loadBalancer` nodes. Pool links and the load balancer's client relations are already in `relationships`.
- **Validate:** the base `validateTopologyDocument` throws for a relationship that doesn't start at a Deployment Server. Wrap it rather than editing it:
  1. take the load balancer relationships out of the raw document (`load_balancer_pool` from a Deployment Server to a load balancer, and `deployment_client` from a load balancer to a Universal or Heavy Forwarder);
  2. validate the rest as today;
  3. clean those relationships with the same field rules and add them back.
- **Clean on import:**
  - each `lb…` field to its allowed values, otherwise its default;
  - listeners to the Serves value's listeners, otherwise its default set;
  - the address by its pattern, otherwise `''`;
  - `lbServes` must fit the links. If it doesn't, derive it from the first link.
- **Links that break item 4:** a load balancer link with a wrong client or member type, a mixed pool, a managed member, or a load balancer behind another is dropped and listed in the import notice: "Dropped 1 load balancer link: `<from>` → `<to>` (`<reason>`)."
- **Older files:** no file before this build has the type, so they load unchanged.

## 10. In-place edits to earlier blocks

Change only what's listed.

| Block | Where | Change |
|---|---|---|
| `builder-rule-profiles` | AR-002's `sources` filter | Add `'loadBalancer'` to the excluded types |
| `builder-deployment-config-v109` | `syncDeploymentAssignments`: `a.deploymentServerId===relation.from` | `builderLbServerIds(relation.from).includes(a.deploymentServerId)` |
| `builder-threat-model-v150` | `if(item.plane==='management'&&from.type==='ds')` (the E threat) | `builderLbEffectiveType(from)==='ds'` and `item.edge?.relation?.type!=='load_balancer_pool'` |
| `builder-threat-review-v152` | `/syslog/i.test(to.type)` (the R threat) | `/syslog/i.test(builderLbEffectiveType(to))` |
| `builder-div1-v169` | the flow loop's `from` and `to` | `builderLbEffectiveType(nodes.get(…))` instead of `?.type` |
| `builder-cv2-v171` | `context171`: the type list `reaches` follows; `dsClients` and `dsManagement` | Add `'loadBalancer'` to the list. Use `builderLbEffectiveType(byId.get(id))==='ds'` in both |
| `builder-svcv6-v172` | `catalogue172`: `receivers`; `model172`: `is`, the `hfReceivers` filter, `add()` | `receivers` maps `e.to` through `builderLbResolve`. `is` uses `builderLbEffectiveType`. The `hfReceivers` filter resolves `e.to` the same way. In `add()`, after the carried edges, attach every other link of a load balancer on a carried edge (same plane) to the flow's interfaces only. Not its `edges`, so volumes aren't counted twice |
| `builder-svcv4-v173` | `context173`: `is` | Use `builderLbEffectiveType` |
| `builder-svcv3-v174` | `systems`; `is`; the S4 `uses` check | Leave load balancers out of `systems`. `is` uses `builderLbEffectiveType`. The S4 check resolves `e.to` through `builderLbResolve` |

**Why `add()` attaches the member links:** without it, SvcV-6 reports "2 interfaces carry no service flow: Syslog VIP → Syslog Server 1; Syslog VIP → Syslog Server 2".

**Why SvcV-3a leaves it out:** otherwise it's listed as an unconnected system, with "connect to a forwarder or remove from the topology".

## Not in scope

- **Users → search heads through a load balancer** (Splunk Web, sticky sessions). The access route keeps its "Load balancer" text value. A later handoff can add the authentication plane the same way.
- **Signing in to the load balancer** itself.
- **Firewalls, proxies and DNS servers** as components. The Network group leaves room for them.
- **Global server load balancing** across sites.
- **Splunk Cloud's own load balancers:** managed inputs are refused as members (item 4d).

---

## Check before uploading

### 1. The same results with and without a load balancer

Build each pair, then compare every view.

| Scenario | A: no load balancer | B: with one |
|---|---|---|
| **Syslog** | Default topology. Add Syslog Server 2 linked from Syslog Source 1, and link Syslog Server 2 → Universal Forwarder 1 | A, then select Syslog Server 1 and add a load balancer (it goes in front). Link it → Syslog Server 2 and remove Syslog Source 1 → Syslog Server 2. Set HA Active–standby pair, health check TCP and sender address DNAT |
| **HEC** | Default topology. Add AWS Lambda 1 → HEC Endpoint 1 and HEC Endpoint 2, each → Indexer 1 | The same with a load balancer in front of both HEC Endpoints, with HA pair and health check HTTP |
| **HEC on heavy forwarders** | Default topology. Add HEC Client 1 → Heavy Forwarder 1 and 2, each → Indexer 1 | The same with a load balancer in front, HA pair, health check HTTP |
| **Deployment** | `docs/mockups/ov1-reference-topology.json`: Deployment Server 1 manages Universal Forwarder 1, Universal Forwarder 2 and Heavy Forwarder 1 | A, then select Deployment Server 1 and add a load balancer: it goes in front and the three clients move to it. It takes Production and Sydney from Deployment Server 1. Set HA pair and health check HTTP |

**The same in A and B:**
- CV-1, and the CV-2 part statuses and counts;
- SvcV-4 function statuses;
- SvcV-6 and SvcV-2 flow statuses and their GB/day;
- the SvcV-3a and 3b summaries and systems;
- SvcV-1;
- the DIV-1 entities;
- the OV-2 operational nodes and their locations, apart from the load balancer in its pool's parts;
- AR-001 to AR-007.

**Expected differences, and nothing else:**
- **Resource flows:** one more, because the new hop is a separate link, so RF numbers after it shift by one. OV-2 has one flow per client to its pool's node instead of one per member, with the whole volume (syslog: 1,244 GB/day). The links to members are internal flows of that node.
- **Interfaces:** they name the load balancer. SF-01 is carried by "Syslog Source 1 → `<LB>`", "`<LB>` → Syslog Server 1" and "`<LB>` → Syslog Server 2", and stays "In place, gap".
- **SvcV-4 S3.1** lists Syslog Source 1 once, not once per server.
- **Threat model:**
  - the load balancer's zone has one more member;
  - the zone crossing is on the client → load balancer link, so its T, I and R threats replace those on each client → member link;
  - each load balancer → member link has a D threat.
- **Rules:** AR-008 lists the load balancer until it has a name, region and group. AR-009 to AR-015 pass.
- **Inventory and the network overlay:** one more row, and one more flow per link.
- **Deployment:**
  - SF-14 is carried by the load balancer's links;
  - the three E threats move to the load balancer → client links, and the pool link has none;
  - OV-2 keeps "Platform management" at Sydney.
- **Text that quotes the protocol** shows the listener label, for example "Syslog UDP 514 · TCP 514".

**Then add Deployment Server 2 to the Deployment pool:**
- S5 has two providers;
- AR-011 is Advisory until both cluster checks are Yes, then passes;
- AR-012 passes: "166 clients, within 50,000 (2 × 25,000)". The two Universal Forwarders represent 120 and 45 instances.

### 2. The feature, against the mockup

| Check | Expected |
|---|---|
| Palette | A Network group after Collection, with "Load balancer". "vip", "haproxy", "metallb" and "deployment server cluster" each find it |
| In front | Selecting Syslog Server 1 and clicking the item puts the load balancer between Syslog Source 1 and Syslog Server 1, serving syslog, in one Undo step. The same on a Deployment Server moves its clients to the load balancer |
| Refusals | Each attempt in item 4d is refused with its message, and nothing changes |
| Card | As in item 3. No child ends below the card at 100%, 77% or 60% |
| Inspector | Fields in item 5's order. Layer is fixed for syslog, Cookie and X-Forwarded-For only at layer 7, read-only lines for DNS and floating virtual IP, and the cluster box only for deployment |
| Rules | Each mockup scene with its starting settings gives the mockup's results: syslog AR-009 Fail (SNAT on UDP); HEC AR-010 Fail (no stickiness with acknowledgement on the Lambda link); deployment AR-011 Advisory and AR-013 Fail (single instance). Changing the setting in the mockup makes each one pass |
| Labels and details | Syslog Source 1 → load balancer reads "Syslog UDP 514 · TCP 514", endpoint the address, port 514, TLS Not applicable. HEC client links read "HEC HTTPS 8088", with HEC token authentication when the members are HEC Endpoints |
| Network overlay | Clients → the load balancer on the listener ports, and load balancer → members |
| File | Export and re-import keep every `lb…` field, the pool links and the client relations. A file with a mixed pool loads without that link and lists it in the import notice |
| Undo | Every action above is one step |

### 3. Regression

- **Without a load balancer, nothing changes:** the default and reference topologies give the same CV-1, CV-2, SvcV-1 to SvcV-6, DIV-1, OV-2, threat model, network overlay and inventory as Build 184. The only difference is AR-009 to AR-015 appearing as passed rules: seven more in every profile.
- **Errors:** 0 `pageerror` events, and all 13 view tabs render.

**Records:** a `changeRegister` entry ("Load balancer: one address in front of syslog receivers, HEC or Deployment Servers") and the build stamp.

## Sources

- **SC4S and load balancers:** not a best practice; UDP through DNAT only; SNAT with the PROXY protocol for TCP and TLS; TCP imbalance; MetalLB in BGP mode. [SC4S: about using load balancers](https://splunk-connect-for-syslog.readthedocs.io/en/main/lb/)
- **Deployment server cluster:** 9.2 or later on each server, the shared drive, up to 3 servers, 25,000 clients each. [Implement a deployment server cluster](https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/9.2/configure-the-deployment-system/implement-a-deployment-server-cluster)
- **HEC acknowledgement behind a load balancer:** sticky sessions with the longest cookie timeout; duplicates still possible. [Load balancing for Splunk Connect for Kafka](https://help.splunk.com/en/data-management/integrate-data-with-add-ons/splunk-connect-for-kafka/2.0/configure/load-balancing-configurations-for-splunk-connect-for-kafka)
- **Forwarders to indexers:** use the forwarder's own load balancing, not a load balancer. [Splunk Community](https://community.splunk.com/t5/Getting-Data-In/Hardware-load-balancer-between-indexer-and-forwarder-instead-of/m-p/87624)

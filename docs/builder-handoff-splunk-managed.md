# Builder handoff: make the Splunk Cloud components Splunk managed

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 175 (`builder-svcv12-v175`). Add one new block, `<script id="builder-splunk-managed-v176">`, with its own `<style>`. Use wrappers only. If the Build 175 review fixes ([`builder-handoff-build175.md`](builder-handoff-build175.md)) go into the same build, do them first.
**Mockup (the target):** [`docs/mockups/builder-splunk-managed-mockup.html`](mockups/builder-splunk-managed-mockup.html), screenshot `docs/mockups/compare/splunk-managed-components.png`. Select each card to see its inspector.
**Builds on:** [`builder-handoff-splunk-cloud-indexing.md`](builder-handoff-splunk-cloud-indexing.md), which made Splunk Cloud indexing the first Splunk-managed component.

## What "Splunk managed" means today

Only Splunk Cloud indexing is treated as managed: an `idx` node with `hosting:'splunkCloud'`, tested by `builderIsCloudIndexer148`. It gets:
- **a managed card:** cloud border and tint, the "☁ Splunk Cloud · indexing" tier label, a MANAGED badge, the stack address, facts and a footer (`builderCloudDecorate148`);
- **an inspector section** with the stack fields and a locked owner, "Splunk Cloud provider" (`builderCloudInspector148`);
- **ownership and zone:** the owner set in `state.responsibilityOwners`, and the network zone set to `'splunk'`;
- **connection defaults:** TLS locked to Required, S2S 9997 or HEC 443, endpoints from the stack name (`builderCloudDefaults148`);
- **no customer management links** (`managementCapability`), with review rules PR-CLOUD-10 to 16;
- **"Transferred to the Splunk Cloud provider" threats** in the threat model (v150, v152–v155);
- **hosting and location text:** "Splunk Cloud · `<stack>`" hosting in the inventory and pack, "Cloud · `<region>`" in OV-2 and "Splunk Cloud SLA" in OV-3.

The other Splunk Cloud services get none of this. Tested on Build 175 with the default topology plus a cloud indexer, Splunk Cloud Search, Splunk SOAR · Cloud, a playbook, Ingest Processor, an Amazon S3 Connection and an Edge Processor:

| Check | Build 175 |
|---|---|
| Inventory hosting | "Self-managed" for Splunk Cloud Search, Splunk SOAR · Cloud and Ingest Processor |
| Owner | Splunk Cloud Search "Splunk Cloud service team", SOAR · Cloud "Security operations team" (neither is in `responsibilityParties`), Ingest Processor "Splunk platform team" |
| Threat model | One "Splunk processing environment" zone holds the self-managed Indexer and every Splunk Cloud service, and it isn't marked provider managed. The zone takes its managed flag from whichever node is first, so in a hybrid design even the cloud indexer loses it |
| Cloud indexer card | The card is fixed at 224px but its content needs 304px, so the facts and footer spill out of it |
| Shared hosts | Any Splunk Cloud component can be put on one host with customer components (`builderCreateHost147`) |
| Sign-in | A user or identity provider can be linked to the cloud indexer; an identity provider can't be linked to SOAR · Cloud |
| Data links | Ingest Processor can send to a self-managed Indexer. Splunk Cloud indexing can't connect to Splunk Cloud Search, because v106 blocks it as a federated-search control type |
| Palette | Splunk Cloud indexing sits under "Indexer clustering"; the others are spread across Processing, S3 federated search and SOAR |

## Which components become Splunk managed

| Component | Type | Splunk manages | The customer manages | Address |
|---|---|---|---|---|
| Splunk Cloud indexing | `idx` + `hosting:'splunkCloud'` (exists) | Indexers, storage, replication, pipeline sets, capacity, upgrades, availability | Indexes and retention, the stack name, the IP allow list, the forwarder credentials app, the ingest licence | `<stack>.splunkcloud.com` |
| Splunk Cloud Search | `cloudSearchTier` | Search heads and clustering, scaling, upgrades, availability | Apps (through app vetting), roles and SAML sign-in, searches and dashboards, federated S3 connections | `<stack>.splunkcloud.com` |
| Ingest Processor | `ip` | The processing service, capacity, upgrades, availability | SPL2 pipelines, destinations (indexes, Amazon S3), source types and routing | `<stack>.splunkcloud.com` |
| Splunk SOAR · Cloud | `soarCloud` | The SOAR platform, scaling, upgrades, backups, availability | Playbooks, apps and assets, the Automation Broker host, SAML sign-in | `<tenant>.soar.splunkcloud.com` |

**Stays customer-managed (no MANAGED badge):**

| Component | Why | Change |
|---|---|---|
| Edge Processor | Its instances run on customer hosts; Splunk Cloud holds only its pipeline configuration | None |
| Amazon S3 Connection | Customer configuration in Splunk Cloud Data Management | Security zone `splunkCloud`; owner stays Splunk platform team |
| S3 Data Catalog | Splunk-native catalogs live in Splunk Cloud; AWS Glue and Iceberg REST catalogs live in the customer account | Zone `splunkCloud` when `s3CatalogKind==='Splunk-native'`, otherwise `storage` |
| SOAR Playbook | Customer automation running on its SOAR platform | Zone follows its platform (`soarInstanceId`); owner stays Security operations |
| Identity provider · Cloud | The customer's identity service, not a Splunk one | None |
| Amazon S3 Dataset | The customer's bucket | None |
| License Manager, Monitoring Console | Splunk Enterprise roles; Splunk Cloud includes its own licensing and monitoring | None |

---

## 1. One shared check

```js
const builderManagedTypes176=new Set(['cloudSearchTier','ip','soarCloud']);
// Splunk runs it: badge, owner, zone, threat transfer, no customer host or management.
function builderIsSplunkManaged176(node){return !!node&&(builderIsCloudIndexer148(node)||builderManagedTypes176.has(node.type))}
// Part of a Splunk Cloud Platform stack: has a stack name and region.
function builderIsStackComponent176(node){return builderIsCloudIndexer148(node)||['cloudSearchTier','ip'].includes(node?.type)}
// Receives forwarder and HEC data on the stack inputs.
function builderIsCloudReceiver176(node){return builderIsCloudIndexer148(node)||node?.type==='ip'}
```

Use the check that matches the question:
- **"Does Splunk run this?"** → `builderIsSplunkManaged176`: the card, owner, zone, threat model, hosts, management links, inventory, pack, OV-2 and Failure Lab.
- **"Does it receive data on the stack inputs?"** → `builderIsCloudReceiver176`: connection defaults, the TLS lock, PR-CLOUD-11, 14 and 15.
- **"Is it the indexing card?"** → keep `builderIsCloudIndexer148`: licence, experience, convert, PR-CLOUD-16.

## 2. Palette

- **New group:** "☁ Splunk Cloud · managed by Splunk", placed after Processing. Move these existing buttons into it, in this order, keeping their handlers:

  | Item | Icon | Subtitle |
  |---|---|---|
  | Splunk Cloud indexing | SC | Stack indexing · S2S and HEC receiving |
  | Splunk Cloud Search | CS | Stack search tier · federated S3 |
  | Ingest Processor | IP | SPL2 pipelines in your stack |
  | Splunk SOAR · Cloud | SOAR | Splunk-hosted SOAR tenant |

- **Tag:** each item shows a MANAGED tag; it replaces Splunk Cloud indexing's NEW tag.
- **Bookkeeping:** update `builderPaletteBaseItems` and `builderPaletteOriginalIndex` for the moved buttons and call `syncPaletteAccordion()`, so search, the accordion and the group counts stay right. The old groups then count Processing 2, Indexer clustering 2, S3 federated search 3, Splunk SOAR · response 2.
- **Search:** "managed", "splunk cloud", "scp", "stack" and "saas" match all four, plus each item's existing terms.
- **Component type text:**
  - Splunk Cloud Search: "Splunk Cloud search tier";
  - Ingest Processor: "Splunk Cloud processing service" (today "Edge processing tier");
  - Splunk SOAR · Cloud: "Splunk-hosted security orchestration platform".
- **Group note:** "Edge Processor stays under Processing: its instances run on your hosts."

## 3. Canvas card

All four use one layout. Splunk Cloud indexing changes too, because its card overflows today. Match the mockup:
- **Look:** a 1.5px cloud-colour border (`#89b7ec`), a cloud tint at the top, and the tier label in light cloud ink.
- **Contents:** inside the normal card box (190 × 224 at 100%), from the top:
  1. the tier label;
  2. the name;
  3. the MANAGED badge (tooltip "Managed by Splunk");
  4. the address in mono;
  5. up to three fact lines;
  6. the footer "Run and upgraded by Splunk", pinned to the bottom.
- **Hidden:** the customer parts, as v148 does for the indexing card: the Env and Region chips, the stage rows, and the pipeline-set and "NOT CONNECTED" bands (`.unifiedNodeMeta`, `.builderLanes`, `.builderStageMini`, `.builderBand`, `.builderNodeChips`, `.builderStageRow`, `.builderStageRows`).
- **Don't stack two decorations:** remove v148's spans (`.cloudManaged148`, `.cloudStack148`, `.cloudFacts148`, `.cloudFooter148`) before adding the shared ones. Keep v148's blocked-syslog line decoration as it is.

| Card | Tier label | Generated name | Address | Fact lines |
|---|---|---|---|---|
| Splunk Cloud indexing | ☁ Splunk Cloud · indexing | Splunk Cloud · `<stack>` | `<stack>.splunkcloud.com` | `<region> · <experience>`; `Licence <value> <unit>` or "Licence not set"; `S2S 9997 · HEC 443 · <n> in` |
| Splunk Cloud Search | ☁ Splunk Cloud · search | Splunk Cloud Search · `<stack>` | `<stack>.splunkcloud.com` | `<region> · SAML sign-in` (or "no sign-in link"); `Searches <indexing card name>`, or `Federated S3 · <n> connections` when nothing indexes into it |
| Ingest Processor | ☁ Splunk Cloud · processing | Ingest Processor · `<stack>` | `<stack>.splunkcloud.com` | `<region> · SPL2 pipelines`; `<n> sender(s) → <destinations>` |
| Splunk SOAR · Cloud | ☁ Splunk SOAR · cloud | SOAR Cloud · `<tenant>` | `<tenant>.soar.splunkcloud.com` | `<region> · <n> playbooks`; `Automation Broker: <value>` (review colour when "Not recorded" and n > 0) |

- **Region:** `<region>` is the short form ("AWS ap-southeast-2 (Sydney)" → "ap-southeast-2"), or "Region not set".
- **Names:** a generated name follows its stack or tenant; a name the user typed is kept, as `componentInstanceLabel` does for the indexing card (v151).
- **Missing stack or tenant:** the card shows "Stack not set" or "Tenant not set" in the review colour.
- **The card must fit:** no child of a managed card ends below the card's bottom edge at 100%, 77% or 60% zoom. Long addresses wrap (`overflow-wrap:anywhere`); text never spills out.
- **Accessible name:** "`<name>`, `<address or 'stack not set'>`, managed by Splunk". The badge isn't the only signal: the tier label and the inspector say it too.

## 4. Inspector

**Component identity box:**
- Keep Component name, Environment and Group container.
- Hide Region, Network zone, Subnet / CIDR and Host.
- Add the note "Host, network zone and subnet aren't shown: Splunk runs this service in its own environment."
- "Put on one host" is refused (item 6).

**Managed section:** one style for all four, headed "☁ `<component>` · managed by Splunk":

| Component | Fields |
|---|---|
| Splunk Cloud indexing | The v148 fields as they are: stack, region, experience, licence, owner, receiving endpoints, IP allow list, egress notes, convert |
| Splunk Cloud Search | **Splunk Cloud stack:** a picker of the stacks on indexing cards, plus "Another stack…" (a text field), with the address under it. **Cloud region:** read-only "From the stack" when the stack has an indexing card, otherwise a select (the v148 region list) |
| Ingest Processor | Stack and region as for Splunk Cloud Search. **Receiving endpoints** (derived, read-only): `inputs1.<stack>.splunkcloud.com:9997` (S2S · TLS · forwarder credentials app) and `http-inputs-<stack>.splunkcloud.com:443` (HEC · TLS · HEC token) |
| Splunk SOAR · Cloud | **SOAR tenant:** text, ≤ 63 characters of lower-case letters, digits and hyphens, with the address under it. **Cloud region:** select. **Automation Broker:** Not recorded / Installed in your network / Not needed, with the hint "Needed when playbooks act on assets inside your network". Keep the existing SOAR automation panel (playbooks) below |

**On all four:**
- **Owner:** read-only "Splunk Cloud provider", with "Set automatically for Splunk-managed components."
- **"Splunk manages" and "You manage" lists:** the text in "Which components become Splunk managed".

**The stack lives on the indexing card:**
- **Rename:** renaming the stack there renames it on every Splunk Cloud Search and Ingest Processor that had the old name and re-derives their endpoints, in one Undo step.
- **Region:** changing the region there updates the same components, in one Undo step.
- **Adding a stack component:**
  - with exactly one stack in the topology, a new Splunk Cloud Search or Ingest Processor starts on it, with its region;
  - with several stacks, it starts on the stack of the selected cloud indexer;
  - otherwise it shows "Stack not set".

## 5. Connections

**a. Into Ingest Processor.** It receives on the stack inputs, so links into it get the same defaults and limits as links into Splunk Cloud indexing (item 4 of the cloud-indexing handoff):

| Sender | Protocol, port | TLS | Authentication | Acknowledgement | Endpoint |
|---|---|---|---|---|---|
| UF, HF, DB Connect | Splunk-to-Splunk, 9997 | Required (locked) | Forwarder credentials (certificate); "Forwarder credentials app installed" field | Indexer acknowledgement | `inputs1.<stack>.splunkcloud.com:9997` |
| HEC client, HEC endpoint, AWS Lambda, Azure Function, API collector, API source | HEC (HTTPS), 443 | Required (locked) | HEC token | HEC acknowledgement | `http-inputs-<stack>.splunkcloud.com:443` |

- **Code:** reuse `builderCloudDefaults148`, `builderCloudEndpoint148` and the `cloudInitialized148` marker, with `builderIsCloudReceiver176` as the target check.
- **TLS:** extend the TLS lock in `renderSelectedBuilderEdgeInspector`, and the TLS validation error, to these links.
- **Syslog:** Syslog source and Syslog server → Ingest Processor stay invalid, as today.

**b. Out of Ingest Processor.** It writes only to its own stack's indexes and to Amazon S3.
- Refuse Ingest Processor → a **self-managed** Indexer with "Ingest Processor writes to its Splunk Cloud stack's indexes or to Amazon S3, not to self-managed Indexers." (It's valid today.)
- On import, keep such a link and report it with PR-CLOUD-18.
- Ingest Processor → Splunk Cloud indexing on a **different** stack is also a PR-CLOUD-18 error.

**c. Splunk Cloud indexing → Splunk Cloud Search.** This is the stack's own search tier, so allow it as a data link labelled "Splunk Cloud search". Today v106 blocks it as a federated-search control type. To allow only this pair:
- **`dataCapability`:** valid when the source is a cloud indexer and the target is `cloudSearchTier`. Every other link into or out of Splunk Cloud Search stays invalid.
- **`builderHandoff`:** "Splunk Cloud search".
- **`addBuilderNode`:** v106 forces `parent=null` for control types. Keep the parent when it's a cloud indexer (palette "add after" with the indexing card selected).
- **Import:** v106's `validateTopologyDocument` throws for a Splunk Cloud Search with a parent. Strip parents that are cloud indexers before calling the earlier validator, and restore them after.
- **`builderValidation`:** drop v106's "Splunk Cloud Search cannot receive an event-data link." for these links.
- **`unifiedNodeMarkup`:** give Splunk Cloud Search back its data input handle (v106 removes it).
- **Different stacks:** when both stacks are set and differ, it's a PR-CLOUD-18 error.

SvcV-2 and SvcV-6 then show this link as the edge carrying SF-07 (S7 → S9).

**d. A self-managed Search Head on Splunk Cloud indexing.** Keep it valid, because in Hybrid it can be a federated search head. Report it under the Splunk Cloud profile (PR-CLOUD-17).

## 6. What a managed component can't have

| Constraint | Behaviour | Message |
|---|---|---|
| A customer host | `builderCreateHost147` refuses a selection that includes a managed component. The inspector has no Host field. On import, a managed node's `hostId` is dropped and listed in the import notice | "Splunk-managed components run in Splunk's environment and can't share a customer host." |
| Customer management roles | `managementCapability` returns invalid for any managed node, with this reason. It's already invalid for everything except Deployment Server → UF, HF or Deployment Server | "Splunk manages `<component>`; customer management roles can't manage it." |
| Indexer Cluster membership | A cloud indexer's `indexClusterId` stays empty. Import clears it, and PR-CLOUD-12 reports it | "Splunk manages clustering for Splunk Cloud indexing." |
| Sign-in to the indexing card | `authenticationCapability` refuses a user or identity provider → cloud indexer. Existing links are kept and reported by PR-CLOUD-12 | "Users sign in to Splunk Cloud through Splunk Cloud Search; its indexers have no customer sign-in." |

Sign-in to the other three stays allowed. Add `soarCloud` and `soarOnPrem` to `authManageableTypes`, so users and identity providers can be linked to SOAR (SAML sign-in) as they can to Splunk Cloud Search.

## 7. Owner, security zone and threat model

**Owner:**
- `componentDefaultOwner` is "Splunk Cloud provider" for `cloudSearchTier`, `ip` and `soarCloud`.
- `state.responsibilityOwners[id]` is set to it on add, convert and load for every managed node, as v148 does for the indexing card. Every owner editor shows it locked.
- **Fix the party names:** `soarOnPrem` and `soarPlaybook` default to "Security operations", the listed party, instead of "Security operations team".

**Security zone:**
- Add `securityZones.splunkCloud={name:'Splunk Cloud (provider managed)',owner:'Splunk Cloud provider',color:'#89b7ec'}`.
- Set `componentSecurityZone` to `'splunkCloud'` for the three types.
- The indexing card's `networkZone` becomes `'splunkCloud'` on create, convert and load (it's `'splunk'` today).
- Configuration that lives in a managed service follows the "Stays customer-managed" table.

**Threat model:**
- **Zones:** replace `builderThreatZone150`. Managed nodes, and hosted configuration placed in `'splunkCloud'`, go to zone `zone:splunkCloud` with `managed:true`, so the frame reads "Provider managed". Every other node keeps today's rule, including the Cloud tenant group rule.
- **Node threats:** wrap `builderThreatModel150` once more. Every threat on a managed node becomes **Transferred**, owner "Splunk Cloud provider", unless the user has an override.
- **Flows between two managed components** (Ingest Processor → indexing, indexing → Splunk Cloud Search): D and I threats are Transferred.
- **Flows from a customer component into a managed one:** keep v155's rule, widened from "into a cloud indexer" to "into a managed component". The customer owns the transport, so the threat is Mitigated when buffered and acknowledged, otherwise Open, and the owner is cleared.
- **Hosted configuration** (playbooks, S3 connections, Splunk-native catalogs): it sits in the managed zone, but its threats stay customer-owned.
- **Stores:** keep v154's "Provider-managed index storage" for the indexing card.

## 8. Review rules

| ID | Change | Severity | Finding text |
|---|---|---|---|
| PR-CLOUD-12 | Retitle "Splunk-managed components stay with Splunk". Fails on a management link into a managed node, a managed node on a customer host, a cloud indexer in an Indexer Cluster, or a sign-in link to a cloud indexer | High | "`<role>` can't manage `<component>`; Splunk manages it." / "`<component>` shares a customer host with `<other>`." / "Users sign in to Splunk Cloud through Splunk Cloud Search, not `<indexing card>`." |
| PR-CLOUD-13 | Every stack component has a stack, and every SOAR · Cloud a tenant | Medium | "`<component>` has no Splunk Cloud stack, so its address and endpoints can't be derived." / "`<SOAR>` has no tenant name." |
| PR-CLOUD-11, 14, 15 | Also cover links into Ingest Processor. PR-CLOUD-15 reads the IP allow list and egress notes from the stack's indexing card; with no indexing card they count as not recorded | as today | as today, naming the Ingest Processor |
| PR-CLOUD-17 (new; Splunk Cloud profile) | A self-managed `search` or `shcMember` has a data link from a cloud indexer | Medium | "`<Search Head>` searches `<indexing card>` directly. In Splunk Cloud the search tier is managed by Splunk: use Splunk Cloud Search, or validate for Hybrid if this is a federated search head." |
| PR-CLOUD-18 (new; Splunk Cloud and Hybrid) | Links between stack components on different stacks, or Ingest Processor → a self-managed Indexer | High | "`<a>` and `<b>` are on different Splunk Cloud stacks (`<x>`, `<y>`)." / "Ingest Processor can't write to self-managed `<Indexer>`." |
| AR-008 | For a managed component, a set cloud region counts as its region, and no group container is needed | as today | as today |
| PR-HYB-01 | Passes when the design has a managed component **or** a Cloud tenant group with members; the evidence lists both | as today | as today |
| PR-HYB-02 | The cloud boundary is "in a Cloud tenant group **or** managed", so links into managed components are checked without a group | as today | as today |

Add PR-CLOUD-17 and 18 to v148's normaliser (the ID pattern at the end of `evaluateArchitectureRules`), so their nodes and edges come out as IDs.

## 9. Everywhere else

- **Inventory** (`builderInventoryRows`, the Hosting column and CSV): "Splunk Cloud · `<stack>`" for stack components, "Splunk SOAR Cloud · `<tenant>`" for SOAR · Cloud, "Self-managed" otherwise. The Stack column holds the address.
- **Architecture pack:**
  - The inventory pages' "Hosting / stack" column follows the inventory.
  - The deployment section's "Splunk Cloud indexing" list becomes **"Splunk-managed services"**: one line per managed component with its address, region, owner and what Splunk manages. The indexing card keeps its licence, endpoints and allow list on its line.
- **OV-2:** the location is "Cloud · `<region>`" for every managed node. A node whose parts are all managed is named "`<Tier>` service (Splunk Cloud)": Indexing, Search, Processing or Response.
- **OV-3:** Availability is "Splunk Cloud SLA" for flows into any managed component.
- **SvcV-1:** "Provided by" adds "· managed by Splunk" when every provider of the service is managed.
- **Failure Lab:** any fault on a managed target adds "Splunk-managed: raise with Splunk Support." Today only disk and availability faults on the indexing card do.

## 10. Topology file

- **Save:**
  - `cloudStack` and `cloudRegion` on Splunk Cloud Search and Ingest Processor;
  - `soarTenant`, `cloudRegion` and `soarAutomationBroker` on Splunk SOAR · Cloud.
- **Clean on import:**
  - stack: lower-case, `[a-z0-9.-]`, ≤ 100 characters;
  - tenant: lower-case, `[a-z0-9-]`, ≤ 63 characters;
  - region: ≤ 100 characters;
  - Automation Broker: one of the three values, otherwise "Not recorded".
- **Migrate on load:**
  - indexing cards with `networkZone:'splunk'` → `'splunkCloud'`;
  - managed nodes lose `hostId`, listed in the import notice;
  - managed nodes' owners are set to "Splunk Cloud provider".
- **Older files** load with empty stacks and tenants. Their cards show "Stack not set", and PR-CLOUD-13 reports them.

---

## Check before uploading

**Acceptance topology** (the mockup's), built from the default topology:
1. Convert Indexer 1 to Splunk Cloud indexing: stack `acme`, region "AWS ap-southeast-2 (Sydney)", licence 500 GB/day.
2. With it selected, add Splunk Cloud Search.
3. Add AWS Lambda 1, add Ingest Processor after it, and connect Ingest Processor to Splunk Cloud · acme.
4. Add Splunk SOAR · Cloud (tenant `acmesec`, same region) and one SOAR Playbook.
5. Validate for Splunk Cloud.

| Check | Expected |
|---|---|
| Palette | The "Splunk Cloud · managed by Splunk" group holds the four items with MANAGED tags. The old groups count as in item 2. Searching "managed" finds all four |
| Cards | Four managed cards named "Splunk Cloud · acme", "Splunk Cloud Search · acme", "Ingest Processor · acme" and "SOAR Cloud · acmesec". At 100%, 77% and 60%, no child of any card ends below its bottom edge |
| Owners | The four managed components: Splunk Cloud provider (locked). The playbook: Security operations |
| Inventory | Hosting "Splunk Cloud · acme" × 3, "Splunk SOAR Cloud · acmesec" × 1, "Self-managed" for the rest |
| Links | UF 1 → indexing: S2S, 9997, TLS Required (locked). Lambda → Ingest Processor: HEC (HTTPS), 443, HEC token, TLS Required (locked), endpoint `http-inputs-acme.splunkcloud.com:443`. Ingest Processor → indexing: Splunk index destination, Platform-managed. Indexing → Splunk Cloud Search: allowed, labelled "Splunk Cloud search" |
| Threat model zones | Source systems; Customer collection zone; Customer AWS account; **Splunk Cloud (provider managed)** with 5 members (the four services and the playbook), framed "Provider managed" |
| Threats | Every node threat on the four services: Transferred to the Splunk Cloud provider. D and I on Ingest Processor → indexing and indexing → Splunk Cloud Search: Transferred. Flows from your components into managed ones keep only the threats for controls that are missing: with the cloud defaults recorded, UF 1 → indexing has one Mitigated S threat and Lambda → Ingest Processor has none (corrected after the Build 176 recheck) |
| Rules | PR-CLOUD-12, 13, 17 and 18 pass. AR-008 doesn't list the four managed components |
| Refusals | Then add a User / Administrator and an Identity provider · Cloud. Selecting UF 1 and Ingest Processor, then "Put on one host", is refused. Linking either identity to Splunk Cloud · acme is refused; linking them to Splunk Cloud Search or SOAR · Cloud is allowed. Linking Ingest Processor to a new self-managed Indexer is refused |
| Variations | Replace Splunk Cloud Search with a Search Head after the indexing card: PR-CLOUD-17 warns under Splunk Cloud and is silent under Hybrid. Pick "Another stack…" `acme-dev` for Splunk Cloud Search: PR-CLOUD-18 fails |
| Stack rename | Renaming `acme` to `globex` on the indexing card renames Splunk Cloud Search and Ingest Processor and re-derives the Lambda endpoint, in one Undo step |
| File | Export and re-import keeps the stacks, tenant, Automation Broker and owners. A Build 175 file with a cloud indexer loads with zone `splunkCloud` |

**Regression:**
- **Errors:** 0 `pageerror` events.
- **Default topology:** unchanged, with no managed components and the same cards, rules and threats.
- **Other pages:** OV-1/2/3, TM-1, DIV-1, CV-1/2 and the SvcV pages are unchanged, apart from the managed hosting and location text.
- **Tools:** `tools/builder-connector-check.js`, `tools/builder-space-check.js` and `tools/builder-perf-check.js` pass, along with the button and grouping checks.

**Records:** a `changeRegister` entry ("Splunk-managed components: Splunk Cloud Search, Ingest Processor and Splunk SOAR · Cloud get the managed card, owner, zone and checks of Splunk Cloud indexing") and the build stamp.

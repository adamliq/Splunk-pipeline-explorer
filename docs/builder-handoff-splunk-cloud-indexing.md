# Builder handoff: Splunk Cloud indexing as a palette component

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** `main` at `e81ca6b` (Build 146). Use the next free block number (`builder-cloud-indexing-v148` if the shared-hosts work in `builder-handoff-shared-hosts.md` takes v147).
**Mockup:** `docs/mockups/builder-splunk-cloud-indexing-mockup.html` (open it and click the card, and the connections in the inspector tabs). Screenshot: `docs/mockups/compare/splunk-cloud-indexing.png`.

## Where things stand (Build 146)

- **There is no Splunk Cloud indexing component.** The "Splunk Cloud" and "Hybrid" architecture profiles (`builderRuleProfiles`) treat the ordinary **Indexer** (`idx`) as "the modelled Cloud indexing tier"; for example PR-CLOUD-01 and PR-CLOUD-02 check UF/HF → `idx` handoffs.
- The only Splunk Cloud card is **Splunk Cloud Search** (`cloudSearchTier`, colour `#89b7ec`), which exists for federated search of S3, not ingest.
- The Indexer type is used everywhere: **136** references to `'idx'` and **23** explicit `type==='idx'` checks. In `builderDataCapabilities` it's a valid target for almost every source (`windowsEvent`, `fileSource`, `syslogSource`, `hecClient`, `awsLambda`, `uf`, `hf`, `ip`, `edgeProcessor`, …).

## Approach: a hosting variant of the Indexer (not a new type)

Add a palette item **"Splunk Cloud indexing"** that creates an **`idx` node with `hosting:'splunkCloud'`** plus cloud fields.

Because it's still an Indexer, every existing connection rule, flow, pack page, OV page, Group-by mode and "Use in explorer" mapping keeps working. The differences are applied only where `hosting` matters, through one helper:
```js
function builderIsCloudIndexer148(node){return node?.type==='idx'&&node.hosting==='splunkCloud'}
```
A separate `cloudIdx` type was considered and rejected: it would need all 136 references reviewed, for the same result.

---

## 1. Palette

- In the **Indexing** group, after "Indexer Cluster": **"Splunk Cloud indexing"**, icon text `SC`, accent `#89b7ec` (the existing Splunk Cloud colour), marked **NEW** for one release.
- Tooltip: "Splunk-managed indexing in your Splunk Cloud Platform stack. Receives S2S over TLS on 9997 and HEC on 443."
- Palette search matches "cloud", "splunk cloud", "stack", "victoria", "classic" and "SCP".
- **Adding it creates** `{type:'idx', hosting:'splunkCloud', cloudStack:'', cloudRegion:'', cloudExperience:'Victoria', cloudLicence:{unit:'GB/day', value:null}, cloudAllowList:''}`, with the owner set to "Splunk Cloud provider" and the security zone set to `'splunk'`.
- If the architecture profile is **Splunk Enterprise**, adding one shows a one-line hint: "Switch 'Validate for' to Splunk Cloud or Hybrid to check cloud rules."

## 2. Canvas card

As in the mockup:
- A 1.5px solid border in the cloud colour, a light cloud-tint header band, a cloud icon, the tier label **"Splunk Cloud · indexing"**, and a **"MANAGED"** badge (tooltip "Managed by Splunk").
- **Body:**
  - the name (default "Splunk Cloud · <stack>", or "Splunk Cloud" while the stack is empty);
  - the stack FQDN in mono (`acme.splunkcloud.com`), or a "Stack not set" review chip;
  - chips: cloud region, experience, licence;
  - an inputs summary: "Forwarders · S2S 9997 · TLS", "HEC · 443 · token", "Receiving from · n connections".
- **Footer:** "Pipeline sets, storage and clustering are managed by Splunk."
- **Not shown:** the P1/P2 pipeline-set buttons, the "2 PIPELINE SETS" band, and the Env/Unspecified chips.
- The card is taller than an Indexer card (about 290px at 100%). Layout code must read the card's real height, not assume the Indexer's.

**Check:** the card has no pipeline-set controls; the badge, stack and inputs render; nothing overflows the card at 100% and 60% zoom.

## 3. Inspector (component)

Replace the Indexer's pipeline, storage and cluster sections with:

| Field | Values |
|---|---|
| Stack name | text; shows the derived FQDN `<stack>.splunkcloud.com` under it |
| Cloud region | AWS / GCP / Azure regions list (for example "AWS ap-southeast-2 (Sydney)") |
| Experience | Victoria, Classic |
| Ingest licence | number + unit (GB/day or SVC) |
| Owner | "Splunk Cloud provider", locked, with the note "Set automatically for Splunk-managed components" |
| Receiving endpoints | read-only, derived: `inputs1.<stack>.splunkcloud.com:9997` (S2S · TLS · forwarder credentials app) and `http-inputs-<stack>.splunkcloud.com:443` (HEC · TLS · HEC token) |
| IP allow list (customer egress) | text, optional, for example `203.0.113.0/28` |

Add the notice: "Pipeline sets, storage, replication and cluster settings aren't shown: Splunk manages them. Capacity is checked against the ingest licence."

The **Convert** action (item 8) also appears here on a normal Indexer.

## 4. Connections into it: defaults and limits

When a data connection's target is a cloud indexer, apply these defaults when it's created (and when an existing Indexer is converted):

| Source | Protocol / port | TLS | Authentication | Acknowledgement | Endpoint |
|---|---|---|---|---|---|
| UF, HF | Splunk-to-Splunk / 9997 | **Required (locked)** | Forwarder credentials (certificate) | Indexer ACK (recommended) | `inputs1.<stack>.splunkcloud.com:9997` |
| HEC client, AWS Lambda, Azure Function, API collector, HEC endpoint | HEC (HTTPS) / 443 | **Required (locked)** | HEC token | HEC ACK (optional) | `http-inputs-<stack>.splunkcloud.com:443` |
| Ingest Processor, Edge Processor | Splunk index destination | Required (locked) | Platform-managed | n/a | same stack |
| DB Connect (on a Heavy Forwarder) | via the HF's S2S | as UF/HF | as UF/HF | as UF/HF | as UF/HF |

- **TLS is locked:** the TLS dropdown offers only "Required" for these connections.
- **UF/HF sources get a new relationship field:** "Forwarder credentials app installed": Unknown / Yes / No.
- **The endpoint is filled from the stack name,** so `profileIsNamedEndpoint()` passes once the stack is set.
- **Direct syslog is blocked.** `syslogSource` → cloud indexer is **not** a valid data connection. When the user tries it (drag, palette "add after", or import):
  - keep the connection so the design stays visible;
  - draw it as a **red dashed line ending in ✕**, labelled "syslog → Splunk Cloud: not allowed";
  - make it count as an **error**;
  - offer "Insert Syslog Server between them" in its inspector.

  On import, existing files with this edge get the same treatment.
- **Management plane:** no Deployment Server, License Manager, Monitoring Console, cluster-manager or SHC-deployer relationship may **target** a cloud indexer. Refuse creating one, with the reason "Splunk manages the stack; customer management roles can't manage it", and flag such links on import.
- **Outgoing:** a cloud indexer → Splunk Cloud Search or Search Head is allowed, labelled "search".

**Check:**
- UF → cloud gets S2S / 9997 / TLS Required / forwarder credentials / ACK recommended and the derived endpoint;
- Lambda → cloud gets HEC / 443 / token;
- syslog → cloud is kept as a blocked red line with an error;
- DS → cloud is refused.

## 5. Review rules (`evaluateArchitectureRules`)

Add, under the **Splunk Cloud** and **Hybrid** profiles:

| ID | Severity | Rule | Finding text |
|---|---|---|---|
| PR-CLOUD-10 | Error | No syslog directly into Splunk Cloud | "Syslog can't go directly to Splunk Cloud. <source> → <cloud>. Send it through the syslog server (SC4S) and HEC, or through a forwarder." |
| PR-CLOUD-11 | Error | Every handoff into Splunk Cloud uses TLS | "<source> → <cloud> isn't encrypted; Splunk Cloud only accepts TLS." |
| PR-CLOUD-12 | Error | No customer management roles targeting Splunk Cloud | "<role> can't manage Splunk Cloud; Splunk manages the stack." |
| PR-CLOUD-13 | Warning | Stack name set | "Splunk Cloud stack name isn't set, so receiving endpoints can't be derived." |
| PR-CLOUD-14 | Warning | Forwarder credentials app recorded on each UF/HF sending to Splunk Cloud | "Forwarder credentials app not recorded on <forwarder>." |
| PR-CLOUD-15 | Warning | Outbound access recorded | "Outbound 9997/443 to <stack>.splunkcloud.com isn't recorded for <network zone>, and the stack's IP allow list should include that zone's egress addresses." (Pass when the cloud indexer's IP allow list is set and each sending zone has an egress note.) |
| PR-HYB-05 | Warning (Hybrid only) | Same source sending to an on-premises Indexer and a cloud indexer | "<source> sends to both <on-prem> and <cloud>. Confirm routing, so data isn't indexed or licensed twice." |

Also update the existing rules:
- **PR-CLOUD-01 and PR-CLOUD-02:** apply them to cloud indexers (they already match `idx`). Their text should name the stack when it's set.
- **Enterprise-only rules** (for example indexer pipeline sets, cluster replication and storage sizing) must **skip** cloud indexers.

**Check:** the mockup's topology produces exactly: 1 error (PR-CLOUD-10), 2 warnings (PR-CLOUD-14, PR-CLOUD-15), and PR-CLOUD-11/12 passing. No indexer-sizing finding appears for the cloud card.

## 6. Capacity and costs

- Indexer sizing (pipeline sets, IOPS, storage) **skips** cloud indexers.
- Instead: modelled daily ingest into the cloud indexer (the sum of its inbound flow volumes, from the OV-3 capacity split) against the licence.
  - **Warning at > 90%:** "Modelled ingest 470 GB/day is 94% of the 500 GB/day licence."
  - **Error at > 100%.**
  - With an SVC licence, show the ingest and "SVC sizing not modelled" (no percentage).

## 7. Everywhere else

- **Inventory (`builderInventoryRows`):** a **Hosting** column: "Self-managed" or "Splunk Cloud · <stack>".
- **Architecture pack:**
  - the component table shows hosting and stack;
  - the deployment section lists the stack, region, experience, licence, endpoints and IP allow list;
  - the responsibility table uses "Splunk Cloud provider" for detect/respond on the cloud indexer (the party already exists in `responsibilityParties`).
- **OV-1:** the Platform zone is titled **"Splunk Cloud Platform"** when all indexing is in the cloud, or "Splunk platform · hybrid" when mixed; the card shows the cloud icon.
- **OV-2:** the operational node is named "Indexing service (Splunk Cloud)", location "Cloud · <region>".
- **OV-3:** the Availability column says "Splunk Cloud SLA" instead of an SLO number.
- **Flow / "Use in explorer":** maps to the Indexer stages with the note "Managed by Splunk: stages shown for reference."
- **Failure Lab:** failures that need customer access to indexers (disk full, bucket repair) are marked "Splunk-managed: raise with Splunk Support".
- **Topology file:** save `hosting` and the cloud fields; files without them load as self-managed Indexers.

## 8. Converting an existing Indexer

- On a normal Indexer's inspector (and the card's right-click menu): **"Convert to Splunk Cloud indexing"**.
- It asks for the stack name, sets `hosting:'splunkCloud'`, and applies the connection defaults in item 4 to every inbound connection. Existing TLS-off connections become errors (PR-CLOUD-11) rather than being silently changed.
- It's one Undo step. "Convert back to self-managed Indexer" reverses it and keeps the cloud fields hidden, so a second convert restores them.
- **When the profile is Splunk Cloud and the topology has plain Indexers,** show a one-time banner: "This topology validates for Splunk Cloud but has self-managed Indexers. Convert them?"

**Check:** converting the default topology's Indexer keeps all three connections; UF → Indexer becomes S2S 9997 TLS-required; Undo restores the original exactly.

## 9. Accessibility

- The card's accessible name is "Splunk Cloud indexing, acme.splunkcloud.com, managed by Splunk".
- The blocked connection's accessible name ends in "not allowed".
- The MANAGED badge isn't the only signal: the tier label and the inspector say it too.

---

## Acceptance
1. Build the mockup's topology (Windows servers → UF → cloud; appliance syslog → SC4S → HEC → cloud; AWS Lambda → HEC → cloud; Firewalls → cloud (blocked); DS → UF; cloud → Splunk Cloud Search). Compare it with `docs/mockups/compare/splunk-cloud-indexing.png`.
2. Connection defaults, blocked syslog and refused management links behave as in item 4.
3. Review findings on that topology are exactly those in item 5.
4. Convert and Undo (item 8) work on the default topology; export → re-import keeps `hosting` and the cloud fields; older files load unchanged.
5. The usual checks: 0 `pageerror` events at all widths; the button, grouping and space checks; `tools/builder-connector-check.js` (add a scenario 11 "cloud indexer with blocked syslog": the blocked line keeps its ✕ and label clear of cards).
6. Add a `changeRegister` entry: "Splunk Cloud indexing: add Splunk Cloud Platform as the indexing destination, with cloud connection defaults and checks."

# Builder handoff: Splunk Cloud ES search head (ES Premier with UEBA)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** the build with the Build 177 fixes (`builder-managed-ov2-v178`, see [`builder-handoff-build177.md`](builder-handoff-build177.md)). If they aren't in yet, do them first, in the same build. Add one new block, `<script id="builder-cloud-es-v179">`, with its own `<style>`.
**Wrappers, plus a few in-place edits:** several earlier blocks keep their search-type lists and their "no Enterprise Security" text in closure constants that no wrapper can reach. Item 9 lists those edits. Make only those, and put everything else in the new block.
**Mockup (the target):** [`docs/mockups/builder-splunk-managed-mockup.html`](mockups/builder-splunk-managed-mockup.html). The ES search head card is selected when it opens. Screenshot: `docs/mockups/compare/cloud-es-search-head.png`.
**Builds on:** [`builder-handoff-splunk-managed.md`](builder-handoff-splunk-managed.md) (Build 176).

## Why

**What Splunk Cloud provides:** Splunk Cloud runs Enterprise Security on a **premium search head**. This is a second Splunk-managed search head on the stack, dedicated to ES, next to the stack's own search tier (Splunk Cloud Search). The ES licence edition decides what it includes:

| Edition | Includes |
|---|---|
| **ES Premier** (the default here) | Enterprise Security (detections, risk-based alerting, findings and investigations), **UEBA** (on by default), and **SOAR** (actions and playbooks run from ES once it's paired with Splunk SOAR) |
| ES Essentials | Enterprise Security only. UEBA is Premier-only; it can't be added to Essentials |

**What the Builder does today:**
- **No component:** the Builder has no ES component and never mentions UEBA.
- **Views hard-code its absence:**
  - CV-1 C5 and CV-2 C5.1 and C5.2: "Planned · No Enterprise Security component".
  - SvcV-6 and SvcV-2: S12 Correlation and risk has no provider. SF-09 and SF-10 are always Planned, and SF-11 is inferred from the search tier.
  - SvcV-4: S12.1 and S12.2 read "No Enterprise Security component provides correlation and risk".
  - SvcV-1: S12 "needs Splunk Enterprise Security".
- **No link to SOAR:** a search tier can't link to SOAR, because v101 refuses every data link to SOAR. Yet CV-2 C6.1, SvcV-6 SF-11 and DIV-1's Finding entity all look for one.

Sources are listed at the end.

---

## 1. The component

| Property | Value |
|---|---|
| Type | `cloudEsSearchHead` |
| `builderComponents` entry | name "Splunk Cloud ES search head"; type "Splunk Cloud premium search head"; colour `#89b7ec`; stages Correlation searches, Risk-based alerting, Findings and investigations, Behaviour analytics (UEBA). The managed card hides the stages |
| Splunk managed | Add it to `builderManagedTypes176`. Every `builderIsSplunkManaged176` check then covers it: owner, zone, threat transfer, host and management refusals, inventory, pack, OV-2, OV-3 and Failure Lab |
| Stack component | Yes. It has `cloudStack` and `cloudRegion`, and the region comes from the stack's indexing card (item 9 makes `builderIsStackComponent176` include it) |
| Tier | `search` (add it to `builderTierLookup130.search` and `builderTierByType130`) |
| Owner | "Splunk Cloud provider", locked: `componentDefaultOwner` and `state.responsibilityOwners` |
| Security zone | `componentSecurityZone`: `'splunkCloud'` |
| Sign-in | Add it to `authManageableTypes`, so users and identity providers can sign in (SAML) |
| Data capabilities | `builderDataCapabilities.cloudEsSearchHead=['soarCloud','soarOnPrem']`, and push `'cloudEsSearchHead'` onto `builderDataCapabilities.idx`. The additional-relation validator checks this table, so without it the SOAR link reports "is not a supported data handoff" |

**New fields:**

| Field | Values | Default |
|---|---|---|
| `esEdition` | `'Premier'`, `'Essentials'` | `'Premier'` |
| `esAddress` | host name; lower-case `[a-z0-9.-]`; ≤ 253 characters | `''` (use the default address) |
| `esAssetIdentity` | `'Not recorded'`, `'Configured'`, `'Not configured'` | `'Not recorded'` |

**Address and name:**
- **Address:** `esAddress` if set, otherwise `es-<stack>.splunkcloud.com`, or "Stack not set" with no stack. The `es-` name is the usual one, but it isn't documented, so the inspector asks the user to check it.
- **Generated name:** "ES search head · `<stack>`". A name the user typed is kept, as v176 does.

## 2. Palette

**The item:** in "☁ Splunk Cloud · managed by Splunk", right after Splunk Cloud Search:

| Icon | Name | Subtitle | Tag |
|---|---|---|---|
| ES | Splunk Cloud ES search head | Premium search head · ES Premier | MANAGED |

**Search:** "managed splunk cloud scp stack saas", plus "enterprise security es siem premier essentials ueba premium search head detection risk soar".

**Behaviour:**
- **New button:** create it like v106 creates its buttons (`draggable`, click and drag handlers), then register it with the group: `builderPaletteBaseItems`, `builderPaletteOriginalIndex` and `syncPaletteAccordion()`. The group count becomes 5.
- **Keep the order:** v176's `renderPaletteSearch` re-appends its four moved buttons after every empty search, which would push the new button to the top. After v176 has run, re-insert the ES button after Splunk Cloud Search.
- **Click:** with a Splunk Cloud indexing card selected, clicking the item adds the search head after that card (`addBuilderNode('cloudEsSearchHead', selectedId)`), so the search link exists from the start. Otherwise it's added unlinked. The stack follows v176's rule: the only stack, the selected indexing card's stack, or "Stack not set".

## 3. Canvas card

It uses the v176 managed card (190 × 224 at 100%), with the Build 177 tier label and the fit guard:

| Part | Content |
|---|---|
| Tier label | ☁ Splunk Cloud · security |
| Name | ES search head · acme |
| Badges | MANAGED, then on the same line an edition tag, **ES PREMIER** or **ES ESSENTIALS**: cloud-ink outline, no fill, tooltip "Enterprise Security licence edition" |
| Address | `es-acme.splunkcloud.com` |
| Fact 1 | `<region> · UEBA on` (Premier) or `<region> · no UEBA` (Essentials) |
| Fact 2 | `Searches <indexing card name>`, or "No search link" in the review colour |
| Fact 3 | "SOAR paired" or "SOAR not paired". "SOAR not paired" is in the review colour for Premier only |
| Footer | Run and upgraded by Splunk |

- **Accessible name:** "`<name>`, `<address>`, Enterprise Security `<edition>`, managed by Splunk".
- **Fit:** when space runs out, the fit guard hides fact lines from the last one up; the inspector still shows them all.

## 4. Links

### a. Splunk Cloud indexing → ES search head: "Splunk Cloud search"

- **Kind:** an ordinary data link. The search head's `parent` is the indexing card. It isn't a v106 control type, so none of v176's Splunk Cloud Search workarounds are needed.
- **`dataCapability`:** valid only from a Splunk Cloud indexing card. Anything else into it is refused with "The ES search head searches its Splunk Cloud stack's indexes. Link it from Splunk Cloud indexing."
- **`builderHandoff`:** "Splunk Cloud search".
- **Defaults:** the first time the link is seen (the `cloudInitialized148` marker), set the same values v176 uses for Splunk Cloud Search: protocol "Splunk Cloud search", port 443, TLS Required, authentication Platform-managed.
- **Different stacks:** an error under PR-CLOUD-18, which already covers every stack component.

### b. ES search head → Splunk SOAR: "ES findings to SOAR"

This is the ES–SOAR pairing. ES sends findings to SOAR and runs SOAR actions and playbooks.

- **Targets:** valid to `soarCloud` and `soarOnPrem` (ES 8.2.3 and later can pair cloud ES with on-premises SOAR). Anything else out of the search head is refused with "The ES search head sends findings only to Splunk SOAR." That includes SOAR Playbook.
- **Storage:** always an additional data relation in `state.builderDataRelations`, **never** the SOAR node's `parent`. v101 keeps SOAR outside the event-data path, and import throws for a SOAR node with a parent.
  - Wrap `beginBuilderConnection`, `moveBuilderNode` and `completeConnectionTemplate`, so that this pair always goes through `createAdditionalDataRelation`, however it's drawn.
- **Handle:** v101 strips data handles from SOAR cards. When the topology has an ES search head, give SOAR platform cards (not playbooks) their data input handle back.
- **`builderHandoff`:** "ES findings to SOAR".
- **Defaults:**

  | Field | Value |
  |---|---|
  | Protocol | HTTPS (REST) |
  | Port | 443 |
  | TLS | Required |
  | Authentication | ES–SOAR pairing |
  | Acknowledgement | HTTP 200 |
  | Endpoint | `<tenant>.soar.splunkcloud.com:443` for SOAR · Cloud; "Not set" for on-premises |

- **New relationship field, `esSoarAllowLists`:** Unknown / Yes / No, labelled "Allow lists updated". Hint: "The SOAR address is on the stack's search head API allow list (ES port 8089). For SOAR · Cloud, the ES address is also on the SOAR allow list."

### c. Everything else

- **Sign-in** from users and identity providers is allowed.
- **Refused** by v176, unchanged: customer management roles and a customer host.

**What the link gives you, checked on Build 177:** a search → SOAR data relation is already picked up by every view. Its trace includes the relation, and the SOAR node keeps `parent: null`. CV-2 C6.1 reads In topology, SvcV-6 SF-11 lists the real interface, OV-2 gains a flow, and the threat model transfers its D threat when both ends are managed.

## 5. Inspector

v176's stack-component branch applies: the stack picker with "Another stack…", the stack address and the read-only region "From the stack". Add these after the region:

1. **ES search head address:** a text field for `esAddress`, showing the current address.
   - Hint: "Default `es-<stack>.splunkcloud.com`. Check it against your Splunk Cloud provisioning details."
   - A value equal to the default is stored as `''`, so a stack rename still re-derives it.
2. **Enterprise Security edition:** a select (Premier, Essentials). Under it, the list of what's included:

   | Item | Premier | Essentials |
   |---|---|---|
   | Enterprise Security | ✓ detections, risk-based alerting, findings and investigations | ✓ same |
   | UEBA | ✓ on by default; baselines users and entities | – Premier only |
   | SOAR | ✓ actions and playbooks from ES, once paired with a SOAR tenant | – not included in Essentials |

   The marks aren't the only signal: each item also carries "(included)" or "(not included)" for screen readers.
3. **Asset and identity data for UEBA:** Premier only. A select of Not recorded, Configured and Not configured, with the hint "UEBA needs the asset and identity framework with at least one identity source."
4. **SOAR pairing:** read-only. The linked SOAR platforms, or "Not paired. Draw a link from this search head to Splunk SOAR."
5. **Owner and lists:** owner "Splunk Cloud provider" (locked), then the two lists:
   - **Splunk manages:** Premium search head and capacity; ES and UEBA upgrades; Availability (Splunk Cloud SLA).
   - **You manage:** Detections and risk rules; Asset and identity data; Analyst roles and SAML sign-in; SOAR pairing and allow lists.

**Undo:** each change is one Undo step, "Update Splunk Cloud ES search head".

**Subtitle:** v177's rule gives "Splunk Cloud premium search head · Production · AWS ap-southeast-2 (Sydney)".

## 6. Review rules

**New rules,** profiles `['cloud','hybrid']`. Return node IDs, and `data:<id>` edge keys, as PR-CLOUD-17 and 18 do.

| ID | Title | Severity | Advisory when | Finding text |
|---|---|---|---|---|
| PR-CLOUD-19 | ES search head has data | Medium | An ES search head has no search link from Splunk Cloud indexing | "`<ES>` has no search link from Splunk Cloud indexing, so Enterprise Security has no data to search." |
| PR-CLOUD-20 | ES Premier is paired with SOAR | Medium | A Premier ES search head has no link to a SOAR platform, or a link whose `esSoarAllowLists` isn't Yes | "`<ES>` is ES Premier, which includes SOAR, but isn't paired with Splunk SOAR." / "`<ES>` → `<SOAR>`: record that the allow lists are updated." |
| PR-CLOUD-21 | UEBA has asset and identity data | Medium | A Premier ES search head's `esAssetIdentity` isn't Configured | "UEBA on `<ES>` needs the asset and identity framework with at least one identity source." |

**Existing rules that now cover it,** with no change: PR-CLOUD-12 (managed), PR-CLOUD-13 (stack recorded), PR-CLOUD-18 (stack mismatch), AR-008, PR-HYB-01 and PR-HYB-02.

## 7. Views

| View | With an ES search head |
|---|---|
| **CV-1** | C5 Threat detection lists "Splunk Cloud ES search head" as its component (`builderCapabilities170.C5.types=['cloudEsSearchHead']`). Its status already follows its parts (v171) |
| **CV-2** | See "CV-2 parts" below |
| **SvcV-6, SvcV-2** | See "Service flows" below |
| **SvcV-4** | See "SvcV-4 functions" below |
| **SvcV-3a, 3b** | It provides S9, S10 and S12, and uses S7, S14 and, when paired, S13. It doesn't also "use" S12. SF-11's note becomes "`<ES>` isn't paired with Splunk SOAR; the interface is inferred" |
| **SvcV-1** | S12 is provided by "ES search head · acme · managed by Splunk". The "needs" text becomes "Splunk Cloud ES search head". Its default interface is "On the ES search head". The S12 → P2 "detection tuning" dependency is In place when S12 is deployed. The Response finding drops "SF-09, SF-10 and SF-11 need Enterprise Security" once S12 is deployed |
| **DIV-1** | Its search-tier lists include the type. So Correlation Search, Finding, Data Model and Lookup are present, and the ES → SOAR link carries Finding |
| **OV-2** | It's part of "Search and detection (Splunk Cloud)", with Splunk Cloud Search, in the "SPLUNK CLOUD · `<REGION>`" frame from the Build 177 fix. It adds no new node. The SOAR link adds a needline to "Response and cases (Splunk Cloud)" |
| **OV-3** | Availability is "Splunk Cloud SLA" for flows into it and into SOAR · Cloud |
| **Threat model** | It's a member of the "Splunk Cloud (provider managed)" zone, and its node threats are Transferred. D and I threats on indexing → ES search head and ES search head → SOAR · Cloud are Transferred |
| **Inventory, pack** | Hosting is "Splunk Cloud · `<stack>`", and the Stack column holds its address. The pack's "Splunk-managed services" line adds "edition ES Premier (Enterprise Security, UEBA, SOAR)" |

**CV-2 parts:**
- **C5.1 Correlation detections:**
  - In topology when an ES search head has a search link: "Enterprise Security on `<ES>`".
  - Partial when one has no search link: "`<ES>` has no search link".
  - Otherwise unchanged: "No Enterprise Security component".
- **C5.2 Risk-based alerting:** the same rule. Both editions include it.
- **C5.3 Behaviour analytics (UEBA), new:**
  - **Row:** "Baseline users and entities, and raise unusual behaviour as risk." Measure "Identities with a behaviour baseline"; example 0% → 90%; increment 3; source "UEBA diagnostics dashboard".
  - **In topology** when a Premier ES search head has a search link and `esAssetIdentity` Configured.
  - **Partial** when it's Premier but either is missing.
  - **Planned** when it's Essentials ("`<ES>` is ES Essentials; UEBA needs Premier"), or when there's no ES search head.
- **C6.1:** counts the ES → SOAR link.
- **C4.1, C4.2, C7 and C8.3:** count it as a search tier. **C4.3** (high availability) doesn't.

**Service flows:**
- **S9, S10 and S12:** it provides all three, so S12 is deployed.
- **SF-07:** also carries indexing → ES search head.
- **SF-09 and SF-10:** In place, internal ("Inside one system"), with the search links into the ES search head as attribute edges.
- **SF-11:**
  - Carried by the ES → SOAR links.
  - In place when every ES search head has one.
  - Otherwise Planned, with an inferred interface from each unpaired ES search head to each SOAR platform. Playbooks are excluded.
- **No ES search head:** all three keep today's behaviour.

**SvcV-4 functions:**
- **S12.1 Correlate events and S12.2 Raise risk findings:** Realised when an ES search head has a search link, otherwise Partly realised.
- **S12.3 Detect anomalies (UEBA), new:**
  - Activity A6. SF-09 feeds it as well as S12.1.
  - Realised with Premier, a search link and asset and identity data Configured.
  - Partly realised when it's Premier but either is missing.
  - Not realised with Essentials.
- **S9.3, S10.2 and S13.1:** Realised through the existing rules.
- **No ES search head:** S12.1 to S12.3 keep today's text.

## 8. Topology file

- **Save:**
  - on the search head: `cloudStack`, `cloudRegion`, `esEdition`, `esAddress`, `esAssetIdentity`;
  - on the ES → SOAR relationship: `esSoarAllowLists`.
- **Clean on import:**
  - edition: one of the two values, otherwise Premier;
  - address: as in item 1, otherwise `''`;
  - asset and identity: one of the three values, otherwise Not recorded;
  - allow lists: one of the three values, otherwise Unknown.
- **Managed rules on import:** v176's apply. A `hostId` is dropped and listed in the import notice, and the owner is set to Splunk Cloud provider.
- **Relations:** an ES → SOAR data relation imports as valid. A SOAR node with a `parent` is still refused (v101).
- **Older files:** no file before this build has the type, so they load unchanged.

## 9. In-place edits to earlier blocks

These constants sit inside closures. Change only what's listed.

| Block | Where | Change |
|---|---|---|
| `builder-div1-v169` | `model169`: `search=has('search shcCluster shcMember cloudSearchTier')`, and the three search-type lists in the edge-to-entity rules | Add `cloudEsSearchHead` |
| `builder-cv2-v171` | `searchTypes`; `componentTypes.C5`; the C5 rows in `CAPS`; `rules` | Add the type to `searchTypes`. Set `componentTypes.C5` to `['cloudEsSearchHead']`. Add the C5.3 row. Replace the C5.1 and C5.2 rules, and add C5.3, as in item 7 |
| `builder-svcv6-v172` | `searchTypes`; S12 in `serviceDefs`; SF-09, SF-10 and SF-11 in `model172` | Add the type to `searchTypes`. Set S12's types to `['cloudEsSearchHead']`. Change the flows as in item 7 |
| `builder-svcv4-v173` | `searchTypes`; `FN`; the SF-09 function flow; the S12 branch of `status173` | Add the type to `searchTypes`. Add the S12.3 row. Make the SF-09 flow go to `['S12.1','S12.3']`. Give the S12 branch the item 7 rules. Make the mechanism texts neutral (below) |
| `builder-svcv3-v174` | `searchTypes`; the search branch of the uses step; SF-11 in `reason()` | As in item 7 |
| `builder-svcv12-v175` | `needed.S12`; `defaults.S12`; the S12 → P2 dependency; the Response finding | As in item 7 |
| `builder-splunk-managed-v176` | `stackComponent`; `address`; `responsibilities`; `componentInstanceLabel`; the stack-component list in `addBuilderNode`; `cards()` | Include the type in `stackComponent` and the `addBuilderNode` list. Return its address. Add its two lists. Name it "ES search head". Give `cards()` its own branch, before the SOAR `else`, which a new managed type otherwise falls into |

**Neutral SvcV-4 mechanism texts:** today's texts state that ES is absent. The live reason already explains a gap, so replace them:

| ID | Text |
|---|---|
| S9.3 | Runs scheduled searches, including the correlation searches that feed S12. |
| S10.2 | tstats over the summaries for correlation searches. |
| S12.1 | Enterprise Security correlation searches (detections) on the ES search head. |
| S12.2 | Risk-based alerting turns risk events into findings, which go to SOAR. |
| S12.3 | UEBA in ES Premier baselines users and entities and raises unusual behaviour as risk. |
| S13.1 | SOAR containers from ES findings, through the ES–SOAR pairing. |

**Leave alone:**
- **v170 (CV-1):** the new block sets `builderCapabilities170.C5.types`.
- **v177:** its OV-2 wrappers and subtitle already work for the type.

## Not in scope

- **Standalone Splunk UBA:** end of sale December 2025, end of support January 2027. Don't add it; UEBA in ES Premier replaces it.
- **Other premium search heads:** ITSI, and ES on a search head cluster.
- **Enterprise profile:** no rule flags a Splunk Cloud ES search head under the Enterprise profile. That matches Splunk Cloud Search and SOAR · Cloud today.

---

## Check before uploading

**Acceptance topology:**
1. Start from the acceptance topology in the managed handoff: Splunk Cloud · acme, Splunk Cloud Search, AWS Lambda 1 → Ingest Processor, and SOAR Cloud · acmesec with one playbook.
2. Select Splunk Cloud · acme, then add Splunk Cloud ES search head from the palette.
3. Link ES search head · acme → SOAR Cloud · acmesec.
4. Add an Identity provider · Cloud and link it to the ES search head.
5. Validate for Splunk Cloud.

| Check | Expected |
|---|---|
| Palette | 5 items in the managed group, with ES after Splunk Cloud Search. The order holds after a search and clearing it. "ueba", "enterprise security" and "premier" each find it |
| Card | "ES search head · acme", MANAGED and ES PREMIER, `es-acme.splunkcloud.com`, then "ap-southeast-2 · UEBA on", "Searches Splunk Cloud · acme" and "SOAR paired". No child ends below the card at 100%, 77% or 60% |
| Inspector | Subtitle as in item 5. Stack picker on `acme`, region read-only, edition Premier with three ✓, asset and identity Not recorded, owner locked |
| Links | Indexing → ES search head: Splunk Cloud search, 443, TLS Required, Platform-managed. ES search head → SOAR: in `state.builderDataRelations`, with SOAR's `parent` still `null`; HTTPS (REST), 443, TLS Required, endpoint `acmesec.soar.splunkcloud.com:443`, allow lists Unknown. No validation errors |
| Refusals | UF 1 → ES search head; a new self-managed Indexer → ES search head; ES search head → Splunk Cloud Search; ES search head → SOAR Playbook; Deployment Server managing it; "Put on one host" with UF 1. Each refusal shows its message |
| Rules | PR-CLOUD-12, 13, 18 and 19 pass. PR-CLOUD-20 is advisory until the allow lists are Yes, and PR-CLOUD-21 until asset and identity is Configured; then both pass. With Essentials, both pass and the card shows "no UEBA" |
| Threat model | The "Splunk Cloud (provider managed)" zone has 6 members. As in item 7 |
| CV-1, CV-2 | C5.1 and C5.2 In topology. C5.3 Partial, then In topology once asset and identity is Configured. C5 Partial, then In topology. C6.1 In topology |
| SvcV-6, SvcV-2 | S12 deployed, provided by ES search head · acme. SF-09 and SF-10 In place, inside one system. SF-11 In place, carried by "ES search head · acme → SOAR Cloud · acmesec" |
| SvcV-4 | S9.3, S10.2, S12.1, S12.2 and S13.1 Realised. S12.3 Partly realised, then Realised once Configured. With Essentials, S12.3 is Not realised |
| SvcV-1, DIV-1, OV-2 | As in item 7 |
| Inventory | Hosting "Splunk Cloud · acme" × 4 and "Splunk SOAR Cloud · acmesec" × 1 |
| Stack rename | Renaming `acme` to `globex` renames the ES search head and re-derives `es-globex.splunkcloud.com` (a typed address is kept), in one Undo step |
| File | Export and re-import keeps the edition, address, asset and identity, the ES → SOAR relation and its allow-list field |

**Regression,** on the default and reference topologies (`docs/mockups/ov1-reference-topology.json`, neither has an ES search head). These counts are from Build 177 plus the new rows:

| View | Default topology | Reference topology |
|---|---|---|
| CV-2 (in topology / partial / planned) | 3 / 1 / 18 → 3 / 1 / **19** (C5.3 Planned) | 12 / 7 / 3 → 12 / 7 / **4** |
| SvcV-4 (realised / partly / planned / not realised) | 35 functions: 6 / 1 / 28 / 0 → 36: 6 / 1 / **29** / 0 | 35: 16 / 7 / 5 / 7 → 36: 16 / 7 / 5 / **8** |
| Everything else | Unchanged | Unchanged: SvcV-6's 17 flows and their statuses, the SvcV-1 counts, OV-2, the threat model and the rule results |

**Errors:** 0 `pageerror` events.

**Records:** a `changeRegister` entry ("Splunk Cloud ES search head: managed premium search head with ES Premier, UEBA and SOAR pairing") and the build stamp.

## Sources

- **Premium search head:** a Splunk Cloud search head dedicated to one premium product, such as ES. [Splexicon](https://docs.splunk.com/Splexicon:Premiumsearchhead)
- **Editions:** Premier adds SOAR and UEBA to Essentials. [ES editions overview](https://help.splunk.com/en/splunk-enterprise-security-8/enterprise-security-editions); [cloud capability matrix](https://help.splunk.com/en/splunk-enterprise-security-8/release-notes-and-resources/8.7/splunk-enterprise-security-release-notes/splunk-enterprise-security-editions-cloud-capability-matrix)
- **UEBA:** on with Premier, and needs asset and identity data. [UEBA overview](https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.7/user-and-entity-behavior-analytics); [asset and identity data for UEBA](https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.5/user-and-entity-behavior-analytics/configure-asset-and-identity-data-for-ueba-in-splunk-enterprise-security)
- **ES–SOAR pairing:** port 8089, allow lists, and cloud ES with on-premises SOAR from 8.2.3. [Pair ES with SOAR](https://help.splunk.com/en/splunk-enterprise-security-8/administer/8.7/configuration-and-settings/pair-splunk-enterprise-security-with-splunk-soar); [SOAR Cloud side](https://help.splunk.com/en/splunk-soar/soar-cloud/administer-soar-cloud/introduction-to-splunk-soar-cloud/pair-splunk-soar-cloud-with-splunk-enterprise-security)
- **Standalone UBA:** [end of sale and end of life](https://help.splunk.com/en/security-offerings/splunk-user-behavior-analytics/release-notes/5.4.5/additional-resources)
- **`es-<stack>` address:** community-reported, not documented. [Splunk Community](https://community.splunk.com/t5/Splunk-Enterprise/Can-anyone-explain-what-are-the-below-searchhead-in-perspective/m-p/610635)

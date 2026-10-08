# Builder handoff: Build 179 recheck (ES search head and the Build 177 fixes)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 179 (`builder-managed-ov2-v178`, `builder-cloud-es-v179`). Add one block, `builder-es-review-v180`, with wrappers only, plus the one-line in-place change in fix 2.
**Tested with:** at 1600px, on:
- the acceptance topology in [`builder-handoff-cloud-es-search-head.md`](builder-handoff-cloud-es-search-head.md);
- the managed acceptance topology with one playbook;
- the default topology;
- `docs/mockups/ov1-reference-topology.json`.

## What passes

**Clean run:** 0 `pageerror` events, and all 13 view tabs render.

**Regression:** the default and reference topologies match Build 177 except for the two new rows. Flows, zones, threats, rule results, OV-2 and CV-1 are unchanged.

| View | Default topology | Reference topology |
|---|---|---|
| CV-2 (in topology / partial / planned) | 3 / 1 / 19 | 12 / 7 / 4 |
| SvcV-4, 36 functions (realised / partly / planned / not realised) | 6 / 1 / 29 / 0 | 16 / 7 / 5 / 8 |

**ES search head, against its acceptance table:**
- **Palette:** 5 items, with ES after Splunk Cloud Search. The order holds after a search. "ueba", "enterprise security" and "premier" each find it. Clicking it with the indexing card selected adds it after that card.
- **Card:** "ES search head · acme", MANAGED and ES PREMIER, `es-acme.splunkcloud.com`, and the three facts. It fits at 100%, 77% and 60%. With a 19-character stack name, the fit guard hides fact lines.
- **Inspector:**
  - The subtitle reads "Splunk Cloud premium search head · Production · AWS ap-southeast-2 (Sydney)".
  - The stack picker, the read-only region, the address, the edition with its list of what's included, asset and identity (Premier only), the SOAR pairing, the owner and the two lists are all there.
  - Host, zone and subnet are hidden.
- **Links:**
  - Indexing → ES search head: Splunk Cloud search, 443, TLS Required, Platform-managed.
  - ES search head → SOAR: in `state.builderDataRelations`, with SOAR's `parent` still `null`; HTTPS (REST), 443, TLS Required, ES–SOAR pairing, HTTP 200, `acmesec.soar.splunkcloud.com:443`, allow lists Unknown. The SOAR card gets its data handle back.
  - No validation errors.
- **Refusals:** each one is refused with its exact message: UF 1, a self-managed Indexer, the ES search head → Splunk Cloud Search or a playbook, Deployment Server management, and a shared host. Identity provider sign-in is allowed.
- **Rules:** PR-CLOUD-12, 13, 18 and 19 pass. PR-CLOUD-20 and 21 are advisory, then pass once the allow lists are Yes and asset and identity is Configured. Both pass with Essentials.
- **Threat model:** the provider-managed zone has 6 members, and indexing → ES search head has a D threat Transferred to the Splunk Cloud provider.
- **CV-1 and CV-2:** C5.1 and C5.2 are In topology. C5.3 is Partial, then In topology once asset and identity is Configured; with Essentials it's Planned. C5 follows its parts, and C6.1 is In topology.
- **SvcV-6 and SvcV-2:** S12 is provided by ES search head · acme. SF-07 carries both search links. SF-09 and SF-10 are In place, inside one system. SF-11 is In place over the real link.
- **SvcV-4:** S9.3, S10.2, S12.1, S12.2 and S13.1 are Realised. S12.3 is Partly realised, then Realised; with Essentials it's Not realised.
- **Other views:**
  - **SvcV-1:** S12 shows "ES search head · acme · managed by Splunk".
  - **SvcV-3a:** the ES search head provides 3 services and uses 3.
  - **DIV-1:** the link carries Finding.
  - **OV-2:** "Search and detection (Splunk Cloud)" is realised by both search heads.
- **Inventory:** "Splunk Cloud · acme" × 4.
- **Stack rename:** renaming the stack renames the search head and its address in one Undo step, and a typed address is kept.
- **File:** export and re-import keep every field and the relation.

**Build 177 fix 1:** OV-2 now draws every node once, and needlines attach to that box. Empty frames are dropped.

## Fixes

### 1. Two needlines and two flows for one search → SOAR exchange, P2

**What happens:** OV-2 adds implied operational flows (`builderOvInferred138`), including "notable events for playbooks" from the search node to the cases node. The model skips an implied flow only when a real line exists **on the same plane**. The ES → SOAR link is on the data plane and the implied flow is on the response plane, so both are kept. On the acceptance topology:

| View | What shows |
|---|---|
| OV-2 | N4 (data) and N8 (response) both join ON-4 and ON-5. They overlap, and N8's label is hidden. Screenshot: `docs/mockups/compare/build179-ov2-needlines.png` |
| OV-3 | RF-05 "ES findings to SOAR" (real) and RF-06 "notable events for playbooks" (inferred). Drawing the link also renumbers the implied flow from RF-05 to RF-06 |
| OV-1 | Both a data link and a response link between the ES search head and SOAR shapes |
| DIV-1 | Finding is "carried by" both RFs |

**Rule:** an implied flow stands in for a missing real one. Skip it when any real flow already joins the same two OV-2 nodes, on any plane. Apply the same rule to the OV-1 links built from the implied flows.

**Check (ES acceptance topology):**
- OV-2 has one needline from ON-4 to ON-5 (data).
- OV-3 has one flow for the pair.
- DIV-1's Finding lists only the link's RF.
- OV-1 has one link between those shapes.
- Without the ES → SOAR link, the implied response needline is still drawn.
- The default and reference topologies are unchanged.

### 2. C4.3 counts the ES search head as high availability, P2

`builder-cv2-v171` now lists the type in the C4.3 check (`c.has(['shcCluster','cloudSearchTier','cloudEsSearchHead'])`). The handoff said C4.3 doesn't count it. With Splunk Cloud indexing and an ES search head only, C4.3 reads "In topology · Highly available search tier modelled".

**Rule:**
- Remove the type from that list (in place).
- An ES search head on its own is a single search head, so C4.3 is Partial: "Single search head; no high availability". The Partial branch checks `['search','cloudEsSearchHead']`.

**Check:**
- Indexing and an ES search head only: C4.3 is Partial.
- With Splunk Cloud Search added: In topology, as today.

### 3. Managed cards still spill at 60% (Build 177 fix 2), P2

v179 added a fit guard to the ES card only. At 60% the Ingest Processor card's last fact line still ends 9px below the card, as in Build 177.

**Rule:** run v179's guard on every managed card (`.managedCard176`): hide fact lines from the last one up until nothing ends below the card. The inspector still shows every fact.

**Check:** no child of any managed card ends below the card's edge at 100%, 77% or 60%, with stack names up to 20 characters.

### 4. The playbook still splits off in OV-2 (the rest of Build 177 fix 1), P2

**What happens:** a SOAR Playbook on SOAR · Cloud isn't managed, so OV-2 places it in Security operations as a separate node. The managed acceptance topology shows "ON-5 Response and cases (Splunk Cloud)", realised by Splunk SOAR · Cloud, inside the Splunk Cloud frame. It also shows "ON-8 Response and cases", realised by the playbook, alone in the SECURITY OPERATIONS frame. That's one operational node drawn as two.

**Rule:** a **managed part** is either a managed node or a SOAR Playbook whose platform (`soarInstanceId`) is managed. Use that test in three places:
- **Place (`builderOvPlace138`):** a playbook takes its platform's place, so it joins the platform's group.
- **Name (v177's role wrapper):** add the "(Splunk Cloud)" suffix when every part is a managed part.
- **Frame (v178's rename):** rename the frame to "SPLUNK CLOUD · …" when every card in it holds only managed parts.

**Check (managed acceptance topology with one playbook):**
- One node, "Response and cases (Splunk Cloud)", realised by Splunk SOAR · Cloud and SOAR Playbook, inside the Splunk Cloud frame.
- No SECURITY OPERATIONS frame. It appears only when users or identity providers are added.
- A playbook on SOAR · On-premises stays in Security operations.

### 5. Two rule findings highlight an unrelated link, P3

PR-CLOUD-19 and PR-CLOUD-21 list the ES → SOAR link in their edges. Selecting the UEBA finding highlights the SOAR link, which has nothing to do with it.

**Rule:** only PR-CLOUD-20 lists the link.

**Check:** PR-CLOUD-21 advisory: nodes `[<ES id>]`, edges `[]`.

### 6. White fields in the managed inspector section, P3

The inputs in the managed section use the browser's default white fields: the read-only region, the owner and now the ES search head address. This dates from Build 176. The fields above them in "Component identity" are dark.

**Rule:** style the managed section's inputs and selects like the identity fields: same background, text colour, border and radius. Read-only fields keep a muted look.

## Accepted as built

- **Frame placement:** the Splunk Cloud frame is the renamed "CLOUD · `<region>`" site frame in the left column, not a new frame at the top of the platform column. It reads clearly and keeps every node once, so keep it.
- **Node order:** OV-2 node numbers follow the model order, not the frame order.
- **C5.3 wording:** with no ES search head, C5.3's Planned reason reads "No ES Premier search head".

## Still open from Build 175

The fixes in [`builder-handoff-build175.md`](builder-handoff-build175.md) are still not in. On the reference topology:
- SF-01 shows "322 → 55" GB/day;
- all 17 flows are flagged as needing attention (expected 9);
- 38 commitment attributes are "Not set" (43 once fix 1 makes the defaulted targets "Not set").

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
   - The default and reference topologies still give the counts above.
2. **Fixes 1–6:** the checks in each item.
3. **Records:** a `changeRegister` entry ("ES search head review: one exchange per search-to-SOAR pair, C4.3, card fit, playbook grouping") and the build stamp.

# Builder handoff: Build 176 recheck (Splunk-managed components)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 176 (`builder-splunk-managed-v176`). Add one block, `builder-managed-review-v177`, with wrappers only.
**Tested with:** the acceptance topology in [`builder-handoff-splunk-managed.md`](builder-handoff-splunk-managed.md) and the default topology, at 1440px and 1600px.

## What passes

- **Clean run:** 0 `pageerror` events. The default topology gives exactly Build 175's zones, threats (8) and rule results.
- **Palette:** the "☁ Splunk Cloud · managed by Splunk" group holds the four items with MANAGED tags. The old groups count Processing 2, Indexer clustering 2, S3 federated search 3 and Splunk SOAR · response 2. Searching "managed" finds all four.
- **Cards:** the four managed cards fit their box, with no child ending below the card. Names, addresses, MANAGED badges and accessible names are as specified.
- **Owners:** Splunk Cloud provider on the four managed components; Security operations on the playbook.
- **Inventory:** "Splunk Cloud · acme" × 3 and "Splunk SOAR Cloud · acmesec" × 1.
- **Links:**
  - UF 1 → indexing: S2S, 9997, TLS Required, forwarder credentials.
  - Lambda → Ingest Processor: HEC (HTTPS), 443, HEC token, `http-inputs-acme.splunkcloud.com:443`.
  - Ingest Processor → indexing: Splunk index destination.
  - Indexing → Splunk Cloud Search: allowed, labelled "Splunk Cloud search".
- **Refusals:**
  - The shared host is refused with the exact message.
  - Sign-in to the cloud indexer is refused for users and identity providers; sign-in to Splunk Cloud Search and SOAR is allowed.
  - Ingest Processor → a self-managed Indexer and Deployment Server management of managed nodes are both refused.
- **Threat model:**
  - The "Splunk Cloud (provider managed)" zone has 5 members.
  - Node threats on managed components, and D threats on managed-to-managed flows, are Transferred to the Splunk Cloud provider.
- **Rules:** PR-CLOUD-12, 13, 17 and 18 pass. PR-CLOUD-17 warns for a Search Head on Splunk Cloud indexing under Splunk Cloud. PR-CLOUD-18 fails for an `acme-dev` stack. AR-008 no longer lists managed components.
- **Stack rename and file:**
  - Renaming the stack to `globex` renames all three stack components and the Lambda endpoint, and one Undo restores them.
  - Export and re-import keeps every field.
  - A file whose cloud indexer has zone `splunk` and a `hostId` on Ingest Processor loads as `splunkCloud` with no host.
- **Other pages:** OV-3 shows "Splunk Cloud SLA". SvcV-1 shows "· managed by Splunk". The pack has the "Splunk-managed services" section. Failure Lab adds "Splunk-managed: raise with Splunk Support." for managed targets only.

## Fixes

### 1. OV-2 names and locations ignore the managed wrappers, P2

Build 176 wraps `builderOv2Location133` and `builderOv2Name133`. Since Build 138, though, OV-2 places and names its nodes with `builderOvPlace138` (tier, location, role) and `builderOvRole138` (name, activity), which don't call those functions for most tiers. Splunk Cloud indexing has had the same problem since v148. On the acceptance topology OV-2 shows:

| Node | Build 176 | Expected |
|---|---|---|
| Ingest Processor | Processing service (Splunk Cloud) · **Unspecified** | Processing service (Splunk Cloud) · Cloud · AWS ap-southeast-2 (Sydney) |
| Splunk Cloud · acme | **Indexing service** · **Multisite** | Indexing service (Splunk Cloud) · Cloud · AWS ap-southeast-2 (Sydney) |
| Splunk Cloud Search · acme | **Search and detection** · **Multisite** | Search and detection (Splunk Cloud) · Cloud · AWS ap-southeast-2 (Sydney) |
| SOAR Cloud · acmesec | **Response and cases** · **Security operations** | Response and cases (Splunk Cloud) · Cloud · AWS ap-southeast-2 (Sydney) |

**Rule:**
- **Wrap `builderOvPlace138`:** for a managed node, keep the tier and role and return location "Cloud · `<region>`" (or "Cloud · region not set"). Managed and self-managed parts of one tier then become separate OV-2 nodes, as their locations differ.
- **Wrap `builderOvRole138`:** when every part of the group is managed, append " (Splunk Cloud)" to the role name. Keep the activity text.

**Check:**
- The OV-2 node list for the acceptance topology matches the table.
- With a self-managed Indexer added, OV-2 shows two indexing nodes: "Indexing service · Multisite" and "Indexing service (Splunk Cloud) · Cloud · …".
- OV-3 and the SvcV pages, which reuse the OV-2 IDs, still render without errors.

### 2. Tier labels are cut off on managed cards, P2

The tier label keeps the card's single-line ellipsis, so the role word disappears: "☁ SPLUNK CLOUD · INDE…", "… · SEA…", "… · PRO…". The label text needs 186, 175 and 205px in a 168px space; only "☁ Splunk SOAR · cloud" fits.

**Rule:** on managed cards, let the tier label wrap to at most two lines (`white-space:normal`, no ellipsis) and keep its full text. The card has room. Keep the fit rule: no child ends below the card's bottom edge at 100%, 77% and 60%.

**Check:** the four full labels are visible: indexing, search, processing, cloud. Each card still fits.

### 3. "1 playbooks", P3

The SOAR card says "ap-southeast-2 · 1 playbooks". Use the singular for one, here and in any other count on managed cards ("1 sender", "2 senders").

### 4. Inspector subtitle shows the hidden region, P3

The inspector subtitle under a managed component's name still ends in "· Unspecified", the customer region field the inspector now hides. For example: "Splunk Cloud search tier · Production · Unspecified". Splunk Cloud indexing does the same.

**Rule:** for managed components, the subtitle is "`<component type>` · `<environment>` · `<cloud region>`", or "Region not set".

## Correction to the Splunk-managed handoff

The acceptance table expected D and I threats on UF 1 → indexing and Lambda → Ingest Processor. The threat model seeds a crossing threat only for a control that is missing. With the Splunk Cloud defaults recorded (TLS Required, a credential and acknowledgement), the model gives:
- UF 1 → indexing: one **Mitigated** S threat;
- Lambda → Ingest Processor: **no** threats.

Build 176 is right; the handoff has been corrected. Build 175 behaves the same for a Lambda sending straight to Splunk Cloud indexing.

## Still open from Build 175

The fixes in [`builder-handoff-build175.md`](builder-handoff-build175.md) aren't in Build 176 yet. For example, SF-01 still shows "1244 → 55" GB/day: today comes from the topology but the target from the example default. Do them in the same build as these fixes, or first.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
   - The default topology still matches Build 175.
2. **Fixes 1–4:** the checks in each item.
3. **Records:** a `changeRegister` entry ("Managed components review: OV-2 cloud placement and names, full tier labels, wording") and the build stamp.

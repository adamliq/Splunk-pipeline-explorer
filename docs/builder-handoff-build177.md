# Builder handoff: Build 177 recheck (managed components review)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 177 (`builder-managed-review-v177`). Add one block, `builder-managed-ov2-v178`, with wrappers only.
**Tested with:** the acceptance topology in [`builder-handoff-splunk-managed.md`](builder-handoff-splunk-managed.md), plus a playbook on SOAR · Cloud, and the default topology, at 1440px and 1600px.

## What passes

- **Clean run:** 0 `pageerror` events. The default topology gives exactly Build 176's zones, threats, rule results and OV-2 nodes.
- **Tier labels:** wrap to two lines with no ellipsis, don't overlap the name, and every managed card fits at 100% and 77%.
- **Wording:**
  - The SOAR card says "1 playbook", and keeps it after zoom and selection changes.
  - Inspector subtitles read "`<type>` · Production · AWS ap-southeast-2 (Sydney)" for all four managed components.
- **OV-2 model:**
  - Managed nodes are named "Indexing service (Splunk Cloud)", "Search and detection (Splunk Cloud)", "Response and cases (Splunk Cloud)" and "Processing service (Splunk Cloud)", located "Cloud · AWS ap-southeast-2 (Sydney)".
  - Adding a self-managed Indexer gives a separate "Indexing service · Multisite" node.
- **Everything from the Build 176 recheck** still passes.

## Fixes

### 1. OV-2 draws the managed nodes twice, P1

The OV-2 drawing (`builder-ov2-visual-v138`) places nodes in two ways:
- **Site frames** on the left, by **location:** every location except "Multisite" and "Security operations" becomes a site.
- **The "Splunk platform" and "Security operations" frames,** by **role:** `indexing`, `search` and `management` go to the platform frame; `soc`, `identity` and `cases` go to security operations.

Build 177 gives managed nodes the location "Cloud · `<region>`" but keeps their roles, so they qualify for both. On the acceptance topology the diagram shows a "CLOUD · AWS AP-SOUTHEAST-2 (SYDNEY)" site holding ON-3, ON-4, ON-5 and ON-6. ON-3 and ON-4 appear again under "SPLUNK PLATFORM" and ON-5 under "SECURITY OPERATIONS", and the needlines attach to whichever copy was drawn last. The pack's OV-2 page uses the same drawing.

The playbook is also split off. A SOAR Playbook on SOAR · Cloud isn't managed, so it becomes its own node, "ON-8 Response and cases · Security operations", separate from its platform.

**Rule:**
- **Mark managed groups:** a group is managed when every part is managed, or is a SOAR Playbook whose platform is managed. Place a playbook with its platform.
- **Site frames:** leave managed groups out.
- **New "SPLUNK CLOUD · `<REGION>`" frame:** draw it at the top of the platform column, above the self-managed "SPLUNK PLATFORM" frame, which appears only when it has nodes. It holds the managed processing, indexing and search groups, in that order. Its border uses the cloud colour, dashed like the threat model's provider-managed zone.
- **SOAR · Cloud:** the managed `cases` group stays in "SECURITY OPERATIONS" with its "(Splunk Cloud)" name, and its playbooks belong to it.
- **One copy per node:** every node is drawn once, and needlines attach to that one box.
- **Numbering:** sites first; then the Splunk Cloud frame in its order; then the self-managed platform; then security operations.

**Expected on the acceptance topology** (with one playbook on SOAR · Cloud):

| Frame | Nodes |
|---|---|
| UNSPECIFIED · SITE 1 | ON-1 Unspecified event sources; ON-2 Site collection |
| CLOUD · UNSPECIFIED | ON-3 Cloud event sources (AWS Lambda 1) |
| SPLUNK CLOUD · AWS AP-SOUTHEAST-2 (SYDNEY) | ON-4 Processing service (Splunk Cloud); ON-5 Indexing service (Splunk Cloud); ON-6 Search and detection (Splunk Cloud) |
| SECURITY OPERATIONS | ON-7 Response and cases (Splunk Cloud), realised by Splunk SOAR · Cloud and SOAR Playbook |

**Check:**
- Every OV-2 node ID appears in exactly one box in the SVG.
- No frame is empty, and no "Cloud · AWS…" site frame appears.
- With a self-managed Indexer added, "SPLUNK PLATFORM · MULTISITE" appears below the Splunk Cloud frame, holding "Indexing service".
- OV-3 and the SvcV pages, which use the OV-2 IDs, follow the new numbering and render without errors.

### 2. A fact line spills out of the Ingest Processor card at 60% zoom, P2

The Builder enlarges card text at low zoom. With the two-line tier label and a two-line name, the Ingest Processor card's last fact line ("1 sender → Splunk Cloud · acme") ends 9px below the card at 60%, under the footer. Build 176 fit at every zoom; the two-line tier label pushed the content down.

**Rule:** add a fit guard to managed cards. After rendering, if any child ends below the card's bottom edge, hide fact lines from the last one up until the card fits. The inspector still shows every fact. Keep the full, wrapped tier label.

**Check:** no child of any managed card ends below the card's edge at 100%, 77% or 60%, with stack names up to 20 characters.

## Still open from Build 175

The fixes in [`builder-handoff-build175.md`](builder-handoff-build175.md) are still not in. SF-01 still shows "1244 → 55" GB/day.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
   - The default topology still matches Build 176.
2. **Fixes 1 and 2:** the checks in each item.
3. **Records:** a `changeRegister` entry ("OV-2 Splunk Cloud frame and card fit guard") and the build stamp.

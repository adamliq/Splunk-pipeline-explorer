# Builder handoff: Build 180 recheck (ES search head review)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 180 (`builder-es-review-v180`). Add one block, `builder-es-findings-v181`, with wrappers only.
**Tested with:** at 1600px, on:
- the ES acceptance topology in [`builder-handoff-cloud-es-search-head.md`](builder-handoff-cloud-es-search-head.md);
- the managed acceptance topology with one playbook;
- the default topology;
- `docs/mockups/ov1-reference-topology.json`.

## What passes

**Clean run:** 0 `pageerror` events, and all 13 view tabs render.

**Regression:** the default and reference topologies match Build 179. One text changes, as fix 2 of the last recheck asked: the reference topology's C4.3 reason now reads "Single search head; no high availability".

**Fixes from [`builder-handoff-build179.md`](builder-handoff-build179.md):**

| Fix | Result |
|---|---|
| 1. One exchange per search → SOAR pair | Passes. See below |
| 2. C4.3 | Passes. Indexing and an ES search head only: "Partial · Single search head; no high availability". With Splunk Cloud Search: In topology |
| 3. Card fit on every managed card | Passes with the `acme` stack at 100%, 77% and 60%; the guard hides fact lines as needed. Fails at 60% with longer stack names: fix 2 below |
| 4. Playbook grouping | Passes. See below |
| 5. Rule edges | Passes. PR-CLOUD-21 lists the ES search head with no edges; PR-CLOUD-20 still lists the link |
| 6. Inspector fields | Passes. The managed section's fields match the identity fields (background, text, border, radius and size), and read-only fields are muted |

**Fix 1 in detail:**
- With the link, OV-2 has one data needline from ON-4 to ON-5, and OV-3 has one flow for the pair.
- OV-1 has one link between the ES search head and SOAR shapes.
- DIV-1's Finding lists only the link's RF.
- Without the link, the implied response needline is still drawn.

**Fix 4 in detail:**
- OV-2 shows one node, "Response and cases (Splunk Cloud)", realised by Splunk SOAR · Cloud and Splunk SOAR Playbook, inside the Splunk Cloud frame.
- There's no SECURITY OPERATIONS frame until an identity provider is added.
- A playbook on SOAR · On-premises stays with its platform in Security operations.

**ES acceptance:** everything from the Build 179 recheck still passes.

## Fixes

### 1. OV-3 and SvcV-6 treat the findings link as forwarded event data, P1

**What happens:** before the ES → SOAR link exists, OV-3 describes this exchange through the implied flow. Fix 1 of the last recheck correctly drops that flow once the real link exists. The real link then takes its OV-3 values from the event-data rules: the upstream ingest volume flows down through the search head and into SOAR.

**Measured on the ES acceptance topology:**

| OV-3 column | Implied flow (no link) | Real link (Build 180) | Expected |
|---|---|---|---|
| Resource exchanged | Notable events for playbooks | Forwarded events · Cloud · AWS ap-southeast-2 (Sydney) (derived) | **Findings for playbooks** |
| Producer activity | Contain and respond | Correlate, alert, serve searches (derived) | Correlate, alert, serve searches |
| Consumer activity | Contain and respond | Collect and forward (derived) | **Contain and respond** |
| Plane | Alerts and response | Event data | **Alerts and response** |
| Periodicity | Near real time | On demand | **Near real time** |
| Timeliness | Not set | ≤ 60 s | ≤ 60 s |
| Volume | Not set | **≈ 622 GB/day** | **Not set** |
| Transport and authentication | inferred | HTTPS (REST) 443 · TLS · ES–SOAR pairing | as built |

On a smaller topology the volume is the whole ingest, "≈ 1244 GB/day". SvcV-6 shows the same problem: SF-11 has GB/day today 622, from the topology, against a target of 0.6.

**Rule:**
- **Volume stops at the search tier:** a data link out of a search head carries findings, not the indexed event stream. Derive no GB/day for it. OV-3 shows "Not set", and SvcV-6 SF-11's GB/day today is "Not set" unless the user edits it.
- **Operational wording:** in OV-1, OV-2 and OV-3, show the ES → SOAR link with the wording the implied flow had:
  - resource "Findings for playbooks";
  - consumer activity "Contain and respond";
  - periodicity "Near real time";
  - the response plane, "Alerts and response".
- **Response plane in all operational views:** OV-2 draws the needline in the response colour, and OV-1 draws the link on the response plane.
- **What stays as it is:** the Builder canvas, the threat model and the services views keep the link on the event-data plane. The link's transport, authentication and timeliness come from the link, as now.

**Check (ES acceptance topology):**
- The OV-3 row for the ES search head → SOAR · Cloud reads as the Expected column.
- OV-2 shows one needline from ON-4 to ON-5 on the response plane, and OV-1 one link on the response plane.
- SvcV-6 SF-11 has GB/day today "Not set" (not edited).
- DIV-1's Finding still lists only the link's RF.
- Without the link, the implied flow is unchanged.

### 2. Managed cards spill at 60% with longer stack names, P2

**What happens:** at 60% the Builder enlarges card text, and the name's two-line limit from Build 176 is switched off (`max-height:none`). With a stack name such as `acme-production`, the Ingest Processor card ends like this:
- the name wraps to three lines and the address to two;
- every fact line is hidden;
- the footer still ends 5px below the card (2px with `globex-prod-0001`).

Screenshot: `docs/mockups/compare/build180-ip-card-60.png`.

**Rule:** after the fit guard has hidden every fact line, if a card still overflows:
1. clamp the name to two lines with an ellipsis, at every zoom;
2. if that's not enough, clamp the address to one line with an ellipsis.

The tooltip and accessible name keep the full name, and the inspector shows the full address.

**Check:** no child of any managed card ends below the card's edge at 100%, 77% or 60%, with stack and tenant names up to 20 characters. Test `acme`, `acme-production` and `globex-production01x` on all five managed card types.

## Still open from Build 175

The fixes in [`builder-handoff-build175.md`](builder-handoff-build175.md) are still not in. On the reference topology:
- SF-01 shows "322 → 55" GB/day;
- all 17 flows are flagged as needing attention (expected 9);
- 38 commitment attributes are "Not set" (43 once fix 1 makes the defaulted targets "Not set").

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
   - The default and reference topologies unchanged: neither has an ES → SOAR link.
2. **Fixes 1 and 2:** the checks in each item.
3. **Records:** a `changeRegister` entry ("ES findings link: operational wording and no event volume; card clamp at low zoom") and the build stamp.

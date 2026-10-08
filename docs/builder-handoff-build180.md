# Builder handoff: Build 180 recheck (ES search head review and the services fixes)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 180 (`builder-es-review-v180`). Add one block, `builder-review-v181`, with wrappers only.
**Scope:** fixes 1 and 2 come from this recheck. Fixes 3–8 are the Build 175 services fixes, which are still not in. They're carried here and re-measured on Build 180, so all of them go into one build.
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

---

## Services fixes carried from Build 175

These are the fixes in [`builder-handoff-build175.md`](builder-handoff-build175.md). Builds 176–180 haven't touched them. Every value below was measured on Build 180 with the reference topology (`docs/mockups/ov1-reference-topology.json`) at 1280px, unless a fix says otherwise.

### 3. Volume: today and target come from different sources (SvcV-6, SvcV-2), P1

**What happens:** GB/day today comes from the topology's capacity figures, but GB/day target falls back to the mockup's example value. The target ends up far below today:

| Flow | Today → target |
|---|---|
| SF-01 | 322 → 55 |
| SF-02 | 322 → 55 |
| SF-03 | 230 → 34 |

The SvcV-2 "Volume lost" finding reads "Entering 322.00 → 77.00 GB/day; reaching Indexing 230.00 → 34.00 GB/day."

**Rule:**
- **Target:** when today is a GB/day figure computed from the topology (0 included) and the target hasn't been edited, show the target as "Not set". When today is "Not set" or an example value, the example target stays, marked "(default)". On the reference topology, this changes the target of SF-01 to SF-05 only.
- **Formatting:** format GB/day the same way in tables and findings: whole numbers from 10 up with no decimals, and values under 10 with one decimal. Never "322.00".

**Check:**
- SF-01 shows "322 → Not set" until a target is edited. SF-07 keeps "Not set → 12 (default)".
- The finding reads "Entering 322 GB/day; reaching Indexing 230 GB/day". It mentions targets only when every target it adds up has been edited.
- On the ES acceptance topology after fix 1, SF-11 shows "Not set → 0.6 (default)".

### 4. "Attributes not set" counts derived and trace fields (SvcV-6), P1

**What happens:** the SvcV-6 summary reads "78 attributes not set". That count includes:
- Events/s today and target, which are derived from GB/day and average bytes;
- the OV-3 column, which is a trace, not an attribute;
- Average bytes, which is a sizing assumption.

**Rule:**
- Count only these 12 commitment attributes: data, format, frequency, GB/day today, GB/day target, latency, service level, classification, confidentiality, integrity, authentication, handling.
- The OV-3 column shows "—" when a flow has no RF ID, not "Not set".
- The detail list stops showing Events/s, Average bytes and OV-3.

**Check:** **43 attributes not set** once fix 3 is in (38 before it):

| Attribute | Not set |
|---|---|
| Authentication | 12 |
| GB/day target | 9 (SF-01 to SF-05, and SF-14 to SF-17) |
| Service level | 7 |
| GB/day today | 7 |
| Integrity | 4 |
| Latency | 2 |
| Confidentiality | 1 |
| Handling | 1 |

### 5. "Needs attention" flags every flow (SvcV-2, SvcV-6), P1

**What happens:** the SvcV-2 filter reads "Needs attention (17)". Any attribute that isn't set flags a flow, and 12 flows have no authentication.

**Rule:** a flow needs attention when any of these holds:
- its status isn't In place;
- confidentiality is "None…" or "Not set";
- service level is "Not set" on a **data** flow;
- handling is "Not set" on a flow that carries PII.

The same rule drives SvcV-6's "Needs attention only" toggle.

**Check:** **9 flows**: SF-01, 03, 06, 09, 10, 11, 12, 16 and 17. This list is the rule applied to Build 180's attributes.

### 6. The default selection dims the matrix on load (SvcV-3a, SvcV-3b), P2

**What happens:**
- SvcV-3a opens with Heavy Forwarder 1 selected and 16 rows dimmed.
- SvcV-3b opens with S12 selected and 13 rows dimmed.

In the mockups, the default only fills the detail strip.

**Rule:**
- On load and after Esc, show the default item's detail **without** the `focused` dimming and without the selected-row marker.
- Dim only after the user selects something.

**Check:**
- On load, both views show the default detail with no dimmed rows.
- Clicking a row dims the others.
- Esc returns to the undimmed default.

### 7. Wording, P2

| Where | Build 180 text | Should read |
|---|---|---|
| SvcV-1 "Most used" | "S7 Indexing has 4 consumers and 1 providers." | "… and 1 provider." |
| SvcV-3a summary | "1 systems unconnected" | "1 system unconnected" |
| SvcV-3a "Single provider", when only one service is listed | "S7 · Indexing each have one provider." (the code always writes "each have") | "S7 · Indexing has one provider." |
| SvcV-6 "Internal flows" | "9 flows have no real edge: 2 internal, 3 inferred, 4 not designed." | "… 2 internal, 3 inferred, 1 missing output, 3 not designed." SF-06 has a missing output; it isn't undesigned |

- **Plurals:** use one plural helper for all generated text.
- **SvcV-6 "Handling":** the finding fires on example text alone. On the **default** topology it reads "PII handling differs across the collection flows: Raw; no masking; Masked at the indexer (SEDCMD)."
  - **Rule:** compare only handling values that were edited or come from the pack caveat, not defaults.
  - **Check:** the default topology shows no Handling finding.

### 8. Heading spacing, P3

Two headings touch what's above them (0px gap):
- SvcV-2: "Flow register" sits right under the filter buttons.
- SvcV-6: "Carried by system interfaces" sits right under the matrix.

**Rule:** give section headings that follow a control row or a table a 16px top margin.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
   - The default and reference topologies are unchanged, apart from what fixes 3–8 change: the SF-01 to SF-05 targets, the not-set total (78 → 43), the attention count (17 → 9), the undimmed default selection and the wording.
2. **Fixes 1–8:** the checks in each item.
3. **Records:** a `changeRegister` entry ("Review: ES findings link, card clamp at low zoom, services volume targets, not-set count, attention rule, default selection, wording and spacing") and the build stamp.

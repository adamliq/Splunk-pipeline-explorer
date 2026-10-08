# Builder handoff: Build 175 recheck (CV-2 and the Services views)

> **Moved:** these fixes were still not in Build 180. They're now fixes 3–8 in [`builder-handoff-build180.md`](builder-handoff-build180.md), re-measured on Build 180. Work from that handoff.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 175 (`builder-cv2-v171`, `builder-svcv6-v172`, `builder-svcv4-v173`, `builder-svcv3-v174`, `builder-svcv12-v175`). Add one block, `builder-services-review-v176`, with wrappers only.
**Tested with:** `docs/mockups/ov1-reference-topology.json` and the default topology, at 1280px and 400px.

## What passes

- **Clean run:** 0 `pageerror` events on both topologies.
- **No overflow:** no text overflows its box in any new SVG, and no tab scrolls sideways at 400px or 1280px.
- **Tab order:** OV-1 … CV-1, CV-2, SvcV-1, SvcV-2, SvcV-3a, SvcV-3b, SvcV-4, SvcV-6, with the agreed names.
- **Reference topology:** every count matches its handoff:

  | View | Result |
  |---|---|
  | CV-2 | 12 in topology / 7 partial / 3 planned |
  | SvcV-1 | 12 of 16 deployed, 5 consumers, 25 dependencies (2 missing, 10 planned) |
  | SvcV-2 / SvcV-6 | 17 flows: 8 in place, 2 gap, 5 planned, 2 missing |
  | SvcV-3a | 35 mappings, 14 provider cells, 3 cut off, 4 with no system, 1 unconnected |
  | SvcV-3b | 19 pairs; S7 is the hub with 6 |
  | SvcV-4 | 16 / 7 / 5 / 7 |

  SF-15 goes to S9 only.
- **Findings:** all the generated findings appear.
- **Default topology:** the counts match too: 3 flows, 3 deployed services, 6 SvcV-3a mappings, SvcV-4 6/1/28/0.

## Fixes

### 1. Volume: today and target come from different sources (SvcV-6, SvcV-2), P1

Today's GB/day comes from the topology's capacity figures, but the target falls back to the mockup's example value:
- SF-01 shows **322 → 55**, SF-02 **322 → 55** and SF-03 **230 → 34**: the target is far below today.
- The SvcV-2 "Volume lost" finding reads "Entering 322.00 → 77.00 GB/day".

**Rule:** use the mockup's default target **only when today is also a default**. When today comes from the topology and no target has been edited, the target is "Not set".

**Formatting:** format GB/day the same way in tables and findings: whole numbers below 1 000 with no decimals, values under 10 with one decimal. Never "322.00".

**Check:**
- SF-01 shows "322 → Not set" until a target is edited.
- The finding reads "Entering 322 GB/day; reaching Indexing 230 GB/day" and mentions targets only when they are set.

### 2. "Attributes not set" counts derived and trace fields (SvcV-6), P1

The summary says **78**. That includes:
- Events/s today and target (derived from GB/day and bytes, 22 cells);
- the OV-3 column (a trace, not an attribute, 7 cells);
- Average bytes (a sizing assumption, 11 cells).

**Rule:** count only these 12 commitment attributes: data, format, frequency, GB/day today, GB/day target, latency, service level, classification, confidentiality, integrity, authentication, handling. The OV-3 column shows "—" when a flow has no RF ID, not "Not set".

**Check (with fix 1 applied):** the reference topology shows **43 attributes not set**:
- authentication 12;
- GB/day target 9 (SF-01 to SF-05 and SF-14 to SF-17);
- service level 7;
- GB/day today 7;
- integrity 4;
- latency 2;
- confidentiality 1;
- handling 1.

The detail list no longer shows Events/s, Average bytes or OV-3.

### 3. "Needs attention" flags every flow (SvcV-2, SvcV-6), P1

The SvcV-2 filter reads **"Needs attention (17)"**, because 12 flows have authentication "Not set". The rule in the SvcV-6 handoff was too broad.

**Rule:** a flow needs attention when any of these holds:
- its status is not In place;
- Confidentiality is "None…" or "Not set";
- Service level is "Not set" on a **data** flow;
- Handling is "Not set" on a flow that carries PII.

The same rule drives the SvcV-6 "Needs attention only" toggle.

**Check:** the reference topology gives **9 flows**: SF-01, 03, 06, 09, 10, 11, 12, 16, 17.

### 4. The default selection dims the matrix on load (SvcV-3a, SvcV-3b), P2

Opening SvcV-3a selects Heavy Forwarder 1 and dims every other row; SvcV-3b does the same with S12. In the mockups the default only fills the detail strip.

**Rule:** on load and after Esc, show the default item's detail **without** the `focused` dimming and without the selected row marker. Dim only after the user selects something.

### 5. Wording, P2

- **Plurals:**
  - SvcV-1 "Most used": "has 4 consumers and **1 provider**";
  - SvcV-3a summary: "**1 system** unconnected";
  - SvcV-3a "Single provider": "S7 · Indexing **has** one provider" when only one service is listed.

  Use one plural helper for all generated text.
- **SvcV-6 "Internal flows":** "9 flows have no real edge: 2 internal, 3 inferred, 4 not designed" counts SF-06 as not designed, but SF-06 has a missing output. Say "2 internal, 3 inferred, **1 missing output**, 3 not designed".
- **SvcV-6 "Handling":** compare only handling values that were **edited or come from the pack caveat**, not defaults. On the default topology the finding currently fires on example text alone ("Raw; no masking; Masked at the indexer"), and it should not.

### 6. Heading spacing, P3

- SvcV-2: the "Flow register" heading starts exactly at the bottom of the filter buttons (0px gap).
- SvcV-6: "Carried by system interfaces" touches the bottom of the matrix.

Give section headings that follow a control row or a table a 16px top margin.

## Check before uploading

1. **Regression:** 0 `pageerror` events; every count under "What passes" unchanged, except the not-set total (fix 2) and the attention count (fix 3).
2. **Fixes 1–3:** the checks in each item.
3. **Fix 4:** on load, SvcV-3a and SvcV-3b show the default detail with no dimmed rows; clicking a row dims the others; Esc returns to the undimmed default.
4. **Records:** a `changeRegister` entry ("Services views review: volume targets, attention rule, not-set count, default selection, wording") and the build stamp.

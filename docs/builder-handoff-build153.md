# Builder handoff: Build 153 review

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `f31b20b` (Build 153: `builder-threat-layout-v153`), merged into branch `claude/build-page-layout-bl6jk1`
**Replaces:** `builder-handoff-build152.md` as the task list.
**Tools:**
- `node tools/builder-perf-check.js index.html`
- `node tools/builder-space-check.js index.html`
- `node tools/builder-connector-check.js index.html`

**Screenshot:** `docs/mockups/compare/threat-model-build153.png`. It shows TM-1 with the reference topology (`docs/mockups/ov1-reference-topology.json`) after converting Indexer 1 to Splunk Cloud (stack "acme").

## TL;DR

- **Fixed since Build 152:**
  - **Register cells:** every row now has a STRIDE letter and a Status dropdown (0 bad rows out of 27).
  - **TM-1 width:** the diagram is now 1,192 wide (`viewBox 0 0 1192 1067`), with no sideways scroll. The AWS zone sits below collection and identity sits below Splunk, as in the mockup.
  - **Default statuses, partly:** with Splunk Cloud there are now 2 Mitigated (TM-20 and TM-27, the forwarder certificate) and 1 Transferred (TM-14, owner "Splunk Cloud provider"), plus a "Retired" section.
  - **Performance improved:** default is now within budget.
  - **"Use" button:** now has its `title`.
  - **TM review findings:** "Open high-risk threats" and "Threat owner not set" exist.
  - **No errors:** 0 errors across 188 buttons; canvas space passes at all 4 sizes.
- **Still to do:**
  1. Accepted, MFA, queue and store defaults are still missing (0 accepted).
  2. DF pills are still hidden between circles (DF-2, DF-5, DF-7, DF-10, DF-11), and DF-8 overlaps DF-9.
  3. Performance is still over budget for fan5, fan8 and reference.
  4. The 3 connector failures are unchanged.
  5. The Validate badge still says "1 errors" in one place.

## Rules (unchanged)

- Start from the latest `index.html` on `main`. Keep every block. The next block is `…-v154`.
- Before uploading, run:
  - all three tools;
  - the button and grouping sweeps;
  - the four OV tabs (OV-1, OV-2, OV-3, TM-1).

---

## 1. Default threat statuses: finish the rules

**Now:**
- **Plain reference topology:** all 26 threats are Open.
- **With Splunk Cloud:** 24 Open, 2 Mitigated (S2S with a certificate), 1 Transferred (P3 Splunk Cloud, I) and **0 Accepted**.

**Missing defaults** (spec `builder-handoff-threat-model.md` item 4):
- **Accepted (I, Low):** a queue on a forwarder host. Seed the threat if needed, then accept it.
- **Mitigated:**
  - SAML sign-in with MFA recorded (TM-22 and TM-23, when the auth relation records MFA);
  - acknowledgement + persistent queue both on (the D threats on S2S flows);
  - a syslog relay with a disk buffer.
- **Transferred:** the store **D1 · Index data store** inside the Splunk-managed zone. Today only P3's threat is transferred; any threat on D1 (or seeded for it) should be too.
- **The `D` threat on DF-7 (Splunk Cloud → Search Head) is Open.** Inside the provider boundary it should be Transferred, the same as P3.

**Check:**
- The reference topology + Splunk Cloud shows **≥1 Accepted**, ≥1 Mitigated and ≥2 Transferred.
- Setting MFA on the Authentication Provider marks TM-22/23 Mitigated.
- A changed status still wins after export → re-import.

## 2. TM-1 diagram: pills hidden between circles

See `threat-model-build153.png`. The layout is much better; what's left is all about spacing:

- **Pills cut off behind circles:**
  - DF-2 (P1 → P2) reads "-2";
  - DF-5 (P4 → P5) reads "F-5";
  - DF-7 (P3 → P8) reads "F-7";
  - DF-10 (P7 → P10) reads "DF";
  - DF-11 (E4 → E5) reads "11".

  The circles in each row sit about 40px apart, so the pill doesn't fit. Either:
  - put **≥ 70px** between connected shapes in a row; or
  - when the gap is under the pill width + 8, draw the pill **above the line**, with a 1px leader.
- **DF-8 and DF-9 overlap each other** under P5 (the two Deployment Server management flows). Offset their pills along each path so they don't share a spot.
- **Empty process:** P9 (Splunk SOAR · Cloud 1) has no flows. That's acceptable if the topology has none. Otherwise check that its relation is included.
- **Management line:** P10 → P2 is now routed beside P5 (fixed).
- **DF-6:** it runs up the zone's left edge from P6 to P7. Keep it, but start it from P6's top, not its side, so it doesn't run along the AWS zone border.

**Check:** no pill is clipped by a shape or another pill. Measure each pill's `rect` against the circle and rect boxes, not the group bbox. Flows still don't cross other shapes.

## 3. Performance: better, still over budget

`node tools/builder-perf-check.js index.html` (median redraw time, ms):

| Scenario | Build 149 (+guard) | Build 152 | **Build 153** | Budget |
|---|---|---|---|---|
| default (4 / 3) | 40 | 46 | **40** ✅ | 40 |
| fan5 (5 / 4) | 56 | 80 | **59** | 50 |
| fan8 (8 / 10) | 121 | 159 | **124** | 80 |
| reference (17 / 12) | 290 | 361 | **344** | 120 |

The reference topology is still about 3× over budget. Next steps, from `builder-handoff-canvas-performance.md` item 4:
- Read each card box once per redraw into a `Map`.
- Skip unchanged panel `innerHTML` writes using a signature.
- Run `polishBuilderText` only on new nodes.
- Cache the history times.
- **Keep TM-1 model building out of the Builder redraw.** Build it only when TM-1 or the pack is rendered.

**Check:** all four scenarios within budget.

## 4. Connector check: the same 3 failures

`node tools/builder-connector-check.js index.html`:
- Syslog Source 1 → Syslog Server 1 [data]: label over a node.
- Syslog Source 1 → Syslog Server 1 [data]: badge over label.
- Syslog Server 1 → Universal Forwarder 1 [data]: label over a node.

The fix is the same as `builder-handoff-build152.md` item 6. Pick the least-overlap candidate that keeps clear of cards, and put the badge at the label's right end.

## 5. Small

- **Validate badge:** `builderSpaceRail140` (block v140) still writes `validation.errors+' errors'` and `${validation.errors} errors · …` in the summary title. The v153 patch only replaces the text in one bar. Fix the source so it says "1 error" or "n errors" everywhere.
- **Encryption on DF-3 (S2S to Splunk Cloud):** shows "Required", and its Threats cell reads "S, S" (duplicated). List each letter once.
- **Inventory Host column:** still not verified. Confirm `builderInventoryRows()` and the pack table show the host for hosted components.
- **Carried over from `builder-handoff-build141.md`:**
  - OV-2: self-needlines and pill overlaps;
  - OV-3: doubled chip labels;
  - OV values;
  - OV-1: markers and tags;
  - canvas: minimum text 11.5px and the Fit 100% snap;
  - connector tool: fan-out scenario 9.

---

## How to verify
1. 0 `pageerror` events. The button sweep (188) and grouping sweep are clean (true in 153).
2. All three tools pass (perf, space, connector).
3. TM-1 on the reference topology, with Indexer 1 converted to Splunk Cloud "acme": the item 1 statuses and the item 2 pills.
4. Shared host collapse/expand and the Splunk Cloud flows behave as in Build 152.
5. A `changeRegister` entry per new block.

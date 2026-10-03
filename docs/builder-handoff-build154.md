# Builder handoff: Build 154 review

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `49d4f46` (Build 154: `builder-threat-polish-v154`), merged into branch `claude/build-page-layout-bl6jk1`
**Replaces:** `builder-handoff-build153.md` as the task list.
**Tools:**
- `node tools/builder-perf-check.js index.html`
- `node tools/builder-space-check.js index.html`
- `node tools/builder-connector-check.js index.html`

**Screenshot:** `docs/mockups/compare/threat-model-build154.png`. It shows the TM-1 diagram for the reference topology (`docs/mockups/ov1-reference-topology.json`), with Indexer 1 converted to Splunk Cloud "acme".

## TL;DR

- **Fixed since Build 153:**
  - **Default statuses now cover all four values.** With Splunk Cloud: 23 Open, 2 Mitigated, 3 Accepted and 3 Transferred (31 threats in all). The store D1 is Transferred, and the "Applies to" text reads "D1 · Index data store on …".
  - **DF pills:** all 12 are readable. None overlaps a shape or another pill (each pill's own box was measured), and displaced pills get a leader line.
  - **Crossings table:** the duplicate "S, S" is gone.
  - **Validate badge:** now says "1 error".
  - **No errors:** 0 errors across 188 buttons; canvas space passes at all 4 sizes.
- **Still to do:**
  1. **Crossing diamonds are in the wrong place** on 3 of 5 crossings (new finding, P1 for TM-1).
  2. A management line runs through the DF-5 pill, and DF-6 runs along a zone border.
  3. **Performance** has improved slightly but is still over budget; the default case is 1ms over.
  4. The **3 connector failures** are unchanged.
  5. The **Accepted** rule needs a check.

## Rules (unchanged)

- Start from the latest `index.html` on `main`. Keep every block. The next block is `…-v155`.
- Before uploading, run:
  - all three tools;
  - the button and grouping sweeps;
  - the four OV tabs.

---

## 1. TM-1: crossing diamonds aren't on their lines (P1)

Each crossing diamond (`.tmCross150`) should sit where its flow's line crosses the trust boundary. Measured on the reference topology + Splunk Cloud (distance from the diamond's centre to its own flow's path):

| Crossing | Flow | Diamond at | Distance to its line | Where the line actually crosses |
|---|---|---|---|---|
| X-1 | DF-1 Firewalls → Syslog Server 1 | (358, 180) | **57px** | the Source systems right edge at y≈113 (the line goes over E2) |
| X-2 | DF-3 UF 1 → Splunk Cloud | (748, 180) | 2px ✅ | |
| X-3 | DF-4 Syslog Source 2 → Syslog Server 2 | (358, 330) | 2px ✅ | |
| X-4 | DF-6 AWS Lambda → Heavy Forwarder | (748, 539) | **259px** | the bottom of Customer collection / top of Customer AWS account, at x≈428 (the diamond is on the wrong zone's right edge) |
| X-5 | DF-12 Auth Provider → Search Head | (1138, 239) | **81px** | the bottom edge of the Splunk processing zone at x≈1099 (the diamond is on the right edge) |

The diamonds are placed at "the zone's edge, level with the source node". That only works for straight horizontal flows.

**Fix:** compute each diamond from the routed path. Walk the flow's `d` segments, find the first segment that crosses the source zone's rectangle edge, and place the diamond at that intersection. Do this after any re-routing (v153 layout and v154 pill pass), so it uses the final path.

**Check:** every `.tmCross150` is within 3px of its own `.tmFlow150` path, and lies on a boundary rectangle's edge.

## 2. TM-1: two drawing details

- **A line through the DF-5 pill:** the DF-8 management line (P10 → P2, dashed green) runs vertically through the DF-5 pill between P4 and P5 ("DF-5" is struck through). Either:
  - add the routed management paths to the obstacle list in the v154 pill pass (`occupied` today only has shapes and pills); or
  - route DF-8/DF-9 left of the pills.
- **DF-6 runs along the zone border.** From P6 it goes up the Customer collection zone's left border (x≈428) for about 330px, through D2's left end, to P7. The border dashes hide it. Route it 16px inside the zone, and don't pass through D2: go around the store's left end, or end at P7 from below.
- **Faint leader:** DF-11's leader (in the identity zone) is very faint. Use the flow's colour at 60% opacity for `.tmPillLeader154`.

**Check:** no flow path crosses a pill that isn't its own; no path runs along a boundary edge for more than 20px.

## 3. Performance: still over budget

`node tools/builder-perf-check.js index.html` (median redraw time, ms):

| Scenario | Build 152 | Build 153 | **Build 154** | Budget |
|---|---|---|---|---|
| default (4 / 3) | 46 | 40 | **41** | 40 |
| fan5 (5 / 4) | 80 | 59 | **54** | 50 |
| fan8 (8 / 10) | 159 | 124 | **118** | 80 |
| reference (17 / 12) | 361 | 344 | **289** | 120 |

Path lookups are within limits (757 on reference). The time is spent in the rest of the redraw. Apply `builder-handoff-canvas-performance.md` item 4:
- read each card box once per redraw;
- skip unchanged panel `innerHTML` writes using a signature;
- run `polishBuilderText` only on new nodes;
- cache the history times.

Then profile `renderBuilder` at 17 components, and keep the TM-1 model out of the Builder redraw.

**Check:** all four scenarios within budget.

## 4. Connector check: the same 3 failures

`node tools/builder-connector-check.js index.html`:
- **Scenario 5** (Syslog Server dragged left of Syslog Source): Syslog Source 1 → Syslog Server 1 has a label over a node, and its badge over the label.
- **Scenario 6** (Syslog Server dragged up-right): Syslog Server 1 → Universal Forwarder 1 has a label over a node.

The fix is unchanged; see `builder-handoff-build152.md` item 6.

## 5. Threat statuses: checks and one question

- **Accepted:** v154 adds "The forwarder host temporarily buffers events in memory" (I, Low, Accepted) for every UF/HF **without** a persistent queue. The store rule (I, Low, Accepted) is for forwarders **with** one. Both are reasonable; make sure that turning on a persistent queue swaps the first for the second and doesn't add both.
- **The Transferred rule on flows:** the v154 rule marks the D and I threats Transferred on any flow that touches a cloud indexer. For flows **out of** the cloud (Splunk Cloud → Search Head, DF-7), that's right. For flows **into** the cloud (UF → Splunk Cloud, DF-3), the sending side is the customer's: its D threat (forwarder queue, acknowledgement) and its I threat in transit should stay with the customer. Limit Transferred to flows whose **source** is the cloud indexer, plus the cloud node and its stores.
- **MFA:** confirm TM-22/23 turn Mitigated when the Authentication Provider records MFA enforced. Not tested in this review; the reference topology doesn't record MFA.

**Check:** reference + Splunk Cloud: DF-3 has no Transferred threats; DF-7 and P3/D1 do.

## 6. Small (carried over)

- **Inventory Host column:** confirm `builderInventoryRows()` and the pack table show the host for hosted components.
- **From `builder-handoff-build141.md`:**
  - OV-2: self-needlines and pill overlaps;
  - OV-3: doubled chip labels;
  - OV values;
  - OV-1: markers and tags;
  - canvas: minimum text 11.5px and the Fit 100% snap;
  - connector tool: fan-out scenario 9.

---

## How to verify
1. 0 `pageerror` events. The button sweep (188) and grouping sweep are clean (true in 154).
2. All three tools pass.
3. TM-1 on the reference topology with Indexer 1 converted to Splunk Cloud "acme":
   - the item 1 diamond distances;
   - the item 2 path and pill checks;
   - the item 5 statuses.
4. A `changeRegister` entry per new block.

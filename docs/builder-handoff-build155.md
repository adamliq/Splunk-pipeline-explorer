# Builder handoff: tasks for Build 155

> **Superseded by [`builder-handoff-build156.md`](builder-handoff-build156.md)** (Build 155 review and Build 156 tasks). Kept as the record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** `main` at `49d4f46` (Build 154). Add one new block, `<script id="builder-threat-fixes-v155">`, after `builder-threat-polish-v154`.
- Use the wrapper pattern (`const fooBefore155=foo; foo=function(){…}`).
- Never redeclare a top-level name.
- Keep every existing block.

**Replaces:** `builder-handoff-build154.md` as the task list (that file is the review record).
**Tools** (copy `tools/` from branch `claude/build-page-layout-bl6jk1` to `main`):
- `node tools/builder-perf-check.js index.html`
- `node tools/builder-space-check.js index.html`
- `node tools/builder-connector-check.js index.html`

**Test topology:** `docs/mockups/ov1-reference-topology.json`. For the TM-1 checks:
1. Load it.
2. Convert Indexer 1 to Splunk Cloud (`builderCloudConvert148`, stack "acme").
3. Open OV → TM-1.

**Screenshot of the current state:** `docs/mockups/compare/threat-model-build154.png`.

## Order of work

| # | Task | Area | Size |
|---|---|---|---|
| 1 | Crossing diamonds on their lines | TM-1 diagram | small, P1 |
| 2 | Line through the DF-5 pill, DF-6 on the zone border, faint leader | TM-1 diagram | small |
| 3 | Duplicate Accepted and MFA threats; the Transferred rule | TM-1 statuses | small |
| 4 | 3 connector label failures | Builder canvas | medium |
| 5 | Redraw performance within budget | Builder canvas | large |
| 6 | Carried-over small items | various | small |

Do 1–3 first: they're local to TM-1 and easy to verify. Then do 4, then 5. Re-run the connector check after 5, since perf work touches label placement.

---

## 1. TM-1: put each crossing diamond on its line (P1)

**Now:** 3 of 5 diamonds are away from their own flow (distance from the diamond centre to its path):

| Crossing | Flow | Diamond | Off by |
|---|---|---|---|
| X-1 | DF-1 Firewalls → Syslog Server 1 | (358, 180) | **57px**; the line crosses at y≈113 |
| X-4 | DF-6 AWS Lambda → Heavy Forwarder | (748, 539) | **259px**, on the wrong zone's right edge; the line crosses the AWS zone's top at x≈428 |
| X-5 | DF-12 Auth Provider → Search Head | (1138, 239) | **81px**; the line crosses the Splunk zone's bottom edge at x≈1099 |

X-2 and X-3 are correct (2px).

**Cause:** `builderThreatSvg150` (v152 version, about line 7265) computes `crossX` and `crossY` from the straight, pre-routing line, always on the left or right edge of the source zone. Then v153 (`builderThreatRoute153`) replaces the path's `d` with a routed path but leaves the `.tmCross150` diamond where it was.

**Fix (in the v155 `builderThreatSvg150` wrapper, after v153 and v154 have run):**
1. Tag the zone rectangles so they can be found. Either:
   - wrap the v152 SVG builder and add `data-zone="${zone.key}"` to each `rect.tmZone150`; or
   - in the wrapper, match each zone rect to its zone by position: the rect that contains the source node's box.
2. For each `g[data-key]` with a `.tmCross150`:
   - parse the final `.tmFlow150` `d` into points (the `M`/`L` regex v154 already uses);
   - take the source zone's rect `R`, from `model.byNode.get(edge.from)`, or the rect containing the first point;
   - walk the segments: the first segment with one end inside `R` and the other outside is the crossing segment;
   - intersect it with `R`'s edges. Segments are axis-aligned, so it's a simple clamp: a horizontal segment crosses at `x=R.x` or `x=R.x+R.w`; a vertical one at `y=R.y` or `y=R.y+R.h`;
   - rewrite the diamond's `d`: `M${x} ${y-7}L${x+7} ${y}L${x} ${y+7}L${x-7} ${y}Z`.
3. If the crossing point falls under the flow's own pill, move the pill (re-run the v154 candidate search with the diamond's box added to `occupied`), not the diamond.

**Check:**
```js
// in the TM-1 tab: every diamond within 3px of its own path
[...document.querySelectorAll('.tmCross150')].every(c=>{const b=c.getBBox(),x=b.x+b.width/2,y=b.y+b.height/2,p=c.closest('[data-key]').querySelector('.tmFlow150'),L=p.getTotalLength();for(let a=0;a<=L;a+=2){const q=p.getPointAtLength(a);if(Math.hypot(q.x-x,q.y-y)<=3)return true}return false})
```
This must return `true`. Each diamond must also sit on a `rect.tmZone150` edge, within 1px.

## 2. TM-1: three drawing details

1. **The DF-8 management line runs through the DF-5 pill.** The dashed green P10 → P2 line passes vertically through "DF-5", between P4 and P5. In the v154 pill pass, `occupied` holds only shapes and other pills.
   - **Fix:** before placing pills, add every routed `.tmFlow150` segment, as a thin box (segment ± 4px), to the obstacles. A pill may overlap only its own flow's segments.
   - **Alternative:** in `builderThreatRoute153`, treat pills already placed as obstacles. The pill pass is the simpler place for the fix.
2. **DF-6 runs along the zone border.** From P6 (AWS Lambda) it goes up the Customer collection zone's left border (x≈428) for about 330px, and crosses D2's left end, before reaching P7.
   - **Fix:** in `builderThreatRoute153`, add the zone rectangles' edges as obstacles for **parallel** runs (a segment within 6px of an edge, running parallel to it for more than 20px, scores like a hit), and add store boxes (`[data-key^="store:"]`) to `all` alongside node boxes.
   - **Expected result:** DF-6 leaves P6's top, goes up about 16px inside the zone, and reaches P7 from below.
3. **Faint leader:** `.tmPillLeader154` (DF-11) is barely visible. Add CSS: `.tmFigure150 .tmPillLeader154{stroke:currentColor;stroke-opacity:.6;stroke-width:1;fill:none}`, with the group's `color` set from the flow plane (data blue, management green, authentication purple).

**Check:**
- No `.tmFlow150` segment intersects a pill that isn't its own.
- No segment runs within 6px of, and parallel to, a zone edge for more than 20px.
- No flow crosses a store box.
- Screenshot it and compare with `threat-model-build154.png`.

## 3. TM-1 statuses: remove duplicates, tighten Transferred

Measured on Build 154:

1. **A persistent queue gives one forwarder three Accepted threats.** Setting `persistent=true` on Universal Forwarder 1 (node 3) produces:
   - `node:3:I-queue` (Accepted, from v153's status pass);
   - `node:3:I-forwarder-queue` (Accepted, added in v153 at about line 7380);
   - `store:D-3:I` (Accepted, added in v154 for the "Persistent queue" store).

   All three say the same thing. **Keep only the store threat** (`store:D-3:I`): it's on the DFD's own store element. Remove the other two for forwarders that have a queue store:
   - delete them from `model.threats` in the v155 `builderThreatModel150` wrapper;
   - keep any recorded override by moving it to the store key on load (`overrides['node:3:I-forwarder-queue']` → `overrides['store:D-3:I']` when the target has none).
2. **MFA adds a second S threat.** With `mfa:'enforced'` on both authentication relations, each flow has:
   - its original `…:S` threat, correctly Mitigated;
   - plus a new `…:S-mfa` threat, also Mitigated.

   Drop the extra `builderThreatAdd152(model,'flow:'+key+':S-mfa',…)` call in v154. The original threat already records the decision; put the MFA wording in its `control` instead: "Second factor enforced; audit sign-in decisions."
3. **Make the Transferred rule direction-aware.** v154 uses `cloud=[from,to].some(builderIsCloudIndexer148)`. Today only DF-7 (Splunk Cloud → Search Head) gets a Transferred D threat, which is correct. But any D or I threat later seeded on an **inbound** flow (UF → Splunk Cloud) would wrongly be Transferred: the sending side's queue, acknowledgement and transport are the customer's.
   - Use `builderIsCloudIndexer148(from)` for flows.
   - Keep the node and store rules as they are.

**Check** (reference + Splunk Cloud):
- With UF 1 persistent, exactly **one** Accepted threat targets UF 1 or its queue store (`store:D-3`).
- With MFA enforced, each authentication flow has exactly **one** S threat, and it's Mitigated.
- No threat on DF-3 (UF 1 → Splunk Cloud) is Transferred; DF-7, `node:4` and `store:D-4` are.
- A recorded status still wins after export → re-import.

## 4. Builder canvas: 3 connector label failures

`node tools/builder-connector-check.js index.html` (unchanged since Build 152):

| Scenario | Connector | Failure |
|---|---|---|
| 5 · Syslog Server dragged left of Syslog Source (reversed) | Syslog Source 1 → Syslog Server 1 | label over a node; badge over label |
| 6 · Syslog Server dragged up-right | Syslog Server 1 → Universal Forwarder 1 | label over a node |

**Fix** (in the current label placement, `builderPlaceLabels149` plus any later wrappers):
- **Score candidates in this order:**
  1. overlap with cards;
  2. overlap with other labels;
  3. distance from the path.

  Today a candidate that overlaps a card can win when the alternatives are further along the path. Never accept a card overlap while any candidate (including positions offset ±18 / ±32px perpendicular to the segment) is clear of cards.
- **Badge:** place it at the label's right end, `labelBox.x + labelBox.w + 4`, vertically centred. Include the badge in the candidate's box when scoring, so label + badge are placed as one unit. This fixes "badge over label".
- **Reversed connectors** (scenario 5, target left of source): build candidates on the path as drawn, not on a left-to-right assumption.

**Check:** every scenario reports OK, and the default topology still shows "TCP/TLS or UDP" with its badge.

## 5. Builder canvas: redraw within budget

`node tools/builder-perf-check.js index.html` (median of 5 redraws, ms):

| Scenario | Build 152 | Build 153 | Build 154 | **Budget** |
|---|---|---|---|---|
| default (4 / 3) | 46 | 40 | 41 | **40** |
| fan5 (5 / 4) | 80 | 59 | 54 | **50** |
| fan8 (8 / 10) | 159 | 124 | 118 | **80** |
| reference (17 / 12) | 361 | 344 | 289 | **120** |

Path lookups are already low (757 on reference), so label sampling isn't the cost any more.

**Step 1: profile first.**
- Use Chrome DevTools, or Playwright with `page.context().newCDPSession(page)` and `Profiler.start`/`stop`, around `renderBuilder()` with the reference topology loaded.
- List the top 10 self-time functions in the handoff notes of your build.

**Step 2: apply `builder-handoff-canvas-performance.md` item 4.** The likely costs, in order:
1. **Layout reads interleaved with writes.**
   - `builderCardBox` and `builderContentSize` call `getBoundingClientRect`/`offset*` repeatedly.
   - Read every card box once per redraw into a `Map` (`builderCardBoxCache155`), after all card DOM writes, and pass it to routing, labels, host boxes and the minimap.
   - Invalidate it at the start of each `renderBuilder`.
2. **Panels re-rendered every redraw:** the inspector, review list, inventory, history and validation bar.
   - Keep a signature per panel, for example `JSON.stringify([selection, nodes.length, relations.length, relevant details])`.
   - Skip the `innerHTML` write when it's unchanged.
3. **`polishBuilderText`:** run it only on elements without `data-polished`, then set the flag.
4. **`formatBuilderHistoryTime`:** cache the strings per entry; refresh once a minute.
5. **Wrapper chains:** `renderBuilder` is wrapped by many blocks (v140, v147, v148, v151, v153, …), and some of them re-query the whole canvas.
   - Check that none of them rebuilds TM-1, OV models or the architecture pack during a Builder redraw.
   - These should only build when their tab is shown.

**Step 3: drags.**
- During a card drag, re-route only the moving card's connectors and put their labels at the midpoint.
- Run the full placement once after the drop, in `requestIdleCallback` (timeout 100ms).

**Check:** `"allOk": true`. The connector check still passes (item 4). 0 `pageerror` events.

## 6. Small (carried over)

- **Inventory Host column:** confirm that `builderInventoryRows()` returns the host for hosted components (shared hosts, v147), and that the architecture pack's inventory table shows it.
- **From `builder-handoff-build141.md`:**
  - OV-2: self-needlines and pill overlaps;
  - OV-3: doubled chip labels;
  - OV values;
  - OV-1: markers and tags;
  - canvas: minimum text 11.5px and the Fit 100% snap;
  - connector tool: fan-out scenario 9.
- **Change register:** add one entry for v155, for example `['TM-1 crossings and canvas speed','Place crossing markers on routed flows, remove duplicate threats and speed up Builder redraws.',true]`.
- **Build stamp:** update `document.title`, `data-build-number` / `data-build-date` and `.builderBuildStamp` to 155, as v154 does.

---

## How to verify before uploading

1. 0 `pageerror` events on load at 1280, 1440, 1920 and 390 wide.
2. Button sweep (188 buttons) and grouping sweep: 0 errors.
3. All three tools pass:
   - perf `allOk: true`;
   - space: 4 sizes meet target;
   - connector: every scenario OK.
4. TM-1 (reference + Splunk Cloud "acme"):
   - the item 1 diamond check returns `true`;
   - the item 2 path checks;
   - the item 3 status checks;
   - no horizontal scroll (viewBox width ≤ 1,200).
5. OV-1, OV-2 and OV-3 still render. Export → re-import keeps hosts, cloud fields and threat decisions.

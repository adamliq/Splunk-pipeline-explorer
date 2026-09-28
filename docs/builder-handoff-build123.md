# Builder handoff: Build 123 review

> **Superseded by [`builder-handoff-build131.md`](builder-handoff-build131.md).** Build 124 addresses the items below; see that file for what remains. Kept as history.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `3079898` (Build 123, 28 Sep 2026), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build122.md` and earlier. This file replaces them as the task list.
**New tool:** `tools/builder-connector-check.js` runs the connector check used in this review. Run `node tools/builder-connector-check.js index.html [screenshot-dir]` (needs Playwright/Chromium). It prints JSON per scenario; `OK` means that connector passed every check.

## TL;DR

Build 123's connector rewrite (`builder-connector-geometry-v123`) is the right design: **arrows no longer run along card sides, and while dragging, connectors are correct in 7 of 8 scenarios.** But it has **one bug that makes every connector start 15px inside its source card after any full re-render**, including on page load in the default layout. **The fix is two lines, tested below** (item 1). Items 2–5 are smaller.

Also verified: 0 `pageerror` events on load or resize, and 0 errors across all 175 Builder buttons.

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v123`).
- **Never redeclare a top-level `const`, `let` or `function` name** (all classic scripts share one global scope, so a duplicate makes the browser skip the whole script). Suffix new names with the block number.
- One version number per block; the next is `…-v124`.
- Layout code that moves DOM nodes must be idempotent; move existing elements rather than recreating them.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- Before uploading: zero `pageerror` events at 1440×900 and 390×844 after clicking **Builder**, **and run `tools/builder-connector-check.js`**.

---

## Verified in Build 123

| Item (from the Build 122 handoff) | Result |
|---|---|
| 1. Connector geometry | ⚠️ design implemented (measured boxes, perpendicular 22px stubs, obstacle routing, labels on the drawn path, badge inside its label, 320px free-layout pitch). **Correct while dragging; wrong after re-render** (item 1 below) |
| Arrow runs along the target's side | ✅ gone in every scenario |
| Badge over its own label | ✅ gone; the badge sits at the label's right end |
| 2. Header status clipped at 1280 | ✅ `#builderSaveState` ellipsis, full text in `title`; header 44px; badge-to-Undo gap 149px |
| 3. Mobile pills over the next card | ⚠️ cards are no longer covered, but pills now cover the "Splunk-to-Splunk" label, and the canvas zooms out to unreadable text (item 4) |
| Load, resize, button sweep | ✅ 0 errors; 175 buttons |

### Connector check: Build 123 as uploaded vs with the item 1 fix
(`tools/builder-connector-check.js`, 1440×900; "after drop" results; ❌ = at least one connector fails)

| Scenario | Build 123 as uploaded | With the item 1 fix |
|---|---|---|
| 1 Default horizontal | ❌ all 3 start 15px inside the source | ✅ all OK |
| 2 ＋ Add HEC client (UF selected) | ❌ all 3 start 15px inside | ✅ all OK |
| 3 Syslog Server dragged down-right | ❌ starts/ends inside | ⚠️ one arrow tip 3–5px inside the border (item 5) |
| 4 Syslog Server below Syslog Source | ❌ | ✅ all OK |
| 5 Syslog Server dropped onto Syslog Source | ❌ | ❌ cards overlap (item 3) |
| 6 Syslog Server up-right, close to UF | ❌ | ❌ route passes through UF (item 2) |
| 7 UF into Syslog Server's column | ❌ | ✅ all OK |
| 8 Indexer below-left of UF | ❌ | ⚠️ start tip 3–5px inside (item 5) |

While dragging (before drop), scenarios 3, 4, 7 and 8 are already all OK in Build 123 as uploaded.

---

## 1. Connectors are routed before the cards exist (priority; two-line fix)

**Symptom:** after page load, after dropping a dragged card, after switching layout, or after any `renderBuilder()`, every connector's start point sits **15px inside the source card**, and ends can miss taller cards' centres. The connectors only correct themselves when something calls `updateFreeConnectorGeometry()` (which is why they look right while dragging and wrong after the drop).

**Cause:** `relationshipPath` → `builderCardBox(id, positions)` runs while the canvas markup is being rebuilt, **before the new cards are in the DOM**. The query `#builderTree [data-unified-node-wrap="…"] .builderNode` finds nothing, so it falls back to `{w:175, h:160}`. In Build 123 the cards render **190px** wide (and 159–174px tall), so right-side anchors land 15px inside the card. (Verified by wrapping `builderCardBox` during `renderBuilder()`: every call reported `domPresent:false, w:175`.)

**Fix (tested):** in `<script id="builder-connector-geometry-v123">`:
```js
// 1. Re-route once the cards exist (updateFreeConnectorGeometry already calls builderV123PlaceLabels):
renderBuilder=function(...args){const result=builderV123RenderBefore123(...args);updateFreeConnectorGeometry();return result};
//    (was: ...;builderV123PlaceLabels();return result})

// 2. Make the fallback match the real card width:
return{x:position?.x??0,y:position?.y??0,w:190,h:160}}
//    (was: w:175)
```
Better still, don't hard-code the fallback: read `getComputedStyle` of an existing `.unifiedNodeWrap`, or cache the last measured size per node id.

**Check:** `tools/builder-connector-check.js` scenarios 1, 2, 4 and 7 report `OK` for every connector after drop, with 0 errors. Tested: they do with this change.

## 2. Close, offset cards get top/bottom anchors, and the route goes through the target
**Symptom (scenario 6):** with Syslog Server dragged up and to the right so it ends about 12px to the left of Universal Forwarder and slightly higher, the Syslog Server → UF connector leaves Syslog Server's bottom, runs **up through UF** (168px inside it) and arrives at UF's **top** edge pointing ↓. A second arrowhead appears at UF's bottom.

**Cause:** `builderV123AnchorSides` only uses right→left when the horizontal gap is **≥ 24px**; otherwise it falls back to bottom→top by centre order. When the cards overlap vertically, a top anchor on the target is only reachable by going around it, and `builderV123RouteBetween` picks the lowest-scoring candidate even when every candidate hits a card.

**Fix:** choose sides by trying all sensible pairs, not by a fixed threshold. For each of (right→left, left→right, bottom→top, top→bottom), compute stubs and the best route, score it (card hits × 1e6 + length), and keep the cheapest. At minimum, use left/right when the horizontal gap is > 0 and the cards overlap vertically, and top/bottom when the vertical gap is > 0 and they overlap horizontally. Also, **never route through the source or target card beyond its stub**: add both cards (padded) to the obstacles, excluding only the stub segment.

**Check:** scenario 6 reports `OK` for Syslog Server → UF after drop and while dragging; exactly one arrowhead per connector.

## 3. Cards can be dropped on top of each other
**Symptom (scenario 5):** dragging Syslog Server onto Syslog Source leaves the two cards overlapping, and connectors between or through them can't be drawn sensibly: "passes through own node (240px)", and a label over a card.

**Fix:** on drop in free layout, if the dropped card's box overlaps another card's (padded by 16px), nudge it to the nearest free spot (try right, below, left, above in 20px steps; snap to the grid if snapping is on). Show a toast such as "Moved to avoid overlapping Syslog Source 1". Keep Undo working (one history entry for the drop plus the nudge).

**Check:** after scenario 5's drag, no two `.builderNode` boxes intersect, and every connector reports `OK`.

## 4. Mobile: pills over labels, and text too small
**Symptom (390×844, vertical layout):** the v123 spacing (`Math.max(225, card.h + handleHeight + 100)` per row) keeps pills off the next card, but:
- the selected card's pills (Event data, Fleet management, Interactive authentication) now overlap the **"Splunk-to-Splunk" route label** in the gap below; and
- the extra height makes Fit zoom the topology out until card text is only a few pixels tall.

**Fix:** reserve the pills' height **only under the selected card** (the other cards' pills are hidden), and put the route label beside the connector (to the right of the vertical line) instead of on it in vertical layout. Keep the normal row gap (about 60–80px) for unselected cards. On mobile, give Fit a minimum zoom of about 0.7; pan instead of shrinking further.

**Check:** at 390×844 with UF selected, no pill intersects a route label or card; unselected rows use the normal gap; zoom after Fit ≥ 0.7; card names are readable.

## 5. Arrow tips poke 3–5px into the card border
**Symptom:** in scenarios 3 and 8, a connector's start or end sits 3–5px inside the card border (the arrow tip overlaps the border).
**Fix:** end the path about 2px outside the border (the marker's `refX` is 9 of 10, so its tip extends past the path end), and start 1px outside the source border.
**Check:** the connector check's `start.gap`/`end.gap` is 0–4px and never `inside`.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. **`node tools/builder-connector-check.js index.html shots/`**: every connector in every scenario reports `OK`, both while dragging and after drop. (Scenario 5 needs item 3 first.)
3. Button sweep: for each `#topologyBuilder button`, on a fresh page, reveal its context, click it, and assert no errors plus a visible effect.
4. Layout numbers: canvas top ≤ 370 (1440×900) and ≤ 700 (390×844); header 44px with a status message; no horizontal scroll.
5. Add a `changeRegister` entry for each new block.

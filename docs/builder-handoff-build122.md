# Builder handoff: Build 122 review

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `f716f72` (Build 122, 28 Sep 2026), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build121.md`, `builder-handoff-build120.md`, `builder-layout-handoff.md` (what blocks v112–v118 do). This file replaces them as the task list.

## TL;DR

Build 122 is healthy: **0 errors** on load, across resizes and across all 175 Builder buttons, and every Build 121 handoff item is done. **One significant problem remains: connectors (lines, arrows, labels) are drawn wrongly as soon as a component is moved out of the default row.** That is item 1 and the priority. Items 2–3 are small.

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v122`).
- **Never redeclare a top-level `const`, `let` or `function` name.** All classic `<script>` blocks share one global scope, so a duplicate makes the browser skip the whole script. Search the file for each new name first, and suffix new names with the block number (as v122 does, for example `builderFinalToast122`).
- One version number per block; the next block is `…-v123`.
- Layout code that moves DOM nodes must be idempotent; move existing elements rather than recreating them.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- Before uploading: load in Chromium at 1440×900 and 390×844, click **Builder**, and confirm **zero `pageerror` events**.

---

## Verified fixed in Build 122 (Build 121 handoff items)

| Item | Result |
|---|---|
| 1. Header grows with a status message | ✅ messages show in `.builderCanvasStatusToast` (dismissible, 6s); `.builderHead` stays 44px at 1280 and 1440 |
| 2. Unconnected add shrinks the canvas | ✅ loose node goes in an "Unconnected · drag to connect" lane; zoom stays ≥ 0.85; new node visible, selected and highlighted (`builderJustAdded`) |
| 3. Palette search cramped | ✅ input 270px (placeholder needs 197px); count below it; checkbox 5px from its label |
| 4. 1280 + Inspector crowding | ✅ hint strip and minimap hidden while a panel is open at 1121–1399px; nothing half-covered |
| 5. Mobile labels on node borders | ⚠️ mostly: "TCP/TLS or UDP" and "File handoff" are clear; "Splunk-to-Splunk" is still covered (see item 3) |
| Regression checks | ✅ canvas top 302 (desktop) / 579 (mobile); Focus mode has no duplicate controls; zoom stays clickable with panels open; build stamp 122 everywhere |

---

## 1. Connectors break when components are moved (priority)

### What the user sees
In free layout (and any layout where a target isn't directly to the right of its source), after dragging a component:
- **The arrowhead runs along the side of the target instead of pointing into it.** The line reaches the target's left side travelling vertically, so the arrow points ↓ or ↑ and the line runs 32–104px down the card's border. This is what the user reported from their phone.
- **Lines start inside their source card** (18–32px in) and can run **through the source card** (up to 280px when the target is to the left).
- **Lines cross unrelated cards**, for example Syslog Server → Universal Forwarder passing through Syslog Source.
- **Labels sit 25–44px away from their line**, or on top of a card.
- **Review badges sit on their label**, and a card's own review badge can cover a nearby edge label.
- Even without dragging, free layout keeps the old 270px column pitch, so labels such as "Splunk-to-Splunk" sit under the next card (the v112 wider pitch only applies to horizontal layout).

The line shape is the same during and after the drag, so the bug is in the route calculation, not the drag handling.

### Measured results (Build 122, 1440×900, default topology)

| Scenario | Result |
|---|---|
| 1. Default horizontal layout | ✅ all 3 connectors OK |
| 2. ＋ Add HEC client with UF selected (the user's original screenshot) | ✅ OK since v122's unconnected lane |
| 3. Free layout: Syslog Server dragged down-right | ❌ arrow ↓ at left side, runs 72px along the border; label 44px off the line; next edge starts at the top, ends inside UF, passes through its own card |
| 4. Syslog Server dragged directly below Syslog Source | ❌ starts 18px inside the source; next edge's arrow ↑ at UF's left side, runs 104px along the border |
| 5. Syslog Server dragged left of Syslog Source (reversed) | ❌ leaves the bottom going ←, runs 280px through its own card, arrow ↑ into the top; next edge crosses Syslog Source |
| 6. Syslog Server dragged up-right | ❌ arrows run along borders; an edge leaves the right side going ←; badge over label |
| 7. UF dragged into Syslog Server's column | ❌ starts inside the source; arrow ↑ at Indexer's left side, runs 104px |
| 8. Indexer dragged below-left of UF | ❌ starts 32px inside UF, passes through it; label over a card; badge over label |

### Causes (in `<script id="builder-relationship-routing-controls">`)
1. **`edgeAnchors(from,to)` assumes every card is 190×142** (`const fw=190,fh=142`). Rendered `.builderNode` boxes are **175px wide** (a later `.unifiedNodeWrap{width:175px}` rule) and **about 140–180px tall**. So right-side anchors float 15px outside the card, and bottom anchors (`y+142`) land inside taller cards. That's why lines start inside the source.
2. **The chosen route ignores which side the anchor is on.** `edgeAnchors` picks left/right/top/bottom from the centre-to-centre direction, then `automaticOrthogonalPoints` scores 8 candidate polylines and takes the cheapest. The winner is often `[a, {x:b.x,y:a.y}, b]` (across, then down), whose **last segment is vertical into a left-side anchor**, so `marker-end` (`orient="auto"`) draws the arrow along the border. The same thing happens at the start.
3. **The obstacle boxes are fixed (226×178 around each position) and exclude the source and target**, so a route can pass straight through its own cards.
4. **`smoothRoutePath` turns the polyline into quadratic curves using the corners as control points**, so the drawn curve cuts corners. But **the label is placed at `routeMidpoint(points)`, the midpoint of the straight polyline**, not of the drawn curve, so labels land 25–44px off the line.
5. **Review badges are positioned separately from labels**, so they can land on the label. (v112's `translateY(-23px)` on `.builderEdgeIssueMarker` only helped when the badge sat exactly at the label centre.)
6. `updateFreeConnectorGeometry()` (used during free drags) still calls the old `unifiedConnectorPath` with the same 190/71 assumptions; after drop `relationshipPath` is used. Make both use the new geometry.

### Fix (implement as `builder-connector-geometry-v123`)
1. **Measure card boxes.** Add a helper `builderCardBox(id)` that returns the rendered `.builderNode` rectangle for a node in **world coordinates**: `(rect - worldRect) / zoom`. Fall back to `{x, y, w:175, h:160}` from the layout position when the card isn't rendered yet. Use it in `edgeAnchors`, in obstacle scoring and in `updateFreeConnectorGeometry`.
2. **Pick anchor sides from the gap between boxes, not their centres.** If the target's box starts to the right of the source's right edge (plus about 24px), use source-right → target-left. If it ends to the left, use source-left → target-right. Otherwise use top/bottom by vertical order. Anchor at the **middle of that side of the measured box**.
3. **Add perpendicular stubs of about 22px** at both ends: `a' = a + 22·outward(sideA)` and `b' = b + 22·outward(sideB)`. Route between `a'` and `b'`, and emit `[a, a', …route…, b', b]`. The first and last segments are then always perpendicular to the card side, so **the arrow always points into the card** and never runs along a border.
4. **Obstacles:** use the measured boxes of **all** cards, padded by 12px. For the source and target, exclude only the stub segments, not the whole card. Keep the existing candidate set, but build it from `a'`/`b'`, and reject any candidate that intersects a padded card (fall back to the lowest score if all intersect).
5. **Keep the curves, but put labels on the drawn path.** After the `<path>` is in the DOM, set each label's position from `path.getPointAtLength(path.getTotalLength()/2)` (plus the user's `labelOffset`). Do the same after every re-render and during drag. Alternatively, draw straight segments with small rounded corners (a radius of about 10px), so the polyline midpoint is on the line.
6. **Attach the review badge to its label.** Render `.builderEdgeIssueMarker` inside the label's `<g>`, at the label's right end (for example `translate(labelWidth + 6, 11)`), and remove the v112 `translateY(-23px)` rule for markers that are now inside labels. The badge can then never overlap its own label.
7. **Avoid labels on cards.** If the midpoint label's box intersects a card, slide it along the path (try t = 0.4, 0.6, 0.3, 0.7) until it's clear.
8. **Free-layout spacing:** when converting to free layout (`ensureFreePositions` / `automaticPositionsForFree`), use the same 320px column pitch that v112 applies to horizontal layout, so labels fit between columns.
9. Keep user routing overrides working: manual `waypoints` go between the stubs, and style `straight`/`orthogonal`/`curved` still apply.

### Acceptance check (automated; run for every scenario above plus scenario 2)
Switch to free layout (set `#unifiedLayoutMode` to `free` and dispatch `change`, since it now lives in the Navigate menu). Fit, then drag the card with real mouse events by the offsets in the table. For every visible `path.unifiedConnector`, in world coordinates:
- the **end point** is within 4px of the target card's border, not inside it, and the last 6px of the path point **into** the card (→ for the left side, ← right, ↓ top, ↑ bottom);
- the **start point** is within 4px of the source card's border, not inside it, and the first 6px point **away** from it;
- the path runs **≤ 12px along** the target's border, and **no point** (excluding the 4px at each end) lies inside the source or target card;
- the path doesn't enter **any other card**;
- the label's centre is **≤ 12px** from the path, and its box doesn't intersect any card;
- no `.builderEdgeIssueMarker` circle intersects any edge label;
- all of the above hold **while dragging and after drop**, and there are 0 `pageerror` events.

Scenarios: (3) Syslog Server +140,+260; (4) Syslog Server −270,+230; (5) Syslog Server −560,+40; (6) Syslog Server +120,−60; (7) UF −200,+210; (8) Indexer −300,+240, where the offsets are in world px (the screen offset is × zoom). Also re-check scenarios 1 and 2, and vertical layout at 390×844.

---

## 2. At 1280, the header status text is clipped without an ellipsis
**Now:** at 1280×800 the header's saved-state text ("Unsaved changes · Recovery draft on this device") is cut off at the right edge of the page ("…on this devi"), with no "…". The build badge also touches the Undo button (no gap).
**Fix:** give the header status `min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`, with the full text in `title`, or shorten it to "Unsaved · draft saved on this device". Add a gap of at least 8px between `.builderBuildStamp` and the history controls.
**Check:** at 1280×800 with unsaved changes, the status ends in "…" (or fits) inside the viewport, and the badge and Undo don't touch.

## 3. Mobile: the selected card's plane pills cover the next card
**Now:** at 390×844 (vertical layout), the selected card's pills (Event data, Fleet management, Interactive authentication) spill into the 34px gap below it and cover the "Splunk-to-Splunk" label and the top of the next card.
**Fix:** in vertical layout, either place the pills beside the card (to the right) or reserve their height in the layout for the selected card only (push the following rows down by the pills' height while it's selected). Alternatively, show them in a small popover anchored to the card.
**Check:** at 390×844 with Universal Forwarder selected, no route label and no card overlaps any pill.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. Button sweep: for each `#topologyBuilder button`, on a fresh page, reveal its context, click it, and assert no errors plus a visible effect (175 buttons in Build 122; the connection handles need a hover or focus first).
3. **Connector check from item 1**, for all 8 scenarios.
4. Layout numbers: canvas top ≤ 370 (1440×900) and ≤ 700 (390×844); palette and Inspector inside the canvas; no horizontal scroll; header height constant with a status message.
5. Add a `changeRegister` entry for each new block.

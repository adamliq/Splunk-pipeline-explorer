# Handoff: clicking a link's label or issue badge

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 211.
**Five in-place edits, and no new blocks:**
- four in one line, `wireRelationshipRoutingHandles()` in `<script id="builder-relationship-routing-controls">`, line 2577;
- one in a link issue badge's click, in `<script id="builder-context-focus-issues">`, line 3149.

Each old string occurs exactly once in Build 211. The edits are also in [`docs/mockups/link-label-clicks.diff`](mockups/link-label-clicks.diff), a unified diff against Build 211's `index.html`.

Make the edits, then add the build records (see "Build records").

**The number** is that of the "Still open" list in the Build 211 recheck ([`builder-handoff-build211.md`](builder-handoff-build211.md)): 34.

**Mockup (the target):** [`docs/mockups/link-label-clicks-mockup.html`](mockups/link-label-clicks-mockup.html). Four scenes have the edits applied to Build 211, and the two "Today" scenes are Build 211. The screenshots are `docs/mockups/compare/link-label-clicks-*.png`.

**Tested first:** the edits were applied to Build 211 and run. The results under "Check before uploading" come from that run.

## Why

### 34. Clicking a link's label, or its issue badge, does nothing

**What you see,** with a mouse, in the reference topology at 1,440 px:
- **A click on a link's label,** the pill with its protocol such as "Splunk-to-Splunk", selects nothing, and the Inspector keeps showing what it showed: 0 of 8 labels. A click on the link's line selects it.
- **A click on a link's issue badge** opens nothing: 0 of 11 badges, at 100 % and zoomed out to fit. A card's badge opens the card's findings.
- **A click whose pointer moves 1 or 2 px** moves the label and records "Move connector label" in the undo history.
- **On a touch screen,** tapping a label works.

**The cause:**
- **`wireRelationshipRoutingHandles()`** (line 2577) gives each route label two handlers:
  - a click selects its link, with `selectBuilderEdge`;
  - a press starts a label drag, as labels can be moved by hand. It captures the pointer, and its release records the move, if anything changed, and then **always redraws the canvas** (`renderBuilder()`), even when the label didn't move.
- **The redraw replaces every label.** The click that follows the release goes to the label that was pressed, which is no longer on the page, so the label's click handler never runs. After a tap, the browser sends the click to whatever is under the finger, the new label, which is why touch works.
- **Badges:** Build 156's label placement puts each link's issue badge inside its label (`builder-canvas-review-v156`, line 7899), so a press on a badge starts the same drag, and the badge's own click (line 3149) never runs. That click sets the selection without showing it: once it does run, the Inspector is left empty until the next redraw.
- **Additional data links:** the label's click turns a data link's id into a number. An additional data link's id is text, such as "data-rel-1", so a click that did arrive would select nothing. A click on a line goes through the canvas's own handler (`builder-incremental-selection-cache`, line 3285), which reads the id with `contextFromTarget` (line 3143) and selects with `selectBuilderObjectFast` (line 3283).
- **Any movement makes a drag:** the first pointer move after the press moves the label.

## The design

- **A click on a link's label selects the link,** as a click on its line does: the Inspector shows the link, opening over the canvas below 1,280 px, and the canvas draws the link as selected. Additional data links too.
- **A click on a link's issue badge selects the link and opens its findings** beside the badge: the link's review findings and "Open Review drawer", as a card's badge has. The Inspector shows the link. Below 1,280 px the Inspector isn't opened over the canvas, as it would cover the findings; opening it shows the link.
- **A press on a label becomes a drag once the pointer has moved 3 px.** Less is a click: the label stays where it is, and nothing goes into the undo history.
- **Unchanged:** a drag once it has started (see "Found while testing"), a click on a link's line, Enter on a focused badge, a card's badge, and touch.

## The edits

In Build 211's `index.html`. Each old string occurs exactly once.

Edits 1 to 4 are in `wireRelationshipRoutingHandles()` (`<script id="builder-relationship-routing-controls">`, line 2577).

**1. A label's click selects its link as a click on its line does.**
```
old: label.onclick=event=>{event.stopPropagation();selectBuilderEdge(label.dataset.routePlane,label.dataset.routePlane==='data'?Number(label.dataset.routeEdge):label.dataset.routeEdge)};
new: label.onclick=event=>{event.stopPropagation();const plane=label.dataset.routePlane,id=label.dataset.routeEdge;selectBuilderObjectFast({kind:'edge',plane,id:plane==='data'&&!id.startsWith('data-rel-')?Number(id):id})};
```
The id is read as `contextFromTarget` reads a line's. `selectBuilderObjectFast` is what a click on a line calls, with the wrapper that opens the Inspector over the canvas below 1,280 px (`builder-canvas-drawers-v95`, line 3345).

**2. A press on a badge is the badge's.**
```
old: label.onpointerdown=event=>{if(event.button!==0)return;
new: label.onpointerdown=event=>{if(event.button!==0||event.target.closest?.('.builderEdgeIssueMarker'))return;
```

**3. The drag starts once the pointer has moved 3 px,** measured on the screen, at any zoom.
```
old: before=builderHistorySnapshot(),pointer=event.pointerId;label.setPointerCapture(pointer);const move=moveEvent=>{if(moveEvent.pointerId!==pointer)return;const point=svgPointerPosition(moveEvent,svg);routing.labelOffset=
new: before=builderHistorySnapshot(),pointer=event.pointerId,downX=event.clientX,downY=event.clientY;let dragging=false;label.setPointerCapture(pointer);const move=moveEvent=>{if(moveEvent.pointerId!==pointer)return;if(!dragging){if(Math.hypot(moveEvent.clientX-downX,moveEvent.clientY-downY)<3)return;dragging=true}const point=svgPointerPosition(moveEvent,svg);routing.labelOffset=
```

**4. A release without a drag leaves the canvas as it is,** so the label is still there when the click arrives.
```
old: label.removeEventListener('pointercancel',end);commitBuilderHistory(before,'Move connector label');renderBuilder()};
new: label.removeEventListener('pointercancel',end);if(!dragging)return;commitBuilderHistory(before,'Move connector label');renderBuilder()};
```

Edit 5 is in the function that draws issue badges (`<script id="builder-context-focus-issues">`, line 3149).

**5. A link badge's click selects the link, then opens its findings.**
```
old: const open=event=>{event.preventDefault();event.stopPropagation();const edge=edgeFromContext(context);if(edge){state.builderSelected=edge.target.id;state.builderSelectedEdge={plane,id:context.id}}showBuilderIssuePopover(context,group)};
new: const open=event=>{event.preventDefault();event.stopPropagation();(typeof selectObjectBeforeCanvasDrawer==='function'?selectObjectBeforeCanvasDrawer:selectBuilderObjectFast)(context);showBuilderIssuePopover(context,group)};
```
`selectObjectBeforeCanvasDrawer` (`builder-canvas-drawers-v95`, line 3345) is `selectBuilderObjectFast` without the step that opens the Inspector over the canvas: it selects, updates the Inspector and draws the selection without redrawing the canvas, so the badge is still there for the findings to open beside. It runs on Enter and Space on a focused badge too.

## Build records

After the edits:
- **`changeRegister`,** group "Explorer foundations":
  `['Clicking a link\'s label or issue badge','A click on a link\'s label selects the link and shows it in the Inspector, as a click on its line does, and a click on its issue badge selects the link and opens its findings. A press on a label becomes a drag only once the pointer has moved 3 px.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 211 did in `toolbar-lanes-labels-records-v211`, with Build 212.

## Found while testing (not changed)

1. **Dragging a label moves it by its first step only,** on Builds 209 to 211: a 60 px drag moves it 3 px. The drag keeps the link's routing record from the press, and `ensureRelationshipRouting` (`builder-relationship-routing-controls`, line 2561) puts a fresh copy in its place each time it's called, which the first move's route does; later moves change the old copy. The edits leave this as it is: a drag ends where Build 211's does.
2. **Dragging an additional data link's label moves nothing,** yet records "Move connector label" in the undo history, on Build 211 as with the edits. The press finds its link with the same numeric id that the click used (`builderEdgeRecord(plane, Number(id))`), and an additional link's id is text.
3. **A card's issue badge selects the card without showing it,** as on Build 211: the card's findings open, and the Inspector and the canvas show the card only at the next redraw. A link's badge now selects and shows its link (edit 5).

## Check before uploading

Run with Build 211 + the edits, and with Build 211 as shipped for comparison.

### 1. The fix: 15 checks, all pass

Build 211's figures are in brackets.

| Check | Result |
|---|---|
| Labels at 1,440 px, reference topology | 8 of 8 clicks select their link, show it in the Inspector and draw it as selected; nothing goes into the undo history (Build 211: 0 of 8) |
| Labels at 1,440 px, zones topology | 9 of 9, the additional data link "data-rel-1" among them (Build 211: 0 of 9) |
| Labels at 1,024 px | 8 of 8, the Inspector opening over the canvas (Build 211: 0 of 8) |
| A 390 px phone | A tap on a label selects its link, as on Build 211 |
| Badges at 1,440 px | 11 of 11 select their link, show it in the Inspector and open its findings beside the badge, nothing covering them (Build 211: 0 of 11); in the zones topology, 14 of 14 (0 of 14) |
| Badges zoomed out to fit | 11 of 11 (Build 211: 0 of 11) |
| Badges at 1,024 px | 11 of 11 select their link and open its findings, uncovered, with the Inspector left closed; opening it shows the link (Build 211: 0 of 11) |
| Enter on a focused badge | Opens the findings, as on Build 211 |
| A click whose pointer moves 2 px | Selects the link; the label stays where it was, and nothing goes into the undo history (Build 211: the label moves 2 px, one undo step, nothing selected) |
| A press that moves 4 px | A drag: the label moves, "Move connector label" goes into the undo history, and Undo puts the label back |
| A 60 px drag | Ends where Build 211's does (see "Found while testing") |
| A click on a link's line | Selects it, as on Build 211 |
| A card's issue badge | Opens the card's findings, as on Build 211 |
| Page errors | None |

### 2. Regression

Against Build 211:

| Suite | Result |
|---|---|
| The toolbar, lanes and labels checks (Build 211's handoff, against Build 210) | 42 of 42 |
| The room-and-header checks (against Build 209) | 40 of 40 |
| The quick fixes | 27 of 27 |
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 55 of 58, as on Build 211: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58 |
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Menu bar actions | 69 of 69 |
| Parsing laboratory | 68 of 68 ("Click to next frame" 232 ms, limit 1,000) |
| Canvas card views | 123, unchanged |
| The space tool | The same output as Build 211 |
| The connector tool | The same output as Build 211 |
| Page errors | None |

Apart from the timing, every suite prints what it printed for Build 211, line for line.

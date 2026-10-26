# Handoff: Collapsed containers, and redraws right from their first frame (faults 42 to 46)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 215.
**Seven in-place edits,** in four blocks, under "The edits". Each old string occurs exactly once in Build 215, and no edit changes the number of lines.
**Two new blocks, at the end of the page (before `</body>`):**
- `<style id="collapsed-box-v216">`, containing [`docs/mockups/collapsed-and-redraw-prototype.css`](mockups/collapsed-and-redraw-prototype.css);
- then `<script id="redraw-text-v216">`, containing [`docs/mockups/collapsed-and-redraw-prototype.js`](mockups/collapsed-and-redraw-prototype.js).

The edits and the blocks are also in [`docs/mockups/collapsed-and-redraw.diff`](mockups/collapsed-and-redraw.diff), a unified diff against Build 215's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

Make the edits, paste the two files as they are, then add the build records (see "Build records").

**The faults** are numbered as in the Build 215 recheck ([`builder-handoff-build215.md`](builder-handoff-build215.md)): 42 to 46.

**Mockup (the target):** [`docs/mockups/collapsed-and-redraw-mockup.html`](mockups/collapsed-and-redraw-mockup.html). Three scenes have the edits and the blocks applied to Build 215, and the three "Today" scenes are Build 215. The screenshots are `docs/mockups/compare/collapsed-and-redraw-*.png`.

**Tested first:** the edits and the blocks were applied to Build 215 and run. The results under "Check before uploading" come from that run.

## The faults

### 42. Two collapsed containers export as one card

**What you see,** in Export SVG and PNG of the current navigation view or the collapsed view, with two or more containers collapsed:
- **Their collapsed cards are drawn in one place,** one over the other. In the zones topology (`docs/mockups/sv-zones-topology.json`), with the Syslog Servers and the Universal Forwarders in two collapsed containers, both are drawn at (746, 166), on the diagram (the Build 215 recheck's (704, 58) is the same place, in the topology's group). Forwarders covers Syslog collection, and the Aggregate link from one to the other loops over the card, both its ends on it.
- **Grouped by tier, the export throws** "Maximum call stack size exceeded" instead.
- **Grouped by type, with two or more types collapsed,** the export and the architecture pack throw the same. In the zones topology, that is with the Syslog Server and Universal Forwarder types collapsed.

**Why:** `withArchitectureExportScope` (`builder-navigation-aware-export`, line 2847) numbers each collapsed container's card `-100000-index`, in `aggregateIds.forEach((groupId,index)=>…)`.
- **Every number is NaN.** `aggregateIds` is a Set, and a Set's `forEach` passes each value twice, as its first and second arguments. So `index` is the container's id, a string such as `'group-1'`, and `-100000-'group-1'` is NaN.
- **One place for all.** Cards with one id get one place in the layout.
- **A card its own parent.** Forwarders is fed from the Syslog Servers, so its card takes Syslog collection's card as its parent (`mapEndpoint`): NaN. Grouped by tier or type, the export's layout goes through the first `unifiedBuilderPositions` (`builder-unified-multiplane-canvas`, line 2453), whose `depth` follows each card's parent with no guard against a loop. Looking NaN up finds the last card numbered NaN, Forwarders itself, so it follows it until the stack overflows.
- One collapsed container exports as before: its card is NaN too, but alone.

### 43. The "Expand" pill covers the container's type

**What you see:** on the canvas, the "Expand" pill in a collapsed container's box covers the end of the box's first line, "REGION · COLLAPSED", at any width. It is the same for an Environment container ("ENVIRONMENT · COLLAPSED") and on a phone.

**Why:** the pill is placed over the box's top right (`.collapsedGroupProxy em{position:absolute;right:8px;top:8px}`, `builder-large-topology-navigation-styles`, line 2722), and the first line runs the box's full width. At 11.5 px, the canvas's text size from the start since Build 215, the line reaches under the pill. On Build 214, it did once the polish had run.

### 44. Text outside the canvas is raised a frame after each redraw

**What you see:** the text a redraw adds is polished a frame later, in the next frame's animation callbacks.
- **Measured in between.** Until then, the toolbars', menus' and panels' new text is 7.8 to 9.9 px. Code that measures the Builder after a redraw's task finds those sizes: over 10 scenarios, 718 texts change size after it. The scenarios are the default, reference and zones topologies' layouts, a collapsed container, Group by, a selection, touch, a phone, and a card of every component type.
- **On screen, crossing 760 px wide.** A frame's animation callbacks run before it is painted, so a redraw from a click or a key is polished before its first frame, and the smaller text is not seen. But when the window crosses 760 px wide, Build 131 redraws inside an animation callback (`builder-grouping-polish-v131`, line 5476), and that redraw's polish waits for the next frame. Crossing 760 px and back, the two frames it redraws in are painted with 143 of their 2,144 texts at the smaller size.

**Why:** the text polish (`polishBuilderText`, in its current form Build 159's, `builder-phone-space-and-margin-v159`, line 8057) gives Builder text under its floor an inline size: 11.5 px on the canvas, 10 px elsewhere.
- Build 118 calls it from `requestAnimationFrame` after each redraw (`builder-ui-polish-v118`, line 4226). An animation callback asked for during another one runs in the next frame.
- Build 151's observer (`builder-review-fixes-v151`, line 7016) collects what a redraw adds for the polish, in a microtask once the redraw's task is done.
- Build 215 draws canvas text at its final size with CSS (fault 31). The rest of the Builder was left to the polish.

### 45. With Group by on, the canvas shifts after each redraw

**What you see,** in the zones topology at 1,440 × 900, grouped by tier, with the canvas 180 px down and 700 px tall:
- **After each redraw there are two Highlight rows** above the canvas, the old one and the new one.
- **The canvas is drawn 43 px lower,** 223 px down, and still 700 px tall, so it runs 43 px past the window. Then it shrinks to 657 px.
- **Turning Group by off leaves the old row,** and the canvas starts at 180 px instead of 137. Turning it on again shows two rows.
- **The same lag on opening:** the Builder opens with the default topology fitted to a 780 px canvas. From its fifth frame the canvas is 743 px tall, so the topology sits 18 px lower than Fit puts it.

**Why:**
- **The old row stays.** Build 130 makes a new Highlight row in each redraw (`builder-grouping-v130`, line 5318). Build 131 (`builderGroupingChrome131`, `builder-grouping-polish-v131`, line 5461) moves the new row above the canvas and removes the old one, but only where the old one is a direct child of `.builderWorkspace` (line 5469). Build 163 (`builderStrips163`, `builder-canvas-ux-v163`, line 8370) wraps the row in a `.builderChipWrap163`, so the old row is no longer a direct child and stays. Build 163 then wraps the first row it finds, the old one, and leaves the new one beside it.
- **The canvas's height lags its top.** The canvas is `calc(100dvh - var(--builder-canvas-top-v140) - 12px - var(--builder-gutter184))` tall (`builder-review-v184`, line 9796). Build 140 measures its top (`builderSpaceMeasure140`, `builder-canvas-space-v140`, line 6540) 30 ms after each redraw's frame. The redraw's `requestAnimationFrame` (line 6548) calls `builderSpaceAttach140`, which starts a 30 ms timer (`builderSpaceSchedule140`, line 6541).
  - Until the timer fires, the canvas is drawn at its new top with its old height.
  - Before the first measure, the top is taken as 100 px, so the opening fit sees a 780 px canvas.

### 46. On a phone, a collapsed container's link misses its card

**What you see,** on a phone, in the zones topology with the Syslog Servers' container collapsed: the link from Syslog Source 2 into the container starts 33.2 px below the card. The container's other links start and end 3 to 8 px off the cards and the box.
- It is routed twice, both times before the frame is painted: when the redraw draws it, 25.2 px below the card, and again, 7.9 px lower, when the resize observer first sees the container's box.
- The Build 215 recheck called this a link routed again "a frame after each redraw". The second routing runs in the first frame's rendering, before it is painted, so the link is seen 33.2 px below its card from the start.

**Why:** Build 214's block (`collapsed-links-v214`) routes a collapsed container's links as the redraw draws them. It routes them again whenever a container's box changes size, from a resize observer, which also fires when it first observes a box: in the redraw's first frame, after layout and before paint.
- **To route a link,** `endBox` (line 14856) finds the card at the link's end by its place in a layout worked out for the purpose (`layoutOnce`), and asks `builderCardBox` for the card's box. `obstacles` (line 14860) finds the cards the route goes round the same way.
- **During the redraw,** the card's box comes out 216.0 px tall, but the card is drawn 193.8 px tall.
- **After the redraw,** a layout worked out again puts Syslog Source 2 88.9 px higher than the redraw drew it. So `endBox` finds no card at the link's end, and takes a 190 × 224 px box there instead.

## The fix

- **Each collapsed card is numbered on its own** (the edit to line 2847): `[...aggregateIds].forEach(…)` passes each container's index, so the cards are numbered -100000, -100001 and so on.
  - Each collapsed card has its own place: Syslog collection at (746, 166) and Forwarders at (1066, 166), with the Aggregate link from one to the other.
  - Grouped by tier, every card is inside a lane, the two collapsed cards included. Grouped by type with types collapsed, the export draws, and the pack's 66 pages.
  - An export with one collapsed container is as on Build 215.
- **The "Expand" pill sits beside the first line** (the style block): the box is a grid of two columns, the first line in the first and the pill in the second, and the name and the counts span both.
  - "REGION · COLLAPSED" wraps to keep clear of the pill, which keeps its place, 10 px in from the box's top and right.
  - The box is 120 px tall from its first frame (Build 215: 103 px at 1,440 px; on a phone, 120 px already), and its links meet it where they are first routed.
- **The polish runs as soon as the redraw's task is done** (the script block): the block wraps `renderBuilder`, and after a redraw queues the polish as a microtask.
  - It queues it once, however many redraws the task makes. Build 151's observer has collected what they added by then, since its microtask is queued at their first change.
  - The polish polishes what is still on the page. That is done before any animation callback runs or any frame is painted.
  - No text changes size after the redraw's task (Build 215: 718 over the 10 scenarios). Crossing 760 px wide and back, no frame is painted with the smaller text (Build 215: 143 texts).
  - The polish does the same work as on Build 215: 9.4 ms a redraw on both, over 6 scenarios. Build 118's frame still calls it, and finds nothing new; text added outside a redraw is polished at the next redraw, as before.
- **The canvas keeps its place through redraws** (the edits to lines 5469 and 6548):
  - **One Highlight row.** Build 131 removes old Highlight rows wherever they are in the workspace, inside Build 163's wrap too. Build 163 then wraps the new row in a new wrap and removes the old one. With Group by off, the old wrap stays, empty and 0 px tall, until Group by is on again.
  - **The height follows the top in the same frame.** Build 140 measures the canvas's top in the redraw's own frame, as well as 30 ms later. Turning Group by on or off, the canvas's height follows its top in the first frame (Build 215: the fifth).
  - The Builder opens with the canvas measured, so the opening fit puts the topology where Fit does.
- **A collapsed container's links are routed from the cards as drawn** (the four edits to `collapsed-links-v214`):
  - `endBox` finds the card at a link's end by its wrap's place on the canvas, which is the place the link's end was worked out from, and takes the card's own size there.
  - `obstacles` takes the cards a route goes round from the canvas the same way.
  - On a phone, the link from Syslog Source 2 starts 3.2 px below the card when it is drawn, and stays there (Build 215: 25.2, then 33.2 px). None of the container's 5 links is routed elsewhere the second time.
  - At 1,440 px, in the horizontal, vertical and Free place layouts, none of the 15 collapsed links is routed elsewhere the second time, and each end is 3 px off its card's or the container's side.
  - On a phone, the routes go round the cards as drawn, and four of the container's links now run down the left of the column instead of its right.
- **Unchanged:** the polish's floors; Build 214's second routing when a container's box changes size; the settled Builder, once fitted; every export with no more than one collapsed container.

## The edits

In Build 215's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is.

**`<script id="builder-navigation-aware-export">`, `withArchitectureExportScope`:**

- **Line 2847.** Each collapsed card is numbered from a list's `forEach`, which passes the index; a Set's passes the value again.
```
old: aggregateIds.forEach((groupId,index)=>{
new: [...aggregateIds].forEach((groupId,index)=>{
```

**`<script id="builder-grouping-polish-v131">`, `builderGroupingChrome131`:**

- **Line 5469.** Old Highlight rows are removed wherever they are in the workspace, Build 163's wrap included.
```
old:   $$('.builderWorkspace>.builderGroupChips130').filter(element=>element!==chips).forEach(element=>element.remove());
new:   $$('.builderWorkspace .builderGroupChips130').filter(element=>element!==chips).forEach(element=>element.remove());
```

**`<script id="builder-canvas-space-v140">`, Build 140's `renderBuilder` wrapper:**

- **Line 6548.** The canvas's top is measured in the redraw's own frame. The 30 ms timer stays.
```
old: requestAnimationFrame(()=>{builderSpaceAttach140();builderSpaceFocusChrome140();builderSpaceAutoMap140()})
new: requestAnimationFrame(()=>{builderSpaceAttach140();builderSpaceFocusChrome140();builderSpaceMeasure140();builderSpaceAutoMap140()})
```

**`<script id="collapsed-links-v214">`:**

- **Lines 14851 and 14852,** the comment above `endBox`:
```
old: // A collapsed container's box is its proxy's; a card's is the canvas's, from builderCardBox. The proxy sits at its
new: // A collapsed container's box is its proxy's; a card's is the card as drawn, at its wrap's place. The proxy sits at its
```
```
old: // members' top-left place; a card is found by its place in the layout.
new: // members' top-left place; a card is found by that place (a layout worked out again can differ on a phone: fault 46).
```
- **Line 14856,** in `endBox`: the card at the link's end is found by its wrap's place, and measured as drawn.
```
old:  for(const [id,place] of layout.positions)if(Math.abs(place.x-point.x)<.5&&Math.abs(place.y-point.y)<.5)return builderCardBox(id,layout.positions);
new:  for(const wrap of world.querySelectorAll('.unifiedNodeWrap:not(.navHidden)')){const card=wrap.querySelector('.builderNode'),x=parseFloat(wrap.style.left),y=parseFloat(wrap.style.top);if(card?.offsetHeight&&Math.abs(x-point.x)<.5&&Math.abs(y-point.y)<.5)return {x,y,w:card.offsetWidth,h:card.offsetHeight}}
```
- **Line 14860,** in `obstacles`: the cards a route goes round are the cards as drawn.
```
old:  for(const node of state.builderNodes){const wrap=world.querySelector(`[data-unified-node-wrap="${node.id}"]`);if(!wrap||wrap.classList.contains('navHidden')||!layout.positions.has(node.id))continue;boxes.push(builderCardBox(node.id,layout.positions))}
new:  for(const wrap of world.querySelectorAll('.unifiedNodeWrap:not(.navHidden)')){const card=wrap.querySelector('.builderNode');if(card?.offsetHeight)boxes.push({x:parseFloat(wrap.style.left)||0,y:parseFloat(wrap.style.top)||0,w:card.offsetWidth,h:card.offsetHeight})}
```

`endBox` and `obstacles` keep their `layout` parameter, which the rest of the block passes; it is no longer read there.

## The new blocks

Before `</body>`, after `lanes-and-text-records-v215`, in this order:

1. **`<style id="collapsed-box-v216">`,** containing [`docs/mockups/collapsed-and-redraw-prototype.css`](mockups/collapsed-and-redraw-prototype.css): four rules under `#topologyBuilder #builderTree .collapsedGroupProxy`.
   - The box is two columns, `minmax(0,1fr) auto`, 6 px apart, its rows at the top.
   - The first line, `small`, is in the first column of the first row.
   - The pill, `em`, is in the second, no longer absolute; a margin of −3 px at its top and −4 px at its right keeps its place, 10 px in from the box's top and right.
   - The name, `strong`, and the counts, `span`, span both columns.
2. **`<script id="redraw-text-v216">`,** containing [`docs/mockups/collapsed-and-redraw-prototype.js`](mockups/collapsed-and-redraw-prototype.js).
   - It wraps `renderBuilder`. After a redraw, it queues `polishBuilderText()` as a microtask, unless one is queued already, so a task's redraws are polished once, when the task is done.
   - It leaves the polish and Build 151's observer as they are: the observer collects a redraw's additions in a microtask queued at the redraw's first change, so before this one.

## Build records

After the edits and the blocks:
- **`changeRegister`,** group "Explorer foundations":
  `['Collapsed containers in exports; redraws right from their first frame','Export SVG and PNG draw each collapsed container\'s card in its own place, and no longer fail with types collapsed. A collapsed container\'s "Expand" pill no longer covers its type. Builder text is at its final size as soon as a redraw\'s task is done. With Group by on, a redraw keeps one Highlight row, and the canvas its place and height. On a phone, a collapsed container\'s links start and end at their cards.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 215 did in `lanes-and-text-records-v215`, with Build 216.

## Found while testing (not changed)

1. **On a phone, a layout worked out again just after a redraw puts the cards elsewhere than the redraw drew them.** In the zones topology with the Syslog Servers' container collapsed, it puts Syslog Source 2 88.9 px higher. Not looked into. The collapsed links no longer depend on it, but anything else that reads cards' places from a fresh layout after a redraw on a phone gets these.
2. **On a phone, the collapsed links that end at a card's top end 8 px above it,** on Build 215 too. At 1,440 px they end 3 px off. The phone canvas's own links end anywhere from 0 to 53 px off a card, so this was left.
3. **"A frame after a redraw" was not a frame seen on screen.** The lanes-and-text handoff's fault 31, and the Build 215 recheck's faults 44 and 46, described text raised, and links routed again, "a frame after" each redraw.
   - A frame's animation callbacks and resize observers run before that frame is painted. So after a redraw from a click or a key, the polish and the second routing were both done before anything was painted.
   - What saw the first sizes and routes was code that measures in between: Build 214's first routing of a collapsed container's links, for one.
   - Smaller text reached the screen only from a redraw that itself runs in an animation callback: crossing 760 px wide (fault 44 above).
   - Correction notes are added to both documents.

## Check before uploading

Run with Build 215 + the edits + the blocks, and with Build 215 as shipped for comparison. The exports' cards are read from the exported SVGs, placed by adding up every group's translation.

### 1. The fixes: 16 checks, all pass

Build 215's figures are in brackets.

| Check | Result |
|---|---|
| Two collapsed containers | Export SVG of the current navigation view, with the zones topology's Syslog Servers and Universal Forwarders in two collapsed containers: the collapsed cards at (746, 166) and (1066, 166) (both at (746, 166)), and 10 links, as on Build 215. Grouped by tier, every card is inside a lane, the two collapsed cards included (throws "Maximum call stack size exceeded") |
| Collapsed types | Grouped by type with the Syslog Server and Universal Forwarder types collapsed: Export SVG of the current navigation view draws, the collapsed cards at (106, 443) and (106, 173), and the architecture pack makes its 66 pages (both throw "Maximum call stack size exceeded") |
| One collapsed container | Export SVG of the current navigation view is Build 215's, the generated times set aside |
| The "Expand" pill | Covers none of the box's text at 1,440 px, for an Environment container, or on a phone (covers the first line in all three) |
| The pill's place and the box | 10 px in from the box's top and right, as on Build 215. The box is 120 px tall (103 px at 1,440 px; on a phone, 120 px) |
| Text after a redraw's task | Over the 10 scenarios, no text changes size after the redraw's task (718, all outside the canvas, raised in the next frame's animation callbacks) |
| Crossing 760 px | Crossing 760 px wide and back, the Builder redraws 4 times in animation callbacks, in 2 frames. None of the 2,144 texts those frames are painted with is at another size than its final one (143) |
| The settled Builder | With no container collapsed and no Group by, fitted again: every element's text size, box and route is Build 215's, in 6 of 6 scenarios. What a closed menu holds is not drawn, so it is left out: on Build 215, whether Chrome gives it boxes varies from run to run |
| The view it opens with | Build 215's in 5 of 6 scenarios. The default topology opens where Fit puts it (18 px lower) |
| Group by and redraws | Grouped by tier, through three redraws: one Highlight row, and the canvas 180 px down and 700 px tall in every frame (two rows from the first redraw, and the canvas 223 px down, 700 px tall, then 657 px) |
| Group by off | No Highlight row, and the canvas back at 137 px (the old row, and the canvas at 180 px) |
| The canvas's height | Follows its top in the first frame, turning Group by on and off (in the fifth, the canvas running 43 px past its place until then) |
| A phone's collapsed links | With the Syslog Servers' container collapsed, none of its 5 links is routed elsewhere the second time (1, by 7.9 px). The link from Syslog Source 2 starts 3.2 px from its card (33.2 px) |
| At 1,440 px | In the horizontal, vertical and Free place layouts, none of the 15 collapsed links is routed elsewhere the second time, and every end is 3 px off its card's or the container's side |
| Page errors | None |

What the fixes add to a redraw, timed over 6 scenarios: the polish takes 9.4 ms a redraw on both builds; Build 140's measure in the redraw's frame adds 1.3 ms.

### 2. Regression

Against Build 215:

| Suite | Result |
|---|---|
| The lanes-and-text checks (against Build 214) | 19 of 21. The other 2 find what these fixes change. A5 expects Export SVG of the navigation view with types collapsed to throw, as on Build 214 (fault 42). B8 finds 9 elements changed in each of its two collapsed-container scenarios: the box, its three lines and its five links (faults 43 and 46). Of the passing checks, B5 now finds the box 120 px tall (103), and B6 finds no phone link routed again (1). B3's count of text the polish raises is unchanged, 9,905 |
| The export-as-drawn checks (against Build 213) | 29 of 29 |
| The line jumps checks (against Build 212) | 18 of 22, as on Build 215: the other 4 compare Export SVG with Build 212's |
| The link label clicks checks (against Build 211) | 15 of 15 |
| The toolbar, lanes and labels checks (against Build 210) | 42 of 42 |
| The room-and-header checks (against Build 209) | 40 of 40. One check clicks a container's name centred in the canvas, which with Group by on is now 22 px higher on screen: the canvas is 180 px down and 700 px tall, not 223 and 657 (fault 45) |
| The quick fixes | 27 of 27 |
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 55 of 58, as on Build 215: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58 |
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Menu bar actions | 69 of 69 |
| Parsing laboratory | 68 of 68 ("Click to next frame" 227 ms, limit 1,000) |
| Canvas card views | 123, unchanged |
| The space tool | The same output as Build 215 |
| The connector tool | The same output as Build 215 |
| Page errors | None |

Apart from the timing and the lines above, every suite prints what it printed for Build 215, line for line.

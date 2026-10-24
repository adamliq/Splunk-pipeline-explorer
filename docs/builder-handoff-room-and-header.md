# Handoff: room on the canvas, and a Matrix header that follows the page

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 209.
**Two new blocks, at the end of the page (before `</body>`), in this order:**
- `<style id="room-and-header-v210-styles">`, containing [`docs/mockups/room-and-header-prototype.css`](mockups/room-and-header-prototype.css);
- `<script id="room-and-header-v210">`, containing [`docs/mockups/room-and-header-prototype.js`](mockups/room-and-header-prototype.js).

**Four in-place edits,** listed under "The edits". Each old string occurs exactly once in Build 209. They are also in [`docs/mockups/room-and-header.diff`](mockups/room-and-header.diff), a unified diff against Build 209's `index.html`.

Paste the files as they are, make the four edits, then add the build records (see "Build records").

**The numbers** are those of the "Still open" list in the Build 209 recheck ([`builder-handoff-build209.md`](builder-handoff-build209.md)): 11, 12 and 13.

**Mockup (the target):** [`docs/mockups/room-and-header-mockup.html`](mockups/room-and-header-mockup.html). Seven scenes have the fixes applied to Build 209, and the seven "Today" scenes are Build 209. The screenshots are `docs/mockups/compare/room-and-header-*.png`.

**Tested first:** the blocks and the edits were applied to Build 209 and run. The results under "Check before uploading" come from that run.

## Why

### 11. Free place stacks cards 6 px apart

**What you see,** in the reference topology at 1,440 px, after Layout › Free place:
- **Cards stacked in a column are 6 px apart:** all 12 such pairs, and all 14 in the zones topology.
- **Point at one of them.** Its Event data handle row shows below it and covers the top 24 px of the card below.
- **Drop a card 20 px under another:** it stays there.
- **Add the next component from a card's handle twice:** the second card goes 24 px under the first.
- **On a phone, cards overlap:** by up to 65 px in the reference topology, and 92 in the zones topology.
- **On a touch screen,** a phone or a tablet, a card's handle rows always show below it, and lie over or under the next card.

**The cause:**
- **Free place's starting positions** come from `automaticPositionsForFree()` (`builder-free-place-layout`, line 2503). It uses `unifiedBuilderPositionsBeforeFree`, the layout as it was before Builds 123 and 163 changed it:
  - **above 760 px,** the horizontal layout of `builder-horizontal-column-spacing` (line 2481). Its rows are 230 px apart (`rowPitch=230`), which leaves 6 px between cards 224 px tall. Build 123 (`builder-connector-geometry-v123`, line 4417) spaces its columns 320 px apart and leaves the rows;
  - **at 760 px and below,** the vertical layout of `builder-responsive-unified-layout` (line 2474): one column, a card every 188 px. A phone's cards are as tall as their content, 142 to 280 px in the topologies tested.
- **The layouts themselves have more room.** Above 760 px, Build 163's horizontal and vertical layouts (`builder-canvas-ux-v163`, line 8347) keep 24 px between rows. On a phone the vertical layout keeps 90 to 112 px. Free place starts from neither.
- **The handle rows** (`.builderConnectionHandles`) hang from a card's bottom edge:
  - **with a mouse,** they show only with the pointer on the card, positioned over whatever is below. The Event data row reaches 30 px below the card; with Fleet and Access rows, up to 108;
  - **on a touch screen** (`@media (pointer:coarse)`, line 4179), they always show, in the card's own flow, 31 to 109 px deep.
- **A drop:** `builderV124ClearDrop124` (`builder-connector-followup-v124`, line 4485) moves a dropped card only when it's within 16 px of another (line 4490).
- **Add-next:** `placeAfter` (`builder-add-next-v204`, line 13096) steps down by a 224 px card and a 24 px gap (line 13098).

### 12. A container's name can sit under the card above it

**What you see,** in the reference topology at 1,440 px:
- **Put Universal Forwarder 2 in a container.** The container's name sits on the box's top edge, from 39 to 12 px above the card. Universal Forwarder 1, above it, covers 15 px of the 27 px name, and a click on the name selects Universal Forwarder 1. The same with Syslog Source 2 or Heavy Forwarder 1, and with Group by: My containers.
- **In the vertical layout,** the same 15 px. A link from the card above also runs through the name, and takes the click.
- **In Free place,** the card above covers all 27 px.
- **The box ends 48 px above its card's bottom.**
- **On a phone,** the card above or its handle rows cover the name, in the vertical layout and in Free place. The box ends 6 to 78 px above its card's bottom, by the card's height.

**The cause:**
- **Nothing makes room for the name.** Rows are 24 px apart (6 in Free place), and the name needs 39 px. It is `.unifiedGroupBox button` (`builder-unified-canvas-styles`, line 2445), at `top:-13px` on a box that starts 28 px above its top card.
- **The box's depth:** `unifiedGroupMarkup` (`builder-unified-multiplane-canvas`, line 2456) ends the box 176 px below its lowest card's top. Cards are 224 px tall above 760 px, and on a phone as tall as their content.
- **The layers:** the box (line 2445) has `z-index:0`, so it makes its own layer, name included, under the links (`.unifiedConnectorLayer`, `z-index:1`). Cards (`.unifiedNodeWrap`) are at 3.

### 13. The Matrix header doesn't follow the page

**What you see:**
- **Scroll the Matrix view down** past its first rows. The header scrolls away with the top of the table, and the 118 stages' columns have no labels.
- **The same in the Config view,** which shows the same Matrix. At 1,440 px, 1,024 and on a phone.

**The cause:**
- **The header cells are sticky** (`th{position:sticky;top:75px}`, line 74), to stay under the toolbar (`.toolbar`, sticky at 10 px, line 60).
- **But the Matrix box is their scroll box.** `.matrixWrap` (line 74) has `overflow:auto`, so the cells stick inside it, not the page. The box is as tall as the table, about 7,100 px, so it never scrolls up and down, and the cells never stick.
- **The box needs `overflow:auto` to scroll sideways.** At 1,024 px the table is 1,318 px wide in a 970 px box; on a phone the box is 362 px wide. Taking it away would let the table widen the page.

### Found while testing: a Config stage button on a phone

**What you see:** on a phone, in the Config view with the example loaded, a line's stage button can scroll the stage's row off the screen. Stage 22's row lands 707 px above the top.

**The cause:** `showStage` (`config-view-v205`, line 13782) scrolls the row to 16 px below the toolbar's bottom edge. On a phone the toolbar doesn't stick, so its bottom edge is wherever the page has scrolled it.

Item 13's edit to the same line fixes it.

## The design

### 11. Room under a card in Free place

- **Every card starts with room below it** before the next card in its column:
  - **30 px** for the Event data handle row, which shows with the pointer on a card;
  - **on a touch screen,** where the rows always show, their depth and 6 px more: 115 px under Data, Fleet and Access rows. The rows hang 6 px below their own card, so they sit midway.
- **Heights are read from the canvas:** 224 px above 760 px; on a phone, each card's own.
- **Rows move together.** Each row moves down as far as its most crowded column needs, and every row below moves with it. Columns and order are as before.
- **A dropped card** within 30 px above or below another moves to a clear place (16 px before).
- **Add-next** stacks a new card 30 px under one already there (24 before).
- **Unchanged:**
  - positions already placed, by hand, a saved layout or a file;
  - the horizontal and vertical layouts;
  - a drop's clearance at the sides, 16 px.

### 12. Room for a container's name

- **The name keeps 6 px clear** of what is above it in the container's columns:
  - a card;
  - on a touch screen, the card's handle rows;
  - or the box of the container that card is in, 18 px below it.
- **The container's row moves down,** and every row below it, by the same amount. The band title and the canvas height follow. Containers are done top to bottom, as each move takes the ones below it down too.
- **In every layout:** horizontal, vertical, on a phone, and Free place's starting positions.
- **The box reaches 18 px below its lowest card,** as at its sides, whatever the card's height.
- **The name is drawn over links,** still under cards. A link through it no longer hides it or takes its click.
- **Unchanged:**
  - with no containers, every card is where Build 209 puts it;
  - a container with nothing above it moves nothing;
  - positions already placed in Free place;
  - the SVG export, which draws its own boxes.

### 13. A header that follows the page

- **A copy of the header,** fixed just under the toolbar, shows while the real header is above that line and rows are still below it: at 83 px at 1,440 px, at 139 at 1,024. On a phone, where the toolbar doesn't stick, at the top of the screen.
- **It matches the table:**
  - as wide as the Matrix box;
  - scrolled sideways with it;
  - the real columns' widths, cells and classes.
- **It hides** at the top of the page, past the table's end, and in other views.
- **Screen readers skip it** (`aria-hidden`). They read the real header.
- **The Config view's stage buttons** scroll the row in just below the copy. On a phone, below the copy at the top of the screen.

## The edits

All four are in Build 209's `index.html`, and each old string occurs exactly once.

**1. `<script id="builder-unified-multiplane-canvas">`, line 2456, in `unifiedGroupMarkup`: the box reaches 18 px below a 224 px card.**
```
old: bottom=Math.max(...ys)+176;return`<div class="unifiedGroupBox
new: bottom=Math.max(...ys)+242;return`<div class="unifiedGroupBox
```
On a phone the script block fits the box to its cards once they're drawn (below).

**2. `<script id="builder-connector-followup-v124">`, line 4490, in `builderV124ClearDrop124`: a dropped card keeps 30 px above and below.**
```
old: y<box.y+box.h+16&&y+current.h>box.y-16);
new: y<box.y+box.h+30&&y+current.h>box.y-30);
```
The line before, at the sides, keeps 16.

**3. `<script id="builder-add-next-v204">`, line 13098, in `placeAfter`: 30 px between stacked cards.**
```
old: const W=190,H=224,GAP=24,
new: const W=190,H=224,GAP=30,
```
`GAP` is also `taken`'s clearance at the sides, so that becomes 30 px too.

**4. `<script id="config-view-v205">`, line 13783, in `showStage`: below the header, and from the top of the screen when the toolbar doesn't stick.**
```
old:  const toolbar=document.querySelector('.toolbar').getBoundingClientRect().bottom;scrollTo({top:row.getBoundingClientRect().top+scrollY-toolbar-16,behavior:'smooth'});flash(row)}
new:  const bar=document.querySelector('.toolbar'),toolbar=getComputedStyle(bar).position==='sticky'?bar.getBoundingClientRect().bottom:0;scrollTo({top:row.getBoundingClientRect().top+scrollY-toolbar-16-(document.querySelector('#matrix thead')?.offsetHeight||0),behavior:'smooth'});flash(row)}
```
Both strings start with a space, as the line does.

## How the blocks work

**The style block:**
- **`.unifiedGroupBox{z-index:auto}`:** the box no longer makes its own layer. Its border and fill stay under the links (`z-index:1`), as they come before them.
- **`.unifiedGroupBox>button[data-unified-group]{z-index:2}`:** the name, over the links and under the cards (3).
- **The box's collapse button** (`.builderGroupCollapseButton`, `z-index:3`) now also draws over links. It comes before the cards on the canvas, so cards still draw over it.
- **`.matrixFollow210`:** the header copy. Fixed, at `z-index:14`, under the toolbar (15), with a shadow below. Its table is `table-layout:fixed`, and its cells aren't sticky.

**The script.** Each part checks that the function it wraps exists.

**1. A card's depth** (`cardDepth`): its height, and how far below it its handle rows reach where they always show. Both are read from the card on the canvas:
- the height is the card's `offsetHeight`;
- the rows count only when `.builderConnectionHandles` isn't positioned absolutely, which is on a touch screen;
- a card not drawn yet counts as 224 px with no rows.

**2. Free place's starting positions** (`rowsApart`), on the layout `automaticPositionsForFree` returns:
- the distinct `y` values, top to bottom, are the rows;
- each row moves down until every card in it starts below the room of the cards above it in its column (`x` within 190 px);
- the room is the card's height, then 30 px, or its rows' depth and 6 px if more;
- each row's move carries on to the rows below it.

**3. Room for names** (`roomForNames`), on a layout's positions:
- containers are taken top to bottom, by their top card;
- for each, the lowest edge of what is above its top card in its columns, from 18 px left of its cards to 18 px right of them: a card's bottom edge, or lower, the bottom of its handle rows on a touch screen, or of its own container's box, 18 px below it;
- if the name, 39 px above its top card, isn't 6 px below that, every position from the container's top card down moves by the difference. So do the layout's `bandY` and `height`.

**4. Where they apply:**
- **`unifiedBuilderPositions`** is wrapped: outside Free place, its layout gets room for names. During a redraw, Build 163 hands back the same layout for every call, so a `WeakSet` of positions maps makes sure each gets it once.
- **`automaticPositionsForFree`** is wrapped: its layout gets both, rows apart and then room for names.
- **`ensureFreePositions`** is wrapped to set a flag. Every Free place redraw calls it, and it asks for the starting positions, but uses them only for a card with no place yet. With the flag set and every card placed, the starting positions are left as they are, and nothing is measured.

**5. Fitting the boxes** (`fitBoxes`), after every `renderBuilder`, while there are containers:
- each box's height becomes its lowest card's bottom edge, as drawn, plus 18 px;
- the card is measured once the whole redraw is done. On a phone, joining a container adds the container's chip to the card in the same redraw, and wrappers of `renderBuilder` that run after the canvas is drawn still add to the card;
- Above 760 px edit 1 already draws the box at that height, so nothing changes.

**6. The header copy:**
- **Made once,** at load: a `div.matrixFollow210` with an empty `table`, inside `#matrix`, hidden.
- **On each scroll and resize** of the page and of `#matrix`, and when the table or the box changes size, one update is queued for the next frame.
- **The line** is the toolbar's bottom edge while it sticks, otherwise 0.
- **It shows** while the real header is above the line and the table's bottom is below the line plus the header's height. Otherwise, and when `#matrix` isn't shown, it hides.
- **It copies** the real header (`cloneNode`) when first shown and whenever the real header changes (a `MutationObserver`).
- **It matches the table:** each cell takes the width of its real cell; the copy takes the box's left edge, inner width and the table's width, and `translateX` by the box's sideways scroll.

**7. A redraw,** if the Builder is showing when the block runs.

## Build records

After the blocks:
- **`changeRegister`,** group "Explorer foundations":
  `['Room on the canvas, and a Matrix header that follows the page','In Free place, cards start with room below them for their handle rows, on phones too, and a dropped card or one added from a handle keeps 30 px from the card above. A container\'s name keeps clear of the card above it, in every layout, and its box reaches below its lowest card. The Matrix header stays under the toolbar while the page scrolls, in the Matrix and Config views.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 209 did in `quick-fixes-records-v209`, with Build 210.

## Found while testing (not changed)

1. **With a mouse, Fleet and Access handle rows still cover the card below,** while the pointer is on a card that has them: they reach 78 or 108 px below it. Making room for them would put such rows over 330 px apart.
2. **The horizontal and vertical layouts keep 24 px between rows,** so the Event data row covers 6 px of the card below while the pointer is on a card. Item 11 was about Free place.
3. **Positions already placed in Free place don't move,** so a container's name there can still sit under a card.
4. **On a touch screen, a dropped card and add-next keep 30 px** from the card above, where that card's handle rows can reach 109 px.
5. **Group by: Tier lanes** (Build 130's `builderGroupBounds130`, sized for 175 px cards): the Management lane's title sits under a card, and a lane ends 31 px short of its lowest card.
6. **In the vertical layout, the collapse button can cover the end of a route label** that falls on the box's top edge ("File handoff" in the mockup's vertical scene). On Build 209 the label covered the button.
7. **The connector tool** (`tools/builder-connector-check.js`) reports the same totals, with two connectors swapping state after drops. See "Regression".
8. **On a phone, the room for a name reads the card above as last drawn.** If that card changes height in the same redraw, joining a container for example (its chip adds a line), the room can be short until the next redraw.

## Check before uploading

Run with Build 209 + the two blocks + the four edits, and with Build 209 as shipped for comparison.

### 1. The fixes: 40 checks, all pass

Build 209 passes 5 of the 40: those that check behaviour that should stay as it is.

| Check | Result |
|---|---|
| Free place's starting positions, reference and zones topologies | At least 30 px between cards stacked in a column (Build 209: 6), in all 12 and 14 pairs, with the same columns and order |
| The Event data row in Free place | Reaches under the card below for none of the 7 cards that have one (Build 209: 7) |
| A drop | 20 px under another card: moved to a clear place, 40 px below it (Build 209 left it). 40 px under: stays, as on Build 209 |
| Add-next twice in Free place | The second card 254 px under the first, 30 px apart (Build 209: 248, 24 px) |
| Free place on a touch screen: reference and zones at 390 px, reference at 1,024 px | No card overlaps the next, and each keeps its handle rows' depth and 6 px, at least 30. Build 209: at 390 px, 6 and 15 pairs overlapping, by up to 65 and 92 px; at 1,024 px, every pair 6 px apart, the rows over or under the card below |
| A container's name, 1,440 px: horizontal, vertical and Free place, for Syslog Source 2, Universal Forwarder 2 and Heavy Forwarder 1 | Nothing covers it, it takes a click, and the box reaches 18 px below the card. Build 209: covered 15 px (27 in Free place), the click went to the card above or a link, and the box ended 48 px above the card's bottom |
| A container's name on a 390 px phone: vertical and Free place, for Syslog Server 2, Universal Forwarder 2, Heavy Forwarder 1 and Indexer 1 | The same: clear, takes the click, box 18 px below the card (cards 182 to 254 px). Build 209: covered up to 27 px in 6 of the 8, the box 6 to 78 px short |
| Group by: My containers | A click on the name selects the container (Build 209: the card above) |
| A container with nothing above it | Moves nothing |
| No containers | Every card where Build 209 puts it: three topologies, horizontal and vertical, and a phone |
| The move | Universal Forwarder 2's row and the rows below it move down 21 px together, with the band title and the canvas height. The rows above stay |
| The Matrix header: Matrix and Config views at 1,440, 1,024 and 390 px | Scrolled down, the copy shows at the line (83, 139 and 0 px), on top, columns within 1 px of the table's, also scrolled sideways; hidden at the top of the page and past the table's end. Build 209: the header scrolled away |
| Other views | No copy in the Flow and Builder views |
| The Config view's stage buttons | At 1,440 px the row lands at 154 px, just below the copy (Build 209: 99, under the toolbar). On a 390 px phone, two stage buttons in turn each bring their row into view below the copy (Build 209 scrolled the first off the screen) |
| Page errors | None |

### 2. Regression

Against Build 209:

| Suite | Result |
|---|---|
| The quick fixes | 27 of 27 |
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 55 of 58. The other 3 expect Free place's old spacing (below); expecting the new, 58 of 58 |
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Menu bar actions | 69 of 69, the same output as Build 209 |
| Parsing laboratory | 68 of 68. "Click to next frame" for fixed-length records took 340 ms in the run; alone, alternating with Build 209, 311 and 297 ms against 316 and 301 (limit 1,000) |
| Canvas card views | 123, unchanged |
| The space tool | The same output as Build 209 |
| The connector tool | The same totals (20 "badge over label"), with two connectors swapping after a drop (below) |
| Page errors | None |

**The expected changes:**
- **Add-next, Free place:** three checks are written for Build 209's spacing.
  - "The first goes one column after Universal Forwarder 1, at the first free place at or below its level" expects it a whole number of 248 px steps below Universal Forwarder 1; it is two 254 px steps below, 508 px.
  - "The second goes below the first" expects 248 px below; it is 254.
  - "Universal Forwarder 1's handle, 6 px above Universal Forwarder 2, can be clicked" expects the two cards 230 px apart; they are 254, and the handle opens the list.
- **The connector tool,** after a drop, where the dropped card now lands 30 px clear:
  - "4 Syslog Server dragged directly below Syslog Source": Syslog Source 1 → Syslog Server 1 is "badge over label" (Build 209: "OK (label hidden: no room, badge on line)");
  - "7 Universal Forwarder overlapping Syslog Server column": Universal Forwarder 1 → Indexer 1 is "OK" (Build 209: "badge over label").

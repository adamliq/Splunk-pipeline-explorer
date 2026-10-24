# Handoff: the toolbar on one row, Group by lanes that reach their cards, and labels clear of group headers

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 210.
**Two new blocks, at the end of the page (before `</body>`), in this order:**
- `<style id="toolbar-lanes-labels-v211-styles">`, containing [`docs/mockups/toolbar-lanes-labels-prototype.css`](mockups/toolbar-lanes-labels-prototype.css);
- `<script id="toolbar-lanes-labels-v211">`, containing [`docs/mockups/toolbar-lanes-labels-prototype.js`](mockups/toolbar-lanes-labels-prototype.js).

**One in-place edit,** under "The edit". Its old string occurs exactly once in Build 210. It is also in [`docs/mockups/toolbar-lanes-labels.diff`](mockups/toolbar-lanes-labels.diff), a unified diff against Build 210's `index.html`.

Paste the files as they are, make the edit, then add the build records (see "Build records").

**The numbers** are those of the "Still open" list in the Build 210 recheck ([`builder-handoff-build210.md`](builder-handoff-build210.md)): 18, 25 and 26.

**Mockup (the target):** [`docs/mockups/toolbar-lanes-labels-mockup.html`](mockups/toolbar-lanes-labels-mockup.html). Eight scenes have the fixes applied to Build 210, and the six "Today" scenes are Build 210. The screenshots are `docs/mockups/compare/toolbar-lanes-labels-*.png`.

**Tested first:** the blocks and the edit were applied to Build 210 and run. The results under "Check before uploading" come from that run.

## Why

### 18. The toolbar takes two rows from 821 to 1,309 px

**What you see,** in every view but the Builder and OV, which have their own toolbars:
- **From 821 to 1,309 px wide,** the search box and the pipeline filter are on one row and the nine view buttons on a second.
- **The toolbar is 129 px tall** at 1,024 px, against 73 on one row. It sticks to the top of the page, so the second row covers 56 px more of the view as the page scrolls.

**The cause:**
- **The toolbar** (`.toolbar`, line 60) sticks 10 px from the top of the page (`position:sticky`, `z-index:15`).
- **Build 206** (`small-fixes-v206-styles`, lines 14012 to 14017) made it a row that wraps, from 821 px: the search box takes what is left, at least 250 px (`flex:1 1 250px`), the pipeline filter keeps its width, 248 px, and the view switcher (`.seg`) wraps as a whole when the three don't fit. Before that, the switcher squeezed the filter.
- **The switcher is 706 px wide:** Flow 58, Matrix 71, Config 72, Builder 77, OV 46, Operate 85, Diagnose 94, Failure Lab 105 and Changes 89, and its padding. With the filter, a 250 px search box, the gaps and the padding, one row needs a 1,310 px window.

### 25. Group by: lanes and boxes end short of their cards, and type headers sit under the card above

**What you see,** in the reference topology at 1,440 px:
- **Group by: Tier.** The Management band ends 31 px above its cards' bottoms. The other lanes end 18 px below theirs. (The Build 210 recheck also had the band's title under a card. The title's text is clear; it is the band that is short.)
- **Group by: Component type.** Every type box ends 39 px above its card's bottom. Six type headers sit under the card above them: "Universal Forwarder · 2" under Heavy Forwarder 1, "Syslog Server · 2" under AWS Lambda 1, and four more. A header is a button (it collapses its type), and the card takes the click on the part it covers.
- **Group by: Region or Environment.** The lanes end 24 px above their cards' bottoms. Three lane titles run under a card: "Region · Security operations" under Administrator 1, "Region · AWS ap-southeast-2" under AWS Lambda 1, and "Environment · Production" under Firewalls and network devices.
- **On a 390 px phone,** Group by: Component type: the type boxes end anywhere from 68 px short of their cards to 43 px past them, and 11 of the 14 headers sit under the card above, or under its handle rows, which a touch screen always shows.

**The cause:**
- **Build 130** (`builder-grouping-v130`, line 5262) sizes its lanes and boxes from `builderGroupBounds130` (line 5332), which takes every card as 190 × 175 px. Cards are 224 px tall above 760 px, and on a phone as tall as their content.
- **`builderGroupLane130`** (line 5333):
  - the Management band runs from the bounds' top for their height, at least 45 px: 31 px short of a 224 px card;
  - Region and Environment lanes run from 23 px above the bounds to 7 px past them: 24 px short;
  - a Tier column runs from 23 px down to 49 px past the bounds, which happens to clear a 224 px card by 18 px.
- **The lanes are drawn under cards** (`z-index:0`, `builder-grouping-v130-styles`, line 5257), and a title (`strong`, `display:block`) wraps onto as many lines as it needs.
- **`builderGroupTypeBox130`** (line 5339) draws a box from 29 px above the bounds to their bottom: 39 px short of a 224 px card. Its header (`.builderTypeHeader130`, line 5258) starts 30 px above the box's top card, and nothing keeps the card above clear of it: rows are 24 px apart.
- **The box comes before the links and has `z-index:1`,** as the links' layer does, so links and their labels draw over the header.

### 26. A container's collapse button can cover the end of a link's label

**What you see,** in the reference topology at 1,440 px, with one card in a container named Sydney:
- **The vertical layout, Heavy Forwarder 1 in the container.** The link from AWS Lambda 1, above it, comes in through the 45 px gap that holds the container's name. Its label, "Direct HEC HTTPS 8088", sits there too: the name covers its start and the collapse button its end.
- **The same with Syslog Source 2, Syslog Server 2, Universal Forwarder 2 and Indexer 1 in the container,** and with SAML SSO under the name in Free place.
- **Group by: Component type.** Labels and their issue badges cover type headers.
- **In all, over 21 cases** (each of six cards in the container, in the horizontal, vertical and Free place layouts, and Component type in the three layouts), at 100 %: 13 labels with text under a name, a collapse button or a type header, 3 issue badges under one and 1 badge on another link's label. Zoomed out to fit, where only badges show, 5 badges under one.

**The cause:**
- **Since Build 210** (`room-and-header-v210-styles`, lines 14394 and 14395) a container's name is drawn over links (`z-index:2`), and its collapse button too (`z-index:3`, line 2722). Route labels belong to the links' layer (`.unifiedConnectorLayer`, `z-index:1`), so the name and the button cover a label under them.
- **Build 156's label placement** (the `builderPlaceLabels149` in `builder-canvas-review-v156`, line 7869, which replaces Build 149's) puts each label on or beside its link where it covers no card, no card's issue badge and no label already placed. It knows nothing of containers' names and collapse buttons.
- **There is no room.** The gap above a container is 45 px in the vertical layout, and the name starts 39 px above the container's top card and spans x −8 to 101 of it. A link from the card above into the top card's middle runs under the name for its whole length, so its label has nowhere clear to go.
- **Issue badges:** with no clear spot for a label, and whenever the canvas is zoomed out, Build 164 puts the label's badge on its link's midpoint (`builderBadges164`, `builder-lines-v164`, line 8659), whatever is there.
- **The name is drawn at 9.3 px** (`.unifiedGroupBox button`, line 2445) and Build 151 raises canvas text under 11.5 px to 11.5 px (`polishBuilderText`, line 8057), but only once the redraw is done, after the labels are placed. So a container's name is 18 px wider than the labels allowed for.

## The design

### 18. One row, and a More menu

- **From 821 px, in every view but the Builder and OV,** the search box, the pipeline filter and the view switcher keep to one row, 73 px tall.
- **The search box keeps at least 250 px and the filter its width.** The views that don't fit in what is left go into a **More** menu at the end of the switcher, in their order:

| Window | Views shown, then More |
|---|---|
| 1,310 px and wider | All nine, no More |
| 1,300 px | Eight |
| 1,280 and 1,200 px | Seven |
| 1,100 px | Six |
| 1,024 px | Five (Flow to OV) |
| 960 and 900 px | Three |
| 840 and 821 px | Two |

- **More** reads "More ▾". When the current view is in the menu, More takes its name, "Changes ▾" for example, and is marked as current, so the switcher always shows where you are.
- **The menu** opens under More, against its right edge, and lists the views left out. Choosing one shows it, closes the menu and puts focus back on More. Esc closes it and puts focus back on More; a click anywhere else closes it.
- **Unchanged:** from 1,310 px every view shows and there is no More; at 820 px and below the toolbar stacks as before; the Builder and OV keep their own toolbars.

### 25. Lanes and boxes that reach their cards

- **Every lane ends 18 px below its lowest card** (Tier, Region and Environment), **and every Component type box 10 px below,** whatever the cards' heights: measured as drawn, and again whenever one of the cards changes size.
- **Type headers keep 6 px clear** of the card above them, of that card's own box, or, on a touch screen, where they always show, of its handle rows. As Build 210 does for containers' names, rows move down, top to bottom: the box's top row and every row below it, together.
- **A type header is drawn over links,** still under cards, as containers' names are since Build 210. The box's border and fill stay under the links.
- **Titles keep to one line:** a lane title, or a type header, that doesn't fit ends with "…", and shows its full text on hover.
- **On a phone too.**

### 26. Labels clear of group headers

- **Room for a link coming in from above.** Where a link joins a group's top card to a card directly above it (in either direction), rows move down until the gap above the group's header holds the link's label and its issue badge: 34 px between the card above (on a touch screen, its handle rows) and the header. A group is a container (its name starts 39 px above its top card) or a Component type box (its header, 30 px). The label then sits above the header.
- **Labels keep clear** of containers' names and collapse buttons and of Component type headers, as they do of cards: Build 156's placement counts them (the edit). A label with no clear spot shows just its issue badge, with its text on hover, as Build 156 shows any label it can't place.
- **Badges keep clear.** A badge that Build 164 puts on its link's midpoint, and that would sit under one of those controls, or, at 100 %, on another link's label, moves along its link to the nearest point clear of the controls, cards, other badges and, at 100 %, labels; failing that, to 18 or 30 px beside the link.
- **A container's name is drawn at 11.5 px from the start,** the size Build 151 gives it after the redraw, so labels keep clear of the name as it ends up.
- **Unchanged:** with no containers and no Group by, every card is where Build 210 puts it; Free place's positions; the links' routes where no rows move.
- **The cost:** where rows move, Build 156 can route other links differently. When a link's own gap is too short for its label, Build 156 sends the link around through a wider gap, and the room makes one. In two of the 21 cases four such labels then find no clear spot, and in another one label finds one: 70 labels show just their badge, against 67 on Build 210, out of 252.

## The edit

In Build 210's `index.html`; the old string occurs exactly once.

**1. `<script id="builder-canvas-review-v156">`, line 7874, in `builderPlaceLabels149`: the obstacles a label keeps clear of include this block's list.**
```
old: w:r.width/zoom,h:r.height/zoom}});
new: w:r.width/zoom,h:r.height/zoom}}).concat(typeof builderLabelObstacles211==='function'?builderLabelObstacles211():[]);
```
The old string ends line 7874, the list of issue badges on cards (`nodeBadges`). `nodeBadges` goes into `obstacles` (line 7882) with the cards and the labels already placed.

## How the blocks work

**The style block:**
- **`.segOut211`** hides a view button that has gone into the menu; **`.segMore211::after`** adds the ▾ to More.
- **`.segMenu211`:** the menu, positioned in the toolbar under More, at `z-index:16`, over the toolbar (15). Items are buttons; the current view's is marked.
- **Lane titles** (`.builderTierLane130>strong`): one line, `…` when cut, and `pointer-events:auto` so the full title shows on hover. The lane itself still ignores the pointer.
- **`.builderTypeBox130{z-index:auto}`:** the box no longer makes its own layer. Its border and fill still come before the links, so stay under them, and its header (`z-index:2`) draws over them, under the cards (3). The header keeps to one line, within the box.
- **`#builderTree .unifiedGroupBox>button[data-unified-group]{font-size:11.5px}`:** the container's name at its final size from the start.

**The script.** Each part checks that the function it wraps exists.

**1. The toolbar:**
- **Made once:** More (`button.segMore211`, `aria-haspopup`, `aria-expanded`, `aria-controls`) at the end of the switcher, hidden; the menu (`div#segMenu211`, `role="group"`, labelled "More views") after the switcher, hidden.
- **Fitting** (`fit`): every view button shows, and More hides. Then, from 821 px, outside the Builder and OV, and with the toolbar shown:
  - the room for the switcher is the toolbar's inner width less 250 px for the search box, the filter's width and two gaps;
  - if every button fits, that's all;
  - otherwise, with More's width counted, buttons are kept in order while they fit. If the current view is left out, More takes its name and is marked as current, and the buttons are counted again with More's new width;
  - the rest get `.segOut211`, and the menu gets a button for each, which clicks the real button.
- **When:** at load, after every `switchView` (wrapped), and in the next frame after a resize of the window or the toolbar, a crossing of 821 px, and the fonts loading.
- **The menu:** More's click opens it under More, or closes it. A `pointerdown` outside it or More closes it; Esc closes it and puts focus on More.

**2. Canvas units** (`inCanvas`): where an element sits on the canvas, from offsets within the canvas world, not from the screen. During a redraw the zoom setting and the canvas's scale can differ, so a size read from the screen and divided by the zoom can be wrong. A card's height (`cardHeight`) is its `offsetHeight`, or 224 px before it is drawn. Its handle rows' depth (`rowsBelow`) is how far `.builderConnectionHandles` reaches below the card where the rows are in the card's flow, on a touch screen; with a mouse they are positioned, and it is 0.

**3. Lanes and boxes** (`reach`): `builderGroupLane130` and `builderGroupTypeBox130` are wrapped. Once Build 130 has drawn a lane or a box:
- its height becomes its lowest card's bottom, as drawn, plus 18 px for a lane or 10 for a box;
- a `ResizeObserver` watches its cards, and it is fitted again when one changes size. On a phone a card's height changes as its styles arrive (one card is 246 px when the box is drawn, then 224);
- the title, or the header, gets its text as a `title`, shown on hover.

**4. Room above group headers** (`roomAboveHeaders`), on a layout's positions:
- **the groups:** each Component type box, with Group by: Component type (cards of a collapsed type, cards in a container and cards hidden by the large-topology navigation left out), and each container;
- **top to bottom,** by each group's top card;
- **a type header needs** 6 px clear of the lowest card above its top card, within the box's width: of the card, of its own box, 10 px below it, or of its handle rows, whichever reaches lower;
- **any group needs,** where a shown link joins one of its top cards to a card above it within its width (the box's width plus 10 px, or the container's plus 18), 34 px between that card's bottom, or its handle rows', and the header's top (39 px above the top card for a container, 30 for a type box);
- **every position from the group's top card down moves** by what is missing, with the layout's `bandY` and `height`. The moves are kept as `[top, need]` pairs.

**5. Where the room applies:** `unifiedBuilderPositions` is wrapped. Outside Free place:
- the first layout after `renderBuilder` starts gets the room, and the moves are kept;
- every layout after that, until the next redraw, gets the same moves. On a phone, and with Group by set, each call works the layout out afresh, and card heights change during a redraw (one card: 162, then 194, then 142 px). The same moves keep the cards, the boxes Build 130 draws after them, and the labels on the same rows;
- during a redraw Build 163 can hand back the same layout to every call, so a `WeakSet` of positions maps makes sure each gets the moves once.

A `renderBuilder` wrapper clears the moves, and stops watching the cards of the lanes and boxes the redraw replaces.

**6. Label obstacles** (`window.builderLabelObstacles211`): every shown container name and collapse button (`.unifiedGroupBox>button`) and Component type header, in canvas units, 2 px larger all round, as Build 156 grows cards. The edit adds them to Build 156's obstacles.

**7. Badge spots** (`findBadgeSpots`), after every label placement (`builderPlaceLabels149` is wrapped):
- **where each badge is:** at 100 %, beside its label (Build 164 keeps that place in `data-label-transform164`) when the label shows its text, or else on its link's midpoint; zoomed out, on the midpoint;
- **at 100 %,** for a label shown without text: if a 26 px badge on the midpoint would overlap a control or another link's label, the nearest point along the link, out from the midpoint in steps of a fiftieth, clear of the controls, cards, labels and other badges; failing that, the nearest point 18 or 30 px to either side of the link;
- **zoomed out,** for any link whose midpoint badge would overlap a control: the same, with labels left out, as they are hidden;
- **`builderBadges164` is wrapped:** after it puts badges on their midpoints, a badge with a spot for the current zoom goes there. It runs after every placement, zoom and highlight.

**8. Placing labels again:** Build 130 draws the Component type boxes after the redraw has placed the labels, so with type headers on the canvas, the outermost `renderBuilder` wrapper calls `builderV123PlaceLabels()` once more.

**9. A redraw,** if the Builder is showing when the block runs.

## Build records

After the blocks:
- **`changeRegister`,** group "Explorer foundations":
  `['The toolbar on one row, and Group by lanes and labels that fit','From 821 px the toolbar keeps to one row: the views that don\'t fit go into a More menu. Group by lanes and Component type boxes reach below their cards, type headers keep clear of the card above, and long titles end with an ellipsis. Route labels and issue badges keep clear of containers\' names and collapse buttons and of type headers, and a link coming into a group from above has room for its label.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 210 did in `room-and-header-records-v210`, with Build 211.

## Found while testing (not changed)

1. **Isolate by region or environment throws** "Assignment to constant variable." on Build 210, at any width. In `applyLargeTopologyNavigation` (`builder-large-topology-navigation`, line 2736), `involved` is declared with `const` (`…,involved=fromGroup||toGroup;`) and then set to `true` when a link joins a card the isolation hides, so the pass stops at the first such link. Declaring `involved` with `let` would fix it.
2. **Four more labels show just their badge** (70 against 67 over the 21 cases), where rows move and Build 156 routes other links through the wider gap. See "The cost" above.
3. **Zoomed out, badges can overlap each other:** 6 places in the 21 cases (Build 210: 7). Build 164 puts every badge on its link's midpoint, and links that share a stretch share a midpoint.
4. **Build 156 measures a card's issue badges from the screen, divided by the zoom setting** (`nodeBadges`, line 7874). During a redraw the setting and the canvas's scale can differ, which is why this block measures in canvas units.
5. **Build 151 raises small canvas text after the redraw** (line 8057), so anything measured during a redraw sees text at its first size. This block gives a container's name its final size from the start; other text may have the same issue.
6. **On a phone, Group by: Region or Environment lanes overlap.** The phone's one column keeps cards in tier order, not by region, so a region's lane runs round other regions' cards, and four region titles sit under a card, on Build 210 too. The lanes now reach their own cards, but still overlap.
7. **On a touch screen, in the vertical layout, a card's handle rows reach over the card below** (they always show, up to 109 px deep), and over the title of the Tier lane below: four of the six on a phone, on Build 210 too. Type headers and the room for labels allow for the rows, as Build 210's room for containers' names does; Tier titles don't.

## Check before uploading

Run with Build 210 + the two blocks + the edit, and with Build 210 as shipped for comparison.

### 1. The fixes: 42 checks, all pass

Build 210's figures are in brackets.

| Check | Result |
|---|---|
| The toolbar from 821 to 1,300 px (nine widths), Matrix view | One row, 73 px tall; views shown, then More: 8, 7, 7, 6, 5, 3, 3, 2, 2; the search box 257 to 343 px, at least 250; the filter 248 px; nothing scrolls sideways. Build 210: two rows at all nine widths, 129 px at 1,024 |
| 1,310 px and wider (1,310, 1,320, 1,440), and 820 and 760 px | As Build 210: all nine views, no More |
| More at 1,024 px | Opens a menu of Operate, Diagnose, Failure Lab and Changes, in that order (`aria-expanded` true) |
| Choosing Changes | Shows the Changes view; More reads "Changes", marked as current; the menu closes; focus on More |
| Keyboard and pointer | Enter on More opens the menu; Esc closes it, keeps the view and puts focus on More; a click elsewhere closes it |
| The Builder and OV at 1,024 px | Their own toolbars, every view button kept, no More. Back in Flow, More returns |
| Group by at 1,440 px: Tier | 6 lanes end 18 px below their lowest card (Build 210: the Management band 31 px above its cards' bottoms) |
| Component type | 14 boxes end 10 px below their lowest card, no header under a card (Build 210: 39 px above; 6 headers under the card above) |
| Region and Environment | 7 lanes end 18 px below their lowest card, no title under a card; titles on one line, and the 3 cut short show their full text on hover (Build 210: 24 px above; 3 titles under a card) |
| A 390 px phone: Tier | 6 lanes end 18 px below their lowest card (Build 210: 23) |
| A 390 px phone: Component type | 14 boxes end 10 px below their lowest card, and no header is under a card or its handle rows (Build 210: from 68 px short to 43 past; 11 headers under one); the Tier lanes drawn with them end 18 px below |
| A 390 px phone: Region and Environment | Reported, not checked: the lanes overlap, as on Build 210 (see "Found while testing") |
| No Group by, no container | Every card where Build 210 puts it, horizontal and vertical |
| Labels at 100 %, 21 cases, 252 labels | 0 labels with text under a name, a collapse button or a type header (Build 210: 13); 0 badges under one (3); 0 badges on another link's label (1) |
| Zoomed out to fit | 0 badges under those controls (Build 210: 5) |
| The case reported | Vertical, Heavy Forwarder 1 in a container: "Direct HEC HTTPS 8088" shows its text, 10 px above the container's name (Build 210: 19 px into it) |
| The container's name | Drawn at 11.5 px |
| Page errors | None |

### 2. Regression

Against Build 210:

| Suite | Result |
|---|---|
| The room-and-header checks (Build 210's handoff, against Build 209) | 40 of 40 |
| The quick fixes | 27 of 27 |
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 55 of 58, as on Build 210: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58 |
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Menu bar actions | 69 of 69 |
| Parsing laboratory | 68 of 68 ("Click to next frame" 229 ms, limit 1,000) |
| Canvas card views | 123, unchanged |
| The space tool | The same output as Build 210 |
| The connector tool | The same output as Build 210 |
| Page errors | None |

# Builder handoff: fixes from a check of the Builder page

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 231.
**Applied:** as Build 232, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="builder-sweep-v232">` (68 lines), after `explorer-review-v231`, containing [`docs/mockups/builder-sweep-prototype.js`](mockups/builder-sweep-prototype.js). It sets `window.builderSweep232` and `window.builderFirstFit232`.
- `<style id="builder-sweep-v232-styles">` (61 lines), after `explorer-review-v231-styles`. It holds 11 lines of rules written for the items below, then the text floor of item 10: 42 rules covering 69 selectors, made and checked by [`docs/mockups/builder-sweep-text-floor.js`](mockups/builder-sweep-text-floor.js).

**Ten in-place edits,** under "The edits":
- the flag of View › Presentation, in four places (items 1 and 2);
- the Help item (item 3);
- two search boxes' names (item 11);
- Save's suggested name (item 13);
- the first visit's fold, and its note (item 9).

Each old string occurs exactly once in Build 231, and none changes the number of lines. The edits, the block and the styles are also in [`docs/mockups/builder-sweep.diff`](mockups/builder-sweep.diff), a unified diff against Build 231's `index.html` with no context lines, so it applies with `git apply --unidiff-zero`.

**Also in this commit (item 15):**
- `tools/builder-connector-check.js` counts a route label the zoom hides as hidden.
- `docs/builder-handoff-explorer-review.md`: Build 231's note on that tool's findings, corrected.

**The request:** "Check build page for fixes", then "All. Merge": build every item of the list of 15, and merge.

**How the check was done:**
- The Builder was swept in 33 states at 1440, 1280, 1024 and 390 px: its first visit, Components open, a component and a link chosen, Review, the reference topology at Fit and at 100%, each menu, each Analyze, Validate, Edit, Arrange and Help panel, Import and Clear canvas. The sweep counted page and console errors, text cut off or over other text, controls without a name, contrast, small text and tap targets.
- Then each feature was used in turn: add, connect, rename, remove, undo and redo, save and load, export and import, the keyboard, zoom, layouts and grouping, the presentation views, bulk edit, ports. The screenshots were looked at by eye, and each finding traced to its code.

**Sources:**
- W3C, WCAG 2.2:
  - [Understanding 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html): for all user interface components, "the name and role can be programmatically determined".
  - [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): text has "a contrast ratio of at least 4.5:1", with exceptions for large text.

**Mockup (the target):** [`docs/mockups/builder-sweep-mockup.html`](mockups/builder-sweep-mockup.html).
- 7 scenes have the edits, the block and the styles applied to Build 231.
- 7 "Today" scenes are Build 231.
- The screenshots are `docs/mockups/compare/builder-sweep-*.png`.

## The 15 items

Each item says what Build 231 did, what Build 232 does and where the change is. Build 232's checks, in section 1 below, cover every item. "Block, part N" is the part of the new block whose comment names item N.

### Broken behaviour

1. **Print / present, and a canvas that stopped answering once the topology was named.**
   - **Build 231:** `state.builderPresentation` was two things at once. Print / present (`builder-print-presentation`) sets it up as an object holding the deck's title, date and classification; View › Presentation (Build 99) kept its on/off flag in the same field, and set it to `false` as it loaded. So:
     - Print / present opened with its title and classification reading "undefined" and its date blank, and what was typed there was dropped: the deck kept its defaults.
     - Typing a topology name in the Inspector writes the name into that field as `state.builderPresentation.title` (Build 199), which turned `false` into an object. View › Presentation's guard took any value that isn't false as "on" and stopped every click, drag and key on cards, links and badges. From the first key typed in the name, nothing on the canvas could be chosen or moved, with nothing on screen to say why.
   - **Build 232:** View › Presentation's flag is `state.builderCleanView232`, and `state.builderPresentation` stays the object Print / present set up. Print / present opens with the topology's title, today's date and its classification, and uses what is typed there. A named topology's canvas answers as before.
   - **Where:** edits 4, 5 and 7.
2. **View › Presentation after a name.**
   - **Build 231:** with the name in the shared field, the first View › Presentation turned the flag from that object to `false`: it took two clicks to turn on.
   - **Build 232:** one click turns it on, the next off, and while it is on, cards and links don't respond, as before.
   - **Where:** edit 6.
3. **Help › Canvas controls and shortcuts.**
   - **Build 231:** the item pressed the help button, which shows or hides the help card. On a first visit, with the card showing, it hid it.
   - **Build 232:** a card that shows is left as it is; a hidden one is shown.
   - **Where:** edit 8.
4. **Route labels outgrew their boxes.**
   - **Build 231:** a route label's box is sized from its text's length in characters: 5.8 px a character and 18 px over (`builder-relationship-routing-controls`, and Build 123). Below 100% zoom the text grows to stay readable, up to 13 px (Build 141), but the box doesn't. At the first visit's 78% at 1440 px, "TCP/TLS or UDP" ran 1.5 and 2.1 px past its box's sides.
   - **Build 232:** after each placement, and whenever the zoom changes the text's size, a box narrower than its text and 18 px is widened about its own middle, and an issue badge drawn beside it moves with it. A box is never narrowed, so the page's own spacing is kept. "TCP/TLS or UDP" now has 8 px clear each side.
   - **Where:** block, part 4.
5. **Bundled labels sat off-centre.**
   - **Build 231:** a bundled management label gets " · N clients" added and its box widened (Build 164), but its text stayed centred on the old width. On the reference topology, "Phone-home and app delivery · 3 clients" started 25 px left of its box.
   - **Build 232:** the same pass puts each label's text back in the middle of its box.
   - **Where:** block, part 4.
6. **The review badge covered a chosen card's ⋯ menu.**
   - **Build 231:** a chosen card shows its ⋯ menu in its top right corner, where the review badge sits: they overlapped, 67 square pixels at the first visit's 78%, so a click on that corner could hit either.
   - **Build 232:** while a card is chosen, its badge sits just outside the corner, clear of the menu. Zoomed far out, where the badge is a dot, it stays where it was.
   - **Where:** styles.
7. **On a phone, "File handoff" was hidden.**
   - **Build 231:** on a phone each card shows connection handles under it ("Event data" and the others), on its outgoing link, where its route label goes. The label after the Syslog Server was drawn under its handle.
   - **Build 232:** on a phone the handles that show join the list of things route labels and badges keep clear of (Build 211's: containers' and type headers' controls), so the label is placed beside the handle.
   - **Where:** block, part 7.
8. **A message covered the help card.**
   - **Build 231:** a message on the canvas, such as "Imported … 17 components", sits at the canvas foot, where the help card is: it covered the card's text.
   - **Build 232:** while the help card shows, a message shows at the canvas top instead. Phones don't show the help card, and keep their messages where they were.
   - **Where:** styles.
9. **A first visit at 1280 px hid the cards' details.**
   - **Build 231:** a first visit folds Components when the topology would fit at under 70% (Build 231, item 19). At 1280 × 800 that gave 64%, and under 75% cards show only their names and links no labels (Build 163).
   - **Build 232:**
     - The fold happens at under 75%, the zoom from which cards show their details.
     - If the fit is still under 75% with Components folded, the Inspector's own Hide control is pressed too and the view fitted again: 90% at 1280 × 800.
     - An Inspector folded this way opens again at the first card or link chosen, by pointer or key. One the person folds stays folded, and a panel state the person has chosen is kept, as before.
     - At 1440 px nothing changes: Components folds, and the fit is 78%, with the Inspector open.
   - **Where:** edits 9 and 10; block, part 9.

### Accessibility

10. **Text under 11 px in the Builder's panels.**
    - **Build 231:** its 11 px floor was made from each page as it opens, so the Builder's panels that show only once something is chosen or opened weren't measured. The Inspector's field labels were 8.96 px, "＋ Insert a component on this link" 9.9 px and the change-impact preview's labels 8.3 px.
    - **Build 232:** the same method, run over 103 states: every page as it opens, and the Builder with each component and link chosen on each Inspector tab, each menu, panel and dialog. 1,182 pieces of text under 11 px, counted in each state they show in; the floor covers 1,157. The 25 left are the OV table cells Build 231's floor left, where a selector would also reach larger text.
    - **Where:** styles (the floor).
11. **Two search boxes without names.**
    - **Build 231:** Analyze › Inventory's and Validate › Rules' search boxes had only a placeholder.
    - **Build 232:** they are named "Search the inventory" and "Search rules or evidence".
    - **Where:** edits 2 and 3.
12. **The help card's text.**
    - **Build 231:** 4.31:1 against the card, under WCAG's 4.5:1.
    - **Build 232:** `#8aa1b3`, 4.94:1.
    - **Where:** styles.

### Small

13. **Save's suggested name.**
    - **Build 231:** "Custom topology", unless a saved topology was chosen, while the Inspector shows the topology's title.
    - **Build 232:** the name typed in the Inspector, else the title it shows; a chosen saved topology's name still comes first.
    - **Where:** edit 1.
14. **A card's status dot.**
    - **Build 231:** the dot sat over the first letter of the card's top label.
    - **Build 232:** it sits in the corner, clear of the label.
    - **Where:** styles.

### The connector tool

15. **`tools/builder-connector-check.js` counted labels the zoom hides.**
    - **Build 231's handoff** reported 20 "badge over label" findings on Build 230 and said the badge still covered the File handoff label at 58% to 70%. Under 75% the Builder hides route labels and draws each issue badge on its link (Builds 163 and 164), but the tool measured the hidden label's box: none of those findings can be seen.
    - **Build 232:** the tool counts a label the zoom hides as hidden, and checks its badge is on the line, as it does for a label hidden for lack of room. On Build 230: 20 findings of a badge over a label with the tool as it was, none, and 38 labels reported as hidden at that zoom with their badges on the line with it fixed. Build 231's handoff note is corrected to say so.
    - **Where:** `tools/builder-connector-check.js`; `docs/builder-handoff-explorer-review.md`.

### Not covered

- **Moving a card with the keyboard.** The arrow keys move between cards, as the help card says, not the card itself; in Free layout a card moves only by dragging.
- **The 25 pieces of text under 11 px** that Build 231's floor left, in OV tables.
- **What the sweep found that isn't a fault:** a panel or menu open over the canvas covers the cards under it; Export JSON first offers a review of unresolved values; Insert on a file handoff offers no component, as nothing goes between a Syslog Server and the forwarder that reads its files.

## The edits

The lines are Build 231's.

1. **Line 1,633, in the page's markup.** Save's suggested name (item 13): Save suggested "Custom topology" unless a saved topology was chosen. It now suggests the topology's own name: the one typed in the Inspector, else the title the Inspector shows.
```
old: name=(prompt('Topology name',current||'Custom topology')||'').trim();
new: name=(prompt('Topology name',current||state.builderPresentation?.title||defaultPresentationTitle()||'Custom topology')||'').trim();
```
2. **Line 2,387, in `<script id="builder-architecture-inventory">`.** Analyze › Inventory's search box (item 11): It had only a placeholder; it is named "Search the inventory".
```
old: <input id="inventorySearch" type="search" placeholder=
new: <input id="inventorySearch" type="search" aria-label="Search the inventory" placeholder=
```
3. **Line 2,410, in `<script id="builder-architecture-rule-engine">`.** Validate › Rules' search box (item 11): The same: it is named "Search rules or evidence".
```
old: <input id="rulesSearch" type="search" placeholder=
new: <input id="rulesSearch" type="search" aria-label="Search rules or evidence" placeholder=
```
4. **Line 3,394, in `<script id="builder-minimap-presentation-v99">`.** View › Presentation's flag (item 1): View › Presentation kept its on/off flag in state.builderPresentation, which Print / present had set up as an object for its title, date and classification; this line replaced the object with false. The flag is now state.builderCleanView232.
```
old: state.builderPresentation=false;const presentationNavButton=document.createElement('button');
new: state.builderCleanView232=false;const presentationNavButton=document.createElement('button');
```
5. **Line 3,396, in `<script id="builder-minimap-presentation-v99">`.** Drawing View › Presentation's state (item 1): The same flag, where the canvas and the button show it.
```
old: function syncBuilderPresentation(){const active=!!state.builderPresentation;
new: function syncBuilderPresentation(){const active=!!state.builderCleanView232;
```
6. **Line 3,397, in `<script id="builder-minimap-presentation-v99">`.** Switching View › Presentation (item 2): The same flag, where the menu item and button switch it. Typing a topology name had put {title} in the shared field, so the first switch turned it off.
```
old: function toggleBuilderPresentation(){state.builderPresentation=!state.builderPresentation;if(state.builderPresentation){
new: function toggleBuilderPresentation(){state.builderCleanView232=!state.builderCleanView232;if(state.builderCleanView232){
```
7. **Line 3,399, in `<script id="builder-minimap-presentation-v99">`.** What View › Presentation blocks (item 1): While the flag is on, clicks, drags and keys on cards, links and badges are stopped. With the shared field, a typed topology name turned this on and the canvas stopped responding.
```
old: $('.builderCanvas').addEventListener(type,event=>{if(!state.builderPresentation)return;
new: $('.builderCanvas').addEventListener(type,event=>{if(!state.builderCleanView232)return;
```
8. **Line 12,193, in `<script id="builder-menubar-v198">`.** Help › Canvas controls and shortcuts (item 3): The item pressed the help button, which shows or hides the help card, so with the card showing it hid it. It now leaves a card that shows as it is.
```
old: item(help,'Canvas controls and shortcuts',{run:()=>q('.builderSpaceHelp140')?.click()});
new: item(help,'Canvas controls and shortcuts',{run:()=>{const card=q('.builderSpaceHelpPopover140');if(card&&!card.hidden&&card.checkVisibility())return;q('.builderSpaceHelp140')?.click()}});
```
9. **Line 18,167, in `<script id="explorer-review-v231">`.** The first visit's fold, its note (item 9): The note says 75%.
```
old: // ---- 19. The Builder on a first visit: when the topology would fit at under 70%, the Components panel starts folded so
new: // ---- 19. The Builder on a first visit: when the topology would fit at under 75%, the Components panel starts folded so
```
10. **Line 18,174, in `<script id="explorer-review-v231">`.** The first visit's fold (item 9): Build 231 folded Components when the fit was under 70%, but cards show their details and links their labels from 75%. It now folds at under 75%, and after its fit calls builderFirstFit232, which folds the Inspector too when the fit is still under 75%.
```
old: if(v.initialized&&v.zoom<.7){const hide=document.getElementById('builderPaletteDrawerClose');if(hide?.checkVisibility())hide.click();else toggleBuilderCanvasPalette();requestAnimationFrame(()=>{try{fitBuilderView()}catch(e){}});return}
new: if(v.initialized&&v.zoom<.75){const hide=document.getElementById('builderPaletteDrawerClose');if(hide?.checkVisibility())hide.click();else toggleBuilderCanvasPalette();requestAnimationFrame(()=>{try{fitBuilderView()}catch(e){}window.builderFirstFit232?.()});return}
```

## The new block

**`<script id="builder-sweep-v232">`** goes right after `explorer-review-v231`'s `</script>` (line 18,228 of Build 231). It contains [`docs/mockups/builder-sweep-prototype.js`](mockups/builder-sweep-prototype.js), and uses the page's own functions.

It wraps these:
- `builderPlaceLabels149`, `builderBundleLabels163` and `builderBadges164`, to fit the labels after each (part 4);
- `applyBuilderViewport`, to fit them again when the zoom changes their text's size (part 4);
- `builderLabelObstacles211`, to add a phone's connection handles (part 7).

It sets `window.builderFirstFit232`, which Build 231's first-visit fold calls after its fit (edit 10, part 9), and listens for the first selection after it folds the Inspector. `window.builderSweep232` gives `fitLabels`.

Its styles, **`<style id="builder-sweep-v232-styles">`**, go right after `explorer-review-v231-styles`'s `</style>` (line 16,765).

## Build records

After the edits and the block, in a new `<script id="builder-sweep-records-v232">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Fixes from a check of the Builder page','A named topology’s canvas answers again, and Print / present shows and uses its own title, date and classification. Route labels fit their boxes, a chosen card’s badge clears its menu, a phone’s File handoff label shows, messages clear the help card, a 1280 px first visit opens with full detail, and the Builder’s panels have no text under 11 px.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 231 did in its records, with Build 232 and 25 Nov 2026.

## Check before uploading

Run with Build 231 + the edits, the block and the styles, and with Build 231 for comparison.

### 1. The checks: 29. All pass with the edits; 25 fail on Build 231

Each check opens the page as a person would and does what the item is about. There is one or more per item from 1 to 14, and one for page errors; item 15 is checked by running the tool, in section 3.

The four that pass on Build 231 too check that the fixes keep what was right:
- at 100% the label text is 11.5 px, the size the boxes are made for;
- at 1280 px the first card chosen shows in the Inspector, which Build 231 keeps open from the start;
- at 1440 px the first visit opens at 78%, with the Inspector open, as Build 231 made it;
- and neither page has a page error.

### 2. The Builder, swept before and after

The sweep of the review, in the Builder's 33 states:

| In the 33 states | 1440 px: Build 231 | 1440 px: new | 1280 px: Build 231 | 1280 px: new | 1024 px: Build 231 | 1024 px: new | 390 px: Build 231 | 390 px: new |
|---|---|---|---|---|---|---|---|---|
| Page or console errors | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Controls without a name | 2 | 0 | 2 | 0 | 2 | 0 | 0 | 0 |
| Text under 10 px | 45 | 8 | 161 | 24 | 41 | 4 | 31 | 0 |
| Text under WCAG contrast | 162 | 140 | 162 | 140 | 92 | 74 | 0 | 0 |
| Text cut off in its box | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Tap targets under 24 px | — | — | — | — | — | — | 43 | 43 |

The sweep counts text under 10 px, as the review's did; under 11 px is item 10's own check, in section 1. Text under 10 px that remains with the edits is on the canvas's cards, which scale with the zoom (`.unifiedNodeWrap > button.builderNodeIssueMarker.reviewOnly`). At 390 px the menus are under More, which the sweep doesn't open: 6 of the 33 states differ from the canvas as it opens there. Text over other text isn't in the table: almost all of it is a menu, panel or dialog drawn over the canvas, as it should be; the cases found by eye are items 7 and 8.

The review's sweep of every page, as Build 231's handoff ran it:

| At each width | 1440 px: Build 231 | 1440 px: new | 1024 px: Build 231 | 1024 px: new | 390 px: Build 231 | 390 px: new |
|---|---|---|---|---|---|---|
| Page errors | 0 | 0 | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 | 0 | 0 |
| Text under WCAG contrast | 35 | 34 | 33 | 32 | 30 | 30 |
| Text under 10 px | 139 | 139 | 139 | 139 | 167 | 167 |
| Tap targets under 24 px | — | — | — | — | 108 | 108 |
| Ids used more than once | 576 | 576 | 576 | 576 | 576 | 576 |

Other sweeps:
- **Every control used once:** Build 231, 1,791 controls; the new page, 1,791. None leaves a page error on either. The sweep itself can’t click an SVG part with `click()`, or read the options of one list in the parsing laboratory (102 and 102). Controls with no effect it could see: 104 and 104.
- **Round the pages:** ten rounds on each page. Over rounds 2 to 10 the median is 38,252 DOM nodes on Build 231 and 38,260 on the new page, from 38,252 to 40,758 and from 38,258 to 39,286; the heap grows 0.37 MB and 0.38 MB a round after the first.
- **Cut off by a box that hides overflow:** at 390 px, 12 on Build 231 and 12 on the new page, all on the Builder canvas, which pans; at 1440 px, none on either.

### 3. Regression against Build 231

The same snapshots as Build 231’s regression, of Build 231 and the new page. Build 232 changes nothing they read: its label boxes, badge and dot positions and type sizes are geometry and style, which the Builder snapshots don’t take (they take text, and each card’s box); the first visit’s folds don’t happen, as both pages have the Builder’s docked panels stored as open; and the two search boxes’ names are attributes. Build 231’s own set-asides are kept: both pages have Build 231’s changes, so they apply to both alike.

| What is compared | Result |
|---|---|
| View text, every view; Operations pages; OV pages | 59 of 59 the same |
| Every path: the Flow view's text and the route | 25 of 25 the same |
| Every failure's detail and owners; every symptom | 145 of 145 the same |
| The Config view, with no files, the example, the Fortinet add-on's four files and its package | 279 of 279 the same |
| Four Builder topologies, each component's inspector on each of its tabs | 60 of 60 the same |
| The same topologies, each link's inspector | 16 of 16 the same |
| The same topologies: the canvas's text, every card's text and box, the rules' results, the validation, every link's label and details, the network overlay, the topology file and the architecture report | 32 of 32 the same |
| Page errors | None on either |

Each comparison takes Build 231 twice, to set aside whatever varies from run to run: nothing did. 617 of the 617 snapshots are the same before any normalising.

**The earlier suites and tools**, on both pages:

| Suite or tool | Build 231 | Build 231 + the edits |
|---|---|---|
| Build 231’s 37 checks | 37 of 37 | 37 of 37 |
| Build 230’s 29 checks | 29 of 29 | 29 of 29 |
| Build 230’s 26 checks of its block, in Node | 26 of 26 | 26 of 26 |
| Build 229’s 26 checks | 26 of 26 | 26 of 26 |
| Build 229’s 13 checks of its block, in Node | 13 of 13 | 13 of 13 |
| Build 228’s 36 checks | 36 of 36 | 36 of 36 |
| Build 228’s 39 checks of its block, in Node | 39 of 39 | 39 of 39 |
| Build 227’s 47 checks | 47 of 47 | 47 of 47 |
| Build 227’s 31 checks of its block, in Node | 31 of 31 | 31 of 31 |
| Build 226’s 29 checks | 29 of 29 | 29 of 29 |
| Build 226’s 78 checks of its blocks, in Node | 78 of 78 | 78 of 78 |
| Build 225’s 24 checks, as Build 226 runs them | 24 of 24 | 24 of 24 |
| Lookup checks: 54 checks, as Build 226 runs them | 54 of 54 | 54 of 54 |
| Build 224’s 51 checks, as Build 225 runs them | 51 of 51 | 51 of 51 |
| Build 224’s own 51 checks | 48 of 51 as written † | 48 of 51 as written † |
| Lookup checks: 54 checks, as Build 223’s handoff wrote them | 46 of 54 as written † | 46 of 54 as written † |
| Event types, tags and CIM data models: 64 checks (Build 222’s handoff) ‡ | 63 of 64 as written † | 63 of 64 as written † |
| The Config view handoff’s 70 checks, with the expectation Build 222’s handoff rewrote ‡ | 69 of 70 as written † | 69 of 70 as written † |
| The source type map’s 82 checks | 82 of 82 | 82 of 82 |
| The splits’ 40 checks, with the map’s tools taken out as Build 224’s handoff says | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines’ 31 checks | 31 of 31 | 31 of 31 |
| The space tool | Meets every target | Meets every target; on a first visit at 1280 px the canvas gets 71%, for 52%, as the Inspector folds too; the same at the other sizes |
| The connector tool, as fixed (item 15) | Every connector OK | Every connector OK |
| The Builder’s redraws, 4 components: budget 40 ms § | 30 ms; 41 ms after a card moves | 37 ms; 34 ms after a card moves |
| The Builder’s redraws, 5 components: budget 50 ms § | 48 ms; 49 ms after a card moves | 45 ms; 47 ms after a card moves |
| The Builder’s redraws, 8 components: budget 80 ms § | 87 ms; 93 ms after a card moves | 82 ms; 82 ms after a card moves |
| The Builder’s redraws, 17 components, the reference topology: budget 120 ms § | 85 ms; 115 ms after a card moves | 89 ms; 89 ms after a card moves |
| The offline check, with the Fortinet add-on’s package | 23 of 23 | 23 of 23 |

**The Config view's results that Splunk checked** are the same on both pages: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

† As before: three of Build 224’s checks want what Build 225 changed; eight of the lookup checks, as first written, want what Build 226 changed; one of Build 222’s wants a folder’s macros.conf counted among the skipped files; one of the Config view handoff’s wants Where it acts right above the file tabs.

‡ These two have a 2.5-second page-load limit. They finished as written on both pages, and gave the same results with only that limit raised to 15 seconds.

§ `tools/builder-perf-check.js`, five runs on each page in turn after the other checks: the medians of its redraw after a change, and after a card moves. Over its budget on one page or both: 4 components, 8 components.

### 4. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 231 | With the edits |
|---|---|---|
| Loading the page (to the load event) | 1,878.8 ms (1,621.2 to 2,103.3) | 1,831.7 ms (1,689.1 to 2,294.2) |
| The ten views, each to its next frame (all ten) | 2,608.1 ms (2,371.0 to 3,229.4) | 2,609.2 ms (2,243.6 to 3,065.6) |
| The 28 OV pages, each to its next frame (all) | 3,006.9 ms (2,571.5 to 3,346.9) | 3,002.7 ms (2,377.1 to 3,316.1) |
| Builder redraw, its own topology | 44.8 ms (36.9 to 59.5) | 47.6 ms (39.9 to 58.3) |
| Drawing the change register | 29.1 ms (23.5 to 44.9) | 32.2 ms (23.4 to 52.2) |
| Restyling and laying out the page, on Changes | 26.4 ms (22.0 to 33.5) | 27.7 ms (19.9 to 44.8) |

Each figure with the edits is within Build 231’s spread, and Build 231’s within theirs.

### 5. The build

`index.html` as committed, Build 232, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 pass.
- The new checks pass on Build 232 as on the tested page: 29 of 29.

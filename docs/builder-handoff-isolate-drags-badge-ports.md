# Builder handoff: isolation, label and waypoint drags, the card badge and default ports (faults 21, 28, 35 to 37 and 50 to 52)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 219.
**8 in-place edits,** under "The edits", on 5 lines. Each old string occurs exactly once in Build 219, and no edit changes the number of lines.
**No new blocks,** apart from the build records.

The edits are also in [`docs/mockups/isolate-drags-badge-ports.diff`](mockups/isolate-drags-badge-ports.diff), a unified diff against Build 219's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The faults:**
- **21, 28, 35, 36 and 37** are numbered as in the Build 215 recheck ([`builder-handoff-build215.md`](builder-handoff-build215.md), "Still open"). They are the five Builder faults there that break something outright.
- **50, 51 and 52** are new: found while testing those fixes, and fixed with them. 50 and 51 are 35 and 36 over again, in the waypoint handle's code beside the label's. 52 is what fixing 28 alone would leave on the canvas.

**Mockup (the target):** [`docs/mockups/isolate-drags-badge-ports-mockup.html`](mockups/isolate-drags-badge-ports-mockup.html). Six scenes have the edits applied to Build 219, and the six "Today" scenes are Build 219, each set up by the same steps. The screenshots are `docs/mockups/compare/isolate-drags-badge-ports-*.png`.

**Tested first:** the edits were applied to Build 219 and run. The results under "Check before uploading" come from that run.

## The faults

### 28. Isolating a region or an environment throws, and can't be cleared

**What you see,** in the reference topology (`docs/mockups/ov1-reference-topology.json`), on choosing Isolate by region, AWS ap-southeast-2, in Navigate under the Find box's ⋯ options:
- **The page throws** "Assignment to constant variable.", on that redraw and on every one after it while the isolation is on.
- **The canvas shows the region's one card and all 12 links,** between cards the isolation has hidden, with no issue badges.
- **The Find box and its ⋯ options leave the toolbar.** The Find box is left under the canvas, the page is 47 px taller, and the options, where Clear isolate is, aren't on the page at all. The isolation stays until the page is reloaded.
- **By environment, the same,** once a card is in a second environment.

**Why:** `applyLargeTopologyNavigation` (`builder-large-topology-navigation`, line 2736) declares `involved` with `const`, together with the link's two ends, and then sets it to `true` for a link that joins a hidden card. The assignment throws. The redraw stops there, so no link is hidden, and none of its later steps run: the label placement, the issue badges, and the step that puts the Find box and its options in the toolbar.

### 52. A hidden link's label keeps its leader line

**What you see:** collapse a container. A link into it is hidden, and its label with it. Where that label had been placed off its link, the leader line between the two is still drawn, on its own.
- **In the zones topology** (`docs/mockups/sv-zones-topology.json`), with the Universal Forwarders in a collapsed container: one leader, 18 units long, on Deployment Server 1's link line, for the hidden label "Phone-home and app delivery · 3 clients".
- **In 5 of 8 cases tried:** the zones and the reference topology, each with four containers collapsed in turn.
- **Isolation would show them too** once fault 28 is fixed: 1 to 4 leaders in every isolated region of the two topologies.

**Why:** hiding marks a link's lines and its label `navHidden` (`applyLargeTopologyNavigation`, line 2736). Build 157's label placement (`builderPlaceLabels149` in `builder-canvas-review-v156`, line 7898) runs after it, over every label, and draws a leader for any label it places more than 15 units from its link. The leader is an element of its own, and nothing hides it.

### 35. Dragging a link's label moves it by its first step only

**What you see:** drag a link's label 42 px up, in six steps. It moves 7 px, the first step, and the rest of the drag does nothing. A second drag does the same from there.

**Why:** the label's press (`wireRelationshipRoutingHandles` in `builder-relationship-routing-controls`, line 2577) takes the link's routing record, and each move writes the label's offset to it.
- `ensureRelationshipRouting` (line 2561) puts a fresh, cleaned copy of the record in the link's store every time it is called.
- The first move's own redraw of the route calls it. From then on the record the drag holds is the old copy, and its later moves change nothing that is drawn or kept.
- In the canvas's units, at the 58 % the built-in topology opens at, the 42 px drag should store 73. It stores 12.

### 36. Dragging an additional data link's label moves nothing

**What you see:** add a second data link into a card (here Syslog Source 1 to Indexer 1) and drag its label by its text. Nothing moves, and Undo gains "Move connector label".

**Why:** the same press finds its link with `builderEdgeRecord(plane, Number(id))`. An additional data link's id is text, such as "data-rel-1", so the number is NaN and no link is found. The drag then writes to a routing record that belongs to no link. The label's click, beside it on the same line, already keeps such an id as text.

### 50. Dragging a waypoint moves it by its first step only

**What you see:** select a link, add a waypoint on the Inspector's Route tab, and drag its handle 20 px right and 70 px up, in six steps.
- **During the drag** the handle follows the pointer, and the link's line stays at the drag's first step.
- **On release** the handle springs back to that first step, 3 px right and 12 px up.

**Why:** the handle's press and move, before the label's on line 2577, are written the same way. Each move writes the waypoint to the routing record taken at the press, and the route it then draws puts a fresh copy in the store. The handle is placed from the old record, so it alone follows the pointer.

### 51. Dragging an additional data link's waypoint moves nothing

**What you see:** the same drag on an additional data link's waypoint. The handle follows the pointer and the line doesn't move. On release the handle is back where it started, and Undo has gained "Move connector waypoint".

**Why:** the handle's press finds its link with `Number(id)`, as the label's does.

### 37. A card's issue badge selects the card without showing it

**What you see:** click the numbered badge on a card, or press Enter on it. Its findings open. The card isn't outlined, and the Inspector goes empty. Both catch up at the next redraw.

**Why:** the badge's `onclick` (`drawBuilderIssueMarkers` in `builder-context-focus-issues`, line 3149) sets `state.builderSelected` and opens the findings, and nothing draws the selection. A link's badge, further along the same line, has selected its link since Build 212 with `selectObjectBeforeCanvasDrawer`. That is `selectBuilderObjectFast` (line 3283), which refreshes the canvas's outline and the Inspector, without the step that opens the Inspector over the canvas below 1,280 px (line 3345).

### 21. Syslog and search dispatch links get port 0

**What you see:**
- **The built-in topology's Syslog Source 1 → Syslog Server 1** has port 0. So has any new link from a syslog source to a syslog server or to an Edge Processor.
- **A new Indexer → Search Head link,** "Search dispatch", has port 0.
- **The OV pages count the port as unset.** For the built-in topology, AV-1 raises finding I-08, "Links with no port"; SV-1 gives the interface's port as "Not set", with "usually 514, or 6514 with TLS" beside it and a "PORT NOT SET" note below; and SV-2, SV-6, SV-10c and OV-6c say the same in their own words.

**Why:** a link's details start from `defaultRelationshipDetails`, which reads the port from the link's protocol text with `inferredRelationshipPort` (`builder-enhanced-relationship-inspector`, line 2308). "TCP/TLS or UDP", the label of a syslog source's link to a syslog server (line 1674), "Syslog to Edge Processor" (line 3602) and "Search dispatch" (line 1678) name no port, so each gives 0. `usual188` (line 9993), which gives the SV pages their "usually" text, already has both answers: 514, or 6514 with TLS, and 8089.

## The fix

- **28:** `involved` takes its whole value where it is declared: true for a link into a collapsed container, as before, or for a link that joins a hidden card.
  - Isolating AWS ap-southeast-2 shows its one card and none of the 12 links, with no error. Each of the two topologies' regions shows just the links between its own cards. By environment, the same.
  - The redraw runs to its end: the links still drawn have their issue badges, and the Find box, its options and Clear isolate stay where they are. Clear isolate brings every card and link back.
- **52:** the label placement draws no leader for a label that is `navHidden`. A hidden link's label has none, isolated or in a collapsed container, and the links still drawn keep theirs.
- **35:** each move writes the label's offset to the link's routing record as it is at that moment.
  - A 42 px drag stores the whole drag, 73 in the canvas's units, and a second drag starts from where the label is. The Inspector's Label offsets read the same.
  - The label is drawn where a label with that offset goes. Labels are still placed by Build 157's rules: see "Found while testing", 1.
  - One drag is one Undo step, and Undo puts the label back.
- **36:** the press keeps an additional data link's id as text, as the click does. Its label stores the drag and is drawn there, with one Undo step. The label of the first link into the same card stays where it was.
- **50:** each move takes the link's routing record as it is at that moment, writes the waypoint to it, and places the handle from it. The link runs through the handle during the drag, and the waypoint stays where it is let go. One drag is one Undo step.
- **51:** the handle's press keeps an additional data link's id as text. Its waypoint follows the drag and stays, with one Undo step, and the other links' waypoints stay where they were.
- **37:** a card's badge selects its card the way a link's badge selects its link, then opens its findings.
  - The card is outlined and the Inspector shows it at once. Another card's badge moves the selection. Enter on a focused badge does the same.
  - Below 1,280 px, where the Inspector opens over the canvas, the badge leaves it closed, so the findings aren't covered. Opening it shows the card. A link's badge has done this since Build 212, with the same call.
- **21:** `inferredRelationshipPort` gives a syslog link 514, or 6514 when its protocol names 6514 or is TLS with no UDP, and a search dispatch link 8089, the indexers' management port.
  - The built-in topology's Syslog Source 1 → Syslog Server 1 starts at 514, a new syslog link into an Edge Processor at 514, and a new Indexer → Search Head link at 8089.
  - The new tests come after the function's others, so they change only what gave 0. A file handoff still has no port, and Splunk-to-Splunk keeps 9997.
  - **A port a link or a file already holds stays, 0 included,** as after the quick fixes. The reference topology stores 0 for these links and keeps it.
  - For the built-in topology, finding I-08 and the "PORT NOT SET" notes go, and the OV pages give 514: see "Check before uploading", 2.
- **Unchanged:** a click on a label still selects its link and moves nothing, and a press on a label's issue badge still opens the link's findings and starts no drag.

## The edits

In Build 219's `index.html`, in the order they come in the file. Each old string occurs exactly once; each new string is one line, as its old one is. Line 2,577 takes four.

**1. Fault 21, line 2,308.** `<script id="builder-enhanced-relationship-inspector">`, `inferredRelationshipPort`. After the function's other tests, so only what gave 0 changes: a search dispatch link gives 8089, and a syslog link 514, or 6514 when its protocol names 6514 or is TLS with no UDP.
```
old: if(text.includes('https')||text.includes('rest')||text.includes('s3'))return 443;return 0}
new: if(text.includes('https')||text.includes('rest')||text.includes('s3'))return 443;if(text.includes('search dispatch'))return 8089;if(text.includes('6514'))return 6514;if(text.includes('syslog')||text.includes('tcp/tls or udp'))return /\btls\b/.test(text)&&!/\budp\b/.test(text)?6514:514;return 0}
```

**2. Fault 51, line 2,577.** `<script id="builder-relationship-routing-controls">`, `wireRelationshipRoutingHandles`: the waypoint handle's `pointerdown`. The waypoint handle's press finds its link by its id as it is: an additional data link's id is text, and isn't turned into a number.
```
old: const edge=builderEdgeRecord(handle.dataset.routePlane,handle.dataset.routePlane==='data'?Number(handle.dataset.routeEdge):handle.dataset.routeEdge),routing=ensureRelationshipRouting(edge),index=
new: const edge=builderEdgeRecord(handle.dataset.routePlane,handle.dataset.routePlane==='data'&&!handle.dataset.routeEdge.startsWith('data-rel-')?Number(handle.dataset.routeEdge):handle.dataset.routeEdge),routing=ensureRelationshipRouting(edge),index=
```

**3. Fault 50, line 2,577.** The same function: the waypoint handle's `pointermove`. Each move takes the link's routing record as it is then, writes the waypoint to it, and places the handle from it.
```
old: const point=svgPointerPosition(moveEvent,svg);routing.waypoints[index]=cleanFreePosition(point)||routing.waypoints[index];const layout=
new: const point=svgPointerPosition(moveEvent,svg),routing=ensureRelationshipRouting(edge);routing.waypoints[index]=cleanFreePosition(point)||routing.waypoints[index];const layout=
```

**4. Fault 36, line 2,577.** The same function: the label's `pointerdown`. The label's press does the same. Its click, just before it on this line, already does.
```
old: const edge=builderEdgeRecord(label.dataset.routePlane,label.dataset.routePlane==='data'?Number(label.dataset.routeEdge):label.dataset.routeEdge),routing=ensureRelationshipRouting(edge),start=
new: const edge=builderEdgeRecord(label.dataset.routePlane,label.dataset.routePlane==='data'&&!label.dataset.routeEdge.startsWith('data-rel-')?Number(label.dataset.routeEdge):label.dataset.routeEdge),routing=ensureRelationshipRouting(edge),start=
```

**5. Fault 35, line 2,577.** The same function: the label's `pointermove`. Each move writes the label's place to the link's routing record as it is then, not to the copy taken at the press.
```
old: routing.labelOffset={x:start.x+point.x-origin.x,y:start.y+point.y-origin.y};
new: ensureRelationshipRouting(edge).labelOffset={x:start.x+point.x-origin.x,y:start.y+point.y-origin.y};
```

**6. Fault 28, line 2,736.** `<script id="builder-large-topology-navigation">`, `applyLargeTopologyNavigation`. `involved` takes its whole value where it is declared, so nothing assigns to the constant afterwards.
```
old: ,involved=fromGroup||toGroup;if(!largeNavNodeVisible(fromNode)||!largeNavNodeVisible(toNode)){involved=true}
new: ,involved=fromGroup||toGroup||!largeNavNodeVisible(fromNode)||!largeNavNodeVisible(toNode);
```

**7. Fault 37, line 3,149.** `<script id="builder-context-focus-issues">`, `drawBuilderIssueMarkers`: a card badge's `onclick`. A card's issue badge selects its card the way a link's badge selects its link, then opens its findings.
```
old: marker.onclick=event=>{event.preventDefault();event.stopPropagation();state.builderSelected=id;showBuilderIssuePopover({kind:'node',id},marker)};
new: marker.onclick=event=>{event.preventDefault();event.stopPropagation();(typeof selectObjectBeforeCanvasDrawer==='function'?selectObjectBeforeCanvasDrawer:selectBuilderObjectFast)({kind:'node',id});showBuilderIssuePopover({kind:'node',id},marker)};
```

**8. Fault 52, line 7,898.** `<script id="builder-canvas-review-v156">`, `builderPlaceLabels149`. A label that is hidden with its link gets no leader line. The `else` after this `if` then marks it as having none.
```
old: if(Math.hypot(cx-point.x,cy-point.y)>15){const leader=document.createElementNS('http://www.w3.org/2000/svg','path');leader.setAttribute('class','builderLabelLeader157');
new: if(Math.hypot(cx-point.x,cy-point.y)>15&&!label.classList.contains('navHidden')){const leader=document.createElementNS('http://www.w3.org/2000/svg','path');leader.setAttribute('class','builderLabelLeader157');
```

In edit 3, `routing` is declared again inside the move, so the uses after it in the same function, which place the handle, read the record the move has just written. The `routing` taken at the press is then unused, and is left as it is.

## Build records

After the edits, in a new `<script id="builder-drag-isolation-records-v220">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Isolation, label and waypoint drags, the card badge and default ports','Isolating a region or an environment no longer fails: only the links between the cards still shown are drawn, with no stray leader lines, and Clear isolate stays in reach. A link’s label and its waypoints follow a drag all the way, an additional data link’s too. A card’s issue badge shows its card selected at once. New syslog links start at port 514 and search dispatch links at 8089.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 219 did in `app-packages-records-v219`, with Build 220.

## Found while testing (not changed)

1. **Where a dragged label is drawn is still Build 157's placement's to decide.** A drag stores its offset in full, and the placement draws the label at that offset where it may. At 125 %, on Syslog Server 1 → Universal Forwarder 1:
   - **Up to 60 units from its link,** the label is drawn where it is let go, 19 units along the link: drags of 40 and 60 units up, and of 50 down.
   - **Past 60 units** it is drawn nearer: a 75-unit drag at 57 units, and a 120-unit drag at 40, up or down.
   - **Let go on a card,** the label isn't drawn, and the link shows its issue badge alone.
   - Undo, or the Label offsets on the Inspector's Route tab, bring it back.
2. **Zoomed out, a label that shows as its issue badge alone can still be dragged by where its text would be.** At the 58 % the built-in topology opens at, Build 163 hides a label's box and text, and the box still takes a press. The label checks below press there.
3. **A waypoint let go under a card can't be picked up again:** cards are drawn over the link layer, so the press lands on the card. "Remove last" and "Reset route", on the Inspector's Route tab, take it away.
4. **A link's label sits at the middle of its route, and a link's one waypoint is often there too,** so the handle can sit on the label's end, as in the mockup's waypoint scene.
5. **A waypoint stays 24 units inside the canvas's top and left edges:** a drag past them stops there (`cleanFreePosition`, line 2501).
6. **`inferredRelationshipPort` reads a protocol's words, not its numbers.** A protocol that names another port gets the usual one for its word: "HEC HTTPS 8443" gives 8088, as before, and "Syslog TCP 1514" now gives 514, where it gave 0.
7. **Other links whose usual port the SV pages know still start with none:** an Outbound handoff set to UDP or to TCP/TLS, and Splunk Cloud search. `usual188` has 514, or 6514 with TLS, for the first two, and 8089 for the third.
8. **The Find box's record of a component has the same `Number(id)`** (`componentSearchRecord`, line 2671), so an additional data link's endpoint, port and owner aren't in what a search looks through. This is from reading the code; it wasn't tried.
9. **A hidden label still takes its place in the placement,** so a label placed after it keeps clear of where it would be. Also from reading the code (`builderPlaceLabels149`); no case of it was looked for.

Items 2 to 5 are as on Build 219.

## Check before uploading

Run with Build 219 + the edits, and with Build 219 as shipped for comparison.

### 1. The faults: 46 checks. All pass with the edits; 24 fail on Build 219

At 1,440 × 900 unless a width is given. The built-in topology opens at 58 %, where 1 px is 1.73 of the canvas's units. Drags are made in six steps.

| Fault | Checks | With the edits | Build 219 |
|---|---|---|---|
| 28 | 7 | Isolating AWS ap-southeast-2 in the reference topology: no error; 1 card and none of the 12 links; the Find box and its options in the toolbar, Clear isolate uncovered, the page no taller. Pressing Clear isolate brings all 17 cards and 12 links back. By environment, with one card moved to "Test": no error, 1 card, no links; cleared, all back. Each of the reference and zones topologies' 12 regions in turn: just the links between its own cards drawn | 6 fail. "Assignment to constant variable." at each isolation; 1 card and all 12 links, by region and by environment; no options in the toolbar, the page 47 px taller, Clear isolate not to be pressed; all the links drawn in each of the 12 regions |
| 52 | 2 | Over the 12 isolated regions: no leader of a hidden link's label, and the links still drawn keep theirs. Over 8 collapsed containers (each topology's Syslog Servers, its Universal Forwarders, both together, and its Indexers, Search Heads and Heavy Forwarders): none | 2 fail. Collapsed: 5 of the 8 show one leader of a hidden link. Isolated: the redraw stops before any leader is drawn |
| 35 | 7 | The label of Syslog Server 1 → Universal Forwarder 1, dragged 42 px up: 73 units stored, and the label drawn where the placement puts a label with that offset, 55 units up ("Found while testing", 1). One Undo step, "Move connector label". A second drag, 24 px left and 12 px down, adds (−42, 21). The Inspector's Label offsets read both. Undo, twice, puts it back. A click without a drag selects the link and moves nothing | 4 fail. The first drag stores 12 units and moves the label 7 px; the second stores (−7, 3); the Inspector reads (−7, −9) |
| 36 | 4 | An additional data link, Syslog Source 1 → Indexer 1: its label, dragged 42 px up, stores 73 units and is drawn where the placement puts a label with that offset. One Undo step. The label of the first link into Indexer 1 stays | 1 fails. Nothing is stored and nothing moves; Undo gains its step all the same |
| 50 | 6 | The same link with a waypoint added, its handle dragged 20 px right and 70 px up: during the drag the stored waypoint and the handle are both at the pointer, (35, −121) units on; on release they stay. One Undo step, "Move connector waypoint". A second drag, 40 px left and 15 px down, starts from there. Undo, twice, puts it back | 3 fail. During the drag the handle is at the pointer and the stored waypoint (6, −20) units on; on release the handle is 3 px right and 12 px up. The second drag: (−12, 4) of (−69, 26) units |
| 51 | 4 | The additional data link's waypoint, dragged 10 px right and 65 px down: stored and drawn at the pointer, during the drag and after. One Undo step. The other link's waypoint stays | 1 fails. Nothing is stored; the handle is back where it started; Undo gains its step all the same |
| 37 | 8 | A click on Universal Forwarder 1's badge: within 120 ms the card is outlined and the Inspector names it; its findings are open, in view, with nothing over them. Indexer 1's badge moves the selection. Enter on Syslog Server 1's focused badge does the same. At 1,024 × 768: the card outlined, its findings uncovered, the Inspector left closed; opening it shows the card. No page errors at either width | 4 fail. After each click, and after Enter, no card is outlined and the Inspector is empty, at both widths. The findings open |
| 21 | 6 | The built-in syslog link: 514. A new Indexer 1 → Search Head 1 link: 8089. File handoff: none; Splunk-to-Splunk: 9997. A new Syslog Source → Edge Processor link: 514. The reference topology keeps the 0s it stores, and the zones topology its 514s and 8089. No page errors | 3 fail: 0, 0 and 0 |
| 35, 36, 50, 51 | 2 | No page errors over the label drags, nor over the waypoint drags | Pass |

### 2. Regression against Build 219

| Suite | Result |
|---|---|
| View text, every view, no Config files loaded | 9 of 10 the same. The OV view's differs by the line below for OV-1 |
| OV pages, each tab's text, for the built-in topology | 17 of 28 the same. 11 differ. Every line that differs, 66 taken out or put in, comes from the syslog link's port, now 514: |
| | AV-1: finding I-08, "Links with no port", goes, with its mention on SV-1, SV-2, SV-3, SV-6 and SV-10c: 4 medium issues become 3 |
| | SV-1: "1 port not set" becomes 0; SI-1's port reads 514 in place of "Not set" and "usually 514, or 6514 with TLS"; the "PORT NOT SET" note goes |
| | SV-2: "?" becomes 514. SV-6: "port not set" becomes "port 514". SV-10c and OV-6c: "514 (not set)" becomes 514, and their "PORT NOT SET" notes go |
| | OV-1: "Syslog UDP/TCP" becomes "syslog · 514", as Build 132 words a link with a port. OV-2, OV-3 and SvcV-2: "Syslog UDP/TCP 514". DIV-1: "TCP/TLS or UDP · 514" |
| The Config view with the example: the panel's HTML, the Matrix's HTML and the page's text, for every component and source type choice, and the page's text with no files | 76 of 76 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None |
| The space tool | The same output as Build 219 |
| The connector tool | The same output as Build 219 |
| The perf tool | Below |

Each comparison takes Build 219 twice, to set aside whatever varies from run to run; nothing did.

### 3. The perf tool

Eleven runs of each build, one after the other in turn. Each figure is the tool's median of five redraws, in ms: the middle run of the eleven, then the fastest.

| Scenario | Budget | Redraw, Build 219 | Redraw, with the edits | After a move, Build 219 | After a move, with the edits |
|---|---|---|---|---|---|
| default | 40 | 35 · 33 | 34 · 28 | 38 · 32 | 37 · 29 |
| fan5 | 50 | 49 · 37 | 47 · 37 | 45 · 39 | 48 · 40 |
| fan8 | 80 | 70 · 66 | 86 · 62 | 76 · 70 | 72 · 67 |
| reference | 120 | 90 · 73 | 85 · 75 | 113 · 88 | 111 · 92 |

- **The same within this container's spread,** which is wide: each scenario's runs fall in a faster and a slower band on both builds, and each build is over the tool's budgets in some of its runs.
- **fan8's redraw** is the one middle figure that differs by more than 5 ms: six of the edited build's runs fell in the slower band, and three of Build 219's. Its fastest run and its redraw after a move are under Build 219's, and its redraw with nothing changed is 2 ms over, 70 against 68.
- **Path lookups per redraw** are the same: 0, 10, 96 and 16.
- **In a redraw the edits add one test:** line 7898's, once for each label placed off its link. Line 2736 makes the calls it made before, or fewer.

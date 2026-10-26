# Handoff: Lanes round every page's cards, and canvas text at its final size (faults 41 and 31)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 214.
**Three in-place edits** in `builder-grouping-v130`, under "The edits". Each old string occurs exactly once in Build 214, and no edit changes the number of lines.
**One new block, at the end of the page (before `</body>`):** `<style id="canvas-text-v215">`, containing [`docs/mockups/lanes-and-text-prototype.css`](mockups/lanes-and-text-prototype.css). There is no script block.

The edits and the block are also in [`docs/mockups/lanes-and-text.diff`](mockups/lanes-and-text.diff), a unified diff against Build 214's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

Make the edits, paste the file as it is, then add the build records (see "Build records").

**The faults** are numbered as in the Build 214 recheck ([`builder-handoff-build214.md`](builder-handoff-build214.md)): 41 and 31.

**Mockup (the target):** [`docs/mockups/lanes-and-text-mockup.html`](mockups/lanes-and-text-mockup.html). Two scenes have the edits and the block applied to Build 214, and the two "Today" scenes are Build 214. The screenshots are `docs/mockups/compare/lanes-and-text-*.png`.

**Tested first:** the edits and the block were applied to Build 214 and run. The results under "Check before uploading" come from that run.

## The faults

### 41. Exported lanes miss their cards

**What you see,** in Export SVG, Export PNG and the architecture pack, grouped by tier, type, region or environment:
- **On every diagram, each lane is 30 px higher than its cards,** so each card's foot hangs 14 px below its lane. In the zones topology (`docs/mockups/sv-zones-topology.json`) grouped by tier, that is Export SVG and all 11 of the pack's topology diagrams.
- **On a page of one part of the topology, the lanes are where the whole topology's cards would be.** That is 5 of the pack's 6 one-region pages, grouped by tier. On "Region · Melbourne", the Sources lane runs down over the page's footer, and none of the page's 3 cards is in a lane. It is the same grouped by type, region or environment, in the reference topology (`docs/mockups/ov1-reference-topology.json`), and on a phone.
- **Exporting the current navigation view with a container collapsed,** the lanes count and place the container's members rather than its card: "Collection · 5" round 2 cards, and the collapsed card in no lane.

**Why:** Build 130 adds the lanes after the diagram is made (`builder-grouping-v130`, `architectureSvgForScope`, line 5415).
- **The wrong group.** It draws the lanes in the first group with a transform (line 5417). That is the legend's first entry, `translate(42 78)`, not the topology's group, `translate(42 108)`, which holds the cards.
- **The whole topology's layout.** It reads the cards' places from `unifiedBuilderPositions()` and the components from `state.builderNodes` (line 5419), but by then `withArchitectureExportScope` (line 2847) has put the whole topology back. A page of one region lays out only its own cards, so they are somewhere else than in the whole topology's layout. A collapsed container is one card on the page, and its members in the whole topology.
- The faults 38 to 40 handoff's check of the lanes (its C2), and the Build 214 recheck, compared the lanes' coordinates with the cards' without the two groups' translations, so they missed the first cause. This handoff's checks add up every group's translation.

### 31. Some canvas text grows a frame after each redraw

**What you see:** after each redraw, some canvas text is first drawn at 7.7 to 11.2 px and grows to 11.5 px a frame later, and whatever holds it grows with it. In the zones topology at 1,440 px:
- a collapsed container's box: 92 px tall, then 103 px;
- Indexer 1's card, with its "2 incoming data routes" badge: 249 px tall, then 252 px, as the badge grows from 121 × 22 to 147 × 25 px;
- the load balancer's card: its address goes from one line to two, and its facts from 43 to 64 px tall. A managed card's facts (SOAR Cloud's) go from 28 to 47 px;
- tier lane titles, the "Unconnected" lane's title, a shared host's header and a collapsed host's rows grow a little;
- with a card of every component type, the ES search head's edition badge and the deployment configuration drawn on the canvas too.

Over 30 scenarios, 1,557 canvas texts, of 17 kinds, change size this way. Code measuring during a redraw sees the first sizes. Build 214 routes a collapsed container's links to its 92 px box, then routes them again when the box grows: 14 of 15 links over three scenarios.

**Why:** the text polish (`polishBuilderText`, in its current form Build 159's, line 8057) runs a frame after each redraw (`requestAnimationFrame`, line 4226). It gives canvas text under 11.5 px an inline size of 11.5 px. These elements' CSS draws them smaller:

| Text | CSS | First size |
|---|---|---|
| The load balancer's card | `builder-load-balancer-v185-styles`, lines 9840 and 9841 | 9 to 10 px |
| A managed card (Splunk Cloud, SOAR Cloud, the ES search head) | `builder-splunk-managed-v176`, line 9640; the ES edition badge, `builder-cloud-es-v179`, line 9690 | 8 to 10 px |
| The deployment configuration on the canvas | `builder-deployment-config-v109-styles`, line 3655 (`.7rem`) | 9.3 to 11.2 px |
| A shared host's header, and a collapsed host's rows | `builder-shared-hosts-v147-styles`, lines 6748 to 6761 | 10 to 11 px |
| Tier lane titles | `builder-grouping-v130-styles`, line 5257 | 11 px |
| The "Unconnected" lane's title | `builder-final-polish-v122-styles`, line 4352 | 11 px |
| A card's "incoming data routes" badge | `builder-multi-input-styles`, line 2928 (`.58rem`) | 9.3 px |
| A collapsed container's box, and a container's "−" button | `builder-large-topology-navigation-styles`, line 2722 (`.48rem` to `.7rem`) | 7.7 to 10.9 px |

Build 211 draws a container's name at 11.5 px from the start (line 14538); these were left. Where an `!important` rule sets the size, it wins over the polish's inline size, so the polish changes nothing: an Azure card's text (`builder-azure-storage-v194`, line 11315) and a federated managed card's facts (line 11737) stay at 9 or 10 px.

> **Correction, from the collapsed-and-redraw handoff:** "first drawn … a frame later" says when the polish runs, not what is painted.
> - The polish runs in the next frame's animation callbacks, and those run before the frame is painted.
> - After a redraw from a click or a key, this text was laid out at the smaller sizes, and code measuring then saw them: Build 214 routed a collapsed container's links to the 92 px box. But it was not painted at them, and the second routing was done before the first paint too.
> - Only a redraw that itself runs in an animation callback, as on crossing 760 px wide, was painted with the smaller text.
> - The same goes for "Found while testing", 5: both routings are done before the first frame is painted.

## The fix

- **Exported lanes are drawn round the page's own cards** (the three edits):
  - **In the topology's group:** the lanes go in the group that holds the cards.
  - **From the page's own layout:** the lanes' layout and components are worked out in the page's scope, with `withArchitectureExportScope(scope, …)` round `unifiedBuilderPositions()` and the scope's components, as the page's cards were.
  - **With room for each lane's label:** a lane round cards reaches 16 px round them, as before, and 6 px more above them, so its label (11 px, its baseline 14 px below the lane's top) is clear of the cards. More would run into the Management lane, which Build 130 starts 7 px below the tier lanes. An empty tier's 46 px placeholder is unchanged.
  - Every page's cards are then inside their own lanes, and each lane counts the cards in it. A collapsed container's card is in a lane, and counted there: Sources, where Build 130's layout puts it.
  - The whole topology's diagrams change only in their lanes: 30 px lower, and 6 px taller at the top.
- **Canvas text is drawn at its final size from the start** (the block): one rule gives that text 11.5 px. The polish then finds nothing on the canvas to raise, and nothing on the canvas changes size after a redraw. A collapsed container's box is 103 px tall from the start, and its links are routed once.
  - The selector has two ids, so it beats the original rules, as the polish's inline size does. An `!important` rule still wins, as it does over the inline size, so Azure cards and a federated managed card keep their 9 and 10 px text, as on Build 214.
  - Once a redraw has settled, the canvas is the same as on Build 214: every element's text size, box and route.
- **Unchanged:** the polish, which still raises text outside the canvas to 10 px; Build 214's routing of a collapsed container's links again when its box changes size; the settled canvas; everything in the exports but their lanes.

## The edits

In Build 214's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is.

**`<script id="builder-grouping-v130">`, `architectureSvgForScope`** (Build 130's lanes in Export SVG, PNG and the pack):

- **Line 5417.** The lanes go in the topology's group, the one that holds the cards (`translate(42 108)`), not the first group with a transform, the legend's first entry (`translate(42 78)`), 30 px higher.
```
old:   const root=xml.documentElement,body=[...root.children].find(el=>el.localName==='g'&&el.hasAttribute('transform'));
new:   const root=xml.documentElement,body=[...root.children].find(el=>el.localName==='g'&&el.querySelector(':scope > g > rect[width="190"]'));
```
- **Line 5419.** The lanes' layout and components are the page's own, worked out in its scope as its cards were (`withArchitectureExportScope`), not the whole topology's.
```
old:   const layout=unifiedBuilderPositions(),visible=state.builderNodes.filter(node=>scope.nodeIds.includes(node.id));
new:   const {layout,visible}=withArchitectureExportScope(scope,()=>({layout:unifiedBuilderPositions(),visible:[...state.builderNodes]}));
```
- **Line 5422.** A lane round cards reaches 6 px higher than its 16 px, so its label clears the cards. An empty tier's placeholder is as before.
```
old:     const x=box?.x??30+index*320,y=box?.y??20,w=box?.w??46,h=box?.h??175;
new:     const x=box?.x??30+index*320,y=box?box.y-6:20,w=box?.w??46,h=box?box.h+6:175;
```

## The new block

`<style id="canvas-text-v215">`, before `</body>`, containing [`docs/mockups/lanes-and-text-prototype.css`](mockups/lanes-and-text-prototype.css): one rule, `font-size:11.5px`, for 26 selectors, each under `#topologyBuilder #builderTree`, in the order of the table under fault 31:

1. **The load balancer's card:** `.lbBadges186>span`, `.lbFacts186>span`, `.lbAddress186`, `.lbFooter186`.
2. **A managed card:** `.managedBadge176`, `.esEdition179`, `.managedFacts176>span`, `.managedAddress176`, `.managedFooter176`.
3. **The deployment configuration on the canvas:** `.deploymentConfigCanvas>summary`, `.deploymentConfigCanvas>small`, `.deploymentCanvasGroup>strong`, `.deploymentConfigArrow`, `.deploymentConfigChip`.
4. **A shared host:** `.builderHostHeader147>strong`, `>small` and `>span`, and `.builderHostCard147 span`.
5. **Titles and badges:** `.builderTierLane130>strong`, `.builderUnconnectedLane`, `.builderMultiInputBadge`, `.builderGroupCollapseButton`.
6. **A collapsed container's box:** `.collapsedGroupProxy>` `small`, `strong`, `span` and `em`.

## Build records

After the edits and the block:
- **`changeRegister`,** group "Explorer foundations":
  `['Lanes round every page\'s cards; canvas text at its final size','Export SVG, PNG and the architecture pack draw each page\'s Group by lanes round that page\'s own cards, a collapsed container\'s card included. Canvas text is drawn at its final size from the start, so nothing on the canvas changes size a frame after a redraw.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 214 did in `export-as-drawn-records-v214`, with Build 215.

## Found while testing (not changed)

1. **Exporting a view with two or more collapsed containers draws their collapsed cards on top of each other,** on Build 214 too. Grouped by type with two or more types collapsed, Export SVG of the current navigation view and the architecture pack throw "Maximum call stack size exceeded" instead.
   - In the zones topology, with the Syslog Servers and the Universal Forwarders in two collapsed containers, both collapsed cards are drawn at (704, 58). Grouped by type with the Syslog Server and Universal Forwarder types collapsed, the exports throw.
   - The cause: `withArchitectureExportScope` (line 2847) numbers each collapsed card `-100000-index` in `aggregateIds.forEach((groupId,index)=>…)`. But `aggregateIds` is a Set, whose `forEach` passes the value twice, so every collapsed card's id is `-100000-'group-1'`, which is NaN. Two collapsed cards share the id, and with collapsed types one is its own parent, which `unifiedBuilderPositions` follows for ever.
   - `[...aggregateIds].forEach((groupId,index)=>…)` fixes it. Tried on Build 214: the two collapsed cards are drawn at (704, 58) and (1024, 58), and the type-grouped exports draw, the pack's 66 pages with them.
2. **In a collapsed container's box, the "Expand" pill covers the end of "REGION · COLLAPSED"** once both are 11.5 px. That is Build 214's canvas once the polish has run, and now from the start.
3. **The polish still raises text outside the canvas to 10 px:** 9,905 texts over the 30 scenarios, in the toolbars, menus and panels, from 7.8 to 9.9 px. None of it changes the canvas's size.
4. **With Group by on, the canvas is drawn 700 px tall and is 657 px two frames later** (zones topology, 1,440 × 900), on Build 214 too. A step other than the polish changes it; not looked into.
5. **On a phone, one of a collapsed container's links is routed again a frame after each redraw,** its start 7.9 px lower, on Build 214 too. In the zones topology with the Syslog Servers' container collapsed, it is the link at (150, 1490). The polish has no part in it: it happens with the polish held back. The only code that routes these links again is Build 214's block, whose resize observer also fires when it first observes a box; what moves the link's start in between was not looked into.

## Check before uploading

Run with Build 214 + the edits + the block, and with Build 214 as shipped for comparison. The exports' cards and lanes are read from the exported SVGs, each card matched to its component by name and placed by adding up every group's translation.

### 1. The fixes: 21 checks, all pass

Build 214's figures are in brackets.

| Check | Result |
|---|---|
| Lanes, in every grouping | Grouped by tier, type, region or environment, in the zones and the reference topologies: on 12 of 12 topology diagrams each (Export SVG and the pack's 11), every card is inside its own lane, and every lane's count is right (Build 214: 0 of 12, or 1 of 12 grouped by environment) |
| A collapsed container | Exporting the current navigation view with the Syslog Servers' container collapsed: 13 of 13 diagrams right, the collapsed card inside the Sources lane and counted there (Build 214: 1 of 13) |
| On a phone | Grouped by tier: 12 of 12, from the phone's layout (Build 214: 0 of 12) |
| The whole topology's diagrams | Export SVG and the pack's overview and 3 plane pages, in all five groupings, 25 diagrams: on all 25 the lanes are in the cards' group (Build 214: the legend's first entry, 30 px higher), and each lane round cards is 6 px taller at the top, with the same label. The rest of each diagram is Build 214's, the generated times set aside |
| Collapsed types | Grouped by type with types of 3 or more collapsed, Export SVG of the complete topology draws, with lanes. Of the current navigation view it throws, as on Build 214 ("Found while testing", 1) |
| Canvas text the polish changes | Over 30 scenarios (the reference and zones topologies' layouts, collapsed and expanded containers, Group by, shared hosts, a selection, touch, phones and a card of every component type): none (1,557, of 17 kinds, in 29 scenarios) |
| The block's selectors | Each of the 26 finds canvas text in these scenarios |
| Outside the canvas | The polish raises 9,905 texts to 10 px over the same scenarios, as on Build 214: unchanged |
| After a redraw | No canvas box changes size in the frame after it, over 8 scenarios (187, 17 to 41 a scenario) |
| A collapsed container's box | 103 px tall when drawn and after (92, then 103 px) |
| Its links | The polish's frame routes none of them again: 0 of 15 move (14 of 15, as the box grows) |
| A card with an "incoming data routes" badge | With the badge, 252 px tall when drawn and after; 331 px at 1,024 px with touch; 316 px on a phone (249, 328 and 313 px, then 3 px more) |
| The settled canvas | Every element's text size, box and route as on Build 214, in 9 of 9 scenarios |
| Page errors | None |

The four checks from "After a redraw" to the badge come from a second run of those checks. In the first run, the links' check counted every change, and so a phone link that both builds route again before the polish runs ("Found while testing", 5); it now counts the polish's frame alone.

### 2. Regression

Against Build 214:

| Suite | Result |
|---|---|
| The export-as-drawn checks (Build 214's, against Build 213) | 29 of 29 |
| The line jumps checks (against Build 212) | 18 of 22, as on Build 214: the other 4 compare Export SVG with Build 212's |
| The link label clicks checks (against Build 211) | 15 of 15 |
| The toolbar, lanes and labels checks (against Build 210) | 42 of 42 |
| The room-and-header checks (against Build 209) | 40 of 40 |
| The quick fixes | 27 of 27 |
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 55 of 58, as on Build 214: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58 |
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Menu bar actions | 69 of 69 |
| Parsing laboratory | 68 of 68 ("Click to next frame" 254 ms, limit 1,000) |
| Canvas card views | 123, unchanged |
| The space tool | The same output as Build 214 |
| The connector tool | The same output as Build 214 |
| Page errors | None |

Apart from the timing, every suite prints what it printed for Build 214, line for line.

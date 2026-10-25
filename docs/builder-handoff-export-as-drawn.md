# Handoff: Export SVG as the canvas draws it (faults 38 to 40)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 213.
**Seventeen in-place edits** in six scripts, under "The edits". Each old string occurs exactly once in Build 213, and no edit changes the number of lines.
**One new block, at the end of the page (before `</body>`):** `<script id="collapsed-links-v214">`, containing [`docs/mockups/export-as-drawn-prototype.js`](mockups/export-as-drawn-prototype.js). There is no style block.

The edits and the block are also in [`docs/mockups/export-as-drawn.diff`](mockups/export-as-drawn.diff), a unified diff against Build 213's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

Make the edits, paste the file as it is, then add the build records (see "Build records").

**The faults** are numbered as in the Build 213 recheck ([`builder-handoff-build213.md`](builder-handoff-build213.md)): 38, 39 and 40.

**Mockup (the target):** [`docs/mockups/export-as-drawn-mockup.html`](mockups/export-as-drawn-mockup.html). Three scenes have the edits and the block applied to Build 213, and the two "Today" scenes are Build 213. The screenshots are `docs/mockups/compare/export-as-drawn-*.png`.

**Tested first:** the edits and the block were applied to Build 213 and run. The results under "Check before uploading" come from that run.

## The faults

### 38. Export SVG isn't the diagram on screen

**What you see,** at 1,440 px:
- **Cards** are 142 px tall in the export and 224 px on the canvas.
- **Links:** none of the export's links follows its route on the canvas. In the zones topology (`docs/mockups/sv-zones-topology.json`), of its 16 links, the export routes 4 another way in the horizontal layout, 14 in the vertical and 8 in Free place, and the rest leave their cards higher than on the canvas: a data link by 41 px, at the middle of a 142 px card rather than a 224 px one. So the export has crossings of its own: in Free place 10, where the canvas has 5.

**Why:**
- **The canvas's cards grew; the export's didn't.** Above 760 px the canvas has drawn cards 224 px tall since Build 163 (`builder-canvas-ux-v163-styles`; `builder-default-row-v166-styles`). The export draws them 142 px tall (`builder-svg-png-export`, line 2548), and Build 125 routes its links round 190 × 142 boxes so that they meet those cards (`builder-architecture-pack-v125`, line 4610). The export's label placement (Build 128) and shared hosts (Build 147) allow for 142 px cards too, and its tier lanes (Build 130) for 175.
- **The route function is the canvas's.** Both call `relationshipPath`; given 190 × 224 boxes, it gives the export the canvas's route for every link: 72 of 72 over the reference and zones topologies' three layouts.
- **One shortcut differs.** Build 125 draws a link between two cards on one row straight across at the cards' middle. The canvas does that for a data link, but puts an Access link a third of the way down (Build 164).

### 39. Export SVG's labels can overlap

**What you see:** in the zones topology, 3 pairs of labels overlap in the vertical layout and 2 in Free place, and 1 to 3 labels per layout sit on a card. In the reference topology, 1 pair overlaps in the vertical layout, and 2 labels sit on cards in each of the horizontal and vertical layouts.

**Why:** the export's labels are placed by Build 128 (`builder-review-polish-v128`, line 5099). For each link it tries nine places along it, from the middle out, for one clear of the cards. It never checks the labels already placed, and where no place is clear it keeps the middle, on a card or not.

### 40. A collapsed container's links get no line jumps

**What you see:** with a container collapsed (large topology navigation), each of its links is drawn as an S-shaped curve, unlike every other link, from points set for 142 px cards: 71 px down a card's side, a third of the way down a 224 px card, or 142 px down its middle, inside it. They get no arcs where they cross other links. In the zones topology, with the three Syslog Servers in one container, collapsed: 5 such links, with 1 crossing in the horizontal layout and 4 in Free place, none with an arc.

**Why:** `applyLargeTopologyNavigation` (`builder-large-topology-navigation`, line 2736) draws these links with `appendCollapsedConnector` (line 2735), which uses `unifiedConnectorPath` (line 2454): the canvas's early cubic curves, anchored at a 142 px card's middle (71 px down). The line jumps block reads straight runs, and only from `path.unifiedConnector` lines.

## The fix

- **Export SVG draws cards 190 × 224 px, as the canvas does,** and routes its links round 190 × 224 boxes, so every link follows its canvas route. That is Export SVG and PNG, the presentation and the architecture pack.
  - A card shows its first two stages, as the canvas card does, or P1 | P2 for two pipeline sets. Its band is at the foot. The rest of its text is as on Build 213.
  - Containers' boxes, tier lanes and shared hosts reach round 224 px cards.
  - The export's size is unchanged: the layout already allows for 224 px cards.
  - The straight cut goes, so a same-row Access link sits a third of the way down, as on the canvas.
- **Labels never overlap each other or a card.** A label goes at the first clear place on its link, from the middle outwards: the export's nine places first, then every 2 px. Where nothing on the link is clear, it goes just beside the link, 4 px off: above or below a level run, right or left of an upright one. Where nothing there is clear either, the label is left out, and its link's title still names it.
  - In every layout tested, the export shows every label whose text the canvas shows, and 0 to 2 more.
  - The labels left out are ones the canvas also shows as their issue badge only.
- **A collapsed container's links are routed as the canvas routes links.** Each leaves by the side facing the other end, goes round the cards and collapsed containers in its way, and has the same rounded corners. Its straight ends are 22 px long, shorter where two boxes are closer than that allows.
  - The line jumps block takes these links in, so they get arcs where they cross.
  - A container's box can grow just after a redraw (fault 31), so its links are routed again when the box changes size.
- **Unchanged:** the canvas, apart from a collapsed container's links; the export's size, titles, legend and metadata.

## The edits

In Build 213's `index.html`. Each old string occurs exactly once; each new string has the same number of lines as the old.

**1. `<script id="builder-svg-png-export">`**

- **line 2548.** A container's box reaches 34 px below its lowest card's foot, as before, now for 224 px cards.
```
old: right=Math.max(...xs)+208,bottom=Math.max(...ys)+176;
new: right=Math.max(...xs)+208,bottom=Math.max(...ys)+258;
```
- **line 2548.** The card is 224 px tall.
```
old: <rect width="190" height="142" rx="12" fill="#0b1a25" stroke="${color}" stroke-width="2"/>
new: <rect width="190" height="224" rx="12" fill="#0b1a25" stroke="${color}" stroke-width="2"/>
```
- **line 2548.** Under the first stage, the second, as the canvas card shows them; a card with two pipeline sets keeps P1 | P2 alone.
```
old: <rect x="12" y="${lines.length>1?91:75}" width="166" height="26" rx="6" fill="#0d2430" stroke="#294758"/><text x="95" y="${lines.length>1?108:92}" text-anchor="middle" class="stage">${svgEscape(stage)}</text>
new: <rect x="12" y="${lines.length>1?91:75}" width="166" height="26" rx="6" fill="#0d2430" stroke="#294758"/><text x="95" y="${lines.length>1?108:92}" text-anchor="middle" class="stage">${svgEscape(stage)}</text>${!lane&&component.stages?.[1]?`<rect x="12" y="${lines.length>1?121:105}" width="166" height="26" rx="6" fill="#0d2430" stroke="#294758"/><text x="95" y="${lines.length>1?138:122}" text-anchor="middle" class="stage">${svgEscape(component.stages[1])}</text>`:''}
```
- **line 2548.** The band is at the card's foot.
```
old: <rect y="122" width="190" height="20" rx="0" fill="${color}24"/><text x="95" y="136" text-anchor="middle" class="band" fill="${color}">
new: <rect y="204" width="190" height="20" rx="0" fill="${color}24"/><text x="95" y="218" text-anchor="middle" class="band" fill="${color}">
```

**2. `<script id="builder-architecture-pack-v125">`**

- **line 4600.** The comment says what the export draws now.
```
old: /* The exported SVG draws 190x142 cards. Route with those exported card boxes and use the same 320px layout. */
new: /* The exported SVG draws 190x224 cards, as the canvas does above 760 px (Build 214). Route with those exported card boxes and use the same 320px layout. */
```
- **line 4610.** The export's links are routed round 190 × 224 boxes.
```
old: builderCardBox=function(id,positions){const position=positions?.get(Number(id))||{x:0,y:0};return{x:position.x,y:position.y,w:190,h:142}};
new: builderCardBox=function(id,positions){const position=positions?.get(Number(id))||{x:0,y:0};return{x:position.x,y:position.y,w:190,h:224}};
```
- **lines 4614 to 4616.** Every link takes `relationshipPath`'s route, as on the canvas; Build 125's straight cut at the middle goes.
```
old:
        const direct=Math.abs(from.y-to.y)<.1&&to.x>=from.x+202&&
          !state.builderNodes.some(node=>node.id!==edge.from&&node.id!==edge.to&&layout.positions.get(node.id)?.x>from.x&&layout.positions.get(node.id)?.x<to.x);
        path.setAttribute('d',direct?`M${from.x+193} ${from.y+71} L${to.x-3} ${to.y+71}`:relationshipPath(edge,layout.positions).d);
new:
        // Every link takes the canvas's route. A straight link between cards on one row sits where the canvas puts it,
        // at the middle for data and a third down for Access, so Build 125's straight cut at the middle goes.
        path.setAttribute('d',relationshipPath(edge,layout.positions).d);
```

**3. `<script id="builder-review-polish-v128">`**

- **lines 5107 to 5108.** The cards labels keep off are 224 px tall.
```
old:
child.querySelector(':scope > rect[width="190"][height="142"]'))
    .map(child=>{const coords=String(child.getAttribute('transform')||'').match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/);return coords?{x:Number(coords[1]),y:Number(coords[2]),w:190,h:142}:null}).filter(Boolean);
new:
child.querySelector(':scope > rect[width="190"][height="224"]'))
    .map(child=>{const coords=String(child.getAttribute('transform')||'').match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/);return coords?{x:Number(coords[1]),y:Number(coords[2]),w:190,h:224}:null}).filter(Boolean);
```
- **lines 5111 to 5112.** A list of the labels placed so far.
```
old:
  paths.forEach((path,index)=>{
    const label=labels[index],width=Number(label?.querySelector(':scope > rect')?.getAttribute('width'))||0;
new:
  const placed=[];paths.forEach((path,index)=>{
    const label=labels[index],width=Number(label?.querySelector(':scope > rect')?.getAttribute('width'))||0;
```
- **lines 5114 to 5126.** Each label's place: on its link if anywhere is clear, else just beside it, else left out (see "The fix").
```
old:
    let pointAt=null;
    try{const length=/* v161: reuse geometry for an unchanged d */ builderPathLength161(path);if(length>0)pointAt=fraction=>/* v161: d-keyed point cache */ builderPathPoint161(path,length*fraction)}catch{}
    if(!pointAt){const line=String(path.getAttribute('d')||'').match(/^M\s*([-\d.]+)[ ,]+([-\d.]+)\s*L\s*([-\d.]+)[ ,]+([-\d.]+)\s*$/i);
      if(line){const [x1,y1,x2,y2]=line.slice(1).map(Number);pointAt=fraction=>({x:x1+(x2-x1)*fraction,y:y1+(y2-y1)*fraction})}}
    if(!pointAt)return;
    const offset=offsets[index]||{x:0,y:0};let best=null;
    for(const fraction of [.5,.45,.55,.4,.6,.35,.65,.3,.7]){
      const point=pointAt(fraction),x=point.x-width/2+offset.x,y=point.y-11+offset.y,
        overlap=boxes.some(box=>x<box.x+box.w+4&&x+width>box.x-4&&y<box.y+box.h+4&&y+22>box.y-4);
      if(!best)best={x,y};
      if(!overlap){best={x,y};break}
    }
    label.setAttribute('transform',`translate(${best.x} ${best.y})`);
new:
    let pointAt=null,length=0;
    try{length=/* v161: reuse geometry for an unchanged d */ builderPathLength161(path);if(length>0)pointAt=fraction=>/* v161: d-keyed point cache */ builderPathPoint161(path,length*fraction)}catch{}
    if(!pointAt){const line=String(path.getAttribute('d')||'').match(/^M\s*([-\d.]+)[ ,]+([-\d.]+)\s*L\s*([-\d.]+)[ ,]+([-\d.]+)\s*$/i);
      if(line){const [x1,y1,x2,y2]=line.slice(1).map(Number);length=Math.hypot(x2-x1,y2-y1);pointAt=fraction=>({x:x1+(x2-x1)*fraction,y:y1+(y2-y1)*fraction})}}
    const clear=(x,y)=>![...boxes,...placed].some(box=>x<box.x+box.w+4&&x+width>box.x-4&&y<box.y+box.h+4&&y+22>box.y-4);if(!pointAt){const at=String(label.getAttribute('transform')||'').match(/[-\d.]+/g)?.map(Number)||[0,0];if(!clear(at[0],at[1])){label.remove();return}placed.push({x:at[0],y:at[1],w:width,h:22});return}
    // On the link if any place is clear (from the middle outwards, then every 2 px), else just beside it, 4 px off; else left out.
    const offset=offsets[index]||{x:0,y:0},fractions=[.5,.45,.55,.4,.6,.35,.65,.3,.7,.25,.75,.2,.8,.15,.85],fine=[];let best=null;
    for(let k=1,n=Math.max(10,Math.min(1500,Math.round(length/2)));k<n;k++)fine.push(k/n);fine.sort((a,b)=>Math.abs(a-.5)-Math.abs(b-.5));fractions.push(...fine);
    for(const fraction of fractions){const point=pointAt(fraction),x=point.x-width/2+offset.x,y=point.y-11+offset.y;if(clear(x,y)){best={x,y};break}}
    if(!best)for(const fraction of fractions){const point=pointAt(fraction),next=pointAt(Math.min(1,fraction+2/length)),level=Math.abs(next.y-point.y)<Math.abs(next.x-point.x),
      spots=level?[{x:point.x-width/2,y:point.y-26},{x:point.x-width/2,y:point.y+4}]:[{x:point.x+4,y:point.y-11},{x:point.x-width-4,y:point.y-11}];best=spots.map(s=>({x:s.x+offset.x,y:s.y+offset.y})).find(s=>clear(s.x,s.y))||null;if(best)break}
    if(!best){label.remove();return}placed.push({x:best.x,y:best.y,w:width,h:22});
    label.setAttribute('transform',`translate(${best.x} ${best.y})`);
```

**4. `<script id="builder-grouping-v130">`**

- **line 5332.** `builderGroupBounds130` takes a card height, 175 by default as before, so the canvas's lanes and boxes are unchanged.
```
old: function builderGroupBounds130(members,layout,pad=14){const points=members.map(node=>layout.positions.get(node.id)).filter(Boolean);if(!points.length)return null;const x=Math.min(...points.map(p=>p.x))-pad,y=Math.min(...points.map(p=>p.y))-pad;return{x,y,w:Math.max(...points.map(p=>p.x+190))+pad-x,h:Math.max(...points.map(p=>p.y+175))+pad-y}}
new: function builderGroupBounds130(members,layout,pad=14,cardH=175){const points=members.map(node=>layout.positions.get(node.id)).filter(Boolean);if(!points.length)return null;const x=Math.min(...points.map(p=>p.x))-pad,y=Math.min(...points.map(p=>p.y))-pad;return{x,y,w:Math.max(...points.map(p=>p.x+190))+pad-x,h:Math.max(...points.map(p=>p.y+cardH))+pad-y}}
```
- **line 5421.** The export's tier lanes reach round 224 px cards.
```
old: box=builderGroupBounds130(members,layout,16);
new: box=builderGroupBounds130(members,layout,16,224);
```

**5. `<script id="builder-shared-hosts-v147">`**

- **line 6815.** In the export, a shared host's box reaches 15 px below its lowest card's foot, as before, now for 224 px cards.
```
old: Math.max(...members.map(n=>layout.positions.get(n.id).y+142))-y+15
new: Math.max(...members.map(n=>layout.positions.get(n.id).y+224))-y+15
```
- **line 6816.** A collapsed host's links go to and from 224 px cards.
```
old: const from=ah?.collapsed?boxes.get(ah.id):{...layout.positions.get(edge.from),w:190,h:142},to=bh?.collapsed?boxes.get(bh.id):{...layout.positions.get(edge.to),w:190,h:142};
new: const from=ah?.collapsed?boxes.get(ah.id):{...layout.positions.get(edge.from),w:190,h:224},to=bh?.collapsed?boxes.get(bh.id):{...layout.positions.get(edge.to),w:190,h:224};
```

**6. `<script id="line-jumps-v213">`**

- **line 14793.** The comment names the collapsed containers' links.
```
old: // The canvas. Each link's line (path.unifiedConnector) keeps its plain d in data-plain-d213 while it has jumps
new: // The canvas. Each link's line (path.unifiedConnector, or a collapsed container's path.collapsedGroupConnector) keeps its plain d in data-plain-d213 while it has jumps
```
- **line 14797.** The lines a pass takes include a collapsed container's links.
```
old: const lines=()=>[...document.querySelectorAll('#builderTree .unifiedConnectorLayer path.unifiedConnector[data-edge-id]')];
new: const lines=()=>[...document.querySelectorAll('#builderTree .unifiedConnectorLayer path.unifiedConnector[data-edge-id], #builderTree .unifiedConnectorLayer path.collapsedGroupConnector')];
```
- **line 14818.** The observer schedules a pass when one of those changes too.
```
old: r.target.matches?.('path.unifiedConnector')&&
new: r.target.matches?.('path.unifiedConnector,path.collapsedGroupConnector')&&
```

## The new block

`<script id="collapsed-links-v214">`, before `</body>`, containing [`docs/mockups/export-as-drawn-prototype.js`](mockups/export-as-drawn-prototype.js):

1. **`appendCollapsedConnector` is wrapped.** After Build 213 has drawn its curve, the block replaces the curve's `d` with a route, and keeps the link's two ends to route it again later.
2. **The two boxes:** a collapsed container's box is its proxy's (`.collapsedGroupProxy`, found by the container's id); a card's is the canvas's, from `builderCardBox`, found by its place in the layout.
3. **Sides:** across when one box is clear of the other sideways, else down or up. On a left or right side a data link sits at the middle, a Fleet link two thirds down and an Access link a third down, as the canvas's do (Build 164).
4. **The route:** 3 px off each box, a straight end of 22 px (shorter where the boxes are close), and between the two ends `builderV123RouteBetween`, which goes round every other card and collapsed container on the canvas. It is drawn by `builderV123RoundedPath`, so it has the canvas's rounded corners.
5. **Again on a resize:** a `ResizeObserver` on each container's proxy routes every collapsed container's links again when a proxy changes size. A route that comes out the same isn't written again, so its line jumps stay. Proxies no longer on the page are let go.
6. **The layout** (`unifiedBuilderPositions`) is worked out once per redraw for all the collapsed links.

## Build records

After the edits and the block:
- **`changeRegister`,** group "Explorer foundations":
  `['Export SVG as the canvas draws it','Export SVG and PNG, the presentation and the architecture pack draw cards 224 px tall and route each link as the canvas does, and keep labels clear of each other and of the cards. A collapsed container\'s links are routed as other links are, and get line jumps.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 213 did in `line-jumps-records-v213`, with Build 214.

## Found while testing (not changed)

1. **Tier lanes on a page of one part of the topology miss its cards,** as on Build 213. In the architecture pack grouped by tier, a page of one part of the topology, such as a region, lays out only its own cards, but Build 130 draws its lanes from `unifiedBuilderPositions()` once `withArchitectureExportScope` has put the whole topology back (`builder-grouping-v130`, line 5415), so the lanes are where the whole topology's cards would be. In the zones topology that is 6 of the pack's 11 topology diagrams; its 5 others, of the whole topology, and Export SVG itself have every card in its lane.
2. **On a phone, Export SVG lays the topology out as the phone does,** as on Build 213: every card and link is somewhere else than in the same export made at 1,440 px. The cards are 224 px tall either way.
3. **The canvas puts some labels beside their link with a leader line** (Build 157). Where nothing on its link is clear, the export puts the label just beside the link, 4 px off, with no leader: 2 labels in the reference topology's Free place layout and 2 in the zones topology's.
4. **A collapsed container's box grows just after a redraw,** from 92 to 103 px in the zones topology, as Build 151 enlarges its small text then (fault 31). The block routes the container's links again when it does; without that, a link entering from below ends 8 px inside the box.

## Check before uploading

Run with Build 213 + the edits + the block, and with Build 213 as shipped for comparison. The export's cards, links and labels are read from the exported SVG, the canvas's from the page.

### 1. The fixes: 29 checks, all pass

Build 213's figures are in brackets.

| Check | Result |
|---|---|
| Cards, in every layout at 1,440 px | In the default topology and the reference and zones topologies' three layouts, every card is drawn 190 × 224 px at its canvas place (Build 213: 142 px tall) |
| Links | Every link follows its canvas route: 3 of 3, 12 of 12 in each reference layout and 16 of 16 in each zones layout (Build 213: none) |
| Crossings | The export's are the canvas's, each with its arc: the reference topology's Free place 3; the zones topology's layouts 1, 2 and 5 (Build 213: Free place 10 in the export) |
| Size | Every export's width and height are Build 213's |
| Card text | All 20 zones cards show the canvas card's rows, its first two stages or P1 \| P2 (the load balancer's and SOAR's canvas cards show other things; theirs show their first two stages), and keep Build 213's type, name, place and band text, the band at the foot |
| Labels | In all seven layouts none overlaps another or a card (Build 213: 6 overlapping pairs and 10 labels on cards over the seven). Each is on its link, apart from 2 in each topology's Free place layout just beside it. The export shows every label whose text the canvas shows, and 0 to 2 more; the 0 to 5 left out per layout are each named in their link's title |
| The presentation | Zones, vertical: cards 224 px tall, 16 of 16 links on their canvas routes, no labels overlapping |
| Export SVG and the architecture pack, grouped by tier | 12 topology diagrams: cards 224 px tall and labels apart and off the cards on all 12. On the 6 of the whole topology, every card inside its tier lane (the other 6: "Found while testing"). *Corrected after Build 214: this check left out the SVG groups' translations. On every diagram the lanes are drawn 30 px above the cards, so each card hangs 14 px below its lane (fault 41, [`builder-handoff-lanes-and-text.md`](builder-handoff-lanes-and-text.md)).* |
| A shared host | Its box in the export ends 15 px below its lower card's foot |
| Export PNG | Its first step, drawing the SVG as an image, gives the SVG's size |
| From another view | Export SVG made from the Flow view, with the Builder hidden, is the same as from the Builder |
| On a phone | Cards 224 px tall (see "Found while testing") |
| A collapsed container | Zones, horizontal and Free place: its 5 links have straight runs and rounded corners (Build 213: 5 curves), leave and enter 3 px off a card's or the container's side, and are clear of every card and container |
| Line jumps on them | Horizontal 1 crossing, Free place 4, each with an arc (Build 213: none) |
| Expanded again | No collapsed links remain, and every line is as before collapsing |
| The canvas otherwise | Every line, hit line and label as on Build 213 in all seven layouts |
| Page errors | None |

### 2. Regression

Against Build 213:

| Suite | Result |
|---|---|
| The line jumps checks (Build 213's feature, against Build 212) | 18 of 22. The other 4 compare Export SVG with Build 212's, which these fixes change: C1 looks for arcs where Build 212's export routes cross, and C2 and C3 compare whole exports. On the new routes every crossing has its arc (A1 above) |
| The link label clicks checks (against Build 211) | 15 of 15 |
| The toolbar, lanes and labels checks (against Build 210) | 42 of 42 |
| The room-and-header checks (against Build 209) | 40 of 40 |
| The quick fixes | 27 of 27 |
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 55 of 58, as on Build 213: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58 |
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Menu bar actions | 69 of 69 |
| Parsing laboratory | 68 of 68 ("Click to next frame" 454 ms, limit 1,000) |
| Canvas card views | 123, unchanged |
| The space tool | The same output as Build 213 |
| The connector tool | The same output as Build 213 |
| Page errors | None |

Apart from the line jumps checks above and the timing, every suite prints what it printed for Build 213, line for line.

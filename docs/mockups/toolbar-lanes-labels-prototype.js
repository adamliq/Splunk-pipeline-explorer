(function(){
/* Build 211: the toolbar on one row; Group by lanes and boxes that reach their cards, with room above group headers; and
   route labels and issue badges clear of containers' names and collapse buttons and of Component type headers. One
   in-place edit goes with this block: Build 156's label placement counts the obstacles this block lists. */

// 18. The toolbar. From 821 px, in every view but the Builder and OV, which have their own toolbars, the search box, the
// pipeline filter and the view switcher keep to one row. The search box keeps at least 250 px and the filter its width;
// the views that don't fit in what is left go into a More menu at the end of the switcher, in their order. More takes the
// current view's name when it holds the current view. From 1,310 px every view fits, and nothing changes.
const toolbar=document.querySelector('.shell>.toolbar'),seg=toolbar?.querySelector(':scope>.seg'),search=toolbar?.querySelector(':scope>.search'),filter=toolbar?.querySelector(':scope>#pipelineFilter');
if(toolbar&&seg&&search&&filter){
 const SEARCH_MIN=250,wide=matchMedia('(min-width:821px)');
 const more=document.createElement('button');more.type='button';more.className='segMore211';more.hidden=true;
 more.setAttribute('aria-haspopup','true');more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','segMenu211');seg.append(more);
 const menu=document.createElement('div');menu.id='segMenu211';menu.className='segMenu211';menu.setAttribute('role','group');menu.setAttribute('aria-label','More views');menu.hidden=true;seg.after(menu);
 const views=()=>[...seg.querySelectorAll(':scope>button[data-view]')];
 const close=focus=>{if(menu.hidden)return;menu.hidden=true;more.setAttribute('aria-expanded','false');if(focus)more.focus()};
 const fit=()=>{close(false);const list=views();for(const b of list)b.classList.remove('segOut211');more.hidden=true;more.classList.remove('active');more.textContent='More';
  const view=document.body.dataset.view;
  if(!wide.matches||view==='builder'||view==='ov'||!toolbar.getClientRects().length){menu.replaceChildren();return}
  const cs=getComputedStyle(toolbar),gap=parseFloat(cs.columnGap)||0;
  const room=toolbar.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-SEARCH_MIN-filter.getBoundingClientRect().width-2*gap;
  const widths=list.map(b=>b.getBoundingClientRect().width),total=widths.reduce((a,b)=>a+b,0),chrome=seg.getBoundingClientRect().width-total;
  if(chrome+total<=room+0.5){menu.replaceChildren();return}
  const active=list.find(b=>b.dataset.view===view);let shown=0;more.hidden=false;
  // Two passes: with "More", then, if the current view is left out, with its name, which can be wider.
  for(let pass=0;pass<2;pass++){if(pass&&!(active&&list.indexOf(active)>=shown))break;
   if(pass){more.textContent=active.textContent.trim();more.classList.add('active')}
   let used=chrome+more.getBoundingClientRect().width;shown=0;for(const w of widths){if(used+w>room+0.5)break;used+=w;shown++}}
  list.forEach((b,i)=>b.classList.toggle('segOut211',i>=shown));
  menu.replaceChildren(...list.slice(shown).map(b=>{const item=document.createElement('button');item.type='button';item.textContent=b.textContent.trim();
   item.classList.toggle('active',b===active);item.onclick=()=>{close(false);b.click();more.focus()};return item}))};
 more.addEventListener('click',()=>{if(!menu.hidden){close(false);return}
  const t=toolbar.getBoundingClientRect(),r=more.getBoundingClientRect();menu.style.top=Math.round(r.bottom-t.top-toolbar.clientTop+6)+'px';
  menu.style.right=Math.round(Math.max(8,t.right-toolbar.clientLeft-r.right))+'px';menu.hidden=false;more.setAttribute('aria-expanded','true')});
 document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!more.contains(event.target))close(false)},true);
 window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){event.stopPropagation();event.preventDefault();close(true)}},true);
 let queued=false;const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;fit()})}};
 addEventListener('resize',schedule);wide.addEventListener?.('change',schedule);
 if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(toolbar);
 document.fonts?.ready?.then(schedule);
 if(typeof switchView==='function'){const switchBefore=switchView;switchView=function(...args){const result=switchBefore.apply(this,args);fit();return result}}
 fit()}

// Canvas units. Where an element sits on the canvas, from the page's layout (offsets within the canvas), not from the
// screen: during a redraw the zoom setting and the canvas's scale can differ. `pad` grows the box all round.
function inCanvas(e,world,pad=0){let x=e.offsetLeft,y=e.offsetTop;
 for(let a=e.offsetParent;a!==world;a=a.offsetParent){if(!a)return null;x+=a.offsetLeft+a.clientLeft;y+=a.offsetTop+a.clientTop}
 return{x:x-pad,y:y-pad,w:e.offsetWidth+2*pad,h:e.offsetHeight+2*pad}}
// A card's height on the page; 224 px before it is drawn.
const cardHeight=id=>document.querySelector(`#builderTree [data-unified-node-wrap="${id}"] .builderNode`)?.offsetHeight||224;
// How far below a card its handle rows reach where they always show, on a touch screen (in the card's flow, not
// positioned); 0 elsewhere.
function rowsBelow(id){const wrap=document.querySelector(`#builderTree [data-unified-node-wrap="${id}"]`),card=wrap?.querySelector(':scope>.builderNode'),rows=wrap?.querySelector(':scope>.builderConnectionHandles');
 if(!card||!rows?.offsetHeight||getComputedStyle(rows).position==='absolute')return 0;
 return Math.max(0,rows.offsetTop+rows.offsetHeight-card.offsetTop-card.offsetHeight)}

// 25. Group by. Build 130 sizes its lanes and boxes for cards 175 px tall; cards are 224 px tall above 760 px and as tall
// as their content on a phone. Once a lane or a Component type box is drawn, its bottom moves to its lowest card's bottom,
// as drawn, plus its own padding: 18 px for a lane, 10 for a box. A card can still change height after that (on a phone
// as its styles arrive, 246 px then 224 for one card), so the lane or box is fitted again whenever one of its cards
// changes size. A lane's title shows its full text on hover.
const fits=new Map(),resized=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{const due=new Set();
 for(const entry of entries)for(const fit of fits.get(entry.target)||[])if(fit.el.isConnected)due.add(fit);for(const fit of due)fit()}):null;
function reach(el,members,pad){const world=el?.parentElement;if(!world)return;
 const cards=members.map(n=>world.querySelector(`[data-unified-node-wrap="${n.id}"] .builderNode`)).filter(card=>card?.offsetWidth);if(!cards.length)return;
 const fit=()=>{const top=parseFloat(el.style.top),bottoms=cards.filter(card=>card.offsetWidth).map(card=>{const b=inCanvas(card,world);return b?b.y+b.h:NaN}).filter(Number.isFinite);
  if(bottoms.length&&Number.isFinite(top))el.style.height=Math.max(0,Math.ceil(Math.max(...bottoms)+pad-top))+'px'};
 fit.el=el;fit();if(resized)for(const card of cards){if(!fits.has(card)){fits.set(card,new Set());resized.observe(card)}fits.get(card).add(fit)}}
if(typeof builderGroupLane130==='function'){const laneBefore=builderGroupLane130;
 builderGroupLane130=function(world,layout,title,members,...rest){const result=laneBefore.call(this,world,layout,title,members,...rest),lane=world?.firstElementChild;
  if(lane?.classList.contains('builderTierLane130')){reach(lane,members||[],18);const name=lane.querySelector(':scope>strong');if(name)name.title=name.textContent}
  return result}}
if(typeof builderGroupTypeBox130==='function'){const boxBefore=builderGroupTypeBox130;
 builderGroupTypeBox130=function(world,layout,type,members,...rest){const result=boxBefore.call(this,world,layout,type,members,...rest),box=world?.firstElementChild;
  if(box?.classList.contains('builderTypeBox130')){reach(box,members||[],10);const header=box.querySelector(':scope>.builderTypeHeader130');if(header)header.title=header.textContent}
  return result}}

// Room above group headers. A Component type box's header starts 30 px above its top card, where the card above can cover
// it, as it did containers' names (25). A container's name and collapse button start 39 px above its top card, so a link
// from a card above into that card, or out of it upwards, runs under them, with nowhere for its label to go (26); a type
// header is the same. Outside Free place, top to bottom, rows move down until each type header is 6 px clear of the card
// above it, of that card's box, or, on a touch screen, of its handle rows, and until, over a link like that, the gap above
// a group's header holds the link's label and issue badge: 34 px below the card (or its handle rows). The row with the
// group's top card and every row below it move together.
const CARD_W=190,TYPE_PAD=10,NAME_PAD=18,TYPE_TOP=30,NAME_TOP=39,CLEAR=6,LABEL_ROOM=34;
const nodeShown=node=>typeof largeNavNodeVisible!=='function'||largeNavNodeVisible(node);
function typeGroups(){if(state.builderGrouping?.mode!=='type')return[];
 const collapsed=new Set(state.builderGrouping.collapsedTypes||[]),byType=new Map();
 for(const node of state.builderNodes){if(node.groupId||collapsed.has(node.type)||!nodeShown(node))continue;const list=byType.get(node.type)||[];list.push(node);byType.set(node.type,list)}
 return [...byType.values()]}
// The bottom of the lowest card above `top` (or of its handle rows, on a touch screen), between `left` and `right`, that a
// shown link joins to one of the group's cards at `top`.
function linkedAbove(P,members,top,left,right){if(typeof builderTraceEdges!=='function')return -Infinity;const tops=new Set(members.filter(n=>P.get(n.id).y===top).map(n=>n.id));let above=-Infinity;
 for(const e of builderTraceEdges('all')){if(state.builderVisiblePlanes?.[e.plane]===false)continue;
  const other=tops.has(e.to)?e.from:tops.has(e.from)?e.to:null,p=other!=null&&P.get(other);if(!p)continue;
  const bottom=p.y+cardHeight(other)+rowsBelow(other);if(p.y<top&&p.x+CARD_W>left&&p.x<right)above=Math.max(above,bottom)}
 return above}
function moveRows(layout,top,need){for(const p of layout.positions.values())if(p.y>=top)p.y+=need;
 if(typeof layout.bandY==='number'&&layout.bandY>=top)layout.bandY+=need;
 if(typeof layout.height==='number')layout.height+=need}
// Works out the moves on a layout, makes them, and hands them back as [top, need] pairs.
function roomAboveHeaders(layout){const P=layout.positions,types=typeGroups(),boxed=new Set(types.flat().map(n=>n.id)),moves=[];
 const groups=[...types.map(members=>({members,pad:TYPE_PAD,headerTop:TYPE_TOP,type:true})),
  ...(state.builderGroups||[]).map(g=>({members:state.builderNodes.filter(n=>n.groupId===g.id&&nodeShown(n)),pad:NAME_PAD,headerTop:NAME_TOP,type:false}))];
 const done=new Set();
 for(;;){let next=null;
  for(const g of groups){if(done.has(g))continue;const members=g.members.filter(n=>P.has(n.id));if(!members.length){done.add(g);continue}
   const top=Math.min(...members.map(n=>P.get(n.id).y));if(!next||top<next.top)next={g,members,top}}
  if(!next)break;const {g,members,top}=next;done.add(g);
  const xs=members.map(n=>P.get(n.id).x),left=Math.min(...xs)-g.pad,right=Math.max(...xs)+CARD_W+g.pad;
  let need=linkedAbove(P,members,top,left,right)+LABEL_ROOM-(top-g.headerTop);
  if(g.type){let above=-Infinity;
   for(const node of state.builderNodes){const p=P.get(node.id);if(!p||g.members.includes(node)||p.y>=top||p.x+CARD_W<=left||p.x>=right)continue;
    above=Math.max(above,p.y+cardHeight(node.id)+Math.max(boxed.has(node.id)?TYPE_PAD:0,rowsBelow(node.id)))}
   need=Math.max(need,above+CLEAR-(top-TYPE_TOP))}
  need=Math.ceil(need);if(!(need>0))continue;moveRows(layout,top,need);moves.push([top,need])}
 return moves}
// During a redraw Build 163 hands back the same layout for every call, so each layout's positions get the room once. On a
// phone, and with Group by set, every call works the layout out afresh, and a card's height on the page changes during a
// redraw as its styles arrive (on a phone 162, then 194, then 142 px for one card), so the room is worked out once per
// redraw, on its first layout, and the same moves are made on every layout after it until the next redraw. Then the
// cards, Build 130's boxes, drawn after them, and the labels all use the same rows.
const roomed=new WeakSet();let roomMoves=null;
if(typeof unifiedBuilderPositions==='function'){const positionsBefore=unifiedBuilderPositions;
 unifiedBuilderPositions=function(...args){const layout=positionsBefore.apply(this,args);
  if(layout?.positions&&!roomed.has(layout.positions)&&resolvedUnifiedLayoutMode()!=='free'){roomed.add(layout.positions);
   if(roomMoves)for(const [top,need] of roomMoves)moveRows(layout,top,need);else roomMoves=roomAboveHeaders(layout)}
  return layout}}
// A redraw starts afresh: no moves yet, and no cards watched for the lanes and boxes it replaces.
if(typeof renderBuilder==='function'){const redrawBefore=renderBuilder;
 renderBuilder=function(...args){roomMoves=null;resized?.disconnect();fits.clear();return redrawBefore.apply(this,args)}}

// 26. Route labels. Since Build 210 containers' names and collapse buttons are drawn over links, and now so are Component
// type headers, so a route label placed under one is partly hidden. Build 156 places each label on or beside its link
// where it covers no card or issue badge; with the edit it also keeps clear of these, listed here in canvas units, 2 px
// larger all round as cards are. A label with no clear spot shows just its issue badge, and its text on hover, as Build
// 156 shows any label it can't place.
window.builderLabelObstacles211=function(){const world=document.querySelector('#builderTree .unifiedBuilderWorld');if(!world)return[];
 return [...world.querySelectorAll(':scope>.unifiedGroupBox>button,:scope>.builderTypeBox130>.builderTypeHeader130')].filter(e=>e.offsetWidth).map(e=>inCanvas(e,world,2)).filter(Boolean)};
// A route label's box in canvas units, from its own position and size.
function labelBox(label){const t=label.getAttribute('transform')?.match(/[-\d.]+/g)?.map(Number),r=label.querySelector(':scope>rect');if(!t||!r)return null;
 return{x:t[0]+Number(r.getAttribute('x')||0)-2,y:t[1]+Number(r.getAttribute('y')||0)-2,w:Number(r.getAttribute('width')||0)+4,h:Number(r.getAttribute('height')||22)+4}}
// Build 164 puts an issue badge on its link's midpoint when the label shows no text, or when the canvas is zoomed out.
// After each placement, a link whose midpoint would put its badge under one of these controls, or, where labels show, on
// another link's label, gets the point on the link nearest its midpoint where the badge (26 px) is clear of the
// controls, of cards, of other badges and, where labels show, of labels; failing that, the nearest point 18 or 30 px to
// one side of the link. Build 164 puts the badge there instead. Zoomed out, labels are hidden, so there only the
// controls count, and every badge is on its link.
const badgeSpots={detail:new Map(),zoomedOut:new Map()};
function findBadgeSpots(){badgeSpots.detail.clear();badgeSpots.zoomedOut.clear();const world=document.querySelector('#builderTree .unifiedBuilderWorld');
 if(!world||!builderPerfPaths149||typeof builderPerfPoint149!=='function')return;
 const controls=builderLabelObstacles211(),labels=[...world.querySelectorAll('.edgeRouteLabel:not([data-label-hidden="true"])')].filter(e=>e.getClientRects().length)
  .map(e=>({key:e.dataset.routePlane+':'+e.dataset.routeEdge,box:labelBox(e)})).filter(l=>l.box);
 const box=q=>({x:q.x-13,y:q.y-13,w:26,h:26}),hits=(b,list)=>list.some(o=>b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y),nums=s=>(s||'').match(/[-\d.]+/g)?.map(Number);
 // Each badge's centre where labels show (beside its label when the label shows its text, else on its link's midpoint)
 // and zoomed out (on the midpoint); a badge that moves takes its new place in these lists.
 const where={detail:new Map(),zoomedOut:new Map()},textless=new Set();
 for(const m of world.getElementsByClassName('builderEdgeIssueMarker')){const label=m.closest('.edgeRouteLabel');if(!label||!label.getClientRects().length)continue;
  const key=m.dataset.geometryEdge||label.dataset.routePlane+':'+label.dataset.routeEdge,sample=builderPerfPaths149.get(key);if(!sample)continue;
  const mid=builderPerfPoint149(sample,.5),t=nums(label.getAttribute('transform')),own=nums(m.dataset.labelTransform164);if(label.dataset.labelHidden==='true')textless.add(key);
  where.detail.set(key,!textless.has(key)&&t&&own?{x:t[0]+own[0],y:t[1]+own[1]}:mid);where.zoomedOut.set(key,mid)}
 const fractions=[];for(let i=1;i<=25;i++)fractions.push(.5-i/50,.5+i/50);
 const spot=(sample,others)=>{const clear=q=>!hits(box(q),others),on=fractions.map(f=>builderPerfPoint149(sample,f)).find(clear);if(on)return on;
  for(const side of [18,-18,30,-30])for(const f of [.5,...fractions]){const q=builderPerfPoint149(sample,f),a=builderPerfPoint149(sample,Math.max(0,f-.01)),b=builderPerfPoint149(sample,Math.min(1,f+.01)),len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;
   const s={x:q.x-(b.y-a.y)/len*side,y:q.y+(b.x-a.x)/len*side};if(clear(s))return s}
  return null};
 const badgesBut=(mode,key)=>[...where[mode]].filter(([k])=>k!==key).map(([,q])=>box(q));let cards=null;
 const getCards=()=>cards??=[...world.querySelectorAll('[data-unified-node-wrap] .builderNode')].filter(e=>e.offsetWidth).map(e=>inCanvas(e,world,2)).filter(Boolean);
 for(const [key,sample] of builderPerfPaths149){if(!where.detail.has(key))continue;const mid=box(builderPerfPoint149(sample,.5)),underControl=hits(mid,controls);
  if(textless.has(key)){const others=labels.filter(l=>l.key!==key).map(l=>l.box);
   if(underControl||hits(mid,others)){const near=spot(sample,[...controls,...getCards(),...others,...badgesBut('detail',key)]);if(near){badgeSpots.detail.set(key,near);where.detail.set(key,near)}}}
  if(underControl){const far=spot(sample,[...controls,...getCards(),...badgesBut('zoomedOut',key)]);if(far){badgeSpots.zoomedOut.set(key,far);where.zoomedOut.set(key,far)}}}}
if(typeof builderBadges164==='function'){const badgesBefore=builderBadges164;
 builderBadges164=function(...args){const result=badgesBefore.apply(this,args),world=document.querySelector('#builderTree .unifiedBuilderWorld');if(!world)return result;
  const zoomedOut=world.classList.contains('builderLodMedium163')||world.classList.contains('builderLodLow163'),spots=badgeSpots[zoomedOut?'zoomedOut':'detail'];if(!spots.size)return result;
  for(const marker of world.getElementsByClassName('builderEdgeIssueMarker')){const label=marker.closest('.edgeRouteLabel');if(!label)continue;
   const onPath=(zoomedOut&&!label.classList.contains('builderLabelHover163'))||label.dataset.labelHidden==='true',q=onPath&&spots.get(marker.dataset.geometryEdge||label.dataset.routePlane+':'+label.dataset.routeEdge);
   const t=q&&label.getAttribute('transform')?.match(/[-\d.]+/g)?.map(Number);if(t)marker.setAttribute('transform',`translate(${q.x-t[0]} ${q.y-t[1]})`)}
  return result}}
if(typeof builderPlaceLabels149==='function'){const placeBefore=builderPlaceLabels149;
 builderPlaceLabels149=function(...args){badgeSpots.detail.clear();badgeSpots.zoomedOut.clear();const result=placeBefore.apply(this,args);findBadgeSpots();
  if(badgeSpots.detail.size||badgeSpots.zoomedOut.size)builderBadges164();return result}}
// Build 130 draws the Component type boxes once the redraw has placed the labels, so with Group by: Component type the
// labels are placed again after it.
if(typeof renderBuilder==='function'){const renderBefore=renderBuilder;
 renderBuilder=function(...args){const result=renderBefore.apply(this,args);
  if(typeof builderV123PlaceLabels==='function'&&document.querySelector('#builderTree .builderTypeBox130>.builderTypeHeader130'))builderV123PlaceLabels();
  return result}}

if(typeof renderBuilder==='function'&&state.view==='builder')renderBuilder();
})();

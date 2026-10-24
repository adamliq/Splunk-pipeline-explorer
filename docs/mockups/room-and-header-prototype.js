(function(){
/* Build 210: room on the canvas, and a Matrix header that follows the page. In Free place, a card stacked under another
   keeps room for the handle row below a card: 30 px, or where the rows always show, their depth and 6 px more. A
   container's name keeps clear of the card above it, in every layout. The Matrix header stays under the toolbar while the
   page scrolls. Four in-place edits go with this block: Free place's drop clearance and the add-next spacing (30 px below
   a card), the container box's depth, and the Config view's scroll to a stage. */
const CARD_W=190,CARD_H=224,HANDLES=30,CLEAR=6,NAME_ABOVE=39,BOX_BELOW=18;

// A card's height, and how far below it its handle rows reach where they always show. Above 760 px a card is 224 px tall;
// on a phone it is as tall as its content, 142 to 280 px in the topologies tested. With a mouse the rows show only with
// the pointer on the card; on a touch screen they always show, under the card, 31 to 109 px deep. Read from the card on
// the canvas; a card not drawn yet counts as 224 px with no rows.
function cardDepth(id){
 const wrap=document.querySelector(`#builderTree [data-unified-node-wrap="${id}"]`),card=wrap?.querySelector('.builderNode');
 if(!card?.offsetHeight)return{h:CARD_H,rows:0};
 const rows=wrap.querySelector(':scope>.builderConnectionHandles');
 if(!rows||getComputedStyle(rows).position==='absolute')return{h:card.offsetHeight,rows:0};
 const zoom=state.builderViewport?.zoom||1;
 return{h:card.offsetHeight,rows:Math.max(0,Math.ceil((rows.getBoundingClientRect().bottom-card.getBoundingClientRect().bottom)/zoom))}}

// Free place starts from the base layout: above 760 px rows 230 px apart, 6 px between 224 px cards; on a phone one
// column, cards 188 px apart, so taller ones overlap. Rows move down, together and in order, until every card has room
// below it before the next card in its column: 30 px for the handle row that shows with the pointer on a card, or where
// the rows always show, their depth and 6 px more, as they hang 6 px below their own card.
function rowsApart(positions){
 const cards=[...positions.entries()];if(cards.length<2)return;
 const rows=[...new Set(cards.map(([,p])=>p.y))].sort((a,b)=>a-b),placed=[];let shift=0;
 for(const y of rows){const row=cards.filter(([,p])=>p.y===y);let top=y+shift;
  for(const [,p] of row)for(const q of placed)if(Math.abs(q.x-p.x)<CARD_W)top=Math.max(top,q.end);
  shift=top-y;for(const [id,p] of row){const d=cardDepth(id);p.y=top;placed.push({x:p.x,end:top+d.h+Math.max(HANDLES,d.rows?d.rows+CLEAR:0)})}}}

// A container's name sits on its box's top edge, 39 px above its top card. Rows move down until the name is 6 px clear of
// what is above it in the container's columns: a card and, where they always show, its handle rows, or the box of the
// container that card is in. Done top to bottom, as each move takes the containers below it down too.
function roomForNames(layout){
 const positions=layout.positions,groups=state.builderGroups||[];if(!groups.length)return;
 const boxed=new Set(groups.map(g=>g.id)),done=new Set();
 for(;;){let next=null;
  for(const g of groups){if(done.has(g.id))continue;const members=state.builderNodes.filter(n=>n.groupId===g.id&&positions.has(n.id));
   if(!members.length){done.add(g.id);continue}const top=Math.min(...members.map(n=>positions.get(n.id).y));if(!next||top<next.top)next={g,members,top}}
  if(!next)break;done.add(next.g.id);
  const xs=next.members.map(n=>positions.get(n.id).x),left=Math.min(...xs)-18,right=Math.max(...xs)+CARD_W+18;let above=-Infinity;
  for(const n of state.builderNodes){const p=positions.get(n.id);if(!p||n.groupId===next.g.id||p.y>=next.top||p.x+CARD_W<=left||p.x>=right)continue;
   const d=cardDepth(n.id);above=Math.max(above,p.y+d.h+Math.max(boxed.has(n.groupId)?BOX_BELOW:0,d.rows))}
  const need=Math.ceil(above+CLEAR-(next.top-NAME_ABOVE));if(!(need>0))continue;
  for(const p of positions.values())if(p.y>=next.top)p.y+=need;
  if(typeof layout.bandY==='number'&&layout.bandY>=next.top)layout.bandY+=need;
  if(typeof layout.height==='number')layout.height+=need}}

// The horizontal and vertical layouts (and the phone's) get the room. During a redraw Build 163 hands back the same layout
// for every call, so each layout's positions get it once.
const roomed=new WeakSet();
if(typeof unifiedBuilderPositions==='function'){const positionsBefore=unifiedBuilderPositions;
 unifiedBuilderPositions=function(...args){const layout=positionsBefore.apply(this,args);
  if(layout?.positions&&!roomed.has(layout.positions)&&resolvedUnifiedLayoutMode()!=='free'){roomed.add(layout.positions);roomForNames(layout)}
  return layout}}
// Free place's starting positions get both: room under each card, then room for the names. Every Free place redraw asks
// for them (ensureFreePositions) but uses them only for a card with no place yet; with none, they are left as they are.
let ensuring=false;
if(typeof ensureFreePositions==='function'){const ensureBefore=ensureFreePositions;
 ensureFreePositions=function(...args){ensuring=true;try{return ensureBefore.apply(this,args)}finally{ensuring=false}}}
if(typeof automaticPositionsForFree==='function'){const freeBefore=automaticPositionsForFree;
 automaticPositionsForFree=function(...args){const layout=freeBefore.apply(this,args);
  if(ensuring&&typeof cleanFreePosition==='function'&&state.builderNodes.every(n=>cleanFreePosition(state.builderFreePositions?.[n.id])))return layout;
  if(layout?.positions&&!roomed.has(layout.positions)){roomed.add(layout.positions);rowsApart(layout.positions);roomForNames(layout)}
  return layout}}

// A container's box ends 18 px below its lowest card. Above 760 px every card is 224 px tall, and the box is drawn that
// deep (an edit). On a phone a card is as tall as its content, and joining a container adds the container's chip to it in
// the same redraw, so once a redraw is done each box is fitted to its cards as drawn.
function fitBoxes(){
 for(const box of document.querySelectorAll('#builderTree .unifiedGroupBox[data-group-container]')){
  const cards=state.builderNodes.filter(n=>String(n.groupId)===box.dataset.groupContainer)
   .map(n=>document.querySelector(`#builderTree [data-unified-node-wrap="${n.id}"] .builderNode`)).filter(card=>card?.offsetHeight);
  if(!cards.length||!box.offsetHeight)continue;
  const rect=box.getBoundingClientRect(),scale=rect.height/box.offsetHeight||1;
  const height=(Math.max(...cards.map(card=>card.getBoundingClientRect().bottom))-rect.top)/scale+BOX_BELOW;
  if(Math.abs(height-box.offsetHeight)>0.5)box.style.height=Math.round(height*100)/100+'px'}}
if(typeof renderBuilder==='function'){const renderBefore=renderBuilder;
 renderBuilder=function(...args){const result=renderBefore.apply(this,args);if(state.builderGroups?.length)fitBoxes();return result}}

// The Matrix box scrolls sideways, so its header's sticky position only works inside the box, which is as tall as the
// table. A copy of the header, fixed under the toolbar, shows while the real one is above that line and the table's rows
// are still below it. It follows the box's sideways scroll and copies its column widths.
const matrix=document.getElementById('matrix'),table=matrix?.querySelector('table');
if(matrix&&table?.tHead){
 const follow=document.createElement('div');follow.className='matrixFollow210';follow.setAttribute('aria-hidden','true');follow.hidden=true;
 const copy=document.createElement('table');follow.append(copy);matrix.append(follow);
 const toolbar=document.querySelector('.toolbar');let stale=true,queued=false;
 const line=()=>toolbar&&toolbar.getClientRects().length&&getComputedStyle(toolbar).position==='sticky'?Math.max(0,toolbar.getBoundingClientRect().bottom):0;
 const sync=()=>{queued=false;
  if(!matrix.getClientRects().length){follow.hidden=true;return}
  const top=line(),head=table.tHead.getBoundingClientRect(),rows=table.getBoundingClientRect();
  if(!(head.top<top&&rows.bottom>top+head.height)){follow.hidden=true;return}
  if(stale){copy.replaceChildren(table.tHead.cloneNode(true));stale=false}
  const real=table.tHead.rows[0]?.cells||[],cells=copy.tHead?.rows[0]?.cells||[];
  for(let i=0;i<cells.length;i++){const w=real[i]?.getBoundingClientRect().width;if(w)cells[i].style.width=cells[i].style.minWidth=cells[i].style.maxWidth=w+'px'}
  const box=matrix.getBoundingClientRect();follow.hidden=false;
  follow.style.top=top+'px';follow.style.left=box.left+matrix.clientLeft+'px';follow.style.width=matrix.clientWidth+'px';
  copy.style.width=table.offsetWidth+'px';copy.style.transform=`translateX(${-matrix.scrollLeft}px)`};
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(sync)}};
 new MutationObserver(()=>{stale=true;schedule()}).observe(table.tHead,{childList:true,subtree:true,attributes:true,characterData:true});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);matrix.addEventListener('scroll',schedule,{passive:true});
 if(typeof ResizeObserver==='function'){const watch=new ResizeObserver(schedule);watch.observe(table);watch.observe(matrix)}}

if(typeof renderBuilder==='function'&&state.view==='builder')renderBuilder();
})();

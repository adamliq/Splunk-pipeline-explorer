(function(){
/* Build 204: add the next component from a card's Event data handle. Clicking the handle still starts a connection,
   so clicking another card's handle connects the two. It now also opens a list of the components this card can send
   event data to, each with the protocol its link will carry. Choosing one adds it after the card, already connected,
   as one history step. The list comes from the live capability check (dataCapability), which later builds widen and
   narrow, so it offers exactly what the Builder accepts. The palette's "Compatible next component" list now uses it. */
if(typeof beginBuilderConnection!=='function'||typeof dataCapability!=='function'||typeof addBuilderNode!=='function')return;
const esc=builderEscape;

// What a component can send event data to: builderDataCapabilities' order first, then any type a later build allows.
// Build 148's validation rejects syslog sent straight to Splunk Cloud, which the capability check lets through.
function nextTypes(source){
 if(!source)return[];
 const order=[...(builderDataCapabilities[source.type]||[]),...Object.keys(builderComponents)];
 return[...new Set(order)].filter(type=>builderComponents[type]&&dataCapability(source,{id:-1,type}).valid&&!(type==='cloudIndexer148'&&source.type==='syslogSource'));
}
// A load balancer serves what its first link carries, syslog or HEC, as builder-load-balancer-v185's infer and first decide.
const lbKind=n=>n.type==='syslogSource'||n.type==='syslog'?'syslog':['hecClient','awsLambda','azureFunction','apiCollector','hecEndpoint'].includes(n.type)?'hec':null;
// The protocol a link to a new component of that type would carry, as builderHandoff names it. "Splunk Cloud indexing"
// is added as an Indexer hosted in Splunk Cloud, so it is named as one.
function protocolFor(source,type){
 let from=source;const to={id:-1,transport:'Automatic',ack:type==='uf',sets:1,persistent:false,...(type==='cloudIndexer148'?{type:'idx',hosting:'splunkCloud'}:{type})};
 if(type==='loadBalancer')to.lbServes=lbKind(source)||'syslog';
 else if(source.type==='loadBalancer'&&!builderLbClients(source).length&&!builderLbMembers(source).length)from={...source,lbServes:lbKind(to)||source.lbServes,lbListeners:[]};
 try{return builderHandoff(from,to)||''}catch(e){return''}}
const linkFrom=(a,b)=>builderTraceEdges('data').find(e=>e.from===a.id&&e.to===b.id);

let menu=null;
const handleFor=id=>[...document.querySelectorAll(`[data-connection-plane="data"][data-connection-node="${id}"]`)].find(h=>h.getClientRects().length);
const cardFor=id=>[...document.querySelectorAll(`.builderCanvas [data-builder-node="${id}"]`)].find(c=>c.getClientRects().length);
function close(){if(!menu)return;menu.el.remove();handleFor(menu.sourceId)?.setAttribute('aria-expanded','false');menu=null}

// Below the handle, where the card's own column is, so the next column's handles stay clear to connect to; above the card
// when there's no room below. In the vertical layout the next components are below, so the list goes to the right of the
// card, or its left. The first of these with room is used, moved along its other axis to stay on screen; with no room
// anywhere, the first is moved onto the screen. The side is kept while the canvas pans or zooms, and chosen again when the
// window is resized. A card panned right out of the canvas takes its list with it.
function place(keepSide){
 if(!menu)return;const handle=handleFor(menu.sourceId),card=cardFor(menu.sourceId),canvas=document.querySelector('.builderCanvas')?.getBoundingClientRect();
 if(!card){close();return}
 const c=card.getBoundingClientRect(),h=(handle||card).getBoundingClientRect(),r=menu.el.getBoundingClientRect(),gap=8,m=8,vw=innerWidth,vh=innerHeight;
 if(canvas&&(c.right<=canvas.left||c.left>=canvas.right||c.bottom<=canvas.top||c.top>=canvas.bottom)){close();return}
 const spots={below:[c.left,h.bottom+gap,h.bottom+gap+r.height<=vh-m],above:[c.left,c.top-gap-r.height,c.top-gap-r.height>=m],
  right:[c.right+gap,c.top,c.right+gap+r.width<=vw-m],left:[c.left-gap-r.width,c.top,c.left-gap-r.width>=m]};
 const order=resolvedUnifiedLayoutMode()==='vertical'?['right','left','below','above']:['below','above','right','left'];
 if(!keepSide||!menu.side)menu.side=order.find(k=>spots[k][2])||order[0];
 const [x,y]=spots[menu.side];
 menu.el.style.left=Math.round(Math.min(Math.max(m,x),vw-m-r.width))+'px';menu.el.style.top=Math.round(Math.min(Math.max(m,y),vh-m-r.height))+'px';
}

function open(sourceId){
 close();const source=state.builderNodes.find(n=>n.id===sourceId),types=nextTypes(source);if(!types.length)return;
 const el=document.createElement('div'),name=componentInstanceLabel(source);
 // Focusable itself, so a click on its heading or footer keeps focus, and the keys, in the list.
 el.className='addNext204';el.tabIndex=-1;el.setAttribute('role','dialog');el.setAttribute('aria-label','Add after '+name);
 el.innerHTML=`<p class="addNextHead204"><span>Add after</span><b>${esc(name)}</b></p><div class="addNextList204">${types.map(type=>{const m=builderComponents[type],p=protocolFor(source,type);
  return`<button type="button" data-add-next204="${type}" style="--node:${esc(m.color||'#57c7e8')}"><i aria-hidden="true"></i><span><b>${esc(m.name||type)}</b>${p?`<small>${esc(p)}</small>`:''}</span></button>`}).join('')}</div><p class="addNextFoot204">Or click another card’s Event data handle to connect to it.</p>`;
 document.body.appendChild(el);menu={el,sourceId};place();
 el.addEventListener('click',e=>{const b=e.target.closest('[data-add-next204]');if(b)addNext(sourceId,b.dataset.addNext204)});
 el.addEventListener('keydown',key);
 el.addEventListener('focusout',e=>{if(menu?.el===el&&!el.contains(e.relatedTarget)&&e.relatedTarget)close()});
 handleFor(sourceId)?.setAttribute('aria-expanded','true');
 el.querySelector('button')?.focus({preventScroll:true});
}

function key(e){
 if(!menu||e.currentTarget!==menu.el)return;
 const items=[...menu.el.querySelectorAll('button')],i=items.indexOf(document.activeElement);
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();items[(i+(e.key==='ArrowDown'?1:items.length-1))%items.length]?.focus()}
 else if(e.key==='Home'||e.key==='End'){e.preventDefault();items[e.key==='Home'?0:items.length-1]?.focus()}
}
// Esc closes the list and cancels the connection. It is taken before the Builder's own Esc handling, which closes a panel
// (the docked palette and Inspector count as open) and moves focus out of the list, leaving the connection pending.
addEventListener('keydown',e=>{
 if(e.key!=='Escape'||!menu||!menu.el.contains(e.target))return;
 e.preventDefault();e.stopImmediatePropagation();const id=menu.sourceId;close();
 if(state.builderConnectionDraft){state.builderConnectionDraft=null;builderStatus('Connection cancelled');renderBuilder()}
 handleFor(id)?.focus();
},true);

// In Free place, the new card goes one column after its sender, level with it, or lower if a card is already there.
function placeAfter(source,added){
 ensureFreePositions();const P=state.builderFreePositions,s=P[source.id];if(!s)return;
 const W=190,H=224,GAP=24,others=Object.entries(P).filter(([id])=>Number(id)!==added.id).map(([,p])=>p),x=s.x+W+130;let y=s.y;
 const taken=y=>others.some(p=>x<p.x+W+GAP&&x+W+GAP>p.x&&y<p.y+H+GAP&&y+H+GAP>p.y);
 for(let i=0;i<50&&taken(y);i++)y+=H+GAP;P[added.id]={x,y};
}

// The component is added on its own, then connected exactly as the handles connect two cards, so every rule for that link
// applies: a load balancer takes its kind from its first link, Enterprise Security pairs with SOAR, and Splunk Cloud
// indexing takes an Ingest Processor (its own add, given a sender, checks it against a self-managed Indexer). A link the
// handles refuse leaves nothing added, with the reason in the status line. One history step: some types' own add records
// one too, so history is held meanwhile.
function addNext(sourceId,type){
 const source=state.builderNodes.find(n=>n.id===sourceId);close();if(!source)return;
 const before=builderHistorySnapshot(),ids=new Set(state.builderNodes.map(n=>n.id)),plane=state.builderPlane;
 state.builderConnectionDraft=null;state.builderPlane='data';builderHistory.suppress++;
 let added=null;
 try{
  addBuilderNode(type,null);added=state.builderNodes.find(n=>!ids.has(n.id))||null;
  if(added){state.builderConnectionDraft={plane:'data',sourceId:source.id};beginBuilderConnection('data',added.id);state.builderConnectionDraft=null;
   if(!linkFrom(source,added)){restoreBuilderHistorySnapshot(before);added=null}}
 }finally{builderHistory.suppress--;state.builderPlane=plane}
 if(!added){renderBuilder();return}
 if(resolvedUnifiedLayoutMode()==='free')placeAfter(source,added);
 // The new card alone is selected, as a click on it would leave it; the handle's click had added the sender to the selection.
 state.builderSelected=added.id;state.builderSelectedEdge=null;state.builderMultiSelected=[added.id];
 commitBuilderHistory(before,`Add ${builderComponents[type]?.name||type} after ${componentInstanceLabel(source)}`);
 const link=linkFrom(source,added)?.edge?.label;
 builderStatus(`Added ${componentInstanceLabel(added)} after ${componentInstanceLabel(source)}${link?' · '+link:''}`);
 renderBuilder();
 requestAnimationFrame(()=>cardFor(added.id)?.focus({preventScroll:true}));
}

// The handle opens the list as it starts a connection; any other outcome closes it.
const beginBefore=beginBuilderConnection;
beginBuilderConnection=function(plane,nodeId){
 const d0=state.builderConnectionDraft;
 // Clicking the active handle again cancels, as the canvas help says. The change-impact preview read it as a link from the
 // card to itself whenever the card already had an incoming link, and offered to reconnect it instead.
 if(d0&&d0.plane===plane&&d0.sourceId===Number(nodeId)){close();state.builderConnectionDraft=null;builderStatus('Connection cancelled');renderBuilder();return}
 const result=beginBefore.apply(this,arguments),d=state.builderConnectionDraft;
 if(plane==='data'&&d?.plane==='data'&&d.sourceId===Number(nodeId))open(d.sourceId);else close();
 return result};
const renderBefore=renderBuilder;
renderBuilder=function(){const result=renderBefore.apply(this,arguments);if(menu){const d=state.builderConnectionDraft;if(!d||d.plane!=='data'||d.sourceId!==menu.sourceId||state.view!=='builder')close();else place(true)}return result};
const viewportBefore=applyBuilderViewport;
applyBuilderViewport=function(){const result=viewportBefore.apply(this,arguments);place(true);return result};
// Another view can open without a redraw of the Builder, from a shortcut or a menu action.
const viewBefore=switchView;
switchView=function(){close();return viewBefore.apply(this,arguments)};
addEventListener('resize',()=>place());
document.addEventListener('pointerdown',e=>{if(menu&&!menu.el.contains(e.target)&&!e.target.closest?.('[data-connection-plane]'))close()},true);

// The handle says what it does, and that it opens a list, on components that can send event data on: not a Search Head,
// say. Whether a type can is worked out once, as it doesn't change, so a redraw costs nothing more.
const sends=new Map(),canSend=n=>{if(!sends.has(n.type))sends.set(n.type,nextTypes(n).length>0);return sends.get(n.type)};
const handleBefore=connectionHandle;
connectionHandle=function(plane,nodeId){const html=handleBefore(plane,nodeId),node=state.builderNodes.find(n=>n.id===nodeId);if(plane!=='data'||!node||!canSend(node))return html;
 return html.replace('<button ',`<button aria-haspopup="dialog" aria-expanded="${menu?.sourceId===nodeId}" `).replace(/title="[^"]*"/,'title="Connect event data, or add the next component"').replace(/aria-label="[^"]*"/,`aria-label="Event data from ${esc(builderNodeLabel(node))}: connect it, or add the next component"`)};

// The palette's "Compatible next component" list: the same types, and the same add.
if(typeof paletteCompatibleTypes==='function')paletteCompatibleTypes=function(){return nextTypes(state.builderNodes.find(n=>n.id===state.builderSelected))};
if(typeof renderPaletteSuggestions==='function'){const suggestionsBefore=renderPaletteSuggestions;renderPaletteSuggestions=function(){const result=suggestionsBefore.apply(this,arguments);
 document.querySelectorAll('#builderSuggestions [data-palette-suggest]').forEach(b=>b.onclick=()=>{if(state.builderSelected!=null)addNext(state.builderSelected,b.dataset.paletteSuggest)});return result}}
})();

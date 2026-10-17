(function(){
/* Build 197: from 1280px, Components and the Inspector dock beside the canvas, both open at once. */
const media=window.matchMedia('(min-width:1280px)'),root=$('#topologyBuilder'),grid=$('.builderGrid'),canvas=$('.builderCanvas');
const storeKey='splunkPipelineExplorer.dockedPanels.v1',dock={components:true,inspector:true};
try{const saved=JSON.parse(localStorage.getItem(storeKey)||'null');if(saved&&typeof saved==='object'){dock.components=saved.components!==false;dock.inspector=saved.inspector!==false}}catch{}
const save=()=>{try{localStorage.setItem(storeKey,JSON.stringify(dock))}catch{}};
const isDocked=()=>media.matches&&state.view==='builder'&&!state.builderCanvasFocus;
const esc=builderEscape;
// Pin is retired from 761px: docking replaces it, and pinned overlays broke the grid below 1680px. Phones keep it as it was.
const phone=window.matchMedia('(max-width:760px)'),storedPin=key=>{try{return localStorage.getItem(key)==='true'}catch{return false}};
let pinsOff=false;
const unpin=()=>{
 if(!phone.matches){canvasPanelState.pinned=false;try{builderPalettePinned126=false}catch{}pinsOff=true}
 else if(pinsOff){pinsOff=false;canvasPanelState.pinned=storedPin('splunkPipelineExplorer.inspectorPinned.v1');try{builderPalettePinned126=storedPin('splunkPipelineExplorer.palettePinned.v1')}catch{}}
};unpin();
const rail=(side,label,arrow)=>{const b=document.createElement('button');b.type='button';b.className='dockRail197 dockRail'+side+'197';b.innerHTML='<b aria-hidden="true">'+arrow+'</b><span>'+label+'</span><i aria-hidden="true"></i>';b.setAttribute('aria-label','Show '+label);b.title='Show '+label;return b};
const railLeft=rail('Left','Components','›'),railRight=rail('Right','Inspector','‹');
const resizer=document.createElement('div');resizer.className='dockResizer197';resizer.setAttribute('role','separator');resizer.setAttribute('aria-orientation','vertical');resizer.setAttribute('aria-label','Resize Inspector');resizer.tabIndex=0;
grid.append(railLeft,railRight,resizer);
const summary=document.createElement('section');summary.id='dockSummary197';summary.hidden=true;canvasInspector.querySelector('.builderCanvasPanelHeader')?.after(summary);
const paletteClose=$('#builderPaletteDrawerClose'),inspectorClose=$('#builderInspectorDrawerClose');
// The Inspector may take whatever the canvas has beyond 580px (measured, so page gutters don't matter), within 300–560px.
const inspectorMax=()=>{const right=parseFloat(root.style.getPropertyValue('--dock-right197'))||340;return Math.max(300,Math.min(560,Math.floor(canvas.getBoundingClientRect().width+right-580)))};
const inspectorWidth=()=>Math.max(300,Math.min(inspectorMax(),Number(builderSpaceInspectorWidth140)||340));
function layout(){
 root.style.setProperty('--dock-left197',dock.components?'280px':'40px');
 root.style.setProperty('--dock-right197',dock.inspector?inspectorWidth()+'px':'40px');
 const g=grid.getBoundingClientRect(),c=canvas.getBoundingClientRect();
 if(c.height){root.style.setProperty('--dock-offset197',Math.max(0,Math.round(c.top-g.top))+'px');root.style.setProperty('--dock-height197',Math.round(c.height)+'px');root.style.setProperty('--dock-canvas-width197',Math.round(c.width)+'px')}
}
function keepView(before){requestAnimationFrame(()=>{const after=canvas.clientWidth;if(!before||!after||Math.abs(after-before)<2)return;if(typeof builderSpaceReadFit140==='function'&&builderSpaceReadFit140())fitBuilderView(false);else{state.builderViewport.x+=(after-before)/2;applyBuilderViewport()}})}
// Docked, the Close buttons read Hide; undocked, they get Build 196's own text and labels back. Unchanged values aren't rewritten.
const original=button=>button&&{text:button.textContent,label:button.getAttribute('aria-label'),title:button.getAttribute('title')};
const closeOriginals=new Map([[paletteClose,original(paletteClose)],[inspectorClose,original(inspectorClose)]]);
const setAttr=(el,name,value)=>{if(value==null)el.removeAttribute(name);else if(el.getAttribute(name)!==value)el.setAttribute(name,value)};
function relabel(button,docked,text,label){if(!button)return;const o=closeOriginals.get(button),t=docked?text:o.text;if(button.textContent!==t)button.textContent=t;setAttr(button,'aria-label',docked?label:o.label);setAttr(button,'title',docked?label:o.title)}
function labels(docked){
 relabel(paletteClose,docked,'‹ Hide','Hide Components');
 relabel(inspectorClose,docked,'Hide ›','Hide Inspector');
 railRight.classList.toggle('hasSelection197',state.builderSelected!=null||!!state.builderSelectedEdge);
}
// The summary shows or hides at once; its counts and findings (which run Validate) are rebuilt at most once a frame,
// outside renderBuilder, so redraws keep their budget.
let summaryFrame=0;
function topologySummary(){
 const empty=isDocked()&&dock.inspector&&state.builderSelected==null&&!state.builderSelectedEdge;
 canvasInspector.classList.toggle('dockEmpty197',empty);if(summary.hidden===empty)summary.hidden=!empty;if(!empty||summaryFrame)return;
 summaryFrame=requestAnimationFrame(()=>{summaryFrame=0;if(!summary.hidden)fillSummary()});
}
function fillSummary(){
 const count=plane=>builderTraceEdges(plane).length,data=count('data'),fleet=count('management'),access=count('authentication'),f=builderFindingSummary();
 const title=state.builderPresentation?.title||defaultPresentationTitle();
 summary.innerHTML='<span class="builderLabel">Topology</span><h3>'+esc(title)+'</h3><p class="dockMeta197">Nothing selected</p>'+
  '<dl><dt>Components</dt><dd>'+state.builderNodes.length+'</dd><dt>Event data</dt><dd>'+data+' link'+(data===1?'':'s')+'</dd><dt>Fleet management</dt><dd>'+fleet+' link'+(fleet===1?'':'s')+'</dd><dt>User access</dt><dd>'+access+' link'+(access===1?'':'s')+'</dd></dl>'+
  '<div class="dockFindings197'+(f.errors||f.review?'':' valid197')+'"><span>'+(f.errors||f.review?f.errors+' error'+(f.errors===1?'':'s')+' · '+f.review+' to review':'No findings')+'</span>'+(f.errors||f.review?'<button type="button" data-dock-review>Review</button>':'')+'</div>'+
  '<p class="dockHint197">Select a component or link to inspect it. Right-click a component for its actions.</p>';
 summary.querySelector('[data-dock-review]')?.addEventListener('click',()=>openBuilderDrawer('review'));
}
let wasDocked=false;
const syncBefore=syncCanvasPanels;
syncCanvasPanels=function(...args){
 const docked=isDocked(),before=canvas.clientWidth;
 unpin();
 if(docked){canvasPanelState.palette=dock.components;canvasPanelState.inspector=dock.inspector}
 else if(wasDocked){canvasPanelState.palette=false;canvasPanelState.inspector=false}
 const result=syncBefore(...args);
 root.classList.toggle('builderDocked197',docked);
 root.classList.toggle('dockLeftCollapsed197',docked&&!dock.components);
 root.classList.toggle('dockRightCollapsed197',docked&&!dock.inspector);
 if(!phone.matches)root.classList.remove('canvasPalettePinned','canvasInspectorPinned');
 if(docked){canvasPalette.inert=!dock.components;canvasInspector.inert=!dock.inspector;canvasPalette.setAttribute('aria-hidden',String(!dock.components));canvasInspector.setAttribute('aria-hidden',String(!dock.inspector));layout()}
 labels(docked);topologySummary();
 if(docked!==wasDocked||docked)keepView(before);
 wasDocked=docked;
 return result;
};
// Explicit show and hide. Everything else that closes a panel is overridden while docked.
document.addEventListener('click',event=>{
 if(!isDocked())return;
 const target=event.target.closest?.('#builderPaletteDrawerClose,#builderInspectorDrawerClose,.dockRailLeft197,.dockRailRight197');if(!target)return;
 event.preventDefault();event.stopPropagation();
 if(target===paletteClose)dock.components=false;else if(target===inspectorClose)dock.inspector=false;else if(target===railLeft)dock.components=true;else dock.inspector=true;
 save();syncCanvasPanels();
 if(target===railLeft)$('#builderPaletteQuery')?.focus();else if(target===railRight)$('#builderInspectorName')?.focus({preventScroll:true});else (target===paletteClose?railLeft:railRight).focus();
},true);
// Esc in Components can't close it while docked, so it hands focus back to the canvas.
canvasPalette.addEventListener('keydown',event=>{if(event.key!=='Escape'||!isDocked())return;setTimeout(()=>{const active=document.activeElement;if(!active||active===document.body||canvasPalette.contains(active))canvas.focus({preventScroll:true})},0)},true);
// Docked, Components never reopens, so its "Adding after" line follows the selection instead (see refreshBuilderSelection below).
const syncTarget=()=>{if(isDocked()&&typeof syncBuilderPaletteTarget==='function')syncBuilderPaletteTarget()};
// "+ Add", the A key and the change-target flow open Components; inspect actions open the Inspector. Selection alone leaves a hidden Inspector hidden.
const openPaletteBefore=openBuilderCanvasPalette;
// Like Build 196, opening either panel (selecting included) closes an open drawer first.
openBuilderCanvasPalette=function(options={}){if(!isDocked())return openPaletteBefore(options);if(activeDrawerKind)closeBuilderDrawer();if(!dock.components){dock.components=true;save()}syncCanvasPanels();syncTarget();if(options.focus!==false)$('#builderPaletteQuery')?.focus()};
const openInspectorBefore=openBuilderCanvasInspector;
openBuilderCanvasInspector=function(options={}){if(!isDocked())return openInspectorBefore(options);if(activeDrawerKind)closeBuilderDrawer();if(options.focus&&!dock.inspector){dock.inspector=true;save()}syncCanvasPanels();if(options.focus)$('#builderInspectorName')?.focus({preventScroll:true})};
const contextBefore=runContextAction;runContextAction=function(action,...args){if(action==='inspect'&&isDocked()&&!dock.inspector){dock.inspector=true;save();syncCanvasPanels()}return contextBefore(action,...args)};
// Resize the Inspector from its left edge (300px to whatever leaves the canvas 580px).
let drag=null;
const setWidth=w=>{builderSpaceInspectorWidth140=Math.max(300,Math.min(inspectorMax(),w));root.style.setProperty('--builder-inspector-width-v140',builderSpaceInspectorWidth140+'px');layout()};
const keepWidth=()=>{try{localStorage.setItem('splunkPipelineExplorer.inspectorWidth.v1',String(builderSpaceInspectorWidth140))}catch{}};
resizer.addEventListener('pointerdown',event=>{drag={id:event.pointerId,x:event.clientX,width:inspectorWidth(),view:canvas.clientWidth};resizer.setPointerCapture(event.pointerId);resizer.classList.add('active197');event.preventDefault()});
resizer.addEventListener('pointermove',event=>{if(drag&&event.pointerId===drag.id)setWidth(drag.width+drag.x-event.clientX)});
resizer.addEventListener('pointerup',()=>{if(!drag)return;const before=drag.view;drag=null;resizer.classList.remove('active197');keepWidth();keepView(before)});
resizer.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const before=canvas.clientWidth;setWidth(inspectorWidth()+(event.key==='ArrowLeft'?12:-12));keepWidth();keepView(before)});
// Keep the columns in step with the window, the view and the selection.
let resizeTimer=0;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(isDocked()){const before=canvas.clientWidth;layout();keepView(before)}},60)});
media.addEventListener('change',()=>requestAnimationFrame(()=>syncCanvasPanels()));
phone.addEventListener('change',()=>{if(state.view==='builder')syncCanvasPanels()});
if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(isDocked())layout()}).observe(canvas);
const switchBefore=switchView;switchView=function(...args){const result=switchBefore(...args);if(state.view==='builder')requestAnimationFrame(()=>syncCanvasPanels());return result};
const renderBefore=renderBuilder;renderBuilder=function(...args){const result=renderBefore(...args);if(state.view==='builder'){labels(isDocked());topologySummary()}return result};
const refreshBefore=refreshBuilderSelection;refreshBuilderSelection=function(...args){const result=refreshBefore(...args);if(state.view==='builder'){labels(isDocked());topologySummary();syncTarget()}return result};
const focusBefore=toggleBuilderCanvasFocus;toggleBuilderCanvasFocus=function(...args){const result=focusBefore(...args);syncCanvasPanels();return result};
syncCanvasPanels();
})();

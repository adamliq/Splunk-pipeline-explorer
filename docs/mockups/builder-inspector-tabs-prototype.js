(function(){
/* Build 199: the Inspector shows one thing at a time and splits it into tabs, like draw.io's Format panel.
   - A component: Component, Connections, Settings, Fleet and Access, each shown only when the component has something for it.
   - A link: Link, Assurance and Route, titled with both ends. Build 198 titled a link with its target component and kept the
     link's own settings at the end of that component's "Advanced settings".
   - Several components or links: Selection, with bulk edit (moved here from Tools) and, in Free place layout, align and distribute.
   - A container opened from Containers: Container.
   - Nothing: Topology, with the name, the counts, the findings, the Validate profile, layout and grid.
   The app's blocks stay where its renderers put them. After each render this marks every block with its tab (data-it199),
   and the CSS shows one tab. */
const ins=$('.builderInspector'),root=$('#topologyBuilder');if(!ins||!root)return;
const q=selector=>document.querySelector(selector);
const text=el=>(el?.textContent||'').replace(/\s+/g,' ').trim();
const esc=builderEscape;
const docked=()=>root.classList.contains('builderDocked197');
// Sync runs after every render, so it writes only what changed: an unchanged write still restyles the Inspector.
const setProp=(el,key,value)=>{if(el&&el[key]!==value)el[key]=value};

// History: a control here that works through an existing control records one change, under that control's own label.
let skipCommits=0;
const commitBefore=commitBuilderHistory;commitBuilderHistory=function(...args){if(skipCommits>0){skipCommits--;return false}return commitBefore(...args)};
const delegate=fn=>{skipCommits++;setTimeout(()=>{skipCommits=Math.max(0,skipCommits-1)},0);fn()};
const setOriginal=(orig,value)=>delegate(()=>{orig.value=value;orig.dispatchEvent(new Event('input',{bubbles:true}));orig.dispatchEvent(new Event('change',{bubbles:true}))});

const TABS={component:[['component','Component'],['connections','Connections'],['settings','Settings'],['fleet','Fleet'],['access','Access']],
 link:[['link','Link'],['assurance','Assurance'],['route','Route']],
 selection:[['selection','Selection']],container:[['container','Container']],topology:[['topology','Topology']]};
const remembered={component:'component',link:'link'};

// ---- New elements, under the component's name and type.
const head=document.createElement('div');head.className='ihead199';
const bar=document.createElement('div');bar.className='itabs199';bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Inspector sections');
const selection=document.createElement('section');selection.className='isel199';selection.setAttribute('aria-label','Selection');
const topology=document.createElement('section');topology.className='itopo199';topology.setAttribute('aria-label','Topology');
(q('#builderInspectorType')||ins.firstElementChild).after(head,bar,selection,topology);
const mine=node=>[head,bar,selection,topology].some(el=>el.contains(node));

// ---- Which tab each block belongs to.
const MEMBERSHIP=new Set(['idx','shcMember']); // cluster membership says where a component sits
const ASSURANCE=/^(Flow classification|Flow criticality|Operational owner|Availability SLO|Latency SLO|Retry|Criticality|Validation state|Operational dependency|Notes)/i;
function blockTab(el,node){
 const id=el.id;
 if(id==='builderInspectorQuick'||id==='builderCapabilityInspector'||el.classList.contains('builderHelp'))return 'connections';
 if(id==='builderDeploymentConfigInspector'||id==='builderFleetInspector')return 'fleet';
 if(id==='builderAuthenticationInspector')return 'access';
 if(id==='builderGroupInspector')return 'container';
 if(id==='builderEnterpriseManagementNote')return 'component';
 if(id==='builderIndexClusterInspector'||id==='builderShcInspector')return MEMBERSHIP.has(node?.type)?'component':'settings';
 return 'settings'; // pipeline sets, handoff, reliability, owned stages and every component-specific block
}
const labelText=el=>{for(const n of el.childNodes){if(n.nodeType===3&&n.textContent.trim())return n.textContent.trim();if(n.nodeType===1&&!n.matches('input,select,textarea'))return text(n)}return ''};
const mark=(el,tab)=>{if(el.dataset.it199!==tab)el.dataset.it199=tab};
function markAll(){
 const node=state.builderNodes.find(n=>n.id===state.builderSelected),basic=q('#builderInspectorBasic'),inst=q('#builderInstanceInspector'),adv=q('#builderInspectorAdvanced'),body=q('#builderAdvancedBody'),rel=q('#builderRelationshipInspector'),grid=rel?.querySelector('.relationshipInspectorGrid');
 if(inst)for(const c of inst.children)mark(c,c.matches('section:not(.managedInspector176)')?'settings':'component');
 if(basic)for(const c of basic.children)if(c!==inst)mark(c,blockTab(c,node));
 if(body)for(const c of body.children)if(c!==rel)mark(c,blockTab(c,node));
 if(rel)for(const c of rel.children){
  if(c===grid||c.classList.contains('relationshipInspectorActions'))continue; // Focus target and Disconnect stay on every link tab
  mark(c,c.matches('.relationshipInspectorHead,.relationshipRoute')?'none':c.matches('.relationshipAssuranceSummary')?'assurance':c.matches('.routingInspector')?'route':'link')}
 if(grid)for(const c of grid.children)mark(c,ASSURANCE.test(labelText(c))?'assurance':'link');
 const auth=q('#builderRelationshipAuthSummary128');if(auth)mark(auth,'link');
 for(const c of [basic,inst,adv,body,rel,grid]){if(!c)continue;const has=[...new Set([...c.querySelectorAll('[data-it199]')].map(e=>e.dataset.it199))].join(' ');if(c.dataset.it199Has!==has)c.dataset.it199Has=has}
}
// A tab shows when one of its blocks has something in it. Renderers empty a block or set display:none when it doesn't apply.
const filled=el=>!el.hidden&&el.style.display!=='none'&&text(el)!=='';

// ---- What is selected. A container counts when it was opened after the last change of selection.
let mode='',last=null,containerOpen=false;
function currentMode(){
 const edge=state.builderSelectedEdge,group=state.builderSelectedGroup||null;
 const key={node:state.builderSelected??null,edge:edge?edge.plane+':'+edge.id:'',multi:(state.builderMultiSelected||[]).join(','),edges:(state.builderBulkEdges||[]).join(','),group};
 if(!last||key.group!==last.group)containerOpen=!!key.group;
 else if(key.node!==last.node||key.edge!==last.edge||key.multi!==last.multi||key.edges!==last.edges)containerOpen=false;
 last=key;
 if(containerOpen&&group&&builderGroupById(group))return 'container';
 if((state.builderMultiSelected||[]).length>1||(state.builderBulkEdges||[]).length>1)return 'selection';
 if(edge&&builderEdgeRecord(edge.plane,edge.id))return 'link';
 if(key.node!=null&&state.builderNodes.some(n=>n.id===key.node))return 'component';
 return 'topology';
}

// ---- Tabs.
function selectTabButton(tab){for(const b of bar.children){const on=b.dataset.tab199===tab;if(b.getAttribute('aria-selected')!==String(on))b.setAttribute('aria-selected',String(on));if(b.tabIndex!==(on?0:-1))b.tabIndex=on?0:-1}}
function renderTabs(tabs,tab){
 const sig=tabs.map(([k])=>k).join(','),changed=bar.dataset.sig!==sig||bar.dataset.tab!==tab;
 if(bar.dataset.sig!==sig){bar.dataset.sig=sig;for(const b of widths.keys())sizes.unobserve(b);widths.clear();
  bar.innerHTML=tabs.map(([k,l])=>`<button type="button" role="tab" id="itab199-${k}" data-tab199="${k}">${l}</button>`).join('');for(const b of bar.children)sizes.observe(b)}
 bar.dataset.tab=tab;selectTabButton(tab);
 if(changed)keepTabInView();
}
// When the tabs don't fit, the strip scrolls to the selected one. Whether they fit comes from a ResizeObserver, which reports
// sizes after layout, so a sync never forces a layout of the page. Scrolling waits for the next frame and reads layout only
// when the tabs overflow.
const widths=new Map();let barWidth=0,viewFrame=0;
const sizes=new ResizeObserver(entries=>{for(const e of entries){if(e.target===bar)barWidth=e.contentRect.width;else widths.set(e.target,e.borderBoxSize?.[0]?.inlineSize??e.target.offsetWidth)}keepTabInView()});
sizes.observe(bar);
function keepTabInView(){if(!viewFrame)viewFrame=requestAnimationFrame(()=>{viewFrame=0;
 if(widths.size<bar.children.length||[...widths.values()].reduce((sum,w)=>sum+w,0)<=barWidth+1)return;
 const b=bar.querySelector('[aria-selected="true"]');if(!b)return;
 if(b.offsetLeft<bar.scrollLeft)bar.scrollLeft=b.offsetLeft-6;else if(b.offsetLeft+b.offsetWidth>bar.scrollLeft+bar.clientWidth)bar.scrollLeft=b.offsetLeft+b.offsetWidth-bar.clientWidth+6})}
function setTab(tab,{user=false,keepScroll=false}={}){
 if(user&&mode in remembered)remembered[mode]=tab;
 if(ins.dataset.itab199===tab)return;
 ins.dataset.itab199=tab;bar.dataset.tab=tab;selectTabButton(tab);keepTabInView();
 // The new tab starts just under the strip, not wherever the last one was scrolled to.
 if(!keepScroll){const first=[...ins.querySelectorAll(`[data-it199="${tab}"]`)].find(e=>e.getClientRects().length);
  if(first){const delta=first.getBoundingClientRect().top-(bar.getBoundingClientRect().bottom+12);if(delta<0||ins.scrollTop>0)ins.scrollTop=Math.max(0,ins.scrollTop+delta)}}
}
bar.addEventListener('click',event=>{const b=event.target.closest('[data-tab199]');if(b)setTab(b.dataset.tab199,{user:true})});
bar.addEventListener('keydown',event=>{
 const buttons=[...bar.children],i=buttons.indexOf(document.activeElement);if(i<0)return;
 const next={ArrowRight:(i+1)%buttons.length,ArrowLeft:(i-1+buttons.length)%buttons.length,Home:0,End:buttons.length-1}[event.key];
 if(next===undefined)return;event.preventDefault();buttons[next].focus();setTab(buttons[next].dataset.tab199,{user:true});
});

// ---- Titles for the views that aren't a component.
const planeName=plane=>text(q('#builderRelationshipInspector .relationshipPlaneBadge'))||({data:'Event data',management:'Fleet management',authentication:'User access'}[plane]||plane);
function renderHead(){
 let html='';
 if(mode==='link'){
  const e=state.builderSelectedEdge,r=builderEdgeRecord(e.plane,e.id),arrow=text(q('#builderRelationshipInspector .relationshipRoute b'))||'→';
  // Build 198 puts "Insert component on selected connection" in the target's connection list, which a link doesn't show.
  html=`<span class="eyebrow199">${esc(planeName(e.plane))} link</span><h3 class="route199"><button type="button" data-select199="${r.source.id}" title="Inspect ${esc(componentInstanceLabel(r.source))}">${esc(componentInstanceLabel(r.source))}</button><b aria-hidden="true">${esc(arrow)}</b><button type="button" data-select199="${r.target.id}" title="Inspect ${esc(componentInstanceLabel(r.target))}">${esc(componentInstanceLabel(r.target))}</button></h3>${r.label?`<p class="meta199">${esc(r.label)}</p>`:''}${q('#insertOnSelectedEdge')?'<button type="button" class="insert199" data-iinsert199>＋ Insert a component on this link</button>':''}`;
 }else if(mode==='selection'){
  const n=(state.builderMultiSelected||[]).length,l=(state.builderBulkEdges||[]).length,parts=[n?`${n} component${n===1?'':'s'}`:'',l?`${l} link${l===1?'':'s'}`:''].filter(Boolean);
  html=`<span class="eyebrow199">Selection</span><h3>${parts.join(' and ')} selected</h3><p class="meta199">Shift-click to add or remove</p>`;
 }else if(mode==='container'){
  const g=builderGroupById(state.builderSelectedGroup),members=state.builderNodes.filter(n=>n.groupId===g.id).length;
  html=`<span class="eyebrow199">Container</span><h3>${esc(g.name||'Container')}</h3><p class="meta199">${members} member${members===1?'':'s'}</p>`;
 }else if(mode==='topology'){
  const links=['data','management','authentication'].reduce((sum,plane)=>sum+builderTraceEdges(plane).length,0);
  html=`<span class="eyebrow199">Topology</span><h3>${esc(state.builderPresentation?.title||defaultPresentationTitle())}</h3><p class="meta199">${state.builderNodes.length} component${state.builderNodes.length===1?'':'s'} · ${links} link${links===1?'':'s'} · nothing selected</p>`;
 }
 if(head.dataset.sig!==html){head.dataset.sig=html;head.innerHTML=html}
}
head.addEventListener('click',event=>{const b=event.target.closest('[data-select199]');if(b)selectBuilderObjectFast({kind:'node',id:Number(b.dataset.select199)});
 if(event.target.closest('[data-iinsert199]')){const orig=q('#insertOnSelectedEdge');if(orig)delegate(()=>orig.click())}});

// ---- Selection: the items, bulk edit and arrange.
const bulk=q('#builderBulkEdit');
selection.innerHTML='<div class="chips199" aria-label="Selected items"></div>'+
 '<div class="card199"><h4>Bulk edit</h4><div class="bulkHost199"></div></div>'+
 '<div class="card199"><h4>Align and distribute</h4><div class="row199 align199" role="group" aria-label="Align">'+
 [['left','Left','Align left edges'],['centre','Centre','Align horizontal centres'],['right','Right','Align right edges'],['top','Top','Align top edges'],['middle','Middle','Align vertical centres'],['bottom','Bottom','Align bottom edges']].map(([a,l,t])=>`<button type="button" class="btn199" data-ialign199="${a}" title="${t}">${l}</button>`).join('')+
 '</div><div class="row199" role="group" aria-label="Distribute" style="margin-top:6px"><button type="button" class="btn199" data-idist199="horizontal" title="Distribute horizontally">Distribute across</button><button type="button" class="btn199" data-idist199="vertical" title="Distribute vertically">Distribute down</button></div>'+
 '<p class="note199" data-inote199></p><div class="row199" data-ifree199 style="margin-top:8px"><button type="button" class="btn199" data-iusefree199>Use Free place layout</button></div></div>';
// Bulk edit moves here from Tools for good: Tools stops pulling it back, and its fold is always open.
if(bulk&&typeof secondaryToolIds!=='undefined'){const i=secondaryToolIds.indexOf('builderBulkEdit');if(i>=0)secondaryToolIds.splice(i,1);selection.querySelector('.bulkHost199').append(bulk)}
selection.addEventListener('click',event=>{
 const chip=event.target.closest('[data-iselect199]'),edge=event.target.closest('[data-iedge199]'),align=event.target.closest('[data-ialign199]'),dist=event.target.closest('[data-idist199]');
 if(chip)selectBuilderObjectFast({kind:'node',id:Number(chip.dataset.iselect199)});
 else if(edge){const [plane,...id]=edge.dataset.iedge199.split(':');const raw=id.join(':');selectBuilderObjectFast({kind:'edge',plane,id:/^\d+$/.test(raw)?Number(raw):raw})}
 else if(align)alignSelectedComponents(align.dataset.ialign199);
 else if(dist)distributeSelectedComponents(dist.dataset.idist199);
 else if(event.target.closest('[data-iusefree199]')){const s=q('#unifiedLayoutMode');if(s)setOriginal(s,'free')}
});
function renderSelection(){
 const nodes=(state.builderMultiSelected||[]).map(Number).map(id=>state.builderNodes.find(n=>n.id===id)).filter(Boolean),edges=selectedBulkEdges();
 const chips=nodes.map(n=>`<button type="button" data-iselect199="${n.id}" title="Inspect only ${esc(componentInstanceLabel(n))}">${esc(componentInstanceLabel(n))}</button>`).concat(edges.map(e=>`<button type="button" data-iedge199="${esc(e.plane)}:${esc(String(e.id))}" title="Inspect only this link">${esc(componentInstanceLabel(e.source))} → ${esc(componentInstanceLabel(e.target))}</button>`)).join('');
 const box=selection.querySelector('.chips199');if(box.dataset.sig!==chips){box.dataset.sig=chips;box.innerHTML=chips}
 if(bulk&&!bulk.open)bulk.open=true;
 const free=resolvedUnifiedLayoutMode()==='free',count=nodes.length;
 for(const b of selection.querySelectorAll('[data-ialign199]'))setProp(b,'disabled',!free||count<2);
 for(const b of selection.querySelectorAll('[data-idist199]'))setProp(b,'disabled',!free||count<3);
 const note=free?(count<2?'Select two or more components to align them.':count<3?'Select three or more components to distribute them.':''):'Align and distribute work in Free place layout, where you position components yourself.';
 const n=selection.querySelector('[data-inote199]');setProp(n,'textContent',note);setProp(n,'hidden',!note);
 setProp(selection.querySelector('[data-ifree199]'),'hidden',free);
}

// ---- Topology: name, counts, findings, Validate profile, layout and grid.
topology.innerHTML='<div class="card199"><label class="field199">Name<input id="itopoName199" maxlength="140" autocomplete="off"></label></div>'+
 '<div class="card199"><h4>Contents</h4><dl data-icounts199></dl><div class="findings199" data-ifind199><span></span><button type="button" class="btn199" data-ireview199>Review</button></div></div>'+
 '<div class="card199"><h4>Validate</h4><label class="field199">Validate for<select id="itopoProfile199" data-mirror199="#builderRuleProfileSelect"></select></label></div>'+
 '<div class="card199"><h4>Layout</h4><label class="field199">Layout<select id="itopoLayout199" data-mirror199="#unifiedLayoutMode"></select></label><label class="field199">Group by<select id="itopoGroup199" data-mirror199="#builderGroupBy130"></select></label>'+
 '<div class="row199"><button type="button" class="btn199" data-itidy199 title="Arrange components by relationship depth">Tidy layout</button></div></div>'+
 '<div class="card199"><h4>Grid</h4><label class="check199"><input type="checkbox" id="itopoSnap199"> Snap to grid</label><label class="field199">Grid spacing<select id="itopoGrid199"><option value="10">10 px</option><option value="20">20 px</option><option value="40">40 px</option></select></label>'+
 '<p class="note199">The grid applies when you move components in Free place layout.</p></div>'+
 '<p class="note199">Select a component or link to inspect it. Right-click a component for its actions.</p>';
const nameInput=topology.querySelector('#itopoName199');
nameInput.addEventListener('input',()=>{state.builderPresentation=state.builderPresentation||{};state.builderPresentation.title=nameInput.value;const overlay=q('#builderPresentationTitle');if(overlay)overlay.value=nameInput.value;renderHead()});
for(const select of topology.querySelectorAll('[data-mirror199]'))select.addEventListener('change',()=>{const orig=q(select.dataset.mirror199);if(orig)setOriginal(orig,select.value)});
topology.querySelector('[data-itidy199]').addEventListener('click',()=>{const orig=q('#builderAutoLayout');if(orig&&!orig.disabled)delegate(()=>orig.click())});
topology.querySelector('[data-ireview199]').addEventListener('click',()=>openBuilderDrawer('review'));
// Snap and spacing work like the Free place toolbar's, which exists only in that layout.
topology.querySelector('#itopoSnap199').addEventListener('change',event=>{const orig=q('#builderSnapGrid');if(orig){orig.checked=event.target.checked;orig.dispatchEvent(new Event('change',{bubbles:true}));return}
 state.builderSnapToGrid=event.target.checked;try{localStorage.setItem('splunkPipelineExplorer.snapToGrid',String(state.builderSnapToGrid))}catch{}builderStatus(state.builderSnapToGrid?`Snap-to-grid enabled · ${state.builderGridSize}px`:'Snap-to-grid disabled')});
topology.querySelector('#itopoGrid199').addEventListener('change',event=>{const orig=q('#builderGridSize');if(orig){orig.value=event.target.value;orig.dispatchEvent(new Event('change',{bubbles:true}));return}
 state.builderGridSize=Number(event.target.value)||20;try{localStorage.setItem('splunkPipelineExplorer.gridSize',String(state.builderGridSize))}catch{}builderStatus(`Grid spacing set to ${state.builderGridSize}px`);renderBuilder()});
function renderTopology(){
 if(document.activeElement!==nameInput){const v=state.builderPresentation?.title||'';if(nameInput.value!==v)nameInput.value=v;nameInput.placeholder=defaultPresentationTitle()}
 const count=plane=>builderTraceEdges(plane).length,rows=[['Components',state.builderNodes.length,''],['Event data',count('data'),'link'],['Fleet management',count('management'),'link'],['User access',count('authentication'),'link']];
 const dl=rows.map(([k,n,unit])=>`<dt>${k}</dt><dd>${n}${unit?` ${unit}${n===1?'':'s'}`:''}</dd>`).join(''),box=topology.querySelector('[data-icounts199]');if(box.dataset.sig!==dl){box.dataset.sig=dl;box.innerHTML=dl}
 // The counts come from the Validate summary the toolbar shows, so this doesn't run Validate again.
 const summary=q('.builderSpaceValidation140')?.closest('summary'),title=summary?.title||text(summary),find=topology.querySelector('[data-ifind199]');
 if(!title)setProp(find,'hidden',true);else{const errors=+(title.match(/(\d+) errors?/)||[0,0])[1],review=+(title.match(/(\d+) to review/)||[0,0])[1];setProp(find,'hidden',false);
  find.classList.toggle('err199',errors>0);find.classList.toggle('ok199',!errors&&!review);setProp(find.querySelector('span'),'textContent',errors||review?`${errors} error${errors===1?'':'s'} · ${review} to review`:'No findings');setProp(find.querySelector('button'),'hidden',!errors&&!review)}
 for(const select of topology.querySelectorAll('[data-mirror199]')){const orig=q(select.dataset.mirror199);setProp(select.closest('label'),'hidden',!orig);if(!orig)continue;if(select.innerHTML!==orig.innerHTML)select.innerHTML=orig.innerHTML;if(document.activeElement!==select)select.value=orig.value;setProp(select,'disabled',orig.disabled)}
 const tidy=q('#builderAutoLayout');setProp(topology.querySelector('[data-itidy199]'),'disabled',!tidy||tidy.disabled);
 const snap=topology.querySelector('#itopoSnap199');snap.checked=!!state.builderSnapToGrid;
 const grid=topology.querySelector('#itopoGrid199');if(document.activeElement!==grid)grid.value=String(state.builderGridSize||20);
}

// ---- Keeping it in step with the app.
let frame=0;
const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;sync()})};
function sync(){
 const previous=mode;mode=currentMode();
 // Selecting something else closes an open container, so its chip in Containers opens it again with one click.
 if(previous==='container'&&mode!=='container'&&state.builderSelectedGroup)q('#builderCloseGroup')?.click();
 if(mode==='component')renderBuilderCapabilityInspector(); // the click path skips it; it is memoised
 if(ins.dataset.imode199!==mode)ins.dataset.imode199=mode;
 const adv=q('#builderInspectorAdvanced');if(adv&&!adv.open)adv.open=true;
 markAll();
 let tabs=TABS[mode];
 if(mode==='component'||mode==='link'){const shown=tabs.filter(([k])=>[...ins.querySelectorAll(`[data-it199="${k}"]`)].some(filled));tabs=shown.length?shown:tabs.slice(0,1)}
 const want=remembered[mode],tab=want&&tabs.some(([k])=>k===want)?want:tabs[0][0];
 if(ins.dataset.itab199!==tab)ins.dataset.itab199=tab;
 renderTabs(tabs,tab);renderHead();
 if(mode==='selection')renderSelection();
 if(mode==='topology')renderTopology();
 watchHeader();
}
// The strip sticks under the panel header, whose height changes with its buttons. A ResizeObserver reports it after layout.
let header=null;
const headerObserver=new ResizeObserver(([entry])=>{const height=entry.borderBoxSize?.[0]?.blockSize??entry.target.offsetHeight,top=Math.max(0,Math.round(height)-14)+'px';
 if(ins.style.getPropertyValue('--itabs-top199')!==top)ins.style.setProperty('--itabs-top199',top)});
function watchHeader(){const h=ins.querySelector(':scope>.builderCanvasPanelHeader');if(h&&h!==header){if(header)headerObserver.unobserve(header);header=h;headerObserver.observe(h,{box:'border-box'})}}
const renderBefore=renderBuilder;renderBuilder=function(...args){const result=renderBefore(...args);schedule();return result};
const refreshBefore=refreshBuilderSelection;refreshBuilderSelection=function(...args){const result=refreshBefore(...args);schedule();return result};
new MutationObserver(records=>{if(records.some(r=>!mine(r.target)))schedule()}).observe(ins,{childList:true,subtree:true});
document.addEventListener('toggle',event=>{if(event.target.id==='builderInspectorAdvanced'&&!event.target.open&&ins.dataset.imode199)event.target.open=true},true);
window.addEventListener('resize',schedule);

// Code that focuses or scrolls to a field in another tab (inspecting a finding, for example) switches to that tab first.
function reveal(el){
 if(!(el instanceof Element)||!ins.contains(el)||mine(el))return;
 sync();
 const tagged=el.closest('[data-it199]');if(!tagged||tagged.dataset.it199==='none'||tagged.dataset.it199===ins.dataset.itab199)return;
 if(bar.querySelector(`[data-tab199="${tagged.dataset.it199}"]`))setTab(tagged.dataset.it199,{keepScroll:true});
}
const focusBefore=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(...args){try{reveal(this)}catch(error){console.error(error)}return focusBefore.apply(this,args)};
const scrollBefore=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(...args){try{reveal(this)}catch(error){console.error(error)}return scrollBefore.apply(this,args)};

// Edit › Bulk edit… (Build 198's menu bar) opened Tools at Bulk edit. Now it shows the Selection tab, and needs a selection.
const bulkItem=[...document.querySelectorAll('.mbItem198')].find(b=>/^Bulk edit/.test(text(b.querySelector('.mbLabel198'))));
if(bulkItem){
 bulkItem.addEventListener('click',event=>{event.stopImmediatePropagation();const menu=bulkItem.closest('details');if(menu)menu.open=false;
  if(docked()){if(root.classList.contains('dockRightCollapsed197'))q('.dockRailRight197')?.click()}else openBuilderCanvasInspector({focus:false});
  sync();requestAnimationFrame(()=>bulk?.querySelector('select:not(:disabled),button:not(:disabled)')?.focus())},true);
 document.addEventListener('toggle',event=>{if(!event.target.open||!event.target.contains?.(bulkItem))return;const ready=currentMode()==='selection';bulkItem.disabled=!ready;
  const note=bulkItem.querySelector('small');if(note){note.textContent=ready?text(q('#builderBulkCount')).replace(/^·\s*/,''):'Select two or more components or links first (Shift-click).';note.hidden=false}},true);
}
sync();
})();

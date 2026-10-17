(function(){
/* Build 198: from 761px, one menu bar (File, Edit, View, Arrange, Validate, Analyze, Help) and one toolbar (undo and redo,
   zoom, + Add, the planes, Find and the Validate status). Each new control delegates to an existing one, which stays where
   earlier blocks keep it, hidden, so its handlers and the layers that move it keep working. */
const media=window.matchMedia('(min-width:761px)'),root=$('#topologyBuilder'),head=$('.builderHead');
const q=selector=>document.querySelector(selector);
const text=el=>(el?.textContent||'').replace(/\s+/g,' ').trim();
const docked=()=>root.classList.contains('builderDocked197');
const after=(el,sep)=>{const t=text(el),i=t.indexOf(sep);return i<0?'':t.slice(i+sep.length).trim()};
// History records a change around every click or change inside the Builder. A delegated action is two clicks (ours, then the
// original's), so the outer one's commit is skipped: the original's own records the change, with its own label, or not at all
// for Undo and Redo. The counter resets on the next tick in case the outer click wasn't recorded.
let skipCommits=0;
const commitBefore=commitBuilderHistory;commitBuilderHistory=function(...args){if(skipCommits>0){skipCommits--;return false}return commitBefore(...args)};
const delegate=fn=>{skipCommits++;setTimeout(()=>{skipCommits=Math.max(0,skipCommits-1)},0);fn()};

// ---- Menu bar: replaces the old action row beside the title.
const bar=document.createElement('nav');bar.className='builderMenuBar198';bar.setAttribute('aria-label','Builder menus');
const menusEl=document.createElement('div');menusEl.className='mbMenus198';
const status=document.createElement('div');status.className='mbStatus198';
status.innerHTML='<span class="mbSaveState198" role="status"></span><button type="button" class="mbSave198">Save</button>';
bar.append(menusEl,status);
const titleBox=head.querySelector(':scope > div:first-child');if(titleBox)titleBox.after(bar);else head.prepend(bar);

const syncers=new Map();
function menu(label){const items=makeBuilderMenu(label,menusEl),details=items.parentElement;details.classList.add('mb198');syncers.set(details,[]);return {items,details,sync:fn=>syncers.get(details).push(fn)}}
function item(m,label,o={}){
 const b=document.createElement('button');b.type='button';b.className='mbItem198'+(o.danger?' mbDanger198':'');
 b.innerHTML=(o.check?'<span class="mbCheck198" aria-hidden="true"></span>':'')+'<span class="mbLabel198"></span>'+(o.keys?'<kbd></kbd>':'')+(o.aside?'<span class="mbAside198"></span>':'');
 const lab=b.querySelector('.mbLabel198');lab.textContent=label;if(o.keys)b.querySelector('kbd').textContent=o.keys;
 let small=null;if(o.note){small=document.createElement('small');lab.append(small)}
 b.addEventListener('click',()=>{if(o.run)o.run();else{const orig=q(o.from);if(orig&&!orig.disabled)delegate(()=>orig.click())}});
 m.items.append(b);
 m.sync(()=>{const orig=o.from?q(o.from):null;
  if(o.from)b.disabled=!orig||!!orig.disabled;if(o.enabled)b.disabled=!o.enabled();
  if(small){const t=o.note(orig,b.disabled);small.textContent=t||'';small.hidden=!t}
  if(o.aside)b.querySelector('.mbAside198').textContent=o.aside(orig)||'';
  if(o.check){const on=!!o.check();b.setAttribute('role','menuitemcheckbox');b.setAttribute('aria-checked',String(on));b.querySelector('.mbCheck198').textContent=on?'✓':''}});
 return b;
}
// A select in a menu mirrors the original select, and changing it changes the original.
function field(m,label,from){
 const wrap=document.createElement('label');wrap.className='mbField198';const span=document.createElement('span');span.textContent=label;const select=document.createElement('select');wrap.append(span,select);m.items.append(wrap);
 select.addEventListener('change',()=>{const orig=q(from);if(!orig)return;delegate(()=>{orig.value=select.value;orig.dispatchEvent(new Event('input',{bubbles:true}));orig.dispatchEvent(new Event('change',{bubbles:true}))})});
 m.sync(()=>{const orig=q(from);wrap.hidden=!orig;if(!orig)return;if(select.innerHTML!==orig.innerHTML)select.innerHTML=orig.innerHTML;select.value=orig.value;select.disabled=orig.disabled});
}
const sep=m=>{const hr=document.createElement('hr');hr.className='mbSep198';m.items.append(hr)};
const heading=(m,t)=>{const h=document.createElement('div');h.className='mbHeading198';h.textContent=t;m.items.append(h)};
const note=(m,fn)=>{const n=document.createElement('div');n.className='mbNote198';m.items.append(n);m.sync(()=>{const t=fn();n.textContent=t||'';n.hidden=!t})};

// Tools and Containers keep their panels on the canvas; the menus open them at the right section.
const densityPanels=['builderFindNavigate','builderRuleProfileDisclosure','builderReviewDisclosure','builderSecondaryTools','builderSpaceGroups140'];
function openPanel(panelId,sectionId){
 for(const id of densityPanels){const p=q('#'+id);if(p&&id!==panelId)p.open=false}
 const panel=q('#'+panelId),section=sectionId?q('#'+sectionId):panel;if(!panel||!section)return;
 panel.open=true;if(section.tagName==='DETAILS')section.open=true;
 q('.builderSpaceGroupToggle140')?.setAttribute('aria-expanded',String(panelId==='builderSpaceGroups140'));
 if(typeof builderDensitySync==='function')builderDensitySync();
 // Scroll only vertically: some sections are wider than the panel, and scrollIntoView would also scroll sideways.
 requestAnimationFrame(()=>{const box=q('.builderDensityPanels');if(box){const b=box.getBoundingClientRect(),s=section.getBoundingClientRect();if(s.top<b.top||s.bottom>b.bottom)box.scrollTop+=s.top-b.top-8;box.scrollLeft=0}
  const target=[...section.querySelectorAll('summary,select,button,input,textarea')].find(el=>el!==panelClose&&!el.disabled&&el.getClientRects().length);(target||panelClose).focus({preventScroll:true})});
}
// The dock buttons opened and closed these panels. Without them, an open panel gets a header with its name and Close.
const panelHead=document.createElement('div');panelHead.className='mbPanelHead198';panelHead.innerHTML='<b></b><button type="button" class="mbPanelClose198">Close ×</button>';
const panelClose=panelHead.querySelector('button');
function closePanels(){for(const id of densityPanels){const p=q('#'+id);if(p)p.open=false}q('.builderSpaceGroupToggle140')?.setAttribute('aria-expanded','false');if(typeof builderDensitySync==='function')builderDensitySync();q('.builderCanvas')?.focus({preventScroll:true})}
panelClose.addEventListener('click',closePanels);
document.addEventListener('toggle',event=>{const panel=event.target;if(!media.matches||!densityPanels.includes(panel.id)||!panel.open)return;const summary=panel.querySelector(':scope>summary');
 panelHead.querySelector('b').textContent=text(summary?.querySelector('strong'))||text(summary)||'Tools';panelClose.setAttribute('aria-label','Close '+panelHead.querySelector('b').textContent);
 if(summary)summary.after(panelHead);else panel.prepend(panelHead)},true);
const compShown=()=>docked()?!root.classList.contains('dockLeftCollapsed197'):!!canvasPanelState.palette;
const insShown=()=>docked()?!root.classList.contains('dockRightCollapsed197'):!!canvasPanelState.inspector;
function toggleComponents(){if(docked())(compShown()?q('#builderPaletteDrawerClose'):q('.dockRailLeft197'))?.click();else q('#builderAddToggle')?.click()}
function toggleInspector(){if(docked())(insShown()?q('#builderInspectorDrawerClose'):q('.dockRailRight197'))?.click();else q('#builderInspectorToggle')?.click()}
function showSoarGuide(){const guide=q('#builderSoarGuide');if(!guide)return;root.classList.add('soarGuide198');guide.open=true;guide.querySelector('summary')?.focus()}
document.addEventListener('toggle',event=>{if(event.target.id==='builderSoarGuide'&&!event.target.open)root.classList.remove('soarGuide198')},true);
const describe=id=>()=>text(q('#'+id+' .builderMenuDescription167'));

const file=menu('File');
item(file,'Save',{from:'#builderSave'});
sep(file);heading(file,'Saved topologies');
field(file,'Topology','#builderSaved');
item(file,'Load',{from:'#builderLoadSaved',note:(orig,off)=>off?text(q('.builderLoadReason163'))||orig?.title:''});
sep(file);
item(file,'Import JSON…',{from:'#builderImport'});
item(file,'Import from architecture pack…',{from:'#builderImportPack125'});
sep(file);heading(file,'Export');
field(file,'Scope','#builderExportScope');
note(file,()=>text(q('#builderExportScopeBar small')));
item(file,'Export JSON',{from:'#builderExport'});
item(file,'Architecture pack',{from:'#builderExportPack'});
item(file,'Export SVG',{from:'#builderExportSvg'});
item(file,'Export PNG',{from:'#builderExportPng'});
item(file,'Print / present',{from:'#builderPrintPresent'});
sep(file);
item(file,'Use in explorer',{from:'#builderUse'});
item(file,'Open in Failure Lab',{from:'#builderFailure'});
sep(file);
item(file,'Clear canvas…',{from:'#builderClear',danger:true});

const edit=menu('Edit');
item(edit,'Undo',{from:'#builderUndo',keys:'Ctrl Z'});
item(edit,'Redo',{from:'#builderRedo',keys:'Ctrl Y'});
// The old History button opened a popover under itself; from the menu, open the History drawer it linked to.
item(edit,'History',{run:()=>openBuilderDrawer('history'),aside:()=>text(q('#builderHistoryCount'))});
sep(edit);
item(edit,'Find',{keys:'/',run:()=>{const input=q('#builderSearchInput');input?.focus();input?.select?.()}});
sep(edit);
item(edit,'Bulk edit…',{run:()=>openPanel('builderSecondaryTools','builderBulkEdit'),note:()=>after(q('#builderBulkEdit>summary'),'·')});
item(edit,'Connection template…',{run:()=>openPanel('builderSecondaryTools','builderTemplateBar')});

const view=menu('View');
item(view,'Components',{check:compShown,run:toggleComponents});
item(view,'Inspector',{check:insShown,run:toggleInspector});
item(view,'Minimap',{check:()=>/hide/i.test(text(q('#builderMinimapToggle'))),run:()=>q('#builderMinimapToggle')?.click()});
sep(view);
item(view,'Zoom in',{keys:'+',run:()=>q('.builderMobileZoomButton[data-mobile-zoom="in"]')?.click()});
item(view,'Zoom out',{keys:'-',run:()=>q('.builderMobileZoomButton[data-mobile-zoom="out"]')?.click()});
item(view,'Fit to canvas',{from:'#builderFitView',keys:'0'});
sep(view);
item(view,'Focus canvas',{from:'#builderFocusToggle'});
item(view,'Presentation',{from:'#builderPresentationToggle'});
item(view,'Full screen',{from:'#builderFullscreenToggle'});

const arrange=menu('Arrange');
field(arrange,'Layout','#unifiedLayoutMode');
field(arrange,'Group by','#builderGroupBy130');
item(arrange,'Tidy layout',{from:'#builderAutoLayout',note:()=>'Arrange components by relationship depth.'});
item(arrange,'Collapse or expand all hosts',{from:'#builderToggleHosts147'});
sep(arrange);
item(arrange,'Containers…',{run:()=>openPanel('builderSpaceGroups140')});
item(arrange,'Layout profiles…',{run:()=>openPanel('builderSecondaryTools','builderProfileBar')});

const validate=menu('Validate');
field(validate,'Validate for','#builderRuleProfileSelect');
sep(validate);
item(validate,'Coverage',{from:'#builderCoverageToggle'});
item(validate,'Review',{from:'#builderUnresolvedToggle',aside:orig=>(text(orig).match(/\d+/)||[''])[0]});
item(validate,'Rules',{from:'#builderRulesToggle'});
sep(validate);
item(validate,'Route validation…',{run:()=>openPanel('builderSecondaryTools','builderRoutePanel'),note:()=>{const t=after(q('#builderRoutePanel>summary'),'·');return (t.match(/^\d+ errors? · \d+ review items?/)||[t])[0]}});

const analyze=menu('Analyze');
for(const [id,label] of [['builderTraceToggle','Trace path'],['builderLoadPath','Load selected path'],['builderInventoryToggle','Inventory'],['builderNetworkToggle','Network'],['builderStatsToggle','Statistics']])item(analyze,label,{from:'#'+id,note:describe(id)});
sep(analyze);
item(analyze,'Configuration draft…',{run:()=>openPanel('builderSecondaryTools','builderConfigDraft'),note:()=>{const t=after(q('#builderConfigDraft>summary'),'·');return /select an object/i.test(t)?'Select a component first':t}});

const help=menu('Help');
item(help,'Canvas controls and shortcuts',{run:()=>q('.builderSpaceHelp140')?.click()});
item(help,'SOAR playbooks guide',{run:showSoarGuide,enabled:()=>!!q('#builderSoarGuide'),aside:()=>after(q('#builderSoarGuide>summary'),'·').replace(/\s*ⓘ$/,''),note:(orig,off)=>off?'Shown when the topology has a SOAR platform.':''});
sep(help);
item(help,'About Builder',{run:()=>q('.builderInfo159')?.click()});

// Fill each menu as it opens, and open bar menus below their own label, left-aligned.
document.addEventListener('toggle',event=>{const d=event.target;if(!syncers.has(d)||!d.open)return;for(const fn of syncers.get(d))try{fn()}catch(error){console.error(error)}},true);
function place(d){const body=d.querySelector('.builderMenuItems'),r=d.querySelector('summary').getBoundingClientRect(),top=Math.round(r.bottom+4);body.style.position='fixed';body.style.right='auto';body.style.maxHeight=Math.max(160,innerHeight-top-12)+'px';body.style.left=Math.max(8,Math.min(innerWidth-body.offsetWidth-8,r.left))+'px';body.style.top=top+'px'}
const clampBefore=builderClampMenus163;builderClampMenus163=function(...args){const result=clampBefore(...args);for(const d of syncers.keys())if(d.open)place(d);return result};
window.addEventListener('resize',()=>{for(const d of syncers.keys())if(d.open)place(d)});
// Keyboard: ← → move between menus, ↓ ↑ move through items, Esc closes and returns to the menu's label.
const items=d=>[...d.querySelectorAll('.mbItem198,.mbField198 select')].filter(el=>!el.disabled&&!el.closest('[hidden]'));
menusEl.addEventListener('keydown',event=>{
 const d=event.target.closest('details.mb198');if(!d)return;const onLabel=!!event.target.closest('summary'),labels=[...menusEl.querySelectorAll(':scope>details>summary')];
 if(event.key==='ArrowRight'||event.key==='ArrowLeft'){if(event.target.tagName==='SELECT')return;event.preventDefault();const next=labels[(labels.indexOf(d.querySelector('summary'))+(event.key==='ArrowRight'?1:labels.length-1))%labels.length],wasOpen=d.open;d.open=false;next.focus();if(wasOpen){next.parentElement.open=true;requestAnimationFrame(()=>items(next.parentElement)[0]?.focus())}}
 else if(event.key==='ArrowDown'||event.key==='ArrowUp'){if(event.target.tagName==='SELECT')return;event.preventDefault();if(onLabel){d.open=true;requestAnimationFrame(()=>{const list=items(d);(event.key==='ArrowDown'?list[0]:list[list.length-1])?.focus()})}else{const list=items(d),i=list.indexOf(document.activeElement);list[(i+(event.key==='ArrowDown'?1:list.length-1))%list.length]?.focus()}}
 else if(event.key==='Escape'&&d.open){event.preventDefault();event.stopPropagation();d.open=false;d.querySelector('summary').focus()}
});
// With one bar menu open, pointing at another label opens that one instead.
menusEl.addEventListener('mouseover',event=>{const label=event.target.closest('summary');if(!label)return;const open=menusEl.querySelector(':scope>details[open]');if(open&&open!==label.parentElement)label.parentElement.open=true});

// Save state at the right of the menu bar.
const saveState=status.querySelector('.mbSaveState198');
status.querySelector('.mbSave198').addEventListener('click',()=>delegate(()=>q('#builderSave')?.click()));
// "No unsaved changes" also contains "unsaved", so test for the clean state first.
function syncSave(){const s=q('#builderSaveState'),t=text(s),dirty=/unsaved/i.test(t)&&!/\bno unsaved/i.test(t);saveState.textContent=dirty?'● Unsaved changes':'Saved';saveState.classList.toggle('dirty198',dirty);saveState.title=s?.title||t}

// ---- Toolbar: the plane bar, with history, zoom and + Add in front and the Validate status at the end.
const lead=document.createElement('div');lead.className='tbLead198';
lead.innerHTML='<div class="tbGroup198" role="group" aria-label="History"><button type="button" class="tbBtn198" data-tb="undo">↶<span>Undo</span></button><button type="button" class="tbBtn198" data-tb="redo">↷<span>Redo</span></button></div>'+
 '<div class="tbGroup198" role="group" aria-label="Zoom"><button type="button" class="tbBtn198" data-tb="out" aria-label="Zoom out" title="Zoom out">−</button><output class="tbZoomValue198">100%</output><button type="button" class="tbBtn198" data-tb="in" aria-label="Zoom in" title="Zoom in">+</button><button type="button" class="tbBtn198" data-tb="fit" title="Fit to canvas (0)">Fit</button></div>'+
 '<button type="button" class="tbBtn198 tbAdd198" data-tb="add" title="Add a component (A on the canvas)" aria-expanded="false">＋ Add</button>';
const chip=document.createElement('button');chip.type='button';chip.className='tbValidate198';chip.innerHTML='<i aria-hidden="true"></i><span class="tbLong198"></span><span class="tbShort198"></span>';
lead.addEventListener('click',event=>{const b=event.target.closest('[data-tb]');if(!b||b.disabled)return;const k=b.dataset.tb;
 if(k==='undo')delegate(()=>q('#builderUndo')?.click());else if(k==='redo')delegate(()=>q('#builderRedo')?.click());
 else if(k==='out'||k==='in')q(`.builderMobileZoomButton[data-mobile-zoom="${k}"]`)?.click();
 else if(k==='fit')q('#builderFitView')?.click();
 else if(k==='add'){if(docked())openBuilderCanvasPalette({focus:true});else q('#builderAddToggle')?.click()}
 syncToolbar()});
chip.addEventListener('click',()=>{if(activeDrawerKind==='review')closeBuilderDrawer();else openBuilderDrawer('review')});
function syncToolbar(){
 for(const [key,id] of [['undo','#builderUndo'],['redo','#builderRedo']]){const b=lead.querySelector(`[data-tb="${key}"]`),orig=q(id);b.disabled=!orig||!!orig.disabled;const label=orig?.title||(key==='undo'?'Undo':'Redo');b.title=label;b.setAttribute('aria-label',label)}
 lead.querySelector('.tbZoomValue198').textContent=text(q('#builderMobileZoomPercent'))||Math.round((state.builderViewport?.zoom||1)*100)+'%';
 lead.querySelector('[data-tb="add"]').setAttribute('aria-expanded',String(!docked()&&q('#builderAddToggle')?.getAttribute('aria-expanded')==='true'));
 const summary=q('.builderSpaceValidation140')?.closest('summary'),title=summary?.title||text(summary),errors=+(title.match(/(\d+) errors?/)||[0,0])[1],review=+(title.match(/(\d+) to review/)||[0,0])[1];
 chip.classList.toggle('err198',errors>0);chip.classList.toggle('ok198',!errors&&!review);
 chip.querySelector('.tbLong198').textContent=errors||review?`${errors} error${errors===1?'':'s'} · ${review} to review`:'Valid';
 chip.querySelector('.tbShort198').textContent=errors?`${errors} error${errors===1?'':'s'}`:review?`${review} to review`:'Valid';
 chip.setAttribute('aria-label',`Validation: ${errors} error${errors===1?'':'s'}, ${review} to review. Open Review.`);chip.title='Open Review';
 chip.setAttribute('aria-expanded',String(activeDrawerKind==='review'));
}
function attach(){const planeBar=q('.builderPlaneBar');if(!planeBar)return;if(lead.parentElement!==planeBar)planeBar.prepend(lead);if(chip.parentElement!==planeBar)planeBar.append(chip)}
// renderUnifiedPlaneControls rewrites the plane bar, so the toolbar's own controls go back in after it.
const planesBefore=renderUnifiedPlaneControls;renderUnifiedPlaneControls=function(...args){const result=planesBefore(...args);attach();return result};
let frame=0;const schedule=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;attach();syncToolbar();syncSave()})};
const renderBefore=renderBuilder;renderBuilder=function(...args){const result=renderBefore(...args);if(state.view==='builder')schedule();return result};
const viewportBefore=applyBuilderViewport;applyBuilderViewport=function(...args){const result=viewportBefore(...args);if(state.view==='builder')schedule();return result};
const drawerBefore=drawBuilderDrawer;drawBuilderDrawer=function(...args){const result=drawerBefore(...args);schedule();return result};
const watch=(selector,options)=>{const el=q(selector);if(el)new MutationObserver(schedule).observe(el,options)};
watch('#builderUndo',{attributes:true,attributeFilter:['disabled','title']});watch('#builderRedo',{attributes:true,attributeFilter:['disabled','title']});
watch('#builderSaveState',{childList:true,characterData:true,subtree:true,attributes:true});
watch('.builderMobileZoomControls',{childList:true,characterData:true,subtree:true});
watch('#builderAddToggle',{attributes:true,attributeFilter:['aria-expanded']});
const validateSummary=q('.builderSpaceValidation140')?.closest('summary');if(validateSummary)new MutationObserver(schedule).observe(validateSummary,{attributes:true,attributeFilter:['title'],childList:true,characterData:true,subtree:true});
// The fit keeps 56px clear on the left for the dock buttons, which the menu bar replaces.
const visibleBefore=builderVisibleRect163;
builderVisibleRect163=function(...args){const rect=visibleBefore(...args);if(!media.matches||state.builderCanvasFocus)return rect;const left=16;return {...rect,left,width:Math.max(1,rect.canvas.width-left-rect.right)}};
// Closing the palette or the Inspector returns focus to the bottom bar's "+ Add" or "Inspector", which the bars hide.
// While the bars show, that focus goes to the canvas, or to the toolbar's + Add when it opened the palette over the canvas.
// The same goes for the dock buttons, which the Build 198 Esc fix focuses when it closes their panel.
const toCanvas=()=>q('.builderCanvas');
for(const [orig,target] of [[q('#builderAddToggle'),()=>docked()?toCanvas():lead.querySelector('[data-tb="add"]')],[q('#builderInspectorToggle'),toCanvas],...[...document.querySelectorAll('.builderDensityToggle'),builderSpaceGroupButton140].map(b=>[b,toCanvas])]){if(!orig)continue;
 orig.focus=function(options){if(media.matches&&state.view==='builder'&&!state.builderCanvasFocus)return target()?.focus(options);return HTMLElement.prototype.focus.call(this,options)}}// builderHeaderFit142 drops the two-row header when the old rows' controls fit in one; with the menu bar there are always two rows.
const headerFitBefore=builderHeaderFit142;builderHeaderFit142=function(...args){const result=headerFitBefore(...args);if(media.matches&&state.view==='builder'&&!state.builderCanvasFocus)head.classList.add('builderTwoRows142');return result};
attach();syncToolbar();syncSave();builderHeaderFit142();
})();

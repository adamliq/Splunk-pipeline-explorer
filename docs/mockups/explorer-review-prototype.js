(function(){
'use strict';
// Build 231: the fixes and improvements from the review of every page. Each part names its item in the review list.
const KEY='splunkPipelineExplorer.review231.';
const store={get(k,d){try{const v=localStorage.getItem(KEY+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(KEY+k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shell=document.querySelector('main.shell');
const viewOf=()=>document.body.dataset.view||'flow';
// One pass after the page changes: the parts below that follow re-renders hook in here.
const after=[];let queued=false;
const run=()=>{queued=false;for(const f of after){try{f()}catch(e){console.warn('Build 231',e)}}};
const soon=()=>{if(!queued){queued=true;requestAnimationFrame(run)}};
new MutationObserver(soon).observe(document.body,{childList:true,subtree:true});
addEventListener('resize',soon);

// ---- 14. The shared section (component cards, capacity, processing diagram) folds away on the views where it is context.
const CTX_VIEWS=['flow','matrix','operations','diagnostic','failure','changes'],CTX_OPEN={flow:true,matrix:true};
const ctxBar=document.createElement('div');ctxBar.className='ctx231';ctxBar.innerHTML='<p class="ctx231Now" aria-live="polite"></p><button type="button" class="ctx231Toggle" aria-controls="routeDiagram" aria-expanded="true"></button>';
document.querySelector('nav.topologyBar')?.after(ctxBar);
const ctxOpen=v=>store.get('ctx.'+v,!!CTX_OPEN[v]);
function ctxApply(){const v=viewOf(),on=CTX_VIEWS.includes(v),open=on?ctxOpen(v):true;document.body.dataset.ctx231=open?'open':'folded';ctxBar.hidden=!on;
 const btn=ctxBar.querySelector('button');btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'Hide components and model':'Show components and model';
 const comp=document.querySelector('section.componentStrip .component.active strong')?.textContent.trim()||'All components',path=document.querySelector('nav.topologyBar .chip.active')?.textContent.replace(/\s+/g,' ').trim()||'Complete model';
 ctxBar.querySelector('.ctx231Now').textContent=open?'':`Showing ${comp} on ${path}.`}
ctxBar.querySelector('button').addEventListener('click',()=>{const v=viewOf();store.set('ctx.'+v,!ctxOpen(v));ctxApply()});
window.explorerContext231={open:v=>ctxOpen(v),set:(v,open)=>{store.set('ctx.'+v,!!open);ctxApply()}};

// ---- 6 and 16. The Matrix: a box one window high under the toolbar (--stick231, kept to the toolbar's height), with its
// header row at the box's top, and a key that says what Y, Y* and N mean. 20: in the Config view with no files read,
// the table waits behind a button.
const matrix=document.getElementById('matrix');
const key=document.createElement('p');key.className='matrixKey231';key.id='matrixKey231';
key.innerHTML='<span><b class="k231 yes">Y</b> runs on that component</span><span><b class="k231 maybe">Y*</b> runs when its setting or condition applies</span><span><b class="k231 none">N</b> not used</span>';
const cfgTable=document.createElement('div');cfgTable.className='configTable231';cfgTable.innerHTML='<p>The stage table shows where each of the <span data-stage-count231></span> stages runs. It waits until you read files, or you can open it now.</p><button type="button" class="builderBtn" aria-expanded="false" aria-controls="matrix">Show the stage table</button>';
if(matrix){matrix.before(cfgTable);matrix.before(key)}
cfgTable.querySelector('button').addEventListener('click',e=>{const open=document.body.dataset.configTable231!=='open';document.body.dataset.configTable231=open?'open':'';e.currentTarget.setAttribute('aria-expanded',String(open));e.currentTarget.textContent=open?'Hide the stage table':'Show the stage table'});
cfgTable.querySelector('[data-stage-count231]').textContent=String(typeof stages!=='undefined'&&stages.length?stages.length:125);
const toolbar=document.querySelector('section.toolbar');
const stick=()=>{if(!toolbar)return;const s=getComputedStyle(toolbar),r=toolbar.getBoundingClientRect();const v=s.position==='sticky'||s.position==='fixed'?Math.ceil((parseFloat(s.top)||0)+r.height):0;document.documentElement.style.setProperty('--stick231',v+'px')};
if(toolbar&&window.ResizeObserver)new ResizeObserver(stick).observe(toolbar);stick();addEventListener('resize',stick);

// ---- 15 and 18. Rows and diagrams that scroll sideways show a fade where more is hidden.
const CUE='nav.topologyBar,.ovTabs135,.combinedOverlayCanvas,.custodyMap,.failureMap,.matrixWrap,.tablewrap,.rasciWrap,.ops231Scroll';
function cue(el){const more=el.scrollWidth-el.clientWidth>2;el.classList.toggle('cueRight231',more&&el.scrollLeft+el.clientWidth<el.scrollWidth-2);el.classList.toggle('cueLeft231',more&&el.scrollLeft>2)}
document.addEventListener('scroll',e=>{if(e.target instanceof Element&&e.target.matches(CUE))cue(e.target)},true);
// The Failure Lab's stage flow scrolls in the parent of its track.
after.push(()=>{if(viewOf()==='builder')return;if(viewOf()==='failure'){const t=document.querySelector('#failureLab .mapTrack');const box=t&&[t.parentElement,t.parentElement?.parentElement].find(a=>a&&/auto|scroll/.test(getComputedStyle(a).overflowX));box?.classList.add('failureMap')}
 for(const el of document.querySelectorAll(CUE))if(el.checkVisibility())cue(el)});

// ---- 17. The Failure Lab's scenarios: a count and a filter above the list. The two share the lab's first grid cell, in a
// column of their own, so the lab keeps its two cells: the list and the scenario's detail.
const scen=document.getElementById('scenarioList');
if(scen){const col=document.createElement('div');col.className='scenCol231';scen.before(col);
 const head=document.createElement('div');head.className='scen231';head.innerHTML='<label for="scenFilter231" class="scen231Count"></label><input id="scenFilter231" type="search" placeholder="Filter by name or stage" autocomplete="off">';col.append(head,scen);
 const input=head.querySelector('input'),count=head.querySelector('label');
 const filter=()=>{const q=input.value.trim().toLowerCase(),items=[...scen.querySelectorAll('[data-failure]')];let shown=0;
  for(const b of items){const hit=!q||b.textContent.toLowerCase().includes(q)||b.classList.contains('active');b.hidden=!hit;if(hit)shown++}
  count.textContent=q?`${shown} of ${items.length} scenarios`:`${items.length} scenarios`};
 input.addEventListener('input',filter);new MutationObserver(filter).observe(scen,{childList:true});filter()}

// ---- 8. An Operate table wider than its space scrolls in a box of its own instead of being cut off. Only such a table
// is boxed: a box makes the page's sticky headers stick inside it, so its header is held at its top (styles).
// ---- 9. Each Operate form field gets the label beside it as its name.
let fieldIds=0;
after.push(()=>{if(viewOf()!=='operations')return;const c=document.getElementById('operationsContent');if(!c)return;
 for(const t of c.querySelectorAll('table')){if(t.parentElement.classList.contains('ops231Scroll')||!t.checkVisibility())continue;let a=t.parentElement,boxed=false;for(;a&&a!==c;a=a.parentElement)if(/auto|scroll/.test(getComputedStyle(a).overflowX)){boxed=true;break}
  if(boxed||t.getBoundingClientRect().width<=t.parentElement.clientWidth+1)continue;const w=document.createElement('div');w.className='ops231Scroll';t.before(w);w.append(t)}
 for(const l of c.querySelectorAll('label:not([for])')){if(l.querySelector('input,select,textarea'))continue;const f=l.nextElementSibling;if(!f||!f.matches('input:not([type=hidden]),select,textarea'))continue;if(!f.id)f.id='opsField231-'+(++fieldIds);l.htmlFor=f.id}});
after.push(()=>{const finder=document.getElementById('builderSearchInput');if(finder&&!finder.getAttribute('aria-label'))finder.setAttribute('aria-label','Find components on the canvas')});

// ---- 10. Clickable parts of the OV diagrams are named by their own text.
after.push(()=>{if(viewOf()!=='ov')return;const ws=document.getElementById('ovWorkspace135');if(!ws)return;
 for(const g of ws.querySelectorAll('g[role=button]:not([aria-label]),g[tabindex]:not([aria-label])')){if(g.querySelector('title'))continue;let t=[...g.querySelectorAll('text')].map(x=>x.textContent.trim()).filter(Boolean).join(' ');
  // A link drawn without words takes its name from its row in the page, which carries the same id.
  if(!t&&g.dataset.k){const row=g.closest('[data-ov-panel]')?.querySelector(`tr[data-k="${CSS.escape(g.dataset.k)}"]`);t=row?[...row.cells].slice(0,3).map(c=>c.textContent.trim()).filter(Boolean).join(', '):g.dataset.k}
  t=t.replace(/\s+/g,' ').slice(0,140);if(t)g.setAttribute('aria-label',t)}});

// Showing an OV page only changes which page is hidden, which the observer above doesn't see: the after-draw parts run
// then too, for the page's fades and names.
if(typeof builderOvShow135==='function'){const showBefore231=builderOvShow135;builderOvShow135=function(...a){const r=showBefore231.apply(this,a);soon();return r}}

// ---- 11. The stage dialog is #stageDetail (edits 1, 8 and 9), so the main page's one lookup of an id that the OV pages
// also use is gone. The OV pages keep their own repeated ids (detail, legend, findings and others): their code reads
// them within its own page. Taking the hidden pages out of the document instead broke the print handlers and AV-2's
// links, which reach into every page.

// ---- 12. A fresh page isn't "unsaved": until the person first acts, the Builder takes what it loaded as saved. Later
// blocks add default details to links after the first fingerprint was taken.
let untouched=true;const touched=()=>{untouched=false};
if(document.readyState==='complete')setTimeout(touched,1500);else addEventListener('load',()=>setTimeout(touched,1500),{once:true});
addEventListener('pointerdown',touched,true);addEventListener('keydown',touched,true);
if(typeof loadTopologyDocument==='function'){const loadBefore231=loadTopologyDocument;loadTopologyDocument=function(...a){untouched=false;return loadBefore231.apply(this,a)}}
function settle(){if(!untouched)return;try{if(builderHistory?.past?.length||builderHistory?.future?.length){untouched=false;return}if(recoveryPending)return;
 if(savedFingerprint!==currentBuilderFingerprint()){savedFingerprint=currentBuilderFingerprint();recoveryMessage='';clearTimeout(draftTimer);updateBuilderSaveState()}}catch(e){}}
if(typeof renderBuilder==='function'){const renderBefore231=renderBuilder;renderBuilder=function(...a){const r=renderBefore231.apply(this,a);settle();return r}}

// ---- 19. The Builder on a first visit: when the topology would fit at under 70%, the Components panel starts folded so
// the canvas is wide enough to read; + Add opens it. A panel state the person has chosen is kept as before.
let firstBuilder=true;
function firstVisit(){if(!firstBuilder||viewOf()!=='builder')return;firstBuilder=false;let chosen=false;try{chosen=localStorage.getItem('splunkPipelineExplorer.dockedPanels.v1')!==null}catch(e){chosen=true}
 if(chosen||typeof canvasPanelState!=='object'||typeof toggleBuilderCanvasPalette!=='function')return;
 let tries=0;const check=()=>{if(viewOf()!=='builder')return;const v=state.builderViewport||{};if(!canvasPanelState.palette){if(++tries<8)setTimeout(check,200);return}
  // Docked (wide screens), the panels keep their own state, which only their Hide control changes: it is pressed.
  if(v.initialized&&v.zoom<.7){const hide=document.getElementById('builderPaletteDrawerClose');if(hide?.checkVisibility())hide.click();else toggleBuilderCanvasPalette();requestAnimationFrame(()=>{try{fitBuilderView()}catch(e){}});return}
  if(++tries<8)setTimeout(check,200)};setTimeout(check,120)}

// ---- 21. Changes: one group across the page, its items in columns; a search, a status filter and the newest first.
const reg={q:'',status:'all',newest:false};
function changesTools(){const m=document.getElementById('changesMode');if(!m||m.querySelector('.chg231'))return;const sum=m.querySelector('.changesSummary');if(!sum)return;
 const bar=document.createElement('div');bar.className='chg231';
 bar.innerHTML='<label class="chg231Find"><span>Find a change</span><input type="search" autocomplete="off" placeholder="Name or detail"></label><label><span>Status</span><select><option value="all">All</option><option value="done">Done</option><option value="proposed">Proposed</option></select></label><label class="chg231Order"><input type="checkbox"> Newest first</label><p class="chg231Count" aria-live="polite"></p>';
 sum.after(bar);const [find,status,order]=[bar.querySelector('input[type=search]'),bar.querySelector('select'),bar.querySelector('input[type=checkbox]')];
 find.value=reg.q;status.value=reg.status;order.checked=reg.newest;
 const apply=()=>{reg.q=find.value.trim().toLowerCase();reg.status=status.value;reg.newest=order.checked;let shown=0,all=0;
  for(const list of m.querySelectorAll('.changesList')){const want=reg.newest?'1':'';if((list.dataset.rev231||'')!==want){list.append(...[...list.children].reverse());list.dataset.rev231=want}let n=0;for(const it of list.querySelectorAll('.changeItem')){all++;const done=it.classList.contains('done'),hit=(!reg.q||it.textContent.toLowerCase().includes(reg.q))&&(reg.status==='all'||(reg.status==='done')===done);it.hidden=!hit;if(hit){n++;shown++}}
   const group=list.closest('section,article,div.changeGroup')||list.parentElement;group.hidden=!n}
  bar.querySelector('.chg231Count').textContent=reg.q||reg.status!=='all'?`${shown} of ${all} changes`:`${all} changes`};
 find.addEventListener('input',apply);status.addEventListener('change',apply);order.addEventListener('change',apply);apply()}
if(typeof renderChanges==='function'){const changesBefore231=renderChanges;renderChanges=function(...a){const r=changesBefore231.apply(this,a);changesTools();return r}}

// ---- 25. Generate: a Syslog Server's listening ports as SC4S settings, and a load balancer's listeners. An env_file
// takes no comment after a value, so each note has its own line; one variable per source and protocol, its ports
// comma-separated with no spaces, as SC4S's sources page shows (SC4S_LISTEN_CISCO_ASA_UDP_PORT=5005,6005).
if(typeof generatedConfiguration==='function'){const genBefore231=generatedConfiguration;generatedConfiguration=function(...a){let text=genBefore231.apply(this,a);const P=window.builderPorts230;if(!P)return text;const lines=[];
 const name=n=>typeof componentInstanceLabel==='function'?componentInstanceLabel(n):n.type;
 for(const n of state.builderNodes.filter(n=>n.type==='syslog')){const ports=P.ports(n),shared=ports.filter(p=>!p.senders),own=ports.filter(p=>p.senders);
  lines.push(`\n# SC4S env_file (/opt/sc4s/env_file) — ${name(n)}: its listening ports`);
  if(ports.some(p=>p.protocol==='tls'))lines.push('# TLS: turned on here; the server key and certificate go in /opt/sc4s/tls/server.key and server.pem','SC4S_SOURCE_TLS_ENABLE=yes');
  for(const pr of ['udp','tcp','tls']){const list=[...new Set(shared.filter(p=>p.protocol===pr).map(p=>p.port))];if(!list.length)continue;
   if(list.length>1)lines.push(`# ${list.length} ${pr.toUpperCase()} ports for every sender, in the comma-separated form SC4S documents for a source's ports`);
   lines.push(`SC4S_LISTEN_DEFAULT_${pr.toUpperCase()}_PORT=${list.join(',')}`)}
  const bySource=new Map();for(const p of own){const key=p.senders.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'')||'SOURCE',k=key+' '+p.protocol;
   const g=bySource.get(k)||bySource.set(k,{key,protocol:p.protocol,senders:p.senders,ports:[]}).get(k);if(!g.ports.includes(p.port))g.ports.push(p.port)}
  for(const g of bySource.values()){lines.push(`# ${String(g.senders).replace(/\s+/g,' ')}: match ${g.key} to the vendor and product in SC4S's sources list`);
   if(g.protocol==='tls')lines.push("# SC4S's sources page shows this form with UDP and TCP; check that your version takes TLS in it");
   lines.push(`SC4S_LISTEN_${g.key}_${g.protocol.toUpperCase()}_PORT=${g.ports.join(',')}`)}}
 for(const n of state.builderNodes.filter(n=>n.type==='loadBalancer')){const ls=P.lbPorts(n);if(!ls.length)continue;lines.push(`\n# Load balancer listeners — ${name(n)} (each forwards to the same port on its members)`);for(const p of ls)lines.push(`listener ${p.protocol.toUpperCase()} ${p.port}`)}
 return lines.length?text+'\n'+lines.join('\n'):text}}

// ---- 26. Compare: with nothing saved, say how to get something to compare.
if(typeof renderCompareOperations==='function'){const compareBefore231=renderCompareOperations;renderCompareOperations=function(...a){const r=compareBefore231.apply(this,a);
 try{if(topologyChoiceDocuments().length<2){const c=document.getElementById('operationsContent');const box=document.createElement('div');box.className='compareEmpty231';box.setAttribute('role','note');
  box.innerHTML='<strong>Nothing saved to compare with yet</strong><p>Save the topology in the Builder, change it, then come back: Compare shows the components and relationships added, removed or changed since the save.</p>';
  c.querySelector('.compareSelectors')?.after(box)}}catch(e){}return r}}

// ---- 13 and 27. The change register: the two "Builder review fixes" named apart, and wording as the rest of the page.
if(typeof changeRegister!=='undefined'){const all=changeRegister.flatMap(g=>g.items);
 const fix=(name,start,to)=>{const it=all.find(i=>i[0]===name&&i[1].startsWith(start));if(it)it[0]=to};
 fix('Builder review fixes','Restore the desktop toolbar','Builder review fixes: toolbar and header');
 fix('Builder review fixes','Keep relationship labels visible','Builder review fixes: labels, collapsed hosts and Splunk Cloud');
 for(const it of all){if(it[0]==='Syslog server and UF file handoff')it[0]='Syslog Server and UF file handoff';it[1]=it[1].replace(/\bserialization\b/g,'serialisation')}}

// ---- After every view switch: the shared section, the Builder's first visit, and the pages' own parts.
if(typeof switchView==='function'){const switchBefore231=switchView;switchView=function(...a){const r=switchBefore231.apply(this,a);ctxApply();firstVisit();soon();return r}}
ctxApply();settle();soon();
window.explorerReview231={ctxApply,settle,cue};
})();

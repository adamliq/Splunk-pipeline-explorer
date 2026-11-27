(function(){
'use strict';
// Build 238: colour and clarity, the 13 items of the review "Check colour scheme for each page. Check clarity".
// Each part names its item. The block sets no globals.
const warn=e=>console.warn('Build 238',e);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Runs f once in the next frame, however often it is asked for before then.
const later=f=>{let id=0;return()=>{if(!id)id=requestAnimationFrame(()=>{id=0;try{f()}catch(e){warn(e)}})}};

// ---- 5. The tiers. The same values as the tokens --tier-collect, --tier-process, --tier-store and --tier-none (item 8):
// the app's tables hold values, not variables, as its exports read them.
const TIER238={collect:'#338ced',process:'#e76624',store:'#00a888',none:'#90a2b5'};
const TIER_BY_TYPE238={};
for(const [tier,types] of Object.entries({
 collect:['ds','sqlDatabase','windowsEvent','fileSource','scriptSource','apiSource','apiCollector','awsLambda','azureFunction','hecEndpoint','syslogSource','hecClient','syslog','uf','authUser','authProviderCloud','authProviderOnPrem','streamServer','streamDefinition','licenseManager','monitoringConsole','serverClass','deploymentApp','loadBalancer'],
 process:['dbConnect','hf','ip','edgeProcessor'],
 store:['idx','s3','search','shcCluster','shcMember','shcDeployer','indexerCluster','indexerClusterManager','s3Dataset','s3FederatedConnection','s3DataCatalog','cloudSearchTier','cloudIndexer148','cloudEsSearchHead','azureDataset','azureConnection','soarCloud','soarOnPrem','soarPlaybook']}))
 for(const type of types)TIER_BY_TYPE238[type]=tier;
// A name the table doesn't list (a card, a band, a route box, or a type a later build adds) takes its tier from its words.
const PROCESS_RE238=/heavy forwarder|db connect|ingest processor|edge processor|processing|parsing|transform/i;
const STORE_RE238=/indexer|index\b|amazon s3|\bs3\b|sqs|catalog|search|federated|storage|bucket|splunk cloud|soar|destination/i;
function tierOfName238(name){const s=String(name||'').trim();if(!s||/^all\b/i.test(s))return 'none';
 if(PROCESS_RE238.test(s))return 'process';if(STORE_RE238.test(s))return 'store';return 'collect'}

// ---- 2. OV opens dark, as every other view does, unless the reader has chosen a theme (Build 136 keeps the choice in
// localStorage). Printing and Save as PDF draw it in its light theme, whichever is on screen.
try{if(!localStorage.getItem('splunkPipelineExplorer.ovTheme.v1'))builderOvTheme135='dark'}catch{builderOvTheme135='dark'}
try{if(state.view==='ov')builderOvRender135()}catch(e){warn(e)}
let printSwap238=false;
addEventListener('beforeprint',()=>{const r=builderOvRoot135;if(r&&r.classList.contains('theme-dark')){r.classList.replace('theme-dark','theme-light');printSwap238=true}});
addEventListener('afterprint',()=>{const r=builderOvRoot135;if(printSwap238&&r)r.classList.replace('theme-light','theme-dark');printSwap238=false});

// ---- 7. OV's status words, one scale on every view: "Not set" neutral, "Not deployed" a warning, "Deployed" and "In place"
// good, each with its sign (the styles). The views draw them with a dozen different classes, so they are found by their
// text, in elements that hold nothing else, after each render and show and as a view redraws part of itself. A word a view
// flags as a stop (SvcV-2's security attribute with no value) stays critical. Words inside diagrams are left as drawn.
const OV_STATUS238=[[/^not set$/i,'none'],[/^not deployed$/i,'warn'],[/^(deployed|in place)$/i,'good']];
function markOvStatus238(){const root=builderOvRoot135;if(!root||!root.isConnected)return;
 for(const e of root.querySelectorAll('span,small,td,b,strong,em,dd')){
  if(e.firstElementChild||e.closest('svg,select,button,option,th,thead'))continue;
  const t=e.textContent.trim();let st='';
  if(t&&t.length<=14){const hit=OV_STATUS238.find(([re])=>re.test(t));if(hit)st=e.closest('.stopText')?'crit':hit[1]}
  if(st){if(e.dataset.st238!==st)e.dataset.st238=st}else if(e.dataset.st238)delete e.dataset.st238}}
const ovMarkSoon238=later(markOvStatus238);
// ---- 10. On a phone OV hides the page's header, and with it the Glossary button: the glossary goes in OV's Actions menu.
function ovGlossary238(){const menu=builderOvRoot135?.querySelector('.ovMobileActions145 > div');if(!menu||menu.querySelector('.ovGloss238'))return;
 const b=document.createElement('button');b.type='button';b.className='ovGloss238';b.textContent='Glossary';
 b.addEventListener('click',()=>{menu.closest('details')?.removeAttribute('open');openGlossary238()});menu.append(b)}
try{const ovRenderBefore238=builderOvRender135;builderOvRender135=function(...a){const r=ovRenderBefore238.apply(this,a);try{markOvStatus238();ovGlossary238()}catch(e){warn(e)}return r};
 const ovShowBefore238=builderOvShow135;builderOvShow135=function(...a){const r=ovShowBefore238.apply(this,a);try{markOvStatus238();ovGlossary238()}catch(e){warn(e)}return r};
 new MutationObserver(ovMarkSoon238).observe(builderOvRoot135,{childList:true,subtree:true,characterData:true});markOvStatus238()}catch(e){warn(e)}

// ---- 4 and 5. A component's colour shows its tier, the same wherever it is coloured: the cards, the Builder (its canvas
// cards, palette and add-next menu, all drawn from builderComponents), the Failure Lab's bands and the route boxes. The
// tables are changed in place, once, as the block loads; each component is still named wherever it is coloured.
const isHex238=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
function tierOfType238(type){const m=builderComponents[type];return TIER_BY_TYPE238[type]||tierOfName238(m?`${m.name||''} ${m.type||''}`:type)}
// A route box is [name, note, colour]; a route model holds them as source, processor and a list of destinations.
function recolourRoute238(box){if(Array.isArray(box)&&isHex238(box[2]))box[2]=TIER238[tierOfName238(box[0])]}
function applyTiers238(){
 for(const [type,m] of Object.entries(builderComponents))if(m&&typeof m==='object'&&isHex238(m.color))m.color=TIER238[tierOfType238(type)];
 for(const name of Object.keys(failureComponentColors))if(name!=='Time service')failureComponentColors[name]=TIER238[tierOfName238(name)];
 for(const model of Object.values(routeModels)){if(!model||typeof model!=='object')continue;
  for(const v of Object.values(model)){if(Array.isArray(v)&&isHex238(v[2]))recolourRoute238(v);else if(Array.isArray(v))v.forEach(recolourRoute238)}}
 for(const m of Object.values(parallelAccuracyModels))if(m&&isHex238(m.color))m.color=TIER238[tierOfName238(m.name)]}
// The page's own markup: the component cards (by their name and label), the Builder's palette, and canvas cards already drawn.
function paintTiers238(){
 document.querySelectorAll('.component[data-component]').forEach(card=>{const tier=card.dataset.component==='all'?'none':
  tierOfName238(`${card.querySelector('strong')?.textContent||''} ${card.querySelector('small')?.textContent||''}`);
  card.dataset.tier238=tier;card.style.setProperty('--component',TIER238[tier])});
 document.querySelectorAll('.builderPaletteItem[data-builder-add]').forEach(item=>{const type=item.dataset.builderAdd;
  if(builderComponents[type])item.style.setProperty('--item',TIER238[tierOfType238(type)])})}

// ---- 6. Flow's stage cards: the top line and number take the tier of the component chosen above, or the neutral with All
// components (the styles read --stage238); the pipeline tag is neutral words.
function stageTier238(){const k=state.component||'all',card=document.querySelector(`.component[data-component="${CSS.escape(k)}"]`);
 const tier=k==='all'?'none':card?.dataset.tier238||'none';document.documentElement.style.setProperty('--stage238',`var(--tier-${tier})`)}
try{applyTiers238();paintTiers238();stageTier238();
 if(typeof renderRouteDiagram==='function')renderRouteDiagram();
 const renderBefore238=render;render=function(...a){const r=renderBefore238.apply(this,a);try{stageTier238()}catch(e){warn(e)}return r};
 render();
 if(typeof renderFailures==='function'&&document.querySelector('.failureComponentGroup'))renderFailures();
 if(typeof renderBuilder==='function'&&document.querySelector('.builderNode[data-builder-node]'))renderBuilder()}catch(e){warn(e)}

// ---- 9. Operate's pages are headed with their menu entry's name. The subject being modelled is the line under it, and the
// small label above names the entry's group: "Fleet / Capacity model / Indexer durability boundary". Done straight after
// each render of a page, before it is drawn (a page like Runbook heads itself with the failure chosen, and redraws), and
// without moving what the reader is looking at when the heading block is above it. Scenario library and Alert and dashboard
// pack carry their heading, and the second sentence that item 13 moves under it, in their own templates (the edits): on a
// phone, choosing a pack scrolls to it smoothly, to a place worked out before a change made after the render.
function opsHeadings238(){
 const root=document.getElementById('operationsContent'),btn=document.querySelector('.operationsNav button.active');if(!root||!btn)return;
 const hero=root.querySelector('.opsHero'),h=hero?.querySelector('h2');if(!h)return;
 const name=btn.textContent.trim(),group=btn.closest('[role="group"]')?.querySelector('p')?.textContent.trim()||'';
 const next=hero.nextElementSibling,above=state.view==='operations'&&hero.getBoundingClientRect().bottom<=0,top0=above&&next?next.getBoundingClientRect().top:0;
 let subject=h.textContent.trim();
 if(subject!==name){h.dataset.subject238=subject;h.textContent=name}else subject=h.dataset.subject238||name;
 let line=hero.querySelector('.opsSubject238');
 if(subject!==name){if(!line){line=document.createElement('p');line.className='opsSubject238';h.after(line)}if(line.textContent!==subject)line.textContent=subject}else line?.remove();
 const small=h.previousElementSibling;
 if(small&&small.tagName==='SMALL'&&group&&small.textContent!==group){if(!small.dataset.label238)small.dataset.label238=small.textContent;small.textContent=group}
 if(above&&next){const moved=next.getBoundingClientRect().top-top0;if(Math.abs(moved)>=1)scrollBy({top:moved,behavior:'instant'})}}
const runOps238=()=>{try{opsHeadings238()}catch(e){warn(e)}};
try{const content=document.getElementById('operationsContent');if(content)new MutationObserver(runOps238).observe(content,{childList:true,subtree:true,characterData:true});
 const nav=document.querySelector('.operationsNav');if(nav)new MutationObserver(runOps238).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
 runOps238()}catch(e){warn(e)}

// ---- 11. Each view has a heading of its own: Flow, Matrix, Config, Diagnose and the Failure Lab start with an h2 naming the
// view, hidden from sight as the open tab shows it, and the heading of what is selected in them is announced at level 3.
const VIEW_NAMES238={flow:'Flow',matrix:'Matrix',config:'Config',diagnostic:'Diagnose',failure:'Failure Lab'};
function viewHeadings238(){
 let h=document.getElementById('viewName238');const bar=document.querySelector('.toolbar');
 if(!h&&bar){h=document.createElement('h2');h.id='viewName238';h.className='vh238';bar.after(h)}
 if(h){const name=VIEW_NAMES238[state.view]||'';if(h.hidden!==!name)h.hidden=!name;if(h.textContent!==name)h.textContent=name}
 document.querySelectorAll('#contextTitle,.diagnosticHero h2,.failureHero h2').forEach(e=>{if(e.getAttribute('aria-level')!=='3')e.setAttribute('aria-level','3')})}
const runViews238=()=>{try{viewHeadings238()}catch(e){warn(e)}};
try{const switchBefore238=switchView;switchView=function(...a){const r=switchBefore238.apply(this,a);runViews238();runOps238();return r};
 for(const id of ['diagnosticResults','failureDetail']){const el=document.getElementById(id);if(el)new MutationObserver(runViews238).observe(el,{childList:true,subtree:true})}
 runViews238()}catch(e){warn(e)}

// ---- 10. A glossary. The header's Glossary button opens a dialog of the abbreviations the Explorer uses, in five groups, each
// with what it stands for and, where it helps, a line on what it is. On the view or page shown, the first use of each is
// marked with <abbr title>, and a click on one outside a control opens the glossary at it. Text in diagrams, code, form
// fields, controls, status messages and the Config type map is left alone, and so is the Builder's canvas. A term straight
// after a number is the unit of a figure (3,000 EPS), and is not marked; units such as MB are not in the list.
const GLOSSARY238=[
 ['Splunk',[
  ['UF','Universal Forwarder','Splunk’s light agent: it reads data on a host and forwards it.'],
  ['HF','Heavy Forwarder','A full Splunk instance that parses, filters or routes data before the indexers.'],
  ['HEC','HTTP Event Collector','Splunk’s HTTPS endpoint for events sent with a token.'],
  ['DS','Deployment Server','Sends apps and settings to forwarders, by server class.'],
  ['S2S','Splunk-to-Splunk','The protocol forwarders use to send to indexers, usually on port 9997.'],
  ['SPL','Search Processing Language','Splunk’s search language.'],
  ['SPL2','Search Processing Language 2','The version Ingest Processor and Edge Processor pipelines are written in.'],
  ['CIM','Common Information Model','Splunk’s shared field names and data models, so one search works across sources.'],
  ['ES','Enterprise Security','Splunk’s security information and event management app.'],
  ['SOAR','Security Orchestration, Automation and Response','Splunk SOAR runs playbooks on alerts.'],
  ['SC4S','Splunk Connect for Syslog','A syslog server in a container that sends to HEC.'],
  ['TSIDX','Time-series index','The index files in each bucket that make searches fast.'],
  ['SH','Search head','The Splunk instance people search from.'],
  ['RF','Replication factor','How many copies of each bucket an indexer cluster keeps.'],
  ['ACK','Acknowledgement','HEC’s indexer acknowledgement: word that the events were indexed.'],
  ['DB','Database','As in Splunk DB Connect, which reads rows from relational databases.']]],
 ['Security and identity',[
  ['TLS','Transport Layer Security','Encrypts a connection and proves the server’s identity.'],
  ['PII','Personally identifiable information',''],
  ['SAML','Security Assertion Markup Language','A standard for single sign-on through an identity provider.'],
  ['MFA','Multi-factor authentication',''],
  ['IdP','Identity provider','The service that signs people in and vouches for them to Splunk.'],
  ['RBAC','Role-based access control','In Splunk, what each role may search and do.'],
  ['LDAP','Lightweight Directory Access Protocol','How Splunk reads users and groups from a directory.'],
  ['IAM','Identity and access management',''],
  ['STRIDE','Spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege','A way to list the threats to a system, one kind at a time.'],
  ['UEBA','User and entity behaviour analytics',''],
  ['ISM','Information Security Manual','The Australian Government’s security controls, published by the ASD.'],
  ['ASD','Australian Signals Directorate','']]],
 ['Operations',[
  ['EPS','Events per second',''],
  ['SLO','Service level objective','A target for a service, such as how fresh its data must be.'],
  ['RPO','Recovery point objective','How much data, as time, may be lost in a failure.'],
  ['RTO','Recovery time objective','How long a recovery may take.'],
  ['DR','Disaster recovery',''],
  ['RASCI','Responsible, accountable, supporting, consulted, informed','The roles in a responsibility matrix.'],
  ['CPU','Central processing unit',''],
  ['OS','Operating system',''],
  ['UI','User interface',''],
  ['DNS','Domain Name System','Turns host names into addresses.']]],
 ['Data and protocols',[
  ['TCP','Transmission Control Protocol','Delivers data in order and resends what is lost.'],
  ['UDP','User Datagram Protocol','Sends data without delivery checks; common for syslog.'],
  ['HTTP','Hypertext Transfer Protocol',''],
  ['HTTPS','HTTP over TLS',''],
  ['REST','Representational state transfer','The style of web API Splunk’s management port serves.'],
  ['API','Application programming interface',''],
  ['JSON','JavaScript Object Notation','A text format for structured data.'],
  ['CSV','Comma-separated values',''],
  ['XML','Extensible Markup Language',''],
  ['SQL','Structured Query Language',''],
  ['JDBC','Java Database Connectivity','How DB Connect talks to a database.'],
  ['AWS','Amazon Web Services',''],
  ['S3','Amazon Simple Storage Service','Object storage, in buckets.'],
  ['SQS','Amazon Simple Queue Service','A message queue; Splunk’s add-on for AWS reads S3 notifications from it.'],
  ['RFC','Request for Comments','An IETF standard, such as RFC 5424 for syslog.'],
  ['IETF','Internet Engineering Task Force',''],
  ['BSD','Berkeley Software Distribution','BSD syslog is the older syslog format, RFC 3164.'],
  ['HTML','HyperText Markup Language',''],
  ['DOM','Document Object Model',''],
  ['PNG','Portable Network Graphics','An image file format.'],
  ['SVG','Scalable Vector Graphics','A drawing file format that scales without blurring.']]],
 ['Architecture views',[
  ['DoDAF','Department of Defense Architecture Framework','The US framework OV’s views follow.'],
  ['AV','All viewpoint','The scope, and the dictionary of terms.'],
  ['OV','Operational viewpoint','What people and organisations do, and what they exchange.'],
  ['CV','Capability viewpoint',''],
  ['DIV','Data and information viewpoint',''],
  ['SV','Systems viewpoint',''],
  ['SvcV','Services viewpoint',''],
  ['StdV','Standards viewpoint',''],
  ['DFD','Data flow diagram',''],
  ['AV-1','Overview and summary information',''],
  ['AV-2','Integrated dictionary',''],
  ['OV-1','High-level operational concept',''],
  ['OV-2','Operational resource flow description',''],
  ['OV-3','Operational resource flow matrix',''],
  ['OV-5a','Operational activity decomposition tree',''],
  ['OV-6c','Event-trace description',''],
  ['DIV-1','Conceptual data model',''],
  ['TM-1','Threat model','Not a DoDAF view: the Explorer’s threats at each boundary crossing.'],
  ['CV-1','Vision',''],
  ['CV-2','Capability taxonomy',''],
  ['CV-6','Capability to operational activities mapping',''],
  ['CV-7','Capability to services mapping',''],
  ['SvcV-1','Services context description',''],
  ['SvcV-2','Services resource flow description',''],
  ['SvcV-3a','Systems–services matrix',''],
  ['SvcV-3b','Services–services matrix',''],
  ['SvcV-4','Services functionality description',''],
  ['SvcV-5','Operational activity to services traceability matrix',''],
  ['SvcV-6','Services resource flow matrix',''],
  ['SV-1','Systems interface description',''],
  ['SV-2','Systems resource flow description',''],
  ['SV-3','Systems–systems matrix',''],
  ['SV-5b','Operational activity to systems traceability matrix',''],
  ['SV-6','Systems resource flow matrix',''],
  ['SV-10a','Systems rules model',''],
  ['SV-10c','Systems event-trace description',''],
  ['StdV-1','Standards profile','']]]];
const TERMS238=new Map(GLOSSARY238.flatMap(([,rows])=>rows.map(r=>[r[0],r])));
// Case-sensitive, whole words: not part of a longer word or ID (OV inside OV-2, TCP inside _TCP_ROUTING), longest first,
// and not straight after a number, where it is the unit of a figure (3,000 EPS).
const TERM_RE238=new RegExp('(?<![\\w-])(?<!\\d\\s?)('+[...TERMS238.keys()].sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\w-])','g');

// The dialog.
const gloss238=document.createElement('dialog');gloss238.className='gloss238';gloss238.setAttribute('aria-labelledby','gloss238Title');
gloss238.innerHTML=`<div class="gloss238Head"><h2 id="gloss238Title">Glossary</h2><label class="gloss238Find"><span>Find</span><input id="gloss238Find" type="text" autocomplete="off" spellcheck="false"></label><button type="button" class="gloss238Close">Close</button></div>
<div class="gloss238Body">${GLOSSARY238.map(([group,rows],i)=>`<section aria-labelledby="gloss238G${i}"><h3 id="gloss238G${i}">${esc(group)}</h3><dl>${rows.map(([t,full,note])=>`<div class="gloss238Row" data-term="${esc(t)}"><dt>${esc(t)}</dt><dd>${esc(full)}${note?`<small>${esc(note)}</small>`:''}</dd></div>`).join('')}</dl></section>`).join('')}<p class="gloss238None" hidden>No abbreviation matches.</p></div>`;
document.body.append(gloss238);
const find238=gloss238.querySelector('#gloss238Find');
function filterGlossary238(){const q=find238.value.trim().toLowerCase();let any=false;
 gloss238.querySelectorAll('section').forEach(sec=>{let shown=0;sec.querySelectorAll('.gloss238Row').forEach(row=>{const hit=!q||row.textContent.toLowerCase().includes(q);row.hidden=!hit;if(hit)shown++});sec.hidden=!shown;if(shown)any=true});
 gloss238.querySelector('.gloss238None').hidden=any}
function openGlossary238(term){if(find238.value){find238.value='';filterGlossary238()}
 gloss238.querySelectorAll('.gloss238Row.on238').forEach(r=>r.classList.remove('on238'));
 if(!gloss238.open)gloss238.showModal();
 const row=term&&[...gloss238.querySelectorAll('.gloss238Row')].find(r=>r.dataset.term===term);
 if(row){row.classList.add('on238');row.scrollIntoView({block:'center',behavior:'instant'})}else gloss238.querySelector('.gloss238Body').scrollTop=0}
find238.addEventListener('input',filterGlossary238);
gloss238.querySelector('.gloss238Close').addEventListener('click',()=>gloss238.close());
// Escape closes it from anywhere in it, the Find field included; so does a click on the backdrop.
gloss238.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();gloss238.close()}});
gloss238.addEventListener('click',e=>{if(e.target!==gloss238)return;const r=gloss238.getBoundingClientRect();
 if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)gloss238.close()});
// The button, in the header itself, so it stays on phones, where the header's figures are hidden.
const glossBtn238=document.createElement('button');glossBtn238.type='button';glossBtn238.className='glossBtn238';glossBtn238.textContent='Glossary';
glossBtn238.setAttribute('aria-haspopup','dialog');glossBtn238.addEventListener('click',()=>openGlossary238());
(document.querySelector('.shell>header')||document.querySelector('header'))?.append(glossBtn238);

// The marks.
const SKIP238='svg,code,pre,kbd,samp,script,style,textarea,input,select,option,button,a,label,summary,abbr,dialog,output,header,nav,.toolbar,.vh237,.vh238,[contenteditable],'+
 '[role="button"],[role="tab"],[role="option"],[role="menuitem"],[role="navigation"],[role="status"],[role="alert"],p[aria-live],span[aria-live],small[aria-live],#configTypeMap217';
function scopeOf238(){const v=state.view;
 if(v==='operations')return document.getElementById('operationsContent');
 if(v==='ov')return builderOvRoot135?.querySelector('[data-ov-panel]:not([hidden])')||null;
 if(v==='builder')return null;
 return document.querySelector('main.shell')}
// The whole view or page is read when it is shown; after that, only what is drawn again (a full read of Flow takes about
// 30 ms, and some pages redraw parts of themselves often).
function markTerms238(roots){const scope=scopeOf238();if(!scope)return;
 const done=new Set([...scope.querySelectorAll('abbr.gl238')].map(a=>a.dataset.term));if(done.size===TERMS238.size)return;
 const starts=roots?roots.filter(r=>r&&r.isConnected&&scope.contains(r)):[scope];
 const nodes=[],seen=new Map();
 for(const start of starts){const walk=document.createTreeWalker(start,NodeFilter.SHOW_TEXT);let n;
  while((n=walk.nextNode())){const t=n.nodeValue;if(t.length<2||!/[A-Z]/.test(t))continue;const e=n.parentElement;if(!e)continue;
   // Not in a flex or grid box: there a mark would be an item of its own, and split the line it is in.
   let ok=seen.get(e);if(ok===undefined){ok=!e.closest(SKIP238)&&e.checkVisibility()&&!/flex|grid/.test(getComputedStyle(e).display);seen.set(e,ok)}if(ok)nodes.push(n)}}
 for(const node of nodes){if(!node.isConnected)continue;const text=node.nodeValue;TERM_RE238.lastIndex=0;let m,last=0,frag=null;
  while((m=TERM_RE238.exec(text))){const term=m[1];if(done.has(term))continue;done.add(term);frag=frag||document.createDocumentFragment();
   frag.append(text.slice(last,m.index));const a=document.createElement('abbr');a.className='gl238';a.dataset.term=term;a.title=TERMS238.get(term)[1];a.textContent=term;frag.append(a);last=m.index+term.length}
  if(frag){frag.append(text.slice(last));node.replaceWith(frag)}
  if(done.size===TERMS238.size)break}}
let markAll238=true;const markRoots238=new Set();
const markSoon238=later(()=>{const all=markAll238,roots=[...markRoots238];markAll238=false;markRoots238.clear();markTerms238(all?null:roots)});
const markWhole238=()=>{markAll238=true;markSoon238()};
const changed238=records=>{for(const r of records){if(r.type==='attributes'){markAll238=true;continue}
  if(r.type==='characterData'){if(r.target.parentElement)markRoots238.add(r.target.parentElement);continue}
  for(const n of r.addedNodes){const e=n.nodeType===1?n:n.parentElement;if(e&&!e.matches('abbr.gl238'))markRoots238.add(e)}}
 if(markAll238||markRoots238.size)markSoon238()};
document.addEventListener('click',e=>{const a=e.target.closest?.('abbr.gl238');
 if(!a||a.closest('button,a,label,summary,[role="button"],[role="tab"],[tabindex]:not([tabindex="-1"])'))return;openGlossary238(a.dataset.term)});
try{const shell=document.querySelector('main.shell');if(shell)new MutationObserver(changed238).observe(shell,{childList:true,subtree:true,characterData:true});
 if(builderOvRoot135&&!shell?.contains(builderOvRoot135))new MutationObserver(changed238).observe(builderOvRoot135,{childList:true,subtree:true,characterData:true});
 // OV shows a view by unhiding its panel: read that panel whole.
 if(builderOvRoot135)new MutationObserver(changed238).observe(builderOvRoot135,{subtree:true,attributes:true,attributeFilter:['hidden']});
 const switchBefore238b=switchView;switchView=function(...a){const r=switchBefore238b.apply(this,a);markWhole238();return r};
 markWhole238()}catch(e){warn(e)}
})();

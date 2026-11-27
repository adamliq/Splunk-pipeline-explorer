(function(){
'use strict';
// Build 237: the fixes and improvements from the review of every UI element. Each part names its item in the review list.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const warn=e=>console.warn('Build 237',e);
const narrow=matchMedia('(max-width:820px)');
// Scroll a strip, not the page, so that an entry sits in the middle of the part of the strip on screen: across for a
// row, down for a column (a column that starts part-way down the page has less of itself on screen).
function centerIn237(strip,el){if(!strip||!el||!el.checkVisibility())return;const s=strip.getBoundingClientRect(),r=el.getBoundingClientRect();
 const mid=(a,b,lo,hi)=>(Math.max(a,lo)+Math.min(b,hi))/2;
 if(strip.scrollWidth>strip.clientWidth+1)strip.scrollLeft+=r.left+r.width/2-mid(s.left,s.left+strip.clientWidth,0,innerWidth);
 if(strip.scrollHeight>strip.clientHeight+1)strip.scrollTop+=r.top+r.height/2-mid(s.top,s.top+strip.clientHeight,0,innerHeight)}

// ---- 3, 4 and 16. OV: the header names the open view and its viewpoint; the 28 views are grouped by viewpoint, with
// the open view's group shown and its tab kept in sight; on a phone, one list with a group per viewpoint.
// Each view's name and viewpoint, as AV-1's register (Build 189) and each view's own title block give them.
const VIEWS237=Object.fromEntries(Object.entries({av1:['AV-1','Overview and Summary Information','All'],av2:['AV-2','Integrated Dictionary','All'],
 ov1:['OV-1','High-Level Operational Concept Graphic','Operational'],ov2:['OV-2','Operational Resource Flow Description','Operational'],ov3:['OV-3','Operational Resource Flow Matrix','Operational'],
 ov5a:['OV-5a','Operational Activity Decomposition Tree','Operational'],ov6c:['OV-6c','Operational Event-Trace Description','Operational'],div1:['DIV-1','Conceptual Data Model','Data and Information'],
 tm1:['TM-1','Threat Model','Security (not DoDAF)'],cv1:['CV-1','Vision','Capability'],cv2:['CV-2','Capability Taxonomy','Capability'],cv6:['CV-6','Capability to Operational Activities Mapping','Capability'],
 cv7:['CV-7','Capability to Services Mapping','Capability'],svcv1:['SvcV-1','Services Context Description','Services'],svcv2:['SvcV-2','Services Resource Flow Description','Services'],
 svcv3a:['SvcV-3a','Systems-Services Matrix','Services'],svcv3b:['SvcV-3b','Services-Services Matrix','Services'],svcv4:['SvcV-4','Services Functionality Description','Services'],
 svcv5:['SvcV-5','Operational Activity to Services Traceability Matrix','Services'],svcv6:['SvcV-6','Services Resource Flow Matrix','Services'],sv1:['SV-1','Systems Interface Description','Systems'],
 sv2:['SV-2','Systems Resource Flow Description','Systems'],sv3:['SV-3','Systems-Systems Matrix','Systems'],sv5b:['SV-5b','Operational Activity to Systems Traceability Matrix','Systems'],
 sv6:['SV-6','Systems Resource Flow Matrix','Systems'],sv10a:['SV-10a','Systems Rules Model','Systems'],sv10c:['SV-10c','Systems Event-Trace Description','Systems'],stdv1:['StdV-1','Standards Profile','Standards']
}).map(([k,[id,name,viewpoint]])=>[k,{id,name,viewpoint}]));
const GROUPS237=[['all','All',['av1','av2']],['operational','Operational',['ov1','ov2','ov3','ov5a','ov6c']],['data','Data',['div1']],['security','Security',['tm1']],
 ['capability','Capability',['cv1','cv2','cv6','cv7']],['services','Services',['svcv1','svcv2','svcv3a','svcv3b','svcv4','svcv5','svcv6']],['systems','Systems',['sv1','sv2','sv3','sv5b','sv6','sv10a','sv10c']],['standards','Standards',['stdv1']]];
const lastInGroup237={};
function ovGroups237(tabs){const keys=[...tabs.querySelectorAll('[data-ov-tab]')].map(t=>t.dataset.ovTab);
 const groups=GROUPS237.map(([id,label,ks])=>[id,label,ks.filter(k=>keys.includes(k))]).filter(g=>g[2].length);
 const other=keys.filter(k=>!groups.some(g=>g[2].includes(k)));if(other.length)groups.push(['other','Other',other]);return groups}
function buildOvNav237(){const root=builderOvRoot135,tabs=root?.querySelector('.ovTabs135');if(!tabs||tabs.parentElement.classList.contains('ovNav237'))return;
 const groups=ovGroups237(tabs),name=k=>tabs.querySelector(`[data-ov-tab="${k}"]`).textContent.trim();
 const nav=document.createElement('div');nav.className='ovNav237';nav._groups237=groups;
 nav.innerHTML='<div class="ovGroups237" role="group" aria-label="Viewpoints">'+groups.map(([id,label,ks])=>`<button type="button" data-ov-group="${id}" aria-pressed="false">${esc(label)}<small aria-hidden="true">${ks.length}</small></button>`).join('')+'</div>'
  +'<label class="ovPick237"><span>View</span><select>'+groups.map(([,label,ks])=>`<optgroup label="${esc(label)}">${ks.map(k=>`<option value="${k}">${esc(name(k))}</option>`).join('')}</optgroup>`).join('')+'</select></label>';
 tabs.before(nav);nav.append(tabs);
 nav.querySelector('.ovGroups237').addEventListener('click',e=>{const b=e.target.closest('[data-ov-group]'),g=b&&groups.find(x=>x[0]===b.dataset.ovGroup);if(!g)return;
  const key=g[2].includes(builderOvActive135)?builderOvActive135:g[2].includes(lastInGroup237[g[0]])?lastInGroup237[g[0]]:g[2][0];tabs.querySelector(`[data-ov-tab="${key}"]`)?.click()});
 nav.querySelector('select').addEventListener('change',e=>tabs.querySelector(`[data-ov-tab="${e.target.value}"]`)?.click())}
function syncOv237(){const root=builderOvRoot135;if(!root)return;const key=builderOvActive135,v=VIEWS237[key],line=root.querySelector('.ovHead135 p'),tab=root.querySelector(`.ovTabs135 [data-ov-tab="${key}"]`);
 if(line)line.textContent=v?`${v.id} · ${v.name} · ${/^Security/.test(v.viewpoint)?'Security viewpoint, not DoDAF':v.viewpoint+' viewpoint'}`:(tab?tab.textContent.trim():'');
 const nav=root.querySelector('.ovNav237');if(!nav)return;const groups=nav._groups237,g=groups.find(x=>x[2].includes(key))||groups[0];lastInGroup237[g[0]]=key;
 nav.querySelectorAll('[data-ov-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ovGroup===g[0])));
 nav.querySelectorAll('.ovTabs135 [data-ov-tab]').forEach(t=>t.classList.toggle('ovOther237',!g[2].includes(t.dataset.ovTab)));
 const sel=nav.querySelector('select');if(sel.value!==key)sel.value=key;
 if(tab)centerIn237(nav.querySelector('.ovTabs135'),tab)}
const ovShowBefore237=builderOvShow135;builderOvShow135=function(...a){const r=ovShowBefore237.apply(this,a);try{syncOv237();fitOvDiagrams237()}catch(e){warn(e)}return r};
// 13. OV-1's thread markers: the hit circle comes last in a marker, as the blocks that place a marker move its first circle and its
// text (v144, v167, v168, all wrapping builderOvDiagram137); once they have, it is put on the marker's circle.
if(typeof builderOvDiagram137==='function'){const ovDiagramBefore237=builderOvDiagram137;builderOvDiagram137=function(...a){const out=ovDiagramBefore237.apply(this,a);
 try{return typeof out==='string'&&out.includes('hit237')?out.replace(/(<g class="ovThreadMarker137"[^>]*>)([\s\S]*?)(<\/g>)/g,(all,open,body,close)=>{
  const c=body.match(/<circle(?![^>]*\bhit237\b)[^>]*?\scx="([^"]*)"[^>]*?\scy="([^"]*)"/);if(!c)return all;
  return open+body.replace(/(<circle class="hit237"[^>]*?\scx=")[^"]*("[^>]*?\scy=")[^"]*"/,`$1${c[1]}$2${c[2]}"`)+close}):out}catch(e){warn(e);return out}}}
const ovRenderBefore237=builderOvRender135;builderOvRender135=function(...a){const r=ovRenderBefore237.apply(this,a);try{if(state.view==='ov'){buildOvNav237();syncOv237();fitOvDiagrams237()}}catch(e){warn(e)}return r};

// ---- 4 and 17. Operate: the 23 pages in five headed groups; on a desktop the list stays in view beside the page and
// keeps the open page's entry in sight; on a phone, one list with the same groups in place of the long row.
const OPS_GROUPS237=[['Fleet',['health','multi-ds','capacity','performance']],['Simulate',['recovery','data-quality','scenario-library','parsing-lab']],
 ['Trace',['detection-lineage','custody','walkthrough','login-walkthrough']],['Boundaries',['security','authentication','responsibility','combined-boundaries','disaster-recovery']],
 ['Outputs',['runbook','generate','alert-pack','compare','evidence','report']]];
function groupOps237(){const nav=document.querySelector('.operationsNav');if(!nav||nav.dataset.grouped237)return;
 const buttons=[...nav.querySelectorAll('button[data-operations-view]')],byKey=new Map(buttons.map(b=>[b.dataset.operationsView,b])),used=new Set();
 const groups=OPS_GROUPS237.map(([label,keys])=>[label,keys.filter(k=>byKey.has(k))]).filter(g=>g[1].length);groups.forEach(g=>g[1].forEach(k=>used.add(k)));
 const rest=buttons.map(b=>b.dataset.operationsView).filter(k=>!used.has(k));if(rest.length)groups.push(['More',rest]);
 groups.forEach(([label,keys],i)=>{const box=document.createElement('div');box.className='opsGroup237';box.setAttribute('role','group');box.setAttribute('aria-labelledby','opsGroup237-'+i);
  box.innerHTML=`<p id="opsGroup237-${i}">${esc(label)}</p>`;box.append(...keys.map(k=>byKey.get(k)));nav.append(box)});
 nav.dataset.grouped237='1';nav.setAttribute('role','navigation');
 const pick=document.createElement('label');pick.className='opsPick237';
 pick.innerHTML='<span>Page</span><select>'+groups.map(([label,keys])=>`<optgroup label="${esc(label)}">${keys.map(k=>`<option value="${k}">${esc(byKey.get(k).textContent.trim())}</option>`).join('')}</optgroup>`).join('')+'</select>';
 nav.before(pick);const sel=pick.querySelector('select');sel.addEventListener('change',()=>byKey.get(sel.value)?.click());
 new MutationObserver(syncOps237).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});syncOps237()}
function syncOps237(){const nav=document.querySelector('.operationsNav'),active=nav?.querySelector('button.active'),sel=document.querySelector('.opsPick237 select');if(!active)return;
 if(sel&&sel.value!==active.dataset.operationsView)sel.value=active.dataset.operationsView;
 if(nav._shown237!==active||nav._view237!==state.view){nav._shown237=active;nav._view237=state.view;if(state.view==='operations')requestAnimationFrame(()=>{fitOpsNav237();centerIn237(nav,active)})}}
// The list's top sits under the sticky toolbar once the page scrolls; until then it starts lower down, so its height is
// what is on screen below its top, growing as the page scrolls, and the open page's entry can always be put in sight.
function opsTop237(){const t=document.querySelector('.toolbar');if(t)document.documentElement.style.setProperty('--opsTop237',Math.round(t.getBoundingClientRect().height+22)+'px')}
function fitOpsNav237(){const nav=document.querySelector('.operationsNav');if(!nav)return;if(state.view!=='operations'||narrow.matches){nav.style.removeProperty('max-height');return}
 const stick=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--opsTop237'))||96;nav.style.maxHeight=Math.max(240,Math.round(innerHeight-Math.max(nav.getBoundingClientRect().top,stick)-12))+'px'}
let opsFitQueued237=false;const opsFitSoon237=()=>{if(opsFitQueued237||state.view!=='operations')return;opsFitQueued237=true;requestAnimationFrame(()=>{opsFitQueued237=false;fitOpsNav237()})};
try{groupOps237();opsTop237();addEventListener('resize',()=>{opsTop237();opsFitSoon237()});addEventListener('scroll',opsFitSoon237,{passive:true})}catch(e){warn(e)}

// ---- 10. OV diagrams: every label at 11 px or more on screen. The print cap (125 mm tall) no longer shrinks them on
// screen (styles). Each diagram keeps at least the width it has at 1440 px and scrolls sideways below that. Labels
// under 11 px grow to 11 px unless that would take them out of a box they sit in, or nearer its edge than they were (up to
// 4 px), or onto another label; those grow as
// far as they fit, and if any label is still under 11 px the whole diagram is drawn larger, to scroll sideways. Sizes
// are CSS variables read only by screen rules, so print and the architecture pack keep the diagrams' own sizes.
const DESK237={ov1:1240,ov2:1200,ov6c:668,div1:926,tm1:1240,cv1:1240,svcv1:1242,svcv2:1242,svcv4:1240,sv1:900,sv2:900,sv10c:852};
function fitSvg237(svg,key){const vb=svg.viewBox.baseVal,scale=e=>{const m=e.getScreenCTM();return m?Math.hypot(m.a,m.b):1};
 if(vb&&vb.width>0&&DESK237[key]&&scale(svg)<DESK237[key]/vb.width-.001)svg.style.setProperty('--w237',DESK237[key]+'px');
 const labels=[...svg.querySelectorAll('text')].filter(t=>t.textContent.trim()&&t.checkVisibility());if(!labels.length)return;
 const own=e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()),units=e=>parseFloat(getComputedStyle(e).fontSize),px=e=>units(e)*scale(e);
 const bb=e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]},inside=(a,b)=>a[0]>=b[0]-.5&&a[1]>=b[1]-.5&&a[2]<=b[2]+.5&&a[3]<=b[3]+.5,
  meet=(a,b)=>Math.min(a[2],b[2])-Math.max(a[0],b[0])>1&&Math.min(a[3],b[3])-Math.max(a[1],b[1])>1;
 const sr=svg.getBoundingClientRect(),limit=sr.width*sr.height*.4;
 const shapes=[...svg.querySelectorAll('rect,ellipse,circle,polygon')].filter(s=>s.checkVisibility()).map(bb).filter(q=>(q[2]-q[0])*(q[3]-q[1])<limit);
 // A label keeps the room it had to each edge of each box it sits in, up to 4 px across and 1 px up and down.
 const info=labels.map(t=>{const b=bb(t);return {t,leaves:[t,...t.querySelectorAll('tspan')].filter(own).map(e=>({e,u:units(e),p:px(e)})),
  boxes:shapes.filter(q=>inside(b,q)).map(q=>({q,room:[Math.min(b[0]-q[0],4),Math.min(b[1]-q[1],1),Math.min(q[2]-b[2],4),Math.min(q[3]-b[3],1)]}))}});
 const before=info.map(x=>bb(x.t)),was=new Set();for(let i=0;i<info.length;i++)for(let j=i+1;j<info.length;j++)if(meet(before[i],before[j]))was.add(i+' '+j);
 const apply=(x,f)=>{for(const l of x.leaves){const k=Math.min(11/l.p,f);if(k>1.0001)l.e.style.setProperty('--fs237',(l.u*k).toFixed(2)+'px');else l.e.style.removeProperty('--fs237')}};
 const fits=i=>{const b=bb(info[i].t);if(!info[i].boxes.every(({q,room})=>b[0]-q[0]>=room[0]-.5&&b[1]-q[1]>=room[1]-.5&&q[2]-b[2]>=room[2]-.5&&q[3]-b[3]>=room[3]-.5))return false;for(let j=0;j<info.length;j++)if(j!==i&&!was.has(Math.min(i,j)+' '+Math.max(i,j))&&meet(b,bb(info[j].t)))return false;return true};
 const grow=info.map((x,i)=>[x,i,Math.max(1,...x.leaves.map(l=>11/l.p))]).filter(g=>g[2]>1.0001);
 for(const [x,,f] of grow){x.f=f;apply(x,f)}
 for(let pass=0;pass<2;pass++)for(const [x,i] of grow){if(fits(i))continue;let lo=1,hi=x.f;for(let n=0;n<10;n++){const m=(lo+hi)/2;apply(x,m);if(fits(i))lo=m;else hi=m}x.f=lo;apply(x,lo)}
 const min=Math.min(...info.flatMap(x=>x.leaves.map(l=>px(l.e))));
 if(min<10.95)svg.style.setProperty('--w237',Math.ceil(svg.getBoundingClientRect().width*11/min)+'px')}
function fitOvDiagrams237(){const panel=builderOvRoot135?.querySelector('[data-ov-panel]:not([hidden])');if(!panel||state.view!=='ov')return;
 for(const svg of panel.querySelectorAll('svg')){if(svg.dataset.fit237||svg.parentElement.closest('svg')||!svg.checkVisibility()||svg.getBoundingClientRect().width<120)continue;
  svg.dataset.fit237='1';try{fitSvg237(svg,panel.dataset.ovPanel)}catch(e){warn(e)}}}
function refitOvDiagrams237(){if(!builderOvRoot135||state.view!=='ov')return;
 builderOvRoot135.querySelectorAll('svg[data-fit237]').forEach(s=>{delete s.dataset.fit237;s.style.removeProperty('--w237');s.querySelectorAll('[style*="--fs237"]').forEach(t=>t.style.removeProperty('--fs237'))});fitOvDiagrams237()}
let fitQueued237=false;
if(typeof builderOvRoot135!=='undefined'&&builderOvRoot135)new MutationObserver(()=>{if(fitQueued237||state.view!=='ov')return;fitQueued237=true;requestAnimationFrame(()=>{fitQueued237=false;try{fitOvDiagrams237()}catch(e){warn(e)}})}).observe(builderOvRoot135,{childList:true,subtree:true});
let refitTimer237=0;addEventListener('resize',()=>{clearTimeout(refitTimer237);refitTimer237=setTimeout(()=>{try{refitOvDiagrams237()}catch(e){warn(e)}},300)});

// ---- 18. The page header on a phone: no tagline; search and the pipeline filter behind one button that says when either
// is in use; the views in one row beside it, with the open view in sight. Wider screens are unchanged.
(function(){const bar=document.querySelector('.toolbar'),search=document.getElementById('search'),filter=document.getElementById('pipelineFilter'),seg=bar?.querySelector('.seg');if(!bar||!search||!filter||!seg)return;
 const btn=document.createElement('button');btn.type='button';btn.className='searchToggle237';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','search pipelineFilter');
 btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><span class="vh237">Search and filter</span><b class="searchOn237" hidden>On</b>';
 bar.prepend(btn);
 const sync=()=>{const on=!!search.value.trim()||filter.value!=='all';btn.querySelector('.searchOn237').hidden=!on;btn.title=on?'Search and filter (in use)':'Search and filter'};
 btn.addEventListener('click',()=>{const open=!bar.classList.contains('open237');bar.classList.toggle('open237',open);btn.setAttribute('aria-expanded',String(open));if(open)search.focus()});
 search.addEventListener('input',sync);filter.addEventListener('change',sync);sync();
 // A fade at the row's end where more views are hidden, as Build 231's wide rows show.
 const cue=()=>{const more=seg.scrollWidth-seg.clientWidth>2;seg.classList.toggle('cueRight231',more&&seg.scrollLeft+seg.clientWidth<seg.scrollWidth-2);seg.classList.toggle('cueLeft231',more&&seg.scrollLeft>2)};
 const center=()=>{if(narrow.matches)centerIn237(seg,seg.querySelector('button.active'));cue()};
 new MutationObserver(m=>{if(m.some(r=>r.target!==seg))requestAnimationFrame(center)}).observe(seg,{subtree:true,attributes:true,attributeFilter:['class']});
 seg.addEventListener('scroll',cue,{passive:true});narrow.addEventListener('change',center);addEventListener('resize',cue);requestAnimationFrame(center)})();

// After a view switch: Operate's list and the toolbar's height (it changes the list's top), and the header row.
const switchBefore237=switchView;switchView=function(...a){const r=switchBefore237.apply(this,a);try{opsTop237();fitOpsNav237();syncOps237()}catch(e){warn(e)}return r};
})();

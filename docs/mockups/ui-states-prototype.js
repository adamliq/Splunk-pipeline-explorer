(function(){
'use strict';
// Build 239: states and focus, the visual audit's 13 findings (F1 to F13) and the UI element list's 11 items. Each part
// names its finding or item; the styles do most of the work. The block sets no globals.
const warn=e=>console.warn('Build 239',e);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Runs f once in the next frame, however often it is asked for before then.
const later=f=>{let id=0;return()=>{if(!id)id=requestAnimationFrame(()=>{id=0;try{f()}catch(e){warn(e)}})}};

// ---- Items 4 and 5. The Builder's two modal overlays: the one the Insert dialog and the pre-export review share, and the
// presentation. While one is open the page behind it is inert, so Tab stays in it; Escape closes the Insert dialog, as it
// closes the presentation. When one closes, focus goes back to the control that opened it, unless the app has put it
// somewhere itself; a control in a menu that has closed since gives it to the menu's button (the presentation opens from
// the Builder's File menu).
const OVERLAYS239=['builderImpactOverlay','builderPresentationOverlay'];
let lastOutside239=null,inert239=[],opener239=null,openNow239=null;
document.addEventListener('focusin',e=>{const t=e.target;if(t instanceof Element&&!t.closest('#builderImpactOverlay,#builderPresentationOverlay,#builderIssuePopover'))lastOutside239=t},true);
const openOverlay239=()=>OVERLAYS239.map(id=>document.getElementById(id)).find(o=>o&&o.classList.contains('open'))||null;
function releaseInert239(){for(const e of inert239)e.inert=false;inert239=[]}
function syncOverlays239(){const open=openOverlay239();if(open===openNow239)return;releaseInert239();
 if(open){if(!openNow239)opener239=lastOutside239;openNow239=open;
  // Each element beside the overlay, and beside each of its ancestors, up to the body.
  for(let n=open;n.parentElement&&n!==document.body;n=n.parentElement)for(const s of n.parentElement.children)
   if(s!==n&&!s.inert&&!/^(SCRIPT|STYLE|TEMPLATE|LINK|META)$/.test(s.tagName)){s.inert=true;inert239.push(s)}
  return}
 openNow239=null;const a=document.activeElement;
 if(!a||a===document.body||!a.isConnected||a.closest('#builderImpactOverlay,#builderPresentationOverlay')||a.matches('.builderCanvas')){
  const shown=o=>{if(!o?.isConnected)return null;if(o.checkVisibility())return o;const s=o.closest('details')?.querySelector(':scope>summary');return s?.checkVisibility()?s:null};
  (shown(opener239)||shown(document.querySelector('.insert199')))?.focus()}
 opener239=null}
function watchOverlays239(){for(const id of OVERLAYS239){const o=document.getElementById(id);if(!o||o.dataset.watch239)continue;o.dataset.watch239='1';
 new MutationObserver(syncOverlays239).observe(o,{attributes:true,attributeFilter:['class']})}syncOverlays239()}
try{new MutationObserver(watchOverlays239).observe(document.body,{childList:true});watchOverlays239();
 // A close lets go of the page first, so the focus the app gives on closing lands, then puts focus back if it didn't.
 for(const name of ['closeBuilderChangeImpact','closeBuilderPresentation']){const before=window[name];if(typeof before!=='function')continue;
  window[name]=function(...a){releaseInert239();const r=before.apply(this,a);syncOverlays239();return r}}
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||e.defaultPrevented)return;const o=document.getElementById('builderImpactOverlay');
  if(o?.classList.contains('open')){e.preventDefault();e.stopPropagation();closeBuilderChangeImpact()}},true)}catch(e){warn(e)}

// ---- Item 5. The review marker's popup gives focus back to the marker that opened it when it closes with focus inside it.
let popOpener239=null;
try{const showBefore239=showBuilderIssuePopover;showBuilderIssuePopover=function(context,anchor,...rest){
  const from=anchor instanceof Element?anchor:document.activeElement;const r=showBefore239.call(this,context,anchor,...rest);
  popOpener239=from instanceof Element&&from!==document.body?from:null;return r};
 const hideBefore239=hideBuilderIssuePopover;hideBuilderIssuePopover=function(...a){const pop=document.getElementById('builderIssuePopover'),
  had=!!pop&&!pop.hidden&&pop.contains(document.activeElement),from=popOpener239;const r=hideBefore239.apply(this,a);
  if(pop&&!pop.hidden)return r;popOpener239=null;
  if(had&&from){const edge=from.getAttribute?.('data-geometry-edge');
   const back=from.isConnected?from:edge?document.querySelector(`.builderEdgeIssueMarker[data-geometry-edge="${CSS.escape(edge)}"]`):null;back?.focus()}
  return r}}catch(e){warn(e)}

// ---- Item 8. SV-1's and SV-2's interface tags get a transparent hit area at least 22 units square, 24 px or more at the
// smallest size OV draws them (the styles widen the links' own hit lines the same way). It goes last in the tag, so code
// that looks for a tag's first rect still finds its frame.
const SVG_NS239='http://www.w3.org/2000/svg';
function svTargets239(){const root=builderOvRoot135;if(!root||!root.isConnected)return;
 for(const g of root.querySelectorAll('.svPage188 g.tag')){if(g.querySelector(':scope>rect.hit239'))continue;const r=g.querySelector(':scope>rect');if(!r)continue;
  const x=+r.getAttribute('x'),y=+r.getAttribute('y'),w=+r.getAttribute('width'),h=+r.getAttribute('height');if(![x,y,w,h].every(Number.isFinite))continue;
  const W=Math.max(w,22),H=Math.max(h,22),hit=document.createElementNS(SVG_NS239,'rect');hit.setAttribute('class','hit239');
  hit.setAttribute('x',String(x-(W-w)/2));hit.setAttribute('y',String(y-(H-h)/2));hit.setAttribute('width',String(W));hit.setAttribute('height',String(H));hit.setAttribute('aria-hidden','true');g.append(hit)}}
const ovSoon239=later(svTargets239);
try{new MutationObserver(ovSoon239).observe(builderOvRoot135,{childList:true,subtree:true});svTargets239()}catch(e){warn(e)}

// ---- F2. A number field on Operate's pages that refuses a value says why, under the field, with a sign, and is described
// by it: "Enter 1 to 256. Until then, 12 stays in use." The red border stays. The page redraws the field when a value is
// accepted, and the message goes with it.
function fieldMessage239(x){const box=x.closest('.fleet233Field,.capacityField,.multiDsField')||x.parentElement;if(!box)return;
 let m=[...box.children].find(c=>c.classList.contains('fieldMsg239'));
 const ids=(x.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);
 if(x.getAttribute('aria-invalid')==='true'){
  const min=x.min,max=x.max,rule=min!==''&&max!==''?`Enter ${min} to ${max}.`:min!==''?`Enter ${min} or more.`:'Enter a number.';
  const keep=x.defaultValue!==''?` Until then, ${x.defaultValue} stays in use.`:'';
  if(!m){m=document.createElement('p');m.className='fieldMsg239';m.id=(x.id||'field239-'+Math.random().toString(36).slice(2,8))+'-msg239';box.append(m)}
  m.innerHTML=`<span class="sign239" aria-hidden="true">!</span> ${esc(rule+keep)}`;
  if(!ids.includes(m.id))x.setAttribute('aria-describedby',[...ids,m.id].join(' '))}
 else if(m){const rest=ids.filter(i=>i!==m.id);if(rest.length)x.setAttribute('aria-describedby',rest.join(' '));else x.removeAttribute('aria-describedby');m.remove()}}
try{new MutationObserver(recs=>{for(const r of recs)if(r.target instanceof HTMLInputElement)fieldMessage239(r.target)})
 .observe(document.getElementById('operationsContent'),{subtree:true,attributes:true,attributeFilter:['aria-invalid']})}catch(e){warn(e)}

// ---- F3 and F4. The open Operate page and the open view are marked for screen readers as they are on screen (the edits mark
// the chosen symptom, scenario and Authentication card, and the view switcher as it switches).
function markCurrent239(){for(const b of document.querySelectorAll('.operationsNav button,.seg button')){
 if(b.classList.contains('active')){if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page')}else if(b.hasAttribute('aria-current'))b.removeAttribute('aria-current')}}
try{const opsBefore239=renderOperations;renderOperations=function(...a){const r=opsBefore239.apply(this,a);try{markCurrent239()}catch(e){warn(e)}return r};markCurrent239()}catch(e){warn(e)}
})();

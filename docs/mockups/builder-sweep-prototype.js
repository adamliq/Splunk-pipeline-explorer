/* builder-sweep-v232: fixes from a check of the Builder page (Build 232). Numbers are the items of that check.
   Item 1 and 2 (the presentation state), 3 (the Help item), 11 (two search boxes' names), 13 (Save's suggested name) and
   9's threshold are in-place edits; this block holds the parts that run after the page's own code. */
(function(){
const world=()=>document.querySelector('#builderTree .unifiedBuilderWorld');
const nums=s=>(s||'').match(/[-\d.]+/g)?.map(Number);

// ---- 4 and 5. Route labels fit their text. Each label's box is sized from its text's length in characters (Build 123:
// 5.8 px a character and 18 px over), and below 100% zoom its text grows to keep it readable, up to 13 px (Build 141); a
// bundled management label gets " · N clients" added and its box widened without its text being moved back to the
// middle (Build 164). After each placement, and when the zoom changes the text's size, a box narrower than its text and
// 18 px is widened about its own middle, the text is put back in the middle, and an issue badge drawn beside the label
// moves with the edge it sits by. A box is never narrowed, so the page's own spacing is kept.
const PAD=18;
function fitLabels(){const w=world();if(!w)return;
 for(const label of w.querySelectorAll('.edgeRouteLabel')){if(label.dataset.labelHidden==='true')continue;
  const text=label.querySelector(':scope>text'),rect=label.querySelector(':scope>rect');if(!text||!rect)continue;
  const t=nums(label.getAttribute('transform'));if(!t||t.length<2)continue;
  let width=Number(rect.getAttribute('width'))||0;const x0=Number(rect.getAttribute('x')||0),need=Math.ceil((text.getComputedTextLength()+PAD)*10)/10;
  if(need>width+.5){const grow=need-width;
   label.setAttribute('transform',`translate(${+(t[0]-grow/2).toFixed(2)} ${t[1]})`);rect.setAttribute('width',String(need));
   // A badge inside the label is placed from the label's left edge: beside its right end it moves the whole growth,
   // under its middle half of it, before its left end not at all (the left end itself moved).
   const shift=v=>{const q=nums(v);if(!q||q.length<2)return v;const x=q[0]-x0,dx=x>width?grow:x>=0?grow/2:0;return `translate(${+(q[0]+dx).toFixed(2)} ${q[1]})`};
   for(const m of label.querySelectorAll(':scope>.builderEdgeIssueMarker')){m.setAttribute('transform',shift(m.getAttribute('transform')));if(m.dataset.labelTransform164)m.dataset.labelTransform164=shift(m.dataset.labelTransform164)}
   width=need}
  if(getComputedStyle(text).textAnchor==='middle'){const mid=+(x0+width/2).toFixed(2);if(Math.abs(Number(text.getAttribute('x'))-mid)>.05)text.setAttribute('x',String(mid))}}}
for(const name of ['builderPlaceLabels149','builderBundleLabels163','builderBadges164']){const before=window[name];if(typeof before!=='function')continue;
 window[name]=function(...args){const result=before.apply(this,args);try{fitLabels()}catch(e){}return result}}
// The text's size follows the zoom (Build 141 sets it on each change of view), so a change that alters it fits again.
let lastSize='';
if(typeof applyBuilderViewport==='function'){const before=applyBuilderViewport;
 applyBuilderViewport=function(...args){const result=before.apply(this,args),size=document.querySelector('#builderTree')?.style.getPropertyValue('--builder-label-size-v141')||'';
  if(size!==lastSize){lastSize=size;try{fitLabels()}catch(e){}}return result}}

// ---- 7. On a phone the connection handles under each card (Event data and the others) sit on the card's outgoing link,
// where its route label goes, and the label was drawn under one. Labels and issue badges are kept clear of the list
// Build 211 gives (containers' and type headers' controls, in canvas units, 2 px larger all round); on a phone the
// handles that show join it.
if(typeof window.builderLabelObstacles211==='function'){const before=window.builderLabelObstacles211;
 window.builderLabelObstacles211=function(...args){const list=before.apply(this,args)||[];const w=world();
  if(!w||typeof builderPhoneMedia158!=='object'||!builderPhoneMedia158.matches)return list;
  const o=w.getBoundingClientRect(),z=state.builderViewport?.zoom||1;
  for(const h of w.querySelectorAll('.builderConnectionHandles>button')){if(!h.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;const r=h.getBoundingClientRect();if(!r.width)continue;
   list.push({x:(r.left-o.left)/z-2,y:(r.top-o.top)/z-2,w:r.width/z+4,h:r.height/z+4})}
  return list}}

// ---- 9. A first visit opens where cards show their details. Build 231 folds Components when the topology would fit at
// under 70%; the edit makes that 75%, the zoom from which cards show their details and links their labels (Build 163),
// and calls this after its fit: if the fit is still under 75% (1280 px wide, say), the Inspector's own Hide control is
// pressed too and the view is fitted again. Only on a first visit, and only when no panel state has been chosen, as before.
let inspectorFolded=false;
window.builderFirstFit232=function(){setTimeout(()=>{const v=state.builderViewport||{};if(document.body.dataset.view!=='builder'||!v.initialized||v.zoom>=.75)return;
 if(typeof canvasPanelState!=='object'||!canvasPanelState.inspector)return;
 const hide=document.getElementById('builderInspectorDrawerClose');if(hide?.checkVisibility())hide.click();else if(typeof toggleBuilderCanvasInspector==='function')toggleBuilderCanvasInspector();
 inspectorFolded=true;requestAnimationFrame(()=>{try{fitBuilderView()}catch(e){}})},150)};
// An Inspector folded this way opens again at the first selection (a card, a link or a badge, by pointer or key), as
// that is where a person edits what they chose; its rail's own control is pressed. One that the person folds stays folded.
const reopen=()=>{if(!inspectorFolded)return;const chosen=(state.builderSelected!==null&&state.builderSelected!==undefined)||!!state.builderSelectedEdge;if(!chosen)return;inspectorFolded=false;
 if(typeof canvasPanelState!=='object'||canvasPanelState.inspector)return;
 const rail=[...document.querySelectorAll('#topologyBuilder .dockRail197')].find(b=>b.checkVisibility()&&/Inspector/.test(b.getAttribute('aria-label')||b.title||b.textContent));
 if(rail)rail.click();else if(typeof toggleBuilderCanvasInspector==='function')toggleBuilderCanvasInspector()};
for(const type of ['click','keyup'])document.addEventListener(type,e=>{if(!inspectorFolded)return;if(e.target.closest?.('#topologyBuilder .dockRail197'))inspectorFolded=false;else if(e.target.closest?.('#topologyBuilder'))setTimeout(reopen,0)},true);

window.builderSweep232={fitLabels};
})();

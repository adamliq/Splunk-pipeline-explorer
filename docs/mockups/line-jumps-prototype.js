(function(){
/* Build 213: line jumps. Where a link's horizontal run crosses another link's vertical run, the horizontal one jumps over
   the vertical one with a small arc, on the canvas and in every diagram the Builder exports (Export SVG and PNG, the
   presentation and the architecture pack). View › Line jumps turns them off and on; the choice is kept in the browser.
   One in-place edit goes with this block: the View menu's "Line jumps" item. */

const KEY='splunkPipelineExplorer.lineJumps.v1';
// An arc's radius, and how far a crossing must be from either run's ends (its corners and arrowhead) to get one.
const R=5,MARGIN=8;
let on=true;try{on=localStorage.getItem(KEY)!=='off'}catch{}

// A path's d as commands. The Builder's routes use absolute M, L and Q only; any other path is left as it is.
function parse(d){const t=String(d||'').match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g);if(!t||t[0]!=='M')return null;const cmds=[];
 for(let i=0;i<t.length;){const c=t[i++],n={M:2,L:2,Q:4}[c];if(!n)return null;const v=[];for(let k=0;k<n;k++){const x=Number(t[i++]);if(!Number.isFinite(x))return null;v.push(x)}cmds.push({c,v})}
 return cmds}
// Its straight runs along an axis: horizontal ones by y and x range, vertical ones by x and y range, with the command's
// index.
function runs(cmds){const out=[];let x=0,y=0;cmds.forEach((m,i)=>{const tx=m.v[m.v.length-2],ty=m.v[m.v.length-1];
  if(m.c==='L'){if(Math.abs(ty-y)<.5&&Math.abs(tx-x)>.5)out.push({h:true,i,y,a:Math.min(x,tx),b:Math.max(x,tx)});else if(Math.abs(tx-x)<.5&&Math.abs(ty-y)>.5)out.push({h:false,i,x,a:Math.min(y,ty),b:Math.max(y,ty)})}
  x=tx;y=ty});return out}
// The crossings among a set of paths: a horizontal run of one and a vertical run of another that cross away from both
// runs' ends. Runs that touch, overlap or meet end-on (links sharing a trunk, or joining one) don't cross. For each path,
// its horizontal runs' crossings by command index.
function crossings(items){const hops=new Map();let count=0;
 for(const A of items)for(const h of A.runs){if(!h.h)continue;
  for(const B of items){if(B===A)continue;for(const v of B.runs){if(v.h)continue;
   if(v.x>h.a+MARGIN&&v.x<h.b-MARGIN&&h.y>v.a+MARGIN&&h.y<v.b-MARGIN){const byRun=hops.get(A)||new Map();const xs=byRun.get(h.i)||[];xs.push(v.x);byRun.set(h.i,xs);hops.set(A,byRun);count++}}}}
 return {hops,count}}
const num=n=>String(Math.round(n*100)/100);
// The path's d with an arc over each crossing: crossings closer than an arc's width share one, wider, arc. The arc rises
// above a run drawn left to right and right to left alike.
function hopped(cmds,byRun){let x=0,y=0;const parts=[];cmds.forEach((m,i)=>{const tx=m.v[m.v.length-2],ty=m.v[m.v.length-1],xs=byRun.get(i);
  if(m.c==='L'&&xs){const s=tx>x?1:-1,sorted=[...new Set(xs)].sort((a,b)=>(a-b)*s),groups=[];
   for(const cx of sorted){const g=groups[groups.length-1];if(g&&Math.abs(cx-g.last)<2*R+2)g.last=cx;else groups.push({first:cx,last:cx})}
   for(const g of groups){const a=g.first-s*R,b=g.last+s*R,rx=Math.abs(b-a)/2;parts.push(`L${num(a)} ${num(y)}`,`A${num(rx)} ${R} 0 0 ${s>0?1:0} ${num(b)} ${num(y)}`)}
   parts.push(`L${num(tx)} ${num(ty)}`)}
  else parts.push(m.c+m.v.map(num).join(' '));x=tx;y=ty});
 return parts.join(' ')}
// The jumps for a set of path elements, each with its plain d: { element → hopped d } and the number of crossings.
function plan(entries){const items=[];for(const e of entries){const cmds=parse(e.d);if(cmds)items.push({el:e.el,cmds,runs:runs(cmds)})}
 const {hops,count}=crossings(items),out=new Map();for(const [item,byRun] of hops)out.set(item.el,hopped(item.cmds,byRun));return {out,count}}

// The canvas. Each link's line (path.unifiedConnector) keeps its plain d in data-plain-d213 while it has jumps
// (data-jump-d213 holds the d with them), so a pass works from the plain route, whoever drew it last. The invisible hit
// line beside it keeps the plain route. Lines that an isolation (navHidden) or a collapsed component type
// (builderTypeHidden130) hides take no part.
const lines=()=>[...document.querySelectorAll('#builderTree .unifiedConnectorLayer path.unifiedConnector[data-edge-id]')];
const plainOf=p=>p.dataset.jumpD213&&p.getAttribute('d')===p.dataset.jumpD213?p.dataset.plainD213:p.getAttribute('d');
let lastCount=0;
function apply(){const all=lines(),plains=new Map(),entries=[];
 for(const p of all){const plain=plainOf(p);plains.set(p,plain);if(on&&!p.matches('.navHidden,.builderTypeHidden130'))entries.push({el:p,d:plain})}
 const {out,count}=plan(entries);lastCount=on?count:0;
 for(const p of all){const plain=plains.get(p),jump=out.get(p);
  if(jump){p.dataset.plainD213=plain;p.dataset.jumpD213=jump;if(p.getAttribute('d')!==jump)p.setAttribute('d',jump)}
  else{delete p.dataset.jumpD213;delete p.dataset.plainD213;if(p.getAttribute('d')!==plain)p.setAttribute('d',plain)}}}
// Plain routes back on the page, for code that measures them.
function unhop(){for(const p of lines())if(p.dataset.jumpD213&&p.getAttribute('d')===p.dataset.jumpD213)p.setAttribute('d',p.dataset.plainD213)}
// Any route drawn or redrawn (a redraw, a drag, a waypoint, a re-route), and any line shown or hidden, gets its jumps at
// the next frame.
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
// Label placement (Builds 149 and 156) samples each line's route from the page when it starts, and reads some routes
// again as it goes (a label shown without text sits on its link's midpoint). The routes go back to plain when it
// samples, and the jumps come back at the next frame, after the placement, so labels go where Build 212 puts them.
if(typeof builderPerfSample149==='function'){const sampleBefore=builderPerfSample149;
 builderPerfSample149=function(...args){unhop();try{return sampleBefore.apply(this,args)}finally{schedule()}}}
const tree=document.getElementById('builderTree');
if(tree&&typeof MutationObserver==='function')new MutationObserver(records=>{
 if(records.some(r=>r.type==='childList'||r.target.matches?.('path.unifiedConnector')&&(r.attributeName==='class'||r.target.getAttribute('d')!==r.target.dataset.jumpD213)))schedule()})
 .observe(tree,{subtree:true,childList:true,attributes:true,attributeFilter:['d','class']});

// Exports. Every diagram the Builder exports comes from architectureSvgForScope; its links are the paths with an
// arrowhead, in one group. With no crossings the export is unchanged.
function jumpSvg(source){try{const doc=new DOMParser().parseFromString(source,'image/svg+xml');if(doc.querySelector('parsererror'))return source;
  const groups=new Map();for(const p of doc.querySelectorAll('path[marker-end]')){const list=groups.get(p.parentNode)||[];list.push({el:p,d:p.getAttribute('d')});groups.set(p.parentNode,list)}
  let changed=false;for(const entries of groups.values()){const {out}=plan(entries);for(const [p,d] of out){p.setAttribute('d',d);changed=true}}
  if(!changed)return source;const prolog=source.match(/^<\?xml[^>]*\?>\s*/)?.[0]||'';return prolog+new XMLSerializer().serializeToString(doc.documentElement)}catch{return source}}
if(typeof architectureSvgForScope==='function'){const svgBefore=architectureSvgForScope;
 architectureSvgForScope=function(...args){const svg=svgBefore.apply(this,args);return on&&typeof svg==='string'?jumpSvg(svg):svg}}

// View › Line jumps (the menu bar's item calls these), and for checks.
window.builderLineJumps213={isOn:()=>on,count:()=>lastCount,apply,
 toggle(){on=!on;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'off')}catch{}apply();if(typeof builderStatus==='function')builderStatus(on?'Line jumps on':'Line jumps off')}};
apply();
})();

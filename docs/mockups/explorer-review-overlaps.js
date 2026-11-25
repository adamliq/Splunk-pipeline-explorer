// Text over other text, as the review's sweep (audit31.js) counts it, and again with each line of text first cut to the
// boxes around it that clip or scroll their content: a line scrolled out of sight in a scroll box, or cut off by a box
// that hides overflow, can't cover anything. Same pages, same three-screen reach, same test of two lines overlapping.
// Usage: node explorer-review-overlaps.js <page.html> <width>x<height> <out.json>   (in the scratch work, overlap31.js)
// Prints, per page with any overlap, both counts and the visible pairs; then the totals.
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const fs=require('fs'),path=require('path');
const FILE='file://'+path.resolve(process.argv[2]),[W,H]=process.argv[3].split('x').map(Number),OUT=process.argv[4];
const VIEWS=['flow','matrix','config','builder','diagnostic','failure','changes'];
function check(){
 const vis=e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
 const sel=e=>{const p=e.parentElement;const s=x=>x.id?'#'+x.id:x.tagName.toLowerCase()+(x.classList[0]?'.'+x.classList[0]:'');return (p?s(p)+' > ':'')+s(e)};
 const txt=e=>(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim();
 const leaf=[...document.querySelectorAll('body *')].filter(e=>vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
 // The boxes that clip an element's text: the element itself and every ancestor, whose overflow isn't visible, as its
 // padding box (a code pane that scrolls clips its own lines).
 const clipOf=new Map();const clips=e=>{if(clipOf.has(e))return clipOf.get(e);const out=[];for(let a=e;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);if(s.overflowX!=='visible'||s.overflowY!=='visible'){const r=a.getBoundingClientRect();out.push({l:r.left+a.clientLeft,t:r.top+a.clientTop,r:r.left+a.clientLeft+a.clientWidth,b:r.top+a.clientTop+a.clientHeight})}}clipOf.set(e,out);return out};
 const cut=(q,e)=>{let l=q.left,t=q.top,r=q.right,b=q.bottom;for(const c of clips(e)){l=Math.max(l,c.l);t=Math.max(t,c.t);r=Math.min(r,c.r);b=Math.min(b,c.b)}return r-l>2&&b-t>2?{left:l,top:t,right:r,bottom:b}:null};
 const count=clipped=>{const rects=[];for(const e of leaf){if(rects.length>4000)break;const g=document.createRange();for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.trim()){g.selectNodeContents(n);for(const q0 of g.getClientRects()){if(!(q0.width>2&&q0.height>2&&q0.bottom>0&&q0.top<innerHeight*3))continue;const q=clipped?cut(q0,e):q0;if(q)rects.push([e,q])}}}
  const over=[];const grid=new Map();rects.forEach(([e,q],i)=>{for(let gx=Math.floor(q.left/100);gx<=Math.floor(q.right/100);gx++)for(let gy=Math.floor(q.top/50);gy<=Math.floor(q.bottom/50);gy++){const k=gx+','+gy;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i)}});
  const seen=new Set();for(const ids of grid.values())for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){const [e1,q1]=rects[ids[a]],[e2,q2]=rects[ids[b]];if(e1===e2||e1.contains(e2)||e2.contains(e1))continue;
   const ix=Math.min(q1.right,q2.right)-Math.max(q1.left,q2.left),iy=Math.min(q1.bottom,q2.bottom)-Math.max(q1.top,q2.top);if(ix>3&&iy>3){const k=sel(e1)+'|'+sel(e2);if(!seen.has(k)){seen.add(k);over.push([sel(e1),txt(e1).slice(0,40),sel(e2),txt(e2).slice(0,40)])}}}
  return over};
 const raw=count(false),shown=count(true);return {raw:raw.length,visible:shown.length,visibleSample:shown.slice(0,8)}}
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:W,height:H}});const p=await ctx.newPage();
 await p.goto(FILE,{timeout:30000});await p.waitForTimeout(2000);await p.evaluate(`window.__ov31=${check}`);
 const res={};const run=async(name,go)=>{await go();await p.waitForTimeout(250);try{res[name]=await p.evaluate(()=>window.__ov31())}catch(e){res[name]={error:e.message}}};
 for(const v of VIEWS)await run('view '+v,async()=>{await p.evaluate(v=>switchView(v),v);await p.waitForTimeout(600)});
 await p.evaluate(()=>switchView('ov'));await p.waitForTimeout(800);
 const tabs=await p.evaluate(()=>[...document.querySelectorAll('.ovTabs135 [data-ov-tab]')].map(t=>t.dataset.ovTab));
 for(const t of tabs)await run('ov '+t,async()=>{await p.evaluate(t=>document.querySelector(`.ovTabs135 [data-ov-tab="${t}"]`).click(),t);await p.waitForTimeout(400)});
 await p.evaluate(()=>switchView('operations'));await p.waitForTimeout(600);
 const ops=await p.evaluate(()=>[...document.querySelectorAll('.operationsNav button')].map(b=>b.innerText.replace(/\s+/g,' ').trim()));
 for(let i=0;i<ops.length;i++)await run('ops '+ops[i],async()=>{await p.evaluate(i=>document.querySelectorAll('.operationsNav button')[i].click(),i);await p.waitForTimeout(400)});
 fs.writeFileSync(OUT,JSON.stringify(res,null,1));
 for(const [k,r] of Object.entries(res))if(r.raw||r.visible||r.error)console.log(k,'| as the sweep counts',r.raw,'| visible',r.visible,r.error||'',r.visibleSample?.length?JSON.stringify(r.visibleSample.slice(0,3)):'');
 const t=k=>Object.values(res).reduce((s,r)=>s+(r[k]||0),0);
 console.log(`${W}x${H}: pages ${Object.keys(res).length} | overlaps as the sweep counts ${t('raw')} | visible ${t('visible')}`);
 await b.close()})().catch(e=>{console.error(e);process.exit(2)});

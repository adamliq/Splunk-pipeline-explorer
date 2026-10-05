/* Builder connector check (Playwright + Chromium).
   Usage:  node tools/builder-connector-check.js [path/to/index.html] [screenshot-dir]
   Loads the Builder, then measures every data connector in 8 scenarios (default layout,
   after an unconnected palette add, and 6 free-layout drags). For each connector it checks
   start/end contact with the card border, arrow direction, running along borders, passing
   through its own or other cards, label distance from the line, labels over cards and
   badges over labels, both while dragging and after drop. Scenarios 9 and 10 load the reference topology
   (docs/mockups/ov1-reference-topology.json) and check every plane at Fit and at 100%. Prints JSON; "OK" means clean.
   Requires the playwright package (a global install is found automatically). */
const path=require('path'),fs=require('fs');
let playwright;try{playwright=require('playwright')}catch{playwright=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright')}
const { chromium } = playwright;
const f='file://'+path.resolve(process.argv[2]||'index.html'),SHOTS=process.argv[3]||null;if(SHOTS)fs.mkdirSync(SHOTS,{recursive:true});
const shot=async(p,name)=>{if(SHOTS)await p.screenshot({path:path.join(SHOTS,name)})};
// Measure every visible connector in world coordinates.
const MEASURE=()=>{
 // Everything in SCREEN pixels, divided by zoom so thresholds stay in world px.
 const z=state.builderViewport.zoom||1;
 const scr=r=>({x:r.left/z,y:r.top/z,w:r.width/z,h:r.height/z});
 const node=id=>{const b=document.querySelector(`[data-unified-node-wrap="${id}"] .builderNode`);return b?scr(b.getBoundingClientRect()):null};
 const name=id=>{const n=state.builderNodes.find(n=>n.id===id);return (typeof componentInstanceLabel==='function'&&n?componentInstanceLabel(n):null)||n?.name||id};
 const res=[];
 document.querySelectorAll('path.unifiedConnector').forEach(p=>{
  const plane=p.dataset.edgePlane,id=p.dataset.edgeId;const item=builderTraceEdges('all').find(e=>e.plane===plane&&String(e.id)===String(id));if(!item)return;
  const L=p.getTotalLength();if(!L)return;const M=p.getScreenCTM();
  const at=t=>{const q=p.getPointAtLength(Math.max(0,Math.min(L,t)));const s=new DOMPoint(q.x,q.y).matrixTransform(M);return{x:s.x/z,y:s.y/z}};
  const s=at(0),e=at(L),e2=at(L-6),s2=at(6);
  const A=node(item.from),B=node(item.to);if(!A||!B)return;
  const side=(pt,R)=>{const d={left:Math.abs(pt.x-R.x),right:Math.abs(pt.x-(R.x+R.w)),top:Math.abs(pt.y-R.y),bottom:Math.abs(pt.y-(R.y+R.h))};const k=Object.keys(d).sort((a,b)=>d[a]-d[b])[0];const inside=pt.x>R.x+2&&pt.x<R.x+R.w-2&&pt.y>R.y+2&&pt.y<R.y+R.h-2;return {side:k,gap:Math.round(d[k]),inside}};
  const dirName=v=>Math.abs(v.x)>=Math.abs(v.y)?(v.x>0?'→':'←'):(v.y>0?'↓':'↑');
  const ES=side(e,B),SS=side(s,A);
  const inward={left:'→',right:'←',top:'↓',bottom:'↑'}[ES.side],outward={left:'←',right:'→',top:'↑',bottom:'↓'}[SS.side];
  const endDir=dirName({x:e.x-e2.x,y:e.y-e2.y}),startDir=dirName({x:s2.x-s.x,y:s2.y-s.y});
  const others=state.builderNodes.filter(n=>n.id!==item.from&&n.id!==item.to).map(n=>[n.id,node(n.id)]).filter(x=>x[1]);const crosses=[];
  let insideOwn=0,run=0;
  for(let t=0;t<=L;t+=4){const q=at(t);others.forEach(([oid,R])=>{if(q.x>R.x+4&&q.x<R.x+R.w-4&&q.y>R.y+4&&q.y<R.y+R.h-4&&!crosses.includes(oid))crosses.push(oid)});
   if(t>=4&&t<=L-4)[A,B].forEach(R=>{if(q.x>R.x+3&&q.x<R.x+R.w-3&&q.y>R.y+3&&q.y<R.y+R.h-3)insideOwn++});
   const onL=Math.abs(q.x-B.x)<3||Math.abs(q.x-(B.x+B.w))<3;const onT=Math.abs(q.y-B.y)<3||Math.abs(q.y-(B.y+B.h))<3;
   if((onL&&q.y>B.y+3&&q.y<B.y+B.h-3)||(onT&&q.x>B.x+3&&q.x<B.x+B.w-3))run+=4}
  const g=document.querySelector(`[data-route-label][data-route-plane="${plane}"][data-route-edge="${CSS.escape(String(id))}"]`);const rect=g?.querySelector(':scope > rect');const LR=rect?scr(rect.getBoundingClientRect()):null;
  let labelDist=null;if(LR){const c={x:LR.x+LR.w/2,y:LR.y+LR.h/2};labelDist=1e9;for(let t=0;t<=L;t+=3){const q=at(t);labelDist=Math.min(labelDist,Math.hypot(q.x-c.x,q.y-c.y))}labelDist=Math.round(labelDist)}
  const hit=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
  const labelOverNode=LR?state.builderNodes.some(n=>{const R=node(n.id);return R&&hit(LR,R)}):false;
  // any badge (edge or node) overlapping this label's own rect
  const badgeOverLabel=LR?[...document.querySelectorAll('.builderEdgeIssueMarker circle,.builderNodeIssueMarker')].some(m=>hit(scr(m.getBoundingClientRect()),LR)):false;
  const ownBadge=g?.querySelector('.builderEdgeIssueMarker');
  // a label deliberately hidden for lack of room (data-label-hidden, v156) keeps only its badge on the line
  const labelHidden=g?.dataset.labelHidden==='true';let badgeDist=null;if(labelHidden&&ownBadge){const B=scr(ownBadge.getBoundingClientRect()),c={x:B.x+B.w/2,y:B.y+B.h/2};badgeDist=1e9;for(let t=0;t<=L;t+=3){const q=at(t);badgeDist=Math.min(badgeDist,Math.hypot(q.x-c.x,q.y-c.y))}badgeDist=Math.round(badgeDist)}
  res.push({edge:`${name(item.from)} → ${name(item.to)} [${plane}]`,start:{...SS,dir:startDir,expect:outward},end:{...ES,dir:endDir,expect:inward},arrowIntoNode:endDir===inward,runAlongTargetBorder:run,insideOwnSamples:insideOwn,crossesOtherNodes:crosses.map(name),labelDistFromLine:labelDist,labelOverNode,markerOverLabel:badgeOverLabel,badgeInLabel:!!ownBadge,labelHidden,badgeDist,labelLeader:g?.dataset.labelLeader==='true'});
 });
 return res;
};

(async()=>{const b=await chromium.launch();const results={};
const go=async(vp)=>{const p=await b.newPage({viewport:vp||{width:1440,height:900}});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message.slice(0,100)));await p.goto(f);await p.click('button[data-view="builder"]');await p.waitForTimeout(500);return p};
const summarise=r=>r.map(e=>{const bad=[];if(!e.arrowIntoNode)bad.push(`arrow ${e.end.dir} at ${e.end.side} (expected ${e.end.expect})`);if(e.start.dir!==e.start.expect)bad.push(`leaves ${e.start.side} going ${e.start.dir}`);if(e.end.gap>6)bad.push(`end ${e.end.gap}px from target`);if(e.start.gap>6)bad.push(`start ${e.start.gap}px from source`);if(e.end.inside)bad.push('ends inside target');if(e.start.inside)bad.push('starts inside source');if(e.runAlongTargetBorder>12)bad.push(`runs ${e.runAlongTargetBorder}px along target border`);if(e.insideOwnSamples>2)bad.push(`passes through own node (${e.insideOwnSamples*4}px)`);if(e.crossesOtherNodes.length)bad.push('crosses '+e.crossesOtherNodes.join(','));if(e.labelHidden){if(e.badgeDist!==null&&e.badgeDist>12)bad.push(`hidden label's badge ${e.badgeDist}px off line`)}else{if(e.labelDistFromLine>(e.labelLeader?90:20))bad.push(`label ${e.labelDistFromLine}px off line${e.labelLeader?' (with leader)':''}`);if(e.labelOverNode)bad.push('label over a node');if(e.markerOverLabel)bad.push('badge over label');}return `${e.edge}: ${bad.length?bad.join('; '):'OK'}${e.labelHidden&&!bad.length?' (label hidden: no room, badge on line)':''}`});
// 1) default horizontal
let p=await go();results['1 default (auto/horizontal)']=summarise(await p.evaluate(MEASURE));await p.close();
// 2) screenshot scenario: add HEC client via palette with UF selected (auto layout)
p=await go();await p.click('#builderAddToggle');await p.waitForTimeout(250);await p.fill('#builderPaletteQuery','hec');await p.keyboard.press('Enter');await p.waitForTimeout(600);await p.click('#builderInspectorDrawerClose').catch(()=>{});await p.waitForTimeout(300);
results['2 after +Add HEC client (auto)']=summarise(await p.evaluate(MEASURE));await shot(p,'edge-2.png');await p.close();
// 3..n) free layout moves via real mouse drags
const scenarios=[['3 Syslog Server dragged down-right (diagonal)',1,[140,260]],['4 Syslog Server dragged directly below Syslog Source',1,[-270,230]],['5 Syslog Server dragged left of Syslog Source (reversed)',1,[-560,40]],['6 Syslog Server dragged up-right',1,[120,-60]],['7 Universal Forwarder overlapping Syslog Server column',2,[-200,210]],['8 Indexer dragged below-left of UF',3,[-300,240]]];
for(const [label,idx,[dx,dy]] of scenarios){p=await go();await p.evaluate(()=>{const s=document.querySelector('#unifiedLayoutMode');s.value='free';s.dispatchEvent(new Event('change',{bubbles:true}))});await p.waitForTimeout(500);await p.evaluate(()=>fitBuilderView());await p.waitForTimeout(300);
 const nodeBtn=p.locator('.unifiedNodeWrap .builderNode').nth(idx);const box=await nodeBtn.boundingBox();const z=await p.evaluate(()=>state.builderViewport.zoom);
 const sx=box.x+box.width/2,sy=box.y+30;await p.mouse.move(sx,sy);await p.mouse.down();
 for(let i=1;i<=10;i++){await p.mouse.move(sx+dx*z*i/10,sy+dy*z*i/10);await p.waitForTimeout(20)}
 const mid=await p.evaluate(MEASURE);await shot(p,`edge-${label[0]}-mid.png`);
 await p.mouse.up();await p.waitForTimeout(500);
 const after=await p.evaluate(MEASURE);
 results[label]={whileDragging:summarise(mid),afterDrop:summarise(after),errors:p.errs};await shot(p,`edge-${label[0]}.png`);await p.close()}
// 9, 10) reference topology (docs/mockups/ov1-reference-topology.json), all planes, at Fit and at 100%.
// Checks every connector: one-to-one hops between cards in the same row with nothing between are a single straight
// segment; no two connectors share an endpoint; no connector passes through a card other than its own two; visible
// labels sit within 60px of their own line and off cards; at Fit (labels hidden by level of detail) badges sit
// within 3px of their own line.
const refFile=[path.join(path.dirname(path.resolve(process.argv[2]||'index.html')),'docs/mockups/ov1-reference-topology.json'),path.resolve('docs/mockups/ov1-reference-topology.json')].find(x=>fs.existsSync(x))||'';
if(fs.existsSync(refFile)){
 const REF=()=>{const z=state.builderViewport.zoom||1,world=document.querySelector('.unifiedBuilderWorld').getBoundingClientRect(),toW=r=>({x:(r.left-world.left)/z,y:(r.top-world.top)/z,w:r.width/z,h:r.height/z});
  const name=id=>{const n=state.builderNodes.find(n=>n.id===id);return n?(typeof componentInstanceLabel==='function'?componentInstanceLabel(n):n.name):id};
  const cards=new Map([...document.querySelectorAll('#builderTree [data-unified-node-wrap]')].filter(w=>w.getBoundingClientRect().width>0).map(w=>[+w.dataset.unifiedNodeWrap,toW((w.querySelector('.builderNode')||w).getBoundingClientRect())]));
  const edges=builderTraceEdges('all'),paths=[...document.querySelectorAll('#builderTree path.unifiedConnector')].filter(x=>getComputedStyle(x).display!=='none');
  const sample=pth=>{const L=pth.getTotalLength(),M=pth.getScreenCTM(),pts=[];for(let t=0;t<=L;t+=3){const q=pth.getPointAtLength(t),s=new DOMPoint(q.x,q.y).matrixTransform(M);pts.push({x:(s.x-world.left)/z,y:(s.y-world.top)/z})}return pts};
  const ends=new Map(),out=[];
  for(const pth of paths){const key=pth.dataset.edgePlane+':'+pth.dataset.edgeId,e=edges.find(x=>x.plane+':'+x.id===key);if(!e)continue;const pts=sample(pth),bad=[],A=cards.get(e.from),B=cards.get(e.to);
   for(const [i,q] of [[0,pts[0]],[1,pts[pts.length-1]]]){const tag={key,x:q.x,y:q.y,bundle:i===0?e.plane+':'+e.from:null},prev=[...ends.values()].find(o=>o.key!==key&&Math.hypot(o.x-q.x,o.y-q.y)<3);/* a bundle (same plane, same source) shares its trunk start on purpose */if(prev&&!(tag.bundle&&prev.bundle===tag.bundle))bad.push('shares an endpoint with '+prev.key);ends.set(key+':'+i,tag)}
   for(const [id,R] of cards){if(id===e.from||id===e.to)continue;if(pts.some(q=>q.x>R.x+4&&q.x<R.x+R.w-4&&q.y>R.y+4&&q.y<R.y+R.h-4))bad.push('crosses '+name(id))}
   if(A&&B&&Math.abs((A.y+A.h/2)-(B.y+B.h/2))<2&&![...cards].some(([id,R])=>id!==e.from&&id!==e.to&&R.x>Math.min(A.x,B.x)+A.w-2&&R.x+R.w<Math.max(A.x,B.x)+2&&R.y<A.y+A.h&&R.y+R.h>A.y)){const segs=(pth.getAttribute('d').match(/[LQC]/g)||[]).length;if(segs>1&&new Set(pts.map(q=>Math.round(q.y))).size>3)bad.push('same-row hop is not straight')}
   const lab=document.querySelector(`#builderTree [data-route-label][data-route-plane="${pth.dataset.edgePlane}"][data-route-edge="${CSS.escape(pth.dataset.edgeId)}"]`),rect=lab?.querySelector(':scope > rect'),rr=rect?.getBoundingClientRect(),labelShown=lab&&lab.dataset.labelHidden!=='true'&&rr&&rr.width>0&&getComputedStyle(lab).visibility!=='hidden'&&getComputedStyle(lab).display!=='none'&&parseFloat(getComputedStyle(lab).opacity||1)>0.05;
   if(labelShown){const LR=toW(rr),c={x:LR.x+LR.w/2,y:LR.y+LR.h/2},d=Math.min(...pts.map(q=>Math.hypot(q.x-c.x,q.y-c.y)));if(d>60)bad.push(`label ${Math.round(d)}px off line`);for(const [id,R] of cards)if(LR.x<R.x+R.w&&LR.x+LR.w>R.x&&LR.y<R.y+R.h&&LR.y+LR.h>R.y)bad.push('label over '+name(id))}
   else{const m=[...document.querySelectorAll('#builderTree .builderEdgeIssueMarker')].find(x=>(x.dataset.geometryEdge||'')===key);const mr=m?.getBoundingClientRect();if(mr&&mr.width){const M=toW(mr),c={x:M.x+M.w/2,y:M.y+M.h/2},d=Math.min(...pts.map(q=>Math.hypot(q.x-c.x,q.y-c.y)));if(d>3)bad.push(`badge ${Math.round(d)}px off line (label hidden)`)}}
   out.push(`${name(e.from)} → ${name(e.to)} [${e.plane}]: ${bad.length?bad.join('; '):'OK'}`)}
  return out};
 for(const [label,zoom] of [['9 reference topology at Fit',null],['10 reference topology at 100%',1]]){const p=await go();await p.evaluate(d=>loadTopologyDocument(JSON.parse(d)),fs.readFileSync(refFile,'utf8'));await p.waitForTimeout(700);
  await p.evaluate(z=>{document.querySelector('#builderInspectorDrawerClose')?.click();if(z==null)fitBuilderView();else{state.builderViewport.zoom=z;applyBuilderViewport()}},zoom);await p.waitForTimeout(500);
  results[label]={connectors:await p.evaluate(REF),zoom:+(await p.evaluate(()=>state.builderViewport.zoom)).toFixed(2),errors:p.errs};await shot(p,`edge-ref-${zoom==null?'fit':'100'}.png`);await p.close()}
}
console.log(JSON.stringify(results,null,1));await b.close()})();

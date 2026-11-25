// Item 10 (Build 232): selectors that raise the app's own HTML text under 11 px to 11 px, and nothing else, in the
// Builder's panels that show only when something is selected or a dialog, menu or panel is opened. Build 231's floor
// (explorer-review-text-floor.js) looked at each page as it opens, so these were never measured. Same method: for every
// text element under 11 px (not SVG text, not the Builder canvas's cards), a selector is formed from its tag and class
// and its nearest classed ancestor; it is kept only if every element it matches, in every state measured (all pages as
// they open, and the Builder states below), shown or not, is at most 11 px and outside SVGs and the canvas, so nothing
// already larger is made smaller. Where it also matches larger text, narrower ones are tried: with the page's own class
// in front, with the element's parent, or both. Kept selectors are grouped by what comes before their last part.
// Usage: node builder-sweep-text-floor.js <page.html> <out.css> <out.json>   (in the scratch work, tinyfix32.js)
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const fs=require('fs'),path=require('path');const FILE='file://'+path.resolve(process.argv[2]);
// The reference topology, beside this file in docs/mockups (or there, from the repository's root).
const REF=fs.readFileSync([path.join(__dirname,'ov1-reference-topology.json'),path.resolve('docs/mockups/ov1-reference-topology.json')].find(f=>fs.existsSync(f)),'utf8');
function collect(){const out={};const ok=e=>e.checkVisibility()&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.closest('svg')&&!e.closest('.builderCanvas');
 const cls=c=>/^[A-Za-z][\w-]*$/.test(c),first=el=>[...el.classList].find(cls),comp=el=>el.tagName.toLowerCase()+(first(el)?'.'+first(el):'');
 for(const e of document.querySelectorAll('body *')){if(!ok(e))continue;const fsz=parseFloat(getComputedStyle(e).fontSize);if(fsz>=10.95)continue;
  let a=e.parentElement;while(a&&a!==document.body&&!first(a))a=a.parentElement;if(!a||a===document.body)continue;
  const ac=first(a),s1=`.${ac} ${comp(e)}`;
  let pg=a.parentElement;while(pg&&pg!==document.body&&![...pg.classList].some(c=>cls(c)&&/\d$/.test(c)))pg=pg.parentElement;
  const pc=pg&&pg!==document.body?[...pg.classList].find(c=>cls(c)&&/\d$/.test(c)):null;
  const par=e.parentElement,withParent=par===a?`.${ac} > ${comp(e)}`:`.${ac} ${comp(par)} > ${comp(e)}`;
  const alts=[pc&&pc!==ac?`.${pc} ${s1}`:null,withParent,pc&&pc!==ac?`.${pc} ${withParent}`:null].filter(Boolean);
  const o=out[s1]=out[s1]||{px:[],els:[]};o.px.push(fsz);o.els.push(alts)}
 return out}
function validate(sels){const r={};for(const s of sels){let n=0,big=0;try{for(const e of document.querySelectorAll(s)){n++;if(e.closest('svg')||e.closest('.builderCanvas')||parseFloat(getComputedStyle(e).fontSize)>11.05)big++}}catch(x){big=-1}r[s]=[n,big]}return r}
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:900}});p.on('dialog',d=>d.dismiss().catch(()=>{}));
 const inject=()=>p.evaluate(`window.__collect=${collect};window.__validate=${validate}`);
 const fresh=async()=>{await p.goto(FILE,{timeout:30000});await p.waitForTimeout(1200);await inject()};await fresh();
 const pages=[];
 // The pages as they open, as Build 231's floor measured them, so a selector can't reach text those pages hold.
 for(const v of ['flow','matrix','config','builder','diagnostic','failure','changes'])pages.push(async()=>{await p.evaluate(v=>switchView(v),v);await p.waitForTimeout(350)});
 const tabs=await (async()=>{await p.evaluate(()=>switchView('ov'));await p.waitForTimeout(400);return p.evaluate(()=>[...document.querySelectorAll('.ovTabs135 [data-ov-tab]')].map(t=>t.dataset.ovTab))})();
 for(const t of tabs)pages.push(async()=>{await p.evaluate(()=>switchView('ov'));await p.evaluate(t=>document.querySelector(`.ovTabs135 [data-ov-tab="${t}"]`).click(),t);await p.waitForTimeout(250)});
 const nOps=await (async()=>{await p.evaluate(()=>switchView('operations'));await p.waitForTimeout(300);return p.evaluate(()=>document.querySelectorAll('.operationsNav button').length)})();
 for(let i=0;i<nOps;i++)pages.push(async()=>{await p.evaluate(()=>switchView('operations'));await p.evaluate(i=>document.querySelectorAll('.operationsNav button')[i].click(),i);await p.waitForTimeout(250)});
 pages.push(async()=>{await p.evaluate(()=>switchView('config'));await p.evaluate(()=>[...document.querySelectorAll('#configView205 button')].find(b=>/Try an example/.test(b.textContent))?.click());await p.waitForTimeout(900)});
 // The Builder's states, each from a fresh page: something selected, each Inspector tab, each menu, panel and dialog.
 const builder=async(ref)=>{await fresh();await p.evaluate(()=>switchView('builder'));await p.waitForTimeout(1300);if(ref){await p.evaluate(t=>loadTopologyDocument(JSON.parse(t)),REF);await p.waitForTimeout(900)}};
 const card=async i=>{const bb=await p.locator('.unifiedNodeWrap .builderNode').nth(i).boundingBox();if(bb){await p.mouse.click(bb.x+bb.width/2,bb.y+Math.min(60,bb.height/2));await p.waitForTimeout(500)}};
 const link=async i=>{const pt=await p.evaluate(i=>{const h=[...document.querySelectorAll('#builderTree path.unifiedConnectorHit')][i];if(!h)return null;const L=h.getTotalLength(),m=h.getPointAtLength(L*.3),c=h.getScreenCTM();return {x:m.x*c.a+m.y*c.c+c.e,y:m.x*c.b+m.y*c.d+c.f}},i);if(pt){await p.mouse.click(pt.x,pt.y);await p.waitForTimeout(500)}};
 const tab=async t=>{await p.click('#itab199-'+t).catch(()=>{});await p.waitForTimeout(300)};
 const menu=async(m,item)=>{await p.evaluate(n=>[...document.querySelectorAll('#topologyBuilder details > summary')].find(s=>s.checkVisibility()&&(s.innerText.trim()===n||s.getAttribute('aria-label')===n))?.click(),m);await p.waitForTimeout(300);
  if(item)await p.evaluate(([n,t])=>{const d=[...document.querySelectorAll('#topologyBuilder details[open]')].find(x=>{const s=x.querySelector(':scope>summary');return s.innerText.trim()===n||s.getAttribute('aria-label')===n});const b=d&&[...d.querySelectorAll('button')].find(b=>b.checkVisibility()&&!b.disabled&&b.innerText.replace(/\s+/g,' ').trim().startsWith(t));b?.click()},[m,item]);await p.waitForTimeout(700)};
 for(const [i,tabs2] of [[1,['component','connections','settings']],[3,['component','connections','settings']],[0,['component','connections','settings']]])for(const t of tabs2)pages.push(async()=>{await builder();await card(i);await tab(t)});
 for(const t of ['link','assurance','route'])pages.push(async()=>{await builder();await link(1);await tab(t)});
 for(const t of ['component','connections','settings','access'])pages.push(async()=>{await builder(true);await card(5);await tab(t)});
 for(const t of ['link','assurance','route'])pages.push(async()=>{await builder(true);await link(3);await tab(t)});
 pages.push(async()=>{await builder();await menu('File','Clear canvas')});
 pages.push(async()=>{await builder();await card(1);await tab('component');await p.click('#builderRemove').catch(()=>{});await p.waitForTimeout(600)});
 pages.push(async()=>{await builder();await menu('File','Export JSON')});
 pages.push(async()=>{await builder();await p.locator('.tbValidate198:visible').first().click().catch(()=>{});await p.waitForTimeout(700)});
 pages.push(async()=>{await builder();await p.locator('.tbAdd198:visible').first().click().catch(()=>{});await p.waitForTimeout(600)});
 pages.push(async()=>{await builder();await menu('File','Print / present')});
 for(const m of ['File','Edit','View','Arrange','Validate','Analyze','Help','Find and navigation options'])pages.push(async()=>{await builder();await menu(m)});
 for(const [m,it] of [['Analyze','Inventory'],['Analyze','Network'],['Analyze','Statistics'],['Validate','Coverage'],['Validate','Rules'],['Validate','Route validation'],['Edit','History'],['Edit','Connection template'],['Arrange','Containers'],['Arrange','Layout profiles'],['Help','About Builder']])
  pages.push(async()=>{await builder();await menu(m,it)});
 for(const it of ['Trace path','Configuration draft'])pages.push(async()=>{await builder();await card(1);await menu('Analyze',it)});
 pages.push(async()=>{await builder();const a=await p.locator('.unifiedNodeWrap .builderNode').nth(0).boundingBox(),c=await p.locator('.unifiedNodeWrap .builderNode').nth(1).boundingBox();await p.mouse.click(a.x+a.width/2,a.y+60);await p.keyboard.down('Shift');await p.mouse.click(c.x+c.width/2,c.y+60);await p.keyboard.up('Shift');await p.waitForTimeout(400);await menu('Edit','Bulk edit')});
 const run=async go=>{await go();if(!(await p.evaluate(()=>typeof window.__collect==='function')))await inject()};
 const cand={};for(const go of pages){await run(go);for(const [s,v] of Object.entries(await p.evaluate(()=>__collect()))){const c=cand[s]=cand[s]||{px:[],els:[]};c.px.push(...v.px);c.els.push(...v.els)}}
 const s1s=Object.keys(cand),alts=[...new Set(s1s.flatMap(s=>cand[s].els.flat()))].filter(a=>!cand[a]);const sels=[...s1s,...alts];const big={};
 for(const go of pages){await run(go);for(const [s,[n,b2]] of Object.entries(await p.evaluate(s=>__validate(s),sels))){const x=big[s]=big[s]||[0,0];x[0]+=n;if(b2<0)x[1]=1e9;else x[1]+=b2}}
 const ok=s=>big[s]&&big[s][1]===0,keep=new Map();let all=0,firstPass=0,secondPass=0;const left={};
 for(const s of s1s){const c=cand[s];all+=c.px.length;if(ok(s)){keep.set(s,(keep.get(s)||0)+c.px.length);firstPass+=c.px.length;continue}
  for(const el of c.els){const a=el.find(ok);if(a){keep.set(a,(keep.get(a)||0)+1);secondPass++}else left[s]=(left[s]||0)+1}}
 const groups=new Map();for(const s of keep.keys()){const m=s.match(/^(.*?)( > | )([^ >]+)$/);const k=m[1]+(m[2]===' > '?' >':'');(groups.get(k)||groups.set(k,[]).get(k)).push(m[3])}
 const rules=[...groups].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>` ${k} ${v.length>1?':is('+v.sort().join(',')+')':v[0]}{font-size:11px!important}`);
 fs.writeFileSync(process.argv[3],'/* 10. No text under 11 px on screen in the Builder\'s panels that show when something is selected or a dialog, menu\n   or panel opens. Generated by docs/mockups/builder-sweep-text-floor.js: each selector was checked on every page as it\n   opens and in each of those Builder states to match only text at or under 11 px, outside SVGs and the Builder\'s canvas,\n   so the floor only raises text. Important and for screens only, as Build 231\'s floor is. */\n@media screen{\n'+rules.join('\n')+'\n}\n');
 fs.writeFileSync(process.argv[4],JSON.stringify({states:pages.length,all,firstPass,secondPass,left,rules:rules.length,keep:[...keep]},null,1));
 console.log(`states ${pages.length} | text elements under 11 px (counted in each state they show in): ${all} | covered by plain selectors ${firstPass}, by narrower ones ${secondPass} | left ${all-firstPass-secondPass} | selectors ${keep.size} in ${rules.length} rules`);
 console.log('left:',JSON.stringify(Object.entries(left).sort((a,b)=>b[1]-a[1])));
 await b.close()})();

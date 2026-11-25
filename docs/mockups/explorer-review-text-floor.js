// Item 22: selectors that raise the app's own HTML text under 11 px to 11 px, and nothing else. For every text element
// under 11 px on every page (not SVG text, not the Builder canvas's cards), a selector is formed from its tag and class
// and its nearest classed ancestor. A selector is kept only if every element it matches, on every page, shown or not, is
// at most 11 px and outside SVGs and the Builder's canvas, so nothing already larger is made smaller. Where that
// selector also matches larger text, narrower ones are tried: with the page's own class in front, with the element's
// parent, or both. The kept selectors are grouped by what comes before their last part, as :is() lists.
// Usage: node explorer-review-text-floor.js <page.html> <out.css> <out.json>   (in the scratch work, tinyfix31.js)
const {chromium}=require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const fs=require('fs'),path=require('path');const FILE='file://'+path.resolve(process.argv[2]);
function collect(){const out={};const ok=e=>e.checkVisibility()&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.closest('svg')&&!e.closest('.builderCanvas');
 const cls=c=>/^[A-Za-z][\w-]*$/.test(c),first=el=>[...el.classList].find(cls),comp=el=>el.tagName.toLowerCase()+(first(el)?'.'+first(el):'');
 for(const e of document.querySelectorAll('body *')){if(!ok(e))continue;const fsz=parseFloat(getComputedStyle(e).fontSize);if(fsz>=10.95)continue;
  let a=e.parentElement;while(a&&a!==document.body&&!first(a))a=a.parentElement;if(!a||a===document.body)continue;
  const ac=first(a),s1=`.${ac} ${comp(e)}`;
  // The page's own class: the nearest ancestor above the classed one whose class ends in a number (svcv6Page172 and the like).
  let pg=a.parentElement;while(pg&&pg!==document.body&&![...pg.classList].some(c=>cls(c)&&/\d$/.test(c)))pg=pg.parentElement;
  const pc=pg&&pg!==document.body?[...pg.classList].find(c=>cls(c)&&/\d$/.test(c)):null;
  const par=e.parentElement,withParent=par===a?`.${ac} > ${comp(e)}`:`.${ac} ${comp(par)} > ${comp(e)}`;
  const alts=[pc&&pc!==ac?`.${pc} ${s1}`:null,withParent,pc&&pc!==ac?`.${pc} ${withParent}`:null].filter(Boolean);
  const o=out[s1]=out[s1]||{px:[],els:[]};o.px.push(fsz);o.els.push(alts)}
 return out}
// Every element the selector matches counts, shown or not and with text or not (a container's size passes to what it
// holds): one over 11 px, or one in an SVG or on the Builder's canvas, rules the selector out.
function validate(sels){const r={};for(const s of sels){let n=0,big=0;try{for(const e of document.querySelectorAll(s)){n++;if(e.closest('svg')||e.closest('.builderCanvas')||parseFloat(getComputedStyle(e).fontSize)>11.05)big++}}catch(x){big=-1}r[s]=[n,big]}return r}
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:900}});await p.goto(FILE,{timeout:30000});await p.waitForTimeout(1800);
 await p.evaluate(`window.__collect=${collect};window.__validate=${validate}`);
 const pages=[];for(const v of ['flow','matrix','config','builder','diagnostic','failure','changes'])pages.push(async()=>{await p.evaluate(v=>switchView(v),v);await p.waitForTimeout(350)});
 const tabs=await (async()=>{await p.evaluate(()=>switchView('ov'));await p.waitForTimeout(400);return p.evaluate(()=>[...document.querySelectorAll('.ovTabs135 [data-ov-tab]')].map(t=>t.dataset.ovTab))})();
 for(const t of tabs)pages.push(async()=>{await p.evaluate(()=>switchView('ov'));await p.evaluate(t=>document.querySelector(`.ovTabs135 [data-ov-tab="${t}"]`).click(),t);await p.waitForTimeout(250)});
 const nOps=await (async()=>{await p.evaluate(()=>switchView('operations'));await p.waitForTimeout(300);return p.evaluate(()=>document.querySelectorAll('.operationsNav button').length)})();
 for(let i=0;i<nOps;i++)pages.push(async()=>{await p.evaluate(()=>switchView('operations'));await p.evaluate(i=>document.querySelectorAll('.operationsNav button')[i].click(),i);await p.waitForTimeout(250)});
 // The Config view with the example read, too: its panels carry most of its small text.
 pages.push(async()=>{await p.evaluate(()=>switchView('config'));await p.evaluate(()=>[...document.querySelectorAll('#configView205 button')].find(b=>/Try an example/.test(b.textContent))?.click());await p.waitForTimeout(900)});
 const cand={};for(const go of pages){await go();for(const [s,v] of Object.entries(await p.evaluate(()=>__collect()))){const c=cand[s]=cand[s]||{px:[],els:[]};c.px.push(...v.px);c.els.push(...v.els)}}
 const s1s=Object.keys(cand),alts=[...new Set(s1s.flatMap(s=>cand[s].els.flat()))].filter(a=>!cand[a]);const sels=[...s1s,...alts];const big={};
 for(const go of pages){await go();for(const [s,[n,b2]] of Object.entries(await p.evaluate(s=>__validate(s),sels))){const x=big[s]=big[s]||[0,0];x[0]+=n;if(b2<0)x[1]=1e9;else x[1]+=b2}}
 const ok=s=>big[s]&&big[s][1]===0,keep=new Map();let all=0,firstPass=0,secondPass=0;const left={};
 for(const s of s1s){const c=cand[s];all+=c.px.length;if(ok(s)){keep.set(s,(keep.get(s)||0)+c.px.length);firstPass+=c.px.length;continue}
  for(const el of c.els){const a=el.find(ok);if(a){keep.set(a,(keep.get(a)||0)+1);secondPass++}else left[s]=(left[s]||0)+1}}
 // Group by everything before the last compound, keeping its combinator.
 const groups=new Map();for(const s of keep.keys()){const m=s.match(/^(.*?)( > | )([^ >]+)$/);const k=m[1]+(m[2]===' > '?' >':'');(groups.get(k)||groups.set(k,[]).get(k)).push(m[3])}
 const rules=[...groups].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>` ${k} ${v.length>1?':is('+v.sort().join(',')+')':v[0]}{font-size:11px!important}`);
 // Important, because the page's own rules for the same text are often more specific (.avPage189 .fact .k); for screens
 // only, so a print rule that sets a larger size in points still wins on paper.
 fs.writeFileSync(process.argv[3],'/* 22. No text under 11 px on screen in the app\'s own panels. Generated by\n   docs/mockups/explorer-review-text-floor.js: each selector was checked on every page to match only text at or under\n   11 px, outside SVGs and the Builder\'s canvas, so the floor only raises text. Important, because the page\'s own rules\n   for the same text are often more specific; screens only, so print keeps its own sizes. */\n@media screen{\n'+rules.join('\n')+'\n}\n');
 fs.writeFileSync(process.argv[4],JSON.stringify({all,firstPass,secondPass,left,rules:rules.length,keep:[...keep]},null,1));
 console.log(`text elements under 11 px (counted on each page they show on): ${all} | covered by plain selectors ${firstPass}, by narrower ones ${secondPass} | left ${all-firstPass-secondPass} | selectors ${keep.size} in ${rules.length} rules`);
 console.log('left:',JSON.stringify(Object.entries(left).sort((a,b)=>b[1]-a[1])));
 await b.close()})();

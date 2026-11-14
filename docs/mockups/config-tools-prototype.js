(function(){
/* Build 224: three tools for the Config view.
   - Try an event. Paste one, or pick one from a package's samples folder, and say what it arrives as: the source type
     map lights up the path it takes, the index-time transforms that match it and the source type it becomes, then the
     search-time extractions that hit, with the fields each gives.
   - Search-time precedence by app. A search runs in an app, and Splunk ranks search-time settings for it: that app's
     own first, then the other apps', Z to A, but only those their metadata exports, then etc/system's. Index-time
     settings keep the global order. Packages and folders give each app's metadata/default.meta and local.meta.
   - Copy or export. A source type's settings as Splunk merges them, as .conf text to copy or save, and its map as an
     image. */
const cv=window.configView205,pm=state.configView205;if(!cv||!pm)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const and=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a.at(-1):a[0]||'';
const plural=(n,one,many)=>`${n.toLocaleString('en-US')} ${n===1?one:many||one+'s'}`;
const ascii=(a,b)=>a<b?-1:a>b?1:0;
const truthy=v=>/^(1|t|true|y|yes)$/i.test(String(v??'').trim());
const fileOf=r=>pm.files.find(f=>f.id===r?.fid);
const label=f=>f?.path&&f.path.includes('/')?f.path:f?.name||'';
const at=r=>`${label(fileOf(r))} line ${r.n}`;
const classOf=k=>{const i=k.indexOf('-');return i>0?k.slice(0,i+1):null};
const SEARCH_STAGES=new Set(stages.filter(s=>['Source type renaming','Inline field extraction','Transform field extraction','Automatic key-value extraction','Field aliasing','Calculated fields','Lookups','Event typing','Tagging','Search-time segmentation'].includes(s.name)).map(s=>s.id));
const root=()=>document.getElementById('configTypeMap217');

// ---- files the three tools read: each app's metadata and samples ----
// Folders Splunk doesn't merge with the instance's own: each user's, and those it sends to other instances.
const held=path=>{const p=path.replace(/\\/g,'/').split('/').filter(Boolean),i=p.lastIndexOf('etc');return p.at(-5)==='users'||i>=0&&['deployment-apps','manager-apps','master-apps','shcluster'].includes(p[i+1])};
const parts=path=>path.replace(/\\/g,'/').split('/').filter(Boolean);
// An app's metadata: <app>/metadata/default.meta or local.meta. A sample: a file in <app>/samples.
const isMeta=path=>{const p=parts(path);return p.length>=3&&p.at(-2).toLowerCase()==='metadata'&&/^(default|local)\.meta$/i.test(p.at(-1))};
const isSample=path=>{const p=parts(path);return p.length>=3&&p.at(-2).toLowerCase()==='samples'&&!p.at(-1).startsWith('.')};
const takes=path=>!held(path)&&(isMeta(path)||isSample(path));
async function add(file,path){if(file.size>1e6)return`${path} is over 1 MB`;let text;try{text=await file.text()}catch(e){return`${path}: it can’t be read`}
 if(text.includes('\u0000'))return`${file.name} isn’t a text file`;return put(path,text)}
function put(path,text){const p=parts(path),app=p.at(-3);
 if(isMeta(path)){if(!A.meta.has(app))A.meta.set(app,{});A.meta.get(app)[p.at(-1).toLowerCase().replace('.meta','')]=parseMeta(text);A.version++;return null}
 const events=text.split(/\r\n|\r|\n/).filter(l=>l.trim());if(!events.length)return`${p.at(-1)} has no event`;
 E.samples.set(path,{path,app,name:p.at(-1),events});return null}

// ---- 10. search-time precedence by app ----
const A={app:null,meta:new Map(),hidden:new Map(),version:0};
// A .meta file: [<kind>/<object>], [<kind>] and [] stanzas, with their settings. Object names are URL-encoded.
function parseMeta(text){const out=new Map();let cur=null;
 for(const raw of text.split(/\r\n|\r|\n/)){const l=raw.trim();if(!l||l.startsWith('#'))continue;
  const h=/^\[(.*)\]$/.exec(l);if(h){let n=h[1].trim();try{n=decodeURIComponent(n)}catch(e){}cur=new Map();out.set(n,cur);continue}
  const kv=/^([^=]+?)\s*=\s*(.*)$/.exec(l);if(kv&&cur)cur.set(kv[1].trim().toLowerCase(),kv[2].trim())}
 return out}
// Whether an app shares a setting with other apps: its most specific stanza that says, local.meta's before
// default.meta's. A props.conf setting can have a stanza of its own, [props/<stanza>/<setting>], as Splunk Web writes
// for an extraction it makes. With nothing said, Splunk keeps an app's settings to that app.
function exported(app,kind,stanza,key){const m=A.meta.get(app);if(!m)return {shared:false,why:'none'};
 for(const lv of [...(key?[`${kind}/${stanza}/${key}`]:[]),`${kind}/${stanza}`,kind,''])for(const which of ['local','default']){const v=m[which]?.get(lv)?.get('export');if(v!==undefined)return {shared:/^system$/i.test(v),why:which,stanza:lv}}
 return {shared:false,why:'silent'}}
const appOf=f=>f?.place?.app||null,layerOf=f=>f?.place?.layer||'app-local';
// Where a file stands for a search in app X: X's own files, local before default; then the other apps', Z to A, each
// local before default; then etc/system's, local before default. A file with no app comes after the named apps.
function rank(f,X){const l=layerOf(f),local=/local$/.test(l)?0:1;if(l.startsWith('system'))return [2,'',local];if(appOf(f)===X)return [0,'',local];return [1,appOf(f)??'',local]}
const byApp=X=>(a,b)=>{const x=rank(a,X),y=rank(b,X);return x[0]-y[0]||(x[0]===1?-ascii(x[1],y[1]):0)||x[2]-y[2]||b.seq-a.seq};
function visible(f,kind,stanza,X,key){const app=appOf(f);if(layerOf(f).startsWith('system')||!app||app===X)return {shared:true};return exported(app,kind,stanza,key)}
// A props.conf setting read only at search time; a transforms.conf stanza only REPORT- and LOOKUP- lines name.
function isSearchKey(k){const ids=cv.propsStages.get(k)||cv.propsStages.get(classOf(k))||(k==='rename'?cv.propsStages.get('rename'):null);return !!ids?.length&&ids.every(id=>SEARCH_STAGES.has(id))}
function transformUses(){const uses=new Map();
 for(const f of pm.groups.props||[])for(const r of f.doc.settings){if(r.invalid)continue;const m=/^(TRANSFORMS|RULESET|REPORT|LOOKUP)[-_]?/i.exec(r.key);if(!m)continue;
  const names=/^LOOKUP/i.test(m[1])?[r.value.trim().split(/\s+/)[0]]:r.value.split(',').map(s=>s.trim()).filter(Boolean);
  for(const n of names){if(!uses.has(n))uses.set(n,new Set());uses.get(n).add(/^(REPORT|LOOKUP)/i.test(m[1])?'search':'index')}}
 return uses}
// Run once the Config view has merged each kind's files in the global order, before anything reads the result: each
// search-time setting is decided again for a search in the chosen app.
function remerge(merged){A.hidden=new Map();if(!A.app)return;const X=A.app,uses=transformUses();
 const isSearch={props:k=>isSearchKey(k),transforms:(k,s)=>{const u=uses.get(s);return !!u&&!u.has('index')},eventtypes:()=>true,tags:()=>true};
 for(const t of Object.keys(isSearch)){const m=merged[t];if(!m)continue;const files=[...(pm.groups[t]||[])].sort(byApp(X)),by=new Map();
  for(const f of files)for(const r of f.doc.settings){if(r.invalid||!isSearch[t](r.key,r.stanza.name))continue;const id=r.stanza.name+'\u0000'+r.key;if(!by.has(id))by.set(id,[]);by.get(id).push(r)}
  for(const [id,rs] of by){const [s,k]=id.split('\u0000'),last=new Map();for(const r of rs)last.set(r.fid,r);
   const order=files.filter(f=>last.has(f.id)),seen=order.map(f=>({f,v:visible(f,t,s,X,t==='props'?k:null)})),shown=seen.filter(x=>x.v.shared),win=shown.length?last.get(shown[0].f.id):null;
   for(const r of rs){const x=seen.find(y=>y.f.id===r.fid);if(!x.v.shared){r.overriddenBy=null;r.overrides=[];A.hidden.set(r,{app:appOf(x.f),kind:t,v:x.v})}else{r.overriddenBy=r===win?null:win;if(r!==win)r.overrides=[]}}
   if(win)win.overrides=shown.slice(1).map(x=>last.get(x.f.id)).filter(r=>r.fid!==win.fid);
   const keys=m.get(s);if(keys){if(win)keys.set(k,win);else keys.delete(k)}}}}
// After the lines have their notes: a line from an app that doesn't share it with the chosen one has no effect there.
function mark(){for(const [r,h] of A.hidden){if(!r.m)continue;
 const st=h.v.stanza??'',name=r.stanza?.name,what=st===''?'all its settings':st===h.kind?`its ${st}.conf settings`:st===`${h.kind}/${name}`?`[${name}]`:`[${name}] ${r.key}`;
 const why=h.v.why==='none'?`${h.app} has no metadata in these files, and Splunk shares an app’s settings only where its metadata exports them`:h.v.why==='silent'?`${h.app}’s metadata doesn’t export its settings`:`${h.app}’s metadata/${h.v.why}.meta keeps ${what} to the app ([${st}] export = none)`;
 r.m={...r.m,unused:true,note:[`Not shared with ${A.app}: ${why}, so a search in ${A.app} doesn’t see this line.`,r.m.note].filter(Boolean).join(' ')}}}
// The apps a search can run in: search, and every app the files name.
const apps=()=>['search',...[...new Set(pm.files.map(appOf).filter(a=>a&&a!=='search'))].sort(ascii)];
function appNote(){if(!A.app)return'';const named=pm.files.map(appOf).filter((a,i,l)=>a&&a!==A.app&&l.indexOf(a)===i).sort((a,b)=>-ascii(a,b));
 const share=named.map(a=>{const e=exported(a,'props','');return e.why==='none'?`${a} has no metadata here, so it shares nothing`:e.shared?`${a} exports its settings`:`${a} keeps its settings to itself`});
 const own=pm.files.some(f=>appOf(f)===A.app);
 return`<p class="appNote224">Search-time settings are ranked for a search in <b>${esc(A.app)}</b>${own?': its own first, then ':', which has none in these files: '}${named.length?`the other apps’ exported settings, Z to A (${esc(and(named))}), `:''}then etc/system’s. Index-time settings keep the global order.${share.length?` ${esc(share.join('; '))}.`:''}${A.hidden.size?` ${esc(plural(A.hidden.size,'line'))} not shared with ${esc(A.app)} ${A.hidden.size===1?'has':'have'} no effect.`:''}</p>`}
function appPicker(){const list=apps();return`<label class="appPick224">Search-time order <select data-search-app><option value=""${A.app?'':' selected'}>Global, as at index time</option>${list.map(a=>`<option value="${esc(a)}"${A.app===a?' selected':''}>A search in ${esc(a)}</option>`).join('')}</select></label>`}

// ---- 11. copy or export ----
// A source type's settings as Splunk merges them: its props.conf stanza, the transforms.conf stanzas its lines name, and
// the inputs.conf stanzas that give it its name. Each stanza's winning lines under the file they come from, the files in
// the order the screen lists them (highest precedence first), each file's lines in its own order. A .conf file can't
// hold a comment after a value, so each file has a comment line of its own.
function settingsText(T){const out=[],m=pm.merged||{},place=f=>(pm.groups[f?.kind]||[]).indexOf(f),section=(kind,names)=>{const blocks=[];
  for(const name of names){const keys=m[kind]?.get(name);if(!keys||!keys.size)continue;const lines=[...keys.values()].filter(r=>r&&!r.invalid).sort((a,b)=>place(fileOf(a))-place(fileOf(b))||a.n-b.n);
   let cur=null;const body=[`[${name}]`];for(const r of lines){const f=label(fileOf(r));if(f!==cur){body.push(`# ${f}`);cur=f}body.push(`${r.key} = ${r.value}`)}blocks.push(body.join('\n'))}
  if(blocks.length)out.push(`# ${kind}.conf\n${blocks.join('\n\n')}`)};
 const P=m.props?.get(T),refs=new Set();
 if(P)for(const r of P.values())if(/^(TRANSFORMS|REPORT|LOOKUP)/i.test(r.key))(/^LOOKUP/i.test(r.key)?[r.value.trim().split(/\s+/)[0]]:r.value.split(',').map(s=>s.trim())).filter(Boolean).forEach(n=>refs.add(n));
 const inputs=[...(m.inputs||new Map())].filter(([,keys])=>keys.get('sourcetype')?.value.trim()===T).map(([n])=>n);
 section('inputs',inputs);section('props',[T]);section('transforms',[...refs]);
 const head=`# ${T}: its settings as Splunk merges them, from Splunk Pipeline Explorer.\n# ${A.app?`Search-time settings as ranked for a search in ${A.app}.`:'Every setting in the global order.'} Overridden lines are left out.`;
 return`${head}\n\n${out.join('\n\n')}\n`}
async function copyText(text,button){try{await navigator.clipboard.writeText(text);flash(button,'Copied')}catch(e){showText(text)}}
function showText(text){const r=root();if(!r)return;let box=r.querySelector('.tmText224');if(!box){r.querySelector('.tmTools224')?.insertAdjacentHTML('afterend','<div class="tmText224"><p>The browser didn’t allow copying: select the text and copy it.</p><textarea readonly rows="10" aria-label="The settings as text"></textarea></div>');box=r.querySelector('.tmText224')}
 const ta=box.querySelector('textarea');ta.value=text;ta.focus();ta.select()}
const flash=(b,t)=>{if(!b)return;const was=b.textContent;b.textContent=t;setTimeout(()=>{b.textContent=was},1600)};
// The map as an image, in plain SVG: a rectangle for each box with a background or a border, a line of text for each
// line of each text, and the map's own lines, each where and as the page draws it. With no HTML inside, browsers draw it
// into a PNG, and drawing programs open it. Its title, summary and columns; not the source type list or these tools.
function mapSvg(){const r=root();if(!r||!r.querySelector('.tmGrid217'))return null;
 const hide=[...r.querySelectorAll('.tmTypes217,.tmTools224,.tmTry224,.tmText224,.tmLinesSay217')],was=hide.map(e=>e.style.display),scroll=r.querySelector('.tmScroll217'),sw=scroll?.style.overflow;
 hide.forEach(e=>e.style.display='none');if(scroll)scroll.style.overflow='visible';
 try{const box=r.getBoundingClientRect(),ox=box.left,oy=box.top,W=Math.ceil(Math.max(r.scrollWidth,scroll?.scrollWidth||0)),H=Math.ceil(box.height),out=[];
  const n=v=>Math.round(v*10)/10,col=c=>{const m=/rgba?\(([^)]+)\)/.exec(c||'');if(!m)return null;const [R,G,B,A=1]=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return A>0?{c:`rgb(${R},${G},${B})`,a:A}:null};
  const op=new Map(),opacity=el=>{if(!el||el===r.parentElement)return 1;if(op.has(el))return op.get(el);const v=(+getComputedStyle(el).opacity||1)*opacity(el.parentElement);op.set(el,v);return v};
  const clipOf=el=>{for(let e=el;e&&e!==r;e=e.parentElement){const s=getComputedStyle(e);if(/hidden|clip/.test(s.overflowX+s.overflowY)&&e!==scroll)return e.getBoundingClientRect()}return null};
  const att=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const bg=col(getComputedStyle(r).backgroundColor)||col(getComputedStyle(document.body).backgroundColor)||{c:'rgb(11,22,32)',a:1};
  out.push(`<rect width="${W}" height="${H}" fill="${bg.c}"/>`);
  for(const el of r.querySelectorAll('*')){if(el.closest('svg')||!el.checkVisibility())continue;const s=getComputedStyle(el),b=el.getBoundingClientRect();if(!b.width||!b.height)continue;
   const x=n(b.left-ox),y=n(b.top-oy),w=n(b.width),h=n(b.height),rad=n(parseFloat(s.borderTopLeftRadius)||0),o=opacity(el),fill=col(s.backgroundColor);
   if(fill)out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${fill.c}" fill-opacity="${n(fill.a*o)}"/>`);
   const sides=['Top','Right','Bottom','Left'].map(k=>({k,w:parseFloat(s[`border${k}Width`])||0,c:col(s[`border${k}Color`]),st:s[`border${k}Style`]})).filter(x=>x.w&&x.c&&x.st!=='none');
   if(sides.length===4&&sides.every(x=>x.w===sides[0].w&&x.c.c===sides[0].c.c))out.push(`<rect x="${n(x+sides[0].w/2)}" y="${n(y+sides[0].w/2)}" width="${n(w-sides[0].w)}" height="${n(h-sides[0].w)}" rx="${rad}" fill="none" stroke="${sides[0].c.c}" stroke-opacity="${n(sides[0].c.a*o)}" stroke-width="${sides[0].w}"${sides[0].st==='dashed'?' stroke-dasharray="4 3"':''}/>`);
   else for(const d of sides){const [rx,ry,rw,rh]=d.k==='Top'?[x,y,w,d.w]:d.k==='Bottom'?[x,y+h-d.w,w,d.w]:d.k==='Left'?[x,y,d.w,h]:[x+w-d.w,y,d.w,h];out.push(`<rect x="${n(rx)}" y="${n(ry)}" width="${n(rw)}" height="${n(rh)}" fill="${d.c.c}" fill-opacity="${n(d.c.a*o)}"/>`)}
   const ol=parseFloat(s.outlineWidth)||0,oc=col(s.outlineColor);if(ol&&oc&&s.outlineStyle!=='none'){const off=parseFloat(s.outlineOffset)||0;out.push(`<rect x="${n(x-off-ol/2)}" y="${n(y-off-ol/2)}" width="${n(w+2*off+ol)}" height="${n(h+2*off+ol)}" rx="${rad+off}" fill="none" stroke="${oc.c}" stroke-width="${ol}"/>`)}}
  // Text, line by line as the page breaks it: each character's box gives its line.
  const walk=document.createTreeWalker(r,NodeFilter.SHOW_TEXT),range=document.createRange();
  for(let t=walk.nextNode();t;t=walk.nextNode()){const el=t.parentElement;if(!el||el.closest('svg')||!el.checkVisibility()||!t.data.trim())continue;
   const s=getComputedStyle(el),clip=clipOf(el),o=opacity(el),fc=col(s.color);if(!fc)continue;let line=null;const lines=[];
   for(let i=0;i<t.data.length;i++){range.setStart(t,i);range.setEnd(t,i+1);const q=range.getBoundingClientRect();if(!q.width)continue;if(clip&&(q.right>clip.right+1||q.left<clip.left-1||q.bottom>clip.bottom+1||q.top<clip.top-1))continue;
    const ch=t.data[i];if(!line||Math.abs(q.top-line.top)>2){line={top:q.top,bottom:q.bottom,left:q.left,text:''};lines.push(line)}line.text+=/\s/.test(ch)?' ':ch}
   const tt=s.textTransform==='uppercase'?v=>v.toUpperCase():v=>v,fs=parseFloat(s.fontSize)||12;
   for(const l of lines){const v=tt(l.text.replace(/\s+/g,' ')).trimEnd();if(!v.trim())continue;
    out.push(`<text x="${n(l.left-ox)}" y="${n((l.top+l.bottom)/2-oy+fs*.35)}" fill="${fc.c}" fill-opacity="${n(fc.a*o)}" font-family="${att(s.fontFamily)}" font-size="${fs}" font-weight="${s.fontWeight}"${s.fontStyle==='italic'?' font-style="italic"':''}${parseFloat(s.letterSpacing)?` letter-spacing="${parseFloat(s.letterSpacing)}"`:''} xml:space="preserve">${att(v).replace(/>/g,'&gt;')}</text>`)}}
  // The map's own lines, with the colours and markers the page's styles give them.
  for(const svg of r.querySelectorAll('svg')){if(!svg.checkVisibility())continue;const sb=svg.getBoundingClientRect(),c=svg.cloneNode(true),src=[svg,...svg.querySelectorAll('*')],dst=[c,...c.querySelectorAll('*')];
   src.forEach((e,i)=>{const s=getComputedStyle(e),d=dst[i];for(const p of ['stroke','stroke-width','stroke-dasharray','fill','opacity','stroke-linecap','stroke-linejoin','marker-end','marker-start','color'])d.style.setProperty(p,s.getPropertyValue(p))});
   c.removeAttribute('class');c.setAttribute('x',n(sb.left-ox));c.setAttribute('y',n(sb.top-oy));c.setAttribute('width',n(sb.width));c.setAttribute('height',n(sb.height));c.setAttribute('overflow','visible');out.push(new XMLSerializer().serializeToString(c))}
  return {w:W,h:H,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`}}
 finally{hide.forEach((e,i)=>{e.style.display=was[i]});if(scroll)scroll.style.overflow=sw}}
async function saveImage(T,button){const s=mapSvg();if(!s)return;const name=`${T.replace(/[^\w.-]+/g,'_')}-map`;
 try{const img=new Image(),url=URL.createObjectURL(new Blob([s.svg],{type:'image/svg+xml'}));
  await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(Error('The browser couldn’t draw the map'));img.src=url});
  const c=document.createElement('canvas');c.width=s.w*2;c.height=s.h*2;const g=c.getContext('2d');g.scale(2,2);g.drawImage(img,0,0);URL.revokeObjectURL(url);
  const png=await new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(Error('no PNG')),'image/png'));
  const a=document.createElement('a');a.href=URL.createObjectURL(png);a.download=name+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),0);flash(button,'Saved')}
 catch(e){downloadText(name+'.svg',s.svg,'image/svg+xml');flash(button,'Saved as SVG')}}

// ---- 8. try an event ----
const E={samples:new Map(),text:'',from:null,open:false,result:null,sample:null};
// A PCRE expression, as Splunk writes them, in JavaScript's dialect. (?P<n>…) and (?'n'…) become (?<n>…), \A becomes ^
// and \Z or \z $, \h a space or tab; atomic groups and possessive quantifiers become ordinary ones, which match the same
// text in nearly every use; a leading (?i), (?s) or (?m) becomes a flag. What JavaScript can't say is reported.
function jsRegex(src){let s=String(src),flags='';const lead=/^\(\?([ims]+)\)/.exec(s);if(lead){s=s.slice(lead[0].length);flags=[...new Set(lead[1])].join('')}
 let out='',i=0,cls=false,quant=false;
 while(i<s.length){const c=s[i];
  if(c==='\\'){const n=s[i+1]??'';quant=false;
   if(!cls&&n==='A'){out+='^';i+=2;continue}if(!cls&&(n==='Z'||n==='z')){out+='$';i+=2;continue}
   if(n==='h'){out+=cls?' \\t':'[ \\t]';i+=2;continue}
   if('QEGKXR'.includes(n)&&n)return {bad:`\\${n}, which JavaScript has no equivalent for`};
   out+=c+n;i+=2;continue}
  if(cls){if(c===']')cls=false;out+=c;i++;continue}
  if(c==='['){cls=true;quant=false;out+=c;i++;if(s[i]==='^'){out+='^';i++}if(s[i]===']'){out+='\\]';i++}continue}
  if(c==='('&&s[i+1]==='?'){quant=false;const r=s.slice(i);
   if(r.startsWith('(?P<')){out+='(?<';i+=4;continue}
   if(r.startsWith('(?P=')){const j=s.indexOf(')',i);out+=`\\k<${s.slice(i+4,j)}>`;i=j+1;continue}
   if(r.startsWith("(?'")){const j=s.indexOf("'",i+3);out+=`(?<${s.slice(i+3,j)}>`;i=j+1;continue}
   if(r.startsWith('(?>')){out+='(?:';i+=3;continue}
   if(/^\(\?[imsxJU-]+[:)]/.test(r))return {bad:'flags set inside the expression'};
   if(/^\(\?(\(|R|\d|&|\+|\|)/.test(r))return {bad:'a PCRE construct JavaScript has no equivalent for'};}
  if(c==='+'&&quant){quant=false;i++;continue}
  quant=c==='*'||c==='+'||c==='?'||c==='}';out+=c;i++}
 try{return {re:new RegExp(out,flags)}}catch(e){return {bad:e.message.replace(/^Invalid regular expression: /,'')}}}
// transforms.conf DELIMS: one or two quoted lists of characters, each character escaped or not.
function delims(v){const lists=[...String(v).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m=>[...m[1].replace(/\\(.)/g,'$1')]);return lists}
const cleanKey=k=>k.replace(/[^A-Za-z0-9_]/g,'_').replace(/^[_\d]+/,'');
// Key-value pairs split by delimiters: a pair delimiter inside double quotes doesn't split, and the quotes come off.
function kvByDelims(text,pairs,kv){const out=[];let cur='',q=false;const flush=()=>{if(cur){const i=[...cur].findIndex(ch=>kv.includes(ch));if(i>0){const k=cleanKey(cur.slice(0,i).trim()),v=cur.slice(i+1).trim().replace(/^"([\s\S]*)"$/,'$1');if(k)out.push([k,v])}}cur=''};
 for(const ch of text){if(ch==='"'){q=!q;cur+=ch;continue}if(!q&&pairs.includes(ch)){flush();continue}cur+=ch}flush();return out}
// Splunk's automatic key-value extraction, near enough: key=value, with a quoted value taken whole.
function autoKv(text){const out=[];for(const m of text.matchAll(/(?:^|[\s,;])([A-Za-z_][\w.-]*)=("((?:[^"\\]|\\.)*)"|'([^']*)'|([^\s,;"]*))/g)){const k=cleanKey(m[1]);if(k)out.push([k,m[3]??m[4]??m[5]??''])}return out}
function groups(m){const out=[];if(!m?.groups)return out;const g=m.groups;
 for(const [n,v] of Object.entries(g)){if(v===undefined)continue;const key=/^_KEY_(\w+)$/.exec(n);if(key){const val=g['_VAL_'+key[1]];if(val!==undefined&&v)out.push([cleanKey(v),val]);continue}if(/^_VAL_/.test(n))continue;out.push([n,v])}return out}
// $1 … $n and $0 in a FORMAT, from a match.
const fill=(fmt,m)=>String(fmt).replace(/\$(\d+)/g,(_,n)=>m[+n]??'');
// The index-time and search-time settings of a props.conf stanza, as merged: its winning lines.
const stanza=name=>pm.merged?.props?.get(name)||new Map();
// A class's lines for a source type: [default]'s, with the source type's own in place of any of the same name, in ASCII
// order of their names, as Splunk runs them.
const winners=(name,re)=>{const by=new Map();for(const st of name==='default'?['default']:['default',name])for(const r of stanza(st).values())if(r&&!r.invalid&&re.test(r.key))by.set(r.key,r);return [...by.values()].sort((a,b)=>ascii(a.key,b.key))};
const tx=name=>pm.merged?.transforms?.get(name)||null;
const val=(keys,k)=>keys?.get(k)?.value?.trim();
const namesOf=r=>r.value.split(',').map(s=>s.trim()).filter(Boolean);
// What happens to one event: the index-time transforms its source type runs, which can give it another source type,
// host, source or index, rewrite it or drop it; then, for the source type it ends with (or the one a rename gives it at
// search time), the extractions in Splunk's order: inline (EXTRACT-), transforms (REPORT-), automatic key-value
// (KV_MODE), then field aliases. Calculated fields and lookups are listed, not computed.
function tryEvent(raw,T){const steps=[],fields=new Map(),meta={sourcetype:T,host:null,source:null,index:null},qs=[];let text=raw,queue='indexQueue';
 const setField=(k,v,r)=>{if(!fields.has(k))fields.set(k,{value:v,r})};
 // Index time. Every transform runs, in order, whatever an earlier one did: one can send the event to nullQueue and a
 // later one send it back to indexQueue. Where it is at the end decides.
 for(const r of winners(T,/^TRANSFORMS-/i))for(const name of namesOf(r)){const keys=tx(name);
  if(!keys){steps.push({at:'index',r,name,state:'missing',say:`[${name}] isn’t in transforms.conf`});continue}
  if(val(keys,'INGEST_EVAL')||val(keys,'CLONE_SOURCETYPE')){steps.push({at:'index',r,name,state:'skip',say:`[${name}] ${val(keys,'INGEST_EVAL')?'evaluates INGEST_EVAL':'clones events'}, which isn’t tried here`});continue}
  const sk=val(keys,'SOURCE_KEY')||'_raw',input=sk==='_raw'?text:sk==='MetaData:Sourcetype'?`sourcetype::${meta.sourcetype}`:sk==='MetaData:Host'?(meta.host?`host::${meta.host}`:null):sk==='MetaData:Source'?(meta.source?`source::${meta.source}`:null):sk==='_MetaData:Index'?meta.index:null;
  if(input===null){steps.push({at:'index',r,name,state:'skip',say:`[${name}] reads ${sk}, which isn’t known for a pasted event`});continue}
  const rx=jsRegex(val(keys,'REGEX')??'(.*)');if(rx.bad){steps.push({at:'index',r,name,state:'skip',say:`[${name}]’s REGEX can’t be tried here: ${rx.bad}`});continue}
  const m=rx.re.exec(input);if(!m){steps.push({at:'index',r,name,state:'miss',say:`[${name}] doesn’t match`});continue}
  const dest=val(keys,'DEST_KEY'),out=fill(val(keys,'FORMAT')??'$1',m);let did;
  if(dest==='MetaData:Sourcetype'){meta.sourcetype=out.replace(/^sourcetype::/,'');did=`the source type becomes ${meta.sourcetype}`}
  else if(dest==='MetaData:Host'){meta.host=out.replace(/^host::/,'');did=`the host becomes ${meta.host}`}
  else if(dest==='MetaData:Source'){meta.source=out.replace(/^source::/,'');did=`the source becomes ${meta.source}`}
  else if(dest==='_MetaData:Index'){meta.index=out;did=`the index becomes ${out}`}
  else if(dest==='queue'){const back=/^nullQueue$/i.test(queue)&&!/^nullQueue$/i.test(out.trim());queue=out.trim();qs.push({i:steps.length,q:queue,back});did=`the event goes ${back?'back ':''}to ${queue}`}
  else if(dest==='_raw'){text=out;did='the event text is rewritten'}
  else if(truthy(val(keys,'WRITE_META'))){const pairs=[...out.matchAll(/([^\s:]+)::("[^"]*"|\S*)/g)];pairs.forEach(p=>setField(cleanKey(p[1]),p[2].replace(/^"|"$/g,''),r));did=`it writes ${and(pairs.map(p=>p[1]))} as indexed fields`}
  else did=dest?`it sets ${dest}`:'nothing changes: it has no DEST_KEY or WRITE_META';
  steps.push({at:'index',r,name,state:'hit',say:`[${name}] matches${m[1]!==undefined?`, with “${m[1]}”`:''}: ${did}`,hit:m[0]})}
 const dropped=/^nullQueue$/i.test(queue),isNull=q=>/^nullQueue$/i.test(q);for(const {i,q,back} of qs){const later=qs.filter(x=>x.i>i);if(isNull(q))steps[i].say+=later.some(x=>!isNull(x.q))?', until a later transform sends it back':', which drops it';else if(back&&!later.some(x=>isNull(x.q)))steps[i].say+=', so it’s kept'}
 if(dropped)return {steps,fields,meta,dropped,searchedAs:null,text};
 // Search time: the source type it ends with, or the name a rename gives it.
 const rn=val(stanza(meta.sourcetype),'rename'),S=rn||meta.sourcetype;
 if(rn)steps.push({at:'search',r:stanza(meta.sourcetype).get('rename'),state:'hit',say:`rename: it is searched as ${rn}, with ${rn}’s search-time settings`});
 for(const r of winners(S,/^EXTRACT-/i)){let v=r.value.trim(),from='_raw';const inF=/^(.*\S)\s+in\s+([A-Za-z_]\w*)$/.exec(v);if(inF){v=inF[1];from=inF[2]}
  const src=from==='_raw'?text:fields.get(from)?.value;if(src==null){steps.push({at:'search',r,state:'miss',say:`${r.key} reads ${from}, which the event doesn’t have yet`});continue}
  const rx=jsRegex(v);if(rx.bad){steps.push({at:'search',r,state:'skip',say:`${r.key} can’t be tried here: ${rx.bad}`});continue}
  const m=rx.re.exec(src);if(!m){steps.push({at:'search',r,state:'miss',say:`${r.key} doesn’t match`});continue}
  const got=groups(m);got.forEach(([k,x])=>setField(k,x,r));steps.push({at:'search',r,state:got.length?'hit':'miss',say:got.length?`${r.key} extracts ${and(got.map(g=>g[0]))}`:`${r.key} matches, with no named group`,n:got.length})}
 for(const r of winners(S,/^REPORT-/i))for(const name of namesOf(r)){const keys=tx(name);if(!keys){steps.push({at:'search',r,name,state:'missing',say:`[${name}] isn’t in transforms.conf`});continue}
  const sk=val(keys,'SOURCE_KEY')||'_raw',src=sk==='_raw'?text:fields.get(sk)?.value;if(src==null){steps.push({at:'search',r,name,state:'miss',say:`[${name}] reads ${sk}, which the event doesn’t have`});continue}
  let got=[];
  if(val(keys,'DELIMS')!==undefined){const d=delims(val(keys,'DELIMS'));if(d.length>=2)got=kvByDelims(src,d[0],d[1]);else if(d.length===1){const names=(val(keys,'FIELDS')||'').split(',').map(s=>s.trim().replace(/^"|"$/g,'')).filter(Boolean),vals=[];let cur='',q=false;for(const ch of src){if(ch==='"'){q=!q;continue}if(!q&&d[0].includes(ch)){vals.push(cur);cur='';continue}cur+=ch}vals.push(cur);got=names.map((n,i)=>[n,vals[i]??'']).filter(x=>x[1]!=='')}}
  else{const rx=jsRegex(val(keys,'REGEX')??'');if(rx.bad){steps.push({at:'search',r,name,state:'skip',say:`[${name}]’s REGEX can’t be tried here: ${rx.bad}`});continue}
   const fmt=val(keys,'FORMAT');
   if(fmt&&/\$\d+::/.test(fmt)){const re=new RegExp(rx.re.source,rx.re.flags.includes('g')?rx.re.flags:rx.re.flags+'g');for(const m of src.matchAll(re)){for(const p of fill(fmt,m).matchAll(/([^\s:]+)::("[^"]*"|\S*)/g))got.push([cleanKey(p[1]),p[2].replace(/^"|"$/g,'')]);if(!m[0])break}}
   else{const m=rx.re.exec(src);if(m)got=fmt?[...fill(fmt,m).matchAll(/([^\s:]+)::("[^"]*"|\S*)/g)].map(p=>[cleanKey(p[1]),p[2].replace(/^"|"$/g,'')]):groups(m)}}
  got=got.filter(([k])=>k);got.forEach(([k,x])=>setField(k,x,r));
  steps.push({at:'search',r,name,state:got.length?'hit':'miss',say:got.length?`[${name}] extracts ${plural(got.length,'field')}`:`[${name}] extracts nothing`,n:got.length})}
 const kv=(val(stanza(S),'KV_MODE')||val(stanza('default'),'KV_MODE')||'auto').toLowerCase();
 if(kv==='none')steps.push({at:'search',r:stanza(S).get('KV_MODE')||null,state:'off',say:'KV_MODE = none: no automatic key-value extraction'});
 else if(kv==='json'){let got=[];try{const flat=(o,p)=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'?flat(v,p+k+'.'):[[p+k,String(v)]]);got=flat(JSON.parse(text),'')}catch(e){}got.forEach(([k,x])=>setField(k,x,stanza(S).get('KV_MODE')));steps.push({at:'search',r:stanza(S).get('KV_MODE')||null,state:got.length?'hit':'miss',say:got.length?`KV_MODE = json extracts ${plural(got.length,'field')}`:'KV_MODE = json: the event isn’t JSON'})}
 else if(kv==='auto'||kv==='auto_escaped'){const got=autoKv(text);got.forEach(([k,x])=>setField(k,x,stanza(S).get('KV_MODE')||null));steps.push({at:'search',r:stanza(S).get('KV_MODE')||null,state:got.length?'hit':'miss',say:got.length?`Automatic key-value extraction (KV_MODE = ${kv}${stanza(S).get('KV_MODE')?'':', the default'}) finds ${plural(got.length,'pair')}`:'Automatic key-value extraction finds no key=value pair'})}
 else steps.push({at:'search',r:stanza(S).get('KV_MODE'),state:'skip',say:`KV_MODE = ${kv} isn’t tried here`});
 for(const r of winners(S,/^FIELDALIAS-/i)){const t=r.value.trim().split(/\s+/),made=[];
  for(let i=0;i+2<t.length;i+=3){const from=t[i],how=t[i+1],to=t[i+2];if(!/^as(new)?$/i.test(how))break;const f=fields.get(from);if(!f||(/^asnew$/i.test(how)&&fields.has(to)))continue;fields.set(to,{value:f.value,r,alias:from});made.push(to)}
  steps.push({at:'search',r,state:made.length?'hit':'miss',group:'alias',made,say:made.length?`${r.key}: ${and(made)}`:`${r.key}: the event has none of its fields`})}
 const evals=winners(S,/^EVAL-/i),lookups=winners(S,/^LOOKUP-/i);
 if(evals.length)steps.push({at:'search',r:null,state:'skip',say:`${plural(evals.length,'calculated field')} (EVAL-) ${evals.length===1?'isn’t':'aren’t'} computed here`});
 if(lookups.length)steps.push({at:'search',r:null,state:'skip',say:`${plural(lookups.length,'lookup')} (LOOKUP-) ${lookups.length===1?'isn’t':'aren’t'} run here`});
 return {steps,fields,meta,dropped:false,searchedAs:S,text}}

// ---- the map's tools ----
function samplesHtml(){if(!E.samples.size)return'';const list=[...E.samples.values()].sort((a,b)=>ascii(a.path,b.path));
 return`<label class="tmTryField224">Sample <select data-try-sample><option value="">Pick one of ${plural(list.reduce((n,s)=>n+s.events.length,0),'sample event')}</option>${list.map(s=>`<optgroup label="${esc(s.name)}">${s.events.map((e,i)=>`<option value="${esc(s.path)}|${i}"${E.sample===`${s.path}|${i}`?' selected':''}>${i+1}: ${esc(e.slice(0,70))}${e.length>70?'…':''}</option>`).join('')}</optgroup>`).join('')}</select></label>`}
function pathHtml(T){const x=E.result;if(!x)return'';const ref=r=>r?`<button type="button" class="tmTryRef224" data-try-line="${r.fid}:${r.n}" title="Show the line">${esc(at(r))}</button>`:'';
 const row=s=>`<li class="tmStep224" data-state="${s.state}"><span class="tmMark224" aria-hidden="true"></span><span>${esc(s.say)}</span>${ref(s.r)}</li>`;
 const idx=x.steps.filter(s=>s.at==='index'),fields=[...x.fields],al=x.steps.filter(s=>s.group==='alias'),got=al.flatMap(s=>s.made||[]),hit=al.filter(s=>s.state==='hit').length;
 // Field aliases: one row, where the first of them comes, with what they give and how many find nothing.
 const none=al.length-hit,aliases={state:hit?'hit':'miss',r:null,say:`Field aliases (FIELDALIAS-): ${hit} of ${al.length} ${hit===1?'gives':'give'} ${got.length===1?'a field':'fields'}${got.length?`: ${got.slice(0,8).join(', ')}${got.length>8?` and ${got.length-8} more`:''}`:''}${none?`. ${none} ${none===1?'finds none of its fields':'find none of their fields'}`:''}`};
 const sea=x.steps.filter(s=>s.at==='search'&&(s.group!=='alias'||s===al[0])).map(s=>s===al[0]?aliases:s);
 return`<div class="tmPath224" aria-live="polite"><p class="tmPathHead224">Arrives as <b>${esc(E.from)}</b>${!x.dropped&&x.meta.sourcetype!==E.from?` · indexed as <b>${esc(x.meta.sourcetype)}</b>`:''}${x.searchedAs&&x.searchedAs!==x.meta.sourcetype?` · searched as <b>${esc(x.searchedAs)}</b>`:''}${x.dropped?' · <b>dropped</b>':''}${x.searchedAs&&x.searchedAs!==T&&pm.types.includes(x.searchedAs)?` <button type="button" class="tmType217" data-tm-type="${esc(x.searchedAs)}">Follow ${esc(x.searchedAs)}</button>`:''}</p>
  <h4>Index time, as ${esc(E.from)}</h4><ol>${idx.length?idx.map(row).join(''):'<li class="tmStep224" data-state="off"><span class="tmMark224" aria-hidden="true"></span><span>No TRANSFORMS- line runs for it</span></li>'}</ol>
  ${x.dropped?'':`<h4>Search time, as ${esc(x.searchedAs)}</h4><ol>${sea.map(row).join('')}</ol>`}
  ${fields.length?`<details class="tmFields224"${E.fieldsOpen?' open':''}><summary>${plural(fields.length,'field')} extracted</summary><table><thead><tr><th>Field</th><th>Value</th><th>From</th></tr></thead><tbody>${fields.map(([k,f])=>`<tr><td><code>${esc(k)}</code></td><td>${esc(f.value)}</td><td>${f.r?esc(f.alias?`${f.r.key}, from ${f.alias}`:f.r.key):'automatic'}</td></tr>`).join('')}</tbody></table></details>`:''}</div>`}
function toolsHtml(T){return`<div class="tmTools224" role="group" aria-label="Tools for ${esc(T)}"><button type="button" class="builderBtn" data-try-open aria-expanded="${E.open}">Try an event</button><button type="button" class="builderBtn" data-copy-settings>Copy settings</button><button type="button" class="builderBtn" data-save-settings>Save settings</button><button type="button" class="builderBtn" data-save-image>Save image</button></div>${E.open?`<div class="tmTry224"><label class="tmTryText224">Event <textarea data-try-text rows="3" spellcheck="false" placeholder="Paste one event, as Splunk receives it">${esc(E.text)}</textarea></label><div class="tmTryRow224">${samplesHtml()}<label class="tmTryField224">Arrives as <select data-try-from>${pm.types.map(t=>`<option${t===(E.from||T)?' selected':''}>${esc(t)}</option>`).join('')}</select></label><button type="button" class="builderBtn primary" data-try-go>Try it</button>${E.result?'<button type="button" class="propsLink205" data-try-clear>Clear</button>':''}</div>${pathHtml(T)}</div>`:''}`}
// The map's lines and cards the event's path goes through. A line is lit when it gives the event something, and dimmed
// when it's tried and gives nothing; one that can't be tried here is left as it is. A line that names several
// transforms is lit when any of them matches, and each transform under it shows its own result. A folded run of lines
// is lit when a line in it is, and dimmed when every line in it that was tried gave nothing. A dropped event lights the
// Dropped card; any other, each card a transform that matched it leads to, and the card of the source type it becomes.
function light(r,T){r=r||root();if(!r)return;r.querySelectorAll('.tmHit224,.tmMiss224').forEach(el=>el.classList.remove('tmHit224','tmMiss224'));const x=E.result;if(!x)return;
 const lines=new Map(),cls=s=>s.state==='hit'?'tmHit224':/^(miss|missing)$/.test(s.state)?'tmMiss224':null;
 for(const s of x.steps){if(!s.r||!cls(s))continue;const k=`${s.r.fid}:${s.r.n}`;lines.set(k,lines.get(k)==='tmHit224'?'tmHit224':cls(s));if(!s.name)continue;
  for(const li of r.querySelectorAll(`[data-tm-set="${k}"]`)){const runs=[...li.querySelectorAll('.tmNested217'),...(li.closest('.tmRuns217')?.querySelectorAll('.tmRun217')||[])];runs.find(e=>e.querySelector('code')?.textContent===`[${s.name}]`)?.classList.add(cls(s))}}
 for(const [k,c] of lines)r.querySelectorAll(`[data-tm-set="${k}"]`).forEach(el=>el.classList.add(c));
 r.querySelectorAll('.tmFold221').forEach(f=>{const c=f.querySelector('.tmHit224')?'tmHit224':f.querySelector('.tmMiss224')?'tmMiss224':null;if(c)f.querySelector(':scope>details>summary')?.classList.add(c)});
 const to=x.meta.sourcetype,met=x.steps.filter(s=>s.at==='index'&&s.state==='hit'&&s.name).map(s=>`[${s.name}]`);
 if(x.dropped)r.querySelectorAll('.tmResult217[data-result=drop]').forEach(c=>c.classList.add('tmHit224'));
 else r.querySelectorAll('.tmResult217:not([data-result=drop])').forEach(c=>{if(to!==E.from&&c.querySelector(`[data-tm-type="${CSS.escape(to)}"]`)||met.some(n=>c.textContent.includes(n)))c.classList.add('tmHit224')})}
// Called by the map's draw, before it binds its controls: the tools under the summary, and the path lit.
function decorateMap(r,T){if(!r||!T)return;r.querySelector('.tmSummary217')?.insertAdjacentHTML('afterend',toolsHtml(T));light(r,T)}
const redraw=()=>{const r=root();const T=pm.focus==='all'?null:pm.focus;if(!r||!T)return;r.querySelectorAll('.tmTools224,.tmTry224,.tmText224').forEach(el=>el.remove());decorateMap(r,T);requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')))};
document.addEventListener('click',async e=>{const r=root();if(!r||!r.contains(e.target))return;const T=pm.focus==='all'?null:pm.focus;if(!T)return;
 if(e.target.closest('[data-try-open]')){E.open=!E.open;if(!E.from)E.from=T;redraw();return}
 if(e.target.closest('[data-copy-settings]')){copyText(settingsText(T),e.target.closest('button'));return}
 if(e.target.closest('[data-save-settings]')){downloadText(`${T.replace(/[^\w.-]+/g,'_')}.conf`,settingsText(T));return}
 if(e.target.closest('[data-save-image]')){saveImage(T,e.target.closest('button'));return}
 if(e.target.closest('[data-try-go]')){E.text=r.querySelector('[data-try-text]')?.value||'';E.from=r.querySelector('[data-try-from]')?.value||T;E.result=E.text.trim()?tryEvent(E.text.replace(/\r?\n$/,''),E.from):null;redraw();return}
 if(e.target.closest('[data-try-clear]')){E.result=null;E.text='';E.sample=null;redraw();return}
 const fol=e.target.closest('.tmTry224 [data-tm-type]');if(fol){e.stopPropagation();pm.focus=fol.dataset.tmType;render();return}
 const ref=e.target.closest('[data-try-line]');if(ref){cv.showLine?.(ref.dataset.tryLine);return}});
document.addEventListener('change',e=>{const r=root();if(!r?.contains(e.target))return;
 if(e.target.matches('[data-try-sample]')&&e.target.value){const v=e.target.value,s=E.samples.get(v.slice(0,v.lastIndexOf('|')));if(s){E.sample=v;E.text=s.events[+v.slice(v.lastIndexOf('|')+1)];const ta=r.querySelector('[data-try-text]');if(ta)ta.value=E.text}}
 if(e.target.matches('[data-try-from]'))E.from=e.target.value});
document.addEventListener('input',e=>{if(!e.target.matches?.('[data-try-text]'))return;E.text=e.target.value;if(E.sample){const v=E.sample;if(E.samples.get(v.slice(0,v.lastIndexOf('|')))?.events[+v.slice(v.lastIndexOf('|')+1)]!==E.text)E.sample=null}});
document.addEventListener('toggle',e=>{if(e.target.matches?.('.tmFields224'))E.fieldsOpen=e.target.open},true);

// ---- the panel: the search-time order ----
function decorate(panel){if(!panel||!pm.files.length)return;const actions=panel.querySelector('.propsActions205');if(!actions)return;
 actions.insertAdjacentHTML('afterbegin',appPicker());panel.querySelector('.propsSummary205')?.insertAdjacentHTML('afterend',appNote())}
document.addEventListener('change',e=>{if(!e.target.matches?.('[data-search-app]'))return;A.app=e.target.value||null;A.version++;cv.analyse();render()});
function clear(){if(A.meta.size||A.app)A.version++;A.meta.clear();A.app=null;A.hidden=new Map();E.samples.clear();E.result=null;E.text='';E.open=false;E.from=null;E.sample=null}
// For a test or a script: metadata and samples by path.
function load(list){const errors=[];for(const [path,text] of Object.entries(list)){const e=put(path,text);if(e)errors.push(e)}cv.analyse();render();return errors}
window.configTools224={takes,add,put,load,clear,remerge,mark,decorate,decorateMap,parseMeta,exported,rank:(f,X)=>rank(f,X),jsRegex,delims,kvByDelims,autoKv,tryEvent,settingsText,mapSvg,
 setApp(app){A.app=app||null;A.version++;cv.analyse();render()},
 // The map draws again only when what it shows changes: this is part of what it compares.
 version:()=>A.version,knowledge:()=>({app:A.app,meta:A.meta,hidden:A.hidden,samples:E.samples,result:E.result})};
})();

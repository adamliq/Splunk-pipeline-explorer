(function(){
/* Build 228: where each part goes. Under Build 221's "Where it acts", what each tier gets from the files: the lines
   by stage, then a package's other files, then what its app.manifest says.
   - The lines: those Build 221 counts, by the stage each is on, with how many take effect on a Universal Forwarder,
     a Heavy Forwarder, an Indexer and a Search Head (cv.effect, as Build 221 counts them), and how many act on the
     Search Head only for data it reads itself.
   - A package's other files (an app package, or an app or etc folder): Splunk's packaging toolkit (slim 1.2.4) places
     each part on its three workloads: search heads, indexers and forwarders, which here are both kinds.
     - Settings files the Config view doesn't read: by the @placement notes in the toolkit's .conf.spec files. A file
       goes wherever any of its settings does; a file with no note goes on all three, as the toolkit places it.
     - lookups, static, appserver and default/data (views, navigation, panels, data models): search heads only, as
       the toolkit's partitions keep them. Splunk's Admin Manual also lists lookup files in the search phase.
     - metadata: every tier the app is on. app.manifest: no tier; the toolkit keeps it out of every partition.
     - bin and lib: the toolkit keeps them everywhere; they run where what names them runs: an input on a forwarder,
       a search command or scripted lookup on a search head.
     - README text, licenses, VERSION and samples: kept with the app; Splunk doesn't read them while it runs.
     - Anything else: every tier, as the toolkit keeps what it has no rule for.
   - app.manifest's targetWorkloads (_search_heads, _indexers, _forwarders, or * for all) beside the tiers that get
     parts, as the toolkit reads it: none named is every workload, and a name it doesn't know, it rejects. */
const cv=window.configView205,pm=state.configView205;if(!cv||!pm)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const and=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a.at(-1):a[0]||'';
const plural=(n,one,many)=>`${n.toLocaleString('en-US')} ${n===1?one:many||one+'s'}`;
const ascii=(a,b)=>a<b?-1:a>b?1:0;
const TIERS=[['uf','Universal Forwarder'],['hf','Heavy Forwarder'],['idx','Indexer'],['sh','Search Head']],SYS='etc/system';
// The read kinds: the Config view places them line by line.
const READ=/^(inputs|props|transforms|eventtypes|tags)\.conf$/i;
// Splunk's packaging toolkit 1.2.4 (slim/config/conf-specs): where each settings file goes. s: search heads; i:
// indexers; f: forwarders. A file goes wherever any of its settings does. '': its spec has no @placement, and the
// toolkit keeps it on all three; a file it has no spec for, likewise.
const TK={alert_actions:'s',app:'sif',audit:'if',authentication:'',authorize:'s',collections:'s',commands:'s',datamodels:'s',datatypesbnf:'','default-mode':'',deployment:'',deploymentclient:'',distsearch:'si',event_renderers:'',eventdiscoverer:'',eventtypes:'s',fields:'si',indexes:'si',inputs:'f',limits:'si',literals:'',livetail:'',macros:'s',messages:'',multikv:'s',outputs:'',passwords:'','procmon-filters':'',props:'sif',pubsub:'',restmap:'si',savedsearches:'s',searchbnf:'s',segmenters:'si',server:'',serverclass:'','source-classifier':'',sourcetypes:'','splunk-launch':'',tags:'s',times:'s',transactiontypes:'s',transforms:'si','ui-prefs':'s','ui-tour':'s','user-prefs':'s','user-seed':'',viewstates:'s',visualizations:'s',web:'sif',wmi:'f',workflow_actions:'s'};
// The toolkit's workloads on the page's tiers: forwarders are both kinds.
const onTiers=w=>({uf:w.includes('f'),hf:w.includes('f'),idx:w.includes('i'),sh:w.includes('s')});
const ALL={uf:true,hf:true,idx:true,sh:true},NONE={uf:false,hf:false,idx:false,sh:false},SH={...NONE,sh:true};
// What a stanza of a settings file is, in its own words.
const NOUN={macros:['macro'],savedsearches:['saved search','saved searches'],commands:['search command'],alert_actions:['alert action'],workflow_actions:['workflow action'],datamodels:['data model'],collections:['KV store collection'],indexes:['index','indexes'],fields:['field'],times:['time range'],transactiontypes:['transaction type'],visualizations:['visualization'],authorize:['role or capability','roles and capabilities'],outputs:['output stanza'],restmap:['REST endpoint']};

// ---- a package's files ----
// Every file a package or a folder brings, by path; the text of the few it reads. ver changes whenever they do.
let F=new Map(),ver=0;
const norm=path=>path.replace(/\\/g,'/').split('/').filter(Boolean).join('/');
// Folders whose files Splunk doesn't merge with the instance's own, as the Config view holds back their settings files:
// each user's folder, and the apps an instance sends to others.
const held=path=>{const p=norm(path).split('/'),i=p.lastIndexOf('etc');
 return p.at(-5)==='users'||p.some((x,k)=>x==='users'&&(k===0||p[k-1]==='etc'))||i>=0&&['deployment-apps','manager-apps','master-apps','shcluster'].includes(p[i+1])};
function record(path,size){path=norm(path);if(!path.includes('/')||held(path))return;const f=F.get(path)||{path,size:0,text:null};f.size=size??f.size;F.set(path,f);ver++}
// Each package entry, from the package readers, before they keep only what the Config view reads.
function entry(path,size){record(path,size)}
// The files readFiles is given: a folder's, or what the package readers kept.
function seen(list){for(const {file,path} of list)record(path,file?.size)}
// The files whose text it reads: an app's app.manifest, and its settings files the Config view doesn't read.
function takes(path){const p=norm(path).split('/');if(p.length<2||held(path))return false;const name=p.at(-1);
 if(name==='app.manifest')return true;return /^(default|local)$/i.test(p.at(-2))&&/\.conf$/i.test(name)&&!READ.test(name)}
// Its text, to count a settings file's stanzas and read app.manifest. A file over 2 MB is listed without it.
async function add(file,path){record(path,file.size);if(file.size>2e6)return null;let text;try{text=await file.text()}catch(e){return`${norm(path)}: it can’t be read`}
 if(text.includes('\u0000'))return`${file.name} isn’t a text file`;F.get(norm(path)).text=text;ver++;return null}
function clear(){F=new Map();ver++;opened.clear()}

// An app's root: in an etc folder, apps/<name> (or peer-apps, slave-apps) and etc/system; else the folder above the
// first of an app's own folders: default, local, metadata, lookups, bin…
const MARK=new Set(['default','local','metadata','lookups','static','appserver','bin','lib','samples','README','LICENSES','licenses','docs']);
function split(path){const p=path.split('/'),cut=i=>({root:p.slice(0,i).join('/'),rel:p.slice(i).join('/')});
 const a=p.findIndex((x,k)=>['apps','peer-apps','slave-apps'].includes(x)&&(k===0||p[k-1]==='etc'));if(a>=0&&p.length>a+2)return cut(a+2);
 const s=p.findIndex((x,k)=>x==='system'&&k>0&&p[k-1]==='etc');if(s>=0&&p.length>s+1)return cut(s+1);
 const i=p.findIndex((x,k)=>k>0&&MARK.has(x));if(i>0)return cut(i);
 return cut(p.length-1)}
const appName=root=>/(^|\/)etc\/system$/.test(root)||root==='system'?SYS:root.split('/').at(-1);
// The apps the files make up: a root with a marker folder, app.manifest or app.conf.
function apps(){const by=new Map();for(const f of F.values()){const {root,rel}=split(f.path);if(!root)continue;if(!by.has(root))by.set(root,[]);by.get(root).push({...f,rel})}
 const out=new Map();for(const [root,files] of by){if(!files.some(x=>x.rel.includes('/')||x.rel==='app.manifest'))continue;const name=appName(root);out.set(name,[...(out.get(name)||[]),...files.map(x=>({...x,root,app:name===SYS?'':name}))])}
 return out}

// ---- where a file goes ----
// A part: its label, its tiers, what it counts, and why it goes there. firm: a rule places it, rather than the toolkit
// keeping it everywhere for want of one; only firm parts say a tier needs the app.
function place(file){const rel=file.rel,top=rel.split('/')[0],name=rel.split('/').at(-1);
 const conf=/^(default|local)\/[^/]+\.conf$/i.test(rel)?name.replace(/\.conf$/i,''):null;
 if(conf){if(READ.test(name))return null;
  const w=TK[conf],n=file.text==null?null:(file.text.match(/^\s*\[[^\]]*\]\s*$/gm)||[]).filter(s=>!/^\s*\[default\]\s*$/.test(s)).length;
  if(conf==='app')return {group:'app',key:rel,label:rel,tiers:ALL,why:'The app’s name, version and settings. Splunk’s packaging toolkit places app.conf on search heads, indexers and forwarders.'};
  return {group:'conf',key:rel,n,label:`${rel}${n==null?'':`: ${plural(n,...(NOUN[conf]||['stanza']))}`}`,tiers:w?onTiers(w):ALL,firm:!!w,
   why:w?`Splunk’s packaging toolkit places ${conf}.conf on ${and([w.includes('s')&&'search heads',w.includes('i')&&'indexers',w.includes('f')&&'forwarders'].filter(Boolean))}.`:w===''?`Splunk’s packaging toolkit gives ${conf}.conf no placement, so it keeps it on every tier.`:`It isn’t one of the settings files Splunk’s packaging toolkit knows, so the toolkit keeps it on every tier.`}}
 // default/data: what each folder holds, as Splunk Web reads it.
 if(/^(default|local)\/data\//i.test(rel)){const seg=rel.split('/'),n=seg[2]==='ui'&&seg.length>4?4:seg.length>3?3:2,key=seg.slice(0,n).join('/')+'/';
  const kind={'ui/views':'views','ui/nav':'navigation','ui/panels':'dashboard panels','models':'data models'}[seg.slice(2,n).join('/')]||'Splunk Web’s files';
  return {group:'web',key,label:`${key}: ${kind}`,tiers:SH,firm:true,why:`The packaging toolkit keeps ${top}/data/ for search heads only.`}}
 if(top==='static'||top==='appserver')return {group:'web',key:`${top}/`,label:`${top}/: Splunk Web’s files`,tiers:SH,firm:true,why:`The packaging toolkit keeps ${top}/ for search heads only.`};
 if(top==='lookups')return {group:'lookups',key:'lookups/',label:'lookups/: lookup files',tiers:SH,firm:true,why:'Lookups run at search time: the Admin Manual lists lookup files in the search phase, and the packaging toolkit keeps them for search heads only.'};
 if(top==='metadata')return {group:'app',key:rel,label:rel,tiers:ALL,why:'Permissions and exports for the app’s objects, read wherever the app is installed. The packaging toolkit keeps default.meta on every tier.'};
 if(rel==='app.manifest')return {group:'none',key:rel,label:rel,tiers:NONE,why:'Read by Splunk’s packaging and app tools, not by Splunk while it runs. The packaging toolkit leaves it out of every partition.'};
 if(top==='bin'||top==='lib'){const by=top==='bin'?runBy(file):null;
  if(by)return {group:'code',key:rel,label:rel,tiers:by.tiers,firm:true,why:by.why};
  return {group:'code',key:`${top}/`,label:`${top}/: scripts and libraries`,tiers:null,span:'Where what runs them is',why:'They run where what names them runs: an input on a forwarder, a search command or scripted lookup on a search head. The packaging toolkit keeps them on every tier.'}}
 if(top==='README'&&/\.conf\.spec$/i.test(name)){const c=name.replace(/\.conf\.spec$/i,''),w=TK[c];
  return {group:'code',key:rel,label:rel,tiers:w?onTiers(w):ALL,firm:!!w,why:`It describes ${c}.conf’s settings. The packaging toolkit keeps a spec only where its .conf file goes${w?'':`, and keeps ${c}.conf on every tier`}.`}}
 if(top==='samples')return {group:'none',key:'samples/',label:'samples/',tiers:NONE,why:'Sample events, read only by an event generator set up with eventgen.conf. Splunk itself doesn’t read them.'};
 if(!rel.includes('/')||top==='LICENSES'||top==='licenses'||top==='docs'||top==='README'){
  if(/^(README|LICENSE|LICENCE|NOTICE|EULA|VERSION|CHANGELOG|CHANGES)/i.test(name)||/\.(md|txt|pdf|html?)$/i.test(name)||top==='LICENSES'||top==='licenses'||top==='docs'||top==='README')
   return {group:'none',key:top==='LICENSES'||top==='licenses'||top==='docs'||top==='README'?`${top}/`:rel,label:top==='LICENSES'||top==='licenses'||top==='docs'||top==='README'?`${top}/`:rel,tiers:NONE,why:'Documentation and licenses: kept with the app, and not read by Splunk while it runs.'}}
 // Anything else, by its folder: the toolkit keeps what it has no rule for on every tier.
 const key=rel.includes('/')?`${top}/`:rel;
 return {group:'other',key,label:key,tiers:ALL,why:'The packaging toolkit keeps files it has no rule for on every tier.'}}
// A bin script that something in the app names: an input (a script:// stanza, or a modular input's scheme), a search
// command (commands.conf filename) or a scripted lookup (transforms.conf external_cmd).
function runBy(file){const name=file.rel.split('/').at(-1),stem=name.replace(/\.[^.]+$/,''),app=file.app;
 const conf=k=>pm.files.filter(f=>f.kind===k&&(f.place.app||'')===app);
 const input=conf('inputs').flatMap(f=>f.doc.stanzas).find(st=>{const n=st.name;return new RegExp(`^script://.*\\bbin[\\\\/]${stem.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(\\.[^/\\\\]+)?\\s*$`,'i').test(n)||n.split('://')[0]===stem});
 if(input)return {tiers:{uf:true,hf:true,idx:false,sh:false},why:`inputs.conf’s [${input.name}] runs it, so it goes where that input runs: Splunk’s packaging toolkit places inputs on forwarders.`};
 const lookup=conf('transforms').flatMap(f=>f.doc.settings).find(r=>r.key==='external_cmd'&&r.value.trim().split(/\s+/)[0]===name);
 if(lookup)return {tiers:SH,why:`transforms.conf’s [${lookup.stanza.name}] runs it as a scripted lookup, at search time.`};
 const cmd=[...F.values()].filter(f=>f.text&&split(f.path).root===file.root&&/(^|\/)(default|local)\/commands\.conf$/i.test(f.path)).find(f=>new RegExp(`^\\s*filename\\s*=\\s*${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*$`,'m').test(f.text));
 if(cmd)return {tiers:SH,why:'commands.conf names it as a search command’s script, and the packaging toolkit places commands.conf on search heads.'};
 return null}
// An app's parts, one per key, with how many files each has.
function parts(files){const by=new Map();for(const f of files){const p=place(f);if(!p)continue;const x=by.get(p.key);if(x){x.files++;continue}by.set(p.key,{...p,files:1})}
 const order={conf:0,lookups:1,web:2,app:3,code:4,other:5,none:6};return [...by.values()].sort((a,b)=>order[a.group]-order[b.group]||ascii(a.label,b.label))}

// ---- the lines, by stage ----
const stageOf=id=>stages.find(s=>s.id===id);
const groupOf=()=>new Map(pm.files.map(f=>[f.id,f.place.app||(f.place.layer.startsWith('system')?SYS:'')]));
// What a stage's lines are, file by file: their settings by name, or their stanzas.
function what(lines){const by=new Map();for(const r of lines){const f=by.get(r.file)||{stanzas:0,keys:new Map()};by.set(r.file,f);if(r.kind==='stanza'){f.stanzas++;continue}const k=r.key.replace(/^([A-Za-z]+-).*$/,'$1');f.keys.set(k,(f.keys.get(k)||0)+1)}
 const keys=f=>[...f.keys].sort((a,b)=>b[1]-a[1]||ascii(a[0],b[0])),settings=f=>[...f.keys.values()].reduce((n,x)=>n+x,0);
 return [...by].map(([file,f])=>`${file}.conf: ${
  // Event types and tags in their own words; other files by their stanzas and settings, most first.
  file==='eventtypes'?and([...(f.stanzas?[plural(f.stanzas,'event type')]:[]),...keys(f).filter(([k])=>k!=='search').map(([k,n])=>n===1?k:`${k} ×${n}`)]):
  file==='tags'?and([...(f.stanzas?[plural(f.stanzas,'stanza')]:[]),...(f.keys.size?[plural(settings(f),'tag')]:[])]):
  and([...(f.stanzas?[plural(f.stanzas,'stanza')]:[]),...keys(f).slice(0,4).map(([k,n])=>n===1?k:`${k} ×${n}`),...(f.keys.size>4?[`${f.keys.size-4} more`]:[])])}`).join('; ')}
// A line's effect on each tier, as cv.effect gives it, worked out once for each analysis: analyse() gives every line a
// new model.
const fx=new WeakMap(),effects=r=>{let v=fx.get(r.m);if(!v){v=Object.fromEntries(TIERS.map(([k])=>[k,cv.effect(r,k)]));fx.set(r.m,v)}return v};
// The lines Build 221 counts, by app: each setting's highest-precedence line, on a stage.
function byApp(){const group=groupOf(),out=new Map();
 for(const r of cv.counted()){if(r.overriddenBy||r.m.area!=='stage')continue;const a=group.get(r.fid)??'';if(!out.has(a))out.set(a,[]);out.get(a).push(r)}return out}
// An app's lines by stage, with how many take effect on each tier, and how many only for the tier's own data.
function stageRows(lines){const by=new Map();
 for(const r of lines){const id=r.m.on||r.m.stages[0];if(!by.has(id))by.set(id,[]);by.get(id).push(r)}
 return [...by].sort((a,b)=>a[0]-b[0]).map(([id,lines])=>{const t={on:{},own:{}};for(const r of lines){const e=effects(r);for(const [k] of TIERS){if(e[k]==='required'||e[k]==='conditional')t.on[k]=(t.on[k]||0)+1;else if(e[k]==='own')t.own[k]=(t.own[k]||0)+1}}
  return {id,stage:stageOf(id),lines,n:lines.length,...t,what:what(lines)}})}

// ---- the manifest ----
const WORK={_search_heads:['sh'],_indexers:['idx'],_forwarders:['uf','hf']},WNAME={_search_heads:'search heads',_indexers:'indexers',_forwarders:'forwarders'};
function manifest(files,rows,ps){const m=files.find(f=>f.rel==='app.manifest');if(!m)return null;if(m.text==null)return {say:'Its app.manifest isn’t read here.'};
 let j;try{j=JSON.parse(m.text)}catch(e){return {say:'Its app.manifest isn’t valid JSON, so Splunk’s app tools can’t read it.',bad:true}}
 const t=j&&typeof j==='object'?j.targetWorkloads:null;if(t!=null&&!Array.isArray(t))return {say:'Its app.manifest’s targetWorkloads isn’t a list, as Splunk’s app tools want it.',bad:true};
 // As Splunk's packaging toolkit reads it: none named, or *, is every workload, and a name it doesn't know, it rejects.
 const raw=(t||[]).map(String),every=!raw.length||raw.includes('*'),odd=raw.filter(w=>w!=='*'&&!WORK[w]),named=every?Object.keys(WORK):raw.filter(w=>WORK[w]);
 // Lines that act on a tier, but inputs only on forwarders: the packaging toolkit places inputs.conf there.
 const acts=(k,r)=>{const e=effects(r)[k];return (e==='required'||e==='conditional')&&(r.file!=='inputs'||k==='uf'||k==='hf')};
 const lineCount=k=>rows.reduce((n,row)=>n+row.lines.filter(r=>acts(k,r)).length,0);
 // A workload is needed where lines act or a rule places a part; app.conf, metadata and files kept everywhere for want
 // of a rule go wherever the app does.
 const placed=k=>ps.filter(p=>p.firm&&p.tiers&&p.tiers[k]);
 const need=Object.keys(WORK).filter(w=>WORK[w].some(k=>lineCount(k)>0||placed(k).length));
 const missing=need.filter(w=>!named.includes(w)),idle=named.filter(w=>!need.includes(w));
 // What goes on a workload's tiers: lines that act there, and files placed there.
 const why=w=>{const name=k=>TIERS.find(x=>x[0]===k)[1],t=WORK[w].map(k=>[k,lineCount(k)]).filter(([,n])=>n),files=[...new Set(WORK[w].flatMap(k=>placed(k).map(p=>p.key)))];
  return [...t.map(([k,n])=>`${plural(n,'line takes','lines take')} effect on ${article(name(k))} ${name(k)}`),...(files.length?[`${and(files.slice(0,3))}${files.length>3?` and ${files.length-3} more`:''} ${files.length===1?'goes':'go'} there`]:[])].join('; ')};
 const say=[!raw.length?'Its app.manifest names no targetWorkloads, so Splunk’s app tools send it to every workload.':raw.includes('*')?'Its app.manifest’s targetWorkloads is *, every workload.':
   named.length?`Its app.manifest names ${and(named.map(w=>WNAME[w]))} as its targetWorkloads.`:'Its app.manifest names none of Splunk’s workloads as its targetWorkloads.',
  ...(odd.length?[`Splunk’s app tools reject ${and(odd)}: they know only _search_heads, _indexers, _forwarders and *.`]:[]),
  ...missing.map(w=>`It leaves out ${WNAME[w]}, though ${why(w)}.`),
  ...(idle.length?[every?`Nothing here acts on ${and(idle.map(w=>WNAME[w]))}.`:`It names ${and(idle.map(w=>WNAME[w]))}, where nothing here acts.`]:[])];
 if(!missing.length&&!idle.length&&named.length)say.push(every?'Each has parts here.':'Each has parts here, and no tier with parts is left out.');
 // Every workload, by default or by *, isn't a choice: tiers it sends the app to in vain are said, not flagged.
 return {say:say.join(' '),named:raw,missing,idle,ok:!missing.length&&!odd.length&&(every||!idle.length)}}
const article=w=>/^[aeio]/i.test(w)?'an':'a';

// ---- the panel ----
// The tables the person opened or closed; until then, each is open when there are at most three.
const opened=new Map();
// An etc folder can bring thousands of files: its apps and their parts are worked out again only when its files, or
// the Config view's files and their apps, change.
let memo={key:null,apps:null,parts:new Map()};
const cached=()=>{const key=`${ver}|${pm.files.map(f=>f.id+':'+(f.place.app||'')).join(',')}`;if(memo.key!==key)memo={key,apps:apps(),parts:new Map()};return memo};
function appTable(app,lines,files,openFirst){const M=cached(),rows=stageRows(lines),ps=files?(M.parts.get(app)||M.parts.set(app,parts(files)).get(app)):[],m=files?manifest(files,rows,ps):null;if(!rows.length&&!ps.length)return'';
 const lineRows=rows.map(r=>`<tr><th scope="row"><button type="button" class="cfStageLink228" data-parts-stage="${r.id}" title="Show stage ${r.id} in the Matrix">${String(r.id).padStart(2,'0')} ${esc(r.stage?.name||'Stage '+r.id)}</button><small>${esc(r.what)}</small></th>${TIERS.map(([k])=>`<td>${r.on[k]?`<b>${r.on[k]}</b>`:''}${r.own[k]?`<small title="Only for data the ${TIERS.find(x=>x[0]===k)[1]} reads itself">+${r.own[k]}</small>`:''}</td>`).join('')}</tr>`).join('');
 // In all: Build 221's counts, for this app.
 const total=TIERS.map(([k])=>[rows.reduce((n,r)=>n+(r.on[k]||0),0),rows.reduce((n,r)=>n+(r.own[k]||0),0)]);
 const totalRow=rows.length>1?`<tr class="cfPartsTotal228"><th scope="row">In all<small>${plural(rows.reduce((n,r)=>n+r.n,0),'line')}, as Where it acts counts them</small></th>${total.map(([on,own])=>`<td>${on?`<b>${on}</b>`:''}${own?`<small>+${own}</small>`:''}</td>`).join('')}</tr>`:'';
 const shown=ps.filter(p=>p.group!=='none'),unread=ps.filter(p=>p.group==='none');
 // A part's number: a settings file's stanzas, else its files.
 const count=p=>p.n??p.files;
 const fileRows=shown.map(p=>`<tr><th scope="row"><code>${esc(p.label)}</code><small>${esc(p.group==='conf'||p.group==='app'&&p.n!=null?p.why:`${plural(p.files,'file')}. ${p.why}`)}</small></th>${p.tiers==null?`<td colspan="4" class="cfPartsSpan228">${esc(p.span)}</td>`:TIERS.map(([k])=>`<td>${p.tiers[k]?`<b>${count(p)}</b>`:''}</td>`).join('')}</tr>`).join('');
 const key=app||'(none)',open=opened.has(key)?opened.get(key):openFirst,others=ps.reduce((n,p)=>n+p.files,0),n=rows.reduce((k,r)=>k+r.n,0);
 // A table with no lines (etc/system's server.conf, say) counts its files alone.
 return`<details class="cfParts228" data-parts-app="${esc(key)}"${open?' open':''}><summary><strong>What each tier gets${app?` from ${esc(app)}`:''}</strong><span>${and([...(n?[`${plural(n,'line')} by stage`]:[]),...(others?[plural(others,n?'other file':'file')]:[])])}</span></summary>
  <div class="cfPartsScroll228"><table><thead><tr><th scope="col">Part</th>${TIERS.map(([,name])=>`<th scope="col">${name}</th>`).join('')}</tr></thead>
  <tbody>${lineRows}${totalRow}${fileRows?`<tr class="cfPartsHead228"><th scope="rowgroup" colspan="5">${rows.length?'Its other files':'Its files'}, placed as Splunk’s packaging toolkit places them</th></tr>${fileRows}`:''}</tbody></table></div>
  ${unread.length?`<p class="cfPartsNote228"><b>Not read by Splunk while it runs:</b> ${unread.map(p=>`<code>${esc(p.label)}</code>${p.files>1?` (${p.files} files)`:''}`).join(', ')}. ${unread.some(p=>p.key==='samples/')?'An event generator reads samples/, if one is set up with eventgen.conf. ':''}${unread.some(p=>p.key==='app.manifest')?'Splunk’s app tools read app.manifest.':''}</p>`:''}
  ${m?`<p class="cfPartsNote228${m.ok?'':' cfPartsWarn228'}" data-parts-manifest>${esc(m.say)}</p>`:''}
  <p class="cfPartsNote228">Numbers are lines for stages, and stanzas or files for the other parts. Index-time lines count on both the Heavy Forwarder and the Indexer: they act on whichever parses the data first. +n: lines that act there only for data that tier reads itself.</p></details>`}
// The tables' HTML is kept until what it shows changes: the analysis (each gives a new pm.merged), the source type
// chosen, the files, or a table opened or closed. A component chosen in the strip changes none of it.
let drawn={merged:null,key:null,html:''};
function html(){if(!pm.files.length)return'';const M=cached(),key=`${pm.focus}|${M.key}|${[...opened].join(',')}`;if(drawn.merged===pm.merged&&drawn.key===key)return drawn.html;
 const L=byApp(),A=M.apps,names=[...new Set([...L.keys(),...A.keys()])].sort((a,b)=>(a===''?2:a===SYS?1:0)-(b===''?2:b===SYS?1:0)||ascii(a,b));
 const tables=names.map(app=>appTable(app,L.get(app)||[],A.get(app)||null,names.length<=3)).filter(Boolean);
 drawn={merged:pm.merged,key,html:tables.length?`<div class="cfPartsAll228">${tables.join('')}</div>`:''};return drawn.html}
// A stage's name shows it in the Matrix. A click on a table's head, by mouse or key, is the person opening or closing
// it: a table drawn open fires toggle too, so toggle can't tell the two apart.
document.getElementById('configView205')?.addEventListener('click',e=>{const b=e.target.closest?.('[data-parts-stage]');if(b){cv.showStage?.(+b.dataset.partsStage);return}
 const s=e.target.closest?.('.cfParts228>summary');if(s)opened.set(s.parentElement.dataset.partsApp,!s.parentElement.open)});

window.configParts228={entry,seen,takes,add,clear,html,
 // For a test or a script: an app's parts and placements, and what its manifest says.
 parts:app=>{const files=apps().get(app);if(!files)return null;const rows=stageRows(byApp().get(app)||[]),ps=parts(files);return {rows:rows.map(r=>({id:r.id,name:r.stage?.name,n:r.n,on:r.on,own:r.own,what:r.what})),parts:ps,manifest:manifest(files,rows,ps)}},
 apps:()=>[...apps().keys()],place,split,TK};
})();

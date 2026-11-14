(function(){
/* Build 222: event types, tags and the CIM data models. The Config view reads eventtypes.conf and tags.conf as it reads
   the other files: their lines go to the Matrix's Event typing and Tagging stages, merged in Splunk's precedence order.
   An event type's search is read for the source types it takes and the conditions it adds on other fields; tags.conf
   gives event types and field values their tags; and the Common Information Model's data models take the events that
   carry the tags their datasets require. In the source type map, the Search column ends with the event types and tags
   that reach the chosen source type, and a last column, Data models, holds the CIM data models those tags fit, each with
   a line from what feeds it. */
const cv=window.configView205,pm=state.configView205;if(!cv||!pm)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const breakable=s=>esc(s).replace(/([/:,_=])(?![/_])/g,'$1<wbr>');
const TYPING=stages.find(s=>s.name==='Event typing')?.id,TAGGING=stages.find(s=>s.name==='Tagging')?.id;
const truthy=v=>/^(1|t|true|y|yes)$/i.test(String(v||'').trim());
const and=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a.at(-1):a[0]||'';
const or=a=>a.length>1?a.slice(0,-1).join(', ')+' or '+a.at(-1):a[0]||'';
const fileOf=x=>pm.files.find(f=>f.id===x.fid);
const lineOf=st=>fileOf(st)?.doc.lines.find(r=>r.kind==='stanza'&&r.stanza===st)||null;
const at=r=>{const f=fileOf(r);return`${f?.path&&f.path.includes('/')?f.path:f?.name||''} line ${r.n}`};

// ---- an event type's search ----
// Its pieces, as the search command reads them: brackets, quoted text, `macros`, comparison operators and words. An
// event type's search can't hold a pipe or a subsearch.
function lex(src){const out=[];let i=0;
 while(i<src.length){const c=src[i];
  if(/\s/.test(c)){i++;continue}
  if(c==='('||c===')'||c===','){out.push({t:c,i,j:i+1});i++;continue}
  if(c==='|')return {bad:'pipe'};
  if(c==='[')return {bad:'subsearch'};
  if(c==='`'){const j=src.indexOf('`',i+1);if(j<0)return {bad:'macro'};out.push({t:'w',v:src.slice(i,j+1),macro:true,i,j:j+1});i=j+1;continue}
  if(c==='"'){let j=i+1;while(j<src.length&&src[j]!=='"'){if(src[j]==='\\')j++;j++}out.push({t:'w',q:true,v:src.slice(i+1,j).replace(/\\(.)/g,'$1'),i,j:Math.min(j+1,src.length)});i=j+1;continue}
  const op=src.slice(i).match(/^(!=|<=|>=|::|=|<|>)/);if(op){out.push({t:'op',v:op[1],i,j:i+op[1].length});i+=op[1].length;continue}
  let j=i;while(j<src.length&&!/[\s(),=<>"`|[]/.test(src[j])&&!(src[j]==='!'&&src[j+1]==='=')&&!(src[j]===':'&&src[j+1]===':'))j++;
  if(j===i)j++;out.push({t:'w',v:src.slice(i,j),i,j});i=j}
 return {toks:out}}
// Its terms and how they combine. The search command reads brackets first, then NOT, then OR, then AND, which is also
// implied between terms: "a b OR c" is a AND (b OR c). The operators are written in capitals.
function parse(src){const lx=lex(src);if(lx.bad)return {bad:lx.bad};const T=lx.toks;let p=0;
 const kw=w=>T[p]?.t==='w'&&!T[p].q&&!T[p].macro&&T[p].v===w;
 const node=(o,i,j)=>({...o,src,i,j});
 function all(){const kids=[],start=T[p]?.i??src.length;let explicit=false;
  while(p<T.length&&T[p].t!==')'){if(kw('AND')){p++;explicit=true;continue}if(T[p].t===','){p++;continue}kids.push(any())}
  return kids.length===1?kids[0]:node({k:'and',kids,explicit},start,T[p-1]?.j??start)}
 function any(){const first=not(),kids=[first];while(kw('OR')){p++;if(p>=T.length||T[p].t===')')break;kids.push(not())}return kids.length===1?first:node({k:'or',kids},first.i,kids.at(-1).j)}
 function not(){if(kw('NOT')){const from=T[p++].i;if(p>=T.length||T[p].t===')')return node({k:'text'},from,from+3);const kid=not();return node({k:'not',kid},from,kid.j)}return one()}
 function one(){const t=T[p++];
  if(t.t==='('){const inner=all();if(T[p]?.t===')')p++;return inner}
  if(t.t!=='w')return node({k:'text'},t.i,t.j);
  const o=T[p];
  if(!t.q&&!t.macro&&o?.t==='op'&&T[p+1]?.t==='w'){const v=T[p+1];p+=2;return node({k:'term',field:t.v,op:o.v,values:[v.v],wild:v.v.includes('*')},t.i,v.j)}
  if(!t.q&&!t.macro&&o?.t==='w'&&o.v==='IN'&&!o.q&&T[p+1]?.t==='('){p+=2;const values=[];let end=T[p-1].j;while(p<T.length){const x=T[p++];end=x.j;if(x.t===')')break;if(x.t==='w')values.push(x.v)}return node({k:'term',field:t.v,op:'in',values,wild:values.some(v=>v.includes('*'))},t.i,end)}
  return node({k:'text',macro:!!t.macro},t.i,t.j)}
 const parts=[];while(p<T.length){const before=p;parts.push(all());if(T[p]?.t===')')p++;if(p===before)p++}
 return {node:!parts.length?null:parts.length===1?parts[0]:node({k:'and',kids:parts},0,src.length)}}
// What a search asks of one source type's events: true, every one; false, none; or what is left of it, its conditions
// on other fields. sourcetype is the name a search sees, and its values match as a search's do: in any case, with * as
// a wildcard. An eventtype= term asks what that event type asks.
const like=(pattern,value)=>{try{return new RegExp('^'+pattern.split('*').map(x=>x.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$','i').test(value)}catch{return false}};
function judge(n,T,seen=new Set()){
 if(!n)return false;
 if(n.k==='term'){
  if(n.field==='sourcetype'&&['=','!=','::','in'].includes(n.op)){const hit=n.values.some(v=>like(v,T));return n.op==='!='?!hit:hit}
  if(n.field==='eventtype'&&['=','!=','::'].includes(n.op)&&!n.wild){const et=K.ets.get(n.values[0]);
   if(et?.node&&!seen.has(et.name)){seen.add(et.name);const v=judge(et.node,T,seen);seen.delete(et.name);if(n.op!=='!=')return v;return v===true?false:v===false?true:{k:'not',kid:v}}}
  return n}
 if(n.k==='text')return n.src.slice(n.i,n.j)==='*'?true:n;
 if(n.k==='not'){const v=judge(n.kid,T,seen);return v===true?false:v===false?true:{...n,kid:v}}
 const kids=[];for(const k of n.kids){const v=judge(k,T,seen);if(n.k==='and'?v===false:v===true)return v;if(v!==(n.k==='and'))kids.push(v)}
 return !kids.length?n.k==='and':kids.length===1?kids[0]:{...n,kids}}
// What is left, written out: each term as the file has it; a group in brackets where it sits inside another kind.
function show(n,outer){
 if(n.k==='term'||n.k==='text')return n.src.slice(n.i,n.j);
 if(n.k==='not')return'NOT '+show(n.kid,'not');
 const s=n.kids.map(k=>show(k,n.k)).join(n.k==='or'?' OR ':n.explicit?' AND ':' ');
 return outer&&outer!==n.k?`(${s})`:s}
// Whether a search names a source type at all; and the source types it names outright.
function mentions(n,seen=new Set()){if(!n)return false;
 if(n.k==='term'){if(n.field==='sourcetype')return true;if(n.field==='eventtype'){const et=K.ets.get(n.values[0]);if(et&&!seen.has(et.name)){seen.add(et.name);return mentions(et.node,seen)}}return false}
 return n.k==='not'?mentions(n.kid,seen):!!n.kids?.some(k=>mentions(k,seen))}
function named(n,out=new Set()){if(!n)return out;
 if(n.k==='term'&&n.field==='sourcetype'&&['=','::','in'].includes(n.op))n.values.filter(v=>!v.includes('*')).forEach(v=>out.add(v));
 if(n.k==='not'){}else n.kids?.forEach(k=>named(k,out));return out}

// ---- the CIM's data models ----
// From the CIM 8.8 documentation's tags tables: each dataset, the tags it requires, and its parent, whose tags it
// requires too. The tables print one level below a data model's root datasets, and so does this. In a dataset's tags, a word is a tag that is required, "a|b" requires either, and "a+b" is one choice
// of both together.
const CIM=[
 ['Alerts',[['Alerts','alert']]],
 ['Authentication',[['Authentication','authentication'],['Default_Authentication','default','Authentication'],['Insecure_Authentication','cleartext|insecure','Authentication'],['Privileged_Authentication','privileged','Authentication']]],
 ['Certificates',[['All_Certificates','certificate'],['SSL','ssl|tls','All_Certificates']]],
 ['Change',[['All_Changes','change'],['Auditing_Changes','audit','All_Changes'],['Endpoint_Changes','endpoint','All_Changes'],['Network_Changes','network','All_Changes'],['Account_Management','account','All_Changes'],['Instance_Changes','instance','All_Changes']]],
 ['Data Access',[['Data_Access','data access']]],
 ['Data Loss Prevention',[['DLP_Incidents','dlp incident']]],
 ['Databases',[['All_Databases','database'],['Database_Instance','instance','All_Databases'],['Instance_Stats','stats','All_Databases'],['Session_Info','session','All_Databases'],['Lock_Info','lock','All_Databases'],['Database_Query','query','All_Databases'],['Tablespace','tablespace','All_Databases'],['Query_Stats','stats','All_Databases']]],
 ['Email',[['All_Email','email'],['Delivery','delivery','All_Email'],['Content','content','All_Email'],['Filtering','filter','All_Email']]],
 ['Endpoint',[['Ports','listening port'],['Processes','process report'],['Services','service report'],['Filesystem','endpoint filesystem'],['Registry','endpoint registry']]],
 ['Event Signatures',[['Signatures','track_event_signatures']]],
 ['Interprocess Messaging',[['All_Interprocess_Messaging','messaging']]],
 ['Intrusion Detection',[['IDS_Attacks','ids attack']]],
 ['Inventory',[['All_Inventory','inventory cpu|memory|network|storage|system+version|user|virtual'],['CPU','cpu','All_Inventory'],['Memory','memory','All_Inventory'],['Network','network','All_Inventory'],['Storage','storage','All_Inventory'],['OS','system version','All_Inventory'],['User','user','All_Inventory'],['Default_Accounts','default','All_Inventory'],['Virtual_OS','virtual','All_Inventory'],['Snapshot','snapshot','All_Inventory'],['Tools','tools','All_Inventory']]],
 ['Java Virtual Machines (JVM)',[['JVM','jvm'],['Threading','threading','JVM'],['Runtime','runtime','JVM'],['OS','os','JVM'],['Compilation','compilation','JVM'],['Classloading','classloading','JVM'],['Memory','memory','JVM']]],
 ['Malware',[['Malware_Attacks','malware attack'],['Malware_Operations','malware operations']]],
 ['Network Resolution (DNS)',[['DNS','network resolution dns']]],
 ['Network Sessions',[['All_Sessions','network session'],['Session_Start','start','All_Sessions'],['Session_End','end','All_Sessions'],['DHCP','dhcp','All_Sessions'],['VPN','vpn','All_Sessions']]],
 ['Network Traffic',[['All_Traffic','network communicate']]],
 ['Performance',[['All_Performance','performance cpu|facilities|memory|storage|network|os+uptime|os+time+synchronize'],['CPU','cpu','All_Performance'],['Facilities','facilities','All_Performance'],['Memory','memory','All_Performance'],['Storage','storage','All_Performance'],['Network','network','All_Performance'],['OS','os','All_Performance'],['Uptime','uptime','All_Performance'],['Timesync','time synchronize','All_Performance']]],
 ['Splunk Audit Logs',[['Modular_Actions','modaction']]],
 ['Ticket Management',[['All_Ticket_Management','ticketing'],['Change','change','All_Ticket_Management'],['Incident','incident','All_Ticket_Management'],['Problem','problem','All_Ticket_Management']]],
 ['Updates',[['Updates','update status'],['Update_Errors','update error']]],
 ['Vulnerabilities',[['Vulnerabilities','report vulnerability']]],
 ['Web',[['Web','web'],['Proxy','proxy','Web'],['Storage','storage','Web']]]
].map(([name,list])=>{const sets=list.map(([set,need,parent])=>({set,own:need.split(/\s+/).map(c=>c.split('|').map(a=>a.split('+'))),parent}));
 for(const s of sets){const up=[];for(let q=s;q;q=sets.find(x=>x.set===q.parent))up.unshift(...q.own);s.need=up;s.top=!s.parent}
 return {name,sets,root:sets.filter(s=>s.top)}});
const fits=(need,tags)=>need.every(clause=>clause.some(alt=>alt.every(t=>tags.has(t))));
const needTags=need=>new Set(need.flat(2));
// A dataset's tags in words: "network and communicate"; "performance and one of cpu, …, os with uptime".
const needWords=need=>and(need.map(c=>c.length>1?`one of ${or(c.map(a=>a.length>1?`${a[0]} with ${and(a.slice(1))}`:a[0]))}`:c[0].length>1?`${c[0][0]} with ${and(c[0].slice(1))}`:c[0][0]));
// The data models, and their datasets, that a set of tags fits.
function models(tags){const out=[];for(const m of CIM){const sets=m.sets.filter(s=>fits(s.need,tags));if(sets.some(s=>s.top))out.push({m,sets})}return out}

// ---- what the files say ----
let K={ets:new Map(),tagSets:[],byEt:new Map(),files:false,cache:new Map()};
const tagName=name=>{const m=name.match(/^([^=]+)=([\s\S]*)$/);if(!m||!m[1].trim()||!m[2].trim())return null;let v=m[2].trim();try{v=decodeURIComponent(v)}catch{}return {field:m[1].trim(),value:v}};
// The name a search sees: a props.conf rename gives the source type another one, and its old name is then only _sourcetype.
const searchName=T=>{const st=(pm.groups.props||[]).flatMap(f=>f.doc.stanzas).find(s=>s.primary&&s.kind==='sourcetype'&&s.name===T);return st?.keys.get('rename')?.value||T};
const enabled=ts=>ts?ts.tags.filter(x=>x.on):[];
// A tag line turns its tag off only with disabled: any other value but enabled turns it neither on nor off.
const isOff=x=>/^disabled$/i.test(x.r.value);

// The Config view's analysis, for these two kinds: the stage of each line, from its file and setting.
const KEYS=['search','disabled','priority','description','color','tags'];
function setting(r){
 if(r.file==='eventtypes'){const k=r.key;
  if(k==='search'){const p=parse(r.value);return p.bad?{area:'misplaced',stages:[TYPING],note:`An event type’s search can’t hold ${p.bad==='pipe'?'a pipe (|)':p.bad==='subsearch'?'a subsearch ([…])':'a macro without its closing `'}, so Splunk doesn’t use it.`}:{area:'stage',stages:[TYPING]}}
  if(k==='disabled')return {area:'stage',stages:[TYPING]};
  if(k==='priority')return {area:'stage',stages:[TYPING],note:'Orders the event types an event matches where Splunk Web lists them: 1 first, 10 last.'};
  if(k==='description'||k==='color')return {area:'stage',stages:[TYPING],note:'Splunk Web shows it. It doesn’t change which events match.'};
  // Deprecated, and its spec doesn't say whether Splunk still applies it: to check, with no verdict.
  if(k==='tags')return {area:'deprecated',missing:true,note:`Deprecated in eventtypes.conf: an event type’s tags go in tags.conf, as [eventtype=${r.stanza.name}]. This view reads them only there.`};
  const guess=cv.suggest?.(k,KEYS);return {area:'unknown',note:`Not an eventtypes.conf setting.${guess?` Did you mean ${guess.name}?${guess.caseOnly?' Setting names are case sensitive.':''}`:''} Splunk ignores this line.`}}
 if(r.file==='tags'){
  if(!tagName(r.stanza.name))return {area:'misplaced',stages:[TAGGING],note:'Its stanza doesn’t name a field and a value, so Splunk doesn’t use it.'};
  if(/^(enabled|disabled)$/i.test(r.value))return {area:'stage',stages:[TAGGING]};
  return {area:'misplaced',stages:[TAGGING],note:`A tag is turned on with ${r.key} = enabled, or off with ${r.key} = disabled. This line is neither.`}}
 return null}
function stanza(r){const st=r.stanza;
 if(r.file==='eventtypes')return st.implicit||st.name==='default'?{area:'stage',stages:[TYPING],label:'Settings for every event type',note:'Settings for every event type in this file.'}:{area:'stage',stages:[TYPING],label:'An event type'};
 if(r.file==='tags')return tagName(st.name)?{area:'stage',stages:[TAGGING],label:'Tags'}:{area:'unknown',note:'Not a tags.conf stanza: one names a field and a value, such as [eventtype=web_traffic] or [action=blocked].'};
 return null}

// Run at the end of the Config view's analysis: the event types and tags, merged as Splunk merges them; the source types
// each line belongs to; and what each stanza's line says.
function assign(){
 const E=(pm.groups.eventtypes||[]).flatMap(f=>f.doc.stanzas),G=(pm.groups.tags||[]).flatMap(f=>f.doc.stanzas);
 K={ets:new Map(),tagSets:[],byEt:new Map(),files:E.length+G.length>0,eventtypesLoaded:(pm.groups.eventtypes||[]).length>0,cache:new Map()};
 if(!K.files)return;
 for(const st of E){const off=st.keys.get('disabled');st.disabledBy=off&&truthy(off.value)?off:null;
  if(!st.primary||st.implicit||st.name==='default')continue;
  const r=st.keys.get('search'),p=r?parse(r.value):null;K.ets.set(st.name,{name:st.name,st,search:r,node:p?.node||null,bad:p?.bad||null})}
 for(const st of G){if(!st.primary)continue;const t=tagName(st.name);if(!t)continue;
  const ts={st,...t,tags:[...st.keys.values()].filter(r=>r&&!r.invalid).map(r=>({tag:r.key,r,on:/^enabled$/i.test(r.value)}))};K.tagSets.push(ts);
  if(t.field==='eventtype')K.byEt.set(t.value,ts)}
 // The source types the event types name outright join the list, so they can be followed.
 const add=new Set();for(const et of K.ets.values())for(const t of named(et.node))if(!pm.types.includes(t))add.add(t);
 if(add.size)pm.types=[...new Set([...pm.types,...add])].sort();
 // Each event type's source types: those its search takes, by the name a search sees. None named: any source type.
 for(const et of K.ets.values()){et.types=!et.node||et.bad?new Set():mentions(et.node)?new Set(pm.types.filter(T=>judge(et.node,searchName(T),new Set([et.name]))!==false)):null}
 for(const st of E){const et=K.ets.get(st.name);st.types=st.implicit||st.name==='default'?null:et?et.types:new Set()}
 for(const st of G){const t=tagName(st.name);
  st.types=!t?null:t.field==='eventtype'?(K.ets.has(t.value)?K.ets.get(t.value).types:K.eventtypesLoaded?new Set():null):t.field==='sourcetype'?new Set(pm.types.filter(T=>searchName(T).toLowerCase()===t.value.toLowerCase())):null}
 // What each stanza's line says.
 for(const f of [...(pm.groups.eventtypes||[]),...(pm.groups.tags||[])])for(const r of f.doc.lines){if(r.kind!=='stanza'||!r.m||r.m.area!=='stage')continue;
  const st=r.stanza;if(f.kind==='eventtypes'){if(st.implicit||st.name==='default')continue;Object.assign(r.m,eventNote(K.ets.get(st.name)))}
  else Object.assign(r.m,tagNote(st))}}
// An event type's line: which events it matches, its tags, and the data models they fit.
function eventNote(et){if(!et)return {};
 if(!et.search)return {missing:true,note:'It has no search, so it matches no events.'};
 if(et.bad)return {note:'Its search can’t be used: see its search line.'};
 const groups=new Map();for(const T of pm.types){const v=judge(et.node,searchName(T),new Set([et.name]));if(v===false)continue;const key=v===true?'':show(v);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(T)}
 const said=[];
 if(!mentions(et.node))said.push(`Events of any source type that match its search get eventtype=${et.name}.`);
 else if(!groups.size)said.push(`None of these files’ source types: its search asks for ${show(et.node)}.`);
 else for(const [when,types] of groups)said.push(`${when?`Events of ${and(types)} where ${when}`:`Every event of ${and(types)}`} ${when?'get':'gets'} eventtype=${et.name}.`);
 const ts=K.byEt.get(et.name),tags=enabled(ts).map(x=>x.tag),fit=models(new Set(tags));
 if(ts)said.push(tags.length?`tags.conf gives it ${and(tags)} (${at(lineOf(ts.st))}).`:`tags.conf turns ${ts.tags.length&&ts.tags.every(isOff)?'off all its tags':'on none of its tags'} (${at(lineOf(ts.st))}).`);
 else if((pm.groups.tags||[]).length)said.push('tags.conf gives it no tags.');
 if(fit.length)said.push(`With them, the CIM’s ${and(fit.map(x=>x.m.name))} data model${fit.length>1?'s take':' takes'} its events.`);
 const types=[...groups.values()].flat();
 return {label:types.length?`For ${types.slice(0,2).join(', ')}${types.length>2?` and ${types.length-2} more`:''}`:'An event type',note:said.join(' ')}}
// A tags.conf stanza's line: whose tags they are, and the data models they fit.
function tagNote(st){const t=tagName(st.name),ts=K.tagSets.find(x=>x.st===st)||{tags:[...st.keys.values()].filter(r=>r&&!r.invalid).map(r=>({tag:r.key,r,on:/^enabled$/i.test(r.value)}))},tags=enabled(ts).map(x=>x.tag),fit=models(new Set(tags)),off=ts.tags.filter(isOff).map(x=>x.tag);
 const label=tags.length?tags.join(', '):'No tags turned on';let who,missing=false;
 if(t.field==='eventtype'){const et=K.ets.get(t.value);
  if(et)who=`The tags of event type ${t.value}`;else if(K.eventtypesLoaded){who=`No eventtypes.conf stanza in these files is called ${t.value}, so these are the tags of an event type defined elsewhere`;missing=true}else who=`The tags of event type ${t.value}. Add eventtypes.conf to see which events it matches`}
 else if(t.field==='sourcetype')who=`The tags of every event of source type ${t.value}`;
 else who=`The tags of events where ${t.field}=${t.value}`;
 return {label,missing,note:`${who}${tags.length?`: ${and(tags)}`:''}.${off.length?` It turns off ${and(off)}.`:''}${fit.length?` With them, the CIM’s ${and(fit.map(x=>x.m.name))} data model${fit.length>1?'s take':' takes'} those events.`:''}`}}

// For a file of unknown kind: an eventtypes.conf has search lines; a tags.conf has [field=value] stanzas of tags.
function kindOf(text){const lines=text.split(/\r\n|\r|\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')),heads=lines.filter(l=>/^\[.*\]$/.test(l)),sets=lines.filter(l=>!/^\[.*\]$/.test(l));
 if(sets.some(l=>/^search\s*=/.test(l)))return'eventtypes';
 if(heads.length&&heads.every(h=>/^\[[^\]=]+=[^\]]+\]$/.test(h))&&sets.length&&sets.every(l=>/^[^=\s]+\s*=\s*(enabled|disabled)$/i.test(l)))return'tags';
 return null}

// ---- the source type map ----
// What reaches a source type: the event types whose searches take its events, and the tags.conf stanzas of field values
// its events can have; with the tags each gives, and the data models they fit.
function reach(T){if(K.cache.has(T))return K.cache.get(T);const S=searchName(T),rows=[];
 for(const et of K.ets.values()){if(!et.node||et.bad)continue;const v=judge(et.node,S,new Set([et.name]));if(v===false)continue;
  const ts=K.byEt.get(et.name);rows.push({kind:'eventtype',name:et.name,st:et.st,all:v===true,when:v===true?'':show(v),tags:enabled(ts).map(x=>x.tag),ts,off:!!et.st.disabledBy})}
 for(const ts of K.tagSets){if(ts.field==='eventtype')continue;
  if(ts.field==='sourcetype'){if(ts.value.toLowerCase()!==S.toLowerCase())continue;rows.push({kind:'field',name:ts.st.name,st:ts.st,all:true,when:'',tags:enabled(ts).map(x=>x.tag),ts})}
  else rows.push({kind:'field',name:ts.st.name,st:ts.st,all:false,when:`${ts.field}=${ts.value}`,tags:enabled(ts).map(x=>x.tag),ts})}
 // Every event has the tags of what takes every event; a row that takes some events adds its own to those.
 const base=new Set(rows.filter(x=>x.all&&!x.off).flatMap(x=>x.tags)),fed=new Map();
 for(const row of rows){if(row.off||!row.tags.length)continue;const tags=new Set([...base,...row.tags]);
  for(const {m,sets} of models(tags)){const tops=sets.filter(s=>s.top),need=new Set(tops.flatMap(s=>[...needTags(s.need)]));if(!row.tags.some(t=>need.has(t)))continue;
   if(!fed.has(m))fed.set(m,{m,rows:[],sets:new Set(),every:models(base).some(x=>x.m===m)});const x=fed.get(m);x.rows.push(row);sets.forEach(s=>x.sets.add(s))}}
 for(const x of fed.values()){const need=new Set(x.m.root.flatMap(s=>[...needTags(s.need)]));for(const row of rows)if(row.all&&!row.off&&!x.rows.includes(row)&&row.tags.some(t=>need.has(t)))x.rows.push(row);x.rows.sort((a,b)=>rows.indexOf(a)-rows.indexOf(b))}
 const first=x=>Math.min(...x.rows.map(r=>rows.indexOf(r)));
 const out={S,rows,base,fed:CIM.filter(m=>fed.has(m)).map(m=>fed.get(m)).sort((a,b)=>first(a)-first(b))};K.cache.set(T,out);return out}
// Folds of event types with no tags, as they were left for the visit.
const opened=new Map();
document.getElementById('configTypeMap217')?.addEventListener('toggle',e=>{const id=e.target.dataset?.etFold;if(id)opened.set(id,e.target.open)},true);
// The map's cards: the Search column's event types and tags, and the Data models column.
function forType(T,{nid,lineRef,stageChip,effect}){if(!K.files)return null;const R=reach(T);if(!R.rows.length)return null;
 const edges=[],search=[],model=[],ids=new Map();
 const offRow=row=>row.off||(lineOf(row.st)&&effect(lineOf(row.st))==='no');
 const rowHtml=row=>{const id=nid('E');ids.set(row,id);const head=lineOf(row.st),tagsAt=row.ts?lineOf(row.ts.st):null,off=offRow(row);
  return`<li class="tmEt222${off?' tmOff217':''}" id="${id}"><code title="[${esc(row.name)}]">[${breakable(row.name)}]</code><div><small class="tmEtWhen222"${row.when?` title="${esc(row.when)}"`:''}>${row.all?`Every event${row.kind==='field'?` of ${esc(R.S)}`:''}`:`Where ${esc(row.when)}`}</small>${head?lineRef(head):''}</div>${row.off?`<small class="tmEtWhen222">Disabled by ${lineRef(row.st.disabledBy)}</small>`:''}${row.tags.length?`<div class="tmEtTags222">${stageChip(TAGGING)}${row.tags.map(t=>`<span class="tmTag222">${esc(t)}</span>`).join('')}${row.kind==='eventtype'&&tagsAt?lineRef(tagsAt):''}</div>`:''}</li>`};
 const named=R.rows.filter(x=>x.kind==='eventtype'),fields=R.rows.filter(x=>x.kind==='field');
 if(named.length){const quiet=named.filter(x=>!x.tags.length),fold=quiet.length>3,shown=fold?named.filter(x=>x.tags.length):named,key=`eventtypes|${T}`,open=opened.get(key)||false;
  const off=named.every(offRow);
  search.push(`<article class="tmCard217 tmEts222${off?' tmOff217':''}" data-kind="eventtypes"><header><i class="propsFile205" data-file="eventtypes" title="eventtypes.conf">E</i><code>Event types</code><span class="tmAt217">${stageChip(TYPING)}</span></header><p class="tmSub217">${named.length} event type${named.length===1?' takes':'s take'} ${esc(T)}’s events${R.S!==T?`, searched as ${esc(R.S)}`:''}. Each gives the events it matches its name; tags.conf gives it tags.</p><ul class="tmEtList222">${shown.map(rowHtml).join('')}${fold?`<li class="tmFold221 tmEtFold222"><details data-et-fold="${esc(key)}"${open?' open':''}><summary><b>${quiet.length}</b> event types add no tags<small>${esc(quiet.slice(0,3).map(x=>x.name).join(', '))}${quiet.length>3?` and ${quiet.length-3} more`:''}</small></summary><ul class="tmEtList222">${quiet.map(rowHtml).join('')}</ul></details></li>`:''}</ul></article>`)}
 if(fields.length){const off=fields.every(offRow);search.push(`<article class="tmCard217 tmEts222${off?' tmOff217':''}" data-kind="tags"><header><i class="propsFile205" data-file="tags" title="tags.conf">#</i><code>Tags of field values</code><span class="tmAt217">${stageChip(TAGGING)}</span></header><p class="tmSub217">tags.conf tags the events that have these values.</p><ul class="tmEtList222">${fields.map(rowHtml).join('')}</ul></article>`)}
 // A data model's card: the tags its datasets require, what feeds it, and the datasets these events reach.
 for(const x of R.fed){const id=nid('M'),tops=x.m.root,reached=[...x.sets],off=x.rows.every(offRow);
  for(const row of x.rows)edges.push({from:ids.get(row),to:id,kind:'model'});
  const from=x.rows.map(r=>`[${breakable(r.name)}]`),need=tops.length===1?needWords(tops[0].need):or(tops.map(s=>`${needWords(s.need)} (${s.set})`));
  model.push(`<article class="tmCard217 tmResult217${off?' tmOff217':''}" id="${id}" data-kind="model" data-result="model"><header><span class="tmGlyph217" aria-hidden="true"></span><strong>${esc(x.m.name)}</strong><span class="tmCim222" title="A data model of the Splunk Common Information Model">CIM</span></header><p class="tmSub217">Takes events tagged ${esc(need)}.${x.every?` Every event of ${esc(T)} has those tags.`:''} From ${from.length>3?`${from.slice(0,3).join(', ')} and ${from.length-3} more`:and(from)}.</p><p class="tmDs222"><b>${reached.length===1?'Dataset':'Datasets'}</b> ${reached.map(s=>`<span>${breakable(s.set)}</span>`).join('')}</p></article>`)}
 if(!R.fed.length){const tags=[...new Set(R.rows.filter(x=>!x.off).flatMap(x=>x.tags))];model.push(`<p class="tmEmpty217">${tags.length?`No CIM data model takes ${esc(T)}’s events: their tags, ${esc(and(tags))}, don’t complete any data model’s.`:`These event types and tags give ${esc(T)}’s events no tags, so no CIM data model takes them.`}</p>`)}
 return {search,model,edges,count:R.rows.length,events:named.length,models:R.fed.length}}
const where='The Common Information Model’s data models these events’ tags fit. Each data model searches the indexes its CIM index macro allows: all of them unless it is set';

window.configEventTypes222={lex,parse,judge,show,mentions,named,CIM,fits,models,needWords,tagName,kindOf,setting,stanza,assign,reach,forType,where,searchName,knowledge:()=>K};
// Files read before this block loaded are read again, now that it can say what their lines do.
if(pm.files.length){cv.analyse();render()}
})();

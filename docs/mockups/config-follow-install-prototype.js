(function(){
/* Build 221: the Config view follows more of what the files say, and says where they act.
   - INGEST_EVAL: what each assignment can give is read from its expression, so the source type map follows a source
     type, an index, a queue or a host an expression names as it follows one a REGEX names.
   - With a source type chosen, the panel keeps the lines that give events that name: the line that runs a naming or
     copying transform, with the transform, and a rename line.
   - A monitor's whitelist and blacklist decide which [source::] stanzas its files can match.
   - An app package is told by its first bytes, so a .spl package opens; a plain tar and a zip open too.
   - Under the panel's summary: for each tier, the lines that take effect there, app by app.
   - In the map, a long run of search-time lines of one kind folds to a count.
   The Config view and the map call these where they did the work themselves. */
const cv=window.configView205,pm=state.configView205;if(!cv||!pm)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const article=name=>/^(HEC|[AEIO])/.test(name)?'an':'a';

// ---- INGEST_EVAL ----
// An eval expression's parts at the commas outside brackets and quotes.
function parts(s){const out=[];let depth=0,quote=null,start=0;
 for(let i=0;i<=s.length;i++){const c=s[i];if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue}
  if(c==='"'||c==="'")quote=c;else if(c==='(')depth++;else if(c===')')depth--;else if(i===s.length||(c===','&&!depth)){out.push(s.slice(start,i));start=i+1}}
 return out}
// Its assignments: the field each sets, with "=" or ":=", and the expression.
function assignments(expr){return parts(expr).map(p=>p.match(/^\s*([A-Za-z_][\w.-]*(?::[\w.-]+)*)\s*:?=(?!=)([\s\S]*)$/)).filter(Boolean).map(m=>({field:m[1],expr:m[2].trim()}))}
// name(args), when the first bracket closes at the end.
function call(s){const m=s.match(/^([A-Za-z_]\w*)\s*\(([\s\S]*)\)$/);if(!m)return null;let depth=0,quote=null;
 for(let i=0;i<m[2].length;i++){const c=m[2][i];if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue}if(c==='"'||c==="'")quote=c;else if(c==='(')depth++;else if(c===')'&&--depth<0)return null}
 return quote||depth?null:{name:m[1].toLowerCase(),args:parts(m[2]).map(a=>a.trim())}}
// What an expression can give a field: the text values it names, each with the tests that lead to it; whether it can
// leave the field as it was; and whether it can give something this can't name. if(), case() and coalesce() are followed:
// a coalesce()'s later value is reached where the earlier ones are null, and none is reached after a text.
function values(expr,field){const out={list:[],keeps:false,open:false},short=c=>{c=c.trim().replace(/\s+/g,' ');return c.length>70?c.slice(0,67)+'…':c};
 const walk=(s,when)=>{s=s.trim();while(s.startsWith('(')&&call('x'+s))s=s.slice(1,-1).trim();
  const text=s.match(/^"((?:\\.|[^"\\])*)"$/);if(text){out.list.push({value:text[1].replace(/\\(.)/g,'$1'),when});return}
  if(s===field){out.keeps=true;return}
  if(/^null\(\s*\)$/i.test(s))return;
  const f=call(s);
  if(f?.name==='if'&&f.args.length===3){walk(f.args[1],[...when,short(f.args[0])]);walk(f.args[2],[...when,`not (${short(f.args[0])})`]);return}
  if(f?.name==='case'&&f.args.length>1&&f.args.length%2===0){for(let i=0;i<f.args.length;i+=2)walk(f.args[i+1],[...when,/^(true\(\s*\)|1\s*==?\s*1)$/i.test(f.args[i])?'no earlier test holds':short(f.args[i])]);return}
  if(f?.name==='coalesce'){const before=[];for(const a of f.args){walk(a,[...when,...before]);if(/^"(?:\\.|[^"\\])*"$/.test(a))break;before.push(`isnull(${short(a)})`)}return}
  out.open=true};
 walk(expr,[]);return out}
// For the map: what an INGEST_EVAL transform leads to. A destination for each value an assignment names, and one that
// says "set by an expression" where it can give something else.
function evalOutcomes(expr,name){const out=[],cap=s=>s[0].toUpperCase()+s.slice(1);
 const say=when=>when.length?`Events where ${when.join(' and ')}, in [${name}]`:`Every event [${name}] runs on`;
 for(const {field:f,expr:e} of assignments(expr)){const v=values(e,f),each=make=>v.list.forEach(x=>out.push({...make(x.value),detail:say(x.when)})),rest=o=>{if(v.open)out.push(o)};
  if(f==='sourcetype'){each(x=>({kind:'retype',key:'retype:'+x,title:`Becomes ${x}`,type:x}));rest({kind:'meta',key:'meta:sourcetype',title:'Sourcetype set by an expression'})}
  else if(f==='index'){each(x=>({kind:'index',key:'index:'+x,title:`Index ${x}`}));rest({kind:'index',key:'index:?',title:'Index set by an expression'})}
  else if(f==='queue'){each(x=>/^nullQueue$/i.test(x)?{kind:'drop',key:'drop',title:'Dropped'}:{kind:'route',key:'queue:'+x,title:`Sent to ${x}`});rest({kind:'drop',key:'queue:?',title:'Queue set by an expression'})}
  else if(f==='host'||f==='source'){each(x=>({kind:'meta',key:`meta:${f}:${x}`,title:`${cap(f)} set to ${x}`}));rest({kind:'meta',key:'meta:'+f,title:`${cap(f)} set by an expression`})}
  else if(/^_(TCP|SYSLOG)_ROUTING$/.test(f)){each(x=>({kind:'route',key:'route:'+x,title:`Sent to ${x.split(',').map(s=>s.trim()).filter(Boolean).join(' and ')}`}));rest({kind:'route',key:'route:?',title:'Output set by an expression'})}
  else out.push(f==='_raw'?{kind:'text',key:'text',title:'Text rewritten'}:f==='_time'?{kind:'meta',key:'time',title:'Timestamp set by an expression'}:{kind:'field',key:'field:'+f,title:`Indexed field ${f}`})}
 return out}
// The source types an INGEST_EVAL names, as the map's named() gives a REGEX's.
function evalNames(expr){return [...new Set(assignments(expr).filter(a=>a.field==='sourcetype').flatMap(a=>values(a.expr,'sourcetype').list.map(x=>x.value)))].map(name=>({name,found:[]}))}

// ---- the panel's Source type list ----
// The source types a transform gives events: a copy's, and those a REGEX or an expression names.
function gives(st){if(!st)return[];const clone=st.keys.get('CLONE_SOURCETYPE')?.value;
 const named=st.keys.get('INGEST_EVAL')||st.keys.get('DEST_KEY')?.value==='MetaData:Sourcetype'?(window.configTypeMap217?.named?.(st)||[]).flatMap(x=>x.open?x.fits:[x.name]):[];
 return [...new Set([clone,...named].filter(Boolean))]}
// Run at the end of the Config view's analysis. A transform is in a source type's list when it gives events that name;
// so is the line that runs it, and a rename line, each with its stanza's header.
function follow(){const P=pm.groups.props||[],X=(pm.groups.transforms||[]).flatMap(f=>f.doc.stanzas);
 for(const st of X){if(!(st.types instanceof Set))continue;for(const t of gives(X.find(s=>s.primary&&s.name===st.name)))st.types.add(t)}
 for(const f of P){for(const st of f.doc.stanzas)st.also=null;
  for(const r of f.doc.settings){r.also=null;if(r.invalid||r.overriddenBy)continue;
   const names=r.key==='rename'?[r.value]:r.refs&&/^(TRANSFORMS|RULESET)-/.test(r.key)?r.refs.flatMap(n=>gives(X.find(s=>s.primary&&s.name===n))):[];
   if(names.length){r.also=new Set(names);r.stanza.also=new Set([...(r.stanza.also||[]),...names])}}}}

// ---- a monitor's whitelist and blacklist ----
// Splunk reads a file only if its path matches the whitelist, where there is one, and doesn't match the blacklist. Both
// are regular expressions searched for in the whole path. Whether any file a [source::] stanza names gets through is
// tried on paths made from the stanza's own pattern, its wildcards filled with plain text, with parts of the monitor's
// path, and with text the whitelist matches.
function pcre(src){let flags='';src=src.replace(/^\(\?([imsx]+)\)/,(m,f)=>{flags=f.replace(/[^ims]/g,'');return''}).replace(/\(\?P</g,'(?<').replace(/\\A/g,'^').replace(/\\[zZ]/g,'$');
 try{return {re:new RegExp(src,flags),src}}catch{return null}}
// A few strings a regular expression matches, built from its own text; null where it uses syntax this can't follow.
function samples(src,cap=10){let i=0,bad=false;
 const pick=re=>['x','a','1','A','_','-','.',' ','/','\\'].find(c=>re.test(c))??'';
 const cross=(a,b)=>{const out=[];for(const x of a)for(const y of b){out.push(x+y);if(out.length>=cap)return out}return out};
 const atom=()=>{const c=src[i];
  if(c==='('){i++;if(src[i]==='?'){const m=src.slice(i).match(/^\?(?::|<[A-Za-z_]\w*>|'[^']*')/);if(!m){bad=true;return[]}i+=m[0].length}
   const a=alt();if(src[i]!==')'){bad=true;return[]}i++;return a}
  if(c==='['){let j=i+1;if(src[j]==='^')j++;if(src[j]===']')j++;for(;j<src.length&&src[j]!==']';j++)if(src[j]==='\\')j++;
   if(j>=src.length){bad=true;return[]}const text=src.slice(i,j+1);i=j+1;try{return [pick(new RegExp('^'+text+'$'))]}catch{bad=true;return[]}}
  if(c==='\\'){const e=src[i+1];i+=2;if(e===undefined||/\d/.test(e)){bad=true;return[]}
   if(/[bB]/.test(e))return [''];if(/[dDwWsS]/.test(e))return [pick(new RegExp('^\\'+e+'$'))];return [{n:'\n',t:'\t',r:'\r'}[e]||e]}
  i++;return [c==='.'?'x':c==='^'||c==='$'?'':c]};
 const seq=()=>{let out=[''];
  while(i<src.length&&src[i]!=='|'&&src[i]!==')'&&!bad){let a=atom(),reps=null;const q=src[i];
   if(q==='*'||q==='?'){i++;reps=[0,1]}else if(q==='+'){i++;reps=[1,2]}
   else if(q==='{'){const m=src.slice(i).match(/^\{(\d+)(,(\d*))?\}/);if(m){i+=m[0].length;const lo=+m[1];reps=m[2]===undefined?[lo]:[lo,m[3]?Math.min(+m[3],lo+1):lo+1]}}
   if(reps&&(src[i]==='?'||src[i]==='+'))i++;
   if(reps)a=[...new Set(reps.flatMap(n=>a.map(x=>x.repeat(Math.min(n,40)))))].slice(0,cap);
   out=cross(out,a)}
  return out};
 const alt=()=>{const out=[];for(;;){out.push(...seq());if(src[i]==='|'&&!bad){i++;continue}break}return out.slice(0,cap)};
 const out=alt();return bad||i<src.length?null:[...new Set(out)]}
// A [source::] pattern and a monitor's path, as Splunk reads them: "..." any run, "*" any run in one segment.
const wild=(p,stanza)=>{let out='';for(let i=0;i<p.length;){if(p.startsWith('...',i)){out+='.*';i+=3}else if(p[i]==='*'){out+='[^/\\\\]*';i++}else if(stanza&&p[i]==='\\'){out+=p.slice(i,i+2);i+=2}else if(stanza&&p[i]!=='.'){out+=p[i];i++}else{out+=p[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');i++}}return out};
// true: a file the stanza names gets through. A filter's name: none found, and that filter is why. null: can't tell,
// or the stanza names no file of the monitor's.
// The text a pattern starts with, before its first wildcard or regular expression character.
const lead=(p,stanza)=>stanza?p.match(/^(?:\\\\|(?!\.\.\.)[^*|()[\]?+{}^$\\])*/)[0].replace(/\\\\/g,'\\'):p.match(/^(?:(?!\.\.\.)[^*])*/)[0];
const verdicts=new Map();
function through(path,name,white,black){const key=[path,name,white,black].join('\n');if(!verdicts.has(key)){if(verdicts.size>4000)verdicts.clear();verdicts.set(key,decide(path,name,white,black))}return verdicts.get(key)}
function decide(path,name,white,black){const W=white?pcre(white):null,B=black?pcre(black):null;if((white&&!W)||(black&&!B))return null;
 // Splunk makes a whitelist of the wildcards in a monitor's path. How a whitelist written beside them combines with it
 // isn't worked out here: such a monitor is left as it was.
 if(white&&/\.\.\.|\*/.test(path))return null;
 // Nothing to decide where neither pattern starts as the other does: the stanza names no file of the monitor's.
 const ls=lead(name,true),lm=lead(path,false);if(!ls.startsWith(lm)&&!lm.startsWith(ls))return null;
 let S,M;try{S=new RegExp('^(?:'+wild(name,true)+')$');M=new RegExp('^(?:'+wild(path.replace(/[/\\]$/,''),false)+')(?:[/\\\\].*)?$')}catch{return null}
 const mine=p=>S.test(p)&&M.test(p),passW=p=>!W||W.re.test(p),passB=p=>!B||!B.re.test(p);
 const plain=!/[|()[\]?+{}^$\\]/.test(name.replace(/\\\\/g,''));
 // The paths to try. A pattern written as a regular expression is tried on its own samples only.
 let tried=[],sure=true;
 if(!plain){tried=samples(wild(name,true))||[];sure=false}
 else{const bits=name.replace(/\\\\/g,'\\').split(/(\.\.\.|\*)/),holes=bits.map((b,i)=>b==='...'||b==='*'?i:-1).filter(i=>i>=0);
  if(!holes.length)tried=[bits.join('')];
  else{const at=path.replace(/\.\.\.|\*/g,'x').replace(/[/\\]$/,''),seps=[...at.matchAll(/[/\\]/g)].map(m=>m.index);
   const base=['x','a0','0','aaaaaaaaaaaaaaaaaaaaaaaa','','x/x',at,at+'/x',...seps.map(i=>at.slice(0,i)),...seps.map(i=>at.slice(i+1))].filter((v,i,a)=>a.indexOf(v)===i);
   // Text the whitelist matches, whole and in pieces: each sample, its path segments, and their parts.
   const more=[];
   if(W){const ws=(samples(W.src)||[]).filter(x=>W.re.test(x));if(!ws.length)sure=false;
    for(const x of ws){const cut=[];for(const piece of [x,...x.split(/[/\\]/)])for(let a=0;a<piece.length;a++)for(let b=piece.length;b>a;b--)if(cut.length<60&&(piece.length<=16||a===0||b===piece.length))cut.push(piece.slice(a,b));more.push(...cut)}}
   const fill=vals=>{const p=[...bits];holes.forEach((h,k)=>p[h]=vals[k]);return p.join('')},all=[...new Set([...base,...more])];
   if(holes.length===1)tried=all.map(v=>fill([v]));
   else if(holes.length===2){const few=all.slice(0,120);for(const a of few)for(const b of few)tried.push(fill([a,b]))}
   else{for(const v of base)tried.push(fill(holes.map(()=>v)));for(let k=0;k<holes.length;k++)for(const v of all)tried.push(fill(holes.map((h,j)=>j===k?v:'x')));if(W)sure=false}}}
 tried=[...new Set(tried)].filter(mine);
 if(!tried.length)return null;
 if(tried.some(p=>passW(p)&&passB(p)))return true;
 if(!sure)return null;
 return tried.some(passW)?'blacklist':'whitelist'}
const matchBefore=window.configSourceMatches207;
if(matchBefore)window.configSourceMatches207=function(path,stanzas,where,input){
 const white=input?.keys?.get('whitelist')?.value,black=input?.keys?.get('blacklist')?.value;if(!white&&!black)return matchBefore(path,stanzas,where);
 const names=[...new Set(stanzas.map(s=>s.name))],why=new Map(names.map(n=>[n,through(path,n.slice(8),white,black)])),out=names.filter(n=>why.get(n)==='whitelist'||why.get(n)==='blacklist');
 if(!out.length)return matchBefore(path,stanzas,where);
 // The line says so of each stanza it would otherwise speak of, and not of one another stanza overrides anyway.
 let cur=stanzas,note=matchBefore(path,cur,where).note;const told=[];
 for(let again=true;again;){again=false;
  for(const n of out){if(told.includes(n))continue;const rest=cur.filter(s=>s.name!==n),after=matchBefore(path,rest,where).note;if(after!==note){told.push(n);cur=rest;note=after;again=true}}}
 const list=a=>a.length>1?a.slice(0,-1).join(', ')+' or '+a.at(-1):a[0],by=k=>told.filter(n=>why.get(n)===k).map(n=>`[${n}]`),W=by('whitelist'),B=by('blacklist');
 return {...matchBefore(path,stanzas.filter(s=>!out.includes(s.name)),where),left:[W.length?`Its whitelist lets through none of the files ${list(W)} names.`:'',B.length?`Its blacklist leaves out every file ${list(B)} names.`:''].filter(Boolean).join(' ')}};

// ---- app packages ----
// What a file is, from its first bytes: a gzip file, a tar archive, a zip archive, or none of them.
async function kindOf(file){const b=new Uint8Array(await file.slice(0,512).arrayBuffer());
 if(b[0]===0x1f&&b[1]===0x8b)return'gzip';
 if(b[0]===0x50&&b[1]===0x4b&&((b[2]===3&&b[3]===4)||(b[2]===5&&b[3]===6)))return'zip';
 return b.length>=262&&String.fromCharCode(...b.subarray(257,262))==='ustar'?'tar':null}
const wanted=name=>/^(inputs|props|transforms)\.conf$/i.test(name)||/\.spl2?$/i.test(name);
function safePath(raw){const p=raw.replace(/\\/g,'/');if(p.startsWith('/')||/^[A-Za-z]:/.test(p)||p.includes('\0'))throw Error('Unsafe path in app package');const bits=p.split('/').filter(x=>x&&x!=='.');if(bits.includes('..'))throw Error('Unsafe path in app package');return bits.join('/')}
// A zip archive's configuration and SPL2 files, read from its directory at the end; nothing else is expanded.
async function unzip(file){
 if(file.size>64*1024*1024)throw Error('App package is over 64 MiB');
 const b=new Uint8Array(await file.arrayBuffer()),v=new DataView(b.buffer),u16=o=>v.getUint16(o,true),u32=o=>v.getUint32(o,true),dec=new TextDecoder();
 let end=b.length-22;const stop=Math.max(0,end-65535);while(end>=stop&&u32(end)!==0x06054b50)end--;
 if(end<stop)throw Error('Invalid app package: the zip file has no directory');
 const count=u16(end+10);let at=u32(end+16);
 if(count===0xffff||at===0xffffffff)throw Error('This zip file is in the Zip64 format, which isn’t read here; extract it and use Upload a folder');
 if(count>20000)throw Error('App package contains too many entries');
 const out=[],root=file.name.replace(/\.zip$/i,'');let total=0;
 for(let n=0;n<count;n++){if(at+46>b.length||u32(at)!==0x02014b50)throw Error('Invalid app package: the zip file’s directory is damaged');
  const flags=u16(at+8),method=u16(at+10),packed=u32(at+20),size=u32(at+24),local=u32(at+42),raw=dec.decode(b.subarray(at+46,at+46+u16(at+28)));at+=46+u16(at+28)+u16(at+30)+u16(at+32);
  if(raw.endsWith('/'))continue;const path=safePath(raw),name=path.split('/').pop();if(!wanted(name))continue;
  if(flags&1)throw Error(`${name} is encrypted`);
  total+=size;if(total>256*1024*1024)throw Error('Expanded app package is over 256 MiB');
  if(local+30>b.length||u32(local)!==0x04034b50)throw Error('Invalid app package: the zip file is damaged');
  const start=local+30+u16(local+26)+u16(local+28),data=b.subarray(start,start+packed);if(start+packed>b.length)throw Error('App package is truncated');
  let body;if(method===0)body=data;
  else if(method===8){let stream;try{stream=new DecompressionStream('deflate-raw')}catch{throw Error('This browser cannot open zip app packages; extract the package and use Upload a folder')}
   const reader=new Blob([data]).stream().pipeThrough(stream).getReader(),chunks=[];let got=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;got+=value.length;if(got>size+1024){await reader.cancel();throw Error('too long')}chunks.push(value)}}catch{throw Error(`Cannot expand ${name}: the zip file is invalid or incomplete`)}
   body=new Blob(chunks)}
  else throw Error(`${name} is packed in a way that isn’t read here`);
  out.push({file:new File([body],name,{type:'text/plain'}),path:path.includes('/')?path:root+'/'+path})}
 if(!out.length)throw Error('App package contains no inputs.conf, props.conf, transforms.conf or SPL2 pipeline files');
 return out}
// For the Config view's readFiles: how to open an entry that is a package; nothing for one that isn't. Only files a
// package's name can have are looked into, so a folder's other files aren't read twice.
async function opener({file,path}){const pk=window.configAppPackages219;
 if(!pk||!/\.(tar\.gz|tgz|spl|tar|zip)$/i.test(path))return null;
 const kind=await kindOf(file),named=/\.(tar\.gz|tgz)$/i.test(path);
 if(kind==='gzip'||named)return()=>pk.expand(file);
 if(kind==='zip')return()=>unzip(file);
 if(kind==='tar')return async()=>{if(file.size>256*1024*1024)throw Error('Expanded app package is over 256 MiB');
  if(typeof CompressionStream!=='function')throw Error('This browser cannot open tar app packages; extract the package and use Upload a folder');
  // The package reader takes a gzip tar: the plain tar is given to it as one.
  return pk.expand(new File([await new Response(file.stream().pipeThrough(new CompressionStream('gzip'))).blob()],file.name.replace(/\.tar$/i,'')+'.tgz'))};
 if(/\.(tar|zip)$/i.test(path))return()=>{throw Error(`It isn’t a ${/\.zip$/i.test(path)?'zip':'tar'} archive`)};
 return null}

// ---- where the files act ----
const TIERS=[['uf','Universal Forwarder'],['hf','Heavy Forwarder'],['idx','Indexer'],['sh','Search Head']];
// Under the panel's summary: for each tier, the lines that take effect there, app by app. A tier is a button that
// chooses its component in the strip, where the panel says which lines they are. The apps are in the order Splunk
// reads them, then etc/system's files, then files uploaded with no folder.
function install(){const lines=cv.counted().filter(r=>!r.overriddenBy&&r.m.area==='stage');if(!lines.length)return'';
 const SYS='etc/system',group=new Map(pm.files.map(f=>[f.id,f.place.app||(f.place.layer.startsWith('system')?SYS:'')])),last=a=>a===''?2:a===SYS?1:0,picked=state.component||'all';
 // One pass over the lines: for each app, how many there are, and for each tier how many take effect there and how
 // many only for data that tier reads itself.
 const tally=new Map();
 for(const r of lines){const app=group.get(r.fid)??'';let t=tally.get(app);if(!t)tally.set(app,t={n:0,on:{},own:{}});t.n++;
  for(const [k] of TIERS){const e=cv.effect(r,k);if(e==='required'||e==='conditional')t.on[k]=(t.on[k]||0)+1;else if(e==='own')t.own[k]=(t.own[k]||0)+1}}
 const apps=[...tally.keys()].sort((a,b)=>last(a)-last(b)||(a<b?-1:a>b?1:0));
 const row=app=>{const t=tally.get(app);
  return`<div class="cfInstallRow221"${apps.length>1?` data-install-app="${esc(app)}"`:''}>${apps.length>1?`<span class="cfInstallApp221">${app?esc(app):'Files with no app'}</span>`:''}${TIERS.map(([k,name])=>{const on=t.on[k]||0,own=t.own[k]||0;
   return`<button type="button" class="cfTier221${on?'':' cfNone221'}" data-install-tier="${k}" aria-pressed="${picked===k}" title="${esc(`${on?`${on} of ${t.n} lines take effect on ${article(name)} ${name}`:`None of ${t.n} lines takes effect on ${article(name)} ${name}`}${own?`; ${own} more only for data it reads itself`:''}. ${picked===k?'Chosen in the strip: press again for all components':'Choose it to see which'}.`)}"><b>${on}</b><span>${name}</span>${own?`<small>+${own} for its own data</small>`:''}</button>`}).join('')}</div>`};
 return`<div class="cfInstall221" role="group" aria-label="Where these files act"><div class="cfInstallHead221"><strong>Where ${apps.length>1?'each app':'it'} acts</strong><span>The lines that take effect on each tier. Index-time lines count on both the Heavy Forwarder and the Indexer: they act on whichever parses the data first.</span></div>${apps.map(row).join('')}</div>`}
document.getElementById('configView205')?.addEventListener('click',e=>{const b=e.target.closest?.('[data-install-tier]');if(!b)return;const k=b.dataset.installTier,app=b.closest('[data-install-app]')?.dataset.installApp;
 document.querySelector(`.component[data-component="${b.getAttribute('aria-pressed')==='true'?'all':k}"]`)?.click();
 // The panel is drawn again: the tier keeps the focus.
 const rows=[...document.querySelectorAll('#configView205 .cfInstallRow221')];(rows.find(r=>r.dataset.installApp===app)||rows[0])?.querySelector(`[data-install-tier="${k}"]`)?.focus()});

// ---- the map's long runs ----
// A run of six or more search-time lines of one kind folds to its count and its first names; it opens in place, and
// stays as it was left for the visit. A run with a line that names a missing transform starts open.
const KINDS={'EXTRACT-':'Inline extractions','REPORT-':'Transform extractions','FIELDALIAS-':'Field aliases','EVAL-':'Calculated fields','LOOKUP-':'Lookups'},opened=new Map();
function fold(lines,items,key){const out=[];
 for(let i=0;i<lines.length;){const cls=(lines[i].key.match(/^[A-Z_]+-/)||[''])[0];let j=i+1;while(cls&&j<lines.length&&lines[j].key.startsWith(cls))j++;
  if(!KINDS[cls]||j-i<6){out.push(...items.slice(i,j));i=j;continue}
  const id=key+'|'+cls,names=lines.slice(i,j).map(r=>r.key.slice(cls.length)),open=opened.has(id)?opened.get(id):items.slice(i,j).some(x=>x.includes('tmMissing217'));
  out.push(`<li class="tmFold221"><details data-tm-fold="${esc(id)}"${open?' open':''}><summary><b>${j-i}</b> ${esc(cls)} lines<small>${KINDS[cls]}: ${esc(names.slice(0,3).join(', '))}${names.length>3?` and ${names.length-3} more`:''}</small></summary><ul>${items.slice(i,j).join('')}</ul></details></li>`);i=j}
 return out.join('')}
document.getElementById('configTypeMap217')?.addEventListener('toggle',e=>{const id=e.target.dataset?.tmFold;if(id)opened.set(id,e.target.open)},true);

window.configFollow221={assignments,values,evalOutcomes,evalNames,gives,follow,through,samples,kindOf,unzip,opener,install,fold};
})();

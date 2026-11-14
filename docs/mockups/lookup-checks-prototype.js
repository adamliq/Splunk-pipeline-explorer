(function(){
/* Build 223: lookup checks. The Config view reads the lookup files an app keeps in its lookups folder: from app
   packages, from folders, and .csv files picked on their own. For each lookup transforms.conf defines with a filename,
   it says whether that file is there; for each LOOKUP- line in props.conf, whether the fields it names are columns of
   the lookup's file, or of its fields_list. The panel's lines say what it finds, a lookups tab lists the files, and the
   source type map shows it beside each lookup. With no lookup file read, and no app read whole from a package or a
   folder, nothing changes. */
const cv=window.configView205,pm=state.configView205;if(!cv||!pm)return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const and=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a.at(-1):a[0]||'';
const plural=(n,one,many)=>`${n.toLocaleString('en-US')} ${n===1?one:many||one+'s'}`;
const MAX=20e6,HEAD=262144,SYSTEM='etc/system';
// What is known: the lookup files read, by path; the apps read whole; and whether the lookups tab is on show.
const L={files:new Map(),complete:new Set(),defs:new Map(),uses:new Map(),active:false,tab:null,version:0};

// ---- which files are lookups, and whose ----
// Folders Splunk doesn't merge with the instance's own: each user's, and those it sends to other instances.
const held=path=>{const p=path.replace(/\\/g,'/').split('/').filter(Boolean),i=p.lastIndexOf('etc');return p.at(-5)==='users'||i>=0&&['deployment-apps','manager-apps','master-apps','shcluster'].includes(p[i+1])};
// A lookup file: a .csv or .csv.gz in a lookups folder, or picked on its own.
const takes=path=>/\.csv(\.gz)?$/i.test(path)&&(!/[\\/]/.test(path)||/(^|[\\/])lookups[\\/][^\\/]+$/i.test(path))&&!held(path);
// The app a lookup file is in: the folder above its lookups folder. etc/system has lookups of its own.
function appOf(path){const p=path.replace(/\\/g,'/').split('/').filter(Boolean),i=p.length-2;if(i<1||p[i].toLowerCase()!=='lookups')return null;return p[i-1]==='system'&&(i<2||p[i-2]==='etc')?SYSTEM:p[i-1]}
// The app a configuration file is in, as the Config view placed it.
const appOfFile=f=>f?.place?.app||(String(f?.place?.layer||'').startsWith('system')?SYSTEM:null);
const fileOf=r=>pm.files.find(f=>f.id===r?.fid);
const label=f=>f?.path&&f.path.includes('/')?f.path:f?.name||'';
const at=r=>`${label(fileOf(r))} line ${r.n}`;
// Lines of several files: "props.conf lines 29, 91 and 144".
function atMany(rs){const by=new Map();for(const r of rs){const k=label(fileOf(r));if(!by.has(k))by.set(k,[]);by.get(k).push(r.n)}
 return and([...by].map(([k,ns])=>`${k} ${ns.length>1?'lines':'line'} ${and(ns)}`))}
// An app read whole, from a package or a folder: its lookups folder, or that it has none, is known.
function seen(list){for(const {path} of list){if(!/[\\/]/.test(path)||held(path))continue;const p=cv.placeOf(path),a=p?p.app||(p.layer.startsWith('system')?SYSTEM:null):appOf(path);if(a&&!L.complete.has(a)){L.complete.add(a);L.version++}}}

// ---- a CSV file ----
// Its first record: the column names as written. Quotes come off; spaces stay, since Splunk may keep them.
function header(text){text=text.replace(/^﻿/,'');const out=[];let cur='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c;continue}
  if(c==='"'&&!cur.trim()){q=true;continue}
  if(c===','){out.push(cur);cur='';continue}
  if(c==='\n'||c==='\r')break;
  cur+=c}
 out.push(cur);return out.length===1&&!out[0].trim()?[]:out.map(raw=>({raw,name:raw.trim()}))}
// Its records after the first. A quoted value can hold a line break; a blank line isn't a record.
function countRows(text){let n=0,q=false,live=false;
 for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);
  if(c===34){q=!q;live=true;continue}
  if(!q&&(c===10||c===13)){if(live)n++;live=false;continue}
  if(c!==32&&c!==9&&c!==0xFEFF)live=true}
 if(live)n++;return Math.max(0,n-1)}
function put(path,text,{bytes=text.length,gz=false,partial=false}={}){const name=path.split(/[\\/]/).pop();
 if(text.includes('\u0000'))return`${name} isn’t a text file`;
 const columns=header(text);if(!columns.length)return`${name} has no header row`;
 L.files.set(path,{path,name,app:appOf(path),columns,rows:partial?null:countRows(text),bytes,gz});L.version++;return null}
// A file from a picker, a folder or a package. Over 20 MB, only its header is read, and its rows aren't counted.
async function add(file,path){const gz=/\.gz$/i.test(path);let text;
 try{if(gz){if(typeof DecompressionStream!=='function')return`${path}: this browser can’t decompress it`;text=await new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text()}
  else text=file.size>MAX?await file.slice(0,HEAD).text():await file.text()}
 catch(e){return`${path}: it can’t be read (${e.message})`}
 return put(path,text,{bytes:file.size,gz,partial:!gz&&file.size>MAX})}

// ---- a LOOKUP- line ----
// LOOKUP-<class> = <lookup> <field> [AS <event field>] … [OUTPUT|OUTPUTNEW <field> [AS <event field>] …]. Fields may
// be quoted and separated by commas; AS and OUTPUT are read in any case.
function parseLookup(value){const t=[];const re=/"((?:[^"\\]|\\.)*)"|([^\s,"]+)/g;let m;while((m=re.exec(value)))t.push(m[1]!==undefined?{v:m[1].replace(/\\(.)/g,'$1'),q:true}:{v:m[2]});
 if(!t.length)return {bad:'empty',match:[],output:[]};
 const out={table:t[0].v,match:[],output:[],mode:null};let list=out.match;
 for(let i=1;i<t.length;i++){const w=t[i];
  if(!w.q&&!out.mode&&/^(OUTPUT|OUTPUTNEW)$/i.test(w.v)){out.mode=w.v.toUpperCase();list=out.output;continue}
  if(!w.q&&/^as$/i.test(w.v)&&list.length&&t[i+1]){list.at(-1).as=t[++i].v;continue}
  list.push({field:w.v})}
 if(!out.match.length)out.bad='nomatch';return out}
// A field among a lookup's columns: as written; or only once the spaces round a column's name are left out; or in
// another case; or not at all, with the nearest name.
function find(cols,field){if(cols.some(c=>c.raw===field))return {ok:true};
 const sp=cols.find(c=>c.name===field);if(sp)return {space:sp.raw};
 const ci=cols.find(c=>c.name.toLowerCase()===field.toLowerCase());if(ci)return {cased:ci.name};
 const near=cv.suggest?.(field,cols.map(c=>c.name).filter(Boolean));return {none:true,near:near?.name||null}}

// ---- the lookups transforms.conf defines ----
function definitions(){const out=new Map();
 for(const [name,role] of pm.roles||[]){if(!role.lookup)continue;const keys=pm.merged?.transforms?.get(name);if(!keys)continue;
  const line=k=>keys.get(k)||null,val=k=>String(keys.get(k)?.value||'').trim(),head=line('filename')||line('collection')||line('external_cmd');
  out.set(name,{name,role,line,filename:val('filename'),fieldsList:val('fields_list'),app:appOfFile(fileOf(head))})}
 return out}
// The file a lookup's filename names: in its own app's lookups folder, or picked on its own; else another app's.
function fileFor(def){if(!def?.filename)return null;const want=def.filename.split(/[\\/]/).pop(),all=[...L.files.values()].filter(f=>f.name===want);
 const here=all.find(f=>f.app===def.app)||all.find(f=>!f.app),other=all.find(f=>f.app&&f.app!==def.app);
 if(here)return {file:here,how:'here'};if(other)return {file:other,how:'other'};
 return {file:null,how:def.app&&L.complete.has(def.app)?'missing':L.files.size?'unread':'unknown'}}
// The names a lookup's fields are checked against: its file's columns, or its fields_list.
function columnsOf(def){if(!def)return null;
 if(def.filename){const x=fileFor(def);return x?.file?{kind:'file',file:x.file,cols:x.file.columns,label:x.file.name}:null}
 if(def.fieldsList)return {kind:'list',cols:def.fieldsList.split(',').map(s=>s.trim()).filter(Boolean).map(s=>({raw:s,name:s})),label:'its fields_list'};
 return null}
const show=c=>c.raw===c.name?c.name:`“${c.raw}”`;
const rowsOf=f=>f.rows===null?'over 20 MB, so its rows aren’t counted':plural(f.rows,'row');
const lookupsOf=a=>`${a?a===SYSTEM?'etc/system':a:'the app'}/lookups/`;
// What's wrong with some fields, in sentences.
function problems(src,bad){const out=[],name=src.label,file=src.kind==='file';
 for(const x of bad.filter(y=>y.none))out.push(`${file?`${name} has no column`:'Its fields_list has no field'} ${x.f.field}${x.near?`: did you mean ${x.near}?`:'.'}`);
 for(const x of bad.filter(y=>y.cased))out.push(`${file?`${name}’s column`:'The field in its fields_list'} is ${x.cased}, not ${x.f.field}: field names are case sensitive.`);
 const sp=bad.filter(y=>y.space!==undefined);
 if(sp.length){const lead=sp.every(y=>/^\s/.test(y.space)&&!/\s$/.test(y.space)),many=sp.length>1;
  out.push(`${name}’s header writes ${and(sp.map(y=>`“${y.space}”`))}, with ${lead?`a space before ${many?'each':'it'}`:`spaces round ${many?'them':'it'}`}. Run | inputlookup ${name} to see whether Splunk reads ${many?'them':'it'} as ${and(sp.map(y=>y.f.field))}.`)}
 return out}
function describe(p,cols){const nm=f=>f.as&&f.as!==f.field?`${f.field} (the event’s ${f.as})`:f.field;let s=`It matches on ${and(p.match.map(nm))}`;
 if(p.output.length){const out=p.output.map(f=>f.as&&f.as!==f.field?`${f.field} as ${f.as}`:f.field);s+=`, and outputs ${and(out)}${p.mode==='OUTPUTNEW'?`, unless the event has ${out.length>1?'them':'it'} already`:''}`}
 else{const rest=cols.map(c=>c.name).filter(n=>n&&!p.match.some(f=>f.field===n));s+=rest.length?`, and outputs the other ${rest.length===1?'column':'columns'}: ${and(rest)}`:', and has no other column to output'}
 return s+'.'}
// A LOOKUP- line: what it reads and writes, and whether its fields are there.
function lookupNote(r){const p=parseLookup(r.value);
 if(p.bad)return {note:'It names no field to match on, so Splunk can’t run this lookup.',problem:true};
 const def=L.defs.get(r.refs?.[0]);if(!def)return null;
 const src=columnsOf(def);
 if(!src){const x=fileFor(def);return x?.how==='missing'?{note:`Its file isn’t there: see ${at(def.line('filename'))}.`}:x?.how==='unread'?{note:`${def.filename} isn’t among the lookup files read, so its fields can’t be checked.`}:null}
 const named=[...p.match,...p.output],bad=named.map(f=>({f,...find(src.cols,f.field)})).filter(x=>!x.ok),what=describe(p,src.cols);
 if(!bad.length)return {note:`${what} ${named.length===1?`${named[0].field} is ${src.kind==='file'?'a column of':'in'}`:`${named.length===2?'Both':'All'} are ${src.kind==='file'?'columns of':'in'}`} ${src.label}.`};
 return {note:`${what} ${problems(src,bad).join(' ')}`,problem:true}}
// A transforms.conf line that names fields of the lookup's own: match_type's WILDCARD() and CIDR(), and time_field.
function fieldsNote(def,r,fields){const src=columnsOf(def);if(!src||!fields.length)return null;
 const bad=fields.map(field=>({f:{field},...find(src.cols,field)})).filter(x=>!x.ok);
 if(!bad.length)return {note:`${fields.length===1?`${fields[0]} is ${src.kind==='file'?'a column of':'in'}`:`${and(fields)} are ${src.kind==='file'?'columns of':'in'}`} ${src.label}.`};
 return {note:problems(src,bad).join(' '),problem:true}}
// A lookup's filename line: where its file is, its rows and its columns.
function fileNote(def){const x=fileFor(def);if(!x)return null;const f=x.file,cols=f?`${f.columns.length===1?'column':'columns'} ${and(f.columns.map(show))}`:'';
 if(x.how==='here')return {note:`${f.path}: ${rowsOf(f)}, with the ${cols}.`};
 if(x.how==='other')return {note:`${lookupsOf(def.app)} has no ${def.filename}, but ${lookupsOf(f.app)} has: Splunk finds it there only if ${f.app===SYSTEM?'etc/system':f.app} shares it with other apps. ${rowsOf(f).replace(/^./,c=>c.toUpperCase())}, with the ${cols}.`};
 if(x.how==='missing'){const there=[...L.files.values()].filter(y=>y.app===def.app).map(y=>y.name),near=cv.suggest?.(def.filename,there);
  return {note:`${lookupsOf(def.app)} has no ${def.filename}${there.length?`: it has ${and(there)}${near?`. Did you mean ${near.name}?`:''}`:', and the app has no lookup files'}. Splunk can’t use this lookup unless another app shares a file of that name.`,problem:true}}
 if(x.how==='unread')return {note:`None of the lookup files read is called ${def.filename}. Add ${lookupsOf(def.app)} or the file to check it.`};
 return null}

// Run at the end of the Config view's analysis, after each line has its stage and note.
function check(){L.defs=new Map();L.uses=new Map();if(!L.files.size&&!L.complete.size)return;
 L.defs=definitions();
 // Each line once per analysis: its note gains what was found, and a problem puts it among the lines to check.
 const note=(r,x)=>{if(!r||!x||!r.m||r.overriddenBy||r.m.lk223)return;r.m.note=[r.m.note,x.note].filter(Boolean).join(' ');if(x.problem)r.m.missing=true;r.m.lk223=true};
 for(const def of L.defs.values()){
  note(def.line('filename'),fileNote(def));
  const mt=def.line('match_type');if(mt)note(mt,fieldsNote(def,mt,[...String(mt.value).matchAll(/(?:WILDCARD|CIDR)\s*\(\s*([^)\s]+)\s*\)/gi)].map(m=>m[1])));
  const tf=def.line('time_field');if(tf)note(tf,fieldsNote(def,tf,[String(tf.value).trim()].filter(Boolean)));
  const x=fileFor(def);if(x?.file){const runs=(def.role.usedBy||[]).filter(u=>u.use==='lookup'&&!u.r.overriddenBy).map(u=>u.r);if(!L.uses.has(x.file.path))L.uses.set(x.file.path,[]);L.uses.get(x.file.path).push({def,runs})}}
 for(const f of pm.files)if(f.kind==='props')for(const r of f.doc.settings)if(r.refs&&/^lookup/i.test(r.key)&&!r.invalid)note(r,lookupNote(r))}

// ---- the panel: a lookups tab ----
const files=()=>[...L.files.values()].sort((a,b)=>a.path.localeCompare(b.path));
function usesNote(f){const uses=L.uses.get(f.path)||[],out=[];
 if(!uses.length)out.push(`No transforms.conf stanza in these files names it. A search can still read it with | inputlookup ${f.name}.`);
 for(const u of uses)out.push(`[${u.def.name}] uses it (${at(u.def.line('filename'))})${u.runs.length?`, and ${plural(u.runs.length,'LOOKUP- line')} ${u.runs.length===1?'runs':'run'} it: ${atMany(u.runs)}`:', and no LOOKUP- line runs it'}.`);
 const sp=f.columns.filter(c=>c.raw!==c.name);if(sp.length)out.push(`Its header puts ${sp.every(c=>/^\s/.test(c.raw)&&!/\s$/.test(c.raw))?'a space before':'spaces round'} ${and(sp.map(c=>c.name))}.`);
 return out.join(' ')}
const filesHtml=()=>`<ol class="cfFiles205" aria-label="Lookup files">${files().map((f,i)=>`<li><b>${i+1}</b><span class="cfPath205">${esc(f.path)}</span><span class="cfPlace205">${f.app?`${esc(f.app===SYSTEM?'etc/system':f.app)} lookups`:'picked on its own'}</span><button class="propsLink205" data-remove-lookup="${esc(f.path)}">Remove</button></li>`).join('')}</ol>`;
const linesHtml=()=>{const list=files();return`<ol class="propsLines205" role="tabpanel" aria-label="Lookup files">${list.map((f,i)=>`${list.length>1?`<li class="cfFileHead205"><b>${i+1}</b>${esc(f.path)}<small>${f.app?`${esc(f.app===SYSTEM?'etc/system':f.app)} lookups`:'picked on its own'}</small></li>`:''}<li class="propsLine205 lkFile223" data-kind="lookup" data-lookup="${esc(f.path)}"><span class="propsN205">1</span><code>${f.columns.map(c=>c.raw===c.name?esc(c.name):`<mark title="Spaces round the name">“${esc(c.raw)}”</mark>`).join(', ')}</code><span class="propsTo205"><span class="propsTag205">${esc(f.rows===null?'Rows not counted':plural(f.rows,'row'))}</span></span><p class="propsNote205">${esc(usesNote(f))}</p></li>`).join('')}</ol>`};
const frag=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content};
// After the panel draws: the lookups tab, and its files in place of a configuration file kind's when it's chosen.
function decorate(root){if(!root||!L.files.size){L.active=false;return}
 if(L.active&&pm.tab!==L.tab)L.active=false;
 const tabs=root.querySelector('.propsTabs205');if(!tabs)return;
 tabs.querySelector('.propsTabsEnd205')?.insertAdjacentHTML('beforebegin',`<button role="tab" data-lookups-tab aria-selected="${L.active}" tabindex="${L.active?0:-1}"><i class="propsFile205" data-file="lookups" title="Lookup files">L</i>lookups<small>${plural(L.files.size,'file')}</small></button>`);
 if(!L.active)return;
 tabs.querySelectorAll('[data-props-tab]').forEach(b=>{b.setAttribute('aria-selected','false');b.tabIndex=-1});
 root.querySelector('.cfFiles205')?.replaceWith(frag(filesHtml()));
 root.querySelector('.propsLines205')?.replaceWith(frag(linesHtml()))}
// The empty panel, when lookup files are all that's read.
function waiting(){if(!L.files.size)return'';const n=L.files.size;
 return esc(`Read ${plural(n,'lookup file')}: ${and(files().map(f=>f.name))}. Add the transforms.conf that defines ${n===1?'its lookup':'their lookups'} and the props.conf that runs ${n===1?'it':'them'}, or the app’s package or folder. `)}
const root=document.getElementById('configView205');
const show223=()=>{render();root?.querySelector(L.active?'[data-lookups-tab]':'[data-props-tab][aria-selected="true"]')?.focus()};
root?.addEventListener('click',e=>{
 if(e.target.closest('[data-props-tab]')){L.active=false;return}
 if(e.target.closest('[data-lookups-tab]')){L.active=true;L.tab=pm.tab;show223();return}
 const rm=e.target.closest('[data-remove-lookup]');if(rm){L.files.delete(rm.dataset.removeLookup);L.version++;if(!L.files.size)L.active=false;cv.analyse();render()}},true);
// The arrow keys, Home and End move along every tab, the lookups tab too.
root?.addEventListener('keydown',e=>{const tab=e.target.closest?.('[data-props-tab],[data-lookups-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 const all=[...root.querySelectorAll('.propsTabs205 [data-props-tab],.propsTabs205 [data-lookups-tab]')],i=all.indexOf(tab),j=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowRight'?1:-1)+all.length)%all.length,next=all[j];
 if(!next||(!next.matches('[data-lookups-tab]')&&!tab.matches('[data-lookups-tab]')))return;
 e.preventDefault();e.stopPropagation();
 if(next.matches('[data-lookups-tab]')){L.active=true;L.tab=pm.tab}else{L.active=false;pm.tab=next.dataset.propsTab}show223()},true);

// ---- the source type map: beside each lookup a LOOKUP- line runs ----
function mapNote(r,name){if(!L.files.size&&!L.complete.size||!/^lookup/i.test(r?.key||''))return'';
 const def=L.defs.get(name);if(!def)return'';
 const x=def.filename?fileFor(def):null;
 if(def.filename&&!x?.file)return x?.how==='missing'?`<span class="tmLookup223" data-tone="bad">Not in ${esc(lookupsOf(def.app))}</span>`:'';
 const src=columnsOf(def);if(!src)return'';
 const p=parseLookup(r.value);if(p.bad)return'<span class="tmLookup223" data-tone="bad">Names no field to match on</span>';
 const bad=[...p.match,...p.output].map(f=>({f,...find(src.cols,f.field)})).filter(y=>!y.ok);
 if(bad.length)return`<span class="tmLookup223" data-tone="bad">${esc(bad.map(y=>y.none?`No ${src.kind==='file'?'column':'field'} ${y.f.field}`:y.cased?`${y.cased}, not ${y.f.field}`:`“${y.space}” has spaces`).join(' · '))}</span>`;
 const flow=`${p.match.map(f=>f.field).join(', ')} → ${p.output.length?p.output.map(f=>f.field).join(', '):'every other column'}`;
 return`<span class="tmLookup223" data-tone="ok">${esc(src.kind==='file'?`${src.file.rows===null?'':`${plural(src.file.rows,'row')} · `}${flow}`:flow)}</span>`}

function clear(){if(L.files.size||L.complete.size)L.version++;L.files.clear();L.complete.clear();L.defs=new Map();L.uses=new Map();L.active=false}
// For a test or a script: lookup files by path, and the apps to take as read whole.
function load(list,{complete=[]}={}){const errors=[];for(const [path,text] of Object.entries(list)){const e=put(path,text);if(e)errors.push(e)}for(const a of complete)L.complete.add(a);L.version++;cv.analyse();render();return errors}

// The map draws again only when what it shows changes: this is part of what it compares.
const version=()=>L.version;
window.configLookups223={takes,seen,add,put,load,clear,check,decorate,waiting,mapNote,version,header,countRows,parseLookup,find,appOf,fileFor,definitions:()=>L.defs,knowledge:()=>L};
})();

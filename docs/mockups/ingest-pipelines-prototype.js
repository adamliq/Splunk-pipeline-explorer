(function(){
/* Build 218: Ingest Processor pipelines for the source type map. A pipeline is an SPL2 statement that starts with
   "from $source": "$pipeline = | from $source | where … | eval … | into $destination;". The Config view's upload passes
   .spl2 files here; they are kept for the visit, like its other files. For a source type, the map asks which pipelines
   take it, and gets a card for each, with its commands in order and what each leads to: a drop, an index, another
   source type, a field, a rewrite, a destination. With no pipeline that takes the source type, the map has no Ingest
   Processor column. */
const files=[];let version=0;
const word=s=>(s.match(/^[A-Za-z_]\w*/)||[''])[0].toLowerCase();

// Where a string, a regular expression or a comment that starts at i ends; nothing where none starts. A slash starts a
// regular expression after an opening bracket, a comma or an operator, and in rex's arguments; elsewhere it divides.
function token(text,i){const c=text[i],before=text.slice(Math.max(0,i-80),i);
 if(c==='"'||c==="'"||c==='`'){let j=i+1;for(;j<text.length&&text[j]!==c;j++)if(text[j]==='\\')j++;return {end:j,kind:'string'}}
 if(c!=='/')return null;
 if(text[i+1]==='*'){const e=text.indexOf('*/',i+2);return {end:e<0?text.length-1:e+1,kind:'comment'}}
 if(text[i+1]==='/'){let j=i;while(j<text.length&&text[j]!=='\n')j++;return {end:j-1,kind:'comment'}}
 if(/(^|[(,=|\[!&<>~])\s*$/.test(before)||/\brex\s+(\w+\s*=\s*\S+\s+)*$/i.test(before)){let j=i+1;for(;j<text.length&&text[j]!=='/';j++)if(text[j]==='\\')j++;return {end:j,kind:'regex'}}
 return null}
// The parts of SPL2 text between a separator at the top level: outside strings, regular expressions, comments and brackets.
function split(text,sep){const out=[];let depth=0,start=0;
 for(let i=0;i<text.length;i++){const t=token(text,i);if(t){i=t.end;continue}const c=text[i];
  if('([{'.includes(c))depth++;else if(')]}'.includes(c))depth=Math.max(0,depth-1);
  else if(c===sep&&!depth){out.push(text.slice(start,i));start=i+1}}
 out.push(text.slice(start));return out}
const uncomment=text=>{let out='';for(let i=0;i<text.length;i++){const t=token(text,i);if(t){out+=t.kind==='comment'?' ':text.slice(i,t.end+1);i=t.end;continue}out+=text[i]}return out};
const tidy=s=>s.replace(/\s+/g,' ').trim();
const literal=s=>{const m=s.trim().match(/^"((?:\\.|[^"\\])*)"$|^'((?:\\.|[^'\\])*)'$/);return m?(m[1]??m[2]).replace(/\\(.)/g,'$1'):null};

// The tests a where makes of the source type: each a function of a source type name; and the names it gives outright.
function tests(expr){const list=[],names=[];let m;
 for(m of expr.matchAll(/\bsourcetype\s*==?\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gi)){const v=literal(m[1]);names.push(v);list.push(t=>t===v)}
 for(m of expr.matchAll(/\bsourcetype\s+IN\s*\(([^)]*)\)/gi)){const vs=split(m[1],',').map(literal).filter(v=>v!==null);names.push(...vs);list.push(t=>vs.includes(t))}
 for(m of expr.matchAll(/\bsourcetype\s+LIKE\s+("(?:\\.|[^"\\])*")|\blike\(\s*sourcetype\s*,\s*("(?:\\.|[^"\\])*")\s*\)/gi)){const v=literal(m[1]||m[2]),re=new RegExp('^'+v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/%/g,'.*').replace(/_/g,'.')+'$');list.push(t=>re.test(t))}
 for(m of expr.matchAll(/\bmatch\(\s*sourcetype\s*,\s*(?:\/((?:\\.|[^\/\\])*)\/|"((?:\\.|[^"\\])*)")/gi)){try{const re=new RegExp(m[1]??m[2]);list.push(t=>re.test(t))}catch(e){}}
 return {list,names}}

// One pipeline: its name, what it takes, and its commands; a route's or a branch's own pipeline is read the same way.
function commands(text){return split(text,'|').map(tidy).filter(Boolean).map(c=>({word:word(c),args:tidy(c.slice(word(c).length))}))}
function pipeline(name,rest){const cmds=commands(rest);let takes='',who={list:[],names:[]};
 if(cmds[0]?.word==='where'&&/\b(sourcetype|source|host)\b/i.test(cmds[0].args)){takes=cmds[0].args;who=tests(takes);cmds.shift()}
 return {name:'$'+name,takes,who,cmds}}
function read(text){const out=[];
 for(const st of split(uncomment(text),';')){const m=st.match(/(?:^|\n)\s*\$([A-Za-z_]\w*)\s*=\s*\|?\s*from\s+\$\w+\b([\s\S]*)$/);if(m)out.push(pipeline(m[1],m[2]))}
 return out}

// What a command leads to, for the map's Index or send column; and what it says under its line.
function leads(cmd,P,where=''){const by=where?`Events where ${where}, in ${P.name}`:'',outs=[],says=[];
 const out=(kind,key,title,detail,type)=>outs.push({result:{kind,key,title,...(type?{type}:{})},detail:by||detail});
 if(cmd.word==='where'){says.push('Keeps the events this holds for, and drops the others.');out('drop','drop','Dropped',`Events that fail a where of ${P.name}`)}
 else if(cmd.word==='eval'){for(const a of split(cmd.args,',')){const m=a.match(/^\s*([A-Za-z_][\w.]*)\s*=(?!=)([\s\S]*)$/);if(!m)continue;const f=m[1],v=literal(m[2]);
   if(f==='index')v!==null?out('index','index:'+v,`Index ${v}`,`Events ${P.name} sets it for`):out('index','index:?','Index set by an expression',`In ${P.name}`);
   else if(f==='sourcetype')v!==null?out('retype','retype:'+v,`Becomes ${v}`,`Events ${P.name} names so`,v):out('meta','meta:sourcetype?','Source type set by an expression',`In ${P.name}`);
   else if(f==='host'||f==='source')out('meta','meta:'+f+(v??'?'),v!==null?`${f[0].toUpperCase()+f.slice(1)} set to ${v}`:`${f[0].toUpperCase()+f.slice(1)} set by an expression`,`In ${P.name}`);
   else if(f==='_raw')out('text','text','Text rewritten',`Rewritten by ${P.name}`);
   else if(f==='_time')out('meta','time','Timestamp set by an expression',`In ${P.name}`);
   else out('field','field:'+f,`Indexed field ${f}`,`Set by ${P.name}`)}}
 else if(cmd.word==='rex'){const names=[...cmd.args.matchAll(/\(\?P?<([A-Za-z_]\w*)>/g)].map(m=>m[1]);if(names.length)says.push(`Extracts ${names.join(', ')}.`);for(const f of names)out('field','field:'+f,`Indexed field ${f}`,`Extracted by ${P.name}`)}
 else if(cmd.word==='fields')says.push(/^\s*-/.test(cmd.args)?'Removes these fields.':'Keeps only these fields.');
 else if(cmd.word==='into'){const d=cmd.args.split(/\s/)[0];out('route','route:'+d,`Sent to ${d}`,`What ${P.name} lets through`);if(!where)says.push('The destination is chosen where the pipeline is applied.')}
 else if(['route','branch','thru'].includes(cmd.word)){const parts=split(cmd.args,','),subs=parts.filter(x=>/^\s*\[/.test(x)),pred=cmd.word==='route'?tidy(parts.filter(x=>!/^\s*\[/.test(x)).join(',')):'';
   says.push(cmd.word==='route'?'Matching events leave the pipeline here, by their own route.':cmd.word==='branch'?'Each branch gets a copy.':'A copy goes through this.');
   for(const s of subs)for(const c of commands(s.trim().replace(/^\[|\]$/g,'')))outs.push(...leads(c,P,pred||where||`a ${cmd.word} copy`).outs)}
 return {says:says.join(' '),outs}}

// For the map: the pipelines that take a source type, as cards, with what their commands lead to.
function forType(T,h){const cards=[],outs=[];let count=0;
 for(const f of files)for(const P of f.pipelines){if(P.who.list.length&&!P.who.list.some(t=>t(T)))continue;count++;
  const lis=P.cmds.map(c=>{const id=h.nid('P'),l=leads(c,P);for(const o of l.outs)outs.push({...o,from:id});
   return`<li id="${id}"><code title="${h.esc(c.word+' '+c.args)}"><b>${h.esc(c.word)}</b> ${h.esc(c.args)}</code>${l.says?`<small>${h.esc(l.says)}</small>`:''}</li>`}).join('');
  cards.push(`<article class="tmCard217 tmPipe218" data-kind="pipeline"><header><i class="propsFile205" data-file="pipeline" title="SPL2 pipeline">S</i><code title="${h.esc(P.name)}">${h.esc(P.name)}</code><span class="tmAt217"><span class="tmFiles217">${h.esc(f.name)}</span></span></header><p class="tmSub217">${P.takes?`Takes events where ${h.esc(P.takes)}`:'Takes every source type it receives'}</p><ol class="tmCmds218">${lis}</ol></article>`)}
 return {cards,outs,count}}
// The loaded files, for the map's head: each with a way to take it out.
function head(h){return files.length?`<p class="tmPipes218">Ingest Processor pipelines${files.map(f=>`<span>${h.esc(f.name)} · ${f.pipelines.length} pipeline${f.pipelines.length===1?'':'s'}<button type="button" data-tm-pipe-remove="${h.esc(f.path)}" aria-label="Remove ${h.esc(f.name)}">Remove</button></span>`).join('')}</p>`:''}

window.configPipelines218={read,leads,forType,head,
 files:()=>files,get version(){return version},
 // A file's pipelines; a file loaded again replaces itself. Returns how many pipelines it has.
 add(path,text){const pipelines=read(text);if(!pipelines.length)return 0;const i=files.findIndex(f=>f.path===path),f={path,name:path.split('/').pop(),pipelines};if(i<0)files.push(f);else files[i]=f;version++;return pipelines.length},
 remove(path){const i=files.findIndex(f=>f.path===path);if(i>=0){files.splice(i,1);version++}},
 clear(){if(files.length){files.length=0;version++}},
 // The source types the pipelines name: those their where takes outright, and those an eval names.
 types(){const out=new Set();for(const f of files)for(const P of f.pipelines){P.who.names.forEach(t=>out.add(t));const scan=cmds=>{for(const c of cmds)for(const o of leads(c,P).outs)if(o.result.type)out.add(o.result.type)};scan(P.cmds)}return [...out]}};
})();

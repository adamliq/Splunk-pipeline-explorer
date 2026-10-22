(function(){
/* Build 206: five fixes. Four are in the Builder: Esc and a pending connection, the selection after a palette add,
   Syslog Source → Splunk Cloud indexing, and the Inspector with nothing selected (an in-place edit). The fifth is in the
   Config view: props.conf [source::] stanzas match a monitor's files with Splunk's wildcards. */

// 1. Esc cancels a connection that is waiting for its other end, and keeps the selection, as Esc does in the add-next
// list (Build 204). Once that list had closed, Esc went to the Builder's own handling, which cleared the selection or
// closed a panel and left the connection pending. An open menu or popover, and a text field, still take the Esc first.
// Taken before the Builder's own Esc handling (Build 95's drawers listen in the capture phase, on the document).
const shown=el=>!!el&&!el.hidden&&el.getClientRects().length>0;
const menusAndPopovers='.builderMenu[open],.builderDensityPanels details[open],.builderMobileMore[open],.builderMobilePlanes[open],#builderSpaceGroups140[open],#builderObjectMenu,#builderIssuePopover,.builderHistoryPopover163,.builderReport163,#builderHeaderInfoPopover,#builderImpactOverlay.open';
addEventListener('keydown',e=>{
 if(e.key!=='Escape'||e.defaultPrevented||state.view!=='builder'||!state.builderConnectionDraft)return;
 if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
 if(state.builderPresentation?.open||[...document.querySelectorAll(menusAndPopovers)].some(shown))return;
 e.preventDefault();e.stopImmediatePropagation();
 state.builderConnectionDraft=null;builderStatus('Connection cancelled');renderBuilder();
},true);

// 2. A component added from the palette is the only one selected. The palette's adds selected the new card but left
// builderMultiSelected on the card selected before, which kept its selection tick and border while the Inspector showed
// the new card. The add-next list already set it; now every add does.
if(typeof addBuilderNode==='function'){
 const addBefore=addBuilderNode;
 addBuilderNode=function(...args){
  const had=new Set(state.builderNodes.map(n=>n.id)),result=addBefore.apply(this,args),id=state.builderSelected;
  if(id!=null&&!had.has(id)&&state.builderNodes.some(n=>n.id===id)&&!(state.builderMultiSelected.length===1&&Number(state.builderMultiSelected[0])===id)){
   state.builderMultiSelected=[id];state.builderBulkEdges=[];if(typeof decorateMultiSelection==='function')decorateMultiSelection()}
  return result};
}

// 3. Syslog Source → Splunk Cloud indexing is refused when the link is made, as other links the Builder can't carry are.
// Build 148 let the capability check pass it and its validation reject it, so the handles and the palette made a link
// the Builder then marked "not allowed". A link that is already there, read from a file or a saved topology, still
// passes: Build 148's validation, marking and "Insert Syslog Server between them" keep handling it.
const syslogToCloud="Syslog can't go directly to Splunk Cloud. Send syslog through a Syslog Server and forwarder or HEC.";
if(typeof dataCapability==='function'){
 const capabilityBefore=dataCapability;
 const isCloud=n=>n?.type==='cloudIndexer148'||(typeof builderIsCloudIndexer148==='function'&&!!n&&builderIsCloudIndexer148(n));
 dataCapability=function(source,target){
  const check=capabilityBefore(source,target);
  if(!check.valid||source?.type!=='syslogSource'||!isCloud(target))return check;
  // A palette or list candidate has no id, or -1. Nodes of a file being read aren't in the topology yet.
  const candidate=target.id===undefined||target.id===-1;
  if(!state.builderNodes.includes(source)||!candidate&&!state.builderNodes.includes(target))return check;
  if(!candidate&&(target.parent===source.id||state.builderDataRelations?.some(r=>r.from===source.id&&r.to===target.id)))return check;
  return {valid:false,reason:syslogToCloud}};
}
// Build 148 adds Splunk Cloud indexing itself, linked to the component it follows, without the capability check. After a
// Syslog Source it now does what Build 115 does for other components that can't follow the selected one: a palette
// click adds it unconnected and says why, and a drop onto the Syslog Source is refused.
if(typeof addBuilderNode==='function'){
 const addBefore=addBuilderNode;
 addBuilderNode=function(type,parent=null,...rest){
  const source=parent!==null?state.builderNodes.find(n=>n.id===Number(parent)):null;
  if(type!=='cloudIndexer148'||source?.type!=='syslogSource')return addBefore.call(this,type,parent,...rest);
  if(typeof builderPaletteClickAdd!=='undefined'&&builderPaletteClickAdd){
   const added=addBefore.call(this,type,null,...rest);
   builderStatus(`Added ${builderComponents[type]?.name||'Splunk Cloud indexing'} unconnected · ${syslogToCloud} Drag it onto a compatible component to connect.`);
   return added}
  builderStatus(syslogToCloud,'error');
 };
}

// 5. The Config view: a monitor's files take the source type of the props.conf [source::] stanzas that match them, as
// Splunk matches them. Build 205 matched a stanza only when its text was the monitor's path exactly. In a source::
// pattern, "..." is any run of characters, "*" any run within one path segment and "." a dot; the rest is a regular
// expression matched against the whole path, case-sensitively. A monitor's path can use "..." and "*" too, or name a
// directory, whose files it reads. Of several stanzas that match a file, the one with the higher priority wins (100 for
// a literal stanza and 0 for a pattern, unless it sets priority), then the one first in ASCII order.
// path: the monitor's path. stanzas: props.conf [source::] stanzas, highest precedence first. where(line): "file line n".
// Returns the note for the monitor's line and its source types, or null when some of its files may get none here.
const isSep=c=>c==='/'||c==='\\';
// "..." and "*" as tokens, and every other character as itself. A pattern using regular expression syntax gives null.
function tokens(s,stanza){
 const t=[];
 for(let i=0;i<s.length;){
  if(s.startsWith('...',i)){t.push({k:'any'});i+=3}
  else if(s[i]==='*'){t.push({k:'seg'});i++}
  else if(stanza&&s[i]==='\\'){if(s[i+1]!=='\\')return null;t.push({k:'c',c:'\\'});i+=2}
  else if(stanza&&'|()[]?+{}^$'.includes(s[i]))return null;
  else{t.push({k:'c',c:s[i]});i++}
 }
 return t;
}
// Does pattern S match every path that M can? Each of M's characters and wildcards must fall in one of S's that takes it.
function covers(S,M){
 const memo=new Map();
 const go=(i,j)=>{const key=i+','+j;if(memo.has(key))return memo.get(key);let r;
  if(i===S.length)r=j===M.length;
  else if(S[i].k==='c')r=j<M.length&&M[j].k==='c'&&M[j].c===S[i].c&&go(i+1,j+1);
  else if(S[i].k==='seg')r=go(i+1,j)||j<M.length&&(M[j].k==='seg'||M[j].k==='c'&&!isSep(M[j].c))&&go(i,j+1);
  else r=go(i+1,j)||j<M.length&&go(i,j+1);
  memo.set(key,r);return r};
 return go(0,0);
}
// Is there a path both patterns match?
function meets(A,B){
 const seen=new Set(),todo=[[0,0]];
 while(todo.length){const [i,j]=todo.pop(),key=i+','+j;if(seen.has(key))continue;seen.add(key);
  if(i===A.length&&j===B.length)return true;
  if(i<A.length&&A[i].k!=='c')todo.push([i+1,j]);
  if(j<B.length&&B[j].k!=='c')todo.push([i,j+1]);
  if(i<A.length&&j<B.length){const a=A[i],b=B[j];
   const ok=a.k==='c'&&b.k==='c'?a.c===b.c:a.k==='c'?b.k==='any'||!isSep(a.c):b.k==='c'?a.k==='any'||!isSep(b.c):true;
   if(ok&&(a.k==='c'||b.k==='c'))todo.push([a.k==='c'?i+1:i,b.k==='c'?j+1:j])}}
 return false;
}
// A pattern with regular expression syntax, as Splunk translates it.
function regex(p){
 let out='';
 for(let i=0;i<p.length;){
  if(p.startsWith('...',i)){out+='.*';i+=3}
  else if(p[i]==='*'){out+='[^/\\\\]*';i++}
  else if(p[i]==='.'){out+='\\.';i++}
  else if(p[i]==='\\'){out+=p.slice(i,i+2);i+=2}
  else{out+=p[i];i++}
 }
 try{return new RegExp('^(?:'+out+')$')}catch{return null}
}
const sample=M=>M.map(t=>t.k==='c'?t.c:'x').join('');
window.configSourceMatches206=function(path,stanzas,where){
 // One entry per stanza name: its source type from the first stanza of that name that sets one, as Splunk's merge does.
 const byName=new Map();
 for(const st of stanzas){const name=st.name.slice(8);let e=byName.get(name);if(!e)byName.set(name,e={name});
  if(!e.line&&st.keys.get('sourcetype'))e.line=st.keys.get('sourcetype');
  if(e.priority===undefined&&st.keys.get('priority'))e.priority=Number(st.keys.get('priority').value)||0}
 const M=tokens(path,false),literal=!M.some(t=>t.k!=='c'),sep=path.includes('\\')&&!path.includes('/')?'\\':'/';
 const D=isSep(path.at(-1))?[...M,{k:'any'}]:literal?[...M,{k:'c',c:sep},{k:'any'}]:null;
 // How a stanza's pattern meets the monitor's files: all of them, some, or none.
 const relate=(e,files)=>{const S=tokens(e.name,true);
  if(S)return covers(S,files)?'all':meets(S,files)?'some':null;
  const r=regex(e.name);if(!r)return null;
  return files.some(t=>t.k!=='c')?(r.test(sample(files))?'some':null):(r.test(sample(files))?'all':null)};
 const entries=[...byName.values()].filter(e=>e.line);
 const fileRead=isSep(path.at(-1))?[]:entries.map(e=>({...e,rel:relate(e,M)})).filter(e=>e.rel);
 // A literal path names a directory when it ends with a separator, or when it matches no stanza but a stanza names
 // something under it. Then the stanzas match the files under it.
 const prefix=name=>{const m=name.match(/^(?:\\\\|(?!\.\.\.)[^*|()[\]?+{}^$\\])*/)[0];return m.replace(/\\\\/g,'\\')};
 const dir=!fileRead.length&&D&&(isSep(path.at(-1))||entries.some(e=>prefix(e.name).startsWith(path+sep)));
 const matched=fileRead.length?fileRead:dir?entries.map(e=>({...e,rel:relate(e,D)})).filter(e=>e.rel):[];
 if(!matched.length)return {note:'',types:null};
 const rank=e=>e.priority!==undefined?e.priority:tokens(e.name,true)?.every(t=>t.k==='c')?100:0;
 matched.sort((a,b)=>rank(b)-rank(a)||(a.name<b.name?-1:a.name>b.name?1:0));
 // Walk the stanzas in rank order until one takes every file: the files left after that get nothing from the rest.
 const used=[];for(const e of matched){used.push(e);if(e.rel==='all')break}
 const complete=used.at(-1).rel==='all',types=complete?new Set(used.map(e=>e.line.value)):null;
 const named=e=>`[source::${e.name}]`;
 let note;
 if(used.length===1&&complete){const e=used[0];
  note=e.name===path?`Its source type, ${e.line.value}, comes from ${where(e.line)}.`
   :dir?`Its files take source type ${e.line.value} from ${named(e)} in ${where(e.line)}.`
   :`Its source type, ${e.line.value}, comes from ${named(e)} in ${where(e.line)}.`}
 else{
  const parts=used.filter(e=>e.rel==='some').map(e=>`files matching ${named(e)} take source type ${e.line.value} (${where(e.line)})`);
  note=parts.join('; ').replace(/^f/,'F')+'.';
  if(complete){const e=used.at(-1);note+=` The rest take ${e.line.value} from ${named(e)} in ${where(e.line)}.`}
  else note+=' Its other files get no source type from props.conf.'}
 return {note,types};
};
})();

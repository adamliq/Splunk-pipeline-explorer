(function(){
/* Build 205: the Config view. Upload inputs.conf, props.conf and transforms.conf files and each line goes to the Matrix
   stage that applies it: listed by file in the view's panel, and again in that stage's row of the view's Matrix and in
   its detail. The files are read together, as Splunk reads them. Files of one kind merge in Splunk's precedence order, so
   a local file's line overrides the default file's. A TRANSFORMS- line finds the transforms.conf stanzas it names, whose
   own settings decide whether each routes, masks, copies or writes indexed fields, and an input finds the props.conf
   stanza that parses what it reads. The component strip says which tier the files are checked against, so the Search Head
   joins it, with the search-time stages its settings act in. The files never leave the page and are gone on reload. */
if(typeof stages==='undefined'||typeof render!=='function'||typeof openDetail!=='function'||typeof filtered!=='function'||typeof componentOrder==='undefined')return;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stageNamed=name=>stages.find(s=>s.name===name),stageById=id=>stages.find(s=>s.id===id),pad=id=>String(id).padStart(2,'0');
const ids=(...names)=>names.map(n=>stageNamed(n)?.id).filter(Boolean);
const classOf=k=>{const i=k.indexOf('-');return i>0?k.slice(0,i+1):null};
const lookup=(k,list)=>list.includes(k)||list.includes(classOf(k));

// The Search Head, and the search-time stages, in Splunk's search-time order: the extractions, then aliases, calculated
// fields, lookups, event types and tags. Every view gets them.
const SEARCH='Search-time processing';
const searchStages=[
 {name:'Source type renaming',what:'Gives a source type another name that searches can use.',config:'rename in props.conf',note:'Events keep their indexed source type; only searches see the new name.'},
 {name:'Inline field extraction',what:'Extracts fields with the regular expressions written in props.conf.',config:'EXTRACT-* · MATCH_LIMIT · DEPTH_LIMIT',note:'The first extractions to run, in the order of their class names.'},
 {name:'Transform field extraction',what:'Extracts fields with the transforms.conf stanzas a REPORT- setting names.',config:'REPORT-* · REGEX · FORMAT · DELIMS · FIELDS in transforms.conf',note:'Runs after the inline extractions.'},
 {name:'Automatic key-value extraction',what:'Finds key=value pairs, JSON or XML in the event text.',config:'KV_MODE · AUTO_KV_JSON · KV_TRIM_SPACES',note:'KV_MODE = none saves search time where explicit extractions cover the fields.'},
 {name:'Field aliasing',what:'Gives extracted fields further names.',config:'FIELDALIAS-*',note:'Aliases come after every extraction, so they can rename any extracted field.'},
 {name:'Calculated fields',what:'Adds fields computed with eval expressions.',config:'EVAL-*',note:'A calculated field can use an alias, but not a lookup’s output.'},
 {name:'Lookups',what:'Adds fields from lookup tables, matched on fields the event has.',config:'LOOKUP-* · lookup stanzas in transforms.conf',note:'Automatic lookups come after calculated fields, so they can match on them.'},
 {name:'Event typing',what:'Classifies events with saved searches.',config:'eventtypes.conf',note:'An event type can use any field the stages before it produce.'},
 {name:'Tagging',what:'Adds tags to field values and event types.',config:'tags.conf',note:'Tags come last, so they can tag event types.'},
 {name:'Search-time segmentation',what:'Sets how Splunk Web breaks event text into terms to highlight and select.',config:'SEGMENTATION-* · segmenters.conf',note:'Changes the display only; index-time SEGMENTATION decides what is indexed.'}
];
if(!componentOrder.includes('sh')){
 componentNames.sh='Search Head';componentOrder.splice(componentOrder.indexOf('idx')+1,0,'sh');
 // A search head signs users in, checks REST tokens and keeps the audit trail. It also reads and forwards its own logs, as
 // any full Splunk instance does, so it takes a Heavy Forwarder's input, parsing and forwarding stages as conditional.
 const auth={98:'required',99:'required',100:'required',101:'required',102:'required',105:'required',106:'conditional',108:'required'};
 const ownData=[1,2,3,4,5,6,8,9,10,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,40,42,43];
 for(const s of stages)s.sh=auth[s.id]||(ownData.includes(s.id)&&s.hf!=='no'?'conditional':'no');
 // Search peers run the search-time stages too, with the copy of the search head's settings it sends them.
 let id=Math.max(...stages.map(s=>s.id));
 for(const s of searchStages)stages.push({id:++id,pipeline:SEARCH,...s,ds:'no',syslog:'no',hec:'no',sql:'no',dbconnect:'no',uf:'no',hf:'no',ip:'no',idx:'conditional',sh:'required',s3:'no'});
 colors[SEARCH]='#b4a7f5';
 // Its Matrix column, its card in the component strip, its pipeline in the filter, and the counts.
 [...document.querySelectorAll('#matrix thead th')].find(th=>th.textContent.trim()==='Indexer')?.insertAdjacentHTML('afterend','<th>Search Head</th>');
 document.querySelector('.component[data-component="idx"]')?.insertAdjacentHTML('afterend','<button class="component" style="--component:#b4a7f5" data-component="sh"><span class="count" id="shCount">0</span><small>Search tier</small><strong>Search Head</strong><em>Run searches with search-time knowledge</em></button>');
 const card=document.querySelector('.component[data-component="sh"]');if(card)card.onclick=()=>{state.customTopologyActive=false;focusComponent('sh');renderRouteDiagram();render()};
 document.getElementById('pipelineFilter')?.insertAdjacentHTML('beforeend',`<option>${SEARCH}</option>`);
 document.getElementById('allCount').textContent=stages.length;
 for(const k of componentOrder){const el=document.getElementById(k+'Count');if(el)el.textContent=stages.filter(s=>s[k]!=='no').length}
 const stat=[...document.querySelectorAll('.headerStats .stat')].find(x=>/components/.test(x.textContent));if(stat)stat.querySelector('strong').textContent=componentOrder.length;
}
// Every topology ends in search, so the search-time stages show with each; the Config view's Matrix ignores the topology.
const pathBefore=pathAllows;
pathAllows=function(s){return state.view==='config'||s.pipeline===SEARCH||pathBefore.apply(this,arguments)};

// Stage name → settings, turned round into setting → the stages that apply it. A trailing "-" is a class prefix, so
// TRANSFORMS- matches TRANSFORMS-route. A setting under two stages acts first in the first: DATETIME_CONFIG is stage 16's,
// and also decides stage 17's fallback.
function byStage(table){const map=new Map();for(const [name,keys] of Object.entries(table)){const id=stageNamed(name)?.id;if(!id)continue;for(const k of keys){if(!map.has(k))map.set(k,[]);map.get(k).push(id)}}return map}

// props.conf, where props.conf.spec says each setting acts.
const propsStages=byStage({
 'Source acquisition':['NO_BINARY_CHECK','detect_trailing_nulls','unarchive_cmd','unarchive_cmd_start_mode','unarchive_sourcetype','invalid_cause','is_valid'],
 'Input checkpointing':['CHECK_METHOD'],
 'Source-wide metadata':['sourcetype','PREFIX_SOURCETYPE','LEARN_SOURCETYPE','LEARN_MODEL','maxDist','MORE_THAN','LESS_THAN'],
 'Character decoding':['CHARSET'],
 'Structured-data parsing':['INDEXED_EXTRACTIONS','FIELD_DELIMITER','FIELD_QUOTE','FIELD_NAMES','TIMESTAMP_FIELDS','HEADER_FIELD_DELIMITER','HEADER_FIELD_QUOTE','HEADER_FIELD_ACCEPTABLE_SPECIAL_CHARACTERS','MISSING_VALUE_REGEX','JSON_TRIM_BRACES_IN_ARRAY_NAMES'],
 'Event boundary detection':['EVENT_BREAKER_ENABLE','EVENT_BREAKER'],
 'Line breaking & length control':['LINE_BREAKER','LINE_BREAKER_LOOKBEHIND','TRUNCATE'],
 'Header processing':['HEADER_FIELD_LINE_NUMBER','FIELD_HEADER_REGEX','PREAMBLE_REGEX','HEADER_MODE'],
 'Event aggregation':['SHOULD_LINEMERGE','BREAK_ONLY_BEFORE_DATE','BREAK_ONLY_BEFORE','MUST_BREAK_AFTER','MUST_NOT_BREAK_AFTER','MUST_NOT_BREAK_BEFORE','MAX_EVENTS'],
 'Timestamp extraction':['TIME_PREFIX','TIME_FORMAT','MAX_TIMESTAMP_LOOKAHEAD','DATETIME_CONFIG','TZ','TZ_ALIAS','DETERMINE_TIMESTAMP_DATE_WITH_SYSTEM_TIME','ADD_EXTRA_TIME_FIELDS'],
 'Default timestamp handling':['DATETIME_CONFIG'],
 'Timestamp validation':['MAX_DAYS_AGO','MAX_DAYS_HENCE','MAX_DIFF_SECS_AGO','MAX_DIFF_SECS_HENCE'],
 'Event age filtering':['ROUTE_EVENTS_OLDER_THAN'],
 'Index-time transformations':['TRANSFORMS-','RULESET-','METRIC-SCHEMA-TRANSFORMS','STATSD-DIM-TRANSFORMS','METRICS_PROTOCOL','STATSD_EMIT_SINGLE_MEASUREMENT_FORMAT'],
 '_raw modification & masking':['SEDCMD-'],
 'Indexed-field creation':['ADD_EXTRA_TIME_FIELDS'],
 'Event typing & punctuation':['ANNOTATE_PUNCT'],
 'Searchable segmentation':['SEGMENTATION'],
 'Source type renaming':['rename'],
 'Inline field extraction':['EXTRACT-','MATCH_LIMIT','DEPTH_LIMIT'],
 'Transform field extraction':['REPORT-'],
 'Automatic key-value extraction':['KV_MODE','AUTO_KV_JSON','KV_TRIM_SPACES'],
 'Field aliasing':['FIELDALIAS-'],
 'Calculated fields':['EVAL-'],
 'Lookups':['LOOKUP-'],
 'Search-time segmentation':['SEGMENTATION-']
});
const splunkWeb=['category','description','pulldown_type'];
// In a stanza with INDEXED_EXTRACTIONS, the structured parser reads the header and the timestamp where the file is read,
// a UF included, and forwards the events already parsed; the Matrix's stages 13 and 16 never see them.
const structuredReads=['TIME_FORMAT','TIME_PREFIX','TZ','MAX_TIMESTAMP_LOOKAHEAD','HEADER_FIELD_LINE_NUMBER','FIELD_HEADER_REGEX','PREAMBLE_REGEX'];
const propsPool=[...propsStages.keys(),...splunkWeb,'priority'];
const isPropsKey=k=>propsStages.has(k)||propsStages.has(classOf(k))||lookup(k,splunkWeb)||k==='priority'||/^(MORE|LESS)_THAN(_\d+)?$/.test(k);

// transforms.conf. A stanza's stage follows from its settings together (transformRole), so all its lines map there.
const transformsKeys=['REGEX','FORMAT','DEST_KEY','SOURCE_KEY','WRITE_META','INGEST_EVAL','CLONE_SOURCETYPE','LOOKAHEAD','DEPTH_LIMIT','MATCH_LIMIT','REPEAT_MATCH','DEFAULT_VALUE','DELIMS','FIELDS','MV_ADD','CLEAN_KEYS','KEEP_EMPTY_VALS','CAN_OPTIMIZE','filename','collection','external_cmd','external_type','fields_list','match_type','max_matches','min_matches','default_match','case_sensitive_match','time_field','time_format','max_offset_secs','min_offset_secs','batch_index_query','allow_caching','filter','replicate','REMOVE_DIMS_FROM_METRIC_NAME'];
const isTransformsKey=k=>transformsKeys.includes(k)||k.startsWith('METRIC-SCHEMA-');
// DEST_KEY's values, case sensitive as Splunk reads them, by the stage the write lands in. INGEST_EVAL's targets likewise.
const destStages={queue:'Metadata routing','_MetaData:Index':'Metadata routing','MetaData:Host':'Metadata routing','MetaData:Source':'Metadata routing','MetaData:Sourcetype':'Metadata routing',_raw:'_raw modification & masking',_meta:'Indexed-field creation',_time:'Index-time transformations',_TCP_ROUTING:'Output selection & load balancing',_SYSLOG_ROUTING:'Output selection & load balancing',_INDEX_AND_FORWARD_ROUTING:'Output selection & load balancing'};
const evalStage=f=>['index','queue','host','source','sourcetype'].includes(f)?'Metadata routing':f==='_raw'?'_raw modification & masking':f==='_time'?'Index-time transformations':/^_(TCP|SYSLOG)_ROUTING$/.test(f)?'Output selection & load balancing':'Indexed-field creation';
// Index-time transforms run in the typing pipeline whatever they change, so stage 22's cells say where they act.
const transformsAt=stageNamed('Index-time transformations')?.id;

// inputs.conf. A stanza is an input and acts in the stage its kind names; its settings act there, or where the stage
// that reads them is, such as index and sourcetype in 04.
const inputStages=byStage({
 'Source acquisition':['whitelist','blacklist','recursive','followSymlink','ignoreOlderThan','time_before_close','multiline_event_extra_waittime','alwaysOpenFile','move_policy','acceptFrom','rawTcpDoneTimeout','no_appending_timestamp','no_priority_stripping','listenOnIPv6','_rcvbuf','interval','passAuth','start_by_shell','start_from','current_only','renderXml','evt_resolve_ad_obj','send_index_as_argument_for_path'],
 'Input checkpointing':['crcSalt','initCrcLength','followTail','checkpointInterval'],
 'Source-wide metadata':['host','index','source','sourcetype','host_regex','host_segment','connection_host','_meta'],
 'Persistent input queue':['persistentQueueSize','queueSize'],
 'parsingQueue':['queue','route'],
 'tcpin_queue':['compressed','enableS2SHeartbeat','s2sHeartbeatTimeout','inputShutdownTimeout','stopAcceptorAfterQBlock','negotiateProtocolLevel','negotiateNewProtocol','concurrentChannelLimit'],
 'Output selection & load balancing':['_TCP_ROUTING','_SYSLOG_ROUTING','_INDEX_AND_FORWARD_ROUTING','outputgroup'],
 'Listener and request decoding':['port','dedicatedIoThreads','maxSockets','maxThreads','useDeploymentServer','max_content_length','crossOriginSharingPolicy','forceHttp10'],
 'Token validation and index authorisation':['token','indexes','allowQueryStringAuth'],
 'Acknowledgement state tracking':['useACK','ackIdleCleanup','maxIdleTime'],
 'Channel validation':['channel_cookie','useACK'],
 'Indexed-field creation':['_meta'],
 'Inter-component TLS certificate validation':['serverCert','sslPassword','requireClientCert','sslVersions','cipherSuite','ecdhCurves','dhFile','sslRootCAPath','sslCommonNameToCheck','sslAltNameToCheck','sslQuietShutdown','allowSslRenegotiation','enableSSL','sslKeysfile','sslKeysfilePassword','caCertFile','rootCA']
});
// In an [http://<name>] stanza the same settings describe an HEC token: what it may write, and the metadata it gives events.
const hecTokenStages=byStage({
 'Token validation and index authorisation':['token','index','indexes','disabled','allowQueryStringAuth'],
 'Payload framing and event validation':['sourcetype','source','host','connection_host'],
 'HEC ingestion token validation':['token','index','indexes','disabled','sourcetype'],
 'Admitted-event pipeline handoff':['queue'],
 'Output selection & load balancing':['outputgroup'],
 'Acknowledgement state tracking':['useACK'],
 'Channel validation':['useACK']
});
const builtInSchemes=['monitor','batch','tcp','udp','splunktcp','splunktcptoken','script','WinEventLog','perfmon','WinRegMon','WinHostMon','WinPrintMon','WinNetMon','admon','MonitorNoHandle','http','powershell','powershell2'];
const inputsPool=[...new Set([...inputStages.keys(),...hecTokenStages.keys(),'disabled'])];
const isInputsKey=k=>inputStages.has(k)||hecTokenStages.has(k)||k==='disabled'||/^(whitelist|blacklist)\d$/.test(k);
const truthy=v=>/^(1|t|true|y|yes)$/i.test(String(v||'').trim());
// Shown by their last four characters only, in the panel, the Matrix and the detail.
const secrets=['token','sslPassword','sslKeysfilePassword','password','pass4SymmKey'];
const shown=r=>secrets.includes(r.key)&&r.value.length>4?'••••••••'+r.value.slice(-4):r.value;

const fileTypes=['inputs','props','transforms'],fileLetter={inputs:'I',props:'P',transforms:'T'};
const readTime=['Source acquisition','Input checkpointing','Source-wide metadata','Character decoding','Structured-data parsing'];
// Where in the pipeline a stage's settings act, for the detail.
const actsWhere=id=>{const s=stageById(id);if(!s)return'';const n=s.name,p=s.pipeline;
 if(p===SEARCH)return'Acts at search time, on the search head. Search peers apply the copy of its settings the search head sends them, so search-time settings belong on the search head. There they merge in the context of the app a search runs in: that app’s files first, then other apps’ globally shared settings, then system’s. This view merges the files in the global order, as Splunk does for index-time settings.';
 if(n==='UF monitored-file pickup')return'Acts on the Universal Forwarder that monitors the file.';
 if(n==='Structured-data parsing')return'Acts where the file is read. A Universal Forwarder parses the file itself and forwards the events already parsed.';
 if(n==='Event boundary detection')return'Universal Forwarder only: it splits the stream so no event is divided between indexers.';
 if(n==='tcpin_queue')return'Acts on the receiver: the Heavy Forwarder or indexer that forwarders send to.';
 if(/^Input|^Parsing handoff/.test(p))return'Input time: acts on the instance that reads the source, such as a Universal Forwarder monitoring a file. An instance receiving forwarded data doesn’t apply it again.';
 if(/^HEC/.test(p)||n==='HEC ingestion token validation')return'Acts on the instance running the HTTP Event Collector: a Heavy Forwarder or an indexer.';
 if(n==='Output selection & load balancing')return'Acts on the instance that forwards the data on: a forwarder, or an indexer or search head set to forward.';
 if(p==='Authentication layer')return'Acts where two components meet, on the side that checks the credential.';
 if(s.uf==='no'&&s.hf==='no')return'Acts on the indexer, as it writes the event.';
 return'Acts on the first full parsing tier: the first Heavy Forwarder in the path, or the indexer when there is none. Data a Heavy Forwarder has parsed isn’t parsed again.'};

function levenshtein(a,b){const d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=t}}return d[b.length]}
// The setting a mistyped name most likely meant: the same name in other case, or one within two edits (one for short names).
function suggest(k,pool){
 const cls=classOf(k),name=cls?cls.slice(0,-1):k,names=pool.filter(x=>cls?x.endsWith('-'):!x.endsWith('-')).map(x=>x.replace(/-$/,''));
 const same=names.find(x=>x.toLowerCase()===name.toLowerCase());if(same)return {name:cls?same+k.slice(cls.length-1):same,caseOnly:true};
 let best=null,dist=name.length<=5?1:2;for(const x of names){const d=levenshtein(name.toUpperCase(),x.toUpperCase());if(d<=dist){dist=d;best=x}}
 if(!best&&!cls){const prefix=pool.find(x=>x.endsWith('-')&&levenshtein(name.toUpperCase(),x.slice(0,-1))<=1);if(prefix)return {name:prefix+'<class>'}}
 return best?{name:cls?best+k.slice(cls.length-1):best}:null}
const unknown=(file,guess)=>({area:'unknown',note:`Not ${file.startsWith('i')?'an':'a'} ${file} setting.${guess?` Did you mean ${guess.name}?${guess.caseOnly?' Setting names are case sensitive.':''}`:''} Splunk ignores this line.`});
// A label inside a sentence: "Drops matching events" reads "drops matching events", but Splunk stays Splunk.
const inSentence=label=>label.startsWith('Splunk')?label:label.charAt(0).toLowerCase()+label.slice(1);
// A setting that belongs in one of the other files, which this one ignores.
function elsewhere(k,here){const homes=fileTypes.filter(t=>t!==here&&{props:isPropsKey,transforms:isTransformsKey,inputs:isInputsKey}[t](k));
 return homes.length?{area:'elsewhere',note:`${homes[0]==='inputs'?'An':'A'} ${homes.map(h=>h+'.conf').join(' or ')} setting: ${here}.conf ignores it.`}:null}

// Read a .conf file: stanzas, settings, a value continued onto the next line by a trailing backslash, comments and
// anything Splunk can't read.
function parseConf(text,kind,fid){
 const raw=text.replace(/^\uFEFF/,'').split(/\r\n|\r|\n/);if(raw.at(-1)==='')raw.pop();
 const lines=[],stanzas=[];let stanza=null,cont=null;
 const open=(nm,n,implicit=false)=>{stanza={name:nm,line:n,implicit,fid,keys:new Map()};stanzas.push(stanza);return stanza};
 raw.forEach((line,i)=>{const n=i+1,t=line.trim(),base={n,text:line,file:kind,fid};
  if(cont){lines.push({...base,kind:'continuation',of:cont.n,stanza:cont.stanza});cont.value+='\n'+t;if(!t.endsWith('\\'))cont=null;return}
  if(!t){lines.push({...base,kind:'blank'});return}
  if(t.startsWith('#')){lines.push({...base,kind:'comment'});return}
  if(t.startsWith('[')&&t.endsWith(']')){lines.push({...base,kind:'stanza',stanza:open(t.slice(1,-1).trim(),n)});return}
  const eq=t.indexOf('='),st=stanza||open('default',0,true);
  if(eq<1){lines.push({...base,kind:'setting',invalid:true,stanza:st,key:'',value:t});return}
  const r={...base,kind:'setting',stanza:st,key:t.slice(0,eq).trim(),value:t.slice(eq+1).trim()};lines.push(r);if(r.value.endsWith('\\'))cont=r});
 return {lines,stanzas,settings:lines.filter(r=>r.kind==='setting')}}
// Which file it is: by its name, or else by what is in it.
function confType(name,text){const n=name.toLowerCase().split('/').pop();for(const t of fileTypes)if(n.includes(t))return t;
 const heads=[...text.matchAll(/^\s*\[([^\]\r\n]+)\]\s*$/gm)].map(m=>m[1]);
 if(heads.some(h=>/^[A-Za-z][\w.-]*:\/\//.test(h)||/^(splunktcp|splunktcp-ssl|tcp-ssl|http|SSL)(:|$)/.test(h)))return'inputs';
 if(/^\s*(REGEX|DEST_KEY|FORMAT|INGEST_EVAL|CLONE_SOURCETYPE|filename|DELIMS)\s*=/m.test(text))return'transforms';
 return'props'}

// Where a file sits in Splunk's precedence order. Splunk reads system/local first, then every app's local folder, then
// every app's default folder, then system/default; apps in the ASCII order of their folder names, so a name starting with
// a capital letter comes before one starting with a small one. On an indexer cluster peer, the apps its manager sends
// (peer-apps, slave-apps before Splunk 9.0) come first by their local folders, and after the other apps' local folders
// by their default ones. A file's path, from a folder upload, gives its place.
const layers={'peer-local':{rank:0,label:'peer-apps local'},'system-local':{rank:1,label:'system/local'},'app-local':{rank:2,label:'app local'},'peer-default':{rank:3,label:'peer-apps default'},'app-default':{rank:4,label:'app default'},'system-default':{rank:5,label:'system/default'}};
function placeOf(path){const parts=path.replace(/\\/g,'/').split('/').filter(Boolean),dir=(parts.at(-2)||'').toLowerCase();
 if(!['local','default'].includes(dir)||parts.length<3)return null;
 if(parts.at(-3)==='system')return {layer:`system-${dir}`,app:null};
 return {layer:`${['peer-apps','slave-apps'].includes(parts.at(-4))?'peer':'app'}-${dir}`,app:parts.at(-3)}}
// Folders of an etc folder whose files Splunk doesn't merge with the instance's own: the apps it sends to other
// instances, and each user's folder, read at search time for that user only.
function heldBack(path){const parts=path.replace(/\\/g,'/').split('/').filter(Boolean);
 if(parts.at(-5)==='users')return'users';
 const i=parts.lastIndexOf('etc');return i>=0&&['deployment-apps','manager-apps','master-apps','shcluster'].includes(parts[i+1])?parts[i+1]:null}
const ascii=(x,y)=>x===y?0:x<y?-1:1;
// Highest precedence first. A file uploaded on its own has no app, and comes after the named apps in its layer. Two
// files in the same place can't both exist in Splunk; the later upload is taken to win.
const byPrecedence=(a,b)=>layers[a.place.layer].rank-layers[b.place.layer].rank||ascii(a.place.app??'\uffff',b.place.app??'\uffff')||b.seq-a.seq;

function stanzaKind(name){return name==='default'?'default':name.startsWith('source::')?'source':name.startsWith('host::')?'host':/^(delayed)?rule::/.test(name)?'rule':'sourcetype'}
function stanzaLabel(st){
 if(st.implicit)return'Global settings, before the first stanza';
 const v=st.name.replace(/^[a-z]+::/,'');
 return {default:'Default: every source type',source:`Source: ${v}`,host:`Host: ${v}`,rule:`Source type rule: ${v}`,sourcetype:`Source type: ${v}`}[st.kind]+(st.structured?` · structured (${st.structured})`:'')}
// What an inputs.conf stanza is, from its name.
function inputStanza(name){
 const at=(label,...names)=>({stages:ids(...names),label});
 if(name==='default')return at('Defaults for every input on this instance','Source-wide metadata');
 if(name==='http')return {...at('The HTTP Event Collector listener','Listener and request decoding'),hec:'listener'};
 if(name==='SSL')return at('TLS for the receiving ports','Inter-component TLS certificate validation');
 if(name.startsWith('http://'))return {...at(`An HEC token, ${name.slice(7)}`,'Token validation and index authorisation','HEC ingestion token validation'),hec:'token'};
 if(/^splunktcp-ssl(:|$)/.test(name))return at('Receives data from forwarders over TLS','tcpin_queue','Inter-component TLS certificate validation');
 if(/^splunktcp(:|$)/.test(name))return at('Receives data from forwarders','tcpin_queue');
 if(name.startsWith('splunktcptoken://'))return at('A token forwarders must present','Splunk shared-secret verification');
 if(name.startsWith('tcp-ssl:'))return at('Raw TCP over TLS','Source acquisition','Inter-component TLS certificate validation');
 if(name.startsWith('monitor://'))return {...at('','Source acquisition','UF monitored-file pickup'),path:name.slice(10)};
 if(/^(fschange|remote_queue):/.test(name))return at('','Source acquisition');
 const scheme=name.match(/^([A-Za-z][\w.-]*):\/\//)?.[1];if(!scheme)return null;
 if(!builtInSchemes.includes(scheme)){const near=builtInSchemes.find(b=>levenshtein(scheme.toLowerCase(),b.toLowerCase())<=(scheme.length<=4?1:2));if(near)return {stages:ids('Source acquisition'),typo:`No input is called ${scheme}://. Did you mean ${near}://? Splunk ignores this stanza.`}}
 return at(builtInSchemes.includes(scheme)?'':`A modular input, ${scheme}`,'Source acquisition')}
// INGEST_EVAL's assignments, split at the commas outside brackets and quotes.
function evalTargets(expr){const out=[];let depth=0,quote=null,start=0;
 for(let i=0;i<=expr.length;i++){const c=expr[i];if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue}
  if(c==='"'||c==="'")quote=c;else if(c==='(')depth++;else if(c===')')depth--;else if(i===expr.length||(c===','&&!depth)){const m=expr.slice(start,i).trim().match(/^([A-Za-z_][\w:.-]*)\s*:?=(?!=)/);if(m)out.push(m[1]);start=i+1}}
 return out}
// What a transforms.conf stanza does, and so the stage it acts in, from its settings together and from how props.conf
// runs it: TRANSFORMS- at index time, REPORT- and LOOKUP- at search time.
function transformRole(name,keys,used=[],propsLoaded){
 const v=k=>keys.get(k)?.value,dest=v('DEST_KEY'),fmt=v('FORMAT')||'',clone=v('CLONE_SOURCETYPE'),ingest=v('INGEST_EVAL'),write=truthy(v('WRITE_META')),uses=new Set(used.map(u=>u.use));
 const role=(stage,label,extra={})=>({area:'stage',stage:stage?stageNamed(stage)?.id:null,also:[],label,...extra});
 let out;
 if(v('filename')||v('collection')||v('external_cmd'))out=role('Lookups',`Lookup table ${v('filename')||v('collection')||v('external_cmd')}`,{search:true,lookup:true});
 else if(name.startsWith('metric-schema:')||[...keys.keys()].some(k=>k.startsWith('METRIC-SCHEMA-')))out=role('Index-time transformations','Turns events into metric data points');
 else if(clone)out=role('Event cloning',`Copies matching events as ${clone}`);
 else if(ingest){const targets=evalTargets(ingest),at=[...new Set(targets.map(evalStage))];
  out=targets.length?{...role(at[0],at.length===1&&at[0]==='Indexed-field creation'?`Writes ${targets.join(', ')} as ${targets.length>1?'indexed fields':'an indexed field'}`:`Sets ${targets.join(', ')}`),also:at.slice(1).map(s=>stageNamed(s).id)}:role('Index-time transformations','Evaluates an expression at index time')}
 else if(dest&&dest in destStages){const at=destStages[dest];
  out=role(at,dest==='queue'?(/^nullQueue$/i.test(fmt)?'Drops matching events (nullQueue)':`Sends matching events to ${fmt}`):dest==='_MetaData:Index'?`Sets the index to ${fmt}`:dest.startsWith('MetaData:')?`Sets the ${dest.slice(9).toLowerCase()} to ${fmt.replace(/^\w+::/,'')}`:dest==='_raw'?'Rewrites _raw':dest==='_meta'?'Writes indexed fields':/ROUTING$/.test(dest)?`Sends matching events to ${fmt.split(',').map(x=>x.trim()).join(' and ')}`:`Sets ${dest}`)}
 else if(dest){const near=Object.keys(destStages).find(k=>k.toLowerCase()===dest.toLowerCase())||Object.keys(destStages).find(k=>levenshtein(k,dest)<=1);
  out=role('Index-time transformations',`Splunk has no DEST_KEY called ${dest}${near?`. Did you mean ${near}? Key names are case sensitive`:''}, so it changes nothing`,{area:'misplaced'})}
 else if(write){const fields=fmt.match(/[\w.]+(?=::)/g)||['fields'];out=role('Indexed-field creation',`Writes ${fields.join(', ')} as ${fields.length>1?'indexed fields':'an indexed field'}`)}
 else if(uses.has('index')&&!uses.has('search'))out=role('Index-time transformations','Has no DEST_KEY or WRITE_META, so it changes nothing at index time',{area:'misplaced'});
 // A REPORT- line runs it at search time; a TRANSFORMS- line naming it as well changes nothing.
 else if(v('REGEX')||v('DELIMS'))out=role('Transform field extraction','Extracts fields at search time',{search:true,indexIdle:uses.has('index')});
 else out=role(null,'Has no REGEX, INGEST_EVAL or lookup settings, so it does nothing',{area:'unknown'});
 // A lookup can still be used by a search; anything else props.conf doesn't name never runs.
 out.usedBy=used;out.unused=propsLoaded&&!used.length&&out.area==='stage'&&!out.lookup;return out}

// The files and what the view shows of them. Nothing is kept: a reload starts empty.
const pm=state.configView205={files:[],tab:null,only:true,focus:'all',error:'',seq:0,groups:{},types:[]};
// By sound: an Indexer, an HEC Delivery, but a Universal Forwarder.
const article=name=>/^(HEC|[AEIO])/.test(name)?'an':'a';
const tier=()=>state.component||'all';
const fileById=id=>pm.files.find(f=>f.id===id);
const kindFiles=kind=>pm.groups[kind]||[];
const fileNo=f=>kindFiles(f.kind).indexOf(f)+1;
const fileLabel=f=>f.path&&f.path.includes('/')?f.path:f.name;
function addFile(kind,name,path,text,place){const seq=++pm.seq,id='f'+seq,f={id,seq,kind,name,path,place:place||placeOf(path)||{layer:'app-local',app:null},placeFrom:place?'chosen':placeOf(path)?'path':'default'};f.doc=parseConf(text,kind,id);pm.files.push(f);return f}

// Work out every line of every file, the files read together: run after any file is added, moved or removed.
function analyse(){
 pm.groups=Object.fromEntries(fileTypes.map(t=>[t,pm.files.filter(f=>f.kind===t).sort(byPrecedence)]));
 const merged={};
 // Each kind's files merge from the lowest precedence up, so the highest file's line holds each setting. Within a file
 // Splunk keeps the last line.
 for(const t of fileTypes){const m=new Map(),files=kindFiles(t);
  for(const f of [...files].reverse())for(const r of f.doc.settings){if(r.invalid)continue;if(!m.has(r.stanza.name))m.set(r.stanza.name,new Map());const keys=m.get(r.stanza.name),before=keys.get(r.key);keys.set(r.key,r);r.overrides=before&&before.fid!==r.fid?[...(before.overrides||[]).filter(x=>x.fid!==r.fid),before]:(before?.overrides||[])}
  // A stanza in several files stands in the Matrix once, by the header of the highest file that has it.
  const first=new Set();
  for(const f of files){for(const st of f.doc.stanzas){st.keys=m.get(st.name)||new Map();st.primary=!first.has(st.name);first.add(st.name)}for(const r of f.doc.settings){if(r.invalid)continue;const w=r.stanza.keys.get(r.key);r.overriddenBy=w===r?null:w}}
  merged[t]=m}
 const P=kindFiles('props'),T=kindFiles('transforms'),I=kindFiles('inputs'),propsStanzas=P.flatMap(f=>f.doc.stanzas);
 for(const st of propsStanzas){st.kind=stanzaKind(st.name);const ie=st.keys.get('INDEXED_EXTRACTIONS')?.value;st.structured=ie&&ie.toLowerCase()!=='none'?ie.toLowerCase():null}
 for(const f of I)for(const st of f.doc.stanzas){st.input=inputStanza(st.name);const off=st.keys.get('disabled');st.disabledBy=off&&truthy(off.value)?off:null}
 // A disabled HTTP Event Collector turns off every token.
 const hecOff=I.flatMap(f=>f.doc.stanzas).find(st=>st.input?.hec==='listener'&&st.disabledBy)?.disabledBy;
 if(hecOff)for(const f of I)for(const st of f.doc.stanzas)if(st.input?.hec==='token')st.disabledBy=st.disabledBy||hecOff;
 // The props.conf lines that run transforms.conf stanzas, and the stanzas they run; only the lines that hold their setting.
 const used=new Map([...merged.transforms.keys()].map(n=>[n,[]]));
 for(const f of P)for(const r of f.doc.settings){r.refs=null;const use={'TRANSFORMS-':'index','RULESET-':'index','REPORT-':'search','LOOKUP-':'lookup'}[classOf(r.key)];if(!use||r.invalid)continue;
  r.refs=(use==='lookup'?[r.value.split(/\s+/)[0]]:r.value.split(',').map(x=>x.trim()).filter(Boolean)).map(name=>{if(!r.overriddenBy)used.get(name)?.push({r,use});return name})}
 pm.roles=new Map([...merged.transforms].map(([name,keys])=>[name,transformRole(name,keys,used.get(name),P.length>0)]));
 pm.merged=merged;
 for(const f of pm.files)for(const r of f.doc.lines)r.m=r.kind==='setting'?(r.invalid?{area:'invalid'}:classify[f.kind](r)):r.kind==='stanza'?stanzaMap[f.kind](r):null;
 assignTypes()}

const classify={
 props(r){
  const k=r.key.replace(/^(MORE|LESS)_THAN_\d+$/,'$1_THAN'),st=r.stanza;
  if(st.structured&&structuredReads.includes(k))return {area:'stage',stages:ids('Structured-data parsing'),note:`This stanza sets INDEXED_EXTRACTIONS, so the structured parser applies it where the file is read. Without that, it would be stage ${pad(propsStages.get(k)[0])}’s.`};
  if(k==='sourcetype'&&!['source','rule'].includes(st.kind))return {area:'misplaced',stages:propsStages.get(k),note:'sourcetype is only read in [source::…] and rule stanzas. Here it has no effect.'};
  const own=propsStages.get(k)||propsStages.get(classOf(k));
  if(own)return r.refs?{area:'stage',stages:own,...refsNote(r)}:{area:'stage',stages:own};
  if(lookup(k,splunkWeb))return {area:'web'};
  if(k==='priority')return {area:'precedence',note:'Decides which of several matching source:: or host:: stanzas wins. It isn’t a pipeline stage.'};
  return elsewhere(k,'props')||unknown('props.conf',suggest(r.key,propsPool))},
 transforms(r){
  if(!isTransformsKey(r.key))return elsewhere(r.key,'transforms')||unknown('transforms.conf',suggest(r.key,transformsKeys));
  return roleMapping(pm.roles.get(r.stanza.name))},
 inputs(r){
  const k=r.key,input=r.stanza.input;
  const at=(input?.hec==='token'&&hecTokenStages.get(k))||(k==='disabled'&&input?.stages)||inputStages.get(k)||(/^(whitelist|blacklist)\d$/.test(k)&&ids('Source acquisition'))||(isInputsKey(k)&&(input?.stages||ids('Source acquisition')).slice(0,1));
  if(at)return {area:'stage',stages:at,note:k==='sourcetype'?parsedBy(r.value):''};
  const other=elsewhere(k,'inputs');if(other)return other;
  const guess=suggest(k,inputsPool);if(guess)return unknown('inputs.conf',guess);
  return {area:'stage',stages:(input?.stages||ids('Source acquisition')).slice(0,1),note:'A setting of this kind of input.'}}
};
const stanzaMap={
 props:()=>({area:'context'}),
 transforms(r){const role=pm.roles.get(r.stanza.name);if(!role)return null;
  const runBy=role.usedBy.map(u=>`${fileLabel(fileById(u.r.fid))} line ${u.r.n}, ${u.r.key}${u.r.stanza.implicit?'':` in [${u.r.stanza.name}]`}`);
  return {...roleMapping(role),label:role.label,note:`${role.label}.${role.indexIdle?' At index time it changes nothing: it has no DEST_KEY or WRITE_META.':''}${runBy.length?` Run by ${runBy.join('; ')}.`:role.unused?' No TRANSFORMS- or REPORT- line in props.conf names it, so it never runs.':''}`}},
 inputs(r){const st=r.stanza,input=st.input;
  if(!input)return {area:'unknown',note:'Not an input: an inputs.conf stanza names one, such as [monitor://<path>].'};
  if(input.typo)return {area:'unknown',note:input.typo};
  let note=input.label?input.label+'.':'';
  if(input.path&&!st.keys.get('sourcetype')){const src=sourceStanza(input.path);if(src){const line=src.keys.get('sourcetype');note+=`${note?' ':''}Its source type, ${line.value}, comes from ${fileLabel(fileById(line.fid))} line ${line.n}.`}}
  return {area:'stage',stages:input.stages,note}}
};
const sourceStanza=path=>kindFiles('props').flatMap(f=>f.doc.stanzas).find(s=>s.kind==='source'&&s.name.slice(8)===path&&s.keys.get('sourcetype'));
function roleMapping(role){if(!role)return {area:'unknown'};
 return role.area==='stage'?{area:'stage',stages:[role.stage,...role.also],on:role.search?role.stage:transformsAt,unused:role.unused}:role.area==='misplaced'?{area:'misplaced',stages:[role.stage],on:transformsAt}:{area:role.area}}
// A props.conf line that names transforms.conf stanzas: what each one does, once transforms.conf is there.
function refsNote(r){const index=r.key.startsWith('TRANSFORMS-')||r.key.startsWith('RULESET-');
 if(!kindFiles('transforms').length)return {note:index?'What it does depends on the transforms.conf stanzas it names: routing (stage 23), masking (24), copying (25) or indexed fields (26). Add transforms.conf to see which.':''};
 // A search-time stanza, or a lookup, named by an index-time line does nothing there.
 const missing=r.refs.filter(name=>!pm.roles.has(name)),idle=index?r.refs.filter(name=>pm.roles.get(name)?.search):[];
 return {missing:missing.length>0,idle:idle.length>0,note:r.refs.map(name=>{const role=pm.roles.get(name);return !role?`[${name}] isn’t in transforms.conf`:idle.includes(name)?`[${name}] changes nothing at index time: it has no DEST_KEY or WRITE_META`:`[${name}] ${role.stage?`→ ${pad(role.stage)}: `:''}${inSentence(role.label)}`}).join('. ')+'.'}}
function parsedBy(sourcetype){if(!kindFiles('props').length)return'';const st=kindFiles('props').flatMap(f=>f.doc.stanzas).find(s=>s.kind==='sourcetype'&&s.name===sourcetype);return st?`props.conf [${sourcetype}] parses it.`:`props.conf has no [${sourcetype}] stanza.`}

// The source types each stanza handles, for following one through the Matrix. null is every source type.
function assignTypes(){
 const found=new Set(),one=v=>{found.add(v);return new Set([v])},P=kindFiles('props');
 for(const f of P)for(const st of f.doc.stanzas){const set=st.keys.get('sourcetype')?.value;st.types=st.kind==='sourcetype'?one(st.name):(st.kind==='source'||st.kind==='rule')&&set?one(set):null}
 for(const f of kindFiles('transforms'))for(const st of f.doc.stanzas){const role=pm.roles.get(st.name);if(!P.length||st.implicit||!role){st.types=null;continue}
  let types=new Set();for(const u of role.usedBy){if(u.r.stanza.types===null){types=null;break}u.r.stanza.types.forEach(t=>types.add(t))}
  const clone=st.keys.get('CLONE_SOURCETYPE')?.value;if(types&&clone)types.add(clone),found.add(clone);st.types=types}
 const inputs=kindFiles('inputs').flatMap(f=>f.doc.stanzas);
 for(const st of inputs){const set=st.keys.get('sourcetype')?.value,src=st.input?.path&&sourceStanza(st.input.path);st.types=set?one(set):src?one(src.keys.get('sourcetype').value):null}
 // The HEC listener carries what its tokens do.
 const tokens=inputs.filter(s=>s.input?.hec==='token');
 for(const st of inputs)if(st.input?.hec==='listener')st.types=tokens.length&&tokens.every(t=>t.types)?new Set(tokens.flatMap(t=>[...t.types])):null;
 pm.types=[...found].sort();if(pm.focus!=='all'&&!found.has(pm.focus))pm.focus='all'}
const inFocus=r=>pm.focus==='all'||(r.stanza?(r.stanza.types===null||r.stanza.types.has(pm.focus)):false);

// The lines each stage applies, the ones it also takes part in after them. A transforms.conf stanza stands for its lines,
// and a line another file overrides has no part.
const chipFor=r=>r.m&&!r.overriddenBy&&['stage','misplaced'].includes(r.m.area)&&(r.kind==='stanza'?r.file!=='props'&&r.stanza.primary:r.kind==='setting'&&r.file!=='transforms');
function linesByStage(){const map=new Map();
 for(const t of fileTypes)for(const f of kindFiles(t))for(const r of f.doc.lines){if(!chipFor(r)||!inFocus(r))continue;r.m.stages.forEach((id,i)=>{if(!map.has(id))map.set(id,[]);map.get(id).push({r,also:i>0})})}
 const order=r=>fileTypes.indexOf(r.file)*1e6+fileNo(fileById(r.fid))*1e4+r.n;
 for(const list of map.values())list.sort((a,b)=>a.also-b.also||order(a.r)-order(b.r));return map}
// The lines that count: settings, and the inputs.conf and transforms.conf stanzas, which are inputs and transforms.
const counted=()=>pm.files.flatMap(f=>f.doc.lines.filter(r=>r.m&&inFocus(r)&&(r.kind==='setting'||(r.kind==='stanza'&&f.kind!=='props'))));
const sameFile=r=>r.overriddenBy&&r.overriddenBy.fid===r.fid;
const toCheck=r=>['unknown','invalid','elsewhere','misplaced'].includes(r.m.area)||sameFile(r)||r.m.missing||r.m.idle||(r.kind==='stanza'&&r.m.unused);

// What a line does on the component chosen in the strip: the Matrix's own cell for its stage. Settings read with the
// source act where the data is read, so on a Heavy Forwarder, an indexer or a search head they cover only the inputs it
// runs itself; a search head's index-time settings cover only its own data; search peers use the search head's copy of
// the search-time settings, not their own.
const rank={no:0,conditional:1,required:2};
function cells(r){const s=stageById(r.m.on||r.m.stages[0]),gate=r.file==='inputs'&&r.kind==='setting'&&r.stanza.input?.stages?.length?stageById(r.stanza.input.stages[0]):null;
 return Object.fromEntries(componentOrder.map(k=>[k,gate&&rank[gate[k]]<rank[s[k]]?gate[k]:s[k]]))}
function effect(r){const m=r.m,t=tier();if(!m)return null;
 if(r.overriddenBy||m.area==='misplaced'||m.unused||r.stanza?.disabledBy)return'no';
 if(m.area!=='stage'||t==='all')return null;
 const s=stageById(m.on||m.stages[0]),cell=cells(r)[t];if(cell==='no')return'no';
 if(s.pipeline===SEARCH)return t==='idx'?'no':cell;
 if(r.file!=='inputs'&&(t==='sh'||(['hf','idx'].includes(t)&&r.file==='props'&&readTime.includes(s.name))))return'own';
 return cell}
const effectLabel={required:'Takes effect',conditional:'Conditional',own:'Own inputs only',no:'No effect'},effectTone={required:'yes',conditional:'maybe',own:'maybe',no:'none'};
// Why a line has no effect, for its title and the detail.
function whyNot(r){const t=tier();if(r.overriddenBy)return sameFile(r)?`Line ${r.overriddenBy.n} sets it again; Splunk keeps the last value.`:`Overridden by ${fileLabel(fileById(r.overriddenBy.fid))} line ${r.overriddenBy.n}.`;
 if(r.stanza?.disabledBy)return`This input is disabled by ${fileLabel(fileById(r.stanza.disabledBy.fid))} line ${r.stanza.disabledBy.n}.`;
 if(r.m.unused)return'Nothing runs this transform.';
 const s=r.m.stages?.length?stageById(r.m.on||r.m.stages[0]):null;
 if(s&&s.pipeline===SEARCH&&t==='idx')return'Search peers apply the search head’s copy of search-time settings, not their own.';
 return t!=='all'&&componentNames[t]?`Stage ${pad(s?.id)} doesn’t run on ${article(componentNames[t])} ${componentNames[t]}.`:''}

// The Config view's Matrix lists only the stages the files set, when asked; the other views are left as they are.
const filteredBefore=filtered;
filtered=function(){const list=filteredBefore.apply(this,arguments);if(state.view!=='config'||!pm.files.length||!pm.only)return list;const hit=linesByStage();return list.filter(s=>hit.has(s.id))};

// The view: its own button beside Matrix, a line naming the component the files are checked against, the panel and
// the view's Matrix. The component strip stays, and drives the checks.
document.querySelector('.seg button[data-view="matrix"]')?.insertAdjacentHTML('afterend','<button data-view="config">Config</button>');
const viewButton=document.querySelector('.seg button[data-view="config"]');if(viewButton)viewButton.onclick=()=>switchView('config');
const stripLabel=document.createElement('p');stripLabel.className='configStripLabel205';document.querySelector('.componentStrip').before(stripLabel);
const panel=document.createElement('section');panel.id='configView205';panel.className='propsMap205';panel.setAttribute('aria-label','Configuration files on the Matrix');
document.getElementById('matrix').before(panel);
const fileInput=Object.assign(document.createElement('input'),{type:'file',accept:'.conf,.txt,text/plain',multiple:true,hidden:true});
const folderInput=Object.assign(document.createElement('input'),{type:'file',multiple:true,hidden:true});folderInput.setAttribute('webkitdirectory','');
document.body.append(fileInput,folderInput);

const badge=kind=>`<i class="propsFile205" data-file="${kind}" title="${kind}.conf">${fileLetter[kind]}</i>`;
const shortTier=k=>({uf:'UF',hf:'HF',idx:'IDX',sh:'SH'})[k];
function tiersHtml(r){
 if(!['stage','misplaced'].includes(r.m.area))return'';
 const c=cells(r),e=effect(r);
 if(tier()!=='all'||e==='no')return`<span class="propsEffect205 ${effectTone[e]||'none'}" title="${esc(e==='no'?whyNot(r):e==='own'?`Only for data the ${componentNames[tier()]} reads itself, such as its own logs: data forwarded to it was read, and this applied, upstream.`:'')}">${effectLabel[e]||'No effect'}</span>`;
 return`<span class="propsTiers205">${['uf','hf','idx','sh'].map(k=>`<i class="${c[k]==='required'?'yes':c[k]==='conditional'?'maybe':'none'}" title="${componentNames[k]}: ${statusLabel(c[k])}">${shortTier(k)}</i>`).join('')}</span>`}
function targetHtml(r){const m=r.m;
 if(m.area==='stage'||m.area==='misplaced'){const [id,...also]=m.stages,s=stageById(id);return`<button class="propsStage205" data-stage="${id}" style="--accent:${colors[s.pipeline]||'#57c7e8'}" title="Show stage ${pad(id)} in the Matrix"><b>${pad(id)}</b>${esc(s.name)}</button>${also.length?`<small class="propsAlso205">also ${also.map(pad).join(', ')}</small>`:''}`}
 return {web:'<span class="propsTag205">Splunk Web · source type list</span>',precedence:'<span class="propsTag205">Stanza precedence</span>',elsewhere:'<span class="propsTag205" data-tone="bad">Belongs in another file</span>',unknown:`<span class="propsTag205" data-tone="bad">${r.kind==='stanza'?'Not a stanza Splunk reads':`Not a ${r.file}.conf setting`}</span>`,invalid:'<span class="propsTag205" data-tone="bad">Not a setting</span>'}[m.area]||''}
const codeHtml=r=>r.kind==='stanza'?esc(r.text.trim()):r.invalid?esc(r.value):`<span class="propsK205">${esc(r.key)}</span> = <span class="propsV205">${esc(shown(r))}</span>`;
function lineNote(r){
 if(r.overriddenBy)return whyNot(r)+(r.m.note&&!sameFile(r)?' '+r.m.note:'');
 if(r.invalid)return'There’s no “=”, so Splunk can’t read this line.';
 const over=(r.overrides||[]).map(x=>`${fileLabel(fileById(x.fid))} line ${x.n}`);
 return [r.stanza?.disabledBy&&(r.kind==='stanza'||r.key==='disabled')?`Disabled: ${r.stanza.disabledBy===r?'this line turns the input off':`${fileLabel(fileById(r.stanza.disabledBy.fid))} line ${r.stanza.disabledBy.n} turns it off`}.`:'',over.length?`Overrides ${over.join(' and ')}.`:'',r.m.note||''].filter(Boolean).join(' ')}
function lineHtml(r){
 if(r.kind==='blank')return'';const id=`${r.fid}:${r.n}`;
 if(r.kind==='comment')return pm.focus==='all'?`<li class="propsLine205" data-kind="comment" data-line="${id}"><span class="propsN205">${r.n}</span><code>${esc(r.text.trim())}</code></li>`:'';
 if(!inFocus(r))return'';
 if(r.kind==='continuation')return`<li class="propsLine205" data-kind="continuation" data-line="${id}"><span class="propsN205">${r.n}</span><code>${esc(r.text.trim())}</code><span class="propsTag205">continues line ${r.of}</span></li>`;
 if(r.kind==='stanza'&&r.file==='props')return`<li class="propsLine205" data-kind="stanza" data-line="${id}"><span class="propsN205">${r.n}</span><code>${esc(r.text.trim())}</code><span class="propsStanzaKind205">${esc(stanzaLabel(r.stanza))}</span></li>`;
 const e=effect(r),note=lineNote(r);
 // A transforms.conf setting acts with its stanza, whose line above carries the stage.
 const withStanza=r.file==='transforms'&&r.kind==='setting'&&!r.invalid&&isTransformsKey(r.key)&&['stage','misplaced'].includes(r.m.area)&&!r.overriddenBy;
 const target=withStanza?`<span class="propsSame205" title="Acts with [${esc(r.stanza.name)}]">↳ ${pad(r.m.stages[0])}</span>`:targetHtml(r);
 return`<li class="propsLine205${e==='no'?' noEffect205':''}${r.overriddenBy&&!sameFile(r)?' overridden205':''}" data-kind="${r.kind}" data-area="${r.m.area}" data-line="${id}"><span class="propsN205">${r.n}</span><code title="${esc(r.kind==='setting'&&!r.invalid?`${r.key} = ${shown(r)}`:r.text.trim())}">${codeHtml(r)}</code><span class="propsTo205">${target}</span>${withStanza?'':tiersHtml(r)}${note?`<p class="propsNote205">${esc(note)}</p>`:''}</li>`}

function summary(){
 const list=counted(),live=list.filter(r=>!r.overriddenBy),count=a=>live.filter(r=>r.m.area===a).length,mapped=live.filter(r=>r.m.area==='stage'),stagesHit=linesByStage().size,attention=list.filter(toCheck).length,over=list.filter(r=>r.overriddenBy&&!sameFile(r)).length,t=tier(),chips=[];
 if(t==='all')chips.push(`<span data-tone="stage"><b>${mapped.length}</b> line${mapped.length===1?'':'s'} on <b>${stagesHit}</b> stage${stagesHit===1?'':'s'}</span>`);
 else{const n=v=>mapped.filter(r=>effect(r)===v).length,on=n('required')+n('conditional'),own=n('own'),off=n('no');chips.push(`<span data-tone="stage"><b>${on}</b> take effect on ${article(componentNames[t])} ${componentNames[t]}</span>`);if(own)chips.push(`<span data-tone="own"><b>${own}</b> only for data it reads itself</span>`);if(off)chips.push(`<span data-tone="bad"><b>${off}</b> have no effect there</span>`)}
 if(over)chips.push(`<span><b>${over}</b> overridden by a higher file</span>`);
 if(count('web'))chips.push(`<span><b>${count('web')}</b> Splunk Web</span>`);
 if(count('precedence'))chips.push(`<span><b>${count('precedence')}</b> stanza precedence</span>`);
 if(attention)chips.push(`<span data-tone="bad"><b>${attention}</b> to check</span>`);
 return chips.join('')}

function placeSelect(f){return`<select data-place="${f.id}" aria-label="Where ${esc(f.name)} sits">${Object.entries(layers).map(([k,v])=>`<option value="${k}" ${f.place.layer===k?'selected':''}>${v.label}</option>`).join('')}</select>`}
function renderPanel(){
 const on=state.view==='config';panel.hidden=!on;stripLabel.hidden=!on;
 const t=tier();stripLabel.innerHTML=t==='all'?'Choose a component to check where each line takes effect on it.':`Checking where each line takes effect on ${article(componentNames[t])} <b>${esc(componentNames[t])}</b>. Choose another component, or All components.`;
 panel.classList.toggle('propsEmpty205',!pm.files.length);
 if(!pm.files.length){panel.innerHTML=`<div class="propsHead205"><div class="propsTitle205"><small>Configuration files</small><strong>See where your configuration acts</strong><span>${pm.error?`<em class="propsError205">${esc(pm.error)}</em>`:'Upload inputs.conf, props.conf and transforms.conf files, or an app or etc folder, or drop them here. Each line is matched to the stage below that applies it, and files of one kind are merged in Splunk’s precedence order.'}</span></div><div class="propsActions205"><button class="builderBtn" data-props-example>Try an example</button><button class="builderBtn" data-props-folder>Upload a folder</button><button class="builderBtn primary" data-props-upload>Upload files</button></div></div>`;bindPanel();return}
 const kinds=fileTypes.filter(k=>kindFiles(k).length);if(!kinds.includes(pm.tab))pm.tab=kinds.includes('props')?'props':kinds[0];
 const settings=pm.files.reduce((n,f)=>n+f.doc.settings.filter(r=>!r.invalid).length,0),apps=new Set(pm.files.map(f=>f.place.app).filter(Boolean)),missing=fileTypes.filter(k=>!kindFiles(k).length),files=kindFiles(pm.tab);
 panel.innerHTML=`<div class="propsHead205"><div class="propsTitle205"><small>Configuration files</small><strong>${pm.files.length} file${pm.files.length===1?'':'s'}${apps.size?` from ${[...apps].map(esc).join(', ')}`:''}</strong><span>${settings} settings, merged in Splunk’s precedence order${pm.error?` · <em class="propsError205">${esc(pm.error)}</em>`:''}</span></div><div class="propsActions205">
  ${pm.types.length?`<label>Source type <select data-props-focus><option value="all">All source types</option>${pm.types.map(x=>`<option ${pm.focus===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`:''}
  <label class="propsOnly205"><input type="checkbox" data-props-only ${pm.only?'checked':''}> Only stages these files set</label>
  <button class="builderBtn" data-props-upload>Upload files</button><button class="builderBtn" data-props-folder>Upload a folder</button><button class="builderBtn" data-props-clear>Clear</button></div></div>
 <div class="propsSummary205" aria-live="polite">${summary()}</div>
 <div class="propsTabs205" role="tablist" aria-label="Kinds of file">${kinds.map(k=>`<button role="tab" data-props-tab="${k}" aria-selected="${k===pm.tab}" tabindex="${k===pm.tab?0:-1}">${badge(k)}${k}.conf<small>${kindFiles(k).length} file${kindFiles(k).length===1?'':'s'}</small></button>`).join('')}
  <span class="propsTabsEnd205">${missing.length?`<button class="propsLink205" data-props-upload>Add ${missing.map(x=>x+'.conf').join(' or ')}</button>`:''}</span></div>
 <ol class="cfFiles205" aria-label="${pm.tab}.conf files, highest precedence first">${files.map((f,i)=>`<li><b>${i+1}</b><span class="cfPath205">${esc(fileLabel(f))}</span>${f.placeFrom==='path'?`<span class="cfPlace205">${esc(layers[f.place.layer].label)}</span>`:placeSelect(f)}${i===0&&files.length>1?'<span class="cfWins205">wins</span>':''}<button class="propsLink205" data-remove-file="${f.id}">Remove</button></li>`).join('')}</ol>
 <ol class="propsLines205" role="tabpanel" aria-label="${pm.tab}.conf">${files.map((f,i)=>`${files.length>1?`<li class="cfFileHead205" data-file-head="${f.id}"><b>${i+1}</b>${esc(fileLabel(f))}<small>${esc(layers[f.place.layer].label)}${f.place.app&&!fileLabel(f).startsWith(f.place.app+'/')?` · ${esc(f.place.app)}`:''}</small></li>`:''}${f.doc.lines.map(lineHtml).join('')}`).join('')}</ol>`;
 bindPanel()}

function bindPanel(){
 panel.querySelectorAll('[data-props-upload]').forEach(b=>b.onclick=()=>fileInput.click());
 panel.querySelectorAll('[data-props-folder]').forEach(b=>b.onclick=()=>folderInput.click());
 panel.querySelector('[data-props-example]')?.addEventListener('click',loadExample);
 const on=(sel,ev,fn)=>{const el=panel.querySelector(sel);if(el)el[ev]=()=>fn(el)};
 on('[data-props-clear]','onclick',()=>{pm.files=[];pm.tab=null;pm.focus='all';pm.error='';analyse();refresh()});
 on('[data-props-focus]','onchange',el=>{pm.focus=el.value;refresh()});
 on('[data-props-only]','onchange',el=>{pm.only=el.checked;refresh()});
 panel.querySelectorAll('[data-remove-file]').forEach(b=>b.onclick=()=>{pm.files=pm.files.filter(f=>f.id!==b.dataset.removeFile);pm.error='';analyse();refresh()});
 panel.querySelectorAll('[data-place]').forEach(s=>s.onchange=()=>{const f=fileById(s.dataset.place);f.place={layer:s.value,app:s.value.startsWith('app')?f.place.app:null};f.placeFrom='chosen';analyse();refresh()});
 const tabs=[...panel.querySelectorAll('[data-props-tab]')];
 tabs.forEach((b,i)=>{b.onclick=()=>{pm.tab=b.dataset.propsTab;renderPanel();panel.querySelector(`[data-props-tab="${pm.tab}"]`).focus()};
  b.onkeydown=e=>{if(!['ArrowRight','ArrowLeft'].includes(e.key))return;e.preventDefault();tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length].click()}});
 panel.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>showStage(+b.dataset.stage))}

// A line's stage, in the view's Matrix: scrolled to just under the toolbar and flashed. A stage the search or pipeline
// filter hides opens in its detail instead.
function showStage(id){const row=document.querySelector(`#matrixBody tr[data-id="${id}"]`);if(!row){openDetail(id);return}
 const toolbar=document.querySelector('.toolbar').getBoundingClientRect().bottom;scrollTo({top:row.getBoundingClientRect().top+scrollY-toolbar-16,behavior:'smooth'});flash(row)}
// A line in the panel, on its kind's tab.
function showLine(id){const f=fileById(id.split(':')[0]);if(!f)return;if(pm.tab!==f.kind){pm.tab=f.kind;renderPanel()}
 const li=panel.querySelector(`[data-line="${id}"]`);if(!li)return;const list=li.closest('.propsLines205'),toolbar=document.querySelector('.toolbar').getBoundingClientRect().bottom;
 list.scrollTop+=li.getBoundingClientRect().top-list.getBoundingClientRect().top-list.clientHeight/3;scrollTo({top:panel.getBoundingClientRect().top+scrollY-toolbar-16,behavior:'smooth'});flash(li)}
function flash(el){el.classList.remove('propsFlash205');void el.offsetWidth;el.classList.add('propsFlash205')}

const where=r=>`${fileLabel(fileById(r.fid))} line ${r.n}${r.kind==='setting'&&!r.stanza.implicit?` · [${r.stanza.name}]`:''}`;
const chipText=r=>r.kind==='stanza'?`[${r.stanza.name}]${r.m.label?' '+inSentence(r.m.label):''}`:`${r.key} = ${shown(r)}`;
const chipNo=r=>{const f=fileById(r.fid);return kindFiles(f.kind).length>1?`${fileNo(f)}:${r.n}`:String(r.n)};
function lineChip(r,also){const e=effect(r),cls=[also?'also205':'',e==='no'?'noEffect205':e==='own'?'own205':''].join(' ').trim(),t=tier();
 return`<button class="propsRowLine205 ${cls}" data-props-line="${r.fid}:${r.n}" title="${esc(`${where(r)}${also?' · also acts here':''}${e==='no'?` · no effect${t!=='all'?` on ${article(componentNames[t])} ${componentNames[t]}`:''}`:e==='own'?` · on ${article(componentNames[t])} ${componentNames[t]}, only for data it reads itself`:''}\n${chipText(r)}`)}">${badge(r.file)}<b>${chipNo(r)}</b><code>${esc(chipText(r))}</code></button>`}
// The files' lines in the rows of the stages that apply them, and the chosen component's column picked out.
function decorate(){
 document.querySelectorAll('#matrix .propsCol205').forEach(c=>c.classList.remove('propsCol205'));
 if(state.view!=='config'||!pm.files.length)return;
 const t=tier(),col=componentOrder.indexOf(t)+3;
 if(t!=='all')document.querySelectorAll('#matrix tr').forEach(tr=>tr.children[col]?.classList.add('propsCol205'));
 const byStage=linesByStage();
 document.querySelectorAll('#matrixBody tr[data-id]').forEach(tr=>{const hits=byStage.get(+tr.dataset.id);if(!hits)return;tr.classList.add('propsHit205');
  const more=hits.length-6;tr.querySelector('td.config').insertAdjacentHTML('beforeend',`<div class="propsRowLines205">${hits.slice(0,more>0?5:6).map(h=>lineChip(h.r,h.also)).join('')}${more>0?`<button class="propsRowMore205" data-props-more="${tr.dataset.id}">${hits.length-5} more lines</button>`:''}</div>`)});
 document.querySelectorAll('#matrixBody [data-props-line]').forEach(b=>b.onclick=e=>{e.stopPropagation();showLine(b.dataset.propsLine)});
 document.querySelectorAll('#matrixBody [data-props-more]').forEach(b=>b.onclick=e=>{e.stopPropagation();openDetail(+b.dataset.propsMore)})}

function refresh(){render();renderPanel()}
const renderBefore=render;
render=function(){const result=renderBefore.apply(this,arguments);decorate();if(state.view==='config')renderPanel();return result};
// The view shows the panel and its Matrix; the Matrix view, and every other view, are left as they were.
const viewBefore=switchView;
switchView=function(){const was=state.view,result=viewBefore.apply(this,arguments),on=state.view==='config';
 document.body.classList.toggle('configView205',on);document.getElementById('matrix').classList.toggle('active',state.view==='matrix'||on);
 if(on&&document.getElementById('empty'))document.getElementById('empty').style.display=filtered().length?'none':'block';
 if((was==='config')!==on)render();renderPanel();return result};

// In the Config view, a stage's detail lists the files' lines it applies, with where they take effect.
const detailBefore=openDetail;
openDetail=function(id){const result=detailBefore.apply(this,arguments);let box=document.getElementById('dProps205');
 if(!box){box=document.createElement('div');box.id='dProps205';document.getElementById('dConfig').after(box)}
 const hits=state.view==='config'&&pm.files.length?linesByStage().get(id)||[]:[];box.hidden=!hits.length;if(!hits.length)return result;
 box.innerHTML=`<div class="sectionLabel">From your configuration</div><div class="propsDetail205">${hits.map(({r,also})=>{const e=effect(r),note=e==='no'?whyNot(r):lineNote(r);
  const keys=r.file==='transforms'&&r.kind==='stanza'?[...r.stanza.keys.values()].map(x=>`${x.key} = ${shown(x)}`).join('\n'):'';
  return`<div class="propsDetailLine205${e==='no'?' noEffect205':''}">${badge(r.file)}<code>${codeHtml(r)}${keys?`<span class="propsDetailKeys205">${esc(keys)}</span>`:''}</code><small>${esc(where(r))}${also?' · also acts here':''}${e?` · ${e==='own'?`on ${article(componentNames[tier()])} ${componentNames[tier()]}, only for data it reads itself`:`${effectLabel[e].toLowerCase()}${tier()!=='all'?` on ${article(componentNames[tier()])} ${componentNames[tier()]}`:''}`}`:''}</small>${note?`<p class="propsNote205">${esc(note)}</p>`:''}</div>`}).join('')}</div><p class="propsActs205">${esc(actsWhere(id))}</p>`;
 return result};

// Files come from the picker, a folder, or a drop of either, several at once. From a folder only inputs.conf, props.conf
// and transforms.conf are read, and their paths give their places.
async function readFiles(list){if(!list.length)return;const errors=[],held=new Map();let first=null,skipped=0;
 for(const {file,path} of list){const fromFolder=path.includes('/');
  if(fromFolder&&!/^(inputs|props|transforms)\.conf$/i.test(path.split('/').pop())){skipped++;continue}
  const folder=fromFolder&&heldBack(path);if(folder){held.set(folder,(held.get(folder)||0)+1);continue}
  if(file.size>2_000_000){errors.push(`${path} is over 2 MB`);continue}
  const text=await file.text();if(text.includes('\u0000')){errors.push(`${file.name} isn’t a text file`);continue}
  const f=addFile(confType(path,text),file.name,path,text);if(!f.doc.settings.length)errors.push(`${fileLabel(f)} has no settings`);first=first||f.kind}
 const leftOut=[...held].map(([folder,n])=>{const one=n===1;return`Left out ${n} file${one?'':'s'} in etc/${folder}: Splunk ${folder==='users'?`reads ${one?'it':'them'} only at search time, for ${one?'its user':'their users'}`:`sends ${one?'it':'them'} to other instances. Upload that folder on its own to see ${one?'it':'them'}`}`});
 pm.error=[...errors,skipped?`Skipped ${skipped} other file${skipped===1?'':'s'}`:'',...leftOut].filter(Boolean).join('. ')+(errors.length||skipped||leftOut.length?'.':'');
 if(first)pm.tab=first;analyse();refresh()}
fileInput.onchange=()=>{readFiles([...fileInput.files].map(file=>({file,path:file.name}))).finally(()=>{fileInput.value=''})};
folderInput.onchange=()=>{readFiles([...folderInput.files].map(file=>({file,path:file.webkitRelativePath||file.name}))).finally(()=>{folderInput.value=''})};
async function walk(entry,out){
 if(entry.isFile){if(/^(inputs|props|transforms)\.conf$/i.test(entry.name))out.push({file:await new Promise((ok,fail)=>entry.file(ok,fail)),path:entry.fullPath.replace(/^\//,'')});return}
 const reader=entry.createReader();let batch;do{batch=await new Promise((ok,fail)=>reader.readEntries(ok,fail));await Promise.all(batch.map(x=>walk(x,out)))}while(batch.length)}
panel.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();panel.classList.add('propsDrop205')}});
panel.addEventListener('dragleave',e=>{if(!panel.contains(e.relatedTarget))panel.classList.remove('propsDrop205')});
panel.addEventListener('drop',async e=>{e.preventDefault();panel.classList.remove('propsDrop205');
 const entries=[...(e.dataTransfer.items||[])].map(i=>i.webkitGetAsEntry?.()).filter(Boolean);
 if(entries.some(x=>x.isDirectory)){const found=[];await Promise.all(entries.map(x=>walk(x,found)));readFiles(found)}
 else readFiles([...e.dataTransfer.files].map(file=>({file,path:file.name})))});

// The example: an add-on's default files, as its vendor ships them, and the site's local overrides.
const example={
'Splunk_TA_acme/default/inputs.conf':`# Splunk_TA_acme: the inputs ship disabled; enable them in local/inputs.conf

[monitor:///var/log/acme/fw-*.log]
disabled = true
crcSalt = <SOURCE>
ignoreOlderThan = 7d

[monitor:///var/log/acme/proxy/*.csv]
disabled = true
sourcetype = acme:proxy:csv

[splunktcp-ssl:9997]
serverCert = $SPLUNK_HOME/etc/auth/acme/server.pem
sslPassword = $7$Wm9vY2F0bGVzcy1leGFtcGxl
requireClientCert = true
`,
'Splunk_TA_acme/local/inputs.conf':`# This site's inputs

[monitor:///var/log/acme/fw-*.log]
disabled = false
index = netfw

[monitor:///var/log/acme/proxy/*.csv]
disabled = false
index = proxy
_TCP_ROUTING = proxy_indexers

[http]
disabled = 0
port = 8088

[http://acme_cloud_proxy]
token = 6f1c3a2e-0b7d-4e55-9a51-2f6d8c1e9b40
index = proxy
indexes = proxy, proxy_summary
sourcetype = acme:proxy:json
useACK = true
`,
'Splunk_TA_acme/default/props.conf':`# Splunk_TA_acme: parsing and search-time knowledge for the Acme feeds

[source::/var/log/acme/fw-*.log]
sourcetype = acme:fw
CHARSET = UTF-8

[acme:fw]
EVENT_BREAKER_ENABLE = true
EVENT_BREAKER = ([\\r\\n]+)
LINE_BREAKER = ([\\r\\n]+)(?=\\d{4}-\\d{2}-\\d{2}T)
SHOULD_LINEMERGE = false
TRUNCATE = 20000
TIME_PREFIX = ^
TIME_FORMAT = %Y-%m-%dT%H:%M:%S.%3N
TZ = UTC
MAX_DAYS_AGO = 30
TRANSFORMS-route = acme_fw_drop_debug, acme_fw_to_netfw, acme_fw_to_siem
TRANSFORMS-mask = acme_fw_mask_card
TRANSFORMS-copy = acme_fw_copy_denied
TRANSFORMS-fields = acme_fw_site
SEDCMD-mask_pw = s/password=\\S+/password=########/g
ANNOTATE_PUNCT = false
SEGMENTATION = inner
EXTRACT-action = \\baction=(?<action>\\w+)
REPORT-kv = acme_fw_kv
KV_MODE = none
FIELDALIAS-src = src_ip AS src
EVAL-bytes_total = bytes_in + bytes_out
LOOKUP-geo = acme_geo ip AS src OUTPUT country
category = Network & Security
description = Acme NGFW traffic log

[acme:proxy:csv]
INDEXED_EXTRACTIONS = csv
HEADER_FIELD_LINE_NUMBER = 1
FIELD_DELIMITER = ,
TIMESTAMP_FIELDS = date, time
TIME_FORMAT = %Y-%m-%d %H:%M:%S
`,
'Splunk_TA_acme/local/props.conf':`# This site's overrides

[acme:fw]
TZ = Australia/Sydney
TRUNCATE = 50000
MAX_TIMESTAMP_LOOKAHED = 32
`,
'Splunk_TA_acme/default/transforms.conf':`# Splunk_TA_acme: transforms for the firewall feed

[acme_fw_drop_debug]
REGEX = \\slevel=debug\\s
DEST_KEY = queue
FORMAT = nullQueue

[acme_fw_to_netfw]
REGEX = \\sdevice=fw-(?:syd|mel)\\d+\\s
DEST_KEY = _MetaData:Index
FORMAT = netfw_au

[acme_fw_to_siem]
REGEX = \\saction=(?:deny|drop)\\s
DEST_KEY = _TCP_ROUTING
FORMAT = primary_indexers,siem_relay

[acme_fw_mask_card]
REGEX = ^(.*card=)\\d{12}(\\d{4}.*)$
DEST_KEY = _raw
FORMAT = $1XXXXXXXXXXXX$2

[acme_fw_copy_denied]
REGEX = \\saction=(?:deny|drop)\\s
CLONE_SOURCETYPE = acme:fw:denied
DEST_KEY = _raw
FORMAT = $0

[acme_fw_site]
INGEST_EVAL = site=lower(replace(host, "^fw-([a-z]+)\\d+$", "\\1"))

[acme_fw_rule_id]
REGEX = \\srule_id=(\\d+)
FORMAT = rule_id::$1
WRITE_META = true

[acme_fw_kv]
DELIMS = " ", "="

[acme_geo]
filename = acme_geo.csv
match_type = CIDR(ip)
`};
function loadExample(){pm.files=[];pm.seq=0;for(const [path,text] of Object.entries(example))addFile(confType(path,text),path.split('/').pop(),path,text);pm.tab='props';pm.focus='all';pm.error='';analyse();refresh()}
window.configView205={parseConf,confType,placeOf,analyse,loadExample,example,linesByStage,propsStages,inputStages,hecTokenStages,transformsKeys,destStages,searchStages,
 load(files){pm.files=[];pm.seq=0;for(const [path,text] of Object.entries(files)){const place=typeof text==='object'?text.place:null,body=typeof text==='object'?text.text:text;addFile(confType(path,body),path.split('/').pop(),path,body,place)}pm.tab=null;pm.focus='all';pm.error='';analyse();refresh()},
 readFiles};
analyse();render();renderPanel();
})();

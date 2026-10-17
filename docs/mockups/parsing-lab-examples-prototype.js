(function(){
/* Build 201: more Parsing laboratory examples, in two groups: samples of common formats, and common mistakes. Each
   example sets every setting it depends on, says in one line what it shows, and adds the props lines its format needs
   (TIME_PREFIX, TIME_FORMAT, TIMESTAMP_FIELDS) to the generated configuration.
   Two event boundaries join the three there are: CSV header line, which starts an event at each repeat of the input's
   first line, and Fixed length, which ends an event after every N characters, for a file with no line breaks.
   KV_MODE = multi reads each event as a table. A large input lists its first 25 events and counts all of them. */
if(typeof parsingLabPresets==='undefined'||typeof renderParsingLab!=='function'||typeof parsingLabModel!=='function')return;
const esc=evidenceXml;
const PREVIEW=25,MIN_RECORD=16,HEADER_MAX=256,LINE=' ';

// The settings an example owns. Choosing one starts from these defaults, so nothing carries over from the previous
// example. The processing tier is the person's choice for their topology, not the example's, and stays.
const SAMPLE_DEFAULTS={boundary:'newline',merge:false,recordLength:128,timestamp:'iso',indexExtraction:'none',searchExtraction:'none',truncate:10000,timezone:'UTC',sourcetype:'custom',index:'security',routeField:'result',routeValue:'failure',routeIndex:'security_alerts'};
const SETTING_KEYS=['raw',...Object.keys(SAMPLE_DEFAULTS)];
const GROUPS=[['samples','Samples'],['mistakes','Common mistakes']];

// The four existing samples get a group, a note and, where their format needs one, a props line.
Object.assign(parsingLabPresets.syslog,{group:'samples',note:'A continuation line has no timestamp, so it merges into the event above it. The key=value fields are extracted at search time.'});
Object.assign(parsingLabPresets.windows,{group:'samples',note:'Each <Event> element is one event. KV_MODE = xml extracts the Data fields at search time.',props:{TIME_PREFIX:'SystemTime="'}});
Object.assign(parsingLabPresets.json,{group:'samples',note:'One JSON object per line. INDEXED_EXTRACTIONS = json stores the fields at index time, so the route on result=failure can use them.',props:{TIMESTAMP_FIELDS:'time'}});
Object.assign(parsingLabPresets.csv,{group:'samples',note:'The header row names the columns. INDEXED_EXTRACTIONS = csv stores them at index time, so the route on result=failure can use them.',props:{TIMESTAMP_FIELDS:'time'}});

const javaTrace='2026-09-20T01:20:00.412Z ERROR [sso-web] thread=https-jsse-nio-8443-exec-7 user=alex src=10.10.4.21 msg="Login failed"\n'+
 'com.example.sso.AuthenticationException: Bad credentials for alex\n'+
 '\tat com.example.sso.PasswordAuthenticator.verify(PasswordAuthenticator.java:142)\n'+
 '\tat com.example.sso.LoginController.submit(LoginController.java:87)\n'+
 '\tat org.apache.catalina.core.StandardWrapperValve.invoke(StandardWrapperValve.java:197)\n'+
 '2026-09-20T01:21:15.088Z INFO [sso-web] thread=https-jsse-nio-8443-exec-2 user=alex src=10.10.4.21 msg="Login succeeded"';
const millis={TIME_FORMAT:'%Y-%m-%dT%H:%M:%S.%3N%Z'};

// A scripted input's output: a header line before the rows of each run.
const vpnHealth='collected,host,cpu_pct,mem_pct,disk_pct\n2026-09-20T01:20:00Z,vpn01,23.4,61.2,40.1\n2026-09-20T01:20:00Z,vpn02,71.9,82.5,55.0\n'+
 'collected,host,cpu_pct,mem_pct,disk_pct\n2026-09-20T01:21:00Z,vpn01,25.0,60.8,40.1\n2026-09-20T01:21:00Z,vpn02,93.6,84.1,55.0';

// A badge-controller export: 8,250 records of exactly 128 characters on one line, with no line feeds or carriage
// returns, so 1,056,000 characters, just over 1 MB. Built the first time an example needs it.
let badgeExport=null;
function badgeLine(){
 if(badgeExport)return badgeExport;
 const users=['alex','sam','priya','jordan','lee','morgan','chris','taylor'],doors=['DC1-E004','DC1-E007','DC1-L2A1'],start=Date.parse('2026-09-20T01:20:00Z'),records=[];
 for(let i=0;i<8250;i++){
  const u=i%users.length,denied=u===0&&i<40;
  const body=`${new Date(start+i*1000).toISOString().replace('.000Z','Z')} ctl=${doors[i%doors.length]} badge=${String(41873+u).padStart(8,'0')} user=${users[u].padEnd(8)} result=${(denied?'denied':'granted').padEnd(7)} reason=${(denied?'pin_fail':'ok').padEnd(9)} seq=${String(i+1).padStart(7,'0')} site=SYD-DC1`;
  let crc=0;for(let j=0;j<body.length;j++)crc=(crc*31+body.charCodeAt(j))&0xffff;
  records.push(`${body} crc=${crc.toString(16).toUpperCase().padStart(4,'0')}`);
 }
 return badgeExport=records.join('');
}

Object.assign(parsingLabPresets,{
 java:{name:'Java stack trace',group:'samples',raw:javaTrace,boundary:'timestamp',merge:true,timestamp:'iso',indexExtraction:'none',searchExtraction:'kv',sourcetype:'sso:app:log4j',index:'app',props:millis,
  note:'Stack frames have no timestamp, so they stay with the event above them: six lines become two events. TIME_FORMAT reads the milliseconds.'},
 rfc5424:{name:'RFC 5424 syslog',group:'samples',boundary:'newline',merge:false,timestamp:'iso',indexExtraction:'none',searchExtraction:'kv',sourcetype:'syslog',index:'os',props:{TIME_PREFIX:'^<\\d+>\\d+\\s+'},
  raw:'<38>1 2026-09-20T01:20:00Z vpn01.example.test sshd 4121 - - action=login result=failure user=alex src=10.10.4.21 reason=bad_password\n<38>1 2026-09-20T01:20:04Z vpn01.example.test sshd 4121 - - action=login result=failure user=alex src=10.10.4.21 reason=bad_password\n<86>1 2026-09-20T01:21:15Z vpn01.example.test sshd 4127 - - action=login result=success user=alex src=10.10.4.21',
  note:'Each line is one message. TIME_PREFIX skips the <PRI>VERSION header, so the timestamp after it is read.'},
 kubernetes:{name:'Kubernetes JSON',group:'samples',boundary:'newline',merge:false,timestamp:'epoch',indexExtraction:'json',searchExtraction:'none',sourcetype:'kube:container:sso-web',index:'k8s',routeField:'level',routeValue:'error',routeIndex:'k8s_errors',props:{TIMESTAMP_FIELDS:'ts'},
  raw:'{"ts":1789867200,"cluster":"prod-syd","namespace":"identity","pod":"sso-web-7d9f6c5b8-x2kqp","level":"error","user":"alex","src":"10.10.4.21","msg":"Login failed"}\n{"ts":1789867204,"cluster":"prod-syd","namespace":"identity","pod":"sso-web-7d9f6c5b8-x2kqp","level":"error","user":"alex","src":"10.10.4.21","msg":"Login failed"}\n{"ts":1789867275,"cluster":"prod-syd","namespace":"identity","pod":"sso-web-7d9f6c5b8-x2kqp","level":"info","user":"alex","src":"10.10.4.21","msg":"Login succeeded"}',
  note:'Epoch seconds in ts become _time. The JSON is indexed, so the route on level=error sends both errors to k8s_errors.'},
 jsonTwice:{name:'JSON extracted twice',group:'mistakes',raw:parsingLabPresets.json.raw,boundary:'newline',merge:false,timestamp:'iso',indexExtraction:'json',searchExtraction:'json',sourcetype:'vendor:api:json',props:{TIMESTAMP_FIELDS:'time'},
  note:'The NDJSON API sample with KV_MODE = json as well. Every field is extracted at index time and again at search time, so searches show each value twice. Set KV_MODE = none.'},
 oversized:{name:'Event over TRUNCATE',group:'mistakes',boundary:'newline',merge:false,timestamp:'iso',indexExtraction:'json',searchExtraction:'none',truncate:256,sourcetype:'mail:gateway:json',index:'email',routeField:'action',routeValue:'quarantine',routeIndex:'email_quarantine',props:{TIMESTAMP_FIELDS:'time'},
  raw:'{"time":"2026-09-20T01:20:00Z","host":"mail01","action":"deliver","user":"alex","subject":"Meeting notes","size":2048}\n{"time":"2026-09-20T01:20:04Z","host":"mail01","action":"quarantine","user":"alex","subject":"Password reset","attachment":"JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCl/s62b/yG842VJ4bG1pbHnC28I53U6RtGcp1zon+1fpa4ayc/80/OGda4BO/1o/V0etpOqiLx1JwB5S3beHW0vUc146Jl4W7uA/WXGLm10DAZwH2LbFH5DaOmZu7BOrNU4HQIVivtuLYM4Fwd7P460WtyIwln3gH2QLfkcptJ/OSyJ3d9TdH8Ycb4hPSGQdArTRIdP9Moywi1Ux/Kzav4rvLRJ943uUK6rQYUXlSwxhmh8iMnsuu8++x49VZK/jnef2wBF3bo23zTMLVBdP1299Aha2Ejh6X/z7gebwkZaDeQJpm+Qsio5G+7tFAXJlF+hrIsVqGJ92JabaSQgbJFE=","size":48213}',
  note:'TRUNCATE = 256 cuts the second event inside its attachment. What is left is not valid JSON, so nothing is indexed and the quarantine route misses it. Set TRUNCATE above the largest valid event.'},
 splitTrace:{name:'Stack trace split per line',group:'mistakes',raw:javaTrace,boundary:'newline',merge:false,timestamp:'iso',indexExtraction:'none',searchExtraction:'kv',sourcetype:'sso:app:log4j',index:'app',props:millis,
  note:'The Java stack trace broken at every line: each stack frame becomes its own event, with no timestamp and no fields. Break before the timestamp instead (Event boundary: Timestamp prefix).'},
 csvHeaders:{name:'CSV header per event',group:'samples',raw:vpnHealth,boundary:'header',timestamp:'iso',indexExtraction:'none',searchExtraction:'multi',sourcetype:'vpn:health:csv',index:'os',
  note:'A scripted input writes a header line before its rows on every run, so each event is a small table. LINE_BREAKER starts an event at each header line, TIME_PREFIX skips the header to read the first row\'s time, and KV_MODE = multi reads each row as a search result: 2 events, 4 rows.'},
 fixedLength:{name:'Fixed-length records',group:'samples',get raw(){return badgeLine()},boundary:'fixed',recordLength:128,timestamp:'iso',indexExtraction:'none',searchExtraction:'kv',sourcetype:'badge:controller',index:'physical',props:{MAX_TIMESTAMP_LOOKAHEAD:'20'},
  note:'A badge-controller export: a single line of 1,056,000 characters, just over 1 MB, with no line feeds or carriage returns. It holds 8,250 records of 128 characters. LINE_BREAKER = .{128}() ends an event after every 128 characters, and its empty group keeps every character. Each record starts with its 20-character timestamp.'},
 csvHeaderAsData:{name:'CSV header indexed as data',group:'mistakes',raw:vpnHealth,boundary:'newline',timestamp:'iso',indexExtraction:'csv',searchExtraction:'none',sourcetype:'vpn:health:csv',index:'os',props:{TIMESTAMP_FIELDS:'collected'},
  note:'The scripted input\'s output read as a CSV file, one event per row. The header line repeats, so the third event is the header indexed as data: each field holds its own name, and there is no timestamp. Break at the header line instead (Event boundary: CSV header line).'},
 oneLongLine:{name:'1 MB line, no breaker',group:'mistakes',get raw(){return badgeLine()},boundary:'newline',timestamp:'iso',indexExtraction:'none',searchExtraction:'kv',sourcetype:'badge:controller',index:'physical',
  note:'The 1 MB badge export with the default LINE_BREAKER. It has no line break, so the whole file is one event, and TRUNCATE keeps its first 10,000 characters: 78 of the 8,250 records and part of the 79th. splunkd.log reports the LineBreakingProcessor truncating the line. Break every 128 characters instead (Event boundary: Fixed length).'}
});

function choose(id){
 const sample=parsingLabPresets[id];if(!sample)return;
 const next={...SAMPLE_DEFAULTS};for(const key of SETTING_KEYS)if(key in sample)next[key]=sample[key];
 Object.assign(state.parsingLab,next,{preset:id});renderParsingLab();
}

// The walkthrough models JSON, CSV and Windows XML with its own samples; pick one from the settings, not the example's id.
function walkthroughFor(c){return c.boundary==='xml'||c.searchExtraction==='xml'?'windows':c.indexExtraction==='json'||c.searchExtraction==='json'?'json':c.indexExtraction==='csv'?'csv':'syslog'}

const recordLength=c=>Math.max(MIN_RECORD,Math.round(+c.recordLength)||128);
const reEscape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// The line a CSV header line boundary looks for: the input's first line that isn't blank, up to 256 characters.
function headerLine(raw){
 const text=String(raw||'').replaceAll('\r\n','\n'),start=text.search(/\S/);if(start<0)return '';
 const end=text.indexOf('\n',start);return text.slice(start,end<0?undefined:end).trim().slice(0,HEADER_MAX);
}
// Apply a LINE_BREAKER as Splunk does: an event ends where the capture group starts, the group's text is discarded,
// and what follows the last match is the last event. Both breakers here end with their group.
function breakEvents(raw,breaker){
 const events=[];let start=0,match;
 while((match=breaker.exec(raw))){
  if(!match[0].length){breaker.lastIndex++;continue}
  const end=match.index+match[0].length;events.push(raw.slice(start,end-match[1].length));start=end;
 }
 events.push(raw.slice(start));return events;
}
// Fixed length keeps every character of a record. CSV header line trims each line, as the other boundaries do.
function boundaryEvents(c,raw){
 if(c.boundary==='fixed')return breakEvents(raw,new RegExp(`.{${recordLength(c)}}()`,'g')).filter(e=>e.trim());
 const header=headerLine(raw);
 return (header?breakEvents(raw,new RegExp(`([\\r\\n]+)(?=${reEscape(header)})`,'g')):[raw])
  .map(e=>e.split('\n').map(line=>line.trim()).filter(Boolean).join('\n')).filter(Boolean);
}
// KV_MODE = multi: the first line names the columns, and each later line is a row. The lab splits on commas when the
// first line has them, otherwise on spaces.
function multikv(text){
 const [head,...lines]=String(text).split('\n').map(line=>line.trim()).filter(Boolean);if(!head||!lines.length)return [];
 const split=head.includes(',')?line=>line.split(',').map(x=>x.trim()):line=>line.split(/\s+/),names=split(head);
 return lines.map(line=>{const values=split(line);return Object.fromEntries(names.map((name,i)=>[name,values[i]??'']))});
}

// The base model breaks every line, by timestamp or by XML element. For the new boundaries it is given one event per
// line, with each line break inside an event carried as U+2028, and the exact events are put back after it.
const modelBefore=parsingLabModel;
function extendedModel(){
 const lab=state.parsingLab,boundary=lab.boundary,search=lab.searchExtraction,own=boundary==='fixed'||boundary==='header',multi=search==='multi';
 // The lab reads INDEXED_EXTRACTIONS = csv as a header and one row per line, so it doesn't apply these boundaries too.
 const rows=own&&lab.indexExtraction==='csv';
 let m,events=null;
 if(own||multi){
  const saved={raw:lab.raw,boundary,searchExtraction:search};
  if(own&&!rows)events=boundaryEvents(lab,String(lab.raw||'').replaceAll('\r\n','\n'));
  try{
   if(events)lab.raw=events.map(e=>e.replaceAll('\n',LINE)).join('\n');
   if(own)lab.boundary='newline';
   if(multi)lab.searchExtraction='none';
   m=modelBefore();
  }finally{Object.assign(lab,saved)}
  m.c={...m.c,raw:saved.raw,boundary,searchExtraction:search};
 }else m=modelBefore();
 const n=recordLength(m.c),limit=m.c.truncate,layer=name=>m.effective.find(x=>x.name===name);
 if(events)m.events.forEach((e,i)=>{
  const exact=events[i],text=exact.slice(0,limit);
  e.raw=text;e.originalLength=exact.length;e.truncated=exact.length>limit;
  e.warnings=e.warnings.filter(w=>!w.startsWith('TRUNCATE removed'));
  if(e.truncated)e.warnings.unshift(`TRUNCATE removed ${exact.length-limit} characters`);
  if(boundary==='fixed'&&exact.length!==n)e.warnings.push(`Record is ${exact.length} characters, not ${n}`);
 });
 if(multi){
  m.events.forEach(e=>{const table=multikv(e.raw);e.searchRows=table;e.searchFields=table[0]||{};e.fields={...e.indexFields,...e.searchFields};if(!table.length)e.warnings.push('No search-time fields extracted')});
  m.searchFieldNames=[...new Set(m.events.flatMap(e=>e.searchRows.flatMap(Object.keys)))];m.fieldNames=[...new Set([...m.indexFieldNames,...m.searchFieldNames])];
  layer('Search-time extraction').detail=`Search tier · KV_MODE=multi; fields=${m.searchFieldNames.length}; rows=${m.events.reduce((total,e)=>total+e.searchRows.length,0)}`;
 }
 // A row that repeats the CSV header is indexed as data.
 if(m.c.indexExtraction==='csv'&&m.csvHeader){const head=m.csvHeader.join(',');m.events.forEach(e=>{if(e.raw.split(',').map(x=>x.trim()).join(',')===head)e.warnings.push('CSV header row indexed as data: each field holds its own name')})}
 if(own){const mode=boundary==='fixed'?'fixed length':'CSV header line';
  layer('Event boundaries').detail=rows?`mode=${mode}, not applied: the lab reads INDEXED_EXTRACTIONS=csv one row per line; TRUNCATE=${limit}`:
   `mode=${mode}; ${boundary==='fixed'?`${n} characters per event`:'an event starts at each header line'}; TRUNCATE=${limit}`;}
 m.warningCount=m.events.reduce((total,e)=>total+e.warnings.length,0);
 return m;
}
// One render reads the model three times: the page, the tier panel and these examples. Work it out once, and give the
// page the first 25 events to draw; the counts read every event. The evidence pack and the architecture report read
// the model the same way, so a 1 MB input doesn't put 8,250 parsed events in them twice. Download results keeps them.
let pass=null;
parsingLabModel=function(){
 if(!pass)return extendedModel();
 if(!pass.full){pass.full=extendedModel();pass.preview=pass.full.events.length>PREVIEW?{...pass.full,events:pass.full.events.slice(0,PREVIEW)}:pass.full}
 return pass.preview;
};
const listed=read=>function(...args){const outer=pass;pass=outer||{};try{return read.apply(this,args)}finally{pass=outer}};
evidencePackFiles=listed(evidencePackFiles);architectureReportJson=listed(architectureReportJson);architectureReportMarkdown=listed(architectureReportMarkdown);
// A results file that lists only some events says how many.
const jsonBefore=parsingLabJson;
parsingLabJson=function(...args){
 const text=jsonBefore.apply(this,args);if(!pass?.full||pass.full.events.length<=PREVIEW)return text;
 const doc=JSON.parse(text);doc.summary.eventsListed=PREVIEW;return JSON.stringify(doc,null,2);
};

// The new boundaries and KV_MODE = multi in the settings, the record length beside Fixed length, and the merge toggle
// off where LINE_BREAKER alone ends each event.
function settings(root,c){
 const boundary=root.querySelector('[data-parse="boundary"]'),search=root.querySelector('[data-parse="searchExtraction"]');
 if(boundary){boundary.insertAdjacentHTML('beforeend','<option value="header">CSV header line</option><option value="fixed">Fixed length</option>');boundary.value=c.boundary}
 if(search){search.insertAdjacentHTML('beforeend','<option value="multi">KV_MODE = multi</option>');search.value=c.searchExtraction}
 if(boundary&&c.boundary==='fixed'){
  boundary.closest('.parseField').insertAdjacentHTML('afterend',`<div class="parseField" id="parseRecordLength201"><label for="parseRecordLengthInput201">Record length (characters)</label><input id="parseRecordLengthInput201" type="number" min="${MIN_RECORD}" step="1" value="${recordLength(c)}"></div>`);
  root.querySelector('#parseRecordLengthInput201').onchange=e=>{state.parsingLab.recordLength=Math.max(MIN_RECORD,Math.round(+e.target.value)||128);state.parsingLab.preset='custom';renderParsingLab()};
 }
 const merge=root.querySelector('[data-parse-check="merge"]');
 if(merge&&(c.boundary==='fixed'||c.boundary==='header')){merge.checked=false;merge.disabled=true;merge.setAttribute('aria-describedby','parseMergeHint201');merge.closest('label')?.insertAdjacentHTML('afterend','<span class="parseHint201" id="parseMergeHint201">Not used with this boundary: LINE_BREAKER alone ends each event.</span>')}
}

function decorate(full){
 const root=document.querySelector('#operationsContent'),bar=root?.querySelector('.parsePresetBar');if(!bar)return;
 const c=state.parsingLab,sample=parsingLabPresets[c.preset];
 bar.innerHTML=GROUPS.map(([group,label])=>`<div class="parsePresetGroup201" role="group" aria-label="${label}"><span class="parsePresetLabel201" aria-hidden="true">${label}</span>`+
  Object.entries(parsingLabPresets).filter(([,p])=>(p.group||'samples')===group).map(([id,p])=>`<button type="button" class="parsePreset ${c.preset===id?'active':''}" data-parse-preset="${id}" aria-pressed="${c.preset===id}">${esc(p.name)}</button>`).join('')+'</div>').join('');
 const props=Object.entries(sample?.props||{});
 bar.insertAdjacentHTML('afterend',sample?`<p class="parsePresetNote201"><b>${esc(sample.name)}.</b> ${esc(sample.note||'')}${props.length?` <span>Its configuration uses ${props.map(([k,v])=>`<code>${esc(k)} = ${esc(v)}</code>`).join(' and ')}.</span>`:''}</p>`:
  '<p class="parsePresetNote201"><b>Custom settings.</b> Choose an example to reset every setting to it.</p>');
 bar.querySelectorAll('[data-parse-preset]').forEach(b=>b.onclick=()=>choose(b.dataset.parsePreset));
 settings(root,full.c);
 const truncated=full.events.filter(e=>e.truncated).length,metrics=[...root.querySelectorAll('.parseMetric')];
 [full.eventCount,full.warningCount,full.routed,full.indexFieldNames.length,full.searchFieldNames.length,truncated].forEach((value,i)=>{const strong=metrics[i]?.querySelector('strong');if(strong)strong.textContent=value.toLocaleString()});
 metrics[5]?.style.setProperty('--parse',truncated?'var(--red)':'var(--green)');
 const list=root.querySelector('.parseEventList');
 if(list&&full.events.length>PREVIEW)list.insertAdjacentHTML('beforebegin',`<p class="parsePreviewNote201">Showing the first ${PREVIEW} of ${full.eventCount.toLocaleString()} events. The counts above include every event, and so does Download results.</p>`);
 if(full.c.searchExtraction==='multi')root.querySelectorAll('.parseEvent').forEach((card,i)=>{
  const table=full.events[i]?.searchRows,box=card.querySelector('.parseFields.search');if(!table?.length||!box)return;
  box.innerHTML=`<small>Search time · calculated · ${table.length} row${table.length===1?'':'s'}</small>`+table.map((row,j)=>`<div class="parseRow201"><span>Row ${j+1}</span><div class="parseFieldTags">${Object.entries(row).map(([k,v])=>`<b>${esc(k)}=${esc(v)}</b>`).join('')}</div></div>`).join('');
 });
 root.querySelectorAll('[data-parse-walk]').forEach(b=>b.onclick=()=>{const e=full.events[Number(b.dataset.parseWalk)];if(!e)return;
  state.walkthrough.raw=e.raw;state.walkthrough.preset=walkthroughFor(full.c);state.walkthrough.step=0;state.operationsView='walkthrough';renderOperations()});
}
const renderBefore=renderParsingLab;
renderParsingLab=function(...args){
 const outer=pass;pass={};
 try{const result=renderBefore.apply(this,args);decorate(pass.full||extendedModel());return result}
 finally{pass=outer}
};

// The generated props write the new boundaries and KV_MODE = multi, and carry the example's own lines while its
// settings are unchanged. Changing a setting makes the settings custom, and the generic lines return.
const configBefore=parsingLabConfiguration;
parsingLabConfiguration=function(...args){
 let text=configBefore.apply(this,args);const c=state.parsingLab;
 const write=(key,lines)=>{text=text.replace(new RegExp(`^${key} = .*$`,'m'),()=>lines.join('\n'))};
 if(c.boundary==='fixed'||c.boundary==='header'){
  if(c.indexExtraction==='csv')text=text.replace(/^LINE_BREAKER = /m,()=>`# The ${c.boundary==='fixed'?'Fixed length':'CSV header line'} boundary is not written: the lab reads INDEXED_EXTRACTIONS = csv one row per line.\nLINE_BREAKER = `);
  else if(c.boundary==='fixed'){const n=recordLength(c);write('SHOULD_LINEMERGE',['SHOULD_LINEMERGE = false']);
   write('LINE_BREAKER',[`# Fixed-length records: end an event after every ${n} characters. The empty group keeps every character.`,`LINE_BREAKER = .{${n}}()`,
    ...(n>100?['# Look back at least one record, so a record split between read chunks is counted from its start.',`LINE_BREAKER_LOOKBEHIND = ${n}`]:[]),
    '# On a universal forwarder that reads this file, break at the same points so each record reaches an indexer whole:','# EVENT_BREAKER_ENABLE = true',`# EVENT_BREAKER = .{${n}}()`]);}
  else{write('SHOULD_LINEMERGE',['SHOULD_LINEMERGE = false']);
   write('LINE_BREAKER',['# Start an event at each header line.',`LINE_BREAKER = ([\\r\\n]+)(?=${reEscape(headerLine(c.raw))})`]);
   if(c.timestamp!=='none')text=text.replace(/^TIME_FORMAT = /m,()=>'# The header line comes first: read the time from the first row.\nTIME_PREFIX = ^[^\\r\\n]*[\\r\\n]+\nTIME_FORMAT = ');}
 }
 if(c.searchExtraction==='multi')write('KV_MODE',['# KV_MODE = multi reads each event as a table: the first line names the columns, and each later line is a row.','# Check on a test instance that the columns split on the commas.','KV_MODE = multi']);
 const props=parsingLabPresets[c.preset]?.props;if(!props)return text;
 for(const [key,value] of Object.entries(props)){const line=new RegExp(`^${key} = .*$`,'m');
  text=line.test(text)?text.replace(line,()=>`${key} = ${value}`):text.replace(/^TIME_FORMAT = /m,()=>`${key} = ${value}\nTIME_FORMAT = `)}
 return text;
};
})();

(function(){
/* Build 200: more Parsing laboratory examples, in two groups: samples of common formats, and common mistakes. Each
   example sets every setting it depends on, says in one line what it shows, and adds the props lines its format needs
   (TIME_PREFIX, TIME_FORMAT, TIMESTAMP_FIELDS) to the generated configuration. */
if(typeof parsingLabPresets==='undefined'||typeof renderParsingLab!=='function')return;
const esc=evidenceXml;

// The settings an example owns. Choosing one starts from these defaults, so nothing carries over from the previous
// example. The processing tier is the person's choice for their topology, not the example's, and stays.
const SAMPLE_DEFAULTS={boundary:'newline',merge:false,timestamp:'iso',indexExtraction:'none',searchExtraction:'none',truncate:10000,timezone:'UTC',sourcetype:'custom',index:'security',routeField:'result',routeValue:'failure',routeIndex:'security_alerts'};
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
  note:'The Java stack trace broken at every line: each stack frame becomes its own event, with no timestamp and no fields. Break before the timestamp instead (Event boundary: Timestamp prefix).'}
});

function choose(id){
 const sample=parsingLabPresets[id];if(!sample)return;
 const next={...SAMPLE_DEFAULTS};for(const key of SETTING_KEYS)if(key in sample)next[key]=sample[key];
 Object.assign(state.parsingLab,next,{preset:id});renderParsingLab();
}

// The walkthrough models JSON, CSV and Windows XML with its own samples; pick one from the settings, not the example's id.
function walkthroughFor(c){return c.boundary==='xml'||c.searchExtraction==='xml'?'windows':c.indexExtraction==='json'||c.searchExtraction==='json'?'json':c.indexExtraction==='csv'?'csv':'syslog'}

function decorate(){
 const bar=document.querySelector('#operationsContent .parsePresetBar');if(!bar)return;
 const c=state.parsingLab,sample=parsingLabPresets[c.preset];
 bar.innerHTML=GROUPS.map(([group,label])=>`<div class="parsePresetGroup200" role="group" aria-label="${label}"><span class="parsePresetLabel200" aria-hidden="true">${label}</span>`+
  Object.entries(parsingLabPresets).filter(([,p])=>(p.group||'samples')===group).map(([id,p])=>`<button type="button" class="parsePreset ${c.preset===id?'active':''}" data-parse-preset="${id}" aria-pressed="${c.preset===id}">${esc(p.name)}</button>`).join('')+'</div>').join('');
 const props=Object.entries(sample?.props||{});
 bar.insertAdjacentHTML('afterend',sample?`<p class="parsePresetNote200"><b>${esc(sample.name)}.</b> ${esc(sample.note||'')}${props.length?` <span>Its configuration uses ${props.map(([k,v])=>`<code>${esc(k)} = ${esc(v)}</code>`).join(' and ')}.</span>`:''}</p>`:
  '<p class="parsePresetNote200"><b>Custom settings.</b> Choose an example to reset every setting to it.</p>');
 bar.querySelectorAll('[data-parse-preset]').forEach(b=>b.onclick=()=>choose(b.dataset.parsePreset));
 const m=parsingLabModel();
 document.querySelectorAll('#operationsContent [data-parse-walk]').forEach(b=>b.onclick=()=>{const e=m.events[Number(b.dataset.parseWalk)];if(!e)return;
  state.walkthrough.raw=e.raw;state.walkthrough.preset=walkthroughFor(m.c);state.walkthrough.step=0;state.operationsView='walkthrough';renderOperations()});
}
const renderBefore=renderParsingLab;renderParsingLab=function(...args){const result=renderBefore.apply(this,args);decorate();return result};

// The generated props carry the example's own lines while its settings are unchanged. Changing a setting makes the
// settings custom, and the generic lines return.
const configBefore=parsingLabConfiguration;
parsingLabConfiguration=function(...args){
 let text=configBefore.apply(this,args);const props=parsingLabPresets[state.parsingLab.preset]?.props;if(!props)return text;
 for(const [key,value] of Object.entries(props)){const line=new RegExp(`^${key} = .*$`,'m');
  text=line.test(text)?text.replace(line,()=>`${key} = ${value}`):text.replace(/^TIME_FORMAT = /m,()=>`${key} = ${value}\nTIME_FORMAT = `)}
 return text;
};
})();

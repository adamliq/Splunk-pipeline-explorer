(function(){
'use strict';
// Build 233: Fleet and Deployment Server tools. Operate › Multi-DS management gets a row of tools above its overview:
// the fleet's inventory (the sample, or one read from a Deployment Server's export), a cohort rollout simulator, the
// Deployment Server's capacity, a configuration dependency graph, an upgrade planner and a release approval record.
// Every figure that comes from Splunk names its page in SRC; every assumption of this model says so where it is shown.
const SRC={
 client:'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.2-configuration-file-reference/deploymentclient.conf',
 serverclass:'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.2-configuration-file-reference/serverclass.conf',
 perf:'https://help.splunk.com/splunk-enterprise/administer/update-your-deployment/10.2/manage-the-agent-management/estimate-agent-management-performance',
 plan:'https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/10.2/configure-the-agent-management-system/plan-a-deployment',
 cluster:'https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/9.4/configure-the-deployment-system/implement-a-deployment-server-cluster',
 pre92:'https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/10.0/configure-the-agent-management-system/upgrade-pre-9.2-deployment-servers',
 paths100:'https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise',
 paths102:'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise',
 paths104:'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise',
 paths106:'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.6/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise',
 distributed:'https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-a-distributed-splunk-enterprise-environment',
 compat:'https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/compatibility-matrix/splunk-products-version-compatibility/compatibility-between-forwarders-and-splunk-enterprise-indexers',
 precedence:'https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.2/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(n,d=0)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:0});
const plural=(n,one,many=one+'s')=>`${num(n)} ${n===1?one:many}`;
const link=(key,text)=>`<a href="${SRC[key]}" target="_blank" rel="noopener">${esc(text)}</a>`;
const content=()=>document.getElementById('operationsContent');
// The Config view's .conf reader (Build 205): stanzas, settings with their line numbers, continuation lines.
const parseConf=(text,kind,fid)=>{const read=window.configView205?.parseConf;if(!read)throw Error('The Config view\u2019s .conf reader isn\u2019t loaded');return read(text,kind,fid)};
// Byte order, as Splunk sorts app directories: digits, then upper case, then "_", then lower case.
const byteOrder=(a,b)=>a<b?-1:a>b?1:0;
const F=state.fleet233={view:'overview'};
const VIEWS=[['overview','Overview'],['inventory','Inventory'],['rollout','Rollout'],['capacity','Server capacity'],['dependencies','Dependencies'],['upgrades','Upgrades'],['approval','Release approval']];
const TOOLS={};// id → {render():html, wire(root)}
function nav(){return `<nav class="fleet233Nav" aria-label="Fleet and Deployment Server tools">${VIEWS.map(([id,label])=>`<button type="button" data-fleet233-view="${id}" aria-pressed="${F.view===id}">${label}</button>`).join('')}</nav>`}
function source(){const inv=inventory();return inv.source==='import'?`<p class="fleet233Source"><b>Inventory:</b> ${esc(inv.label)} · ${plural(inv.clients.length,'client')} · read ${esc(inv.readAt)}. <button type="button" class="fleet233Link" data-fleet233-go="inventory">See the inventory</button></p>`:''}
function show(view){F.view=view;renderOperations();const b=content()?.querySelector(`[data-fleet233-view="${view}"]`);b?.focus({preventScroll:true})}
function wireNav(root){root.querySelectorAll('[data-fleet233-view]').forEach(b=>b.onclick=()=>show(b.dataset.fleet233View));root.querySelectorAll('[data-fleet233-go]').forEach(b=>b.onclick=()=>show(b.dataset.fleet233Go))}
const renderOverview=renderMultiDeploymentOperations;
renderMultiDeploymentOperations=function(){
 const root=content();if(!root)return;
 if(F.view==='overview'||!TOOLS[F.view]){F.view='overview';renderOverview();root.insertAdjacentHTML('afterbegin',nav()+source())}
 else{root.innerHTML=nav()+source()+`<div class="fleet233" data-fleet233-tool="${F.view}">${TOOLS[F.view].render()}</div>`;TOOLS[F.view].wire?.(root.querySelector('.fleet233'))}
 wireNav(root)};
// Rendering again keeps the reader where they were: the field that had focus gets it back.
function rerender(){const a=document.activeElement,key=a?.dataset?.fleet233Key,sel=a&&'selectionStart' in a?[a.selectionStart,a.selectionEnd]:null;renderOperations();if(!key)return;const b=content()?.querySelector(`[data-fleet233-key="${CSS.escape(key)}"]`);if(!b)return;b.focus({preventScroll:true});if(sel&&b.setSelectionRange&&typeof b.value==='string'){try{b.setSelectionRange(...sel)}catch{}}}
// ---- The fleet's inventory: the sample, made whole, or one read from a Deployment Server's export ----
// The sample keeps every figure the overview showed (Regional DS A 620 agents, B 480; the five server classes and
// their client counts) and adds the class that holds the 160 agents the five didn't: syslog collectors.
const SAMPLE_SERVERS=[
 {id:'t1',name:'Tier 1 Deployment Server',host:'ds-t1.security.example',version:'9.4.2',tier:1},
 {id:'a',name:'Regional DS A',host:'ds-a.security.example',version:'9.4.2',tier:2},
 {id:'b',name:'Regional DS B',host:'ds-b.security.example',version:'9.3.2',tier:2}];
const SAMPLE_CLASSES=[
 {name:'sc_windows_security',region:'A + B',match:'OS=Windows · env=production',apps:['TA_windows_security','outputs_primary'],restart:'No',conf:{machineTypesFilter:'windows-x64','whitelist.0':'win-*'},appConf:{TA_windows_security:{'blacklist.0':'win-legacy-*'}}},
 {name:'sc_linux_audit',region:'A + B',match:'OS=Linux · role=server',apps:['TA_linux_auditd','outputs_primary'],restart:'No',conf:{machineTypesFilter:'linux-x86_64','whitelist.0':'linux-*'}},
 {name:'sc_api_collectors',region:'A',match:'role=api-collector',apps:['TA_api_collection','hec_delivery'],restart:'Controlled',conf:{'whitelist.0':'hf-api-*'},appConf:{TA_api_collection:{restartSplunkd:'true'}}},
 {name:'sc_network_collectors',region:'A + B',match:'role=syslog-collector',apps:['TA_network_syslog','outputs_primary'],restart:'No',conf:{'whitelist.0':'net-syslog-*'}},
 {name:'sc_canary',region:'A + B',match:'cohort=canary',apps:['release_candidate'],restart:'As declared',conf:{'whitelist.0':'*-canary-*'}},
 {name:'sc_regional_overrides',region:'B',match:'region=B',apps:['regional_network'],restart:'No',conf:{'whitelist.0':'net-syslog-b*','whitelist.1':'*-canary-b*','whitelist.2':'linux-edge-b*'}}];
// The apps' settings: what the dependency graph reads. Sizes are each app's bundle as a client downloads it.
const SAMPLE_APPS={
 TA_windows_security:{version:'8.9.0',sizeMB:4.8,files:{'default/inputs.conf':'[WinEventLog://Security]\ndisabled = 0\nindex = wineventlog\nrenderXml = true\n'}},
 TA_linux_auditd:{version:'3.2.1',sizeMB:1.2,files:{'default/inputs.conf':'[monitor:///var/log/audit/audit.log]\ndisabled = 0\nindex = linux_audit\nsourcetype = linux:audit\n'}},
 TA_api_collection:{version:'1.7.2',sizeMB:9.5,files:{'default/inputs.conf':'[script://./bin/poll_api.py]\ninterval = 300\nindex = api_audit\n'}},
 TA_network_syslog:{version:'2.0.4',sizeMB:0.6,files:{'default/inputs.conf':'[udp://514]\nindex = netfw\nsourcetype = syslog\nconnection_host = ip\n\n[tcp://1514]\nindex = netfw\nsourcetype = syslog\n'}},
 hec_delivery:{version:'1.0.3',sizeMB:0.1,files:{'default/outputs.conf':'[httpout]\nuri = https://hec.security.example:8088\n'}},
 outputs_primary:{version:'1.4.0',sizeMB:0.1,files:{'default/outputs.conf':'[tcpout]\ndefaultGroup = primary_indexers\n\n[tcpout:primary_indexers]\nserver = idx1.security.example:9997, idx2.security.example:9997\nuseACK = true\n'}},
 release_candidate:{version:'2026.09.20.3',sizeMB:12,files:{'default/inputs.conf':'[monitor:///var/log/audit/audit.log]\nindex = linux_audit_v2\n\n[WinEventLog://Security]\nrenderXml = false\n'}},
 regional_network:{version:'1.1.0',sizeMB:0.1,files:{'default/outputs.conf':'[tcpout]\ndefaultGroup = regional_b_indexers\n\n[tcpout:regional_b_indexers]\nserver = idx-b1.security.example:9997, idx-b2.security.example:9997\n'}}};
// Groups of agents with the same server classes on the same server: [server, name prefix, from, to, type, classes,
// [[Splunk version, how many], …]]. Twelve groups, 1,100 agents.
const SAMPLE_GROUPS=[
 ['a','win-prod-a',1,280,'Universal Forwarder',['sc_windows_security'],[['9.4.2',210],['9.2.4',70]]],
 ['a','win-canary-a',1,10,'Universal Forwarder',['sc_windows_security','sc_canary'],[['9.4.2',10]]],
 ['a','linux-prod-a',1,220,'Universal Forwarder',['sc_linux_audit'],[['9.4.2',150],['9.1.6',70]]],
 ['a','linux-canary-a',1,10,'Universal Forwarder',['sc_linux_audit','sc_canary'],[['9.4.2',10]]],
 ['a','net-syslog-a',1,60,'Universal Forwarder',['sc_network_collectors'],[['9.3.2',60]]],
 ['a','hf-api-a',1,40,'Heavy Forwarder',['sc_api_collectors'],[['9.4.2',40]]],
 ['b','win-prod-b',1,212,'Universal Forwarder',['sc_windows_security'],[['9.4.2',150],['9.2.4',62]]],
 ['b','win-canary-b',1,8,'Universal Forwarder',['sc_windows_security','sc_canary','sc_regional_overrides'],[['9.4.2',8]]],
 ['b','linux-prod-b',1,123,'Universal Forwarder',['sc_linux_audit'],[['9.4.2',70],['9.1.6',53]]],
 ['b','linux-edge-b',1,30,'Universal Forwarder',['sc_linux_audit','sc_regional_overrides'],[['9.4.2',30]]],
 ['b','linux-canary-b',1,7,'Universal Forwarder',['sc_linux_audit','sc_canary','sc_regional_overrides'],[['9.4.2',7]]],
 ['b','net-syslog-b',1,100,'Universal Forwarder',['sc_network_collectors','sc_regional_overrides'],[['9.3.2',100]]]];
// Agents that haven't phoned home for days: the last six Linux servers in A, the last nine Windows servers in B.
const SAMPLE_STALE={'linux-prod-a':[215,220,'a'],'win-prod-b':[204,212,'b']};
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
let sampleCache=null;
function sample(){
 if(sampleCache)return sampleCache;
 const clients=[];
 for(const [ds,prefix,from,to,type,classes,versions] of SAMPLE_GROUPS){
  const queue=versions.flatMap(([v,n])=>Array(n).fill(v));
  for(let i=from,k=0;i<=to;i++,k++){
   const name=`${prefix}${String(i).padStart(2,'0')}.security.example`,win=prefix.startsWith('win'),stale=SAMPLE_STALE[prefix],h=hash(name);
   const old=stale&&i>=stale[0]&&i<=stale[1]&&stale[2]===ds;
   clients.push({name,host:name.split('.')[0],ip:`10.${ds==='a'?20:40}.${(h>>8)&127}.${(h&250)+2}`,os:win?'windows':'linux',arch:win?'x64':'x86_64',
    version:queue[k],type,ds,classes:classes.slice(),apps:[...new Set(classes.flatMap(c=>SAMPLE_CLASSES.find(x=>x.name===c).apps))],
    phoneHome:60,age:old?86400*(1+h%8)+(h%3600):h%60})}}
 const apps=Object.entries(SAMPLE_APPS).map(([name,a])=>({name,version:a.version,sizeMB:a.sizeMB,files:a.files}));
 sampleCache={source:'sample',label:'the sample fleet',servers:SAMPLE_SERVERS.map(s=>({...s})),classes:SAMPLE_CLASSES.map(c=>({...c,apps:c.apps.slice()})),apps,clients,phoneHome:{a:60,b:60}};
 return sampleCache}
function inventory(){return F.imported||sample()}
const regionOf=ds=>ds==='a'?'Regional DS A':ds==='b'?'Regional DS B':ds;
const stale=c=>c.age>3*(c.phoneHome||60);
function ago(s){if(s==null||!isFinite(s))return'not known';if(s<90)return`${Math.round(s)} s ago`;if(s<5400)return`${Math.round(s/60)} min ago`;if(s<172800)return`${Math.round(s/3600)} h ago`;return`${Math.round(s/86400)} days ago`}
// Groups of agents that get the same apps from the same server: what the rollout, the dependency graph and the
// planner count.
function populations(inv=inventory()){const m=new Map();for(const c of inv.clients){const key=c.ds+'|'+c.classes.slice().sort().join('+');let p=m.get(key);if(!p){p={key,ds:c.ds,classes:c.classes.slice().sort(),apps:[...new Set(c.apps)].sort(byteOrder),clients:[]};m.set(key,p)}p.clients.push(c)}return [...m.values()]}
function classCount(inv,name){let n=0;for(const c of inv.clients)if(c.classes.includes(name))n++;return n}
function classRegion(inv,name){const s=new Set(inv.clients.filter(c=>c.classes.includes(name)).map(c=>c.ds));return [...s].sort().map(x=>x.toUpperCase()).join(' + ')||'—'}
// The overview's tables read the same inventory.
const fleetModelBase=deploymentFleetModel;
deploymentFleetModel=function(){const f=fleetModelBase(),inv=inventory();
 f.serverClasses=inv.classes.map(c=>({name:c.name,region:inv.source==='sample'?c.region:classRegion(inv,c.name),match:c.match,apps:c.apps.slice(),clients:classCount(inv,c.name),restart:c.restart}));
 if(inv.source==='import'){const pick=[...inv.clients].sort((x,y)=>(stale(y)-stale(x))||byteOrder(x.name,y.name)).slice(0,8);
  f.clients=pick.map(c=>({name:c.name,type:c.type,authority:regionOf(c.ds),classes:c.classes,apps:c.apps,phoneHome:ago(c.age),status:stale(c)?'Stale phone-home':'Up-to-date'}))}
 return f};
// ---- Import a real deployment inventory ----
// What a Deployment Server says about its clients, as `| rest /services/deployment/server/clients` exports it from
// Splunk Web (CSV or JSON), as the REST endpoint returns it, or as the search API's JSON; plus serverclass.conf for
// the server classes' filters and settings. Read here in the page. The column names are Splunk 10.6's, from a real
// Deployment Server: clientName, hostname, ip, utsname, splunkVersion, package, lastPhoneHomeTime,
// averagePhoneHomeInterval, splunk_server, serverClasses.<class>.<setting> and applications.<app>.<field>, where the
// fields include checksum, result, size, serverclasses and failedReason.
function parseCsv(text){const rows=[];let row=[],cell='',q=false,i=0;text=text.replace(/^﻿/,'');
 for(;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=ch;continue}
  if(ch==='"'&&cell==='')q=true;else if(ch===','){row.push(cell);cell=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.length>1||row[0]!=='')rows.push(row);row=[]}else cell+=ch}
 if(cell!==''||row.length){row.push(cell);rows.push(row)}if(q)throw Error('a quoted value never ends');if(!rows.length)return [];
 const head=rows[0].map(h=>h.trim());return rows.slice(1).map(r=>Object.fromEntries(head.map((h,k)=>[h,r[k]??''])))}
// Flatten {a:{b:1}} to {'a.b':1}, as | rest does with the REST endpoint's nested content.
function flat(o,pre='',out={}){for(const [k,v] of Object.entries(o||{})){const key=pre?pre+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flat(v,key,out);else out[key]=Array.isArray(v)?v.join('\n'):v}return out}
function rowsFromJson(text){const t=text.trim();let doc;
 try{doc=JSON.parse(t)}catch{// JSON lines, as /services/search/jobs/export writes: {"preview":false,"offset":0,"result":{…}} on each line
  const rows=[];for(const line of t.split(/\r?\n/)){if(!line.trim())continue;const o=JSON.parse(line);if(o.result)rows.push(flat(o.result));else if(!('preview' in o))rows.push(flat(o))}return rows}
 if(Array.isArray(doc))return doc.map(x=>flat(x.result||x.content||x));
 if(Array.isArray(doc.entry))return doc.entry.map(e=>flat({...e.content,name:e.content?.name??e.name}));
 if(Array.isArray(doc.results))return doc.results.map(x=>flat(x));
 if(Array.isArray(doc.fields)&&Array.isArray(doc.rows)){const names=doc.fields.map(f=>typeof f==='string'?f:f.name);return doc.rows.map(r=>Object.fromEntries(names.map((n,i)=>[n,Array.isArray(r[i])?r[i].join('\n'):r[i]??''])))}
 if(doc.result)return [flat(doc.result)];
 throw Error('no rows: not a search export, a REST response or a list')}
const FIELD_ALIASES={name:['clientName','name','hostname'],host:['hostname','host','dns'],ip:['ip','ipAddress'],utsname:['utsname'],version:['splunkVersion','version'],last:['lastPhoneHomeTime','lastPhoneHome'],interval:['averagePhoneHomeInterval','phoneHomeInterval'],server:['splunk_server','deploymentServer'],pkg:['package']};
const pick=(r,k)=>{for(const a of FIELD_ALIASES[k]){if(r[a]!=null&&String(r[a]).trim()!=='')return String(r[a]).trim()}return ''};
const filled=v=>v!=null&&String(v).trim()!=='';
// Ages are counted from the export's own time (its dataTimestamp, else its latest phone home), so an export read later
// doesn't make every agent look stale.
function exportTime(rows){let t=0;for(const r of rows){for(const k of ['dataTimestamp','lastPhoneHomeTime']){const v=Number(r[k]);if(isFinite(v)&&v>t)t=v}}return t||null}
function clientsFromRows(rows,now=exportTime(rows)||Date.now()/1000){const used=new Set(),warn=[],out=[],names=new Set();
 for(const r of rows){const name=pick(r,'name');if(!name){warn.push('A row has no clientName or hostname: left out.');continue}if(names.has(name.toLowerCase()))warn.push(`${name} appears more than once: two agents share a clientName.`);names.add(name.toLowerCase());
  for(const k of Object.keys(FIELD_ALIASES))for(const a of FIELD_ALIASES[k])if(r[a]!=null)used.add(a);
  const classes=new Set(),state={},cstate={};for(const [k,v] of Object.entries(r)){if(!filled(v))continue;let m=/^serverClasses\.([^.]+)\.(\w+)$/.exec(k);if(m){classes.add(m[1]);(cstate[m[1]]=cstate[m[1]]||{})[m[2]]=String(v);continue}
   m=/^applications\.([^.]+)\.(\w+)$/.exec(k);if(m){(state[m[1]]=state[m[1]]||{})[m[2]]=String(v)}}
  const uts=pick(r,'utsname').toLowerCase(),last=Number(pick(r,'last')),interval=Number(pick(r,'interval')),pkg=pick(r,'pkg').toLowerCase();
  out.push({name,host:pick(r,'host')||name,ip:pick(r,'ip'),os:uts.split('-')[0]||'',arch:uts.split('-').slice(1).join('-'),utsname:uts,version:(pick(r,'version').match(/^\d+\.\d+(\.\d+)*/)||[''])[0],
   type:pkg==='universal_forwarder'||/universal/.test(pkg)?'Universal Forwarder':pkg?'Splunk Enterprise':'Universal Forwarder',package:pkg,server:pick(r,'server'),classes:[...classes].sort(byteOrder),apps:Object.keys(state).sort(byteOrder),appState:state,classState:cstate,
   phoneHome:isFinite(interval)&&interval>0?interval:null,age:isFinite(last)&&last>0?Math.max(0,now-last):null})}
 const cols=[...new Set(rows.flatMap(r=>Object.keys(r)))];if(cols.some(k=>/^serverClasses\./.test(k)))used.add('serverClasses.*');if(cols.some(k=>/^applications\./.test(k)))used.add('applications.*');
 // An agent that has just restarted reports 0 for its average: such agents take the fleet's median.
 const known=out.map(c=>c.phoneHome).filter(Boolean).sort((a,b)=>a-b),median=known.length?known[Math.floor(known.length/2)]:60;for(const c of out)if(!c.phoneHome)c.phoneHome=median;
 const ignored=cols.filter(k=>!used.has(k)&&!/^(serverClasses|applications)\./.test(k));
 return {clients:out,warn,used:[...used],ignored}}
// serverclass.conf: each [serverClass:name] and the apps of its [serverClass:name:app:app] stanzas, with their settings.
function classesFromConf(text){const doc=parseConf(text,'serverclass','serverclass.conf'),classes=new Map();
 const get=n=>{if(!classes.has(n))classes.set(n,{name:n,apps:[],conf:{},appConf:{},restart:'No',match:''});return classes.get(n)};
 for(const st of doc.stanzas){let m=/^serverClass:([^:]+)$/.exec(st.name);if(m){get(m[1]);continue}m=/^serverClass:([^:]+):app:(.+)$/.exec(st.name);if(m){const c=get(m[1]);if(!c.apps.includes(m[2]))c.apps.push(m[2])}}
 for(const s of doc.settings){let m=/^serverClass:([^:]+)$/.exec(s.stanza.name);if(m){get(m[1]).conf[s.key]=s.value;continue}m=/^serverClass:([^:]+):app:(.+)$/.exec(s.stanza.name);if(m){const c=get(m[1]);(c.appConf[m[2]]=c.appConf[m[2]]||{})[s.key]=s.value}}
 for(const c of classes.values()){const w=Object.entries(c.conf).filter(([k])=>/^whitelist\.\d+$/i.test(k)).map(([,v])=>v),file=c.conf['whitelist.from_pathname'];
  c.match=w.length?'whitelist: '+w.slice(0,3).join(', ')+(w.length>3?'…':''):file?`from ${file}`:Object.keys(c.conf).length?'filters in serverclass.conf':'—';
  const rs=String(c.conf.restartSplunkd||'').toLowerCase()==='true'||Object.values(c.appConf).some(a=>String(a.restartSplunkd||'').toLowerCase()==='true');c.restart=rs?'Yes':'No'}
 return [...classes.values()]}
const IMP=F.importing={preview:null,error:'',regionMap:{}};
async function readInventoryFiles(list){const res={rows:[],conf:'',names:[],errors:[]};
 for(const f of list){try{if(f.size>50*1024*1024)throw Error('it is over 50 MiB');const text=await f.text(),t=text.replace(/^﻿/,'').trimStart();
   if(/\.conf$/i.test(f.name)||!/^[\[{]/.test(t)&&/^\s*\[(global|serverClass:[^\]]+)\]\s*$/m.test(text)){res.conf+=(res.conf?'\n':'')+text;res.names.push(f.name+' (serverclass.conf)');continue}
   const rows=/^[\[{]/.test(t)?rowsFromJson(t):parseCsv(t);if(!rows.length)throw Error('no rows');res.rows.push(...rows);res.names.push(f.name)}
  catch(e){res.errors.push(`${f.name}: ${e.message}`)}}
 return res}
const mode=list=>{const m=new Map();for(const x of list)if(x)m.set(x,(m.get(x)||0)+1);return [...m.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||''};
function buildImported(res,regionMap){const asOf=exportTime(res.rows),{clients,warn,used,ignored}=clientsFromRows(res.rows,asOf||Date.now()/1000),confClasses=res.conf?classesFromConf(res.conf):[];
 const servers=[...new Set(clients.map(c=>c.server||'(one server)'))].sort(byteOrder),map={};servers.forEach((s,i)=>map[s]=regionMap?.[s]||(i===1?'b':'a'));
 for(const c of clients){c.ds=map[c.server||'(one server)'];if(!c.apps.length&&confClasses.length)c.apps=[...new Set(c.classes.flatMap(n=>confClasses.find(x=>x.name===n)?.apps||[]))].sort(byteOrder)}
 // A class's apps: serverclass.conf's, else the apps whose "serverclasses" name it.
 const classNames=[...new Set([...confClasses.map(c=>c.name),...clients.flatMap(c=>c.classes)])];
 const classes=classNames.map(n=>{const c=confClasses.find(x=>x.name===n);if(c)return c;const apps=[...new Set(clients.flatMap(x=>Object.entries(x.appState||{}).filter(([,s])=>String(s.serverclasses||'').split(/[\n,]/).map(v=>v.trim()).includes(n)).map(([a])=>a)))].sort(byteOrder);return {name:n,apps,conf:{},appConf:{},restart:clients.some(x=>/^(1|true)$/i.test(x.classState?.[n]?.restartSplunkd||''))?'Yes':'No',match:'from the export'}});
 const appNames=[...new Set([...classes.flatMap(c=>c.apps),...clients.flatMap(c=>c.apps)])].sort(byteOrder);
 const apps=appNames.map(n=>{const known=DEP.apps.get(n),seen=clients.map(c=>c.appState?.[n]).filter(Boolean),bytes=Math.max(0,...seen.map(s=>Number(s.size)||0));
  return {name:n,version:known?.version||'',sizeMB:bytes?+(bytes/1048576).toFixed(3):known?.sizeMB||1,sizeKnown:!!bytes||!!known,checksum:mode(seen.map(s=>s.checksum)),failed:seen.filter(s=>s.result&&!/^ok$/i.test(s.result)).length,files:known?.files||{}}});
 const regions=[...new Set(Object.values(map))].sort();
 // The export names each Deployment Server (splunk_server) but not its version: the planner asks for it.
 const srv=regions.map(r=>({id:r,name:regionOf(r),host:servers.filter(s=>map[s]===r).join(', '),version:'',tier:2}));
 const versions=new Set(clients.map(c=>c.version).filter(Boolean));
 if(!clients.some(c=>c.age!=null))warn.push('No lastPhoneHomeTime: phone-home ages are unknown.');if(!versions.size)warn.push('No splunkVersion column: the upgrade planner can’t place the agents.');
 if(!res.conf)warn.push('No serverclass.conf: each server class’s apps come from the agents’ own lists, and its filters aren’t known.');
 if(apps.some(a=>!a.sizeKnown))warn.push('Some app sizes aren’t in the export: those count as 1 MB until you add the app packages on the Dependencies page.');
 const failed=apps.reduce((s,a)=>s+a.failed,0);if(failed)warn.push(`${plural(failed,'app install')} report a result other than Ok.`);
 return {inv:{source:'import',label:res.names.join(', '),readAt:new Date().toISOString().replace(/\.\d+Z$/,'Z'),asOf:asOf?new Date(asOf*1000).toISOString().replace(/\.\d+Z$/,'Z'):'',servers:srv,classes,apps,clients:clients.map(c=>({...c,age:c.age??0})),serverclassConf:res.conf||'',phoneHome:{}},servers,map,warn,used,ignored,classesFromConf:confClasses.length}}
const EXPORT_SEARCH='| rest /services/deployment/server/clients splunk_server=local count=0';
const INV=F.inventoryView={filter:'',all:false};
TOOLS.inventory={render(){
 const inv=inventory(),pv=IMP.preview,byDs=[...new Set(inv.clients.map(c=>c.ds))].sort(),versions=new Map();for(const c of inv.clients)versions.set(c.version||'not known',(versions.get(c.version||'not known')||0)+1);
 const away=inv.clients.filter(stale).length,q=INV.filter.trim().toLowerCase(),list=inv.clients.filter(c=>!q||[c.name,c.ip,c.version,...c.classes].some(x=>String(x).toLowerCase().includes(q))).sort((x,y)=>(stale(y)-stale(x))||(stale(x)?y.age-x.age:0)||byteOrder(x.name,y.name));
 const shown=INV.all?list:list.slice(0,25);
 const tiles=[tile('Agents',num(inv.clients.length),`${num(away)} not phoning home`),tile('Deployment Servers',num(byDs.length),byDs.map(regionOf).join(', ')),tile('Server classes',num(inv.classes.length),`${num(inv.apps.length)} deployment apps`),tile('Splunk versions',num(versions.size),[...versions.keys()].sort(cmpVersion).join(', '))];
 const preview=pv?`<section class="fleet233Preview" aria-label="What was read"><h3>Read from ${esc(pv.res.names.join(', '))}</h3>
  <p>${plural(pv.built.inv.clients.length,'agent')}, ${plural(pv.built.inv.classes.length,'server class','server classes')}${pv.built.classesFromConf?` (${num(pv.built.classesFromConf)} from serverclass.conf)`:''}, ${plural(pv.built.inv.apps.length,'app')}, ${plural(pv.built.servers.length,'Deployment Server')}.</p>
  ${pv.built.used.length?`<p><b>Columns used:</b> ${pv.built.used.map(esc).join(', ')}.</p>`:''}${pv.built.ignored.length?`<p><b>Not used:</b> ${pv.built.ignored.slice(0,12).map(esc).join(', ')}${pv.built.ignored.length>12?` and ${num(pv.built.ignored.length-12)} more`:''}.</p>`:''}
  ${[...pv.res.errors,...pv.built.warn].map(w=>`<p class="fleet233Warn">${esc(w)}</p>`).join('')}
  ${pv.built.servers.length>1||pv.built.servers[0]!=='(one server)'?`<div class="fleet233Fields">${pv.built.servers.map(s=>field(`${esc(s)} is`,`imp.map.${s}`,selectInput(pv.built.map[s],[['a','Regional DS A'],['b','Regional DS B']]))).join('')}</div>`:''}
  <div class="fleet233Decision"><button type="button" class="builderBtn primary" data-fleet233-imp="use"${pv.built.inv.clients.length?'':' disabled'}>Use this inventory</button><button type="button" class="builderBtn" data-fleet233-imp="discard">Discard</button></div></section>`:'';
 return hero('Fleet inventory','What the fleet tools work on',`${inv.source==='sample'?'The sample fleet: 1,100 agents on two regional Deployment Servers.':`Your inventory, read from ${esc(inv.label)}.`} Read your own from a Deployment Server’s export; it’s read here in the page and kept in this tab only.`,
  `${inv.source==='import'?'<button type="button" class="builderBtn" data-fleet233-imp="sample">Back to the sample</button>':''}<button type="button" class="builderBtn primary" data-fleet233-imp="download">Inventory (JSON)</button>`)+
 `<div class="fleet233Import"><div><strong>Read your Deployment Server’s inventory</strong><p>Run this search on each Deployment Server (Splunk 10: agent management) and export the results as CSV or JSON; add its serverclass.conf for the server classes’ apps and settings. The REST endpoint’s own JSON reads too.</p><pre class="fleet233Code"><code>${esc(EXPORT_SEARCH)}</code></pre></div>
  <div class="fleet233ImportActions"><label class="builderBtn fleet233File">Choose files<input type="file" multiple accept=".csv,.json,.txt,.conf" data-fleet233-imp-files></label><button type="button" class="builderBtn" data-fleet233-imp="copy">Copy the search</button></div>
  ${IMP.error?`<p class="fleet233Warn" role="alert">${esc(IMP.error)}</p>`:''}</div>`+preview+
 `<div class="fleet233Tiles">${tiles.join('')}</div>`+
 `<div class="sectionLabel">Deployment Servers</div>`+table(['Server','Agents','Phone home (average)','Not phoning home'],byDs.map(ds=>{const mine=inv.clients.filter(c=>c.ds===ds);return [esc(regionOf(ds)),num(mine.length),`${num(mine.reduce((s,c)=>s+(c.phoneHome||60),0)/Math.max(1,mine.length),1)} s`,num(mine.filter(stale).length)]}),'Agents on each Deployment Server')+
 `<div class="sectionLabel">Server classes</div>`+table(['Server class','Deployment apps','Agents','Where','Restart'],inv.classes.map(c=>[esc(c.name),esc(c.apps.join(', ')||'—'),num(classCount(inv,c.name)),esc(inv.source==='sample'?c.region:classRegion(inv,c.name)),esc(c.restart||'—')]),'Server classes')+
 `<div class="sectionLabel">Deployment apps</div>`+table(['App','Version','Bundle','Server classes','Agents'],inv.apps.map(a=>[esc(a.name),esc(a.version||'—'),a.sizeKnown===false?'not known':`${num(a.sizeMB,1)} MB`,esc(inv.classes.filter(c=>c.apps.includes(a.name)).map(c=>c.name).join(', ')||'—'),num(inv.clients.filter(c=>c.apps.includes(a.name)).length)]),'Deployment apps')+
 `<div class="sectionLabel">Agents: those not phoning home first${inv.asOf?`, with ages as of the export (${esc(inv.asOf)})`:''}</div><div class="fleet233Fields">${field('Find agents','inv.filter',`<input type="search" value="${esc(INV.filter)}" placeholder="name, IP, version or server class">`)}</div>`+
 table(['clientName','IP','OS','Splunk','Server','Server classes','Last phone home'],shown.map(c=>[esc(c.name),esc(c.ip||'—'),esc(c.utsname||[c.os,c.arch].filter(Boolean).join('-')||'—'),esc(c.version||'—'),esc(regionOf(c.ds)),esc(c.classes.join(', ')||'none'),stale(c)?`<b class="fleet233Warn">${ago(c.age)}</b>`:ago(c.age)]),'Agents')+
 (list.length>shown.length?`<p class="fleet233Note">${num(shown.length)} of ${num(list.length)} shown. <button type="button" class="fleet233Link" data-fleet233-imp="all">Show all ${num(list.length)}</button></p>`:'')},
 wire(root){
  const f=root.querySelector('[data-fleet233-key="inv.filter"]');if(f)f.onchange=()=>{INV.filter=f.value;rerender()};
  const files=root.querySelector('[data-fleet233-imp-files]');if(files)files.onchange=async()=>{const list=[...files.files];if(!list.length)return;IMP.error='';const res=await readInventoryFiles(list);
   if(!res.rows.length&&!res.conf){IMP.error=res.errors.join('; ')||'Nothing in these files reads as a client list or serverclass.conf.';IMP.preview=null;rerender();return}
   IMP.preview={res,built:buildImported(res,IMP.regionMap)};rerender();content()?.querySelector('.fleet233Preview')?.scrollIntoView({block:'nearest'})};
  root.querySelectorAll('[data-fleet233-key^="imp.map."]').forEach(x=>x.onchange=()=>{IMP.regionMap[x.dataset.fleet233Key.slice(8)]=x.value;IMP.preview.built=buildImported(IMP.preview.res,IMP.regionMap);rerender()});
  root.querySelectorAll('[data-fleet233-imp]').forEach(b=>b.onclick=async()=>{const a=b.dataset.fleet233Imp;
   if(a==='use'){applyInventory(IMP.preview.built.inv);IMP.preview=null}else if(a==='discard')IMP.preview=null;else if(a==='sample')applyInventory(null);else if(a==='all')INV.all=true;
   else if(a==='copy'){try{await navigator.clipboard.writeText(EXPORT_SEARCH);b.textContent='Copied'}catch{b.textContent='Select the search above to copy it'}return}
   else if(a==='download'){downloadText('fleet-inventory.json',JSON.stringify(inventoryJson(),null,2),'application/json');return}rerender()})}};
// Using an inventory: the overview's regional agent counts follow it, and come back when the sample does.
function applyInventory(inv){const md=state.multiDeployment;UP.ds=inv?{}:{t1:'9.4.2',a:'9.4.2',b:'9.3.2'};
 // The rollout's choices for the sample are kept while another inventory is in use, and come back with the sample.
 if(inv&&!F.savedRollout)F.savedRollout={app:RO.app,classes:RO.classes.slice(),canaryClass:RO.canaryClass};if(!inv&&F.savedRollout){Object.assign(RO,F.savedRollout);F.savedRollout=null}
 if(inv){if(!F.savedAgents)F.savedAgents={a:md.aAgents,b:md.bAgents};md.aAgents=inv.clients.filter(c=>c.ds==='a').length;md.bAgents=inv.clients.filter(c=>c.ds==='b').length;F.imported=inv}
 else{if(F.savedAgents){md.aAgents=F.savedAgents.a;md.bAgents=F.savedAgents.b;F.savedAgents=null}F.imported=null}
 for(const k of Object.keys(RO.phoneHome))delete RO.phoneHome[k];const names=new Set(inventory().classes.map(c=>c.name));if(!names.has(RO.canaryClass))RO.canaryClass=[...names].find(n=>/canary/i.test(n))||'';RO.classes=RO.classes.filter(c=>names.has(c)&&c!==RO.canaryClass);if(!RO.classes.length)RO.classes=[...names].filter(n=>n!==RO.canaryClass).slice(0,2);
 if(!inventory().apps.some(a=>a.name===RO.app))RO.app=inventory().apps[0]?.name||'';DEP.selected=null}
function inventoryJson(inv=inventory()){return {schema:'splunk-pipeline-explorer/fleet-inventory',version:1,generatedAt:new Date().toISOString(),source:inv.source,label:inv.label,
 servers:inv.servers.map(s=>({name:s.name,host:s.host,tier:s.tier,version:s.version,agents:s.tier===2?inv.clients.filter(c=>c.ds===s.id).length:undefined})),
 serverClasses:inv.classes.map(c=>({name:c.name,apps:c.apps,agents:classCount(inv,c.name),match:c.match})),apps:inv.apps.map(a=>({name:a.name,version:a.version,sizeMB:a.sizeMB})),
 agents:inv.clients.map(c=>({clientName:c.name,ip:c.ip,utsname:c.utsname||[c.os,c.arch].filter(Boolean).join('-'),splunkVersion:c.version,type:c.type,server:regionOf(c.ds),serverClasses:c.classes,apps:c.apps,phoneHomeIntervalSeconds:c.phoneHome,lastPhoneHomeSecondsAgo:Math.round(c.age)}))}}
// ---- Deployment Server capacity ----
// Splunk's sizing page measured how long a Deployment Server takes to send 50 MB of apps to C agents with a 60-second
// phone home: T = 0.0075·C + 2 minutes on a 12-core Linux host, T = 0.04·C + 8 on an 8-core Windows virtual machine
// (valid to 3,000 agents). For another bundle size this model scales the per-agent part by size/50, and adds the
// wait of a longer phone home; both are this model's assumptions, and said so where they're shown.
const FORMULA={linux:{a:0.0075,b:2,label:'Linux, 12 cores',limit:Infinity},windows:{a:0.04,b:8,label:'Windows, 8 cores',limit:3000}};
function pushMinutes(clients,{os='linux',sizeMB=50,phoneHome=60,maxDownloads=0}={}){
 if(clients<=0)return 0;const f=FORMULA[os]||FORMULA.linux;
 let t=f.a*clients*(sizeMB/50)+f.b+Math.max(0,phoneHome-60)/60;
 // With maxConcurrentDownloads set, at most that many agents download in each phone-home round; the rest retry at
 // their next phone home.
 if(maxDownloads>0)t=Math.max(t,Math.ceil(clients/maxDownloads)*phoneHome/60);
 return t}
// A phone-home record in _dsphonehome, Splunk 10.6.1.1: 328 to 330 bytes (measured; it grows with the agent's names).
// SplunkDeploymentServerConfig keeps _dsphonehome 7 days (frozenTimePeriodInSecs = 604800), _dsclient and _dsappevent 60.
const DS_EVENT_BYTES=330,DS_KEEP_DAYS=7;
const CAP=F.capacity={os:'linux',cores:12,servers:1,phoneHome:60,sizeMB:null,nicGbps:1,maxDownloads:0,scope:'each'};
function capacityModel(){
 const inv=inventory(),rel=inv.apps.find(a=>a.name==='release_candidate')||inv.apps[0];
 const sizeMB=CAP.sizeMB??(rel?.sizeMB||50),P=Math.max(1,CAP.phoneHome),servers=Math.min(3,Math.max(1,CAP.servers));
 const per=[...new Set(inv.clients.map(c=>c.ds))].sort().map(ds=>({ds,name:regionOf(ds),clients:inv.clients.filter(c=>c.ds===ds).length}));
 const rows=per.map(r=>{const each=r.clients/servers;return {...r,perServer:each,phoneHomesPerSec:r.clients/P,perDay:r.clients*86400/P,retryPerSec:r.clients/(P/5),resyncPerSec:r.clients/(10*P),
  pushMin:pushMinutes(Math.ceil(each),{os:CAP.os,sizeMB,phoneHome:P,maxDownloads:CAP.maxDownloads}),splunkMin:FORMULA[CAP.os].a*Math.ceil(each)+FORMULA[CAP.os].b,
  bundleGB:r.clients*sizeMB/1000,wireSec:r.clients*sizeMB*8/(CAP.nicGbps*1000)}});
 const total=rows.reduce((s,r)=>s+r.clients,0),biggest=rows.reduce((m,r)=>r.perServer>m.perServer?r:m,rows[0]||{perServer:0,clients:0});
 const findings=[];const add=(severity,title,text,src)=>findings.push({severity,title,text,src});
 if(biggest.clients>50)add('controlled','A dedicated host for each Deployment Server',`${biggest.name} serves ${num(biggest.clients)} agents. Above 50, Splunk says it must run on its own Splunk Enterprise instance, not an indexer or search head, and never beside an indexer cluster manager.`,'plan');
 if(biggest.clients>2000&&P<300)add('warning','Phone home every five minutes',`${num(biggest.clients)} agents on one server phone home every ${num(P)} s. Splunk's sizing page suggests 300 s above 2,000 agents.`,'perf');
 if(biggest.perServer>10000)add('warning','More HTTP I/O threads',`${num(Math.round(biggest.perServer))} agents per server: Splunk's best practice above 10,000 is [httpServer] dedicatedIoThreads = ${Math.max(1,Math.floor(CAP.cores/2))} (cores ÷ 2), or ${Math.max(1,CAP.cores-1)} on a very busy server.`,'perf');
 if(biggest.perServer>25000)add('critical','Over 25,000 agents per server',biggest.clients>75000?`${num(biggest.clients)} agents are more than a cluster of three can hold (75,000): split them between separate authorities, such as regional tiers.`:`A Deployment Server cluster takes up to three servers on Splunk 9.2 or later, 25,000 agents each, sharing deployment-apps and client_events on a network drive (syncMode = sharedDir) behind a load balancer with sticky sessions. ${biggest.name} needs ${Math.ceil(biggest.clients/25000)}.`,'cluster');
 if(CAP.os==='windows'&&biggest.perServer>3000)add('warning','Past Splunk’s Windows figure',`Splunk's Windows formula holds to 3,000 agents; ${num(Math.round(biggest.perServer))} per server is beyond it, so its time is an extrapolation.`,'perf');
 if(CAP.maxDownloads>0)add('controlled','Downloads held to '+num(CAP.maxDownloads)+' at a time',`maxConcurrentDownloads = ${CAP.maxDownloads}: agents over the limit are turned away and try again at their next phone home, so a release takes at least ${num(Math.ceil(biggest.perServer/CAP.maxDownloads))} phone-home rounds on ${biggest.name}.`,'serverclass');
 if(servers>1&&inv.servers.some(s=>s.tier===2&&s.version&&cmpVersion(s.version,'9.2')<0))add('critical','A cluster needs Splunk 9.2 or later','Every server in a Deployment Server cluster runs Splunk Enterprise 9.2 or higher.','cluster');
 if(!findings.some(f=>f.severity!=='controlled'))add('controlled','Within Splunk’s guidance',`${num(total)} agents on ${plural(rows.length,'server')}; the busiest has ${num(Math.round(biggest.perServer))} per server, under Splunk's 2,000 and 25,000 marks.`,'perf');
 return {sizeMB,P,servers,rows,total,biggest,findings,os:CAP.os,eventBytes:DS_EVENT_BYTES}}
function cmpVersion(a,b){const x=String(a).split('.').map(n=>parseInt(n,10)||0),y=String(b).split('.').map(n=>parseInt(n,10)||0);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d<0?-1:1}return 0}
// ---- shared pieces of the tools' pages ----
function hero(kicker,title,text,actions=''){return `<div class="opsHero"><div><small>${kicker}</small><h2>${title}</h2><p>${text}</p></div>${actions?`<div class="opsControls">${actions}</div>`:''}</div>`}
function field(label,key,input,note=''){const id='fleet233-'+key.replace(/[^\w-]/g,'-');return `<div class="fleet233Field"><label for="${id}">${label}</label>${input.replace('<input','<input id="'+id+'" data-fleet233-key="'+esc(key)+'"').replace('<select','<select id="'+id+'" data-fleet233-key="'+esc(key)+'"')}${note?`<small>${note}</small>`:''}</div>`}
const numberInput=(value,min=0,max='',step=1)=>`<input type="number" inputmode="decimal" min="${min}"${max!==''?` max="${max}"`:''} step="${step}" value="${esc(value)}">`;
const selectInput=(value,options)=>`<select>${options.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(value)?' selected':''}>${esc(l)}</option>`).join('')}</select>`;
function tile(label,value,detail='',meter=null){return `<div class="fleet233Tile"><small>${label}</small><strong>${value}</strong>${meter?`<span class="fleet233Meter" role="img" aria-label="${esc(meter.label)}"><i style="width:${Math.min(100,Math.max(0,meter.pct)).toFixed(1)}%"></i></span>`:''}${detail?`<span>${detail}</span>`:''}</div>`}
const SEV={critical:['Blocker','✕'],warning:['Check','!'],controlled:['Fine','✓'],info:['Note','i']};
function finding(f){const [word,icon]=SEV[f.severity]||SEV.info;return `<article class="fleet233Finding ${f.severity}"><b role="img" aria-label="${word}">${icon}</b><div><strong>${esc(f.title)}</strong><p>${esc(f.text)}${f.src?` <span class="fleet233Src">Source: ${link(f.src,SRC_NAMES[f.src]||'Splunk documentation')}</span>`:''}</p></div></article>`}
const SRC_NAMES={client:'deploymentclient.conf',serverclass:'serverclass.conf',perf:'Estimate agent management performance',plan:'Plan a deployment',cluster:'Implement a deployment server cluster',pre92:'Upgrade pre-9.2 deployment servers',paths100:'How to upgrade Splunk Enterprise (10.0)',paths102:'How to upgrade Splunk Enterprise (10.2)',paths104:'How to upgrade Splunk Enterprise (10.4)',paths106:'How to upgrade Splunk Enterprise (10.6)',distributed:'How to upgrade a distributed Splunk Enterprise environment',compat:'Compatibility between forwarders and Splunk Enterprise indexers',precedence:'Configuration file precedence'};
function table(head,rows,caption=''){return `<div class="fleet233Table" tabindex="0" role="region" aria-label="${esc(caption||head.join(', '))}"><table><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>i?`<td>${c}</td>`:`<th scope="row">${c}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`}
const minutes=m=>m<1?`${Math.round(m*60)} s`:m<90?`${num(m,1)} min`:`${num(m/60,1)} h`;
const niceCeil=v=>{if(v<=0)return 1;const p=10**Math.floor(Math.log10(v)),n=v/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p};
// A tick step of 1, 2 or 5 times a power of ten, for about `count` ticks.
const niceStep=(max,count=4)=>{const raw=Math.max(max,1e-9)/count,p=10**Math.floor(Math.log10(raw)),n=raw/p;return (n<=1?1:n<=2?2:n<=5?5:10)*p};
// Figures are drawn at the width they have, so their text keeps its size; a phone scrolls them in their box.
const figureWidth=(min,max)=>Math.max(min,Math.min(max,Math.round((content()?.clientWidth||960)-66)));
// A line chart: one axis, 2 px lines, end labels, a crosshair that snaps to the nearest step, the same readout on
// keyboard focus, and its numbers in a table below.
function lineChart({id,title,xLabel,yLabel,series,xMax,marker,fmtX=num,fmtY=v=>num(v,1)}){
 const W=figureWidth(560,1100),H=260,L=52,R=128,T=16,B=42,pw=W-L-R,ph=H-T-B,top=Math.max(...series.flatMap(s=>s.points.map(p=>p[1])),1),yStep=niceStep(top,4),yMax=Math.ceil(top/yStep-1e-9)*yStep,xStep=niceStep(xMax,5);
 const x=v=>L+v/xMax*pw,y=v=>T+ph-v/yMax*ph,steps=(max,step)=>Array.from({length:Math.round(max/step)+1},(_,i)=>i*step);
 const grid=steps(yMax,yStep).map(v=>`<line x1="${L}" x2="${L+pw}" y1="${y(v)}" y2="${y(v)}" class="g"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${num(v)}</text>`).join('');
 const xt=steps(xMax,xStep).map(v=>`<text x="${x(v)}" y="${T+ph+18}" text-anchor="middle">${fmtX(v)}</text>`).join('');
 const lines=series.map((s,i)=>{const d=s.points.map((p,j)=>`${j?'L':'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(''),last=s.points.at(-1);
  return `<path d="${d}" class="s${i+1}"/><text x="${x(last[0])+8}" y="${y(last[1])+4}" class="end">${esc(s.name)}</text>`}).join('');
 const mk=marker?`<line x1="${x(marker.x)}" x2="${x(marker.x)}" y1="${T}" y2="${T+ph}" class="m"/><text x="${x(marker.x)+5}" y="${T+11}" class="mt">${esc(marker.label)}</text>${series.map((s,i)=>{const v=s.at(marker.x);return v==null?'':`<circle cx="${x(marker.x)}" cy="${y(v)}" r="5" class="d${i+1}"/>`}).join('')}`:'';
 const legend=`<div class="fleet233Legend">${series.map((s,i)=>`<span><i class="k${i+1}" aria-hidden="true"></i>${esc(s.name)}</span>`).join('')}</div>`;
 const svg=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-t ${id}-d" class="fleet233Chart" data-xmax="${xMax}" data-w="${W}" data-l="${L}" data-r="${R}"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(series.map(s=>`${s.name}: ${s.summary}`).join('. '))}</desc>
  <g class="ax">${grid}${xt}<line x1="${L}" x2="${L+pw}" y1="${T+ph}" y2="${T+ph}" class="b"/><text x="${L+pw/2}" y="${H-4}" text-anchor="middle">${esc(xLabel)}</text><text x="12" y="${T+ph/2}" transform="rotate(-90 12 ${T+ph/2})" text-anchor="middle">${esc(yLabel)}</text></g>
  ${lines}${mk}<line class="cross" x1="0" x2="0" y1="${T}" y2="${T+ph}" visibility="hidden"/><rect class="hit" x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg>`;
 return `<figure class="fleet233Figure" data-chart="${id}"><figcaption>${esc(title)}</figcaption>${legend}<div class="fleet233Plot fleet233Scroll" tabindex="0" aria-describedby="${id}-tip" aria-label="${esc(title)}: use the arrow keys to read the values">${svg}<div class="fleet233Tip" id="${id}-tip" role="status" hidden></div></div></figure>`}
function wireChart(root,id,series,{xMax,step,fmtX=num,fmtY=v=>num(v,1)+' min'}){
 const plot=root.querySelector(`[data-chart="${id}"] .fleet233Plot`);if(!plot)return;const svg=plot.querySelector('svg'),tip=plot.querySelector('.fleet233Tip'),cross=svg.querySelector('.cross');
 const W=+svg.dataset.w,L=+svg.dataset.l,R=+svg.dataset.r,pw=W-L-R;let at=null;
 const show=v=>{at=Math.max(0,Math.min(xMax,Math.round(v/step)*step));const px=L+at/xMax*pw;cross.setAttribute('x1',px);cross.setAttribute('x2',px);cross.setAttribute('visibility','visible');
  tip.hidden=false;tip.replaceChildren();const h=document.createElement('b');h.textContent=fmtX(at)+' agents';tip.append(h);
  series.forEach((s,i)=>{const v=s.at(at),row=document.createElement('span');const k=document.createElement('i');k.className='k'+(i+1);k.setAttribute('aria-hidden','true');row.append(k);const val=document.createElement('strong');val.textContent=v==null?'beyond Splunk’s figure':fmtY(v);row.append(val,document.createTextNode(' '+s.name));tip.append(row)});
  tip.style.left=Math.min(Math.max(0,px-plot.scrollLeft-80),Math.max(0,plot.clientWidth-200))+'px'};
 const hide=()=>{cross.setAttribute('visibility','hidden');tip.hidden=true};
 svg.addEventListener('pointermove',e=>{const b=svg.getBoundingClientRect();show(((e.clientX-b.left)-L)/pw*xMax)});
 svg.addEventListener('pointerleave',()=>{if(document.activeElement!==plot)hide()});
 plot.addEventListener('focus',()=>show(at??Number(plot.dataset.start||xMax/2)));plot.addEventListener('blur',hide);
 plot.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show((at??0)+(e.key==='ArrowRight'?step:-step))}else if(e.key==='Home'){e.preventDefault();show(0)}else if(e.key==='End'){e.preventDefault();show(xMax)}else if(e.key==='Escape')hide()})}
TOOLS.capacity={render(){
 const m=capacityModel(),b=m.biggest,f=FORMULA[CAP.os],xMax=niceCeil(Math.max(3000,b.perServer*1.4)),step=xMax/100;
 const lin={name:'Linux, 12 cores',at:v=>pushMinutes(v,{os:'linux',sizeMB:m.sizeMB,phoneHome:m.P,maxDownloads:CAP.maxDownloads}),points:[]},
  win={name:'Windows, 8 cores',at:v=>v>3000?null:pushMinutes(v,{os:'windows',sizeMB:m.sizeMB,phoneHome:m.P,maxDownloads:CAP.maxDownloads}),points:[]};
 for(let v=0;v<=xMax+1e-9;v+=step){lin.points.push([v,lin.at(v)]);if(v<=3000)win.points.push([v,win.at(v)])}
 lin.summary=`${minutes(lin.at(Math.ceil(b.perServer)))} for ${num(Math.ceil(b.perServer))} agents`;win.summary=b.perServer<=3000?`${minutes(win.at(Math.ceil(b.perServer)))} for ${num(Math.ceil(b.perServer))} agents; Splunk's figure ends at 3,000`:'Splunk’s figure ends at 3,000 agents';
 F._capSeries=[lin,win];F._capChart={xMax,step};
 const tiles=[tile('Phone homes a second',num(m.rows.reduce((s,r)=>s+r.phoneHomesPerSec,0),1),`${num(m.total)} agents every ${num(m.P)} s`),
  tile('Time to push the release',minutes(b.pushMin),`${num(m.sizeMB,1)} MB to ${num(Math.ceil(b.perServer))} agents on ${esc(b.name)}${m.servers>1?' per server':''}`),
  tile('Agents per server',num(Math.round(b.perServer)),`of the 25,000 Splunk gives each server`,{pct:b.perServer/250,label:`${num(Math.round(b.perServer))} of 25,000 agents`}),
  tile('Phone-home records a day',num(m.rows.reduce((s,r)=>s+r.perDay,0)),`in _dsphonehome: about ${num(m.rows.reduce((s,r)=>s+r.perDay,0)*DS_EVENT_BYTES/1048576,0)} MB a day at ${DS_EVENT_BYTES} bytes each, kept ${DS_KEEP_DAYS} days`)];
 const rows=m.rows.map(r=>[esc(r.name),num(r.clients),num(r.phoneHomesPerSec,1),num(r.retryPerSec,1),num(r.resyncPerSec,2),minutes(r.splunkMin),minutes(r.pushMin),num(r.bundleGB,2)+' GB',minutes(r.wireSec/60)]);
 return hero('Deployment Server capacity','The load the fleet puts on its Deployment Servers',`Phone homes, retries, app-state reports and release pushes for ${num(m.total)} agents in ${esc(inventory().label)}, against Splunk's own sizing figures. (Splunk 10 calls the Deployment Server agent management and its clients agents; the .conf names stay the same.)`)+
 `<div class="fleet233Fields">${field('Host','cap.os',selectInput(CAP.os,[['linux','Linux, 12 cores'],['windows','Windows, 8 cores']]),'the hosts Splunk timed')}${field('CPU cores','cap.cores',numberInput(CAP.cores,1,256))}${field('Servers behind one address','cap.servers',selectInput(CAP.servers,[[1,'1'],[2,'2 (a cluster)'],[3,'3 (a cluster, the most)']]))}${field('Phone home every (s)','cap.phoneHome',numberInput(CAP.phoneHome,1,86400),'phoneHomeIntervalInSecs; Splunk’s default is 60')}${field('Release bundle (MB)','cap.sizeMB',numberInput(m.sizeMB,0.1,10000,0.1),'as sent: precompressBundles is on by default')}${field('Network (Gb/s)','cap.nicGbps',numberInput(CAP.nicGbps,0.1,400,0.1))}${field('Downloads at a time','cap.maxDownloads',numberInput(CAP.maxDownloads,0,100000),'maxConcurrentDownloads; 0 is no limit')}</div>`+
 `<div class="fleet233Tiles">${tiles.join('')}</div>`+
 lineChart({id:'fleet233-push',title:`Time to push ${num(m.sizeMB,1)} MB, by agents on one server`,xLabel:'Agents on one server',yLabel:'Minutes',series:[lin,win],xMax,marker:{x:Math.ceil(b.perServer),label:`${b.name}: ${num(Math.ceil(b.perServer))}`}})+
 `<details class="fleet233More"><summary>The chart’s numbers</summary>${table(['Agents','Linux, 12 cores','Windows, 8 cores'],[0.1,0.25,0.5,0.75,1].map(t=>Math.round(t*xMax)).map(v=>[num(v),minutes(lin.at(v)),win.at(v)==null?'beyond Splunk’s figure':minutes(win.at(v))]),'Time to push the release')}</details>`+
 `<div class="sectionLabel">Each server</div>`+table(['Server','Agents','Phone homes a second','Handshake retries a second while it is down','App-state reports a second','Splunk’s time for 50 MB','This release, this model','Bundles sent','Shortest time on the wire'],rows,'Load on each Deployment Server')+
 `<div class="sectionLabel">Against Splunk’s guidance</div><div class="fleet233Findings">${m.findings.map(finding).join('')}</div>`+
 `<details class="fleet233More"><summary>How this is worked out</summary><ul>
  <li>Phone homes a second = agents ÷ phoneHomeIntervalInSecs (default 60). While a server is down, agents retry the handshake every phoneHomeIntervalInSecs ÷ 5 seconds, and report their apps' state every 10 × phoneHomeIntervalInSecs: ${link('client','deploymentclient.conf')}.</li>
  <li>Splunk's time for 50 MB is its measured formula: T = 0.0075 × C + 2 minutes (Linux, 12 cores) or T = 0.04 × C + 8 (Windows, 8 cores, valid to 3,000 agents), with a 60-second phone home on a fast LAN: ${link('perf','Estimate agent management performance')}.</li>
  <li><b>This model's assumptions:</b> for a bundle other than 50 MB the per-agent part is scaled by size ÷ 50; a phone home longer than 60 s adds its extra wait once; with maxConcurrentDownloads set, a push takes at least ⌈agents ÷ limit⌉ phone-home rounds, because agents over the limit retry at their next phone home (${link('serverclass','serverclass.conf')}).</li>
  <li>Shortest time on the wire = agents × bundle ÷ network speed: a floor, not an estimate.</li>
  <li>Phone-home records: Splunk 9.2 and later write each phone home to the _dsphonehome index. On Splunk 10.6.1.1 a record is about 330 bytes (328 to 330 here; longer agent names make it longer), and the SplunkDeploymentServerConfig app keeps _dsphonehome 7 days.</li></ul></details>`},
 wire(root){wireFields(root,'cap.',CAP,()=>{});const s=F._capSeries;if(s)wireChart(root,'fleet233-push',s,{...F._capChart,fmtY:v=>minutes(v)})}};
// Fields write their value back into the tool's settings and draw the page again.
function wireFields(root,prefix,target,after){root.querySelectorAll(`[data-fleet233-key^="${prefix}"]`).forEach(x=>x.onchange=()=>{const k=x.dataset.fleet233Key.slice(prefix.length);let v=x.type==='checkbox'?x.checked:x.value;
 if(x.type==='number'){v=Number(v);if(!isFinite(v)||v<Number(x.min||0)){x.setAttribute('aria-invalid','true');return}if(x.max&&v>Number(x.max))v=Number(x.max)}else if(x.tagName==='SELECT'&&/^\d+$/.test(v))v=Number(v);
 target[k]=v;after?.(k,v);rerender()})}
// ---- Fleet cohort rollout simulator ----
// A release reaches agents in cohorts: the canary, then waves that each take a share of the rest. Each cohort is a
// list of clientNames that one server class reads from a CSV file (whitelist.from_pathname with select_field,
// where_field and where_equals); each step widens where_equals and reloads that server class. A step for a region
// starts only inside its maintenance window and only if it ends inside it; after each wave the release soaks, and a
// health gate stops it when more than the gate's share of the wave fails. Times come from pushMinutes().
const RO=F.rollout={app:'release_candidate',classes:['sc_windows_security','sc_linux_audit'],canaryClass:'sc_canary',restart:false,
 waves:[{name:'Canary',canary:true,soak:60},{name:'Wave 1',pct:10,soak:30},{name:'Wave 2',pct:40,soak:30},{name:'Wave 3',pct:100,soak:30}],
 windows:{a:['22:00','04:00'],b:['01:00','07:00']},start:'21:30',gate:2,fail:5,stopAt:'none',phoneHome:{},maxDownloads:null};
const hm=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(s).trim());return m&&+m[1]<24&&+m[2]<60?+m[1]*60+ +m[2]:null};
const clock=t=>{const d=Math.floor(t/1440),m=Math.round(t-d*1440),h=Math.floor(m/60)%24;return `Day ${d+1} ${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`};
// The first time at or after t when a step of dur minutes fits inside the region's daily window.
function place(t,[from,to],dur){const a=hm(from),b=hm(to);if(a==null||b==null)return {start:t,wait:0,fits:true};
 const len=((b-a)+1440)%1440||1440;
 for(let d=Math.floor(t/1440)-1;d<Math.floor(t/1440)+60;d++){const ws=d*1440+a,we=ws+len;if(we<=t)continue;const s=Math.max(t,ws);if(s+dur<=we)return {start:s,wait:s-t,fits:true};
  if(dur>len&&ws>=t)return {start:ws,wait:ws-t,fits:false}}
 return {start:t,wait:0,fits:false}}
// The chance that a wave of n agents shows more than the gate's share of failures when each fails with chance p.
function tail(n,p,k){if(k<=0)return 1;if(k>n||p<=0)return 0;if(p>=1)return 1;let lp=n*Math.log1p(-p),below=0;
 for(let i=0;i<k;i++){if(i>0)lp+=Math.log((n-i+1)/i)+Math.log(p)-Math.log1p(-p);below+=Math.exp(lp)}return Math.max(0,Math.min(1,1-below))}
function rolloutModel(){
 const inv=inventory(),cap=capacityModel(),app=inv.apps.find(a=>a.name===RO.app)||inv.apps[0],sizeMB=app?.sizeMB??12,os=CAP.os,maxDownloads=RO.maxDownloads??CAP.maxDownloads;
 const scope=inv.clients.filter(c=>c.classes.some(x=>RO.classes.includes(x))),regions=[...new Set(inv.clients.map(c=>c.ds))].sort();
 const live=scope.filter(c=>!stale(c)),away=scope.length-live.length,order=c=>hash(c.name);
 const P=ds=>Number(RO.phoneHome[ds])||Math.round(inv.clients.filter(c=>c.ds===ds).reduce((s,c)=>s+(c.phoneHome||60),0)/Math.max(1,inv.clients.filter(c=>c.ds===ds).length))||60;
 // Who is in each cohort: the canary is every live agent of the canary server class in scope; each wave takes agents up to its share
 // of the rest, region by region, in a fixed order.
 const cohorts=RO.waves.map(()=>new Map(regions.map(r=>[r,[]])));
 for(const r of regions){const mine=live.filter(c=>c.ds===r),cc=RO.canaryClass,can=mine.filter(c=>cc&&c.classes.includes(cc)),rest=mine.filter(c=>!(cc&&c.classes.includes(cc))).sort((x,y)=>order(x)-order(y)||byteOrder(x.name,y.name));
  let prev=0;RO.waves.forEach((w,i)=>{if(w.canary){cohorts[i].get(r).push(...can);return}const upto=Math.round(Math.min(100,Math.max(0,w.pct))/100*rest.length);cohorts[i].get(r).push(...rest.slice(prev,Math.max(prev,upto)));prev=Math.max(prev,upto)})}
 const start=hm(RO.start)??1260,f=Math.min(100,Math.max(0,RO.fail))/100,g=Math.min(100,Math.max(0,RO.gate))/100,steps=[],gates=[],problems=[];
 let ready=start,cum=0,reach=1,expected=0;const cumByRegion=Object.fromEntries(regions.map(r=>[r,0]));
 RO.waves.forEach((w,i)=>{const parts=regions.map(r=>{const n=cohorts[i].get(r).length;if(!n)return null;const dur=pushMinutes(n,{os,sizeMB,phoneHome:P(r),maxDownloads}),pl=place(ready,RO.windows[r]||['00:00','00:00'],dur);
   if(!pl.fits)problems.push({severity:'warning',title:`${w.name} doesn’t fit ${regionOf(r)}’s window`,text:`Pushing to ${num(n)} agents takes ${minutes(dur)}, longer than the window ${RO.windows[r][0]}–${RO.windows[r][1]} UTC. Split the wave or widen the window.`,src:'perf'});
   cumByRegion[r]+=n;return {wave:i,name:w.name,ds:r,n,dur,start:pl.start,end:pl.start+dur,wait:pl.wait,fits:pl.fits,P:P(r),cumRegion:cumByRegion[r]}}).filter(Boolean);
  const n=parts.reduce((s,p)=>s+p.n,0);if(!n){gates.push({wave:i,name:w.name,n:0,skip:true});return}
  steps.push(...parts);cum+=n;const end=Math.max(...parts.map(p=>p.end)),gateAt=end+Math.max(0,w.soak||0),k=Math.floor(g*n+1e-9)+1,stop=tail(n,f,k);
  expected+=reach*stop*cum;gates.push({wave:i,name:w.name,n,cum,end,gateAt,k,stop,reach,soak:w.soak||0,failures:Math.round(n*f)});reach*=1-stop;ready=gateAt});
 expected+=reach*cum;
 const done=gates.filter(x=>!x.skip),last=done.at(-1),stopGate=RO.stopAt==='none'?null:done.find(x=>String(x.wave)===String(RO.stopAt));
 let rollback=[];if(stopGate){const reached={};steps.filter(s=>s.wave<=stopGate.wave).forEach(s=>reached[s.ds]=(reached[s.ds]||0)+s.n);
  rollback=Object.entries(reached).map(([ds,n])=>{const dur=pushMinutes(n,{os,sizeMB,phoneHome:P(ds),maxDownloads});return {ds,n,start:stopGate.gateAt,end:stopGate.gateAt+dur,dur}})}
 if(!RO.waves.some(w=>w.canary)||!done.length||done[0].wave!==RO.waves.findIndex(w=>w.canary))problems.push({severity:'warning',title:'No canary first',text:'The first cohort to receive the release isn’t a canary.'});
 const canary=done.find(x=>RO.waves[x.wave].canary);
 if(canary&&canary.stop<0.5&&f>0)problems.push({severity:'warning',title:'The canary may miss it',text:`With ${num(canary.n)} canary agents and ${num(f*100,1)}% of agents failing, the canary shows more than ${num(g*100,1)}% failures only ${num(canary.stop*100)}% of the time.`});
 if(RO.restart)problems.push({severity:'warning',title:'Agents restart on install',text:'restartSplunkd = true restarts splunkd on each agent when the app updates: forwarding pauses while it restarts, and UDP inputs drop what arrives meanwhile.',src:'serverclass'});
 if(away)problems.push({severity:'info',title:`${plural(away,'agent')} not phoning home`,text:'They get the release when they next phone home, outside the waves: check them before the last wave closes.'});
 return {app,sizeMB,os,regions,scope:scope.length,live:live.length,away,cohorts,steps,gates:done,start,end:last?last.gateAt:start,expected,reach,rollback,stopGate,problems,P,f,g}}
function cohortCsv(m){const rows=['clientName,wave,region'];m.cohorts.forEach((byRegion,i)=>{const tag=RO.waves[i].canary?'canary':String(i);for(const [r,list] of byRegion)for(const c of list)rows.push(`${c.name},${tag},${r.toUpperCase()}`)});return rows.join('\n')+'\n'}
function rolloutConf(m){const app=m.app?.name||'app',cls=`sc_rollout_${app}`,file=`etc/system/local/rollout_${app}.csv`,tags=[];const out=[`# Cohort rollout of ${app} ${m.app?.version||''}: one server class reads the cohorts from ${file}`,`# (relative to $SPLUNK_HOME on each Deployment Server). Each step widens where_equals, then reloads this class.`,''];
 RO.waves.forEach((w,i)=>{if(!m.cohorts[i]||![...m.cohorts[i].values()].some(l=>l.length))return;tags.push(w.canary?'canary':String(i));
  out.push(`# Step ${tags.length}: ${w.name}`,`[serverClass:${cls}]`,`whitelist.from_pathname = ${file}`,`whitelist.select_field = clientName`,`whitelist.where_field = wave`,`whitelist.where_equals = ${tags.join(',')}`,`restartSplunkd = ${RO.restart?'true':'false'}`,'',`[serverClass:${cls}:app:${app}]`,'',`# then: splunk reload deploy-server -class ${cls}`,'')});
 return out.join('\n')}
// The schedule as a timeline: a row for each region with its maintenance windows behind the pushes, and a row for the
// health gates. Each bar is a focusable mark with its own readout; the schedule table below holds every number.
function timeline(m){
 const rows=[...m.regions.map(r=>({id:r,label:regionOf(r)})),{id:'gate',label:'Health gates'}],W=figureWidth(680,1200),L=124,R=24,T=10,rowH=44,H=T+rows.length*rowH+34;
 const t0=Math.floor(m.start/60)*60,t1=Math.max(...[m.end,...m.rollback.map(r=>r.end),m.start+60]),span=Math.max(60,Math.ceil((t1-t0)/60)*60),x=t=>L+(t-t0)/span*(W-L-R);
 const tickEvery=[60,120,180,240,360,480,720,1440].find(v=>span/v<=8)||1440,ticks=[];for(let t=Math.ceil(t0/tickEvery)*tickEvery;t<=t0+span;t+=tickEvery)ticks.push(t);
 const marks=[];let body='';
 rows.forEach((row,i)=>{const y=T+i*rowH;body+=`<text x="${L-10}" y="${y+rowH/2+4}" text-anchor="end" class="rl">${esc(row.label)}</text><line x1="${L}" x2="${W-R}" y1="${y+rowH}" y2="${y+rowH}" class="g"/>`;
  if(row.id!=='gate'){const w=RO.windows[row.id];const a=hm(w?.[0]),b=hm(w?.[1]);if(a!=null&&b!=null){const len=((b-a)+1440)%1440||1440;for(let d=Math.floor(t0/1440)-1;d<=Math.ceil((t0+span)/1440);d++){const s=Math.max(t0,d*1440+a),e=Math.min(t0+span,d*1440+a+len);if(e>s)body+=`<rect x="${x(s)}" y="${y+4}" width="${x(e)-x(s)}" height="${rowH-8}" class="win"/>`}}
   for(const s of m.steps.filter(s=>s.ds===row.id&&(!m.stopGate||s.wave<=m.stopGate.wave)))marks.push({kind:'push',x0:x(s.start),x1:Math.max(x(s.start)+3,x(s.end)),y:y+11,h:18,label:s.name,tip:[`${s.name} · ${regionOf(s.ds)}`,`${num(s.n)} agents`,`${clock(s.start)} → ${clock(s.end)} UTC (${minutes(s.dur)})`,s.wait?`waited ${minutes(s.wait)} for the window`:'']});
   for(const r of m.rollback.filter(r=>r.ds===row.id))marks.push({kind:'back',x0:x(r.start),x1:Math.max(x(r.start)+3,x(r.end)),y:y+11,h:18,label:'Rollback',tip:[`Rollback · ${regionOf(r.ds)}`,`${num(r.n)} agents back to the previous version`,`${clock(r.start)} → ${clock(r.end)} UTC (${minutes(r.dur)})`]})}
  else for(const g of m.gates.filter(g=>!m.stopGate||g.wave<=m.stopGate.wave)){const stopped=m.stopGate&&g.wave===m.stopGate.wave;marks.push({kind:stopped?'stop':'gate',cx:x(g.gateAt),y:y+rowH/2-6,label:stopped?'Stopped':'',name:g.name.replace('Wave ','W'),tip:[`${g.name}: health gate`,`${clock(g.gateAt)} UTC, after ${minutes(g.soak)} of soak`,stopped?'Stopped here: the release is rolled back':`Passes at ${num(g.k-1)} or fewer failures of ${num(g.n)}`]})}});
 const axis=ticks.map(t=>`<line x1="${x(t)}" x2="${x(t)}" y1="${T}" y2="${T+rows.length*rowH}" class="g"/><text x="${x(t)}" y="${T+rows.length*rowH+16}" text-anchor="middle">${clock(t).replace('Day ','D')}</text>`).join('');
 const drawn=marks.map((k,i)=>{const tip=esc(k.tip.filter(Boolean).join(' · '));if(k.kind==='gate'||k.kind==='stop')return `<g class="mk ${k.kind}" tabindex="0" role="img" aria-label="${tip}" data-tip="${tip}"><rect x="${k.cx-14}" y="${k.y-12}" width="28" height="38" class="hit"/><path d="M${k.cx},${k.y-7} L${k.cx+7},${k.y} L${k.cx},${k.y+7} L${k.cx-7},${k.y} Z"/><text x="${k.cx}" y="${k.y+22}" text-anchor="middle" class="gl">${esc(k.name)}</text>${k.label?`<text x="${k.cx+11}" y="${k.y+4}">${k.label}</text>`:''}</g>`;
  const w=Math.max(4,k.x1-k.x0),fits=w>=k.label.length*6.6+12,hw=Math.max(24,w);return `<g class="mk ${k.kind}" tabindex="0" role="img" aria-label="${tip}" data-tip="${tip}"><rect x="${k.x0+w/2-hw/2}" y="${k.y-4}" width="${hw}" height="${k.h+8}" class="hit"/><rect x="${k.x0}" y="${k.y}" width="${w}" height="${k.h}" rx="${Math.min(4,w/2)}"/>${fits?`<text x="${k.x0+6}" y="${k.y+13}" class="in">${esc(k.label)}</text>`:''}</g>`}).join('');
 return `<figure class="fleet233Figure fleet233Timeline" data-chart="fleet233-timeline"><figcaption>When each cohort gets ${esc(m.app?.name||'the release')}, UTC</figcaption><div class="fleet233Legend"><span><i class="k1 bar" aria-hidden="true"></i>Push to a cohort</span><span><i class="kwin" aria-hidden="true"></i>Maintenance window</span><span><i class="kgate" aria-hidden="true"></i>Health gate</span>${m.rollback.length?'<span><i class="k2 bar" aria-hidden="true"></i>Rollback</span>':''}</div><div class="fleet233Plot fleet233Scroll"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="fleet233Chart" role="group" aria-label="Rollout timeline: each push and gate is a focusable mark"><g class="ax">${axis}</g>${body}${drawn}</svg><div class="fleet233Tip" role="status" hidden></div></div></figure>`}
function wireMarks(root){const plot=root.querySelector('.fleet233Timeline .fleet233Plot');if(!plot)return;const tip=plot.querySelector('.fleet233Tip'),svg=plot.querySelector('svg');
 const show=g=>{tip.textContent='';g.dataset.tip.split(' · ').forEach((line,i)=>{const s=document.createElement(i?'span':'b');s.textContent=line;tip.append(s)});tip.hidden=false;const b=g.getBoundingClientRect(),p=plot.getBoundingClientRect();tip.style.left=Math.max(0,Math.min(b.left-p.left+plot.scrollLeft,plot.scrollWidth-220))+'px';tip.style.top=(b.bottom-p.top+6)+'px'};
 svg.querySelectorAll('.mk').forEach(g=>{g.addEventListener('pointerenter',()=>show(g));g.addEventListener('focus',()=>show(g));g.addEventListener('pointerleave',()=>{if(document.activeElement!==g)tip.hidden=true});g.addEventListener('blur',()=>tip.hidden=true)})}
TOOLS.rollout={render(){
 const m=rolloutModel(),inv=inventory(),pct=v=>`${num(v*100,v<0.1&&v>0?1:0)}%`;
 const classes=inv.classes.filter(c=>c.name!==RO.canaryClass).map(c=>`<label class="fleet233Check"><input type="checkbox" data-fleet233-class="${esc(c.name)}"${RO.classes.includes(c.name)?' checked':''}><span>${esc(c.name)} <small>${num(classCount(inv,c.name))} agents</small></span></label>`).join('');
 const waveRows=RO.waves.map((w,i)=>{const g=m.gates.find(x=>x.wave===i);return [esc(w.name),w.canary?'Every canary agent in scope':`<label class="fleet233Inline"><input aria-label="${esc(w.name)}: share of the rest by its end (%)" type="number" min="0" max="100" step="1" value="${w.pct}" data-fleet233-key="ro.wave.${i}.pct"></label>`,
  `<label class="fleet233Inline"><input aria-label="${esc(w.name)}: soak (min)" type="number" min="0" max="10080" step="5" value="${w.soak}" data-fleet233-key="ro.wave.${i}.soak"></label>`,g?num(g.n):'0',g?num(g.cum):'—',g?pct(g.stop):'—',g?pct(g.reach):'—']});
 const sched=m.steps.map(s=>[esc(s.name),esc(regionOf(s.ds)),num(s.n),clock(s.start),clock(s.end),minutes(s.dur),s.wait?minutes(s.wait):'none',s.fits?'yes':'<b class="fleet233Warn">no</b>']);
 const end=m.stopGate?Math.max(...m.rollback.map(r=>r.end),m.stopGate.gateAt):m.end;
 const tiles=[tile('Planned time',minutes(m.end-m.start),`${clock(m.start)} to ${clock(m.end)} UTC, gates included`),tile('Agents it reaches',num(m.live),`${num(m.scope)} in scope${m.away?`, ${num(m.away)} not phoning home`:''}`),
  tile('If the release is bad',`${num(Math.round(m.expected))} agents`,`expected to have it before a gate stops it, with ${num(m.f*100,1)}% failing`),
  tile('Chance the canary stops it',m.gates[0]?pct(m.gates[0].stop):'—',m.gates[0]?`more than ${num(m.g*100,1)}% of ${num(m.gates[0].n)} canary agents failing`:'')];
 if(m.stopGate)tiles.push(tile('Rollback',minutes(Math.max(...m.rollback.map(r=>r.dur))),`${num(m.rollback.reduce((s,r)=>s+r.n,0))} agents back by ${clock(end)} UTC`));
 return hero('Fleet cohort rollout simulator','A release, cohort by cohort',`Canary, waves, soak, health gates, regional maintenance windows and rollback for ${esc(m.app?.name||'a release')} across ${esc(inventory().label)}. Push times use Splunk’s sizing figures as the Server capacity page does.`,
  `<button type="button" class="builderBtn" data-fleet233-dl="csv">Cohorts (CSV)</button><button type="button" class="builderBtn" data-fleet233-dl="conf">serverclass.conf steps</button><button type="button" class="builderBtn primary" data-fleet233-dl="json">Plan (JSON)</button>`)+
 `<div class="fleet233Fields">${field('Release','ro.app',selectInput(RO.app,inv.apps.map(a=>[a.name,`${a.name} ${a.version||''} · ${num(a.sizeMB,1)} MB`])))}${field('Start, day 1 (UTC)','ro.start',`<input type="time" value="${esc(RO.start)}">`)}${m.regions.map(r=>field(`${regionOf(r)} window opens (UTC)`,`ro.win.${r}.0`,`<input type="time" value="${esc(RO.windows[r]?.[0]||'00:00')}">`)+field(`${regionOf(r)} window closes (UTC)`,`ro.win.${r}.1`,`<input type="time" value="${esc(RO.windows[r]?.[1]||'00:00')}">`)+field(`${regionOf(r)} phone home (s)`,`ro.ph.${r}`,numberInput(m.P(r),1,86400))).join('')}
  ${field('Gate: stop above (% of a wave failing)','ro.gate',numberInput(RO.gate,0,100,0.5))}${field('If the release is bad: agents it breaks (%)','ro.fail',numberInput(RO.fail,0,100,0.5))}${field('Canary server class','ro.canaryClass',selectInput(RO.canaryClass,[['','None'],...inv.classes.map(c=>[c.name,`${c.name} (${num(classCount(inv,c.name))})`])]))}${field('Show a stop at','ro.stopAt',selectInput(RO.stopAt,[['none','No stop: the plan'],...m.gates.map(g=>[g.wave,`${g.name}: roll back`])]))}
  <fieldset class="fleet233Field fleet233Wide"><legend>Server classes that get it</legend><div class="fleet233Checks">${classes}</div></fieldset><fieldset class="fleet233Field fleet233Wide"><legend>On each agent</legend><div class="fleet233Checks"><label class="fleet233Check"><input type="checkbox" data-fleet233-key="ro.restart"${RO.restart?' checked':''}><span>Restart splunkd on install (restartSplunkd)</span></label></div></fieldset></div>`+
 `<div class="fleet233Tiles">${tiles.join('')}</div>`+timeline(m)+
 `<div class="sectionLabel">Cohorts and gates</div>`+table(['Cohort','Size','Soak after (min)','Agents','Agents so far','A bad release stops here','Chance it gets here'],waveRows,'Cohorts and health gates')+
 `<div class="sectionLabel">Schedule</div>`+table(['Cohort','Server','Agents','Starts (UTC)','Ends (UTC)','Push','Waits for the window','Inside the window'],sched,'Schedule of each push')+
 `<div class="fleet233Findings">${m.problems.map(finding).join('')||finding({severity:'controlled',title:'Every push fits its window',text:'Each cohort starts and ends inside its region’s maintenance window, after the gate before it.'})}</div>`+
 `<details class="fleet233More"><summary>How this is worked out</summary><ul><li>Cohorts: the canary is every live agent of the canary server class in the chosen server classes; each wave then takes agents up to its share of the rest, region by region. A server class reads them from a CSV file with whitelist.from_pathname, select_field = clientName, where_field = wave and where_equals; each step adds the next wave to where_equals and runs splunk reload deploy-server for that class: ${link('serverclass','serverclass.conf')}.</li><li>A push starts only inside its region’s window and only if it ends inside it; otherwise it waits for the next window. A rollback doesn’t wait.</li><li>The gate stops a wave when more than its share of the wave’s agents fail. A bad release that breaks each agent with the chance you set is stopped at a gate with the binomial chance shown; agents exposed are those that had it when it stopped.</li><li>Agents that haven’t phoned home for three of their intervals are left out of the cohorts.</li></ul></details>`},
 wire(root){
  root.querySelectorAll('[data-fleet233-class]').forEach(x=>x.onchange=()=>{const n=x.dataset.fleet233Class;RO.classes=x.checked?[...new Set([...RO.classes,n])]:RO.classes.filter(c=>c!==n);rerender()});
  root.querySelectorAll('[data-fleet233-key^="ro."]').forEach(x=>x.onchange=()=>{const k=x.dataset.fleet233Key.split('.');let v=x.type==='checkbox'?x.checked:x.value;
   if(x.type==='number'){v=Number(v);if(!isFinite(v)||v<Number(x.min||0)){x.setAttribute('aria-invalid','true');return}if(x.max!==''&&x.max&&v>Number(x.max))v=Number(x.max)}
   if(k[1]==='wave')RO.waves[+k[2]][k[3]]=v;else if(k[1]==='win'){if(hm(v)==null){x.setAttribute('aria-invalid','true');return}RO.windows[k[2]]=RO.windows[k[2]]||['00:00','00:00'];RO.windows[k[2]][+k[3]]=v}
   else if(k[1]==='ph')RO.phoneHome[k[2]]=v;else if(k[1]==='start'){if(hm(v)==null){x.setAttribute('aria-invalid','true');return}RO.start=v}else RO[k[1]]=v;rerender()});
  root.querySelectorAll('[data-fleet233-dl]').forEach(b=>b.onclick=()=>{const m=rolloutModel(),app=m.app?.name||'release';
   if(b.dataset.fleet233Dl==='csv')downloadText(`rollout_${app}.csv`,cohortCsv(m),'text/csv');
   else if(b.dataset.fleet233Dl==='conf')downloadText(`serverclass-rollout-${app}.conf`,rolloutConf(m),'text/plain');
   else downloadText(`rollout-plan-${app}.json`,JSON.stringify(rolloutJson(m),null,2),'application/json')});
  wireMarks(root)}};
function rolloutJson(m=rolloutModel()){return {schema:'splunk-pipeline-explorer/fleet-rollout-plan',version:1,generatedAt:new Date().toISOString(),release:{app:m.app?.name,version:m.app?.version,sizeMB:m.sizeMB},serverClasses:RO.classes.slice(),restartSplunkd:!!RO.restart,
 windowsUtc:Object.fromEntries(m.regions.map(r=>[regionOf(r),RO.windows[r]])),gate:{stopAbovePercent:RO.gate,assumedFailurePercent:RO.fail},
 cohorts:m.gates.map(g=>({name:g.name,agents:g.n,agentsSoFar:g.cum,soakMinutes:g.soak,gateUtc:clock(g.gateAt),chanceItStopsABadRelease:+g.stop.toFixed(4),chanceItIsReached:+g.reach.toFixed(4)})),
 schedule:m.steps.map(s=>({cohort:s.name,server:regionOf(s.ds),agents:s.n,startUtc:clock(s.start),endUtc:clock(s.end),pushMinutes:+s.dur.toFixed(2),waitedMinutes:+s.wait.toFixed(2),insideWindow:s.fits})),
 expectedAgentsExposedIfBad:Math.round(m.expected),agentsNotPhoningHome:m.away,stopShown:m.stopGate?{at:m.stopGate.name,rollback:m.rollback.map(r=>({server:regionOf(r.ds),agents:r.n,minutes:+r.dur.toFixed(2)}))}:null,findings:m.problems}}
// ---- Configuration dependency graph ----
// Which deployment apps set each setting, which server classes deploy those apps, which groups of agents get them,
// and which value each group ends up with. inputs.conf and outputs.conf are read in Splunk's global context: every
// app's local directory outranks every app's default directory, and among apps the directory name that sorts first
// byte by byte wins (digits, then upper case, then "_", then lower case).
const DEP=F.deps={apps:new Map(),selected:null,filter:''};
function appsForDeps(){const inv=inventory(),m=new Map(inv.apps.map(a=>[a.name,a]));for(const [k,a] of DEP.apps)m.set(k,a);return [...m.values()]}
function appSettings(app){const out=[];for(const [path,text] of Object.entries(app.files||{})){const mm=/(?:^|\/)(default|local)\/([^/]+)\.conf$/i.exec(path);if(!mm||/^app$/i.test(mm[2]))continue;const conf=mm[2].toLowerCase(),layer=mm[1].toLowerCase();
 let doc;try{doc=parseConf(String(text),conf,app.name+'/'+path)}catch{continue}const last=new Map();for(const s of doc.settings){if(s.invalid||!s.key)continue;last.set(s.stanza.name+'\u0000'+s.key,s)}
 for(const s of last.values())out.push({app:app.name,layer,conf,stanza:s.stanza.name,key:s.key,value:s.value,line:s.n,path})}return out}
const settingId=s=>`${s.conf}.conf [${s.stanza}] ${s.key}`;
// Global context: local before default, then the app directory names in byte order.
const outranks=(x,y)=>(x.layer===y.layer?0:x.layer==='local'?-1:1)||byteOrder(x.app,y.app);
function depsModel(){
 const inv=inventory(),apps=appsForDeps(),entries=apps.flatMap(appSettings),byId=new Map();
 for(const e of entries){const id=settingId(e);if(!byId.has(id))byId.set(id,[]);byId.get(id).push(e)}
 const pops=populations(inv),classesOf=app=>inv.classes.filter(c=>c.apps.includes(app)).map(c=>c.name);
 const settings=[...byId.entries()].map(([id,list])=>{const appsHere=new Set(list.map(e=>e.app)),groups=[];
  for(const p of pops){const mine=list.filter(e=>p.apps.includes(e.app)).sort(outranks);if(!mine.length)continue;const win=mine[0],lose=mine.slice(1);
   groups.push({pop:p,agents:p.clients.length,win,lose,differs:lose.some(e=>e.value!==win.value)})}
  const agents=groups.reduce((s,g)=>s+g.agents,0),clash=groups.filter(g=>g.differs);
  return {id,conf:list[0].conf,stanza:list[0].stanza,key:list[0].key,entries:list.sort(outranks),apps:[...appsHere],groups,agents,clash,clashAgents:clash.reduce((s,g)=>s+g.agents,0)}}).sort((a,b)=>b.clashAgents-a.clashAgents||b.agents-a.agents||byteOrder(a.id,b.id));
 const unused=apps.filter(a=>!classesOf(a.name).length).map(a=>a.name);
 return {apps,settings,conflicts:settings.filter(s=>s.clash.length),pops,classesOf,unused,entries:entries.length}}
const popLabel=p=>`${regionOf(p.ds)} · ${p.classes.join(' + ')}`;
function conflictText(s){const g=s.clash[0],loser=g.lose.find(e=>e.value!==g.win.value);const why=g.win.layer!==loser.layer?`${g.win.app}’s local directory outranks ${loser.app}’s default`:`“${g.win.app}” sorts before “${loser.app}”`;
 return `${num(s.clashAgents)} agents keep ${s.key} = ${g.win.value} from ${g.win.app}; ${loser.app} sets ${loser.value}, but ${why}.`}
// The graph for one setting: apps that set it, the server classes that deploy those apps, and the groups of agents.
function depGraph(s,m){
 const W=figureWidth(720,1120),colX=[8,Math.round(W*.36),Math.round(W*.68)],colW=[Math.round(W*.27),Math.round(W*.25),Math.round(W*.31)],rowH=36,gap=8,shown=s.groups.slice(0,14);
 const classes=[...new Set(shown.flatMap(g=>g.pop.classes).filter(c=>s.apps.some(a=>(inventory().classes.find(x=>x.name===c)?.apps||[]).includes(a))))].sort(byteOrder);
 const cols=[s.entries.map(e=>({id:'a:'+e.app+':'+e.layer,title:e.app,sub:`${e.layer}: ${e.value}`,win:s.groups.some(g=>g.win===e)})),classes.map(c=>({id:'c:'+c,title:c,sub:`${num(classCount(inventory(),c))} agents`})),shown.map(g=>({id:'p:'+g.pop.key,title:`${num(g.agents)} agents · ${regionOf(g.pop.ds)}`,sub:`gets ${g.win.value}`,clash:g.differs}))];
 const H=Math.max(...cols.map(c=>c.length))*(rowH+gap)+16,pos=new Map();
 cols.forEach((col,i)=>{const top=8+(H-16-col.length*(rowH+gap)+gap)/2;col.forEach((n,j)=>pos.set(n.id,{x:colX[i],y:top+j*(rowH+gap),w:colW[i]}))});
 const inv=inventory(),edges=[];
 for(const e of s.entries)for(const c of classes){const cl=inv.classes.find(x=>x.name===c);if(cl?.apps.includes(e.app))edges.push({from:'a:'+e.app+':'+e.layer,to:'c:'+c,win:s.groups.some(g=>g.win===e&&g.pop.classes.includes(c))})}
 for(const g of shown)for(const c of g.pop.classes)if(classes.includes(c)){const cl=inv.classes.find(x=>x.name===c);const carries=s.entries.filter(e=>cl.apps.includes(e.app));if(carries.length)edges.push({from:'c:'+c,to:'p:'+g.pop.key,win:carries.includes(g.win)})}
 const path=e=>{const a=pos.get(e.from),b=pos.get(e.to);if(!a||!b)return'';const x1=a.x+a.w,y1=a.y+rowH/2,x2=b.x,y2=b.y+rowH/2,mx=(x1+x2)/2;return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" class="${e.win?'win':'lose'}"/>`};
 const node=(n)=>{const p=pos.get(n.id);return `<g class="node${n.win?' winner':''}${n.clash?' clash':''}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${rowH}" rx="6"/><text x="${p.x+9}" y="${p.y+15}" class="t">${esc(clip(n.title,Math.floor((p.w-26)/7)))}</text><text x="${p.x+9}" y="${p.y+29}" class="s">${esc(clip(n.sub,Math.floor((p.w-18)/6.2)))}</text>${n.clash?`<text x="${p.x+p.w-9}" y="${p.y+14}" text-anchor="end" class="flag">!</text>`:''}</g>`};
 const heads=['Apps that set it','Server classes','Groups of agents'].map((h,i)=>`<text x="${colX[i]}" y="-4" class="h">${h}</text>`).join('');
 return `<figure class="fleet233Figure"><figcaption>${esc(s.id)}</figcaption><div class="fleet233Legend"><span><i class="k1" aria-hidden="true"></i>Path of the value that wins</span><span><i class="klose" aria-hidden="true"></i>A value that loses</span><span><i class="kflag" aria-hidden="true">!</i>Group where two apps disagree</span></div><div class="fleet233Scroll"><svg width="${W}" height="${H+18}" viewBox="0 -18 ${W} ${H+18}" class="fleet233Chart fleet233Graph" role="img" aria-label="${esc(`${s.id}: set by ${s.entries.map(e=>`${e.app} (${e.value})`).join(', ')}; ${s.groups.map(g=>`${g.agents} agents in ${popLabel(g.pop)} get ${g.win.value}`).join('; ')}`)}">${heads}${edges.map(path).join('')}${cols.flat().map(node).join('')}</svg></div>${s.groups.length>shown.length?`<p class="fleet233Note">The graph shows the first ${shown.length} of ${s.groups.length} groups; the table lists them all.</p>`:''}</figure>`}
const clip=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
// Deployment apps read in the browser: .tgz, .tar.gz, .spl, .tar or .zip packages, or a deployment-apps folder.
// Only each app's default/ and local/ .conf files and its app.conf version are kept; nothing leaves the page.
const LIMIT={packed:64*1024*1024,expanded:256*1024*1024,entries:20000};
function safePath(raw){const p=String(raw).replace(/\\/g,'/');if(p.startsWith('/')||/^[A-Za-z]:/.test(p)||p.includes('\0'))throw Error('Unsafe path in the package: '+p.slice(0,80));const bits=p.split('/').filter(x=>x&&x!=='.');if(bits.includes('..'))throw Error('Unsafe path in the package: '+p.slice(0,80));return bits.join('/')}
const wantedConf=path=>/(^|\/)(default|local)\/[^/]+\.conf$/i.test(path);
async function gunzip(file){if(typeof DecompressionStream!=='function')throw Error('This browser can’t open gzip packages; use a folder instead');
 const reader=file.stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let total=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>LIMIT.expanded){await reader.cancel();throw Error('The package expands to more than 256 MiB')}chunks.push(value)}}
 catch(e){if(/256 MiB/.test(e.message))throw e;throw Error('The package isn’t a complete gzip file')}finally{reader.releaseLock()}
 const out=new Uint8Array(total);let at=0;for(const c of chunks){out.set(c,at);at+=c.length}return out}
function untar(bytes){const dec=new TextDecoder(),str=(a,n)=>dec.decode(bytes.subarray(a,a+n)).replace(/\0.*$/s,''),oct=(a,n)=>parseInt(str(a,n).trim()||'0',8);
 const files=[];let at=0,count=0,longName='',pax={};
 while(at+512<=bytes.length){const hdr=at,h=bytes.subarray(hdr,hdr+512);if(h.every(b=>b===0))break;if(++count>LIMIT.entries)throw Error('The package has too many entries');
  let sum=0;for(let i=0;i<512;i++)sum+=i>=148&&i<156?32:h[i];if(sum!==oct(hdr+148,8))throw Error('The package\u2019s tar header is damaged');
  const type=String.fromCharCode(h[156]||48),size=pax.size!=null?Number(pax.size):oct(hdr+124,12);
  if(!Number.isSafeInteger(size)||size<0||hdr+512+size>bytes.length)throw Error('The package is cut short');
  const body=bytes.subarray(hdr+512,hdr+512+size);at=hdr+512+Math.ceil(size/512)*512;
  if(type==='x'){pax={};for(const line of dec.decode(body).split('\n')){const m=/^\d+ ([^=]+)=(.*)$/.exec(line);if(m)pax[m[1]]=m[2]}continue}
  if(type==='g')continue;if(type==='L'){longName=dec.decode(body).replace(/\0.*$/s,'');continue}
  const base=str(hdr,100),prefix=dec.decode(bytes.subarray(hdr+257,hdr+262))==='ustar'?str(hdr+345,155):'',name=pax.path||longName||(prefix?prefix+'/'+base:base);longName='';pax={};
  if(type!=='0')continue;const path=safePath(name);if(!wantedConf(path))continue;files.push({path,text:dec.decode(body)})}
 return files}
async function unzipConf(file){const b=new Uint8Array(await file.arrayBuffer()),v=new DataView(b.buffer),u16=o=>v.getUint16(o,true),u32=o=>v.getUint32(o,true),dec=new TextDecoder();
 let end=b.length-22;const stop=Math.max(0,end-65535);while(end>=stop&&u32(end)!==0x06054b50)end--;if(end<stop)throw Error('The zip file has no directory');
 const n=u16(end+10);let at=u32(end+16),total=0;if(n===0xffff||at===0xffffffff)throw Error('Zip64 files aren’t read here; use a folder');if(n>LIMIT.entries)throw Error('The package has too many entries');const files=[];
 for(let i=0;i<n;i++){if(u32(at)!==0x02014b50)throw Error('The zip file’s directory is damaged');const flags=u16(at+8),method=u16(at+10),packed=u32(at+20),size=u32(at+24),local=u32(at+42),raw=dec.decode(b.subarray(at+46,at+46+u16(at+28)));at+=46+u16(at+28)+u16(at+30)+u16(at+32);
  if(raw.endsWith('/'))continue;const path=safePath(raw);if(!wantedConf(path))continue;if(flags&1)throw Error(path+' is encrypted');total+=size;if(total>LIMIT.expanded)throw Error('The package expands to more than 256 MiB');
  const start=local+30+u16(local+26)+u16(local+28),data=b.subarray(start,start+packed);let text;
  if(method===0)text=dec.decode(data);else if(method===8){if(typeof DecompressionStream!=='function')throw Error('This browser can’t open zip packages; use a folder');text=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()}else throw Error(path+' uses a compression this page doesn’t read');
  files.push({path,text})}
 return files}
// Each file's app is the directory above default/ or local/.
function toApps(files,sizes){const apps=new Map();for(const f of files){const bits=f.path.split('/'),i=bits.findIndex(x=>/^(default|local)$/i.test(x));if(i<1)continue;const name=bits[i-1],rel=bits.slice(i).join('/');
 if(!apps.has(name))apps.set(name,{name,version:'',sizeMB:+(((sizes?.get(name))||0)/1048576).toFixed(2),files:{}});const a=apps.get(name);
 if(/^(default|local)\/app\.conf$/i.test(rel)){const m=/^\s*version\s*=\s*(.+)$/m.exec(f.text);if(m&&(!a.version||/^local/i.test(rel)))a.version=m[1].trim();continue}a.files[rel]=f.text}
 return [...apps.values()]}
async function readPackages(list){const out=[],errors=[];
 const folder=list.filter(f=>f.webkitRelativePath),packs=list.filter(f=>!f.webkitRelativePath);
 if(folder.length){const sizes=new Map();const files=[];for(const f of folder){const path=safePath(f.webkitRelativePath);const bits=path.split('/'),i=bits.findIndex(x=>/^(default|local)$/i.test(x));if(i>=1)sizes.set(bits[i-1],(sizes.get(bits[i-1])||0)+f.size);if(!wantedConf(path))continue;if(f.size>4*1024*1024){errors.push(path+' is over 4 MiB');continue}files.push({path,text:await f.text()})}out.push(...toApps(files,sizes))}
 for(const f of packs){try{if(f.size>LIMIT.packed)throw Error('over 64 MiB');const head=new Uint8Array(await f.slice(0,4).arrayBuffer());let files;
   if(head[0]===0x1f&&head[1]===0x8b)files=untar(await gunzip(f));else if(head[0]===0x50&&head[1]===0x4b)files=await unzipConf(f);else files=untar(new Uint8Array(await f.arrayBuffer()));
   const apps=toApps(files,null);for(const a of apps)a.sizeMB=+(f.size/1048576/Math.max(1,apps.length)).toFixed(2);if(!apps.length)throw Error('no default/ or local/ .conf files');out.push(...apps)}
  catch(e){errors.push(`${f.name}: ${e.message}`)}}
 return {apps:out,errors}}
TOOLS.dependencies={render(){
 const m=depsModel(),inv=inventory();if(!m.settings.length)return hero('Configuration dependency graph','Who gets which setting','No app settings to show: add deployment apps.')+importBox();
 const sel=m.settings.find(s=>s.id===DEP.selected)||m.conflicts[0]||m.settings[0];DEP.selected=sel.id;
 const q=DEP.filter.trim().toLowerCase(),list=m.settings.filter(s=>!q||s.id.toLowerCase().includes(q)||s.apps.some(a=>a.toLowerCase().includes(q)));
 const byConf=[...new Set(list.map(s=>s.conf))].sort(byteOrder).map(c=>`<optgroup label="${esc(c)}.conf">${list.filter(s=>s.conf===c).map(s=>`<option value="${esc(s.id)}"${s.id===sel.id?' selected':''}>[${esc(s.stanza)}] ${esc(s.key)}${s.clash.length?' — two apps disagree':''}</option>`).join('')}</optgroup>`).join('');
 const rows=sel.groups.map(g=>[esc(popLabel(g.pop)),num(g.agents),`<code>${esc(g.win.value)}</code>`,`${esc(g.win.app)} <small>(${g.win.layer})</small>`,g.lose.length?g.lose.map(e=>`${esc(e.app)} <small>(${e.layer}): <code>${esc(e.value)}</code></small>`).join('<br>'):'—']);
 const tiles=[tile('Settings',num(m.settings.length),`from ${plural(m.apps.length,'app')}`),tile('Where two apps disagree',num(m.conflicts.length),m.conflicts.length?`${num(new Set(m.conflicts.flatMap(s=>s.clash.flatMap(g=>g.pop.clients.map(c=>c.name)))).size)} agents affected`:'none'),tile('This setting reaches',`${num(sel.agents)} agents`,`in ${plural(sel.groups.length,'group')}`),tile('Apps no server class deploys',num(m.unused.length),m.unused.slice(0,3).join(', ')+(m.unused.length>3?'…':''))];
 return hero('Configuration dependency graph','Who gets which setting, and which value wins',`Each setting in ${esc(DEP.apps.size?'the apps you added and the sample':'the sample’s deployment apps')}, the server classes that deploy it and the agents that get it, with the value Splunk’s precedence gives each group.`)+importBox()+
 `<div class="fleet233Tiles">${tiles.join('')}</div>`+
 (m.conflicts.length?`<div class="sectionLabel">Where two apps disagree</div><div class="fleet233Findings">${m.conflicts.map(s=>`<article class="fleet233Finding warning"><b role="img" aria-label="Check">!</b><div><strong>${esc(s.id)}</strong><p>${esc(conflictText(s))} <button type="button" class="fleet233Link" data-fleet233-pick="${esc(s.id)}">Show it</button></p></div></article>`).join('')}</div>`:'')+
 `<div class="fleet233Fields fleet233Pick">${field('Find a setting or app','dep.filter',`<input type="search" value="${esc(DEP.filter)}" placeholder="defaultGroup, outputs_primary…">`)}${field('Setting','dep.selected',`<select>${byConf||'<option>No setting matches</option>'}</select>`)}</div>`+
 depGraph(sel,m)+`<div class="sectionLabel">The value each group gets</div>`+table(['Group of agents','Agents','Value','From','Also set by'],rows,`Effective value of ${sel.id}`)+
 `<details class="fleet233More"><summary>How the winner is chosen</summary><p>inputs.conf and outputs.conf are read in Splunk’s global context: system local, then every app’s local directory, then every app’s default directory, then system default. Among apps, the directory name that comes first in byte order wins: “A” before “Z”, “Z” before “a”, and numbers compared digit by digit (10 before 9): ${link('precedence','Configuration file precedence')}. Settings an agent has in its own system/local directory win over all of these and aren’t in the apps.</p></details>`},
 wire(root){root.querySelectorAll('[data-fleet233-pick]').forEach(b=>b.onclick=()=>{DEP.selected=b.dataset.fleet233Pick;DEP.filter='';rerender();content()?.querySelector('.fleet233Graph')?.scrollIntoView({block:'nearest'})});
  const s=root.querySelector('[data-fleet233-key="dep.selected"]');if(s)s.onchange=()=>{DEP.selected=s.value;rerender()};
  const f=root.querySelector('[data-fleet233-key="dep.filter"]');if(f)f.onchange=()=>{DEP.filter=f.value;rerender()};
  wireImportBox(root)}};
function importBox(){return `<div class="fleet233Import"><div><strong>Your own deployment apps</strong><p>Packages (.tgz, .tar.gz, .spl, .tar, .zip) or a deployment-apps folder. Only their default/ and local/ .conf files are read, here in the page.</p></div><div class="fleet233ImportActions"><label class="builderBtn fleet233File">Add app packages<input type="file" multiple accept=".tgz,.gz,.spl,.tar,.zip" data-fleet233-apps="packages"></label><label class="builderBtn fleet233File">Add a folder<input type="file" webkitdirectory multiple data-fleet233-apps="folder"></label>${DEP.apps.size?`<button type="button" class="builderBtn" data-fleet233-apps-clear>Remove ${plural(DEP.apps.size,'added app')}</button>`:''}</div>${DEP.note?`<p class="fleet233Note" role="status">${esc(DEP.note)}</p>`:''}</div>`}
function wireImportBox(root){root.querySelectorAll('[data-fleet233-apps]').forEach(input=>input.onchange=async()=>{const files=[...input.files];if(!files.length)return;DEP.note='Reading '+plural(files.length,'file')+'…';rerender();
  const {apps,errors}=await readPackages(files);for(const a of apps)DEP.apps.set(a.name,a);DEP.note=`Added ${plural(apps.length,'app')}${apps.length?': '+apps.map(a=>a.name).slice(0,6).join(', ')+(apps.length>6?'…':''):''}.${errors.length?' Not read: '+errors.join('; '):''}`;DEP.selected=null;rerender()});
 const c=root.querySelector('[data-fleet233-apps-clear]');if(c)c.onclick=()=>{DEP.apps.clear();DEP.note='';DEP.selected=null;rerender()}}
// ---- Upgrade compatibility planner ----
// Splunk's upgrade pages list, for each target release, the versions that can be upgraded straight to it; together
// they give these hops. A version that none of them lists has no supported path: upgrade it first to one they do.
const HOPS={'9.2':['9.3','9.4','10.0'],'9.3':['9.4','10.0'],'9.4':['10.0','10.2'],'10.0':['10.2','10.4','10.6'],'10.2':['10.4','10.6'],'10.4':['10.6']};
const HOP_SRC={'10.0':'paths100','10.2':'paths102','10.4':'paths104','10.6':'paths106','9.3':'paths100','9.4':'paths100'};
const minor=v=>{const m=/^(\d+)\.(\d+)/.exec(String(v));return m?`${+m[1]}.${+m[2]}`:''};
function hopPath(from,to){from=minor(from);to=minor(to);if(!from||!to)return null;if(cmpVersion(from,to)>=0)return [];
 // 9.2 straight to 10.2 is possible but not supported: Splunk's 10.2 page asks for 9.4 or later as the intermediate.
 const q=[[from]],seen=new Set([from]);while(q.length){const p=q.shift(),last=p.at(-1);for(const n of HOPS[last]||[]){if(seen.has(n)||cmpVersion(n,to)>0)continue;const next=[...p,n];if(n===to)return next.slice(1);seen.add(n);q.push(next)}}return null}
// Splunk's forwarder-to-indexer table: forwarders 9.0 to 9.3 can't send to 10.6 indexers; 9.4 and later send to every
// indexer from 9.4 to 10.6. Indexers before 9.4 aren't in the current table.
const IDX_COLUMNS=['9.4','10.0','10.2','10.4','10.6'];
function forwarderCanSend(fwd,idx){const f=minor(fwd),i=minor(idx);if(!IDX_COLUMNS.includes(i))return null;if(cmpVersion(f,'9.0')<0)return null;if(cmpVersion(f,'9.4')<0&&i==='10.6')return false;return true}
const UP=F.upgrade={target:'10.0',ds:{t1:'9.4.2',a:'9.4.2',b:'9.3.2'},sh:'9.4.2',idx:'9.4.2',shCluster:true,idxCluster:true,dsForwardsToIndexers:true,
 appRange:{TA_windows_security:['9.0','10.2'],TA_linux_auditd:['9.0','10.0'],TA_api_collection:['9.1','9.4'],TA_network_syslog:['9.0','10.6'],hec_delivery:['9.0','10.6'],outputs_primary:['9.0','10.6'],release_candidate:['9.2','10.6'],regional_network:['9.0','10.6']}};
function serverclassText(inv=inventory()){if(inv.serverclassConf)return inv.serverclassConf;const out=['[global]',''];for(const c of inv.classes){out.push(`[serverClass:${c.name}]`);for(const [k,v] of Object.entries(c.conf||{}))out.push(`${k} = ${v}`);out.push('');
 for(const a of c.apps){out.push(`[serverClass:${c.name}:app:${a}]`);for(const [k,v] of Object.entries(c.appConf?.[a]||{}))out.push(`${k} = ${v}`);out.push('')}}return out.join('\n')}
// App-level stanzas with blacklist entries and no whitelist or filterType: from 9.4.3 the app level's implicit filterType
// is whitelist, so such a stanza matches no agents.
// So does one with machineTypesFilter and neither a whitelist nor filterType = blacklist.
function blacklistOnlyApps(text){let doc;try{doc=parseConf(text,'serverclass','serverclass.conf')}catch{return []}const by=new Map();for(const s of doc.settings){if(!/^serverClass:[^:]+:app:/.test(s.stanza.name))continue;if(!by.has(s.stanza.name))by.set(s.stanza.name,new Map());by.get(s.stanza.name).set(s.key.toLowerCase(),s.value.trim().toLowerCase())}
 const bad=[];for(const st of doc.stanzas){if(!/^serverClass:[^:]+:app:/.test(st.name))continue;const keys=by.get(st.name)||new Map(),list=[...keys.keys()];
  const narrows=list.some(k=>k.startsWith('blacklist.'))||keys.has('machinetypesfilter'),opens=list.some(k=>k.startsWith('whitelist.'))||keys.get('filtertype')==='blacklist';
  if(narrows&&!opens){const [,cls,app]=/^serverClass:([^:]+):app:(.+)$/.exec(st.name);bad.push({stanza:st.name,cls,app,why:keys.has('machinetypesfilter')&&!list.some(k=>k.startsWith('blacklist.'))?'machineTypesFilter':'blacklist'})}}return bad}
function upgradeModel(){
 const inv=inventory(),T=UP.target,out=[],add=(severity,title,text,src)=>out.push({severity,title,text,src});
 const fwd=new Map();for(const c of inv.clients){const k=c.version||'unknown';fwd.set(k,(fwd.get(k)||0)+1)}
 const dsList=inv.servers.filter(s=>s.tier).map(s=>({...s,version:UP.ds[s.id]||s.version}));
 const tiers=[...dsList.map(s=>({tier:'Deployment Server',name:s.name,version:s.version,count:1})),{tier:'Search heads',name:UP.shCluster?'Search head cluster':'Search heads',version:UP.sh,count:null},{tier:'Indexers',name:UP.idxCluster?'Indexer cluster':'Indexers',version:UP.idx,count:null},
  ...[...fwd.entries()].sort((a,b)=>cmpVersion(a[0],b[0])).flatMap(([v,n])=>{const hf=inv.clients.filter(c=>c.version===v&&c.type==='Heavy Forwarder').length;return [hf?{tier:'Heavy forwarders',name:`Heavy forwarders on ${v}`,version:v,count:hf}:null,n-hf?{tier:'Universal forwarders',name:`Universal forwarders on ${v}`,version:v,count:n-hf}:null].filter(Boolean)})];
 for(const t of tiers){if(!t.version){t.path=null;t.status='unknown';continue}const p=hopPath(t.version,T);t.path=p;t.status=p==null?'none':p.length===0?'there':'ok'}
 const unknown=tiers.filter(t=>t.status==='unknown');if(unknown.length)add('info','Versions to enter',`${unknown.map(t=>t.name).join(', ')}: the inventory doesn\u2019t say which Splunk version ${unknown.length===1?'it runs':'they run'}. Enter it above to plan ${unknown.length===1?'it':'them'}.`)
 // Paths
 const stuck=tiers.filter(t=>t.status==='none');for(const t of stuck)add('critical',`No supported path from ${t.version}`,`${t.count==null||t.tier==='Deployment Server'?t.name+' runs':num(t.count)+' '+t.tier.toLowerCase()+' run'} ${t.version}, which no Splunk upgrade table lists as a starting point for ${T}. Upgrade ${t.count===1||t.count==null?'it':'them'} first to 9.2 or later by that version’s own upgrade guide.`,HOP_SRC[T]||'paths100');
 const two=tiers.filter(t=>t.path&&t.path.length>1);if(two.length)add('warning','Two or more hops',`${two.map(t=>`${t.name}: ${[t.version,...t.path].join(' → ')}`).join('; ')}. Each hop is a full upgrade.`,HOP_SRC[T]||'paths100');
 // Forwarders and indexers, at the target
 const blank=[...fwd.entries()].filter(([v])=>forwarderCanSend(v,T)===false);if(blank.length&&cmpVersion(minor(T),minor(UP.idx))>=0){const n=blank.reduce((s,[,c])=>s+c,0);add('critical',`${num(n)} forwarders can’t send to ${T} indexers`,`Splunk’s compatibility table has no entry for forwarders ${blank.map(([v])=>v).join(', ')} sending to ${T}.x indexers: upgrade those forwarders to 9.4 or later before the indexers.`,'compat')}
 if(!IDX_COLUMNS.includes(minor(T)))add('warning',`${T} isn’t in the compatibility table`,`Splunk’s forwarder-to-indexer table covers indexers ${IDX_COLUMNS.join(', ')}.`,'compat');
 const newer=[...fwd.entries()].filter(([v])=>cmpVersion(v,T)>0);if(newer.length)add('warning','Forwarders newer than the indexers',`${num(newer.reduce((s,[,c])=>s+c,0))} forwarders are newer than ${T}. Splunk’s best practice is indexers at the same version as their forwarders or later.`,'compat');
 const old=[...fwd.entries()].filter(([v])=>cmpVersion(v,'9.4')<0);if(old.length)add('info','Older forwarders and ciphers',`${num(old.reduce((s,[,c])=>s+c,0))} forwarders run before 9.4. Splunk warns that older forwarders might not be compatible after an upgrade because of security cipher changes: check them against the table.`,'paths100');
 // Deployment Servers
 for(const s of dsList){if(!s.version)continue;const mine=inv.clients.filter(c=>c.ds===s.id),ahead=mine.filter(c=>cmpVersion(c.version,s.version)>0).length;if(ahead)add('warning',`${s.name} is behind ${plural(ahead,'agent')}`,`${s.name} runs ${s.version}; ${num(ahead)} of its agents run later versions. Splunk’s distributed upgrade starts with the Deployment Server, so it stays ahead of the forwarders.`,'distributed')}
 const t1=dsList.find(s=>s.tier===1);if(t1?.version)for(const s of dsList.filter(x=>x.tier===2&&x.version))if(cmpVersion(s.version,t1.version)>0)add('warning',`${s.name} is ahead of the Tier 1 server`,`${s.name} (${s.version}) is a client of ${t1.name} (${t1.version}).`,'distributed');
 if(cmpVersion(T,'9.2')>=0&&dsList.some(s=>s.version&&cmpVersion(s.version,'9.2')<0))add('info','The Deployment Server changes at 9.2','A Deployment Server upgraded across 9.2 gets the SplunkDeploymentServerConfig app and the client_events directory; leave both as Splunk makes them.','pre92');
 if(UP.dsForwardsToIndexers&&cmpVersion(T,'9.2')>=0){if(cmpVersion(UP.idx,'9.2')<0)add('critical','Indexers need the _ds indexes',`Deployment Servers on 9.2 or later forward _dsphonehome, _dsclient and _dsappevent; indexers on ${UP.idx} don’t have them. Add the three to indexes.conf on the indexers${UP.idxCluster?' (repFactor = auto on a cluster)':''}, or upgrade the indexers first.`,'pre92');
  add('info','Keep the Deployment Server’s data visible','When a 9.2 or later Deployment Server forwards its internal logs to indexers, Splunk’s fix for missing agent data is [indexAndForward] index = true and selectiveIndexing = true in its outputs.conf.','pre92')}
 // serverclass.conf: the 9.4.3 change in the app level's filterType
 const crossing=dsList.filter(s=>(!s.version||cmpVersion(s.version,'9.4.3')<0)&&cmpVersion(T,'9.4.3')>=0);const bad=crossing.length?blacklistOnlyApps(serverclassText(inv)):[];
 for(const b of bad){const n=inv.clients.filter(c=>c.classes.includes(b.cls)).length;add('critical',`${b.app} would reach no agents after the upgrade`,`[${b.stanza}] has ${b.why==='blacklist'?'blacklist entries':'machineTypesFilter'} and no whitelist or filterType = blacklist. From 9.4.3 an app-level stanza’s implicit filterType is whitelist, so it matches no agents, and Splunk removes the app from the agents that had it (seen on Splunk 10.6.1.1): the ${num(n)} agents of ${b.cls} would lose ${b.app}. Add filterType = blacklist or a whitelist before upgrading ${crossing.map(s=>s.name).join(', ')}.`,'serverclass')}
 // Apps
 for(const a of inv.apps){const r=UP.appRange[a.name];if(!r)continue;const users=inv.clients.filter(c=>c.apps.includes(a.name));if(!users.length)continue;if(cmpVersion(minor(T),r[1])>0)add('critical',`${a.name} isn’t declared for ${T}`,`${a.name} ${a.version} declares Splunk ${r[0]} to ${r[1]}; ${num(users.length)} agents use it. Get a release of it for ${T} first, or keep those agents behind.`)}
 if(!out.some(f=>f.severity==='critical'||f.severity==='warning'))add('controlled','Nothing blocks '+T,`Every tier has a supported path to ${T} and the forwarders can send to ${T} indexers.`,HOP_SRC[T]||'paths100');
 const order=[{step:'Deployment Servers',what:`Tier 1, then the regional servers: upgrade without restarting. (Optional: disable deployment first so nothing invalid goes out.)`},{step:'Search heads',what:UP.shCluster?'By Splunk’s search head cluster procedure.':'One at a time; restart and test each.'},{step:'Indexers',what:UP.idxCluster?'By Splunk’s indexer cluster procedure.':'One at a time; each can restart straight away.'},{step:'Restart the Deployment Servers',what:'After the last indexer.'},{step:'Forwarders',what:'Heavy forwarders, then universal forwarders, in cohorts: check each against the compatibility table first.'}];
 return {T,tiers,findings:out.sort((a,b)=>['critical','warning','info','controlled'].indexOf(a.severity)-['critical','warning','info','controlled'].indexOf(b.severity)),order,fwd:[...fwd.entries()].sort((a,b)=>cmpVersion(a[0],b[0]))}}
TOOLS.upgrades={render(){
 const m=upgradeModel(),inv=inventory(),stateOf=t=>t.status==='unknown'?'Enter its version':t.status==='there'?'Already there':t.status==='none'?'<b class="fleet233Bad">No supported path</b>':[t.version,...t.path].join(' → ');
 const rows=m.tiers.map(t=>[esc(t.tier),esc(t.name),t.count==null?'—':num(t.count),esc(t.version),stateOf(t)]);
 const matrix=table(['Forwarders',...IDX_COLUMNS.map(c=>c+'.x indexers')],m.fwd.map(([v,n])=>[`${esc(v)} <small>(${num(n)})</small>`,...IDX_COLUMNS.map(c=>{const ok=forwarderCanSend(v,c);return ok==null?'—':ok?'<span class="fleet233Ok">✓ events, HTTP out, metrics</span>':'<b class="fleet233Bad">✕ not supported</b>'})]),'Forwarder to indexer compatibility');
 const apps=table(['App','Version','Splunk from','Splunk to','Agents'],inv.apps.map(a=>{const r=UP.appRange[a.name]||['',''];return [esc(a.name),esc(a.version||''),`<label class="fleet233Inline"><input aria-label="${esc(a.name)}: Splunk from" value="${esc(r[0])}" size="5" data-fleet233-key="up.app.${esc(a.name)}.0"></label>`,`<label class="fleet233Inline"><input aria-label="${esc(a.name)}: Splunk to" value="${esc(r[1])}" size="5" data-fleet233-key="up.app.${esc(a.name)}.1"></label>`,num(inv.clients.filter(c=>c.apps.includes(a.name)).length)]}),'Apps and the Splunk versions they declare');
 const ver=(label,key,v)=>field(label,key,`<input value="${esc(v)}" size="8" pattern="\\d+\\.\\d+(\\.\\d+)*">`);
 return hero('Upgrade compatibility planner',`From today’s versions to Splunk ${esc(m.T)}`,'Each tier’s supported path, the forwarders against the indexers, the Deployment Servers against their agents, serverclass.conf against the 9.4.3 change, and each app against the Splunk versions it declares.',`<button type="button" class="builderBtn primary" data-fleet233-dl="upgrade">Plan (JSON)</button>`)+
 `<div class="fleet233Fields">${field('Target','up.target',selectInput(UP.target,[['9.4','9.4.x'],['10.0','10.0.x'],['10.2','10.2.x'],['10.4','10.4.x'],['10.6','10.6.x']]))}${inv.servers.filter(s=>s.tier).map(s=>ver(s.name,`up.ds.${s.id}`,UP.ds[s.id]||s.version)).join('')}${ver('Search heads','up.sh',UP.sh)}${ver('Indexers','up.idx',UP.idx)}
  <fieldset class="fleet233Field fleet233Wide"><legend>Topology</legend><div class="fleet233Checks"><label class="fleet233Check"><input type="checkbox" data-fleet233-key="up.idxCluster"${UP.idxCluster?' checked':''}><span>Indexers are a cluster</span></label><label class="fleet233Check"><input type="checkbox" data-fleet233-key="up.shCluster"${UP.shCluster?' checked':''}><span>Search heads are a cluster</span></label><label class="fleet233Check"><input type="checkbox" data-fleet233-key="up.dsForwardsToIndexers"${UP.dsForwardsToIndexers?' checked':''}><span>Deployment Servers forward their logs to the indexers</span></label></div></fieldset></div>`+
 `<div class="sectionLabel">What stands in the way</div><div class="fleet233Findings">${m.findings.map(finding).join('')}</div>`+
 `<div class="sectionLabel">In this order</div><ol class="fleet233Steps">${m.order.map(o=>`<li><strong>${esc(o.step)}</strong> ${esc(o.what)}</li>`).join('')}</ol><p class="fleet233Note">Splunk’s order for a distributed environment: ${link('distributed','How to upgrade a distributed Splunk Enterprise environment')}.</p>`+
 `<div class="sectionLabel">Each tier’s path</div>`+table(['Tier','Which','How many','Today','Path to '+esc(m.T)],rows,'Upgrade path for each tier')+
 `<div class="sectionLabel">Forwarders against indexers</div>${matrix}<p class="fleet233Note">From Splunk’s table: ${link('compat','Compatibility between forwarders and Splunk Enterprise indexers')}. A dash: the table has no column for it.</p>`+
 `<div class="sectionLabel">Apps</div>${apps}<p class="fleet233Note">The sample’s apps are this explorer’s own: their ranges are examples. Enter what each of your apps’ release notes declare.</p>`},
 wire(root){root.querySelectorAll('[data-fleet233-key^="up."]').forEach(x=>x.onchange=()=>{const k=x.dataset.fleet233Key.split('.');let v=x.type==='checkbox'?x.checked:x.value.trim();
  if(typeof v==='string'&&k[1]!=='target'&&!/^\d+\.\d+(\.\d+)*$/.test(v)){x.setAttribute('aria-invalid','true');return}
  if(k[1]==='ds')UP.ds[k[2]]=v;else if(k[1]==='app'){const name=k.slice(2,-1).join('.');UP.appRange[name]=UP.appRange[name]||['',''];UP.appRange[name][+k.at(-1)]=v}else UP[k[1]]=v;rerender()});
  root.querySelector('[data-fleet233-dl="upgrade"]')?.addEventListener('click',()=>downloadText(`upgrade-plan-${UP.target}.json`,JSON.stringify(upgradeJson(),null,2),'application/json'))}};
function upgradeJson(m=upgradeModel()){return {schema:'splunk-pipeline-explorer/fleet-upgrade-plan',version:1,generatedAt:new Date().toISOString(),target:m.T,order:m.order,tiers:m.tiers.map(t=>({tier:t.tier,name:t.name,count:t.count,version:t.version,path:t.path,supported:t.status!=='none'})),findings:m.findings,forwarderVersions:Object.fromEntries(m.fwd),sources:{paths:SRC[HOP_SRC[m.T]||'paths100'],compatibility:SRC.compat,order:SRC.distributed,serverclass:SRC.serverclass,pre92:SRC.pre92}}}
// ---- Release approval evidence workflow ----
// One record for one release: the change, the checks the other tools can make, the canary's evidence, the approver's
// decision and the rollback decision. It downloads as JSON and Markdown with a SHA-256 of its content, and a saved
// record loads back with that digest checked. It is kept in this tab only.
const AP=F.approval={ref:'',requester:'',approver:'',role:'',decision:'',conditions:'',decidedAt:'',canaryOnNew:'',canaryFailed:'',canaryAgeMin:'',canaryNotes:'',rollbackPackage:'',rollbackOwner:'',rollbackDecision:'not needed',loaded:null,digest:''};
// The canary's evidence as an imported inventory reports it: each canary agent's app checksum and install result.
function canaryEvidence(){const inv=inventory(),rel=inv.apps.find(a=>a.name===RO.app);if(inv.source!=='import'||!rel?.checksum)return null;const ro=rolloutModel(),i=RO.waves.findIndex(w=>w.canary),list=i<0?[]:[...ro.cohorts[i].values()].flat();if(!list.length)return null;
 let onNew=0,failed=0,oldest=0;for(const c of list){const s=c.appState?.[rel.name];if(s&&s.checksum===rel.checksum&&/^ok$/i.test(s.result||'ok'))onNew++;if(s&&s.result&&!/^ok$/i.test(s.result))failed++;oldest=Math.max(oldest,c.age||0)}
 return {n:list.length,onNew,failed,oldestMin:Math.ceil(oldest/60),checksum:rel.checksum}}
// Checked on Splunk 10.6.1.1: the data.* fields of _dsappevent are extracted at search time.
const appEventSearch=app=>`index=_dsappevent data.appName="${app}" data.action=Install\n| stats latest(data.result) AS result latest(data.checksum) AS checksum latest(_time) AS when BY data.clientId`;
function approvalChecks(){
 const md=multiDeploymentModel(),ro=rolloutModel(),dm=depsModel(),inv=inventory(),rel=inv.apps.find(a=>a.name===RO.app),canary=ro.gates[0],checks=[],newSum=inv.source==='import'&&rel?.checksum?rel.checksum:md.baseline.checksum;
 const add=(id,ok,title,text,warnOnly=false)=>checks.push({id,state:ok?'pass':warnOnly?'warn':'fail',title,text});
 add('ref',/\S/.test(AP.ref),'A change reference',AP.ref?`Change ${AP.ref}.`:'Enter the change record’s reference.');
 add('parity',md.regions.every(r=>r.inSync),'Every region matches the Tier 1 manifest',md.regions.filter(r=>!r.inSync).map(r=>`${r.name}: ${r.differences.join(', ')} differ`).join('; ')||`Version ${md.baseline.version}, checksum ${md.baseline.checksum} everywhere.`);
 add('authority',!md.c.competing,'One authority for each agent',md.c.competing?'An agent population can reach more than one Deployment Server.':'No competing authority.');
 add('approvalGate',md.c.approval,'Promotion needs a named approval',md.c.approval?'Approval is required before promotion.':'Promotion approval is turned off in the overview.');
 const hits=dm.conflicts.filter(s=>s.entries.some(e=>e.app===RO.app));add('deps',!hits.length,`${RO.app}’s settings take effect`,hits.length?hits.map(s=>{const g=s.clash[0];return `${s.id}: ${g.win.app} wins over ${RO.app} on ${num(s.clashAgents)} agents`}).join('; ')+'. The canary can’t test a setting that loses.':`None of ${RO.app}’s settings is overridden by another app.`);
 add('plan',!!canary&&RO.waves[0]?.canary&&ro.problems.every(p=>!/window/.test(p.title)),'A canary first, and every push in its window',canary?`${num(canary.n)} canary agents first; ${ro.problems.filter(p=>/window/.test(p.title)).map(p=>p.title).join('; ')||'every push fits its window'}.`:'The rollout has no canary.');
 const n=canary?.n||0,onNew=Number(AP.canaryOnNew),failed=Number(AP.canaryFailed),age=Number(AP.canaryAgeMin);
 add('canaryAll',AP.canaryOnNew!==''&&onNew===n&&n>0,'Every canary agent reports the new checksum',AP.canaryOnNew===''?`Enter how many of the ${num(n)} canary agents report ${newSum}.`:`${num(onNew)} of ${num(n)}.`);
 add('canaryFail',AP.canaryFailed!==''&&failed<=Math.floor(RO.gate/100*n+1e-9),'Canary failures within the gate',AP.canaryFailed===''?`Enter the canary’s failed installs: the gate allows ${num(Math.floor(RO.gate/100*n+1e-9))}.`:`${num(failed)} failed; the gate allows ${num(Math.floor(RO.gate/100*n+1e-9))}.`);
 const P=ro.P('a');add('canaryFresh',AP.canaryAgeMin!==''&&age*60<=3*P,'The canary’s evidence is fresh',AP.canaryAgeMin===''?`Enter the oldest canary phone-home, in minutes: within ${minutes(3*P/60)} (three phone homes).`:`Oldest phone home ${num(age)} min ago.`);
 add('people',!!AP.approver&&!!AP.requester&&AP.approver.trim().toLowerCase()!==AP.requester.trim().toLowerCase(),'Two people',!AP.requester||!AP.approver?'Enter who asks and who approves.':AP.approver.trim().toLowerCase()===AP.requester.trim().toLowerCase()?'The approver is the requester.':`${AP.requester} asks; ${AP.approver} approves.`);
 add('rollback',!!AP.rollbackPackage&&!!AP.rollbackOwner,'A rollback package and its owner',AP.rollbackPackage&&AP.rollbackOwner?`${AP.rollbackPackage}, owned by ${AP.rollbackOwner}; the gate stops above ${num(RO.gate,1)}% failing.`:'Enter the package kept for rollback and who decides on it.');
 add('release',!!rel,'The release is in the inventory',rel?`${rel.name} ${rel.version}, ${num(rel.sizeMB,1)} MB.`:'Choose the release on the Rollout page.');
 return {checks,blocked:checks.filter(c=>c.state==='fail'),md,rel,canary,newSum}}
function approvalRecord(){const {checks,md,rel,canary}=approvalChecks();return {schema:'splunk-pipeline-explorer/release-approval-evidence',version:1,
 change:{reference:AP.ref,requester:AP.requester,release:rel?{app:rel.name,version:rel.version}:null,approvedManifest:{version:md.baseline.version,checksum:md.baseline.checksum}},
 checks:checks.map(c=>({id:c.id,state:c.state,title:c.title,evidence:c.text})),
 canary:{agents:canary?.n||0,reportingNewChecksum:AP.canaryOnNew===''?null:Number(AP.canaryOnNew),failedInstalls:AP.canaryFailed===''?null:Number(AP.canaryFailed),oldestPhoneHomeMinutes:AP.canaryAgeMin===''?null:Number(AP.canaryAgeMin),notes:AP.canaryNotes},
 approval:{approver:AP.approver,role:AP.role,decision:AP.decision||'pending',conditions:AP.conditions,decidedAt:AP.decidedAt||null},
 rollback:{package:AP.rollbackPackage,owner:AP.rollbackOwner,triggerAbovePercentFailing:RO.gate,decision:AP.rollbackDecision},
 inventory:{source:inventory().source,agents:inventory().clients.length}}}
// The digest is taken over the record written with its keys in a fixed order, so the same record always gives it.
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v===undefined?null:v)}
async function sha256(text){if(!globalThis.crypto?.subtle)return '';const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function approvalMarkdown(rec,digest){const L=[`# Release approval: ${rec.change.release?.app||''} ${rec.change.release?.version||''}`,'',`- Change: ${rec.change.reference||'(none)'}`,`- Requested by: ${rec.change.requester||'(none)'}`,`- Manifest: ${rec.change.approvedManifest.version} · ${rec.change.approvedManifest.checksum}`,`- Decision: ${rec.approval.decision}${rec.approval.approver?` by ${rec.approval.approver}${rec.approval.role?` (${rec.approval.role})`:''}`:''}${rec.approval.decidedAt?` at ${rec.approval.decidedAt}`:''}`,rec.approval.conditions?`- Conditions: ${rec.approval.conditions}`:'','','## Checks','',...rec.checks.map(c=>`- ${c.state==='pass'?'✓':c.state==='warn'?'!':'✕'} ${c.title}: ${c.evidence}`),'','## Canary','',`- Agents: ${rec.canary.agents}`,`- Reporting the new checksum: ${rec.canary.reportingNewChecksum??'(not entered)'}`,`- Failed installs: ${rec.canary.failedInstalls??'(not entered)'}`,`- Oldest phone home: ${rec.canary.oldestPhoneHomeMinutes??'(not entered)'} min`,rec.canary.notes?`- Notes: ${rec.canary.notes}`:'','','## Rollback','',`- Package: ${rec.rollback.package||'(none)'}`,`- Owner: ${rec.rollback.owner||'(none)'}`,`- Trigger: more than ${rec.rollback.triggerAbovePercentFailing}% of a wave failing`,`- Decision: ${rec.rollback.decision}`,'',`SHA-256 of the record: ${digest||'(not available in this browser)'}`,''];return L.filter((l,i,a)=>l!==''||a[i-1]!=='').join('\n')}
TOOLS.approval={render(){
 const {checks,blocked,md,rel,canary,newSum}=approvalChecks(),decided=AP.decision==='approved'||AP.decision==='rejected',ev=canaryEvidence();
 const t=(label,key,value,type='text',extra='')=>field(label,'ap.'+key,`<input type="${type}" value="${esc(value)}"${extra}>`);
 const list=checks.map(c=>`<li class="${c.state}"><b role="img" aria-label="${c.state==='pass'?'Passes':c.state==='warn'?'Check':'Fails'}">${c.state==='pass'?'✓':c.state==='warn'?'!':'✕'}</b><div><strong>${esc(c.title)}</strong><p>${esc(c.text)}</p></div></li>`).join('');
 return hero('Release approval evidence','One record for one release',`The change, the checks this explorer can make, the canary’s evidence, the decision and the rollback plan for ${esc(rel?`${rel.name} ${rel.version}`:'the release')}, with a SHA-256 of the record when it downloads. It stays in this tab until you download it.`,
  `<label class="builderBtn fleet233File">Load a record<input type="file" accept=".json,application/json" data-fleet233-ap-load></label><button type="button" class="builderBtn" data-fleet233-ap-dl="md">Markdown</button><button type="button" class="builderBtn primary" data-fleet233-ap-dl="json">Record (JSON)</button>`)+
 (AP.loaded?`<p class="fleet233Note" role="status">${esc(AP.loaded)}</p>`:'')+
 `<div class="sectionLabel">1 · The change</div><div class="fleet233Fields">${t('Change reference','ref',AP.ref,'text',' placeholder="CHG-…" autocomplete="off"')}${t('Requested by','requester',AP.requester,'text',' autocomplete="off"')}<div class="fleet233Field"><span class="fleet233Label">Release</span><p class="fleet233Value">${esc(rel?`${rel.name} ${rel.version}`:'—')}</p></div><div class="fleet233Field"><span class="fleet233Label">Approved manifest</span><p class="fleet233Value">${esc(md.baseline.version)} · <code>${esc(md.baseline.checksum)}</code></p></div></div>`+
 `<div class="sectionLabel">2 · The canary’s evidence</div><div class="fleet233Fields">${t(`Canary agents on ${esc(newSum)} (of ${num(canary?.n||0)})`,'canaryOnNew',AP.canaryOnNew,'number',' min="0" step="1"')}${t('Failed installs','canaryFailed',AP.canaryFailed,'number',' min="0" step="1"')}${t('Oldest phone home (min ago)','canaryAgeMin',AP.canaryAgeMin,'number',' min="0" step="1"')}${t('Notes','canaryNotes',AP.canaryNotes)}</div><div class="fleet233Import"><div><strong>Where the evidence comes from</strong><p>The Deployment Server records each agent’s download and install of each app, with its checksum and result, in the _dsappevent index (Splunk 9.2 and later): this search lists them for the release. An imported inventory carries the same as applications.${esc(rel?.name||'app')}.checksum and .result.</p><pre class="fleet233Code"><code>${esc(appEventSearch(rel?.name||'app'))}</code></pre></div><div class="fleet233ImportActions">${ev?`<button type="button" class="builderBtn primary" data-fleet233-ap-fill>Fill from the inventory</button>`:''}<button type="button" class="builderBtn" data-fleet233-ap-copy>Copy the search</button></div>${ev?`<p class="fleet233Note">In the inventory: ${num(ev.onNew)} of ${num(ev.n)} canary agents on ${esc(ev.checksum)}, ${plural(ev.failed,'failed install')}, the oldest phone home ${num(ev.oldestMin)} min ago.</p>`:''}</div>`+
 `<div class="sectionLabel">3 · Rollback</div><div class="fleet233Fields">${t('Package kept for rollback','rollbackPackage',AP.rollbackPackage,'text',' placeholder="release_candidate 2026.09.20.2"')}${t('Decides on rollback','rollbackOwner',AP.rollbackOwner)}${field('Rollback decision','ap.rollbackDecision',selectInput(AP.rollbackDecision,[['not needed','Not needed'],['standing by','Standing by'],['rolled back','Rolled back']]))}<div class="fleet233Field"><span class="fleet233Label">Trigger</span><p class="fleet233Value">More than ${num(RO.gate,1)}% of a wave failing (the Rollout page’s gate)</p></div></div>`+
 `<div class="sectionLabel">4 · Checks</div><ul class="fleet233Checklist">${list}</ul>`+
 `<div class="sectionLabel">5 · Decision</div><div class="fleet233Fields">${t('Approver','approver',AP.approver,'text',' autocomplete="off"')}${t('Role','role',AP.role)}${t('Conditions','conditions',AP.conditions)}</div>
  <div class="fleet233Decision"><button type="button" class="builderBtn primary" data-fleet233-ap-decide="approved"${blocked.length?' disabled aria-describedby="fleet233-blocked"':''}>Approve</button><button type="button" class="builderBtn" data-fleet233-ap-decide="rejected">Reject</button>${decided?`<button type="button" class="builderBtn" data-fleet233-ap-decide="">Clear the decision</button>`:''}
  <p id="fleet233-blocked" class="fleet233Note" role="status">${decided?`${AP.decision==='approved'?'Approved':'Rejected'} by ${esc(AP.approver||'—')} at ${esc(AP.decidedAt)}.`:blocked.length?`Approval waits on ${plural(blocked.length,'check')}: ${blocked.map(c=>esc(c.title)).join('; ')}.`:'Every check passes.'}</p></div>`+
 (AP.digest?`<p class="fleet233Note">SHA-256 of the last download: <code class="fleet233Digest">${esc(AP.digest)}</code></p>`:'')},
 wire(root){
  root.querySelectorAll('[data-fleet233-key^="ap."]').forEach(x=>x.onchange=()=>{const k=x.dataset.fleet233Key.slice(3);if(x.type==='number'&&x.value!==''&&(!isFinite(+x.value)||+x.value<0)){x.setAttribute('aria-invalid','true');return}AP[k]=x.value;if(AP.decision&&k!=='rollbackDecision'){AP.decision='';AP.decidedAt=''}rerender()});
  root.querySelector('[data-fleet233-ap-fill]')?.addEventListener('click',()=>{const ev=canaryEvidence();if(!ev)return;Object.assign(AP,{canaryOnNew:String(ev.onNew),canaryFailed:String(ev.failed),canaryAgeMin:String(ev.oldestMin),canaryNotes:`From ${inventory().label}: ${ev.checksum}`});AP.decision='';AP.decidedAt='';rerender()});
  root.querySelector('[data-fleet233-ap-copy]')?.addEventListener('click',async e=>{const b=e.currentTarget;try{await navigator.clipboard.writeText(appEventSearch(RO.app));b.textContent='Copied'}catch{b.textContent='Select the search to copy it'}});
  root.querySelectorAll('[data-fleet233-ap-decide]').forEach(b=>b.onclick=()=>{const d=b.dataset.fleet233ApDecide;if(d&&!AP.approver){AP.loaded='Enter the approver first.';rerender();return}AP.decision=d;AP.decidedAt=d?new Date().toISOString().replace(/\.\d+Z$/,'Z'):'';AP.loaded='';rerender()});
  root.querySelectorAll('[data-fleet233-ap-dl]').forEach(b=>b.onclick=async()=>{const rec=approvalRecord(),digest=await sha256(canonical(rec));AP.digest=digest;const name=`release-approval-${(AP.ref||'draft').replace(/[^\w.-]+/g,'_')}`;
   if(b.dataset.fleet233ApDl==='json')downloadText(name+'.json',JSON.stringify({...rec,sha256:digest},null,2),'application/json');else downloadText(name+'.md',approvalMarkdown(rec,digest),'text/markdown');rerender()});
  const load=root.querySelector('[data-fleet233-ap-load]');if(load)load.onchange=async()=>{const f=load.files[0];if(!f)return;try{if(f.size>1048576)throw Error('it is over 1 MiB');const doc=JSON.parse(await f.text());if(doc.schema!=='splunk-pipeline-explorer/release-approval-evidence')throw Error('it isn’t a release approval record');
    const {sha256:claimed,...rec}=doc,digest=await sha256(canonical(rec)),same=claimed&&digest===claimed;
    Object.assign(AP,{ref:rec.change?.reference||'',requester:rec.change?.requester||'',approver:rec.approval?.approver||'',role:rec.approval?.role||'',decision:rec.approval?.decision==='pending'?'':rec.approval?.decision||'',conditions:rec.approval?.conditions||'',decidedAt:rec.approval?.decidedAt||'',
     canaryOnNew:rec.canary?.reportingNewChecksum??'',canaryFailed:rec.canary?.failedInstalls??'',canaryAgeMin:rec.canary?.oldestPhoneHomeMinutes??'',canaryNotes:rec.canary?.notes||'',rollbackPackage:rec.rollback?.package||'',rollbackOwner:rec.rollback?.owner||'',rollbackDecision:rec.rollback?.decision||'not needed'});
    for(const k of ['canaryOnNew','canaryFailed','canaryAgeMin'])AP[k]=AP[k]===''?'':String(AP[k]);
    AP.loaded=`Loaded ${f.name}: ${!digest?'this browser can’t check its SHA-256':same?'its SHA-256 matches its content':'its SHA-256 doesn’t match its content: it was changed after it was saved'}.`}
   catch(e){AP.loaded=`${f.name} wasn’t loaded: ${e.message}.`}rerender()}}};
// ---- The Multi-DS model's download, the evidence pack and the architecture report carry the tools' results ----
const multiDsJsonBase233=multiDeploymentServerJson;
multiDeploymentServerJson=function(){const doc=JSON.parse(multiDsJsonBase233());doc.version=4;
 try{const inv=inventory(),cap=capacityModel(),ro=rolloutModel(),dm=depsModel(),up=upgradeModel(),ap=approvalChecks();
  doc.fleetTools={inventory:{source:inv.source,label:inv.label,agents:inv.clients.length,serverClasses:inv.classes.length,apps:inv.apps.length,notPhoningHome:inv.clients.filter(stale).length},
   capacity:{phoneHomeSeconds:cap.P,servers:cap.servers,host:cap.os,perServer:cap.rows.map(r=>({server:r.name,agents:r.clients,phoneHomesPerSecond:+r.phoneHomesPerSec.toFixed(2),pushMinutes:+r.pushMin.toFixed(2)})),findings:cap.findings.map(f=>({severity:f.severity,title:f.title}))},
   rollout:{release:ro.app?.name,cohorts:ro.gates.map(g=>({name:g.name,agents:g.n,gateUtc:clock(g.gateAt)})),plannedMinutes:+(ro.end-ro.start).toFixed(1),expectedAgentsExposedIfBad:Math.round(ro.expected)},
   configurationConflicts:dm.conflicts.map(s=>({setting:s.id,agents:s.clashAgents,wins:s.clash[0].win.app,loses:[...new Set(s.clash.flatMap(g=>g.lose.map(e=>e.app)))]})),
   upgrade:{target:up.T,blockers:up.findings.filter(f=>f.severity==='critical').map(f=>f.title),checks:up.findings.filter(f=>f.severity==='warning').map(f=>f.title)},
   releaseApproval:{decision:AP.decision||'pending',blockedBy:ap.blocked.map(c=>c.title)}}}
 catch(e){doc.fleetTools={error:String(e.message||e)}}
 return JSON.stringify(doc,null,2)};
window.fleet233={inventory,sample,populations,capacityModel,pushMinutes,rolloutModel,cohortCsv,rolloutConf,rolloutJson,place,tail,depsModel,upgradeModel,hopPath,forwarderCanSend,blacklistOnlyApps,serverclassText,approvalChecks,approvalRecord,canonical,sha256,
 parseCsv,rowsFromJson,clientsFromRows,classesFromConf,buildImported,readInventoryFiles,applyInventory,inventoryJson,readPackages,show,SRC};
})();

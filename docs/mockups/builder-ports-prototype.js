(function(){
/* Build 230: a load balancer and a Syslog Server each listen on as many ports as a design needs.
   - A Syslog Server's listening ports: UDP, TCP or TLS, a number from 1 to 65535, and the senders that use the port when
     it is theirs alone, as SC4S's dedicated ports are. UDP 514 and TCP 514 until they're changed. TLS listens on a TCP
     port, so TCP and TLS can't share a number. Its card lists them; its Settings tab edits them.
   - A load balancer's listeners: the presets as before, and any other port (UDP, TCP or TLS for syslog, HTTPS for HEC
     and Deployment Servers). The load balancer's own block resolves the new listener ids through an in-place edit, and
     an other in-place edit lends this block its update(), so that labels, link details, rules and Undo work as before.
   - A link into either starts on its receiver's first port. The link inspector suggests the receiver's ports, and says
     when the link's port isn't one of them.
   - Three architecture rules: a sender uses a port its receiver listens on (AR-016); a syslog load balancer's listeners
     are open on its Syslog Servers (AR-017); a port named for particular senders isn't a default port (AR-018).
   - Topology files keep a Syslog Server's ports, and a load balancer's other listeners. */
if(typeof builderComponents==='undefined'||!builderComponents.syslog||!window.builderLb186)return;
const LB=window.builderLb186,esc=builderEscape,name=componentInstanceLabel;
const PROTOCOLS=['udp','tcp','tls'];
const DEFAULT=[{protocol:'udp',port:514,senders:''},{protocol:'tcp',port:514,senders:''}];
const label=p=>p.protocol.toUpperCase()+' '+p.port;
// TLS listens on a TCP port: TCP and TLS on one number would clash, and UDP doesn't share with either.
const space=p=>p.protocol==='udp'?'udp':'tcp';
const list=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a[a.length-1]:a[0]||'';

// ---- A Syslog Server's ports
function sanitize(raw){if(!Array.isArray(raw))return null;const out=[],seen=new Set();
 for(const p of raw.slice(0,50)){if(!p||typeof p!=='object')continue;const protocol=String(p.protocol||'').toLowerCase(),port=Number(p.port);
  if(!PROTOCOLS.includes(protocol)||!Number.isInteger(port)||port<1||port>65535)continue;const key=space({protocol})+port;if(seen.has(key))continue;seen.add(key);
  out.push({protocol,port,senders:typeof p.senders==='string'?p.senders.trim().slice(0,60):''})}
 return out.length?out:null}
// Until a person changes them, a Syslog Server listens on the defaults, and the node holds nothing new.
function ports(n){return n?.type==='syslog'?(sanitize(n.syslogPorts)||DEFAULT.map(p=>({...p}))):[]}
// A load balancer's listeners, as ports.
function lbPorts(n){return(n?.lbListeners||[]).map(id=>LB.listeners[id]).filter(Boolean).map(([text,,port])=>({protocol:text.split(' ')[0].toLowerCase(),port,senders:''}))}
function receiverPorts(n){return n?.type==='syslog'?ports(n):n?.type==='loadBalancer'?lbPorts(n):null}
function problem(all,i){const p=all[i];if(!Number.isInteger(p.port)||p.port<1||p.port>65535)return'Enter a port from 1 to 65535.';
 const clash=all.find((q,j)=>j!==i&&space(q)===space(p)&&q.port===p.port);if(!clash)return'';
 return clash.protocol===p.protocol?label(p)+' is already listed.':label(p)+' would share TCP port '+p.port+' with '+label(clash)+'.'}
// Links into the server still on its old first port, which it no longer listens on, move to the new first port. A port
// that a link keeps, and the server doesn't listen on, is what AR-016 reports.
function follow(n,before,after){const old=before[0].port;if(after.some(p=>p.port===old))return;
 for(const x of builderTraceEdges('data').filter(x=>x.to===n.id)){if(x.edge.source?.type==='loadBalancer')continue;const store=relationshipDetailsStore(x.edge),d=store?.relationshipDetails;if(d&&Number(d.port)===old)d.port=after[0].port}}
function commit(n,next,what){const before=builderHistorySnapshot(),was=ports(n);n.syslogPorts=next;follow(n,was,next);commitBuilderHistory(before,what);builderStatus(what+' on '+name(n));renderBuilder()}
function editor(n){const all=ports(n),one=all.length===1;
 return'<section class="ports230" data-ports230="'+n.id+'"><h4>Listening ports</h4><p class="ports230Lead">Senders reach '+esc(name(n))+' on these ports. Name the senders that have a port of their own.</p>'
  +'<div class="ports230Rows">'+all.map((p,i)=>'<div class="ports230Row" data-port-item="'+i+'">'
   +'<select data-port-row="'+i+'" data-port-field="protocol" aria-label="Protocol of port '+(i+1)+'">'+PROTOCOLS.map(v=>'<option value="'+v+'"'+(v===p.protocol?' selected':'')+'>'+v.toUpperCase()+'</option>').join('')+'</select>'
   +'<input data-port-row="'+i+'" data-port-field="port" type="number" min="1" max="65535" step="1" inputmode="numeric" value="'+p.port+'" aria-label="Number of port '+(i+1)+'">'
   +'<button type="button" class="builderBtn" data-port-row="'+i+'" data-port-remove aria-label="Remove '+label(p)+'"'+(one?' disabled title="A Syslog Server needs at least one port."':'')+'>Remove</button>'
   +'<input class="ports230Senders" data-port-row="'+i+'" data-port-field="senders" maxlength="60" value="'+esc(p.senders)+'" placeholder="All senders" aria-label="Senders on '+label(p)+'"></div>').join('')
  +'</div><div class="ports230Actions"><button type="button" class="builderBtn" data-port-add>Add a port</button></div><p class="ports230Error" data-port-error role="alert" hidden></p>'
  +'<p class="ports230Note">TLS listens on a TCP port, so TCP and TLS can’t share a number. UDP and TCP can.</p></section>'}
function wire(box,n){const error=box.querySelector('[data-port-error]'),say=(t,field)=>{error.textContent=t;error.hidden=!t;box.querySelectorAll('[aria-invalid]').forEach(f=>f.removeAttribute('aria-invalid'));if(field&&t)field.setAttribute('aria-invalid','true')};
 box.querySelectorAll('[data-port-field]').forEach(f=>f.onchange=()=>{const all=ports(n),i=Number(f.dataset.portRow),k=f.dataset.portField;
  all[i]={...all[i],[k]:k==='port'?Number(f.value):k==='senders'?String(f.value).trim().slice(0,60):f.value};
  const t=problem(all,i);if(t)return say(t,f);commit(n,all,k==='senders'?'Name the senders':'Change a listening port')});
 box.querySelectorAll('[data-port-remove]').forEach(b=>b.onclick=()=>{const all=ports(n);if(all.length<2)return;all.splice(Number(b.dataset.portRow),1);commit(n,all,'Remove a listening port')});
 box.querySelector('[data-port-add]').onclick=()=>{const all=ports(n);let port=5000;while(all.some(q=>q.protocol==='udp'&&q.port===port))port++;all.push({protocol:'udp',port,senders:''});commit(n,all,'Add a listening port');
  requestAnimationFrame(()=>{const f=document.querySelector('[data-ports230="'+n.id+'"] [data-port-row="'+(all.length-1)+'"][data-port-field="port"]');if(f){f.focus();f.select()}})}}

// ---- A load balancer's other listeners
const presets=()=>Object.entries(LB.listeners);
function listenerId(serves,protocol,port){const text=protocol.toUpperCase()+' '+port,preset=presets().find(([,v])=>v[1]===serves&&v[0]===text);return preset?preset[0]:serves+'-'+protocol+'-'+port}
function lbEditor(n){const own=n.lbListeners.filter(id=>!presets().some(([k])=>k===id)),one=n.lbListeners.length===1,offer=n.lbServes==='syslog'?PROTOCOLS:['https'];
 return own.map(id=>'<label class="lbCheck186 lbOwn230"><input type="checkbox" data-lb-listener="'+esc(id)+'" checked'+(one?' disabled':'')+'>'+esc(LB.listeners[id][0])+'</label>').join('')
  +'<div class="lbAdd230"><select data-lb230-protocol aria-label="Protocol of the new listener">'+offer.map(v=>'<option value="'+v+'">'+v.toUpperCase()+'</option>').join('')+'</select>'
  +'<input data-lb230-port type="number" min="1" max="65535" step="1" inputmode="numeric" placeholder="Port" aria-label="Port of the new listener"><button type="button" class="builderBtn" data-lb230-add>Add a port</button></div>'
  +'<p class="ports230Error" data-lb230-error role="alert" hidden></p>'}
function lbProblem(n,protocol,port){if(!Number.isInteger(port)||port<1||port>65535)return'Enter a port from 1 to 65535.';const p={protocol,port},same=lbPorts(n).find(q=>(q.protocol==='udp')===(protocol==='udp')&&q.port===port);
 if(!same)return'';return same.protocol===protocol?label(p)+' is already a listener.':label(p)+' would share TCP port '+port+' with '+label(same)+'.'}
function lbWire(box,n){const set=box.closest('fieldset')||box,error=set.querySelector('[data-lb230-error]'),portField=set.querySelector('[data-lb230-port]');
 const checked=()=>[...set.querySelectorAll('[data-lb-listener]:checked')].map(f=>f.dataset.lbListener);
 set.querySelectorAll('.lbOwn230 [data-lb-listener]').forEach(f=>f.onchange=()=>{const ids=checked();if(ids.length)LB.update(n,'lbListeners',ids)});
 const add=()=>{const protocol=set.querySelector('[data-lb230-protocol]').value,port=Number(portField.value),t=lbProblem(n,protocol,port);
  if(t){error.textContent=t;error.hidden=false;portField.setAttribute('aria-invalid','true');return}
  LB.update(n,'lbListeners',[...n.lbListeners,listenerId(n.lbServes,protocol,port)])};
 set.querySelector('[data-lb230-add]').onclick=add;portField.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add()}}}

// ---- The inspector: a Syslog Server's ports, and a load balancer's other listeners. A section goes to the Settings tab.
const inspectorBefore=renderBuilderInstanceInspector;renderBuilderInstanceInspector=function(...a){const r=inspectorBefore.apply(this,a),n=state.builderNodes.find(x=>x.id===state.builderSelected),panel=document.querySelector('#builderInstanceInspector');if(!n||!panel)return r;
 if(n.type==='syslog'){panel.querySelector('[data-ports230]')?.remove();const holder=document.createElement('div');holder.innerHTML=editor(n);const box=holder.firstElementChild;
  const lead=[...panel.children].find(c=>c.matches('section:not(.managedInspector176)'));if(lead)panel.insertBefore(box,lead);else panel.append(box);wire(box,n)}
 if(n.type==='loadBalancer'){const set=panel.querySelector('.lbInspector186 fieldset');if(set&&!set.querySelector('.lbAdd230')){set.insertAdjacentHTML('beforeend',lbEditor(n));lbWire(set,n)}}
 return r};

// ---- Its card lists its ports, each in a span of its own so that a line breaks between ports, not inside one. The markup
// goes in by a function, so that a $ in a name or in senders is taken as typed.
const markupBefore=unifiedNodeMarkup;unifiedNodeMarkup=function(n,...a){const html=markupBefore.call(this,n,...a);if(n?.type!=='syslog'||!html)return html;
 const all=ports(n),tok=t=>'<span>'+esc(t)+'</span>',shown=all.slice(0,3).map(p=>tok(label(p))).join(' · ')+(all.length>3?' · '+tok('+'+(all.length-3)):'');
 const line='<span class="ports230Card" title="'+esc('Listening ports: '+all.map(p=>label(p)+(p.senders?' ('+p.senders+')':'')).join(', '))+'">'+shown+'</span>';
 return html.replace(/<strong>[\s\S]*?<\/strong>/,m=>m+line)};

// ---- A link into a Syslog Server starts on its first port. A load balancer's links keep its own rule: its first listener.
const detailsBefore=defaultRelationshipDetails;defaultRelationshipDetails=function(e){const d=detailsBefore.apply(this,arguments);
 if(e?.plane!=='data'||e.target?.type!=='syslog'||e.source?.type==='loadBalancer')return d;const first=ports(e.target)[0];return{...d,port:first.port,tls:first.protocol==='tls'?'Required':d.tls}};

// ---- The link inspector: the receiver's ports, offered and checked, each port in a span as on the card. The markup goes
// in by a function, as on the card.
const linkBefore=relationshipInspectorMarkup;relationshipInspectorMarkup=function(...a){const html=linkBefore.apply(this,a),sel=state.builderSelectedEdge;if(!sel||sel.plane!=='data'||state.builderConnectionDraft||typeof html!=='string')return html;
 const e=builderEdgeRecord(sel.plane,sel.id),t=e?.target,all=receiverPorts(t);if(!all?.length)return html;const d=ensureRelationshipDetails(e),port=Number(d.port),nums=[...new Set(all.map(p=>p.port))],ok=!port||nums.includes(port),id='ports230-'+String(sel.id).replace(/[^\w-]/g,'');
 const list=all.map(p=>'<span>'+esc(label(p))+'</span>').join(' · '),words=ok?esc(name(t))+' listens on '+list+'.':esc(name(t))+' doesn’t listen on '+port+'. It listens on '+list+'.';
 return html.replace(/(<input data-relationship-field="port"[^>]*?)>/,(m,input)=>input+' list="'+id+'"><datalist id="'+id+'">'+nums.map(p=>'<option value="'+p+'">').join('')+'</datalist><small class="ports230Hint'+(ok?'':' ports230Warn')+'">'+words+'</small>')};

// ---- Architecture rules.
const named=id=>name(state.builderNodes.find(n=>n.id===id));
architectureRules.push(
 {id:'AR-016',title:'Senders use a port their receiver listens on',severity:'High',description:'Every event-data link from a sender into a Syslog Server or a load balancer uses one of its listening ports. A load balancer’s own links to its Syslog Servers are AR-017’s.',evaluate(){
  const bad=[];for(const x of builderTraceEdges('data')){const t=state.builderNodes.find(n=>n.id===x.to),all=receiverPorts(t);if(!all?.length||x.edge.source?.type==='loadBalancer')continue;const port=Number(ensureRelationshipDetails(x.edge).port);if(port&&!all.some(p=>p.port===port))bad.push({x,t,port,all})}
  return ruleResult(this,bad.length?'fail':'pass',bad.map(b=>named(b.x.from)+' sends to port '+b.port+', but '+name(b.t)+' listens on '+b.all.map(label).join(' · ')+'.'),bad.flatMap(b=>[b.x.from,b.x.to]),bad.map(b=>b.x.plane+':'+b.x.id))}},
 {id:'AR-017',title:'A syslog load balancer’s listeners are open on its Syslog Servers',severity:'High',description:'Each listener of a load balancer for syslog is a listening port of every Syslog Server it sends to. TLS that ends on the load balancer arrives as TCP.',evaluate(){
  const bad=[];for(const lb of state.builderNodes.filter(n=>n.type==='loadBalancer'&&n.lbServes==='syslog')){const ms=(typeof builderLbMembers==='function'?builderLbMembers(lb):[]).filter(m=>m.type==='syslog');
   for(const l of lbPorts(lb)){const want=l.protocol==='tls'&&lb.lbMethod==='proxy'&&lb.lbTls==='terminate'?'tcp':l.protocol;for(const m of ms)if(!ports(m).some(p=>p.protocol===want&&p.port===l.port))bad.push({lb,m,l,want})}}
  return ruleResult(this,bad.length?'fail':'pass',bad.map(b=>name(b.lb)+' listens on '+label(b.l)+(b.want!==b.l.protocol?', and ends TLS there,':'')+' but '+name(b.m)+' doesn’t listen on '+b.want.toUpperCase()+' '+b.l.port+'.'),bad.flatMap(b=>[b.lb.id,b.m.id]),[])}},
 {id:'AR-018',title:'Dedicated syslog ports avoid the default ports',severity:'Medium',description:'A port named for particular senders isn’t UDP 514, TCP 514 or TLS 6514. SC4S discourages default ports as dedicated ports.',evaluate(){
  const found=[];for(const n of state.builderNodes.filter(n=>n.type==='syslog'))for(const p of ports(n))if(p.senders&&(p.protocol==='tls'?p.port===6514:p.port===514))found.push({n,p});
  return ruleResult(this,found.length?'advisory':'pass',found.map(f=>name(f.n)+' gives '+f.p.senders+' the default port '+label(f.p)+'. Give '+f.p.senders+' a port of its own: other senders on '+label(f.p)+' could be taken for '+f.p.senders+'.'),found.map(f=>f.n.id),[])}});

// ---- Topology files.
const docBefore=topologyDocument;topologyDocument=function(...a){const d=docBefore.apply(this,a);for(const item of d.topology?.nodes||[]){const live=state.builderNodes.find(n=>n.id===item.id);if(live?.type==='syslog')item.syslogPorts=ports(live)}return d};
// A file's own listener for a preset port takes the preset's id, so that each listener is listed once.
function presetIds(doc){const nodes=doc?.topology?.nodes||doc?.nodes;if(!Array.isArray(nodes)||!nodes.some(n=>n?.type==='loadBalancer'&&Array.isArray(n.lbListeners)))return doc;
 const fix=n=>n?.type==='loadBalancer'&&Array.isArray(n.lbListeners)?{...n,lbListeners:[...new Set(n.lbListeners.map(id=>{const m=/^(syslog|hec|deployment)-(udp|tcp|tls|https)-(\d+)$/.exec(String(id));return m?listenerId(m[1],m[2],Number(m[3])):id}))]}:n;
 return doc.topology?{...doc,topology:{...doc.topology,nodes:doc.topology.nodes.map(fix)}}:{...doc,nodes:doc.nodes.map(fix)}}
const validateBefore=validateTopologyDocument;validateTopologyDocument=function(doc,...a){const clean=presetIds(doc),parsed=validateBefore.call(this,clean,...a),raw=clean?.topology?.nodes||clean?.nodes||[],byId=new Map(raw.map(n=>[Number(n?.id),n])),dropped=[];
 for(const n of parsed.nodes||[]){if(n.type!=='syslog')continue;const given=byId.get(n.id)?.syslogPorts;if(given===undefined)continue;const kept=sanitize(given);if(kept)n.syslogPorts=kept;const count=Array.isArray(given)?given.length:1;if(count>(kept?.length||0))dropped.push(name(n)+' ('+(count-(kept?.length||0))+')')}
 parsed.ports230Dropped=dropped;return parsed};
const loadBefore=loadTopologyDocument;loadTopologyDocument=function(doc,...a){const r=loadBefore.call(this,doc,...a),dropped=r?.ports230Dropped;if(dropped?.length)builderStatus('Dropped listening ports that weren’t valid or were listed twice: '+dropped.join('; '),'warning');return r};

window.builderPorts230={ports,lbPorts,receiverPorts,listenerId,sanitize,DEFAULT};
renderBuilder();
})();

(function(){
/* Build 234: three of the change register's proposals, on the Builder and Operate.
   - Topology readiness score: seven areas (event delivery, resilience, authentication, fleet management, ownership,
     monitoring, recovery), each a few checks read from the topology and the page's own models, scored 0 to 100. A tab
     in the Builder's drawer, a card on the Inspector's Topology tab, Validate › Readiness, and the architecture report.
   - Interactive login walkthrough: Operate › Login walkthrough follows one sign-in from a User / Administrator through
     its identity provider and MFA to Splunk's login, roles, session and audit record, for a path in the topology, with
     the failures that can stop it.
   - Reusable component groups: Edit › Patterns… saves selected components with their links to each other, and inserts
     built-in or saved patterns, as one change in the Builder's history.
   The rules each check and step uses are Splunk's own documentation's; the sign-in behaviour that could be checked
   without an identity provider was checked on Splunk Enterprise 10.6. */
if(typeof state==='undefined'||typeof builderComponents==='undefined'||typeof renderBuilder!=='function')return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n).toLocaleString('en');
const plural=(n,w,p)=>`${num(n)} ${n===1?w:(p||w+'s')}`;
const name=n=>n?componentInstanceLabel(n):'';
const nodeOf=id=>state.builderNodes.find(n=>n.id===Number(id));
const listNames=(nodes,max=4)=>{const names=nodes.map(name);return names.length>max?`${names.slice(0,max).join(', ')} and ${num(names.length-max)} more`:names.join(', ')};
const HELP='https://help.splunk.com/en/splunk-enterprise/administer/';
const SRC={
 outputs:HELP+'admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/outputs.conf',
 inputs:HELP+'admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/inputs.conf',
 authentication:HELP+'admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/authentication.conf',
 authorize:HELP+'admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/authorize.conf',
 web:HELP+'admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/web.conf',
 server:HELP+'admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/server.conf',
 serverclass:HELP+'admin-manual/10.4/configuration-file-reference/10.4.2-configuration-file-reference/serverclass.conf',
 saml:HELP+'manage-users-and-security/10.4/use-saml-as-an-authentication-scheme-for-single-sign-on/configure-single-sign-on-with-saml',
 samlRoles:HELP+'manage-users-and-security/10.4/use-saml-as-an-authentication-scheme-for-single-sign-on/map-groups-on-a-saml-identity-provider-to-splunk-roles',
 duo:HELP+'manage-users-and-security/10.4/use-multi-factor-authentication-in-splunk-enterprise-as-an-authentication-scheme/about-multifactor-authentication-with-duo-security',
 audit:HELP+'manage-users-and-security/10.6/audit-activity-in-splunk-enterprise/auditing-activities-in-a-splunk-platform-instance',
 auditSearch:HELP+'manage-users-and-security/10.4/audit-activity-in-splunk-enterprise/search-the-audit-log',
 shc:HELP+'distributed-search/10.6/deploy-search-head-clustering/system-requirements-and-other-deployment-considerations-for-search-head-clusters',
 searchFactor:HELP+'manage-indexers-and-indexer-clusters/10.4/how-indexer-clusters-work/search-factor',
 clusterManager:'https://help.splunk.com/en/data-management/manage-splunk-enterprise-indexers/10.6/deploy-the-indexer-cluster/enable-the-indexer-cluster-manager-node',
 monitoringConsole:HELP+'monitor/10.4/about-the-monitoring-console/about-the-monitoring-console',
 consoleHost:HELP+'monitor/10.4/configure-the-monitoring-console/which-instance-should-host-the-console',
 licences:HELP+'admin-manual/10.6/configure-splunk-licenses/licenses-and-distributed-deployments'};
const link=(key,text)=>`<a href="${SRC[key]}" target="_blank" rel="noopener">${esc(text)}</a>`;
const download=(file,text,type)=>{if(typeof downloadText==='function')downloadText(file,text,type)};
const csvCell=v=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
// One redraw after the Builder's own, on the next quiet moment: the score and the panels are read after a change, not
// inside the Builder's redraw, so a redraw costs what it cost before.
let laterTimer=null;const laterJobs=new Set();
function later(fn){laterJobs.add(fn);if(laterTimer)return;laterTimer=setTimeout(()=>{laterTimer=null;const jobs=[...laterJobs];laterJobs.clear();for(const job of jobs){try{job()}catch(error){console.error(error)}}},120)}
// ---- Topology readiness: seven areas, each a few checks. A check is met, partly met, missing, or not in this topology
// (it doesn't count). An area's score is its checks' average (met 1, partly 0.5, missing 0) out of 100; the topology's
// is the average of the areas that have a check to score.
const AREAS=[['delivery','Event delivery'],['resilience','Resilience'],['authentication','Authentication'],['fleet','Fleet management'],['ownership','Ownership'],['monitoring','Monitoring'],['recovery','Recovery']];
const CREDIT={met:1,partial:.5,missing:0};
const STATUS_TEXT={met:'Met',partial:'Partly met',missing:'Missing',na:'Not in this topology'};
const FORWARDERS=['uf','hf','dbConnect'],INDEX_TARGETS=['idx','indexerCluster','cloudIndexer148'];
const SIGN_IN=['search','shcCluster','shcMember','cloudSearchTier','cloudEsSearchHead','monitoringConsole','soarCloud','soarOnPrem'];
// Splunk Enterprise instances (a Monitoring Console is for two or more), and those that need an Enterprise licence:
// every Splunk Enterprise instance but a forwarder that only forwards.
const ENTERPRISE=['idx','hf','dbConnect','search','shcMember','shcDeployer','ds','indexerClusterManager','licenseManager','monitoringConsole'];
const LICENSED=['idx','search','shcMember','shcDeployer','ds','indexerClusterManager','licenseManager','monitoringConsole'];
const DESTINATIONS=['idx','s3','cloudIndexer148','s3Dataset','azureDataset'];
// Event sources: what the Builder's coverage list takes as a route entry, if it can send events at all. The list also
// takes in components with no event link of their own (a cluster manager, a deployer, search head cluster members),
// which aren't sources, and Validate › Rules, AR-004, counts every component at the top of a chain.
const NOT_SOURCES=['ds','authUser','authProviderCloud','authProviderOnPrem','idx','s3','search','cloudEsSearchHead'];
const sendsEvents=n=>!!n&&!NOT_SOURCES.includes(n.type)&&(builderDataCapabilities[n.type]||[]).length>0;
const check=(id,title,status,detail,o={})=>({id,title,status,detail,nodes:[...new Set((o.nodes||[]).map(n=>typeof n==='object'?n?.id:n).filter(x=>x!=null))],fix:o.fix||'',src:o.src||null,srcText:o.srcText||'',from:o.from||''});
const share=(good,total)=>!total?'na':good>=total?'met':good>0?'partial':'missing';
const RULE_STATUS={pass:'met',advisory:'partial',warning:'partial',review:'partial',fail:'missing',error:'missing'};
function ruleCheck(rules,ruleId,id,title,applies,why,fix,keep){
 if(!applies)return check(id,title,'na',why);
 const r=rules.get(ruleId);if(!r)return check(id,title,'na','The rule isn’t in this page’s rule profile.');
 let status=RULE_STATUS[r.status]||'na',ev=(r.evidence||[]).map(String),ids=r.nodes||[];
 // keep: the components this check counts. The rule's findings for any other component are set aside.
 if(keep&&status!=='met'&&status!=='na'&&ev.length===ids.length){const k=ids.map((n,i)=>keep(nodeOf(n))?i:-1).filter(i=>i>=0);ev=k.map(i=>ev[i]);ids=k.map(i=>ids[i]);if(!k.length)status='met'}
 return check(id,title,status,status==='met'?(r.status==='pass'?`Rule ${ruleId} passes.`:`Rule ${ruleId} names only components that don’t send events.`):`Rule ${ruleId}: ${ev.slice(0,3).join('; ')}${ev.length>3?` and ${num(ev.length-3)} more`:''}.`,{nodes:ids,fix,from:`Validate › Rules, ${ruleId}`})}

function readinessContext(){
 const nodes=state.builderNodes||[],rules=new Map((typeof evaluateArchitectureRules==='function'?evaluateArchitectureRules():[]).map(r=>[r.id,r]));
 const data=builderTraceEdges('data'),stats=topologyStatisticsModel();
 const issues=typeof unresolvedValues==='function'?unresolvedValues():[];
 return {nodes,rules,data,stats,issues,auth:state.builderAuthRelations||[],mgmt:(state.builderRelations||[]).filter(r=>(r.plane||'management')==='management')}}

function deliveryChecks(x){
 const out=[],rows=(typeof coverageRows==='function'?coverageRows():[]).filter(r=>sendsEvents(r.source));
 if(!rows.length)out.push(check('ED-1','Every source reaches an Indexer or S3','na','The topology has no source.'));
 else{const miss=rows.filter(r=>r.missing);out.push(check('ED-1','Every source reaches an Indexer or S3',share(rows.length-miss.length,rows.length),
  miss.length?`${plural(miss.length,'source')} of ${num(rows.length)} reach no Indexer or S3: ${listNames(miss.map(r=>r.source))}.`:`All ${plural(rows.length,'source')} reach an Indexer or S3.`,
  {nodes:miss.map(r=>r.source),fix:'Connect each one to a path that ends at an Indexer or Amazon S3.',from:'Validate › Coverage'}))}
 const sec=typeof securityBoundaryModel==='function'?securityBoundaryModel():{crossings:[]},cross=(sec.crossings||[]).filter(h=>h.from&&h.to);
 if(!cross.length)out.push(check('ED-2','Event links that cross a security zone are encrypted','na','No event link crosses a security zone.'));
 else{const plain=cross.filter(h=>/^none$/i.test(String(h.encryption||'')));out.push(check('ED-2','Event links that cross a security zone are encrypted',share(cross.length-plain.length,cross.length),
  plain.length?`${plural(plain.length,'link')} of ${num(cross.length)} cross a zone unencrypted: ${plain.slice(0,3).map(h=>`${name(h.from)} → ${name(h.to)}`).join('; ')}${plain.length>3?'; …':''}.`:`All ${plural(cross.length,'crossing')} are encrypted.`,
  {nodes:plain.map(h=>h.to),fix:'Use TLS on these links, or keep both ends in one zone.',from:'Operate › Security boundaries'}))}
 out.push(ruleCheck(x.rules,'AR-016','ED-3','Senders use a port their receiver listens on',x.data.length>0,'The topology has no event links.','Set the sender’s port to one its receiver listens on, in the link’s inspector.'));
 out.push(ruleCheck(x.rules,'AR-007','ED-4','Every relationship passes validation',x.data.length>0,'The topology has no event links.','Open each link in the Inspector and resolve what its validation names.'));
 return out}

function resilienceChecks(x){
 const out=[],nodes=x.nodes,dataEdges=x.stats.dataEdges||[];
 if(!dataEdges.length)out.push(check('RS-1','No single component stops the event path','na','The topology has no event links.'));
 else{const incoming=new Set(dataEdges.map(e=>e.to)),receivers=new Set(dataEdges.map(e=>e.to).filter(id=>incoming.has(id)));
  const spofs=(x.stats.spofs||[]).map(s=>s.node).filter(Boolean),status=!spofs.length?'met':spofs.length>=receivers.size?'missing':'partial';
  out.push(check('RS-1','No single component stops the event path',status,spofs.length?`${plural(spofs.length,'component')} of the ${num(receivers.size)} that receive events would stop them alone: ${listNames(spofs)}.`:'No single component stops the event path.',
   {nodes:spofs,fix:'Give each a second instance: a second receiver for the forwarders, or members behind a load balancer.',from:'Analyze › Statistics'}))}
 const idx=nodes.filter(n=>n.type==='idx'),clusters=nodes.filter(n=>n.type==='indexerCluster'),cloudIdx=nodes.some(n=>n.type==='cloudIndexer148');
 const titleIdx='Searching continues when an indexer fails';
 if(!idx.length&&!clusters.length)out.push(cloudIdx?check('RS-2',titleIdx,'met','Splunk Cloud runs the indexers.'):check('RS-2',titleIdx,'na','No indexer in this topology.'));
 else if(clusters.length){
  const weak=clusters.filter(c=>{const peers=idx.filter(i=>i.indexClusterId===c.id).length,rf=Number(c.indexClusterRf??3),sf=Number(c.indexClusterSf??2);return sf<2||peers<rf}),loose=idx.filter(i=>!clusters.some(c=>c.id===i.indexClusterId));
  out.push(check('RS-2',titleIdx,!weak.length&&!loose.length?'met':'partial',
   (weak.length?weak.map(c=>{const peers=idx.filter(i=>i.indexClusterId===c.id).length;return `${name(c)}: search factor ${c.indexClusterSf??2}, ${plural(peers,'peer')} for a replication factor of ${c.indexClusterRf??3}`}).join('; ')+'. ':'')+
   (loose.length?`${plural(loose.length,'indexer')} outside a cluster: ${listNames(loose)}.`:'')+(!weak.length&&!loose.length?`${plural(clusters.length,'indexer cluster')}, each with a search factor of 2 or more and as many peers as its replication factor.`:''),
   {nodes:[...weak,...loose],fix:'Keep a search factor of at least 2 and as many peers as the replication factor; put standalone indexers in the cluster.',src:'searchFactor',srcText:'Search factor: with a search factor of at least 2, the cluster keeps searching if a peer goes down'}))}
 else out.push(check('RS-2',titleIdx,idx.length>=2?'partial':'missing',idx.length>=2?`${plural(idx.length,'standalone indexer')}: the others keep receiving, but what a failed one holds can’t be searched until it’s back.`:`One indexer, ${name(idx[0])}: while it’s down, nothing is indexed or searched.`,
  {nodes:idx,fix:'Use an Indexer Cluster with a search factor of at least 2.',src:'searchFactor',srcText:'Search factor: with a search factor of at least 2, the cluster keeps searching if a peer goes down'}));
 const sh=nodes.filter(n=>n.type==='search'),shc=nodes.filter(n=>n.type==='shcCluster'),members=nodes.filter(n=>n.type==='shcMember'),cloudSearch=nodes.some(n=>['cloudSearchTier','cloudEsSearchHead'].includes(n.type));
 const titleSh='Search stays up when a search head fails';
 if(!sh.length&&!shc.length&&!members.length)out.push(cloudSearch?check('RS-3',titleSh,'met','Splunk Cloud runs the search tier.'):check('RS-3',titleSh,'na','No search head in this topology.'));
 else if(shc.length){const small=shc.filter(c=>members.filter(m=>m.shcClusterId===c.id).length<3);
  out.push(check('RS-3',titleSh,small.length?'partial':'met',small.length?small.map(c=>`${name(c)} has ${plural(members.filter(m=>m.shcClusterId===c.id).length,'member')}`).join('; ')+'; Splunk asks for at least three.':`${plural(shc.length,'search head cluster')} with three or more members each.`,
   {nodes:small,fix:'Give each search head cluster at least three members.',src:'shc',srcText:'Search head clusters: for high availability search, at least three members'}))}
 else out.push(check('RS-3',titleSh,sh.length>=2?'partial':'missing',sh.length>=2?`${plural(sh.length,'standalone search head')}: people can move to another, but their knowledge objects aren’t shared.`:`One search head, ${name(sh[0])}.`,
  {nodes:sh,fix:'Use a search head cluster of at least three members, with a deployer.',src:'shc',srcText:'Search head clusters: for high availability search, at least three members'}));
 const sources=typeof coverageRows==='function'?coverageRows().map(r=>r.source).filter(sendsEvents):[];
 out.push(ruleCheck(x.rules,'AR-004','RS-4','Critical production sources have a redundant first hop',sources.length>0,'The topology has no source.','Give the source a second first hop, or a load balancer in front of two.',sendsEvents));
 return out}

function authenticationChecks(x){
 const out=[],nodes=x.nodes,auth=x.auth,providers=new Set(nodes.filter(n=>isAuthProviderType(n.type)).map(n=>n.id)),signIn=nodes.filter(n=>SIGN_IN.includes(n.type));
 if(!signIn.length){out.push(check('AU-1','People sign in through an identity provider','na','No component in this topology takes interactive sign-in.'))}
 else{const via=signIn.filter(c=>auth.some(r=>r.to===c.id&&providers.has(r.from)));
  out.push(check('AU-1','People sign in through an identity provider',share(via.length,signIn.length),via.length===signIn.length?`${listNames(signIn)}: each has an identity provider.`:`No identity provider for ${listNames(signIn.filter(c=>!via.includes(c)))}.`,
   {nodes:signIn.filter(c=>!via.includes(c)),fix:'Add an Authentication Provider and draw an Access link from it to each, with the User access plane on.',src:'saml',srcText:'Configure single sign-on with SAML'}))}
 const people=auth.filter(r=>nodeOf(r.from)?.type==='authUser');
 if(!people.length)out.push(signIn.length?check('AU-2','Administrators use MFA','missing','No sign-in path is drawn, so the topology can’t show MFA.',{nodes:signIn,fix:'Draw User / Administrator → provider → component, and set each Access link’s MFA.'}):check('AU-2','Administrators use MFA','na','No sign-in path in this topology.'));
 else{const ok=people.filter(r=>['enforced','inherited'].includes(r.mfa)),bad=people.filter(r=>!ok.includes(r));
  out.push(check('AU-2','Administrators use MFA',share(ok.length,people.length),bad.length?`${plural(bad.length,'sign-in link')} of ${num(people.length)} without MFA confirmed: ${bad.slice(0,3).map(r=>`${name(nodeOf(r.from))} → ${name(nodeOf(r.to))} (${r.mfa||'unknown'})`).join('; ')}.`:'Every sign-in link enforces or inherits MFA.',
   {nodes:bad.map(r=>r.to),fix:'Set MFA to enforced or inherited on each Access link once the provider requires it.',from:'Validate › Rules, AR-005'}))}
 const mapped=auth.filter(r=>providers.has(r.from)&&!providers.has(r.to));
 if(!mapped.length)out.push(check('AU-3','Identity provider groups map to Splunk roles','na','No identity provider is linked to a component.'));
 else{const ok=mapped.filter(r=>(r.roleMapping||[]).length);out.push(check('AU-3','Identity provider groups map to Splunk roles',share(ok.length,mapped.length),ok.length===mapped.length?`Every provider link names its roles: ${[...new Set(mapped.flatMap(r=>r.roleMapping))].join(', ')}.`:`${plural(mapped.length-ok.length,'provider link')} without a role mapping.`,
  {nodes:mapped.filter(r=>!ok.includes(r)).map(r=>r.to),fix:'Record the Splunk roles each provider group maps to on the Access link.',src:'samlRoles',srcText:'Map groups on a SAML identity provider to Splunk roles: group mapping is the only way to give IdP users access'}))}
 if(!auth.length)out.push(check('AU-4','Sign-ins leave evidence that’s reviewed','na','No sign-in path in this topology.'));
 else{const ok=auth.filter(r=>String(r.auditEvidence||'').trim()||String((nodeOf(r.from)&&isAuthProviderType(nodeOf(r.from).type)?nodeOf(r.from).providerAudit:'')||'').trim());
  out.push(check('AU-4','Sign-ins leave evidence that’s reviewed',share(ok.length,auth.length),ok.length===auth.length?'Every Access link names its audit evidence.':`${plural(auth.length-ok.length,'Access link')} of ${num(auth.length)} without audit evidence, such as the _audit search for its sign-ins.`,
   {nodes:auth.filter(r=>!ok.includes(r)).map(r=>r.to),fix:'Name the evidence on each Access link: for Splunk, index=_audit action="login attempt" for the users it serves.',src:'auditSearch',srcText:'Search the audit log'}))}
 return out}

function fleetChecks(x){
 const out=[],nodes=x.nodes,fw=nodes.filter(n=>['uf','hf'].includes(n.type)),active=r=>r.authority==='active';
 if(!fw.length)out.push(check('FM-1','Every forwarder has a Deployment Server','na','No forwarder in this topology.'));
 else{const managed=fw.filter(n=>x.mgmt.some(r=>r.to===n.id&&active(r)));out.push(check('FM-1','Every forwarder has a Deployment Server',share(managed.length,fw.length),managed.length===fw.length?`All ${plural(fw.length,'forwarder')} have an active Deployment Server.`:`${plural(fw.length-managed.length,'forwarder')} without an active Deployment Server: ${listNames(fw.filter(n=>!managed.includes(n)))}.`,
  {nodes:fw.filter(n=>!managed.includes(n)),fix:'Draw a Fleet link from a Deployment Server to each, with the Fleet plane on.',from:'Analyze › Statistics'}))}
 const clientLinks=x.mgmt.filter(r=>['uf','hf'].includes(nodeOf(r.to)?.type));
 if(!clientLinks.length)out.push(check('FM-2','Deployment links name their server classes','na','No Deployment Server manages a forwarder here.'));
 else{const ok=clientLinks.filter(r=>(r.serverClasses||[]).length);out.push(check('FM-2','Deployment links name their server classes',share(ok.length,clientLinks.length),ok.length===clientLinks.length?'Every deployment link names its server classes.':`${plural(clientLinks.length-ok.length,'deployment link')} of ${num(clientLinks.length)} name no server class.`,
  {nodes:clientLinks.filter(r=>!ok.includes(r)).map(r=>r.to),fix:'Record the server classes each forwarder is in, on its Fleet link.',src:'serverclass',srcText:'serverclass.conf'}))}
 const ic=nodes.filter(n=>n.type==='indexerCluster'),sc=nodes.filter(n=>n.type==='shcCluster');
 if(!ic.length&&!sc.length)out.push(check('FM-3','Each cluster has its manager or deployer','na','No indexer or search head cluster here.'));
 else{const ok=[...ic.filter(c=>nodeOf(c.indexClusterManagerId)?.type==='indexerClusterManager'),...sc.filter(c=>nodeOf(c.shcDeployerId)?.type==='shcDeployer')],all=[...ic,...sc];
  out.push(check('FM-3','Each cluster has its manager or deployer',share(ok.length,all.length),ok.length===all.length?'Every indexer cluster has a manager and every search head cluster a deployer.':`Without one: ${listNames(all.filter(c=>!ok.includes(c)))}.`,
   {nodes:all.filter(c=>!ok.includes(c)),fix:'Assign an Indexer Cluster Manager to each indexer cluster and a Search Head Cluster Deployer to each search head cluster.',src:'shc',srcText:'Search head clusters need a deployer, on an instance that isn’t a member'}))}
 return out}

function ownershipChecks(x){
 const out=[],nodes=x.nodes,acc=String(state.responsibilityAccountable||'').trim();
 out.push(check('OW-1','A named owner is accountable for the service',nodes.length?(acc?'met':'missing'):'na',acc?`${acc} is accountable.`:'Nobody is named accountable.',{fix:'Name the accountable owner in Operate › Responsibility boundaries.',from:'Operate › Responsibility boundaries'}));
 const rm=typeof responsibilityModel==='function'?responsibilityModel():{handoffs:[],findings:[]},hand=rm.handoffs||[],find=rm.findings||[];
 if(!hand.length)out.push(check('OW-2','Every handoff has an owner who accepts it','na','No handoff between owners here.'));
 else out.push(check('OW-2','Every handoff has an owner who accepts it',!find.length?'met':find.length>=hand.length?'missing':'partial',find.length?`${plural(find.length,'finding')} for ${plural(hand.length,'handoff')}: ${find.slice(0,2).map(f=>f.text).join(' · ')}${find.length>2?' · …':''}`:`All ${plural(hand.length,'handoff')} have an accepting owner.`,
  {fix:'Record who accepts each handoff and its risk.',from:'Operate › Responsibility boundaries'}));
 const links=builderTraceEdges('all'),ownerless=x.issues.filter(i=>/Relationship owner is not assigned/.test(i.detail));
 if(!links.length)out.push(check('OW-3','Every link has an owner','na','The topology has no links.'));
 else out.push(check('OW-3','Every link has an owner',share(links.length-ownerless.length,links.length),ownerless.length?`${plural(ownerless.length,'link')} of ${num(links.length)} without an owner.`:`All ${plural(links.length,'link')} have an owner.`,
  {nodes:ownerless.map(i=>i.nodeId),fix:'Name the owner in each link’s Inspector.',from:'Validate › Review'}));
 const named=x.issues.filter(i=>/generated component name|Environment is unspecified|region is unspecified/i.test(i.detail)),missing=new Set(named.map(i=>i.nodeId).filter(v=>v!=null));
 out.push(check('OW-4','Components carry their real name, environment and region',nodes.length?share(nodes.length-missing.size,nodes.length):'na',missing.size?`${plural(missing.size,'component')} of ${num(nodes.length)} still have a generated name or an unspecified environment or region.`:'Every component has its name, environment and region.',
  {nodes:[...missing],fix:'Set the instance name, environment and region in each component’s Inspector.',from:'Validate › Review'}));
 return out}

function monitoringChecks(x){
 const out=[],nodes=x.nodes,ent=nodes.filter(n=>ENTERPRISE.includes(n.type)),lic=nodes.filter(n=>LICENSED.includes(n.type));
 if(ent.length<2)out.push(check('MO-1','A Monitoring Console watches the deployment','na','Fewer than two Splunk Enterprise instances.'));
 else{const mc=nodes.filter(n=>n.type==='monitoringConsole');out.push(check('MO-1','A Monitoring Console watches the deployment',mc.length?'met':'missing',mc.length?`${listNames(mc)} for ${plural(ent.length,'Splunk Enterprise instance')}.`:`${plural(ent.length,'Splunk Enterprise instance')}, and no Monitoring Console.`,
  {fix:'Add a Monitoring Console; Splunk advises against hosting it on a search head cluster member or a production search head.',src:'monitoringConsole',srcText:'About the Monitoring Console'}))}
 if(lic.length<2)out.push(check('MO-2','Splunk Enterprise instances reach a license manager','na','Fewer than two instances that need an Enterprise licence.'));
 else{const lm=nodes.filter(n=>n.type==='licenseManager');out.push(check('MO-2','Splunk Enterprise instances reach a license manager',lm.length?'met':'missing',lm.length?`${listNames(lm)} for ${plural(lic.length,'instance')}.`:`${plural(lic.length,'instance')} that need an Enterprise licence, and no License Manager.`,
  {fix:'Add a License Manager.',src:'licences',srcText:'Licenses and distributed deployments: every Splunk Enterprise instance but a forwarder needs an Enterprise licence'}))}
 out.push(ruleCheck(x.rules,'AR-014','MO-3','Load balancers check their members’ health',nodes.some(n=>n.type==='loadBalancer'),'No load balancer in this topology.','Set a health check on each load balancer, in its Inspector.'));
 return out}

function recoveryChecks(x){
 const out=[],nodes=x.nodes,toIndex=x.data.filter(e=>FORWARDERS.includes(e.edge.source?.type)&&INDEX_TARGETS.includes(e.edge.target?.type)),fw=[...new Map(toIndex.map(e=>[e.edge.source.id,e.edge.source])).values()];
 if(!fw.length)out.push(check('RC-1','Forwarders keep events until the indexer has them','na','No forwarder sends to an indexer here.'));
 else{const ok=fw.filter(n=>n.ack);out.push(check('RC-1','Forwarders keep events until the indexer has them',share(ok.length,fw.length),ok.length===fw.length?'Every forwarder that sends to an indexer uses indexer acknowledgement.':`Without indexer acknowledgement: ${listNames(fw.filter(n=>!n.ack))}.`,
  {nodes:fw.filter(n=>!n.ack),fix:'Turn on Indexer acknowledgement in each forwarder’s Inspector (useACK = true in outputs.conf).',src:'outputs',srcText:'outputs.conf useACK: the forwarder keeps each event until the receiver acknowledges it, and resends it to another receiver if none comes'}))}
 const syslogIn=x.data.filter(e=>e.edge.source?.type==='syslogSource');
 if(!syslogIn.length)out.push(check('RC-2','Syslog lands on a buffer that survives a restart','na','No Syslog Source here.'));
 else{const ok=syslogIn.filter(e=>e.edge.target?.type==='syslog'||e.edge.target?.persistent),bad=syslogIn.filter(e=>!ok.includes(e));
  out.push(check('RC-2','Syslog lands on a buffer that survives a restart',share(ok.length,syslogIn.length),bad.length?`${plural(bad.length,'receiver')} take syslog straight from the network with no persistent queue: ${listNames([...new Set(bad.map(e=>e.edge.target))])}.`:'Every syslog sender lands on a Syslog Server that writes files, or on a persistent input queue.',
   {nodes:bad.map(e=>e.edge.target),fix:'Put a Syslog Server that writes to files in front, or turn on the receiver’s Persistent input queue.',src:'inputs',srcText:'inputs.conf persistentQueueSize: persistent queues help prevent loss of transient data; the default is none'}))}
 if(!x.data.length)out.push(check('RC-3','Every event link has a retry policy','na','The topology has no event links.'));
 else{const bad=x.data.filter(e=>{const d=ensureRelationshipDetails(e.edge);const v=String(d?.retryPolicy||'').trim();return !v||/^(none|unknown|unspecified)$/i.test(v)});
  out.push(check('RC-3','Every event link has a retry policy',share(x.data.length-bad.length,x.data.length),bad.length?`${plural(bad.length,'link')} of ${num(x.data.length)} without one.`:`All ${plural(x.data.length,'event link')} name a retry policy.`,
   {nodes:bad.map(e=>e.edge.target),fix:'Record the retry policy in each link’s Inspector.'}))}
 const dest=nodes.filter(n=>DESTINATIONS.includes(n.type)),known=r=>r&&r!=='Unspecified',destRegions=new Set(dest.map(n=>n.region).filter(known)),allRegions=new Set(nodes.map(n=>n.region).filter(known));
 if(!dest.length)out.push(check('RC-4','A second region can take over','na','No destination in this topology.'));
 else out.push(check('RC-4','A second region can take over',destRegions.size>=2?'met':allRegions.size>=2?'partial':'missing',destRegions.size>=2?`Destinations in ${plural(destRegions.size,'region')}: ${[...destRegions].join(', ')}.`:allRegions.size>=2?`Components span ${[...allRegions].join(', ')}, but the destinations are in ${destRegions.size?[...destRegions][0]:'no named region'}.`:'Every destination is in one region, or none is named.',
  {nodes:dest.filter(n=>!known(n.region)),fix:'Place destinations in a second region, and model the failover in Operate › Multi-region & DR.',from:'Operate › Multi-region & DR'}));
 return out}

function readinessModel(){
 const x=readinessContext();
 const checks={delivery:deliveryChecks(x),resilience:resilienceChecks(x),authentication:authenticationChecks(x),fleet:fleetChecks(x),ownership:ownershipChecks(x),monitoring:monitoringChecks(x),recovery:recoveryChecks(x)};
 const areas=AREAS.map(([id,label])=>{const list=checks[id],scored=list.filter(c=>c.status!=='na'),score=scored.length?scored.reduce((s,c)=>s+CREDIT[c.status],0)/scored.length*100:null;
  const counts={met:0,partial:0,missing:0,na:0};list.forEach(c=>counts[c.status]++);return {id,label,checks:list,score,counts}});
 const scored=areas.filter(a=>a.score!=null),score=scored.length?scored.reduce((s,a)=>s+a.score,0)/scored.length:null;
 const counts={met:0,partial:0,missing:0,na:0};areas.forEach(a=>Object.keys(counts).forEach(k=>counts[k]+=a.counts[k]));
 return {score,band:score==null?'none':score>=80?'ready':score>=50?'work':'not',areas,counts,components:x.nodes.length,scoredAreas:scored.length}}
const BAND_TEXT={ready:'Ready',work:'Needs work',not:'Not ready',none:'Nothing to score'};
const round=v=>v==null?null:Math.round(v);
function readinessJson(m=readinessModel()){
 return JSON.stringify({schema:'splunk-pipeline-explorer/topology-readiness',version:1,generatedAt:new Date().toISOString(),topology:state.builderPresentation?.title||(typeof defaultPresentationTitle==='function'?defaultPresentationTitle():''),
  score:round(m.score),band:BAND_TEXT[m.band],scale:'Met 1, partly met 0.5, missing 0; an area is the average of its checks, the topology the average of its scored areas.',
  areas:m.areas.map(a=>({id:a.id,area:a.label,score:round(a.score),checks:a.checks.map(c=>({id:c.id,check:c.title,status:STATUS_TEXT[c.status],detail:c.detail,components:c.nodes.map(id=>name(nodeOf(id))).filter(Boolean),fix:c.fix,source:c.src?SRC[c.src]:c.from||null}))}))},null,2)}
function readinessCsv(m=readinessModel()){
 const rows=[['area','area score','check','status','detail','components','fix','source']];
 for(const a of m.areas)for(const c of a.checks)rows.push([a.label,round(a.score)??'',`${c.id} ${c.title}`,STATUS_TEXT[c.status],c.detail,c.nodes.map(id=>name(nodeOf(id))).filter(Boolean).join('; '),c.fix,c.src?SRC[c.src]:c.from||'']);
 return rows.map(r=>r.map(csvCell).join(',')).join('\n')+'\n'}
// ---- Drawer tabs, as Build 208 adds them: a panel in the drawer's body, its kind in drawerKinds, a tab after another,
// and setDrawerFlags showing only the open tab's panel.
const drawer=document.getElementById('builderInspectorDrawer');
const drawerBody=drawer?.querySelector('.builderDrawerBody'),drawerStrip=drawer?.querySelector('.builderDrawerTabs');
const canDrawer=!!(drawer&&drawerBody&&drawerStrip&&typeof drawerKinds!=='undefined'&&typeof openBuilderDrawer==='function'&&typeof setDrawerFlags==='function');
const PANELS={};
function addDrawerTab(kind,label,id,cls,after){
 if(!canDrawer)return null;
 const panel=document.createElement('section');panel.id=id;panel.className='mtPanel208 '+cls;panel.hidden=true;panel.setAttribute('aria-label',label);drawerBody.append(panel);
 drawerKinds.push([kind,label,id,null]);
 const tab=document.createElement('button');tab.type='button';tab.dataset.drawerKind=kind;tab.textContent=label;tab.onclick=()=>openBuilderDrawer(kind,false);
 const prev=drawerStrip.querySelector(`[data-drawer-kind="${after}"]`);if(prev)prev.after(tab);else drawerStrip.append(tab);
 PANELS[kind]=panel;return panel}
const isOpen=kind=>!!PANELS[kind]&&!PANELS[kind].hidden&&!!drawer?.classList.contains('open');
// A menu item like Build 198's, in an existing menu, after the item with the given label.
function addMenuItem(menuLabel,label,afterLabel,onClick){
 const details=[...document.querySelectorAll('.builderMenuBar198 details.builderMenu')].find(d=>d.querySelector(':scope>summary')?.textContent.trim()===menuLabel);
 const items=details?.querySelector('.builderMenuItems');if(!items)return null;
 const b=document.createElement('button');b.type='button';b.className='mbItem198 mb234';b.innerHTML='<span class="mbLabel198"></span>';b.querySelector('.mbLabel198').textContent=label;
 b.addEventListener('click',()=>{details.open=false;onClick()});
 const after=[...items.querySelectorAll('.mbItem198')].find(x=>x.querySelector('.mbLabel198')?.firstChild?.textContent.trim()===afterLabel);
 if(after)after.after(b);else items.append(b);return b}
// Phones: More's Tools disclosure lists the drawer's tabs (Build 208's launcher handles [data-mt-kind]).
function addPhoneLaunch(kind,label){const launch=document.querySelector('#builderSecondaryToolsBody .mtLaunch208');if(!launch)return;const b=document.createElement('button');b.type='button';b.dataset.mtKind=kind;b.textContent=label;launch.append(b)}

// ---- Readiness in the drawer
const RD={area:'all',open:'all'};
const readinessPanel=addDrawerTab('readiness','Readiness','builderReadinessPanel234','rd234','rules');
const ICON={met:'✓',partial:'◐',missing:'✕',na:'–'};
function areaRows(m,buttons){
 return m.areas.map(a=>{const s=a.score==null?null:round(a.score),bar=`<span class="rd234Bar" aria-hidden="true"><i style="width:${s??0}%"></i></span>`,val=s==null?'<b class="rd234Na">Not scored</b>':`<b>${s}</b>`;
  const counts=a.score==null?'nothing to check here':[a.counts.met&&`${a.counts.met} met`,a.counts.partial&&`${a.counts.partial} partly`,a.counts.missing&&`${a.counts.missing} missing`].filter(Boolean).join(' · ');
  return buttons?`<button type="button" class="rd234Area${RD.area===a.id?' on':''}" data-rd234-area="${a.id}" aria-pressed="${RD.area===a.id}"><span class="rd234AreaName">${esc(a.label)}</span>${bar}${val}<small>${esc(counts)}</small></button>`
   :`<dt>${esc(a.label)}</dt><dd>${bar}${val}</dd>`}).join('')}
function checkItem(c){
 const nodes=c.nodes.map(nodeOf).filter(Boolean),from=c.src?link(c.src,c.srcText||'Splunk documentation'):c.from?esc(c.from):'';
 return `<article class="rd234Check" data-status="${c.status}"><span class="rd234Status" data-status="${c.status}"><i aria-hidden="true">${ICON[c.status]}</i>${STATUS_TEXT[c.status]}</span><div class="rd234Body"><strong><span class="rd234Id">${c.id}</span> ${esc(c.title)}</strong><p>${esc(c.detail)}</p>`+
  (c.status!=='met'&&c.status!=='na'&&c.fix?`<p class="rd234Fix"><b>To do:</b> ${esc(c.fix)}</p>`:'')+(from?`<p class="rd234From">From: ${from}</p>`:'')+
  (nodes.length?`<div class="rd234Nodes" aria-label="Components this check names">${nodes.slice(0,6).map(n=>`<button type="button" data-rd234-show="${n.id}">Show ${esc(name(n))}</button>`).join('')}${nodes.length>6?`<span>and ${num(nodes.length-6)} more</span>`:''}</div>`:'')+'</div></article>'}
function renderReadinessPanel(){
 if(!readinessPanel||readinessPanel.hidden)return;
 const m=readinessModel(),sig=JSON.stringify([m.areas.map(a=>[a.score,a.checks.map(c=>[c.id,c.status,c.detail,c.nodes])]),RD]);
 if(readinessPanel.dataset.sig===sig)return;
 const focus=document.activeElement&&readinessPanel.contains(document.activeElement)?[...readinessPanel.querySelectorAll('button,a,input,select')].indexOf(document.activeElement):-1;
 readinessPanel.dataset.sig=sig;
 const s=m.score==null?'—':round(m.score),areas=m.areas.filter(a=>RD.area==='all'||a.id===RD.area);
 const sections=areas.map(a=>{const list=a.checks.filter(c=>RD.open==='all'||c.status==='partial'||c.status==='missing');
  return `<section class="rd234Section"><h4>${esc(a.label)} <span>${a.score==null?'not scored':round(a.score)+' / 100'}</span></h4>${list.length?list.map(checkItem).join(''):`<p class="rd234Empty">${RD.open==='all'?'No checks.':'Nothing left to do in this area.'}</p>`}</section>`}).join('');
 readinessPanel.innerHTML=`<div class="rd234Head"><div class="rd234Score" data-band="${m.band}"><strong>${s}</strong><span>/ 100</span></div><div class="rd234Sum"><h3>Topology readiness</h3><p><b class="rd234Band" data-band="${m.band}">${BAND_TEXT[m.band]}</b> · ${plural(m.scoredAreas,'area')} of 7 scored · ${num(m.counts.met)} met, ${num(m.counts.partial)} partly, ${num(m.counts.missing)} missing${m.counts.na?`, ${num(m.counts.na)} not in this topology`:''}</p>`+
  `<p class="rd234Note">The explorer’s checklist, read from this topology: met counts 1, partly 0.5, missing 0. Each area is the average of its checks, the score the average of the areas with something to check. 80 or more reads as ready, under 50 as not ready.</p></div>`+
  `<div class="rd234Tools"><button type="button" data-rd234-dl="json">Download JSON</button><button type="button" data-rd234-dl="csv">Download CSV</button></div></div>`+
  `<div class="rd234Areas" role="group" aria-label="Areas: choose one to show its checks"><button type="button" class="rd234Area all${RD.area==='all'?' on':''}" data-rd234-area="all" aria-pressed="${RD.area==='all'}"><span class="rd234AreaName">All areas</span></button>${areaRows(m,true)}</div>`+
  `<div class="rd234Filter" role="group" aria-label="Checks to show"><button type="button" data-rd234-open="all" aria-pressed="${RD.open==='all'}">Every check</button><button type="button" data-rd234-open="open" aria-pressed="${RD.open==='open'}">Only what’s left to do</button></div>`+sections;
 if(focus>=0)[...readinessPanel.querySelectorAll('button,a,input,select')][focus]?.focus()}
if(readinessPanel){
 readinessPanel.addEventListener('click',event=>{
  const t=event.target.closest('button');if(!t)return;
  if(t.dataset.rd234Area){RD.area=t.dataset.rd234Area;renderReadinessPanel();return}
  if(t.dataset.rd234Open){RD.open=t.dataset.rd234Open;renderReadinessPanel();return}
  if(t.dataset.rd234Dl==='json')return download('topology-readiness.json',readinessJson(),'application/json');
  if(t.dataset.rd234Dl==='csv')return download('topology-readiness.csv',readinessCsv(),'text/csv');
  if(t.dataset.rd234Show){const id=Number(t.dataset.rd234Show);if(typeof issueNavReveal==='function')issueNavReveal({nodeId:id});else state.builderSelected=id;if(typeof closeBuilderDrawer==='function')closeBuilderDrawer();else renderBuilder()}})}

// ---- The Inspector's Topology tab: a Readiness card after Contents.
let readinessCard=null;
function ensureReadinessCard(){
 if(readinessCard?.isConnected)return readinessCard;
 const topo=document.querySelector('.itopo199');if(!topo)return null;
 const contents=[...topo.querySelectorAll(':scope>.card199')].find(c=>c.querySelector('h4')?.textContent.trim()==='Contents');
 readinessCard=document.createElement('div');readinessCard.className='card199 rd234Card';
 readinessCard.innerHTML='<h4>Readiness</h4><div class="rd234Mini"></div><dl class="rd234Bars"></dl><div class="row199"><button type="button" class="btn199" data-rd234-review>Review readiness</button></div>';
 readinessCard.querySelector('[data-rd234-review]').addEventListener('click',()=>openBuilderDrawer('readiness'));
 if(contents)contents.after(readinessCard);else topo.prepend(readinessCard);return readinessCard}
function renderReadinessCard(){
 const card=ensureReadinessCard();if(!card||!card.checkVisibility?.())return;
 const m=readinessModel(),s=m.score==null?'—':round(m.score),sig=JSON.stringify([s,m.band,m.areas.map(a=>round(a.score))]);if(card.dataset.sig===sig)return;card.dataset.sig=sig;
 card.querySelector('.rd234Mini').innerHTML=`<strong>${s}</strong><span>/ 100</span><b class="rd234Band" data-band="${m.band}">${BAND_TEXT[m.band]}</b>`;
 card.querySelector('.rd234Bars').innerHTML=areaRows(m,false)}

if(canDrawer){
 const flagsBefore234=setDrawerFlags;
 setDrawerFlags=function(kind){flagsBefore234(kind);for(const [k,panel] of Object.entries(PANELS))panel.hidden=k!==kind;if(kind==='readiness'){delete readinessPanel.dataset.sig;renderReadinessPanel()}if(kind==='patterns'&&typeof renderPatternsPanel==='function'){delete PANELS.patterns?.dataset.sig;renderPatternsPanel()}};
 addMenuItem('Validate','Readiness','Rules',()=>openBuilderDrawer('readiness'));
 addPhoneLaunch('readiness','Readiness');
}
// ---- Login walkthrough: one sign-in, from a User / Administrator through its provider (or Splunk's own accounts) to the
// component, in six steps: identity, provider and MFA, Splunk's login, roles, session and audit. A scenario either signs
// in, or stops where a real failure stops it. What was seen on Splunk 10.6 says so; the rest is Splunk's documentation.
const LW={key:null,scenario:'success',step:0,playing:false};
let lwTimer=null;
function loginPaths(){
 const auth=state.builderAuthRelations||[],out=[];
 for(const user of state.builderNodes.filter(n=>n.type==='authUser'))for(const first of auth.filter(r=>r.from===user.id)){
  const mid=nodeOf(first.to);if(!mid||mid.type==='authUser')continue;
  if(isAuthProviderType(mid.type)){for(const second of auth.filter(r=>r.from===mid.id)){const target=nodeOf(second.to);if(target&&!isAuthProviderType(target.type)&&target.type!=='authUser')out.push({key:`${user.id}:${mid.id}:${target.id}`,user,provider:mid,target,toProvider:first,toTarget:second})}}
  else out.push({key:`${user.id}:0:${mid.id}`,user,provider:null,target:mid,toProvider:null,toTarget:first})}
 return out}
// With no sign-in path drawn, a sample one that isn't in the topology.
const SAMPLE_PATH={key:'sample',sample:true,user:{type:'authUser',instanceName:'Administrator',displayName:'Administrator',persona:'Splunk platform administrator'},
 provider:{type:'authProviderCloud',instanceName:'Cloud identity provider',providerProtocol:'SAML SSO',providerMfa:'enforced'},target:{type:'search',instanceName:'Search Head'},
 toProvider:{method:'SAML SSO',mfa:'enforced',accessRoute:'Privileged access workstation + VPN',auditEvidence:''},
 toTarget:{method:'SAML SSO',mfa:'enforced',roleMapping:['admin'],sessionMinutes:30,endpoint:'Splunk Web :8000',accessRoute:'Privileged access workstation + VPN',auditEvidence:''}};
const pname=o=>o?(state.builderNodes.includes(o)?name(o):o.instanceName||o.displayName||builderComponents[o.type]?.name||''):'';
function methodOf(p){const m=String(p.toTarget?.method||p.toProvider?.method||p.provider?.providerProtocol||'Local Splunk account');return /saml/i.test(m)?'saml':/ldap/i.test(m)?'ldap':'native'}
const methodText={saml:'SAML single sign-on',ldap:'LDAP',native:'a Splunk account'};
const mfaOf=p=>String(p.toProvider?.mfa||p.toTarget?.mfa||p.provider?.providerMfa||'unknown');
const rolesOf=p=>(p.toTarget?.roleMapping||[]).length?p.toTarget.roleMapping:p.provider?[]:['user'];
// Each scenario: the step it stops at (or warns at), and the methods it applies to.
const SCENARIOS={
 success:{label:'Signs in',methods:['saml','ldap','native']},
 password:{label:'Wrong password',methods:['ldap','native'],at:1,how:'fail',seen:true},
 locked:{label:'Locked out after five tries',methods:['native'],at:1,how:'fail',seen:true},
 'mfa-denied':{label:'Second factor refused',methods:['saml','ldap','native'],at:1,how:'fail'},
 'mfa-down':{label:'Duo or RSA unreachable',methods:['ldap','native'],at:1,how:'fail'},
 'idp-down':{label:'Identity provider unreachable',methods:['saml','ldap'],at:1,how:'fail'},
 skew:{label:'Assertion outside its time window',methods:['saml'],at:2,how:'fail'},
 norole:{label:'No group maps to a role',methods:['saml','ldap'],at:3,how:'fail'},
 index:{label:'Searches an index the roles don’t allow',methods:['saml','ldap','native'],at:3,how:'warn',seen:true},
 capability:{label:'Lacks a capability',methods:['saml','ldap','native'],at:3,how:'warn',seen:true},
 expired:{label:'Session expires',methods:['saml','ldap','native'],at:4,how:'fail',seen:true}};
function loginModel(){
 const paths=loginPaths(),path=paths.find(p=>p.key===LW.key)||paths[0]||SAMPLE_PATH;LW.key=path.key;
 const method=methodOf(path),mfa=mfaOf(path),roles=rolesOf(path),scenarios=Object.entries(SCENARIOS).filter(([,s])=>s.methods.includes(method)).map(([id,s])=>({id,...s}));
 if(!scenarios.some(s=>s.id===LW.scenario))LW.scenario='success';
 const sc=SCENARIOS[LW.scenario],user=path.user,who=user.displayName||pname(user),target=pname(path.target),prov=path.provider?pname(path.provider):method==='native'?'':String(path.toTarget?.identityProvider||'').trim()||'the identity provider',endpoint=path.toTarget?.endpoint||'Splunk Web';
 const mfaOn=['enforced','inherited'].includes(mfa),session=Number(path.toTarget?.sessionMinutes)||null,audit=String(path.toTarget?.auditEvidence||path.toProvider?.auditEvidence||path.provider?.providerAudit||'').trim();
 const S=[];const step=(key,title,component,text,config,records,src)=>S.push({key,title,component,text,config,records,src});
 // 1. Identity
 step('identity','Who signs in',who,`${who}${user.persona?`, ${user.persona},`:''} opens ${target}. Endpoint: ${endpoint}.${path.toTarget?.accessRoute?` Access route: ${path.toTarget.accessRoute}.`:''} The path signs in with ${methodText[method]}${prov?` at ${prov}`:''}.`,
  'The Access link: endpoint, access route and method','Nothing yet',null);
 // 2. Provider and MFA
 const mfaNote=mfa==='enforced'?'MFA is enforced on this path.':mfa==='inherited'?'MFA comes from the provider’s own policy on this path.':mfa==='not-enforced'?'MFA isn’t enforced on this path: Validate › Rules, AR-005, fails.':'MFA isn’t recorded on this path: Validate › Rules, AR-005, asks for it.';
 if(method==='saml')step('idp','Identity provider and MFA',prov,`${target} sends the browser to ${prov}’s sign-in page (idpSSOUrl) with a SAML request, signed by default (signAuthnRequest). ${prov} checks the password and its own second factor, then posts a signed assertion back. ${mfaNote} Splunk’s own Duo MFA can’t be used with SAML: here the second factor is the provider’s.`,
  'authentication.conf, the SAML stanza: idpSSOUrl, entityId, signAuthnRequest','The provider’s own sign-in log',['saml','duo']);
 else if(method==='ldap')step('idp','Directory and MFA',prov,`${target} checks the password against ${prov} over LDAP (an LDAP strategy in authentication.conf)${mfaOn?', then asks Duo or RSA for the second factor (externalTwoFactorAuthVendor)':''}. ${mfaNote}`,
  'authentication.conf: the LDAP strategy; externalTwoFactorAuthVendor for Duo or RSA','splunkd.log on a failure',['authentication','duo']);
 else step('idp','Password and MFA',target,`${target} checks the password against its own accounts${mfaOn?', then asks Duo or RSA for the second factor (externalTwoFactorAuthVendor)':''}. Five wrong passwords within 5 minutes lock the account for 30 minutes (lockoutAttempts, lockoutThresholdMins, lockoutMins). ${mfaNote}`,
  'authentication.conf [splunk_auth]: lockoutUsers, lockoutAttempts, lockoutThresholdMins, lockoutMins','_audit on a failure',['authentication']);
 // 3. Splunk's login
 if(method==='saml')step('login','Splunk checks the assertion',target,`Splunk checks the assertion’s signature with the provider’s certificate (unless signedAssertion is false), and that its NotBefore and NotOnOrAfter window holds, allowing 120 seconds of clock difference (assertionTimeSkew). Splunk uses the username in lowercase with the provider.`,
  'authentication.conf, the SAML stanza: signedAssertion, assertionTimeSkew','splunkd.log (_internal) on a refusal',['authentication','saml']);
 else if(method==='ldap')step('login','Splunk accepts the directory’s answer',target,`The directory accepts the password, and Splunk reads the user’s groups from it.`,'authentication.conf: the LDAP strategy’s group settings','',['authentication']);
 else step('login','Splunk opens the account',target,`The password matches. A successful login clears the failed attempts (seen on Splunk 10.6: alternating wrong and right passwords never locked the account).`,'authentication.conf [splunk_auth]','',['authentication']);
 // 4. Roles
 const roleText=roles.length?roles.join(', '):'none recorded';
 step('roles','Roles and what they allow',target,(method==='native'?`The account’s own roles apply: ${roleText}.`:method==='saml'?`The assertion’s groups map to Splunk roles ([roleMap_SAML]); unless automapping is off, a group with a role’s own name maps to it. This path maps to: ${roleText}.`:`The directory groups map to Splunk roles ([roleMap_<strategy>]). This path maps to: ${roleText}.`)+' Each role grants its capabilities and the indexes it may search (srchIndexesAllowed).',
  method==='native'?'authorize.conf: each role’s capabilities and srchIndexesAllowed':'authentication.conf [roleMap_…]; authorize.conf: capabilities and srchIndexesAllowed','_audit: every capability check',[method==='saml'?'samlRoles':'authentication','authorize']);
 // 5. Session
 step('session','Session',target,`Splunk Web keeps the session for 60 minutes without activity (tools.sessions.timeout), and a REST session key lasts 1 hour (sessionTimeout).${session?` This path’s Access link records ${session} minutes as its policy.`:''}`,
  'web.conf: tools.sessions.timeout, ui_inactivity_timeout; server.conf: sessionTimeout','',['web','server']);
 // 6. Audit
 step('audit','Audit record','_audit',`${target} writes the sign-in to the _audit index: ${method==='native'?'action=login attempt, info=succeeded, reason=user-initiated, with the client address and method=Splunk (the audittrail format), and action=login_attempt (audittrailv2), as seen on Splunk 10.6':'a login attempt for the user, as for every sign-in'}. Review them with: index="_audit" action=log* action="login attempt". ${audit?`This path names its evidence: ${audit}.`:'This path doesn’t name its audit evidence yet.'}`,
  '_audit; $SPLUNK_HOME/var/log/splunk/audit.log','_audit: the login attempt',['audit','auditSearch']);
 // The scenario: what stops or warns, what the person sees, what Splunk records.
 const F={password:{see:'“Login failed” (401 on the REST API).',records:method==='native'?'_audit: action=login attempt, info=failed. splunkd.log: “Login failed. Incorrect login for user” (seen on Splunk 10.6).':'_audit: a failed login attempt.',fix:method==='native'?'The person retries with the right password; five wrong ones in 5 minutes lock the account.':'The person retries with the right password; the directory’s own lockout policy applies.'},
  locked:{see:'The same “Login failed”, even with the right password: the person isn’t told the account is locked.',records:'_audit: action=login attempt locked out user, info=failed. splunkd.log: “Max login attempts reached. Locking out user.”',fix:'An admin unlocks the account in Settings › Users, or it unlocks after lockoutMins (30). On a search head cluster each member keeps its own count.'},
  'mfa-denied':{see:method==='saml'?'The provider’s refusal; no assertion reaches Splunk.':'The sign-in fails at the second factor.',records:method==='saml'?'Nothing in Splunk for this attempt: the refusal is in the provider’s sign-in log.':'A failed sign-in.',fix:'The person approves the second factor, or enrols a device with the provider.'},
  'mfa-down':{see:'The sign-in fails while Duo or RSA can’t be reached.',records:'A failed sign-in.',fix:'failOpen decides: false (the default) refuses the sign-in; true lets it in without the second factor. Restore the connection rather than failing open.'},
  'idp-down':{see:method==='saml'?'The browser can’t reach the provider’s sign-in page.':'Splunk can’t reach the directory.',records:'Nothing reaches the provider.',fix:method==='saml'?'Splunk and the browser must be able to reach the provider over the network; restore the route, and keep a break-glass account that doesn’t depend on it.':'Restore the route to the directory, and keep a break-glass account.'},
  skew:{see:'Splunk refuses the assertion.',records:'Look in splunkd.log (_internal) for the SAML error.',fix:'Synchronise the clocks (NTP) rather than raising assertionTimeSkew: Splunk warns that a high value allows replay attacks.'},
  norole:{see:'The sign-in ends without access.',records:'Look in splunkd.log (_internal) for the refusal.',fix:method==='saml'?'Map one of the person’s groups to a Splunk role: group mapping is the only way to give IdP users access. defaultRoleIfMissing gives a role when the provider sends no groups at all.':'Map one of the person’s directory groups to a Splunk role in the LDAP strategy’s role map.'},
  index:{see:'The sign-in works, but a search of an index the roles don’t allow returns no results, and no error (seen on Splunk 10.6).',records:'_audit records the search, as it records every search.',fix:'Add the index to a role’s srchIndexesAllowed, if the person should see it.'},
  capability:{see:'The sign-in works, but the action is refused: “You (user=…) do not have permission to perform this operation (requires capability: edit_user).” (403, seen on Splunk 10.6).',records:'_audit: action=edit_user, info=denied (seen on Splunk 10.6).',fix:'Give a role the capability, if the person should have it.'},
  expired:{see:'Splunk Web asks for a new sign-in; a REST client gets 401 “call not properly authenticated” (seen on Splunk 10.6 with a key left idle past its timeout).',records:'Nothing: the session simply ends.',fix:'The person signs in again. tools.sessions.timeout and sessionTimeout set how long a session lasts.'}};
 S.forEach((s,i)=>{s.status=!sc.at&&sc.at!==0?'ok':i<sc.at?'ok':i===sc.at?sc.how:sc.how==='warn'?'ok':'skipped'});
 const outcome=sc.at==null?{see:`${who} is signed in to ${target} with ${roles.length?roles.join(', '):'the account’s roles'}.`,records:'_audit: action=login attempt, info=succeeded, reason=user-initiated.',fix:''}:F[LW.scenario];
 if(sc.at!=null){const s=S[sc.at];s.problem=outcome}
 return {paths,path,prov,sample:!!path.sample,method,mfa,roles,scenarios,scenario:LW.scenario,steps:S,outcome,seen:!!sc.seen,at:sc.at??null}}
function loginJson(m=loginModel()){
 return JSON.stringify({schema:'splunk-pipeline-explorer/login-walkthrough',version:1,generatedAt:new Date().toISOString(),path:{user:pname(m.path.user),provider:m.path.provider?pname(m.path.provider):null,component:pname(m.path.target),sample:m.sample},
  method:methodText[m.method],mfa:m.mfa,roles:m.roles,scenario:SCENARIOS[m.scenario].label,seenOnSplunk106:m.seen,
  steps:m.steps.map((s,i)=>({step:i+1,title:s.title,component:s.component,status:s.status,what:s.text,configuration:s.config,records:s.records||null,problem:s.problem||null,sources:(s.src||[]).map(k=>SRC[k])})),outcome:m.outcome},null,2)}
// ---- Operate › Login walkthrough: after Event walkthrough, in the same style.
function stopLogin(){if(lwTimer){clearInterval(lwTimer);lwTimer=null}LW.playing=false}
const STEP_STATE=['Identity named','Credentials checked','Signed in','Roles applied','Session open','Recorded in _audit'];
function loginStateAfter(m,i){
 const s=m.steps[i];if(s.status==='skipped')return 'Not reached';
 if(s.status==='fail')return {idp:'Refused before Splunk opens a session',login:'Refused: no session',roles:'Refused: no role, no session',session:'Session ended: sign in again'}[s.key]||'Stopped here';
 if(s.status==='warn')return 'Signed in; this action is refused';
 return STEP_STATE[i]}
function renderLoginWalkthrough(){
 const root=$('#operationsContent');if(!root)return;
 const m=loginModel();LW.step=Math.max(0,Math.min(LW.step,m.steps.length-1));const s=m.steps[LW.step],sc=SCENARIOS[m.scenario];
 const label=p=>`${pname(p.user)} → ${p.provider?pname(p.provider)+' → ':''}${pname(p.target)}`;
 const paths=m.paths.length?m.paths.map(p=>`<option value="${esc(p.key)}" ${p.key===m.path.key?'selected':''}>${esc(label(p))}</option>`).join(''):`<option value="sample" selected>Sample: ${esc(label(SAMPLE_PATH))} (not in the topology)</option>`;
 const scen=m.scenarios.map(x=>`<option value="${x.id}" ${x.id===m.scenario?'selected':''}>${esc(x.label)}</option>`).join('');
 const chips=[['user',m.path.user,'User / Administrator'],...(m.path.provider?[['provider',m.path.provider,methodText[m.method]]]:m.prov?[['provider',{type:'authProviderOnPrem',instanceName:m.prov},`${methodText[m.method]} · not drawn as a component`]]:[]),['target',m.path.target,m.roles.length?`Roles: ${m.roles.join(', ')}`:'Roles from the account']];
 const current=s.key==='identity'?'user':s.key==='idp'&&m.prov?'provider':s.key==='audit'?'audit':'target';
 const strip=chips.map(([k,n,sub])=>`<li class="lw234Node${current===k?' current':''}" style="--lw:${builderComponents[n.type]?.color||'#57c7e8'}"><strong>${esc(pname(n))}</strong><small>${esc(sub)}</small></li>`).join('<li class="lw234Arrow" aria-hidden="true">→</li>')+`<li class="lw234Arrow" aria-hidden="true">→</li><li class="lw234Node${current==='audit'?' current':''}" style="--lw:#8fb2c4"><strong>_audit</strong><small>Sign-in record</small></li>`;
 const dots=m.steps.map((x,i)=>`${i?`<span class="walkLine ${i<=LW.step?'done':''}"></span>`:''}<button type="button" class="walkDot lw234Dot ${i<LW.step?'done':i===LW.step?'current':''}" data-status="${x.status}" data-lw234-step="${i}" title="${esc(`${i+1}. ${x.title}`)}" aria-label="${esc(`Step ${i+1}: ${x.title}, ${x.status==='ok'?'passes':x.status==='fail'?'stops here':x.status==='warn'?'refuses the action':'not reached'}`)}">${i+1}</button>`).join('');
 const problem=s.problem?`<div class="lw234Problem" data-how="${s.status}"><h4>${s.status==='warn'?'Signed in, but refused here':'The sign-in stops here'}: ${esc(sc.label)}</h4><dl><dt>What the person sees</dt><dd>${esc(s.problem.see)}</dd><dt>What’s recorded</dt><dd>${esc(s.problem.records)}</dd><dt>To fix</dt><dd>${esc(s.problem.fix)}</dd></dl></div>`:'';
 const srcs=(s.src||[]).map(k=>link(k,{authentication:'authentication.conf',authorize:'authorize.conf',web:'web.conf',server:'server.conf',saml:'Configure single sign-on with SAML',samlRoles:'Map SAML groups to Splunk roles',duo:'Multifactor authentication with Duo',audit:'Auditing activities',auditSearch:'Search the audit log'}[k]||k)).join(' · ');
 const outcome=m.at==null?`<b class="lw234Result ok">Signs in</b> ${esc(m.outcome.see)}`:`<b class="lw234Result ${m.steps[m.at].status}">${m.steps[m.at].status==='warn'?'Signs in, action refused':'Stops at step '+(m.at+1)}</b> ${esc(sc.label)}.`;
 root.innerHTML=`<div class="opsHero"><div><small>Login walkthrough</small><h2>Follow one sign-in from the person to the audit record</h2><p>Uses the topology’s sign-in paths on the User access plane: User / Administrator → Authentication Provider → component. Choose what happens, then step through it.</p></div><div class="opsControls"><button class="builderBtn" id="lw234Edit">Edit topology</button><button class="builderBtn primary" id="lw234Export">Download walkthrough</button></div></div>`+
  `<div class="lw234Setup"><label>Sign-in path<select id="lw234Path">${paths}</select></label><label>What happens<select id="lw234Scenario">${scen}</select></label>`+
  (m.sample?`<p class="lw234Sample">The topology has no sign-in path yet, so this is a sample. <button type="button" class="builderBtn" id="lw234AddPath">Add this sign-in path to the topology</button></p>`:'')+`</div>`+
  `<ol class="lw234Strip" aria-label="Sign-in path">${strip}</ol>`+
  `<div class="lw234Outcome" role="status">${outcome}${m.seen?' <span class="lw234Seen">Seen on Splunk 10.6</span>':''}</div>`+
  `<div class="walkProgress lw234Progress" aria-label="Sign-in steps">${dots}</div>`+
  `<div class="walkStage lw234Stage"><article class="walkStageInfo" data-status="${s.status}" style="--walk:${builderComponents[s.key==='idp'&&m.path.provider?m.path.provider.type:s.key==='identity'?'authUser':m.path.target.type]?.color||'#57c7e8'}"><small>Step ${LW.step+1} of ${m.steps.length} · ${esc(s.component)}</small><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`+
  `<div class="walkFacts"><div class="walkFact"><small>Configuration</small><strong>${esc(s.config)}</strong></div><div class="walkFact"><small>Where it shows</small><strong>${esc(s.records||'—')}</strong></div><div class="walkFact"><small>After this step</small><strong>${esc(loginStateAfter(m,LW.step))}</strong></div></div>${problem}${srcs?`<p class="lw234Src">From: ${srcs}</p>`:''}</article></div>`+
  `<div class="walkControls"><button type="button" id="lw234First" ${LW.step===0?'disabled':''}>Reset</button><button type="button" id="lw234Prev" ${LW.step===0?'disabled':''}>Previous</button><button type="button" class="primary" id="lw234Play">${LW.playing?'Pause':'Play'}</button><button type="button" id="lw234Next" ${LW.step===m.steps.length-1?'disabled':''}>Next</button><span>${esc(s.title)}</span></div>`+
  `<div class="walkDisclaimer"><strong>What this rests on:</strong> Splunk’s documentation for SAML, LDAP, MFA, roles, sessions and audit, linked at each step. A Splunk account’s sign-in, its failures and lockout, an index and a capability the role lacks, and a session that timed out were tried on Splunk Enterprise 10.6; SAML, LDAP and MFA weren’t, as no identity provider was available.</div>`;
 $('#lw234Path').onchange=e=>{stopLogin();LW.key=e.target.value;LW.step=0;renderLoginWalkthrough()};
 $('#lw234Scenario').onchange=e=>{stopLogin();LW.scenario=e.target.value;LW.step=0;renderLoginWalkthrough()};
 root.querySelectorAll('[data-lw234-step]').forEach(b=>b.onclick=()=>{stopLogin();LW.step=Number(b.dataset.lw234Step);renderLoginWalkthrough()});
 $('#lw234First').onclick=()=>{stopLogin();LW.step=0;renderLoginWalkthrough()};
 $('#lw234Prev').onclick=()=>{stopLogin();LW.step=Math.max(0,LW.step-1);renderLoginWalkthrough()};
 $('#lw234Next').onclick=()=>{stopLogin();LW.step=Math.min(m.steps.length-1,LW.step+1);renderLoginWalkthrough()};
 $('#lw234Play').onclick=()=>{if(LW.playing){stopLogin();renderLoginWalkthrough();return}LW.playing=true;if(LW.step>=m.steps.length-1)LW.step=0;renderLoginWalkthrough();
  lwTimer=setInterval(()=>{if(state.view!=='operations'||state.operationsView!=='login-walkthrough'){stopLogin();return}const next=loginModel();if(LW.step>=next.steps.length-1||next.steps[LW.step].status==='fail'){stopLogin();renderLoginWalkthrough();return}LW.step++;renderLoginWalkthrough()},1300)};
 $('#lw234Edit').onclick=()=>{stopLogin();switchView('builder')};
 $('#lw234Export').onclick=()=>download('splunk-login-walkthrough.json',loginJson(),'application/json');
 const add=$('#lw234AddPath');if(add)add.onclick=()=>{const ids=insertPattern(BUILTIN.find(p=>p.id==='sign-in'));if(ids?.length){const user=ids.map(nodeOf).find(n=>n?.type==='authUser');LW.key=loginPaths().find(p=>p.user===user)?.key||null;LW.step=0;renderLoginWalkthrough()}}}

// Operate's menu: Login walkthrough after Event walkthrough.
const opsEvent=document.querySelector('.operationsNav [data-operations-view="walkthrough"]');
if(opsEvent){const b=document.createElement('button');b.type='button';b.dataset.operationsView='login-walkthrough';b.textContent='Login walkthrough';b.className=opsEvent.className.replace(/\bactive\b/,'').trim();
 b.onclick=()=>{state.operationsView='login-walkthrough';renderOperations()};opsEvent.after(b)}
const renderOperationsBefore234=renderOperations;
renderOperations=function(...args){
 if(state.operationsView!=='login-walkthrough'){stopLogin();return renderOperationsBefore234.apply(this,args)}
 $$('.operationsNav button').forEach(b=>b.classList.toggle('active',b.dataset.operationsView===state.operationsView));renderLoginWalkthrough()};
// The Builder: a User / Administrator's Access tab offers its sign-in walkthrough.
function syncWalkButton(){
 const box=document.getElementById('builderAuthenticationInspector'),node=nodeOf(state.builderSelected),show=!!box&&node?.type==='authUser'&&!state.builderSelectedEdge;
 let wrap=document.querySelector('.lw234WalkBox');
 if(!show){wrap?.remove();return}
 if(!wrap||!box.contains(wrap)){wrap?.remove();wrap=document.createElement('div');wrap.className='lw234WalkBox';wrap.dataset.it199='access';
  wrap.innerHTML='<strong>Login walkthrough</strong><p></p><button type="button" class="btn199 lw234Walk">Walk through this sign-in</button>';
  wrap.querySelector('button').addEventListener('click',()=>{const user=nodeOf(state.builderSelected),p=loginPaths().find(x=>x.user===user);LW.key=p?.key||null;LW.step=0;LW.scenario='success';state.operationsView='login-walkthrough';switchView('operations');renderOperations()});box.append(wrap)}
 const has=loginPaths().filter(x=>x.user===node),b=wrap.querySelector('button');b.disabled=!has.length;
 wrap.querySelector('p').textContent=has.length?`Follow ${name(node)}’s sign-in step by step, from the provider to the _audit record: ${plural(has.length,'path')}.`:'Draw an Access link from this user to a provider or a component, then follow the sign-in step by step.'}
// ---- Patterns: reusable component groups. A pattern is its components (type, parent within the pattern, settings and
// references to each other) and the Fleet, Access and extra event links among them. Built-in patterns ship here; saved
// ones stay in this browser and download as JSON. Inserting one is one change in the Builder's history.
const PATTERN_SCHEMA='splunk-pipeline-explorer/component-patterns';
const STORE='splunkPipelineExplorer.patterns234';
const REF_KEYS=['shcClusterId','shcDeployerId','shcCaptainId','indexClusterId','indexClusterManagerId','streamServerId','soarInstanceId'];
const REF_LIST_KEYS=['indexClusterSearchTierIds'];
const SKIP_KEYS=['id','type','parent','groupId','relationshipRouting','eventStatus'];
const member=k=>({k,type:'shcMember',refs:{shcClusterId:'c'}}),peer=k=>({k,type:'idx',refs:{indexClusterId:'c'}});
const BUILTIN=[
 {id:'syslog-uf-indexer',name:'Syslog → UF → Indexer',description:'A Syslog Server that writes what it receives to files, a Universal Forwarder that reads them, and an Indexer. Insert it after a Syslog Source, or on its own.',
  nodes:[{k:'s',type:'syslog'},{k:'f',type:'uf',parent:'s'},{k:'i',type:'idx',parent:'f'}]},
 {id:'regional-ds',name:'Regional Deployment Server tier',description:'A Tier 1 Deployment Server that manages two regional Deployment Servers, as the Multi-DS overview’s sample does.',
  nodes:[{k:'t',type:'ds',props:{instanceName:'Tier 1 Deployment Server'}},{k:'a',type:'ds',props:{instanceName:'Regional Deployment Server A'}},{k:'b',type:'ds',props:{instanceName:'Regional Deployment Server B'}}],management:[{from:'t',to:'a'},{from:'t',to:'b'}]},
 {id:'shc',name:'Search Head Cluster',description:'Three members, the first its captain, and a deployer on an instance of its own: Splunk asks for at least three members for highly available search.',
  nodes:[{k:'c',type:'shcCluster',refs:{shcDeployerId:'d',shcCaptainId:'m1'}},member('m1'),member('m2'),member('m3'),{k:'d',type:'shcDeployer'}]},
 {id:'indexer-cluster',name:'Indexer cluster',description:'An Indexer Cluster Manager, the cluster at a replication factor of 3 and a search factor of 2 (Splunk’s defaults), and three peers.',
  nodes:[{k:'m',type:'indexerClusterManager'},{k:'c',type:'indexerCluster',refs:{indexClusterManagerId:'m'},props:{indexClusterRf:3,indexClusterSf:2}},peer('p1'),peer('p2'),peer('p3')]},
 {id:'sign-in',name:'Sign-in path',description:'A User / Administrator who signs in to a Search Head through a cloud identity provider with SAML, MFA enforced and the admin role mapped: Operate › Login walkthrough follows it.',
  nodes:[{k:'u',type:'authUser'},{k:'p',type:'authProviderCloud',props:{providerMfa:'enforced'}},{k:'s',type:'search'}],auth:[{from:'u',to:'p',props:{mfa:'enforced'}},{from:'p',to:'s',props:{mfa:'enforced',roleMapping:['admin']}}]}];
const typeName=t=>builderComponents[t]?.name||t;
const patternChain=p=>{const counts=new Map();for(const n of p.nodes)counts.set(n.type,(counts.get(n.type)||0)+1);return [...counts].map(([t,c])=>c>1?`${c} × ${typeName(t)}`:typeName(t)).join(' · ')};
const linkCount=p=>(p.management||[]).length+(p.auth||[]).length+(p.data||[]).length+p.nodes.filter(n=>n.parent).length;
const roleCount=p=>p.nodes.reduce((s,n)=>s+Object.values(n.refs||{}).flat().length,0);
const patternLinks=p=>[linkCount(p)&&plural(linkCount(p),'link'),roleCount(p)&&'cluster roles kept'].filter(Boolean).join(' · ')||'no links';
function validPattern(p){return !!p&&typeof p==='object'&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=120&&Array.isArray(p.nodes)&&p.nodes.length>0&&p.nodes.length<=200&&
 p.nodes.every(n=>n&&typeof n.k==='string'&&!!builderComponents[n.type]&&(n.parent==null||p.nodes.some(m=>m.k===n.parent)))&&['management','auth','data'].every(k=>p[k]==null||(Array.isArray(p[k])&&p[k].every(r=>r&&p.nodes.some(n=>n.k===r.from)&&p.nodes.some(n=>n.k===r.to))))}
function savedPatterns(){try{const v=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(v)?v.filter(validPattern):[]}catch{return []}}
function storePatterns(list){try{localStorage.setItem(STORE,JSON.stringify(list));return true}catch{return false}}
const generatedName=(n)=>new RegExp(`^${typeName(n.type).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')} \\d+$`).test(String(n.instanceName||''));
// The selected components as a pattern: parents first, references to each other kept, to anything else dropped.
function capturePattern(ids,patternName){
 const set=new Set(ids.map(Number)),chosen=state.builderNodes.filter(n=>set.has(n.id)),order=[],seen=new Set();
 const visit=n=>{if(!n||seen.has(n.id))return;seen.add(n.id);if(n.parent!=null&&set.has(n.parent))visit(nodeOf(n.parent));order.push(n)};chosen.forEach(visit);
 const key=new Map(order.map((n,i)=>[n.id,'n'+(i+1)]));
 const nodes=order.map(n=>{const props={},refs={};
  for(const [k,v] of Object.entries(n)){if(SKIP_KEYS.includes(k))continue;
   if(REF_KEYS.includes(k)){if(v!=null&&key.has(v))refs[k]=key.get(v);continue}
   if(REF_LIST_KEYS.includes(k)){if(Array.isArray(v)&&v.some(x=>key.has(x)))refs[k]=v.filter(x=>key.has(x)).map(x=>key.get(x));continue}
   if(k==='instanceName'&&generatedName(n))continue;
   if(k==='relationshipDetails'&&!(n.parent!=null&&key.has(n.parent)))continue;
   props[k]=JSON.parse(JSON.stringify(v))}
  return {k:key.get(n.id),type:n.type,parent:n.parent!=null&&key.has(n.parent)?key.get(n.parent):null,props,refs}});
 const rel=list=>list.filter(r=>key.has(r.from)&&key.has(r.to)).map(r=>({from:key.get(r.from),to:key.get(r.to),props:Object.fromEntries(Object.entries(r).filter(([k])=>!['id','from','to'].includes(k)).map(([k,v])=>[k,JSON.parse(JSON.stringify(v))]))}));
 return {id:'saved-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:String(patternName).trim().slice(0,120),savedAt:new Date().toISOString(),nodes,
  management:rel((state.builderRelations||[]).filter(r=>(r.plane||'management')==='management')),auth:rel(state.builderAuthRelations||[]),data:rel(state.builderDataRelations||[])}}
// The pattern's first component can follow the selected one when the Builder allows that event link.
const attachable=(p,target)=>!!target&&!p.nodes[0].parent&&(builderDataCapabilities[target.type]||[]).includes(p.nodes[0].type);
// A click inside the Builder is already recorded by its history (captureBuilderMutation), which takes the change's name
// from the button's data-history-label; elsewhere (the Login walkthrough's button) the insert records itself.
if(typeof builderHistoryHint==='function'){const hintBefore234=builderHistoryHint;builderHistoryHint=function(target){const el=target?.closest?.('[data-history-label]');return el?el.dataset.historyLabel:hintBefore234(target)}}
function insertPattern(p,{attachTo=null,record=true}={}){
 if(!validPattern(p))return null;
 const before=builderHistorySnapshot(),plane=state.builderPlane,map=new Map(),added=[];
 builderHistory.suppress++;
 try{
  state.builderPlane='all'; // on the Fleet plane a new component links to the selection instead of its parent
  for(const pn of p.nodes){
   const parent=pn.parent!=null?map.get(pn.parent):pn===p.nodes[0]&&attachTo!=null?attachTo:null,ids=new Set(state.builderNodes.map(n=>n.id));
   addBuilderNode(pn.type,parent??null);
   const node=state.builderNodes.find(n=>!ids.has(n.id));if(!node)throw new Error(`The Builder refused a ${typeName(pn.type)}.`);
   map.set(pn.k,node.id);added.push([pn,node])}
  for(const [pn,node] of added){
   for(const [k,v] of Object.entries(pn.props||{}))if(!SKIP_KEYS.includes(k)&&!REF_KEYS.includes(k)&&!REF_LIST_KEYS.includes(k))node[k]=JSON.parse(JSON.stringify(v));
   for(const k of REF_KEYS)if(k in node||pn.refs?.[k]!=null)node[k]=pn.refs?.[k]!=null?map.get(pn.refs[k])??null:null;
   for(const k of REF_LIST_KEYS)if(pn.refs?.[k])node[k]=pn.refs[k].map(x=>map.get(x)).filter(x=>x!=null)}
  const patch=(list,from,to,props)=>{const r=[...list].reverse().find(x=>x.from===from&&x.to===to);if(r&&props)for(const [k,v] of Object.entries(props))if(!['id','from','to','plane'].includes(k))r[k]=JSON.parse(JSON.stringify(v))};
  for(const r of p.management||[]){const a=map.get(r.from),b=map.get(r.to);if(addManagementRelation(a,b))patch(state.builderRelations,a,b,r.props)}
  for(const r of p.auth||[]){const a=map.get(r.from),b=map.get(r.to);if(addAuthenticationRelation(a,b))patch(state.builderAuthRelations,a,b,r.props)}
  for(const r of p.data||[]){const a=map.get(r.from),b=map.get(r.to),made=createAdditionalDataRelation(a,b);if(made)patch(state.builderDataRelations,a,b,r.props)}
 }catch(error){
  // Undo what was added, and say why.
  const ids=new Set(added.map(([,n])=>n.id));state.builderNodes=state.builderNodes.filter(n=>!ids.has(n.id));
  for(const k of ['builderRelations','builderAuthRelations','builderDataRelations'])state[k]=(state[k]||[]).filter(r=>!ids.has(r.from)&&!ids.has(r.to));
  state.builderPlane=plane;builderHistory.suppress--;builderStatus(`${p.name} wasn’t inserted: ${error.message}`,'error');renderBuilder();return null}
 state.builderPlane=plane;builderHistory.suppress--;
 const ids=added.map(([,n])=>n.id);state.builderMultiSelected=[...ids];state.builderSelected=ids[0];state.builderSelectedEdge=null;
 if(record)commitBuilderHistory(before,`Insert pattern ${p.name}`);renderBuilder();
 builderStatus(`Inserted ${p.name}: ${plural(ids.length,'component')}${attachTo!=null?` after ${name(nodeOf(attachTo))}`:''}. They’re selected.`);
 return ids}
function patternsFileText(list=savedPatterns()){return JSON.stringify({schema:PATTERN_SCHEMA,version:1,exportedAt:new Date().toISOString(),patterns:list},null,2)}
function readPatternsFile(text){
 let doc;try{doc=JSON.parse(text)}catch{throw new Error('The file isn’t JSON.')}
 const list=Array.isArray(doc)?doc:doc?.patterns;if(!Array.isArray(list))throw new Error('The file has no patterns.');
 if(doc&&!Array.isArray(doc)&&doc.schema&&doc.schema!==PATTERN_SCHEMA)throw new Error('This isn’t a Splunk Pipeline Explorer patterns file.');
 const good=list.filter(validPattern);if(!good.length)throw new Error('None of its patterns can be used.');
 return {good,skipped:list.length-good.length}}
// ---- Patterns in the drawer, and Edit › Patterns….
const PT={message:'',error:false};
const patternsPanel=addDrawerTab('patterns','Patterns','builderPatternsPanel234','pt234','templates');
const selectedIds=()=>{const multi=(state.builderMultiSelected||[]).map(Number).filter(id=>nodeOf(id));if(multi.length)return multi;const one=nodeOf(state.builderSelected);return one&&!state.builderSelectedEdge?[one.id]:[]};
function patternCard(p,saved){
 const target=nodeOf(state.builderSelected),attach=selectedIds().length===1&&attachable(p,target);
 return `<article class="pt234Card"><div class="pt234Text"><strong>${esc(p.name)}</strong>${p.description?`<p>${esc(p.description)}</p>`:''}<p class="pt234Chain">${esc(patternChain(p))} · ${esc(patternLinks(p))}</p>${saved&&p.savedAt?`<p class="pt234When">Saved ${esc(new Date(p.savedAt).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}))}</p>`:''}</div>`+
  `<div class="pt234Acts"><button type="button" data-pt234-insert="${esc(p.id)}" data-history-label="${esc(`Insert pattern ${p.name}`)}">Insert</button>${attach?`<button type="button" data-pt234-attach="${esc(p.id)}" data-history-label="${esc(`Insert pattern ${p.name}`)}">Insert after ${esc(name(target))}</button>`:''}${saved?`<button type="button" class="pt234Delete" data-pt234-delete="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">Delete</button>`:''}</div></article>`}
function renderPatternsPanel(){
 if(!patternsPanel||patternsPanel.hidden)return;
 const ids=selectedIds(),saved=savedPatterns(),target=nodeOf(state.builderSelected);
 const sig=JSON.stringify([ids,saved.map(p=>[p.id,p.name]),state.builderSelected,PT]);if(patternsPanel.dataset.sig===sig)return;patternsPanel.dataset.sig=sig;
 const typed=patternsPanel.querySelector('#pt234Name')?.value||'',focusId=document.activeElement&&patternsPanel.contains(document.activeElement)?document.activeElement.id||document.activeElement.dataset.pt234Insert||'':'';
 patternsPanel.innerHTML=`<div class="pt234Head"><h3>Patterns</h3><p>Groups of components to reuse: insert one, or save the components you’ve selected. A pattern keeps their settings and the links between them, not links to the rest of the topology. Inserting one is one change: Undo takes it out.</p></div>`+
  `<section class="pt234Save"><h4>Save the selection</h4>${ids.length?`<p>${plural(ids.length,'component')} selected: ${esc(listNames(ids.map(nodeOf),5))}.</p>`:'<p>Select components on the canvas first: Shift+click adds to the selection.</p>'}`+
  `<div class="pt234Row"><label for="pt234Name">Pattern name</label><input id="pt234Name" maxlength="120" autocomplete="off" placeholder="For example: Regional syslog collection" value="${esc(typed)}"><button type="button" id="pt234Save" ${ids.length?'':'disabled'}>Save pattern</button></div>`+
  (PT.message?`<p class="pt234Msg${PT.error?' error':''}" role="status">${esc(PT.message)}</p>`:'')+`</section>`+
  `<section class="pt234List"><h4>Built in</h4>${BUILTIN.map(p=>patternCard(p,false)).join('')}</section>`+
  `<section class="pt234List"><h4>Saved in this browser <span>${num(saved.length)}</span></h4>${saved.length?saved.map(p=>patternCard(p,true)).join(''):'<p class="pt234Empty">None yet. Saved patterns stay in this browser; download them to share or keep them.</p>'}`+
  `<div class="pt234Tools"><button type="button" id="pt234Download" ${saved.length?'':'disabled'}>Download saved patterns</button><label class="pt234Load">Load patterns from a file<input type="file" id="pt234File" accept=".json,application/json"></label></div></section>`;
 if(focusId){const el=patternsPanel.querySelector(`#${CSS.escape(focusId)}`)||patternsPanel.querySelector(`[data-pt234-insert="${CSS.escape(focusId)}"]`);el?.focus()}}
const findPattern=id=>BUILTIN.find(p=>p.id===id)||savedPatterns().find(p=>p.id===id);
if(patternsPanel){
 patternsPanel.addEventListener('click',event=>{
  const t=event.target.closest('button');if(!t)return;
  if(t.id==='pt234Save'){const ids=selectedIds(),input=patternsPanel.querySelector('#pt234Name'),label=input.value.trim();
   if(!ids.length){PT.message='Select components first.';PT.error=true;delete patternsPanel.dataset.sig;renderPatternsPanel();return}
   if(!label){PT.message='Give the pattern a name.';PT.error=true;delete patternsPanel.dataset.sig;renderPatternsPanel();patternsPanel.querySelector('#pt234Name')?.focus();return}
   const p=capturePattern(ids,label),list=savedPatterns();list.push(p);const ok=storePatterns(list);
   PT.message=ok?`Saved “${p.name}”: ${plural(p.nodes.length,'component')}, ${patternLinks(p)}.`:'This browser won’t store it: download it instead.';PT.error=!ok;
   if(!ok)download('component-patterns.json',patternsFileText([...list]),'application/json');input.value='';delete patternsPanel.dataset.sig;renderPatternsPanel();return}
  if(t.dataset.pt234Insert||t.dataset.pt234Attach){const p=findPattern(t.dataset.pt234Insert||t.dataset.pt234Attach);if(!p)return;
   const ids=insertPattern(p,{attachTo:t.dataset.pt234Attach?state.builderSelected:null,record:!t.closest('#topologyBuilder')});
   if(ids){PT.message='';if(typeof closeBuilderDrawer==='function')closeBuilderDrawer()}return}
  if(t.dataset.pt234Delete){const list=savedPatterns(),p=list.find(x=>x.id===t.dataset.pt234Delete);storePatterns(list.filter(x=>x.id!==t.dataset.pt234Delete));PT.message=p?`Deleted “${p.name}”.`:'';PT.error=false;delete patternsPanel.dataset.sig;renderPatternsPanel();patternsPanel.querySelector('#pt234Name')?.focus();return}
  if(t.id==='pt234Download')download('component-patterns.json',patternsFileText(),'application/json')});
 patternsPanel.addEventListener('change',async event=>{
  if(event.target.id!=='pt234File')return;const file=event.target.files?.[0];if(!file)return;
  try{if(file.size>5*1024*1024)throw new Error('The file is over 5 MB.');const {good,skipped}=readPatternsFile(await file.text()),list=savedPatterns(),have=new Set(list.map(p=>p.id));
   for(const p of good){const copy={...p};if(have.has(copy.id))copy.id='saved-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);list.push(copy);have.add(copy.id)}
   const ok=storePatterns(list);PT.message=ok?`Loaded ${plural(good.length,'pattern')} from ${file.name}${skipped?`; ${plural(skipped,'pattern')} couldn’t be used`:''}.`:'This browser won’t store patterns.';PT.error=!ok}
  catch(error){PT.message=`${file.name}: ${error.message}`;PT.error=true}
  delete patternsPanel.dataset.sig;renderPatternsPanel()})}
if(canDrawer){addMenuItem('Edit','Patterns…','Connection template…',()=>openBuilderDrawer('patterns'));addPhoneLaunch('patterns','Patterns')}
// ---- After the Builder redraws: the Inspector's card, an open Readiness or Patterns tab, and a user's walkthrough button.
function refreshAfterBuilder(){if(state.view!=='builder')return;renderReadinessCard();if(isOpen('readiness'))renderReadinessPanel();if(isOpen('patterns'))renderPatternsPanel();syncWalkButton()}
const renderBuilderBefore234=renderBuilder;
renderBuilder=function(...args){const out=renderBuilderBefore234.apply(this,args);later(refreshAfterBuilder);return out};
// Choosing a card or link takes a fast path that doesn't redraw the Builder; the walkthrough button follows it too.
if(typeof selectBuilderObjectFast==='function'){const selectBefore234=selectBuilderObjectFast;selectBuilderObjectFast=function(...args){const out=selectBefore234.apply(this,args);later(refreshAfterBuilder);return out}}
// ---- The architecture report: readiness after Validation, the sign-in paths after the event walkthrough.
function readinessMarkdown(){
 const m=readinessModel(),open=m.areas.flatMap(a=>a.checks.filter(c=>c.status==='partial'||c.status==='missing').map(c=>({...c,area:a.label})));
 return ['## Topology readiness','',`Score: ${m.score==null?'nothing to score':`${round(m.score)} / 100 (${BAND_TEXT[m.band]})`}. ${m.scoredAreas} of 7 areas scored; ${m.counts.met} checks met, ${m.counts.partial} partly, ${m.counts.missing} missing, ${m.counts.na} not in this topology. Met counts 1, partly 0.5, missing 0; each area is the average of its checks, the score the average of the scored areas.`,'',
  '| Area | Score | Met | Partly | Missing |','|---|---|---|---|---|',...m.areas.map(a=>`| ${a.label} | ${a.score==null?'not scored':round(a.score)} | ${a.counts.met} | ${a.counts.partial} | ${a.counts.missing} |`),'',
  open.length?'### Left to do':'All scored checks are met.',...open.map(c=>`- **${c.id} ${c.title}** (${c.area}, ${STATUS_TEXT[c.status].toLowerCase()}): ${c.detail}${c.fix?` To do: ${c.fix}`:''}`),''].join('\n')}
function loginMarkdown(){
 const paths=loginPaths();
 if(!paths.length)return '## Sign-in walkthrough\n\nNo sign-in path is drawn: add a User / Administrator, an Authentication Provider and Access links on the User access plane, then follow one in Operate › Login walkthrough.\n';
 return ['## Sign-in walkthrough','','Each sign-in path, as Operate › Login walkthrough follows it:','',...paths.slice(0,20).map(p=>{const m=methodOf(p),roles=rolesOf(p);return `- ${pname(p.user)} → ${p.provider?pname(p.provider)+' → ':''}${pname(p.target)}: ${methodText[m]}, MFA ${mfaOf(p)}, roles ${roles.length?roles.join(', '):'none recorded'}${p.toTarget?.sessionMinutes?`, session ${p.toTarget.sessionMinutes} minutes`:''}; audit evidence: ${String(p.toTarget?.auditEvidence||p.toProvider?.auditEvidence||'').trim()||'not named'}.`}),paths.length>20?`- and ${paths.length-20} more`:null,
  '','Splunk records every sign-in in _audit: index="_audit" action=log* action="login attempt".',''].filter(l=>l!==null).join('\n')}
function insertBefore(md,heading,block){const i=md.indexOf('\n'+heading);return i<0?null:md.slice(0,i+1)+block+'\n'+md.slice(i+1)}
if(typeof architectureReportMarkdown==='function'){
 const reportBefore234=architectureReportMarkdown;
 architectureReportMarkdown=function(...args){const md=reportBefore234.apply(this,args);
  try{let out=insertBefore(md,'## Security boundaries',readinessMarkdown())??md+'\n'+readinessMarkdown();
   const w=out.indexOf('\n## Representative event walkthrough'),next=w<0?-1:out.indexOf('\n## ',w+1);
   out=next<0?out+'\n'+loginMarkdown():out.slice(0,next+1)+loginMarkdown()+'\n'+out.slice(next+1);return out}
  catch(error){console.error(error);return md}}}
window.readiness234={readinessModel,readinessJson,readinessCsv,readinessMarkdown,AREAS,loginPaths,loginModel,loginJson,loginMarkdown,SCENARIOS,LW,SAMPLE_PATH,BUILTIN,savedPatterns,storePatterns,capturePattern,insertPattern,patternsFileText,readPatternsFile,validPattern,SRC,
 renderReadinessPanel,renderReadinessCard,renderPatternsPanel,renderLoginWalkthrough,refreshAfterBuilder};
if(state.view==='builder')later(refreshAfterBuilder);
})();

(function(){
/* Build 209: quick fixes. Esc closes the menu, panel, popover or drawer that's open and keeps the selection. An
   indexer behind a load balancer can't be converted to Splunk Cloud. The drawer is titled "Topology tools". Two
   in-place edits go with this block: new Splunk-to-Splunk links get port 9997 (inferredRelationshipPort), and a load
   balancer that passes syslog refuses Splunk Cloud with the syslog reason (its check). */

// Esc: Build 167 clears the selection on every Esc, after whatever was open has closed on the same key. A capture
// listener notes whether a menu, panel, popover or the drawer was open when Esc went down, and then the selection
// stays. With nothing open, Esc clears the selection as before. Below 1,280 px Components opens over the canvas and
// counts too; the Inspector there doesn't: Esc still clears the selection, which closes it.
const shown=el=>!!el&&!el.hidden&&el.getClientRects().length>0;
const componentsOver=()=>typeof canvasPanelState!=='undefined'&&!!canvasPanelState.palette&&!document.getElementById('topologyBuilder')?.classList.contains('builderDocked197');
// Menus and panels are <details>. Build 198 closes an open side panel in a window capture listener that runs before
// this one, so their open state is read from toggle events, which arrive after the key's handlers: a panel closed by
// this Esc still counts, as shown or not when it opened.
const openDetails=new Map(),note=d=>{if(d.open)openDetails.set(d,shown(d));else openDetails.delete(d)};
document.querySelectorAll('details[open]').forEach(note);
document.addEventListener('toggle',e=>{if(e.target instanceof HTMLDetailsElement)note(e.target)},true);
const detailLayers='.builderMenu,.builderDensityPanels details,#builderSpaceGroups140,.builderMobileMore,.builderMobilePlanes';
const otherLayers='#builderObjectMenu,#builderIssuePopover,.builderHistoryPopover163,.builderReport163,#builderHeaderInfoPopover,#builderImpactOverlay.open';
const layerOpen=()=>(typeof activeDrawerKind!=='undefined'&&!!activeDrawerKind)||!!state.builderPresentation?.open||componentsOver()
 ||[...openDetails].some(([d,was])=>d.isConnected&&d.matches(detailLayers)&&(d.open?shown(d):was))
 ||[...document.querySelectorAll(otherLayers)].some(shown);
let escClosesLayer=false;
addEventListener('keydown',e=>{if(e.key!=='Escape'||state.view!=='builder')return;escClosesLayer=layerOpen();if(escClosesLayer)setTimeout(()=>{escClosesLayer=false})},true);
if(typeof clearSelection167==='function'){const clearBefore=clearSelection167;
 clearSelection167=function(...args){if(escClosesLayer)return;return clearBefore.apply(this,args)}}
// Phones: Esc closes More and the planes menu too.
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||state.view!=='builder')return;const open=[...document.querySelectorAll('.builderMobileMore[open],.builderMobilePlanes[open]')];
 if(!open.length)return;for(const d of open)d.open=false;e.preventDefault()});

// Syslog behind a load balancer. Linking and files already refuse Splunk Cloud as a load balancer's member, and for a
// syslog pool they now give the syslog reason (an in-place edit to the load balancer's check). Converting an indexer
// to Splunk Cloud was the one way left to put it behind one, and it wasn't flagged as syslog. While the indexer is a
// load balancer's member, conversion is refused, and says why.
const isCloud=n=>!!n&&typeof builderIsCloudIndexer148==='function'&&builderIsCloudIndexer148(n);
const name=n=>typeof componentInstanceLabel==='function'?componentInstanceLabel(n):n.instanceName||n.type;
const poolOf=node=>state.builderNodes.find(n=>n.type==='loadBalancer'&&typeof builderLbMembers==='function'&&builderLbMembers(n).some(m=>m.id===node.id));
if(typeof builderCloudConvert148==='function'){const convertBefore=builderCloudConvert148;
 builderCloudConvert148=function(node,...rest){const lb=node?.type==='idx'&&!isCloud(node)?poolOf(node):null;
  if(!lb)return convertBefore.call(this,node,...rest);
  builderStatus(lb.lbServes==='syslog'?`${name(node)} is behind ${name(lb)}, which passes syslog. Syslog can't go directly to Splunk Cloud: send it through a Syslog Server and forwarder or HEC.`
   :`${name(node)} is behind ${name(lb)}, and Splunk Cloud balances its own inputs. Take ${name(node)} out of ${name(lb)}'s pool first.`,'error')}}

// The drawer holds checks, analyses and editing aids, so it's titled for all of them.
const drawer=document.getElementById('builderInspectorDrawer');
if(drawer){const title=drawer.querySelector('.builderDrawerTop strong');if(title)title.textContent='Topology tools';
 drawer.setAttribute('aria-label','Topology tools');drawer.querySelector('#builderDrawerClose')?.setAttribute('aria-label','Close topology tools')}
})();

(function(){
/* Build 208: the rest of Tools moves out. Route validation, the configuration draft, the connection template and the
   layout profiles become tabs in the Builder's drawer, beside Coverage, Review, Rules, Inventory, Trace and History,
   which the menus already open there. Each tool lays itself out to the drawer's width, so nothing scrolls sideways:
   in the Tools panel the four were 853 px wide in a 600 px panel. The menus open each tool's tab (four in-place edits),
   and the Tools panel goes. Phones keep More's Tools disclosure, with a button for each tab. */
const drawer=document.getElementById('builderInspectorDrawer');
if(!drawer||typeof drawerKinds==='undefined'||typeof openBuilderDrawer!=='function'||typeof setDrawerFlags!=='function')return;
const body=drawer.querySelector('.builderDrawerBody'),strip=drawer.querySelector('.builderDrawerTabs');
// kind, tab label, the tool's element, its name, and the tab it follows.
const TOOLS=[['routes','Routes','builderRoutePanel','Route validation','rules'],
 ['draft','Config draft','builderConfigDraft','Configuration draft','trace'],
 ['templates','Templates','builderTemplateBar','Connection template','history'],
 ['layouts','Layouts','builderProfileBar','Layout profiles','templates']];
for(const [kind,label,id,,after] of TOOLS){
 const tool=document.getElementById(id);if(!tool)continue;
 // renderSecondaryTools puts every listed tool back in the Tools panel on each redraw.
 if(typeof secondaryToolIds!=='undefined'){const i=secondaryToolIds.indexOf(id);if(i>=0)secondaryToolIds.splice(i,1)}
 tool.classList.add('mtPanel208');tool.hidden=true;body.append(tool);
 if(tool.tagName==='DETAILS')tool.open=true; // route validation keeps its open state through redraws
 drawerKinds.push([kind,label,id,null]);
 const tab=document.createElement('button');tab.type='button';tab.dataset.drawerKind=kind;tab.textContent=label;tab.onclick=()=>openBuilderDrawer(kind,false);
 const prev=strip.querySelector(`[data-drawer-kind="${after}"]`);if(prev)prev.after(tab);else strip.append(tab);
}
// Show only the open tab's tool.
const flagsBefore=setDrawerFlags;
setDrawerFlags=function(kind){flagsBefore(kind);for(const [k,,id] of TOOLS){const tool=document.getElementById(id);if(tool)tool.hidden=k!==kind}};
// A fault this also fixes: a card click selects through selectBuilderObjectFast, which opens the Inspector without
// recording the selection where Build 95's renderBuilder looks for changes. The drawer's own redraw then took the
// selection for a new one, opened the Inspector again, and that closed the drawer: the first tab opened after a card
// click closed at once. Opening the drawer now records the selection first. A selection made while the drawer is open
// still closes it and shows the Inspector, as before.
if(typeof lastDrawerSelection!=='undefined'){const openBefore=openBuilderDrawer;
 openBuilderDrawer=function(...args){lastDrawerSelection=`${state.builderSelected}|${state.builderSelectedEdge?.plane||''}|${state.builderSelectedEdge?.id||''}`;return openBefore.apply(this,args)}}

// Phones: More's Tools disclosure lists the four tabs.
const tools=document.getElementById('builderSecondaryTools'),toolsBody=document.getElementById('builderSecondaryToolsBody');
if(tools&&toolsBody){
 const line=tools.querySelector(':scope>summary span');if(line)line.textContent='Route validation · configuration draft · templates · layouts';
 const launch=document.createElement('div');launch.className='mtLaunch208';
 launch.innerHTML=TOOLS.map(([kind,,,name])=>`<button type="button" data-mt-kind="${kind}">${name}</button>`).join('');
 launch.addEventListener('click',event=>{const button=event.target.closest('[data-mt-kind]');if(!button)return;const more=button.closest('.builderMobileMore');if(more)more.open=false;openBuilderDrawer(button.dataset.mtKind)});
 toolsBody.append(launch);
}
if(typeof renderBuilder==='function'&&state.view==='builder')renderBuilder();
})();

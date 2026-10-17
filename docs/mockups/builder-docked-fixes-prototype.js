(function(){
/* Build 198 fix: the fit keeps clear of the first-visit help card by reserving its height at the bottom of the canvas. It used to
   reserve a strip as wide as the card (about 380px), which left a docked or tablet-width canvas half its width for the topology. */
const media=window.matchMedia('(min-width:761px)');
const visibleBefore=builderVisibleRect163;
builderVisibleRect163=function(...args){
 const help=document.querySelector('.builderSpaceHelpPopover140'),shown=!!help&&!help.hidden&&getComputedStyle(help).display!=='none';
 if(!media.matches||state.builderCanvasFocus||!shown)return visibleBefore(...args);
 help.hidden=true;let rect;try{rect=visibleBefore(...args)}finally{help.hidden=false}
 const r=rect.canvas,b=help.getBoundingClientRect();
 const bottom=b.width>1&&b.bottom>r.top&&b.top<r.bottom?Math.max(rect.bottom,r.bottom-b.top+10):rect.bottom;
 return {...rect,bottom,height:Math.max(1,r.height-rect.top-bottom)};
};
/* Build 198 fix: Esc closes the open Tools or Groups panel. Two faults in Build 140's handler: when docked it never runs, because
   Build 95's Esc handler closes the palette or the Inspector and cancels the event, and docking keeps both open; and it closes the
   first open <details> in the panels, which can be a section left open inside the closed Tools panel, such as Bulk edit.
   This runs first, on window, and closes the panel itself, unless something above the panel takes the Esc. */
window.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||event.defaultPrevented||state.view!=='builder'||state.builderCanvasFocus||!builderSpaceMedia140.matches)return;
 const open=builderDensityPanels.querySelector(':scope>details[open]');if(!open)return;
 // Below 1280px an open Components or Inspector drawer takes the Esc first, as before; docked, they are columns and don't.
 if(!$('#topologyBuilder').classList.contains('builderDocked197')&&(canvasPanelState.palette||canvasPanelState.inspector))return;
 if(document.querySelector('.builderObjectMenu:not([hidden]),.builderIssuePopover:not([hidden]),#builderImpactOverlay.open,#builderPresentationOverlay.open')||event.target.closest?.('details.builderMenu[open]'))return;
 const inside=open.contains(document.activeElement);
 event.preventDefault();open.open=false;builderSpaceGroupButton140.setAttribute('aria-expanded','false');builderDensitySync();
 if(inside)builderDensityDock.querySelector(`:scope>[aria-controls="${open.id}"]`)?.focus();
},true);
})();

(function(){
/* Fault 44. The text polish (polishBuilderText) gives Builder text under its floor, 11.5 px on the canvas and 10 px
   elsewhere, its final size in the next frame's animation callbacks (Build 118 calls it from requestAnimationFrame).
   Until then, code measuring the Builder saw the smaller text, and a redraw that itself ran in an animation callback,
   as on crossing 760 px, was painted with it. The polish now runs as soon as the redraw's task is done: once, however
   many redraws the task made, for what they added and kept, before any animation callback or paint. */
let queued=false;
const renderBefore=renderBuilder;
renderBuilder=function(...args){
 const result=renderBefore.apply(this,args);
 // Build 151's observer hears of what the redraw added in a microtask queued at its first change, so before this one.
 if(!queued){queued=true;queueMicrotask(()=>{queued=false;polishBuilderText()})}
 return result;
};
})();

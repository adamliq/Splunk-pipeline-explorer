(function(){
/* Build 206: in Focus canvas the palette and the Inspector start just below the focus bar. The bar wraps as the window
   narrows (48 px tall at 1,280 px, 68 at 1,024, 82 at 800), so this keeps --focus-bar-bottom206 on #topologyBuilder at
   its bottom edge. */
const root=document.getElementById('topologyBuilder'),bar=root&&root.querySelector('.builderFocusBar');
if(!bar||typeof ResizeObserver!=='function')return;
const place=()=>{const r=bar.getBoundingClientRect();if(r.height)root.style.setProperty('--focus-bar-bottom206',Math.round(r.bottom)+'px')};
new ResizeObserver(place).observe(bar);
addEventListener('resize',place);
place();
})();

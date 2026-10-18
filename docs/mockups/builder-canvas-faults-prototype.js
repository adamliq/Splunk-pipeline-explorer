(function(){
/* Build 201: a card chip or container name cut short with … shows its full text as a tooltip. The title is set on
   hover, so it follows whatever text the card has by then, and only where the text doesn't fit. A title set by other
   code is left alone. */
const selector='.builderCanvas .unifiedNodeMeta>span,.builderCanvas .unifiedGroupBox>[data-unified-group]';
document.addEventListener('pointerover',event=>{
 const el=event.target.closest?.(selector);if(!el)return;
 const full=el.textContent.trim(),cut=el.scrollWidth>el.clientWidth+1,ours=el.dataset.cutTitle201==='1';
 if(cut&&(!el.title||ours)){el.title=full;el.dataset.cutTitle201='1'}
 else if(!cut&&ours){el.removeAttribute('title');delete el.dataset.cutTitle201}
});
})();

# Builder handoff: text and shapes go soft when the canvas is zoomed

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 138 (`main` at `2111f20`), merged into branch `claude/build-page-layout-bl6jk1`.
**Reported:** after zooming the Builder canvas, card text, borders and connectors aren't crisp.

## Cause

The whole topology (cards, connectors and labels) lives in `#builderTree`. `applyBuilderViewport()` (line ~2073) zooms and pans it with a CSS transform:
```js
tree.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.zoom})`;
```
and the stylesheet gives it
```css
#builderTree{…transform-origin:0 0;will-change:transform}
```

**`will-change: transform` tells Chrome to keep this layer as a bitmap and move or scale that bitmap on the GPU instead of redrawing it.** Chrome rasterises the layer at the scale it had when the layer was created (the first Fit, about 100%), then **stretches that bitmap** when you zoom in, so text and lines go soft (up to 1.8×, the maximum zoom). When zooming out, it shrinks the bitmap, so thin text and 1px lines shimmer and lose weight. Chrome only redraws such a layer at the new scale in some cases, so the blur comes and goes.

Two smaller factors make it worse:
- **Fractional pan offsets.** The translate values aren't whole device pixels (for example `matrix(1.8,0,0,1.8,-594.404,-117.426)`), so every glyph and 1px border lands between pixels and gets anti-aliased across two, even at 100%.
- **Small text.** 45 text elements inside the canvas are under 11px (route labels at 10.5px, for example "TCP/TLS or UDP"). At the fitted zoom on a 1280 screen (86%) they render at about 9px.

Nothing else in the layer causes blur: no filters, backdrop filters, images or canvases, and no transform animation on the layer (checked in Build 138).

**Note for testing:** headless Chromium redraws the layer at every zoom, so screenshots from Playwright look sharp either way. Confirm the fix in desktop Chrome or Edge with GPU acceleration on (normal browsing), at 100% and 200% browser zoom (display scaling).

---

## Fix

### 1. Use `will-change` only while the user is panning or zooming
Remove it from the stylesheet and add it only during a gesture, so Chrome redraws at the final scale as soon as the gesture ends:
```css
#builderTree{will-change:auto}
#builderTree.builderGesturing139{will-change:transform}
```
```js
let builderGestureTimer139=0;
function builderGesture139(){
  const tree=document.querySelector('#builderTree');
  if(!tree)return;
  tree.classList.add('builderGesturing139');
  clearTimeout(builderGestureTimer139);
  builderGestureTimer139=setTimeout(()=>tree.classList.remove('builderGesturing139'),160);
}
// call builderGesture139() from the wheel handler, from pan pointermove, and from the −/+/Fit buttons
```
Removing the class ends the "keep the bitmap" hint, and Chrome redraws the layer crisply at the new scale.

### 2. Snap the pan offset to device pixels
In `applyBuilderViewport`, round the translate to whole device pixels (not CSS pixels, so HiDPI screens keep half-pixel precision):
```js
const dpr=window.devicePixelRatio||1,snap=v=>Math.round(v*dpr)/dpr;
tree.style.transform=`translate(${snap(view.x)}px,${snap(view.y)}px) scale(${view.zoom})`;
```
Keep `view.x`/`view.y` unrounded in state, so repeated pans don't drift.

### 3. Snap zoom steps to friendly values
The −/+ buttons already step (…, 1.0, 1.2, …, 1.8). **Fit** and wheel zoom produce values like 0.9974 or 1.1191. After a wheel gesture ends (the same 160ms timer), **round the zoom to the nearest 1% and snap to 100% when within ±2%**, adjusting x/y so the point under the cursor doesn't move. Fit should also snap to 100% when the fitted value is within ±3% of it. At exactly 100%, with whole-pixel offsets, text renders with the same crispness as the rest of the page.

### 4. Minimum on-screen size for canvas text
Raise the smallest canvas text (route labels, chip text, badges) from 10.5px to **11.5px**, and give route-label text `font-weight:600`. At zooms below 90%, keep route labels legible by scaling their font inversely, capped at 13px:
```css
.edgeRouteLabel{font-size:calc(11.5px / min(var(--builder-zoom,1),1))}
```
Set `--builder-zoom` on `#builderTree` in `applyBuilderViewport`. Then re-check the label collision rules, since labels get slightly larger at low zoom.

### 5. Optional: redraw vectors at the new scale
Connectors are SVG inside the zoomed layer, so after item 1 they redraw sharply too. No `vector-effect` change is needed; lines should keep scaling with the cards.

---

## Checks
1. **Automated** (Playwright):
   - 300ms after load, a wheel zoom, and a +/− click, `getComputedStyle(#builderTree).willChange === 'auto'`; during a simulated wheel sequence it's `transform`.
   - After any pan, the translate values in `#builderTree`'s computed matrix × `devicePixelRatio` are whole numbers (±0.01).
   - After Fit on the default topology at 1440×900, the zoom is exactly 1.0 (it's 0.997 now).
   - No text element inside `#builderTree` has a computed font size below 11.5px, apart from labels hidden with opacity 0.
2. **Manual, in desktop Chrome with GPU on:** zoom to 180% with + and with the wheel, then wait a moment. Card titles, chip text, route labels and 1px borders are as crisp as text outside the canvas. Repeat at 60%. Repeat with display scaling at 150% or 200%.
3. **No regressions:** `tools/builder-connector-check.js` (all OK while dragging and after drop), the button sweep, the grouping sweep, and 0 `pageerror` events. Panning and zooming must still feel smooth: check that a pan of a 17-component topology (`docs/mockups/ov1-reference-topology.json`) doesn't stutter.
4. Add a `changeRegister` entry for the new block (`builder-canvas-sharp-v139` or the next free number).

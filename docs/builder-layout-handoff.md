# Builder view: layout issues and fixes (handoff)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Branch:** `claude/build-page-layout-bl6jk1` (fix commit `d401d2e`)
**Status:** issues 1–6 are fixed on that branch. Issue 7 is still open and is the next task.

## Read this first

- The whole app is one file, `index.html` (about 1.4 MB, about 3,650 lines). Features are added as appended, versioned blocks such as `<style id="…-v109-styles">` and `<script id="…-v109">`. Later scripts wrap earlier functions: `const fooBefore=foo; foo=function(){…fooBefore()…}`. Follow the same pattern.
- **If you regenerate `index.html` from your own copy, carry these fixes forward.** Uploading a file built from a pre-fix copy will silently reintroduce every bug below. Either start from this branch's `index.html` or re-apply each fix.
- The Builder view is opened with `button[data-view="builder"]`. Its root element is `#topologyBuilder`, and the canvas is `.builderCanvas > #builderTree`.
- To verify, use Playwright/Chromium at 1280×800, 1440×900 and 1920×1080, plus 390×844 for a mobile check. Click Builder, wait about 500 ms, then screenshot and collect `pageerror` events.

---

## Fixed issues (keep these in any future build)

### 1. JS error on load: `isAuthProviderType is not defined`
- **Symptom:** the error was thrown on every load. The first canvas render aborted, so nodes rendered incorrectly or not at all.
- **Cause:** `authenticationProviderTypes` and `isAuthProviderType()` were declared in `<script id="builder-auth-providers-v94">`. But `unifiedNodeMarkup()` in the earlier `<script id="builder-unified-multiplane-canvas">` calls the function during the first render. Across separate classic `<script>` tags, a function declaration is only available once its own script has run.
- **Fix:** move these three lines to the top of `builder-unified-multiplane-canvas` and delete them from the v94 script:
  ```js
  /* Identity providers are independent authentication-plane components. */
  const authenticationProviderTypes=new Set(['authProviderCloud','authProviderOnPrem']);
  function isAuthProviderType(type){return authenticationProviderTypes.has(type)}
  ```
- **Rule going forward:** any helper that render code calls must be declared in, or before, the first script that renders.

### 2. Canvas stuck at minimum zoom (18–35%)
- **Symptom:** opening Builder showed tiny nodes in the top-left corner.
- **Cause:** `fitBuilderView()` runs at startup while `#topologyBuilder` is `display:none`, so `canvas.clientWidth` is 0. The computed zoom clamps to `builderZoomLimits.min`, and `initialized=true` stops any later refit.
- **Fix** (in the v112 block below): wrap `fitBuilderView`. If the canvas has zero size, set `state.builderViewport.pendingFit=true` and return. A `ResizeObserver` on `.builderCanvas` runs the pending fit once the canvas has a real size.

### 3. Fit off-centre and overflowing under the minimap
- **Cause:** `builderVisibleFitBounds()` (script `builder-fit-visible-topology`) assumes every node is 142px tall and ignores the canvas's 22px padding offset. Rendered `.unifiedNodeWrap` elements are 218–255px tall, including the handle chips.
- **Fix:** wrap `builderVisibleFitBounds` so it measures the rendered `.unifiedNodeWrap` boxes, converted to tree coordinates (`(rect - treeRect) / zoom`), and returns their union.

### 4. Builder dropdowns and search at 15px, truncated
- **Cause:** 10 CSS declarations used an invalid font shorthand, for example `font:600 .6rem/1.2 inherit`. `inherit` can't appear inside the `font` shorthand, so the browser dropped the whole declaration and the global 15px select style applied.
- **Fix:** rewrite each one as longhand properties, for example `font-weight:600;font-size:.6rem;line-height:1.2;font-family:inherit`. The regex used was `font:(\d{3}) ([\d.]+rem)/([\d.]+) inherit(?=[;}])`.
- **Rule going forward:** never write `font:<weight> <size>/<lh> inherit`. Use longhands, or name a real font family.

### 5. Navigate row: "Go" stretched, "Delete" wrapped
- **Cause:** `.builderLargeNav` has 11 children but only 9 grid columns.
- **Fix:** the status span spans the full row, and at widths of 1121px and above the grid gets one column per control. The bookmark select is the flexible `1fr` column. The "No groups" empty-state span in `.builderGroupChips` had no font size (it inherited 15px), so it now gets `.66rem`.

### 6. Edge route labels hidden
- **Cause:** horizontal layout places columns 270px apart. Nodes are 190px wide, which leaves an 80px gutter, but labels such as "TCP/TLS or UDP" are about 100px. The `.builderEdgeIssueMarker` badge is drawn at the same midpoint, on top of the label.
- **Fix:** wrap `unifiedBuilderPositions` so horizontal mode uses a 320px column pitch, and shift the marker's circle and text up by 23px, above the label.
- **Note:** free-place mode keeps its stored coordinates, which still use 270px spacing. Labels there are tighter until the user drags nodes apart.

### The complete v112 block (appended just before `</body>`)
```html
<style id="builder-layout-fixes-v112-styles">
.builderGroupChips>span{color:#7f95a7;font-size:.66rem}
.builderLargeNavStatus{grid-column:1/-1}
.builderEdgeIssueMarker circle,.builderEdgeIssueMarker text{transform:translateY(-23px)}
@media(min-width:1121px){.builderLargeNav{grid-template-columns:auto minmax(130px,180px) minmax(140px,210px) auto minmax(150px,220px) auto minmax(120px,1fr) auto auto auto}}
</style>
<script id="builder-deferred-fit-v112">
/* A fit requested while the Builder view is hidden measures a 0px canvas and
   clamps to minimum zoom. Defer it until the canvas has a real size. */
const fitBuilderViewBeforeDeferred=fitBuilderView;
fitBuilderView=function(...args){const canvas=$('.builderCanvas');if(!canvas||!canvas.clientWidth||!canvas.clientHeight){state.builderViewport.pendingFit=true;return}state.builderViewport.pendingFit=false;return fitBuilderViewBeforeDeferred(...args)};
/* Horizontal columns leave an 80px gutter, narrower than most route labels; widen it so labels sit between nodes. */
const unifiedBuilderPositionsBeforeLabelGutter=unifiedBuilderPositions;
unifiedBuilderPositions=function(){const layout=unifiedBuilderPositionsBeforeLabelGutter();if(layout.mode!=='horizontal')return layout;const pitch=320,columns=[...new Set([...layout.positions.values()].map(position=>position.x))].sort((a,b)=>a-b);if(columns.length<2)return layout;const left=columns[0],index=new Map(columns.map((x,i)=>[x,i]));layout.positions.forEach(position=>{position.x=left+index.get(position.x)*pitch});layout.width=Math.max(layout.width,left+(columns.length-1)*pitch+190+left);return layout};
/* Layout bounds assume a fixed node height and ignore canvas padding; fit to the rendered node boxes instead. */
const builderVisibleFitBoundsBeforeMeasured=builderVisibleFitBounds;
builderVisibleFitBounds=function(){const bounds=builderVisibleFitBoundsBeforeMeasured(),tree=$('#builderTree');if(!bounds||!tree)return bounds;const zoom=state.builderViewport.zoom||1,origin=tree.getBoundingClientRect(),measured=[];for(const wrap of tree.querySelectorAll('.unifiedNodeWrap')){const x=parseFloat(wrap.style.left),y=parseFloat(wrap.style.top),r=wrap.getBoundingClientRect();if(Number.isNaN(x)||Number.isNaN(y)||!r.width||x<bounds.left-1||x>bounds.right||y<bounds.top-1||y>bounds.bottom)continue;measured.push({x,y,left:(r.left-origin.left)/zoom,top:(r.top-origin.top)/zoom,right:(r.right-origin.left)/zoom,bottom:(r.bottom-origin.top)/zoom})}if(!measured.length)return bounds;const dx=measured[0].left-measured[0].x,dy=measured[0].top-measured[0].y;return{left:Math.min(bounds.left+dx,...measured.map(m=>m.left)),top:Math.min(bounds.top+dy,...measured.map(m=>m.top)),right:Math.max(bounds.right+dx,...measured.map(m=>m.right)),bottom:Math.max(bounds.bottom+dy,...measured.map(m=>m.bottom))}};
if(typeof ResizeObserver==='function'&&$('.builderCanvas'))new ResizeObserver(()=>{if(state.builderViewport.pendingFit)fitBuilderView()}).observe($('.builderCanvas'));
if(state.view==='builder'&&!state.builderViewport.pendingFit)requestAnimationFrame(()=>fitBuilderView());else state.builderViewport.pendingFit=true;
changeRegister.find(group=>group.group==='Explorer foundations')?.items.push(['Builder layout fixes','Fit the canvas once the Builder view is visible, load identity-provider helpers before first render and restore compact control fonts.',true]);
if(state.view==='changes')renderChanges();
</script>
```

---

## 7. Open issue: canvas starts below the fold on desktop

**Symptom:** at 1440×900 the canvas's top edge sits at about y=820, so almost none of it is visible without scrolling. Above it are stacked full-width panels: the builder header (about 145px) → toolbar row → relationship-plane bar → search bar → Navigate row → "Architecture profile" disclosure → "Review findings" disclosure → "Tools" disclosure → "Containers" bar. The canvas is the main workspace, but it shows last.

**Suggested fix** (desktop only, at 1121px and above; don't change the mobile layout):
1. Merge the search bar and the Navigate row into one collapsible "Find & navigate" disclosure, collapsed by default. Keep the `/` shortcut, and have it expand the disclosure and focus `#builderSearchInput`.
2. Put the three disclosures (Architecture profile, Review findings, Tools) side by side as compact buttons in one row. They should expand below the row, not stack as three full-width bars.
3. Fold the Containers bar into that same row as a chip ("No groups", "+ Add group").
4. Tighten the header: put the Undo/Redo/History and Saved/Save controls on one row, level with the title, and remove the empty space under the description.
5. Optionally give `.builderCanvas` `min-height:clamp(480px, calc(100dvh - 300px), 760px)` on desktop, so it fills the viewport once scrolled to.

**Implement it as** a new `<style id="builder-desktop-density-v113-styles">` plus, if needed, a `<script id="builder-desktop-density-v113">` that moves the existing DOM nodes. Don't rewrite the earlier blocks: other scripts query these elements by id and class, so keep every id and class name. Add a `changeRegister` entry the way v112 does.

**Acceptance criteria:**
- At 1440×900, after clicking Builder with no scroll, the canvas top is at y ≤ 520 and at least 300px of it is visible.
- No `pageerror` events at 1280, 1440, 1920 or 390 wide. Switching the `#unifiedLayoutMode` select through vertical, free, horizontal and auto throws nothing.
- Every control that was reachable before is still reachable (search, isolate, bookmarks, profiles, review findings, tools, groups).
- Focus mode (`.topologyBuilder.canvasFocus`) and full screen still hide the chrome, and the canvas still fills the space.
- The document never scrolls horizontally (`document.documentElement.scrollWidth === innerWidth`).

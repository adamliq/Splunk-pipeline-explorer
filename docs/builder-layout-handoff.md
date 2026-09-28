# Builder view: layout issues and fixes (handoff)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Branch:** `claude/build-page-layout-bl6jk1` (fix commit `d401d2e`)
**Status:** issues 1–6 are fixed on that branch. Issue 7 was implemented in the v113 upload, and the v113 review fixes are in v114 (see the end of this file). Keep `builder-density-polish-v114` in future builds.

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

---

## Update: v113 review and v114 fixes

v113 met most of issue 7, but the canvas top was at y=528, and it introduced these problems. All are fixed in `<style id="builder-density-polish-v114-styles">` and `<script id="builder-density-polish-v114">`:

1. **Error:** `insertBefore … not a child of this node` from `builderDensityLayout`. Chromium can fire the media-query `change` event while `matches` is still true (zoom, device-metric changes, print preview). Re-running the desktop layout then calls `insertBefore(dock, #builderGroupBar)` after the group bar has already been moved into the dock. **Fix:** replace the listener with one that only re-syncs when the dock is already connected. **Rule:** DOM-moving layout functions must be idempotent.
2. **Header:** `#builderSaved` was moved out of `.builderPersistence`, so it lost its `width:175px` rule and stretched to about 575px at 15px text. Save and "Use in explorer" wrapped onto a second row. **Fix:** size the select inside `.builderDensityHeaderPrimary`, use `nowrap` on buttons and status, and hide the `kbd` hints on desktop. Undo and Redo get `title` and `aria-keyshortcuts` instead. The header went from 138px to 74px tall.
3. **Dock:** the Containers bar was appended after the full-width `.builderDensityPanels`, so it dropped to its own row and left grid column 5 empty. **Fix:** pin `.builderGroupBar` to `grid-column:5; grid-row:1` and the panels to `grid-row:2`.
4. **Toggle labels:** labels were inconsistently aligned (`space-between`), and the names themselves were truncated. **Fix:** left-align the labels and render the name in full with the status as a muted `<small>` that truncates. The full text is in the `title`.

**Result at 1440×900:** the canvas top moved from 528 to 423, with 477px of canvas visible without scrolling. No errors at 1280, 1440, 1920 or 390, or across a 1440→1000→1440 resize.

---

## 8. Next task: builder toolbar declutter (v116)

**Goal:** move canvas-level controls onto the canvas, and shrink the two rows above it (the toolbar and the relationship-plane bar) to one. At 1440×900 the canvas top is currently at y=423; the target is about 360.

Put all changes in `<style id="builder-toolbar-declutter-v116-styles">` and `<script id="builder-toolbar-declutter-v116">`. **Move existing elements; don't recreate them.** Their click handlers are bound to these elements by id, and other scripts query them. Desktop only (`min-width:1121px`, matching v113); leave the mobile layout alone.

### Current state (the desktop toolbar, `.builderToolbar`)
`#builderCanvasTitle` ("Unified topology · N components · N relationships") · drag hint · `#builderZoomOut` `#builderZoomReadout` `#builderZoomIn` · `#builderAddToggle` · `#builderInspectorToggle` · `#builderFocusToggle` · `#builderMinimapToggle` · `#builderPresentationToggle` · `#builderFullscreenToggle` · menus **Navigate** (contains `#builderFitView`, `#builderAutoLayout`), **Build**, **Validate**, **Export** (contains `#builderPrintPresent`).
Below it, the `.builderPlaneBar.unifiedPlaneBar` holds the plane checkboxes, the `#unifiedLayoutMode` select and a hint. **`renderUnifiedPlaneControls()` rewrites this bar's innerHTML on every render**, so anything you move out of it must be re-applied after each render: wrap `renderUnifiedPlaneControls` the way v112 and v113 wrap functions.

### Phase 1 (do first; small, low risk)
1. **Zoom and Fit on the canvas.** `.builderCanvas` already contains `.builderMobileZoomControls` (− / + / Fit, wired to `setBuilderZoom` and `fitBuilderView`). It is only shown by `@media(pointer:coarse),(max-width:760px)`. On desktop, show it and position it bottom-right, stacked directly above `.builderMinimap`, and add a zoom-percentage readout between − and +. Clicking the readout resets zoom to 100% (`setBuilderZoom(1)`). Then hide `#builderZoomOut`, `#builderZoomReadout` and `#builderZoomIn` in the toolbar. Keep the keyboard shortcuts (+ − 0).
   - `applyBuilderViewport()` updates `#builderZoomReadout`. Either move that element into the overlay, or wrap `applyBuilderViewport` to update the new readout too.
2. **＋ Add as a floating button.** Move `#builderAddToggle` into `.builderCanvas`, positioned top-left (at the `.builderMobileZoomControls` default spot, now free on desktop). Style it as a primary pill. It already opens the canvas palette.
3. **Minimap collapse on the minimap.** Put a small collapse/expand button (▾/▸) in the corner of `.builderMinimap` that calls `$('#builderMinimapToggle').click()`, and hide `#builderMinimapToggle` in the toolbar. While the minimap is hidden, show a small "Map" chip in the same corner so it can be reopened.
4. **Full screen icon.** Move `#builderFullscreenToggle` to the canvas's top-right corner as an icon button (⤢, with `title="Full screen"` and `aria-label`). It must still work in `:fullscreen` and `.canvasFocus` modes.

### Phase 2 (bigger change; do after phase 1 is verified)
5. **Remove the toolbar's top row.** Show `#builderCanvasTitle` as a small muted caption in the canvas's top-left (beside ＋ Add), and move the drag hint text into the existing `.builderNavigationHint` strip at the canvas's bottom-left.
6. **Merge the toolbar with the plane bar into one line:** plane checkboxes on the left; Inspector, Focus canvas and the Navigate/Build/Validate/Export menus on the right. Move `#builderPresentationToggle` into the Export menu beside `#builderPrintPresent`. Move the "Canvas layout" `#unifiedLayoutMode` select into the Navigate menu, re-attached after every `renderUnifiedPlaneControls()`. Show Inspector and Focus canvas as toggles with an active state (`aria-pressed` plus a highlight) while on.

### Acceptance criteria
- At 1440×900 with no scroll, the canvas top is at y ≤ 370 after phase 2 (≤ 400 after phase 1 alone).
- The zoom buttons, readout, Fit, ＋ Add, minimap collapse and full screen all work from the canvas. The readout updates on wheel zoom and on Fit.
- The floating controls don't overlap each other or the nodes after Fit. The Fit padding (34px, `builder-deferred-fit-v112`/`builder-fit-visible-topology`) may need to grow to keep nodes clear of the top-left ＋ Add button and the bottom-right zoom/minimap stack.
- The canvas layout select still switches modes after re-renders: cycle vertical → free → horizontal → auto, adding a node in between.
- Focus canvas, full screen and Presentation still work. In `.canvasFocus` and `:fullscreen`, the canvas overlay controls stay visible.
- No `pageerror` at 1280, 1440, 1920 or 390, or across a 1440→1000→1440 resize. The layout code must be idempotent (see v114, item 1).
- Mobile (≤760px or touch) is unchanged.
- No horizontal page scroll.
- Add a `changeRegister` entry the way v112–v115 do.

---

## Update: full button sweep and v115 fixes

**Upload `1e42009` is identical to `57de59d` (v113), so it does not contain v114.** Build from this branch's `index.html`, which contains v112, v113, v114 and v115.

All 163 buttons in `#topologyBuilder` were tested. Each ran on a fresh page, with its menu, disclosure or drawer opened the way a user would open it. There were no JS errors. Undo, Redo and Ctrl+Z, the Focus-mode bar, the inspection drawer, the mobile zoom controls, the dock toggles, the `/` shortcut and the export and print actions all work. The 14 disabled buttons are disabled only where nothing is selected or nothing is saved, as expected.

Bugs found, all fixed in `<style id="builder-button-fixes-v115-styles">` and `<script id="builder-button-fixes-v115">`:

1. **Most palette items did nothing from the default state.** Canvas-palette items attach to the selected component (Universal Forwarder 1 by default). The capability wrapper refused invalid handoffs, such as UF → Windows Event Log or UF → Search Head, with only a status message; the palette closed and no node appeared. **Fix:** for palette clicks only (a capture-phase flag), try the normal add. If it added nothing, add the component unconnected and show "Added X unconnected · <reason> Drag it onto a compatible component to connect." Drag-and-drop onto a specific node still refuses, because the user chose that target. Special types (User, identity providers, DS, Stream, SOAR) keep their own messages, because the fallback only runs after a refusal.
2. **Relationship Review markers (the orange "2" on edges) could never be clicked.** `.unifiedConnectorLayer` has `pointer-events:none`; route labels opt back in, but `.builderEdgeIssueMarker` didn't. **Fix:** `pointer-events:all` on the markers. Clicking one now opens `#builderIssuePopover`.
3. **The selected node's Review badge was hidden and unclickable.** The multi-select ✓ (`.unifiedNodeWrap.multiSelected:before`, z-index 9) sits in the same top-right corner as `.builderNodeIssueMarker` (z-index 5). **Fix:** move the ✓ to the top-left corner.

Minor, not changed:
- Clicking the palette group that is already open doesn't collapse it; the single-open accordion always keeps one group open.
- The `+ Add` suggestions only list components compatible with the selected node. The full list below them doesn't mark incompatible items. Now that incompatible items are added unconnected rather than refused, this is lower priority, but a muted "adds unconnected" hint on them would help.

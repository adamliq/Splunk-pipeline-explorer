# Builder view: layout issues and fixes (handoff)

> **Superseded.** Build 120 implements sections 8–10 below. For current tasks, use [`builder-handoff-build124.md`](builder-handoff-build124.md). This file is kept as history: it explains what each block from v112 to v118 fixes and why.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Branch:** `claude/build-page-layout-bl6jk1` (latest fix commit `f2a63c5`)
**Status:** issues 1–6 are fixed (v112). Issue 7 was implemented in the v113 upload and polished in v114. Button fixes from a full sweep are in v115. **The next tasks are section 8 (toolbar, v116), section 9 (＋ Add palette, v117) and section 10 (canvas, messaging and mobile polish, v118).**
**Important:** `main` (upload `1e42009`) contains v112 and v113 only. Start from this branch's `index.html`, which has v112–v115, and keep every `…-v112` to `…-v115` block in future builds.

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

---

## 9. Next task: ＋ Add palette improvements (v117)

Do this after section 8, or independently; the two touch different elements. Put all changes in `<style id="builder-add-palette-v117-styles">` and `<script id="builder-add-palette-v117">`. Move and extend the existing elements; don't recreate them.

### Current state
- The palette is the `aside.builderPalette` with `id="builderCanvasPalette"`, opened by `#builderAddToggle` or `openBuilderCanvasPalette()`. Its parts: `#builderPaletteQuery` (search), `#builderPaletteCount`, `#builderSuggestions` ("Compatible next component"), `#builderPaletteEmpty` and `#builderPaletteDrawerClose`. There are 11 groups: each `.builderPaletteToggle` has `aria-controls="builderPaletteSectionN"`, and the section contains `[data-builder-add]` item buttons (42 items in total, all `draggable`).
- **Search:** `renderPaletteSearch()` matches each item's text, type, name, **stages** and type description. The single-open accordion (`<script id="builder-palette-accordion-v110">`: `accordionGroups`, `accordionActive`, `syncPaletteAccordion()`) then opens only the first group that has matches.
- **Position:** the rule `.topologyBuilder.canvasFirst .builderPalette{position:fixed;top:clamp(12px,6vh,72px);bottom:12px;…}` pins it to the viewport's top-left. At 1440×900 it measures 310×834 at x=12, y=54, while the canvas starts at y=423.
- **Adding:** palette clicks attach to `state.builderSelected`. Since v115, an incompatible pick is added unconnected with a status message; compatibility comes from `dataCapability(source,{id:-1,type})`.

### Must fix (bugs or near-bugs)
1. **Search opens the wrong group and hides the best matches.** Typing "hec" opens *Deployment configuration → Deployment App*, which matches only because a stage text contains "c**hec**ksum". The 2 matches in Sources and 6 in Collection stay collapsed.
   - While the search box has text, expand **every** group that has matches (bypass the single-open accordion), and restore single-open behaviour when the search is cleared.
   - Rank matches: exact or prefix name and type match > word match in the name > description or stage match. Order the groups by their best match, and items within a group by rank.
   - Stage and description matches must be whole-word (or word-prefix) matches, so "hec" no longer matches "checksum".
   - Enter in `#builderPaletteQuery` adds the top-ranked item.
2. **Anchor the palette to the canvas.** It currently covers the page header and toolbar, and it hides the canvas's left-most node. On desktop (min-width 1121px), position it inside the canvas's left edge: top and bottom aligned to `.builderCanvas`, about 300px wide, scrolling internally. If the page is scrolled so the canvas is partly off-screen, clamp it to the visible part of the canvas. While it's open, the canvas's Fit/auto-pan should keep nodes clear of it (or shift the fit area right by its width). The mobile layout stays as it is.
3. **Put the data path first.** Reorder the groups to: Sources, Collection, Processing, Destinations, then Access & management, Deployment configuration, Indexer clustering, Search head clustering, S3 federated search, Splunk Stream, Splunk SOAR. Reorder the DOM nodes (keep the section ids) and update `accordionGroups` to match, so the default open group is Sources.

### Make adding clearer
4. **Mark items that can't connect.** For the full list, compute `dataCapability(selectedNode,{id:-1,type})` for every item whenever the palette opens or the selection changes. Invalid items get a muted "adds unconnected" tag, and the reason goes in their `title`. Independent types (User, identity providers, DS, Stream, SOAR and other types that intentionally ignore the parent) get no tag. Don't disable anything; v115 adds these items unconnected.
5. **Show the add target.** At the top of the palette show "Adding after: <selected name> · Change", plus a "New unconnected" toggle. With it on, palette clicks call `addBuilderNode(type,null)`. "Change" closes the palette so the user can select another node, then reopens it. With nothing selected, show "Adding as a new unconnected component".
6. **Show descriptions inline.** Show the first clause of each item's `title` (up to the first " · " or ".") as a one-line muted subtitle under its name, truncated with ellipsis. Keep the full text in `title`. This matters on touch devices, which have no hover.

### Speed it up
7. **Recent row:** above the groups, show chips for the last 5 component types added. Keep the list in `localStorage` under a builder-specific key, wrapped in try/catch, and fall back to hiding the row. Clicking a chip adds that type, the same as the item would.
8. **Keyboard:** with focus in the search box or the list, ↑/↓ move through the visible items (roving `tabindex` or `aria-activedescendant`), Enter adds the item, and Esc closes the palette and returns focus to `#builderAddToggle`. `A` pressed over a focused canvas opens the palette; don't take over `/`, which v113 uses for Find & navigate.
9. **Accordion:** clicking the open group's header collapses it. Currently one group is always forced open.
10. **Drag hint:** under the search box, add a muted line: "Click to add · or drag onto the canvas or onto a component".

### Polish
- Shorten wrapping labels: "Authentication Provider · Cloud" / "· On premises" → "Identity provider · Cloud" / "Identity provider · On-prem". Change only the displayed label: don't rename types or `builderComponents` keys, which saved topologies depend on.
- Show `#builderPaletteCount` ("42 components") as muted text on the same row as the search box, not as a separate heading-like line.

### Acceptance criteria
- Search "hec": every group with a match expands, HEC client and HEC endpoint are the first two results, and Deployment App is not listed. Enter adds HEC client (or whichever item is ranked first).
- Search "idx" or "indexer": Indexer is the first result. Clearing the search restores the single-open accordion with Sources open.
- At 1440×900 the open palette sits within the canvas rectangle, and no part of the page header or toolbar is covered.
- With Universal Forwarder selected, Windows Event Log and Search Head show "adds unconnected", Heavy Forwarder and Indexer don't, and User/Administrator shows no tag.
- "New unconnected" on: clicking Indexer adds it with `parent===null`.
- The Recent row survives a reload, and with `localStorage` blocked the page renders without errors.
- ↑/↓/Enter/Esc work, and focus returns to `#builderAddToggle` on close.
- All 42 items still add a node when clicked (re-run the v115 sweep), and dragging an item onto a compatible node still connects it.
- No `pageerror` at 1280, 1440, 1920 or 390, or across a 1440→1000→1440 resize. Mobile is unchanged apart from the inline descriptions and the label text.
- Add a `changeRegister` entry the way v112–v115 do.

---

## 10. Next task: canvas, messaging and mobile polish (v118)

Do this after sections 8 and 9. Put all changes in `<style id="builder-ui-polish-v118-styles">` and `<script id="builder-ui-polish-v118">`. Items are listed in priority order; **1, 5 and 8 have the most effect for the least effort.** These come from a visual review of the default desktop view, the open dock, the review popover, the Inspector, the Review drawer, Focus mode and mobile, plus automated measurements of text size and contrast. Items 11–15 were added after the second pass.

### Canvas and node cards
1. **Show plane pills only on hover or selection.** Under every node, `.builderConnectionHandles` shows "Event data", "Fleet management" and "Interactive authentication". That makes `.unifiedNodeWrap` 218–255px tall instead of about 150px. On desktop, show the pills only for the hovered, focused (`:focus-within`) or selected node (`.unifiedNodeWrap.multiSelected`, or whichever node holds `state.builderSelected`). Keep them in the layout with `visibility`/`opacity` so nodes don't jump. Keep them always visible on touch devices (`@media (pointer:coarse)`), where there is no hover. Then check that Fit (the measured bounds from v112) zooms in further, and that dragging from a handle still works.
   - **Watch out:** while a connection drag is in progress, keep the handles visible on every compatible target node (they already get an `incompatible` class). Otherwise nobody can finish a connection.
2. **Remove the repeated tier label.** Each card shows its tier in the header (for example "SOURCE SYSTEM") and again in the coloured footer. Keep the header and use the footer only for extra facts ("2 pipeline sets", or a lane or status). Hide the footer when it would only repeat the header.
3. **"Production" appears twice on each node.** The chips are environment, region and network zone, and the network zone falls back to the environment ("Defaults to group or environment" in the inspector). Hide the zone chip when it is only the fallback value. Where both environment and zone are shown, prefix them ("Env · Production", "Zone · DMZ").
4. **Calm the review badges.** The starting topology shows an orange count on every node and every edge (12 findings), which reads as alarm. Colour them by severity: keep red for `error`. For review-only findings, use a small neutral dot or a muted outline badge, and show the count on hover or focus. Both `.builderNodeIssueMarker` and `.builderEdgeIssueMarker` need this. Keep them clickable (see v115) and keep their `aria-label`s.

### Status and messaging
5. **Remove the contradictory status.** `#builderValidation` says "Valid three-plane model · 0 issues" while the dock says "Review findings · 12 findings". Use one vocabulary everywhere, for example "Valid · 0 errors · 12 to review" in the validation bar, and "Review findings · 12 to review" in the dock toggle label (wrap `builderDensitySync` from v114). The "0 issues" pill should count errors only, and be labelled that way.
6. **Keep the build stamp current.** The `<title>`, `#topologyBuilder[data-build-number]`/`[data-build-date]` and `.builderBuildStamp` still say "Build 111 · 28 Sep 2026", but the page includes v112–v115. Update all four together with every release.
7. **Clarify the Tools label.** The dock toggle reads "Tools · 5 tools · Universal Forwarder 1". Change it to "Tools · for Universal Forwarder 1", or "Tools · 5" when nothing is selected, by adjusting how the v114 wrapper builds the status text.

### Page-level space
8. **Hide the page-wide search and pipeline filter in Builder.** `#search` and `#pipelineFilter` set `state.q`/`state.pipeline` and call `render()`, which drives the Flow view. Nothing Builder-specific appears to read them; **verify this first.** In the Builder view they take about 70px above the canvas and compete with the Builder's own `#builderSearchInput`. When `state.view==='builder'`, hide them, or shrink that row to just the view tabs, and restore them when leaving Builder. Also re-measure the canvas top against the section 8 target.
9. **Shorten the header description.** "Model event data, fleet management and interactive user access independently. Authentication links never carry telemetry." wraps to two lines on every visit. Move it into an ⓘ button next to the title (with a `title` or popover, and keyboard-focusable), or show it only while the canvas has no components.

### Mobile
10. **Show the Inspector as a bottom sheet on mobile.** At 390px wide, adding a node opens the Inspector full screen, over the canvas and the page header, so the new node can't be seen. Up to 760px wide, make the Inspector a bottom sheet about 60% of the viewport tall, with a drag handle that expands it to full height, plus a visible Close button. Keep the canvas above it scrolled so the selected node is in view. Keep Pin/Close working.

### Found in the second review pass
11. **Mobile: the canvas starts about two screens down.** At 390×844 the canvas top is at y=1763 (the document is 2619px tall). Above it are the page header, the page-wide search and pipeline filter, the view tabs (two rows), the builder header, the full toolbar (buttons wrap: "＋ Add" breaks onto two lines and "Inspector" is clipped), the plane toggles (labels wrap) and the search panel. Up to 760px wide:
    - Collapse the toolbar into one row: ＋ Add, Inspector, and a "More" menu holding Focus canvas, Hide minimap, Presentation, Full screen, Navigate/Build/Validate/Export.
    - Collapse the plane toggles into a compact "Planes (3)" menu.
    - Keep the search and navigate panel collapsed by default, the same as the v113 desktop dock.
    - Hide the builder description (see item 9), and hide `#search` and `#pipelineFilter` (see item 8).
    - Target: canvas top at y ≤ 700 at 390×844, and no button label wraps or clips.
12. **Anchor the desktop Inspector to the canvas.** It uses the same `position:fixed` rule as the palette (`.topologyBuilder.canvasFirst .builderInspector`). At 1440×900 it opens at the viewport's top-right, over the page stats chips and the "Operate" tab, and it hides the right-most node (Indexer). Anchor it inside the canvas's right edge, the mirror image of the palette fix in section 9 item 2, sized to the canvas and scrolling internally. While it's open, keep the selected node in view (pan if needed). The Review drawer (`openBuilderDrawer`) already sits within the builder section and is fine.
13. **Focus mode should hide the page chrome.** `.topologyBuilder.canvasFocus` hides the builder header and dock, but the page header, the page-wide search and pipeline filter, and the view tabs stay visible (about 160px). In Focus mode, hide those too, so the focus bar is at the top of the viewport. Restore them on Exit focus or Esc. Also, in the focus bar, the standalone "Saved" text next to "Save" reads like a second button; render it as a muted status (`aria-live`) or merge it into the Save button ("Save ✓").
14. **Minimum text size.** 57 visible text elements in the Builder are under 10px: node chips ("Production", "Unspecified") are 8.3px, the History count 8.8px, route labels ("TCP/TLS or UDP") 9px, dock statuses ("12 findings", "Splunk Enterprise") 9.1px, and menu labels ("Export scope", "Diagram") 9.0px. Raise all Builder text to at least 10px, and chips and labels on the canvas to at least 10.5px at 100% zoom. Canvas text also scales with zoom, so check it at the typical Fit zoom (about 100–115%).
15. **Low-contrast count.** The dock's review count ("12", 11.2px) measures about 3.8:1 against its background; raise it to at least 4.5:1. (The contrast checker also flagged the node footer tier labels at 1.1:1, but they read fine visually; that was a background-detection error. Recheck them once item 2 changes the footer.)
    - The Review drawer header already uses the wording "0 errors · 12 to review"; reuse that exact phrasing for item 5.

### Acceptance criteria
- At 1440×900 with the default topology, nodes are at most about 170px tall when not selected, and Fit zoom goes up. Hovering, focusing or selecting a node shows its pills; making a connection by drag still works.
- No node shows the same text in its header and footer, and no node shows "Production" twice.
- Review-only badges are visually muted, and error badges stay red. All badges are still clickable and keep their labels.
- The validation bar and the dock use the same error/review wording and numbers.
- The build stamp, `<title>` and `data-build-*` attributes match the release.
- In the Builder view, `#search` and `#pipelineFilter` are hidden, and they come back on Flow. The canvas top moves up by roughly their row height.
- At 390×844, adding a node shows a bottom-sheet inspector with the new node visible above it.
- At 390×844 the canvas top is at y ≤ 700, and no toolbar button label wraps or is clipped.
- At 1440×900 the open Inspector sits within the canvas rectangle, and covers no page header, stats chips or view tabs.
- In Focus mode, the page header, search, pipeline filter and view tabs are hidden, and they return on exit.
- No visible Builder text is under 10px (automated check over `#topologyBuilder` text nodes), and every text element is at least 4.5:1 contrast, excluding decorative badges.
- No `pageerror` at 1280, 1440, 1920 or 390, or across a 1440→1000→1440 resize. No horizontal page scroll. The v115 button sweep still passes.
- Add a `changeRegister` entry the way v112–v115 do.

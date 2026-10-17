# Builder handoff: one menu bar and one toolbar

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 197.
**Two new block pairs, at the end of the page (before `</body>`), in this order:**
1. **Fixes to Build 197**, needed with or without the menu bar (see "Fix first"):
   - `<style id="builder-docked-fixes-v198-styles">`, containing [`docs/mockups/builder-docked-fixes-prototype.css`](mockups/builder-docked-fixes-prototype.css);
   - `<script id="builder-docked-fixes-v198">`, containing [`docs/mockups/builder-docked-fixes-prototype.js`](mockups/builder-docked-fixes-prototype.js).
2. **The menu bar and toolbar:**
   - `<style id="builder-menubar-v198-styles">`, containing [`docs/mockups/builder-menubar-prototype.css`](mockups/builder-menubar-prototype.css);
   - `<script id="builder-menubar-v198">`, containing [`docs/mockups/builder-menubar-prototype.js`](mockups/builder-menubar-prototype.js).

Both scripts only wrap existing functions and add listeners, so there are no in-place edits. Paste the four files as they are, then add the build records (see "Build records").

**Mockup (the target):** [`docs/mockups/builder-menubar-mockup.html`](mockups/builder-menubar-mockup.html). Every scene is a screenshot of the real Builder: thirteen with both block pairs applied, and one "Today" scene from Build 197. The screenshots are `docs/mockups/compare/menubar-*.png`.
**Tested first:** both block pairs were appended to Build 197 and run. The results under "Check before uploading" come from that run.

## Why

**What Build 197 does on desktop (761 px and up):** the Builder's controls are in six places.
- **Row 1:** Saved topologies, "● Unsaved", Save, the File menu, Undo, Redo, History and the "Use in" menu.
- **Row 2:** the Data, Fleet and Access toggles, Group by and Find; then, at the right, the Layout, Validate and Analyze menus.
- **The canvas's top left:** the Tools and Groups buttons.
- **The canvas's top right:** the SOAR playbooks guide, as a pill.
- **The canvas's bottom left:** the View menu, "+ Add", "Inspector", "Hide minimap" and "?". "+ Add" and "Inspector" are hidden while docked.
- **The canvas's bottom right:** zoom (−, the level, +, Fit).

Commands, status and view controls are mixed in both rows, and three groups of controls sit on the canvas itself.

## Fix first: four faults in Build 197

The first block pair fixes these. Three come from docking: Build 197 keeps `canvasPanelState.palette` and `.inspector` set while docked, and older code reads those flags as "an overlay is open".

| # | Fault | Where | Cause | Fix |
|---|---|---|---|---|
| 1 | **The help card never shows when docked.** A first visit shows no card, and "?" does nothing. | 1280 px and up | Build 163 hides the card while the palette or the Inspector is open, both with a rule and with an inline `display:none` from `syncCanvasPanels`. | CSS shows the card while docked, unless it is `[hidden]` (dismissed) or a drawer is open. |
| 2 | **The card's shortcuts and the minimap are hidden when docked.** "Show minimap" does nothing. | 1280–1399 px | Build 122's rule hides `.builderNavigationHint` and `.builderMinimap` from 761 to 1399 px while a panel is open. | CSS shows the minimap while docked, unless you or the auto rule hid it (`minimapHidden`, `builderSpaceAutoMapHidden140`), and the shortcuts with a fine pointer. |
| 3 | **A first visit opens at 18% zoom at 768 and 1024 px.** | Every desktop width with the help card showing | `builderVisibleRect163` reserves a strip as wide as the card (about 380 px) on the left, and fits the topology into what is left. With fix 1, docked canvases would lose the strip too. | The fit reserves the card's height at the bottom instead. |
| 4 | **Esc doesn't close Tools or Groups.** | Docked: never. Every desktop width: after a section such as Bulk edit was left open | Build 140's Esc handler skips cancelled events, and Build 95's Esc handler cancels every Esc while the palette or the Inspector is open, which docking makes always. Build 140's handler also closes the first open `<details>` in the panels, which can be a section inside the closed Tools panel. And with focus inside the panel, closing it leaves focus on a hidden element. | A window keydown listener runs first and closes the open panel itself (`:scope>details[open]`). Focus returns to the panel's dock button, or to the canvas with the menu bar. It leaves the Esc to anything above the panel: the object menu, a finding's popover, an open menu, the Clear canvas or presentation dialogs, and, below 1280 px, an open Components or Inspector drawer. |

**Results with only the first block pair**, Build 197 → with the fixes (reference topology):

| Width | First-visit card | First-visit zoom | "?" | "Show minimap" |
|---|---|---|---|---|
| 768 | shown → shown | 18% → **35%** | works → works | works → works |
| 1024 | shown → shown | 18% → **40%** | works → works | works → works |
| 1280, docked | hidden → **shown** | 27% → 27% | nothing → **shows the card** | nothing → **shows it** |
| 1366, docked | hidden → **shown** | 32% → 32% | nothing → **shows the card** | nothing → **shows it** |
| 1440, docked | hidden → **shown** | 37% → 37% | nothing → **shows the card** | works → works |

Docked, the zoom is unchanged although the card now shows: the topology is fitted above it.

Esc, at 1440 (docked) and 1200: Build 197 passes 6 of 12 checks, and 12 of 12 with the fix (see check 3).

## The design

### 1. The menu bar (row 1)

From 761 px, row 1 beside the title holds seven menus: **File, Edit, View, Arrange, Validate, Analyze and Help**. At its right: the save state ("● Unsaved changes" in amber, or "Saved", with `#builderSaveState`'s text as the tooltip) and **Save**.

- Menu labels are flat text, 12.5 px, with no arrows. A menu opens below its label, left-aligned, 272 px wide, and as tall as the window allows; it scrolls if it has to.
- Items are rows with a label on the left and a shortcut or count on the right. Some have a note underneath, for example why an item is disabled. Selects ("Topology", "Scope", "Layout", "Group by", "Validate for") sit in the menu as label-and-select rows.
- Checkbox items (View › Components, Inspector, Minimap) show ✓ when on, and every label in that menu starts after the check column.
- **Keyboard:** ← and → move between menus (an open menu stays open); ↓ and ↑ open a menu from its label and move through its items; Esc closes it and returns focus to the label. With a menu open, pointing at another label opens that one.
- Outside clicks, Esc and opening another menu close menus, as for every `.builderMenu`.

### 2. The menus

Every item clicks the control it replaces (column 3), which stays in the page, hidden. Each item's disabled state, note, count and check mark are read from that control when the menu opens.

**File** (Build 197's File menu, row 1's save and load, and "Use in")

| Item | Note or right side | Does |
|---|---|---|
| Save | | `#builderSave` |
| *Saved topologies* › Topology | select | mirrors `#builderSaved` |
| Load | when disabled: why, from `.builderLoadReason163` | `#builderLoadSaved` |
| Import JSON… | | `#builderImport` |
| Import from architecture pack… | | `#builderImportPack125` |
| *Export* › Scope | select, with the scope note under it (`#builderExportScopeBar small`) | mirrors `#builderExportScope` |
| Export JSON | | `#builderExport` |
| Architecture pack | | `#builderExportPack` |
| Export SVG | | `#builderExportSvg` |
| Export PNG | | `#builderExportPng` |
| Print / present | | `#builderPrintPresent` |
| Use in explorer | | `#builderUse` |
| Open in Failure Lab | | `#builderFailure` |
| Clear canvas… | red; still asks first | `#builderClear` |

**Edit**

| Item | Note or right side | Does |
|---|---|---|
| Undo | Ctrl Z | `#builderUndo` |
| Redo | Ctrl Y | `#builderRedo` |
| History | the count, from `#builderHistoryCount` | `openBuilderDrawer('history')`. Row 1's History button opened a short list under itself; from a menu, the History drawer shows the same changes. |
| Find | / | focuses and selects `#builderSearchInput` |
| Bulk edit… | the selection, from its summary ("1 component, 0 connections") | opens Tools at `#builderBulkEdit` |
| Connection template… | | opens Tools at `#builderTemplateBar` |

**View** (Build 197's View menu, and the bottom bar's panel and minimap buttons)

| Item | Note or right side | Does |
|---|---|---|
| Components | ✓ when shown | docked: `#builderPaletteDrawerClose` (Hide) or `.dockRailLeft197`; below 1280 px: `#builderAddToggle` |
| Inspector | ✓ when shown | docked: `#builderInspectorDrawerClose` or `.dockRailRight197`; below 1280 px: `#builderInspectorToggle` |
| Minimap | ✓ when shown | `#builderMinimapToggle` |
| Zoom in | + | `.builderMobileZoomButton[data-mobile-zoom="in"]` |
| Zoom out | - | `.builderMobileZoomButton[data-mobile-zoom="out"]` |
| Fit to canvas | 0 | `#builderFitView` |
| Focus canvas | | `#builderFocusToggle` |
| Presentation | | `#builderPresentationToggle` |
| Full screen | | `#builderFullscreenToggle` |

**Arrange** (Build 197's Layout menu, Group by and Groups)

| Item | Note or right side | Does |
|---|---|---|
| Layout | select | mirrors `#unifiedLayoutMode` |
| Group by | select | mirrors `#builderGroupBy130` |
| Tidy layout | "Arrange components by relationship depth." | `#builderAutoLayout` |
| Collapse or expand all hosts | disabled without hosts | `#builderToggleHosts147` |
| Containers… | | opens the Groups panel (`#builderSpaceGroups140`) |
| Layout profiles… | | opens Tools at `#builderProfileBar` |

**Validate** (Build 197's Validate menu, and Route validation from Tools)

| Item | Note or right side | Does |
|---|---|---|
| Validate for | select | mirrors `#builderRuleProfileSelect` |
| Coverage | | `#builderCoverageToggle` |
| Review | the number of findings | `#builderUnresolvedToggle` |
| Rules | | `#builderRulesToggle` |
| Route validation… | its counts ("0 errors · 15 review items") | opens Tools at `#builderRoutePanel` |

**Analyze** (Build 197's Analyze menu, and Configuration draft from Tools)

| Item | Note or right side | Does |
|---|---|---|
| Trace path, Load selected path, Inventory, Network, Statistics | each button's own description (`.builderMenuDescription167`) | `#builderTraceToggle`, `#builderLoadPath`, `#builderInventoryToggle`, `#builderNetworkToggle`, `#builderStatsToggle` |
| Configuration draft… | the selected component, or "Select a component first" | opens Tools at `#builderConfigDraft` |

**Help**

| Item | Note or right side | Does |
|---|---|---|
| Canvas controls and shortcuts | | `.builderSpaceHelp140` (the bottom bar's "?") |
| SOAR playbooks guide | the playbook count. Disabled without a SOAR platform, with the note "Shown when the topology has a SOAR platform." | shows and opens `#builderSoarGuide`; it hides again when closed |
| About Builder | | `.builderInfo159` (the ⓘ beside the title, which stays) |

Selects in menus change the original select and fire its `input` and `change` events.

### 3. The toolbar (row 2)

Row 2 keeps the plane bar and adds controls before and after it. Left to right:

1. **Undo, Redo** (↶ Undo, ↷ Redo): disabled and titled like `#builderUndo` and `#builderRedo`, so the tooltip names the change.
2. **Zoom:** −, the level (from `#builderMobileZoomPercent`), +, Fit.
3. **＋ Add:** docked, it shows Components if hidden and puts the cursor in its search (`openBuilderCanvasPalette({focus:true})`). Below 1280 px it opens the Components drawer (`#builderAddToggle`), and `aria-expanded` follows the drawer.
4. **Data, Fleet, Access:** unchanged.
5. **Find**, with its "⋯" options: unchanged.
6. **The Validate status,** at the right end. It reads the counts from the Validate summary's title: red with errors, amber with findings to review, green "Valid" with neither. It reads "0 errors · 31 to review" from 1280 px and "31 to review" (or "2 errors") below. Clicking it opens or closes the Review drawer; `aria-expanded` and `aria-label` say which.

Group by moves to Arrange, and the Layout, Validate and Analyze menus at the right of row 2 move to the menu bar.

**Below 1280 px:** Undo and Redo show icons only, the plane toggles lose their line swatches and the Validate status shortens. Both bars still fit on one line each at 761 px; Find shrinks first.

### 4. The canvas

- **Gone from the canvas:** the Tools and Groups buttons, the bottom bar (View, "+ Add", "Inspector", "Hide minimap", "?"), the zoom group and the SOAR pill. The minimap stays.
- **The help card** sits at the canvas's bottom left (12 px in), where the bottom bar was.
- **Drawers** can use the canvas's width less 24 px when docked (Build 197 kept 92 px clear for the dock buttons).
- **The fit** keeps 16 px clear on the left instead of 56 px.

### 5. Tools and Containers

- **They open from the menus,** at the section you chose: Bulk edit, Connection template, Layout profiles, Route validation, Configuration draft or Containers. Choosing one closes any other panel, expands the section if it is collapsed, scrolls it into view (vertically only) and focuses its first control.
- **They open at the canvas's left edge,** where the dock buttons were. Docked, the panel is up to 600 px wide, and no wider than the canvas less 28 px.
- **A header names the panel and has Close.** The dock button that opened and closed it is gone. The header stays at the top while the panel scrolls. Close, or Esc (fix 4), closes the panel and returns focus to the canvas.

### 6. Focus

Build 197 returns focus to "+ Add" or "Inspector" on the bottom bar after closing Components or the Inspector, and fix 4 returns it to the dock buttons. While the bars show, those buttons are hidden, so their `focus()` goes to:
- **docked:** the canvas;
- **below 1280 px:** the toolbar's "+ Add" for Components, and the canvas for the Inspector and the dock buttons.

### 7. Unchanged

- **Phones (760 px and below):** today's Builder.
- **Focus canvas:** its own bar, bottom bar and zoom. The menu bar and the toolbar hide.
- **The docked columns, the drawers, the object menu, Find and every dialog.**
- **The header's height:** the canvas starts at y 137 at every width, as in Build 197, so the canvas keeps its size.

## How the blocks work

For maintenance; the code is in the four prototype files.

**The fixes block**
- **CSS:** scoped to `#topologyBuilder.builderDocked197` inside `@media (min-width:1280px)`, with `!important` to beat Build 122's and Build 163's rules and the inline style.
- **`builderVisibleRect163` wrapper:** when the help card shows (761 px and up, outside Focus canvas), it measures the canvas with the card hidden, then reserves the card's height plus 10 px at the bottom.
- **A window keydown listener** (capture) for fix 4. On window, it runs before Build 95's and Build 140's document listeners. It uses `builderDensityPanels`, `builderDensityDock`, `builderSpaceGroupButton140`, `builderDensitySync`, `builderSpaceMedia140` and `canvasPanelState`.

**The menu-bar block**
- **CSS:** everything is inside `@media (min-width:761px)` and scoped to `#topologyBuilder:not(.canvasFocus)`, so phones and Focus canvas are untouched. It hides `.builderHead .builderActionWrap`, `.builderGroupingControl130`, `.builderNavigation`, `.builderBottomControls`, the dock buttons and the SOAR pill. The toolbar's order comes from `order`, whatever the DOM order.
- **Delegation, not moving:** earlier blocks move these controls between slots (`builderDensityLayout`, `builderSpaceAttach140`, `builderSpaceFocusChrome140`) and rewrite them (`renderUnifiedPlaneControls`). The new controls click the originals where those blocks put them, so the originals' handlers, states and history labels are unchanged. **Don't delete the hidden controls.**
- **History:** `captureBuilderMutation` records a change around any click inside the Builder, so a delegated action is two clicks: ours, then the original's. A wrapper on `commitBuilderHistory` skips the outer one (`delegate()` sets a one-tick counter), and the original's click records the change under its own label, or nothing for Undo and Redo. Without it, Undo from a menu recorded a change of its own.
- **Menus:** `makeBuilderMenu(label, bar)`, so they get the shared close behaviour. A capture `toggle` listener fills a menu as it opens. `place()` positions bar menus (fixed, under the label, clamped to the window); `builderClampMenus163`, which right-aligns menus, is wrapped to call it.
- **The save state** reads `#builderSaveState`. "No unsaved changes" also contains "unsaved", so it tests for the clean state first (see "Optional").
- **The toolbar:** `.tbLead198` and the Validate status go into `.builderPlaneBar`. `renderUnifiedPlaneControls` rewrites that bar, so a wrapper puts them back after it. A sync (undo and redo, zoom, "+ Add", the Validate status, the save state) runs at most once a frame, after `renderBuilder`, `applyBuilderViewport` and `drawBuilderDrawer`, and from `MutationObserver`s on `#builderUndo`, `#builderRedo`, `#builderSaveState`, the zoom controls, `#builderAddToggle` and the Validate summary. Inside a redraw, the block only puts those two elements back and requests a frame.
- **Wrappers:**
  - `builderVisibleRect163`: left margin 16 px;
  - `builderHeaderFit142`: keeps `builderTwoRows142` while the bars show. Without it the header collapsed to one row, because the hidden action row measures 0 px.
- **Focus:** `focus` is overridden on `#builderAddToggle`, `#builderInspectorToggle`, the `.builderDensityToggle` buttons and `builderSpaceGroupButton140`, only while the bars show.
- **Globals it uses:** `makeBuilderMenu`, `builderClampMenus163`, `commitBuilderHistory`, `renderUnifiedPlaneControls`, `renderBuilder`, `applyBuilderViewport`, `drawBuilderDrawer`, `builderVisibleRect163`, `builderHeaderFit142`, `builderDensitySync`, `builderSpaceGroupButton140`, `openBuilderDrawer`, `closeBuilderDrawer`, `activeDrawerKind`, `openBuilderCanvasPalette`, `canvasPanelState`, `state`.

## Build records

As Build 197 did, after the two block pairs:
- `changeRegister`, group "Explorer foundations", two items:
  - `['Builder menu bar and toolbar','From 761 px, one menu bar (File, Edit, View, Arrange, Validate, Analyze and Help) and one toolbar (undo and redo, zoom, + Add, the planes, Find and the Validate status) replace the two action rows and the canvas’s dock buttons, bottom bar, zoom and SOAR pill. Phones and Focus canvas are unchanged.',true]`;
  - `['Docked help, minimap and Esc fixes','When docked, the first-visit help card, its shortcuts and the minimap show again. The first fit keeps the topology above the help card, and Esc closes the open Tools or Groups panel.',true]`.
- `#topologyBuilder` `data-build-number` 198 and `data-build-date`, and the page title, with the date you build it.
- The ⓘ text: replace the whole prefix, not only the number, so its date is current (it still reads "5 Oct 2026"): `builderInfoText159.textContent=builderInfoText159.textContent.replace(/^Build \d+ · \d{1,2} \w{3} \d{4}/,'Build 198 · <date>')`.

## Not in scope

- **The Tools panel's content is wider than the panel** (about 870 px in 600 px), so the Connection template's third column and long notes are clipped and the panel scrolls sideways. The same in Build 197.
- **Removing the hidden controls and their CSS.** The new controls click them; replace the clicks with direct calls first.
- **Phones.**

## Optional

- **Build 140's "● Unsaved" label** (`builderSpaceStatusObserver140`) tests `/unsaved/i`, which also matches "No unsaved changes", so after a save it still says "● Unsaved". It sits in row 1, which the menu bar hides; fix its test the same way if you keep it.
- **The help card's "Shift+Space add"** means "add to the selection" (Shift+Space extends it). "Shift+Space extend selection" would be clearer.

## Check before uploading

All with the reference topology (`docs/mockups/ov1-reference-topology.json`) unless stated.

### 1. Regression

- 0 `pageerror` events in every check below, from 400 to 2560 px.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 197 on the default, reference and zones (`docs/mockups/sv-zones-topology.json`) topologies: 87 of 87.

### 2. Tools

- **`node tools/builder-space-check.js index.html`:** 7/7, with the same canvas sizes as Build 197 (594, 754, 1234 and 1874 px docked; 974, 1050 and 718 px below 1280).
- **`node tools/builder-connector-check.js index.html`:** 20 of 66 lines flag "badge over label" on the small default topology (Build 197: 19, Build 196: 20). Scenarios 9 and 10 are all OK.
- **`node tools/builder-perf-check.js index.html`:** the same as Build 197 within this container's noise. Medians of two series of five alternating runs (redraw, ms):

  | Topology | Series 1: Build 197 → prototype | Series 2: Build 197 → prototype | Budget |
  |---|---|---|---|
  | default | 36 → 38 | 36 → 42 | 40 |
  | fan5 | 49 → 50 | 49 → 55 | 50 |
  | fan8 | 77 → 89 | 88 → 77 | 80 |
  | reference | 93 → 84 | 108 → 88 | 120 |

  The differences change sign between series and topologies. Both builds sit at the budgets here: Build 197 passed 0 of 10 runs, the prototype 1 of 10. **A CPU profile** of 60 redraws on the reference topology puts the menu-bar block's own code at 1.1 ms in all, about 0.02 ms a redraw: inside a redraw it only puts the toolbar's two elements back and requests a frame. Compare the two builds on a quieter machine if you want a firm number.

### 3. The fixes (first block pair only)

- **Help card, shortcuts, minimap and first-visit zoom:** the table under "Fix first".
- **Esc, at 1440 and 1200:**

  | Step | Expected |
  |---|---|
  | Open Tools with its button, then Esc | Tools closes; focus stays on its button |
  | Open Tools, focus a control inside, then Esc | Tools closes; focus returns to the Tools button |
  | Expand Bulk edit, Esc, open Groups, focus "+ Add group", then Esc | One Esc closes Groups; focus returns to the Groups button |
  | Open Tools, right-click a component, then Esc | The object menu closes and Tools stays. One more Esc closes Tools; at 1200 the Inspector drawer, which the right-click opened, closes first |
  | Open Tools, then Clear canvas…, then Esc | The dialog closes |

  Build 197 fails all four Tools and Groups steps at 1440 and two at 1200 (focus is lost, and Groups needs two Esc).

### 4. Menus, at 1440 (docked) and 1200

Each item does what the control it replaces does, with one history entry under that control's own label (none for Undo and Redo): **69 of 69 checks.** Among them:
- Save asks for a name, and the status then reads "Saved". File › Load is disabled with "No saved topologies yet" before a save, and enabled after it, with the topology in the select. Clear canvas… opens the dialog, and Cancel leaves the topology. The imports open a file chooser, the exports download, and Architecture pack opens its overlay.
- Edit › Undo and Redo undo and redo a component added from Components. History opens the History drawer.
- View › Components and Inspector hide and show the columns (1440) and open the drawers (1200). Minimap toggles the minimap; Presentation and Full screen work.
- The Arrange, Validate and Analyze selects change the originals; their buttons open the same drawers and panels.
- Help › SOAR playbooks guide opens the guide; it hides again when closed.
- Every menu fits inside the window at every width in check 6.

### 5. Toolbar

- Undo and Redo are disabled until there is a change, then undo and redo it.
- −, + and Fit change the zoom; the level follows.
- The toolbar's controls are still there after the plane toggles redraw the bar (Fleet off and on).
- "+ Add": at 1440 it shows Components and focuses its search; at 1024 it opens the drawer, and Esc or Close returns focus to it.
- The Validate status reads "0 errors · 31 to review" at 1440 and "31 to review" at 1024, and opens and closes the Review drawer.

### 6. Widths

| Width | Menu bar | Toolbar | Page scrolls sideways | First-visit zoom |
|---|---|---|---|---|
| 761 | one line | one line | no | 37% |
| 800 | one line | one line | no | 39% |
| 1024 | one line | one line | no | 47% |
| 1100 | one line | one line | no | 50% |
| 1280, docked | one line | one line | no | 30% |
| 1440, docked | one line | one line | no | 39% |

- **400:** the same as Build 197: no menu bar, no toolbar controls, the phone zoom.
- **Focus canvas at 1440:** the menu bar and the toolbar hide; the focus bar, the bottom bar and the zoom show, as in Build 197.
- **The header** has the same classes, grid and background as Build 197's, and the canvas starts at y 137.

### 7. Keyboard and focus

| Step | Expected |
|---|---|
| Focus File, press Enter, then ↓ | File is open; Save is focused |
| → | File closes and Edit opens, with Undo focused |
| Esc | Edit closes; focus is on its label |
| With a menu open, point at another label | That menu opens instead |
| 1440: Esc in the Components search | Focus moves to the canvas; Components stays |
| 1024: "+ Add", then Esc or Close × | The drawer closes; focus is on the toolbar's "+ Add" |
| 1024: the Inspector's Close × | Focus moves to the canvas |

### 8. Tools and Containers, at 1440, 1200 and 800

| Step | Expected |
|---|---|
| Edit › Bulk edit…, Validate › Route validation…, Analyze › Configuration draft… | Tools opens 9 px in from the canvas's left edge, not scrolled sideways, with that section open and focused |
| Arrange › Containers… | The Groups panel opens with "+ Add group" focused |
| Esc in any of them | The panel closes; focus moves to the canvas |
| The header (1440 and 1024) | "Tools" or "Containers" with Close, at the top, also after scrolling Tools |
| Close | The panel closes; focus moves to the canvas |
| Focus canvas, and 400 px | No header |

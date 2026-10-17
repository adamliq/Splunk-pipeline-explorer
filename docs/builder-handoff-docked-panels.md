# Builder handoff: dock Components and the Inspector beside the canvas

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 196.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="builder-docked-panels-v197-styles">`, containing [`docs/mockups/builder-docked-panels-prototype.css`](mockups/builder-docked-panels-prototype.css);
- `<script id="builder-docked-panels-v197">`, containing [`docs/mockups/builder-docked-panels-prototype.js`](mockups/builder-docked-panels-prototype.js).

The script only wraps existing functions, so there are no in-place edits. Paste both files as they are.

**Mockup (the target):** [`docs/mockups/builder-docked-panels-mockup.html`](mockups/builder-docked-panels-mockup.html). Every scene is a screenshot of the real Builder: seven with the prototype applied, and two "Today" scenes from Build 196. The screenshots are `docs/mockups/compare/docked-panels-*.png`.
**Tested first:** the block was appended to Build 196 and run. The results under "Check before uploading" come from that run.
**Tools:** this branch updates `tools/builder-space-check.js` and `tools/builder-connector-check.js` (see "Tool updates"). Copy `tools/` to `main` with `index.html`.
**Replaces** item 5 of [`builder-handoff-canvas-space.md`](builder-handoff-canvas-space.md), which docked the Inspector only from 1680 px.

## Why

The goal is the draw.io layout: shapes on the left, the drawing in the middle and the format panel on the right, all visible at once.

**What Build 196 does on desktop (761 px and up):**
- **Components and the Inspector are overlays on the canvas.** At 1440 the palette is fixed at x 30 and 300 px wide; the Inspector is fixed at the right and 340 px wide.
- **Only one shows at a time:**
  - `openBuilderCanvasPalette` closes the Inspector, and `openBuilderCanvasInspector` closes Components;
  - selecting a component opens the Inspector, which closes Components;
  - a pointerdown on the canvas closes Components, and so does adding a component from its list.
- **Pin keeps a panel open, but on top of the canvas, and it breaks the layout** (the two "Today" scenes):
  - **Pinning Components makes it cover the whole canvas** (x 17–1423 at 1440). Build 140's rule `body[data-view="builder"] .topologyBuilder.canvasFirst:not(.canvasFocus) .builderGrid{grid-template-columns:minmax(0,1fr)!important}` has specificity (0,5,1). It outranks Build 126's pinned-palette rule, which has (0,5,0). Build 140's `.builderWorkspace{grid-column:1!important}` also beats Build 126's `grid-column:2`. So the palette and the canvas share one column. This happens at every desktop width, except from 1680 px while the Inspector is open as well.
  - **Pinning both, below 1680 px, squeezes the canvas into 274 px** (x 25–299), under the palette. Build 126's both-pinned rule wins the grid, so there are three columns, but the canvas stays in the first. The Inspector still floats over the right of the page, and the middle of the page is empty.
  - **From 1680 px**, Build 140 docks the open Inspector beside the canvas, and the pinned palette too while the Inspector is open.
- **With nothing selected, the Inspector is an empty form.** It reads "No component selected", and its "Make root" and "Remove" buttons do nothing. From 1680 px, Build 140's resize grip also covers the first letters of the heading.

**Correction to my earlier note:** I said the palette also covers the Builder toolbar (Saved topologies, Unsaved and the plane toggles). That's wrong. Opened with "+ Add", the palette starts at y 137, below the toolbar (y 49–129), and covers no toolbar control. My test had opened it by setting the panel state directly. The real problem is the pinned palette above, which covers the whole canvas.

## The design

### 1. Three columns from 1280 px

- **When:** the window is at least 1280 px wide, the Builder view is showing, and Focus canvas is off.
- **Columns:** Components (280 px) · the canvas (the rest, `minmax(0,1fr)`) · the Inspector (340 px by default), with 8 px gaps.
- **Height:** the columns start level with the canvas and are the same height (`--dock-offset197` and `--dock-height197`, measured from the canvas). Each column scrolls on its own, and the page never scrolls.
- **Default:** both columns open.

| Window | Components | Canvas | Inspector |
|---|---|---|---|
| 1280 × 800 | 17–297 | 313–907 (594 px) | 923–1263 |
| 1440 × 900 | 17–297 | 313–1067 (754 px) | 1083–1423 |
| 1920 × 1080 | 17–297 | 313–1547 (1234 px) | 1563–1903 |
| 2560 × 1440 | 17–297 | 313–2187 (1874 px) | 2203–2543 |

### 2. Hide and show

- **While docked, the headers' "Close ×" buttons become "‹ Hide" (Components) and "Hide ›" (Inspector).** Each collapses its column to a 40 px rail labelled "› Components" or "‹ Inspector", and moves focus to the rail.
- **Clicking a rail shows the column again** and puts focus in it: the component search, or the Inspector's name field.
- **With both hidden at 1440, the canvas is 1294 px** (x 73–1367).
- **The choice is remembered** per browser in `splunkPipelineExplorer.dockedPanels.v1`, as `{"components":true,"inspector":true}`.
- **"+ Add" and "Inspector" leave the canvas's bottom bar while docked.** The columns have their own controls. View, the minimap, help and zoom stay.
- **The A key on the canvas, and picking a card after "Change",** go through `openBuilderCanvasPalette`. While docked, that shows Components if it was hidden and focuses the search. It skips Build 196's overlay positioning and re-fit, since the canvas doesn't move.

### 3. Selection

- **Selecting a component or link never closes Components.** Adding one from the list, from "Compatible next" or by dragging keeps it open, so you can keep adding.
- **Selecting doesn't reopen a hidden Inspector.** The Inspector rail shows a dot instead.
- **"Inspect settings" in the right-click menu does reopen it,** and so does any `openBuilderCanvasInspector({focus:true})`.
- **Components' "Adding after: …" line follows the selection.** In Build 196 it refreshes only when the palette reopens, which never happens while docked. It now updates on every selection: "Adding after: Universal Forwarder 1" with "Change", or "Adding as a new unconnected component" with nothing selected.
- **"Change" keeps Components open while docked.** Pick a card on the canvas, and focus returns to the search.
- **Only the Hide buttons collapse a column.** Esc and clicks on the canvas don't. Esc in Components hands focus back to the canvas instead of closing it.

### 4. The Inspector with nothing selected

The docked Inspector shows the topology instead of the empty form:
- the label "Topology", the topology's title and "Nothing selected";
- **Components:** the number of components;
- **Event data, Fleet management, User access:** link counts from `builderTraceEdges('data')`, `('management')` and `('authentication')`;
- **a findings box:** "N errors · M to review" with a **Review** button that opens the Review drawer, or "No findings" in green;
- **a hint:** "Select a component or link to inspect it. Right-click a component for its actions."

Examples:
- **Reference topology:** 17 components; 7, 3 and 2 links; "0 errors · 31 to review".
- **Default topology:** 4 components; 3, 0 and 0 links; "0 errors · 12 to review".

### 5. Resize the Inspector

- **A 6 px separator sits on the Inspector's left edge.** It has `role="separator"` and is focusable. Drag it, or press ← or → for 12 px a step.
- **Width:** 300–560 px, but never so wide that the canvas drops below 580 px. That caps it at 354 px at 1280. The cap is measured (the canvas's width plus the Inspector column's, minus 580), so it doesn't depend on the page gutters.
- **The width is stored** in `splunkPipelineExplorer.inspectorWidth.v1` (Build 140's key) and set on `--builder-inspector-width-v140`.
- **Build 140's grip** (`.builderSpaceResize140`) is hidden while docked.

### 6. The canvas follows

When a column is hidden, shown or resized, or the window is resized:
- a fitted view stays fitted (`builderSpaceReadFit140()`, then `fitBuilderView(false)`);
- any other view pans by half the width change, so the centre stays put.

### 7. Overlays inside the canvas

- **Drawers** (Coverage, Review, Rules, Inventory, Trace and History) open over the canvas as before. They no longer close the columns. Close a drawer and the layout is as you left it.
- **Selecting a component, or anything else that opens Components or the Inspector, still closes an open drawer,** as in Build 196.
- **While docked, a drawer stops short of the Tools and Groups buttons** at the canvas's top left: `max-width: calc(100% - 92px)`. That's 600 px at 1440 and 500 px at 1280.
- **The SOAR pill hides while a drawer is open** (`#builderInspectorDrawer.open ~ #builderSoarGuide`), at every width. In Build 196 the pill covers the drawer's Close button at every desktop width. The drawer keeps Build 196's stacking, so toasts and the Tools panel still open above it.
- **The Tools panel** fits the canvas column: `min(600px, canvas width − 110px)`. That's 600 px at 1440 and 484 px at 1280. Its dock goes from z-index 65 to 67, above the SOAR pill (66), which covered the panel on the narrow docked canvas.
- **Menus,** Find results and the object menu still open above the columns.

### 8. Pin

- **Pin is removed from 761 px up.** `#builderPalettePin126` and `#builderInspectorPin` are hidden there, and the pinned state is cleared in memory while the window is 761 px or wider.
- **Pins saved by Build 196 are ignored on desktop.** The stored values aren't touched.
- **Phones (760 px and below) keep Pin as in Build 196,** including after the window has been wider. The pinned state is restored from storage when the window narrows again.

### 9. Unchanged

- **761–1279 px:** drawers over the canvas, one at a time, as in Build 196, but with no Pin buttons.
- **Phones (760 px and below):** unchanged, Pin included.
- **Focus canvas:** unchanged. It keeps its own overlays, and leaving it brings the columns back.
- **Other views and presentation mode:** unchanged.

## Tool updates

- **`tools/builder-space-check.js`** now measures the **work area**: the canvas frame (`.builderWorkspace`) plus any panel docked beside it. With panels docked, it also requires the canvas itself to be at least 580 px wide.
  - It still checks the same width and height targets and that the page doesn't scroll.
  - **Why the frame:** Build 184 added an 8 px gutter inside the frame (`--builder-gutter184`), and the old tool measured the canvas inside it. On Build 196 the old tool reports 0/7, each width 10 px short of its target.
- **`tools/builder-connector-check.js`** clicks "+ Add" only when it is visible. While docked, Components is already open and "+ Add" is hidden.

## How the block works

For maintenance; the code is in the two prototype files.

- **CSS:** every docking rule is scoped to `#topologyBuilder.builderDocked197` inside `@media (min-width:1280px)`. The rules use `!important` because the Build 95, 126 and 140 rules they override do.
- **`syncCanvasPanels` wrapper:**
  1. While docked, it sets `canvasPanelState.palette` and `.inspector` from the stored choice, so the code that closes panels can't close the columns. When the window leaves docked mode, it closes both.
  2. It clears the pins (761 px and up) and calls the original.
  3. It toggles `builderDocked197`, `dockLeftCollapsed197` and `dockRightCollapsed197`.
  4. It sets `inert` and `aria-hidden` on hidden columns.
  5. It measures the columns, updates the Hide labels, the rail dot and the topology summary, and keeps the view.
- **A capture-phase click listener** handles the Hide buttons and the rails while docked, ahead of Build 95's and Build 126's own Close handlers.
- **A capture-phase keydown listener on Components** moves focus to the canvas after Esc while docked. Build 196's own Esc handler still runs, but the focus target it uses ("+ Add") is hidden.
- **`syncTarget`** calls `syncBuilderPaletteTarget()` (from `builder-add-palette-v117`) on selection and when Components is asked to open, while docked.
- **Other wrappers:**
  - `openBuilderCanvasPalette` and `openBuilderCanvasInspector`: close an open drawer first, as Build 196's do, then show the column instead of swapping panels;
  - `runContextAction('inspect')`: shows a hidden Inspector;
  - `switchView`, `renderBuilder`, `refreshBuilderSelection` and `toggleBuilderCanvasFocus`: resync.
- **The Inspector's cap** (`inspectorMax`) reads the canvas's width and the Inspector column's current width, so it holds whatever the gutters are.
- **The Close buttons** get Build 196's own text, `aria-label` and `title` back when undocked. Values that haven't changed aren't rewritten, so a redraw doesn't dirty the layout.
- **The topology summary** shows or hides at once, but its contents are rebuilt at most once a frame, in a `requestAnimationFrame` callback, which runs before paint. `builderFindingSummary()` runs Validate. Called inside every `renderBuilder`, it pushed the default topology's redraw from about 32 to 42 ms, over the perf tool's 40 ms budget.
- **Listeners:** a debounced window resize, the 1280 px and 760 px media queries, and a `ResizeObserver` on the canvas. The observer keeps the columns level with the canvas when the rows above it change height, for example when the recovery banner appears.
- **Globals it uses:**
  - panels: `canvasPanelState`, `canvasPalette`, `canvasInspector`, `builderPalettePinned126`;
  - Build 140: `builderSpaceInspectorWidth140`, `builderSpaceReadFit140`;
  - the summary: `builderTraceEdges`, `builderFindingSummary`, `defaultPresentationTitle`, `builderEscape`, `openBuilderDrawer`;
  - the view: `fitBuilderView`, `applyBuilderViewport`.

**Optional cleanup, later:** on desktop, Build 126's pinned-palette grid and Build 140's own docking from 1680 px no longer take effect. Leaving them is harmless (tested); remove them if you want less dead CSS.

## Not in scope

- **The Tools panel's own content is clipped,** in Build 196 too.
- **The menu bar and the Inspector's layout** (tabs or sections) are separate suggestions.
- **The connector tool's "badge over label" findings** on the small default topology. They appear in 20 of its 66 lines in Builds 192, 193, 195 and 196 alike, and in 19 with the prototype.

## Check before uploading

### 1. Regression

- 0 `pageerror` events at every width below.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 196 on the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies: 87 of 87.

### 2. Tools

- **`node tools/builder-space-check.js index.html`:** 7/7. Build 196 also scores 7/7 with the updated tool.
- **`node tools/builder-connector-check.js index.html`:** the same as Build 196. Scenarios 9 and 10 (the reference topology) are all OK; for the rest, see "Not in scope".
- **`node tools/builder-perf-check.js index.html`:** the same as Build 196 within noise. Medians of five alternating runs (redraw, ms):

  | Topology | Build 196 | Docked | Budget |
  |---|---|---|---|
  | default | 36 | 34 | 40 |
  | fan5 | 47 | 47 | 50 |
  | fan8 | 73 | 75 | 80 |
  | reference | 86 | 85 | 120 |

  In this container both builds sit at the fan5 and fan8 budgets, so single runs of either fail now and then; Build 196 passed 3 of 5. Run the tool three times on a quieter machine, and compare with Build 196 there.

### 3. Layout (reference topology)

- **Columns:** at 1280, 1440 and 1920 they match the table in item 1, with the topology fitted inside the canvas.
- **Selection:** selecting Universal Forwarder 1 changes no column, and the Inspector shows it.
- **Below 1280:** at 1200, the panels are drawers again (the canvas is x 25–1175).

### 4. Behaviour, at 1440

| Step | Expected |
|---|---|
| Load, nothing selected | Both columns open; the Inspector shows the topology summary |
| "‹ Hide" | Components becomes a rail (x 17–57); the canvas is x 73–1067 |
| Select a component | Components stays hidden |
| Click the Components rail | Components shows again; focus is in `#builderPaletteQuery` |
| "Hide ›", then select Indexer 1 | The Inspector stays hidden; its rail (x 1383–1423) shows the dot |
| Right-click → Inspect settings | The Inspector shows again, with Indexer 1 |
| Esc on the canvas | No column changes |
| Type in the Components search, then Esc | Components stays; focus moves to the canvas |
| "‹ Hide", then A on the canvas | Components shows again; focus is in the search |
| Select a card; then click blank canvas | "Adding after: <card>" with "Change"; then "Adding as a new unconnected component" |
| Select a card, click "Change", then click another card | Components stays open; focus returns to the search |
| "+ Heavy Forwarder" under Compatible next | One component is added and selected; Components stays open |
| Click a palette item; drag another onto the canvas | Each adds one component; Components stays open |
| Open the Review drawer | It sits inside the canvas column (x 466–1066); its Close button is on top; the SOAR pill hides until it closes; both columns stay |
| With a drawer open, select a component (or press A) | The drawer closes, as in Build 196 |
| Open Tools | The panel is 600 px, inside the canvas column |
| Focus canvas on, then off | On: the canvas fills the window. Off: the three columns are back |
| Resize to 1200, then back to 1440 | Drawers at 1200; columns at 1440 |
| Drag the separator 80 px left | The Inspector is 420 px and the canvas 674 px; 420 is stored |
| Reload with Components hidden | Components is still a rail, and the Inspector is still 420 px |
| File, Validate and Analyze menus; Find results | All items are on top of the columns |
| Object menu on Search Head 1 | It stays inside the canvas, with all five buttons visible |

### 5. Resizing, at 1280

- The Inspector opens at 340 px, and the canvas is 594 px.
- Dragging the separator 120 px left stops at 354 px; the canvas is 580 px.
- The Tools panel is 484 px, inside the canvas.

### 6. Drawers, at 1440, 1280, 1024 and 400 (reference topology, Review drawer)

- **The Close button is on top at every width.** In Build 196 the SOAR pill covers it at 1024, 1280 and 1440.
- **The SOAR pill** is hidden while the drawer is open and shows again when it closes.
- **A toast** (`builderStatus('…')`) and **the Tools panel**, opened over the drawer, are on top, as in Build 196.
- **At 1280** the drawer is 500 px (x 406–906), clear of the Tools buttons (x 322–360).

### 7. Narrow widths and saved state

- **400 and 1024:** "+ Add", selection, Esc, the A key and "Change" behave exactly as in Build 196. At 1024 the Pin buttons are hidden; at 400 the Inspector's Pin is still there.
- **Close buttons below 1280** (at 1024, and at 1440 narrowed to 1100): "Close ×", with Build 196's `aria-label`s ("Close component palette", "Close Inspector") and no `title`.
- **Pin on a phone (400):** Pin, open Components, close it, then widen to 1440 and narrow back. The results match Build 196 at 400, and the Inspector is still pinned after the round trip.
- **Build 196 pins saved** (`splunkPipelineExplorer.palettePinned.v1` and `splunkPipelineExplorer.inspectorPinned.v1` set to `true`), loaded at 1440: three columns, nothing covered.
- **OV, Flow and back to the Builder:** three columns. The OV page is still 1406 px wide.
- **Presentation mode:** nothing from the columns shows over it.

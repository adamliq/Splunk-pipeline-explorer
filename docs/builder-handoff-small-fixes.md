# Handoff: small fixes (Focus canvas, the page's width, two labels)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 205.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="small-fixes-v206-styles">`, containing [`docs/mockups/small-fixes-prototype.css`](mockups/small-fixes-prototype.css);
- `<script id="small-fixes-v206">`, containing [`docs/mockups/small-fixes-prototype.js`](mockups/small-fixes-prototype.js).

**Three in-place edits,** listed under "The edits". Each old string occurs exactly once in Build 205. They are also in [`docs/mockups/small-fixes.diff`](mockups/small-fixes.diff), a unified diff against Build 205's `index.html`.

Paste both files as they are, make the three edits, then add the build records (see "Build records").

**Mockup (the target):** [`docs/mockups/small-fixes-mockup.html`](mockups/small-fixes-mockup.html). Six scenes have the fixes applied, and the six "Today" scenes are Build 205. The screenshots are `docs/mockups/compare/small-fixes-*.png`.

**Tested first:** the block pair and the edits were applied to Build 205 and run. The results under "Check before uploading" come from that run.

## Why

### 1. Focus canvas hides the palette and the Inspector

**What you see,** from 761 px wide:
- **Select a component in Focus canvas** (View › Focus canvas). The Inspector opens, with `aria-hidden="false"`, but it can't be seen, and a click where it should be lands on the canvas.
- **＋ Add and the bottom bar's Inspector button** seem to do nothing.

**The cause:**
- **In Focus canvas the canvas covers the window.** `builder-canvas-space-v140-styles` gives it `position:fixed`, `inset:0` and `z-index:100`.
- **The panels are under it.** `builder-canvas-drawers-v95-styles` gives the palette and the Inspector `z-index:42`. `builder-ui-polish-v118-styles` later makes the Inspector `position:fixed`, but keeps that z-index.
- **Their tops are under the focus bar.** Both panels start at the top of the window: the Inspector at 8 px, the palette at 9 px. The focus bar (`.builderFocusBar`, z-index 110, in `builder-canvas-space-v140-styles`) covers their first 48 px, including the Inspector's Close button.
- **Phones are fine.** Below 761 px the Inspector is a sheet (`.builderMobileSheet`), and it is already in front.

### 2. The page scrolls sideways

**Measured on Build 205** in the nine views: Flow, Matrix, Config, Operate, Diagnose, Failure Lab, Changes, the Builder and OV. The widths were every 20 px from 320 to 1,480 px, then 1,700 and 1,920.

**Also on all 28 OV pages,** from AV-1 to StdV-1, with the reference topology loaded, at 16 widths from 320 to 1,920 px. Each page overflows only where the view switcher does: by 161 px at 540, 101 at 600 and 1 at 700.

| What | Where | Up to | Cause |
|---|---|---|---|
| The capacity model | 821–1,039 px, in Flow, Matrix and Operate | 193 px at 840 px; 9 px at 1,024 | `.parallelPanel`'s three columns (`minmax(250px,1fr) auto minmax(260px,auto)`) need about 1,040 px of window. They only stack below 821 px. |
| The view switcher | 821–1,000 px, every view but the Builder and OV | 174 px at 840 px | The toolbar is a grid, `minmax(250px,1fr) auto auto`, and the switcher (`.seg`) keeps its full 706 px. The pipeline filter gives way first. From about 1,300 px down it shrinks, to 26 px at 1,040 px and below, which shows only its arrow. |
| | 521–700 px, every view but the Builder, OV included | 161 px at 540 px | Below 821 px the toolbar is one column, but the switcher's buttons don't wrap. So the column is as wide as the switcher, and the search box and filter overhang the toolbar too. |
| The Failure Lab | 320–820 px | 1,430 px at 320 px | Below 821 px, `.failureLab.active` is one `1fr` column. A grid item can't be narrower than its content. `#failureDetail` holds the propagation map, whose track is `width:max-content`, about 1,670 px. So the column grows to the map's width, and the map doesn't scroll in its own box (`.mapViewport`). |

The overflows come from unnamed rules near the top of the page:
- the toolbar's grid at line 60;
- `.parallelPanel` at line 65;
- the `@media(max-width:820px)` rules at line 89.

**Correcting two of my handoffs.** The Config view handoff and the Build 205 recheck said the 9 px at 1,024 px comes from the topology chips row. That was wrong:
- the chips row scrolls in its own box;
- the overflow comes from the capacity model;
- the Config view fits because it hides the capacity model.

Both notes are corrected.

**A regression I missed in Build 205.** The Config button made the switcher 72 px wider, from 634 to 706 px:
- **the filter:** on Build 204 it kept its 248 px down to 1,240 px, and was 112 px wide at 1,100. On Build 205 it starts shrinking at about 1,300 px, and is 49 px wide at 1,100.
- **the narrow overflow:** on Build 204 it reached up to 620 px wide windows, by up to 89 px. On Build 205 it reaches up to 700 px, by up to 161 px.

The Config view handoff's width checks looked only at the Config view, so they missed it.

### 3. Two labels

- **Build 140's save label (`.builderSpaceSave140`) says "● Unsaved" after a save.**
  - `builder-canvas-space-v140` sets it in two places with `/unsaved/i.test(…)`. The clean status reads "No unsaved changes", which contains "unsaved".
  - Build 198's menu bar has the same test, and already rules out "no unsaved" first.
  - **The label is hidden at every width today:**
    - from 761 px, by the menu bar (the label sits in `.builderActionWrap`);
    - in Focus canvas's header;
    - below 761 px, by Build 140's own `@media (max-width:760px)` rule.

    So nothing visible changes. The edit makes the label right if it is ever shown again.
- **The canvas help card says "Shift+Space add".**
  - Shift+Space calls `bulkSelectContext(context, true)`. That adds the focused component or connection to the selection; it doesn't add a component.
  - The card shows on a first visit, and from Help › Canvas controls and shortcuts.

## The design

### 1. Focus canvas, from 761 px

- **In front of the canvas.** The palette and the Inspector get z-index 105, between the canvas (100) and the focus bar (110).
- **Below the focus bar.** Their top is 8 px below the bar's bottom edge.
  - The bar wraps as the window narrows: it is 48 px tall from 1,280 px, 68 at 1,024 and 82 at 800.
  - So the script keeps the bar's bottom edge in `--focus-bar-bottom206`, on `#topologyBuilder`.
  - The panels' tops are 64 px from 1,280 px, 84 at 1,024 and 98 at 800.
- **Above the bottom controls.** `bottom:64px`, which ends the panels 19 px above ＋ Add, Inspector and Show minimap.
- **Across:** the Inspector keeps its place at the right, 340 px wide. The palette, 300 px wide, now lines up with the focus bar's left edge (8 px rather than 25).
- **Everything in them works:**
  - Close;
  - adding from the palette: the new component is selected and its Inspector opens, also in front;
  - the bottom bar's Inspector button;
  - Exit focus, which puts the panels back where they were.
- **Unchanged:** the panels outside Focus canvas, and phones.

### 2. The page fits the window at every width

- **The toolbar, from 821 px,** in every view but the Builder and OV, which have their own toolbars. It becomes a flex row that wraps:
  - the search box grows from 250 px;
  - the pipeline filter keeps its own width, 248 px;
  - when the three don't fit, below about 1,310 px, the switcher takes a second row;
  - the switcher's buttons can also wrap, if the window is ever narrower than the switcher.
- **The trade-off: two rows from 821 to about 1,310 px.** The toolbar is 56 px taller there, and it is sticky, so it covers 56 px more of the page as you scroll. The alternative was to keep one row by squeezing something, and a 26 px filter is what Build 205 does today.
- **From 521 to 820 px** the toolbar is already one column. Now the switcher's buttons wrap onto a second line. They do in OV too, up to 760 px, where OV's own toolbar takes over.
- **The capacity model, from 821 to 1,080 px,** has two columns:
  - the intro and the three component boxes share the first row;
  - server.conf goes under them, with a rule above it, as it does below 821 px.

  1,080 px leaves some room above the 1,040 the three columns need.
- **The Failure Lab:** `.failureLab.active > *` gets `min-width:0`.
  - Below 821 px, the lab's column stays the window's width, and the map scrolls sideways in `.mapViewport`, as it does on wider screens.
  - The rule isn't in a media query. At 1,320, 1,440 and 1,920 px it changes nothing: every element's box is the same as on Build 205.
- **Unchanged:** at 1,320, 1,440 and 1,920 px, every element in the seven main views has the same box as on Build 205. The Builder's and OV's own toolbars are untouched.

### 3. The labels

- **Build 140's save label** reads the save status's `dirty` class. Build 140's `updateBuilderSaveState` sets that class, and the focus bar already reads it.
- **The help card** says "Shift+Space extend selection".

## The edits

All three are in Build 205's `index.html`, and each old string occurs exactly once.

**1. `<script id="builder-canvas-space-v140">`, line 6546:**
```
old: builderSpaceSave140.textContent=/unsaved/i.test(status.textContent)?'● Unsaved':'● Saved'
new: builderSpaceSave140.textContent=status.classList.contains('dirty')?'● Unsaved':'● Saved'
```

**2. The same script, line 6554, in its MutationObserver:**
```
old: builderSpaceSave140.textContent=/unsaved/i.test(s.textContent)?'● Unsaved':'● Saved'
new: builderSpaceSave140.textContent=s.classList.contains('dirty')?'● Unsaved':'● Saved'
```

**3. `<script id="builder-bulk-keyboard">`, line 3178, the help card's text:**
```
old: Enter actions · Shift+Space add'
new: Enter actions · Shift+Space extend selection'
```

## How the block works

**The style block** has four parts, each with a comment:
1. **Focus canvas.**
   - **Selectors:** `body[data-view="builder"] .topologyBuilder.canvasFocus.canvasFirst.canvasPanelInspectorOpen .builderInspector`, and the same with `canvasPanelPaletteOpen .builderPalette`.
   - **Applies:** from 761 px.
   - **Rule:** `position:fixed`, `z-index:105`, `top:calc(var(--focus-bar-bottom206,56px) + 8px)` and `bottom:64px`. Height and max-height are freed, so top and bottom set the size.
   - These need `!important`. Earlier rules set the same properties with it, for example Build 117's `bottom:auto!important` on the palette.
2. **The toolbar.**
   - **Selector:** `body:not([data-view="builder"]):not([data-view="ov"]) .shell>.toolbar`.
   - **From 821 px:** `display:flex` and `flex-wrap:wrap`. The search box gets `flex:1 1 250px`. The filter gets `flex:0 0 auto`, `width:auto` and `max-width:100%`; `width:auto` undoes the page's `select{width:100%}`. The switcher gets `flex:0 1 auto` and wraps.
   - **From 521 to 820 px:** the switcher wraps, and the same for OV from 521 to 760 px.
3. **The capacity model, 821–1,080 px:**
   - `.parallelPanel{grid-template-columns:minmax(0,1fr) auto}`;
   - `.parallelConfig` spans both columns, with the border on top rather than the left, as Build 205's narrow rule does.
4. **The Failure Lab:** `.failureLab.active>*{min-width:0}`.

**The script** finds `#topologyBuilder` and its `.builderFocusBar`.
- A `ResizeObserver` on the bar, and the window's `resize` event, write the bar's bottom edge (rounded) to `--focus-bar-bottom206` on `#topologyBuilder`.
- While the bar is hidden, its height is 0 and the last value is kept. Entering Focus canvas shows the bar, which fires the observer.
- Without the variable, the CSS falls back to 56 px: the bar's bottom at its one-row height.

## Build records

After the block pair:
- **`changeRegister`,** group "Explorer foundations":
  `['Small fixes','In Focus canvas the palette and the Inspector open in front of the canvas, below the focus bar. The page no longer scrolls sideways at any width: the toolbar wraps, the capacity model puts server.conf on its own row up to 1,080 px, and on narrow screens the Failure Lab’s map scrolls in its own box. The canvas help card says Shift+Space extends the selection, and a hidden save label no longer says Unsaved after a save.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix,** as Build 205 did in `config-view-records-v205`, with Build 206.

## Found while testing (not changed)

1. **The toolbar is taller from 821 to about 1,310 px** (see "The trade-off"). To keep one row there, the switcher would have to shrink, for example as a menu for the views that don't fit. That is a design change of its own.
2. **Phones and the Failure Lab.** In phone emulation, Build 205's 1,750 px Failure Lab also widens the layout viewport to 1,600 px. The fix removes the cause, so there is nothing more to do.
3. **The "Today" Failure Lab screenshot uses a 400 px desktop window,** not phone emulation. Because of item 2, phone emulation stops the scroll short of the map.
4. **Still open from the Build 205 recheck:**
   - the Builder's page-wide lookups;
   - a container's name can sit under the card above it;
   - on phones, the Inspector sheet with nothing selected lets taps through.

## Check before uploading

Run with Build 205 + the block pair + the three edits, and with Build 205 as shipped for comparison.

### 1. The fixes: 44 checks, all pass

Build 205 passes 8 of the 44:
- the five "after Exit focus" checks;
- "one row from 1,320 px";
- "● Unsaved after an edit";
- "no page errors".

| Check | Result |
|---|---|
| Focus canvas at 1,920, 1,440, 1,280, 1,024 and 800 px, a component selected | The Inspector is in front (the element at its centre is the Inspector), at z-index 105. Its top is 8 px below the focus bar (9 at 1,024, from rounding), and it ends 19 px above the bottom controls |
| Its Close button | Can be clicked, and closes it |
| ＋ Add | Opens the palette in front, 8 px below the bar |
| A palette item | Can be clicked, and adds a component. The new component's Inspector opens in front |
| The bottom bar's Inspector button | Closes it, and opens it again in front |
| Exit focus | The palette and Inspector are where they were before Focus canvas |
| 400 px | The Inspector sheet is in front, as on Build 205 (information only) |
| Sideways scroll | None in the nine views, every 20 px from 320 to 1,480 px, then 1,700 and 1,920 |
| The 28 OV pages | All fit at 320, 400, 540, 600, 700, 760, 800, 820, 840, 900, 1,000, 1,024, 1,100, 1,280, 1,440 and 1,920 px. On Build 205 each overflows at 540, 600 and 700 px, by up to 161 px |
| The pipeline filter | 248 px at 1,920, 1,440, 1,320, 1,300, 1,280, 1,024, 900 and 821 px |
| The toolbar's rows | One row from 1,320 px; two at 1,300 px and below |
| The capacity model | server.conf under the other two at 821, 900, 1,024 and 1,080 px; beside them at 1,081 and 1,200. Nothing overflows the panel |
| The Failure Lab at 400 px | The page doesn't scroll sideways; the map shows 304 px of its 1,667 px track and scrolls in its box |
| The help card, on a first visit | "… Keyboard arrows move · Enter actions · Shift+Space extend selection" |
| Build 140's label | "● Saved" after `markBuilderSaved()` (status "No unsaved changes"); "● Unsaved" after an edit |
| Page errors | None |

### 2. Unchanged at wide widths

At 1,320, 1,440 and 1,920 px, with animations stopped, every element's box is the same as on Build 205 in seven views: Flow, Matrix, Config, Operate, Diagnose, Failure Lab and Changes. That is 5,199 elements per view (6,561 in Changes).

### 3. Regression

| Suite | Result |
|---|---|
| View text, every view | 96 of 97 the same. The 97th is the Builder's help card line, "Shift+Space extend selection" |
| OV pages and Validate | 87 of 87 the same |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 58 of 58 |
| Menu bar actions | 69 of 69, with the same output as Build 205 |
| Parsing laboratory | 68 of 68 |
| Canvas card views | 123, unchanged |
| The space and connector tools | The same output as Build 205 |
| Page errors | None |

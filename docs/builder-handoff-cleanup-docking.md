# Builder handoff: remove the retired docking code

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 200.
**In-place edits, no new block.** They delete what Build 197's docked layout replaced: two blocks of CSS and an old Inspector resize handle. The edits are listed under "The edits". [`docs/mockups/builder-cleanup-docking.diff`](mockups/builder-cleanup-docking.diff) is the same change as a patch: from the repository root, `git apply docs/mockups/builder-cleanup-docking.diff` applies it to Build 200.

**It can go in the same build as the Parsing laboratory block** ([`builder-handoff-parsing-lab-examples.md`](builder-handoff-parsing-lab-examples.md)), with one set of build records. The two touch different parts of the page, and the patch applies before or after the block is appended.

**Tested first:** the edits were applied to Build 200 and run. The results under "Check before uploading" come from that run.

## Why

Build 197's docked layout replaced two older desktop layouts:
- **Build 126's pinned palette:** a pinned palette made the Builder a grid, with the palette in its first column.
- **Build 140's docking from 1680 px:** the Inspector sat beside the canvas at 1680 px and wider, with a resize handle on its left edge.

Build 197 turns both pins off from 761 px ("Pin is retired from 761px … Phones keep it as it was") and docks Components and the Inspector from 1280 px, with its own resizer. What is left of the older layouts in Build 200:

- **Build 126's grid rules never apply.** All five need the palette pinned, which never happens from 761 px. None of them matched in any of the 47 scenarios under "Check before uploading", saved pins and resizing from a phone included.
- **Build 140's 1680 px rules never show.** Its layout rules match at 1680 px and wider, but the docked layout overrides every one of them. Taking them out changes no layout in any of the 47 scenarios.
- **Build 140's resize handle can't resize anything any more,** and the keyboard still reaches it. It is hidden while docked. Elsewhere it is an empty span with `tabindex="0"` and `role="separator"`, at the top of the Inspector:
  - **Undocked desktops (761 to 1279 px) and Focus canvas:** it is a keyboard Tab stop called "Resize Inspector" that can't be seen and does nothing.
  - **Focus canvas from 1680 px:** the 1680 px rules give it a size, but Focus canvas keeps the Inspector at 340 px whatever its width setting says. In any case the Inspector is behind the canvas there (see "Found while testing").

## The edits

Five places, all deletions except one shortened selector. After them, `builderSpaceResize140` appears nowhere in the page.

1. **`<style id="builder-palette-pin-v126-styles">`:** delete the whole `@media(min-width:761px){ … }` block, from `@media(min-width:761px){` to its closing `}`, the line before `@media(pointer:coarse)`.
   Keep the rest of this style block:
   - **The + Add rule still applies.** On a phone, a palette pin saved before Build 197 comes back after a resize from a wider screen, and + Add shows pressed.
   - **The Pin button's own rules do nothing now.** The button is hidden at every width: by Build 128 below 761 px and by Build 197 from 761 px. They belong with Build 126's pin script, a cleanup of its own.
2. **`<style id="builder-canvas-space-v140-styles">`:** delete the whole `@media(min-width:1680px){ … }` block, from `@media(min-width:1680px){` to its closing `}`, the line before `@media(min-width:761px) and (max-width:1439px){`.
3. **The same style block's phone rule:** take `,.builderSpaceResize140` out of the selector list, so it reads
   `@media(max-width:760px){.builderSpaceSave140,.builderSpaceHelp140,.builderSpaceHelpPopover140,.builderSpaceGroupToggle140{display:none!important}}`.
4. **`<script id="builder-canvas-space-v140">`:** delete the handle's three parts:
   - the line that creates it: `const builderSpaceResize140=document.createElement('span');` … `builderSpaceResize140.tabIndex=0;`;
   - in `builderSpaceAttach140()`, the statement that puts it in the Inspector: `const inspector=$('#builderCanvasInspector');if(inspector&&builderSpaceResize140.parentElement!==inspector)inspector.prepend(builderSpaceResize140);`. `builderSpaceSchedule140()}` follows it and stays;
   - the line that gives it pointer and key handlers: `let builderSpaceResizePointer140=null;builderSpaceResize140.addEventListener('pointerdown',` … to the end of that line.

   **Keep in this script:**
   - `builderSpaceInspectorWidth140` and `--builder-inspector-width-v140`: the docked Inspector's width and its resizer use them.
   - `builderSpaceWide140`: at 1680 px and wider it still keeps the selected component in view when the canvas narrows.
5. **`<style id="builder-docked-panels-v197-styles">`:** delete the rule that hid the handle while docked:
   `#topologyBuilder.builderDocked197 .builderInspector .builderSpaceResize140{display:none!important}`.

The page is 5,939 bytes smaller.

## Not changed: the controls the menu bar and toolbar use

Build 198's menu bar and toolbar work by clicking or mirroring the older controls. The menu-bar handoff listed removing those controls as later work. **Keep them:** they are hidden only from 761 px outside Focus canvas, and elsewhere they are the controls. With the default topology:

| Where | The older controls |
|---|---|
| Below 761 px (400 and 700 px) | 34 of them are in the older More menu: Save, Load, Import, Export, Undo, Redo, Fit, the Layout and Group by selects, Tidy layout, Coverage, Review, Rules and the five Analyze tools among them. Zoom in and out, + Add, the Inspector button and ⓘ are on the canvas. The rest belong to the desktop layout: the dock's rails and Hide buttons, and the canvas help, which phones don't have. The menu bar isn't shown |
| Focus canvas, on desktop | Undo and Redo are in Focus canvas's own bar; + Add, Inspector, Minimap, ? and zoom are on the canvas; Presentation and Full screen are in its View menu |
| From 761 px, outside Focus canvas | Hidden; the menu bar and toolbar click them |

Each control's handlers, the layers later builds added around them and their history labels stay in one place this way. Replacing the clicks with direct calls would give every action a second path to keep in step. The controls can go only once phones, small tablets and Focus canvas have the menu bar or something else in their place, which needs its own design.

## Build records

After the edits:
- **`changeRegister`,** group "Explorer foundations":
  `['Retired docking code removed','Removed the CSS of the pinned palette and of the 1680px docking that the docked layout replaced, and the old Inspector resize handle, an invisible keyboard stop that resized nothing.',true]`.
- **In a build of its own:** `#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix, as Build 200 did.
- **In the same build as the Parsing laboratory block:** one set of these covers both.

## Check before uploading

All in the Builder with the default topology, unless stated. "Build 200" is the comparison: the same checks were run on Build 200 and on Build 200 with the edits.

### 1. Regression

- 0 `pageerror` events in every check below, from 320 to 2560 px.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 200 on three topologies: 87 of 87.
  - the default;
  - reference: `docs/mockups/ov1-reference-topology.json`;
  - zones: `docs/mockups/sv-zones-topology.json`.
- **The three repo tools:**
  - `tools/builder-space-check.js` and `builder-connector-check.js` print the same output as on Build 200.
  - `tools/builder-perf-check.js` gives the same redraw times, within run-to-run noise. Over three runs on each page, the slowest median per scenario was:

    | Scenario | Build 200 | With the edits |
    |---|---|---|
    | default | 39–43 ms | 41–43 ms |
    | fan5 | 53–57 ms | 52–60 ms |
    | fan8 | 82–86 ms | 82–85 ms |
    | reference | 100–111 ms | 96–98 ms |

    In the test container both pages are a few ms over the default, fan5 and fan8 budgets (40, 50 and 80 ms).

### 2. Layout

In 47 scenarios, every Builder region has the same position, size, display, grid columns and overflow as in Build 200:
- the grid, palette, workspace, canvas, Inspector, Inspector drawer, density panels, dock rails and resizer, head and plane bar;
- the page's scroll size.

The scenarios:
- **Widths 761, 1024, 1279, 1280, 1440, 1679, 1680, 1920 and 2560:** on load, with a component selected, and with pins saved from before Build 197 (`palettePinned.v1` and `inspectorPinned.v1` true);
- **1440, 1920 and 2560:** both docked panels hidden, hidden then shown, Tools open, Review open;
- **1440 and 1920:** Focus canvas, with and without saved pins;
- **Resizes:** 400 → 1920 → 1024 with saved pins; 1920 → 1024 → 1920; 1024 → 1700 with saved pins; and 400 on its own.

### 3. Earlier checks

Each script was run on Build 200 and on Build 200 with the edits. The outputs are the same, apart from the page's name where a script prints it.
- **Docked panels** (from [`builder-handoff-docked-panels.md`](builder-handoff-docked-panels.md)): geometry at four widths, panels hidden and shown, drawers, keys, parity with Build 196, targets, and the Inspector pin on phones. The keys check stops at the same step on both pages: at 1024 px it clicks the canvas's old + Add button, which Build 198's toolbar replaced.
- **Inspector tabs** (from [`builder-handoff-inspector-tabs.md`](builder-handoff-inspector-tabs.md)): behaviour, completeness, the tab strip, widths, Esc in panels, keyboard, panel headers, build records, history and the Build 199 faults.
- **The menu bar's menu actions:** 69 of 69 pass on both.

### 4. The cleanup itself

| Step | Build 200 | With the edits |
|---|---|---|
| Look for `.builderSpaceResize140` | In the Inspector | Not in the page |
| 1024 px, select a component, open the Inspector, Shift+Tab through it | One stop is invisible: "Resize Inspector" | No invisible stops |
| Focus canvas at 1440 and at 1920, select a component; separators in the Inspector the keyboard can reach | "Resize Inspector" | None |
| 1440, select a component, drag the docked Inspector's resizer 80 px left, press → twice, reload | 420, then 396, then 396 px; `inspectorWidth.v1` 396 | The same |
| A palette pin saved before Build 197 (`palettePinned.v1` true), open at 1440, resize to 400 | The palette is pinned again, + Add is pressed with its pinned border, and the Pin button stays hidden | The same |

## Found while testing (not changed)

**In Focus canvas, the Inspector is behind the canvas.** It has been since at least Build 195, at every desktop width:
- Select a component in Focus canvas, and the Inspector counts as open: the Inspector button shows pressed, and its panel has `aria-hidden="false"`.
- But it is drawn under the canvas (z-index 42 against 100), so it can't be seen or clicked.
- Pressing the Inspector button only toggles that hidden state.

This needs its own fix and check. The edits above don't touch it.

# Builder handoff: Builds 201 to 203 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 203 (`fbb8a2f`). Three builds since Build 200 (`a212f20`), one per handoff:

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 201 | `9bffe50` | The Parsing laboratory examples ([`builder-handoff-parsing-lab-examples.md`](builder-handoff-parsing-lab-examples.md)) | Both files of the block pair are identical to the prototype. The build records follow the script's code, in the same `<script>` |
| 202 | `9edf4fd` | The retired docking code removed ([`builder-handoff-cleanup-docking.md`](builder-handoff-cleanup-docking.md)) | The patch, with one line done better than the patch said (below), and the build records in a script of their own |
| 203 | `fbb8a2f` | The two canvas faults ([`builder-handoff-canvas-faults.md`](builder-handoff-canvas-faults.md)) | Both files of the block pair are identical to the prototype. The build records are in a script of their own |

Nothing else in `index.html` changed.

**Result:** all three work as specified, nothing else changed, and the build records are right. Build 200's Selection fix works too. Nothing needs fixing in Build 203.

**Tested with:**
- the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies;
- each handoff's own checks, rerun against Build 203 with the scripts that tested the prototypes;
- the menu bar's 69 actions;
- every view's text against Build 200;
- the three repo tools.

## Build 202's one difference: a fault in my patch

Edit 5 of the cleanup handoff took the old resize handle out of Build 197's rule for hiding the bottom-bar toggles while docked. In Build 200 that rule has three selectors, and the handle is the last:

```
#topologyBuilder.builderDocked197 #builderAddToggle,
#topologyBuilder.builderDocked197 #builderInspectorToggle,
#topologyBuilder.builderDocked197 .builderInspector .builderSpaceResize140{display:none!important}
```

- **What the patch did:** it deleted the third line, which left the list ending in a comma. The two toggles then joined the next rule, the dock rails' `{display:flex}`, and lost their `display:none`.
- **Why nobody saw it:** the toggles sit in the bottom bar, which the menu bar hides from 761 px. Applied to Build 201, the patch gives both toggles `display:flex` while docked, inside a bar that is `display:none`.
- **What Build 202 did:** it moved the declaration up to the second line, so the rule hides both toggles as before. That is the right edit.

[`builder-handoff-cleanup-docking.md`](builder-handoff-cleanup-docking.md) and [`docs/mockups/builder-cleanup-docking.diff`](mockups/builder-cleanup-docking.diff) are corrected to match Build 202: the diff applied to Build 201 now gives Build 202 exactly, apart from its build records.

## Build records

| | Build 201 | Build 202 | Build 203 |
|---|---|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 201 · 18 Oct 2026 | Build 202 · 18 Oct 2026 | Build 203 · 18 Oct 2026 |
| `changeRegister` entry, with the handoff's text | "Parsing laboratory examples", in "Governance and evidence" | "Retired docking code removed", in "Explorer foundations" | "Canvas chips and container names", in "Explorer foundations" |

0 `pageerror` events on loading each build.

## Build 200's Selection fix

The fix from [`builder-handoff-build199.md`](builder-handoff-build199.md), never checked on a build until now. Reference topology, two links Shift-clicked:

| | Selection's title | Chips |
|---|---|---|
| Build 199 | "1 component and 2 links selected" | Universal Forwarder 1, and the two links |
| Builds 200 and 203 | "2 links selected" | Firewalls and network devices → Syslog Server 1; Syslog Server 1 → Universal Forwarder 1 |

No errors on any of the three. Build 199's other fix still holds: a field revealed in another tab stays on that tab after a redraw and an edit.

## The Parsing laboratory on Build 203

- **The examples:** the handoff's examples check passes in full, 68 of 68, with no page errors. That covers each example's events, warnings, routes, `_time` values and configuration lines.
- **The other lab checks** give the same output on Build 203 as on the prototype:
  - persistence;
  - the accessibility tree;
  - the evidence pack;
  - Download config for every example;
  - the 1024 px layout;
  - the claims comparison against Build 200.
- **Widths:** 16 of 20 checks pass. The other 4 are the 1024 px sideways scroll the handoff lists under "Widths": 9 px, in Flow and in Operate, the same on Build 200.
- **Speed with the 1 MB input,** from the click to the next frame, measured in the same session on the prototype and on Build 203:

  | Action | Prototype | Build 203 |
  |---|---|---|
  | Choose Fixed-length records, three times | 337, 217 and 206 ms | 287, 213 and 206 ms |
  | Change TRUNCATE, then Record length | 253 and 219 ms | 221 and 205 ms |
  | Choose 1 MB line, no breaker | 207 ms | 207 ms |
  | Choose Multiline syslog after it | 16 to 20 ms | 17 to 23 ms |
  | Download results (8.48 MB) | 88 ms | 81 ms |
  | Evidence pack | 192 ms | 145 ms |

  Record length 64 gives 16,500 events of 64 characters, with `LINE_BREAKER = .{64}()`, on both.

## The cleanup on Build 203

- **The cleanup's own checks** all pass, with no page errors:
  - `.builderSpaceResize140` is not in the page.
  - In Focus canvas at 1440 and 1920 px, the keyboard reaches no "Resize Inspector" separator. Build 200 had one.
  - At 1024 px with the Inspector open, Tab finds no invisible stop. Build 200 had "Resize Inspector".
  - The docked Inspector at 1440 px: 340 px, 420 after an 80 px drag, 396 after → twice, 396 after a reload, with `inspectorWidth.v1` 396. The same as Build 200.
  - A palette pin saved before Build 197 still comes back on a phone after a resize, as on Build 200.
- **Layout:** in 46 of the 47 scenarios, every Builder region has the same place, size, display, grid columns and overflow as on Build 200.
  - The 47th, 400 → 1920 → 1024 px with old pins, is snapshotted 300 ms after a resize, while the page is still settling. Build 200 against itself differs there too: the Builder's top was 22, 30 or 33 px from run to run.
  - Given 2 s to settle, it is the same on three runs, with the Builder at 48 px on both builds.
- **The old toggles while docked:** `display:none` from their own rule, as on Build 200.

## The canvas faults on Build 203

Each check gives the same results as on the prototype.

- **Every card's chips,** on the default, reference and zones topologies at 1024, 1280 and 1920 px:

  | | With two containers added | As shipped |
  |---|---|---|
  | Card views checked | 123 | 123 |
  | Chips that fit on Build 200: unchanged | 54 | 93 |
  | A third chip row on Build 200: now two | 48 | 21 |
  | A chip on two lines on Build 200: now one | 21 | 9 |
  | Problems | 0 | 0 |

- **At the canvas's own zoom,** at 1280 and 1920 px:
  - no chip covers a stage row, and no − covers a name;
  - chips that end with …: 6 on the default topology (at 1920 px; at 1280 px it is zoomed out, with chips hidden), 9 on the reference and 12 on the zones topology, each with its tooltip.
- **Universal Forwarder 2:**
  - 1024, 1440 and 1920 px: two chip rows, ending at 108 px, above the first stage row at 109 px.
  - 400 and 700 px: three rows, and the card grows to 254 px, as on Build 200.
- **Containers:**
  - A long name ends with … at 174 px, the − sits at 193 px, and the tooltip has the whole name.
  - At 400 and 700 px, the − is clear of every name.
  - Free place layout keeps the name clear.
  - Zoomed out, the chips are hidden.
- **Clicks and tooltips:** 11 of 11 pass:
  - a real click collapses and expands;
  - the tooltips;
  - a rename clears a tooltip;
  - a chip click selects its card.
- **The Env · Test cases:** 7 of 7 pass.

## Regression

- **Every view's text** (all OV workspace pages and Validate) is identical to Build 200 on the three topologies: 87 of 87, with no page errors.
- **The menu bar's actions:** 69 of 69 pass on Build 203, with the same results as on Build 200.
- **The three repo tools:**
  - `tools/builder-space-check.js` and `builder-connector-check.js` print the same output as on Build 200.
  - `tools/builder-perf-check.js`: no consistent difference.
    - In this container the tool's figures move by 10 ms or more from run to run, and with which page runs first in a round.
    - Each figure below is the median, over four rounds, of each round's slowest median:

    | Scenario | Budget | Build 200 first: Build 200 | Build 203 | Build 203 first: Build 200 | Build 203 |
    |---|---|---|---|---|---|
    | default | 40 ms | 36.5 ms | 43 ms | 39 ms | 36.5 ms |
    | fan5 | 50 ms | 47.5 ms | 57.5 ms | 47 ms | 46 ms |
    | fan8 | 80 ms | 95.5 ms | 75 ms | 90 ms | 85 ms |
    | reference | 120 ms | 95 ms | 107 ms | 97.5 ms | 94 ms |

  - **The canvas faults CSS, measured in one page:** switching Build 203's block styles off and on between redraws changes the median redraw by −2.5 ms on default and 0 ms on fan5. The canvas faults handoff has fan8 and reference.
  - **The other two builds add nothing to a redraw.** The cleanup only removes CSS, and the Parsing laboratory block runs nothing until the laboratory is used: no timers, observers or listeners.

## Still open

### The draw.io suggestions not built yet

Three are built: the docked layout (Build 197), one menu bar and one toolbar (Build 198), and the Inspector tabs (Build 199). The rest, from the original list:

1. **Move the rest of Tools.** This is the next step the Inspector tabs handoff named. Nothing has been designed yet.
   - The configuration draft, route validation, connection template and layout profiles still open in the Tools panel.
   - On Build 203 the panel is 600 px wide and its content 870 px, so it scrolls sideways and cuts off the connection template's third column.
2. **Page tabs along the bottom** for versions of a topology, such as Current, Increment 2 and Target. Each new page starts as a copy of another, and the pages would give SV-8 something to compare.
3. **Add the next component from a hover handle.** A card's event-data handle would list only the components it can send to, and add the chosen one already connected, with matching settings.
4. **A layers panel** in place of the Data, Fleet and Access toggles: show and hide, a lock, and "new links go on this layer".
5. **Smaller touches:**
   - a light canvas in light mode;
   - icon tiles in the palette, and a way to hide groups you don't use;
   - preset zoom levels on the zoom readout;
   - small jumps where links cross;
   - keyboard shortcuts in tooltips.

### Faults and loose ends

- **Focus canvas hides the Inspector,** since at least Build 195. Select a component in Focus canvas and the Inspector opens, with `aria-hidden="false"`, but behind the canvas: z-index 42 against 100. On Build 203 a click at its centre lands on the canvas.
- **A container's name can sit under the card above it.** A container directly below another card in the same column starts so close that the card covers the top 15 px of the 27 px name. Found while testing the canvas faults.
- **Phones:**
  - the menu bar was never designed for phone widths, so phones keep the older controls;
  - with nothing selected, the Inspector sheet opens at 45% opacity with `pointer-events:none`, so a tap on it reaches the canvas behind. The same on Builds 200 and 203; first noted on Build 198.
  - The older controls the menu bar clicks stay until phones and Focus canvas have something in their place.
- **Wording:**
  - Build 140's hidden "● Unsaved" label still says Unsaved after a save;
  - the help card's "Shift+Space add" would read better as "Shift+Space extend selection".

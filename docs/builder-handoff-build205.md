# Builder handoff: Builds 204 and 205 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 205 (`63d5dc4`). Two builds since Build 203 (`fbb8a2f`), one per handoff:

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 204 | `20ef07e` | Adding the next component from a card's handle ([`builder-handoff-add-next.md`](builder-handoff-add-next.md)) | Both files of the block pair are identical to the prototype. The build records are in a script of their own |
| 205 | `63d5dc4` | The Config view ([`builder-handoff-config-view.md`](builder-handoff-config-view.md)) | Both files of the block pair are identical to the prototype. The build records are in a script of their own |

Nothing else in `index.html` changed. Each build is the one before with three blocks added before `</body>`: the style block, the script, then the build records.

**Result:**
- Both builds work as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 205.
- One cost to know about: Builder redraws are a few percent slower on Build 205. The cause is the page's size, not anything the Config view runs; see "Builder redraw times". It points to a Builder improvement worth making.

**Tested with:**
- each handoff's own checks, rerun against Build 205 with the scripts that tested the prototypes;
- the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies;
- every view's text against Builds 203 and 204;
- the menu bar's 69 actions;
- the Parsing laboratory's examples and the canvas chips, the two features rechecked on Build 203;
- the three repo tools.

## Build records

| | Build 204 | Build 205 |
|---|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 204 · 22 Oct 2026 | Build 205 · 22 Oct 2026 |
| `changeRegister` entry, with the handoff's text | "Add the next component from a handle", in "Explorer foundations" | "Config view", in "Explorer foundations" |

- Both entries show in the Changes view.
- 0 `pageerror` events and 0 console errors on loading each build.

## Adding the next component on Build 205

Every check below ran on Build 205 with the scripts that tested the prototype. Each gives the prototype's output; where lines differ at all, it is only the spacing after the shorter page name.

| Check | Build 205 |
|---|---|
| Behaviour: adding, the lists, closing, the keyboard, Free place, the vertical layout, panning, Focus canvas, a 400 px phone, the Fleet plane, the palette | 58 of 58 pass |
| Every component type's list | The same lists, with the same protocols |
| All 88 choices, each added from its list | All 88 added and connected, each labelled as the list showed and in one history step, "Add … after …". No validation errors, no page errors |
| Where the list opens: 30 cases | The same sides as on the prototype, all on screen |
| Accessible names and states | The same names, with `aria-haspopup="dialog"`, and `aria-expanded` true while the list is open and false after |
| The keyboard: 17 keys pressed with the list focused | The same results |
| Switching views; clicks on the list's heading and footer; the active handle clicked twice; the selection after an add; Esc with the docked panels; the palette's list | The same results |
| Reaching the handles: every card's Event data handle hit-tested, 3 topologies × 3 layouts | None covered. 13 are covered on Build 203 |
| The pointer moved down 1 px at a time to the handle, then clicked: 9 cases | 9 of 9 open the list. 0 of 9 on Build 203 |
| The trade-off: the pointer straight down onto the card below | As on the prototype: it lands on a handle of the upper card, in every pair the handoff lists |
| The mockup's 9 screens, retaken on Build 205 | Pixel-identical to the prototype's |

## The Config view on Build 205

| Check | Build 205 |
|---|---|
| The handoff's 49 checks | 49 of 49 pass. The output is the prototype's, line for line |
| The mapping: every setting the Matrix's Configuration column names | 51 of 51 map back to their own stage |
| Every view loads | Yes; the panel shows in the Config view only |
| Widths | 1024 px: page 1024 px, panel 970 px, no chip overflows its cell.<br>390 px: page 390 px, panel 362 px |
| Every existing Matrix row and stage detail, against Build 204 | 108 of 108 rows read the same once the Search Head cell is set aside; 108 of 108 details apart from the Search Head box |
| The mockup's 13 screens, retaken on Build 205 | 11 are pixel-identical. The other two differ only where the route diagram's moving dots are, as they do between two runs of the prototype |
| `render()` in the Matrix and Flow views | In one page, the ten search-time rows add 0.35 to 0.4 ms (Matrix 3.65 → 4.05 ms, Flow 3.50 → 3.85 ms). Across fresh pages the figures move by more than that from round to round: 3.6 to 7.0 ms on both builds |

## Regression

- **0 `pageerror` events** in every check.
- **Every view's text against Build 204:** the only differences are the Config view's own (its handoff's check 1) and the build records:
  - "Build 205" in the OV header and footers;
  - the Changes view's new entry and its counts: 219 entries, 171 of 171 implemented.
- **Against Build 203:** the same, plus Build 204's entry.
- **The OV workspace pages and Validate,** with build stamps set aside: 87 of 87 the same against Build 203, and 87 of 87 against Build 204.
- **The Failure Lab:** with each of the ten components chosen, and in each of its 64 scenarios, the same as on Builds 203 and 204.
- **The menu bar's 69 actions:** 69 of 69 pass on Builds 203 and 205, with the same output.
- **The Parsing laboratory's examples:** 68 of 68 pass on Build 205.
- **The canvas chips and container names:** all 123 card views are the same as on Build 203, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output on Builds 203, 204 and 205.

## Builder redraw times

`tools/builder-perf-check.js`, 12 rounds of Builds 203, 204 and 205 in rotating order. Each figure is the median over the rounds of each run's slowest median (a moved card, a changed or an unchanged redraw):

| Scenario | Budget | Build 203 | Build 204 | Build 205 | Build 204 − 203, by round | Build 205 − 204, by round |
|---|---|---|---|---|---|---|
| default | 40 ms | 45.5 ms | 54 ms | 53.5 ms | +4 ms; slower in 8 of 12 | +0.5 ms; slower in 6 of 12 |
| fan5 | 50 ms | 63.5 ms | 62 ms | 69.5 ms | −2 ms; slower in 5 of 12 | +12 ms; slower in 9 of 12 |
| fan8 | 80 ms | 97 ms | 86 ms | 105.5 ms | −11 ms; slower in 2 of 12 | +18 ms; slower in 9 of 12 |
| reference | 120 ms | 116.5 ms | 112 ms | 128.5 ms | −1.5 ms; slower in 5 of 12 | +20 ms; slower in 10 of 12 |

- **Build 204's block:** no consistent difference, as its handoff found.
- **Build 205's block: redraws a little slower, because the page is bigger.**
  - **None of its code runs during a Builder redraw.** The five functions it wraps are called 0 times in 5 redraws.
  - **Its styles cost nothing measurable.** Switched off and on in one page, 48 redraws each way, the median moved by +2.7, −1.6 and −2.0 ms on the default, fan8 and reference topologies.
  - **Profiled over the perf tool's whole sequence,** 6 pages each, Build 205 takes 3% more CPU (94.5 s against 91.5 s). The increase is all in the browser's own calls:
    - `getBoundingClientRect` +6%;
    - `querySelectorAll` +8%;
    - `querySelector` +9%.
  - **Build 205 has 362 more elements** (5,948 against 5,586), nearly all in views hidden while the Builder shows:
    - the Matrix's new rows and Search Head column (269);
    - the Flow view's ten new cards (70);
    - the Search Head's strip card, and the Config view's line and empty panel (15);
    - a few others, such as the two hidden file inputs.
  - **With the Flow cards and the Matrix detached from the page,** a reference redraw takes the same time on both builds: 90 ms on Build 205 against 92 ms on Build 204, the median of 6 pages each. Attached, it takes 107 ms against 95 ms.
- **Why the page's size matters to the Builder:**
  - A reference redraw makes 141 page-wide `querySelector` and `querySelectorAll` calls, which take 16 ms of the redraw, with each call timed. Its 613 calls scoped to an element take 1 ms.
  - Many of the page-wide calls look up elements that are always there, several times each redraw:

    | Selector | Calls per redraw |
    |---|---|
    | `.builderWorkspace` | 14 |
    | `.unifiedBuilderWorld` | 13 |
    | `.builderCanvas` | 8 |
    | `.builderPlaneBar` | 7 |

  - A page-wide `querySelector` searches in document order. The Flow cards (826 elements) and the Matrix (1,910) come before the Builder: `#topologyBuilder` is element 3,849 of the page, and `.builderWorkspace` element 4,478. So every such lookup walks the hidden views first, and Build 205 made those views bigger.
  - **The cost was already there on Build 204:** detaching the hidden Matrix alone saves 6 to 22 ms per reference redraw on both builds.
  - **A fix, not done here:** look the Builder's elements up within `#topologyBuilder`, or keep the ones that never change. That would recover Build 205's cost and the larger one the hidden views already carried. It's listed under "Still open".

## Still open

### The draw.io suggestions not built yet

Four are built: the docked layout (Build 197), one menu bar and one toolbar (Build 198), the Inspector tabs (Build 199), and adding the next component from a handle (Build 204). The rest, from the original list:

1. **Move the rest of Tools.** On Build 205 the Tools panel is still 600 px wide with 870 px of content, so it scrolls sideways and cuts off the connection template's third column.
2. **Page tabs along the bottom** for versions of a topology, such as Current, Increment 2 and Target.
3. **A layers panel** in place of the Data, Fleet and Access toggles: show and hide, a lock, and "new links go on this layer".
4. **Smaller touches:**
   - a light canvas in light mode;
   - icon tiles in the palette, and a way to hide groups you don't use;
   - preset zoom levels on the zoom readout;
   - small jumps where links cross;
   - keyboard shortcuts in tooltips.

### Faults and loose ends

- **New: the Builder's page-wide lookups** (above). Scoping them to `#topologyBuilder`, or keeping the elements that never change, would make every redraw cheaper, and stop hidden views from costing the Builder time.
- **Focus canvas hides the Inspector,** still on Build 205. The Inspector opens with `aria-hidden="false"`, but behind the canvas: z-index 42 against 100. A click at its centre lands on the canvas.
- **A container's name can sit under the card above it,** as found on Build 203. Neither new build touches it.
- **Phones:**
  - the menu bar was never designed for phone widths, so phones keep the older controls;
  - with nothing selected, the Inspector sheet opens at 45% opacity with `pointer-events:none`, so a tap on it reaches the canvas behind. The same on Builds 203 and 205.
- **At 1024 px the page is 9 px wider than the window** in Flow, Operate and Matrix, on Builds 203 and 205. The Config view hides the topology chips row that causes it, and fits.
- **Wording:**
  - Build 140's hidden "● Unsaved" label still says Unsaved after a save;
  - the help card's "Shift+Space add" would read better as "Shift+Space extend selection".
- **From the add-next handoff's "Found while testing",** left as they were by design:
  - Esc doesn't cancel a pending connection outside the list;
  - new Splunk-to-Splunk links get port 0;
  - "Configured handoff" labels many pairs;
  - the palette's other adds leave the selection tick on the card selected before;
  - Syslog Source → Splunk Cloud indexing is allowed by the capability check but rejected by validation;
  - Free place leaves 6 px between stacked cards.
- **From the Config view handoff's "Found while testing":**
  - the Matrix header, now at the top of the table, doesn't follow the page;
  - search-time precedence on a search head follows app context, and the view uses the global order;
  - the path presets don't name search time;
  - a monitor finds its `[source::]` stanza by exact path only;
  - the Builder's search heads are separate from the strip's Search Head.

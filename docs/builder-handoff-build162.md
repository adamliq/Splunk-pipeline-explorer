# Builder handoff: Build 161 review and tasks for Build 162

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `abe5ce5` (Build 161: `builder-indexed-redraw-v161`), merged into branch `claude/build-page-layout-bl6jk1`. Checked against [`builder-handoff-build161.md`](builder-handoff-build161.md).
**Next block:** `builder-…-v162`.

**Tool update:** `tools/builder-perf-check.js` on branch `claude/build-page-layout-bl6jk1` now also measures **`movedRedrawMs`**.
- **What it does:** switches to free layout, moves the last card by a different offset before each of 5 timed redraws, then restores the layout. Routes and path `d` strings change on every move, so caches keyed on unchanged geometry can't help. This is the realistic drag/drop case.
- **Pass rule:** a scenario now passes only when **both** `redrawMs` and `movedRedrawMs` are within budget.
- **Copy:** copy `tools/` to `main` with the next upload.

## TL;DR: a real speed-up on larger topologies; small ones still sit on the budget

| # | Task | Result |
|---|---|---|
| 1 | DOM index, path length cache, fewer queries | ✅ **Done.**<ul><li>One index per redraw, written right after the canvas markup (`builderWriteCanvas161`).</li><li>`d`-keyed caches for lengths, points and samples.</li><li>Palette membership cache.</li><li>The developer's profile: queries per redraw down from 90 to 71 (64 warm).</li></ul> |
| 1b | Containment | ✅ Added (card and world layout/style kept local). |
| 2 | Cheaper change detection (revision counter) | ❌ **Not done.** The v160 signature still serialises `state` + `builderHistory` on every call. |
| 3 | Redraw-skip safety | ✅ No staleness found. Selection, inspector, adding a component and validation counts all behave as in Build 160. |
| 4 | Commit the notes file | ❌ Not in the repo. The comment says: "committed locally … publication requires GitHub write access". |

**No regressions:**
- **Pixel comparison** against Build 160: the default canvas, the reference topology and a collapsed shared host are visually identical (0 pixels differ by more than anti-aliasing). OV-1, OV-2, OV-3 and TM-1 are byte-identical.
- **0 errors:** on load and across **189 buttons**.
- **Checks:** canvas space 4/4; connector check all OK; `?builderDev` parity passes.
- **Phones:** at 360 and 390, unchanged (canvas 648/752px, first card visible and centred, no overlaps).
- **TM-1:** unchanged and correct.

### Performance (median of 5, ms; 3 runs each, Builds 159/160/161 run alternately)

`redrawMs` (a state change, same geometry) / `movedRedrawMs` (a card moved):

| Scenario | Build 159 | Build 160 | **Build 161** | Budget |
|---|---|---|---|---|
| default | 38–40 / 41–48 | 38–43 / 37–41 | **37–40 / 40–47** | 40 |
| fan5 | 44–66 / 43–50 | 47–49 / 49–55 | **41–59 / 46–58** | 50 |
| fan8 | 63–78 / 68–100 | 65–70 / 71–84 | **50–70 / 62–73** ✅ | 80 |
| reference | 83–91 / 83–111 | 85–93 / 86–137 | **61–66 / 66–104** ✅ | 120 |

- **fan8 and reference** are now about **25–30% faster** and inside budget on every run, including after a move.
- **default and fan5** haven't changed since Build 157 and still sit **on** the budget. Normal machine noise fails them in about half of the runs, so `allOk` passed in 0 of 3 runs here.
- **Machine difference:** the developer measured 16–18 / 21–24 / 28–32 / 32–34 ms on their machine, about half the time measured in this environment. The budgets were set in this environment, so keep measuring here.

---

## 1. Cut the fixed cost every redraw pays

At 4 components a redraw still takes about 40 ms here. Topology-size work is now small (the reference topology is only about 25 ms more than default), so the rest is **fixed cost**. Per the v161 notes, it's still about 64–71 `querySelectorAll` calls per redraw, plus panel and wrapper work.

1. **Revision counter instead of the v160 signature** (carried over from item 4 of the Build 161 handoff).
   - `JSON.stringify([state, builderHistory, canvasPanelState, …])` runs on **every** `renderBuilder` call.
   - Replace it with `builderRevision162`, incremented in:
     - `pushBuilderHistory` / `builderCommit`;
     - the inspector `input`/`change` handlers;
     - `loadTopologyDocument`;
     - any direct state writer the button sweep finds.
   - Keep the MutationObserver/resize invalidation.
2. **Get queries per redraw under 30.** Use the `?builderDev` counter to list the selectors still queried on every redraw, with counts, and route the top ones through `builderDomIndex161`. Likely candidates are the wrapper blocks that don't use the index yet:
   - v140 space rail;
   - v147 host decoration;
   - v148 cloud cards;
   - v151 text polish;
   - v153 grammar pass;
   - v156 mobile toolbar.
3. **Panels outside the canvas** (inspector, history, review, inventory) still rebuild on every real redraw. Rebuild each only when its own inputs change, keyed on the revision counter plus the selection.

**Check:**
- `node tools/builder-perf-check.js index.html` (the updated version) reports `allOk: true` on **three runs in a row**, with both `redrawMs` and `movedRedrawMs` within budget.
- Record queries per redraw in the notes.

## 2. Notes file: get it into the repo

The developer can't push, and the uploader only adds `index.html` to `main`. Either:
- **Upload** `docs/builder-build161-notes.md` (and future notes) together with `index.html` in the same "Add files via upload"; or
- **Keep** the notes inside the v-block's header comment (as v161 does), and drop the "committed locally" line.

## 3. Optional: decide whether the small-topology budget is right

40 ms for 4 components is below the 50 ms "long task" threshold, and nothing has felt slow since Build 157. If item 1 doesn't bring default and fan5 clearly under budget, the owner may choose to set the default/fan5 budgets to 45/55 ms. That's the owner's call, not the builder AI's; don't change `BUDGET` in the tool.

## 4. Carried over

- **Inventory Host column:** check `builderInventoryRows()` and the pack inventory table.
- **From `builder-handoff-build141.md`:**
  - OV-2: self-needlines and pill overlaps;
  - OV-3: doubled chip labels;
  - OV values;
  - OV-1: markers and tags;
  - canvas: minimum text 11.5px and the Fit 100% snap;
  - connector tool: fan-out scenario 9.

---

## How to verify
1. 0 `pageerror` events. Button sweep (189) and grouping sweep are clean.
2. All three tools pass. Perf: `allOk` on three runs in a row, with both redraw kinds. Space 4/4; connector all OK.
3. `?builderDev`: the parity test passes; queries per redraw are recorded.
4. Phones at 360×740 and 390×844 as in Build 159.
5. Validation counts update on add/remove; selection updates the inspector.
6. Canvas, OV-1/2/3 and TM-1 look the same as in Build 161 (pixel comparison).
7. A `changeRegister` entry and the build stamp for v162.

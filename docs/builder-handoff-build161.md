# Builder handoff: Build 160 review and tasks for Build 161

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `39c3891` (Build 160: `builder-stable-canvas-v160`), merged into branch `claude/build-page-layout-bl6jk1`. Checked against [`builder-handoff-build160.md`](builder-handoff-build160.md).
**Next block:** `builder-…-v161`.

**Tool update (important):** `tools/builder-perf-check.js` has changed on branch `claude/build-page-layout-bl6jk1`; copy `tools/` to `main`.
- **Before:** it timed five back-to-back `renderBuilder()` calls with **no state change**. v160 now skips those entirely, so the old tool reported **0 ms** for every scenario.
- **Now:** it sets an inert field on the first component (`perfProbe`) before each timed redraw, the way a drop, add or edit changes state. `redrawMs` therefore measures a **real redraw**.
- It also reports `unchangedRedrawMs` (a redraw with nothing changed), and counts path lookups for real redraws only.

## TL;DR

| # | Task | Result |
|---|---|---|
| 1 | Profile, then fix the biggest cost | ◐ **Profiled** (summary in the v160 block comment), but the fix **only skips redraws where nothing changed**. A real redraw (drop, add, edit, undo) **costs the same as in Build 159** (table below). |
| 2 | Replace the element-level property overrides | ✅ **Done.** `builderSetHTML160` and `builderSetText160` are called at the write sites, with `/* v160 */` comments. The overrides are gone, and validation counts still update (12 → 16 → 12 when a Heavy Forwarder is added and removed). |
| 3 | Phone nav fade | ✅ Done (right-edge mask while there's more to scroll). |
| — | Missing notes file | ❌ The v160 comment says "Full profile tables live in `builder-build160-notes.md`", but that file isn't in the repo. |

**Also checked:**
- **0 errors:** on load and across **189 buttons**.
- **Canvas space:** passes at all 4 sizes. **Connector check:** every scenario OK.
- **`?builderDev` parity test:** passes.
- **Phones:** at 360 and 390, unchanged from Build 159 (canvas 648/752px, first card visible and centred, no overlaps).
- **TM-1:** unchanged and correct.
- **Selection, inspector and adding a component:** all update the canvas as in Build 159. The redraw skip didn't hide any change I tested.

### Performance with the corrected tool (median of 5, ms)

| Scenario | Build 159: real redraw | **Build 160: real redraw** | Build 160: nothing changed | Budget |
|---|---|---|---|---|
| default | 36 · 36 · 39 · 44 | **43 · 44 · 42 · 39** | 0 | 40 |
| fan5 | 48 · 43 · 44 · 43 | **53 · 45 · 51 · 48** | 0 | 50 |
| fan8 | 64 · 60 · 61 · 72 | **78 · 81 · 84 · 87** | 0 | 80 |
| reference | 80 · 82 · 84 · 96 | **112 · 95 · 108 · 85** | 0 | 120 |

A real redraw in Build 160 is **the same or slightly slower** than in Build 159. Each call now also builds `JSON.stringify([state, builderHistory, canvasPanelState, …])` to compare signatures, and that grows with the topology and the history.

---

## 1. Make real redraws faster (the profile shows where)

v160's own profile (20 redraws, default topology), per redraw:

| Cost | Total (20 redraws) | Per redraw |
|---|---|---|
| `querySelectorAll` | 91.8 ms | **4.6 ms** |
| Style recalculation | 57.2 ms | **2.9 ms** |
| `getTotalLength` | 56.3 ms | **2.8 ms** |
| Layout | 35.4 ms | 1.8 ms |
| bounding boxes | 33.2 ms | 1.7 ms |
| `innerHTML` | 32.1 ms | 1.6 ms |
| `getPointAtLength` | 24.0 ms | 1.2 ms |

Fix the top three directly; skipping identical redraws doesn't touch them:

1. **`querySelectorAll` (4.6 ms):** the many wrapper blocks each re-query the canvas (`$$('#builderTree …')`, `svg.querySelectorAll('.edgeRouteLabel')`, `.builderEdgeIssueMarker`, `[data-unified-node-wrap]`, …).
   - Build **one index per redraw**, right after the canvas markup is written: `builderDomIndex161 = {cards: Map(id → el), paths: Map(key → path), labels: Map(key → g), markers: Map(key → el)}`.
   - Have the hot wrappers read from it: label placement, connector geometry, host boxes, cloud cards, the minimap, the space rail.
   - Add a counter in development builds (wrap `Element.prototype.querySelectorAll` under `?builderDev`) and record queries per redraw before and after.
2. **`getTotalLength` (2.8 ms):** the path length only changes when the path's `d` changes. Cache it in a `Map` keyed by the `d` string (or on the element: `el._len161`, `el._d161`), and reuse it in `builderPerfSample149` and the label code.
3. **Style recalculation (2.9 ms):** every redraw replaces `#builderTree`'s markup, so the browser restyles every card. Two options:
   - **Keyed update:** keep each card's element when its own data is unchanged (compare a per-card signature) and replace only changed cards and the connector layer.
   - **Containment:** at least add `contain: layout style` to `.unifiedBuilderWorld` and to each card wrapper, so a restyle stays local.
4. **Signature cost:** keep v160's skip if you like, but compute the signature cheaply. Use a **revision counter** bumped wherever state changes (history push, `builderCommit`, inspector input handlers) instead of serialising all of `state` and `builderHistory` on every call.

**Check:**
- `node tools/builder-perf-check.js index.html` (the new version) reports `allOk: true` on three runs in a row, with `redrawMs` at or under budget.
- `unchangedRedrawMs` stays near 0.
- Put a before/after table in `docs/builder-build161-notes.md`, and commit that file.

## 2. Redraw skip: keep it safe

The skip returns early when the signature, dirty flag and canvas element are unchanged. It's invalidated by DOM mutations, input/change/toggle events and resize. Things that can still go stale:
- **Globals outside `state`** that change the drawing: theme, rule profile objects held outside `state`, cached geometry like `builderPerfPaths149`, palette search text. List each one and either add it to the signature/revision or invalidate on its change.
- **The time bucket:** `Math.floor(Date.now()/60000)` in the key means a full redraw once a minute even when idle. That's fine, but it should only refresh the history times, not redraw the canvas.

**Check:** the button sweep and grouping sweep with a canvas snapshot before and after each action. Any action that changes what's visible must change the canvas.

## 3. Small

- **Notes file:** commit `docs/builder-build160-notes.md` (the comment refers to it), or remove the reference.
- **Phone nav fade:** works. Also hide the fade once scrolled to the end (already done via the `scroll` listener; confirm on resize).

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
2. All three tools pass, with the **updated** perf tool: `allOk` on three runs in a row, space 4/4, connector all OK.
3. `?builderDev`: the parity test passes; the query counter shows fewer queries per redraw.
4. Phones at 360×740 and 390×844 as in Build 159.
5. Validation counts update on add/remove; selection updates the inspector.
6. TM-1 as before. A `changeRegister` entry and the build stamp for v161.

# Builder handoff: canvas slows down from about 5 components

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** `main` at `67481e2` (Build 147). Use the next free block number (`builder-canvas-perf-v148` or later). **Do this before the new features** (shared hosts, Splunk Cloud indexing, threat model): each one adds connectors and makes it worse.
**Tool (new):** `node tools/builder-perf-check.js index.html` measures redraw time at 4, 5 and 8 components and on the reference topology, against budgets. It's on branch `claude/build-page-layout-bl6jk1`; copy `tools/` to `main` with `index.html`.

## Symptom

On the Builder canvas, every drop, add, edit and Undo gets slower once there are about 5 components. With about 10 connections, each action freezes the page for about a second. Panning, zooming, the minimap and selecting a card stay fast; it's the **full redraw** (`renderBuilder()`) that blows up.

## Measured (Build 147, headless Chromium, 1440×900)

| Topology | Components / links | Path-point lookups per redraw | Redraw time |
|---|---|---|---|
| Default | 4 / 3 | 59 | 41–52 ms |
| + 1 forwarder (first fan-out) | 5 / 4 | 3,354 | 92–106 ms |
| + 2 forwarders | 6 / 5 | 5,597 | 167 ms |
| + 3 forwarders | 7 / 6 | 19,600 | 433 ms |
| + Deployment Server managing 4 forwarders | 8 / 10 | **94,340** | **1,214–1,306 ms** |
| `docs/mockups/ov1-reference-topology.json` | 17 / 12 | 41,603 | 880–892 ms |

For comparison: a pan frame takes about 1.6ms with 17 components, and the minimap about 1ms. Selecting a card triggers no redraw.

## Cause

A CPU profile of a drop with 8 components and 10 links: `renderBuilder` 914ms, of which `updateFreeConnectorGeometry` takes 819ms. Inside that, label placement takes 766ms, and the browser's `SVGGeometryElement.getPointAtLength()` alone takes **734ms**.

Three layers place connector labels, each one wrapping the last:

| Function | Line (Build 147) | What it does |
|---|---|---|
| `builderV123PlaceLabels` | ~4298 | base pass: for each label, tries positions along its own path (`getPointAtLength(length*fraction)`) and checks overlap with card boxes and placed labels. Cheap on its own (56 lookups at 4 components) |
| `builderFanoutLabels131` | ~5439 | re-places labels on fan-outs. For **each label × 14 candidate fractions × every other path**, walks the other path every 8px with `getPointAtLength` to count crossings |
| `builderFanoutRepair136` | ~5866 | repairs again. For **each label × 16 fractions × every other path**, walks the other path every 9px with `getPointAtLength` |

So the cost is about **labels × candidates × other paths × (path length / 8px)**, roughly the square of the number of links, done twice, and the same "other path" is re-sampled for every candidate of every label.

**Why it starts at about 5:** the default 4-component chain has no fan-out, so the two fan-out layers do almost nothing (0 lookups). The usual 5th component, a second forwarder under the Syslog Server, creates the first fan-out, and the lookups jump from 59 to 3,354.

Smaller, constant costs that are visible even at 4 components:
- `polishBuilderText` (~17ms);
- `formatBuilderHistoryTime` (~10ms, called during `renderBuilderHistory` on every redraw);
- `builderContentSize` and `builderCardBox` (layout reads through `getBoundingClientRect`, about 100–400 calls per redraw);
- about 54–86 `innerHTML` writes per redraw.

---

## Fix

### 1. Sample every connector once per redraw (the main fix)

Before any label placement runs, build a geometry cache once:
```js
// once per updateFreeConnectorGeometry() call
const builderPathCache148 = new Map(); // key: plane:edgeId
for (const path of svg.querySelectorAll('path.unifiedConnector')) {
  const total = path.getTotalLength(), pts = [];
  for (let at = 0; at <= total; at += 8) { const p = path.getPointAtLength(at); pts.push(p.x, p.y); }
  const bb = path.getBBox();
  builderPathCache148.set(path.dataset.edgePlane + ':' + path.dataset.edgeId, { path, total, pts: new Float32Array(pts), bbox: bb });
}
```
Better still, build the point list from the router's own data: `relationshipPath` and the routing functions already know the segment and curve control points, so `pts` can be computed without touching the DOM.

Then rewrite the inner loops in `builderFanoutLabels131`, `builderFanoutRepair136` and `builderV123PlaceLabels` to read `cache.pts` (plain array math) instead of calling `getPointAtLength`:
- **A label candidate's point:** interpolate from the label's own cached `pts` at `fraction × total`.
- **The crossing count against another path:** first skip the path if its cached `bbox` doesn't intersect the candidate's box (most don't); otherwise loop over its `pts` and test containment.

Expected lookups per redraw: one pass over every path (about 10 paths × 60–100 points = **under 1,000**, down from 94,340).

### 2. Merge the three label passes into one

The v123 base placement is followed by v131's fan-out placement and then v136's repair, and each re-samples everything. Write one `builderPlaceLabels148()`:
1. order the labels by fan-out group, then by length;
2. for each label, score the candidates once (overlap with cards, placed labels, badges, other paths), using the cache;
3. place the label and add its box to `placed`.

Keep the same scoring rules as today, so the output looks the same:
- labels stay clear of cards and other labels;
- badges sit at the label's right end;
- fan-out labels sit after the split.

Remove the three old wrappers from the call chain (keep the functions only if something else calls them).

### 3. Don't place labels during drags

During a card drag, `updateFreeConnectorGeometry` is called repeatedly.
- **During the drag:** re-route the moving card's connectors only, and put their labels at the path midpoint, without collision scoring.
- **On drop:** run the full placement once, in `requestIdleCallback` with a 100ms timeout, falling back to `setTimeout(…, 0)`, so the drop paints first.

**Check:** dragging a card in the 8-component topology keeps 50+ fps (no long task over 50ms during the drag).

### 4. Trim the fixed cost of every redraw

- **`formatBuilderHistoryTime`:** cache the formatted strings per history entry (they only change once a minute); re-render the history list only when the history changes or a minute passes.
- **`polishBuilderText`:** run it only on newly inserted nodes (a `MutationObserver` or a flag on rendered elements), not over the whole builder every redraw.
- **Layout reads:** read every card box once per redraw into a `Map` (`builderCardBox` is called repeatedly for the same cards) and reuse it in routing, labels and the minimap. Don't interleave writes and reads (each read after a write forces a layout).
- **Panels:** only rebuild the inspector, review list, inventory and history (the ~54–86 `innerHTML` writes) when their inputs changed. Keep a signature (for example a JSON hash of the selection plus the relevant details) and skip the write when it's unchanged.

### 5. Keep it fast: add the performance check to the routine

- Run `node tools/builder-perf-check.js index.html` before every upload, alongside the connector and space checks.
- **Budgets** (median of 5 redraws, headless Chromium):

  | Scenario | Budget |
  |---|---|
  | default (4 / 3) | 40 ms |
  | fan5 (5 / 4) | 50 ms |
  | fan8 (8 / 10) | 80 ms |
  | reference (17 / 12) | 120 ms |

- The tool also reports `pathPointLookupsPerRedraw`, which should stay under about 1,500 for the reference topology after fix 1.

Build 147 today: 52 / 106 / 1,306 / 892 ms, so all four fail.

---

## Acceptance
1. `node tools/builder-perf-check.js index.html` reports `"allOk": true`.
2. Labels look the same as before (same rules), and `node tools/builder-connector-check.js index.html` still reports every scenario OK, including the fan-out cases (and scenario 9 once added).
3. The 8-component topology drags smoothly (no long task over 50ms during a drag); one full placement runs after the drop.
4. No behaviour change: undo, history, inspector and review findings behave as before; 0 `pageerror` events; the button and grouping sweeps pass.
5. Add a `changeRegister` entry: "Faster canvas: connector labels are placed from cached path geometry in one pass."

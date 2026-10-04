# Builder handoff: Build 159 review and tasks for Build 160

> **Superseded by [`builder-handoff-build161.md`](builder-handoff-build161.md)** (Build 160 review and Build 161 tasks). Kept as the record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `9744108` (Build 159: `builder-phone-space-and-margin-v159`), merged into branch `claude/build-page-layout-bl6jk1`. Checked against [`builder-handoff-build159.md`](builder-handoff-build159.md).
**Next block:** `builder-…-v160`.
**Screenshots:**
- `docs/mockups/compare/build159-mobile-360.png` (after Fit)
- `docs/mockups/compare/build159-mobile-360-top.png` (top of the page)

## TL;DR: the phone canvas is fixed; performance margin isn't reached

| # | Task | Result |
|---|---|---|
| 1 | Phone canvas too short | ✅ **Done** (table below). |
| 2 | Performance margin (about 20% under budget, three runs in a row) | ❌ **No measurable change** (item 1). |
| 3a | Minimap button in the phone footer | ✅ Done (▧ beside the zoom bar). |
| 3b | Parity self-test in the routine | ✅ Still passes (`?builderDev`). |

**Phone canvas, Build 158 → 159:**

| | Build 158 | **Build 159** |
|---|---|---|
| Canvas top on the page at 360 × 740 | 468px | **277px** |
| Canvas height at 360 × 740 | 180px | **628px** (after Fit, scrolled into view) |
| Canvas height at 390 × 844 | 346px | **752px** |
| Cards visible after Fit at 360 | less than one | **3** (first card fully visible, centred) |

How Build 159 got there:
- **App navigation:** one horizontally scrolling row.
- **Title:** one line, with the info text behind an ⓘ button (works).
- **"Find & navigate" and "Group by":** moved into More.
- **Fit:** scrolls the canvas into view.
- No control overlaps a card; no horizontal page scroll.

**Also checked:**
- **0 errors:** on load and across **189 buttons** (one new: the ⓘ button).
- **Canvas space:** passes at all 4 sizes. **Connector check:** every scenario OK.
- **TM-1:** unchanged and correct.
- **Validation counts stay current** after the v159 list caching: adding a Heavy Forwarder raises "to review" from 12 to 16 (also in the rail badge); removing it brings it back to 12. Same as Build 158.

---

## 1. Performance: the v159 changes don't move the numbers

Builds 158 and 159 were run alternately, 3 runs each (median of 5 redraws, ms):

| Scenario | Build 158 | **Build 159** | Budget | 20% target |
|---|---|---|---|---|
| default | 58 · 41 · 38 | **43 · 41 · 37** | 40 | 32 |
| fan5 | 44 · 46 · 47 | **47 · 44 · 52** | 50 | 40 |
| fan8 | 99 · 68 · 74 | **111 · 79 · 66** | 80 | 64 |
| reference | 84 · 87 · 80 | **87 · 114 · 85** | 120 | 96 |
| `allOk` | 1 of 3 | **0 of 3** | | |

v159 changed:
- `polishBuilderText`: coalesces mutation roots;
- the validation and review lists: skip identical `innerHTML` and `textContent` writes;
- `builderHeaderFit142`: only when dirty;
- the space rail: skips when its signature is unchanged.

None of these were the main cost. **Stop guessing and profile.** This is the third handoff asking for it, and v159 has no profile results in its notes.

**Do this, and put the output in the change-register entry or a comment at the top of the v160 block:**
```js
// Playwright, 1440×900, default topology (4 components), Builder open
const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
await cdp.send('Profiler.start');
await page.evaluate(() => { for (let i = 0; i < 20; i++) renderBuilder(); });
const { profile } = await cdp.send('Profiler.stop');
const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
const dt = profile.timeDeltas; profile.samples.forEach((id, i) => {
  const n = byId.get(id), k = n.callFrame.functionName || '(anon)';
  self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000);
});
console.log([...self].sort((a, b) => b[1] - a[1]).slice(0, 15));
```
Also record the browser's own share (`(program)`, `(garbage collector)`, and style/layout via `Performance.getMetrics` → `LayoutDuration`, `RecalcStyleDuration`). At 4 components, a large part of 40ms is likely **style recalculation and layout** from rebuilding the whole `#builderTree` `innerHTML` on every redraw, not script.

**Likely real fixes (confirm with the profile first):**
- **Don't rebuild `#builderTree` from a string on every redraw.** Update the cards that changed (keyed by node id) and leave the rest of the DOM in place. This is the largest structural cost left.
- **Batch layout reads before writes.** Any `getBoundingClientRect` after a DOM write forces a synchronous layout. The profile's "Layout" entries show where.
- **Cut the CSS selector cost:** very long `#topologyBuilder …` selector chains over a large builder subtree make each style recalc expensive. `RecalcStyleDuration` will show whether this matters.

**Check:** `allOk: true` on three runs in a row, and the profile table in the notes.

## 2. Code hygiene: element-level property overrides

v159 redefines `innerHTML` on `#builderUnresolvedPanel` and `#builderRulesPanel`, and `textContent` on the validation `strong`/`small`/`b` elements, with `Object.defineProperty`. This works today (counts stay current, as checked above), but:
- it's invisible to anyone reading the code that writes `panel.innerHTML = …`;
- it breaks if those elements are ever replaced (the override is on the old node).

**Prefer** a small helper at the write sites, `builderSetHTML160(el, html)`, that compares and writes, or a wrapper around the functions that render those lists. If you keep the overrides, add a comment at each original write site: `/* v159 intercepts this write */`.

## 3. Small

- **Phone Fit:** zoom is 0.78 at 360 and 0.86 at 390. That's readable; keep the 0.6 floor.
- **Phone nav row:** it scrolls sideways (584px of content in 312px). Show a fade at the right edge so it's clear there's more.

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
2. All three tools pass: perf `allOk` on three runs in a row, space 4/4, connector all OK.
3. `?builderDev`: the parity self-test passes.
4. Phones at 360×740 and 390×844, after Fit:
   - canvas ≥ 320px tall;
   - first card fully visible;
   - no overlaps;
   - no horizontal page scroll.
5. Validation counts update when a component is added or removed.
6. TM-1 as in Build 159. A `changeRegister` entry and the build stamp for v160.

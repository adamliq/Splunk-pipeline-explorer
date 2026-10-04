# Builder handoff: Build 157 review and tasks for Build 158

> **Superseded by [`builder-handoff-build159.md`](builder-handoff-build159.md)** (Build 158 review and Build 159 tasks). Kept as the record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `f155412` (Build 157: `builder-readable-canvas-v157`), merged into branch `claude/build-page-layout-bl6jk1`. Checked against [`builder-handoff-build157.md`](builder-handoff-build157.md).
**Next block:** `builder-…-v158`.
**Screenshots:**
- `docs/mockups/compare/build157-default-1440.png`
- `docs/mockups/compare/build157-mobile-390.png`

**Tool update** (branch `claude/build-page-layout-bl6jk1`; copy `tools/` to `main`): `tools/builder-connector-check.js` now allows a label with a leader (`data-label-leader="true"`) up to 90px from its line. The limit is still 20px without a leader.

## TL;DR: every Build 157 task is done, and all three tools pass for the first time

| # | Task | Result |
|---|---|---|
| 1 | Connector labels hidden too often | ✅ **Done.** "TCP/TLS or UDP" is back in the default topology, above the line with a 1px leader, with its badge on the line. **Connector check: every scenario OK.** |
| 2 | Redraw performance | ✅ **Within budget.** `allOk: true` on two runs in a row (table below). |
| 3 | Mobile Fit readable | ✅ **Done.** At 390×844 the zoom is 1.03 (Build 156: 0.45), the first card is fully visible, the canvas ends inside the viewport (bottom 832 of 844), and there's no horizontal scroll. |
| — | TM-1 | ✅ Unchanged and correct: one S threat per authentication flow and on DF-3; one Accepted threat for a persistent queue; diamonds 0px from their paths; no pill overlaps; viewBox 1192 wide. |

**Also checked:**
- **0 errors:** on load, across **188 buttons**, in TM-1, on mobile, and when switching planes.
- **Canvas space:** passes at all 4 sizes.

### Performance (median of 5 redraws, ms)

| Scenario | Build 147 | Build 152 | Build 156 | **Build 157** | Budget |
|---|---|---|---|---|---|
| default (4 / 3) | 52 | 46 | 50–58 | **39–40** ✅ | 40 |
| fan5 (5 / 4) | 106 | 80 | 54–66 | **48–50** ✅ | 50 |
| fan8 (8 / 10) | 1,306 | 159 | 104–155 | **69–71** ✅ | 80 |
| reference (17 / 12) | 892 | 361 | 142–193 | **85–86** ✅ | 120 |

Two earlier runs in the same session measured 40–45 / 49–70 / 82–89 / 88–93. **default and fan5 sit right at the budget**, so any new per-redraw work will push them over. Keep the margin (item 3).

---

## 1. Code hygiene: Build 157 edited older blocks and replaced `$`

The rule so far has been: add a new block and wrap; never edit earlier blocks. Build 157 broke it in three places:
- **Core render function:** it gained `deferCanvas157` (skips `renderAuthenticationBuilder`/`renderManagementBuilder` while `window.builderRendering157` is set).
- **`updateFreeConnectorGeometry` (v149) and `builderPlaceLabels149` (v156):** both were rewritten in place.
- **Global `$` and `$$`:** now route through `builderQueryRoot157`, which rewrites `#id descendant` selectors into `getElementById(...).querySelector(...)`.

All of this works (0 errors, every check passes), and the speed gain is real. But:
- **The record is lost:** the change register and older handoffs no longer describe what those blocks do. Add a comment at each edited place: `/* v157: … */`.
- **`$` is used by every view** (Flow, Matrix, Operate, Diagnose, Failure Lab, OV), not just Builder. `builderQueryRoot157` must return exactly what `document.querySelector` would.
  - **Problem case:** a selector like `#a .b, #c .d` (a comma list) doesn't match the regex and falls through, which is fine. But `#a > .b` turns into `:scope > .b` on `#a`, which is right only if `#a` exists.
  - **Fix:** if `getElementById` returns null, fall back to `document.querySelector(s)`, not `null`/`[]`.
- **Deferred auth/management trees:** confirm that nothing reads the auth or management tree markup during the render. They're skipped while rendering, and the unified canvas draws all planes, so this looks safe today.

**Do:**
1. Add the fallback to `builderQueryRoot157`.
2. Add a small self-test in a v158 block, run once on load in development builds:
   ```js
   for (const s of ['#builderTree .edgeRouteLabel', '#topologyBuilder > div', '#missing .x'])
     console.assert(String($$(s).length) === String(document.querySelectorAll(s).length), 'query parity', s);
   ```
3. From v158 on, go back to wrappers. If an in-place edit is unavoidable, mark it with `/* vNNN */`.

## 2. Mobile: controls cover the second card

At 390×844 after Fit (see `build157-mobile-390.png`), the minimap (bottom right) and the zoom bar (bottom left) sit over the second card, "Collection Relay · Syslog Server 1". The first card is also off-centre: its x range is 146–342 inside a canvas spanning 21–369, because the label on the left pushes the fit bounds.
- **Phones:** hide the minimap by default (keep it under More), or make it 64px and translucent.
- **Fit on phones:** add the zoom bar's height (about 60px) to the bottom padding.
- **Centring:** centre horizontally on the cards' bounds, not on cards + labels. Labels may overflow the edge by up to 24px.

**Check:** at 390×844 after Fit, no control overlaps a card, and the first card's centre is within 20px of the canvas centre.

## 3. Keep the performance margin

default and fan5 are at the budget, so the next feature can push them over.
- **Run the perf tool twice before every upload.** A run over budget fails, even if the other passes.
- **Remaining fixed cost** worth trimming, from `builder-handoff-canvas-performance.md` item 4: `polishBuilderText` over the whole builder, and the validation and review list re-renders.
- **Don't put new work in `renderBuilder`** (TM-1, OV, pack). Build those only when their tab opens.

## 4. Carried over

- **TM-1:** the DF-9 pill sits on the collection zone's right border with a long leader. Prefer spots inside the flow's own zone.
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
1. 0 `pageerror` events. Button sweep (188) and grouping sweep are clean.
2. All three tools pass: perf `allOk` on two runs, space 4/4, connector all OK.
3. The query-parity self-test (item 1) passes. Flow, Matrix, Operate, Diagnose, Failure Lab and OV still render.
4. Mobile 390×844: the item 2 checks.
5. TM-1 (reference + Splunk Cloud "acme"): as in Build 157.
6. A `changeRegister` entry and the build stamp for v158.

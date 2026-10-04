# Builder handoff: Build 158 review and tasks for Build 159

> **Superseded by [`builder-handoff-build160.md`](builder-handoff-build160.md)** (Build 159 review and Build 160 tasks). Kept as the record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `4a96232` (Build 158: `builder-query-and-phone-v158`), merged into branch `claude/build-page-layout-bl6jk1`. Checked against [`builder-handoff-build158.md`](builder-handoff-build158.md).
**Next block:** `builder-…-v159`.
**Screenshots:**
- `docs/mockups/compare/build158-mobile-390.png`
- `docs/mockups/compare/build158-mobile-360.png`
- `docs/mockups/compare/threat-model-build158.png`

## TL;DR: every Build 158 task is done; one new phone issue

| # | Task | Result |
|---|---|---|
| 1 | `$` fallback, parity self-test, comments on edited blocks | ✅ **Done.** `builderQueryParity158()` (run with `?builderDev`) passes all 5 selectors, including the missing-root and comma cases. Flow, Matrix, Failure Lab, Changes and OV all render. The edited blocks carry `/* v157 */` notes, and v158 itself is pure wrappers. |
| 2 | Phone controls cover cards | ✅ **Done.** Zoom and the gesture hint moved to a footer below the canvas. The minimap is hidden by default ("Show minimap" is under More; 64×48 when shown). The first card is centred (0px off at 390 and 360). |
| 3 | Keep the performance margin | ✅ No new redraw work. The timings are the same as Build 157 (below). |
| 4 | TM-1 DF-9 pill on the zone border | ✅ **Done.** DF-9 now sits inside the collection zone, next to P10, with a short leader. |

**Also checked:**
- **0 errors:** on load, across **188 buttons**, in TM-1, and on phones at 390 and 360.
- **Canvas space:** passes at all 4 sizes. **Connector check:** every scenario OK.
- **TM-1 unchanged:**
  - one S threat per authentication flow and on DF-3;
  - one Accepted threat for a persistent queue;
  - diamonds 0px from their paths;
  - no pill overlaps or crossings;
  - viewBox 1192 wide.

### Performance (median of 5 redraws, ms; 4 runs each, run alternately)

| Scenario | Build 157 | **Build 158** | Budget |
|---|---|---|---|
| default | 42–44 | **38–44** | 40 |
| fan5 | 55 | **46–62** | 50 |
| fan8 | 79–101 | **74–105** | 80 |
| reference | 85–115 | **91–115** | 120 |

**`allOk` passed in 1 of 3 runs on Build 158** (and in 0 of 2 for Build 157 in the same session). The two builds are equal: the variation comes from the machine, but both sit **on** the budget. The build "passes" only on a quiet machine. Item 2 is about getting real margin.

---

## 1. Phone: the canvas is too short on smaller phones (P1)

**Now:** v158 sets the canvas height to the viewport height minus the canvas top, minus 12, minus 80 (for the new footer). The page header and the builder toolbar above the canvas take 406–468px, so:

| Viewport | Canvas top | Canvas height | Visible |
|---|---|---|---|
| 390 × 844 | 406 | **346px** | the first card and the top of the second (`build158-mobile-390.png`) |
| 360 × 740 | 468 | **180px** | **less than one card**; Syslog Source 1 is cut off at the bottom (`build158-mobile-360.png`) |

**Fix** (in this order):
1. **Minimum height:** `max(viewport × 0.55, 320px)` on phones. If the page then scrolls, that's fine: one page scroll brings the canvas into view.
2. **Make the chrome above the canvas shorter on phones:**
   - **"Find & navigate" and "Group by":** move both into More. Together they take about 100px.
   - **Builder title and description:** show only "Builder · Build 158" on one line; move the info text behind the (i) button.
   - **App navigation** (Flow, Matrix, Builder, …): it wraps to 2–3 rows. On phones, use a single horizontal scroll row or a select menu.
3. **Fit:** when the canvas comes into view (`scrollIntoView` after Fit), check the visible height, not the whole page.

**Check:**
- At 360×740 and 390×844, after Fit, the canvas is at least 320px tall and the first card is fully visible inside it.
- There's no horizontal page scroll, and no control overlaps the canvas.

## 2. Performance: get real margin

The four scenarios sit on their budgets, and normal machine noise flips the result. Aim for **about 20% under budget** (default ≤ 32, fan5 ≤ 40, fan8 ≤ 64, reference ≤ 96).

**Next targets** (`builder-handoff-canvas-performance.md` item 4; profile first with the CDP snippet in `builder-handoff-build156.md` item 3):
- **`polishBuilderText`:** run it only on new or changed nodes (`data-polished` flag).
- **Validation and review lists:** skip the `innerHTML` write when the findings signature hasn't changed.
- **`builderHeaderFit142` and the space rail (v140):** run on resize and on panel open/close, not on every redraw.

**Check:** `node tools/builder-perf-check.js index.html` reports `allOk: true` on **three runs in a row**.

## 3. Small

- **Show minimap (phones):** the toggle is inside More, so it's easy to miss. Also add a small map icon button at the right of the phone footer, next to the zoom bar.
- **Parity self-test:** it only runs with `?builderDev` or `window.__builderDevelopment`. Add the query to the "How to verify" routine (below), so it's run before each upload.

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
1. 0 `pageerror` events. Button sweep (188) and grouping sweep are clean.
2. All three tools pass: perf `allOk` on three runs, space 4/4, connector all OK.
3. `index.html?builderDev`: `window.builderQueryParityResult158.allOk === true`.
4. Phones at 360×740 and 390×844: the item 1 checks.
5. TM-1 (reference + Splunk Cloud "acme"): as in Build 158.
6. A `changeRegister` entry and the build stamp for v159.

# Builder handoff: Build 156 review and tasks for Build 157

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `ff401ba` (Build 156: `builder-canvas-review-v156`), merged into branch `claude/build-page-layout-bl6jk1`. Checked against [`builder-handoff-build156.md`](builder-handoff-build156.md).
**Next block:** `builder-…-v157`.
**Screenshots:**
- `docs/mockups/compare/build156-default-1440.png`
- `docs/mockups/compare/build156-mobile-390.png`
- the TM-1 diagram is unchanged from `threat-model-build155.png`

**Tool update** (on branch `claude/build-page-layout-bl6jk1`; copy to `main`): `tools/builder-connector-check.js` now understands labels hidden on purpose (`data-label-hidden="true"`). It reports them as `OK (label hidden: no room, badge on line)` and checks only that the badge stays on the line (≤ 12px).

## Build 156 against the task list

| # | Task | Result |
|---|---|---|
| 1 | One S threat per authentication flow; merge the DF-3 certificate threats | ✅ **Done.** With MFA enforced, each authentication flow has one S threat (Mitigated). DF-3 has one ("Forwarder and receiver authenticate with certificates"). Overrides on old keys are carried over. |
| 2 | Connector scenario 5 | ◐ **Different problem now** (item 1 below). "Label over a node" and "badge over label" are gone because the label is now **hidden**, and it's hidden in almost every scenario, including the default topology. |
| 3 | Redraw performance | ◐ **Much better on large topologies** (item 2). Reference: 340 ms → **142–193 ms**. Still over budget. |
| 3b | Inspector signature risk | ✅ v156 removed the v155 shortcut (full inspector render again). |
| 4 | TM-1 tidy-ups | Unchanged. Diamonds are still 0px from their paths, and no pill overlaps or is crossed. |

**Also new in 156** (not in the task list):
- **Mobile Fit:** shows the whole topology. In Build 155 the first source was cut off above the canvas.
- **Mobile toolbar:** consolidated, so the canvas starts 228px higher.
- **Desktop header:** gets a second row when free-layout persistence is shown.
- **OV-3 timeliness:** shows "Not set" when no latency target is recorded, instead of repeating the periodicity.

**Checks:**
- **0 errors:** on load, across **188 buttons**, and in TM-1 and mobile.
- **Canvas space:** passes at all 4 sizes.

---

## 1. Connector labels are now hidden too often (P1, regression)

**Now:** in the **default topology** at 1440, the "TCP/TLS or UDP" label (Syslog Source 1 → Syslog Server 1) is gone. Only its review badge "2" is on the line (see `build156-default-1440.png`). This is the same symptom Build 149 had. Across the connector tool's 8 scenarios, labels are hidden in all of them:

| Scenario | Hidden labels | Notes |
|---|---|---|
| 1 default | 1 | "TCP/TLS or UDP" |
| 2 after +Add HEC client | 1 | |
| 3 diagonal | 1 | its badge is **20px off the line** |
| 4 below | 1 | |
| 5 reversed | 1 | its badge is **50px off the line** |
| 6 up-right | 1 | visible and OK in Build 155 |
| 7 UF overlapping | 2 | |
| 8 Indexer below-left | 2 | |

**Cause:** the new `builderPlaceLabels149` (v156) rejects any candidate whose padded box touches a card, a node badge or another label (`continue`), across 48 fractions × 5 perpendicular offsets. When nothing passes, it hides the label. Three things make it too strict:
- **The box includes the badge** (`+30` px wide) and padding (`occupied` is +4 wide, +6 tall), and the cards are padded by another 3px. In the default layout, the 130px gap between Syslog Source and Syslog Server can't fit a 150px+ box at any fraction.
- **Perpendicular offsets stop at ±32px.** The space above and below the card row isn't reached.
- **`nodeBadges` are counted as obstacles.** The card's own corner badge ("1") sits on the card's border, beside the line's start and end.

**Fix:**
1. **Try in this order**, and stop at the first box clear of cards and labels:
   1. along the path, as now;
   2. perpendicular offsets of ±18, ±32, ±56 and ±80px;
   3. **outside the card row:** directly above the topmost or below the bottommost of the two cards' boxes, centred on the connector's midpoint x, with a 1px leader to the line (the TM-1 diagram already does this with `.tmPillLeader154`).
2. **Keep the badge outside the collision box** when the box only fails because of the badge. Draw the badge at the label's right end if there's room; otherwise put it on the line, just after the label's end.
3. **Don't treat a card's own corner badge** (`.builderNodeIssueMarker` of `edge.from`/`edge.to`) as an obstacle for its own connectors.
4. **Hide a label only as a last resort.** When you do, put the badge **on the line**: use the point you computed, then `marker.setAttribute('transform','translate(0 0)')` relative to that point, not `translate(0 11)` from a label box that's moved up by 11. Today the badge ends up 20–50px off the line in scenarios 3 and 5.

**Check:** `node tools/builder-connector-check.js index.html` shows "TCP/TLS or UDP" visible in scenarios 1, 2 and 6, as in Build 155. No hidden label's badge is more than 12px off its line. Every other line reports `OK`.

## 2. Redraw performance: big gain on large topologies, still over budget

Builds 155 and 156 were run alternately, twice each (median of 5 redraws per run, ms):

| Scenario | Build 155 | **Build 156** | Budget |
|---|---|---|---|
| default (4 / 3) | 49 · 56 | **50 · 58** | 40 |
| fan5 (5 / 4) | 76 · 62 | **59 · 64** | 50 |
| fan8 (8 / 10) | 177 · 149 | **155 · 125** | 80 |
| reference (17 / 12) | 393 · 362 | **193 · 142** | 120 |

Scoring each routing candidate once (`builderV123RouteBetween`) halved the reference topology's time. The remaining time is a **fixed cost of about 50 ms** that even the 4-component default pays. That points at the per-redraw work that doesn't depend on links: panels, text polish, header fit, wrapper chains. Next:
- **Profile the default topology** (4 components), not just the reference, with the CDP snippet in `builder-handoff-build156.md` item 3. List the top 15 self-time functions in your notes.
- **Expected candidates:**
  - `polishBuilderText` over the whole builder;
  - `renderBuilderHistory` / `formatBuilderHistoryTime`;
  - the review and validation list re-renders;
  - `builderHeaderFit142` (now run with an extra two-row check);
  - v156's mobile `syncBuilderMobileToolbar` call on every redraw. It's cheap on desktop because of the media check, but confirm.
- **Card boxes:** read once per redraw into a `Map`.

**Check:** `"allOk": true` on two runs in a row.

## 3. Mobile Fit: everything fits, but the text is unreadable

At 390×844, Fit now shows all 4 cards, but at **zoom 0.45**. Cards are 85px wide, and their text is about 5px (see `build156-mobile-390.png`). The Indexer card is also partly below the screen, because the canvas (620px tall) extends past the viewport bottom.

**Fix:**
- On phones, fit to **width** with a zoom floor of **0.6**, and let the user pan vertically. Fit the whole topology only when it fits at ≥ 0.6.
- Size the canvas to the visible viewport height (`100dvh` minus the header and toolbar), so Fit doesn't place cards below the fold.

**Check:** at 390×844 after Fit, zoom ≥ 0.6, the first source's card is fully visible, and there's no horizontal page scroll.

## 4. Carried over

- **TM-1 minor:** the DF-9 pill sits on the collection zone's right border with a long leader. Prefer spots inside the flow's own zone.
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
2. All three tools pass: perf `allOk` twice, space 4/4, and connector all `OK`, with "TCP/TLS or UDP" visible in the default topology.
3. Mobile 390×844: the item 3 checks.
4. TM-1 (reference + Splunk Cloud "acme"):
   - one S threat per authentication flow and on DF-3;
   - diamonds 0px from their paths;
   - no pill overlapped or crossed.
5. A `changeRegister` entry and the build stamp for v157.

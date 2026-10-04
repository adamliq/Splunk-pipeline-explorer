# Builder handoff: Build 155 review and tasks for Build 156

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `7c220f8` (Build 155: `builder-threat-routing-v155`), merged into branch `claude/build-page-layout-bl6jk1`. Checked against [`builder-handoff-build155.md`](builder-handoff-build155.md).
**Next block:** `builder-…-v156`.
**Screenshot:** `docs/mockups/compare/threat-model-build155.png`. It shows TM-1 for the reference topology with Indexer 1 converted to Splunk Cloud "acme".

## Build 155 against the task list

| # | Task | Result |
|---|---|---|
| 1 | Crossing diamonds on their lines | ✅ **Done.** All 5 are 0px from their own path and sit on a zone edge. X-4 is now at the AWS zone's left edge; X-5 is at the top of the identity zone. |
| 2a | Line through the DF-5 pill | ✅ Done: no pill is crossed by another flow's line. |
| 2b | DF-6 along the zone border | ✅ Done: it now runs in the gutter between zones and no longer passes through D2. |
| 2c | Faint leader | ✅ Done: leaders are in the flow colour at 60% opacity. |
| 3a | Persistent queue: three Accepted threats | ✅ **Done.** One threat (`store:D-3:I`), with older decisions carried over. |
| 3b | MFA duplicate S threat | ❌ **Not done** (item 1 below). |
| 3c | Transferred only for flows out of the cloud | ✅ Done: DF-3 has no Transferred threats; DF-7, `node:4` and `store:D-4` do. |
| 4 | 3 connector failures | ◐ **2 of 3 left.** Scenario 6 is fixed; scenario 5 still fails (item 2). |
| 5 | Redraw performance | ❌ **No measurable change** (item 3). |
| 6 | Small / carried over | Change register and build stamp ✅; the rest isn't verified. |

**Also checked:**
- **0 errors:** on load, across **188 buttons**, and in TM-1.
- **Canvas space:** passes at all 4 sizes.
- **TM-1 layout:** viewBox `0 0 1192 1067`, no sideways scroll. No pill overlaps a shape or another pill.

---

## 1. Remove the duplicate MFA threat

With `mfa:'enforced'` on both authentication relations, each flow still has two S threats:
```
auth-rel-1:S      Mitigated
auth-rel-1:S-mfa  Mitigated   ← added by v154
```
v155 adds a third variant, `…:S-provider-mfa`, when the identity provider enforces MFA.

**Fix (v156 `builderThreatModel150` wrapper):**
- Remove `…:S-mfa` and `…:S-provider-mfa` threats from `model.threats`.
- On the original `…:S` threat, set `control` to "Second factor enforced; audit sign-in decisions." and `status` to `Mitigated`, unless it has an override.
- Move any recorded override from the removed keys to `…:S` when `…:S` has none, as v155 does for the queue keys.

**Also, DF-3 (UF → Splunk Cloud):** it has two Mitigated S threats, `S-certificate` and `S-verified`. They say almost the same thing, so merge them into one: "Forwarder and receiver authenticate with certificates".

**Check:** every authentication flow and DF-3 has exactly one S threat.

## 2. Connector check: scenario 5 still fails

`node tools/builder-connector-check.js index.html`:
- **5 · Syslog Server dragged left of Syslog Source (reversed):** Syslog Source 1 → Syslog Server 1 has a label over a node, and its badge over the label.

v155's dense re-search (`builderPlaceLabels149` wrapper) only moves along the path (`fraction` 0.04–0.96). On this short, reversed route, every point along it is under a card or the badge. Two changes:
- **Also try perpendicular offsets:** at each fraction, try ±18 and ±32px off the segment, then pick the first box clear of cards and labels.
- **Badge:** v155 adds 27px to the box width for it, but the badge is still drawn where the base pass put it. After choosing the box, move the label's review badge (`.edgeRouteBadge`, or the badge element the base pass creates) to `box.x + box.w - 22`, vertically centred. This fixes "badge over label".
- If no clear spot exists, hide the label (keep the badge on the line), as the short-connector rule `builderRouteLabelHidden12` does, and have the tool treat that as OK.

**Check:** every scenario reports OK.

## 3. Redraw performance: still over budget, no change from 154

The container is slower than in earlier reviews, so the absolute numbers are higher. I compared Build 154 and Build 155 alternately in the same session (median of 5 redraws per run, ms):

| Scenario | Build 154 (3 runs) | Build 155 (3 runs) | Budget |
|---|---|---|---|
| default | 50 · 66 · 52 | 51 · 52 · 67 | 40 |
| fan5 | 81 · 66 · 66 | 69 · 66 · 67 | 50 |
| fan8 | 161 · 155 · 153 | 168 · 151 · 187 | 80 |
| reference | 340 · 360 · 347 | 371 · 328 · 343 | 120 |

v155 only skips the inspector re-render (with a signature) and the closed inventory. That's not where the time goes. Before changing anything else, **profile**:
```js
// Playwright, reference topology loaded, Builder view open
const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.start');
await page.evaluate(() => { for (let i = 0; i < 5; i++) renderBuilder(); });
const { profile } = await cdp.send('Profiler.stop');
// sum self time per callFrame.functionName and list the top 15
```
Put the top 15 functions in the build notes. Then fix the biggest ones. Expected candidates (`builder-handoff-canvas-performance.md` item 4):
- `builderCardBox` / `builderContentSize` layout reads (read once into a `Map`, after all writes);
- `polishBuilderText` over the whole builder;
- `renderBuilderHistory` / `formatBuilderHistoryTime`;
- review list and validation re-renders;
- wrapper blocks that re-query the whole canvas on every redraw (v140 space rail, v147 hosts, v148 cloud cards, v151, v153 grammar pass).

**Inspector signature risk:** `JSON.stringify` of all nodes, relations, hosts and groups on every redraw costs time at 17+ components. More importantly, any inspector input left out of the signature will now show stale values. Prefer a revision counter that's incremented wherever state is changed (`builderCommit`/history push), and compare that instead.

**Check:** `node tools/builder-perf-check.js index.html` reports `"allOk": true`. Run it twice, because timings vary between runs.

## 4. TM-1 tidy-ups (minor)

- **The DF-9 pill sits on the collection zone's right border** (x≈787), with a long leader from P10. Prefer pill spots inside the flow's own zone, scoring a pill that crosses a zone edge like a hit.
- **The DF-6 entry into the Customer collection zone isn't marked.** It's the same trust boundary crossing already marked at the AWS zone (X-4), so this is acceptable. If you keep one diamond per crossing, leave it as is.
- **P9 (Splunk SOAR · Cloud 1) has no flows.** Check whether the topology has a relation for it; if not, leave it as is.

## 5. Carried over (not verified)

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
2. All three tools pass (perf `allOk`, space 4/4, connector all OK).
3. TM-1 (reference + Splunk Cloud "acme"):
   - one S threat per authentication flow and on DF-3, with MFA enforced (item 1);
   - diamonds still 0px from their paths;
   - no pill crossed by another flow.
4. A `changeRegister` entry and the build stamp for v156.

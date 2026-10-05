# Builder handoff: tasks for Build 168

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** `main` at `79110fc` (Build 167: `builder-review-v167`). Add one new block, `<script id="builder-…-v168">`. Use wrappers only; keep every earlier block.
**Replaces:** the "still to do" parts of [`builder-handoff-build165.md`](builder-handoff-build165.md), which stays as the review record.
**Test topology:** `docs/mockups/ov1-reference-topology.json`.
**Tools** (copy `tools/` from branch `claude/build-page-layout-bl6jk1` to `main` with this upload; the connector tool has new scenarios):
- `node tools/builder-perf-check.js index.html`: `allOk` on three runs.
- `node tools/builder-space-check.js index.html`: 7/7.
- `node tools/builder-connector-check.js index.html`: every scenario OK, including the new **9 and 10 (reference topology at Fit and at 100%)**.

## Where Build 167 stands

Already done:
- Builder relationship lines are straight, with separate ports and labels and badges on their lines (connector scenarios 1–10 all OK).
- One pipeline set by default.
- Selection dimming.
- The architecture profile is in Validate.
- History popover type size.
- Card names wrap evenly.
- Analyze descriptions.
- 0 errors across 185 buttons.

What's left is below, in order.

---

## 1. OV-1: five connection labels removed (P1, regression in 167)

On the reference topology, OV-1 in Build 166 showed 11 connection labels. Build 167 shows 6. These five are **no longer in the SVG at all**:

| Missing label | Thread |
|---|---|
| Syslog UDP/TCP | Sydney syslog sources → Syslog relays |
| Syslog UDP/TCP | Melbourne syslog sources → Syslog relays |
| phone-home · 8089 · TLS ×2 | Deployment Server → Universal Forwarders |
| phone-home · 8089 · TLS | Deployment Server → Heavy Forwarder |
| licence usage and health · TLS | License Manager → Search Head |

**Cause (likely):** the v167 wrapper of `builderOvDiagram137` ("search every path in a thread") removes a label when none of its candidate spots is clear.

**Fix:** never remove a label.
1. Try the candidates along the thread.
2. Then try spots beside the thread's number marker.
3. Then take the least-overlapping candidate.

Spreading the markers out (fixed in 167) must stay.

**Check:** OV-1 on the reference topology has all 11 labels. Compare with `docs/mockups/compare/build166-ov1.png` and `build167-ov1.png`.

## 2. OV-1: cramped response lines on the right (P2)

In `build167-ov1.png`:
- **Search Head → User/Administrator and → Splunk SOAR (brown):** these now run a vertical at x≈1030 that touches the left edge of the Authentication Provider box, and a horizontal at y≈120 squeezed between the User/Administrator and Authentication Provider boxes.
- **"cases and ticket updates · TLS":** this label sits against that vertical.
- **"S2S · TLS":** it sits left of the UF → Indexer arrow, under marker 2, where the dashed management line crosses it.

**Fix:**
- Route the response threads in the gutter between the Splunk platform column and People & response (about x 960–1015), and enter each box from its left edge middle.
- Keep every line at least 8px from any box edge it doesn't connect to.
- Place "S2S · TLS" on the UF → Indexer arrow's own span (x about 575–660).

**Check:**
- No OV-1 line runs within 4px of a box it doesn't connect to.
- No label touches a line other than its own.

## 3. Validate menu and rail tidy-ups (P3)

- **Empty bar in Validate:** a thin empty bar sits under the "Validating for: Splunk Enterprise · Change" row, probably the closed profile disclosure (`docs/mockups/compare/build167-validate-menu.png`). Hide it while closed.
- **Profile row position:** move "Validating for … · Change" to the **top** of the Validate menu, as context for Review, Rules and Coverage.
- **Tools icon:** the rail's Tools button now shows ◇, the glyph the old rail used for review findings. Use a wrench or sliders icon.

## 4. Owner decision (don't change without it)

The Recovery calculator (`state.recovery.pipelineSets`) and Performance guardrails (`state.performanceGuardrails.pipelineSets`) still default to **2** pipeline sets. The Builder now defaults to 1. Change these only if the owner asks.

## 5. Carried over (older, lower priority)

- **OV-2:** self-needlines and pill overlaps.
- **OV-3:** doubled chip labels; OV values.
- **OV-1:** markers and tags (from `builder-handoff-build141.md`; recheck after items 1–2).

---

## How to verify before uploading

1. 0 `pageerror` events; button sweep (185) and grouping sweep clean.
2. Perf `allOk` on three runs; space 7/7; connector all OK (scenarios 1–10).
3. **OV-1** (reference topology):
   - 11 connection labels;
   - markers not stacked;
   - no line hugging a box edge;
   - OV-2 and OV-3 unchanged (OV-2 pixel-identical to Build 167).
4. Validate menu: profile row first; no empty bar.
5. A `changeRegister` entry and the build stamp for v168.

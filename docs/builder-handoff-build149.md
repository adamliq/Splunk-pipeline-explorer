# Builder handoff: Build 149 review

> **Still current.** Build 150 added only the threat model and fixed none of these items (the P0 included). See [`builder-handoff-build150.md`](builder-handoff-build150.md) for the threat-model review.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `7ef3f6d` (Build 149: `builder-shared-hosts-v147`, `builder-cloud-indexing-v148`, `builder-canvas-perf-v149`), also merged into branch `claude/build-page-layout-bl6jk1`
**Specs this build implements:** `builder-handoff-shared-hosts.md`, `builder-handoff-splunk-cloud-indexing.md`, `builder-handoff-canvas-performance.md`. Open items from `builder-handoff-build141.md` still apply where not listed as done here.
**Tools** (on branch `claude/build-page-layout-bl6jk1`; copy `tools/` to `main`):
- `node tools/builder-perf-check.js index.html`
- `node tools/builder-space-check.js index.html`
- `node tools/builder-connector-check.js index.html`

**Screenshots:** `docs/mockups/compare/build149-default-1440.png`, `build149-host-expanded.png`, `build149-host-collapsed.png` and `build149-cloud-blocked-syslog.png`. All except the first were taken with the item 1 fix applied to a scratch copy.

## TL;DR

- **P0: Build 149 throws on every redraw** (`syncBuilderPaletteTarget`, the new Splunk Cloud palette button). The error stops `renderBuilder` partway, so the canvas falls back to the old layout. The fix is one line (item 1).
- **With that fix applied** (tested on a scratch copy):
  - the **performance fix works**: 8 components / 10 links went from 1,306ms to 121ms per redraw, with path lookups down from 94,340 to 588;
  - **canvas space** passes again at all 4 sizes;
  - **0 errors** on load at 4 sizes, across resizes and across 188 buttons;
  - **the OV tab** works.
- **Both new features work in the main:**
  - **Shared hosts:** create, host box, collapse (not an Undo step), save and re-import, and the "Deployment Server on an indexer" flag.
  - **Splunk Cloud indexing:** palette item, managed card, inspector, S2S/HEC defaults with TLS locked, endpoints derived from the stack, blocked syslog drawn red with PR-CLOUD-10 failing, Deployment Server → cloud refused, rules PR-CLOUD-10 to 16 and PR-HYB-05, save and re-import.
- **What's left:**
  - one connector label disappears (item 2);
  - performance is 10× better but still over budget (item 3);
  - collapsed hosts lose a line, and their card clips (item 4);
  - the blocked-syslog drawing (item 5);
  - smaller items (6–8).

## Rules (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block; the next block is `…-v150`.
- **Before uploading, run all three tools** (perf, space, connector), the button and grouping sweeps, and the three OV tabs.
- **New rule:** any new palette button must have the same inner structure as the existing ones (including `.builderUnconnectedTag`). Item 1 is what happens otherwise.

---

## 1. P0: the new palette button breaks every redraw

**Symptom:** on load and on every redraw:
```
TypeError: Cannot set properties of null (setting 'hidden')
  at syncBuilderPaletteTarget (index.html:4011)
  at renderPaletteSearch (index.html:4017)
  at renderPaletteSearch (index.html:6779)   ← v148 wrapper
  at renderBuilder …
```
Because the exception escapes `renderBuilder`, the wrappers that run after it never run, including canvas space (v140). The canvas is back to 302px of controls above it, 1506px wide, with page scroll (the space tool fails at every size), and the connector check reports 6 failures.

**Cause:** `syncBuilderPaletteTarget()` loops over `builderPaletteButtons` and does `tag=button.querySelector('.builderUnconnectedTag'); tag.hidden=…`. The v148 button `builderCloudPaletteButton148` is created with `document.createElement('button')` and **has no `.builderUnconnectedTag` child**.

**Fix (both):**
1. Give the new button the same structure as the others, including `<span class="builderUnconnectedTag" hidden>Adds unconnected</span>`.
2. Make the loop tolerant: in `syncBuilderPaletteTarget`, `if(!tag)continue;` before `tag.hidden=…` (tested on a scratch copy: it removes the error, and every check below was run with it).

Also make sure `dataCapability(node,{type:'cloudIndexer148'})` (used by this loop for the "Adds unconnected" hint) maps the palette type to `idx`. The v148 wrapper already does this; keep it.

**Check:** 0 `pageerror` events on load at all widths; `tools/builder-space-check.js` passes again.

## 2. A connector label disappears (label placement v149)

**Now:** in the default topology, the **Syslog Source → Syslog Server label ("TCP/TLS or UDP") and its review badge are gone**. The label is collapsed to 0×0 with `opacity:0`. The connector check reports it as "label 513px off line" in all 8 scenarios, and as "label 802px off line" for Syslog Server → UF in scenario 6.

**Cause:** the new `builderPlaceLabels149()` hides a label it can't place cleanly, instead of picking the least-bad candidate.

**Fix:**
- Never hide a label: when no candidate is collision-free, use the candidate with the lowest score (the old behaviour), and keep its review badge.
- Only hide labels that were hidden on purpose before (the `builderRouteLabelHidden12` short-connector rule), and then keep the badge visible on the line.
- Have the connector tool skip labels hidden by that rule, so it doesn't report false failures.

**Check:** `tools/builder-connector-check.js` reports every scenario OK again (it did in Build 141); the default topology shows "TCP/TLS or UDP" with its badge.

## 3. Performance: 10× better, still over budget

`node tools/builder-perf-check.js` (with item 1 applied):

| Scenario | Build 147 | Build 149 | Budget |
|---|---|---|---|
| default (4 / 3) | 52 ms | **40 ms** ✅ | 40 |
| fan5 (5 / 4) | 106 ms | 56 ms | 50 |
| fan8 (8 / 10) | 1,306 ms | 121 ms | 80 |
| reference (17 / 12) | 892 ms | 290 ms | 120 |
| path lookups (reference) | 41,603 | 757 | < 1,500 ✅ |

The label work is no longer the bottleneck. Profile the remaining redraw (`renderBuilder` at 17 components) and apply the rest of `builder-handoff-canvas-performance.md` item 4:
- read each card's box once per redraw;
- skip unchanged panel `innerHTML` writes;
- run `polishBuilderText` only on new nodes.

## 4. Shared hosts: collapsed view problems

See `build149-host-expanded.png` and `build149-host-collapsed.png`.
- **Lines detach when collapsed.** After collapsing `splunk-hf01`, the Deployment Server's management line to Universal Forwarder 1 **ends in empty space** where the Deployment Server card used to be, not on the combined card. Every member's line must attach to the combined card's border, merging duplicates with a ×n badge (spec item 3).
- **The combined card clips its content.** The second role row ("Deployment Server · …") and the local-link note are cut off at the card's bottom. Size the combined card to its content: title + one row per role + note.
- **Role rows repeat themselves:** "Heavy Forwarder · Heavy Forwarder 1". Use the card name only when it differs from the type, otherwise the role's summary ("HEC input · 2 pipeline sets", "server classes · 3 clients").
- **Expanded-view tidy-ups:**
  - the local link leaves the host box to the right, with a stray badge "3" and a "local" label half hidden behind the cards; draw it inside the box, between the two cards' facing edges;
  - the "1 local link" note sits on the box's bottom border, so add bottom padding.
- **Inventory:** confirm a **Host** column (or field) exists in `builderInventoryRows()` and the pack table. It wasn't in the first row checked (an unhosted source); check a hosted row.

**Check:** collapse and expand with the mockup's topology. Every line ends on a card or the combined card (connector scenario 10 from the shared-hosts spec); no text is clipped.

## 5. Splunk Cloud: blocked syslog drawing and naming

See `build149-cloud-blocked-syslog.png`.
- **The blocked line is drawn as a thick hatched band.** The Syslog Source → Splunk Cloud line renders as a wide, vertically hatched red band along the cloud card's left edge, not a single red dashed line ending in ✕. Draw one 2px red dashed path with an ✕ marker at the end, before the card.
- **Its label is cut off and covered:** "Syslog → Splunk Cloud: not a(1)ed". Place it with the label placement (item 2), with the badge at its right end.
- **The card name stays "Indexer 2".** The spec's default is "Splunk Cloud · <stack>" (or "Splunk Cloud" while the stack is empty). Update the name when the stack is set, unless the user renamed it.
- **The card still shows Indexer stage chips** ("tcpin_queue", "parsingQueue") and Env/Unspecified chips. Hide them for cloud indexers (spec item 2).
- **Validate badge grammar:** "1 errors" should be "1 error".
- **Convert uses `prompt()`** for the stack name. Use an inline field in the inspector instead (`prompt` blocks the page and doesn't work in embedded views).

**Check:** the blocked line is one red dashed path with ✕ and a readable label; a new cloud indexer's name follows the stack; no Indexer stage chips on the cloud card.

## 6. Header and space (from Build 141)

- ✅ The header now fits on one row at 1440, and the canvas space targets pass (with item 1).
- Keep the five-width header check (1280, 1440, 1680, 1920, 2560) in the routine.

## 7. Still open from earlier handoffs

Not re-checked in this build; carry over unless already done:
- `builder-handoff-build141.md` items 2–5 and 7–9 (OV-2 self-needlines and pill overlaps, the OV-3 sticky column and doubled chip labels, OV values, OV-1 markers and tags, canvas min text 11.5px and Fit 100% snap, fan-out label over node and scenario 9).
- The threat model page (`builder-handoff-threat-model.md`) is not started.

## 8. Small

- "Use" (was "Use in explorer") is now very short; add a `title` "Use this topology in the explorer".
- The "Splunk Cloud indexing added. Switch 'Validate for'…" toast wraps to two lines; shorten it to "Splunk Cloud indexing added · check with Validate for: Splunk Cloud".

---

## How to verify
1. 0 `pageerror` events at 1280/1440/1920/390 (item 1).
2. `node tools/builder-perf-check.js index.html`: all OK (item 3).
3. `node tools/builder-space-check.js index.html`: all OK.
4. `node tools/builder-connector-check.js index.html`: every scenario OK (item 2), plus scenarios 9–11 (fan-out, shared host, blocked syslog) once added.
5. Button sweep (188 buttons) and grouping sweep: 0 errors.
6. Shared host and Splunk Cloud flows as in items 4 and 5; save and re-import keep hosts and cloud fields.
7. A `changeRegister` entry per new block.

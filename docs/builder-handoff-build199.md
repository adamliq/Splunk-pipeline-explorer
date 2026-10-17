# Builder handoff: Build 199 recheck (Inspector tabs)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 199 (`3cb238b`). It adds one block pair at the end of the page, as [`builder-handoff-inspector-tabs.md`](builder-handoff-inspector-tabs.md) asks:
- `<style id="builder-inspector-tabs-v199-styles">`: identical to `docs/mockups/builder-inspector-tabs-prototype.css`;
- `<script id="builder-inspector-tabs-v199">`: identical to `docs/mockups/builder-inspector-tabs-prototype.js`, followed by two sections of its own: two fixes to the prototype, and the build records.

Nothing else in `index.html` changed.

**Result:** the Inspector tabs work as specified, nothing else changed, and the build records are right. Build 199's two additions fix two real faults in the prototype; keep them. One small fault is left, with a three-line fix for Build 200.

**Tested with:**
- the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies;
- every check in the Inspector tabs handoff, rerun against Build 199 with the same scripts that tested the prototype;
- every view's text against Build 198;
- the three repo tools;
- the storyboard's scenes, shot again from Build 199 and compared with the committed screenshots.

## Build 199's two additions

Both fix faults in the prototype that the handoff's checks missed.

| Addition | The fault in the prototype | Build 199 |
|---|---|---|
| **A revealed field's tab becomes the chosen tab.** After `focus()` or `scrollIntoView()` on an Inspector field, Build 199 clicks that field's tab. | The prototype switched to the field's tab without remembering it, so the next sync went back to the remembered tab. Inspecting "Relationship validation is review." on Universal Forwarder 1 → Indexer 1 opened Assurance with the validation field focused, but the next redraw (any edit, for one) went back to Link and hid the field. The handoff's check looked before that redraw. | Assurance stays after a redraw, and after editing the field. |
| **Link chips get their ends.** `selectedBulkEdges()` is wrapped to add `source` and `target` to each record. | `builderTraceEdges()` records carry their ends as ids (`from`, `to`), and the chips read `source` and `target`. With two links Shift-clicked, the sync threw "Cannot read properties of undefined (reading 'type')" and Selection showed no chips. The handoff's checks Shift-clicked components only. | The chips read "Firewalls and network devices → Syslog Server 1" and so on, with no errors. Bulk Apply, the only other caller, finds each link again by plane and id (`builderEdgeRecord`), so the copies don't change what it writes. |

**A side effect of the first, harmless here:** the tab is chosen with a real `click()`, so the document's click handlers run too. They close any open menu, the object menu, the issue popover and the History popover, and `captureBuilderMutation` takes a history snapshot. The issue popover's buttons close it before inspecting anyway, and a tab click changes nothing the history records: inspecting findings adds no history entry, as in Build 198. The wrapper only runs when code calls `focus()` or `scrollIntoView()`; clicking and tabbing through the Inspector don't call them.

## Fix for Build 200: a phantom component in a link selection

With two links Shift-clicked, Selection reads "1 component and 2 links selected" and lists the second link's target as a component chip. Selecting a link puts its target in `builderMultiSelected` (Build 198's `selectedBuilderIds()` does it while it renders bulk edit), and Selection's title and chips count it. Build 198's own bulk count does the same ("· 1 component, 2 connections"), but bulk edit is set to Connections then, so Apply isn't affected.

Three edits in `<script id="builder-inspector-tabs-v199">`:

1. Before the line `// ---- Titles for the views that aren't a component.`, add:
   ```js
   // Shift-clicked links leave the last one's target in builderMultiSelected (Build 198's selectedBuilderIds() puts it there),
   // but the person selected links. With two or more links, components count only when two or more are selected too.
   const selectedComponentIds=()=>{const ids=state.builderMultiSelected||[];return (state.builderBulkEdges||[]).length>1&&ids.length<2?[]:ids};
   ```
2. In `renderHead()`, in the selection title, replace `const n=(state.builderMultiSelected||[]).length,` with `const n=selectedComponentIds().length,`.
3. In `renderSelection()`, replace `const nodes=(state.builderMultiSelected||[]).map(Number)` with `const nodes=selectedComponentIds().map(Number)`.

**Tested** on Build 199 with the three edits: two links Shift-clicked read "2 links selected", with the two link chips and no component chip, and no errors. The handoff's behaviour checks (49) and widths checks (24) all pass.

**Build records:** a `changeRegister` entry under "Explorer foundations", for example `['Selection counts links','With two or more links Shift-clicked, Selection no longer counts the last link’s target as a selected component.',true]`, and the Build 200 number and date in the same places as Build 199's.

## The Inspector tabs

Every check in the Inspector tabs handoff gives the same result on Build 199 as on the prototype.

| Check | Build 199 |
|---|---|
| Completeness | For each of the 46 component types, every control Build 198 shows (with "Advanced settings" open) is in exactly one tab. On each link plane, the link card's 31 controls are each in one of Link, Assurance and Route. |
| Behaviour at 1440 | All 49 steps pass, including the findings, bulk edit, align, Topology's mirrors and the container. |
| Widths | 1280, 1024, 800 and 400 px and Focus canvas: all 24 checks pass. |
| The strip | Narrowed to 210 px, at 320 px, the sticky offset and a taller header: all 15 checks pass. |
| Insert a component on this link | All 7 event data links get the button, as Build 198 has the row for all 7. None of the 3 fleet or 2 access links does. |
| Build 198's own checks | 69 of 69 menu actions; Esc on Tools and Containers at 1440, 1200 and 800; the Tools and Containers header; the keyboard and focus checks. |
| The storyboard's scenes | Shot again from Build 199: 13 of the 17 are byte-identical to the committed screenshots. The other 4 differ by 11 to 260 pixels, and a fresh shot of the prototype differs from the committed ones in the same 4 scenes by the same amounts. That is rendering noise: one page shot twice, 700 ms apart, differs by 10 to 24 pixels. |

## Build records

| Check | Result |
|---|---|
| Page title | "Splunk Pipeline Explorer · Build 199 · 18 Oct 2026" |
| `#topologyBuilder` data | `buildNumber` 199, `buildDate` 2026-10-18 |
| ⓘ text | "Build 199 · 18 Oct 2026. Build and inspect…". The whole prefix is replaced, as the Build 197 recheck suggested, so the date is current. |
| SV-10c, OV-6c and SV-10a | "199" and "1 of 1 · Build 199", on screen and in the pack. The date beside the number is the document's (the presentation date, or today), not the build's. |
| Changes view | "Inspector tabs" under Explorer foundations, with its description |

## Regression

- 0 `pageerror` events in every check above, from 320 to 2560 px.
- **Every view's text** is identical to Build 198 on the three topologies, 87 of 87, once build numbers and dates are normalised.
- **`node tools/builder-space-check.js index.html`:** 7/7, with the same canvas sizes as Build 198.
- **`node tools/builder-connector-check.js index.html`:** the same output as Build 198: 20 of 66 lines flag "badge over label" on the small default topology, and scenarios 9 and 10 are all OK.
- **`node tools/builder-perf-check.js index.html`:** the same as Build 198 within noise. Medians of five alternating runs (redraw, ms):

  | Topology | Build 198 | Build 199 | Budget |
  |---|---|---|---|
  | default | 37 | 38 | 40 |
  | fan5 | 49 | 51 | 50 |
  | fan8 | 75 | 81 | 80 |
  | reference | 92 | 79 | 120 |

  Neither build met every budget in any run here (0 of 5 each).
- **Main-thread time per selection change**, measured as in the Inspector tabs handoff (a cycle of 60 changes, two frames after each, medians of five rounds): Build 198 43.2 ms, Build 198 with "Advanced settings" kept open 45.2 ms, Build 199 45.1 ms. A CPU profile puts the block's sync at 1.3 ms per change.

## Still open

The two canvas faults listed under "Found while testing" in the Inspector tabs handoff are still in Build 199, as expected: a card whose chips wrap to a third row draws its container chip over its first stage row, and a container's "−" button covers the start of its name.

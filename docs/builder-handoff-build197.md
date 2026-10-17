# Builder handoff: Build 197 recheck (docked panels)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 197 (`02bdefb`). It adds one block pair at the end of the page, as [`builder-handoff-docked-panels.md`](builder-handoff-docked-panels.md) asks:
- `<style id="builder-docked-panels-v197-styles">`: identical to `docs/mockups/builder-docked-panels-prototype.css`;
- `<script id="builder-docked-panels-v197">`: identical to `docs/mockups/builder-docked-panels-prototype.js`, followed by a short build-records section (the change-register entry and the Build 197 stamp).

Nothing else in `index.html` changed.

**Result:** the docked panels work as specified, nothing else changed, and the build records are right. No fixes are needed; two optional notes are at the end.

**Tested with:**
- the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies;
- every check in the docked-panels handoff, rerun against Build 197 with the same scripts that tested the prototype;
- every view's text against Build 196;
- the three repo tools;
- the storyboard's scenes, shot again from Build 197 and compared with the committed screenshots.

## The docked panels

Every check in the docked-panels handoff gives the same result on Build 197 as on the prototype.

| Check | Build 197 |
|---|---|
| Columns at 1280, 1440, 1920 and 2560 | As in the handoff's table: the canvas is 594, 754, 1234 and 1874 px. The page doesn't scroll. |
| 1200 px | Drawers, as in Build 196 (the canvas is x 25–1175) |
| Behaviour at 1440 | Every step in the handoff's table passes: Hide and the rails, where focus goes, selection, "Inspect settings", Esc, Compatible next, adding from the palette and by dragging, the Review drawer, Tools, Focus canvas, resizing across 1280, the separator and reload |
| Resizing at 1280 | 340 px by default. The separator stops at 354 px, with the canvas at 580 px. Tools is 484 px. |
| Drawers at 1440, 1280, 1024 and 400 | Close is on top, and the SOAR pill hides while a drawer is open. Toasts and Tools open above it. At 1280 the drawer is 500 px, clear of the Tools buttons. |
| Keyboard and the "Adding after" line | Esc in Components returns focus to the canvas, A shows Components, and "Change" keeps it open. The line follows the selection. |
| Drawer behaviour and labels | Selecting, or opening Components, closes an open drawer, as in Build 196. Below 1280 the Close buttons carry Build 196's labels. |
| 400 and 1024 | The same as Build 196. Pin still works on a phone, including after a trip to 1440 and back. |
| Saved Build 196 pins, other views, presentation | Three columns with nothing covered; the OV page is 1406 px; nothing shows over presentation mode |
| Menus, Find results and the object menu | Every item is on top; the object menu stays inside the canvas |
| The storyboard's scenes | All seven docked scenes, shot from Build 197, are byte-identical to the committed screenshots |

## Build records

| Check | Result |
|---|---|
| Page title | "Splunk Pipeline Explorer · Build 197 · 17 Oct 2026" |
| `#topologyBuilder` data | `buildNumber` 197, `buildDate` 2026-10-17 |
| SV-10c, OV-6c and SV-10a | "197 · 17 Oct 2026" and "1 of 1 · Build 197", on screen and in the pack |
| Changes view | "Docked Components and Inspector" under Explorer foundations, with its description |
| Build stamp | `.builderBuildStamp` doesn't exist, in Build 196 either, so the stamp lines do nothing. Harmless. |

## Regression

- 0 `pageerror` events in every check above, from 400 to 2560 px.
- **Every view's text** is identical to Build 196 on the three topologies, 87 of 87, once build numbers and dates are normalised.
- **`node tools/builder-space-check.js index.html`:** 7/7.
- **`node tools/builder-connector-check.js index.html`:** 19 of 66 lines flag "badge over label" on the small default topology, as with the prototype (Build 196: 20). Scenarios 9 and 10 are all OK.
- **`node tools/builder-perf-check.js index.html`:** the same as Build 196 within noise. Medians of five alternating runs (redraw, ms):

  | Topology | Build 196 | Build 197 | Budget |
  |---|---|---|---|
  | default | 34 | 37 | 40 |
  | fan5 | 46 | 49 | 50 |
  | fan8 | 74 | 71 | 80 |
  | reference | 85 | 86 | 120 |

  In this container both builds sit at the budgets, and each passed 1 of its 5 runs, as in the docked-panels handoff's runs. Compare the two builds on a quieter machine if you want a firm number.

## Optional

- **The Builder's info text still carries Build 167's date.** The ⓘ text reads "Build 197 · 5 Oct 2026. Build and inspect…". Every build since 168 has replaced only the number (`replace('Build 196','Build 197')`), so the date has stayed at 5 Oct. To keep it current, replace the whole prefix: `builderInfoText159.textContent=builderInfoText159.textContent.replace(/^Build \d+ · \d{1,2} \w{3} \d{4}/,'Build 197 · 17 Oct 2026')`.
- **Dead CSS** (from the docked-panels handoff): on desktop, Build 126's pinned-palette grid and Build 140's own docking from 1680 px no longer take effect. Leaving them is harmless; remove them in a later cleanup if you like.

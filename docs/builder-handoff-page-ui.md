# Builder handoff: Builder page UI improvements (Build 161 review)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `abe5ce5` (Build 161), the Builder page **outside the canvas drawing**:
- header rows and menus;
- left rail and its panels;
- analysis panels and History;
- Components palette, inspector and bottom bar;
- widths from 600 to 2560.

**Companion lists:**
- [`builder-handoff-canvas-ux.md`](builder-handoff-canvas-ux.md): the canvas itself (layout, level of detail, card/connector UX).
- [`builder-handoff-build162.md`](builder-handoff-build162.md): performance and hygiene.

**Tool update** (`tools/builder-space-check.js` on branch `claude/build-page-layout-bl6jk1`; copy `tools/` to `main`):
- **New sizes:** 1024×768, 1100×800 and 768×1024, alongside the four desktop sizes.
- **Target for the new sizes:** the canvas must be **visible on load** (at least 984×420, 1060×440 and 728×560). Page scroll below the canvas is allowed at these sizes.
- **Build 161 result:** **4 of 7** (all three new sizes fail; item 1).

**Screenshots** (`docs/mockups/compare/`):

| File | Shows |
|---|---|
| `build161-page-1024x768.png` | 1024×768: no canvas on screen |
| `build161-page-rail-find-clipped.png` | rail → Find & navigate: content cut off at the right |
| `build161-page-rail-tools-clipped.png` | rail → Tools: content cut off at the right |
| `build161-page-export-menu-clipped.png` | Export menu cut off by the window edge |
| `build161-page-statistics-pushes-canvas.png` | Statistics opens above the canvas, under the rail |
| `build161-page-build-menu.png`, `build161-page-validate-menu.png` | menu contents |
| `build161-page-components-palette.png` | the Components palette |

## What's already good

- **At ≥ 1121px** the chrome is compact: the canvas gets 1406×759 at 1440 and 1886×975 at 1920, with no page scroll.
- **Phones (≤ 600px)** work well since Build 159.
- **Components palette:** search, "Adding after: … [Change]" and the "Compatible next component" suggestions are a good flow.
- **Statistics:** clear, well-structured content.
- **Contrast:** text contrast is fine throughout (no muted text under WCAG AA in the chrome).
- **Undo/Redo** show their keyboard shortcuts.

## Summary

| # | Issue | Impact | Size |
|---|---|---|---|
| 1 | **601–1120px wide: the canvas starts 950–1120px down the page, so no canvas is visible on load** (tablets, small laptops, half-screen windows) | P1 | medium |
| 2 | Left-rail panels cut off their content (3 of 5); glyph-only icons; the rail floats over panels and strips outside the canvas | P1 | small–medium |
| 3 | Analysis panels open in three different places; Network/Statistics push the canvas down and stack; History opens off-screen below the canvas | P1 | medium |
| 4 | Header menus are mislabelled and mixed (Build, Validate, Export, Navigate); the Export menu is cut off by the window edge | P2 | medium |
| 5 | First view clutter: a component pre-selected, the build stamp prominent, cryptic "Use" | P2 | small |
| 6 | Bottom bar: three similar view-mode buttons; help box always on | P2 | small |
| 7 | Components palette: tall item cards, repeated "adds unconnected", overlaps the help box | P3 | small |
| 8 | Validate status colour; small ⓘ target | P3 | small |

---

## 1. Tablet and small-laptop widths: no canvas on load (P1)

The compact desktop chrome applies at `builderSpaceMedia140 = (min-width:1121px)`, and the phone layout at `(max-width:600px)`. In between, the page falls back to the original stacked layout:
- the app header with stat chips;
- the Builder header with Undo/Redo/History/Save on separate rows;
- the toolbar;
- a plane-toggle card;
- the search card;
- the Navigate card;
- the Architecture profile and Review findings disclosures;
- … and only then the canvas.

| Viewport | Canvas top | Canvas visible on load |
|---|---|---|
| 1180×820 | 129 | 679px ✅ |
| **1100×800** | **947** | **0px** |
| **1024×768** (iPad landscape) | **947** | **0px** |
| **900×700** | 1047 | 0px |
| **820×1180** (iPad Air portrait) | 1079 | 101px |
| **768×1024** (iPad portrait) | 1124 | 0px |
| 601×900 | 357 | 531px ✅ |

**Fix:**
- Use the compact desktop chrome from **761px** (`min-width:761px`), and the phone chrome up to **760px** (match `builderSheetMedia`).
- Between 761 and 1120:
  - the header wraps to at most **two rows**;
  - menus collapse to icons + short labels;
  - the rail panels and drawers overlay the canvas rather than stacking above it.
- Keep the app's stat chips ("108 stages · 10 components · 64 failures") out of the Builder view below 1121px, as they already are above it.

**Check:** `node tools/builder-space-check.js index.html` reports **7/7**. Also check by hand that 900×700 and 820×1180 show the canvas within the first screen.

## 2. Left rail: panels cut off, unclear icons, floating over other content (P1)

The rail (⌕ ▤ ◇ ⚒ ▦) opens 440px popovers. Three of the five cut off their content at the right edge (`overflow:hidden`):

| Rail button | What is cut |
|---|---|
| ⌕ Find & navigate | search placeholder "Search name, type, re…", the plane select "All relationship plan…", the "↑ Sh(ow upstream)" and "Go" buttons, the helper text "…select an object to fo…", the Highlight chips |
| ◇ Review findings | the button row after "Go to object", the finding text |
| ⚒ Tools | the "Choo(se)" button, the "TLS Required" chip, "UF memory/disk" field, "Select an issue to…", two notes ("…stored on the relationshi…", "…event-data, fleet-manag…") |
| ▤ Architecture profile | fits ✅ |
| ▦ Containers | fits ✅ |

**Other problems:**
- **Unclear icons:** glyph-only buttons (▤ for the architecture profile, ◇ for review findings, ⚒ for tools). Their names only appear in `aria-label`.
- **Duplicates:**
  - Find & navigate overlaps the **Navigate** menu;
  - Review findings overlaps **Validate → Review**;
  - the Highlight chips also appear in the Group-by chip bar.
- **Rail floats over other content:** it sits over the left edge of panels and strips outside the canvas: the Statistics panel ("…OLOGY STATISTICS", "…chitecture structure"), `#builderSoarGuide` and the Group-by chip bar (see the canvas handoff, item 4).

**Fix:**
- **Width:** popovers at `min(600px, 45vw)`; content wraps (no `overflow:hidden` on text rows, `flex-wrap:wrap` on button rows). Or open rail panels in the same right drawer the analysis panels use (item 3).
- **Labels:** show icon + label ("Find", "Profile", "Findings", "Tools", "Groups") at ≥ 1440, icon + tooltip below.
- **Position:** place the rail **inside** `.builderCanvas` (`position:absolute`), so it never overlaps content outside the canvas.
- **Duplicates:** fold Find into a header search field (item 4) and drop the rail's Review findings entry (Validate owns it). Keep Profile, Tools and Groups.

**Check:**
- For every rail panel, no element inside has `scrollWidth > clientWidth + 1` with hidden overflow.
- Nothing outside the canvas is covered by the rail.

## 3. Analysis panels and History: one consistent place (P1)

From the **Validate** menu:

| Item | Opens as | Effect |
|---|---|---|
| Coverage, Review, Rules, Inventory | the 600px right drawer (shared with the inspector) | ✅ the canvas stays |
| **Network**, **Trace path** | a full-width section **above** the canvas | the canvas moves down to y≈547–670 and shrinks to 480px |
| **Statistics** | a full-width section above the canvas (and Network stays open below it) | the canvas moves down to y≈**1292**; the page becomes 1,773px tall |
| **History** (header button) | a full-width list **below** the canvas, at y≈935 | off-screen at 900px tall, so clicking History **appears to do nothing** |

The rail also overlaps the left edge of the full-width sections.

**Fix:**
- **One right drawer** (600px, resizable) for Review, Rules, Coverage, Inventory, Trace path and **History**, with tabs at the top so switching is one click. Opening one replaces the other; the canvas never moves.
- **Statistics and Network** are report-style pages. Open them as a full-canvas overlay (inside `.builderCanvas`, with "← Back to canvas"), not above it.
- **History:** a popover under the button (as Undo/Redo users expect) with the last 10 entries, plus "Show all" opening the drawer tab.

**Check:**
- Opening each Validate item in turn never changes `.builderCanvas`'s top or height.
- The page never scrolls at ≥ 1121px.
- History opens next to its button.

## 4. Header menus: names, grouping and the Export cut-off (P2)

There are 54 visible controls in the Builder chrome at 1440. The menus mix unrelated actions:

| Menu | Contains | Problem |
|---|---|---|
| **Build** | Load selected path · **Clear** · Open in Failure Lab · Put on one host | Four unrelated actions. **"Clear"** (destructive) has no description or confirmation and sits beside harmless items. |
| **Validate** | Trace path · Coverage · Review (12) · Rules · Inventory · Network · Statistics | Half of these are analysis, not validation. |
| **Export** | Load (disabled, no reason given) · Import JSON · Import from architecture pack · Export JSON · Export SVG · Export PNG · Print / Present · *Export scope* (Complete topology / Architecture pack) | Contains imports. The scope comes *after* the actions it affects. **The menu is cut off by the window's right edge** at 1440: item borders cut, and the note "…presentation use: Com…" cut. |
| **Navigate** | Fit visible · Auto layout · Hosts: Collapse all / Expand all · Canvas layout ▾ ("Auto — responsi…" cut) | Layout actions under "Navigate". "Auto layout" (re-run) vs "Canvas layout: Auto" (style) is confusing. |

**Proposed structure** (two rows at ≥ 1121px; same actions, clearer homes):
```
Row 1  Builder ⓘ │ [Topology name ▾ saved list] ● Unsaved [Save] │ [File ▾] │ ↶ ↷ [History] │ [Use in ▾]
Row 2  Planes: [━ Data] [╍ Management] [┈ Access] │ Group by ▾ │ Layout ▾ │ [⌕ Find components…      ] │ ⟶ [Validate ⚠ 12 ▾] [Analyze ▾]
```
- **File:**
  - Open saved…, Import JSON…, Import from architecture pack…;
  - ─ Scope: (•) Complete topology ( ) Architecture pack;
  - Export JSON, SVG, PNG, Print / Present.

  Right-align the menu to its button, and clamp it to the viewport.
- **Use in:** Explorer (today's "Use"), Failure Lab ("Open in Failure Lab").
- **Layout:**
  - Style ▾ (Auto, Horizontal, Vertical, Free);
  - **Tidy layout** (was "Auto layout");
  - Fit;
  - Hosts: Collapse all / Expand all.
- **Validate:** Review, Rules, Coverage, Architecture profile (moved from the rail).
- **Analyze:** Trace path, Load selected path, Inventory, Network, Statistics.
- **Selection actions** ("Put on one host", Remove): in the Inspector and the object menu, not in a header menu.
- **Clear canvas…:** in File, with a confirmation that names the component count, and Undo.
- **Disabled items** ("Load") show why: "No saved topologies yet".

**Check:**
- Every menu fits inside the viewport at 1121, 1280 and 1440.
- No menu item is cut off.
- "Clear canvas" asks for confirmation and can be undone.

## 5. First view (P2)

- **A component is pre-selected on load:** Universal Forwarder 1 opens with its three connection handles and the green corner tick, before the user has done anything. Start with nothing selected.
- **Build stamp:** the "Build 161 · 4 Oct 2026" chip is the second most prominent item in the header. Move it into the ⓘ popover ("About this build").
- **Saved topologies:** "No saved topologies" as a select's text reads like a disabled control. Use "Saved topologies (0)" or the current topology's name.
- **"Use":** it has a tooltip since Build 153, but the label alone says nothing. Use "Use in explorer", or the "Use in ▾" menu (item 4).

## 6. Bottom bar (P2)

`+ Add · Inspector · Focus canvas · Show minimap · Presentation · Full screen · ?` + zoom.
- **Focus canvas**, **Presentation** and **Full screen** are three variants of "more room / show it". Combine them into one **View ▾** (Focus, Presentation, Full screen) or three icon buttons with tooltips.
- **"?" and the help box:** the help box is on by default and returns on every reload (see the canvas handoff, item 4).
- **Labels:** keep "+ Add" and the zoom group as they are. At < 1280, show icons only for the rest.

## 7. Components palette (P3)

- **Tall items:** each item is a card about 70px tall (icon tag, name, subtitle, "adds unconnected"), so only about 4 show at 900px tall. Use compact rows (about 40px: icon · name · subtitle) and show details on hover/focus.
- **Repeated text:** "adds unconnected" repeats on every item. State it once, next to the "New unconnected" checkbox.
- **Overlap:** the palette drawer overlaps the help box; the help box shows through at its right edge. Hide the help box while a drawer is open.

## 8. Small (P3)

- **Validate pill:** "12 to review" is green text. Use green ✓ when clean, amber for review items, red for errors.
- **Targets:** the ⓘ button is 23×23; make it ≥ 28×28.

---

## Order of work

1. Item 1 (tablet widths) and item 2 (rail cut-offs): the biggest visible problems, and both checkable by the tools.
2. Item 3 (one place for panels, History).
3. Item 4 (menus) with item 5. Do these together, since they change the header.
4. Items 6–8.

Re-run all tools after each step. Header changes affect the desktop space targets, so keep them at 7/7.

## How to verify

1. 0 `pageerror` events; the button sweep (update its count if controls change) and grouping sweep are clean.
2. `tools/builder-space-check.js`: **7/7**. Perf `allOk` on three runs; connector all OK.
3. Each rail panel and each menu: nothing cut off, nothing outside the viewport.
4. Opening every Validate/Analyze item and History never moves the canvas.
5. Phones at 360 and 390: unchanged or better (Build 159 checks).
6. A `changeRegister` entry and the build stamp for each new block.

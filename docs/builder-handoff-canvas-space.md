# Builder handoff: give the canvas the screen (desktop)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Screenshots:** `docs/mockups/compare/builder-space-build138-1440.png` and `builder-space-build138-2560.png`.
**Baseline:** `main` at `2111f20` (Build 138, `builder-ov2-visual-v138`), merged into branch `claude/build-page-layout-bl6jk1`. Build 138 has 0 errors on load at every desktop size.
**Tool (new):** `node tools/builder-space-check.js index.html [screenshot-dir]` measures the canvas at 1280×800, 1440×900, 1920×1080 and 2560×1440 against the targets below. It's on branch `claude/build-page-layout-bl6jk1`; copy it to `main` along with `index.html`.
**Scope:** the Builder view on desktop (≥ 1121px). Mobile stays as it is. The OV tab can use the same full-width rule (item 1).

## Where Build 138 stands

| Screen | Canvas (w × h) | Share of screen | Chrome above canvas | Empty at the sides | Page scrolls |
|---|---|---|---|---|---|
| 1280×800 | 1206 × 500 | 59% | 302px | 37 + 37 | yes (182px) |
| 1440×900 | 1366 × 600 | 63% | 302px | 37 + 37 | yes (182px) |
| 1920×1080 | 1506 × 760 | 55% | 302px | **207 + 207** | yes (162px) |
| 2560×1440 | 1506 × 760 | **31%** | 302px | **527 + 527** | no, but **378px empty below** |

The causes, in order of impact:
1. **`.shell{max-width:1580px}`** caps the whole app, so from 1600px up the canvas never gets wider than 1506px, and the extra width becomes empty margin.
2. **The canvas height stops at 760px** and doesn't follow the window, so tall screens get empty space below.
3. **302px of chrome sits above the canvas** at every size:

   | Row | Height | Contents |
   |---|---|---|
   | App header | 22–71 | Logo, title, subtitle, "108 stages · 10 components · 64 failures" (about the Flow model, not the Builder) |
   | View tabs | 99–144 | Flow · Matrix · Builder · OV · … |
   | Builder head | 152–196 | Title, Build badge, Undo, Redo, History, saved-topology list, Save, Use in explorer, status |
   | Plane bar | 205–245 | Plane toggles, Group by, then **empty middle**, then Navigate, Build, Validate, Export |
   | Dock row | 253–289 | Find & navigate, Architecture profile, Review findings, Tools, groups |

4. **Rows below the canvas make the page scroll:** the validation bar ("Valid · 0 errors · 12 to review", 52px, which repeats the "Review findings · 12 to review" dock) and the page footer ("Classic splunkd event pipeline model…", 36px).
5. **Two bars inside the canvas take its bottom 88px:** the hint strip ("Pan drag blank space · Zoom wheel …", 32px) and the bottom toolbar (Add, Inspector, Focus canvas, Hide minimap, Presentation, Full screen, zoom; 48px, full width).
6. **The inspector (340px) is drawn on top of the canvas** even at 1920 and 2560, where there are hundreds of empty pixels beside it.
7. **"Focus canvas" helps with height** (canvas top 115px) but is still capped at 1510px wide, and the page still scrolls (by 71px at 2560).

## Targets (the tool checks these)

| Screen | Canvas at least | Page scroll |
|---|---|---|
| 1280×800 | 1240 × 640 | none |
| 1440×900 | 1400 × 740 | none |
| 1920×1080 | 1880 × 920 | none |
| 2560×1440 | 2520 × 1280 | none |

That means about 16–20px side gutters, chrome above the canvas of **≤ 150px**, and the canvas running to the bottom of the window.

---

## 1. Full width in the Builder view

- Add a view class to the body (`document.body.dataset.view = state.view` in the `switchView` wrapper), then:
  ```css
  body[data-view="builder"] .shell,
  body[data-view="ov"] .shell{max-width:none;padding-inline:16px}
  ```
  The other views keep the 1580px cap for readability.
- Anything sized from `.shell` (the header, tabs, the builder grid) follows automatically. Check the builder grid's own `max-width` and `grid-template-columns`: the canvas column must be `minmax(0,1fr)` with no maximum.

**Check:** at 1920 and 2560, `tools/builder-space-check.js` reports side gaps ≤ 20px.

## 2. Canvas height follows the window; the page never scrolls

- Size the canvas from the window, not a fixed number:
  ```css
  body[data-view="builder"] .builderCanvas{height:calc(100dvh - var(--builder-canvas-top) - 12px);min-height:480px;max-height:none}
  ```
  Set `--builder-canvas-top` from JavaScript (the canvas's `getBoundingClientRect().top` plus `scrollY`) on load, on resize (debounced) and whenever a row above it opens or closes. A `ResizeObserver` on the rows above is simplest.
- **Remove the validation bar below the canvas** in the Builder view. The same information is already in the dock ("Review findings · 12 to review"). Put the state on the Validate menu button as a badge: a green tick when valid, a red count for errors, an amber count for items to review.
- **Hide the page footer** in the Builder view (`body[data-view="builder"] .footer{display:none}`, or move its text into the ⓘ popover).
- After a height change, re-run Fit only if the user hasn't panned or zoomed since the last Fit. Keep the current zoom otherwise.

**Check:** no page scroll in the Builder view at all four sizes; the canvas bottom is within 12px of the window bottom; 0 errors across a 1440 → 1920 → 1280 resize.

## 3. Cut the chrome above the canvas from 302px to ≤ 150px

### 3a. One app bar in the Builder view (saves about 95px)
Merge the app header and the view tabs into one 48px bar when the Builder (or OV) view is active: logo and "Splunk Pipeline Explorer" on the left, then the view tabs. Hide the subtitle and the "stages · components · failures" counts; they describe the Flow model, not the Builder.

### 3b. Merge the builder head and plane bar at ≥ 1440px (saves about 45px)
One 44px row:
- **left:** "Builder" + the build badge (ⓘ stays);
- **middle:** the three plane toggles and Group by;
- **right:** Undo, Redo, History, the saved-topology list, Save, Use in explorer, then Navigate, Build, Validate, Export.

Shorten the status text ("Unsaved changes · Recovery d…" is cut off now) to a dot plus "Unsaved", with the full text in a tooltip. Below 1440px, keep two rows but give the plane bar's empty middle to the controls.

### 3c. Replace the dock row with a slim left rail (saves 44px)
The five collapsed panels (Find & navigate, Architecture profile, Review findings, Tools, groups) take a full-width row even when closed. Move them to a **40px icon rail** at the canvas's left edge:
- one button per panel, with a tooltip and a count badge ("12" on Review findings);
- clicking opens the panel as a flyout over the canvas (the width it has today), and Esc closes it;
- **"/" still opens Find & navigate.**

Alternatively, move them into the existing menus, but keep Review findings one click away.

**Check:** the canvas top is ≤ 150px at 1440×900 with every panel closed; every panel still opens in one click and closes with Esc; the keyboard shortcuts still work.

## 4. Slimmer in-canvas bars (gives back about 50px of canvas)

- **Merge the hint strip and the bottom toolbar into one 40px floating row:**
  - left group: + Add, Inspector, Focus canvas, Minimap, Presentation, Full screen;
  - right group: − 100% + Fit;
  - no full-width background between the groups, so the canvas shows through.
- **Hint text becomes a "?" button** in the left group that opens the hint as a popover. Show the popover automatically once, on the first visit, and remember that in `localStorage`.
- **Minimap:** hide it automatically while every node is in view, and show it again as soon as part of the topology is off screen (the toggle still works).

**Check:** the in-canvas controls take ≤ 44px of height; at 1440×900 no node sits under a control after Fit.

## 5. Dock the inspector and palette beside the canvas on wide screens

- **At ≥ 1680px, open the inspector as a column** to the right of the canvas instead of on top of it, and do the same for the pinned palette on the left. The canvas shrinks by the panel width.
- **Below 1680px, keep today's overlay.**
- **Add a drag handle** on the inspector's inner edge, 300–560px, and remember the width in `localStorage` (a per-viewer convenience).
- After the canvas width changes, keep the selected node in view (pan by the difference), without re-fitting.

**Check:** at 1920 with the inspector open, no node or connector is covered by it; the inspector's left edge equals the canvas's right edge.

## 6. Focus canvas uses the whole window

In Focus mode:
- hide the app bar, tabs, builder head, plane bar and rail;
- make the canvas `position:fixed; inset:0` (full width and height);
- keep one slim floating bar at the top: "Exit focus (Esc)", the plane toggles, Undo/Redo and Save.

Full screen (the browser API) can then call Focus as well.

**Check:** in Focus at 2560×1440, the canvas is 2560 × 1440 (±8px); no page scroll; Esc returns to the normal layout with the same zoom and selection.

## 7. Fit on big screens (optional)

Fit currently tops out at 112%, so a small topology sits in the middle of a big canvas. At ≥ 1920px, allow Fit up to 125%, while staying ≥ 85% for large topologies (the Build 121 rule).

---

## Acceptance
1. `node tools/builder-space-check.js index.html shots/`: every size shows `"meetsTarget": true` and `"errors": []`.
2. At each size, take a screenshot with the inspector open, and with the palette pinned at 1920 and 2560: nothing covers the canvas at ≥ 1680px.
3. Focus mode at 1920 and 2560 fills the window.
4. The existing checks still pass: 0 errors on load and resize, the button sweep, `tools/builder-connector-check.js`, and the grouping sweep.
5. Mobile (390×844) is unchanged: the same layout as Build 138 and no horizontal scroll.
6. Add a `changeRegister` entry for the new block (`builder-canvas-space-v139` or the next free number).

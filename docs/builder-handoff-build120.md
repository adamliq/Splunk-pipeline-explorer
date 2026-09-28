# Builder handoff: Build 120 review

> **Superseded by [`builder-handoff-build122.md`](builder-handoff-build122.md).** Build 121 fixes the P0 and most of the items below. Kept as history.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `6dd679e` (Build 120, 28 Sep 2026), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `docs/builder-layout-handoff.md` explains blocks v112–v118 and why each exists. This file replaces it as the task list.

## TL;DR

1. **P0: Build 120 is broken on load.** One duplicate `const` makes the browser reject the whole v116 script. The desktop toolbar disappears, including ＋ Add, Inspector, Focus, and the Navigate/Build/Validate/Export menus, so **components can't be added on desktop.** The fix is a one-word rename (see P0).
2. With that rename applied, almost every check from the previous handoff passes (see the scorecard). What's left is a short list of P1/P2 polish items.

## Rules for every future build

- **Start from the latest `index.html` on `main`, and keep every versioned block** (`…-v112` to `…-v118`). A build made from an older copy silently brings back fixed bugs.
- **Never redeclare a top-level `const`, `let` or `function` name.** All the classic `<script>` blocks share one global scope. A duplicate `const` is a `SyntaxError`, so the browser skips **the entire script**, and every later script that uses its names also throws. Before adding a block, search the file for each new top-level name. Prefix new names with the block's purpose (for example `builderToolbarCanvas`, not `builderCanvas`).
- **Use a unique version number per block.** Build 120 has two `v117` blocks (`builder-add-return-v117`, `builder-add-palette-v117`) and two `v118` blocks (`builder-bottom-controls-v118`, `builder-ui-polish-v118`). Number the next blocks from v121 upward, matching the build number.
- **Layout code that moves DOM nodes must be idempotent.** It may run again on media-query `change`, resize or re-render.
- **Move existing elements; don't recreate them.** Handlers are bound by id.
- **Keep the build stamp (`<title>`, `data-build-number`/`data-build-date`, `.builderBuildStamp`) in static HTML, or set it in a script that can't fail.** In the broken Build 120 the badge still says "Build 119", because the script that updates it never runs.
- **Before uploading,** load the page in Chromium at 1440×900 and 390×844, click **Builder**, and confirm there are **zero `pageerror` events**. One broken block takes down every block that depends on it.

---

## P0: fix the duplicate `builderCanvas` declaration (blocks everything)

**Symptom (Build 120 as uploaded, 1440×900):**
- 4 errors on load: `SyntaxError: Identifier 'builderCanvas' has already been declared`, `ReferenceError: builderToolbarAttach is not defined` (twice, from `builder-add-return-v117` and `builder-bottom-controls-v118`) and `ReferenceError: builderToolbarMedia is not defined` (from `syncBuilderMobileToolbar` in `builder-ui-polish-v118`).
- The v116 CSS still applies, but the v116 script never runs, so the toolbar is hidden and nothing is moved anywhere. **＋ Add, Inspector, Focus canvas, Hide minimap, Presentation and all four menus are unreachable.** `#builderAddToggle`, `#builderMinimapToggle` and `#builderPresentationToggle` are hidden inside `.builderNavigation`, and clicking ＋ Add times out.
- The canvas zoom control is drawn over the minimap, and the header badge says "Build 119" while the title says "Build 120".

**Cause:** `<script id="builder-toolbar-declutter-v116">` starts with
```js
const builderToolbar=$('.builderToolbar'),builderPlaneBar=$('.builderPlaneBar'),builderCanvas=$('.builderCanvas');
```
but an earlier script (around line 3021) already declares `const builderCanvas=…`.

**Fix:** inside the v116 script **only**, rename the **variable** `builderCanvas` to `builderToolbarCanvas` (4 occurrences: the declaration plus three uses in `builderToolbarAttach`). **Don't touch the CSS selector string `'.builderCanvas'`.** A blind find-and-replace turns it into `'.builderToolbarCanvas'`, which matches nothing and throws `Cannot read properties of null (reading 'appendChild')`. For example:
```js
// before
const builderToolbar=$('.builderToolbar'),builderPlaneBar=$('.builderPlaneBar'),builderCanvas=$('.builderCanvas');
if(!builderCanvasChrome.isConnected)builderCanvas.appendChild(builderCanvasChrome);
builderToolbarMove($('#builderFullscreenToggle'),builderCanvas);
if(!builderMapChip.isConnected)builderCanvas.appendChild(builderMapChip);
// after
const builderToolbar=$('.builderToolbar'),builderPlaneBar=$('.builderPlaneBar'),builderToolbarCanvas=$('.builderCanvas');
if(!builderCanvasChrome.isConnected)builderToolbarCanvas.appendChild(builderCanvasChrome);
builderToolbarMove($('#builderFullscreenToggle'),builderToolbarCanvas);
if(!builderMapChip.isConnected)builderToolbarCanvas.appendChild(builderMapChip);
```
A safe regex, if you script it: replace `(?<![.\w#-])builderCanvas\b` with `builderToolbarCanvas`, **within the v116 `<script>` only**.

**Verified:** with only this rename, there are 0 errors on load, 0 across a 1440→1000→1440→700→1440 resize, and 0 at 390×844.

---

## Scorecard: Build 120 with the P0 rename applied

Measured with Playwright/Chromium. ✅ = passes the previous handoff's check.

| Check | Result |
|---|---|
| Canvas top, 1440×900 (target ≤ 370) | ✅ **302** (was 423) |
| Canvas top in Focus mode | ✅ 115; page header, search and view tabs hidden; Esc exits |
| Canvas top, 390×844 (target ≤ 700) | ✅ **593** (was 1763); no toolbar label wraps or clips; no horizontal scroll |
| Zoom − % + / Fit, ＋ Add, Full screen on the canvas | ✅ all inside the canvas; no overlaps with each other or with nodes after Fit |
| Canvas layout select in the Navigate menu | ✅ |
| Page-wide `#search` / `#pipelineFilter` hidden in Builder | ✅ |
| Header description behind ⓘ | ✅ |
| Wording | ✅ validation bar "Valid · 0 errors · 12 to review"; dock "Review findings · 12 to review", "Tools · for Universal Forwarder 1" |
| Build stamp | ✅ title, data attributes and badge all say 120 |
| Text under 10px | ✅ 0 (was 57) |
| "Production" twice on a node | ✅ now "Env · Production" plus region |
| Repeated tier label in the node footer | ✅ footer shows "2 pipeline sets" or nothing |
| Plane pills only for the selected node | ✅ |
| Palette inside the canvas | ✅ at (42,302), 300×590 |
| Palette group order | ✅ Sources, Collection, Processing, Destinations, then management |
| Palette search "hec" | ✅ HEC client, HEC endpoint first; 2 groups open; no Deployment App; Enter adds HEC client |
| Palette search "indexer" | ✅ Indexer first |
| "adds unconnected" tags (UF selected) | ✅ shown on Windows Event Log and Search Head; hidden on HF, Indexer, IP, User, DS |
| "Adding after: Universal Forwarder 1", Recent row, drag hint, inline descriptions | ✅ |
| Inspector inside the canvas (desktop) | ✅ at (1058,302), 340×590 |
| Mobile Inspector as a bottom sheet | ✅ 60% of the viewport; new node visible above it |
| Unselected node height (target ≤ 170px) | ⚠️ 176–178px (close; see P2-4) |
| Plane handles on hover/focus of unselected nodes | ✅ hidden by default, visible on hover or focus, and clickable once revealed |
| Palette "Change" target | ✅ closes the palette; picking a node reopens it with "Adding after: <node>" (but see P2-6) |
| Button sweep (174 buttons, each on a fresh page, including 11 new ones) | ✅ 0 errors; only the ⓘ button does nothing (P2-5) |
| Presentation in the Export menu, minimap collapse on the minimap | ↔️ Build 120 puts Hide minimap and Presentation in a new **bottom control bar** (`builderBottomControls`, v118). That's an acceptable alternative, so keep it. |

---

## P1: fix after P0

### P1-1. The header breaks when the status message is long
After a palette add that falls back to unconnected (for example ＋ Add → HEC client with Universal Forwarder selected), `#builderIoStatus` shows "Added HEC Client unconnected · Universal Forwarder cannot normally send event data d…". In the compact desktop header (`.builderDensityHeaderPrimary`, v114) this:
- pushes the build badge under the title, so the header grows to two rows,
- wraps "Unsaved changes" onto two lines, and
- runs the message past the right edge of the page, clipped mid-word.

**Fix:** on desktop, give `#builderIoStatus` `max-width` (about 320px) with `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` and the full text in `title`. Or, better, show long action messages as a toast at the top of the canvas that fades after about 6 seconds, and keep only the short saved/unsaved state in the header. The header must stay one row at 1280 and 1440.
**Check:** after ＋ Add → HEC client (UF selected), `.builderHead` height is unchanged, and nothing extends past the viewport's right edge.

### P1-2. Focus mode shows the same controls twice
In Focus mode the top focus bar has ＋ Add, Inspector, Presentation, Show minimap, Fit and Full screen, **and** the v118 bottom control bar shows ＋ Add, Inspector, Exit focus, Show minimap, Presentation, Full screen, − % + and Fit.
**Fix:** in `.topologyBuilder.canvasFocus`, keep one set. The recommended split: the top focus bar keeps the finding navigator (← 1/12 … →), Profile, Save and Exit focus; the bottom bar keeps the canvas actions (＋ Add, Inspector, Show minimap, Presentation, Full screen, zoom and Fit). Also make the standalone "Saved" text next to Save a muted status (previous handoff §10 item 13, still open).
**Check:** in Focus mode, each control appears once.

### P1-3. The desktop Inspector hides the zoom controls
With the Inspector open, the canvas-anchored panel covers the right end of the bottom control bar, so − % + and Fit can't be reached, and it covers the end of the hint strip. (Verified: `elementFromPoint` on the + and Fit buttons returns the Inspector, and clicking + times out.)
**Fix:** while the Inspector (or the palette, on the left) is open, inset the bottom bar and hint strip by the panel's width, or end the panel above the bottom bar.
**Check:** with the Inspector open at 1440×900, the zoom buttons and Fit are visible and clickable.

### P1-4. Mobile wording and overlap
At 390×844:
- The mobile dock still says "Review findings · 12 findings" and "Tools · 5 tools · Universal Forwarder 1". Use the same wording as desktop ("12 to review", "for Universal Forwarder 1").
- The floating zoom control (− 74% + Fit) sits over the first node's header ("Syslog Source 1" is partly hidden). On mobile, either move it to the canvas's bottom edge, or have Fit leave room at the top (add the control's height to the top padding).
- "Planes (3)" sits alone in a full-width boxed row. Put it on the ＋ Add / Inspector / More row, or make it a compact chip.
- The view tabs row scrolls sideways ("Diagnos…" is cut off) with no scroll cue. Add an edge fade or scroll-snap, or wrap it to two rows.

**Check:** at 390×844 no node is covered by a floating control after Fit, the dock wording matches desktop, and the planes control shares a row.

---

## P2: polish

1. **Duplicated "0 errors" in the validation bar.** Its text reads "✓ Valid · 0 errors · 12 to review … 0 errors": the summary pill repeats the count. Keep the pill, or the count in the sentence, not both.
2. **Review badges are empty grey circles.** Muting review-only badges was right, but a count-less grey dot on every node and edge looks like an unused connection handle. Show the number in the muted badge (for example a small grey "2"), and keep red for errors.
3. **Header row alignment at 1280.** Recheck the header row after P1-1; the Undo/Redo/History/Save group should stay on one row.
4. **Node height.** Unselected nodes are 176–178px against a target of ≤ 170. The stage rows ("Event emission", "Source retry / buffer") are the tallest part; tighten their padding a little, or show only the first stage plus "+1 more" when a node isn't selected.
5. **The ⓘ header button does nothing on click or tap.** `#builderHeaderInfo` only has a native `title` tooltip, so touch users can't read the description, and keyboard users get nothing when they press it. Make it a disclosure: clicking or pressing Enter toggles a small popover containing the description (`aria-expanded`, `aria-controls`); Esc or clicking outside closes it.
6. **"Change" gives no hint.** Clicking "Change" in the palette closes it with no message. Show a short status or canvas toast such as "Select the component to add after", and let Esc cancel and reopen the palette.
7. **The hidden Inspector's Close button is still focusable.** `#builderInspectorDrawerClose` is laid out and clickable while the Inspector is closed; clicking it does nothing. Hide the closed drawer from the tab order (`hidden`, `inert`, or `visibility:hidden`) so keyboard users don't land on invisible controls.

---

## How to verify (run before every upload)

1. **Zero errors:** load the page, click **Builder**, and record `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize. The result must be empty.
2. **Button sweep:** for each `#topologyBuilder button`, on a fresh page, open its menu, disclosure or drawer, click it, and assert no errors plus a visible effect (a DOM/state change, download, dialog, print or fullscreen request). The v115 sweep found three real bugs this way.
3. **Layout numbers:** canvas top ≤ 370 (1440×900), ≤ 700 (390×844); the palette and Inspector inside the canvas rectangle; no horizontal scroll.
4. **Key flows:** ＋ Add → Windows Event Log with UF selected adds an unconnected node with a visible message; Undo/Redo; clicking an edge's review badge opens the popover; the `/` key opens Find & navigate.
5. Add a `changeRegister` entry for each new block, as v112–v118 do.

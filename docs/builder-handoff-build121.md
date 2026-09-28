# Builder handoff: Build 121 review

> **Superseded by [`builder-handoff-build123.md`](builder-handoff-build123.md).** Build 122 fixes the items below. Kept as history.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `6598ae7` (Build 121, 28 Sep 2026), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `docs/builder-handoff-build120.md` (the previous task list) and `docs/builder-layout-handoff.md` (what blocks v112–v118 do and why). This file replaces both as the task list.

## TL;DR

Build 121 is healthy: **0 errors** on load, across resizes and across all 174 Builder buttons. The Build 120 P0 and nearly every P1/P2 item are fixed. Five items remain; **1 and 2 matter most**, and 3–5 are small polish.

## Rules for every future build (unchanged; still apply)

- Start from the latest `index.html` on `main`, and keep every versioned block (`…-v110` to `…-v121`).
- **Never redeclare a top-level `const`, `let` or `function` name.** All the classic `<script>` blocks share one global scope, so a duplicate makes the browser skip the whole script (this was the Build 120 P0). Search the file for each new top-level name first, and prefix new names with the block's purpose.
- **One version number per block.** Name the next blocks `builder-…-v122` and up, matching the build number.
- Layout code that moves DOM nodes must be idempotent. Move existing elements; don't recreate them.
- Keep the build stamp (`<title>`, `data-build-number`/`data-build-date`, `.builderBuildStamp`) consistent. It's correct in 121.
- Before uploading: load the page in Chromium at 1440×900 and 390×844, click **Builder**, and confirm **zero `pageerror` events**.

---

## Verified fixed in Build 121

| Item | Result |
|---|---|
| P0: duplicate `builderCanvas` const | ✅ renamed; the toolbar, ＋ Add and menus work |
| Load, resize and button sweep | ✅ 0 errors at 1280/1440/1920/390 and across a 1440→1000→1440→700→1440 resize; 174 buttons, 0 errors |
| Canvas top | ✅ 302 (desktop), 115 (Focus), 579 (390×844) |
| Text size and horizontal scroll | ✅ 0 elements under 10px; no horizontal scroll |
| P1-2: Focus-mode duplicates | ✅ none; "Saved" is `span.builderFocusSaveStatus` with `aria-live=polite` |
| P1-3: Inspector or palette hides zoom | ✅ −, +, Fit and ＋ Add stay clickable with either open |
| P1-4: mobile | ✅ view tabs wrap to two rows; "Planes (3)" is on the ＋ Add row; the zoom control covers no node; wording matches desktop |
| P2-1: "0 errors" duplicated | ✅ shown once |
| P2-2: review badges | ✅ muted `reviewOnly` badges show their count ("2") |
| P2-4: node height | ✅ 159–174px |
| P2-5: ⓘ button | ✅ toggles `#builderHeaderInfoPopover` (`aria-expanded`); Esc closes it |
| P2-6: "Change" hint | ✅ "Select the component to add after · Esc to cancel"; Esc reopens the palette |
| P2-7: closed Inspector's Close button focusable | ✅ `inert`, 0 width, not tabbable; Close works when the Inspector is open |
| Palette | ✅ inside the canvas; "hec" → HEC client, HEC endpoint first; Enter adds; "indexer" → Indexer first |
| Mobile Inspector | ✅ bottom sheet at 60% of the viewport |

---

## Remaining work

### 1. The header still grows when a status message appears (P1-1, partly fixed)
**Now:** long messages are truncated with "…" and nothing runs past the viewport edge. But whenever `#builderIoStatus` shows text (after a palette add that falls back to unconnected, or the "Change" hint), the status takes width from the header row:
- at 1440×900 the build badge drops under the title, and `.builderHead` grows from **44px to 68px**;
- at 1280×800 the title itself wraps to two lines ("Custom topology / builder") as well;
- the canvas jumps down by the same amount, then back up when the message clears.

**Fix (recommended):** show action messages as a **toast inside the canvas**: top-centre, `role="status"` / `aria-live="polite"`, auto-dismissing after about 6s, with a close ×. Keep only the short saved/unsaved state (and the recovery-draft note) in the header. At minimum, give the status element a fixed maximum width that never takes space from the title and badge (for example, place it on the right with `flex:0 1 280px; min-width:0` and ellipsis), and keep the title `white-space:nowrap`.

**Check:** at 1280×800 and 1440×900, after ＋ Add → HEC client with Universal Forwarder selected, and after palette → Change, `.builderHead` height is unchanged (44px), the title is on one line, the badge stays beside it, and the full message is readable (toast or `title`).

### 2. Adding an unconnected component shrinks the whole canvas
**Now:** with Universal Forwarder selected, ＋ Add → HEC client (or any incompatible item) places the new node on a new row under Syslog Source 1, and Fit zooms the topology out to fit both rows: **75% at 1440×900**, and smaller at 1280×800, where node text becomes hard to read. The existing Syslog Source → Syslog Server edge also bends around the new node.

**Fix (choose one):**
- **Preferred:** place unconnected components in a dedicated "Unconnected" column (or tray) to the left of the first column, or below the topology, sized so it doesn't change the main row's layout. Label it, and let the user drag from it to connect.
- Or: after an add, don't re-fit below a readable zoom (about 0.85). Keep the zoom and **pan** so the new node is in view, and highlight it briefly.

**Check:** at 1440×900 after adding one unconnected node, zoom stays ≥ 0.85 (or unchanged), the new node is visible and selected, and the existing edges keep their shape.

### 3. The palette search box is cramped
**Now:** in `#builderCanvasPalette`, the count ("42 components") shares a row with `#builderPaletteQuery`, so the input is about 185px wide and its placeholder is cut off ("Search source, HEC, Inde…"). The "New unconnected" checkbox sits right-aligned, away from where the eye reads, with a gap before its label.

**Fix:** let the search input take the full palette width; put the count under it as muted text (or inside the input on the right, as a small suffix). Left-align the "New unconnected" checkbox and label under "Adding after: … · Change", as one control.

**Check:** the placeholder "Search source, HEC, Indexer…" is fully visible at 1280 and 1440, and the checkbox sits directly next to its label.

### 4. At 1280 with the Inspector open, the bottom strips crowd
**Now:** at 1280×800 with the Inspector open, the hint strip ("Pan drag blank space · Zoom wheel · …") wraps to two lines, and the Inspector covers part of the minimap.

**Fix:** while the Inspector (or palette) is open, shorten the hint strip to its first clauses, or hide it (it's also available via ⓘ/help). Move the minimap left by the panel width, or hide it while the panel is open.

**Check:** at 1280×800 with the Inspector open, the hint strip is one line (or hidden), and the minimap is either fully visible or hidden, never half-covered.

### 5. Mobile vertical layout: edge labels sit on node borders
**Now:** at 390×844 the topology stacks vertically, and route labels such as "TCP/TLS or UDP" and "File handoff" overlap the top border of the next node.

**Fix:** in vertical layout (`.unifiedBuilderWorld.verticalLayout`), increase the row gap by the label height (about 24px), or place labels beside the connector instead of on it.

**Check:** at 390×844 no route label overlaps a node's box.

---

## How to verify (run before every upload)

1. **Zero errors:** load, click **Builder**, and record `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize. The result must be empty.
2. **Button sweep:** for each `#topologyBuilder button`, on a fresh page, open its menu, disclosure or drawer, click it, and assert no errors plus a visible effect. Hover-only connection handles need a hover or focus first.
3. **Layout numbers:** canvas top ≤ 370 (1440×900) and ≤ 700 (390×844); the palette and Inspector inside the canvas; no horizontal scroll; the header height stays constant when a status message appears (item 1).
4. **Key flows:** ＋ Add → Windows Event Log with UF selected adds an unconnected node with a readable message and without shrinking the canvas below a readable zoom (item 2); Undo/Redo; clicking an edge review badge opens the popover; `/` opens Find & navigate; palette → Change → pick a node → the palette reopens with the new target.
5. Add a `changeRegister` entry for each new block.

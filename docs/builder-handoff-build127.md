# Builder handoff: Build 127 review

> **Superseded by [`builder-handoff-build137.md`](builder-handoff-build137.md)** (Build 128 review: five of these six items are fixed; see that file for what remains, plus the Group-by feature). Kept as the Build 127 review record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `e4a1009` (Build 127, 29 Sep 2026: v125 architecture pack, v126 palette pin, v127 relationship authentication), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build124.md` and earlier. This file replaces them as the task list.
**Tool:** `node tools/builder-connector-check.js index.html [screenshot-dir]` (Playwright/Chromium).

## TL;DR

Build 127 is in very good shape: **0 errors** on load, **179 buttons** with 0 errors, and **every connector scenario passes** while dragging and after drop. The architecture pack meets almost every acceptance check from the Build 124 handoff. **Six small items remain** (below); 1–3 are in the architecture pack.

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v127`).
- **Never redeclare a top-level `const`, `let` or `function` name** (all classic scripts share one global scope; a duplicate makes the browser skip the whole script). Suffix new names with the block number.
- One version number per block; the next is `…-v128`.
- Move existing DOM elements rather than recreating them; layout code must be idempotent.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- Before uploading: zero `pageerror` events at 1440×900 and 390×844 after clicking **Builder**, run `tools/builder-connector-check.js`, and export the architecture pack once.

---

## Verified in Build 127

| Area | Result |
|---|---|
| Load, resize, button sweep | ✅ 0 errors; 179 buttons |
| Connector check (8 scenarios, while dragging and after drop) | ✅ **all OK** |
| Pack: cover | ✅ table of contents with page numbers; owner (or "Not set"); scope; build 127; counts; "Valid · 0 errors · 12 to review" |
| Pack: tables | ✅ inventory 4 rows; event-data connections 3 rows (14 columns); findings 12; rules 10; header rows repeat in print |
| Pack: security, ownership, resilience, deployment, appendix | ✅ present when enabled |
| Pack: duplicate diagram pages | ✅ removed ("Region · Unspecified" gone) |
| Pack: printing | ✅ page number and footer on all 17 pages; cover prints |
| Pack: light theme | ✅ white page; 0 of 536 HTML text elements below 4.5:1 |
| Pack: "Not set" and secrets | ✅ 23 "Not set" markers; no secret or credential values |
| Pack: re-import | ✅ exported a 5-node / 4-connection topology, re-imported on a fresh page, got 5 / 4 including the renamed node; a non-pack file gives a clear error |
| Palette pin (v126) | ✅ docks beside the canvas (canvas narrows; 0 cards covered); stays open after add and after selecting a card; persists across reload |
| Relationship authentication (v127) | ✅ "Authentication required" (Unknown/Yes/No) and "Authentication type" (13 mechanisms) per connection; **no password or secret inputs**; the chosen type is stored and appears in the pack and in the topology JSON |

---

## Remaining work

### 1. Pack diagrams: the "Splunk-to-Splunk" label is detached from its line
**Now:** in the pack's overview diagram (both themes), the UF → Indexer connector is now straight (the earlier loop over the top is fixed), but its label "Splunk-to-Splunk" sits **128px above the line**. The other two labels are 8px from their lines.
**Cause:** v125 re-routes the export connectors with the 320px layout, but the label keeps a position calculated for the old looping route (or for `routeMidpoint` of the old points).
**Fix:** in the export SVG, place each label at the midpoint of the **final** path: after building each `<path d>`, compute its midpoint (with a DOM SVG, `getPointAtLength(total/2)`; or compute the midpoint of the final polyline, since the export draws straight segments with rounded corners). Apply any user `labelOffset` afterwards. Put the edge badge at the label's right end, as on the canvas.
**Check:** in the exported overview, every connector label's centre is ≤ 12px from its own path, and no label overlaps a card.

### 2. Pack tables are too small to read in print
**Now:** table `td` and `th` are **8px** (about 6pt when printed on A4 landscape).
**Fix:** use at least **9.5pt** body text and 9pt headers in print (`@media print{td,th{font-size:9.5pt}}`), and 12–13px on screen. Let wide tables (the 14-column connection register) wrap cell text rather than shrink it; if they still don't fit, split into two tables ("Transport" and "Service levels").
**Check:** `getComputedStyle(td).fontSize` ≥ 12.6px (9.5pt) under `emulateMedia('print')`, and no table overflows the page width in the Chromium PDF.

### 3. Pack light theme: the diagram's classification text is faint
**Now:** in the light theme, the SVG text "SECURITY TELEMETRY + PII" (the `.classification` element, fill `rgb(243,189,97)`) measures **1.7:1** against the white page. The diagram cards stay dark, which is fine: their own text is readable.
**Fix:** in the light theme, use a dark amber for `.classification` (for example `#8a5a00`, about 6:1 on white), and check the legend and subtitle colours the same way. Apply it only in the light theme; the dark theme is fine.
**Check:** every SVG text element drawn directly on the page background (legend, title, subtitles, classification; not text inside cards) is ≥ 4.5:1 in the light theme.

### 4. Pack: empty connection planes take a full page each
**Now:** with no fleet-management or authentication connections, "Fleet management connections" and "Interactive authentication connections" are each a full page with one line, "No entries in this section."
**Fix:** omit empty plane tables, and add one line to the event-data connections page (or the cover): "No fleet-management or interactive-authentication connections in this topology." Recompute the table of contents and page numbers. Apply the same rule to any other section whose tables are all empty (for example Deployment management when there's no Deployment Server).
**Check:** with the default topology and all sections on, the pack has no page whose only content is "No entries in this section."

### 5. The pinned palette also opens on mobile
**Now:** after pinning on desktop (stored in `localStorage` key `splunkPipelineExplorer.palettePinned.v1`), resizing to 390×844, or opening on a phone, shows the palette **open at 310×781px**, covering nearly the whole screen and the canvas. v126's own comment says "docks on desktop".
**Fix:** in the v126 `syncCanvasPanels` wrapper, only force the palette open when the desktop media query matches (for example `(min-width:1121px)`, as v113 and v116 use). On mobile, a pinned preference is remembered but ignored, and the palette opens only from ＋ Add. Hide or disable the Pin button on mobile, with a title such as "Pin is available on wider screens".
**Check:** with pin on, at 390×844 the palette is closed on load and after resizing from 1440 to 390; back at 1440 it's docked again.

### 6. Relationship authentication is hard to find
**Now:** the two new dropdowns live inside the collapsed **"Advanced settings and assurance"** section of the connection inspector, so most users won't discover them, and nothing on the canvas or in the inspector's main view shows the authentication state.
**Fix:** in the connection inspector's main (always-visible) area, add a one-line summary with a direct edit link, for example "Authentication: Mutual TLS certificate · required" or "Authentication: not specified · Set…". Clicking it opens the Advanced section and focuses the "Authentication type" dropdown. Optionally, add a small lock icon to the connection label on the canvas when authentication is specified (with a tooltip naming the type), and flag "Authentication required = Yes" with "type = Not specified" as a review finding.
**Check:** selecting a connection shows the summary line without expanding anything; the link focuses the dropdown; changing the type updates the summary, the pack and the topology JSON.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. `node tools/builder-connector-check.js index.html shots/`: every scenario `OK`, while dragging and after drop.
3. Button sweep: every `#topologyBuilder` button, on a fresh page, with its context revealed, gives no errors and a visible effect.
4. Architecture pack: export with all sections and diagram pages on, then check the items above plus the Build 124 acceptance list (counts, "Not set", no secrets, page numbers in the PDF, re-import).
5. Add a `changeRegister` entry for each new block.

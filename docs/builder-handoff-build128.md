# Builder handoff: Build 128 review

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `8da7456` (Build 128, 29 Sep 2026: `builder-review-polish-v128`), also merged into branch `claude/build-page-layout-bl6jk1`
**History:** `builder-handoff-build127.md` (Build 127 review) and earlier.
**Tool:** `node tools/builder-connector-check.js index.html [screenshot-dir]` (Playwright/Chromium).
**Mockup:** `docs/mockups/builder-grouping-mockup.html` (standalone; open it in a browser) for item 2.

## TL;DR

Build 128 fixes **five of the six** items from the previous task list completely, and most of the sixth. Regression checks are all green: 0 errors, 179 buttons clean, every connector scenario passes. What's left:
1. **A small bug in the relationship-authentication summary** (plus two optional extras).
2. **The new "Group by" canvas feature**, not started yet. This is now the main task: tier lanes first, component type second.

## Rules for every future build (unchanged)

- Start from the latest `index.html` on `main`; keep every versioned block (`…-v110` to `…-v128`).
- **Never redeclare a top-level `const`, `let` or `function` name** (all classic scripts share one global scope; a duplicate makes the browser skip the whole script). Suffix new names with the block number.
- One version number per block; the next is `…-v129`. A build may contain several blocks (for example `…-v129` for the item 1 fix and `…-v130` for Group by); keep the build stamp on the highest.
- Move existing DOM elements rather than recreating them; layout code must be idempotent.
- Keep the build stamp consistent (title, `data-build-*`, `.builderBuildStamp`).
- Before uploading: zero `pageerror` events at 1440×900 and 390×844 after clicking **Builder**, run `tools/builder-connector-check.js`, and export the architecture pack once.

---

## Verified in Build 128

| Previous item | Result |
|---|---|
| 1. Pack diagram label detached | ✅ all three labels ("TCP/TLS or UDP", "File handoff", "Splunk-to-Splunk") within **2px** of their lines, in both themes (was 128px) |
| 2. Pack tables too small | ✅ `td`/`th` **12.7px (9.5pt)** in print; the connection register is split into "transport" (8 columns, now including authentication required/type) and "service levels" (9 columns); no table overflows the page |
| 3. Light-theme classification text | ✅ **5.9:1** (was 1.7:1); no legend, title or subtitle text on the page background below 4.5:1 |
| 4. Empty planes taking whole pages | ✅ no empty-only pages; one line instead: "No fleet-management or interactive-authentication connections in this topology."; pack is 15 pages with every option on (was 17) |
| 5. Pinned palette on mobile | ✅ closed at 390×844 (after resizing and on a fresh mobile load); Pin button hidden, with the title "Pin is available on wider screens"; ＋ Add still opens it; docks again at 1440 |
| 6. Authentication hard to find | ⚠️ mostly: an always-visible summary line "Authentication: not specified · Set…" sits above the collapsed Advanced section; "Set…" opens it and focuses the Authentication type dropdown; the summary shows "Mutual TLS certificate · required" once both values are set. **One bug remains** (item 1 below); the optional lock icon and finding weren't added |
| Regression | ✅ 0 `pageerror` events; 179 buttons with 0 errors; connector check OK in all 8 scenarios, while dragging and after drop; Chromium PDF of the light pack renders (230 KB) |

---

## 1. Authentication summary ignores the type when "required" is Unknown

**Now:** select a connection, click **Set…**, and choose "Mutual TLS certificate" as the Authentication type while leaving "Authentication required" at **Unknown**. The value is saved (`authenticationType: "Mutual TLS certificate"`), but the summary still reads **"Authentication: not specified"**. It only updates once "required" is also set ("Mutual TLS certificate · required").
**Fix:** build the summary from both fields independently:
| required \ type | Not specified | a type (e.g. Mutual TLS certificate) | Not applicable |
|---|---|---|---|
| Unknown | "not specified" | "Mutual TLS certificate · requirement unknown" | "not applicable" |
| Yes | "required · type not set" (highlight as an open item) | "Mutual TLS certificate · required" | "required · type not set" |
| No | "not required" | "Mutual TLS certificate · not required" | "not required" |

**Check:** every combination in the table produces the listed text, and the summary updates immediately on each dropdown change, without re-selecting the connection.

**Optional (from the previous list, still open):**
- a small lock icon on the connection's canvas label when a type is set (tooltip names the type);
- a review finding when "Authentication required = Yes" and "type = Not specified" (currently no finding is raised: the review count stays at 12).

---

## 2. New feature: "Group by" on the canvas (tier lanes and component type)

**Mockup:** open `docs/mockups/builder-grouping-mockup.html` in a browser; it's a standalone, interactive page. It shows the three modes on an example 14-component topology and is the visual reference for this item. It's a mockup only: its layout and connectors are simplified, so build on the Builder's real layout, routing (v123/v124) and export code rather than copying its drawing code.

### What exists today (don't duplicate)
- **Isolate by** (`#builderIsolateBy`): complete topology / region / environment. Filters what's shown.
- **Group containers** (`#builderNavigationGroup`, `state.builderGroups`): user-created boxes, collapsible (`largeNavCollapsed()`).
- **Palette categories:** Sources, Collection, Processing, Destinations, Access & management, Deployment configuration, the clustering add-ons, Stream, SOAR, S3 federated search.
- **Collapsed-group export:** `withArchitectureExportScope()` already turns a collapsed group into one proxy node and merges its edges. Reuse that logic for collapsed types.

### Control
Add **Group by** to the Navigate row (next to Isolate by), with options `None` · `Tier lanes` · `Component type` · `Region` · `Environment` · `My containers`. Store the choice in `state.builderGrouping = {mode, collapsedTypes:[]}`, and save it in navigation bookmarks, layout profiles and `topologyDocument()`.

### Mode: Tier lanes (build first)
- Labelled vertical bands in pipeline order (Sources, Collection, Forwarding, Processing, Indexing, Search), each with a count ("Forwarding · 3"). Derive a component's tier from its type (one lookup table, shared with the palette categories).
- A separate **Management** lane along the bottom for Deployment Server, License Manager, Monitoring Console, cluster managers, identity providers and other non-event-data roles, placed under the column of the tier they manage, so fleet-management and authentication lines don't cross the event-data path.
- Empty tiers collapse to a thin labelled strip.
- In auto and horizontal layout, the lanes decide the x position (column = tier). In **free layout, never move nodes**: draw the lane backgrounds behind the user's positions instead, based on each lane's members.
- Lanes are drawn behind nodes and connectors (not interactive), and they're included in SVG, PNG and architecture pack exports when this mode is on.

### Mode: Component type (build second)
- A dashed box per component type, inside its tier column, with a header "Universal Forwarder · 3" and a ▾ toggle. The header is a keyboard-focusable button.
- **Collapse** turns the box into one summary node: "Universal Forwarder ×3", a meta line with regions ("2 regions") and review count ("1 to review"), and a stacked-card look. Clicking the summary node (or Enter) expands it again.
- **Merged connectors:** while a type is collapsed, its members' connections to the same endpoint merge into one line with a count badge ("3"). Its tooltip and a click list the member connections. Connections between members of the same collapsed type are hidden.
- Toolbar actions in this mode: "Collapse types with 3+" and "Expand all".
- **Manual containers take priority:** a node in a user container stays in that container, and type boxes only group ungrouped nodes (or offer "Ignore my containers" as an explicit choice).
- The architecture pack's "Current navigation view" scope exports the same collapsed view.

### Highlight chips (works in every mode)
A chip row under the controls: one chip per component type present, with a count. Click to highlight that type (dim the others and their unrelated connectors); Shift-click to add types; click again to clear. In the Builder, Shift-click could also select those nodes for bulk edit. Chips change no positions.

### Rules
- Grouping is a **view**. It never creates, edits or deletes `state.builderGroups`, and it never changes free-layout positions.
- Must be idempotent across re-renders (`renderBuilder`, layout switches, resize) and must not redeclare any existing top-level name (suffix new names with the block number).
- Keep the connector geometry guarantees: run `tools/builder-connector-check.js` in every grouping mode. Extend it with a scenario per mode, and one with Universal Forwarder collapsed, checking the merged line and its badge.
- Mobile (≤760px): lanes stack vertically in pipeline order (tier headers as row labels); type groups collapse by default for types with 3 or more.

### Acceptance check
- Tier lanes: with the default topology, every node sits inside its tier's band; Deployment Server and License Manager are in the Management lane; lane counts match the node counts; in free layout, positions before and after switching are identical.
- Component type: collapsing Universal Forwarder in a topology with 3 UFs managed by one Deployment Server shows one summary node and one Deployment Server → UF line with badge "3"; expanding restores the 3 nodes and 3 lines; Undo isn't affected (it's a view change).
- The mode and collapsed types survive a reload through a saved layout profile or bookmark, and appear in the exported pack.
- Chips: clicking "Indexer" dims every non-Indexer node; Shift-click "Search Head" adds it; clicking again clears.
- 0 `pageerror` events; the button sweep and connector check pass in all modes.

---

## How to verify (run before every upload)
1. Zero `pageerror` events at 1280×800, 1440×900, 1920×1080 and 390×844, and across a 1440→1000→1440 resize.
2. `node tools/builder-connector-check.js index.html shots/`: every scenario `OK`, while dragging and after drop.
3. Button sweep: every `#topologyBuilder` button, on a fresh page, with its context revealed, gives no errors and a visible effect.
4. Architecture pack: export with all sections and diagram pages on, in both themes; check labels ≤ 12px from their lines, print text ≥ 9.5pt, light-theme text ≥ 4.5:1, no empty-only pages, plus the Build 124 list (counts, "Not set", no secrets, page numbers in the PDF, re-import).
5. Group by: the item 2 acceptance check, and the connector check in every grouping mode.
6. Add a `changeRegister` entry for each new block.

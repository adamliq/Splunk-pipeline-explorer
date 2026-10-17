# Builder handoff: split the Inspector into tabs

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 198.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="builder-inspector-tabs-v199-styles">`, containing [`docs/mockups/builder-inspector-tabs-prototype.css`](mockups/builder-inspector-tabs-prototype.css);
- `<script id="builder-inspector-tabs-v199">`, containing [`docs/mockups/builder-inspector-tabs-prototype.js`](mockups/builder-inspector-tabs-prototype.js).

The script only wraps existing functions and adds listeners, so there are no in-place edits. Paste both files as they are, then add the build records (see "Build records").

**Done in Build 199**, with two fixes to the prototype that this handoff's checks missed (a revealed field's tab is now remembered, and Selection's link chips get their ends), and one small fix left for Build 200. See [`builder-handoff-build199.md`](builder-handoff-build199.md).

**Mockup (the target):** [`docs/mockups/builder-inspector-tabs-mockup.html`](mockups/builder-inspector-tabs-mockup.html). Every scene is a screenshot of the real Builder: fourteen with the block pair applied, and three "Today" scenes from Build 198. The screenshots are `docs/mockups/compare/inspector-tabs-*.png`.
**Tested first:** the block pair was appended to Build 198 and run. The results under "Check before uploading" come from that run.

## Why

**What Build 198's Inspector does** (reference topology, 1440 px):
- **A component is one long column.** "Component identity", "Connections" and a few type-specific cards come first. Everything else (pipeline sets, outbound handoff, reliability, owned stages, fleet management, user access) is folded into "Advanced settings and assurance". Open, a Universal Forwarder runs to 2,070 px and a load balancer to 2,400 px.
- **A selected link is titled with its target component.** Selecting Universal Forwarder 1 → Indexer 1 shows "Indexer 1", with Indexer 1's identity and connections. The link's own 31 controls are in a 1,280 px card at the end of Indexer 1's folded "Advanced settings".
- **Several selected shows the last one.** Shift-click two forwarders and the Inspector shows Universal Forwarder 2 only. Bulk edit is in Tools.
- **A container opened from Containers is also hidden.** The title stays on the last component, and the container's editor is inside the folded "Advanced settings".
- **Nothing selected:** docked, Build 197's topology summary. Below 1280 px the drawer shows a dead form: "No component selected", with Make root and Remove buttons that do nothing.
- **"Component capabilities"** (accepts data from, sends data to) appears only after a full redraw. Selecting a component by clicking it skips that block.

**A fault this also fixes:** in Free place layout, the alignment bar ("Arrange · 0 selected", align, distribute, Snap to grid) is appended to the toolbar row. At 1440 px it wraps to 85 px, overlaps the menu bar, squeezes Find and spills onto the canvas; at 800 px the page scrolls sideways. Build 197 had the same bar in its second row, where it spilled onto the canvas at 1440 px and scrolled the page sideways at 1024 and 800 px.

## The design

The Inspector shows one thing at a time (a component, a link, a selection, a container or the topology) and splits it into tabs, like draw.io's Format panel. The strip sits under the title.

### 1. What the Inspector shows

| Selected | Title | Tabs |
|---|---|---|
| One component | Its name and type, as now | Component, Connections, Settings, Fleet, Access (only those with content) |
| One link | "Event data link" (or Fleet management, Interactive authentication), then both ends: "Universal Forwarder 1 → Indexer 1". Each end opens that component. | Link, Assurance, Route |
| Two or more components or links | "2 components selected" | Selection |
| A container, opened from Containers after the last selection | "Container", its name and member count | Container |
| Nothing | "Topology", the diagram title and counts | Topology |

The component's own title, type, Make root and Remove show only for a component.

### 2. Component tabs

| Tab | Blocks |
|---|---|
| Component | Component identity (name, environment, region, container, network zone, subnet, instances, host); the Splunk-managed details; the Enterprise licensing and monitoring notes; cluster membership for an indexer or a search head cluster member |
| Connections | The connection list; Component capabilities (accepts data from, sends data to, fleet and access roles); the note on the three relationship planes |
| Settings | Pipeline sets, outbound handoff, reliability, owned stages, and every type-specific card: load balancer, SOAR playbooks, Stream capture, S3 and Azure datasets and connections, Edge Processor, the cluster cards of indexer and search head clusters |
| Fleet | Deployment client or deployment configuration; fleet management |
| Access | Interactive user access, identity, or the identity provider's settings |

Make root and Remove stay under every component tab.

**Which tabs show:** a tab shows when the component has something for it, so Fleet appears only for fleet-managed components and their managers. Across the 46 component types:
- 24 get Component, Connections and Settings;
- 15 add Access;
- 3 (Deployment Server and the Universal and Heavy Forwarders) get all five;
- 2 (the identity providers) get Component, Connections and Access;
- 2 (server class and deployment app) get Component, Connections, Settings and Fleet.

**Every control is in exactly one tab:** for each type, the controls that Build 198 shows with "Advanced settings" open are the same as the union of the tabs, with none in two tabs.

### 3. Link tabs

| Tab | Controls |
|---|---|
| Link | The authentication summary and its Set or Edit button; protocol / transport, endpoint, port, TLS, authentication required and type (with the hint), resource exchanged, activity supported, trigger, acknowledgement, direction |
| Assurance | The criticality, validation and availability chips; flow classification, flow criticality, operational owner, availability and latency SLOs, retry / replay policy, criticality, validation state, operational dependency, notes |
| Route | Connector routing: line style, avoid component cards, label offsets, waypoints |

Focus target and Disconnect stay at the bottom of every link tab. The fields are the same on all three planes.

**Insert a component on this link.** Build 198 offers "Insert component on selected connection" (`#insertOnSelectedEdge`) as the last row of the target's connection list, which a link no longer shows. When Build 198 renders that row (event data links), the title gets a "＋ Insert a component on this link" button under the label. It clicks the original, so the chooser, the change and its history entry are Build 198's. A fleet management or user access link has no button, as Build 198 has no row for it.

**Spacing:** every tab starts 12 px under the strip. The link card's top rule separates it from the authentication summary, which only Link shows, so Assurance and Route drop the rule and its padding.

### 4. Selection

- **The selected items**, as chips. A chip inspects only that item.
- **Bulk edit, moved here from Tools for good.** Tools now lists four tools. Edit › Bulk edit… is disabled until two or more are selected, with the note "Select two or more components or links first (Shift-click)". When enabled, it shows the Inspector and focuses bulk edit instead of opening Tools.
- **Align and distribute** (left, centre, right, top, middle, bottom; across, down), from the Free place alignment bar.
  - In other layouts they are disabled, with the note "Align and distribute work in Free place layout" and a "Use Free place layout" button.
  - In Free place they need two components to align and three to distribute.

### 5. Container

The container editor (name, boundary type, colour, description, Close editor, Remove group). It shows when a container is opened from Containers after the last selection. Selecting anything else closes the container, so one click on its chip opens it again.

### 6. Topology

Nothing selected:
- **Name:** the diagram title (`state.builderPresentation.title`), as the presentation pack's "Diagram title" sets it. The placeholder is the default title.
- **Contents:** components and links per plane, and the findings ("0 errors · 31 to review") with Review. The counts come from the Validate summary the toolbar uses, so Validate doesn't run again.
- **Validate:** Validate for.
- **Layout:** Layout, Group by and Tidy layout, as in the Arrange menu.
- **Grid:** Snap to grid and Grid spacing, from the Free place alignment bar, with the note "The grid applies when you move components in Free place layout."

### 7. The tab strip

- **It sticks under the panel header** while the Inspector scrolls.
- **The last tab chosen is remembered** for components and for links. A component without that tab opens on Component; the next one with it opens on it again.
- **Switching tab** scrolls back so the new tab starts 12 px under the strip.
- **Keyboard:** ← and → move between tabs and select them, as do Home and End. The strip is a `tablist` of `tab` buttons, with one selected and one in the tab order.
- **Fit:** the five tabs share the width. If they don't fit (an Inspector resized under 340 px, a 320 px phone, or wide fonts), the strip scrolls sideways and brings the selected tab into view when the tab, the tabs or the strip's width change. A strip scrolled by hand is left where it is.

### 8. Code that reveals a field

Inspecting a finding (`selectBuilderIssue(i, {edit:true})`) focuses the field it concerns: endpoint, TLS, owner, validation, name, region or environment. Build 198 opens "Advanced settings" so the field is visible. Now, anything that calls `focus()` or `scrollIntoView()` on an Inspector element in another tab switches to that tab first. Each finding tested focuses the same field as in Build 198, and the field is visible.

### 9. Free place toolbar

From 761 px, the alignment bar no longer shows in the toolbar. Its controls are in the Selection tab (align, distribute) and the Topology tab (grid). In Free place, the toolbar stays on one line and the page doesn't scroll sideways.

### 10. Unchanged

- **Every field and its behaviour.** The app's blocks stay where its renderers put them, apart from Bulk edit.
- **Phones:** the Inspector sheet gets the same tabs. With nothing selected, Build 198 dims the sheet and lets taps through to the canvas; that stays.
- **Focus canvas:** the Inspector overlay keeps its tabs.
- **The docked columns, the drawers below 1280 px, and every menu.**

## How the block works

For maintenance; the code is in the two prototype files.

- **Marking, not moving.** After each render, `markAll()` sets `data-it199` (the tab) on each block:
  - the children of `#builderInspectorBasic` and `#builderAdvancedBody`;
  - the children of `#builderInstanceInspector`, where the type-specific cards sit inside the identity card;
  - the link card's parts and the labels in its grid.

  Each container gets `data-it199-has`, the tabs it holds. One CSS rule per tab hides blocks of other tabs and containers without the tab. Blocks the script doesn't recognise go to Settings, so a new card from a later build always shows somewhere.
- **"Advanced settings and assurance"** is kept open in tab mode, and its summary and intro are hidden. Nothing in the app reads its open state.
- **Which tabs show:** a tab shows if one of its blocks has text and isn't hidden by the renderer (`style.display` or `hidden`).
- **What is selected** comes from `state` directly: `builderSelected`, `builderSelectedEdge`, `builderMultiSelected`, `builderBulkEdges` and `builderSelectedGroup`. The block doesn't call `selectedBuilderIds()`, which writes to `state`.
  - A link selection also lists its target in `builderMultiSelected` once `renderBulkSelection` runs. So Selection needs two components or two links.
  - The container view needs the container to be opened after the last selection change.
- **Keeping in step:** `renderBuilder` and `refreshBuilderSelection` are wrapped, and a `MutationObserver` watches the Inspector for added or removed nodes. Each of these schedules one sync per frame. The sync also renders "Component capabilities", which is memoised.
- **No forced layout.** The sync runs after every render, so it reads no layout and writes only attributes and properties that changed (an unchanged write still restyles the Inspector). Whether the tabs fit comes from a `ResizeObserver` on the strip and its tabs, and the strip's sticky offset from one on the panel header; both report after layout. Scrolling the strip to the selected tab waits for the next frame and reads layout only when the tabs overflow. An earlier version read the strip's width in every sync, which forced a layout of the page after each render and made the sync cost 6.8 ms a selection instead of 1.9 ms.
- **History:** like Build 198's menu bar, a control here that works through an existing control is recorded once, under that control's label. Examples: Layout, Group by and Validate for here, Tidy layout ("Auto-layout topology"), "Use Free place layout". The block wraps `commitBuilderHistory` with its own skip counter. Align and distribute call `alignSelectedComponents` and `distributeSelectedComponents` directly, and their entries are labelled from the change.
- **Bulk edit** is moved into the Selection tab once. `'builderBulkEdit'` is removed from `secondaryToolIds`, so `renderSecondaryTools` stops putting it back in Tools.
- **`HTMLElement.prototype.focus` and `Element.prototype.scrollIntoView`** are wrapped to switch tabs (section 8). They act only on elements inside the Inspector, and call the originals unchanged.
- **Edit › Bulk edit…** has a capture listener on its menu item, which runs before Build 198's own. Another listener, on the menu's `toggle`, sets the item's disabled state and note.
- **Build 197's empty state** (`dockEmpty197`) hides every Inspector child but its summary. Two rules with a doubled id override it for the Topology and Container views; the summary itself is hidden while the tabs are active.
- **The link card** (`#builderRelationshipInspector`) gets an inline `display:block` from its renderer, so the flex column that puts Focus target and Disconnect last uses `!important`.
- **Globals it uses:** `builderEscape`, `commitBuilderHistory`, `renderBuilder`, `refreshBuilderSelection`, `renderBuilderCapabilityInspector`, `builderEdgeRecord`, `builderGroupById`, `componentInstanceLabel`, `builderTraceEdges`, `defaultPresentationTitle`, `selectBuilderObjectFast`, `selectedBulkEdges`, `alignSelectedComponents`, `distributeSelectedComponents`, `resolvedUnifiedLayoutMode`, `openBuilderDrawer`, `openBuilderCanvasInspector`, `builderStatus`, `secondaryToolIds`, `state`.

## Build records

As Build 198 did, after the block pair:
- `changeRegister`, group "Explorer foundations":
  `['Inspector tabs','The Inspector shows one thing at a time in tabs: Component, Connections, Settings, Fleet and Access for a component; Link, Assurance and Route for a link, titled with both ends; Selection, with bulk edit and align, for several; Container; and Topology with nothing selected. The Free place alignment bar leaves the toolbar.',true]`.
- `#topologyBuilder` `data-build-number` 199 and `data-build-date`, the page title, and the ⓘ text prefix, with the date you build it.

## Not in scope

- **The Tools panel's other sections** (configuration draft, route validation, connection template, layout profiles) stay in Tools. Moving them is the next suggestion.
- **The fields themselves:** labels, order and styles inside each block are unchanged.
- **Phones with nothing selected:** the sheet stays dimmed and click-through, as in Build 198.

## Found while testing (not fixed here)

Two canvas faults, both in Builds 197 and 198. Neither involves the Inspector, so the block leaves them alone.

- **A container chip can cover a stage row.** A card whose chips wrap to a third row draws the third row over its first stage row. Put Universal Forwarder 2 (environment, then "Melbourne") in a container, and "Zone · Group 1" covers "Source acquisition". Cards whose chips fit in two rows, such as Universal Forwarder 1, are fine. The stage rows need to start below the last chip row.
- **A container's collapse button covers the start of its name.** On the canvas, `.unifiedGroupBox button` (`left:8px; top:-13px`) outranks `.builderGroupCollapseButton` (`right:7px; top:5px`), so both buttons sit at the left and "−" hides the first letters: "−dney · Region" for "Sydney". One rule fixes it: `.unifiedGroupBox .builderGroupCollapseButton{left:auto;right:8px}`.

## Check before uploading

All with the reference topology (`docs/mockups/ov1-reference-topology.json`) unless stated.

### 1. Regression

- 0 `pageerror` events in every check below, from 320 to 2560 px.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 198 on the default, reference and zones (`docs/mockups/sv-zones-topology.json`) topologies: 87 of 87.

### 2. Tools

- **`node tools/builder-space-check.js index.html`:** 7/7, with the same canvas sizes as Build 198 (594, 754, 1234 and 1874 px docked; 974, 1050 and 718 px below 1280).
- **`node tools/builder-connector-check.js index.html`:** the same output as Build 198: 20 of 66 lines flag "badge over label" on the small default topology, and scenarios 9 and 10 are all OK.
- **`node tools/builder-perf-check.js index.html`:** the same as Build 198 within this container's noise. Medians of five alternating runs (redraw, ms):

  | Topology | Build 198 | Prototype | Budget |
  |---|---|---|---|
  | default | 37 | 43 | 40 |
  | fan5 | 52 | 54 | 50 |
  | fan8 | 83 | 86 | 80 |
  | reference | 90 | 94 | 120 |

  Neither build met every budget in any run here (0 of 5 each), and Build 198's own medians moved by 5 to 38 ms between two series. The tool times `renderBuilder()` itself, where the block only requests a frame; its sync runs in that frame, so the next two measures cover it.
- **Main-thread time per selection change**, from Chrome's own counters (task, script, layout and style time), over a cycle of 60 changes (component, link, component, component, fleet link, nothing), each followed by two frames. Medians of five rounds, builds alternated:

  | Per selection change, ms | Task | Script | Layout | Style |
  |---|---|---|---|---|
  | Build 198 | 45.8 | 4.2 | 3.1 | 10.5 |
  | Build 198, "Advanced settings" kept open | 51.4 | 4.4 | 4.5 | 12.2 |
  | Prototype | 48.3 | 5.3 | 3.6 | 11.5 |

  The prototype does 2.5 ms more work than Build 198 as it opens, and 3 ms less than Build 198 with "Advanced settings" open. Open is the fair comparison, since that is where Build 198 keeps what the tabs show: a link's own fields, and Component capabilities on every selection. Thirty redraws with a component selected, each followed by two frames, gave 156, 164 and 159 ms in the same order.

- **CPU profile** of the same cycle on the prototype: the block's sync takes 1.9 ms per selection change, with everything it calls. Marking the blocks is 0.5 ms of that and the tab strip 0.3 ms. Its ResizeObserver callbacks add 0.05 ms. The wrapped `renderBuilder` and `refreshBuilderSelection` are left out of these figures, because they include the app's own work.

### 3. Completeness

- **Components:** each of the 46 types was added to the default topology and selected. The controls Build 198 shows (with "Advanced settings" open) equal the union of the tabs, each in exactly one tab, with Make root and Remove under every tab. The tabs per type are as listed in section 2.
- **Links:** on each plane, the link card's 31 controls are each in exactly one of Link, Assurance and Route; no component control shows; Focus target and Disconnect are on every tab.

### 4. Behaviour, at 1440 (docked)

| Step | Expected |
|---|---|
| Select Universal Forwarder 1 | Component, Connections, Settings, Fleet, Access; Component selected |
| Choose Access, then select Indexer 1 | Access (Indexer 1 has no Fleet tab) |
| Select Firewalls and network devices | Component (it has no Access) |
| Select Heavy Forwarder 1 | Access again |
| Focus the strip; →, End, Home, ← | Connections; Access; Component; Access (wraps) |
| Fleet tab, scroll the Inspector down | The strip stays under the panel header |
| Select the link Universal Forwarder 1 → Indexer 1 | "Event data link", "Universal Forwarder 1 → Indexer 1", Splunk-to-Splunk; Link, Assurance, Route |
| On Link, scroll down; choose Assurance, then Route | Each starts 12 px under the strip, with no rule above it |
| Click "Indexer 1" in the title | Indexer 1's component tabs |
| Select the link again; "＋ Insert a component on this link" | The insertion chooser opens, as from Build 198's "Insert component on selected connection" |
| Select a fleet management link | Link, Assurance, Route; no insert button |
| Inspect the findings "Endpoint is a component label…", "Relationship validation is review." and "Replace the generated component name…" | The same field as in Build 198 is focused and visible: endpoint (Link), validation (Assurance), name (Component) |
| One component selected, open Edit | Bulk edit… is disabled, with its note |
| Shift-click the two Universal Forwarders | "2 components selected", both as chips, bulk edit; Tools lists 4 tools |
| Edit › Bulk edit… | Focus moves to bulk edit in the Inspector; no menu or Tools left open |
| Set Environment to Test and apply | Both change; one history entry, "Set environment on 2 components" |
| Click a chip | That component alone |
| Select three components, not in Free place | Align and distribute disabled, with "Use Free place layout" |
| "Use Free place layout" | The layout is Free place; one history entry; align and distribute enabled; no alignment bar in the toolbar, which stays on one line |
| Align left | Their left edges line up |
| Nothing selected | Topology |
| Layout, Validate for and Group by here | The originals change; one history entry for the layout |
| Tidy layout | One entry, "Auto-layout topology" |
| Snap to grid, Grid spacing 40 px | `state` and localStorage as the Free place toolbar sets them |
| Name "Sydney telemetry" | The diagram title and the heading change |
| Open a container from Containers | Container: its name, member count and editor |
| Select a component | Its tabs; the container is closed |
| Click the container's chip | Container again |

### 5. Widths

| Width | Checked |
|---|---|
| 1280 (docked), 1024 and 800 (drawer) | Component with five tabs, Fleet, a fleet-management link, a selection, and Topology (with nothing selected, after opening the Inspector). The strip fits; no sideways scroll; no "No component selected" form or dead Make root / Remove |
| 400 (phone sheet) | The same, without the selection (Shift-click) |
| 1440, Focus canvas | The Inspector overlay keeps its five tabs |
| 1440, the strip narrowed to 210 px | The tabs overflow. End, Home and ← keep the selected tab in view; the next component opens scrolled to the remembered Access; a strip scrolled by hand stays put; narrowing it with Access selected brings Access into view |
| 320 (phone sheet) | Access is in view; the page doesn't scroll sideways |

The strip's sticky offset is the panel header's height less 14 px, and follows the header when it grows. Scrolled down the Fleet tab, the strip sits directly under the header.

### 6. Build 198's own checks

With Edit › Bulk edit… replaced by Edit › Connection template… where a test used it to open Tools, Build 198's checks all pass on the prototype: 69 of 69 menu actions, Esc on Tools and Containers at 1440, 1200 and 800, the Tools and Containers header, and the keyboard and focus checks.

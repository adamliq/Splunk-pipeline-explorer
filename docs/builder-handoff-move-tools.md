# Handoff: move the rest of Tools (four tools become drawer tabs)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 207.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="move-tools-v208-styles">`, containing [`docs/mockups/move-tools-prototype.css`](mockups/move-tools-prototype.css);
- `<script id="move-tools-v208">`, containing [`docs/mockups/move-tools-prototype.js`](mockups/move-tools-prototype.js).

**Four in-place edits,** all in the menu bar's script, listed under "The edits". Each old string occurs exactly once in Build 207. They are also in [`docs/mockups/move-tools.diff`](mockups/move-tools.diff), a unified diff against Build 207's `index.html`.

Paste both files as they are, make the four edits, then add the build records (see "Build records").

**Mockup (the target):** [`docs/mockups/move-tools-mockup.html`](mockups/move-tools-mockup.html). Seven scenes have the block pair and the edits applied to Build 207, and the five "Today" scenes are Build 207. The screenshots are `docs/mockups/compare/move-tools-*.png`.

**Tested first:** the block pair and the edits were applied to Build 207 and run. The results under "Check before uploading" come from that run.

## Why

### 1. The Tools panel scrolls sideways

**What you see,** on the reference topology:
- **At 1,440 px,** Edit › Connection template… opens Tools, a 600 px panel over the canvas. Each of its four tools is 853 px wide, so the panel scrolls sideways:
  - the connection template's target is cut off at the panel's edge;
  - its third column of fields, TLS and Owner, is past the edge.
- **Arrange › Layout profiles…** shows the layout profile's grid with a blank band. The profile's select sits at the edge, and the purpose and all five actions are past it.
- **At 1,024 px** the panel is 461 px wide and the tools 597 px. The connection template's heading gets a column 11 px wide, one letter per line.
- **Below 1,061 px** the profile bar hides Duplicate, Rename and Delete.

**The cause:**
- The four tools were built for the page's full width, before Tools existed. Their grids switch to narrower layouts at the window's widths (1,060, 900, 800 and 760 px), not the panel's:
  - the connection template's grid has six columns with minimum widths;
  - its fields have three more;
  - the layout profile's grid has eight.
- The Tools body is a one-column grid, so the column takes the widest tool's width, and route validation and the configuration draft stretch to it too.
- The menu bar's `openPanel` already works around this: it scrolls the panel back to its left edge, because "some sections are wider than the panel".

### 2. Two panels for one kind of thing

- **Six menu items open tabs in the Builder's drawer ("Inspect topology", 600 px):**
  - Validate › Coverage, Review and Rules;
  - Analyze › Inventory and Trace path;
  - Edit › History.
- **Four others open Tools instead,** a second floating panel in another place, with all four tools stacked:
  - Validate › Route validation…;
  - Analyze › Configuration draft…;
  - Edit › Connection template…;
  - Arrange › Layout profiles….
- The Inspector tabs handoff moved bulk edit out of Tools and named moving the rest as the next step.

### 3. Phones

- **More's Tools disclosure is out of date.** It still lists "Bulk edit · configuration · templates · layouts" and says "5 tools", though bulk edit moved to the Inspector in Build 199.
- **Opening it stacks all four tools,** 1,198 px of them: More's list grows from 872 to 1,981 px.

### 4. A fault this also fixes: the drawer closes at once after a card click

**What you see:** click a card, then open a drawer tab, for example:
- Validate › Review;
- the review pill;
- Analyze › Inventory.

The drawer opens and closes at once. A second try opens it. It happens at 1,440 and at 1,024 px.

**The cause,** in `<script id="builder-canvas-drawers-v95">`:
- A card click selects through `selectBuilderObjectFast`. Build 95 wraps it to open the Inspector, but doesn't record the selection in `lastDrawerSelection`.
- Build 95's `renderBuilder` wrapper opens the Inspector whenever the selection differs from `lastDrawerSelection`, and `openBuilderCanvasInspector` closes the drawer.
- `openBuilderDrawer` redraws. Its redraw is the first one after the click, so it takes the click for a new selection and closes the drawer it is opening.

With the four tools in the drawer, this would also hit Edit › Connection template… right after the source card is clicked, so it is fixed here.

## The design

### 1. Four new drawer tabs

| Tool | Tab | After | Opened by |
|---|---|---|---|
| Route validation | Routes | Rules | Validate › Route validation… |
| Configuration draft | Config draft | Trace | Analyze › Configuration draft… |
| Connection template | Templates | History | Edit › Connection template… |
| Layout profiles | Layouts | Templates | Arrange › Layout profiles… |

- **Ten tabs.** The drawer's tabs read Coverage, Review, Rules, Routes, Inventory, Trace, Config draft, History, Templates and Layouts.
  - They take as many columns as fit, each at least 86 px wide (72 px on a phone).
  - That makes two rows at 600 px, and three on a phone.
- **One tool per tab.** Each tab shows its tool alone. Each tool is the same element as in Tools, moved once: its renderer still finds it by id and redraws it in place.
- **The menu items are unchanged:**
  - their names and notes stay. Route validation… still gives the counts, and Configuration draft… still says "Select a component first" with nothing selected;
  - each opens its tab with the focus on the tab, as the drawer's other menu items do;
  - Esc closes the drawer and returns the focus to the menu.

### 2. Each tool fits the drawer

- **Headings.** Route validation's and the draft's summaries become headings, for example "Route validation · 0 errors · 15 review items" and "Configuration draft · Universal Forwarder 1". The template's and the profile's labels take the same style.
- **Route validation.** The list loses its own 240 px box; the drawer scrolls.
- **The configuration draft** is unchanged inside. Its .conf sections already wrap.
- **The connection template**, in this order:
  - the template, on its own row;
  - source → target;
  - the button;
  - the defaults;
  - the fields, in as many columns as fit (each at least 150 px), with Controls and the help line full width.
- **The layout profiles:**
  - the profile and its purpose side by side, each at least 260 px wide, so "Logical architecture" fits;
  - then all five actions, which wrap;
  - then the state and the help line;
  - Duplicate, Rename and Delete show at every width.
- **Nothing scrolls sideways** at 600 px, at 568 px (1,280 px windows), on a phone (343 px), or with the drawer dragged to its 300 px minimum.

### 3. What stays as it was

- **What each tool does:**
  - Create relationship makes the same link, with the same details and message;
  - the profile actions give the same profiles;
  - the route issues and the drafts are the same.
- **Clicking a route issue** selects its component and, as a Review item does, closes the drawer to show the component in the Inspector. In Tools, the panel stayed open.
- **The drawer's other six tabs.**

### 4. The Tools panel

- **From 761 px up it's gone.** Nothing opens it now, and the block hides it even if its saved open state says open.
- **`secondaryToolIds` is emptied,** so `renderSecondaryTools` puts nothing back.
- **Phones (below 761 px) keep More's Tools disclosure:**
  - it now reads "Route validation · configuration draft · templates · layouts";
  - it has a button for each tab, and each button closes More and opens its tab;
  - the stale "5 tools" count is hidden.

### 5. The drawer after a card click

- **Opening the drawer records the current selection** in `lastDrawerSelection` first, so its own redraw doesn't take an earlier click for a new selection.
- **A selection made while the drawer is open** still closes it and shows the Inspector, as before.

## The edits

All four are in `<script id="builder-menubar-v198">`. Each `run` now opens the tool's drawer tab instead of Tools.

**1. Line 12154, Edit › Connection template….**

Old: `openPanel('builderSecondaryTools','builderTemplateBar')`
New: `openBuilderDrawer('templates')`

**2. Line 12176, Arrange › Layout profiles….**

Old: `openPanel('builderSecondaryTools','builderProfileBar')`
New: `openBuilderDrawer('layouts')`

**3. Line 12185, Validate › Route validation….** Its `note` is unchanged.

Old: `openPanel('builderSecondaryTools','builderRoutePanel')`
New: `openBuilderDrawer('routes')`

**4. Line 12190, Analyze › Configuration draft….** Its `note` is unchanged.

Old: `openPanel('builderSecondaryTools','builderConfigDraft')`
New: `openBuilderDrawer('draft')`

## How the block works

**The script** runs once, after the drawer (`builder-ui-v86`), Build 163's Trace and History tabs and the menu bar exist.

- **For each tool:**
  - it removes the tool's id from `secondaryToolIds`;
  - it marks the tool `.mtPanel208`, hides it and moves it into the drawer's body. Route validation and the draft are `<details>`, so it opens them, and route validation's renderer keeps that open state;
  - it adds the kind to `drawerKinds`, as Build 163 did for Trace and History;
  - it adds a tab button after its neighbour, which calls `openBuilderDrawer(kind,false)`.
- **`setDrawerFlags` is wrapped** to show the open tab's tool and hide the other three.
- **`openBuilderDrawer` is wrapped** to record the selection in `lastDrawerSelection` before it runs (the card-click fault).
- **More's Tools disclosure** gets its new line and a `.mtLaunch208` row of four buttons. Each closes More and calls `openBuilderDrawer(kind)`.

**The styles:**
- hide `#builderSecondaryTools` from 761 px up, and its count everywhere;
- lay out the drawer's tabs with `auto-fill`;
- hide a tool's `[hidden]` element in the drawer;
- turn the summaries into headings;
- re-lay out the template and the profile bar, scoped to `#builderInspectorDrawer`, so their old rules elsewhere don't apply.

## Build records

After the block pair:
- **`changeRegister`,** group "Explorer foundations":
  `['Tools in the drawer','Route validation, the configuration draft, the connection template and the layout profiles are tabs in the Builder’s drawer, beside Review, Rules, Inventory, Trace and History, and the menus open them there. Each fits the drawer at every width, so nothing scrolls sideways, and the Tools panel is gone; on phones, More › Tools opens the four tabs. The drawer no longer closes at once when it is opened right after a card click.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix,** as Build 207 did in `five-fixes-records-v207`, with Build 208.

## Found while testing (not changed)

1. **On a phone, a long component name is cut inside the template's source and target selects,** for example "Universal Forwarder 2". The select shows the whole name when opened.
2. **The drawer's title is still "Inspect topology,"** though Templates and Layouts change the topology. A wider title, such as "Topology tools", would fit all ten tabs.

## Check before uploading

### 1. The design: 37 checks, all pass

| Check | Result |
|---|---|
| The drawer's tabs | Ten, in the order above |
| Where the tools are | All four in the drawer, none in Tools; `secondaryToolIds` empty |
| The four menu items, at 1,440 (docked) and 1,024 px (drawers) | Each opens its tab, with that tool alone and the focus on the tab; no Tools panel |
| The menu notes | Route validation… "0 errors · 15 review items"; with nothing selected, Configuration draft… "Select a component first", and the tab says what to select |
| Esc | Closes the drawer; the focus goes back to Edit in the menu bar |
| The other six tabs | Coverage, Review, Rules, Inventory, Trace path and History open from their menus, and show none of the four tools |
| Switching tabs | One tool at a time |
| No sideways scroll | Each of the four tabs fits at 1,440, 1,280, 1,024, 800 and 390 px, and with the drawer dragged to 300 px; the page doesn't scroll sideways |
| 1,024 px | All five profile actions show |
| 800 px | The Tools panel stays hidden even when its open state is set |
| 390 px | No menu bar; More › Tools lists the four; each button closes More and opens its tab, which fits |
| Routes, against Build 207 | The same 15 issues. Clicking one selects the same component, and the drawer closes, as a Review item does on Build 207 |
| The configuration draft, against Build 207 | The same draft for a component, a link and nothing; it follows the selection while the tab is open |
| Templates, against Build 207 | Universal Forwarder 2 → Indexer 1 with port 9998 and an owner: the same link, selection, details and message; Undo removes it. Port 70000: the same refusal, and no link |
| Layouts, against Build 207 | Switching to Physical deployment, Save view, + New, Rename, Duplicate and Delete give the same profiles, step by step; the tab stays open |
| Another topology | After loading the zones topology and adding a component, the tools are still in the drawer, and Routes lists the new issue |
| The card-click fault, at 1,440 and 1,024 px | After a card click, Validate › Review, Edit › Connection template…, Analyze › Inventory and the review pill each open the drawer at the first try. Build 207 closed it at once |
| Page errors | None |

### 2. The earlier handoffs' checks

- The five fixes: 49 of 49.
- The small fixes: 44 of 44.

### 3. Regression against Build 207

- **0 `pageerror` events** in every check.
- **Every view's text:** 97 of 97 views the same.
- **The OV workspace pages and Validate:** 87 of 87 the same.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 58 of 58.
- **The menu bar's 69 actions:** 69 of 69, with the same output as Build 207. Its checks of the four moved items find each tool shown, now in the drawer.
- **The Parsing laboratory's examples:** 68 of 68.
- **The canvas chips and container names:** all 123 card views the same, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output as on Build 207.

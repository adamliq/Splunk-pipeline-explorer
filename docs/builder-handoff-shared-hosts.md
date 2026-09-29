# Builder handoff: components that share a host (co-location)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** `main` at `e81ca6b` (Build 146, up to `builder-route-clarity-v146`). The next block is **`builder-shared-hosts-v147`** (or the next free number).
**Mockup:** `docs/mockups/builder-shared-host-mockup.html` (open it in a browser: switch between Expanded and Collapsed hosts, click a host header, hover a role card). Screenshots: `docs/mockups/compare/shared-host-expanded.png` and `shared-host-collapsed.png`.
**Status:** a new feature; nothing in Build 146 models hosts (no `hostId`, no host UI).

## The problem

A common small-estate design runs several Splunk roles on one instance, for example a **Heavy Forwarder that is also the Deployment Server**, or **License Manager + Monitoring Console** on one management host. Today the Builder can only draw these as unrelated cards. The only co-location it knows is hard-coded text about the Syslog daemon handing a file to "the co-located Universal Forwarder". So the canvas, the pack, the inventory and the review rules can't say that two roles share a machine, or check whether they should.

## The design in one paragraph

Add a **host** record and an optional `hostId` on each component.
- **Expanded:** components with the same `hostId` are drawn inside a **solid-bordered host box** with a header (server icon, host name, "2 roles · 8 vCPU", a caret). Each role keeps its own card, inspector and connectors.
- **Collapsed:** a host folds into **one combined card** ("Heavy Forwarder + Deployment Server") that lists its roles, with their lines merged onto it.

A host inspector shows the host's name, region, size, roles and **co-location checks**. Hosts are different from the existing group containers (Trust zone, Network, Region, Data centre, Cloud tenant, Service boundary): **groups describe where things are; a host says they're the same machine.** A host can sit inside a group.

---

## 1. Data model

```js
// new top-level state, saved with the topology
state.builderHosts = [ {
  id: 'host-1',             // stable id
  name: 'splunk-hf01',      // editable, unique within the topology
  region: 'Sydney',         // defaults to the members' common region
  vcpu: 8, memoryGb: 16,    // optional
  collapsed: false          // view state, saved per topology
} ];
// on each component (state.builderNodes[i])
node.hostId = 'host-1';     // optional; absent = runs on its own
```
- A host needs **two or more members**. When it drops to one (a member removed or moved), delete the host and clear `hostId` on the last member, with a toast: "splunk-hf01 removed: only one role left".
- Deleting a component removes it from its host by the same rule.
- **Undo and Redo cover every host change** (create, rename, add or remove a member, collapse is *not* an undo step; it's view state).
- Include `hosts` and `hostId` in `topologyDocument()`, layout profiles and bookmarks; restore them in `loadTopologyDocument()`. Older files without hosts load unchanged.
- A group container can contain a host box; a host's members must all be in the same group (moving a host moves all its members; putting one member in another group asks "Move the whole host?").

**Check:** create a host, save, reload, and export → re-import: hosts, members and `collapsed` are identical. Undo after creating a host removes it; Redo restores it.

## 2. Canvas: expanded host box

As in the mockup's "Expanded hosts" view:
- **Box:** 1.5px **solid** border (a new token `--host`, a muted steel blue, distinct from the dashed group boxes and the plane colours), about 7% tint fill, 11px radius, 14px padding around the member cards.
- **Header (34px):** server icon, the host name in mono, "2 roles · 8 vCPU" in muted text (cut off with "…" if needed; full text in `title`), and a caret on the right. The header is a button: `role="button"`, `aria-expanded`, and Enter/Space toggles collapse. A single click selects the host (the host inspector opens); a click on an already-selected header, or on the caret, toggles collapse.
- **Member cards:** stacked vertically inside the box with a 12–16px gap, in tier order (forwarding, then management), and **unchanged** otherwise (same size, chips, handles and badges).
- **Connectors stay per role:** data lines attach to the Heavy Forwarder card and phone-home lines to the Deployment Server card. The connector router must treat the host box as an obstacle for lines that **don't** belong to its members (they route around it) and as transparent for its own members' lines.
- **Local links:** a relationship between two members of the same host (for example the Deployment Server managing its own host's Heavy Forwarder, or the syslog → UF file handoff) is drawn as a **short dotted link inside the box**, labelled "local", and never leaves the box.
- **Layout:**
  - In auto and horizontal layout, the host box takes the column of its **earliest-tier** member, and the other members stack under it.
  - In free layout, dragging the header moves the whole host; dragging a member card inside the box reorders it; dragging it out asks "Remove from splunk-hf01?".
  - **Group by → Tier lanes:** a host sits in the lane of its earliest-tier member, with a small "also: Management" chip on the header.
  - **Group by → Component type:** members are counted in their own type but drawn in the host.

**Check:** with the mockup's topology (HEC Client, Heavy Forwarder + Deployment Server on `splunk-hf01`, two UFs, an Indexer, License Manager + Monitoring Console on `splunk-mgmt01`), extend `tools/builder-connector-check.js` with a scenario 10 "shared host" and make it pass:
- every line starts and ends on its own card;
- no non-member line crosses a host box;
- the local link stays inside its box;
- no label covers a card.

## 3. Canvas: collapsed host (combined card)

As in the mockup's "Collapsed hosts" view:
- The host box becomes **one card** of the host box's width:
  - the same header (caret ▸);
  - a title joining the role names with "+" ("Heavy Forwarder + Deployment Server"; for 3+ roles: "Heavy Forwarder + 2 roles");
  - one row per role: a plane-colour square, the role name, and a muted summary ("HEC 8088 · 2 pipeline sets", "3 clients · server classes");
  - a local-link note in the management colour ("local: Deployment Server also manages this host's Heavy Forwarder").
- **Lines:** every member's lines attach to the combined card; lines with the same far end and plane **merge** into one with a count badge (×2), as Group by → Component type already does. Local links disappear from the canvas (they're in the note).
- **Hover or focus on a role row** highlights that role's lines and dims the rest, as on the expanded cards.
- **Toolbar:** a Navigate-menu item "Hosts: Expand all / Collapse all"; the mockup's segmented "Expanded hosts | Collapsed hosts" control shows the idea.
- **Mobile default:** hosts start collapsed on phones (like "types with 3+" in Group by).

**Check:** collapse `splunk-hf01`: one card, two role rows, the local note present; HEC → card, card → Indexer and card → UF1/UF2 lines all attach to the combined card; `splunk-mgmt01` collapsed shows one line to the Indexer with a ×2 badge. `builderHistory.past` length is unchanged by collapse or expand.

## 4. Creating and editing hosts

Three ways, all ending in the same `builderCreateHost147(nodeIds)`:
1. **Select two or more cards** (Shift-click or box-select) → "Put on one host" in the Build menu and in the card right-click menu. Disabled with a tooltip when fewer than two are selected.
2. **Alt-drag a card onto another card** (without Alt it's still a data connection, as today). While Alt is held over a valid target, show a host-box outline preview and the hint "Release to put on one host".
3. **Inspector → Component identity → "Host":** a dropdown with "Runs on its own", the existing hosts, and "New host with…" (then pick the other card).

The new host's name defaults to `splunk-<first role short name>01` (hf, ds, lm, mc, idx, sh…), made unique. The host inspector (below) renames it.

**Host inspector** (select a host header), as in the mockup's right column:
- Host name, Region (defaults to the members' common region, otherwise "Mixed" with a warning), Size (vCPU, memory; optional);
- Roles on this host: a list with each role's card name; click to select that card; a remove (×) per role;
- **Checks:** the co-location results (item 5), each with OK / WARN / FLAG and one line of reason;
- "Collapse to one card" / "Expand host" and "Remove host (keep components)".

**Check:** all three creation paths produce the same host; Alt without a valid target does nothing; the dropdown shows existing hosts; renaming the host updates the header, the inventory and the pack.

## 5. Co-location rules (review findings)

Add these to `evaluateArchitectureRules()` (one finding per host that breaks a rule), shown on the host inspector and in Review findings. Use the mockup's table as the reference:

| Roles on one host | Result | Finding text (short) |
|---|---|---|
| Heavy Forwarder + Deployment Server | OK; **WARN above 50 deployment clients** | "Deployment Server on splunk-hf01 serves 63 clients; above 50, move it to its own host." |
| License Manager + Monitoring Console | OK | none |
| Deployment Server + License Manager | OK; WARN above 50 clients | as above |
| Syslog Server + Universal Forwarder | OK | none (the local file handoff) |
| Deployment Server + Indexer or indexer-cluster peer | **FLAG** | "Deployment Server shares a host with an indexer; configuration pushes compete with indexing, and peers are managed by the cluster manager." |
| Monitoring Console + search head cluster member | **FLAG** | "Monitoring Console isn't supported on a search head cluster member." |
| Indexer Cluster Manager + one of its peers | **FLAG** | "Cluster manager and a peer share splunk-idx01; losing the host loses both." |
| Search head cluster deployer + a cluster member | **FLAG** | "The SHC deployer must not run on a cluster member." |
| Two roles that listen on the same port | **FLAG** | "Two receivers on 9997 on splunk-hf01." (compare the members' receiving ports from their relationship details: S2S receivers, HEC inputs and syslog listeners; management 8089 is shared by one splunkd and is fine) |
| Any roles, host size set | **WARN** when the members' pipeline sets exceed the host's vCPU guidance, or expected ingest exceeds the capacity model | "splunk-hf01: 4 pipeline sets on 4 vCPU." |
| Members in different regions | **WARN** | "splunk-hf01 has roles in Sydney and Melbourne; one host has one location." |

Keep the thresholds in one table (`builderHostRules147`) so they're easy to change.

**Check:** build each FLAG combination in a scratch topology: each produces exactly one finding with the text above; the OK combinations produce none; the Deployment Server client warning appears at 51 clients and not at 50.

## 6. Everywhere else

- **Inventory (`builderInventoryRows`):** add a **Host** column; members of one host are adjacent, with the host name spanning them (or repeated in a muted style).
- **Architecture pack:**
  - the component table gains the Host column;
  - the deployment section lists each host with its roles and size;
  - the diagram pages draw hosts as on the canvas, using the collapse state saved with the topology.
- **OV-1:** a host with members in one zone draws **one card** with both icons and the joined title; members in different zones stay separate cards joined by a "same host" dotted tie.
- **OV-2 / OV-3:** roles stay in their own operational nodes (they do different jobs). "Realised by" says "Deployment Server (on shared host splunk-hf01)". A flow between two members of one host is **internal** (see `builder-handoff-build141.md` item 2: no needline, marked internal in the tables).
- **Search (Find & navigate):** host names are searchable; selecting a result selects the host.
- **Mobile:** hosts collapse by default; the host inspector opens as the bottom sheet.

## 7. Performance and accessibility

- The host box and header are rendered with the cards (one DOM element per host), not as an SVG overlay, so they zoom and select like cards.
- Screen readers: the host header's accessible name is "Host splunk-hf01, 2 roles, expanded"; member cards get "on host splunk-hf01" in their description.
- Keyboard: Tab reaches the host header before its members; Enter toggles collapse; Shift+F10 opens the host menu.

---

## Acceptance
1. Recreate the mockup's topology in the Builder (or load it from a JSON file you add as `docs/mockups/shared-host-topology.json`): expanded and collapsed views match `shared-host-expanded.png` and `shared-host-collapsed.png` in kind.
2. Connector scenario 10 (item 2) passes in expanded and collapsed views, in auto and free layout, and in Group by None / Tier lanes / Component type.
3. The rules in item 5 give exactly the findings listed.
4. Hosts survive export → re-import, layout profiles and Undo/Redo; older topology files load unchanged.
5. Inventory, pack, OV-1 and OV-2/OV-3 show the host as in item 6.
6. The usual checks still pass: 0 `pageerror` events at all widths, the button and grouping sweeps, `tools/builder-space-check.js`, and the header check from the Build 141 handoff.
7. Add a `changeRegister` entry: "Shared hosts: put several roles on one Splunk instance, draw them in one host box, and check the combination."

# Builder handoff: add SV-3, SV-5b and CV-7 (systems matrix, activity traceability, service mapping)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** a build that has both of these, in either order:
- SV-1, SV-2 and SV-6 ([`builder-handoff-sv1-sv2-sv6.md`](builder-handoff-sv1-sv2-sv6.md)), for `builderSystemModel1xx()`;
- OV-5a, SvcV-5 and CV-6 ([`builder-handoff-ov5a-svcv5-cv6.md`](builder-handoff-ov5a-svcv5-cv6.md)), for `builderActivityModel1xx()` and the CV-6 map.

Add one block, `<script id="builder-sv3-sv5b-cv7-v1xx">`, with wrappers. Also make one in-place addition to SvcV-4's status function (section 4).

The three views only combine models those builds already define, so they add no catalogue of their own. AV-1 and AV-2 pick them up with no change there. In AV-1's registry, give each a row:

| View | Viewpoint | Name | Answers | Content |
|---|---|---|---|---|
| SV-3 | Systems | Systems-Systems Matrix | Which systems have interfaces with which? | Generated |
| SV-5b | Systems | Operational Activity to Systems Traceability Matrix | Which systems carry out each activity? | Generated |
| CV-7 | Capability | Capability to Services Mapping | Which services does each capability need? | Generated |

**Mockups (the targets):**
- [`docs/mockups/architecture-sv3-mockup.html`](mockups/architecture-sv3-mockup.html), screenshot `docs/mockups/compare/sv3-mockup.png`;
- [`docs/mockups/architecture-sv5b-mockup.html`](mockups/architecture-sv5b-mockup.html), screenshot `docs/mockups/compare/sv5b-mockup.png`;
- [`docs/mockups/architecture-cv7-mockup.html`](mockups/architecture-cv7-mockup.html), screenshot `docs/mockups/compare/cv7-mockup.png`.

SV-3 and SV-5b switch between two examples:
- the reference topology (`docs/mockups/ov1-reference-topology.json`);
- the zoned example with a syslog load balancer (`docs/mockups/sv-zones-topology.json`).

CV-7 switches between the reference topology and the default topology.

The data was exported from Build 187 with the SV and OV-5a prototypes and the rules below, so the numbers are the expected ones. These mockups replace the Build 167 ones, whose marks were fixed text.

## What the three views are

- **SV-3 · Systems-Systems Matrix.** Every pair of systems that has an interface, in one grid. Rows send and columns receive. Each cell names the SV-1 interface and shows its status.
- **SV-5b · Operational Activity to Systems Traceability Matrix.** Systems by OV-5a activities. Each cell lists the parts the system takes part in, coloured by **the system's own share**. So a forwarder with no output shows as blocked even when another forwarder in the same part works.
- **CV-7 · Capability to Services Mapping.** CV-2 capability parts by SvcV-1 services. Each cell lists the SvcV-4 functions that service carries out for the capability, and the row says whether every service it needs is deployed.

**They are all derived. They add no saved state** apart from their pack switches.

## Where they go

Follow the SV-1, SV-2 and SV-6 pattern.

| Step | SV-3 | SV-5b | CV-7 |
|---|---|---|---|
| Section key | `sv3` | `sv5b` | `cv7` |
| Tab | "SV-3 · Systems matrix", after "SV-2 · Resource flows" | "SV-5b · Activity traceability", after SV-3 | "CV-7 · Service mapping", after "CV-6 · Activity mapping" |
| Active key | Add each key to `builderOvShow135`, keeping every existing key | | |
| Pack | After SV-2 | After SV-3, before SV-6 | After CV-6 |
| Pack checkbox | "SV-3 systems matrix", after SV-2's | "SV-5b activity traceability", after SV-3's | "CV-7 service mapping", after CV-6's |
| `packSections` key | `sv3`, default `true` | `sv5b`, default `true` | `cv7`, default `true` |

**Page furniture,** as on SV-1:

| | SV-3 | SV-5b | CV-7 |
|---|---|---|---|
| Viewpoint | Systems · DoDAF V2.0 | Systems · DoDAF V2.0 | Capability · DoDAF V2.0 |
| Owner field | "System owner", from `state.builderCv1.owner` | as SV-3 | "Capability owner", from `state.builderCv1.owner` |
| Banner label | Systems architecture · SV-3 | Systems architecture · SV-5b | Capability architecture · CV-7 |
| Footer, left | "<architecture> · Interfaces and their status from SV-1" | "<architecture> · Systems from SV-1 · Activities from OV-5a · Functions and their status from SvcV-4" | "<architecture> · Capabilities from CV-2 · Activities from CV-6 · Services from SvcV-1 · Functions from SvcV-4" |
| Footer, right | `SV-3 · 1 of 1 · Build <n>` | `SV-5b · 1 of 1 · Build <n>` | `CV-7 · 1 of 1 · Build <n>` |

Take each purpose line from its mockup. Use Build 185's singular forms at a count of one.

**Colours:** use the OV theme tokens, as SV-6 does.
- **SV-1 status tone** (SV-3):
  - ok (Declared, Local): `--ok` tint;
  - review (Plaintext, Port not set, Add to topology): `--review` tint;
  - stop (Missing output): `--stop` tint.
- **Planes** (SV-3 cell edges): event data `--ovData`, management `--ovMgmt`, authentication `--ovAuth`.
- **A system's share** (SV-5b): Takes part `--ok`, Limited `--review`, Blocked `--stop`.
- **SvcV-4 function status** (CV-7): as on SvcV-5. Realised `--ok`, Partly realised `--review`, Planned `--sel`, Not realised `--stop`.
- **Not deployed services** (CV-7): hatched columns.
- **Capability groups** (CV-7): CV-2's domain colours.

**Layout:**
- The page never scrolls sideways. Each matrix scrolls inside its own box, with the row headers sticky on the left.
- At 1288px the three matrices fit without scrolling. SV-3 fits 20 systems at 42px a column, and CV-7 fits 16 services with the service names set vertically.

**View chips** open their tab with `builderOvShow135(key)`. In print they are plain text.

## 1. SV-3 · Systems-Systems Matrix

### 1.1 Order and numbers

1. Sort the SV-1 systems:
   - by tier column;
   - then by rank, the index of the first interface touching the system, with systems that have no interface last;
   - then by node id.
2. Group them by location, taking locations in order of their first system. Within a location, keep the order from step 1.
3. Number the rows 1 to n. Column numbers are the same.

The numbers are for display only. They aren't IDs, and they aren't saved.

**Reference order:**
- **Sydney:** 1 Firewalls and network devices, 2 Windows Event Log 1, 3 Syslog Server 1, 4 Universal Forwarder 1, 5 Heavy Forwarder 1, 6 Deployment Server 1, 7 License Manager 1, 8 Monitoring Console 1.
- **Melbourne:** 9 Syslog Source 2, 10 Syslog Server 2, 11 Universal Forwarder 2.
- **AWS ap-southeast-2:** 12 AWS Lambda 1.
- **Security operations:** 13 Administrator 1.
- **Multisite:** 14 Indexer 1, 15 Search Head 1.
- **Cloud:** 16 SOAR Cloud, 17 Authentication Provider · Cloud 1.

### 1.2 Cells

- Each SV-1 interface goes in the cell of its `from` row and `to` column. Several interfaces in one cell stack.
- **Chip:**
  - the SI ID, filled with its SV-1 status tone, with a left edge in its plane colour;
  - a dashed border in `--review` when inferred, or in `--stop` when missing;
  - title "SI-n · <from> → <to> · <status>".
- The diagonal is hatched.
- A missing interface with no target (with more than one indexing system) goes in an extra **No target** column. Show that column only when such an interface exists.
- **Out** closes each row and **In** closes each column: interface counts, or "·" for none.
- A system with no interface has a muted row header.

**Header:** a corner cell "From ↓ · to →", location group headers over the column numbers, and the numbers as buttons.

### 1.3 Summary

The summary shows, in order:
- systems;
- interfaces;
- "% of pairs connected": distinct `from` and `to` pairs with a target, divided by n × (n − 1), to one decimal place;
- "cross a location": interfaces whose two ends are in different locations;
- "need attention": interfaces whose status tone isn't ok;
- "system(s) with none", when any.

### 1.4 Detail panel

The panel sits below the matrix, in two columns.

**Nothing selected:**
- Left:
  - "Matrix";
  - "m interfaces in n(n − 1) possible pairs";
  - "x need attention, and k system has none.";
  - the hint.
- Right:
  - "Needs attention": each as status chip and "SI-n · from → to";
  - then a "No interfaces" chip with each unconnected system.

**A system** (a row header or a column number):
- Left:
  - "System n · <component>";
  - the name;
  - "location · segment · owner";
  - "x out, y in."
- Right:
  - "Sends" and "Receives": each as ID chip, the other system, and "protocol · status";
  - "See": SV-1 and SV-5b.

Its row and column are highlighted.

**An interface:**
- Left:
  - "Interface · <plane> · <source>";
  - "SI-n · from → to";
  - the status chip;
  - for a declared interface, **Edit link in the Builder**, which runs `switchView('builder')` then `selectBuilderEdge(plane, id)`, as SV-1 does.
- Right:
  - Protocol;
  - Port, or Not set with the usual port;
  - TLS;
  - Carries;
  - Crosses: "Sydney → Multisite", or "No, within Sydney";
  - OV-3 flow;
  - SvcV-6 flows;
  - "See": SV-1, SV-2 and SV-6.

The interface's cell is outlined, and its row and column are highlighted.

Esc clears the selection.

### 1.5 Interfaces by location

- A grid of locations by locations, counting the interfaces that have a target.
- Shade each cell by its count relative to the largest.
- Show "·" for none.

### 1.6 Most connected systems

The top six systems by interfaces in and out, with ties broken by number.

**Columns:**
- #;
- System;
- Out, In and Total;
- "Of which need attention": each distinct status label with "×n", or None.

### 1.7 Findings ("What the matrix shows")

1. **Hub** (gap): the most connected system.
   - "**<name> is in n interfaces** (x in, y out), and m of them need attention."
   - When every one of them needs attention, write "and all of them need attention". When none do, end after the bracket.
2. **Dead ends** (stop): systems with a missing interface out and no declared event-data interface out.
   - "**<names> only send(s) through missing interfaces** (<IDs>). It receives / They receive data, but it reaches no indexer."
3. **Empty** (gap): "**<names> has an empty row and column / have empty rows and columns.** It has / They have no interface."
4. **Inferred** (gap): "**<IDs> is/are inferred:** other views need it/them, but the topology has no link. Add the link so its/their port and TLS are recorded."
5. **Locations** (neutral): "**k of m interfaces cross a location.** <from> → <to> carries the most (c). Each crossing needs a network path and a firewall rule (SV-2)."
6. **Direction** (neutral): "**Rows follow the SV-1 arrow.** For phone-home and licence reporting, the receiving system opens the connection; SV-2 lists the direction firewalls need."

## 2. SV-5b · Operational Activity to Systems Traceability Matrix

### 2.1 Rows and columns

- **Rows:** the SV-1 systems, in SV-3's order (1.1), under location rows.
- **Columns:** A1 to A9, from `builderActivityModel1xx()`. Each is a button with the ID and name.

### 2.2 Who takes part

These are the systems OV-5a counts as performers (OV-5a handoff 1.4), part by part:
- **An A1 part:** each source of the part's types.
- **A part built from functions:** each provider of a deployed service, for the part's functions that aren't Planned.
- **People:** `authUser` systems take part in A6.1 and A9.2 when the part is Supported or Partly supported.

### 2.3 The system's own share

Work out a share for each part a system takes part in.

**A1 part:**
- Takes part when the source is collected.
- Otherwise Blocked: "<name> isn't collected: it has no interface (SV-1)."

**People:**
- Takes part when the part is Supported.
- Limited when it is Partly supported: "<part ID> <name> is partly supported (<the part's reason>)." The part's reason is OV-5a's: its first function that falls short, as "<ID> <name>: <reason>".

**Functions.** Take each of the part's functions that the system provides:

| The function | Its share for this system | Reason |
|---|---|---|
| Realised | Takes part | |
| Names systems (section 4), and this system is one of them | Blocked | "<ID> <name>: <the text for this system>", plus " (<SI IDs> missing)" when SV-1 has missing interfaces from this system |
| Names systems, but not this one | Takes part | (someone else's shortfall) |
| Names no system | Its own status: Partly realised gives Limited, Not realised gives Blocked | "<ID> <name>: <reason>." |

When a function that names no system carries `flow` (section 4) and the reason says the interface is inferred, name the SV-1 interfaces instead. Use the inferred interfaces at this system whose SvcV-6 flows include that flow: "<ID> <name>: SI-16 is inferred; add the link to the topology."

The part's share is the worst of these: Blocked, then Limited, then Takes part.

**A cell** is one system in one activity. It shows its parts as chips coloured by share, each with the title "<part> <name> · <share> · <reasons>". The cell's status is the worst of its parts.

### 2.4 Summary

The summary shows, in order:
- systems;
- activities;
- assignments: cells;
- without limits;
- limited;
- blocked;
- systems with a blocked share.

### 2.5 Matrix

- **Row header:** the name, with the component beneath.
- **Status column:** "No activity" (muted), "n blocked" (stop), "n limited" (review), or "OK".
- **Footer, "Systems without limits":** "x of y" per activity. Here x is the systems whose cell takes part without limits and y is the systems with a cell.
- **Selecting:** a system, an activity or a cell, as on SvcV-5.
- **Legend:** the three share chips, then "Cells list OV-5a parts; the colour is this system's own share. Select a system, an activity or a cell. Esc clears."

### 2.6 Detail panel

The panel sits above the matrix.

**Nothing selected:**
- Left:
  - "Taking part today";
  - "x of n assignments without limits";
  - "An assignment is one system in one activity. Its colour is the system's own share, not the activity as a whole.";
  - the hint.
- Right: "Blocked" and "Limited", each listing system, part name and reasons.

**An activity:**
- Left:
  - "Operational activity · OV-5a";
  - "<ID> · <name>";
  - the description;
  - "x of y systems take part without limits."
- Right:
  - "Systems": each with its share, its parts and reasons;
  - "See": OV-5a and SvcV-5.

**A system:**
- Left:
  - "System · SV-1 · <location>";
  - the name and component;
  - "Takes part in n activities."
- Right:
  - "Activities": each with its parts, shares and reasons. When there are none, write "None. It provides no service function an activity needs.";
  - "See": SV-1, SV-3 and OV-5a.

**A cell:**
- Left: the activity, the system, its component and location, and the cell's status.
- Right:
  - "Its share (OV-5a parts)";
  - "Functions it provides (SvcV-4)", with each function's share;
  - "See": OV-5a, SvcV-4 and SV-1.

### 2.7 Findings ("What the matrix shows")

1. **Blocked** (stop): "**n systems have a blocked share:** <name (parts)>, … . Select a system for the reason."
2. **Alone** (one line per activity, A2 to A9): exactly one system, not counting people, takes part.
   - "**<activity name> runs on <system> alone.** One system is a single point of failure for the activity."
   - The chip is gap. When that system's share isn't Takes part, add ", and its share is limited/blocked" inside the bold, and make the chip stop.
3. **Busiest** (gap): the system, not counting people, that takes part in the most activities, when that is four or more. "**<name> takes part in n activities** (<IDs>). Losing it stops all of them."
4. **No activity** (neutral): systems with no cell.
   - Load balancers: "**<names> take(s) part in no activity.** It passes / They pass connections on to the systems behind it/them (SV-2)."
   - Otherwise: "It provides / They provide no service function an activity needs."
5. **Without limits** (ok): activities in A2 to A9 with more than one system, every one taking part without limits. "**<IDs and names> has/have every system taking part without limits.**"

## 3. CV-7 · Capability to Services Mapping

### 3.1 Which services a capability uses

Capability part c uses service s when both of these hold:
1. **Activities:** s carries out a SvcV-4 function in one of the OV-5a parts c performs (the CV-6 map).
2. **Components:** s is built from c's components.
   - c's types are `builderCapabilities170[...].parts[c].types`.
   - s's types are its catalogue `types` plus the types of its current providers.
   - S4 (HTTP Event Collector) has no catalogue types, so also count `hecEndpoint` and `hf` for it.

Both rules are needed:
- Rule 1 alone is too broad for collection: A3.1 covers forwarder and indexer delivery, so syslog collection would pick up heavy forwarding.
- Rule 2 alone is too broad for search: every search-tier type provides S9 to S12.

**The cell** lists s's functions in c's parts, with their SvcV-4 status.

**Reference mapping:**

| CV-2 part | Uses | CV-2 part | Uses |
|---|---|---|---|
| C1.1 | S1, S3 | C4.3 | S11 |
| C1.2 | S1 | C5.1 | S9, S12 |
| C1.3 | S2, S4 | C5.2 | S9, S12 |
| C1.4 | S6 | C5.3 | S9, S12 |
| C2.1 | S5 | C6.1 | S13 |
| C2.2 | S16 | C6.2 | S13 |
| C3.1 | S7 | C7.1 | S14 |
| C3.2 | S7 | C7.2 | S9, S14 |
| C3.3 | S8 | C7.3 | S9 |
| C4.1 | S9 | C8.1 | S15 |
| C4.2 | S10 | C8.2 | S16 |
| | | C8.3 | S15 |

**Readiness:**
- Ready when every service the capability uses is deployed.
- Otherwise "Waiting on <IDs>".

### 3.2 Summary

The summary shows, in order:
- capabilities;
- services;
- deployed;
- not deployed;
- capabilities service-ready;
- waiting on a service.

### 3.3 Matrix

**Rows:**
- The 23 CV-2 parts, under capability rows with domain squares.
- Each row header (a button) shows "C1.1 Network and syslog collection", with the CV-2 status beneath as a dot and "CV-2: <status>".

**Columns:**
- The services grouped under SvcV-1 layers, in this order: Collection (S1, S2, S3, S4, S6), Indexing (S7, S8), Search (S9, S10, S11), Detection and response (S12, S13), Platform and access (S5, S14, S15, S16).
- Each header is a button with the ID and the name set vertically.
- Services that aren't deployed are hatched down the whole column.

**Cells:**
- Function chips coloured by status, each with the title "<ID> <name> · <status> · <reason>".
- A cell with functions is focusable.

**Last column, "Services":** "Ready" (ok) or "Waiting on S12" (review).

**Footer, "Capabilities using it":** a count per service.

### 3.4 Detail panel

The panel sits above the matrix.

**Nothing selected:**
- Left:
  - "Service readiness";
  - "x of 23 capabilities ready";
  - "Ready means every service the capability uses is deployed. The cell colours show whether those services' functions are realised (SvcV-4).";
  - the hint.
- Right:
  - "Services not deployed": each with the capabilities waiting on it;
  - "Gaps: None." when every service is deployed.

**A capability:**
- Left:
  - "Capability · CV-2 · <C-n name>";
  - "<ID> · <name>";
  - the CV-2 status and readiness chips;
  - "CV-2: <reason>";
  - "Performs <parts> (CV-6)."
- Right:
  - "Services it uses": each with its state and functions;
  - "See": CV-2, CV-6 and SvcV-1.

**A service:**
- Left:
  - "Service · SvcV-1 · <layer>";
  - "<ID> · <name>";
  - the provider;
  - the state;
  - the SvcV-1 interface.
- Right:
  - "Used by": each capability, with the functions;
  - when the service isn't deployed and capabilities use it: "If not deployed: n capabilities wait on it. Add <provider> in the Builder.";
  - "See": SvcV-1 and SvcV-4.

**A cell:**
- Left: the capability, then the service with its provider and state.
- Right:
  - "Functions it carries out for <capability ID> (SvcV-4)": each with its status, its OV-5a part and its reason;
  - "See": SvcV-4 and CV-6.

### 3.5 Service register

A table of the services, in the matrix's order, with these columns:
- ID;
- Service;
- Provided by (SvcV-1's provider text);
- Interface (SvcV-1's `interface`);
- Used by (capability IDs);
- In topology (Deployed or Not deployed).

### 3.6 Findings ("What the mapping shows")

1. **Biggest gap** (stop): the service that isn't deployed and has the most capabilities waiting on it.
   - Break ties by service number.
   - "**<ID> <name> isn't deployed, and n capabilities wait on it:** <IDs>."
2. **Waiting** (gap): the other services that aren't deployed, in service order.
   - Up to four: "**<capabilities> wait(s) on <ID> <name>.**" for each.
   - More than four: "**n more services aren't deployed:** <ID> (<capabilities>); …."
3. **Deployed, not working** (gap): ready capabilities with any Not realised function. "**<IDs> has/have every service deployed, but a function it/they need(s) isn't realised:** <function IDs>. Select one for the reason."
4. **Shared** (neutral): the deployed service with the most capabilities, when that is three or more. "**<ID> <name> is used by n capabilities,** more than any other service. Its availability is theirs."
5. **Check CV-2** (gap): capabilities that read In topology in CV-2 but wait on a service that isn't deployed.
6. **Coverage:**
   - (ok) "**Every capability uses at least one service, and every service serves a capability.**"
   - Otherwise (gap), name the capabilities that use no service and the services that serve no capability.

## 4. In-place addition to SvcV-4: name the systems a status blames

Some of `status173`'s reasons are built from node names, such as "Universal Forwarder 2: no output to an indexer". SV-5b needs those nodes as data, so **never parse the reason text**.

Add two fields to the object `status173` returns, without changing `code`, `status` or `reason`:
- `nodes`: `[{id, text}]`, the nodes the reason names, each with its text after the name;
- `flow`: the SvcV-6 flow ID, for results built by `mapFlow`.

| Function | `nodes` | `text` |
|---|---|---|
| S3.1 | The sources of the weak syslog links | "syslog accepts UDP or has no required TLS" |
| S1.3 | The Windows Event Log nodes with no path | "no path to an indexer" |
| S7.1 | The forwarders that don't reach an indexer | "no output to an indexer" |
| S1.2, S2.3, S7.6, S15.1, S16.1 (`mapFlow`) | The providers `noOutput` names, when it names any | "no output to an indexer"; `flow` is the key passed to `mapFlow` |

Everywhere else, `nodes` is empty. A small helper beside `noOutput` can return both the reason and the nodes.

## 5. Registration

As SV-1, SV-2 and SV-6 do:
- wrap `builderOvSections135`, `builderOvShow135` and `builderOvRender135` to add the three tabs;
- wrap `builderV125PackPages125` to place the pages and rebuild the cover's table of contents;
- wrap `ensurePresentationOverlay` for the pack checkboxes;
- wrap `topologyDocument` and `loadTopologyDocument` for the pack switches;
- refresh the print copies on `beforeprint`.

**Pack and print:**
- All three print their matrix, any footer and their findings, without the panel.
- SV-3 also prints the two tables.
- CV-7 also prints the service register.
- Chips print as text.

**Records:**
- a `changeRegister` entry: "Adds SV-3 Systems-Systems Matrix, SV-5b Operational Activity to Systems Traceability Matrix and CV-7 Capability to Services Mapping, generated from SV-1, OV-5a, CV-6 and SvcV-4";
- the build stamp.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Every other tab and pack page is unchanged, apart from page numbers and the table of contents.
   - SvcV-4's reasons and statuses are unchanged by section 4.
2. **Reference topology:**
   - **SV-3:**
     - Summary: 17 systems, 18 interfaces, 6.6% of pairs connected, 11 cross a location, 12 need attention, 1 system with none (Windows Event Log 1).
     - Order as in 1.1. Indexer 1 has 5 in and 1 out.
     - Interfaces by location: Sydney → Multisite is 5, and Sydney → Sydney is 4.
     - Findings:
       - "Indexer 1 is in 6 interfaces (5 in, 1 out), and all of them need attention.";
       - Heavy Forwarder 1 and Universal Forwarder 2 are dead ends (SI-13, SI-14);
       - SI-15, SI-16, SI-17 and SI-18 are inferred.
   - **SV-5b:**
     - Summary: 27 assignments: 19 without limits, 3 limited, 5 blocked; 5 systems with a blocked share.
     - **Blocked:**
       - Windows Event Log 1 (A1.2);
       - Heavy Forwarder 1 (A3.1, "S2.3 Forward cooked: no output to an indexer (SI-14 missing).");
       - Monitoring Console 1 (A7.3);
       - Universal Forwarder 2 (A3.1);
       - SOAR Cloud (A9.2, A9.3).
     - **Limited:**
       - License Manager 1 (A7.2, "S15.1 Pool, enforce licence: SI-16 is inferred; add the link to the topology.");
       - Administrator 1 (A9.2);
       - Indexer 1 (A7.2).
     - Universal Forwarder 1's A3.1 takes part without limits.
     - Footer: A1 3 of 4, A2 5 of 5, A3 2 of 4, A4 2 of 2, A5 1 of 1, A6 3 of 3, A7 1 of 4, A8 2 of 2, A9 0 of 2.
     - Findings:
       - A5 runs on Indexer 1 alone;
       - A9 runs on SOAR Cloud alone, and its share is blocked;
       - Indexer 1 takes part in 5 activities.
   - **CV-7:**
     - Summary: 12 deployed, 4 not deployed, 17 ready, 6 waiting (C1.4 on S6, C3.3 on S8, C4.3 on S11, C5.1 to C5.3 on S12).
     - Mapping as in 3.1.
     - Footer: S9 6, S12 3. S1, S7, S13, S14, S15 and S16 have 2 each; the rest have 1.
     - Findings:
       - biggest gap S12;
       - deployed but not working: C1.2, C1.3, C2.2, C6.1, C6.2 and C8.2 (S1.3, S2.3, S13.1, S13.3 and S16.2);
       - S9 shared by 6.
3. **Zoned example:**
   - **SV-3:**
     - Summary: 20 systems, 22 interfaces, 5.8%, 12 cross a location, 10 need attention.
     - Syslog VIP (3) sends SI-2 and SI-6 to Syslog Server 1 (4) and Syslog Server 3 (6).
   - **SV-5b:**
     - Summary: 30 assignments: 22 without limits, 3 limited, 5 blocked.
     - A2 has 7 of 7 without limits.
     - "Syslog VIP takes part in no activity. It passes connections on to the systems behind it (SV-2)."
4. **Default topology:**
   - **CV-7:**
     - Summary: 3 deployed, 13 not deployed, 4 ready (C1.1, C1.2, C3.1, C3.2).
     - The biggest gap is S9, with 6 capabilities waiting.
     - No "Shared" line, because S9 isn't deployed.
   - **SV-3:** 4 systems and 3 interfaces, all in "Location not set".
5. **Edits**, applied in turn from the reference topology:

   | Edit | Result |
   |---|---|
   | Connect Universal Forwarder 2 to Indexer 1 | SV-3's only missing interface is Heavy Forwarder 1's, and its dead ends name Heavy Forwarder 1 only. SV-5b: Universal Forwarder 2 takes part in A3.1 |
   | Connect Windows Event Log 1 to Universal Forwarder 1 | SV-3 has no system with none (19 interfaces). SV-5b: Windows Event Log 1 takes part in A1.2 |
   | Add an ES search head | CV-7: 20 ready; C5.1 to C5.3 no longer wait; S12.1 and S12.3 read Partly realised ("ES search head has no search link"). SV-5b: the ES search head is Limited in A6.3 and A9.1 |

6. **Interaction:**
   - Every system, interface, activity, capability, service and cell opens its panel.
   - Esc clears the selection.
   - Edit link opens the relationship inspector.
   - View chips open their tabs.
7. **Pack and print:**
   - SV-3 and SV-5b follow SV-2, before SV-6.
   - CV-7 follows CV-6.
8. **Layout:**
   - No page-level sideways scroll at 400px or 768px.
   - The matrices fit at 1288px for the test topologies.
   - Dark and light are both readable.

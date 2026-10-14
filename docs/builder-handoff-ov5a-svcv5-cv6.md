# Builder handoff: add OV-5a, SvcV-5 and CV-6 (activities, services and capabilities)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 187 (`builder-review-v187`) or any later build. The three views read only models Build 187 already has:
- SvcV-4's functions;
- the SvcV-1 catalogue;
- OV-2's nodes;
- CV-2's capability parts.

Add one block, `<script id="builder-activities-v1xx">`, with wrappers, plus one in-place fix in `builder-cv2-v171` (section 5).

They don't need SV-1, StdV-1 or AV-1, and those don't need them. When AV-1 and AV-2 exist, they list these views with no change there ([`builder-handoff-av1-av2.md`](builder-handoff-av1-av2.md)).

**Mockups (the targets):**
- [`docs/mockups/architecture-ov5a-mockup.html`](mockups/architecture-ov5a-mockup.html), screenshot `docs/mockups/compare/ov5a-mockup.png`;
- [`docs/mockups/architecture-svcv5-mockup.html`](mockups/architecture-svcv5-mockup.html), screenshot `docs/mockups/compare/svcv5-mockup.png`;
- [`docs/mockups/architecture-cv6-mockup.html`](mockups/architecture-cv6-mockup.html), screenshot `docs/mockups/compare/cv6-mockup.png`.

Each mockup has two examples: the reference topology (`docs/mockups/ov1-reference-topology.json`) and the default topology. Their data was exported from Build 187 with the rules below, so the numbers are the expected ones. They replace the Build 167 mockups, whose marks were fixed text.

## What the three views are

- **OV-5a · Operational Activity Decomposition Tree.** One top-level activity, nine activities and 23 parts. Each part groups the SvcV-4 functions that carry it out and shows whether the topology supports it. Performers are the OV-2 nodes and teams whose systems provide those functions.
- **SvcV-5 · Operational Activity to Services Traceability Matrix.** Services by activities. Each cell lists the SvcV-4 functions of that service that are tagged with that activity, coloured by their status.
- **CV-6 · Capability to Operational Activities Mapping.** CV-2 capability parts by activities. Each cell lists the OV-5a parts the capability performs, coloured by their support.

**The three are all derived. They add no saved state** apart from their pack switches.

**Activity IDs.** SvcV-4 already tags its 36 functions with activities, but with **A2 to A9**, not A1 to A6. A1, Generate security telemetry, is what the monitored systems do, so no platform function carries it. OV-5a makes these nine the list that every view uses, with SvcV-4's names:

- A8 is "Authenticate and authorise", as in SvcV-4.
- The Build 167 CV-6 mockup's "Authenticate and investigate" came from OV-2's people fallback (`builderOv2Activity133('people')`), and is dropped.
- OV-2's activity text describes each node rather than naming an OV-5a activity, so it stays as it is. OV-5a links the two through performers (1.4).

## Where they go

Follow the SvcV-1 and SvcV-2 pattern (`builder-svcv12-v175`).

| Step | OV-5a | SvcV-5 | CV-6 |
|---|---|---|---|
| Section key | `ov5a` | `svcv5` | `cv6` |
| Tab | "OV-5a · Activity tree", after the OV-3 tabs | "SvcV-5 · Activity traceability", after "SvcV-4 · Service functions" | "CV-6 · Activity mapping", after "CV-2 · Taxonomy" |
| Active key | Add each key to `builderOvShow135`, keeping every existing key | | |
| Pack | After OV-3, before DIV-1 | After SvcV-4, before SvcV-6 | After CV-2, before SvcV-1 |
| Pack checkbox | "OV-5a activity tree", after `#builderPackOv3Section134` | "SvcV-5 activity traceability", after `#builderPackSvcv4_173` | "CV-6 activity mapping", after `#builderPackCv2_171` |
| `packSections` key | `ov5a`, default `true` | `svcv5`, default `true` | `cv6`, default `true` |

**Page furniture,** as on SvcV-4: `builderOv3Furniture139(title, purpose)`, with the same replacements SvcV-4 makes.

| | OV-5a | SvcV-5 | CV-6 |
|---|---|---|---|
| Viewpoint (replaces Scope) | Operational · DoDAF V2.0 | Services · DoDAF V2.0 | Capability · DoDAF V2.0 |
| Owner field | "Owner / author", as OV-3 | "Service owner", from `state.builderCv1.owner` | "Capability owner", from `state.builderCv1.owner` |
| Banner label | Operational architecture · OV-5a | Services architecture · SvcV-5 | Capability architecture · CV-6 |
| Footer, left | "<architecture> · Activities used by SvcV-4, SvcV-5 and CV-6 · Performers from OV-2" | "<architecture> · Activities from OV-5a · Services from SvcV-1 · Functions and their status from SvcV-4" | "<architecture> · Activities and their support from OV-5a · Capabilities and their status from CV-2" |
| Footer, right | `OV-5a · 1 of 1 · Build <n>` | `SvcV-5 · 1 of 1 · Build <n>` | `CV-6 · 1 of 1 · Build <n>` |

Take each purpose line from its mockup. Use Build 185's singular forms at a count of one.

**Colours:** use the OV theme tokens, as SvcV-6 does. The same five states run through all three views:

| State | OV-5a part or activity | SvcV-4 function | CV-2 capability | CV-6 coverage | Colour |
|---|---|---|---|---|---|
| `ok` | Supported | Realised | In topology | Covered | `--ok` |
| `partial` | Partly supported | Partly realised | Partial | Gap | `--review` |
| `planned` | Planned | Planned | Planned | | `--sel`, hollow dot, dashed box |
| `none` | Not supported | Not realised | | Not covered | `--stop` |
| `nosrc` | No sources (A1 only) | | | Outside the platform (A1) | `--muted`, dashed dot |

**Domains:** activity colour bars and CV-6 group squares use CV-2's domain colours, the `colour(domain)` of `builder-cv2-v171`:
- collect: `--ovData`;
- index: `--ovMgmt`;
- search: `--ovAuth`;
- detect: `--ovResp`;
- govern: `--ovReview`.

**Layout:** the page never scrolls sideways. The two matrices scroll inside their own boxes (minimum width 1080px). Under 760px, the tree becomes an outline: A0, then each activity with its parts beneath, and no connector lines.

**View chips** (the "See" rows) open their tab with `builderOvShow135(key)`. In print they are plain text.

## 1. Shared model: `window.builderActivityModel1xx()`

Returns `{a0, activities, parts}`. The SvcV-5 and CV-6 pages read it too. Cache it as SvcV-2's `shared()` does, keyed on the nodes, the three relation lists, groups, the OV-1 mission and CV-1. Each status call builds SvcV-4's context, so don't rebuild the model on every render.

### 1.1 Activities

| ID | Name | Domain | Description |
|---|---|---|---|
| A1 | Generate security telemetry | collect | Network devices, hosts and cloud services record security events. The monitored systems do this, outside the platform. |
| A2 | Collect, buffer and forward | collect | Receive or read events at each site and in the cloud, and hold them until they can be sent. |
| A3 | Forward and deliver events | collect | Send events to the indexers, and confirm they arrived. |
| A4 | Process and route events | collect | Parse, mask, filter and route events before they are stored. |
| A5 | Index and replicate | index | Store events in indexes, age them out, and keep copies across sites. |
| A6 | Search and detect | search | Search, normalise and correlate events to find threats. |
| A7 | Manage the platform | govern | Configure the fleet, manage the licence and watch platform health. |
| A8 | Authenticate and authorise | govern | Sign people in and map them to roles. |
| A9 | Coordinate response | detect | Turn findings into cases, run playbooks and update tickets. |

A2 to A9 match SvcV-4's `ACT` names exactly.

### 1.2 Parts

| Part | Name | From |
|---|---|---|
| A1.1 | Log network and security device events | Sources: `syslogSource` |
| A1.2 | Log host and authentication events | Sources: `windowsEvent`, `fileSource`, `scriptSource` |
| A1.3 | Emit cloud and application events | Sources: `awsLambda`, `azureFunction`, `hecClient`, `apiSource`, `sqlDatabase` |
| A2.1 | Receive syslog | S3.1, S3.2 |
| A2.2 | Read host and file logs | S1.1, S1.3 |
| A2.3 | Receive cloud events over HEC | S4.1 |
| A3.1 | Deliver to the indexers | S1.2, S2.3, S7.1 |
| A4.1 | Parse and route | S4.2, S2.1, S7.2 |
| A4.2 | Mask personal information | S2.2 |
| A4.3 | Filter at the edge | S6.1 |
| A5.1 | Store and age events | S7.3 |
| A5.2 | Replicate across sites | S8.1 |
| A6.1 | Investigate | S7.4, S9.1, S9.2, plus people |
| A6.2 | Normalise to the CIM | S7.5, S10.1, S10.2 |
| A6.3 | Run detections | S9.3, S12.1, S12.3 |
| A6.4 | Keep search available | S11.1 |
| A7.1 | Distribute configuration | S5.1 |
| A7.2 | Manage the licence | S7.6, S15.1 |
| A7.3 | Monitor health | S16.1, S16.2 |
| A8.1 | Sign in and map roles | S14.1, S9.4 |
| A9.1 | Raise findings | S12.2 |
| A9.2 | Run cases and playbooks | S13.1, S13.2, plus people |
| A9.3 | Update tickets | S13.3 |

Every one of SvcV-4's 36 functions (`builderServiceFunctions173`) is in exactly one part, and each part's functions carry its activity's ID. A function that a later build adds and this table doesn't list goes into the last part of its activity, so nothing drops out.

### 1.3 Status

**Functions:** `builderServiceFunctionStatus173(id)`, which returns `code` (`ok`, `partial`, `planned`, `none`), `status` and `reason`.

**A part made of functions:**
- Supported when every function is Realised;
- Partly supported when at least one is Realised or Partly realised;
- Planned when every function is Planned;
- Not supported otherwise: nothing is realised, and at least one function is Not realised.

**An A1 part.** Its sources are the nodes of its types. A source is collected when it is the `from` end of an edge in `builderTraceEdges('data')`.
- No sources: there are no nodes of those types. Reason: "No sources of this kind in the topology."
- Supported: every source is collected. Reason: "<names> is/are collected."
- Partly supported: some sources are collected.
- Not supported: no source is collected.

For Partly and Not supported, the reason is "<names not collected> isn't/aren't collected."

**An activity** rolls up its parts by the same rule, leaving out parts with no sources. When all its parts have no sources, the activity reads No sources.

**A part's reason** is the first function that falls short, taking Not realised first, then Partly realised, then Planned: "<ID> <name>: <reason>". An A1 part uses its own reason.

### 1.4 Performers

- **Systems:** the providers (`builderServiceCatalogue172()[service].providers`) of deployed services, for the part's functions that aren't Planned. An A1 part's systems are its sources.
- **People:** A6.1 and A9.2 add the `authUser` nodes when the part is Supported or Partly supported.
- **Performed by (OV-2):** the nodes of `builderOv2Model133().nodes` whose `parts` include a system or person. Show each as "ON-n name · location".
- **Teams:** `responsibilityOwner(node)` of the systems, without the people. Show them distinct, in order of first appearance.
- **An activity's** performers and teams are those of its parts, combined.

### 1.5 A0

- **Name:** "Operate security telemetry".
- **Purpose:**
  1. the OV-1 mission (`state.builderExport.ov1.mission`), marked "· OV-1 mission";
  2. else the CV-1 vision, marked "· CV-1 vision";
  3. else "Turn events across the estate into detections and responses."

### 1.6 CV-6 map: which OV-5a parts each CV-2 part performs

| CV-2 part | Performs | CV-2 part | Performs |
|---|---|---|---|
| C1.1 Network and syslog collection | A2.1, A3.1 | C4.3 Search high availability | A6.4 |
| C1.2 Endpoint collection | A2.2, A3.1 | C5.1 Correlation detections | A6.3 |
| C1.3 Cloud and API collection | A2.3, A3.1 | C5.2 Risk-based alerting | A6.3, A9.1 |
| C1.4 Filtering and masking at source | A4.2, A4.3 | C5.3 Behaviour analytics (UEBA) | A6.3 |
| C2.1 Configuration as code | A7.1 | C6.1 Case management | A9.2, A9.3 |
| C2.2 Forwarder fleet health | A7.3 | C6.2 Playbook automation | A9.2 |
| C3.1 Event indexing | A4.1, A5.1 | C7.1 Single sign-on | A8.1 |
| C3.2 Retention management | A5.1 | C7.2 Data access control | A8.1 |
| C3.3 Data replication | A5.2 | C7.3 Access review | A8.1 |
| C4.1 Ad hoc investigation | A6.1 | C8.1 Licence management | A7.2 |
| C4.2 Normalised data (CIM) | A6.2 | C8.2 Health monitoring | A7.3 |
| | | C8.3 Capacity planning | A7.2, A7.3 |

No capability performs A1. Take names and statuses from `builderCapabilities170` and `builderCapabilityPartStatus171(id)`. A part's "Capabilities (CV-6)" are the rows that list it.

## 2. OV-5a page

### 2.1 Summary

The summary shows, in order:
- 1 top-level activity;
- 9 activities;
- 23 parts;
- supported (`--ok`);
- partly (`--review`);
- planned (`--sel`);
- not supported (`--stop`);
- "with no sources", only when there are any;
- performing teams: the distinct teams across all activities.

### 2.2 Tree

**A0 box,** centred:
- the overline "A0 · Top-level activity";
- the name;
- the purpose with its source.

**Activity columns:** nine equal columns joined to A0 by connector lines.

**Activity header** (a button):
- a colour bar in its domain colour;
- "A2 ● Partly": the ID, a status dot and a short status (Supported, Partly, Planned, Not supported or No sources);
- the name;
- the teams, or "No performer yet". A1 reads "Outside the platform".

**Part cards** (buttons) sit under the header, with a vertical line and ticks:
- the ID with a status dot, and the name;
- a left border in the status colour;
- Not supported cards are tinted with `--stop`;
- Planned cards have a dashed border.

**Selecting:**
- Selecting an activity or a part outlines it, and fades everything except it and its activity or parts.
- Selecting it again, or pressing Esc, clears the selection.

**Legend:** the five dots (no sources only when present), then "Colour bar: the CV-2 domain. Lines read "is part of". Select an activity or a part. Esc clears."

### 2.3 Detail panel

The panel sits below the tree, in two columns.

**Nothing selected:**
- Left:
  - "Support today";
  - "n part(s) not supported";
  - "x planned, y partly supported, z supported.";
  - the hint.
- Right:
  - "Not supported": each part as ID chip, name and reason;
  - "Planned": the first six, then "and n more";
  - "Gaps: None." when both lists are empty.

**An activity:**
- Left:
  - "Activity · CV-2 domain <domain>", or "Activity · outside the platform" for A1;
  - "<ID> · <name>";
  - the description and status;
  - "Performed by (OV-2)" and "Teams".
- Right:
  - "Parts": chips with name and reason;
  - "Capabilities (CV-6)" with their CV-2 status. A1 reads "None: the monitored systems perform it.";
  - "See": SvcV-4, SvcV-5, CV-6 and OV-2. A1 shows OV-2 and CV-6 only.

**A part:**
- Left:
  - "<activity ID> · <activity name>";
  - "<ID> · <name>";
  - its status;
  - "Performed by (OV-2)" and "Teams".
- Right:
  - "Functions (SvcV-4)": each as ID chip, name, status and reason. An A1 part shows "Sources" with its reason instead;
  - "Services (SvcV-1)": "S3 Syslog reception · Deployed" or "· Not deployed";
  - "Capabilities (CV-6)";
  - "See".

### 2.4 Findings ("What the tree shows")

Show each line only when it applies, in this order.

1. **Weakest branch** (stop chip, labelled with the activity ID). Take the activity with the most Not supported parts, breaking ties by ID. "**<name> is the weakest branch.** n of its m parts is/are not supported: <part names>."
2. **Not supported** (stop): "**<ID> <name>:** <reason>." for each part that isn't supported.
3. **Planned** (gap):
   - "**<parts> is/are planned.**" With more than four parts, show IDs only; otherwise "ID name" as a list.
   - Then "It waits / They wait on <service names> (<service IDs>), not deployed." It names the services behind the part's Planned functions that aren't deployed, in service order. With more than four, write "on n services that aren't deployed: <IDs>".
4. **Partly** (gap): "**<IDs> is/are partly supported.** Select one for the functions that fall short."
5. **Supported** (ok):
   - When any activity is fully supported: "**<names (IDs)> is/are fully supported.** n parts in all."
   - Otherwise, when any part is supported: "**<IDs> is/are supported.**"

### 2.5 Pack and print

Print the tree without the selection, legend hint or panel. On a page narrower than 760px it prints as the outline. Then add a table: Part, Name, Status, Functions, Performed by. Then the findings.

## 3. SvcV-5 page

### 3.1 Summary

The summary shows, in order:
- 9 activities;
- 16 services;
- mappings: the service and activity pairs with at least one function;
- functions;
- for A2 to A9 only:
  - activities supported;
  - partly;
  - planned (when any);
  - not supported (when any);
- services not deployed (`--stop`).

### 3.2 Matrix

**Columns:**
- "Service (SvcV-1)";
- A1 to A9, each a button with the ID and name;
- "Service state".

**Rows:** the 16 services from `builderSvcv12Model175()`, grouped under layer rows in this order: Collection, Indexing, Search, Detection and response, Platform and access. Within a layer, keep catalogue order. Each row header (a button) shows "S3 Syslog reception" with the box's `provider` text beneath, in mono.

**Cells:**
- The service's functions tagged with that activity, as ID chips coloured by status.
- Each chip's title is "<ID> <name> · <status> · <reason>".
- A cell with functions is focusable and selects that service and activity.
- The A1 column is hatched and empty.

**Service state:** "Deployed" (ok) or "Not deployed" (stop), with "x of y realised" beneath.

**Footer, "Activity support (OV-5a)":** each activity's status chip (short "Partly") and "x of y realised". A1 reads "Outside platform · no service".

**Selecting:**
- the selected activity's column is tinted;
- the selected row's header turns `--sel`;
- the selected cell is tinted more strongly.

**Legend:** the four function chips, then "Cells list SvcV-4 functions. Select a service, an activity or a cell. Esc clears."

### 3.3 Detail panel

The panel sits above the matrix.

**Nothing selected:**
- Left: "Activity support today", "x of 36 functions realised", "n of 8 platform activities fully supported. A1 is outside the platform.", and the hint.
- Right:
  - "Services not deployed": each with its activities and "n function(s)";
  - "Not realised in deployed services": each function with its activity and reason.

**An activity:**
- Left: "Operational activity · OV-5a", "<ID> · <name>", the description, the status, and "x of y functions realised".
- Right:
  - "Implemented by": each service, with its functions, statuses and reasons where not realised. A1 reads "No service. The monitored systems perform it, outside the platform.";
  - "See": OV-5a and SvcV-4.

**A service:**
- Left: "Service · SvcV-1 · <layer>", "<ID> · <name>", the provider, the state, and "x of y functions realised".
- Right:
  - "Activities it carries out": each activity, with its functions;
  - "See": SvcV-1, SvcV-4 and OV-5a.

**A cell:**
- Left: the activity as overline, then the service with its provider and state.
- Right: "Functions in this activity (SvcV-4)", then "See".

### 3.4 Findings ("What the matrix shows")

1. **Not deployed** (stop):
   - "**<IDs and names> isn't/aren't deployed.**" With more than four services, write "n services aren't deployed: <IDs>".
   - Then "Its/Their n function(s) sit(s) in <activities>."
2. **Not realised** (stop): the Not realised functions of deployed services, as "**<ID> <name> (<activity>):** <reason>.". Show the first four, then "And n more."
3. **One service** (gap, one line per activity): an activity in A2 to A9 where exactly one deployed service has a Realised or Partly realised function in it. "**<name> depends on <service> alone.**"
4. **A1** (neutral): "**Generate security telemetry has no service.** The monitored systems perform it, outside the platform (OV-5a)."
5. **Supported** (ok, one line per activity): each activity in A2 to A9 that is fully supported. "**<name> is fully supported** by <its services>."

### 3.5 Pack and print

Print the full matrix, the footer and the findings. The function IDs print as plain coloured text. Leave out the panel.

## 4. CV-6 page

### 4.1 Coverage

An activity's capabilities are the CV-2 parts that perform any of its parts (1.6).
- **A1:** Outside the platform.
- **Covered:** every capability is In topology.
- **Not covered:** every capability is Planned.
- **Gap:** otherwise.

### 4.2 Summary

The summary shows, in order:
- 9 activities;
- 23 capabilities;
- mappings: the capability and activity pairs;
- activities covered;
- with a gap;
- not covered (when any);
- outside the platform;
- "capabilities with no activity", only when a CV-2 part performs none.

### 4.3 Matrix

**Columns:**
- "Capability (CV-2)";
- A1 to A9;
- "CV-2 status".

**Rows:**
- The 23 CV-2 parts, grouped under "C1 Telemetry collection" and the other capabilities.
- Each group row starts with a square in its domain colour.
- Each row header (a button) shows "C1.1 Network and syslog collection".

**Cells:**
- The OV-5a parts the capability performs in that activity, as ID chips coloured by the part's OV-5a status.
- Each chip's title is "<ID> <name> · <status>".
- The A1 column is hatched.
- So a row's colour can differ from its CV-2 status, and that difference is the point: C4.2 is In topology, but A6.2 is only partly supported.

**CV-2 status:** a chip.

**Footer:** two rows.
- "Capability coverage": the chip from 4.1, with "x of y in topology".
- "Activity support (OV-5a)": the activity's status chip.

**Selecting** works as in SvcV-5.

**Legend:** the four part chips, then "Cells list OV-5a parts. Select a capability, an activity or a cell. Esc clears."

### 4.4 Detail panel

The panel sits above the matrix.

**Nothing selected:**
- Left:
  - "Coverage today";
  - "x of 8 platform activities covered";
  - "Covered means every capability that performs the activity is in the topology (CV-2). Cell colours show whether the parts themselves are supported (OV-5a).";
  - the hint.
- Right:
  - "Activities with a gap": each with its capabilities that aren't In topology, such as "C1.4 planned";
  - "Parts with no capability in the topology": each with its planned capabilities.

**An activity:**
- Left:
  - "Operational activity · OV-5a";
  - "<ID> · <name>";
  - the description;
  - the coverage chip and the status chip.
- Right:
  - "Capabilities that perform it": each with its CV-2 status and "Performs <parts> (<part status>)". A1 reads "None. The monitored systems perform it, outside the platform; C1.1 to C1.3 collect what they send.";
  - "See": OV-5a and CV-2.

**A capability:**
- Left:
  - "Capability · CV-2 · <C-n name>";
  - "<ID> · <name>";
  - the status and CV-2's reason.
- Right:
  - "Performs (OV-5a parts)": each part with its status and reason;
  - "See": CV-2 and OV-5a.

**A cell:**
- Left: the activity as overline, then the capability with its status and reason.
- Right: "Parts it performs in this activity (OV-5a)", then "See".

### 4.5 Findings ("What the mapping shows")

1. **Not covered** (stop):
   - One activity: "**<name> has no capability in the topology:** <capability IDs> is/are planned."
   - More than one: "**<IDs and names> have no capability in the topology:** every capability that performs them is planned."
2. **No capability** (gap):
   - Covers OV-5a parts outside A1 whose capabilities are all Planned, leaving out parts already in a Not covered activity.
   - "**<IDs and names> has/have no capability in the topology.** <capability IDs> is/are planned."
3. **Check** (neutral, one line per part): a part from line 2 that is Supported anyway.
   - "**<ID> <name> is supported, but its only capability, <ID name>, is planned.**"
   - With more than one capability: "but its capabilities, <IDs and names>, are planned."
   - Then "SvcV-4 realises <functions>; CV-2 says: <the first capability's reason>."
4. **In topology** (gap): capabilities that are In topology but perform parts that aren't Supported.
   - "**<capability IDs> is/are in the topology, but <part IDs, in order> is/are not fully supported.** CV-2 counts the components; SvcV-4 checks the functions they provide."
5. **A1** (neutral): "**Generate security telemetry has no capability.** The monitored systems perform it; C1.1 to C1.3 collect what they send."
6. **Covered** (ok): "**<IDs and names> is/are covered:** every capability that performs it/them is in the topology."
7. **Every capability** (ok): "**Every CV-2 part performs at least one activity.**"
   - When a CV-2 part isn't in the map (a later build may add one), show this instead (gap): "**<parts> perform(s) no activity.** Map it/them to an OV-5a part, or retire it/them."

### 4.6 Pack and print

As SvcV-5: the full matrix, both footer rows and the findings, without the panel.

## 5. Fix in `builder-cv2-v171`: source paths through added links

`context171()` builds `children` from `parent` links only. Its `reaches()` and `stopNames()` therefore never follow additional data relations (`state.builderDataRelations`), although `ctx.data` includes them.

A second forwarder to the same indexer is always an additional relation, because the indexer already has a parent. So connecting Universal Forwarder 2 or Heavy Forwarder 1 to Indexer 1 leaves:
- C1.1 and C1.3 Partial, still reading "path stops before an indexer";
- I-11 in AV-1 unchanged.

SvcV-4's `context173()` already follows the additional relations, so SvcV-4 and CV-2 disagree.

**Fix:** before `reaches` is defined, add each additional data relation to `children`:

```js
for (const r of state.builderDataRelations || []) {
  if (!children.has(r.from)) children.set(r.from, []);
  if (!children.get(r.from).includes(r.to)) children.get(r.from).push(r.to);
}
```

The reference and default results don't change. The edits in check 4 do.

## 6. Registration

As SvcV-1 and SvcV-2 do:
- wrap `builderOvSections135`, `builderOvShow135` and `builderOvRender135` to add the three tabs;
- wrap `builderV125PackPages125` to place the pages and rebuild the cover's table of contents;
- wrap `ensurePresentationOverlay` for the three pack checkboxes;
- wrap `topologyDocument` and `loadTopologyDocument` for the pack switches;
- refresh the print copies on `beforeprint`.

**Records:**
- a `changeRegister` entry: "Adds OV-5a Operational Activity Decomposition Tree, SvcV-5 Operational Activity to Services Traceability Matrix and CV-6 Capability to Operational Activities Mapping, linking SvcV-4's functions and CV-2's capabilities to nine operational activities. Fixes CV-2 source paths that run through added data links";
- the build stamp.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Every other tab and pack page is unchanged, apart from page numbers, the table of contents, and CV-2 statuses after the edits in check 4.
2. **Reference topology:**
   - **OV-5a:**
     - Summary: 23 parts: 9 supported, 7 partly, 3 planned, 4 not supported; 6 performing teams.
     - A0 reads the OV-1 mission, "Detect, investigate and contain security threats across both data centres and AWS within 15 minutes, 24×7."
     - A8 is Supported. Every other activity is Partly.
     - Not supported: A1.2 ("Windows Event Log 1 isn't collected."), A6.3, A9.1, A9.3.
     - Planned: A4.3, A5.2, A6.4 ("They wait on Edge pipelines, Index replication and Search head clustering (S6, S8, S11), not deployed.").
     - Weakest branch: A9, "2 of its 3 parts are not supported: Raise findings and Update tickets."
     - A6.1 is performed by ON-9, ON-10 and ON-11 (Security operations centre), with the Splunk platform team.
   - **SvcV-5:**
     - Summary: 25 mappings, 36 functions, 1 activity supported, 7 partly, 4 services not deployed (S6, S8, S11, S12).
     - The panel reads "16 of 36 functions realised".
     - Footer: A2 3 of 5, A3 0 of 3, A4 4 of 5, A5 1 of 2, A6 5 of 10, A7 1 of 5, A8 2 of 2 (Supported), A9 0 of 4.
     - Findings name S1.3, S2.3, S13.1 and S13.3 ("And 1 more."). "A5 depends on S7 Indexing alone", "A9 depends on S13 Cases and playbooks alone".
   - **CV-6:**
     - Summary: 28 mappings, 2 activities covered (A7, A8), 6 with a gap, 1 outside the platform.
     - Coverage: A2 0 of 3, A3 0 of 3, A4 1 of 2, A5 2 of 3, A6 2 of 6, A7 5 of 5, A8 3 of 3, A9 0 of 3 in topology.
     - Findings:
       - A4.2, A4.3, A6.3 and A9.1 have no capability in the topology;
       - the check that A4.2 Mask personal information is supported while C1.4 is planned ("CV-2 says: No Edge or Ingest Processor on a path.");
       - C2.2, C4.2, C8.1, C8.2 and C8.3 are in the topology, but A6.2, A7.2 and A7.3 are not fully supported.
3. **Default topology:**
   - **OV-5a:**
     - Summary: 2 supported, 4 partly, 15 planned, 0 not supported, 2 with no sources (A1.2, A1.3), 3 performing teams.
     - A1 is Supported. A2 to A5 are Partly, and A6 to A9 are Planned.
     - The Planned finding names 13 services that aren't deployed.
   - **SvcV-5:**
     - Summary: 0 activities supported, 4 partly, 4 planned, 13 services not deployed.
     - The panel reads "6 of 36 functions realised".
     - Findings: A4 and A5 depend on S7 Indexing alone.
   - **CV-6:**
     - Summary: 0 covered, 4 with a gap, 4 not covered (A6 to A9).
     - Findings: "C1.1 and C3.1 are in the topology, but A2.1, A3.1 and A4.1 are not fully supported."
4. **Edits**, applied in turn from the reference topology:

   | Edit | OV-5a and SvcV-5 | CV-6 (with the section 5 fix) |
   |---|---|---|
   | Connect Heavy Forwarder 1 to Indexer 1 | S2.3 becomes Realised; A3.1 stays Partly | C1.3 becomes In topology |
   | Connect Universal Forwarder 2 to Indexer 1 | S1.2 and S7.1 become Realised; A3.1 and A3 become Supported | C1.1 becomes In topology |
   | Connect Windows Event Log 1 to Universal Forwarder 1 | S1.3 becomes Realised; A1.2, A2.2 and A1 become Supported | C1.2 becomes In topology |
   | Add an ES search head | S12 is deployed; S9.3 and S10.2 become Realised; A6.2 becomes Supported; A6.3 and A9.1 become Partly | C5.1 to C5.3 become Partial |
   | Link the ES search head to SOAR | S13.1 becomes Realised | C6.1 becomes In topology |

   Without the fix, the first three edits leave C1.1, C1.2 and C1.3 Partial.
5. **Interaction:**
   - Every activity, part, service, capability and cell opens its panel.
   - Esc clears the selection.
   - View chips open their tabs.
6. **Pack and print:**
   - OV-5a follows OV-3, SvcV-5 follows SvcV-4, and CV-6 follows CV-2.
   - The tree fits the page.
   - Chips print as text.
7. **Layout:**
   - No page-level sideways scroll at 400px or 768px.
   - The tree becomes an outline under 760px.
   - Dark and light are both readable.

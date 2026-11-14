# Builder handoff: event types, tags and CIM data models in the Config view

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 221: Build 220 with the Config view handoff, [`builder-handoff-config-follow-install.md`](builder-handoff-config-follow-install.md), applied. If Build 221 isn't out yet, apply that handoff first.
**Applied:** as Build 222, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, after the Config view handoff as Build 221, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**28 in-place edits,** under "The edits": 17 in `<script id="config-view-v205">`, 7 in `<script id="config-type-map-v217">`, 2 in `<script id="config-app-packages-v219">` and 2 in `<script id="config-follow-install-v221">`. Each old string occurs exactly once in Build 221, each edit is on a line of its own, and none changes the number of lines.
**Two new blocks, after `<script id="config-follow-install-v221">`:**
- `<style id="config-event-types-v222-styles">`, containing [`docs/mockups/event-types-cim-prototype.css`](mockups/event-types-cim-prototype.css);
- then `<script id="config-event-types-v222">`, containing [`docs/mockups/event-types-cim-prototype.js`](mockups/event-types-cim-prototype.js).

The edits and the blocks are also in [`docs/mockups/event-types-cim.diff`](mockups/event-types-cim.diff), a unified diff against Build 221's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.
- **Its line numbers** are Build 221's as the Config view handoff makes it.
- **It puts the blocks straight after `config-follow-install-v221`,** before Build 221's build records. That way its last hunk doesn't depend on how long those records are. Before `</body>`, after the records, works as well.

Make the edits, paste the two files as they are, then add the build records (see "Build records").

**The request:** item 7 of the improvements listed for the Config screen:

> **Event types, tags and CIM data models.** The package's `eventtypes.conf` and `tags.conf` aren't read. With them the Search column could end at the data model: fortigate_traffic → `ftnt_fortigate_traffic` → network, communicate → Network Traffic.

**Mockup (the target):** [`docs/mockups/event-types-cim-mockup.html`](mockups/event-types-cim-mockup.html). Seven scenes have the edits and the blocks applied to Build 221, and the two "Today" scenes are Build 221, each set up by the same steps. The screenshots are `docs/mockups/compare/event-types-cim-*.png`.

**Tested first:** the edits and the blocks were applied to Build 221 and run. The results under "Check before uploading" come from that run.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in six scenes, as it was for Builds 218 and 221. This time all four of its configuration files are used: `default/props.conf`, `transforms.conf`, `eventtypes.conf` and `tags.conf`. It has 35 event types and 26 `tags.conf` stanzas. It isn't in the repository.

## Today, in Build 221

**The two files aren't read as what they are:**
- **Through Upload files, or a drop of files, they are read as props.conf.** `confType` knows `inputs.conf`, `props.conf` and `transforms.conf`, and takes any other file for `props.conf`. With the Fortinet add-on's four files:
  - the panel has "props.conf 3 files";
  - each event type and each `tags.conf` stanza becomes a source type stanza, so the Source type list grows from 10 names to 71, with names like `ftnt_fortigate_traffic` and `eventtype=ftnt_fortigate_traffic`;
  - every `search` line and tag line is "Not a props.conf setting": 91 lines to check.
- **From a folder, or a dropped folder, they are skipped:** "Skipped 2 other files."
- **From an app package they are dropped without a word:** Build 219's and Build 221's package readers take `inputs.conf`, `props.conf` and `transforms.conf` only.

**So nothing reaches the Matrix's stages 116, Event typing, and 117, Tagging,** though their rows name `eventtypes.conf` and `tags.conf`.

**And the source type map's Search column ends at the `props.conf` search-time settings.** Nothing says which event types take a source type's events, what tags they get, or which data models of the Common Information Model (CIM) they feed.

## What Splunk does

From Splunk's documentation:
- **An event type** is a search. Events it matches get `eventtype=<name>` at search time ([eventtypes.conf spec](https://help.splunk.com/en/data-management/splunk-enterprise-admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/eventtypes.conf)).
  - Its search can't have a pipe or a subsearch, and shouldn't be based on a report.
  - Its settings: `search`; `disabled`, 1 to turn it off; `priority`, 1 to 10, the order in which Splunk Web lists an event's event types; `description`; `color`. `tags` is "DEPRECATED - see tags.conf.spec". A `[default]` stanza holds settings for every event type.
  - Event types come before tags, so an event type's search can't use tags.
- **tags.conf** has one `[<fieldname>=<value>]` stanza per field value, each with lines `<tag> = enabled` or `<tag> = disabled`. Values are best URL-encoded where they have a newline, `=` or square brackets ([tags.conf spec](https://help.splunk.com/en/data-management/splunk-enterprise-admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/tags.conf)). An event type's tags are in `[eventtype=<name>]`.
- **The search command's order** is brackets, then `NOT`, then `OR`, then `AND`, and `AND` is implied between terms ([Boolean expressions](https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/expressions-and-predicates/boolean-expressions-with-logical-operators)). So `a b OR c` is `a AND (b OR c)`.
- **Field names are case sensitive** in a search, and field values aren't.
- **A `rename` in props.conf** gives a source type another name at search time. Searches see its events under the new name; the old one is only in `_sourcetype` ([Rename source types at search time](https://help.splunk.com/en/splunk-enterprise/get-data-in/get-started-with-getting-data-in/10.6/configure-source-types/rename-source-types-at-search-time)).
- **A CIM data model's datasets** take the events that carry the tags each requires. The CIM 8.8 documentation gives each data model's tags in a table, such as [Network Traffic's](https://help.splunk.com/en/splunk-enterprise/common-information-model/8.8/data-models/network-traffic): its `All_Traffic` dataset takes events tagged `network` and `communicate`.

## The design

### The panel

- **Two more kinds of file:**

| File | Tab | Letter | Its stanzas, on stage | Their settings |
|---|---|---|---|---|
| `eventtypes.conf` | eventtypes.conf | E, amber | 116, Event typing | Act with their stanza: "↳ 116" |
| `tags.conf` | tags.conf | #, pink | 117, Tagging | Act with their stanza: "↳ 117" |

- **Each kind's files merge in Splunk's precedence order,** as the other kinds do. A local `tags.conf` line `network = disabled` overrides the default's `network = enabled`, and the default line says "Overridden by …".
- **In the view's Matrix,** an event type or a `tags.conf` stanza is one line on its stage, as a transform is: "[ftnt_fortigate_ips] for fgt_utm, fortigate_utm", "[eventtype=ftnt_fortigate_traffic] network, communicate". A stage's detail lists each with its settings.
- **An event type's line says what it does:**
  - "Every event of fgt_traffic and fortigate_traffic gets eventtype=ftnt_fortigate_traffic. tags.conf gives it network and communicate (Splunk_TA_fortinet_fortigate/default/tags.conf line 1). With them, the CIM’s Network Traffic data model takes its events."
  - With a condition: "Events of fgt_utm and fortigate_utm where subtype=ips get eventtype=ftnt_fortigate_ips. …"
  - With no source type in its search: "Events of any source type that match its search get eventtype=acme_errors."
  - With a `tags.conf` stanza that turns no tag on: "tags.conf turns off all its tags (…)" when each of its lines is `disabled`, and "tags.conf turns on none of its tags (…)" otherwise.
- **A `tags.conf` stanza's line says whose tags they are:** "The tags of event type ftnt_fortigate_virus: malware, attack and operations. With them, the CIM’s Malware data model takes those events." For `[sourcetype=…]`, "The tags of every event of source type …"; for any other field, "The tags of events where action=blocked".
- **With a source type chosen,** the panel keeps:
  - the event types whose searches can take its events, by the name a search sees it under. fgt_traffic, renamed fortigate_traffic, keeps fortigate_traffic's;
  - the `tags.conf` stanzas of those event types, and of that source type;
  - an event type whose search names no source type, and a stanza of any other field, for every source type, as a `[default]` props.conf stanza is.
- **The source types an event type names outright,** with no wildcard, join the Source type list. So `eventtypes.conf` and `tags.conf` loaded on their own can be followed in the map.
- **Where they act:** search time, on the Search Head. On an Indexer they have no effect: "Search peers apply the search head’s copy of search-time settings, not their own". On a forwarder they have none. The tiles under the summary count them on the Search Head.
- **Lines to check:**

| Line | Says | Verdict |
|---|---|---|
| An event type with no `search` | "It has no search, so it matches no events." | To check |
| A `search` with a pipe or a subsearch | "An event type’s search can’t hold a pipe (\|), so Splunk doesn’t use it." | No effect |
| `disabled = 1` | "Disabled: this line turns it off." Its stanza: "This event type is disabled by …" | No effect |
| A mistyped setting, `serach` | "Not an eventtypes.conf setting. Did you mean search? Splunk ignores this line." | To check |
| `tags = …` in `eventtypes.conf` | A "Deprecated" chip, and "Deprecated in eventtypes.conf: an event type’s tags go in tags.conf, as [eventtype=acme_old]. This view reads them only there." Its spec doesn't say whether Splunk still applies them, so the line has no verdict | To check |
| `priority`, `description`, `color` | What Splunk Web does with them. They don't change which events match | Takes effect |
| A `tags.conf` stanza that isn't `[field=value]` | "Not a tags.conf stanza: one names a field and a value, such as [eventtype=web_traffic] or [action=blocked]." Its lines: "Its stanza doesn’t name a field and a value, so Splunk doesn’t use it." | To check |
| A tag that is neither `enabled` nor `disabled` | "A tag is turned on with alert = enabled, or off with alert = disabled. This line is neither." | No effect |
| `[eventtype=…]` of an event type the files don't have | "No eventtypes.conf stanza in these files is called acme_nosuch, so these are the tags of an event type defined elsewhere: web." | To check |

- **Uploads:** by name; by what is in a file whose name doesn't say (an `eventtypes.conf` has `search` lines, a `tags.conf` only `[field=value]` stanzas of tags); from a folder or a dropped folder; and from `.spl`, `.tgz`, `.tar.gz`, `.tar` and `.zip` packages. The empty panel names both files.
- **Unchanged:** the "Add …" link still offers only `inputs.conf`, `props.conf` and `transforms.conf`, which the map needs.

### Reading an event type's search

- **Its terms** (`parse` in the new block): `field=value` and the other comparisons, with or without spaces round the operator; `field IN (a, b)`; quoted values; bare words; `` `macros` ``; brackets. `NOT`, `OR` and `AND` in capitals, in the search command's order.
- **For each source type** (`judge`):
  - Its `sourcetype` terms are decided, for the name a search sees it under. Values match in any case, with `*` as a wildcard; `!=` and `NOT` negate.
  - An `eventtype=` term asks what that event type's search asks.
  - What is left is the condition the event type adds, written as the file has it, with brackets where a group sits inside another kind (`show`): "subtype=virus vendor_action!=analytics".
  - A search with no `sourcetype` term at all can take any source type.
- **Not read:** what the other terms test. A condition is shown, not checked against the source type's fields. A macro, or a word, is a condition like any other.

### The source type map

- **The Search column ends with an "Event types" card,** after the `props.conf` settings: the event types that take the source type's events, in the files' order.
  - Each row: the event type, its line, "Every event" or "Where …" with its condition (two lines at most, the whole in its title), and its tags with their `tags.conf` line.
  - When more than three rows have no tags, those fold away: "7 event types add no tags", with their first names. The fold stays as it was left for the visit.
  - A disabled event type is faded: "Disabled by …".
- **A "Tags of field values" card** follows, for the `[sourcetype=…]` stanza of the source type ("Every event of acme:fw") and the stanzas of other fields ("Where action=blocked").
- **A last column, "Data models":** the sixth, or the seventh after an Ingest Processor column.
  - One card per CIM data model the tags fit: "Network Traffic", marked CIM. "Takes events tagged network and communicate. Every event of fortigate_traffic has those tags. From [ftnt_fortigate_traffic]." Then the datasets the tags reach: "Datasets All_Sessions Session_Start VPN Session_End DHCP".
  - A line from each row that feeds it, in a teal of its own.
  - The cards are in the order of the first row feeding each, and each moves down to that row, as the destinations do.
  - When tags reach the source type and complete no data model: "No CIM data model takes fortigate_traffic’s events: their tags, communicate, don’t complete any data model’s."
  - The column's head: "The Common Information Model’s data models these events’ tags fit. Each data model searches the indexes its CIM index macro allows: all of them unless it is set".
- **How a data model is fed:** every event of the source type carries the tags of the rows that take every event. A row that takes only some events adds its own tags to those. A data model takes the events when one of its root datasets' tags is complete, and the row gives at least one of them. The rows taking every event that give the rest feed it too, with their own lines.
- **The summary counts them:** "26 event types", "5 CIM data models".
- **On a component other than the Search Head,** the cards, rows and lines fade, as the other search-time settings do.
- **Below 900 px the columns stack,** and each data model card names what feeds it.
- **A source type no event type or tag reaches** has the map it had: no card, no column, the same HTML as in Build 221. So do fortigate_log's map and the example's.

**With the Fortinet add-on:**

| Source type | Event types | Data models |
|---|---|---|
| fortigate_traffic, and fgt_traffic, renamed to it | 2: `ftnt_fortigate` and `ftnt_fortigate_traffic`, every event | Network Traffic |
| fortigate_utm, and fgt_utm | 9 | Intrusion Detection (ips, anomaly), Malware (virus: both its root datasets), Email (spam, with Filtering), Web (webfilter), Network Traffic (appctrl) |
| fortigate_event, and fgt_event | 26, of which 7 have no tags | Change (8 event types), Authentication (4), Network Sessions (4), Performance (2), Alerts (1) |
| fortigate_anomaly, and fgt_anomaly | 3 | Intrusion Detection |
| fortigate_log, fgt_log | None | None: their events take their other names at index time |

### The CIM's data models

From the CIM 8.8 documentation's tags tables (`CIM` in the new block). A dataset requires its own tags and its root dataset's. The tables print one level below a data model's root datasets, and so does the block. "a or b" takes either tag; "with" joins tags that go together.

| Data model | Root datasets, and their tags | Datasets below them |
|---|---|---|
| Alerts | `Alerts`: alert | None |
| Authentication | `Authentication`: authentication | `Default_Authentication`: default; `Insecure_Authentication`: cleartext or insecure; `Privileged_Authentication`: privileged |
| Certificates | `All_Certificates`: certificate | `SSL`: ssl or tls |
| Change | `All_Changes`: change | `Auditing_Changes`: audit; `Endpoint_Changes`: endpoint; `Network_Changes`: network; `Account_Management`: account; `Instance_Changes`: instance |
| Data Access | `Data_Access`: data and access | None |
| Data Loss Prevention | `DLP_Incidents`: dlp and incident | None |
| Databases | `All_Databases`: database | `Database_Instance`: instance; `Instance_Stats`: stats; `Session_Info`: session; `Lock_Info`: lock; `Database_Query`: query; `Tablespace`: tablespace; `Query_Stats`: stats |
| Email | `All_Email`: email | `Delivery`: delivery; `Content`: content; `Filtering`: filter |
| Endpoint | `Ports`: listening and port; `Processes`: process and report; `Services`: service and report; `Filesystem`: endpoint and filesystem; `Registry`: endpoint and registry | None |
| Event Signatures | `Signatures`: track_event_signatures | None |
| Interprocess Messaging | `All_Interprocess_Messaging`: messaging | None |
| Intrusion Detection | `IDS_Attacks`: ids and attack | None |
| Inventory | `All_Inventory`: inventory and (cpu or memory or network or storage or (system and version) or user or virtual) | `CPU`: cpu; `Memory`: memory; `Network`: network; `Storage`: storage; `OS`: system and version; `User`: user; `Default_Accounts`: default; `Virtual_OS`: virtual; `Snapshot`: snapshot; `Tools`: tools |
| Java Virtual Machines (JVM) | `JVM`: jvm | `Threading`: threading; `Runtime`: runtime; `OS`: os; `Compilation`: compilation; `Classloading`: classloading; `Memory`: memory |
| Malware | `Malware_Attacks`: malware and attack; `Malware_Operations`: malware and operations | None |
| Network Resolution (DNS) | `DNS`: network and resolution and dns | None |
| Network Sessions | `All_Sessions`: network and session | `Session_Start`: start; `Session_End`: end; `DHCP`: dhcp; `VPN`: vpn |
| Network Traffic | `All_Traffic`: network and communicate | None |
| Performance | `All_Performance`: performance and (cpu or facilities or memory or storage or network or (os and uptime) or (os and time and synchronize)) | `CPU`: cpu; `Facilities`: facilities; `Memory`: memory; `Storage`: storage; `Network`: network; `OS`: os; `Uptime`: uptime; `Timesync`: time and synchronize |
| Splunk Audit Logs | `Modular_Actions`: modaction | None |
| Ticket Management | `All_Ticket_Management`: ticketing | `Change`: change; `Incident`: incident; `Problem`: problem |
| Updates | `Updates`: update and status; `Update_Errors`: update and error | None |
| Vulnerabilities | `Vulnerabilities`: report and vulnerability | None |
| Web | `Web`: web | `Proxy`: proxy; `Storage`: storage |

### Not covered

- **Macros.** `macros.conf` isn't read. A macro in an event type's search is a condition, shown as written.
- **What a condition tests.** "Where subtype=ips" is shown, not checked against the fields the source type's events have.
- **Tags that only two partial event types give together.** A data model fed only when an event matches two event types that each take some events isn't found.
- **The data models' index macros and fields.** The CIM app's `cim_<model>_indexes` macros can limit a data model to some indexes, and its fields are filled from the events' own. Neither is in these files.
- **Data models other than the CIM's,** such as one in an app's `datamodels.conf`.
- **Search-time precedence by app.** The files merge in the global order, as the panel does for every search-time setting (item 10 of the list).
- **Wildcards in `tags.conf` stanza values,** which its spec doesn't describe. They are matched as written.

## The edits

In Build 221's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is.

**`<script id="config-view-v205">`:**

- **Line 13,439.** The two new kinds of file, and their letters: E for eventtypes.conf, # for tags.conf.
```
old: const fileTypes=['inputs','props','transforms'],fileLetter={inputs:'I',props:'P',transforms:'T'};
new: const fileTypes=['inputs','props','transforms','eventtypes','tags'],fileLetter={inputs:'I',props:'P',transforms:'T',eventtypes:'E',tags:'#'};
```
- **Line 13,467.** In `elsewhere`: the two new kinds have no list of other files' settings to check against.
```
old: {props:isPropsKey,transforms:isTransformsKey,inputs:isInputsKey}[t](k)
new: {props:isPropsKey,transforms:isTransformsKey,inputs:isInputsKey}[t]?.(k)
```
- **Line 13,490.** In `confType`: a file whose name doesn't say its kind is an eventtypes.conf when it has search lines, and a tags.conf when it has only [field=value] stanzas of tags.
```
old:  return'props'}
new:  return window.configEventTypes222?.kindOf(text)||'props'}
```
- **Line 13,599.** `classify` takes the new kinds' settings to the new block, which gives each its stage.
```
old: const classify={
new: const classify={eventtypes:r=>window.configEventTypes222?.setting(r)||{area:'unknown'},tags:r=>window.configEventTypes222?.setting(r)||{area:'unknown'},
```
- **Line 13,620.** `stanzaMap` does the same for their stanzas.
```
old: const stanzaMap={
new: const stanzaMap={eventtypes:r=>window.configEventTypes222?.stanza(r)||null,tags:r=>window.configEventTypes222?.stanza(r)||null,
```
- **Line 13,655.** At the end of `assignTypes`: the new block works out the event types and tags, the source types each line belongs to, and what each stanza's line says. It can add the source types the event types name outright to the list, so the chosen one is checked against the list after it.
```
old: pm.types=[...found].sort();if(pm.focus!=='all'&&!found.has(pm.focus))pm.focus='all';window.configFollow221?.follow()}
new: pm.types=[...found].sort();window.configEventTypes222?.assign();if(pm.focus!=='all'&&!pm.types.includes(pm.focus))pm.focus='all';window.configFollow221?.follow()}
```
- **Line 13,660.** `chipFor`: in the Matrix, an event type or a tags.conf stanza stands for its lines, as a transform does.
```
old: r.kind==='setting'&&r.file!=='transforms');
new: r.kind==='setting'&&!['transforms','eventtypes','tags'].includes(r.file));
```
- **Line 13,687.** `whyNot`: a disabled event type is not an input.
```
old: return`This input is disabled by
new: return`This ${r.file==='inputs'?'input':'event type'} is disabled by
```
- **Line 13,717.** `targetHtml`: "Not an inputs.conf setting", "Not an eventtypes.conf setting"; and a "Deprecated" chip, for eventtypes.conf's `tags`.
```
old: `Not a ${r.file}.conf setting`}</span>`,invalid:'<span class="propsTag205" data-tone="bad">Not a setting</span>'}
new: `Not ${/^[aeiou]/.test(r.file)?'an':'a'} ${r.file}.conf setting`}</span>`,invalid:'<span class="propsTag205" data-tone="bad">Not a setting</span>',deprecated:'<span class="propsTag205" data-tone="bad">Deprecated</span>'}
```
- **Line 13,723.** `lineNote`: the same, for the line that turns an event type off.
```
old: 'this line turns the input off'
new: `this line turns ${r.file==='inputs'?'the input':'it'} off`
```
- **Line 13,732.** `lineHtml`: an eventtypes.conf or tags.conf setting acts with its stanza, as a transforms.conf setting does.
```
old: const withStanza=r.file==='transforms'&&r.kind==='setting'&&!r.invalid&&isTransformsKey(r.key)&&
new: const withStanza=['transforms','eventtypes','tags'].includes(r.file)&&r.kind==='setting'&&!r.invalid&&(r.file!=='transforms'||isTransformsKey(r.key))&&
```
- **Line 13,751.** The empty panel names the new files.
```
old: Upload inputs.conf, props.conf and transforms.conf files, a Splunk app package
new: Upload inputs.conf, props.conf, transforms.conf, eventtypes.conf and tags.conf files, a Splunk app package
```
- **Line 13,753.** The "Add …" link still offers only the three files the map can't do without.
```
old: missing=fileTypes.filter(k=>!kindFiles(k).length)
new: missing=['inputs','props','transforms'].filter(k=>!kindFiles(k).length)
```
- **Line 13,823.** A stage's detail lists an event type's or a tags.conf stanza's settings under it, as a transform's.
```
old: const keys=r.file==='transforms'&&r.kind==='stanza'?
new: const keys=['transforms','eventtypes','tags'].includes(r.file)&&r.kind==='stanza'?
```
- **Line 13,832.** In `readFiles`: a folder's eventtypes.conf and tags.conf files are read, not skipped.
```
old: if(fromFolder&&!/^(inputs|props|transforms)\.conf$/i.test(path.split('/').pop()))
new: if(fromFolder&&!/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(path.split('/').pop()))
```
- **Line 13,843.** In `walk`: and a dropped folder's.
```
old: if(entry.isFile){if(/^(inputs|props|transforms)\.conf$/i.test(entry.name)
new: if(entry.isFile){if(/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(entry.name)
```
- **Line 13,982.** The Config view shares `suggest`, for a mistyped eventtypes.conf setting.
```
old: window.configView205={counted,parseConf,confType,
new: window.configView205={counted,suggest,parseConf,confType,
```

**`<script id="config-type-map-v217">`:**

- **Line 15,237.** In `build`, the Search column: after the props.conf settings, the event types and tags from the new block; the data models it gives go to the new column, with their lines. The empty Search note shows only when neither is there.
```
old:  if(!cards.search.length)cards.search.push(`<p class="tmEmpty217">No search-time settings in these files for ${esc(T)}: searches see the fields Splunk finds by itself.</p>`);
new:  const kn=window.configEventTypes222?.forType(T,{nid,lineRef,stageChip,effect})||null;if(!cards.search.length&&!kn?.search.length)cards.search.push(`<p class="tmEmpty217">No search-time settings in these files for ${esc(T)}: searches see the fields Splunk finds by itself.</p>`);if(kn){cards.search.push(...kn.search);cards.model=kn.model;edges.push(...kn.edges)}
```
- **Line 15,238.** `build` returns them.
```
old:  return {g,cards,edges,ip}}
new:  return {g,cards,edges,ip,kn}}
```
- **Line 15,262.** In `draw`: the Data models column, last, where event types or tags reach the source type.
```
old:  const {g,cards,edges,ip}=build(T);drawn={g,edges};const phases=ip.count?[...PHASES.slice(0,3),{key:'ingest',name:'Ingest Processor',where:'Splunk Cloud’s Ingest Processor: the pipelines that take this source type. Its path is separate from the parsing tier’s'},...PHASES.slice(3)]:PHASES;
new:  const {g,cards,edges,ip,kn}=build(T);drawn={g,edges};const phases=[...(ip.count?[...PHASES.slice(0,3),{key:'ingest',name:'Ingest Processor',where:'Splunk Cloud’s Ingest Processor: the pipelines that take this source type. Its path is separate from the parsing tier’s'},...PHASES.slice(3)]:PHASES),...(kn?[{key:'model',name:'Data models',where:window.configEventTypes222.where}]:[])];
```
- **Line 15,266.** The summary counts the event types and the data models.
```
old: count(settings('search'),'search-time setting','search-time settings'),ignored?
new: count(settings('search'),'search-time setting','search-time settings'),kn?.events?count(kn.events,'event type','event types'):'',kn?count(kn.models,'CIM data model','CIM data models'):'',ignored?
```
- **Line 15,269.** The grid takes the column, and the column's tiers are the Search column's.
```
old: <div class="tmGrid217${ip.count?' tmSix218':''}">${phases.map((p,i)=>`<section class="tmCol217" data-phase="${p.key}" aria-labelledby="tmCol217-${p.key}"><header class="tmColHead217"><h3 id="tmCol217-${p.key}"><b>${i+1}</b>${p.name}</h3><span class="tmTiers217">${p.key==='ingest'?`<i class="tmIp218${comp()==='ip'?' tmPicked217':''}" title="Ingest Processor">IP</i>`:tiers(p.key,g)}
new: <div class="tmGrid217${ip.count?' tmSix218':''}${kn?' tmModels222':''}">${phases.map((p,i)=>`<section class="tmCol217" data-phase="${p.key}" aria-labelledby="tmCol217-${p.key}"><header class="tmColHead217"><h3 id="tmCol217-${p.key}"><b>${i+1}</b>${p.name}</h3><span class="tmTiers217">${p.key==='ingest'?`<i class="tmIp218${comp()==='ip'?' tmPicked217':''}" title="Ingest Processor">IP</i>`:tiers(p.key==='model'?'search':p.key,g)}
```
- **Line 15,281.** `align`: the data model cards move down to the first row that leads to them, as the destinations do, column by column.
```
old: function align(stacked){const cards=[...root.querySelectorAll('.tmCol217[data-phase="store"]>.tmResult217')];
new: function align(stacked){for(const ph of ['store','model'])alignColumn(stacked,[...root.querySelectorAll(`.tmCol217[data-phase="${ph}"]>.tmResult217`)])}function alignColumn(stacked,cards){
```
- **Line 15,297.** `lines`: an arrowhead for the data model lines, where a map has them.
```
old: const kinds=['name','match','copy','retype','index','route','drop','meta','field','text'];
new: const kinds=['name','match','copy','retype','index','route','drop','meta','field','text',...(drawn.edges.some(e=>e.kind==='model')?['model']:[])];
```

**`<script id="config-app-packages-v219">`:**

- **Line 15,497.** Build 219's package reader takes eventtypes.conf and tags.conf from a .tgz, .tar.gz or .spl package.
```
old: if(!/^(inputs|props|transforms)\.conf$/i.test(name)&&!(/\.spl2?$/i.test(name)))continue;
new: if(!/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(name)&&!(/\.spl2?$/i.test(name)))continue;
```
- **Line 15,501.** And names them when a package has none of the files it reads.
```
old: throw Error('App package contains no inputs.conf, props.conf, transforms.conf or SPL2 pipeline files');return files;
new: throw Error('App package contains no inputs.conf, props.conf, transforms.conf, eventtypes.conf, tags.conf or SPL2 pipeline files');return files;
```

**`<script id="config-follow-install-v221">`:**

- **Line 15,704.** Build 221's zip reader takes them from a .zip.
```
old: const wanted=name=>/^(inputs|props|transforms)\.conf$/i.test(name)
new: const wanted=name=>/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(name)
```
- **Line 15,730.** And names them likewise.
```
old: if(!out.length)throw Error('App package contains no inputs.conf, props.conf, transforms.conf or SPL2 pipeline files');
new: if(!out.length)throw Error('App package contains no inputs.conf, props.conf, transforms.conf, eventtypes.conf, tags.conf or SPL2 pipeline files');
```

## The new blocks

After `<script id="config-follow-install-v221">`, in this order:

1. **`<style id="config-event-types-v222-styles">`,** containing [`docs/mockups/event-types-cim-prototype.css`](mockups/event-types-cim-prototype.css): the two file letters, the event type rows and tags, the data model cards and their lines, and the grid with the Data models column.
2. **`<script id="config-event-types-v222">`,** containing [`docs/mockups/event-types-cim-prototype.js`](mockups/event-types-cim-prototype.js). It defines `window.configEventTypes222`:

| For | Functions |
|---|---|
| Searches | `lex(search)` splits an event type's search into its pieces, and `parse(search)` makes its terms into a tree. `judge(tree, sourcetype)` decides it for a source type; `show(tree)` writes out what is left. `mentions` and `named` say whether it names source types, and which |
| The CIM | `CIM`, the data models and their datasets' tags. `fits(need, tags)` and `models(tags)` say which datasets and data models a set of tags fits; `needWords` puts a dataset's tags in words |
| The Config view | `setting(line)` and `stanza(line)` give the two new kinds' lines their stages. `assign()` runs at the end of the Config view's analysis. `kindOf(text)` tells an eventtypes.conf or a tags.conf by its text. `tagName(name)` reads a tags.conf stanza's field and value |
| The map | `reach(sourcetype)` gives the rows that reach a source type and the data models they feed. `forType(sourcetype, helpers)` gives the map its cards and lines; `where` is the Data models column's head |

When it loads, it also:
- **listens for `toggle` on `#configTypeMap217`,** to keep each fold of event types as it was left;
- **analyses the files again** if any were read before it loaded.

**It has to come after** `config-view-v205` and `config-type-map-v217`: it reads `window.configView205`, and the map's `#configTypeMap217`, as it loads.

## Build records

After the edits and the blocks, in a new `<script id="event-types-cim-records-v222">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Event types, tags and CIM data models','The Config view reads eventtypes.conf and tags.conf, from files, folders and app packages. Each event type and tags.conf stanza is on its search-time stage, with the source types it takes, its tags and the CIM data models they fit. In the source type map the Search column ends with the event types and tags that reach the chosen source type, and a Data models column shows the Common Information Model data models their tags feed, with a line from each.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 221 did in its records, with Build 222.

## Found while testing (not changed)

Both show on Build 221 too.

1. **The panel's link for missing files reads "Add inputs.conf or props.conf or transforms.conf".** `renderPanel` joins the names with "or" throughout.
2. **The Matrix's stages 116 and 117 show five lines each and "30 more lines".** Stage 116 holds the Fortinet add-on's 35 event types. The rest are in the stage's detail, as for any stage with more than six lines.

This handoff also fixes "Not a inputs.conf setting", which Build 205 wrote for an unknown inputs.conf setting: it is now "Not an inputs.conf setting" (the edit on line 13,717).

## Check before uploading

Run with Build 221 + the edits and the blocks, and with Build 221 for comparison.

### 1. The checks: 64. All pass with the edits; 57 fail on Build 221

| Checks | What they find | Fail on Build 221 |
|---|---|---|
| Reading the files (14) | The Fortinet add-on's four files: four tabs, and the Add link offers inputs.conf. An event type on stage 116 and its search "↳ 116"; its line's sentence, with its tags and data model; one with a condition; one with no tags. A tags.conf stanza on 117 and its tags "↳ 117"; its sentence. The Matrix: five lines and "30 more lines" on 116, five and "21 more lines" on 117. Stage 116's detail: 35 event types, each with its search. With fortigate_traffic chosen, its two event types and one tags.conf stanza; fgt_traffic the same. No effect on a Universal Forwarder or an Indexer (with the reason), takes effect on a Search Head; the Search Head's tile and the summary: 365. No page errors | 13 |
| Lines to check (13) | An event type with no search; a search with a pipe; `serach` ("Did you mean search?"); deprecated `tags`; a disabled event type, with its reason on a Search Head; one with no source type in its search; tags of a missing event type; a stanza that isn't a field and a value, and its line; a tag neither enabled nor disabled, and its event type's line: "tags.conf turns on none of its tags"; "9 to check". No page errors | 12 |
| The map (17) | fortigate_traffic: six columns, "2 event types", "1 CIM data model"; its two rows; the Network Traffic card, word for word, with its one line on its cards. fortigate_utm: 9 rows; five data models in the order of what feeds them, each level with or below the one before; Malware's two root datasets; Email's Filtering; a row's condition. fortigate_event: 26 event types, 7 folded; five data models; 19 lines; the datasets reached; the fold opens in place, and stays open through another source type. fgt_traffic is "searched as fortigate_traffic". fortigate_log has five columns and no event type. Faded on a Universal Forwarder, lines too; not on a Search Head. No page errors | 15 |
| Field-value tags (4) | acme:fw: Network Traffic fed by `[acme_fw_allowed]` (communicate) and `[sourcetype=acme:fw]` (network), with a line from each; the field tags card; a nested event type's condition, "Where action=allowed dest_port=443"; an event type with no source type, "Where error OR failed"; a disabled event type faded, its tags feeding nothing | 4 |
| Local files (4) | A local tags.conf turns `network` off: no data model, and the map says why. A local search narrows the event type: "Where action=accept". The default tag line is overridden. No page errors | 3 |
| Uploads (10) | The empty panel names both files. Both by name, with the Add link for the three others; the source type an event type names joins the list. Two .txt files, by what is in them. A .tgz, a .spl and a .zip package each give up both files, and the map follows them to Network Traffic. A folder's two files are read and its macros.conf skipped. No page errors | 9 |
| 390 px (2) | The columns stack, no line is drawn, the page doesn't scroll sideways, and each data model card names what feeds it. No page errors | 1 |

The 7 that pass on Build 221 too are its no-page-errors checks, and fortigate_log's map, which no event type takes.

**The new block's own functions, in Node:** 62 checks of `parse`, `judge`, `show`, `models`, `needWords`, `kindOf`, `tagName` and `setting`, all pass. Among them, the search command's order: `a b OR c` is `and(a, or(b, c))`, and `NOT a OR b` is `or(not(a), b)`.

### 2. Regression against Build 221

The add-on is loaded with its `props.conf` and `transforms.conf` only, which Build 221 reads. The empty panel's list of files is set back to Build 221's before comparing. Everything else is compared as it is: the HTML of the panel, the Matrix and the map, lines included.

| What is compared | Result |
|---|---|
| View text, every view, no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with no files: its text and the panel's HTML | The same |
| The Config view with the example, for every component and source type choice: the panel's HTML, the Matrix's HTML, the map's HTML and the page's text | 100 of 100 the same |
| The same with the Fortinet add-on, for All components and the Search Head | 88 of 88 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 221 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool, on Build 221 + the edits | Result |
|---|---|
| The Config view handoff's 70 checks | 69 of 70 as written, and 70 on Build 221. The one that fails expects two files from the Fortinet add-on’s `.spl` package, which now gives four: `eventtypes.conf` and `tags.conf` too. With that expectation rewritten: 70 of 70 |
| The source type map's 82 checks, with the expectation the Config view handoff rewrote | 82 of 82 |
| The splits' 40 checks (Build 218's handoff) | 40 of 40 |
| Ingest Processor pipelines' 31 checks (the same handoff) | 31 of 31 |
| The space tool | The same output as Build 221 |
| The connector tool | The same output as Build 221 |

### 3. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 221 | With the edits |
|---|---|---|
| The example: a draw | 6.8 ms (5.0 to 8.9) | 6.0 ms (5.2 to 8.8) |
| The example: an analysis | 1.0 ms (0.6 to 1.2) | 1.0 ms (0.7 to 1.3) |
| The add-on’s props.conf and transforms.conf: a draw | 14.7 ms (11.3 to 18.3) | 15.7 ms (11.2 to 20.7) |
| The same: an analysis | 0.7 ms (0.4 to 1.0) | 0.7 ms (0.4 to 1.3) |
| The same, fortigate_event chosen: a draw | 10.8 ms (8.2 to 13.2) | 10.5 ms (7.5 to 15.0) |
| The add-on’s four files: a draw | 16.5 ms (13.8 to 22.0) | 16.0 ms (13.4 to 24.3) |
| The same: an analysis | 17.0 ms (11.0 to 23.6) | 7.8 ms (6.6 to 12.1) |
| The same, fortigate_event chosen: a draw | 10.0 ms (8.2 to 14.9) | 17.4 ms (12.5 to 23.2) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 5.7 ms (4.0 to 8.0) | 4.9 ms (4.0 to 7.1) |
| The same: an analysis | 105.6 ms (81.0 to 139.2) | 103.7 ms (83.9 to 142.6) |

- **Without `eventtypes.conf` or `tags.conf`,** the edits add no work that shows: each median is within the other page's spread.
- **With the add-on's four files,** Build 221 reads `eventtypes.conf` and `tags.conf` as `props.conf`, so its figures are for different work.
- **The new work that shows is the map's:** with fortigate_event chosen, the four files take 17.4 ms to draw, against 10.5 ms with `props.conf` and `transforms.conf` alone. That is its 26 event types, five data model cards and 19 lines.

The perf tool wasn't run: it times the Builder.

### 4. The builds

`index.html` as committed:
- **Build 221** is Build 220 with the Config view diff and that handoff's records, byte for byte the page its checks ran on here.
- **Build 222** is the tested page with this handoff's records.

On each, the page title, the build number and date, the ⓘ text and the change register name the build, with no page errors: 7 of 7 checks on Build 221, 8 of 8 on Build 222. The new checks pass on Build 222 as on the tested page: 64 of 64.

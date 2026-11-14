# Builder handoff: lookup checks in the Config view

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 222.
**Applied:** as Build 223, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**13 in-place edits,** under "The edits": 9 in `<script id="config-view-v205">`, 2 in `<script id="config-type-map-v217">`, 1 in `<script id="config-app-packages-v219">` and 1 in `<script id="config-follow-install-v221">`. Each old string occurs exactly once in Build 222, each edit is on a line of its own, and none changes the number of lines.
**Two new blocks, after `<script id="config-event-types-v222">`:**
- `<style id="config-lookups-v223-styles">`, containing [`docs/mockups/lookup-checks-prototype.css`](mockups/lookup-checks-prototype.css);
- then `<script id="config-lookups-v223">`, containing [`docs/mockups/lookup-checks-prototype.js`](mockups/lookup-checks-prototype.js).

The edits and the blocks are also in [`docs/mockups/lookup-checks.diff`](mockups/lookup-checks.diff), a unified diff against Build 222's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`. It puts the blocks straight after `config-event-types-v222`, before Build 222's build records, so its last hunk doesn't depend on how long those records are.

**The request:** item 9 of the improvements listed for the Config screen:

> **Lookup checks.** The lookup CSVs in the package aren't read, so the screen can't say whether a lookup's file is there or whether the fields a LOOKUP- line names are in it.

**Mockup (the target):** [`docs/mockups/lookup-checks-mockup.html`](mockups/lookup-checks-mockup.html). Six scenes have the edits and the blocks applied to Build 222, and the two "Today" scenes are Build 222, each set up by the same steps. The screenshots are `docs/mockups/compare/lookup-checks-*.png`.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in four scenes, as its package: its configuration files and its four lookup files. It isn't in the repository.

## Today, in Build 222

- **An app package's `lookups` folder is dropped:** the package readers take configuration and SPL2 files only.
- **From a folder, the lookup files are among the "Skipped … other files".**
- **A `.csv` picked on its own is read as `props.conf`:** `confType` takes any file it doesn't know for `props.conf`. With `lk_codes.csv` picked, the panel has "props.conf 1 file", "0 settings" and "3 to check": each of its lines is "Not a setting", because "There’s no “=”, so Splunk can’t read this line."
- **So a `LOOKUP-` line says only which lookup it runs:** "[ftnt_action_lookup] → 115: lookup table ftnt_action_info.csv." Nothing says whether that file is there, or whether `ftnt_action` and `action` are its columns.

## What Splunk does

From Splunk's configuration file reference:
- **A `LOOKUP-` line** in [props.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.4-configuration-file-reference/props.conf) names a lookup, then the lookup's fields it matches on, each optionally `AS` the event's field, then optionally `OUTPUT` or `OUTPUTNEW` and the fields it copies into the event, each optionally `AS` another name.
  - With no output list, every field of the lookup but the ones it matches on (and its time field) is output.
  - `OUTPUTNEW` writes a field only where the event doesn't have it already.
- **The lookup** is a stanza of [transforms.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.4-configuration-file-reference/transforms.conf).
  - `filename` names a CSV file, which Splunk looks for in an app's `lookups` folder or in `etc/system/lookups`.
  - `collection` names a KV store collection, and `external_cmd` a script; those name their fields in `fields_list`.
  - `match_type` can make a field match with `WILDCARD(<field>)` or `CIDR(<field>)`, and `time_field` names the field that holds each row's time.
- **A CSV lookup's first row names its fields.** `| inputlookup <file>` lists them as Splunk reads them.
- **Field names are case sensitive.**

## The design

### Reading lookup files

- **Which files:** a `.csv` or `.csv.gz` in a `lookups` folder, from an app package, a folder or a dropped folder; or a `.csv` or `.csv.gz` picked on its own. The `lookups` folders Splunk doesn't merge with the instance's own (each user's, and those it sends to other instances) are left out, as their configuration files are.
- **What is kept:** each file's path, its app, its columns as its header writes them, and its rows. Quotes come off a column's name; spaces round it stay. Rows are records after the header: a quoted line break doesn't end one, and a blank line isn't one. Over 20 MB, only the header is read and the rows aren't counted. A `.csv.gz` is opened with the browser's `DecompressionStream`.
- **Whose:** the folder above the `lookups` folder names the app; `etc/system/lookups` is the system's. A file picked on its own has no app.
- **Apps read whole:** an app read from a package or a folder is known to lack a file it doesn't have. With files picked one by one, nothing is known to be missing.
- **Errors:** "empty.csv has no header row", "bin.csv isn't a text file", with the other upload errors.

### What the panel says

- **A lookup's file** is looked for in its own app's `lookups` folder, then among files picked on their own, then in another app's.

| Line | Says | Verdict |
|---|---|---|
| `filename`, the file found | "Splunk_TA_fortinet_fortigate/lookups/ftnt_event_action_info.csv: 52 rows, with the columns subtype, “ vendor_action”, “ vendor_status”, “ action” and “ change_type”." | As before |
| `filename`, in another app | "Splunk_TA_acme/lookups/ has no shared_codes.csv, but Z_shared/lookups/ has: Splunk finds it there only if Z_shared shares it with other apps. 1 row, with the columns code and label." | As before |
| `filename`, not in an app read whole | "Splunk_TA_acme/lookups/ has no acme_names.csv: it has acme_geo.csv, acme_users.csv and unused.csv. Splunk can’t use this lookup unless another app shares a file of that name." | To check |
| `filename`, not among the files read | "None of the lookup files read is called x.csv. Add the app’s lookups folder or the file to check it." | As before |
| `LOOKUP-`, all its fields there | "It matches on ip (the event’s src), and outputs country and city. All are columns of acme_geo.csv." | As before |
| `LOOKUP-`, no output list | "…, and outputs the other columns: country and city." | As before |
| `LOOKUP-`, `OUTPUTNEW` | "…, and outputs Country, unless the event has it already." | As before |
| `LOOKUP-`, a field that isn't a column | "acme_geo.csv has no column ipp: did you mean ip?" | To check |
| `LOOKUP-`, another case | "acme_geo.csv’s column is ip, not IP: field names are case sensitive." | To check |
| `LOOKUP-`, a column written with spaces | "ftnt_action_info.csv’s header writes “ action”, with a space before it. Run \| inputlookup ftnt_action_info.csv to see whether Splunk reads it as action." | To check |
| `LOOKUP-`, a KV store or external lookup | "All are in its fields_list.", or "Its fields_list has no field …" | As before, or to check |
| `LOOKUP-`, no field to match on | "It names no field to match on, so Splunk can’t run this lookup." | To check |
| `LOOKUP-`, its lookup's file missing | "Its file isn’t there: see Splunk_TA_acme/default/transforms.conf line 13." The `filename` line is the one to check | As before |
| `match_type`, `time_field` | "ip is a column of acme_geo.csv.", or "acme_users.csv has no column usr: did you mean user?" | As before, or to check |

- **Each sentence follows the line's own note,** so a `LOOKUP-` line still starts "[ftnt_action_lookup] → 115: lookup table ftnt_action_info.csv."
- **Spaces round a column's name:** whether Splunk keeps them isn't settled here, so the line is to check, with the search that shows how Splunk reads the file. The Fortinet add-on's `ftnt_action_info.csv` and `ftnt_event_action_info.csv` write a space after each comma of their headers, which makes four of its `LOOKUP-` lines to check.
- **A lookups tab,** L, after the configuration file kinds, when lookup files are read:
  - its list of files, each with its app and a Remove link;
  - each file's columns as its header writes them (a name with spaces round it is marked), its rows, the lookups that use it with their lines, and the `LOOKUP-` lines that run them, or "No transforms.conf stanza in these files names it. A search can still read it with | inputlookup unused.csv.";
  - the arrow keys, Home and End move along every tab, this one too.
- **With lookup files only,** the empty panel says "Read 1 lookup file: lk_codes.csv. Add the transforms.conf that defines its lookup and the props.conf that runs it, or the app’s package or folder." before its usual text.
- **Clear and the example** forget the lookup files and the apps read whole. Remove takes one file away, and the lookups are checked again.

### The source type map

Under each lookup a `LOOKUP-` line runs, in the Search column:
- **Its fields there:** "137 rows · proto → transport, protocol" (a KV store lookup: "asset → owner, site"), in green.
- **Not:** "No column ipp", "ip, not IP", "“ action” has spaces", "Not in Splunk_TA_acme/lookups/" or "Names no field to match on", in red.
- **Nothing known:** no note, as in Build 222.
- **Drawn again** when lookup files are added or removed, as when configuration files are: the map compares the lookups' version with what it last drew.

### Uploads

- **The picker** offers `.csv` files.
- **The empty panel** names them, where it says what can go with the configuration files: "An Ingest Processor pipeline’s SPL2 file (.spl2) can go with them, for the source type map, and an app’s lookup files (.csv), to check its lookups."

### Unchanged

With no lookup file read and no app read whole (files picked one by one, the example, `load()`), every view, the panel and every map are as in Build 222.

### Not covered

- **Sharing.** Whether another app shares a lookup file is in its `metadata` folder, which isn't read: a file in another app is found, with a note that it must be shared.
- **Lookups that searches use** with `| lookup` or `| inputlookup`. Only `LOOKUP-` lines are checked.
- **The rows' values.** A `CIDR()` field's values aren't checked to be ranges, nor a `time_field`'s to be times.
- **KV store collections** in `collections.conf`. A KV store lookup is checked against its `fields_list` only.
- **A dropped folder** goes through the same reader as Upload a folder, but no check drops one: the browser's drop can't be scripted here.

## The edits

In Build 222's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is.

**`<script id="config-view-v205">`:**

- **Line 13,655.** `assignTypes`, at the end of each analysis: the lookups are checked once every line has its stage and note.
```
old: window.configEventTypes222?.assign();
new: window.configEventTypes222?.assign();window.configLookups223?.check();
```
- **Line 13,704.** The file picker offers .csv files.
```
old: accept:'.conf,.txt,.spl2,
new: accept:'.conf,.txt,.csv,.spl2,
```
- **Line 13,751.** The empty panel names lookup files, and says which were read when they are all that is.
```
old: 'Upload inputs.conf, props.conf, transforms.conf, eventtypes.conf and tags.conf files, a Splunk app package (.spl, .tgz, .tar.gz, .tar or .zip), or an app or etc folder, or drop them here. App packages are opened locally; their configuration paths and default/local precedence are preserved. An Ingest Processor pipeline’s SPL2 file (.spl2) can go with them, for the source type map.
new: (window.configLookups223?.waiting()||'')+'Upload inputs.conf, props.conf, transforms.conf, eventtypes.conf and tags.conf files, a Splunk app package (.spl, .tgz, .tar.gz, .tar or .zip), or an app or etc folder, or drop them here. App packages are opened locally; their configuration paths and default/local precedence are preserved. An Ingest Processor pipeline’s SPL2 file (.spl2) can go with them, for the source type map, and an app’s lookup files (.csv), to check its lookups.
```
- **Line 13,763.** `renderPanel`, at its end: the lookups tab, and the lookup files when it is chosen.
```
old:  bindPanel()}
new:  bindPanel();window.configLookups223?.decorate(panel)}
```
- **Line 13,770.** Clear forgets the lookup files too.
```
old: window.configPipelines218?.clear();pm.files=[];
new: window.configPipelines218?.clear();window.configLookups223?.clear();pm.files=[];
```
- **Line 13,830.** `readFiles`: the apps read whole from a package or a folder, whose lookups folder is then known, even when there is none.
```
old: list=expanded;
new: list=expanded;window.configLookups223?.seen(list);
```
- **Line 13,831.** `readFiles`: a lookup file goes to the new block, before the 2 MB limit for configuration files.
```
old: for(const {file,path} of list){const fromFolder=path.includes('/');
new: for(const {file,path} of list){const fromFolder=path.includes('/');if(window.configLookups223?.takes(path)){const e=await window.configLookups223.add(file,path);if(e)errors.push(e);continue}
```
- **Line 13,843.** `walk`, for a dropped folder: its lookup files are taken.
```
old: if(entry.isFile){if(/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(entry.name)||
new: if(entry.isFile){if(/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(entry.name)||window.configLookups223?.takes(entry.fullPath.replace(/^\//,''))||
```
- **Line 13,983.** `load`, which the example uses: it replaces the lookup files as it replaces the configuration files.
```
old: load(files){pm.files=[];pm.seq=0;
new: load(files){pm.files=[];pm.seq=0;window.configLookups223?.clear();
```

**`<script id="config-type-map-v217">`:**

- **Line 15,234.** The Search column: under a lookup a LOOKUP- line runs, its rows and fields, or what is wrong with them.
```
old: .map(y=>`: <code>${esc(y.key)} = ${esc(cv.shown(y))}</code>`).join('')}</span>`}).join('');
new: .map(y=>`: <code>${esc(y.key)} = ${esc(cv.shown(y))}</code>`).join('')}${window.configLookups223?.mapNote(r,name)||''}</span>`}).join('');
```
- **Line 15,256.** `draw`: the map draws again when the lookup files change, as it does when the configuration files do.
```
old: pipes?.version||0]);
new: pipes?.version||0,window.configLookups223?.version()||0]);
```

**`<script id="config-app-packages-v219">`:**

- **Line 15,497.** The tar reader (.spl, .tgz, .tar.gz, .tar) takes lookup files.
```
old: if(!/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(name)&&!(/\.spl2?$/i.test(name)))continue;
new: if(!/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(name)&&!(/\.spl2?$/i.test(name))&&!window.configLookups223?.takes(path))continue;
```

**`<script id="config-follow-install-v221">`:**

- **Line 15,718.** The zip reader takes them too.
```
old: if(!wanted(name))continue;
new: if(!wanted(name)&&!window.configLookups223?.takes(path))continue;
```

## The new blocks

After `<script id="config-event-types-v222">`, in this order:

1. **`<style id="config-lookups-v223-styles">`,** containing [`docs/mockups/lookup-checks-prototype.css`](mockups/lookup-checks-prototype.css): the lookups tab's letter, the marked column names, and the map's notes.
2. **`<script id="config-lookups-v223">`,** containing [`docs/mockups/lookup-checks-prototype.js`](mockups/lookup-checks-prototype.js). It defines `window.configLookups223`:

| For | Functions |
|---|---|
| Reading | `takes(path)` says whether a file is a lookup file. `add(file, path)` reads one, `put(path, text)` takes its text, and `seen(list)` notes the apps read whole. `header(text)` and `countRows(text)` read a CSV. `appOf(path)` names its app |
| Checking | `check()` runs at the end of the Config view's analysis. `parseLookup(value)` reads a `LOOKUP-` line, `find(columns, field)` finds a field among columns, and `fileFor(lookup)` finds a lookup's file |
| The panel and the map | `decorate(panel)` adds the lookups tab after the panel draws; `waiting()` is the empty panel's sentence; `mapNote(line, lookup)` is the map's note |
| Scripts | `load(files, {complete})` reads lookup files by path, and `clear()` forgets them |

When it loads, it also listens on `#configView205` for clicks on the tabs and the Remove links, and for the arrow keys on the tabs.

**It has to come after** `config-view-v205`: it reads `window.configView205` as it loads.

## Build records

After the edits and the blocks, in a new `<script id="lookup-checks-records-v223">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Lookup checks','The Config view reads the lookup files of an app’s lookups folder, from packages, folders and .csv files picked on their own. It says whether each lookup’s file is there, with its rows and columns, and whether the fields each LOOKUP- line names are its columns, in the panel, in a lookups tab that lists the files, and in the source type map.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 222 did in its records, with Build 223.

## Check before uploading

Run with Build 222 + the edits and the blocks, and with Build 222 for comparison.

### 1. The checks: 54. All pass with the edits; 45 fail on Build 222

| Checks | What they find | Fail on Build 222 |
|---|---|---|
| The add-on's package (12) | A lookups tab with its four files; its configuration files counted as before; four lines to check. `LOOKUP-fortigate_traffic_action`'s note, word for word; `LOOKUP-fortigate_event_action`'s, with four fields written with a space and one the event names differently; `LOOKUP-fortigate_severity`'s, all there. A `filename` line's path, rows and columns. The tab: the files with their apps, each file's columns and rows, what uses it, and the tab chosen alone. No page errors | 10 |
| An app with mistakes (16) | A `LOOKUP-` line with all its fields; a typo, with the nearest; another case, and `OUTPUTNEW`; no output list; a column with a space; a KV store lookup's `fields_list`; a lookup whose file isn't there; a file in another app; no field to match on. A file missing from an app read whole; one in another app; `match_type` and `time_field`; seven to check; a file no lookup names. No page errors | 15 |
| The map (8) | fortigate_traffic: a lookup with its fields there, and one with “ action”. fortigate_log's map has no note. acme:fw's lookups, each as it is, a typo and a case among them. Lookup files added after the configuration files show in the map at once. The example has no note and no lookups tab. No page errors | 5 |
| Uploads (11) | A `.tgz`'s and a `.zip`'s lookups folders. A package with no lookups folder: its lookup's file isn't there. A folder's lookup files, with its other files skipped. A `.csv` picked on its own, matched by its name and listed so. A `.csv.gz`. The picker and the empty panel. Lookup files on their own. A file with no header row and one that isn't text. No page errors | 10 |
| The tab (5) | The arrow keys, Home and End along the tabs; choosing a configuration tab; Remove, and the lookup checked again; Clear. No page errors | 4 |
| 390 px (2) | The lookups tab fits. No page errors | 1 |

The 9 that pass on Build 222 too are its 6 no-page-errors checks, and three that find something unchanged: the package’s configuration files are counted as before; fortigate_log’s map has no lookup; the example has no lookup note and no lookups tab.

**The new block's own functions, in Node:** 41 checks of `header`, `countRows`, `parseLookup`, `find`, `takes` and `appOf`, all pass.

### 2. Regression against Build 222

The add-on is loaded with its `props.conf` and `transforms.conf`, by `load()`, as before: no lookup file and no app read whole. The empty panel's hint is set back to Build 222's before comparing. Everything else is compared as it is: the HTML of the panel, the Matrix and the map, lines included.

| What is compared | Result |
|---|---|
| View text, every view, no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with no files: its text and the panel's HTML | The same |
| The Config view with the example, for every component and source type choice: the panel's HTML, the Matrix's HTML, the map's HTML and the page's text | 100 of 100 the same |
| The same with the Fortinet add-on, for All components and the Search Head | 88 of 88 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 222 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool, on Build 222 + the edits | Result |
|---|---|
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) | 64 of 64 |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote | 70 of 70 |
| The source type map's 82 checks | 82 of 82 |
| The splits' 40 checks (Build 218's handoff) | 40 of 40 |
| Ingest Processor pipelines' 31 checks (the same handoff) | 31 of 31 |
| The space tool | The same output as Build 222 |
| The connector tool | The same output as Build 222 |

### 3. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 222 | With the edits |
|---|---|---|
| The example: a draw | 6.0 ms (5.0 to 8.5) | 6.3 ms (4.7 to 9.2) |
| The example: an analysis | 0.9 ms (0.6 to 1.2) | 1.1 ms (0.7 to 1.3) |
| The add-on’s props.conf and transforms.conf: a draw | 12.3 ms (10.9 to 15.0) | 14.4 ms (10.3 to 19.0) |
| The same: an analysis | 0.6 ms (0.4 to 0.9) | 0.7 ms (0.4 to 1.2) |
| The same, fortigate_event chosen: a draw | 9.0 ms (7.3 to 12.5) | 8.7 ms (7.4 to 14.2) |
| The add-on’s four configuration files: a draw | 15.4 ms (12.6 to 23.2) | 16.1 ms (12.5 to 23.8) |
| The same: an analysis | 8.0 ms (6.4 to 11.8) | 7.2 ms (6.2 to 11.7) |
| The same, fortigate_event chosen: a draw | 15.2 ms (12.1 to 21.7) | 16.2 ms (12.5 to 21.7) |
| The same and its four lookup files: a draw | 16.2 ms (11.9 to 23.0) | 15.7 ms (12.9 to 22.1) |
| The same: an analysis | 6.9 ms (5.5 to 10.7) | 6.9 ms (5.5 to 10.8) |
| The same, fortigate_traffic chosen: a draw | 8.1 ms (6.0 to 10.7) | 7.8 ms (6.7 to 11.1) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 5.2 ms (3.8 to 7.0) | 5.1 ms (4.1 to 7.2) |
| The same: an analysis | 93.7 ms (81.9 to 123.1) | 94.5 ms (71.8 to 126.9) |

- **Without lookup files,** the edits add no work that shows: each median is within the other page's spread.
- **With the add-on's lookup files,** Build 222 has no lookups to read, so its figures are for less work. With the edits, an analysis of the four files and their lookup files takes 6.9 ms, against Build 222's 6.9 ms, which reads no lookup file: checking them adds nothing that shows.

The perf tool wasn't run: it times the Builder.

### 4. The build

`index.html` as committed, Build 223, is the tested page with this handoff's records. Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks. The new checks pass on Build 223 as on the tested page: 54 of 54.

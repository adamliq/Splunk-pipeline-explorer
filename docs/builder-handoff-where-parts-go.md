# Builder handoff: What each tier gets, under Where it acts

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 227.
**Applied:** as Build 228, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="config-parts-v228">` (211 lines), after `config-try-v227`, containing [`docs/mockups/where-parts-go-prototype.js`](mockups/where-parts-go-prototype.js). It sets `window.configParts228`.
- `<style id="config-parts-v228-styles">` (28 lines), after `config-try-v227-styles`.

**Nine in-place edits,** under "The edits": two in each package reader, `config-app-packages-v219`'s `expand` and `config-follow-install-v221`'s `unzip`; four in `config-view-v205`, two in `readFiles`, one in `loadExample` and one where the panel is drawn; and one in `config-tools-v224`'s `clear`. Each old string occurs exactly once in Build 227, none changes the number of lines, and each is on a line of its own.

The edits, the block and the styles are also in [`docs/mockups/where-parts-go.diff`](mockups/where-parts-go.diff), a unified diff against Build 227's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** item 25 of the earlier list:

> 25. Where each part goes. Sort a package's settings by the tier that runs them:
> - forwarders: inputs and `EVENT_BREAKER_*`;
> - indexers or heavy forwarders: parsing and `TRANSFORMS-`;
> - search heads: everything at search time.
>
> For the Fortinet add-on, that's 6 lines for forwarders and 16 for indexers. Search heads get the rest: 89 aliases, 78 calculated fields, 7 lookups, 35 event types with their tags, and 16 macros. The Config view doesn't show this today.

Two corrections to the item:
- **Build 221's "Where it acts" already counts the lines on each tier.** For the add-on: 6 lines on a Universal Forwarder, 21 on a Heavy Forwarder, 21 on an Indexer and 365 on a Search Head, with 21 more for the Search Head's own data. It doesn't say which stages they're on, and it says nothing about the package's other files.
- **21 lines act on heavy forwarders or indexers, not 16.** The 16 counted props.conf only. The index-time transform's stanza in transforms.conf, and its four settings, act there too.

**Sources:**
- Splunk Enterprise 10.0 Admin Manual, [Configuration parameters and the data pipeline](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.0/administer-splunk-enterprise-with-configuration-files/configuration-parameters-and-the-data-pipeline): the settings each phase reads, and which components run each phase. "Each configuration belongs on only one component, specifically, the first component in the deployment that handles that phase."
- Splunk Packaging Toolkit 1.2.4, [`splunk-packaging-toolkit` on PyPI](https://pypi.org/project/splunk-packaging-toolkit/): the `@placement` notes in its `.conf.spec` files, the rules its partitions follow for an app's other files, and how it reads `app.manifest`'s `targetWorkloads`. Its source was read, not run.

**Mockup (the target):** [`docs/mockups/where-parts-go-mockup.html`](mockups/where-parts-go-mockup.html).
- Four scenes have the edits applied to Build 227.
- The "Today" scene is Build 227.
- Each is set up by the same steps on both pages.
- The screenshots are `docs/mockups/compare/where-parts-go-*.png`.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in three scenes, as its package. It isn't in the repository, because Splunk licenses it.

**Two made-up packages,** `TA_parts_a.tgz` and `TA_parts_b.zip`, cover the other kinds of file and both manifest warnings. Their files are under "The made-up packages" below.

## Today, in Build 227

- **Where it acts gives totals only.** It counts the lines that take effect on each tier, but not by stage.
- **A package's other files are dropped unread.** Build 227 keeps a package's inputs.conf, props.conf, transforms.conf, eventtypes.conf and tags.conf, its lookup files, metadata and samples. The add-on's macros.conf, app.conf, navigation, static files, README, licenses and app.manifest go unseen.
- **An etc folder's other files are only counted.** The made-up packages as an etc folder give "Skipped 15 other files."
- **app.manifest isn't read,** so nothing compares its `targetWorkloads` with the tiers its files act on.

## The design

### What each tier gets

Under Build 221's "Where it acts", a table for each app: **What each tier gets from** the app, with its count of lines by stage and of other files. The tables sit between Where it acts and the file tabs. Each table's columns are Part, then the four tiers: Universal Forwarder, Heavy Forwarder, Indexer and Search Head.
- Lines in files with no app get a table headed "What each tier gets"; etc/system's, one headed "from etc/system". These come last.
- Up to three tables start open; with more, they start closed. One the person opens or closes stays so as the panel draws again.
- Below 620 px, a table scrolls in its own box.

### The lines, by stage

Each line Build 221 counts (the highest-precedence line of each setting, on a pipeline stage), by the stage it's on, in the pipeline's order. For each tier, the number of lines that take effect there, as Build 221 counts them. **+n** is lines that act there only for data that tier reads itself: a Search Head's own logs, parsed where it reads them.
- The stage's name is a button: it shows the stage's row in the Matrix, scrolled to and flashed.
- Under it, what the lines are: their settings by name, most first, or for event types and tags, how many.
- **In all** sums the stages: it is Where it acts, tier for tier.

The Fortinet add-on's table:

| Part | Universal Forwarder | Heavy Forwarder | Indexer | Search Head |
|---|---|---|---|---|
| **11 Event boundary detection**: props.conf: EVENT_BREAKER_ENABLE ×6 | 6 |  |  |  |
| **15 Event aggregation**: props.conf: SHOULD_LINEMERGE ×6 |  | 6 | 6 | +6 |
| **16 Timestamp extraction**: props.conf: TIME_PREFIX ×4 |  | 4 | 4 | +4 |
| **22 Index-time transformations**: props.conf: TRANSFORMS- ×2; transforms.conf: 1 stanza, DEST_KEY, FORMAT, REGEX and SOURCE_KEY |  | 7 | 7 | +7 |
| **27 Event typing & punctuation**: props.conf: ANNOTATE_PUNCT ×4 |  | 4 | 4 | +4 |
| **109 Source type renaming**: props.conf: rename ×4 |  |  |  | 4 |
| **111 Transform field extraction**: props.conf: REPORT- ×5; transforms.conf: 5 stanzas, FORMAT ×4, REGEX ×4, SOURCE_KEY ×4 and DELIMS |  |  |  | 23 |
| **112 Automatic key-value extraction**: props.conf: KV_MODE ×4 |  |  |  | 4 |
| **113 Field aliasing**: props.conf: FIELDALIAS- ×89 |  |  |  | 89 |
| **114 Calculated fields**: props.conf: EVAL- ×78 |  |  |  | 78 |
| **115 Lookups**: props.conf: LOOKUP- ×7; transforms.conf: 4 stanzas and filename ×4 |  |  |  | 15 |
| **116 Event typing**: eventtypes.conf: 35 event types |  |  |  | 70 |
| **117 Tagging**: tags.conf: 26 stanzas and 56 tags |  |  |  | 82 |
| **In all**: 392 lines, as Where it acts counts them | 6 | 21 | 21 | 365 +21 |
| *Its other files, placed as Splunk’s packaging toolkit places them* | | | | |
| `default/macros.conf: 16 macros` |  |  |  | 16 |
| `lookups/: lookup files` |  |  |  | 4 |
| `default/data/ui/nav/: navigation` |  |  |  | 1 |
| `static/: Splunk Web’s files` |  |  |  | 4 |
| `default/app.conf` | 1 | 1 | 1 | 1 |
| `metadata/default.meta` | 1 | 1 | 1 | 1 |

> Not read by Splunk while it runs: EULA.pdf, LICENSES/, README.txt, VERSION, app.manifest, samples/ (11 files). An event generator reads samples/, if one is set up with eventgen.conf. Splunk’s app tools read app.manifest.
>
> Its app.manifest names search heads, indexers and forwarders as its targetWorkloads. Each has parts here, and no tier with parts is left out.

### Its other files

For a package, or an app or etc folder: the files the Config view doesn't read line by line, **placed as Splunk's packaging toolkit places them** when it partitions an app for its three workloads: search heads, indexers and forwarders. Forwarders are both kinds here. Each row says why it goes where it does. Its number is a settings file's stanzas, else its files.

| Part | Tiers | Why |
|---|---|---|
| A settings file the Config view doesn't read, in `default/` or `local/` | Where the toolkit's `@placement` notes for it put any of its settings | A file with no notes, or one the toolkit doesn't know, is kept on every tier: outputs.conf, server.conf |
| `app.conf`, `metadata/` | Every tier | Read wherever the app is installed |
| `lookups/` | Search Head | The toolkit keeps it for search heads, and the Admin Manual lists lookup files in the search phase |
| `static/`, `appserver/`, `default/data/` | Search Head | The toolkit keeps them for search heads. `default/data/` is split by what each folder holds: views, navigation, dashboard panels, data models |
| A `bin/` script an input names (`[script://…bin/x]`, or a modular input's scheme) | Universal and Heavy Forwarder | The toolkit places inputs.conf on forwarders |
| A `bin/` script a search command (`commands.conf` `filename`) or scripted lookup (`external_cmd`) names | Search Head | They run at search time |
| Other `bin/` and `lib/` files | "Where what runs them is" | The toolkit keeps them everywhere |
| `README/x.conf.spec` | Where x.conf goes | The toolkit keeps a spec only with its .conf file |
| Anything else | Every tier | The toolkit keeps what it has no rule for everywhere |

Below the table, **Not read by Splunk while it runs:** README text, licenses, VERSION, samples (an event generator reads them) and app.manifest (Splunk's app tools read it).

Each user's folder (`etc/users`) and the apps an instance sends to others (`deployment-apps`, `manager-apps`, `master-apps`, `shcluster`) are held back, as the Config view holds back their settings files.

### Its app.manifest

Its `targetWorkloads`, read as the toolkit reads them: `_search_heads`, `_indexers` and `_forwarders`, or `*` for all three. None named is every workload, and the toolkit rejects a name it doesn't know.

A workload is **needed** where the app's lines take effect, counting inputs.conf's lines on forwarders only, as the toolkit places it. It's also needed where a rule places one of its files. app.conf, metadata and files kept everywhere for want of a rule don't count: they go wherever the app does.

| Case | What the table says |
|---|---|
| Each named workload is needed, and each needed one named | "Each has parts here, and no tier with parts is left out." |
| A needed workload left out | "It leaves out forwarders, though 7 lines take effect on a Universal Forwarder; …; README/inputs.conf.spec and bin/collect.py go there.", in amber |
| A named workload where nothing acts | "It names indexers and forwarders, where nothing here acts.", in amber |
| `*`, or none named | Every workload: those where nothing acts are said, not flagged |
| A name the toolkit doesn't know | "Splunk's app tools reject _x: they know only _search_heads, _indexers, _forwarders and *.", in amber |
| Not JSON, or `targetWorkloads` not a list | Said, in amber |

### The page's tiers beside the toolkit's placements

Each of 62 settings in the Fortinet add-on and a made-up set of files, its tiers on the page beside the toolkit's placement for it: 50 take effect within that placement, and 12 outside it.
- **5 input-phase settings** act wherever the data is read: `NO_BINARY_CHECK`, `CHECK_METHOD`, `INDEXED_EXTRACTIONS`, `TIMESTAMP_FIELDS` and `FIELD_NAMES`. The toolkit places them on forwarders only.
- **7 settings of index-time transforms,** `REGEX`, `FORMAT`, `DEST_KEY` and `SOURCE_KEY` (three in the made-up set, four in the add-on), act on a heavy forwarder too. The toolkit places transforms.conf's settings on search heads or indexers, though it places props.conf's `TRANSFORMS-` on all three workloads.
- **One the other way round:** the toolkit places `SEGMENTATION` on all three, and it acts on the indexer. `SEGMENTATION-` isn't in the toolkit's spec.

This build keeps Build 221's tiers for lines. The Admin Manual's table has the parsing phase run on a heavy forwarder. The toolkit's partition for forwarders would leave out an index-time transform's `REGEX`, `FORMAT` and `DEST_KEY`, which a heavy forwarder needs to parse. The toolkit's placements are used only for the files the Config view doesn't read line by line.

### Reading packages and folders

- **Each entry of a package,** .tar.gz, .tgz, .spl or .zip, is listed before the reader keeps what it reads. The reader now also keeps app.manifest and the settings files that aren't one of the five kinds, and reads their text.
- **A folder's files** are listed the same way. Those settings files and app.manifest are no longer counted as skipped: the made-up packages as an etc folder give "Skipped 8 other files."
- **A package with nothing but those** still says it has no inputs.conf, props.conf, transforms.conf, eventtypes.conf, tags.conf or SPL2 pipeline files.
- **A settings file over 2 MB** is listed without its count.
- **Clear, `load()` and Try an example forget them.** Try an example shows only when no files are loaded. Files removed one at a time leave a package's other files listed until then, as its lookup files and metadata are.
- **For an etc folder's thousands of files,** the apps and their parts are worked out again only when the files, or the Config view's files and their apps, change.

### Unchanged

- **Lines and their tiers** are Build 221's.
- **What the Config view reads from a package** is as before: the add-on's package gives the same four files.
- **The rest of the panel, the Matrix and the map:** the regression below compares them with the new tables taken out, with the example, the add-on's four files and the add-on's package loaded.

### Not covered

- **Settings files are placed whole,** wherever any of their settings goes. The toolkit splits a file setting by setting when it partitions it.
- **Other tiers:** cluster managers, deployment servers, deployers, license managers and monitoring consoles. The toolkit's three workloads don't include them.
- **Scripts named in other ways** stay "Where what runs them is": alert actions, REST handlers and scripts outside `bin/`.
- **app.manifest's other fields,** such as `supportedDeployments` and dependencies, aren't read.

## The made-up packages

`TA_parts_a.tgz`:

```
── TA_parts_a/app.manifest
{
 "schemaVersion": "2.0.0",
 "info": {
  "id": {
   "name": "TA_parts_a",
   "version": "1.0.0"
  },
  "title": "Parts A"
 },
 "targetWorkloads": [
  "_search_heads",
  "_indexers"
 ]
}
── TA_parts_a/default/app.conf
[launcher]
version = 1.0.0

[ui]
is_visible = 0
── TA_parts_a/default/inputs.conf
[monitor:///var/log/parts/a.log]
sourcetype = parts:a
index = main

[script://./bin/collect.py]
interval = 60
sourcetype = parts:script
── TA_parts_a/default/props.conf
[parts:a]
EVENT_BREAKER_ENABLE = true
SHOULD_LINEMERGE = false
TRANSFORMS-drop = parts_drop
EXTRACT-user = user=(?<user>\w+)
── TA_parts_a/default/transforms.conf
[parts_drop]
REGEX = level=debug
DEST_KEY = queue
FORMAT = nullQueue
── TA_parts_a/default/outputs.conf
[tcpout]
defaultGroup = parts

[tcpout:parts]
server = idx1:9997
── TA_parts_a/default/savedsearches.conf
[Parts errors]
search = sourcetype=parts:a error

[Parts daily]
search = sourcetype=parts:a | stats count
── TA_parts_a/default/indexes.conf
[parts]
homePath = $SPLUNK_DB/parts/db
coldPath = $SPLUNK_DB/parts/colddb
thawedPath = $SPLUNK_DB/parts/thaweddb
── TA_parts_a/metadata/default.meta
[]
access = read : [ * ]
── TA_parts_a/bin/collect.py
print("event")
── TA_parts_a/README/inputs.conf.spec
[script://<name>]
── TA_parts_a/appserver/static/parts.css
body{}
── TA_parts_a/README.md
# Parts A
```

`TA_parts_b.zip`:

```
── TA_parts_b/app.manifest
{
 "schemaVersion": "2.0.0",
 "info": {
  "id": {
   "name": "TA_parts_b",
   "version": "1.0.0"
  },
  "title": "Parts B"
 },
 "targetWorkloads": [
  "_search_heads",
  "_indexers",
  "_forwarders"
 ]
}
── TA_parts_b/default/macros.conf
[parts_b]
definition = sourcetype=parts:b

[parts_b_errors]
definition = `parts_b` error

[parts_b(1)]
args = x
definition = `parts_b` $x$
── TA_parts_b/default/eventtypes.conf
[parts_b_error]
search = sourcetype=parts:b error
── TA_parts_b/default/tags.conf
[eventtype=parts_b_error]
error = enabled
── TA_parts_b/lookups/parts_b.csv
k,v
a,1
── TA_parts_b/default/data/ui/views/parts_b.xml
<dashboard><label>Parts B</label></dashboard>
── TA_parts_b/default/data/ui/nav/default.xml
<nav></nav>
── TA_parts_b/static/appIcon.png
(three bytes, standing in for an image)
── TA_parts_b/LICENSE.txt
MIT
```

`TA_parts_a`'s table:

| Part | Universal Forwarder | Heavy Forwarder | Indexer | Search Head |
|---|---|---|---|---|
| **01 Source acquisition**: inputs.conf: 2 stanzas and interval | 3 | 3 | 3 | 3 |
| **04 Source-wide metadata**: inputs.conf: sourcetype ×2 and index | 3 | 3 | 3 | 3 |
| **11 Event boundary detection**: props.conf: EVENT_BREAKER_ENABLE | 1 |  |  |  |
| **15 Event aggregation**: props.conf: SHOULD_LINEMERGE |  | 1 | 1 | +1 |
| **22 Index-time transformations**: props.conf: TRANSFORMS-; transforms.conf: 1 stanza, DEST_KEY, FORMAT and REGEX |  | 5 | 5 | +5 |
| **110 Inline field extraction**: props.conf: EXTRACT- |  |  |  | 1 |
| **In all**: 14 lines, as Where it acts counts them | 7 | 12 | 12 | 7 +6 |
| *Its other files, placed as Splunk’s packaging toolkit places them* | | | | |
| `default/indexes.conf: 1 index` |  |  | 1 | 1 |
| `default/outputs.conf: 2 output stanzas` | 2 | 2 | 2 | 2 |
| `default/savedsearches.conf: 2 saved searches` |  |  |  | 2 |
| `appserver/: Splunk Web’s files` |  |  |  | 1 |
| `default/app.conf` | 1 | 1 | 1 | 1 |
| `metadata/default.meta` | 1 | 1 | 1 | 1 |
| `README/inputs.conf.spec` | 1 | 1 |  |  |
| `bin/collect.py` | 1 | 1 |  |  |

> Not read by Splunk while it runs: README.md, app.manifest. Splunk’s app tools read app.manifest.
>
> Its app.manifest names search heads and indexers as its targetWorkloads. It leaves out forwarders, though 7 lines take effect on a Universal Forwarder; 12 lines take effect on a Heavy Forwarder; README/inputs.conf.spec and bin/collect.py go there.

## The edits

The lines are Build 227's.

- **Line 13,758.** In `<script id="config-view-v205">`: `renderPanel`: what each tier gets goes under Build 221's "Where it acts".
```
old: ${window.configFollow221?.install()||''}
new: ${window.configFollow221?.install()||''}${window.configParts228?.html()||''}
```
- **Line 13,830.** In `<script id="config-view-v205">`: `readFiles`: every file a folder brings, or a package reader kept, goes to `configParts228.seen` too.
```
old: window.configLookups223?.seen(list);
new: window.configLookups223?.seen(list);window.configParts228?.seen(list);
```
- **Line 13,831.** In `<script id="config-view-v205">`: `readFiles`: an app's app.manifest, and its settings files the Config view doesn't read, go to `configParts228.add`, so they're no longer counted among the skipped files.
```
old: if(window.configTools224?.takes(path)){const e=await window.configTools224.add(file,path);if(e)errors.push(e);continue}
new: if(window.configTools224?.takes(path)){const e=await window.configTools224.add(file,path);if(e)errors.push(e);continue}if(window.configParts228?.takes(path)){const e=await window.configParts228.add(file,path);if(e)errors.push(e);continue}
```
- **Line 13,981.** In `<script id="config-view-v205">`: `loadExample`: trying the example forgets the package's other files, as Clear and `load` do. Its button shows only when no files are loaded, but files removed one at a time leave a package's other files behind.
```
old: function loadExample(){pm.files=[];pm.seq=0;
new: function loadExample(){window.configParts228?.clear();pm.files=[];pm.seq=0;
```
- **Line 15,497.** In `<script id="config-app-packages-v219">`: `expand`, a .tar.gz, .tgz or .spl package: each regular file's path and size go to `configParts228.entry`, before the reader keeps only the files the page reads; and it keeps the files `configParts228` reads too.
```
old:   const name=path.split('/').pop();if(!/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(name)&&!(/\.spl2?$/i.test(name))&&!window.configLookups223?.takes(path)&&!window.configTools224?.takes(path))continue;
new:   const name=path.split('/').pop();window.configParts228?.entry(path.includes('/')?path:file.name.replace(/\.(tar\.gz|tgz|spl)$/i,'')+'/'+path,size);if(!/^(inputs|props|transforms|eventtypes|tags)\.conf$/i.test(name)&&!(/\.spl2?$/i.test(name))&&!window.configLookups223?.takes(path)&&!window.configTools224?.takes(path)&&!window.configParts228?.takes(path))continue;
```
- **Line 15,501.** In `<script id="config-app-packages-v219">`: `expand`: a package whose only kept files are those `configParts228` reads still has nothing for the Config view, and says so as before.
```
old:  if(!files.length)throw Error('App package contains no inputs.conf, props.conf, transforms.conf, eventtypes.conf, tags.conf or SPL2 pipeline files');return files;
new:  if(!files.some(f=>!window.configParts228?.takes(f.path)))throw Error('App package contains no inputs.conf, props.conf, transforms.conf, eventtypes.conf, tags.conf or SPL2 pipeline files');return files;
```
- **Line 15,718.** In `<script id="config-follow-install-v221">`: `unzip`, a .zip package: the same as for a .tar.gz.
```
old:   if(raw.endsWith('/'))continue;const path=safePath(raw),name=path.split('/').pop();if(!wanted(name)&&!window.configLookups223?.takes(path)&&!window.configTools224?.takes(path))continue;
new:   if(raw.endsWith('/'))continue;const path=safePath(raw),name=path.split('/').pop();window.configParts228?.entry(path.includes('/')?path:root+'/'+path,size);if(!wanted(name)&&!window.configLookups223?.takes(path)&&!window.configTools224?.takes(path)&&!window.configParts228?.takes(path))continue;
```
- **Line 15,730.** In `<script id="config-follow-install-v221">`: `unzip`: the same as for a .tar.gz.
```
old:  if(!out.length)throw Error('App package contains no inputs.conf, props.conf, transforms.conf, eventtypes.conf, tags.conf or SPL2 pipeline files');
new:  if(!out.some(f=>!window.configParts228?.takes(f.path)))throw Error('App package contains no inputs.conf, props.conf, transforms.conf, eventtypes.conf, tags.conf or SPL2 pipeline files');
```
- **Line 16,655.** In `<script id="config-tools-v224">`: `clear`, run when the files are cleared or loaded again: `configParts228` forgets the files before.
```
old: function clear(){if(A.meta.size||A.app)A.version++;
new: function clear(){window.configParts228?.clear();if(A.meta.size||A.app)A.version++;
```

## The new block

**`<script id="config-parts-v228">`** goes right after `config-try-v227`'s `</script>` (line 17,209 of Build 227). It contains [`docs/mockups/where-parts-go-prototype.js`](mockups/where-parts-go-prototype.js). It needs the Config view's `configView205` and the page's `stages`. Its styles, **`<style id="config-parts-v228-styles">`**, go right after `config-try-v227-styles`'s `</style>` (line 16,349).

`window.configParts228`:

| For | Functions |
|---|---|
| The package readers and `readFiles` | `entry(path, size)` lists a package's entry. `seen(list)` lists the files `readFiles` is given. `takes(path)` says whether it reads a file's text, and `add(file, path)` reads it. `clear()` forgets them |
| The panel | `html()` draws the tables |
| A test or a script | `parts(app)` gives `{rows, parts, manifest}`. Also `apps()`, `place(file)`, `split(path)` and `TK`, the toolkit's placements by settings file |

## Build records

After the edits and the block, in a new `<script id="where-parts-go-records-v228">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['What each tier gets','Under Where it acts, a table for each app: its lines stage by stage, with how many take effect on a Universal Forwarder, a Heavy Forwarder, an Indexer and a Search Head; then a package’s or folder’s other files, placed as Splunk’s packaging toolkit places them; then what its app.manifest’s targetWorkloads leave out, or name where nothing acts.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 227 did in its records, with Build 228 and 15 Nov 2026.

## Check before uploading

Run with Build 227 + the edits, the block and the styles, and with Build 227 for comparison.

### 1. The toolkit, and the Splunk checks Build 227 kept

| What | Result |
|---|---|
| 62 settings' tiers, on the page, against the toolkit's placements | 50 within its placement; 12 outside, as "The page's tiers beside the toolkit's placements" explains |
| The Fortinet add-on's 54 sample events, tried as `fortigate_log`: their event types and tags, against Splunk 10.6.1.1 | All 54 the same, event types and tags, with none left open, as with Build 227 |
| Build 227's made-up app's event against its 51 event types in use, and its tags | 49 the same and none otherwise; et_host and et_index left open, and Splunk took both. All 10 tags the same |
| The 54 samples' fields | 2,682 of 2,682 field values the same, and the source type, on all 54 events |
| Build 225's made-up app's event | 24 of 26 fields the same, as with Build 227: `strftime()` isn't computed here, and Splunk's own tag field hides the indexed field named tag |

### 2. The checks: 36. All pass with the edits; 30 fail on Build 227

| Checks | What they find | Fail on Build 227 |
|---|---|---|
| The Fortinet add-on (15) | One table, open, right under Where it acts. Its head's counts. Its 13 stages, in order. In all, the same as Where it acts. Event breaking, index-time transforms and search-time lines on their tiers, with what they are. Its other files and why. What isn't read. Its manifest, not flagged. The files the Config view reads, as before. A stage's name shows its Matrix row. A component chosen in the strip leaves the table as it is; a source type chosen narrows it as it narrows Where it acts. A table closed stays closed | 14 |
| The example (1) | After the package's files are removed one at a time, the example's tables have its lines only, and nothing from the package | 1 |
| Clear and page errors (2) | No table after Clear; no page errors | 0 |
| The made-up packages (11) | A table for the .tgz and the .zip, with their heads. Inputs on every tier. outputs.conf, indexes.conf, savedsearches.conf and macros.conf placed, and why. The input's script and inputs.conf's spec on forwarders. Splunk Web's files, each `default/data/` folder and lookups on search heads. What isn't read. Both manifest warnings. Four tables start closed, and one opened stays open. No page errors | 10 |
| An etc folder (5) | The same files as an etc folder, with etc/system's server.conf: a table each, the same as the packages', and etc/system's on every tier. "Skipped 8 other files." No page errors | 4 |
| 390 px (2) | The table scrolls in its box and the page doesn't. No page errors | 1 |

The 6 that pass on Build 227 too are the checks that what the Config view reads from the package is as before, that Clear leaves no table, and that there are no page errors.

**The block's own functions, in the page:** 39 checks, all pass. They cover:
- the toolkit's placements, file for file, against its spec files;
- an app's folder in a package, an etc folder and etc/system;
- each kind of file;
- what runs a script;
- every manifest case;
- a file over 2 MB;
- the tables following the Config view's files;
- Clear.

### 3. Regression against Build 227

The new tables (`.cfPartsAll228`) are taken out of the panel and the page's text before comparing. The HTML of the rest of the panel, the Matrix and the map, lines included, and the page's text are compared.

| What is compared | Result |
|---|---|
| View text, every view, no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with no files: its text and the panel's HTML | The same |
| The Config view with the example, for every component and source type choice: the panel's HTML, the Matrix's HTML, the map's HTML and the page's text | 100 of 100 the same |
| The same with the Fortinet add-on's props.conf, transforms.conf, eventtypes.conf and tags.conf, for All components and the Search Head | 88 of 88 the same |
| The same with the add-on's package, read as a person uploads it, and the files, error and tab it gives | 89 of 89 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 227 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool | Build 227 | Build 227 + the edits |
|---|---|---|
| Build 227's 47 checks | 47 of 47 | 47 of 47 |
| Build 227's 31 checks of its block, in Node | 31 of 31 | 31 of 31 |
| Build 226's 29 checks | 29 of 29 | 29 of 29 |
| Build 226's 78 checks of its blocks, in Node | 78 of 78 | 78 of 78 |
| Build 225's 24 checks, as Build 226 runs them | 24 of 24 | 24 of 24 |
| Lookup checks: 54 checks, as Build 226 runs them | 54 of 54 | 54 of 54 |
| Build 224's 51 checks, as Build 225 runs them | 51 of 51 | 51 of 51 |
| Build 224's own 51 checks | 48 of 51 as written: the three Build 225 changed | 48 of 51 as written: the three Build 225 changed |
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) | 64 of 64 | 63 of 64 as written † |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote | 70 of 70 | 69 of 70 as written † |
| The source type map's 82 checks | 82 of 82 | 82 of 82 |
| The splits' 40 checks, with the map's tools taken out as Build 224's handoff says | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines' 31 checks | 31 of 31 | 31 of 31 |
| The space tool | The output | The same output |
| The connector tool | The output | The same output |

† Two earlier checks want what this build changes on purpose, and fail with the edits. One of Build 222's wants a folder's macros.conf counted among the skipped files: the edits read it, and place it on search heads. One of the Config view handoff's wants Where it acts right above the file tabs: the new tables sit between them.

### 4. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 227 | With the edits |
|---|---|---|
| The example: a draw | 6.5 ms (4.7 to 12.3) | 6.1 ms (5.2 to 8.9) |
| The example: an analysis | 0.8 ms (0.7 to 1.5) | 0.9 ms (0.6 to 1.3) |
| The add-on's props.conf and transforms.conf: a draw | 12.3 ms (9.9 to 22.5) | 13.4 ms (10.4 to 16.9) |
| The same: an analysis | 0.5 ms (0.4 to 1.2) | 0.6 ms (0.4 to 1.1) |
| The same, fortigate_event chosen: a draw | 9.5 ms (7.2 to 18.8) | 11.0 ms (8.2 to 19.6) |
| The add-on's four configuration files: a draw | 15.0 ms (12.5 to 29.1) | 16.1 ms (12.6 to 22.7) |
| The same: an analysis | 7.8 ms (5.9 to 17.6) | 8.8 ms (6.2 to 17.4) |
| The same, fortigate_event chosen: a draw | 15.3 ms (12.1 to 21.7) | 16.5 ms (12.8 to 26.8) |
| The same and its four lookup files: a draw | 17.4 ms (12.4 to 30.3) | 16.7 ms (12.8 to 28.3) |
| The same: an analysis | 6.5 ms (5.3 to 16.8) | 7.2 ms (5.4 to 10.8) |
| The same, fortigate_traffic chosen: a draw | 8.4 ms (6.4 to 15.0) | 8.7 ms (6.8 to 11.5) |
| The four files, their lookup files and the add-on's metadata, a search in search chosen: a draw | 15.9 ms (11.6 to 29.0) | 16.9 ms (12.2 to 24.2) |
| The same: an analysis | 8.8 ms (6.9 to 21.2) | 8.9 ms (6.8 to 17.6) |
| Trying one of the add-on's 54 sample events, as fortigate_log, with its lookup files | 0.86 ms (0.61 to 1.57) | 0.95 ms (0.62 to 1.35) |
| Trying all 54 at once, as Try all samples does | 32.0 ms (21.8 to 61.9) | 27.9 ms (21.7 to 46.9) |
| fortigate_traffic's map as SVG, for Save image | 34.2 ms (22.7 to 45.7) | 26.9 ms (21.1 to 64.7) |
| The add-on's package, read as a person uploads it: a draw | 10.9 ms (8.0 to 15.9) | 13.2 ms (8.7 to 20.0) |
| The same: the tables alone, drawn again | Not on Build 227 | 0.01 ms (0.00 to 0.02) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 4.6 ms (3.9 to 10.4) | 6.2 ms (4.2 to 8.9) |
| The same: an analysis | 98.8 ms (75.1 to 164.0) | 100.7 ms (69.8 to 140.1) |

- **Each figure** with the edits is within Build 227's spread, and Build 227's within the edits'. The draws' medians differ by −0.7 to +2.3 ms, by +1.1 ms in the middle: the browser builds and lays out the tables on each draw. The tables themselves are worked out once for each analysis or source type chosen, and kept between draws.
- **The add-on's package,** with its table, draws in 13.2 ms with the edits, against 10.9 ms on Build 227 without it. The table's HTML, kept between draws, takes 0.01 ms to give; the rest is the browser building and laying out the table's rows.

The perf tool wasn't run: it times the Builder.

### 5. The build

`index.html` as committed, Build 228, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks.
- The new checks pass on Build 228 as on the tested page: 36 of 36.

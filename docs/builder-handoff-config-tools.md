# Builder handoff: try an event, search-time order by app, and export, in the Config view

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 223.
**Applied:** as Build 224, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**11 in-place edits,** under "The edits": 7 in `<script id="config-view-v205">`, 2 in `<script id="config-type-map-v217">`, 1 in `<script id="config-app-packages-v219">` and 1 in `<script id="config-follow-install-v221">`. Each old string occurs exactly once in Build 223, each edit is on a line of its own, and none changes the number of lines.
**Two new blocks, after `<script id="config-lookups-v223">`:**
- `<style id="config-tools-v224-styles">`, containing [`docs/mockups/config-tools-prototype.css`](mockups/config-tools-prototype.css);
- then `<script id="config-tools-v224">`, containing [`docs/mockups/config-tools-prototype.js`](mockups/config-tools-prototype.js).

The edits and the blocks are also in [`docs/mockups/config-tools.diff`](mockups/config-tools.diff), a unified diff against Build 223's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`. It puts the blocks straight after `config-lookups-v223`, before Build 223's build records, so its last hunk doesn't depend on how long those records are.

**The request:** items 8, 10 and 11 of the improvements listed for the Config screen:

> **8. Try a sample event.** Paste one, or pick from the package's samples/ (the Fortinet add-on ships 11), and light up the path it takes: which transform matched, what source type it becomes, which extractions hit.
>
> **10. Search-time precedence by app.** The screen still uses one global order. Packages now carry metadata/default.meta, which is what the real rule needs.
>
> **11. Copy or export.** A source type's merged settings as text, or its map as an image for a design document. There is no export on this screen today.

**Mockup (the target):** [`docs/mockups/config-tools-mockup.html`](mockups/config-tools-mockup.html). Seven scenes have the edits and the blocks applied to Build 223, and the two "Today" scenes are Build 223, each set up by the same steps. The screenshots are `docs/mockups/compare/config-tools-*.png`; the "saved image" scene is the PNG that Save image saves.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in five scenes, as its package: its configuration files, its `metadata/default.meta` and the 11 files of its `samples` folder. It isn't in the repository. Its `default.meta` exports everything (`[]` with `export = system`), so the other scenes of the order use two made-up apps: `Splunk_TA_try`, which keeps its settings to itself, and `A_site`, which exports its `props.conf` settings and overrides one of `Splunk_TA_try`'s lines.

## Today, in Build 223

- **A package's `metadata` and `samples` folders are dropped:** the package readers take configuration, SPL2 and lookup files only. From the Fortinet package, Build 223 reads 4 files, as the prototype does; its `metadata/default.meta` and its 11 samples files aren't among them, and nothing says they were left out.
- **From a folder, they are among the other files skipped:** Upload a folder with the made-up apps (three configuration files, two metadata files and a samples file) says “Skipped 3 other files.” on Build 223. With the prototype, it says nothing: all six are read.
- **One order for every line:** each kind's files are ranked as Splunk ranks them in the global context, and each setting's winner is decided once, whatever app a search runs in.
- **Nothing runs an event:** the source type map shows each setting and where it leads, not what a given event meets.
- **Nothing to copy or save:** the map and the panel have no export.

## What Splunk does

From Splunk's documentation:
- **[Configuration file precedence](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence)** has two orders.
  - The global context, for files that affect data input, indexing or deployment: `etc/system/local`, then every app's `local` (A to Z), then every app's `default` (A to Z), then `etc/system/default`.
  - The app/user context, for search: the user's folders, then the current app's `local` and `default`, then each other app's `local` and `default`, Z to A ("for exported settings only"), then `etc/system/local` and `etc/system/default`. "All configuration files for the currently running app take priority over files from all other apps."
  - `props.conf` and `transforms.conf` are read in the global context at index time and in the app/user context at search time; `eventtypes.conf` and `tags.conf` in the app/user context.
- **[default.meta.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.0-configuration-file-reference/default.meta.conf):** each app's `metadata/default.meta` (and `local.meta`) holds its objects' access and export settings, in stanzas for the whole app (`[]`), a kind of object (`[views]`) or one object (`[views/index_status]`).
  - By default an object is visible only in the app it was created in.
  - `export = system` makes it available to all apps; `export = none` keeps it to its app.
  - Neither page says how `local.meta` and `default.meta` combine, or how a stanza for one object relates to one for its kind or for the app. The prototype takes `local.meta`'s word before `default.meta`'s, as a `.conf` file's local copy overrides its default, and the most specific stanza first, reading a stanza for one `props.conf` setting, `[props/<stanza>/<setting>]`, before its stanza's.
- **[Route and filter data](https://docs.splunk.com/Documentation/Splunk/latest/Forwarding/Routeandfilterdatad),** "Keep specific events and discard the rest": one transform sends every event to `nullQueue` and the next sends those it matches back to `indexQueue`. The transforms run in the order listed, so the catch-all has to come first; an event left on `nullQueue` is dropped.
- **[The sequence of search-time operations](https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/9.4/get-started-with-knowledge-objects/the-sequence-of-search-time-operations):** inline extractions (`EXTRACT-`), transform extractions (`REPORT-`), automatic key-value extraction (`KV_MODE`), field aliases (`FIELDALIAS-`), calculated fields (`EVAL-`), lookups (`LOOKUP-`), then event types and tags. Within one operation, the classes run in lexicographic order of their names.
- **[props.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.4-configuration-file-reference/props.conf):**
  - a `TRANSFORMS-` line's transforms are applied in the order listed;
  - `EXTRACT-<class> = <regex> in <field>` extracts from that field instead of the event;
  - `KV_MODE` is `auto` unless set, and `none` turns automatic key-value extraction off;
  - `FIELDALIAS-` with `AS` overwrites the new field, `ASNEW` doesn't;
  - `rename` gives a source type another name at search time;
  - the `[default]` stanza's settings apply to every source type.
- **[transforms.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.4-configuration-file-reference/transforms.conf):**
  - `SOURCE_KEY` is `_raw` unless set;
  - `DEST_KEY` can be `MetaData:Sourcetype`, `MetaData:Host`, `MetaData:Source`, `_MetaData:Index`, `queue` or `_raw`, and `WRITE_META = true` writes `FORMAT`'s `field::value` pairs as indexed fields;
  - at search time, `DELIMS` and `FIELDS` split an event, and `FORMAT = $1::$2` takes keys and values from each match;
  - named groups `_KEY_<n>` and `_VAL_<n>` give a key and its value.

## The design

### Reading metadata and samples

- **Which files:** `<app>/metadata/default.meta` and `<app>/metadata/local.meta`, and every file in `<app>/samples/` but hidden ones (a name starting with a dot). From an app package (`.spl`, `.tgz`, `.tar.gz`, `.tar`, `.zip`), Upload a folder, or a dropped folder. The folders Splunk doesn't merge with the instance's own (each user's, and those it sends to other instances) are left out, as their configuration files are. A file picked on its own has no app, so neither kind is taken from one.
- **Metadata:** its stanzas, `[]`, `[<kind>]` and `[<kind>/<object>]`, with the object's name URL-decoded, and each stanza's settings. Only `export` is used.
- **Samples:** one event a line; blank lines are skipped. Over 1 MB: "<path> is over 1 MB". A file with a NUL character: "<name> isn’t a text file". With no event: "<name> has no event".
- **Clear, the example and `load()`** forget the metadata, the samples, the event tried and the app chosen.

### Try an event

**Where.** Under the source type map's summary, four buttons: **Try an event**, **Copy settings**, **Save settings** and **Save image**. Try an event opens a box (and closes it):
- **Event,** a text box: "Paste one event, as Splunk receives it".
- **Sample,** when samples are read: "Pick one of 54 sample events", then each file's events under its name, "1: " and the event's first 70 characters. Picking one fills the text box; it stays picked until the text is changed, or Clear.
- **Arrives as:** every source type the files name; the map's own at first, then whichever was chosen.
- **Try it,** and **Clear** once something is tried.

**What runs.** At index time, the source type it arrives as:
- Its `TRANSFORMS-` lines, with `[default]`'s, the source type's own in place of any of the same name, in ASCII order of their names; each line's transforms in the order it lists them.
- For each transform: its `SOURCE_KEY` (`_raw`, or the source type, host, source or index as they stand), its `REGEX` and `FORMAT` (`$0`, `$1` and on, filled from the match), and its `DEST_KEY`. An event's host, source and index are known only once a transform sets them.
- Every transform runs, whatever an earlier one did. Where the event's queue is at the end decides whether it is dropped.
- A source type a transform gives the event brings none of its own index-time transforms: they ran as the type it arrived as, as the source type map already says of such events.

At search time, the source type it ends with, or the name a `rename` gives it, its settings merged with `[default]`'s as above:
- `EXTRACT-` lines, in order of their names, from the event or from the field after `in`, giving their named groups;
- `REPORT-` lines' transforms: `DELIMS` (two lists: pairs, then key and value, with a delimiter inside double quotes not splitting) or one list with `FIELDS`; else `REGEX`, with `FORMAT` (`$1::$2` taken from every match) or its named groups, `_KEY_<n>` and `_VAL_<n>` among them;
- `KV_MODE`: `none`, `json` (each value, with a dotted name for a nested one) or `auto` and `auto_escaped` (`key=value`, a quoted value whole). Any other value isn't tried;
- `FIELDALIAS-` lines: `AS` sets the new field, `ASNEW` only where the event doesn't have it;
- `EVAL-` and `LOOKUP-` lines are counted, not run.

A field keeps the first value an extraction gives it. With a search-time order chosen (below), the search-time settings are that order's.

**Regular expressions.** Splunk's are PCRE; the page translates each to JavaScript's dialect:

| PCRE | Tried as |
|---|---|
| `(?P<name>…)`, `(?'name'…)` | `(?<name>…)` |
| `(?P=name)` | `\k<name>` |
| `\A`; `\Z` and `\z` | `^`; `$` |
| `\h` | a space or a tab |
| `(?>…)`, an atomic group | `(?:…)` |
| `x++`, `x*+`, `x?+`, `x{n}+`, possessive | `x+`, `x*`, `x?`, `x{n}` |
| A leading `(?i)`, `(?s)` or `(?m)` | The flag |
| Flags set later in the expression | Not tried: "flags set inside the expression" |
| `(?R)`, `(?1)`, `(?&name)`, `(?(…)…)`, `(?\|…)` | Not tried: "a PCRE construct JavaScript has no equivalent for" |
| `\Q`, `\E`, `\G`, `\K`, `\X`, `\R` | Not tried: "\Q, which JavaScript has no equivalent for", and so on |

An atomic group or a possessive quantifier matches the same text as its plain form in nearly every expression a `.conf` file holds; one where backtracking into it would change the match is tried as the plain form.

**The path,** under the box:
- A head: "Arrives as **fortigate_log** · indexed as **fortigate_traffic**", with "· searched as **…**" when a `rename` changes it, or "· **dropped**", and a **Follow fortigate_traffic** button when it is searched as another source type than the map's.
- "Index time, as <type>", then "Search time, as <type>" (left out for a dropped event): one row for each step, with a dot (filled green where it gave something, a ring where it didn't, red where what it names is missing, grey where it can't be tried or is off) and its line, which goes to the line in the panel.
- Field aliases are one row, where the first of them comes.
- "<n> fields extracted", folded: each field, its value, and the line it came from ("FIELDALIAS-x, from y" for an alias, "automatic" for one automatic extraction found with no `KV_MODE` line).

| Step | Says |
|---|---|
| No `TRANSFORMS-` line | "No TRANSFORMS- line runs for it" |
| A transform that matches | "[acme_to_fw] matches, with “edge”: the source type becomes acme:fw" (or "the host becomes", "the source becomes", "the index becomes", "the event text is rewritten", "it writes x and y as indexed fields", "it sets <DEST_KEY>", "nothing changes: it has no DEST_KEY or WRITE_META") |
| To `nullQueue` | "[acme_drop_debug] matches: the event goes to nullQueue, which drops it", or "…, until a later transform sends it back" |
| Back from `nullQueue` | "[acme_keep_err] matches: the event goes back to indexQueue, so it’s kept" |
| One that doesn't | "[acme_drop_debug] doesn’t match" |
| One that can't be tried | "[x] evaluates INGEST_EVAL, which isn’t tried here", "[x] clones events, which isn’t tried here", "[x] reads <key>, which isn’t known for a pasted event", "[x]’s REGEX can’t be tried here: <why>" |
| A transform that isn't there | "[x] isn’t in transforms.conf" |
| `rename` | "rename: it is searched as <type>, with <type>’s search-time settings" |
| `EXTRACT-` | "EXTRACT-port extracts dest_port", "EXTRACT-x doesn’t match", "EXTRACT-x matches, with no named group", "EXTRACT-user reads raw_user, which the event doesn’t have yet", "EXTRACT-odd can’t be tried here: flags set inside the expression" |
| `REPORT-` | "[field_extract] extracts 36 fields", "[x] extracts nothing", "[x] reads <key>, which the event doesn’t have" |
| `KV_MODE` | "KV_MODE = none: no automatic key-value extraction", "KV_MODE = json extracts 2 fields", "KV_MODE = json: the event isn’t JSON", "Automatic key-value extraction (KV_MODE = auto, the default) finds 2 pairs", "Automatic key-value extraction finds no key=value pair", "KV_MODE = xml isn’t tried here" |
| `FIELDALIAS-` | "Field aliases (FIELDALIAS-): 2 of 3 give fields: src_ip, port, site_src. 1 finds none of its fields", "1 of 1 gives a field: site_src", "12 find none of their fields" (the first 8 fields, then "and n more") |
| `EVAL-`, `LOOKUP-` | "1 calculated field (EVAL-) isn’t computed here", "2 lookups (LOOKUP-) aren’t run here" |

The Fortinet package's first traffic sample, arriving as `fortigate_log`, as the prototype shows it:
```
Arrives as fortigate_log · indexed as fortigate_traffic   [Follow fortigate_traffic]
Index time, as fortigate_log
  hit   [force_sourcetype_fortigate] matches, with “traffic”: the source type becomes fortigate_traffic   (Splunk_TA_fortinet_fortigate/default/props.conf line 2)
Search time, as fortigate_traffic
  hit   [field_extract] extracts 36 fields   (Splunk_TA_fortinet_fortigate/default/props.conf line 16)
  off   KV_MODE = none: no automatic key-value extraction   (Splunk_TA_fortinet_fortigate/default/props.conf line 15)
  hit   Field aliases (FIELDALIAS-): 14 of 26 give fields: dest, dest_interface, dest_ip, dvc, packets_in, packets_out, rule_id, session_id and 6 more. 12 find none of their fields
  skip  18 calculated fields (EVAL-) aren’t computed here
  skip  2 lookups (LOOKUP-) aren’t run here
50 fields extracted
```

**The map, lit.** Each line the event's path meets:
- **Lit** (a green outline) where it gave the event something; **dimmed** (half opacity) where it was tried and gave nothing, or names a transform that isn't there; left as it is where it can't be tried or is off.
- A line that names several transforms is lit when any of them matches, and each transform under it (in the Transform column, and a `REPORT-` line's in the Search column) shows its own result.
- A folded run of lines (Build 221's folds) is lit when a line in it is lit, and dimmed when every line in it that was tried gave nothing, so the path shows with the run folded.
- The cards of what the event becomes are lit too: for a dropped event, the **Dropped** card alone; for any other, each card a transform that matched it leads to (its new source type's, its host's, its index's) and never the Dropped card.
- **Follow** opens the map of the source type the event is searched as, with the path kept and that map's lines lit. The box stays open, and the event, the source type it arrives as and the result stay with it from map to map until Clear.

### Search-time order by app

- **The picker:** "Search-time order", at the start of the panel's actions, when files are read: **Global, as at index time** (the default, Build 223's order), **A search in search**, then **A search in <app>** for each app the files name, A to Z.
- **For a search in app X,** the search-time lines are ranked: X's own files (local, then default), the other apps' (Z to A, each local, then default), then `etc/system`'s (local, then default). A file with no app (one picked on its own) comes after the named apps; of two files in the same place, the later upload first.
- **Which lines:** the `props.conf` settings Splunk reads only at search time (the page's own stage list for each setting: `EXTRACT-`, `REPORT-`, `KV_MODE`, `FIELDALIAS-`, `EVAL-`, `LOOKUP-`, `rename` and the like); the `transforms.conf` stanzas that only `REPORT-` and `LOOKUP-` lines name; and every line of `eventtypes.conf` and `tags.conf`. Every other line keeps the global order.
- **Sharing:** another app's line counts only when its metadata exports it: the first stanza that sets `export`, of `[props/<stanza>/<setting>]` (for a `props.conf` setting), `[<kind>/<stanza>]`, `[<kind>]` and `[]`, `local.meta`'s before `default.meta`'s at each, and only `export = system` shares. A stanza's name is URL-decoded: `[props/acme%3Afw/EXTRACT-src]` is `acme:fw`'s `EXTRACT-src`. X's own files, `etc/system`'s and files with no app always count.
- **A line not shared** has no effect, with a note:
  - "Not shared with search: Splunk_TA_try’s metadata/default.meta keeps all its settings to the app ([] export = none), so a search in search doesn’t see this line." (A `[props]` stanza: "keeps its props.conf settings to the app"; a `[props/acme:fw]` stanza: "keeps [acme:fw] to the app"; a `[props/acme:fw/EXTRACT-src]` stanza: "keeps [acme:fw] EXTRACT-src to the app".)
  - "Not shared with search: A_site has no metadata in these files, and Splunk shares an app’s settings only where its metadata exports them, so …"
  - "Not shared with search: A_site’s metadata doesn’t export its settings, so …", where its metadata says nothing of it.
- **Under the summary,** a note:
  “Search-time settings are ranked for a search in search, which has none in these files: the other apps’ exported settings, Z to A (Splunk_TA_try and A_site), then etc/system’s. Index-time settings keep the global order. Splunk_TA_try keeps its settings to itself; A_site exports its settings. 14 lines not shared with search have no effect.”
  For a search in an app with files: "…ranked for a search in **Splunk_TA_try**: its own first, then the other apps’ exported settings, Z to A (A_site), then etc/system’s." Each app's sharing is as its metadata gives it for `props.conf`.
- **Everything follows the order chosen:** the panel's lines and their notes, the source type map, an event tried, and the settings copied.

### Copy or export

- **Copy settings** copies the source type's settings as `.conf` text; the button says "Copied" for a moment. Where the browser doesn't allow it, a box under the tools holds the text, selected: "The browser didn’t allow copying: select the text and copy it."
- **Save settings** saves the same text as `<source type>.conf`, with each run of characters other than letters, digits, `_`, `.` and `-` made `_`: `acme_fw.conf`.
- **The text:** two comment lines, then
  - `# inputs.conf`: the stanzas whose `sourcetype` is the source type;
  - `# props.conf`: its stanza;
  - `# transforms.conf`: the stanzas its `TRANSFORMS-`, `REPORT-` and `LOOKUP-` lines name, in the order they name them;
  - each stanza's winning lines, overridden ones left out, under a `# <file>` comment for each run of lines from one file, the files in the screen's order (highest precedence first). A `.conf` file can't hold a comment after a value, so each file's name is a line of its own.

  `acme:fw` from the made-up apps, in the global order:
````
# acme:fw: its settings as Splunk merges them, from Splunk Pipeline Explorer.
# Every setting in the global order. Overridden lines are left out.

# props.conf
[acme:fw]
# A_site/local/props.conf
EXTRACT-src = src=(?<src>\S+)
FIELDALIAS-site = src AS site_src
# Splunk_TA_try/default/props.conf
EXTRACT-port = (?P<dest_port>\d+)/tcp
EXTRACT-user = user=(?<user>\w+) in raw_user
EXTRACT-odd = (?i)x(?-i)y
REPORT-kv = acme_kv
REPORT-fmt = acme_fmt
FIELDALIAS-a = src AS src_ip dest_port AS port
FIELDALIAS-b = nosuch AS other
EVAL-risk = if(port==443,"low","high")
KV_MODE = none

# transforms.conf
[acme_kv]
# Splunk_TA_try/default/transforms.conf
DELIMS = " ", ":"

[acme_fmt]
# Splunk_TA_try/default/transforms.conf
REGEX = (\w+)@(\w+)
FORMAT = $1::$2
````
  For a search in search, the second line says "Search-time settings as ranked for a search in search.", and `Splunk_TA_try`'s search-time lines are left out:
````
# acme:fw: its settings as Splunk merges them, from Splunk Pipeline Explorer.
# Search-time settings as ranked for a search in search. Overridden lines are left out.

# props.conf
[acme:fw]
# A_site/local/props.conf
EXTRACT-src = src=(?<src>\S+)
FIELDALIAS-site = src AS site_src
````
- **Save image** saves the map as `<source type>-map.png` at twice its size, and says "Saved". It draws:
  - the map's title, summary and columns: each box with a background or a border as a rectangle, each line of text where the page breaks it, and the map's lines as the page draws them, with their colours;
  - not the list of source types, the tools and their boxes, or the note on the lines.

  The picture is plain SVG, with no HTML inside: a browser won't let a page read back a picture drawn from an SVG with HTML in it, so the PNG couldn't be made from one. The PNG is drawn from the SVG in the page. If the browser can't draw it, the SVG itself is saved, and the button says "Saved as SVG".

### Uploads

- The tar and zip readers and the folder readers take metadata and samples, as they take lookup files.
- **Unchanged:** the picker's file types and the empty panel's text. Metadata and samples come with their app, from a package or a folder.

### Unchanged

With the global order chosen (the default) and nothing tried, every view, the panel and every map are as in Build 223, but for the picker and the map's tools.

### Not covered

- **The user's folders** (`etc/users`), first in Splunk's app/user order: they aren't read. Nor are the metadata's `access` settings and owners, or `export` for other kinds of object than these four files'. A cluster peer's apps are ranked as any other app's.
- **At index time:** line breaking, timestamps, `SEDCMD-`, `[source::]` and `[host::]` stanzas (a pasted event has no source or host), `RULESET-`, `INGEST_EVAL`, `CLONE_SOURCETYPE`, `REPEAT_MATCH` and Ingest Processor pipelines.
- **At search time:** `EVAL-`, `LOOKUP-`, event types and tags are listed or left alone; `KV_MODE = xml` isn't tried; `auto_escaped` is tried as `auto`; multivalue fields, `MV_ADD`, `CLEAN_KEYS` and `KEEP_EMPTY_VALS` aren't modelled; automatic extraction is near enough, not Splunk's own.
- **A dropped folder** goes through the same reader as Upload a folder, but no check drops one: the browser's drop can't be scripted here.

## The edits

In Build 223's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is.

**`<script id="config-view-v205">`:**

- **Line 13,584.** `analyse`, once each kind's files are merged in the global order: the search-time settings are decided again for the app chosen, before the roles and the lines' stages read the result.
```
old:  const P=kindFiles('props'),T=kindFiles('transforms'),I=kindFiles('inputs'),propsStanzas=P.flatMap(f=>f.doc.stanzas);
new:  window.configTools224?.remerge(merged);const P=kindFiles('props'),T=kindFiles('transforms'),I=kindFiles('inputs'),propsStanzas=P.flatMap(f=>f.doc.stanzas);
```
- **Line 13,655.** `assignTypes`, at the end of each analysis: a line another app doesn't share with the chosen one has no effect, and says why.
```
old: window.configLookups223?.check();
new: window.configLookups223?.check();window.configTools224?.mark();
```
- **Line 13,763.** `renderPanel`, at its end: the search-time order's picker, and what it means.
```
old: window.configLookups223?.decorate(panel)}
new: window.configLookups223?.decorate(panel);window.configTools224?.decorate(panel)}
```
- **Line 13,770.** Clear forgets the metadata, the samples and the app chosen.
```
old: window.configLookups223?.clear();pm.files=[];
new: window.configLookups223?.clear();window.configTools224?.clear();pm.files=[];
```
- **Line 13,831.** `readFiles`: an app's metadata and samples go to the new block.
```
old: if(window.configLookups223?.takes(path)){const e=await window.configLookups223.add(file,path);if(e)errors.push(e);continue}
new: if(window.configLookups223?.takes(path)){const e=await window.configLookups223.add(file,path);if(e)errors.push(e);continue}if(window.configTools224?.takes(path)){const e=await window.configTools224.add(file,path);if(e)errors.push(e);continue}
```
- **Line 13,843.** `walk`, for a dropped folder: its metadata and samples are taken.
```
old: ||window.configLookups223?.takes(entry.fullPath.replace(/^\//,''))||
new: ||window.configLookups223?.takes(entry.fullPath.replace(/^\//,''))||window.configTools224?.takes(entry.fullPath.replace(/^\//,''))||
```
- **Line 13,983.** `load`, which the example uses: so does it.
```
old: load(files){pm.files=[];pm.seq=0;window.configLookups223?.clear();
new: load(files){pm.files=[];pm.seq=0;window.configLookups223?.clear();window.configTools224?.clear();
```

**`<script id="config-type-map-v217">`:**

- **Line 15,256.** `draw`: the map draws again when the app chosen, the metadata or the samples change.
```
old: pipes?.version||0,window.configLookups223?.version()||0]);
new: pipes?.version||0,window.configLookups223?.version()||0,window.configTools224?.version()||0]);
```
- **Line 15,274.** `draw`, at its end, before it binds its controls: the tools under the summary, and the tried event's path lit.
```
old:  bind();requestAnimationFrame(lines)}
new:  window.configTools224?.decorateMap(root,T);bind();requestAnimationFrame(lines)}
```

**`<script id="config-app-packages-v219">`:**

- **Line 15,497.** The tar reader (.spl, .tgz, .tar.gz, .tar) takes metadata and samples.
```
old: !(/\.spl2?$/i.test(name))&&!window.configLookups223?.takes(path))continue;
new: !(/\.spl2?$/i.test(name))&&!window.configLookups223?.takes(path)&&!window.configTools224?.takes(path))continue;
```

**`<script id="config-follow-install-v221">`:**

- **Line 15,718.** The zip reader takes them too.
```
old: if(!wanted(name)&&!window.configLookups223?.takes(path))continue;
new: if(!wanted(name)&&!window.configLookups223?.takes(path)&&!window.configTools224?.takes(path))continue;
```

## The new blocks

After `<script id="config-lookups-v223">`, in this order:

1. **`<style id="config-tools-v224-styles">`,** containing [`docs/mockups/config-tools-prototype.css`](mockups/config-tools-prototype.css): the picker and its note, the tools, the box, the path's rows and dots, the fields, and the map's lit and dimmed lines.
2. **`<script id="config-tools-v224">`,** containing [`docs/mockups/config-tools-prototype.js`](mockups/config-tools-prototype.js). It defines `window.configTools224`:

| For | Functions |
|---|---|
| Reading | `takes(path)` says whether a file is metadata or a sample; `add(file, path)` reads one and `put(path, text)` takes its text; `parseMeta(text)` reads a `.meta` file |
| The order | `remerge(merged)` runs once each kind's files are merged in the global order, and decides the search-time lines again for the app chosen; `mark()` runs at the end of the analysis and notes the lines not shared; `exported(app, kind, stanza, setting)` and `rank(file, app)` are the rules; `setApp(app)` chooses one |
| Trying | `tryEvent(raw, sourcetype)` gives the steps, fields and metadata of one event; `jsRegex(pcre)`, `delims(value)`, `kvByDelims(text, pairs, kv)` and `autoKv(text)` are its parts |
| Exporting | `settingsText(sourcetype)` is the text; `mapSvg()` is the map as SVG, with its size |
| The panel and the map | `decorate(panel)` adds the picker and the note after the panel draws; `decorateMap(root, sourcetype)` adds the tools and lights the path, from the map's draw; `version()` is part of what the map compares before it draws again |
| Scripts | `load(files)` reads metadata and samples by path; `clear()` forgets them; `knowledge()` returns what is read and chosen |

When it loads, it also listens on the document for the tools' clicks, the picker's and the box's changes, and the fields' fold.

**It has to come after** `config-view-v205`: it reads `window.configView205` and `state.configView205` as it loads.

## Build records

After the edits and the blocks, in a new `<script id="config-tools-records-v224">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Try an event, search-time order and export','The source type map tries an event, pasted or picked from a package’s samples folder: it lights the transforms that match it, the source type it becomes and the extractions that give it fields, and lists them in order. A search-time order picker ranks search-time settings for a search in an app, by what each app’s metadata exports. A source type’s merged settings can be copied or saved as .conf text, and its map saved as an image.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 223 did in its records, with Build 224.

## Check before uploading

Run with Build 223 + the edits and the blocks, and with Build 223 for comparison.

### 1. The checks: 51. All pass with the edits; 44 fail on Build 223

| Checks | What they find | Fail on Build 223 |
|---|---|---|
| Try an event (17) | The four tools. The made-up apps' event: the head; the three transforms in order, word for word; the search-time steps in Splunk's order, word for word; its seven fields. The transforms line lit, not dimmed, and under it the transform that matched lit and the one that didn't dimmed; the cards of its new source type and host lit. Follow: acme:fw's map, its extractions lit and others dimmed, the path kept. Clear. A dropped event: every transform still runs, the Dropped card lit. One sent back from `nullQueue`, and one that isn't. `KV_MODE = json`, and automatic extraction. No page errors | 16 |
| Samples (6) | The package's 11 files and 54 events to pick from; picking one fills the box, and it stays picked; the traffic sample becomes `fortigate_traffic`, and `[field_extract]` gives 36 fields. Followed to `fortigate_traffic`: its folded field aliases lit, its folded calculated fields left alone. No page errors | 5 |
| The order (13) | The picker's choices. The global order as before. A search in search: the unshared line has no effect and says why, the exported line wins, the index-time lines keep the global order, the note word for word, and an event tried gets only what search sees. A search in `Splunk_TA_try`: its own line wins; the map shows it. Back to the global order. An app with no metadata. A stanza of its own in `local.meta` for one setting: just that line kept to its app. No page errors | 11 |
| Export (9) | Copy settings' text, word for word at its start, with the transforms; "Copied"; Save settings saves the same text as `acme_fw.conf`; Save image saves a PNG twice the map's size; the SVG has the title, the cards' text and the lines, and no HTML, the list or the tools; the map is as it was after. No page errors | 8 |
| Upload (4) | A folder's metadata and samples read, its other file skipped; Clear forgets them and the app chosen; the example has the picker at the global order and no note. No page errors | 3 |
| 390 px (2) | The tools and the path fit. No page errors | 1 |

The 7 that pass on Build 223 too are its 6 no-page-errors checks, and the one that finds the global order unchanged: A_site’s local line wins there.

**The new block's own functions, in Node:** 41 checks of `jsRegex`, `delims`, `kvByDelims`, `autoKv`, `parseMeta`, `exported`, `rank` and `takes`, all pass.

### 2. Regression against Build 223

The add-on is loaded with its `props.conf` and `transforms.conf`, by `load()`, as before: no metadata, no sample, no app chosen and nothing tried. The picker and the map's tools are taken out before comparing; everything else is compared as it is: the HTML of the panel, the Matrix and the map, lines included.

| What is compared | Result |
|---|---|
| View text, every view, no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with no files: its text and the panel's HTML | The same |
| The Config view with the example, for every component and source type choice: the panel's HTML, the Matrix's HTML, the map's HTML and the page's text | 100 of 100 the same |
| The same with the Fortinet add-on, for All components and the Search Head | 88 of 88 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 223 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool, on Build 223 + the edits | Result |
|---|---|
| Lookup checks: 54 checks (Build 223's handoff) | 54 of 54 |
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) | 64 of 64 |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote | 70 of 70, run again on its own: in the full run it stopped after 61 passes and no failure, when one page took longer than its 2.5-second limit to load |
| The source type map's 82 checks | 82 of 82 |
| The splits' 40 checks (Build 218's handoff). The last compares the example's maps with Build 217's, word for word, and so finds the map's tools: it is run with them taken out first, as the regression does | 40 of 40 (39 of 40 as written) |
| Ingest Processor pipelines' 31 checks (the same handoff) | 31 of 31 |
| The space tool | The same output as Build 223 |
| The connector tool | The same output as Build 223 |

### 3. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 223 | With the edits |
|---|---|---|
| The example: a draw | 6.2 ms (5.0 to 8.7) | 7.3 ms (5.1 to 9.8) |
| The example: an analysis | 0.9 ms (0.7 to 1.2) | 1.1 ms (0.8 to 1.4) |
| The add-on’s props.conf and transforms.conf: a draw | 12.6 ms (10.8 to 20.5) | 15.3 ms (10.7 to 19.4) |
| The same: an analysis | 0.6 ms (0.4 to 1.1) | 0.8 ms (0.4 to 1.0) |
| The same, fortigate_event chosen: a draw | 9.8 ms (7.7 to 12.7) | 10.4 ms (9.0 to 16.1) |
| The add-on’s four configuration files: a draw | 19.4 ms (13.4 to 23.5) | 16.9 ms (14.1 to 27.1) |
| The same: an analysis | 8.7 ms (6.2 to 11.9) | 9.2 ms (6.5 to 13.3) |
| The same, fortigate_event chosen: a draw | 15.0 ms (12.2 to 23.0) | 17.2 ms (12.3 to 25.9) |
| The same and its four lookup files: a draw | 14.8 ms (12.8 to 23.3) | 17.4 ms (13.7 to 28.8) |
| The same: an analysis | 7.2 ms (5.5 to 11.9) | 7.7 ms (5.7 to 16.0) |
| The same, fortigate_traffic chosen: a draw | 9.8 ms (6.6 to 12.7) | 9.8 ms (6.8 to 18.6) |
| The four files and the add-on’s metadata, a search in search chosen (Build 223: the global order): a draw | 15.2 ms (12.2 to 23.6) | 15.8 ms (12.8 to 23.4) |
| The same: an analysis | 7.4 ms (5.2 to 11.6) | 11.1 ms (6.8 to 13.4) |
| Trying one of the add-on’s 54 sample events, as fortigate_log | No such tool | 0.3 ms (0.2 to 0.6) |
| fortigate_traffic’s map as SVG, for Save image | No such tool | 36.6 ms (22.5 to 53.1) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 5.0 ms (3.8 to 8.0) | 6.4 ms (4.2 to 7.6) |
| The same: an analysis | 90.8 ms (76.5 to 137.2) | 91.7 ms (74.6 to 121.5) |

- **With the global order,** the edits add no work that shows: each median is within the other page's spread.
- **With a search in search chosen,** an analysis of the add-on's four files and its metadata takes 11.1 ms, against Build 223's 7.4 ms in the global order, and a draw 15.8 ms against 15.2 ms. Deciding the search-time lines again for the app adds about 3.6 ms to an analysis, within Build 223's spread (5.2 to 11.6 ms).
- **The tools run only when used:** trying an event takes 0.35 ms, and drawing fortigate_traffic's map as SVG 37 ms, before the browser makes the PNG.

The perf tool wasn't run: it times the Builder.

### 4. The build

`index.html` as committed, Build 224, is the tested page with this handoff's records. Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks. The new checks pass on Build 224 as on the tested page: 51 of 51.

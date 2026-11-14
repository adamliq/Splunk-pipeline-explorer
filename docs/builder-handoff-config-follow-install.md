# Builder handoff: the Config view follows expressions, packages, splits and filters, and says where the files act (faults 17 and 53 to 55, and two additions)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 220.
**Applied:** as Build 221, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**22 in-place edits,** under "The edits": 13 in `<script id="config-view-v205">` and 9 in `<script id="config-type-map-v217">`. Each old string occurs exactly once in Build 220, each edit is on a line of its own, and none changes the number of lines.
**Two new blocks, at the end of the page (before `</body>`):**
- `<style id="config-follow-install-v221-styles">`, containing [`docs/mockups/config-follow-install-prototype.css`](mockups/config-follow-install-prototype.css);
- then `<script id="config-follow-install-v221">`, containing [`docs/mockups/config-follow-install-prototype.js`](mockups/config-follow-install-prototype.js).

The edits and the blocks are also in [`docs/mockups/config-follow-install.diff`](mockups/config-follow-install.diff), a unified diff against Build 220's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

Make the edits, paste the two files as they are, then add the build records (see "Build records").

**The request:** the first six of the improvements listed for the Config screen.

| | Change | |
|---|---|---|
| 1 | The source type map follows the source types, the index and the queue an `INGEST_EVAL` names | Fault 53 |
| 2 | A `.spl` app package opens, and so do a `.zip` and a plain `.tar` | Fault 54 |
| 3 | With a source type chosen, the panel keeps the lines that give events that name | Fault 55 |
| 4 | A monitor's `whitelist` and `blacklist` decide which `[source::]` stanzas its files can match | Fault 17 |
| 5 | The panel says where the files act: a count for each tier, app by app | An addition |
| 6 | The source type map folds its long runs of search-time lines | An addition |

**The numbers:**
- **17** is numbered as in the Build 215 recheck ([`builder-handoff-build215.md`](builder-handoff-build215.md), "Still open").
- **53 to 55** are new, after 52. Build 218's handoff ([`builder-handoff-splits-and-pipelines.md`](builder-handoff-splits-and-pipelines.md)) left 53 under "Not covered", and 55 under "Found while testing", 1.

**Mockup (the target):** [`docs/mockups/config-follow-install-mockup.html`](mockups/config-follow-install-mockup.html). Nine scenes have the edits and the blocks applied to Build 220, and the seven "Today" scenes are Build 220, each set up by the same steps. The screenshots are `docs/mockups/compare/config-follow-install-*.png`.

**Tested first:** the edits and the blocks were applied to Build 220 and run. The results under "Check before uploading" come from that run.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in seven scenes, as it was for Build 218: its `default/props.conf` and `default/transforms.conf`. It isn't in the repository.

## The faults

### 53. The source types, index and queue an `INGEST_EVAL` names aren't followed

**The files,** in the storyboard and the checks:

```
# props.conf
[acme:raw]
TRANSFORMS-split = acme_split_eval, acme_index_eval, acme_drop_eval

# transforms.conf
[acme_split_eval]
INGEST_EVAL = sourcetype:=case(match(_raw,"type=traffic"),"acme:traffic",match(_raw,"type=audit"),"acme:audit",true(),sourcetype)

[acme_index_eval]
INGEST_EVAL = index=if(match(_raw,"level=debug"),"acme_debug",index)

[acme_drop_eval]
INGEST_EVAL = queue=if(match(_raw,"keepalive"),"nullQueue",queue)
```

**What you see,** with acme:raw chosen:
- **`[acme_split_eval]` "Writes sourcetype: as an indexed field".** It leads to "Indexed field sourcetype:", and the panel puts it on stage 26, Indexed-field creation.
- **Written with `=`,** it "Sets sourcetype" and leads to "Sourcetype set by an expression". Either way, acme:traffic and acme:audit aren't named, and can't be opened from there.
- **`[acme_index_eval]` leads to "Index set by an expression",** and `[acme_drop_eval]` to "Queue set by an expression". Beside them, "The default index" says "No input or transform in these files sets the index".

**And with acme:traffic chosen:** "No input, [source::] stanza or rule in these files names acme:traffic." Its destination is "The default index". This is fault 48 again, for an expression.

**Why:**
- `evalTargets` (`config-view-v205`, line 13,536) reads each assignment's field with `[\w:.-]*`, which takes the colon of `:=` into the name. `sourcetype:` isn't a metadata key, so the transform is taken to write an indexed field.
- `outcomes` (`config-type-map-v217`, line 15,111) gives each assignment one destination, from its field alone. It doesn't read the expression.
- `named` and `gather` (lines 15,107 and 15,097) look for the source types a transform names only where it has `DEST_KEY = MetaData:Sourcetype`.

**What Splunk does:** an `INGEST_EVAL` is a list of assignments, `field=expression` or `field:=expression`, separated by commas. Where `=` adds a value to an indexed field that already has one, `:=` replaces it. Either sets a metadata key: `sourcetype`, `index`, `queue`, `host` or `source`.

### 54. A `.spl` app package isn't opened

**What you see:**
- **Upload `A_acme.spl`:** "A_acme.spl has no pipeline: no statement in it starts with from $source." It is an app folder, `A_acme`, with `default/inputs.conf`, `default/props.conf` and `local/props.conf`, packed with `tar -czf`.
- **Upload the same app as a `.zip`, or as a `.tar` that isn't compressed:** "deflated.zip isn’t a text file."

**Why:**
- `readFiles` (line 13,830) gives Build 219's package reader the files whose names end `.tar.gz` or `.tgz`.
- Build 218 reads a `.spl` file, like a `.spl2` file, as an Ingest Processor pipeline's text.

**What Splunk does:** `.spl` is the name Splunk gives an app package, and `splunk package app` writes one. It is a gzip tar, as a `.tgz` is.

### 55. With a source type chosen, the panel leaves out what gives events that name

Build 218's handoff noted this and left it.

**What you see,** with the Fortinet add-on's two files and fortigate_traffic chosen: "58 lines on 9 stages".
- **Kept:** `[fortigate_traffic]`'s lines, and the search-time transforms and lookups they name.
- **Left out:**
  - `[force_sourcetype_fortigate]`, the transform that gives events the name;
  - `TRANSFORMS-force_sourcetype_fortigate` in `[fortigate_log]` and `TRANSFORMS-force_sourcetype_fgt` in `[fgt_log]`, which run it;
  - `rename = fortigate_traffic` in `[fgt_traffic]`.
- **The map has shown all three since Build 218.** The view's Matrix lists the panel's lines, so it leaves them out too.
- **A copy is half followed.** In the example, with acme:fw:denied chosen, the panel keeps `[acme_fw_copy_denied]`, and not the `[acme:fw]` line that runs it, `TRANSFORMS-copy`.

**Why:** `assignTypes` (line 13,655) gives a transform the source types of the stanzas that run it, and a copy's. It doesn't give it the source types it names. A props.conf line belongs to its own stanza's source types and no others (`inFocus`, line 13,656).

### 17. A monitor's `whitelist` and `blacklist` aren't used

**The files,** in the storyboard:

```
# inputs.conf
[monitor:///var/log/acme]
whitelist = \.log$

[monitor:///var/log/zeta]
blacklist = \.(gz|bz2)$

[monitor:///var/log/app]
blacklist = \.gz$
```

| props.conf stanza | Sets |
|---|---|
| `[source::/var/log/acme/*.log]` | `sourcetype = acme:log` |
| `[source::/var/log/acme/*.csv]` | `sourcetype = acme:csv` |
| `[source::/var/log/zeta/....gz]` | `sourcetype = zeta:archive` |
| `[source::/var/log/zeta/*.log]` | `sourcetype = zeta:log` |
| `[source::/var/log/app/...]` | `sourcetype = app:log` |
| `[source::/var/log/app/....gz]` | `sourcetype = app:archive` and `priority = 5` |

**What you see,** on each monitor's line:
- **`/var/log/acme`:** "Files matching [source::/var/log/acme/*.csv] take source type acme:csv (…); files matching [source::/var/log/acme/*.log] take source type acme:log (…)." No `.csv` file passes its whitelist.
- **`/var/log/zeta`:** "…files matching [source::/var/log/zeta/....gz] take source type zeta:archive (…)." Its blacklist leaves every `.gz` file out.
- **`/var/log/app`:** "Files matching [source::/var/log/app/....gz] take source type app:archive (…). The rest take app:log from [source::/var/log/app/...] in …." So the monitor is in app:archive's list in the panel, and app:archive's map draws it as its input.

**Why:** `configSourceMatches207` (`five-fixes-v207`) is given the monitor's path and the `[source::]` stanzas. The monitor's other settings don't reach it.

**What Splunk does:** a monitor reads a file only if its path matches `whitelist`, where there is one, and doesn't match `blacklist`. Both are regular expressions, searched for anywhere in the whole path.

## The two additions, today

### Where the files act

**What you see:** the panel's summary counts for one component at a time. With the Fortinet add-on, choose Heavy Forwarder in the strip: "21 take effect on a Heavy Forwarder", "219 have no effect there".
- To learn where an app has to be installed, each tier is chosen in turn and its count read: 6, 21, 21 and 213.
- With several apps loaded, the counts are for all of them together.

### Long runs in the map

**What you see:** fortigate_event's map is 4,304 px tall in a 1,440 px window. Its Search column lists 50 search-time settings, each a line of its own: 13 `FIELDALIAS-` lines and 32 `EVAL-` lines among them.

## The fix

### 53. Expressions

**In the map of a source type whose transform has an `INGEST_EVAL`** (acme:raw):

- **Each assignment is read:** its field, and what its expression can give the field (`values` in the new block).

| In the expression | Gives |
|---|---|
| `"text"`, in double quotes | That value |
| `if(test, a, b)` | What `a` gives, where the test holds; what `b` gives, where it doesn't: "not (test)" |
| `case(test1, a, test2, b, …)` | What each gives, under its test. `true()` or `1==1` as a test reads "no earlier test holds" |
| `coalesce(a, b, …)` | What each gives, where the ones before it are null: "isnull(a)". Nothing after a text, which is never null |
| The field's own name, as in `if(test, "x", sourcetype)` | Nothing: the field stays as it was |
| `null()` | Nothing |
| Anything else: another function, another field, texts joined together | Something the map can't name |

- **A source type it names:** "Becomes acme:traffic".
  - It says which test leads to it: "Events where match(_raw,"type=traffic"), in [acme_split_eval]."
  - It has "Follow acme:traffic", and a violet line from the transform. These are the cards Build 218 gave a `REGEX`'s names.
  - With no test on the way: "Every event [always_st] runs on."
  - Several tests on the way are joined with "and". A test longer than 70 characters is cut short, with "…".
- **An index:** "Index acme_debug".
- **A queue:** "Dropped" for `nullQueue`; for another, "Sent to indexQueue".
- **A host or a source:** "Host set to gw01".
- **`_TCP_ROUTING` or `_SYSLOG_ROUTING`:** "Sent to pciGroup and auditGroup".
- **Where the expression can also give something the map can't name,** Build 220's destination stays, beside the named ones: "Sourcetype set by an expression", "Index set by an expression", "Queue set by an expression", "Host set by an expression" or "Output set by an expression".
- **`_raw`, `_time` and any other field** are as before: "Text rewritten", "Timestamp set by an expression", "Indexed field site".
- **`:=` is read as `=`.** `[acme_split_eval]` "Sets sourcetype", on stage 23, Metadata routing: in the map, the panel and the view's Matrix.
- **"The default index",** where an expression may set the index and names none, says "No input in these files sets the index, so events start in the instance’s default, main unless set elsewhere". It no longer says that no transform sets it.

**In the map of a source type an expression names** (acme:traffic), everything Build 218 gave a `REGEX`'s names:
- **Under Read, the transform's card:** "Events of acme:raw become acme:traffic here, after they are parsed. Run by local:2". acme:raw is a chip. A line runs to the source type, and the summary counts "1 naming transform".
- **The source type's card:** "Its events get this name from a transform, after they are parsed as acme:raw."
- **When nothing else names it,** its parsing lines and its own index-time transforms are faded, and its destination is "The index the events had".

**Not covered:**
- **The events an expression leaves as they were.** A destination says which events reach it; the map doesn't draw the rest. With an index named for some events, "The default index" isn't shown: Build 217's rule for a `REGEX` that sets the index.
- **A source type an expression names and nothing else in the files does** isn't in the Source type list, and has no "Follow": "Nothing else in these files names it." As for a `REGEX`.
- **Single quotes, `$field:…$` and `$pd:…$`** as values, and a value built from parts, such as `"acme:" . type` or `lower(vendor)`: "set by an expression".

### 54. Packages

- **A package is told by what it is, not by its name** (`opener` and `kindOf` in the new block). A file is looked into when its name ends `.spl`, `.tgz`, `.tar.gz`, `.tar` or `.zip`.

| The file | Is read as |
|---|---|
| Starts with the gzip mark, `1f 8b` | A gzip tar, by Build 219's reader (`configAppPackages219.expand`) |
| Starts as a zip does, `PK` | A zip, by the new block's `unzip` |
| Has `ustar` at byte 257 | A plain tar. The page compresses it and gives it to Build 219's reader |
| Named `.tgz` or `.tar.gz`, whatever it starts with | A gzip tar, as before, so a damaged one keeps Build 219's message |
| Named `.tar` or `.zip`, and none of the above | An error: "fake.zip: It isn’t a zip archive." Build 220 read such a file as a configuration file |
| Named `.spl`, and none of the above | A pipeline's text, as before |

- **A zip is read from its directory, at its end.** Only `inputs.conf`, `props.conf`, `transforms.conf`, `.spl2` and `.spl` entries are expanded, with the browser's `DecompressionStream('deflate-raw')`, or taken as they are when stored.
  - **Each file keeps its path in the zip,** so an app's `default` and `local`, and an etc folder's apps, keep their precedence. A file at the zip's top level goes under the zip's name.
  - **The limits are Build 219's:** 64 MiB for the package, 256 MiB expanded, 20,000 entries. A path that leaves the package is refused: "Unsafe path in app package".
  - **Not read, and said so:** the Zip64 format, an encrypted entry, and an entry packed by a method other than deflate.
- **The file picker and the empty panel name them:** "a Splunk app package (.spl, .tgz, .tar.gz, .tar or .zip)".
- **A dropped folder's `.tar` and `.zip` files** are taken, as its `.tgz` files are.
- **A plain tar needs `CompressionStream`,** and a compressed zip `DecompressionStream('deflate-raw')`. A browser without one says so: "This browser cannot open zip app packages; extract the package and use Upload a folder".

**Not covered:** a package inside a package. Build 219's reader doesn't open one either.

### 55. The panel's Source type list

- **A transform is in the list of each source type it gives events:** a copy's, as before, and now each name its `REGEX` or its `INGEST_EVAL` gives. Where a `REGEX`'s names can't be listed, the source types in the files that fit.
- **So is the props.conf line that runs it:** a `TRANSFORMS-` or `RULESET-` line that names such a transform. It is kept under its stanza's header, without the stanza's other lines.
- **So is a `rename` line,** in the list of the source type it names.
- **A line that is overridden or invalid** isn't followed.
- **With fortigate_traffic chosen:** "66 lines on 12 stages". The eight more are the two `TRANSFORMS-` lines on stage 22, `[force_sourcetype_fortigate]` and its four settings on stage 23, and `[fgt_traffic]`'s `rename` on stage 109.
- **The view's Matrix** lists the same lines on those stages, and the tiers under the summary count them.
- **The source type that is split** keeps its own list: fortigate_log's is "8 lines on 4 stages", as before.

### 17. Whitelist and blacklist

- **A `[source::]` stanza is left out for a monitor** when no file it names can pass the monitor's `whitelist` and `blacklist`. What the monitor's files take is then worked out from the stanzas that are left.
- **The monitor's line says which filter leaves a stanza out:**
  - "Its whitelist lets through none of the files [source::/var/log/acme/*.csv] names."
  - "Its blacklist leaves out every file [source::/var/log/zeta/....gz] names."
  - It says so only of a stanza the line would otherwise speak of. A stanza that another one overrides for those files anyway is left out without a word.
- **Where the stanzas left take every file,** the monitor's source types are theirs. `/var/log/app` now says "Its files take source type app:log from [source::/var/log/app/...] in …. Its blacklist leaves out every file [source::/var/log/app/....gz] names." It is no longer in app:archive's list in the panel, and app:archive's map has "0 inputs".
- **How it is decided** (`through` in the new block): by trying paths.
  - The paths are made from the stanza's own pattern, with each wildcard filled with plain text, with parts of the monitor's path, and with text the whitelist matches.
  - A path counts when the stanza's pattern matches it and it is under the monitor's path.
  - If one of them passes both filters, the stanza stays.
  - If none does, the stanza is left out, and the filter that stopped them is named.
- **Where the page can't tell, nothing changes:**
  - a filter that isn't a regular expression JavaScript can read, such as `*.log`;
  - a whitelist with a lookahead or a back-reference, when no path tried gets through;
  - a stanza written as a regular expression, or with three or more wildcards and a whitelist, when no path tried gets through;
  - a monitor whose path has wildcards and that has a whitelist too. Splunk makes a whitelist of the wildcards, and the page doesn't work out how the two combine.
- **A monitor with neither filter** is matched exactly as before.

### Where the files act

- **Under the panel's summary, a tile for each tier:** Universal Forwarder, Heavy Forwarder, Indexer and Search Head. Each has the number of lines that take effect there.
  - With the Fortinet add-on: 6, 21, 21 and 213.
  - Each number is the panel's own for that component: the first chip of its summary when the component is chosen in the strip.
  - "The lines that take effect on each tier. Index-time lines count on both the Heavy Forwarder and the Indexer: they act on whichever parses the data first."
- **"+21 for its own data",** in amber under a tile's number: the lines that act there only on data that tier reads itself. They are the panel's "only for data it reads itself".
- **A tile is a button.** It chooses its component in the strip, where the panel says which lines they are. It is then pressed (`aria-pressed`), and keeps the focus. Pressed again, it chooses All components.
- **With a source type chosen,** the tiles count that source type's lines.
- **With several apps, a row for each,** headed with the app's name: "Where each app acts".
  - The apps are in the order Splunk reads them, by their folders' names.
  - Then `etc/system`'s files, then "Files with no app": files uploaded without a folder.
- **Nothing is shown** with no files, or with a pipeline only.
- **At 390 px** the tiles wrap inside the page.

### Folded runs

- **In the map's Search column, six or more lines of one kind in a row fold:** `EXTRACT-`, `REPORT-`, `FIELDALIAS-`, `EVAL-` or `LOOKUP-`.
- **A fold says** its count and its first three names: "13 FIELDALIAS- lines", "Field aliases: vendor_action, vendor_status, fortigate_event_vendor_url and 10 more".
- **It opens in place,** by a click or Enter: it is a `<details>`. The lines inside are the lines Build 220 draws.
- **It stays as it was left** through other source types and components, for the visit.
- **A run with a line that names a missing transform starts open.**
- **The summary's count is unchanged:** "50 search-time settings".
- **fortigate_event's map is 1,422 px tall,** where Build 220's is 4,304. The other three fortigate source types fold the same way: 1,041 to 1,310 px, where Build 220's are 3,192 to 3,722.
- **With its folds unwrapped, a map is Build 220's,** element for element (see "Check before uploading", 2).

### Unchanged

- The example's four maps, for every component.
- A `REGEX` split, a copy and a rename in the map.
- A monitor with no whitelist or blacklist, and every other input.
- `.tgz`, `.tar.gz`, `.spl2` and .conf uploads, and a `.spl` file that is a pipeline's text.
- Every other view.

## The edits

In Build 220's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is. The number in brackets is the change the edit belongs to.

**`<script id="config-view-v205">`:**

- **Line 13,536 (53).** In `evalTargets`: a field's name doesn't end with a colon, so `sourcetype:=…` sets `sourcetype`, as `sourcetype=…` does.
```
old: const m=expr.slice(start,i).trim().match(/^([A-Za-z_][\w:.-]*)\s*:?=(?!=)/);if(m)out.push(m[1]);start=i+1}}
new: const m=expr.slice(start,i).trim().match(/^([A-Za-z_][\w.-]*(?::[\w.-]+)*)\s*:?=(?!=)/);if(m)out.push(m[1]);start=i+1}}
```
- **Line 13,629 (17).** The monitor's line says which stanzas its whitelist or blacklist leaves out.
```
old: if(input.path&&!st.keys.get('sourcetype')){const src=sourceMatch(input.path);if(src.note)note+=`${note?' ':''}${src.note}`}
new: if(input.path&&!st.keys.get('sourcetype')){const src=sourceMatch(input.path,st);for(const say of [src.note,src.left])if(say)note+=`${note?' ':''}${say}`}
```
- **Line 13,632 (17).** `sourceMatch` passes the monitor's stanza on, for its whitelist and blacklist.
```
old: const sourceMatch=path=>window.configSourceMatches207?.(path,kindFiles('props').flatMap(f=>f.doc.stanzas).filter(s=>s.kind==='source'),line=>`${fileLabel(fileById(line.fid))} line ${line.n}`)||{note:'',types:null};
new: const sourceMatch=(path,input)=>window.configSourceMatches207?.(path,kindFiles('props').flatMap(f=>f.doc.stanzas).filter(s=>s.kind==='source'),line=>`${fileLabel(fileById(line.fid))} line ${line.n}`,input)||{note:'',types:null};
```
- **Line 13,651 (17).** In `assignTypes`: the monitor's source types are those of the stanzas its files can still match.
```
old: const set=st.keys.get('sourcetype')?.value,src=!set&&st.input?.path?sourceMatch(st.input.path).types:null;
new: const set=st.keys.get('sourcetype')?.value,src=!set&&st.input?.path?sourceMatch(st.input.path,st).types:null;
```
- **Line 13,655 (55).** At the end of `assignTypes`: the new block adds the source types each transform gives events, and marks the lines that give events a name.
```
old: pm.types=[...found].sort();if(pm.focus!=='all'&&!found.has(pm.focus))pm.focus='all'}
new: pm.types=[...found].sort();if(pm.focus!=='all'&&!found.has(pm.focus))pm.focus='all';window.configFollow221?.follow()}
```
- **Line 13,656 (55).** `inFocus`: a marked line is in the list of the source types it names, and so is its stanza's header.
```
old: const inFocus=r=>pm.focus==='all'||(r.stanza?(r.stanza.types===null||r.stanza.types.has(pm.focus)):false);
new: const inFocus=r=>pm.focus==='all'||(r.stanza?(r.stanza.types===null||r.stanza.types.has(pm.focus)||!!(r.kind==='stanza'?r.stanza.also:r.also)?.has(pm.focus)):false);
```
- **Line 13,677 (tiers).** `effect` takes the tier to check, the strip's by default.
```
old: function effect(r){const m=r.m,t=tier();if(!m)return null;
new: function effect(r,t=tier()){const m=r.m;if(!m)return null;
```
- **Line 13,704 (54).** The file picker offers them.
```
old: accept:'.conf,.txt,.spl2,.spl,.tar.gz,.tgz,application/gzip,application/x-gzip,text/plain'
new: accept:'.conf,.txt,.spl2,.spl,.tar.gz,.tgz,.tar,.zip,application/gzip,application/x-gzip,application/x-tar,application/zip,text/plain'
```
- **Line 13,751 (54).** The empty panel names them.
```
old: a Splunk app package (.tar.gz or .tgz), or an app or etc folder
new: a Splunk app package (.spl, .tgz, .tar.gz, .tar or .zip), or an app or etc folder
```
- **Line 13,758 (tiers).** In `renderPanel`: the new block's summary, under the panel's own.
```
old:  <div class="propsSummary205" aria-live="polite">${summary()}</div>
new:  <div class="propsSummary205" aria-live="polite">${summary()}</div>${window.configFollow221?.install()||''}
```
- **Line 13,830 (54).** In `readFiles`: the new block says whether an entry is a package, from its first bytes, and how to open it.
```
old: const expanded=[];for(const entry of list){if(/\.(tar\.gz|tgz)$/i.test(entry.path)){try{expanded.push(...await window.configAppPackages219.expand(entry.file))}catch(e){errors.push(`${entry.file.name}: ${e.message}`)}}else expanded.push(entry)}list=expanded;
new: const expanded=[];for(const entry of list){const open=window.configFollow221?await window.configFollow221.opener(entry):/\.(tar\.gz|tgz)$/i.test(entry.path)?()=>window.configAppPackages219.expand(entry.file):null;if(open){try{expanded.push(...await open())}catch(e){errors.push(`${entry.file.name}: ${e.message}`)}}else expanded.push(entry)}list=expanded;
```
- **Line 13,843 (54).** A dropped folder's .tar and .zip files are taken too.
```
old: if(/^(inputs|props|transforms)\.conf$/i.test(entry.name)||/\.(spl2?|tar\.gz|tgz)$/i.test(entry.name))out.push(
new: if(/^(inputs|props|transforms)\.conf$/i.test(entry.name)||/\.(spl2?|tar\.gz|tgz|tar|zip)$/i.test(entry.name))out.push(
```
- **Line 13,982 (tiers).** The Config view shares `counted`, the lines its summary counts.
```
old: window.configView205={parseConf,confType,
new: window.configView205={counted,parseConf,confType,
```

**`<script id="config-type-map-v217">`:**

- **Line 15,094 (17).** In the map's `gather`: an input matches a [source::] stanza only where its whitelist and blacklist let it.
```
old: !!window.configSourceMatches207?.(input.input.path,[src],l=>cv.where(l))?.note;
new: !!window.configSourceMatches207?.(input.input.path,[src],l=>cv.where(l),input)?.note;
```
- **Line 15,097 (53).** In `gather`: a transform with INGEST_EVAL can name this source type too.
```
old: if(st.keys.get('DEST_KEY')?.value!=='MetaData:Sourcetype'||!role?.usedBy?.length||role.search||role.area!=='stage')continue;const hit=named(st)
new: if((!st.keys.get('INGEST_EVAL')&&st.keys.get('DEST_KEY')?.value!=='MetaData:Sourcetype')||!role?.usedBy?.length||role.search||role.area!=='stage')continue;const hit=named(st)
```
- **Line 15,107 (53).** In `named`: the source types an INGEST_EVAL names come from the new block.
```
old: function named(st){const fmt=(st.keys.get('FORMAT')?.value||'').trim().replace(/^sourcetype::/i,''),lists=
new: function named(st){const ie=st.keys.get('INGEST_EVAL')?.value;if(ie)return window.configFollow221?.evalNames(ie)||[];const fmt=(st.keys.get('FORMAT')?.value||'').trim().replace(/^sourcetype::/i,''),lists=
```
- **Line 15,111 (53).** In `outcomes`: what an INGEST_EVAL leads to comes from the new block. The loop after it is left for a page without the block.
```
old:  if(ingest){const out=[];for(const m of ingest.matchAll(
new:  if(ingest&&window.configFollow221)return window.configFollow221.evalOutcomes(ingest,st.name);if(ingest){const out=[];for(const m of ingest.matchAll(
```
- **Line 15,217 (53).** In `build`: a destination an expression names says which test leads to it.
```
old: for(const o of isLate(r)?[]:outs)edges.push({from:id,to:result(o,o.found?.length?
new: for(const o of isLate(r)?[]:outs)edges.push({from:id,to:result(o,o.detail?o.detail:o.found?.length?
```
- **Line 15,225 (53).** The default index's card doesn't say no transform sets the index when an expression may.
```
old: 'No input or transform in these files sets the index, so Splunk uses the instance’s default, main unless set elsewhere'),{seq:-1});
new: results.has('index:?')?'No input in these files sets the index, so events start in the instance’s default, main unless set elsewhere':'No input or transform in these files sets the index, so Splunk uses the instance’s default, main unless set elsewhere'),{seq:-1});
```
- **Line 15,232 (folds).** In `build`, the Search column: a card's lines are kept as a list,
```
old:   const body=`<ul>${lines.map(r=>{if(r.key==='rename'){
new:   const items=lines.map(r=>{if(r.key==='rename'){
```
- **Line 15,235 (folds).** and the new block folds its long runs.
```
old: <div class="tmNestedList217">${runs}</div></li>`)}).join('')}</ul>`;
new: <div class="tmNestedList217">${runs}</div></li>`)}),body=`<ul>${window.configFollow221?.fold(lines,items,T+'|'+st.name)??items.join('')}</ul>`;
```
- **Line 15,310 (53, 55).** The map shares `named` with the new block.
```
old: window.configTypeMap217={gather,outcomes,phaseOf,draw:()=>{signature='';draw()}};
new: window.configTypeMap217={gather,outcomes,named,phaseOf,draw:()=>{signature='';draw()}};
```

**Without the new block,** each edit does what Build 220 does: they reach it through `window.configFollow221?.…`.

## The new blocks

Before `</body>`, after `builder-drag-isolation-records-v220`, in this order:

1. **`<style id="config-follow-install-v221-styles">`,** containing [`docs/mockups/config-follow-install-prototype.css`](mockups/config-follow-install-prototype.css): the tiles and their rows, and a fold's summary.
2. **`<script id="config-follow-install-v221">`,** containing [`docs/mockups/config-follow-install-prototype.js`](mockups/config-follow-install-prototype.js). It defines `window.configFollow221`:

| For | Functions |
|---|---|
| Expressions | `assignments(expr)` splits an `INGEST_EVAL`. `values(expr, field)` gives what an expression can give a field. `evalOutcomes(expr, name)` gives the map a transform's destinations, and `evalNames(expr)` the source types it names |
| The list | `gives(stanza)` gives the source types a transform gives events. `follow()` runs at the end of the Config view's analysis |
| Filters | `through(path, name, whitelist, blacklist)` decides whether a file a stanza names gets through. `samples(regex)` gives a few texts a regular expression matches |
| Packages | `kindOf(file)` tells a gzip file, a tar and a zip by their first bytes. `unzip(file)` reads a zip. `opener(entry)` gives `readFiles` the way to open an entry that is a package |
| Tiers | `install()` gives the panel the tiles |
| Folds | `fold(lines, items, key)` gives the map a card's list, with its long runs folded |

It also does three things when it loads:
- **It wraps `window.configSourceMatches207`,** to take a fourth argument: the monitor's stanza. The result gains `left`, the sentence about the stanzas left out.
- **It listens for clicks on `#configView205`,** for the tiles.
- **It listens for `toggle` on `#configTypeMap217`,** to keep each fold as it was left.

**It has to come after** `config-view-v205`, `five-fixes-v207` and `config-app-packages-v219`: it reads `window.configView205` and wraps `window.configSourceMatches207` as it loads.

## Build records

After the edits and the blocks, in a new `<script id="config-follow-install-records-v221">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations", two items:
  `['The Config view follows expressions, packages, splits and filters','The source type map reads an INGEST_EVAL: the source types, index, queue, host and output its expression names are destinations, each with the test that leads to it, and a source type an expression names shows that transform. App packages open as .spl, .tgz, .tar.gz, .tar or .zip. With a source type chosen, the panel keeps the transform that gives events that name, the line that runs it and a rename that leads to it. A monitor’s whitelist and blacklist decide which [source::] stanzas its files can match.',true]`
  and `['Where configuration files act, and shorter source type maps','Under the Config panel’s summary, a tile for each tier counts the lines that take effect there, app by app, and chooses its component. In the source type map, a run of six or more search-time lines of one kind folds to its count and opens in place.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 220 did in `builder-drag-isolation-records-v220`, with Build 221.

## Found while testing (not changed)

All four show on Build 220 too.

1. **A monitor only some of whose files a stanza names isn't an input in any map.** `[monitor:///var/log/acme]` with `[source::/var/log/acme/*.log]`: the monitor gets no source types of its own, so the panel keeps it in every source type's list, and acme:log's map says "0 inputs". So the map shows a whitelist's or a blacklist's work only for a monitor all of whose files take source types.
2. **Whether a stanza names a monitor's files can depend on the other stanzas.** `configSourceMatches207` takes a monitor's path for a directory when it ends with a separator, or when some stanza's pattern starts with it. So `[source::/var/log/*/site/*.csv]` is matched to `[monitor:///var/log/acme]` when `[source::/var/log/acme/*.log]` is in the files too, and not without it. The panel asks about all the stanzas at once and the map about one at a time, so the two can differ.
3. **A monitor's path with a wildcard is never taken for a directory.** `[monitor:///srv/*/site]` matches no stanza for the files under it, such as `[source::/srv/*/site/*.csv]`.
4. **A package inside a package isn't opened.** A `.spl` entry inside a `.tgz` or a `.zip` is taken for a pipeline's text, not for a package.

## Check before uploading

Run with Build 220 + the edits and the blocks, and with Build 220 as shipped for comparison.

### 1. The six changes: 70 checks. All pass with the edits; 53 fail on Build 220

| Checks | What they find | Fail on Build 220 |
|---|---|---|
| 53. Expressions (15) | acme:raw: "Becomes acme:traffic", "Becomes acme:audit", "Index acme_debug" and "Dropped", each with its test, such as "Events where match(_raw,"type=traffic"), in [acme_split_eval]"; a line from each transform, each starting and ending on its cards; "4 destinations". `[acme_split_eval]` "Sets sourcetype", on stage 23 in the panel. "Follow acme:traffic" opens it: under Read, `[acme_split_eval]` and `[eq_form]`, "Events of acme:raw become acme:traffic here, after they are parsed"; "2 naming transforms"; its card says its events were parsed as acme:raw or plain:eq. `=` names a source type as `:=` does. A name with no test: "Every event [always_st] runs on", and `site="syd"` beside it is still "Indexed field site". A source type nothing else names has no "Follow": "Nothing else in these files names it." `host=coalesce(dvc,"gw01")`: "Host set to gw01", "Events where isnull(dvc), in [ghost_st]", and "Host set by an expression" beside it; `_TCP_ROUTING`: "Sent to pciGroup and auditGroup". `lower(vendor)` is still "set by an expression", and the default index's card says "No input in these files sets the index". No page errors | 13 |
| 54. Packages (13) | `A_acme.spl`, the same app as a plain `.tar`, as a `.zip` and as a `.zip` stored without compression: each "3 files from A_acme", with its source type. A zip of an etc folder: five files, "A_acme, Z_acme", and `etc/system/local` overriding the apps. A pipeline's `.spl2` in a zip goes to the map. A `.spl` file that is a pipeline's text is still a pipeline. The Fortinet add-on under the `.spl` name: its two files and ten source types. Three packages at once. Messages, with nothing loaded: a cut `.tgz`, "Cannot decompress app package"; an empty `.tgz` and a zip with no configuration, "App package contains no inputs.conf, props.conf, transforms.conf or SPL2 pipeline files"; text named `.zip` or `.tar`, "It isn’t a zip archive", "It isn’t a tar archive"; a path with `..`, "Unsafe path in app package"; a cut zip, "Invalid app package: the zip file has no directory". The picker and the empty panel name the five endings. A `.zip` and a `.spl` dropped on the panel open. No page errors | 11 |
| 55. The list (10) | The add-on, fortigate_traffic chosen: `[fortigate_log]` and `[fgt_log]`, each with its one `TRANSFORMS-` line and none of its other lines; `[force_sourcetype_fortigate]` and its lines; `[fgt_traffic]` and its `rename`; "66 lines on 12 stages"; the Matrix has them on stages 22, 23 and 109. fortigate_log keeps "8 lines on 4 stages". acme:traffic keeps `[acme:raw]`'s `TRANSFORMS-split` line, `[acme_split_eval]` and `[eq_form]`, and not `[acme_index_eval]`. The example's acme:fw:denied keeps `[acme:fw]`'s `TRANSFORMS-copy` line. No page errors | 7 |
| 17. Filters (11) | A whitelist and a blacklist each leave a stanza out, and say so. A monitor with neither, and one whose whitelist is `*.log`, are word for word as before. With its archives blacklisted, a monitor's files all take the one source type left; the blacklisted source type's map has "0 inputs" and no line, and the other's has one of each. A stanza that another overrides anyway isn't spoken of. A whitelist beside wildcards in the monitor's path is left undecided. A stanza with a wildcard where the monitor's own folder is, `[source::/var/log/*/site/*.csv]`, is left out too. No page errors | 5 |
| Tiers (12) | Nothing with no files. The add-on: 6, 21, 21 and 213, "+21 for its own data" on the Search Head. Each tile's number is the summary's first chip for that component, and the chosen tier's tile is pressed. A tile chooses its component in the strip and keeps the focus; Enter on it again goes back to All components. With fortigate_log chosen: 1, 7, 7 and 0, "+7 for its own data". Two apps: a row each, in the order Splunk reads them, adding up to the panel's count. A zip of an etc folder: A_acme, Z_acme, then etc/system. The summary sits between the panel's own and its files. At 390 px the tiles wrap inside the page. No page errors | 10 |
| Folds (9) | fortigate_event: two folds, "13 FIELDALIAS- lines" with its first three names "and 10 more", and "32 EVAL- lines"; closed, with none of their lines showing. The map is under 1,500 px tall, every line starts and ends on its cards, and the summary still says "50 search-time settings". A click opens a fold in place, and the lines are drawn again. It stays open through another source type and another component. Enter closes it. A run of five lines stays as it is; a run of six folds. A run with a line that names a missing transform starts open. The example has nothing to fold. No page errors | 7 |

The 17 that pass on Build 220 too check what mustn't change: an expression that names nothing, a `.spl` file that is a pipeline's text, the split source type's own list, a monitor with no filter or with one the page can't decide, an empty panel, the example's map, and no page errors.

**The new block's own functions, in Node:** 81 checks of `values`, `assignments`, `evalOutcomes`, `evalNames`, `samples` and `through`, all pass.

### 2. Regression against Build 220

The new tiles and the empty panel's list of package endings are set aside before comparing: every Config snapshot would differ by them.

| What is compared | Result |
|---|---|
| View text, every view, no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with no files: its text and the panel's HTML | The same |
| The Config view with the example, for every component and source type choice: the panel's HTML, the Matrix's HTML and the page's text | 60 of 75 the same. The 15 that differ are acme:fw:denied's, for each of the five components: its list gains `[acme:fw]` and the `TRANSFORMS-copy` line that runs its copying transform (55), "10 lines on 4 stages" where it was 9 on 3 |
| The same, the map's HTML | 25 of 25 the same |
| The Config view with the Fortinet add-on, for All components and the Search Head, and every source type choice: the panel's HTML, the Matrix's HTML, the map's HTML and the page's text | 56 of 88 the same: All source types, fortigate_log and the five fgt_ source types. The 32 that differ are the four source types the transform names, fortigate_traffic, fortigate_utm, fortigate_event and fortigate_anomaly: their lists gain the eight lines (55), and their maps fold (see the next row) |
| The map with its folds unwrapped, element for element (the lines' SVG and the destination cards' offsets set aside): the example's four source types and the add-on's ten, each for three components | 42 of 42 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 220 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool | Result |
|---|---|
| The source type map's 82 checks (from its handoff) | 81 of 82. The one that differs is "INGEST_EVAL index and queue": it expected "Index set by an expression" and "Queue set by an expression" for `INGEST_EVAL = index="ix", queue=if(x,"nullQueue","indexQueue")`, which now gives "Index ix", "Dropped" and "Sent to indexQueue". With that expectation rewritten, 82 of 82. Build 220: 82 of 82 |
| The splits' 40 checks (from Build 218's handoff) | 40 of 40 |
| Ingest Processor pipelines' 31 checks (the same handoff) | 31 of 31 |
| The space tool | The same output as Build 220 |
| The connector tool | The same output as Build 220 |

### 3. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of seven visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 220 | With the edits |
|---|---|---|
| The example: a draw | 4.6 ms (4.2 to 5.9) | 5.7 ms (4.9 to 7.0) |
| The example: an analysis | 0.5 ms (0.5 to 0.8) | 0.7 ms (0.6 to 1.0) |
| The add-on, all source types: a draw | 9.3 ms (8.9 to 11.1) | 11.8 ms (10.1 to 13.3) |
| The add-on: an analysis | 0.2 ms (0.2 to 0.3) | 0.4 ms (0.4 to 0.5) |
| The add-on, fortigate_event: a draw | 6.8 ms (5.9 to 8.5) | 7.9 ms (7.0 to 9.0) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 3.3 ms (3.1 to 4.5) | 4.0 ms (3.9 to 5.2) |
| The same: an analysis | 24.8 ms (24.3 to 29.8) | 76.8 ms (70.9 to 81.8) |

- **A draw** takes a little longer for the tiles: one pass over the lines, with four tiers each.
- **An analysis** runs when files are added or removed, not at each draw. It takes longer where monitors have filters: each `[source::]` stanza is tried against each such monitor once, and the answer kept.

The perf tool wasn't run: it times the Builder.

# Builder handoff: Event types, tags and every sample in Try an event

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 226.
**Applied:** as Build 227, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="config-try-v227">` (180 lines), after `config-eval-v226`, containing [`docs/mockups/try-types-and-samples-prototype.js`](mockups/try-types-and-samples-prototype.js). It sets `window.configTry227`.
- `<style id="config-try-v227-styles">` (24 lines), after `config-tools-v224-styles`.

**Seven in-place edits,** under "The edits": six in `<script id="config-tools-v224">`, and one in the page's `render()`. Each old string occurs exactly once in Build 226, none changes the number of lines, and each is on a line of its own.

The edits, the block and the styles are also in [`docs/mockups/try-types-and-samples.diff`](mockups/try-types-and-samples.diff), a unified diff against Build 226's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Do it", for two items of the earlier list:

> 12. Event types, tags and CIM for a tried event. The path stops at field aliases. Build 222 already reads each event type's search, but it can only leave conditions on other fields open, such as `subtype=ips`. A tried event's real fields would settle them. The path could then end with the event types it gets, their tags, and the CIM data models it lands in.
>
> 23. Try every sample at once. Run all 54 of the Fortinet add-on's sample events, or a pasted batch, and summarize: for each line, how many events it gave something to; the lines no event uses; for each field, how many events have it.

Since item 12 was written, Build 225 added calculated fields and lookups to the path, so it now stops at the lookups.

**What Splunk does:** the new section of [`docs/splunk-checks.md`](splunk-checks.md), "Event types and tags". It has each rule below, the events that show it, and each of 52 event types with Splunk's answer and the page's. Splunk Enterprise 10.6.1.1 ran in Docker, as for Build 226.

**Mockup (the target):** [`docs/mockups/try-types-and-samples-mockup.html`](mockups/try-types-and-samples-mockup.html).
- Nine scenes have the edits applied to Build 226.
- The two "Today" scenes are Build 226.
- Each is set up by the same steps on both pages.
- The screenshots are `docs/mockups/compare/try-types-and-samples-*.png`.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in ten scenes, as its package. Its `samples` folder has the 54 sample events. It isn't in the repository, because Splunk licenses it.

**A made-up app, `pe_et`,** covers each rule of an event type's search, and ran in Splunk. Its files are under "The made-up app" below.

## Today, in Build 226

- **The path ends with the lookups.** Take the Fortinet add-on's first config change sample, tried as `fortigate_log`. Its last row is:
  > LOOKUP-fortigate_severity: level “information” is in 1 row of ftnt_severity_info.csv: severity = “informational”, severity_id = “6”

  Build 222's map shows the event types that might take a source type's events, and what they ask of other fields. A tried event doesn't settle them.
- **A sample's own eventtype is listed as a field.** Eleven of the 54 samples have `eventtype=` in their text. For them, Build 226 lists a field `eventtype`, such as “signature” for the IPS samples. Splunk gives those events their event types instead.
- **One event at a time.** The Try panel tries the event in its box, and a sample has to be picked first. The 54 can't be tried together.
- **A click on a row of the fields table can throw an error,** "Cannot read properties of undefined (reading 'id')", once the page has drawn again.
  - The Matrix's `render()` gives every table row on the page the click that opens a stage by its id.
  - Rows outside the Matrix have no id.
  - The same handler cancels Enter and Space on a button inside such a row.

## The design

Each rule here is what Splunk 10.6.1.1 did. [`docs/splunk-checks.md`](splunk-checks.md) shows the events and searches.

### The path's three new rows

They come after the lookups, under "Search time, as" the name the event is searched as:

```
Search time, as fortigate_event
  …
  hit     LOOKUP-fortigate_severity: level “information” is in 1 row of ftnt_severity_info.csv: severity = “informational”, severity_id = “6”
  hit     Event types (eventtypes.conf): 4 of 35 take it: ftnt_fortigate, ftnt_fortigate_config_change, ftnt_fortigate_event and ftnt_fortigate_system
  hit     Tags (tags.conf): change and network, from [eventtype=ftnt_fortigate_config_change]
  hit     CIM data models: Change (All_Changes, Network_Changes)
```

- **Event types (eventtypes.conf):**
  - "N of M take it", where M counts the event types in use: not disabled, and with a search Splunk can use.
  - Then their names, in ASCII order, as Splunk lists them: eight at most, then "and K more".
  - **Some can't be settled:** ". K can’t be settled here, as host and index aren’t known for a pasted event: et_host and et_index". The reasons are host, source or index not being known; "a macro isn’t read here"; or "event types name each other".
  - **The event's own eventtype field is replaced:** ". They replace the eventtype field from its text, “signature”".
  - **The row's state:**
    - hit, when any event type takes the event;
    - skip, when none does and some can't be settled;
    - miss, otherwise.
  - **No eventtypes.conf stanza, with a tags.conf:** "these files have none".
- **Tags (tags.conf):** the tags in ASCII order, twelve at most, then the stanzas they come from, four at most: "change and network, from [eventtype=ftnt_fortigate_config_change]".
  - With none: "none, as no tags.conf stanza tags its event types or field values".
  - If the event had its own tag field, the row adds what became of it. It is replaced when there are tags. With no tags, "Splunk keeps tag for tags, so it loses the tag field from its text, “bar”".
- **CIM data models:** each data model its tags fit, with the datasets they reach, from Build 222's table of the CIM's tags: "Change (All_Changes, Network_Changes)". With none: "none fits its tags", or "none, as it has no tags".
- **With no eventtypes.conf and no tags.conf** loaded, Build 222's `knowledge().files` is false. The three rows aren't added, and the path is Build 226's.
- **Long rows:** the new styles give a row with no line to show, as these three are, `flex: 1 1 0` on its text. It wraps beside the dot instead of falling below it. A row with a line to show is drawn as Build 224 drew it.

For the made-up app's event, the three rows are:

```
  hit     Event types (eventtypes.conf): 38 of 51 take it: et_and_explicit, et_calc, et_cidr, et_empty_value, et_eq, et_eq_case, et_eq_quoted, et_gt_num and 30 more. 2 can’t be settled here, as host and index aren’t known for a pasted event: et_host and et_index
  hit     Tags (tags.conf): communicate, network, tag_calc, tag_et, tag_fv, tag_lookup, tag_mv, tag_nested, tag_space and tag_st, from [eventtype=et_eq], [eventtype=et_nested], [eventtype=et_wild], [k=abc] and 5 more
  hit     CIM data models: Network Traffic (All_Traffic)
```

### Matching an event type's search

Each event type in use is matched against the event as the lookups left it. The search uses Build 222's parse of it: terms, `AND` (written or implied), `OR`, `NOT`, brackets and `IN`. Each term is true, false, or open when it can't be settled. `AND` is false when any part is false, open when none is but some part is open, and true otherwise. `OR` is true when any part is true, open when none is but some part is open, and false otherwise.

- **field=value:** any of the field's values matches:
  - in any case;
  - with `*` as a wildcard;
  - an IPv4 range `a.b.c.d/n` takes the addresses in it;
  - two numbers compare as numbers, so `n=010` matches 10.
- **No field:** a field the event doesn't have matches nothing. Field names are case sensitive.
- **field!=value:** the field is there and none of its values matches. `NOT field=value`: none matches, or there's no field. `field=*`: the field is there, even with an empty value.
- **< > <= >=:** as numbers when both sides are; else as text.
- **Free text, or a quoted phrase:**
  - The event's text is split into pieces at the one-character breakers of Splunk's default `segmenters.conf`. The major ones are white space and `[ ] < > ( ) { } | ! ; , ' " * & ? +`; the minor ones are `/ : = @ . - $ # % \ _`.
  - The term is split the same way, keeping its `*` as a wildcard.
  - Its pieces must follow one another among the event's, in any case. So `1.2` is in 10.1.2.3, and `ab` isn't in abc.
- **sourcetype** is the name the event is searched as: after a rename, the new name, in any case.
- **host, source and index** are the event's own once a transform sets them. Otherwise the term is open: a pasted event's aren't known.
- **eventtype=x** asks what x's search asks, and a wildcard names every event type it fits. An event type that names itself, directly or through others, is left open.
- **tag=x** asks for the tags of the event's field values.
- **A macro** (`` `name` ``) isn't read: the term is open.

### Tags

- **[field=value]** tags an event whose field has that value, written exactly so: case sensitive, decoded from `%20` and the like. [sourcetype=x] takes the searched-as name in any case, as Build 222's map does.
- **[eventtype=x]** tags the events of x.
- **Only enabled tags count.** A tag set to `disabled`, or anything but `enabled`, gives nothing. A disabled event type takes no event, so its tags aren't given.
- **Field values first:** the tags of field values are found first, so that an event type's search can ask for them with `tag=`.

### An event's own eventtype and tag fields

As Splunk does:
- **eventtype:** an event that gets any event type loses the `eventtype` field taken from its text. Its event types are shown in the row instead. An event that gets none keeps the field.
- **tag:** an event always loses the `tag` field taken from its text. Its tags are shown in the row.

Lookups, field aliases and calculated fields still read the text's values first. So the Fortinet add-on's alias keeps `eventtype` as `vendor_eventtype`, as in Splunk.

### The map, for one event

`light()` calls `configTry227.light(r, T, x)` once its marks are cleared:
- **Event types:** the rows of those that take the event are lit, and those that don't are dimmed. Those that can't be settled stay as they are.
- **Tags of field values:** the stanzas that tag it are lit, and the others dimmed.
- **Data models:** the cards of those it lands in are lit, and the others dimmed.

Following the event to the source type it's searched as, as Build 224 does, shows that type's event types.

### Every sample, or every line

- **The buttons,** beside Try it:
  - "Try all 54 samples", when the files have samples;
  - "Try each of the N lines", when the box holds more than one line that isn't empty. The button shows as soon as the box has two lines, and its count follows the typing.
- **Each event** is tried as "Arrives as", one after another, by Build 226's `tryEvent` with this block's rows.
- **The summary,** under the path:
  - **Its head:** "54 sample events, each tried as fortigate_log", or "3 lines, …".
  - **What they're indexed as:** "Indexed as fortigate_event (37), fortigate_utm (12) and fortigate_traffic (5)". Searched-as names are added where a rename makes them differ, then how many are dropped, how many get no event type, and how many have event types that can't be settled.
  - **Three columns,** when event type files are loaded: each event type, tag and data model, with how many events get it, most first, then in ASCII order.
  - **Lines,** a fold headed "114 lines give something to an event; 29 lines give nothing to any":
    - each line any event's path names, with its stanza and "k of n": it gave something to k of the n events that tried it;
    - those that gave nothing first, as "None of n";
    - a button that opens the line.

    A line gives an event something when any of its steps hits for that event. It is tried when one hits or misses: a step that can't be tried, or is off, doesn't count.
  - **Fields,** a fold headed "171 fields, 14 on every event": each field, with how many events have it and the lines that give it.
  - **Each sample,** or each line, a fold with what it's searched as, its number of fields and event types, its data models, and a Show button.
- **Show** puts that event's path above the summary, with "The path above is one of them. Show them all on the map". That link takes the path away and lights the map for all of them again.
- **The map, with no event shown:**
  - each line that gave any event something is lit;
  - each line tried and giving nothing to any is dimmed;
  - so are the transforms a line names;
  - each event type any event gets is lit, and each that none gets is dimmed, unless it was left open for some event;
  - each [field=value] stanza that tags any event is lit, and the others are dimmed;
  - each data model any event lands in is lit;
  - the cards of the source types they become, and those of the index-time transforms that matched, are lit.
- **Clear** clears the summary too. So does any change to the files: each analysis runs `remerge`, which resets it.
- **The folds** stay open or closed when the summary is drawn again.
- **Time:** trying all 54 of the Fortinet add-on's samples at once takes 25 ms (median of 21 visits; 21 to 40 ms), drawing aside.

### The Matrix's rows

`render()` now gives the click that opens a stage, and its Enter and Space, to `.stage` and `#matrixBody tr` only, where it used to give them to `.stage` and every `tbody tr`. The Matrix's rows and the stage cards open their stage as before.

### Unchanged

- **Until an event is tried, nothing changes.** The regression below loads the Fortinet add-on's eventtypes.conf and tags.conf, and finds every view the same.
- **The fields list** is Build 226's, except for the `eventtype` and `tag` fields that are replaced, as above.

### Not covered

- **A pasted event's host, source and index:** the panel has no place to give them, so a search that needs them is left open.
- **Macros** in an event type's search are left open, as Build 222 leaves them.
- **CIM data models** weren't checked in Splunk: the container had no CIM app. They follow Build 222's table.
- **Some search forms:**
  - `tag::field=value` in a search;
  - wildcards in a tags.conf stanza's value;
  - `field=value` where the value is a quoted wildcard Splunk would take literally.
- **Event types' `priority`:** Splunk Web orders an event's event types by it. The row lists them in ASCII order, as Splunk's `eventtype` field does.
- **The summary** isn't saved or exported.

## The made-up app

`pe_et`, as it ran in Splunk. Its 52 event types are in [`docs/splunk-checks.md`](splunk-checks.md): each table row is a stanza, `[name]` with `search = …`, and et_disabled also has `disabled = 1`. In Splunk, the `pe_mv` transform was in another app; here it is in `pe_et`'s own `transforms.conf`.

`default/props.conf`:
```
[pe_et]
SHOULD_LINEMERGE = false
DATETIME_CONFIG = CURRENT
KV_MODE = auto
REPORT-mv = pe_mv
EVAL-calc = if(n > 5, "yes", "no")
LOOKUP-lk = pe_et_lookup k OUTPUT lk
```
`default/transforms.conf`:
```
[pe_et_lookup]
filename = pe_et_lookup.csv

[pe_mv]
REGEX = mv=(\d+)
FORMAT = m::$1
MV_ADD = true
```
`default/tags.conf`:
```
[eventtype=et_eq]
tag_et = enabled
tag_off = disabled

[k=abc]
tag_fv = enabled

[k=ABC]
tag_fv_case = enabled

[m=2]
tag_mv = enabled

[sourcetype=pe_et]
tag_st = enabled

[eventtype=et_nested]
tag_nested = enabled

[calc=yes]
tag_calc = enabled

[lk=found]
tag_lookup = enabled

[eventtype=et_wild]
network = enabled
communicate = enabled

[q=a b]
tag_space = enabled

[eventtype=et_disabled]
tag_disabled_et = enabled
```
`lookups/pe_et_lookup.csv`:
```
k,lk
abc,found
```
The event, sent as source type pe_et with host h-et to index pe:
```
k=abc n=10 mv=1 mv=2 q="a b" ip=10.1.2.3 e=""
```

## The edits

The lines are Build 226's.

- **Line 954.** In the page's `render()`: The click and the Enter or Space that open a stage go to the Matrix's rows (`#matrixBody tr`) and the stage cards, as they always meant to. They went to every table row on the page: a click on a row of Try an event's fields threw an error, as no stage has its id, and Enter or Space on a button inside such a row was cancelled.
```
old: $$('.stage,tbody tr').forEach(el=>{el.onclick=()=>openDetail(+el.dataset.id);
new: $$('.stage,#matrixBody tr').forEach(el=>{el.onclick=()=>openDetail(+el.dataset.id);
```
- **Line 16,394.** In `<script id="config-tools-v224">`: `remerge`, run by every analysis of the files (loaded, added, removed, cleared, or an app picked): a summary of every sample goes, as what it says may no longer hold.
```
old: function remerge(merged){A.hidden=new Map();
new: function remerge(merged){A.hidden=new Map();window.configTry227?.reset();
```
- **Line 16,579.** In `<script id="config-tools-v224">`: `tryEvent`, at its end: after the lookups, `configTry227.typed` adds three rows to the path (event types, tags, CIM data models), and the result keeps what they found as `typed`.
```
old:  return {steps,fields,meta,dropped:false,searchedAs:S,text}}
new:  const typed=window.configTry227?.typed(fields,steps,ctx)||null;return {steps,fields,meta,dropped:false,searchedAs:S,text,typed}}
```
- **Line 16,594.** In `<script id="config-tools-v224">`: `toolsHtml`: Try all samples and Try each line beside Try it; Clear when there's a summary too; the summary under the path.
```
old: data-try-go>Try it</button>${E.result?'<button type="button" class="propsLink205" data-try-clear>Clear</button>':''}</div>${pathHtml(T)}</div>
new: data-try-go>Try it</button>${window.configTry227?.buttons(E)??''}${E.result||window.configTry227?.current()?'<button type="button" class="propsLink205" data-try-clear>Clear</button>':''}</div>${pathHtml(T)}${window.configTry227?.html(T,E)??''}</div>
```
- **Line 16,600.** In `<script id="config-tools-v224">`: `light`: once its marks are cleared, `configTry227.light` marks the event type and tag rows and the data model cards for the event, or, with no event shown, the map for every event tried.
```
old: const x=E.result;if(!x)return;
new: const x=E.result;window.configTry227?.light(r,T,x);if(!x)return;
```
- **Line 16,618.** In `<script id="config-tools-v224">`: the Clear button's handler: it clears the summary too.
```
old: if(e.target.closest('[data-try-clear]')){E.result=null;E.text='';E.sample=null;redraw();return}
new: if(e.target.closest('[data-try-clear]')){E.result=null;E.text='';E.sample=null;window.configTry227?.reset();redraw();return}
```
- **Line 16,637.** In `<script id="config-tools-v224">`: `window.configTools224`: the panel's state, its redraw and its line labels, for `configTry227`.
```
old: version:()=>A.version,knowledge:()=>({app:A.app,meta:A.meta,hidden:A.hidden,samples:E.samples,result:E.result})};
new: version:()=>A.version,knowledge:()=>({app:A.app,meta:A.meta,hidden:A.hidden,samples:E.samples,result:E.result}),tryState:()=>E,redraw,at};
```

## The new block

**`<script id="config-try-v227">`** goes right after `config-eval-v226`'s `</script>` (line 17,005 of Build 226). It contains [`docs/mockups/try-types-and-samples-prototype.js`](mockups/try-types-and-samples-prototype.js), and it needs Build 226's `configTools224` and Build 222's `configEventTypes222`. Its styles, **`<style id="config-try-v227-styles">`**, go right after `config-tools-v224-styles`'s `</style>` (line 16,325).

`window.configTry227`:

| For | Functions |
|---|---|
| Try an event | `typed(fields, steps, ctx)` adds the three rows and returns what they found: `{eventtypes, open, none, tags, fromTypes, fromValues, models, replaced}`. `tryEvent` keeps it as `typed` |
| The map | `light(r, T, x)`: for one event `x`, or, with none, for the summary |
| Every sample | `buttons(E)` and `html(T, E)` draw the panel's parts. `batch(events, from, kind)` tries each event, `{raw, name}`, and adds them up. `current()` gives the summary's figures and `reset()` ends it |
| Matching | `test(node, ev, seen)` gives true, false or null (open). `same(pattern, value)`, `inText(term, text)` and `pieces(text)` |

## Build records

After the edits and the block, in a new `<script id="try-types-samples-records-v227">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Event types, tags and every sample in Try an event','Try an event ends with the event types the event gets, their tags and the CIM data models they fit, each search matched as Splunk 10.6.1.1 matches it. Every sample, or every pasted line, can be tried at once: what they’re indexed as, their event types, tags and data models, each line with the events it gives something to, and each field with the events that have it. A click on a table row outside the Matrix no longer opens a stage.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 226 did in its records, with Build 227 and 15 Nov 2026.

## Check before uploading

Run with Build 226 + the edits, the block and the styles, and with Build 226 for comparison.

### 1. Against Splunk

| What | Splunk 10.6.1.1 against the prototype |
|---|---|
| The Fortinet add-on's 54 sample events, tried as `fortigate_log`: their event types and tags | All 54 the same, event types and tags, with none left open |
| The made-up app's event against its 51 event types in use | 49 the same and none otherwise; et_host and et_index left open, and Splunk took both |
| Its tags | All 10 the same |
| The 54 samples' fields, as Build 226 checked them | 2,682 of 2,682 field values the same, and the source type, on all 54 events, as with Build 226 |
| Build 225's made-up app's event | 24 of 26 fields the same, as with Build 226: `strftime()` isn’t computed here, and Splunk’s own tag field hides the indexed field named tag |

### 2. The checks: 47. All pass with the edits; 36 fail on Build 226

| Checks | What they find | Fail on Build 226 |
|---|---|---|
| One event (8) | The three rows, after the lookups. The config change sample's event types and tags, Splunk's, and its data model. Its fields, Splunk's, without eventtype or tag. On fortigate_event's map, its event types and data model lit and the others dimmed. Build 226's rows before the three | 7 |
| Every sample (18) | Try all 54 samples. Its head, and what they're indexed as, with Splunk's counts. Each event type's and tag's count, Splunk's, and each data model's from Splunk's tags. The lines: those that give nothing first, the head's counts, the renaming line 54 of 54, no line tried by more events than its stanza has. Each field's count, as many as Splunk's events have it, 171 of them. Each sample's searched-as name and event types, Splunk's. The map lit for all of them on two source types | 18 |
| Show and Clear (4) | One sample's path over the summary, with its event types Splunk's, and the map lit for it alone. Show them all on the map. Clear | 3 |
| Lines (6) | Try each line hidden for one line and shown for three. Three lines tried, with Splunk's event types. The box keeps them. Files loaded again end the summary. No page errors | 3 |
| No event type files (4) | The parity app: no new rows, no Try all button, and a summary without columns. No page errors | 1 |
| The made-up app (5) | 38 of 51 take its event, as in Splunk, and the two that ask for host and index are left open, saying why. On its map, each of the 52 lit, dimmed or left as Splunk's answers say. Its tags, Splunk's, and each [field=value] stanza lit or dimmed as Splunk tagged it. No page errors | 4 |
| 390 px (2) | The summary fits, with its tables open. No page errors | 0 |

The 11 that pass on Build 226 too are “One event: eventtype and tag don’t join its fields, which are Splunk’s, as in Build 226”; “Clear: the summary goes, and the map is as it was”; “Lines: the box keeps the lines”; “Loading files again leaves no summary from the files before”; “Fortinet: no page errors”; “No event type files: the path has no new row”; “No event type files and no samples: no Try all button”; “No event type files: no page errors”; “pe_et: no page errors”; “Narrow: the summary fits a 390 px window, its tables scrolling inside it”; “Narrow: no page errors”.

**The block's own functions, in the page:** 31 checks, all pass. They cover matching a value and free text; each rule of a search, open terms, and how AND and OR settle them; and event types from made-up files: nested, by wildcard, by `tag=`, by `NOT eventtype=`, a loop, a macro, host, a disabled event type and a disabled tag. Then the rows' words, an event's own eventtype and tag fields, every event at once, and no event type files.

### 3. Regression against Build 226

Nothing is tried, so nothing is taken out before comparing: the HTML of the panel, the Matrix and the map, lines included, and the page's text.

| What is compared | Result |
|---|---|
| View text, every view, no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with no files: its text and the panel's HTML | The same |
| The Config view with the example, for every component and source type choice: the panel's HTML, the Matrix's HTML, the map's HTML and the page's text | 100 of 100 the same |
| The same with the Fortinet add-on's props.conf, transforms.conf, eventtypes.conf and tags.conf, for All components and the Search Head | 88 of 88 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 226 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool, on Build 226 + the edits | Result |
|---|---|
| Build 226's 29 checks | 29 of 29 |
| Build 226's 78 checks of its blocks, in Node | 78 of 78 |
| Build 225's 24 checks, as Build 226 runs them | 24 of 24 |
| Lookup checks: 54 checks, as Build 226 runs them | 54 of 54 |
| Build 224's 51 checks, as Build 225 runs them | 51 of 51 (48 of 51 as written: the three Build 225 changed, as on Build 226) |
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) | 64 of 64 |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote | 70 of 70 |
| The source type map's 82 checks | 82 of 82 |
| The splits' 40 checks, with the map's tools taken out as Build 224's handoff says | 40 of 40 |
| Ingest Processor pipelines' 31 checks | 31 of 31 |
| The space tool | The same output as Build 226 |
| The connector tool | The same output as Build 226 |

### 4. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 226 | With the edits |
|---|---|---|
| The example: a draw | 5.4 ms (4.7 to 7.0) | 5.0 ms (4.7 to 7.4) |
| The example: an analysis | 0.8 ms (0.7 to 1.2) | 0.8 ms (0.7 to 1.2) |
| The add-on’s props.conf and transforms.conf: a draw | 11.2 ms (9.6 to 13.6) | 10.7 ms (9.7 to 18.6) |
| The same: an analysis | 0.5 ms (0.4 to 1.1) | 0.5 ms (0.4 to 0.8) |
| The same, fortigate_event chosen: a draw | 8.1 ms (7.1 to 12.6) | 8.4 ms (7.0 to 12.0) |
| The add-on’s four configuration files: a draw | 13.7 ms (11.7 to 19.4) | 13.5 ms (11.7 to 17.2) |
| The same: an analysis | 6.9 ms (5.3 to 8.9) | 6.3 ms (5.8 to 8.1) |
| The same, fortigate_event chosen: a draw | 13.1 ms (11.4 to 16.9) | 13.2 ms (11.5 to 19.0) |
| The same and its four lookup files: a draw | 13.2 ms (11.6 to 19.0) | 13.3 ms (11.3 to 18.2) |
| The same: an analysis | 5.7 ms (5.2 to 9.7) | 5.8 ms (5.1 to 7.9) |
| The same, fortigate_traffic chosen: a draw | 6.8 ms (6.2 to 8.7) | 7.6 ms (6.4 to 10.8) |
| The four files, their lookup files and the add-on’s metadata, a search in search chosen: a draw | 13.5 ms (12.0 to 18.1) | 13.2 ms (11.0 to 19.4) |
| The same: an analysis | 7.4 ms (6.4 to 11.0) | 7.3 ms (6.3 to 12.4) |
| Trying one of the add-on’s 54 sample events, as fortigate_log, with its lookup files | 0.66 ms (0.49 to 1.26) | 0.76 ms (0.60 to 1.40) |
| Trying all 54 at once, as Try all samples does | Not on Build 226 | 24.5 ms (20.7 to 39.6) |
| fortigate_traffic’s map as SVG, for Save image | 25.0 ms (21.1 to 42.3) | 24.7 ms (22.0 to 35.3) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 4.2 ms (3.8 to 7.0) | 4.2 ms (3.8 to 6.2) |
| The same: an analysis | 73.7 ms (68.0 to 99.4) | 74.9 ms (65.6 to 87.0) |

- **With nothing tried,** the edits add no work that shows: each median is within the other page's spread.
- **Trying an event** with the add-on's four files and lookup files takes 0.76 ms with the edits, against 0.66 ms on Build 226: each is within the other's spread.

The perf tool wasn't run: it times the Builder.

### 5. The build

`index.html` as committed, Build 227, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks.
- The new checks pass on Build 227 as on the tested page: 47 of 47.

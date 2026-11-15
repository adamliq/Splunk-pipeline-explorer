# Builder handoff: lookups and calculated fields in Try an event

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 224.
**Applied:** as Build 225, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**8 in-place edits,** under "The edits": 1 in `<script id="config-lookups-v223">`, 1 in `<style id="config-tools-v224-styles">` and 6 in `<script id="config-tools-v224">`. Each old string occurs exactly once in Build 224, each edit is on a line of its own, and none changes the number of lines.
**One new block, after `<script id="config-tools-v224">`:** `<script id="config-eval-v225">`, containing [`docs/mockups/try-eval-prototype.js`](mockups/try-eval-prototype.js). It needs no styles of its own: the one style change is an edit.

The edits and the block are also in [`docs/mockups/try-eval.diff`](mockups/try-eval.diff), a unified diff against Build 224's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`. It puts the block straight after `config-tools-v224`, before Build 223's build records, so its last hunk doesn't depend on how long Build 224's records are.

**The request:** item 13 of the improvements listed for the Config screen:

> **13. Run lookups and calculated fields.** Build 223 already reads the lookup CSVs, so LOOKUP- lines could actually run: ftnt_action_lookup turns ftnt_action into action. A small eval engine would cover most EVAL- lines, and anything outside it would be reported, not guessed. Of fortigate_traffic's 18 calculated fields, most are coalesce, if, case or plain arithmetic. The same engine could run INGEST_EVAL at index time.

**Mockup (the target):** [`docs/mockups/try-eval-mockup.html`](mockups/try-eval-mockup.html). Five scenes have the edits and the block applied to Build 224, and the two "Today" scenes are Build 224, each set up by the same steps. The screenshots are `docs/mockups/compare/try-eval-*.png`.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in four scenes, as its package: its configuration files, its four lookup files and its samples. It isn't in the repository. A made-up app, `Splunk_TA_calc`, covers the rules the add-on doesn't use: `INGEST_EVAL`, `OUTPUTNEW`, `WILDCARD` and `CIDR` lookups, `max_matches`, `min_matches` and `default_match`, `case_sensitive_match`, a KV store lookup and a nested one.

## Today, in Build 224

- **Calculated fields and lookups are counted, not run.** The Fortinet traffic sample's path ends: “18 calculated fields (EVAL-) aren’t computed here” and “2 lookups (LOOKUP-) aren’t run here”.
- **So the event keeps the fields the add-on means to change:** its `action` stays “accept”, as the extraction gives it, where the add-on’s lookup makes it “allowed”.
- **`INGEST_EVAL` transforms are passed over:** each of the made-up app's four says “[calc_ingest_index] evaluates INGEST_EVAL, which isn’t tried here”, so the index it sets, the fields it writes and the queue it chooses aren't shown.
- **Build 223's lookup checks keep no row:** each lookup file's header and its count of rows, which is all a lookup can't run on.

## What Splunk does

From Splunk's documentation:
- **[props.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.4-configuration-file-reference/props.conf):**
  - `EVAL-<fieldname>`: "When multiple EVAL-* statements are specified, they behave as if they are run in parallel, rather than in any particular sequence." With `EVAL-x = y*2` and `EVAL-y=100`, x is the original y times 2.
  - "Splunk software processes calculated fields after field extraction and field aliasing but before lookups", and "You cannot use a field added through a lookup in an eval statement for a calculated field."
  - `LOOKUP-<class> = $TRANSFORM (<match_field> (AS <match_field_in_event>)?)+ (OUTPUT|OUTPUTNEW (<output_field> (AS <output_field_in_event>)? )+ )?`.
  - With `OUTPUT`, "the output fields are always overridden", and for an event with all its match fields, "no matching entry in the lookup table clears all of the output fields". With `OUTPUTNEW`, "each output field is only written out if it did not previous exist". With no output clause, "all fields in the lookup table except for the match fields".
- **[transforms.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.4-configuration-file-reference/transforms.conf):**
  - `max_matches`: "The maximum number of possible matches for each input lookup value (range 1 - 1000)", 100 when `time_field` isn't set.
  - `min_matches` is 0 unless set, and `default_match` "provides this default_match value one or more times until the min_matches threshold is reached".
  - `case_sensitive_match` is true unless set. `match_type` makes a field match with `WILDCARD(<field>)` or `CIDR(<field>)`.
  - `INGEST_EVAL = <comma-separated list of evaluator expressions>`. `a=5, a=a+2` adds two values of a; `a=5, a:=a+2` adds `a::7` once. "Keys which are commonly used with DEST_KEY or SOURCE_KEY (like "_raw", "queue", etc) can be used directly in the expression"; "source", "sourcetype", "host", "splunk_server", "linecount" and "index" are "also available". Its examples set `queue`, `index` and new indexed fields, and "assigning null() to a new field is a no-op".
- **The Knowledge Manager Manual's [About lookups](https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/10.6/use-lookups-in-splunk-web/about-lookups) and [Make your lookup automatic](https://help.splunk.com/en/splunk-enterprise/manage-knowledge-objects/knowledge-management-manual/10.6/use-the-configuration-files-to-configure-lookups/make-your-lookup-automatic):** lookups for a source type run "in lexicographical order", and "Splunk software does not support nested automatic lookups."
- **The search reference's [eval](https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference/10.4/search-commands/eval), [comparison and conditional functions](https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference/10.4/evaluation-functions/comparison-and-conditional-functions) and [text functions](https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference/10.4/evaluation-functions/text-functions):**
  - "The plus ( + ) operator accepts two numbers for addition, or two strings for concatenation"; the period "concatenates both strings and number"; "Division by zero results in a null field."
  - `case()` "defaults to NULL if none of the <condition> arguments are true"; `coalesce()` "returns the first value that is not NULL"; `match()` "finds a match against any substring"; `like()` is case sensitive, with `%` and `_` as wildcards; `in()` takes no wildcards.
  - `replace()` takes a PCRE expression, and the page's example writes its groups `\2/\1/`.
- **Not said in any of these pages:** what arithmetic or a comparison gives with a missing value; what `+` does with a number and a string; whether a CSV lookup file's spaces round its names and values are kept; whether `INGEST_EVAL` can set host, source or sourcetype. The design says what the page does in each.

## The design

### Calculated fields

- **Which:** the `EVAL-` lines of the source type the event is searched as, with `[default]`'s, the source type's own in place of any of the same name, in ASCII order of their names. The field is the name after `EVAL-`.
- **When:** after the field aliases, before the lookups. Each is evaluated with the fields as they were after the aliases, so none sees another's result. Then, in order: a value sets the field, over any value it had; no value clears it ("EVAL-devname gives no value, so devname is cleared"); one that isn't computed leaves it as it was.
- **Expressions:** numbers, double-quoted text (`\"` and `\\` are escapes; any other backslash stays, for regular expressions), field names, and `'quoted field names'`. A bare name that isn't a field, such as `null`, is a field that isn't there.

| Precedence, highest first | Operators |
|---|---|
| A sign | `-x` |
| Multiplying | `*` `/` `%` |
| Adding and joining | `+` `-` `.` |
| Comparing | `=` `==` `!=` `<` `>` `<=` `>=`, `LIKE`, `IN (…)`, `NOT LIKE`, `NOT IN` |
| Not | `NOT` |
| And | `AND` |
| Or | `OR`, `XOR` |

- **Values:** a field's value acts as a number where it reads as one (digits, a point, an exponent) and keeps its own text; a quoted literal is text.
  - `+` adds two numbers and joins two texts. A number and text isn't computed: "it adds a number to text with +, which Splunk’s docs don’t define".
  - `.` joins anything. `-`, `*`, `/` and `%` need numbers, or give no value; `/` or `%` by 0 gives no value.
  - Two numbers compare as numbers; anything else compares as text, case sensitive.
  - With a missing value, arithmetic, joining and comparing give no value, and no value counts as false in `if()`, `case()`, `AND`, `OR` and `NOT`. The docs don't say; this is the page's reading.
  - A result of true or false isn't a field's value: "it gives true or false, which a field can’t hold". A field with several values where one is needed: "it reads a field with several values".
- **Functions:** `if`, `case`, `coalesce`, `validate`, `nullif`, `null`, `true`, `false`, `isnull`, `isnotnull`, `isnum`, `isint`, `isstr`, `like`, `match`, `in`, `cidrmatch` (IPv4), `len` (and `length`), `lower`, `upper`, `trim`, `ltrim`, `rtrim`, `substr`, `replace`, `split`, `urldecode`, `tostring` (without a format), `tonumber`, `abs`, `ceil`, `ceiling`, `floor`, `round`, `sqrt`, `pow`, `exp`, `ln`, `log`, `pi`, `exact`, `min`, `max`, `md5`, `mvappend`, `mvcount`, `mvindex`, `mvjoin`, `mvdedup`. `match()` and `replace()` take PCRE through Build 224's translation, and `replace()`'s `\1` becomes JavaScript's `$1`. Any other function: "it uses strftime(), which isn’t computed here".
- **Not read:** an expression the page can't parse: "its expression can’t be read here: a “)” missing".
- **On the path,** one row where the calculated fields come: "Calculated fields (EVAL-): 5 of 9 give values: kb, later, shard, status, user_upper. 2 give no value. 2 aren’t computed here: it uses strftime(), which isn’t computed here; it adds a number to text with +, which Splunk’s docs don’t define". The first 8 names, then "and n more"; two reasons, then "and n more reasons".
- **On the map,** each `EVAL-` line is lit when it gives a value, dimmed when it gives none, and left as it is when it isn't computed; a folded run is lit when one of its lines is.

### Lookups

- **Which:** the `LOOKUP-` lines of the source type the event is searched as, with `[default]`'s, in ASCII order of their names. Each sees the fields as they were after the calculated fields: Splunk doesn't support nested automatic lookups, so one never matches on another's output ("LOOKUP-h_nested: the event has no dept, so it isn’t run").
- **The lookup:** the `transforms.conf` stanza the line names, and its file, found as Build 223 finds it: in its own app, among files picked on their own, then in another app. Build 223's lookup checks now keep each file's text (one edit), and the new block reads it once.
- **Not run,** left as it is on the map:
  - a KV store (`collection`), external (`external_cmd`) or time-based (`time_field`) lookup;
  - a stanza with no `filename`, a file that isn't read, or one over 20 MB, of which only the header is read.
- **Not runnable,** dimmed on the map: a stanza that isn't in `transforms.conf`, a line with no field to match on, or a column the line names that isn't in the file.
- **Matching:** every match field of the line (`field AS event_field`) against its column, exactly and case sensitive unless `case_sensitive_match = false`; with `WILDCARD(<field>)`, `*` in the row's value matches anything; with `CIDR(<field>)`, an IPv4 range. The first `max_matches` rows in the file's order, 100 unless set; a field with several values matches if any of them does.
- **Output:** the line's `OUTPUT` or `OUTPUTNEW` fields, or, with neither, every column but the match fields. Several rows give several values.
  - No row: `min_matches` gives `default_match` that many times; else `OUTPUT` clears the output fields the event has, and `OUTPUTNEW` leaves them.
  - `OUTPUTNEW` writes only fields the event doesn't have, and says which it kept.
  - The event without a match field: the lookup isn't run.
- **Spaces:** a quoted CSV value keeps what's inside its quotes; spaces round any other name or value are left out, and a step that reads such a file says so: "ftnt_action_info.csv writes spaces round its names or values, which are left out here: to check". Whether Splunk keeps them isn't settled, as Build 223's check of the same file says.

| Step | Says |
|---|---|
| Rows found | "LOOKUP-a_user: user “Bob” is in 1 row of calc_users.csv: dept = “Sales”, title = “Manager”" |
| `OUTPUTNEW` | "LOOKUP-b_new: user “Bob” is in 1 row of calc_users.csv: team = “Sales”. status is kept, as OUTPUTNEW writes only fields the event doesn’t have" |
| Several rows | "LOOKUP-j_ci: user “Bob” is in 2 rows of calc_users.csv: any_dept = “Sales”, “Support”" |
| No row, `OUTPUT` | "LOOKUP-e_code: no row of calc_codes.csv has bytes “2048”, so OUTPUT clears reason" (or "so it gives nothing") |
| No row, `min_matches` | "LOOKUP-k_min: no row of calc_codes.csv has bytes “2048”, so min_matches = 1 gives default_match: bytes_label = “unknown”" |
| No match field | "LOOKUP-h_nested: the event has no dept, so it isn’t run" |
| Not run | "LOOKUP-g_kv: [calc_kv] is a KV store lookup, which isn’t run here", "… is an external lookup …", "… is a time-based lookup …", "LOOKUP-m_nofile: its file, not_here.csv, isn’t among the files read", "…: only the first 20 MB of x.csv was read, so it isn’t run" |
| Not runnable | "LOOKUP-i_col: calc_users.csv has no column nosuch", "LOOKUP-x: [y] isn’t in transforms.conf", "LOOKUP-x names no field to match on, so it isn’t run" |

The Fortinet traffic sample, arriving as `fortigate_log`, as the prototype shows its search-time path:
```
Search time, as fortigate_traffic
  hit   [field_extract] extracts 36 fields
  off   KV_MODE = none: no automatic key-value extraction
  hit   Field aliases (FIELDALIAS-): 14 of 26 give fields: dest, dest_interface, dest_ip, dvc, packets_in, packets_out, rule_id, session_id and 6 more. 12 find none of their fields
  hit   Calculated fields (EVAL-): 14 of 18 give values: app, bytes, bytes_in, bytes_out, devname, ftnt_action, packets, product and 6 more. 4 give no value
  hit   LOOKUP-fortigate_traffic_action: ftnt_action “allow” is in 1 row of ftnt_action_info.csv: action = “allowed”. ftnt_action_info.csv writes spaces round its names or values, which are left out here: to check
  hit   LOOKUP-fortigate_traffic_ftnt_protocol_lookup: proto “58” is in 1 row of ftnt_protocol_info.csv: transport = “ipv6-icmp”, protocol = “icmp”
```

- **On the map,** each `LOOKUP-` line is lit when it gives a field, dimmed when it finds no row, can't run or isn't run for want of a field, and left as it is when it isn't run here; the lookup under its line shows the same.

### `INGEST_EVAL`

- **Where:** at index time, in its transform's place among the `TRANSFORMS-` lines, run on every event. A `REGEX` in the same stanza isn't applied: the docs don't say how the two combine.
- **How:** its assignments in order. Each reads `_raw`, `queue`, `index`, `sourcetype`, `host`, `source`, `linecount` and the event's indexed fields, those it has set included; `=` adds a value, `:=` replaces the values; `null()` to a field that isn't there does nothing, and `:=` with `null()` removes one.
  - `index` sets the event's index; `queue` works as `DEST_KEY = queue` does, so `nullQueue` drops the event unless a later transform sends it back; `_raw` rewrites the event's text.
  - `host`, `source` and `sourcetype` aren't set: "its host assignment isn’t tried: Splunk’s docs show INGEST_EVAL setting index, queue, _raw and indexed fields".
  - Any other name is an indexed field, in the fields list with the `TRANSFORMS-` line that ran it.
- **Says:** "[calc_ingest_index] evaluates INGEST_EVAL: the index becomes calc_debug"; "[calc_ingest_fields] evaluates INGEST_EVAL: it writes len = “81”, len_bucket = “6” and tag = “a”, “b” as indexed fields"; "[calc_ingest_drop] evaluates INGEST_EVAL: the event goes to nullQueue, which drops it"; "… nothing changes"; "evaluates INGEST_EVAL, which can’t be read here: …" or "which isn’t tried here: …".

### The fields list

- **Its summary** says "61 fields on the event": they include calculated fields and lookups' outputs, not only extracted ones.
- **Where each comes from:** the line; for a lookup's, its file too: "LOOKUP-fortigate_traffic_action, from ftnt_action_info.csv". Several values are shown joined with commas.
- **Its header stays at its top.** The page's `th` style sticks a header 75 px down from the top of its scroll box. This list scrolls sideways, which makes the list its own scroll box, so in Build 224 its header sat over its second row once the list was opened. One style edit fixes it.

### Unchanged

Until an event is tried, nothing changes: every view, the panel and every map are as in Build 224. Without the new block, Try an event is as in Build 224: the edits fall back to its rows.

### Not covered

- **Functions:** time (`strftime`, `strptime`, `now`, `time`, `relative_time`), `printf`, `spath`, the JSON functions, `searchmatch`, `random`, `sha1` and the other hashes but `md5`, `tostring()` with a format; IPv6 in `cidrmatch()` and `CIDR` lookups.
- **Lookups:** KV store, external and time-based lookups; the `| lookup` and `| inputlookup` commands; a lookup file's sharing between apps for a search (Build 224's order ranks the lookup's stanza, not its file).
- **`INGEST_EVAL`:** typed names (`'name[int]'`) and the `$...$` forms; setting host, source or sourcetype.
- **After lookups:** event types and tags, which item 12 would add.

## The edits

In Build 224's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is.

**`<script id="config-lookups-v223">`:**

- **Line 16,134.** `put`: each lookup file keeps its text, which the lookups run on; a file over 20 MB, of which only the header is read, keeps none.
```
old:  L.files.set(path,{path,name,app:appOf(path),columns,rows:partial?null:countRows(text),bytes,gz});
new:  L.files.set(path,{path,name,app:appOf(path),columns,rows:partial?null:countRows(text),bytes,gz,text:partial?null:text});
```

**`<style id="config-tools-v224-styles">`:**

- **Line 16,319.** The tools' styles: the fields' list header stays at the list's top. The page's `th` style is sticky, 75 px from the top of its scroll box, which here is the list itself, so the header sat over its second row.
```
old: .tmFields224 th,.tmFields224 td{padding:2px 10px 2px 0;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;overflow-wrap:anywhere}
new: .tmFields224 th,.tmFields224 td{padding:2px 10px 2px 0;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;overflow-wrap:anywhere}.tmFields224 th{position:static}
```

**`<script id="config-tools-v224">`:**

- **Line 16,533.** `tryEvent`, for each transform: one with INGEST_EVAL is evaluated, its queue counted as a DEST_KEY = queue transform's is. Without the new block, it is skipped as before.
```
old:   if(val(keys,'INGEST_EVAL')||val(keys,'CLONE_SOURCETYPE')){
new:   if(val(keys,'INGEST_EVAL')&&window.configEval225){const g=window.configEval225.ingest(val(keys,'INGEST_EVAL'),{raw:text,meta,queue,fields,r});if(g.raw!==undefined)text=g.raw;if(g.queue!==undefined){const back=/^nullQueue$/i.test(queue)&&!/^nullQueue$/i.test(g.queue);queue=g.queue;qs.push({i:steps.length,q:queue,back})}steps.push({at:'index',r,name,state:g.state,say:`[${name}] ${g.say}`});continue}if(val(keys,'INGEST_EVAL')||val(keys,'CLONE_SOURCETYPE')){
```
- **Line 16,576.** `tryEvent`, after the field aliases: the calculated fields, then the lookups.
```
old:  const evals=winners(S,/^EVAL-/i),lookups=winners(S,/^LOOKUP-/i);
new:  const evals=winners(S,/^EVAL-/i),lookups=winners(S,/^LOOKUP-/i),X=window.configEval225,ctx={raw:text,meta,sourcetype:S};if(X){X.calculated(evals,fields,steps,ctx);X.lookups(lookups,fields,steps,ctx)}
```
- **Line 16,577.** The calculated fields' row of Build 224, when the new block isn't there.
```
old:  if(evals.length)steps.push({at:'search',r:null,state:'skip',
new:  if(!X&&evals.length)steps.push({at:'search',r:null,state:'skip',
```
- **Line 16,578.** The lookups' row of Build 224, when the new block isn't there.
```
old:  if(lookups.length)steps.push({at:'search',r:null,state:'skip',
new:  if(!X&&lookups.length)steps.push({at:'search',r:null,state:'skip',
```
- **Line 16,589.** `pathHtml`: the calculated fields are one row, where the first of them comes, as the field aliases are.
```
old:  const sea=x.steps.filter(s=>s.at==='search'&&(s.group!=='alias'||s===al[0])).map(s=>s===al[0]?aliases:s);
new:  const ev=x.steps.filter(s=>s.group==='eval'),evRow=window.configEval225?.row(ev),sea=x.steps.filter(s=>s.at==='search'&&(s.group!=='alias'||s===al[0])&&(s.group!=='eval'||s===ev[0])).map(s=>s===al[0]?aliases:s===ev[0]?evRow:s);
```
- **Line 16,593.** `pathHtml`: the fields' list is the event's fields, not only those extracted; a value from a lookup names its file, and several values show as a list.
```
old: <summary>${plural(fields.length,'field')} extracted</summary><table><thead><tr><th>Field</th><th>Value</th><th>From</th></tr></thead><tbody>${fields.map(([k,f])=>`<tr><td><code>${esc(k)}</code></td><td>${esc(f.value)}</td><td>${f.r?esc(f.alias?`${f.r.key}, from ${f.alias}`:f.r.key):'automatic'}</td></tr>`).join('')}
new: <summary>${plural(fields.length,'field')} on the event</summary><table><thead><tr><th>Field</th><th>Value</th><th>From</th></tr></thead><tbody>${fields.map(([k,f])=>`<tr><td><code>${esc(k)}</code></td><td>${esc(window.configEval225?.show(f.value)??f.value)}</td><td>${f.r?esc(f.alias?`${f.r.key}, from ${f.alias}`:f.lookup?`${f.r.key}, from ${f.lookup}`:f.r.key):'automatic'}</td></tr>`).join('')}
```

## The new block

After `<script id="config-tools-v224">`: **`<script id="config-eval-v225">`,** containing [`docs/mockups/try-eval-prototype.js`](mockups/try-eval-prototype.js). It defines `window.configEval225`:

| For | Functions |
|---|---|
| Expressions | `lex(text)`, `parse(text)` and `assignments(text)` read them; `run(text, get)` evaluates one, giving `{v}` or `{nc}` with why it isn't computed; `evaluate(text, fields, ctx)` does so with fields as an object |
| Try an event | `calculated(lines, fields, steps, ctx)` and `lookups(lines, fields, steps, ctx)` run at search time; `ingest(text, ctx)` runs an `INGEST_EVAL` and says what it did; `row(steps)` is the calculated fields' row on the path; `show(value)` shows a field's value |
| Its parts | `csv(text)`, `md5(text)`, `cidr(range, ip)`, `likeRe(pattern)` |

**It has to come after** `config-tools-v224`: it reads `window.configTools224`, whose PCRE translation it uses, and `state.configView205` as it loads. It reads `window.configLookups223` when a lookup runs.

## Build records

After the edits and the block, in a new `<script id="try-eval-records-v225">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Lookups and calculated fields in Try an event','Try an event runs a source type’s calculated fields (EVAL-) and its lookups (LOOKUP-), on the lookup files read, and INGEST_EVAL at index time. Each step says what it gives, the source type map lights the lines that give something, and the fields list says where each field comes from. What the page can’t compute, or Splunk’s docs don’t define, is said, not guessed.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 224 did in its records, with Build 225 and 15 Nov 2026.

## Check before uploading

Run with Build 224 + the edits and the block, and with Build 224 for comparison.

### 1. The checks: 24. All pass with the edits; 20 fail on Build 224

| Checks | What they find | Fail on Build 224 |
|---|---|---|
| The made-up app (14) | Its `INGEST_EVAL` steps, word for word, and the indexed fields they write, `=` adding a value and `:=` replacing one. The calculated fields' row, word for word, and their values; `EVAL-early` gets nothing from `EVAL-later`. Each lookup's step, word for word, and the fields they give, each with its file; `OUTPUT` clearing `reason`, `OUTPUTNEW` keeping `status`. "23 fields on the event". The fields' list header at its top. On the map, calculated fields and lookups lit, dimmed or left alone, each lookup under its line, and their folds lit. A long event `INGEST_EVAL` drops. No page errors | 13 |
| The Fortinet package (8) | 14 of `fortigate_traffic`'s 18 calculated fields give a value; `LOOKUP-fortigate_traffic_action` matches on the calculated `ftnt_action` and notes its file's spaces; the protocol lookup writes over the extracted `transport`; `action` is the lookup's "allowed". Followed, the lookups' lines and their lookups lit, and the calculated fields' fold. With the configuration files alone, each lookup says its file isn't read and the calculated fields still run. No page errors | 6 |
| 390 px (2) | The path fits. No page errors | 1 |

The 4 that pass on Build 224 too are its 4 no-page-errors checks.

**The new block's own functions, in Node:** 61 checks: reading and precedence, fields as numbers or text, missing values, the functions, MD5 against its published values, CIDR, CSV, the calculated fields' parallel rule and `INGEST_EVAL`, all pass.

### 2. Regression against Build 224

Nothing is tried, so nothing is taken out before comparing: the HTML of the panel, the Matrix and the map, lines included, and the page's text.

| What is compared | Result |
|---|---|
| View text, every view, no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with no files: its text and the panel's HTML | The same |
| The Config view with the example, for every component and source type choice: the panel's HTML, the Matrix's HTML, the map's HTML and the page's text | 100 of 100 the same |
| The same with the Fortinet add-on, for All components and the Search Head | 88 of 88 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 224 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool, on Build 224 + the edits | Result |
|---|---|
| Build 224's 51 checks. Three expected Build 224's "isn’t computed here": `EVAL-risk` now gives risk = low, so the path's last row and the fields say so, and `fortigate_traffic`'s folded calculated fields are lit. They are run with those three expectations changed and nothing else | 51 of 51 (48 of 51 as written) |
| Lookup checks: 54 checks (Build 223's handoff) | 54 of 54 |
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) | 64 of 64 |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote | 70 of 70 |
| The source type map's 82 checks | 82 of 82 |
| The splits' 40 checks, with the map's tools taken out as Build 224's handoff says | 40 of 40 |
| Ingest Processor pipelines' 31 checks | 31 of 31 |
| The space tool | The same output as Build 224 |
| The connector tool | The same output as Build 224 |

### 3. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 224 | With the edits |
|---|---|---|
| The example: a draw | 6.1 ms (4.9 to 8.5) | 5.9 ms (4.8 to 8.4) |
| The example: an analysis | 0.7 ms (0.7 to 1.3) | 0.8 ms (0.6 to 1.2) |
| The add-on’s props.conf and transforms.conf: a draw | 11.0 ms (9.7 to 17.0) | 11.6 ms (9.8 to 17.2) |
| The same: an analysis | 0.4 ms (0.4 to 0.9) | 0.5 ms (0.4 to 0.9) |
| The same, fortigate_event chosen: a draw | 8.4 ms (7.1 to 13.1) | 8.7 ms (7.2 to 10.0) |
| The add-on’s four configuration files: a draw | 14.0 ms (12.3 to 21.8) | 13.6 ms (12.0 to 20.2) |
| The same: an analysis | 6.6 ms (6.0 to 10.8) | 6.6 ms (6.1 to 9.6) |
| The same, fortigate_event chosen: a draw | 12.9 ms (11.7 to 18.8) | 14.2 ms (11.8 to 21.9) |
| The same and its four lookup files: a draw | 13.8 ms (12.1 to 21.1) | 13.8 ms (11.6 to 19.7) |
| The same: an analysis | 6.0 ms (5.4 to 10.2) | 5.9 ms (5.3 to 8.4) |
| The same, fortigate_traffic chosen: a draw | 7.4 ms (6.5 to 10.2) | 7.4 ms (6.1 to 9.9) |
| The four files, their lookup files and the add-on’s metadata, a search in search chosen: a draw | 14.0 ms (12.3 to 21.9) | 13.4 ms (11.7 to 21.9) |
| The same: an analysis | 8.3 ms (6.7 to 12.4) | 7.2 ms (6.8 to 10.0) |
| Trying one of the add-on’s 54 sample events, as fortigate_log, with its lookup files | 0.37 ms (0.22 to 0.71) | 0.61 ms (0.44 to 0.96) |
| fortigate_traffic’s map as SVG, for Save image | 22.3 ms (21.3 to 41.9) | 26.5 ms (21.3 to 39.8) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 4.1 ms (3.9 to 6.8) | 4.2 ms (3.8 to 7.0) |
| The same: an analysis | 80.9 ms (71.5 to 109.5) | 78.6 ms (70.0 to 123.9) |

- **With nothing tried,** the edits add no work that shows: each median is within the other page's spread.
- **Trying an event** with the add-on's lookup files takes 0.61 ms with the edits, against 0.37 ms on Build 224, which runs no calculated field or lookup: each expression is read once and kept, and each lookup file is read once.

The perf tool wasn't run: it times the Builder.

### 4. The build

`index.html` as committed, Build 225, is the tested page with this handoff's records. Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks. The new checks pass on Build 225 as on the tested page: 24 of 24.

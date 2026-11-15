# Builder handoff: Try an event matched to Splunk

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 225.
**Applied:** as Build 226, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One block replaced:** `<script id="config-eval-v225">` (255 lines) becomes `<script id="config-eval-v226">` (366 lines), containing [`docs/mockups/splunk-parity-prototype.js`](mockups/splunk-parity-prototype.js). It still sets `window.configEval225`, which Build 225's edits read, and names the same object `window.configEval226`.
**17 in-place edits,** under "The edits": 10 in `<script id="config-lookups-v223">` and 7 in `<script id="config-tools-v224">`. Each old string occurs exactly once in Build 225, and none changes the number of lines. One edit spans two lines; each of the others is on a line of its own.

The edits and the block are also in [`docs/mockups/splunk-parity.diff`](mockups/splunk-parity.diff), a unified diff against Build 225's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Do it", for the changes listed at the end of the Splunk checks of Build 225. Splunk Enterprise 10.6.1.1, run in Docker, showed where Try an event's readings differ from Splunk's:

> 1. Leave out empty values that `REPORT-` extractions find, unless `KEEP_EMPTY_VALS = true`.
> 2. Run lookups in sequence, each on the fields the earlier ones wrote.
> 3. `INGEST_EVAL`: set host, source and sourcetype; a type error Splunk can see stops the whole `INGEST_EVAL`.
> 4. Eval: `NOT` and `XOR` take a missing condition as false; `+` and comparisons follow Splunk's types; true and false are stored as "1" and "0"; `tostring()` gives "Null", "True" and "False"; fields with several values follow Splunk's rules.
> 5. Number formats: Splunk's precision rules at search time, and whole numbers at index time.
> 6. An unclosed quote in a `DELIMS` value is dropped.
> 7. Drop the "to check" note on CSV spaces, and replace the four "the docs don't say" readings with these results.

**What Splunk does:** [`docs/splunk-checks.md`](splunk-checks.md) has every rule below, the searches that show it, and 304 probes, each with Splunk's value, Build 225's and Build 226's.

**Mockup (the target):** [`docs/mockups/splunk-parity-mockup.html`](mockups/splunk-parity-mockup.html). Five scenes have the edits and the block applied to Build 225, and the two "Today" scenes are Build 225, each set up by the same steps. The screenshots are `docs/mockups/compare/splunk-parity-*.png`.

**The Fortinet add-on** (Fortinet FortiGate Add-on for Splunk 1.6.10, `Splunk_TA_fortinet_fortigate`) is used in the checks and in three scenes, as its package. It isn't in the repository. Two made-up apps cover the rules it doesn't use, and each ran in Splunk too:
- **`Splunk_TA_calc`**, Build 225's;
- **`Splunk_TA_parity`**, new: `INGEST_EVAL` setting host, source and source type, and a type error; empty groups; the type check; several values; precision; chained lookups; a quoted column name with a space; `DELIMS` quotes and `KEEP_EMPTY_VALS`; and automatic extraction of `key=` and `key=""`.

## Today, in Build 225

- **Splunk gives other values.**
  - Build 225's engine gives Splunk's value for 128 of the 304 probes.
  - Of the Fortinet add-on's 54 sample events, 42 match Splunk on every field. The other 12 have 20 differences between them:
    - 19 empty values, such as `user=""`, which Splunk drops;
    - 1 value with no closing quote.
- **What it can't settle, it reports.** For the made-up event of `Splunk_TA_parity`:
  - “[parity_meta] evaluates INGEST_EVAL: its host, source and sourcetype assignments aren’t tried: Splunk’s docs show INGEST_EVAL setting index, queue, _raw and indexed fields”;
  - “[parity_bad] evaluates INGEST_EVAL, which isn’t tried here: it adds a number to text with +, which Splunk’s docs don’t define”;
  - so the event is searched as parity:raw, and none of parity:web’s settings run.
- **Build 223's lookup checks mark a header's spaces as a problem:**
  - `fortigate_traffic`'s action lookup is marked “ action” has spaces;
  - its line says “Run | inputlookup ftnt_action_info.csv to see whether Splunk reads it as action”;
  - four of the add-on's `LOOKUP-` lines are counted "to check".

## The design

Each rule here is what Splunk 10.6.1.1 did; [`docs/splunk-checks.md`](splunk-checks.md) shows the searches.

### Calculated fields and `INGEST_EVAL`: the eval engine

- **Splunk's type check.** Before an expression runs, the engine works out the types Splunk can see:
  - a number written, or computed;
  - a quoted string, or a function's string (`tostring()`, `mvindex()`, `case()` with quoted values);
  - true or false;
  - or any, for a field's value, which can be a number or text.

  A clash rejects the whole expression, as Splunk's own check does:
  - `+` with a number and a string;
  - `-`, `*`, `/` or `%` with a string;
  - a comparison of a number with a string;
  - `.`, arithmetic or a text or number function with true or false.

  A rejected calculated field leaves its field as it was: "EVAL-t is rejected by Splunk’s type check: + takes two numbers or two strings, so t stays as it was". A rejected `INGEST_EVAL` runs none of its assignments: "evaluates INGEST_EVAL, which Splunk can’t compile, as + takes two numbers or two strings: none of its assignments run".
- **`+`:** adds when both values can be numbers, joins when both can be text (a field's value uses its own text), and otherwise gives no value. So `n + t` gives "5abc", `s1 + "6"` gives "56", and `h + 1` with h = 0x10 gives no value.
- **Comparisons:**
  - as numbers when both can be;
  - else as text, case sensitive, when both can be;
  - else no answer: event text against a number, so `t != 5` is false.

  A comparison with a missing value gives no answer.
- **Conditions:** `if()`, `case()`, `validate()`, `NOT`, `AND`, `OR` and `XOR` count no answer as false. `NOT`, `AND`, `OR` and `XOR` always give true or false.
- **True and false as values:** stored as 1 and 0, in calculated fields and in `INGEST_EVAL`.
- **`tostring()`:** of a missing value, "Null"; of true and false, "True" and "False"; of several values, the values joined with spaces.
- **Several values:**
  - `lower()`, `upper()` and `trim()` work on each;
  - `coalesce()`, `if()` and `nullif()` pass them on;
  - `==` with text, `in()`, `IN`, `like()` and `match()` are true when any value matches;
  - other comparisons, `cidrmatch()`, `isnull()`, `isnum()` and `isstr()` are false;
  - arithmetic, `.` and the other functions give no value;
  - `max()` and `min()` read every value.
- **Numbers.** A number written with a decimal point, in the expression or in a field's text, carries its precision, `{dp, sf}`. Whole numbers are exact.

| Operation | Precision of the result |
|---|---|
| `+`, `-` | The fewest decimal places among the operands with a point. "1.50 + 1" is 2.50 |
| `*`, `/`, `%`, `pow()`, `sqrt()`, `exp()`, `ln()`, `log()` | The fewest significant figures. "1.0 / 3" is 0.33. A number with an exponent and no point, such as `1e3`, has decimal places (0) but no figures to keep |
| `round(x, n)` | n places, of the full value: `Math.round(x * 10^n) / 10^n`, as Splunk's results match. `round(x)` is whole |
| A sign, `abs()` | The operand's |
| `min()`, `max()`, `if()`, `coalesce()`, `tonumber()` | The value passed on, with its text: `min(1.50, 3)` is 1.50 |
| `exact()`, `floor()`, `ceil()`, and whole numbers | The full value, shown in plain digits, never with an exponent |

  Rounding is half away from zero, on the number's shortest decimal digits: 0.25 to one figure is 0.3. A result keeps its full value for later steps, so `round(1.50 * 1.5, 3)` is 2.250. `INGEST_EVAL` writes the same numbers without the zeros after the point: `1.5 + 1.5` is 3.
- **Unchanged from Build 225:** the parser, the functions' list, calculated fields run in parallel, and what isn't computed (`strftime()` and the other functions in "Not covered").

### Lookups

- **In sequence.** The `LOOKUP-` lines run in order of their names, sorted by byte value, each on the fields as the earlier ones left them, as Splunk 10.6.1.1 does. A lookup that matches on another's output says so: "dept is LOOKUP-a_user’s output, as lookups run one after another, in order of their names". The Knowledge Manager Manual's "Splunk software does not support nested automatic lookups" is left as a comment in the block.
- **Spaces in a CSV file:** left out round a name or value that isn't quoted, and kept inside quotes, as Splunk does. A step says nothing about them.

### `INGEST_EVAL`

- **host, source and sourcetype** are set. Either `=` or `:=` replaces the value, and the last one wins. The step says "the host becomes parity-host; the source becomes parity-source; the source type becomes parity:web".
- **A new source type:**
  - the rest of the original's index-time transforms run, and read it;
  - its own index-time settings don't run;
  - the event is searched as it.

  This is as Try an event already treats `DEST_KEY = MetaData:Sourcetype`.
- **A single field written** reads "as an indexed field". Build 225 wrote "as indexed field".

### Extractions (`config-tools-v224`)

- **Empty values give no field:**
  - a `REPORT-` transform's, unless `KEEP_EMPTY_VALS = true`;
  - an `EXTRACT-` group that captures nothing;
  - automatic extraction's `key=`, though `key=""` gives an empty one.
- **`DELIMS`:** every double quote comes off a value. An unclosed quote takes the rest of the event, and a quote in a value's middle toggles as well. `key=` gives no field even with `KEEP_EMPTY_VALS`; `key=""` gives an empty one only with it.
- **`MV_ADD = true`:** a `REPORT-` transform's `REGEX` is applied to every match, and a field the event has already takes the value as another one.

### Build 223's lookup checks (`config-lookups-v223`)

- **A CSV header's names are read as Splunk reads them:** trimmed unless quoted.
  - A `LOOKUP-` line whose field is a trimmed name is fine, and isn't counted to check.
  - The file's note says "Its header puts a space before action, which Splunk leaves out."
- **A quoted name with spaces is still a problem,** said plainly: "parity_quoted.csv’s header writes “ office” inside quotes, with a space before it, which Splunk keeps: it reads no column office."

### The made-up app's event, as the prototype shows its path

```
Index time
  hit     [parity_meta] evaluates INGEST_EVAL: the host becomes parity-host; the source becomes parity-source; the source type becomes parity:web
  hit     [parity_after] evaluates INGEST_EVAL: it writes seen = “parity:web” as an indexed field
  miss    [parity_bad] evaluates INGEST_EVAL, which Splunk can’t compile, as + takes two numbers or two strings: none of its assignments run
Search time, as parity:web
  hit     EXTRACT-kv extracts n, t and w
  hit     [parity_mv] extracts 2 fields
  off     KV_MODE = none: no automatic key-value extraction
  hit     Calculated fields (EVAL-): 8 of 10 give values: flag, joined, not_missing, null_text, shout, text_vs_num, total, who. 2 are rejected by Splunk’s type check
  hit     LOOKUP-a_desk: n “5” is in 1 row of parity_desks.csv: desk = “D7”
  hit     LOOKUP-b_floor: desk “D7” is in 1 row of parity_floors.csv: floor = “3”. desk is LOOKUP-a_desk’s output, as lookups run one after another, in order of their names
  missing LOOKUP-c_quoted: parity_quoted.csv has no column office
```

### Unchanged

Until an event is tried, nothing changes, with two exceptions, both in Build 223's lookup checks:
- the to-check count;
- the notes and marks on a lookup whose header has spaces round an unquoted name.

The regression below loads no lookup file, and finds every view the same.

### Not covered

- **Functions:**
  - time (`strftime`, `strptime`, `now`, `time`, `relative_time`), `printf`, `spath` and the JSON functions;
  - `searchmatch`, `random`, and the hashes other than `md5`;
  - `tostring()` with a format, and IPv6 in `cidrmatch()` and `CIDR` lookups.
- **Lookups:** KV store, external and time-based lookups; `| lookup` and `| inputlookup`.
- **`INGEST_EVAL`:** typed names (`'name[int]'`) and the `$...$` forms.
- **Field names Splunk keeps for itself:** Splunk's own `tag` and `eventtype` hide an extracted or indexed field of that name in search results. The page shows the field.
- **After lookups:** event types and tags, which item 12 would add.
- **A `REPORT-` step's count:** it counts the values it finds, as Build 224 wrote it, so with `MV_ADD` "[parity_mv] extracts 2 fields" is one field with two values.

## The edits

The lines are Build 225's.

**`<script id="config-lookups-v223">`:**

- **Line 16,115.** A comment: what Splunk does with spaces in a CSV header.
```
old: // Its first record: the column names as written. Quotes come off; spaces stay, since Splunk may keep them.
new: // Its first record: the column names as written. Quotes come off. Splunk leaves out the spaces round a name that isn't quoted, and keeps those inside quotes.
```
- **Line 16,116.** `header`: it notes which names are quoted.
```
old: function header(text){text=text.replace(/^﻿/,'');const out=[];let cur='',q=false;
new: function header(text){text=text.replace(/^﻿/,'');const out=[],qs=[];let cur='',q=false,qd=false;
```
- **Line 16,119.** `header`: a quote opening a name starts it afresh, and marks it quoted.
```
old:   if(c==='"'&&!cur.trim()){q=true;continue}
new:   if(c==='"'&&!cur.trim()){q=true;qd=true;cur='';continue}
```
- **Line 16,120.** `header`: each name's quoting, kept in step with the names.
```
old:   if(c===','){out.push(cur);cur='';continue}
new:   if(c===','){out.push(cur);qs.push(qd);cur='';qd=false;continue}
```
- **Lines 16,122 and 16,123.** `header`: spaces after a quoted name's closing quote don't count; a name reads as Splunk reads it, trimmed unless quoted.
```
old:   cur+=c}
old:  out.push(cur);return out.length===1&&!out[0].trim()?[]:out.map(raw=>({raw,name:raw.trim()}))}
new:   if(qd&&!q&&!c.trim())continue;cur+=c}
new:  out.push(cur);qs.push(qd);return out.length===1&&!out[0].trim()?[]:out.map((raw,i)=>({raw,name:qs[i]?raw:raw.trim(),quoted:qs[i]}))}
```
- **Line 16,153.** A comment: how a field is found among the columns.
```
old: // A field among a lookup's columns: as written; or only once the spaces round a column's name are left out; or in
new: // A field among a lookup's columns: as written or as Splunk reads them; or only once the spaces inside a quoted name are left out; or in
```
- **Line 16,155.** `find`: a column found once Splunk leaves out its spaces is found, not a problem.
```
old: function find(cols,field){if(cols.some(c=>c.raw===field))return {ok:true};
new: function find(cols,field){if(cols.some(c=>c.raw===field||c.name===field))return {ok:true};
```
- **Line 16,156.** `find`: the problem left is a quoted name, whose spaces Splunk keeps.
```
old:  const sp=cols.find(c=>c.name===field);if(sp)return {space:sp.raw};
new:  const sp=cols.find(c=>c.raw.trim()===field);if(sp)return {space:sp.raw};
```
- **Line 16,185.** `problems`: a quoted name with spaces is said to be one, with what Splunk does, in place of "Run | inputlookup … to see".
```
old: }, with ${lead?`a space before ${many?'each':'it'}`:`spaces round ${many?'them':'it'}`}. Run | inputlookup ${name} to see whether Splunk reads ${many?'them':'it'} as ${and(sp.map(y=>y.f.field))}.`)}
new: } inside quotes, with ${lead?`a space before ${many?'each':'it'}`:`spaces round ${many?'them':'it'}`}, which Splunk keeps: it reads no column ${and(sp.map(y=>y.f.field))}.`)}
```
- **Line 16,231.** `usesNote`: a header's spaces round an unquoted name, said to be left out.
```
old: ${and(sp.map(c=>c.name))}.`);
new: ${and(sp.map(c=>c.name))}, which Splunk leaves out.`);
```

**`<script id="config-tools-v224">`:**

- **Line 16,506.** A comment: what `kvByDelims` now does with quotes and empty values.
```
old: // Key-value pairs split by delimiters: a pair delimiter inside double quotes doesn't split, and the quotes come off.
new: // Key-value pairs split by delimiters: a pair delimiter inside double quotes doesn't split, and every quote comes off, an unclosed one too, as in Splunk. A value left empty gives no field, unless keep (KEEP_EMPTY_VALS = true) and it was quoted.
```
- **Line 16,507.** `kvByDelims`: every double quote comes off a value, as Splunk takes them off, so `out_spi="017e66f3` at the end of an event gives 017e66f3 and `a=x"y b=2` gives `xy b=2`. An empty value gives no field, unless `keep` and the value was quoted: `a=""` with `KEEP_EMPTY_VALS = true` gives an empty a; `a=` never gives a field.
```
old: function kvByDelims(text,pairs,kv){const out=[];let cur='',q=false;const flush=()=>{if(cur){const i=[...cur].findIndex(ch=>kv.includes(ch));if(i>0){const k=cleanKey(cur.slice(0,i).trim()),v=cur.slice(i+1).trim().replace(/^"([\s\S]*)"$/,'$1');if(k)out.push([k,v])}}cur=''};
new: function kvByDelims(text,pairs,kv,keep=false){const out=[];let cur='',q=false;const flush=()=>{if(cur){const i=[...cur].findIndex(ch=>kv.includes(ch));if(i>0){const k=cleanKey(cur.slice(0,i).trim()),w=cur.slice(i+1).trim(),v=w.replace(/"/g,'');if(k&&(v!==''||keep&&w!==''))out.push([k,v])}}cur=''};
```
- **Line 16,510.** `autoKv`: `key=` with nothing after it gives no field, while `key=""` gives an empty one, as Splunk's automatic extraction does.
```
old: const k=cleanKey(m[1]);if(k)out.push([k,m[3]??m[4]??m[5]??''])
new: const k=cleanKey(m[1]),v=m[3]??m[4]??m[5]??'';if(k&&(v!==''||m[3]!==undefined||m[4]!==undefined))out.push([k,v])
```
- **Line 16,557.** `tryEvent`, an `EXTRACT-` line: a named group that captures nothing gives no field, as in Splunk; a match whose groups are all empty says so.
```
old: const got=groups(m);got.forEach(([k,x])=>setField(k,x,r));steps.push({at:'search',r,state:got.length?'hit':'miss',say:got.length?`${r.key} extracts ${and(got.map(g=>g[0]))}`:`${r.key} matches, with no named group`,n:got.length})}
new: const all=groups(m),got=all.filter(([,x])=>x!=='');got.forEach(([k,x])=>setField(k,x,r));steps.push({at:'search',r,state:got.length?'hit':'miss',say:got.length?`${r.key} extracts ${and(got.map(g=>g[0]))}`:all.length?`${r.key} matches, with every group empty`:`${r.key} matches, with no named group`,n:got.length})}
```
- **Line 16,561.** `tryEvent`, a `REPORT-` transform with `DELIMS`: `KEEP_EMPTY_VALS` passes to `kvByDelims`, and with `FIELDS`, an empty value is kept only when it's set.
```
old: if(d.length>=2)got=kvByDelims(src,d[0],d[1]);else if(d.length===1){const names=(val(keys,'FIELDS')||'').split(',').map(s=>s.trim().replace(/^"|"$/g,'')).filter(Boolean),vals=[];let cur='',q=false;for(const ch of src){if(ch==='"'){q=!q;continue}if(!q&&d[0].includes(ch)){vals.push(cur);cur='';continue}cur+=ch}vals.push(cur);got=names.map((n,i)=>[n,vals[i]??'']).filter(x=>x[1]!=='')}}
new: if(d.length>=2)got=kvByDelims(src,d[0],d[1],truthy(val(keys,'KEEP_EMPTY_VALS')));else if(d.length===1){const names=(val(keys,'FIELDS')||'').split(',').map(s=>s.trim().replace(/^"|"$/g,'')).filter(Boolean),vals=[];let cur='',q=false;for(const ch of src){if(ch==='"'){q=!q;continue}if(!q&&d[0].includes(ch)){vals.push(cur);cur='';continue}cur+=ch}vals.push(cur);got=names.map((n,i)=>[n,vals[i]??'']).filter(x=>x[1]!==''||truthy(val(keys,'KEEP_EMPTY_VALS')))}}
```
- **Line 16,564.** `tryEvent`, a `REPORT-` transform's `REGEX`: with `MV_ADD = true`, it's applied to every match, not only the first, whatever its `FORMAT`, so each value is found.
```
old: if(fmt&&/\$\d+::/.test(fmt)){const re=new RegExp(rx.re.source,rx.re.flags.includes('g')?rx.re.flags:rx.re.flags+'g');for(const m of src.matchAll(re)){for(const p of fill(fmt,m).matchAll(/([^\s:]+)::("[^"]*"|\S*)/g))got.push([cleanKey(p[1]),p[2].replace(/^"|"$/g,'')]);if(!m[0])break}}
new: if(fmt&&/\$\d+::/.test(fmt)||truthy(val(keys,'MV_ADD'))){const re=new RegExp(rx.re.source,rx.re.flags.includes('g')?rx.re.flags:rx.re.flags+'g');for(const m of src.matchAll(re)){if(fmt){for(const p of fill(fmt,m).matchAll(/([^\s:]+)::("[^"]*"|\S*)/g))got.push([cleanKey(p[1]),p[2].replace(/^"|"$/g,'')])}else got.push(...groups(m));if(!m[0])break}}
```
- **Line 16,566.** `tryEvent`, any `REPORT-` transform: an empty value gives no field unless `KEEP_EMPTY_VALS = true`, as transforms.conf says, which is what the Fortinet samples' `user=""` needs; and with `MV_ADD = true`, a field the event has already takes the value as another one, so `mv=a mv=b` gives a and b, as in Splunk.
```
old: got=got.filter(([k])=>k);got.forEach(([k,x])=>setField(k,x,r));
new: got=got.filter(([k,x])=>k&&(x!==''||truthy(val(keys,'KEEP_EMPTY_VALS'))));const mv=truthy(val(keys,'MV_ADD'));got.forEach(([k,x])=>{const f=fields.get(k);if(mv&&f)f.value=[...(Array.isArray(f.value)?f.value:[f.value]),x];else setField(k,x,r)});
```

## The replaced block

**`<script id="config-eval-v225">` (line 16,640) becomes `<script id="config-eval-v226">`,** containing [`docs/mockups/splunk-parity-prototype.js`](mockups/splunk-parity-prototype.js). It defines the same object as before, as `window.configEval225` and `window.configEval226`:

| For | Functions |
|---|---|
| Expressions | `lex`, `parse` and `assignments` read them; `typeOf(tree)` is Splunk's type check; `run(text, get)` evaluates one, giving `{v}`, `{rejected}` with why the type check rejects it, or `{nc}` with why it isn't computed; `evaluate(text, fields, ctx)` does so with fields as an object |
| Try an event | `calculated`, `lookups`, `ingest`, `row` and `show`, as in Build 225 |
| Numbers | `plain(n)`, `roundAt(text, places)`, `decSig(n, figures)`, `decFixed(n, places)` and `decText(text)` |
| Its parts | `csv(text)`, `md5(text)`, `cidr(range, ip)`, `likeRe(pattern)` |

**It has to come where Build 225's was,** after `config-tools-v224`.

## Build records

After the edits and the block, in a new `<script id="splunk-parity-records-v226">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Try an event matched to Splunk','Try an event follows Splunk 10.6.1.1, checked in Docker: its type check, + and comparisons, true and false as 1 and 0, missing values, several values and numbers’ precision; lookups that run on each other’s output; INGEST_EVAL setting host, source and source type; empty values and quotes in extractions. Lookup checks read a CSV header as Splunk does.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 225 did in its records, with Build 226 and 15 Nov 2026.

## Check before uploading

Run with Build 225 + the edits and the block, and with Build 225 for comparison.

### 1. Against Splunk

| What | Splunk 10.6.1.1 against the prototype |
|---|---|
| The 304 probes in [`docs/splunk-checks.md`](splunk-checks.md) | 304 of 304 the same |
| The Fortinet add-on's 54 sample events, tried as `fortigate_log` | 2,682 of 2,682 field values the same, and the source type, on all 54 events |
| Build 225's made-up app's event | 24 of 26 fields the same, and its index, host and source type; the long event dropped on both. `EVAL-day` uses `strftime()`, which isn’t computed here, and Splunk’s own tag field hides the indexed field named tag |
| Build 226's made-up app, four events | Each value for value, in the checks below |

### 2. The checks: 29. All pass with the edits; 24 fail on Build 225

| Checks | What they find | Fail on Build 225 |
|---|---|---|
| Splunk (7) | Each of the 304 probes gives Splunk's value. Spotlights: missing values under `NOT`, `OR` and `tostring()`; `+` joining, and the type check; text against a number; true and false as 1 and 0; precision; several values. No page errors | 6 |
| The Fortinet package (6) | Each of the 54 sample events gives Splunk's source type and fields; `user=""` gives no user; `out_spi="017e66f3` gives 017e66f3; the action lookup's check is fine, and its file's note says Splunk leaves the space out. No page errors | 5 |
| The parity app (14) | Its `INGEST_EVAL` steps, word for word, and what Splunk indexed; the calculated fields' row; its fields, value for value against Splunk's; empty groups; a rejected field left as it was; a chained lookup; a quoted column name; the map's lights; Build 223's checks of its two headers and why; its `DELIMS`, `KEEP_EMPTY_VALS` and automatic events against Splunk's. No page errors | 13 |
| 390 px (2) | The path fits. No page errors | 0 |

The 5 that pass on Build 225 too are its four no-page-errors checks and the 390 px fit.

**The block's own functions, in Node:** 78 checks, all pass. They are Build 225's 61, with the six whose expected results Splunk changed, and 17 new ones: plain digits, rounding, significant figures, precision, the type check, `INGEST_EVAL`'s host, source and source type, its type error and numbers, and the extraction tools.

### 3. Regression against Build 225

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

Each comparison takes Build 225 twice, to set aside whatever varies from run to run; nothing did.

| Earlier suite or tool, on Build 225 + the edits | Result |
|---|---|
| Build 225's 24 checks. Ten expected what Splunk showed wrong; they are run with those expectations changed, and nothing else: the host set, `host_bytes` "web01.corp2048", `kb` "2.0", `LOOKUP-h_nested` giving floor = 3, 25 fields on the event, and no note on CSV spaces | 24 of 24 (14 of 24 as written) |
| Build 224's 51 checks, as Build 225 runs them | 51 of 51 (48 of 51 as written, the three Build 225 changed) |
| Lookup checks: 54 checks (Build 223's handoff). Eight expected the spaces of an unquoted header name to be a problem; they are run with those expectations changed, and nothing else | 54 of 54 (46 of 54 as written) |
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) | 64 of 64 |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote | 70 of 70 |
| The source type map's 82 checks | 82 of 82 |
| The splits' 40 checks, with the map's tools taken out as Build 224's handoff says | 40 of 40 |
| Ingest Processor pipelines' 31 checks | 31 of 31 |
| The space tool | The same output as Build 225 |
| The connector tool | The same output as Build 225 |

### 4. Time

The Config view only: a Builder redraw runs none of this. Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 225 | With the edits |
|---|---|---|
| The example: a draw | 5.8 ms (4.9 to 8.4) | 6.1 ms (4.9 to 8.4) |
| The example: an analysis | 0.8 ms (0.7 to 1.2) | 0.8 ms (0.6 to 1.2) |
| The add-on’s props.conf and transforms.conf: a draw | 11.4 ms (9.4 to 17.9) | 10.9 ms (9.5 to 13.8) |
| The same: an analysis | 0.5 ms (0.4 to 1.0) | 0.4 ms (0.4 to 0.8) |
| The same, fortigate_event chosen: a draw | 9.2 ms (7.6 to 13.7) | 9.9 ms (7.6 to 12.8) |
| The add-on’s four configuration files: a draw | 13.3 ms (11.7 to 21.5) | 13.9 ms (12.0 to 23.0) |
| The same: an analysis | 6.5 ms (5.8 to 10.6) | 6.7 ms (6.0 to 11.4) |
| The same, fortigate_event chosen: a draw | 13.0 ms (11.5 to 21.4) | 13.5 ms (11.8 to 21.3) |
| The same and its four lookup files: a draw | 13.6 ms (11.9 to 21.5) | 14.1 ms (11.6 to 22.9) |
| The same: an analysis | 5.9 ms (5.4 to 10.8) | 6.3 ms (5.3 to 11.0) |
| The same, fortigate_traffic chosen: a draw | 8.0 ms (6.3 to 11.3) | 7.3 ms (6.3 to 11.4) |
| The four files, their lookup files and the add-on’s metadata, a search in search chosen: a draw | 14.0 ms (11.4 to 19.8) | 13.5 ms (11.6 to 22.6) |
| The same: an analysis | 7.3 ms (6.4 to 13.2) | 7.9 ms (6.6 to 13.1) |
| Trying one of the add-on’s 54 sample events, as fortigate_log, with its lookup files | 0.64 ms (0.43 to 1.03) | 0.58 ms (0.49 to 1.14) |
| fortigate_traffic’s map as SVG, for Save image | 30.6 ms (21.7 to 43.8) | 27.6 ms (21.2 to 38.9) |
| 30 monitors with a filter each, and 60 `[source::]` stanzas: a draw | 5.7 ms (3.8 to 7.0) | 4.2 ms (3.8 to 7.1) |
| The same: an analysis | 81.0 ms (69.3 to 105.7) | 78.7 ms (69.9 to 106.7) |

- **With nothing tried,** the edits add no work that shows: each median is within the other page's spread.
- **Trying an event** with the add-on's lookup files takes 0.58 ms with the edits, against 0.64 ms on Build 225: each is within the other's spread.

The perf tool wasn't run: it times the Builder.

### 5. The build

`index.html` as committed, Build 226, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks.
- The new checks pass on Build 226 as on the tested page: 29 of 29.

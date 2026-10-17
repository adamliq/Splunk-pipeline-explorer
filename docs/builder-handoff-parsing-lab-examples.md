# Builder handoff: more Parsing laboratory examples and two event boundaries

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 199.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="parsing-lab-examples-v200-styles">`, containing [`docs/mockups/parsing-lab-examples-prototype.css`](mockups/parsing-lab-examples-prototype.css);
- `<script id="parsing-lab-examples-v200">`, containing [`docs/mockups/parsing-lab-examples-prototype.js`](mockups/parsing-lab-examples-prototype.js).

The script adds to `parsingLabPresets` and wraps these functions, so there are no in-place edits: `renderParsingLab`, `parsingLabModel`, `parsingLabConfiguration`, `parsingLabJson`, `evidencePackFiles`, `architectureReportJson` and `architectureReportMarkdown`. Paste both files as they are, then add the build records (see "Build records").

**This version replaces the first one.** The first version had ten examples. This one adds:
- two event boundaries, **CSV header line** and **Fixed length**;
- **KV_MODE = multi**;
- four examples that show them, two of them on a 1 MB single-line file;
- a preview of the first 25 events for a large input.

Build 200 hasn't been built, so paste the current files.

**Mockup (the target):** [`docs/mockups/parsing-lab-examples-mockup.html`](mockups/parsing-lab-examples-mockup.html).
- **Scenes:** every scene is a screenshot of the real laboratory, 14 with the block pair applied and one "Today" scene from Build 199. The screenshots are `docs/mockups/compare/parsing-lab-*.png`.
- **Generated props:** the last panel shows what Download config writes for the two new boundaries.

**Tested first:** the block pair was appended to Build 199 and run. The results under "Check before uploading" come from that run.

## Why

**What Build 199's laboratory offers** (Operate › Parsing laboratory):
- **Four samples:** Multiline syslog, Windows XML, NDJSON API and CSV file. Between them they show line merging, XML events, indexed JSON and indexed CSV. Nothing shows:
  - a stack trace;
  - a syslog header before the timestamp;
  - epoch timestamps;
  - the common ways parsing goes wrong.
- **Nothing says what a sample shows.** The bar is four buttons.
- **A sample sets only some settings:** the raw input, event boundary, merging, timestamp mode, both extractions and the sourcetype. An index, a route, a timezone or a TRUNCATE you changed stays when you choose the next sample.
- **The generated configuration is the same for every format:** one TIME_FORMAT per timestamp mode, and no TIME_PREFIX or TIMESTAMP_FIELDS. Some samples download settings that won't read their timestamps: one with milliseconds, one with a header before its timestamp, or one with its time in a JSON field.
- **Two common layouts can't be broken into events:**
  - **A header line at the start of every event,** as a scripted input writes before each run's rows.
  - **Fixed-length records in a file with no line breaks.** With Every line, such a file is one event, cut to TRUNCATE.
- **KV_MODE stops at none, auto, json and xml.** There is no way to read an event as a table.
- **A large input draws every event:** a file of 8,250 records would draw 8,250 cards. The evidence pack would carry every parsed event twice.
- **"Open in walkthrough" picks the walkthrough's sample by the example's id.** Custom JSON input opens in the walkthrough as syslog.

## The design

### 1. The examples, in two groups

- **Samples** are formats as they should be parsed.
- **Common mistakes** are a sample with one setting wrong, so you can see what that setting does to the events.

The ten new examples are in bold.

| Example | Group | What it shows | Settings | Result |
|---|---|---|---|---|
| Multiline syslog | Samples | A continuation line merges into the event above it | Timestamp prefix, merge on, KV_MODE = auto | 2 events |
| Windows XML | Samples | Each `<Event>` is one event; the Data fields come at search time | XML Event element, KV_MODE = xml | 2 events |
| NDJSON API | Samples | Indexed JSON fields let the route on result=failure work | Every line, INDEXED_EXTRACTIONS = json | 2 events, 1 routed |
| CSV file | Samples | The header names indexed columns | Every line, INDEXED_EXTRACTIONS = csv | 2 events, 1 routed |
| **Java stack trace** | Samples | Stack frames stay with their event: six lines, two events | Timestamp prefix, merge on, KV_MODE = auto; index app | 2 events |
| **RFC 5424 syslog** | Samples | The timestamp comes after a `<PRI>VERSION` header | Every line, KV_MODE = auto; index os | 3 events |
| **Kubernetes JSON** | Samples | Epoch seconds become _time; errors route to their own index | Every line, epoch, INDEXED_EXTRACTIONS = json; index k8s; route level=error → k8s_errors | 3 events, 2 routed |
| **CSV header per event** | Samples | Each event is a header line and one run's rows | CSV header line, KV_MODE = multi; sourcetype vpn:health:csv; index os | 2 events, 4 rows |
| **Fixed-length records** | Samples | A 1 MB line with no line breaks becomes 8,250 events of 128 characters | Fixed length 128, KV_MODE = auto; sourcetype badge:controller; index physical | 8,250 events |
| **JSON extracted twice** | Common mistakes | Index-time and search-time JSON together: every value twice | NDJSON API with KV_MODE = json | 2 events, 2 warnings, 1 routed |
| **Event over TRUNCATE** | Common mistakes | A cut event isn't valid JSON: no fields, and the route misses it | Every line, INDEXED_EXTRACTIONS = json, TRUNCATE = 256; index email; route action=quarantine → email_quarantine | 2 events, 3 warnings, 1 truncated, 0 routed |
| **Stack trace split per line** | Common mistakes | Breaking at every line splits the stack trace | Java stack trace with Every line, merge off | 6 events, 8 warnings |
| **CSV header indexed as data** | Common mistakes | Read one row per line, the repeated header becomes an event whose fields hold their own names | CSV header per event with Every line and INDEXED_EXTRACTIONS = csv | 5 events, 2 warnings |
| **1 MB line, no breaker** | Common mistakes | The whole file is one event, cut to 10,000 characters | Fixed-length records with Every line | 1 event, 1 warning, 1 truncated |

The new samples follow the laboratory's existing story (alex's failed logins from 10.10.4.21 at 01:20 on 20 September 2026), seen in other data:
- **Badge export:** alex's badge fails its PIN five times in the badge-controller export.
- **VPN health:** the scripted input samples the VPN gateways every minute.

Settings an example doesn't list are the defaults in section 3.

**The two new data samples:**
- **CSV header per event** is two runs of a scripted input. Each run writes `collected,host,cpu_pct,mem_pct,disk_pct` and then a row for each of vpn01 and vpn02.
- **Fixed-length records** is a badge-controller export: one line of 1,056,000 characters, just over 1 MB (1,048,576 bytes), with no line feeds or carriage returns.
  - **Records:** 8,250 of exactly 128 characters, for example `2026-09-20T01:20:00Z ctl=DC1-E004 badge=00041873 user=alex     result=denied  reason=pin_fail  seq=0000001 site=SYD-DC1 crc=4461`.
  - **Padding:** fields are padded with spaces to fixed widths.
  - **Order:** the timestamps run one second apart, from 01:20:00Z to 03:37:29Z.
  - **How it's made:** the block builds the line the first time an example needs it, so it costs nothing at page load. Fixed-length records and 1 MB line, no breaker share it.

### 2. The note

One line under the bar says what the chosen example shows. When the example's format needs props lines (section 7), the note ends "Its configuration uses `TIME_PREFIX = …`".
- **Changing a setting** makes the settings custom, as in Build 199. The note then reads "Custom settings. Choose an example to reset every setting to it." and no button is pressed.
- **Editing the raw input** keeps the example and its note, as Build 199 keeps the pressed button.

The bar has two rows, "Samples" and "Common mistakes", each labelled. On a phone each label sits above its buttons. The buttons keep Build 199's style and get `aria-pressed`.

### 3. Choosing an example

Every setting comes from the example. Settings it doesn't list return to these defaults (Build 199's starting values):

| Setting | Default |
|---|---|
| Event boundary, merge, timestamp mode | Every line, off, ISO-8601 |
| Record length | 128 (used by Fixed length only) |
| Index-time and search-time extraction | None, KV_MODE = none |
| TRUNCATE, timezone | 10000, UTC |
| Sourcetype, default index | custom, security |
| Route | result = failure → security_alerts |

The four Build 199 samples list the same settings as before, so they look the same; only a value carried over from another example is reset. **The index-time processing tier is kept**: it describes your topology, not the example.

### 4. Two new event boundaries

The Event boundary list gains two options after XML Event element: **CSV header line** and **Fixed length**.

**CSV header line** starts an event at each line that repeats the input's first line.
- **The header:** the first line that isn't blank, trimmed, up to 256 characters.
- **Breaking:** the lab applies `LINE_BREAKER = ([\r\n]+)(?=<header>)` to the input, as Splunk does. Then it trims each line of an event and drops blank lines, as the other boundaries do.
- **Timestamp:** it is read from the first row. The header holds no time.

**Fixed length** ends an event after every N characters, where N is the **Record length**.
- **Breaking:** the lab applies `LINE_BREAKER = .{N}()` to the input, as Splunk does. The group is empty, so no character is discarded, and each event keeps every character, padding included. The other boundaries trim; this one doesn't.
- **A line break restarts the count,** because `.` doesn't match one. An event that holds a line break is longer than N, and so is the text before the first break. A file that ends partway through a record ends with a short event.
- **The warning:** an event of any length but N gets "Record is X characters, not N".
- **Blank records:** a record that is all spaces is dropped, as blank lines are elsewhere.

**Record length (characters)** appears beside Event boundary only while Fixed length is chosen.
- **A new value** breaks the input again and makes the settings custom.
- **The floor is 16:** a smaller value is raised to 16. The floor keeps the lab's event count down: at 1 character the 1 MB sample would be 1,056,000 events. Splunk has no such floor.

**Both new boundaries:**
- **Merging is off.** The "Merge continuation lines" toggle is unchecked and disabled. "Not used with this boundary: LINE_BREAKER alone ends each event." shows under it, and is the checkbox's `aria-describedby`. The merge setting itself is kept for when you choose another boundary.
- **The configuration chain names them:**
  - Fixed length: `mode=fixed length; 128 characters per event; TRUNCATE=10000`;
  - CSV header line: `mode=CSV header line; an event starts at each header line; TRUNCATE=10000`.
- **With INDEXED_EXTRACTIONS = csv,** the lab reads one header and one row per line, as it does for the other boundaries. The boundary is not applied, and the chain and the configuration say so: `mode=fixed length, not applied: the lab reads INDEXED_EXTRACTIONS=csv one row per line`. Splunk's documentation doesn't say whether LINE_BREAKER applies to structured input, so the lab doesn't combine the two.

### 5. KV_MODE = multi

The Search-time extraction list gains **KV_MODE = multi**. It reads each event as a table: the first line names the columns, and each later line is a row.
- **Columns:** the lab splits on commas when the first line has them, otherwise on spaces.
- **Rows:** each event card's search-time panel shows "Search time · calculated · 2 rows" and a labelled "Row 1", "Row 2" group of fields for each row.
- **Counts:**
  - the Search-time fields metric counts the columns;
  - the chain reads `KV_MODE=multi; fields=5; rows=4`;
  - each event's `searchFields` is its first row, and `searchRows` holds them all.
- **No table:** an event with fewer than two lines gets "No search-time fields extracted".

### 6. A large input

- **The first 25 events are listed.** A note above them reads "Showing the first 25 of 8,250 events. The counts above include every event, and so does Download results." Below 26 events nothing changes. This applies to every boundary, not only the new ones.
- **The metrics count every event,** with thousands separators (8,250). Truncated counts every event too, not just the 25 listed.
- **The model is worked out once per render.** Build 199 works it out twice, for the page and for the tier panel.
- **Download results keeps every event:** 8.5 MB for Fixed-length records.
- **The evidence pack and the architecture report list the first 25 events.** Both `assurance/effective-parsing-laboratory.json` and `reports/architecture-report.json` do, with the full counts and `"eventsListed": 25` in `summary`. Without this, the pack grows from 0.45 MB to 18 MB, because it holds the 8,250 events twice. With it, the pack is 2.5 MB, most of it the 1 MB input, which is kept so the result can be reproduced.
- **The lab's state is not saved,** as in Build 199, so the 1 MB input never reaches the saved topology or localStorage.

### 7. The configuration

The new boundaries and KV_MODE = multi write their own lines from the settings, so the lines stay when the settings become custom:

| Setting | Lines |
|---|---|
| Fixed length, N | `SHOULD_LINEMERGE = false`; `LINE_BREAKER = .{N}()`; when N > 100, `LINE_BREAKER_LOOKBEHIND = N`; commented `EVENT_BREAKER_ENABLE = true` and `EVENT_BREAKER = .{N}()` for a universal forwarder that reads the file |
| CSV header line | `SHOULD_LINEMERGE = false`; `LINE_BREAKER = ([\r\n]+)(?=<header, regex-escaped>)`; unless the timestamp mode is No extraction, `TIME_PREFIX = ^[^\r\n]*[\r\n]+` |
| KV_MODE = multi | `KV_MODE = multi`, under a comment to check the columns on a test instance |

Each line comes with a comment saying what it does. The mockup's last panel shows both stanzas.

While an example's settings are unchanged, its own props lines go into Download config and into the evidence pack's `implementation/parsing-laboratory.conf`. A line that is already there (TIME_FORMAT) is replaced; a new one is added before TIME_FORMAT.

| Example | Its own props lines |
|---|---|
| Windows XML | `TIME_PREFIX = SystemTime="` |
| NDJSON API, CSV file, JSON extracted twice, Event over TRUNCATE | `TIMESTAMP_FIELDS = time` |
| Java stack trace, Stack trace split per line | `TIME_FORMAT = %Y-%m-%dT%H:%M:%S.%3N%Z` |
| RFC 5424 syslog | `TIME_PREFIX = ^<\d+>\d+\s+` |
| Kubernetes JSON | `TIMESTAMP_FIELDS = ts` (TIME_FORMAT = %s, from the epoch mode) |
| Fixed-length records | `MAX_TIMESTAMP_LOOKAHEAD = 20`: the timestamp is each record's first 20 characters |
| CSV header indexed as data | `TIMESTAMP_FIELDS = collected` |
| Multiline syslog, CSV header per event, 1 MB line, no breaker | None: the generic lines, and the boundary's, fit |

Once a setting changes, the example's own lines go, since they may no longer fit.

### 8. Open in walkthrough

The walkthrough has its own JSON, CSV, Windows and syslog samples, and models each differently. "Open in walkthrough" now picks one from the settings:
- an XML boundary or KV_MODE = xml gives Windows;
- JSON at either time gives JSON;
- INDEXED_EXTRACTIONS = csv gives CSV;
- anything else gives syslog, the new boundaries and KV_MODE = multi included.

The four Build 199 samples open as before. The JSON examples, and custom JSON input, open as JSON. A fixed-length event opens as its 128-character record.

### 9. Two layout fixes in the laboratory

- **A long event scrolls inside its card.** The raw text shows 20 lines and scrolls, and the facts beside it keep their size. In Build 199, at 1440 px, a 10,000-character event makes its card 1,365 px tall and stretches each fact box beside it from 45 to 260 px. With the block the card is 471 px.
- **The merge checkbox sits beside its label.** In Build 199, `.parseField label` and `.parseField input` override `.parseToggle`, so the label is a block and the checkbox spans the field's width, centred above its text. The block gives `.parseToggle` its flex layout, colour and size back, and `width:auto` to the checkbox.

### 10. Unchanged

- **The layout:** the placement, the other settings, the configuration chain's layout, and the event cards apart from the KV_MODE = multi rows.
- **The JSON export's format,** apart from the optional `summary.eventsListed`.
- **The model's results:** with neither a new boundary nor KV_MODE = multi, the events, fields and warnings are Build 199's, with one exception. A row that repeats the CSV header gets one more warning, "CSV header row indexed as data: each field holds its own name", whatever the boundary.
- **Performance guardrails:** "Use parsing sample" reads the chosen example's events, as before.

## Splunk notes, with sources

- **Fixed-length records:** `LINE_BREAKER = .{N}()` with `SHOULD_LINEMERGE = false` breaks after every N characters. The empty group discards nothing. ([Splitting events every n characters](https://community.splunk.com/t5/Getting-Data-In/Splitting-events-every-n-characters/m-p/22195))
- **LINE_BREAKER_LOOKBEHIND** (default 100) is how far before the end of a raw chunk the LINE_BREAKER regex is applied again when data is left over from the previous chunk. A record longer than that could be counted from the wrong place where a read chunk splits it, so the lab writes `LINE_BREAKER_LOOKBEHIND = N` for N over 100. Check on a test instance with a file larger than one chunk. ([How does LINE_BREAKER_LOOKBEHIND in props.conf work](https://community.splunk.com/t5/Getting-Data-In/How-does-LINE-BREAKER-LOOKBEHIND-in-props-conf-work/td-p/263071))
- **EVENT_BREAKER** on a universal forwarder lets it switch indexers only between events. With no line breaks, the default `([\r\n]+)` never matches, so the lab writes the matching `EVENT_BREAKER` as a comment for when a UF reads the file.
- **A line over TRUNCATE:** splunkd.log reports `LineBreakingProcessor - Truncating line because limit of 10000 bytes has been exceeded`. ([LineBreakingProcessor truncating line](https://community.splunk.com/t5/Security/LineBreakingProcessor-Truncating-line-because-limit-of-10000-has/td-p/80681))
- **KV_MODE = multi** runs multikv on table-formatted events. ([Configure automatic key-value field extraction](https://docs.splunk.com/Documentation/Splunk/9.3.2/Knowledge/Automatickey-valuefieldextractionsatsearch-time); [Extracting tabular information using KV_MODE](https://community.splunk.com/t5/Splunk-Search/Extracting-tabular-information-using-KV-MODE/m-p/101282))
  - One user reports it [not capturing fields](https://community.splunk.com/t5/Getting-Data-In/KV-MODE-multi-not-capturing-fields/m-p/186039). Nothing found confirms that it splits columns on commas, so the generated comment asks for a check on a test instance.
- **Not verified, so not used:**
  - whether LINE_BREAKER applies with INDEXED_EXTRACTIONS = csv; the only report found is a forum thread, [line breaking for a CSV file](https://community.splunk.com/t5/Getting-Data-In/How-to-configure-line-breaking-for-a-CSV-file-where-line-breaks/m-p/286611);
  - a `KV_MODE = multi:<stanza>` form.

## How the block works

For maintenance; the code is in the two prototype files.

- **Examples:**
  - The four Build 199 samples get `group`, `note` and, where needed, `props`.
  - The ten new ones are added to `parsingLabPresets` with the same keys, so the architecture report names them like the others.
  - Fixed-length records and 1 MB line, no breaker have a `raw` getter that calls `badgeLine()`. It builds the 1 MB line once and keeps it.
- **Choosing:** `choose(id)` starts from `SAMPLE_DEFAULTS`, copies the example's own settings (`raw` and the defaults' keys), sets `preset` and renders. It copies only setting keys, so `name`, `note` and `props` stay out of `state.parsingLab` and the JSON export. Build 199's handler copied every key, `name` included.
- **The model:** `parsingLabModel` is wrapped. For the new boundaries:
  1. `boundaryEvents()` breaks the input with the boundary's LINE_BREAKER (`breakEvents()`).
  2. Build 199's model is given one event per line: each line break inside an event travels as U+2028. Its boundary is set to Every line, and its KV_MODE to none for multi.
  3. The exact events are put back afterwards, with TRUNCATE applied, `originalLength`, `truncated` and the TRUNCATE warning.
  4. Blank events are dropped first, so the model's events and the block's line up one to one.

  KV_MODE = multi is `multikv()`. The repeated-header warning, the chain's details and the warning count follow.
- **One model per render:** `renderParsingLab` is wrapped, on top of Build 199's processing-tier wrapper.
  - **During a render,** `parsingLabModel()` gives the page and the tier panel the full model's first 25 events. The full model is worked out once.
  - **Then `decorate()`:**
    - rebuilds `.parsePresetBar` into the two groups, with `choose()` on each button, and adds the note after the bar;
    - adds the new options, the Record length field and the merge hint (`settings()`);
    - writes the metrics from the full model, and adds the preview note;
    - draws the rows for KV_MODE = multi, and binds "Open in walkthrough" with the settings-based choice (section 8).
- **The evidence pack and the reports:** `evidencePackFiles`, `architectureReportJson` and `architectureReportMarkdown` read the model the same way, through `listed()`. `parsingLabJson` adds `summary.eventsListed` when it lists only some events. Download results calls `parsingLabJson` outside a render, so it gets every event.
- **Configuration:** `parsingLabConfiguration` is wrapped.
  - It writes the boundary and KV_MODE = multi lines from `state.parsingLab`, then the example's props from `parsingLabPresets[state.parsingLab.preset]?.props`, so a custom preset gets none.
  - Each line is replaced or inserted with a function replacement, so `$` in a value is safe.
- **CSS:**
  - **The bar:** a grid of two flex rows, each with a fixed-width label (above the buttons under 640 px).
  - **The notes:** the example note and the preview note use the laboratory's muted text, with `code` chips in its monospace style.
  - **The rows:** a small uppercase label beside each row's field chips.
  - **The two fixes** of section 9.

  The operations views are dark-only, like the rest of the laboratory.
- **If you'd rather edit the model in place:** each new boundary is one more branch in `parsingLabModel`'s boundary step, and multikv one more mode in its `parseFields`. The block wraps the model only because it is appended.
- **Globals it uses:**
  - **Lab:** `parsingLabPresets`, `renderParsingLab`, `parsingLabModel`, `parsingLabConfiguration`, `parsingLabJson`;
  - **Exports:** `evidencePackFiles`, `architectureReportJson`, `architectureReportMarkdown`;
  - **Shared:** `renderOperations`, `evidenceXml`, `state`.

## Build records

As Build 199 did, after the block pair:
- `changeRegister`, group "Governance and evidence" (where "Effective parsing laboratory" is):
  `['Parsing laboratory examples','Ten more Parsing laboratory examples, in two groups: Java stack trace, RFC 5424 syslog, Kubernetes JSON, CSV header per event and Fixed-length records (a 1 MB line), and five common mistakes. Two event boundaries, CSV header line and Fixed length, and KV_MODE = multi. Each example says what it shows, sets every setting it needs and adds its props lines to the generated configuration. A large input lists its first 25 events and counts all of them.',true]`.
- `#topologyBuilder` `data-build-number` 200 and `data-build-date`, the page title, and the ⓘ text prefix, with the date you build it.

If Build 200 also takes the Selection fix from [`builder-handoff-build199.md`](builder-handoff-build199.md), one set of build records covers both.

## Found while building the examples (not changed)

The laboratory's model and its generated configuration disagree in two places. The new examples avoid both, so their results and configuration agree.

- **Timestamp prefix with merging off.** The model then makes every line an event. The configuration it generates says `SHOULD_LINEMERGE = false` and `LINE_BREAKER = ([\r\n]+)(?=20\d{2}-\d{2}-\d{2})`, which in Splunk breaks only before a timestamp, so continuation lines would stay with their event.
  - Try it: Multiline syslog, merging off. The laboratory shows 3 events; Splunk, with that configuration, makes 2.
  - A fix: with the Timestamp prefix boundary, always break before a timestamp line, and let merging matter only for the Every line boundary. That is what `SHOULD_LINEMERGE` does there, with `BREAK_ONLY_BEFORE_DATE`.
- **A syslog header before the timestamp.** The model's timestamp-prefix boundary accepts `<PRI>VERSION` before the timestamp (`^(?:<\d+>\d?\s+)?20\d\d-…`), but the generated LINE_BREAKER doesn't. A fix: `LINE_BREAKER = ([\r\n]+)(?=(?:<\d+>\d?\s+)?20\d{2}-\d{2}-\d{2})`.

Also seen, and already in Build 199:
- **The chain's KV_MODE label:** with KV_MODE = auto, the configuration chain reads `KV_MODE=kv`, while the settings and the configuration say auto.
- **No timestamp extraction:** with Timestamp mode "No extraction", the configuration writes `TIME_FORMAT = CURRENT`. Splunk's setting for that is `DATETIME_CONFIG = CURRENT`.
- **The 1024 px overflow:** at 1024 px the page scrolls 9 px sideways, in Flow and in Operate, with or without the block. The cause is outside the laboratory.

## Check before uploading

All in Operate › Parsing laboratory, with the default topology, unless stated.

### 1. Regression

- 0 `pageerror` events in every check below, from 320 to 1920 px.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 199 on three topologies: 87 of 87.
  - the default;
  - reference: `docs/mockups/ov1-reference-topology.json`;
  - zones: `docs/mockups/sv-zones-topology.json`.

### 2. The examples

Choose each example and check the metrics, the events and Download config:

| Example | Events | Warnings | Routed | Also |
|---|---|---|---|---|
| Multiline syslog | 2 | 0 | 0 | 7 search-time fields |
| Windows XML | 2 | 0 | 0 | `TIME_PREFIX = SystemTime="` |
| NDJSON API | 2 | 0 | 1 | `TIMESTAMP_FIELDS = time` |
| CSV file | 2 | 0 | 1 | `TIMESTAMP_FIELDS = time` |
| Java stack trace | 2 | 0 | 0 | Event 1 holds the exception and three frames; _time 2026-09-20T01:20:00.412Z; TIME_FORMAT with `%3N` |
| RFC 5424 syslog | 3 | 0 | 0 | _time 01:20:00Z, 01:20:04Z, 01:21:15Z; `TIME_PREFIX = ^<\d+>\d+\s+` |
| Kubernetes JSON | 3 | 0 | 2 | _time from ts (2026-09-20T01:20:00.000Z…); 8 indexed fields; `TIMESTAMP_FIELDS = ts`, `TIME_FORMAT = %s` |
| CSV header per event | 2 | 0 | 0 | Each event 3 lines, 2 rows; 5 search-time fields; row 2 of event 2 is vpn02 at 93.6; `SHOULD_LINEMERGE = false`, `LINE_BREAKER = ([\r\n]+)(?=collected,host,cpu_pct,mem_pct,disk_pct)`, `TIME_PREFIX = ^[^\r\n]*[\r\n]+`, `KV_MODE = multi` |
| Fixed-length records | 8,250 | 0 | 0 | See the next table |
| JSON extracted twice | 2 | 2 | 1 | 6 fields at each time; KV_MODE = json |
| Event over TRUNCATE | 2 | 3 | 0 | Event 2: 256 / 567 characters; target index email; 1 truncated. Its warnings: "TRUNCATE removed 311 characters", "No index-time fields extracted", "Invalid JSON for indexed extraction" |
| Stack trace split per line | 6 | 8 | 0 | Events 2 to 5 have no timestamp and no fields; `LINE_BREAKER = ([\r\n]+)` |
| CSV header indexed as data | 5 | 2 | 0 | Event 3 has collected=collected, host=host…; no _time; "No index-time timestamp extracted" and "CSV header row indexed as data: each field holds its own name"; `TIMESTAMP_FIELDS = collected` |
| 1 MB line, no breaker | 1 | 1 | 0 | 10000 / 1056000 characters; "TRUNCATE removed 1046000 characters"; Truncated 1; `LINE_BREAKER = ([\r\n]+)`, `TRUNCATE = 10000` |

**Fixed-length records:**

| Check | Expected |
|---|---|
| The raw input | 1,056,000 characters, no `\r` or `\n`, in the textarea too |
| The events | 8,250 of 128 characters, which joined give the input back; _time 01:20:00Z to 03:37:29Z; seq 0000001 to 0008250 |
| The page | 25 cards; "Showing the first 25 of 8,250 events. The counts above include every event, and so does Download results."; Events created 8,250; 8 search-time fields |
| The settings | Event boundary Fixed length; Record length 128, beside it; merge unchecked and disabled, with its hint |
| The chain | `mode=fixed length; 128 characters per event; TRUNCATE=10000` |
| Download config | `SHOULD_LINEMERGE = false`, `LINE_BREAKER = .{128}()`, `LINE_BREAKER_LOOKBEHIND = 128`, `# EVENT_BREAKER_ENABLE = true`, `# EVENT_BREAKER = .{128}()`, `MAX_TIMESTAMP_LOOKAHEAD = 20`, `KV_MODE = auto` |

### 3. Behaviour

| Step | Expected |
|---|---|
| Open the laboratory | Two labelled rows, 9 samples and 5 common mistakes; Multiline syslog pressed, with its note |
| Choose each example | It alone is pressed (`aria-pressed`), and its note shows |
| Set the processing tier to Heavy Forwarder; choose Event over TRUNCATE, then Multiline syslog | TRUNCATE 10000, record length 128, index security, route result=failure → security_alerts; the tier is still Heavy Forwarder |
| RFC 5424 syslog, then change the sourcetype | "Custom settings…" note; no button pressed; Download config has no TIME_PREFIX |
| Kubernetes JSON, then delete the last line of the raw input | Still Kubernetes JSON, with its note; 2 events |
| "Open in walkthrough" on Kubernetes JSON, Windows XML, CSV file, Java stack trace, Event over TRUNCATE, Fixed-length records and CSV header per event | The walkthrough opens on its JSON, Windows, CSV, syslog, JSON, syslog and syslog samples; the fixed-length event is its 128 characters |
| Event over TRUNCATE, then the architecture report and Download results | "Sample: Event over TRUNCATE"; settings.truncate 256 |
| RFC 5424 syslog, then the evidence pack | `implementation/parsing-laboratory.conf` has `TIME_PREFIX = ^<\d+>\d+\s+` |
| Event over TRUNCATE, then Performance guardrails › Use parsing sample | Average and maximum event sizes from its events (0.183 and 0.25 KB) |
| Fixed-length records, Record length 64 | Custom settings; 16,500 events of 64 characters, the first being the input's first 64; `LINE_BREAKER = .{64}()` and no LOOKBEHIND line; Events created 16,500 |
| Record length 5 | Raised to 16: the field shows 16; 66,000 events |
| Fixed-length records, TRUNCATE 100 | Truncated 8,250 and Warnings 8,250, not 25; event 1 "TRUNCATE removed 28 characters" |
| Fixed-length records, raw input of 300 "A"s | Events of 128, 128 and 44 characters; only the last has "Record is 44 characters, not 128" |
| Raw input: 50 "A"s, a line break, 200 "B"s | 2 events: 179 characters with the line break kept, then 72; each with its "Record is…" warning |
| Fixed length 64, then Multiline syslog, then Fixed-length records | Record length back to 128; 8,250 events |
| Fixed-length records, then the evidence pack | `assurance/effective-parsing-laboratory.json` lists 25 events, with summary.events 8250 and summary.eventsListed 25. The manifest's parsingLaboratoryEvents is 8250, and the architecture report JSON lists 25 of 8250. The `.conf` has `LINE_BREAKER = .{128}()` |
| Fixed-length records, Download results | 8,250 events, no eventsListed, settings.raw 1,056,000 characters |
| CSV header per event | Event boundary CSV header line, KV_MODE = multi, merge disabled, no Record length. The search-time list ends "KV_MODE = multi". Each card shows "Search time · calculated · 2 rows" and Row 1, Row 2. The chain reads `KV_MODE=multi; fields=5; rows=4` |
| CSV header per event, raw input with the header `src.ip\|port,count` | `LINE_BREAKER = ([\r\n]+)(?=src\.ip\|port,count)`; events of 2 and 3 lines |
| Multiline syslog, KV_MODE = multi | The one-line event warns "No search-time fields extracted" |
| CSV header per event, Index-time extraction CSV | 5 row events; the chain says "not applied"; the configuration has the "boundary is not written" comment and `LINE_BREAKER = ([\r\n]+)` |
| With Fixed-length records chosen, save the topology | The saved topology and localStorage stay 12 KB: the lab's state isn't saved |

### 4. Speed, with the 1 MB input

Measured in headless Chromium in the build container, from the click to the next frame:

| Action | Time |
|---|---|
| Choose Fixed-length records | 190 to 310 ms (the first time includes building the line) |
| Change TRUNCATE or Record length | about 200 to 230 ms |
| Choose 1 MB line, no breaker | about 160 ms |
| Choose Multiline syslog after it | about 20 ms |
| Download results (8.5 MB) | 80 to 100 ms |
| Evidence pack (2.5 MB) | about 170 ms; 1.5 s if it held every event |

### 5. Widths

| Width | Checked, for Event over TRUNCATE, Fixed-length records, 1 MB line, no breaker and CSV header per event |
|---|---|
| 1920, 1280, 768, 400 and 320 | All 14 buttons inside the bar and the note within it. The Record length field, the preview note, the rows and the cards stay inside the content. No sideways page scroll |
| 1024 | The same, except the 9 px sideways scroll Build 199 already has |
| 400 | Each group label above its buttons; the note wraps; Record length below Event boundary |

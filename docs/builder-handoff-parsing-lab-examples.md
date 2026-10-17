# Builder handoff: more Parsing laboratory examples

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 199.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="parsing-lab-examples-v200-styles">`, containing [`docs/mockups/parsing-lab-examples-prototype.css`](mockups/parsing-lab-examples-prototype.css);
- `<script id="parsing-lab-examples-v200">`, containing [`docs/mockups/parsing-lab-examples-prototype.js`](mockups/parsing-lab-examples-prototype.js).

The script adds to `parsingLabPresets` and wraps `renderParsingLab` and `parsingLabConfiguration`, so there are no in-place edits. Paste both files as they are, then add the build records (see "Build records").

**Mockup (the target):** [`docs/mockups/parsing-lab-examples-mockup.html`](mockups/parsing-lab-examples-mockup.html). Every scene is a screenshot of the real laboratory: eight with the block pair applied, and one "Today" scene from Build 199. The screenshots are `docs/mockups/compare/parsing-lab-*.png`.
**Tested first:** the block pair was appended to Build 199 and run. The results under "Check before uploading" come from that run.

## Why

**What Build 199's laboratory offers** (Operate › Parsing laboratory):
- **Four samples:** Multiline syslog, Windows XML, NDJSON API and CSV file. Between them they show line merging, XML events, indexed JSON and indexed CSV. Nothing shows a stack trace, a syslog header before the timestamp, epoch timestamps, or the common ways parsing goes wrong.
- **Nothing says what a sample shows.** The bar is four buttons.
- **A sample sets only some settings:** the raw input, event boundary, merging, timestamp mode, both extractions and the sourcetype. An index, a route, a timezone or a TRUNCATE you changed stays when you choose the next sample.
- **The generated configuration is the same for every format:** one TIME_FORMAT per timestamp mode, and no TIME_PREFIX or TIMESTAMP_FIELDS. A sample with milliseconds, a header before its timestamp, or its time in a JSON field downloads settings that won't read its timestamps.
- **"Open in walkthrough" picks the walkthrough's sample by the example's id.** Custom JSON input opens in the walkthrough as syslog.

## The design

### 1. The examples, in two groups

**Samples** are formats as they should be parsed. **Common mistakes** are a sample with one setting wrong, so you can see what that setting does to the events. The six new examples are in bold.

| Example | Group | What it shows | Settings | Result |
|---|---|---|---|---|
| Multiline syslog | Samples | A continuation line merges into the event above it | Timestamp prefix, merge on, KV_MODE = auto | 2 events |
| Windows XML | Samples | Each `<Event>` is one event; the Data fields come at search time | XML Event element, KV_MODE = xml | 2 events |
| NDJSON API | Samples | Indexed JSON fields let the route on result=failure work | Every line, INDEXED_EXTRACTIONS = json | 2 events, 1 routed |
| CSV file | Samples | The header names indexed columns | Every line, INDEXED_EXTRACTIONS = csv | 2 events, 1 routed |
| **Java stack trace** | Samples | Stack frames stay with their event: six lines, two events | Timestamp prefix, merge on, KV_MODE = auto; index app | 2 events |
| **RFC 5424 syslog** | Samples | The timestamp comes after a `<PRI>VERSION` header | Every line, KV_MODE = auto; index os | 3 events |
| **Kubernetes JSON** | Samples | Epoch seconds become _time; errors route to their own index | Every line, epoch, INDEXED_EXTRACTIONS = json; index k8s; route level=error → k8s_errors | 3 events, 2 routed |
| **JSON extracted twice** | Common mistakes | Index-time and search-time JSON together: every value twice | NDJSON API with KV_MODE = json | 2 events, 2 warnings, 1 routed |
| **Event over TRUNCATE** | Common mistakes | A cut event isn't valid JSON: no fields, and the route misses it | Every line, INDEXED_EXTRACTIONS = json, TRUNCATE = 256; index email; route action=quarantine → email_quarantine | 2 events, 3 warnings, 1 truncated, 0 routed |
| **Stack trace split per line** | Common mistakes | Breaking at every line splits the stack trace | Java stack trace with Every line, merge off | 6 events, 8 warnings |

The new samples follow the laboratory's existing story (alex's failed logins from 10.10.4.21 at 01:20 on 20 September 2026), seen in other data. Settings an example doesn't list are the defaults in section 3.

### 2. The note

One line under the bar says what the chosen example shows. When the example's format needs props lines (section 4), the note ends "Its configuration uses `TIME_PREFIX = …`".
- **Changing a setting** makes the settings custom, as in Build 199. The note then reads "Custom settings. Choose an example to reset every setting to it." and no button is pressed.
- **Editing the raw input** keeps the example and its note, as Build 199 keeps the pressed button.

The bar has two rows, "Samples" and "Common mistakes", each labelled. On a phone each label sits above its buttons. The buttons keep Build 199's style and get `aria-pressed`.

### 3. Choosing an example

Every setting comes from the example. Settings it doesn't list return to these defaults (Build 199's starting values):

| Setting | Default |
|---|---|
| Event boundary, merge, timestamp mode | Every line, off, ISO-8601 |
| Index-time and search-time extraction | None, KV_MODE = none |
| TRUNCATE, timezone | 10000, UTC |
| Sourcetype, default index | custom, security |
| Route | result = failure → security_alerts |

The four Build 199 samples list the same settings as before, so they look the same; only a value carried over from another example is reset. **The index-time processing tier is kept**: it describes your topology, not the example.

### 4. The configuration

While an example's settings are unchanged, its own props lines go into Download config and into the evidence pack's `implementation/parsing-laboratory.conf`. A line that is already there (TIME_FORMAT) is replaced; a new one is added before TIME_FORMAT.

| Example | Props lines |
|---|---|
| Windows XML | `TIME_PREFIX = SystemTime="` |
| NDJSON API, CSV file, JSON extracted twice, Event over TRUNCATE | `TIMESTAMP_FIELDS = time` |
| Java stack trace, Stack trace split per line | `TIME_FORMAT = %Y-%m-%dT%H:%M:%S.%3N%Z` |
| RFC 5424 syslog | `TIME_PREFIX = ^<\d+>\d+\s+` |
| Kubernetes JSON | `TIMESTAMP_FIELDS = ts` (TIME_FORMAT = %s, from the epoch mode) |
| Multiline syslog | None: the generic lines fit |

Once a setting changes, the generic lines return, since the example's lines may no longer fit.

### 5. Open in walkthrough

The walkthrough has its own JSON, CSV, Windows and syslog samples, and models each differently. "Open in walkthrough" now picks one from the settings:
- an XML boundary or KV_MODE = xml gives Windows;
- JSON at either time gives JSON;
- INDEXED_EXTRACTIONS = csv gives CSV;
- anything else gives syslog.

The four Build 199 samples open as before. The JSON examples, and custom JSON input, open as JSON.

### 6. Unchanged

The model, the settings grid, the placement, the metrics, the configuration chain, the event preview, the JSON export's format and the architecture report. Performance guardrails' "Use parsing sample" reads the chosen example's events, as before.

## How the block works

For maintenance; the code is in the two prototype files.

- **Examples:** the four Build 199 samples get `group`, `note` and, where needed, `props`. The six new ones are added to `parsingLabPresets` with the same keys, so the architecture report names them like the others.
- **Choosing:** `choose(id)` starts from `SAMPLE_DEFAULTS`, copies the example's own settings (`raw` and the defaults' keys), sets `preset` and renders. It copies only setting keys, so `name`, `note` and `props` stay out of `state.parsingLab` and the JSON export. Build 199's handler copied every key, `name` included.
- **Rendering:** `renderParsingLab` is wrapped, on top of the processing-tier wrapper Build 199 already has. After both render, `decorate()`:
  - rebuilds `.parsePresetBar` into the two groups, with `choose()` on each button;
  - adds the note after the bar;
  - binds "Open in walkthrough" again with the settings-based choice (section 5).
- **Configuration:** `parsingLabConfiguration` is wrapped. It reads `parsingLabPresets[state.parsingLab.preset]?.props`, so a custom preset gets nothing. Each line is replaced or inserted with a function replacement, so `$` in a value is safe.
- **CSS:** the bar becomes a grid of two flex rows, each with a fixed-width label (above the buttons under 640 px). The note uses the laboratory's muted text, with `code` chips in its monospace style. The operations views are dark-only, like the rest of the laboratory.
- **Globals it uses:** `parsingLabPresets`, `renderParsingLab`, `parsingLabConfiguration`, `parsingLabModel`, `renderOperations`, `evidenceXml`, `state`.

## Build records

As Build 199 did, after the block pair:
- `changeRegister`, group "Governance and evidence" (where "Effective parsing laboratory" is):
  `['Parsing laboratory examples','Six more Parsing laboratory examples, in two groups: Java stack trace, RFC 5424 syslog and Kubernetes JSON, and three common mistakes (JSON extracted twice, an event over TRUNCATE, a stack trace split per line). Each says what it shows, sets every setting it needs and adds its props lines to the generated configuration.',true]`.
- `#topologyBuilder` `data-build-number` 200 and `data-build-date`, the page title, and the ⓘ text prefix, with the date you build it.

If Build 200 also takes the Selection fix from [`builder-handoff-build199.md`](builder-handoff-build199.md), one set of build records covers both.

## Found while building the examples (not changed)

Two places where the laboratory's model and its generated configuration disagree. The new examples avoid both, so their results and configuration agree.

- **Timestamp prefix with merging off.** The model then makes every line an event. The configuration it generates says `SHOULD_LINEMERGE = false` and `LINE_BREAKER = ([\r\n]+)(?=20\d{2}-\d{2}-\d{2})`, which in Splunk breaks only before a timestamp, so continuation lines would stay with their event.
  - Try it: Multiline syslog, merging off. The laboratory shows 3 events; Splunk, with that configuration, makes 2.
  - A fix: with the Timestamp prefix boundary, always break before a timestamp line, and let merging matter only for the Every line boundary. That is what `SHOULD_LINEMERGE` does there, with `BREAK_ONLY_BEFORE_DATE`.
- **A syslog header before the timestamp.** The model's timestamp-prefix boundary accepts `<PRI>VERSION` before the timestamp (`^(?:<\d+>\d?\s+)?20\d\d-…`), but the generated LINE_BREAKER doesn't. A fix: `LINE_BREAKER = ([\r\n]+)(?=(?:<\d+>\d?\s+)?20\d{2}-\d{2}-\d{2})`.

Also seen, and already in Build 199: at 1024 px the page scrolls 9 px sideways, in Flow and in Operate, with or without the block. The cause is outside the laboratory.

## Check before uploading

All in Operate › Parsing laboratory, with the default topology, unless stated.

### 1. Regression

- 0 `pageerror` events in every check below, from 320 to 1920 px.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 199 on the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies: 87 of 87.

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
| JSON extracted twice | 2 | 2 | 1 | 6 fields at each time; KV_MODE = json |
| Event over TRUNCATE | 2 | 3 | 0 | Event 2: 256 / 567 characters, "TRUNCATE removed 311 characters", "No index-time fields extracted", "Invalid JSON for indexed extraction"; target index email |
| Stack trace split per line | 6 | 8 | 0 | Events 2 to 5 have no timestamp and no fields; `LINE_BREAKER = ([\r\n]+)` |

### 3. Behaviour

| Step | Expected |
|---|---|
| Open the laboratory | Two labelled rows, 7 samples and 3 common mistakes; Multiline syslog pressed, with its note |
| Choose each example | It alone is pressed (`aria-pressed`), and its note shows |
| Set the processing tier to Heavy Forwarder; choose Event over TRUNCATE, then Multiline syslog | TRUNCATE 10000, index security, route result=failure → security_alerts; the tier is still Heavy Forwarder |
| RFC 5424 syslog, then change the sourcetype | "Custom settings…" note; no button pressed; Download config has no TIME_PREFIX |
| Kubernetes JSON, then delete the last line of the raw input | Still Kubernetes JSON, with its note; 2 events |
| "Open in walkthrough" on Kubernetes JSON, Windows XML, CSV file, Java stack trace and Event over TRUNCATE | The walkthrough opens on its JSON, Windows, CSV, syslog and JSON samples |
| Event over TRUNCATE, then the architecture report and Download results | "Sample: Event over TRUNCATE"; settings.truncate 256 |
| RFC 5424 syslog, then the evidence pack | `implementation/parsing-laboratory.conf` has `TIME_PREFIX = ^<\d+>\d+\s+` |
| Event over TRUNCATE, then Performance guardrails › Use parsing sample | Average and maximum event sizes from its events (0.183 and 0.25 KB) |

### 4. Widths

| Width | Checked |
|---|---|
| 1920, 1280, 768, 400 and 320 | The ten buttons inside the bar, the note within it, no sideways page scroll |
| 1024 | The same, except the 9 px sideways scroll Build 199 already has |
| 400 | Each group label above its buttons; the note wraps |

# Builder handoff: the Config view

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 204.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="config-view-v205-styles">`, containing [`docs/mockups/config-view-prototype.css`](mockups/config-view-prototype.css);
- `<script id="config-view-v205">`, containing [`docs/mockups/config-view-prototype.js`](mockups/config-view-prototype.js).

There are no in-place edits. The script:
- adds a Search Head and ten search-time stages to the explorer's model;
- adds the Config view;
- wraps five functions.

The style block styles the view and changes two Matrix rules that every view shares: the header's sticky offset and the component columns' padding. Paste both files as they are, then add the build records (see "Build records").

**Mockup (the target):** [`docs/mockups/config-view-mockup.html`](mockups/config-view-mockup.html).
- Twelve scenes have the block pair applied. The "Today" scene is Build 204.
- It also has the table of where each kind of line goes.
- The screenshots are `docs/mockups/compare/config-*.png`.

**Tested first:** the block pair was appended to Build 204 and run. The results under "Check before uploading" come from that run.

## Why

The request was "Map configurations lines from an uploaded props.conf to the relevant line in the matrix. Give an example first", then "Include inputs and transforms".
- The example came first: a props.conf upload in the Matrix view, then extended to inputs.conf and transforms.conf.
- Five answers then settled the design:

| Question | Answer |
|---|---|
| 1. Where the files go | A separate view, Config, beside Matrix |
| 2. Which component a line is checked against | The one chosen in the component strip, which gains a Search Head |
| 3. Several files of one kind | Merged in Splunk's precedence order |
| 4. Search-time settings | Matrix rows of their own |
| 5. Keep the files between visits | No |

**On Build 204 the Matrix reads one way only.**
- Each stage's Configuration column names its settings, so a reader can go from a stage to its settings.
- Going back, from a file's line to its stage, is left to the reader. So is working out whether the line does anything on a forwarder, an indexer or a search head.
- The Matrix also has no search-time stages, so EXTRACT-, REPORT-, KV_MODE, FIELDALIAS-, EVAL- and LOOKUP- lines have nowhere to go.

**Testing found one fault in Build 204, which the block fixes: the Matrix header covers stages 1 and 2.**
- `th{position:sticky;top:75px}` (the toolbar's height) is measured inside the nearest scrolling box, `.matrixWrap{overflow:auto}`, not the page.
- So the header is drawn 75 px down the table, over the first two rows. An empty band is left where it should be, and it never follows the page.
- Stages 1 (Source acquisition) and 2 (Input checkpointing) are where inputs.conf lines land.
- **The fix:** `.matrixWrap th{top:0}`. See the mockup's "Today: the header" scene.

## The design

### The view

- **A Config button** after Matrix in the view switcher: Flow, Matrix, Config, Builder, OV, Operate, Diagnose, Failure Lab, Changes.
- **The view shows, top to bottom:**
  - **A line naming the component the lines are checked against:**
    - with none chosen: "Choose a component to check where each line takes effect on it.";
    - with one chosen: "Checking where each line takes effect on a Universal Forwarder. Choose another component, or All components."
  - **The component strip, compact:** names only, in a grid of 150 px columns.
  - **The files panel.**
  - **The view's own Matrix.**
- **Hidden in the view:** `.topologyBar`, `.parallelPanel`, `.context`, `#routeDiagram` and `#parallelAccuracy`. These are the path chips, the capacity model, the processing model's heading and diagram, and the parallel pipeline accuracy note.
- **Every other view, the Matrix view included,** is as on Build 204 except for the Search Head, the search-time stages, the header fix and the narrower component columns (check 1).

### The Search Head and the search-time stages

- **The Search Head joins the components,** after Indexer:
  - in `componentOrder` as `sh`;
  - in the strip: "Search tier · Search Head · Run searches with search-time knowledge", colour `#b4a7f5`;
  - in the Matrix: a column between Indexer and AWS S3;
  - in every stage's detail.
- **Ten new stages, 109 to 118,** form the pipeline "Search-time processing". It has the same colour and is listed in the pipeline filter. The stages follow Splunk's search-time order:

| Stage | Name | Settings |
|---|---|---|
| 109 | Source type renaming | `rename` in props.conf |
| 110 | Inline field extraction | `EXTRACT-*` · `MATCH_LIMIT` · `DEPTH_LIMIT` |
| 111 | Transform field extraction | `REPORT-*` · `REGEX` · `FORMAT` · `DELIMS` · `FIELDS` in transforms.conf |
| 112 | Automatic key-value extraction | `KV_MODE` · `AUTO_KV_JSON` · `KV_TRIM_SPACES` |
| 113 | Field aliasing | `FIELDALIAS-*` |
| 114 | Calculated fields | `EVAL-*` |
| 115 | Lookups | `LOOKUP-*` · lookup stanzas in transforms.conf |
| 116 | Event typing | eventtypes.conf |
| 117 | Tagging | tags.conf |
| 118 | Search-time segmentation | `SEGMENTATION-*` · segmenters.conf |

- **In each new stage:**
  - **Search Head:** runs.
  - **Indexer:** conditional. Search peers run these stages using the copy of the search head's settings that the search head sends them.
  - **Every other component:** not used.
- **The Search Head in the existing 108 stages:**
  - **Runs:**
    - 98 Human identity assertion;
    - 99 Splunk login and session creation;
    - 100 RBAC role and capability mapping;
    - 101 Local or break-glass authentication;
    - 102 REST API token validation;
    - 105 Inter-component TLS certificate validation;
    - 108 Authentication audit recording.
  - **Conditional:**
    - 106 Splunk shared-secret verification;
    - and 32 stages any full Splunk instance runs for data it reads itself, such as its own logs, which a search head forwards to the indexers: 1–6, 8–10, 12–31, 40, 42 and 43. In each of them a Heavy Forwarder's cell isn't Not used.
  - **Not used:** the other 68.
- **So the Search Head card counts 50 stages.** Choosing it in the Flow view mutes 68 of 118 cards.
- **The counts:**
  - "118 stages" and "11 components" in the header;
  - the strip: All components 118, Indexer 73 (63 + 10), Search Head 50.
- **Every topology path keeps the search-time stages.** Every topology ends in search, and the path presets' patterns don't name them.

### Files

- **Three ways in:**
  - **Upload files:** one or several.
  - **Upload a folder:** an app, an apps folder or a whole etc folder.
  - **Drop** files or folders on the panel.
- **Try an example** loads five files: an add-on's default files as its vendor ships them, and the site's local overrides.
- **Which kind of file:**
  - **By its name,** if the name contains inputs, props or transforms.
  - **Otherwise by what is in it:**
    - an input stanza (`[monitor://…]`, `[splunktcp…]`, `[http…]`, `[SSL]` …) makes it inputs.conf;
    - a `REGEX`, `DEST_KEY`, `FORMAT`, `INGEST_EVAL`, `CLONE_SOURCETYPE`, `filename` or `DELIMS` setting makes it transforms.conf;
    - anything else is props.conf.
- **From a folder,** only files named inputs.conf, props.conf and transforms.conf are read. The others are counted: "Skipped 1 other file."
- **Files that aren't read:**
  - over 2 MB: "… is over 2 MB";
  - containing a NUL character: "bad.bin isn’t a text file".
- **A file with no settings** is read, and named: "… has no settings".
- **How a file is read:**
  - **What it reads:** stanzas; settings; a value continued onto the next line by a trailing backslash; comments.
  - **Settings before the first stanza** are global.
  - **A line with no "="** is flagged: "Not a setting".
  - **A byte-order mark and Windows line ends** are handled.

### Precedence

- **Files of one kind merge as Splunk merges them in the global context,** highest first:
  1. peer-apps local (indexer cluster peers only; slave-apps before Splunk 9.0);
  2. system/local;
  3. every app's local folder;
  4. peer-apps default;
  5. every app's default folder;
  6. system/default.
- **Apps sort in the ASCII order** of their folder names, so a capital letter comes before a small one: `Splunk_TA_x` before `alpha_app`.
- **A file's place comes from its path:** `…/system/local/props.conf`, `…/<app>/default/props.conf`, `…/peer-apps/<app>/local/props.conf`.
- **A file uploaded on its own** has no path:
  - It goes at app local, after the named apps there.
  - It gets a selector to move it. Moving it merges the files again.
- **Two files in the same place** can't both exist in Splunk. The later upload wins.
- **Within one file the last line for a setting wins.** The earlier one is flagged: "Line 3 sets it again; Splunk keeps the last value."
- **Left out of an etc folder, and named in the panel:**
  - **`etc/users`:** "Left out 1 file in etc/users: Splunk reads it only at search time, for its user."
  - **`etc/deployment-apps`, `etc/manager-apps` (`master-apps`) and `etc/shcluster`:** "Left out 1 file in etc/deployment-apps: Splunk sends it to other instances. Upload that folder on its own to see it."
  - **One of these folders uploaded on its own** is read as installed apps.
- **What shows:**
  - **The panel** lists the files of the kind on show, highest first: number, path and place. The first file is marked "wins", and each has Remove.
  - **An overridden line** is dimmed and struck through: "No effect · Overridden by Splunk_TA_acme/local/props.conf line 4."
  - **The line that wins** says "Overrides Splunk_TA_acme/default/props.conf line 15."
  - **The view's Matrix and the stage detail** show only lines that win.
- **Search time on a search head merges differently.** Settings merge in the context of the app a search runs in, in this order:
  1. the user's own settings;
  2. that app's settings;
  3. other apps' globally shared settings;
  4. system's settings.

  The view merges every setting in the global order, and each search-time stage's detail says so (see "Found while testing").

### Where each kind of line goes

**props.conf**

| Line | Stage |
|---|---|
| A setting props.conf.spec places in a stage | That stage. For example:<br>`CHARSET` → 05<br>`EVENT_BREAKER*` → 11<br>`TRUNCATE`, `LINE_BREAKER` → 12<br>`SHOULD_LINEMERGE`, `BREAK_ONLY_BEFORE*` → 15<br>`TIME_PREFIX`, `TIME_FORMAT`, `TZ` → 16<br>`DATETIME_CONFIG` → 16, also 17<br>`MAX_DAYS_AGO` → 18<br>`ROUTE_EVENTS_OLDER_THAN` → 19<br>`TRANSFORMS-*` → 22<br>`SEDCMD-*` → 24<br>`ANNOTATE_PUNCT` → 27<br>`SEGMENTATION` → 33 |
| Header and timestamp settings in a stanza that sets `INDEXED_EXTRACTIONS` | 09 Structured-data parsing, where the file is read: "This stanza sets INDEXED_EXTRACTIONS, so the structured parser applies it where the file is read. Without that, it would be stage 16’s." |
| `sourcetype` in a `[source::]` or rule stanza | 04 |
| `sourcetype` anywhere else | Flagged: "sourcetype is only read in [source::…] and rule stanzas. Here it has no effect." |
| A search-time setting | 109–118, as in the table above |
| `category`, `description`, `pulldown_type` | No stage: "Splunk Web · source type list" |
| `priority` | No stage: "Stanza precedence" |

- **A line naming transforms.conf stanzas** (`TRANSFORMS-`, `RULESET-`, `REPORT-`, `LOOKUP-`) says what each one does: "[acme_fw_drop_debug] → 23: drops matching events (nullQueue). [acme_fw_to_netfw] → 23: sets the index to netfw_au."
- **Without transforms.conf** it says: "What it does depends on the transforms.conf stanzas it names: routing (stage 23), masking (24), copying (25) or indexed fields (26). Add transforms.conf to see which."

**transforms.conf**

A stanza goes to one stage, decided by its settings together, and each of its settings follows it ("↳ 23"). The first rule that applies wins:

| Settings | Stage |
|---|---|
| `filename`, `collection` or `external_cmd` | 115 Lookups: "Lookup table acme_geo.csv" |
| `METRIC-SCHEMA-*`, or a `[metric-schema:…]` stanza | 22: "Turns events into metric data points" |
| `CLONE_SOURCETYPE` | 25: "Copies matching events as acme:fw:denied" |
| `INGEST_EVAL` | Where each field it sets acts:<br>`index`, `queue`, `host`, `source`, `sourcetype` → 23<br>`_raw` → 24<br>`_time` → 22<br>`_TCP_ROUTING`, `_SYSLOG_ROUTING` → 29<br>any other field → 26: "Writes site as an indexed field"<br>The stanza takes the first field's stage; the others are "also" |
| `DEST_KEY` | `queue` → 23: "Drops matching events (nullQueue)", or "Sends matching events to …"<br>`_MetaData:Index` → 23: "Sets the index to netfw_au"<br>`MetaData:Host`, `MetaData:Source`, `MetaData:Sourcetype` → 23<br>`_raw` → 24<br>`_meta` → 26<br>`_time` → 22<br>`_TCP_ROUTING`, `_SYSLOG_ROUTING`, `_INDEX_AND_FORWARD_ROUTING` → 29 |
| `DEST_KEY` with any other value | Flagged, case sensitive: "Splunk has no DEST_KEY called _metadata:index. Did you mean _MetaData:Index? Key names are case sensitive, so it changes nothing" |
| `WRITE_META = true` | 26: "Writes rule_id as an indexed field" |
| Run by a `TRANSFORMS-` line, and by no `REPORT-` line, with none of the above | Flagged: "Has no DEST_KEY or WRITE_META, so it changes nothing at index time" |
| `REGEX` or `DELIMS` | 111 Transform field extraction: "Extracts fields at search time" |
| None of these | "Has no REGEX, INGEST_EVAL or lookup settings, so it does nothing" |

- **A search-time stanza named by a `TRANSFORMS-` line as well as a `REPORT-` line** is still a search-time extraction:
  - **Its note:** "Extracts fields at search time. At index time it changes nothing: it has no DEST_KEY or WRITE_META."
  - **The `TRANSFORMS-` line** says the same of it, and counts as one to check: "[regex_only] changes nothing at index time: it has no DEST_KEY or WRITE_META."
  - **A `TRANSFORMS-` line naming a lookup** is flagged the same way.

- **Index-time transforms are checked against stage 22's cells.** They run there whatever they change. So `[acme_fw_to_netfw]` shows in 23 but has no effect on a Universal Forwarder.
- **A transform no props.conf line runs never runs.**
  - Its note: "No TRANSFORMS- or REPORT- line in props.conf names it, so it never runs."
  - It has no effect, and counts as one to check.
  - **The exception is a lookup,** which a search can use by name.
- **A stanza's note names the line that runs it:** "Run by Splunk_TA_acme/default/props.conf line 17, TRANSFORMS-route in [acme:fw]."

**inputs.conf**

A stanza is an input, in the stage its kind names:

| Stanza | Stage |
|---|---|
| `[monitor://<path>]` | 01, also 60 UF monitored-file pickup |
| `[batch://]`, `[tcp://]`, `[udp://]`, `[script://]`, `[WinEventLog://]`, `[perfmon://]` and the other built-in inputs; `[fschange:]`, `[remote_queue:]` | 01 |
| A modular input, `[<scheme>://<name>]` | 01: "A modular input, <scheme>" |
| A scheme one or two letters off a built-in one | Flagged: "No input is called moniter://. Did you mean monitor://? Splunk ignores this stanza." |
| `[splunktcp:<port>]` | 07 tcpin_queue |
| `[splunktcp-ssl:<port>]` | 07, also 105 |
| `[tcp-ssl:<port>]` | 01, also 105 |
| `[splunktcptoken://<name>]` | 106 Splunk shared-secret verification |
| `[SSL]` | 105 |
| `[http]` | 66 Listener and request decoding |
| `[http://<name>]`, an HEC token | 67 Token validation and index authorisation, also 103 |
| `[default]` | 04 |

- **A setting goes where it acts:**

  | Setting | Stage |
  |---|---|
  | `whitelist`, `blacklist`, `ignoreOlderThan` | 01 |
  | `crcSalt`, `initCrcLength`, `followTail` | 02 |
  | `host`, `index`, `source`, `sourcetype`, `connection_host` | 04 |
  | `_meta` | 04, also 26 |
  | `persistentQueueSize`, `queueSize` | 06 |
  | `queue` | 10 parsingQueue |
  | `_TCP_ROUTING`, `_SYSLOG_ROUTING`, `outputgroup` | 29 |
  | `port`, `maxSockets`, `maxThreads` | 66 |
  | TLS settings: `serverCert`, `sslPassword`, `requireClientCert`, `sslVersions`, `cipherSuite` … | 105 |
  | `disabled` | The stanza's own stage |

- **In an HEC token,** the same settings describe the token:

  | Setting | Stage |
  |---|---|
  | `token`, `index`, `indexes` | 67, also 103 |
  | `sourcetype` | 69, also 103 |
  | `source`, `host` | 69 |
  | `queue` | 75 |
  | `useACK` | 71, also 68 |
  | `outputgroup` | 29 |

- **Any other setting** goes to the stanza's own stage: "A setting of this kind of input". The exception is one that looks like a typo of a setting Splunk knows.
- **An input's settings act only where the input does.** Each setting's cells are capped by its stanza's first stage. So TLS settings in a `[splunktcp-ssl]` stanza do nothing on a Universal Forwarder, which can't receive.
- **A disabled input does nothing.**
  - If the winning `disabled` is true, every line of the input has no effect: "Disabled: Splunk_TA_acme/default/inputs.conf line 4 turns it off."
  - In the example, the local `disabled = false` beats the default's `disabled = true`.
  - **A disabled HTTP Event Collector** (`[http]` with `disabled` true) turns off every HEC token too.
  - **Only the files given count.** Splunk ships the collector disabled, but the view doesn't assume a file it wasn't given.

**Flagged in every file,** and counted in "to check":
- **A setting Splunk doesn't know,** with the setting most likely meant: "Not a props.conf setting. Did you mean MAX_TIMESTAMP_LOOKAHEAD? Splunk ignores this line." In the wrong case it adds: "Setting names are case sensitive."
- **A setting from another kind of file:** "A transforms.conf setting: props.conf ignores it."
- **Misplaced settings:**
  - `sourcetype` in the wrong stanza;
  - a `DEST_KEY` Splunk doesn't have;
  - a transform that changes nothing.
- **A stanza a props.conf line names that transforms.conf lacks:** "[nope] isn’t in transforms.conf".
- **A transform nothing runs.**
- **A `TRANSFORMS-` line naming a search-time stanza or a lookup.**
- **A setting a file sets twice.**
- **A line with no "=".**

### Read together

- **`TRANSFORMS-`, `RULESET-`, `REPORT-` and `LOOKUP-` lines** find the transforms.conf stanzas they name, and say what each one does.
- **A monitor with no `sourcetype`** finds the props.conf `[source::]` stanza with its path: "Its source type, acme:fw, comes from Splunk_TA_acme/default/props.conf line 4."
- **An input's `sourcetype`** finds its props.conf stanza:
  - "props.conf [acme:proxy:csv] parses it."
  - or "props.conf has no [acme:proxy:json] stanza."
- **A `CLONE_SOURCETYPE` copy** joins the source types.

### Following one source type

- **The panel's Source type list** has every source type the files name:
  - props.conf stanzas;
  - `[source::]` and rule stanzas that set one;
  - inputs that set one, or get one from `[source::]`;
  - `CLONE_SOURCETYPE` copies.

  The example has acme:fw, acme:fw:denied, acme:proxy:csv and acme:proxy:json.
- **Choosing one keeps the lines that act on it,** in the panel and the view's Matrix:
  - its stanzas;
  - the transforms its lines run;
  - the inputs that read it;
  - the lines for every source type: `[default]`, global settings and `[host::]` stanzas.

  An HEC listener acts on what its tokens write.
- **The example, with acme:fw chosen:** 62 lines on 26 stages.

### Checked against the component strip

- **With All components chosen,** each line shows its stage's cells for UF, HF, IDX and SH: green runs, amber conditional, grey not used.
- **With a component chosen,** its Matrix column is picked out, and each line shows one verdict:

| Verdict | When |
|---|---|
| Takes effect | The stage runs there |
| Conditional | The stage is conditional there |
| Own inputs only | **On a Heavy Forwarder or an Indexer:** props.conf settings read with the source (stages 01, 02, 04, 05 and 09).<br>**On a Search Head:** every index-time line of props.conf and transforms.conf.<br>Each acts only on data that component reads itself, such as its own logs. Data forwarded to it was read, and this applied, upstream |
| No effect | The stage doesn't run there: "Stage 12 doesn’t run on a Universal Forwarder."<br>Or the line is overridden, misplaced or in a disabled input, or is a transform nothing runs.<br>Or it is a search-time line on an Indexer: "Search peers apply the search head’s copy of search-time settings, not their own." |

- **The summary counts them.** The example with acme:fw and the Search Head: "17 take effect on a Search Head · 38 only for data it reads itself · 7 have no effect there".
- **The example, all source types:**

| Chosen | Take effect | Only for data it reads itself | No effect |
|---|---|---|---|
| All components | "86 lines on 33 stages" | | |
| Universal Forwarder | 21 | | 65 |
| Heavy Forwarder | 61 | 7 | 18 |
| Indexer | 62 | 7 | 17 |
| Search Head | 23 | 43 | 20 |

  Each also shows "4 overridden by a higher file · 2 Splunk Web · 2 to check". The two to check are the misspelt `MAX_TIMESTAMP_LOOKAHED` and `[acme_fw_rule_id]`, which nothing runs.

### The panel

- **The head:**
  - "Configuration files · 5 files from Splunk_TA_acme · 77 settings, merged in Splunk’s precedence order";
  - the Source type list;
  - "Only stages these files set", ticked;
  - Upload files, Upload a folder and Clear.
- **Empty, the panel shows:**
  - "See where your configuration acts";
  - "Upload inputs.conf, props.conf and transforms.conf files, or an app or etc folder, or drop them here. Each line is matched to the stage below that applies it, and files of one kind are merged in Splunk’s precedence order.";
  - Try an example, Upload a folder and Upload files.
- **The summary,** as above. It is live (`aria-live="polite"`).
- **Tabs:**
  - one per kind of file present, with its number of files: "inputs.conf 2 files";
  - ← and → move between them;
  - a link adds the missing kinds: "Add transforms.conf".
- **Below the tabs:** the files of the kind on show, then their lines, file by file under a sticky heading. The lines are in a box up to 470 px tall (62% of the window's height) that scrolls.
- **Each line shows:**
  - its number;
  - the line itself;
  - its stage: number, name and any "also" stages;
  - the four cells, or the verdict;
  - a note.
- **Exceptions:**
  - **A transforms.conf setting** shows "↳ 23", since it acts with its stanza.
  - **A props.conf stanza heading** shows its kind: "Source type: acme:proxy:csv · structured (csv)", "Source: /var/log/acme/fw-*.log", "Default: every source type", "Global settings, before the first stanza".
- **Comments** show with All source types only.
- **Blank lines** are dropped.
- **A continued line** names the line it continues: "continues line <n>".
- **A stage button** scrolls the view's Matrix to that row, under the toolbar, and flashes it. A stage hidden by the search box or the pipeline filter opens in its detail instead.

### The view's Matrix

- **Which stages:**
  - only the stages the files set: 33 for the example;
  - or all 118, with those highlighted, when "Only stages these files set" is unticked.

  The search box and the pipeline filter still apply.
- **Each row lists its lines** under its Configuration cell, as chips. A chip shows:
  - the file's letter: I, P or T;
  - the line number: "4", or "1:4" (file 1, line 4) when there are several files of a kind;
  - the line.
- **A transforms.conf stanza stands for its lines:** "[acme_fw_drop_debug] drops matching events (nullQueue)".
- **Up to six chips.** Past that, five and "N more lines", which opens the stage's detail.
- **Chip styles:**
  - dashed: the line also acts here;
  - amber: own inputs only;
  - struck through in red: no effect.
- **A chip's tooltip** gives the file, line, stanza and verdict.
- **Clicking a chip** shows the line in the panel, on its tab, scrolled to and flashed.
- **Only lines that win are listed.** A stanza in several files appears once, under the header of the highest file.

### The stage detail

In the Config view only, after Common configuration:
- **"From your configuration":** each line with its file, line number, stanza and verdict. A transforms.conf stanza also lists its settings.
- **Then where the stage's settings act.** For the search-time stages: "Acts at search time, on the search head. Search peers apply the copy of its settings the search head sends them, so search-time settings belong on the search head. There they merge in the context of the app a search runs in: that app’s files first, then other apps’ globally shared settings, then system’s. This view merges the files in the global order, as Splunk does for index-time settings."

### Secrets

- **`token`, `sslPassword`, `sslKeysfilePassword`, `password` and `pass4SymmKey`** show as `••••••••` and their last four characters.
- **This applies everywhere:** the panel, the Matrix, the detail and the tooltips. The page's markup never holds the value.

### Not kept

- **The files live in `state.configView205` and nowhere else.**
- A reload starts empty, nothing is stored, and nothing leaves the page.

### Narrow screens

- **At 780 px and below,** each line's stage, cells and note go under the line, and the tabs scroll sideways.
- **The page doesn't overflow** in the view at 1024 or 390 px.

## How the block works

- **Guards:** the block does nothing unless `stages`, `render`, `openDetail`, `filtered` and `componentOrder` exist. The model additions run once, when `componentOrder` has no `sh`.
- **Model:**
  - adds `sh` to `componentNames` and `componentOrder`;
  - sets `sh` on every stage, and adds the ten stages;
  - adds the pipeline's colour to `colors`;
  - inserts the Search Head's Matrix `<th>`, its strip card and its pipeline filter option. The card's `onclick` is the other cards': `focusComponent('sh')`, `renderRouteDiagram()`, `render()`;
  - sets the counts again: `#allCount`, each `#<k>Count`, and the header's components stat.
- **Wraps:**
  - **`pathAllows`:** lets the search-time stages through every path, and every stage through in the Config view, whose Matrix ignores the topology.
  - **`filtered`:** in the Config view, with files loaded and "Only stages these files set" ticked, keeps the stages that have lines.
  - **`render`:** then decorates the Matrix with the chips and the picked-out column. In the Config view, it also draws the panel.
  - **`switchView`:**
    - sets `body.configView205`;
    - keeps `#matrix` active in the Matrix and Config views;
    - shows `#empty` as `render` would;
    - renders again when entering or leaving the Config view.
  - **`openDetail`:** adds `#dProps205` after `#dConfig`.
- **Tables:** `propsStages`, `inputStages`, `hecTokenStages`, `transformsKeys`, `destStages`, `searchStages`. They are exported on `window.configView205` for tests, with `parseConf`, `confType`, `placeOf`, `analyse`, `linesByStage`, `load`, `loadExample` and `readFiles`.
- **`analyse()`** runs after any file is added, moved or removed:
  1. Sorts each kind's files by precedence.
  2. Merges them from the lowest up into `pm.merged`.
  3. Marks each setting's `overriddenBy` and `overrides`.
  4. Marks each stanza's `primary`, `structured`, `input` and `disabledBy`.
  5. Works out each transforms.conf stanza's role from its settings and the props.conf lines that run it.
  6. Classifies every line (`r.m`).
  7. Assigns the source types.
- **`effect(r)`** gives a line's verdict for the chosen component. **`cells(r)`** gives its stage's cells, capped for an input's settings.
- **`linesByStage()`** maps each stage to the lines that win. The Matrix, the filter, the summary and the detail all use it.
- **DOM:**
  - the Config button;
  - `p.configStripLabel205` before `.componentStrip`;
  - `section#configView205` before `#matrix`;
  - two hidden file inputs at the end of `<body>`: one for files, one for a folder (`webkitdirectory`).
- **Listeners:**
  - `dragover`, `dragleave` and `drop` on the panel. A dropped folder is walked with `webkitGetAsEntry`.
  - `change` on the two file inputs.
  - The panel's own controls are bound each time it is drawn.
- **The styles:**
  - **the view:** hides the five panels and compacts the strip;
  - **the parts:** the panel, the lines, the chips, the picked-out column and the detail;
  - **two Matrix rules every view gets:**
    - `.matrixWrap th{top:0}`, the header fix;
    - `#matrix :is(th:nth-child(n+4),td.yn){padding-left:8px;padding-right:8px}`, so eleven component columns fit at 1440 px;
  - **`prefers-reduced-motion`:** an outline in place of the flash.

## Build records

After the block pair:
- **`changeRegister`,** group "Explorer foundations":
  `['Config view','A Config view beside Matrix maps every line of uploaded inputs.conf, props.conf and transforms.conf files to the Matrix stage that applies it. Files of one kind merge in Splunk’s precedence order, and each line is checked against the component chosen in the strip. The Search Head joins the components with ten search-time stages, and the Matrix header no longer covers its first two rows.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix,** as Build 204 did.

## Found while testing (not changed)

1. **At 1024 px the page is 9 px wider than the window** (1033 px) in every view that shows the capacity model (`.parallelPanel`), whose three columns need about 1,040 px of window. This happens on Build 204 too. The Config view hides the capacity model. (Corrected: this note first blamed the topology chips row, which scrolls in its own box. The fix is in [`builder-handoff-small-fixes.md`](builder-handoff-small-fixes.md).)
2. **The fixed Matrix header doesn't follow the page.**
   - `.matrixWrap` is its own scrolling box, so a sticky header sticks within it, and the box only scrolls sideways.
   - Making the header follow the page needs the box either not to scroll, or to scroll both ways with a height of its own.
3. **Search-time precedence on a search head follows app and user context.**
   - The view uses the global order, and says so in each search-time stage's detail.
   - Modelling it needs the app a search runs in, and each app's `.meta` files, which say which settings it shares with other apps. The view doesn't read `.meta` files.
4. **The path presets' patterns don't name search time.** The block lets the search-time stages through every path rather than editing the presets.
5. **A monitor finds its `[source::]` stanza by its exact path.** Splunk matches `[source::]` patterns with wildcards (`...` and `*`). So a monitor whose stanza is written as a different pattern gets no source type in the view.
6. **The Builder's search heads are its own.** Choosing a Builder topology doesn't choose the strip's Search Head, as it doesn't choose the strip's other components.

## Check before uploading

All at 1440 × 900 unless stated. "Build 204" is the comparison: each check ran on Build 204 and on Build 204 with the block pair. The page tested is byte for byte Build 204 (`index.html` on main) with the two prototype files appended.

### 1. Regression

- **0 `pageerror` events** in every check below.
- **Every existing Matrix row** reads the same as on Build 204 once the Search Head cell is taken out: 108 of 108, and the header too.
- **Every existing stage's detail** reads the same apart from its Search Head box: 108 of 108.
- **Every view's text, 13 views:** the only differences are:
  - the header's counts: 108 → 118 stages, 10 → 11 components;
  - the strip: the Search Head card, and the counts All components 118, Indexer 73, Search Head 50;
  - "Search-time processing" in the pipeline filter;
  - the Config button;
  - in the Matrix view, the new column and rows.
- **The Flow view with each component chosen:**
  - The same cards are muted as on Build 204, plus the ten search-time stages for every component but the Indexer. For example, Universal Forwarder goes from 71 of 108 to 81 of 118.
  - The Indexer's search-time cards stay unmuted: 45 of 108 → 45 of 118.
- **The Failure Lab:** its text is the same as on Build 204 with each of the ten components chosen, and in each of its 64 scenarios.
- **The OV workspace pages and Validate:** the same on the default, reference and zones topologies, 87 of 87.
- **Width of the Matrix view:**
  - At 1024, 1280 and 1366 px the table is 1318 px wide, against Build 204's 1349, inside its own scrolling box as before.
  - At 1440 and 1920 px it fits, as on Build 204.
- **The block's cost:** `render()` takes:

  | View | Build 204 | With the block |
  |---|---|---|
  | Matrix | 3.7 ms | 4.3 ms |
  | Flow | 3.8 ms | 4.3 ms |

  - Each figure is the median of 6 fresh pages each, alternating, with 40 renders per page.
  - In one page, the ten search-time rows account for 0.2 to 0.25 ms of the difference.

### 2. The mapping

- **Every setting the Matrix's Configuration column names** maps back to that stage: 51 of 51, with none mapped elsewhere. This covers settings such as `TRUNCATE` in stage 12, the `DEST_KEY` values it names, `rename` in 109, and the persistent queue and acknowledgement settings.
- **The example, line by line,** is in the mockup's props.conf, inputs.conf and transforms.conf scenes, and under "Where each kind of line goes".

### 3. The view

49 checks, all passing.

| Check | With the block |
|---|---|
| The model | 118 stages and 14 Matrix columns, the Search Head after Indexer. The ten stages are in Splunk's search-time order. The Config button is after Matrix. The Flow view has 118 cards. The strip has a Search Head card, and the pipeline filter lists search time |
| Flow view, Search Head chosen | 68 of 118 cards muted |
| Matrix view | No panel, 118 rows, no chips. The uf-idx path keeps the search-time stages (87 rows) |
| Config view | The panel, the strip's label, the strip and the Matrix are shown. The topology bar and route diagram are hidden |
| The example | Local files before default ones. 33 stages in the view's Matrix |
| Precedence | The default TZ is overridden by local line 4 and has no effect. The local TZ says it overrides default line 15. Stage 16 lists only `TZ = Australia/Sydney`. The summary counts 4 overridden |
| A disabled input | With local/inputs.conf removed, the monitor is disabled. `crcSalt` has no effect, and the stanza says "Disabled: Splunk_TA_acme/default/inputs.conf line 4 turns it off." |
| Search Head chosen | The summary and label name it, and its column is picked out (34 cells). `LOOKUP-geo` takes effect. `LINE_BREAKER` is "Own inputs only" |
| Indexer chosen | `LOOKUP-geo` has no effect, with the reason given: search peers use the search head's copy |
| Universal Forwarder chosen | `EVENT_BREAKER_ENABLE` is conditional. The summary and label read "a Universal Forwarder" |
| Deployment Server chosen | "0 take effect on a Deployment Server" |
| The detail | In the Config view, stage 16's detail lists `TZ = Australia/Sydney`. In the Matrix view it has no configuration section |
| Back to the Matrix view | 118 rows, no chips, no picked-out column |
| A folder: system/local, two apps, an app.conf | Order: system/local, Splunk_TA_x/local, alpha_app/local, Splunk_TA_x/default. "Skipped 1 other file." Effective TZ Europe/Paris (capitals first), TRUNCATE 9999 (system/local) |
| A cluster peer's etc folder | Order: peer-apps local, system/local, app local, peer-apps default, app default. TZ comes from peer-apps local, over system/local. TRUNCATE comes from app local, over peer-apps default. MAX_DAYS_AGO comes from peer-apps default, over app default |
| The same folder's users, deployment-apps and shcluster files | Left out and named, with nothing merged from them |
| deployment-apps uploaded on its own | Read as installed apps |
| A lone props.conf beside the example | It gets a place selector. At app local it comes after Splunk_TA_acme/local (TZ Australia/Sydney). At system/local it wins (Europe/London). Back at app default, then app local: Australia/Sydney |
| Edge files | `[moniter://]` flagged. `DEST_KEY = _metadata:index` flagged. A missing transform flagged. `REPORT-x` goes to 111 |
| A stanza named by `REPORT-x` and by `TRANSFORMS-a` | 111, with its index-time use changing nothing. The `TRANSFORMS-a` line says so |
| `[http] disabled = 1` with a token | The token's lines have no effect |
| `TZ` set twice in one file | The first: "No effect · Line 3 sets it again; Splunk keeps the last value." It counts as one to check |
| Secrets | Neither the HEC token nor the password is in the page's markup. `••••••••9b40` is shown |
| Keyboard | → moves from the inputs.conf tab to the props.conf tab, with focus |
| Reload | Empty, with nothing in `localStorage` |

### 4. Widths

| Width | The Config view with the example |
|---|---|
| 1440 px | The view's Matrix fits: 1386 of 1386 px |
| 1366 px | It fits exactly: 1312 of 1312 px |
| 1024 px | Page 1024 px; panel 970 px with nothing overflowing; no chip overflows its cell. The view's Matrix scrolls sideways in its own box (1275 of 970 px), as the Matrix view does |
| 390 px (phone) | Page 390 px, panel 362 px |

### 5. Large files

- **The test:** a props.conf of 500 stanzas and a transforms.conf of 500 stanzas, 8,500 lines in all.
- **Results:** read and drawn in 0.5 s. Choosing a component redraws in 0.22 s.
- **What could speed it up:** the panel draws every line, 5,500 here. Drawing only the lines in view would make it faster.

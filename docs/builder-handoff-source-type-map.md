# Builder handoff: the source type map

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 215. It also goes on top of the collapsed-and-redraw handoff, unchanged.
**One in-place edit,** under "The edit". Its old string is line 13981 of Build 215 and occurs exactly once; the edit doesn't change the number of lines.
**Two new blocks, at the end of the page (before `</body>`):**
- `<style id="config-type-map-v217-styles">`, containing [`docs/mockups/source-type-map-prototype.css`](mockups/source-type-map-prototype.css);
- then `<script id="config-type-map-v217">`, containing [`docs/mockups/source-type-map-prototype.js`](mockups/source-type-map-prototype.js).

The edit and the blocks are also in [`docs/mockups/source-type-map.diff`](mockups/source-type-map.diff), a unified diff against Build 215's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`. It also applies after [`collapsed-and-redraw.diff`](mockups/collapsed-and-redraw.diff), and then puts its two blocks before that handoff's two. Both orders were tested.

Make the edit, paste the two files as they are, then add the build records (see "Build records"). The blocks are numbered 217, after the collapsed-and-redraw handoff's 216. If this one is built first, keep the ids and give the build records the next build number.

**Mockup (the target):** [`docs/mockups/source-type-map-mockup.html`](mockups/source-type-map-mockup.html). Nine scenes have the edit and the blocks applied to Build 215, and the "Today" scene is Build 215. The screenshots are `docs/mockups/compare/source-type-map-*.png`.

**Tested first:** the edit and the blocks were applied to Build 215, and to Build 215 with the collapsed-and-redraw handoff, and run. The results under "Check before uploading" come from those runs.

## Why

The request was "For Splunk config page add view showing relationship of a sourcetype being processed".
- **On Build 215 the Config view can follow one source type, but only as a filter.** Its Source type list keeps the lines that act on the source type, in the panel and the view's Matrix. With acme:fw chosen in the example, that is "62 lines on 26 stages", under three tabs.
- **How those lines relate is left to the reader.** For acme:fw, these facts are spread over the three tabs and the Matrix:
  - the monitor input sets no source type;
  - its path matches a `[source::]` stanza that names acme:fw;
  - acme:fw's `TRANSFORMS-route` line runs three transforms, one dropping events and one sending them to two output groups;
  - another line copies events as acme:fw:denied.

  Nothing shows where the events end up.
- **The map draws these relationships,** one source type at a time, in the order Splunk processes it.

## The design

### Where it is

- **A section of its own in the Config view,** "Source type map", between the panel and the view's Matrix.
- **It shows only in the Config view, and only with files loaded.**
- **It follows the panel's source type.**
  - Its chips are the panel's Source type list. Choosing in either moves both: a chip sets the panel's choice and redraws, as the list does.
  - The map keeps no choice of its own, and nothing between visits.
- **With All source types,** it is a head only: "Follow a source type through Splunk", and the chips.
- **With files that name no source type:** "No source type to follow", and what would give it one.

### The five columns

The map has a column for each part of the processing, in order. A setting goes in the column of the Matrix pipeline of its stage, the stage the panel gives it.

| Column | Its stages' pipelines | What it holds |
|---|---|---|
| 1. Read | Every pipeline not below: the inputs' own, the forwarder's event breaking and structured parsing, and HEC's | The inputs that read it; the `[source::]` stanzas their paths match; the `[source::]` and rule stanzas that name it; the `CLONE_SOURCETYPE` transforms that make it; inputs.conf `[default]`; the props.conf settings applied where the data is read |
| 2. Parse | TCP input handoff, Parsing handoff, Parsing pipeline, Merging handoff, Merging pipeline, Typing handoff | The receiving ports in the files (`[splunktcp…]`), when an input other than HEC reads it; the source type's own card; the `[host::]`, `[default]` and global settings that parse it |
| 3. Transform | Typing pipeline | The `TRANSFORMS-`, `RULESET-`, `SEDCMD-` and other Typing pipeline lines. Each `TRANSFORMS-` and `RULESET-` line holds the transforms.conf stanzas it runs, in the order it lists them, each with its `REGEX`, `SOURCE_KEY`, `INGEST_EVAL`, `DEST_KEY`, `FORMAT`, `CLONE_SOURCETYPE` and `WRITE_META` |
| 4. Index or send | Indexing handoff, Forwarding pipeline, TCP output handoff, Indexing pipeline, Replication pipeline, Acknowledgement, Pipeline control, Post-index management | A card for each destination (see "Destinations"); then the settings the indexer applies as it writes |
| 5. Search | Search-time processing | The search-time settings in stage order, the order Splunk applies them. Each `REPORT-` and `LOOKUP-` line names its transforms, with their `REGEX`, `FORMAT`, `DELIMS`, `FIELDS`, `filename`, `collection` or `external_cmd` |

- **Each column's head** has its number and name, and four tier badges, UF, HF, IDX and SH.
  - A badge takes the best of the Matrix's cells for the column's stages: green runs there, amber is conditional, grey is not used.
  - Then where it happens: "Where the data is read: a forwarder, or the instance that runs the input", "The first full parsing tier: a Heavy Forwarder, or the indexer", "Index-time transforms, on the parsing tier", "Where its events go, and what is written with them", "Search time, on the search head".
- **A line with no stage** goes in the source type's card:
  - its stanza's Splunk Web lines (`category`, `description` and `pulldown_type`) under "Splunk Web", each with its reference;
  - the lines Splunk ignores, unknown settings and settings that belong in another file, under "Ignored", with the panel's reason.
- **Empty columns say so:** "No index-time transforms in these files act on acme:proxy:csv." and "No search-time settings in these files for acme:proxy:csv: searches see the fields Splunk finds by itself."

### The cards

- **A stanza's card** has:
  - its file's letter, I, P or T, as in the panel;
  - its name;
  - its stanza line's reference;
  - "2 files" when files merge into it.

  Under them, what it is to this source type: "Reads /var/log/acme/fw-*.log", "Names files /var/log/acme/fw-*.log as acme:fw", "Events from host web01, whatever their source type", "Every source type", "A source type rule naming t1", "Defaults for every input on the instance", "Forwarded data arrives here, on the receiving tier".
- **A setting** has its stage chip, `key = value` and its line's reference.
  - The reference is the file's folder and the line, as in "local:4". Its title gives the file and the stanza.
  - A long value runs to three lines; the whole line is in its title.
  - Secrets are masked as in the panel.
  - Under it, "Overrides default:12." when it overrides a lower file's line.
  - A misplaced line is faded, with the panel's reason: "sourcetype is only read in [source::…] and rule stanzas. Here it has no effect."
- **The source type's card,** under Parse, says where its settings come from:
  - "props.conf [acme:fw], merged from 2 files."
  - or "props.conf has no [acme:proxy:json] stanza."
  - For structured data: "Structured data (csv): it is parsed where the file is read, with the settings under Read, and isn’t parsed again here."
  - For a source type that only copies make: "Its events are copies, made after parsing." When it also has parsing settings, it adds "so the parsing settings below don’t apply to them", and the card is faded.
  - When copies of it are made: "Copies made by a transform skip parsing: these settings apply to the events its inputs read."

  Then its parsing settings, or "No parsing settings: Splunk’s defaults apply.", its Splunk Web lines and the ignored lines.
- **A copy's card,** under Read, is the transforms.conf stanza with `CLONE_SOURCETYPE`. It says "Copies events of acme:fw as acme:fw:denied, after they are parsed. Run by default:19". acme:fw is a chip that opens that source type.
- **What names it, when nothing in these files does:** "No input, [source::] stanza or rule in these files names t1."

### The lines

| Line | From | To | Colour |
|---|---|---|---|
| Names it | An input that sets the source type; a `[source::]` or rule stanza that sets it | The source type's card | Green |
| Matches | An input with no source type of its own | The `[source::]` stanza its path matches | Grey |
| | The HEC listener | Each token, whose events it takes | Grey |
| Copy | A copy's card | The source type's card | Violet |
| Index, send, drop | A transform | Its destination | Cyan, blue, red |
| Field, rewrite, metadata | A transform, or a `SEDCMD-` line | Its destination | Amber |

- **The lines are drawn behind the cards,** in one SVG over the grid.
  - Between columns, a line runs from the right of the card, transform or setting that names or does something to the left of what it names or does.
  - Within a column, it runs down from one card to the next.
- **Each destination card moves down** level with the first card that leads to it, so the lines between them run level. The cards keep their order.
- **They are drawn again** when the grid changes size and when the window does.

### Destinations

Under Index or send, in the order they come up. Each cites its lines.

| From | Card |
|---|---|
| An input's `index` | "Index netfw": "Every event [monitor:///var/log/acme/fw-*.log] reads, unless a transform changes it" |
| A HEC token's `index` | "Index proxy": "Every event sent with token acme_cloud_proxy, unless the request names another index the token allows (proxy_summary) or a transform changes it" |
| An input's `_TCP_ROUTING`, `_SYSLOG_ROUTING` or `outputgroup` | "Sent to proxy_indexers" |
| No index anywhere | "The default index": "No input or transform in these files sets the index, so Splunk uses the instance’s default, main unless set elsewhere" |
| Only copies | "The index the events had": "Copies keep the index the events had when they were copied, unless a transform of this source type changes it" |
| `DEST_KEY = queue`, `FORMAT = nullQueue` | "Dropped" |
| `DEST_KEY = queue`, another queue | "Sent to" the queue |
| `DEST_KEY = _MetaData:Index` | "Index" and the index |
| `DEST_KEY = MetaData:Host`, `:Source` or `:Sourcetype` | "Host set to …" and the like |
| `DEST_KEY = _TCP_ROUTING` or `_SYSLOG_ROUTING` | "Sent to primary_indexers and siem_relay" |
| `DEST_KEY = _raw`, or a `SEDCMD-` line | "Text rewritten" |
| `DEST_KEY = _time` | "Timestamp rewritten" |
| `DEST_KEY = _meta`, or `WRITE_META = true` | "Indexed field" and each field `FORMAT` writes |
| `CLONE_SOURCETYPE` | "Copied as acme:fw:denied", with "Follow acme:fw:denied" |
| `INGEST_EVAL` | One for each assignment: "Index set by an expression", "Queue set by an expression", "Host set by an expression", "Text rewritten", "Output set by an expression", "Timestamp set by an expression", or "Indexed field" and the field |

- A transform that runs at search time, a lookup, or a transform with nothing to write has no destination.
- A disabled input has none either.
- A transform's destination says "Events matching [acme_fw_drop_debug]" and the like. The map doesn't work out which transform wins when two set the same thing, and claims no order between `TRANSFORMS-` classes.

### Checked against the component strip

With a component chosen, the map takes each line's verdict from the panel, and the title adds "Faded settings have no effect on a Universal Forwarder."
- **No effect:** the setting is faded, its key struck through. A card all of whose lines have no effect is faded.
- **Own inputs only:** a card all of whose lines take effect only on the component's own inputs has an amber border, and its reason is amber.
- **The component's reason is said once a card,** when all its lines share it:
  - "None of these stages runs on a Universal Forwarder." (or the one stage's own sentence);
  - "On a Search Head, only for data it reads itself.";
  - "Search peers apply the search head’s copy of search-time settings, not their own."
- **A line's own reason stays on the line.** A disabled input's card says it once: "Disabled by local:4, so it doesn’t run."
- **A destination fades** when nothing that leads to it has an effect there, and so does each line into a faded card.
- **The chosen component's badge** is outlined in each column's head.

The example's acme:fw with the Universal Forwarder chosen:
- Read keeps its effect.
- Parse, Transform, Index or send and Search are faded, each with one reason.
- 6 of the 7 destinations fade. Index netfw stays, since the forwarder sets it.
- 7 of the 9 lines fade.

### Links

- **A stage chip** shows its stage in the Matrix, as the panel's chips do (`showStage`).
- **A line's reference** shows its line in the panel, on its file's tab (`showLine`).
- **A source type chip** in a copy's card, and "Follow" on a copy's destination, choose that source type.
- **Every control is a button.** The source type chips are toggle buttons (`aria-pressed`). The summary is a polite live region. Each column is a section named by its heading, and the lines' SVG is hidden from assistive technology: the cards say what the lines show.

### The summary

Under the title, what the files give the source type, column by column. For acme:fw: "1 input · 4 settings where it’s read · 7 parsing settings · 6 index-time transforms · 7 destinations · 6 search-time settings · 1 ignored line". The "copy rules", "settings where it’s read" and "ignored lines" chips show only when there are any.

### Narrow screens

- **When the window is narrower than 1,277 px,** the map scrolls sideways inside its box: its columns need 1,191 px. The page doesn't scroll sideways.
- **At 900 px and below,** the columns stack in processing order, the lines go, and so does "Lines join what names it to it, and each transform to what it does." Each card already says in words what the lines showed.
- **In a narrow card,** a line's reference and a stanza's place go under it, and long names break after `/`, `:`, `,` and `_` first.

## The edit

In Build 215's `index.html`, in `<script id="config-view-v205">`, where the block exports its functions.

- **Line 13981,** the whole line. The Config view also exports what the map reads: a line's verdict and reason, its masked value, its place, and the functions that show a line in the panel and a stage in the Matrix.
```
old: window.configView205={parseConf,confType,placeOf,analyse,loadExample,example,linesByStage,propsStages,inputStages,hecTokenStages,transformsKeys,destStages,searchStages,
new: window.configView205={parseConf,confType,placeOf,analyse,loadExample,example,linesByStage,propsStages,inputStages,hecTokenStages,transformsKeys,destStages,searchStages,effect,whyNot,shown,where,showLine,showStage,
```

## The new blocks

Before `</body>`, after `lanes-and-text-records-v215`, in this order:

1. **`<style id="config-type-map-v217-styles">`,** containing [`docs/mockups/source-type-map-prototype.css`](mockups/source-type-map-prototype.css).
2. **`<script id="config-type-map-v217">`,** containing [`docs/mockups/source-type-map-prototype.js`](mockups/source-type-map-prototype.js).

With the collapsed-and-redraw handoff in, they go before or after its two blocks: the two handoffs share no function and no style.

## How the blocks work

**The edit** exports six of the Config view's own functions on `window.configView205`: `effect`, `whyNot`, `shown`, `where`, `showLine` and `showStage`. So the map gives the panel's verdicts and masks, and leads to the panel's lines and the Matrix's stages the same way.

**The script** (`config-type-map-v217`):
- **It needs those functions,** `state.configView205` and `render`, and stops at once without them.
- **It adds the section** after `#configView205`.
- **It reads the Config view's model** for the chosen source type (`gather`):
  - the props.conf stanzas that act on it, with their winning lines by column;
  - the inputs, the receiving ports, inputs.conf `[default]`;
  - the `[source::]` and rule stanzas that name it, and Build 207's `configSourceMatches207` for which input paths a `[source::]` stanza matches;
  - the copies, from transforms.conf `CLONE_SOURCETYPE` and the props.conf lines that run them.
- **`outcomes`** gives each transform's destinations.
- **`build`** makes the cards and the lines.
- **`draw`** lays out the head, the summary and the columns. It runs after every `render`, wrapping it after the Config view's own wrapper.
  - It does nothing new unless the files, their places, the source type, the component or the source types have changed.
  - It keeps the map's sideways scroll.
- **`lines` draws the joining lines,** after `align` has moved the destination cards. It runs in the frame after `draw`, and again when the grid or the window changes size.
- **It keeps a render cheap:**
  - each line's verdict is worked out once a draw;
  - the sideways scroll is remembered from the map's scroll events, not read back, which would make the browser lay out the whole view on every draw;
  - `align` measures all the cards once, then moves them;
  - while the map is hidden it measures nothing, so resizing the window in another view costs it nothing.
- **It exports** `window.configTypeMap217` with `gather`, `outcomes`, `phaseOf` and `draw`.

**The style block** styles only the map's own classes, all ending in 217. The page gives every `header` 20 px under it and a flex row; `.tmMap217 header{margin:0}` takes the margin away inside the map.

## Build records

After the edit and the blocks:
- **`changeRegister`,** group "Explorer foundations":
  `['Source type map','The Config view follows one source type through Splunk, from the inputs and stanzas that name it to the searches that use it: what parses it, the transforms its settings run and where its events go, with lines from each to what it names or does. Settings are checked against the component strip, and lead to their lines in the panel and their stages in the Matrix.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 215 did in `lanes-and-text-records-v215`, with the next build number.

## Found while testing (not changed)

Nothing new in Build 215. The repo's perf tool misses its budgets here on Build 215 as shipped, as earlier handoffs found; its figures are under "Check before uploading", 2.

## Check before uploading

Run with Build 215 + the edit + the blocks, with Build 215 + the collapsed-and-redraw handoff + them, and with both bases as shipped for comparison.

### 1. The map: 82 checks, all pass

On each of the three builds: Build 215 with the map, and Build 215 with the collapsed-and-redraw handoff and the map, its blocks after that handoff's or (applied with the diff) before them.

| Checks | What they find |
|---|---|
| Where it shows (8) | Hidden in the Config view with no files, and in Flow, Matrix and Builder. Shown once the example is loaded, and again back in the Config view. With no source type chosen: "Follow a source type through Splunk", and chips for All source types (pressed), acme:fw, acme:fw:denied, acme:proxy:csv and acme:proxy:json |
| acme:fw (15) | A chip sets the panel's Source type list too. "How acme:fw is processed"; the five columns in order; the summary, "1 input · 4 settings where it’s read · 7 parsing settings · 6 index-time transforms · 7 destinations · 6 search-time settings · 1 ignored line"; the destinations in order: Index netfw, Dropped, Index netfw_au, Sent to primary_indexers and siem_relay, Text rewritten, Copied as acme:fw:denied, Indexed field site. 9 lines: a match, a name, a drop, an index, a route, two rewrites, a copy and a field, each starting and ending on its cards. Nothing faded with All components. The ignored `MAX_TIMESTAMP_LOOKAHED` with "Did you mean MAX_TIMESTAMP_LOOKAHEAD?"; the input's path; the `[source::]` stanza's "Names files /var/log/acme/fw-*.log as acme:fw"; the receiving port under Parse; the lookup's file; "props.conf [acme:fw], merged from 2 files."; its two Splunk Web lines, which come from the lower file |
| Secrets (4) | The example's secrets are nowhere in the map's HTML, titles included, for acme:fw and acme:proxy:json; masked values are shown |
| Links (7) | A props.conf line's reference flashes its line in the panel; an inputs.conf one switches the panel to its tab first, and a transforms.conf stanza's too; a stage chip flashes its row in the Matrix; the map stays on acme:fw. Every control is a button, and Enter on a reference works |
| The other source types (12) | "Follow acme:fw:denied" chooses it: "0 inputs · 1 copy rule · 0 parsing settings · 0 index-time transforms · 1 destination · 0 search-time settings", one copy line, "The index the events had", "Its events are copies, made after parsing." and no "No parsing settings"; its copy card's chip leads back to acme:fw. acme:proxy:csv: parsed where it is read, and not again; Index proxy and Sent to proxy_indexers; one name line. acme:proxy:json: the listener's line to the token and the token's to the source type; Index proxy, with "(proxy_summary)". The panel's list moves the map |
| The component strip (9) | Universal Forwarder: the title says what fades; 6 of the 7 destinations fade, Index netfw doesn't; 7 of the 9 lines fade; "None of these stages runs on a Universal Forwarder." once a card and on no line; the settings under Read keep their effect; the forwarder's badge is outlined in all five columns. Search Head: "On a Search Head, only for data it reads itself." once. Indexer: "Search peers apply the search head’s copy of search-time settings, not their own." Back to All: nothing faded |
| Drawing and widths (9) | A render with nothing changed keeps the map's elements. At 1,024 px: no page scroll, the map scrolls inside, the lines redrawn on their cards, and a redraw keeps the map's scroll. The map scrolls inside at 1,276 px and not at 1,277. At 390 px: one column, no lines, no page scroll, and no mention of lines. Back at 1,440 px, the lines are drawn again. No page errors |
| Other files (18) | Files with no source type: "No source type to follow". A disabled input is faded with "Disabled by", and sends nothing anywhere. An input with no source type of its own: input to `[source::]` stanza to source type, and its index. A missing transform is flagged. A transform that sets the index; an `INGEST_EVAL`'s index and queue. A `[source::]` stanza no input reads; a rule; `[host::]` and `[default]` stanzas. Every line on its cards. A misplaced `sourcetype` line is faded, with the panel's reason, and names no source type. A source type name with markup is listed and drawn as text; a `[source::]` name with a quote keeps its card and its line. Clearing the files hides the map. No page errors |

### 2. Regression

Against Build 215. Each comparison takes Build 215 twice, to set aside whatever varies from run to run; nothing did.

| Suite | Result |
|---|---|
| View text, every view (Flow, Matrix, Config, Builder, OV, Operate, Diagnose, Failure Lab, Changes, Validate), no files loaded | 10 of 10 the same |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with the example: for each component (All, UF, HF, IDX, SH) and source type choice (All and the four), the panel's HTML, the view's Matrix's HTML, and the page's text with the map left out; and the page's text with no files | 76 of 76 the same |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None |
| The space tool | The same output as Build 215 |
| The connector tool | The same output as Build 215 |
| The perf tool | The same as Build 215 within this container's noise: see below |

The same suites against Build 215 with the collapsed-and-redraw handoff, for the map's blocks after that handoff's and before them: 117 of 117 the same in both, and no page errors.

**What the map costs.** Timed with the example loaded and acme:fw chosen, a layout forced after each render, the median of 30 renders, three runs of each build:

| Render | Build 215 | With the map |
|---|---|---|
| One that redraws the map (the component changes) | 22 to 25 ms | 31 to 37 ms |
| One that leaves the map as it is | 21 to 23 ms | 14 to 23 ms |
| In the Matrix view, the map hidden | 34 to 36 ms | 25 to 36 ms |

- Building the map takes 2 to 3 ms of a redraw. The rest is the browser laying out its cards.
- The lines are drawn in the next frame.

**The perf tool.** `tools/builder-perf-check.js` was run 11 times on each build, in turn. The medians, in ms, Build 215's first:

| Topology | Budget | Redraw | After a move | Unchanged |
|---|---|---|---|---|
| Default | 40 | 39, 37 | 38, 40 | 38, 36 |
| Fan of 5 | 50 | 40, 51 | 53, 53 | 55, 51 |
| Fan of 8 | 80 | 93, 88 | 71, 91 | 84, 83 |
| Reference | 120 | 103, 91 | 107, 130 | 111, 108 |

- With the map, the medians differ by −12 to +23 ms, in both directions, and by less than each build's own times vary from run to run. On Build 215, the reference topology's redraw after a move took 79 to 176 ms.
- Neither build met every budget in any run here (0 of 11 each).
- The path lookups a redraw makes are the same on both: 0, 10, 96 and 16.
- A Builder redraw runs none of the map's script. In the Builder view, working out every element's style again and laying the page out takes 7 to 9 ms on both builds, so the map's style block adds nothing there either.

The Builder suites of earlier handoffs weren't run again. The map's script runs only after the page's `render`, which a Builder redraw doesn't call, and the Builder is checked here through its settled canvas and the repo's three tools.

# Explorer handoff: colour and clarity

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 237.
**Applied:** as Build 238, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, and merged to `main`. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="ui-colour-v238">` (296 lines), after `ui-review-v237`, containing [`docs/mockups/ui-colour-prototype.js`](mockups/ui-colour-prototype.js). It sets no globals. It wraps `render`, `switchView`, `builderOvRender135` and `builderOvShow135`, as earlier blocks do, and changes the colours held by `builderComponents`, `failureComponentColors`, `routeModels` and `parallelAccuracyModels` in place, once, as it loads.
- `<style id="ui-colour-v238-styles">` (92 lines), after `ui-review-v237-styles`, containing [`docs/mockups/ui-colour-prototype.css`](mockups/ui-colour-prototype.css).

**11 in-place edits,** under "The edits". Each old string occurs exactly once in Build 237, and none changes the number of lines.

The edits, the block and the styles are also in [`docs/mockups/ui-colour.diff`](mockups/ui-colour.diff), a unified diff against Build 237's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Check colour scheme for each page. Check clarity", which produced a list of 13 items, then "All. Merge": build every item, and merge.

**How the list was made:** every page of Build 237 swept at 1440 and 390 px (the 7 views, OV's 28 views in both of its themes, Operate's 23 pages: 86 page states), recording the colours on each first screen, each status word's colour, the headings, first paragraphs, abbreviations, text sizes and capitals; the component colours measured pair by pair in OKLab, for normal vision and with colour blindness simulated; each finding looked at on screen and traced to its line.

**Built twice.** Build 238 was built and checked in full once, but the session's container was replaced before it was committed, and its scratch work went with it: the block's source, its checks, and the copies of the earlier builds' check suites that each build's final run uses. It was rebuilt from the session's record of the design and checked again with what could be rebuilt, under "Check before uploading". The rebuild found six things the first build got wrong; they are fixed, under "Found while rebuilding, and fixed".

**Sources:**
- WCAG 2.2: [Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), [Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html), [Abbreviations](https://www.w3.org/WAI/WCAG22/Understanding/abbreviations.html) and [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- MDN: [the abbr element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr), [the dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog), [the beforeprint event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeprint_event), [the CSS content property's alternative text](https://developer.mozilla.org/en-US/docs/Web/CSS/content#alternative_text) and [scroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior).
- Björn Ottosson, [A perceptual color space for image processing](https://bottosson.github.io/posts/oklab/) (OKLab, for the colour distances).

The storyboard is [`docs/mockups/ui-colour-mockup.html`](mockups/ui-colour-mockup.html): each scene on the new page with its items marked, and Build 237's for comparison.

## The 13 items

### Colour

1. **OV's dark theme is finished.** Its rule for the workspace's ground named a class, `.ovWorkspace135.theme-dark`, but the workspace has that name as its id, so the rule never applied: the summary strip kept a light ground under light text (1.34:1, its numbers 1.03:1) and each dark sheet sat in a pale frame. The rule now names the id (`ov-dark-ground`), and the ground is `#081721`, as written. Four more places the dark theme never reached get dark values in the styles: the stop red, `--ovStop`, which the views read but nothing set, so every view drew the light theme's `#c84b4b` (3.69:1 on the dark sheet; now `#ff8a80`); the darker red an earlier build gave the activity-page views' "not" states, such as CV-6's "Not covered", for the light theme only (2.06:1); OV-1's thread numbers, white on a light blue (1.56:1); and OV-6c's and SV-10c's notes, whose text Build 231 darkened for the light theme (`#5b4a24`) in both themes (1.71 to 1.75:1 on the dark notes), which take the sheet's own ink again in the dark theme.
2. **OV opens dark,** as every other view does, unless the reader has chosen a theme, which Build 136 keeps in `localStorage`; before, it followed the computer's light or dark setting. Print and Save as PDF draw OV in its light theme whichever is on screen: the block swaps the workspace's theme class on `beforeprint` and back on `afterprint`, as the print rules already draw the workspace white. The architecture pack has its own print theme setting and is unchanged.
3. **A missing field is red.** Detection lineage's colour function knew `blind` and `degraded`, and a field's `missing` fell through to green, the colour of available (`lineage-colour`). The same function colours the selected detection's required fields, which follow. Each field button now carries its state (`lineage-state`), and its word a sign: ✓ available, ! degraded, ✕ missing.
4. **The Indexer and Amazon S3 have one colour each, everywhere.** The component cards drew the Indexer amber and Amazon S3 orange; the Failure Lab's bands and the route boxes drew them the other way round. Every place now takes its colour from the tier (item 5), where both are in indexing, storage and search.
5. **A component's colour shows its tier.** Three hues that pass every pair on the app's ground (`#0c1722`) in OKLab: blue `#338ced` for collection and management, orange `#e76624` for processing, aqua `#00a888` for indexing, storage and search. The closest pair is ΔE ×100 19.4 for normal vision and 12.8 with red–green colour blindness simulated (protanopia 13.8, deuteranopia 12.8), against floors of 15 and 8; each is 5.27:1 or more on the ground. All components is neutral, `#90a2b5`. Before, twelve card colours had two exact duplicates (All components and HEC Delivery; Splunk DB Connect and Ingest Processor) and 28 of their 66 pairs under the floors. Each component is still named wherever it is coloured. The block sets the tier colour in every table that colours components: the 47 types of `builderComponents` (the Builder's canvas cards, its palette and its add-next menu), `failureComponentColors` (the Failure Lab's bands, its identity scenarios' bands included, but Time service, which stays neutral), the boxes of `routeModels` and the tiers of `parallelAccuracyModels`; then it sets the cards and the Builder's palette, and draws Flow, the route diagram, the Failure Lab and any Builder canvas already drawn again.
   - Collection and management: `ds`, `sqlDatabase`, `windowsEvent`, `fileSource`, `scriptSource`, `apiSource`, `apiCollector`, `awsLambda`, `azureFunction`, `hecEndpoint`, `syslogSource`, `hecClient`, `syslog`, `uf`, `authUser`, `authProviderCloud`, `authProviderOnPrem`, `streamServer`, `streamDefinition`, `licenseManager`, `monitoringConsole`, `serverClass`, `deploymentApp`, `loadBalancer`.
   - Processing: `dbConnect`, `hf`, `ip`, `edgeProcessor`.
   - Indexing, storage and search: `idx`, `s3`, `search`, `shcCluster`, `shcMember`, `shcDeployer`, `indexerCluster`, `indexerClusterManager`, `s3Dataset`, `s3FederatedConnection`, `s3DataCatalog`, `cloudSearchTier`, `cloudIndexer148`, `cloudEsSearchHead`, `azureDataset`, `azureConnection`, `soarCloud`, `soarOnPrem`, `soarPlaybook`.
   - A card, band or route box, or a type a later build adds, takes its tier from its name (and a type's type), by these words: processing for Heavy Forwarder, DB Connect, Ingest Processor, Edge Processor, processing, parsing or transform; indexing, storage and search for indexer, index, Amazon S3, S3, SQS, catalog, search, federated, storage, bucket, Splunk Cloud, SOAR or destination; collection and management otherwise.
6. **Flow's stage cards** no longer colour pipelines with the components' colours. The pipeline tag is neutral words in sentence case; the card's top line and number take the tier of the component chosen above, or the neutral with All components (a token, `--stage238`, set after each `render`).
7. **One status scale.** The Failure Lab's severities: low neutral with –, medium amber with !, high orange (`#f49b66`) with ▲, critical red (`#ff6b6b`) with ✕; high and critical were one red, and low was the green used for good (`risk-colours`, `risk-low`; the signs from the styles, everywhere `.risk` is used). In OV, "Not set" is neutral with –, "Not deployed" a warning with ! and "Deployed" or "In place" good with ✓, on every view that shows them: the block marks the words by their text after each render and show, as the views draw them with a dozen different classes, and as a view redraws part of itself. On CV-7 and SvcV-5 "Not deployed" was red, on SvcV-1 brown and on SvcV-3b plain; "Not set" was brown on ten views and plain on the rest. A word SvcV-2 flags as a stop stays critical, with ✕: there "Not set" is a security attribute with no value. Column headings and words inside diagrams are left as drawn. The colours are 5.1:1 or more on OV’s light sheet and 8.3:1 or more on its dark one.
8. **Tokens for the colours Build 238 uses:** `--tier-collect`, `--tier-process`, `--tier-store`, `--tier-none`, `--status-good`, `--status-warning`, `--status-serious`, `--status-critical` and `--status-neutral` on `:root`, and OV's status colours for each theme on `#ovWorkspace135`. The block's `TIER238` holds the same tier values for the colours it writes into the app's tables, which need values, not variables (the exports read them).

### Clarity

9. **Operate's pages are headed with their menu entry's name.** The heading was the subject being modelled, and 17 of the 23 shared no word with the entry chosen. Each page's heading is now its entry's name, the subject is the line under it, and the small label above names the entry's group (Fleet, Simulate, Trace, Boundaries, Outputs): "Fleet / Capacity model / Indexer durability boundary". The block does this straight after each render of a page, before it is drawn (a page like Runbook heads itself with the failure chosen, and redraws), and keeps what the reader is looking at in place when the heading block is above it. Scenario library and Alert and dashboard pack carry their heading in their own templates (`library-head`, `pack-head`), under "Found while rebuilding, and fixed".
10. **A glossary.** A Glossary button in the header opens a dialog of 96 abbreviations in five groups (Splunk; security and identity; operations; data and protocols; architecture views, OV's 28 views among them), each with what it stands for and, where it helps, a line on what it is. Find narrows the list; Escape or Close closes it, and so does a click outside it, and focus goes back to the button. The button sits in the header itself, so it stays on phones, where the header's figures are hidden; in the Builder and OV, whose header is one row with the view tabs laid over it, at that row's right end, the tabs stopping short of it; and in OV on a phone, which hides the header, in OV's Actions menu. On the view or page shown, the first use of each abbreviation is marked with `<abbr title>`, and a click on one outside a control opens the glossary at it. Left alone: text in diagrams, code, form fields and controls; status messages, which are read out as they change; the Config view's type map; text in a flex or grid box, where a mark would split the line; a term straight after a number, where it is the unit of a figure (3,000 EPS); and the Builder's canvas. Of the 217 capitalised words the sweep found, those left out of the list are IDs (SI-1, RF-01, AR-001), words in capitals (TRUNCATE, WARNING), units (KB, MB, GB), one that means two things here (IP: Internet Protocol and Ingest Processor) and ones used once.
11. **Each view has a heading of its own.** Flow, Matrix, Config, Diagnose and the Failure Lab now start with an `h2` naming the view, hidden from sight as the open tab shows it, and their selection's heading (the path, the symptom or the failure) is announced at level 3 (`aria-level`). Config had no heading at all.
12. **Capitals for one level of section label only, and fewer sizes.** Tags and value labels are in sentence case: Flow's pipeline tags and component cards' tier labels, Diagnose's fact, rank and confidence labels and summary labels, Multi-DS management's metric, node, table, inventory, graph and wave labels, and Authentication boundaries' metric, flow, state, control, card and fact labels. Section labels, the Operate groups and the pages' small labels keep their capitals. Sizes between steps (11.5, 12.5, 13.5 and 14.5 px) move to the nearest whole step: Flow now uses 5 sizes (11, 12, 13, 15, 16), where it used 7, and Diagnose 6 (with its 20 px heading), where it used 8. The Builder's canvas, which zooms, keeps its sizes.
13. **Short first paragraphs.** Alert and dashboard pack's (55 words) and Scenario library's (43) are now one sentence (25 and 18 words), and their second sentence moves under the heading block's line, as a paragraph of its own (`pack-head`, `pack-aside`, `library-head`, `library-aside`). Diagnose's caution about rankings is a note under the symptom's summary (`diagnose-lead`), and Changes' first paragraph is one sentence of 21 words in place of two (`changes-lead`).

### Not covered, and corrected

- **The review's list, item 7, said SvcV-1 frames services that aren't deployed with the brown of its dotted links.** On inspection, those dotted links are SvcV-1's gap flows, to or from a service that isn't deployed: the shared brown is one meaning, and it stays.
- Other OV states (Planned, Partial, Gap, Waiting on) keep their colours; item 7 unifies the three the review named.
- The Builder's canvas keeps its text sizes; it zooms.
- With blue–yellow colour blindness (tritanopia, about 1 person in 10,000), collection blue and storage aqua are close (ΔE ×100 3.9). No three hues pass every pair for all three kinds at these lightnesses on this ground; every component is named wherever it is coloured, so the colour is never the only way to tell.

### Found while rebuilding, and fixed

1. **On a phone, choosing a scenario pack left the pack 114 px down the screen** (Build 237: 12 px). The page scrolls smoothly (`scroll-behavior:smooth`), to a place worked out when the scroll is asked for, and the block's heading and moved sentence landed after that, above the pack. The two pages whose sentence moves now carry their heading and that sentence in their own templates, so they are drawn final; the pack lands at 12 px, as before, with the focus on its button.
2. **Glossary marks inside a flex box split a line.** In five OV views (AV-1, AV-2, OV-6c, SV-10a, SV-10c) "Security telemetry + PII" became two items, as did a line of OV-5a's key. Marks now leave text in flex and grid boxes alone; the regression found nothing else.
3. **The Glossary button was in the header's figures, which phones hide.** It is in the header itself. There, in the Builder and OV, the view tabs (laid over the header's row from 761 px) covered half of it: it takes the row's right end, and the tabs stop short of it. OV on a phone hides the header: there it is in OV's Actions menu.
4. **Units in figures were marked** (49.44 GB, 3,000 EPS). Units such as GB aren't in the glossary, and a term straight after a number isn't marked.
5. **Status messages were marked,** splitting the text of a message as it is read out. They are left alone.
6. **Two of the new styles' font declarations were invalid** (`inherit` inside the `font` shorthand), so the button and Close took the browser's font. They are written out.

## The edits

Each on Build 237's line, in the order of the page.

1. **Line 76, in the Failure Lab’s severities.** Item 7, `risk-colours`. High and critical were one red. High is orange and critical red.
```
old: .risk.high,.risk.critical{color:#ff9b9b}
new: .risk.high{color:#f49b66}.risk.critical{color:#ff6b6b}
```
2. **Line 76, in the Failure Lab’s severities.** Item 7, `risk-low`. Low was the green used for good. It is neutral.
```
old: .risk.low{color:var(--green)}
new: .risk.low{color:var(--muted)}
```
3. **Line 1,254, in Detection lineage’s colour function.** Item 3, `lineage-colour`. A missing field fell through to green, the colour of available. It is red, as a blind one is.
```
old: color=s=>s==='blind'?'var(--red)':s==='degraded'?'var(--amber)':'var(--green)'
new: color=s=>s==='blind'||s==='missing'?'var(--red)':s==='degraded'?'var(--amber)':'var(--green)'
```
4. **Line 1,254, in Detection lineage’s field buttons.** Item 3, `lineage-state`. Each button carries its state, for the sign the styles put before its word.
```
old: <button class="lineageField" style="--status:${color(s)}" data-lineage-field="${k}"
new: <button class="lineageField" style="--status:${color(s)}" data-state238="${s}" data-lineage-field="${k}"
```
5. **Line 1,461, in Diagnose’s heading block.** Item 13, `diagnose-lead`. The caution about rankings ran on in the symptom’s summary. It is a note of its own under it.
```
old: <p>${symptom.summary} Rankings are triage guidance: confirm the evidence before making a change.</p>
new: <p>${symptom.summary}</p><p class="note238">Rankings are triage guidance: confirm the evidence before making a change.</p>
```
6. **Line 1,814, in Changes’ heading block.** Item 13, `changes-lead`. Two sentences become one, of 21 words.
```
old: <p>This is the authoritative feature checklist for the standalone explorer. Completed work is ticked; proposed features remain unticked until included and validated in a build.</p>
new: <p>Every change to the Explorer, ticked once it is in a build and checked, and unticked while it is only proposed.</p>
```
7. **Line 5,724, in OV’s dark theme.** Item 1, `ov-dark-ground`. The rule for the workspace’s ground named a class the workspace doesn’t have (`ovWorkspace135` is its id), so it never applied. It names the id.
```
old: .ovWorkspace135.theme-dark{background:#081721;color:#edf6fa}
new: #ovWorkspace135.theme-dark{background:#081721;color:#edf6fa}
```
8. **Line 20,502, in Scenario library’s heading block.** Items 9 and 13, `library-head`. Headed as the block heads Operate’s pages, its group above and the subject on the line below, but in the page’s own template, so it is drawn final (under “Found while rebuilding, and fixed”, 1). The first paragraph is one sentence, of 18 words.
```
old: <small>Scenario library</small><h2>Failure, recovery and data-quality scenarios, in packs</h2><p>Run a pack to see how each scenario ends on this topology, or open one in its simulator. Save the scenario you’re looking at from the Failure Lab, the Recovery simulation or the Data-quality simulation, and download a pack to use it elsewhere.</p>
new: <small data-label238="Scenario library">Simulate</small><h2 data-subject238="Failure, recovery and data-quality scenarios, in packs">Scenario library</h2><p class="opsSubject238">Failure, recovery and data-quality scenarios, in packs</p><p>Run a pack to see how each scenario ends on this topology, or open one in its simulator.</p>
```
9. **Line 20,503, after Scenario library’s controls.** Item 13, `library-aside`. The second sentence, under the heading block’s line, as a paragraph of its own.
```
old: aria-label="Scenario pack file to load" hidden></div></div>`+
new: aria-label="Scenario pack file to load" hidden></div></div><p class="opsAside238">Save the scenario you’re looking at from the Failure Lab, the Recovery simulation or the Data-quality simulation, and download a pack to use it elsewhere.</p>`+
```
10. **Line 20,929, in Alert and dashboard pack’s heading block.** Items 9 and 13, `pack-head`. As `library-head`: headed in its own template, and the first paragraph one sentence, of 25 words.
```
old: <small>Alert and dashboard pack</small><h2>Alerts and a dashboard that watch this topology</h2><p>A Splunk app of scheduled searches for stale deployment clients, failed app downloads and installs, drift and queue pressure, written for the topology in the Builder, with a dashboard that shows what each alert finds. The searches read what Splunk records: the Deployment Server’s _dsphonehome, _dsclient and _dsappevent indexes, and metrics.log and splunkd.log in _internal.</p>
new: <small data-label238="Alert and dashboard pack">Outputs</small><h2 data-subject238="Alerts and a dashboard that watch this topology">Alert and dashboard pack</h2><p class="opsSubject238">Alerts and a dashboard that watch this topology</p><p>A Splunk app of alerts for stale clients, failed app installs, drift and queue pressure on this topology, with a dashboard of what they find.</p>
```
11. **Line 20,930, after the pack’s Download button.** Item 13, `pack-aside`. The second sentence, under the heading block’s line, as a paragraph of its own.
```
old: Download the app (.tar.gz)</button></div></div>
new: Download the app (.tar.gz)</button></div></div><p class="opsAside238">The searches read what Splunk records: the Deployment Server’s _dsphonehome, _dsclient and _dsappevent indexes, and metrics.log and splunkd.log in _internal.</p>
```

## The new block

The block's files, in order, each a part of one function scope:
- `10-common.js`: helpers, the tier table (`TIER238`, the types in each tier) and the rule that reads a tier from a name.
- `20-ov.js`: items 2 and 7. OV's default theme, its light theme for printing, and its status words marked after each render and show (and as a view redraws part of itself).
- `30-colour.js`: items 4, 5 and 6. The tier colours set in the app's tables and on the page, and the stage cards' tier after each `render`.
- `40-headings.js`: items 9 and 11. Operate's headings and subject lines straight after each render of a page, and the views' own headings on each `switchView`.
- `50-glossary.js`: item 10. The glossary, the header's button, and the marks on the view or page shown: all of it when it is shown, and then what is drawn again.

## Build records

A `<script id="ui-colour-records-v238">` before `</body>`, as Build 237's: the change register's "Explorer foundations" gets

```
['Colour and clarity','OV’s dark theme is finished and OV opens dark; a component’s colour shows its tier, collection blue, processing orange, indexing, storage and search aqua, the same on the cards, the Builder, the Failure Lab and the route boxes; each status word has one colour and a sign. Operate’s pages are headed with their menu entry’s name, a glossary lists the abbreviations and marks their first uses, each view has a heading of its own, tags are in sentence case on fewer text sizes, and four first paragraphs are one sentence.',true]
```

and the build number, date, title and the Builder's build note read Build 238, 27 Nov 2026.

## Check before uploading

### 1. The checks: 26. All pass on the tested page; on Build 237, 2 pass and 19 fail

`acc38.js`, in the scratch work, checks each item as a person meets it, at 1440 px and, for the items that reach a phone, at 390 px:

- 1 OV, dark theme: the workspace is dark, and the summary strip, viewpoints and tabs are 4.5:1 or more.
- 1 OV, dark theme: status words, stop marks and OV-1's thread numbers are 4.5:1 or more, on nine views.
- 1 OV-6c's and SV-10c's notes are 4.5:1 or more against their boxes, in both themes.
- 2 OV opens dark on a computer set to light, keeps a stored light choice, and prints light.
- 3 Every lineage field is coloured and signed by its state.
- 4 The Indexer and Amazon S3 share one colour on the cards, the Failure Lab's bands and the route boxes.
- 5 Cards take their tier's colour, All components neutral; the palette and every Builder type use only the tier colours.
- 5 The Failure Lab's bands use the tier colours.
- 6 Stage cards take the chosen component's tier (neutral for All components), and the pipeline tag is neutral, in sentence case.
- 7 The Failure Lab: high orange with ▲, critical red with ✕, low neutral with –.
- 7 OV: "Not set", "Not deployed" and "Deployed" are each one colour with one sign on seven views; a stop stays critical.
- 8 The tier and status tokens are on `:root`.
- 9 All 23 Operate pages are headed with their menu entry's name, under their group's name, with the subject on the line below.
- 9 Capacity model reads "Fleet / Capacity model / Indexer durability boundary".
- 10 Flow marks the first use of each abbreviation once, with what it stands for, and none inside controls, code or diagrams.
- 10 The Glossary button opens a dialog of 90 or more abbreviations in five groups; Find narrows it; Escape closes it from Find and returns to the button.
- 10 A click on a mark opens the glossary at its term, in view; a click on the backdrop closes it.
- 10 Terms straight after a number (the units of figures) and status messages are not marked, on Capacity model, Performance guardrails and Health overlay.
- 10 On a phone the Glossary button is in the header, 24 px or more, and the dialog fits the screen.
- 10 On a phone OV hides the header: its Actions menu has Glossary, which opens the glossary.
- 10 In the Builder and OV, where the header is one row under the view tabs, the Glossary button is whole and on top.
- 11 Flow, Matrix, Config, Diagnose and the Failure Lab each start with a hidden h2 naming the view, and what is selected in them is at level 3.
- 12 Tags are in sentence case, and Flow and Diagnose use six text sizes or fewer in their own panels, all whole pixels.
- 13 The first paragraphs of Alert and dashboard pack, Scenario library, Diagnose and Changes are one sentence of 26 words or fewer; the rest sits under the heading block's line.
- 13 On a phone, choosing a pack still takes you to it (its top within 16 px of the screen's), with the focus kept on its button.
- No page errors.

On Build 237 the phone pack check and "no page errors" pass; the rest fail, or can't run where what they look for isn't there (19 results).

### 2. What the first build's final run had, and this one doesn't

Each build's final run also re-runs every earlier build's checks (Builds 6 to 237), sweeps every page for clipped, overlapping, faint and tiny text, clicks every control, and times the page over 21 visits. Those suites were copies in the scratch work, not in the repository, and were lost with the container; they were not rebuilt. In their place this build was checked with its own 26 checks, a regression against Build 237 at two widths, the repository's four tools, and the colour figures measured again. What the first build's final run had found on its page is fixed (above), but it was not run on this one.

### 3. Regression against Build 237

`reg38.js` opens each page state on Build 237 and on the new page, both in OV's light theme: the 7 views, the 23 Operate pages and the 28 OV views, 58 states. It compares the text a person sees (case-folded, as item 12 changes only capitals) and the visible controls, with what Build 238 means to change undone on the new page first: Operate's headings, subject lines and moved sentences, the four first paragraphs, the views' hidden headings and the Glossary button.

| Window | States | The same | Different |
|---|---|---|---|
| 1440 × 900 | 58 | 56 | 2 |
| 390 × 844 | 58 | 56 | 2 |

The two at each width are Evidence pack and Architecture report, which print the time they were made. Page errors: none on either page.

### 4. The repository's checks

Each run on Build 237 and on the new page, one at a time:

| Tool | Build 237 | With the edits |
|---|---|---|
| `tools/offline-check.js`: every view and OV tab drawn, and every export made, with no network | 22 passed, 0 failed | 22 passed, 0 failed |
| `tools/builder-connector-check.js`: the Builder’s links as cards are added and dragged | 66 of 66 link states OK | the same output |
| `tools/builder-space-check.js`: the canvas’s share of the screen at 7 window sizes | 7 of 7 meet their targets | the same output |

### 5. Time

The Builder's redraw tool (`tools/builder-perf-check.js`), five times on each page in turn, alone in the browser: medians, and each one's spread.

| Topology | Build 237 | With the edits | Budget |
|---|---|---|---|
| default | 23 ms (20 to 29); 23 ms moved (22 to 25) | 23 ms (20 to 28); 25 ms moved (22 to 31) | 40 ms |
| fan5 | 29 ms (27 to 36); 30 ms moved (27 to 38) | 32 ms (28 to 39); 34 ms moved (31 to 40) | 50 ms |
| fan8 | 50 ms (48 to 59); 54 ms moved (49 to 66) | 51 ms (47 to 58); 53 ms moved (49 to 67) | 80 ms |
| reference | 53 ms (50 to 69); 71 ms moved (62 to 80) | 54 ms (53 to 60); 63 ms moved (60 to 72) | 120 ms |

Every median is within its budget on both pages.
Each median with the edits is within Build 237’s spread; and each of Build 237’s within the edits’ spread, but for fan5 after a card moves (30 ms, against 31 to 40). Build 238 changes the Builder only by the colours it sets once, as the page loads (item 5).

### 6. The build

`index.html` as committed, Build 238, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text, change register and Changes view name the build, as do the OV header's label and OV-1's title block; nothing on the Builder page names Build 237; no page errors: 11 of 11 pass.
- The new checks pass on Build 238 as on the tested page: 26 of 26.

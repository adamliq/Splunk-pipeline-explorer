# Explorer handoff: fixes and improvements from a review of every page

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 230.
**Applied:** as Build 231, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="explorer-review-v231">` (159 lines), after `builder-ports-v230`, containing [`docs/mockups/explorer-review-prototype.js`](mockups/explorer-review-prototype.js). It sets `window.explorerContext231` and `window.explorerReview231`.
- `<style id="explorer-review-v231-styles">` (363 lines), after `builder-ports-v230-styles`. It holds 91 lines of rules written for the items below, then the 11 px text floor of item 22: 264 rules covering 421 selectors, made and checked by [`docs/mockups/explorer-review-text-floor.js`](mockups/explorer-review-text-floor.js).

**Fourteen in-place edits,** under "The edits":
- TM-1's date;
- the Builder's title on a phone;
- the stage dialog's id, in three places;
- eight wording changes;
- a fix to the OV pages' count words.

Each old string occurs exactly once in Build 230, and none changes the number of lines.

The edits, the block and the styles are also in [`docs/mockups/explorer-review.diff`](mockups/explorer-review.diff), a unified diff against Build 230's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Check all pages for improvements and fixes", then "All": build every item of the review's list of 27.

**How the review was done:**
- Every page was swept automatically: the 7 single views, the 28 OV pages and the 20 Operate pages, at 1440, 1024 and 390 px wide. The sweep counted errors, text cut off or overlapping, controls without a name, ids used more than once, contrast and text size.
- Every control was used once: 2,008 of them.
- A leak check went round all the pages six times.
- Then each page was looked at by eye, and each finding traced to its code.

**Sources:**
- Splunk Connect for Syslog (SC4S), [Sources](https://splunk.github.io/splunk-connect-for-syslog/main/sources/), "Unique listening ports":
  - `SC4S_LISTEN_{VENDOR}_{PRODUCT}_{PROTOCOL}_PORT={PORT VALUE 1},{PORT VALUE 2}...`
  - "use a comma-separated list with no spaces (e.g. `SC4S_LISTEN_CISCO_ASA_UDP_PORT=5005,6005`)".
- SC4S, [Configuration](https://splunk.github.io/splunk-connect-for-syslog/main/configuration/):
  - `SC4S_SOURCE_TLS_ENABLE`: "Enable TLS globally. Be sure to configure the certificate as shown in the following section." That section saves the key and certificate as `/opt/sc4s/tls/server.key` and `/opt/sc4s/tls/server.pem`, and says: "Ensure the entry `SC4S_SOURCE_TLS_ENABLE=yes` exists in `/opt/sc4s/env_file`."
  - `SC4S_LISTEN_DEFAULT_TLS_PORT`, "Enable a TLS listener on port 6514."
- SC4S's [`entrypoint.sh`](https://github.com/splunk/splunk-connect-for-syslog/blob/main/package/sbin/entrypoint.sh) sets the default listeners when they are unset:
  - `SC4S_LISTEN_DEFAULT_TCP_PORT` and `SC4S_LISTEN_DEFAULT_UDP_PORT`, 514;
  - `SC4S_LISTEN_DEFAULT_TLS_PORT`, 6514.
  The configuration page documents only the TLS one.
- Docker, [`docker container run`](https://docs.docker.com/reference/cli/docker/container/run/), on `--env-file`: "Lines beginning with `#` are treated as line comments and are ignored, whereas a `#` appearing anywhere else in a line is treated as part of the variable value."
- W3C, WCAG 2.2:
  - [Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): "The size of the target for pointer inputs is at least 24 by 24 CSS pixels", with exceptions.
  - [Understanding 4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html): for all user interface components, "the name and role can be programmatically determined".
  - [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): text has "a contrast ratio of at least 4.5:1", with exceptions for large text.

**Mockup (the target):** [`docs/mockups/explorer-review-mockup.html`](mockups/explorer-review-mockup.html).
- 8 scenes have the edits, the block and the styles applied to Build 230.
- 3 "Today" scenes are Build 230.
- The screenshots are `docs/mockups/compare/explorer-review-*.png`.

## The 27 items

Each item says what Build 230 did, what Build 231 does and where the change is. Build 231's checks, in section 1 below, cover every item. "Block, part N" is the part of the new block whose comment names item N.

### Fixes

1. **AV-2's search icon.**
   - **Build 230:** the magnifier in AV-2's search box filled the page's width. The OV pages size every `svg` to their width (`.ov1Page132 svg{width:100%}`), the icon included.
   - **Build 231:** it is 14 px.
   - **Where:** styles.
2. **Authentication boundary cards.** These are on Operate › Authentication boundaries.
   - **Build 230:** each card's small labels ran into their values on one line: "InteractiveRequired", "Search and cloudSplunk Cloud search tier".
   - **Build 231:** each label sits on its own line, above its value, in capitals: "INTERACTIVE", then "Required".
   - **Where:** styles.
3. **The RASCI matrix's header,** on Operate › Responsibility boundaries.
   - **Build 230:** the header row covered the matrix's first row. Every table header in the page sticks 75 px down (`th{position:sticky;top:75px}`), and this table scrolls in a box of its own.
   - **Build 231:** its header sticks at the top of its own box.
   - **Where:** styles.
4. **SvcV-6's flow table.**
   - **Build 230:** at 1440 px the table was 1,050 px wide, in a 928 px column beside the 300 px side panel. Its last columns were out of sight in a sideways scroll, 124 px of it.
   - **Build 231:** the table fits its column and its cells wrap: 0 px to scroll. Below 1,180 px the side panel moves under the table.
   - **Where:** styles.
5. **The Failure Lab's "component handoff" label.**
   - **Build 230:** the label sat across the top of the next stage.
   - **Build 231:** it runs up the gap between the two stages, above the arrow.
   - **Where:** styles.
6. **The Matrix's header row.**
   - **Build 230:** the header scrolled away with the page. The table sits in a box that scrolls sideways, so its header could stick only inside that box, which never scrolls up and down.
   - **Build 231:** the table scrolls in that box both ways. The box is one window high under the toolbar, and the header row stays at its top.
     - The box's height follows the toolbar's, through `--stick231` and a `ResizeObserver`.
     - The table is wider than the page below about 1,400 px, so the box scrolls sideways there too, and the page itself never does.
     - A first version let the table scroll with the page, with the header under the toolbar. That needs a box that doesn't clip, and at 1,180 px it pushed the whole page 244 px sideways. The storyboard's screenshots showed it, and the checks now look at 1,180 px too.
   - **Where:** block, part 6; styles.
7. **TM-1's date.**
   - **Build 230:** TM-1's build line said "4 Oct 2026", a fixed date, on screen and in the architecture pack.
   - **Build 231:** it gives the pack's prepared date, as every other OV page does.
   - **Where:** edit 10.
8. **Tables on a phone.**
   - **Build 230:** at 390 px, Multi-DS management and Capacity model had tables wider than the window inside boxes that hide overflow. Their right-hand columns couldn't be reached. Content cut off on the two pages: 92 elements.
   - **Build 231:** after each Operate page is drawn, a table wider than its space, and not already in a scroll box, goes in a box of its own that scrolls sideways, with the fade of item 18. Cut off on the two pages: 0.
     - The box holds the table's header at its top. The page's own sticky headers sit 75 px down (`th{position:sticky;top:75px}`), and inside a box that would push the header over the rows.
     - A table that fits stays as it was. A first version boxed every table, and the sweep found the header over the rows on Multi-DS management and Capacity model at 1440 px.
   - **Where:** block, part 8; styles.
9. **Form fields without names.**
   - **Build 230:** 15 fields on 9 Operate pages had a label beside them that wasn't tied to them. The Builder's Find box had only a placeholder.
   - **Build 231:**
     - Each Operate label without `for` is tied to the field that follows it. A field without an id gets `opsField231-N`.
     - The Find box is named "Find components on the canvas".
   - **Where:** block, part 9.
10. **Diagram buttons without names.**
    - **Build 230:** the clickable parts of OV-6c, SV-10c, SV-1 and SV-2 (`g` elements with `role="button"` or `tabindex`) had no name.
    - **Build 231:** each is named by its own text. A link drawn without words, on SV-1 and SV-2, takes its name from its row in the page's table, which carries the same key.
    - **Where:** block, part 10.
11. **Ids used more than once, and the stage dialog.**
    - **Build 230:** the OV pages' templates repeat 12 ids (`detail`, `legend`, `findings`, `foot`, `tb` and others). Once they're drawn, the sweep finds them on every page it looks at: 576 at 1440 px, 12 on each of 48 pages.
    - **What a person met:** the stage dialog was also `id="detail"`. Once any OV page had been drawn, `$('#detail')` found that page's `#detail` first. Clicking a stage in Flow then threw `$(...).showModal is not a function`, and nothing opened. 28 of the 28 OV pages did this.
    - **Build 231:**
      - The dialog is `id="stageDetail"`, so the main page no longer looks up an id the OV pages use. After any of the 28 OV pages, a stage's click opens its detail. Stage clicks that open nothing: none.
      - The OV pages keep their own repeated ids. Their code reads them within its own page, and the sweep of every control finds no error from them. No id of the main page is also an OV page's.
      - A first version also took the hidden OV pages out of the document, so each id would occur once. The sweep of every control found that this broke "Print / PDF", whose print handlers fill in every page, and AV-2's links to other pages. That part was dropped.
    - **Where:** edits 1, 8 and 9; block, part 11 (a note only).
12. **"Unsaved changes" on a page just opened.**
    - **Build 230:** a fresh Builder said "Unsaved changes" and kept a recovery draft. Later blocks add default details to links after the first fingerprint is taken.
    - **Build 231:** until the person first acts, each redraw takes what was loaded as saved. Acting means a pointer or a key, or loading a file. Otherwise it stops 1.5 s after the page loads. Adding a component afterwards makes it unsaved, as before.
    - **Where:** block, part 12.
13. **Two register items named "Builder review fixes".**
    - **Build 231:** they are "Builder review fixes: toolbar and header" and "Builder review fixes: labels, collapsed hosts and Splunk Cloud".
    - **Where:** block, part 13.

### Improvements

14. **The shared section folds away.**
    - **Build 230:** on Flow, Matrix, Diagnose, Failure Lab, Changes and Operate, the component strip, the parallel panel, the context and the route diagram came first. On Diagnose, its own content started at 1,153 px.
    - **Build 231:**
      - A bar under the path chips has "Hide components and model" or "Show components and model".
      - The section starts folded on Diagnose, Failure Lab, Changes and Operate, and open on Flow and Matrix.
      - Each view keeps the choice in `localStorage`, under `splunkPipelineExplorer.review231.ctx.<view>`.
      - While it is folded, a line says what's selected: "Showing All components on Complete model."
      - Diagnose's content now starts at 361 px.
    - **Where:** block, part 14; styles.
15. **The path chips.**
    - **Build 230:** the 12 paths ran off the right edge in one scrolling row, 7 of them out of sight.
    - **Build 231:** from 760 px wide they wrap onto more rows. Narrower, they scroll with the fade of item 18.
    - **Where:** styles.
16. **The Matrix's Y, Y* and N.**
    - **Build 230:** the three looked alike. N was grey at 3.91:1 against its cell, under WCAG's 4.5:1, in all 1,300 of its cells.
    - **Build 231:** Y is bold on a green tint and Y* on amber. N is lighter, `#8a9db0` at 6.55:1, and not bold. A key above the table says what each means. The key shows on the Matrix, and in the Config view when its table is open.
    - **Where:** block, part 16; styles.
17. **The Failure Lab's 65 scenarios.**
    - **Build 230:** a box ten rows high held all 65, with no way to find one.
    - **Build 231:** a count and a filter by name or stage sit above the list: "65 scenarios", or "2 of 65 scenarios" for "syslog". The selected scenario stays in the list.
    - **Where:** block, part 17; styles.
18. **Wide rows and diagrams.**
    - **Build 230:** they were cut off mid-card, with no sign of more.
    - **Build 231:** a 48 px fade marks each edge with more to scroll to. It covers the path chips, the OV tabs, the overlay canvas, the custody map, the Failure Lab's map, the Matrix, the OV tables, RASCI and the Operate tables. It follows scrolling and redraws.
    - **Where:** block, part 18; styles.
19. **The Builder's first visit, its help card, and its title on a phone.**
    - **Build 230:**
      - At 1440 px the Builder opened at 58%, its canvas 754 px wide between the two docked panels.
      - The help card's "Got it" sat above the help it closes.
      - On a phone the title read "Builder ·".
    - **Build 231:**
      - On a first visit, Components starts folded when the topology would fit at under 70%: the panel's own Hide control is pressed, and the view is fitted again. It opens at 78%.
      - "＋ Add" opens Components again. A panel state the person has chosen is kept, as before.
      - "Got it" is at the card's foot.
      - The phone title is "Builder".
    - **Where:** block, part 19; styles; edit 11.
20. **The Config view with no files.**
    - **Build 230:** it showed the whole 125-stage table, as the Matrix does.
    - **Build 231:** the table waits behind a line and a "Show the stage table" button until files are read.
    - **Where:** block, part 20; styles.
21. **The change register.**
    - **Build 230:** its 246 items ran in one column, 197 of them in Explorer foundations, with details under 10 px.
    - **Build 231:**
      - Each group runs across the page, with its items in two columns from 980 px. Details are 11.8 px, and dates 11 px.
      - A search, a status filter (All, Done, Proposed) and "Newest first" sit above the groups, with a count: "246 changes".
    - **Where:** block, part 21; styles.
22. **Small text.**
    - **Build 230:** 4,684 pieces of the app's own text were under 11 px, counted on each page they show on. This leaves out SVG text, which scales with its diagram, and the Builder canvas's cards.
    - **Build 231:** 25. These are a few OV table cells, where the same selector also holds larger text, and one Operate label.
    - **How the floor was made:**
      - Each selector is made from the text's tag and class and its nearest classed parent. Where that also matched larger text, a narrower selector was tried.
      - A selector is kept only if everything it matches, on every page, shown or not, is at most 11 px and outside SVGs and the canvas. So the floor only ever raises text.
      - The rules are marked important, because the page's own rules for the same text are often more specific (`.avPage189 .fact .k`).
      - They apply to screens only, so print keeps its own sizes.
    - **Where:** styles (the floor).
23. **Contrast.**
    - **Build 230:** OV-6c's notes, DIV-1's dimmed concepts when one is in focus, and CV-6's "Not covered" were too faint to read.
    - **Build 231:** each is darker or less dimmed:
      - OV-6c's notes are `#5b4a24`;
      - DIV-1's dimmed concepts are at 62% opacity;
      - CV-6's "Not covered" is `#a8261c`.
    - **Where:** styles.
24. **Tap targets on a phone.**
    - **Build 230:** AV-2's view chips, the row buttons of SvcV-3a and SvcV-3b, and TM-1's notes were under 24 px tall at 390 px.
    - **Build 231:** these are at least 24 px. Checkboxes are 18 px, in rows at least 24 px tall.
    - **Where:** styles.
25. **Generate: a Syslog Server's ports, and a load balancer's listeners.**
    - **Build 230:** Generate left out the ports and listeners that Build 230 added.
    - **Build 231:** the generated configuration ends with an SC4S env_file section for each Syslog Server, and a listener list for each load balancer. Its lines are under "Generate" below.
    - **Where:** block, part 25.
26. **Compare with nothing saved.**
    - **Build 230:** six empty cards.
    - **Build 231:** a note, "Nothing saved to compare with yet", says to save the topology in the Builder, change it, and come back.
    - **Where:** block, part 26; styles.
27. **Wording.** Each of these changes in the page:
    - "modeled" becomes "modelled", in Data quality's impact and the parsing laboratory's lead (edits 5 to 7), as elsewhere in the page.
    - "Syslog server" becomes "Syslog Server", as the component is named (edits 2 to 4, and a register item).
    - "Deployment server cluster" becomes "Deployment Server cluster", in AR-012's name and the load balancer inspector's heading (edits 13 and 14).
    - "serialization" becomes "serialisation", in register details.
    - **AV-2's entry for system interfaces** read "3 SV-1 interface". Build 181's fix for count words, in `builder-review-v181`, took the 1 of "SV-1" for a count and made the noun singular. A count now has to stand on its own: not after a letter, a digit or a hyphen (edit 12). The regression found this one, after the review. No OV page has a lone "1" before a plural count word, with the fix or without it.
    - **Where:** edits; block, part 27.

### Generate

With six ports on Syslog Server 1, Generate ends:

```
# SC4S env_file (/opt/sc4s/env_file) — Syslog Server 1: its listening ports
# TLS: turned on here; the server key and certificate go in /opt/sc4s/tls/server.key and server.pem
SC4S_SOURCE_TLS_ENABLE=yes
# 2 UDP ports for every sender, in the comma-separated form SC4S documents for a source's ports
SC4S_LISTEN_DEFAULT_UDP_PORT=514,1514
SC4S_LISTEN_DEFAULT_TCP_PORT=514
SC4S_LISTEN_DEFAULT_TLS_PORT=6514
# Fortinet FortiGate: match FORTINET_FORTIGATE to the vendor and product in SC4S's sources list
SC4S_LISTEN_FORTINET_FORTIGATE_UDP_PORT=5514,5515
```

- Each note has a line of its own, as an env_file takes no comment after a value.
- There is one variable per source and protocol, its ports comma-separated with no spaces, as SC4S's sources page shows.
- The source's key comes from the senders a port is for; its note says to match it to SC4S's vendor and product.
- A TLS port for one source gets a note too: SC4S documents that form with UDP and TCP.
- For more than one default port, the note says the comma-separated form is the one SC4S documents for a source's ports. SC4S's entrypoint sets the defaults, and the docs don't say whether those take a list.

### Not covered

- **Text left under 11 px:**
  - SVG text: 261 pieces, which scale with their diagrams.
  - The Builder canvas's cards, which scale with its zoom.
  - The 25 under item 22.
- **Contrast:** 35 of 12,870 pieces of text checked at 1440 px are under WCAG's 4.5:1, or 3:1 for large text. Build 230 had 2,639 of 15,082.
  - 2,600 of Build 230's were the Matrix's N, on the Matrix and again in the Config view (item 16).
  - Fewer are checked on the new page because the Config view's table waits behind its button (item 20).
  - The three in item 23 are the ones the review found hard to read by eye.
- **The OV pages' repeated ids** stay: 12 ids occur on more than one OV page, as in Build 230.
- **The SC4S settings** aren't checked against a running SC4S: their form is from its docs and its entrypoint.

## The edits

The lines are Build 230's.

1. **Line 301, in the page's markup.** The stage dialog's id (item 11): The stage dialog was id="detail", as is a panel on 13 OV pages. It is now id="stageDetail".
```
old: <dialog id="detail">
new: <dialog id="stageDetail">
```
2. **Line 419, in the page's markup.** A stage's description (item 27): The component's name, capitalised.
```
old: Writes routed messages to the monitored filesystem path on the Syslog server.
new: Writes routed messages to the monitored filesystem path on the Syslog Server.
```
3. **Line 741, in the page's markup.** A failure scenario's name (item 27): "Syslog Server unreachable", named as the component is, and as "Deployment Server unreachable" is.
```
old: name:'Syslog server unreachable'
new: name:'Syslog Server unreachable'
```
4. **Line 746, in the page's markup.** A recovery check (item 27): The same.
```
old: service logs on the Syslog server.
new: service logs on the Syslog Server.
```
5. **Line 1,014, in the page's markup.** Data quality's impact (item 27): British spelling, as the rest of the page: "modelled".
```
old: % modeled impact</span>
new: % modelled impact</span>
```
6. **Line 1,197, in the page's markup.** The parsing laboratory's lead (item 27): The same, in the laboratory's opening sentence.
```
old: <p>Compare raw input with the modeled event boundaries, timestamp assignment
new: <p>Compare raw input with the modelled event boundaries, timestamp assignment
```
7. **Line 1,202, in the page's markup.** The parsing laboratory's lead, as it is redrawn (item 27): The same, where the laboratory rewrites the sentence.
```
old: textContent='Compare raw input with the modeled event boundaries, extraction phases
new: textContent='Compare raw input with the modelled event boundaries, extraction phases
```
8. **Line 1,896, in the page's markup.** Opening the stage dialog (item 11): The same id, where a stage's detail opens.
```
old: $('#detail').showModal()
new: $('#stageDetail').showModal()
```
9. **Line 1,920, in the page's markup.** Closing the stage dialog (item 11): The same id, where the dialog closes from its button or its backdrop.
```
old: $('#detail .close').onclick=()=>$('#detail').close();$('#detail').onclick=e=>{if(e.target===$('#detail'))$('#detail').close()};
new: $('#stageDetail .close').onclick=()=>$('#stageDetail').close();$('#stageDetail').onclick=e=>{if(e.target===$('#stageDetail'))$('#stageDetail').close()};
```
10. **Line 7,371, in `<script id="builder-threat-review-v152">`.** TM-1's build line (item 7): TM-1 put a fixed date, 4 Oct 2026, after the build number, on screen and in the architecture pack. It now uses the pack's prepared date, as every other OV page does.
```
old: builderV125Text125($('#topologyBuilder').dataset.buildNumber)+' · 4 Oct 2026</b>'
new: builderV125Text125($('#topologyBuilder').dataset.buildNumber)+' · '+builderOvShortDate136()+'</b>'
```
11. **Line 8,048, in `<script id="builder-phone-space-and-margin-v159">`.** The Builder's title on a phone (item 19): On a phone the title read "Builder ·": the dot led to text that is no longer there.
```
old: $('.builderBuildTitle h2').textContent='Builder ·';
new: $('.builderBuildTitle h2').textContent='Builder';
```
12. **Line 9,734, in `<script id="builder-review-v181">`.** The OV pages' count wording (item 27): Build 181's fix for count words took the 1 of a name such as SV-1 for a count, so AV-2 read "3 SV-1 interface". A count now has to stand on its own: not after a letter, a digit or a hyphen.
```
old: n.textContent=n.textContent.replace(/\b(\d+) (systems|services|flows|providers|consumers|interfaces|attributes|needlines|mappings)\b/g,(_,v,noun)=>plural(v,noun.slice(0,-1)))
new: n.textContent=n.textContent.replace(/(?<![\w-])(\d+) (systems|services|flows|providers|consumers|interfaces|attributes|needlines|mappings)\b/g,(_,v,noun)=>plural(v,noun.slice(0,-1)))
```
13. **Line 9,904, in `<script id="builder-load-balancer-v185">`.** AR-012's name (item 27): "Deployment Server cluster", as the component is named.
```
old: ['AR-012',"Deployment server cluster stays within Splunk's limits",
new: ['AR-012',"Deployment Server cluster stays within Splunk's limits",
```
14. **Line 9,926, in `<script id="builder-load-balancer-v185">`.** The load balancer inspector's heading (item 27): The same.
```
old: <h4>Deployment server cluster</h4>
new: <h4>Deployment Server cluster</h4>
```

## The new block

**`<script id="explorer-review-v231">`** goes right after `builder-ports-v230`'s `</script>` (line 17,706 of Build 230). It contains [`docs/mockups/explorer-review-prototype.js`](mockups/explorer-review-prototype.js). It uses the page's own functions and doesn't depend on the edits: its part 11 is only a note on edits 1, 8 and 9.

It wraps these functions:
- `switchView`, for the shared section and the Builder's first visit;
- `builderOvShow135`, so the after-draw parts run when an OV page is shown;
- `renderBuilder` and `loadTopologyDocument`, for the save state;
- `renderChanges`, for the register's tools;
- `generatedConfiguration`, for the SC4S lines;
- `renderCompareOperations`, for the empty note.

Its other work:
- It renames the register items in `changeRegister` once.
- One `MutationObserver` on `document.body` runs its after-draw parts once per frame: the Operate tables and labels, the diagram names, the Find box's name and the fades.

Its styles, **`<style id="explorer-review-v231-styles">`**, go right after `builder-ports-v230-styles`'s `</style>` (line 16,402).

It sets two globals:
- `window.explorerContext231` gives `open(view)` and `set(view, open)`.
- `window.explorerReview231` gives `ctxApply`, `settle` and `cue`.

## Build records

After the edits and the block, in a new `<script id="explorer-review-records-v231">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Fixes from a review of every page','The stage dialog opens after an OV page, a fresh Builder fits its canvas with nothing unsaved, TM-1 shows the pack’s date, tables reach their edges on a phone, controls have names and text is 11 px or more. The shared section folds away, scenarios and changes can be found, the Matrix has a key, and Generate gives a Syslog Server’s ports as SC4S settings.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 230 did in its records, with Build 231 and 25 Nov 2026.

## Check before uploading

Run with Build 230 + the edits, the block and the styles, and with Build 230 for comparison.

### 1. The checks: 37. All pass with the edits; 34 fail on Build 230

Each check opens the page as a person would and does what the item is about. There is one or two per item, and one for page errors.

The three that pass on Build 230 too check that the fixes keep what was right:
- at 1,180 px the page doesn't scroll sideways on the Matrix, as Build 230's table scrolls in its own box;
- adding a component makes the Builder unsaved;
- "Show components and model" opens the section, which Build 230 never folds.

Build 230's page error is the stage dialog's, item 11.

### 2. Every page, swept before and after

The review's sweep, on Build 230 and the new page:

| At each width | 1440 px: Build 230 | 1440 px: new | 1024 px: Build 230 | 1024 px: new | 390 px: Build 230 | 390 px: new |
|---|---|---|---|---|---|---|
| Page errors | 0 | 0 | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 | 0 | 0 |
| Text cut off in its box | 1 | 0 | 0 | 0 | 0 | 0 |
| Text ending in an ellipsis | 70 | 70 | 56 | 56 | 0 | 0 |
| Text over other text | 12 | 6 | 6 | 8 | 5 | 12 |
| Controls without a name | 88 | 0 | 88 | 0 | 87 | 0 |
| Ids used more than once | 576 | 576 | 576 | 576 | 576 | 576 |
| Text under WCAG contrast | 2,639 | 35 | 2,637 | 33 | 2,634 | 30 |
| Text under 10 px | 2,205 | 139 | 2,200 | 139 | 2,226 | 167 |
| Tap targets under 24 px | — | — | — | — | 275 | 108 |
| Text checked for contrast | 15,082 | 12,870 | 14,901 | 12,757 | 14,853 | 12,709 |

**Text over other text** counts each line of text where it would be, even scrolled out of sight in a box or cut off by one. The new page shows more of it within the sweep's three screens, as the shared section folds and pages start higher. In a second pass over every page, with each line cut to the boxes that clip or scroll it (`docs/mockups/explorer-review-overlaps.js`), the lines that overlap where a person can see them are: at 1440 px, Build 230 3 and the new page 0; at 1024 px, Build 230 0 and the new page 0; at 390 px, Build 230 0 and the new page 0.

Other sweeps:
- **Cut off by a box that hides overflow, at 390 px:** Build 230, 104 (ops Multi-DS management 77, ops Capacity model 15, view builder 12); the new page, 12 (view builder 12).
- **At 1440 px:** Build 230, 0; the new page, 0.
- **Every control used once:** Build 230, 2,008 controls; the new page, 1,791, as the shared section starts folded on Diagnose, Failure Lab, Changes and Operate, and Components on the Builder’s first visit. None leaves a page error on either. The sweep itself can’t click an SVG part with `click()`, or read the options of one list in the parsing laboratory (108 and 102); the review clicked the SVG parts another way. Controls with no effect it could see: 104 and 104.
- **Round the pages:** ten rounds on each page. Over rounds 2 to 10, the median is 38,149 DOM nodes on Build 230 and 38,936 on the new page, with 1,965 and 1,986 event listeners. The counts move from round to round: from 38,149 to 38,536 on Build 230, and from 38,241 to 44,115 on the new page. That highest one, the fourth round, is a single round: the next has 38,560, and no other is above 39,402. The tenth round has 38,267 and 38,241. The heap grows 0.34 MB and 0.34 MB a round after the first.
- **The stage dialog after an OV page:** Build 230, 28 of 28 OV pages leave a stage's click opening nothing. The new page, none.

### 3. Regression against Build 230

What Build 231 means to change is set aside on both pages before comparing:
- **On the new page:**
  - The shared section is open on every view.
  - The Config view's stage table is shown.
- **On both pages:** the Builder's docked panels are stored as open before the page loads, so a first visit doesn't fold Components.
- **Taken out while the text is read:**
  - the shared section's line and button;
  - the Matrix key;
  - the Config note;
  - the scenario filter;
  - the Changes tools;
  - Compare's note;
  - on both pages, the Builder's save state.
- **Left out of the markup compared:** the fades' classes.
- **The Builder's cards are placed from the first card's corner, and the topology file's view offset is left out,** there and in the evidence pack's copy of the file. The first fit centres the topology above the help card, and with "Got it" at its foot that card is 10.5 px taller. So each card sits 5.25 px higher, at the same zoom.
- **The evidence pack's sizes on its page are left out.** Its files are compared one by one instead, with the generated configuration's new lines taken out, and the ids the page makes from the clock blanked, as in the topology file.
- **A name ending in -1 before a count word**, as in "SV-1 interfaces", is read in the plural on both pages (edit 12).
- **Made the same on both pages:**
  - the wording of item 27;
  - the two register names;
  - the date after a build number on the OV pages.
- **Taken out of the generated configuration:** the SC4S and listener lines, in Generate and in the architecture report.
- **Text is compared with each run of spaces and line breaks as one space,** because items 2 and 8 put text into blocks and boxes where it ran on one line.
- **Where text still differs, it counts as the same if it matches with spacing and case set aside.** These are listed apart: ops 10.

| What is compared | Result |
|---|---|
| View text, every view; Operations pages; OV pages | 59 of 59 the same |
| Every path: the Flow view's text and the route | 25 of 25 the same |
| Every failure's detail and owners; every symptom | 145 of 145 the same |
| The Config view, with no files, the example, the Fortinet add-on's four files and its package | 279 of 279 the same |
| Four Builder topologies, each component's inspector on each of its tabs | 60 of 60 the same |
| The same topologies, each link's inspector | 16 of 16 the same |
| The same topologies: the canvas's text, every card's text and box from the canvas's corner, the rules' results, the Builder's validation, every link's label and details, the network overlay, the topology file and the architecture report | 32 of 32 the same |
| Page errors | None on either |

Each comparison takes Build 230 twice, to set aside whatever varies from run to run: nothing did. 593 of the 617 snapshots are the same before any of this is set aside.

**The earlier suites and tools**, on both pages:

| Suite or tool | Build 230 | Build 230 + the edits |
|---|---|---|
| Build 230’s 29 checks | 29 of 29 | 29 of 29 |
| Build 230’s 26 checks of its block, in Node | 26 of 26 | 26 of 26 |
| Build 229’s 26 checks | 26 of 26 | 26 of 26 |
| Build 229’s 13 checks of its block, in Node | 13 of 13 | 13 of 13 |
| Build 228’s 36 checks | 36 of 36 | 36 of 36 |
| Build 228’s 39 checks of its block, in Node | 39 of 39 | 39 of 39 |
| Build 227’s 47 checks | 47 of 47 | 47 of 47 |
| Build 227’s 31 checks of its block, in Node | 31 of 31 | 31 of 31 |
| Build 226’s 29 checks | 29 of 29 | 29 of 29 |
| Build 226’s 78 checks of its blocks, in Node | 78 of 78 | 78 of 78 |
| Build 225’s 24 checks, as Build 226 runs them | 24 of 24 | 24 of 24 |
| Lookup checks: 54 checks, as Build 226 runs them | 54 of 54 | 54 of 54 |
| Build 224’s 51 checks, as Build 225 runs them | 51 of 51 | 51 of 51 |
| Build 224’s own 51 checks | 48 of 51 as written † | 48 of 51 as written † |
| Lookup checks: 54 checks, as Build 223’s handoff wrote them | 46 of 54 as written † | 46 of 54 as written † |
| Event types, tags and CIM data models: 64 checks (Build 222’s handoff) ‡ | 63 of 64 as written † | 63 of 64 as written † |
| The Config view handoff’s 70 checks, with the expectation Build 222’s handoff rewrote ‡ | 69 of 70 as written † | 69 of 70 as written † |
| The source type map’s 82 checks | 82 of 82 | 82 of 82 |
| The splits’ 40 checks, with the map’s tools taken out as Build 224’s handoff says | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines’ 31 checks | 31 of 31 | 31 of 31 |
| The space tool | Meets every target | Meets every target; on a first visit the canvas gets 52% at 1280 px and 57% at 1440 px, for 37% and 43%, as Components starts folded there; the same at the other sizes |
| The connector tool ¶ | 20 findings, all ‘badge over label’, in 7 of the 10 scenes | None: the Builder now opens at a larger zoom, where the badge clears the label. At the same zoom the two pages give the same result |
| The Builder’s redraws, 4 components: budget 40 ms § | 27 ms; 29 ms after a card moves | 26 ms; 28 ms after a card moves |
| The Builder’s redraws, 5 components: budget 50 ms § | 36 ms; 40 ms after a card moves | 36 ms; 38 ms after a card moves |
| The Builder’s redraws, 8 components: budget 80 ms § | 61 ms; 67 ms after a card moves | 63 ms; 63 ms after a card moves |
| The Builder’s redraws, 17 components, the reference topology: budget 120 ms § | 70 ms; 84 ms after a card moves | 68 ms; 83 ms after a card moves |
| The offline check, with the Fortinet add-on’s package | 23 of 23 | 23 of 23 |

**The Config view's results that Splunk checked** are the same on both pages: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

† As before: three of Build 224’s checks want what Build 225 changed; eight of the lookup checks, as first written, want what Build 226 changed; one of Build 222’s wants a folder’s macros.conf counted among the skipped files; one of the Config view handoff’s wants Where it acts right above the file tabs.

‡ These two have a 2.5-second page-load limit. They finished as written on both pages, and gave the same results with only that limit raised to 15 seconds.

§ `tools/builder-perf-check.js`, five runs on each page in turn after the timings: the medians of its redraw after a change, and after a card moves. Every median is within its budget on both pages.

¶ `tools/builder-connector-check.js` adds a component from the Components panel. It now opens that panel when the Builder starts with it folded, as a person would with ＋ Add, and ran with that change on both pages. On Build 230 the change does nothing, as the panel starts open. Its findings on Build 230 are all one thing: an issue badge drawn over the File handoff label, between the Syslog Server and the Universal Forwarder, or over another label once a card is dragged. They aren’t on the new page only because its Builder opens at a larger zoom, as Components starts folded: 78% for 58%, where the first scene and the six drag scenes begin. Set to 58%, 65% and 70%, both pages draw the badge over the File handoff label; at 78%, neither does. So this build doesn’t move the badge; at a smaller zoom it still covers the label, as before. That’s left for a later build.

### 4. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 230 | With the edits |
|---|---|---|
| Loading the page (to the load event) | 1,591.7 ms (1,504.8 to 1,786.9) | 1,598.9 ms (1,520.0 to 1,839.7) |
| The ten views, each to its next frame (all ten) | 2,296.2 ms (2,135.4 to 2,649.9) | 2,372.0 ms (2,208.6 to 2,848.8) |
| The 28 OV pages, each to its next frame (all) | 2,514.2 ms (2,361.1 to 2,657.4) | 2,543.5 ms (2,396.4 to 2,994.9) |
| Builder redraw, its own topology | 36.6 ms (33.9 to 48.4) | 37.4 ms (34.8 to 43.0) |
| Drawing the change register | 30.1 ms (26.0 to 38.2) | 30.2 ms (27.8 to 42.6) |
| Restyling and laying out the page, on Changes † | 32.4 ms (27.9 to 40.2) | 26.6 ms (23.4 to 30.8) |

- Each figure with the edits is within Build 230’s spread, and Build 230’s within theirs, but for the one marked †: restyling and laying out the page on Changes is faster with the edits, 26.6 ms for 32.4 ms, as the shared section starts folded there and there is less of the page to lay out.

### 5. The build

`index.html` as committed, Build 231, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 pass.
- The new checks pass on Build 231 as on the tested page: 37 of 37.

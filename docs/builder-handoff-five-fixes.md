# Handoff: five fixes (Esc, the selection after an add, syslog to Splunk Cloud, the Inspector, [source::] stanzas)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 206.
**One new block, at the end of the page (before `</body>`):** `<script id="five-fixes-v207">`, containing [`docs/mockups/five-fixes-prototype.js`](mockups/five-fixes-prototype.js). There is no style block.

**Four in-place edits,** listed under "The edits". Each old string occurs exactly once in Build 206. They are also in [`docs/mockups/five-fixes.diff`](mockups/five-fixes.diff), a unified diff against Build 206's `index.html`.

Paste the file as it is, make the four edits, then add the build records (see "Build records").

**Written for Build 205, now for Build 207.** Build 206 added the small fixes ([`builder-handoff-small-fixes.md`](builder-handoff-small-fixes.md)), which touch different code: the four edits apply to Build 206 unchanged, at the same lines. The block is now `five-fixes-v207`, and its matcher `configSourceMatches207`. See the Build 206 recheck ([`builder-handoff-build206.md`](builder-handoff-build206.md)).

**Mockup (the target):** [`docs/mockups/five-fixes-mockup.html`](mockups/five-fixes-mockup.html). Six scenes have the fixes applied to Build 206, and the six "Today" scenes are Build 206. The screenshots are `docs/mockups/compare/five-fixes-*.png`.

**Tested first:** the block and the edits were applied to Build 206 and run. The results under "Check before uploading" come from that run. They were first tested on Build 205, alone and with the small fixes, with the same results.

## Why

### 1. Esc leaves a connection pending

**What you see:**
- **Click a card's Event data handle.** A connection starts, and the add-next list opens.
- **Close the list,** for example by clicking another card.
- **Press Esc.** The selection is cleared, and at 1,024 px the Inspector drawer closes too. But the connection stays pending:
  - every card keeps its handles showing;
  - the status still reads "Event data: choose the destination handle";
  - the next handle clicked connects to the first card.

  A second Esc does nothing more.

**The cause:**
- **The pending connection is `state.builderConnectionDraft`.** Build 204's add-next list cancels it on Esc, but only while the focus is in the list: its window capture listener checks `menu.el.contains(e.target)`.
- **Outside the list, Esc goes to the Builder's other handlers.** Build 95's drawer handler (on the document, capture phase) closes the open panel, and Build 167's clears the selection (`clearSelection167`). Neither touches the draft.
- **The only ways out:**
  - clicking the active handle again (Build 204);
  - the Inspector's "Cancel connection", which shows only while the relationship inspector is up.

### 2. A palette add leaves the tick on the card selected before

**What you see:**
1. Select a card.
2. Add a component from the palette, by clicking it or dragging it onto the canvas.

The new card is selected, and the Inspector shows it. But the card selected before keeps the green tick and border, as if it were still selected.

**The cause:**
- **What draws the tick and border:** `.multiSelected`, on every card in `selectedBuilderIds()`. That is `state.builderMultiSelected`, or the selected card when it's empty.
- **The palette's clicks and drags** set `state.builderSelected` to the new card, but leave `builderMultiSelected` as it was.
- **The other adds already set it:** Build 204's add-next list, and the palette's "Compatible next component" buttons, which use it.

### 3. Syslog Source → Splunk Cloud indexing: connected, then rejected

**What you see:**
- **Two ways make the link:** the handles connect a Syslog Source to Splunk Cloud indexing, and with a Syslog Source selected, a palette click on Splunk Cloud indexing adds it already connected.
- **Then it's rejected.** Build 148 draws the link red and dashed, "Syslog → Splunk Cloud: not allowed", and validation reports an error.
- **The add-next list already leaves it out.**

**The cause:**
- **`dataCapability` allows it.** Build 148 checks Splunk Cloud indexing as an Indexer, and a Syslog Source may send to an Indexer. Build 148 rejects the link in validation instead.
- **Build 148's palette path skips the check.** Its own `addBuilderNode` wrapper adds Splunk Cloud indexing through `builderCloudCreate148`, linked to the component it follows, without the capability check. So a check that refused it still wouldn't stop the palette.
- **Build 148's handling stays useful.** Its marking and its "Insert Syslog Server between them" fix still serve topologies that already contain the link.

### 4. The Inspector with nothing selected

**What you see,** below 1,280 px, in the drawer from 761 to 1,279 px and the sheet below that:
- **Open the Inspector with nothing selected.** It shows the topology: its name, contents, validation and layout.
- **But it's dimmed and doesn't take input.** It shows at 45% opacity, and clicks and taps go through it to the canvas. On a phone, a tap on the middle of the sheet hits the zoom controls behind it.
- **The same with a container selected.**

**The cause:**
- **The page's first `renderBuilderInspector` dims it.** That function (line 1715, in an unnamed script) sets `inspector.style.opacity` to `.45` and `pointerEvents` to `none` whenever no component is selected. It dates from when the Inspector had nothing to show then.
- **Build 197 undid it only for the docked panels.** Its `!important` override, on `#topologyBuilder.builderDocked197 .builderInspector`, is why the Inspector is fine from 1,280 px.

The Build 198, 203 and 205 rechecks reported this for phones only. It affects every width below the docked layout.

### 5. The Config view finds a [source::] stanza only by its exact text

**What you see:**
- **What should happen:** an inputs.conf monitor without its own `sourcetype` takes one from the props.conf `[source::]` stanza that matches its files. The Config view notes it on the monitor's line ("Its source type, X, comes from F line N.") and lists the monitor under that source type.
- **What does:** only when the stanza's text is the monitor's path, character for character. `[source::.../fw-*.log]`, `[source::/var/log/acme/...]` or `[source::C:\\logs\\...]` never match.

**The cause:** an exact string comparison. In `config-view-v205`, line 13632: `const sourceStanza=path=>…find(s=>s.kind==='source'&&s.name.slice(8)===path&&…)`.

## The design

### 1. Esc

- **With a connection pending, Esc cancels it.** The status says "Connection cancelled", and the handles go back. The selection, the Inspector and an open drawer stay. This is what Esc in the add-next list does; the list keeps its own handling, which also returns the focus to the handle.
- **The next Esc is as before:** it clears the selection, and at 1,024 px closes the drawer.
- **These still take the Esc first, as today:**
  - an open menu: the menu bar's, the density panels', the phone's More and Planes, the space groups;
  - a popover: the object menu, the issue popover, history, the report and the info popover;
  - the change-impact overlay and the presentation view;
  - a text field: input, textarea, select or contenteditable.

  The connection stays pending, and the next Esc cancels it.
- **In Focus canvas,** Esc cancels the connection and stays in Focus canvas.
- **With nothing pending,** Esc is unchanged.

### 2. The selection after an add

- **The new card is the only one selected.** When an add selects the new card, the block sets `builderMultiSelected` to `[its id]`, clears `builderBulkEdges`, and redraws the ticks.
- **This covers:** the palette's clicks (connected, or with "New unconnected" ticked) and drags onto the canvas. The add-next list and the compatible-next buttons already did it.

### 3. Syslog Source → Splunk Cloud indexing

**Refused when a link is made.** The capability check now gives Build 148's own advice: "Syslog can't go directly to Splunk Cloud. Send syslog through a Syslog Server and forwarder or HEC."
- **The handles** refuse with that status. While a Syslog Source connects, the Splunk Cloud handle is disabled, with the reason as its tooltip, as for any target the check refuses.
- **Dragging** the Splunk Cloud card onto the Syslog Source is refused.
- **The palette:**
  - Splunk Cloud indexing shows "adds unconnected", with the reason, as for other components that can't follow the selected one;
  - a click adds it unconnected and says why: "Added Splunk Cloud indexing unconnected · … Drag it onto a compatible component to connect.", as Build 115 does for other types;
  - a drop onto the Syslog Source is refused.

**Not refused: a link that is already there.**
- A file being read: its nodes aren't in the topology yet.
- A link that exists, as `target.parent` or a data relation.

So files and saved topologies with the link load as before. Build 148 marks the link, validation reports it once, and "Insert Syslog Server between them" fixes it.

**Unchanged:**
- everything else a Syslog Source can send to: Syslog Server, Heavy Forwarder, Indexer, Edge Processor and load balancer;
- Syslog Servers and forwarders sending to Splunk Cloud indexing.

### 4. The Inspector

- **No dimming.** The Inspector is opaque and takes input at every width, whatever is selected. Edit 1 removes the dimming where it starts.
- **Build 197's override is now redundant.** It can go in a later cleanup.

### 5. The Config view's [source::] stanzas

**The match language,** from props.conf.spec. In a stanza:
- `...` matches any run of characters, path separators included;
- `*` matches any run within one path segment;
- `.` is a dot, and `\\` a backslash;
- the rest is a regular expression, matched against the whole path, case-sensitively.

**A monitor's path:**
- **It can use `...` and `*` too.** A stanza applies to all the monitor's files when its pattern covers the monitor's, and to some of them when the two overlap.
- **A literal path can name a directory:** when it ends with a separator, or when it matches no stanza but a stanza names something under it. Then the stanzas are matched against the files under it.

**Ranking, as Splunk ranks:**
1. priority: the stanza's `priority` setting, or else 100 for a literal stanza and 0 for a pattern;
2. then ASCII order of the stanza names, the first winning.

**The note on the monitor's line:**
- **One stanza covers all its files:** "Its source type, X, comes from [source::P] in F line N." When the stanza is the monitor's path exactly, the note is as before: "Its source type, X, comes from F line N."
- **A directory:** "Its files take source type X from [source::P] in F line N."
- **Higher-ranked stanzas take some of its files:** "Files matching [source::Q] take source type Y (F line N); … The rest take X from [source::P] in F line N."
- **Only some of its files match:** the same, ending "Its other files get no source type from props.conf."

**Following one source type:**
- a monitor whose files all get a source type here is listed under those types only;
- one whose files may get none stays under every type, as before.

**Regular expression syntax** beyond `...`, `*` and `.` (alternation, groups, lookbehind) is matched as a regular expression. Against a monitor path with wildcards, it can only say "some files".

**Unchanged:** a monitor with its own `sourcetype`, which wins, as in Splunk; and the built-in example's notes.

## The edits

All four are in Build 206's `index.html`, and each old string occurs exactly once. The line numbers are the same as in Build 205.

**1. In the unnamed script with `renderBuilderInspector`, line 1717: remove the dimming.**
```
old: inspector.style.opacity=n?'1':'.45';inspector.style.pointerEvents=n?'auto':'none';
new: (nothing)
```

**2. `<script id="config-view-v205">`, line 13632: the stanza lookup, now through the block's matcher.**
```
old: const sourceStanza=path=>kindFiles('props').flatMap(f=>f.doc.stanzas).find(s=>s.kind==='source'&&s.name.slice(8)===path&&s.keys.get('sourcetype'));
new: const sourceMatch=path=>window.configSourceMatches207?.(path,kindFiles('props').flatMap(f=>f.doc.stanzas).filter(s=>s.kind==='source'),line=>`${fileLabel(fileById(line.fid))} line ${line.n}`)||{note:'',types:null};
```

**3. The same script, line 13629, in `inputs(r)`: the monitor's note.**
```
old: if(input.path&&!st.keys.get('sourcetype')){const src=sourceStanza(input.path);if(src){const line=src.keys.get('sourcetype');note+=`${note?' ':''}Its source type, ${line.value}, comes from ${fileLabel(fileById(line.fid))} line ${line.n}.`}}
new: if(input.path&&!st.keys.get('sourcetype')){const src=sourceMatch(input.path);if(src.note)note+=`${note?' ':''}${src.note}`}
```

**4. The same script, line 13651, in `assignTypes`: the monitor's source types.**
```
old: for(const st of inputs){const set=st.keys.get('sourcetype')?.value,src=st.input?.path&&sourceStanza(st.input.path);st.types=set?one(set):src?one(src.keys.get('sourcetype').value):null}
new: for(const st of inputs){const set=st.keys.get('sourcetype')?.value,src=!set&&st.input?.path?sourceMatch(st.input.path).types:null;st.types=set?one(set):src?(src.forEach(v=>found.add(v)),new Set(src)):null}
```

After the edits, nothing refers to `sourceStanza`.

## How the block works

**1. Esc.**
- **Where it listens:** a `keydown` listener on the window, in the capture phase. It runs before the Builder's own Esc handling, and after Build 204's list listener, which is in the same phase and registered earlier.
- **When it acts:** on Esc in the Builder view, with `state.builderConnectionDraft` set, the event not already handled, and the target not a text field. It also checks the menus, popovers and overlays listed under "The design", each counted only when shown, and the presentation view.
- **What it does:** prevents the default, stops the event, clears the draft, says "Connection cancelled" and redraws. Build 204's redraw wrapper closes its list when the draft is gone.

**2. The selection.** A wrapper on `addBuilderNode`. When the call added a card and selected it, it sets `builderMultiSelected` to that card alone, clears `builderBulkEdges`, and calls `decorateMultiSelection()`.

**3. Syslog to Splunk Cloud.**
- **A wrapper on `dataCapability`.** It refuses a Syslog Source sending to Splunk Cloud indexing when the target is:
  - a palette or list candidate (no id, or -1), or a node in the topology;
  - and not already linked from that source, as its parent or in `state.builderDataRelations`.

  Anything else goes through unchanged.
- **A wrapper on `addBuilderNode`, for `cloudIndexer148` after a Syslog Source.** This is the add Build 148 makes without the check.
  - During a palette click (Build 115's `builderPaletteClickAdd`), it adds Splunk Cloud indexing unconnected and says why.
  - Otherwise, it refuses with the reason.

**5. `window.configSourceMatches207(path, stanzas, where)`.** The Config view calls it from edits 2 to 4.
- **`stanzas`:** the props.conf `[source::]` stanzas, highest precedence first.
- **`where(line)`:** formats "F line N".
- **What it does:**
  1. It merges the stanzas by name: a name's source type comes from the first stanza of that name that sets one, and its priority likewise.
  2. It reads the stanza names and the monitor's path as tokens: characters, `*` and `...`. A stanza with other regular expression syntax gives no tokens, and is matched as a regular expression instead.
  3. `covers` decides whether a stanza matches every path the monitor's can (all its files). `meets` decides whether they share a path (some).
  4. It ranks the matches, and walks them until one covers all the files.
- **What it returns:** the note, and the source types (a `Set`), or `null` when some files may get none from props.conf.

## Build records

After the block:
- **`changeRegister`,** group "Explorer foundations":
  `['Five fixes','Esc cancels a pending connection in the Builder and keeps the selection. A component added from the palette is the only one selected. A Syslog Source can no longer be linked straight to Splunk Cloud indexing. The Inspector can be used with nothing selected at every width. In the Config view, a monitor finds the props.conf [source::] stanzas whose wildcards match its files.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix,** as Build 206 did in `small-fixes-records-v206`, with Build 207.

## Found while testing (not changed)

1. **Esc with a menu open also clears the selection,** on Builds 205 and 206 too. The menu closes, and Build 167's handler runs as well. With a connection pending, the connection stays, and the next Esc cancels it.
2. **Build 148 catches only a Syslog Source linked straight to Splunk Cloud indexing.** Syslog Source → load balancer → Splunk Cloud indexing isn't flagged.
3. **The add-next list's own exclusion of Splunk Cloud indexing after a Syslog Source is now redundant.** It is harmless.
4. **Matching [source::] stanzas doesn't consider the monitor's `whitelist` and `blacklist`.** The view reads the monitor's path only.

## Check before uploading

Run with Build 206 + the block + the four edits, and with Build 206 as shipped for comparison.

### 1. The fixes: 49 checks, all pass

Build 206 passes 21 of the 49, as Build 205 did: those that check behaviour that should stay as it is.

| Check | Result |
|---|---|
| Esc at 1,440 and 1,024 px | A handle click starts a connection; clicking another card closes the list. Esc cancels the connection, keeps the selection and the Inspector, and says "Connection cancelled". A second Esc clears the selection |
| Esc in the add-next list | Still cancels, closes the list and returns focus to the handle |
| Esc with a menu open | Closes the menu, and the connection stays. The next Esc cancels it |
| Esc in a text field | Stays with the field, and the connection stays |
| Esc with nothing pending | Clears the selection, as before |
| Esc in Focus canvas | Cancels the connection, and stays in Focus canvas |
| Adds | After a palette click, a click with "New unconnected", a drag onto the canvas, a compatible-next button and the add-next list, the new card alone is selected and ticked |
| The capability check | Refuses Splunk Cloud indexing after a Syslog Source, with the reason. Everything else a Syslog Source can send to is as on Build 206. A Syslog Server and a Universal Forwarder still can |
| Handles | While a Syslog Source connects, the Splunk Cloud handle is disabled, with the reason as its title. Connecting is refused, with the reason, and leaves no link. A Syslog Server still connects |
| Drag | Dragging the Splunk Cloud card onto the Syslog Source is refused |
| Palette | With a Syslog Source selected, Splunk Cloud indexing shows "adds unconnected", with the reason. A click adds it unconnected and says why; a drop onto the Syslog Source is refused |
| A file with the link | Loads with the link, reported once by Build 148, drawn "not allowed". "Insert Syslog Server between them" still fixes it |
| The Inspector, nothing selected | At 1,024, 800 and 760 px, and on a 390 px phone: opacity 1, `pointer-events:auto`, and the Name field takes a click |
| The Inspector, a container selected, at 1,024 px | Opacity 1, `pointer-events:auto` |
| The Inspector, docked at 1,440 px | Unchanged |
| [source::], seven monitors | A pattern over all its files, first in ASCII order. A stanza that is its path exactly, with priority 10: the note as before. A directory, with three stanzas in rank order. A monitor with its own `sourcetype`: no note. No match: no note. A regular expression stanza: some files. A Windows path |
| Following a source type | Lists the monitors whose files take it, and those that may |
| The built-in example | Its notes are as on Build 206 |
| The matcher on its own | `*` stays in one segment and `...` crosses them; case counts; literal 100 beats a pattern, priority 101 beats a literal; ASCII order, then priority; a broken regular expression matches nothing; alternation |
| Page errors | None |

### 2. With the small fixes

Build 206 has the small fixes. With the five fixes added, the small fixes' 44 checks still pass: 44 of 44.

### 3. Regression

Against Build 206:

| Suite | Result |
|---|---|
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 58 of 58 |
| Menu bar actions | The same output as Build 206 |
| Parsing laboratory | 68 of 68. "Click to next frame" for fixed-length records took 347 ms, against 318 on Build 206 (limit 1,000) |
| Canvas card views | 123, unchanged |
| The space and connector tools | The same output as Build 206 |
| Page errors | None |

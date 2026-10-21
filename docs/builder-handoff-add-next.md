# Builder handoff: add the next component from a card's handle

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 203.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="builder-add-next-v204-styles">`, containing [`docs/mockups/builder-add-next-prototype.css`](mockups/builder-add-next-prototype.css);
- `<script id="builder-add-next-v204">`, containing [`docs/mockups/builder-add-next-prototype.js`](mockups/builder-add-next-prototype.js).

There are no in-place edits. The script wraps six Builder functions, replaces one and adds three listeners to the page; the style block styles the list and adds two rules for the handles. Paste both files as they are, then add the build records (see "Build records").

**Mockup (the target):** [`docs/mockups/builder-add-next-mockup.html`](mockups/builder-add-next-mockup.html). Six scenes have the block pair applied, and the three "Today" scenes are Build 203. It also has the table of what every component's list offers. The screenshots are `docs/mockups/compare/add-next-*.png`.

**Tested first:** the block pair was appended to Build 203 and run. The results under "Check before uploading" come from that run.

## Why

This is item 3 of the draw.io list in [`builder-handoff-build203.md`](builder-handoff-build203.md): a card's event-data handle lists only the components it can send to, and adds the chosen one already connected.

**Adding a component after a card on Build 203 takes two routes, both with faults:**
- **Select the card, then use the palette.** Its "Compatible next component" list (Build 83's `paletteCompatibleTypes`) reads the capability table, not the live check later builds added:
  - for an Ingest Processor it offers Indexer, which the add then refuses: "Ingest Processor writes to its Splunk Cloud stack's indexes or to Amazon S3, not to self-managed Indexers.";
  - and it leaves out Splunk Cloud indexing, which an Ingest Processor can send to.
  - **Some of what it offers comes out wrong.** After a new Load Balancer, HEC Endpoint is added connected, but the Load Balancer still serves syslog, so validation reports "Load Balancer 1 serves Syslog receivers, so it can't take HEC Endpoint 1". After a Splunk Cloud ES search head, SOAR is added but not connected.
- **Add it, then connect it with the handles:** two steps and two history entries.

**Testing found three faults in reaching the handles themselves.** The new list opens from the Event data handle, so the block fixes them too:

1. **The handles hide on the way to them.**
   - They show while the pointer is on the card, and hang 5 px below it: `top:calc(100% - 1px)` plus `margin-top:6px`.
   - The gap belongs to neither, so a pointer that stops in it ends the hover and the handles hide. The click then lands on the canvas.
   - Moving the pointer down a pixel at a time from the card's middle to its Event data handle, on 3 cards in 3 layouts: the handles hide at the card's bottom edge every time, and none of the 9 clicks starts a connection. A quick move that jumps the gap in one step works, which is why it went unnoticed. So does selecting the card first, which keeps its handles shown.
2. **The card below covers them.**
   - Every card's wrap has `z-index:3`, so where two cards overlap, the later one is on top.
   - A card's handle row hangs into the space below it, so the next card in a column covers it where they meet.
   - **Free place** stacks cards 230 px apart, 6 px between them. The next card covers 24 of the row's 25 px, and a click there lands on that card and can drag it ("Moved to avoid overlapping …").
   - With the pointer on each card, its Event data handle can't be clicked on:
     - the reference topology in Free place: 6 of its 11 cards;
     - the zones topology: 6 of 14 in Free place, and 1 in the vertical layout.
3. **Clicking the active handle again opens a bogus preview.**
   - The canvas help says "click the active handle to cancel", and the base `beginBuilderConnection` does cancel.
   - But on a card that already has an incoming link, the change-impact preview (script `builder-connection-templates-impact-preview`) runs first. It reads the click as a new incoming link from the card to itself.
   - It opens "Reconnect Universal Forwarder 1: Replace the current incoming relationship with Universal Forwarder 1 → Universal Forwarder 1".
   - The preview lists the card's whole route as removed, and six detections as degraded or blind.
   - Confirming changes nothing and only then cancels the connection; until then it stays pending.
   - **The cause:** the preview's condition, `target?.parent!==null&&target.parent!==draft.sourceId`, doesn't exclude the source card itself. A card without an incoming link, such as a Syslog Source, cancels as it should.

## The design

### The list

- **It opens when a card's Event data handle starts a connection:** a click, or Enter or Space on the focused handle.
  - The connection starts exactly as before: every card's handles show, and clicking another card's Event data handle connects the two.
  - So the list is an addition. Nothing a person does with the handles today changes.
- **Heading:** "Add after" and the card's name.
- **Choices:** the components the card can send event data to.
  - These are the types the live capability check (`dataCapability`) accepts for this card: `builderDataCapabilities` order first, then any other type a later build allows.
  - That is the check the handles use, with every later build's widening and narrowing: no self-managed Indexer after an Ingest Processor; Splunk Cloud indexing after anything that can send to an Indexer; a Load Balancer's rules.
  - **One exception:** not Splunk Cloud indexing after a Syslog Source. The check allows it, but Build 148's validation rejects it: "Syslog can't go directly to Splunk Cloud."
- **Each choice** shows a bar in the component's colour, its name, and the protocol its link will carry, as `builderHandoff` will label the link:
  - Splunk Cloud indexing is labelled as an Indexer hosted in Splunk Cloud;
  - a new Load Balancer is labelled with what its first link makes it serve, syslog or HEC, by the Load Balancer's own rule (`infer` and `first` in `builder-load-balancer-v185`).
- **Footer:** "Or click another card's Event data handle to connect to it."
- **A card that can send to nothing has no list:** a Search Head, Amazon S3, the two storage datasets and Splunk Cloud Search. Its handle keeps Build 203's tooltip and name, and only starts a connection.

What each list offers, with each link's protocol, after a new component of each type:

| After a | The list: component, then the protocol its link will carry |
|---|---|
| SQL Database | DB Connect on Heavy Forwarder · JDBC over database-native TCP/TLS |
| DB Connect on Heavy Forwarder | Indexer · Splunk-to-Splunk 9997 from hosting HF<br>Splunk Cloud indexing · Splunk-to-Splunk 9997 from hosting HF |
| Windows Event Log | Universal Forwarder · WinEventLog input<br>Heavy Forwarder · WinEventLog input<br>Indexer · WinEventLog input<br>Splunk Cloud indexing · WinEventLog input |
| File Source | Universal Forwarder · File monitor input<br>Heavy Forwarder · File monitor input<br>Indexer · File monitor input<br>Splunk Cloud indexing · File monitor input |
| Script Source | Universal Forwarder · Scripted input · inputs.conf<br>Heavy Forwarder · Configured handoff<br>Indexer · Configured handoff<br>Splunk Cloud indexing · Configured handoff |
| API Source | API Collector · REST/HTTPS polling<br>AWS Lambda · REST/HTTPS collection<br>Azure Function · REST/HTTPS collection<br>Heavy Forwarder · REST modular input<br>Indexer · REST modular input<br>Splunk Cloud indexing · REST modular input |
| API Collector | HEC Endpoint · Configured handoff<br>Heavy Forwarder · HEC HTTPS 8088<br>Ingest Processor · HEC HTTPS 8088<br>Indexer · HEC HTTPS 8088<br>Load Balancer · HEC HTTPS 8088<br>Splunk Cloud indexing · HEC HTTPS 8088 |
| AWS Lambda | HEC Endpoint · HEC HTTPS 8088<br>Heavy Forwarder · Direct HEC HTTPS 8088<br>Ingest Processor · Direct HEC HTTPS 8088<br>Indexer · Direct HEC HTTPS 8088<br>Load Balancer · HEC HTTPS 8088<br>Splunk Cloud indexing · Direct HEC HTTPS 8088 |
| Azure Function | HEC Endpoint · HEC HTTPS 8088<br>Heavy Forwarder · Direct HEC HTTPS 8088<br>Ingest Processor · Direct HEC HTTPS 8088<br>Indexer · Direct HEC HTTPS 8088<br>Load Balancer · HEC HTTPS 8088<br>Splunk Cloud indexing · Direct HEC HTTPS 8088 |
| HEC Endpoint | Heavy Forwarder · HEC-admitted event stream<br>Ingest Processor · HEC-admitted event stream<br>Indexer · HEC-admitted event stream<br>Splunk Cloud indexing · HEC-admitted event stream |
| Syslog Source | Syslog Server · TCP/TLS or UDP<br>Heavy Forwarder · Configured handoff<br>Indexer · Configured handoff<br>Edge Processor · Syslog to Edge Processor<br>Load Balancer · Syslog UDP 514 · TCP 514 |
| HEC Client | HEC Endpoint · HEC HTTPS 8088<br>Heavy Forwarder · HEC HTTPS 8088<br>Ingest Processor · HEC HTTPS 8088<br>Indexer · HEC HTTPS 8088<br>Edge Processor · HEC HTTPS to Edge Processor<br>Load Balancer · HEC HTTPS 8088<br>Splunk Cloud indexing · HEC HTTPS 8088 |
| Syslog Server | Universal Forwarder · File handoff<br>Heavy Forwarder · Configured handoff<br>Indexer · Configured handoff<br>Edge Processor · Syslog to Edge Processor<br>Splunk Cloud indexing · Configured handoff |
| Universal Forwarder | Heavy Forwarder · Splunk-to-Splunk<br>Ingest Processor · Splunk-to-Splunk<br>Indexer · Splunk-to-Splunk<br>Edge Processor · Splunk forwarder to Edge Processor<br>Splunk Cloud indexing · Splunk-to-Splunk |
| Heavy Forwarder | Ingest Processor · Splunk-to-Splunk<br>Indexer · Splunk-to-Splunk<br>Edge Processor · Splunk forwarder to Edge Processor<br>Splunk Cloud indexing · Splunk-to-Splunk |
| Ingest Processor | Amazon S3 · Amazon S3 API<br>Amazon S3 Dataset · HTTPS (Amazon S3 dataset write)<br>Azure Storage Dataset · HTTPS (Azure Blob Storage REST)<br>Splunk Cloud indexing · Configured handoff |
| Indexer | Search Head · Search dispatch |
| Edge Processor | Indexer · Configured handoff<br>Amazon S3 Dataset · HTTPS (Amazon S3 dataset write)<br>Azure Storage Dataset · HTTPS (Azure Blob Storage REST)<br>Splunk Cloud indexing · Configured handoff |
| Splunk Cloud indexing | Search Head · Search dispatch<br>Splunk Cloud Search · Splunk Cloud search<br>Splunk Cloud ES search head · Splunk Cloud search |
| Splunk Cloud ES search head | Splunk SOAR · Cloud · ES findings to SOAR<br>Splunk SOAR · On-premises · ES findings to SOAR |
| Load Balancer | Syslog Server · Syslog UDP 514 · TCP 514<br>HEC Endpoint · HEC HTTPS 8088<br>Heavy Forwarder · Syslog UDP 514 · TCP 514<br>Indexer · Syslog UDP 514 · TCP 514<br>Edge Processor · Syslog UDP 514 · TCP 514 |
| Amazon S3, Search Head, Amazon S3 Dataset, Splunk Cloud Search, Azure Storage Dataset | No list: nothing the Builder allows them to send event data on to |

### Where it opens

- **Below the handle,** level with the card's left edge, so the next column's handles stay clear to connect to.
- **Above the card** when there's no room below.
- **In the vertical layout,** where the next components go below, to the right of the card, or to its left.
- **The first of these with room is used,** moved along its other axis to stay on screen. With no room anywhere, the first is moved onto the screen.
- **It stays on that side** while the canvas pans or zooms, and moves with the card. The side is chosen again when the window is resized.
- **It floats above the canvas,** the docked panels and Focus canvas: `position:fixed`, `z-index:1200`.

### Choosing

- **The component is added on its own, then connected exactly as the handles connect two cards.** So every rule for that link applies:
  - a Load Balancer takes what it serves from its first link;
  - a Splunk Cloud ES search head pairs with SOAR through its own relation;
  - Splunk Cloud indexing takes an Ingest Processor. Its own add, given a sender, checks it against a self-managed Indexer and refuses.
- **One history step,** "Add Heavy Forwarder after Universal Forwarder 1". One Undo removes the component and its link; Redo brings both back.
- **The new card alone is selected, and has focus.** The status line says what was added and how it connects: "Added Heavy Forwarder 2 after Universal Forwarder 1 · Splunk-to-Splunk".
- **Where it goes:**
  - **Auto, horizontal and vertical layouts:** wherever the layout puts a card after its sender.
  - **Free place:** one column (320 px) after the sender, level with it, or the first free place below.
- **The view keeps its zoom,** and the Builder pans to the new card as it does for any add. Splunk Cloud indexing refits the view, as it does when added from the palette.
- **With the Fleet or Access plane chosen,** it is still an event-data link, and the chosen plane is kept.
- **A link the handles refuse leaves nothing added,** with the reason in the status line. No listed choice does this in any check below.

### Closing

| Action | The list | The connection |
|---|---|---|
| Choose a component | Closes | Ends: the component is connected |
| Click another card's Event data handle | Closes | Connects the two, as before |
| Esc, with focus in the list | Closes | Cancelled. Focus goes back to the handle |
| Click the active handle again | Closes | Cancelled, on every card (the reconnect fix) |
| Click anywhere else, or Tab out of the list | Closes | Stays pending, as a click on the canvas leaves it on Build 203 |
| Pan the card right out of the canvas | Closes | Stays pending |
| Open another view | Closes | Stays pending |

### Keyboard

- **Tab** from a card reaches its Event data handle in one step.
- **Enter or Space** on the handle opens the list, with the first choice focused.
- **↓ and ↑** move through the choices, wrapping. **Home and End** go to the first and last.
- **Enter or Space** adds the focused choice, and focus goes to the new card.
- **Esc** closes the list and cancels the connection, with focus back on the handle.
- **The handle** has `aria-haspopup="dialog"` and `aria-expanded`. Its name is "Event data from Universal Forwarder 1 · Production · Sydney: connect it, or add the next component", and its tooltip "Connect event data, or add the next component".
- **The list** has `role="dialog"` and the name "Add after Universal Forwarder 1".

### Reaching the handles

- **A 6 px strip** above the handle row, part of the row, bridges the gap below the card. The pointer never leaves the card's hover on the way down.
- **A card comes to the front** (z-index 4, against every other card's 3) while:
  - the pointer is on it or its handles;
  - one of its handles has keyboard focus;
  - or a connection starts from it.
- **Why the last one:** starting a connection redraws the canvas, and the browser then works out the hover afresh at the still pointer. Without it, the card below takes the hover back, covers the handle again, and a second click on the same handle lands on that card.
- **A card clicked with the mouse** goes back behind its neighbours once the pointer leaves. Only keyboard focus on one of its handles keeps a card in front.
- **`:where()`** keeps the rule below the search, statistics and drag highlights (z-index 9, 18 and 8).

**The trade-off:**
- While a card is in front, its handle row covers the top of the card directly below, as draw.io's hover arrows sit over neighbouring shapes.
- That row is 25 px for one row of handles. Universal Forwarder 1 has Event data, Fleet management and Interactive authentication handles on three rows, 103 px.
- **So where cards are stacked tightly, moving straight down from a card and clicking the title of the card below lands on one of the upper card's handles**, which starts a connection from it and opens its list. The handles are drawn there, in front, so the click lands on what's shown. Esc, or a second click on that handle, cancels.
- **Coming from the side, or clicking lower on the card, reaches it** as on Build 203.
- Every pair of cards where the upper card's handle row reaches more than 14 px over the lower card's title, on three topologies in three layouts. The pointer goes to the upper card, then either straight down to the lower card's title or in from 70 px to its left, then clicks:

| Topology, layout | Cards whose handle row reaches over the next card’s title | Straight down, Build 203 | Straight down, with the block | From the side, Build 203 | From the side, with the block |
|---|---|---|---|---|---|
| default vertical | 1 | 1 the lower card | 1 a handle of the upper card | 1 the lower card | 1 the lower card |
| reference horizontal | 3 | 3 the lower card | 3 a handle of the upper card | 3 the lower card | 3 the lower card |
| reference vertical | 6 | 6 the lower card | 6 a handle of the upper card | 6 the lower card | 6 the lower card |
| reference free | 12 | 12 the lower card | 12 a handle of the upper card | 12 the lower card | 12 the lower card |
| zones horizontal | 3 | 3 the lower card | 3 a handle of the upper card | 3 the lower card | 3 the lower card |
| zones vertical | 7 | 7 the lower card | 7 a handle of the upper card | 7 the lower card | 7 the lower card |
| zones free | 14 | 14 the lower card | 14 a handle of the upper card | 14 the lower card | 14 the lower card |

- **The lasting fix is room under each card for its handles,** a layout change of its own (see "Found while testing").

### The palette's "Compatible next component"

- **The same choices** as the handle's list, for the selected component.
- **Its buttons add the same way:** connected, selected, one history step.
- **That fixes the palette's faults under "Why":** no Indexer after an Ingest Processor, Splunk Cloud indexing offered, a Load Balancer that serves what its first link carries, and SOAR connected to the ES search head.

### Unchanged

- **The Fleet management and Interactive authentication handles:** they start connections as before, with no list.
- **Presentation mode,** which hides the handles.
- **Phones:** the handles are always shown below the card there, and the list fits on a 400 px screen.
- **Every other view.**

## How the block works

- **`nextTypes(source)`:** the list's types, as above.
- **`protocolFor(source, type)`:** `builderHandoff(source, candidate)`.
  - The candidate is a new node of that type, `{id:-1, transport:'Automatic', …}`.
  - For Splunk Cloud indexing the candidate is `{type:'idx', hosting:'splunkCloud'}`.
  - For a Load Balancer, `lbServes` is set as its first link would set it.
- **`addNext(sourceId, type)`:**
  1. Holds history with `builderHistory.suppress++`.
  2. Calls `addBuilderNode(type, null)`.
  3. Sets `state.builderConnectionDraft={plane:'data', sourceId}` and calls `beginBuilderConnection('data', newId)`, the handles' own path.
  4. If `builderTraceEdges('data')` has no link from the sender to the new node, calls `restoreBuilderHistorySnapshot(before)`.
  5. Otherwise: the Free place position; then `builderSelected`, `builderSelectedEdge=null` and `builderMultiSelected=[newId]`; one `commitBuilderHistory`; the status line; a redraw; focus.
- **Wraps:**
  - **`beginBuilderConnection`:** a click on the active handle cancels before the change-impact preview sees it. After every other call, it opens the list if a data connection started from that card, and closes it otherwise.
  - **`renderBuilder`:** closes the list when the connection ends or the Builder isn't showing; otherwise places it again.
  - **`applyBuilderViewport`:** places it again.
  - **`switchView`:** closes it.
  - **`connectionHandle`:** the attributes and wording above. Whether a type can send to anything is worked out once per type and kept, so a redraw costs nothing more. Working out every card's list on every redraw would cost about 3 ms on the reference topology.
  - **`renderPaletteSuggestions`:** its buttons call `addNext`.
- **Replaces `paletteCompatibleTypes`** with `nextTypes` for the selected component.
- **Listeners:**
  - `keydown` on `window`, capture phase, for Esc in the list. It runs before the Builder's own Esc handling, which closes the panels (the docked palette and Inspector count as open) and moves focus out of the list, and it stops that handling.
  - `resize` on `window`.
  - `pointerdown` on `document`, capture phase: a press outside the list and the handles closes it.
- **The styles:**
  - the list;
  - the bridge, `.topologyBuilder .unifiedNodeWrap>.builderConnectionHandles::before`;
  - the front rule, `.unifiedNodeWrap:where(:hover,:has(>.builderConnectionHandles :is(.connectionHandle.active,:focus-visible))){z-index:4}`. The source handle already has the class `active` during a connection (`connectionHandle`).
- **Until a list opens it adds nothing to a redraw** but the handle's markup, and the styles cost nothing measurable (check 1).

## Build records

After the block pair:
- **`changeRegister`,** group "Explorer foundations":
  `['Add the next component from a handle','Clicking a card’s Event data handle lists the components it can send event data to, each with the protocol its link will carry. Choosing one adds it after the card, already connected, in one undo step. A card’s handles stay shown on the way to them and come in front of the card below, and clicking the active handle again cancels the connection.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`,** the page title and the ⓘ text prefix, as Build 203 did.

## Found while testing (not changed)

1. **Esc doesn't cancel a pending connection outside the list.**
   - On Build 203, Esc clears the selection, and at 1024 px closes the Inspector drawer too. The connection stays pending.
   - With the block, Esc cancels while the list is open. Once the list has closed, Esc is as on Build 203.
   - The other ways out are the active handle, now fixed, and the Inspector's Cancel connection.
2. **New Splunk-to-Splunk links get port 0.**
   - `inferredRelationshipPort` infers the port from the protocol's text, and "Splunk-to-Splunk" doesn't contain 9997.
   - So a new Universal Forwarder → Heavy Forwarder or Indexer link has port 0 in its details, on Build 203 too.
   - A one-line fix: return 9997 for text containing "splunk-to-splunk".
3. **"Configured handoff"** is the label for many pairs, among them:
   - Syslog Source → Heavy Forwarder or Indexer;
   - Syslog Server → Heavy Forwarder, Indexer or Splunk Cloud;
   - Edge Processor → Indexer or Splunk Cloud;
   - Ingest Processor → Splunk Cloud;
   - API Collector → HEC Endpoint.

   It is `builderHandoff`'s fallback. The list shows it because the link will carry it; naming those protocols is a job of its own.
4. **After an add, the selection tick stays on the card selected before.**
   - Build 203's adds set `builderSelected` to the new card but leave `builderMultiSelected` as it was.
   - `decorateMultiSelection` then puts the green tick and border on the old card.
   - The block clears it for its own adds; the palette's other adds still leave it.
5. **Syslog Source → Splunk Cloud indexing:** the capability check allows it and validation rejects it. The handles still connect the two, on Build 203 and with the block; the list doesn't offer it.
6. **Free place leaves 6 px between stacked cards.** A handle row needs 30 px: 25 for the row and 5 for the gap. With the block the card under the pointer comes to the front; more room between rows would end the overlap.

## Check before uploading

All in the Builder at 1440 × 900, docked, on the reference topology (`docs/mockups/ov1-reference-topology.json`) at zoom 100%, unless stated. "Build 203" is the comparison: each check ran on Build 203 and on Build 203 with the block pair.

### 1. Regression

- 0 `pageerror` events in every check below, from 400 to 1920 px.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 203 on three topologies: 87 of 87.
  - the default;
  - reference: `docs/mockups/ov1-reference-topology.json`;
  - zones: `docs/mockups/sv-zones-topology.json`.
- **The menu bar's 69 actions** give the same results as on Build 203: 69 of 69 pass on both.
- **The three repo tools:**
  - `tools/builder-space-check.js` and `builder-connector-check.js` print the same output as on Build 203.
  - `tools/builder-perf-check.js` gives the same redraw times, within this container's run-to-run noise. Eight rounds on each page, alternating which runs first. Each figure is the median, over the rounds, of each round's slowest median (a moved card, a changed or an unchanged redraw):

    | Scenario | Budget | Build 203 | With the block |
    |---|---|---|---|
    | default | 40 ms | 63.5 ms | 59 ms |
    | fan5 | 50 ms | 72.5 ms | 71.5 ms |
    | fan8 | 80 ms | 100.5 ms | 122.5 ms |
    | reference | 120 ms | 134.5 ms | 136 ms |

    - Both pages are over every budget here. This container ran slower than for the Build 203 recheck, where Build 203's default was 36.5 ms.
    - fan8 varies most: from 92 to 147 ms with the block, and from 96 to 144 ms on Build 203. Measured in one page (next), the block adds nothing to fan8, so its higher median here is noise between fresh pages.
- **The block's own cost, measured in one page:**
  - **The styles**, switched off and on between redraws: 24 rounds, each variant in turn, 72 timed redraws per variant after a warm-up. The median redraw changed by +0.6 ms on fan8 (94 ms), +2.1 ms on the reference topology (98 ms) and +2.3 ms on it in Free place (108 ms). Two variants that differ by one rule differed by up to 4 ms in the same run, so these are within noise.
  - **The script**, in a copy of the block that exposes the functions it wraps, switched to the originals and back between rounds: 24 rounds, 72 timed redraws each way, the perf tool's four scenarios, run twice.
    - Plain redraws, and redraws while a card moves, changed by between −3.7 and +2.9 ms, with no consistent sign.
    - Once by +6.3 ms (reference, a card moving), which the second run didn't repeat: +0.9 ms.
  - **The handles' markup,** the script's only work on a redraw, timed alone: 0.28 to 0.35 ms for every card's three handles on the reference topology, against 0.15 to 0.18 ms on Build 203.

### 2. The lists

- **Every component type with an Event data handle** was added on its own, in view, and its handle clicked. The lists are the table under "The list".
- **All 88 choices in those lists were then added from the list,** one at a time:
  - every one connected from its sender, its link labelled as the list showed;
  - in one history step named "Add … after …";
  - with no validation error naming the new component, and no page errors.
- **The reference topology:**

  | Card | Its list |
  |---|---|
  | Universal Forwarder 1 | Heavy Forwarder, Ingest Processor, Indexer and Splunk Cloud indexing, each Splunk-to-Splunk; Edge Processor, "Splunk forwarder to Edge Processor" |
  | Firewalls and network devices (a Syslog Source) | Syslog Server, Heavy Forwarder, Indexer, Edge Processor, Load Balancer |
  | Syslog Server 1 | Universal Forwarder, Heavy Forwarder, Indexer, Edge Processor, Splunk Cloud indexing |
  | Heavy Forwarder 1 | Ingest Processor, Indexer, Edge Processor, Splunk Cloud indexing |
  | Indexer 1 | Search Head |
  | Search Head 1 | No list. The click starts a connection, as on Build 203 |
  | An Ingest Processor, added | Amazon S3, Amazon S3 Dataset, Azure Storage Dataset, Splunk Cloud indexing; no Indexer |

### 3. Adding

| Check | With the block |
|---|---|
| Universal Forwarder 1's handle clicked | The list opens below the handle, with Heavy Forwarder focused; the connection is pending; the handle has `aria-expanded="true"` |
| Heavy Forwarder chosen | Heavy Forwarder 2, its sender Universal Forwarder 1, link "Splunk-to-Splunk". It alone is selected, and has focus. The list is closed and the connection over. Status: "Added Heavy Forwarder 2 after Universal Forwarder 1 · Splunk-to-Splunk" |
| History | One step, "Add Heavy Forwarder after Universal Forwarder 1". Undo removes it; Redo brings it back connected |
| The view | Zoom kept at 100%; the Builder panned 46 px to show the new card, as for any add |
| Each of Universal Forwarder 1's other four choices | Added and connected in one step, with no validation error. Splunk Cloud indexing is an Indexer hosted in Splunk Cloud |
| An Ingest Processor → Splunk Cloud indexing | "Splunk Cloud", connected, "Configured handoff", owner "Splunk Cloud provider", one step; Undo and Redo work. Build 203's own add refuses this pair |
| Splunk Cloud indexing added | The view is fitted to the topology (zoom 100% → 39%), as when the palette adds it on Build 203 |
| Free place: Universal Forwarder 1 → Indexer, twice | The first at (1008, 1474): one column after Universal Forwarder 1 at (688, 978), at the first free place, as the next column has cards level with it. The second at (1008, 1722), below the first. No cards overlap |
| Vertical layout | The list opens to the right of the card, in view; the new card goes below its sender, connected |
| Focus canvas | The list shows above the canvas and adds as usual |
| 400 × 860, touch | The list fits on the screen and adds |
| The Fleet plane chosen | The add still makes an event-data link, and the Fleet plane stays chosen |
| A choice the handles refuse when it is clicked (the check made to refuse it after the list opened) | Nothing added, no history step; the status line gives the reason; the list closes |

### 4. The palette's list

| | Build 203 | With the block |
|---|---|---|
| An Ingest Processor selected | Indexer, Amazon S3, Amazon S3 Dataset, Azure Storage Dataset. Indexer is refused when clicked | Amazon S3, Amazon S3 Dataset, Azure Storage Dataset, Splunk Cloud indexing. Splunk Cloud indexing adds connected, in one step |
| A new Load Balancer selected; HEC Endpoint clicked | Connected, but the Load Balancer still serves syslog: "Load Balancer 1 serves Syslog receivers, so it can't take HEC Endpoint 1" | Connected; the Load Balancer serves HEC; no validation error |
| A Splunk Cloud ES search head selected; Splunk SOAR · Cloud clicked | Added, not connected | Added and connected: "ES findings to SOAR" |

### 5. Closing

| Check | Build 203 | With the block |
|---|---|---|
| With Syslog Server 2's list open, click Universal Forwarder 1's Event data handle | | Syslog Server 2 → Universal Forwarder 1 is connected, a second incoming link as Build 203 makes it; the list closes; nothing is added |
| Click Universal Forwarder 1's active handle again | The "Reconnect Universal Forwarder 1" preview; the connection stays pending. Confirming it changes nothing, and cancels | "Connection cancelled"; no preview; the list closes |
| The same on Firewalls and network devices, which has no incoming link | "Connection cancelled" | "Connection cancelled" |
| Esc, at 1440 px | The selection is cleared; the connection stays pending | The list closes, the connection is cancelled, focus is on the handle; the docked palette and Inspector stay open |
| Esc, at 1024 px | The Inspector drawer closes and the selection is cleared; the connection stays pending | As at 1440 px; the Inspector drawer stays open |
| A click on empty canvas | The connection stays pending | The same; the list closes |
| The card panned right out of the canvas | | The list closes; the connection stays pending |
| `switchView('ov')`, as a shortcut does, or Enter on the OV tab | | The list closes |
| A click on the list's heading or footer | | Focus stays in the list: ↓ reaches the first choice, and Esc cancels |

### 6. Keyboard

- **Tab** from Universal Forwarder 1's card reaches its Event data handle in one step.
- **Enter** opens the list with Heavy Forwarder focused. Then:
  - ↓ goes to Ingest Processor; End to Splunk Cloud indexing;
  - ↓ wraps to Heavy Forwarder; ↑ ↑ goes to Edge Processor;
  - Enter adds Edge Processor after Universal Forwarder 1, and focus goes to the new card.
- **17 keys pressed with the list focused:** only Enter and Space act, adding the focused choice. ← → Delete Backspace f ? + − 0 1 a change nothing in the Builder: the same view, selection, components, panels and history.
- **The accessible names and states:**

  | | Name | `aria-haspopup` | `aria-expanded` |
  |---|---|---|---|
  | Universal Forwarder 1's Event data handle | "Event data from Universal Forwarder 1 · Production · Sydney: connect it, or add the next component" | `dialog` | `false`; `true` while the list is open, also after a redraw; `false` again once it closes |
  | Search Head 1's Event data handle | "Connect event data for Search Head 1 · Production · Multisite", as on Build 203 | none | none |

### 7. Reaching the handles

| Check | Build 203 | With the block |
|---|---|---|
| The pointer moved down 1 px at a time from the card's middle to its Event data handle, then clicked: Universal Forwarder 1, Heavy Forwarder 1 and Indexer 1, in the horizontal, vertical and Free place layouts | The handles hide at the card's bottom edge; 0 of 9 clicks start a connection | Shown all the way; 9 of 9 open the list |
| The pointer on each card at zoom 100%, its Event data handle hit-tested at five points across it: 3 topologies × 3 layouts, 87 handles | 13 can't be clicked: 6 of 11 on the reference topology in Free place; on the zones topology 1 of 14 in the vertical layout and 6 of 14 in Free place | 0 can't be clicked |
| Free place: Universal Forwarder 1's handle, Universal Forwarder 2 6 px below | A click lands on Universal Forwarder 2 | The list opens |
| Free place: Tab to Universal Forwarder 1's handle | The handle is under Universal Forwarder 2 | In front; behind again once focus moves to Universal Forwarder 2 |
| Free place: click Universal Forwarder 1's card, then move the pointer away | | Back behind its neighbours (z-index 3), though it keeps focus |

The trade-off is measured under "Reaching the handles".

### 8. Where the list opens

- **30 cases:** 1440 × 900, 1024 × 768 and 400 × 860 (touch), in the horizontal and vertical layouts, with Universal Forwarder 1 at five places on the canvas.
  - The list is always fully on screen.
  - It never covers its own card while there's room elsewhere. The one case with no room is 400 × 860, vertical layout, card at the top left, where it covers the card.
- **Panning 60 px right and 30 px down:** the list moves with the card and stays below it, kept on screen.
- **Panning the card out of the canvas** closes the list; the connection stays pending.


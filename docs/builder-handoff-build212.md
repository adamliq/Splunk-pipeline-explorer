# Builder handoff: Build 212 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 212 (`c7d7c4f`). One build since Build 211 (`7d0dfed`):

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 212 | `c7d7c4f` | Clicking a link's label or issue badge ([`builder-handoff-link-label-clicks.md`](builder-handoff-link-label-clicks.md)) | The five in-place edits are the handoff's. The build records are in a script of their own, `link-label-clicks-records-v212`. Without that script, Build 212 is byte for byte the page the handoff was tested on |

Nothing else in `index.html` changed.

**Result:**
- Build 212 works as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 212.
- Nothing is handed off and waiting to be built. What's left is under "Still open".

**Tested with:**
- the link label clicks handoff's own 15 checks, rerun on Build 212 with the script that tested the edits, against Build 211;
- the toolbar, lanes and labels handoff's 42 checks, against Build 210, and the room-and-header handoff's 40, against Build 209;
- the quick fixes' 27 checks, the move-tools handoff's 37, the five fixes' 49 and the small fixes' 44;
- every view's text against Build 211;
- the OV pages and Validate on the default, reference and zones topologies;
- the Config view's 49 checks, adding the next component from a handle (58), the menu bar's 69 actions, the Parsing laboratory's 68 examples and the canvas chips;
- the two repo tools.

## Build records

| | Build 212 |
|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 212 · 25 Oct 2026 |
| `changeRegister` entry | "Clicking a link's label or issue badge", in "Explorer foundations", with the handoff's text, word for word |

- The entry shows in the Changes view: 211 implemented of 226 tracked, and Explorer foundations 178 of 178.
- 0 `pageerror` events and 0 console errors on loading the build, at 1,440 px, at 1,024 px and on a phone.

## Clicking a link's label or issue badge, on Build 212

| Check | Build 212 |
|---|---|
| The handoff's 15 checks | 15 of 15 pass. The output is the tested page's, line for line |
| Labels | A click on a link's label selects the link, shows it in the Inspector and draws it as selected: 8 of 8 at 1,440 px in the reference topology, and 9 of 9 in the zones topology, the additional data link among them; 8 of 8 at 1,024 px, the Inspector opening over the canvas (Build 211: none). A tap on a phone selects, as before |
| Badges | 11 of 11 select their link, show it in the Inspector and open its findings beside the badge, at 100 % and zoomed out to fit, and 14 of 14 in the zones topology. At 1,024 px the findings stay uncovered, with the Inspector left closed; opening it shows the link (Build 211: none) |
| Presses and drags | A click whose pointer moves 2 px selects the link and adds nothing to the undo history (Build 211: the label moved 2 px). A press that moves 4 px is a drag, which Undo puts back. A 60 px drag ends where Build 211's does |

## Regression

- **0 `pageerror` events** in every suite that listens for them: all but the toolbar, lanes and labels handoff's label checks.
- **The toolbar, lanes and labels checks:** 42 of 42, against Build 210. **The room-and-header checks:** 40 of 40, against Build 209.
- **The quick fixes:** 27 of 27. **Moving the rest of Tools:** 37 of 37. **The five fixes:** 49 of 49. **The small fixes:** 44 of 44.
- **Every view's text against Build 211:** 95 of 97 views the same. The other two differ only as the build records say:
  - the Changes view: the new entry, and its counts;
  - OV: "Build 212" in its header and footer.
- **The OV workspace pages and Validate,** with build stamps set aside: 87 of 87 the same against Build 211, on the default, reference and zones topologies. The view-text suite, which keeps the stamps, finds "Build 212" for "Build 211" on 84 of them, and nothing else.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 55 of 58, as on Build 211: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58.
- **The menu bar's 69 actions:** 69 of 69.
- **The Parsing laboratory's examples:** 68 of 68. "Click to next frame" for fixed-length records took 168 ms (limit 1,000).
- **The canvas chips and container names:** all 123 card views are the same as on Build 211, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output as on Build 211.
- **Apart from the build records and the timing,** every suite above prints what it printed for the page the handoff was tested on, line for line.

## Still open

### Fixes not done yet

Numbered as in the list of fixes made after Build 205. Items 1 to 9 and 11 to 14 are done, in Builds 206 to 210.

| # | Fault | What the fix takes |
|---|---|---|
| 10 | Builder redraw speed. On Build 205, each redraw made 141 page-wide lookups, each walking the hidden Flow and Matrix views first | Scoping the lookups to `#topologyBuilder`, or keeping the elements that never change. Mechanical but broad: 194 lookups, 127 of them for four Builder elements |

### Found since, not done

Items 15, 16 and 19 are done, in Build 209, 18, 25 and 26 in Build 211, and 34 in Build 212. Items 35 to 37 are new, from the link label clicks handoff's "Found while testing"; they show on Build 212 as they did on Build 211.

| # | Fault | Found by |
|---|---|---|
| 17 | `[source::]` matching doesn't consider a monitor's `whitelist` and `blacklist` | The five fixes |
| 20 | Phones keep the older controls: the menu bar was never designed for phone widths | The menu bar |
| 21 | Syslog and search dispatch links still get port 0. Syslog usually uses 514, or 6514 with TLS, and a search head reaches its indexers on their management port, 8089 | The quick fixes |
| 22 | With a mouse, the handle rows of the card under the pointer cover the card below: the Event data row covers 6 px of it in the horizontal and vertical layouts, whose rows are 24 px apart, and Fleet and Access rows reach up to 108 px in any layout | Room on the canvas |
| 23 | In Free place, cards already placed, by hand, a saved layout or a file, aren't moved, so a container's name there can still sit under a card | Room on the canvas |
| 24 | On a touch screen, a dropped card and add-next keep 30 px below the card above, whose handle rows can reach 109 px | Room on the canvas |
| 27 | On a phone, the room for a container's name reads the card above as last drawn, so it can be short for one redraw if that card's height changes | Room on the canvas |
| 28 | Isolate by region or environment throws "Assignment to constant variable." as soon as the isolation hides a card that a link joins, at any width, and the links to hidden cards stay drawn. In the reference topology, isolating the region AWS ap-southeast-2 shows 1 card and all 12 of its links to hidden cards; by environment, the same once a card is in a second environment. In `applyLargeTopologyNavigation` (`builder-large-topology-navigation`, line 2736), `involved` is declared with `const` and then set to `true` for such a link. Declaring it with `let` fixes it: tried on Build 211, no error, and none of the 12 links drawn | The toolbar, lanes and labels |
| 29 | Zoomed out, issue badges can overlap each other: Build 164 puts every badge on its link's midpoint, and links that share a stretch share a midpoint. 6 places over the handoff's 21 cases (Build 210: 7) | The toolbar, lanes and labels |
| 30 | Build 156 measures a card's issue badges from the screen, divided by the zoom setting (`nodeBadges`, line 7874). During a redraw the setting and the canvas's scale can differ | The toolbar, lanes and labels |
| 31 | Build 151 raises canvas text under 11.5 px to 11.5 px after the redraw (`polishBuilderText`, line 8057), so anything measured during a redraw sees text at its first size. Build 211 draws a container's name at its final size from the start; other text may have the same issue | The toolbar, lanes and labels |
| 32 | On a phone, Group by: Region or Environment lanes overlap. The phone's one column keeps cards in tier order, not by region, so a region's lane runs round other regions' cards, and four region titles sit under a card | The toolbar, lanes and labels |
| 33 | On a touch screen, in the vertical layout, a card's handle rows, which always show, reach over the card below, up to 109 px, and over the title of the Tier lane below: four of the six on a phone. Type headers and the room for labels allow for the rows; Tier titles don't | The toolbar, lanes and labels |
| 35 | Dragging a label moves it by its first step only: a 60 px drag moves it 3 px, on Builds 209 to 212. The drag keeps the link's routing record from the press, and `ensureRelationshipRouting` (`builder-relationship-routing-controls`, line 2561) puts a fresh copy in its place each time it's called, which the first move's route does; later moves change the old copy | The link label clicks |
| 36 | Dragging an additional data link's label moves nothing, yet records "Move connector label" in the undo history. The press finds its link with a numeric id (`builderEdgeRecord(plane, Number(id))`), and an additional link's id is text, such as "data-rel-1" | The link label clicks |
| 37 | A card's issue badge selects the card without showing it: the card's findings open, and the Inspector and the canvas show the card only at the next redraw. A link's badge selects and shows its link since Build 212 | The link label clicks |

### Left as they are by design

- "Configured handoff" labels many pairs (the add-next handoff).
- The add-next list's own exclusion of Splunk Cloud indexing after a Syslog Source is now redundant, and harmless (the five fixes).
- On a phone, a long name is cut inside the connection template's selects, and shows in full when a select is opened (moving the rest of Tools).
- A port stored in a file stays, 0 included. The reference topology's Universal Forwarder 1 → Indexer 1 keeps 0, and its configuration draft asks to confirm it (the quick fixes).
- Converting an Indexer fed straight by a Syslog Source is allowed. Build 148 flags the result, and "Insert Syslog Server between them" fixes it (the quick fixes).
- Below 1,280 px, Esc with the Inspector open over the canvas clears the selection, which closes the Inspector (the quick fixes).
- Where rows move to make room above a group's header, Build 156 can route other links through the wider gap. Over the handoff's 21 cases, 70 of 252 labels show just their issue badge, with their text on hover, against 67 on Build 210 (the toolbar, lanes and labels).

### The Config view

- Search-time precedence on a search head follows app context; the view uses the global order.
- The path presets don't name search time.
- The Builder's search heads are separate from the strip's Search Head.

### The draw.io suggestions not built yet

Labelled as in the look at them after Build 211.

| # | Suggestion | Size |
|---|---|---|
| D1 | Page tabs along the bottom for versions of a topology, such as Current, Increment 2 and Target, each a full topology in the same file, with a way to compare two | Large |
| D2 | Layers: on the Data, Fleet and Access chips, Lock (no new or edited links on that plane, its handles hidden) and Draw on this plane (only that plane's handle rows, and a card dropped on another links them on it) | Medium |
| D3 | A light canvas. The app is dark only; a Light or Dark choice for Export SVG and PNG first | Large; light export small to medium |
| D4 | The palette: hiding groups you don't use; icon tiles, once there are icons | Small to medium |
| D5 | Preset zoom levels on the zoom readout: 50 to 200 %, Fit and Zoom to selection | Small |
| D6 | Small jumps where links cross, on screen and in exports. Prototyped against Build 212: [`builder-handoff-line-jumps.md`](builder-handoff-line-jumps.md) | Medium |
| D7 | Keyboard shortcuts in every toolbar tooltip and on the search box, and every key in the help | Small |

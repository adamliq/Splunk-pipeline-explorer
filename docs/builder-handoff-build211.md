# Builder handoff: Build 211 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 211 (`7d0dfed`). One build since Build 210 (`cc76f87`). The upload between them, `4b3aa09`, changed nothing.

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 211 | `7d0dfed` | The toolbar on one row, Group by lanes that reach their cards, and labels clear of group headers ([`builder-handoff-toolbar-lanes-labels.md`](builder-handoff-toolbar-lanes-labels.md)) | The style block and the script are identical to the prototype's files, and the in-place edit is the handoff's. The build records are in a script of their own, `toolbar-lanes-labels-records-v211`. Without that script, Build 211 is byte for byte the page the handoff was tested on |

Nothing else in `index.html` changed.

**Result:**
- Build 211 works as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 211.
- Nothing is handed off and waiting to be built. What's left is under "Still open".

**Tested with:**
- the toolbar, lanes and labels handoff's own 42 checks, rerun on Build 211 with the script that tested the prototype, against Build 210;
- the room-and-header handoff's 40 checks, against Build 209;
- the quick fixes' 27 checks, the move-tools handoff's 37, the five fixes' 49 and the small fixes' 44;
- every view's text against Build 210;
- the OV pages and Validate on the default, reference and zones topologies;
- the Config view's 49 checks, adding the next component from a handle (58), the menu bar's 69 actions, the Parsing laboratory's 68 examples and the canvas chips;
- the two repo tools.

## Build records

| | Build 211 |
|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 211 · 24 Oct 2026 |
| `changeRegister` entry | "The toolbar on one row, and Group by lanes and labels that fit", in "Explorer foundations", with the handoff's text, word for word |

- The entry shows in the Changes view: 210 implemented of 225 tracked, and Explorer foundations 177 of 177.
- 0 `pageerror` events and 0 console errors on loading the build, at 1,440 px, at 1,024 px and on a phone.

## The toolbar, lanes and labels, on Build 211

| Check | Build 211 |
|---|---|
| The handoff's 42 checks | 42 of 42 pass. The output is the tested page's, line for line |
| 18. The toolbar | In the Matrix view, from 821 to 1,300 px, one row, 73 px tall, showing 8, 7, 7, 6, 5, 3, 3, 2 and 2 views, then More (Build 210: two rows at all nine widths, 129 px at 1,024). The search box is 257 to 343 px wide and the filter 248 px, and nothing scrolls sideways. From 1,310 px, and at 820 px and below, as Build 210. More, its menu, choosing a view from it, Enter, Esc and a click elsewhere work as the handoff says, and the Builder and OV keep their own toolbars |
| 25. Group by | At 1,440 px every Tier, Region and Environment lane ends 18 px below its lowest card, and every Component type box 10 px below, with no title or header under a card (Build 210: the Management band ends 31 px above its cards' bottoms and the boxes 39 px above, and 6 headers and 3 titles sit under a card). On a 390 px phone, the same for Tier and Component type, and no header is under a card or its handle rows. With no Group by and no container, every card is where Build 210 puts it |
| 26. Route labels | Over the handoff's 21 cases at 100 %, 0 labels with text under a container's name, a collapse button or a type header (Build 210: 13), 0 issue badges under one (3) and 0 on another link's label (1). Zoomed out to fit, 0 badges under one (5). In the case reported, "Direct HEC HTTPS 8088" shows its text 10 px above the container's name (Build 210: 19 px into it), and the name is drawn at 11.5 px |

## Regression

- **0 `pageerror` events** in every suite that listens for them: all but the handoff's label checks.
- **The room-and-header checks:** 40 of 40, against Build 209.
- **The quick fixes:** 27 of 27. **Moving the rest of Tools:** 37 of 37. **The five fixes:** 49 of 49. **The small fixes:** 44 of 44.
- **Every view's text against Build 210:** 95 of 97 views the same. The other two differ only as the build records say:
  - the Changes view: the new entry, and its counts;
  - OV: "Build 211" in its header and footer.
- **The OV workspace pages and Validate,** with build stamps set aside: 87 of 87 the same against Build 210, on the default, reference and zones topologies. The view-text suite, which keeps the stamps, finds "Build 211" for "Build 210" on 84 of them, and nothing else.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 55 of 58, as on Build 210: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58.
  - In that run, in the vertical layout, the list opened 2 px higher than on the tested page (271 against 273 px), still beside the card and in view.
  - The same check gave 273 px in the run before it. Run again alone, the suite prints the tested page's output, line for line.
- **The menu bar's 69 actions:** 69 of 69, with the same output as the tested page.
- **The Parsing laboratory's examples:** 68 of 68. "Click to next frame" for fixed-length records took 242 ms (the tested page: 229; limit 1,000).
- **The canvas chips and container names:** all 123 card views are the same as on Build 210, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output as on Build 210.
- **Apart from the build records, the timing and that 2 px,** every suite above prints what it printed for the page the handoff was tested on, line for line.

## Still open

### Fixes not done yet

Numbered as in the list of fixes made after Build 205. Items 1 to 9 and 11 to 14 are done, in Builds 206 to 210.

| # | Fault | What the fix takes |
|---|---|---|
| 10 | Builder redraw speed. On Build 205, each redraw made 141 page-wide lookups, each walking the hidden Flow and Matrix views first | Scoping the lookups to `#topologyBuilder`, or keeping the elements that never change. Mechanical but broad: 194 lookups, 127 of them for four Builder elements |

### Found since, not done

Items 15, 16 and 19 are done, in Build 209, and 18, 25 and 26 in Build 211. Items 28 to 33 are new, from the toolbar, lanes and labels handoff's "Found while testing". Build 211 runs the code they were found on, and item 28 was tried again on it. Item 34 was found after the recheck, checking how a link is selected.

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
| 34 | With a mouse, clicking a link's label, or the issue badge on it, does nothing: the link isn't selected, the Inspector doesn't show it, and the badge's findings don't open. Clicking the line itself works, and so does tapping a label on a phone. On Build 211 at 1,440 px, 0 of 8 label clicks and 0 of 11 badge clicks selected their link (zoomed out, 0 of 11 badges); Build 210 the same. Pressing a label starts a label drag (`builder-relationship-routing-controls`, line 2577), and its release always redraws the canvas, even when the label didn't move, so the label is replaced before the click reaches it. The badge sits inside the label, so a press on it starts the same drag. Tried on Build 211: redrawing only when the label moved, and leaving presses on a badge to the badge, makes 8 of 8 label clicks select their link and 11 of 11 badge clicks open its findings, at 100 % and zoomed out, with dragging a label as before | Checking link selection |

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

1. **Page tabs along the bottom** for versions of a topology, such as Current, Increment 2 and Target.
2. **A layers panel** in place of the Data, Fleet and Access toggles: show and hide, a lock, and "new links go on this layer".
3. **Smaller touches:**
   - a light canvas in light mode;
   - icon tiles in the palette, and a way to hide groups you don't use;
   - preset zoom levels on the zoom readout;
   - small jumps where links cross;
   - keyboard shortcuts in tooltips.

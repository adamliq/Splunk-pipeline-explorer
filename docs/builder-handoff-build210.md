# Builder handoff: Build 210 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 210 (`cc76f87`). One build since Build 209 (`cdc0580`):

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 210 | `cc76f87` | Room on the canvas, and a Matrix header that follows the page ([`builder-handoff-room-and-header.md`](builder-handoff-room-and-header.md)) | The style block and the script are identical to the prototype's files, and the four in-place edits are the handoff's. The build records are in a script of their own, `room-and-header-records-v210`. Without that script, Build 210 is byte for byte the page the handoff was tested on |

Nothing else in `index.html` changed.

**Result:**
- Build 210 works as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 210.
- Nothing is handed off and waiting to be built. What's left is under "Still open".

**Tested with:**
- the room-and-header handoff's own 40 checks, rerun on Build 210 with the script that tested the prototype, against Build 209;
- the quick fixes' 27 checks, the move-tools handoff's 37, the five fixes' 49 and the small fixes' 44;
- every view's text against Build 209;
- the OV pages and Validate on the default, reference and zones topologies;
- the Config view's 49 checks, adding the next component from a handle (58), the menu bar's 69 actions, the Parsing laboratory's 68 examples and the canvas chips;
- the two repo tools.

## Build records

| | Build 210 |
|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 210 · 24 Oct 2026 |
| `changeRegister` entry | "Room on the canvas, and a Matrix header that follows the page", in "Explorer foundations", with the handoff's text, word for word |

- The entry shows in the Changes view: 209 implemented of 224 tracked, and Explorer foundations 176 of 176.
- 0 `pageerror` events and 0 console errors on loading the build, at 1,440 px and on a phone.

## Room on the canvas and the Matrix header, on Build 210

| Check | Build 210 |
|---|---|
| The handoff's 40 checks | 40 of 40 pass. The output is the tested page's, line for line |
| 11. Free place | Cards stacked in a column start at least 30 px apart (Build 209: 6), with the same columns and order, and no Event data row reaches under the card below. A card dropped 20 px under another moves clear; one dropped 40 px under stays. Add-next stacks its second card 254 px down. On a 390 px phone and a 1,024 px touch screen, no card overlaps the next, and each keeps its handle rows' depth and 6 px |
| 12. Container names | In the horizontal and vertical layouts and Free place, at 1,440 px and on a phone, nothing covers the name, and a click on it selects the container. The box reaches 18 px below its lowest card. With no containers, every card is where Build 209 puts it |
| 13. The Matrix header | Scrolled down, the copy shows under the toolbar at 83 px at 1,440 px, 139 at 1,024 and 0 on a phone, in the Matrix and Config views, on the table's columns, also scrolled sideways. The Config view's stage buttons bring the row in below it, on a phone too |

## Regression

- **0 `pageerror` events** in every check.
- **The quick fixes:** 27 of 27. **Moving the rest of Tools:** 37 of 37. **The five fixes:** 49 of 49. **The small fixes:** 44 of 44.
- **Every view's text against Build 209:** 95 of 97 views the same. The other two differ only as the build records say:
  - the Changes view: the new entry, and its counts;
  - OV: "Build 210" in its header and footer.
- **The OV workspace pages and Validate,** with build stamps set aside: 87 of 87 the same against Build 209, on the default, reference and zones topologies. The suite's filter for build stamps knew Builds 195 to 209, so it now takes 210 and up too; before that it counted the new stamp as a change on 84 pages, and nothing else.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 55 of 58. The other 3 expect Free place's old spacing, as the handoff says; expecting the new, 58 of 58.
- **The menu bar's 69 actions:** 69 of 69, with the same output as Build 209.
- **The Parsing laboratory's examples:** 68 of 68. "Click to next frame" for fixed-length records took 353 ms in the run; alone, alternating with Build 209, 320 and 358 ms against 336 and 390 (limit 1,000).
- **The canvas chips and container names:** all 123 card views are the same as on Build 209, with no problems.
- **The repo tools:** `tools/builder-space-check.js` prints the same output as on Build 209. `builder-connector-check.js` prints the same totals, with the two connectors the handoff lists swapping after a drop.
- **Apart from the build records and the timing,** every suite above prints what it printed for the page the handoff was tested on, line for line.

## Still open

### Fixes not done yet

Numbered as in the list of fixes made after Build 205. Items 1 to 9 and 11 to 14 are done, in Builds 206 to 210.

| # | Fault | What the fix takes |
|---|---|---|
| 10 | Builder redraw speed. On Build 205, each redraw made 141 page-wide lookups, each walking the hidden Flow and Matrix views first | Scoping the lookups to `#topologyBuilder`, or keeping the elements that never change. Mechanical but broad: 194 lookups, 127 of them for four Builder elements |

### Found since, not done

Items 15, 16 and 19 are done, in Build 209.

| # | Fault | Found by |
|---|---|---|
| 17 | `[source::]` matching doesn't consider a monitor's `whitelist` and `blacklist` | The five fixes |
| 18 | The toolbar takes two rows from 821 to about 1,310 px | The small fixes |
| 20 | Phones keep the older controls: the menu bar was never designed for phone widths | The menu bar |
| 21 | Syslog and search dispatch links still get port 0. Syslog usually uses 514, or 6514 with TLS, and a search head reaches its indexers on their management port, 8089 | The quick fixes |
| 22 | With a mouse, the handle rows of the card under the pointer cover the card below: the Event data row covers 6 px of it in the horizontal and vertical layouts, whose rows are 24 px apart, and Fleet and Access rows reach up to 108 px in any layout | Room on the canvas |
| 23 | In Free place, cards already placed, by hand, a saved layout or a file, aren't moved, so a container's name there can still sit under a card | Room on the canvas |
| 24 | On a touch screen, a dropped card and add-next keep 30 px below the card above, whose handle rows can reach 109 px | Room on the canvas |
| 25 | Group by: Tier lanes (Build 130's `builderGroupBounds130`, sized for 175 px cards): the Management lane's title sits under a card, and a lane ends 31 px short of its lowest card | Room on the canvas |
| 26 | In the vertical layout, a container's collapse button can cover the end of a route label on the box's top edge | Room on the canvas |
| 27 | On a phone, the room for a container's name reads the card above as last drawn, so it can be short for one redraw if that card's height changes | Room on the canvas |

### Left as they are by design

- "Configured handoff" labels many pairs (the add-next handoff).
- The add-next list's own exclusion of Splunk Cloud indexing after a Syslog Source is now redundant, and harmless (the five fixes).
- On a phone, a long name is cut inside the connection template's selects, and shows in full when a select is opened (moving the rest of Tools).
- A port stored in a file stays, 0 included. The reference topology's Universal Forwarder 1 → Indexer 1 keeps 0, and its configuration draft asks to confirm it (the quick fixes).
- Converting an Indexer fed straight by a Syslog Source is allowed. Build 148 flags the result, and "Insert Syslog Server between them" fixes it (the quick fixes).
- Below 1,280 px, Esc with the Inspector open over the canvas clears the selection, which closes the Inspector (the quick fixes).

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

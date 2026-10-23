# Builder handoff: Build 206 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 206 (`9744327`). One build since Build 205 (`63d5dc4`):

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 206 | `9744327` | The small fixes ([`builder-handoff-small-fixes.md`](builder-handoff-small-fixes.md)) | The style block and the script are identical to the prototype's files, and the three in-place edits are the handoff's. The build records are in a script of their own. Without that script, Build 206 is byte for byte the page the handoff was tested on |

Nothing else in `index.html` changed.

**Result:**
- Build 206 works as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 206.
- **The five fixes** ([`builder-handoff-five-fixes.md`](builder-handoff-five-fixes.md)) aren't in Build 206. Their block and four edits apply to Build 206 unchanged, at the same lines, and pass all their checks there. The handoff is updated to start from Build 206, for Build 207: see "The five fixes, for Build 207".

**Tested with:**
- the small fixes handoff's own checks, rerun on Build 206 with the script that tested the prototype;
- the five fixes handoff's checks, on Build 206 and on Build 206 with the five fixes;
- every view's text against Build 205;
- the OV pages and Validate on the default, reference and zones topologies;
- the Config view's 49 checks, adding the next component from a handle (58), the menu bar's 69 actions, the Parsing laboratory's examples and the canvas chips;
- the three repo tools.

## Build records

| | Build 206 |
|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 206 · 23 Oct 2026 |
| `changeRegister` entry | "Small fixes", in "Explorer foundations", with the handoff's text, word for word |

- The entry shows in the Changes view: 220 entries, 172 of 172 implemented.
- 0 `pageerror` events and 0 console errors on loading the build.

## The small fixes on Build 206

| Check | Build 206 |
|---|---|
| The handoff's 44 checks | 44 of 44 pass. The output is the prototype's, line for line |
| Focus canvas at 1,920, 1,440, 1,280, 1,024 and 800 px | The Inspector and the palette open in front, 8 px below the focus bar (9 at 1,024, from rounding) and 19 px above the bottom controls. Close, adding from the palette, the Inspector button and Exit focus work |
| Sideways scroll | None in the nine views, every 20 px from 320 to 1,480 px, then 1,700 and 1,920 |
| The toolbar | The filter keeps its 248 px from 821 px; one row from 1,320 px |
| The capacity model | server.conf under the other two to 1,080 px, beside them above |
| The Failure Lab at 400 px | No sideways scroll; the map scrolls in its own box |
| The two labels | The help card says "Shift+Space extend selection"; Build 140's hidden label reads "● Saved" after a save |

## Regression

- **0 `pageerror` events** in every check.
- **Every view's text against Build 205:** 94 of 97 views the same. The other three differ only as the handoff and the build records say:
  - the Builder: the help card's "Shift+Space extend selection";
  - the Changes view: the new entry, and its counts, 220 entries and 172 of 172 implemented;
  - OV: "Build 206" in its header and footer.
- **The OV workspace pages and Validate,** with build stamps set aside: 87 of 87 the same against Build 205.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 58 of 58.
- **The menu bar's 69 actions:** the same output as Build 205.
- **The Parsing laboratory's examples:** 68 of 68.
- **The canvas chips and container names:** all 123 card views are the same as on Build 205, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output on Builds 205 and 206.

## The five fixes, for Build 207

The five fixes handoff was written for Build 205. On Build 206:
- **The four edits apply unchanged.** Each old string occurs once, at the same lines as on Build 205 (1717, 13629, 13632 and 13651). Build 206's own edits and blocks don't touch the code they change.
- **Its 49 checks:** 49 pass on Build 206 with the five fixes. Build 206 alone passes the same 21 as Build 205: those that check behaviour meant to stay as it is.
- **The small fixes still pass with them:** 44 of 44.
- **The regression on Build 206 with the five fixes:** every view's text, the OV pages and Validate, the Config view, adding the next component, the menu bar's actions, the Parsing laboratory, the canvas chips and the repo tools are the same as on Build 206.

The handoff, its prototype, diff and storyboard are updated for Build 207:
- **Start from Build 206.**
- **The block is `five-fixes-v207`,** and the matcher `window.configSourceMatches207`. Edit 2 names it.
- **The storyboard's "Today" scenes are Build 206.**

Nothing else in them changes.

## Still open

### The draw.io suggestions not built yet

As on Build 205:
1. **Move the rest of Tools.** The Tools panel is still 600 px wide with 870 px of content, so it scrolls sideways and cuts off the connection template's third column.
2. **Page tabs along the bottom** for versions of a topology, such as Current, Increment 2 and Target.
3. **A layers panel** in place of the Data, Fleet and Access toggles: show and hide, a lock, and "new links go on this layer".
4. **Smaller touches:**
   - a light canvas in light mode;
   - icon tiles in the palette, and a way to hide groups you don't use;
   - preset zoom levels on the zoom readout;
   - small jumps where links cross;
   - keyboard shortcuts in tooltips.

### Handed off, not built yet

The five fixes ([`builder-handoff-five-fixes.md`](builder-handoff-five-fixes.md)), for Build 207:
- Esc and a pending connection;
- the tick left after a palette add;
- Syslog Source → Splunk Cloud indexing;
- the Inspector with nothing selected, which is dimmed below 1,280 px, not only on phones;
- the Config view's `[source::]` wildcards.

### Faults and loose ends

- **Fixed in Build 206,** and gone from this list:
  - Focus canvas hiding the Inspector;
  - the page scrolling sideways at 1,024 px and other widths;
  - the hidden save label;
  - the help card's wording.
- **The Builder's page-wide lookups.** Scoping them to `#topologyBuilder`, or keeping the elements that never change, would make every redraw cheaper (see the Build 205 recheck).
- **A container's name can sit under the card above it,** as found on Build 203.
- **Phones: the menu bar was never designed for phone widths,** so phones keep the older controls.
- **New Splunk-to-Splunk links get port 0.** `inferredRelationshipPort` doesn't read "Splunk-to-Splunk" as 9997; a one-line fix.
- **From the add-next handoff's "Found while testing,"** left as they were by design:
  - "Configured handoff" labels many pairs;
  - Free place leaves 6 px between stacked cards.
- **From the small fixes handoff:** the toolbar takes two rows from 821 to about 1,310 px. Keeping one row would need a smaller switcher, for example a menu for the views that don't fit.
- **From the five fixes handoff:**
  - Esc with a menu open also clears the selection;
  - Syslog Source → load balancer → Splunk Cloud indexing isn't flagged;
  - `[source::]` matching doesn't consider a monitor's `whitelist` and `blacklist`.
- **From the Config view handoff:**
  - the Matrix header doesn't follow the page;
  - search-time precedence on a search head follows app context, and the view uses the global order;
  - the path presets don't name search time;
  - the Builder's search heads are separate from the strip's Search Head.

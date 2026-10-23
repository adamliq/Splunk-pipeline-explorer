# Builder handoff: Build 208 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 208 (`c22e2a0`). One build since Build 207 (`e5aa637`):

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 208 | `c22e2a0` | Moving the rest of Tools ([`builder-handoff-move-tools.md`](builder-handoff-move-tools.md)) | The style block and the script are identical to the prototype's files, and the four in-place edits are the handoff's. The build records are in a script of their own. Without that script, Build 208 is byte for byte the page the handoff was tested on |

Nothing else in `index.html` changed.

**Result:**
- Build 208 works as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 208.
- Nothing is handed off and waiting to be built. What's left is under "Still open".

**Tested with:**
- the move-tools handoff's own 37 checks, rerun on Build 208 with the script that tested the prototype, against Build 207;
- the five fixes handoff's 49 checks and the small fixes handoff's 44;
- every view's text against Build 207;
- the OV pages and Validate on the default, reference and zones topologies;
- the Config view's 49 checks, adding the next component from a handle (58), the menu bar's 69 actions, the Parsing laboratory's 68 examples and the canvas chips;
- the two repo tools.

## Build records

| | Build 208 |
|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 208 · 23 Oct 2026 |
| `changeRegister` entry | "Tools in the drawer", in "Explorer foundations", with the handoff's text, word for word |

- The entry shows in the Changes view: 207 implemented of 222 tracked, and Explorer foundations 174 of 174.
- 0 `pageerror` events and 0 console errors on loading the build.

## Moving the rest of Tools, on Build 208

| Check | Build 208 |
|---|---|
| The handoff's 37 checks | 37 of 37 pass. The output is the tested page's, line for line |
| The drawer | Ten tabs, with Routes, Config draft, Templates and Layouts. The four tools are in the drawer and none is left in Tools |
| The menus, at 1,440 and 1,024 px | Edit › Connection template…, Arrange › Layout profiles…, Validate › Route validation… and Analyze › Configuration draft… each open their tab, with the focus on it. The notes are as before, and Esc closes the drawer |
| No sideways scroll | Each of the four tabs fits at 1,440, 1,280, 1,024, 800 and 390 px, and with the drawer dragged to 300 px |
| Against Build 207 | Routes, the configuration draft, the connection template and the layout profiles give the same results as Build 207's Tools panel |
| Phones | More › Tools has the four buttons, and each opens its tab |
| The card-click fault | After a card click, Validate › Review, Edit › Connection template…, Analyze › Inventory and the review pill open the drawer at the first try. Build 207 closed it at once |

## Regression

- **0 `pageerror` events** in every check.
- **The five fixes:** 49 of 49. **The small fixes:** 44 of 44. Both outputs are Build 207's, line for line.
- **Every view's text against Build 207:** 95 of 97 views the same. The other two differ only as the build records say:
  - the Changes view: the new entry, and its counts;
  - OV: "Build 208" in its header and footer.
- **The OV workspace pages and Validate,** with build stamps set aside: 87 of 87 the same against Build 207.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 58 of 58.
- **The menu bar's 69 actions:** 69 of 69, with the same output as Build 207.
- **The Parsing laboratory's examples:** 68 of 68.
- **The canvas chips and container names:** all 123 card views are the same as on Build 207, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output on Builds 207 and 208.

## Still open

### Fixes not done yet

Numbered as in the list of fixes made after Build 205. Items 2 to 9 and 14 are done, in Builds 206, 207 and 208.

| # | Fault | What the fix takes |
|---|---|---|
| 1 | New Splunk-to-Splunk links get port 0: `inferredRelationshipPort` doesn't read "Splunk-to-Splunk" as 9997 | One line |
| 10 | Builder redraw speed. On Build 205, each redraw made 141 page-wide lookups, each walking the hidden Flow and Matrix views first | Scoping the lookups to `#topologyBuilder`, or keeping the elements that never change. Mechanical but broad: 194 lookups, 127 of them for four Builder elements |
| 11 | Free place stacks cards 6 px apart, where a card's handle row needs 30 px | More room between rows |
| 12 | A container's name can sit under the card above it | Room below the card above, in the same column |
| 13 | The Matrix header doesn't follow the page as it scrolls | Reworking the Matrix's own scrolling box |

### Found since, not done

| # | Fault | Found by |
|---|---|---|
| 15 | Esc with a menu open also clears the selection | The five fixes |
| 16 | Syslog Source → load balancer → Splunk Cloud indexing isn't flagged | The five fixes |
| 17 | `[source::]` matching doesn't consider a monitor's `whitelist` and `blacklist` | The five fixes |
| 18 | The toolbar takes two rows from 821 to about 1,310 px | The small fixes |
| 19 | The drawer is still titled "Inspect topology", with Templates and Layouts among its tabs | Moving the rest of Tools |
| 20 | Phones keep the older controls: the menu bar was never designed for phone widths | The menu bar |

### Left as they are by design

- "Configured handoff" labels many pairs (the add-next handoff).
- The add-next list's own exclusion of Splunk Cloud indexing after a Syslog Source is now redundant, and harmless (the five fixes).
- On a phone, a long name is cut inside the connection template's selects, and shows in full when a select is opened (moving the rest of Tools).

### The Config view

- Search-time precedence on a search head follows app context; the view uses the global order.
- The path presets don't name search time.
- The Builder's search heads are separate from the strip's Search Head.

### The draw.io suggestions not built yet

Moving the rest of Tools is done. Left:
1. **Page tabs along the bottom** for versions of a topology, such as Current, Increment 2 and Target.
2. **A layers panel** in place of the Data, Fleet and Access toggles: show and hide, a lock, and "new links go on this layer".
3. **Smaller touches:**
   - a light canvas in light mode;
   - icon tiles in the palette, and a way to hide groups you don't use;
   - preset zoom levels on the zoom readout;
   - small jumps where links cross;
   - keyboard shortcuts in tooltips.

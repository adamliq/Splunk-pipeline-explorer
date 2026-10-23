# Builder handoff: Build 207 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 207 (`e5aa637`). One build since Build 206 (`9744327`):

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 207 | `e5aa637` | The five fixes ([`builder-handoff-five-fixes.md`](builder-handoff-five-fixes.md)) | The script is identical to the prototype's file, and the four in-place edits are the handoff's. The build records are in a script of their own. Without that script, Build 207 is the page the handoff was tested on, apart from two whitespace differences |

Nothing else in `index.html` changed.

**The two whitespace differences have no effect:**
- Edit 1 leaves line 1717 empty, where the handoff's diff leaves a single space.
- A blank line follows the records script.

**Result:**
- Build 207 works as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 207.
- **The Tools panel's sideways scroll** is handed off separately, for Build 208. [`builder-handoff-move-tools.md`](builder-handoff-move-tools.md) moves each of the panel's four tools to a tab of its own in the Builder's drawer, which the menus open, and fixes the drawer closing at once after a card click.

**Tested with:**
- the five fixes handoff's own 49 checks, rerun on Build 207 with the script that tested the prototype;
- the small fixes handoff's 44 checks;
- every view's text against Build 206;
- the OV pages and Validate on the default, reference and zones topologies;
- the Config view's 49 checks, adding the next component from a handle (58), the menu bar's 69 actions, the Parsing laboratory's 68 examples and the canvas chips;
- the two repo tools.

## Build records

| | Build 207 |
|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 207 · 23 Oct 2026 |
| `changeRegister` entry | "Five fixes", in "Explorer foundations", with the handoff's text, word for word |

- The entry shows in the Changes view: 206 implemented of 221 tracked, and Explorer foundations 173 of 173.
- 0 `pageerror` events and 0 console errors on loading the build.

## The five fixes on Build 207

| Check | Build 207 |
|---|---|
| The handoff's 49 checks | 49 of 49 pass. The output is the tested page's, line for line |
| 1. Esc and a pending connection | At 1,440 and 1,024 px, Esc cancels the connection, keeps the selection and says "Connection cancelled"; a second Esc clears the selection. Esc in the add-next list, with a menu open, in a text field, with nothing pending and in Focus canvas behaves as the handoff says |
| 2. The selection after an add | A palette click, with or without New unconnected, a drag, a compatible-next button and the add-next list each leave the new card alone selected and ticked |
| 3. Syslog Source → Splunk Cloud indexing | The capability check refuses it with the reason. The handle is disabled, linking by the handles and dropping are refused, and a palette click adds the card unconnected and says why. A Syslog Server and a Universal Forwarder still connect. A file with the link loads, is reported once and offers "Insert Syslog Server between them" |
| 4. The Inspector with nothing selected | Opaque and takes clicks at 1,024, 800, 760 and 390 px, and with a container selected; docked at 1,440 px, unchanged |
| 5. `[source::]` wildcards | The seven monitors in the test files get the handoff's notes and source types; following a source type lists the monitors that take it; the matcher's own cases all pass; the example's note is as on Build 206 |

## The small fixes on Build 207

- The handoff's 44 checks: 44 of 44 pass, with the same output as on the tested page.

## Regression

- **0 `pageerror` events** in every check.
- **Every view's text against Build 206:** 95 of 97 views the same. The other two differ only as the build records say:
  - the Changes view: the new entry, and its counts;
  - OV: "Build 207" in its header and footer.
- **The OV workspace pages and Validate,** with build stamps set aside: 87 of 87 the same against Build 206.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 58 of 58.
- **The menu bar's 69 actions:** 69 of 69, with the same output as Build 206.
- **The Parsing laboratory's examples:** 68 of 68.
- **The canvas chips and container names:** all 123 card views are the same as on Build 206, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output on Builds 206 and 207.

## Still open

### The draw.io suggestions not built yet

1. **Move the rest of Tools,** now handed off for Build 208 in [`builder-handoff-move-tools.md`](builder-handoff-move-tools.md). On Build 207 the Tools panel is still 600 px wide with 853 px sections, so it scrolls sideways and cuts off the connection template's third column.
2. **Page tabs along the bottom** for versions of a topology, such as Current, Increment 2 and Target.
3. **A layers panel** in place of the Data, Fleet and Access toggles: show and hide, a lock, and "new links go on this layer".
4. **Smaller touches:**
   - a light canvas in light mode;
   - icon tiles in the palette, and a way to hide groups you don't use;
   - preset zoom levels on the zoom readout;
   - small jumps where links cross;
   - keyboard shortcuts in tooltips.

### Handed off, not built yet

- **Move the rest of Tools** ([`builder-handoff-move-tools.md`](builder-handoff-move-tools.md)), for Build 208.

### Faults and loose ends

- **Fixed in Build 207,** and gone from this list:
  - Esc with a connection pending;
  - the tick left after a palette add;
  - Syslog Source → Splunk Cloud indexing;
  - the Inspector dimmed with nothing selected;
  - the Config view's `[source::]` wildcards.
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
  - the add-next list's own exclusion of Splunk Cloud indexing after a Syslog Source is now redundant, and harmless;
  - `[source::]` matching doesn't consider a monitor's `whitelist` and `blacklist`.
- **From the Config view handoff:**
  - the Matrix header doesn't follow the page;
  - search-time precedence on a search head follows app context, and the view uses the global order;
  - the path presets don't name search time;
  - the Builder's search heads are separate from the strip's Search Head.

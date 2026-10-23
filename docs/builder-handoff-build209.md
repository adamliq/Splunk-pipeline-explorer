# Builder handoff: Build 209 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 209 (`cdc0580`). One build since Build 208 (`c22e2a0`):

| Build | Commit | Adds | Against its handoff |
|---|---|---|---|
| 209 | `cdc0580` | The quick fixes ([`builder-handoff-quick-fixes.md`](builder-handoff-quick-fixes.md)) | The style block and the script are identical to the prototype's files, and the two in-place edits are the handoff's. The build records are in a script of their own. Without that script, Build 209 is byte for byte the page the handoff was tested on |

Nothing else in `index.html` changed.

**Result:**
- Build 209 works as specified, nothing else changed, and the build records are right.
- Nothing needs fixing in Build 209.
- Nothing is handed off and waiting to be built. What's left is under "Still open".

**Tested with:**
- the quick fixes handoff's own 27 checks, rerun on Build 209 with the script that tested the prototype, against Build 208;
- the move-tools handoff's 37 checks, the five fixes' 49 and the small fixes' 44;
- every view's text against Build 208;
- the OV pages and Validate on the default, reference and zones topologies;
- the Config view's 49 checks, adding the next component from a handle (58), the menu bar's 69 actions, the Parsing laboratory's 68 examples and the canvas chips;
- the two repo tools.

## Build records

| | Build 209 |
|---|---|
| Title, `data-build-number`, `data-build-date` and the ⓘ prefix | Build 209 · 23 Oct 2026 |
| `changeRegister` entry | "Quick fixes", in "Explorer foundations", with the handoff's text, word for word |

- The entry shows in the Changes view: 208 implemented of 223 tracked, and Explorer foundations 175 of 175.
- 0 `pageerror` events and 0 console errors on loading the build, at 1,440 px and on a phone.

## The quick fixes, on Build 209

| Check | Build 209 |
|---|---|
| The handoff's 27 checks | 27 of 27 pass. The output is the tested page's, line for line |
| 1. The port | "Splunk-to-Splunk" gives 9997. New forwarder and indexer links get it, and the configuration draft no longer asks to confirm it. The built-in topology's Universal Forwarder 1 → Indexer 1 has 9997, and the reference topology's stored 0 stays |
| 15. Esc | At 1,440 px, Esc closes a menu, the drawer or the Containers panel, and the selection stays; the next Esc clears it. At 1,024 px, the same with the drawer and with Components, while with the Inspector open over the canvas Esc still clears the selection. On a phone, Esc closes More and the selection stays |
| 16. Syslog behind a load balancer | Converting an Indexer in a syslog or HEC pool is refused with the reason, and makes no history entry. That was checked from the Inspector for both pools, and from the object menu for the syslog pool. A syslog load balancer refuses Splunk Cloud with the syslog reason when linking, in validation and in a file's notice |
| 19. The title | "Topology tools", with the matching labels for screen readers |
| The Splunk Cloud buttons | "Convert to Splunk Cloud indexing" is #d7edf4 on #123447. Build 208 had light text on the browser's light grey |

## Regression

- **0 `pageerror` events** in every check.
- **Moving the rest of Tools:** 37 of 37. **The small fixes:** 44 of 44, with Build 208's output, line for line.
- **The five fixes:** 49 of 49. The output differs from Build 208's in two details, both from item 15. With a connection pending and a menu open:
  - the first Esc closes the menu and now keeps the selection;
  - the next Esc cancels the connection, with the selection still kept.
- **Every view's text against Build 208:** 95 of 97 views the same. The other two differ only as the handoff and the build records say:
  - the Changes view: the new entry, and its counts;
  - OV: "Build 209" in its header and footer, and the built-in topology's "S2S · 9997 · TLS" and "Forwarders deliver S2S over TLS on TCP 9997 to Indexer."
- **The OV workspace pages and Validate,** with build stamps set aside: 73 of 87 the same against Build 208.
  - The 14 that differ are the built-in topology's: AV-1, OV-1, OV-2, OV-3, OV-6c, DIV-1, SvcV-2, SV-1, SV-2, SV-3, SV-6, SV-10a, SV-10c and Validate. Each change is from the port, as the handoff lists.
  - The reference and zones topologies' 58 are the same.
  - The output is the tested page's, line for line.
- **The Config view:** 49 of 49.
- **Adding the next component from a handle:** 58 of 58.
- **The menu bar's 69 actions:** 69 of 69, with the same output as Build 208.
- **The Parsing laboratory's examples:** 68 of 68. "Click to next frame" for fixed-length records took 298 ms, against 303 on Build 208.
- **The canvas chips and container names:** all 123 card views are the same as on Build 208, with no problems.
- **The repo tools:** `tools/builder-space-check.js` and `builder-connector-check.js` print the same output on Builds 208 and 209.

## Still open

### Fixes not done yet

Numbered as in the list of fixes made after Build 205. Items 1 to 9 and 14 are done, in Builds 206 to 209.

| # | Fault | What the fix takes |
|---|---|---|
| 10 | Builder redraw speed. On Build 205, each redraw made 141 page-wide lookups, each walking the hidden Flow and Matrix views first | Scoping the lookups to `#topologyBuilder`, or keeping the elements that never change. Mechanical but broad: 194 lookups, 127 of them for four Builder elements |
| 11 | Free place stacks cards 6 px apart, where a card's handle row needs 30 px | More room between rows |
| 12 | A container's name can sit under the card above it | Room below the card above, in the same column |
| 13 | The Matrix header doesn't follow the page as it scrolls | Reworking the Matrix's own scrolling box |

### Found since, not done

Items 15, 16 and 19 are done, in Build 209.

| # | Fault | Found by |
|---|---|---|
| 17 | `[source::]` matching doesn't consider a monitor's `whitelist` and `blacklist` | The five fixes |
| 18 | The toolbar takes two rows from 821 to about 1,310 px | The small fixes |
| 20 | Phones keep the older controls: the menu bar was never designed for phone widths | The menu bar |
| 21 | Syslog and search dispatch links still get port 0. Syslog usually uses 514, or 6514 with TLS, and a search head reaches its indexers on their management port, 8089 | The quick fixes |

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

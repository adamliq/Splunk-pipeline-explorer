# Handoff: quick fixes (the Splunk-to-Splunk port, Esc, syslog behind a load balancer, the drawer's title)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 208.
**Two new blocks, at the end of the page (before `</body>`), in this order:**
- `<style id="quick-fixes-v209-styles">`, containing [`docs/mockups/quick-fixes-prototype.css`](mockups/quick-fixes-prototype.css);
- `<script id="quick-fixes-v209">`, containing [`docs/mockups/quick-fixes-prototype.js`](mockups/quick-fixes-prototype.js).

**Two in-place edits,** listed under "The edits". Each old string occurs exactly once in Build 208. They are also in [`docs/mockups/quick-fixes.diff`](mockups/quick-fixes.diff), a unified diff against Build 208's `index.html`.

Paste the files as they are, make the two edits, then add the build records (see "Build records").

**The numbers** are those of the "Still open" list in the Build 208 recheck ([`builder-handoff-build208.md`](builder-handoff-build208.md)): 1, 15, 16 and 19.

**Mockup (the target):** [`docs/mockups/quick-fixes-mockup.html`](mockups/quick-fixes-mockup.html). Six scenes have the fixes applied to Build 208, and the six "Today" scenes are Build 208. The screenshots are `docs/mockups/compare/quick-fixes-*.png`.

**Tested first:** the blocks and the edits were applied to Build 208 and run. The results under "Check before uploading" come from that run.

## Why

### 1. New Splunk-to-Splunk links get port 0

**What you see:**
- **Link a Universal Forwarder to an Indexer,** a Heavy Forwarder to an Indexer, or a Universal Forwarder to a Heavy Forwarder. The link's Port reads 0.
- **Everything after counts it as unset.** The configuration draft asks to confirm the destination port. SV-1, SV-3, SV-6 and SV-10c list the interface as "port not set", and rule PR-ENT-02 is advisory.
- **The built-in topology too:** its Universal Forwarder 1 → Indexer 1 has port 0.

**The cause:**
- **A link's details start from `defaultRelationshipDetails(edge)`** (`builder-enhanced-relationship-inspector`, line 2309). It takes the port from `inferredRelationshipPort(edge.label)`, line 2308.
- **That reads the port from the label's text:** "9997"; "8088" or "hec"; "8089" or "management"; "8000" or "splunk web"; "https", "rest" or "s3". Anything else gives 0.
- **A forwarder's or indexer's link to a forwarder, an indexer or an Ingest Processor is labelled "Splunk-to-Splunk"** (line 1679), with no number in it.

### 15. Esc with a menu open also clears the selection

**What you see,** with a component selected:
- **Open the drawer (Validate › Review) and press Esc.** The drawer closes, and the selection is cleared too: the Inspector switches to the topology.
- **The same with:**
  - the Containers panel;
  - a menu, when the focus isn't in it, for example after moving from one menu to the next with the mouse;
  - the drawer at 1,024 px;
  - Components, open over the canvas below 1,280 px, when the focus isn't in it.
- **On a phone,** Esc leaves More open and clears the selection underneath.

A menu or Components with the focus in it, and the object menu, already keep the selection.

**The cause:**
- **Build 167 clears the selection on every Esc.** Its listener (`builder-review-v167`, line 8761, on the document) calls `clearSelection167()` whenever Esc goes down in the Builder with something selected.
- **The handlers that close a layer let the key go on.** So Build 167's listener runs on the same key. They are:
  - the menus' (`builder-ui-v86`, line 3105);
  - the drawer's (line 3119), which only prevents the default;
  - the side panels' (`builder-docked-fixes-v198`, line 11953);
  - below 1,280 px, the one for Components and the Inspector over the canvas (`builder-canvas-drawers-v95`, line 3352), which also only prevents the default.
- **Three stop it:**
  - the menu bar's (`builder-menubar-v198`, line 12209), only while the focus is in the open menu;
  - Components' own (`builder-add-palette-v117`, line 4135), only while the focus is in it;
  - the object menu's (`builder-bulk-keyboard`, line 3198).
- **On a phone, nothing closes More or Planes** on Esc.

### 16. Syslog Source → load balancer → Splunk Cloud indexing

**What you see:**
1. Add Syslog Source → Load Balancer → Indexer. The load balancer passes syslog, its default.
2. Select the Indexer and use "Convert to Splunk Cloud indexing", in the Inspector's Settings tab or the card's object menu.

- **It converts.** The pill then reads "2 errors", and Route validation lists:
  - "Load Balancer 1 → Splunk Cloud: Splunk Cloud already balances its own inputs. Link straight to Splunk Cloud.";
  - "Load Balancer 1 → Splunk Cloud isn't encrypted; Splunk Cloud only accepts TLS."
- **Neither names syslog, and the first gives the wrong advice.** A Syslog Source linked straight to Splunk Cloud indexing is refused too (the five fixes).
- **The same reason elsewhere.** Linking a syslog load balancer to an existing Splunk Cloud indexing is refused with "Link straight to Splunk Cloud". A file with the chain loads with that link dropped, for the same reason.

The Build 208 recheck said this chain "isn't flagged". More exactly, it isn't flagged as syslog. Build 148's syslog handling looks only at a link from a Syslog Source itself. That handling is the red link, the Inspector's notice with "Insert Syslog Server between them", and rule PR-CLOUD-10.

**The cause:**
- **Conversion isn't checked.** `builderCloudConvert148(node)` (line 7068) turns the Indexer into Splunk Cloud indexing in place, whatever sends to it. Build 176 wraps it (`builder-splunk-managed-v176`, line 9589) to record the history. The Inspector's button (line 6867) and the object menu call it by name.
- **The load balancer gives the same reason for every pool.** In `builder-load-balancer-v185`, `check` (line 9868) refuses Splunk Cloud as a member with "Splunk Cloud already balances its own inputs. Link straight to …". That's right for HEC, but syslog can't go straight to Splunk Cloud. Linking, validation and the file import all use this check.

### 19. The drawer is still titled "Inspect topology"

**What you see:**
- **The drawer's tabs:** Coverage, Review, Rules, Routes, Inventory, Trace, Config draft, History, Templates and Layouts.
- **Its title, "Inspect topology",** fits the checks, but not History, Templates or Layouts.
- **For screen readers,** the drawer is "Builder inspection drawer", and its Close button "Close inspection drawer".

**The cause:** Build 86 made the drawer with that title (`builder-ui-v86`, line 3107). Build 208 moved the tools in and kept it.

### Found while testing: the Splunk Cloud buttons can't be read

**What you see:** Build 148's buttons show as blank bars. They are "Convert to Splunk Cloud indexing", "Convert back to self-managed Indexer" and "Insert Syslog Server between them".

**The cause:** Build 148 styles only their margin (line 6835). So they take their section's light text (#dbe9f8) on the browser's light grey button.

Item 16's fix is about the first of them, so the style block fixes all three.

## The design

### 1. The port

- **"Splunk-to-Splunk" means 9997.** A label containing it gives port 9997, as one containing "9997" did.
- **New links get 9997:** every link labelled Splunk-to-Splunk, from a Universal Forwarder, Heavy Forwarder or Indexer to a Heavy Forwarder, Indexer or Ingest Processor. The configuration draft no longer asks to confirm the port, and the SV views count it as declared.
- **The built-in topology's Universal Forwarder 1 → Indexer 1 gets 9997 too,** so some of its OV and SV pages change. See "Regression".
- **Unchanged:**
  - **A port stored in a file, 0 included.** The reference topology's Universal Forwarder 1 → Indexer 1 stays at 0, and its pages are unchanged.
  - **Every other label's port:**
    - 8088 for "HEC HTTPS 8088";
    - 443 for "Amazon S3 API";
    - 0 for "Search dispatch", "TCP/TLS or UDP" and the local handoffs.

### 15. Esc

- **Esc closes what's open and keeps the selection.** If a menu, panel, popover, overlay or the drawer is open when Esc goes down, the selection stays. A second Esc clears it.
- **With nothing open,** Esc clears the selection, as before.
- **What counts as open, each only while shown:**
  - the drawer and the presentation view;
  - below 1,280 px, Components open over the canvas;
  - the menu bar's menus, the side panels (such as Containers), the space groups, and on a phone More and Planes;
  - the object menu, the issue popover, history, the report, the info popover and the change-impact overlay.
- **Closing the drawer** puts the focus back on the menu that opened it, such as Validate, as on Build 208.
- **On a phone,** Esc closes More and Planes, and the selection stays.
- **Unchanged:**
  - **Below 1,280 px, with the Inspector open over the canvas,** Esc still clears the selection, which closes the Inspector. The Inspector there shows the selection, so Esc is about the selection.
  - **These still take the Esc first:**
    - the add-next list, which cancels its connection;
    - a text field;
    - a pending connection, after any open menu has closed (the five fixes).
  - **A click on the empty canvas** clears the selection.

### 16. Syslog behind a load balancer

- **Converting an Indexer in a load balancer's pool is refused.** This holds for the Inspector's button and the object menu's item, and the status says why:
  - **when the pool passes syslog:** "Indexer 1 is behind Load Balancer 1, which passes syslog. Syslog can't go directly to Splunk Cloud: send it through a Syslog Server and forwarder or HEC.";
  - **otherwise:** "Indexer 1 is behind Load Balancer 1, and Splunk Cloud balances its own inputs. Take Indexer 1 out of Load Balancer 1's pool first."

  Out of the pool, it converts as before.
- **A load balancer that passes syslog refuses Splunk Cloud with the syslog reason:** "Load Balancer 1 passes syslog, and syslog can't go directly to Splunk Cloud. Send it through a Syslog Server and forwarder or HEC."
  - **When linking,** by the handles or any other way that runs the capability check.
  - **In validation,** for a chain made some other way.
  - **In a file,** in the "Dropped 1 load balancer link" notice.
- **Unchanged:**
  - **A HEC load balancer's reason:** "Splunk Cloud already balances its own inputs. Link straight to …".
  - **The palette's Splunk Cloud indexing** with a load balancer selected: "Load Balancer 1 serves Syslog receivers, so it can't take Splunk Cloud indexing 1."
  - **Converting an Indexer fed straight by a Syslog Source.** Build 148 flags the result, and "Insert Syslog Server between them" fixes it.
  - **Converting an Indexer fed by a forwarder.**
- **The buttons:** Build 148's Splunk Cloud buttons get the Builder's dark button: #123447, with #d7edf4 text and a #477189 border.

### 19. The title

- **"Topology tools".** For screen readers, the drawer is "Topology tools", and its Close button "Close topology tools".
- **Unchanged:** the tabs, the menus' items and the ⓘ text.

## The edits

Both are in Build 208's `index.html`, and each old string occurs exactly once.

**1. `<script id="builder-enhanced-relationship-inspector">`, line 2308, in `inferredRelationshipPort`: "Splunk-to-Splunk" gives 9997.** (`text` is the label in lower case.)
```
old: if(text.includes('9997'))return 9997;
new: if(text.includes('9997')||text.includes('splunk-to-splunk'))return 9997;
```

**2. `<script id="builder-load-balancer-v185">`, line 9868, in `check`: a syslog pool's reason for refusing Splunk Cloud.**
```
old: if(member&&managed(other))return{valid:false,reason:`Splunk Cloud already balances its own inputs. Link straight to ${name(other)}.`};
new: if(member&&managed(other))return{valid:false,reason:lb.lbServes==='syslog'?`${name(lb)} passes syslog, and syslog can't go directly to Splunk Cloud. Send it through a Syslog Server and forwarder or HEC.`:`Splunk Cloud already balances its own inputs. Link straight to ${name(other)}.`};
```
Here `lb.lbServes` is always the service the check's own `s` holds:
- `check` fills `lbServes` in with `clean` when it's missing;
- nothing passes `check` its fourth argument;
- `infer` gives nothing for Splunk Cloud indexing.

## How the blocks work

**The style block** gives `.builderCloudInspector148 button`:
- a border, rounded corners and padding;
- a #123447 background with #d7edf4 text;
- the inherited font, at .7rem and weight 650;
- a lighter border and background on hover.

It covers Build 148's three buttons, in the Inspector and in the notice for a Syslog Source linked straight to Splunk Cloud.

**The script.** Each part checks that the function it wraps exists.

**1. Esc.**
- **When Esc goes down:** a `keydown` listener on the window, in the capture phase, notes whether a layer is open (the list under "The design"). If one is, it sets `escClosesLayer` for that key press. A `setTimeout` clears it.
- **Components over the canvas** is `canvasPanelState.palette` while `#topologyBuilder` isn't docked (`builderDocked197`). Docked, Components is a column, and doesn't count.
- **The selection stays:** `clearSelection167` is wrapped, and does nothing while `escClosesLayer` is set. Build 167's listener calls it by name, so it gets the wrapper. A click on the empty canvas calls it too, but the flag is set only during an Esc.
- **Panels closed by the same Esc:** Build 198's side-panel listener is also on the window in the capture phase, registered earlier. It closes the Containers panel before this listener can look.
  - So the block keeps a map of open `<details>`, updated from `toggle` events. It also notes whether each was shown when it opened.
  - A `toggle` event arrives after the key's handlers have run. So a panel closed by this Esc is still in the map, and counts.
- **Phones:** a `keydown` listener on the document closes More and Planes, and prevents the default.

**2. Conversion.**
- **A wrapper on `builderCloudConvert148`.** For a self-managed Indexer that some load balancer pools (`builderLbMembers`), it doesn't convert. It reports why with `builderStatus(…,'error')`, with the syslog reason when that load balancer's `lbServes` is `'syslog'`.
- **Otherwise,** it calls the conversion as before.
- **The callers:** the Inspector's button and the object menu call `builderCloudConvert148` by name, so both get the wrapper.
- **History:** a refused conversion never reaches Build 176's wrapper, inside this one, so no history entry is made.

**3. The title.** At load, it sets:
- the text of the drawer's `.builderDrawerTop strong`;
- the drawer's `aria-label`;
- the Close button's `aria-label`.

The drawer is made once, so this lasts.

## Build records

After the blocks:
- **`changeRegister`,** group "Explorer foundations":
  `['Quick fixes','New Splunk-to-Splunk links get port 9997. In the Builder, Esc closes the menu, panel or drawer that is open and keeps the selection, and on phones it closes More. An Indexer behind a load balancer can no longer be converted to Splunk Cloud indexing, and a load balancer that passes syslog refuses Splunk Cloud with the syslog reason. The drawer is titled Topology tools, and the Splunk Cloud buttons in the Inspector can be read.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 208 did in `move-tools-records-v208`, with Build 209.

## Found while testing (not changed)

1. **Syslog links ("TCP/TLS or UDP") and search dispatch still get port 0.** They're outside item 1. A syslog port depends on the sender (514, or 6514 with TLS), and SV-1 already suggests both.
2. **A file's stored port 0 stays.** The reference topology's Universal Forwarder 1 → Indexer 1 keeps 0, and its configuration draft still asks to confirm the port.
3. **Converting an Indexer fed straight by a Syslog Source is still allowed.** Build 148 flags the result (1 error), and "Insert Syslog Server between them" fixes it.

## Check before uploading

Run with Build 208 + the two blocks + the two edits, and with Build 208 as shipped for comparison.

### 1. The fixes: 27 checks, all pass

Build 208 passes 8 of the 27: those that check behaviour that should stay as it is.

| Check | Result |
|---|---|
| Port inference | Every label gives what it gave on Build 208, except those with "Splunk-to-Splunk", which give 9997 |
| New links | Universal Forwarder → Indexer, Heavy Forwarder → Indexer and Universal Forwarder → Heavy Forwarder get 9997 (Build 208: 0). The configuration draft no longer asks to confirm the port |
| Built-in topology and files | The built-in Universal Forwarder 1 → Indexer 1 gets 9997. A file that stores port 0, like the reference topology, keeps it |
| Esc at 1,440 px | With a menu (focus elsewhere), the drawer or the Containers panel open, Esc closes it and keeps the selection, and the next Esc clears it (Build 208 cleared it at once). With the focus in a menu or the object menu open, the same, as on Build 208. With nothing open, Esc clears the selection |
| The drawer and the focus | Esc closes the drawer, and the focus goes back to Validate |
| A pending connection | With its list closed and a menu open: Esc closes the menu, the next cancels the connection, the next clears the selection |
| A canvas click | Still clears the selection |
| Esc at 1,024 px | With the Inspector open over the canvas, Esc clears the selection and closes it, as on Build 208. With the drawer open, or Components with the focus outside it, Esc closes it and keeps the selection (Build 208 cleared it at once); after Components, the next Esc clears it. With the focus in Components, Esc closes it and keeps the selection, as on Build 208 |
| Esc on a 390 px phone | Closes More and keeps the selection, and the next Esc clears it. Build 208 left More open and cleared the selection |
| The load balancer's reason | A syslog load balancer refuses Splunk Cloud with the syslog reason, by the capability check and by the handles, which leave no link. A HEC load balancer, the palette's Splunk Cloud entry, and a syslog load balancer with an Indexer or a Syslog Server are as on Build 208 |
| Conversion | Refused behind a syslog load balancer, with the syslog reason, from the Inspector and from the object menu. Refused behind a HEC load balancer, with its reason. Build 208 converted both. An Indexer fed straight by a Syslog Source, or by a forwarder, converts as on Build 208, the first with Build 148's error |
| History | A refused conversion makes no history entry. One that goes through makes the same entries as on Build 208 |
| Build 208's converted chain | Two errors, neither naming syslog, the first saying to link straight to Splunk Cloud |
| A chain made some other way | Validation reports it with the syslog reason (Build 208: "Link straight to Splunk Cloud") |
| A file with the chain | The load balancer's link to Splunk Cloud is dropped, and the notice gives the syslog reason |
| The drawer's title | "Topology tools", at 1,440 px and on a phone, with the matching labels |
| Page errors | None |

### 2. Regression

Against Build 208:

| Suite | Result |
|---|---|
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 58 of 58 |
| View text, every view | 96 of 97 the same. The OV view changes, from the port (below) |
| OV pages and Validate | 73 of 87 the same. The 14 changed are the built-in topology's, all from the port (below). The reference and zones topologies' 58 are the same |
| Menu bar actions | The same output as Build 208 |
| Parsing laboratory | 68 of 68. "Click to next frame" for fixed-length records took 247 ms, against 303 on Build 208 (limit 1,000) |
| Canvas card views | 123, unchanged |
| The space and connector tools | The same output as Build 208 |
| Page errors | None |

**The expected changes:** the built-in topology's Universal Forwarder 1 → Indexer 1 now has port 9997.

| Page | Build 208 | Now |
|---|---|---|
| OV-1 and the OV view | "S2S · TLS"; "Forwarders deliver S2S over TLS to Indexer." | "S2S · 9997 · TLS"; "… over TLS on TCP 9997 to Indexer." |
| OV-2, OV-3, SvcV-2 | "S2S TCP · TLS" | "S2S TCP 9997 · TLS" |
| DIV-1 | "RF-03 · Splunk-to-Splunk · TLS" | "RF-03 · Splunk-to-Splunk · 9997 · TLS" |
| AV-1 | "2 links have no port." | "1 link has no port." |
| OV-6c | SI-3 "9997 (not set)"; "RF-01 and RF-03 are carried by interfaces with no port set (SI-1 and SI-3)." | SI-3 "9997"; "RF-01 is carried by an interface with no port set (SI-1)." |
| SV-1 | 2 ports not set, 1 of 3 interfaces ready, SI-3 "PORT NOT SET" | 1 port not set, 2 of 3 ready, SI-3 "DECLARED" |
| SV-2 | No row for 9997 | 9997 |
| SV-3 | 2 need attention | 1 needs attention |
| SV-6 | "Splunk-to-Splunk · port not set" | "Splunk-to-Splunk · port 9997", SF-03 "DECLARED" |
| SV-10a | PR-ENT-02 advisory; 4 rules advisory | PR-ENT-02 passes; 3 advisory |
| SV-10c | "SI-1 and SI-3 have no port set. The trace assumes 514 and 9997." | "SI-1 has no port set. The trace assumes 514." |
| Validate | PR-ENT-02 advisory | PR-ENT-02 passes |

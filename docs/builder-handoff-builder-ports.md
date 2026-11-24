# Builder handoff: ports on a load balancer and a Syslog Server

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 229.
**Applied:** as Build 230, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="builder-ports-v230">` (131 lines), after `catalog-sync-v229`, containing [`docs/mockups/builder-ports-prototype.js`](mockups/builder-ports-prototype.js). It sets `window.builderPorts230`.
- `<style id="builder-ports-v230-styles">` (25 lines), after `config-parts-v228-styles`.

**Five in-place edits,** all to the load balancer's block, `builder-load-balancer-v185`, under "The edits". Each old string occurs exactly once in Build 229, and none changes the number of lines.

The edits, the block and the styles are also in [`docs/mockups/builder-ports.diff`](mockups/builder-ports.diff), a unified diff against Build 229's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:**

> For builder can load balancer and Syslog server do multiple ports.

**Before this build:**
- **The load balancer** could hold several listeners, but only from fixed presets: UDP 514, TCP 514 and TLS 6514 for syslog; HTTPS 8088 and HTTPS 443 for HEC; HTTPS 8089 for Deployment Servers.
- **The Syslog Server** had no ports at all. Each link into it carried one port number in its details, and nothing checked it.

**Now** both listen on as many ports as a design needs.

**Sources:**
- Splunk Connect for Syslog (SC4S), [Sources](https://splunk.github.io/splunk-connect-for-syslog/main/sources/), "Unique listening ports":
  - SC4S "supports unique listening ports for each source technology/log path (e.g. Cisco ASA)". This is "useful when the device is sending data on a port different from the typical default syslog port (UDP port 514)", or when its data can't be told apart from other devices'.
  - Its example: `SC4S_LISTEN_CISCO_ASA_UDP_PORT=5005`.
  - It warns: "Using the default ports as unique listening ports is discouraged since it can lead to unintended consequences."
- SC4S, [Configuration](https://splunk.github.io/splunk-connect-for-syslog/main/configuration/): `SC4S_LISTEN_DEFAULT_TLS_PORT`, "Enable a TLS listener on port 6514."
- AWS, [Listeners for your Network Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-listeners.html): "A listener is a process that checks for connection requests, using the protocol and port that you configure." Ports run from 1 to 65535. A load balancer needs at least one listener.

**Mockup (the target):** [`docs/mockups/builder-ports-mockup.html`](mockups/builder-ports-mockup.html).
- 5 scenes have the edits, the block and the styles applied to Build 229.
- The "Today" scene is Build 229.
- The screenshots are `docs/mockups/compare/builder-ports-*.png`.

## Today, in Build 229

- **A load balancer's listeners** are checkboxes from a fixed table: the three syslog presets, two for HEC and one for Deployment Servers. Any other port can't be chosen, and a file's other listener is dropped when it loads.
- **A Syslog Server** has no ports. Its card shows its type and name. Its Settings tab has its outbound handoff, reliability and stages.
- **A link's port** is a number in its details, 0 to 65535. A link into a Syslog Server gets 514 by default, from its protocol's words "TCP/TLS or UDP". Nothing compares the port with what the receiver listens on.
- **AR-009,** "Load-balanced syslog keeps the sender's address", asks for DNAT when a syslog load balancer listens on UDP, but it looks for UDP 514 only.

## The design

### A Syslog Server's listening ports

Each port has three parts:
- **Protocol:** UDP, TCP or TLS.
- **Port:** a whole number from 1 to 65535.
- **Senders:** optional, up to 60 characters. Name the senders when the port is theirs alone, as SC4S's dedicated ports are; leave it empty for all senders.

The node holds them as `syslogPorts`, an array of `{protocol, port, senders}`.

**Defaults.** Until a person changes them, a Syslog Server listens on UDP 514 and TCP 514. Its node holds nothing new until then, so an unchanged topology doesn't count as changed.

**What can't be listed.** TLS listens on a TCP port, so TCP and TLS can't share a number; UDP can share one with either. Read from a file, a port that isn't one of these is dropped, and so is the second of a clash. At most 50 are read.

**The card** lists its ports under its name, for example "UDP 514 · TCP 514". Past three it counts the rest: "UDP 514 · TCP 514 · TLS 6514 · +1". The line breaks between ports, never inside one. Its tooltip lists every port and its senders.

**The Settings tab** starts with **Listening ports**:
- **A row per port:** its protocol, its number, Remove, and under them its senders ("All senders" when empty).
- **Add a port** adds the first free UDP number from 5000 up, ready to type over.
- **Refused changes** are said under the rows, and the field is marked: "Enter a port from 1 to 65535.", "UDP 514 is already listed.", or "TLS 514 would share TCP port 514 with TCP 514.". Nothing changes.
- **The last port** can't be removed: "A Syslog Server needs at least one port."
- **Undo:** each change is one step: Add a listening port, Change a listening port, Name the senders, or Remove a listening port.

### A load balancer's other listeners

The presets stay checkboxes, as before. Under them, any other port:
- **Protocols offered:** UDP, TCP or TLS for syslog; HTTPS for HEC and for Deployment Servers.
- **Adding one:** a number, then Add a port (or Enter).
- **Removing one:** untick it.

**Listener ids.** A new listener's id is `<serves>-<protocol>-<port>`: for example `syslog-udp-5005`, or `hec-https-8443`.
- A port that is a preset takes the preset's id: UDP 514 is `udp514`.
- The load balancer's own table resolves these ids (edit 1), so labels, link details, TLS, AR-009 to AR-015 and files take them as they take the presets.
- The label of a link through it names them all: "Syslog UDP 514 · TCP 514 · UDP 5005".

**Refused** with the same words as a Syslog Server's, and with nothing changed:
- a listener it has: "UDP 5005 is already a listener.";
- TCP and TLS on one number: "TLS 514 would share TCP port 514 with TCP 514.";
- a number out of range: "Enter a port from 1 to 65535."

**Undo:** each change is one step, "Update load balancer", through the load balancer's own `update()` (edit 5).

### Links

- **A new link into a Syslog Server** starts on its first port, with TLS Required when that port is TLS. A load balancer's links keep their own default: its first listener.
- **The link inspector** offers the receiver's port numbers under Port, for a Syslog Server or a load balancer. It says what the receiver listens on, for example "Syslog Server 2 listens on UDP 514 · TCP 514." When the link's port isn't one of them, it says so in amber: "Syslog Server 2 doesn’t listen on 5141. It listens on UDP 514 · TCP 514." As on the card, these words break between ports, and the TLS field beside them keeps its height.
- **A link on a Syslog Server's first port follows it** when the server stops listening on the old number. A port a person set stays, and AR-016 says when the server doesn't listen on it.

### Rules

| Rule | Severity | Fails or advises when | Its finding |
|---|---|---|---|
| AR-009, as before | Critical | It now counts any UDP listener, not UDP 514 only | "Load Balancer 2 listens on UDP 5005 but replaces the sender's address (SNAT). …" With UDP 514 alone it reads as before |
| AR-016 Senders use a port their receiver listens on | High | **Fail:** a sender's link into a Syslog Server or a load balancer is on a port that isn't one of its receiver's. A link with no port isn't judged. A load balancer's own links to its Syslog Servers are AR-017's | "Syslog Source 1 sends to port 5141, but Syslog Server 2 listens on UDP 514 · TCP 514." |
| AR-017 A syslog load balancer’s listeners are open on its Syslog Servers | High | **Fail:** a listener of a load balancer for syslog isn't a port of one of its Syslog Servers. TLS that ends on the load balancer is looked for as TCP | "Load Balancer 1 listens on UDP 5005 but Syslog Server 2 doesn’t listen on UDP 5005." |
| AR-018 Dedicated syslog ports avoid the default ports | Medium | **Advisory:** a port named for its senders is UDP 514, TCP 514 or TLS 6514, which SC4S discourages | "Syslog Server 2 gives Cisco ASA the default port UDP 514. Give Cisco ASA a port of its own: other senders on UDP 514 could be taken for Cisco ASA." |

The three come after AR-015. With the defaults on both sides they pass, so a topology that had no findings has none. The rule engine's score ("Rules passing") counts them.

### Files

- **Export:** every Syslog Server's `syslogPorts` is written, defaults included, and a load balancer's listeners with any ids.
- **Import:** ports are read as above. A load balancer's listener for a preset port, such as `syslog-udp-514`, becomes the preset, listed once.
- **What's dropped is said:** "Dropped listening ports that weren’t valid or were listed twice: Syslog Server 3 (2)".

### Unchanged

- **Every topology without new ports:** its cards' boxes, every component's inspector, every link's inspector, labels and details, the rules' results, the Builder's validation, the network overlay, the topology file and the architecture report. Only what the block adds differs: a Syslog Server's port line, its Listening ports, the load balancer's Add a port row, the link's ports hint, and AR-016 to AR-018. The regression below takes these out and compares the rest.
- **The rest of the page:** every view, path, failure, symptom and the Config view, and the OV and Operations pages but for what lists the rules or holds the file. Two OV pages list the architecture rules, so they list the three new ones too: AV-2 names AR-001–AR-018, and SV-10a has a row for each. The Operations page's evidence pack holds the topology and the architecture report in four of its files, so it is larger.

### Not covered

- **A link's details hold one port.** The label of a link through a load balancer names every listener, but its Port, and the network overlay's row for it, is the first listener's.
- **Port translation.** The Builder sends each load balancer listener to the same port on its members. A listener on 443 that sends to HEC on 8088 is not modelled.
- **Other syslog receivers' ports:** a Heavy Forwarder, an Indexer or an Edge Processor that takes syslog itself. AR-017 checks Syslog Server members only.
- **Ports below 1024,** which need privileges on a host, and SC4S's own variables (`SC4S_LISTEN_…`), aren't written.
- **A load balancer's card** lists its listeners in one line of its facts, as before. A long list can break that line inside a listener, between "TLS" and "6514".

## The edits

The lines are Build 229's, in `<script id="builder-load-balancer-v185">`.

1. **Line 9,850.** The listener table: `listeners`: the six presets stay as they are, and any other listener resolves from its id, `<serves>-<protocol>-<port>`: `syslog-udp-5005` is UDP 5005 for syslog, `hec-https-8443` is HTTPS 8443 for HEC. UDP, TCP and TLS serve syslog; HTTPS serves HEC and Deployment Servers; the port is 1 to 65535. Everything that reads the table, `clean()` included, then takes the new listeners as it takes the presets: labels, link details, TLS, rules and files. The checkboxes still list the presets only, as `Object.entries` sees only them.
```
old: const listeners={udp514:['UDP 514','syslog',514,false],tcp514:['TCP 514','syslog',514,false],tls6514:['TLS 6514','syslog',6514,true],https8088:['HTTPS 8088','hec',8088,true],https443:['HTTPS 443','hec',443,true],https8089:['HTTPS 8089','deployment',8089,true]};
new: const listeners=new Proxy({udp514:['UDP 514','syslog',514,false],tcp514:['TCP 514','syslog',514,false],tls6514:['TLS 6514','syslog',6514,true],https8088:['HTTPS 8088','hec',8088,true],https443:['HTTPS 443','hec',443,true],https8089:['HTTPS 8089','deployment',8089,true]},{get(t,k){if(typeof k!=='string'||Object.hasOwn(t,k))return t[k];const m=/^(syslog|hec|deployment)-(udp|tcp|tls|https)-([1-9]\d{0,4})$/.exec(k);return m&&+m[3]<=65535&&(m[1]==='syslog')===(m[2]!=='https')?[m[2].toUpperCase()+' '+m[3],m[1],+m[3],m[2]==='tls'||m[2]==='https']:undefined}});
```
2. **Line 9,905.** AR-009, its UDP check: AR-009 asks for DNAT when a syslog load balancer listens on UDP. It looked for UDP 514 only; it now counts any UDP listener.
```
old: udp=lb.lbListeners.includes('udp514')
new: udp=lb.lbListeners.some(id=>listeners[id]?.[0].startsWith('UDP '))
```
3. **Line 9,906.** AR-009, its words: AR-009's finding names the UDP listeners it found, rather than UDP 514. With UDP 514 alone it reads as before.
```
old: `${n} listens on UDP 514 but
new: `${n} listens on ${lb.lbListeners.map(id=>listeners[id]?.[0]).filter(t=>t?.startsWith('UDP ')).join(', ')} but
```
4. **Line 9,914.** The card's sender-address fact: The card shows "Sender address via PROXY protocol" in the review colour when the load balancer listens on UDP: any UDP listener now, not UDP 514 only.
```
old: n.lbListeners.includes('udp514')
new: n.lbListeners.some(id=>listeners[id]?.[0].startsWith('UDP '))
```
5. **Line 9,940.** The block's end: `window.builderLb186` lends the new block the listener table, `update()` and `clean()`, so that a listener it adds goes through the same update as a checkbox: the links' details follow, and Undo takes it as one step.
```
old: changeRegister.find(g=>g.group==='Explorer foundations')?.items.push(['Load balancer: one address in front
new: window.builderLb186={listeners,update,clean};changeRegister.find(g=>g.group==='Explorer foundations')?.items.push(['Load balancer: one address in front
```

## The new block

**`<script id="builder-ports-v230">`** goes right after `catalog-sync-v229`'s `</script>` (line 17,550 of Build 229). It contains [`docs/mockups/builder-ports-prototype.js`](mockups/builder-ports-prototype.js). It needs `window.builderLb186` from edit 5, and the Builder's own functions. It wraps:
- `renderBuilderInstanceInspector`, for the two editors;
- `unifiedNodeMarkup`, for the card;
- `defaultRelationshipDetails` and `relationshipInspectorMarkup`, for links;
- `topologyDocument`, `validateTopologyDocument` and `loadTopologyDocument`, for files.

It adds the three rules to `architectureRules`. It puts its markup into the card's and the link inspector's with functions, not replacement strings, so a `$` in a name or in senders is taken as typed.

Its styles, **`<style id="builder-ports-v230-styles">`**, go right after `config-parts-v228-styles`'s `</style>` (line 16,377).

`window.builderPorts230` gives:
- `ports(node)`: a Syslog Server's ports, its defaults when it has none of its own;
- `lbPorts(node)`: a load balancer's listeners as ports;
- `receiverPorts(node)`: either of those, by type;
- `listenerId(serves, protocol, port)`;
- `sanitize(list)`;
- `DEFAULT`.

## Build records

After the edits and the block, in a new `<script id="builder-ports-records-v230">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Ports on a load balancer and a Syslog Server','A Syslog Server listens on as many ports as a design needs, UDP, TCP or TLS, with the senders a port is for; a load balancer takes any listener port beside its presets. Links, rules and files check them.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 229 did in its records, with Build 230 and 24 Nov 2026.

## Check before uploading

Run with Build 229 + the edits, the block and the styles, and with Build 229 for comparison.

### 1. The checks: 29. All pass with the edits; 27 fail on Build 229

| Checks | What they find | Fail on Build 229 |
|---|---|---|
| A Syslog Server's ports (10) | Its card's ports. Listening ports first in Settings, with the defaults and the words. Add a port, focused, and on the card. Undo and Redo as one step. A number and senders. Five refused changes, with nothing changed. The card past three ports, each port on one line. Remove, down to the last | 10 |
| Cards (1) | Nothing ends outside its card at 100%, 77% or 60% | 0 |
| Links (7) | The Port field's numbers and words; on a port the server doesn't listen on, the amber words, each port on one line, the TLS field's height beside them, and AR-016; a link following the first port; a `$` in a name and in senders, as typed on the card, its tooltip and the words | 7 |
| A load balancer's listeners (7) | UDP 5005 added beside the presets, on its card and links. Undo. Four refusals. Enter adds TLS 6515. AR-017's findings; untick to remove, and AR-017 passes. HTTPS 8443 on a HEC load balancer | 7 |
| Rules and files (3) | AR-018's advisory. A file out and back the same. A file's bad ports dropped and said | 3 |
| Page errors (1) | None | 0 |

The 2 that pass on Build 229 too are the check that nothing ends outside its card, and that there are no page errors.

**The block's data, in the page:** 26 checks, all pass. They cover:
- the listener table: the presets, any other port's id, and ids that aren't listeners;
- `clean()` with the new ids;
- reading ports;
- the defaults;
- a listener's id;
- each rule on files, AR-009 included;
- a file out and back;
- a link's first port.

### 2. Regression against Build 229

What Build 230 adds is taken out of the new page before comparing:
- a Syslog Server's port line, and its Listening ports section;
- a load balancer's other listeners, and its Add a port row;
- the ports hint under a link's Port;
- AR-016 to AR-018, from the rules' results and the report;
- `syslogPorts`, from the topology file.

The views, the Operations pages and the OV pages are read with AR-016 to AR-018 out of the rules and `syslogPorts` out of the topology file, as two OV pages list the rules and the evidence pack holds the file. Read with them in, three of the 48 Operations and OV pages differ from Build 229, and only there:
- **AV-2** names AR-001–AR-018 for AR-001–AR-015, and 18 rules checked by Validate for 15.
- **SV-10a** has a row for each of AR-016 to AR-018, with nothing to check on the Builder's own topology. Each of its counts of rules is three more: Splunk Enterprise checks 22 for 19, Splunk Cloud 32 for 29 and Hybrid 36 for 33.
- **The evidence pack** is 479.4 KB for 477.8 KB. Four of its 32 files are larger, and its manifest gives their sizes: the topology file, the architecture report, and the event walkthrough and failure injection files, which hold the topology.

| What is compared | Result |
|---|---|
| View text, every view; Operations pages; OV pages | 58 of 58 the same |
| Every path: the Flow view's text and the route | 12 paths, 25 of 25 the same |
| Every failure's detail and owners; every symptom | 65 failures and 13 symptoms, 145 of 145 the same |
| The Config view, with no files, the example, the Fortinet add-on's four files and its package | 279 of 279 the same |
| Four Builder topologies, each component's inspector on each of its tabs | 60 of 60 the same |
| The same topologies, each link's inspector | 16 of 16 the same |
| The same topologies: the canvas's text, every card's text and box, the rules' results, the Builder's validation, every link's label and details, the network overlay, the topology file and the architecture report | 32 of 32 the same, 8 for each topology |
| Page errors | None on either |

The four topologies:
- the Builder's own, a Syslog Server;
- a syslog load balancer in front of two Syslog Servers;
- a HEC load balancer;
- a Deployment Server cluster.

Each comparison takes Build 229 twice, to set aside whatever varies from run to run; nothing did. The topology file is compared with its timestamps blanked, and the ids the page makes from the clock: a layout profile's, a change's, a bookmark's and a host's.

**Build 229's own checks** pass on both: 26 of 26 and 13 of 13 on each.

**The Config view's results Splunk checked** are as with Build 229: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

| Earlier suite or tool | Build 229 | Build 229 + the edits |
|---|---|---|
| Build 228's 36 checks | 36 of 36 | 36 of 36 |
| Build 228's 39 checks of its block, in Node | 39 of 39 | 39 of 39 |
| Build 227's 47 checks | 47 of 47 | 47 of 47 |
| Build 227's 31 checks of its block, in Node | 31 of 31 | 31 of 31 |
| Build 226's 29 checks | 29 of 29 | 29 of 29 |
| Build 226's 78 checks of its blocks, in Node | 78 of 78 | 78 of 78 |
| Build 225's 24 checks, as Build 226 runs them | 24 of 24 | 24 of 24 |
| Lookup checks: 54 checks, as Build 226 runs them | 54 of 54 | 54 of 54 |
| Build 224's 51 checks, as Build 225 runs them | 51 of 51 | 51 of 51 |
| Build 224's own 51 checks | 48 of 51 as written † | 48 of 51 as written † |
| Lookup checks: 54 checks, as Build 223's handoff wrote them | 46 of 54 as written † | 46 of 54 as written † |
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) ‡ | 63 of 64 as written † | 63 of 64 as written † |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote ‡ | 69 of 70 as written † | 69 of 70 as written † |
| The source type map's 82 checks | 82 of 82 | 82 of 82 |
| The splits' 40 checks, with the map's tools taken out as Build 224's handoff says | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines' 31 checks | 31 of 31 | 31 of 31 |
| The space tool | The output | The same output |
| The connector tool | The output | The same output |
| The Builder's redraws, 4 components: budget 40 ms § | 32 ms; 34 ms after a card moves | 39 ms; 34 ms after a card moves |
| The Builder's redraws, 5 components: budget 50 ms § | 45 ms; 46 ms after a card moves | 44 ms; 47 ms after a card moves |
| The Builder's redraws, 8 components: budget 80 ms § | 93 ms; 109 ms after a card moves | 79 ms; 75 ms after a card moves |
| The Builder's redraws, 17 components, the reference topology: budget 120 ms § | 88 ms; 119 ms after a card moves | 79 ms; 107 ms after a card moves |
| The offline check, with the Fortinet add-on's package | 23 of 23 | 23 of 23 |

† As before: three of Build 224's checks want what Build 225 changed; eight of the lookup checks, as first written, want what Build 226 changed; one of Build 222's wants a folder's macros.conf counted among the skipped files; one of the Config view handoff's wants Where it acts right above the file tabs.

‡ With only their page-load limit raised, from 2.5 to 15 seconds, on both pages; every other limit and check as written. As written, they stopped before they finished when a page took longer than 2.5 seconds to load: both on Build 229, both times, in the run with the other suites and run again on their own. On the edited page, as written, they finished both times, with the results above. In the timings, the page took a median of 2.2 seconds on Build 229 and 2.2 with the edits, and up to 3.2, to load (see Time).

§ `tools/builder-perf-check.js`, five runs on each page in turn after the timings: the medians of its redraw after a change, and after a card moves. Over its budget on one page or both, taking the slower of the two medians: 8 components, 109 ms on Build 229 and 79 ms with the edits, for a budget of 80 ms. Each of the ten runs, on either page, was over at least one budget, and so was Build 229's one run in the final run (8 components, 109 ms for 80): here the budgets don't judge the edits. Section 3 times the redraws the edits change, over 21 visits to each page.

### 3. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 229 | With the edits |
|---|---|---|
| Loading the page, to its load event | 2209 ms (1861 to 3178) | 2162 ms (1843 to 3022) |
| A Builder redraw: its own topology, a Syslog Server | 37.6 ms (30.7 to 48.2) | 35.1 ms (29.8 to 47.8) |
| The Syslog Server's inspector, on Settings † | 0.07 ms (0.05 to 0.10) | 0.83 ms (0.49 to 1.18) |
| A Builder redraw: a load balancer and two Syslog Servers | 54.5 ms (46.5 to 70.0) | 55.1 ms (44.5 to 74.9) |
| The load balancer's inspector, on Settings | 1.59 ms (1.05 to 1.93) | 1.76 ms (1.16 to 2.46) |
| A Builder redraw: ten Syslog Servers with ten ports each | 129.1 ms (104.9 to 161.4) | 151.7 ms (122.7 to 199.0) |
| The architecture rules, on the same | 0.52 ms (0.27 to 1.30) | 0.83 ms (0.52 to 1.17) |

- **Each figure** with the edits is within Build 229's spread, and Build 229's within theirs, but for the one marked †: the Syslog Server's inspector, on Settings, +0.76 ms on the median. Of the redraws, ten Syslog Servers with ten ports each changed most: +22.56 ms on the median (+17%), within both spreads.

### 4. The build

`index.html` as committed, Build 230, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks.
- The new checks pass on Build 230 as on the tested page: 29 of 29 and 26 of 26.

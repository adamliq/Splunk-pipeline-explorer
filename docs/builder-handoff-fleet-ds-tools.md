# Fleet handoff: Fleet and Deployment Server tools

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 232.
**Applied:** as Build 233, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="fleet-ds-tools-v233">` (726 lines), after `builder-sweep-v232`, containing [`docs/mockups/fleet-ds-tools-prototype.js`](mockups/fleet-ds-tools-prototype.js). It sets `window.fleet233`.
- `<style id="fleet-ds-tools-v233-styles">` (147 lines), after `builder-sweep-v232-styles`.

**Six in-place edits:** the change register's six entries for these tools, marked implemented. The edits, the block and the styles are also in [`docs/mockups/fleet-ds-tools.diff`](mockups/fleet-ds-tools.diff), a unified diff against Build 232's `index.html` with no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Fleet and Deployment Server: Fleet cohort rollout simulator, Deployment Server capacity model, Configuration dependency graph, Upgrade compatibility planner, Import real deployment inventory, Release approval evidence workflow."

**How it was done:**
- Splunk's own pages were read for every figure and rule the tools use (the sources below), on help.splunk.com.
- A real Splunk Enterprise 10.6.1.1 Deployment Server and two deployment clients were run in Docker. What the tools take from Splunk was checked there: the inventory export in each of its formats, which app wins a setting, a cohort file, the 9.4.3 change, the phone-home records and the app-event search (section 2 of the checks).
- The explorer's answers for that fleet were compared with Splunk's.

**Sources** (Splunk documentation, help.splunk.com):
- [deploymentclient.conf, 10.4.2](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.2-configuration-file-reference/deploymentclient.conf): `phoneHomeIntervalInSecs` 60 by default; the handshake retried every `phoneHomeIntervalInSecs` / 5; app state reported every 10 × `phoneHomeIntervalInSecs`.
- [serverclass.conf, 10.4.2](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.2-configuration-file-reference/serverclass.conf): `whitelist.from_pathname` with `select_field`, `where_field` and `where_equals`; `maxConcurrentDownloads`; `restartSplunkd`; the app level's implicit `filterType` from 9.4.3; reloading the Deployment Server.
- [Estimate agent management performance, 10.2](https://help.splunk.com/splunk-enterprise/administer/update-your-deployment/10.2/manage-the-agent-management/estimate-agent-management-performance): T = 0.0075 × C + 2 minutes on Linux and T = 0.04 × C + 8 on Windows for 50 MB at a 60-second phone home, Windows to 3,000 agents; 300 s above 2,000 agents; `dedicatedIoThreads` above 10,000.
- [Plan a deployment, 10.2](https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/10.2/configure-the-agent-management-system/plan-a-deployment): a dedicated instance above 50 agents; never beside an indexer cluster manager.
- [Implement a deployment server cluster, 9.4](https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/9.4/configure-the-deployment-system/implement-a-deployment-server-cluster): up to 3 servers, 25,000 clients each, 9.2 or later, `syncMode = sharedDir`, a shared drive for `deployment-apps` and `client_events`, a load balancer with sticky sessions.
- [Upgrade pre-9.2 deployment servers, 10.0](https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/10.0/configure-the-agent-management-system/upgrade-pre-9.2-deployment-servers): the `_dsphonehome`, `_dsclient` and `_dsappevent` indexes on pre-9.2 indexers; `[indexAndForward]` on a Deployment Server that forwards its logs.
- How to upgrade Splunk Enterprise, the tables of supported paths: [10.0](https://help.splunk.com/en/splunk-enterprise/administer/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise), [10.2](https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.2/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise), [10.4](https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.4/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise), [10.6](https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.6/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-splunk-enterprise).
- [How to upgrade a distributed Splunk Enterprise environment, 10.0](https://help.splunk.com/en/splunk-enterprise/get-started/install-and-upgrade/10.0/upgrade-or-migrate-splunk-enterprise/how-to-upgrade-a-distributed-splunk-enterprise-environment): the order of the tiers.
- [Compatibility between forwarders and Splunk Enterprise indexers](https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/compatibility-matrix/splunk-products-version-compatibility/compatibility-between-forwarders-and-splunk-enterprise-indexers): forwarders 9.0 to 9.3 have no entry for 10.6 indexers; indexers the same version as their forwarders or later as the best practice.
- [Configuration file precedence, 10.2](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.2/administer-splunk-enterprise-with-configuration-files/configuration-file-precedence): the global context's order; app directories in byte order.

**Mockup (the target):** [`docs/mockups/fleet-ds-tools-mockup.html`](mockups/fleet-ds-tools-mockup.html).
- 7 scenes have the block, its styles and the edits applied to Build 232.
- 3 "Today" scenes are Build 232.
- The screenshots are `docs/mockups/compare/fleet-ds-tools-*.png`.

## Where the tools are

Operate › Multi-DS management keeps its button and its overview. A row of seven buttons now heads it: Overview, Inventory, Rollout, Server capacity, Dependencies, Upgrades and Release approval. Each is a view of the same fleet inventory.

**The sample fleet, made whole.** The overview showed 620 agents on Regional DS A and 480 on Regional DS B, but its five server classes held only 940 of them. The sample now has a sixth class, `sc_network_collectors`: 160 Linux syslog collectors, 60 on A and 100 on B. The other five keep their counts (510, 390, 40, 35 and 145), and the overview's server-class table lists six.

What else the sample now holds:
- Splunk versions per agent (123 on 9.1.6, 132 on 9.2.4, 160 on 9.3.2, 685 on 9.4.2).
- 15 agents that haven't phoned home for days.
- Each deployment app's size and settings.

Two pairs of its apps set the same setting differently, as fleets do; Splunk 10.6 resolves both pairs as the tools say (section 2).

## The six tools

### 1. Import real deployment inventory (Inventory)

- **What it reads:** the search `| rest /services/deployment/server/clients splunk_server=local count=0`, exported from Splunk Web as CSV or JSON, or the REST endpoint's own JSON, the search API's JSON or JSON rows. All five formats give the same agents (checked with the real Deployment Server's own exports). It can also read `serverclass.conf`, for each server class's filters and apps.
- **What it keeps:** for each agent, its clientName, IP, utsname, Splunk version, package, server classes, apps, and each app's checksum, install result and size, as the columns Splunk 10.6 exports (`serverClasses.<class>.<setting>`, `applications.<app>.checksum`, `.result`, `.size`, `.serverclasses`).
  - Ages are counted from the export's own time (`dataTimestamp`), not from the moment it is read, so an export read later doesn't make every agent look stale.
  - An agent that reports an average phone home of 0 (just restarted) takes the fleet's median.
  - A class's apps come from serverclass.conf, else from the apps whose `serverclasses` name it.
- **Before anything changes:** a preview says what was read: agents, classes, apps and servers, which columns were used and which weren't, and any warnings. It asks which Deployment Server (`splunk_server`) is Regional DS A or B.
- **After "Use this inventory":**
  - The overview's server-class table, representative clients and regional agent counts follow it, and so do the other five tools. "Back to the sample" puts everything back, the rollout's own choices included.
  - Nothing is stored or sent: the inventory stays in the tab, and downloads as JSON.
  - The export doesn't give a Deployment Server's own version, so the planner asks for it.
- **Scale:** a made-up export of 30,000 agents on one server is read and shown in 1,884 ms, and the Server capacity page then names the I/O threads, the five-minute phone home and the cluster it needs.
- **Where:** block, `20-inventory`, `22-import` and `23-inventory-view` (the parts are in order in the prototype file).

### 2. Fleet cohort rollout simulator (Rollout)

- **Cohorts:** the canary is every live agent of the canary server class (`sc_canary` in the sample) in the chosen server classes. Each wave then takes agents up to its share of the rest, region by region.
- **The cohort files:** a CSV of clientName, wave and region, and the `serverclass.conf` steps that use it. One server class reads the cohorts with `whitelist.from_pathname`, `select_field = clientName`, `where_field = wave` and `where_equals`. Each step adds the next wave to `where_equals`, and `splunk reload deploy-server -class` reloads only that class (checked on Splunk 10.6, section 2).
- **Time:** each push takes Splunk's measured time for its agent count, from its sizing page.
  - **This model's assumptions, said on the page:** for a bundle other than 50 MB, the per-agent part is scaled by its size; a phone home longer than 60 s adds its extra wait.
  - With `maxConcurrentDownloads` set, agents over the limit retry at their next phone home, so a push takes at least that many phone-home rounds.
- **Windows and gates:**
  - A push starts only inside its region's daily maintenance window (UTC), and only if it ends inside it; otherwise it waits for the next one.
  - Each wave soaks, then a health gate stops the release when more than its share of the wave fails.
  - For a release that breaks a given share of agents, each gate's chance of stopping it is the binomial chance of more than the gate's share failing. The page gives the agents expected to have it before it stops, and the rollback (which doesn't wait for a window) when a stop is shown.
- **Sample:** cohorts of 35, 85, 255 and 510 agents; the plan takes 6.1 h. A release that breaks 5% is stopped at the canary 83% of the time (1 − 0.95^35), with 52 agents expected to have it.
- **Where:** block, `40-rollout` and `41-rollout-view`.

### 3. Deployment Server capacity model (Server capacity)

- **Each server's load:**
  - phone homes a second (agents ÷ `phoneHomeIntervalInSecs`);
  - handshake retries while it is down (every interval ÷ 5);
  - app-state reports (every 10 intervals);
  - Splunk's time to push 50 MB, and this release with the model's assumptions;
  - the bundle bytes sent, and the shortest time on the wire.
- **The chart:** the time to push the release by agents on one server, for Splunk's Linux and Windows test hosts. The Windows line ends at the 3,000 agents its formula holds to. It reads out by pointer and by keyboard, and its numbers are also in a table.
- **Against Splunk's guidance:**
  - a dedicated host above 50 agents;
  - a five-minute phone home above 2,000;
  - `[httpServer] dedicatedIoThreads` at cores ÷ 2 (or cores − 1) above 10,000;
  - a cluster above 25,000 a server: up to three servers on 9.2 or later, 75,000 agents;
  - separate authorities beyond that.
- **Phone-home records:** each phone home is a record in `_dsphonehome`, about 330 bytes on Splunk 10.6.1.1. The page shows the records a day and their size. `SplunkDeploymentServerConfig` keeps `_dsphonehome` 7 days and `_dsclient` and `_dsappevent` 60 days.
- **Sample:** 18.3 phone homes a second; Splunk's 0.0075 × 620 + 2 = 6.65 min for Regional DS A; 1,584,000 records a day.
- **Where:** block, `30-capacity` and `31-capacity-view`.

### 4. Configuration dependency graph (Dependencies)

- **What it shows:** each setting (file, stanza, key) that the deployment apps set, which apps set it, the server classes that deploy those apps, and the groups of agents that get them, each with the value it ends up with.
- **Which value wins:** inputs.conf and outputs.conf are read in Splunk's global context. Every app's `local` directory outranks every app's `default` directory. Among apps, the directory name first in byte order wins: digits, then capitals, then `_`, then lower case.
- **The graph:** its paths show the winning value's way to each group of agents. Groups where two apps disagree are flagged, and the table gives every group's value, where it comes from and what loses.
- **Your own apps:** app packages (.tgz, .tar.gz, .spl, .tar or .zip) or a deployment-apps folder are read in the page. Only their `default/` and `local/` .conf files and `app.conf`'s version are kept. The package limits are the Config view's: 64 MiB packed, 256 MiB expanded, 20,000 entries, and no path that leaves the package.
- **Sample:** three settings where two apps disagree:
  - `outputs.conf [tcpout] defaultGroup`: 145 agents keep `primary_indexers` from outputs_primary; regional_network sets `regional_b_indexers`, but “outputs_primary” sorts before “regional_network”.
  - `inputs.conf [WinEventLog://Security] renderXml`: 18 agents keep `true` from TA_windows_security; release_candidate sets `false`, but “TA_windows_security” sorts before “release_candidate”.
  - `inputs.conf [monitor:///var/log/audit/audit.log] index`: 17 agents keep `linux_audit` from TA_linux_auditd; release_candidate sets `linux_audit_v2`, but “TA_linux_auditd” sorts before “release_candidate”.
- **Where:** block, `50-deps` and `51-deps-view`. It reads .conf files with the Config view's own reader (`window.configView205.parseConf`).

### 5. Upgrade compatibility planner (Upgrades)

- **Paths:** each tier's supported path to the target (9.4, 10.0, 10.2, 10.4 or 10.6), from the four upgrade pages' tables of supported paths. 9.2 to 10.2 goes by 9.4, as the 10.2 page's footnote asks. A version none of them lists (9.0, 9.1) has no supported path.
- **Forwarders against indexers:** Splunk's table. Forwarders 9.0 to 9.3 have no entry for 10.6 indexers; indexers before 9.4 aren't in it. Forwarders newer than the target are flagged as against the best practice.
- **Deployment Servers:** a server behind its agents, or a regional server ahead of the Tier 1 server, is flagged. Splunk's distributed upgrade starts with the Deployment Server, so it stays ahead of the forwarders.
- **The 9.2 change:** a 9.2 or later Deployment Server forwarding to pre-9.2 indexers needs the three `_ds` indexes there; the `[indexAndForward]` fix is noted when it forwards its logs.
- **The 9.4.3 change:**
  - An app-level stanza with a blacklist, or with machineTypesFilter, and neither a whitelist nor `filterType = blacklist`, matches no agents from 9.4.3.
  - It is caught in the sample's or the imported serverclass.conf whenever a Deployment Server crosses 9.4.3.
  - On Splunk 10.6 such a stanza took the app off both test agents, and `filterType = blacklist` put it back (section 2).
- **Apps:** each app's Splunk range is an input; the sample's ranges are examples.
- **Order:**
  1. Deployment Servers (no restart).
  2. Search heads, one at a time, or by the search head cluster procedure.
  3. Indexers, one by one, or by the indexer cluster procedure.
  4. Restart the Deployment Servers.
  5. Forwarders, by cohort.
- **Sample, to 10.0:** the 123 universal forwarders on 9.1.6 have no supported path; TA_windows_security’s app stanza has only a blacklist, so from 9.4.3 it would match none of sc_windows_security’s 510 agents; TA_api_collection declares Splunk 9.1 to 9.4; and Regional DS B (9.3.2) is behind 265 of its agents.
- **Where:** block, `60-upgrade`.

### 6. Release approval evidence workflow (Release approval)

- **The record:** one record for one release:
  - the change: reference, requester, release, approved manifest;
  - the canary's evidence: agents on the new checksum, failed installs, oldest phone home;
  - the rollback: package kept, owner, trigger, decision;
  - the approver's decision.
- **Its 12 checks:**
  - The other tools supply: the overview's parity, authority and approval; whether the release's own settings win, from Dependencies; a canary first and every push in its window, from Rollout.
  - A person enters: the evidence, and two different people, requester and approver.
  - Approve waits until none fails.
- **Where the evidence comes from:**
  - The page shows the `_dsappevent` search for the release's installs, checksums and results; it works as shown on Splunk 10.6 (section 2).
  - With an imported inventory, "Fill from the inventory" takes the same from the export.
- **The download:** JSON and Markdown, with a SHA-256 of the record's content in a fixed key order. A saved record loads back with its digest checked, and a changed one is called out. Nothing is kept outside the tab.
- **Sample:** 8 of the 12 checks fail until the evidence is entered. Two stay failed with it: Regional DS B's drift from the Tier 1 manifest, and release_candidate's two settings that lose on its canary.
- **Where:** block, `70-approval`.

### Downloads, the evidence pack and the report

`multiDeploymentServerJson()` is version 4, with a `fleetTools` section: the inventory's summary, each server's load, the rollout's cohorts and timing, the settings where apps disagree, the upgrade's blockers and the approval's state. The evidence pack and the architecture report carry it, as they carry the model.

### Not covered

- **A Deployment Server cluster wasn't run:** its limits and settings are Splunk's page's, not seen working here.
- **The push times are Splunk's measured formulas,** with this model's two stated assumptions; Splunk's Windows figure holds only to 3,000 agents.
- **The Splunk versions the apps declare** are the person's inputs.
- **The Deployment Server doesn't upgrade forwarder binaries:** the planner orders their upgrade, but doesn't do it.
- **The export doesn't give a Deployment Server's own version.**
- **Imported inventories and approval records live in the tab only;** both download as JSON.

## The edits

The lines are Build 232's.

1. **Line 1,802, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Fleet cohort rollout simulator','Model canary, wave, pause, rollback and regional maintenance windows.',false,'High'],
new: ['Fleet cohort rollout simulator','Model canary, wave, pause, rollback and regional maintenance windows.',true,'High'],
```
2. **Line 1,803, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Deployment Server capacity model','Estimate phone-home concurrency, bundle transfer, repository I/O and management-port load.',false,'High'],
new: ['Deployment Server capacity model','Estimate phone-home concurrency, bundle transfer, repository I/O and management-port load.',true,'High'],
```
3. **Line 1,805, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Configuration dependency graph','Show which deployment apps, server classes and client populations consume each setting.',false,'Medium'],
new: ['Configuration dependency graph','Show which deployment apps, server classes and client populations consume each setting.',true,'Medium'],
```
4. **Line 1,806, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Upgrade compatibility planner','Compare Splunk, add-on, app and configuration compatibility across fleet tiers.',false,'Medium'],
new: ['Upgrade compatibility planner','Compare Splunk, add-on, app and configuration compatibility across fleet tiers.',true,'Medium'],
```
5. **Line 1,808, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Release approval evidence workflow','Record approver, change reference, checksum, canary evidence and rollback decision.',false,'Medium'],
new: ['Release approval evidence workflow','Record approver, change reference, checksum, canary evidence and rollback decision.',true,'Medium'],
```
6. **Line 1,809, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Import real deployment inventory','Map exported client/server-class/app inventory into the Multi-DS model.',false,'Medium'],
new: ['Import real deployment inventory','Map exported client/server-class/app inventory into the Multi-DS model.',true,'Medium'],
```

## The new block

**`<script id="fleet-ds-tools-v233">`** goes right after `builder-sweep-v232`'s `</script>` (line 18,357 of Build 232). It contains [`docs/mockups/fleet-ds-tools-prototype.js`](mockups/fleet-ds-tools-prototype.js), and uses the page's own functions.

It wraps these:
- `renderMultiDeploymentOperations`, for the row of tools and each tool's view;
- `deploymentFleetModel`, so the overview's tables read the inventory;
- `multiDeploymentServerJson`, for version 4's `fleetTools`.

It sets `window.fleet233`, which gives each tool's model to the checks.

Its styles, **`<style id="fleet-ds-tools-v233-styles">`**, go right after `builder-sweep-v232-styles`'s `</style>` (line 16,826).

## Build records

After the edits and the block, in a new `<script id="fleet-ds-tools-records-v233">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Fleet and Deployment Server tools','Operate › Multi-DS management gains a row of tools on one fleet inventory: a real Deployment Server’s export read in the page, a cohort rollout simulator, the Deployment Server’s capacity against Splunk’s own sizing figures, a configuration dependency graph, an upgrade planner and a release approval record.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 232 did in its records, with Build 233 and 25 Nov 2026.

## Check before uploading

Run with Build 232 + the edits, the block and the styles, and with Build 232 for comparison.

### 1. The checks: 58. All pass with the edits

Each check opens the page as a person would and uses a tool as the six features describe, with the real Splunk 10.6 exports and app packages where it reads files. On Build 232 the tools aren't there: 2 pass (the overview is as before; no page errors) and the rest fail or can't start.

- **The row of tools:** Multi-DS management has a row of seven tools, Overview first and pressed; the overview is as before, under the row; the overview's server classes come from the inventory: the five, and sc_network_collectors's 160 agents; inventory opens, its button pressed and focused; rollout opens, its button pressed and focused; capacity opens, its button pressed and focused; dependencies opens, its button pressed and focused; upgrades opens, its button pressed and focused; approval opens, its button pressed and focused.
- **Inventory:** the sample: 1,100 agents, 620 on A and 480 on B, 15 not phoning home; the sample keeps the overview’s class sizes and adds 160 syslog collectors; the agents table starts with those not phoning home, 25 shown; the real Splunk 10.6 export with its serverclass.conf reads as 2 agents, 4 server classes from serverclass.conf, 5 apps; used: the agents with their classes, apps, version and utsname; ages are as of the export, and the agent that reported 0 takes the median phone home; the overview's agent counts follow the inventory; the overview's server classes are the imported four; the export JSON, JSON rows, REST response and one-shot JSON give the same agents as the CSV; back to the sample restores 620 and 480; a file that isn’t an inventory gives nothing to use; 30,000 agents read and shown in 1884 ms (under 8 s); 30,000 on one server: dedicated I/O threads, a five-minute phone home and a cluster; two servers behind one address take 15,000 each: no cluster finding; back to the sample, the rollout has its release and server classes again.
- **Rollout:** the sample’s cohorts: 35 canary agents, then 85, 255 and 510; a bad release that breaks 5% is stopped at the canary 83% of the time (1 − 0.95^35), 52 agents expected to have it; every push is inside its region’s window, the plan 6.1 h from 21:30; a one-minute window for A: the pushes that don’t fit are named; a stop at the canary draws the canary’s pushes, the stop and a rollback for each region; the cohorts file: clientName, wave and region for 885 agents; serverclass.conf steps widen where_equals and reload only that class; a gate on the timeline takes focus and reads out.
- **Server capacity:** 620 agents every 60 s: 10.33 phone homes a second, Splunk’s 0.0075 × 620 + 2 = 6.65 min, retries 5 × as often; 1,584,000 phone-home records a day for 1,100 agents; Windows: 0.04 × 620 + 8 = 32.8 min; the chart reads out by keyboard: both formulas at the step; the chart’s numbers are in a table too.
- **Dependencies:** the sample’s three settings where apps disagree, and who wins; Show it picks that setting and draws its graph; with the real packages (.tgz and .zip), each agent's value is the one btool showed on Splunk 10.6; a package with a ../ path is refused.
- **Upgrades:** to 10.0: 9.1.6 has no path, TA_windows_security’s blacklist-only stanza, TA_api_collection’s range, Regional DS B behind; to 10.6: the 415 forwarders before 9.4 can’t send to the indexers; paths from Splunk's tables: 9.2→10.0→10.4, 9.3→10.0→10.6, 9.4→10.0, none from 9.1, 9.2→9.4→10.2; the 9.4.3 check: a blacklist alone or machineTypesFilter alone is caught; filterType = blacklist or a whitelist clears it.
- **Release approval:** Fill from the inventory: 1 of 1 canary agent on the release’s checksum, none failed; the approver can’t be the requester; Approve waits while checks fail, and with the evidence entered only the region drift and the losing settings are left; with Region B matching Tier 1, only the losing settings block; the record’s SHA-256 is over its content in a fixed key order; the JSON record carries the change, checks, canary, approval, rollback and its sha256; a saved record loads back with its SHA-256 checked, and a changed one is called out; the Markdown record names the decision, the checks and the digest.
- **Exports, the register, and every tool:** the Multi-DS download is version 4 with the tools’ results; the change register lists the six as implemented; at 1440 px every tool's text is 11 px or more, every control named, no sideways page; at 390 px every tool's text is 11 px or more, every control named, no sideways page; no page errors.

### 2. Against Splunk 10.6.1.1

A Deployment Server and two deployment clients (clientNames `linux-canary-a01` and `linux-edge-b01`, phone home every 10 s) in Docker, with five test apps and four server classes like the sample's:

| What was checked | Splunk | The tools |
|---|---|---|
| The clients' inventory | `\| rest /services/deployment/server/clients` exported as CSV (109 columns), JSON lines and JSON rows; the REST endpoint's JSON; the one-shot search's JSON | The same 2 agents, 4 server classes and 5 apps, with each app's checksum, from each |
| An agent that just restarted | `averagePhoneHomeInterval` 0 for linux-edge-b01, 10 for linux-canary-a01 | 10 s for both: the fleet's median |
| `[tcpout] defaultGroup` on linux-edge-b01, set by outputs_primary and regional_network | btool: `primary_indexers`, from `apps/outputs_primary/default/outputs.conf` | `primary_indexers` from outputs_primary; regional_network’s `regional_b_indexers` loses |
| `index` of the audit-log monitor on linux-canary-a01, set by TA_linux_auditd and release_candidate | btool: `linux_audit`, from `apps/TA_linux_auditd/default/inputs.conf` | `linux_audit` from TA_linux_auditd; release_candidate’s `linux_audit_v2` loses |
| A cohort file: `whitelist.from_pathname`, `select_field = clientName`, `where_field = wave`, `where_equals = canary` | Only linux-canary-a01 got the cohort’s app; with `where_equals = canary,1` and `splunk reload deploy-server -class`, linux-edge-b01 got it 10 s later | The serverclass.conf steps the Rollout page writes use the same settings, widening `where_equals` and reloading the one class |
| An app stanza with only `blacklist.0` (the 9.4.3 change) | TA_linux_auditd left both agents 10 s after the reload; `filterType = blacklist` put it back 10 s after the next | The planner flags such a stanza as matching no agents, and names `filterType = blacklist` or a whitelist as the fix |
| A phone-home record | 328 to 330 bytes in `_dsphonehome`; `SplunkDeploymentServerConfig` keeps it 604,800 s (7 days), `_dsclient` and `_dsappevent` 5,184,000 s (60 days) | 330 bytes a record, kept 7 days, on the Server capacity page |
| The canary's installs: the Release approval page's search on `_dsappevent` | linux-canary-a01: release_candidate, `Ok`, checksum 16204171110892632758 (the same with `spath`) | “Fill from the inventory”: 1 of 1 canary agent on 16204171110892632758, none failed |

### 3. The tools, swept

Each tool's states (the overview; Inventory, with the real export previewed and used; Rollout, and with a stop at the canary; Server capacity; Dependencies, and with the real apps' packages; Upgrades to 10.0 and to 10.6; Release approval, and filled from the inventory), with the review's page check at four widths:

| In the 13 states | 1440 px | 1280 px | 1024 px | 390 px |
|---|---|---|---|---|
| Page or console errors | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 |
| Text under 10 px | 0 | 0 | 0 | 0 |
| Text under WCAG contrast | 0 | 0 | 0 | 0 |
| Text cut off in its box | 0 | 0 | 0 | 0 |
| Text over other text | 0 | 4 | 6 | 0 |
| Tap targets under 24 px | — | — | — | 2 |

Nothing the check finds is in the tools.
- **390 px:** the two small tap targets are the overview’s own Approval required and Competing authority checkboxes, 18 px, as on Build 232.
- **1024 and 1280 px:** in the states after a file is read (three of the four at 1024 px, all four at 1280 px), the page has scrolled to bring the preview into view, and the page’s own header passes under its sticky view switcher. The check counts that as text over text: the Builder and Operate buttons over Show components and model at 1024 px (348 px down), and the Flow button over the S3 → SQS → Catalog → Federated search chip at 1280 px (231 px down). Build 232’s Multi-DS management, scrolled as far, gives the same findings; the new page, at the top, gives none.

On Build 232 only the overview’s state can be reached.

The review's sweep of every page, as Build 231's handoff ran it:

| At each width | 1440 px: Build 232 | 1440 px: new | 1024 px: Build 232 | 1024 px: new | 390 px: Build 232 | 390 px: new |
|---|---|---|---|---|---|---|
| Page errors | 0 | 0 | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 | 0 | 0 |
| Text under WCAG contrast | 34 | 34 | 32 | 32 | 30 | 30 |
| Text under 10 px | 139 | 139 | 139 | 139 | 167 | 167 |
| Tap targets under 24 px | — | — | — | — | 108 | 108 |
| Ids used more than once | 576 | 576 | 576 | 576 | 576 | 576 |

Other sweeps:
- **Every control used once:** Build 232, 1,791 controls; the new page, 1,798 (its row of seven tools is in the overview). None leaves a page error on either. The sweep itself can’t click an SVG part with `click()`, or read the options of one list in the parsing laboratory (102 and 102). Controls with no effect it could see: 104 and 104.
- **Round the pages:** ten rounds on each page. Over rounds 2 to 10 the median is 38,271 DOM nodes on Build 232 and 38,280 on the new page, from 38,271 to 38,572 and from 38,277 to 40,525; the heap grows 0.38 MB and 0.38 MB a round after the first. Each page’s highest round passes: round 10 is back at 38,271 and 38,277.
- **Cut off by a box that hides overflow:** at 390 px, 12 on Build 232 and 12 on the new page, all on the Builder canvas, which pans; at 1440 px, none on either.

### 4. Regression against Build 232

The same snapshots as Build 232’s regression, of Build 232 and the new page. What Build 233 means to change is set aside on the new page: the row of tools and its note on the inventory are out of the page while the text is read, and so is the overview’s new sc_network_collectors row; the change register’s six entries go back to Proposed next features with their priorities (the page rebuilds an implemented entry without one); and in the evidence pack’s JSON files the Multi-DS model’s `fleetTools`, its version 4 and sc_network_collectors are left out. Build 233’s own checks, in section 1, look at what it changes. Build 231’s and 232’s set-asides are kept.

| What is compared | Result |
|---|---|
| View text, every view; Operations pages; OV pages; the evidence pack | 59 of 59 the same |
| Every path: the Flow view's text and the route | 25 of 25 the same |
| Every failure's detail and owners; every symptom | 145 of 145 the same |
| The Config view, with no files, the example, the Fortinet add-on's four files and its package | 279 of 279 the same |
| Four Builder topologies, each component's inspector on each of its tabs | 60 of 60 the same |
| The same topologies, each link's inspector | 16 of 16 the same |
| The same topologies: the canvas's text, every card's text and box, the rules' results, the validation, every link's label and details, the network overlay, the topology file and the architecture report | 32 of 32 the same |
| Page errors | None on either |

Each comparison takes Build 232 twice, to set aside whatever varies from run to run: nothing did. 615 of the 617 snapshots are the same before any normalising.

**The earlier suites and tools**, on both pages:

| Suite or tool | Build 232 | Build 232 + the edits |
|---|---|---|
| Build 232’s 29 checks | 29 of 29 | 29 of 29 |
| Build 231’s 37 checks | 37 of 37 | 36 of 37 as written † |
| Build 230’s 29 checks | 29 of 29 | 29 of 29 |
| Build 230’s 26 checks of its block, in Node | 26 of 26 | 26 of 26 |
| Build 229’s 26 checks | 26 of 26 | 26 of 26 |
| Build 229’s 13 checks of its block, in Node | 13 of 13 | 13 of 13 |
| Build 228’s 36 checks | 36 of 36 | 36 of 36 |
| Build 228’s 39 checks of its block, in Node | 39 of 39 | 39 of 39 |
| Build 227’s 47 checks | 47 of 47 | 47 of 47 |
| Build 227’s 31 checks of its block, in Node | 31 of 31 | 31 of 31 |
| Build 226’s 29 checks | 29 of 29 | 29 of 29 |
| Build 226’s 78 checks of its blocks, in Node | 78 of 78 | 78 of 78 |
| Build 225’s 24 checks, as Build 226 runs them | 24 of 24 | 24 of 24 |
| Lookup checks: 54 checks, as Build 226 runs them | 54 of 54 | 54 of 54 |
| Build 224’s 51 checks, as Build 225 runs them | 51 of 51 | 51 of 51 |
| Build 224’s own 51 checks | 48 of 51 as written † | 48 of 51 as written † |
| Lookup checks: 54 checks, as Build 223’s handoff wrote them | 46 of 54 as written † | 46 of 54 as written † |
| Event types, tags and CIM data models: 64 checks (Build 222’s handoff) ‡ | 63 of 64 as written † | 63 of 64 as written † |
| The Config view handoff’s 70 checks, with the expectation Build 222’s handoff rewrote ‡ | 69 of 70 as written † | 69 of 70 as written † |
| The source type map’s 82 checks | 82 of 82 | 82 of 82 |
| The splits’ 40 checks, with the map’s tools taken out as Build 224’s handoff says | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines’ 31 checks | 31 of 31 | 31 of 31 |
| The space tool | Meets every target | The same figures |
| The connector tool | Every connector OK | Every connector OK |
| The Builder’s redraws, 4 components: budget 40 ms § | 40 ms; 38 ms after a card moves | 38 ms; 41 ms after a card moves |
| The Builder’s redraws, 5 components: budget 50 ms § | 46 ms; 50 ms after a card moves | 40 ms; 48 ms after a card moves |
| The Builder’s redraws, 8 components: budget 80 ms § | 75 ms; 92 ms after a card moves | 77 ms; 105 ms after a card moves |
| The Builder’s redraws, 17 components, the reference topology: budget 120 ms § | 93 ms; 128 ms after a card moves | 91 ms; 87 ms after a card moves |
| The offline check, with the Fortinet add-on’s package | 23 of 23 | 23 of 23 |

**The Config view's results that Splunk checked** are the same on both pages: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

† Checks that want what a later build changed:
- **New with Build 233:** one of Build 231’s wants 15 changes proposed in the change register. Build 233 implements six of them, leaving 9; with 9 in place of 15, all 37 pass on the new page.
- **As before:** three of Build 224’s checks want what Build 225 changed; eight of the lookup checks, as first written, want what Build 226 changed; one of Build 222’s wants a folder’s macros.conf counted among the skipped files; one of the Config view handoff’s wants Where it acts right above the file tabs.

‡ These two have a 2.5-second page-load limit. They finished as written on both pages, and gave the same results with only that limit raised to 15 seconds.

§ `tools/builder-perf-check.js`, five runs on each page in turn after the other checks: the medians of its redraw after a change, and after a card moves. Over its budget: 4 components, on the new page; 8 components, on both pages; 17 components, on Build 232. Build 233 doesn’t change the Builder, and nothing it adds runs in a redraw: the Builder calls none of the three functions it wraps. As in Build 232’s handoff, these medians move from run to run on both pages.

### 5. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 232 | With the edits |
|---|---|---|
| Loading the page (to the load event) | 2,067.4 ms (1,669.7 to 2,365.5) | 2,030.4 ms (1,763.3 to 2,574.8) |
| The ten views, each to its next frame (all ten) | 2,821.7 ms (2,503.4 to 3,436.0) | 2,870.0 ms (2,549.6 to 3,229.1) |
| The 28 OV pages, each to its next frame (all) | 3,233.0 ms (2,795.3 to 3,757.2) | 3,126.5 ms (2,530.0 to 3,535.6) |
| Builder redraw, its own topology | 50.4 ms (42.5 to 69.2) | 53.2 ms (44.0 to 66.9) |
| Drawing the change register | 31.3 ms (24.9 to 43.3) | 34.4 ms (26.6 to 44.5) |
| Restyling and laying out the page, on Changes | 32.4 ms (18.7 to 41.2) | 29.1 ms (22.4 to 45.1) |

Each figure with the edits is within Build 232’s spread, and Build 232’s within theirs.

### 6. The build

`index.html` as committed, Build 233, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 8 of 8 pass.
- The new checks pass on Build 233 as on the tested page: 58 of 58.

# Builder handoff: alert and dashboard pack

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 235.
**Applied:** as Build 236, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="alert-pack-v236">` (345 lines), after `scenario-library-v235`, containing [`docs/mockups/alert-pack-prototype.js`](mockups/alert-pack-prototype.js). It sets `window.alertPack236`.
- `<style id="alert-pack-v236-styles">` (67 lines), after `scenario-library-v235-styles`.

**One in-place edit:** the change register's entry for the feature, marked implemented. The edit, the block and the styles are also in [`docs/mockups/alert-pack.diff`](mockups/alert-pack.diff), a unified diff against Build 235's `index.html` with no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Alert and dashboard pack generation (Medium): generate operational searches for stale clients, drift, failed activation and queue pressure."

**How it was done:**
- What Splunk records was read first, in its documentation and then in a Splunk 10.6.1.1 lab: the Deployment Server's own indexes (`_dsphonehome`, `_dsclient` and `_dsappevent`, since 9.2), the searches Splunk's Agent Management runs over them (`agent_management.conf`), metrics.log's queue reports, and splunkd's warnings when a forwarder pauses its output.
- The page writes each search for the topology in the Builder (its Deployment Servers, how often their clients phone home, its forwarders and indexers) and puts them in a Splunk app: scheduled alerts, their thresholds as macros, and a Dashboard Studio dashboard of what they find.
- The app was downloaded from the page as a person would, installed in the lab, and each condition it watches was made real there (section 5). Every alert found its condition and nothing else, the scheduler ran them, and the dashboard drew them. The lab's first runs changed three things before this one: a search's lines in `savedsearches.conf` are continued with nothing before the backslash, as Splunk keeps any spaces there; a failed install's reason keeps the quotes inside it; and the failed-installs alert has a name that fits the dashboard's count panel.

**Sources** (Splunk documentation, help.splunk.com):
- [agent_management.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/agent_management.conf): Agent Management's searches over the `_ds` indexes; the stale and failed alerts follow its offline and error searches (section 2).
- [Upgrade pre-9.2 deployment servers](https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/10.2/configure-the-agent-management-system/upgrade-pre-9.2-deployment-servers): the `_dsphonehome`, `_dsclient` and `_dsappevent` indexes, and defining them on indexers older than 9.2.
- [Change the index retention period](https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/10.2/troubleshooting/troubleshoot-performance-issues/change-the-index-retention-period): how long each keeps its events by default, 7 days for phone homes and 60 for clients and app events.
- [deploymentclient.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/deploymentclient.conf): `phoneHomeIntervalInSecs`, 60 seconds by default.
- [About metrics.log](https://help.splunk.com/en/splunk-enterprise/administer/troubleshoot/10.6/splunk-enterprise-log-files/about-metrics.log): its queue reports, `blocked=true`, and when blocked reports are flow control.
- [savedsearches.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/savedsearches.conf), [macros.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/macros.conf) and [app.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/app.conf): the app's files.
- [What is a dashboard definition?](https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboard-studio/10.6/source-code-editor/what-is-a-dashboard-definition) and [Create a dashboard using REST API endpoints](https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboard-studio/10.6/manage-dashboards): the dashboard's file, a Dashboard Studio definition inside `<dashboard version="2">`.

**Mockup (the target):** [`docs/mockups/alert-pack-mockup.html`](mockups/alert-pack-mockup.html).
- 7 scenes have the block, its styles and the edit applied to Build 235.
- 1 scene is the installed dashboard in Splunk Web, in the lab.
- 2 "Today" scenes are Build 235.
- The screenshots are `docs/mockups/compare/alert-pack-*.png`.

## Where it is

**Operate › Alert and dashboard pack,** after Generate and before Compare. From the top: the page's heading and **Download the app (.tar.gz)**; a message line (`role="status"`); **On this topology**; **Settings**; a summary line; the four concerns, Stale clients, Failed activation, Drift and Queue pressure, each with its alerts; **The dashboard**, its layout; **The app's files**, each one's text; and Splunk's pages for all of it.

## 1. What the topology gives

- **Deployment Servers** are the Builder’s Deployment Server components; their **clients** are the far ends of their Deployment client links.
- **The phone-home interval** is the clients’ links’ own (`phoneHome`, in seconds). With several, the longest: a client on the slowest schedule isn’t called stale between two of its phone homes. With none, Splunk’s default, 60 s (`phoneHomeIntervalInSecs`).
- **A client is stale** after the missed phone homes (Settings) at that interval, plus 20 s: the slack Agent Management’s own offline search adds.
- **Forwarders** are Universal and Heavy Forwarders, DB Connect and API collectors with something below them in the Builder. The Generate page writes their output group as `primary_receivers`, so their output queue is `tcpout_primary_receivers`; the searches don’t depend on the name (section 5).
- **Queue pressure** is in the app when there is a forwarder or a component that parses and indexes (an indexer, a Heavy Forwarder, DB Connect, an API collector or a HEC endpoint); **Forwarding blocked** when there is a forwarder.
- **Where it goes:** the topology’s search tier, the first of a Monitoring Console, a Search Head, an SHC member and a search head cluster; with none, a search head that searches the indexers, or the Monitoring Console. With a Deployment Server, the page adds where the `_ds` indexes are: a Deployment Server on 9.2 or later forwards them with its other internal logs when it forwards to the indexers, indexers older than 9.2 need them defined, and a Deployment Server that keeps them can run the app itself.

On the four topologies the checks use:

| Topology | Deployment Servers | Clients | Interval | Stale after | Forwarders | Alerts in the app |
|---|---|---|---|---|---|---|
| The page’s default: Syslog Source → Syslog Server → Universal Forwarder → Indexer | 0 | 0 | — | — | 1 | 2: Queue pressure, Forwarding blocked |
| The lab’s: a Deployment Server, two Heavy Forwarders as its clients at 10 s, one forwarding to an indexer | 1 | 2 | 10 s | 50 s | 1 | 5: Stale deployment clients, Failed app downloads and installs, Clients behind their Deployment Server, Queue pressure, Forwarding blocked |
| The Builder’s regional Deployment Server tier: a Tier 1 Deployment Server, two regional ones at 300 s, a Universal Forwarder at 60 s, an indexer and a Search Head | 3 | 3 | 60 s and 300 s | 920 s (15.3 min) | 1 | 6: Stale deployment clients, Failed app downloads and installs, Clients behind their Deployment Server, Deployment Servers out of step, Queue pressure, Forwarding blocked |
| Nothing to watch: a Search Head alone | 0 | 0 | — | — | 0 | 0: none, and Download is off |

## 2. The alerts

Six searches, each a scheduled alert. One that the topology has nothing for is left out of the app, and its card says why.

| Alert | Concern | In the app with | Over | Throttled for | Severity | What it finds |
|---|---|---|---|---|---|---|
| Stale deployment clients | Stale clients | a Deployment Server | 7 days | each client, a day | warning | Clients whose last phone home is more than 50 s ago: 3 missed phone homes at 10 s, this topology’s interval, plus 20 s. Each client is named from _dsclient. |
| Failed app downloads and installs | Failed activation | a Deployment Server | 7 days | each client and app, a day | error | Apps whose latest download or install on a client didn’t end Ok, on clients that phoned home in the last 24 hours, as Agent Management’s list of agents with errors has it. The reason is the one the client reported. |
| Clients behind their Deployment Server | Drift | a Deployment Server | 60 days | each client and app, a day | warning | Clients whose installed copy of an app has a different checksum from the one their Deployment Server serves now: the checksum of the app’s latest download from that server. An app taken off a client is left out. |
| Deployment Servers out of step | Drift | two Deployment Servers or more | 60 days | each app, a day | error | Apps that different Deployment Servers serve at different checksums: each server’s latest download of the app, compared across servers. |
| Queue pressure | Queue pressure | a forwarder or an indexing component | 15 minutes, its schedule’s interval | each host and queue, an hour | error | Queues whose average fill over the last 15 minutes is 80% or more, or that reported blocked=true in 50% of their reports or more. A pipeline queue’s fill is current_size_kb of max_size_kb; an output queue (tcpout_<group>) reports bytes, current_size of max_size. |
| Forwarding blocked | Queue pressure | a forwarder | 15 minutes, its schedule’s interval | each host and output group, an hour | error | Forwarders whose splunkd says it paused the data flow to an output group, with how long the longest pause had lasted. |

The stale alert’s text is the lab’s topology’s; on the regional tier it reads “Clients whose last phone home is more than 15.3 min ago: 3 missed phone homes at 5 min, the longest interval in this topology, plus 20 s. Each client is named from _dsclient.”

**Every alert** runs as often as Settings say, every 15 minutes by default (`cron_schedule = */15 * * * *`; every hour is `0 * * * *`), alerts when its search returns anything (`counttype = number of events`, `relation = greater than`, `quantity = 0`), once for each result (`alert.digest_mode = 0`), and is kept on the Triggered Alerts page (`alert.track = 1`). It is throttled for each value of its key fields (`alert.suppress.fields`): a client that stays silent is named once a day, not at every run. Its search runs over its own window (`dispatch.earliest_time`): the stale and failed-installs alerts over 7 days, what `_dsphonehome` keeps; the drift alerts over 60 days, what `_dsappevent` keeps; the queue alerts over their schedule’s interval, so each report counts once.

**The thresholds are macros,** in `macros.conf`, so they change in Splunk without editing a search: `pipeline_ops_stale_seconds`, the stale threshold in seconds (50 on the lab’s topology), `pipeline_ops_queue_fill_pct`, the queue fill that alerts (80), and `pipeline_ops_blocked_share_pct`, the share of a queue’s reports that say `blocked=true` (50). An app that has no alert using one leaves it out.

**The searches,** as the app holds them, with the default settings. The deployment searches name each client from `_dsclient`, which keeps each client’s name, host name, address and version (a `join` on `data.clientId`):

**Stale deployment clients** (7 lines):
```
| tstats max(data.lastPhoneHomeTime) AS last_phonehome values(host) AS deployment_server WHERE index=_dsphonehome earliest=-7d BY data.clientId
| eval silent_seconds=now()-last_phonehome
| where silent_seconds > `pipeline_ops_stale_seconds`
| join type=left data.clientId [search index=_dsclient earliest=-60d | stats latest(data.name) AS client latest(data.hostname) AS hostname latest(data.ip) AS ip latest(data.splunkVersion) AS version BY data.clientId]
| sort 0 - silent_seconds
| eval last_phonehome=strftime(last_phonehome, "%F %T %z"), silent=tostring(silent_seconds, "duration")
| table client hostname ip deployment_server last_phonehome silent version data.clientId
```

**Failed app downloads and installs** (9 lines):
```
index=_dsappevent earliest=-7d (data.action=Download OR data.action=Install)
| eval download_result=if('data.action'=="Download", 'data.result', null()), install_result=if('data.action'=="Install", 'data.result', null()), failed_reason=if('data.result'!="Ok", replace('data.failedReason', "^'(.*)'$", "\1"), null())
| stats latest(download_result) AS download_result latest(install_result) AS install_result latest(failed_reason) AS failed_reason latest(data.serverClassName) AS server_class count(eval('data.result'!="Ok")) AS failed_attempts max(_time) AS last_attempt BY host data.clientId data.appName
| where download_result!="Ok" OR install_result!="Ok"
| join type=inner data.clientId [| tstats max(data.lastPhoneHomeTime) AS last_phonehome WHERE index=_dsphonehome earliest=-24h BY data.clientId]
| join type=left data.clientId [search index=_dsclient earliest=-60d | stats latest(data.name) AS client latest(data.hostname) AS hostname latest(data.ip) AS ip latest(data.splunkVersion) AS version BY data.clientId]
| eval failed_at=if(download_result!="Ok", "download", "install"), last_attempt=strftime(last_attempt, "%F %T %z")
| rename host AS deployment_server, data.appName AS app
| table client hostname deployment_server server_class app failed_at failed_reason failed_attempts last_attempt data.clientId
```

**Clients behind their Deployment Server** (9 lines):
```
index=_dsappevent earliest=-60d data.result=Ok (data.action=Download OR data.action=Install OR data.action=Uninstall)
| eval served=if('data.action'=="Download", 'data.checksum', null()), installed=if('data.action'=="Install", 'data.checksum', null())
| eventstats latest(served) AS served_checksum BY host data.appName
| stats latest(data.action) AS last_action latest(installed) AS installed_checksum values(served_checksum) AS served_checksum max(_time) AS last_change BY host data.clientId data.appName
| where last_action!="Uninstall" AND isnotnull(installed_checksum) AND installed_checksum!=served_checksum
| join type=left data.clientId [search index=_dsclient earliest=-60d | stats latest(data.name) AS client latest(data.hostname) AS hostname latest(data.ip) AS ip latest(data.splunkVersion) AS version BY data.clientId]
| eval last_change=strftime(last_change, "%F %T %z")
| rename host AS deployment_server, data.appName AS app
| table client hostname deployment_server app installed_checksum served_checksum last_change data.clientId
```

**Deployment Servers out of step** (7 lines):
```
index=_dsappevent earliest=-60d data.action=Download data.result=Ok
| stats latest(data.checksum) AS served_checksum max(_time) AS last_download BY host data.appName
| stats dc(served_checksum) AS versions values(host) AS deployment_servers values(served_checksum) AS checksums max(last_download) AS last_download BY data.appName
| where versions > 1
| eval last_download=strftime(last_download, "%F %T %z")
| rename data.appName AS app
| table app versions deployment_servers checksums last_download
```

**Queue pressure** (8 lines):
```
index=_internal source=*metrics.log* sourcetype=splunkd group=queue
| eval fill_pct=round(100*coalesce(current_size_kb/max_size_kb, current_size/max_size), 1), blocked_report=if(blocked=="true", 1, 0)
| stats count AS reports avg(fill_pct) AS avg_fill_pct max(fill_pct) AS max_fill_pct sum(blocked_report) AS blocked_reports max(blocked_count) AS max_blocked_count BY host name
| eval avg_fill_pct=round(avg_fill_pct, 1), blocked_share_pct=round(100*blocked_reports/reports, 0)
| where avg_fill_pct >= `pipeline_ops_queue_fill_pct` OR blocked_share_pct >= `pipeline_ops_blocked_share_pct`
| sort 0 - avg_fill_pct
| rename name AS queue
| table host queue avg_fill_pct max_fill_pct blocked_reports reports blocked_share_pct max_blocked_count
```

**Forwarding blocked** (6 lines):
```
index=_internal sourcetype=splunkd component=TcpOutputProc log_level=WARN "paused the data flow"
| rex "inside output group (?<output_group>\S+) from host_src=(?<host_src>\S+) has been blocked for blocked_seconds=(?<blocked_for>\d+)"
| fillnull value="(not named)" output_group
| stats max(blocked_for) AS longest_blocked_seconds count AS warnings max(_time) AS last_warning BY host output_group
| eval longest_blocked=tostring(longest_blocked_seconds, "duration"), last_warning=strftime(last_warning, "%F %T %z")
| table host output_group longest_blocked warnings last_warning
```

**Catches, in the Failure Lab:** each card lists the Failure Lab's failures the alert would catch, as buttons that open the failure there (Single mode, the failure selected and focused):

| Alert | Failure Lab failure | Why |
|---|---|---|
| Stale deployment clients | Deployment Server unreachable | Its clients can’t reach it, so their phone homes stop. |
| Stale deployment clients | Deployment Server TLS certificate expired | Clients can’t complete TLS with it, so their phone homes stop. |
| Failed app downloads and installs | Deployment app activation failure | The download ends Ok and the install doesn’t. |
| Failed app downloads and installs | Manifest succeeds but app download fails | The download doesn’t end Ok. |
| Failed app downloads and installs | App downloads but validation fails | The install doesn’t complete. |
| Clients behind their Deployment Server | Event forwarding remains healthy while configuration is stale | A client that forwards events but runs an older app than its server serves. |
| Clients behind their Deployment Server | Deployment app activation failure | After a failed install the client keeps the version it had. |
| Deployment Servers out of step | Tier-1 and Tier-2 Deployment Servers contain different app versions | Each server’s latest download of the app gives a different checksum. |
| Queue pressure | Parsing queue blocked | parsingqueue reports blocked=true. |
| Queue pressure | Expensive ingest regex | typingqueue fills behind an expensive regex. |
| Queue pressure | indexQueue or disk I/O stall | indexqueue reports blocked=true. |
| Queue pressure | Receiver unreachable | The output queue fills to its limit. |
| Queue pressure | Acknowledgement timeout | With useACK the output queue holds each block until the receiver acknowledges it. |
| Forwarding blocked | Receiver unreachable | splunkd pauses the flow when no receiver takes the data. |
| Forwarding blocked | Agent reports healthy management connectivity but event forwarding is broken | Phone homes go on while forwarding is paused. |

## 3. Settings

| Setting | Default | Takes | What it changes |
|---|---|---|---|
| App folder | `pipeline_ops_pack` | a letter, then letters, digits, “_” and “-”, up to 64 | the app’s folder, every path in it, and the download’s name |
| App label | Pipeline operations | 5 to 80 characters, not starting “Splunk For” (`app.conf`) | the app’s name in Splunk, the dashboard’s title, and the start of each alert’s name: “Pipeline operations - Stale deployment clients” |
| Run the alerts | every 15 minutes | every 5, 10, 15 or 30 minutes, or every hour | each alert’s `cron_schedule`, and the window of the two queue alerts |
| Missed phone homes before a client is stale | 3 | 1 to 20 | the stale threshold, `pipeline_ops_stale_seconds`, and the line under the settings |
| Average queue fill that alerts | 80 | 50 to 100 (percent) | `pipeline_ops_queue_fill_pct` |
| Blocked reports that alert | 50 | 1 to 100 (percent of a queue’s reports) | `pipeline_ops_blocked_share_pct` |

The settings last for the visit: the page keeps nothing in the browser.

Each is checked as it is set. A value that can't be used is refused with a message, and the field goes back to the last good value, which the app keeps using:

| Typed | The message |
|---|---|
| “9lives” as the app folder | An app folder name starts with a letter and has only letters, digits, “_” and “-”, at most 64. |
| “pipeline ops” as the app folder | An app folder name starts with a letter and has only letters, digits, “_” and “-”, at most 64. |
| “Ops” as the label | The app’s label is 5 to 80 characters, as app.conf recommends. |
| “Splunk For Pipelines” as the label | app.conf says a label must not start “Splunk For”. |
| 0 missed phone homes | A whole number from 1 to 20. |
| 2.5 missed phone homes | A whole number from 1 to 20. |
| a 40% queue fill | A whole number from 50 to 100. |
| 101% of reports blocked | A whole number from 1 to 100. |

## 4. The app

**Download the app (.tar.gz)** writes `<app folder>.tar.gz`: ustar entries (folders 0755, files 0644) for the app's files, gzipped in the browser (`CompressionStream`), the form Splunk installs an app from. It is off when the app would have no alert. The message, on the lab's topology: "Downloaded pipeline_ops_pack.tar.gz: 7 files, 4.7 KB. Install it from Apps › Manage Apps › Install app from file, or unpack it into $SPLUNK_HOME/etc/apps and restart." A browser without `CompressionStream` says so, and each file can still be copied from the list.

**Copy the search,** under each search's text, puts it on the clipboard: "Copied the search “Stale deployment clients”." Where the browser won't allow it, the search is selected for copying with the keyboard, and the message says so.

The files, on the lab's topology:

| File | Size | What it holds |
|---|---|---|
| `pipeline_ops_pack/default/app.conf` | 497 bytes | the app’s label, version and description (`[ui]`, `[launcher]`); `is_configured = false`; `check_for_updates = false`, and no Splunkbase `id`, which app.conf says to leave out of an internal app |
| `pipeline_ops_pack/default/macros.conf` | 776 bytes | the thresholds, as macros with a description each |
| `pipeline_ops_pack/default/savedsearches.conf` | 7.5 KB | the alerts, one stanza each, named “<label> - <alert>” |
| `pipeline_ops_pack/default/data/ui/views/pipeline_operations.xml` | 15.0 KB | the dashboard: a Dashboard Studio definition (JSON) inside `<dashboard version="2" theme="dark">`, with its label and description |
| `pipeline_ops_pack/default/data/ui/nav/default.xml` | 143 bytes | the app’s menu: the dashboard first, as the app’s home page, then Search and Alerts |
| `pipeline_ops_pack/metadata/default.meta` | 140 bytes | everyone reads the app’s objects, admins change them; nothing is exported to other apps |
| `pipeline_ops_pack/README.txt` | 2.3 KB | what the app holds, for which topology, and where to install it |

Each `.conf` file starts with what wrote it, when, and for which topology, and the README says the same: "Generated by the Splunk Pipeline Explorer, Build 236, on 2026-11-27, for a topology of 4 components, 1 Deployment Server with 2 deployment clients, 1 forwarder, 1 indexer."

**An alert in `savedsearches.conf`,** on the lab's topology. A search of several lines is continued with a backslash at the end of each line but the last, with nothing before the backslash: Splunk 10.6.1.1 read each back with its line breaks and no backslashes (section 5).

```
[Pipeline operations - Stale deployment clients]
description = Clients whose last phone home is more than 50 s ago: 3 missed phone homes at 10 s, this topology’s interval, plus 20 s. Each client is named from _dsclient.
search = | tstats max(data.lastPhoneHomeTime) AS last_phonehome values(host) AS deployment_server WHERE index=_dsphonehome earliest=-7d BY data.clientId\
| eval silent_seconds=now()-last_phonehome\
| where silent_seconds > `pipeline_ops_stale_seconds`\
| join type=left data.clientId [search index=_dsclient earliest=-60d | stats latest(data.name) AS client latest(data.hostname) AS hostname latest(data.ip) AS ip latest(data.splunkVersion) AS version BY data.clientId]\
| sort 0 - silent_seconds\
| eval last_phonehome=strftime(last_phonehome, "%F %T %z"), silent=tostring(silent_seconds, "duration")\
| table client hostname ip deployment_server last_phonehome silent version data.clientId
dispatch.earliest_time = -7d
dispatch.latest_time = now
enableSched = 1
cron_schedule = */15 * * * *
schedule_window = auto
counttype = number of events
relation = greater than
quantity = 0
alert.track = 1
alert.severity = 3
alert.digest_mode = 0
alert.suppress = 1
alert.suppress.fields = data.clientId
alert.suppress.period = 24h
```

**The dashboard** (`default/data/ui/views/pipeline_operations.xml`, the app's home page in `nav/default.xml`): 5 counts across the top, 5 tables, one for each alert and running its search, and the queues’ fill over the last 4 hours. Each count is its alert’s search chained to `| stats count` (`ds.chain`), so the count and the table run one search; each table shows the alert’s own description; the chart is `timechart span=5m limit=10` of each queue’s fill. The grid is 1,440 wide: counts 130 high, tables 260, the chart 320. On the page, **The dashboard** draws that layout, each panel as wide as its share of its row: the titles wrap rather than get cut off, and on a narrow screen the counts wrap onto more rows.

## 5. In Splunk 10.6.1.1

**The lab:** Splunk 10.6.1.1 in three containers. `ds233` is the Deployment Server, and the indexer `c1233` forwards to; `c1233` (client name linux-canary-a01) and `c2233` (linux-edge-b01) are its clients, Splunk Enterprise instances (Heavy Forwarders in the lab’s topology) that phone home every 10 s. The app was downloaded from the tested page with its button, on the lab’s topology (section 1), 4,771 bytes, and installed on `ds233` with `POST /services/apps/local`, as an update of the trial install (status 200). Splunk read back each alert as the page shows it: its search, line for line; its schedule, window and `schedule_window`; its trigger as `number of events`, `greater than`, `0`; its severity, tracking and throttle; the three macros; the dashboard, as a version 2 dashboard; and the menu. splunkd logged no warning or error about the app.

**The conditions,** each made real:
- **Stale:** `c2233` stopped; its last phone home was at 02:26:42.
- **Failed activation:** `pipeline_probe`, in server class `sc_canary`, can’t install on `c1233`: its folder there belongs to root, so the client can’t unpack it, and it tries again at each phone home.
- **Drift:** `TA_linux_auditd` changed on `ds233` while `c2233` was stopped, so `c2233` still has the old version.
- **Out of step:** one Download event of `TA_linux_auditd` at the old checksum, from a second server name, `ds-b-lab`, written into `_dsappevent` (the lab has one Deployment Server).
- **Queue pressure and forwarding blocked:** `c1233`’s indexers’ names taken out of its `/etc/hosts` and its splunkd restarted, at 03:09:17, so it couldn’t reach them: its `indexqueue` reported `blocked=true` 272 s later. It was let through at 03:24:00, after 883 s, a few minutes before the scheduler’s 03:30 run, and its own logs, held while it was blocked, reached `ds233` then.

**What each alert found,** each dispatched as the scheduler would (its own window, the app's macros) after the client was let through again:

| Alert | What it found, at 03:25 |
|---|---|
| Stale deployment clients | linux-edge-b01 (`c2233`, 172.18.0.4), silent 00:59:08 since 02:26:42 |
| Failed app downloads and installs | linux-canary-a01 (`c1233`): `pipeline_probe`, failed at install, 350 failed attempts; the reason as the client reported it: “Failed to untar archive=/opt/splunk/var/run/sc_canary/pipeline_probe-1795746410.bundle to='/opt/splunk/etc/apps/pipeline_probe'” |
| Clients behind their Deployment Server | linux-edge-b01: `TA_linux_auditd` installed at checksum 4922615774535958902, `ds233` serving 13252020808091727742 |
| Deployment Servers out of step (its search run by hand: the lab’s topology has one Deployment Server) | `TA_linux_auditd`, 2 checksums across `ds233` and `ds-b-lab` |
| Queue pressure | `c1233`: `tcpout_primary_indexers` 98.2% full on average (at most 100.0%); `indexqueue` 71.6% on average, `blocked=true` in 14 of its 20 reports (70%) |
| Forwarding blocked | `c1233`, output group `primary_indexers`: the longest pause 00:12:50, 77 warnings |

Nothing else: each found only the client, app or forwarder the lab set up. `c1233`, phoning home, isn’t stale; no other client or app is behind; and `ds233`’s own queues, never full, aren’t in the queue alert. `c1233`’s output group is its own, `primary_indexers`: the queue search reads every queue that reports, and the forwarding search takes the group from the warning.

In the second cycle (below), cut off for 1,242 s, Queue pressure found five of `c1233`’s queues backed up, from its output queue back to its parsing queue: `tcpout_primary_indexers` 100.0% full on average; `aggqueue` 99.9% full on average, `blocked=true` in 18 of 18 reports; `indexqueue` 99.8% full on average, `blocked=true` in 18 of 18 reports; `typingqueue` 88.4% full on average; `parsingqueue` 86.0% full on average.

**The scheduler** ran every alert of the final app at its slots, each a success. A trial install of the app, earlier the same night, had fired all five at 02:45, and an alert’s throttle holds what it has fired, by its key fields, for the alert’s name: so at 03:15 and 03:30 the stale and drift alerts found their client again and held it (24 hours), and at 03:30 the queue alerts found `c1233` and held it (an hour, from 02:45). The failed-installs alert, renamed since the trial, ran first at 03:30 and fired: it is on the Triggered Alerts page with severity 4 (error). For the queue alerts, `c1233` was cut off a second time at 03:35:21 and let through at 03:56:03, after 1,242 s, before the 04:00 run, past their hour: Queue pressure (3 results) and Forwarding blocked (1) fired at 04:00, while the other three found their result again and held it. Before the client was let through, the queue alerts found nothing: a forwarder that can’t reach its indexers can’t send its own logs either (03:15).

**Agent Management’s own test,** client by client (its `query_agents_offline`, from `agent_management.conf`, without the final count): over the last day, linux-edge-b01’s average interval is 10.1 s and it counts offline after 30.6 s; over the 7 days `_dsphonehome` keeps, which take in the lab’s earlier stops, its average is 2,489.5 s and it counts offline only after 2,634.0 s, and linux-canary-a01’s after 348.8 s, for clients set to phone home every 10 s. The pack’s stale alert uses the interval the topology sets, 10 s, so both count as stale after 50 s, whatever their history. The stale card says so.

## The edit, on Build 235's lines

1. **Line 1,807, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Alert and dashboard pack generation','Generate operational searches for stale clients, drift, failed activation and queue pressure.',false,'Medium'],
new: ['Alert and dashboard pack generation','Generate operational searches for stale clients, drift, failed activation and queue pressure.',true,'Medium'],
```

## The new block

**`<script id="alert-pack-v236">`**, right after `scenario-library-v235`'s `</script>` (line 20,416 of Build 235). Its parts, in order:

- `model` (74 lines): Splunk’s pages, the settings and their checks (`setSetting`), and what the topology gives (`topology`, `staleSeconds`).
- `searches` (94 lines): the six searches, as `searches(topology, settings)`, with their windows, schedules, throttles, severities, notes and Failure Lab links.
- `files` (84 lines): the dashboard’s definition, the app’s seven files, where to install it, and the .tar.gz (`tarBytes`, `tarGz`).
- `view` (78 lines): Operate › Alert and dashboard pack, its message line, Copy the search and the Failure Lab links.
- `hooks` (9 lines): the page’s hook on `renderOperations`, and Operate’s menu entry.
- `exports` (4 lines): `window.alertPack236`.

It wraps `renderOperations`, for the Alert and dashboard pack page, and adds Operate's menu entry after Generate. It reads the Builder's components and links (`state.builderNodes`, `state.builderRelations`) and the Failure Lab's failures, and changes neither; its own state is `state.alertPack236`, the settings for this visit.

It sets `window.alertPack236`, which gives the model to the checks.

Its styles, **`<style id="alert-pack-v236-styles">`**, go right after `scenario-library-v235-styles`'s `</style>` (line 17,183). Every rule is under an `.ap236` class; text is 11 px or more.

## Build records

After the edit and the block, in a new `<script id="alert-pack-records-v236">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Alert and dashboard pack','Operate › Alert and dashboard pack writes a Splunk app for the topology in the Builder: scheduled searches that alert on stale deployment clients, failed app downloads and installs, drift and queue pressure, and a Dashboard Studio dashboard of what they find; it downloads as a .tar.gz to install in Splunk.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 235 did in its records, with Build 236 and 27 Nov 2026.

## Check before uploading

Run with Build 235 + the edit, the block and the styles, and with Build 235 for comparison.

### 1. The checks: 46. All pass with the edit

Each check opens the page as a person would and uses the pack as described above. On Build 235 the pack isn't there: 1 passes (no page errors) and the rest fail or can't start.

- **Where the pack is:** Operate’s menu has Alert and dashboard pack right after Generate; it opens on the pack, with the menu entry marked, and offers the app as a download; on the default topology (no Deployment Server) the pack has the two queue alerts, and says why the four deployment alerts aren’t in it, once for each concern; “On this topology” names what it found: no Deployment Server, Universal Forwarder 1 forwarding on, Indexer 1 indexing, and where to install; visiting the page and downloading the pack leave the topology as it was.
- **The lab’s topology:** with a Deployment Server whose two clients phone home every 10 s, a client is stale after 50 s: 3 × 10 s + 20 s; the lab’s pack has five alerts, and leaves out Deployment Servers out of step: one server, none to compare it with; the stale alert says its threshold and runs every 15 minutes over 7 days, once a day for each client, severity warning; the queue alert, over its 15 minutes, once an hour for each host and queue, severity error; each concern says how many alerts it has in the pack; the stale search reads _dsphonehome as Agent Management does (tstats of data.lastPhoneHomeTime), with the threshold as a macro; the failure search keeps clients that phoned home in the last 24 hours, and gives the client’s reason without its outer quotes; the drift search compares each client’s installed checksum with its server’s latest download, over 60 days, uninstalled apps left out; the queue search takes a pipeline queue’s fill in KB and an output queue’s in bytes, and counts blocked=true reports, both thresholds macros; the forwarding search reads splunkd’s “paused the data flow” warnings and names the output group.
- **Other topologies:** with three Deployment Servers, Deployment Servers out of step is in the pack; clients at 60 s and 300 s: the threshold uses the longest interval, and says so; with a search head in the topology, the pack says to install it there.
- **Settings:** 5 missed phone homes: stale after 70 s, in the line under the settings and in the macro, with the focus kept on the field; a 90% queue threshold and a 5-minute schedule reach the alert’s text, its macro and its cron schedule; every hour runs at minute 0; a setting that can’t be used says why and keeps the last good value: an app folder, a label, numbers out of range; a new app folder and label rename every path and the alerts.
- **The app’s files:** the app has seven files: app.conf, macros.conf, savedsearches.conf, the dashboard, the navigation, default.meta and a README; app.conf: the label, a version, a description under 200 characters, no Splunkbase id (app.conf says to leave it out of an internal app); savedsearches.conf, read with the page’s own .conf reader, has one stanza per alert, named “<label> - <alert>”; each alert is scheduled, alerts when it finds anything, per result, throttled, at its severity, over its window, and its search reads back as the page shows it; a search over several lines continues with a backslash at the end of each line but the last, with nothing before the backslash; the dashboard is a Dashboard Studio file: <dashboard version="2" theme="dark">, its label, its JSON definition in CDATA, and hiddenElements; the dashboard runs each alert’s own search, counts it in a chained search, puts every panel on a 1440-wide grid, none over another; its panels: a count for each alert, a table for each alert, and the queues’ fill over 4 hours; the navigation opens the dashboard first; default.meta lets everyone read and admins write; the README lists each alert and says where to install the app; the page lists the files with their sizes, and opening one shows its text.
- **The download:** Download the app gives pipeline_ops_pack.tar.gz: ustar headers with good checksums, the seven files as the page shows them, their folders, and the end blocks; the message says what was downloaded and how to install it, and the focus stays on the button; with nothing to watch (a Syslog Source alone) the pack says so, has no files, and the download is off.
- **The Failure Lab:** each alert names the Failure Lab failures it catches, by their names there; queue pressure catches Parsing queue blocked, indexQueue stall and Receiver unreachable; forwarding blocked catches healthy management with broken forwarding; a failure’s name opens it in the Failure Lab, Single mode, selected and focused.
- **Copy the search:** Copy the search puts the search on the clipboard and says so, with the focus kept on the button; where the browser won’t copy, the search is selected and the message says to copy it with the keyboard.
- **The register, text size, names, a phone and errors:** the change register lists Alert and dashboard pack generation as implemented; at 1440 px the pack has text of 11 px or more, every control named, no sideways page; at 390 px the pack has text of 11 px or more, every control named, no sideways page; on a phone the settings stack in one column and every control is at least 24 px; no page errors.

### 2. The app in Splunk

The app the tested page downloads for the lab’s topology is the one section 5 installed and ran (`same36.js`): its seven files and the six searches the same, but for the date in the files’ first lines. Installed on Splunk 10.6.1.1, each of its five alerts came back as written; dispatched, each found its condition and nothing else; the scheduler ran them every 15 minutes and fired them, the throttle holding what had fired; and the dashboard, opened in Splunk Web after the 04:00 run, showed Stale deployment clients 1, Failed app downloads and installs 1, Clients behind their Deployment Server 1, Queue pressure 2, Forwarding blocked 1.

### 3. The new UI, swept

The new UI's states (the page on the default topology; with every search, file and source opened; on the lab's topology, opened; on the regional tier; on a topology with nothing to watch; a refused setting; hourly with 5 missed phone homes; after Copy the search; after Download; a Failure Lab link followed), with the review's page check at four widths:

| The new UI, in the 10 states | 1440 px | 1280 px | 1024 px | 390 px |
|---|---|---|---|---|
| Page or console errors | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 |
| Text under 10 px | 0 | 0 | 0 | 0 |
| Text under WCAG contrast, on a control that works | 0 | 0 | 0 | 0 |
| Text under WCAG contrast, on a disabled control | 1 | 1 | 1 | 1 |
| Text cut off in its box | 0 | 0 | 0 | 0 |
| Text over other text, either of them in the new UI | 0 | 0 | 0 | 0 |
| Text over other text, both in the new UI | 0 | 0 | 0 | 0 |
| Tap targets under 24 px | — | — | — | 0 |

Nothing the check finds is the new UI’s but its Download button on the topology with nothing to watch, where it is disabled: WCAG doesn’t hold disabled controls to contrast. Each finding was flagged as it was found: in the new UI or not, on a disabled control or not. Text over text inside the new UI is counted as shown: a long file’s lines below its box’s bottom, scrolled out of view, aren’t over the next file.

A Failure Lab link followed, on the new page, against the same failure opened with the same steps on Build 235 (Build 235 / the new page):

| In the Failure Lab | 1440 px | 1280 px | 1024 px | 390 px |
|---|---|---|---|---|
| Text over other text | 10 / 10 | 10 / 10 | 9 / 9 | 0 / 0 |
| Text under WCAG contrast | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Text under 10 px | 6 / 6 | 6 / 6 | 6 / 6 | 6 / 6 |
| Controls without a name | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Tap targets under 24 px | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

The same findings, item by item, on both pages: the Failure Lab’s own. Its list scrolls to show the failure, and the check counts the items scrolled out of the list’s box as over the page’s heading.

The review's sweep of every page, as Build 231's handoff ran it, on the 57 pages both builds have and on the new Alert and dashboard pack page alone:

| At each width | 1440 px: Build 235 | 1440 px: new | 1440 px: the pack | 1024 px: Build 235 | 1024 px: new | 1024 px: the pack | 390 px: Build 235 | 390 px: new | 390 px: the pack |
|---|---|---|---|---|---|---|---|---|---|
| Page errors | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Text under WCAG contrast | 37 | 37 | 0 | 35 | 35 | 0 | 33 | 33 | 0 |
| Text under 10 px | 139 | 139 | 0 | 139 | 139 | 0 | 167 | 167 | 0 |
| Tap targets under 24 px | — | — | — | — | — | — | 108 | 108 | 0 |
| Ids used more than once | 600 | 600 | 12 | 600 | 600 | 12 | 600 | 600 | 12 |

The 57 pages give the same figures on both builds, page by page. The pack’s page has no finding but the ids duplicated elsewhere in the document, which every page reports.

Other sweeps:
- **Every control used once:** Build 235, 1,878 controls on 57 pages; the new page, 1,911 on 58. None leaves a page error on either. The sweep itself can’t click an SVG part with `click()`, or read the options of one list in the parsing laboratory (102 and 102). Controls with no effect it could see: 104 and 104.
- **Round the pages:** ten rounds on each page. Over rounds 2 to 10 the median is 38,433 DOM nodes on Build 235 and 38,423 on the new page, from 38,415 to 41,361 and from 38,423 to 38,744; the heap grows 0.38 MB and 0.37 MB a round after the first. Round 10 is at 38,463 and 38,423.
- **Cut off by a box that hides overflow:** at 390 px, 12 on Build 235 and 12 on the new page, all on the Builder canvas, which pans; at 1440 px, none on either.

### 4. Regression against Build 235

The same snapshots as Build 235’s regression, of Build 235 and the new page. What Build 236 means to change is set aside on both pages: Operate’s new menu entry is out of the page while the text is read; Operate’s pages are visited by name, the Alert and dashboard pack apart; and the change register’s Alert and dashboard pack generation entry goes back to Proposed next features, Medium. Build 236 adds nothing to the architecture report or the evidence pack, which are compared whole. Build 236’s own checks, in section 1, look at what it changes. Build 231’s and 232’s set-asides are kept; Build 235’s are no longer needed, as both pages have its scenario library, which is now compared.

| What is compared | Result |
|---|---|
| View text, every view; Operations pages; OV pages; the evidence pack | 61 of 61 the same |
| Every path: the Flow view's text and the route | 25 of 25 the same |
| Every failure's detail and owners; every symptom | 145 of 145 the same |
| The Config view, with no files, the example, the Fortinet add-on's four files and its package | 279 of 279 the same |
| Four Builder topologies, each component's inspector on each of its tabs | 60 of 60 the same |
| The same topologies, each link's inspector | 16 of 16 the same |
| The same topologies: the canvas's text, every card's text and box, the rules' results, the validation, every link's label and details, the network overlay, the topology file and the architecture report | 31 of 32 the same (1 varies on Build 235 between its own runs: see below) |
| Page errors | None on either |

Each comparison takes Build 235 twice, to set aside whatever varies from run to run: one snapshot did. 618 of the 619 snapshots are the same before any normalising. What varied is the Builder’s topology file for the HEC load balancer: its change history listed “Update topology configuration” in one of Build 235’s two runs and not the other, and the new page matched one of them. That is the Builder’s own timing, in Noticed, not changed.

**The earlier suites and tools**, on both pages:

| Suite or tool | Build 235 | Build 235 + the edit |
|---|---|---|
| Build 235’s 46 checks | 46 of 46 | 46 of 46 |
| Build 234’s 53 checks | 53 of 53 | 53 of 53 |
| Build 233’s 58 checks | 58 of 58 | 58 of 58 |
| Build 232’s 29 checks | 29 of 29 | 29 of 29 |
| Build 231’s 37 checks, with the register’s count as Build 236 leaves it | 36 of 37 † | 37 of 37 |
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
| Build 224’s own 51 checks | 48 of 51 † | 48 of 51 † |
| Lookup checks: 54 checks, as Build 223’s handoff wrote them | 46 of 54 † | 46 of 54 † |
| Event types, tags and CIM data models: 64 checks (Build 222’s handoff) ‡ | 63 of 64 † | 63 of 64 † |
| The Config view handoff’s 70 checks, with the expectation Build 222’s handoff rewrote ‡ | 69 of 70 † | 69 of 70 † |
| The source type map’s 82 checks | 82 of 82 | 82 of 82 |
| The splits’ 40 checks, with the map’s tools taken out as Build 224’s handoff says | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines’ 31 checks | 31 of 31 | 31 of 31 |
| The space tool | Meets every target | The same figures |
| The connector tool | Every connector OK | Every connector OK |
| The Builder’s redraws, 4 components: budget 40 ms § | 35 ms; 34 ms after a card moves | 33 ms; 32 ms after a card moves |
| The Builder’s redraws, 5 components: budget 50 ms § | 40 ms; 43 ms after a card moves | 41 ms; 42 ms after a card moves |
| The Builder’s redraws, 8 components: budget 80 ms § | 71 ms; 78 ms after a card moves | 71 ms; 75 ms after a card moves |
| The Builder’s redraws, 17 components, the reference topology: budget 120 ms § | 76 ms; 95 ms after a card moves | 77 ms; 93 ms after a card moves |
| The offline check, with the Fortinet add-on’s package | 23 of 23 | 23 of 23 |

**The Config view's results that Splunk checked** are the same on both pages: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

† Checks that want what a later build changed:
- **New with Build 236:** Build 231’s check 21, as Build 235’s run had it, wanted 5 changes proposed in the change register. Build 236 implements one of them, leaving 4; this run wants 4, so the check fails on Build 235, which has 5, and all 37 pass on the new page.
- **As before:** three of Build 224’s checks want what Build 225 changed; eight of the lookup checks, as first written, want what Build 226 changed; one of Build 222’s wants a folder’s macros.conf counted among the skipped files; one of the Config view handoff’s wants Where it acts right above the file tabs.

‡ These two have a 2.5-second page-load limit. They finished as written on both pages, and gave the same results with only that limit raised to 15 seconds.

§ `tools/builder-perf-check.js`, five runs on each page in turn after the other checks, with the lab’s containers stopped: the medians of its redraw after a change, and after a card moves. Every median is within its budget on both pages.

### 5. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 235 | With the edit |
|---|---|---|
| Loading the page (to the load event) | 1,736.2 ms (1,621.1 to 2,014.9) | 1,772.2 ms (1,604.1 to 1,926.1) |
| The ten views, each to its next frame (all ten) | 2,451.9 ms (2,288.5 to 2,816.2) | 2,444.6 ms (2,322.2 to 2,553.1) |
| The 28 OV pages, each to its next frame (all) | 2,719.4 ms (2,573.4 to 3,006.0) | 2,753.9 ms (2,530.3 to 3,148.0) |
| Builder redraw, its own topology | 43.1 ms (39.5 to 48.8) | 42.9 ms (40.5 to 48.5) |
| Drawing the change register | 32.9 ms (28.8 to 44.4) | 33.0 ms (29.1 to 44.5) |
| Restyling and laying out the page, on Changes | 27.1 ms (24.8 to 32.9) | 30.3 ms (24.9 to 41.6) |

Each figure with the edit is within Build 235’s spread, and Build 235’s within theirs.

### 6. The build

`index.html` as committed, Build 236, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 11 of 11 pass.
- The new checks pass on Build 236 as on the tested page: 46 of 46.
- The app it writes for the lab's topology is the one the lab installed and ran: the seven files and the six searches the same (`same36.js`).

## Noticed, not changed

- **The Builder can record a change that changes nothing,** as Build 235’s handoff found. While a topology is unsaved, the Builder saves a recovery draft 550 ms after each change, and the draft stamps the active layout profile with the time; a click whose history timer (0 ms) runs after that draft records the new time as “Update topology configuration”, and Undo then has a step that changes nothing. It showed again here, on Build 235 itself: its own two runs differed in just this way in the trial regression, for the syslog load balancer’s topology file, and in the final one, for the HEC load balancer’s (section 4). Leaving the layout profiles’ times out of the history’s comparison (`builderHistorySignature`) would end it. Build 236 doesn’t touch the Builder.
- **Splunk’s Agent Management counts a client offline late once it has been away,** because its offline search averages each client’s phone-home interval over its whole window (section 5). The pack’s stale alert doesn’t use that average, and its card says why.
- **The review’s page check counts text scrolled out of a box as if it were on the page.** In the Failure Lab, the list’s items scrolled out of its box are counted over the page’s heading, on Build 235 as on Build 236 (section 3). The new UI’s own check cuts each box to what its scrolling box shows.

## What the pack doesn't do

- **It doesn't install itself.** The app goes where its searches can read the `_ds` indexes and `_internal` (section 1, Where it goes); in the lab, on the Deployment Server.
- **It watches what Splunk records, as it records it.** A client that has never phoned home isn't in `_dsphonehome`, so it is never stale; one silent for longer than `_dsphonehome` keeps (7 days by default) drops out of the stale alert, as it drops out of Agent Management. A forwarder whose own logs can't reach the indexers can't report its queues until they can: in the lab, c1233's blocked queues reached the Deployment Server when it was let through, and the queue alerts found them then.
- **It doesn't follow the topology after it is written.** A change in the Builder (another Deployment Server, a new interval) needs a new download; the README and each file's first line say which topology it was written for.

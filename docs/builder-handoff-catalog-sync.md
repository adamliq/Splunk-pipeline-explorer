# Builder handoff: SQS ages out a federated search catalog's messages

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 228.
**Applied:** as Build 229, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block:** `<script id="catalog-sync-v229">` (102 lines), after `config-parts-v228`, containing [`docs/mockups/catalog-sync-prototype.js`](mockups/catalog-sync-prototype.js). It sets `window.catalogSync229`, and has no styles of its own.

**One in-place edit,** under "The edit": in the main script's `responsibilityFailureOwnership`, the failure's owners. Its old string occurs exactly once in Build 228, and the edit doesn't change the number of lines.

The edit and the block are also in [`docs/mockups/catalog-sync.diff`](mockups/catalog-sync.diff), a unified diff against Build 228's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:**

> For failure scenarios add this one; AWS SQS is aging out messages faster than can be retrieved by Splunk federated search for AWS s3.

Then:

> This is for a Splunk native data catalogue that backs the federated search

**Sources:**
- Splunk Cloud Platform, Federated Search 10.7, [Create an Amazon S3 dataset for federated search that is backed by a Splunk-native data catalog](https://help.splunk.com/en/splunk-cloud-platform/search/federated-search/10.7/run-federated-searches-over-amazon-s3-datasets/define-an-amazon-s3-dataset/create-an-amazon-s3-dataset-for-federated-search-that-is-backed-by-a-splunk-native-data-catalog): "Set up an Amazon S3 federated dataset with a Splunk-native data catalog that Splunk software creates and maintains for you." Keeping the catalog in sync is a choice made there ("Do you want to keep catalog in sync with dataset?"). A dataset of historical data that won't change can skip it.
- The same, [Set up automated updates for Splunk-native data catalogs in AWS](https://help.splunk.com/en/splunk-cloud-platform/search/federated-search/10.7/run-federated-searches-over-amazon-s3-datasets/define-an-amazon-s3-dataset/create-an-amazon-s3-dataset-for-federated-search-that-is-backed-by-a-splunk-native-data-catalog/set-up-automated-updates-for-splunk-native-data-catalogs-in-aws). It covers three things:
  - a standard SQS queue in your AWS account: "The standard queue type provides high throughput for catalog updates";
  - a queue access policy that lets Amazon S3 send messages to the queue from the bucket;
  - the bucket's event notification for the dataset's prefix, with all object create events, all object removal events, all restore object events, and lifecycle transition and expiration events. AWS's `s3:TestEvent` checks it.
- Splunk Validated Architectures, [Federated Search for Amazon S3](https://help.splunk.com/en/splunk-enterprise/splunk-validated-architectures/splunk-platform-indexing-and-search/federated-search-for-amazon-s3): data catalogs "contain column, schema, and partition definitions". Federated Search for Amazon S3 is for Splunk Cloud Platform in AWS regions, not Splunk Enterprise.
- Amazon SQS API Reference, [SetQueueAttributes](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SetQueueAttributes.html):
  - `MessageRetentionPeriod` is "the length of time, in seconds, for which Amazon SQS retains a message". It runs from 60 seconds to 1,209,600 (14 days), and is 345,600 (4 days) by default.
  - Lowering it below the age of messages already queued causes them "to be expired and deleted".
  - SQS moves a message to a dead-letter queue only when its `ReceiveCount` exceeds the redrive policy's `maxReceiveCount`.
- Amazon SQS Developer Guide, [Available CloudWatch metrics for Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-available-cloudwatch-metrics.html): `ApproximateAgeOfOldestMessage`, "the age of the oldest unprocessed message in the queue", in seconds, and `ApproximateNumberOfMessagesVisible`.

**What Splunk's pages don't say:** how often or how fast Splunk retrieves the queue's messages, what it does with each one, what the catalog does when messages are lost, or how to bring it back in sync. The scenario claims none of these. It says what SQS does and what the catalog then lacks, and it sends the resync to Splunk Support.

**Mockup (the target):** [`docs/mockups/catalog-sync-mockup.html`](mockups/catalog-sync-mockup.html).
- 5 scenes have the block and the edit applied to Build 228.
- The "Today" scene is Build 228.
- The screenshots are `docs/mockups/compare/catalog-sync-*.png`.

## Today, in Build 228

- **Amazon S3 is only a destination.** It is on 9 stages: Ingest Processor's route to a bucket (Destination route selection, Amazon S3 connection and authentication, Amazon S3 object delivery and Amazon S3 object storage), and 5 in the authentication layer.
- **No federated search path, no SQS, no catalog.** The page has 11 paths, none of them federated search. Neither SQS nor a catalog is a component in the strip or a column in the Matrix. Only the Builder's palette has an S3 Data Catalog ("Splunk-native / AWS Glue / Iceberg REST"), among its S3 federated search parts.
- **The nearest failure is "Amazon S3 destination unavailable":** "Ingest Processor cannot deliver the selected pipeline output to the configured S3 bucket because the connection, permissions, region, encryption, or bucket is unavailable." The one S3 symptom, "S3 objects are missing", ranks it first. Nothing covers data that reaches the bucket and that searches still miss.

## The design

### Two components

After Amazon S3 in the component strip, and after its column ("AWS S3") in the Matrix. The header counts 13 components.

| Card | Its line | Above its name | Stages |
|---|---|---|---|
| Amazon SQS | Hold S3 events for the catalog | AWS queue | 1 |
| S3 Data Catalog | Keep federated search in sync | Splunk-native catalog | 3 |

"S3 Data Catalog" is the Builder's name for the catalog, and its colour is the Builder's too. Every stage before these has neither component.

### Seven stages

After the last, in two pipelines: **Federated search catalog** (stages 119 to 122) and **Federated search** (123 to 125). Their colours are the Builder's for the catalog and for Splunk Cloud Search. All seven are required on the components named.

| No. | Stage | What it does | Where it is set | On | Note |
|---|---|---|---|---|---|
| 119 | **S3 event notification** | Sends each object create, object removal, restore and lifecycle event under the dataset’s prefix to the catalog’s SQS queue. | S3 bucket · Properties · Event notifications · prefix · SQS queue destination | Amazon S3 | Splunk’s setup selects all object create events, all object removal events, all restore object events, and lifecycle transition and expiration events. |
| 120 | **SQS message retention** | Holds each event in a standard queue until Splunk retrieves it, or until the event is older than the queue’s message retention period. | SQS queue · MessageRetentionPeriod · queue access policy | Amazon SQS | The retention period is 4 days by default, and from 60 seconds to 14 days. SQS deletes a message older than it; a dead-letter queue takes only messages received more times than its redrive policy allows. |
| 121 | **Catalog event retrieval** | Splunk retrieves the queued events for the dataset. | Amazon S3 dataset · Keep catalog in sync with dataset · SQS queue ARN | S3 Data Catalog | Keeping the catalog in sync is optional: a dataset of historical data that won’t change can do without it. |
| 122 | **Catalog update** | Applies the changes to the dataset’s Splunk-native data catalog, which Splunk software creates and maintains. | Splunk-native data catalog · columns · schema · partitions | S3 Data Catalog | A change the catalog never learns of isn’t reflected in what federated searches read. |
| 123 | **Federated search planning** | A federated search over the dataset takes what to read for its time range from the catalog. | Amazon S3 dataset · time field · time partition fields | Search Head, S3 Data Catalog | Time partition fields let a search read less. |
| 124 | **Remote dataset scan** | Reads the chosen data in the Amazon S3 bucket, where it is. | Amazon S3 connection · dataset resource access policy | Search Head, Amazon S3 | The data isn’t ingested or indexed into the Splunk platform. |
| 125 | **Federated search results** | Returns what the scan found to the search. | Splunk Cloud Platform search | Search Head | Federated Search for Amazon S3 is for Splunk Cloud Platform deployments in AWS regions. |

### A path

A chip, **S3 → SQS → Catalog → Federated search**, after "Raw TCP → HF → Indexer". It works as the other chips do:
- **Title:** "Amazon S3 → SQS → S3 Data Catalog → Federated search"
- **Text:** "The bucket sends each change to the dataset to an SQS queue; Splunk retrieves the queue to keep its native data catalog in sync, and federated searches read the data in S3 through that catalog."
- **The route:** Amazon S3 (Dataset objects · event notifications), then SQS → S3 Data Catalog (Queue · catalog sync), then Splunk Cloud Search (Federated Search for Amazon S3). Its note: "Splunk Cloud Platform searches the data where it is, without ingesting or indexing it."
- **Its stages:** Build 228's "Amazon S3 object storage", then the seven: 8 in all.

The seven show only on this path and on the complete model. The Config view's Matrix shows every stage, whatever the path, as it does for the other paths. Only this scenario fits the path. On the other paths, Diagnose marks it as outside the path and lowers its match, as it does for any scenario that doesn't fit the path.

### The failure

Listed last in the Failure Lab, 65 in all, and counted in the header.

| Field | Value |
|---|---|
| Name | SQS ages out messages before federated search retrieves them |
| Scope | Federated search catalog |
| Risk | high |
| Summary | The SQS queue that keeps a Splunk-native data catalog in sync deletes S3 events that wait longer than its message retention period, before Splunk retrieves them, so Federated Search for Amazon S3 never learns of those changes to the dataset. |
| Data-loss risk | None in S3; search gap |
| Detection effect | Searches quietly incomplete |
| Recovery pattern | Longer retention, catalog resync |
| Affected stages | SQS message retention, Catalog event retrieval, Catalog update |

**Its flow** runs over eight stages. The failure point is SQS message retention, which stops the flow: nothing after it learns of the deleted events.

| Stage | Component | State |
|---|---|---|
| 1. Amazon S3 object storage | Amazon S3 | Normal |
| 2. S3 event notification | Amazon S3 | Normal |
| 3. SQS message retention | Amazon SQS | Failure point |
| 4. Catalog event retrieval | S3 Data Catalog | Flow-on |
| 5. Catalog update | S3 Data Catalog | Flow-on |
| 6. Federated search planning | Splunk Cloud Search | Flow-on |
| 7. Remote dataset scan | Splunk Cloud Search | Flow-on |
| 8. Federated search results | Splunk Cloud Search | Flow-on |

**Its gauge,** on SQS message retention: "S3 events in SQS · 97% · aging out". Like the other scenarios' gauges, the level is representative, not measured.

**Show affected stages** lights SQS message retention, Catalog event retrieval and Catalog update in the Flow view.

**Its effects:**

1. **Trigger: Events wait longer than the queue keeps them.** More S3 events reach the queue than Splunk retrieves, or retrieval stops, so the oldest events reach the queue’s message retention period.
2. **Immediate: SQS deletes the oldest events.** Each event older than the retention period, 4 days by default, is deleted unread. A dead-letter queue doesn’t keep them: SQS moves a message there only after too many receives.
3. **Downstream: The catalog falls out of sync.** The Splunk-native data catalog never learns of the objects those events described: added, removed, restored or moved by lifecycle rules.
4. **Outcome: Federated searches miss data that is in S3.** Searches over that time can come back incomplete, though the objects are still in the bucket.

**Confirm the failure:**

- Compare the queue’s ApproximateAgeOfOldestMessage with its message retention period, and see whether ApproximateNumberOfMessagesVisible keeps growing.
- Compare the objects under the dataset’s prefix for a time range with what a federated search returns for it.
- Confirm the bucket’s event notification still sends the dataset’s prefix and its four event types to the queue.

**Recovery checks:**

- Raise the queue’s message retention period, up to 14 days, while the backlog drains.
- List what changed under the dataset’s prefix while events were expiring.
- Ask Splunk Support to bring the catalog back in sync for that window: Splunk’s documentation describes no way to resync it yourself.

### A symptom, in Diagnose

**Federated searches miss S3 data** ("Searches over a time range return less than the bucket should hold"). Prioritises the catalog’s SQS queue, its message retention period and the catalog sync, then whether the objects reached the bucket.

| Rank | On the complete model | On the new path |
|---|---|---|
| 1 | SQS ages out messages before federated search retrieves them: 99%, strong match, likely on Amazon SQS | The same |
| 2 | Amazon S3 destination unavailable: 40%, secondary check, likely on Amazon S3 | The same at 35%, outside the path |

Amazon S3 destination unavailable comes second: data that Ingest Processor never delivers isn't in the bucket for a search to find. On the new path it falls outside, as Diagnose marks a scenario that doesn't fit the path.

### Its owners

In the Responsibility view, and its export (`responsibilityJson()`'s `failureOwnership`):

| Role | Team |
|---|---|
| Detects | Splunk platform team |
| Responds | Cloud platform team |
| Dependency | Cloud storage team |
| Recovers | Splunk platform team |
| Validates | Log onboarding team |
| Escalation | Splunk Cloud provider |

Without the edit, the scenario takes the fallback's owners: security operations detects it, the log onboarding team responds and recovers, and the source or application owner is the dependency.

### Unchanged

- **The other 64 scenarios, their flows, owners and symptoms;** every other path; the Config view; the OV pages; the Builder. The regression below compares them.
- **The Builder's own S3 Data Catalog** and its federated search parts.

### Not covered

- **A catalog in AWS Glue.** A dataset backed by an AWS Glue table uses a catalog you maintain in AWS Glue, not a Splunk-native one, so this queue doesn't keep it in sync.
- **How fast Splunk retrieves the queue.** Splunk's documentation gives no rate, so the scenario doesn't say which side falls behind. It names both: more events reaching the queue than Splunk retrieves, or retrieval stopping.
- **Where the flow's "component handoff" labels sit.** Each sits across the gap between two cards, over both cards' edges. This scenario's long stage and pipeline names crowd them. They are placed as in Build 228, and aren't changed here.

## The edit

The line is Build 228's.

- **Line 1,080.** In the main script, `responsibilityFailureOwnership`: the failure's owners. The Splunk platform team detects it in searches, the cloud platform team that runs the queue responds, the cloud storage team's bucket and notifications are the dependency, the Splunk platform team recovers, and Splunk Cloud, which runs the catalog, takes escalations. Without the branch, the failure would take the fallback's owners.
```
old: }else{add('detect','Security operations');
new: }else if(f.id==='sqs-catalog-expiry'){add('detect','Splunk platform team');add('respond','Cloud platform team');add('dependency','Cloud storage team');add('recover','Splunk platform team');add('escalate','Splunk Cloud provider')}else{add('detect','Security operations');
```

## The new block

**`<script id="catalog-sync-v229">`** goes right after `config-parts-v228`'s `</script>` (line 17,448 of Build 228). It contains [`docs/mockups/catalog-sync-prototype.js`](mockups/catalog-sync-prototype.js). It needs the page's `stages`, `componentNames`, `componentOrder`, `colors`, `failures`, `failureFlowSteps`, `failureFlowComponents`, `failureComponentColors`, `queuePressure`, `blockingAt`, `blockingFailures`, `diagnosticSymptoms`, `topology`, `routeModels`, `pathScenarioFit` and `pathAllows` (as `config-view-v205` wraps it).

It does, in order:
1. Adds the two components, their Matrix columns and strip cards, and the seven stages, if Amazon SQS isn't there yet. It sets the counts the page set at load: all stages, each component's stages, and the header's components.
2. Adds the path: its topology, route, scenario fit and chip. It wraps `pathAllows` again, so that the seven show only on their path and the complete model, and so that the Config view's Matrix still shows every stage.
3. Adds the failure, its flow, colours, gauge and blocking point, and the symptom, if the failure isn't there yet. It sets the header's failure count.
4. Draws the Failure Lab and the main view again: the page drew them before the block ran.

`window.catalogSync229` gives `ID` (`sqs-catalog-expiry`), `PATH` (`s3-sqs-catalog`), `stages()` (the seven's ids) and `allows(stage)`.

## Build records

After the edit and the block, in a new `<script id="catalog-sync-records-v229">` before `</body>`:
- **`changeRegister`,** group "Failure and assurance":
  `['SQS ages out messages before federated search retrieves them','A Splunk-native data catalog’s SQS queue deletes S3 events before Splunk retrieves them, so federated searches miss data that is in the bucket: the failure, with its path, two components, seven stages and a symptom in Diagnose.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 228 did in its records, with Build 229 and 22 Nov 2026.

## Check before uploading

Run with Build 228 + the edit and the block, and with Build 228 for comparison.

### 1. The checks: 26. All pass with the edit and the block; 21 fail on Build 228

| Checks | What they find | Fail on Build 228 |
|---|---|---|
| The components (3) | The Matrix's two columns after AWS S3, every row as wide as the head. The strip's two cards after Amazon S3, with 1 and 3 stages, and 125 stages in all. The header's 13 components and 65 failures | 3 |
| The stages (4) | The seven, last and in order, each on its components. No other stage on either. A stage's detail, from its Matrix row | 4 |
| The path (5) | Its chip after Raw TCP; its title, text and eight stages; its route. None of the seven on another path. 125 on the complete model | 4 |
| The failure (9) | Listed last of 65, high risk. Its head and summary; data-loss, detection and recovery; its flow, failure point and flow-on; its gauge and component bands; its effects, checks and recovery. Show affected stages. Correlate and Inject | 8 |
| Diagnose and owners (2) | The symptom ranks the scenario first. The owners, from the Responsibility export | 2 |
| Errors and 390 px (3) | No page errors. At 390 px, the scenario's detail doesn't make the page scroll sideways | 0 |

The 5 that pass on Build 228 too are the checks that another path shows none of the seven stages (Build 228 has none to show), that Inject and Single draw, and that the page has no errors and doesn't scroll sideways at 390 px.

**The block's data, in the page:** 13 checks, all pass. They cover:
- every flow step is a stage, with a component and a colour;
- the affected stages, the gauge and the blocking point are on the flow;
- the stages' ids follow on, and every stage has a value for both components;
- the path, its route and its scenario, and the symptom's causes;
- on each path, the seven show only on the complete model and the new path;
- the Config view's Matrix shows every stage.

### 2. Regression against Build 228

What the block adds is taken out of the new page before comparing:
- the two cards and Matrix columns;
- the seven stages' cards and rows;
- the chip, the scenario and the symptom;
- the two pipelines in the filter.

The counts it changes are set to what they'd be without it: all stages, each component's stages, the stages shown, and the header's components and failures.

| What is compared | Result |
|---|---|
| View text, every view | 10 of 10 the same |
| Operations pages, each one's text | 20 of 20 the same |
| OV pages, each tab's text | 28 of 28 the same |
| Every path Build 228 has: the Flow view's text, the route's HTML, the context's title and text | 11 paths, 33 of 33 the same |
| Every scenario Build 228 has, chosen in the Failure Lab: its detail's HTML, and its owners in the Responsibility export | 64 scenarios, 128 of 128 the same |
| The list of scenarios, and Correlate, Inject and Single as they open: HTML and text | 8 of 8 the same, with the list of the scenarios' ids |
| Every symptom Build 228 has, in Diagnose: the view's text | 12 symptoms, 13 of 13 the same, with the list of their ids |
| The Config view, with no files, the example, the Fortinet add-on's four files and its package, for every component and source type choice: the panel's, the Matrix's and the map's HTML, and the page's text | 279 of 279 the same, the package's files, error and tab included |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None on either |

Each comparison takes Build 228 twice, to set aside whatever varies from run to run; nothing did.

**The Config view's results Splunk checked** are as with Build 228:

| What | Result |
|---|---|
| The Fortinet add-on's 54 sample events, tried as `fortigate_log`: their event types and tags, against Splunk 10.6.1.1 | All 54 the same, event types and tags, with none left open |
| Build 227's made-up app's event against its 51 event types in use, and its tags | 49 the same and none otherwise; et_host and et_index left open, and Splunk took both. All 10 tags the same |
| The 54 samples' fields | 2,682 of 2,682 field values the same, and the source type, on all 54 events |
| Build 225's made-up app's event | 24 of 26 fields the same, as before: `strftime()` isn't computed here, and Splunk's own tag field hides the indexed field named tag |
| 62 settings' tiers, on the page, against the packaging toolkit's placements | 50 within its placement and 12 outside it, as with Build 228 |

| Earlier suite or tool | Build 228 | Build 228 + the edit and the block |
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
| Lookup checks: 54 checks, as Build 223's handoff wrote them | 46 of 54 as written ‡ | 46 of 54 as written ‡ |
| Event types, tags and CIM data models: 64 checks (Build 222's handoff) | 63 of 64 as written † | 63 of 64 as written † |
| The Config view handoff's 70 checks, with the expectation Build 222's handoff rewrote | 69 of 70 as written † | 69 of 70 as written † |
| The source type map's 82 checks | 82 of 82 | 82 of 82 |
| The splits' 40 checks, with the map's tools taken out as Build 224's handoff says | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines' 31 checks | 31 of 31 | 31 of 31 |
| The space tool | The output | The same output |
| The connector tool | The output | The same output |
| The offline check, with the Fortinet add-on's package | 23 of 23 | 23 of 23 |

† As with Build 228. Three of Build 224's checks want what Build 225 changed. One of Build 222's wants a folder's macros.conf counted among the skipped files, which Build 228 reads. One of the Config view handoff's wants Where it acts right above the file tabs, where Build 228 put its tables.

‡ As with Build 228. Eight of the lookup checks, as first written, want what Build 226 changed; as Build 226 runs them, all 54 pass, above.

### 3. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 228 | With the edit and the block |
|---|---|---|
| Loading the page, to its load event | 1698 ms (1582 to 1983) | 1794 ms (1648 to 2049) |
| The Flow view and the Matrix, on the complete model: a draw † | 3.90 ms (3.62 to 6.06) | 4.65 ms (3.96 to 7.56) |
| Each path in turn, as its chip switches to it: the route and a draw | 3.04 ms (2.62 to 4.48) | 3.31 ms (2.81 to 4.67) |
| The Failure Lab, Amazon S3 destination unavailable: a draw | 0.83 ms (0.66 to 1.37) | 0.83 ms (0.66 to 1.55) |
| The Failure Lab, the new scenario: a draw | Not on Build 228 | 0.78 ms (0.68 to 1.34) |
| Diagnose, S3 objects are missing: a draw | 0.35 ms (0.24 to 0.94) | 0.30 ms (0.26 to 0.47) |
| Diagnose, the new symptom: a draw | Not on Build 228 | 0.27 ms (0.23 to 0.47) |
| The Config view, with the example: a draw | 6.18 ms (5.30 to 9.83) | 6.47 ms (5.42 to 9.91) |
| The Config view, with the Fortinet add-on's package: a draw | 10.4 ms (9.5 to 14.9) | 11.5 ms (9.7 to 18.1) |

- **Each figure** with the edit and the block is within Build 228's spread, and Build 228's within theirs, but for the one marked †. The Flow view and the Matrix draw 125 stages, and the Matrix 13 component columns, instead of 118 and 11: +0.8 ms on the median. The new scenario and symptom draw as the others do.

### 4. The build

`index.html` as committed, Build 229, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 7 of 7 checks.
- The new checks pass on Build 229 as on the tested page: 26 of 26 and 13 of 13.

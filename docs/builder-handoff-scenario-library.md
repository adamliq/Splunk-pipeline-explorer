# Builder handoff: scenario library packs

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 234.
**Applied:** as Build 235, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="scenario-library-v235">` (353 lines), after `readiness-login-patterns-v234`, containing [`docs/mockups/scenario-library-prototype.js`](mockups/scenario-library-prototype.js). It sets `window.scenarios235`.
- `<style id="scenario-library-v235-styles">` (77 lines), after `readiness-login-patterns-v234-styles`.

**One in-place edit:** the change register's entry for the feature, marked implemented. The edit, the block and the styles are also in [`docs/mockups/scenario-library.diff`](mockups/scenario-library.diff), a unified diff against Build 234's `index.html` with no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Scenario library packs (Later): portable reusable failure, recovery and data-quality scenario bundles."

**How it was done:**
- The page's three simulators were read first: the Failure Lab (its 65 failures, alone, correlated, or as a fault injected into the Builder's topology), Operate › Recovery simulation and Operate › Data-quality simulation. The library adds no model of its own: a pack holds a simulator's inputs, and each run goes through that simulator's model.
- The built-in packs use only what the simulators already have: their failures, their faults, their presets and their defaults.
- Every built-in scenario that runs on the default topology was opened from the library, as a person would, and its simulator read: all 27 show the library’s figures (104 figures compared), and the one that can’t run there (it needs a HEC endpoint) says so.

**Sources** (Splunk documentation, help.splunk.com), for what the built-in packs exercise:
- [outputs.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/outputs.conf): `useACK`, the forwarder keeps each block until the receiver acknowledges it. The recovery scenarios' acknowledgement modes (confirmed, ambiguous, disabled) model what happens to events in flight when a link fails.
- [inputs.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/inputs.conf): `persistentQueueSize`, the buffers the recovery scenarios fill.
- [props.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/props.conf): `LINE_BREAKER`, `TRUNCATE` and `TIME_FORMAT`, behind the parsing failures in "Parsing and event quality".
- [Set up and use HTTP Event Collector with configuration files](https://help.splunk.com/en/splunk-enterprise/get-started/get-data-in/9.3/get-data-with-http-event-collector/set-up-and-use-http-event-collector-with-configuration-files): tokens and indexer acknowledgement, behind "HEC ingestion".
- [Implement a deployment server cluster](https://help.splunk.com/en/splunk-enterprise/administer/update-your-deployment/9.4/configure-the-deployment-system/implement-a-deployment-server-cluster): behind "Deployment Server incidents".
- [Configure single sign-on with SAML](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/use-saml-as-an-authentication-scheme-for-single-sign-on/configure-single-sign-on-with-saml): behind "Identity and credentials".

**Mockup (the target):** [`docs/mockups/scenario-library-mockup.html`](mockups/scenario-library-mockup.html).
- 6 scenes have the block, its styles and the edit applied to Build 234.
- 3 "Today" scenes are Build 234.
- The screenshots are `docs/mockups/compare/scenario-library-*.png`.

## Where it is

- **The library:** Operate › Scenario library, after Data-quality simulation. The packs are on the left, built-in first, then yours; the chosen pack is on the right, with its scenarios in a table.
- **Save to library:** in the Failure Lab, under the Single / Correlate / Inject switch (after the mode's hint in Correlate and Inject), in every mode; in Operate › Recovery simulation and Data-quality simulation, first among the page's own controls.
- **The banner:** on the simulator a scenario was opened in, at the top: "From the scenario library: *name* (*pack*)", with Put back the previous settings and Back to the library.

## 1. Scenarios and packs

**Five kinds of scenario**, each a simulator's inputs:

| Kind | Its settings | Opens in |
|---|---|---|
| Failure | one of the Failure Lab’s failures, and, for the four that can fail in a single pipeline set, whether it does | Failure Lab · Single |
| Correlated failures | 2 to 4 failures, and when each starts and how long it lasts | Failure Lab · Correlate |
| Injected fault | the component (its type, and its name), the stage, the fault, how long, the arrival rate, the event size, the buffer and the rate to recover at | Failure Lab · Inject |
| Recovery | all 13 of the simulation’s inputs: arrival rate, event size, outage, the four buffers, pipeline sets and their rates, imbalance, replay and acknowledgement | Operate › Recovery simulation |
| Data quality | the profile, rate, window, event size and the seven defect rates | Operate › Data-quality simulation |

**A scenario** is `{id, kind, name, note, settings}`. Every scenario, built in, saved, loaded from a file or read back from the browser, goes through the same check (`normalize`):
- a failure must be one of the Failure Lab's; a correlation takes 2 to 4 of them; an injected fault must name a Builder component type and a fault the Failure Lab injects;
- numbers are set within the simulator's own limits, by running its model on them: the recovery and data-quality settings are what the model reads back. An outage of −5 minutes becomes 1 minute, a replay of 900% becomes 100%;
- a data-quality scenario keeps its preset only while its rates are the preset's: otherwise its profile is custom;
- a scenario with no name is named from its settings (below).

**Names from settings:** a failure by its name, with “(pipeline set 1)” when it is scoped so (Receiver unreachable (pipeline set 1)); a correlation by its failures joined with “+” (Receiver unreachable + indexQueue or disk I/O stall); an injected fault by the fault, the component and how long (Component unavailable at Indexer, 60 min); a recovery scenario by its outage, arrival rate and acknowledgement (60-minute outage at 12,000 EPS, acknowledgement ambiguous); a data-quality scenario by its preset (Truncation and boundaries), or Custom data quality when its rates are its own.

**Five packs are built in**, 28 scenarios:

| Pack | What it’s about | Scenarios | On the default topology |
|---|---|---|---|
| Indexer outage drill | An indexer stops taking data for an hour, then comes back | 6: Failure Lab 3, Recovery 3 | 4 serious, 1 with a cost, 1 fine |
| Parsing and event quality | Defects that arrive intact but search badly | 6: Failure Lab 3, Data quality 3 | 3 serious, 3 with a cost |
| HEC ingestion | The HTTP Event Collector refusing requests, unavailable, or unable to confirm | 5: Failure Lab 4, Recovery 1 | 3 serious, 1 with a cost, 1 can’t run here |
| Deployment Server incidents | Fleet management failing while events may still flow | 5: Failure Lab 5 | 4 serious, 1 with a cost |
| Identity and credentials | Sign-in and machine trust failing | 6: Failure Lab 6 | 6 serious |

Each scenario, with what it gives on the default topology (Syslog Source → Syslog Server → Universal Forwarder → Indexer):

| Pack | Scenario | Kind | Outcome |
|---|---|---|---|
| Indexer outage drill | Receiver unreachable | Failure | High risk: Loss: Conditional. Detection: Delayed. Recovery: Automatic when buffered. 8 stages. |
| Indexer outage drill | Indexer down for an hour | Injected fault | Data lost: 29.44 GB past the buffer. At Indexer 1, tcpin_queue. Buffer full in 24.3 min; recovery 48.5 min. |
| Indexer outage drill | One-hour outage, acknowledgement in doubt | Recovery | Held, at a cost: The buffers hold 49.44 GB. 49.44 GB arrives during the outage; recovery 4.2 hr; duplicates at risk 2.47 GB. |
| Indexer outage drill | One-hour outage, acknowledgement confirmed | Recovery | Held: The buffers hold 49.44 GB. 49.44 GB arrives during the outage; recovery 4.2 hr; duplicates at risk 0 MB. |
| Indexer outage drill | Four-hour outage | Recovery | Data lost: 117.75 GB past the buffers. 197.75 GB arrives during the outage; recovery 7.3 hr; duplicates at risk 9.89 GB. |
| Indexer outage drill | Receiver down, then indexQueue stalls | Correlated failures | High risk: Primary: Receiver unreachable. 16 stages touched, 0 shared; fullest queue 98%; highest risk high. |
| Parsing and event quality | Incorrect LINE_BREAKER | Failure | High risk: Loss: Possible. Detection: Incorrect. Recovery: Re-index required. 8 stages. |
| Parsing and event quality | TRUNCATE too low | Failure | High risk: Loss: Yes — event tail. Detection: Incomplete. Recovery: Source replay. 8 stages. |
| Parsing and event quality | Timestamp extraction failure | Failure | High risk: Loss: No raw loss. Detection: Missed or late. Recovery: Re-index often needed. 8 stages. |
| Parsing and event quality | Truncation and boundaries | Data quality | Degraded: Quality 63.8 / 100. Detection readiness 59.4; event-time usability 86.9; 18,985,909 of 43,200,000 events affected. |
| Parsing and event quality | Timestamp corruption | Data quality | Degraded: Quality 76.0 / 100. Detection readiness 70.5; event-time usability 52.2; 14,390,622 of 43,200,000 events affected. |
| Parsing and event quality | Schema drift | Data quality | Degraded: Quality 64.1 / 100. Detection readiness 50.2; event-time usability 96.8; 17,103,090 of 43,200,000 events affected. |
| HEC ingestion | HEC request rejected | Failure | High risk: Loss: Client dependent. Detection: Missing. Recovery: Correct and replay. 9 stages. |
| HEC ingestion | HEC endpoint unavailable | Failure | Critical risk: Loss: Low while durably buffered. Detection: Missing or delayed. Recovery: Restore and drain. 7 stages. |
| HEC ingestion | HEC acknowledgement not confirmed | Failure | High risk: Loss: Low; duplicate risk. Detection: Delayed or duplicated. Recovery: Reconcile then retry. 12 stages. |
| HEC ingestion | Tokens rejected for 30 minutes | Injected fault | Can’t run here: Needs a HEC Endpoint. The topology has no HEC Endpoint to inject into: add one in the Builder. |
| HEC ingestion | Clients resend a fifth of an hour’s events | Recovery | Held, at a cost: The buffers hold 49.44 GB. 49.44 GB arrives during the outage; recovery 4.8 hr; duplicates at risk 3.46 GB. |
| Deployment Server incidents | Deployment Server unreachable | Failure | Medium risk: Loss: No direct event loss. Detection: Configuration stale. Recovery: Restore and reconcile. 9 stages. |
| Deployment Server incidents | Phone-home storm after an outage | Failure | High risk: Loss: No immediate event loss. Detection: Management delayed. Recovery: Stagger and drain. 6 stages. |
| Deployment Server incidents | Server-class change reaches too many agents | Failure | Critical risk: Loss: High. Detection: Blast radius excessive. Recovery: Stop and rollback. 6 stages. |
| Deployment Server incidents | Management healthy, events broken | Failure | Critical risk: Loss: High. Detection: Detection outage. Recovery: Repair event path. 7 stages. |
| Deployment Server incidents | Server back after an hour, then the storm | Correlated failures | High risk: Primary: Deployment Server unreachable. 9 stages touched, 6 shared; no queue grows; highest risk high. |
| Identity and credentials | SAML identity provider unavailable | Failure | Critical risk: Loss: No direct event loss. Detection: Management access unavailable. Recovery: Restore IdP or invoke tested break-glass access. 4 stages. |
| Identity and credentials | MFA or conditional-access rejection | Failure | High risk: Loss: No direct event loss. Detection: Interactive access rejected. Recovery: Resolve policy or approved exception. 4 stages. |
| Identity and credentials | Certificate expired, untrusted or wrong name | Failure | Critical risk: Loss: Conditional. Detection: Component channel unavailable. Recovery: Repair certificate and trust chain. 3 stages. |
| Identity and credentials | HEC token disabled, expired or wrong index | Failure | Critical risk: Loss: Conditional. Detection: Collection rejected. Recovery: Restore token state and index scope. 4 stages. |
| Identity and credentials | Rotation done on one tier only | Failure | Critical risk: Loss: Conditional. Detection: Partial fleet or pipeline outage. Recovery: Complete or roll back coordinated rotation. 3 stages. |
| Identity and credentials | Clock skew, then assertions refused | Correlated failures | High risk: Primary: Clock skew invalidates assertions, tokens or certificates. 4 stages touched, 4 shared; no queue grows; highest risk high. |

## 2. Running a pack

**Run the pack** runs every scenario in it through its simulator's model, on a copy of that simulator's settings: the page's own settings are put back after each one (`withState`), so running changes nothing in the simulators. The topology is the Builder's as it is at the moment.

**What each kind reports:**

| Kind | Serious | With a cost | Fine | What the row says |
|---|---|---|---|---|
| Failure | High or critical risk | Medium risk | Low risk | The risk; the data-loss risk, detection and recovery the Failure Lab gives it; how many stages it touches |
| Correlated failures | The highest risk among them is high or critical | Medium | Low | The primary candidate; the stages touched and shared; the fullest queue |
| Injected fault | Data past the buffer | Data held in the buffer, or (a corruption fault) data unreliable | No backlog | Where (component and stage), when the buffer fills, how long recovery takes |
| Recovery | Data past the buffers | Duplicates at risk, or no end to recovery | Held | What arrives during the outage, how long recovery takes, the duplicates at risk |
| Data quality | Quality under 60 | Under 85 | 85 or more | The quality score, detection readiness, event-time usability, the events affected |

The summary above the table counts them: serious, with a cost, fine, and can't run here, each with an icon as well as its colour. A scenario that can't run here (an injected fault with no component of its type) says what to add, and opening it changes nothing.

**Download results (CSV):** a row per scenario, 8 columns: `pack`, `scenario`, `kind`, `settings`, `severity`, `outcome`, `headline`, `detail`. It is off until the pack has been run.

## 3. Opening a scenario

**Open** puts the scenario's settings into its simulator, in place of what was there, and goes to it:
- a failure: Failure Lab, Single, that failure (and pipeline set 1 where the failure has the option);
- a correlation: Failure Lab, Correlate, those failures with their timing;
- an injected fault: Failure Lab, Inject, aimed at the topology's component of that type, the one with the scenario's name if there is one, else the first;
- recovery and data quality: their Operate page, with all of their settings.

What it replaced is kept: Put back the previous settings, on the banner or in the library's message, restores it. The keyboard focus goes to the banner; on a phone the page scrolls to it. The banner stays on that simulator, wherever the page goes, until the settings are put back or another scenario is opened: only the latest opening can be put back.

## 4. Save to library

**Save to library** reads the simulator's settings as its model reads them, and saves them as a scenario of the matching kind: in the Failure Lab, of the mode it is in. An injected fault is saved with its component's type and name (Indexer, Indexer 1), so it finds the same component in another topology, or one of its type.

It goes to the pack chosen under **Save new scenarios to**, in the library's list of packs. The first save starts a pack called My scenarios. The message says where it went, with a link to the library on that pack; when the browser can't store anything it says the scenario lasts for this visit.

## 5. Your packs

- **New pack** starts an empty pack, with the focus on its name.
- **Copy to your packs**, on a built-in pack, makes an editable copy under its own name ("Indexer outage drill (2)").
- On your own pack: its name and description are fields; each scenario's name and note are fields (Enter keeps a name); **Remove** takes a scenario out; **Delete pack** asks first ("Delete … and its N scenarios from this browser?"), with Keep it focused.
- After each action the focus goes to what the action leaves in front of the person: the pack's button, Run the pack, the next scenario's Open, the message.

**Kept in this browser:** `localStorage["splunkPipelineExplorer.scenarioPacks235"]`, `{packs: [{id, name, description, builtIn: false, scenarios, kept}], target}`, `target` being the pack Save to library fills. A scenario that this build can't read (one a later build saved, say) is kept as it was, under `kept`: it isn't shown or run, the pack says how many there are, and it goes into the pack's file.

## 6. Pack files

**Download pack** writes `scenario-pack-<name>.json`:

```json
{
  "schema": "splunk-pipeline-explorer/scenario-pack",
  "version": 1,
  "exportedAt": "2026-11-25T09:00:00.000Z",
  "packs": [
    {
      "name": "Indexer outage drill",
      "description": "An indexer stops taking data for an hour, then comes back: what the queues and buffers hold, what’s resent, and how long the backlog takes to drain.",
      "scenarios": [
        {
          "kind": "injection",
          "name": "Indexer down for an hour",
          "note": "The Indexer’s own 20 GB buffer against an hour of 12,000 EPS.",
          "settings": {
            "target": {
              "type": "idx",
              "name": ""
            },
            "stage": "",
            "fault": "unavailable",
            "durationMin": 60,
            "arrivalEps": 12000,
            "eventKb": 1.2,
            "bufferGb": 20,
            "recoveryEps": 18000
          }
        },
        {
          "kind": "recovery",
          "name": "One-hour outage, acknowledgement in doubt",
          "note": "Events in flight when the link failed are resent, so some may be indexed twice.",
          "settings": {
            "arrivalEps": 12000,
            "eventKb": 1.2,
            "outageMin": 60,
            "sourceGb": 30,
            "ufGb": 20,
            "hfGb": 10,
            "indexerGb": 20,
            "perSetEps": 9000,
            "sharedEps": 15000,
            "pipelineSets": 2,
            "imbalancePct": 15,
            "replayPct": 5,
            "ackMode": "ambiguous"
          }
        }
      ]
    }
  ]
}
```

**Load a pack…** reads one or more packs from such a file and adds each as a pack of yours. Each scenario is checked as above; what can't be read is left out and named, with the reason. The messages:

| The file | The message |
|---|---|
| A pack file | Loaded “Team drills” (2 scenarios) from team-drills.json. |
| Some scenarios this build can’t read | … Left out: “Queue stall from a later build” in Team drills: “index-queue-v2” isn’t a failure in this build; “Lonely correlation” in Team drills: a correlation takes 2 to 4 failures, not 1. |
| A kind, fault or component this build doesn’t have | “teleport” isn’t a kind of scenario this build knows · “meltdown” isn’t a fault this build injects · “toaster” isn’t a Builder component in this build |
| Not JSON | file.json: The file isn’t JSON. |
| Another kind of file | file.json: It isn’t a scenario pack: its schema isn’t splunk-pipeline-explorer/scenario-pack. |
| No version | file.json: Its version is missing. |
| No pack in it | file.json: It holds no pack. |
| Over 5 MB | file.json: The file is over 5 MB. |

## The edit, on Build 234's lines

1. **Line 1,810, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Scenario library packs','Portable reusable failure, recovery and data-quality scenario bundles.',false,'Later']
new: ['Scenario library packs','Portable reusable failure, recovery and data-quality scenario bundles.',true,'Later']
```

## The new block

**`<script id="scenario-library-v235">`**, right after `readiness-login-patterns-v234`'s `</script>` (line 19,986 of Build 234). Its parts, in order:

- `core` (80 lines): the five kinds, `withState`, `normalize` (the checks every scenario goes through), and names and settings as a person reads them.
- `packs` (62 lines): the built-in packs, and your packs in this browser.
- `run` (57 lines): running a scenario through its simulator’s model, the results CSV, and pack files.
- `library-view` (70 lines): Operate › Scenario library.
- `hooks` (78 lines): Open and Put back, Save to library and the banner in the simulators, and Operate’s menu entry.
- `exports` (4 lines): `window.scenarios235`.

It wraps `renderOperations`, for the Scenario library page, and adds Operate's menu entry after Data-quality simulation. The Failure Lab draws its list and detail from a function for each mode, and its fields redraw them; Operate redraws its content for each page. So the block doesn't wrap those functions: it watches `#scenarioList`, `#failureDetail` and `#operationsContent` (`MutationObserver`, their children only) and puts Save to library and the banner back whenever any of them is drawn again, as Build 231's scenario count does for the list.

It sets `window.scenarios235`, which gives the models to the checks.

Its styles, **`<style id="scenario-library-v235-styles">`**, go right after `readiness-login-patterns-v234-styles`'s `</style>` (line 17,106). Every rule is under a `.sl235` class; text is 11 px or more.

## Build records

After the edit and the block, in a new `<script id="scenario-library-records-v235">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Scenario library','Operate › Scenario library runs packs of failure, recovery and data-quality scenarios on the topology of the moment and opens each in its simulator; the Failure Lab and the Recovery and Data-quality simulations save to it, and packs download and load as files.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 234 did in its records, with Build 235 and 26 Nov 2026.

## Check before uploading

Run with Build 234 + the edit, the block and the styles, and with Build 234 for comparison.

### 1. The checks: 46. All pass with the edit

Each check opens the page as a person would and uses the library as described above. On Build 234 the library isn't there: 1 passes (no page errors) and the rest fail or can't start.

- **Where the library is:** Operate’s menu has Scenario library right after Data-quality simulation; it opens on the scenario library, with the menu entry marked, and the first pack chosen; five built-in packs, each with its scenarios counted by simulator, and none of yours yet; 28 built-in scenarios of all five kinds (16 failures, 3 correlations, 2 injected faults, 4 recovery, 3 data quality), each one already as the checks leave it; before a run each row says Not run yet and the results download is off.
- **Running a pack:** Run the pack: on this topology of 4 components, 4 serious, 1 with a cost, 1 fine; each row gives its outcome in the scenario’s own terms: risk, data lost or held, the figures and how long; the figures add up: 12,000 EPS of 1.2 KB for an hour is 49.44 GB; 20 GB of it fits the Indexer’s buffer; four hours past 80 GB of buffers leaves 117.75 GB; running doesn’t touch the simulators’ own settings; the keyboard focus stays on Run the pack; Download results (CSV) gives a row per scenario with its kind, settings, severity and outcome.
- **The library and the simulators agree:** Open on Indexer down for an hour: the Failure Lab in Inject mode, aimed at the Indexer, with a banner that has the focus; the Failure Lab shows the library’s figures: 49.44 GB backlog, 29.44 GB beyond the buffer, full in 24.3 min, normal in 48.5 min; the banner’s Put back the previous settings restores the Failure Lab as it was and the banner goes; Open on a recovery scenario: Operate › Recovery simulation with its settings, the same 49.44 GB and 4.2 hr, and the banner; Back to the library says what was opened and offers the put-back, which restores the Recovery settings and says so; Open on Truncation and boundaries: the Data-quality simulation on that preset, scoring 63.8 / 100 as the library did; Open on the correlation: Correlate mode with both failures and their timing (0 for 30, 8 for 45); Open on a failure: Single mode with that failure chosen in the list.
- **A scenario that needs a component:** in the HEC pack the token scenario can’t run on a topology with no HEC endpoint, and says what to add; opening it says so and leaves the Failure Lab alone; with a HEC endpoint added in the Builder, the same scenario runs against it.
- **Save to library:** the Failure Lab has Save to library under its mode switch from the first visit; saving a failure starts My scenarios and saves it there; in Correlate mode it saves the chosen failures and their timing (the stall moved to 12 min); in Inject mode it saves the fault, the component by its type and name, and the figures typed in; the Recovery simulation has Save to library first among its controls, and saves the 120-minute outage typed in; the Data-quality simulation saves a preset under its name, and changed rates as Custom data quality; Open the library shows My scenarios with the six saved, and they run; New pack starts an empty pack; Save new scenarios to chooses where saving puts them; when the browser can’t store anything, saving says the scenario lasts for this visit only.
- **Your packs:** renaming a scenario in your pack: Enter keeps the name, the Open button’s name follows, the focus stays; renaming the pack changes its button and the target list in place, and Tab still reaches the description; after a reload your pack, its names, its note and the save target are still there; Remove takes one scenario out, says so, and moves the focus to the next one’s Open; Delete pack asks first; Keep it keeps it, Delete deletes it from this browser; Copy to your packs makes an editable copy of a built-in pack under its own name.
- **Pack files:** Download pack gives a scenario-pack file: the pack’s name and description, and each scenario’s kind, name, note and settings; Load a pack… takes the file back as a new pack of yours, which runs to the same outcomes; a file with problems: what this build reads is loaded (out-of-range values set within the simulator’s limits) and the rest named with the reason; files that aren’t packs say why: not JSON, another schema, no pack, over 5 MB.
- **Scenarios this build can’t read:** a saved scenario this build can’t read isn’t shown or run, but stays saved and goes into the pack’s file.
- **The register, text size, names, keyboard, a phone and errors:** the change register lists Scenario library packs as implemented; at 1440 px the library, the banner and the save boxes have text of 11 px or more, every control named, no sideways page; at 390 px the library, the banner and the save boxes have text of 11 px or more, every control named, no sideways page; on a phone, choosing a pack takes you to it, with the focus kept on its button; no page errors.

### 2. The library's figures and the simulators'

`figures35.js` ran every built-in pack on the default topology through the library, then opened each of its 27 scenarios that run there from the library, read the simulator, and put the settings back: 27 of 27 show in their simulator the figures the library’s row gives, 104 figures in all (the Failure Lab’s data-loss risk, detection and recovery for a failure; its primary candidate, stages and shared points for a correlation; its backlog, excess, buffer time and recovery time for an injected fault; the Recovery simulation’s outage volume, return to normal, excess or “Buffers survive the outage”, and duplicate exposure; the Data-quality simulation’s four scores). After all of it the simulators’ settings were as they were at the start. Over the five packs: 20 serious, 6 with a cost, 1 fine, 1 can’t run here.

### 3. The new UI, swept

The new UI's states (the library: a pack, run; the HEC pack with its scenario that can't run; your pack, run; a new pack; the delete confirm; a file with problems; the put-back message; the Failure Lab in each mode and the Recovery and Data-quality simulations, each after Save to library; a scenario opened in the Failure Lab and in the Recovery simulation, with the banner), with the review's page check at four widths:

| The new UI, in the 15 states | 1440 px | 1280 px | 1024 px | 390 px |
|---|---|---|---|---|
| Page or console errors | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 |
| Text under 10 px | 0 | 0 | 0 | 0 |
| Text under WCAG contrast, on a control that works | 0 | 0 | 0 | 0 |
| Text under WCAG contrast, on a disabled control | 7 | 7 | 7 | 7 |
| Text cut off in its box | 0 | 0 | 0 | 0 |
| Text over other text, either of them in the new UI | 0 | 0 | 0 | 0 |
| Text over other text, both in the new UI | 0 | 0 | 0 | 0 |
| Tap targets under 24 px | — | — | — | 0 |

Nothing the check finds is the new UI’s but its disabled buttons (Download pack, Download results (CSV), Run the pack, before a run or on an empty pack): WCAG doesn’t hold disabled controls to contrast. Each finding was flagged as it was found: in the new UI or not, on a disabled control or not.

The five states both pages have (the Failure Lab in each mode, the Recovery and Data-quality simulations), Build 234 / the new page, the five states together:

| In the five states | 1440 px | 1280 px | 1024 px | 390 px |
|---|---|---|---|---|
| Text over other text | 1 / 2 | 3 / 3 | 3 / 1 | 0 / 0 |
| Text under WCAG contrast | 63 / 63 | 63 / 63 | 63 / 63 | 63 / 63 |
| Text under 10 px | 35 / 35 | 35 / 35 | 35 / 35 | 35 / 35 |
| Controls without a name | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| Tap targets under 24 px | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

These are the page’s own: the Failure Lab’s small labels, its unnamed injection fields and its unticked check marks (drawn transparent), the same on both pages. Every pair of text over text, on either page, is an item of the Failure Lab’s list under the page’s footer, out of the list’s scrolled box: which items are under it moves with the list, from page to page and from run to run.

The review's sweep of every page, as Build 231's handoff ran it, on the 56 pages both builds have and on the new Scenario library page alone:

| At each width | 1440 px: Build 234 | 1440 px: new | 1440 px: Scenario library | 1024 px: Build 234 | 1024 px: new | 1024 px: Scenario library | 390 px: Build 234 | 390 px: new | 390 px: Scenario library |
|---|---|---|---|---|---|---|---|---|---|
| Page errors | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Text under WCAG contrast | 36 | 36 | 1 | 34 | 34 | 1 | 32 | 32 | 1 |
| Text under 10 px | 139 | 139 | 0 | 139 | 139 | 0 | 167 | 167 | 0 |
| Tap targets under 24 px | — | — | — | — | — | — | 108 | 108 | 0 |
| Ids used more than once | 588 | 588 | 12 | 588 | 588 | 12 | 588 | 588 | 12 |

The 56 pages give the same figures on both builds, page by page, but for text over text in two places: in the Failure Lab at 1440 px, 1 on Build 234 and 2 on the new page; at 1024 px, 1 on Build 234 and 2 on the new page, where every such pair, on both pages, is an item of its list under the page’s footer, out of the list’s scrolled box, as in the sweep above (Save to library, above the list, moves the list down); and on Operate › Event walkthrough at 1024 px, 4 on Build 234 and 3 on the new page. The walkthrough’s code block scrolls in its box, and the check counts its text’s whole length, which runs 213 px below the box, out of view, and on Build 234 29 px into the page’s footer. On the new page Operate’s menu, one entry longer, is 45 px taller and puts the footer as much lower, clear of it (measured twice on each page, `walk35.js`). The Scenario library page’s contrast finding is its Download results (CSV) button, disabled until the pack has been run; its ids are the ones duplicated elsewhere in the document, which every page reports.

Other sweeps:
- **Every control used once:** Build 234, 1,826 controls on 56 pages; the new page, 1,878 on 57. None leaves a page error on either. The sweep itself can’t click an SVG part with `click()`, or read the options of one list in the parsing laboratory (102 and 102). Controls with no effect it could see: 104 and 104.
- **Round the pages:** ten rounds on each page. Over rounds 2 to 10 the median is 40,639 DOM nodes on Build 234 and 38,402 on the new page, from 38,390 to 41,603 and from 38,402 to 41,608; the heap grows 0.38 MB and 0.38 MB a round after the first. Round 10 is at 38,698 and 38,537.
- **Cut off by a box that hides overflow:** at 390 px, 12 on Build 234 and 12 on the new page, all on the Builder canvas, which pans; at 1440 px, none on either.

### 4. Regression against Build 234

The same snapshots as Build 234’s regression, of Build 234 and the new page. What Build 235 means to change is set aside on both pages: the new controls are out of the page while the text is read (Operate’s Scenario library entry, Save to library in the Failure Lab and the Recovery and Data-quality simulations, and the banner, which the snapshots never open); Operate’s pages are visited by name, the Scenario library apart; and the change register’s Scenario library packs entry goes back to Proposed next features, Later. Build 235 adds nothing to the architecture report or the evidence pack, which are compared whole. Build 235’s own checks, in section 1, look at what it changes. Build 231’s and 232’s set-asides are kept; Build 234’s are no longer needed, as both pages have its readiness score, login walkthrough and patterns, which are now compared.

| What is compared | Result |
|---|---|
| View text, every view; Operations pages; OV pages; the evidence pack | 60 of 60 the same |
| Every path: the Flow view's text and the route | 25 of 25 the same |
| Every failure's detail and owners; every symptom | 145 of 145 the same |
| The Config view, with no files, the example, the Fortinet add-on's four files and its package | 279 of 279 the same |
| Four Builder topologies, each component's inspector on each of its tabs | 60 of 60 the same |
| The same topologies, each link's inspector | 16 of 16 the same |
| The same topologies: the canvas's text, every card's text and box, the rules' results, the validation, every link's label and details, the network overlay, the topology file and the architecture report | 31 of 32 the same (1 differ: see below) |
| Page errors | None on either |

Each comparison takes Build 234 twice, to set aside whatever varies from run to run: nothing did. 617 of the 618 snapshots are the same before any normalising. One differs: the Builder’s topology file for the Deployment Server cluster, whose change history lists one change, “Update topology configuration”, on the new page and none on Build 234. Nothing in the topology changed. The Builder records a change when a click inside it is followed, before its 0 ms timer runs, by a change to what its history snapshot holds, and that snapshot holds the layout profiles. While a topology is unsaved, the Builder saves a recovery draft 550 ms after each change, and the draft, through `topologyDocument`, stamps the active layout profile with the time. When the draft runs between a click (the regression clicks each inspector tab) and that timer, the new time is recorded as a change. That is timing, and Build 234’s own: in the trial regression before this one, Build 234’s two runs differed in just this way, for the HEC load balancer. With the timer made 1.5 s late (`settle35.js`), a tab click records the change on both pages, for each of the 3 topologies with a load balancer, the layout profiles the only difference; with the recovery draft left out, it records nothing on either page. Run as they are, 3 times on each page in turn (`histvar35.js`), the regression’s steps for the four topologies recorded no change on either page, and each topology’s file was the same on both. Build 235 reads the Builder’s components and changes nothing in the Builder.

**The earlier suites and tools**, on both pages:

| Suite or tool | Build 234 | Build 234 + the edit |
|---|---|---|
| Build 234’s 53 checks | 53 of 53 | 53 of 53 |
| Build 233’s 58 checks | 58 of 58 | 58 of 58 |
| Build 232’s 29 checks | 29 of 29 | 29 of 29 |
| Build 231’s 37 checks, with the register’s count as Build 235 leaves it | 36 of 37 † | 37 of 37 |
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
| The Builder’s redraws, 4 components: budget 40 ms § | 30 ms; 33 ms after a card moves | 31 ms; 32 ms after a card moves |
| The Builder’s redraws, 5 components: budget 50 ms § | 43 ms; 42 ms after a card moves | 41 ms; 42 ms after a card moves |
| The Builder’s redraws, 8 components: budget 80 ms § | 74 ms; 75 ms after a card moves | 69 ms; 77 ms after a card moves |
| The Builder’s redraws, 17 components, the reference topology: budget 120 ms § | 81 ms; 88 ms after a card moves | 80 ms; 95 ms after a card moves |
| The offline check, with the Fortinet add-on’s package | 23 of 23 | 23 of 23 |

**The Config view's results that Splunk checked** are the same on both pages: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

† Checks that want what a later build changed:
- **New with Build 235:** Build 231’s check 21, as Build 234’s run had it, wanted 6 changes proposed in the change register. Build 235 implements one of them, leaving 5; this run wants 5, so the check fails on Build 234, which has 6, and all 37 pass on the new page.
- **As before:** three of Build 224’s checks want what Build 225 changed; eight of the lookup checks, as first written, want what Build 226 changed; one of Build 222’s wants a folder’s macros.conf counted among the skipped files; one of the Config view handoff’s wants Where it acts right above the file tabs.

‡ These two have a 2.5-second page-load limit. They finished as written on both pages, and gave the same results with only that limit raised to 15 seconds.

§ `tools/builder-perf-check.js`, five runs on each page in turn after the other checks: the medians of its redraw after a change, and after a card moves. Every median is within its budget on both pages.

### 5. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 234 | With the edit |
|---|---|---|
| Loading the page (to the load event) | 1,785.8 ms (1,652.3 to 2,129.6) | 1,828.9 ms (1,650.4 to 2,090.6) |
| The ten views, each to its next frame (all ten) | 2,508.3 ms (2,287.2 to 2,732.7) | 2,450.6 ms (2,292.0 to 2,844.1) |
| The 28 OV pages, each to its next frame (all) | 2,825.5 ms (2,573.4 to 3,187.4) | 2,748.5 ms (2,523.2 to 3,212.6) |
| Builder redraw, its own topology | 42.7 ms (39.2 to 56.1) | 42.6 ms (40.1 to 49.5) |
| Drawing the change register | 37.3 ms (30.1 to 50.5) | 32.7 ms (29.3 to 48.5) |
| Restyling and laying out the page, on Changes | 29.0 ms (24.9 to 36.6) | 30.6 ms (24.6 to 41.2) |

Each figure with the edit is within Build 234’s spread, and Build 234’s within theirs.

### 6. The build

`index.html` as committed, Build 235, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 10 of 10 pass.
- The new checks pass on Build 235 as on the tested page: 46 of 46.

## Noticed, not changed

- **The Failure Lab says "0 scenarios" in Inject mode,** above the list, on Build 234 too: Inject mode lists no failures, so the count, which counts the list, is 0. Opening an injected fault from the library shows it the same way.
- **The Failure Lab's own findings** in the sweep (section 3) are Build 234's: the same counts on both pages, but for the items of its list under the page's footer, which move with the list.
- **The Builder can record a change that changes nothing.** While a topology is unsaved, the Builder saves a recovery draft 550 ms after each change, and the draft stamps the active layout profile with the time. A click inside the Builder whose history timer (0 ms) runs after that draft records the new time as “Update topology configuration”, on Build 234 as on Build 235 (section 4): Undo then has a step that changes nothing. Leaving the layout profiles' times out of the history's comparison (`builderHistorySignature`) would end it.

## What a pack doesn't hold

A pack holds a simulator's inputs, not the topology or the outcomes: each run works out the outcomes again on the topology of the moment, so a pack gives a different answer on a different topology, and an injected fault needs a component of its type. That is the point of carrying a pack to another topology; the library says so under each pack.

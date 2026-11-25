# Builder handoff: readiness score, login walkthrough and patterns

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 233.
**Applied:** as Build 234, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, while the builder was unavailable. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="readiness-login-patterns-v234">` (623 lines), after `fleet-ds-tools-v233`, containing [`docs/mockups/readiness-login-patterns-prototype.js`](mockups/readiness-login-patterns-prototype.js). It sets `window.readiness234`.
- `<style id="readiness-login-patterns-v234-styles">` (133 lines), after `fleet-ds-tools-v233-styles`.

**Three in-place edits:** the change register's three entries for these features, marked implemented. The edits, the block and the styles are also in [`docs/mockups/readiness-login-patterns.diff`](mockups/readiness-login-patterns.diff), a unified diff against Build 233's `index.html` with no context lines, so it applies with `git apply --unidiff-zero`.

**The request:**
- "Topology readiness score (High): scores how complete a topology is across event delivery, resilience, authentication, fleet management, ownership, monitoring and recovery."
- "Interactive login walkthrough (High): animates User → IdP/MFA → Splunk login → RBAC → session → audit for a chosen identity, including failure states."
- "Reusable component groups (Medium): saves patterns such as Syslog → UF → Indexer, or a regional Deployment Server tier, to reuse."

**How it was done:**
- Splunk's own pages were read for every rule the readiness checks and the walkthrough state (the sources below), on help.splunk.com.
- A real Splunk Enterprise 10.6.1.1 instance was run in Docker, with a test user whose role may search only `index=main` and has only the `search` capability. What the walkthrough says Splunk does was tried there: a sign-in, a wrong password, the lockout, the right password while locked, alternating wrong and right passwords, an index and a capability the role lacks, a session key Splunk doesn't hold, keys left idle past a one-minute session timeout, the `_audit` records of each, and the defaults `btool` reports (section 2).
- SAML, LDAP and Duo or RSA weren't tried: no identity provider or directory was available. What the walkthrough says of them is from Splunk's pages alone, and it says so.

**Sources** (Splunk documentation, help.splunk.com):
- [authentication.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/authentication.conf): `lockoutUsers`, `lockoutAttempts` (5), `lockoutThresholdMins` (5), `lockoutMins` (30), counted per search head cluster member; the SAML stanza's `idpSSOUrl`, `signAuthnRequest` (true by default), `signedAssertion` and `assertionTimeSkew` (120 s, with Splunk's warning that a high value allows replay); `[roleMap_SAML]`, `defaultRoleIfMissing`; `externalTwoFactorAuthVendor` and `failOpen` (false by default).
- [authorize.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/authorize.conf): each role's capabilities and `srchIndexesAllowed`.
- [web.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/web.conf): `tools.sessions.timeout` and `ui_inactivity_timeout`, 60 minutes. [server.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/server.conf): `sessionTimeout`, 1 hour.
- [Configure single sign-on with SAML, 10.4](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/use-saml-as-an-authentication-scheme-for-single-sign-on/configure-single-sign-on-with-saml): usernames in lowercase; Splunk and the browser must reach the provider.
- [Map groups on a SAML identity provider to Splunk roles, 10.4](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/use-saml-as-an-authentication-scheme-for-single-sign-on/map-groups-on-a-saml-identity-provider-to-splunk-roles): group mapping is the only way to give IdP users access; automapping of groups named like roles.
- [About multifactor authentication with Duo Security, 10.4](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/use-multi-factor-authentication-in-splunk-enterprise-as-an-authentication-scheme/about-multifactor-authentication-with-duo-security): Duo can't be used with SAML, nor in Splunk Cloud.
- [Auditing activities in a Splunk platform instance, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.6/audit-activity-in-splunk-enterprise/auditing-activities-in-a-splunk-platform-instance) and [Search the audit log, 10.4](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/audit-activity-in-splunk-enterprise/search-the-audit-log): `index="_audit" action=log* action="login attempt"`.
- [Search head cluster requirements, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/distributed-search/10.6/deploy-search-head-clustering/system-requirements-and-other-deployment-considerations-for-search-head-clusters): "For high availability search, you must deploy at least three members"; the deployer on an instance that isn't a member.
- [Search factor, 10.4](https://help.splunk.com/en/splunk-enterprise/administer/manage-indexers-and-indexer-clusters/10.4/how-indexer-clusters-work/search-factor): with a search factor of at least 2 the cluster keeps searching when a peer goes down. [Enable the indexer cluster manager node, 10.6](https://help.splunk.com/en/data-management/manage-splunk-enterprise-indexers/10.6/deploy-the-indexer-cluster/enable-the-indexer-cluster-manager-node): replication factor 3 and search factor 2 by default.
- [About the Monitoring Console](https://help.splunk.com/en/splunk-enterprise/administer/monitor/10.4/about-the-monitoring-console/about-the-monitoring-console) and [Which instance should host the console, 10.4](https://help.splunk.com/en/splunk-enterprise/administer/monitor/10.4/configure-the-monitoring-console/which-instance-should-host-the-console): not on a search head cluster member or a production search head.
- [Licenses and distributed deployments, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configure-splunk-licenses/licenses-and-distributed-deployments): every Splunk Enterprise instance but a forwarder that only forwards needs an Enterprise licence.
- [outputs.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/outputs.conf): `useACK`, the forwarder keeps each event until it is acknowledged. [inputs.conf, 10.6](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/inputs.conf): `persistentQueueSize`, none by default. [serverclass.conf, 10.4.2](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.2-configuration-file-reference/serverclass.conf).

**Mockup (the target):** [`docs/mockups/readiness-login-patterns-mockup.html`](mockups/readiness-login-patterns-mockup.html).
- 8 scenes have the block, its styles and the edits applied to Build 233.
- 3 "Today" scenes are Build 233.
- The screenshots are `docs/mockups/compare/readiness-login-patterns-*.png`.

## Where the three are

- **Readiness:** a card on the Builder Inspector's Topology tab, after Contents, with the score, its band and a bar for each area; "Review readiness" opens a Readiness tab in the tools drawer, after Rules. Validate › Readiness opens the same tab. On a phone, More › Tools lists it.
- **Login walkthrough:** Operate › Login walkthrough, after Event walkthrough. In the Builder, a User / Administrator's Access tab has "Walk through this sign-in", which opens it on that user's path.
- **Patterns:** Edit › Patterns… opens a Patterns tab in the tools drawer, after Templates. On a phone, More › Tools lists it.

## 1. Topology readiness score

**How it scores.** Each check is met (1), partly met (0.5), missing (0), or not in this topology (it doesn't count). An area's score is the average of its checks out of 100; the topology's is the average of the areas that have a check to score. 80 or more reads as Ready, 50 or more as Needs work, under that as Not ready. The Readiness tab says all of this beside the score, and calls it what it is: the explorer's checklist, read from the topology. Splunk gives no such score.

**The 26 checks.** Each one names the components it is about, says what to do when it isn't met, and names the Splunk page or the explorer view it rests on, where there is one.

| Check | Area | What it asks | What it rests on |
|---|---|---|---|
| ED-1 | Event delivery | Every source reaches an Indexer or S3 | Validate › Coverage: each component that sends events and has no event link into it |
| ED-2 | Event delivery | Event links that cross a security zone are encrypted | Operate › Security boundaries: the event links that cross a zone, and their encryption |
| ED-3 | Event delivery | Senders use a port their receiver listens on | Validate › Rules, AR-016 |
| ED-4 | Event delivery | Every relationship passes validation | Validate › Rules, AR-007 |
| RS-1 | Resilience | No single component stops the event path | Analyze › Statistics: the single points of failure, against the components that receive events |
| RS-2 | Resilience | Searching continues when an indexer fails | [Search factor](https://help.splunk.com/en/splunk-enterprise/administer/manage-indexers-and-indexer-clusters/10.4/how-indexer-clusters-work/search-factor): an indexer cluster with a search factor of 2 or more and as many peers as its replication factor; Splunk Cloud’s indexers count as met |
| RS-3 | Resilience | Search stays up when a search head fails | [Search head cluster requirements](https://help.splunk.com/en/splunk-enterprise/administer/distributed-search/10.6/deploy-search-head-clustering/system-requirements-and-other-deployment-considerations-for-search-head-clusters): three members or more; Splunk Cloud’s search tier counts as met |
| RS-4 | Resilience | Critical production sources have a redundant first hop | Validate › Rules, AR-004, for the components that send events |
| AU-1 | Authentication | People sign in through an identity provider | [Configure single sign-on with SAML](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/use-saml-as-an-authentication-scheme-for-single-sign-on/configure-single-sign-on-with-saml): every component people sign in to (search heads, search head clusters and members, Splunk Cloud’s search tier and Enterprise Security, a Monitoring Console, SOAR) has an Access link from an Authentication Provider |
| AU-2 | Authentication | Administrators use MFA | Validate › Rules, AR-005: MFA enforced or inherited on each User / Administrator’s Access link; missing when people sign in but no path is drawn |
| AU-3 | Authentication | Identity provider groups map to Splunk roles | [Map SAML groups to Splunk roles](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/use-saml-as-an-authentication-scheme-for-single-sign-on/map-groups-on-a-saml-identity-provider-to-splunk-roles): each provider-to-component link records its roles |
| AU-4 | Authentication | Sign-ins leave evidence that’s reviewed | [Search the audit log](https://help.splunk.com/en/splunk-enterprise/administer/manage-users-and-security/10.4/audit-activity-in-splunk-enterprise/search-the-audit-log): each Access link, or its provider, names its audit evidence |
| FM-1 | Fleet management | Every forwarder has a Deployment Server | Analyze › Statistics: an active Fleet link from a Deployment Server to each Universal or Heavy Forwarder |
| FM-2 | Fleet management | Deployment links name their server classes | [serverclass.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.4/configuration-file-reference/10.4.2-configuration-file-reference/serverclass.conf): each of those links names its server classes |
| FM-3 | Fleet management | Each cluster has its manager or deployer | [Search head cluster requirements](https://help.splunk.com/en/splunk-enterprise/administer/distributed-search/10.6/deploy-search-head-clustering/system-requirements-and-other-deployment-considerations-for-search-head-clusters) (a deployer) and the cluster manager: each indexer cluster has an Indexer Cluster Manager and each search head cluster a deployer |
| OW-1 | Ownership | A named owner is accountable for the service | Operate › Responsibility boundaries: an accountable owner named |
| OW-2 | Ownership | Every handoff has an owner who accepts it | Operate › Responsibility boundaries: its findings, against the handoffs between owners |
| OW-3 | Ownership | Every link has an owner | Validate › Review: each link’s owner |
| OW-4 | Ownership | Components carry their real name, environment and region | Validate › Review: each component’s name, environment and region |
| MO-1 | Monitoring | A Monitoring Console watches the deployment | [About the Monitoring Console](https://help.splunk.com/en/splunk-enterprise/administer/monitor/10.4/about-the-monitoring-console/about-the-monitoring-console): two Splunk Enterprise instances or more call for one |
| MO-2 | Monitoring | Splunk Enterprise instances reach a license manager | [Licenses and distributed deployments](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configure-splunk-licenses/licenses-and-distributed-deployments): two instances or more that need an Enterprise licence call for a License Manager |
| MO-3 | Monitoring | Load balancers check their members’ health | Validate › Rules, AR-014: each load balancer’s health check |
| RC-1 | Recovery | Forwarders keep events until the indexer has them | [outputs.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/outputs.conf) `useACK`: each forwarder that sends to an indexer |
| RC-2 | Recovery | Syslog lands on a buffer that survives a restart | [inputs.conf](https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.6/configuration-file-reference/10.6.0-configuration-file-reference/inputs.conf) `persistentQueueSize`: syslog lands on a Syslog Server that writes files, or a persistent input queue |
| RC-3 | Recovery | Every event link has a retry policy | Each event link’s retry policy, in its Inspector |
| RC-4 | Recovery | A second region can take over | Operate › Multi-region & DR: destinations in two regions or more |

**On the sample topology** (Syslog Source → Syslog Server → Universal Forwarder → Indexer): 46 / 100, Not ready (45.8 before rounding). 5 of the 7 areas are scored: Event delivery 88, Resilience 17, Fleet management 0, Ownership 50, Recovery 75. Authentication and Monitoring have nothing to check: the sample has no sign-in path and a single Splunk Enterprise instance. 8 checks are met, 2 partly, 6 missing and 10 not in this topology.

**After inserting three patterns** (Indexer cluster, Search Head Cluster and Sign-in path): 55 / 100, Needs work, with all 7 areas scored: Event delivery 88, Resilience 63, Authentication 63, Fleet management 50, Ownership 50, Monitoring 0, Recovery 75. Resilience rises from 17 to 63 (three search head cluster members; the cluster’s three peers, while Indexer 1 stays outside it). Authentication is scored: MFA and roles are met on the sign-in path, its audit evidence is missing, and the search head cluster has no identity provider. Monitoring is scored at 0: ten Splunk Enterprise instances, and neither a Monitoring Console nor a License Manager. The cluster manager, the clusters and the members have no event links of their own: Event delivery doesn’t count them as sources, and RS-4 names only Syslog Source 1.

**The tab.** The score, a row for each area (choose one to see only its checks), Every check or Only what's left to do, and each check with its status, what was found, To do, where it comes from and a Show button for each component it names (up to six), which closes the drawer and selects the component. Download JSON (`splunk-pipeline-explorer/topology-readiness`, version 1) and Download CSV (8 columns). The card and an open tab follow every change to the topology.

**The architecture report** gains a "Topology readiness" section after Validation: the score, a table of the areas, and what is left to do.

**Where:** block, `20-readiness` and `30-readiness-view`.

## 2. Interactive login walkthrough

**Which sign-ins.** The topology's sign-in paths on the User access plane: a User / Administrator with an Access link to an Authentication Provider, and the provider's Access link to a component; or a User / Administrator's Access link straight to a component, whose identity provider field, if filled, names the provider. The method comes from the links: SAML single sign-on, LDAP, or a Splunk account. With no path drawn, the page walks a sample and offers "Add this sign-in path to the topology", which inserts the Sign-in path pattern.

**The six steps, for each method:**

| Step | What it is | Configuration | Where it shows |
|---|---|---|---|
| 1 | Who signs in | The Access link: endpoint, access route and method | Nothing yet |
| 2 | **SAML:** Identity provider and MFA<br>**LDAP:** Directory and MFA<br>**Splunk account:** Password and MFA | **SAML:** authentication.conf, the SAML stanza: idpSSOUrl, entityId, signAuthnRequest<br>**LDAP:** authentication.conf: the LDAP strategy; externalTwoFactorAuthVendor for Duo or RSA<br>**Splunk account:** authentication.conf [splunk_auth]: lockoutUsers, lockoutAttempts, lockoutThresholdMins, lockoutMins | **SAML:** The provider’s own sign-in log<br>**LDAP:** splunkd.log on a failure<br>**Splunk account:** _audit on a failure |
| 3 | **SAML:** Splunk checks the assertion<br>**LDAP:** Splunk accepts the directory’s answer<br>**Splunk account:** Splunk opens the account | **SAML:** authentication.conf, the SAML stanza: signedAssertion, assertionTimeSkew<br>**LDAP:** authentication.conf: the LDAP strategy’s group settings<br>**Splunk account:** authentication.conf [splunk_auth] | **SAML:** splunkd.log (_internal) on a refusal<br>**LDAP:** —<br>**Splunk account:** — |
| 4 | Roles and what they allow | **SAML:** authentication.conf [roleMap_…]; authorize.conf: capabilities and srchIndexesAllowed<br>**LDAP:** authentication.conf [roleMap_…]; authorize.conf: capabilities and srchIndexesAllowed<br>**Splunk account:** authorize.conf: each role’s capabilities and srchIndexesAllowed | _audit: every capability check |
| 5 | Session | web.conf: tools.sessions.timeout, ui_inactivity_timeout; server.conf: sessionTimeout | — |
| 6 | Audit record | _audit; $SPLUNK_HOME/var/log/splunk/audit.log | _audit: the login attempt |

Each step names its configuration, where it shows, and the state after it, and links the Splunk pages it rests on. The strip above shows the path as drawn: the user, the provider (or "not drawn as a component" when only the link names it), the component with its roles, and `_audit`.

**What happens.** "What happens" lists the outcomes the path's method can have:

| What happens | For | Step | Seen on Splunk 10.6 |
|---|---|---|---|
| Signs in | SAML single sign-on, LDAP, a Splunk account | — |  |
| Wrong password | LDAP, a Splunk account | 2, stops | Yes |
| Locked out after five tries | a Splunk account | 2, stops | Yes |
| Second factor refused | SAML single sign-on, LDAP, a Splunk account | 2, stops |  |
| Duo or RSA unreachable | LDAP, a Splunk account | 2, stops |  |
| Identity provider unreachable | SAML single sign-on, LDAP | 2, stops |  |
| Assertion outside its time window | SAML single sign-on | 3, stops |  |
| No group maps to a role | SAML single sign-on, LDAP | 4, stops |  |
| Searches an index the roles don’t allow | SAML single sign-on, LDAP, a Splunk account | 4, signed in; refuses the action | Yes |
| Lacks a capability | SAML single sign-on, LDAP, a Splunk account | 4, signed in; refuses the action | Yes |
| Session expires | SAML single sign-on, LDAP, a Splunk account | 5, stops | Yes |

At the step where an outcome stops the sign-in (or, signed in, refuses an action), a box says what the person sees, what is recorded and the fix. The rest of the steps show as not reached.

**Play** steps through every 1.3 s and stops at a failure; Reset, Previous and Next, and each step's dot, move by hand. **Download walkthrough** gives the path, method, MFA, roles, outcome and steps as JSON (`splunk-pipeline-explorer/login-walkthrough`).

**The architecture report** gains a "Sign-in walkthrough" section after the event walkthrough: each path with its method, MFA, roles, session and audit evidence, and the `_audit` search.

**Where:** block, `40-login` and `50-login-view`.

## 3. Reusable component groups (Patterns)

**Built in:**

| Pattern | Components | Links | What it is |
|---|---|---|---|
| Syslog → UF → Indexer | Syslog Server, Universal Forwarder, Indexer | 2 event links | A Syslog Server that writes what it receives to files, a Universal Forwarder that reads them, and an Indexer. Insert it after a Syslog Source, or on its own. |
| Regional Deployment Server tier | 3 × Deployment Server | 2 Fleet links | A Tier 1 Deployment Server that manages two regional Deployment Servers, as the Multi-DS overview’s sample does. |
| Search Head Cluster | Search Head Cluster, 3 × Search Head Cluster Member, Search Head Cluster Deployer | cluster roles | Three members, the first its captain, and a deployer on an instance of its own: Splunk asks for at least three members for highly available search. |
| Indexer cluster | Indexer Cluster Manager, Indexer Cluster, 3 × Indexer | cluster roles | An Indexer Cluster Manager, the cluster at a replication factor of 3 and a search factor of 2 (Splunk’s defaults), and three peers. |
| Sign-in path | User / Administrator, Authentication Provider (cloud), Search Head | 2 Access links | A User / Administrator who signs in to a Search Head through a cloud identity provider with SAML, MFA enforced and the admin role mapped: Operate › Login walkthrough follows it. |

**Save the selection.** Select components on the canvas (Shift+click adds), name the pattern and Save pattern. A pattern keeps:
- each component's type and settings (pipeline sets, acknowledgement, persistent queue, environment, region, network zone and the rest), but not its id or a name the Builder generated;
- the links among the selected components: data flow, extra data links, Fleet and Access links, with their details;
- the cluster roles among them: a member's cluster, a cluster's manager, deployer and captain. A role that points outside the selection is dropped, so a member saved alone comes back in no cluster.

**Insert.** Each pattern has Insert. When the selected component can send to the pattern's first component, a second button, "Insert after" that component, hangs the pattern from it. The new components take the Builder's own names (Syslog Server 2, …) and are left selected; the whole insert is one change, which one Undo takes out. If the Builder refuses a component, nothing is added and the status line says why.

**Kept and shared.** Saved patterns stay in this browser (`localStorage`, `splunkPipelineExplorer.patterns234`); Delete removes one. Download saved patterns gives a file (`splunk-pipeline-explorer/component-patterns`); Load patterns from a file reads one back (5 MB at most), and says what was loaded or why not.

**Where:** block, `60-patterns` and `70-patterns-view`.

### Not covered

- **SAML, LDAP, Duo and RSA weren't run:** what the walkthrough says of them is Splunk's pages', and the page says which outcomes were seen on Splunk 10.6.
- **The readiness score is the explorer's checklist.** Its checks rest on Splunk's pages and the Builder's own rules, but the weights and bands are this design's.
- **Patterns live in one browser** until downloaded.
- **The walkthrough follows a path's settings;** it doesn't sign in anywhere.

## The edits

The lines are Build 233's.

1. **Line 1,792, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Interactive login walkthrough','Animate User → IdP/MFA → Splunk login → RBAC → session → audit for a selected identity and component, including failure states.',false,'High'],
new: ['Interactive login walkthrough','Animate User → IdP/MFA → Splunk login → RBAC → session → audit for a selected identity and component, including failure states.',true,'High'],
```
2. **Line 1,794, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Topology readiness score','Score completeness across event delivery, resilience, authentication, fleet management, ownership, monitoring and recovery.',false,'High'],
new: ['Topology readiness score','Score completeness across event delivery, resilience, authentication, fleet management, ownership, monitoring and recovery.',true,'High'],
```
3. **Line 1,797, in `changeRegister`, group “Proposed next features”.** Marked implemented.
```
old: ['Reusable component groups','Save and reuse patterns such as Syslog → UF → Indexer, regional Deployment Server tiers and Search Head Clusters.',false,'Medium'],
new: ['Reusable component groups','Save and reuse patterns such as Syslog → UF → Indexer, regional Deployment Server tiers and Search Head Clusters.',true,'Medium'],
```

## The new block

**`<script id="readiness-login-patterns-v234">`** goes right after `fleet-ds-tools-v233`'s `</script>` (line 19,230 of Build 233). It contains [`docs/mockups/readiness-login-patterns-prototype.js`](mockups/readiness-login-patterns-prototype.js), and uses the page's own functions.

It wraps these:
- `setDrawerFlags`, so the drawer shows the Readiness and Patterns tabs;
- `renderBuilder` and `selectBuilderObjectFast`, so the card, an open tab and the Access tab's button follow the topology;
- `renderOperations`, for the Login walkthrough page;
- `architectureReportMarkdown`, for the report's two sections;
- `builderHistoryHint`, so an insert is recorded once, under its own name.

It sets `window.readiness234`, which gives the models to the checks.

Its styles, **`<style id="readiness-login-patterns-v234-styles">`**, go right after `fleet-ds-tools-v233-styles`'s `</style>` (line 16,973).

## Build records

After the edits and the block, in a new `<script id="readiness-login-patterns-records-v234">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations":
  `['Readiness, sign-in walkthrough and patterns','The Builder scores how ready a topology is across seven areas and says what to do for each open check; Operate › Login walkthrough follows a sign-in from the person to the _audit record, with the ways it fails; and groups of components save as patterns, to insert in one step.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 233 did in its records, with Build 234 and 25 Nov 2026.

## Check before uploading

Run with Build 233 + the edits, the block and the styles, and with Build 233 for comparison.

### 1. The checks: 53. All pass with the edits

Each check opens the page as a person would and uses a feature as described above. On Build 233 the features aren't there: 1 passes (no page errors) and the rest fail or can't start.

- **Where the features are:** Validate › Readiness follows Rules, and Edit › Patterns… follows Connection template…; the Topology tools drawer has Readiness after Rules and Patterns after Templates; the Inspector’s Topology tab shows Readiness after Contents: 46 / 100, Not ready, and the seven areas.
- **Readiness on the sample:** the default topology’s 26 checks: 8 met, 2 partly, 6 missing, 10 not in this topology; each area is its checks’ average (met 1, partly 0.5) and the score the average of the five scored areas: 45.8, shown as 46; the checks name what they found: the unencrypted syslog crossing, the single points of failure, the unmanaged forwarder.
- **The Readiness tab:** Review readiness opens the drawer’s Readiness tab with the score and all 26 checks; choosing Resilience shows its four checks, and Only what’s left to do its three not met; the JSON download has the score, the seven areas and each check’s status and source; the CSV a row per check; a check’s Show button selects that component and closes the drawer.
- **Readiness follows the topology:** a Deployment Server for the forwarder meets FM-1, makes FM-2 count (no server classes), and the card follows; turning off the forwarder’s indexer acknowledgement makes RC-1 missing, naming the forwarder; an indexer cluster: RS-2 partly (Indexer 1 stays outside it), FM-3 met, and the Monitoring Console and License Manager checks now count; the cluster’s manager, the cluster and its peers aren’t taken for event sources: ED-1 stays met, and RS-4 names only Syslog Source 1; a search head cluster of three: RS-3 met, and the search tier now needs an identity provider (AU-1 missing); the sign-in path: MFA and roles met on its links, audit evidence missing, AU-1 partly (the cluster still has none); readiness on 18 components takes 1.8 ms (under 25 ms), read after a redraw rather than in it; the architecture report has Topology readiness after Validation: its table of seven areas and what’s left to do.
- **The Login walkthrough page:** Operate lists Login walkthrough right after Event walkthrough, and it opens the page; with no sign-in path drawn, a sample: Administrator → Cloud identity provider → Search Head, not in the topology; Add this sign-in path to the topology adds the Sign-in path pattern (3 components, 2 Access links) and walks it; six steps: who signs in, the provider and MFA, Splunk’s check of the assertion, roles, session and audit; Next, Previous, Reset and Play move through the steps; a SAML path offers eight outcomes, not the Splunk-account ones (wrong password, lockout); the steps carry Splunk’s defaults: a 120-second assertion skew, 60 minutes of web session, 1 hour of REST session, and the _audit search; the path shows the method and the roles its Access link maps: SAML single sign-on, Roles: admin; Assertion outside its time window stops at step 3, with the NTP fix and Splunk’s replay warning; Lacks a capability: signed in, step 4 refuses the action, the rest still run; Splunk 10.6’s 403 text and _audit line; Session expires stops at step 5 with the 401 Splunk 10.6 gave a key left idle past its timeout; Download walkthrough: the path, method, MFA, roles, the scenario and six steps with their sources.
- **Other sign-in methods:** a Splunk account offers the wrong password, lockout and an unreachable Duo or RSA, not the provider’s outcomes; Locked out stops at step 2 with what Splunk 10.6 showed: the same “Login failed”, “locked out user” in _audit, and splunkd.log’s line; an on-premises provider signs in with LDAP: nine outcomes, its directory unreachable among them; a SAML link straight to a component names its provider from the link, not drawn as a component; the report’s Sign-in walkthrough, after the event walkthrough, lists each path.
- **From the Builder:** a User / Administrator’s Access tab offers its walkthrough in text of 11 px or more, which opens on that user’s path; a user with no Access link has the button off, and is told to draw one.
- **Built-in patterns:** Edit › Patterns… opens the Patterns tab with five built-in patterns; Insert Search Head Cluster: the cluster, three members in it, the first its captain, a deployer; one history entry; all selected; one Undo takes the whole pattern out; Insert Indexer cluster: a manager, the cluster at RF 3 and SF 2 with that manager, three peers in it; Insert Regional Deployment Server tier: Tier 1 manages the two regional servers by Fleet links; with a Syslog Source selected, Insert after Syslog Source 1 hangs the chain from it.
- **Saved patterns:** Save asks for a name, then saves the three selected components with their two links; saved patterns stay in this browser after a reload; inserting it gives new components their own names and keeps their settings (the forwarder’s acknowledgement off); a saved member without its cluster comes back in no cluster, not joined to another; Download saved patterns gives a component-patterns file; Delete removes it, Load patterns brings it back from the file, and a file that isn’t JSON says so.
- **The register, text size, names, a phone and errors:** the change register lists the three as implemented; at 1440 px the new panels’ text is 11 px or more, every control named, no sideways page; at 390 px the new panels’ text is 11 px or more, every control named, no sideways page; no page errors.

### 2. Against Splunk 10.6.1.1

The test user `walkuser234`, with a role that may search only `index=main` and has only the `search` capability, signing in to Splunk's REST API:

| What was tried | What Splunk did | The walkthrough |
|---|---|---|
| The right password | 200 and a session key. `_audit`: `action=login attempt, info=succeeded reason=user-initiated … method=Splunk`, and a `login_attempt` event in `audittrailv2` | Step 6, for a Splunk account |
| A wrong password | 401 “Login failed”. `_audit`: `info=failed`; splunkd.log: “Login failed. Incorrect login for user: walkuser234” | Wrong password, step 2 |
| Five wrong passwords in a row | The fifth locks the account: splunkd.log “Max login attempts reached. Locking out user.” The right password then gets the same 401 “Login failed”; `_audit`: `action=login attempt locked out user, info=failed`; the user shows `locked-out` | Locked out after five tries, step 2 |
| A wrong and a right password in turn, 7 times | The right one signed in each time: the account never locked | Step 3: a successful login clears the failed attempts |
| A search of `index=_internal`, which the role doesn’t allow | 200, no results, and no message about the index (`index=main` gave its one event) | Searches an index the roles don’t allow: signed in, step 4 |
| Creating a user, which needs `edit_user` | 403 “You (user=walkuser234) do not have permission to perform this operation (requires capability: edit_user).” `_audit`: `action=edit_user, info=denied` | Lacks a capability: signed in, step 4 |
| A session key Splunk never gave out | 401 “call not properly authenticated” | — |
| With `sessionTimeout = 1m`: one key used again every 75 s | Still working at 75 and 150 s: each use counts as activity, and the timeout isn’t enforced to the second | — |
| With `sessionTimeout = 1m`: three keys, each left idle, then used once | 401 “call not properly authenticated” after 3, 6 and 10 minutes | Session expires, step 5 |
| `btool` | `tools.sessions.timeout = 60`, `ui_inactivity_timeout = 60` (web.conf); `sessionTimeout = 1h` (server.conf); `lockoutUsers = true`, `lockoutAttempts = 5`, `lockoutThresholdMins = 5`, `lockoutMins = 30` (authentication.conf) | Steps 2 and 5 |

### 3. The new UI, swept

The new UI's states (the Builder with the card; the Readiness tab, one area, a larger topology; the Patterns tab, with a saved pattern, and with a component selected to insert after; the Login walkthrough's sample, a path added, three failures; a user's Access tab), with the review's page check at four widths:

| In the 13 states | 1440 px | 1280 px | 1024 px | 390 px |
|---|---|---|---|---|
| Page or console errors | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 |
| Text under 10 px | 37 | 41 | 37 | 13 |
| Text under WCAG contrast | 48 | 32 | 18 | 4 |
| Text cut off in its box | 0 | 0 | 0 | 0 |
| Text over other text, anywhere on the page | 25 | 45 | 37 | 233 |
| Text over other text, both in the new UI | 0 | 0 | 0 | 0 |
| Tap targets under 24 px | — | — | — | 24 |

Nothing the check finds is the new UI’s, and its own text never overlaps (the last but one row). A second run of the same check listed every finding, with where it is, whether it is in the new UI and whether it is a disabled control (`why34.js`); its counts are the sweep’s, state by state:
- **Text under WCAG contrast:** every one is a disabled control: the Builder’s Undo and Redo, its alignment buttons when they can’t apply, and the walkthrough’s Reset and Previous at its first step, styled as the Event walkthrough’s are. WCAG doesn’t hold disabled controls to contrast.
- **Text under 10 px:** none is in the new UI: the Builder’s issue markers on the canvas, whose text is 0 px by design, and the Inspector’s labels on a user’s Access tab, as on Build 233.
- **Text over other text** (340 pairs over the four widths): 125 are canvas text under the drawer, which covers it; 120 are out of sight, text scrolled out of the box that holds it; 16 are rows of the Readiness tab scrolled under the drawer’s own title and tabs, which stay at its top; and 79 are between two of the page’s own parts, neither of them new: canvas text under the drawer’s tabs or the Inspector, text out of sight, and the Builder’s status line over the drawer’s title after the sweep’s inserts. Build 233 shows any status line over that title the same way when the drawer opens after it, at 1440 and 1280 px (`toast34.js`).
- **Tap targets under 24 px, at 390 px:** none is in the new UI: the Builder’s canvas controls, the Inspector’s handle and its snap box, and the page’s own.

Below 1440 px the Builder’s Inspector starts folded, so the run’s own sweep didn’t see the readiness card at 1280, 1024 and 390 px. The card’s state now opens View › Inspector first, as a person would, and was swept again at those widths; those are the figures counted here.

The two states Build 233 has too, a drawer tab open (Rules) and a user’s Access tab, give the same figures on both pages at every width (Build 233 / the new page):

| State | 1440 px | 1280 px | 1024 px | 390 px |
|---|---|---|---|---|
| Rules tab: text over text | 7 / 7 | 9 / 9 | 12 / 12 | 27 / 27 |
| Rules tab: under contrast | 4 / 4 | 4 / 4 | 2 / 2 | 0 / 0 |
| Access tab: text over text | 0 / 0 | 0 / 0 | 0 / 0 | 20 / 23 |
| Access tab: text under 10 px | 20 / 20 | 20 / 20 | 20 / 20 | 13 / 13 |
| Rules tab: tap targets under 24 px | 0 / 0 | 0 / 0 | 0 / 0 | 23 / 23 |

At 390 px the Access tab has its walkthrough box on the new page, and the check finds three more pairs there: its sentence, and the Make root button below it, against canvas text. Each pair meets out of sight, the canvas text scrolled out of the canvas and the box out of the Inspector’s sheet (`vis34.js`).

The review's sweep of every page, as Build 231's handoff ran it, on the 55 pages both builds have and on the new Login walkthrough page alone:

| At each width | 1440 px: Build 233 | 1440 px: new | 1440 px: Login walkthrough | 1024 px: Build 233 | 1024 px: new | 1024 px: Login walkthrough | 390 px: Build 233 | 390 px: new | 390 px: Login walkthrough |
|---|---|---|---|---|---|---|---|---|---|
| Page errors | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Text under WCAG contrast | 34 | 34 | 2 | 32 | 32 | 2 | 30 | 30 | 2 |
| Text under 10 px | 139 | 139 | 0 | 139 | 139 | 0 | 167 | 167 | 0 |
| Tap targets under 24 px | — | — | — | — | — | — | 108 | 108 | 0 |
| Ids used more than once | 576 | 576 | 12 | 576 | 576 | 12 | 576 | 576 | 12 |

The 55 pages give the same figures on both builds, page by page. The Login walkthrough page’s two contrast findings are its Reset and Previous buttons, disabled at the first step, as the Event walkthrough’s are (the same styles); its ids are the 12 duplicated elsewhere in the document, which every page reports.

Other sweeps:
- **Every control used once:** Build 233, 1,798 controls on 55 pages; the new page, 1,826 on 56. None leaves a page error on either. The sweep itself can’t click an SVG part with `click()`, or read the options of one list in the parsing laboratory (102 and 102). Controls with no effect it could see: 104 and 104.
- **Round the pages:** ten rounds on each page. Over rounds 2 to 10 the median is 39,027 DOM nodes on Build 233 and 38,379 on the new page, from 38,290 to 41,087 and from 38,377 to 38,679; the heap grows 0.39 MB and 0.37 MB a round after the first. Round 10 is at 39,059 and 38,378.
- **Cut off by a box that hides overflow:** at 390 px, 12 on Build 233 and 12 on the new page, all on the Builder canvas, which pans; at 1440 px, none on either.

### 4. Regression against Build 233

The same snapshots as Build 233’s regression, of Build 233 and the new page. What Build 234 means to change is set aside on both pages: the new controls are out of the page while the text is read (the Readiness card, the drawer’s Readiness and Patterns tabs and panels, Validate › Readiness, Edit › Patterns…, the phone’s two buttons for them, Operate’s Login walkthrough entry and a user’s walkthrough box); Operate’s pages are visited by name, the Login walkthrough apart; the change register’s three entries go back to Proposed next features with their priorities; and the Topology readiness and Sign-in walkthrough sections are left out of the architecture report, on the Operate page that shows it, in the downloaded report and in the evidence pack. Build 234’s own checks, in section 1, look at what it changes. Build 231’s and 232’s set-asides are kept.

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

Each comparison takes Build 233 twice, to set aside whatever varies from run to run: nothing did. 615 of the 617 snapshots are the same before any normalising.

**The earlier suites and tools**, on both pages:

| Suite or tool | Build 233 | Build 233 + the edits |
|---|---|---|
| Build 233’s 58 checks | 58 of 58 | 58 of 58 |
| Build 232’s 29 checks | 29 of 29 | 29 of 29 |
| Build 231’s 37 checks, with the register’s count as Build 234 leaves it | 36 of 37 † | 37 of 37 |
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
| The Builder’s redraws, 4 components: budget 40 ms § | 34 ms; 33 ms after a card moves | 40 ms; 32 ms after a card moves |
| The Builder’s redraws, 5 components: budget 50 ms § | 43 ms; 43 ms after a card moves | 41 ms; 45 ms after a card moves |
| The Builder’s redraws, 8 components: budget 80 ms § | 86 ms; 87 ms after a card moves | 94 ms; 77 ms after a card moves |
| The Builder’s redraws, 17 components, the reference topology: budget 120 ms § | 81 ms; 100 ms after a card moves | 78 ms; 93 ms after a card moves |
| The offline check, with the Fortinet add-on’s package | 23 of 23 | 23 of 23 |

**The Config view's results that Splunk checked** are the same on both pages: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

† Checks that want what a later build changed:
- **New with Build 234:** Build 231’s check 21, as Build 233’s handoff changed it, wants 9 changes proposed in the change register. Build 234 implements three of them, leaving 6; this run wants 6, so the check fails on Build 233, which has 9, and all 37 pass on the new page.
- **As before:** three of Build 224’s checks want what Build 225 changed; eight of the lookup checks, as first written, want what Build 226 changed; one of Build 222’s wants a folder’s macros.conf counted among the skipped files; one of the Config view handoff’s wants Where it acts right above the file tabs.

‡ These two have a 2.5-second page-load limit. They finished as written on both pages, and gave the same results with only that limit raised to 15 seconds.

§ `tools/builder-perf-check.js`, five runs on each page in turn after the other checks: the medians of its redraw after a change, and after a card moves. Over its budget: 8 components, on both pages. Build 234 reads the readiness card and an open tab after a redraw, not in it (section 1 times it). As in Build 233’s handoff, these medians move from run to run on both pages.

### 5. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 233 | With the edits |
|---|---|---|
| Loading the page (to the load event) | 1,803.5 ms (1,709.9 to 2,012.3) | 1,811.8 ms (1,636.5 to 1,924.5) |
| The ten views, each to its next frame (all ten) | 2,550.4 ms (2,374.5 to 2,847.3) | 2,512.1 ms (2,298.3 to 2,774.9) |
| The 28 OV pages, each to its next frame (all) | 2,852.8 ms (2,533.2 to 3,343.5) | 2,875.6 ms (2,647.9 to 3,131.7) |
| Builder redraw, its own topology | 43.5 ms (40.2 to 58.8) | 45.3 ms (41.8 to 51.5) |
| Drawing the change register | 32.4 ms (29.4 to 46.3) | 34.3 ms (28.6 to 45.2) |
| Restyling and laying out the page, on Changes | 28.4 ms (25.0 to 41.2) | 28.9 ms (25.4 to 37.2) |

Each figure with the edits is within Build 233’s spread, and Build 233’s within theirs.

### 6. The build

`index.html` as committed, Build 234, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text and change register name the build, with no page errors: 9 of 9 pass.
- The new checks pass on Build 234 as on the tested page: 53 of 53.

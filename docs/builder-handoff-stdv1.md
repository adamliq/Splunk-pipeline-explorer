# Builder handoff: add StdV-1 (Standards Profile)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** the build that adds SV-1, SV-2 and SV-6 ([`builder-handoff-sv1-sv2-sv6.md`](builder-handoff-sv1-sv2-sv6.md)). StdV-1 reads its interfaces and systems from `builderSystemModel1xx()`. Add one block, `<script id="builder-stdv1-v1xx">`, with wrappers only.

StdV-1 doesn't need AV-1 and AV-2 ([`builder-handoff-av1-av2.md`](builder-handoff-av1-av2.md)), and they don't need it. When both exist, AV-1 lists StdV-1 with its issues, and AV-2 adds the standards terms. Neither handoff needs a change for that.

**Mockup (the target):** [`docs/mockups/architecture-stdv1-mockup.html`](mockups/architecture-stdv1-mockup.html), screenshot `docs/mockups/compare/stdv1-mockup.png`.

The mockup has two examples: the reference topology (`docs/mockups/ov1-reference-topology.json`) and the default topology. Their data was exported from Build 187 with the SV prototype and the rules below, so the numbers are the expected ones. It replaces the earlier StdV-1 mockup, whose rows were fixed text.

## What the view is

In DoDAF V2.0, the Standards viewpoint lists the technical standards, vendor specifications and policies the architecture follows. For each one, **StdV-1 · Standards Profile** shows:
- what it requires;
- where it applies: the SV-1 interfaces or the systems it governs;
- its place in the standards lifecycle: Mandated, Preferred or Retire;
- whether the topology complies, with the evidence.

Rows and compliance are generated from what each link already records: protocol, port, TLS, acknowledgement and authentication. A row appears only when something in the topology falls under it.

Some standards can't be assessed from the topology, such as time sources and message formats. Those rows read **Not recorded**, and an owner can record an assessment for them. That assessment is the view's only saved data.

## Where it goes

Follow the SV-1, SV-2 and SV-6 pattern.

| Step | StdV-1 |
|---|---|
| Section key | `stdv1` |
| Tab | "StdV-1 · Standards", after "SV-6 · Flow matrix" |
| Active key | Add `stdv1` to `builderOvShow135`, keeping every existing key |
| Save / load | `doc.standardsProfile` ↔ `state.builderStdv1` (section 2) |
| Pack | After SV-6, read-only (3.6), with the table of contents updated |
| Pack checkbox | "StdV-1 standards", after "SV-6 flow matrix" |
| `packSections` key | `stdv1`, default `true` |

**Page furniture,** as on the SV pages:
- banners;
- the title block from `builderOv3Furniture139`:
  - Viewpoint "Standards · DoDAF V2.0", in the form SvcV-4 uses;
  - "Standards owner" from `state.builderCv1.owner` (until a standards owner field exists), or Not set;
- the purpose line (take the text from the mockup);
- the compliance tiles, which take the place of the summary figures;
- findings;
- the footer, which has two parts:
  - left: "<architecture> · Standards owner <name> · Compliance assessed from the Builder topology", or "Standards owner not set";
  - right: `StdV-1 · 1 of 1 · Build <n>`.

**Colours:** use the OV theme tokens, as SV-6 does.

| Status | Label | Colour |
|---|---|---|
| `met` | Compliant | `--ok` |
| `partial` | Partial | `--review` |
| `not` | Not met | `--stop` |
| `inuse` | In use: retire | `--review` |
| `unknown` | Not recorded | `--muted` on `--zone` |
| `planned` | Planned | `--sel` |

Lifecycle chips:
- **Mandated:** `--ink-2` border, `--ink` text.
- **Preferred:** `--rule` border, `--ink-2` text.
- **Retire:** `--stop` border and text.

The page never scrolls sideways; the table scrolls inside its own box.

## 1. The profile: `window.builderStandardsProfile1xx()`

Returns the rows in ID order:

```js
{ id, category, name, reference, body, lifecycle, applies, generated, status, owner, requires, evidence, see }
```

| Field | Meaning |
|---|---|
| `applies` | SI IDs, system names, or the fixed text "All systems", "All network interfaces" or "Whole architecture" |
| `generated` | The status from the rules in 1.3 |
| `status` | `generated`, or the owner's status when section 2 applies |
| `owner` | The owner's `{status, note}` when it is used, else `null` |
| `see` | View keys, shown as view chips |

Once the SV model is cached, the rows are cheap to build. Build them on each call, then apply the owner assessments.

### 1.1 Interface tests

The tests run on `builderSystemModel1xx().interfaces` (SV handoff 1.2). `label(x)` means the link's label and its protocol, joined with a space.

| Test | Passes when |
|---|---|
| Network | `source` is `declared` and the interface isn't local |
| TLS | `tls` is "Required" |
| Syslog | `label(x)` matches `/syslog\|TCP\/TLS or UDP\|^UDP$\|^TCP\/TLS$/i`, or the from system is a `syslogSource` on the event data plane |
| UDP | `label(x)` contains "UDP" |
| S2S | `label(x)` matches `/splunk-to-splunk\|S2S\|9997/i` |
| HEC | `label(x)` contains "HEC" |
| Management | The plane is management, or `label(x)` matches `/search dispatch\|splunk cloud search\|8089\|REST \(management\)/i` |

**Sign-in kind** applies to the authentication plane only.
1. Find the identity provider at either end (`isAuthProviderType`). Read its `providerProtocol`, falling back to `defaultAuthProviderProperties(type).providerProtocol`.
2. With no provider at either end, read the relation's `method`, `details.authenticationType` and `label(x)` instead.
3. Map the text:
   - LDAP → `ldap`;
   - OpenID or OIDC → `oidc`;
   - SAML → `saml`;
   - anything else, such as "Local directory" → none.

**MFA confirmed** follows Build 152's threat rule. It holds when either:
- `builderThreatMfa152(relation)` is true;
- the relation's `mfa` is "inherited" and the identity provider at either end has `providerMfa` "enforced".

**Verdict** of a list against a test:
- Compliant when every item passes;
- Partial when some do;
- Not met when none do.

**Wording:**
- Join IDs with ", ".
- Join system names as a list ("A, B and C").
- Make each verb agree with its count: requires/require, sends/send, allows/allow, is/are, isn't/aren't, has/have.

### 1.2 Catalogue

These columns are fixed.

| ID | Category | Standard | Reference | Body | Lifecycle | Requires | See |
|---|---|---|---|---|---|---|---|
| STD-01 | Transport and security | Transport Layer Security 1.2 and 1.3 | RFC 5246 · RFC 8446 | IETF | Mandated | Every network interface requires TLS 1.2 or later. | sv1, sv6 |
| STD-02 | Transport and security | X.509 certificates and path validation | RFC 5280 | IETF | Mandated | Clients verify the server certificate chain and name on every TLS interface. | sv6 |
| STD-03 | Transport and security | Syslog over TLS | RFC 5425 (TCP 6514) | IETF | Preferred | Syslog that carries personal information uses TCP with TLS. | sv1, sv2, sv6 |
| STD-04 | Transport and security | Syslog over UDP | RFC 5426 (UDP 514) | IETF | Retire | Retire for personal information. Keep only for devices that can't send TCP. | sv1, sv6 |
| STD-05 | Data formats | The Syslog Protocol, replacing BSD syslog | RFC 5424 (replaces RFC 3164) | IETF | Preferred | Structured headers with a full timestamp, year and offset. | svcv6 |
| STD-06 | Splunk platform | Splunk-to-Splunk forwarding | Splunk Enterprise forwarding (S2S) | Splunk | Mandated | Forwarders send to indexers over S2S with TLS and indexer acknowledgement. | sv1, sv6, svcv6 |
| STD-07 | Splunk platform | HTTP Event Collector | Splunk HEC (/services/collector) over HTTPS | Splunk | Mandated | Each source sends with its own token over TLS. | sv1, sv6 |
| STD-08 | Splunk platform | Splunk management port (splunkd REST) | HTTPS on 8089 | Splunk | Mandated | Deployment, search and management traffic uses splunkd over TLS. | sv1, sv2 |
| STD-09 | Identity and access | Security Assertion Markup Language | SAML 2.0 | OASIS | Mandated | Sign-in assertions are signed and sent over TLS. | sv1, sv6 |
| STD-10 | Identity and access | OpenID Connect | OpenID Connect Core 1.0 | OpenID Foundation | Mandated | Sign-in assertions are signed and sent over TLS. | sv1, sv6 |
| STD-11 | Identity and access | LDAP over TLS | RFC 4511 · RFC 4513 (LDAPS 636) | IETF | Mandated | Directory binds use TLS. | sv1, sv6 |
| STD-12 | Identity and access | Multi-factor authentication for privileged users | ISM · Essential Eight multi-factor authentication | ASD | Mandated | Every administrative sign-in uses MFA. | sv6 |
| STD-13 | Data formats | Windows Event Log XML | Microsoft event schema (renderXml) | Microsoft | Preferred | Windows events are collected as XML for full fidelity. | sv1 |
| STD-14 | Detection content | Splunk Common Information Model | CIM 6.x | Splunk | Mandated | Sourcetypes map to CIM data models so detections work across vendors. | cv2 |
| STD-15 | Detection content | MITRE ATT&CK for Enterprise | Current release | MITRE | Preferred | Every correlation search names the techniques it detects. | cv2 |
| STD-16 | Operations | Network Time Protocol | RFC 5905 | IETF | Mandated | Every system synchronises to the same time source. | (none) |
| STD-17 | Policy | ISM · Guidelines for System Monitoring | Event logging and monitoring | ASD | Mandated | Security-relevant events are logged centrally, protected and kept. | sv1, svcv6 |
| STD-18 | Policy | ISM · Guidelines for Cryptography (in transit) | Approved protocols for data in transit | ASD | Mandated | Data in transit uses approved protocols: TLS 1.2 or later. | sv6 |
| STD-19 | Policy | Privacy Act 1988 · APP 11 security of personal information | Australian Privacy Principles | OAIC | Mandated | Personal information is protected from misuse and destroyed when no longer needed. | sv6, div1 |

Categories show in this order: Transport and security, Data formats, Splunk platform, Identity and access, Detection content, Operations, Policy. STD-13 sits under Data formats, after STD-05.

### 1.3 Rows and compliance

Leave a row out when its "shown when" condition is false.

**Transport and security**

| ID | Shown when | Applies to | Compliance | Evidence |
|---|---|---|---|---|
| STD-01 | There are network interfaces (N) | N | Verdict of N on TLS | All pass: "All n network interfaces require TLS." (one: "SI-x requires TLS."). Otherwise: "x of n network interfaces require(s) TLS. Not: <IDs>." |
| STD-02 | Some of N pass TLS (T) | T | Compliant when every one of T has `details.authenticationType` containing "Mutual TLS". Otherwise Not recorded | Compliant: "Every TLS interface uses mutual TLS certificates." Otherwise: "Certificate verification isn't recorded on n TLS interface(s). Set Authentication to Mutual TLS certificate where clients present one." |
| STD-03 | There are network syslog interfaces (Y) | Y | Verdict of Y on TLS | Compliant: "Every syslog interface requires TLS." Otherwise: "<IDs without TLS> send(s) syslog without TLS." |
| STD-04 | Some of Y pass UDP (U) | U | In use: retire | "<IDs> still allow(s) UDP." |

**Data formats**

| ID | Shown when | Applies to | Compliance | Evidence |
|---|---|---|---|---|
| STD-05 | Y exists | Y | Not recorded | "The topology doesn't record the message format each device sends." |
| STD-13 | There are `windowsEvent` systems (W) | Their names | Compliant when every one of W has an interface, Partial when some do, Not met when none do | Compliant: "Every Windows Event Log source is collected, and the generated inputs.conf sets renderXml = true." Otherwise: "<names> isn't/aren't collected." |

**Splunk platform**

| ID | Shown when | Applies to | Compliance | Evidence |
|---|---|---|---|---|
| STD-06 | There are S2S interfaces that are declared (D) or missing (M) | D and M | Not met when no item of D passes TLS, including when D is empty. Partial when any of D lacks TLS, M isn't empty, or any of D lacks indexer acknowledgement (its `details.acknowledgement` doesn't contain "Indexer acknowledgement"). Otherwise Compliant | These sentences, in this order, leaving out the empty ones: "<D> require(s) TLS." when all of D pass TLS; "No TLS on <IDs>."; "Indexer acknowledgement isn't recorded on <IDs>."; "<M> is/are missing." |
| STD-07 | There are declared HEC interfaces (H) | H | Not met when none of H passes TLS. Partial when some lack TLS, or any lacks `details.authenticationType` "HEC token". Otherwise Compliant | "No TLS on <IDs>." or "<H> require(s) TLS.", then "HEC token authentication isn't recorded on <IDs>." when it applies |
| STD-08 | There are network management interfaces (G) | G | Not met when none of G passes TLS. Partial when some lack TLS, or any has no port. Otherwise Compliant | "No TLS on <IDs>." or "<G> require(s) TLS.", then "No port on <IDs>." when it applies |

**Identity and access**

| ID | Shown when | Applies to | Compliance | Evidence |
|---|---|---|---|---|
| STD-09, STD-10, STD-11 | There are declared authentication interfaces of sign-in kind `saml`, `oidc` or `ldap` (A) | A | Verdict of A on TLS | All pass: "<A> require(s) TLS." Otherwise: "No TLS on <IDs>." |
| STD-12 | There are declared authentication interfaces from an `authUser` (P) | P | Compliant when MFA is confirmed on every one of P. Not met when any has `mfa` "not-enforced". Otherwise Not recorded | Compliant: "MFA is enforced on every administrative sign-in." Not met: "MFA isn't enforced on <IDs> (rule AR-005)." Not recorded: "MFA isn't confirmed on <IDs> (rule AR-005)." |

**Detection content.** Both rows depend on a CV-2 part, `builderCapabilityPartStatus171(id).status`. The part name comes from `builderCapabilities170`.

| ID | Shown when | Applies to | Compliance | Evidence |
|---|---|---|---|---|
| STD-14 | A search system exists (SV-1 column 3) | "C4.2", then the search systems' names | From C4.2: In topology → Not recorded; Partial → Partial; Planned → Planned | "CV-2 C4.2 <name> is in the topology / is partial / is planned." When it is in the topology, add "Whether sourcetypes map to the CIM needs owner evidence." |
| STD-15 | As STD-14 | "C5.1", then the search systems' names | From C5.1, mapped the same way | "CV-2 C5.1 <name> …", the same way. When it is in the topology, add "Whether each correlation search names its ATT&CK techniques needs owner evidence." |

"In topology" means the capability exists, not that the standard is followed. CV-2 itself says CIM compliance needs owner evidence. So the topology never makes STD-14 or STD-15 Compliant; only an owner assessment can (section 2).

**Operations and policy.** These rows are shown whenever the topology has any system.

| ID | Shown when | Applies to | Compliance | Evidence |
|---|---|---|---|---|
| STD-16 | Always | "All systems" | Not recorded | "The topology doesn't record time sources." |
| STD-17 | Always | "Whole architecture" | Partial when there are missing interfaces, or uncollected sources. Otherwise Compliant | An uncollected source is a system with no interface whose `componentSecurityZone[type]` is `source`, `aws` or `azure`. Evidence: "<names> isn't/aren't collected." then "<forwarders of the missing interfaces> has/have no output to an indexer." Compliant: "Every source reaches an indexer." |
| STD-18 | Always | "All network interfaces" | STD-01's status, or Not recorded with no STD-01 | STD-01's evidence, or "No network interfaces." |
| STD-19 | The classification contains "PII" | "Whole architecture" | Partial when network interfaces on the event data plane lack TLS. Otherwise Not recorded | "PII crosses the network in clear on <IDs>. Storage and destruction aren't assessed from the topology." or "Transit is protected. Storage and destruction aren't assessed from the topology." |

The classification is `state.securityClassification`, which defaults to "Security telemetry".

## 2. Owner assessment

```js
state.builderStdv1 = { rows: { 'STD-16': { status: 'met', note: 'chrony on every host' } } }
```

**Which rows:** only rows whose `generated` status is `unknown`. An entry for any other row is kept, but it isn't used while that row's generated status isn't `unknown`. If a later change makes the row Not recorded again, the entry applies again.

**`builderStdv1Clean1xx(raw)`:**
- keys must match `STD-\d\d`;
- `status` must be `met`, `partial` or `not`, otherwise the entry is dropped;
- `note` is trimmed and cut to 160 characters;
- keep at most 30 entries.

**On screen:** the detail panel of an assessable row ends with an "Owner assessment" box.
- **Status** select: Not recorded, Compliant, Partial, Not met. Not recorded removes the entry.
- **Evidence** input: up to 160 characters, placeholder "For example: chrony on every host".
- A change saves at once and re-renders.

**Where it shows:**
- An assessed row shows its owner status with a small "owner" mark after the chip.
- Its evidence reads the note, or "Assessed by the owner." when the note is empty.
- Tiles, findings and AV-1 count the owner status.

**Save and load:** wrap `topologyDocument` and `loadTopologyDocument` for `standardsProfile`, as CV-1 does. An older file opens with no entries, and junk loads cleaned. Clear (with no components left) resets it.

## 3. Page

### 3.1 Compliance tiles

- One tile per status present, in the order Compliant, Partial, Not met, In use: retire, Not recorded, Planned.
- Each tile shows the count and the label, with a left border in the status colour.
- A tile is a toggle (`aria-pressed`) that filters the table to its status. Clicking it again clears the filter.

### 3.2 Category chips

- "All", then each category present, in catalogue order.
- One category is selected at a time.
- The chips combine with the tile filter.

### 3.3 Table

**Columns:**
- **ID** (mono);
- **Standard:** the name in bold, with the reference in mono beneath;
- **Body;**
- **Lifecycle** chip;
- **Applies to:** chips for up to six items, then "+n". Each SI chip has a title "<from> → <to> · <protocol>";
- **Compliance** chip, plus the "owner" mark.

**Layout:**
- Group the rows under a category heading row that spans every column.
- Rows are focusable. Click, Enter or Space selects a row, and selecting it again clears the selection.
- With no rows left after filtering, show "No standards match these filters."

### 3.4 Detail panel

**Nothing selected:**
- "Compliance gaps";
- "n not met, m partial";
- the Not met, Partial and In use rows, each with its ID chip in its status colour and its name;
- the hint "n rows can't be assessed from the topology. Select a standard for what it requires and the evidence. Esc clears."

**A row selected:**
- the overline "<category> · <body> · <lifecycle>";
- "<ID> · <name>";
- the reference, in mono;
- **Requires;**
- **Applies to:** every item, as chips;
- **Compliance:** the chip and the evidence;
- **See:** view chips. A chip opens its tab with `builderOvShow135(key)`, as AV-1's chips do;
- then the owner assessment box (section 2) when the row qualifies.

Esc clears the selection.

### 3.5 Findings ("What the profile shows")

One line each, in this order, leaving out lines that don't apply.

1. **Syslog** (stop chip), when STD-03 is present and not Compliant:
   - "**Syslog is the weakest point against the profile.**";
   - STD-03's evidence;
   - STD-04's evidence, when present;
   - "Moving those devices to RFC 5424 over TLS on 6514 closes <the rows of STD-03, STD-04 and STD-05 present and not Compliant> together."
2. **Not met** (stop): every Not met row except STD-03, each as "**<ID> <name>:** <evidence>".
3. **Partial** (review): "**<IDs> is/are partly met.**", then the evidence of the first three Partial rows outside Policy.
4. **Not recorded** (neutral):
   - "**<ID> <name>; …> can't be assessed from the topology.**";
   - then "Record <mutual TLS certificates and/or MFA, for STD-02 and STD-12 when they are Not recorded> on the links, or record an owner assessment here.", or "Record an owner assessment here." when neither applies.
5. **Compliant** (ok): "**<ID> <name>; …**".

### 3.6 Pack and print

- One read-only page, with no tiles, chips, detail panel or assessment box.
- Under each compliance chip, show its evidence in small text: the owner's note for an assessed row, with "(owner)" after the chip.
- "Applies to" lists every item.
- Show the findings.
- View chips print as plain text.
- Refresh the print copy on `beforeprint`.

## 4. Registration

As SV-1, SV-2 and SV-6 do:
- wrap `builderOvSections135`, `builderOvShow135` and `builderOvRender135` to add the tab after SV-6;
- wrap `builderV125PackPages125` to place the page after SV-6, and rebuild the cover's table of contents;
- wrap `ensurePresentationOverlay` for the pack checkbox;
- wrap `topologyDocument` and `loadTopologyDocument` for `standardsProfile` and the pack switch.

**Records:**
- a `changeRegister` entry: "Adds StdV-1 Standards Profile, generated from the protocol, port, TLS and authentication on each link, with owner assessment for standards the topology can't assess";
- the build stamp.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Every other tab and pack page is unchanged, apart from page numbers and the table of contents moving.
2. **Reference topology:** 17 rows. Tiles: 1 Compliant, 7 Partial, 2 Not met, 1 In use: retire, 5 Not recorded, 1 Planned.
   - **Status of each row:**

     | Status | Rows |
     |---|---|
     | Partial | STD-01, 06, 07, 08, 17, 18, 19 |
     | Not recorded | STD-02, 05, 12, 14, 16 |
     | Not met | STD-03, 13 |
     | In use: retire | STD-04 |
     | Compliant | STD-09 |
     | Planned | STD-15 |

   - **Evidence:**
     - STD-01: "8 of 10 network interfaces require TLS. Not: SI-1, SI-5."
     - STD-03: "SI-1, SI-5 send syslog without TLS."
     - STD-06: "SI-3 requires TLS. Indexer acknowledgement isn't recorded on SI-3. SI-13, SI-14 are missing."
     - STD-08: "SI-4, SI-8, SI-9, SI-10 require TLS. No port on SI-4."
     - STD-09: "SI-11, SI-12 require TLS."
     - STD-12: "MFA isn't confirmed on SI-11 (rule AR-005)."
     - STD-13: "Windows Event Log 1 isn't collected."
     - STD-14: "CV-2 C4.2 Normalised data (CIM) is in the topology. Whether sourcetypes map to the CIM needs owner evidence."
     - STD-15: "CV-2 C5.1 Correlation detections is planned."
     - STD-17: "Windows Event Log 1 isn't collected. Universal Forwarder 2 and Heavy Forwarder 1 have no output to an indexer."
   - **Not shown:** STD-10 and STD-11, because the provider uses SAML.
3. **Default topology:** 10 rows. Tiles: 1 Compliant (STD-17, "Every source reaches an indexer."), 4 Partial (STD-01, 06, 18, 19), 1 Not met (STD-03), 1 In use: retire (STD-04), 3 Not recorded (STD-02, 05, 16).
   - STD-01 reads "1 of 2 network interfaces requires TLS. Not: SI-1."
4. **Zones topology** (`docs/mockups/sv-zones-topology.json`): 17 rows, with STD-08 Compliant ("SI-5, SI-12, SI-13, SI-14 require TLS.") and STD-01 "9 of 13 network interfaces require TLS. Not: SI-1, SI-2, SI-6, SI-9."
5. **Edits:**

   Each edit starts from the reference topology.

   | Edit | Result |
   |---|---|
   | Set TLS Required on SI-1 and SI-5 | STD-01, STD-03 and STD-18 become Compliant ("All 10 network interfaces require TLS."). STD-19 becomes Not recorded ("Transit is protected. …"). STD-04 stays, because the protocol still allows UDP |
   | Set Authentication "HEC token" on SI-7 | STD-07 becomes Compliant |
   | Set the port on SI-4 | STD-08 becomes Compliant |
   | Set Acknowledgement "Indexer acknowledgement" on SI-3 | STD-06 reads "SI-3 requires TLS. SI-13, SI-14 are missing.", still Partial |
   | Set MFA "enforced" on SI-11 | STD-12 becomes Compliant |
   | Set MFA "not-enforced" on SI-11 | STD-12 becomes Not met: "MFA isn't enforced on SI-11 (rule AR-005)." |
   | Set the provider's protocol to LDAP | STD-11 replaces STD-09 |
   | Connect Heavy Forwarder 1 to Indexer 1 | The new link becomes SI-8, and later IDs move up by one. STD-06 reads "SI-3, SI-8 require TLS. Indexer acknowledgement isn't recorded on SI-3, SI-8. SI-14 is missing." STD-17 names Universal Forwarder 2 only |

6. **Owner assessment:**
   - Setting STD-16 to Compliant with a note gives tiles 2 Compliant, 4 Not recorded, and the row shows "owner".
   - STD-01 offers no assessment box.
   - The assessment round-trips through save, reload and import.
   - An older file opens with none.
7. **Pack and print:**
   - StdV-1 follows SV-6.
   - The evidence shows under each chip.
   - Chips print as text.
8. **Layout:** no page-level sideways scroll at 400px or 768px. Dark and light are both readable.

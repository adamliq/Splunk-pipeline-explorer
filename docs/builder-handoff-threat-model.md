# Builder handoff: threat model page (DFD + trust boundaries + STRIDE)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** `main` at `e81ca6b` (Build 146). Use the next free block number (shared hosts and Splunk Cloud indexing may take v147 and v148, so `builder-threat-model-v149` or later).
**Mockup:** `docs/mockups/architecture-threat-model-mockup.html` (click elements, flows and table rows; use the STRIDE chips). Screenshots: `docs/mockups/compare/threat-model-light.png` (the whole page) and `threat-model-dark-focus.png` (dark theme with the Deployment Server selected).
**Depends on:** nothing new, but it works best with `builder-handoff-splunk-cloud-indexing.md` (the Splunk-managed boundary) and `builder-handoff-shared-hosts.md` (host-level stores).

## What it is

A new architecture-pack page, **TM-1 · Data flow diagram and trust boundaries**. It is also a fourth tab in the OV workspace ("TM · Threat model"). It redraws the Builder topology in threat-modelling notation:
- the diagram marks every place a flow crosses a trust boundary;
- a crossing register lists each crossing with its protocol, authentication and encryption;
- a STRIDE threat register lists threats per element and flow, with the control, risk, status and owner.

It's generated from the model, with a small saved register for status, owner and notes.

Build 146 has nothing like it. The only related data is:
- `componentSecurityZone` (source / customer / aws / azure / splunk / storage);
- the group-container type **Trust zone** (in `builderGroupTypes`);
- relationship details (protocol, TLS, authentication type and requirement, acknowledgement);
- `responsibilityParties`, including "Splunk Cloud provider".

---

## 1. Page content (in order)

As in the mockup:
1. **Banners and title block.** The banners show the classification on the left and "Threat model · TM-1" on the right. The title block has five cells: "TM-1 · Data flow diagram and trust boundaries", Architecture, **Method** ("DFD + STRIDE per element"), **Threat owner** (a new pack option, "Not set" chip when empty), and Build · prepared. Reuse the OV-1 title-block component.
2. **Purpose callout** (with a boundary-red left rule): "Shows where telemetry crosses a trust boundary and what could go wrong there…"
3. **Summary line:** counts of trust boundaries, boundary crossings, threats, then open (in red), mitigated, accepted and "transferred to Splunk".
4. **STRIDE chips:** S, T, R, I, D, E, each with its full name and an **open-threat count**. They filter the threat register on screen; clicking one chip when all are on shows only that category.
5. **The DFD** (item 2).
6. **Legend:** external entity, process, data store, the three flow styles (event data, management, authentication), trust boundary (dashed; dotted for provider-managed), and boundary crossing (hollow diamond, or filled when an open threat is on that flow).
7. **Hint:** "Select an element, a flow or a table row to highlight it and its threats. Esc clears." (on screen only).
8. **Boundary crossings table** (item 3).
9. **Threat register** (item 4).
10. **Footer:** "Page n of N · TM-1".

## 2. The diagram

**Notation (standard DFD):**

| Model | DFD shape | Rule |
|---|---|---|
| Source systems, people, identity providers, cloud services outside the estate (for example CloudTrail) | **External entity**: a rectangle with square corners, ID `E<n>` | component types with security zone `source`, plus `authUser`, `authProvider*` |
| Forwarders, relays, HF, HEC endpoint, Lambda / Azure Function, Deployment Server, indexing, search, SOAR, Edge / Ingest Processor | **Process**: a circle, ID `P<n>`, name on up to two balanced lines inside the circle, one muted detail line | everything else that handles data |
| UF/HF persistent queue (when enabled), SC4S disk buffer, indexes (an indexer's store), deployment apps (DS), S3 bucket | **Data store**: two parallel horizontal lines with an ID cell, `D<n>` | derived from component settings; one store per owning component |
| Relationships | **Data flow**: an arrow, ID `DF-<n>`, styled by plane (event data solid; management dashed; authentication dotted) | one per relationship; bidirectional search flows get arrowheads at both ends |

**Trust boundaries** (drawn as dashed boundary-red rounded rectangles, labelled "TB-n · NAME" with a muted sub-line):
- one per **Trust zone, Network, Cloud tenant or Service boundary** group container, nested as the groups are;
- plus one per **security zone** that has components but no group: "Customer network" (`customer`), "AWS account" (`aws`), "Azure subscription" (`azure`), "Splunk Cloud Platform" (`splunk`, when Splunk Cloud indexing exists), "Storage" (`storage`), and "Corporate users" (people and identity).

A **provider-managed** boundary (Splunk Cloud) is drawn **dotted** and its sub-line says "Splunk-managed".

**Layout:** use the OV-2 site-row approach (see `builder-handoff-ov2-diagram.md`):
- customer boundaries on the left, with nested segments inside them;
- cloud-account boundaries below them;
- the Splunk-managed boundary in the middle;
- the users and identity boundary on the right.

Stores sit directly under the process that owns them. Fixed viewBox width 1200; no scaling below 1:1 on screen.

**Flow labels:** a small **pill with the flow ID only** ("DF-3"). The protocol goes in the pill's tooltip and in the tables. Full protocol text on every flow collides with the shapes (the first mockup draft proved this). A flow with an open Tampering or Information-disclosure threat gets a red pill.

**Routing:** a flow must **not pass through a boundary it doesn't cross**. For example, AWS Lambda → Splunk Cloud runs through the gap between the data centre and Splunk Cloud, not through the data centre. Route through the gaps between boundaries, as the mockup's DF-6 does.

**Crossing markers:** computed from the drawn paths. Sample each path every 4px and record where it leaves or enters any boundary rectangle. Draw a **diamond at every crossing point**: hollow, or filled boundary-red when an open threat applies to that flow. A nested crossing (TB-2 inside TB-1) is one crossing.

**Threat badges:** each element carries a small circle with its threat count, red when any are open and green when all are closed.

**Check:** with the mockup's topology the diagram has 5 boundaries, 14 flows, 6 crossings, and no flow passing through an unrelated boundary. No shape, label or pill overlaps another (the same bbox tests as the OV pages).

## 3. Boundary crossings table

One row per flow that crosses at least one boundary. Columns:

| Column | Source |
|---|---|
| Crossing | `X-<n>`, in flow order |
| Flow | `DF-<n>` |
| From → to | element IDs and names |
| Zone → zone | the **innermost** boundary at each end (for example "TB-2 Appliance segment → TB-1 Sydney data centre"). Don't list every boundary the path touches |
| Protocol | the shared transport formatter (`builder-handoff-ov2-diagram.md` item 8) |
| Authentication | relationship authentication type, or "None" |
| Encryption | "TLS" or **"None" in red** |
| Threats | threat IDs on this flow |

**Check:** DF-2 (firewall syslog) reads "TB-2 Appliance segment → TB-1 Sydney data centre", with encryption "None" in red and threats T-02, T-03, T-04.

## 4. Threat register and seeding rules

**Columns:** ID (`T-nn`), STRIDE letter (with its full name in a tooltip), Applies to (element or flow ID + name), Threat, Control, Risk (High / Medium / Low), Status (OPEN / MITIGATED / ACCEPTED / TRANSFERRED chip), Owner.

**Seeding:** generate threats from the model with these rules. Each seeded threat has a stable key (`rule|elementOrFlowId`) so that saved status, owner and notes stick to it across regenerations:

| Rule | STRIDE | Applies to | Default control | Default risk | Default status |
|---|---|---|---|---|---|
| Crossing flow without TLS | T and I | flow | "TLS (for syslog: 6514)" | High | Open |
| Crossing flow without authentication | S | flow | "Mutual TLS or token" | High if it carries PII, else Medium | Open |
| Unauthenticated syslog source | R | flow | "Source-IP allow list; host from the connection" | Medium | Open |
| S2S with forwarder certificate / mutual TLS | S | flow | "Forwarder credentials certificate" | Medium | Mitigated |
| HEC with token | S | flow | "Token scoped to one index; rotation" | Medium | Open until rotation is recorded |
| Token or secret held by a process (Lambda, HEC client) | I | process | "Secrets manager; least-privilege role" | Medium | Open |
| No acknowledgement and no queue on a crossing | D | flow | "Persistent queue; acknowledgement" | Medium | Open (Mitigated when both are set) |
| Syslog relay | D | process | "Disk buffer; drop alerts" | Medium | Mitigated when a buffer is recorded |
| Deployment Server with clients | E | the DS → client flow | "Restrict DS admin; change-controlled apps; alert on new server classes" | High | Open |
| Deployment apps store | T | store | "File integrity monitoring; version control" | Medium | Open |
| Queue on a forwarder host | I | store | "Host hardening; disk encryption" | Low | Accepted |
| Splunk-managed store or process | T, R | element | "Splunk-managed controls; audit index" | Medium | **Transferred** (owner: Splunk Cloud provider) |
| Interactive sign-in | S | auth flow | "SAML + MFA" | High | Mitigated when MFA is recorded |
| Search roles | E | search process | "Role-based index access; periodic role review" | Medium | Open |

**Saved register:** save it with the topology as `threatRegister: {[key]: {status, owner, risk, control, notes, updated}}`, and include it in `topologyDocument()`, layout profiles and re-import. Owners come from `responsibilityParties`. A threat whose rule no longer applies (its flow was deleted) moves to a "Retired" section on screen, and is dropped from the pack.

**Editing** (in the OV workspace tab only; the pack is read-only): click a row to open a small editor for status, owner, risk, control and notes. Changes go into Undo.

**Check:** the mockup's topology seeds the 15 threats listed in the mockup (T-01 to T-15), with the same statuses; changing T-02 to Mitigated survives export → re-import; deleting DF-2 retires T-02 to T-04.

## 5. Interaction (on screen)

- Selecting an element highlights it, its flows and the elements at their other ends, and dims the rest to about 15% opacity. Selecting a flow highlights the flow and its two ends. Selecting a table row does the same for its element or flow. The matching rows in both tables get the highlight colour. Esc clears.
- The STRIDE chips filter the threat register (item 1.4).
- Keyboard: elements and rows are focusable; Enter or Space selects; each element's accessible name is "P4 Deployment Server, 2 threats, 2 open".

## 6. Pack integration

- A Sections checkbox **"TM-1 threat model"**, on by default, after OV-3 and before the component inventory, listed in the contents.
- **Print:** the diagram on one A4-landscape page (≥ 9pt equivalent). The crossings table and threat register follow with 9.5pt text and repeating headers. The STRIDE chips and hint are hidden; the register shows all categories.
- The **light-theme contrast** rule (≥ 4.5:1 for page text) applies, including the boundary red on white (use a deep red such as `#b93a2b`).

## 7. Review findings

Add to `evaluateArchitectureRules()`:
- **"Open high-risk threats"** (warning), listing the IDs;
- **"Threat owner not set"** (warning, when TM-1 is on).

Open High-risk threats on a crossing also add to the Review findings count shown on the Validate menu.

---

## Acceptance
1. Build the mockup's topology: Windows servers → UF → Splunk Cloud; firewalls (in a nested appliance segment) → SC4S → HEC → Splunk Cloud; CloudTrail → Lambda → HEC → Splunk Cloud; DS → UF with a deployment-apps store; UF persistent queue; Splunk Cloud → indexes → search; SOC analysts → IdP → search. TM-1 should match `docs/mockups/compare/threat-model-light.png` in kind: 5 boundaries, 14 flows, 6 crossings, 15 threats (7 open, 4 mitigated, 2 accepted, 2 transferred).
2. No flow crosses a boundary it doesn't belong to; there are no overlaps; the crossing markers sit on the boundary edges.
3. The crossing table's zone column uses the innermost boundaries (item 3 check).
4. Register edits persist through export → re-import and Undo; retired threats behave as in item 4.
5. The pack prints TM-1 correctly in both themes; 0 `pageerror` events; the OV tab gains the TM tab without regressions in OV-1/2/3.
6. Add a `changeRegister` entry: "Threat model: data flow diagram with trust boundaries, crossing register and STRIDE threat register."

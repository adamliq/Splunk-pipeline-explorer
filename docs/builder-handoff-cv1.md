# Builder handoff: add CV-1 (Capability Vision)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`.
**Start from:** `main` at `a3d3df5` (Build 168: `builder-operational-labels-v168`). Add one new block, `<script id="builder-cv1-v169">`, or the next free number. Use wrappers only; keep every earlier block.
**Mockup (the target):** [`docs/mockups/architecture-cv1-mockup.html`](mockups/architecture-cv1-mockup.html), screenshot `docs/mockups/compare/cv1-mockup.png`.
**Related mockups:** CV-2, CV-4, CV-6 and CV-7 use the same eight capabilities. Build CV-1 so they can reuse its capability list later (see "Shared capability list").

## What CV-1 is

In DoDAF V2.0, CV-1 is the **Vision** view: the strategic goal, the goals that make it measurable, and the capabilities that deliver it over time.

Most of OV-1/2/3 comes from the topology. CV-1 is different: most of its content comes from the **owner** (vision, goals, measures, increments, drivers). The Builder supplies two things:
- the capability list;
- whether each capability is realised in the current topology.

So CV-1 is an **editable** page, like TM-1. TM-1 is the model to copy for the tab, editing, save/load and the architecture pack.

## Where it goes: copy the TM-1 pattern

Build 150 added TM-1 as an editable tab. Follow the same steps:

| Step | TM-1 code to copy | CV-1 |
|---|---|---|
| Section | `builderOvSections135` wrapper that adds `tm1: [builderThreatPage150(true)]` | Wrap again and add `cv1: [builderCv1Page169(true)]` |
| Tab | `builderThreatWire150()` inserts the `[data-ov-tab="tm1"]` button | Insert "CV-1 · Vision" after the last tab (TM-1, or DIV-1 if it exists) |
| Active key | `builderOvShow135` accepts `['ov1','ov2','ov3','tm1']` | Add `'cv1'` (keep every existing key) |
| Editing | `[data-tm-key][data-tm-field]` inputs, `change` listener, re-render that keeps the scroll position | `[data-cv1-field]` inputs, same listener style and scroll handling |
| Save | `topologyDocument` wrapper sets `doc.threatModel = builderThreatClean150(state.builderThreatModel150)` | Set `doc.capabilityVision = builderCv1Clean169(state.builderCv1)` |
| Load | `loadTopologyDocument` wrapper reads `doc.threatModel` and `exportPreferences.packSections.tm1` | Read `doc.capabilityVision` and `exportPreferences.packSections.cv1` |
| Pack | `state.builderExport.sections.tm1` | `state.builderExport.sections.cv1`, default `true` |

Use `builderEditable=false` for the architecture pack and Print / PDF, as TM-1 does.

## Data model (`state.builderCv1`, saved as `capabilityVision`)

```js
{
  owner: '',                         // "Capability owner" in the title block; '' shows "Not set"
  vision: '',                        // ≤ 400 chars
  timeframe: '',                     // ≤ 80, e.g. "Oct 2026 – Dec 2027"
  scope: '',                         // ≤ 160
  increments: [                      // 1–4
    {key:'i1', name:'Foundation', start:'2026-10', end:'2026-12'}
  ],
  goals: [                           // 0–6
    {key:'g1', name:'', objective:'', due:'i2',          // due = an increment key
     measures:[{name:'', baseline:'', target:''}]}       // 0–4; baseline '' shows "Not measured"
  ],
  capabilities: {                    // keyed by capability id (C1…C8, below)
    C1: {goals:['g1','g3'],          // first entry is the primary goal
         plan:{i1:'', i2:'', i3:''}} // text per increment; '' shows "—"
  },
  drivers: [''],                     // 0–6, ≤ 200 chars each
  effects: ['']                      // 0–6, ≤ 200 chars each
}
```

`builderCv1Clean169(raw)` must accept any input, including `undefined` from an older file:
- Drop unknown keys.
- Trim and length-cap every string.
- Cap the array lengths above.
- Drop goal and increment references that point at a missing key.
- Return the empty defaults when the input is missing.

An older topology file with no `capabilityVision` opens with the defaults, and no other data changes.

### Defaults and example content

- **Empty:** a new topology starts with:
  - an empty vision ("Not set" placeholder);
  - three increments named Increment 1–3 with no dates;
  - no goals, drivers or effects;
  - the eight capabilities with empty plans.
- **Example:** add a small "Load example" button, shown only while `vision` and `goals` are both empty. It fills the mockup's example text: vision, the four goals G1–G4 with measures, the roadmap cells, drivers and effects.
- **Labelling:** example content is labelled "Example content" on the sheet until the owner edits the vision. This matches the mockup's pill.

## Capabilities and realisation (derived, not edited)

The eight level-1 capabilities are fixed in this build:

| ID | Capability | Domain colour | "In topology" when the topology has | "Partial" when |
|---|---|---|---|---|
| C1 | Telemetry collection | collect | a source **and** a collector (`uf`, `hf`, `syslog`, `hecEndpoint`, `dbConnect`, `apiCollector`, `streamServer`, `edgeProcessor`, `ip`) where every collector's downstream path (directly or through other collectors) reaches an indexing tier | any collector's path stops before an indexer (SV-1 found this: Universal Forwarder 2 and Heavy Forwarder 1) |
| C2 | Fleet configuration | collect | `ds`, `serverClass` or `deploymentApp`, with at least one management relationship | a Deployment Server with no clients |
| C3 | Indexing and retention | index | `indexerCluster` or `indexerClusterManager` | a single `idx` or `cloudIndexer148` only |
| C4 | Search and analytics | search | `shcCluster` / `shcMember`, or `cloudSearchTier` | a single `search` only |
| C5 | Threat detection | detect | **never in this build:** the Builder has no Enterprise Security component | n/a (show "Planned · no Enterprise Security component") |
| C6 | Automated response | detect | `soarCloud` or `soarOnPrem` | `soarPlaybook` only |
| C7 | Identity and access | govern | `authProviderCloud` or `authProviderOnPrem` with an auth relationship to a search tier | `authUser` only |
| C8 | Platform health and licence | index | `licenseManager` **and** `monitoringConsole` | only one of them |

"Planned" applies when nothing matches.

**Correction to the mockup:** the reference topology **has** a Monitoring Console, so C8 is **In topology**, not Partial. The rule above wins over the mockup's example status.

The mockup's "Realised by" line under each capability lists the Builder component names found for that capability (for example "Universal Forwarder, Heavy Forwarder, Syslog Server"). Use `builderComponents[type].name`.

## Page layout (match the mockup)

1. **Banners and title block:** same as OV-3 / TM-1.
   - Title: "CV-1 · Vision".
   - Viewpoint: "Capability (DoDAF V2.0)".
   - Capability owner: an editable input, as the TM-1 threat owner is.
   - Build · prepared.
2. **Vision:** blockquote, plus timeframe and scope. Editable textarea and inputs in the live view; plain text in the pack.
3. **Summary line:** counts of goals, measures, capabilities and increments; realised in topology; partial or planned; baselines not measured.
4. **Vision tree (SVG):** vision → goals → capabilities.
   - Thick line: the capability's primary goal. Thin line: it also contributes to the goal.
   - Each capability card shows its realisation status (● In topology / ○ Partial / ○ Planned).
   - Click a goal to highlight its capabilities; click a capability to highlight its goals. Esc clears.
   - Hard-code the layout grid as in the mockup (4 goal slots, 8 capability slots). Goal boxes wrap their names onto two lines. Lay out 1–6 goals evenly across the width.
5. **Goal cards:**
   - Show ID, the due increment, name, objective and measures (`baseline → target`), plus "Delivered by C…".
   - Editable: name, objective, due increment (select), and the measures (add or remove, at most 4).
6. **Capability roadmap table:**
   - Columns: capability, goals (primary marked `*`), one column per increment (name and dates), and "In topology today" (chip, plus the reason for Partial or Planned).
   - Editable cells: the goal picker (multi-select; first chosen is primary) and the increment text.
7. **Drivers and desired effects:** two editable lists.
8. **Footer:** `CV-1 · 1 of 1 · Build <n>`.

**Themes:** use the OV theme tokens (`theme-dark` / `theme-light` on `builderOvRoot135`), not the mockup's own `:root` tokens.

**Narrow screens:** the tree scrolls inside its figure, and the page itself has no sideways scroll.

## Shared capability list

Put the capability definitions (ID, name, domain, realisation rule) in one object, for example `builderCapabilities169`. Export a function `builderCapabilityStatus169(id)` that returns `{status, reason, components}`.

CV-2, CV-4, CV-6 and CV-7 will reuse both later. Don't inline the rules inside the CV-1 renderer.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events;
   - button and grouping sweeps clean;
   - OV-1/2/3 and TM-1 output unchanged (OV-2 pixel-identical to Build 168);
   - perf `allOk`, space 7/7, connector all OK.
2. **Reference topology** (`docs/mockups/ov1-reference-topology.json`):
   - **In topology:** C2, C6, C7, C8.
   - **Partial:** C1, because the paths through Universal Forwarder 2 and Heavy Forwarder 1 stop before an indexer. Also C3 (single indexer) and C4 (single search head).
   - **Planned:** C5.
3. **Default topology** (`syslogSource`, `syslog`, `uf`, `idx`):
   - **In topology:** C1 (the Syslog Source → Syslog Server → Universal Forwarder → Indexer path reaches the indexer).
   - **Partial:** C3 (a single indexer).
   - **Planned:** C2, C4, C5, C6, C7 and C8.
4. **Save and load:**
   - Edit the vision, add a goal with two measures and assign capabilities, then save the topology. Reload it and import it: everything round-trips.
   - An older file (no `capabilityVision`) opens with the defaults.
   - A file with junk in `capabilityVision` (wrong types, 10 goals, a 5,000-character vision) loads cleaned and capped, without errors.
5. **Load example:** fills the mockup content. The button disappears once there is a vision or a goal.
6. **Interaction:** select G2 → C4, C5 and C6 stay at full strength in the tree, cards and roadmap. Esc clears.
7. **Pack and print:**
   - The architecture pack and Print / PDF include CV-1, read-only with no inputs.
   - `exportPreferences.packSections.cv1 = false` leaves it out.
8. **Themes and layout:** dark and light themes are both readable; at 768px wide there is no page-level sideways scroll.
9. **Records:**
   - a `changeRegister` entry: "Adds CV-1 Capability Vision with derived capability status";
   - the build stamp.

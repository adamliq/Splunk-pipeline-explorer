# Builder handoff: add DIV-1 (Conceptual Data Model)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** `main` at `79110fc` (Build 167), or after Build 168 if that ships first. Add one new block, `<script id="builder-div1-v16x">`. Use wrappers only; keep every earlier block.
**Mockup (the target):** [`docs/mockups/architecture-div1-mockup.html`](mockups/architecture-div1-mockup.html), screenshot `docs/mockups/compare/div1-mockup.png`.
**Independent of** [`builder-handoff-build168.md`](builder-handoff-build168.md). Do those items first if both are in one build; don't change OV-1/2/3 output here.

## What DIV-1 is

In DoDAF V2.0, DIV-1 is the **Conceptual Data Model**. It shows the data concepts the architecture needs and how they relate, with no attributes, keys or storage; those belong to DIV-2 and DIV-3. Here the concepts are Splunk's: Event, Index, Sourcetype, Field, Search, Finding and so on.

The page has:
- an SVG concept diagram;
- a detail panel for the selected concept;
- a concept register;
- a relationship register.

Its header block, banners and footer match OV-3.

## Where it goes

The OV view is built by `builderOvRender135()` (about line 5755) from `builderOvSections135()` (line 5754):

```js
function builderOvSections135(){return{ov1:[builderOvPage132()],ov2:builderOv2Pages133(),ov3:builderOv3Pages134()}}
```

1. **Section:** wrap `builderOvSections135` to add `div1: builderDiv1Pages16x()`. It returns `[builderV125Page125('div1','DIV-1 · Conceptual Data Model', html)]`.
2. **Tab:** add a fourth tab, "DIV-1 · Data model", after OV-3. Today the tab strip is hard-coded in `builderOvRender135`, and `builderOvShow135` only accepts `['ov1','ov2','ov3']`.
   - Extend both by wrapping them: after render, insert the tab button.
   - In `builderOvShow135`, accept `'div1'`.
   - Panel ids follow the pattern `ovPanel4-135` / `ovTab4-135`.
   - Keep arrow-key tab navigation working (`builderOvWire135`).
3. **Labels:**
   - Heading `OV-1 · OV-2 · OV-3` → `OV-1 · OV-2 · OV-3 · DIV-1`.
   - The nav button's aria-label → "Operational and data views".
   - The button text stays "OV".
4. **Architecture pack:** "Download architecture pack" (`downloadArchitecturePack`) and Print / PDF must include the DIV-1 page after OV-3. It should look like the OV-3 pages do in print.
5. **Theme:** use the OV theme tokens (`theme-dark` / `theme-light` on `builderOvRoot135`), not the mockup's own `:root` tokens.

## The model: derive it from the topology

Don't paste the mockup's 21 concepts as fixed text. Build the model from `state.builderNodes`, so the page only shows what this architecture actually has.

The mockup is the full set for the reference topology (`docs/mockups/ov1-reference-topology.json`).

### Concepts and when they appear

| Domain | Concept | Present when the topology has |
|---|---|---|
| Collection and configuration | Source System | any source type (`syslogSource`, `windowsEvent`, `fileSource`, `scriptSource`, `apiSource`, `awsLambda`, `azureFunction`, `hecClient`, `sqlDatabase`, `streamDefinition`) |
| | Data Input | any collector (`uf`, `hf`, `syslog`, `hecEndpoint`, `dbConnect`, `apiCollector`, `streamServer`, `edgeProcessor`, `ip`) |
| | Server Class, Deployment App | `ds`, `serverClass` or `deploymentApp` |
| Indexing and storage | Event, Sourcetype, Index, Bucket | always (any indexing tier: `idx`, `indexerCluster`, `cloudIndexer148`) |
| | License Usage | `licenseManager` |
| Search and knowledge | Field, Search | always |
| | Data Model, Lookup | any search tier (`search`, `shcCluster`, `shcMember`, `cloudSearchTier`) |
| Detection and response | Correlation Search, Finding | any search tier |
| | SOAR Container, Playbook | `soarCloud`, `soarOnPrem` or `soarPlaybook` |
| Governance and access | Data Classification, Retention Policy | always |
| | Role, User | `authUser`, `authProviderCloud`, `authProviderOnPrem`, or any search tier |

Optional: federated S3 (`s3Dataset`, `s3FederatedConnection`, `s3DataCatalog`) adds **Federated Dataset**, with "Search reads Federated Dataset". Leave it out if it doesn't fit the grid cleanly.

### Relationships

Use the mockup's R1–R22, with the same subject, verb, object, cardinality and rule. Show a relationship only when both its ends are present, and number the ones shown in order (R1…Rn).

- R17 "Correlation Search **is a kind of** Search" is a generalisation: draw it with a hollow arrowhead.
- All other relationships get a filled arrowhead and read from subject to object.

### Columns that come from existing state

- **Carried by (OV-2 / OV-3):** use the flows in `builderOv2Model133().flows`, not text typed in. Map each flow to the concepts it carries, by the producer/consumer node types:
  - source → collector: Event;
  - forwarder → indexer: Event (S2S);
  - Deployment Server → client: Server Class, Deployment App;
  - License Manager → Search Head: License Usage;
  - search → SOAR: Finding;
  - User or Auth → search: User, Role.

  Show each flow's `details.protocol`, with the port when it isn't 0, and `· TLS` when `details.tls` says so. Use "—" when no flow carries the concept.
- **Data Classification definition:** use `state.securityClassification`.
- **Data owner:** in the title block, show "Not set" until there is an owner field, as the mockup does.
- **Build stamp and date:** take them from the existing OV-3 header helpers (`builderOv3Header134` shows how).

## Diagram layout

Copy the mockup's layout:
- **Grid:**
  - 4 columns (x 30, 330, 630, 930);
  - 6 rows (y 90 … 690);
  - boxes 200 × 50;
  - viewBox `0 0 1160 770`.
- **Domain colours:** a left colour bar on each box (the `--d-*` domain colours).
- **Placement:** each concept has a fixed cell. When a concept is absent, leave its cell empty. Don't reflow, so the picture stays stable between topologies.
- **Routing:** orthogonal, hand-placed per relationship, as in the mockup's `REL` table. Hard-code each route's points; don't run the Builder or OV-1 router.
- **Labels:** each label sits on its own segment. A label must not cross a line or sit on a box.

Interaction (same as the mockup):
- Click a concept, on the diagram or a register row, to select it. Its relationships stay at full strength; everything else dims to about 25%.
- The detail panel shows the definition, "Realised in Splunk", "Carried by" and the relationship list.
- Esc or a second click clears the selection. Event is selected on first render.
- Keyboard: boxes are focusable (`tabindex="0"`, `role="button"`, `aria-pressed`); Enter or Space selects.

## Check before uploading

1. 0 `pageerror` events. Run the button sweep and the grouping sweep; OV-1, OV-2 and OV-3 output is unchanged (OV-2 pixel-identical).
2. Run perf, space and connector tools as usual: `allOk`, 7/7, all OK (scenarios 1–10).
3. **Reference topology:** the DIV-1 tab shows 21 concepts and 22 relationships, and it matches `div1-mockup.png` in layout.
4. **Default topology** (`syslogSource`, `syslog`, `uf`, `idx`): no Server Class, Deployment App, License Usage, SOAR or Playbook concepts, and no relationships to them. No dangling lines.
5. **Lines and labels:** no line crosses a box; every relationship label is within 20px of its own line and off every box.
6. **Selection:** select Event → only R4, R5, R6, R7 and R11 stay at full strength. Esc clears.
7. **Pack and print:** the downloaded architecture pack and Print / PDF both include DIV-1 after OV-3.
8. **Themes:** dark and light themes both readable; at 768px wide, the page scrolls inside its panel without page-level horizontal scroll.
9. **Records:** add a `changeRegister` entry ("Adds DIV-1 Conceptual Data Model to the architecture views") and the build stamp.

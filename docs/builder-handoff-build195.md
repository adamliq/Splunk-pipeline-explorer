# Builder handoff: Build 195 recheck (Build 192 fixes, Azure storage, event traces and rules)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 195. Builds 193 to 195 add three blocks:
- `builder-review-v193`, the Build 192 fixes;
- `builder-azure-storage-v194`;
- `builder-traces-rules-v1xx`: SV-10c, OV-6c, SV-10a, and a rebuilt AV-1 page.

They also edit these in place:
- the theme strings `theme188` to `theme190`;
- the StdV-1 footer;
- `excluded188`;
- the threat-model rule texts.

Eight small fixes are left: one P2 and seven P3.
- **`builder-traces-rules-v1xx`:** most fixes go here, in place. Its functions share one closure, so a wrapper can't reach them.
- **`builder-splunk-managed-v176`:** fix 5 changes one expression.
- **Records:** add a `changeRegister` entry and the Build 196 stamp.

**Tested with:**
- the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies, plus the reference topology validated for Hybrid;
- each handoff's checks: the Build 192 checks, the Azure scene with its eleven Validate cases and file tests, and the trace edits;
- every view's text against Build 193;
- the three new pages' text against their mockups, scene by scene;
- screenshots at 1440 against `docs/mockups/compare/`;
- layout at 400 (light and dark), 768, 1280, 1440 and 1920 pixels.

I tried every fix below on a copy of Build 195.

## What passes

**Clean run and regression:**
- 0 `pageerror` events.
- All 28 view tabs render. OV-6c follows OV-5a, and SV-10a and SV-10c follow SV-6.
- Against Build 193, on the three topologies, every view's text is unchanged apart from:
  - **AV-1:** the three new rows, the issue lists, and the counts (28 views, 19 generated, and the page numbers). Its Purpose label changes too (fix 4).
  - **Validate:** the new AR-006 description and the TM-OWNER plural.
- SV-2's connections, paths and rules match Build 192 when there is no load balancer, and with Deploy VIP.

**The nine Build 192 fixes all pass:**

| Fix | Result |
|---|---|
| 1. Title fonts | `--font-title` is set on all six pages. The other checks pass:<br>• summary numbers: 600 at 16.8px;<br>• body text: 14px;<br>• AV-1's "Generated" chips: green;<br>• SV-6's plane chips: 600 at 11.8px. |
| 2. SV-3 tables | At 1280, 1440 and 1920:<br>• each frame's `scrollWidth` equals its `clientWidth`;<br>• all six location columns show;<br>• Indexer 1's three badges show.<br>At 400 the tables scroll inside their frames. |
| 3. AV-1 issue lists | SV-3 lists "I-01, I-02, I-06, I-07, I-08", SV-5b "I-01, I-03, I-06, I-07" and CV-7 "I-03, I-09, I-11".<br>Switching views off in the pack lowers the counts.<br>With the trace views, the order is:<br>• **High:** I-01 (12), I-02 (10), I-03 (10), I-05 (2), I-04 (1);<br>• **Medium:** I-07 (6), then I-06, I-08 and I-09 (5 each), I-11 (4), I-10 (3). |
| 4. DNS round robin | • FW-1: Sydney ⇒ Indexer 1 (SI-3, SI-16, SI-17).<br>• FW-2 and FW-3: AWS ap-southeast-2 ⇒ Heavy Forwarder 1 and Heavy Forwarder 2, 8088, Ready to request.<br>• FW-4 to FW-10: Melbourne ⇒ Deployment Server 1 through to Sydney ⇒ Search Head 1.<br>• NP-2: AWS ap-southeast-2 ⇒ Sydney. NP-3: Melbourne ⇒ Sydney. |
| 5. Singular findings | The default topology gives all four singular texts. The reference topology keeps the plurals. |
| 6. AV-1 issue titles | Sentence case, bold and in the ink colour, in light and dark. |
| 7. SV-1 legend | No legend word splits at 400, 1280 or 1440. |
| 8. StdV-1 footer | "StdV-1 · 1 of 1 · Build 195", on screen and in the pack. |
| 9. Viewpoint | AV-1 and AV-2 both read "All · DoDAF V2.0". |

**Azure Blob Storage (Build 194): every check in its handoff passes.**

| Check | Result |
|---|---|
| Scene | Built with the palette and the inspectors. Validate is clear and AR-006 passes.<br>The link reads:<br>• "HTTPS (Azure Blob Storage REST)" to `secarchive01.blob.core.windows.net`;<br>• 443, TLS Required, Application response;<br>• authentication "Yes · OAuth 2.0 / bearer token";<br>• owner Cloud storage team.<br>SV-1, SV-2, OV-2, OV-3, the threat model, AV-1 and AV-2 read as specified. |
| Validate cases | All eleven pass, including:<br>• NO WRITE ACCESS on the card;<br>• the Data Lake endpoint;<br>• a typed endpoint that stays;<br>• the refused Universal Forwarder link;<br>• the Edge Processor writer;<br>• AR-006 failing with TLS Optional. |
| File | A round trip keeps every field, the link and the endpoint, and saves no secret.<br>The junk file loads cleaned, with the three warnings.<br>Both refusals give their messages. |
| Palette, guide, inspector | • The group follows "S3 federated search".<br>• All seven search words find the items.<br>• Each add and each change is one Undo step.<br>• The guide's rows, footer and buttons match.<br>• The inventory and the pack list the configuration. |
| Look | Both cards keep their content inside 190 × 224 at 1600, 1280 and 400.<br>The connection card has no data handle.<br>Nothing scrolls sideways at 400. |
| S3 regression | An S3 dataset link reads "HTTPS (Amazon S3 dataset write)", 443, TLS Required, "Yes · AWS IAM / SigV4".<br>The S3 connection and catalog no longer appear in SV-1, SV-3 or AV-1's I-06. |

**SV-10c, OV-6c and SV-10a (Build 195):**

| Check | Result |
|---|---|
| Models | `builderEventTrace1xx`, `builderOperationalTrace1xx` and `builderRulesBySystem1xx` match the prototype on all four scenes, item for item. That covers every step, milestone, stop, node, flow, rule, scope and cell. |
| Pages | Each page's text matches its mockup in every scene, line for line. The only differences are:<br>• the build number;<br>• Build 194's AR-006 wording;<br>• the TM-OWNER plural;<br>• the uppercase panel headings (fix 3). |
| Edits | These all give the expected results:<br>• port 9997 on SI-3;<br>• latency targets of 30 s and 0;<br>• the removed output;<br>• AR-005 disabled.<br>A topology change clears the selection. |
| Interaction | Selecting a message or a row selects the step, and Esc clears it.<br>The step buttons open SV-1, OV-6c, SV-10c and OV-3 at the item. "Open in Validate" doesn't (fix 1). |
| Pack and print | • The three switches are labelled and saved, and an older file opens with them on.<br>• The pages follow the tabs' order.<br>• The pack and print copies have the SVG diagrams and full tables, and no controls. |
| Layout | No sideways page scroll at 400 (light and dark), 768, 1440 or 1920.<br>The diagrams and tables scroll inside their frames.<br>No text leaves the diagram, a header box or a note box. |
| AV-1 | The three registry rows are in, with the right page numbers. So are the issue lists:<br>• I-02 adds SV-10c and OV-6c;<br>• I-05 adds SV-10a;<br>• I-08 adds SV-10c. |
| Records | Both `changeRegister` entries and both stamps are in. |

## Fixes

### 1. "Open in Validate" shows nothing, P2

**Where:** SV-10a, with a rule selected.

**What happens:** the button switches to the Builder and focuses the rule, but the rules list stays hidden. The reader sees only a dimmed canvas.

**Cause:**
- `navigate195('rules', id)` sets `state.builderRules.open` and calls `renderBuilder()`.
- The rules list now lives in the Inspect topology drawer: `#builderRulesPanel` inside `#builderInspectorDrawer`. That drawer stays closed. The Builder's own Rules button opens it with `openBuilderDrawer('rules')`.
- The scroll looks for `[data-rule]`, which only SV-10a's own buttons have. The rule cards use `data-rule-toggle`.

**Rule:** in `navigate195`, replace the `rules` branch with:

```js
if(key==='rules'){switchView('builder');openBuilderDrawer('rules',false);state.builderRules.focus=item||null;renderBuilder();document.querySelector('#builderRulesPanel [data-rule-toggle="'+item+'"]')?.closest('.ruleCard')?.scrollIntoView({block:'center'});return}
```

`block:'center'` keeps the card clear of the drawer's tabs.

**Check:** at 1440 and 400 pixels:
1. Select AR-005 in SV-10a.
2. Press "Open in Validate".
3. The drawer opens on Rules, with AR-005's card in view.

### 2. The new pages' build number and date are fixed text, P3

**What happens:** on screen and in the pack:
- the title block reads "195 · 15 Oct 2026";
- the footer reads "SV-10c · 1 of 1 · Build 195".

From Build 196 both will be wrong, as StdV-1's footer was (Build 192's fix 8).

**Cause:** the three copies of `furniture()` hard-code that text.

**Rule:**
- In `tracesModel195()`, add `build:document.querySelector('#topologyBuilder').dataset.buildNumber`. Read it there: inside the mount functions, `document` is a stand-in for the page host.
- In each copy of `furniture()`, write the title block as `${esc(D.build)} · ${builderOvShortDate136()}` and the footer as `Build ${esc(D.build)}`, as AV-1 does.

**Check:** with the stamp set to 196, all three pages read "196 · <today>" and "Build 196", on screen and in the pack.

### 3. The panel headings are uppercase, P3

**Where:** the detail panel of SV-10c, OV-6c and SV-10a. For example, "FIREWALLS AND NETWORK DEVICES TO SEARCH HEAD 1" and "3 RULES FAIL".

**Cause:** the same as Build 192's fix 6.
- The workspace style `.ov1Visual137 h3` applies to `#detail h3`. It makes the heading uppercase, letter-spaced and muted.
- The mockups show a bold heading in the ink colour.

**Rule:** `.tracePage195 #detail h3{text-transform:none;letter-spacing:normal;color:var(--ink)}`

**Check:** the three headings are in sentence case, bold and in the ink colour, in light and dark. Nothing else on the pages changes.

### 4. AV-1's Purpose label lost its style, P3

**What happens:**
- Build 193 showed "PURPOSE" as a small uppercase label, as every other view does.
- Build 195 shows "Purpose" in plain body text.

**Cause:** `avPage195()` turns every `.tb-k` into a `<small>` for the title block, and that includes the purpose label.

**Rule:** limit it to the title block: `host.querySelectorAll('#tb .tb-k')`.

**Check:** AV-1's purpose label matches Build 193: uppercase, weight 600, about 9.9px, muted. The title block is unchanged.

### 5. The Splunk Cloud Search card ignores Azure connections, P3

**What happens:**
- With Microsoft Azure Connection 1 using it, the card reads "Federated S3 · 0 connections". The Azure mockup shows "Federated · 1 Azure connection".
- With one S3 connection, it reads "1 connections".

**Cause:** the card in `builder-splunk-managed-v176` counts `s3FederatedConnection` nodes only, and always says "connections".

**Rule:** in place, replace `'Federated S3 · '+state.builderNodes.filter(p=>p.type==='s3FederatedConnection'&&p.s3CloudSearchId===n.id).length+' connections'` with:

```js
(()=>{const s3=state.builderNodes.filter(p=>p.type==='s3FederatedConnection'&&p.s3CloudSearchId===n.id).length,az=state.builderNodes.filter(p=>p.type==='azureConnection'&&p.azureCloudSearchId===n.id).length,parts=[s3?s3+' S3':'',az?az+' Azure':''].filter(Boolean);return parts.length?'Federated · '+parts.join(' and ')+' connection'+(s3+az===1?'':'s'):'Federated · no connection'})()
```

It reads, for example:
- "Federated · 1 Azure connection";
- "Federated · 2 S3 connections";
- "Federated · 1 S3 and 1 Azure connections";
- "Federated · no connection".

**Check:** in the Azure scene, after "＋ Cloud Search", the card reads "Federated · 1 Azure connection". When Cloud Search searches a Splunk Cloud indexer, the card still reads "Searches …".

### 6. A trace that stops at a missing output counts the missing interface, P3

**Steps:** on the reference topology, remove Universal Forwarder 1 → Indexer 1.

**What happens:**
- SV-10c's summary reads "— no search head", and OV-6c's "— no search node". Search Head 1 is in the topology: the event just never reaches an indexer.
- SV-10c's "Port not set" finding reads "SI-1 and SI-12 have no port set. The trace assumes 514 and 9997." SI-12 is the missing interface, so it has no port to set. The summary counts 2 ports not set.
- SV-10c's "No target" finding reads "SI-12 has no latency target…".
- OV-6c reads "RF-01 and SI-12 are carried by interfaces with no port set".

My mockup code has the same gap. None of the handoff's scenes covered it.

**Rule:**
- **Summary:** when `stop.kind` is `stops` and nothing is searchable, show "— not searchable" in the stop colour. Otherwise keep "— no search head" or "— no search node".
- **Findings:** leave missing steps (`source==='missing'`) out of:
  - `noport`, in all three places: SV-10c's summary, SV-10c's findings and OV-6c's findings;
  - SV-10c's `unknown`, which drives the No target finding.

**Check:** in the scene:
- SV-10c shows:
  - "— not searchable" and "1 port not set";
  - Port not set: "SI-1 has no port set. The trace assumes 514. Set it on the link in the Builder.";
  - no No target finding, and the Stops finding.
- OV-6c shows "— not searchable" and "RF-01 is carried by an interface with no port set (SI-1)."
- The default topology still reads "— no search head".

### 7. SV-10a writes "1 rule fail", P3

**Where:** the detail panel heading when nothing is selected, on the default topology.

**Rule:** `plural(fails.length,'rule')+(fails.length===1?' fails':' fail')`. The Fail finding already does this.

**Check:** the default topology reads "1 rule fails"; the reference topology reads "3 rules fail".

### 8. In dark mode, rules with nothing to check don't look muted, P3

**What happens:**
- The handoff mutes these rules, and light mode shows it.
- In dark mode, the workspace's muted colour (#c1d8e3) is close to the ink (#e4eef4), so the nine rows look like the rest.

**Rule:** `.tracePage195 tr.na td b{font-weight:500}`. The rules' titles drop from bold to medium weight, so they read lighter in both themes and keep the workspace's colours.

**Check:** in dark mode, these rules have medium-weight (500) titles: AR-006, PR-ENT-01 and AR-009 to AR-015. The other rules' titles stay bold.

## Accepted as built

- **SV-10a's rows follow SV-3's order:** Sydney, Melbourne, AWS ap-southeast-2, Security operations, Multisite, Cloud. That's what the handoff asks. My mockup grouped them differently.
- **The Hybrid profile line** names Splunk Cloud before Splunk Enterprise, in `builderRuleProfiles`' order. My mockup had them the other way round.
- **AV-1 is rebuilt** from the AV-1 mockup's script: `avPage195` replaces `builderAv1Page189`'s page.
  - Its text matches Build 193 apart from the new rows and fix 4.
  - `mountAv1195` still carries unused mockup code (`EX`, `SCEN`, `scenarioSwitch`). It can go.
- **The first Azure Validate case** gives both search warnings at once. That follows the warnings table; my case table listed only the first.
- **"RF-07 in OV-3"** opens OV-3 at the RF-07 row. OV-3 has no row selection, so the row isn't highlighted.
- **The Failure Lab** has no Azure entry. It simulates the pipeline's stages, not Builder components, and has no S3 entry either. My Azure handoff was wrong to list it.
- **SV-1's interface table** splits long names at 400 pixels, as Build 193 did. Fix 7 covered the legend, which is right.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" still holds.
   - Against Build 195, view text changes only where fixes 2, 3, 4, 6 and 7 say.
2. **Fixes 1–8:** run the check in each item.
3. **Records:**
   - Add a `changeRegister` entry under "Explorer foundations", such as "Build 196 review fixes".
   - Add the Build 196 stamp.

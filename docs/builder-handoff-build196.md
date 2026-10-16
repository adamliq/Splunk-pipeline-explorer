# Builder handoff: Build 196 recheck (the Build 195 review fixes)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 196. It makes the eight fixes in `docs/builder-handoff-build195.md`, editing two blocks in place:
- `builder-traces-rules-v1xx`;
- `builder-splunk-managed-v176`.

It also adds the "Build 196 review fixes" register entry and the stamp.

**Result:** all eight fixes pass, and nothing else changed. No fixes are left.

**Tested with:**
- the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies, plus the reference topology validated for Hybrid;
- every view's text against Build 195;
- the Build 195 handoff's check for each fix;
- the Azure and trace checks from the earlier rechecks, rerun;
- layout at 400 (light and dark), 768, 1440 and 1920 pixels.

## The eight fixes

| Fix | Result |
|---|---|
| 1. "Open in Validate", P2 | With AR-005 selected in SV-10a, the button opens the drawer on Rules with AR-005's card in view, at 1440 and 400. |
| 2. Build number and date | With the stamp set to 197, all three pages read "197 · 16 Oct 2026" and "Build 197", on screen and in the pack. The pages' model now refreshes when the build number changes, too. |
| 3. Panel headings | The headings on SV-10c, OV-6c and SV-10a are in sentence case, bold and in the ink colour. |
| 4. AV-1's Purpose label | It's back to the Build 193 label: uppercase, weight 600, about 9.9px. |
| 5. Splunk Cloud Search card | It reads "Federated · 1 Azure connection", "Federated · 1 S3 connection", "Federated · 1 S3 and 1 Azure connections" or "Federated · no connection". All four fit the card at 1600 and 400. |
| 6. Missing output | With Universal Forwarder 1 → Indexer 1 removed:<br>• **SV-10c:** "— not searchable" and "1 port not set". Port not set names SI-1 only, and there's no No target finding.<br>• **OV-6c:** "— not searchable". Port not set names RF-01 (SI-1) only.<br>The default topology still reads "— no search head". |
| 7. "1 rule fails" | The default topology reads "1 rule fails"; the reference topology "3 rules fail". |
| 8. Muted rules | In dark mode, the nine rules with nothing to check have medium-weight (500) titles. The rest stay bold. |

## Regression

- 0 `pageerror` events.
- Against Build 195, on the three topologies, view text changes only in the intended places:
  - the three panel headings' case;
  - AV-1's "PURPOSE" label;
  - SV-10a's "1 rule fails".
- **Azure:** the scene, the eleven Validate cases, the file tests and the palette search give the same results as in Build 195.
- **Traces:** the three models still match the prototype on all four scenes. The layout and the pack and print copies are unchanged.

## Accepted as built

- **The Splunk Cloud Search card's facts are 10px.** `reviewCss196` sets this; the other managed cards use 11.5px.
  - At 11.5px the longest text still fits, wrapping to four lines, so either size works.
  - Drop the rule if you want the cards to match.
- **Optional cleanup:** the code below is unused and can go.
  - `EX`, `SCEN` and `scenarioSwitch` are leftover mockup code. They appear twice: in `builder-av-v1xx` and in `mountAv1195` in `builder-traces-rules-v1xx`.
  - SV-10c's `stepStyle` tests `source==='missing'` twice.

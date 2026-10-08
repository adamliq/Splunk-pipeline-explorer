# Builder handoff: Build 181 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 181 (`builder-review-v181`). One small fix is left. Add it to the next build in a `builder-review-v182` block, or fold it into the next feature build.
**Tested with:** at 1280px and 1600px, on:
- the ES acceptance topology in [`builder-handoff-cloud-es-search-head.md`](builder-handoff-cloud-es-search-head.md);
- the managed acceptance topology with one playbook;
- the default topology;
- `docs/mockups/ov1-reference-topology.json`.

## What passes

**Clean run:** 0 `pageerror` events. All 13 view tabs render, the architecture pack builds (49 pages), and print raises no errors.

**Regression:** the default and reference topologies match Build 180, except for the service-flow attributes that fixes 3–8 were meant to change. The CV-1, CV-2 and SvcV-4 counts, flow statuses, zones, threats, rule results and OV-2 are all unchanged.

**ES acceptance:** identical to Build 179, apart from the intended fixes:
- PR-CLOUD-21 lists no link;
- the playbook joins "Response and cases (Splunk Cloud)";
- the duplicate needline is gone.

**Fixes from [`builder-handoff-build180.md`](builder-handoff-build180.md):**

| Fix | Result |
|---|---|
| 1. Findings link | Passes. The OV-3 row reads "Findings for playbooks", producer activity "Correlate, alert, serve searches", consumer activity "Contain and respond", "Alerts and response", "Near real time", "≤ 60 s", volume "Not set", transport and authentication from the link. OV-2 has one response needline from ON-4 to ON-5, drawn in the response colour, and OV-1 has one response link. SF-11 reads "Not set → 0.6 (default)", and DIV-1's Finding lists only the link. Without the link, the implied flow is unchanged |
| 2. Card fit | Passes. No child of any managed card ends below the card for `acme`, `acme-production` or `globex-production01x`, at 100%, 77% and 60%. The name clamps only where needed (Ingest Processor at 60%), and its tooltip keeps the full text |
| 3. Volume targets | Passes. SF-01 reads "322 → Not set" and SF-07 "Not set → 12 (default)". SvcV-2 reads "Entering 322 GB/day; reaching Indexing 230 GB/day." |
| 4. Not-set count | Passes. **43**, broken down as the handoff expects. The detail list has no Events/s, Average bytes or OV-3, and the OV-3 column shows "—" for the seven flows with no RF ID |
| 5. Needs attention | Passes. **9** in SvcV-2 and with SvcV-6's toggle: SF-01, 03, 06, 09, 10, 11, 12, 16 and 17 |
| 6. Default selection | Passes. SvcV-3a and SvcV-3b open on their default detail (Heavy Forwarder 1, and S12) with no rows dimmed. Clicking a row dims the others (16 rows), and Esc clears the dimming |
| 7. Wording | Passes, apart from the fix below. "1 provider"; "2 internal, 3 inferred, 1 missing output, 3 not designed"; "S7 · Indexing has one provider." on the default topology; and the default topology shows no Handling finding |
| 8. Heading spacing | Passes. "Flow register" and "Carried by system interfaces" both have 16px above them |

## Fix

### 1. One plural is still wrong in the SvcV-3a summary, P3

The SvcV-3a summary reads "**1 systems** unconnected". The number and the noun are in separate elements (`<b>1</b> systems unconnected`), so v181's plural pass, which works on single text nodes, never sees them together.

**Rule:** pluralise when the summary is built, or make the pass handle `<b>n</b> noun`.

**Check:**
- The reference topology reads "1 system unconnected".
- Every other summary item keeps its current text.

## Accepted as built

- **"GB/day today" override:** SvcV-6's flow detail now has a "GB/day today" field. It was added because the Build 180 handoff said "unless the user edits it".
  - It's saved in the topology file and survives edits to other fields and a re-import.
  - An invalid value falls back to the topology figure.

  Keep it.
- **One decimal under 10 GB/day:** values under 10 GB/day show one decimal, including "0.0", as fix 3's formatting rule says.
- **Fixes 3–8 work on the rendered pages:** they're applied by rewriting the services pages after they're drawn (`patch()` in v181), not in the v172–v175 models. That holds on screen, in the pack and in print. If those pages are reworked later, move the rules into the models.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
2. **Fix 1:** its check.
3. **Records:** add the fix to the next build's `changeRegister` entry.

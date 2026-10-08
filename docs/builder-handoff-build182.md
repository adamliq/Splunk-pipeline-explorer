# Builder handoff: Build 182 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 182 (`builder-review-v182`). One small fix is left. Fold it into the next build.
**Tested with:** at 1280px and 1600px, on:
- the ES acceptance topology;
- the default topology;
- `docs/mockups/ov1-reference-topology.json`;
- the reference topology plus one unconnected source;
- a minimal chain: Windows Event Log → Universal Forwarder → Indexer → Search Head.

## What passes

- **Clean run:** 0 `pageerror` events, and all 13 view tabs render.
- **Regression:** the default and reference topologies match Build 181 exactly, and so does the ES acceptance run.
- **Fix from [`builder-handoff-build181.md`](builder-handoff-build181.md):**
  - The reference topology's SvcV-3a summary reads "1 system unconnected" on screen, in the pack page and after print.
  - With a second unconnected source it reads "2 systems unconnected".
  - Every other summary item is unchanged.

## Fix

### 1. Summary counts of one still use the plural, P3

Build 182 fixes only the "systems unconnected" item. The summaries are built from fixed plural labels (for example `[count,'systems']`, `[count,'consumers']`), with the number in a `<b>`. So any item whose count is 1 reads wrong. On the default topology, the SvcV-1 summary reads "**1 consumers**".

**Rule:** pass every summary item through the plural helper from the Build 175 wording fix, rather than patching single phrases:
- **Singular noun at a count of 1:** "1 consumer", "1 service flow", "1 flow with no system interface", "1 attribute not set", "1 provider cut off".
- **Verb agreement:** "1 carries PII".
- **Leave alone:** labels that aren't nouns ("in place", "partial", "planned", "not deployed") stay as they are.

**Check:**
- The default topology's SvcV-1 summary reads "1 consumer".
- The reference topology still reads "1 system unconnected" and "4 services with no system".
- No summary item in SvcV-1, 2, 3a, 3b, 4, 6 or CV-2 reads "1" followed by a plural noun.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
2. **Fix 1:** its check.
3. **Records:** add the fix to the next build's `changeRegister` entry.

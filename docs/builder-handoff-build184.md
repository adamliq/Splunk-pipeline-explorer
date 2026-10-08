# Builder handoff: Build 184 recheck

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 184 (`builder-review-v184`). One small fix is left. Fold it into the next build.
**Tested with:** at 1600px and 400px, on:
- the default and reference topologies;
- the ES acceptance topology;
- an Amazon S3 after an Ingest Processor;
- five small topologies for the plural scan (a lone Universal Forwarder; a syslog source and server; a Windows Event Log → UF → Indexer → Search Head chain; that chain plus two unconnected sources; and AWS Lambda → Heavy Forwarder → Indexer).

## What passes

**Clean run and regression:**
- 0 `pageerror` events, and all 13 view tabs render.
- The default and reference topologies match Build 183 exactly, and so does the ES acceptance run.

**Fixes from [`builder-handoff-build183.md`](builder-handoff-build183.md):**

| Fix | Result |
|---|---|
| 1. S3 inspector layout | Passes. Rows: Component name; Environment and Owner; Cloud region (full width); Customer number (full width); then Group container, network fields and Host. "AWS ap-southeast-2 (Sydney)" fits the closed select (148 of 256px) |
| 2. Chip tooltip | Passes. An unset chip's tooltip reads "Region not set" |
| 3. Canvas surround | Passes. See below |
| 4. Help button | Passes. The bar reads View, + Add, Inspector, Show minimap, ? on load, after an edit, after Fit and after a zoom |

**Fix 3 in detail:**
- **Colours:** the computed values match the handoff, set in one place: frame `#10202e`, toolbar band `#15293a`, canvas `#040a10`, border `#456b85` with a 10px radius, and lighter floating controls.
- **Contrast against the canvas:** border 3.5:1, toolbar band 1.34:1, frame 1.20:1, floating controls 1.5:1.
- **Gutter:** 8px on all four sides at 1600px, and 8px at the sides on a phone. No sideways scroll at 400px, and no page scroll at 1600px.
- **Floating controls:** the Groups dock, bottom bar, zoom group and minimap keep the same insets from the canvas edge as in Build 183 (8px, and 10px for the minimap), so none touch the new border.
- **Navigation:** compared in free layout with Build 183:
  - dragging a card and dropping a palette item give identical results;
  - wheel zoom keeps the point under the pointer on the same card;
  - the minimap's viewport frame now matches the visible canvas exactly (134×57 against an expected 134×57; Build 183 was 124×58 against 122×57);
  - Fit centres the content (355px left and right, 242 and 243px top and bottom).

**Build 182 plural fix:** SvcV-1 and SvcV-2 now read "1 consumer", "1 dependency" and "1 service flow".

## Fix

### 1. The other summaries still use the plural at a count of one, P3

Build 184 fixes the plurals in SvcV-1 and SvcV-2 only. The default and reference topologies show nothing wrong, but the small topologies still produce:

| View | Text today | Should read |
|---|---|---|
| SvcV-3a | "1 systems", "1 provider cells", "1 providers cut off" | "1 system", "1 provider cell", "1 provider cut off" |
| SvcV-3b | "1 flows", "1 service pairs" | "1 flow", "1 service pair" |
| SvcV-4 | "1 flows" | "1 flow" |
| SvcV-6 | "1 service flows", "1 flows with no system interface", "1 carry PII" | "1 service flow", "1 flow with no system interface", "1 carries PII" |

Labels that aren't nouns are already right ("1 deployed", "1 data", "1 in place", "1 realised", "1 partial", "1 gap, planned or missing").

**Rule:** give the SvcV-3a, 3b, 4 and 6 summaries the same treatment as SvcV-1 and 2. Better still, give every summary item a singular label and pick it when the count is 1, on screen, in the pack and in print. SvcV-3a's "1 system unconnected" from Build 182 must keep working.

**Check:** rebuild the five small topologies above. No summary item in SvcV-1, 2, 3a, 3b, 4, 6 or CV-2 reads "1" followed by a plural noun, and "1 carries PII" uses the singular verb.

## Accepted as built

- **Fit:** Fit now uses equal margins on opposite sides, the larger of the two. In Build 183 it kept clear of the Groups dock on the left, so the margins were uneven (61px left, 353px right). Centred is what the handoff asked for.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
2. **Fix 1:** its check.
3. **Records:** add it to the next build's `changeRegister` entry.

# Builder handoff: Build 163 relationship lines

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `5200663` (Build 163: `builder-revision-panels-v162`, `builder-canvas-ux-v163`, `builder-page-ui-v163`), merged into branch `claude/build-page-layout-bl6jk1`. This review covers **relationship lines only**, on the reference topology (`docs/mockups/ov1-reference-topology.json`) at 1440×900.
**Next block:** `builder-…-v164`.
**Screenshots** (`docs/mockups/compare/`):
- `build163-lines-ref-fit.png`: Fit, 58%
- `build163-lines-uf1-100.png`: 100%, around Universal Forwarder 1
- `build163-lines-lambda-100.png`: 100%, around AWS Lambda 1

## What improved

- **Fit:** the reference topology now fits at **58%** (Build 161: 23%).
- **First hops:** data rows are aligned, so source → relay → forwarder hops are straight.
- **No line crosses a card**, and no label sits on a card (measured on all 12 connectors).
- **Connector tool:** every scenario OK (default topology).
- **Deployment Server fan-out is bundled:** one trunk from Deployment Server 1, branches to the three clients, **one** "Phone-home and app delivery" label (was three).
- **Hover:** hovering a line thickens it (2.5 → 4px).
- **Badges:** amber, with counts.
- **Click:** a single click no longer opens the object menu.

## What's wrong (world coordinates from each `path.unifiedConnector` `d`)

### 1. Same-row neighbours get a "hat" detour instead of a straight line (P1)

| Connection | Both ends at | Path drawn | Should be |
|---|---|---|---|
| Universal Forwarder 1 → Indexer 1 (Splunk-to-Splunk) | y = 170 | `M897 170 L919 170 L919 33 … L999 33 L999 170 L1021 170`: up 137px, across, down | `M897 170 L1021 170` |
| Indexer 1 → Search Head 1 (Search dispatch) | y = 170 | `M1217 170 L1239 170 L1239 33 … L1319 170 L1341 170` | straight |
| AWS Lambda 1 → Heavy Forwarder 1 (Direct HEC) | y = 666 | `M257 666 L279 666 L279 325 … L359 325 L359 666 L381 666`: **up 341px into the row above and back**, crossing Syslog Source 2 → Syslog Server 2 **twice** | straight |
| Administrator 1 → Authentication Provider · Cloud 1 (SAML) | same band row | goes up about 118px to y≈812, an 8px jog, then back down | straight |

**Likely cause:** the v163 router ("route sharing … after the existing obstacle-aware router") rejects the direct segment. Two things fit:
- the **reserved label/badge boxes** are counted as obstacles for the path itself;
- the **port is taken by another plane's line** (item 2).

The direct path crosses no card in any of the four cases.

**Fix:**
- In the router, always try the direct orthogonal path first. Accept it when it crosses no card other than its two ends. Labels and badges are placed *after* routing and must never block a route.
- Only fall back to the detour search when a card is really in the way.

**Check:** every connection whose two cards share a row and have no card between them is a single horizontal segment (`d` has one `L` after the stubs).

### 2. A management line uses the data port and overlaps the data line (P1)

Deployment Server 1 → Universal Forwarder 1 (`management:rel-1`) is `M1023 815 L1023 735 L928 735 … L919 726 L919 170 L897 170`.
- **Same port:** it enters UF1 at **(897, 170)**, the middle of UF1's **right edge**. That's exactly where the UF1 → Indexer data line leaves.
- **Overlap:** its last segment (919→897 at y=170) sits on the data line's first stub, and its vertical at x=919 continues straight into the data line's detour. At 100% the dashed green line looks as if it turns into the solid "Splunk-to-Splunk" line (`build163-lines-uf1-100.png`).
- **HF too:** the same happens on Heavy Forwarder 1: `management:rel-3` ends at (577, 666), the middle of HF's right edge.

**Fix:**
- Give each plane its own ports. **Event data** uses the left and right edge middles. **Management** enters from the **bottom** (or top), or from a side at ⅓/⅔ height when the bottom is blocked. **Access** uses the remaining ⅓/⅔ positions.
- Never end two lines at the same point.
- Where a management branch has to reach a card whose bottom is blocked (UF1 sits above UF2), run the trunk in the column gap and enter the card's side at ⅔ height (y = top + 2h/3), not the middle.

**Check:**
- No two connectors share an endpoint.
- No connector of one plane runs within 4px of, and parallel to, a connector of another plane for more than 12px.

### 3. Labels far from their lines, with very long leaders (P2)

At 100%:
- "Direct HEC HTTPS 8088" (Lambda → HF) sits **139px** from its line, down by the "Platform and access" heading. It cuts the "Unconnected · drag to connect" heading short, and its leader runs about 500px up the column gap past two cards.
- "TCP/TLS or UDP" (Syslog Source 2 → Syslog Server 2) is **133px** away.

Once item 1 is fixed, both lines are straight and short-labelled, so these should come back next to their lines.

**Rule:**
- A leader longer than 60px means the placement failed. Use the hidden-label fallback (badge on the line, label in the tooltip) instead.
- A leader must not cross another connector or run beside a card for more than its own length.

**Check:**
- Every visible label is within 60px of its own line.
- No leader crosses a connector.

### 4. Badges float off their lines at Fit (P2)

At Fit (labels hidden by the level-of-detail rule), connector badges stay where the hidden label *would* be, not on the line:

| Connector | Badge distance from its own line |
|---|---|
| AWS Lambda 1 → Heavy Forwarder 1 | 78px (floats by the "Platform and access" heading) |
| Deployment Server 1 → Universal Forwarder 1 | 51px |
| Administrator 1 → Authentication Provider | 35px |
| Authentication Provider → Search Head 1 | 31px |
| UF1 → Indexer 1 / Indexer 1 → Search Head 1 | 19 / 17px |

**Fix:** when the level-of-detail class hides labels, place each connector badge **on its path** at the label's fraction (or the midpoint), using the cached path samples. Restore the label-anchored position when labels show again. No redraw is needed: it's a transform change on the badge.

**Check:** at Fit, every `.builderEdgeIssueMarker` is within 3px of its own path.

### 5. Smaller

- **Bundle label:** it reads "Phone-home and app delivery". Add the count: "Phone-home and app delivery · 3 clients" (canvas handoff item 6).
- **Selection dimming is missing:** selecting a card leaves every other connector at opacity 1. On selection, keep the card's own connectors at full strength and dim the rest to 40% (canvas handoff item 6.2). Hover already works.
- **"Unconnected · drag to connect" heading:** it sits on top of the "Platform and access" heading (two headings stacked) and is cut off by the HEC label. Show it only on the tray item (Windows Event Log 1), or fold it into that card ("Not connected").

---

## How to verify

1. Connector tool: all OK. Add a **reference topology scenario** to `tools/builder-connector-check.js` (load `docs/mockups/ov1-reference-topology.json`, measure at Fit and at 100%) that checks:
   - same-row neighbours are straight (item 1);
   - endpoints are distinct (item 2);
   - labels are within 60px (item 3);
   - badges are within 3px at Fit (item 4).
2. Perf `allOk` on three runs (routing changes touch the redraw); space 7/7.
3. Default topology: unchanged (pixel comparison).
4. A `changeRegister` entry and the build stamp for v164.

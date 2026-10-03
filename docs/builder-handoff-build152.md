# Builder handoff: Build 152 review

> **Superseded by [`builder-handoff-build153.md`](builder-handoff-build153.md)** (Build 153 review). Kept as the record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `aaeca25` (Build 152: `builder-review-fixes-v151`, `builder-threat-review-v152`), merged into branch `claude/build-page-layout-bl6jk1`
**Replaces:** `builder-handoff-build149.md` and `builder-handoff-build150.md` as the task list (both stay as the record and the specs).
**Tools:**
- `node tools/builder-perf-check.js index.html`
- `node tools/builder-space-check.js index.html`
- `node tools/builder-connector-check.js index.html`

**Screenshots:** `docs/mockups/compare/threat-model-build152.png` (TM-1, reference topology), `build152-host-collapsed.png` and `build152-cloud-blocked-syslog.png`.

## TL;DR

- **The P0 is fixed.** 0 errors on load and across **188 buttons**. Canvas space passes at all four sizes again.
- **Fixed since Build 149/150:**
  - the hidden "TCP/TLS or UDP" label is back (connector failures down from 12 to 3);
  - collapsed hosts: lines attach to the combined card, and the card fits its rows and local-link note;
  - the blocked syslog line is a thin red dashed path with ✕ and a "Syslog → Cloud blocked" label, and it's listed in review findings;
  - the cloud indexer name follows the stack ("Splunk Cloud · acme");
  - the toast is shorter.
- **TM-1 improvements:**
  - DFD circles, E/P/D and DF-n IDs, DF pills;
  - STRIDE chips with counts, a five-cell title block, "TM-1 · 1 of 1";
  - encryption "None" in red;
  - readable IDs in both tables;
  - Repudiation, token, apps-store, sign-in and search-role threats are now seeded (26 threats on the reference topology).
- **Still to do:**
  1. A **register bug**: the STRIDE and Status cells are wrong on unencrypted flows.
  2. **Every threat is still "Open"** (the default statuses aren't applied).
  3. The TM-1 diagram is **1,792px wide** and needs sideways scrolling.
  4. Pills and lines crowd between neighbouring circles.
  5. **Performance regressed about 30%** from the Build 149 fix and is still over budget.
  6. Three connector failures and small items.

## Rules (unchanged)

- Start from the latest `index.html` on `main`; the next block is `…-v153`.
- Before uploading, run all three tools, the button and grouping sweeps, and the four OV tabs (OV-1, OV-2, OV-3, TM-1).

---

## 1. TM-1 register: wrong cells on unencrypted flows (P1)

**Now:** in the threat register, every threat on a flow with encryption "None" (TM-01 to TM-03, TM-05 to TM-07, TM-20, TM-21 on the reference topology):
- shows the **flow ID ("DF-1") in the STRIDE column** instead of the letter (T, I, D, R);
- shows the text **"None" in the Status column instead of the Status dropdown**, so the status can't be changed.

Threats on other flows and on nodes render correctly (for example TM-04 "D … Open ▾", TM-14 "D … Open ▾").

The cells are filled from the wrong fields for these rows. It looks as if the row template picks up the crossing's encryption value for "status" and the flow ID for "category".

**Fix:** build every register row from the threat object only: `category` → STRIDE letter; `status` → the Status `<select>` (Open, Mitigated, Accepted, Transferred). The crossing's encryption belongs only in the crossings table.

**Check:** every register row has a single STRIDE letter in column 2 and a Status `<select>` in column 7; changing TM-01's status saves and survives export → re-import.

## 2. Default threat statuses still not applied

**Now:** all 26 threats on the reference topology (and all 7 on the default topology) are "Open"; the summary shows "0 mitigated · 0 accepted · 0 transferred".

**Fix:** as in `builder-handoff-build150.md` item 2 and the spec (`builder-handoff-threat-model.md` item 4). On first seeding, set:
- **Mitigated:**
  - S2S with a forwarder certificate or mutual TLS;
  - SAML sign-in with MFA recorded;
  - acknowledgement + persistent queue both on;
  - syslog relay with a disk buffer.
- **Accepted:** a queue on a forwarder host (I, Low).
- **Transferred**, with owner "Splunk Cloud provider": anything in a Splunk-managed boundary (Splunk Cloud indexing and its index store).

Recorded edits always win.

**Check:** convert the reference topology's indexer to Splunk Cloud (stack "acme"). The summary then shows at least one Mitigated, one Accepted and one Transferred.

## 3. TM-1 diagram width

**Now:** the SVG's viewBox is `0 0 1792 795` inside a 1,240px box (`overflow-x:auto`). The "Customer AWS account" zone is cut at the right edge, and "Identity and administrative access" is only reachable by scrolling. In print it will shrink to about 65%.

**Fix:** lay the zones out to fit **1,200** wide:
- put the cloud-account zone **below** the customer collection zone (as in the mockup), not as a fourth column;
- stack the identity zone under the Splunk zone, or give it a narrow right column;
- keep 1:1 on screen.

**Check:** the viewBox width is ≤ 1,200; every zone is fully visible without horizontal scroll at 1440 wide.

## 4. TM-1: pills and lines crowd between circles

- **DF pills squashed between neighbours:** DF-2 (P1 → P2), DF-5 (P4 → P5), DF-7 (P3 → P8) and DF-10 (P7 → P10) sit in the 10–20px gap between two touching circles, half hidden. Put at least 60px between connected circles in a row, or move the pill above the line.
- **Lines through other shapes:**
  - the E1 → P1 line runs through E2 (Windows Event Log 1) on its way;
  - the management lines from P10 (Deployment Server) run vertically through P5 to P2.

  Route around shapes, as on the canvas.
- **A line to the edge:** a line leaves P6 to the right edge of the figure ("…"). Make sure every flow ends on a shape inside the figure.

**Check:** no pill overlaps a circle or another pill; no flow passes through a shape that isn't one of its two ends.

## 5. Performance regressed about 30%

`node tools/builder-perf-check.js index.html`:

| Scenario | Build 147 | Build 149 (+P0 guard) | **Build 152** | Budget |
|---|---|---|---|---|
| default (4 / 3) | 52 | 40 | **46** | 40 |
| fan5 (5 / 4) | 106 | 56 | **80** | 50 |
| fan8 (8 / 10) | 1,306 | 121 | **159** | 80 |
| reference (17 / 12) | 892 | 290 | **361** | 120 |

Path lookups are unchanged (89 / 137 / 588 / 757), so the new time comes from v151/v152 redraw work, not label placement. Profile `renderBuilder` at 17 components and find what v151/v152 add per redraw: TM-1 model building, host decoration and cloud card decoration are the likely candidates. **Nothing in the threat model should run during a Builder redraw;** build it only when the TM-1 tab or the pack is rendered. Then continue with `builder-handoff-canvas-performance.md` item 4.

**Check:** all four scenarios within budget.

## 6. Connector check: 3 failures left

`node tools/builder-connector-check.js index.html`:
- "Syslog Source 1 → Syslog Server 1 [data]: label over a node";
- "Syslog Source 1 → Syslog Server 1 [data]: badge over label";
- "Syslog Server 1 → Universal Forwarder 1 [data]: label over a node".

The restored label and badge now overlap the cards in some drag scenarios. Use the least-overlap candidate that keeps clear of cards, and put the badge at the label's right end.

**Check:** every scenario reports OK.

## 7. Small

- **Validate badge:** "1 errors" should be "1 error".
- **"Use" button:** add `title="Use this topology in the explorer"`.
- **Inventory Host column:** confirm `builderInventoryRows()` includes the host for hosted components and the pack table shows it (not verified here).
- **TM-1 review findings:** confirm that "Open high-risk threats" and "Threat owner not set" appear under Validate (not verified).
- **Carried over from `builder-handoff-build141.md`:** OV-2 self-needlines and pill overlaps, OV-3 doubled chip labels, OV values, OV-1 markers and tags, canvas min text 11.5px and the 100% Fit snap, and fan-out scenario 9 in the connector tool.

---

## How to verify
1. 0 `pageerror` events; the button sweep (188) and grouping sweep are clean.
2. All three tools pass (perf, space, connector).
3. TM-1 on `docs/mockups/ov1-reference-topology.json`: items 1–4 checks.
4. Shared host collapse/expand and the Splunk Cloud flows still behave as in this build.
5. A `changeRegister` entry per new block.

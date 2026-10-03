# Builder handoff: Build 150 review

> **Superseded by [`builder-handoff-build152.md`](builder-handoff-build152.md)** (Build 152 review). Kept as the record.

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Reviewed:** `main` at `892c4d1` (Build 150: `builder-threat-model-v150`), merged into branch `claude/build-page-layout-bl6jk1`
**Previous list:** [`builder-handoff-build149.md`](builder-handoff-build149.md). **None of its items are fixed in 150, including the P0**, so do that file first, then this one.
**Spec for the new page:** `builder-handoff-threat-model.md` (mockup `docs/mockups/architecture-threat-model-mockup.html`).
**Screenshot:** `docs/mockups/compare/threat-model-build150.png`. TM-1 in the OV tab with `docs/mockups/ov1-reference-topology.json`, taken with the P0 guard applied to a scratch copy.

## TL;DR

- **P0 still open:** the Build 149 palette error (`syncBuilderPaletteTarget`, Splunk Cloud palette button) still fires on every redraw. The canvas is back to 302px of controls above it, 1506px wide with page scroll; `tools/builder-perf-check.js` aborts and the space check fails at every size. **Fix it first** (`builder-handoff-build149.md` item 1: one line plus the button structure).
- **The threat model page is in and works** (tested with the P0 guard applied):
  - a TM-1 tab in the OV view;
  - a "TM-1 · Data flow diagram and trust boundaries" section in the pack contents after OV-3;
  - a title block, purpose, summary line and STRIDE chips;
  - a diagram with trust boundaries and crossing diamonds (filled red when open);
  - a boundary-crossings table;
  - an editable threat register (control, risk, status, owner, notes);
  - edits saved as `threatModel` in the topology file and kept through re-import;
  - 0 errors, no overlapping shapes, no horizontal scroll.
- **What's missing against the spec:**
  - every seeded threat is "Open" (the default status rules aren't applied);
  - several seeding rules are missing;
  - internal keys ("data:2", "node:3", "management:rel-1") are shown instead of readable IDs;
  - processes aren't drawn as DFD circles, and flows have no ID pills;
  - smaller items.

---

## 1. P0 (carried over): fix `syncBuilderPaletteTarget` first

The same as `builder-handoff-build149.md` item 1:
```
TypeError: Cannot set properties of null (setting 'hidden') at syncBuilderPaletteTarget (index.html:4011)
```
- Give `builderCloudPaletteButton148` a `<span class="builderUnconnectedTag" hidden>` child.
- Add `if(!tag)continue;` in the loop.

**Check:** 0 `pageerror` events on load; `node tools/builder-perf-check.js index.html` runs to the end; `tools/builder-space-check.js` passes.

## 2. Threat status defaults aren't applied

**Now:** with the default topology all 6 threats are Open; with the reference topology all 19 are Open (summary: "0 mitigated · 0 accepted · 0 transferred").

**Fix:** apply the default status (and owner) from the seeding table in `builder-handoff-threat-model.md` item 4 when a threat is first seeded. Recorded edits in `threatModel` always win.
- **Mitigated:**
  - S2S with a forwarder certificate or mutual TLS;
  - syslog relay with a disk buffer recorded;
  - interactive sign-in with MFA recorded;
  - acknowledgement + persistent queue both on (the D rule).
- **Accepted:** a queue on a forwarder host (I, Low).
- **Transferred**, with owner "Splunk Cloud provider": any element or store in a Splunk-managed boundary (Splunk Cloud indexing from v148, and its indexes).

**Check:** in the reference topology with the indexer converted to Splunk Cloud, at least one threat in each of Mitigated, Accepted and Transferred; a changed status still overrides the default after re-import.

## 3. Missing seeding rules

The reference topology seeds T, I, D, S and E only; **R has no threats**, and several spec rules don't fire:

| Rule (spec item 4) | Applies to in the reference topology | Now |
|---|---|---|
| Unauthenticated syslog source → **R** | Syslog Source → Syslog Server (X-1, X-3) | missing |
| Token or secret held by a process → **I** | AWS Lambda (HEC token) | missing |
| Deployment apps store → **T** | D-15 Deployment app repository | missing (the store is drawn, no threat) |
| Interactive sign-in → **S** | Authentication Provider → Search Head (X-5) | the crossing shows "None seeded" |
| Search roles → **E** | Search Head | missing |
| HEC with token → **S** | Lambda → HF (X-4) | ✅ seeded ("Sender identity or API authentication is not specified") |

**Check:** each row above produces its threat; the STRIDE chips show a count per letter (item 6).

## 4. Readable IDs instead of internal keys

**Now:** the crossings table's Flow column and the register's "Applies to" column show internal keys: `data:2`, `data:10`, `authentication:auth-rel-2`, `management:rel-1`, `node:3`. Diagram elements are `N-1 … N-17`, stores `D-4`, `D-15`.

**Fix:**
- Number flows **DF-1, DF-2, …** in drawing order; label elements **E1… (external entities), P1… (processes), D1… (stores)**, as in the mockup.
- Show "DF-3 · Universal Forwarder 1 → Indexer 1" in "Applies to", and "DF-3" in the crossings table's Flow column.
- Keep the internal key in a `data-key` attribute and in the saved register, so edits stay attached.

**Check:** no cell in either table matches `/^(data|node|management|authentication):/`.

## 5. The diagram doesn't use DFD shapes or flow IDs

Compare `threat-model-build150.png` with `docs/mockups/compare/threat-model-light.png`:
- **Processes:** drawn as a small circle joined to a rectangle. The spec and mockup use one **circle per process** with the ID and name inside (two balanced lines). Entities stay square-cornered rectangles; stores stay two parallel lines.
- **Flow ID pills:** flows have no labels. Add the small **DF-n pill** on each flow (protocol in its tooltip), red when the flow has an open T or I threat.
- **Text is cut off:**
  - "Firewalls and network de…" and "Identity and administrative acc…" are cut by their boxes;
  - each boundary's "Trust boundary" sub-line is half hidden under the first element.

  Size shapes to their text (or wrap to two lines) and start the first element below the sub-line.
- **Layout:** all 8 collection-zone processes are stacked in one tall column, leaving the right side of the diagram empty. Use the OV-2 site-row layout (`builder-handoff-ov2-diagram.md` item 1): sources and their collection in rows, then platform, then users.
- **Text size:** the drawing's viewBox is 1334 wide but is scaled to 1240 on screen. Keep 1:1 (scroll inside the figure) or keep the viewBox at 1200, so text stays at least 10px.

**Check:** every process is a circle; every flow has a DF pill that doesn't overlap a shape; no truncated names.

## 6. Smaller items

- **STRIDE chips have no counts.** Add the open-threat count per letter (red badge, or grey when 0), as in the mockup. Clicking one filters the register.
- **Encryption column:** for syslog "TCP/TLS or UDP" with TLS not confirmed it shows "Not applicable". It should say **"None"** (or "Not confirmed") in red, since this is exactly what the T and I threats are about.
- **Title block:** it has 4 cells; add **Build · prepared** ("150 · 4 Oct 2026") as the fifth, as on OV-1/2/3.
- **Page counter:** it reads "TM1 · 1 / 1"; use "TM-1 · 1 of 1", like the OV pages.
- **Review findings** (spec item 7): confirm that "Open high-risk threats" and "Threat owner not set" appear under Validate (not checked in this review).
- **Retired threats** (spec item 4): deleting a flow should move its threats to a "Retired" section on screen (not checked in this review).

## 7. Still open from `builder-handoff-build149.md`

Items 2–8 there are unchanged in Build 150:
- the hidden "TCP/TLS or UDP" label (label placement v149);
- performance still over budget;
- collapsed host lines detaching and the combined card clipping;
- the blocked-syslog band and the cloud card's name and chips;
- small items.

---

## How to verify
1. 0 `pageerror` events on load (item 1), then all three tools: perf, space, connector.
2. The OV tab → TM-1 with `docs/mockups/ov1-reference-topology.json`: statuses vary (item 2), the missing rules fire (item 3), readable IDs (item 4), circles and DF pills (item 5), STRIDE counts (item 6).
3. Pack: TM-1 after OV-3 in the contents; print at 9.5pt; edits survive export → re-import (already true).
4. Button and grouping sweeps: 0 errors.
5. A `changeRegister` entry per new block.

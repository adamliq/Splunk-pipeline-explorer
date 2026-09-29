# Builder handoff: make the OV-3 page match the mockup

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 137 (`builder-ov3-v134`, adjusted by `builder-ov-review-v136`; shown in the pack and the OV tab). Companion to [`builder-handoff-build137.md`](builder-handoff-build137.md) and [`builder-handoff-ov2-diagram.md`](builder-handoff-ov2-diagram.md). **Do the OV-2 handoff first**: OV-3 reuses its node renumbering and naming (items 1 and 6), its transport formatter (item 8) and its resource and activity defaults (item 9). Those fixes change OV-3 automatically and aren't repeated here.
**Reference:** `docs/mockups/architecture-ov3-mockup.html` (filters, row detail and grid-cell filtering all work in it).
**Side by side:** `docs/mockups/compare/ov3-mockup.png` (target), `ov3-build137-matrix.png` and `ov3-build137-grid.png` (now).
**Test topology:** `docs/mockups/ov1-reference-topology.json` (load with `loadTopologyDocument`).

## Where Build 137 stands

The **mechanics** work:
- the same flow and node IDs as OV-2;
- plane and column-group filters, "Only to review" and "Only rows with gaps", and search;
- row detail showing "Realised by", the finding and "Traces to";
- grid-cell filtering and Esc to clear;
- plane-coloured grid cells with a review ring;
- the print split into two tables.

The gaps are in presentation and in some of the values:

| # | Mockup | Build 137 |
|---|---|---|
| A | Hovering a row gives a light highlight | **Bug:** the app's global `tbody tr:hover{background:#102231}` turns the hovered row dark navy, so its text is unreadable (see RF-07 in `ov3-build137-matrix.png`) |
| B | **One matrix on screen**, with sticky Flow and Resource columns, scrolling sideways; one filter bar | On screen the matrix is split into two page tables (Exchange + participants, and Performance + assurance + security), each with **its own copy of the filter bar**; nothing scrolls, so the sticky columns never do anything |
| C | Filter **chips** with line-style swatches for planes; column-group chips; a search box labelled "Find" | Plain checkboxes; no swatches |
| D | Title block, filled banners, purpose callout, **summary as large numbers** ("15 resource flows · 13 needlines · 12 nodes · 1 flow to review · 2 attributes not set") | Metadata line, outlined banners, a generic purpose line, and a one-line summary |
| E | Plane cell with a **line swatch** ("— Event data"); **Criticality chips** (Mission critical / Essential / Routine); the resource in bold | Plain text; no swatch; criticality is plain "Not set" (no chip style exists for set values) |
| F | Values that make sense per plane | Several wrong or repeated values (item 4): search dispatch "230 GB/day modelled"; cloud "0 GB/day modelled"; phone-home "60 s poll" as both Periodicity and Timeliness; Integrity "Application response" / "Session established"; 99.9% availability on management and authentication flows; "Security telemetry + PII" on management and authentication flows |
| G | Compact producer × consumer grid (34px cells), axis label "From ↓ · To →", legend, node list beside it | Full-width 13×13 table with 89px cells, a corner header wrapping to "CONSUME R", no legend, and the node list below |
| H | Selected row highlighted (`--hi`); `aria-expanded` on rows | The detail opens, but the row isn't highlighted and has no `aria-expanded` |
| I | "Handling" shows the pack caveat for PII flows ("Privacy Act · PII") | "Not set" on every row, even PII flows, because the pack caveat is empty; nothing tells the user where to set it |

---

## 1. Fix the row hover (A), P1

Scope a light hover inside the OV pages and the pack preview:
```css
#ovWorkspace135 tbody tr:hover,
#builderPresentationOverlay .ov3Page134 tbody tr:hover{background:transparent}
#ovWorkspace135 .ov3Matrix134 tbody tr[data-ov3-flow]:hover td{background:var(--zone)}
```
Check the OV-2 register and nodes tables too (same global rule).
**Check:** hover over every row in each OV table: the text contrast stays ≥ 4.5:1 (compute from the hovered row's background and text colours).

## 2. One matrix on screen, split only in print (B and C)

- **On screen** (OV tab and pack preview), render **one** matrix with all column groups and **one** control bar above it:
  - The Flow and Resource columns are sticky (`left:0` and `left:<width of Flow>`).
  - The table gets `min-width:1500px` inside an `overflow-x:auto` wrapper, so it scrolls and the sticky columns matter.
  - The column-group toggles hide or show groups in this one table.
- **In print** (`@media print` and the downloaded pack), keep today's two tables with Flow and Resource repeated, and hide the controls. Generate both from the same row data; show one or the other with media queries rather than two DOM builds if possible.
- **Controls:** match the mockup:
  - plane chips (`button[aria-pressed]`) with a 20px line swatch in each plane's style;
  - column-group chips (Exchange, Performance, Assurance, Security);
  - the two checkboxes;
  - a "Find" search box.

  Wrap to two rows on narrow screens.

**Check:** in the OV tab, exactly one `[data-ov3-controls]` and one on-screen matrix; scrolling the matrix sideways keeps Flow and Resource in place; turning off "Performance" hides only those columns; print still shows two tables.

## 3. Page furniture and summary (D)

Reuse the OV-1 components (as OV-2 does after its item 7):
- banners;
- the five-cell title block ("OV-3 · Operational Resource Flow Matrix");
- a purpose callout: "Every resource flow from the OV-2, one row each, with the attributes an assessor checks: what triggers it, how critical it is, how often and how much, how it's protected, and how it's classified. Flow IDs and node IDs match the OV-2 page.";
- the footer with "Page n of N · OV-3".

**Summary line:** each figure in 1.05rem semibold with its label after it; "to review" and "attributes not set" in the review colour. When a filter is active, add "Showing n of N", plus the selected pair and a "Clear pair" button.

**Check:** OV-1, OV-2 and OV-3 have identical banners and title-block layout.

## 4. Correct the attribute values (F and I)

| Column | Rule |
|---|---|
| Volume | **Event data only**, from the capacity split (Build 137). Search dispatch shows "on demand" (results size isn't ingest). A source with no capacity figure shows **"Not set"**, never "0 GB/day". Management: bundle size if known, else "Not set". Authentication: sign-ins per day if known, else "Not set". Drop "modelled"; use "≈ 92 GB/day" |
| Periodicity vs Timeliness | Periodicity is how often ("Continuous", "Batched", "60 s poll", "Per sign-in", "On demand"). Timeliness is the delivery target ("≤ 60 s", "≤ 5 min", "≤ 15 min to apply", "≤ 5 s"). **Never the same text in both**; for phone-home, Timeliness is the apply target, or "Not set" |
| Integrity | Acknowledgement or queue ("Indexer acknowledgement", "UF persistent queue", "HEC indexer acknowledgement", "Signed assertion" for SAML, "Bundle checksum" for phone-home, "None (UDP can drop)"). **Never** the relationship's response field ("Application response", "Session established") |
| Authentication | The authentication type when set ("Mutual TLS certificate", "HEC token", "SAML · MFA"), else "Not set". Don't repeat the protocol ("SAML SSO" in both Transport and Authentication) |
| Availability | The connection's availability SLO when set; otherwise the event-path SLO for **event data only**; "Not set" for management and authentication unless given |
| Classification | The flow classification when set; otherwise the pack classification for event data and alerts; **"Internal"** by default for fleet management and authentication, marked "(default)" |
| Handling | The pack's handling caveat on flows whose classification includes PII; "None" on flows without PII. When the caveat is empty and a PII flow exists, show "Not set" **and** add an appendix line "Set the PII handling caveat in Export → Pack options" |

The Transport column uses the OV-2 formatter (`builderOvTransport138`, OV-2 handoff item 8).

**Check:** with the test topology:
- no row shows "0 GB/day";
- search dispatch Volume is "on demand";
- no row has the same Periodicity and Timeliness text;
- no Integrity cell contains "response" or "established";
- management and authentication rows show "Internal (default)";
- after setting the handling caveat, the PII rows show it.

## 5. Cell styling (E and H)

- **Plane:** a 20px line swatch in the plane's style before the label, as in the mockup.
- **Criticality chip:** Mission critical in the response colour at 18% tint; Essential in the data colour at 16% tint; Routine in the zone colour; "Not set" in the review chip.
- **Resource** in semibold `--ink`; derived values (OV-2 item 9) in muted italic with "(derived)".
- **Producer and Consumer nodes:** the ID in small mono on its own line, then the name. For several consumers, one line each (not joined with ";").
- **Selected row:** a `--hi` background on the row and its detail row; `aria-expanded="true|false"` on the row; Enter/Space toggles; the detail row spans all columns, with its content sticky-left so it stays visible when the table is scrolled.

**Check:** a set criticality renders as a chip; selecting a row sets `aria-expanded="true"` and highlights it; keyboard toggling works.

## 6. Producer × consumer grid (G)

- **Compact:** 34×30px cells, 2px gap; corner cell "From ↓ · To →" in 9.5px mono (no wrapping); column headers are the numbers only ("1 … 13"), with full names in `title`; row headers "ON-1 …".
- Empty cells: the `--zone` fill, no border. Filled cells: styled by plane (solid, dashed or dotted border and tint, as now), the count centred, and a review ring when any of its flows is flagged. The selected pair gets an outline 4px outside the ring.
- **Legend** under the grid: the four plane swatches plus "Contains a flow to review".
- **Node list beside the grid** (two columns on wide screens, below it on narrow ones): "ON-1 · Sydney event sources" …
- Print: the grid and its list stay on one page.

**Check:** the grid is no wider than 13 × 36 + 60 px; the corner header doesn't wrap; the legend is present; clicking a cell filters the matrix and outlines that cell.

## 7. Cross-page consistency

After the OV-2 rework, OV-3 must list:
- the same node IDs and names (renumbered in site order);
- the inferred alerts-and-response flows, marked "(inferred)" in Transport;
- the derived resource and activity values.

Add an automated check that the flow IDs, needline IDs and node IDs on OV-2 and OV-3 are identical and in the same order.

---

## Acceptance (screenshot and compare)
1. Load `docs/mockups/ov1-reference-topology.json`; open OV → OV-3 and the pack's OV-3 pages at 1280 wide, light and dark. Compare with `docs/mockups/compare/ov3-mockup.png`: rows A–I of the gap table should match in kind.
2. Automated: 0 `pageerror` events; hover contrast ≥ 4.5:1 on every OV table row (1); one control bar and one scrolling matrix on screen, two tables in print (2); the value rules in 4; the grid size and legend in 6; the OV-2/OV-3 ID match in 7.
3. Phone width: the matrix and grid scroll inside their boxes; no page scroll sideways; the control chips wrap.
4. Add a `changeRegister` entry for the new block.

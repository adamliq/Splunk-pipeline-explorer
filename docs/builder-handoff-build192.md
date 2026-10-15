# Builder handoff: Build 192 recheck (SV, AV, StdV-1, activity and matrix views)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 192. Builds 188 to 192 add five blocks:
- `builder-sv-v1xx`;
- `builder-av-v1xx`;
- `builder-stdv1-v1xx`;
- `builder-activities-v1xx`;
- `builder-sv3-sv5b-cv7-v1xx`.

They also make in-place edits to `context171`, `model172` and `status173`.

Nine small fixes are left. Add one block, `builder-review-v193`. Fixes 1 and 8 are small edits in place: three theme strings and one footer.

**Tested with:**
- the default, reference (`docs/mockups/ov1-reference-topology.json`) and zones (`docs/mockups/sv-zones-topology.json`) topologies;
- the edits and load balancer scenes in each handoff's checks;
- small scenes with one of each finding, for singular wording;
- screenshots at 1440 against `docs/mockups/compare/`;
- layout at 400, 768, 1280, 1440 and 1920 pixels, light and dark.

## What passes

**Clean run and regression:**
- 0 `pageerror` events.
- All 25 view tabs render in the handoffs' order:
  - AV-1, AV-2;
  - OV-1, OV-2, OV-3, OV-5a;
  - DIV-1, TM-1;
  - CV-1, CV-2, CV-6, CV-7;
  - SvcV-1 to SvcV-6, with SvcV-5 in place;
  - SV-1, SV-2, SV-3, SV-5b, SV-6;
  - StdV-1.
- Against Build 187, on the three topologies:
  - the text of OV-1, OV-2, OV-3, DIV-1, TM-1, CV-1, CV-2, SvcV-1, SvcV-3b and SvcV-4 is unchanged;
  - SvcV-2, SvcV-3a and SvcV-6, and SvcV-3b's selection details, differ only by the SI IDs the SV handoff adds, for example "SI-3 · Universal Forwarder 1 → Indexer 1".
- No page scrolls sideways at 400 (light and dark), 768 or 1440 pixels.

**Against the five handoffs:**

| Handoff | Result |
|---|---|
| SV-1, SV-2, SV-6 | **Model and counts:** the model matches the prototype on all three topologies, with every count in the handoff's checks.<br>**Edits:** port 9997 on SI-3, the Heavy Forwarder 1 → Indexer 1 link becoming SI-8, and the DMZ zone all pass.<br>**Load balancers:** Deploy VIP (SNAT) passes; the HEC DNS scene is fix 4.<br>**Buttons:** "Edit link in the Builder" opens the link with Port focused, and "Open SF-03 in SvcV-6" selects SF-03. |
| AV-1, AV-2 | **AV-1:** all 11 issues, with their texts and order. The facts and the views table match. Page numbers come from the pack and match it.<br>**AV-2:** 79 terms on the reference topology and 50 on the default, with the search hints.<br>**Edits:** I-01 and I-03 change as specified, and a CV-1 owner removes that part of I-10.<br>**Files:** assumptions round-trip, an older file opens as Draft, and invalid values are dropped. |
| StdV-1 | **Model:** matches the prototype on all three topologies and after all eight edits.<br>**Owner assessment:** status and note, the tiles, the owner mark, save and load, and the cleaning all pass. STD-01 has no owner box. |
| OV-5a, SvcV-5, CV-6 | **Models:** the activity model, SvcV-5 and CV-6 match the prototypes, also after the edits.<br>**CV-2 fix:** it counts additional data relations. |
| SV-3, SV-5b, CV-7 | **Models:** all three match the prototypes on their topologies.<br>**SvcV-4 status:** it returns `nodes` and `flow`. For S1.2: `{"code":"partial", …, "nodes":[{"id":8,"text":"no output to an indexer"}], "flow":"SF-03"}`. |
| Pack and print | **Pack switches:** each view has one, with the right label, saved in `exportPreferences.packSections`. An older file opens with all of them on.<br>**Order:** AV-2 sits after StdV-1 and before the inventory.<br>**Print:** all 12 views have print copies with no controls, and StdV-1 prints the owner evidence. |
| Look | **Match their mockups:** CV-7, SV-5b and OV-5a.<br>**SV-3:** matches apart from fix 2.<br>**AV-1, AV-2, StdV-1, SV-1, SV-2 and SV-6:** the content matches the prototypes, but the title fonts are lost (fix 1). |

## Fixes

### 1. Six pages lose their title fonts, P2

**Where:** AV-1, AV-2, StdV-1, SV-1, SV-2 and SV-6. OV-5a, SvcV-5, CV-6, SV-3, SV-5b and CV-7 are fine.

**What happens:** headings, issue titles, summary numbers, filter buttons and chips use the inherited font: regular weight, 15px. For example:
- AV-1's issue titles and "Cross-cutting issues" aren't bold;
- summary numbers ("25 views", "17 systems") are regular at 13.4px instead of semi-bold at 16.8px;
- SV-6's plane chips are 15px instead of 11.8px;
- AV-2's terms aren't bold.

**Cause:** `theme188`, `theme189` and `theme190` set `--font-title:inherit;--font-body:inherit`. A custom property set to `inherit` copies its parent's value, and no ancestor defines one, so both stay undefined. Every `font:` shorthand that uses them is then invalid and resets to the inherited font.

**Rule:**
- Set the fonts as `theme191` and `theme192` do: `--font-title:system-ui,sans-serif;--font-body:system-ui,sans-serif`.
- `theme189` also lacks `--ok` and `--d-collect`, so AV-1's "Generated" chips have no colour and its purpose bar is plain. Add `--ok:var(--ovMgmt);--d-collect:var(--ovData)`, as `theme190` has.

**Check:**
- On each of the six pages, `getComputedStyle(page).getPropertyValue('--font-title')` isn't empty.
- On the reference topology:
  - AV-1's issue and section titles are bold;
  - the summary numbers are weight 600 at about 16.8px;
  - body text is 14px;
  - AV-1's "Generated" chips are green, as in the mockup;
  - SV-6's plane chips are semi-bold at 11.8px.
- No page scrolls sideways at 400, 768 or 1440 pixels.

I tried these values in Build 192. They bring the six pages to the mockups' look with no new overflow.

### 2. SV-3's bottom tables are cut off, P3

**What happens:** "Interfaces by location" and "Most connected systems" are each 940px wide, in a frame of about 610px (575px at 1280) at every window size. Unless the reader scrolls inside the frame:
- the Multisite and Cloud columns are hidden, including the "Sydney → Multisite 5" that the Locations finding names;
- Indexer 1's badges are cut: "Missing outpu…" is clipped, and "Add to topology ×2" doesn't show.

**Cause:** the page's base CSS has `table{border-collapse:collapse;width:100%;min-width:940px}`, and it applies to `table.lm` and `table.tl`.

**Rule:** `.matrixPage192 table.lm,.matrixPage192 table.tl{min-width:0}`.

**Check:**
- At 1280, 1440 and 1920 pixels, each frame's `scrollWidth` equals its `clientWidth`.
- All six location columns show.
- Indexer 1's row shows all three badges, wrapping, as in the mockup.
- At 400 pixels, the tables scroll inside their frames and the page doesn't.

### 3. AV-1 doesn't list SV-3, SV-5b and CV-7 under any issue, P3

My SV-3 handoff said AV-1 picks the new views up with no change. That covers the views table, but each issue's views are a fixed list. So the three new views show "—" for issues, and "Shown in" undercounts.

**Rule:** add the views to these lists:

| Issue | Add | What they show |
|---|---|---|
| I-01 Forwarders with no output | SV-3, SV-5b | Missing output; blocked shares |
| I-02 Personal information crosses the network in clear | SV-3 | Plaintext |
| I-03 Detection and response chain not in place | SV-5b, CV-7 | SOAR Cloud blocked; S12 not deployed |
| I-06 Systems with no interface | SV-3, SV-5b | Empty row and column; blocked A1.2 |
| I-07 Exchanges the topology doesn't have | SV-3, SV-5b | Inferred interfaces |
| I-08 Links with no port | SV-3 | Port not set |
| I-09 No high availability for indexing or search | CV-7 | C3.3 and C4.3 wait on S8 and S11 |
| I-11 Capabilities with nothing in the topology | CV-7 | C1.4 and C5.1–C5.3 waiting |

**Check**, on the reference topology:
- **Order:**
  - High: I-01 (12 views), I-03 (10), I-02 (8), I-04, I-05.
  - Medium: I-07 (6), I-06 (5), I-09 (5), I-08 (4), I-11 (4), I-10 (3).
  - This replaces the order in the AV handoff's check.
- **Views table, "Issues shown":**
  - SV-3: "I-01, I-02, I-06, I-07, I-08";
  - SV-5b: "I-01, I-03, I-06, I-07";
  - CV-7: "I-03, I-09, I-11".
- With the three views switched off in the pack, the counts drop back.

### 4. SV-2 numbers DNS round robin connections last, P3

**Steps:** run the second scene of the SV handoff's check 6:
1. Open the reference topology.
2. Put a DNS round robin load balancer, "HEC DNS", in front of Heavy Forwarder 1.
3. Add Heavy Forwarder 2 to its pool.

**What happens:**
- The connections "SI-7 + SI-8" and "SI-7 + SI-9" come after every other connection.
- Their rules are FW-9 and FW-10, and their path is NP-7.
- The handoff expects FW-2 and FW-3. Without the load balancer, AWS Lambda 1's rule is FW-2.

**Rule:**
- Connections follow SI order.
- A DNS round robin or floating-VIP connection goes where its client-side interface is (SI-7). There is one per member, in member-side SI order.
- The same applies to deployment clients through such a pool.
- Paths and rules keep their numbering by first connection.

**Check**, in the scene:
- FW-1: Sydney ⇒ Indexer 1 (SI-3, SI-16, SI-17).
- FW-2 and FW-3: AWS ap-southeast-2 ⇒ Heavy Forwarder 1 and Heavy Forwarder 2, 8088, "Ready to request".
- FW-4 to FW-10: from Melbourne ⇒ Deployment Server 1 (8089) to Sydney ⇒ Search Head 1 (8089).
- NP-2 is AWS ap-southeast-2 ⇒ Sydney, and Melbourne ⇒ Sydney becomes NP-3.
- Without a load balancer, or with a proxy one such as Deploy VIP, nothing changes.

### 5. Four findings use the plural for one item, P3

With one item, which the default topology gives, these four findings use the plural. They mostly follow my handoffs' text, which gave only the plural.

| View, finding | Now | Should read |
|---|---|---|
| SV-1, plaintext | "SI-1 has no TLS. All carry PII in the event data." | "SI-1 has no TLS. It carries PII in the event data." |
| SV-1, TLS | "1 of 2 network interfaces require TLS." | "1 of 2 network interfaces requires TLS.", as StdV-1 already writes |
| SV-6, in clear | "SI-1 carry PII with no confidentiality: None (UDP 514). Their integrity is None too: …" | "SI-1 carries PII with no confidentiality: None (UDP 514). Its integrity is None too: …" |
| SV-3, hub | "Syslog Server 1 is in 2 interfaces (1 in, 1 out), and 1 of them need attention." | "…and 1 of them needs attention." |

With two or more, keep the current text. For example:
- "SI-1, SI-5 have no TLS. All carry PII…";
- "8 of 10 network interfaces require TLS.";
- "SI-1, SI-5 carry PII… Their integrity…".

**Check:**
- The default topology gives the singular texts, and the reference topology the plural ones.
- Other single counts already read correctly, for example "1 interface has no Builder link, so its protection is not set" and "C2.1 waits on it".

### 6. AV-1's issue titles are uppercase and muted, P3

**What happens:** even with fix 1, AV-1's issue titles are uppercase, letter-spaced and muted ("FORWARDERS WITH NO OUTPUT"). The mockup shows "Forwarders with no output" in bold ink, the most prominent text on each card.

**Cause:** the page sits inside the OV-1 shell. Its `.ov1Visual137 h3` rule styles small labels: uppercase, `.1em` letter-spacing and muted. `.avPage189 .issue h3` sets only the font, so the rest carries over.

**Rule:** add `text-transform:none;letter-spacing:normal;color:var(--ink)` to `.avPage189 .issue h3`.

**Check:** all 11 titles are in sentence case, bold, in the ink colour, in light and dark.

### 7. SV-1's legend splits words, P3

**What happens:** at every width, the legend under the diagram splits words mid-word: "management" breaks after "manag", and "authentication" after "authenti".

**Cause:** the legend keys inherit `overflow-wrap:anywhere`, so flex shrinking squeezes them narrower than one word.

**Rule:** `.svPage188 .key{overflow-wrap:normal}`.

**Check:** no legend word splits at 400, 1280 or 1440 pixels, and at 400 the legend wraps by whole keys.

### 8. StdV-1's footer says Build 190, P3

**What happens:** the footer is fixed text, "StdV-1 · 1 of 1 · Build 190", while the title block shows 192.

**Rule:** use the build number, as the other footers do (`#topologyBuilder`'s `dataset.buildNumber`).

**Check:** the footer shows the same build as the title block, on screen, in the pack and in print.

### 9. AV-1 and AV-2 write the viewpoint differently, P3

**What happens:** every other view writes "<viewpoint> · DoDAF V2.0", for example "Systems · DoDAF V2.0". AV-1 and AV-2 write "All (DoDAF V2.0)".

**Rule:** use "All · DoDAF V2.0", as the AV handoff asks.

**Check:** the Viewpoint cell of all 25 views uses "·".

## Accepted as built

- **Summary headlines,** for example "18 interfaces in 272 possible pairs":
  - they use the workspace's uppercase `h3` style, as SvcV-4 and SvcV-6 have since Builds 172–173;
  - the mockups show sentence case;
  - they stay as they are, for consistency. Only AV-1's issue titles change (fix 6).
- **SV-1, SV-2 and SV-6** open with the SvcV-6 toolbar line above the banner ("SV-6 · Systems Resource Flow Matrix"), as SvcV-6 does.
- **OV-5a part titles** can split a long word in a wide font:
  - In Linux's fallback font, "authentication" in A1.2 splits at 1440 pixels. That's `overflow-wrap:anywhere` working as intended in nine narrow columns. The fonts on Mac and Windows are narrower.
  - `break-word` doesn't fix it: it pushes column A1 into A2 at 1280.
  - `hyphens:auto` would break at a syllable instead, since the page is `lang="en"`. This is optional; headless Chromium on Linux has no hyphenation dictionary, so it couldn't be tested here.
- **AV-1's "Also in the pack"** lists the connection sections' sub-pages ("Fleet management · transport p. 38") where the mockup had one entry per plane. The page numbers match the pack.
- **AV-1's counts** are 25 views, 16 generated from the topology and 61 pages. That is three more than the mockup, for SV-3, SV-5b and CV-7.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" is unchanged, apart from the AV-1 order in fix 3.
2. **Fixes 1–9:** the checks in each item.
3. **Records:** add them to the next build's `changeRegister` entry.

# Builder handoff: two canvas faults

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 200.
**One new block pair, at the end of the page (before `</body>`):**
- `<style id="builder-canvas-faults-v201-styles">`, containing [`docs/mockups/builder-canvas-faults-prototype.css`](mockups/builder-canvas-faults-prototype.css);
- `<script id="builder-canvas-faults-v201">`, containing [`docs/mockups/builder-canvas-faults-prototype.js`](mockups/builder-canvas-faults-prototype.js).

There are no in-place edits. The style block overrides Build 200's rules, and the script adds one event listener. Paste both files as they are, then add the build records (see "Build records").

**It can go in the same build as the other two Build 201 changes,** with one set of build records:
- the Parsing laboratory block ([`builder-handoff-parsing-lab-examples.md`](builder-handoff-parsing-lab-examples.md));
- the cleanup patch ([`builder-handoff-cleanup-docking.md`](builder-handoff-cleanup-docking.md)).

The three touch different parts of the page, and can go in in any order.

**Mockup (the target):** [`docs/mockups/builder-canvas-faults-mockup.html`](mockups/builder-canvas-faults-mockup.html). Three scenes have the block pair applied, and the two "Today" scenes are Build 200. The screenshots are `docs/mockups/compare/canvas-faults-*.png`.

**Tested first:** the block pair was appended to Build 200 and run. The results under "Check before uploading" come from that run.

## Why

### 1. Chips over the first stage row

**What you see,** from 761 px wide:
- **Reference topology** (`docs/mockups/ov1-reference-topology.json`): put Universal Forwarder 2 in a container. Its container chip, "Zone · Group 1", takes a third row, over "Source acquisition".
- **Zones topology** (`docs/mockups/sv-zones-topology.json`), as shipped: 10 of its 20 cards.
  - **On 7, the zone chip takes a third row.** Syslog Source 2's "Zone · Melbourne network" covers "Event emission".
  - **On 3, the zone chip is wider than the card** and wraps onto a second line inside itself. Deployment Server 1's "Zone · Sydney management" covers its first stage row the same way.

**The cause:**
- **Cards are 224 px tall from 761 px.** `builder-canvas-ux-v163-styles` sets the height, and `builder-default-row-v166-styles` repeats it.
- **The chip box is 38 px tall,** room for two rows. The unnamed `<style>` right after `<script id="builder-canvas-ux-v163">` sets it: `height:38px;min-height:38px!important`.
- **Nothing keeps the chips to two rows, or a chip to one line.** A third row, or a chip's second line, spills out of the box and is drawn over the first stage row.
- **When the zone takes a third row:** the region doesn't fit beside Env, and the zone doesn't fit beside the region. Beside "Env · Production", a region doesn't fit if it is wider than 59 px: Melbourne, us-east-1 and Region not set, for example.
- **Why a container brings it out:** the zone chip shows the component's network zone or, without one, its container's name (`networkNodeZone`). With neither, the chip is hidden.

**Why the chips keep to two rows, rather than the stage rows moving down.** The Inspector tabs handoff said the stage rows need to start below the last chip row. Tried on Build 200, that doesn't work while cards are a fixed height:
- **Let the chip box grow:** Universal Forwarder 2's stage rows move 25 px down. Its "1 PIPELINE SET" band then ends 24 px below the card, over the link label under it. The card's content already fills its 224 px.
- **Let the card grow:** the canvas layout is built on the 224 px height. `builder-canvas-ux-v163` takes every card's bottom as `p.y+224` and puts the platform band 40 px below the lowest, and `builder-splunk-managed-v176` fixes managed cards at 224 px. Changing that is a larger job, with its own checks.

The stage rows already start just below the second chip row. With the chips kept to two rows, they always start below the last one.

### 2. The − button over a container's name

**What you see,** at every width: put Syslog Server 1 in a container named Sydney, and the container's name reads "−dney · Region".

**The cause:**
- **The container's name is a button.** `.unifiedGroupBox button{position:absolute;left:8px;top:-13px;…}` in `builder-unified-canvas-styles` places it.
- **The − is also a button in the container.** Its own rule, `.builderGroupCollapseButton{position:absolute;z-index:3;right:7px;top:5px;…}` in `builder-large-topology-navigation-styles`, has the lower specificity: 0,1,0 against 0,1,1.
- **So the − gets the name's `left:8px` and `top:-13px` as well,** and its z-index of 3 puts it over the name.

The Inspector tabs handoff gave the one-line fix: `.unifiedGroupBox .builderGroupCollapseButton{left:auto;right:8px}`. The block has that line as given, plus one rule for long names: with the − at the right, a name longer than the container would run under it.

## The design

### 1. Chips, from 761 px

- **One line each,** at most the card's width (168 px inside its padding), ending with … if longer.
- **The region and the zone share the second row when they meet there.**
  - While the chips are placed, each counts as at most half the row, so the zone always fits beside the region.
  - Then each grows towards its own width. One that needs less than half keeps its width, and the other takes the rest.
- **Env and the first row are unchanged.** The region still goes beside Env when it fits, with one exception, below.

| A card's chips in Build 200 | With the block |
|---|---|
| The region fits beside Env, and the zone has the second row to itself | Unchanged |
| The region starts the second row, and the zone fits beside it | Unchanged |
| No zone chip: it is hidden when it repeats the environment, or when there is no network zone or container | Unchanged, apart from the exception below |
| **The region starts the second row, and the zone doesn't fit beside it** | The zone moves up beside the region. Each gets up to half the row; one that needs less keeps its width, and the other takes the rest |
| **A zone wider than the card** | One line, ending with … |

What the changed cards show, at 1440 px:

| Card | Region chip | Zone chip |
|---|---|---|
| Syslog Source 2, zones topology | Melbourne, 73 px, whole | Zone · Melbourne network, the other 92 px, ending with … |
| Indexer 1, zones topology | Multisite, 61 px, whole | Zone · Splunk core, 104 px, ending with … |
| AWS Lambda 1, zones topology | AWS ap-southeast-2, half the row (83 px), ending with … | Zone · AWS VPC, half the row (83 px), ending with … |
| AWS Lambda 1, reference topology, in a container named Perth | AWS ap-southeast-2, 83 px, ending with … | Zone · Perth, 82 px, whole |
| Deployment Server 1, zones topology: a zone wider than the card | Sydney, beside Env as before | Zone · Sydney management, the whole second row (168 px), ending with … |

**One exception: Env · Test.** While the chips are placed, a region counts as at most 82 px. Beside every Env chip but one, that changes nothing: the region goes beside Env exactly when it did. "Env · Test" is the exception, at 67 px the only Env chip narrower than 84 px:
- **Beside it, a region wider than 98 px used to start the second row.** Now it stays beside Env, ending with … at 98 px.
- **On a card whose zone took a third row,** that is part of the fix: the zone then has the second row.
- **On a card whose chips fitted,** it changes the layout in two cases: there is no zone chip, or the zone chip is narrow enough to have shared the second row with that region (under 67 px; "Zone · A" is 60 px). The region then ends with … beside Env, where it had a row of its own.

### 2. Tooltips

- **A chip or container name that ends with …** shows its full text as a tooltip when the pointer is on it.
- **Only then.** A chip that fits gets no tooltip, and one that stops being cut, after a rename say, loses it.
- **A tooltip set by other code is kept.** Amazon S3 cards already put the full region on their region chip.

### 3. The − button

- **At the top right of the container,** 8 px in, level with the name.
- **The name stops 48 px short of the container's width,** so a long name ends with … before the button. Its tooltip has the whole name and type.
- **Only containers with a − button** limit their name.
- **At every width,** phones included: the fault is the same there.

### 4. Unchanged

- **760 px and below:** the card grows to fit its chips, as in Build 200.
- **Zoomed out:** medium and low detail hide the chips, as before.
- **Everything else:** card sizes, card and container positions, links, the collapsed container card, and every other view.

## How the block works

- **Chips:** two rules in `@media (min-width:761px)`, with the same selector start as the 38 px rule, `body[data-view="builder"] #topologyBuilder .builderNode>.unifiedNodeMeta`.
  - **Every chip:** `max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`.
  - **The region and the zone:** `flex:1 1 calc(50% - 2px); max-width:max-content`.
    - The browser decides whether a chip fits on a row from its flex basis, capped by its max-width, so each counts as at most half.
    - `max-width:max-content` stops each at its own width. With equal grow factors, the space one doesn't need goes to the other.
  - **No `:has()` on the chips.** Limiting the half-row rule to cards with a zone chip, with `.unifiedNodeMeta:has(>span:nth-child(3):not([hidden]))`, made each redraw 6 to 8 ms slower on the reference topology, and 14 to 18 ms slower with two containers on it (see check 1). Without it, the rule also reaches cards with no zone chip, where it changes nothing but the Env · Test case.
- **The container:** two rules, at every width.
  - The − button: `left:auto;right:8px`.
  - The name, when the container has a − button: `max-width:calc(100% - 48px)`, with an ellipsis.
- **Tooltips:** the script adds one `pointerover` listener to the document.
  - On a chip or container name in `.builderCanvas`, it compares `scrollWidth` with `clientWidth` and sets or removes the title.
  - It marks the titles it sets with `data-cut-title201`, so it never removes a title it didn't set.
  - It does nothing when the canvas redraws, so redraw times don't change.
- **The container rule's `:has()`** costs nothing measurable: containers are few. Build 200 already uses `:has()` in 29 places.

## Build records

After the block pair:
- **`changeRegister`,** group "Explorer foundations":
  `['Canvas chips and container names','From 761px a card’s chips keep to two rows, so a long region or zone no longer covers the first stage row. A chip or container name that doesn’t fit ends with … and shows its full text on hover. A container’s collapse button sits at its top right instead of over its name.',true]`.
- **In a build of its own:** `#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix, as Build 200 did.
- **In the same build as the Parsing laboratory block or the cleanup patch:** one set of these covers them all.

## Found while testing (not changed)

**A container's name can sit under the card above it.**
- With Auto layout, a container directly below another card in the same column starts so close to that card that the card covers the top 15 px of the container's name, which is 27 px tall.
- Try it: reference topology, put Heavy Forwarder 1 in a container. Syslog Server 2's card covers the top half of the container's name.
- Build 200 is the same. There a long name wraps onto two lines, and the first is half hidden.
- The block doesn't change it. The fix is room for the name between the rows, a layout change of its own.

## Check before uploading

All in the Builder at zoom 100%, unless stated. "Build 200" is the comparison: each check was run on Build 200 and on Build 200 with the block pair.

### 1. Regression

- 0 `pageerror` events in every check below, from 400 to 1920 px.
- **Every view's text** (all OV workspace pages and Validate) is identical to Build 200 on three topologies: 87 of 87.
  - the default;
  - reference: `docs/mockups/ov1-reference-topology.json`;
  - zones: `docs/mockups/sv-zones-topology.json`.
- **The three repo tools:**
  - `tools/builder-space-check.js` and `builder-connector-check.js` print the same output as on Build 200.
  - `tools/builder-perf-check.js` gives the same redraw times, within run-to-run noise. Over three runs on each page, the slowest median per scenario was:

    | Scenario | Budget | Build 200 | With the block |
    |---|---|---|---|
    | default | 40 ms | 40–44 ms | 39–53 ms |
    | fan5 | 50 ms | 56–66 ms | 56–62 ms |
    | fan8 | 80 ms | 81–92 ms | 69–85 ms |
    | reference | 120 ms | 108–113 ms | 99–114 ms |

    The 53 ms is one run's moved-card redraw; that page's other two runs gave 44 and 39 ms. In the test container both pages go over the default, fan5 and fan8 budgets.
- **The CSS's own cost, measured in one page.** The block's styles were switched on and off between redraws: 24 rounds, each variant in turn, 72 timed redraws per variant after a warm-up. The median redraw changed by:

  | Scenario | The block's CSS | The same, with `:has()` limiting the chip rule to cards with a zone chip |
  |---|---|---|
  | fan8 | −0.1 ms | +2.9 ms |
  | reference | −0.3 ms | +6.4 ms |
  | reference, with two containers | +2.6 ms, on 77 ms | +13.6 ms |

  An earlier run gave the same picture: +0.4, −1.8 and +2.1 ms for the block's CSS, against +2.3, +8.4 and +18.4 ms with `:has()`.

### 2. Every card's chips

The default, reference and zones topologies, at 1024, 1280 and 1920 px. Two containers hold every component that had none: "Melbourne production data centre" and "Perth". That is 41 cards at three widths, 123 in all.

| | Build 200 | With the block |
|---|---|---|
| Chips in two rows, clear of the stage rows | 54 | The same 54, every chip in the same place, at the same size, with the same text |
| A third chip row, over the first stage row | 48 | None: two rows |
| A chip on two lines, over the first stage row | 21 | None: one line |
| Chips ending with … | None | 81, each with its tooltip |
| Card heights, and where the first stage row starts | | The same on all 123 |

**As shipped, with no containers added:**
- The default and reference topologies have no faulty card.
- The zones topology has 10 at each width: 7 with a third row, and 3 with a chip on two lines.
- With the block, all 30 are fixed, and the other 93 are unchanged.

**At the canvas's own zoom, at 1280 and 1920 px,** with the same two containers:
- **Build 200:** chips cover a stage row on 4 cards (default topology, 1920 px), 9 (reference) and 10 (zones). The − covers the name of every container.
- **With the block:** none of either.

### 3. Universal Forwarder 2

Reference topology, with Universal Forwarder 1 and 2 in a container:

| Width | Build 200 | With the block |
|---|---|---|
| 1024, 1440 and 1920 px | Three chip rows. The last ends 130 px down the card, over the first stage row, which starts at 109 px | Two rows. The last ends at 108 px, above the first stage row at 109 px, as on Universal Forwarder 1 |
| 400 and 700 px | Three rows, and the card grows to 254 px | The same |

### 4. Containers

| Check | Build 200 | With the block |
|---|---|---|
| Sydney, at 1440 px | − on "Sydney": "−dney · Region" | − at the top right; the name reads "Sydney · Region" |
| "Melbourne production data centre", around one card (225 px wide) | The name wraps onto two lines, 45 px tall, with − on its first letters | One line, 174 px, ending with …; − at 193 px. Tooltip: "Melbourne production data centre · Region" |
| The same two containers at 400 and 700 px | − on both names | − clear of both names |
| Click − with the mouse | Sydney collapses | The same |
| Click the collapsed card | Sydney expands, with − on its name | Sydney expands, with − at the top right |
| Free place layout | − on the name | − clear of the name |
| Zoomed out to 35% | Chips hidden | The same |

### 5. Tooltips and clicks

| Check | With the block |
|---|---|
| Point at Universal Forwarder 2's zone chip, which ends with … | Tooltip "Zone · Group 1" |
| Point at a chip that fits, such as Sydney | No tooltip |
| Point at a container name that ends with … | Tooltip with the whole name and type |
| Point at a container name that fits | No tooltip |
| Rename Universal Forwarder 2's container to DMZ, then point at the chip again | No tooltip: the chip fits now |
| Click a card's zone chip | The card is selected, as in Build 200 |

### 6. The Env · Test exception

Universal Forwarder 1 on the reference topology, at 1440 px, with its Env, region and zone set as below. "/" starts a new chip row.

| Env, region, zone | Build 200 | With the block |
|---|---|---|
| Test, AWS ap-southeast-2, none | Env · Test / AWS ap-southeast-2 | Env · Test, AWS ap-southeast-2 ending with … at 98 px |
| Production, AWS ap-southeast-2, none | Env · Production / AWS ap-southeast-2 | The same |
| Test, Melbourne, none | Env · Test, Melbourne | The same |
| Test, AWS ap-southeast-2, DMZ | Env · Test / AWS ap-southeast-2 / Zone · DMZ, over the first stage row | Env · Test, AWS ap-southeast-2 ending with … / Zone · DMZ |
| Test, "Sydney North 2" (101 px), A | Env · Test / Sydney North 2, Zone · A | Env · Test, Sydney North 2 ending with … / Zone · A |

Every case's chips end above the first stage row with the block.


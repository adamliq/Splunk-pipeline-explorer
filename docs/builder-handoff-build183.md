# Builder handoff: Build 183 recheck (Amazon S3 fields and the canvas surround)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 183 (`builder-s3-fields-v183`). Add one block, `builder-review-v184`, with wrappers only.
**Tested with:**
- the default topology plus an Ingest Processor and an Amazon S3 after it, at 1600px;
- the default and reference topologies, and the ES acceptance topology, for regression.

## What passes

**Clean run and regression:**
- 0 `pageerror` events, and all 13 view tabs render.
- The default and reference topologies match Build 182 exactly, and so does the ES acceptance run.

**Amazon S3, against [`builder-handoff-amazon-s3-fields.md`](builder-handoff-amazon-s3-fields.md):**

| Check | Result |
|---|---|
| Inspector order | Component name, Environment, Cloud region, Customer number (AWS account ID), Owner, then Group container, Network zone, Subnet / CIDR, Host |
| Cloud region | Starts on "Not set", with the seven groups (14, 4, 2, 8, 4, 2 and 2 regions) and "Other region…" last. Choosing Sydney makes the chip read "ap-southeast-2", with the full value in its tooltip, and the inventory read "AWS ap-southeast-2 (Sydney)". One Undo returns to "Not set". The inspector subtitle shows the full region |
| Other region… | Choosing it doesn't change the stored region. "Sydney" is refused with the message and `aria-invalid`. "eu-west-9" saves as "AWS eu-west-9", and the chip reads "eu-west-9" |
| Owner | "Cloud storage team" by default; "Splunk Cloud provider" isn't offered. A change shows in the Responsibility view, and one Undo restores it |
| Customer number | "1234 5678 9012" saves as `123456789012`. "12345" shows the message and isn't saved. Clearing the field empties it, and Undo works |
| File | All three round-trip. A bare "ap-southeast-2" loads as "AWS ap-southeast-2 (Sydney)", "1234-5678-9012" loads as `123456789012`, and "Sydney" is kept as the extra option. An invalid number loads as empty, and no other component carries the field |
| Other components | The Universal Forwarder and AWS Lambda keep the free-text Region field and its suggestions |
| AR-008 | An Amazon S3 with a name, cloud region and group passes |

## Fixes

### 1. The cloud region is cut off in the inspector, P3

The identity box lays out its fields two to a row. Cloud region sits in the right-hand column next to Environment, so the selected value is cut off at "AWS ap-southeast-2 (". The two-line "Customer number (AWS account ID)" label also pushes its row out of line with Owner.

Screenshot: `docs/mockups/compare/build183-s3-inspector.png`.

**Rule:**
- Give **Cloud region** the full row, as Group container has.
- Give **Customer number (AWS account ID)** the full row too, with its hint under it.
- Keep **Environment** and **Owner** side by side.

The order is otherwise unchanged:

| Row | Fields |
|---|---|
| 1 | Component name |
| 2 | Environment, Owner |
| 3 | Cloud region |
| 4 | Customer number (AWS account ID) |
| 5 | Group container |
| 6 | Network zone, Subnet / CIDR |
| 7 | Host |

**Check:** at the default inspector width, the closed select shows "AWS ap-southeast-2 (Sydney)" in full, and no row's fields are misaligned.

### 2. The unset region chip's tooltip reads "Unspecified", P3

On an Amazon S3 card with no region, the chip reads "Region not set", but its tooltip reads "Unspecified", which is the stored value.

**Rule:** with no region set, use the tooltip "Region not set", or no tooltip.

### 3. Make the canvas stand out from the area around it, P2

**What happens:** the page background, the Builder frame, the toolbar band and the canvas are all near-black, so only the dot grid shows where the canvas ends. Measured on Build 183:

| Surface | Today | Contrast against the canvas |
|---|---|---|
| Page background (`body`) | rgb(7, 16, 25) | 1.0:1 |
| Frame (`#topologyBuilder.canvasFirst`) | rgb(9, 20, 30) | 1.02:1 |
| Toolbar band (`.builderHead.builderTwoRows142`) | rgb(13, 26, 38) | 1.08:1 |
| Canvas (`.builderCanvas`) | rgb(7, 17, 27), with a 1px rgb(34, 56, 74) border | border 1.57:1 |
| Floating controls | rgb(16, 43, 59) | 1.29:1 |

The canvas also runs to the frame's edge, so a 1px line is the only boundary.

**Rule:** make the canvas a darker, recessed well with a clear edge and a gutter around it, on lifted surroundings. Put the values in CSS custom properties on `#topologyBuilder` so they can be tuned in one place.

| Part | Selector | Value |
|---|---|---|
| Frame | `#topologyBuilder.canvasFirst` | background `#10202e`; border `#2c475b` |
| Toolbar band | `.builderHead.builderTwoRows142` | background `#15293a`; bottom border 1px `#31506a` |
| Gutter | `.builderWorkspace` | 8px padding on every side, background `#10202e` (the frame colour), so the frame shows around the canvas |
| Canvas | `.builderCanvas.navigationEnabled` | background `#040a10` (dot grid unchanged); border 1px `#456b85`; radius 10px; inner shadow `inset 0 2px 12px rgba(0,0,0,.65)` |
| Floating controls | `.builderDensityToggle`, `.builderNavBtn`, `.builderMobileZoomControls`, `.builderSpaceHelpPopover140` | background `#183247`; border `#557a93`; shadow `0 8px 18px rgba(0,0,0,.6)` |

**Contrast against the canvas:**
- canvas border 3.5:1;
- toolbar band 1.34:1;
- frame 1.20:1;
- floating controls 1.50:1, with their border at 4.35:1.

The OV views' light and dark themes don't apply to the Builder, so one set of values is enough.

**The gutter changes the canvas size:** the canvas becomes 16px narrower and shorter. Everything that measures it has to use the canvas's own box, not the workspace's: Fit, pan, wheel zoom, the zoom buttons, the minimap and its viewport frame, auto-layout, the drop position from the palette, card dragging, and connection drawing.

**Screenshots:**
- `docs/mockups/compare/canvas-surround-before.png`: Build 183 today.
- `docs/mockups/compare/canvas-surround-after.png`: the same page with these values injected as CSS.

**Check:**
- **Contrast:** the computed colours give the ratios above.
- **Fit:** at 1440px and 1600px, Fit leaves equal space on all four sides, inside the gutter.
- **Dragging:** at 100% and 60%, a dragged card stays under the pointer, and a palette item dropped on the canvas lands where it was dropped.
- **Minimap:** its viewport frame matches the visible canvas.
- **Floating controls:** stay inside the canvas edge and don't cover the border.
- **Phone width (400px):** no sideways page scroll, and the gutter stays 8px.

### 4. The help button moves after a re-render, P3

On load, the bottom bar reads View, + Add, Inspector, Show minimap, ?. After the first re-render (any edit, Fit or zoom), the "?" button jumps to second place: View, ?, + Add, Inspector, Show minimap. This happens on Build 183 as it is, without fix 3.

**Rule:** keep the load order through every re-render, with "?" at the end.

**Check:** the order is the same on load, after an edit, after Fit and after a zoom.

## Still open from the Build 182 recheck

[`builder-handoff-build182.md`](builder-handoff-build182.md) isn't in yet: the default topology's SvcV-1 summary still reads "1 consumers". Do it in the same build.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
2. **Fixes 1–4, and the Build 182 plural fix:** the checks in each item.
3. **Records:** a `changeRegister` entry ("Amazon S3 inspector layout, chip tooltip, summary plurals, canvas surround and bottom-bar order") and the build stamp.

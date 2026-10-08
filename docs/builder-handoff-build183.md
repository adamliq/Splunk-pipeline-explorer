# Builder handoff: Build 183 recheck (Amazon S3 fields)

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

## Still open from the Build 182 recheck

[`builder-handoff-build182.md`](builder-handoff-build182.md) isn't in yet: the default topology's SvcV-1 summary still reads "1 consumers". Do it in the same build.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
2. **Fixes 1 and 2, and the Build 182 plural fix:** the checks in each item.
3. **Records:** a `changeRegister` entry ("Amazon S3 inspector layout, chip tooltip and summary plurals") and the build stamp.

# Builder handoff: Amazon S3 · cloud region, owner and customer number

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 182 (`builder-review-v182`). Add one block, `builder-s3-fields-v183`, with wrappers only. The Build 182 recheck's plural fix ([`builder-handoff-build182.md`](builder-handoff-build182.md)) can go in the same build.
**Scope:** the **Amazon S3** component only: type `s3`, in the Destinations palette group, "Object storage destination". Amazon S3 Dataset, Amazon S3 Connection and S3 Data Catalog don't change (see "Not in scope").

## Today (Build 182)

- **Identity box:** Component name, Environment, Region, Group container, Network zone, Subnet / CIDR, Host. Region is a free-text field whose suggestions are site names such as "Sydney".
- **Owner:** it defaults to "Cloud storage team", but the inspector doesn't show it. It can only be changed in the Responsibility view's component assignments.
- **Account:** there's no field for the customer's AWS account.
- **Card:** a set region appears in full on the card's region chip ("AWS ap-southeast-2 (Sydney)", 168px wide).

## 1. Cloud region dropdown

**Field:** for Amazon S3 only, replace the Region text field with a **Cloud region** select.
- **Storage:** keep storing the value in `region`, so the card, inventory, OV-2 and AR-008 keep working unchanged.
- **Values:** "Not set" is stored as `'Unspecified'`, as it is today. Every other option's value is "AWS `<code>` (`<name>`)", the format the managed components already use.

**Options,** in this order, with an `<optgroup>` per group:

| Group | Regions (code · name) |
|---|---|
| — | Not set |
| Asia Pacific | ap-southeast-2 · Sydney; ap-southeast-4 · Melbourne; ap-southeast-6 · New Zealand; ap-southeast-1 · Singapore; ap-southeast-3 · Jakarta; ap-southeast-5 · Malaysia; ap-southeast-7 · Thailand; ap-east-1 · Hong Kong; ap-east-2 · Taipei; ap-northeast-1 · Tokyo; ap-northeast-2 · Seoul; ap-northeast-3 · Osaka; ap-south-1 · Mumbai; ap-south-2 · Hyderabad |
| United States | us-east-1 · N. Virginia; us-east-2 · Ohio; us-west-1 · N. California; us-west-2 · Oregon |
| Canada | ca-central-1 · Central; ca-west-1 · Calgary |
| Europe | eu-central-1 · Frankfurt; eu-central-2 · Zurich; eu-west-1 · Ireland; eu-west-2 · London; eu-west-3 · Paris; eu-south-1 · Milan; eu-south-2 · Spain; eu-north-1 · Stockholm |
| Middle East and Africa | me-central-1 · UAE; me-south-1 · Bahrain; il-central-1 · Tel Aviv; af-south-1 · Cape Town |
| Latin America | mx-central-1 · Mexico (Central); sa-east-1 · São Paulo |
| AWS GovCloud (US) | us-gov-east-1 · US-East; us-gov-west-1 · US-West |
| — | Other region… |

These are AWS's commercial and GovCloud regions as of October 2026. They include Mexico (Central), Taipei and New Zealand, which opened in 2025. Regions opened later go through "Other region…".

**Other region…:** shows a text field for a region code.
- It accepts lower-case codes matching `^[a-z]{2}(-gov)?-[a-z]+-\d+$` and stores them as "AWS `<code>`".
- Anything else shows "Enter an AWS region code, such as ap-southeast-2." and isn't saved.

**Older values:** a stored value that isn't in the list, such as "Sydney" from an older file, appears as an extra option. It stays selected until the user changes it, as v176's region picker does.

**Card:** the region chip on an Amazon S3 card shows the code only ("ap-southeast-2"), with the full value in its tooltip. It shows "Region not set" when the region is `'Unspecified'`.

**Undo:** each change is one Undo step.

## 2. Owner

**Field:** add **Owner** to the identity box, as a select of the responsibility parties.
- **Options:** leave out "Splunk Cloud provider": the bucket is in the customer's AWS account, not Splunk's.
- **Default:** "Cloud storage team", as today.
- **Same data as the Responsibility view:** it reads `responsibilityOwner(node)` and writes `state.responsibilityOwners[node.id]`. That's the store the Responsibility view's component assignments use, so both views always show the same owner.
- **Undo:** one Undo step, "Update Amazon S3 owner". The Responsibility view's own select doesn't record Undo today; leave that as it is.

## 3. Customer number

**Field:** add **Customer number (AWS account ID)**, a text field, with the hint "The customer's 12-digit AWS account ID that owns the bucket."
- **Storage:** `s3CustomerNumber`.
- **Input:** spaces and hyphens are accepted and dropped, and the 12 digits are saved: "1234 5678 9012" → `123456789012`.
- **Invalid input:** anything that isn't 12 digits shows "Enter the 12-digit AWS account ID." under the field and isn't saved. Link the message with `aria-describedby` and announce it with `aria-live="polite"`.
- **Clearing:** an empty field clears the value.
- **Where it shows:** only in the inspector for now: not on the card, inventory or pack.

## 4. Amazon S3 inspector order

1. Component name
2. Environment
3. **Cloud region**
4. **Customer number (AWS account ID)**
5. **Owner**
6. Group container, Network zone, Subnet / CIDR, Host (unchanged)

**Other components:** they keep today's free-text Region field.

## 5. Topology file

- **Save:** `s3CustomerNumber` on Amazon S3 nodes. Region and owner already round-trip (`region` and `governance.responsibilityOwners`).
- **Clean on import:**
  - customer number: digits only, kept only when there are exactly 12;
  - region: a bare AWS code such as "ap-southeast-2" loads as its list value, "AWS ap-southeast-2 (Sydney)". Any other text is kept as it is (it shows as the extra option).

## Not in scope

- **Amazon S3 Dataset** (federated search): its AWS account comes from the Amazon S3 Connection it uses, so account and region there need their own design. Ask if you want the same fields there.
- **Host, Network zone and Subnet** on Amazon S3: an S3 bucket has no customer host, but changing these fields wasn't asked for.

## Check before uploading

**Topology:** the default topology, plus an Ingest Processor and an Amazon S3 added after it.

| Check | Expected |
|---|---|
| Cloud region | The select starts on "Not set" and lists the groups above. Choosing "AWS ap-southeast-2 (Sydney)" makes the card chip read "ap-southeast-2" (the full value in its tooltip) and the inventory Region read "AWS ap-southeast-2 (Sydney)". One Undo returns to "Not set" |
| Other region… | `eu-west-9` saves as "AWS eu-west-9". `Sydney` is refused with the message |
| Owner | "Cloud storage team" by default. Changing it to "Cloud platform team" shows the same owner in the Responsibility view, and one Undo restores it. "Splunk Cloud provider" isn't offered |
| Customer number | "1234 5678 9012" saves as `123456789012`. "12345" shows the message and isn't saved. Clearing the field empties it |
| File | Export and re-import keep all three fields. An S3 node with region "ap-southeast-2" loads as "AWS ap-southeast-2 (Sydney)", and one with "Sydney" keeps it as the extra option |
| Other components | The Universal Forwarder and AWS Lambda keep the free-text Region field and its suggestions |
| AR-008 | An Amazon S3 with a name, cloud region and group passes |
| Regression | 0 `pageerror` events. The default and reference topologies are unchanged; neither has an Amazon S3 |

**Records:** a `changeRegister` entry ("Amazon S3: cloud region, owner and customer number") and the build stamp.

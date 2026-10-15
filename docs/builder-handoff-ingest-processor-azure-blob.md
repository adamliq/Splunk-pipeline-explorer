# Builder handoff: Ingest Processor → Azure Blob Storage

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 193 (`builder-review-v193`).
**One new block:** `<script id="builder-azure-storage-v194">`, at the end. It mirrors `builder-federated-s3-v106`, which models Amazon S3 datasets, and wraps the same functions.
**One in-place edit:** `excluded188` in `builder-sv-v1xx` (item 9). It sits inside a closure that no wrapper can reach.
**Mockup (the target):** [`docs/mockups/builder-azure-storage-mockup.html`](mockups/builder-azure-storage-mockup.html). It has three scenes: routing only, routing with federated search, and a setup that needs attention. Screenshots: `docs/mockups/compare/azure-storage-route.png`, `azure-storage-search.png` and `azure-storage-attention.png`.
**Tested first:** items 1, 4, 7, 8, 9 and 10 were prototyped on a copy of Build 193. The expected results under "Check before uploading" come from that run.

## Why

**What Splunk supports:** Ingest Processor can send data to **Azure Blob Storage** and **Azure Data Lake Storage** containers. The setup has four steps, all in Splunk Cloud's Data Management app:
1. Create a **Microsoft Azure connection**. It authenticates through a Microsoft Entra app registration.
2. Create a **Microsoft Azure dataset** for the container. It can also be made searchable by federated search.
3. Create a pipeline that uses the dataset as its destination.
4. Apply the pipeline to the Ingest Processor.

**Versions:**
- **General availability** (release notes, 29 June 2026): Splunk Cloud Platform 10.5.2605 or higher. Any region, and Federated Search isn't required.
- **Controlled availability** (May 2026): 10.4.2604 or higher, and only on deployments with Federated Search.

**Edge Processor** has the same Microsoft Azure connection.

**Permissions:** creating a connection needs the `edit_datasets` and `admin_all_objects` capabilities.

**Sources:**
- [Send data from Ingest Processor to Microsoft Azure](https://help.splunk.com/en/splunk-cloud-platform/process-data-at-ingest-time/use-ingest-processors/send-data-out-from-ingest-processor/send-data-from-ingest-processor-to-microsoft-azure)
- [Create a Microsoft Azure connection for Ingest Processor pipelines](https://help.splunk.com/en/splunk-cloud-platform/process-data-at-ingest-time/use-ingest-processors/send-data-out-from-ingest-processor/send-data-from-ingest-processor-to-microsoft-azure/create-a-microsoft-azure-connection-for-ingest-processor-pipelines)
- [Create a Microsoft Azure dataset for Ingest Processor pipelines](https://help.splunk.com/en/splunk-cloud-platform/process-data-at-ingest-time/use-ingest-processors/send-data-out-from-ingest-processor/send-data-from-ingest-processor-to-microsoft-azure/create-a-microsoft-azure-dataset-for-ingest-processor-pipelines)
- [Release notes for Ingest Processor](https://help.splunk.com/en/splunk-cloud-platform/process-data-at-ingest-time/use-ingest-processors/introduction/release-notes-for-ingest-processor)
- [Create a Microsoft Azure connection for Edge Processor pipelines](https://help.splunk.com/en/data-management/process-data-at-the-edge/use-edge-processors-for-splunk-cloud-platform/send-data-out-from-edge-processors/send-data-from-edge-processors-to-microsoft-azure/create-a-microsoft-azure-connection-for-edge-processor-pipelines)

**What the Builder does today:**
- Build 106 models the same pattern for Amazon S3:
  - an Amazon S3 Dataset that an Ingest Processor or Edge Processor writes to;
  - a reusable Amazon S3 Connection;
  - an S3 Data Catalog;
  - Splunk Cloud Search for federated search.
- There is nothing for Azure. An Azure Function exists, but only as a source that sends to HEC.
- Two problems turned up in the S3 model while prototyping, and are fixed here (items 4c and 9a):
  - links into an S3 dataset read port 8089. `inferredRelationshipPort` checks for "management" before "s3", and the label is "S3 dataset write via Data Management connection";
  - the S3 connection and catalog count as systems with no interface in SV-1, SV-3 and AV-1 (I-06).

## 1. The components

| | Azure Storage Dataset | Microsoft Azure Connection |
|---|---|---|
| Type key | `azureDataset` | `azureConnection` |
| `builderComponents` name | Azure Storage Dataset | Microsoft Azure Connection |
| Type text | Azure Blob / ADLS Gen2 container · pipeline destination | Splunk Cloud Data Management authentication · Microsoft Entra app |
| Colour | `#4cb1f7` | `#9cc8ee` |
| Stages | Storage account and container; Dataset definition; Routing and search scope | Microsoft Entra app registration; Azure role on the container; Ingest / Edge send permission; Federated search permission |
| Default owner (`componentDefaultOwner`) | Cloud storage team | Splunk platform team |
| Security zone (`componentSecurityZone`) | `storage` | `splunk` |
| Data capabilities (`builderDataCapabilities`) | `[]`: it's a destination | `[]`: no data links |
| Tier (`builderTierByType130`) | `indexing` | `management`, column 5 (`builderManagementColumn130`) |

Add `azureDataset` to the data capabilities of `ip` and `edgeProcessor`.

`builderTierByType130` is a `Map` built at load from `builderTierLookup130`, so pushing to the lookup arrays isn't enough. Call `.set()` on the map, and push to the arrays too, for code that reads them.

**Dataset fields:**

| Field | Values | Default |
|---|---|---|
| `azureKind` | "Azure Blob Storage", "Azure Data Lake Storage" | Azure Blob Storage |
| `azureAccount` | storage account name | "" |
| `azureContainer` | container name | "" |
| `azurePath` | path prefix, optional | "" |
| `azureDatasetMode` | "Routing only", "Routing and federated search" | Routing only |
| `azureConnectionId` | an `azureConnection` id, or null | the first Microsoft Azure Connection, else null |

There is no "Federated search only" use. An Azure dataset is a routing destination that can also be searched.

**Location** (derived, not saved):
- Blob: `https://<account>.blob.core.windows.net/<container>/<path>`.
- Data Lake: `https://<account>.dfs.core.windows.net/<container>/<path>`.
- **Host:** the part between `https://` and the container.

**Connection fields:**

| Field | Values | Default |
|---|---|---|
| `azureTenantId` | directory (tenant) ID, a GUID | "" |
| `azureClientId` | application (client) ID, a GUID | "" |
| `azureRole` | "Not recorded", "Storage Blob Data Contributor", "Storage Blob Data Owner", "Other" | Not recorded |
| `azureNetwork` | "Not recorded", "All networks", "Selected networks, Splunk Cloud allowed", "Private endpoint only" | Not recorded |
| `azureAllowIngest` | boolean | true |
| `azureAllowEdge` | boolean | true |
| `azureAllowSearch` | boolean | false |
| `azureCloudSearchId` | a `cloudSearchTier` id, or null | null |

**Never store a secret.** The connection records IDs only; the client secret stays in Splunk Cloud.

## 2. Palette

**New group "Azure storage",** right after "S3 federated search":

| Item | Icon | Title (tooltip) |
|---|---|---|
| Azure Storage Dataset | BLOB | Azure Blob Storage or Data Lake Storage container that Ingest Processor or Edge Processor writes to |
| Microsoft Azure Connection | CON | Microsoft Entra app registration that Data Management uses to reach Azure storage |

**Clicking:**
- **Azure Storage Dataset:** if an Ingest Processor or Edge Processor is selected, it's added after it, with the data link. Otherwise it's added unlinked.
- **Microsoft Azure Connection:** always added with no parent.
- Each is one Undo step. Dragging works as it does for the S3 items.

**Search:** the palette search reads the name, type key, type text and stages. So "azure", "blob", "adls", "data lake", "container", "entra" and "microsoft" all find the items with the catalogue text above.

## 3. Canvas cards

**Azure Storage Dataset** (blue border; see the mockup):
- tier "AZURE BLOB · CONTAINER", or "AZURE DATA LAKE · CONTAINER";
- the name;
- a badge, "ROUTING" or "ROUTING + SEARCH";
- "NO WRITE ACCESS" in the bad colour when a writer has no connection, or its connection doesn't allow that writer;
- `<account> / <container>` in mono. When the account or container is invalid or missing, it's in the review colour, with "account not set" or "container not set" in its place;
- the path prefix or "No path prefix", and the Region;
- the footer, "Cloud storage team".

**Microsoft Azure Connection** (dashed border):
- tier "DATA MANAGEMENT";
- the name;
- badge "ENTRA APP";
- "tenant `<first 8 characters>`…" in mono;
- the role, in the review colour when "Not recorded";
- the network access as a short label ("Selected networks"), in the review colour when it's "Private endpoint only" or "Not recorded";
- "Ingest ✓ · Edge ✓ · Search –";
- the footer, "`<n>` dataset(s)".

**No data handle:** strip the data-connection button from the connection card, as v106 does for S3 control types (wrap `unifiedNodeMarkup`).

## 4. Links

### a. What can link

Wrap `dataCapability(source,target)`:

| Case | Result | Message |
|---|---|---|
| Either end is an `azureConnection` | Refused | "Connections, catalogs and Cloud Search belong to the authentication and search paths. They don't carry events." |
| Source is an `azureDataset` | Refused | "An Azure Storage Dataset is a destination. It doesn't send events." |
| Target is an `azureDataset` and the source isn't `ip` or `edgeProcessor` | Refused | "Only an Ingest Processor or Edge Processor can write to an Azure Storage Dataset." |
| `ip` or `edgeProcessor` → `azureDataset` | Allowed | — |

### b. Label

Wrap `builderHandoff(a,b)`. A transport the user set (`child.transport` not Automatic) still wins.
- **To an `azureDataset`:** "HTTPS (Azure Blob Storage REST)", or "HTTPS (Azure Data Lake Storage REST)" for Data Lake.
- **`ip` or `edgeProcessor` → `s3Dataset`:** "HTTPS (Amazon S3 dataset write)". This replaces "S3 dataset write via Data Management connection".

### c. Details defaults

Wrap `defaultRelationshipDetails(edge)`.

**Data link into an `azureDataset`:**

| Field | Value |
|---|---|
| endpoint | the dataset's host, else its name |
| port | 443 |
| tls | Required |
| acknowledgement | Application response |
| direction | Request-response |
| authenticationRequired | Yes |
| authenticationType | OAuth 2.0 / bearer token |
| retryPolicy | "Managed destination retry and delivery backlog monitoring" from Ingest Processor; "Edge Processor destination queue and retry" from Edge Processor |
| criticality | High |
| dependency | Azure storage route and blob persistence |

The owner comes from the default owner: Cloud storage team.

**Data link into an `s3Dataset`** (the S3 fix):
- port 443;
- acknowledgement Application response;
- direction Request-response;
- authentication Yes, "AWS IAM / SigV4".

### d. The endpoint follows the account

Details are stored when the link is first drawn, usually before the account is typed. So when `azureAccount` or `azureKind` changes, refresh the stored endpoint, but only when it still holds a default value:
- the dataset's name;
- the previous host;
- empty.

Refresh the label-derived protocol the same way. An endpoint the user typed is kept.

### e. Connection templates

Add two entries to `builderConnectionTemplates`, after `'ip-s3'`:
- **`'ip-azure'`, "Ingest Processor → Azure Storage":**
  - from `['ip']`, to `['azureDataset']`;
  - the values in 4c;
  - controls "Entra app registration · Azure role on the container · storage firewall · encryption at rest";
  - target `{transport:'HTTPS / Azure Storage :443',ack:true,persistent:true}`.
- **`'edge-azure'`, "Edge Processor → Azure Storage":** the same, from `['edgeProcessor']`, with the Edge Processor retry text.

## 5. Inspector

Add a section after the S3 one (`#builderFederatedS3Inspector`), shown for the two new types. Each change is one Undo step: "Update Azure dataset" or "Update Azure connection".

**Azure Storage Dataset** (subtitle "Azure Blob / ADLS Gen2 container · pipeline destination · Cloud storage team"), in this order:
1. **Storage:** a select of the two kinds.
2. **Storage account** and **Container,** side by side:
   - max length 24 and 63;
   - a review-coloured border when invalid or missing;
   - under an invalid account: "3 to 24 lowercase letters and digits."
3. **Path prefix (optional):** placeholder "ingest/", max 240.
4. **Location:** read-only and mono, or "Set the storage account and container".
5. **Dataset use:** a select of the two uses.
6. **Microsoft Azure connection:** "Not assigned" or a connection.
7. **Buttons:**
   - "Open connection";
   - "＋ Connection", which adds one and assigns it;
   - with federated search, "＋ Cloud Search", which adds one and assigns it to the connection.
8. **Note:** "Receives Ingest Processor output through the data link. Needs Ingest Processor on Splunk Cloud Platform 10.5.2605 or higher. In the pipeline, the destination is this dataset."

**Microsoft Azure Connection** (subtitle "Splunk Cloud Data Management authentication · Microsoft Entra app registration"):
1. **Directory (tenant) ID** and **Application (client) ID:** text, with a GUID placeholder and a review-coloured border when not a GUID.
2. **Azure role on the containers:** a select.
3. **Storage network access:** a select.
4. **Checkboxes:**
   - "Send data from Ingest Processor";
   - "Send data from Edge Processor";
   - "Run federated search".
5. **Splunk Cloud Search tier:** a select, shown when federated search is ticked. Unticking it clears `azureCloudSearchId`.
6. **Note:** "The client secret stays in Splunk Cloud: the topology records only these IDs. Creating the connection needs the edit_datasets and admin_all_objects capabilities."
7. **Datasets:** one button per dataset that uses the connection.

**Splunk Cloud Search:** its inspector lists Microsoft Azure connections as well as S3 connections.

## 6. Guide above the canvas

Next to the S3 guide (`#builderFederatedS3Guide`), add `#builderAzureStorageGuide`. Show it when there is at least one Azure dataset. Its summary is "Azure storage · `<n>` dataset(s) · write and query paths". For each dataset:
- **Write:** each writer → the dataset, then its location, or "Storage account and container not set".
- **Search,** when the dataset is routing only: "Not searchable: the dataset is routing only."
- **Search,** when it's searchable: Cloud Search → connection → dataset. A missing step reads "Cloud Search unassigned" or "Connection unassigned".
- **Footer:**
  - always: "Ingest Processor writes through the connection's app registration.";
  - then, when searchable: "Splunk Cloud searches the container through the same connection, without indexing it.";
  - or, when routing only: "Set the dataset to "Routing and federated search" to search it from Splunk Cloud."

Each name is a button that selects that card.

## 7. Validate

Wrap `builderValidation()`. "`<dataset>`" and "`<connection>`" stand for each card's label, for example "Azure Storage Dataset 1".

**Errors:**
- "Microsoft Azure Connection cannot receive an event-data link."
- "`<dataset>` has an unsupported write source."
- "`<dataset>`: its connection doesn't allow writes from Ingest Processor." The same with "Edge Processor".
- "`<connection>` refers to a missing Splunk Cloud Search tier."

**Warnings:**

| When | Text |
|---|---|
| The dataset has no connection | "`<dataset>` needs a Microsoft Azure connection." |
| The account or container is empty | "`<dataset>` needs a storage account and a container." |
| The account name is invalid (`/^[a-z0-9]{3,24}$/`) | "`<dataset>`: the storage account name must be 3 to 24 lowercase letters and digits." |
| The container name is invalid (`/^(?=.{3,63}$)[a-z0-9](?:[a-z0-9]\|-(?!-))*[a-z0-9]$/`) | "`<dataset>`: the container name must be 3 to 63 lowercase letters, digits and single hyphens, starting and ending with a letter or digit." |
| Searchable, but the connection doesn't allow search | "`<dataset>` is searchable, but its connection doesn't allow federated search." |
| Searchable, but the connection has no search tier | "`<dataset>` is searchable, but its connection has no Splunk Cloud Search tier." |
| The tenant or application ID isn't a GUID | "`<connection>` needs a directory (tenant) ID and an application (client) ID." |
| "Private endpoint only", and an Ingest Processor writes through the connection | "`<connection>` is private endpoint only. Ingest Processor runs in Splunk Cloud and reaches the storage account over its public endpoint: allow Splunk Cloud in the storage firewall, or confirm private connectivity with Splunk." |
| Role "Not recorded", and the connection has a writer | "`<connection>` has no Azure role recorded. The app registration needs write access to the container, for example Storage Blob Data Contributor." |

**Existing messages to filter, as v106 does for S3:**
- "No indexing, object-storage, or search destination is currently attached." when an Azure dataset exists;
- the route issue "This event route ends without a modelled index or storage destination." for an Azure dataset, by wrapping `v81RouteIssues`;
- route issues for a Microsoft Azure Connection.

## 8. Rule AR-006

Make AR-006 cover every object-storage destination:
- **Title:** "Object storage delivery has encryption and ownership metadata".
- **Description:** "Every relationship into Amazon S3, an S3 dataset or an Azure Storage Dataset must require TLS and have a named owner."
- **Evaluate:** as the override in `builder-rule-profiles` does today, but over data edges whose target type is `s3`, `s3Dataset` or `azureDataset`.
- **Finding:** unchanged, "`<target>` delivery lacks confirmed TLS or owner".

With the defaults in 4c it passes.

## 9. Views

### a. In-place edit: SV-1's exclusions

In `builder-sv-v1xx`, add `'azureConnection'`, `'s3FederatedConnection'` and `'s3DataCatalog'` to `excluded188`. Connections and catalogs are Data Management configuration, like server classes. They aren't systems.

**Today:** Build 193 lists an Amazon S3 Connection and S3 Data Catalog as systems with no interface:
- SV-1 lists them;
- SV-3 marks them "No interfaces";
- AV-1's I-06 reads "Amazon S3 Connection 1 and S3 Data Catalog 1 are in the topology with no interface, so they send nothing."

The edit clears all three.

### b. What the views then show

Nothing else in the views needs code. They read the catalogue, tier, zone, owner and link details above:

| View | Result |
|---|---|
| SV-1, SV-2, SV-3, SV-6 | **SV-1 system:** the dataset, with Location from its Region and owner Cloud storage team.<br>**SV-1 interface:** "Ingest Processor → `<dataset>` · HTTPS (Azure Blob Storage REST) · 443 · TLS Required · Declared".<br>**SV-2:** the link crosses from Splunk Cloud to the dataset's segment, giving a network path and a "Ready to request" firewall rule on 443. |
| OV-2, OV-3 | **Dataset:** joins "Indexing service", as S3 datasets do.<br>**Connection:** joins "Platform management".<br>**Flow:** "HTTPS (Azure Blob Storage REST) 443 · TLS · OAuth 2.0 / bearer token". |
| Threat model | **Zone:** the dataset is in "Customer storage account".<br>**Crossing:** "Splunk Cloud (provider managed) → Customer storage account". |
| AV-2 | **Terms:** two new Splunk component terms, from the catalogue. |
| Inventory, pack | **Rows:** one for each new component.<br>**The connection:** shows its IDs, role and network access. |
| Failure Lab | **Fault points:** the dataset's stages. |

## 10. Topology file

**Save:** wrap `topologyDocument`. Write the fields in item 1 on each node, as v106 does for S3.

**Load:** wrap `validateTopologyDocument`.
- **Strings:**
  - trim them;
  - cut the account and container to 64 characters and the path to 240;
  - keep invalid names, so Validate can warn.
- **Selects:** an unknown value becomes the default. An unknown use, including "Federated search only", becomes "Routing only".
- **GUIDs:** a tenant or application ID that isn't a GUID becomes "".
- **Booleans:** `azureAllowIngest` and `azureAllowEdge` are false only when false. `azureAllowSearch` is true only when true.
- **References:** an id that doesn't name a node of the right type becomes null.
- **Refuse:**
  - a connection with a parent: "Microsoft Azure Connection cannot receive an event-data connection.";
  - a dataset whose parent isn't an Ingest Processor or Edge Processor. The existing import check already does this, with the item 4a message: "Unsupported imported relationship: Universal Forwarder → Azure Storage Dataset. Only an Ingest Processor or Edge Processor can write to an Azure Storage Dataset."

**Records:** add a `changeRegister` entry under "Explorer foundations": "Azure storage datasets: model Ingest Processor and Edge Processor writes to Azure Blob Storage and Data Lake Storage through Microsoft Azure connections, with optional federated search; persist account, container, path, use and connection in topology JSON." Then the build stamp.

## Not in scope

- **SvcV-6's "interfaces carry no service flow"** for processor routes. Build 193 reports it for S3 datasets and the UF → Ingest Processor link too.
- **An output format (JSON or Parquet) or an Azure data catalog.** Confirm on Splunk's dataset page before modelling them.
- **The SPL2 pipeline itself, and a Splunk Cloud version field** on the Ingest Processor card. The dataset note gives the version.
- **Private connectivity from Splunk Cloud to Azure.** The Builder records the network access and warns; it doesn't model the path.

## Check before uploading

### 1. Regression

- 0 `pageerror` events.
- **Without Azure components,** everything is unchanged, apart from two things:
  - an S3 dataset link reads "HTTPS (Amazon S3 dataset write)", 443, TLS Required, authentication "Yes · AWS IAM / SigV4";
  - an S3 connection or catalog no longer appears in SV-1, SV-3 or AV-1's I-06.

### 2. The scene

**Steps:**
1. Open the default topology.
2. Select Universal Forwarder 1 and add an Ingest Processor.
3. With it selected, add an Azure Storage Dataset.
4. Set the dataset's account `secarchive01`, container `splunk-archive`, path `ingest/`, and Region "Azure australiaeast".
5. Add a Microsoft Azure Connection with tenant ID `7c1e4b9a-52f0-4d3e-9b1a-0f6d2c8ea2d4`, application ID `3f9a6c21-8e47-4b0d-a5c2-91d7e6b04f18`, and role Storage Blob Data Contributor.

**Expected:**
- **Validate:** no errors or warnings. AR-006 passes.
- **Link details:**
  - protocol "HTTPS (Azure Blob Storage REST)", endpoint `secarchive01.blob.core.windows.net`;
  - 443, TLS Required;
  - acknowledgement Application response;
  - authentication Yes, "OAuth 2.0 / bearer token";
  - owner Cloud storage team.
- **SV-1:**
  - interface "SI-5 Ingest Processor → Azure Storage Dataset 1 · HTTPS (Azure Blob Storage REST) · 443 · TLS Required · Declared";
  - system Azure Storage Dataset 1, Location "Azure australiaeast", owner Cloud storage team;
  - the connection isn't listed.
- **SV-2:**
  - NP-2 "Location not set · Splunk Cloud (provider managed) ⇒ Azure australiaeast", SI-5, TCP 443, Ready;
  - FW-2 "… ⇒ Azure Storage Dataset 1, 443", Ready to request.
- **OV-2:** "Indexing service" holds Indexer and Azure Storage Dataset. "Platform management" holds Microsoft Azure Connection.
- **Threat model:** "X-4 · DF-5 Ingest Processor → Azure Storage Dataset 1: Splunk Cloud (provider managed) → Customer storage account".
- **AV-1:** "6 systems in 2 locations: Location not set, Azure australiaeast."
- **AV-2:** terms for Azure Storage Dataset and Microsoft Azure Connection.

### 3. Validate cases, from the scene

| Change | Expected |
|---|---|
| Dataset use "Routing and federated search" | Warning: "Azure Storage Dataset 1 is searchable, but its connection doesn't allow federated search." |
| Then tick "Run federated search" | Warning: "… its connection has no Splunk Cloud Search tier." |
| Then add Cloud Search with "＋ Cloud Search" | Clear. The guide's Search row reads Splunk Cloud Search → Microsoft Azure Connection 1 → Azure Storage Dataset 1 |
| Network "Private endpoint only" | The private endpoint warning |
| Untick "Send data from Ingest Processor" | Error: "Azure Storage Dataset 1: its connection doesn't allow writes from Ingest Processor." The card shows "NO WRITE ACCESS" |
| Account `SecArchive`, container `Splunk--Archive`, role Not recorded | The account, container and role warnings |
| Storage "Azure Data Lake Storage" | Endpoint `secarchive01.dfs.core.windows.net`, protocol "HTTPS (Azure Data Lake Storage REST)" |
| Type an endpoint, then change the account | The typed endpoint stays |
| Link Universal Forwarder 1 → the dataset | Refused: "Only an Ingest Processor or Edge Processor can write to an Azure Storage Dataset." |
| Edge Processor after Universal Forwarder 1, then a second dataset after it | Allowed. The retry is "Edge Processor destination queue and retry". Unticking "Send data from Edge Processor" gives the Edge Processor error |
| TLS set to Optional on the link | AR-006 fails: "Azure Storage Dataset 1 delivery lacks confirmed TLS or owner" |

### 4. File

- **Round trip:** export and re-import keeps every `azure…` field, the link and the endpoint.
- **Cleaning:** a file with these values loads with them cleaned:
  - kind "Floppy", use "Federated search only", connection 999 and a 40-character account;
  - tenant "not-a-guid", role "Root", search "yes" and network "Moon".
  - **Result:** Blob Storage, Routing only, no connection, the 40-character account kept, tenant "", role and network Not recorded, search off.
  - **Warnings:** "Azure Storage Dataset 1 needs a Microsoft Azure connection.", the storage account name rule, and "Microsoft Azure Connection 1 needs a directory (tenant) ID and an application (client) ID."
- **Refused:** a file linking Universal Forwarder 1 → the dataset is refused with the item 10 message.

### 5. Look

Against the mockup at 1600, 1280 and 400 pixels:
- the cards keep their content inside 190 × 224;
- the connection card has no data handle;
- the page doesn't scroll sideways at 400.

# Builder handoff: Build 186 recheck (load balancer)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 186: `builder-review-v185` (Build 185, the plural fix) plus `builder-load-balancer-helpers-v185` and `builder-load-balancer-v185`. Five small fixes are left. Add one block, `builder-review-v187`, with wrappers only.
**Tested with:**
- the default and reference topologies, and the ES acceptance topology, for regression;
- the five small topologies from the Build 184 recheck, for the plural fix;
- the four "with and without a load balancer" pairs from [`builder-handoff-load-balancer.md`](builder-handoff-load-balancer.md);
- the three mockup scenes built in the Builder through its inspector.

## What passes

**Clean run and regression:**
- 0 `pageerror` events. All 13 view tabs render, also with load balancers present, and the architecture pack builds (36 pages with a syslog and a deployment load balancer).
- The default, reference and ES acceptance topologies match Build 184 in CV-1, CV-2, SvcV-1 to SvcV-6, SvcV-3a and 3b, DIV-1, OV-2, OV-3, the threat model, the network overlay and inventory.
- The only change is AR-009 to AR-015, all passing: seven more rules in each profile (Splunk Cloud 20 → 27, Enterprise 10 → 17, Hybrid 24 → 31).

**Build 184 plural fix (Build 185):** passes on screen and in the pack. On the five small topologies, every summary item at a count of one is singular: "1 system", "1 provider cell", "1 provider cut off", "1 flow", "1 service pair", "1 service flow", "1 flow with no system interface", "1 carries PII". "1 system unconnected" still works, and labels that aren't nouns are unchanged.

**Load balancer, against the handoff:**

| Area | Result |
|---|---|
| In-place edits (item 10) | All nine are in, as written |
| Same results with and without | Passes for syslog, HEC, HEC on heavy forwarders and Deployment Servers. CV-1, CV-2, SvcV-4, the SvcV-6 and SvcV-2 statuses and GB/day, the SvcV-3a and 3b summaries, the DIV-1 entities, the OV-2 nodes and locations, and AR-001 to AR-007 are the same. The differences are the listed ones: one more resource flow, interfaces naming the load balancer (with its member links), one needline flow at 1,244 GB/day, S3.1 listing the source once, the zone crossing moving to the client → load balancer link, and AR-008 listing it. With a second Deployment Server, S5 has two providers and AR-011 asks to confirm the cluster |
| Palette | "Network" sits after Collection with "Load balancer", and keeps its place after a search is cleared. "vip", "haproxy", "metallb", "deployment server cluster" and "load balancer" each find it |
| In front | Selecting Syslog Server 1 and clicking the item puts it between Syslog Source 1 and Syslog Server 1, serving syslog, as one Undo step ("Put load balancer in front of Syslog Server 1"). On Deployment Server 1 in the reference topology, its three clients move to the load balancer, AR-001 still passes, and one Undo restores everything. In front of an indexer fed by a Universal Forwarder it's refused: "Indexer 1 receives Splunk-to-Splunk from Universal Forwarder 1. Forwarders balance across indexers themselves (autoLB), or use indexer discovery." |
| Refusals | All six give their messages and change nothing: forwarder → load balancer, a Splunk Cloud member, a Heavy Forwarder in a syslog-server pool, a HEC client to a syslog load balancer, load balancer → load balancer, and links on the wrong plane |
| Card | 190 × 224 with ⇄ Load balancer, name, HA and product badges (F5 BIG-IP, AWS ALB, HAProxy), address, listeners, pool, the plane-specific fact in the review or bad colour, and the footer. All facts show at 100%, 77% and 60%, and nothing ends below the card. Data handle only for syslog and HEC; management handle only for deployment |
| Inspector | Fields in the handoff's order, with Owner (Network team). Layer is fixed for syslog, and TLS is disabled without a TLS listener. Cookie and X-Forwarded-For appear at layer 7 only, and switching to layer 4 turns them into Source IP and Not set. DNS round robin shows the read-only lines. The cluster box appears for deployment only. Serves options that would break a link are disabled. Each change is one Undo step ("Update load balancer") |
| Rules | Syslog scene: AR-009 Fails on SNAT with UDP, then passes with DNAT. With the PROXY protocol it Fails with UDP, and passes without it, noting `SC4S_SOURCE_PROXYCONNECT=yes`. HEC scene: AR-010 Fails with acknowledgement on the Lambda link, then passes with Cookie. Terminating TLS gives AR-015 Advisory, or Fail when a member sits in another network zone. Deployment scene: AR-011 is Advisory, then passes; it Fails when a check is No. AR-012 Fails with 4 members. AR-013 Fails with a single instance, then passes with a pair |
| Labels and details | "Syslog UDP 514 · TCP 514", port 514, TLS Not applicable. "HEC HTTPS 443", port 443, TLS Required, HEC token authentication, and the recorded HEC acknowledgement. Terminated: "HEC HTTP 443, decrypted at Load Balancer 1", TLS Not applicable |
| Fleet links | Client relations carry the address as `targetUri` and endpoint. Pool links read "Load-balanced phone-home". Inventory: the clients' authority is "Load Balancer 1 (Deployment Server 1, Deployment Server 2)", and the load balancer's is "None" |
| Threat model | D (single instance) and I (TLS ends on it) node threats. E threats on the load balancer → client links, none on pool links |
| Failure Lab | Its stages are the fault points. A pool member as the target adds "Load Balancer 1 sends new connections to the other 1 member while its health check passes. UDP in flight to this member is lost." |
| File | Export and re-import keep every `lb…` field, pool links, client relations and data links. A file with a Heavy Forwarder in a syslog-server pool loads without that link: "Dropped 1 load balancer link: Syslog VIP → Heavy Forwarder 2 (A pool holds one kind of component. Syslog VIP already pools Syslog Servers.)" Invalid values load as their defaults |

**Beyond the handoff, and good:** while the pool is empty, link details are provisional. When the first member arrives, they take the pool's defaults, unless the user changed them. This fixes the frozen-label problem the prototype ran into.

## Fixes

### 1. AR-010 passes with its failure text, P3

With HEC acknowledgement on a client link and persistence Cookie or Source IP, AR-010 passes, but its evidence still reads "Cloud audit collector uses HEC acknowledgement, so Load Balancer 1 needs sticky sessions, with the longest cookie timeout. Otherwise acknowledgement checks reach another member and events are sent again." The rules panel and the export show a passed check asking for a change.

DNS round robin and floating virtual IP get the same text with Advisory.

**Rule:**
- **Pass:** "Sticky sessions (cookie). Duplicates are still possible when a client moves under load." With Source IP, "(source IP)".
- **DNS round robin or floating virtual IP:** "`<clients>` uses HEC acknowledgement. Confirm each client keeps one address while it checks acknowledgements."
- **Fail:** unchanged.

**Check:** the HEC mockup scene gives the fail text with persistence None, the pass text with Cookie, and the DNS text with DNS round robin.

### 2. Client counts aren't formatted, P3

The 25,000 limit is formatted, but the client count isn't:
- the card: "1201 clients phone home here";
- the cluster box: "1201 clients phone home here, within 50,000 (2 × 25,000)";
- AR-012: "30001 clients, within 50,000 (2 × 25,000)", and the advisory "`<n>` clients is more than…".

**Rule:** format the count with thousands separators everywhere it appears: "1,201", "30,001".

**Check:** the deployment scene with 1,200 Universal Forwarders and one Heavy Forwarder reads "1,201" on the card, in the cluster box and in AR-012.

### 3. A client link's endpoint keeps the load balancer's first name, P3

**Steps:** insert a load balancer in front of Syslog Server 1, rename it "Syslog VIP", then set its address to `syslog-vip.example.gov.au`.

**What happens:** the Syslog Source 1 → Syslog VIP link's endpoint stays "Load Balancer 1" in its relationship details and in the saved file. Setting the address before renaming works.

**Cause:** an address change replaces endpoints that equal the old address or the current name, but the stored default is the name the load balancer had when the link was made.

**Rule:** treat an endpoint as a default when it equals the load balancer's current or previous name, or its previous address:
- on rename, replace default endpoints with the address, or the new name when there's no address;
- on an address change, replace them with the new address.

This covers client links, and the pool links' endpoint. A typed endpoint is kept.

**Check:** rename then address gives the address; address then rename keeps the address; a typed endpoint survives both.

### 4. A member re-linked after Disconnect keeps the old link's details, P3

**Steps:**
1. In the default topology, add Syslog Server 2 linked from Syslog Source 1.
2. Select Syslog Server 1 and add a load balancer in front of it.
3. Disconnect Syslog Source 1 → Syslog Server 2, and confirm "Disconnect relationship".
4. Draw Load Balancer 1 → Syslog Server 2.

**What happens:** the new link's label reads "Syslog UDP 514 · TCP 514", but its details still say "TCP/TLS or UDP" and port 0. The network overlay shows "Load Balancer 1 → Syslog Server 2 · port Unspecified · fail", while Syslog Server 1 shows 514 and review.

**Cause:** Disconnect clears `parent` but leaves `relationshipDetails` on the member, and the new parent link reuses them. Build 186's provisional defaults only cover links made while the pool is empty.

**Rule:** when a link into or out of a load balancer is created (a new `parent`, a data relation, or insertion in front), refresh the stored protocol, port, endpoint and TLS where they still equal the previous link's defaults. Those are the defaults computed with the old source, or with no source after a disconnect. Values the user typed stay.

**Check:** after the steps, Load Balancer 1 → Syslog Server 2 reads "Syslog UDP 514 · TCP 514", port 514, TLS Not applicable. The network overlay row matches Syslog Server 1's.

### 5. "Move clients" duplicates a link the load balancer already has, P3

**Steps:** Deploy VIP pools Deployment Server 1 and 2. Universal Forwarder 1 phones home through Deploy VIP, and Deployment Server 2 also manages it directly. The inspector offers "Move 1 client to Deploy VIP".

**What happens:** clicking it re-points Deployment Server 2 → Universal Forwarder 1 to Deploy VIP, so there are two identical Deploy VIP → Universal Forwarder 1 relations. Validate keeps reporting "Universal Forwarder has multiple active Deployment Server authorities", and the file saves both.

**Rule:** when the client already has a relation from the load balancer, remove the member's direct relation instead of re-pointing it. Count both kinds in the button, and keep it one Undo step.

**Check:** after the move there's one Deploy VIP → Universal Forwarder 1 relation, and Validate has no "multiple authorities" error for it. One Undo restores both original relations.

## Accepted as built

- **Unlinked load balancer:** it starts with environment and region "Unspecified" until its first link copies them in. Other new components start in Production. This is how it knows they haven't been changed, which the handoff asks for.
- **Validate:** it checks fleet relations by projecting a load balancer's client relations onto a pool Deployment Server, then runs the existing checks.
- **AR-014 with one member:** the deployment pair in the load balancer handoff has one Deployment Server, so AR-014 is Advisory ("Load Balancer 1 has one member: there's nothing to balance."). My handoff wrongly expected all new rules to pass there; the rule is right.
- **AR-015's zone name:** without a Network zone, it falls back to the group or environment, as the network overlay does, so the text can read "…sends to Syslog Server 1 in Production unencrypted."
- **Not a load balancer issue:** a connection to a component without a parent isn't its own Undo step. Build 184 does the same without load balancers.

## Check before uploading

1. **Regression:**
   - 0 `pageerror` events.
   - Everything under "What passes" unchanged.
2. **Fixes 1–5:** the checks in each item.
3. **Records:** add them to the next build's `changeRegister` entry.

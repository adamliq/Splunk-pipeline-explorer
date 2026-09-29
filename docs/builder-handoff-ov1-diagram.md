# Builder handoff: make the OV-1 diagram match the mockup

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** Build 135 (`builder-ov1-v132`, shown in the pack and the OV tab by `builder-ov-workspace-v135`). This is a companion to [`builder-handoff-build135.md`](builder-handoff-build135.md) and replaces its item 8 ("OV-1 graphic: layout") with a full spec. Do items 1–2 of that handoff first (they break the OV tab); this can follow.
**Reference:** `docs/mockups/architecture-ov1-mockup.html` (open it in a browser; click a thread number to see the highlighting).
**Side by side:** `docs/mockups/compare/ov1-mockup.png` (target) and `docs/mockups/compare/ov1-build135.png` (now, same kind of topology).
**Test topology:** `docs/mockups/ov1-reference-topology.json`. Load it with `loadTopologyDocument(JSON.parse(text))` (or Builder → Import). It has 17 components in the mockup's shape: Sydney, Melbourne and AWS sources; syslog relays, UFs, a Lambda → Heavy Forwarder path; a multisite indexer; a search head; SOAR; users and an identity provider; and Deployment Server, License Manager and Monitoring Console. The mission and instance counts are set. Every screenshot check below uses it.

## Where Build 135 stands

The **content** is right: zones, per-type counts using "instances represented", the mission line, only the threads that are present, and key measures. The **drawing** is what falls short. Compared with the mockup:

| # | Mockup | Build 135 |
|---|---|---|
| A | Each shape is a **card**: pictogram, bold name, muted detail line ("≈120 hosts · Security, Sysmon") | Text-only rows ("Syslog Source · 30"); long names cut ("Authentication Provider · Cl") |
| B | **Curved connectors card to card**, with arrowheads, in four clearly different styles | Straight segments bunched on shared trunks at the zone borders, mostly hidden under the cards; no arrowheads; management and authentication lines barely visible |
| C | **Short mono flow tags** ("S2S · TLS · 9997 · ACK"), one per bundle, clear of cards | Labels overlap cards and each other ("TCP/TLS or", "File handoff ×2" struck through, "Splunk-to-Sp…" on top of "phone-home"); garbled tags ("Direct HEC HTTPS 8 · TLS · 8", "SAML SSO · TLS · SAML SSO"); cut at the frame edge ("ML SSO", "SO") |
| D | **Numbered thread markers** set beside their lines, one per thread, all present threads shown | Markers sit on line junctions and hide them; threads 2, 4 and 7 have no marker on the graphic |
| E | Zones with **small uppercase mono headings**; **sub-boxes** for each site ("Sydney data centre · site 1"), the indexer cluster and Management | Large sentence-case headings; the Management box overlaps the Search Head card |
| F | **Cloud sources in "Enterprise sites & cloud"** under an "AWS · ap-southeast-2" box | AWS Lambda is placed in "Collection and forwarding"; the AWS region box is missing |
| G | **People and response** laid out as roles: SOC analysts, platform administrators, identity provider, SOAR, with the authentication lines between them | A plain list; the SOAR line crosses the zone border from the search head |
| H | **Title block** (Architecture view, Architecture, Scope, Owner, Build · prepared), filled classification banners, and a **mission callout** with a left rule | One metadata line and a small bold "Mission:" |
| I | **Thread list** full width: number, name and two plain sentences written from the topology ("Forwarders send Splunk-to-Splunk over TLS on TCP 9997 with indexer acknowledgement…") | Two narrow columns of generic one-liners ("Sources supply events to collection and forwarding components.") |
| J | **Legend** with 36px line samples in the real styles; **key measures** as large figures ("≈ 180 GB/day", "2 copies", "12" in the review colour) | Tiny glyph legend ("━ Event data ┄"); small figures; "Items to review" not in the review colour |
| K | Footer "Page 2 of 16 · OV-1" | No page reference on screen |

Work through the sections below in order. Each has a check.

---

## 1. Layout grid (fixes E, and the empty space)

- Fixed SVG width 1160 (viewBox), four zone columns: Sites & cloud 280, Collection & forwarding 250, Platform 310, People & response 200, with a **60px gutter** between zones for connectors and tags. The height comes from content.
- **Zone:** rounded 6px, fill `--zone`, no heavy border; heading in 10.5px mono uppercase with 0.12em letter-spacing, `--muted` (for example "ENTERPRISE SITES & CLOUD", "SPLUNK ENTERPRISE PLATFORM").
- **Sub-boxes:** white (`--node`) rounded boxes with a 12px title in semibold:
  - Sites: one per region, titled "<region> · site n" for data centres, or "<Cloud> · <region>" for cloud (see item 3).
  - Platform: "Indexer cluster · multisite · RF x / SF y" when an indexer cluster exists, else "Indexing"; then search; then **Management at the bottom** with a 16px gap. Never overlap.
- Lay out each column top to bottom. Each zone's height is the tallest column's height (all zones equal, like the mockup), but no more than the content needs.
- Omit a zone with nothing in it, and let the others widen.

**Check:** no two boxes intersect (compare every pair of `getBBox()` rects); no zone has more than 40px of empty space below its lowest box (except the equal-height padding); the Management box is below the search cards.

## 2. Cards (fixes A)

Each aggregated shape (one per component type per sub-box, as now) is a card with no border, sitting in its sub-box:
- **Pictogram** 34×34 on the left: a 1.4px stroke in `--ink-2`, on a `--zone` rounded square. Copy the drawings from the mockup (`g.ic` groups): host list, network grid, syslog appliance, cloud, forwarder arrow, relay, funnel (HF), database (indexer), magnifier (search), server (DS), chart (LM/MC), people, shield (IdP), clipboard (SOAR). Put them in one lookup `builderOvIcon136(type)`, with a generic box for unknown types.
- **Name** in 13px semibold: the type name in the plural when the count is > 1 ("Universal Forwarders"), or the instance name when there's exactly one and it's named ("Firewalls and network devices").
- **Detail line** in 11px `--muted`: the count and one fact, for example "≈120 hosts · Security, Sysmon", "on Windows hosts · ≈165", "4 peers · hot/warm on SSD", "server classes · apps". Use `instancesRepresented` (with "≈" when set) or the node count, then the most useful known attribute (source type, sets, role). No "instances represented" wording.
- Wrap the name to two lines at the card width; **never truncate with "…" mid-word**. The card grows to fit.
- Card height 52px (64px with a wrapped name), with a 14px gap between cards.

**Check:** no text in the OV-1 SVG is clipped by its card (each `<text>` bbox inside its card); no "…"; every card has a pictogram.

## 3. Placement rules (fixes F and G)

- **Cloud collection types** (`awsLambda`, `azureFunction`, and `apiCollector` when its region is a cloud region) go in **Sites & cloud**, in a cloud sub-box titled from their region ("AWS · ap-southeast-2"), with a cloud pictogram. Their first on-premises hop (HEC endpoint or Heavy Forwarder) stays in Collection & forwarding.
- **Collection & forwarding:** Universal Forwarders first, then syslog relays, then HEC / Heavy Forwarder, then Edge / Ingest Processor. When the same type exists in several regions, show one card with "1 per site" in the detail line (for example "Syslog relays · 1 per site: Sydney, Melbourne").
- **People & response**, top to bottom: people (User / Administrator, split by role if roles are set: "SOC analysts · 24×7", "Platform administrators"), then the identity provider, then SOAR. Authentication lines run vertically inside this zone; the alert line comes in from the search card.
- Components with **no relationships** (like the unconnected Windows Event Log in the test file) still get a card, with the detail line "not connected" in the review colour.

**Check:** with the test topology, AWS Lambda is in Sites & cloud under "AWS · ap-southeast-2"; the Heavy Forwarder is in Collection & forwarding; SOAR is the lowest card in People & response.

## 4. Connectors (fixes B)

- One connector per **bundle**: all relationships between the same two cards and the same plane become one line (a count badge "×3" when merged, as now).
- Draw from the **right edge of the source card** (vertical centre; spread by 8px when several leave the same card) to the **left edge of the target card**, as a cubic Bézier: `M x1 y1 C x1+dx y1, x2-dx y2, x2 y2` with `dx = min(60, (x2-x1)/2)`. Same-column links (inside Platform or People) run vertically between card bottoms and tops.
- **Arrowhead** on every data, management and response line (`marker-end`, 7px, in the line colour). Replication is two-headed.
- Styles, the same as the canvas and the mockup: event data solid 2px `--data`; fleet management dashed `7 5` 1.8px `--mgmt`; authentication dotted `2 4` round caps 1.8px `--auth`; alerts and response solid 2px `--resp`.
- Draw management lines **last among the lines but under the cards**, and route them from the Management box's left edge back to the forwarders along the bottom of the gutter, so they don't cross the data lines at the same points.
- **Lines never pass under a card** except at their own endpoints: if the straight curve would cross a card, add a waypoint in the nearest gutter.

**Check:** every connector starts and ends within 2px of its own cards' borders; no path crosses another card's box (sample `getPointAtLength` every 8px); every non-authentication line ends in an arrowhead pointing into its target.

## 5. Flow tags (fixes C)

- **One tag per bundle**, in 9.5px mono, `--muted`, with a 3px `--sheet` halo (`paint-order:stroke`) so it reads over lines.
- **Place it in the gutter** on its own line, at the curve's midpoint, nudged up or down in 12px steps until it doesn't overlap a card, another tag or a thread marker. If it still can't fit, drop it from the graphic and keep the detail in the thread text (item 7). A missing tag is better than a colliding one.
- **Fix `builderOvTag132`:**
  - Don't cut the protocol at 18 characters mid-word (that produces "Direct HEC HTTPS 8"). Use a short-name map instead: Splunk-to-Splunk → "S2S", "Direct HEC HTTPS…" → "HEC HTTPS", "TCP/TLS or UDP" → "syslog", SAML SSO → "SAML".
  - Drop a part that repeats an earlier one ("SAML SSO · TLS · SAML SSO" → "SAML · MFA" when MFA is set).
  - Order the parts: protocol · TLS · port · ACK.
  - Examples: "S2S · TLS · 9997 · ACK", "HEC HTTPS · TLS · 8088", "phone-home · TLS · 8089", "SAML · MFA".

**Check:** no tag overlaps a card, another tag or a marker (bbox tests); no tag repeats a word; no tag is cut at the frame edge (every tag's bbox inside the SVG viewBox).

## 6. Thread markers (fixes D)

- One marker per **present** thread, drawn on the graphic: a 22px circle, white fill, 1.4px `--ink` stroke, number in 11px bold.
- Place it **beside** the thread's main line, never on a junction: at the midpoint of the thread's first bundle, offset 14px perpendicular to the line, on the side away from its tag. Suggested anchors: 1 in the Sites → Collection gutter; 2 in the Collection → Platform gutter; 3 beside the replication arrow; 4 below the search card; 5 beside the management trunk; 6 in the People zone next to the authentication line; 7 in the Platform → People gutter.
- Keep the fixed numbering 1–7 (a missing thread leaves a gap, as now).
- Hovering or clicking a marker (or its list item) highlights that thread's lines, cards and tags, and dims the rest to 15% opacity. This already works in the OV tab; keep it in the pack preview too.

**Check:** with the test topology, markers 1, 2, 4, 5, 6 and 7 are all on the graphic; none overlaps a line junction, a tag or a card.

## 7. Thread list (fixes I)

- Full width under the graphic (or the left 60% with the legend on the right, as in the mockup), one row per thread: circled number, **name** in 14px semibold, then **two plain sentences built from the model**, not fixed text. Templates:
  - **Collect:** "<Source types with counts> send to <collection types> in each site. <Cloud sources> push <what> through <path>."
  - **Forward:** "Forwarders send <protocol> over <TLS> on TCP <port><, with indexer acknowledgement> to the indexers<, in their own site>."
  - **Index and replicate:** "The <multisite> indexer cluster keeps <SF> searchable copies across <sites> (RF x / SF y)."
  - **Search and detect:** "<Search type> <runs correlation searches / serves dashboards> for <people roles>."
  - **Manage the fleet:** "The Deployment Server delivers apps and configuration to <n> <types> over phone-home on TCP <port>. <License Manager tracks daily ingest.>"
  - **Authenticate:** "<People> sign in through <identity provider> with <mechanism>. The model records the mechanism only, never credentials."
  - **Respond:** "Notable events start <SOAR> playbooks<, and open tickets for the on-call analyst>."
- Leave out any clause whose data is missing; never print "Not set" in a sentence.

**Check:** with the test topology each sentence names real components, protocols and ports from the model; switching TLS off on the S2S link changes the Forward sentence.

## 8. Page furniture (fixes H, J and K)

- **Banners:** full-width filled bars (`--class-bg` / `--class-fg`) at the top and bottom, with the classification in 11px mono uppercase and 0.14em letter-spacing. Share one component with the OV-2 and OV-3 pages.
- **Title block:** a five-cell grid as in the mockup:
  - Architecture view: "OV-1 · High-Level Operational Concept Graphic" at 20px.
  - Architecture.
  - Scope.
  - Owner / author (with the "Not set" chip).
  - Build · prepared: "135 · 29 Sep 2026".

  At phone width, two columns.
- **Mission callout:** a 3px left rule in `--data`, a "MISSION" label in mono, and the mission text in 15px. Omit it when empty.
- **Legend:** four 36px line samples drawn in SVG with the real dash patterns, plus the thread marker sample: "Operational thread (select to highlight)".
- **Key measures:** a 2×3 grid; figures in 18px semibold with "≈" or "≤" where they are estimates or limits; captions in 12px `--muted`. "Items to review" in the review colour. Use the same volume as OV-3 (after build135 item 5); show "2 copies · across sites (RF 2 / SF 2)" when an indexer cluster has settings.
- **Footer:** "<Architecture> · Owner <owner> · Generated from Builder topology", with "Page n of N · OV-1" on the right in the pack. In the OV tab, show "OV-1".
- **Type:** the SVG uses the app's sans for names, and a mono face for headings, tags and markers (the mockup uses IBM Plex Sans / Plex Mono; any installed mono is fine). Minimum 9.5px in the SVG and 11px in HTML text.

**Check:** the page has both banners, the five-cell title block and the mission callout; 0 text elements under 9.5px; light-theme contrast ≥ 4.5:1 for all text on the page background.

## 9. Size and print

- A4 landscape: the graphic plus the title block fits on page 1 at ≥ 9pt equivalent; the thread list and measures may flow to page 2.
- Dark theme: the same tokens as OV-2/OV-3 (the mockup's `:root` dark values); lines keep their hue, and cards use `--node`.
- Phone width (OV tab): the SVG scrolls sideways inside its figure box; everything else stacks.

---

## Acceptance (screenshot and compare)

1. Load `docs/mockups/ov1-reference-topology.json`, open the OV tab → OV-1 and the pack's OV-1 page, and take screenshots at 1280 wide in the light and dark themes.
2. Put them next to `docs/mockups/compare/ov1-mockup.png`. Each row of the gap table (A–K) should now match in kind: cards with pictograms, curved arrowed connectors in four styles, tags clear of everything, markers beside lines, AWS in Sites & cloud, Management below search, role-ordered People zone, title block, mission callout, full-width thread text, legend samples and large measures.
3. Automated: 0 `pageerror` events; no box intersections (item 1); no clipped text (item 2); no connector crossing a card (item 4); no tag or marker collisions (items 5 and 6).
4. Default topology (4 components): still a clean page, with only the zones that have content, threads 1–2, and no empty 300px zones.
5. Add a `changeRegister` entry for the new block (`builder-ov1-visual-v136` or the next free number).

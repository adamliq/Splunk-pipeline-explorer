# Handoff: line jumps where links cross

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 212.
**One new block, at the end of the page (before `</body>`):** `<script id="line-jumps-v213">`, containing [`docs/mockups/line-jumps-prototype.js`](mockups/line-jumps-prototype.js). There is no style block.

**One in-place edit,** under "The edit": the View menu's "Line jumps" item. Its old string occurs exactly once in Build 212. It is also in [`docs/mockups/line-jumps.diff`](mockups/line-jumps.diff), a unified diff against Build 212's `index.html` that also adds the block. It has no context lines, so it applies with `git apply --unidiff-zero`.

Paste the file as it is, make the edit, then add the build records (see "Build records").

**The label** is that of the draw.io suggestions in the Build 212 recheck ([`builder-handoff-build212.md`](builder-handoff-build212.md)): D6.

**Mockup (the target):** [`docs/mockups/line-jumps-mockup.html`](mockups/line-jumps-mockup.html). Four scenes have the block applied to Build 212, and the "Today" scene is Build 212. The screenshots are `docs/mockups/compare/line-jumps-*.png`.

**Tested first:** the block and the edit were applied to Build 212 and run. The results under "Check before uploading" come from that run.

## Why

### D6. Where links cross, nothing shows which way each goes

**What you see,** at 1,440 px:
- **Two links that cross** are drawn as two plain lines through the same point. Where links share a trunk or join another, they meet at corners and T-joins that look much the same, so in a busy diagram a crossing can read as a junction.
- **How often:** in the zones topology (`docs/mockups/sv-zones-topology.json`), lines cross once in the horizontal layout, 4 times in the vertical and 6 times in Free place. The reference topology (`docs/mockups/ov1-reference-topology.json`) has none in the horizontal and vertical layouts and 3 in Free place. Bigger topologies have more.
- **Exports** have the same: Export SVG of the zones topology's Free place layout has 10.

**How links are drawn:**
- **One link at a time.** `relationshipPath` (a chain of overrides from Build 123 to Build 163) routes each link on its own, as straight runs with small rounded corners: `M`, `L` and `Q` commands from `builderV123RoundedPath` (`builder-connector-geometry-v123`, line 4406), or plain `M` and `L`. Nothing looks at two links at once, so nothing knows where they cross.
- **On the canvas,** a link is a line (`path.unifiedConnector`) with an invisible, wider line beside it for clicks (`path.unifiedConnectorHit`), in `#builderTree .unifiedConnectorLayer`. About ten places redraw a line's route: a redraw, a drag, a waypoint move, a re-route, host links and collapsed groups.
- **Labels are placed from the drawn lines.** Build 156's label placement samples each line's route from the page (`builderPerfSample149`, `builder-indexed-redraw-v161`, line 8120, cached by the route's `d`), and reads some routes again as it goes: a label shown without text sits on its link's midpoint.
- **Exports draw their own copy.** Every diagram the Builder exports comes from `architectureSvgForScope` (`builder-navigation-aware-export`, line 2849): Export SVG and PNG through `builderDiagramSvg` (line 2850), the presentation (lines 2710 and 2852) and the architecture pack's grouped page (line 5431). Its links are the paths with an arrowhead (`marker-end`), in one group.

## The design

- **Where a link's horizontal run crosses another link's vertical run, the horizontal one jumps over the vertical one** with an arc 10 px wide and 5 px high, rising above the run whichever way the link goes, as Visio draws them. The vertical link is unchanged.
- **Only real crossings, clear of corners:** more than 8 px from both runs' ends, so an arc never runs into a corner or an arrowhead. Links that share a trunk, meet end-on or join another (T-joins) don't jump. Crossings closer together than an arc's width share one wider arc.
  - That leaves 3 of the zones topology's 11 crossings flat: in the vertical layout, 2 are 8 px from a corner, and in Free place 1 is 4 px from one. An arc there merges into the corner, and on dashed and dotted links it reads as a hook. So the zones topology has 1, 2 and 5 arcs in its three layouts, and the reference topology 0, 0 and 3.
- **On the canvas,** in every layout, at any zoom, on phones and touch screens. During a drag the arcs follow the routes at every frame.
- **In every export:** Export SVG and PNG, the presentation and the architecture pack's diagrams. With no crossings, an export is unchanged.
- **View › Line jumps** turns them off and on, on by default; the browser keeps the choice. Off, the canvas and every export are as on Build 212.
- **Unchanged:** labels and issue badges sit where Build 212 puts them; a click on a link, its selection and hover; the hit line keeps the plain route.

## The edit

In Build 212's `index.html`; the old string occurs exactly once.

**1. `<script id="builder-menubar-v198">`, line 12159: the View menu's "Line jumps" item, after Minimap.**
```
old: item(view,'Minimap',{check:()=>/hide/i.test(text(q('#builderMinimapToggle'))),run:()=>q('#builderMinimapToggle')?.click()});
new: item(view,'Minimap',{check:()=>/hide/i.test(text(q('#builderMinimapToggle'))),run:()=>q('#builderMinimapToggle')?.click()});item(view,'Line jumps',{check:()=>!!window.builderLineJumps213?.isOn(),run:()=>window.builderLineJumps213?.toggle()});
```
The new item goes on the same line, so the lines after it keep their numbers. `item` makes it a ticked menu item (`role="menuitemcheckbox"`), as Minimap is; the tick and the action come from the block.

## How the block works

1. **Reading a route:** `parse` reads a path's `d` as absolute `M`, `L` and `Q` commands, the only ones the Builder's routes use; any other path is left as it is. `runs` lists its straight runs along an axis: horizontal ones by y and x range, vertical ones by x and y range, with the command's index.
2. **Crossings:** `crossings` pairs each horizontal run of one link with each vertical run of every other link, and keeps a pair when the vertical run's x is more than 8 px inside the horizontal run and the horizontal run's y more than 8 px inside the vertical run. Runs that touch, overlap or meet end-on don't cross.
3. **Drawing the jumps:** `hopped` rewrites the run as a line to the arc's start, an `A` arc 5 px high to its end, and on to the run's end. The arc's sweep is 1 for a run drawn left to right and 0 for right to left, so it always rises above the run. Crossings closer together than 12 px share one arc, as wide as they need. Numbers are written to 0.01 px.
4. **The canvas:** `apply` takes every line, `#builderTree .unifiedConnectorLayer path.unifiedConnector[data-edge-id]`, except those an isolation (`navHidden`) or a collapsed component type (`builderTypeHidden130`) hides. A line with jumps keeps its plain route in `data-plain-d213` and the route with jumps in `data-jump-d213`, so each pass starts from the plain route, whoever drew the line last. Each line is written at most once per pass, and only when its `d` changes. The hit line keeps the plain route.
5. **When:** a `MutationObserver` on `#builderTree` (child lists, and `d` and `class` on lines) schedules a pass at the next animation frame: after a redraw, a drag step, a waypoint move, a re-route, an isolation or a selection. The block's own writes don't schedule another.
6. **Labels:** `builderPerfSample149` is wrapped: when label placement samples the routes, every line goes back to its plain route, and the jumps come back at the next frame, after the placement. So labels and issue badges go where Build 212 puts them.
7. **Exports:** `architectureSvgForScope` is wrapped: in the SVG it returns, the paths with an arrowhead, group by group, get the same jumps. With no crossings the SVG is returned as it was; otherwise the XML prolog is kept.
8. **The switch:** `window.builderLineJumps213` has `isOn`, `toggle` (which the menu item calls), `apply` and `count`. Off is kept in `localStorage` as `splunkPipelineExplorer.lineJumps.v1` = `off`; toggling says "Line jumps on" or "Line jumps off" in the Builder's status line.
9. **A pass when the block runs.**

## Build records

After the block and the edit:
- **`changeRegister`,** group "Explorer foundations":
  `['Line jumps where links cross','Where a link\'s horizontal run crosses another link\'s vertical run, the horizontal one jumps over it with a small arc, on the canvas and in every export. View › Line jumps turns them off and on.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 212 did in `link-label-clicks-records-v212`, with Build 213.

## Found while testing (not changed)

1. **Export SVG routes links from its own layout,** not the canvas's. In the zones topology, of the 16 links, the export routes 4 differently from the canvas in the horizontal layout, 14 in the vertical and 8 in Free place; the rest have the canvas's routes, moved. So the export has crossings of its own: 1 in the vertical layout where the canvas has 2, and 10 in Free place where the canvas has 5. Each gets its jumps from the export's routes. As on Build 212, apart from the jumps.
2. **Export SVG's labels can overlap,** on Build 212 too: in the zones topology's Free place export, "Syslog UDP 514 · TCP 514" covers "File handoff" by 88 × 9 px, and "TCP/TLS or UDP" covers another "Syslog UDP 514 · TCP 514" by 99 × 19 px. The block changes only the links' routes.
3. **An issue badge on a crossing covers its arc,** as it covers the crossing on Build 212. In the zones topology's Free place layout, two links from the Syslog VIP share a run where it crosses Syslog Server 2 → Universal Forwarder 2, and two links' issue badges sit on that spot, over both arcs. The storyboard is framed on a crossing nothing covers.
4. **On phones there is no switch:** the View menu isn't shown there (fault 20), so jumps stay on unless turned off on a wider screen; the browser keeps one setting for both. The phone's one column has no crossings in the sample topologies.
5. **A collapsed group's links have no jumps:** they are drawn as `path.collapsedGroupConnector` (`appendCollapsedConnector`), which the block leaves alone.

## Check before uploading

Run with Build 212 + the block + the edit, and with Build 212 as shipped for comparison. The crossings are found by the checks themselves, from Build 212's routes.

### 1. The feature: 22 checks, all pass

| Check | Result |
|---|---|
| Every layout at 1,440 px | The default topology: no crossings. The reference topology: 0, 0 and 3 crossings in the horizontal, vertical and Free place layouts; the zones topology: 1, 2 and 5. Each crossing has one arc, on the horizontal link and none on the link under it. The jumping links keep every corner of their routes; links without a crossing, hit lines and labels are as on Build 212 |
| View › Line jumps | A ticked menu item (`menuitemcheckbox`) |
| Unticking it | Every line as on Build 212, the item unticked, and "Line jumps off" in the status line |
| A reload with it off | No arcs. Turned on again, 2 of 2 crossings have an arc |
| Export SVG, zones topology | Vertical layout: 1 crossing in the export, with an arc. Free place: 10 of 10 |
| Export SVG with no crossings | The reference topology's horizontal layout: the same as Build 212's |
| Export SVG with line jumps off | The same as Build 212's |
| The presentation | Its diagram has the arcs too |
| Dragging a card in Free place | 6 routes move; 5 of 5 crossings have an arc before, during the drag and after the drop |
| Clicking a link with an arc | Selects it and draws it as selected, with its arc |
| Zoomed out to fit | 5 of 5 crossings have an arc |
| A 390 px phone | The one column has no crossings; every line and label is as on Build 212 |
| A 1,024 px touch screen, Free place | 6 of 6 crossings have an arc; labels and hit lines as on Build 212 |
| Speed | A pass over the zones topology's 16 links takes 0.11 ms. With 100 horizontal lines crossing 100 vertical ones added (10,449 crossings, 9,998 arcs), 10 to 13 ms |
| Page errors | None |

### 2. Regression

Against Build 212:

| Suite | Result |
|---|---|
| The link label clicks checks (Build 212's fix, against Build 211) | 15 of 15 |
| The toolbar, lanes and labels checks (against Build 210) | 42 of 42 |
| The room-and-header checks (against Build 209) | 40 of 40 |
| The quick fixes | 27 of 27 |
| Moving the rest of Tools | 37 of 37 |
| The five fixes | 49 of 49 |
| The small fixes | 44 of 44 |
| Config view | 49 of 49 |
| Add the next component from a card's handle | 55 of 58, as on Build 212: the other 3 expect Build 209's Free place spacing. Expecting Build 210's, 58 of 58 |
| View text, every view | 97 of 97 the same |
| OV pages and Validate | 87 of 87 the same |
| Menu bar actions | 69 of 69 |
| Parsing laboratory | 68 of 68 ("Click to next frame" 150 ms, limit 1,000) |
| Canvas card views | 123, unchanged |
| The space tool | The same output as Build 212 |
| The connector tool | The same output as Build 212 |
| Page errors | None |

Apart from the timing, every suite prints what it printed for Build 212, line for line.

# Explorer handoff: fixes and improvements from a review of every UI element

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 236.
**Applied:** as Build 237, in `index.html` on the branch `claude/build-page-layout-bl6jk1`, and merged to `main`. Nothing is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="ui-review-v237">` (137 lines), after `alert-pack-v236`, containing [`docs/mockups/ui-review-prototype.js`](mockups/ui-review-prototype.js). It sets no globals. It wraps `builderOvRender135`, `builderOvShow135`, `builderOvDiagram137` and `switchView`, as earlier blocks do.
- `<style id="ui-review-v237-styles">` (148 lines), after `alert-pack-v236-styles`, containing [`docs/mockups/ui-review-prototype.css`](mockups/ui-review-prototype.css). It holds the rules written for the items below, then the 11 px text floor for items 8, 9 and 11: 26 rules made and checked by [`docs/mockups/ui-review-text-floor.js`](mockups/ui-review-text-floor.js) at 1440 and 390 px, 8 narrower rules by hand, and 3 for the Builder's phone controls.

**25 in-place edits,** under "The edits". Each old string occurs exactly once in Build 236. One, the second phone menu's code, replaces seven lines with two; no other edit changes the number of lines.

The edits, the block and the styles are also in [`docs/mockups/ui-review.diff`](mockups/ui-review.diff), a unified diff against Build 236's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**Two repo tools change with it:** `tools/offline-check.js` opens each OV view by a click in the page, as a view of another viewpoint is hidden until its viewpoint is chosen, and `tools/builder-connector-check.js` measures a review badge by its drawn circle, not the transparent circle under it (item 13). Both are under "Earlier builds' checks".

**The request:** "Check all ui elements for fixes, improvements", then "All. Merge": build every item of the review's list of 19, and merge.

**How the review was done:**
- The 7 single views, the 28 OV views and the 23 Operate pages were swept automatically at 1440, 1024 and 390 px wide, with 19 further states: paths, components, pipeline sets, Config's example, Diagnose symptoms, the Failure Lab's modes and filter, Changes filtered, the header's search and filter.
- The keyboard went through 641 controls on 13 pages.
- Each page was looked at by eye, and each finding traced to its code.

**Sources:**
- WCAG 2.2: [Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html), [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html).
- MDN: [the label element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) and [sticky positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky_positioning).

The storyboard is [`docs/mockups/ui-review-mockup.html`](mockups/ui-review-mockup.html): each scene on the new page with its items marked, and Build 236's for comparison.

## The 19 items

### Fixes

1. **Queue bars show their level.** Each bar's fill ran from 9% to its level and back, forever (2.4 s each way, 1.25 s when full), so it seldom matched the number beside it: four seconds after opening Correlate, a 96% queue was drawn at 28% of its track. The fill now grows once, in 0.9 s, to its level and stays (edit `queue-fill`). With the flow paused, a bar is drawn at its level at once; before, pausing froze it wherever it was, and a bar drawn while paused would have stayed at 9% (`queue-paused`). The same rule draws Correlate's, Inject's and the Flow view's bars.
2. **One Actions menu on a phone.** Build 136 made an Actions menu for OV's header buttons on narrow screens; Build 145 made a second, which took the buttons, and the first opened empty. Build 136's code no longer makes its menu (`ov-phone-menu`).
3. **The OV header names the open view.** It read "OV-1 · OV-2 · OV-3 · DIV-1" over a line about three views, on all 28. It now reads "Architecture views", and its line names the open view and its viewpoint, as "SvcV-4 · Services Functionality Description · Services viewpoint", kept up to date by the block on each change of view. Its small label reads "Derived from the current Builder topology · Build 237". The tab strip is named "Architecture views", and the OV button's name, "OV: architecture views", now contains its visible label (`ov-title`, `ov-head-markup`, `ov-head-line`, `ov-view-button`).
4. **The open page's entry stays in sight.** OV's tabs went back to AV-1 when OV was drawn again, with the open view's tab out of sight; Operate's row on a phone always started at Health overlay; on a desktop, Operate's 20th entry sat 1,224 px down a 900 px window. The block scrolls a row or a list, never the page, so the open entry sits in the middle of the part on screen. Operate's list on a desktop stays beside the page as it scrolls (sticky, under the toolbar), and its height is what is on screen below its top, growing as the page scrolls, so the open entry can always be put in sight. On a phone, items 16 and 17 put OV's views and Operate's pages in one list each.
5. **A file handoff has no port.** The link inspector showed Port 0 for a File handoff link, which has no port; the Builder's own relationship form refuses 0. It now shows "Not applicable", as TLS does, in a field that can't be edited (`file-port`). The model is unchanged: `inferredRelationshipPort()` still returns 0 for it, which SV-1's tables show as "Not set".

### Accessibility

6. **Inject's fields have names.** Its eight fields had labels on screen tied to nothing, so screen readers announced "combo box" or "spin button" with no name, and clicking a label did nothing. Each label now has `for` and its field an `id` (`inject-*`, eight edits).
7. **Config's tier marks don't rely on colour.** UF, HF, IDX and SH were green, amber or grey, with the meaning in a hover title. Each mark now starts with a sign, ✓ runs there, ? conditional, – not used, and carries its meaning for screen readers (`tier-marks`); a key above the settings says what the signs mean (`tier-key`); "not used" is 6.4:1, not 2.79:1 (`tier-none`). Their column is 152 px wide on screens over 780 px, not 116, so the four fit on a line.
8. **Correlate's and Inject's text is 11 px or more,** from 8.3–9.9 px. By the text floor.
9. **So is the Flow view's with two pipeline sets,** from 9–9.8 px: the lane markers, the shared-constraints band, the work band, the small queue gauges and the accuracy cards. By the text floor.
10. **OV diagram labels are 11 px or more on screen.** Two causes. A print rule, `.ov1Page132 svg{max-height:125mm}`, applied on screen too, and drew several diagrams to 472 px tall: SvcV-1's labels came out at 6.7 px, and DIV-1's at 6.7–7 px, which the review missed. Other diagrams drew labels at 8.3–10.8 px. On screen the cap is lifted. Then, for each diagram as it is shown, the block raises each label under 11 px to 11 px, unless that would take it out of a box it sits in, nearer the box's edge than it was (up to 4 px across, 1 px up and down), or onto another label. Those grow as far as they fit, and if any label is still under 11 px, the whole diagram is drawn wider, to scroll sideways in its box. Each diagram keeps at least the width it has at 1440 px, so on a narrower screen it scrolls sideways at full size instead of shrinking. Sizes are CSS variables read only by screen rules, so print and the architecture pack keep the diagrams' own sizes. At 1440 px, SvcV-1 (1,550 px in a 1,242 px box) and SvcV-4 (1,456 in 1,240) are now wider than their box and scroll sideways; the other ten fit.
11. **Other text under 11 px:** Multi-region & DR's replication label (8.8 px), SV-10a's table foot (9.9), SvcV-3a's and 3b's column heads and foot (9), SV-3's numbers (9.6), CV-6's, CV-7's, SV-5b's and SvcV-5's headers (10.6–10.9), SvcV-6's "Data flow" (10), the OV header's small label on a phone (9), and the Builder's phone controls. By the text floor's narrower rules.
12. **Faint lines are legible.** Overridden settings were at 45% opacity and settings with no effect at 50%, as low as 3.2:1 when both. Both are now struck through or marked as before, in a muted colour at 7:1 (`overridden`, `no-effect`). Line numbers are 5.8:1, from 3.61:1 (`line-numbers`).
13. **Phone tap targets are 24 px or more:** the Inspector's sheet handle (a 5 px bar in a 64 × 24 px target), Config's stage and Remove links and setting rows, the Builder's route links, AV-1's view chips, SV-3's header buttons and system chips, CV-1's increment editor. An SVG marker can't take a CSS pseudo-element, so OV-1's thread markers get a transparent circle 26 units across, last in each marker (`thread-hit`), and the Builder's link review markers one under each whose radius follows the canvas zoom, `max(18px, 12px / zoom)`, so it is 24 px or more at any zoom (`edge-marker-hit`). The blocks that place an OV-1 marker (v144, v167 and v168, which wrap `builderOvDiagram137`) move its first circle and its text, so the new circle comes after them and the block puts it on the marker once they have. Each new circle carries its paint, and the Builder's its radius, in its own style attribute, with `!important`: earlier rules paint every circle in a marker (the Builder's with an id and `!important`) and set a review-only marker's circles to r 11. The markers are drawn as before. A click within a link review marker's circle opens its findings, as a click on the marker did; on a short link the circle can cover the part of the line its label leaves free, and the link is then selected by its label.
14. **The Failure Lab's "component handoff" label** is 5.6:1, from 4.0:1.
15. **The selected scenario pack shows keyboard focus.** Focus only changed the border, and the selected pack's own border rule came later and won. Focus is now a 2 px outline (`pack-focus`).

### Improvements

16. **OV's 28 views are grouped by viewpoint.** A row of eight viewpoints, each with its count: All (AV-1, AV-2), Operational (OV-1, 2, 3, 5a, 6c), Data (DIV-1), Security (TM-1), Capability (CV-1, 2, 6, 7), Services (SvcV-1 to 6), Systems (SV-1, 2, 3, 5b, 6, 10a, 10c) and Standards (StdV-1). Under it, that viewpoint's views. Choosing a viewpoint opens the view last open in it, or its first. The two rows stay together at the top as a view scrolls. The arrow keys still go through every view, across viewpoints. TM-1's group is "Security", as AV-1's register names its viewpoint ("Security, not DoDAF"); the review's list said "Threat". On a phone, one list with a group per viewpoint, labelled View, takes the rows' place.
17. **Operate's 23 pages are in five groups:** Fleet (Health overlay, Multi-DS management, Capacity model, Performance guardrails), Simulate (Recovery simulation, Data-quality simulation, Scenario library, Parsing laboratory), Trace (Detection lineage, Telemetry chain-of-custody, Event walkthrough, Login walkthrough), Boundaries (Security, Authentication and Responsibility boundaries, Combined boundary overlay, Multi-region & DR) and Outputs (Runbook, Generate, Alert and dashboard pack, Compare, Evidence pack, Architecture report). Each group is headed and named for screen readers, and the list is a navigation landmark. The buttons are the page's own, moved into their groups. On a phone, one list with the same groups, labelled Page, takes the row's place.
18. **A shorter header on a phone.** It ended 412 px down an 844 px screen. On screens up to 820 px wide, except the Builder's, which has its own: no tagline; a search button (named "Search and filter") that opens search and the pipeline filter and shows "On" when either is in use; the views in one row beside it, with a fade where more are hidden and the open view in sight. It now ends at 201 px on Flow, the Failure Lab and Operate (OV's own header starts at 77 px, from 146).
19. **No extra title bar on OV's views.** Sixteen views opened with a bar naming the view above the classification banner, then named it again in the title block; twelve didn't. The bar is hidden on screen, and print keeps it.

### Not covered

- The review's list, item 10, said SvcV-1's drawing was "much of it empty frame". Its content spans the full width; the empty space is inside its lanes. Its labels are fixed by the cap and the fit, not by cropping.
- The Builder's canvas is zoomable, so its cards and labels are as small as the zoom makes them. Only the link review markers' targets follow the zoom.

## The edits

Each on Build 236’s line, in the order of the page.

1. **Line 80, in the queue bars’ fill.** Item 1, `queue-fill`. Each bar ran from 9% to its level and back, forever, so it seldom showed its level. It now grows once to its level and stays.
```
old: animation:queueFill 2.4s ease-in-out infinite alternate}
new: animation:queueFill .9s ease-out both}
```
2. **Line 80, in queue bars while the flow is paused.** Item 1, `queue-paused`. Pausing froze a bar wherever it was. A paused flow now shows each bar at its level, without the grow.
```
old: .flowPaused .stageNode.direct,.flowPaused .queueFill{animation-play-state:paused}
new: .flowPaused .stageNode.direct{animation-play-state:paused}.flowPaused .queueFill{animation:none}
```
3. **Line 1,519, in inject’s Arrival rate field.** Item 6, `inject-arrivalEps`. Its label is now tied to it (for and id), so it has a name, and clicking the label focuses it.
```
old: <label>Arrival rate · EPS</label><input data-injection="arrivalEps"
new: <label for="injectionArrivalEps237">Arrival rate · EPS</label><input id="injectionArrivalEps237" data-injection="arrivalEps"
```
4. **Line 1,519, in inject’s Durable buffer field.** Item 6, `inject-bufferGb`. The same.
```
old: <label>Durable buffer · GB</label><input data-injection="bufferGb"
new: <label for="injectionBufferGb237">Durable buffer · GB</label><input id="injectionBufferGb237" data-injection="bufferGb"
```
5. **Line 1,519, in inject’s Outage duration field.** Item 6, `inject-durationMin`. Its label is now tied to it (for and id), so it has a name, and clicking the label focuses it.
```
old: <label>Outage duration · minutes</label><input data-injection="durationMin"
new: <label for="injectionDurationMin237">Outage duration · minutes</label><input id="injectionDurationMin237" data-injection="durationMin"
```
6. **Line 1,519, in inject’s Average event size field.** Item 6, `inject-eventKb`. The same.
```
old: <label>Average event size · KB</label><input data-injection="eventKb"
new: <label for="injectionEventKb237">Average event size · KB</label><input id="injectionEventKb237" data-injection="eventKb"
```
7. **Line 1,519, in inject’s Fault type field.** Item 6, `inject-fault`. Its label is now tied to it (for and id), so it has a name, and clicking the label focuses it.
```
old: <label>Fault type</label><select data-injection="fault"
new: <label for="injectionFault237">Fault type</label><select id="injectionFault237" data-injection="fault"
```
8. **Line 1,519, in inject’s Normal / recovery capacity field.** Item 6, `inject-recoveryEps`. The same.
```
old: <label>Normal / recovery capacity · EPS</label><input data-injection="recoveryEps"
new: <label for="injectionRecoveryEps237">Normal / recovery capacity · EPS</label><input id="injectionRecoveryEps237" data-injection="recoveryEps"
```
9. **Line 1,519, in inject’s Stage field.** Item 6, `inject-stage`. Its label is now tied to it (for and id), so it has a name, and clicking the label focuses it.
```
old: <label>Stage</label><select data-injection="stage"
new: <label for="injectionStage237">Stage</label><select id="injectionStage237" data-injection="stage"
```
10. **Line 1,519, in inject’s Component field.** Item 6, `inject-target`. Its label is now tied to it (for and id), so it has a name, and clicking the label focuses it.
```
old: <label>Component</label><select data-injection="target"
new: <label for="injectionTarget237">Component</label><select id="injectionTarget237" data-injection="target"
```
11. **Line 2,315, in a File handoff link’s port.** Item 5, `file-port`. The link inspector showed Port 0 for a file handoff, which has no port. It now says Not applicable, as TLS does.
```
old: <label>Port<input data-relationship-field="port" type="number" min="0" max="65535" value="${d.port}"></label>
new: <label>Port${/file handoff/i.test(d.protocol)&&!d.port?'<input data-relationship-field="port" type="text" value="Not applicable" disabled>':`<input data-relationship-field="port" type="number" min="0" max="65535" value="${d.port}">`}</label>
```
12. **Line 3,149, in the Builder’s link review markers.** Item 13, `edge-marker-hit`. A transparent circle under each marker; its radius follows the canvas zoom, so the marker can be tapped at 24 px or more at any zoom. Its paint and radius are its own, and important: earlier rules paint every circle in a marker, with an id and !important, and set a review-only marker’s circles to r 11.
```
old: circle.setAttribute('r','12');label.textContent=list.length>9?'9+':String(list.length);group.append(circle,label);
new: circle.setAttribute('r','12');label.textContent=list.length>9?'9+':String(list.length);const hit237=document.createElementNS('http://www.w3.org/2000/svg','circle');hit237.setAttribute('class','hit237');hit237.setAttribute('r','18');hit237.setAttribute('style','fill:transparent!important;stroke:none!important;r:max(18px,calc(12px / var(--builder-zoom163,1)))!important');group.append(hit237,circle,label);
```
13. **Line 5,745, in the OV header’s line.** Item 3, `ov-head-line`. The same.
```
old: <h2>OV-1 · OV-2 · OV-3</h2><p>Concept, resource flows and assurance matrix derived from the current Builder topology.</p>
new: <h2>Architecture views</h2><p class="ovHeadView237"></p>
```
14. **Line 5,745, in the OV header as first drawn.** Item 3, `ov-head-markup`. The same title and a line that described three views. The line now names the open view (set by the new block).
```
old: <small>Operational architecture views · Build '
new: <small>Derived from the current Builder topology · Build '
```
15. **Line 5,992–5,998, in the second Actions menu on a phone.** Item 2, `ov-phone-menu`. Build 136 made an Actions menu for the OV buttons on narrow screens; Build 145 made another and took the buttons into it, so the first opened empty. The first is no longer made.
```
old:   const actions=root.querySelector('.ovHeadActions135'),edit=root.querySelector('#ovEdit135');
  if(actions&&edit&&matchMedia('(max-width:760px)').matches){
    const details=document.createElement('details'),summary=document.createElement('summary'),content=document.createElement('div');
    details.className='ovActionsMenu136';summary.textContent='Actions ▾';content.className='ovActionsContents136';
    [...actions.children].filter(child=>child!==edit).forEach(child=>content.appendChild(child));
    details.append(summary,content);actions.insertBefore(details,edit);
  }
new:   // Build 237: on narrow screens the header's buttons go into builder-ov-mobile-v145's Actions menu. A second menu made
  // here for the same buttons opened empty once that one took them, so it is no longer made.
```
16. **Line 6,196, in oV-1’s thread markers.** Item 13, `thread-hit`. A transparent circle 26 units across over each marker, last in it, so it can be tapped at 24 px or more; the marker is drawn as before. Later blocks move a marker by its first circle and its text, and paint every circle in it, so the new circle comes last, carries its own paint, and the block moves it onto the marker once they have.
```
old: '"><circle cx="'+(m.x+11)+'" cy="'+(m.y+11)+'" r="11"/><text x="'+(m.x+11)+'" y="'+(m.y+11)+'">'+m.n+'</text></g>'
new: '"><circle cx="'+(m.x+11)+'" cy="'+(m.y+11)+'" r="11"/><text x="'+(m.x+11)+'" y="'+(m.y+11)+'">'+m.n+'</text><circle class="hit237" cx="'+(m.x+11)+'" cy="'+(m.y+11)+'" r="13" style="fill:transparent!important;stroke:none!important"/></g>'
```
17. **Line 8,937, in the OV header’s title and the tab strip’s name.** Item 3, `ov-title`. The header named OV-1, OV-2, OV-3 and DIV-1 whichever of the 28 views was open, and screen readers heard the strip as “Operational and data views”.
```
old: root.querySelector('.ovHead135 h2').textContent='OV-1 · OV-2 · OV-3 · DIV-1';tabs.setAttribute('aria-label','Operational and data views');
new: root.querySelector('.ovHead135 h2').textContent='Architecture views';tabs.setAttribute('aria-label','Architecture views');
```
18. **Line 8,946, in the OV view button’s name.** Item 3, `ov-view-button`. Its name, “Operational and data views”, did not contain its visible label, OV.
```
old: $('[data-view="ov"]')?.setAttribute('aria-label','Operational and data views');
new: $('[data-view="ov"]')?.setAttribute('aria-label','OV: architecture views');
```
19. **Line 13,229, in line numbers.** Item 12, `line-numbers`. 3.61:1; now 5.8:1.
```
old: .propsN205{color:#5d7183;
new: .propsN205{color:#8193a5;
```
20. **Line 13,247, in the “not used” mark’s colour.** Item 7, `tier-none`. 2.79:1 against its chip; now 6.4:1.
```
old: .propsTiers205 i.none{color:#4d5f70}
new: .propsTiers205 i.none{color:#8a9bab}
```
21. **Line 13,253, in settings with no effect.** Item 12, `no-effect`. Drawn at 50% opacity, as low as 3.2:1 when also overridden; now in the same muted colour at 7:1, beside its “No effect”.
```
old: .propsLine205.noEffect205>code{opacity:.5}
new: .propsLine205.noEffect205>code{color:#93a3b1}.propsLine205.noEffect205>code *{color:inherit!important}
```
22. **Line 13,255, in overridden settings.** Item 12, `overridden`. Drawn at 45% opacity (3.2–4.1:1); now in a muted colour at 7:1, still struck through.
```
old: .propsLine205.overridden205>code{opacity:.45}
new: .propsLine205.overridden205>code{color:#93a3b1}.propsLine205.overridden205>code *{color:inherit!important}
```
23. **Line 13,714, in config’s tier marks.** Item 7, `tier-marks`. Each mark now carries a sign (✓ runs, ? conditional, – not used) and, for screen readers, its meaning; colour alone no longer says it.
```
old: <i class="${c[k]==='required'?'yes':c[k]==='conditional'?'maybe':'none'}" title="${componentNames[k]}: ${statusLabel(c[k])}">${shortTier(k)}</i>
new: <i class="${c[k]==='required'?'yes':c[k]==='conditional'?'maybe':'none'}" title="${componentNames[k]}: ${statusLabel(c[k])}"><b aria-hidden="true">${c[k]==='required'?'✓':c[k]==='conditional'?'?':'–'}</b>${shortTier(k)}<span class="vh237">: ${statusLabel(c[k])}</span></i>
```
24. **Line 13,762, in a key for the tier marks.** Item 7, `tier-key`. A line above the settings says what the signs mean, when the marks are shown.
```
old: <ol class="propsLines205" role="tabpanel" aria-label="${pm.tab}.conf">
new: ${tier()==='all'?'<p class="propsTierKey237"><b>Tiers</b><span><b aria-hidden="true">✓</b> Runs there</span><span><b aria-hidden="true">?</b> Conditional</span><span><b aria-hidden="true">–</b> Not used</span></p>':''}<ol class="propsLines205" role="tabpanel" aria-label="${pm.tab}.conf">
```
25. **Line 17,114, in a scenario pack’s keyboard focus.** Item 15, `pack-focus`. Focus only changed the border, and the selected pack’s border rule won, so tabbing onto it showed nothing. Focus is now an outline.
```
old: .sl235PackBtn:hover,.sl235PackBtn:focus-visible{border-color:#48657b;outline:none}
new: .sl235PackBtn:hover{border-color:#48657b}.sl235PackBtn:focus-visible{border-color:#48657b;outline:2px solid #57c7e8;outline-offset:2px}
```

## The new block

The block's files, in order, each a part of one function scope:
- `10-common.js`: helpers, and `centerIn237()`, which scrolls a row or column (not the page) so an entry sits in the middle of its part on screen.
- `20-ov.js`: items 3, 4, 13 and 16. OV-1's thread markers' hit circles put on their markers, after the blocks that place the markers (wrapping `builderOvDiagram137`). The views' names and viewpoints; the viewpoint row and the phone list, made after each render (`builderOvRender135`), the tab strip moved into them; the header's line, the pressed viewpoint, the shown tabs, the list's value and the open tab's place kept up after each `builderOvShow135`.
- `30-operate.js`: items 4 and 17. The groups and the phone list, made once (the page's buttons are moved in); kept up when a button's class changes; the list's height and top, from the toolbar's height, on a view switch, a resize and page scroll.
- `40-diagrams.js`: item 10. The fit, run for each diagram of the view shown, on render, on show, and when a view redraws its diagram; run again after a resize.
- `50-header.js`: item 18, and the `switchView` wrapper.

## Build records

A `<script id="ui-review-records-v237">` before `</body>`, as Build 236's: the change register's "Explorer foundations" gets

```
['Fixes from a review of every UI element','Queue bars show their level, the OV header names the open view and its 28 views are grouped by viewpoint, Operate’s pages are grouped with the open one in sight, a file handoff has no port, and phones get a shorter header and one list for OV and for Operate. Inject’s fields are labelled, Config’s tier marks have signs, faint text is darker, diagram labels and other text are 11 px or more, and phone targets are 24 px.',true]
```

and the build number, date, title and the Builder's build note read Build 237, 27 Nov 2026.

## Check before uploading

### 1. The checks: 33. All pass with the edits; on Build 236, 1 passes (no page errors) and the rest fail

`acc37.js`, in the scratch work, checks each item as a person meets it, at 1440 px and, for the items about phones, at 390 px:

- 1 Correlate: each queue bar is drawn at the level it states, and stays there.
- 1 Inject: the buffer pressure bar is drawn at its level.
- 1 A full gauge grows once to its level; with the flow paused it is drawn at its level at once.
- 2 OV on a phone: one Actions menu, with Refresh, the theme, Print / PDF and the architecture pack.
- 3 OV: the header names the section, and its line names the open view and viewpoint.
- 3 OV: the tab strip is named “Architecture views”, and the OV button’s name contains its label.
- 4 OV: after leaving and coming back, the open view’s tab is in sight.
- 4 Operate on a desktop: the open page’s entry is on screen.
- 4 Operate on a phone: one list names the open page, and choosing a page opens it.
- 5 A File handoff link: Port says Not applicable, not 0.
- 6 Inject: all eight fields are named by their labels, and clicking a label focuses its field.
- 7 Config: each tier mark has a sign and its meaning, a key says what the signs mean, and “not used” is 4.5:1 or more.
- 8 Failure Lab: no text under 11 px in Correlate or Inject.
- 9 Flow with two pipeline sets: no text under 11 px.
- 11 No text under 11 px on Multi-region & DR, the OV tables and the OV header on a phone.
- 10 OV diagrams at 1440 px: every label is 11 px or more on screen.
- 10 On a phone the diagrams keep their size and scroll sideways: labels 11 px or more.
- 10 The larger label sizes are for screens only: print keeps the diagrams’ own sizes.
- 12 Config: overridden settings and line numbers are 4.5:1 or more, and overridden ones are still struck through.
- 13 Phone: the listed controls are at least 24 px.
- 13 OV-1: each thread marker has one circle, with its number on it, and a transparent hit circle on it, last.
- 13 Builder: each link review marker has a transparent hit circle under it, 24 px or more across, on the marker.
- 14 Failure Lab: the handoff label is 4.5:1 or more.
- 15 Scenario library: the selected pack shows a focus outline.
- 16 OV: eight viewpoints; choosing one shows its views and opens one.
- 16 OV: the arrow keys still move through every view, across viewpoints.
- 16 OV on a phone: one list of the 28 views in 8 viewpoints opens a view.
- 17 Operate: the 23 pages in five headed groups.
- 17 Operate on a phone: the list has the same five groups.
- 18 Phone: the page header ends by 300 px (it ended at 412).
- 18 Phone: one row of views beside a search button that opens search and the filter, and says when either is in use.
- 19 OV: no extra title bar on screen (the title block names the view); print keeps it.
- No page errors.

**Found by the first final run, and fixed.** Its pictures showed two empty circles beside OV-1's thread marker 1. The new hit circle had been put first in each marker, and the blocks that place a marker move its first circle and its text: they moved the hit circle, which an earlier rule painted white with a dark ring, and left the marker's own circle where it was first drawn. In the Builder, earlier rules painted the hit circle as the marker and set it to r 11, so a review-only marker's target was no bigger. The checks had measured each marker's box, which the hit circle filled either way. Item 13 is now as described above; two checks were added, for OV-1's markers and the Builder's, and both fail on the page the first run tested. Check 5, and the scripts that open a File handoff link, now click a link where a person would: on its line where the link takes the click, or else on its label, as the larger hit circle can cover the middle of a short link. The final run was then repeated on the fixed page, and the figures below are from it.

### 2. Earlier builds' checks

Build 234’s, 235’s and 236’s checks open an Operate page with a Playwright click on its menu entry, at 390 px too. On a phone Build 237 shows one list in place of the row of entries, so those clicks can’t reach a hidden entry. Their copies, `acc34-v237.js`, `acc35-v237.js` and `acc36-v237.js`, open the page by a click in the page instead, and differ in nothing else. The same holds for Build 236’s sweep of its new UI, run here as `toolsweep36-v237.js` before the final run, and for the repo’s `tools/offline-check.js`, which opened each OV view with a Playwright click: a view of another viewpoint is not shown until its viewpoint is chosen. It now clicks each tab in the page (committed with this build).

| Suite or tool | Build 236 | Build 236 + the edits |
|---|---|---|
| Build 236’s 46 checks, opening Operate’s pages by a click in the page | 46 of 46 | 46 of 46 |
| Build 235’s 46 checks, the same | 46 of 46 | 46 of 46 |
| Build 234’s 53 checks, the same | 53 of 53 | 53 of 53 |
| Build 233’s 58 checks | 58 of 58 | 58 of 58 |
| Build 232’s 29 checks | 29 of 29 | 29 of 29 |
| Build 231’s 37 checks, as Build 236 runs them | 37 of 37 | 37 of 37 |
| Build 230’s 29 checks | 29 of 29 | 29 of 29 |
| Build 230’s checks of its block, in Node | 26 of 26 | 26 of 26 |
| Build 229’s 26 checks | 26 of 26 | 26 of 26 |
| Build 229’s checks of its block, in Node | 13 of 13 | 13 of 13 |
| Build 228’s 36 checks | 36 of 36 | 36 of 36 |
| Build 228’s checks of its block, in Node | 39 of 39 | 39 of 39 |
| Build 227’s 47 checks | 47 of 47 | 47 of 47 |
| Build 227’s checks of its block, in Node | 31 of 31 | 31 of 31 |
| Build 226’s 29 checks | 29 of 29 | 29 of 29 |
| Build 226’s checks of its blocks, in Node | 78 of 78 | 78 of 78 |
| Build 225’s 24 checks, as Build 226 runs them | 24 of 24 | 24 of 24 |
| Lookup checks, as Build 226 runs them | 54 of 54 | 54 of 54 |
| Build 224’s checks, as Build 225 runs them | 51 of 51 | 51 of 51 |
| Build 224’s own checks | 48 of 51 | 48 of 51 |
| Lookup checks, as Build 223’s handoff wrote them | 46 of 54 | 46 of 54 |
| Event types, tags and CIM data models (Build 222’s handoff) | 63 of 64 ‡ | 63 of 64 ‡ |
| The Config view handoff’s checks, as Build 222’s handoff rewrote them | 69 of 70 ‡ | 69 of 70 ‡ |
| The source type map’s checks | 82 of 82 | 82 of 82 |
| The splits’ checks | 40 of 40 | 40 of 40 |
| Ingest Processor pipelines’ checks | 31 of 31 | 31 of 31 |
| Event types, tags and CIM, from the view’s menu | 63 of 64 | 63 of 64 |
| The Config view’s checks, from the view’s menu | 69 of 70 | 69 of 70 |
| The space tool | Meets every target | The same figures |
| The connector tool, as Build 237 changes it | Every connector OK | Every connector OK |
| The offline check, as Build 237 changes it | 23 of 23 | 23 of 23 |

‡ `acc7.js` and `acc6-v222.js` set a 2.5 s limit for opening the page, which the page’s own load can pass: to the load event it takes a median of 2.0 s on Build 236 and 2.1 s with the edits, and up to 2.4 s and 2.6 s (section 5). In this run `acc7.js` on Build 236 and `acc6-v222.js` on the new page stopped there, and `acc6-v222.js` again when run alone. These rows are from copies, `acc7-v237.js` and `acc6-v222-v237.js`, that differ only in a 15 s limit for opening the page, as Build 230’s copies that open from the menu have, run alone on both pages after the final run.

The connector tool counted the new transparent circle under each review badge as part of the badge. As it was, it finds 23 badges over labels on the new page and none on Build 236, though the drawn badges touch no label on either page and, in the default layout, each label stays on top where the circle reaches it. It now measures the drawn circle (committed with this build), and its row is from it, run on both pages after the final run.

**The Config view's results that Splunk checked** are the same on both pages: the Fortinet samples' event types and tags, 54 of 54; the made-up app's event types, 49 the same with 2 left open; the samples' fields, 2,682 of 2,682; the made-up calculated fields, 24 of 26; and 62 settings' tiers against the packaging toolkit, 50 within its placement.

Every suite gives the same result on both pages.

The alert and dashboard pack the new page writes for the lab’s topology is still the one Build 236’s lab installed and ran (`same36.js`, exit 0: all the same).

### 3. Every page, swept before and after

The review’s sweep of every page (`audit31.js`), on the 58 pages, as the review ran it:

| At each width | 1440 px: Build 236 | 1440 px: new | 1024 px: Build 236 | 1024 px: new | 390 px: Build 236 | 390 px: new |
|---|---|---|---|---|---|---|
| Page errors | 0 | 0 | 0 | 0 | 0 | 0 |
| Pages that scroll sideways | 0 | 0 | 0 | 0 | 0 | 0 |
| Controls without a name | 0 | 0 | 0 | 0 | 0 | 0 |
| Text under WCAG contrast | 37 | 36 | 35 | 34 | 33 | 32 |
| Text under 11 px (the check reads SVG text by its CSS size) | 139 | 25 | 139 | 25 | 167 | 25 |
| Tap targets under 24 px | 0 | 0 | 0 | 0 | 108 | 67 |
| Text over other text | 7 | 84 | 8 | 92 | 12 | 68 |
| Text cut off in its box | 0 | 0 | 0 | 0 | 0 | 57 |

The sweep reads each element's box, not what a scrolling box or a clip lets show, and what it finds more of is text that isn't on screen:

- **Text over other text, at 1440 and 1024 px.** Operate's list scrolls in its own column (item 4), and the sweep counts the entries scrolled out of it as over the page's header and path chips: all 77 more at 1440 px, and 83 of the 84 more at 1024 px. The other is on Event walkthrough at 1024 px: its second code block, which scrolls in its own box (390 px tall, 616 px of content), is counted over the footer as well as over the page's disclaimer; on Build 236 it is counted over the disclaimer only.
- **Text cut off and over other text, at 390 px.** The phone search button's name (item 18) is hidden from sight as names for screen readers are, in a 1 px box with a clip, and the sweep counts it as cut off and as over the row of views: the 57 cut off and the 56 more over other text.
- **Text under 11 px.** What is left, 25 at each width, is SVG text in five OV diagrams, which the sweep reads at its CSS size, not as drawn: SV-1's and SV-2's column heads (10 each), SvcV-4's card titles (3), SvcV-1's provider line and OV-6c's note. The small-text check below reads text as drawn.
- **Text under WCAG contrast:** one fewer at each width, the Failure Lab's handoff label (item 14).
- **Tap targets under 24 px, at 390 px:** 67, from 108 (item 13). Those left were not in the review's list; most are SvcV-4's 36 function rows, 23 px tall.

The other sweeps, on both pages:

- **The new UI's 18 states** (`toolsweep37.js`: OV's eight viewpoints and three of its views, Operate's list at the top and scrolled, the header and its search, Config's tiers, Inject and a File handoff link), with the review's page check at four widths. States with findings: 16 → 11 at 1440 px, 17 → 12 at 1280 px, 16 → 11 at 1024 px and 15 → 18 at 390 px. The File handoff state opens its link by clicking each link in turn without closing what the last click opened: it reaches the link at 1440 and 1024 px on both pages and at 1280 px on Build 236, but not at 390 px on either page, nor at 1280 px on the new page, in the run and again run alone. Opened directly at 1280 px, the link is selected by a click on its label, which covers most of its 111 px, on both pages. In Config's tiers, text under WCAG contrast goes from 80 to 0 (items 7 and 12); in Inject, fields without a name from 5 to 0 and text under 11 px from 22 to 0 (items 6 and 8). What is new is the same text out of sight: at 390 px, the search button's hidden name in every state but the Builder's, which has its own header; in Config's tiers, the tier marks' meanings for screen readers (item 7), hidden the same way, counted as cut off (116 at each width) and, at 1440 px, 17 of them as over the mark beside them; at 1440 px, Operate's list scrolled to its open entry (5 entries out of sight).
- **Every control used once** (`click31.js`, 58 pages): 2,135 controls, from 1,911, the eight viewpoint buttons on each of OV's 28 pages. The same 102 controls fail on both pages, as the tool clicks them (OV-1's thread markers, for one, are SVG groups, which have no `click()`); one of them is at a new path in the page, as Operate's list is regrouped. Controls that change nothing when used: 104 on both pages, page by page the same but on SvcV-4, where one function row differs (S13.1 on the new page, S7.1 on Build 236). Which of SvcV-4's rows count there varies from run to run: the first final run had S13.2 and S6.1, and one fewer on SvcV-1. The sweep visits Operate's pages in the list's order, which Build 237 regroups, and a page's count depends on the page before it: four pairs of neighbours trade 17 controls between them (Recovery simulation 36 → 19 and Data-quality simulation 23 → 40, Scenario library 49 → 32 and Parsing laboratory 38 → 55, Event walkthrough 51 → 34 and Telemetry chain-of-custody 24 → 41, Multi-region & DR 41 → 24 and Login walkthrough 27 → 44).
- **Small text as drawn** (`tiny31.js`, under 10.95 px): HTML text 25 elements → 0; SVG text 261 → 145, the diagrams' own where they have no room to grow (item 10); canvas 6 → 6.
- **Content cut off** (`cut31.js`): 12 at 390 px and none at 1440 px, on both pages: the Builder's canvas, as on Build 236.
- **Memory over ten rounds of every view** (`leak31.js`): no growth. The nodes hold at 38,899 to 38,903 and the listeners at 2,002 in every round but round 8, which reads 39,170 and 2,031, one round's garbage not yet collected, as Build 236's round 5 reads 39,133 against its 38,436. The heap grows alike on both pages over the ten rounds, 15.5 → 18.9 MB and 15.4 → 18.8 MB.

### 4. Regression against Build 236

The same snapshots as Build 236’s regression, of Build 236 and the new page (`reg37.js`), with what Build 237 means to change set aside on both pages: out of the page while text is read, the OV header’s title block, the OV tab strip, its viewpoint row and phone list, the title bars hidden on screen, Operate’s list and its phone list, the phone search button, Config’s tier key and the signs and spoken meanings in its tier marks; Operate’s pages visited and named by their key, as Build 237 regroups them, and OV’s views by a click in the page; and, in markup compared, Build 237’s classes, the Inject fields’ ids and labels’ for, and the sizes the diagram fit sets.

Compared: 620: 12 paths, 65 failures, 13 symptoms, 60 inspector tabs, 16 links. Same: 617; differ: 1; vary on Build 236 between its own two runs: 2. 617 are the same before any normalising. Page errors: none | new: none.

- DIFF: builder syslogPool file: at 7624: base "ngeHistory\":{\"scope\":\"current browser session\",\"exportedAt\":\"<time>\",\"applied\":[],\"undone\":[]},\"canvas\":{\"layout\":\"auto\",\"positions\":{},\"snap\":{\"enabled\":false,\"gridSize\":20}},\"layoutProfiles\":{\"schem" / new "ngeHistory\":{\"scope\":\"current browser session\",\"exportedAt\":\"<time>\",\"applied\":[{\"label\":\"Update topology c
- VARIES: builder hec file (on the base between runs; new matches one of them): at 4230: base "ngeHistory\":{\"scope\":\"current browser session\",\"exportedAt\":\"<time>\",\"applied\":[],\"undone\":[]},\"canvas\":{\"layout\":\"auto\",\"positions\":{},\"snap\":{\"enabled\":false,\"gridSize\":20}},\"layoutProfiles\":{\"schem" / new "ngeHistory\":{\"scope\":\"current browser session\",\"exportedAt\":\"<time>\
- VARIES: builder deployment file (on the base between runs; new matches one of them): at 6461: base "ngeHistory\":{\"scope\":\"current browser session\",\"exportedAt\":\"<time>\",\"applied\":[{\"label\":\"Update topology configuration\",\"at\":\"<time>\"}],\"undone\":[]},\"canvas\":{\"layout\":\"auto\",\"positions\":{},\"snap\":{\"" / new "ngeHistory\":{\"scope\":\"current browser session\",\"exportedAt\":

Each is the race Build 236’s handoff describes under “Noticed, not changed”: while a topology is unsaved, the Builder saves a recovery draft 550 ms after a change, which stamps the layout profile with the time, and a click whose history timer runs after that draft records the new time as “Update topology configuration”. Build 236 itself recorded it in one of its two runs for 2 of the topology files, and the new page in one more; Build 237 doesn’t change the Builder’s history.

### 5. Time

Each figure is the median of 21 visits to each page, turn about; the spread is in brackets.

| Timed in the page | Build 236 | With the edits |
|---|---|---|
| Loading the page (to the load event) | 2,034.4 ms (1,729.3 to 2,447.7) | 2,088.3 ms (1,856.4 to 2,614.6) |
| The ten views, each to its next frame (all ten) | 2,844.3 ms (2,584.7 to 3,497.9) | 3,047.1 ms (2,542.8 to 3,611.3) |
| The 28 OV pages, each to its next frame (all) | 3,242.5 ms (2,870.8 to 3,896.3) | 3,429.8 ms (3,005.8 to 4,145.1) |
| Builder redraw, its own topology | 48.3 ms (44.0 to 64.1) | 52.7 ms (44.5 to 69.9) |
| Drawing the change register | 36.6 ms (30.7 to 57.1) | 36.2 ms (30.3 to 44.9) |
| Restyling and laying out the page, on Changes | 33.1 ms (27.3 to 43.8) | 31.8 ms (26.9 to 43.2) |

Each figure with the edits is within Build 236’s spread, and Build 236’s within theirs.

The Builder’s redraw tool (`tools/builder-perf-check.js`), five times on each page in turn: medians, and each one’s spread.

| Topology | Build 236 | With the edits | Budget |
|---|---|---|---|
| default | 37 ms (32 to 47); 35 ms moved (33 to 50) | 37 ms (30 to 40); 35 ms moved (33 to 44) | 40 ms |
| fan5 | 43 ms (42 to 66); 45 ms moved (41 to 51) | 50 ms (41 to 51); 53 ms moved (45 to 53) | 50 ms |
| fan8 | 82 ms (81 to 99); 85 ms moved (79 to 100) | 81 ms (72 to 98); 81 ms moved (77 to 111) | 80 ms |
| reference | 97 ms (77 to 104); 111 ms moved (100 to 145) | 102 ms (77 to 111); 106 ms moved (104 to 145) | 120 ms |

Over budget, as medians: on Build 236, fan8 (82 ms; 85 ms after a card moves); with the edits, fan5 (53 ms after a card moves); with the edits, fan8 (81 ms; 81 ms after a card moves). Each median with the edits is within Build 236’s spread, and Build 236’s within theirs, but for fan5 after a card moves. Build 237 changes the Builder only by a transparent circle under each link review marker (item 13).

### 6. The build

`index.html` as committed, Build 237, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text, change register and Changes view name the build, as do the OV header's label and OV-1's title block; nothing on the Builder page names Build 236; no page errors: 11 of 11 pass.
- The new checks pass on Build 237 as on the tested page: 33 of 33.

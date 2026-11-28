# Explorer handoff: states and focus

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 238.
**Applied:** as Build 239, in `index.html` on the branch `claude/build-page-layout-bl6jk1`. It is **not merged to `main`**, which stays at Build 238 until a merge is asked for. Nothing else is left to apply: the rest of this handoff records what was done and checked.
**One new block, and its styles:**
- `<script id="ui-states-v239">` (85 lines), after `ui-colour-v238`, containing [`docs/mockups/ui-states-prototype.js`](mockups/ui-states-prototype.js). It sets no globals. It wraps `renderOperations`, `showBuilderIssuePopover`, `hideBuilderIssuePopover`, `closeBuilderChangeImpact` and `closeBuilderPresentation`, as earlier blocks wrap the app's functions, and watches three things: the Builder's two overlays (their `open` class), `aria-invalid` on Operate's fields, and OV's workspace as it draws.
- `<style id="ui-states-v239-styles">` (85 lines), after `ui-colour-v238-styles`, containing [`docs/mockups/ui-states-prototype.css`](mockups/ui-states-prototype.css).

**19 in-place edits, 28 replacements,** under "The edits". Each old string occurs exactly as many times as the edit says in Build 238 (once, but for three), and none changes the number of lines.

The edits, the block and the styles are also in [`docs/mockups/ui-states.diff`](mockups/ui-states.diff), a unified diff against Build 238's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

**The request:** "Do all", after two reviews of Build 238: a visual audit of its colours, borders and shading (13 findings, F1 to F13: can people tell what is clickable, what is selected, what belongs together and what needs attention), and a review of every UI element (11 items, U1 to U11: what each one does with a mouse, a keyboard and a screen reader). The two overlap in two places (F8 is U2, the pointer on things that do nothing; F10 covers part of U3, focus looks), so 22 changes. Building them found a twenty-third, an older bug: a click anywhere in ten OV views showed OV-1.

**Sources:**
- WCAG 2.2: [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html).
- WAI-ARIA Authoring Practices: [the modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- MDN: [`inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert), [`color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme), [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible), [`aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current), [`aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed).

The storyboard is [`docs/mockups/ui-states-mockup.html`](mockups/ui-states-mockup.html): twelve scenes on the new page with the findings and items marked, and Build 238's for comparison.

## The changes

### Found on the way: ten OV views jumped to OV-1

OV-5a, OV-6c, CV-6, CV-7, SvcV-5, SV-3, SV-5b, SV-10a, SV-10c and StdV-1 each listen for clicks with `e.target.closest('[data-view]')`, to follow their own links to other views. The page's `<body>` carries `data-view="ov"` (`builderSpaceAttach140` sets it as views switch, line 6,541), so a click anywhere else in those views found the body, and `builderOvShow135('ov')` or `navigate195('ov')` showed OV-1. Each handler now acts only on an element inside its own view (`ov-click-views`, 7 handlers; `ov-click-nav`, 3). On Build 238 a click in the text of those ten views showed OV-1; on Build 239, in none of the 28.

### Focus

- **F1. OV's view tabs show keyboard focus.** OV's rule for its tabs' focus set the border to `#8bd9e8` and the outline to transparent, and the dark theme's rule for the tabs, later and as specific, put the border back: focus showed nothing. A 2 px ring, 2 px out, now marks it: `#8bd9e8` (9.74:1) on OV's header, which is dark in both themes, and `#176d86` (4.86:1) on the light theme's tab bar. Every control in OV's header and tab bar is checked, in both themes.
- **F10. One focus style.** `:focus-visible` draws a 2 px cyan ring (`#57c7e8`, 9.3 to 9.8:1 on the app's grounds), 2 px out, where the browser drew its own ring: the view switcher, path chips, component cards, symptoms, scenarios, Operate's list and every other control without a ring of its own. Controls with their own ring keep it; fields keep their border. In OV the ring takes the theme's colour, on every control, OV's header buttons included, where focus had looked like hover. Table rows and cells draw it inside, where a table would cut it.
- **U3. 36 controls with no focus look have one:** SvcV-3a's and SvcV-3b's column heads (their `all:unset` removed the outline, line 9,451), CV-2's selected entry and row, and OV-3's count. CV-2's selected entry draws its selection as a ring: it keeps that inside and takes the focus ring outside, and a focused row is tinted as well.

### States

- **F3. Operate's list, Diagnose's symptoms and the Failure Lab's scenarios** mark the chosen entry with a cyan border and a 3 px bar (9.34:1), where a fill 1.18:1 on the ground did it, and say so: `aria-current="page"` on the open Operate page (the block, after each `renderOperations`), `aria-pressed` on symptoms and scenarios (`symptom-pressed`, `scenario-pressed`). Hover changes only the border, to `#5b7489` (3.7:1), not to a fill 1.07:1 from the chosen one's. A scenario in a combination keeps its violet.
- **F4. The view switcher** underlines the open view in cyan (`inset 0 -2px`, 9:1 on the bar) and marks it `aria-current="page"` (`seg-current`); hover lifts the others to `#10202d` with white text, where it did nothing.
- **F5. The header's figures** (125 stages, 13 components, 65 failures) are plain text, no longer drawn like the Glossary button beside them; the button has a `#5b7489` border (3.92:1) and a ? sign, and in the Builder and OV the view tabs stop 20 px shorter to leave it room.
- **F6. The chosen Authentication card** is cyan all round (9.5:1), keeps its kind's colour on the left, takes a lifted fill and `aria-pressed` (`auth-pressed`). The app set the class `active`, but the styles knew only `selected`: a click changed nothing you could see.

### Fields

- **F2. A refused number says why.** A number on Operate's pages below its minimum is refused, as before, and the field turns red (`aria-invalid`), as before; now a line under the field says "Enter 1 to 256. Until then, 12 stays in use.", with a ! sign, and the field is described by it (`aria-describedby`). The page redraws the field when a value is accepted, and the message goes with it.
- **F7. Fields have a 3:1 border.** Text fields, number fields and lists outside OV: `#5b7489`, 3.71 to 3.92:1 on the grounds around them, where they were 1.4 to 1.72:1. Focus turns the border cyan; a refused value keeps its red; disabled fields keep theirs.
- **F9. The page declares a dark colour scheme** (`:root{color-scheme:dark}`), so number arrows, checkboxes, select menus and scrollbars are drawn for it; OV's light theme declares light.
- **F13. Operate's field boxes go:** Capacity model's 7 and Multi-DS management's 17 (its server capacity's included). The label and the field's own border group a field; sections keep their outline.

### Pointer and keyboard

- **F8 and U2. The pointer only on what acts.** Two rules for the whole app gave it to every chip (line 63, written for Flow's path chips) and every table row (line 74, written for the Matrix's): 370 things took a pointer that the keyboard couldn't reach, and all but 135 of them, 235, did nothing on a click (the reviews said 212: see the corrections). The edits keep the pointer for the path chips (buttons) and the Matrix's rows (`chip-pointer`, `row-pointer`); DIV-1's relationship rows keep it, with a tint on hover; OV-6c's and SV-10c's notes lose it. Tables whose rows act set their own, as before.
- **U1. Rows that act take keyboard focus.** The Matrix's 125 rows (`matrix-rows`; the app already answered Enter and Space on a row, line 954) and DIV-1's 10 relationship rows (`div1-rows`, and Enter and Space select as a click does, `div1-keys`). Stage detail gives focus back to the row when it closes.
- **U8. SV-1's and SV-2's targets on a phone.** Each interface tag gets a transparent hit area of 22 units or more (36 to 44 × 27 px at 390 px, where it was 36 to 44 × 19), added last in the tag so code that looks for its first rect still finds its frame. A tag does what its link does (both call `pick` with the same key), so a short link has a full-size equivalent; the links' own hit lines widen from 12 to 22 units (26.7 px thick at 390 px).

### Dialogs and names

- **U4. The Builder's two modal dialogs keep focus.** While the overlay that the Insert dialog and the pre-export review share, or the presentation, is open, everything beside it is `inert`, so Tab stays in the dialog (and the browser's own controls); Escape closes the Insert dialog, as it closes the presentation.
- **U5. Focus comes back** to the control that opened them: the review marker that opened its popup (when the popup closes with focus inside it), the Insert button, and for the presentation, which opens from the File menu's "Print / present", the File menu's button: the app gives focus to the hidden button the menu item stands for, which can't take it.
- **U6. The Builder's links are named by their ends:** "data relationship from Syslog Source 1 to Syslog Server 1", from the link's own title, where it was "data relationship 2" (`link-names`). A review marker names its link and says "finding" for one: "2 review findings for the data relationship from Syslog Source 1 to Syslog Server 1" (`marker-names`).
- **U7. AV-1's sheet is named by its title.** OV redraws AV pages' title blocks, and the title lost its id on the way: the sheet's `aria-labelledby="aTitle"` pointed at nothing. The redrawn title keeps an id of its own (`aTitle-av195` in OV, `aTitle-av1` and `-av2` in the pack's pages) and the sheet points at it (`av-title-195`, `av-title-189`).

### Colour meanings

- **F11.** The chosen path chip is the selection's cyan, not the green of "runs". "Show affected stages", "Show combined stages" and "Edit topology" are secondary buttons, not the failure red. Diagnose's strongest match is the accent (cyan), a possible match neutral (`#a9b8c7`), a secondary check muted; red stays for failures (`diagnose-accent`).
- **F12. The Builder's canvas cards** mix more of their tier into the border (45% `#213345`, where it was 58%): 3:1 or more against the canvas, where it was 2.72 to 2.87:1 (`card-border`).

### Smaller fixes

- **U9. "Show affected stages" lands on them.** It scrolled to a fixed 340 px, above the highlighted stages. It now scrolls to the first highlighted stage, below the sticky toolbar (`scroll-margin-top`), in the next frame, once the switch to Flow has laid the page out (`affected-scroll`).
- **U10. Diagnose's rank badges** centre their match line, with 4 px and 6 px of padding.
- **U11. The alert pack's files** say the page's own build, where they said Build 236 (`pack-stamp`).

### Corrections to the two reviews

- **The UI element list's item 1** said 14 group rows "fold their group" on ten OV views, 7 legend chips "filter or highlight" and two notes act, 158 things in all. They don't: a click on them changes nothing. The list's check compared screenshots before and after a click, and counted as acting what the ten views' jump to OV-1 changed, and what a scroll moved. A second check compares the page's markup and scroll positions instead: of the 370 things with a pointer the keyboard couldn't reach, only the Matrix's 125 rows and DIV-1's 10 rows act. Item 1 is those 135, and item 2's count, 212, is 235: they lose the pointer.
- **The visual audit's F8** said the ones that act are "group rows, DIV-1's rows": DIV-1's rows only.
- **While building I said a click in seven OV views showed OV-1.** Seven handlers, plus three that navigate: ten views.

### Not covered

- The UI review's other counts, not among its 11 items: 3 focus stops that can't be seen and 74 places where text is cut without a title to read it whole. They are as they were.
- OV's own fields keep OV's palette (F7 is the rest of the app's).
- OV's matrix tables keep their row tint on hover, a reading aid; their rows don't take a pointer.

## The edits

Each on Build 238's line, in the order of the page.

1. **Line 63, in the path chips’ styles.** F8, `chip-pointer`. Every chip took the pointer from this rule, OV’s status chips among them. Its cursor is the default; the styles give the pointer back to chips that are buttons, the path chips.
```
old: .chip{border:1px solid var(--line);background:#0b1721;border-radius:99px;padding:7px 12px;cursor:pointer;color:#a9b8c7;white-space:nowrap}
new: .chip{border:1px solid var(--line);background:#0b1721;border-radius:99px;padding:7px 12px;cursor:default;color:#a9b8c7;white-space:nowrap}
```
2. **Line 74, in the Matrix’s styles.** F8, `row-pointer`. Every table row took the pointer and a hover tint from this rule. Only the Matrix’s rows do now.
```
old: tbody tr{cursor:pointer}tbody tr:hover{background:#102231}
new: #matrixBody tr{cursor:pointer}#matrixBody tr:hover{background:#102231}
```
3. **Line 85, in the Builder’s canvas card styles.** F12, `card-border`. The border mixed 58% of `#213345` into the tier colour, 2.72 to 2.87:1 against the canvas; 45% gives 3:1 or more.
```
old: border:1px solid color-mix(in srgb,var(--node),#213345 58%)
new: border:1px solid color-mix(in srgb,var(--node),#213345 45%)
```
4. **Line 953, in the Matrix’s rows.** U1, `matrix-rows`. Each row takes keyboard focus. The next line already opens the stage on Enter and Space.
```
old: <tr data-id="${s.id}">
new: <tr data-id="${s.id}" tabindex="0">
```
5. **Line 1,458, in Diagnose’s symptom buttons.** F3, `symptom-pressed`. The chosen symptom is `aria-pressed="true"`, the others false.
```
old: <button class="symptomBtn ${x.id===symptom.id?'active':''}" data-symptom="${x.id}">
new: <button class="symptomBtn ${x.id===symptom.id?'active':''}" aria-pressed="${x.id===symptom.id}" data-symptom="${x.id}">
```
6. **Line 1,459, in Diagnose’s ranking.** F11, `diagnose-accent`. A strong match was red, a possible one amber, a secondary check cyan. They are the accent, neutral and muted; red stays for failures.
```
old: accent=adjusted>=88?'var(--red)':adjusted>=70?'var(--amber)':'var(--cyan)'
new: accent=adjusted>=88?'var(--cyan)':adjusted>=70?'#a9b8c7':'var(--muted)'
```
7. **Line 1,467, in the Failure Lab’s scenario buttons.** F3, `scenario-pressed`. The chosen scenario, or each one in a combination, is `aria-pressed="true"`.
```
old: ${state.failureCorrelation&&selected.has(x.id)?'correlationSelected':''}" data-failure="${x.id}">
new: ${state.failureCorrelation&&selected.has(x.id)?'correlationSelected':''}" aria-pressed="${state.failureCorrelation?selected.has(x.id):x.id===activeId}" data-failure="${x.id}">
```
8. **Line 1,859, in Authentication boundaries’ cards.** F6, `auth-pressed`. The chosen card is `aria-pressed="true"`; its look is in the styles.
```
old: <button class="authCard ${x.id===selected.id?'active':''}" data-auth-id="${x.id}">
new: <button class="authCard ${x.id===selected.id?'active':''}" aria-pressed="${x.id===selected.id}" data-auth-id="${x.id}">
```
9. **Line 1,895, in `switchView`, coming from the Failure Lab.** U9, `affected-scroll`. It scrolled to a fixed 340 px. It scrolls to the first highlighted stage in the next frame, once the switch has laid Flow out; the styles keep it below the sticky toolbar.
```
old: window.scrollTo({top:340,behavior:'smooth'})}}
new: requestAnimationFrame(()=>(document.querySelector('#pipeline .stage.impacted')||document.getElementById('pipeline'))?.scrollIntoView({behavior:'smooth',block:'start'}))}}
```
10. **Line 1,895, in `switchView`.** F4, `seg-current`. The open view’s button is `aria-current="page"` as the switcher switches; the block sets it when the page opens.
```
old: $$('.seg button').forEach(x=>x.classList.toggle('active',x.dataset.view===view))
new: $$('.seg button').forEach(x=>{x.classList.toggle('active',x.dataset.view===view);if(x.dataset.view===view)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')})
```
11. **Line 3,149, in the Builder’s link hit paths.** U6, `link-names`. Each link was named by its plane and number. It is named by its ends, from its title, and keeps the number where it has no title.
```
old: path.setAttribute('aria-label',`${path.dataset.edgePlane} relationship ${path.dataset.edgeId}`)
new: path.setAttribute('aria-label',`${path.dataset.edgePlane} relationship ${(t=>t?'from '+t.split(' · ')[0].replace(' → ',' to '):path.dataset.edgeId)(path.querySelector('title')?.textContent)}`)
```
12. **Line 3,149, in the Builder’s review markers.** U6, `marker-names`. Every marker was “N review findings for relationship”. It names its link, and says “finding” for one.
```
old: group.setAttribute('aria-label',`${list.length} review findings for relationship`)
new: group.setAttribute('aria-label',`${list.length} review finding${list.length===1?'':'s'} for the ${plane} relationship${(t=>t?' from '+t.split(' · ')[0].replace(' → ',' to '):'')(path.querySelector('title')?.textContent)}`)
```
13. **Line 8,920, in DIV-1’s relationship register.** U1, `div1-rows`. Each relationship row takes keyboard focus, as its concept rows do.
```
old: '<tr data-div-select="'+r.s+'" data-div-rel="'+r.id+'"
new: '<tr tabindex="0" data-div-select="'+r.s+'" data-div-rel="'+r.id+'"
```
14. **Line 8,935, in DIV-1’s keyboard handler.** U1, `div1-keys`. Enter and Space select a relationship row’s subject, as a click does; they did it for concept rows only.
```
old: e.target.matches('[data-div-concept]')){e.preventDefault();e.stopImmediatePropagation();select169(panel,e.target.dataset.divConcept)}
new: e.target.matches('[data-div-concept],[data-div-select]')){e.preventDefault();e.stopImmediatePropagation();select169(panel,e.target.dataset.divConcept||e.target.dataset.divSelect)}
```
15. **Line 10,599, in OV’s redraw of an AV page’s title block.** U7, `av-title-189`. The title kept no id when it was redrawn. It keeps one of its own, and the sheet is named by it.
```
old: title.querySelectorAll('.tb-v').forEach(e=>{const b=document.createElement('strong');b.innerHTML=e.innerHTML;e.replaceWith(b)})
new: title.querySelectorAll('.tb-v').forEach(e=>{const b=document.createElement('strong');b.innerHTML=e.innerHTML;if(e.id){b.id=e.id+'-av'+n;host.querySelector('[aria-labelledby="'+e.id+'"]')?.setAttribute('aria-labelledby',b.id)}e.replaceWith(b)})
```
16. **Lines 10,686, 10,768, 10,833, 10,900, 11,014, 11,084 and 11,149, in seven OV views’ click handlers.** Found on the way, `ov-click-views`. A click found the body’s `data-view="ov"` when nothing nearer had one, and showed OV-1. The handler acts only on an element inside its view. Replaced 7 times.
```
old: if(v)builderOvShow135(v.dataset.view)})
new: if(v&&host.contains(v))builderOvShow135(v.dataset.view)})
```
17. **Lines 11,415, 11,511 and 11,602, in three OV views’ click handlers that navigate to an item.** Found on the way, `ov-click-nav`. The same. Replaced 3 times.
```
old: if(v)navigate195(v.dataset.view,v.dataset.item)})
new: if(v&&host.contains(v))navigate195(v.dataset.view,v.dataset.item)})
```
18. **Line 11,723, in OV’s drawing of AV-1.** U7, `av-title-195`. As `av-title-189`.
```
old: host.querySelectorAll('.tb-v').forEach(e=>{const strong=document.createElement('strong');strong.innerHTML=e.innerHTML;e.replaceWith(strong)})
new: host.querySelectorAll('.tb-v').forEach(e=>{const strong=document.createElement('strong');strong.innerHTML=e.innerHTML;if(e.id){strong.id=e.id+'-av195';host.querySelector('[aria-labelledby="'+e.id+'"]')?.setAttribute('aria-labelledby',strong.id)}e.replaceWith(strong)})
```
19. **Lines 20,928 and 20,946, in the alert pack’s files.** U11, `pack-stamp`. The stamp said Build 236. It reads the page’s build number, as the evidence pack and OV’s title blocks do. Replaced 2 times.
```
old: Splunk Pipeline Explorer, Build 236, on ${day}
new: Splunk Pipeline Explorer, Build ${document.getElementById('topologyBuilder').dataset.buildNumber}, on ${day}
```

## The new block

The block's files, in order, each a part of one function scope:
- `10-common.js`: helpers.
- `20-dialogs.js`: items 4 and 5. The Builder's overlays: the page beside them inert while one is open, Escape for the Insert dialog, focus back on close; the review popup's focus back to its marker.
- `30-ov.js`: item 8. SV-1's and SV-2's tags' hit areas, added as OV draws.
- `40-fields.js`: F2. The message under a refused number, and its removal.
- `50-current.js`: F3 and F4. `aria-current` on the open Operate page and the open view.
- `90-end.js`: the end of the function.

## Build records

A `<script id="ui-states-records-v239">` before `</body>`, as Build 238's: the change register's "Explorer foundations" gets

```
['States and focus','What can be clicked, what is chosen and where focus is, told apart: one cyan focus ring everywhere, OV’s view tabs included; chosen entries, cards and the open view marked in cyan and for screen readers, hover only a border; fields with 3:1 borders and a refused number that says why; the pointer only on what acts, and the Matrix’s and DIV-1’s rows reachable by keyboard; the Builder’s two dialogs keep focus and give it back, its links named by their ends; a click in ten OV views no longer jumps to OV-1; “Show affected stages” lands on them; the alert pack names its build.',true]
```

and the build number, date, title and the Builder's build note read Build 239, 28 Nov 2026.

## Check before uploading

### 1. The checks: 38. All pass on Build 239; 4 pass and 34 fail on Build 238

`acc39.js`, in the scratch work, checks each finding and item as a person meets it, with the keyboard, the pointer and the page's own state, at 1440 px and, for the items that reach a phone, at 390 px:

- OV: a click on a row in CV-7, CV-6, SvcV-5 or StdV-1 leaves that view open (it showed OV-1)
- OV: a click in the text of each of the 28 views leaves it open (ten showed OV-1)
- F1 Every control in OV’s header and tab bar shows a ring 3:1 or more against its ground, in both themes
- F1 OV’s open view tab shows a 2 px ring with keyboard focus, 3:1 or more against the tab bar, in both themes
- F10 OV’s header buttons: focus draws a ring (3:1 or more), hover does not
- F2 A refused number says why under the field, is read with it, has a sign, and keeps its red border
- F2 An accepted value clears the message
- F3 Operate’s list: the open page is aria-current, with a cyan border and bar (3:1 or more); hover changes only the border
- F3 Diagnose’s symptoms: the chosen one alone is pressed, cyan; hover is a border
- F3 The Failure Lab’s scenarios: the chosen one alone is pressed, cyan
- F4 The view switcher: the open view is aria-current and underlined in cyan (3:1 or more); hover changes the others
- F5 The header’s figures have no box; the Glossary button has a 3:1 border and a sign
- F5 In the Builder and OV the Glossary button, now wider, clears the view tabs
- F6 A clicked Authentication card alone is pressed and drawn cyan all round (3:1 or more)
- F7 Text fields and lists have a 3:1 border (#5b7489): search, path filter, Capacity model, Multi-DS, Changes, the glossary’s Find
- F7 A focused field still turns cyan
- F8 Nothing takes a pointer that the keyboard can’t reach, on 4 views, 3 Operate pages and 18 OV views (370 did)
- F8 The path chips and the Matrix’s rows keep the pointer; CV-7’s chips and rows don’t
- F9 The page declares a dark colour scheme; OV’s light theme a light one
- F10 The view switcher, path chips, stage and component cards, symptoms, scenarios and Operate’s list share one ring: 2 px cyan, 2 px out
- F11 The chosen path chip is cyan, “Show affected stages” is a secondary button, and no cause is drawn in the failure red
- F12 Every Builder canvas card’s border is 3:1 or more against the canvas
- F13 Capacity model’s and Multi-DS management’s field boxes are gone (no border, no fill)
- 1 Each Matrix row takes keyboard focus; Enter opens its stage, Escape gives focus back
- 1 DIV-1’s relationship rows take keyboard focus, and Enter selects as a click does
- 3 SvcV-3a’s and SvcV-3b’s column heads, CV-2’s selected entry and OV-3’s count show a ring with keyboard focus (3:1 or more)
- 4 The Insert dialog keeps Tab inside it, and Escape closes it
- 5 Closing the Insert dialog gives focus back to the Insert button, and the page is live again
- 5 Cancel gives focus back to the Insert button too
- 5 A review marker’s popup gives focus back to its marker on Escape
- 4 The presentation keeps Tab inside it; Escape closes it, focus goes back to its control (or its menu) and the page is live
- 6 Each Builder link is named by its ends, and each review marker by its link
- 7 AV-1’s sheet is named by its own title
- 8 On a phone SV-1’s and SV-2’s tags are 24 px or more each way, and each link is 24 px thick with a full-size tag that does the same
- 9 “Show affected stages” lands with the first highlighted stage just below the sticky toolbar, at 1440 and 390 px
- 10 Diagnose’s rank badges centre their match line, with 4 px or more of padding
- 11 The alert pack’s files are stamped with the page’s own build
- No page errors

On Build 238 the four that pass check what already held there: an accepted value leaves no message (there was none), the Glossary button clears the view tabs, a focused field turns cyan, and no page errors.

### 2. The reviews' own probes, again

The UI element review's probes, run again on Build 239 as on Build 238:

| What | Build 238 | Build 239 |
|---|---|---|
| Things with a pointer the keyboard can’t reach, on 58 page states at 1440 px (`ui39.js`) | 370 | 0 |
| Controls whose look doesn’t change with keyboard focus | 36 | 0 |
| OV sheets named by an id that is elsewhere or nowhere | 1 | 0 |
| Targets under 24 px with no room around them, at 390 px (`tiny39.js`) | 8 | 3, the links below |
| Dialogs, popups and menus that open from the keyboard and give focus back on Escape (`dlg39.js`) | 3 of 6 | 6 of 6 |
| Focus stops that can’t be seen; text cut with no title (not among the items) | 3; 74 | 3; 74 |
| Page errors | 0 | 0 |

The three targets `tiny39.js` still lists are SV-1’s and SV-2’s links SI-1 and SI-2, measured by the box of what they draw (a line and an arrowhead, 11 to 12 px tall). What a pointer hits is their hit line, 22 units wide, 26.7 px at 390 px, and each has its tag, 41 × 27 px, which does the same thing: WCAG’s equivalent-target exception.
`dlg39.js` reports the Insert dialog as “not closed by Escape”: it looks for the dialog’s element, which stays in the page, hidden, when the overlay closes. The acceptance checks read the overlay’s state: Escape closes it, and focus goes back to the Insert button.

### 3. Regression against Build 238

`reg39.js` opens each page state on Build 238 and on the new page, both in OV's light theme: the 7 views, the 23 Operate pages and the 28 OV views, 58 states. It compares the text a person sees and the visible controls, after taking off what Build 239 adds on purpose (the rows' tab stops, item 1). Build 239 changes no visible text.

| Window | States | The same | Different |
|---|---|---|---|
| 1440 × 900 | 58 | 56 | 2 |
| 390 × 844 | 58 | 56 | 2 |

The two at each width are Evidence pack and Architecture report, which print the time they were made. Page errors: none on either page.

### 4. The repository's checks

Each run on Build 238 and on the new page, one at a time:

| Tool | Build 238 | With the edits |
|---|---|---|
| `tools/offline-check.js`: every view and OV tab drawn, and every export made, with no network | 22 passed, 0 failed | 22 passed, 0 failed |
| `tools/builder-connector-check.js`: the Builder’s links as cards are added and dragged | 66 of 66 link states OK | the same output |
| `tools/builder-space-check.js`: the canvas’s share of the screen at 7 window sizes | 7 of 7 meet their targets | the same output |

### 5. Time

The Builder's redraw tool (`tools/builder-perf-check.js`), five times on each page in turn, alone in the browser: medians, and each one's spread.

| Topology | Build 238 | With the edits | Budget |
|---|---|---|---|
| default | 24 ms (20 to 31); 27 ms moved (22 to 35) | 21 ms (20 to 38); 23 ms moved (22 to 32) | 40 ms |
| fan5 | 34 ms (27 to 38); 39 ms moved (28 to 44) | 28 ms (27 to 39); 29 ms moved (28 to 41) | 50 ms |
| fan8 | 59 ms (47 to 67); 63 ms moved (50 to 69) | 48 ms (47 to 63); 51 ms moved (49 to 69) | 80 ms |
| reference | 54 ms (51 to 69); 64 ms moved (62 to 99) | 52 ms (50 to 71); 62 ms moved (61 to 84) | 120 ms |

Every median is within its budget on both pages.
Each median with the edits is within Build 238’s spread; and each of Build 238’s within the edits’ spread. Build 239 changes the Builder by a border colour, the links’ and markers’ names, set as they are drawn, and the block’s watch on its two overlays.

### 6. The build

`index.html` as committed, Build 239, is the tested page with this handoff's records.
- Its page title, build number and date, ⓘ text, change register and Changes view name the build, as do the OV header's label and OV-1's title block; nothing on the Builder page names Build 238; no page errors: 11 passed, 0 failed.
- The new checks pass on Build 239 as on the tested page: 38 of 38.

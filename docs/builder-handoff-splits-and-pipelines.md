# Builder handoff: source type splits and Ingest Processor pipelines in the source type map (faults 47 to 49)

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Start from:** Build 217.
**46 in-place edits,** under "The edits": 2 in `<style id="config-type-map-v217-styles">`, 5 in `<script id="config-view-v205">` and 39 in `<script id="config-type-map-v217">`. Each old string occurs exactly once in Build 217, and no edit changes the number of lines. They are on 44 lines: lines 15,265 and 15,268 take two each.
**Two new blocks, at the end of the page (before `</body>`):**
- `<style id="ingest-pipelines-v218-styles">`, containing [`docs/mockups/ingest-pipelines-prototype.css`](mockups/ingest-pipelines-prototype.css);
- then `<script id="ingest-pipelines-v218">`, containing [`docs/mockups/ingest-pipelines-prototype.js`](mockups/ingest-pipelines-prototype.js).

The edits and the blocks are also in [`docs/mockups/splits-and-pipelines.diff`](mockups/splits-and-pipelines.diff), a unified diff against Build 217's `index.html`. It has no context lines, so it applies with `git apply --unidiff-zero`.

Make the edits, paste the two files as they are, then add the build records (see "Build records").

**Two requests, one build:**
1. Test Build 217's source type map with the Fortinet FortiGate add-on, and check that it covers one source type being split into several. It doesn't: faults 47 to 49, and their fix.
2. "Include ingest processor but only if pipeline used. Include config upload": the map shows the Ingest Processor where an uploaded pipeline takes the source type.

**Mockup (the target):** [`docs/mockups/splits-and-pipelines-mockup.html`](mockups/splits-and-pipelines-mockup.html). Five scenes have the edits and the blocks applied to Build 217, and the two "Today" scenes are Build 217. The screenshots are `docs/mockups/compare/splits-and-pipelines-*.png`.

**Tested first:** the edits and the blocks were applied to Build 217 and run. The results under "Check before uploading" come from that run.

## The test

The request was to test Build 217's source type map with the Fortinet FortiGate Add-on for Splunk 1.6.10 (`Splunk_TA_fortinet_fortigate`), and to check that it covers one source type being split into several. The add-on's `default/props.conf` and `default/transforms.conf` were loaded in the Config view. The add-on isn't in the repository.

**How the add-on splits a source type:**
- `[fortigate_log]` and `[fgt_log]` each run one transform, `[force_sourcetype_fortigate]`.
- The transform sets the source type: `DEST_KEY = MetaData:Sourcetype`, `FORMAT = sourcetype::fortigate_$1`.
- `$1` is the first group of its `REGEX`, `(traffic|utm|event|anomaly)`. So events become fortigate_traffic, fortigate_utm, fortigate_event or fortigate_anomaly.
- The older names are renamed at search time: `[fgt_traffic]` has `rename = fortigate_traffic`, and so on for the other three.

**What works on Build 217:** the files load with no page errors: "2 files from Splunk_TA_fortinet_fortigate · 230 settings". The map lists the ten source types and draws each one. fortigate_traffic's 48 search-time settings are listed in order, with the transforms and lookups they name.

**What doesn't:** the split. Faults 47 to 49 continue the numbering of the Build 215 recheck.

## The faults

### 47. The split isn't followed

**What you see,** with fortigate_log or fgt_log chosen: the transform leads to one destination, "Sourcetype set to fortigate_$1".
- The four source types aren't named, and can't be opened from there.
- The summary counts "2 destinations": that one and the default index.

**Why:** `outcomes` gives any `DEST_KEY = MetaData:…` one destination, titled with `FORMAT` as it is written.

### 48. The source types a transform names don't say where their events come from

**What you see,** with fortigate_traffic chosen:
- Under Read: "No input, [source::] stanza or rule in these files names fortigate_traffic."
- Its `EVENT_BREAKER_ENABLE`, `SHOULD_LINEMERGE` and `TIME_PREFIX` are drawn as settings that act on its events.
- Its destination is "The default index".

**Why:** `gather` looks for what names a source type among inputs, `[source::]` and rule stanzas, and `CLONE_SOURCETYPE` copies. It doesn't look for transforms that set the source type.

**What Splunk does:** an event gets its new source type in the Typing pipeline, after it was read, broken into events and given its time as its first source type.
- The new source type's stanza is not used for reading or parsing it.
- The new source type's own `TRANSFORMS-`, `RULESET-` and `SEDCMD-` lines don't run on it: the event is already going through its first source type's list. That differs from a `CLONE_SOURCETYPE` copy, which does get the new source type's index-time transforms.
- Its search-time settings do apply.

### 49. A search-time rename isn't followed

**What you see:**
- With fgt_traffic chosen, `rename = fortigate_traffic` is a line under Search like any other.
- With fortigate_traffic chosen, nothing mentions fgt_traffic.

**What Splunk does:** searches see fgt_traffic's events as fortigate_traffic, and use fortigate_traffic's search-time settings; the search-time settings in `[fgt_traffic]` itself are ignored.

## The fix

**In the map of the source type that is split** (fortigate_log, fgt_log):
- **A destination for each source type the transform can name:** "Becomes fortigate_traffic", "Becomes fortigate_utm", "Becomes fortigate_event" and "Becomes fortigate_anomaly".
  - Each says which word the transform finds for it: "Events where [force_sourcetype_fortigate] finds traffic."
  - Each has "Follow fortigate_traffic", which chooses that source type, as a copy's does.
  - Each has a line from the transform, in the copy's violet.
  - The summary counts them: "5 destinations".
- **How the names are worked out** (`named`): `FORMAT`, less its `sourcetype::`, with each `$n` replaced by each word the `REGEX`'s nth capturing group lists.
  - A group lists words when it holds nothing but words separated by `|`, as `(traffic|utm|event|anomaly)` does.
  - Groups are counted as Splunk's regular expressions count them: `(?:…)`, lookarounds and inline flags aren't counted, named groups are, and brackets that are escaped or inside a character class are skipped.
- **A name the `REGEX` doesn't list** (`FORMAT = sourcetype::open_$1` with `(\w+)`): one destination, "Source type set from the event", "Events matching [set_open] are named open_$1, from their own text." It names the source types in the files that fit, each a chip: "In these files: open_web".
- **A source type nothing else in the files names** has no "Follow": "Nothing else in these files names it."
- `MetaData:Host` and `MetaData:Source` are as before: "Host set to …".

**In the map of a source type a transform names** (fortigate_traffic and the other three):
- **Under Read, the transform's card,** as a copy's: "Events of fortigate_log and fgt_log become fortigate_traffic here, after they are parsed. Run by default:2 and default:7".
  - fortigate_log and fgt_log are chips that choose those source types.
  - A line runs from the card to the source type.
  - Where the names can't be listed and the source type fits: "can become".
  - The summary counts it: "1 naming transform".
- **When nothing else names the source type,** its events only come that way, so:
  - its card says "Its events get this name from a transform, after they are parsed as fortigate_log or fgt_log, so the parsing settings below don’t apply to them.", and its parsing lines are faded;
  - its settings under Read are faded: "No effect on events that get this name from a transform: they were read and parsed as fortigate_log or fgt_log.";
  - its own `TRANSFORMS-`, `RULESET-` and `SEDCMD-` lines are faded and lead to no destination: "Events that get this name from a transform aren’t run through these: they were transformed as fortigate_log or fgt_log.";
  - its other Typing pipeline settings, such as `ANNOTATE_PUNCT`, are left as they are: the map makes no claim about them;
  - its destination is "The index the events had".
- **When an input, a `[source::]` stanza or a rule names it too,** nothing fades, and its card says "Events that get this name from a transform were parsed as direct: these settings apply to the events that arrive already named direct_b."
- **The source type's card no longer fades as a whole,** for a copy-only source type either: only its parsing lines do. Its name, its sentence and the line into it stay readable.

**Search-time renames:**
- **A `rename` line** says "Searches see these events as fortigate_traffic, with fortigate_traffic’s search-time settings and none of this stanza’s.", with "Follow fortigate_traffic".
- **The source type it names** has, first under Search, a card for each such stanza: "Events indexed as fgt_traffic are searched as fortigate_traffic, with fortigate_traffic’s search-time settings". fgt_traffic is a chip.

**Unchanged:** the example's maps, for all four source types (see "Check before uploading", 1); the view's Matrix.

**Not covered:**
- An `INGEST_EVAL` that sets `sourcetype` still gives "Sourcetype set by an expression". The map doesn't read the expression.
- Events the transform's `REGEX` doesn't match keep their first source type. The map doesn't draw that.

## Ingest Processor pipelines

**What is uploaded:** a pipeline's SPL2, in a file ending in `.spl2` or `.spl`, with the Config view's own Upload files, Upload a folder or drop.
- **A pipeline** is a statement that starts with `from $source`, as the Ingest Processor's pipeline editor writes it: `$pipeline = | from $source | where … | eval … | into $destination;`. A file may hold several. `import` lines, other statements and comments are passed over.
- **The panel leaves these files to the map.** They aren't listed with the .conf files. A file with no pipeline is reported in the panel's message line: "empty.spl2 has no pipeline: no statement in it starts with from $source."
- **The map's head lists them,** under the summary: "Ingest Processor pipelines · fortigate.spl2 · 1 pipeline", each with Remove. The panel's Clear takes them out with the files.
- **They are kept for the visit only,** as the .conf files are.
- **The empty panel says so:** "An Ingest Processor pipeline’s SPL2 file (.spl2) can go with them, for the source type map."
- **Pipelines can be loaded with no .conf file.** The map then shows on its own, with the source types the pipelines name.

**Which pipelines take a source type:**
- **A pipeline's first command, when it is a `where` that tests `sourcetype`, `source` or `host`,** says what the pipeline takes, as a partition does. The card says "Takes events where sourcetype == "fortigate_log" OR sourcetype == "fgt_log"".
- **It takes a source type** that any of its tests of `sourcetype` fits: `==`, `IN (…)`, `LIKE`, `like(sourcetype, …)` and `match(sourcetype, …)`.
- **With no such test,** it takes every source type: "Takes every source type it receives".
- **The source types a pipeline names outright** join the Config view's Source type list: those its first `where` gives with `==` or `IN`, and those an `eval sourcetype = "…"` names.

**What the map shows, only where a pipeline takes the chosen source type:**
- **A sixth column, "Ingest Processor",** fourth, between Transform and Index or send. Its head has one badge, IP, and "Splunk Cloud’s Ingest Processor: the pipelines that take this source type. Its path is separate from the parsing tier’s", after the Matrix's own note on the Ingest Processor's stages.
- **A card for each pipeline:** its name, its file, what it takes, and its commands in order. A long command runs to three lines; the whole is in its title.
- **What each command leads to,** as a destination under Index or send, with a line from the command:

| Command | Under it | Leads to |
|---|---|---|
| `where`, after the first | "Keeps the events this holds for, and drops the others." | "Dropped" |
| `eval index = "netfw"` | | "Index netfw"; with an expression, "Index set by an expression" |
| `eval sourcetype = "x"` | | "Becomes x", with "Follow x"; with an expression, "Source type set by an expression" |
| `eval host = …`, `source = …`, `_time = …` | | "Host set to …" and the like |
| `eval _raw = …` | | "Text rewritten" |
| `eval` of any other field | | "Indexed field" and the field |
| `rex` | "Extracts devname." | "Indexed field" for each named group |
| `fields` | "Removes these fields." or "Keeps only these fields." | |
| `route <test>, [ … ]` | "Matching events leave the pipeline here, by their own route." | What the commands in its brackets lead to: "Events where type == "traffic", in $pipeline." |
| `branch`, `thru` | "Each branch gets a copy." "A copy goes through this." | The same |
| `into $destination` | "The destination is chosen where the pipeline is applied." | "Sent to $destination" |
| Any other | | |

- **The summary counts them:** "1 Ingest Processor pipeline", between the transforms and the destinations.
- **With the Ingest Processor chosen in the component strip,** the column's badge is outlined. The pipelines' cards aren't faded for any component.
- **Six columns fit a 1,440 px window.** Narrower than 1,408 px, the map scrolls sideways inside its box; at 900 px and below the columns stack.

**Where no pipeline takes the source type,** the map is as before: five columns, and no word of the Ingest Processor. The example has no pipeline.

**Not covered:**
- **The partition and the destinations set where a pipeline is applied.** The map reads only the SPL2: a pipeline with no first `where` is taken to receive every source type, and `$destination` is named, not resolved.
- **Order between the files and a pipeline.** The column sits after Transform, but the map doesn't say whether a .conf transform or a pipeline acts first on an event: that depends on where the data goes.
- **Edge Processor.** Its pipelines are SPL2 too, and are read the same way, but the column is the Ingest Processor's.

## The edits

In Build 217's `index.html`. Each old string occurs exactly once; each new string is one line, as its old one is.

**`<style id="config-type-map-v217-styles">`:**

- **Line 15,016.** A destination that is another source type takes the copy's colour.
```
old: .tmResult217[data-result=copy]{--result:var(--violet)}
new: .tmResult217:is([data-result=copy],[data-result=retype]){--result:var(--violet)}
```
- **Line 15,030.** So does its line.
```
old: :is(.tmEdge217,.tmArrow217)[data-edge=copy]{--edge:var(--violet)}
new: :is(.tmEdge217,.tmArrow217):is([data-edge=copy],[data-edge=retype]){--edge:var(--violet)}
```

**`<script id="config-view-v205">`,** for Ingest Processor pipelines:

- **Line 13,655.** In `analyse`: the source types the pipelines name join the Source type list.
```
old: pm.types=[...found].sort();
new: for(const t of window.configPipelines218?.types()||[])found.add(t);pm.types=[...found].sort();
```
- **Line 13,704.** The file dialog offers .spl2 and .spl files too.
```
old: accept:'.conf,.txt,text/plain'
new: accept:'.conf,.txt,.spl2,.spl,text/plain'
```
- **Line 13,751.** The empty panel says pipelines can be uploaded.
```
old: or an app or etc folder, or drop them here. Each line is matched
new: or an app or etc folder, or drop them here. An Ingest Processor pipeline’s SPL2 file (.spl2) can go with them, for the source type map. Each line is matched
```
- **Line 13,770.** Clear takes the pipelines out too.
```
old: on('[data-props-clear]','onclick',()=>{pm.files=[];
new: on('[data-props-clear]','onclick',()=>{window.configPipelines218?.clear();pm.files=[];
```
- **Line 13,830.** In `readFiles`: a .spl2 or .spl file is an Ingest Processor pipeline file, from a folder too. It goes to the pipelines block, not the panel; one with no pipeline is reported.
```
old:  for(const {file,path} of list){const fromFolder=path.includes('/');
new:  for(const {file,path} of list){const fromFolder=path.includes('/');if(/\.spl2?$/i.test(path)&&window.configPipelines218){if(file.size>2_000_000)errors.push(`${path} is over 2 MB`);else if(!window.configPipelines218.add(path,await file.text()))errors.push(`${file.name} has no pipeline: no statement in it starts with from $source`);continue}
```

**`<script id="config-type-map-v217">`:**

- **Line 15,096.** In `gather`: the transforms that give events this source type, each with the source types whose lines run it; and the source types `rename` gives this name at search time.
```
old:   for(const u of role?.usedBy||[])copies.push({st,role,line:u.r,from:u.r.stanza.types?[...u.r.stanza.types].filter(t=>t!==T):null})}
new:   for(const u of role?.usedBy||[])copies.push({st,role,line:u.r,from:u.r.stanza.types?[...u.r.stanza.types].filter(t=>t!==T):null})}const retypes=[];for(const st of X){const role=pm.roles.get(st.name);if(st.keys.get('DEST_KEY')?.value!=='MetaData:Sourcetype'||!role?.usedBy?.length||role.search||role.area!=='stage')continue;const hit=named(st).find(x=>x.open?x.fits.includes(T):x.name===T);if(!hit)continue;const from=new Set();let every=false;for(const u of role.usedBy){if(u.r.stanza.types)u.r.stanza.types.forEach(t=>t!==T&&from.add(t));else every=true}retypes.push({st,role,maybe:!!hit.open,lines:role.usedBy.map(u=>u.r),from:every?null:[...from]})}const aliases=primaries('props').filter(st=>st.kind==='sourcetype'&&st.name!==T&&st.keys.get('rename')?.value===T);
```
- **Line 15,102.** `gather` returns them.
```
old:  return {T,P,hub,inputs,receivers,everyInput,sources,rules,matches,copies,cols,other,X}}
new:  return {T,P,hub,inputs,receivers,everyInput,sources,rules,matches,copies,retypes,aliases,cols,other,X}}
```
- **Line 15,106.** Two functions before `outcomes`: `listed` reads the words each capturing group of a REGEX lists, and `named` gives the source types a transform's FORMAT can name.
```
old: function outcomes(st,role){
new: function listed(re){const out=[],open=[];let n=0;for(let i=0;i<re.length;i++){const c=re[i];if(c==='\\'){i++;continue}if(c==='['){for(i++;i<re.length&&re[i]!==']';i++)if(re[i]==='\\')i++;continue}if(c==='('){const cap=re[i+1]!=='?'||/^\?(<[^=!]|P<|')/.test(re.slice(i+1,i+4));open.push({cap,start:i+1,n:cap?++n:0});continue}if(c===')'){const g=open.pop();if(g?.cap){const body=re.slice(g.start,i).replace(/^\?(?:P?<[^>]*>|'[^']*')/,'');out[g.n-1]=/^[\w.:-]+(\|[\w.:-]+)*$/.test(body)?body.split('|'):null}}}return out}function named(st){const fmt=(st.keys.get('FORMAT')?.value||'').trim().replace(/^sourcetype::/i,''),lists=listed(st.keys.get('REGEX')?.value||'');if(!fmt)return[];let out=[{name:'',found:[]}];for(const part of fmt.split(/(\$\d)/).filter(Boolean)){const alts=/^\$\d$/.test(part)?lists[+part[1]-1]:[part];if(!alts){const fit=new RegExp('^'+fmt.split(/\$\d/).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.+')+'$');return [{name:fmt,open:true,fits:pm.types.filter(t=>fit.test(t))}]}out=out.flatMap(o=>alts.map(a=>({name:o.name+a,found:/^\$/.test(part)?[...o.found,a]:o.found})))}return out}function outcomes(st,role){
```
- **Line 15,115.** In `outcomes`: a transform that sets the source type gives a destination for each source type it can name; where the names can't be listed, one that says so.
```
old:  if(/^MetaData:(Host|Source|Sourcetype)$/.test(dest||''))return [{kind:'meta',
new:  if(dest==='MetaData:Sourcetype')return named(st).map(x=>x.open?{kind:'retype',key:'retype:'+x.name,title:'Source type set from the event',pattern:x.name,fits:x.fits}:{kind:'retype',key:'retype:'+x.name,title:`Becomes ${x.name}`,type:x.name,found:x.found});if(/^MetaData:(Host|Source)$/.test(dest||''))return [{kind:'meta',
```
- **Line 15,146.** `setting` takes a fourth argument: the line is faded whatever its verdict.
```
old: function setting(r,extra='',quiet=false){
new: function setting(r,extra='',quiet=false,faded=false){
```
- **Line 15,148.** A faded line takes the no-effect class.
```
old: return`<li class="tmSet217${v.e==='no'?' tmOff217':v.e==='own'?' tmOwn217':''}">
new: return`<li class="tmSet217${v.e==='no'||faded?' tmOff217':v.e==='own'?' tmOwn217':''}">
```
- **Line 15,150.** `list` takes a second argument: its lines are faded whatever their verdict.
```
old: function list(lines){const why=shared(lines);return {ul:`<ul>${lines.map(r=>setting(r,'',!!why)).join('')}</ul>`,why}}
new: function list(lines,faded=false){const why=shared(lines);return {ul:`<ul>${lines.map(r=>setting(r,'',!!why,faded)).join('')}</ul>`,why}}
```
- **Line 15,161.** In `build`: the map's cards have a place for the Ingest Processor's.
```
old: results=new Map(),cards={read:[],parse:[],transform:[],store:[],search:[]};
new: results=new Map(),cards={read:[],parse:[],transform:[],ingest:[],store:[],search:[]};
```
- **Line 15,186.** In `build`, after the copies' cards: a card under Read for each transform that names this source type, with a line to the source type.
```
old:   edges.push({from:id,to:hubId,kind:'copy'})}
new:   edges.push({from:id,to:hubId,kind:'copy'})} for(const c of g.retypes){const id=nid('N'),l=list(inOrder(winners(c.st)));cards.read.push(card({id,cls:'tmOrigin217',kind:'transforms',st:c.st,sub:`Events of ${c.from?.length?c.from.map(t=>`<button type="button" class="tmType217" data-tm-type="${esc(t)}">${esc(t)}</button>`).join(', ').replace(/, (?=[^,]*$)/,' and '):'every source type its stanzas cover'} ${c.maybe?'can become':'become'} ${esc(T)} here, after they are parsed. Run by ${c.lines.map(lineRef).join(' and ')}`,body:l.ul,why:l.why,off:tone([stanzaLine(c.st)].filter(Boolean))}));edges.push({from:id,to:hubId,kind:'retype'})}
```
- **Line 15,190.** A source type whose events only a transform names: its own index-time settings have no effect on them, and its cards say so.
```
old:  const stanzaCard=(ph,{st,lines})=>{const l=list(lines);return card({kind:'props',st,sub:st===g.hub?(ownSub[ph]?.()||''):scope(st,T),body:l.ul,why:l.why,off:tone(lines)})};
new:  const renamedOnly=g.retypes.length&&!g.copies.length&&!g.inputs.length&&!shown.size,firsts=[...new Set(g.retypes.flatMap(c=>c.from||[]))].join(' or ')||'the source type they came as',lateWhy=`No effect on events that get this name from a transform: they were read and parsed as ${firsts}.`,lateRuns=`Events that get this name from a transform aren’t run through these: they were transformed as ${firsts}.`;const stanzaCard=(ph,{st,lines})=>{const l=list(lines),late=renamedOnly&&st===g.hub&&ph==='read';return card({kind:'props',st,sub:st===g.hub?(ownSub[ph]?.()||''):scope(st,T),body:l.ul,why:late?lateWhy:l.why,off:late?'off':tone(lines)})};
```
- **Line 15,192.** "No input … names it" is said only when no transform names it either.
```
old:  if(!g.inputs.length&&!shown.size&&!g.copies.length)cards.read.push(
new:  if(!g.inputs.length&&!shown.size&&!g.copies.length&&!g.retypes.length)cards.read.push(
```
- **Line 15,197.** The source type's parsing lines are listed faded then.
```
old: hubList=list(hubLines);
new: hubList=list(hubLines,!!(copyOnly||renamedOnly));
```
- **Line 15,202.** The source type's card says how such events were parsed.
```
old: :'Copies made by a transform skip parsing: these settings apply to the events its inputs read.':''].filter(Boolean).join(' ');
new: :'Copies made by a transform skip parsing: these settings apply to the events its inputs read.':'',g.retypes.length?renamedOnly?`Its events get this name from a transform, after they are parsed as ${esc(firsts)}${hubLines.length?', so the parsing settings below don’t apply to them':''}.`:`Events that get this name from a transform were parsed as ${esc(firsts)}: these settings apply to the events that arrive already named ${esc(T)}.`:''].filter(Boolean).join(' ');
```
- **Line 15,203.** Its parsing settings are faded then, and a copy-only source type's as before; the card itself no longer fades, so its name, its sentence and the line into it stay readable.
```
old:  cards.parse.push(`<article class="tmCard217 tmHub217${copyOnly&&hubLines.length?' tmOff217':''}"
new:  cards.parse.push(`<article class="tmCard217 tmHub217"
```
- **Line 15,210.** Its own TRANSFORMS-, RULESET- and SEDCMD- lines don't run on them: they are faded, with the reason once, and lead to no destination.
```
old:  for(const {st,lines} of g.cols.transform){const why=shared(lines);
new:  for(const {st,lines} of g.cols.transform){const isLate=r=>renamedOnly&&st===g.hub&&/^(TRANSFORMS|RULESET|SEDCMD)-/.test(r.key),anyLate=lines.some(isLate),sh=shared(lines),why=anyLate?lateRuns:sh;
```
- **Line 15,212.** A line of the faded kind is drawn faded, and gives the reason once on its card.
```
old: return`<ul>${setting(r,'',!!why)}</ul>`;
new: return`<ul>${setting(r,'',!!sh||isLate(r),isLate(r))}</ul>`;
```
- **Line 15,216.** A destination says which words the transform finds for it.
```
old:     for(const o of outs)edges.push({from:id,to:result(o,`Events matching [${name}]`,[line].filter(Boolean)).id,kind:o.kind});
new:     for(const o of isLate(r)?[]:outs)edges.push({from:id,to:result(o,o.found?.length?`Events where [${name}] finds ${o.found.join(' and ')}`:o.pattern?`Events matching [${name}] are named ${o.pattern}, from their own text`:`Events matching [${name}]`,[line].filter(Boolean)).id,kind:o.kind});
```
- **Line 15,217.** A faded line's transforms are faded with it.
```
old: return`<li class="tmRun217${e==='no'?' tmOff217':''}" id="${id}">
new: return`<li class="tmRun217${e==='no'||isLate(r)?' tmOff217':''}" id="${id}">
```
- **Line 15,218.** The same for a line that runs transforms.
```
old: ${`<ul>${setting(r,'',!!why)}</ul>`}<ol>${runs}</ol>
new: ${`<ul>${setting(r,'',!!sh||isLate(r),isLate(r))}</ul>`}<ol>${runs}</ol>
```
- **Line 15,219.** A faded card's SEDCMD- lines lead nowhere either.
```
old:   for(const r of lines)if(/^SEDCMD-/.test(r.key))edges.push(
new:   for(const r of lines)if(!isLate(r)&&/^SEDCMD-/.test(r.key))edges.push(
```
- **Line 15,220.** The card itself fades only when all its lines do.
```
old: sub:st===g.hub?`Run on ${esc(T)}’s events, on the parsing tier`:scope(st,T),body,why,off:tone(lines)}))}
new: sub:st===g.hub?`Run on ${esc(T)}’s events, on the parsing tier`:scope(st,T),body,why,off:anyLate&&lines.every(isLate)?'off':tone(lines)}))}
```
- **Line 15,221.** After the Transform column: the pipelines that take this source type, each a card, and what their commands lead to.
```
old:  if(!cards.transform.length)cards.transform.push(`<p class="tmEmpty217">No index-time transforms in these files act on ${esc(T)}.</p>`);
new:  if(!cards.transform.length)cards.transform.push(`<p class="tmEmpty217">No index-time transforms in these files act on ${esc(T)}.</p>`);const ip=window.configPipelines218?.forType(T,{esc,nid})||{cards:[],outs:[],count:0};cards.ingest.push(...ip.cards);for(const o of ip.outs)edges.push({from:o.from,to:result(o.result,o.detail).id,kind:o.result.kind});
```
- **Line 15,224.** Events a transform names keep the index they had.
```
old: title:copyOnly?'The index the events had':'The default index'},copyOnly?
new: title:copyOnly||renamedOnly?'The index the events had':'The default index'},renamedOnly?'Events that get this name from a transform keep the index they had, unless a later transform changes it':copyOnly?
```
- **Line 15,227.** A destination that is a source type is followed only when the files have it; one that can't be listed names the source types in the files that fit.
```
old: ${x.type?` <button type="button" class="tmType217" data-tm-type="${esc(x.type)}">Follow ${esc(x.type)}</button>`:''}</p>
new: ${x.type?pm.types.includes(x.type)?` <button type="button" class="tmType217" data-tm-type="${esc(x.type)}">Follow ${esc(x.type)}</button>`:' Nothing else in these files names it.':''}${x.pattern?x.fits.length?` In these files: ${x.fits.map(t=>`<button type="button" class="tmType217" data-tm-type="${esc(t)}">${esc(t)}</button>`).join(' ')}`:' No source type in these files fits.':''}</p>
```
- **Line 15,230.** In `build`, before the search-time settings: a card for each source type that `rename` gives this name.
```
old:  for(const {st,lines} of g.cols.search){const why=shared(lines);
new:  for(const a of g.aliases){const t=a.name;cards.search.push(card({cls:'tmOrigin217',kind:'props',st:a,sub:`Events indexed as ${`<button type="button" class="tmType217" data-tm-type="${esc(t)}">${esc(t)}</button>`} are searched as ${esc(T)}, with ${esc(T)}’s search-time settings`,body:`<ul>${setting(a.keys.get('rename'))}</ul>`}))}for(const {st,lines} of g.cols.search){const why=shared(lines);
```
- **Line 15,231.** A `rename` line says what searches see, and leads to that source type.
```
old:   const body=`<ul>${lines.map(r=>{if(!r.refs)return setting(r,'',!!why);
new:   const body=`<ul>${lines.map(r=>{if(r.key==='rename'){const t=r.value;return setting(r,'',!!why).replace(/<\/li>$/,`<div class="tmNestedList217"><span class="tmNested217">Searches see these events as ${esc(t)}, with ${esc(t)}’s search-time settings and none of this stanza’s. ${pm.types.includes(t)?`<button type="button" class="tmType217" data-tm-type="${esc(t)}">Follow ${esc(t)}</button>`:''}</span></div></li>`)}if(!r.refs)return setting(r,'',!!why);
```
- **Line 15,237.** `build` returns what the pipelines gave.
```
old:  return {g,cards,edges}}
new:  return {g,cards,edges,ip}}
```
- **Line 15,254.** In `draw`: the map shows with pipelines loaded, even with no .conf file.
```
old:  const on=state.view==='config'&&pm.files.length>0;
new:  const pipes=window.configPipelines218,on=state.view==='config'&&(pm.files.length>0||!!pipes?.files().length);
```
- **Line 15,255.** It is drawn again when the pipelines change.
```
old: pm.focus,comp(),pm.types]);
new: pm.focus,comp(),pm.types,pipes?.version||0]);
```
- **Line 15,259.** The pipeline files are listed in the map's head in every state, each with Remove.
```
old: gives the map a source type to follow.</span></div></div>`;drawn=null;bind();return}
new: gives the map a source type to follow.</span></div></div>${pipes?.head({esc})||''}`;drawn=null;bind();return}
```
- **Line 15,260.** The same with no source type chosen.
```
old: where its events go and what searches add.</span></div>${chips}</div>`;drawn=null;bind();return}
new: where its events go and what searches add.</span></div>${chips}</div>${pipes?.head({esc})||''}`;drawn=null;bind();return}
```
- **Line 15,261.** In `draw`: with a pipeline that takes the source type, the columns are six, the Ingest Processor's after Transform.
```
old:  const {g,cards,edges}=build(T);drawn={g,edges};
new:  const {g,cards,edges,ip}=build(T);drawn={g,edges};const phases=ip.count?[...PHASES.slice(0,3),{key:'ingest',name:'Ingest Processor',where:'Splunk Cloud’s Ingest Processor: the pipelines that take this source type. Its path is separate from the parsing tier’s'},...PHASES.slice(3)]:PHASES;
```
- **Line 15,265.** The summary counts the transforms that name it.
```
old: g.copies.length?count(g.copies.length,'copy rule','copy rules'):'',
new: g.copies.length?count(g.copies.length,'copy rule','copy rules'):'',g.retypes.length?count(g.retypes.length,'naming transform','naming transforms'):'',
```
- **Line 15,265.** The summary counts the pipelines, between the transforms and the destinations.
```
old: count(transforms,'index-time transform','index-time transforms'),
new: count(transforms,'index-time transform','index-time transforms'),ip.count?count(ip.count,'Ingest Processor pipeline','Ingest Processor pipelines'):'',
```
- **Line 15,267.** The pipeline files are listed under the summary.
```
old:  <p class="tmSummary217" aria-live="polite">${summary.map(s=>`<span>${s.replace(/^(\d+)/,'<b>$1</b>')}</span>`).join('')}</p>
new:  <p class="tmSummary217" aria-live="polite">${summary.map(s=>`<span>${s.replace(/^(\d+)/,'<b>$1</b>')}</span>`).join('')}</p>${pipes?.head({esc})||''}
```
- **Line 15,268.** The columns: six with a pipeline, the Ingest Processor's fourth, with its own badge.
```
old:  <div class="tmScroll217"><div class="tmGrid217">${PHASES.map((p,i)=>
new:  <div class="tmScroll217"><div class="tmGrid217${ip.count?' tmSix218':''}">${phases.map((p,i)=>
```
- **Line 15,268.** The Ingest Processor's column has one badge, IP, outlined when it is the component chosen in the strip.
```
old: <span class="tmTiers217">${tiers(p.key,g)}</span>
new: <span class="tmTiers217">${p.key==='ingest'?`<i class="tmIp218${comp()==='ip'?' tmPicked217':''}" title="Ingest Processor">IP</i>`:tiers(p.key,g)}</span>
```
- **Line 15,296.** The new line kind has its arrow.
```
old:  const kinds=['name','match','copy','index','route','drop','meta','field','text'];
new:  const kinds=['name','match','copy','retype','index','route','drop','meta','field','text'];
```
- **Line 15,300.** In `bind`: Remove takes a pipeline file out, and the source types are worked out again.
```
old:  root.querySelectorAll('[data-tm-type]').forEach(b=>b.onclick=()=>{pm.focus=b.dataset.tmType;render()});
new:  root.querySelectorAll('[data-tm-type]').forEach(b=>b.onclick=()=>{pm.focus=b.dataset.tmType;render()});root.querySelectorAll('[data-tm-pipe-remove]').forEach(b=>b.onclick=()=>{window.configPipelines218.remove(b.dataset.tmPipeRemove);cv.analyse();render()});
```

## The new blocks

Before `</body>`, after `source-type-map-records-v217`, in this order:

1. **`<style id="ingest-pipelines-v218-styles">`,** containing [`docs/mockups/ingest-pipelines-prototype.css`](mockups/ingest-pipelines-prototype.css): the six-column grid, the pipeline's card and commands, the list of pipeline files, and the IP badge.
2. **`<script id="ingest-pipelines-v218">`,** containing [`docs/mockups/ingest-pipelines-prototype.js`](mockups/ingest-pipelines-prototype.js). It defines `window.configPipelines218`:
   - `add(path, text)`, `remove(path)`, `clear()` and `files()` keep the pipeline files; `version` counts their changes.
   - `read(text)` reads a file's pipelines. It splits SPL2 at the top level only: outside strings, regular expressions, comments and brackets.
   - `types()` gives the source types they name.
   - `forType(T, …)` gives the map the cards of the pipelines that take a source type, and what their commands lead to.
   - `head(…)` gives the list of files for the map's head.

   The Config view and the map call it only through `window.configPipelines218?.…`, so either order of the blocks works.

## Build records

After the edits and the blocks, in a new `<script id="splits-and-pipelines-records-v218">` before `</body>`:
- **`changeRegister`,** group "Explorer foundations", two items:
  `['Source type splits in the source type map','The source type map follows a transform that sets the source type: it lists each source type the transform can name, with a way to open it, and each of those shows the transform and the source types its events come from. Settings that no longer act on such events are faded, with the reason. A search-time rename leads to the source type it names, and back.',true]`
  and `['Ingest Processor pipelines in the source type map','The Config view takes Ingest Processor pipelines as SPL2 files. Where a pipeline takes the chosen source type, the source type map gains an Ingest Processor column with the pipeline’s commands and what each leads to: a drop, an index, another source type, a field, a rewrite or a destination.',true]`.
- **`#topologyBuilder` `data-build-number` and `data-build-date`, the page title and the ⓘ text prefix:** as Build 217 did in `source-type-map-records-v217`, with Build 218.

## Found while testing (not changed)

1. **The panel's Source type list doesn't follow the split.** With fortigate_traffic chosen, the panel keeps "58 lines on 9 stages": its own stanza's lines and the search-time transforms they name. It doesn't keep `[force_sourcetype_fortigate]`, or the `[fortigate_log]` and `[fgt_log]` lines that run it. The map now shows them. The list is Build 205's, and was left as it is.
2. **The add-on has no inputs.conf.** Its source types' maps say "No input, [source::] stanza or rule in these files names fortigate_log." That is right for these files: the input is set up on the instance that receives the logs.

## Check before uploading

Run with Build 217 + the edits, and with Build 217 as shipped for comparison.

### 1. The splits: 40 checks, all pass

| Checks | What they find |
|---|---|
| The add-on (26) | It loads: ten source types. fortigate_log and fgt_log each: "The default index", then "Becomes fortigate_traffic", "Becomes fortigate_utm", "Becomes fortigate_event" and "Becomes fortigate_anomaly"; each says "Events where [force_sourcetype_fortigate] finds traffic." and the like, and has its "Follow"; four lines from the transform, each starting and ending on its cards; "5 destinations". "Follow fortigate_utm" chooses it, in the panel's list too. fortigate_utm: under Read, the transform's card, "Events of fortigate_log and fgt_log become fortigate_utm here, after they are parsed. Run by default:2 and default:7", and its line to the source type; no "No input … names"; "1 naming transform"; the source type's sentence, its card not faded and its two parsing lines faded; its read-time card faded, with the reason; `ANNOTATE_PUNCT` left as it is; "The index the events had"; first under Search, "Events indexed as fgt_utm are searched as fortigate_utm, with fortigate_utm’s search-time settings", whose chip opens fgt_utm. fgt_utm: the `rename` line's sentence, and its "Follow" back to fortigate_utm. The transform's fortigate_log chip opens fortigate_log. With the Universal Forwarder chosen, the four destinations and their lines fade. At 390 px: one column, no lines, no page scroll, and the five destinations still listed. No page errors |
| Other files (13) | A transform with one name: "Becomes one", with "Follow one". A name the `REGEX` doesn't list: "Source type set from the event", "Events matching [set_open] are named open_$1, from their own text. In these files: open_web". Named groups, escaped brackets and character classes are counted right: `$2` of `(?<pre>x)(?:y)(?P<kind>alpha\|beta)\((a\|b)\)[(]z` gives n_alpha and n_beta. A source type nothing else names has no "Follow", and says so. Every line on its cards. A source type only a transform names: the transform's card; its own `TRANSFORMS-` and `SEDCMD-` lines faded with the reason once, leading to no destination; the stanza searched under its name. Where the names can't be listed: "can become". A source type an input names too: nothing fades, its card says which events its settings parse, and both lines run into it. No page errors |
| The example (1) | The four source types' maps, with All components, the Universal Forwarder and the Search Head chosen: all 12 are Build 217's, element for element (the lines' SVG and the destination cards' offsets set aside) |

### 2. Ingest Processor pipelines: 31 checks, all pass

| Checks | What they find |
|---|---|
| The add-on and a pipeline (22) | Uploaded together through the panel's Upload files: the panel takes props.conf and transforms.conf, the pipelines block fortigate.spl2, with no message. The map's head lists "fortigate.spl2 · 1 pipeline", with Remove. fortigate_log and fgt_log each: six columns, "4 Ingest Processor"; the pipeline's card, "$pipeline · fortigate.spl2 · Takes events where sourcetype == "fortigate_log" OR sourcetype == "fgt_log"", and its seven commands; "Dropped", "Index netfw", "Indexed field vendor", "Indexed field devname", "Text rewritten", "Sent to $traffic_archive" ("Events where type == "traffic", in $pipeline.") and "Sent to $destination"; 11 lines, each starting and ending on its cards and commands; "1 Ingest Processor pipeline" and "11 destinations". Six columns fit a 1,440 px window. fortigate_utm, which the pipeline doesn't take: five columns, no pipeline card, nothing of the Ingest Processor in the summary. With the Ingest Processor chosen in the strip, its badge is outlined. At 1,024 px the map scrolls inside and the page doesn't; at 390 px one column, no lines, no page scroll. Remove takes the file out: five columns again, and no list. A pipeline file can be added later, on its own. Clear takes the pipelines out with the files. No page errors |
| Pipelines only, and other pipelines (9) | With a pipeline and no .conf file, the map shows, with the source types the pipeline names, and draws one: "props.conf has no [fortigate_log] stanza." With the example: a file's three pipelines, and the source types they name, join the list. A pipeline with no test of the source type takes every one. A pipeline's text is drawn as text. `IN` lists are read; `eval sourcetype = "acme:fw:clean"` gives "Becomes acme:fw:clean", whose "Follow" opens it. `LIKE` is read, and a second `where` is a filter. A file with no pipeline is reported and not kept. No page errors |

### 3. The map's own checks, and regression

| Suite | Result |
|---|---|
| The source type map's 82 checks (from its handoff) | 82 of 82, as on Build 217 |
| View text, every view, no files loaded | 9 of 10 the same. The Config view's differs by the empty panel's new sentence, and by nothing else |
| OV pages, each tab's text | 28 of 28 the same |
| The Config view with the example: the panel's HTML, the view's Matrix's HTML and the page's text with the map left out, for every component and source type choice; and the page's text with no files | 75 of 76 the same. The page's text with no files differs by the same sentence |
| The Builder, settled: its text, and every card's text and box | The same |
| Page errors | None |
| The space tool | The same output as Build 217 |
| The connector tool | The same output as Build 217 |

Each comparison takes Build 217 twice, to set aside whatever varies from run to run; nothing did.

The perf tool wasn't run again. The edits are inside the Config view's and the map's scripts, and the new block is called only from them; a Builder redraw runs none of it (see the source type map's handoff).


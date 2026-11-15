# Splunk checks: Try an event against Splunk 10.6.1.1

Every rule Try an event follows that Splunk's docs leave open, or that Build 225 read from them, was checked in a real Splunk: events were indexed and the results searched.

- **Splunk:** Splunk Enterprise 10.6.1.1 (build b2ae2962645c), from the `splunk/splunk:latest` Docker image of 19 Oct 2026, on its trial license. Starting the image requires `SPLUNK_START_ARGS=--accept-license` and `SPLUNK_GENERAL_TERMS=--accept-sgt-current-at-splunk-com`.
- **Run:** 15 Nov 2026.
- **Events:** sent through `receivers/simple`, so each took Splunk's whole index-time path. Each was then read back with `| table *`, or with `| tstats` for indexed fields.
- **Loaded into Splunk:**
  - `pe_checks`, a test app of 304 probes: `EVAL-` lines on indexed events, and `| makeresults | eval` searches;
  - Build 225's made-up app, `Splunk_TA_calc`, and Build 226's, `Splunk_TA_parity`;
  - `pe_et`, a made-up app of 52 event types and their tags, for Build 227 (see [Event types and tags](#event-types-and-tags));
  - the Fortinet FortiGate add-on 1.6.10. That add-on isn't in the repository, because Splunk licenses it.

Build 226 brings the page in line with these results; Build 225 is the page before. Build 227 adds event types and tags, checked in rounds 6 and 7 below.

| | Build 225 | Build 226 |
|---|---|---|
| The 304 probes: Splunk's value | 128 of 304 | 304 of 304 |
| The Fortinet add-on's 54 sample events: field values as Splunk's | 2,681 of 2,701 | 2,682 of 2,682, all 54 events |
| Build 225's made-up app: fields as Splunk's | 21 of 26, and not its host | 24 of 26: `strftime()` isn’t computed, and Splunk’s own tag field hides an indexed field named tag |
| Build 226's made-up app, four events | Not run | Each event value for value |

## What Splunk does

### Missing values
- Arithmetic and joining with a missing value give no value: `a + 1`, `a . "x"`, `a + "x"`.
- A comparison with a missing value gives no value too. `EVAL-b = a > 1` gives no field, and `coalesce(a > 1, k == 1)` passes over it.
- `if()`, `case()` and `validate()` count no value as false. So do `NOT`, `AND`, `OR` and `XOR`, which always give true or false:
  - `if(NOT a > 1, "y", "n")` gives "y";
  - `a > 1 AND k == 1` gives 0;
  - `a > 1 OR k == 2` gives 0;
  - `a > 1 XOR k == 1` gives 1.
- `tostring()` of a missing value is the text "Null", so `upper(tostring(a))` gives "NULL".
- `max(a, 3)` and `min(a, 3)` give 3, and `coalesce(a, "d")` gives "d".
- A calculated field that gives no value removes the field.
- Calculated fields run in parallel: `EVAL-d = d * 2` and `EVAL-q = d` give 10 and 5, with d = 5.

### Types: `+` and comparisons
Splunk checks types before it runs an expression:
- quoted text, and functions that return text (`tostring()`, `mvindex()`, `case()` with quoted values), are text;
- numbers written in the expression, and arithmetic results, are numbers;
- a field's value is either: a number when it reads as one, and its own text always.

| Rule | Examples |
|---|---|
| `+` adds two values that can be numbers | `s1 + s2` = 11, `z + 1` = 8 (z = 007), `e + 1` = 1001 (e = 1e3) |
| `+` joins two values that can be text | `n + t` = "5abc", `s1 + "6"` = "56", `z + "x"` = "007x", `hostname + bytes` = "web01.corp2048" |
| A number known only when the event runs, with text: no value | `h + 1` (h = 0x10), `(s1 + 1) + t` |
| A number and text where Splunk can see both types: the whole expression is rejected | `5 + "abc"`, `"" + 1`, `s1 - "1"`, `case(true(), "2") + 1`, `mvindex(m, 0) + 1`, `if(s1 + 1 == "6", "y", "n")` |
| Two values that can be numbers compare as numbers | `z == 7` is true, `s1 < s10` is true |
| Otherwise they compare as text, when both can be | `s1 < "10"` is false, `t > s1` ("abc" against "5") is true |
| Event text against a number has no answer | `t < 5`, `t > 5`, `t == 5` and `t != 5` are all false |

- In a search, `| makeresults | eval x=5+"abc"` stops with "Type checking failed. '+' only takes two strings or two numbers."
- A calculated field that's rejected leaves the field as it was: `EVAL-t = 5 + "abc"` left t = abc.
- In `INGEST_EVAL`, splunkd.log says "Error compiling INGEST_EVAL expression … Operator '+' types incompatible", and none of that transform's assignments run.

### True and false
- A calculated field or an `INGEST_EVAL` assignment stores true as 1 and false as 0: `s1 > 1` gives 1 and `false()` gives 0.
- A search's `eval` refuses them instead: "Fields cannot be assigned a boolean result".
- `tostring(true())` gives "True".
- True or false where text or a number is wanted is rejected: `"x" . (k == 1)`, `(k == 1) + 1`, `upper(k == 1)`.

### Fields with several values
These examples use m = 1, 2.
- `lower()`, `upper()` and `trim()` work on each value.
- `coalesce()`, `if()` and `nullif()` pass the values on.
- `tostring(m)` gives "1 2", `max(m)` gives 2, and `mvindex(m, 1)` gives 2.
- `m == "1"`, `m == "2"` and `m == k` (k = 1) are true when any value matches. So are `m IN ("2")`, `in(m, "2")`, `like(m, "2")` and `match(m, "2")`.
- False:
  - `m == 1` and `m == "3"`;
  - `m != "1"` and `m < "3"`;
  - `isnull(m)`, `isnum(m)` and `isstr(m)`;
  - `cidrmatch("10.0.0.0/8", ips)`, even with ips = 10.1.1.1, 8.8.8.8.
- No value:
  - arithmetic, and joining with `.`;
  - `len()`, `replace()`, `substr()`, `split()`, `urldecode()` and `md5()`;
  - `tonumber()`, `abs()` and `round()`.

### Numbers
At search time, a number written with a decimal point keeps its precision. Whole numbers are exact.

| Rule | Examples |
|---|---|
| `+` and `-` keep the fewest decimal places | `1.50 + 1` = 2.50, `1.5 + 1.5` = 3.0, `0.1 + 0.2` = 0.3, `w - w` = 0.00, `1e3 + 0.5` = 1001, `1e3 + 0.25` = 1000 |
| `*`, `/`, `%`, `pow()`, `sqrt()`, `exp()`, `ln()` and `log()` keep the fewest significant figures | `1.50 * 2` = 3.00, `1.0 / 3` = 0.33, `0.05 * 3` = 0.2, `1.5 * 1.5` = 2.3, `12.5 % 5` = 2.50, `sqrt(2.0)` = 1.4, `log(2.0)` = 0.30, `pow(2, 0.5)` = 1 |
| A number with an exponent and no point has no significant figures to keep | `1e2 * 1.5` = 150, `1e3 * 1.5` = 1500 |
| A result carries its precision on | `(1.5 + 1.5) * 2` = 6.0, `(1.50 * 1.5) + 0.01` = 2.3 |
| `round(x, n)` rounds the full value to n places and keeps them | `round(2048/1024, 1)` = 2.0, `round(1.50 * 1.5, 3)` = 2.250, `round(2.675, 2)` = 2.68 and `round(1.005, 2)` = 1.00, as `Math.round(x * 100) / 100` gives, `round(-2.5)` = -2 |
| A value passed on keeps its text | `min(1.50, 3)` = 1.50, `abs(-1.50)` = 1.50, `tonumber("1.50") * 2` = 3.00; of equal values, `min()` and `max()` give the first |
| Whole numbers, and `exact()`, give the full value | `1/3` = 0.3333333333333333, `10/3` = 3.3333333333333335, `sqrt(2)` = 1.4142135623730951, `exact(0.1 + 0.2)` = 0.30000000000000004 |
| No exponents | `1 / 100000000` = 0.00000001, `2 * 1e21` = 2000000000000000000000 |

- At index time, `INGEST_EVAL` writes the same numbers without the zeros after a point: `1.5 + 1.5` = 3, `1.50 * 2` = 3 and `round(2048/1024, 1)` = 2, with 0.1 + 0.2 still 0.3.
- `pi()` is 3.14159265358.

### Lookups
- **Spaces in a CSV file:** Splunk leaves out the spaces round a name or value that isn't quoted, and keeps them inside quotes. It matches on what's left.
  - `key , val ,"q"` gives the fields key, val and q.
  - `" qa ",qb, qc ` gives " qa ", qb and qc.
  - A row ` a , x ," y "` gives a, x and " y ".
  - The Fortinet add-on's `ftnt_action, action` gives action, and a lookup on ftnt_action "allow" gives action = "allowed", 7 characters.
- **Automatic lookups chain, in name order.** Splunk runs a source type's `LOOKUP-` lines one after another, sorted by byte value, and each sees the fields the earlier ones wrote. With `LOOKUP-a_user` writing dept:
  - `LOOKUP-h_nested` and `LOOKUP-z_late` matched on it;
  - `LOOKUP-0_early` and `LOOKUP-B_upper` didn't, as they sort before a.

  The Knowledge Manager Manual says "Splunk software does not support nested automatic lookups"; Splunk 10.6.1.1 chains them all the same.
- **A lookup that can't load:** a missing column or file gives "Could not load lookup=LOOKUP-…", and the search goes on.

### `INGEST_EVAL`
- **host, source and sourcetype:** each assignment sets the event's value. `=` and `:=` both replace, and the last one wins: `host="h-one", host="h-two"` gives h-two.
- **A new source type:**
  - the next transforms in the same `TRANSFORMS-` line run and read it;
  - its own index-time `TRANSFORMS-` don't run;
  - its search-time settings apply.
- **Reading:** host, source, sourcetype, index and linecount read as plain values, without a `host::` prefix.
- **A `REGEX` in the same stanza** doesn't stop `INGEST_EVAL` from running.
- **Indexed fields:** `f1="a", f1="b"` gives two values; `f2="c", f2:="d"` gives d; `f3=null()` gives nothing.

### Extractions
- **An empty value gives no field:**
  - an `EXTRACT-` group that captures nothing;
  - a `REPORT-` `REGEX` whose value is empty;
  - `user=""` read by `DELIMS`.

  With `KEEP_EMPTY_VALS = true`, a `REPORT-` keeps an empty value.
- **Automatic extraction:** `ka=` gives no field, while `kb=""` gives an empty one.
- **`DELIMS`:** every double quote comes off a value.
  - A quote stops the pair delimiter splitting until the next quote: `a="x y" b=2` gives a = x y and b = 2.
  - With no closing quote, it takes the rest of the event: `a="x b=2 c=3` gives a = x b=2 c=3, and `out_spi="017e66f3` at the end gives 017e66f3.
  - A quote in a value's middle works the same way: `a=x"y b=2` gives a = xy b=2.
  - `a=` gives no field, even with `KEEP_EMPTY_VALS`.
- **`MV_ADD = true`:** a `REPORT-` applies its `REGEX` to every match, and a field the event has already takes each value as another one: `mv=a mv=b` gives m = a, b.

## Event types and tags

Build 227 ends Try an event with the event types the event gets, their tags and the CIM data models they fit. These are the rules it follows, each as Splunk 10.6.1.1 showed it.

| | Build 226 | Build 227 |
|---|---|---|
| The Fortinet add-on's 54 sample events: event types and tags as Splunk's | Not shown | Each event's event types and tags, all 54, none left open |
| The made-up app `pe_et`: one event against its 51 event types in use | Not shown | 49 as Splunk, 0 otherwise; the 2 that ask for host and index left open, and Splunk took both |
| The same event's tags | Not shown | All 10, Splunk's |

- **Round 6:** `pe_et` has 52 event types, one for each rule below, and tags of event types and of field values. Its one event is `k=abc n=10 mv=1 mv=2 q="a b" ip=10.1.2.3 e=""`, of source type pe_et, sent with host h-et to index pe. Its `REPORT-mv` gives m = 1, 2 (`MV_ADD`), its calculated field gives calc = yes, and its lookup gives lk = found. The event's `eventtype` and `tag` fields were read with `| table *`.
- **Round 7:** two events of source type pe_r7, each with `eventtype=foo tag=bar` in its text. An event type, `et_r7_match`, takes the first; a tag, `[k=match]`, tags it.
- **The Fortinet add-on:** the 54 sample events' `eventtype` and `tag` fields, from the same search as their other fields: 16 event types and 18 tags between them.
- **CIM data models** weren't checked: the container had no CIM app. They follow Build 222's table of the tags each data model's datasets need.

### What Splunk does with an event type's search

- **field=value:**
  - values match in any case: `k=ABC` takes k = abc;
  - `*` is a wildcard: `k=a*`, `k=*b*`;
  - an IPv4 range takes its addresses: `ip=10.0.0.0/8` takes 10.1.2.3, and `ip=10.1.*` does too;
  - two numbers compare as numbers: `n=10.0` and `n=010` take n = 10;
  - a quoted value is the same: `k="abc"`, `q="a b"`;
  - any of a field's values can match: `m=2` takes m = 1, 2;
  - `k=ab` doesn't take abc, and `n=1` doesn't take 10.
- **Field names are case sensitive:** `K=abc` takes nothing.
- **A field the event doesn't have matches nothing,** whatever the operator: `missing!=x` and `missing=*` are false, while `NOT missing=x` is true.
- **field!=value:** true only when the field is there and none of its values matches. `k!=x` and `m!=3` are true; `m!=1` and `k!=a*` are false.
- **field=\*:** the field is there, whatever its value: `k=*`. `e=""` takes an empty value.
- **< and >:** as numbers when both sides are (`n>5`, `n>9`), else as text (`k<b`).
- **IN, OR, AND and NOT,** with brackets: `k IN (x, abc)`, `(k=x OR n=10)`, `AND` written or implied. `NOT m=1` is false, as one of m's values is 1.
- **Free text:** the term's pieces, split at Splunk's breakers, follow one another among the event's, in any case.
  - `abc`, `ABC`, `10`, `10.1.2.3`, `1.2` and `2.3` take the event; `ab` doesn't, but `ab*` does.
  - A quoted phrase works the same way: `"k=abc"` and `"abc n"`.
  - `NOT zzz` is true.
- **sourcetype** in any case, with wildcards: `sourcetype=PE_ET`, `sourcetype=pe_*`. host and index are the event's own: `host=h-et`, `index=pe`.
- **Other event types:** `eventtype=et_eq` asks what et_eq asks. `NOT eventtype=et_eq_case` is false, as et_eq_case takes the event.
- **Fields from later in search time** can be matched: a calculated field (`calc=yes`), a lookup's output (`lk=found`), and a tag of a field value (`tag=tag_fv`).
- **disabled = 1:** the event type isn't used, and neither are its tags.

### Tags

- **[field=value]** tags a value written exactly so, case sensitive: [k=abc] tags k = abc, and [k=ABC] doesn't. It tags any of several values ([m=2]), a calculated field ([calc=yes]), a lookup's output ([lk=found]), a value with a space ([q=a b]) and the source type ([sourcetype=pe_et]).
- **[eventtype=x]** tags x's events. A tag set to `disabled` isn't given, and neither are a disabled event type's tags.
- **Order:** Splunk lists an event's event types and its tags in ASCII order.

### An event's own eventtype and tag fields

| Event | Event type | Tag | eventtype at the end | tag at the end |
|---|---|---|---|---|
| `eventtype=foo tag=bar k=match r7=1` | et_r7_match takes it | [k=match] gives tag_r7 | et_r7_match | tag_r7 |
| `eventtype=foo tag=bar k=nomatch r7=2` | None | None | foo | None |

- **Event types replace** an `eventtype` field taken from the event's text; an event that gets none keeps it. A search's `eventtype=foo` finds neither event: it asks for an event type.
- **Tags replace** a `tag` field taken from the text; with no tags, the event has no tag field.
- **In the Fortinet add-on,** 11 samples have `eventtype=` in their text, with analytics and ftgd_allow and signature and urlfilter. Splunk's `eventtype` for each is its event types; the add-on's field alias keeps the text's value as `vendor_eventtype`.

### Every event type, against the one event

○ marks an answer that isn't Splunk's: the page leaves it open, as host and index aren't known for a pasted event.

| Event type | Search | Splunk | Build 227 |
|---|---|---|---|
| et_eq | `sourcetype=pe_et k=abc` | Takes it | Takes it |
| et_eq_case | `sourcetype=pe_et k=ABC` | Takes it | Takes it |
| et_wild | `sourcetype=pe_et k=a*` | Takes it | Takes it |
| et_ne_missing | `sourcetype=pe_et missing!=x` | Doesn’t | Doesn’t |
| et_ne_present | `sourcetype=pe_et k!=x` | Takes it | Takes it |
| et_not_missing | `sourcetype=pe_et NOT missing=x` | Takes it | Takes it |
| et_star | `sourcetype=pe_et k=*` | Takes it | Takes it |
| et_star_missing | `sourcetype=pe_et missing=*` | Doesn’t | Doesn’t |
| et_gt_num | `sourcetype=pe_et n>5` | Takes it | Takes it |
| et_gt_text | `sourcetype=pe_et n>9` | Takes it | Takes it |
| et_lt_text | `sourcetype=pe_et k<b` | Takes it | Takes it |
| et_in | `sourcetype=pe_et k IN (x, abc)` | Takes it | Takes it |
| et_or | `sourcetype=pe_et (k=x OR n=10)` | Takes it | Takes it |
| et_text | `sourcetype=pe_et abc` | Takes it | Takes it |
| et_text_part | `sourcetype=pe_et ab` | Doesn’t | Doesn’t |
| et_text_case | `sourcetype=pe_et ABC` | Takes it | Takes it |
| et_text_wild | `sourcetype=pe_et ab*` | Takes it | Takes it |
| et_phrase | `sourcetype=pe_et "k=abc"` | Takes it | Takes it |
| et_phrase2 | `sourcetype=pe_et "abc n"` | Takes it | Takes it |
| et_ip | `sourcetype=pe_et 10.1.2.3` | Takes it | Takes it |
| et_ip_part | `sourcetype=pe_et 1.2` | Takes it | Takes it |
| et_ip_word | `sourcetype=pe_et 10` | Takes it | Takes it |
| et_mv_eq | `sourcetype=pe_et m=2` | Takes it | Takes it |
| et_mv_ne | `sourcetype=pe_et m!=1` | Doesn’t | Doesn’t |
| et_mv_not | `sourcetype=pe_et NOT m=1` | Doesn’t | Doesn’t |
| et_quoted_val | `sourcetype=pe_et q="a b"` | Takes it | Takes it |
| et_field_case | `sourcetype=pe_et K=abc` | Doesn’t | Doesn’t |
| et_calc | `sourcetype=pe_et calc=yes` | Takes it | Takes it |
| et_lookup | `sourcetype=pe_et lk=found` | Takes it | Takes it |
| et_tag | `sourcetype=pe_et tag=tag_fv` | Takes it | Takes it |
| et_index | `sourcetype=pe_et index=pe` | Takes it | Left open: index isn’t known for a pasted event ○ |
| et_host | `sourcetype=pe_et host=h-et` | Takes it | Left open: host isn’t known for a pasted event ○ |
| et_and_explicit | `sourcetype=pe_et AND k=abc AND n=10` | Takes it | Takes it |
| et_not_text | `sourcetype=pe_et NOT zzz` | Takes it | Takes it |
| et_numeq | `sourcetype=pe_et n=10.0` | Takes it | Takes it |
| et_numeq2 | `sourcetype=pe_et n=010` | Takes it | Takes it |
| et_eq_quoted | `sourcetype=pe_et k="abc"` | Takes it | Takes it |
| et_wild_mid | `sourcetype=pe_et k=*b*` | Takes it | Takes it |
| et_empty_value | `sourcetype=pe_et e=""` | Takes it | Takes it |
| et_neq_wild | `sourcetype=pe_et k!=a*` | Doesn’t | Doesn’t |
| et_ip_field | `sourcetype=pe_et ip=10.1.*` | Takes it | Takes it |
| et_cidr | `sourcetype=pe_et ip=10.0.0.0/8` | Takes it | Takes it |
| et_raw_kv | `sourcetype=pe_et k=ab` | Doesn’t | Doesn’t |
| et_text_kvpart | `sourcetype=pe_et n=1` | Doesn’t | Doesn’t |
| et_minor | `sourcetype=pe_et 2.3` | Takes it | Takes it |
| et_ne_mv_both | `sourcetype=pe_et m!=3` | Takes it | Takes it |
| et_space_val | `sourcetype=pe_et q=a` | Doesn’t | Doesn’t |
| et_nested | `eventtype=et_eq n=10` | Takes it | Takes it |
| et_st_case | `sourcetype=PE_ET k=abc` | Takes it | Takes it |
| et_st_wild | `sourcetype=pe_* k=abc` | Takes it | Takes it |
| et_disabled | `sourcetype=pe_et`, with `disabled = 1` | Not used | Not used |
| et_nested_not | `sourcetype=pe_et NOT eventtype=et_eq_case` | Doesn’t | Doesn’t |

## Every probe

`≠` marks a value that isn't Splunk's.
- Rounds 1, 2 and 4 were calculated fields (`EVAL-` in props.conf) on an indexed event.
- Rounds 3 and 5 ran as `| makeresults | eval _raw=… | extract … | eval out=…`, which reads the event's fields as calculated fields do.
- "Rejected" is Splunk's type check refusing the expression, which leaves no value.

### Round 1: missing values, + and comparisons (75 probes; Build 225 56, Build 226 75)

Fields: `test=null k=1 c=5 d=5` and `test=plus n=5 t=abc s1=5 s2=6 s10=10 z=007 f=1.5 e=1e3 neg=-2 h=0x10 dn=.5 mv=1 mv=2`, where `REPORT-mv` (`MV_ADD = true`) gives m = 1, 2.

| | Expression | Splunk 10.6.1.1 | Build 225 | Build 226 |
|---|---|---|---|---|
|  | `a + 1` | (no value) | (no value) | (no value) |
|  | `a - 1` | (no value) | (no value) | (no value) |
|  | `a * 2` | (no value) | (no value) | (no value) |
|  | `a . "x"` | (no value) | (no value) | (no value) |
|  | `"x" . a` | (no value) | (no value) | (no value) |
|  | `a + "x"` | (no value) | (no value) | (no value) |
|  | `if(a > 1, "y", "n")` | "n" | "n" | "n" |
|  | `if(a == a, "y", "n")` | "n" | "n" | "n" |
|  | `if(a != 1, "y", "n")` | "n" | "n" | "n" |
| ≠ | `if(NOT a > 1, "y", "n")` | "y" | "n" | "y" |
|  | `if(a > 1 AND k == 1, "y", "n")` | "n" | "n" | "n" |
|  | `if(a > 1 OR k == 1, "y", "n")` | "y" | "y" | "y" |
|  | `if(k == 1 OR a > 1, "y", "n")` | "y" | "y" | "y" |
| ≠ | `if(a > 1 XOR k == 1, "y", "n")` | "y" | "n" | "y" |
| ≠ | `if(NOT (a > 1 OR k == 2), "y", "n")` | "y" | "n" | "y" |
|  | `case(a > 1, "y", k == 1, "k")` | "k" | "k" | "k" |
|  | `case(a > 1, "y")` | (no value) | (no value) | (no value) |
|  | `if(isnull(a), "null", "set")` | "null" | "null" | "null" |
|  | `if(like(a, "%"), "y", "n")` | "n" | "n" | "n" |
|  | `if(match(a, "."), "y", "n")` | "n" | "n" | "n" |
|  | `if(a IN ("1", "2"), "y", "n")` | "n" | "n" | "n" |
|  | `if(in(a, "1", "2"), "y", "n")` | "n" | "n" | "n" |
|  | `len(a)` | (no value) | (no value) | (no value) |
|  | `upper(a)` | (no value) | (no value) | (no value) |
|  | `max(a, 3)` | "3" | "3" | "3" |
|  | `min(a, 3)` | "3" | "3" | "3" |
|  | `round(a)` | (no value) | (no value) | (no value) |
| ≠ | `tostring(a)` | "Null" | (no value) | "Null" |
|  | `if(a < "z", "y", "n")` | "n" | "n" | "n" |
|  | `validate(a > 1, "bad")` | "bad" | "bad" | "bad" |
|  | `coalesce(a, "d")` | "d" | "d" | "d" |
|  | `if(c > 10, "big", null())` | (no value) | (no value) | (no value) |
|  | `d * 2` | "10" | "10" | "10" |
|  | `d` | "5" | "5" | "5" |
| ≠ | `n + t` | "5abc" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "5abc" |
| ≠ | `t + n` | "abc5" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "abc5" |
|  | `s1 + s2` | "11" | "11" | "11" |
| ≠ | `5 + "abc"` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value: rejected) |
| ≠ | `"abc" + 5` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value: rejected) |
|  | `"5" + "6"` | "56" | "56" | "56" |
|  | `5 + 6` | "11" | "11" | "11" |
| ≠ | `s1 + "6"` | "56" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "56" |
| ≠ | `"6" + s1` | "65" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "65" |
|  | `s1 . s2` | "56" | "56" | "56" |
|  | `5 . 6` | "56" | "56" | "56" |
|  | `t - 1` | (no value) | (no value) | (no value) |
|  | `z + 1` | "8" | "8" | "8" |
|  | `e + 1` | "1001" | "1001" | "1001" |
|  | `f + 1` | "2.5" | "2.5" | "2.5" |
|  | `neg + 1` | "-1" | "-1" | "-1" |
| ≠ | `h + 1` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value) |
|  | `dn + 1` | "1.5" | "1.5" | "1.5" |
|  | `if(s1 < s10, "y", "n")` | "y" | "y" | "y" |
|  | `if("5" < "10", "y", "n")` | "n" | "n" | "n" |
|  | `if(s1 < "10", "y", "n")` | "n" | "n" | "n" |
|  | `if(s1 < 10, "y", "n")` | "y" | "y" | "y" |
|  | `if(z == 7, "y", "n")` | "y" | "y" | "y" |
|  | `if(z == "7", "y", "n")` | "n" | "n" | "n" |
|  | `if(z == "007", "y", "n")` | "y" | "y" | "y" |
|  | `if(t == "ABC", "y", "n")` | "n" | "n" | "n" |
| ≠ | `s1 > 1` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `true()` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `m + 1` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `m . "x"` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `upper(m)` | ["1","2"] | not computed: it reads a field with several values | ["1","2"] |
| ≠ | `len(m)` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `if(m == 2, "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
|  | `mvcount(m)` | "2" | "2" | "2" |
|  | `z` | "007" | "007" | "007" |
|  | `tostring(z)` | "007" | "007" | "007" |
|  | `round(f)` | "2" | "2" | "2" |
|  | `s1 / 0` | (no value) | (no value) | (no value) |
|  | `s10 % 3` | "1" | "1" | "1" |
| ≠ | `f + f` | "3.0" | "3" | "3.0" |
|  | `e . ""` | "1e3" | "1e3" | "1e3" |

### Round 2: true and false, numbers, several values, tostring(), NOT, mixed + (108 probes; Build 225 40, Build 226 108)

Fields: `test=more s1=5 t=abc z=007 f=1.5 dn=.5 e=1e3 w=1.50 big=9007199254740993 h=0x10 neg=-2 mv=1 mv=2`.

| | Expression | Splunk 10.6.1.1 | Build 225 | Build 226 |
|---|---|---|---|---|
| ≠ | `s1 > 100` | "0" | not computed: it gives true or false, which a field can’t hold | "0" |
|  | `a > 1` | (no value) | (no value) | (no value) |
| ≠ | `isnull(a)` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `false()` | "0" | not computed: it gives true or false, which a field can’t hold | "0" |
| ≠ | `NOT true()` | "0" | not computed: it gives true or false, which a field can’t hold | "0" |
| ≠ | `like(t, "a%")` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `f + 0.5` | "2.0" | "2" | "2.0" |
| ≠ | `dn + dn` | "1.0" | "1" | "1.0" |
| ≠ | `2.0 + 1` | "3.0" | "3" | "3.0" |
|  | `0.1 + 0.2` | "0.3" | "0.3" | "0.3" |
|  | `10 / 4` | "2.5" | "2.5" | "2.5" |
|  | `10 / 5` | "2" | "2" | "2" |
|  | `7 / 2` | "3.5" | "3.5" | "3.5" |
| ≠ | `s1 * 1.0` | "5.0" | "5" | "5.0" |
|  | `e * 1` | "1000" | "1000" | "1000" |
| ≠ | `e + 0.5` | "1001" | "1000.5" | "1001" |
| ≠ | `w + 0` | "1.50" | "1.5" | "1.50" |
|  | `w` | "1.50" | "1.50" | "1.50" |
|  | `round(2.5)` | "3" | "3" | "3" |
|  | `round(-1.5)` | "-1" | "-1" | "-1" |
|  | `round(f * 1.111, 2)` | "1.67" | "1.67" | "1.67" |
|  | `big + 1` | "9007199254740992" | "9007199254740992" | "9007199254740992" |
| ≠ | `1 / 3` | "0.3333333333333333" | "0.333333333333333" | "0.3333333333333333" |
|  | `1e20 + 1` | "100000000000000000000" | "100000000000000000000" | "100000000000000000000" |
|  | `sqrt(4)` | "2" | "2" | "2" |
| ≠ | `sqrt(2)` | "1.4142135623730951" | "1.4142135623731" | "1.4142135623730951" |
|  | `pow(2, 3)` | "8" | "8" | "8" |
|  | `abs(-1.5)` | "1.5" | "1.5" | "1.5" |
|  | `floor(f)` | "1" | "1" | "1" |
|  | `ceil(f)` | "2" | "2" | "2" |
| ≠ | `f - f` | "0.0" | "0" | "0.0" |
|  | `5 / 1` | "5" | "5" | "5" |
| ≠ | `tostring(f + f)` | "3.0" | "3" | "3.0" |
| ≠ | `exact(0.1 + 0.2)` | "0.30000000000000004" | "0.3" | "0.30000000000000004" |
|  | `-f` | "-1.5" | "-1.5" | "-1.5" |
|  | `3 * 1.5` | "4.5" | "4.5" | "4.5" |
| ≠ | `tonumber("3.0") + 0` | "3.0" | "3" | "3.0" |
| ≠ | `lower(m)` | ["1","2"] | not computed: it reads a field with several values | ["1","2"] |
| ≠ | `trim(m)` | ["1","2"] | not computed: it reads a field with several values | ["1","2"] |
| ≠ | `replace(m, "1", "x")` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `substr(m, 1, 1)` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `tonumber(m)` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `tostring(m)` | "1 2" | not computed: it reads a field with several values | "1 2" |
| ≠ | `md5(m)` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `abs(m)` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `round(m)` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `if(isnull(m), "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
| ≠ | `if(isnum(m), "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
| ≠ | `coalesce(m, "z")` | ["1","2"] | not computed: it reads a field with several values | ["1","2"] |
| ≠ | `if(like(m, "2"), "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `if(match(m, "2"), "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `if(m IN ("2"), "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `if(in(m, "2"), "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `if(m == "1", "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `if(m != 5, "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
| ≠ | `-m` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `m * 2` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `if(cidrmatch("10.0.0.0/8", m), "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
|  | `mvindex(m, 1)` | "2" | "2" | "2" |
|  | `mvjoin(m, ";")` | "1;2" | "1;2" | "1;2" |
| ≠ | `split(m, ",")` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `nullif(m, "1")` | ["1","2"] | not computed: it reads a field with several values | ["1","2"] |
|  | `max(m)` | "2" | "2" | "2" |
|  | `max(m, 5)` | "5" | "5" | "5" |
| ≠ | `case(m == 1, "one", true(), "other")` | "other" | not computed: it reads a field with several values | "other" |
| ≠ | `if(true(), m, "z")` | ["1","2"] | not computed: it reads a field with several values | ["1","2"] |
| ≠ | `urldecode(m)` | (no value) | not computed: it reads a field with several values | (no value) |
|  | `len(mvjoin(m, ""))` | "2" | "2" | "2" |
| ≠ | `tostring(null())` | "Null" | (no value) | "Null" |
|  | `tostring(true())` | "True" | "True" | "True" |
|  | `tostring(1 > 2)` | "False" | "False" | "False" |
| ≠ | `coalesce(tostring(a), "x")` | "Null" | "x" | "Null" |
| ≠ | `upper(tostring(a))` | "NULL" | (no value) | "NULL" |
| ≠ | `if(NOT (a > 1), "y", "n")` | "y" | "n" | "y" |
| ≠ | `if(NOT a == a, "y", "n")` | "y" | "n" | "y" |
|  | `if(NOT isnull(a), "y", "n")` | "n" | "n" | "n" |
| ≠ | `if(NOT like(a, "%"), "y", "n")` | "y" | "n" | "y" |
| ≠ | `if(NOT match(a, "."), "y", "n")` | "y" | "n" | "y" |
| ≠ | `if(NOT a IN ("1"), "y", "n")` | "y" | "n" | "y" |
| ≠ | `if(NOT (a + 1 > 1), "y", "n")` | "y" | "n" | "y" |
| ≠ | `case(NOT a > 1, "y", true(), "n")` | "y" | "n" | "y" |
| ≠ | `if(NOT a > 1 AND NOT a <= 1, "y", "n")` | "y" | "n" | "y" |
| ≠ | `validate(NOT a > 1, "bad")` | (no value) | "bad" | (no value) |
|  | `if(a != a, "y", "n")` | "n" | "n" | "n" |
|  | `if(a > 1 XOR a < 1, "y", "n")` | "n" | "n" | "n" |
|  | `if(t < 5, "y", "n")` | "n" | "n" | "n" |
| ≠ | `if(t > 5, "y", "n")` | "n" | "y" | "n" |
| ≠ | `if(h < 10, "y", "n")` | "n" | "y" | "n" |
|  | `if(z < 10, "y", "n")` | "y" | "y" | "y" |
| ≠ | `if(s1 + 1 == "6", "y", "n")` | (no value) | "y" | (no value: rejected) |
|  | `if(t == 5, "y", "n")` | "n" | "n" | "n" |
| ≠ | `if(t != 5, "y", "n")` | "n" | "y" | "n" |
| ≠ | `z + "x"` | "007x" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "007x" |
| ≠ | `f + t` | "1.5abc" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "1.5abc" |
| ≠ | `(s1 + 1) + t` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value) |
| ≠ | `t + (s1 + 1)` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value) |
|  | `tostring(s1 + 1) + t` | "6abc" | "6abc" | "6abc" |
| ≠ | `s1 + h` | "50x10" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "50x10" |
|  | `h + h` | "0x100x10" | "0x100x10" | "0x100x10" |
| ≠ | `neg + t` | "-2abc" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "-2abc" |
| ≠ | `s1 + ""` | "5" | not computed: it adds a number to text with +, which Splunk’s docs don’t define | "5" |
| ≠ | `"" + 1` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value: rejected) |
|  | `s1 . 1` | "51" | "51" | "51" |
|  | `s1 - "1"` | (no value) | (no value) | (no value: rejected) |
|  | `s1 * "2"` | (no value) | (no value) | (no value: rejected) |
|  | `(s1 + 1) . t` | "6abc" | "6abc" | "6abc" |
|  | `if(true(), 1, "a") + 1` | "2" | "2" | "2" |
| ≠ | `case(true(), "2") + 1` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value: rejected) |

### Round 3: several values and number formats, in a search (40 probes; Build 225 10, Build 226 40)

Fields: `mv=1 mv=2 w=1.50 f=1.5 s1=5 t=abc c=0.05 g=2.50`, with m = 1, 2 from `rex max_match=0`.

| | Expression | Splunk 10.6.1.1 | Build 225 | Build 226 |
|---|---|---|---|---|
| ≠ | `if(m == "2", "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `if(m == 1, "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
| ≠ | `if(m != "1", "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
| ≠ | `if(m < "3", "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
| ≠ | `if(m == "1", "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `m + "x"` | (no value) | not computed: it reads a field with several values | (no value) |
| ≠ | `if(isstr(m), "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
| ≠ | `mvindex(m, 0) + 1` | (no value) | "2" | (no value: rejected) |
| ≠ | `w * 2` | "3.00" | "3" | "3.00" |
| ≠ | `w * f` | "2.3" | "2.25" | "2.3" |
| ≠ | `1.0 / 3` | "0.33" | "0.333333333333333" | "0.33" |
| ≠ | `c * 3` | "0.2" | "0.15" | "0.2" |
| ≠ | `g - 1` | "1.50" | "1.5" | "1.50" |
| ≠ | `f * f` | "2.3" | "2.25" | "2.3" |
| ≠ | `10.0 / 4` | "2.50" | "2.5" | "2.50" |
|  | `round(2.345, 1)` | "2.3" | "2.3" | "2.3" |
|  | `round(f)` | "2" | "2" | "2" |
| ≠ | `w + f` | "3.0" | "3" | "3.0" |
| ≠ | `f + w` | "3.0" | "3" | "3.0" |
| ≠ | `w / 2` | "0.750" | "0.75" | "0.750" |
| ≠ | `s1 * w` | "7.50" | "7.5" | "7.50" |
| ≠ | `w + 1` | "2.50" | "2.5" | "2.50" |
| ≠ | `1.50 * 2` | "3.00" | "3" | "3.00" |
| ≠ | `1.50 + 1.5` | "3.0" | "3" | "3.0" |
| ≠ | `tostring(w + 0)` | "1.50" | "1.5" | "1.50" |
| ≠ | `(w + 0) . ""` | "1.50" | "1.5" | "1.50" |
| ≠ | `0.0 - 0.0` | "0.0" | "0" | "0.0" |
|  | `123456789.123 + 0.001` | "123456789.124" | "123456789.124" | "123456789.124" |
|  | `exp(0)` | "1" | "1" | "1" |
|  | `ln(1)` | "0" | "0" | "0" |
|  | `log(100)` | "2" | "2" | "2" |
|  | `log(8, 2)` | "3" | "3" | "3" |
| ≠ | `pi()` | "3.14159265358" | "3.14159265358979" | "3.14159265358" |
|  | `max(1.5, 2)` | "2" | "2" | "2" |
| ≠ | `min(w, 3)` | "1.50" | "1.5" | "1.50" |
| ≠ | `abs(w)` | "1.50" | "1.5" | "1.50" |
| ≠ | `tonumber(w)` | "1.50" | "1.5" | "1.50" |
|  | `ceil(w)` | "2" | "2" | "2" |
|  | `7.5 % 2` | "1.5" | "1.5" | "1.5" |
| ≠ | `pow(1.5, 2)` | "2.3" | "2.25" | "2.3" |

### Round 4: true and false as values, two event values compared, several values (32 probes; Build 225 7, Build 226 32)

Fields: `k=1 t=abc s1=5 h=0x10 t2=abc`, with m = 1, 2 and ips = 10.1.1.1, 8.8.8.8 from `MV_ADD` transforms.

| | Expression | Splunk 10.6.1.1 | Build 225 | Build 226 |
|---|---|---|---|---|
| ≠ | `a > 1 AND k == 1` | "0" | (no value) | "0" |
| ≠ | `a > 1 AND k == 2` | "0" | not computed: it gives true or false, which a field can’t hold | "0" |
| ≠ | `a > 1 OR k == 1` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `a > 1 OR k == 2` | "0" | (no value) | "0" |
| ≠ | `NOT a > 1` | "1" | (no value) | "1" |
| ≠ | `a > 1 XOR k == 1` | "1" | (no value) | "1" |
| ≠ | `a > 1 XOR k == 2` | "0" | (no value) | "0" |
| ≠ | `k == 1 AND k == 1` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `if(k == 1, true(), false())` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `isnum(s1)` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `isstr(t)` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `"x" . (k == 1)` | (no value) | not computed: it uses true or false as text | (no value: rejected) |
| ≠ | `(k == 1) + 1` | (no value) | not computed: it adds a number to text with +, which Splunk’s docs don’t define | (no value: rejected) |
| ≠ | `upper(k == 1)` | (no value) | not computed: it uses true or false as text | (no value: rejected) |
| ≠ | `tostring(k == 1 AND a > 1)` | "False" | (no value) | "False" |
| ≠ | `case(k == 1, k == 1)` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `coalesce(a > 1, k == 1)` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
| ≠ | `t == "abc"` | "1" | not computed: it gives true or false, which a field can’t hold | "1" |
|  | `if(t > s1, "y", "n")` | "y" | "y" | "y" |
|  | `if(t < s1, "y", "n")` | "n" | "n" | "n" |
|  | `if(t != s1, "y", "n")` | "y" | "y" | "y" |
|  | `if(t == t2, "y", "n")` | "y" | "y" | "y" |
|  | `if(h < s1, "y", "n")` | "y" | "y" | "y" |
|  | `if(s1 < h, "y", "n")` | "n" | "n" | "n" |
| ≠ | `m == "3"` | "0" | not computed: it reads a field with several values | "0" |
| ≠ | `m == "1"` | "1" | not computed: it reads a field with several values | "1" |
| ≠ | `if(cidrmatch("10.0.0.0/8", ips), "y", "n")` | "n" | not computed: it reads a field with several values | "n" |
|  | `if(cidrmatch("10.0.0.0/8", mvindex(ips, 0)), "y", "n")` | "y" | "y" | "y" |
| ≠ | `like(m, "2")` | "1" | not computed: it reads a field with several values | "1" |
| ≠ | `m IN ("2")` | "1" | not computed: it reads a field with several values | "1" |
| ≠ | `if(m == k, "y", "n")` | "y" | not computed: it reads a field with several values | "y" |
| ≠ | `if(ips == "8.8.8.8", "y", "n")` | "y" | not computed: it reads a field with several values | "y" |

### Round 5: precision through chained operations, in a search (49 probes; Build 225 15, Build 226 49)

Fields: `w=1.50 f=1.5 s1=5 e=1e3 n=-2.50`.

| | Expression | Splunk 10.6.1.1 | Build 225 | Build 226 |
|---|---|---|---|---|
| ≠ | `(w * f) + 0.01` | "2.3" | "2.26" | "2.3" |
| ≠ | `(f + f) * 2` | "6.0" | "6" | "6.0" |
| ≠ | `round(w * f, 3)` | "2.250" | "2.25" | "2.250" |
|  | `exact(w * f)` | "2.25" | "2.25" | "2.25" |
| ≠ | `tostring(w * f)` | "2.3" | "2.25" | "2.3" |
| ≠ | `w * f * 1` | "2.3" | "2.25" | "2.3" |
| ≠ | `w + 0.001` | "1.50" | "1.501" | "1.50" |
| ≠ | `sqrt(2.0)` | "1.4" | "1.4142135623731" | "1.4" |
| ≠ | `sqrt(w)` | "1.22" | "1.22474487139159" | "1.22" |
| ≠ | `exp(1.0)` | "2.7" | "2.71828182845905" | "2.7" |
| ≠ | `ln(2.0)` | "0.69" | "0.693147180559945" | "0.69" |
| ≠ | `log(2.0)` | "0.30" | "0.301029995663981" | "0.30" |
| ≠ | `pow(2, 0.5)` | "1" | "1.4142135623731" | "1" |
|  | `pow(w, 2)` | "2.25" | "2.25" | "2.25" |
| ≠ | `abs(-1.50)` | "1.50" | "1.5" | "1.50" |
|  | `floor(w)` | "1" | "1" | "1" |
|  | `ceil(-1.5)` | "-1" | "-1" | "-1" |
| ≠ | `w - w` | "0.00" | "0" | "0.00" |
| ≠ | `-w` | "-1.50" | "-1.5" | "-1.50" |
| ≠ | `w * -1` | "-1.50" | "-1.5" | "-1.50" |
|  | `2.5 * 4` | "10" | "10" | "10" |
| ≠ | `2.50 * 4` | "10.0" | "10" | "10.0" |
| ≠ | `0.5 * 0.5` | "0.3" | "0.25" | "0.3" |
|  | `1.23456789 * 1` | "1.23456789" | "1.23456789" | "1.23456789" |
| ≠ | `100.0 / 3` | "33.33" | "33.3333333333333" | "33.33" |
|  | `1e2 * 1.5` | "150" | "150" | "150" |
| ≠ | `12.5 % 5` | "2.50" | "2.5" | "2.50" |
| ≠ | `tonumber("1.50") * 2` | "3.00" | "3" | "3.00" |
| ≠ | `tonumber("0x1F", 16)` | "31" | (no value) | "31" |
| ≠ | `round(1.005, 2)` | "1.00" | "1" | "1.00" |
|  | `round(-2.5)` | "-2" | "-2" | "-2" |
|  | `round(2.675, 2)` | "2.68" | "2.68" | "2.68" |
| ≠ | `n + 1` | "-1.50" | "-1.5" | "-1.50" |
|  | `e * f` | "1500" | "1500" | "1500" |
|  | `123456789012345678 + 0` | "123456789012345680" | "123456789012345680" | "123456789012345680" |
| ≠ | `1 / 100000000` | "0.00000001" | "1e-8" | "0.00000001" |
| ≠ | `2 * 1e21` | "2000000000000000000000" | "2e+21" | "2000000000000000000000" |
| ≠ | `10 / 3` | "3.3333333333333335" | "3.33333333333333" | "3.3333333333333335" |
|  | `-7 / 2` | "-3.5" | "-3.5" | "-3.5" |
|  | `7 / 2.0` | "3.5" | "3.5" | "3.5" |
| ≠ | `s1 / w` | "3.33" | "3.33333333333333" | "3.33" |
| ≠ | `min(w, f)` | "1.50" | "1.5" | "1.50" |
|  | `max(f, w)` | "1.5" | "1.5" | "1.5" |
| ≠ | `e + 0.25` | "1000" | "1000.25" | "1000" |
|  | `round(e)` | "1000" | "1000" | "1000" |
| ≠ | `1.50 . ""` | "1.50" | "1.5" | "1.50" |
| ≠ | `1.50` | "1.50" | "1.5" | "1.50" |
| ≠ | `case(true(), 1.50) + 0` | "1.50" | "1.5" | "1.50" |
| ≠ | `if(true(), w, 0) * 2` | "3.00" | "3" | "3.00" |

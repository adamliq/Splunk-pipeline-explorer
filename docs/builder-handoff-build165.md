# Builder handoff: Build 165 review

**Reviewed:** `main` at `c208dc8` (Build 165: `builder-single-pipeline-default-v165`). Checked against [`builder-handoff-single-pipeline-default.md`](builder-handoff-single-pipeline-default.md).
**Next block:** `builder-…-v166`.
**Screenshot:** `docs/mockups/compare/build165-default-1440.png`.

## Single pipeline set by default: done ✅

| Check | Result |
|---|---|
| Fresh default topology | `syslogSource:1 syslog:1 uf:1 idx:1`; bands read "1 PIPELINE SET", no P1/P2 lanes |
| Path topologies (`makeBuilderNodes`) | `syslog-uf-idx`, `multi-ds-uf-idx`, `all`: every node `sets: 1` |
| Imported file with `sets: 2` | stays 2 ✅ |
| Palette-added Heavy Forwarder | 1 ✅ |
| Split/merge validation on the default topology | no warnings ✅ |
| Errors | 0 |

Still at 2, waiting for the owner's decision: Recovery calculator `state.recovery.pipelineSets` and Performance guardrails `state.performanceGuardrails.pipelineSets`.

## Relationship lines on the default topology (not new in 165; same in 164)

While checking, I also noticed a line problem on the default 4-card topology. It isn't new in 165: Build 164 draws exactly the same lines.

- **Detour:** the Universal Forwarder 1 → Indexer 1 line goes up over the cards and back down, even though both ends are at the same height with 124px of clear space between them. The fix for this in 164 worked on the reference topology but not here. The likely cause is an old routing rule that picks a longer route so the "Splunk-to-Splunk" label has room.
- **Small step:** the Syslog Server 1 → Universal Forwarder 1 line steps down 13px, because cards in the same row have different heights and lines attach at each card's middle.

Details and fixes follow.

All four default cards sit in one row (`y = 58`), but the routes are:
```
Syslog Source 1 → Syslog Server 1   M241 141.5 … L365 141.5            straight ✅
Syslog Server 1 → UF 1              … L658.5 141.5 Q663 … L663 155 L685 155   small step (141.5 → 155)
UF 1 → Indexer 1                    M881 155 L903 155 L903 3 … L983 3 L983 155 L1005 155   "hat" above the cards
```

1. **The UF 1 → Indexer 1 hat:** both ends are at y = 155, there are 124px of clear space, and nothing is in the way. Build 164's straight-first rule works on the reference topology but not here. Possibly the old `labelNeed` penalty in `builderV123RouteBetween` (5000 for a span shorter than the label) still wins: "Splunk-to-Splunk" plus its badge is wider than the straight span.
   - **Fix:** never let the label length shape the route. Take the straight segment, and let label placement use its leader, or hide the label with the badge kept on the line.
2. **The 13px step:** ports sit at each card's middle, and the cards in a row have different heights (Syslog Server 1 is shorter than UF 1). The data line therefore steps from y = 141.5 to 155.
   - **Fix:** give cards in a row the same height (canvas handoff item 5), or put data ports on a row axis shared by every card in the row (for example `top + 83`).

**Check:**
- Default topology at 1280, 1440 and 1920: all three data lines are single straight segments (`d` = `M… L…`).
- Reference topology: unchanged from Build 164.

---

## Build 166 recheck (`main` at `ebe9da9`, `builder-default-row-v166`)

- **Detour:** ✅ fixed. Universal Forwarder 1 → Indexer 1 is `M881 170 L1005 170`.
- **Small step:** ✅ fixed. All three default data lines are on y = 170 (`M241 170 L365 170`, `M561 170 L685 170`, `M881 170 L1005 170`): one straight segment each at 1280, 1440 and 1920. Cards in the row now share a height.
- **Reference topology:** unchanged from Build 164. All data lines are straight, management lines enter at ⅔ height, and all 12 badges sit on their lines at Fit.
- **Single pipeline default:** still correct (`syslogSource:1 syslog:1 uf:1 idx:1`).
- **Checks:**
  - Connector tool: all OK.
  - Space: 7/7.
  - Perf: `allOk` (default 31/32, fan5 46/47, fan8 63/62, reference 66/91 ms).
  - Errors: 0.

Screenshot: `build166-default-1440.png`.

**Still open:**
- **Calculators:** the Recovery calculator and Performance guardrails still default to 2 pipeline sets; this waits on the owner's decision.
- **Selection dimming:** not rechecked.

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

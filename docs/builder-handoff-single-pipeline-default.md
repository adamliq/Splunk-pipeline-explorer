# Builder handoff: default to one pipeline set

**For:** an AI agent maintaining `index.html` in `adamliq/Splunk-pipeline-explorer`
**Baseline:** `main` at `0249bad` (Build 164). Next block: `builder-…-v165`.
**Request (owner):** components that support parallel pipeline sets (Universal Forwarder, Heavy Forwarder, Indexer) should start with **1 pipeline set**. Today, Universal Forwarder 1 and Indexer 1 in the default topology show **"2 PIPELINE SETS"** with P1/P2 lanes.

## Where the 2 comes from

`makeBuilderNodes(path)` (about line 893) builds the default topology, and also the topology for a selected Explorer path ("Load selected path", `makeBuilderNodes(state.path)`):

```js
made.push({id, type, parent: …,
  sets: ['uf','hf','idx'].includes(type) && (['uf','idx'].includes(type) && path === 'syslog-uf-idx') ? 2 : 1,
  …})
```

On the default path `syslog-uf-idx`, every Universal Forwarder and Indexer gets `sets: 2`.

Everything else already starts at 1:
- components added from the palette (`sets: 1` in `addBuilderNode` and the auth/management variants);
- the Explorer's global `pipelineSets: {uf: 1, hf: 1, idx: 1}`.

## Change

1. **Default topology:** in a v165 block, wrap `makeBuilderNodes` and set `sets = 1` on every node it returns. Or change the expression above to `sets: 1`. Either way, a fresh Builder and "Load selected path" both start with one set.
2. **Don't touch saved data:** `loadTopologyDocument`, saved topologies, and the recovery draft keep the `sets` value they contain. A topology saved with 2 sets still opens with 2.
3. **Second set stays available:** the Inspector's pipeline-set choice (1 or 2) is unchanged. A user can still switch a Universal Forwarder, Heavy Forwarder or Indexer to 2.
4. **Related defaults** (confirm with the owner before changing; these are calculators, not the Builder):
   - **Recovery calculator:** `recovery: {…, pipelineSets: 2}` (the "1 pipeline set / 2 pipeline sets" select).
   - **Performance guardrails:** `performanceGuardrails: {…, pipelineSets: 2}`.

   If the owner wants "single pipeline everywhere", set both to 1 as well.
5. **Knock-on checks:**
   - The parallel-set validation ("… must split/merge", when a parent and child differ in `sets`) should report nothing on the default topology.
   - Text that says "Two pipeline sets", "P1 + P2" or `parallelIngestionPipelines = 2` (route boxes, failure view, `server.conf` preview, architecture pack notes) must read the single-set wording for the default topology. These already branch on `n.sets === 2`, so they should follow automatically. Confirm on screen.
   - Card bands should read "1 PIPELINE SET", or show no band (match how a palette-added Universal Forwarder looks today).

## Check

- **Fresh load:** Builder default topology: Universal Forwarder 1 and Indexer 1 show one pipeline set (no P1/P2 lanes); `state.builderNodes.every(n => n.sets === 1)` is `true`.
- **Load selected path** for `syslog-uf-idx`: every node has `sets === 1`.
- **Saved data:** import a topology file that has `sets: 2` on a forwarder; it stays 2.
- **Inspector:** switching a forwarder to 2 still shows P1/P2 and the split/merge advisory where relevant.
- **Tools:** connector tool all OK; perf `allOk`; space 7/7; button sweep 0 errors.
- **Change register:** add an entry: "Pipeline-capable components start with one pipeline set."

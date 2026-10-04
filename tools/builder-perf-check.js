// Measures Builder redraw cost as connections grow, and checks it against budgets.
// Usage: node tools/builder-perf-check.js index.html
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path');
const fs = require('fs');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const reference = path.join(__dirname, '..', 'docs', 'mockups', 'ov1-reference-topology.json');
// Budgets from docs/builder-handoff-canvas-performance.md (median of 5 redraws, headless Chromium).
const BUDGET = { default: 40, fan5: 50, fan8: 80, reference: 120 };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
  await page.goto(file);
  await page.click('button[data-view="builder"]');
  await page.waitForTimeout(700);

  const measure = label => page.evaluate(label => {
    let points = 0;
    const g = SVGGeometryElement.prototype.getPointAtLength;
    SVGGeometryElement.prototype.getPointAtLength = function (x) { points++; return g.call(this, x); };
    const times = [];
    // Each timed redraw follows a state change (an inert field on the first node), as a drop, add or
    // edit does. Build 160+ skips a redraw when nothing changed, which would otherwise time as ~0 ms.
    const probe = state.builderNodes[0];
    for (let i = 0; i < 5; i++) { probe.perfProbe = Date.now() + i; const t = performance.now(); renderBuilder(); times.push(performance.now() - t); }
    const changedPoints = points;
    delete probe.perfProbe; renderBuilder();
    const same = []; for (let i = 0; i < 5; i++) { const t = performance.now(); renderBuilder(); same.push(performance.now() - t); }
    same.sort((a, b) => a - b);
    SVGGeometryElement.prototype.getPointAtLength = g;
    times.sort((a, b) => a - b);
    return { label, nodes: state.builderNodes.length, links: builderTraceEdges('all').length,
      redrawMs: Math.round(times[2]), unchangedRedrawMs: Math.round(same[2]), pathPointLookupsPerRedraw: Math.round(changedPoints / 5) };
  }, label);

  const out = [];
  out.push(await measure('default'));
  await page.evaluate(() => { const uf = state.builderNodes.find(n => n.type === 'uf'); addBuilderNode('uf', uf.parent); });
  out.push(await measure('fan5'));
  await page.evaluate(() => {
    const uf = state.builderNodes.find(n => n.type === 'uf');
    addBuilderNode('uf', uf.parent); addBuilderNode('uf', uf.parent); addBuilderNode('ds', null);
    const ds = state.builderNodes.find(n => n.type === 'ds');
    state.builderNodes.filter(n => n.type === 'uf').forEach(n => addManagementRelation(ds.id, n.id));
  });
  out.push(await measure('fan8'));
  if (fs.existsSync(reference)) {
    await page.evaluate(d => loadTopologyDocument(JSON.parse(d)), fs.readFileSync(reference, 'utf8'));
    await page.waitForTimeout(500);
    out.push(await measure('reference'));
  }
  for (const row of out) { row.budgetMs = BUDGET[row.label]; row.ok = row.redrawMs <= row.budgetMs; }
  console.log(JSON.stringify({ results: out, errors, allOk: out.every(r => r.ok) && !errors.length }, null, 1));
  await browser.close();
})();

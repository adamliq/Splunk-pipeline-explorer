// Checks that the page works with no network. The browser is offline, and any request other than the page's own file,
// a data: or a blob: URL is blocked and counted. It draws every view and every OV tab; makes the evidence pack, and the
// Builder's JSON, SVG and PNG exports and architecture pack; and in the Config view reads an app package if one is given
// (else the example), tries all its samples if it has any, and saves the map as an image.
// Usage: node tools/offline-check.js [index.html] [app package (.spl, .tgz, .tar.gz or .zip), or -] [download-dir]
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const file = path.resolve(process.argv[2] || 'index.html');
const pkg = process.argv[3] && process.argv[3] !== '-' ? path.resolve(process.argv[3]) : null;
const out = process.argv[4] ? path.resolve(process.argv[4]) : fs.mkdtempSync(path.join(os.tmpdir(), 'offline-check-'));
fs.mkdirSync(out, { recursive: true });
const VIEWS = ['flow', 'matrix', 'config', 'builder', 'ov', 'operations', 'diagnostic', 'failure', 'changes', 'rules'];
const local = u => /^(file|data|blob|about):/.test(u);
let pass = 0, fail = 0;
const ok = (name, good, seen) => { good ? pass++ : fail++; console.log(`${good ? 'PASS' : 'FAIL'} ${name}${good ? '' : ' ' + String(JSON.stringify(seen) ?? '').slice(0, 800)}`); };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await context.setOffline(true);
  const asked = [], errors = [], files = [];
  await context.route('**/*', r => { const u = r.request().url(); if (local(u)) return r.continue(); asked.push(u); return r.abort('internetdisconnected'); });
  const page = await context.newPage();
  page.on('request', r => { if (!local(r.url())) asked.push(r.url()); });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('download', async d => { const f = path.join(out, d.suggestedFilename()); await d.saveAs(f); files.push([d.suggestedFilename(), fs.statSync(f).size]); });
  const made = async (act, re, wait = 2500) => { const before = files.length; await act(); await page.waitForTimeout(wait); return files.slice(before).filter(([n]) => re.test(n)); };

  await page.goto('file://' + file);
  await page.waitForTimeout(2000);
  ok('the page loads offline', /Splunk Pipeline Explorer · Build \d+/.test(await page.title()), await page.title());

  // Every view, then every OV tab.
  for (const v of VIEWS) {
    await page.evaluate(v => switchView(v), v);
    await page.waitForTimeout(v === 'builder' ? 3000 : 900);
    const text = await page.evaluate(() => document.body.innerText.length);
    ok(`view ${v}: drawn`, text > 500, text);
  }
  await page.evaluate(() => switchView('ov'));
  await page.waitForTimeout(1200);
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.ovTabs135 [data-ov-tab]')].map(t => t.dataset.ovTab));
  // Each tab clicked in the page: since Build 237 a view of another viewpoint is not shown until its viewpoint is chosen.
  for (const t of tabs) { await page.evaluate(t => document.querySelector(`.ovTabs135 [data-ov-tab="${t}"]`).click(), t); await page.waitForTimeout(250); }
  ok(`OV: all ${tabs.length} tabs drawn`, tabs.length > 0, tabs.length);

  // Operations: the evidence pack.
  await page.evaluate(() => switchView('operations'));
  await page.waitForTimeout(800);
  await page.click('[data-operations-view="evidence"]');
  await page.waitForTimeout(800);
  const zip = await made(() => page.click('#downloadEvidencePack'), /\.zip$/i);
  ok('Operations: the evidence pack downloads as a ZIP', zip.length === 1, files);

  // The Config view: the package, or the example; its map; Try all samples, if it has samples; the map as an image.
  await page.evaluate(() => switchView('config'));
  await page.waitForTimeout(600);
  if (pkg) {
    await page.evaluate(async ([b64, name]) => {
      await window.configView205.readFiles([{ file: new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], name), path: name }]);
    }, [fs.readFileSync(pkg).toString('base64'), path.basename(pkg)]);
  } else await page.evaluate(() => window.configView205.loadExample());
  await page.waitForTimeout(1200);
  const cfg = await page.evaluate(() => ({ files: state.configView205.files.length, error: state.configView205.error, types: state.configView205.types,
    where: !!document.querySelector('#configView205 .cfInstall221'), tables: window.configParts228 ? document.querySelectorAll('#configView205 .cfParts228').length : null }));
  ok(`Config: ${pkg ? path.basename(pkg) : 'the example'} is read, with Where it acts${cfg.tables === null ? '' : ' and what each tier gets'}`,
    cfg.files > 0 && cfg.where && cfg.tables !== 0, cfg);
  await page.evaluate(t => { state.configView205.focus = t; render(); }, cfg.types[0]);
  await page.waitForTimeout(800);
  const M = '#configTypeMap217';
  ok(`Config: ${cfg.types[0]}'s map is drawn`, !!await page.$(`${M} [data-save-image]`), cfg.types[0]);
  if (await page.$(`${M} [data-try-open]`) && !await page.$(`${M} .tmTry224`)) { await page.click(`${M} [data-try-open]`); await page.waitForTimeout(400); }
  if (await page.$(`${M} [data-try-all]`)) {
    await page.click(`${M} [data-try-all]`);
    await page.waitForTimeout(2500);
    ok('Config: Try all samples gives its summary', await page.evaluate(() => !!document.querySelector('#configTypeMap217 .tmBatch227')));
  } else console.log('SKIP Config: Try all samples (no samples)');
  const png = await made(() => page.click(`${M} [data-save-image]`), /\.png$/i, 3000);
  ok('Config: the map saves as an image', png.length === 1, files);

  // Last, as the architecture pack leaves its presentation open: the Builder's exports. Their header is hidden while the
  // canvas has the focus, so each button is pressed by script, as a click would.
  await page.evaluate(() => switchView('builder'));
  await page.waitForTimeout(2500);
  for (const [id, re] of [['builderExport', /\.json$/i], ['builderExportSvg', /\.svg$/i], ['builderExportPng', /\.png$/i]]) {
    const got = await made(async () => {
      await page.evaluate(id => document.getElementById(id)?.click(), id);
      await page.waitForTimeout(800);
      // Export JSON first asks for a review when the topology has values to review: Export anyway, as a person would.
      const go = await page.$('#exportProceed');
      if (go && await go.isVisible()) await go.click();
    }, re);
    ok(`Builder: ${id} makes a file`, got.length === 1, files);
  }
  const pack = await made(async () => {
    await page.evaluate(() => document.getElementById('builderExportPack')?.click());
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.getElementById('builderPackDownload')?.click());
  }, /\.html$/i, 6000);
  ok('Builder: the architecture pack downloads', pack.length === 1, files);

  ok('no request left the page', !asked.length, [...new Set(asked)].slice(0, 20));
  ok('no page errors', !errors.length, errors.slice(0, 10));
  console.log('files made, in', out + ':', JSON.stringify(files));
  console.log(`${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

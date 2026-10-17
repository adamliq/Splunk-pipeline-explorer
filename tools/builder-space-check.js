// Measures how much of the screen the Builder canvas gets on desktop sizes.
// Usage: node tools/builder-space-check.js index.html [screenshot-dir]
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const shots = process.argv[3];
// Targets from docs/builder-handoff-canvas-space.md (desktop) and docs/builder-handoff-page-ui.md (tablet / small laptop).
// Desktop sizes: work area at least [width, visible height] with no page scroll.
// Tablet sizes: work area at least [width, visible height] visible on load (page scroll allowed below the canvas).
// The work area is the canvas frame (.builderWorkspace, which has an 8px gutter since Build 184) plus any panel docked
// beside it (docs/builder-handoff-docked-panels.md). With panels docked, the canvas itself must stay at least MIN_DOCKED_CANVAS wide.
const TARGETS = { '1280x800': [1240, 640], '1440x900': [1400, 740], '1920x1080': [1880, 920], '2560x1440': [2520, 1280],
  '1024x768': [984, 420], '1100x800': [1060, 440], '768x1024': [728, 560] };
const TABLET = new Set(['1024x768', '1100x800', '768x1024']);
const MIN_DOCKED_CANVAS = 580;

(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440], [1024, 768], [1100, 800], [768, 1024]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
    await page.goto(file);
    await page.click('button[data-view="builder"]');
    await page.waitForTimeout(700);
    const m = await page.evaluate(() => {
      const c = document.querySelector('.builderCanvas').getBoundingClientRect();
      const frame = (document.querySelector('.builderWorkspace') || document.querySelector('.builderCanvas')).getBoundingClientRect();
      const visibleH = Math.min(c.bottom, innerHeight) - Math.max(c.top, 0);
      // A docked panel is in the page flow (not fixed or absolute), visible, and level with the canvas.
      const docked = [...document.querySelectorAll('.builderPalette, .builderInspector, .dockRail197')].filter(e => {
        const r = e.getBoundingClientRect(), s = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && s.position !== 'fixed' && s.position !== 'absolute' && s.visibility !== 'hidden' && r.top < c.bottom && r.bottom > c.top;
      }).map(e => { const r = e.getBoundingClientRect(); return [e.id || e.className.split(' ')[0], Math.round(r.left), Math.round(r.width)] });
      const left = Math.min(frame.left, ...docked.map(d => d[1])), right = Math.max(frame.right, ...docked.map(d => d[1] + d[2]));
      return {
        canvas: [Math.round(c.left), Math.round(c.top), Math.round(c.width), Math.round(c.height)],
        workArea: [Math.round(left), Math.round(right - left)],
        docked,
        visibleHeight: Math.round(visibleH),
        screenShare: Math.round(100 * c.width * visibleH / (innerWidth * innerHeight)),
        chromeAbove: Math.round(c.top),
        sideGaps: [Math.round(left), Math.round(innerWidth - right)],
        pageScrolls: document.documentElement.scrollHeight > innerHeight + 1,
      };
    });
    const key = `${w}x${h}`, [tw, th] = TARGETS[key], tablet = TABLET.has(key);
    m.meetsTarget = m.workArea[1] >= tw && m.visibleHeight >= th && (tablet || !m.pageScrolls) && (!m.docked.length || m.canvas[2] >= MIN_DOCKED_CANVAS);
    m.target = (tablet ? `${tw}×${th} visible on load` : `${tw}×${th}, no page scroll`) + (m.docked.length ? `, canvas ≥ ${MIN_DOCKED_CANVAS} wide` : '');
    m.errors = errors;
    out[`${w}x${h}`] = m;
    if (shots) await page.screenshot({ path: path.join(shots, `builder-space-${w}.png`) });
    await page.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();

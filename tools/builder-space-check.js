// Measures how much of the screen the Builder canvas gets on desktop sizes.
// Usage: node tools/builder-space-check.js index.html [screenshot-dir]
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html');
const shots = process.argv[3];
// Targets from docs/builder-handoff-canvas-space.md
const TARGETS = { 1280: [1240, 640], 1440: [1400, 740], 1920: [1880, 920], 2560: [2520, 1280] };

(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
    await page.goto(file);
    await page.click('button[data-view="builder"]');
    await page.waitForTimeout(700);
    const m = await page.evaluate(() => {
      const c = document.querySelector('.builderCanvas').getBoundingClientRect();
      const visibleH = Math.min(c.bottom, innerHeight) - Math.max(c.top, 0);
      return {
        canvas: [Math.round(c.left), Math.round(c.top), Math.round(c.width), Math.round(c.height)],
        visibleHeight: Math.round(visibleH),
        screenShare: Math.round(100 * c.width * visibleH / (innerWidth * innerHeight)),
        chromeAbove: Math.round(c.top),
        sideGaps: [Math.round(c.left), Math.round(innerWidth - c.right)],
        pageScrolls: document.documentElement.scrollHeight > innerHeight + 1,
      };
    });
    const [tw, th] = TARGETS[w];
    m.meetsTarget = m.canvas[2] >= tw && m.visibleHeight >= th && !m.pageScrolls;
    m.target = `${tw}×${th}, no page scroll`;
    m.errors = errors;
    out[`${w}x${h}`] = m;
    if (shots) await page.screenshot({ path: path.join(shots, `builder-space-${w}.png`) });
    await page.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();

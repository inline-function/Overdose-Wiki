import { chromium } from '@playwright/test';

const SEED = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: {}, completedScenes: [], choices: {}, unlocks: [], deck: {},
  settings: { scale: 'auto', font: 'normal', motion: 'no-preference', contrast: 'normal', scanlines: true, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true } },
  history: [],
};

const browser = await chromium.launch();

async function openPage(width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript((seed) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(seed));
    sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' }));
    sessionStorage.setItem('odw.test.consent', '1');
  }, SEED);
  await page.goto('http://localhost:5199/#/analysis/dxm');
  await page.waitForTimeout(1000);
  return page;
}

const page = await openPage(1280, 800);
await page.screenshot({ path: 'art/analysis/window-idle.png' });
console.log('window', JSON.stringify(await page.locator('[data-testid="analysis-window"]').boundingBox()));
console.log('stage-window', JSON.stringify(await page.locator('[data-testid="analysis-overlay"]').boundingBox()));

await page.getByTestId('analysis-report-open').click();
await page.waitForTimeout(250);
await page.screenshot({ path: 'art/analysis/window-report.png' });
for (const word of ['头痛', '超我', '让自己好受', '优米']) {
  await page.getByTestId('analysis-report').getByRole('button', { name: word, exact: true }).first().click();
}
await page.screenshot({ path: 'art/analysis/window-report-collected.png' });
await page.getByTestId('analysis-report-close').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'art/analysis/window-board.png' });
await page.getByTestId('analysis-tray').evaluate((el) => { el.scrollTop = el.scrollHeight; });
await page.waitForTimeout(200);
await page.screenshot({ path: 'art/analysis/window-decoys.png' });
await page.getByTestId('analysis-tray').evaluate((el) => { el.scrollTop = 0; });

const from = await page.locator('[data-block="symptom"]').boundingBox();
const to = await page.locator('[data-slot="main-symptom"]').boundingBox();
await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
await page.mouse.down();
await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 10 });
await page.waitForTimeout(150);
await page.screenshot({ path: 'art/analysis/window-drag.png' });
await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(300);
await page.screenshot({ path: 'art/analysis/window-dropped.png' });

await page.locator('[data-block="cause"]').click();
await page.locator('[data-slot="main-cause"]').click();
await page.locator('[data-block="cognition"]').click();
await page.locator('[data-slot="main-cognition"]').click();
await page.locator('[data-block="benefit"]').click();
await page.locator('[data-slot="branch-benefit"]').click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'art/analysis/window-sealed.png' });
await page.close();

const small = await openPage(960, 540);
await small.getByTestId('analysis-report-open').click();
for (const word of ['头痛', '超我', '让自己好受', '优米']) {
  await small.getByTestId('analysis-report').getByRole('button', { name: word, exact: true }).first().click();
}
await small.getByTestId('analysis-report-close').click();
await small.waitForTimeout(450);
await small.screenshot({ path: 'art/analysis/window-960x540.png' });
console.log('small', JSON.stringify(await small.locator('[data-testid="analysis-window"]').boundingBox()), JSON.stringify(await small.locator('[data-testid="analysis-overlay"]').boundingBox()));
await small.close();
await browser.close();

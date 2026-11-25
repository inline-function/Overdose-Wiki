const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' }));
    sessionStorage.setItem('odw.test.consent', '1');
  }, SAVE);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:4173/#/dlc', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const openingVisible = await page.locator('[data-testid="chapter-opening"]').count();
  await page.screenshot({ path: 'art/dlc_opening_960.png' });
  console.log('opening present on first entry:', openingVisible > 0);
  // 跳过
  await page.getByRole('button', { name: '跳过' }).click();
  await page.waitForTimeout(400);
  const afterSkip = await page.locator('[data-testid="chapter-opening"]').count();
  console.log('opening gone after skip:', afterSkip === 0);
  const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('odw.dlc.v1') || '{}').seenIntro);
  console.log('seenIntro persisted:', seen === true);
  // 重进不再播
  await page.goto('http://127.0.0.1:4173/#/dlc/battle', { waitUntil: 'networkidle' });
  await page.goto('http://127.0.0.1:4173/#/dlc', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const again = await page.locator('[data-testid="chapter-opening"]').count();
  console.log('opening NOT replayed on re-entry:', again === 0);
  console.log('ERRORS:', errs.length ? errs.join('|') : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '74', segmentId: 'dlc.s01', sceneId: 'dlc.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: ['dlc'], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const errs = [];
  await ctx.addInitScript((s) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, SAVE);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:4173/#/report/74/replay/dlc.s01', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  // 跳过可能的开场
  const skip = page.getByRole('button', { name: '跳过' });
  if (await skip.count()) { await skip.click(); await page.waitForTimeout(600); }
  const bust = await page.locator('[data-mood]').count();
  console.log('bust present:', bust > 0, 'mood:', await page.locator('[data-mood]').first().getAttribute('data-mood').catch(() => 'n/a'));
  await page.screenshot({ path: 'art/dlc6_story_bust.png' });
  console.log('ERRORS:', errs.length ? errs.join('|') : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

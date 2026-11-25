const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const errs = [];
  await ctx.addInitScript((save) => { localStorage.setItem('odw.save.v1', JSON.stringify(save)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, SAVE);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  const base = 'http://127.0.0.1:4173';
  await page.goto(base + '/#/dlc/battle', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'art/dlc2_battle_960.png' });
  // 拖拽：按住第一张牌移到敌人
  const card = page.locator('[data-testid="dlc-card"]').first();
  const cb = await card.boundingBox();
  const enemy = await page.locator('[data-testid="dlc-enemy"]').boundingBox();
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
  await page.mouse.down();
  await page.mouse.move(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, { steps: 8 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'art/dlc2_drag_960.png' });
  await page.mouse.up();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'art/dlc2_feedback_960.png' });
  console.log('battle/drag/feedback shot');
  // 抽卡
  await page.goto(base + '/#/dlc/shop', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: '抽卡', exact: true }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /抽一次/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'art/dlc2_gacha_960.png' });
  console.log('gacha shot');
  // 430
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto(base + '/#/dlc/battle', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'art/dlc2_battle_430.png' });
  console.log('430 shot; ERRORS:', errs.length ? errs.join('|') : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

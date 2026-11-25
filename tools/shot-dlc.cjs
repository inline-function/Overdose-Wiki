const { chromium } = require('@playwright/test');
const SAVE = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [],
  deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [],
  readEffects: [], seenIntros: [], analysis: [], completedMinigames: [],
  settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' },
  history: [],
};
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript((seed) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(seed));
    sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' }));
    sessionStorage.setItem('odw.test.consent', '1');
  }, SAVE);
  const page = await ctx.newPage();
  const base = 'http://127.0.0.1:4173';
  async function shot(path, url, wait = 900) {
    await page.goto(base + '/#' + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait);
    await page.screenshot({ path });
    console.log('shot', path);
  }
  await shot('art/dlc_battle_960.png', '/dlc/battle');
  // 选中一张牌
  const card = page.locator('[data-testid="dlc-card"]').first();
  await card.click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'art/dlc_battle_selected_960.png' });
  console.log('shot selected');
  // 出牌到敌人，抓反馈
  await page.locator('[data-testid="dlc-enemy"]').click();
  await page.waitForTimeout(180);
  await page.screenshot({ path: 'art/dlc_battle_feedback_960.png' });
  console.log('shot feedback');
  await shot('art/dlc_campaign_960.png', '/dlc');
  await shot('art/dlc_shop_960.png', '/dlc/shop');
  // 竖屏 430
  await page.setViewportSize({ width: 430, height: 900 });
  await shot('art/dlc_battle_430.png', '/dlc/battle');
  await shot('art/dlc_campaign_430.png', '/dlc');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

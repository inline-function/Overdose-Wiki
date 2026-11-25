const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
const DLC = { version: 1, gacha: { pity2: 0, pity1: 0, pityN: 0, guaranteed: false }, upgrades: { phys: 0, mental: 0, ap: 0, apCap: 0, draw: 0 }, stage: 4, completed: ['dlc-1','dlc-2','dlc-3'], deck: ['sertraline','sertraline','fluoxetine','fluoxetine','escitalopram','escitalopram','diazepam','zopiclone','pregabalin','magnesium','caffeine','vitamin_b6'], collection: {}, currency: 500, seenIntro: true, battleWins: ['dlc-b1','dlc-b2','dlc-b3'] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(([s, d]) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); localStorage.setItem('odw.dlc.v1', JSON.stringify(d)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, [SAVE, DLC]);
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4173/#/dlc/shop', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: '抽卡', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'art/dlc12_gacha_fill.png' });
  await page.goto('http://127.0.0.1:4173/#/dlc/story/interlude-4', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  for (let i=0;i<3;i++){ await page.locator('[data-testid="dlc-story"]').click(); await page.waitForTimeout(200); }
  await page.screenshot({ path: 'art/dlc12_story4.png' });
  console.log('done');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

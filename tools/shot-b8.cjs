const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
const DLC = { version: 1, stage: 8, completed: ['dlc-1','dlc-2','dlc-3','dlc-4','dlc-5','dlc-6','dlc-7'], deck: ['sertraline','sertraline','fluoxetine','fluoxetine','escitalopram','escitalopram','diazepam','zopiclone','pregabalin','magnesium','caffeine','vitamin_b6'], collection: {}, currency: 30, seenIntro: true, battleWins: ['dlc-b1','dlc-b2','dlc-b3','dlc-b4','dlc-b5','dlc-b6','dlc-b7'] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(([s, d]) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); localStorage.setItem('odw.dlc.v1', JSON.stringify(d)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, [SAVE, DLC]);
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4173/#/dlc/battle?stage=8', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  console.log('b8 enemy:', await page.locator('[data-testid="dlc-enemy"] img').getAttribute('alt'));
  await page.screenshot({ path: 'art/dlc5_b8_battle.png' });
  await page.goto('http://127.0.0.1:4173/#/dlc', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'art/dlc5_campaign.png' });
  console.log('shots done');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

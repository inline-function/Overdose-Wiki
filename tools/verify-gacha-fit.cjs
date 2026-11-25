const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
const DLC = { version: 1, gacha: { pity2: 0, pity1: 0, pityN: 0, guaranteed: false }, upgrades: { phys: 0, mental: 0, ap: 0, apCap: 0, draw: 0 }, stage: 1, completed: [], deck: ['sertraline','sertraline','fluoxetine','fluoxetine','escitalopram','escitalopram','diazepam','zopiclone','pregabalin','magnesium','caffeine','vitamin_b6'], collection: {}, currency: 500, seenIntro: true, battleWins: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const [w, h, name] of [[960, 540, '960'], [800, 400, '800x400']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(([s, d]) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); localStorage.setItem('odw.dlc.v1', JSON.stringify(d)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, [SAVE, DLC]);
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:4173/#/dlc/shop', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: '抽卡', exact: true }).click();
    await page.waitForTimeout(400);
    const ten = page.getByRole('button', { name: /十连抽/ });
    const box = await ten.boundingBox();
    console.log(name, 'ten-pull button y:', box ? Math.round(box.y) : 'null', 'viewport h:', h, 'visible:', box ? box.y + box.height <= h : false);
    await page.screenshot({ path: `art/dlc11_gacha_${name}.png` });
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

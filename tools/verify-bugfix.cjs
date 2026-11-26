const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
const DLC = { version: 1, endlessBest: 0, gacha: { pity2: 0, pity1: 0, pityN: 0, guaranteed: false }, upgrades: { phys: 0, mental: 0, ap: 0, apCap: 0, draw: 0 }, stage: 1, completed: [], deck: ['sertraline','sertraline','fluoxetine','fluoxetine','escitalopram','escitalopram','diazepam','zopiclone','pregabalin','magnesium','caffeine','vitamin_b6'], collection: { sertraline: 2, esketamine: 2, fentanyl: 2, morphine: 1, diazepam: 1, caffeine: 1 }, currency: 300, seenIntro: true, battleWins: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(([s, d]) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); localStorage.setItem('odw.dlc.v1', JSON.stringify(d)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, [SAVE, DLC]);
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4173/#/dlc/shop', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: '牌组', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'art/dlc17_deck_ux.png' });
  // long-press first card -> detail overlay
  const card = page.locator('[class*=collectionItem] button').first();
  const bb = await card.boundingBox();
  await page.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2); await page.mouse.down(); await page.waitForTimeout(500); await page.mouse.up();
  await page.waitForTimeout(300);
  const ov1 = await page.locator('[class*=overlayFixed]').boundingBox();
  // scroll the shopBody
  await page.evaluate(() => { const el = document.querySelector('[class*=shopBody]'); if (el) el.scrollTop = 200; });
  await page.waitForTimeout(300);
  const ov2 = await page.locator('[class*=overlayFixed]').boundingBox();
  console.log('overlay fixed (y unchanged):', ov1 && ov2 && Math.abs(ov1.y-ov2.y)<1, 'y:', ov1?.y, ov2?.y);
  await page.screenshot({ path: 'art/dlc17_detail_fixed.png' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
const DLC = { version: 1, endlessBest: 0, gacha: { pity2: 0, pity1: 0, pityN: 0, guaranteed: false }, upgrades: { phys: 0, mental: 0, ap: 0, apCap: 0, draw: 0 }, stage: 1, completed: [], deck: ['sertraline','sertraline','fluoxetine','fluoxetine','escitalopram','escitalopram','diazepam','zopiclone','pregabalin','magnesium','caffeine','vitamin_b6'], collection: { sertraline: 2, esketamine: 2, fentanyl: 2 }, currency: 300, seenIntro: true, battleWins: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(([s, d]) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); localStorage.setItem('odw.dlc.v1', JSON.stringify(d)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, [SAVE, DLC]);
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4173/#/dlc/shop', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: '牌组', exact: true }).click();
  await page.waitForTimeout(400);
  // find esketamine collection item
  const items = page.locator('[class*=collectionItem]');
  const n = await items.count();
  let eskIdx = -1;
  for (let i=0;i<n;i++){ const t = await items.nth(i).textContent(); if (t.includes('艾司氯胺酮')) eskIdx=i; }
  console.log('esketamine item idx:', eskIdx, 'total items:', n);
  const item = items.nth(eskIdx);
  const plus = item.getByRole('button', { name: '+', exact: true });
  const minus = item.getByRole('button', { name: '−', exact: true });
  console.log('esketamine + disabled (deck full):', await plus.isDisabled(), '| − disabled:', await minus.isDisabled());
  console.log('item text:', (await item.textContent()).slice(0,60));
  // remove a sertraline to make room
  const ser = items.nth(0);
  await ser.getByRole('button', { name: '−', exact: true }).click();
  await page.waitForTimeout(300);
  console.log('after − sertraline, esketamine + disabled:', await plus.isDisabled());
  await plus.click();
  await page.waitForTimeout(300);
  console.log('after + esketamine, item text:', (await item.textContent()).slice(0,60));
  const deck = await page.evaluate(() => JSON.parse(localStorage.getItem('odw.dlc.v1')).deck);
  console.log('deck has esketamine:', deck.includes('esketamine'), 'deck len:', deck.length);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

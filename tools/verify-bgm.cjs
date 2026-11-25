const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 60, sfx: 0, mute: false }, lang: 'zh' }, history: [] };
const DLC = { version: 1, stage: 3, completed: ['dlc-1','dlc-2'], deck: ['sertraline','sertraline','fluoxetine','fluoxetine','escitalopram','escitalopram','diazepam','zopiclone','pregabalin','magnesium','caffeine','vitamin_b6'], collection: {}, currency: 30, seenIntro: true, battleWins: ['dlc-b1','dlc-b2'] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctx.addInitScript(([save, dlc]) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    localStorage.setItem('odw.dlc.v1', JSON.stringify(dlc));
    sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' }));
    sessionStorage.setItem('odw.test.consent', '1');
    window.__bgm = [];
    const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true,
      get() { return desc.get.call(this); },
      set(v) { if (String(v).includes('.mp3')) window.__bgm.push(String(v).split('/').pop()); return desc.set.call(this, v); },
    });
  }, [SAVE, DLC]);
  const page = await ctx.newPage();
  const base = 'http://127.0.0.1:4173';
  async function bgmAt(url) {
    await page.goto(base + '/#' + url, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const list = await page.evaluate(() => window.__bgm.slice());
    await page.evaluate(() => { window.__bgm.length = 0; });
    return list;
  }
  console.log('campaign:', JSON.stringify(await bgmAt('/dlc')));
  console.log('shop:', JSON.stringify(await bgmAt('/dlc/shop')));
  console.log('battle(b3):', JSON.stringify(await bgmAt('/dlc/battle')));
  console.log('ending:', JSON.stringify(await bgmAt('/dlc/ending')));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

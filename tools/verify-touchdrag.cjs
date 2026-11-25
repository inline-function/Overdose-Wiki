const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript((save) => { localStorage.setItem('odw.save.v1', JSON.stringify(save)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, SAVE);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:4173/#/dlc/battle', { waitUntil: 'load' });
  await page.waitForTimeout(900);
  const before = await page.locator('[data-testid="dlc-card"]').count();
  const ta = await page.locator('[data-testid="dlc-card"]').first().evaluate(el => getComputedStyle(el).touchAction);
  // 用触摸指针事件模拟拖拽到敌人
  const result = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="dlc-card"]');
    const enemy = document.querySelector('[data-testid="dlc-enemy"]');
    const cb = card.getBoundingClientRect(); const eb = enemy.getBoundingClientRect();
    const x0 = cb.x + cb.width / 2, y0 = cb.y + cb.height / 2;
    const x1 = eb.x + eb.width / 2, y1 = eb.y + eb.height / 2;
    const opts = (x, y, type) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, buttons: 1 });
    card.dispatchEvent(opts(x0, y0, 'pointerdown'));
    for (let i = 1; i <= 6; i++) card.dispatchEvent(opts(x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6, 'pointermove'));
    const ghost = !!document.querySelector('[class*="dragGhost"]');
    card.dispatchEvent(opts(x1, y1, 'pointerup'));
    return { ghost };
  });
  await page.waitForTimeout(400);
  const after = await page.locator('[data-testid="dlc-card"]').count();
  const ghostAfter = await page.evaluate(() => !!document.querySelector('[class*="dragGhost"]'));
  console.log('touch-action:', ta, '| ghost during drag:', result.ghost, '| cards before/after:', before, after, '| ghost stuck after:', ghostAfter, '| ERRORS:', errs.length ? errs.join('|') : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

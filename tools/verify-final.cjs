const { chromium } = require('@playwright/test');
const SAVE = { version: 1, consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' }, progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' }, read: {}, completedScenes: ['ch01.s14'], choices: {}, unlocks: [], deck: {}, ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [], readEffects: [], seenIntros: [], analysis: [], completedMinigames: [], settings: { scale: 'auto', font: 'normal', motion: 'auto', contrast: 'normal', scanlines: false, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true }, lang: 'zh' }, history: [] };
const mkDlc = (seen) => ({ version: 1, endlessBest: 0, gacha: { pity2: 0, pity1: 0, pityN: 0, guaranteed: false }, upgrades: { phys: 0, mental: 0, ap: 0, apCap: 0, draw: 0 }, stage: 8, completed: ['dlc-1','dlc-2','dlc-3','dlc-4','dlc-5','dlc-6','dlc-7','dlc-8'], deck: ['sertraline','sertraline','fluoxetine','fluoxetine','escitalopram','escitalopram','diazepam','zopiclone','pregabalin','magnesium','caffeine','vitamin_b6'], collection: {}, currency: 300, seenIntro: seen, battleWins: ['dlc-b1','dlc-b2','dlc-b3','dlc-b4','dlc-b5','dlc-b6','dlc-b7','dlc-b8'] });
(async () => {
  const browser = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  // A: opening plays on first entry
  const ctxA = await browser.newContext({ viewport: { width: 960, height: 540 } });
  await ctxA.addInitScript(([s, d]) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); localStorage.setItem('odw.dlc.v1', JSON.stringify(d)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, [SAVE, mkDlc(false)]);
  const pa = await ctxA.newPage();
  await pa.goto('http://127.0.0.1:4173/#/dlc', { waitUntil: 'load' });
  await pa.waitForTimeout(1500);
  const opening = await pa.locator('[data-testid="chapter-opening"]').count();
  console.log('opening plays on first entry:', opening > 0);
  await pa.screenshot({ path: 'art/dlc15_opening.png' });
  await ctxA.close();
  // B: cover motion + smoke
  const ctxB = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const errs = []; const bad = [];
  await ctxB.addInitScript(([s, d]) => { localStorage.setItem('odw.save.v1', JSON.stringify(s)); localStorage.setItem('odw.dlc.v1', JSON.stringify(d)); sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' })); sessionStorage.setItem('odw.test.consent', '1'); }, [SAVE, mkDlc(true)]);
  const pb = await ctxB.newPage();
  pb.on('pageerror', (e) => errs.push('PAGE: ' + e.message));
  pb.on('console', (m) => { if (m.type() === 'error') errs.push('CON: ' + m.text().slice(0, 100)); });
  pb.on('response', (r) => { if (r.status() >= 400 && /\.(png|mp3|woff2)/.test(r.url())) bad.push(r.status() + ' ' + r.url().split('/').pop()); });
  await pb.goto('http://127.0.0.1:4173/#/dlc/cover', { waitUntil: 'load' });
  await pb.waitForTimeout(1200);
  await pb.screenshot({ path: 'art/dlc15_cover_motion.png' });
  for (const rt of ['/', '/dlc', '/dlc/story/interlude-3', '/dlc/story/tail', '/dlc/battle?stage=3', '/dlc/battle?stage=8', '/dlc/endless', '/dlc/shop', '/dlc/ending']) { await pb.goto('http://127.0.0.1:4173/#' + rt, { waitUntil: 'load' }); await pb.waitForTimeout(500); }
  await pb.goto('http://127.0.0.1:4173/#/dlc/shop', { waitUntil: 'load' }); await pb.waitForTimeout(400);
  for (const t of ['牌组', '抽卡', '强化']) { await pb.getByRole('button', { name: t, exact: true }).click(); await pb.waitForTimeout(250); }
  console.log('SMOKE ERRORS:', errs.length ? errs.join(' | ') : 'none');
  console.log('BAD ASSETS:', bad.length ? bad.join(' | ') : 'none');
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });

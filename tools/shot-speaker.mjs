import { chromium } from '@playwright/test';

const url = process.argv[2];
const out = process.argv[3];
const target = process.argv[4];
const save = {
  version: 1,
  consent: { version: 1, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0 }, read: {}, completedScenes: ['ch01.s09', 'ch02.s09'], choices: {},
  unlocks: [], deck: {},
  settings: { scale: 'auto', font: 'normal', motion: 'reduce', contrast: 'normal', scanlines: false, spoilers: true, audio: { bgm: 0, sfx: 0, mute: true } },
  history: [],
};
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
await page.addInitScript((value) => localStorage.setItem('odw.save.v1', JSON.stringify(value)), save);
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
for (let i = 0; i < 40; i += 1) {
  const name = await page.locator('span[class*="nameplate"]').first().innerText().catch(() => '');
  if (name.includes(target)) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: out });
    console.log('found', name.trim(), 'after', i);
    await browser.close();
    process.exit(0);
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(140);
}
console.log('not found');
await page.screenshot({ path: out });
await browser.close();

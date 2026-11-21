import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'art/chapters';
mkdirSync(OUT, { recursive: true });

const SEED = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: { 100: ['done'], 101: ['done'], 102: ['done'], 103: ['done'], 104: ['done'], 105: ['done'], 106: ['done'], 107: ['done'] },
  completedScenes: ['ch01.s14', 'ch02.s24', 'ch03.s24'],
  choices: {}, unlocks: [], deck: {},
  ownedCards: {}, boxes: 30, claimedDocs: [], claimedQuests: [],
  readEffects: ['解离', '反解离', '谵妄', '恢复术'], seenIntros: [], analysis: [],
  settings: { scale: 'auto', font: 'normal', motion: 'no-preference', contrast: 'normal', scanlines: true, spoilers: false, audio: { bgm: 0, sfx: 0, mute: true } },
  history: [],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await page.addInitScript((seed) => {
  localStorage.setItem('odw.save.v1', JSON.stringify(seed));
  sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' }));
  sessionStorage.setItem('odw.test.consent', '1');
}, SEED);

const shots = [
  ['ch01-s04-glow', '7', 'ch01.s04'],
  ['ch02-s20-gloom', '49', 'ch02.s20'],
  ['ch03-s01-solitude', '50', 'ch03.s01'],
  ['ch03-s24-empty', '50', 'ch03.s24'],
  ['ch04-s05-rage', '51', 'ch04.s05'],
  ['ch04-s40-end', '51', 'ch04.s40'],
];

for (const [name, report, scene] of shots) {
  await page.goto('http://localhost:5199/#/report/' + report + '/replay/' + scene);
  await page.waitForTimeout(900);
  const line = page.getByTestId('dialog-line');
  await line.waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/' + name + '.png' });
  console.log(name, (await line.textContent()).slice(0, 30));
}

await browser.close();

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('play-shots', 'minigames-mobile');
await mkdir(OUT, { recursive: true });

const SAVE = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: {},
  completedScenes: [],
  choices: {},
  unlocks: [],
  deck: {},
  completedMinigames: [],
  settings: {
    scale: 'auto',
    font: 'normal',
    motion: 'auto',
    contrast: 'normal',
    scanlines: true,
    spoilers: false,
    audio: { bgm: 0, sfx: 0, mute: true },
  },
  history: [],
};

const targets = [
  ['ch01.s04', 'afterglow'],
  ['ch01.s05', 'find-object'],
  ['ch01.s06', 'perception'],
  ['ch01.s07', 'forum-fix'],
  ['ch01.s09', 'chat-triage'],
  ['ch01.s10', 'wiki-sort'],
  ['ch01.s12', 'trip-timeline'],
];

const browser = await chromium.launch({ headless: true });
for (const [width, height, label] of [
  [390, 844, '390x844'],
  [844, 390, '844x390'],
]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  await page.addInitScript((seed) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(seed));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' }),
    );
    sessionStorage.setItem('odw.test.consent', '1');
  }, SAVE);
  for (const [sceneId, kind] of targets) {
    await page.goto(`http://127.0.0.1:4173/#/report/7/replay/${sceneId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    for (let i = 0; i < 8; i += 1) {
      if (await page.getByTestId('minigame-overlay').isVisible().catch(() => false)) break;
      await page.getByTestId('scene-wrap').click({ timeout: 1200 }).catch(() => {});
      await page.waitForTimeout(180);
    }
    if (!(await page.getByTestId('minigame-overlay').isVisible().catch(() => false))) {
      console.log(label, kind, 'MISSING');
      continue;
    }
    const audit = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="minigame-stage"]');
      const done = document.querySelector('[data-testid="minigame-done"]');
      const footer = stage?.querySelector('footer');
      const r = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom };
      };
      const sr = r(stage);
      const dr = r(done);
      const fr = r(footer);
      const outside = (b) =>
        !!b && (b.x < -0.5 || b.y < -0.5 || b.right > innerWidth + 0.5 || b.bottom > innerHeight + 0.5);
      return {
        viewport: { w: innerWidth, h: innerHeight },
        stage: sr,
        footer: fr,
        done: dr,
        stageOutside: outside(sr),
        doneOutside: outside(dr),
        footerOutside: outside(fr),
        doneClipped:
          !!sr && !!dr && (dr.right > sr.right + 0.5 || dr.bottom > sr.bottom + 0.5 || dr.x < sr.x - 0.5),
        bodyOverflowX: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    console.log(label, kind, JSON.stringify(audit));
    await page.screenshot({ path: path.join(OUT, `${kind}-${label}.png`), animations: 'disabled' });
  }
  await page.close();
}
await browser.close();
console.log('mobile screenshots:', OUT);

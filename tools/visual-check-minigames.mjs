import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('play-shots', 'minigames');
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
for (const [width, height] of [
  [960, 540],
  [1440, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' });
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
    await page.waitForTimeout(300);
    const overlay = page.getByTestId('minigame-overlay');
    for (let i = 0; i < 8 && !(await overlay.isVisible().catch(() => false)); i += 1) {
      const wrap = page.getByTestId('scene-wrap');
      if (await wrap.isVisible().catch(() => false)) await wrap.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(180);
    }
    const visible = await overlay.isVisible().catch(() => false);
    console.log(`${width}x${height}`, sceneId, kind, visible ? 'OPEN' : 'MISSING');
    if (!visible) continue;
    await page.waitForTimeout(250);
    const audit = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="minigame-stage"]');
      const overlay = document.querySelector('[data-testid="minigame-overlay"]');
      const titleBar = stage?.querySelector('header');
      const game = stage?.querySelector('[class*="game"]');
      const footer = stage?.querySelector('footer');
      const done = stage?.querySelector('[data-testid="minigame-done"]');
      const caption = stage?.querySelector('[data-testid="minigame-caption"]');
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
      };
      const stageBox = rect(stage);
      const boxes = {
        overlay: rect(overlay),
        stage: stageBox,
        titleBar: rect(titleBar),
        game: rect(game),
        footer: rect(footer),
        done: rect(done),
        caption: rect(caption),
      };
      const outside = (box) =>
        !!box &&
        (box.x < -0.5 || box.y < -0.5 || box.right > innerWidth + 0.5 || box.bottom > innerHeight + 0.5);
      const overlap = (a, b) =>
        !!a && !!b && a.x < b.right - 0.5 && a.right > b.x + 0.5 && a.y < b.bottom - 0.5 && a.bottom > b.y + 0.5;
      const overflow = [...document.querySelectorAll('[data-testid="minigame-stage"] *')]
        .filter((el) => !['SPAN', 'BUTTON'].includes(el.tagName))
        .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        .filter((el) => {
          const style = getComputedStyle(el);
          return !['auto', 'scroll'].includes(style.overflowX) && !['auto', 'scroll'].includes(style.overflowY);
        })
        .slice(0, 6)
        .map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 70) }));
      return {
        viewport: { w: innerWidth, h: innerHeight },
        boxes,
        stageOutside: outside(stageBox),
        doneOutside: outside(boxes.done),
        titleBodyOverlap: overlap(boxes.titleBar, boxes.game),
        gameFooterOverlap: overlap(boxes.game, boxes.footer),
        doneCaptionOverlap: overlap(boxes.done, boxes.caption),
        doneClipped: !!stageBox && !!boxes.done && (boxes.done.right > stageBox.right + 0.5 || boxes.done.bottom > stageBox.bottom + 0.5),
        bodyOverflowX: document.documentElement.scrollWidth > innerWidth + 1,
        overflow,
      };
    });
    console.log(JSON.stringify(audit));
    await page.screenshot({ path: path.join(OUT, `${kind}-${width}.png`), animations: 'disabled' });
  }
  await page.close();
}
await browser.close();
console.log('screenshots:', OUT);

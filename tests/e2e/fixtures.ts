import { test as base, expect } from '@playwright/test';

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
    audio: { bgm: 60, sfx: 70, mute: false },
  },
  history: [],
};

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((seed) => {
      const raw = localStorage.getItem('odw.save.v1');
      const current = raw ? JSON.parse(raw) : seed;
      current.consent = { version: seed.consent.version, acceptedAt: seed.consent.acceptedAt };
      localStorage.setItem('odw.save.v1', JSON.stringify(current));
      sessionStorage.setItem(
        'odw.session.v1',
        JSON.stringify({
          booted: true,
          loggedIn: true,
          loginAt: '2026-11-17T00:00:00.000Z',
        }),
      );
      sessionStorage.setItem('odw.test.consent', '1');
    }, SAVE);
    await use(page);
  },
});

export { expect };
import { expect, test } from '@playwright/test';

test.skip(({ browserName }) => browserName !== 'chromium', 'gate baselines are chromium-only');


const SAVE = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: {},
  completedScenes: [],
  choices: {},
  unlocks: [],
  deck: {},
  settings: {
    scale: 'auto',
    font: 'normal',
    motion: 'auto',
    contrast: 'normal',
    scanlines: false,
    spoilers: true,
    audio: { bgm: 0, sfx: 0, mute: true },
  },
  history: [],
};

test('welcome 960', async ({ page }) => {
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  }, SAVE);
  await page.goto('/#/welcome');
  await expect(page.getByTestId('boot')).toHaveAttribute('data-reduce', 'true');
  await expect(page.getByTestId('stage')).toHaveScreenshot('welcome-960.png', {
    animations: 'disabled',
  });
});

test('login 960', async ({ page }) => {
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: false }),
    );
  }, SAVE);
  await page.goto('/#/login');
  await expect(page.getByTestId('login')).toBeVisible();
  await expect(page.getByTestId('stage')).toHaveScreenshot('login-960.png', {
    animations: 'disabled',
  });
});
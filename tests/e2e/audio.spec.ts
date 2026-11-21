import { expect, test } from './fixtures';

const SAVE = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: { 108: ['report-108-full'] },
  completedScenes: ['ch01.s14', 'ch02.s24'],
  readEffects: ['解离', '反解离', '幻觉', '谵妄', '镇静'],
  choices: {},
  unlocks: [],
  deck: {},
  settings: {
    scale: 'auto',
    font: 'normal',
    motion: 'reduce',
    contrast: 'normal',
    scanlines: false,
    spoilers: true,
    audio: { bgm: 60, sfx: 70, mute: false },
  },
  history: [],
};

test('home requests the title cue after unlock', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'headless WebKit blocks media playback');
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/audio/bgm/')) requests.push(request.url().split('/').pop() ?? '');
  });
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: true }),
    );
  }, SAVE);
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Overdose Wiki' })).toBeVisible();
  await page.mouse.click(470, 8);
  await expect.poll(() => requests.includes('title.mp3'), { timeout: 5000 }).toBe(true);
});

test('replay requests the scene cue', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'headless WebKit blocks media playback');
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/audio/bgm/')) requests.push(request.url().split('/').pop() ?? '');
  });
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: true }),
    );
  }, SAVE);
  await page.goto('/#/report/7/replay/ch01.s04');
  await expect(page.getByRole('heading', { name: '复演 · 余晖' })).toBeVisible();
  await page.mouse.click(470, 8);
  await expect.poll(() => requests.includes('afterglow.mp3'), { timeout: 5000 }).toBe(true);
});
test('settings shows the music attribution', async ({ page }) => {
  await page.goto('/#/settings');
  await expect(page.getByText('音乐由[乌鸦Producer]提供')).toBeVisible();
});

test('mute fades the cue out and unmute restores it', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'headless WebKit blocks media playback');
  await page.addInitScript(() => {
    const Native = window.Audio;
    const store = window as unknown as { __bgm: HTMLAudioElement[] };
    store.__bgm = [];
    const Shim = function (src?: string) {
      const element = new Native(src);
      store.__bgm.push(element);
      return element;
    };
    window.Audio = Shim as unknown as typeof Audio;
  });
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Overdose Wiki' })).toBeVisible();
  await page.mouse.click(470, 8);
  await page.waitForTimeout(1000);
  await page.getByRole('link', { name: '设置', exact: true }).click();
  const audioGroup = page.getByRole('group').filter({
    has: page.getByRole('button', { name: '静音' }),
  });
  await audioGroup.getByRole('button', { name: '静音' }).click();
  await page.waitForTimeout(500);
  const muted = await page.evaluate(() =>
    (window as unknown as { __bgm: HTMLAudioElement[] }).__bgm
      .filter((element) => element.src.includes('/audio/bgm/'))
      .some((element) => element.volume === 0 && element.paused),
  );
  expect(muted).toBe(true);
  await audioGroup.getByRole('button', { name: '开', exact: true }).click();
  await page.waitForTimeout(700);
  const resumed = await page.evaluate(() =>
    (window as unknown as { __bgm: HTMLAudioElement[] }).__bgm
      .filter((element) => element.src.includes('/audio/bgm/'))
      .some((element) => !element.paused && element.volume > 0),
  );
  expect(resumed).toBe(true);
});
test('同一时间只播一首 BGM', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'headless WebKit blocks media playback');
  await page.addInitScript(() => {
    const Native = window.Audio;
    const store = window as unknown as { __bgm: HTMLAudioElement[] };
    store.__bgm = [];
    const Shim = function (src?: string) {
      const element = new Native(src);
      store.__bgm.push(element);
      return element;
    };
    window.Audio = Shim as unknown as typeof Audio;
  });
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Overdose Wiki' })).toBeVisible();
  await page.mouse.click(470, 8);
  const playing = () =>
    page.evaluate(() =>
      (window as unknown as { __bgm: HTMLAudioElement[] }).__bgm.filter(
        (element) => element.src.includes('/audio/bgm/') && !element.paused && element.volume > 0,
      ).length,
    );
  await page.waitForTimeout(1100);
  expect(await playing()).toBeLessThanOrEqual(1);

  // 快速来回切场景：旧实现会在这里留下两首同时响
  for (const route of [
    '/#/report/7',
    '/#/chapters',
    '/#/report/7/replay/ch01.s03',
    '/#/docs',
    '/#/report/7/replay/ch01.s04',
    '/#/report/7',
    '/#/',
  ]) {
    await page.goto(route);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);
  const count = await playing();
  expect(count).toBeLessThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(1);
});

import { expect, test } from './fixtures';

const SAVE = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: {},
  completedScenes: [],
  choices: {},
  unlocks: [],
  deck: {},
  ownedCards: [
    'sertraline',
    'dextromethorphan',
    'magnesium_threonate',
    'caffeine',
    'naloxone',
    'pregabalin',
    'fluoxetine',
    'amantadine',
  ],
  boxes: 1,
  claimedDocs: [],
  claimedQuests: [],
  readEffects: [],
  seenIntros: [],
  settings: {
    scale: 'auto',
    font: 'normal',
    motion: 'auto',
    contrast: 'normal',
    scanlines: false,
    spoilers: false,
    audio: { bgm: 0, sfx: 0, mute: true },
  },
  history: [],
};

test('chapter intro plays once and can be skipped', async ({ browser }) => {
  test.setTimeout(60000);
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.addInitScript((save) => {
    if (!localStorage.getItem('odw.save.v1')) {
      localStorage.setItem('odw.save.v1', JSON.stringify(save));
    }
    sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true }));
    sessionStorage.setItem('odw.test.consent', '1');
  }, SAVE);
  await page.goto('/#/report/7/replay/ch01.s01');
  const intro = page.getByTestId('chapter-opening');
  await expect(intro).toBeVisible({ timeout: 15000 });
  await expect(intro).toContainText('IMAGINARY ROOTS');
  await expect
    .poll(() =>
      page.getByTestId('opening-canvas').evaluate((canvas) => {
        const value = Number((canvas as HTMLCanvasElement).dataset.introTime ?? 0);
        return value > 1;
      }),
    )
    .toBe(true);
  await page.getByRole('button', { name: '跳过' }).click();
  await expect(intro).toHaveCount(0);
  await expect(page.getByTestId('dialog')).toBeVisible();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByTestId('dialog')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('chapter-opening')).toHaveCount(0);
  await context.close();
});

test('chapter opening keeps BGM silent until skipped', async ({ browser, browserName }) => {
  // WebKit 的媒体请求不经过 page.on('request')，这条断言在它上面没有意义
  test.skip(browserName === 'webkit', 'webkit media loads bypass page request events');
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/audio/bgm/')) requests.push(request.url().split('/').pop() ?? '');
  });
  await page.addInitScript((save) => {
    const next = JSON.parse(JSON.stringify(save));
    next.settings.audio = { bgm: 20, sfx: 0, mute: false };
    next.seenIntros = [];
    localStorage.setItem('odw.save.v1', JSON.stringify(next));
    sessionStorage.setItem('odw.session.v1', JSON.stringify({ booted: true, loggedIn: true }));
    sessionStorage.setItem('odw.test.consent', '1');
  }, SAVE);
  await page.goto('/#/report/7/replay/ch01.s01');
  await expect(page.getByTestId('chapter-opening')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1500);
  expect(requests).toEqual([]);
  await page.getByRole('button', { name: '跳过' }).click();
  await expect.poll(() => requests.includes('ch01.mp3'), { timeout: 5000 }).toBe(true);
  await context.close();
});

test('chapter gate requires the archive quest', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14'];
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await page.goto('/#/chapters');
  await expect(page.getByRole('button', { name: /███ · ch02/ })).toContainText('第一批归档');

  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.read = { ...save.read, 108: ['report-108-full'] };
    save.readEffects = ['解离', '反解离'];
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await expect(page.getByRole('link', { name: /苦涩的颜料/ })).toBeVisible();
});

test('chapter 2 quest writes three effect documents and gates chapter 3', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14', 'ch02.s24'];
    save.read = { ...save.read, 108: ['report-108-full'] };
    save.readEffects = ['解离', '反解离'];
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await page.goto('/#/chapters');
  await expect(page.getByRole('button', { name: /███ · ch03/ })).toContainText('第二次校订');
  await expect(page.getByRole('link', { name: '编写效果文档「幻觉」' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /第二次校订 0\/3/ })).toBeVisible();

  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.readEffects = ['解离', '反解离', '幻觉', '谵妄', '镇静'];
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await expect(page.getByRole('link', { name: /从此再也不见/ })).toBeVisible();
});

test('opening a medicine box unlocks a card', async ({ page }) => {
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.boxes = 1;
    save.ownedCards = [
      'sertraline',
      'dextromethorphan',
      'magnesium_threonate',
      'caffeine',
      'naloxone',
      'pregabalin',
      'fluoxetine',
      'amantadine',
    ];
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await page.goto('/#/boxes');
  await expect(page.getByText(/持有药盒：1/)).toBeVisible();
  await expect(page.getByText(/已收集：8\/50 种/)).toBeVisible();
  await page.getByRole('button', { name: '开启一个药盒' }).click();
  await expect(page.getByText(/持有药盒：0/)).toBeVisible();
  await expect(page.getByText(/共 9 张/)).toBeVisible();
  await expect(page.getByText(/开出：/)).toBeVisible();
});
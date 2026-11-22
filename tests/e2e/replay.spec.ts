import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

const hasPrivate = existsSync('src/content/private');

test.use({ reducedMotion: 'no-preference' });

async function advanceToChoice(page: import('@playwright/test').Page) {
  const choices = page.getByRole('group', { name: '选择' });
  for (let index = 0; index < 40; index += 1) {
    if (await choices.isVisible().catch(() => false)) break;
    await page.getByTestId('scene-wrap').click();
  }
  await expect(choices).toBeVisible();
}

/** 逐拍点击，直到某一拍满足条件；每次点击都等台词真的变了再继续，避免连点跳过目标。 */
async function advanceUntil(
  page: import('@playwright/test').Page,
  done: () => Promise<boolean>,
  max = 18,
) {
  const dialog = page.getByTestId('dialog');
  const line = page.getByTestId('dialog-line');
  for (let i = 0; i < max; i += 1) {
    if (await done()) return true;
    const before = (await line.textContent().catch(() => '')) ?? '';
    await dialog.click({ timeout: 2500 }).catch(() => undefined);
    await expect
      .poll(async () => ((await line.textContent().catch(() => '')) ?? ''), { timeout: 3000 })
      .not.toBe(before)
      .catch(() => undefined);
  }
  return done();
}

test('chapter boundaries carry the target report id', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'content navigation runs on chromium');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14', 'ch02.s24'];
    save.readEffects = ['解离', '反解离', '幻觉', '谵妄', '镇静', '恢复术'];
    save.read = { 108: ['report-108-full'], 104: ['report-104-full'], 101: ['report-101-full'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();

  await page.goto('/#/report/49/replay/ch02.s24');
  await advanceToChoice(page);
  await page.getByRole('button', { name: '1. 继续读下去' }).click();
  await expect(page).toHaveURL(/#\/report\/49$/);
  await expect(page.getByRole('heading', { name: '苦涩的颜料' })).toBeVisible();

  await page.goto('/#/report/50/replay/ch03.s24');
  await advanceToChoice(page);
  await page.getByRole('button', { name: '1. 继续读下去' }).click();
  await expect(page).toHaveURL(/#\/report\/50$/);
  await expect(page.getByRole('heading', { name: '从此再也不见' })).toBeVisible();
});

test('replay drops the trace card and applies a scene transition', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'visual transition metadata runs on chromium');
  await page.goto('/#/');
  await page.goto('/#/report/7/replay/ch01.s03');
  await expect(page.getByTestId('scene-canvas')).toHaveAttribute(
    'data-transition',
    /fade|slide|glitch/,
    { timeout: 15000 },
  );
  await expect(page.getByText('痕迹 P0')).toHaveCount(0);
});

test('same-background scene changes keep the canvas painted', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'canvas pixels run on chromium');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14', 'ch02.s24'];
    save.readEffects = ['解离', '反解离', '幻觉', '谵妄', '镇静'];
    save.read = { 108: ['report-108-full'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await page.goto('/#/report/50/replay/ch03.s09');
  await expect(page.getByTestId('scene-canvas')).toBeVisible({ timeout: 15000 });

  await page.evaluate(() => {
    window.location.hash = '#/report/50/replay/ch03.s10';
  });
  await expect(page).toHaveURL(/ch03\.s10/);
  const colors = await page.getByTestId('scene-canvas').evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const set = new Set<number>();
    for (let index = 0; index < data.length; index += 4 * 13) {
      set.add((data[index] << 16) | (data[index + 1] << 8) | data[index + 2]);
    }
    return set.size;
  });
  expect(colors).toBeGreaterThan(8);
});

test('the continue hint sits below the dialogue text', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'layout measurement runs on chromium');
  await page.goto('/#/');
  await page.goto('/#/report/7/replay/ch01.s03');
  const hint = page.getByText('▼ 点击继续');
  await expect(hint).toBeVisible({ timeout: 15000 });
  const boxes = await page.evaluate(() => {
    const line = document.querySelector('[data-testid="dialog-line"]')!.getBoundingClientRect();
    const mark = [...document.querySelectorAll('span')]
      .find((node) => node.textContent?.includes('点击继续'))!
      .getBoundingClientRect();
    return { lineBottom: line.bottom, markTop: mark.top };
  });
  expect(boxes.markTop).toBeGreaterThanOrEqual(boxes.lineBottom - 1);
});

test('auto-read advances the dialogue from the status bar', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'timing-sensitive');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/');
  await page.goto('/#/report/7/replay/ch01.s03');
  const line = page.getByTestId('dialog-line');
  await expect(line).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('▼ 点击继续')).toBeVisible({ timeout: 10000 });
  const first = await line.textContent();

  const auto = page.getByRole('button', { name: '自动' });
  await expect(auto).toBeVisible();
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'true');

  await expect
    .poll(async () => (await line.textContent()) !== first, { timeout: 6000 })
    .toBe(true);
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
});

test('space completes the typewriter without skipping the beat', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'timing-sensitive');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14', 'ch02.s24'];
    save.readEffects = ['解离', '反解离', '幻觉', '谵妄', '镇静'];
    save.read = { 108: ['report-108-full'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await page.goto('/#/report/50/replay/ch03.s02');

  const chapter = JSON.parse(
    readFileSync('src/content/private/chapters/ch03.json', 'utf8'),
  ) as { scenes: { id: string; beats: { text?: string }[] }[] };
  const full = chapter.scenes.find((scene) => scene.id === 'ch03.s02')?.beats[0].text ?? '';
  expect(full.length).toBeGreaterThan(20);

  const line = page.getByTestId('dialog-line');
  await expect(line).toBeVisible();
  await expect
    .poll(async () => (await line.textContent())?.length ?? 0)
    .toBeLessThan(full.length);

  await page.keyboard.press('Space');
  await expect(line).toHaveText(full);
  await page.waitForTimeout(200);
  await expect(line).toHaveText(full);

  await page.keyboard.press('Space');
  await expect.poll(async () => (await line.textContent()) ?? '').not.toBe(full);
});
test('章节末直接回到报告，不再停在收尾面板', async ({ page }) => {
  await page.goto('/#/report/7/replay/rp-7-26');
  await expect(page.getByRole('heading', { name: /复演 · 报告七后记/ })).toBeVisible();
  const wrap = page.getByTestId('scene-wrap');
  const choice = page.getByRole('group', { name: '选择' });
  for (let i = 0; i < 20; i += 1) {
    if (await choice.isVisible().catch(() => false)) {
      await choice.getByRole('button').first().click();
      break;
    }
    await wrap.click({ timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(80);
  }
  await expect(page).toHaveURL(/#\/report\/7$/);
  await expect(page.getByRole('heading', { name: '虚数根' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^第 14 段 · 报告七后记/ }),
  ).toHaveAttribute('data-unread', 'false');
});

test('持续型特效有进退场过渡', async ({ page }) => {
  await page.goto('/#/report/2/replay/report-2-full');
  const wrap = page.getByTestId('scene-wrap');
  await expect(wrap).toBeVisible();
  const filter = () =>
    page.evaluate(
      () => getComputedStyle(document.querySelector('[data-testid="scene-wrap"]') as Element).filter,
    );
  const motion = await page.evaluate(() => {
    const style = getComputedStyle(
      document.querySelector('[data-testid="scene-wrap"]') as Element,
    );
    return { duration: style.transitionDuration, property: style.transitionProperty };
  });
  expect(motion.duration).toContain('0.34s');
  expect(motion.property).toContain('filter');
  const skipMinigame = async () => {
    const exit = page.getByTestId('minigame-exit');
    if (!(await exit.isVisible().catch(() => false))) return false;
    await exit.click();
    return true;
  };
  for (let i = 0; i < 12; i += 1) {
    if (await skipMinigame()) continue;
    await wrap.click();
    await page.waitForTimeout(30);
    if ((await wrap.getAttribute('data-fx')) === 'blur') break;
  }
  await expect(wrap).toHaveAttribute('data-fx', 'blur');
  await expect.poll(filter, { timeout: 3000 }).toContain('blur(1.7px)');
  // 离开这一拍：滤镜应当慢慢退回，而不是硬切
  let left = false;
  for (let i = 0; i < 12 && !left; i += 1) {
    if (await skipMinigame()) continue;
    await wrap.click();
    try {
      await expect(wrap).not.toHaveAttribute('data-fx', 'blur', { timeout: 900 });
      left = true;
    } catch {
      // 这一下只是把打字补完，再点一次
    }
  }
  expect(left).toBe(true);
  // 过渡已由 transitionDuration / transitionProperty 证明，这里只确认滤镜确实退回。
  await expect.poll(filter, { timeout: 3000 }).toBe('none');
});

test('恨意台词变红并抖动', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', '情绪动效在 chromium 校验');
  test.skip(!hasPrivate, 'requires private content');
  await page.addInitScript(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14'];
    save.readEffects = ['解离', '反解离'];
    save.read = { ...save.read, 108: ['done'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.goto('/#/report/49/replay/ch02.s14');
  const line = page.getByTestId('dialog-line');
  await advanceUntil(page, async () => (await line.getAttribute('data-emotion')) === 'rage');
  await expect(line).toContainText('不可能！下一个案例绝不是你');
  await expect(line).toHaveAttribute('data-emotion', 'rage');
  const look = await line.evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.color, animation: style.animationName };
  });
  expect(look.color).toBe('rgb(178, 58, 82)');
  expect(look.animation).toContain('rageQuake');
});

test('听到彩加死讯时画面压暗', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', '情绪动效在 chromium 校验');
  test.skip(!hasPrivate, 'requires private content');
  await page.addInitScript(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14'];
    save.readEffects = ['解离', '反解离'];
    save.read = { ...save.read, 108: ['done'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.goto('/#/report/49/replay/ch02.s20');
  const line = page.getByTestId('dialog-line');
  // 停在报出死讯、fx 换成 gloom 的那一拍
  await advanceUntil(page, async () => (await page.getByTestId('scene-wrap').getAttribute('data-fx')) === 'gloom');
  await expect(line).toContainText('坠楼');
  const wrap = page.getByTestId('scene-wrap');
  await expect(wrap).toHaveAttribute('data-fx', 'gloom');
  await expect(page.getByTestId('stage')).toHaveAttribute('data-window-fx', 'gloom');
  await expect
    .poll(() =>
      wrap.evaluate((el) => getComputedStyle(el).filter),
    )
    .toContain('brightness(0.58)');
});

test('afterglow uses the Spring Festival memory background', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'content navigation runs on chromium');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/');
  await page.goto('/#/report/7/replay/ch01.s04');
  const canvas = page.getByTestId('scene-canvas');
  await expect(canvas).toHaveAttribute('aria-label', '春节 / 余晖像素场景', { timeout: 15000 });
  const background = await canvas.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(background).toContain('bg_spring_festival.png');
});

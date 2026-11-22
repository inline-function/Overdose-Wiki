import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function seedScenes(page: Page, scenes: string[]) {
  await page.waitForTimeout(450);
  await page.evaluate((value) => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = value;
    save.readEffects = ['解离', '反解离'];
    save.read = {
      ...save.read,
      108: ['report-108-full'],
    };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  }, scenes);
  await page.reload();
}



test('keyboard tabs', async ({ page }) => {
  await page.goto('/#/');
  await expect(page).toHaveURL(/#\/$/);
  await page.getByTestId('stage').click({ position: { x: 2, y: 2 } });

  await page.keyboard.press('3');
  await expect(page).toHaveURL(/#\/report\/7/);
  await page.keyboard.press('v');
  await expect(page).toHaveURL(/#\/report\/7\/replay\//);
  await page.keyboard.press('1');
  await expect(page).toHaveURL(/#\/$/);
});

test('settings scale and save controls', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/settings');
  await page.getByRole('button', { name: '3×' }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-scale', '3');
  await page.getByRole('button', { name: '自动' }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-scale', '2');
});

for (const [route, label] of [
  ['/#/consent', 'consent'],
  ['/#/', 'home'],
  ['/#/report/7', 'report'],
  ['/#/settings', 'settings'],
] as const) {
  test(`axe: ${label}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('axe: chapter two minigames', async ({ page }) => {
  await page.goto('/#/');
  await seedScenes(page, ['ch01.s14']);
  for (const sceneId of ['ch02.s02', 'ch02.s06', 'ch02.s08', 'ch02.s09', 'ch02.s17']) {
    await page.goto(`/#/report/49/replay/${sceneId}`);
    await page.getByTestId('scene-wrap').waitFor({ state: 'visible' });
    for (let i = 0; i < 16; i += 1) {
      if (await page.getByTestId('minigame-overlay').isVisible().catch(() => false)) break;
      await page.getByTestId('scene-wrap').click({ timeout: 1500 }).catch(() => undefined);
      await page.waitForTimeout(220);
    }
    await expect(page.getByTestId('minigame-overlay')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('chapter-end choice returns straight to the report', async ({ page }) => {
  await page.goto('/#/');
  test.skip((await page.getByTestId('stage').getAttribute('data-content')) === 'sample', 'requires private ch01 content');
  await page.goto('/#/report/7/replay/rp-7-26');
  const choices = page.getByRole('group', { name: '选择' });
  for (let index = 0; index < 24; index += 1) {
    if (await choices.isVisible().catch(() => false)) break;
    await page.getByTestId('scene-wrap').click();
  }
  await expect(choices).toBeVisible();
  await expect(choices.getByRole('button', { name: /留下/ })).toHaveCount(3);
  await choices.getByRole('button', { name: /留下/ }).first().click();
  // 章末不再弹“回首页/回报告”，而是直接落到本章报告页。
  await expect(page).toHaveURL(/#\/report\/7$/);
  await expect(page.getByRole('heading', { name: '虚数根' })).toBeVisible();
  await expect(page.getByTestId('report-line').last()).toHaveAttribute(
    'data-unread',
    'false',
  );
});

test('effect detail renders from content or fallback', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/effects/%E8%A7%A3%E7%A6%BB');
  await expect(page.getByRole('heading', { name: '解离', exact: true })).toBeVisible();
  await expect(page.getByText(/关联：/)).toBeVisible();
});


test('deck builder saves a valid default deck', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/deck');
  await page.getByRole('button', { name: '填入默认 8 张' }).click();
  await expect(page.getByText(/8 \/ 8 张/)).toBeVisible();
  await page.getByRole('button', { name: '保存牌组' }).click();
  await expect(page.getByText(/构筑校验：通过/)).toBeVisible();
});

test('deck builder supports dragging cards in and out', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/deck');
  const tray = page.locator('section[aria-label="当前牌组"]');
  await page
    .locator('section[aria-label="药箱"] button:not([data-locked="true"])')
    .first()
    .dragTo(tray);
  await expect(page.getByText(/1 \/ 8 张/)).toBeVisible();
  await tray.getByRole('button').first().dragTo(page.locator('section[aria-label="药箱"]'));
  await expect(page.getByText(/0 \/ 8 张/)).toBeVisible();
});

test('chapter index reaches ch02 content', async ({ page }) => {
  await page.goto('/#/');
  test.skip((await page.getByTestId('stage').getAttribute('data-content')) === 'sample', 'requires private chapters');
  await seedScenes(page, ['ch01.s14']);
  await page.goto('/#/chapters');
  await expect(page.getByRole('heading', { name: '章节', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /苦涩的颜料/ }).click();
  await expect(page).toHaveURL(/#\/report\/49\/replay\//);
  await expect(page.getByRole('heading', { name: /好友申请/ })).toBeVisible();
});

test('report body renders and links to its scene', async ({ page }) => {
  await page.goto('/#/');
  test.skip((await page.getByTestId('stage').getAttribute('data-content')) === 'sample', 'requires private report bodies');
  await seedScenes(page, ['ch01.s14', 'ch02.s01']);
  await page.goto('/#/report/49');
  await expect(page.getByRole('heading', { name: '苦涩的颜料' })).toBeVisible();
  await expect(page.getByText(/处理者按/).first()).toBeVisible();
  await page.getByTestId('report-line').first().click();
  await expect(page).toHaveURL(/#\/report\/49\/replay\/report-49-full/);
});

test('font+ and high contrast reach the reading view', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/settings');
  await page.getByRole('button', { name: '放大' }).click();
  await page.getByRole('button', { name: '高', exact: true }).click();
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-font', 'large');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-contrast', 'high');
  await page.goto('/#/report/7');
  await expect(page.getByTestId('report-line').first()).toBeVisible();
  const size = await page.evaluate(() => {
    const node = document.querySelector('[class*="segText"]');
    return node ? Number.parseFloat(getComputedStyle(node).fontSize) : 0;
  });
  expect(size).toBeGreaterThanOrEqual(24);
});

test('unlock gating hides ch02 and report 49 until prerequisites', async ({ page }) => {
  await page.goto('/#/');
  test.skip((await page.getByTestId('stage').getAttribute('data-content')) === 'sample', 'requires private chapters');
  await page.goto('/#/chapters');
  await expect(page.getByRole('button', { name: /███ · ch02/ })).toContainText('第一批归档');
  await expect(page.getByRole('link', { name: /苦涩的颜料/ })).toHaveCount(0);
  await page.goto('/#/archive');
  await expect(page.getByRole('button', { name: /报告 49/ })).toContainText('ch01.s14');

  await seedScenes(page, ['ch01.s14']);
  await page.goto('/#/chapters');
  await expect(page.getByRole('link', { name: /苦涩的颜料/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /███ · ch03/ })).toContainText('第二次校订');

  await page.goto('/#/archive');
  await expect(page.getByRole('link', { name: /报告 49/ })).toBeVisible();
});

test('report page lists every dialogue line', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/report/7');
  const lines = page.getByTestId('report-line');
  await expect(lines).toHaveCount(40);
  await expect(lines.nth(0)).toHaveAttribute('data-scene', 'ch01.s01');
  await expect(lines.nth(0)).toHaveAttribute('data-beat', '0');
  await expect(lines.nth(1)).toHaveAttribute('data-scene', 'ch01.s01');
  await expect(lines.nth(1)).toHaveAttribute('data-beat', '1');
  await expect(lines.nth(0)).toHaveAttribute('data-current', 'true');
  await expect(lines.last()).toHaveAttribute('data-scene', 'ch01.s14');
});

test('report bracket keys move dialogue lines with unread confirmation', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/report/7');
  await expect(page.getByTestId('report-line').first()).toBeVisible();
  await page.getByTestId('stage').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press(']');
  const confirm = page.getByRole('alert');
  await expect(confirm).toContainText('跳到未读对话');
  await page.keyboard.press('Escape');
  await expect(confirm).toHaveCount(0);
  await page.keyboard.press(']');
  await page.getByRole('button', { name: '跳转' }).click();
  await expect(page).toHaveURL(/#\/report\/7\/replay\/ch01\.s01/);
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (JSON.parse(localStorage.getItem('odw.save.v1') ?? '{}') as {
            progress?: { beat?: number };
          }).progress?.beat,
      ),
    )
    .toBe(1);
});

test('settings export downloads a versioned save', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/settings');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^odw-save-\d{4}-\d{2}-\d{2}\.json$/);
});

test('reduced motion setting applies to the game shell', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/settings');
  await page.getByRole('button', { name: '减少', exact: true }).click();
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-motion', 'reduce');
});

test('scroll position is remembered across routes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'scroll listener timing differs in WebKit');
  await page.goto('/#/');
  await page.waitForFunction(() => {
    const view = document.querySelector('[data-testid="view"]');
    return Boolean(view && view.scrollHeight > view.clientHeight);
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const view = document.querySelector('[data-testid="view"]');
    if (view) {
      view.scrollTop = 120;
      view.dispatchEvent(new Event('scroll'));
    }
  });
  await page.waitForTimeout(200);
  await page.goto('/#/history');
  await page.waitForTimeout(400);
  await page.goto('/#/');
  await page.waitForFunction(() => {
    const view = document.querySelector('[data-testid="view"]');
    return Boolean(view && view.scrollTop > 0);
  });
  const scrollTop = await page.evaluate(() => {
    const view = document.querySelector('[data-testid="view"]');
    return view ? Math.round(view.scrollTop) : -1;
  });
  expect(scrollTop).toBeGreaterThan(80);
});

test('semantic tree exposes landmarks, headings, and names', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/report/7');
  await expect(page.getByTestId('report-line').first()).toBeVisible();
  const tree = await page.locator('body').ariaSnapshot();
  expect(tree).toContain('banner');
  expect(tree).toContain('navigation "维基地址栏"');
  expect(tree).toContain('complementary "维基侧栏"');
  expect(tree).toContain('main');
  expect(tree).toContain('heading "虚数根"');

  await page.goto('/#/report/7/replay/rp-7-12');
  await expect(page.getByRole('img', { name: /春节 \/ 余晖像素场景/ })).toBeVisible();
  const replayTree = await page.locator('body').ariaSnapshot();
  expect(replayTree).toContain('img "春节 / 余晖像素场景');
  expect(replayTree).toContain('heading "复演 · 余晖"');
});

test('archive and effect search filter results', async ({ page }) => {
  await page.goto('/#/');
  await page.goto('/#/archive');
  await page.getByRole('textbox', { name: '搜索档案' }).fill('49');
  await expect(page.getByRole('button', { name: /报告 49/ })).toBeVisible();
  await expect(page.getByText(/报告 7 ·/)).toHaveCount(0);

  await page.goto('/#/effects');
  await page.getByRole('textbox', { name: '搜索效果' }).fill('解离');
  await expect(page.getByRole('link', { name: '解离 效果词条', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /余晖/ })).toHaveCount(0);
});

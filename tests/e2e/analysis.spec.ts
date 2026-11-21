import { existsSync } from 'node:fs';
import { expect, test, type Page } from './fixtures';

const hasPrivate = existsSync('src/content/private');

test.use({ reducedMotion: 'no-preference' });

const WORDS = ['头痛', '超我', '让自己好受', '优米'];

async function collectKeywords(page: Page) {
  await page.getByTestId('analysis-report-open').click();
  const report = page.getByTestId('analysis-report');
  for (const word of WORDS) {
    await report.getByRole('button', { name: word, exact: true }).first().click();
  }
  await expect(page.getByTestId('analysis-counter')).toContainText('4/4');
  return report;
}

async function closeReport(page: Page) {
  await page.getByTestId('analysis-report-close').click();
  await expect(page.getByTestId('analysis-report')).toHaveCount(0);
  await expect(page.getByTestId('analysis-caption')).toContainText('拖动积木');
}

async function place(page: Page, block: string, slot: string) {
  await page.locator(`[data-block="${block}"]`).click();
  await page.locator(`[data-slot="${slot}"]`).click();
  await expect(page.locator(`[data-slot="${slot}"]`)).toHaveAttribute('data-filled', 'true');
}

async function fillChain(page: Page) {
  await place(page, 'symptom', 'main-symptom');
  await place(page, 'cause', 'main-cause');
  await place(page, 'cognition', 'main-cognition');
  await place(page, 'benefit', 'branch-benefit');
  await expect(page.getByTestId('analysis-reveal')).toBeVisible();
}

async function finishChain(page: Page) {
  await page.getByTestId('analysis-reveal').click();
  await page.getByTestId('analysis-continue').click();
  await page.getByTestId('analysis-done').click();
}

test('analysis lab lists only the self-case, with no demo or tutorial path', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'analysis gameplay runs on chromium');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/analysis');
  await expect(page.getByRole('heading', { name: '精神分析', exact: true })).toBeVisible();
  await expect(page.getByText('右美神经症 · 后藤的自我病例')).toBeVisible();
  await expect(page.getByText('弗洛伊德 · 强迫症案例')).toHaveCount(0);
  await expect(page.getByText(/演示|教程/)).toHaveCount(0);

  await page.getByRole('link', { name: /右美神经症 · 后藤的自我病例/ }).click();
  await expect(page.getByTestId('analysis-stage')).toBeVisible();
  await expect(page.getByTestId('analysis-caption')).toContainText('这次你来');
  await expect(page.getByTestId('analysis-step')).toHaveCount(0);
  await expect(page.getByText(/演示模式|教程模式/)).toHaveCount(0);

  await collectKeywords(page);
  await expect(page.getByRole('button', { name: '后藤直接拆' })).toHaveCount(0);
});

test('analysis uses color instead of category labels and adds unrevealed decoys', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'analysis gameplay runs on chromium');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/analysis/dxm');
  await expect(page.getByTestId('analysis-stage')).toBeVisible();

  // 报告右下角退出键：深底浅字；左上角「收起」：纸底深字。
  await page.getByTestId('analysis-report-open').click();
  const report = page.getByTestId('analysis-report');
  const close = page.getByTestId('analysis-report-close');
  await expect(close).toHaveCSS('background-color', 'rgb(27, 23, 34)');
  await expect(close).toHaveCSS('color', 'rgb(230, 216, 189)');
  const collapse = report.getByRole('button', { name: '收起' });
  await expect(collapse).toHaveCSS('color', 'rgb(23, 21, 31)');
  await expect(collapse).toHaveCSS('border-top-color', 'rgb(23, 21, 31)');
  for (const word of WORDS) {
    await report.getByRole('button', { name: word, exact: true }).first().click();
  }
  await closeReport(page);

  // 十二块积木混在一起：四块真货，八块干扰；没有任何类别小标签。
  const blocks = page.getByTestId('analysis-block');
  await expect(blocks).toHaveCount(12);
  const texts = await blocks.allInnerTexts();
  for (const text of texts) {
    expect(text).not.toMatch(/^(症状|病因|认知|好处|误读)/);
  }
  for (const label of ['症状', '病因', '认知', '好处', '误读']) {
    await expect(page.getByText(label, { exact: true })).toHaveCount(0);
  }

  // 空位上也不再写类别名。
  const slotTexts = await page.getByTestId('analysis-slot').allInnerTexts();
  expect(slotTexts.every((text) => text.trim() === '空')).toBeTruthy();

  // 四类只用颜色区分。
  await expect(page.locator('[data-block="symptom"]')).toHaveCSS('color', 'rgb(166, 43, 32)');
  await expect(page.locator('[data-block="cause"]')).toHaveCSS('color', 'rgb(47, 79, 143)');
  await expect(page.locator('[data-block="cognition"]')).toHaveCSS('color', 'rgb(63, 107, 63)');
  await expect(page.locator('[data-block="benefit"]')).toHaveCSS('color', 'rgb(23, 21, 31)');

  // 干扰项不会说明自己是干扰项，只会提示对不上。
  await page.locator('[data-block="decoy-cause-1"]').click();
  await page.locator('[data-slot="main-symptom"]').click();
  await expect(page.getByTestId('analysis-hint')).toContainText('对不上');
  await expect(page.getByTestId('analysis-hint')).not.toContainText('表面读法');
  await expect(page.locator('[data-slot="main-symptom"]')).toHaveAttribute('data-filled', 'false');

  await fillChain(page);
  // 右下角主按钮：琥珀底 + 墨色字，不能双黑。
  const reveal = page.getByTestId('analysis-reveal');
  await expect(reveal).toHaveCSS('background-color', 'rgb(217, 164, 65)');
  await expect(reveal).toHaveCSS('color', 'rgb(23, 21, 31)');
  await finishChain(page);
  await expect(page).toHaveURL(/#\/analysis$/);
});

test('analysis lives in a large dark window and blocks can be dragged into slots', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'analysis gameplay runs on chromium');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/analysis/dxm');
  const win = page.getByTestId('analysis-window');
  await expect(win).toBeVisible();
  // 窗口以游戏画板为基准，而不是铺满浏览器视口。
  const box = await win.boundingBox();
  const overlay = await page.getByTestId('analysis-overlay').boundingBox();
  expect(box && overlay).toBeTruthy();
  expect(box!.width / overlay!.width).toBeGreaterThan(0.95);
  expect(box!.height / overlay!.height).toBeGreaterThan(0.94);

  const exit = page.getByTestId('analysis-exit');
  await expect(exit).toBeVisible();
  // 退出键始终是暗色，不随阶段变成琥珀色。
  await expect(exit).toHaveCSS('background-color', 'rgb(21, 18, 28)');

  await collectKeywords(page);
  await closeReport(page);

  const block = page.locator('[data-block="symptom"]');
  const slot = page.locator('[data-slot="main-symptom"]');
  const from = await block.boundingBox();
  const to = await slot.boundingBox();
  expect(from && to).toBeTruthy();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 14 });
  await page.mouse.up();

  await expect(slot).toHaveAttribute('data-filled', 'true');
  await expect(block).toHaveCount(0);

  // 已经放进去的积木也能再拖出来，回到托盘。
  const placedSlot = await slot.boundingBox();
  expect(placedSlot).toBeTruthy();
  await page.mouse.move(placedSlot!.x + placedSlot!.width / 2, placedSlot!.y + placedSlot!.height / 2);
  await page.mouse.down();
  await page.mouse.move(20, 20, { steps: 12 });
  await page.mouse.up();
  await expect(slot).toHaveAttribute('data-filled', 'false');
  await expect(block).toBeVisible();
});

test('replay hands the analysis beat to the overlay and moves on', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'analysis gameplay runs on chromium');
  test.skip(!hasPrivate, 'requires private content');

  await page.goto('/#/report/7/replay/ch01.s11');
  const stage = page.getByTestId('analysis-stage');
  for (let index = 0; index < 10; index += 1) {
    if (await stage.isVisible().catch(() => false)) break;
    await page.getByTestId('dialog').click().catch(() => undefined);
    await page.waitForTimeout(80);
  }
  await expect(stage).toBeVisible();
  await expect(stage).toContainText('右美神经症');

  await collectKeywords(page);
  await closeReport(page);
  await fillChain(page);
  await finishChain(page);

  // 叠层让位给下一句台词，而不是再弹一次演示。
  await expect(page.getByTestId('analysis-stage')).toHaveCount(0);
  await expect(page.getByTestId('dialog')).toContainText('点破之后');
});

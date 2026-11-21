import { expect, test } from './fixtures';

test('docs stay empty until the player writes one', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'docs window runs on chromium');
  await page.goto('/#/docs');
  await expect(page.getByRole('status')).toContainText('还没有文档');
  await expect(page.getByRole('link', { name: /文档 \d/ })).toHaveCount(0);
  const sidebar = page.getByRole('complementary', { name: '维基侧栏' });
  await expect(sidebar.getByRole('link', { name: '文档', exact: true })).toHaveCount(1);
  await expect(sidebar.getByRole('link', { name: '效果', exact: true })).toHaveCount(0);
});

test('the quest guide opens a windows-style writer and files the document', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'docs window runs on chromium');
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14', 'ch02.s24', 'ch03.s24'];
    save.readEffects = ['解离', '反解离', '幻觉', '谵妄', '镇静', '恢复术'];
    save.read = { 108: ['report-108-full'], 104: ['report-104-full'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();

  const guide = page.getByRole('link', { name: /去编写/ });
  await expect(guide).toBeVisible();
  await guide.click();
  await expect(page).toHaveURL(/\/docs\?write=101/);

  const dialog = page.getByRole('dialog', { name: /写文档/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('doc-writer')).toContainText('编写中');
  await expect(dialog.getByRole('button', { name: '关闭写文档窗口' })).toBeVisible();

  await dialog.getByTestId('doc-writer').click();
  for (let i = 0; i < 48; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(70);
  }

  await expect(
    page.getByRole('link', { name: /文档 101 · 高原人员构成分析/ }),
  ).toBeVisible({ timeout: 10000 });
  await expect(dialog).toHaveCount(0);
});

test('the first quest guide writes the effect document in docs, not the old effects page', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'docs window runs on chromium');
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s14'];
    save.readEffects = [];
    save.read = { 108: ['report-108-full'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();

  const guide = page.getByRole('link', { name: /去编写/ });
  await expect(guide).toBeVisible();
  await guide.click();
  await expect(page).toHaveURL(/\/docs\?effect=/);
  await expect(page).not.toHaveURL(/\/effects/);

  const dialog = page.getByRole('dialog', { name: /写文档/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('doc-writer')).toContainText('解离');

  await dialog.getByTestId('doc-writer').click();
  for (let i = 0; i < 28; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(70);
  }

  const card = page.getByRole('button', { name: /效果文档 · 解离/ });
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect(dialog).toHaveCount(0);

  await card.click();
  const reader = page.getByRole('dialog', { name: /查看文档/ });
  await expect(reader).toBeVisible();
  await expect(reader).toContainText('封上自己的双耳');
  await page.getByRole('button', { name: '关闭文档查看窗口' }).click();
  await expect(reader).toHaveCount(0);
});

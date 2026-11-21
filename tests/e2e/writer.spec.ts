import { expect, test } from './fixtures';

test.use({ reducedMotion: 'no-preference' });

test('documents are written by the player, one paragraph per Enter', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'writer flow runs on chromium');
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s01'];
    save.read = {};
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();

  await page.goto('/#/report/100');
  const writer = page.getByTestId('doc-writer');
  await expect(writer).toBeVisible();
  await expect(page.getByLabel('编写文档')).toContainText('编写中');

  const paper = page.locator('[data-testid="doc-writer"] [role="document"]');
  // 打开时一个字都没有：稿纸是空的，等玩家落笔
  const before = (await paper.innerText()).trim();
  expect(before.length).toBe(0);

  // 第一次落笔：写出标题
  await writer.click();
  await expect
    .poll(async () => (await paper.innerText()).trim().length, { timeout: 4000 })
    .toBeGreaterThan(0);
  const heading = (await paper.innerText()).trim();

  // 回车：整段立即写完；再回车：开始写下一段正文
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect
    .poll(async () => (await paper.innerText()).trim().length, { timeout: 6000 })
    .toBeGreaterThan(heading.length + 10);

  // 下一段不会提前显示：回车只推进当前这一段
  const afterFirst = (await paper.innerText()).trim();
  expect(afterFirst.startsWith(heading)).toBe(true);

  // 写文档时任务指引自动让位，不挡住稿纸
  await expect(page.getByTestId('quest-guide')).toHaveCount(0);
});

test('writing a long document keeps the scroll view at the bottom', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'writer scroll runs on chromium');
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s01'];
    save.read = {};
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await page.goto('/#/report/101');
  const writer = page.getByTestId('doc-writer');
  await expect(writer).toBeVisible();
  await writer.click();

  // 交替「开始下一段 / 写完整段」，把稿纸推到超过一屏
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(90);
  }

  const atBottom = () =>
    page.getByTestId('view').evaluate((view) => {
      const element = view as HTMLElement;
      return element.scrollHeight > element.clientHeight + 4 &&
        element.scrollTop + element.clientHeight >= element.scrollHeight - 4;
    });
  await expect.poll(atBottom, { timeout: 4000 }).toBe(true);
});

test('quest guide points at the next chapter task', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'guide rendering runs on chromium');
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s01', 'ch01.s14'];
    save.readEffects = ['解离', '反解离'];
    save.read = { 108: ['report-108-full'] };
    save.progress = { ...save.progress, reportId: '7', segmentId: 'ch01.s14', sceneId: 'ch01.s14' };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
  await page.goto('/#/');
  const guide = page.getByTestId('quest-guide');
  await expect(guide).toContainText('第二次校订');
  await expect(guide).toContainText('开始第二章');
  await expect(page.getByRole('link', { name: '继续剧情 →' })).toBeVisible();
});

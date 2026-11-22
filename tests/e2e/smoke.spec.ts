import { expect, test } from './fixtures';

test('S0 shell: consent, routes, replay, settings, 3 scales', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Overdose Wiki' })).toBeVisible();

  await page.goto('/#/report/7');
  await expect(page.getByRole('heading', { name: '虚数根' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/s0-report-960.png' });

  await page.getByTestId('report-line').first().click();
  const jump = page.getByRole('button', { name: '跳转' });
  if (await jump.isVisible().catch(() => false)) await jump.click();
  await expect(page.getByRole('img', { name: /像素场景/ })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/s0-replay-960.png' });

  await page.goto('/#/settings');
  await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: 'test-results/s0-settings-960.png' });

  for (const route of [
    ['/#/archive', '档案索引'],
    ['/#/effects', '效果'],
    ['/#/deck', '药箱'],
    ['/#/history', '最近更改'],
    ['/#/discussion/7', '讨论：报告 7'],
    ['/#/extras', '番外'],
    ['/#/chapters', '章节'],
    ['/#/nope', '此页面不存在'],
  ] as const) {
    await page.goto(route[0]);
    await expect(page.getByRole('heading', { name: route[1] })).toBeVisible();
  }

  await page.goto('/#/');
  for (const [width, height] of [
    [480, 270],
    [960, 540],
    [1440, 810],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(async () => {
        const box = await page.getByTestId('stage').boundingBox();
        return box ? Math.round(box.width) : 0;
      })
      .toBe(width);
    await page.screenshot({ animations: 'disabled', path: `test-results/s0-${width}.png` });
    const metrics = await page.evaluate(() => {
      const visible = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(
        (element) => {
          const style = getComputedStyle(element);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            (element.textContent?.trim().length ?? 0) > 0
          );
        },
      );
      const minFont = Math.min(
        ...visible.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      );
      return {
        minFont,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(metrics.minFont).toBeGreaterThanOrEqual(8);
    expect(metrics.overflow).toBe(false);
  }

  expect(errors).toEqual([]);
});
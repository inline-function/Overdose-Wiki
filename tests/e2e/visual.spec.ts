import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

test.skip(({ browserName }) => browserName !== 'chromium', 'visual baselines are chromium-only');

async function accept(page: Page) {
  await page.goto('/#/');
  await page.waitForTimeout(4200);
  test.skip(
    (await page.getByTestId('stage').getAttribute('data-content')) === 'sample',
    'visual baselines require the private content build',
  );
}

for (const [width, height] of [
  [480, 270],
  [960, 540],
  [1440, 810],
] as const) {
  test(`home ${width}`, async ({ page }) => {
    test.setTimeout(60_000);
    await accept(page);
    await page.setViewportSize({ width, height });
    await expect(page.getByTestId('stage')).toHaveScreenshot(`home-${width}.png`, {
      animations: 'disabled',
    });
  });
}

test('report 960', async ({ page }) => {
  test.setTimeout(60_000);
  await accept(page);
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/#/report/7');
  await expect(page.getByTestId('report-line').first()).toBeVisible();
  await expect(page.getByTestId('stage')).toHaveScreenshot('report-960.png', {
    animations: 'disabled',
  });
});

test('replay 960', async ({ page }) => {
  test.setTimeout(60_000);
  await accept(page);
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/#/report/7/replay/rp-7-12');
  await expect(page.getByRole('heading', { name: /余晖/ })).toBeVisible();
  await expect(page.getByTestId('stage')).toHaveScreenshot('replay-960.png', {
    animations: 'disabled',
  });
});
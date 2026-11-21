import { expect, test } from './fixtures';

test('docs index and detail pages use the long-form rich texts', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'rich text surfaces run on chromium');
  await page.goto('/#/');
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ['ch01.s01', 'ch02.s01', 'ch03.s01', 'ch04.s01'];
    save.read = {
      ...save.read,
      100: ['report-100-full'],
      101: ['report-101-full'],
      102: ['report-102-full'],
      104: ['report-104-full'],
      108: ['report-108-full'],
      109: ['report-109-full'],
    };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();

  await page.goto('/#/docs');
  await expect(page.getByRole('link', { name: /文档 108 · od引论/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /文档 109 · od分论/ })).toBeVisible();

  await page.goto('/#/report/101');
  await expect(page.getByRole('heading', { name: '高原人员构成分析', exact: true })).toBeVisible();
  await expect(page.getByText('巴尔干半岛')).toBeVisible();
  await expect(page.getByText(/意识形态坐标轴/)).toBeVisible();

  await page.goto('/#/report/102');
  await expect(page.getByText('五沐交战')).toBeVisible();

  await page.goto('/#/report/104');
  await expect(page.getByText(/两面性的知识/)).toBeVisible();

  await page.goto('/#/report/108');
  await expect(page.getByText('受体：钥匙与锁')).toBeVisible();

  await page.goto('/#/report/109');
  await expect(page.getByText(/人员与情况：R \/ A \/ T/)).toBeVisible();
});

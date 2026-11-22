import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './fixtures';

const PRIVATE = 'src/content/private';
const hasPrivate = existsSync(PRIVATE);

function readAll(dir: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')));
}

const chapters = readAll(join(PRIVATE, 'chapters'));
const reports = readAll(join(PRIVATE, 'reports'));
const effects = readAll(join(PRIVATE, 'effects'));
const scenes = chapters.flatMap((chapter) => chapter.scenes);
const sceneIds = scenes.map((scene) => scene.id);

test('five chapters connect into one linear chain', () => {
  test.skip(!hasPrivate, 'requires private content');
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  expect(byId.get('ch01.s14')?.next).toBe('ch02.s01');
  expect(byId.get('ch02.s24')?.next).toBe('ch03.s01');
  expect(byId.get('ch03.s24')?.next).toBe('ch04.s01');

  const ch01End = byId.get('ch01.s14');
  const ch01Choice = ch01End?.beats.find((beat) => beat.type === 'choice');
  expect(ch01Choice?.type).toBe('choice');
  if (ch01Choice?.type === 'choice') {
    expect(ch01Choice.options).toHaveLength(3);
    expect(ch01Choice.options.map((option) => option.label)).toEqual(['留下', '留下', '留下']);
    expect(ch01Choice.options.every((option) => option.targetScene === 'ch02.s01')).toBe(true);
  }

  const ch03End = byId.get('ch03.s24');
  const ch03Choice = ch03End?.beats.find((beat) => beat.type === 'choice');
  expect(ch03Choice?.type).toBe('choice');
  if (ch03Choice?.type === 'choice') {
    expect(ch03Choice.options.every((option) => option.targetScene === 'ch04.s01')).toBe(true);
  }

  expect(chapters.some((chapter) => chapter.id === 'ch04')).toBe(true);
  expect(chapters.some((chapter) => chapter.id === 'interlude')).toBe(false);
});

test('rich-text docs carry the long-form wiki text', () => {
  test.skip(!hasPrivate, 'requires private content');
  const byId = new Map(reports.map((report) => [report.id, report]));
  const text = (id: string) =>
    (byId.get(id)?.body ?? [])
      .map((block: { text?: string; items?: string[] }) => block.text ?? block.items?.join('') ?? '')
      .join('');

  expect(text('100')).toContain('感知是肉体，认知是灵魂');
  expect(text('101')).toContain('巴尔干半岛');
  expect(text('102')).toContain('五沐交战');
  expect(text('104')).toContain('两面性的知识');
  expect(text('108')).toContain('钥匙与锁');
  expect(text('109')).toContain('人员与情况：R / A / T');

  const effectById = new Map(effects.map((effect) => [effect.id, effect]));
  const effectText = (id: string) =>
    (effectById.get(id)?.blocks ?? [])
      .map((block: { text?: string; items?: string[] }) => block.text ?? block.items?.join('') ?? '')
      .join('');
  expect(effectText('解离')).toContain('感知是肉体，认知是灵魂');
  expect(effectText('反解离')).toContain('如果解离是挂停车档');
  expect(effectText('幻觉')).toContain('幻觉不客观存在，却主观存在');
  expect(effectText('谵妄')).toContain('没有当下了');
  expect(effectText('镇静')).toContain('你在逃离现实吗');
  expect(effectText('解离')).toContain('封上自己的双耳');
  expect(effectText('反解离')).toContain('发动机');
  expect(effectText('幻觉')).toContain('我思故我在');
  expect(effectText('谵妄')).toContain('茶苯海明');
  expect(effectText('镇静')).toContain('一朵云');

  // 效果词条不再附「我们记下……」式收尾；正文里的「记住当下」等内容保留。
  for (const id of ['解离', '反解离', '幻觉', '谵妄', '镇静', '恢复术']) {
    expect(effectText(id)).not.toContain('我们记下');
  }
  expect(text('100')).not.toContain('我们记下');
});

test('all scenes, reports, and effects render', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'content coverage runs on chromium');
  test.skip(!hasPrivate, 'requires private content');
  test.setTimeout(900_000);

  await page.goto('/#/');
  await page.waitForTimeout(450);
  await page.evaluate((ids) => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = ids;
    save.readEffects = ['解离', '反解离', '幻觉', '谵妄', '镇静', '恢复术'];
    save.read = {
      ...save.read,
      108: ['report-108-full'],
      104: ['report-104-full'],
      101: ['report-101-full'],
    };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  }, sceneIds);
  await page.reload();

  for (const scene of scenes) {
    await page.goto(`/#/report/7/replay/${scene.id}`);
    await expect(
      page.getByRole('heading', { name: `复演 · ${scene.title}`, exact: true }),
    ).toBeVisible({ timeout: 15000 });
  }

  for (const report of reports) {
    await page.goto(`/#/report/${report.id}`);
    await expect(
      page.getByRole('heading', { name: report.title, exact: true }),
    ).toBeVisible();
  }

  for (const effect of effects) {
    await page.goto(`/#/effects/${encodeURIComponent(effect.id)}`);
    await expect(
      page.getByRole('heading', { name: effect.title, exact: true }),
    ).toBeVisible();
    if (effect.image) {
      await expect(page.locator('figure img')).toHaveCount(1);
      await expect
        .poll(() => page.locator('figure img').evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBe(352);
    }
  }
});

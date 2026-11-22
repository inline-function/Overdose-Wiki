import { existsSync } from 'node:fs';
import { expect, test } from './fixtures';

const hasPrivate = existsSync('src/content/private');

test.use({ reducedMotion: 'reduce' });

async function open(
  page: import('@playwright/test').Page,
  sceneId: string,
  reportId = '7',
) {
  await page.goto(`/#/report/${reportId}/replay/${sceneId}`);
  await page.getByTestId('scene-wrap').waitFor({ state: 'visible' });
  for (let i = 0; i < 16; i += 1) {
    if (await page.getByTestId('minigame-overlay').isVisible().catch(() => false)) return;
    await page.getByTestId('scene-wrap').click({ timeout: 1500 }).catch(() => undefined);
    await page.waitForTimeout(240);
  }
  await expect(page.getByTestId('minigame-overlay')).toBeVisible();
}

async function seedChapter2(page: import('@playwright/test').Page) {
  await page.goto('/#/');
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = Array.from(new Set([...(save.completedScenes ?? []), 'ch01.s14']));
    save.readEffects = ['解离', '反解离'];
    save.read = { ...save.read, 108: ['report-108-full'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
}

async function finish(page: import('@playwright/test').Page, id: string) {
  const done = page.getByTestId('minigame-done');
  await expect(done).toBeEnabled({ timeout: 4000 });
  await done.click();
  await expect(page.getByTestId('minigame-overlay')).toBeHidden();
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('odw.save.v1');
          return raw ? JSON.parse(raw).completedMinigames : [];
        }),
      { timeout: 4000 },
    )
    .toContain(id);
}

test('the seven chapter-one minigames can be completed', async ({ page, browserName }) => {
  test.skip(!hasPrivate, 'requires private content');
  test.skip(browserName !== 'chromium', 'minigame interaction coverage runs on chromium');
  test.setTimeout(90000);

  await open(page, 'ch01.s04');
  for (const fragment of await page.getByTestId('memory-fragment').all()) {
    await fragment.click();
  }
  await finish(page, 'ch01.afterglow');

  await open(page, 'ch01.s05');
  for (const id of ['kettle', 'tea', 'cup']) {
    await page.locator(`[data-testid="find-object"][data-object="${id}"]`).click();
    await page.waitForTimeout(200);
  }
  await finish(page, 'ch01.find-object');

  await open(page, 'ch01.s06');
  const words = page.getByTestId('perception-word');
  await expect(words).toHaveCount(8);
  for (let i = 0; i < 6; i += 1) {
    await words.nth(i).click();
  }
  await finish(page, 'ch01.perception');

  await open(page, 'ch01.s07');
  const forumAnswers = [
    ['e1', '愈创木酚甘油醚'],
    ['e2', '不能，血清素综合征'],
    ['e3', '不能联用'],
  ] as const;
  for (let i = 0; i < forumAnswers.length; i += 1) {
    const [error, option] = forumAnswers[i];
    await expect(
      page.locator(`[data-testid="forum-error"][data-error="${error}"]`),
    ).toHaveAttribute('data-active', 'true');
    await page
      .getByTestId('forum-correction')
      .getByRole('button', { name: option, exact: true })
      .click();
    await expect(page.getByTestId('forum-reply')).toHaveCount(i + 1);
  }
  await expect(page.getByTestId('forum-replied')).toHaveCount(3);
  await finish(page, 'ch01.forum-fix');

  await open(page, 'ch01.s09');
  const answers = [
    '不能，血清素综合征。',
    '不能联用。',
    '风险极高，别拿它当补脑药。',
    '不要。血清素综合征。',
    '先别加量，找信任的人陪着。',
  ];
  for (let i = 0; i < answers.length; i += 1) {
    await page.getByTestId('chat-option').filter({ hasText: answers[i] }).click();
    if (i < answers.length - 1) {
      await expect(page.getByTestId('chat-typing')).toBeVisible();
      await expect(page.getByTestId('chat-question')).toBeVisible({ timeout: 5000 });
    }
  }
  await finish(page, 'ch01.chat-triage');

  await open(page, 'ch01.s10');
  for (const [card, category] of [
    ['w1', 'intro'],
    ['w8', 'intro'],
    ['w2', 'branch'],
    ['w3', 'effects'],
    ['w5', 'effects'],
    ['w4', 'restore'],
    ['w6', 'restore'],
    ['w7', 'reports'],
  ]) {
    await page.locator(`[data-testid="wiki-card"][data-card="${card}"]`).click();
    await page.locator(`[data-testid="wiki-category"][data-category="${category}"]`).click();
  }
  await finish(page, 'ch01.wiki-sort');

  await open(page, 'ch01.s12');
  for (let i = 0; i < 7; i += 1) {
    await page.locator(`[data-testid="trip-card"][data-card="c${i + 1}"]`).click();
    await page.getByTestId('timeline-slot').nth(i).click();
  }
  await finish(page, 'ch01.trip-timeline');
});

test('the five chapter-two minigames can be completed', async ({ page, browserName }) => {
  test.skip(!hasPrivate, 'requires private content');
  test.skip(browserName !== 'chromium', 'minigame interaction coverage runs on chromium');
  test.setTimeout(120000);

  await seedChapter2(page);

  await open(page, 'ch02.s02', '49');
  const anchors = page.getByTestId('grounding-anchor');
  await expect(anchors).toHaveCount(5);
  for (let i = 0; i < 5; i += 1) await anchors.nth(i).click();
  await finish(page, 'ch02.k-hole');

  await open(page, 'ch02.s06', '49');
  const voices = page.getByTestId('voice-line');
  await expect(voices).toHaveCount(6);
  for (let i = 0; i < 6; i += 1) {
    const row = voices.nth(i);
    await row.locator('[data-testid="voice-choice"]').nth(i % 2).click();
  }
  await finish(page, 'ch02.voices');

  await open(page, 'ch02.s08', '49');
  for (let i = 0; i < 3; i += 1) {
    const layer = page.locator('[data-testid="paint-layer"][data-active="true"]');
    const layerId = await layer.getAttribute('data-layer');
    const target = await layer.getAttribute('data-target');
    for (const pigment of target?.split(',') ?? []) {
      await page.locator(`[data-testid="paint-pigment"][data-pigment="${pigment}"]`).click();
    }
    await page.getByTestId('paint-apply').click();
    await expect(
      page.locator(`[data-testid="paint-layer"][data-layer="${layerId}"]`),
    ).toHaveAttribute('data-done', 'true');
  }
  await finish(page, 'ch02.paint');

  await open(page, 'ch02.s09', '49');
  for (const [card, category] of [
    ['c1', 'inside'],
    ['c2', 'inside'],
    ['c3', 'inside'],
    ['c4', 'can'],
    ['c5', 'can'],
    ['c6', 'can'],
    ['c7', 'cannot'],
    ['c8', 'cannot'],
    ['c9', 'cannot'],
  ]) {
    await page.locator(`[data-testid="wiki-card"][data-card="${card}"]`).click();
    await page.locator(`[data-testid="wiki-category"][data-category="${category}"]`).click();
  }
  await finish(page, 'ch02.care');

  await open(page, 'ch02.s17', '49');
  for (const pair of ['e1', 'e2', 'e3', 'e4']) {
    await page.locator(`[data-testid="echo-left"][data-pair="${pair}"]`).click();
    await page.locator(`[data-testid="echo-right"][data-pair="${pair}"]`).click();
  }
  await finish(page, 'ch02.echo');
});

test('placement cards drag, options shuffle, and the timeline guides the drop', async ({
  page,
  browserName,
}) => {
  test.skip(!hasPrivate, 'requires private content');
  test.skip(browserName !== 'chromium', 'drag coverage runs on chromium');

  await open(page, 'ch01.s07');
  await expect(
    page.locator('[data-testid="forum-error"][data-error="e1"]'),
  ).toHaveAttribute('data-active', 'true');
  await expect(page.getByTestId('forum-replied')).toHaveCount(0);
  const forumOptions = await page.getByTestId('forum-option').allTextContents();
  expect(forumOptions[0]).not.toBe('愈创木酚甘油醚');

  await open(page, 'ch01.s09');
  const chatOptions = await page.getByTestId('chat-option').allTextContents();
  expect(chatOptions[0]).not.toBe('不能，血清素综合征。');

  await open(page, 'ch01.s10');
  const wikiCard = page.locator('[data-testid="wiki-card"][data-card="w1"]');
  await expect(wikiCard).toHaveAttribute('draggable', 'true');
  await wikiCard.dragTo(
    page.locator('[data-testid="wiki-category"][data-category="intro"]'),
  );
  await expect(
    page.locator('[data-testid="wiki-placed-card"][data-card="w1"]'),
  ).toHaveCount(1);

  await open(page, 'ch01.s12');
  const firstCard = page.locator('[data-testid="trip-card"][data-card="c1"]');
  await expect(firstCard).toHaveAttribute('draggable', 'true');
  await firstCard.click();
  await expect(page.getByTestId('timeline-guide')).toContainText('第 01 格');
  await expect(page.getByTestId('timeline-guide-slot')).toHaveCount(1);
  await page.locator('[data-testid="timeline-slot"][data-slot="0"]').click();
  await expect(
    page.locator('[data-testid="timeline-slot"][data-slot="0"]'),
  ).toHaveAttribute('data-filled', 'true');

  await page
    .locator('[data-testid="trip-card"][data-card="c2"]')
    .dragTo(page.locator('[data-testid="timeline-slot"][data-slot="1"]'));
  await expect(
    page.locator('[data-testid="timeline-slot"][data-slot="1"]'),
  ).toHaveAttribute('data-filled', 'true');

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await page
    .locator('[data-testid="trip-card"][data-card="c3"]')
    .dispatchEvent('dragstart', { dataTransfer });
  await expect(page.getByTestId('timeline-guide')).toContainText('第 03 格');
  await expect(page.getByTestId('timeline-guide-slot')).toHaveCount(1);
});
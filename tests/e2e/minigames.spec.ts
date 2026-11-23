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

async function seedChapter3(page: import('@playwright/test').Page) {
  await page.goto('/#/');
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = Array.from(
      new Set([...(save.completedScenes ?? []), 'ch01.s14', 'ch02.s24']),
    );
    save.readEffects = ['解离', '反解离', '幻觉', '谵妄', '镇静'];
    save.read = { ...save.read, 108: ['report-108-full'] };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.reload();
}


async function seedChapter4(page: import('@playwright/test').Page) {
  await page.goto('/#/');
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.completedScenes = Array.from(
      new Set([...(save.completedScenes ?? []), 'ch01.s14', 'ch02.s24', 'ch03.s24']),
    );
    save.readEffects = Array.from(
      new Set([...(save.readEffects ?? []), '解离', '反解离', '恢复术']),
    );
    save.read = {
      ...(save.read ?? {}),
      108: ['report-108-full'],
      104: ['report-104-full'],
      101: ['report-101-full'],
    };
    save.warTable = {
      goto: 50,
      chicken: 50,
      trust: 50,
      archive: 50,
      escalation: 1,
      decisions: {},
      flags: [],
    };
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
  for (let i = 0; i < 5; i += 1) {
    const anchor = anchors.nth(i);
    const id = await anchor.getAttribute('data-anchor');
    await anchor.click();
    await expect(page.getByTestId('grounding-backdrop')).toHaveAttribute('data-bg', id ?? '');
  }
  await finish(page, 'ch02.k-hole');

  await open(page, 'ch02.s06', '49');
  await expect(page.getByTestId('voice-backdrop')).toHaveCSS(
    'background-image',
    /bg_ch02_voices\.png/,
  );
  const voices = page.getByTestId('voice-ghost');
  const voiceIds = await voices.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-voice')).filter(Boolean),
  );
  expect(voiceIds.length).toBeGreaterThanOrEqual(20);
  for (const id of voiceIds) {
    await page.locator(`[data-testid="voice-ghost"][data-voice="${id}"]`).click();
  }
  await expect(voices).toHaveCount(0);
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
  await page.getByTestId('minigame-done').click();
  await expect(page.getByTestId('savior-glitch')).toBeVisible();
  await expect(page.getByTestId('savior-after')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('savior-category')).toHaveCount(1);
  await expect(page.getByTestId('savior-category')).toContainText('你能做的');
  await expect(page.getByTestId('savior-card')).toHaveCount(1);
  await expect(page.getByTestId('savior-card')).toContainText('你不会死');
  await expect(page.getByTestId('minigame-done')).toHaveText('关掉手机');
  await finish(page, 'ch02.care');

  await open(page, 'ch02.s19', '49');
  const archiveEnvelope = page.getByTestId('archive-envelope');
  const archiveCards = await page.getByTestId('archive-card').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-card')).filter(Boolean),
  );
  expect(archiveCards).toHaveLength(5);
  const envelopeBox = await archiveEnvelope.boundingBox();
  expect(envelopeBox).not.toBeNull();
  for (const id of archiveCards) {
    const card = page.locator(`[data-testid="archive-card"][data-card="${id}"]`);
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (!cardBox || !envelopeBox) continue;
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      envelopeBox.x + envelopeBox.width / 2,
      envelopeBox.y + envelopeBox.height * 0.2,
      { steps: 24 },
    );
    await page.mouse.up();
    await page.waitForTimeout(850);
  }
  await expect(page.getByTestId('archive-drawer')).toHaveAttribute('data-closed', 'true');
  await expect(page.getByTestId('archive-label')).toBeVisible({ timeout: 6000 });
  await expect(page.getByTestId('archive-envelope')).toHaveAttribute('data-centered', 'true');
  const archiveLabel = page.getByTestId('archive-label');
  await archiveLabel.focus();
  await page.keyboard.press('Space');
  await expect(archiveLabel.locator('[data-filled="true"]')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(archiveLabel.locator('[data-filled="true"]')).toHaveCount(2);
  await archiveLabel.click();
  await expect(archiveLabel.locator('[data-filled="true"]')).toHaveCount(3);
  await archiveLabel.click();
  await expect(archiveLabel.locator('[data-filled="true"]')).toHaveCount(4);
  await expect(page.getByTestId('archive-bleed')).toBeVisible();
  await expect(page.getByTestId('archive-black')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('minigame-overlay')).toBeHidden({ timeout: 7000 });
  await expect
    .poll(async () => (await page.getByTestId('dialog-line').textContent().catch(() => '')) ?? '', {
      timeout: 6000,
    })
    .toContain('彩加她');
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('odw.save.v1');
          return raw ? JSON.parse(raw).completedMinigames : [];
        }),
      { timeout: 4000 },
    )
    .toContain('ch02.archive');
});

test('the four chapter-three minigames can be completed', async ({ page, browserName }) => {
  test.skip(!hasPrivate, 'requires private content');
  test.skip(browserName !== 'chromium', 'minigame interaction coverage runs on chromium');
  test.setTimeout(150000);

  await seedChapter3(page);

  await open(page, 'ch03.s06', '50');
  const photos = page.getByTestId('memory-photo');
  await expect(photos).toHaveCount(5);
  const photoIds = await photos.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-photo')).filter(Boolean),
  );
  expect(photoIds).toHaveLength(5);
  for (const id of photoIds) {
    await page.locator(`[data-testid="memory-photo"][data-photo="${id}"]`).click();
  }
  await expect(page.getByTestId('memory-photo')).toHaveCount(5);
  await expect(
    page.locator('[data-testid="memory-photo"][data-blank="true"]'),
  ).toHaveAttribute('data-developed', 'true');
  await finish(page, 'ch03.afterglow');

  await open(page, 'ch03.s15', '50');
  for (const id of ['e-anxiety', 'e-resentment', 'e-fear', 'e-exhaustion', 'e-helpless']) {
    await page.locator(`[data-testid="emotion-chip"][data-emotion="${id}"]`).click();
    await page.locator(`[data-testid="emotion-source"][data-source="${id}"]`).click();
  }
  await expect(page.locator('[data-testid="emotion-chip"][data-matched="true"]')).toHaveCount(5);
  await finish(page, 'ch03.overload');

  await open(page, 'ch03.s17', '50');
  for (const id of ['pillow', 'blanket', 'cup', 'window']) {
    await page.locator(`[data-testid="anchor-tag"][data-anchor="${id}"]`).click();
    await page.locator(`[data-testid="anchor-object"][data-anchor="${id}"]`).click();
  }
  await expect(page.locator('[data-testid="anchor-object"][data-anchored="true"]')).toHaveCount(4);
  await finish(page, 'ch03.anchor');

  await open(page, 'ch03.s20', '50');
  const feeds = page.getByTestId('camera-feed');
  await expect(feeds).toHaveCount(6);
  const feedIds = await feeds.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-feed')).filter(Boolean),
  );
  expect(feedIds).toHaveLength(6);
  for (const id of feedIds) {
    await page.locator(`[data-testid="camera-feed"][data-feed="${id}"]`).click();
  }
  await expect(page.locator('[data-testid="camera-feed"][data-scanned="true"]')).toHaveCount(6);
  await finish(page, 'ch03.search');
});


test('the civil war event opens with its own cue and closes into the next scene', async ({
  page,
  browserName,
}) => {
  test.skip(!hasPrivate, 'requires private content');
  test.skip(browserName !== 'chromium', 'event coverage runs on chromium');
  test.setTimeout(45000);

  await seedChapter4(page);
  await page.goto('/#/report/51/replay/ch04.s03');
  await page.getByTestId('scene-wrap').waitFor({ state: 'visible' });
  for (let i = 0; i < 12; i += 1) {
    if (await page.getByTestId('civil-war-event').isVisible().catch(() => false)) break;
    await page.getByTestId('scene-wrap').click({ timeout: 1500 }).catch(() => undefined);
    await page.waitForTimeout(220);
  }
  const event = page.getByTestId('civil-war-event');
  await expect(event).toBeVisible();
  await expect(event).toHaveAttribute('data-cue', 'drug-war');
  await expect(event).toContainText('编辑组拒绝交涉');
  const close = page.getByTestId('civil-war-close');
  await expect(close).toBeFocused();
  await expect(close).toHaveText('骨肉再次相残。');
  await close.click();
  await expect(event).toBeHidden();
  await expect
    .poll(async () => page.url(), { timeout: 6000 })
    .toContain('/replay/ch04.s04');
  await expect(page.getByTestId('dialog-line')).toContainText('七月十九到二十一日', { timeout: 6000 });
});

test('the four chapter-four minigames can be completed', async ({ page, browserName }) => {
  test.skip(!hasPrivate, 'requires private content');
  test.skip(browserName !== 'chromium', 'minigame interaction coverage runs on chromium');
  test.setTimeout(180000);

  await seedChapter4(page);

  await open(page, 'ch04.s04', '51');
  await expect(page.getByTestId('war-table')).toBeVisible();
  await expect(page.getByTestId('war-table').locator('[data-meter="chicken"]')).toHaveAttribute(
    'data-value',
    '50',
  );
  await page.locator('[data-testid="war-choice"][data-choice="screenshot"]').click();
  await expect(page.getByTestId('war-result')).toBeVisible();
  await expect(page.getByTestId('war-table').locator('[data-meter="chicken"]')).toHaveAttribute(
    'data-value',
    '38',
  );
  await page.getByTestId('war-next').click();
  await page.locator('[data-testid="war-choice"][data-choice="full"]').click();
  await page.getByTestId('war-next').click();
  await finish(page, 'ch04.rumor');

  await open(page, 'ch04.s14', '51');
  await expect(page.getByTestId('war-table')).toBeVisible();
  await expect(page.getByTestId('war-table').locator('[data-meter="trust"]')).toHaveAttribute(
    'data-value',
    '53',
  );
  await page.locator('[data-testid="war-choice"][data-choice="muyu"]').click();
  await page.getByTestId('war-next').click();
  await page.locator('[data-testid="war-choice"][data-choice="parallel"]').click();
  await page.getByTestId('war-next').click();
  await finish(page, 'ch04.roshomon');

  await open(page, 'ch04.s20', '51');
  for (const id of ['account', 'address', 'dm', 'dox', 'head', 'byline', 'quote', 'date']) {
    await page.locator(`[data-testid="redact-line"][data-line="${id}"]`).click();
  }
  await expect(page.locator('[data-testid="redact-line"][data-redacted="true"]')).toHaveCount(4);
  await expect(page.getByTestId('redact-publish')).toBeEnabled();
  await page.getByTestId('redact-publish').click();
  await expect(page.getByTestId('war-table').locator('[data-meter="trust"]')).not.toHaveAttribute(
    'data-value',
    '53',
  );
  await finish(page, 'ch04.redact');

  await open(page, 'ch04.s27', '51');
  for (const id of ['help', 'interaction', 'schedule', 'story']) {
    await page.locator(`[data-testid="knowledge-flip"][data-card="${id}"]`).click();
    await page
      .locator(`[data-testid="knowledge-policy"][data-card="${id}"][data-policy="context"]`)
      .click();
  }
  await page.getByTestId('knowledge-compile').click();
  await finish(page, 'ch04.knowledge');

  const decisions = await page.evaluate(() => {
    const raw = localStorage.getItem('odw.save.v1');
    return raw ? Object.keys(JSON.parse(raw).warTable?.decisions ?? {}) : [];
  });
  expect(decisions).toEqual(expect.arrayContaining([
    'ch04.rumor:launch',
    'ch04.rumor:fallout',
    'ch04.roshomon:record',
    'ch04.roshomon:conclusion',
    'ch04.redact:publish',
    'ch04.knowledge:help',
    'ch04.knowledge:interaction',
    'ch04.knowledge:schedule',
    'ch04.knowledge:story',
  ]));
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
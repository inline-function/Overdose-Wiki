import { chromium } from '@playwright/test';

const SAVE = {
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: {},
  completedScenes: [],
  choices: {},
  unlocks: [],
  deck: {},
  completedMinigames: [],
  settings: {
    scale: 'auto',
    font: 'normal',
    motion: 'auto',
    contrast: 'normal',
    scanlines: true,
    spoilers: false,
    audio: { bgm: 0, sfx: 0, mute: true },
  },
  history: [],
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, reducedMotion: 'no-preference' });
page.setDefaultTimeout(6000);
await page.addInitScript((seed) => {
  localStorage.setItem('odw.save.v1', JSON.stringify(seed));
  sessionStorage.setItem(
    'odw.session.v1',
    JSON.stringify({ booted: true, loggedIn: true, loginAt: '2026-11-17T00:00:00.000Z' }),
  );
  sessionStorage.setItem('odw.test.consent', '1');
}, SAVE);

async function open(sceneId) {
  await page.goto(`http://127.0.0.1:4173/#/report/7/replay/${sceneId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  for (let i = 0; i < 8; i += 1) {
    if (await page.getByTestId('minigame-overlay').isVisible().catch(() => false)) return;
    await page.getByTestId('scene-wrap').click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(200);
  }
  throw new Error(`${sceneId}: minigame did not open`);
}

async function finish(label) {
  const done = page.getByTestId('minigame-done');
  for (let i = 0; i < 60 && !(await done.isEnabled()); i += 1) {
    await page.waitForTimeout(100);
  }
  if (!(await done.isEnabled())) {
    const caption = await page.getByTestId('minigame-caption').textContent().catch(() => '');
    throw new Error(`${label}: done disabled (${caption})`);
  }
  await done.click();
  await page.getByTestId('minigame-overlay').waitFor({ state: 'hidden', timeout: 5000 });
  console.log(label, 'PASS');
}

// 1. 余晖
await open('ch01.s04');
for (const el of await page.getByTestId('memory-fragment').all()) await el.click({ force: true });
await finish('memory-collage');

// 2. 找物
await open('ch01.s05');
for (const id of ['kettle', 'tea', 'cup']) {
  await page.locator(`[data-testid="find-object"][data-object="${id}"]`).click({ force: true });
  await page.waitForTimeout(250);
}
await finish('find-object');

// 3. 感知
await open('ch01.s06');
const words = page.getByTestId('perception-word');
console.log('perception words:', await words.count());
for (let i = 0; i < 6; i += 1) {
  await words.nth(i).click({ force: true });
  await page.waitForTimeout(120);
}
await finish('perception');

// 4. 贴吧
await open('ch01.s07');
const forum = page.getByTestId('forum-correction');
const corrections = [
  ['e1', '愈创木酚甘油醚'],
  ['e2', '不能，血清素综合征'],
  ['e3', '不能联用'],
];
for (const [id, option] of corrections) {
  await page.locator(`[data-testid="forum-error"][data-error="${id}"]`).waitFor();
  await forum.getByRole('button', { name: option, exact: true }).click();
  await page.waitForTimeout(200);
}
console.log('forum replies:', await page.getByTestId('forum-reply').count());
await finish('forum-fix');

// 5. 群聊
await open('ch01.s09');
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
    await page.getByTestId('chat-question').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(120);
  }
}
await finish('chat-triage');

// 6. Wiki
await open('ch01.s10');
const wikiPairs = [
  ['w1', 'intro'],
  ['w8', 'intro'],
  ['w2', 'branch'],
  ['w3', 'effects'],
  ['w5', 'effects'],
  ['w4', 'restore'],
  ['w6', 'restore'],
  ['w7', 'reports'],
];
for (const [card, category] of wikiPairs) {
  await page.locator(`[data-testid="wiki-card"][data-card="${card}"]`).click();
  await page.locator(`[data-testid="wiki-category"][data-category="${category}"]`).click();
  await page.waitForTimeout(100);
}
await finish('wiki-sort');

// 7. 编年
await open('ch01.s12');
const order = ['初次 od', '二次 odplus', '地狱之行昏迷不醒', '余晖的记忆恢复', '复刻却截然相反', '第五高原', '最后一次'];
for (let i = 0; i < order.length; i += 1) {
  await page.getByTestId('trip-card').filter({ hasText: order[i] }).click();
  await page.getByTestId('timeline-slot').nth(i).click();
  await page.waitForTimeout(100);
}
await finish('trip-timeline');

await browser.close();
console.log('all minigames completed');
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PASSWORD = 'to_the_Ephemeral_and_to_the_Eternal';
const MASKED = `${'*'.repeat(PASSWORD.length - 1)}${PASSWORD.slice(-1)}`;
const USER_TYPED = '@Supergogoto'.length - 1;

async function fillLogin(page: import('@playwright/test').Page) {
  const user = page.locator('input').nth(0);
  const pass = page.locator('input').nth(1);
  await expect(user).toBeFocused();
  await page.keyboard.press('a');
  await expect(user).toHaveValue('@S');
  for (let index = 1; index < USER_TYPED; index += 1) await page.keyboard.press('a');
  await expect(user).toHaveValue('@Supergogoto');
  await expect(pass).toBeFocused();
  await page.keyboard.press('a');
  await expect(pass).toHaveValue('t');
  for (let index = 1; index < PASSWORD.length; index += 1) await page.keyboard.press('a');
  await expect(pass).toHaveValue(MASKED);
  await page.keyboard.press('Enter');
}

const CONSENT_SAVE = (overrides: Record<string, unknown> = {}) => ({
  version: 1,
  consent: { version: 2, acceptedAt: '2026-11-17T00:00:00.000Z' },
  progress: { beat: 0, reportId: '7', segmentId: 'ch01.s01', sceneId: 'ch01.s01' },
  read: {},
  completedScenes: [],
  choices: {},
  unlocks: [],
  deck: {},
  settings: {
    scale: 'auto',
    font: 'normal',
    motion: 'reduce',
    contrast: 'normal',
    scanlines: false,
    spoilers: true,
    audio: { bgm: 0, sfx: 0, mute: true },
  },
  history: [],
  ...overrides,
});

test('first visit: boot, login, consent, deep link', async ({ page }) => {
  await page.goto('/#/report/7');
  await expect(page).toHaveURL(/#\/welcome/);
  await expect(page.getByTestId('boot')).toBeVisible();
  await page.getByRole('button', { name: '进入' }).click();
  await expect(page).toHaveURL(/#\/login/);
  await fillLogin(page);
  await expect(page).toHaveURL(/#\/consent/, { timeout: 5000 });
  await page.getByRole('button', { name: '同意并进入' }).click();
  await expect(page).toHaveURL(/#\/report\/7/);
});

test('reload skips boot and login but re-shows the notice', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByTestId('boot')).toBeVisible();
  await page.getByRole('button', { name: '进入' }).click();
  await expect(page).toHaveURL(/#\/login/);
  await fillLogin(page);
  await expect(page).toHaveURL(/#\/consent/, { timeout: 5000 });
  await page.getByRole('button', { name: '同意并进入' }).click();
  await expect(page).toHaveURL(/#\/$/, { timeout: 5000 });
  await page.reload();
  await expect(page).toHaveURL(/#\/consent/);
  await page.getByRole('button', { name: '同意并进入' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { name: 'Overdose Wiki' })).toBeVisible();
});

test('new tab requires login again', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  }, CONSENT_SAVE());
  await page.goto('/#/report/7');
  await expect(page).toHaveURL(/#\/welcome/);
  await expect(page.getByTestId('boot')).toBeVisible();
  await page.getByRole('button', { name: '进入' }).click();
  await expect(page).toHaveURL(/#\/login/);
  await context.close();
});

test('mobile taps fill each field in one go', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true });
  const page = await context.newPage();
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: false }),
    );
    sessionStorage.setItem('odw.test.consent', '1');
  }, CONSENT_SAVE());
  await page.goto('/#/login');
  const user = page.locator('input').nth(0);
  const pass = page.locator('input').nth(1);
  await expect(user).toHaveAttribute('placeholder', '点击此处填入用户名');
  await expect(pass).toHaveAttribute('placeholder', '点击此处填入密码');
  await user.tap();
  await pass.tap();
  await expect(user).toHaveValue('@Supergogoto');
  await expect(pass).toHaveValue(MASKED);
  await page.getByRole('button', { name: '显示' }).tap();
  await expect(pass).toHaveValue(PASSWORD);
  await page.getByRole('button', { name: '登录' }).tap();
  await expect(page).toHaveURL(/#\/$/);
  await context.close();
});

test('boot waits for Enter and keeps BGM off until login', async ({ browser, browserName }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('.mp3')) requests.push(request.url());
  });
  await page.goto('/#/welcome');
  await expect(page.getByTestId('boot-prompt')).toBeVisible();
  await page.waitForTimeout(1200);
  expect(requests).toEqual([]);

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('boot-prompt')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/login/, { timeout: 20000 });
  if (browserName === 'chromium') {
    await expect.poll(() => requests.some((url) => url.includes('title.mp3'))).toBe(true);
  }
  await context.close();
});

test('clicking the terminal also starts the boot sequence', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('/#/welcome');
  await page.getByTestId('boot-prompt').click({ force: true });
  await expect(page.getByTestId('boot-prompt')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/login/, { timeout: 20000 });
  await context.close();
});

test('reduced motion skips the animation', async ({ page }) => {
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  }, CONSENT_SAVE());
  await page.goto('/#/');
  await expect(page.getByTestId('boot')).toHaveAttribute('data-reduce', 'true');
  await page.getByRole('button', { name: '进入' }).click();
  await expect(page).toHaveURL(/#\/login/, { timeout: 3000 });
});

test('logout returns to login', async ({ page }) => {
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: true }),
    );
  }, CONSENT_SAVE());
  await page.goto('/#/settings');
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/#\/login/);
});

test('consent gate is axe clean', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'axe gate audit runs on chromium');
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: true }),
    );
  }, CONSENT_SAVE({ consent: { version: 0, acceptedAt: '' } }));
  await page.goto('/#/consent');
  await expect(page.getByTestId('consent-gate')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await context.close();
});

test('welcome and login are axe clean', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'axe gate audit runs on chromium');
  const welcomeContext = await browser.newContext({ reducedMotion: 'reduce' });
  const welcome = await welcomeContext.newPage();
  await welcome.goto('/#/welcome');
  await expect(welcome.getByTestId('boot')).toBeVisible();
  const boot = await new AxeBuilder({ page: welcome }).analyze();
  expect(boot.violations).toEqual([]);
  await welcomeContext.close();

  const loginContext = await browser.newContext();
  const login = await loginContext.newPage();
  await login.addInitScript((save) => {
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
    sessionStorage.setItem(
      'odw.session.v1',
      JSON.stringify({ booted: true, loggedIn: false }),
    );
    sessionStorage.setItem('odw.test.consent', '1');
  }, CONSENT_SAVE());
  await login.goto('/#/login');
  const dialog = await new AxeBuilder({ page: login }).analyze();
  expect(dialog.violations).toEqual([]);
  await loginContext.close();
});
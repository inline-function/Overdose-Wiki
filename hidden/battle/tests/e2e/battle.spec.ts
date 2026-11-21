import { expect, test } from './fixtures';

test('drawing a card costs AP and updates the hand', async ({ page }) => {
  await page.goto('/#/battle/battle-ch01-s03');
  await expect(page.getByTestId('battle-grid')).toBeVisible({ timeout: 15000 });
  const hand = page.getByTestId('battle-hand');
  await expect(hand.getByRole('button').filter({ hasNotText: '详情' })).toHaveCount(4);
  await page.getByRole('button', { name: /抽牌/ }).click();
  await expect(page.getByText(/手牌 5\/8 · 牌库/)).toBeVisible();
  await expect(hand.getByRole('button').filter({ hasNotText: '详情' })).toHaveCount(5);
});

test('selects only one copy of a duplicated card', async ({ page }) => {
  await page.addInitScript(() => {
    const raw = localStorage.getItem('odw.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw);
    save.deck = { caffeine: 8 };
    save.ownedCards = { ...save.ownedCards, caffeine: 8 };
    localStorage.setItem('odw.save.v1', JSON.stringify(save));
  });
  await page.goto('/#/battle/battle-ch01-s03');
  await expect(page.getByTestId('battle-grid')).toBeVisible({ timeout: 15000 });
  const hand = page.getByTestId('battle-hand');
  await hand.getByRole('button').filter({ hasNotText: '详情' }).first().click();
  await expect(hand.locator('[data-selected="true"]')).toHaveCount(1);
});

test('a selected card can be aimed at either side', async ({ page }) => {
  await page.goto('/#/battle/battle-ch01-s03');
  await expect(page.getByTestId('battle-grid')).toBeVisible({ timeout: 15000 });
  const hand = page.getByTestId('battle-hand');
  await hand.getByRole('button').filter({ hasNotText: '详情' }).first().click();
  await page.getByRole('button', { name: '对方', exact: true }).click();
  await page.getByRole('button', { name: '出牌' }).click();
  await expect(page.getByRole('log')).toContainText('对对方使用');
});

test('dragging a card onto a side plays it there', async ({ page }) => {
  await page.goto('/#/battle/battle-ch01-s03');
  await expect(page.getByTestId('battle-grid')).toBeVisible({ timeout: 15000 });
  const hand = page.getByTestId('battle-hand');
  const card = hand.getByRole('button').filter({ hasNotText: '详情' }).first();
  await card.dragTo(page.locator('section[aria-label="对方"]'));
  await expect(page.getByRole('log')).toContainText('对对方使用', { timeout: 10000 });
  await expect(hand.getByRole('button').filter({ hasNotText: '详情' })).toHaveCount(3);
  await expect(page.getByText(/手牌 3\/8/)).toBeVisible();
});

test('card detail opens without losing the battle', async ({ page }) => {
  await page.goto('/#/battle/battle-ch01-s03');
  await expect(page.getByTestId('battle-grid')).toBeVisible({ timeout: 15000 });
  const hand = page.getByTestId('battle-hand');
  await hand.getByRole('button', { name: /查看 .* 详情/ }).first().click();
  const dialog = page.getByRole('dialog', { name: '药品详情' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('单次使用');
  await expect(dialog).toContainText('血药浓度效应');
  await dialog.getByRole('button', { name: '关闭药品详情' }).click();
  await expect(hand.getByRole('button').filter({ hasNotText: '详情' })).toHaveCount(4);
});

test('drug index searches and opens a detail page', async ({ page }) => {
  await page.goto('/#/drugs');
  await expect(page.getByRole('heading', { name: '药品索引' })).toBeVisible();
  await page.getByLabel('搜索药品').fill('舍曲林');
  await page.getByRole('link', { name: /舍曲林/ }).click();
  await expect(page.getByRole('heading', { name: /舍曲林/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '单次使用' })).toBeVisible();
  await expect(page.getByText(/Function Manual/).first()).toBeVisible();
});
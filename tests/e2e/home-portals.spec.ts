import { test, expect } from '@playwright/test';
import { catalog, login, mock } from './helpers/ownerTrial';
test('disconnected homepage explains availability and keeps design samples separate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('名古屋の会食店を探す');
  await expect(page.locator('[data-home-state="disconnected"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: '店舗情報は未接続です', exact: true })).toBeVisible();
  await expect(page.getByRole('search')).toHaveCount(0);
  await expect(page.locator('.home-catalog-preparing, .editorial-home img, .restaurant-card')).toHaveCount(0);
  await page.goto('/#/demo');
  await expect(page.getByText('SAMPLE / DESIGN DEMO', { exact: true })).toBeVisible();
  await expect(page.locator('.restaurant-card')).toHaveCount(3);
});

test('mocked invited homepage passes actual name and cuisine filters to the private catalog', async ({ page }) => {
  // Intercepted fixtures verify UI routing, not live database availability.
  await login(page); const state = await mock(page); await page.goto('http://127.0.0.1:4181');
  const row = catalog[0];
  const genre = row.facts.find(fact => fact.field === 'genre')!.value;
  await page.getByRole('searchbox', { name: '店名・エリアから探す', exact: true }).fill(row.name);
  await page.getByRole('combobox', { name: '料理', exact: true }).selectOption(genre);
  await page.getByRole('button', { name: '一覧で探す', exact: true }).click();
  await expect(page).toHaveURL(/#\/nagoya\?query=/);
  await expect(page.locator('.catalog-search input')).toHaveValue(row.name);
  await expect(page.getByRole('combobox', { name: '非公開テストの料理', exact: true })).toHaveValue(genre);
  await expect(page.locator(`[data-pilot-id="${row.id}"]`)).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-home-state="available"]')).toBeVisible();
  expect(state.calls.some(call => /submit|moderate|prepare_profile|delete|withdraw/.test(call.name))).toBe(false);
});
test('both portals work through desktop and mobile navigation, history and reload', async ({ page, isMobile }) => {
  await page.goto('/');
  for (const [label, route, heading] of [['店舗の方へ', 'restaurants', '会食を考える人に、 お店の魅力を。'], ['法人の方へ', 'corporate', 'エンタープライズプラン']]) {
    if (isMobile) await page.getByRole('button', {name:'メニューを開く'}).click();
    await page.getByRole('button', {name:label, exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await expect(page.getByRole('heading', {name:heading, exact:true})).toBeVisible();
    await expect(page.locator('dialog')).not.toBeVisible();
    await expect(page.locator('input, textarea, form')).toHaveCount(0);
    if (route === 'restaurants') {
      await page.getByRole('button', {name:'相談前の確認リストを見る',exact:true}).click();
      await expect(page.locator('#consultation')).toBeFocused();
    }
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:async()=>{throw new Error('blocked')}}}); });
    await page.getByRole('button', {name:route === 'corporate' ? '相談メモをコピー' : '確認リストをコピー',exact:true}).click();
    await expect(page.getByRole('status')).toContainText(route === 'corporate' ? '下の相談メモを選択' : '下の確認リストを選択');
    await page.reload();
    await expect(page.getByRole('heading', {name:heading, exact:true})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('名古屋の会食店を探す');
    await page.goForward();
    await expect(page.getByRole('heading', {name:heading, exact:true})).toBeVisible();
    await page.getByRole('button', {name:'Executive Dining ホーム'}).click();
  }
});
test('mocked invited homepage keeps demo and corporate pages separate from private data', async ({page}) => {
  await login(page); await mock(page); await page.goto('http://127.0.0.1:4181');
  await expect(page.locator('.home-access-note')).toContainText('招待アカウント向けの非公開情報');
  await expect(page.locator('.private-mode-banner')).toHaveCount(0);
  await page.getByRole('link', { name: '全10店を見る', exact: true }).click();
  await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:4181/#/demo');
  await expect(page.locator('.private-mode-banner')).toHaveCount(0);
  await page.goto('http://127.0.0.1:4181/#/corporate');
  await expect(page.locator('.private-mode-banner')).toHaveCount(0);
});

test('home keeps area information and audience links secondary without implying search is available', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-home-state="disconnected"]')).toBeVisible();
  await expect(page.locator('.city-list')).toHaveCount(0);
  await expect(page.locator('.home-closing')).toContainText('名古屋');
  await expect(page.locator('.home-find .home-audience-links')).toHaveCount(0);
  await expect(page.getByRole('search')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const [label, route] of [['法人導入のご案内', 'corporate'], ['店舗掲載のご案内', 'restaurants']]) {
    await page.locator('.home-closing').getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await page.goBack();
    await expect(page.locator('.home-closing')).toContainText('名古屋');
  }
});

test('enterprise page is concise, honest and copies an unsent consultation memo', async ({page}) => {
  await page.goto('/#/corporate');
  await expect(page.getByRole('heading',{name:'エンタープライズプラン',exact:true})).toBeVisible();
  await expect(page.locator('.enterprise-features article')).toHaveCount(3);
  await expect(page.locator('.enterprise-intro')).toContainText('会社が会員利用料を負担');
  await expect(page.locator('.enterprise-meal-note')).toContainText('飲食代は会員利用料とは別にお支払いいただく想定');
  await expect(page.locator('.enterprise-hero')).toContainText('提供準備中');
  await expect(page.locator('.concept-membership, .corporate-audience-switch, details, form, input, textarea')).toHaveCount(0);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async (text:string)=>{if(!text.includes('対象となる社員数'))throw new Error('incorrect memo')}}}); });
  await page.getByRole('button',{name:'相談メモをコピー',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('相談メモをコピーしました。送信はしていません。');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

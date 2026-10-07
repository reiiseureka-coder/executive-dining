import { test, expect } from '@playwright/test';
import { login, mock } from './helpers/ownerTrial';
test('real homepage preserves design, searches real catalog and keeps samples separate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /大切な話を、\s*心地よい一席で。/ })).toBeVisible();
  await expect(page.locator('.hero-figure img')).toHaveAttribute('alt', /掲載店舗の写真ではありません/);
  await expect(page.locator('.restaurant-card')).toHaveCount(0);
  await page.getByRole('searchbox').fill('名古屋浅田');
  await page.getByRole('button', { name: '探す', exact: true }).click();
  await expect(page).toHaveURL(/#\/nagoya\?query=/);
  await expect(page.getByRole('textbox', { name: '名古屋の確認済み店舗を検索' })).toHaveValue('名古屋浅田');
  await page.goBack();
  await expect(page.getByRole('heading', { name: /大切な話を、\s*心地よい一席で。/ })).toBeVisible();
  await page.goto('/#/demo');
  await expect(page.getByText('SAMPLE / DESIGN DEMO', {exact: true})).toBeVisible();
  await expect(page.locator('.restaurant-card')).toHaveCount(3);
});
test('both portals work through desktop and mobile navigation, history and reload', async ({ page, isMobile }) => {
  await page.goto('/');
  for (const [label, route, heading] of [['店舗の方へ', 'restaurants', 'お店の魅力を、 必要とする一席へ。'], ['法人の方へ', 'corporate', '会社から、 社員の食の楽しみを。']]) {
    if (isMobile) await page.getByRole('button', {name:'メニューを開く'}).click();
    await page.getByRole('button', {name:label, exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await expect(page.getByRole('heading', {name:heading, exact:true})).toBeVisible();
    await expect(page.locator('dialog')).not.toBeVisible();
    await expect(page.locator('input, textarea, form')).toHaveCount(0);
    await page.getByRole('button', {name:'相談前の確認リストを見る'}).click();
    await expect(page.locator('#consultation')).toBeFocused();
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText:async()=>{throw new Error('blocked')}}}); });
    await page.getByRole('button', {name:'確認リストをコピー'}).click();
    await expect(page.getByRole('status')).toContainText('下の確認リストを選択');
    await page.reload();
    await expect(page.getByRole('heading', {name:heading, exact:true})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goBack();
    await expect(page.getByRole('heading', {name:/大切な話を、\s*心地よい一席で。/})).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('heading', {name:heading, exact:true})).toBeVisible();
    await page.getByRole('button', {name:'Executive Dining ホーム'}).click();
  }
});
test('owner homepage does not mislabel demo or corporate page as real private data', async ({page}) => {
  await login(page); await mock(page); await page.goto('http://127.0.0.1:4181');
  await expect(page.getByText('招待アカウントでログイン中。', {exact:false})).toBeVisible();
  await expect(page.locator('.private-mode-banner')).toHaveCount(0);
  await page.getByRole('button',{name:'店舗一覧へ',exact:true}).click();
  await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
  await page.goto('http://127.0.0.1:4181/#/demo');
  await expect(page.locator('.private-mode-banner')).toHaveCount(0);
  await page.goto('http://127.0.0.1:4181/#/corporate');
  await expect(page.locator('.private-mode-banner')).toHaveCount(0);
});

test('corporate membership centers employer-funded employee access without promising meals or partners', async ({page}) => {
  await page.goto('/#/corporate');
  await expect(page.getByRole('heading',{name:'会社が利用料を負担',exact:true})).toBeVisible();
  await expect(page.getByText('飲食代の補助とは別のプランです。',{exact:false})).toBeVisible();
  await page.getByText('社員の飲食代も含まれますか？',{exact:true}).click();
  await expect(page.getByText('飲食代の負担や食事補助は含む前提ではなく、別途検討が必要です。',{exact:false})).toBeVisible();
  await expect(page.getByText('M&A',{exact:false})).toHaveCount(0);
});

test('homepage presents four cities in order with only Nagoya enabled', async ({page}) => {
  await page.goto('/');
  const cities = page.locator('.city-list button');
  await expect(cities.locator('strong')).toHaveText(['東京', '大阪', '名古屋', '福岡']);
  for (const index of [0, 1, 3]) {
    await expect(cities.nth(index)).toBeDisabled();
    await expect(cities.nth(index)).toContainText('準備中');
  }
  await expect(cities.nth(2)).toBeEnabled();
  await expect(page.getByText('まずは、名古屋の一席から。',{exact:true})).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await cities.nth(2).click();
  await expect(page).toHaveURL(/#\/nagoya$/);
  await expect(page.getByRole('heading',{name:'名古屋の掲載情報を準備しています',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page.locator('.city-list button strong')).toHaveText(['東京', '大阪', '名古屋', '福岡']);
});

import { test, expect } from '@playwright/test';
const date = '2026-10-05T00:00:00Z';
const fixture = {
  id: 'test-restaurant', status: 'verified', name: '検証用名古屋レストラン', address: '名古屋市中区（テスト）', verifiedAt: date,
  facts: [
    { field: 'website', value: 'https://example.com', sourceUrl: 'https://example.com', provider: 'official', licenses: [], attributions: [], fetchedAt: date, verifiedAt: date },
    { field: 'private_room', value: '半個室 4〜6名', sourceUrl: 'https://example.com/rooms', provider: 'official', licenses: [], attributions: [], fetchedAt: date, verifiedAt: date },
  ], reviews: [],
};
test('default preview preserves sample search, gated curation, and route history', async ({ page }) => {
  await page.goto('/#/nagoya');
  await expect(page.getByRole('heading', { name: '名古屋の掲載情報を準備しています' })).toBeVisible();
  await expect(page.getByText('確認済み掲載 0件')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('link', { name: '運営者向け審査' }).click();
  await expect(page.getByRole('heading', { name: '管理機能は接続準備中です' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: '名古屋の掲載情報を準備しています' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('確認済み掲載 0件')).toBeVisible();
  await page.getByRole('link', { name: /サンプルで検索画面/ }).click();
  await expect(page.getByText('サンプル', { exact: false }).first()).toBeVisible();
  await expect(page.locator('.restaurant-card')).toHaveCount(6);
});
test('map failure keeps list usable, attribution visible, and repeated close/open safe', async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', route => route.abort());
  await page.goto('/#/nagoya');
  await page.getByRole('button', { name: '地図を表示' }).click();
  await expect(page.getByText('確認済みの位置：0件。位置が未確認のお店は表示しません。')).toBeVisible();
  await expect(page.getByText('地図を読み込めませんでした。店舗情報は一覧から確認できます。')).toBeVisible();
  await expect(page.getByRole('link', { name: '© OpenStreetMap contributors', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '地図を閉じる' }).click();
  await expect(page.locator('.catalog-map')).toHaveCount(0);
  await page.getByRole('button', { name: '地図を表示' }).click();
  await expect(page.locator('.catalog-map')).toHaveCount(1);
});
test('verified RPC facts display, unknown stays unknown, and sources are readable', async ({ page }) => {
  await page.route('https://test-project.supabase.co/**', async route => {
    if (route.request().url().endsWith('/rpc/dining_public_catalog')) await route.fulfill({ json: [fixture, { ...fixture, id: 'hidden', name: '未確認の候補', status: 'candidate' }] });
    else await route.fulfill({ json: [] });
  });
  await page.goto('http://127.0.0.1:4181/#/nagoya');
  await expect(page.getByRole('heading', { name: fixture.name })).toBeVisible();
  await expect(page.getByText('未確認の候補')).toHaveCount(0);
  await expect(page.getByText('確認済み掲載 1件')).toBeVisible();
  await expect(page.getByText('公開された口コミはまだありません。')).toBeVisible();
  await page.getByText('出典・確認日を見る').click();
  await expect(page.getByRole('link', { name: '個室の出典' })).toHaveAttribute('href', 'https://example.com/rooms');
  await page.getByRole('textbox', { name: '名古屋の確認済み店舗を検索' }).fill('半個室 名古屋');
  await expect(page.getByText('確認済み掲載 1件')).toBeVisible();
  await page.getByRole('textbox', { name: '名古屋の確認済み店舗を検索' }).fill('存在しない');
  await expect(page.getByRole('heading', { name: '条件に合うお店がありません' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('RPC error is explicit and retry recovers without fallback fake data', async ({ page }) => {
  let attempts = 0;
  await page.route('https://test-project.supabase.co/**', async route => {
    if (route.request().url().endsWith('/rpc/dining_public_catalog')) {
      attempts++;
      await route.fulfill(attempts === 1 ? { status: 500, json: { message: 'unavailable' } } : { json: [fixture] });
    } else await route.fulfill({ json: [] });
  });
  await page.goto('http://127.0.0.1:4181/#/nagoya');
  await expect(page.getByRole('heading', { name: '掲載情報を取得できません' })).toBeVisible();
  await page.getByRole('button', { name: '再読み込み' }).click();
  await expect(page.getByRole('heading', { name: fixture.name })).toBeVisible();
});
test('signed-out curation never requests the editorial queue', async ({ page }) => {
  const calls: string[] = [];
  await page.route('https://test-project.supabase.co/**', async route => { calls.push(route.request().url()); await route.fulfill({ json: [] }); });
  await page.goto('http://127.0.0.1:4181/#/curation');
  await expect(page.getByRole('heading', { name: '運営者のログインが必要です' })).toBeVisible();
  expect(calls.some(url => url.includes('dining_editor_queue'))).toBe(false);
});

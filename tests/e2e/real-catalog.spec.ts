import { test, expect, type Page } from '@playwright/test';
const base = 'http://127.0.0.1:4181';
const stamp = '2026-10-05T00:00:00Z';
const fact = (field: string, value: string) => ({ field, value, sourceUrl: `https://example.com/${field}`, provider: 'official', licenses: [], attributions: [], fetchedAt: stamp, verifiedAt: stamp });
const rows = [
  { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', status: 'verified', name: '検証用 日本料理店', address: '名古屋市中区 栄（検証用）', verifiedAt: stamp, reviews: [], facts: [fact('name', '検証用 日本料理店'), fact('address', '名古屋市中区 栄（検証用）'), fact('website', 'https://example.com/japanese'), fact('genre', '日本料理'), fact('private_room', '半個室 4〜6名。防音性は未確認'), fact('price', '夜会席16,500円、税込・サービス料15%別、平日席料別'), fact('notice', '2026年10月5日は休業。再開後の空席は要確認'), fact('coordinates', '136.9,35.17')] },
  { id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', status: 'verified', name: '検証用 中国料理店', address: '名古屋市中区 伏見（検証用）', verifiedAt: stamp, reviews: [], facts: [fact('name', '検証用 中国料理店'), fact('address', '名古屋市中区 伏見（検証用）'), fact('website', 'https://example.com/chinese'), fact('genre', '中国料理')] },
];
async function mockCatalog(page: Page, recordRequest?: () => void) {
  await page.route('https://tiles.openfreemap.org/**', route => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9eddf' } }] } }));
  await page.route('https://test-project.supabase.co/**', async route => {
    if (route.request().url().endsWith('/rpc/dining_public_catalog')) { recordRequest?.(); await route.fulfill({ json: rows }); }
    else await route.fulfill({ json: [] });
  });
}
test('homepage and primary search use real catalog, while six-sample demo stays explicit', async ({ page, isMobile }) => {
  await mockCatalog(page); await page.goto(base);
  await expect(page.getByText('確認済み掲載 2件')).toBeVisible();
  await expect(page.locator('.restaurant-card')).toHaveCount(0);
  if (isMobile) await page.getByRole('button', { name: 'メニューを開く' }).click();
  await page.getByRole('button', { name: 'お店を探す', exact: true }).click();
  await expect(page).toHaveURL(`${base}/#/nagoya`);
  await page.getByRole('link', { name: 'サンプル・デモ', exact: true }).click();
  await expect(page.getByText('掲載サンプル 6 店')).toBeVisible();
  await page.getByRole('button', { name: 'すべてのお店', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'サンプルで検索を試す。' })).toBeVisible();
  await expect(page.locator('.restaurant-card')).toHaveCount(6);
});
test('real filters, saved candidates and detail URLs preserve price/closure evidence across history and reload', async ({ page }) => {
  let calls = 0; await mockCatalog(page, () => { calls++; });
  await page.goto(base);
  await page.getByRole('textbox', { name: '名古屋の確認済み店舗を検索' }).fill('栄 半個室');
  await page.getByLabel('料理', { exact: true }).selectOption('日本料理');
  await page.getByLabel('確認できる情報', { exact: true }).selectOption('price');
  await expect(page.getByText('確認済み掲載 1件')).toBeVisible();
  await page.getByRole('button', { name: `候補に保存：${rows[0].name}`, exact: true }).click();
  await page.getByLabel('保存した候補のみ', { exact: true }).check();
  const listUrl = page.url();
  await page.getByRole('button', { name: '詳細と確認情報を見る', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/nagoya/${rows[0].id}`));
  await expect(page.getByRole('heading', { name: rows[0].name })).toBeVisible();
  await expect(page.getByText('夜会席16,500円、税込・サービス料15%別、平日席料別')).toBeVisible();
  await expect(page.getByText('2026年10月5日は休業。再開後の空席は要確認')).toBeVisible();
  expect(calls).toBe(1);
  await page.goBack(); await expect(page).toHaveURL(listUrl);
  await expect(page.getByLabel('保存した候補のみ', { exact: true })).toBeChecked();
  await page.goForward(); await expect(page.getByRole('heading', { name: rows[0].name })).toBeVisible();
  await page.reload(); await expect(page.getByRole('button', { name: `候補から外す：${rows[0].name}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '検索条件を保って一覧へ', exact: true }).click();
  await expect(page).toHaveURL(listUrl);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('map pins follow real filters without reloading the base style and missing positions stay absent', async ({ page }) => {
  await mockCatalog(page); let styles = 0;
  await page.route('https://tiles.openfreemap.org/**', route => { styles++; return route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9eddf' } }] } }); });
  await page.goto(base); await page.getByRole('button', { name: '地図を表示' }).click();
  await expect(page.locator('.catalog-map')).toHaveAttribute('data-map-status', 'ready');
  await expect(page.locator('.restaurant-map-pin')).toHaveCount(1);
  const beforeFilter = styles;
  await page.getByRole('button', { name: `${rows[0].name}の掲載情報を表示`, exact: true }).click();
  await expect(page.locator(`#verified-${rows[0].id}`)).toHaveClass(/is-selected/);
  await page.getByLabel('料理', { exact: true }).selectOption('中国料理');
  await expect(page.locator('.restaurant-map-pin')).toHaveCount(0);
  await expect(page.getByText('確認済み掲載 1件')).toBeVisible();
  expect(styles).toBe(beforeFilter);
});
test('saved storage failure is visible and no successful durable-save claim is made', async ({ page }) => {
  await mockCatalog(page);
  await page.addInitScript(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'executive-dining:verified-saved:v1') throw new DOMException('Blocked', 'QuotaExceededError'); return original.call(this, key, value); }; });
  await page.goto(base);
  await page.getByRole('button', { name: `候補に保存：${rows[0].name}`, exact: true }).click();
  await expect(page.getByText('ブラウザの保存領域が使えないため、候補は再読み込みで消える場合があります。')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: `候補に保存：${rows[0].name}`, exact: true })).toHaveAttribute('aria-pressed', 'false');
});
test('missing or unpublished detail stays unavailable without substituting sample data', async ({ page }) => {
  await page.route('https://test-project.supabase.co/**', route => route.fulfill({ json: [] }));
  await page.goto(`${base}/#/nagoya/${rows[0].id}?query=栄`);
  await expect(page.getByRole('heading', { name: 'この店舗の公開情報は見つかりません' })).toBeVisible();
  await expect(page.locator('.restaurant-card')).toHaveCount(0);
  await page.getByRole('button', { name: '一覧へ戻る', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '名古屋の確認済み店舗を検索' })).toHaveValue('栄');
});

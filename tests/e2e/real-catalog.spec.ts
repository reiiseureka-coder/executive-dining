import { test, expect, type Page } from '@playwright/test';
const base = 'http://127.0.0.1:4181';
const stamp = '2026-10-05T00:00:00Z';
const fact = (field: string, value: string) => ({ field, value, sourceUrl: `https://example.com/${field}`, provider: 'official', licenses: [], attributions: [], fetchedAt: stamp, verifiedAt: stamp });
const rows = [
  { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', status: 'verified', name: '検証用 日本料理店', address: '名古屋市中区 栄（検証用）', verifiedAt: stamp, reviews: [], facts: [fact('name', '検証用 日本料理店'), fact('address', '名古屋市中区 栄（検証用）'), fact('website', 'https://example.com/japanese'), fact('genre', '日本料理'), fact('private_room', '半個室 4〜6名。防音性は未確認'), fact('price', '夜会席16,500円、税込・サービス料15%別、平日席料別'), fact('notice', '2026年10月5日は休業。再開後の空席は要確認'), fact('coordinates', '136.9,35.17')] },
  { id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', status: 'verified', name: '検証用 中国料理店', address: '名古屋市中区 伏見（検証用）', verifiedAt: stamp, reviews: [], facts: [fact('name', '検証用 中国料理店'), fact('address', '名古屋市中区 伏見（検証用）'), fact('website', 'https://example.com/chinese'), fact('genre', '中国料理')] },
];
async function mockCatalog(page: Page, recordRequest?: () => void, catalog = rows) {
  await page.route('https://tiles.openfreemap.org/**', route => route.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9eddf' } }] } }));
  await page.route('https://test-project.supabase.co/**', async route => {
    if (route.request().url().endsWith('/rpc/dining_public_catalog')) { recordRequest?.(); await route.fulfill({ json: catalog }); }
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

test('compare preserves conditions and unknown fields through detail, history and reload', async ({ page }) => {
  await mockCatalog(page); await page.goto(base);
  for (const row of rows) await page.getByRole('button', { name: `比較に追加：${row.name}`, exact: true }).click();
  await page.getByRole('button', { name: '選んだお店を比較', exact: true }).click();
  const comparisonUrl = page.url();
  await expect(page.getByRole('heading', { name: '会食の候補を、並べて確認。' })).toBeVisible();
  const table = page.getByRole('table');
  await expect(table.getByText('夜会席16,500円、税込・サービス料15%別、平日席料別')).toBeVisible();
  await expect(table.getByText('2026年10月5日は休業。再開後の空席は要確認')).toBeVisible();
  await expect(table.getByRole('cell', { name: '未確認', exact: true })).toHaveCount(7);
  await expect(table.getByRole('link', { name: '出典', exact: true }).first()).toHaveAttribute('href', 'https://example.com/genre');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '店舗の詳細を見る', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: rows[0].name })).toBeVisible();
  await page.goBack(); await expect(page).toHaveURL(comparisonUrl);
  await page.goForward(); await page.reload();
  await page.getByRole('button', { name: '比較に戻る', exact: true }).click();
  await expect(page).toHaveURL(comparisonUrl);
  await page.getByRole('button', { name: '一覧へ戻る', exact: true }).click();
  await expect(page.getByText('2 / 3店を選択', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '選択を解除', exact: true }).click();
  await expect(page.getByRole('complementary', { name: '比較する候補' })).toHaveCount(0);
});
test('comparison selection is capped at three, survives reload and can be changed', async ({ page }) => {
  const extra = ['cccccccc-cccc-4ccc-cccc-cccccccccccc', 'dddddddd-dddd-4ddd-dddd-dddddddddddd'].map((id, index) => ({ ...rows[1], id, name: `検証用 追加店${index + 1}`, facts: rows[1].facts.map(item => item.field === 'name' ? { ...item, value: `検証用 追加店${index + 1}` } : item) }));
  const catalog = [...rows, ...extra]; await mockCatalog(page, undefined, catalog); await page.goto(base);
  for (const row of catalog.slice(0, 3)) await page.getByRole('button', { name: `比較に追加：${row.name}`, exact: true }).click();
  const fourth = page.getByRole('button', { name: `比較に追加：${extra[1].name}`, exact: true });
  await expect(fourth).toBeDisabled(); await page.reload();
  await expect(page.getByText('3 / 3店を選択', { exact: true })).toBeVisible(); await expect(fourth).toBeDisabled();
  await page.getByRole('button', { name: `比較から外す：${rows[0].name}`, exact: true }).click();
  await expect(fourth).toBeEnabled(); await fourth.click();
  await page.getByRole('button', { name: '選んだお店を比較', exact: true }).click();
  await expect(page.getByRole('table').getByRole('columnheader')).toHaveCount(4);
});
test('manual comparison link excludes private URL text and opens with no local selections', async ({ page, browser }) => {
  await mockCatalog(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } } }));
  await page.goto(`${base}/?company=PrivateCompany#/compare?ids=${rows.map(row => row.id).join(',')}&query=PrivatePerson&date=tomorrow`);
  await page.getByRole('button', { name: '比較リンクをコピー', exact: true }).click();
  const input = page.getByRole('textbox', { name: '手動コピー用の比較リンク' });
  await expect(input).toBeVisible();
  const shared = await input.inputValue();
  expect(shared).toBe(`${base}/#/compare?ids=${rows[0].id}%2C${rows[1].id}`);
  const recipient = await browser.newContext(); const other = await recipient.newPage();
  await mockCatalog(other); await other.goto(shared);
  await expect(other.getByRole('heading', { name: rows[0].name })).toBeVisible();
  await expect(other.getByRole('heading', { name: rows[1].name })).toBeVisible();
  expect(await other.evaluate(() => localStorage.getItem('executive-dining:comparison:v1'))).toBeNull();
  await recipient.close();
});
test('comparison copy reports success only after the clipboard accepts the identifiers-only link', async ({ page }) => {
  await mockCatalog(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as unknown as { copiedComparison: string }).copiedComparison = text; } } }));
  await page.goto(`${base}/#/compare?ids=${rows[0].id},${rows[1].id}`);
  await page.getByRole('button', { name: '比較リンクをコピー', exact: true }).click();
  await expect(page.getByText('比較リンクをコピーしました。', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { copiedComparison: string }).copiedComparison)).toBe(`${base}/#/compare?ids=${rows[0].id}%2C${rows[1].id}`);
});
test('shared comparisons do not restore unpublished or invalid identifiers from local data', async ({ page }) => {
  await mockCatalog(page, undefined, [rows[1]]);
  await page.goto(`${base}/#/compare?ids=${rows[0].id},${rows[1].id}`);
  await expect(page.getByText('表示可能な候補 1 / 2件', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: rows[0].name })).toHaveCount(0);
  await page.goto(`${base}/#/compare?ids=${rows[0].id}`);
  await expect(page.getByRole('heading', { name: '比較できる公開情報がありません' })).toBeVisible();
  await page.goto(`${base}/#/compare?ids=invalid`);
  await expect(page.getByRole('heading', { name: '比較できる公開情報がありません' })).toBeVisible();
  await expect(page.locator('.restaurant-card')).toHaveCount(0);
});
test('comparison storage failure is visible and clearing remains possible', async ({ page }) => {
  await mockCatalog(page);
  await page.addInitScript(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'executive-dining:comparison:v1') throw new DOMException('Blocked', 'QuotaExceededError'); return original.call(this, key, value); }; });
  await page.goto(base); await page.getByRole('button', { name: `比較に追加：${rows[0].name}`, exact: true }).click();
  await expect(page.getByText('比較候補の変更を保存できませんでした。再読み込みで選択が失われる場合があります。')).toBeVisible();
  await page.getByRole('button', { name: '選択を解除', exact: true }).click();
  await expect(page.getByText('0 / 3店を選択', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '選んだお店を比較', exact: true })).toBeDisabled();
  await page.reload(); await expect(page.getByRole('button', { name: `比較に追加：${rows[0].name}`, exact: true })).toHaveAttribute('aria-pressed', 'false');
});

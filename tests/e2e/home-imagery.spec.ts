import { test, expect, type Locator } from '@playwright/test';
import { catalog, login, mock } from './helpers/ownerTrial';
const base = 'http://127.0.0.1:4181';

// The approved samples are UI illustrations, never evidence about a specific venue.
async function illustrativeImages(scope: Locator, count: number) {
  await expect(scope.locator('img:visible')).toHaveCount(count);
  const figures = scope.locator('figure:visible:has(img)');
  await expect(figures).toHaveCount(count);
  for (const figure of await figures.all()) {
    await expect(figure.locator('img')).toHaveCount(1);
    await expect(figure.locator('img')).toHaveAttribute('src', /^\/images\/dining-(japanese|chinese|room)\.webp$/);
    await expect(figure.locator('img')).toHaveAttribute('alt', /実店舗|実際の店舗/);
    const caption = figure.locator('figcaption');
    await expect(caption).toBeVisible();
    await expect(caption.getByText('実店舗の写真ではないイメージ画像', { exact: true })).toBeVisible();
    await expect(caption.getByText('生成 / UI確認用', { exact: true })).toBeVisible();
  }
}
// All connected states below use intercepted RPC fixtures, not a live backend.
test('mocked anonymous discovery distinguishes public preparation without private catalog reads', async ({ page, isMobile }, info) => {
  const state = await mock(page); await page.goto(`${base}/#/find`);
  await expect(page.locator('[data-home-state="preparing"]')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('名古屋の会食店、公開準備中');
  await expect(page.locator('.home-catalog-preparing')).toHaveCount(1);
  await expect(page.getByRole('search')).toHaveCount(0);
  await expect(page.locator('[data-home-restaurant], .editorial-home img, .quick-links')).toHaveCount(0);
  expect(state.calls.some(call => call.name.startsWith('dining_owner_trial_'))).toBe(false);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: info.outputPath(`find-preparing-fixture-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: isMobile ? 390 : 1280, height: 900 });
  const navigation = page.getByRole('navigation', { name: isMobile ? 'サービスナビゲーション' : 'メインナビゲーション', exact: true });
  await navigation.getByRole('button', { name: 'ホーム', exact: true }).click();
  await expect(page).toHaveURL(`${base}/#/`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('会食専用口コミサイト');
  await page.goBack();
  await expect(page).toHaveURL(`${base}/#/find`);
  await expect(page.locator('[data-home-state="preparing"]')).toBeVisible();
});

test('mocked public loading and failure do not expose search, and retry reaches preparation', async ({ page }) => {
  const state = await mock(page);
  let release = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  let fail = true;
  await page.route('**/rest/v1/rpc/dining_public_catalog', async route => {
    await pending;
    await route.fulfill(fail ? { status: 503, json: { code: 'unavailable', message: 'fixture failure' } } : { json: [] });
  });
  await page.goto(`${base}/#/find`);
  await expect(page.locator('[data-home-state="loading"]')).toBeVisible();
  await expect(page.getByRole('search')).toHaveCount(0);
  release();
  await expect(page.locator('[data-home-state="error"]')).toBeVisible();
  await expect(page.getByRole('search')).toHaveCount(0);
  await expect(page.locator('.home-catalog-preparing')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: '再読み込み', exact: true }).click();
  await expect(page.locator('[data-home-state="preparing"]')).toBeVisible();
  expect(state.calls.some(call => call.name.startsWith('dining_owner_trial_'))).toBe(false);
});

test('mocked available public discovery previews full decision facts without private reads', async ({ page }) => {
  const state = await mock(page);
  const publicRows = catalog.map(row => ({ id: row.id, name: row.name, address: row.address, status: 'verified', verifiedAt: row.factsCheckedAt, facts: row.facts, reviews: [] }));
  await page.route('**/rest/v1/rpc/dining_public_catalog', route => route.fulfill({ json: publicRows }));
  await page.goto(`${base}/#/find`);
  await expect(page.locator('[data-home-state="available"]')).toBeVisible();
  await expect(page.getByRole('searchbox', { name: '店名・エリアから探す', exact: true })).toBeVisible();
  const first = [...publicRows].sort((a, b) => a.name.localeCompare(b.name, 'ja'))[0];
  const card = page.locator(`[data-home-restaurant="${first.id}"]`);
  await expect(card.locator('[data-fact="price"] dd')).toHaveText(first.facts.find(fact => fact.field === 'price')!.value);
  await expect(card.locator('[data-fact="private_room"] dd')).toHaveText(first.facts.find(fact => fact.field === 'private_room')!.value);
  await expect(card.locator('[data-fact="price"] dd, [data-fact="private_room"] dd')).toHaveCount(2);
  await expect(card.locator('details')).toHaveCount(0);
  await illustrativeImages(card, 1);
  await expect(page.locator('.home-access-note')).toHaveCount(0);
  expect(state.calls.some(call => call.name.startsWith('dining_owner_trial_'))).toBe(false);
});

test('mocked invited discovery preserves full conditions, detail history and logout with labeled illustrative images', async ({ page, isMobile }, info) => {
  await login(page); const state = await mock(page); await page.goto(`${base}/#/find`);
  const cards = page.locator('[data-home-restaurant]'); await expect(cards).toHaveCount(3);
  const expected = [...catalog].sort((a, b) => a.name.localeCompare(b.name, 'ja')).slice(0, 3);
  await expect(cards.locator('h3')).toHaveText(expected.map(row => row.name));
  await expect(page.locator('.home-access-note')).toContainText('非公開情報');
  for (const row of expected) {
    const card = page.locator(`[data-home-restaurant="${row.id}"]`);
    await expect(card.locator('[data-fact="price"] dd')).toHaveText(row.facts.find(fact => fact.field === 'price')?.value ?? '未確認');
    await expect(card.locator('[data-fact="private_room"] dd')).toHaveText(row.facts.find(fact => fact.field === 'private_room')?.value ?? '未確認');
    await expect(card.locator('[data-fact="price"] dd')).toBeVisible();
    await expect(card.locator('[data-fact="private_room"] dd')).toBeVisible();
  }
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await illustrativeImages(page.locator('.home-discovery-list'), expected.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: info.outputPath(`find-available-private-fixture-${width}.png`), fullPage: true });
  }
  await cards.first().getByRole('link').click();
  await illustrativeImages(page.locator('.pilot-detail'), 2);
  await expect(page.locator('.pilot-detail').getByRole('heading', { name: expected[0].name, exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('detail-private-fixture.png'), fullPage: true });
  await page.goBack(); await expect(cards).toHaveCount(3); await page.goForward(); await page.reload();
  await expect(page.locator('.pilot-detail').getByRole('heading', { name: expected[0].name, exact: true })).toBeVisible();
  await page.goto(`${base}/#/find`); await expect(cards).toHaveCount(3);
  await page.setViewportSize({ width: isMobile ? 390 : 1280, height: 900 });
  if (isMobile) await page.getByRole('button', { name: 'メニューを開く', exact: true }).click();
  await page.getByRole('button', { name: 'アカウント', exact: true }).click();
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click();
  await expect(cards).toHaveCount(0); await expect(page.locator('[data-home-state="preparing"]')).toBeVisible();
  await expect(page.getByRole('search')).toHaveCount(0);
  expect(state.calls.some(call => /submit|moderate|prepare_profile|delete|withdraw/.test(call.name))).toBe(false);
});

test('mocked expired and denied accounts never request private discovery catalog', async ({ page }) => {
  await login(page); const state = await mock(page, { expired: true }); await page.goto(`${base}/#/find`);
  await expect(page.locator('[data-home-state="expired"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: '招待アカウントの閲覧期間が終了しました', exact: true })).toBeVisible();
  await expect(page.getByRole('search')).toHaveCount(0);
  await expect(page.locator('.home-catalog-preparing')).toHaveCount(0);
  await expect.poll(() => state.calls.filter(c => c.name === 'dining_owner_trial_context').length).toBeGreaterThan(0);
  expect(state.calls.some(c => c.name === 'dining_owner_trial_catalog')).toBe(false);
  const denied = await mock(page, { denied: true }); await page.reload();
  await expect(page.locator('[data-home-state="preparing"]')).toBeVisible();
  await expect(page.locator('[data-home-restaurant]')).toHaveCount(0);
  await expect(page.getByRole('search')).toHaveCount(0);
  expect(denied.calls.some(c => c.name === 'dining_owner_trial_catalog')).toBe(false);
});

test('discovery access lookup failure offers recovery without unreachable public destinations', async ({ page }) => {
  await login(page);const state=await mock(page);
  const failed='**/rpc/dining_owner_trial_context';
  await page.route(failed,route=>route.fulfill({status:503,json:{code:'unavailable'}}));
  await page.goto(`${base}/#/find`);
  await expect(page.locator('[data-home-state="denied"]')).toBeVisible();
  await expect(page.locator('[data-home-restaurant]')).toHaveCount(0);
  await expect(page.getByRole('search')).toHaveCount(0);
  expect(state.calls.some(call=>call.name==='dining_public_catalog')).toBe(false);
  await page.unroute(failed);await page.getByRole('button',{name:'再読み込み',exact:true}).click();
  await expect(page.locator('[data-home-state="available"]')).toBeVisible();
  await expect(page.locator('[data-home-restaurant]')).toHaveCount(3);
});

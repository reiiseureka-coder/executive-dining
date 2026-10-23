import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface RecordedRestaurant {
  id: string;
  name: string;
  address: string;
  factsCheckedAt: string;
  status: string;
  facts: { field: string; value: string; sourceUrl: string; verifiedAt: string }[];
}
const catalog: RecordedRestaurant[] = JSON.parse(readFileSync(new URL('../fixtures/owner-trial-catalog.json', import.meta.url), 'utf8'));
const demo = '/preview.html#/preview';
const configuredDemo = 'http://127.0.0.1:4182/preview.html#/preview';
const fact = (row: RecordedRestaurant, field: string) => row.facts.find(value => value.field === field);
const card = (page: Page, index: number) => page.locator(`[data-demo-id="${catalog[index].id}"]`);

async function screenshot(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath(`${name}-viewport.png`), fullPage: false, animations: 'disabled' });
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: 'disabled' });
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function readableFacts(page: Page) {
  const sizes = await page.locator('.service-demo .catalog-decision-facts dd, .service-demo-comparison td > p').evaluateAll(elements => elements.map(element => Number.parseFloat(getComputedStyle(element).fontSize)));
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
}
async function noLiveControls(page: Page) {
  await expect(page.locator('.service-demo img, .service-demo textarea, input[type="email"], input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /ログイン|投稿を送信|プロフィールを作成|予約する/ })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /ログイン|投稿を送信|プロフィールを作成|予約する/ })).toHaveCount(0);
  await expect(page.locator('.review-draft, .feedback-draft, .pilot-profile, .star-rating')).toHaveCount(0);
  await expect(page.getByText('閲覧専用デモ', { exact: true }).first()).toBeVisible();
}

for (const width of [390, 1440]) {
  test(`standalone read-only demo preserves facts and completes comparison at ${width}px without Supabase`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'Each explicit viewport is covered once.');
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    // A stale saved session must not trigger SDK initialization or token refresh in this entry.
    await page.addInitScript(() => {
      localStorage.setItem('sb-test-project-auth-token', JSON.stringify({ access_token: 'synthetic-expired-demo-only', refresh_token: 'synthetic-demo-only', expires_at: 1, expires_in: 0, token_type: 'bearer', user: { id: '11111111-1111-4111-8111-111111111111' } }));
    });
    const backendRequests: string[] = [];
    const writes: string[] = [];
    page.on('request', request => {
      if (/supabase|\/rest\/v1\/|\/auth\/v1\//i.test(request.url())) backendRequests.push(request.url());
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
    });
    await page.route('https://test-project.supabase.co/**', route => route.abort());
    await page.goto(configuredDemo);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('店舗選びを試す');
    await expect(page.locator('[data-demo-id]')).toHaveCount(catalog.length);
    await expect(page.getByText(/公式情報を確認した記録の固定表示です。最新の営業状況・空席ではありません/)).toBeVisible();
    await noLiveControls(page);
    for (const row of catalog) {
      const item = page.locator(`[data-demo-id="${row.id}"]`);
      await expect(item.getByRole('heading', { name: row.name, exact: true })).toBeVisible();
      await expect(item.locator('[data-fact="price"] dd')).toHaveText(fact(row, 'price')?.value ?? '未確認');
      await expect(item.locator('[data-fact="private_room"] dd')).toHaveText(fact(row, 'private_room')?.value ?? '未確認');
      await expect(item.getByText('掲載候補（candidate）', { exact: true })).toBeVisible();
      await expect(item.getByText('記録の確認日：2026年10月5日', { exact: true })).toBeVisible();
      if (fact(row, 'notice')) await expect(item.locator('.operating-notice p')).toHaveText(fact(row, 'notice')!.value);
    }
    await expect(page.locator('.catalog-decision details')).toHaveCount(0);
    await readableFacts(page); await noOverflow(page);
    await screenshot(page, info, `service-demo-list-${width}`);
    await card(page, 0).getByRole('button', { name: '店舗の詳細を見る', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(catalog[0].name);
    await expect(page.locator('.service-demo-detail [data-fact="price"] dd')).toHaveText(fact(catalog[0], 'price')!.value);
    await expect(page.locator('.service-demo-provenance')).toContainText('2026年10月5日');
    await expect(page.locator('.service-demo-detail-basic')).toContainText('この記録では未確認');
    await page.locator('.service-demo-provenance summary').click();
    await expect(page.getByRole('link', { name: '掲載コース・料金の出典', exact: true })).toHaveAttribute('href', fact(catalog[0], 'price')!.sourceUrl);
    await expect(page.getByRole('link', { name: '公式サイトで最新情報を確認', exact: true })).toHaveAttribute('href', fact(catalog[0], 'website')!.value);
    await readableFacts(page); await noOverflow(page); await noLiveControls(page);
    await screenshot(page, info, `service-demo-detail-${width}`);
    await page.locator('.service-demo-detail-actions').getByRole('button', { name: '比較に追加', exact: true }).click();
    await page.getByRole('button', { name: 'デモの店舗一覧へ', exact: true }).first().click();
    await expect(card(page, 0).getByRole('button', { name: '比較から外す', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('あと1店選ぶと比較できます。', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '選んだ1店を比較', exact: true })).toBeDisabled();
    await card(page, 1).getByRole('button', { name: '比較に追加', exact: true }).click();
    await card(page, 2).getByRole('button', { name: '比較に追加', exact: true }).click();
    await expect(card(page, 3).getByRole('button', { name: '比較に追加', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '選んだ3店を比較', exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.locator('[data-compare-field="price"] td').first()).toContainText(fact(catalog[0], 'price')!.value);
    await expect(page.locator('[data-compare-field="price"] td').nth(1)).toContainText('この記録では未確認');
    await expect(page.locator('[data-compare-field="notice"] td').nth(1)).toContainText(fact(catalog[1], 'notice')!.value);
    await readableFacts(page); await noOverflow(page); await noLiveControls(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const firstPrices = await page.locator('[data-compare-field="price"] td > p').evaluateAll(elements => elements.slice(0, 2).map(element => { const rect = element.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom }; }));
    for (const price of firstPrices) { expect(price.top).toBeGreaterThanOrEqual(0); expect(price.bottom).toBeLessThanOrEqual(width === 390 ? 844 : 1000); }
    await screenshot(page, info, `service-demo-compare-${width}`);
    const comparisonUrl = page.url();
    await page.getByRole('button', { name: '詳細を見る', exact: true }).first().click();
    await page.getByRole('button', { name: '比較に戻る', exact: true }).first().click();
    await expect(page).toHaveURL(comparisonUrl);
    await page.reload();
    await expect(page.getByRole('table')).toBeVisible();
    await page.getByRole('button', { name: `${catalog[2].name}を比較から外す`, exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveCount(3);
    await page.getByRole('button', { name: `${catalog[1].name}を比較から外す`, exact: true }).click();
    await expect(page.getByRole('heading', { name: '比較する店舗を2〜3店選んでください', exact: true })).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
    await page.getByRole('button', { name: 'デモの店舗一覧で選ぶ', exact: true }).click();
    await expect(card(page, 0).getByRole('button', { name: '比較から外す', exact: true })).toBeVisible();
    expect(backendRequests).toEqual([]);
    expect(writes).toEqual([]);
  });
}

test('demo search, details, history and direct links keep only static candidates and URL state', async ({ page }) => {
  await page.goto(demo);
  await card(page, 0).getByRole('button', { name: '比較に追加', exact: true }).click();
  await page.getByRole('searchbox', { name: '店名・エリア・条件から探す' }).fill('名古屋');
  await page.locator('.service-demo-filters summary').click();
  await page.getByRole('combobox', { name: '料理', exact: true }).selectOption('中国料理・広東料理');
  await page.getByRole('checkbox', { name: '料金の記録がある店舗のみ', exact: true }).check();
  await page.getByRole('button', { name: '絞り込む', exact: true }).click();
  await expect(page.locator('[data-demo-id]')).toHaveCount(2);
  const filteredUrl = page.url();
  await card(page, 0).getByRole('button', { name: '店舗の詳細を見る', exact: true }).click();
  const detailUrl = page.url();
  await page.goBack(); await expect(page).toHaveURL(filteredUrl);
  await expect(page.getByRole('searchbox', { name: '店名・エリア・条件から探す' })).toHaveValue('名古屋');
  await expect(page.getByRole('combobox', { name: '料理', exact: true })).toHaveValue('中国料理・広東料理');
  await expect(page.getByRole('checkbox', { name: '料金の記録がある店舗のみ', exact: true })).toBeChecked();
  await page.goForward(); await expect(page).toHaveURL(detailUrl);
  await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toHaveText(catalog[0].name);
  await page.getByRole('button', { name: 'デモの店舗一覧へ', exact: true }).first().click();
  await expect(page).toHaveURL(filteredUrl);
  await page.getByRole('searchbox', { name: '店名・エリア・条件から探す' }).fill('存在しない店舗の条件');
  await page.getByRole('button', { name: '絞り込む', exact: true }).click();
  await expect(page.getByRole('heading', { name: '条件に合う記録がありません', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'すべての記録を見る', exact: true }).click();
  await expect(page.locator('[data-demo-id]')).toHaveCount(catalog.length);
  await expect(card(page, 0).getByRole('button', { name: '比較から外す', exact: true })).toBeVisible();
  await page.goto(`/preview.html#/preview/${catalog[3].id}?ids=${catalog.slice(0, 2).map(row => row.id).join(',')}&returnTo=service-demo-compare`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(catalog[3].name);
  await expect(page.locator('.service-demo-detail .operating-notice p')).toHaveText(fact(catalog[3], 'notice')!.value);
  await page.getByRole('button', { name: '比較に戻る', exact: true }).first().click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.goto('/preview.html#/preview/missing-record');
  await expect(page.getByRole('heading', { name: 'この店舗の記録はありません', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'デモの店舗一覧へ', exact: true }).click();
  await expect(page.locator('[data-demo-id]')).toHaveCount(catalog.length);
  await page.goto('/preview.html#/preview-compare?ids=not-a-record');
  await expect(page.getByRole('heading', { name: '比較する店舗を2〜3店選んでください', exact: true })).toBeVisible();
  await noOverflow(page);
});

test('standalone demo offers a real Home destination without replacing its list route', async ({ page }) => {
  await page.goto(demo);
  const home = page.locator('a[href="/#/"]').filter({ hasText: 'ホーム' }).first();
  await expect(home).toBeVisible();
  await home.click();
  await expect(page.locator('.service-home')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('店舗選びを試す');
  await expect(page.locator('[data-demo-id]')).toHaveCount(catalog.length);
});

import { test, expect, type Page, type Locator, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import type { PublishedFact, PublishedReview, VerifiedRestaurant } from '../../src/domain/dining';
import { reviewBeforeFacts, readableReviewText } from './helpers/reviewHierarchy';

const base = 'http://127.0.0.1:4181';
const stamp = '2026-10-05T00:00:00Z';
const fact = (field: PublishedFact['field'], value: string): PublishedFact => ({ field, value, sourceUrl: `https://example.test/${field}`, provider: 'official', licenses: [], attributions: [], fetchedAt: stamp, verifiedAt: stamp });
// These intercepted records are solely acceptance-test fixtures, never production reviews.
const reviews: PublishedReview[] = [
  { id: 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee', displayName: '表示確認用の投稿者A', rating: 4, comment: '表示確認専用の架空口コミAです。実際の来店体験ではありません。会食の感想が料金や個室情報より先に読めることを確認します。', visitedMonth: '2026-09', publishedAt: stamp },
  { id: 'ffffffff-ffff-4fff-ffff-ffffffffffff', displayName: '表示確認用の投稿者B', rating: 2, comment: '表示確認専用の架空口コミBです。実際の店舗評価ではありません。投稿データの件数と本文をそのまま表示するためのテストです。', visitedMonth: '2026-08', publishedAt: stamp },
];
const rows: VerifiedRestaurant[] = [
  { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', status: 'verified', name: '検証用 会食店A', address: '名古屋市中区（検証用）', verifiedAt: stamp, reviews, facts: [fact('name', '検証用 会食店A'), fact('address', '名古屋市中区（検証用）'), fact('website', 'https://example.test/restaurant-a'), fact('genre', '日本料理'), fact('price', '検証用コース16,500円、税込・サービス料別'), fact('private_room', '検証用個室4〜6名。防音性は未確認')] },
  { id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', status: 'verified', name: '検証用 会食店B', address: '名古屋市中村区（検証用）', verifiedAt: stamp, reviews: [], facts: [fact('name', '検証用 会食店B'), fact('address', '名古屋市中村区（検証用）'), fact('website', 'https://example.test/restaurant-b'), fact('genre', '中国料理')] },
];

async function capture(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.screenshot({ path: info.outputPath(`${name}-viewport.png`), animations: 'disabled' });
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function assertActualReviews(scope: Locator, compact: boolean) {
  const block = scope.locator('.verified-reviews');
  await expect(block.getByRole('heading')).toHaveText('会食の口コミ 2件');
  await expect(block.locator('.review-count')).toHaveText(String(reviews.length) + '件');
  await expect(block.locator('.review-comment')).toHaveText((compact ? reviews.slice(0, 1) : reviews).map(review => review.comment));
  for (const [index, review] of (compact ? reviews.slice(0, 1) : reviews).entries()) {
    await expect(block.locator('.review-meta').nth(index)).toHaveText(`${review.displayName} · ${review.rating}/5 · ${review.visitedMonth}来店`);
  }
  await expect(block.locator('.review-empty')).toHaveCount(0);
  return readableReviewText(block.locator('.review-heading, .review-count, .review-comment'));
}
async function assertEmptyReviews(scope: Locator) {
  const block = scope.locator('.verified-reviews');
  await expect(block.getByRole('heading')).toHaveText('会食の口コミ 0件');
  await expect(block.locator('.review-count')).toHaveText('0件');
  await expect(block.locator('.review-empty')).toHaveText('公開された口コミはまだありません。');
  await expect(block.locator('.review-comment, .review-meta, .star-rating')).toHaveCount(0);
  return readableReviewText(block.locator('.review-heading, .review-count, .review-empty'));
}

for (const width of [390, 1440]) {
  test(`public discovery, list and detail put actual reviews before supplemental facts at ${width}px`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'Run each explicit viewport once.');
    test.setTimeout(90_000);
    const height = width === 390 ? 844 : 1000;
    await page.setViewportSize({ width, height });
    const calls: string[] = [];
    await page.route('https://test-project.supabase.co/**', route => {
      const name = route.request().url().split('/').at(-1)!;
      calls.push(name);
      return route.fulfill({ json: name === 'dining_public_catalog' ? rows : [] });
    });
    await page.goto(`${base}/#/find`);
    await expect(page.locator('[data-home-restaurant]')).toHaveCount(rows.length);
    const populatedDiscovery = page.locator(`[data-home-restaurant="${rows[0].id}"]`);
    const emptyDiscovery = page.locator(`[data-home-restaurant="${rows[1].id}"]`);
    const discoveryTypography = await assertActualReviews(populatedDiscovery, true);
    const discoveryEmptyTypography = await assertEmptyReviews(emptyDiscovery);
    const discoveryOrder = await reviewBeforeFacts(populatedDiscovery);
    const discoveryEmptyOrder = await reviewBeforeFacts(emptyDiscovery);
    await capture(page, info, `review-first-public-discovery-${width}`);

    await page.getByRole('link', { name: '全2店を見る', exact: true }).click();
    const populated = page.locator(`#verified-${rows[0].id}`);
    const empty = page.locator(`#verified-${rows[1].id}`);
    const listTypography = await assertActualReviews(populated, true);
    const listEmptyTypography = await assertEmptyReviews(empty);
    const listOrder = await reviewBeforeFacts(populated);
    const listEmptyOrder = await reviewBeforeFacts(empty);
    await expect(populated.locator('[data-fact="price"] dd')).toHaveText(rows[0].facts.find(value => value.field === 'price')!.value);
    await expect(empty.locator('[data-fact="price"] dd')).toHaveText('未確認');
    await capture(page, info, `review-first-public-list-${width}`);

    await populated.getByRole('button', { name: '店舗の詳細を見る', exact: true }).click();
    const detail = page.locator('.catalog-detail');
    await expect(detail.getByRole('heading', { level: 1 })).toHaveText(rows[0].name);
    const detailTypography = await assertActualReviews(detail, false);
    const detailOrder = await reviewBeforeFacts(detail, '.verified-reviews', '.detail-decision');
    await expect(detail.locator('.detail-decision dd').first()).toHaveText(rows[0].facts.find(value => value.field === 'price')!.value);
    await capture(page, info, `review-first-public-detail-${width}`);
    await page.goBack();
    await assertActualReviews(populated, true);
    await empty.getByRole('button', { name: '店舗の詳細を見る', exact: true }).click();
    const emptyDetailTypography = await assertEmptyReviews(detail);
    const emptyDetailOrder = await reviewBeforeFacts(detail, '.verified-reviews', '.detail-decision');
    await capture(page, info, `review-first-public-empty-detail-${width}`);
    await page.reload();
    await assertEmptyReviews(detail);
    expect(calls.filter(name => name !== 'dining_public_catalog')).toEqual([]);
    await writeFile(info.outputPath('review-product-metrics.json'), JSON.stringify({ width, height, fixture: 'intercepted public catalog; synthetic acceptance-test reviews; no live backend', discoveryTypography, discoveryEmptyTypography, discoveryOrder, discoveryEmptyOrder, listTypography, listEmptyTypography, listOrder, listEmptyOrder, detailTypography, detailOrder, emptyDetailTypography, emptyDetailOrder, calls }, null, 2));
  });
}

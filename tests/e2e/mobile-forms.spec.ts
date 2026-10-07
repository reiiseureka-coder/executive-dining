import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { login } from './helpers/ownerTrial';
import type { EditorialRestaurant, FactField, PublishedFact, VerifiedRestaurant } from '../../src/domain/dining';

test.setTimeout(120_000);
const base = 'http://127.0.0.1:4181';
const stamp = '2026-10-05T00:00:00Z';
// Use the existing real-catalog fixture contract, with entirely fictitious display data.
const fact = (field: FactField, value: string): PublishedFact => ({
  field, value, sourceUrl: `https://example.com/${field}`, provider: 'official',
  licenses: [], attributions: [], fetchedAt: stamp, verifiedAt: stamp,
});
const restaurant: VerifiedRestaurant = {
  id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', status: 'verified',
  name: '検証用 日本料理店', address: '名古屋市中区 栄（検証用）', verifiedAt: stamp,
  facts: [
    fact('name', '検証用 日本料理店'), fact('address', '名古屋市中区 栄（検証用）'),
    fact('website', 'https://example.com/japanese'), fact('genre', '日本料理'),
    fact('private_room', '半個室 4〜6名。防音性は未確認'),
    fact('price', '夜会席16,500円、税込・サービス料15%別、平日席料別'),
  ],
  reviews: [{
    id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', displayName: '表示確認用の架空投稿者', rating: 3,
    comment: '表示確認専用の架空口コミです。実際の来店評価ではありません。',
    visitedMonth: '2026-09', publishedAt: stamp,
  }],
};
const candidate: EditorialRestaurant = {
  ...restaurant, status: 'candidate', version: 1, verifiedAt: null,
  sources: [{
    ...fact('name', restaurant.name), id: 'mobile-source-fixture',
    publicationBasis: '表示確認用の架空資料', rawRecord: { name: restaurant.name, note: '編集画面の確認専用' },
  }],
};

async function mockReadOnlyData(page: Page, editor = false, catalog: VerifiedRestaurant[] = [restaurant]) {
  const unexpected: string[] = [];
  const reads: string[] = [];
  await page.route('https://test-project.supabase.co/**', async route => {
    const name = route.request().url().split('/').at(-1)!;
    reads.push(name);
    if (name === 'dining_public_catalog') return route.fulfill({ json: catalog });
    if (name === 'dining_editor_access') return route.fulfill({ json: editor });
    if (name === 'dining_editor_queue' && editor) return route.fulfill({ json: [candidate] });
    if (name === 'dining_owner_trial_context') return route.fulfill({ status: 403, json: { code: '42501' } });
    // Fail closed: these tests may read mocked data, but must never call a write RPC.
    unexpected.push(name);
    return route.fulfill({ status: 403, json: { code: '42501', message: 'Unexpected request in a read-only layout test' } });
  });
  return { unexpected, reads };
}

async function fits(page: Page) {
  const dimensions = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function readableFields(scope: Locator) {
  const fields = scope.locator('input:not([type=checkbox]):not([type=radio]):not([type=range]):visible, select:visible, textarea:visible');
  expect(await fields.count()).toBeGreaterThan(0);
  const cramped = await fields.evaluateAll(elements => elements.flatMap(element => {
    const fontSize = parseFloat(getComputedStyle(element).fontSize);
    const height = element.getBoundingClientRect().height;
    return fontSize < 16 || height < 44 ? [{ field: element.outerHTML.slice(0, 160), fontSize, height }] : [];
  }));
  expect(cramped).toEqual([]);
}

async function comfortableTargets(targets: Locator) {
  expect(await targets.count()).toBeGreaterThan(0);
  const cramped = await targets.evaluateAll(elements => elements.flatMap(element => {
    const { width, height } = element.getBoundingClientRect();
    return width < 44 || height < 44 ? [{ target: element.textContent?.trim(), width, height }] : [];
  }));
  expect(cramped).toEqual([]);
}

async function screenshot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}-320.png`), fullPage: true, animations: 'disabled' });
}

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Expanded form coverage runs once in the mobile project.');
  await page.setViewportSize({ width: 320, height: 844 });
});

test('public catalog and expanded review, correction and report drafts fit 320px', async ({ page }, info) => {
  const state = await mockReadOnlyData(page);
  await page.goto(`${base}/#/nagoya`);
  await expect(page.getByText('確認済み掲載 1件', { exact: true })).toBeVisible();
  await readableFields(page.locator('main'));
  await comfortableTargets(page.locator('.catalog-toolbar button, .catalog-filters button, .verified-card-actions button'));
  await fits(page);
  await screenshot(page, info, 'public-catalog-fields');
  await page.getByRole('button', { name: '詳細と確認情報を見る', exact: true }).click();
  await expect(page.getByRole('heading', { name: restaurant.name, exact: true })).toBeVisible();

  const review = page.locator('.visit-draft');
  await review.locator('summary').click();
  await review.getByLabel('下書きのメモ名（非公開）', { exact: true }).fill('表示確認用の架空メモ');
  await review.getByLabel('訪問月', { exact: true }).fill('2026-09');
  await review.getByLabel('店舗との関係', { exact: true }).selectOption('customer');
  await review.getByLabel('体験の総合評価', { exact: true }).selectOption('3');
  await review.getByLabel('本人の体験本文', { exact: true }).fill('自動テスト専用の架空本文です。実際の来店評価ではありません。');
  await review.getByLabel('本人が実際に訪問した体験です', { exact: true }).check();
  await review.getByLabel('個人情報・会食相手・機密情報を含めていません', { exact: true }).check();
  await review.getByRole('button', { name: '公開前の表示内容を確認', exact: true }).click();
  await expect(review.getByRole('region', { name: '口コミの送信前確認' })).toBeVisible();
  await readableFields(review);
  await comfortableTargets(review.locator('button:visible, summary, .draft-check'));
  await fits(page);
  await screenshot(page, info, 'public-review-preview');

  const correction = page.locator('.feedback-draft').filter({ hasText: '公式情報の訂正メモを作る' });
  await correction.locator('summary').click();
  await correction.getByLabel('訂正を希望する項目', { exact: true }).selectOption('price');
  await correction.getByLabel('確認に使える公式ページURL', { exact: true }).fill(`https://example.com/${'long-source-path-'.repeat(8)}`);
  await correction.getByLabel('確認してほしい内容', { exact: true }).fill('公式ページの掲載コース条件を確認するための架空メモです。');
  await correction.getByRole('button', { name: 'メモの入力内容を確認', exact: true }).click();
  await expect(correction.getByRole('button', { name: '訂正依頼の受付は準備中', exact: true })).toBeDisabled();
  await readableFields(correction);
  await comfortableTargets(correction.locator('button:visible, summary'));

  const report = page.locator('.feedback-draft').filter({ hasText: 'この口コミの通報メモを作る' });
  await report.locator('summary').click();
  await report.getByLabel('通報の理由', { exact: true }).selectOption('privacy');
  await report.getByLabel('確認してほしい内容', { exact: true }).fill('個人情報の記載箇所を確認するための架空メモです。');
  await report.getByRole('button', { name: 'メモの入力内容を確認', exact: true }).click();
  await expect(report.getByRole('button', { name: '通報の受付は準備中', exact: true })).toBeDisabled();
  await readableFields(report);
  await comfortableTargets(report.locator('button:visible, summary'));
  await fits(page);
  await screenshot(page, info, 'public-feedback-forms');
  expect(state.unexpected).toEqual([]);
});

test('actual mocked curation editor and confirmation fit 320px without writing', async ({ page }, info) => {
  await login(page);
  const state = await mockReadOnlyData(page, true);
  await page.goto(`${base}/#/curation`);
  const editor = page.locator('.curation-card');
  await expect(editor).toHaveCount(1);
  await editor.getByText('取得元・利用条件（1件）', { exact: true }).click();
  await editor.getByText('取得時の資料を見る（未審査）', { exact: true }).click();
  await editor.getByText('公式情報を確認して記録する', { exact: true }).click();
  await editor.getByLabel('確認項目', { exact: true }).selectOption('price');
  await editor.getByLabel('確認した事実', { exact: true }).fill('表示確認用の架空コース料金と利用条件です。保存しません。');
  await editor.getByLabel('公式ページのURL', { exact: true }).fill(`https://example.com/${'long-editorial-path-'.repeat(8)}`);
  await editor.getByLabel('審査理由', { exact: true }).fill('狭い画面で確認ダイアログの表示を検証します。変更は確定しません。');
  await readableFields(editor);
  await comfortableTargets(editor.locator('button:visible, summary:visible'));
  await fits(page);
  await screenshot(page, info, 'curation-editor');

  await editor.getByRole('button', { name: '掲載を承認', exact: true }).click();
  await expect(editor.locator('.curation-confirm')).toBeVisible();
  await comfortableTargets(editor.locator('.curation-confirm button'));
  await fits(page);
  await screenshot(page, info, 'curation-confirmation');
  await editor.getByRole('button', { name: 'キャンセル', exact: true }).click();
  await expect(editor.locator('.curation-confirm')).toHaveCount(0);
  expect(state.reads).toContain('dining_editor_queue');
  expect(state.unexpected).toEqual([]);
});

test('membership public preview and feature cards fit 320px', async ({ page }, info) => {
  const state = await mockReadOnlyData(page);
  await page.goto(`${base}/#/membership`);
  await page.getByRole('button', { name: '架空データで公開表示を試す', exact: true }).click();
  const card = page.locator('.membership-card');
  await expect(page.locator('.public-identity-preview')).toBeVisible();
  await page.getByLabel('公開する役割の区分', { exact: true }).selectOption('team');
  await readableFields(card);
  await comfortableTargets(card.locator('button, .draft-check'));
  await fits(page);
  await screenshot(page, info, 'membership-public-preview');
  await page.getByLabel('この公開表示を確認する（操作デモ）', { exact: true }).check();
  await page.getByRole('button', { name: '会員機能の案を見る', exact: true }).click();
  for (const name of ['Member', 'Plus', 'Prime']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await comfortableTargets(card.locator('button'));
  await fits(page);
  await screenshot(page, info, 'membership-feature-cards');
  await page.getByRole('button', { name: '公開表示を見直す', exact: true }).click();
  await expect(page.getByLabel('この公開表示を確認する（操作デモ）', { exact: true })).not.toBeChecked();
  expect(state.unexpected).toEqual([]);
});

test('public comparison stays reachable above a long catalog at 320px', async ({ page }, info) => {
  const catalog = Array.from({ length: 8 }, (_, index): VerifiedRestaurant => {
    const name = `検証用 日本料理店 ${index + 1}`;
    return {
      ...restaurant, id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, name,
      facts: restaurant.facts.map(item => item.field === 'name' ? { ...item, value: name } : item),
      reviews: [],
    };
  });
  const state = await mockReadOnlyData(page, false, catalog);
  await page.goto(`${base}/#/nagoya`);
  await expect(page.getByText('確認済み掲載 8件', { exact: true })).toBeVisible();
  for (const row of catalog.slice(0, 2)) {
    await page.getByRole('button', { name: `比較に追加：${row.name}`, exact: true }).click();
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const compare = page.getByRole('button', { name: '選んだお店を比較', exact: true });
  await expect(compare).toBeEnabled();
  await expect(compare).toBeInViewport();
  await comfortableTargets(page.locator('.comparison-tray button'));
  await fits(page);
  await screenshot(page, info, 'public-comparison-tray');
  await compare.click();
  await expect(page.getByRole('heading', { name: '会食の候補を、並べて確認。', exact: true })).toBeVisible();
  await expect(page.getByRole('table').getByRole('columnheader')).toHaveCount(3);
  await fits(page);
  await screenshot(page, info, 'public-comparison-table');
  expect(state.unexpected).toEqual([]);
});

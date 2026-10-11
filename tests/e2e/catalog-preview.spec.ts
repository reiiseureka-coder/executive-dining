import { test, expect } from '@playwright/test';
import { catalog, login, mock } from './helpers/ownerTrial';
const base = 'http://127.0.0.1:4181';
test('actual ten candidate records have read-only card and detail previews with labeled generated imagery and without publication', async ({ page }, info) => {
  await login(page); const writes: string[] = [];
  await page.route('https://test-project.supabase.co/**', async route => {
    const name = route.request().url().split('/').at(-1);
    if (name === 'dining_editor_access') return route.fulfill({ json: true });
    if (name === 'dining_editor_queue') return route.fulfill({ json: catalog.map((row: object) => ({ ...row, version: 1, verifiedAt: null, sources: [] })) });
    if (name === 'dining_editor_context') return route.fulfill({json:{contractVersion:1,publicEnabled:false,reviewsEnabled:false,manualIntakeEnabled:true,queueLimit:200}});
    if (name === 'dining_public_catalog') return route.fulfill({ json: [] });
    if (name === 'dining_owner_trial_context') return route.fulfill({ status: 403, json: { code: '42501' } });
    writes.push(name ?? ''); return route.fulfill({ status: 403, json: {} });
  });
  await page.goto(`${base}/#/curation`);
  await expect(page.locator('.curation-card')).toHaveCount(10);
  for (const row of catalog) {
    await page.getByRole('button',{name:`${row.name}を確認する`,exact:true}).click();
    const editor = page.locator('.editorial-detail');
    await editor.getByText('掲載時の表示を確認する', { exact: true }).click();
    const preview = editor.getByRole('region');
    await expect(preview.getByText('イメージ', { exact: true })).toBeVisible();
    await expect(preview.locator('img')).toHaveAttribute('alt', /実際の店舗・料理ではありません/);
    await expect(preview.getByRole('heading', { name: row.name, exact: true })).toBeVisible();
    await expect(preview.getByRole('link', { name: '公式サイトでお店を見る' })).toHaveAttribute('href', row.facts.find((f: {field:string}) => f.field === 'website').value);
    await editor.getByRole('button', { name: '詳細ページ', exact: true }).click();
    await expect(preview.getByText('営業時間', { exact: true })).toBeVisible();
    await preview.getByText('出典・確認日を見る', { exact: true }).click();
    await expect(preview.getByRole('link', { name: '店舗名の出典', exact: true })).toBeVisible();
    await editor.getByRole('button', { name: '一覧カード', exact: true }).click();
    await expect(preview.getByText('営業時間', { exact: true })).toHaveCount(0);
    await editor.getByText('掲載時の表示を確認する', { exact: true }).click();
    await editor.getByRole('button',{name:'店舗一覧に戻る',exact:true}).click();
  }
  await page.getByRole('button',{name:`${catalog[0].name}を確認する`,exact:true}).click();
  const first = page.locator('.editorial-detail');
  await first.getByText('掲載時の表示を確認する', { exact: true }).click();
  await page.setViewportSize({ width: 320, height: 760 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await first.screenshot({ path: info.outputPath('actual-candidate-preview-320.png') });
  await page.reload(); await expect(page.locator('.editorial-preview[open]')).toHaveCount(0);
  expect(writes).toEqual([]);
});
test('actual ten-store search supports combined facts, normalization, empty results, reset and history without writes', async ({ page }, info) => {
  await login(page); const state = await mock(page); await page.goto(`${base}/#/pilot`);
  const search = page.getByRole('textbox', { name: '非公開の実店舗を検索' });
  await expect(page.getByText('実店舗 10 / 10件（非公開）', { exact: true })).toBeVisible();
  for (const row of catalog) {
    await search.fill(row.name); await expect(page.getByRole('heading', { name: row.name, exact: true })).toBeVisible();
  }
  await search.fill('名古屋浅田　１５％');
  await expect(page.getByText('実店舗 1 / 10件（非公開）', { exact: true })).toBeVisible();
  await page.getByLabel('非公開テストの料理').selectOption('中国料理・広東料理');
  await expect(page.getByText('条件に合う実店舗がありません。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '検索条件をリセット', exact: true }).click();
  await expect(search).toHaveValue(''); await expect(page.getByText('実店舗 10 / 10件（非公開）', { exact: true })).toBeVisible();
  await search.fill('存在しない料理xyz'); await expect(page.getByText('実店舗 0 / 10件（非公開）', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '検索条件をリセット', exact: true }).click(); await search.fill('名古屋浅田');
  const listUrl = page.url(); await page.getByRole('button', { name: '店舗の詳細を見る', exact: true }).click();
  await expect(page.locator('.pilot-detail').getByText('未確認', { exact: true })).toHaveCount(2);
  await expect(page.locator('.pilot-detail img')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('actual-store-detail.png'), fullPage: true });
  await page.goBack(); await expect(page).toHaveURL(listUrl); await expect(search).toHaveValue('名古屋浅田');
  await page.goForward(); await page.reload(); await expect(page.getByRole('heading', { name: '名古屋浅田', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '実店舗一覧へ戻る', exact: true }).click(); await expect(search).toHaveValue('名古屋浅田');
  expect(state.calls.some(call => /submit|moderate|prepare_profile|delete|withdraw/.test(call.name))).toBe(false);
});

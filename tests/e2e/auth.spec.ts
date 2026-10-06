import { test, expect, type Page } from '@playwright/test';
const userId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
async function signedInFixture(page: Page) {
  // Entirely synthetic session for mocked local-server tests; never sent to a live project.
  await page.addInitScript(({ id }) => {
    const jwtPart = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const token = `${jwtPart({ alg: 'HS256', typ: 'JWT' })}.${jwtPart({ sub: id, exp: expiry, role: 'authenticated' })}.test-signature`;
    localStorage.setItem('sb-test-project-auth-token', JSON.stringify({ access_token: token, refresh_token: 'synthetic-test-only', expires_at: expiry, expires_in: 3600, token_type: 'bearer', user: { id, aud: 'authenticated', role: 'authenticated', email: 'fixture@example.test', created_at: '2026-10-05T00:00:00Z', app_metadata: {}, user_metadata: { admin: true, rank: 'ルビー', operatorBadge: 'Owner', plan: 'Plus' } } }));
  }, { id: userId });
}
test('signed-in account never reads legacy profile table and cannot gain editor access from metadata', async ({ page }) => {
  const requests: string[] = [];
  await page.route('https://test-project.supabase.co/**', async route => {
    requests.push(route.request().url());
    if (route.request().url().endsWith('/rpc/dining_owner_trial_context')) { await route.fulfill({status:403,json:{code:'42501'}}); return; }
    await route.fulfill({ json: route.request().url().endsWith('/rpc/dining_editor_access') ? false : [] });
  });
  await signedInFixture(page);
  await page.goto('http://127.0.0.1:4181/#/curation');
  await expect(page.getByRole('heading', { name: '編集権限が必要です' })).toBeVisible();
  expect(requests.some(url => url.includes('user_profiles'))).toBe(false);
  expect(requests.some(url => url.includes('dining_editor_queue'))).toBe(false);
  await expect(page.locator('.review-readiness')).toHaveCount(0);
  await expect(page.locator('header .operator-badge')).toHaveCount(0);
});
test('authorized editor can read the queue and sign out without a legacy profile table', async ({ page, isMobile }) => {
  const requests: string[] = [];
  await page.route('https://test-project.supabase.co/**', async route => {
    const url = route.request().url(); requests.push(url);
    if (url.endsWith('/rpc/dining_owner_trial_context')) { await route.fulfill({status:403,json:{code:'42501'}}); return; }
    if (url.includes('/auth/v1/logout')) await route.fulfill({ status: 204, body: '' });
    else await route.fulfill({ json: url.endsWith('/rpc/dining_editor_access') ? true : [] });
  });
  await signedInFixture(page);
  await page.goto('http://127.0.0.1:4181/#/curation');
  await expect(page.getByRole('heading', { name: '確認待ちの候補はありません' })).toBeVisible();
  await page.locator('.review-readiness summary').click();
  await expect(page.getByText('現在、口コミの送信・審査・通報の操作は接続していません。店舗の掲載承認とは別工程です。')).toBeVisible();
  expect(requests.some(url => url.includes('dining_review_queue'))).toBe(false);
  expect(requests.some(url => url.includes('dining_editor_queue'))).toBe(true);
  expect(requests.some(url => url.includes('user_profiles'))).toBe(false);
  if (isMobile) await page.getByRole('button', { name: 'メニューを開く' }).click();
  await page.getByRole('button', { name: 'アカウント', exact: true }).click();
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click();
  await expect(page.getByRole('heading', { name: '運営者のログインが必要です' })).toBeVisible();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.review-readiness')).toHaveCount(0);
  await expect(page.locator('header .operator-badge')).toHaveCount(0);
});
test('unconfigured Google provider is not offered just because a database key is configured', async ({ page, isMobile }) => {
  await page.route('https://test-project.supabase.co/**', route => route.fulfill({ json: [] }));
  await page.goto('http://127.0.0.1:4181/#/curation');
  if (isMobile) await page.getByRole('button', { name: 'メニューを開く' }).click();
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await expect(page.getByText('ログイン機能は準備中です。', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Googleでログイン' })).toHaveCount(0);
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

import { test, expect, type Page } from '@playwright/test';
const base = 'http://127.0.0.1:4182';
async function openLogin(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'メニューを開く' }).click();
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
}
test('email link request forbids enrollment, uses fixed origin and survives close/navigation without a repeat send', async ({ page, isMobile }) => {
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  await page.route('https://test-project.supabase.co/**', async route => {
    if (route.request().url().includes('/auth/v1/otp')) requests.push({ url: route.request().url(), body: route.request().postDataJSON() });
    await route.fulfill({ json: {} });
  });
  await page.goto(`${base}/#/curation`);
  await openLogin(page, isMobile);
  await expect(page.getByRole('button', { name: 'Googleでログイン' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'メールアドレス' }).fill('fixture@example.test');
  await page.getByRole('button', { name: 'ログインリンクを送る' }).dblclick();
  await expect(page.getByText('メール送信を受け付けました。受信したログイン用リンクを開いてください。')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].body.email).toBe('fixture@example.test');
  expect(requests[0].body.create_user).toBe(false);
  expect(new URL(requests[0].url).searchParams.get('redirect_to')).toBe(base);
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  await page.getByRole('link', { name: '掲載情報について', exact: true }).click();
  await openLogin(page, isMobile);
  await expect(page.getByRole('button', { name: /再送まで/ })).toBeDisabled();
  expect(requests).toHaveLength(1);
});
test('email rate-limit error stays signed out and does not retry automatically', async ({ page, isMobile }) => {
  let requests = 0;
  await page.route('https://test-project.supabase.co/**', async route => {
    if (route.request().url().includes('/auth/v1/otp')) { requests++; await route.fulfill({ status: 429, json: { msg: 'Email rate limit exceeded', code: 'over_email_send_rate_limit' } }); }
    else await route.fulfill({ json: {} });
  });
  await page.goto(`${base}/#/curation`); await openLogin(page, isMobile);
  await page.getByRole('textbox', { name: 'メールアドレス' }).fill('fixture@example.test');
  await page.getByRole('button', { name: 'ログインリンクを送る' }).click();
  await expect(page.getByRole('alert')).toContainText('メールを送信できませんでした');
  await expect(page.getByRole('button', { name: /再送まで/ })).toBeDisabled();
  await page.getByRole('button', { name: '閉じる', exact: true }).click();
  await expect(page.getByRole('heading', { name: '運営者のログインが必要です' })).toBeVisible();
  expect(requests).toBe(1);
});
const callbackUser = { id: 'cccccccc-cccc-4ccc-cccc-cccccccccccc', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.test', created_at: '2026-10-05T00:00:00Z', app_metadata: {}, user_metadata: { admin: true } };
const queue = Array.from({ length: 10 }, (_, i) => ({ id: `candidate-${i}`, name: `検証用候補${i + 1}`, address: '名古屋市中区', status: 'candidate', version: 1, verifiedAt: null, sources: [], facts: [] }));
function callbackUrl(type = 'magiclink') {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: callbackUser.id, exp: Math.floor(Date.now() / 1000) + 3600 })}.synthetic-signature`;
  return `${base}/#${new URLSearchParams({ access_token: token, refresh_token: 'synthetic-refresh', expires_in: '3600', token_type: 'bearer', type })}`;
}
test('authorized callback lands on all ten editorial rows with safe history, reload and normal homepage persistence', async ({ page }) => {
  let roleChecks = 0;
  await page.route('https://test-project.supabase.co/**', async route => {
    const url = route.request().url();
    if (url.endsWith('/rpc/dining_editor_access')) roleChecks++;
    await route.fulfill({ json: url.includes('/auth/v1/user') ? callbackUser : url.endsWith('/rpc/dining_editor_access') ? true : url.endsWith('/rpc/dining_editor_queue') ? queue : [] });
  });
  await page.goto(`${base}/#/about`);
  await page.goto(callbackUrl('invite'));
  await expect(page).toHaveURL(/#\/curation$/);
  await expect(page.locator('.curation-card')).toHaveCount(10);
  await expect(page.getByText('最新 10件（最大200件） / 口コミ受付は別途準備中')).toBeVisible();
  await page.goBack(); await expect(page).toHaveURL(/#\/about$/);
  await expect(page).not.toHaveURL(/access_token|refresh_token/);
  await page.goForward(); await expect(page).toHaveURL(/#\/curation$/);
  await page.reload(); await expect(page.locator('.curation-card')).toHaveCount(10);
  const beforeHome = roleChecks;
  await page.getByRole('button', { name: 'Executive Dining ホーム', exact: true }).click();
  await page.reload();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { name: /名古屋の会食/ })).toBeVisible();
  expect(roleChecks).toBe(beforeHome);
});
test('callback intent and metadata never redirect an account denied by the server', async ({ page }) => {
  let checks = 0, queues = 0;
  await page.route('https://test-project.supabase.co/**', async route => {
    const url = route.request().url(); if (url.endsWith('/rpc/dining_editor_access')) checks++; if (url.endsWith('/rpc/dining_editor_queue')) queues++;
    await route.fulfill({ json: url.includes('/auth/v1/user') ? callbackUser : url.endsWith('/rpc/dining_editor_access') ? false : [] });
  });
  await page.goto(callbackUrl());
  await expect.poll(() => checks).toBeGreaterThan(0);
  await expect(page).not.toHaveURL(/curation|access_token|refresh_token/);
  expect(queues).toBe(0);
});
test('new navigation during the callback permission check is never pulled back to curation', async ({ page }) => {
  let checks = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://test-project.supabase.co/**', async route => {
    const url = route.request().url();
    if (url.endsWith('/rpc/dining_editor_access')) { checks++; await gate; await route.fulfill({ json: true }).catch(() => {}); }
    else await route.fulfill({ json: url.includes('/auth/v1/user') ? callbackUser : [] });
  });
  await page.goto(callbackUrl());
  await expect.poll(() => checks).toBeGreaterThan(0);
  await page.getByRole('link', { name: '掲載情報について', exact: true }).click();
  release();
  await expect(page).toHaveURL(/#\/about$/);
  await page.reload(); await expect(page).toHaveURL(/#\/about$/);
});
test('expired callback reports a generic error and never sends mail without a click', async ({ page, isMobile }) => {
  const requests: string[] = [];
  await page.route('https://test-project.supabase.co/**', async route => { requests.push(route.request().url()); await route.fulfill({ json: route.request().url().includes('/rpc/dining_public_catalog') ? [] : {} }); });
  await page.goto(`${base}/#error=access_denied&error_code=otp_expired&error_description=private-provider-detail`);
  await openLogin(page, isMobile);
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('ログインリンクを確認できませんでした');
  await expect(page.getByText('private-provider-detail', { exact: true })).toHaveCount(0);
  expect(requests.some(url => url.includes('/auth/v1/otp'))).toBe(false);
});

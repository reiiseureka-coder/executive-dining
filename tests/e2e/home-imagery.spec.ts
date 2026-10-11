import { test, expect } from '@playwright/test';
import { catalog, login, mock } from './helpers/ownerTrial';
const base = 'http://127.0.0.1:4181';
test('anonymous home shows three honest generated image entry points without private catalog reads', async ({ page }, info) => {
  const state = await mock(page); await page.goto(base);
  await expect(page.locator('.home-inspiration-card')).toHaveCount(3);
  await expect(page.locator('[data-home-restaurant]')).toHaveCount(0);
  for (const image of await page.locator('.home-catalog img').all()) {
    await expect(image).toHaveAttribute('alt', /実際の店舗・料理ではありません/);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  expect(state.calls.some(call => call.name.startsWith('dining_owner_trial_'))).toBe(false);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: info.outputPath(`home-images-anonymous-${width}.png`), fullPage: true });
  }
  await page.getByRole('link', { name: /和食を囲む一席/ }).click();
  await expect(page).toHaveURL(/#\/nagoya\?query=/); await page.goBack();
  await expect(page.locator('.home-inspiration-card')).toHaveCount(3);
});
test('invited home shows three real stores and consistent placeholders across detail, history and logout', async ({ page }, info) => {
  await login(page); const state = await mock(page); await page.goto(base);
  const cards = page.locator('[data-home-restaurant]'); await expect(cards).toHaveCount(3);
  const expected = [...catalog].sort((a, b) => a.name.localeCompare(b.name, 'ja')).slice(0, 3);
  await expect(cards.locator('h3')).toHaveText(expected.map(row => row.name));
  await expect(page.locator('.home-catalog-note')).toContainText('非公開情報');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const img of await cards.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: info.outputPath(`home-images-private-${width}.png`), fullPage: true });
  }
  const src = await cards.first().locator('img').getAttribute('src');
  await cards.first().locator('.home-catalog-photo-link').click();
  await expect(page.locator('.pilot-detail img')).toHaveAttribute('src', src!);
  await expect(page.locator('.pilot-detail')).toContainText('実際の店舗・料理ではありません');
  await page.screenshot({ path: info.outputPath('detail-generated-image.png'), fullPage: true });
  await page.goBack(); await expect(cards).toHaveCount(3); await page.goForward(); await page.reload();
  await expect(page.locator('.pilot-detail img')).toHaveAttribute('src', src!);
  await page.goto(base); await expect(cards).toHaveCount(3);
  await page.getByRole('button', { name: 'アカウント', exact: true }).click();
  await page.getByRole('button', { name: 'ログアウト', exact: true }).click();
  await expect(cards).toHaveCount(0); await expect(page.locator('.home-inspiration-card')).toHaveCount(3);
  expect(state.calls.some(call => /submit|moderate|prepare_profile|delete|withdraw/.test(call.name))).toBe(false);
});
test('expired and denied accounts never request private home catalog', async ({ page }) => {
  await login(page); const state = await mock(page, { expired: true }); await page.goto(base);
  await expect(page.locator('.home-inspiration-card')).toHaveCount(3);
  await expect.poll(() => state.calls.filter(c => c.name === 'dining_owner_trial_context').length).toBeGreaterThan(0);
  expect(state.calls.some(c => c.name === 'dining_owner_trial_catalog')).toBe(false);
  const denied = await mock(page, { denied: true }); await page.reload();
  await expect(page.locator('[data-home-restaurant]')).toHaveCount(0);
  expect(denied.calls.some(c => c.name === 'dining_owner_trial_catalog')).toBe(false);
});

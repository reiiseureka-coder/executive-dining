import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const id = 'e5329b58-55e3-4cc7-aee5-3940483ecced';
const disclaimer = '実店舗の写真ではないイメージ画像';
const demo = '/preview.html#/preview';

for (const width of [390, 1440]) {
  test(`approved illustration photos stay honest and usable at ${width}px`, async ({ page, context }, info) => {
    test.skip(info.project.name !== 'desktop', 'Each explicit viewport covered once.');
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const external: string[] = [], writes: string[] = [];
    page.on('request', request => {
      if (!request.url().startsWith('http://127.0.0.1:4180') && !request.url().startsWith('data:')) external.push(request.url());
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
    });
    await page.goto(demo);
    const card = page.locator(`[data-demo-id="${id}"]`);
    await expect(page.locator('.service-demo-card .restaurant-photo-open')).toHaveCount(10);
    const image = card.locator('.restaurant-photo-open img');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(card.locator('.restaurant-photos')).toContainText(disclaimer);
    await expect(image).toHaveAttribute('alt', /実店舗|実際の店舗/);
    await expect(image).toHaveAttribute('src', /^\/images\/dining-(chinese|japanese|room)\.webp$/);
    const size = await image.boundingBox();
    expect(size!.width).toBeGreaterThanOrEqual(width === 390 ? 340 : 220);
    expect(size!.height).toBeGreaterThanOrEqual(145);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`illustration-list-${width}-viewport.png`), fullPage: false });
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`illustration-card-${width}.png`), fullPage: false });
    const open = card.locator('.restaurant-photo-open');
    await open.click();
    const dialog = page.getByRole('dialog', { name: /写真を拡大/ });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(disclaimer);
    await expect(dialog.getByRole('button', { name: '写真を閉じる', exact: true })).toBeFocused();
    await page.screenshot({ path: info.outputPath(`illustration-dialog-${width}.png`), fullPage: false });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(open).toBeFocused();
    await open.click();
    await dialog.getByRole('button', { name: '写真を閉じる', exact: true }).click();
    await expect(open).toBeFocused();
    await card.getByRole('button', { name: '口コミ・店舗詳細', exact: true }).click();
    await expect(page.locator('.restaurant-photos--detail .restaurant-photo-open')).toHaveCount(2);
    await expect(page.locator('.service-demo-detail .service-demo-reviews')).toContainText('まだありません');
    await expect(page.locator('.restaurant-photos--detail')).toContainText(disclaimer);
    await page.locator('.restaurant-photos--detail .restaurant-photo-open').first().click();
    const detailDialog = page.getByRole('dialog', { name: /写真を拡大/ });
    await expect(detailDialog.getByRole('button', { name: '前の写真', exact: true })).toBeEnabled();
    await detailDialog.getByRole('button', { name: '次の写真', exact: true }).click();
    await expect(detailDialog.getByRole('button', { name: '次の写真', exact: true })).toBeEnabled();
    await expect(detailDialog).toContainText(disclaimer);
    await expect(detailDialog.locator('figure img')).toHaveAttribute('src', '/images/dining-room.webp');
    await detailDialog.getByRole('button', { name: '写真を閉じる', exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath(`illustration-detail-${width}-viewport.png`), fullPage: false });
    await page.screenshot({ path: info.outputPath(`illustration-detail-${width}.png`), fullPage: true });
    const typography = await page.locator('.service-demo-reviews h2, .service-demo-reviews p, .restaurant-photos figcaption').evaluateAll(elements => elements.map(element => ({ text: element.textContent, fontSize: getComputedStyle(element).fontSize, top: element.getBoundingClientRect().top })));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'デモの店舗一覧へ', exact: true }).first().click();
    await expect(image).toBeVisible();
    await page.goBack();
    await expect(page.locator('.restaurant-photos--detail')).toBeVisible();
    await page.reload();
    await expect(page.locator('.restaurant-photos--detail .restaurant-photo-open')).toHaveCount(2);
    expect(external).toEqual([]); expect(writes).toEqual([]);
    if (process.env.PHOTO_BASELINE_URL) {
      const before = await context.newPage();
      await before.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await before.goto(`${process.env.PHOTO_BASELINE_URL}/preview.html#/preview`);
      await expect(before.locator('[data-demo-id]')).toHaveCount(10);
      await expect(before.locator('.service-demo img')).toHaveCount(0);
      await before.screenshot({ path: info.outputPath(`before-illustration-list-${width}-viewport.png`), fullPage: false });
      await before.locator(`[data-demo-id="${id}"]`).getByRole('button', { name: '口コミ・店舗詳細', exact: true }).click();
      await before.screenshot({ path: info.outputPath(`before-illustration-detail-${width}-viewport.png`), fullPage: false });
      await before.close();
    }
    await writeFile(info.outputPath('photo-metrics.json'), JSON.stringify({ width, image: size, typography, external, writes, realVenuePhotoCount: 0, material: 'Approved generated illustrations, not actual venue photography' }, null, 2));
  });
}

test('image failure removes broken illustrations without blocking restaurant actions', async ({ page }) => {
  await page.route('**/images/dining-*.webp', route => route.abort());
  await page.goto(demo);
  const card = page.locator(`[data-demo-id="${id}"]`);
  await expect(card.locator('.restaurant-photo-open')).toHaveCount(0);
  await card.getByRole('button', { name: '口コミ・店舗詳細', exact: true }).click();
  await expect(page.locator('.restaurant-photo-open')).toHaveCount(0);
  await expect(page.locator('.restaurant-photo-unavailable')).toBeVisible();
  await expect(page.locator('.restaurant-photo-unavailable')).not.toContainText('実店舗写真');
  await expect(page.locator('.restaurant-photo-official a')).toHaveAttribute('href', 'https://www.nagoyakankohotel.co.jp/restaurant_bars/ryujo/');
  await expect(page.locator('.service-demo-reviews')).toContainText('まだありません');
  await page.getByRole('button', { name: 'デモの店舗一覧へ', exact: true }).first().click();
  await expect(card.getByRole('button', { name: '口コミ・店舗詳細', exact: true })).toBeVisible();
});

test('losing an opening or final illustration returns focus to a surviving detail control', async ({ page }) => {
  await page.goto(`${demo}/${id}`);
  const open = page.locator('.restaurant-photo-open');
  await open.first().click();
  const dialog = page.getByRole('dialog', { name: /写真を拡大/ });
  await dialog.locator('figure img').dispatchEvent('error');
  await expect(dialog.locator('figure img')).toHaveAttribute('src', '/images/dining-room.webp');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'デモの店舗一覧へ', exact: true }).first()).toBeFocused();
  await open.first().click();
  await dialog.locator('figure img').dispatchEvent('error');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'デモの店舗一覧へ', exact: true }).first()).toBeFocused();
});

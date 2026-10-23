import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
for (const width of [390, 1440]) {
  test(`public service home is usable without a connection at ${width}px`, async ({ page, context }, info) => {
    test.skip(info.project.name !== 'desktop', 'Explicit viewport runs once.');
    test.setTimeout(90_000);
    const height = width === 390 ? 844 : 1000;
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('会食専用口コミサイト');
    await expect(page.locator('.service-lead')).toHaveText('実際に利用した人の声を手がかりに、次の会食のお店を探す。');
    await expect(page.locator('.service-live-entry')).toContainText('店舗検索は未接続');
    await expect(page.locator('.service-home [data-home-state], .service-home form, .service-home img')).toHaveCount(0);
    const start = page.getByRole('link', { name: 'お店を探す（閲覧デモ）', exact: true });
    await expect(start).toHaveAttribute('href', '/preview.html#/preview');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const identity = page.getByRole('heading', { level: 1 });
    const identityRect = await identity.boundingBox();
    const leadRect = await page.locator('.service-lead').boundingBox();
    expect(identityRect!.y).toBeGreaterThanOrEqual(0);
    expect(identityRect!.y + identityRect!.height).toBeLessThanOrEqual(height);
    expect(leadRect!.y + leadRect!.height).toBeLessThanOrEqual(height);
    const startRect = await start.boundingBox();
    expect(startRect!.y + startRect!.height).toBeLessThanOrEqual(height);
    const nav = page.locator(width === 390 ? '.mobile-primary-nav' : '.desktop-nav');
    await expect(nav.getByRole('button', { name: 'ホーム', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'ホーム', exact: true })).toHaveAttribute('aria-current', 'page');
    const typography = await page.locator('.service-intro h1, .service-lead, .service-start>p, .service-start>a, .service-reading p').evaluateAll(elements => elements.map(element => { const style = getComputedStyle(element), rect = element.getBoundingClientRect(); return { text: element.textContent, fontSize: parseFloat(style.fontSize), lineHeight: style.lineHeight, top: rect.top, height: rect.height }; }));
    for (const item of typography) expect(item.fontSize).toBeGreaterThanOrEqual(16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`service-home-${width}-viewport.png`), animations: 'disabled' });
    await page.screenshot({ path: info.outputPath(`service-home-${width}.png`), fullPage: true, animations: 'disabled' });
    await page.locator('.service-live-entry').getByRole('link').click();
    await expect(page).toHaveURL(/#\/find$/);
    await expect(page.locator('[data-home-state="disconnected"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-home-state="disconnected"]')).toBeVisible();
    await nav.getByRole('button', { name: 'ホーム', exact: true }).click();
    await expect(page.locator('.service-home')).toBeVisible();
    await page.goBack(); await expect(page).toHaveURL(/#\/find$/);
    await page.goForward(); await expect(page.locator('.service-home')).toBeVisible();
    await page.goto('/#/nagoya');
    await nav.getByRole('button', { name: 'ホーム', exact: true }).click();
    await expect(page.locator('.service-home')).toBeVisible();
    await start.click();
    await expect(page).toHaveURL(/\/preview\.html#\/preview$/);
    await expect(page.getByText('閲覧専用デモ', { exact: true }).first()).toBeVisible();
    await page.locator('.service-demo-header').getByRole('link', { name: 'ホーム', exact: true }).click();
    await expect(page.locator('.service-home')).toBeVisible();
    let baseline = false;
    if (process.env.SERVICE_HOME_BASELINE_URL) {
      const before = await context.newPage(); await before.setViewportSize({ width, height });
      await before.goto(process.env.SERVICE_HOME_BASELINE_URL);
      await expect(before.locator('[data-home-state="disconnected"]')).toBeVisible();
      await before.screenshot({ path: info.outputPath(`before-service-home-${width}-viewport.png`), animations: 'disabled' });
      await before.screenshot({ path: info.outputPath(`before-service-home-${width}.png`), fullPage: true, animations: 'disabled' });
      await before.close(); baseline = true;
    }
    let productBaseline: unknown = null;
    if (process.env.PRODUCT_BASELINE_URL) {
      const before = await context.newPage();
      await before.setViewportSize({ width, height });
      await before.goto(process.env.PRODUCT_BASELINE_URL);
      await expect(before.getByRole('heading', { level: 1 })).toHaveText('会食の候補を、条件で選ぶ。');
      await before.screenshot({ path: info.outputPath(`before-review-first-home-${width}-viewport.png`), animations: 'disabled' });
      await before.screenshot({ path: info.outputPath(`before-review-first-home-${width}.png`), fullPage: true, animations: 'disabled' });
      productBaseline = await before.locator('.service-intro h1, .service-lead, .service-start>a').evaluateAll(elements => elements.map(element => { const style = getComputedStyle(element), rect = element.getBoundingClientRect(); return { text: element.textContent, fontSize: parseFloat(style.fontSize), top: rect.top, bottom: rect.bottom }; }));
      await before.close();
    }
    await writeFile(info.outputPath('density-metrics.json'), JSON.stringify({ width, height, state: 'unconfigured service home', identity: '会食専用口コミサイト', typography, identityRect, leadRect, startRect, baseline, productBaseline }, null, 2));
  });
}

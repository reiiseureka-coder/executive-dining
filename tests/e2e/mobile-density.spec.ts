import { writeFile } from 'node:fs/promises';
import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { login, mock } from './helpers/ownerTrial';
import { reviewBeforeFacts, readableReviewText } from './helpers/reviewHierarchy';

test.setTimeout(120_000);
const widths = [320, 375, 390, 430];
const viewportHeight = 844;

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

// Document coordinates keep this check honest even if an earlier interaction scrolled.
async function documentBounds(locator: Locator) {
  await expect(locator).toBeVisible();
  return locator.evaluate(element => {
    const { top, height } = element.getBoundingClientRect();
    return { top: top + window.scrollY, height, bottom: top + window.scrollY + height };
  });
}

async function ready(page: Page) {
  await expect(page.locator('main h1')).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
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

async function screenshot(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: 'disabled' });
}

test.beforeEach(async ({ isMobile }, info) => {
  test.skip(!isMobile || info.project.name !== 'mobile', 'Density coverage runs once in the mobile project.');
});

for (const width of widths) {
  test(`disconnected discovery explains its primary state and keeps business links secondary at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: viewportHeight });
    await page.goto('/#/find');
    await ready(page);

    await expect(page.locator('[data-home-state="disconnected"]')).toBeVisible();
    await expect(page.getByRole('search')).toHaveCount(0);
    await expect(page.locator('.home-find img, .home-find .home-audience-links')).toHaveCount(0);
    const description = page.locator('.home-state-description');
    expect(await description.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    expect((await documentBounds(description)).bottom).toBeLessThanOrEqual(viewportHeight);
    const corporate = page.locator('.home-closing a[href="#/corporate"]');
    await expect(corporate).toHaveCount(1);
    await expect(page.locator('.home-closing a[href="#/restaurants"]')).toBeVisible();
    await fits(page);
    await screenshot(page, info, `find-disconnected-${width}`);

    await corporate.click();
    await expect(page).toHaveURL(/#\/corporate$/);
    await expect(page.getByRole('heading', { name: 'エンタープライズプラン', exact: true })).toBeInViewport();
  });

  test(`mocked available discovery prioritizes review context and preserves readable facts at ${width}px`, async ({ page }, info) => {
    // A signed-in RPC fixture, not a production account or live database check.
    await page.setViewportSize({ width, height: viewportHeight });
    await login(page); await mock(page); await page.goto('http://127.0.0.1:4181/#/find');
    await ready(page);
    await expect(page.locator('[data-home-state="available"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('名古屋の会食店を探す');
    const search = page.getByRole('searchbox', { name: '店名・エリアから探す', exact: true });
    const field = await search.evaluate(element => ({
      fontSize: parseFloat(getComputedStyle(element).fontSize),
      height: element.getBoundingClientRect().height,
    }));
    expect(field.fontSize).toBeGreaterThanOrEqual(16);
    expect(field.height).toBeGreaterThanOrEqual(44);
    const first = page.locator('[data-home-restaurant]').first();
    expect((await documentBounds(first.locator('h3'))).top).toBeLessThan(viewportHeight);
    expect(await first.locator('h3 a').evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(22);
    await reviewBeforeFacts(first, '.home-private-reviews');
    await readableReviewText(first.locator('.home-private-reviews h4, .home-private-reviews p'));
    for (const label of ['price', 'private_room']) {
      const value = first.locator(`[data-fact="${label}"] dd`);
      await expect(value).toBeVisible();
      const type = await value.evaluate(element => {
        const style = getComputedStyle(element);
        return { size: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight), clamp: style.webkitLineClamp };
      });
      expect(type.size).toBeGreaterThanOrEqual(16);
      expect(type.lineHeight).toBeGreaterThanOrEqual(24);
      expect(['none', '0', '']).toContain(type.clamp);
    }
    await expect(first.locator('details')).toHaveCount(0);
    await illustrativeImages(first, 1);
    await expect(page.locator('.quick-links')).toHaveCount(0);
    await fits(page);
    await screenshot(page, info, `find-available-private-fixture-${width}`);
  });

  test(`corporate introduction and consultation stay near the top at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: viewportHeight });
    await page.goto('/#/corporate');
    await ready(page);

    const introduction = await documentBounds(page.locator('.enterprise-intro'));
    const consultation = await documentBounds(page.locator('.enterprise-consultation'));
    const heading = await documentBounds(page.locator('#enterprise-consultation-title'));
    const copy = await documentBounds(page.getByRole('button', { name: '相談メモをコピー', exact: true }));
    const features = await documentBounds(page.locator('.enterprise-features'));
    expect(heading.top).toBeLessThanOrEqual(700);
    expect(copy.bottom).toBeLessThanOrEqual(viewportHeight);
    expect(introduction.bottom).toBeLessThanOrEqual(consultation.top);
    expect(consultation.bottom).toBeLessThanOrEqual(features.top);
    await expect(page.locator('.enterprise-hero + .enterprise-consultation')).toHaveCount(1);
    await fits(page);
    await screenshot(page, info, `after-corporate-density-${width}`);
  });
}

test('compare corporate consultation distance before and after at 390px', async ({ page }, info) => {
  const baseline = process.env.MOBILE_BASELINE_URL;
  test.skip(!baseline, 'Set MOBILE_BASELINE_URL to the pinned pre-density reference server.');
  await page.setViewportSize({ width: 390, height: viewportHeight });

  async function capture(base: string, phase: 'before' | 'after') {
    await page.goto(`${base}/#/corporate`);
    await ready(page);
    const consultationTitle = await documentBounds(page.locator('#enterprise-consultation-title'));
    const copyButton = await documentBounds(page.getByRole('button', { name: '相談メモをコピー', exact: true }));
    await screenshot(page, info, `${phase}-corporate-density-390`);
    return { corporate: { consultationTitle, copyButton } };
  }

  const before = await capture(baseline!.replace(/\/$/, ''), 'before');
  const after = await capture('', 'after');
  const metrics = {
    viewport: { width: 390, height: viewportHeight },
    unit: 'CSS pixels from document top',
    before,
    after,
    reducedDistance: {
      corporateConsultationTitle: before.corporate.consultationTitle.top - after.corporate.consultationTitle.top,
      corporateCopyButton: before.corporate.copyButton.top - after.corporate.copyButton.top,
    },
  };
  const output = JSON.stringify(metrics, null, 2);
  const path = info.outputPath('density-metrics.json');
  await writeFile(path, `${output}\n`, 'utf8');
  await info.attach('density-metrics', { path, contentType: 'application/json' });
  console.log(`MOBILE_DENSITY_METRICS ${output}`);
  expect(metrics.reducedDistance.corporateConsultationTitle).toBeGreaterThan(0);
  expect(metrics.reducedDistance.corporateCopyButton).toBeGreaterThan(0);
});

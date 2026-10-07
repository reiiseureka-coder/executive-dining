import { writeFile } from 'node:fs/promises';
import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';

test.setTimeout(120_000);
const widths = [320, 375, 390, 430];
const viewportHeight = 844;

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
  test(`home corporate entry is reachable without a long scroll at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: viewportHeight });
    await page.goto('/');
    await ready(page);

    const entryLinks = page.locator('.hero-copy .home-audience-links');
    const corporate = entryLinks.locator('a[href="#/corporate"]');
    const restaurants = entryLinks.locator('a[href="#/restaurants"]');
    await expect(corporate).toHaveCount(1);
    await expect(restaurants).toBeVisible();
    expect((await documentBounds(corporate)).bottom).toBeLessThanOrEqual(800);
    await expect(page.locator('.hero-copy .home-availability + .home-audience-links')).toHaveCount(1);

    const search = page.getByRole('searchbox');
    const field = await search.evaluate(element => ({
      fontSize: parseFloat(getComputedStyle(element).fontSize),
      height: element.getBoundingClientRect().height,
    }));
    expect(field.fontSize).toBeGreaterThanOrEqual(16);
    expect(field.height).toBeGreaterThanOrEqual(44);
    await fits(page);
    await screenshot(page, info, `after-home-density-${width}`);

    await corporate.click();
    await expect(page).toHaveURL(/#\/corporate$/);
    await expect(page.getByRole('heading', { name: 'エンタープライズプラン', exact: true })).toBeInViewport();
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

test('compare before and after vertical distance at 390px', async ({ page }, info) => {
  const baseline = process.env.MOBILE_BASELINE_URL;
  test.skip(!baseline, 'Set MOBILE_BASELINE_URL to the pinned pre-density reference server.');
  await page.setViewportSize({ width: 390, height: viewportHeight });

  async function capture(base: string, phase: 'before' | 'after') {
    await page.goto(`${base}/`);
    await ready(page);
    const corporateEntry = await documentBounds(page.locator(
      phase === 'before' ? '.home-partners a[href="#/corporate"]' : '.home-audience-links a[href="#/corporate"]',
    ));
    await screenshot(page, info, `${phase}-home-density-390`);

    await page.goto(`${base}/#/corporate`);
    await ready(page);
    const consultationTitle = await documentBounds(page.locator('#enterprise-consultation-title'));
    const copyButton = await documentBounds(page.getByRole('button', { name: '相談メモをコピー', exact: true }));
    await screenshot(page, info, `${phase}-corporate-density-390`);
    return { home: { corporateEntry }, corporate: { consultationTitle, copyButton } };
  }

  const before = await capture(baseline!.replace(/\/$/, ''), 'before');
  const after = await capture('', 'after');
  const metrics = {
    viewport: { width: 390, height: viewportHeight },
    unit: 'CSS pixels from document top',
    before,
    after,
    reducedDistance: {
      homeCorporateEntry: before.home.corporateEntry.top - after.home.corporateEntry.top,
      corporateConsultationTitle: before.corporate.consultationTitle.top - after.corporate.consultationTitle.top,
      corporateCopyButton: before.corporate.copyButton.top - after.corporate.copyButton.top,
    },
  };
  const output = JSON.stringify(metrics, null, 2);
  const path = info.outputPath('density-metrics.json');
  await writeFile(path, `${output}\n`, 'utf8');
  await info.attach('density-metrics', { path, contentType: 'application/json' });
  console.log(`MOBILE_DENSITY_METRICS ${output}`);
  expect(metrics.reducedDistance.homeCorporateEntry).toBeGreaterThan(0);
  expect(metrics.reducedDistance.corporateConsultationTitle).toBeGreaterThan(0);
  expect(metrics.reducedDistance.corporateCopyButton).toBeGreaterThan(0);
});

import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { login, mock } from './helpers/ownerTrial';
test.setTimeout(120_000);
const widths = [320, 375, 390, 430, 768];
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1);
}
async function screenshot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, animations: 'disabled' });
}
for (const width of widths) {
  test(`mobile layout is readable at ${width}px`, async ({page}, info) => {
    test.skip(info.project.name !== 'mobile', 'Viewport coverage runs once in the mobile project.');
    await page.setViewportSize({width, height:844});
    for (const [route, name] of [['/', 'home'], ['/#/corporate','corporate'], ['/#/restaurants','restaurants'], ['/#/membership','membership'], ['/#/admin','admin'], ['/#/curation','curation']]) {
      await page.goto(route);
      await expect(page.locator('main h1, main h2').first()).toBeVisible();
      await fits(page);
      if (width <= 760) {
        const tinyFields = await page.locator('main input:not([type=checkbox]):not([type=radio]):not([type=range]), main select, main textarea').evaluateAll(els => els.filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(el => el.outerHTML.slice(0,120)));
        expect(tinyFields).toEqual([]);
      }
      await screenshot(page, info, name);
    }
    await page.goto('/');
    await page.getByRole('button',{name:'メニューを開く'}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await fits(page);
    const close = await page.getByRole('button',{name:'閉じる',exact:true}).boundingBox();
    expect(close?.height).toBeGreaterThanOrEqual(44);
    await screenshot(page, info, 'menu');
    await page.getByRole('button',{name:'法人の方へ',exact:true}).click();
    await expect(page).toHaveURL(/#\/corporate$/);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.goBack();
    await expect(page.locator('.home-hero')).toBeVisible();
    await page.getByRole('button',{name:'メニューを開く'}).click();
    await page.getByRole('button',{name:'閉じる',exact:true}).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
  test(`private catalog and detail fit ${width}px`, async ({page}, info) => {
    test.skip(info.project.name !== 'mobile');
    await page.setViewportSize({width,height:844});
    await login(page); await mock(page);
    await page.goto('http://127.0.0.1:4181/#/nagoya');
    await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
    await fits(page); await screenshot(page,info,'private-catalog');
    await page.getByRole('button',{name:'店舗の詳細を見る',exact:true}).first().click();
    await expect(page.locator('.verified-facts').first()).toBeVisible();
    await fits(page); await screenshot(page,info,'private-detail');
  });
}
test('login stays readable when the keyboard reduces available height', async ({page}, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.setViewportSize({width:320,height:440});
  await page.route('https://test-project.supabase.co/**', route => route.fulfill({json:[]}));
  await page.goto('http://127.0.0.1:4182/');
  await page.getByRole('button',{name:'メニューを開く'}).click();
  await page.getByRole('button',{name:'ログイン',exact:true}).click();
  await page.getByRole('textbox',{name:'メールアドレス'}).fill('fixture@example.test');
  await expect(page.getByRole('textbox',{name:'メールアドレス'})).toHaveCSS('font-size','16px');
  await fits(page);
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds?.height).toBeLessThanOrEqual(416);
  await page.getByRole('button',{name:'ログインリンクを送る'}).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'ログインリンクを送る'})).toBeInViewport();
  await screenshot(page,info,'login-short-viewport');
  await page.getByRole('button',{name:'閉じる',exact:true}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// The CI reference server is pinned to the source before this mobile refresh.
// These are review artifacts, not brittle pixel-equality assertions.
test('capture pre-mobile home and enterprise reference', async ({page}, info) => {
  test.skip(info.project.name !== 'mobile' || !process.env.MOBILE_BASELINE_URL);
  for (const width of [320, 390, 430, 768]) {
    await page.setViewportSize({width,height:844});
    for (const [route,name] of [['/','home'],['/#/corporate','corporate']]) {
      await page.goto(`${process.env.MOBILE_BASELINE_URL}${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await screenshot(page,info,`before-${name}-${width}`);
    }
  }
});

import { test, expect } from '@playwright/test';
import { catalog, login, mock } from './helpers/ownerTrial';
const privateBase = 'http://127.0.0.1:4181';
for (const width of [390,1440]) {
  test(`editorial home, disclosures, and repeated login dismissal at ${width}px`,async({page},info)=>{
    test.skip(info.project.name!=='desktop','Run each explicit width once.');
    await page.setViewportSize({width,height:900});await page.goto('/');
    await expect(page.getByRole('search')).toBeVisible();
    await expect(page.locator('.editorial-home img')).toHaveCount(1);
    await expect(page.locator('.home-catalog img, .city-list')).toHaveCount(0);
    for (const summary of await page.locator('.home-guide-list summary').all()) {
      await summary.click();await expect(summary.locator('..')).toHaveAttribute('open','');await summary.click();await expect(summary.locator('..')).not.toHaveAttribute('open','');
    }
    const loginButton=page.getByRole('button',{name:'招待済みの方はログイン',exact:true});
    for(let i=0;i<2;i++){
      await loginButton.click();await expect(page.getByRole('dialog')).toBeVisible();
      if(i===0)await page.getByRole('button',{name:'閉じる',exact:true}).click();else await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
    }
    await page.getByRole('searchbox').fill('個室');await page.getByRole('button',{name:'探す',exact:true}).click();
    await expect(page.getByRole('textbox',{name:'名古屋の確認済み店舗を検索'})).toHaveValue('個室');
    await page.goBack();await expect(page.locator('.editorial-home')).toBeVisible();await page.goForward();
    await expect(page.getByRole('textbox',{name:'名古屋の確認済み店舗を検索'})).toHaveValue('個室');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`redesign-empty-${width}.png`),fullPage:true});
    await page.goto('/');await page.screenshot({path:info.outputPath(`redesign-home-${width}.png`),fullPage:true});
  });
  test(`real list preserves complete conditions with progressive disclosure at ${width}px`,async({page},info)=>{
    test.skip(info.project.name!=='desktop','Run each explicit width once.');
    await page.setViewportSize({width,height:900});await login(page);const state=await mock(page);await page.goto(`${privateBase}/#/nagoya`);
    const first=page.locator(`[data-pilot-id="${catalog[0].id}"]`);
    await expect(page.locator('.verified-list img')).toHaveCount(0);
    await expect(page.locator('.catalog-conditions[open]')).toHaveCount(0);
    const price=catalog[0].facts.find(f=>f.field==='price')!.value;
    await expect(first.getByText(price,{exact:true})).not.toBeVisible();
    await first.locator('.catalog-conditions > summary').click();await expect(first.getByText(price,{exact:true})).toBeVisible();
    await first.locator('.catalog-conditions > summary').click();await expect(first.getByText(price,{exact:true})).not.toBeVisible();
    await first.getByRole('button',{name:'比較に追加',exact:true}).click();
    await expect(first.getByRole('button',{name:'比較から外す',exact:true})).toHaveAttribute('aria-pressed','true');
    await first.getByRole('button',{name:'店舗の詳細を見る',exact:true}).click();
    await expect(page.locator('.pilot-detail img')).toHaveCount(0);await expect(page.locator('.pilot-detail').getByText(price,{exact:true})).toBeVisible();
    await page.screenshot({path:info.outputPath(`redesign-detail-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'実店舗一覧へ戻る',exact:true}).click();await expect(first).toBeFocused();
    await expect(first.getByRole('button',{name:'比較から外す',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:info.outputPath(`redesign-list-${width}.png`),fullPage:true});
    expect(state.calls.some(call=>/submit|prepare_profile|delete|withdraw/.test(call.name))).toBe(false);
  });
}

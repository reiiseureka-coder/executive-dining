import {test,expect} from '@playwright/test';
import {catalog,login,mock} from './helpers/ownerTrial';
const base='http://127.0.0.1:4181';
test('connected preparation offers invitation login, and cancelling keeps the requested route at every width',async({page},info)=>{
 await page.route('https://test-project.supabase.co/**',route=>route.fulfill({json:[]}));
 for(const width of (info.project.name==='mobile'?[320,390,430]:[1280])){
  await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:4182/#/nagoya?query=個室');
  await expect(page.getByRole('heading',{name:'名古屋の掲載情報を準備しています'})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'名古屋の確認済み店舗を検索'})).toHaveCount(0);
  const requested=page.url();const button=page.getByRole('button',{name:'招待済みの方はログイン',exact:true});await button.click();
  await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('textbox',{name:'メールアドレス'})).toBeVisible();
  await page.getByRole('button',{name:'閉じる',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page).toHaveURL(requested);
  await button.click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page).toHaveURL(requested);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await button.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.screenshot({path:info.outputPath(`first-search-${width}.png`),fullPage:true});
 }
});
test('detail return restores the selected list position and keyboard focus through history',async({page})=>{
 await login(page);await mock(page);await page.goto(`${base}/#/nagoya`);
 const row=catalog[6];const card=page.locator(`[data-pilot-id="${row.id}"]`);const details=card.getByRole('button',{name:'店舗の詳細を見る',exact:true});
 await details.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);expect(before).toBeGreaterThan(500);await details.click();
 await expect(page.locator('.pilot-detail')).toBeVisible();await page.getByRole('button',{name:'実店舗一覧へ戻る',exact:true}).click();
 await expect(card).toBeFocused();expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(100);
 await details.click();await page.goBack();await expect(card).toBeFocused();expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(100);
});
test('owner comparison and empty searches always offer a direct next action, without test controls on customer routes',async({page})=>{
 await login(page);const state=await mock(page);await page.goto(`${base}/#/compare`);
 await page.getByRole('button',{name:'店舗一覧から選ぶ',exact:true}).click();
 const search=page.getByRole('textbox',{name:'非公開の実店舗を検索'});await search.fill('見つからない店xyz');
 await page.getByRole('button',{name:'すべての実店舗を見る',exact:true}).click();await expect(search).toHaveValue('');
 await expect(page.locator('[data-pilot-id]')).toHaveCount(10);
 await page.locator(`[data-pilot-id="${catalog[0].id}"]`).getByRole('button',{name:'店舗の詳細を見る',exact:true}).click();
 await page.locator('.pilot-detail').getByRole('button',{name:'比較に追加',exact:true}).click();await expect(page.getByRole('button',{name:'候補を比較（1）',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'候補を比較（1）',exact:true}).click();await expect(page.getByRole('heading',{name:'あと1店選ぶと比較できます'})).toBeVisible();
 await page.getByRole('button',{name:'店舗一覧から選ぶ',exact:true}).click();await page.locator(`[data-pilot-id="${catalog[1].id}"]`).getByRole('button',{name:'比較に追加',exact:true}).click();
 await page.getByRole('button',{name:'候補を比較（2）',exact:true}).click();await page.getByRole('button',{name:'詳細を見る',exact:true}).first().click();await page.getByRole('button',{name:'比較に戻る',exact:true}).click();await expect(page.getByRole('table')).toBeVisible();
 await expect(page.locator('.pilot-profile')).toHaveCount(0);await expect(page.getByRole('heading',{name:'この店舗で投稿テスト'})).toHaveCount(0);
 expect(state.calls.some(c=>/submit|prepare_profile|withdraw|delete/.test(c.name))).toBe(false);
});

import {test,expect,type Page} from '@playwright/test';
import {catalog,login,mock} from './helpers/ownerTrial';
const base='http://127.0.0.1:4181';
async function menu(page:Page,isMobile:boolean){if(isMobile)await page.getByRole('button',{name:'メニューを開く'}).click();}
test('single entry restores owner session, real ten stores, details/back and comparison/reload',async({page,isMobile})=>{
 await login(page);const state=await mock(page);await page.goto(`${base}/#/nagoya`);
 await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
 await expect(page.locator('.private-mode-banner')).toContainText('非公開テスト中');
 await expect(page.locator('.site-footer')).not.toContainText('サンプル・デモ');
 await page.getByRole('textbox',{name:'非公開の実店舗を検索'}).fill('名古屋浅田');
 const row=catalog.find((r:{name:string})=>r.name==='名古屋浅田');
 await page.locator(`[data-pilot-id="${row.id}"]`).getByRole('button',{name:'店舗の詳細を見る'}).click();
 await expect(page).toHaveURL(new RegExp(`nagoya/${row.id}`));
 await page.goBack();await expect(page.getByRole('textbox',{name:'非公開の実店舗を検索'})).toHaveValue('名古屋浅田');
 await page.goForward();await expect(page.getByRole('heading',{name:'この店舗で投稿テスト'})).toBeVisible();
 await page.getByRole('button',{name:'実店舗一覧へ戻る'}).click();await page.getByRole('textbox',{name:'非公開の実店舗を検索'}).fill('');
 for(const row of catalog.slice(0,2))await page.locator(`[data-pilot-id="${row.id}"]`).getByRole('button',{name:'比較に追加',exact:true}).click();
 await page.getByRole('button',{name:'候補の比較を開く'}).click();await expect(page.getByRole('table')).toBeVisible();
 await page.reload();await expect(page.getByRole('table')).toBeVisible();
 await menu(page,isMobile);await page.getByRole('button',{name:'運営管理',exact:true}).click();
 await expect(page.getByRole('heading',{name:'店舗情報の確認・審査'})).toBeVisible();
 await expect(page.locator('.private-mode-banner')).toBeVisible();
 await page.getByRole('button',{name:'Executive Dining ホーム',exact:true}).click();
 await expect(page.getByRole('heading',{name:/大切な話を、\s*心地よい一席で。/})).toBeVisible();
 await expect(page.locator('.private-mode-banner')).toHaveCount(0);
 await page.getByRole('button',{name:'店舗一覧へ',exact:true}).click();
 await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
 expect(state.calls.some(c=>c.name==='otp')).toBe(false);
});
test('forged owner metadata cannot expose management or real private data from the single entry',async({page,isMobile})=>{
 await login(page);const state=await mock(page,{denied:true});await page.goto(`${base}/#/nagoya`);
 await expect(page.getByRole('heading',{name:/名古屋の会食/})).toBeVisible();
 await expect(page.locator('.private-mode-banner')).toHaveCount(0);
 await menu(page,isMobile);await expect(page.getByRole('button',{name:'運営管理',exact:true})).toHaveCount(0);
 expect(state.calls.some(c=>c.name==='dining_owner_trial_catalog'||c.name==='dining_editor_queue')).toBe(false);
});
test('owner connection failure shows a retry instead of silently replacing the catalog with public zero',async({page})=>{
 await login(page);await mock(page);const pattern='**/rpc/dining_owner_trial_context';
 await page.route(pattern,route=>route.fulfill({status:503,json:{code:'unavailable'}}));
 await page.goto(`${base}/#/nagoya`);await expect(page.getByRole('alert')).toContainText('利用権限を確認できませんでした');
 await expect(page.locator('.private-mode-banner')).toHaveCount(0);
 await page.unroute(pattern);await page.getByRole('button',{name:'利用権限を再確認'}).click();
 await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
});
test('logging out clears private workspace and navigation immediately without a redirect loop',async({page,isMobile})=>{
 await login(page);await mock(page);await page.goto(`${base}/#/nagoya`);await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
 await menu(page,isMobile);await page.getByRole('button',{name:'アカウント',exact:true}).click();
 await page.getByRole('button',{name:'ログアウト',exact:true}).click();
 await expect(page.locator('.private-mode-banner')).toHaveCount(0);await expect(page.locator('[data-pilot-id]')).toHaveCount(0);
 await page.reload();await expect(page.locator('[data-pilot-id]')).toHaveCount(0);await expect(page.locator('.private-mode-banner')).toHaveCount(0);
});

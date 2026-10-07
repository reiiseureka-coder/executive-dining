import {test,expect,type Page} from '@playwright/test';
import {catalog,comment,login,mock} from './helpers/ownerTrial';
const base='http://127.0.0.1:4181';
async function prepare(page:Page){if(!await page.locator('.pilot-profile').getAttribute('open').then(value=>value!==null))await page.locator('.pilot-profile summary').click();await page.getByLabel('架空のプロフィールだけを非公開テスト用に保存します',{exact:true}).check();await page.getByRole('button',{name:'架空プロフィールを準備する',exact:true}).click();await expect(page.locator('.pilot-profile summary')).toHaveText('架空プロフィール（準備済み）');}
test('real ten-venue private flow reaches dummy submission, queue, withdrawal and deletion',async({page})=>{
 await login(page);const state=await mock(page);await page.goto(`${base}/#/pilot`);await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
 for(const row of catalog)await expect(page.getByRole('heading',{name:row.name,exact:true})).toBeVisible();
 await prepare(page);const row=catalog.find((r:{name:string})=>r.name==='名古屋浅田');
 await page.locator(`[data-pilot-id="${row.id}"]`).getByRole('button',{name:'店舗の詳細を見る',exact:true}).click();
 await expect(page.getByRole('heading',{name:row.name,exact:true})).toBeVisible();await page.getByRole('button',{name:'固定のテスト投稿を送信する',exact:true}).click();
 await expect(page.getByText('非公開のテスト投稿を受け付けました。自分の投稿と審査キューから確認できます。',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'審査キューを見る',exact:true}).click();await expect(page.getByText(comment,{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'承認',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'自分のテスト投稿',exact:true}).click();await page.getByRole('button',{name:'このテスト投稿を取り下げる',exact:true}).click();await expect(page.getByText('PRIVATE TEST / 取り下げ済み',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'テストデータを削除する',exact:true}).click();await page.getByRole('button',{name:'キャンセル',exact:true}).click();await expect(page.getByText(comment,{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'テストデータを削除する',exact:true}).click();await page.getByRole('button',{name:'テストデータの削除を確定',exact:true}).click();await expect(page.getByRole('heading',{name:'テスト投稿はまだありません',exact:true})).toBeVisible();
 expect(state.calls.filter(c=>c.name==='dining_owner_trial_submit')).toHaveLength(1);
 expect(state.calls.some(c=>/moderate|dining_submit_review_v2|dining_save_profile_v2/.test(c.name))).toBe(false);
});
test('owner can search exact real facts and compare real course/room conditions without publishing candidates',async({page})=>{
 await login(page);await mock(page);await page.goto(`${base}/#/pilot`);await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'非公開の実店舗を検索'}).fill('名古屋浅田');await expect(page.getByText('実店舗 1 / 10件（非公開）',{exact:true})).toBeVisible();await page.getByRole('textbox',{name:'非公開の実店舗を検索'}).fill('');
 for(const name of ['名古屋浅田','日本料理 加賀屋 名古屋店']){const row=catalog.find((r:{name:string})=>r.name===name);await page.locator(`[data-pilot-id="${row.id}"]`).getByRole('button',{name:'比較に追加',exact:true}).click();}
 await page.getByRole('button',{name:'候補を比較（2）',exact:true}).click();const table=page.getByRole('table');await expect(table).toContainText('サービス料15%');await expect(table).toContainText('個室8室');await expect(table).toContainText('未確認');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>/profile|pilot|owner.trial/.test(key)))).toEqual([]);
 await page.reload();await expect(page.getByRole('table')).toContainText('サービス料15%');await expect(page.getByRole('table')).toContainText('個室8室');
});
test('anonymous or non-owner metadata never unlocks the private catalog',async({page})=>{
 const state=await mock(page,{denied:true});await page.goto(`${base}/#/pilot`);await expect(page.getByRole('heading',{name:'オーナーのログインが必要です'})).toBeVisible();expect(state.calls.filter(c=>c.name.startsWith('dining_owner_trial_'))).toHaveLength(0);
 await login(page);await page.reload();await expect(page.getByRole('alert')).toContainText('このアカウントの非公開テストはまだ有効になっていない');await expect(page.getByRole('heading',{name:'名古屋浅田',exact:true})).toHaveCount(0);
});
test('uncertain submission is reconciled by reading saved state without sending again',async({page})=>{
 await login(page);const state=await mock(page,{uncertain:true});await page.goto(`${base}/#/pilot`);await prepare(page);await page.locator(`[data-pilot-id="${catalog[0].id}"]`).getByRole('button',{name:'店舗の詳細を見る',exact:true}).click();await page.getByRole('button',{name:'固定のテスト投稿を送信する',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('送信結果を確認できません');await expect(page.getByRole('button',{name:'固定のテスト投稿を送信する',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'受付状況を再確認',exact:true}).click();await expect(page.getByText('この店舗のテスト投稿があります。「自分のテスト投稿」で確認できます。',{exact:true})).toBeVisible();expect(state.calls.filter(c=>c.name==='dining_owner_trial_submit')).toHaveLength(1);
});
test('expired trial reads only own cleanup state and does not request catalog or queue',async({page})=>{
 await login(page);const state=await mock(page,{expired:true});await page.goto(`${base}/#/pilot`);await expect(page.getByText(/テスト受付と店舗閲覧の期間は終了しました/)).toBeVisible();await expect(page.getByRole('heading',{name:'自分の非公開テスト投稿'})).toBeVisible();expect(state.calls.some(c=>['dining_owner_trial_catalog','dining_owner_trial_queue'].includes(c.name))).toBe(false);
});

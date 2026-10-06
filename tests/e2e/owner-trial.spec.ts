import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const catalog=JSON.parse(readFileSync(new URL('../fixtures/owner-trial-catalog.json',import.meta.url),'utf8'));
const base='http://127.0.0.1:4181';
const label='製薬業界・大規模企業 / 部門マネジメント / K・T';
const publicAuthor={profileVersion:1,industry:'pharmaceutical',companySize:'large',roleLayer:'department',initials:'K・T',label,declaration:'self_declared',operatorAtSubmission:false};
const comment='これは操作確認用の非公開テスト投稿です。実際の来店体験・店舗の評価ではありません。';
async function login(page:Page){await page.addInitScript(()=>{const part=(value:unknown)=>btoa(JSON.stringify(value)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');const id='11111111-1111-4111-8111-111111111111';const exp=Math.floor(Date.now()/1000)+3600;localStorage.setItem('sb-test-project-auth-token',JSON.stringify({access_token:`${part({alg:'HS256',typ:'JWT'})}.${part({sub:id,role:'authenticated',exp})}.test-only`,refresh_token:'synthetic-only',expires_at:exp,expires_in:3600,token_type:'bearer',user:{id,aud:'authenticated',role:'authenticated',created_at:'2026-10-06T00:00:00Z',email:'fixture@example.test',app_metadata:{},user_metadata:{admin:true,operatorBadge:'Owner'}}}));});}
async function mock(page:Page,{denied=false,expired=false,uncertain=false}={}){
 let profile:Record<string,unknown>|null=null;let reviews:Record<string,unknown>[]=[];const calls:{name:string;args:Record<string,unknown>}[]=[];
 await page.route('https://test-project.supabase.co/**',async route=>{
  const url=route.request().url();if(url.includes('/auth/v1/logout')){await route.fulfill({status:204,body:''});return;}
  const name=url.split('/').at(-1)!;const args=route.request().postDataJSON()??{};calls.push({name,args});
  if(name==='dining_public_catalog'){await route.fulfill({json:[]});return;}
  if(!name.startsWith('dining_owner_trial_')){await route.fulfill({json:[]});return;}
  if(denied){await route.fulfill({status:403,json:{code:'42501',message:'Denied'}});return;}
  if(name==='dining_owner_trial_context'){await route.fulfill({json:{contractVersion:2,privatePilot:true,signedIn:true,acceptingProfiles:!expired,profileReady:!!profile,profileVersion:profile?1:0,operatorBadge:null,publicAuthor:profile?publicAuthor:null,acceptingReviews:!!profile&&!expired,acceptingReports:false,acceptingCorrections:false,canManageOwn:true,canModerate:true,policyVersion:'owner-dummy-trial-2026-10-06-v1',ownerTrial:true,dummyOnly:true,active:!expired,endsAt:expired?'2020-01-01T00:00:00Z':new Date(Date.now()+86400000).toISOString()}});return;}
  if(name==='dining_owner_trial_catalog'){await route.fulfill({json:catalog});return;}
  if(name==='dining_owner_trial_profile'){await route.fulfill({json:profile});return;}
  if(name==='dining_owner_trial_prepare_profile'){expect(Object.keys(args).sort()).toEqual(['expected_version','request_id']);profile={version:1,publicConsented:true,publicAuthor};await route.fulfill({json:{status:'saved',version:1,requestId:args.request_id}});return;}
  if(name==='dining_owner_trial_my_reviews'||name==='dining_owner_trial_queue'){await route.fulfill({json:reviews});return;}
  if(name==='dining_owner_trial_submit'){
   expect(Object.keys(args).sort()).toEqual(['expected_profile_version','request_id','restaurant_id']);
   const review={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',restaurantId:args.restaurant_id,status:'pending',version:1,displayName:label,visitedMonth:'2026-10',relationship:'customer',rating:3,comment,authorSnapshot:publicAuthor,operatorBadge:null,testEntry:true};reviews=[review];
   if(uncertain){await route.fulfill({status:503,json:{code:'unavailable',message:'opaque failure'}});return;}
   await route.fulfill({json:{id:review.id,status:'pending',version:1,testEntry:true,requestId:args.request_id}});return;
  }
  if(name==='dining_owner_trial_withdraw'){reviews=reviews.map(r=>({...r,status:'withdrawn',version:2}));await route.fulfill({json:{id:args.review_id,status:'withdrawn',version:2,requestId:args.request_id}});return;}
  if(name==='dining_owner_trial_delete_profile'){profile=null;reviews=[];await route.fulfill({json:{status:'deleted',requestId:args.request_id}});return;}
  throw new Error(`Unexpected test RPC: ${name}`);
 });return{calls};
}
async function prepare(page:Page){await page.getByLabel('架空のプロフィールだけを非公開テスト用に保存します',{exact:true}).check();await page.getByRole('button',{name:'架空プロフィールを準備する',exact:true}).click();await expect(page.locator('.pilot-profile summary')).toHaveText('架空プロフィール（準備済み）');}
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
 await page.reload();await expect(page.getByText('実店舗 10 / 10件（非公開）',{exact:true})).toBeVisible();
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

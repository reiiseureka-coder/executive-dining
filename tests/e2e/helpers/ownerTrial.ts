import {expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
export const catalog=JSON.parse(readFileSync(new URL('../../fixtures/owner-trial-catalog.json',import.meta.url),'utf8'));
const label='製薬業界・大規模企業 / 部門マネジメント / K・T';
const publicAuthor={profileVersion:1,industry:'pharmaceutical',companySize:'large',roleLayer:'department',initials:'K・T',label,declaration:'self_declared',operatorAtSubmission:false};
export const comment='これは操作確認用の非公開テスト投稿です。実際の来店体験・店舗の評価ではありません。';
export async function login(page:Page){await page.addInitScript(()=>{if(sessionStorage.getItem('owner-fixture-seeded'))return;sessionStorage.setItem('owner-fixture-seeded','1');const part=(value:unknown)=>btoa(JSON.stringify(value)).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');const id='11111111-1111-4111-8111-111111111111';const exp=Math.floor(Date.now()/1000)+3600;localStorage.setItem('sb-test-project-auth-token',JSON.stringify({access_token:`${part({alg:'HS256',typ:'JWT'})}.${part({sub:id,role:'authenticated',exp})}.test-only`,refresh_token:'synthetic-only',expires_at:exp,expires_in:3600,token_type:'bearer',user:{id,aud:'authenticated',role:'authenticated',created_at:'2026-10-06T00:00:00Z',email:'fixture@example.test',app_metadata:{},user_metadata:{admin:true,operatorBadge:'Owner'}}}));});}
export async function mock(page:Page,{denied=false,expired=false,uncertain=false}={}){
 let profile:Record<string,unknown>|null=null;let reviews:Record<string,unknown>[]=[];const calls:{name:string;args:Record<string,unknown>}[]=[];
 await page.route('https://test-project.supabase.co/**',async route=>{
  const url=route.request().url();if(url.includes('/auth/v1/logout')){await route.fulfill({status:204,body:''});return;}
  const name=url.split('/').at(-1)!;const args=route.request().postDataJSON()??{};calls.push({name,args});
  if(name==='dining_editor_access'){await route.fulfill({json:!denied});return;}
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

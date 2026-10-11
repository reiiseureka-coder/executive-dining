import test,{before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {OwnerTrialRepository} from '../src/data/repositories/ownerTrialRepository.ts';
const db=new PGlite();
const owner='11111111-1111-4111-8111-111111111111'; const outsider='22222222-2222-4222-8222-222222222222';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/owner-trial-catalog.json',import.meta.url),'utf8'));
let wrappers=[];
async function identity(id,role='authenticated'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id??'']);await db.exec(`set role ${role}`);}
async function rpc(name,args={}){const keys=Object.keys(args);return(await db.query(`select public.${name}(${keys.map((k,i)=>`${k}=>$${i+1}`).join(',')}) as data`,Object.values(args))).rows[0].data;}
const repo=new OwnerTrialRepository({rpc:(name,args)=>{const result=(async()=>{try{return{data:await rpc(name,args),error:null};}catch(error){return{data:null,error};}})();result.abortSignal=()=>result;return result;}});
before(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;grant usage on schema auth to public;create table auth.users(id uuid primary key);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 await db.exec(await readFile(new URL('../supabase/migrations/202610050001_nagoya_foundation.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/proposals/202610050002_catalog_source_eligibility.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/proposals/20261005234433_review_pilot_v2.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/proposals/20261006071219_owner_dummy_trial.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2)',[owner,outsider]);await db.query('insert into dining_private.editors(user_id)values($1),($2)',[owner,outsider]);
 for(const row of fixtures){
  await db.query('insert into dining_private.restaurants(id,candidate_name,candidate_address,city,status)values($1,$2,$3,$4,$5)',[row.id,row.name,row.address,'名古屋市','candidate']);
  for(const f of row.facts){const sid=randomUUID();await db.query("insert into dining_private.restaurant_sources(id,restaurant_id,provider,source_url,fetched_at,verified_at,publication_basis,license_reviewed_at,licenses,attributions)values($1,$2,$3,$4,$5,$6,'facts_only',$6,array(select jsonb_array_elements_text($7::jsonb)),array(select jsonb_array_elements_text($8::jsonb)))",[sid,row.id,f.provider,f.sourceUrl,f.fetchedAt,f.verifiedAt,JSON.stringify(f.licenses),JSON.stringify(f.attributions)]);await db.query('insert into dining_private.restaurant_facts(restaurant_id,field,value,source_id,verified_at)values($1,$2,$3,$4,$5)',[row.id,f.field,f.value,sid,f.verifiedAt]);}
 }
 wrappers=(await db.query("select p.oid::regprocedure::text signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'dining_owner_trial_%'")).rows.map(row=>row.signature);
});
beforeEach(async()=>{
 await db.exec('reset role;truncate dining_private.pilot_profiles,dining_private.pilot_rate_limits,dining_private.pilot_requests,dining_private.pilot_reviews,dining_private.pilot_feedback,dining_private.pilot_events cascade;delete from dining_private.review_pilot_members;delete from dining_private.review_pilot_restaurants;update dining_private.settings set public_enabled=false,reviews_enabled=false;update dining_private.owner_trial_settings set enabled=false,owner_id=null;update dining_private.review_pilot_settings set enabled=false,policy_approved=false;');
 for(const signature of wrappers)await db.exec(`revoke all on function ${signature} from public,anon,authenticated`);
 await db.exec("update dining_private.restaurant_sources set verified_at=now(),publication_basis='facts_only';update dining_private.restaurants set status='candidate'");
});
after(async()=>db.close());
async function activate(){await db.exec('reset role');for(const signature of wrappers)await db.exec(`grant execute on function ${signature} to authenticated`);await db.query("update dining_private.owner_trial_settings set owner_id=$1,enabled=true,starts_at=now()-interval '1 hour',ends_at=now()+interval '7 days'",[owner]);await db.exec("update dining_private.review_pilot_settings set enabled=true,policy_approved=true,policy_version='owner-dummy-trial-2026-10-06-v1',starts_at=now()-interval '1 hour',ends_at=now()+interval '7 days'");await db.query("insert into dining_private.review_pilot_members values($1,now()+interval '7 days')",[owner]);await db.exec('insert into dining_private.review_pilot_restaurants select id from dining_private.restaurants');await identity(owner);}
test('extension remains inaccessible until activation, and all generic v2 RPCs stay ungranted',async()=>{
 assert.equal(wrappers.length,9);await identity(owner);await assert.rejects(repo.context(),e=>e.code==='denied');await activate();
 for(const name of ['dining_review_capabilities_v2','dining_my_profile_v2','dining_review_queue_v2'])await assert.rejects(rpc(name),/permission denied/);
 await assert.rejects(db.query('select * from dining_private.owner_trial_settings'),/permission denied/);
});
test('only configured owner sees all ten real venues and candidates never become public recommendations',async()=>{
 await activate();const rows=await repo.catalog();assert.equal(rows.length,10);assert.equal(rows.reduce((n,r)=>n+r.facts.length,0),61);
 assert.deepEqual(rows.map(r=>r.name).sort(),fixtures.map(r=>r.name).sort());assert.ok(rows.every(r=>r.status==='candidate'&&r.privatePilot));
 await db.exec('reset role');assert.equal((await db.query('select dining_private.pilot_eligible($1) result',[fixtures[0].id])).rows[0].result,false);
 await identity(outsider);await assert.rejects(repo.context(),e=>e.code==='denied');await assert.rejects(repo.catalog(),e=>e.code==='denied');await assert.rejects(repo.queue(),e=>e.code==='denied');
 await identity(null,'anon');assert.deepEqual(await rpc('dining_public_catalog'),[]);await assert.rejects(repo.catalog(),e=>e.code==='denied');
});
test('owner can prepare only fixed dummy profile, submit test, read own/queue, withdraw and clean up',async()=>{
 await activate();await repo.prepareProfile(0,randomUUID());assert.equal((await repo.profile()).version,1);await repo.submit(fixtures[0].id,1,randomUUID());
 const mine=await repo.mine();assert.equal(mine.length,1);assert.equal(mine[0].testEntry,true);assert.match(mine[0].comment,/実際の来店体験・店舗の評価ではありません/);assert.equal((await repo.queue()).length,1);
 await db.exec('reset role');const saved=(await db.query('select company_name,full_name,actual_title from dining_private.pilot_profiles')).rows[0];assert.deepEqual(saved,{company_name:'架空会社',full_name:'架空の人物',actual_title:'架空の正式職名'});
 await identity(owner);await repo.withdraw(mine[0].id,1,randomUUID());assert.equal((await repo.mine())[0].status,'withdrawn');await repo.deleteProfile(1,randomUUID());assert.equal(await repo.profile(),null);assert.deepEqual(await repo.mine(),[]);
});
test('dummy test rows cannot be approved even by direct privileged SQL or another reviewer',async()=>{
 await activate();await repo.prepareProfile(0,randomUUID());await repo.submit(fixtures[0].id,1,randomUUID());const review=(await repo.mine())[0];
 await assert.rejects(rpc('dining_moderate_review_v2',{review_id:review.id,expected_version:1,next_status:'approved',reason:'self',request_id:randomUUID()}),/permission denied/);
 await db.exec('reset role');await assert.rejects(db.query("update dining_private.pilot_reviews set status='approved' where id=$1",[review.id]),/test_entries_never_approved/);
});
test('expiry stops restaurant reads and writes while preserving owner withdrawal and deletion',async()=>{
 await activate();await repo.prepareProfile(0,randomUUID());await repo.submit(fixtures[0].id,1,randomUUID());const review=(await repo.mine())[0];
 await db.exec("reset role;update dining_private.owner_trial_settings set starts_at=now()-interval '8 days',ends_at=now()-interval '1 hour';update dining_private.review_pilot_settings set enabled=false");await identity(owner);
 assert.equal((await repo.context()).active,false);await assert.rejects(repo.catalog(),e=>e.code==='denied');await assert.rejects(repo.submit(fixtures[1].id,1,randomUUID()),e=>e.code==='denied');
 assert.equal((await repo.mine()).length,1);await repo.withdraw(review.id,1,randomUUID());await repo.deleteProfile(1,randomUUID());assert.equal(await repo.profile(),null);
});
test('source revocation removes a venue and blocks test submission; unknown or rejected targets are denied',async()=>{
 await activate();await repo.prepareProfile(0,randomUUID());await db.exec('reset role');await db.query("update dining_private.restaurant_sources set publication_basis='unreviewed' where restaurant_id=$1",[fixtures[0].id]);await db.query("update dining_private.restaurants set status='rejected' where id=$1",[fixtures[1].id]);await identity(owner);
 assert.equal((await repo.catalog()).length,8);for(const id of [fixtures[0].id,fixtures[1].id,randomUUID()])await assert.rejects(repo.submit(id,1,randomUUID()));
});
test('wrapper exposes no arbitrary identity/body parameters and preserves an existing non-dummy profile',async()=>{
 await activate();await repo.prepareProfile(0,randomUUID());await assert.rejects(rpc('dining_owner_trial_submit',{restaurant_id:fixtures[0].id,expected_profile_version:1,request_id:randomUUID(),comment:'injected actual review'}),/does not exist/);
 await db.exec("reset role;update dining_private.pilot_profiles set full_name='separate existing profile'");await identity(owner);await assert.rejects(repo.prepareProfile(1,randomUUID()),e=>e.code==='denied');await assert.rejects(repo.profile(),e=>e.code==='denied');await assert.rejects(repo.deleteProfile(1,randomUUID()),e=>e.code==='denied');
});
test('deleting the owner auth account closes the trial without violating the enabled-owner constraint',async()=>{
 await activate();await repo.prepareProfile(0,randomUUID());await repo.submit(fixtures[0].id,1,randomUUID());await db.exec('reset role');await db.query('delete from auth.users where id=$1',[owner]);
 const settings=(await db.query('select enabled,owner_id from dining_private.owner_trial_settings')).rows[0];assert.equal(settings.enabled,false);assert.equal(settings.owner_id,null);assert.equal((await db.query('select count(*)::int n from dining_private.pilot_profiles')).rows[0].n,0);
 await identity(owner);await assert.rejects(repo.context(),e=>e.code==='denied');
});

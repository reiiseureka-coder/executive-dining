import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { publicProfileLabel } from '../src/domain/membership.ts';
import { ProposedReviewRepository } from '../src/data/repositories/proposedReviewRepository.ts';
const db = new PGlite();
const author = '11111111-1111-4111-8111-111111111111';
const editor = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const restaurant = '44444444-4444-4444-8444-444444444444';
const policy = 'test-approved-pilot-policy';
let signatures = [];
const draft = () => ({ displayName: '本人メモ', rating: 4, comment: '本人が来店して食事をした検証用の体験本文です。', visitedMonth: '2026-09', relationship: 'customer', hasVisited: true, privacyChecked: true });
const context = () => ({ requestId: randomUUID(), acceptedPolicyVersion: policy, profileVersion: 1 });
const profile = () => ({ companyName: '架空会社', fullName: '架空の人物', actualTitle: '架空の正式職名', industry: 'pharmaceutical', companySize: 'large', roleLayer: 'department', familyRomanization: 'Kensho', givenRomanization: 'Taro', privateStorageConsent: true, publicLabelConsent: true, romanizationConfirmed: true });
async function identity(id, role = 'authenticated') { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id ?? '']); await db.exec(`set role ${role}`); }
async function rpc(name, args = {}) { const keys=Object.keys(args); return (await db.query(`select public.${name}(${keys.map((key,i)=>`${key}=>$${i+1}`).join(',')}) as data`, Object.values(args))).rows[0].data; }
const client = { rpc: async (name,args={}) => { try { return { data: await rpc(name,args), error:null }; } catch (error) { return { data:null, error }; } } };
const repo = new ProposedReviewRepository(client);
async function activate() {
 await db.exec('reset role');
 for (const signature of signatures) await db.exec(`grant execute on function ${signature} to authenticated`);
 await db.query("update dining_private.review_pilot_settings set enabled=true,policy_approved=true,policy_version=$1,starts_at=now()-interval '1 hour',ends_at=now()+interval '7 days'",[policy]);
 await db.query("insert into dining_private.review_pilot_members(user_id,expires_at) values($1,now()+interval '7 days'),($2,now()+interval '7 days')",[author,other]);
 for(const actor of [author,other]) { await identity(actor); await repo.saveProfile(profile(),0,randomUUID(),policy); }
 await db.exec('reset role');
}
async function submit(id = randomUUID()) { await identity(author); return repo.submit(restaurant,draft(),{requestId:id,acceptedPolicyVersion:policy,profileVersion:1}); }
async function approve(receipt) { await identity(editor); return repo.moderate({id:receipt.id,authorId:author,status:'pending',version:receipt.version},editor,receipt.version,'approved','本人の記載と投稿条件を確認',randomUUID()); }
before(async () => {
 await db.exec(`create role anon; create role authenticated; create schema auth; grant usage on schema auth to public; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 await db.exec(await readFile(new URL('../supabase/migrations/202610050001_nagoya_foundation.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/proposals/202610050002_catalog_source_eligibility.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1),($2),($3)',[author,editor,other]);
 await db.query('insert into dining_private.editors(user_id) values($1)',[editor]);
 await db.query("insert into dining_private.restaurants(id,candidate_name,candidate_address,city) values($1,'Test venue','Test address','名古屋市')",[restaurant]);
 await identity(editor);
 for (const [i,field,value] of [[1,'name','Test venue'],[2,'address','名古屋市中区'],[3,'website','https://example.test/official']]) await rpc('dining_record_official_fact',{restaurant_id:restaurant,expected_version:i,fact_field:field,fact_value:value,official_url:'https://example.test/official'});
 await rpc('dining_moderate_restaurant',{restaurant_id:restaurant,expected_version:4,next_status:'verified',reason:'Official core checked'});
 await db.exec('reset role');
 await db.exec(await readFile(new URL('../supabase/proposals/20261005234433_review_pilot_v2.sql',import.meta.url),'utf8'));
 signatures=(await db.query("select p.oid::regprocedure::text as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'dining_%_v2'")).rows.map(row=>row.signature);
 await db.query('insert into dining_private.review_pilot_restaurants values($1)',[restaurant]);
});
beforeEach(async () => {
 await db.exec('reset role; truncate dining_private.pilot_profiles,dining_private.pilot_operator_badges,dining_private.pilot_requests,dining_private.pilot_reviews,dining_private.pilot_feedback,dining_private.pilot_events cascade; delete from dining_private.review_pilot_members; update dining_private.review_pilot_settings set enabled=false,policy_approved=false; update dining_private.settings set public_enabled=false,reviews_enabled=false;');
 for (const signature of signatures) await db.exec(`revoke all on function ${signature} from public,anon,authenticated`);
 await db.query('insert into auth.users values($1),($2),($3) on conflict do nothing',[author,editor,other]);
 await db.exec('delete from dining_private.editors'); await db.query('insert into dining_private.editors values($1,now())',[editor]);
 await db.exec("update dining_private.restaurant_sources set publication_basis='facts_only',verified_at=now(),license_reviewed_at=now()");
});
after(async()=>db.close());
test('proposal has RLS, denied default grants and leaves existing publication/auth APIs untouched',async()=>{
 assert.equal(signatures.length,18);
 const tables=(await db.query("select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='dining_private' and (c.relname like 'pilot_%' or c.relname like 'review_pilot_%') and c.relkind='r'")).rows;
 assert.equal(tables.length,9); assert.ok(tables.every(row=>row.relrowsecurity));
 await identity(author); await assert.rejects(rpc('dining_review_capabilities_v2'),/permission denied/);
 await assert.rejects(db.query('select * from dining_private.pilot_reviews'),/permission denied/);
 await assert.rejects(rpc('dining_submit_review',{restaurant_id:restaurant,display_name:'name',rating:4,comment:'long enough comment',visited_month:'2026-09-01'}),/permission denied/);
 await identity(null,'anon'); assert.deepEqual(await rpc('dining_public_catalog'),[]);
});
test('activation grants still require membership and fresh editor authorization',async()=>{
 await activate(); await identity(editor); assert.equal((await repo.capabilities()).acceptingReviews,false);
 await identity(other); assert.equal((await repo.capabilities()).canModerate,false); await assert.rejects(repo.listModeration(),error=>error.code==='denied');
 await identity(null,'anon'); await assert.rejects(rpc('dining_review_capabilities_v2'),/permission denied/);
 await identity(author); assert.equal((await repo.capabilities()).acceptingReviews,true);
 assert.equal((await rpc('dining_review_pilot_catalog_v2')).length,1);
});
test('adapter-to-Postgres submit, own status, independent moderation and withdrawal remain private',async()=>{
 await activate(); const receipt=await submit(); assert.equal(receipt.status,'pending');
 assert.equal((await repo.listMine())[0].status,'pending'); await approve(receipt);
 await identity(author); assert.equal((await repo.listMine())[0].status,'approved');
 await identity(other); assert.deepEqual(await repo.listMine(),[]); await assert.rejects(repo.withdraw(receipt.id,2,randomUUID()),error=>error.code==='denied');
 await db.exec('reset role; update dining_private.settings set public_enabled=true,reviews_enabled=true');
 await identity(null,'anon'); assert.equal((await rpc('dining_public_catalog'))[0].reviews.length,0);
 await identity(author); await repo.withdraw(receipt.id,2,randomUUID()); assert.equal((await repo.listMine())[0].status,'withdrawn');
});
test('idempotent retry returns same receipt, changed payload and different-ID duplicate cannot create another row',async()=>{
 await activate(); const req=randomUUID(); const first=await submit(req); const second=await submit(req); assert.deepEqual(second,first);
 await assert.rejects(repo.submit(restaurant,{...draft(),rating:5},{requestId:req,acceptedPolicyVersion:policy,profileVersion:1}));
 await assert.rejects(submit(),error=>error.code==='duplicate');
 await db.exec('reset role'); assert.equal((await db.query('select count(*)::int as n from dining_private.pilot_reviews')).rows[0].n,1);
 assert.equal((await db.query("select count(*)::int as n from dining_private.pilot_requests where operation='submit'")).rows[0].n,1);
});
test('revisions remove approval and stale reviewers cannot publish the old version',async()=>{
 await activate(); const receipt=await submit(); await approve(receipt); await identity(author);
 const edited=await rpc('dining_revise_review_v2',{review_id:receipt.id,expected_version:2,request_id:randomUUID(),accepted_policy_version:policy,profile_version:1,rating:3,comment:'来店後の記録を訂正した検証用の体験です。',visited_month:'2026-09-01',relationship:'customer',has_visited:true,privacy_checked:true});
 assert.equal(edited.status,'pending'); assert.equal(edited.version,3);
 await identity(editor); await assert.rejects(rpc('dining_moderate_review_v2',{review_id:receipt.id,expected_version:2,next_status:'approved',reason:'Stale',request_id:randomUUID()}),/Stale review/);
});
test('source revocation, future month, missing declarations and wrong policy reject writes',async()=>{
 await activate(); await identity(author);
 const base={restaurant_id:restaurant,request_id:randomUUID(),accepted_policy_version:policy,profile_version:1,rating:4,comment:'A sufficiently long comment',visited_month:'2026-09-01',relationship:'customer',has_visited:true,privacy_checked:true};
 for(const override of [{accepted_policy_version:'old'},{visited_month:'2099-01-01'},{visited_month:'2026-09-02'},{has_visited:null},{privacy_checked:false}]) await assert.rejects(rpc('dining_submit_review_v2',{...base,...override}));
 const receipt=await submit(); await db.exec("reset role; update dining_private.restaurant_sources set publication_basis='unreviewed'");
 await identity(editor); await assert.rejects(rpc('dining_moderate_review_v2',{review_id:receipt.id,expected_version:1,next_status:'approved',reason:'Invalid evidence',request_id:randomUUID()}),/eligibility/);
 await identity(other); await assert.rejects(rpc('dining_submit_review_v2',{...base,request_id:randomUUID()}),/Eligible pilot/);
});
test('self-approval and approval after membership removal are denied on the server',async()=>{
 await activate(); const receipt=await submit(); await db.exec('reset role'); await db.query('insert into dining_private.editors(user_id) values($1)',[author]);
 await identity(author); await assert.rejects(rpc('dining_moderate_review_v2',{review_id:receipt.id,expected_version:1,next_status:'approved',reason:'self',request_id:randomUUID()}),/Self/);
 await identity(editor); assert.equal((await repo.capabilities()).canModerate,true); await db.exec('reset role; delete from dining_private.editors'); await identity(editor);
 await assert.rejects(rpc('dining_moderate_review_v2',{review_id:receipt.id,expected_version:1,next_status:'approved',reason:'revoked',request_id:randomUUID()}),/Editor access/);
});
test('stopping or expiring pilot does not prevent author withdrawal and deletion',async()=>{
 await activate(); const receipt=await submit(); await db.exec('reset role; update dining_private.review_pilot_settings set enabled=false; delete from dining_private.review_pilot_members'); await identity(author);
 assert.equal((await repo.capabilities()).acceptingReviews,false); await repo.withdraw(receipt.id,1,randomUUID());
 const deleted=await rpc('dining_delete_own_review_v2',{review_id:receipt.id,expected_version:2,request_id:randomUUID()}); assert.equal(deleted.status,'deleted'); assert.deepEqual(await repo.listMine(),[]);
 await db.exec('reset role'); assert.equal((await db.query('select count(*)::int as n from dining_private.pilot_events')).rows[0].n,0);
});
test('report and correction receipt/queue/resolution do not silently change official facts or review content',async()=>{
 await activate(); const receipt=await submit(); await approve(receipt); await identity(other);
 const report=await repo.feedback(restaurant,receipt.id,{kind:'report',field:'',sourceUrl:'',reason:'privacy',detail:'個人情報にあたる記載の確認を希望します。'},context());
 const correction=await repo.feedback(restaurant,null,{kind:'correction',field:'price',sourceUrl:'https://example.test/course',reason:'',detail:'公式ページの料金条件の確認を希望します。'},context());
 assert.equal((await rpc('dining_my_feedback_v2')).length,2); await identity(author); assert.deepEqual(await rpc('dining_my_feedback_v2'),[]);
 await identity(editor); assert.equal((await rpc('dining_feedback_queue_v2')).length,2);
 await rpc('dining_resolve_feedback_v2',{feedback_id:report.id,expected_version:1,next_status:'resolved',reason:'記載を確認。別途投稿者に確認する想定',request_id:randomUUID()});
 await assert.rejects(rpc('dining_resolve_feedback_v2',{feedback_id:report.id,expected_version:1,next_status:'dismissed',reason:'stale',request_id:randomUUID()}),/Stale feedback/);
 assert.ok(correction.id); await db.exec('reset role'); assert.equal((await db.query('select status from dining_private.pilot_reviews where id=$1',[receipt.id])).rows[0].status,'approved');
 assert.equal((await db.query("select count(*)::int as n from dining_private.restaurant_facts where field='price'")).rows[0].n,0);
});
test('daily review/revision limit is atomic with request receipts and retries do not consume another slot',async()=>{
 await activate(); const receipt=await submit();
 for(let version=1;version<=4;version++) await rpc('dining_revise_review_v2',{review_id:receipt.id,expected_version:version,request_id:randomUUID(),accepted_policy_version:policy,profile_version:1,rating:4,comment:'A sufficiently long revised comment',visited_month:'2026-09-01',relationship:'customer',has_visited:true,privacy_checked:true});
 await assert.rejects(rpc('dining_revise_review_v2',{review_id:receipt.id,expected_version:5,request_id:randomUUID(),accepted_policy_version:policy,profile_version:1,rating:4,comment:'Another sufficiently long comment',visited_month:'2026-09-01',relationship:'customer',has_visited:true,privacy_checked:true}),/daily limit/);
 assert.equal((await repo.listMine())[0].version,5);
});
test('auth-user deletion erases pilot body and related events, and old identity cannot regain access',async()=>{
 await activate(); await submit(); await db.exec('reset role'); await db.query('delete from auth.users where id=$1',[author]);
 assert.equal((await db.query('select count(*)::int as n from dining_private.pilot_reviews')).rows[0].n,0);
 assert.equal((await db.query("select count(*)::int as n from dining_private.pilot_requests where operation='submit'")).rows[0].n,0);
 await identity(author); assert.equal((await repo.capabilities()).signedIn,false); await assert.rejects(repo.listMine(),error=>error.code==='denied');
});
test('operator-only purge removes expired pilot data and cannot be invoked by a participant',async()=>{
 await activate(); await submit(); await identity(author); await assert.rejects(db.query('select dining_private.purge_review_pilot()'),/permission denied/);
 await db.exec("reset role; update dining_private.pilot_reviews set created_at=now()-interval '31 days'; update dining_private.pilot_requests set created_at=now()-interval '31 days'; select dining_private.purge_review_pilot()");
 assert.equal((await db.query('select count(*)::int as n from dining_private.pilot_reviews')).rows[0].n,0);
 assert.equal((await db.query("select count(*)::int as n from dining_private.pilot_requests where operation='submit'")).rows[0].n,0);
});
test('private identity is owner-only; moderation/capability/review responses contain only generalized snapshots',async()=>{
 await activate(); const receipt=await submit();
 const ownProfile=await repo.myProfile(); assert.equal(ownProfile.companyName,'架空会社'); assert.equal(ownProfile.fullName,'架空の人物');
 const caps=await repo.capabilities(); assert.equal(caps.publicAuthor.label,publicProfileLabel(profile()));
 for(const payload of [caps,await repo.listMine()]) { const text=JSON.stringify(payload); assert.ok(!text.includes('架空会社')); assert.ok(!text.includes('架空の人物')); assert.ok(!text.includes('架空の正式職名')); }
 await identity(editor); assert.equal(await repo.myProfile(),null); await assert.rejects(db.query('select full_name from dining_private.pilot_profiles'),/permission denied/);
 const queue=await repo.listModeration(); assert.equal(queue[0].id,receipt.id); assert.ok(!JSON.stringify(queue).includes('架空会社'));
});
test('profile submission requires separate consents, matching preview and confirmed Latin initials',async()=>{
 await activate(); await identity(author);
 await assert.rejects(repo.saveProfile({...profile(),privateStorageConsent:false},1,randomUUID(),policy),error=>error.code==='invalid');
 await assert.rejects(repo.saveProfile({...profile(),publicLabelConsent:false},1,randomUUID(),policy),error=>error.code==='invalid');
 const args={expected_version:1,request_id:randomUUID(),accepted_policy_version:policy,company_name:'架空会社',full_name:'架空の人物',actual_title:'架空職',industry:'pharmaceutical',company_size:'large',role_layer:'department',family_romanization:'Kensho',given_romanization:'Taro',expected_public_label:publicProfileLabel(profile()),private_storage_consent:true,public_label_consent:true,romanization_confirmed:true};
 for(const overrides of [{expected_public_label:'Owner'},{family_romanization:'読み方は推測しない'},{romanization_confirmed:null},{public_label_consent:false}]) await assert.rejects(rpc('dining_save_profile_v2',{...args,...overrides}));
 assert.equal((await repo.myProfile()).version,1);
});
test('profile update preserves old review snapshot and stale profile versions cannot submit or revise',async()=>{
 await activate(); const receipt=await submit(); const old=(await repo.listMine())[0].authorSnapshot;
 await repo.saveProfile({...profile(),industry:'technology',roleLayer:'team'},1,randomUUID(),policy);
 assert.equal((await repo.myProfile()).version,2); assert.deepEqual((await repo.listMine())[0].authorSnapshot,old);
 await assert.rejects(repo.revise(receipt.id,1,draft(),context()),error=>error.code==='invalid');
 const next=await repo.revise(receipt.id,1,draft(),{...context(),profileVersion:2}); assert.equal(next.status,'pending');
 assert.equal((await repo.listMine())[0].authorSnapshot.industry,'technology');
});
test('withdrawing profile display consent withdraws all own pilot reviews, even with pilot closed',async()=>{
 await activate(); const receipt=await submit(); await approve(receipt); await db.exec('reset role; update dining_private.review_pilot_settings set enabled=false'); await identity(author);
 await repo.revokeProfile(1,randomUUID()); const caps=await repo.capabilities(); assert.equal(caps.profileReady,false); assert.equal(caps.publicAuthor,null);
 assert.equal((await repo.listMine())[0].status,'withdrawn'); await identity(editor);
 await assert.rejects(rpc('dining_moderate_review_v2',{review_id:receipt.id,expected_version:3,next_status:'approved',reason:'cannot restore',request_id:randomUUID()}),/withdrawn/);
});
test('profile deletion erases identity, reviews and feedback instead of leaving public snapshots behind',async()=>{
 await activate(); await submit(); await identity(author);
 await repo.feedback(restaurant,null,{kind:'correction',field:'price',sourceUrl:'https://example.test/course',reason:'',detail:'公式情報の確認を希望するテストです。'},context());
 await repo.deleteProfile(1,randomUUID()); assert.equal(await repo.myProfile(),null); assert.deepEqual(await repo.listMine(),[]); assert.deepEqual(await rpc('dining_my_feedback_v2'),[]);
 await db.exec('reset role'); const receipts=(await db.query('select operation from dining_private.pilot_requests where actor_id=$1',[author])).rows; assert.deepEqual(receipts,[{operation:'delete_profile'}]);
});
test('Owner display is independent of permissions, ignores metadata, and preserves operator-post disclosure after revocation',async()=>{
 await activate(); await identity(author); await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({user_metadata:{operatorBadge:'Owner',admin:true},app_metadata:{plan:'Plus',recognition:'Prime'}})]);
 assert.equal((await repo.capabilities()).operatorBadge,null); assert.equal((await repo.capabilities()).canModerate,false);
 await assert.rejects(db.query("insert into dining_private.pilot_operator_badges(user_id) values($1)",[author]),/permission denied/);
 await db.exec('reset role'); await db.query('insert into dining_private.pilot_operator_badges(user_id) values($1)',[author]); await identity(author);
 const caps=await repo.capabilities(); assert.equal(caps.operatorBadge,'Owner'); assert.equal(caps.canModerate,false);
 await submit(); const own=(await repo.listMine())[0]; assert.equal(own.operatorBadge,'Owner'); assert.equal(own.authorSnapshot.operatorAtSubmission,true);
 await db.exec('reset role; delete from dining_private.pilot_operator_badges'); await identity(author);
 const revoked=(await repo.listMine())[0]; assert.equal(revoked.operatorBadge,null); assert.equal(revoked.authorSnapshot.operatorAtSubmission,true);
});
test('participant cap prevents silent expansion beyond the separately approved initial ten',async()=>{
 await activate(); await db.exec('reset role');
 for(let i=0;i<8;i++) { const id=randomUUID(); await db.query('insert into auth.users values($1)',[id]); await db.query("insert into dining_private.review_pilot_members values($1,now()+interval '1 day')",[id]); }
 const extra=randomUUID(); await db.query('insert into auth.users values($1)',[extra]); await assert.rejects(db.query("insert into dining_private.review_pilot_members values($1,now()+interval '1 day')",[extra]),/ten participants/);
});
test('new public and private privileged functions have empty search paths and explicit denied client EXECUTE',async()=>{
 const rows=(await db.query("select p.proname,p.proconfig,has_function_privilege('authenticated',p.oid,'execute') as allowed from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='public' and p.proname like 'dining_%_v2') or (n.nspname='dining_private' and (p.proname like 'pilot_%' or p.proname in ('limit_pilot_members','purge_review_pilot')))")).rows;
 assert.ok(rows.length>18); assert.ok(rows.every(row=>!row.allowed));
 assert.ok(rows.every(row=>row.proconfig.some(item=>item==='search_path=""')));
});

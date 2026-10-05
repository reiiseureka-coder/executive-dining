import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const editor = '11111111-1111-4111-8111-111111111111';
const visitor = '22222222-2222-4222-8222-222222222222';
const restaurant = '33333333-3333-4333-8333-333333333333';
async function identity(id, role = 'authenticated') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
  await db.exec(`set role ${role}`);
}
async function rpc(sql, args = []) { return (await db.query(sql, args)).rows; }
before(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; grant usage on schema auth to public;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    insert into auth.users values ('${editor}'), ('${visitor}');`);
  await db.exec(await readFile(new URL('../supabase/migrations/202610050001_nagoya_foundation.sql', import.meta.url), 'utf8'));
  await db.query('insert into dining_private.editors(user_id) values ($1)', [editor]);
  await db.query("insert into dining_private.restaurants(id, candidate_name, candidate_address, city) values ($1,'Provider name','Provider address','名古屋市中区')", [restaurant]);
});
beforeEach(async () => { await db.exec('reset role'); });
after(async () => { await db.close(); });
test('all new tables have RLS, no client table access, switches disabled', async () => {
  const rows = await rpc("select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='dining_private' and c.relkind='r'");
  assert.equal(rows.length, 7); assert.ok(rows.every(row => row.relrowsecurity));
  const settings = (await rpc('select * from dining_private.settings'))[0];
  assert.equal(settings.public_enabled, false); assert.equal(settings.reviews_enabled, false);
  await identity(null, 'anon');
  await assert.rejects(rpc('select * from dining_private.restaurants'), /permission denied/);
  assert.deepEqual((await rpc('select public.dining_public_catalog() as result'))[0].result, []);
  await assert.rejects(rpc('select public.dining_editor_queue()'), /permission denied/);
});
test('signed-in users cannot access editorial data or self-appoint', async () => {
  await identity(visitor);
  assert.equal((await rpc('select public.dining_editor_access() as result'))[0].result, false);
  await assert.rejects(rpc('select public.dining_editor_queue()'), /Editor access/);
  await assert.rejects(rpc('insert into dining_private.editors(user_id) values ($1)', [visitor]), /permission denied/);
  await assert.rejects(rpc("select public.dining_moderate_restaurant($1,1,'verified','Attempt')", [restaurant]), /Editor access/);
});
test('editor cannot approve candidates missing official evidence', async () => {
  await identity(editor);
  assert.equal((await rpc('select public.dining_editor_access() as result'))[0].result, true);
  assert.equal((await rpc('select public.dining_editor_queue() as result'))[0].result[0].status, 'candidate');
  await assert.rejects(rpc("select public.dining_moderate_restaurant($1,1,'verified','Review')", [restaurant]), /Official name/);
});
test('official fact edits withdraw publication, version checks reject stale edits', async () => {
  await identity(editor);
  await rpc("select public.dining_record_official_fact($1,1,'name','Verified name','https://example.com/official')", [restaurant]);
  await assert.rejects(rpc("select public.dining_record_official_fact($1,1,'address','Old address','https://example.com/official')", [restaurant]), /Stale restaurant/);
  await rpc("select public.dining_record_official_fact($1,2,'address','名古屋市中区','https://example.com/official')", [restaurant]);
  await rpc("select public.dining_record_official_fact($1,3,'website','https://example.com','https://example.com/official')", [restaurant]);
  await rpc("select public.dining_moderate_restaurant($1,4,'verified','Official sources checked')", [restaurant]);
  // Global gate still prevents accidental publication even after an editorial approval.
  await identity(null, 'anon');
  assert.deepEqual((await rpc('select public.dining_public_catalog() as result'))[0].result, []);
  await db.exec('reset role; update dining_private.settings set public_enabled = true');
  await identity(null, 'anon');
  const published = (await rpc('select public.dining_public_catalog() as result'))[0].result[0];
  assert.equal(published.name, 'Verified name'); assert.equal(published.facts.length, 3);
  assert.ok(!JSON.stringify(published).includes('Provider name'));
  assert.ok(!JSON.stringify(published).includes(editor));
  await identity(editor);
  await rpc("select public.dining_record_official_fact($1,5,'hours','公式確認の営業時間','https://example.com/hours')", [restaurant]);
  await identity(null, 'anon');
  assert.deepEqual((await rpc('select public.dining_public_catalog() as result'))[0].result, []);
});
test('invalid coordinates rejected and arbitrary fields never enter catalog', async () => {
  await identity(editor);
  await assert.rejects(rpc("select public.dining_record_official_fact($1,6,'coordinates','35.17,136.9','https://example.com')", [restaurant]), /Outside Nagoya/);
  await assert.rejects(rpc("select public.dining_record_official_fact($1,6,'made_up','claim','https://example.com')", [restaurant]), /check constraint/);
  await assert.rejects(rpc("select public.dining_record_official_fact($1,6,'hours','text','javascript:alert(1)')", [restaurant]), /HTTPS/);
});
test('review APIs have no client grants until a separately approved rollout', async () => {
  await identity(visitor);
  await assert.rejects(rpc("select public.dining_submit_review($1,'Member',5,'A sufficiently long comment','2026-09-01')", [restaurant]), /permission denied/);
  await assert.rejects(rpc("select public.dining_moderate_review($1,1,'approved','Review')", [restaurant]), /permission denied/);
});
test('review model binds author, holds pending, blocks self-moderation, supports own withdrawal', async () => {
  // Test-only activation and grants. This is never executed against live Supabase.
  await db.exec(`update dining_private.settings set reviews_enabled=true;
    grant execute on function public.dining_submit_review(uuid,text,integer,text,date) to authenticated;
    grant execute on function public.dining_withdraw_review(uuid) to authenticated;
    grant execute on function public.dining_moderate_review(uuid,integer,text,text) to authenticated;`);
  await identity(editor);
  await rpc("select public.dining_moderate_restaurant($1,6,'verified','Rechecked')", [restaurant]);
  await identity(visitor);
  const reviewId = (await rpc("select public.dining_submit_review($1,'Member',4,'A sufficiently long comment','2026-09-01') as id", [restaurant]))[0].id;
  await db.exec('reset role');
  const record = (await rpc('select * from dining_private.reviews where id=$1', [reviewId]))[0];
  assert.equal(record.author_id, visitor); assert.equal(record.status, 'pending');
  await identity(null, 'anon');
  assert.equal((await rpc('select public.dining_public_catalog() as result'))[0].result[0].reviews.length, 0);
  await identity(editor);
  await assert.rejects(rpc('select public.dining_withdraw_review($1)', [reviewId]), /access denied/);
  await rpc("select public.dining_moderate_review($1,1,'approved','Checked personally written review')", [reviewId]);
  const editorReview = (await rpc("select public.dining_submit_review($1,'Editor',5,'Another sufficiently long comment','2026-09-01') as id", [restaurant]))[0].id;
  await assert.rejects(rpc("select public.dining_moderate_review($1,1,'approved','Self')", [editorReview]), /cannot be moderated/);
  await identity(null, 'anon');
  const reviews = (await rpc('select public.dining_public_catalog() as result'))[0].result[0].reviews;
  assert.equal(reviews.length, 1); assert.ok(!JSON.stringify(reviews).includes(visitor));
  await identity(visitor); await rpc('select public.dining_withdraw_review($1)', [reviewId]);
  await identity(null, 'anon');
  assert.equal((await rpc('select public.dining_public_catalog() as result'))[0].result[0].reviews.length, 0);
});

test('seed import is candidate-only and idempotent, preserving full private evidence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ed-seed-test-'));
  try {
    const output = join(dir, 'candidates.sql');
    execFileSync(process.execPath, ['scripts/prepare-seed.mjs', 'data/research/nagoya-2026-10-05/verified-seed.json', output]);
    const sql = await readFile(output, 'utf8');
    await db.exec(sql); await db.exec(sql);
    const rows = await rpc("select status, count(*)::int as count from dining_private.restaurants where import_key is not null group by status");
    assert.deepEqual(rows, [{ status: 'candidate', count: 10 }]);
    assert.equal((await rpc("select count(*)::int as count from dining_private.restaurant_sources where provider='official-research'"))[0].count, 10);
    const raw = (await rpc("select raw_record from dining_private.restaurant_sources where provider='official-research' limit 1"))[0].raw_record;
    assert.equal(raw.venue.coordinates.map_pin_eligible, false);
    assert.equal(raw.sources.length, 23);
    await identity(null, 'anon');
    assert.ok(!(await rpc('select public.dining_public_catalog() as result'))[0].result.some(row => row.name === '名古屋浅田'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

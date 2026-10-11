import test, { before, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const editor = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const restaurant = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
async function catalog() {
  await db.exec('set role anon');
  const result = (await db.query('select public.dining_public_catalog() as result')).rows[0].result;
  await db.exec('reset role'); return result;
}
async function revoke(field, changes) {
  // Changes are fixed test-only SQL strings. No user/external SQL is accepted.
  await db.exec(`update dining_private.restaurant_sources set ${changes} where id=(select source_id from dining_private.restaurant_facts where field='${field}' and restaurant_id='${restaurant}')`);
}
before(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; grant usage on schema auth to public;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    insert into auth.users values ('${editor}');`);
  const base = await readFile(new URL('../supabase/migrations/202610050001_nagoya_foundation.sql', import.meta.url), 'utf8');
  assert.equal(createHash('sha256').update(base).digest('hex'), '84d5e91be8a42eb778514c483ce17735624395601aba7de947179b394df2724e');
  await db.exec(base);
  await db.exec(await readFile(new URL('../supabase/proposals/202610050002_catalog_source_eligibility.sql', import.meta.url), 'utf8'));
  await db.exec(`insert into dining_private.editors(user_id) values ('${editor}');
    insert into dining_private.restaurants(id,candidate_name,candidate_address,city) values ('${restaurant}','Candidate','Candidate address','名古屋市');
    select set_config('request.jwt.claim.sub','${editor}',false);`);
  for (const [index, [field, value]] of [['name', 'Confirmed venue'], ['address', '名古屋市中区'], ['website', 'https://example.com'], ['hours', 'Dinner hours']].entries()) {
    await db.query('select public.dining_record_official_fact($1,$2,$3,$4,$5)', [restaurant,index + 1,field,value,'https://example.com']);
  }
  await db.query("select public.dining_moderate_restaurant($1,5,'verified','All official facts checked')", [restaurant]);
  await db.exec('update dining_private.settings set public_enabled=true');
});
beforeEach(async () => { await db.exec('reset role; begin'); });
afterEach(async () => { await db.exec('reset role; rollback'); });
after(async () => { await db.close(); });
test('proposed public RPC retains eligible venue and existing client grants', async () => {
  assert.equal((await catalog())[0].name, 'Confirmed venue');
  const rows = (await db.query("select has_function_privilege('anon','public.dining_public_catalog()','execute') as allowed")).rows;
  assert.equal(rows[0].allowed, true);
});
test('revoked name source hides the whole record, including top-level name/address', async () => {
  await revoke('name', "publication_basis='unreviewed'");
  assert.deepEqual(await catalog(), []);
});
test('unverified address source hides a previously approved venue', async () => {
  await revoke('address', 'verified_at=null');
  assert.deepEqual(await catalog(), []);
});
test('a licensed nonofficial replacement cannot satisfy official website eligibility', async () => {
  await revoke('website', "provider='openpoi:overture', publication_basis='licensed', licenses=array['CDLA-Permissive-2.0']");
  assert.deepEqual(await catalog(), []);
});
test('revoked optional source is omitted while independently valid core facts remain visible', async () => {
  await revoke('hours', "publication_basis='unreviewed'");
  const rows = await catalog(); assert.equal(rows.length, 1);
  assert.ok(!rows[0].facts.some(fact => fact.field === 'hours'));
});
test('publication switch remains authoritative after the proposal', async () => {
  await db.exec('update dining_private.settings set public_enabled=false');
  assert.deepEqual(await catalog(), []);
});

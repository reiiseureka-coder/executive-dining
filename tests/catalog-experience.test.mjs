import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogStore } from '../src/data/catalogStore.ts';
import { filterCatalog, catalogGenres } from '../src/lib/catalogSearch.ts';
import { parseSavedCatalogIds, SAVED_CATALOG_KEY } from '../src/lib/savedCatalog.ts';
import { parseRoute, routeHash } from '../src/lib/routing.ts';
const make = (id, name, facts, verifiedAt = '2026-10-05T00:00:00Z') => ({ id, name, address: '名古屋市中区', status: 'verified', facts, verifiedAt, reviews: [] });
const first = make('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', '名古屋 日本料理', [{ field: 'genre', value: '日本料理' }, { field: 'price', value: '夜会席16,500円、税・サービス料別' }, { field: 'private_room', value: '個室なし' }, { field: 'notice', value: '10月5日は休業' }]);
const second = make('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', '名古屋 中国料理', [{ field: 'genre', value: '中国料理' }, { field: 'coordinates', value: '136.9,35.17' }], '2026-10-04T00:00:00Z');
test('real search combines words, genre, verified field availability and saved identifiers', () => {
  assert.equal(filterCatalog([first, second], { query: '名古屋 夜会席', genre: '日本料理', information: 'price', saved: '1' }, [first.id]).length, 1);
  assert.equal(filterCatalog([first, second], { information: 'coordinates' })[0].id, second.id);
  // Field presence does not claim a private room exists.
  assert.equal(filterCatalog([first], { information: 'private_room' }).length, 1);
  assert.equal(filterCatalog([first, second], { saved: '1' }, []).length, 0);
  assert.deepEqual(catalogGenres([first, second, first]), ['中国料理', '日本料理']);
});
test('sorting preserves course-price qualifiers and closure notices without deriving averages', () => {
  const rows = [second, first]; const result = filterCatalog(rows, { sort: 'recent' });
  assert.equal(result[0], first); assert.equal(rows[0], second);
  assert.equal(result[0].facts.find(fact => fact.field === 'price').value, '夜会席16,500円、税・サービス料別');
  assert.equal(result[0].facts.find(fact => fact.field === 'notice').value, '10月5日は休業');
});
test('real saved IDs are deduplicated UUIDs and never include legacy sample IDs', () => {
  assert.equal(SAVED_CATALOG_KEY, 'executive-dining:verified-saved:v1');
  assert.deepEqual(parseSavedCatalogIds(JSON.stringify(['1', first.id, first.id, null, second.id])), [first.id, second.id]);
  assert.deepEqual(parseSavedCatalogIds('bad-json'), []);
});
test('real detail URLs retain filters/map/saved state and malformed paths fail safely', () => {
  const params = { query: '名古屋 半個室', genre: '日本料理', information: 'price', sort: 'recent', saved: '1', view: 'map' };
  assert.deepEqual(parseRoute(routeHash('nagoya-detail', first.id, params)), { page: 'nagoya-detail', restaurantId: first.id, params });
  assert.equal(parseRoute('#/nagoya/%E0%A4%A').page, 'nagoya'); assert.equal(parseRoute('#/demo').page, 'demo');
});
test('public cache deduplicates requests, shares results for navigation and has no background polling', async () => {
  let calls = 0, clock = 1000, resolve;
  const deferred = new Promise(yes => { resolve = yes; });
  const store = createCatalogStore(async () => { calls++; return deferred; }, () => clock);
  const one = store.load(), two = store.load(); assert.equal(one, two); assert.equal(calls, 1);
  resolve([first]); await one; assert.equal(store.getSnapshot().rows[0], first);
  await store.load(); assert.equal(calls, 1);
  clock += 61_000; assert.equal(calls, 1); // Time alone performs no request.
  await store.load(); assert.equal(calls, 2);
});
test('public cache clears stale results on error and can retry with an empty unpublished catalog', async () => {
  let next = 'success';
  const store = createCatalogStore(async () => { if (next === 'error') throw new Error('offline'); return next === 'empty' ? [] : [first]; });
  await store.load(); next = 'error'; await store.load(true);
  assert.equal(store.getSnapshot().rows.length, 0); assert.ok(store.getSnapshot().error);
  next = 'empty'; await store.load(true); assert.equal(store.getSnapshot().error, ''); assert.deepEqual(store.getSnapshot().rows, []);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOpenPoiResponse, buildOpenPoiUrl, OpenPoiProvider } from '../src/data/providers/openPoi.ts';
import { searchVerifiedRestaurants, verifiedCoordinates, safeExternalUrl, decodePublishedCatalog } from '../src/domain/dining.ts';
import { configuredMapProvider } from '../src/components/map/mapProvider.ts';
import { classifyMapFailure } from '../src/components/map/mapDiagnostics.ts';
import { parseRoute, routeHash } from '../src/lib/routing.ts';
const timestamp = '2026-10-05T00:00:00Z';
const facility = { name: 'テスト食堂', address: '名古屋市中区1', city: '名古屋市中区', category: 'restaurant', lat: '35.17', lng: '136.90', level: '8', source: 'overture', licenses: ['CDLA-Permissive-2.0', 'Apache-2.0'], attributions: ['A', 'B'] };
const batch = records => parseOpenPoiResponse({ count: records.length, results: records }, 'https://api.openpoiapi.com/v1/search?q=test', timestamp, 50, () => 'test-id');
test('OpenPOI preserves all licenses and attributions without promoting candidates', () => {
  const item = batch([facility]).candidates[0];
  assert.deepEqual(item.source.licenses, facility.licenses);
  assert.deepEqual(item.source.attributions, facility.attributions);
  assert.equal(item.status, 'candidate'); assert.equal(item.source.verifiedAt, null);
  assert.deepEqual(item.coordinates, [136.9, 35.17]);
});
test('blank or invalid coordinates never become zero or verified pins', () => {
  for (const coord of ['', ' ', null, 'NaN', '999']) assert.equal(batch([{ ...facility, lat: coord }]).candidates[0].coordinates, null);
});
test('OpenPOI OR queries are bounded and unrelated cities skipped', () => {
  const url = new URL(buildOpenPoiUrl('寿司 日本料理', 200));
  assert.equal(url.searchParams.get('q'), '寿司 日本料理');
  assert.equal(url.searchParams.get('bbox'), '136.75,35,137.15,35.35');
  assert.equal(batch([{ ...facility, city: '豊田市' }, facility]).skipped, 1);
  assert.throws(() => buildOpenPoiUrl('', 50)); assert.throws(() => buildOpenPoiUrl('寿司', 201));
});
test('provider matching hints do not deduplicate distinct records automatically', () => {
  assert.equal(batch([facility, facility]).candidates.length, 2);
});
test('missing licensing remains a warning and never gets a default license', () => {
  const item = batch([{ ...facility, licenses: undefined, attributions: undefined }]).candidates[0];
  assert.deepEqual(item.source.licenses, []); assert.ok(item.warnings.some(w => w.includes('公開不可')));
});
test('provider validates errors and count, flags cap rather than inventing pagination', () => {
  assert.throws(() => batch({ error: 'bad' }));
  assert.throws(() => parseOpenPoiResponse({ count: -1, results: [] }, '', timestamp));
  assert.equal(parseOpenPoiResponse({ count: 2, results: [facility, facility] }, '', timestamp, 2).possiblyTruncated, true);
});
test('provider does not retry 429 or burst concurrent requests', async () => {
  let calls = 0;
  const provider = new OpenPoiProvider(async () => { calls++; return new Response('', { status: 429 }); });
  await assert.rejects(provider.search('寿司'), /429/);
  await assert.rejects(provider.search('寿司'), /2秒/);
  assert.equal(calls, 1);
});
const restaurant = { id: 'id', status: 'verified', name: '名古屋 食堂', address: '名古屋市中区', facts: [{ field: 'private_room', value: '半個室' }], reviews: [], verifiedAt: timestamp };
test('public catalog uses AND search only on verified facts', () => {
  assert.equal(searchVerifiedRestaurants([restaurant], '名古屋 半個室').length, 1);
  assert.equal(searchVerifiedRestaurants([{ ...restaurant, status: 'candidate' }], '').length, 0);
});
test('no inferred coordinates for verified venues', () => {
  assert.equal(verifiedCoordinates(restaurant), null);
  assert.deepEqual(verifiedCoordinates({ ...restaurant, facts: [{ field: 'coordinates', value: '136.9,35.17' }] }), [136.9, 35.17]);
  assert.equal(verifiedCoordinates({ ...restaurant, facts: [{ field: 'coordinates', value: '35.17,136.9' }] }), null);
});
test('external links exclude script and credential-bearing URLs', () => {
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl('https://name:password@example.com'), null);
  assert.equal(safeExternalUrl('https://example.com'), 'https://example.com/');
});
test('map style configuration rejects insecure URLs and route survives reload', () => {
  assert.equal(configuredMapProvider('http://example.com/style').name, 'OpenFreeMap');
  assert.equal(parseRoute(routeHash('nagoya')).page, 'nagoya');
  assert.equal(parseRoute(routeHash('curation')).page, 'curation');
});
test('addressless provider records remain explicit low-confidence candidates', () => {
  const item = batch([{ ...facility, address: '', category: 'lodging' }]).candidates[0];
  assert.equal(item.address, null); assert.equal(item.category, 'lodging');
  assert.equal(item.rawRecord.address, '');
  assert.ok(item.warnings.some(w => w.includes('住所が未記載')));
});

test('malformed public RPC contract fails closed instead of crashing during render', () => {
  assert.throws(() => decodePublishedCatalog([{ ...restaurant, facts: null }]), /形式/);
  assert.throws(() => decodePublishedCatalog([{ ...restaurant, verifiedAt: 'not-a-date' }]), /形式/);
  assert.deepEqual(decodePublishedCatalog([{ status: 'candidate' }]), []);
});

test('map diagnostics distinguish unsupported WebGL from provider/network errors', () => {
  assert.equal(classifyMapFailure(new Error('WebGL2 is required')), 'webgl');
  assert.equal(classifyMapFailure(new Error('Failed to fetch (https://tiles.example.com)')), 'network');
  assert.equal(classifyMapFailure(new Error('Unable to create Worker')), 'worker');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseComparisonIds, storedComparisonIds, buildComparisonUrl } from '../src/lib/comparison.ts';
const a = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const b = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const c = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const d = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
test('comparison links accept up to three valid public identifiers only', () => {
  assert.deepEqual(parseComparisonIds(`${a},${b},${c}`), [a,b,c]);
  assert.deepEqual(parseComparisonIds(`${a},${b},${c},${d}`), []);
  assert.deepEqual(parseComparisonIds(`${a},company-secret`), []);
  assert.deepEqual(parseComparisonIds('1,2'), []);
  assert.deepEqual(storedComparisonIds(JSON.stringify([a,a,b,c,d])), [a,b,c]);
});
test('shared comparison strips all free text, auth query, tracking and old fragments', () => {
  const shared = new URL(buildComparisonUrl('https://example.com/?code=synthetic-secret&utm_source=private#/nagoya?query=CompanyName&date=tomorrow', [a,b]));
  assert.equal(shared.search, ''); assert.equal(shared.hash, `#/compare?ids=${a}%2C${b}`);
  assert.ok(!shared.href.includes('CompanyName')); assert.ok(!shared.href.includes('secret'));
  assert.ok(!shared.href.includes('tomorrow'));
});
test('invalid or duplicate comparison inputs never silently broaden a link', () => {
  assert.throws(() => buildComparisonUrl('https://example.com', []));
  assert.throws(() => buildComparisonUrl('https://example.com', [a,a]));
  assert.throws(() => buildComparisonUrl('https://user:secret@example.com', [a]));
});

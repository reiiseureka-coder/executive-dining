import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { parseRoute, routeHash } from '../src/lib/routing.ts';

test('read-only demo contains exactly the already-public official fixture', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/owner-trial-catalog.json', import.meta.url)));
  const demo = JSON.parse(readFileSync(new URL('../src/data/service-demo-catalog.json', import.meta.url)));
  assert.deepEqual(demo, fixture);
  assert.equal(demo.length, 10);
  for (const row of demo) {
    assert.equal(Object.hasOwn(row, 'reviews'), false, 'Static official records must not invent review data.');
    assert.equal(Object.hasOwn(row, 'rating'), false, 'Static official records must not invent ratings.');
  }
  assert.ok(demo.every(row => row.status === 'candidate' && row.facts.every(fact => fact.sourceUrl && fact.verifiedAt)));
});

test('standalone entry does not import live authentication or data repositories', () => {
  const visited = new Set();
  function inspect(path) {
    if (visited.has(path) || !/\.[jt]sx?$/.test(extname(path))) return;
    visited.add(path);
    assert.ok(!/\/(?:contexts|data\/repositories)\//.test(path), path);
    assert.ok(!/\/(?:supabase|diningClient|ownerTrialClient|reviewPilotClient)\.ts$/.test(path), path);
    const text = readFileSync(path, 'utf8');
    for (const match of text.matchAll(/(?:import|export)\s+(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
      if (!match[1].startsWith('.')) continue;
      const base = resolve(dirname(path), match[1].split('?')[0]);
      const next = [base, ...['.ts', '.tsx', '/index.ts', '/index.tsx'].map(suffix => base + suffix)].find(existsSync);
      if (next) inspect(next);
    }
  }
  inspect(resolve('src/ServiceDemoApp.tsx'));
  assert.ok(visited.size > 5);
  assert.ok(readFileSync('preview.html', 'utf8').includes('src/ServiceDemoApp.tsx'));
});

test('static demo routes stay separate from live or privileged routes', () => {
  assert.equal(parseRoute('#/preview').page, 'service-demo');
  assert.equal(parseRoute('#/preview-compare?ids=one,two').page, 'service-demo-compare');
  assert.equal(parseRoute('#/preview/test-record').page, 'service-demo-detail');
  assert.equal(parseRoute('#/nagoya/test-record').page, 'nagoya-detail');
  assert.equal(routeHash('service-demo-detail', 'record', { returnTo: 'service-demo-compare' }), '#/preview/record?returnTo=service-demo-compare');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { restaurantPhotos, generatedIllustrations, getRestaurantGallery, ILLUSTRATION_DISCLAIMER, officialRestaurantGalleries } from '../src/data/restaurantPhotos.ts';

test('UI illustrations remain distinct from real restaurant photography', () => {
  assert.equal(restaurantPhotos.length, 0, 'No actual venue image reuse permissions have been acquired.');
  assert.equal(ILLUSTRATION_DISCLAIMER, '実店舗の写真ではないイメージ画像');
  for (const visual of Object.values(generatedIllustrations)) {
    assert.equal(visual.kind, 'illustration');
    assert.equal(visual.source, 'generated-ui-illustration');
    assert.equal(visual.generatedAt, '2026-10-09');
    assert.equal('restaurantId' in visual, false);
    assert.equal('rights' in visual, false);
    assert.ok(visual.alt.includes(ILLUSTRATION_DISCLAIMER));
    assert.match(visual.alt, /生成 \/ UI確認用/);
    assert.match(visual.src, /^\/images\/dining-(japanese|chinese|room)\.webp$/);
    assert.ok(existsSync(`public${visual.src}`));
    assert.equal(visual.width, 1200); assert.equal(visual.height, 800);
  }
});

test('illustration selection follows genre without guessing cuisine from venue name or ID', () => {
  assert.deepEqual(getRestaurantGallery('one', '中国料理・広東料理').map(v => v.id), ['illustration-chinese', 'illustration-neutral-table']);
  assert.deepEqual(getRestaurantGallery('two', '日本料理').map(v => v.id), ['illustration-japanese', 'illustration-neutral-table']);
  assert.deepEqual(getRestaurantGallery('unknown', '未確認').map(v => v.id), ['illustration-neutral-table']);
  assert.deepEqual(getRestaurantGallery('Japanese-looking-name'), [generatedIllustrations.table]);
  const before = JSON.stringify(generatedIllustrations);
  getRestaurantGallery('arbitrary', '日本料理');
  assert.equal(JSON.stringify(generatedIllustrations), before);
});

test('official gallery URLs offer navigation only, not image licenses', () => {
  assert.equal(Object.keys(officialRestaurantGalleries).length, 10);
  for (const [id, url] of Object.entries(officialRestaurantGalleries)) {
    assert.match(id, /^[a-f0-9-]{36}$/);
    assert.equal(new URL(url).protocol, 'https:');
  }
});

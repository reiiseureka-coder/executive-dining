import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { catalogImagery, diningImagery } from '../src/lib/catalogImagery.ts';
const row = value => ({ facts: [{ field: 'genre', value }] });
test('illustrative cuisine selection is deterministic and never infers venue attributes', () => {
  assert.equal(catalogImagery(row('日本料理')).src, diningImagery.japanese.src);
  assert.equal(catalogImagery(row('中国料理・広東料理')).src, diningImagery.chinese.src);
  assert.equal(catalogImagery(row('イタリア料理')).src, diningImagery.room.src);
  assert.equal(catalogImagery({ facts: [] }).src, diningImagery.room.src);
  for (const image of Object.values(diningImagery)) {
    assert.match(image.alt, /生成イメージ。実際の店舗・料理ではありません/);
    assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)));
  }
});
test('imagery does not change facts or bundle the private ten-venue fixture', () => {
  const before = row('懐石'); const snapshot = JSON.stringify(before); catalogImagery(before);
  assert.equal(JSON.stringify(before), snapshot);
  const home = readFileSync(new URL('../src/components/HomeCatalog.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(home, /fixtures|mockData|localStorage/);
  assert.match(home, /controller\.abort/);
});

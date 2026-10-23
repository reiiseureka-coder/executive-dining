import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberPagePosition, pagePosition } from '../src/lib/pageScroll.ts';

test('list return restores the original row after comparison selection changes on detail', () => {
  for (const page of ['nagoya', 'pilot']) {
    const original = `#/${page}?query=restore-row&genre=日本料理`;
    rememberPagePosition(original, 712, 'verified-original');
    assert.deepEqual(pagePosition(`${original}&ids=first,second`), { top: 712, focusId: 'verified-original' });
    rememberPagePosition(`${original}&ids=first`, 931, 'verified-next');
    assert.deepEqual(pagePosition(original), { top: 931, focusId: 'verified-next' });
    assert.equal(pagePosition(`#/${page}?query=different&genre=日本料理`), undefined);
  }
});

test('comparison routes keep separate positions for different candidates', () => {
  rememberPagePosition('#/compare?ids=first,second', 440);
  assert.deepEqual(pagePosition('#/compare?ids=first,second'), { top: 440, focusId: undefined });
  assert.equal(pagePosition('#/compare?ids=first,third'), undefined);
});

test('saved filters and negative scroll positions retain their existing safeguards', () => {
  rememberPagePosition('#/nagoya?saved=1&query=saved-check', -30, 'verified-saved');
  assert.deepEqual(pagePosition('#/nagoya?query=saved-check&saved=1&ids=first'), { top: 0, focusId: 'verified-saved' });
  assert.equal(pagePosition('#/nagoya?query=saved-check'), undefined);
});

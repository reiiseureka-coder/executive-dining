import { parseSavedCatalogIds } from './savedCatalog.ts';
export const COMPARISON_KEY = 'executive-dining:comparison:v1';
export const MAX_COMPARISON = 3;
export function parseComparisonIds(raw?: string): string[] {
  if (!raw || raw.length > 3 * 37) return [];
  const input = raw.split(',');
  const valid = parseSavedCatalogIds(JSON.stringify(input));
  return input.length <= MAX_COMPARISON && valid.length === new Set(input).size ? valid : [];
}
export function storedComparisonIds(raw: string): string[] { return parseSavedCatalogIds(raw).slice(0, MAX_COMPARISON); }
/** Share only public identifiers. Never carry free text, callback tokens, tracking or private event details. */
export function buildComparisonUrl(currentHref: string, ids: string[]): string {
  const valid = parseComparisonIds(ids.join(','));
  if (!valid.length || valid.length !== ids.length) throw new Error('比較する店舗を1〜3件選択してください。');
  const url = new URL(currentHref);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('共有先URLを確認できません。');
  url.search = ''; url.hash = `/compare?${new URLSearchParams({ ids: valid.join(',') })}`;
  return url.href;
}

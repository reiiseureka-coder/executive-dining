import type { RestaurantCandidate } from '../../domain/dining.ts';

export const NAGOYA_BOUNDS = [136.75, 35.0, 137.15, 35.35] as const;
export const OPENPOI_ENDPOINT = 'https://api.openpoiapi.com/v1/search';
export interface CandidateBatch {
  candidates: RestaurantCandidate[];
  skipped: number;
  possiblyTruncated: boolean;
  requestUrl: string;
  fetchedAt: string;
}
export interface CandidateProvider {
  search(query: string, signal?: AbortSignal): Promise<CandidateBatch>;
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const strings = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean))] : [];
function coordinate(value: unknown): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function buildOpenPoiUrl(query: string, limit = 50): string {
  if (!query.trim() || query.length > 120) throw new Error('検索語は1〜120文字で指定してください。');
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new Error('取得件数は1〜200件で指定してください。');
  const url = new URL(OPENPOI_ENDPOINT);
  // Search terms are OR upstream. Bbox plus local city/coordinate checks are mandatory.
  url.search = new URLSearchParams({ q: query.trim(), bbox: NAGOYA_BOUNDS.join(','), limit: String(limit) }).toString();
  return url.href;
}
export function parseOpenPoiResponse(
  payload: unknown, requestUrl: string, fetchedAt: string, limit = 50,
  createId: () => string = () => crypto.randomUUID(),
): CandidateBatch {
  if (!object(payload) || !Array.isArray(payload.results) || !Number.isInteger(payload.count) || Number(payload.count) < 0 || !Number.isFinite(Date.parse(fetchedAt))) {
    throw new Error('OpenPOIの応答形式を確認できませんでした。候補は取り込んでいません。');
  }
  const candidates: RestaurantCandidate[] = [];
  let skipped = 0;
  for (const item of payload.results.slice(0, limit)) {
    if (!object(item)) { skipped++; continue; }
    const name = text(item.name), address = text(item.address), city = text(item.city);
    if (!name || !city.startsWith('名古屋市')) { skipped++; continue; }
    const lat = coordinate(item.lat), lng = coordinate(item.lng), level = coordinate(item.level);
    const warnings: string[] = [];
    if (!address) warnings.push('住所が未記載です。店舗の同一性と所在地を公式情報で確認してください。');
    let coordinates: [number, number] | null = null;
    if (lat !== null && lng !== null && lng >= NAGOYA_BOUNDS[0] && lng <= NAGOYA_BOUNDS[2] && lat >= NAGOYA_BOUNDS[1] && lat <= NAGOYA_BOUNDS[3]) coordinates = [lng, lat];
    else warnings.push('座標なし、または名古屋の取得範囲外。店舗位置の公式確認が必要。');
    if (level === null || level < 8) warnings.push('座標精度が店舗単位とは確認できません。');
    const licenses = strings(item.licenses), attributions = strings(item.attributions);
    if (!licenses.length) warnings.push('元データのライセンス情報がありません。公開不可。');
    warnings.push('営業状況・個室・料金・会食適性は未確認。');
    const normalized = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s+/g, '');
    candidates.push({
      id: createId(), name, address: address || null, city, category: text(item.category) || null,
      coordinates, coordinatePrecision: level, status: 'candidate',
      matchKey: `${normalized(name)}|${normalized(address || city)}`,
      source: { provider: `openpoi:${text(item.source) || 'unknown'}`, sourceUrl: requestUrl, licenses, attributions, fetchedAt, verifiedAt: null }, warnings, rawRecord: structuredClone(item),
    });
  }
  return { candidates, skipped: skipped + Math.max(0, payload.results.length - limit), possiblyTruncated: payload.results.length >= limit || Number(payload.count) >= limit, requestUrl, fetchedAt };
}
/** Intended for a bounded operator acquisition job, never the public search UI. No automatic retry, pagination, or polling. */
export class OpenPoiProvider implements CandidateProvider {
  private inFlight = false;
  private lastRequest = 0;
  private fetcher: typeof fetch;
  constructor(fetcher: typeof fetch = fetch) { this.fetcher = fetcher; }
  async search(query: string, signal?: AbortSignal): Promise<CandidateBatch> {
    if (this.inFlight || Date.now() - this.lastRequest < 2000) throw new Error('候補取得は2秒以上あけて1件ずつ実行してください。');
    const requestUrl = buildOpenPoiUrl(query);
    this.inFlight = true;
    this.lastRequest = Date.now();
    try {
      const timeout = AbortSignal.timeout(15_000);
      const response = await this.fetcher(requestUrl, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`OpenPOIの取得に失敗しました（HTTP ${response.status}）。自動再試行はしません。`);
      return parseOpenPoiResponse(await response.json(), requestUrl, new Date().toISOString());
    } finally { this.inFlight = false; }
  }
}

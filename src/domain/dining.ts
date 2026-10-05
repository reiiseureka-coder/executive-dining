/** Real catalog types. Never coerce candidate data into the legacy demo Restaurant. */
export type VerificationStatus = 'candidate' | 'verified' | 'rejected';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type FactField = 'name' | 'address' | 'website' | 'genre' | 'private_room' | 'price' | 'hours' | 'access' | 'coordinates' | 'notice';
export const FACT_LABELS: Record<FactField, string> = {
  name: '店舗名', address: '所在地', website: '公式サイト', genre: '料理',
  private_room: '個室', price: '料金', hours: '営業時間', access: 'アクセス', coordinates: '地図位置', notice: '営業のお知らせ',
};
export interface Provenance {
  provider: string;
  sourceUrl: string;
  licenses: string[];
  attributions: string[];
  fetchedAt: string;
  verifiedAt: string | null;
}
export interface RestaurantCandidate {
  /** Locally allocated UUID, not a purported provider identifier. */
  id: string;
  name: string;
  address: string | null;
  city: string;
  category: string | null;
  coordinates: [number, number] | null;
  coordinatePrecision: number | null;
  status: 'candidate';
  /** Matching hint only. A change or collision must never automatically merge records. */
  matchKey: string;
  source: Provenance;
  warnings: string[];
  rawRecord: Record<string, unknown>;
}
export interface PublishedFact {
  field: FactField;
  value: string;
  sourceUrl: string;
  provider: string;
  licenses: string[];
  attributions: string[];
  fetchedAt: string;
  verifiedAt: string;
}
export interface PublishedReview {
  id: string;
  displayName: string;
  rating: number;
  comment: string;
  visitedMonth: string;
  publishedAt: string;
}
export interface VerifiedRestaurant {
  id: string;
  status: 'verified';
  name: string;
  address: string;
  verifiedAt: string;
  facts: PublishedFact[];
  reviews: PublishedReview[];
}
export interface EditorialRestaurant {
  id: string;
  name: string;
  address: string;
  status: VerificationStatus;
  version: number;
  verifiedAt: string | null;
  sources: (Provenance & { id: string; publicationBasis: string; rawRecord: Record<string, unknown> | null })[];
  facts: PublishedFact[];
}
export function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function factValue(restaurant: VerifiedRestaurant, field: FactField): string | null {
  return restaurant.facts.find(fact => fact.field === field)?.value ?? null;
}
export function verifiedCoordinates(restaurant: VerifiedRestaurant): [number, number] | null {
  const value = factValue(restaurant, 'coordinates');
  if (!value) return null;
  const parts = value.split(',');
  if (parts.length !== 2 || parts.some(part => !part.trim())) return null;
  const [lng, lat] = parts.map(Number);
  // Nagoya launch bounds, not a precise municipal boundary.
  return Number.isFinite(lng) && Number.isFinite(lat) && lng >= 136.75 && lng <= 137.15 && lat >= 35 && lat <= 35.35 ? [lng, lat] : null;
}
export function searchVerifiedRestaurants(restaurants: VerifiedRestaurant[], query: string): VerifiedRestaurant[] {
  const normalize = (text: string) => text.normalize('NFKC').toLocaleLowerCase('ja').trim();
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return restaurants.filter(restaurant => restaurant.status === 'verified' && words.every(word => normalize([
    restaurant.name, restaurant.address, ...restaurant.facts.map(fact => fact.value),
  ].join(' ')).includes(word)));
}

/** Fail closed if a deployment returns an incompatible public RPC contract. */
export function decodePublishedCatalog(payload: unknown): VerifiedRestaurant[] {
  const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
  const strings = (value: unknown) => Array.isArray(value) && value.every(item => typeof item === 'string');
  const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (!Array.isArray(payload)) throw new Error('掲載データの形式を確認できませんでした。');
  const rows: VerifiedRestaurant[] = [];
  for (const row of payload) {
    if (!object(row)) throw new Error('掲載データの形式を確認できませんでした。');
    if (row.status !== 'verified') continue;
    if (typeof row.id !== 'string' || typeof row.name !== 'string' || typeof row.address !== 'string' || !date(row.verifiedAt) || !Array.isArray(row.facts) || !Array.isArray(row.reviews)) throw new Error('掲載データの形式を確認できませんでした。');
    for (const fact of row.facts) {
      if (!object(fact) || typeof fact.field !== 'string' || !Object.hasOwn(FACT_LABELS, fact.field) || typeof fact.value !== 'string' || typeof fact.sourceUrl !== 'string' || !safeExternalUrl(fact.sourceUrl) || typeof fact.provider !== 'string' || !strings(fact.licenses) || !strings(fact.attributions) || !date(fact.fetchedAt) || !date(fact.verifiedAt)) throw new Error('出典データの形式を確認できませんでした。');
    }
    for (const review of row.reviews) {
      if (!object(review) || typeof review.id !== 'string' || typeof review.displayName !== 'string' || typeof review.comment !== 'string' || typeof review.rating !== 'number' || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 || typeof review.visitedMonth !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(review.visitedMonth) || !date(review.publishedAt)) throw new Error('口コミデータの形式を確認できませんでした。');
    }
    rows.push(row as unknown as VerifiedRestaurant);
  }
  return rows;
}

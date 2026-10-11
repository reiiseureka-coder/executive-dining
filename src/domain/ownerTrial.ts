import { FACT_LABELS, safeExternalUrl, type PublishedFact } from './dining.ts';
import { isUuid } from './reviews.ts';
export interface PilotRestaurant { id: string; status: 'candidate' | 'verified'; privatePilot: true; name: string; address: string; factsCheckedAt: string; facts: PublishedFact[] }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const strings = (value: unknown) => Array.isArray(value) && value.every(item => typeof item === 'string');
export function decodePilotCatalog(value: unknown): PilotRestaurant[] {
  if (!Array.isArray(value) || value.length > 10) throw new Error('非公開店舗データの形式を確認できません。');
  return value.map(row => {
    if (!record(row) || !isUuid(row.id) || row.privatePilot !== true || !['candidate','verified'].includes(String(row.status)) || typeof row.name !== 'string' || typeof row.address !== 'string' || !date(row.factsCheckedAt) || !Array.isArray(row.facts)) throw new Error('非公開店舗データの形式を確認できません。');
    const facts: PublishedFact[] = row.facts.map(fact => {
      if (!record(fact) || typeof fact.field !== 'string' || !Object.hasOwn(FACT_LABELS,fact.field) || typeof fact.value !== 'string' || !fact.value.trim() || typeof fact.sourceUrl !== 'string' || !safeExternalUrl(fact.sourceUrl) || typeof fact.provider !== 'string' || !strings(fact.licenses) || !strings(fact.attributions) || !date(fact.fetchedAt) || !date(fact.verifiedAt)) throw new Error('店舗の出典を確認できません。');
      return { field: fact.field as PublishedFact['field'], value: fact.value, sourceUrl: fact.sourceUrl, provider: fact.provider, licenses: fact.licenses as string[], attributions: fact.attributions as string[], fetchedAt: fact.fetchedAt, verifiedAt: fact.verifiedAt };
    });
    if (new Set(facts.map(f=>f.field)).size!==facts.length) throw new Error('確認項目が重複しています。');
    for (const field of ['name','address','website'] as const) {
      const fact=facts.find(f=>f.field===field);
      if (!fact || fact.provider!=='official' || !safeExternalUrl(fact.sourceUrl)?.startsWith('https:') || (field!=='website' && fact.value!==row[field]) || (field==='website' && !safeExternalUrl(fact.value))) throw new Error('公式の基本情報を確認できません。');
    }
    return { id: row.id, status: row.status as PilotRestaurant['status'], privatePilot: true, name: row.name, address: row.address, factsCheckedAt: row.factsCheckedAt, facts };
  });
}
export function searchPilotRestaurants(rows: PilotRestaurant[], query: string, genre: string) {
  const normalize=(value:string)=>value.normalize('NFKC').toLocaleLowerCase('ja');
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  return rows.filter(row=>(!genre || row.facts.some(f=>f.field==='genre' && f.value===genre)) && words.every(word=>normalize([row.name,row.address,...row.facts.map(f=>f.value)].join(' ')).includes(word)));
}
export const OWNER_TRIAL_POLICY='owner-dummy-trial-2026-10-06-v1';
export const OWNER_TEST_COMMENT='これは操作確認用の非公開テスト投稿です。実際の来店体験・店舗の評価ではありません。';

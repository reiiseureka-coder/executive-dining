import recordedCatalog from './service-demo-catalog.json?raw';
import { factValue, type PublishedFact } from '../domain/dining';
import type { SearchParams } from '../lib/search';

/**
 * A fixed copy of the already-public test fixture, not a live/public catalog.
 * Keep every original fact, source, date and candidate status unchanged.
 * This module deliberately has no repository, authentication or storage imports.
 */
export interface ServiceDemoRestaurant {
  id: string;
  name: string;
  address: string;
  status: 'candidate' | 'verified';
  privatePilot: true;
  factsCheckedAt: string;
  facts: PublishedFact[];
}

export const serviceDemoCatalog = JSON.parse(recordedCatalog) as ServiceDemoRestaurant[];
export const serviceDemoGenres = [...new Set(serviceDemoCatalog.map(row => factValue(row, 'genre')).filter((genre): genre is string => !!genre))];
export const serviceDemoDate = (date: string) => new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date(date));

export function serviceDemoStatus(restaurant: ServiceDemoRestaurant): string {
  return restaurant.status === 'candidate' ? '掲載候補（candidate）' : '確認済み記録（verified）';
}

/** Only known static records can be compared; URL state never reaches a server. */
export function serviceDemoIds(raw?: string): string[] {
  if (!raw || raw.length > 3 * 37) return [];
  const ids = raw.split(',');
  if (ids.length > 3 || ids.some(id => !serviceDemoCatalog.some(row => row.id === id))) return [];
  return [...new Set(ids)];
}

export function searchServiceDemo(params: SearchParams): ServiceDemoRestaurant[] {
  const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja');
  const terms = normalize(params.query ?? '').trim().split(/\s+/).filter(Boolean);
  return serviceDemoCatalog.filter(row =>
    (!params.genre || factValue(row, 'genre') === params.genre) &&
    (params.information !== 'price' || !!factValue(row, 'price')) &&
    terms.every(term => normalize([row.name, row.address, ...row.facts.map(fact => fact.value)].join(' ')).includes(term)),
  );
}

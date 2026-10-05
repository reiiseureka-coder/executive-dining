import { factValue, searchVerifiedRestaurants, verifiedCoordinates, type VerifiedRestaurant } from '../domain/dining.ts';
import type { SearchParams } from './search.ts';
export function filterCatalog(rows: VerifiedRestaurant[], params: SearchParams, savedIds: string[] = []): VerifiedRestaurant[] {
  return searchVerifiedRestaurants(rows, params.query ?? '').filter(row => {
    const info = params.information;
    const hasInfo = !info || (info === 'coordinates' ? !!verifiedCoordinates(row) : ['private_room', 'price', 'hours', 'notice'].includes(info) && !!row.facts.find(fact => fact.field === info));
    return (!params.genre || factValue(row, 'genre') === params.genre) && hasInfo && (params.saved !== '1' || savedIds.includes(row.id));
  }).sort((a, b) => params.sort === 'recent' ? Date.parse(b.verifiedAt) - Date.parse(a.verifiedAt) || a.name.localeCompare(b.name, 'ja') : a.name.localeCompare(b.name, 'ja'));
}
export function catalogGenres(rows: VerifiedRestaurant[]): string[] {
  return [...new Set(rows.map(row => factValue(row, 'genre')).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'ja'));
}

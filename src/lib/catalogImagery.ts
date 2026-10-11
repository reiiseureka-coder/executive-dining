import { factValue, type PublishedFact } from '../domain/dining.ts';
export const diningImagery = {
  japanese: { src: '/images/dining-japanese.webp', alt: '和食の生成イメージ。実際の店舗・料理ではありません' },
  chinese: { src: '/images/dining-chinese.webp', alt: '中国料理の生成イメージ。実際の店舗・料理ではありません' },
  room: { src: '/images/dining-room.webp', alt: '落ち着いた食卓の生成イメージ。実際の店舗・料理ではありません' },
} as const;
/** Decorative fallback only. Never turn this into a verified restaurant fact or photo. */
export function catalogImagery(restaurant: { facts: PublishedFact[] }) {
  const name = factValue(restaurant, 'name') ?? '';
  // Mix in a neutral table illustration consistently, without claiming venue-specific decor.
  if (name && [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3 === 1) return diningImagery.room;
  const genre = factValue(restaurant, 'genre') ?? '';
  return /中国|広東|中華/.test(genre) ? diningImagery.chinese : /日本|和食|懐石|会席|加賀/.test(genre) ? diningImagery.japanese : diningImagery.room;
}

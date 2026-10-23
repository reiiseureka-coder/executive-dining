import { parseRoute, routeHash } from './routing.ts';
const positions = new Map<string, { top: number; focusId?: string }>();
const key = (hash: string) => {
  const route = parseRoute(hash);
  // Choosing comparison candidates does not change the list being returned to.
  // Keep actual search filters distinct, but restore the same row after a detail-page selection.
  const params = ['nagoya', 'pilot'].includes(route.page) ? { ...route.params, ids: undefined } : route.params;
  return routeHash(route.page, route.restaurantId, params);
};
/** In-memory navigation state only. It contains no account/profile data and is never sent. */
export function rememberPagePosition(hash: string, top: number, focusId?: string) {
  const route = key(hash); positions.delete(route); positions.set(route, {top: Math.max(0,top),focusId});
  if (positions.size > 25) positions.delete(positions.keys().next().value!);
}
export function pagePosition(hash: string) { return positions.get(key(hash)); }

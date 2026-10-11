import type { VerifiedRestaurant } from '../domain/dining.ts';
export interface CatalogSnapshot { rows: VerifiedRestaurant[]; loading: boolean; error: string; loadedAt: number }
/** Short, in-memory public-data cache. No polling and no private/editorial data. */
export function createCatalogStore(loader: (() => Promise<VerifiedRestaurant[]>) | null, now = Date.now) {
  let snapshot: CatalogSnapshot = { rows: [], loading: Boolean(loader), error: '', loadedAt: 0 };
  let pending: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: CatalogSnapshot) => { snapshot = next; listeners.forEach(listener => listener()); };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load(force = false): Promise<void> {
      if (!loader) return Promise.resolve();
      if (pending) return pending;
      if (!force && snapshot.loadedAt && now() - snapshot.loadedAt < 60_000) return Promise.resolve();
      publish({ ...snapshot, loading: true, error: '' });
      pending = loader().then(rows => {
        publish({ rows, loading: false, error: '', loadedAt: now() });
      }).catch(() => {
        publish({ rows: [], loading: false, error: '掲載情報を読み込めませんでした。時間をおいて再度お試しください。', loadedAt: 0 });
      }).finally(() => { pending = null; });
      return pending;
    },
  };
}

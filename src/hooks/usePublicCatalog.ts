import { useEffect, useSyncExternalStore } from 'react';
import { diningRepository } from '../data/diningClient';
import { createCatalogStore } from '../data/catalogStore';
const store = createCatalogStore(diningRepository ? diningRepository.listPublished.bind(diningRepository) : null);
export function usePublicCatalog() {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { void store.load(); }, []);
  return { ...snapshot, reload: () => store.load(true) };
}

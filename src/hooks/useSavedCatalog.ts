import { useMemo, useSyncExternalStore } from 'react';
import { parseSavedCatalogIds, SAVED_CATALOG_KEY } from '../lib/savedCatalog';
const event = 'executive-dining:verified-saved';
let fallback = '[]';
let memoryOnly = false;
let storageWarning = '';
function snapshot() {
  if (memoryOnly) return fallback;
  try { return localStorage.getItem(SAVED_CATALOG_KEY) ?? fallback; } catch { return fallback; }
}
function subscribe(listener: () => void) {
  window.addEventListener('storage', listener); window.addEventListener(event, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(event, listener); };
}
export function useSavedCatalog() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const savedIds = useMemo(() => parseSavedCatalogIds(raw), [raw]);
  const toggleSaved = (id: string) => {
    if (!parseSavedCatalogIds(JSON.stringify([id])).length) return;
    const current = parseSavedCatalogIds(snapshot());
    fallback = JSON.stringify(current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    try { localStorage.setItem(SAVED_CATALOG_KEY, fallback); memoryOnly = false; storageWarning = ''; }
    catch { memoryOnly = true; storageWarning = 'ブラウザの保存領域が使えないため、候補は再読み込みで消える場合があります。'; }
    window.dispatchEvent(new Event(event));
  };
  return { savedIds, toggleSaved, storageWarning };
}

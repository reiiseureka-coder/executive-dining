import { useMemo, useSyncExternalStore } from 'react';
import { COMPARISON_KEY, MAX_COMPARISON, storedComparisonIds } from '../lib/comparison';
const event = 'executive-dining:comparison';
let fallback = '[]', memoryOnly = false, storageWarning = '';
function snapshot() {
  if (memoryOnly) return fallback;
  try { return localStorage.getItem(COMPARISON_KEY) ?? fallback; } catch { return fallback; }
}
function subscribe(listener: () => void) {
  window.addEventListener('storage', listener); window.addEventListener(event, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(event, listener); };
}
function write(ids: string[]) {
  fallback = JSON.stringify(ids);
  try { localStorage.setItem(COMPARISON_KEY, fallback); memoryOnly = false; storageWarning = ''; }
  catch { memoryOnly = true; storageWarning = '比較候補の変更を保存できませんでした。再読み込みで選択が失われる場合があります。'; }
  window.dispatchEvent(new Event(event));
}
export function useComparison() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const ids = useMemo(() => storedComparisonIds(raw), [raw]);
  const toggle = (id: string) => {
    if (!storedComparisonIds(JSON.stringify([id])).length) return;
    const current = storedComparisonIds(snapshot());
    if (current.includes(id)) write(current.filter(value => value !== id));
    else if (current.length < MAX_COMPARISON) write([...current, id]);
  };
  return { ids, toggle, clear: () => write([]), storageWarning };
}

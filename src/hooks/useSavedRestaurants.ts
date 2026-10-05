import { useSyncExternalStore } from "react";
const KEY = "executive-dining:saved:v1";
const EVENT = "executive-dining:saved";
let fallback = "[]";
let storageWarning = "";
let memoryOnly = false;
function snapshot() {
  if (memoryOnly) return fallback;
  try {
    return localStorage.getItem(KEY) ?? fallback;
  } catch {
    return fallback;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}
export function parseSavedIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
export function useSavedRestaurants() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const savedIds = parseSavedIds(raw);
  function toggleSaved(id: string) {
    const current = parseSavedIds(snapshot());
    fallback = JSON.stringify(
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
    try {
      localStorage.setItem(KEY, fallback);
      storageWarning = "";
      memoryOnly = false;
    } catch {
      memoryOnly = true;
      storageWarning =
        "ブラウザの保存領域が使えないため、候補は再読み込みで消える場合があります。";
    }
    window.dispatchEvent(new Event(EVENT));
  }
  return { savedIds, toggleSaved, storageWarning };
}

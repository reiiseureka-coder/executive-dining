import { useEffect, useState } from 'react';
type DraftState<T> = { value: T; dirty: boolean; message: string; error: string; savedRaw: string | null };
// In-memory navigation recovery only. Persistence requires the user's explicit Save action.
const sessionDrafts = new Map<string, unknown>();
export function useLocalDraft<T>(key: string, empty: () => T, decode: (value: unknown) => T | null) {
  const [state, setState] = useState<DraftState<T>>(() => {
    const memory = sessionDrafts.get(key) as DraftState<T> | undefined;
    if (memory) return memory;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
      const restored = raw ? decode(JSON.parse(raw)) : null;
      return { value: restored ?? empty(), dirty: false, savedRaw: raw, message: restored ? 'このブラウザの保存済み下書きを読み込みました。' : '', error: raw && !restored ? '保存済み下書きの形式を確認できません。元の保存内容は変更していません。' : '' };
    } catch { return { value: empty(), dirty: false, savedRaw: raw, message: '', error: '保存済み下書きを読み込めませんでした。元の保存内容は変更していません。保存設定をご確認ください。' }; }
  });
  const replace = (next: DraftState<T>) => { sessionDrafts.set(key, next); setState(next); };
  useEffect(() => {
    if (!state.dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.dirty]);
  const update = (value: T) => replace({ ...state, value, dirty: true, message: '', error: '' });
  const save = () => {
    try {
      if (localStorage.getItem(key) !== state.savedRaw) throw new Error('conflict');
      const clean = decode(state.value);
      if (!clean) throw new Error('invalid');
      const raw = JSON.stringify(clean);
      localStorage.setItem(key, raw);
      replace({ ...state, savedRaw: raw, dirty: false, error: '', message: 'このブラウザに下書きを保存しました。送信・受付・公開はされていません。' });
    } catch { replace({ ...state, message: '', error: '保存できませんでした。保存設定・空き容量、または別タブでの変更を確認してください。入力内容はこの画面に残っています。' }); }
  };
  const clear = () => {
    try {
      if (localStorage.getItem(key) !== state.savedRaw) throw new Error('conflict');
      localStorage.removeItem(key);
      replace({ value: empty(), savedRaw: null, dirty: false, error: '', message: 'このブラウザの下書きを削除しました。' });
    } catch { replace({ ...state, message: '', error: '削除できませんでした。保存設定、または別タブでの変更を確認してください。' }); }
  };
  return { ...state, update, save, clear };
}

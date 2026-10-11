export type MapFailure = 'webgl' | 'worker' | 'network' | 'unknown';
/** Return only a safe category; do not show raw request URLs or provider payloads. */
export function classifyMapFailure(error: unknown): MapFailure {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/webgl|gpu|rendering context/i.test(message)) return 'webgl';
  if (/worker|content security|csp/i.test(message)) return 'worker';
  if (/fetch|network|ajax|http|load|request/i.test(message)) return 'network';
  return 'unknown';
}
export const MAP_FAILURE_LABELS: Record<MapFailure, string> = {
  webgl: 'このブラウザ環境ではWebGL2の地図描画を初期化できませんでした。',
  worker: 'このブラウザ環境では地図描画用の処理を開始できませんでした。',
  network: '背景地図の配信元から必要なデータを取得できませんでした。',
  unknown: '地図の初期化または読み込み中に問題が発生しました。',
};

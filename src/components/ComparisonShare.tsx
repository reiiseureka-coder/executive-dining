import { useState } from 'react';
import { buildComparisonUrl } from '../lib/comparison';
export default function ComparisonShare({ ids }: { ids: string[] }) {
  const [message, setMessage] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [copying, setCopying] = useState(false);
  const share = async () => {
    setMessage(''); setManualUrl('');
    let url = ''; setCopying(true);
    try {
      url = buildComparisonUrl(window.location.href, ids);
      await navigator.clipboard.writeText(url);
      setMessage('比較リンクをコピーしました。');
    } catch {
      setManualUrl(url); setMessage(url ? '自動コピーできませんでした。下のリンクを選択してコピーしてください。' : '比較リンクを作れませんでした。候補を選び直してください。');
    } finally { setCopying(false); }
  };
  return <div className="comparison-share"><button className="button-secondary" disabled={copying} onClick={() => void share()}>比較リンクをコピー</button><p className="catalog-filter-note">共有先では公開中の店舗情報だけを表示します。会社名・会食日時・相手名はリンクに含めません。</p>{message && <p role="status">{message}</p>}{manualUrl && <input aria-label="手動コピー用の比較リンク" readOnly value={manualUrl} onFocus={event => event.target.select()} />}</div>;
}

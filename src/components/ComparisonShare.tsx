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
      setManualUrl(url); setMessage(url ? 'リンクをコピーできませんでした。下の欄から選択してコピーしてください。' : '比較リンクを作れませんでした。候補を選び直してください。');
    } finally { setCopying(false); }
  };
  return <div className="comparison-share"><button className="button-secondary" disabled={copying} onClick={() => void share()}>比較リンクをコピー</button><p className="catalog-filter-note">リンクを開くと、その時点で公開中の店舗情報が表示されます。会社名・会食日時・相手の名前はリンクに含まれません。</p>{message && <p role="status">{message}</p>}{manualUrl && <input aria-label="手動コピー用の比較リンク" readOnly value={manualUrl} onFocus={event => event.target.select()} />}</div>;
}

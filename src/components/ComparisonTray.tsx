import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { useComparison } from '../hooks/useComparison';
export default function ComparisonTray({ onNavigate }: { onNavigate: (page: Page, id?: string, params?: SearchParams) => void }) {
  const { ids, clear, storageWarning } = useComparison();
  if (!ids.length && !storageWarning) return null;
  return <aside className="comparison-tray" aria-label="比較する候補"><div><strong>{ids.length} / 3店を選択</strong><p>公式情報や料金の条件を比較できます</p>{storageWarning && <p role="status">{storageWarning}</p>}</div><button className="primary-button" disabled={ids.length < 2} onClick={() => onNavigate('compare', undefined, { ids: ids.join(',') })}>選んだお店を比較</button><button className="catalog-reset" onClick={clear}>選択を解除</button></aside>;
}

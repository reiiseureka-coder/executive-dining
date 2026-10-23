import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { useComparison } from '../hooks/useComparison';
export default function ComparisonTray({ onNavigate, params = {} }: { onNavigate: (page: Page, id?: string, params?: SearchParams) => void; params?: SearchParams }) {
  const { ids, clear, storageWarning } = useComparison();
  // Keep a failed-storage notice visible without showing an empty comparison tray.
  if (!ids.length) return storageWarning ? <p className="comparison-storage-warning" role="status">{storageWarning}</p> : null;
  return <aside className="comparison-tray" aria-label="比較する候補"><div><strong>{ids.length === 1 ? '比較候補1店' : `比較候補${ids.length}店`}</strong><p>{ids.length === 1 ? 'あと1店選ぶと比較できます（最大3店）' : '料金・個室の条件を見比べられます（最大3店）'}</p>{storageWarning && <p role="status">{storageWarning}</p>}</div><button className="primary-button" disabled={ids.length < 2} onClick={() => onNavigate('compare', undefined, { ...params, ids: ids.join(','), returnTo: undefined })}>{ids.length < 2 ? '候補を比較' : `${ids.length}店を比較`}</button><button className="catalog-reset" onClick={clear}>選択を解除</button></aside>;
}

import { lazy, Suspense, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowUpRight, Bookmark } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { useSavedCatalog } from '../hooks/useSavedCatalog';
import { factValue, safeExternalUrl, verifiedCoordinates } from '../domain/dining';
import { VerifiedEvidence, VerifiedFactList, VerifiedReviews } from '../components/VerifiedFacts';
const RestaurantMap = lazy(() => import('../components/map/RestaurantMap'));
interface Props { restaurantId: string; params: SearchParams; onNavigate: (page: Page, id?: string, params?: SearchParams) => void }
export default function NagoyaDetail({ restaurantId, params, onNavigate }: Props) {
  const { rows, loading, error, reload } = usePublicCatalog();
  const { savedIds, toggleSaved, storageWarning } = useSavedCatalog();
  const restaurant = rows.find(row => row.id === restaurantId);
  const mapRows = useMemo(() => restaurant ? [restaurant] : [], [restaurant]);
  const select = useCallback(() => document.getElementById('verified-detail-title')?.focus(), []);
  const back = () => onNavigate('nagoya', undefined, params);
  if (loading) return <div className="page-width catalog-page"><p role="status">掲載情報を確認しています…</p></div>;
  if (error) return <div className="page-width catalog-page catalog-empty" role="alert"><h1>掲載情報を取得できません</h1><p>{error}</p><button className="button-secondary" onClick={() => void reload()}>再読み込み</button><button className="button-secondary" onClick={back}>一覧へ戻る</button></div>;
  if (!restaurant) return <div className="page-width catalog-page catalog-empty"><h1>この店舗の公開情報は見つかりません</h1><p>未公開・掲載取り下げ・URLの変更などにより、現在は表示できません。</p><button className="button-secondary" onClick={back}>一覧へ戻る</button></div>;
  const website = safeExternalUrl(factValue(restaurant, 'website') ?? '');
  const saved = savedIds.includes(restaurant.id);
  return <div className="page-width catalog-page catalog-detail">
    <button className="catalog-back" onClick={back}><ArrowLeft size={16} />検索条件を保って一覧へ</button>
    <article className="verified-card"><div className="verified-card-heading"><div><p className="eyebrow">NAGOYA / VERIFIED FACTS</p><h1 id="verified-detail-title" tabIndex={-1}>{restaurant.name}</h1><p>{restaurant.address}</p><p>掲載判断の確認日：{new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(restaurant.verifiedAt))}</p></div><button className="button-secondary" onClick={() => toggleSaved(restaurant.id)} aria-pressed={saved} aria-label={`${saved ? '候補から外す' : '候補に保存'}：${restaurant.name}`}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? '保存済み' : '候補に保存'}</button></div>
      {storageWarning && <p role="status" className="sample-notice">{storageWarning}</p>}
      <VerifiedFactList restaurant={restaurant} />
      <p className="catalog-filter-note">料金は掲載コースとその条件です。平均利用額・空席・防音性を保証するものではありません。予約前に最新情報をお店へご確認ください。</p>
      {website && <a className="button-secondary detail-official" href={website} target="_blank" rel="noreferrer">公式サイトで最新情報を確認 <ArrowUpRight size={15} /></a>}
      <VerifiedEvidence restaurant={restaurant} /><VerifiedReviews restaurant={restaurant} />
    </article>
    {verifiedCoordinates(restaurant) ? <><p className="map-privacy">背景地図を外部の地図配信元から読み込みます。端末の現在地は取得しません。</p><Suspense fallback={<p role="status">地図を準備しています…</p>}><RestaurantMap restaurants={mapRows} onSelect={select} /></Suspense></> : <div className="catalog-explainer">正確な地図位置は確認中です。住所から推測したピンは表示していません。</div>}
  </div>;
}

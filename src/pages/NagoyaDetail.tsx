import { lazy, Suspense, useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowUpRight, Bookmark } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { useComparison } from '../hooks/useComparison';
import { parseComparisonIds } from '../lib/comparison';
import ComparisonTray from '../components/ComparisonTray';
import ReviewDraftPanel from '../components/ReviewDraftPanel';
import FeedbackDraftPanel from '../components/FeedbackDraftPanel';
import { useSavedCatalog } from '../hooks/useSavedCatalog';
import { FACT_LABELS, factValue, safeExternalUrl, verifiedCoordinates, type FactField, type VerifiedRestaurant } from '../domain/dining';
import { VerifiedEvidence, VerifiedReviews } from '../components/VerifiedFacts';
const checked = (value: string) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(value));
function DetailFactRows({ restaurant, fields }: { restaurant: VerifiedRestaurant; fields: FactField[] }) {
  return <dl className="verified-facts detail-facts">{fields.map(field => <div key={field}><dt>{FACT_LABELS[field]}</dt><dd>{factValue(restaurant, field) ?? '未確認'}</dd></div>)}</dl>;
}
const RestaurantMap = lazy(() => import('../components/map/RestaurantMap'));
interface Props { restaurantId: string; params: SearchParams; onNavigate: (page: Page, id?: string, params?: SearchParams) => void }
export default function NagoyaDetail({ restaurantId, params, onNavigate }: Props) {
  const { rows, loading, error, reload } = usePublicCatalog();
  const { savedIds, toggleSaved, storageWarning } = useSavedCatalog();
  const comparison = useComparison();
  const restaurant = rows.find(row => row.id === restaurantId);
  const mapRows = useMemo(() => restaurant ? [restaurant] : [], [restaurant]);
  const select = useCallback(() => document.getElementById('verified-detail-title')?.focus(), []);
  const returnToComparison = params.returnTo === 'compare' && parseComparisonIds(params.ids).length > 0;
  const back = () => {
    if (returnToComparison) { const comparisonParams = { ...params }; delete comparisonParams.returnTo; onNavigate('compare', undefined, comparisonParams); }
    else { const search = { ...params }; delete search.ids; delete search.returnTo; onNavigate('nagoya', undefined, search); }
  };
  if (loading) return <div className="page-width catalog-page"><p role="status">店舗情報を読み込んでいます…</p></div>;
  if (error) return <div className="page-width catalog-page catalog-empty" role="alert"><h1>店舗情報を読み込めませんでした</h1><p>{error}</p><button className="button-secondary" onClick={() => void reload()}>再読み込み</button><button className="button-secondary" onClick={back}>一覧へ戻る</button></div>;
  if (!restaurant) return <div className="page-width catalog-page catalog-empty"><h1>この店舗の情報は現在表示できません</h1><p>未公開、掲載の取り下げ、URLの変更などが考えられます。</p><button className="button-secondary" onClick={back}>一覧へ戻る</button></div>;
  const website = safeExternalUrl(factValue(restaurant, 'website') ?? '');
  const saved = savedIds.includes(restaurant.id);
  return <div className="page-width catalog-page catalog-detail">
    <ComparisonTray onNavigate={onNavigate} params={params} />
    <article className="verified-card dining-detail">
      <div className="detail-navigation">
        <button className="catalog-back" onClick={back}><ArrowLeft size={16} />{returnToComparison ? '比較に戻る' : '検索結果に戻る'}</button>
        <button className="catalog-reset" disabled={comparison.ids.length >= 3 && !comparison.ids.includes(restaurant.id)} aria-pressed={comparison.ids.includes(restaurant.id)} aria-label={`${comparison.ids.includes(restaurant.id) ? '比較から外す' : '比較に追加'}：${restaurant.name}`} onClick={() => comparison.toggle(restaurant.id)}>{comparison.ids.includes(restaurant.id) ? '比較から外す' : '比較に追加'}</button>
      </div>
      <header className="detail-identity">
        <h1 id="verified-detail-title" tabIndex={-1}>{restaurant.name}</h1>
        <p className="detail-genre">料理：{factValue(restaurant, 'genre') ?? '未確認'}</p>
        <p className="detail-address">{restaurant.address}</p>
      </header>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-decision" aria-label="料金と個室の条件"><DetailFactRows restaurant={restaurant} fields={['price', 'private_room']} /></section>
          <div className="detail-confirmation">
            <p>料金はコース・単品・目安など、種類と利用条件を添えて掲載しています。空席・防音性は保証していません。予約前に最新情報をお店へご確認ください。</p>
            <div className="detail-actions">
              {website && <a className="primary-button detail-official" href={website} target="_blank" rel="noreferrer">公式サイトで最新情報を確認 <ArrowUpRight size={16} /></a>}
              <button className="catalog-reset detail-save" onClick={() => toggleSaved(restaurant.id)} aria-pressed={saved} aria-label={`${saved ? '候補から外す' : '候補に保存'}：${restaurant.name}`}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? '保存済み' : '候補に保存'}</button>
            </div>
            {storageWarning && <p role="status" className="sample-notice">{storageWarning}</p>}
          </div>
          {factValue(restaurant, 'notice') && <section className="operating-notice"><h2>営業のお知らせ</h2><p>{factValue(restaurant, 'notice')}</p><p className="notice-checked">確認日 {checked(restaurant.facts.find(fact => fact.field === 'notice')!.verifiedAt)}</p></section>}
          <section className="detail-basic"><h2>店舗の基本情報</h2><DetailFactRows restaurant={restaurant} fields={['hours', 'access']} /></section>
        </div>
        <aside className="detail-provenance" aria-label="掲載情報の確認記録">
          <p className="detail-checked">掲載の確認日：{checked(restaurant.verifiedAt)}</p>
          <VerifiedEvidence restaurant={restaurant} />
          <p>公式情報を確認した記録です。実際に訪問してつけた評価ではありません。</p>
        </aside>
      </div>
      <div className="detail-community"><FeedbackDraftPanel key={`correction:${restaurant.id}`} restaurantId={restaurant.id} /><VerifiedReviews restaurant={restaurant} allowReportDraft /><ReviewDraftPanel key={`review:${restaurant.id}`} restaurantId={restaurant.id} /></div>
    </article>
    {verifiedCoordinates(restaurant) ? <><p className="map-privacy">地図データを外部の地図配信元から読み込みます。端末の現在地は取得しません。</p><Suspense fallback={<p role="status">地図を準備しています…</p>}><RestaurantMap restaurants={mapRows} onSelect={select} /></Suspense></> : <div className="catalog-explainer">お店の位置を確認できていないため、地図のピンは表示していません。</div>}
  </div>;
}

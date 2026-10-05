import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, MapPin, Search } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { catalogGenres, filterCatalog } from '../lib/catalogSearch';
import { configuredMapProvider } from '../components/map/mapProvider';
import { factValue, safeExternalUrl, verifiedCoordinates } from '../domain/dining';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { useComparison } from '../hooks/useComparison';
import ComparisonTray from '../components/ComparisonTray';
import { useSavedCatalog } from '../hooks/useSavedCatalog';
import { VerifiedEvidence, VerifiedFactList, VerifiedReviews } from '../components/VerifiedFacts';
const RestaurantMap = lazy(() => import('../components/map/RestaurantMap'));
const date = (value: string) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(value));
interface Props { params: SearchParams; onChange: (params: SearchParams) => void; onNavigate: (page: Page, id?: string, params?: SearchParams) => void }
export default function Nagoya({ params, onChange, onNavigate }: Props) {
  const { rows, loading, error, reload } = usePublicCatalog();
  const { savedIds, toggleSaved, storageWarning } = useSavedCatalog();
  const comparison = useComparison();
  const [selected, setSelected] = useState('');
  const genres = useMemo(() => catalogGenres(rows), [rows]);
  const filtered = useMemo(() => filterCatalog(rows, params, savedIds), [rows, params, savedIds]);
  const showMap = params.view === 'map';
  const update = (key: keyof SearchParams, value: string) => onChange({ ...params, [key]: value });
  const select = useCallback((id: string) => {
    setSelected(id);
    const element = document.getElementById(`verified-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' }); element?.focus({ preventScroll: true });
  }, []);
  return <div className="page-width catalog-page">
    <div className="catalog-heading"><div><p className="eyebrow">NAGOYA / VERIFIED FACTS</p><h1>名古屋の会食、<br />確かめた情報から。</h1></div><p>公式情報を項目ごとに確認して掲載します。<br />個室・料金・営業状況の最終確認は、予約前にお店へ。</p></div>
    <div className="catalog-explainer"><MapPin size={19} aria-hidden="true" /><p>公式のコース価格と条件をそのまま掲載します。平均予算・空席・防音性は推測しません。口コミは、本人の投稿を審査する仕組みを準備中です。</p></div>
    <div className="catalog-toolbar"><label className="catalog-search"><Search size={18} aria-hidden="true" /><input aria-label="名古屋の確認済み店舗を検索" placeholder="店名・エリア・個室など（複数語）" value={params.query ?? ''} onChange={event => update('query', event.target.value)} /></label><button className="button-secondary" onClick={() => update('view', showMap ? '' : 'map')} aria-pressed={showMap}>{showMap ? '地図を閉じる' : '地図を表示'}</button></div>
    <div className="catalog-filters">
      <label>料理<select aria-label="料理" value={params.genre ?? ''} onChange={event => update('genre', event.target.value)}><option value="">すべての料理</option>{genres.map(genre => <option key={genre}>{genre}</option>)}</select></label>
      <label>確認できる情報<select aria-label="確認できる情報" value={params.information ?? ''} onChange={event => update('information', event.target.value)}><option value="">指定しない</option><option value="private_room">個室情報あり</option><option value="price">料金情報あり</option><option value="hours">営業時間情報あり</option><option value="notice">営業のお知らせあり</option><option value="coordinates">地図位置確認済み</option></select></label>
      <label>並び順<select aria-label="並び順" value={params.sort ?? 'name'} onChange={event => update('sort', event.target.value)}><option value="name">店名順</option><option value="recent">確認日が新しい順</option></select></label>
      <label className="catalog-saved-filter"><input type="checkbox" checked={params.saved === '1'} onChange={event => update('saved', event.target.checked ? '1' : '')} />保存した候補のみ</label>
      <button className="catalog-reset" onClick={() => onChange({})}>条件をリセット</button>
    </div>
    <p className="catalog-filter-note">「情報あり」は確認記録の有無です。個室の有無・利用条件は本文でご確認ください。</p>
    <div className="catalog-result-heading"><p className="catalog-count" aria-live="polite">{loading ? '掲載情報を確認しています…' : `確認済み掲載 ${filtered.length}件`}</p><button className="catalog-reset" disabled={loading} onClick={() => void reload()}>最新情報を取得</button></div>
    {params.saved === '1' && <p className="catalog-filter-note">保存した候補のうち、公開中の情報を表示します。保存はこのブラウザ内のみです。</p>}
    {storageWarning && <p className="sample-notice" role="status">{storageWarning}</p>}
    {showMap && <><p className="map-privacy">地図表示時は、背景地図の取得のため{configuredMapProvider(import.meta.env.VITE_MAP_STYLE_URL).name}へ接続します。端末の現在地は取得しません。</p><Suspense fallback={<p role="status">地図を準備しています…</p>}><RestaurantMap restaurants={filtered} onSelect={select} /></Suspense></>}
    {error && <div className="catalog-empty" role="alert"><h2>掲載情報を取得できません</h2><p>{error}</p><button className="button-secondary" onClick={() => void reload()}>再読み込み</button></div>}
    {!loading && !error && !filtered.length && <div className="catalog-empty"><p className="eyebrow">{rows.length ? 'NO RESULTS' : 'UNDER REVIEW'}</p><h2>{rows.length ? '条件に合うお店がありません' : '名古屋の掲載情報を準備しています'}</h2><p>{rows.length ? '別の店名や条件で検索してください。保存した候補も、公開が取り下げられた場合は表示されません。' : '候補を公式情報で確認しています。掲載承認と公開設定が完了したお店から、ここに表示します。'}</p>{rows.length ? <button className="button-secondary" onClick={() => onChange({})}>条件をリセット</button> : <a href="#/search">サンプルで検索画面を見る <ArrowUpRight size={15} /></a>}</div>}
    <div className="verified-list">{filtered.map(restaurant => {
      const website = safeExternalUrl(factValue(restaurant, 'website') ?? '');
      const saved = savedIds.includes(restaurant.id);
      return <article className={`verified-card${selected === restaurant.id ? ' is-selected' : ''}`} key={restaurant.id} id={`verified-${restaurant.id}`} tabIndex={-1}>
        <div className="verified-card-heading"><div><p className="eyebrow">公式情報確認 · {date(restaurant.verifiedAt)}</p><h2><button className="verified-title" onClick={() => onNavigate('nagoya-detail', restaurant.id, params)}>{restaurant.name}</button></h2><p>{restaurant.address}</p></div><button className="button-secondary" onClick={() => toggleSaved(restaurant.id)} aria-pressed={saved} aria-label={`${saved ? '候補から外す' : '候補に保存'}：${restaurant.name}`}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? '保存済み' : '候補に保存'}</button></div>
        <VerifiedFactList restaurant={restaurant} compact />
        <div className="verified-card-actions"><button className="button-secondary" onClick={() => onNavigate('nagoya-detail', restaurant.id, params)}>詳細と確認情報を見る</button>{website && <a href={website} target="_blank" rel="noreferrer">公式サイト <ArrowUpRight size={15} /></a>}<button className="button-secondary" disabled={comparison.ids.length >= 3 && !comparison.ids.includes(restaurant.id)} aria-pressed={comparison.ids.includes(restaurant.id)} aria-label={`${comparison.ids.includes(restaurant.id) ? '比較から外す' : '比較に追加'}：${restaurant.name}`} onClick={() => comparison.toggle(restaurant.id)}>{comparison.ids.includes(restaurant.id) ? '比較から外す' : '比較に追加'}</button><span>{verifiedCoordinates(restaurant) ? '地図位置確認済み' : '地図位置は確認中'}</span></div>
        <VerifiedEvidence restaurant={restaurant} /><VerifiedReviews restaurant={restaurant} />
      </article>;
    })}</div>
    <ComparisonTray onNavigate={onNavigate} />
  </div>;
}

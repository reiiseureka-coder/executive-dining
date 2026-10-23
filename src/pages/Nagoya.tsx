import CatalogSummary from '../components/CatalogSummary';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, Search, SlidersHorizontal } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { catalogGenres, filterCatalog } from '../lib/catalogSearch';
import { configuredMapProvider } from '../components/map/mapProvider';
import { factValue, safeExternalUrl } from '../domain/dining';
import { useAuth } from '../contexts/auth';
import { openLoginDialog } from '../lib/loginDialog';
import { supabase, emailSignInEnabled, googleSignInEnabled } from '../lib/supabase';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { useComparison } from '../hooks/useComparison';
import ComparisonTray from '../components/ComparisonTray';
import { useSavedCatalog } from '../hooks/useSavedCatalog';
import { VerifiedEvidence } from '../components/VerifiedFacts';
const RestaurantMap = lazy(() => import('../components/map/RestaurantMap'));
const date = (value: string) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(value));
interface Props { params: SearchParams; onChange: (params: SearchParams) => void; onNavigate: (page: Page, id?: string, params?: SearchParams) => void }
export default function Nagoya({ params, onChange, onNavigate }: Props) {
  const { user } = useAuth();
  const loginAvailable = Boolean(supabase && (emailSignInEnabled || googleSignInEnabled));
  const { rows, loading, error, reload } = usePublicCatalog();
  const { savedIds, toggleSaved, storageWarning } = useSavedCatalog();
  const comparison = useComparison();
  const [selected, setSelected] = useState('');
  const genres = useMemo(() => catalogGenres(rows), [rows]);
  const filtered = useMemo(() => filterCatalog(rows, params, savedIds), [rows, params, savedIds]);
  const activeFilters = [params.genre, params.information, params.saved].filter(Boolean).length;
  const showMap = params.view === 'map';
  const update = (key: keyof SearchParams, value: string) => onChange({ ...params, [key]: value });
  const select = useCallback((id: string) => {
    setSelected(id);
    const element = document.getElementById(`verified-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' }); element?.focus({ preventScroll: true });
  }, []);
  return <div className="page-width catalog-page editorial-catalog">
    <div className="catalog-heading"><div><p className="eyebrow">NAGOYA</p><h1>名古屋の会食店を探す</h1></div><p>個室・料金などの確認記録から、候補を探せます。</p></div>
    <div className="catalog-toolbar"><label className="catalog-search"><Search size={18} aria-hidden="true" /><input aria-label="名古屋の確認済み店舗を検索" placeholder="店名・エリア・個室などで検索" value={params.query ?? ''} onChange={event => update('query', event.target.value)} /></label><button className="button-secondary" onClick={() => update('view', showMap ? '' : 'map')} aria-pressed={showMap}>{showMap ? '地図を閉じる' : '地図を表示'}</button></div>
    {(loading||rows.length>0)&&<><details className="catalog-filter-disclosure"><summary><SlidersHorizontal size={16} aria-hidden="true" />絞り込み・並び順{activeFilters > 0 && <span className="filter-count">{activeFilters}件の条件</span>}</summary><div className="catalog-filters">
      <label>料理<select aria-label="料理" value={params.genre ?? ''} onChange={event => update('genre', event.target.value)}><option value="">すべての料理</option>{genres.map(genre => <option key={genre}>{genre}</option>)}</select></label>
      <label>確認できる情報<select aria-label="確認できる情報" value={params.information ?? ''} onChange={event => update('information', event.target.value)}><option value="">指定しない</option><option value="private_room">個室情報あり</option><option value="price">料金情報あり</option><option value="hours">営業時間情報あり</option><option value="notice">営業のお知らせあり</option><option value="coordinates">地図位置確認済み</option></select></label>
      <label>並び順<select aria-label="並び順" value={params.sort ?? 'name'} onChange={event => update('sort', event.target.value)}><option value="name">店名順</option><option value="recent">確認日が新しい順</option></select></label>
      <label className="catalog-saved-filter"><input type="checkbox" checked={params.saved === '1'} onChange={event => update('saved', event.target.checked ? '1' : '')} />保存した候補のみ</label>
      <button className="catalog-reset" onClick={() => onChange({})}>条件をリセット</button>
    </div></details>
    <details className="catalog-search-guide"><summary>検索と掲載情報について</summary><p>キーワードは確認記録の本文を検索します。「個室」には「個室なし」の記録も含まれます。「情報あり」は記録の有無で、条件の確約ではありません。</p><p>料金はコース・単品・目安など、利用条件とともに記載します。最新の営業・空席は予約前にお店へご確認ください。</p></details></>}
    <div className="catalog-result-heading"><p className="catalog-count" aria-live="polite">{loading ? '店舗情報を読み込んでいます…' : error ? '店舗情報を確認できません' : `掲載中のお店 ${filtered.length}件`}</p><button className="catalog-reset" disabled={loading} onClick={() => void reload()}>最新情報に更新</button></div>
    {params.saved === '1' && <p className="catalog-filter-note">保存した候補のうち、公開中の情報を表示します。保存はこのブラウザ内のみです。</p>}
    {storageWarning && <p className="sample-notice" role="status">{storageWarning}</p>}
    {showMap && <><p className="map-privacy">地図を表示すると、地図データを読み込むため{configuredMapProvider(import.meta.env.VITE_MAP_STYLE_URL).name}へ接続します。端末の現在地は取得しません。</p><Suspense fallback={<p role="status">地図を準備しています…</p>}><RestaurantMap restaurants={filtered} onSelect={select} /></Suspense></>}
    {error && <div className="catalog-empty" role="alert"><h2>店舗情報を読み込めませんでした</h2><p>{error}</p><button className="button-secondary" onClick={() => void reload()}>再読み込み</button></div>}
    {!loading && !error && !filtered.length && <div className="catalog-empty"><p className="eyebrow">{rows.length ? 'NO RESULTS' : 'UNDER REVIEW'}</p><h2>{rows.length ? '条件に合うお店がありません' : '名古屋の掲載情報を準備しています'}</h2><p>{rows.length ? '検索する言葉や条件を変えてお試しください。保存したお店でも、掲載が取り下げられると表示されません。' : loginAvailable && !user ? '現在、店舗情報を確認しています。招待済みの方はログインしてご覧ください。' : '一般公開に向け、店舗の公式情報を確認しています。確認が済んだ情報から順次掲載します。'}</p>{rows.length ? <button className="button-secondary" onClick={() => onChange({})}>条件をリセット</button> : <div>{!user && loginAvailable ? <button className="primary-button" onClick={openLoginDialog}>招待済みの方はログイン</button> : <>{user && <p>このアカウントで閲覧できる情報は、掲載開始後に表示されます。</p>}<button className="button-secondary" onClick={() => onNavigate('home')}>ホームへ戻る</button></>}</div>}</div>}
    <div className="verified-list">{filtered.map(restaurant => {
      const website = safeExternalUrl(factValue(restaurant, 'website') ?? '');
      const saved = savedIds.includes(restaurant.id);
      return <article className={`verified-card${selected === restaurant.id ? ' is-selected' : ''}`} key={restaurant.id} id={`verified-${restaurant.id}`} tabIndex={-1}>
        <div className="verified-card-heading"><div><p className="eyebrow">{factValue(restaurant, 'genre') ?? '名古屋'}</p><h2><button className="verified-title" onClick={() => onNavigate('nagoya-detail', restaurant.id, params)}>{restaurant.name}</button></h2><p>{restaurant.address}</p></div><button className="button-secondary" onClick={() => toggleSaved(restaurant.id)} aria-pressed={saved} aria-label={`${saved ? '候補から外す' : '候補に保存'}：${restaurant.name}`}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? '保存済み' : '候補に保存'}</button></div>
        <CatalogSummary restaurant={restaurant} />
        <div className="verified-card-actions"><button className="button-secondary" onClick={() => onNavigate('nagoya-detail', restaurant.id, params)}>店舗の詳細を見る</button>{website && <a href={website} target="_blank" rel="noreferrer">公式サイト <ArrowUpRight size={15} /></a>}<button className="button-secondary" disabled={comparison.ids.length >= 3 && !comparison.ids.includes(restaurant.id)} aria-pressed={comparison.ids.includes(restaurant.id)} aria-label={`${comparison.ids.includes(restaurant.id) ? '比較から外す' : '比較に追加'}：${restaurant.name}`} onClick={() => comparison.toggle(restaurant.id)}>{comparison.ids.includes(restaurant.id) ? '比較から外す' : '比較に追加'}</button></div>
        <div className="catalog-row-footnote"><span>公式情報の確認日 · {date(restaurant.verifiedAt)}</span><VerifiedEvidence restaurant={restaurant} /></div>
      </article>;
    })}</div>
    <ComparisonTray onNavigate={onNavigate} />
  </div>;
}

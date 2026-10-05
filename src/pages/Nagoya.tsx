import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, MapPin, Search } from 'lucide-react';
import { diningRepository } from '../data/diningClient';
import { configuredMapProvider } from '../components/map/mapProvider';
import { FACT_LABELS, factValue, safeExternalUrl, searchVerifiedRestaurants, type VerifiedRestaurant } from '../domain/dining';
const RestaurantMap = lazy(() => import('../components/map/RestaurantMap'));
const date = (value: string) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(value));
export default function Nagoya() {
  const [rows, setRows] = useState<VerifiedRestaurant[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(diningRepository));
  const [showMap, setShowMap] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!diningRepository) return;
    const controller = new AbortController();
    diningRepository.listPublished(controller.signal).then(data => { if (!controller.signal.aborted) setRows(data); }).catch(() => {
      if (!controller.signal.aborted) setError('掲載情報を読み込めませんでした。時間をおいて再度お試しください。');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  const filtered = useMemo(() => searchVerifiedRestaurants(rows, query), [rows, query]);
  const select = useCallback((id: string) => {
    const element = document.getElementById(`verified-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element?.focus({ preventScroll: true });
  }, []);
  return <div className="page-width catalog-page">
    <div className="catalog-heading"><div><p className="eyebrow">NAGOYA / VERIFIED FACTS</p><h1>名古屋の会食、<br />確かめた情報から。</h1></div><p>公式情報を項目ごとに確認して掲載します。<br />個室・料金・営業状況の最終確認は、予約前にお店へ。</p></div>
    <div className="catalog-explainer"><MapPin size={19} aria-hidden="true" /><p>取得候補は審査後に掲載します。写真や星の評価を補って表示することはありません。口コミは、本人の投稿を審査する仕組みを準備中です。</p></div>
    <div className="catalog-toolbar"><label className="catalog-search"><Search size={18} aria-hidden="true" /><input aria-label="名古屋の確認済み店舗を検索" placeholder="店名・エリア・個室など" value={query} onChange={event => setQuery(event.target.value)} /></label><button className="button-secondary" onClick={() => setShowMap(value => !value)} aria-pressed={showMap}>{showMap ? '地図を閉じる' : '地図を表示'}</button></div>
    <p className="catalog-count" aria-live="polite">{loading ? '掲載情報を確認しています…' : `確認済み掲載 ${filtered.length}件`}</p>
    {showMap && <><p className="map-privacy">地図表示時は、背景地図の取得のため{configuredMapProvider(import.meta.env.VITE_MAP_STYLE_URL).name}へ接続します。端末の現在地は取得しません。</p><Suspense fallback={<p role="status">地図を準備しています…</p>}><RestaurantMap restaurants={filtered} onSelect={select} /></Suspense></>}
    {error && <div className="catalog-empty" role="alert"><h2>掲載情報を取得できません</h2><p>{error}</p><button className="button-secondary" onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1); }}>再読み込み</button></div>}
    {!loading && !error && !filtered.length && <div className="catalog-empty"><p className="eyebrow">{rows.length ? 'NO RESULTS' : 'UNDER REVIEW'}</p><h2>{rows.length ? '条件に合うお店がありません' : '名古屋の掲載情報を準備しています'}</h2><p>{rows.length ? '別の店名やエリアで検索してください。' : '候補の収集と公式情報の確認を進めています。掲載承認が終わったお店から、ここに表示します。'}</p><a href="#/search">サンプルで検索画面を見る <ArrowUpRight size={15} /></a></div>}
    <div className="verified-list">{filtered.map(restaurant => {
      const website = safeExternalUrl(factValue(restaurant, 'website') ?? '');
      return <article className="verified-card" key={restaurant.id} id={`verified-${restaurant.id}`} tabIndex={-1}>
        <div className="verified-card-heading"><div><p className="eyebrow">公式情報確認 · {date(restaurant.verifiedAt)}</p><h2>{restaurant.name}</h2><p>{restaurant.address}</p></div>{website && <a className="button-secondary" href={website} target="_blank" rel="noreferrer">公式サイト <ArrowUpRight size={15} /></a>}</div>
        <dl className="verified-facts">{(['genre', 'private_room', 'price', 'hours', 'access', 'notice'] as const).map(field => <div key={field}><dt>{FACT_LABELS[field]}</dt><dd>{factValue(restaurant, field) ?? '未確認'}</dd></div>)}</dl>
        <details className="fact-evidence"><summary>出典・確認日を見る</summary><ul>{restaurant.facts.filter(fact => safeExternalUrl(fact.sourceUrl)).map(fact => <li key={fact.field}><a href={safeExternalUrl(fact.sourceUrl)!} target="_blank" rel="noreferrer">{FACT_LABELS[fact.field]}の出典</a><span>取得 {date(fact.fetchedAt)} / 確認 {date(fact.verifiedAt)}{fact.licenses.length > 0 ? ` · ${fact.licenses.join(', ')}` : ''}</span>{fact.attributions.length > 0 && <small>{fact.attributions.join(' / ')}</small>}</li>)}</ul></details>
        <div className="verified-reviews"><h3>このサービスの口コミ</h3>{restaurant.reviews.length === 0 ? <p>公開された口コミはまだありません。</p> : restaurant.reviews.map(review => <div key={review.id}><p>{review.displayName} · {review.rating}/5 · {review.visitedMonth}来店</p><p>{review.comment}</p></div>)}</div>
      </article>;
    })}</div>
  </div>;
}

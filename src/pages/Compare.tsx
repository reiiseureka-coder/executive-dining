import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { FACT_LABELS, factValue, safeExternalUrl, type FactField } from '../domain/dining';
import { parseComparisonIds } from '../lib/comparison';
import ComparisonShare from '../components/ComparisonShare';
const fields: FactField[] = ['genre', 'private_room', 'price', 'hours', 'access', 'notice'];
export default function Compare({ params, onNavigate }: { params: SearchParams; onNavigate: (page: Page, id?: string, params?: SearchParams) => void }) {
  const { rows, loading, error, reload } = usePublicCatalog();
  const ids = parseComparisonIds(params.ids);
  const restaurants = ids.flatMap(id => rows.filter(row => row.id === id));
  const back = () => onNavigate('nagoya', undefined, {});
  return <div className="page-width catalog-page"><div className="catalog-heading"><div><p className="eyebrow">COMPARE / UP TO THREE PLACES</p><h1>候補のお店を比較する</h1></div></div>
    <p className="catalog-explainer">各店舗の公式情報をもとに、料金や個室の条件を比較できます。税・サービス料などの条件や、未確認の項目も表示しています。実際に訪問してつけた評価ではありません。</p>
    {loading ? <p role="status" className="catalog-count">店舗情報を読み込んでいます…</p> : error ? <div className="catalog-empty" role="alert"><p>{error}</p><button className="button-secondary" onClick={() => void reload()}>再読み込み</button></div> : !restaurants.length ? <div className="catalog-empty"><h2>比較できる公開情報がありません</h2><p>お店を1〜3件選んでください。未公開のお店や、掲載が取り下げられたお店は表示されません。</p><button className="button-secondary" onClick={back}>お店を探す</button></div> : <>
      <div className="catalog-result-heading"><p className="catalog-count">表示できる候補 {restaurants.length} / {ids.length}件</p><button className="catalog-reset" onClick={back}>一覧へ戻る</button></div>
      <p className="comparison-scroll-note">表は横にスクロールして確認できます。</p>
      <div className="comparison-table-scroll" tabIndex={0} role="region" aria-label="店舗の比較表"><table className="comparison-table"><thead><tr><th scope="col">確認項目</th>{restaurants.map(restaurant => <th scope="col" key={restaurant.id}><h2>{restaurant.name}</h2><p>{restaurant.address}</p><button className="catalog-reset" onClick={() => onNavigate('nagoya-detail', restaurant.id, { ids: ids.join(','), returnTo: 'compare' })}>店舗の詳細を見る</button></th>)}</tr></thead><tbody>{fields.map(field => <tr key={field}><th scope="row">{FACT_LABELS[field]}</th>{restaurants.map(restaurant => {
        const fact = restaurant.facts.find(item => item.field === field);
        return <td key={restaurant.id}><p>{fact?.value ?? '未確認'}</p>{fact && <small>確認 {new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(fact.verifiedAt))} · <a href={safeExternalUrl(fact.sourceUrl)!} target="_blank" rel="noreferrer">出典</a></small>}</td>;
      })}</tr>)}<tr><th scope="row">このサービスの口コミ</th>{restaurants.map(restaurant => <td key={restaurant.id}>{restaurant.reviews.length ? `公開 ${restaurant.reviews.length}件（詳細に掲載）` : 'まだ公開されていません'}</td>)}</tr><tr><th scope="row">公式サイト</th>{restaurants.map(restaurant => <td key={restaurant.id}><a href={safeExternalUrl(factValue(restaurant, 'website')!)!} target="_blank" rel="noreferrer">最新情報を確認</a></td>)}</tr></tbody></table></div>
      <ComparisonShare ids={ids} />
    </>}
  </div>;
}

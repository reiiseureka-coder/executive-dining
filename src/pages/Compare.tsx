import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { usePublicCatalog } from '../hooks/usePublicCatalog';
import { FACT_LABELS, factValue, safeExternalUrl, type FactField } from '../domain/dining';
import { parseComparisonIds } from '../lib/comparison';
import ComparisonShare from '../components/ComparisonShare';
const fields: FactField[] = ['price', 'private_room', 'genre', 'hours', 'access', 'notice'];
export default function Compare({ params, onNavigate }: { params: SearchParams; onNavigate: (page: Page, id?: string, params?: SearchParams) => void }) {
  const { rows, loading, error, reload } = usePublicCatalog();
  const ids = parseComparisonIds(params.ids);
  const restaurants = ids.flatMap(id => rows.filter(row => row.id === id));
  const back = () => { const search = { ...params }; delete search.ids; delete search.returnTo; onNavigate('nagoya', undefined, search); };
  return <div className="page-width catalog-page dining-comparison"><div className="catalog-heading"><h1>候補を比較</h1></div>
    <p className="catalog-explainer">公式情報をもとに、料金・個室などの条件を比較できます。税・サービス料や未確認の項目も、そのまま掲載しています。実際に訪問してつけた評価ではありません。</p>
    {loading ? <p role="status" className="catalog-count">店舗情報を読み込んでいます…</p> : error ? <div className="catalog-empty" role="alert"><p>{error}</p><button className="button-secondary" onClick={() => void reload()}>再読み込み</button></div> : !restaurants.length ? <div className="catalog-empty"><h2>比較できる公開情報がありません</h2><p>お店を1〜3件選んでください。未公開のお店や、掲載が取り下げられたお店は表示されません。</p><button className="button-secondary" onClick={back}>お店を探す</button></div> : <>
      <div className="catalog-result-heading"><p className="catalog-count">表示できる候補 {restaurants.length} / {ids.length}件</p><button className="catalog-reset" onClick={back}>一覧へ戻る</button></div>
      <p className="comparison-scroll-note">{restaurants.length === 1 ? 'あと1店選ぶと比較できます。' : '同じ項目で候補を見比べられます。'}未確認の条件は、予約前にお店へご確認ください。</p>
      <div className="comparison-table-scroll" tabIndex={0} role="region" aria-label="店舗の比較表">
        <table className="comparison-table comparison-by-condition" role="table">
          <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">確認項目</th>{restaurants.map(restaurant => <th scope="col" role="columnheader" key={restaurant.id} id={`comparison-name-${restaurant.id}`}><h2>{restaurant.name}</h2><p>{restaurant.address}</p><button className="catalog-reset" onClick={() => onNavigate('nagoya-detail', restaurant.id, { ...params, ids: ids.join(','), returnTo: 'compare' })}>店舗の詳細を見る</button></th>)}</tr></thead>
          <tbody role="rowgroup">
            {fields.map(field => <tr role="row" key={field}><th scope="row" role="rowheader" id={`comparison-field-${field}`}>{FACT_LABELS[field]}</th>{restaurants.map(restaurant => {
              const fact = restaurant.facts.find(item => item.field === field);
              return <td role="cell" key={restaurant.id} headers={`comparison-field-${field} comparison-name-${restaurant.id}`}><span className="comparison-restaurant-label" aria-hidden="true">{restaurant.name}</span><p>{fact?.value ?? '未確認'}</p>{fact && <small>確認 {new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(fact.verifiedAt))} · <a href={safeExternalUrl(fact.sourceUrl)!} target="_blank" rel="noreferrer">出典</a></small>}</td>;
            })}</tr>)}
            <tr role="row"><th scope="row" role="rowheader" id="comparison-field-reviews">このサービスの口コミ</th>{restaurants.map(restaurant => <td role="cell" key={restaurant.id} headers={`comparison-field-reviews comparison-name-${restaurant.id}`}><span className="comparison-restaurant-label" aria-hidden="true">{restaurant.name}</span><p>{restaurant.reviews.length ? `公開 ${restaurant.reviews.length}件（詳細に掲載）` : '公開口コミはまだありません'}</p></td>)}</tr>
            <tr role="row"><th scope="row" role="rowheader" id="comparison-field-website">公式サイト</th>{restaurants.map(restaurant => <td role="cell" key={restaurant.id} headers={`comparison-field-website comparison-name-${restaurant.id}`}><span className="comparison-restaurant-label" aria-hidden="true">{restaurant.name}</span><a href={safeExternalUrl(factValue(restaurant, 'website')!)!} target="_blank" rel="noreferrer">公式サイトで最新情報を確認</a></td>)}</tr>
          </tbody>
        </table>
      </div>
      <ComparisonShare ids={ids} />
    </>}
  </div>;
}

import { FACT_LABELS, factValue, safeExternalUrl, type FactField, type VerifiedRestaurant } from '../domain/dining';
const date = (value: string) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(value));
export function VerifiedFactList({ restaurant, compact = false }: { restaurant: VerifiedRestaurant; compact?: boolean }) {
  const fields: FactField[] = compact ? ['genre', 'private_room', 'price'] : ['genre', 'private_room', 'price', 'hours', 'access'];
  const notice = factValue(restaurant, 'notice');
  return <>{notice && <div className="operating-notice"><strong>営業のお知らせ</strong><p>{notice}</p></div>}<dl className="verified-facts">{fields.map(field => <div key={field}><dt>{FACT_LABELS[field]}</dt><dd>{factValue(restaurant, field) ?? '未確認'}</dd></div>)}</dl></>;
}
export function VerifiedEvidence({ restaurant }: { restaurant: VerifiedRestaurant }) {
  return <details className="fact-evidence"><summary>出典・確認日を見る</summary><ul>{restaurant.facts.filter(fact => safeExternalUrl(fact.sourceUrl)).map(fact => <li key={fact.field}><a href={safeExternalUrl(fact.sourceUrl)!} target="_blank" rel="noreferrer">{FACT_LABELS[fact.field]}の出典</a><span>取得 {date(fact.fetchedAt)} / 確認 {date(fact.verifiedAt)}{fact.licenses.length > 0 ? ` · ${fact.licenses.join(', ')}` : ''}</span>{fact.attributions.length > 0 && <small>{fact.attributions.join(' / ')}</small>}</li>)}</ul></details>;
}
export function VerifiedReviews({ restaurant }: { restaurant: VerifiedRestaurant }) {
  return <div className="verified-reviews"><h3>このサービスの口コミ</h3>{restaurant.reviews.length === 0 ? <p>公開された口コミはまだありません。</p> : restaurant.reviews.map(review => <div key={review.id}><p>{review.displayName} · {review.rating}/5 · {review.visitedMonth}来店</p><p>{review.comment}</p></div>)}</div>;
}

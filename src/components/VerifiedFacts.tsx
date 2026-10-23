import FeedbackDraftPanel from './FeedbackDraftPanel';
import '../styles/nagoya.css';
import { FACT_LABELS, factValue, safeExternalUrl, type FactField, type VerifiedRestaurant } from '../domain/dining';
const date = (value: string) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' }).format(new Date(value));
export function VerifiedFactList({ restaurant, compact = false, showNotice = true }: { restaurant: Pick<VerifiedRestaurant, 'facts'>; compact?: boolean; showNotice?: boolean }) {
  const fields: FactField[] = compact ? ['genre', 'private_room', 'price'] : ['genre', 'private_room', 'price', 'hours', 'access'];
  const notice = factValue(restaurant, 'notice');
  return <>{showNotice && notice && <div className="operating-notice"><strong>営業のお知らせ</strong><p>{notice}</p></div>}<dl className="verified-facts">{fields.map(field => <div key={field}><dt>{FACT_LABELS[field]}</dt><dd>{factValue(restaurant, field) ?? '未確認'}</dd></div>)}</dl></>;
}
export function VerifiedEvidence({ restaurant }: { restaurant: Pick<VerifiedRestaurant, 'facts'> }) {
  return <details className="fact-evidence"><summary>出典・確認日を見る</summary><ul>{restaurant.facts.filter(fact => safeExternalUrl(fact.sourceUrl)).map(fact => <li key={fact.field}><a href={safeExternalUrl(fact.sourceUrl)!} target="_blank" rel="noreferrer">{FACT_LABELS[fact.field]}の出典</a><span>取得 {date(fact.fetchedAt)} / 確認 {date(fact.verifiedAt)}{fact.licenses.length > 0 ? ` · ${fact.licenses.join(', ')}` : ''}</span>{fact.attributions.length > 0 && <small>{fact.attributions.join(' / ')}</small>}</li>)}</ul></details>;
}
export function VerifiedReviews({ restaurant, allowReportDraft = false, compact = false }: { restaurant: Pick<VerifiedRestaurant, 'id' | 'reviews'>; allowReportDraft?: boolean; compact?: boolean }) {
  const Heading = compact ? 'h3' : 'h2';
  const reviews = compact ? restaurant.reviews.slice(0, 1) : restaurant.reviews;
  return <section className={`verified-reviews review-section${compact ? ' review-section-compact' : ''}`} aria-label="会食の口コミ">
    <Heading className="review-heading">会食の口コミ <span className="review-count">{restaurant.reviews.length}件</span></Heading>
    {restaurant.reviews.length === 0 ? <p className="review-empty">公開された口コミはまだありません。</p> : reviews.map(review => <div className="published-review" key={review.id}>
      <p className={`draft-body review-comment${compact ? ' review-excerpt' : ''}`}>{review.comment}</p>
      <p className="review-meta">{review.displayName} · {review.rating}/5 · {review.visitedMonth}来店</p>
      {!compact && allowReportDraft && <FeedbackDraftPanel key={review.id} restaurantId={restaurant.id} reviewId={review.id} />}
    </div>)}
    {!compact && <p className="review-note">{restaurant.reviews.length ? '利用者の体験・感想を、店舗の公式情報とは分けて掲載しています。' : '口コミの投稿受付は準備中です。'}</p>}
  </section>;
}

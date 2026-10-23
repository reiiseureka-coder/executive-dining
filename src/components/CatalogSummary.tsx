import { factValue, type PublishedFact } from '../domain/dining';
import { VerifiedFactList } from './VerifiedFacts';
/** Keep the complete room statement visible; reveal longer pricing conditions on request. */
export default function CatalogSummary({ restaurant }: { restaurant: { facts: PublishedFact[] } }) {
  const notice = factValue(restaurant, 'notice');
  return <>
    {notice && <div className="operating-notice"><strong>営業のお知らせ</strong><p>{notice}</p></div>}
    <p className="catalog-room-summary"><strong>個室</strong><span>{factValue(restaurant, 'private_room') ?? '未確認'}</span></p>
    <details className="catalog-conditions"><summary>料金・利用条件を確認する<span aria-hidden="true">＋</span></summary><VerifiedFactList restaurant={restaurant} compact showNotice={false} /></details>
  </>;
}

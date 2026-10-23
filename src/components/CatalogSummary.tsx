import { factValue, type PublishedFact } from '../domain/dining';
import { VerifiedFactList } from './VerifiedFacts';
/** Preserve complete pricing conditions; reveal them only when a reader asks. */
export default function CatalogSummary({ restaurant }: { restaurant: { facts: PublishedFact[] } }) {
  const notice = factValue(restaurant, 'notice');
  return <>
    {notice && <div className="operating-notice"><strong>営業のお知らせ</strong><p>{notice}</p></div>}
    <details className="catalog-conditions"><summary>個室・料金を確認する<span aria-hidden="true">＋</span></summary><VerifiedFactList restaurant={restaurant} compact showNotice={false} /></details>
  </>;
}

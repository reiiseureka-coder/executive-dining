import { factValue, type PublishedFact } from '../domain/dining';
/** Decision facts remain complete and readable without opening each restaurant. */
export default function CatalogSummary({ restaurant }: { restaurant: { facts: PublishedFact[] } }) {
  const notice = factValue(restaurant, 'notice');
  return <div className="catalog-decision">
    {notice && <div className="operating-notice"><strong>営業のお知らせ</strong><p>{notice}</p></div>}
    <dl className="catalog-decision-facts">
      <div data-fact="price"><dt>掲載コース・料金</dt><dd>{factValue(restaurant, 'price') ?? '未確認'}</dd></div>
      <div data-fact="private_room"><dt>個室</dt><dd>{factValue(restaurant, 'private_room') ?? '未確認'}</dd></div>
    </dl>
  </div>;
}

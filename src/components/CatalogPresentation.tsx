import { Camera, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { factValue, safeExternalUrl, type EditorialRestaurant, type PublishedFact } from '../domain/dining';
import { VerifiedEvidence, VerifiedFactList } from './VerifiedFacts';

type DisplayRestaurant = { name: string; address: string; facts: PublishedFact[] };
/** No image URL is inferred from a website or a provider record. Photo rights need their own evidence. */
export function CatalogPhoto({ restaurant, detail = false }: { restaurant: Pick<DisplayRestaurant, 'facts'>; detail?: boolean }) {
  const website = safeExternalUrl(factValue(restaurant, 'website') ?? '');
  return <div className={`catalog-photo${detail ? ' catalog-photo-detail' : ''}`}>
    <div className="catalog-photo-label"><Camera size={24} strokeWidth={1.3} aria-hidden="true" /><span>写真未登録</span><small>掲載許可を確認した写真を準備しています</small></div>
    {website && <a href={website} target="_blank" rel="noreferrer">公式サイトでお店を見る <ArrowUpRight size={15} aria-hidden="true" /></a>}
  </div>;
}
export function CatalogPresentation({ restaurant, detail = false }: { restaurant: DisplayRestaurant; detail?: boolean }) {
  return <><CatalogPhoto restaurant={restaurant} detail={detail} /><div className="catalog-presentation-heading"><p className="eyebrow">{factValue(restaurant, 'genre') ?? '料理の情報は確認中'}</p><h2>{restaurant.name}</h2><p>{restaurant.address}</p></div><VerifiedFactList restaurant={restaurant} compact={!detail} />{detail && <><p className="catalog-filter-note">掲載コースと条件は確認時点の情報です。空席・防音性は未確認です。予約前に最新情報をお店へご確認ください。</p><VerifiedEvidence restaurant={restaurant} /></>}</>;
}
export default function EditorialPreview({ restaurant }: { restaurant: EditorialRestaurant }) {
  const [detail, setDetail] = useState(false);
  return <details className="editorial-preview"><summary>掲載前の表示をプレビュー</summary><p className="catalog-filter-note">この店舗の確認記録を使った表示見本です。プレビューを開いても、掲載承認・一般公開は行われません。</p><div className="curation-actions" role="group" aria-label="プレビューの表示形式"><button type="button" className="button-secondary" aria-pressed={!detail} onClick={() => setDetail(false)}>一覧カード</button><button type="button" className="button-secondary" aria-pressed={detail} onClick={() => setDetail(true)}>詳細ページ</button></div><section className="verified-card editorial-preview-surface" aria-label={`${restaurant.name}の${detail ? '詳細' : '一覧カード'}プレビュー`}><p className="eyebrow">PREVIEW / 一般公開前</p><CatalogPresentation restaurant={restaurant} detail={detail} /></section><p className="draft-privacy-note">写真の掲載には、権利者の許可・出典・利用条件の確認が必要です。公式サイトへのリンクは、写真の転載許可を意味しません。</p></details>;
}

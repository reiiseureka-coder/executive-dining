import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { factValue, safeExternalUrl, type EditorialRestaurant, type PublishedFact } from '../domain/dining';
import { catalogImagery } from '../lib/catalogImagery';
import { VerifiedEvidence, VerifiedFactList } from './VerifiedFacts';

type DisplayRestaurant = { name: string; address: string; facts: PublishedFact[] };
/** Generated imagery is separate from verified facts. No real photo is inferred or overwritten. */
export function CatalogPhoto({ restaurant, detail = false, showWebsite = true }: { restaurant: Pick<DisplayRestaurant, 'facts'>; detail?: boolean; showWebsite?: boolean }) {
  const website = safeExternalUrl(factValue(restaurant, 'website') ?? '');
  const visual = catalogImagery(restaurant);
  const [failed, setFailed] = useState(false);
  return <figure className={`catalog-photo${detail ? ' catalog-photo-detail' : ''}`}>
    <div className="catalog-photo-frame">{!failed ? <img src={visual.src} alt={visual.alt} width="1200" height="800" loading="lazy" onError={() => setFailed(true)} /> : <p className="catalog-image-failed">イメージを読み込めませんでした</p>}<span className="catalog-image-label">イメージ</span></div>
    <figcaption><span>生成イメージ · 実際の店舗・料理ではありません</span>{showWebsite && website && <a href={website} target="_blank" rel="noreferrer">公式サイトでお店を見る <ArrowUpRight size={15} aria-hidden="true" /></a>}</figcaption>
  </figure>;
}
export function CatalogPresentation({ restaurant, detail = false }: { restaurant: DisplayRestaurant; detail?: boolean }) {
  return <><CatalogPhoto restaurant={restaurant} detail={detail} /><div className="catalog-presentation-heading"><p className="eyebrow">{factValue(restaurant, 'genre') ?? '料理の情報は確認中'}</p><h2>{restaurant.name}</h2><p>{restaurant.address}</p></div><VerifiedFactList restaurant={restaurant} compact={!detail} />{detail && <><p className="catalog-filter-note">コースの価格と利用条件は、確認した時点の情報です。空席・防音性は未確認です。予約前に最新情報をお店へご確認ください。</p><VerifiedEvidence restaurant={restaurant} /></>}</>;
}
export default function EditorialPreview({ restaurant }: { restaurant: EditorialRestaurant }) {
  const [detail, setDetail] = useState(false);
  return <details className="editorial-preview"><summary>掲載時の表示を確認する</summary><p className="catalog-filter-note">確認済みの店舗情報がどのように表示されるかを確認できます。この画面を開いても、掲載の承認や一般公開は行われません。</p><div className="curation-actions" role="group" aria-label="プレビューの表示形式"><button type="button" className="button-secondary" aria-pressed={!detail} onClick={() => setDetail(false)}>一覧カード</button><button type="button" className="button-secondary" aria-pressed={detail} onClick={() => setDetail(true)}>詳細ページ</button></div><section className="verified-card editorial-preview-surface" aria-label={`${restaurant.name}の${detail ? '詳細' : '一覧カード'}プレビュー`}><p className="eyebrow">PREVIEW / 一般公開前</p><CatalogPresentation restaurant={restaurant} detail={detail} /></section><p className="draft-privacy-note">写真の掲載には、権利者の許可・出典・利用条件の確認が必要です。公式サイトへのリンクは、写真の転載許可を意味しません。</p></details>;
}

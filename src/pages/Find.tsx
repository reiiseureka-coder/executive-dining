import { ArrowRight } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import HomeCatalog from '../components/HomeCatalog';

interface Props { onNavigate: (page: Page, id?: string, params?: SearchParams) => void }

export default function Find({ onNavigate }: Props) {
  return <div className="editorial-home">
    <HomeCatalog onNavigate={onNavigate} />
    <section className="page-width home-fieldnotes" aria-labelledby="fieldnotes-title">
      <div><h2 id="fieldnotes-title">ご利用の前に</h2><p>掲載しているのは、公式情報を確認した時点の記録です。未確認の項目も明示します。</p></div>
      <div className="home-guide-list">
        <details><summary>個室・料金の確認について</summary><p>個室の利用条件や料金の種類を、確認した時点の情報として掲載します。最新の空席や営業状況は、予約前にお店へ直接ご確認ください。</p></details>
        <details><summary>候補を比較する</summary><p>気になるお店は最大3店まで比較できます。個室の人数・利用条件と、料金に含まれる内容を並べてご確認ください。</p></details>
        <details><summary>掲載情報と口コミについて</summary><p>公式情報を確認した記録と、実際の訪問体験は分けて表示します。公開口コミの受付は準備中です。</p></details>
      </div>
    </section>
    <section className="page-width home-closing" aria-label="エリアとサービスのご案内">
      <p>対象エリア <strong>名古屋</strong></p>
      <nav className="home-audience-links" aria-label="事業者向けのご案内">
        <a href="#/corporate" onClick={event => { event.preventDefault(); onNavigate('corporate'); }}>法人導入のご案内<ArrowRight size={14} aria-hidden="true" /></a>
        <a href="#/restaurants" onClick={event => { event.preventDefault(); onNavigate('restaurants'); }}>店舗掲載のご案内<ArrowRight size={14} aria-hidden="true" /></a>
      </nav>
    </section>
  </div>;
}

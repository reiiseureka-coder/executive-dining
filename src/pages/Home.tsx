import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import HomeCatalog from '../components/HomeCatalog';
import { openLoginDialog } from '../lib/loginDialog';
import { useAuth } from '../contexts/auth';
import { useAppAccess } from '../contexts/appAccess';
import { supabase, emailSignInEnabled, googleSignInEnabled } from '../lib/supabase';
interface Props { onNavigate: (page: Page, id?: string, params?: SearchParams) => void }
export default function Home({ onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const access = useAppAccess();
  const { user } = useAuth();
  const loginAvailable = Boolean(supabase && (emailSignInEnabled || googleSignInEnabled));
  const explore = (value = '') => onNavigate('nagoya', undefined, { query: value });
  return <div className="editorial-home">
    <section className="home-hero page-width" aria-labelledby="home-title">
      <div className="hero-copy">
        <p className="eyebrow hero-edition">名古屋の会食ガイド</p>
        <h1 id="home-title"><span>大切な話を、</span><span>心地よい一席で。</span></h1>
        <p className="hero-description">お店選びに、少しの余白を。<br />個室や料金を確かめて、会食の候補を。</p>
        <form className="hero-search" role="search" onSubmit={event => { event.preventDefault(); explore(query.trim()); }}>
          <label className="sr-only" htmlFor="home-query">店名・エリア・料理を検索</label><Search size={19} aria-hidden="true" />
          <input id="home-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="店名・エリア・料理" type="search" />
          <button type="submit">探す<ArrowRight size={18} aria-hidden="true" /></button>
        </form>
        <div className="quick-links"><span>キーワード</span>{['個室', '日本料理', '名駅'].map(term => <button key={term} onClick={() => explore(term)}>{term}</button>)}</div>
        <p className="home-availability">{access.ownerTrial ? '招待アカウントでログイン中。名古屋の非公開情報をご覧いただけます。' : '名古屋の店舗情報を準備中です。'}{!user && loginAvailable && <button className="inline-login" onClick={openLoginDialog}>招待済みの方はログイン</button>}</p>
        <nav className="home-audience-links" aria-label="目的別のご案内"><a href="#/corporate" onClick={event => { event.preventDefault(); onNavigate('corporate'); }}>法人導入のご案内<ArrowRight size={14} aria-hidden="true" /></a><a href="#/restaurants" onClick={event => { event.preventDefault(); onNavigate('restaurants'); }}>店舗掲載のご案内<ArrowRight size={14} aria-hidden="true" /></a></nav>
      </div>
      <figure className="hero-figure"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85" alt="落ち着いたレストランのテーブルセッティングのイメージ。掲載店舗の写真ではありません" fetchPriority="high" /><figcaption><span>写真はイメージです</span></figcaption></figure>
    </section>
    <HomeCatalog onNavigate={onNavigate} />
    <section className="page-width home-fieldnotes" aria-labelledby="fieldnotes-title">
      <div><h2 id="fieldnotes-title">ご利用の前に</h2><p>公式情報とその出典を、ひとつの場所に。<br />未確認のことは、未確認のままお伝えします。</p></div>
      <div className="home-guide-list">
        <details><summary>個室・料金の確認について</summary><p>個室の利用条件や料金の種類を、確認した時点の情報として掲載します。最新の空席や営業状況は、予約前にお店へ直接ご確認ください。</p></details>
        <details><summary>候補を残して、比較する</summary><p>気になるお店は最大3店まで比較できます。保存した候補はこのブラウザ内だけに残り、ほかの端末とは同期されません。</p></details>
        <details><summary>掲載情報と口コミについて</summary><p>公式情報を確認した記録と、実際の訪問体験は分けて表示します。公開口コミの受付は準備中です。</p></details>
      </div>
    </section>
    <section className="page-width home-closing" aria-label="エリアとサービスのご案内"><p>現在の対象エリア <strong>名古屋</strong></p><button className="text-link" onClick={() => explore()}>店舗一覧へ<ArrowRight size={18} aria-hidden="true" /></button></section>
  </div>;
}

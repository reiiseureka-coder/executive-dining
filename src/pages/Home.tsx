import { ArrowRight } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { diningRepository } from '../data/diningClient';
import '../styles/service-home.css';

interface Props { onNavigate: (page: Page, id?: string, params?: SearchParams) => void }

/** Public service introduction. Availability never replaces the purpose of the home. */
export default function Home({ onNavigate }: Props) {
  const connected = Boolean(diningRepository);
  return <div className="service-home">
    <section className="page-width service-intro" aria-labelledby="service-title">
      <div className="service-intro-copy">
        <p className="service-kicker">名古屋で、会食・接待のお店を探す方へ</p>
        <h1 id="service-title">会食の候補を、<br />条件で選ぶ。</h1>
        <p className="service-lead">個室の人数と利用条件、料金、場所。<br className="service-desktop-break" />予約の前に確かめたいことを整理し、<br className="service-desktop-break" />候補のお店を比べるサービスです。</p>
        <div className="service-start">
          <a className="primary-button" href="/preview.html#/preview">閲覧専用デモを試す<ArrowRight size={18} aria-hidden="true" /></a>
          <p>ログイン不要。公式情報の記録で、店舗選びの流れを試せます。</p>
        </div>
        <div className="service-live-entry">
          <a href="#/find" onClick={event => { event.preventDefault(); onNavigate('find'); }}>{connected ? '利用できる店舗情報を確認する' : '店舗情報の公開状況を見る'}<ArrowRight size={16} aria-hidden="true" /></a>
          <p>{connected ? '閲覧できる情報は、公開状況とアカウントによって異なります。' : 'この確認用サイトの店舗検索は未接続です。デモでは検索・比較の操作を確認できます。'}</p>
        </div>
      </div>
      <aside className="service-purpose" aria-labelledby="service-purpose-title">
        <h2 id="service-purpose-title">大切なのは、<br />その会食に合うかどうか。</h2>
        <dl>
          <div><dt>個室</dt><dd>何人で使えるか。利用条件は合うか。</dd></div>
          <div><dt>料金</dt><dd>どのコースの価格か。何が含まれるか。</dd></div>
          <div><dt>場所</dt><dd>集まりやすい場所か。アクセスはどうか。</dd></div>
        </dl>
        <p>確認できていない情報は「未確認」と表示。分からないことを、分かることと混ぜません。</p>
      </aside>
    </section>
    <section className="page-width service-how" aria-labelledby="service-how-title">
      <div><p className="service-kicker">使い方</p><h2 id="service-how-title">探すところから、<br />予約前の確認まで。</h2></div>
      <ol>
        <li><span aria-hidden="true">1</span><div><h3>店名・エリア・料理から探す</h3><p>気になるお店の料金と個室の条件を、一覧で確かめます。</p></div></li>
        <li><span aria-hidden="true">2</span><div><h3>候補を並べて比較する</h3><p>最大3店を、同じ項目で比較。違いを見ながら候補を絞れます。</p></div></li>
        <li><span aria-hidden="true">3</span><div><h3>公式情報で最終確認する</h3><p>出典と確認日を確かめ、最新の営業状況・空席・予約はお店へ直接ご確認ください。</p></div></li>
      </ol>
    </section>
    <section className="page-width service-boundaries" aria-labelledby="service-boundaries-title">
      <div><h2 id="service-boundaries-title">安心して判断するために</h2><p>掲載情報は、確認した時点の記録です。空席のリアルタイム表示や、このサイト内での予約・決済には対応していません。</p><a href="#/about" onClick={event => { event.preventDefault(); onNavigate('about'); }}>掲載情報について<ArrowRight size={16} aria-hidden="true" /></a></div>
      <nav aria-label="事業者向けのご案内"><a href="#/corporate" onClick={event => { event.preventDefault(); onNavigate('corporate'); }}><span>法人導入のご案内</span><ArrowRight size={18} aria-hidden="true" /></a><a href="#/restaurants" onClick={event => { event.preventDefault(); onNavigate('restaurants'); }}><span>店舗掲載のご案内</span><ArrowRight size={18} aria-hidden="true" /></a></nav>
    </section>
  </div>;
}

import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { useAppAccess } from '../contexts/appAccess';
interface Props { onNavigate: (page: Page, id?: string, params?: SearchParams) => void }
export default function Home({ onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const access = useAppAccess();
  const explore = (value = '') => onNavigate('nagoya', undefined, { query: value });
  return <>
    <section className="home-hero page-width">
      <div className="hero-copy">
        <p className="eyebrow">EXECUTIVE DINING / FIND YOUR NEXT TABLE</p>
        <h1><span>大切な話を、</span><span>心地よい一席で。</span></h1>
        <p className="hero-description">個室、予算、アクセス。<br />会食の条件をひとつずつ確かめて、<br className="mobile-break" />次の一軒を見つける。</p>
        <form className="hero-search" onSubmit={event => { event.preventDefault(); explore(query.trim()); }}>
          <label className="sr-only" htmlFor="home-query">店名・エリア・料理を検索</label><Search size={19} aria-hidden="true" />
          <input id="home-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="名古屋の店名・エリア・料理" type="search" />
          <button type="submit">探す<ArrowRight size={17} /></button>
        </form>
        <div className="quick-links"><span>気になる条件</span>{['個室', '日本料理', '名駅'].map(term => <button key={term} onClick={() => explore(term)}>{term}</button>)}</div>
        <p className="home-availability">{access.ownerTrial ? '招待アカウントでログイン中。店舗一覧から非公開の実店舗情報を確認できます。' : '現在の検索対象は名古屋です。公開承認済みの店舗情報だけを表示します。招待済みの方はログインしてください。'}</p>
      </div>
      <figure className="hero-figure"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85" alt="落ち着いたレストランのテーブルセッティングのイメージ。掲載店舗の写真ではありません" fetchPriority="high" /><figcaption><span>THE DINING NOTE / IMAGE</span><span>ゆっくり話せる、その場所へ。</span></figcaption></figure>
    </section>
    <section className="page-width section-space">
      <div className="section-heading"><div><p className="eyebrow">EXPLORE BY CITY</p><h2>集まる街から、一席を。</h2><p>東京、大阪、名古屋、福岡。街ごとに、食の時間を探す。</p></div><button className="text-link" onClick={() => explore()}>店舗一覧へ<ArrowRight size={16} /></button></div>
      <div className="area-list city-list">{['東京', '大阪', '名古屋', '福岡'].map((city,index) => <button key={city} disabled={city !== '名古屋'} onClick={() => explore()}><span className="area-number">0{index+1}</span><span><strong>{city}</strong><small>{city === '名古屋' ? '店舗情報を見る' : '準備中'}</small></span>{city === '名古屋' && <ArrowRight size={20} />}</button>)}</div>
      <p className="quiet-label">現在の対応エリアは名古屋のみです。東京・大阪・福岡は準備中です。掲載の公開状況は店舗一覧でご確認ください。</p>
    </section>
    <section className="page-width section-space">
      <div className="section-heading"><div><p className="eyebrow">A CLEARER WAY TO CHOOSE</p><h2>一席を選ぶ、確かな手がかり。</h2></div></div>
      <div className="home-principles">{[
        ['01','条件を、そのまま。','公式のコース価格、個室の条件、営業のお知らせ。確認した情報と出典・確認日を、一緒に表示します。'],
        ['02','候補を、並べて。','気になるお店を保存して比較。価格だけでは見えない違いを、会食の目的に合わせて確かめます。'],
        ['03','わからないことは、明確に。','未確認の情報を推測で埋めません。空席や最新の利用条件は、予約前にお店へご確認ください。'],
      ].map(([number,title,text]) => <article key={number}><span className="eyebrow">{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className="planning-section"><div className="page-width planning-inner"><div><p className="eyebrow">GROW WITH US</p><h2>いい食の時間を、<br />ともにつくる。</h2><p>店舗と企業、それぞれに合う関わり方を。</p></div><div className="home-partners">
      <a href="#/restaurants"><small>FOR RESTAURANTS</small><h3>店舗の方へ</h3><p>掲載リクエストと、情報確認の流れ。</p><span>掲載のご案内<ArrowRight size={16} /></span></a>
      <a href="#/corporate"><small>FOR COMPANIES</small><h3>法人の方へ</h3><p>会社から社員へ。食の福利厚生プランを検討中。</p><span>法人プランのご案内<ArrowRight size={16} /></span></a>
    </div></div></section>
  </>;
}

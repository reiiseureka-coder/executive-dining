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
        <p className="eyebrow">EXECUTIVE DINING</p>
        <h1><span>会食に合う</span><span>お店を探す。</span></h1>
        <p className="hero-description">個室やコース料金を確かめて、<br />気になるお店を比較できます。</p>
        <form className="hero-search" onSubmit={event => { event.preventDefault(); explore(query.trim()); }}>
          <label className="sr-only" htmlFor="home-query">店名・エリア・料理を検索</label><Search size={19} aria-hidden="true" />
          <input id="home-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="店名・エリア・料理" type="search" />
          <button type="submit">探す<ArrowRight size={17} /></button>
        </form>
        <div className="quick-links"><span>よく使う条件</span>{['個室', '日本料理', '名駅'].map(term => <button key={term} onClick={() => explore(term)}>{term}</button>)}</div>
        <p className="home-availability">{access.ownerTrial ? '招待アカウントでログイン中。名古屋の非公開情報を確認できます。' : '現在は名古屋に対応しています。招待済みの方は、ログインすると非公開の店舗情報も確認できます。'}</p>
        <nav className="home-audience-links" aria-label="目的別のご案内"><a href="#/corporate" onClick={event => { event.preventDefault(); onNavigate('corporate'); }}>法人導入のご案内<ArrowRight size={16} /></a><a href="#/restaurants" onClick={event => { event.preventDefault(); onNavigate('restaurants'); }}>店舗掲載のご案内<ArrowRight size={16} /></a></nav>
      </div>
      <figure className="hero-figure"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85" alt="落ち着いたレストランのテーブルセッティングのイメージ。掲載店舗の写真ではありません" fetchPriority="high" /><figcaption><span>IMAGE</span><span>写真はイメージです</span></figcaption></figure>
    </section>
    <section className="page-width section-space home-cities">
      <div className="section-heading"><div><p className="eyebrow">AREA</p><h2>エリアから探す</h2></div><button className="text-link" onClick={() => explore()}>店舗一覧へ<ArrowRight size={16} /></button></div>
      <div className="area-list city-list">{['東京', '大阪', '名古屋', '福岡'].map((city,index) => <button key={city} disabled={city !== '名古屋'} onClick={() => explore()}><span className="area-number">0{index+1}</span><span><strong>{city}</strong><small>{city === '名古屋' ? '店舗情報を見る' : '準備中'}</small></span>{city === '名古屋' && <ArrowRight size={20} />}</button>)}</div>
      <p className="quiet-label">名古屋のみ対応。東京・大阪・福岡は準備中です。</p>
    </section>
    <section className="page-width section-space home-value">
      <div className="section-heading"><div><p className="eyebrow">HOW TO USE</p><h2>お店選びに使えること</h2></div></div>
      <div className="home-principles">{[
        ['01','料金や個室の条件を確認','コース料金、個室の利用条件、営業のお知らせを掲載。情報源と確認日も確認できます。'],
        ['02','気になるお店を保存・比較','候補をこのブラウザに保存できます。最大3店を並べて、料金や個室の条件を比べられます。'],
        ['03','予約前に最新情報を確認','確認できていない項目は「未確認」と表示します。空席や最新の利用条件は、予約前にお店へご確認ください。'],
      ].map(([number,title,text]) => <article key={number}><span className="eyebrow">{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className="planning-section"><div className="page-width planning-inner"><div><p className="eyebrow">FOR RESTAURANTS & COMPANIES</p><h2>店舗掲載と<br />法人プランのご案内</h2><p>どちらも受付に向けて準備中です。</p></div><div className="home-partners">
      <a href="#/restaurants" onClick={event => { event.preventDefault(); onNavigate('restaurants'); }}><small>FOR RESTAURANTS</small><h3>店舗の方へ</h3><p>掲載する情報と、申込みまでの流れをご案内します。</p><span>掲載のご案内<ArrowRight size={16} /></span></a>
      <a href="#/corporate" onClick={event => { event.preventDefault(); onNavigate('corporate'); }}><small>FOR COMPANIES</small><h3>法人の方へ</h3><p>会社が利用料を負担し、社員がお店選びに使うプランです。</p><span>法人プランのご案内<ArrowRight size={16} /></span></a>
    </div></div></section>
  </>;
}

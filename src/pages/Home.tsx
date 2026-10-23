import { ArrowRight } from 'lucide-react';
import type { Page } from '../types';
import type { SearchParams } from '../lib/search';
import { diningRepository } from '../data/diningClient';
import '../styles/service-home.css';

interface Props { onNavigate: (page: Page, id?: string, params?: SearchParams) => void }

/** The service purpose is independent of the current publication and connection state. */
export default function Home({ onNavigate }: Props) {
  const connected = Boolean(diningRepository);
  return <div className="service-home">
    <section className="page-width service-intro" aria-labelledby="service-title">
      <div className="service-intro-copy">
        <p className="service-kicker">名古屋の会食・接待に</p>
        <h1 id="service-title">会食専用<br />口コミサイト</h1>
        <p className="service-lead">実際に利用した人の声を手がかりに、<br className="service-desktop-break" />次の会食のお店を探す。</p>
        <div className="service-start">
          {connected ? <a className="primary-button" href="#/find" onClick={event => { event.preventDefault(); onNavigate('find'); }}>お店を探す<ArrowRight size={18} aria-hidden="true" /></a> : <a className="primary-button" href="/preview.html#/preview">お店を探す（閲覧デモ）<ArrowRight size={18} aria-hidden="true" /></a>}
          <p>{connected ? '店舗と口コミの公開状況を確認できます。' : 'ログイン不要。現在のデモに口コミはまだありません。'}</p>
        </div>
        <div className="service-live-entry">
          <p>口コミの投稿受付は準備中です。{!connected && 'この確認用サイトの店舗検索は未接続です。'}</p>
          <a href="#/find" onClick={event => { event.preventDefault(); onNavigate('find'); }}>店舗情報の公開状況を見る<ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
    <section className="page-width service-reading" aria-labelledby="service-reading-title">
      <h2 id="service-reading-title">「会食でどうだったか」を、次のお店選びに。</h2>
      <p>落ち着いて話せたか、接客はどうだったか。利用者の体験を読み、料金や個室の情報とあわせて判断するためのサイトです。</p>
      <p>口コミとお店の公式情報は、分けて表示します。</p>
      <a href="#/about" onClick={event => { event.preventDefault(); onNavigate('about'); }}>このサービスについて<ArrowRight size={16} aria-hidden="true" /></a>
    </section>
  </div>;
}

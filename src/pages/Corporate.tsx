import { useState } from 'react';
import { ArrowRight, Check, Copy } from 'lucide-react';
const checklist = '【エンタープライズプラン 相談メモ】\n・対象となる社員数\n・主な利用地域\n・利用したい機能・食事の場面\n・導入時期と予算の目安';
export default function Corporate() {
  const [copyState, setCopyState] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(checklist); setCopyState('相談メモをコピーしました。送信はしていません。'); }
    catch { setCopyState('コピーできませんでした。下の相談メモを選択してコピーしてください。'); }
  };
  return <div className="enterprise-page page-width">
    <section className="enterprise-hero">
      <a className="text-link" href="#/">ホームへ</a>
      <p className="eyebrow">FOR COMPANIES</p>
      <h1>エンタープライズプラン</h1>
      <h2>社員の食事に、<br className="mobile-break" />選ぶ楽しみを。</h2>
      <p className="enterprise-intro">会社が会員利用料を負担する、福利厚生向けのプランです。家族や友人との食事など、社員のプライベートなお店選びに。</p>
      <p className="enterprise-note">提供準備中です。料金・機能・特典は未定で、お申込みはまだ受け付けていません。</p>
    </section>
    <section className="enterprise-consultation" id="consultation" aria-labelledby="enterprise-consultation-title">
      <div><p className="eyebrow">CONSULTATION</p><h2 id="enterprise-consultation-title">導入のご相談</h2><p>社員数・利用地域・ご希望を、相談前に整理できます。</p><button className="primary-button" onClick={() => void copy()}>{copyState.startsWith('相談メモをコピーしました') ? <Check size={16} /> : <Copy size={16} />}相談メモをコピー<ArrowRight size={16} /></button>{copyState && <p role="status">{copyState}</p>}<small>お問い合わせ窓口は準備中です。情報は送信されません。</small></div>
      <pre className="enterprise-checklist">{checklist}</pre>
    </section>
    <section className="enterprise-features" aria-label="プランの特徴">
      {[{title:'会社がまとめて契約',text:'会社単位の契約で、対象の社員が会員機能を利用する仕組みを予定しています。'}, {title:'社員の食事に使える',text:'記念日のお祝いから、家族・友人との食事まで。仕事以外のお店選びを支えます。'}, {title:'優待・限定枠を検討中',text:'会員向けの優待や予約枠は、店舗と相談のうえ検討します。提供内容は未定です。'}].map(({title,text}) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
    </section>
    <p className="enterprise-note enterprise-meal-note">※飲食代は会員利用料とは別にお支払いいただく想定です。優待・限定枠はまだ利用できません。</p>

  </div>;
}

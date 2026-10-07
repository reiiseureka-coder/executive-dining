import { useState } from 'react';
import { ArrowRight, Building2, Users, Utensils, Check, Copy } from 'lucide-react';
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
      <p className="eyebrow">FOR BUSINESS / EMPLOYEE BENEFITS</p>
      <h1>エンタープライズプラン</h1>
      <h2>企業の福利厚生に、<br className="mobile-break" />食の楽しみを。</h2>
      <p className="enterprise-intro">会社が会員利用料を負担し、社員がプライベートの食事のお店選びに使える法人向けプランです。</p>
      <p className="enterprise-note">提供準備中です。料金・機能・特典は未確定で、契約・受付は開始していません。</p>
    </section>
    <section className="enterprise-consultation" id="consultation" aria-labelledby="enterprise-consultation-title">
      <div><p className="eyebrow">GET IN TOUCH</p><h2 id="enterprise-consultation-title">導入のご相談</h2><p>社員数・地域・ご希望を、相談メモに整理できます。</p><button className="primary-button" onClick={() => void copy()}>{copyState.startsWith('相談メモをコピーしました') ? <Check size={16} /> : <Copy size={16} />}相談メモをコピー<ArrowRight size={16} /></button>{copyState && <p role="status">{copyState}</p>}<small>お問い合わせ窓口は準備中です。情報は送信されません。</small></div>
      <pre className="enterprise-checklist">{checklist}</pre>
    </section>
    <section className="enterprise-features" aria-label="プランの特徴">
      {[{icon:Building2,title:'会社がまとめて契約',text:'対象社員に会員機能を提供する、法人単位の契約を想定しています。'}, {icon:Users,title:'社員の食事に使える',text:'記念日や家族・友人との食事など、仕事の外のお店選びをサポート。'}, {icon:Utensils,title:'会員向けの楽しみを',text:'目的に合うお店の情報や、店舗と合意した優待・限定枠を検討しています。'}].map(({icon:Icon,title,text}) => <article key={title}><Icon size={25} strokeWidth={1.4} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
    </section>
    <p className="enterprise-note enterprise-meal-note">※飲食代は会員利用料に含む前提ではありません。優待・限定枠は現在未提供です。</p>

  </div>;
}

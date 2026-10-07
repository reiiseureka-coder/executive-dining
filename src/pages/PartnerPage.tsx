import { useState } from 'react';
import { ArrowRight, Check, Copy } from 'lucide-react';
const content = {
  restaurants: {
    eyebrow: 'FOR RESTAURANTS', title: 'お店の魅力を、\n必要とする一席へ。', intro: '会食に向いたお店の情報を、条件とともに丁寧に伝える。名古屋から、掲載の仕組みを準備しています。', label: '掲載リクエスト',
    heading: '伝えたいのは、選ぶための情報。',
    cards: [
      ['個室・席の条件','人数、仕切り、利用時間、個室料など。写真の印象だけに頼らず、会食前に確かめたいことを整理します。'],
      ['料金・営業の情報','コースの価格と適用条件、税・サービス料、営業日など。公式情報の出典と確認日を付けて掲載します。'],
      ['中立で、更新できる掲載','掲載依頼だけで公開を確約するものではありません。事実確認と掲載承認を経て表示し、有料の評価操作や順位保証は行いません。'],
    ],
    steps: ['掲載対象・情報源・写真などの利用権限を確認', '店舗情報と表記内容を確認し、公開可否を判断', '承認後の掲載と、訂正・更新の運用を整備'],
    questions: [
      ['掲載依頼はもう送れますか？','現在は受付準備中です。このページには送信機能がなく、掲載料・審査期間・連絡窓口も未確定です。下の確認リストを相談準備にご利用ください。'],
      ['口コミや予約も利用できますか？','公開口コミの受付と、このサイト内での予約は準備中です。掲載は予約枠の提供や会員限定店への参加を意味しません。'],
      ['会員限定の予約枠を提供したい場合は？','将来の選択肢として検討しています。通常の情報掲載とは別に、提供枠、会員確認、キャンセル条件、店舗との契約を確認してから設計します。'],
    ],
    checklist: '【掲載相談の確認リスト】\n・店舗の公式情報を確認できるページ\n・個室の人数、利用条件、追加料金\n・コース価格、税・サービス料、営業情報\n・写真や文章の掲載許可\n・掲載内容の確認と更新を担当する窓口\n・通常掲載か、将来の会員限定予約枠も検討するか',
  },
  corporate: {
    eyebrow: 'FOR COMPANIES', title: '会社から、\n社員の食の楽しみを。', intro: '法人が利用料を負担し、社員の皆さまが日々の食事や大切な日の店選びに使える、福利厚生プランを検討しています。まずは名古屋から、食の時間を楽しむきっかけを。', label: '福利厚生・法人プラン',
    heading: '法人の会員プランを、社員の皆さまへ。',
    cards: [
      ['会社が利用料を負担','法人が契約して利用料を負担し、対象社員へ利用権を提供する仕組みを検討中です。社員は個人の食事のお店選びに会員機能を利用する想定です。飲食代の補助とは別のプランです。'],
      ['社員が使える会員向け機能','基本の店舗情報・レビューは無料で、評価の独立性を保つ方針です。有料部分は店選びを助ける機能を中心に検討し、優待・限定枠は店舗との合意後にご案内します。'],
      ['会食選びにも活用','社員の食の福利厚生を中心に、業務での会食や幹事の店選びにも役立つ使い方を検討します。利用範囲や社内ルールは、それぞれの目的に合わせて整理します。'],
    ],
    steps: ['対象となる社員・利用地域・利用場面を整理', '法人会員の料金、利用機能、社員への提供方法を検討', '契約・個人情報の扱い・運用体制を確認して開始判断'],
    questions: [
      ['料金や提供開始日は決まっていますか？','料金・提供開始日・提供内容は未確定です。このページは導入検討のご案内で、申込みや契約、決済は行いません。'],
      ['社員の飲食代も含まれますか？','想定しているのは、会社がサイトの有料会員機能を社員に提供するプランです。飲食代の負担や食事補助は含む前提ではなく、別途検討が必要です。'],
      ['経費処理や税務上の扱いは？','法人会員の利用料と飲食代の補助は別の仕組みです。特定の税務処理を保証せず、各社の制度と利用実態に応じて専門家への確認が必要です。'],
      ['予約代行・一括精算・会員限定店は使えますか？','いずれも現在提供していません。将来の検討項目として、店舗契約や予約管理、決済・キャンセルの責任分担を確認していきます。'],
    ],
    checklist: '【法人プラン相談の確認リスト】\n・福利厚生として対象にする社員の範囲\n・利用する地域と食事の場面\n・想定する利用頻度と人数の目安\n・法人が負担する会員利用料の予算\n・社員への利用権の配布、管理、請求の要件\n・導入前に確認したい運用・個人情報の扱い',
  },
};
export default function PartnerPage({ audience }: { audience: keyof typeof content }) {
  const data = content[audience];
  const [copyState, setCopyState] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(data.checklist); setCopyState('確認リストをコピーしました。送信はしていません。'); }
    catch { setCopyState('コピーできませんでした。下の確認リストを選択してコピーしてください。'); }
  };
  return <div className="partner-page">
    <section className="page-width partner-hero"><a className="text-link" href="#/">ホームへ</a><p className="eyebrow">{data.eyebrow}</p><p className="partner-status">{data.label} · 準備中</p><h1>{data.title.split('\n').map(line => <span key={line}>{line}</span>)}</h1><p className="partner-intro">{data.intro}</p><button className="outline-button" onClick={() => { document.getElementById('consultation')?.scrollIntoView({behavior:'smooth'}); document.getElementById('consultation')?.focus({preventScroll:true}); }}>相談前の確認リストを見る<ArrowRight size={16} /></button></section>
    <section className="page-width section-space"><div className="section-heading"><div><p className="eyebrow">OUR APPROACH</p><h2>{data.heading}</h2></div></div><div className="home-principles">{data.cards.map(([title,text],index) => <article key={title}><span className="eyebrow">0{index+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="planning-section"><div className="page-width planning-inner"><div><p className="eyebrow">BEFORE WE BEGIN</p><h2>開始までに、<br />確かめること。</h2><p>以下は想定する流れです。<br />現在、申込みの受付は行っていません。</p></div><ol>{data.steps.map((text,index) => <li key={text}><span>0{index+1}</span><div><h3>{text}</h3></div></li>)}</ol></div></section>
    <section className="page-width section-space partner-faq"><p className="eyebrow">QUESTIONS & ANSWERS</p><h2>よくあるご質問</h2>{data.questions.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <section className="page-width section-space consultation-panel" id="consultation" tabIndex={-1}><div><p className="eyebrow">PREPARE FOR A CONVERSATION</p><h2>相談の前に、整理しておくこと。</h2><p>受付窓口を準備しています。確認リストをコピーして、お手元のメモとしてご利用ください。このページでは情報の入力・保存・送信は行いません。</p><button className="outline-button" onClick={() => void copy()}>{copyState.startsWith('確認リスト') ? <Check size={16} /> : <Copy size={16} />}確認リストをコピー</button>{copyState && <p role="status">{copyState}</p>}</div><pre className="consultation-checklist">{data.checklist}</pre></section>
  </div>;
}

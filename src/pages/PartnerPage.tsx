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
    <section className="page-width section-space store-evidence"><div><p className="eyebrow">FACTS AND EXPERIENCES</p><h2>お店からの情報と、<br />体験の声を分けて伝える。</h2><p>店舗の実在確認は、実際に訪問したことの証明ではありません。情報の種類と確認状況を明確にします。</p></div><div className="store-evidence-types"><article><span>店舗提供情報・公式情報</span><h3>変わる条件を、正確に。</h3><p>営業時間、コースの条件、席数、個室料。情報源と確認日を付け、掲載前に内容と利用権限を確認します。</p></article><article><span>体験にもとづくレビュー</span><h3>体験の評価は、独立して。</h3><p>店舗の希望だけで好意的に書き換えません。虚偽や権利侵害などの申告は個別に確認する方針です。公開受付は準備中です。</p></article></div></section>
    <section className="planning-section"><div className="page-width planning-inner"><div><p className="eyebrow">BEFORE WE BEGIN</p><h2>開始までに、<br />確かめること。</h2><p>以下は想定する流れです。<br />現在、申込みの受付は行っていません。</p></div><ol>{data.steps.map((text,index) => <li key={text}><span>0{index+1}</span><div><h3>{text}</h3></div></li>)}</ol></div></section>
    <section className="page-width section-space partner-faq"><p className="eyebrow">QUESTIONS & ANSWERS</p><h2>よくあるご質問</h2>{data.questions.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <section className="page-width section-space consultation-panel" id="consultation" tabIndex={-1}><div><p className="eyebrow">PREPARE FOR A CONVERSATION</p><h2>相談の前に、整理しておくこと。</h2><p>受付窓口を準備しています。確認リストをコピーして、お手元のメモとしてご利用ください。このページでは情報の入力・保存・送信は行いません。</p><button className="outline-button" onClick={() => void copy()}>{copyState.startsWith('確認リスト') ? <Check size={16} /> : <Copy size={16} />}確認リストをコピー</button>{copyState && <p role="status">{copyState}</p>}</div><pre className="consultation-checklist">{data.checklist}</pre></section>
  </div>;
}

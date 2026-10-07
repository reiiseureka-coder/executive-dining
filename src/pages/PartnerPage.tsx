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
    eyebrow: 'FOR COMPANIES', title: '食の時間を、\n企業の力に。', intro: '名古屋の会食選びを支える法人向けプランを検討中です。業務での会食と、従業員向けの福利厚生。それぞれの目的に合う仕組みを考えます。', label: '福利厚生・法人プラン',
    heading: 'ふたつの目的を、丁寧に設計。',
    cards: [
      ['会食・幹事業務の支援','取引先との会食や社内の集まりに。店舗の条件を確かめ、候補を比較するところから、準備の負担を減らす使い方を想定しています。'],
      ['従業員向けの食の福利厚生','従業員が食の時間を楽しめる仕組みを検討中です。利用対象、会社補助の有無、利用上限、公平な利用条件を企業ごとに整理します。'],
      ['名古屋から、小さく検証','まずは対象地域と利用目的を絞って検討します。導入企業数、利用実績、提携割引や限定予約枠は、現時点で確約していません。'],
    ],
    steps: ['利用目的・対象者・地域・予算の考え方を整理', '運営条件、料金、店舗側の提供内容を個別に検討', '契約・個人情報の扱い・運用体制を確認して開始判断'],
    questions: [
      ['料金や提供開始日は決まっていますか？','料金・提供開始日・提供内容は未確定です。このページは導入検討のご案内で、申込みや契約、決済は行いません。'],
      ['経費処理や税務上の扱いは？','福利厚生と取引先との会食は、目的や利用対象が異なります。特定の税務処理を保証せず、各社の制度と利用実態に応じて専門家への確認が必要です。'],
      ['予約代行・一括精算・会員限定店は使えますか？','いずれも現在提供していません。将来の検討項目として、店舗契約や予約管理、決済・キャンセルの責任分担を確認していきます。'],
    ],
    checklist: '【法人プラン相談の確認リスト】\n・主な目的：業務での会食／従業員の福利厚生\n・利用する地域と対象者の範囲\n・想定する利用頻度と人数の目安\n・会社補助の有無、予算上限の考え方\n・必要な管理、請求、利用ルール\n・導入前に確認したい運用・個人情報の扱い',
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

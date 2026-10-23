import { useState } from 'react';
import { ArrowDown, Check, ChevronDown, Copy } from 'lucide-react';
import '../styles/partners-redesign.css';

const content = {
  restaurants: {
    eyebrow: 'FOR RESTAURANTS', title: '会食を考える人に、\nお店の魅力を。', intro: '個室やコース料金など、会食のお店選びに必要な情報を掲載します。現在、名古屋の店舗から掲載準備を進めています。', label: '掲載申込み',
    heading: 'お店選びに必要な情報を、きちんと。',
    cards: [
      ['個室・席の条件', '利用できる人数、仕切り、利用時間、個室料などを確認して掲載します。'],
      ['料金・営業の情報', 'コース料金、税・サービス料、営業日などを掲載します。情報源と確認日も記載します。'],
      ['掲載前に内容を確認', '内容と掲載可否を確認してから公開します。申込みによって掲載が決まるわけではありません。料金と引き換えに評価や順位を上げることもありません。'],
    ],
    steps: ['店舗の公式情報と、写真・文章の掲載許可を確認', '掲載内容を確認し、公開できるか判断', '掲載後の訂正・更新方法を確認'],
    questions: [
      ['掲載依頼はもう送れますか？', 'まだ受け付けていません。掲載料・審査期間・連絡窓口は未定です。下の確認リストで、相談に必要な情報を整理できます。'],
      ['口コミや予約も利用できますか？', '口コミの投稿とサイト内での予約は、まだ利用できません。通常の情報掲載に、予約枠の提供や会員限定店への参加は含まれません。'],
      ['会員限定の予約枠を提供したい場合は？', '今後の機能として検討しています。通常の情報掲載とは別に、予約枠やキャンセル条件、会員の確認方法などを店舗と相談して決める予定です。'],
    ],
    checklist: '【掲載相談の確認リスト】\n・店舗の公式情報を確認できるページ\n・個室の人数、利用条件、追加料金\n・コース価格、税・サービス料、営業情報\n・写真や文章の掲載許可\n・掲載内容の確認と更新を担当する窓口\n・希望する掲載内容、会員限定の予約枠に関するご希望',
  },
};

export default function PartnerPage({ audience }: { audience: keyof typeof content }) {
  const data = content[audience];
  const [copyState, setCopyState] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.checklist);
      setCopyState('確認リストをコピーしました。送信はしていません。');
    } catch {
      setShowChecklist(true);
      setCopyState('コピーできませんでした。下の確認リストを選択してコピーしてください。');
    }
  };
  const goToChecklist = () => {
    const section = document.getElementById('consultation');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    section?.focus({ preventScroll: true });
  };

  return <div className="partner-page partner-editorial page-width">
    <section className="partner-hero">
      <a className="text-link partner-back" href="#/">ホームへ</a>
      <div className="partner-hero-meta"><p className="eyebrow">{data.eyebrow}</p><p className="partner-status">{data.label} · 準備中</p></div>
      <h1>{data.title.split('\n').map(line => <span key={line}>{line}</span>)}</h1>
      <p className="partner-intro">{data.intro}</p>
      <button className="outline-button partner-checklist-link" onClick={goToChecklist}>相談前の確認リストを見る<ArrowDown size={16} aria-hidden="true" /></button>
    </section>

    <section className="partner-listing partner-editorial-section" aria-labelledby="partner-listing-title">
      <div className="partner-section-heading"><p className="eyebrow">LISTING</p><h2 id="partner-listing-title">{data.heading}</h2></div>
      <div className="partner-information-list">{data.cards.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="partner-editorial-section partner-details" aria-labelledby="partner-details-title">
      <div className="partner-section-heading"><p className="eyebrow">IN DETAIL</p><h2 id="partner-details-title">掲載について、詳しく。</h2></div>
      <div className="partner-disclosures">
        <details>
          <summary>お店の情報と、訪れた人の声。</summary>
          <div className="partner-disclosure-content">
            <p>公式情報の確認と、口コミの投稿者が訪問したかどうかの確認は、別に扱います。</p>
            <article><p className="partner-detail-label">店舗提供情報・公式情報</p><h3>情報源と確認日を記載</h3><p>営業時間、コースの条件、席数、個室料などを掲載します。公開前に内容と掲載許可を確認します。</p></article>
            <article><p className="partner-detail-label">利用者の口コミ</p><h3>口コミは、利用者の視点で。</h3><p>店舗からの依頼で好意的な内容に書き換えることはありません。虚偽や権利侵害の申告は個別に確認する方針です。口コミの受付は準備中です。</p></article>
          </div>
        </details>
        <details>
          <summary>掲載までに、確かめること。</summary>
          <div className="partner-disclosure-content">
            <p>受付開始後は、以下の流れを予定しています。現在、申込みの受付は行っていません。</p>
            <ol className="partner-process">{data.steps.map(text => <li key={text}>{text}</li>)}</ol>
          </div>
        </details>
        {data.questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><div className="partner-disclosure-content"><p>{answer}</p></div></details>)}
      </div>
    </section>

    <section className="consultation-panel partner-editorial-section" id="consultation" tabIndex={-1} aria-labelledby="partner-consultation-title">
      <div className="partner-section-heading"><p className="eyebrow">CHECKLIST</p><h2 id="partner-consultation-title">掲載相談の確認リスト</h2></div>
      <div className="partner-consultation-body">
        <p>受付窓口は準備中です。相談前のメモとして、確認リストをコピーできます。</p>
        <button className="primary-button" onClick={() => void copy()}>{copyState.startsWith('確認リスト') ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}確認リストをコピー</button>
        {copyState && <p className="partner-copy-status" role="status">{copyState}</p>}
        <small>このページで情報の入力・保存・送信はできません。</small>
        <button className="partner-memo-toggle" aria-expanded={showChecklist} aria-controls="partner-checklist" onClick={() => setShowChecklist(!showChecklist)}>
          確認リストの内容を見る<ChevronDown size={16} aria-hidden="true" />
        </button>
        <pre id="partner-checklist" className="consultation-checklist" hidden={!showChecklist}>{data.checklist}</pre>
      </div>
    </section>
  </div>;
}

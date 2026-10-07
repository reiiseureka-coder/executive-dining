import { useState } from 'react';
import { ArrowRight, Building2, Users, Utensils, Gift, CalendarHeart, Check, Copy, ChevronRight } from 'lucide-react';
const checklist = '【法人プラン相談の確認リスト】\n・福利厚生として対象にする社員の範囲\n・利用する地域と食事の場面\n・社員がほしい店選びの機能や情報\n・法人が負担する会員利用料の予算\n・利用権の配布、入退社時の管理、請求の要件\n・企業への利用報告と個人情報の扱い';
const audiences = {
  company: { label: '企業・人事ご担当者', title: '制度を増やすだけでなく、使う理由をつくる。', intro: '社員の食事に、会社から選ぶ楽しみを。利用しやすい地域と場面から、福利厚生としての価値を一緒に確かめます。', points: [
    ['対象者に届く設計','対象社員の範囲、利用権の配布、入退社時の終了までを、導入前に整理。企業単位で利用料を負担するモデルを想定しています。'],
    ['使われ方から判断','記念日、週末、友人との食事。社員の利用意向と実際の使いやすさを検証し、利用頻度や満足度の確認方法を決めます。'],
    ['個人の時間を尊重','個人の食事履歴を会社に開示する前提にはしません。企業向け報告の範囲と社員への説明は、契約前に確認します。'],
  ] },
  employee: { label: '利用する社員の方', title: 'いつもの検索に、もうひとつの選び方を。', intro: '自分で有料会員になる代わりに、会社から会員機能を受け取る。仕事を離れた食事の時間にも、気軽に使えるサービスを目指します。', points: [
    ['大切な日に迷いにくく','予算、席の条件、料理、アクセスを見比べて候補を選ぶ。公式情報と未確認の項目がわかるので、予約前の確認にも使えます。'],
    ['知っている店の外へ','目的に沿った候補の見つけ方や、会員向けの編集情報を検討中。新しい店を選ぶきっかけをつくります。'],
    ['飲食代は、自分のペースで','会社が負担する想定なのは会員利用料です。飲食代は別で、予約・支払いは店舗側の条件を確認して行います。'],
  ] },
};
export default function Corporate() {
  const [audience, setAudience] = useState<keyof typeof audiences>('company');
  const [copyState, setCopyState] = useState('');
  const panel = audiences[audience];
  const consult = () => { const target = document.getElementById('consultation'); target?.scrollIntoView({behavior:'smooth'}); target?.focus({preventScroll:true}); };
  const copy = async () => { try { await navigator.clipboard.writeText(checklist); setCopyState('確認リストをコピーしました。送信はしていません。'); } catch { setCopyState('コピーできませんでした。下の確認リストを選択してコピーしてください。'); } };
  return <div className="corporate-page">
    <section className="page-width corporate-hero">
      <div className="corporate-hero-copy"><a className="text-link" href="#/">ホームへ</a><p className="eyebrow">EXECUTIVE DINING FOR TEAMS</p><p className="corporate-stage">法人向け福利厚生プラン / 提供準備中</p><h1><span>会社から、</span><span>社員の食の楽しみを。</span></h1><p className="corporate-lead">いい食事を選ぶ時間も、<br />大切な人と過ごす一席も。<br />会社から届ける、新しい会員体験。</p><p>法人が会員利用料を負担し、社員が個人の食事のお店選びに使える福利厚生を検討しています。</p><button className="primary-button" onClick={consult}>導入を考える方へ<ArrowRight size={17} /></button><small>料金・提供開始日は未定です。申込みや契約はまだ行えません。</small></div>
      <div className="corporate-hero-visual"><p>GOOD FOOD.<br />SHARED BY YOUR COMPANY.</p><div className="concept-membership"><div><span>EXECUTIVE DINING</span><Users size={21} /></div><small>CORPORATE MEMBERSHIP</small><strong>食の時間に、<br />選ぶ楽しみを。</strong><div><span>会社から社員へ</span><span>CONCEPT</span></div></div><div className="membership-caption"><span>利用イメージ</span><p>企業の契約で、対象社員へ利用権を。<br />現在は構想であり、会員証・利用権の発行は行っていません。</p></div></div>
    </section>
    <div className="corporate-service-strip"><div className="page-width"><span><Building2 size={18} />会社が会員利用料を負担</span><ChevronRight size={16} /><span><Users size={18} />対象社員へ利用権</span><ChevronRight size={16} /><span><Utensils size={18} />個人の食事で利用</span><small>想定する仕組み</small></div></div>
    <section className="page-width corporate-section corporate-intro"><p className="eyebrow">A BENEFIT FOR LIFE OUTSIDE WORK</p><h2>「何を食べる？」が、<br />楽しみになる福利厚生。</h2><div><p>探せるお店が多くても、大切な日の一軒は迷うもの。料理だけでなく、席の過ごしやすさ、料金の条件、集まりやすさまで。判断の手がかりを揃えた店選びを、社員の日常に届けます。</p><p>目指すのは、食事代の補助ではなく、<strong>会社が会員体験を用意する福利厚生。</strong>基本の店舗情報やレビューの独立性を大切にしながら、有料会員ならではの使い方を検証します。</p></div></section>
    <section className="corporate-scenes"><div className="page-width corporate-section"><div className="corporate-section-title"><div><p className="eyebrow">THREE MOMENTS TO USE IT</p><h2>仕事の外にも、<br />大切な一席がある。</h2></div><p>想定している、社員の利用シーン。<br />特定の店舗・コース・特典の提供を示すものではありません。</p></div><div className="corporate-scene-grid">
      {[{icon:Gift,no:'01',title:'ふたりの記念日に',scene:'ANNIVERSARY',text:'誕生日や結婚記念日。コースの総額、席の種類、予約時に伝えることを確認して、無理のない予算で一軒を選ぶ。',tags:'コースの条件 / 席の種類 / 追加料金'}, {icon:Users,no:'02',title:'家族が集まる日に',scene:'WITH FAMILY',text:'両親との食事や家族のお祝い。人数に合う個室、駅からの道順、営業情報を確かめる。未確認の設備はお店に相談する。',tags:'人数 / 個室の条件 / アクセス'}, {icon:CalendarHeart,no:'03',title:'週末の小さなご褒美に',scene:'A LITTLE TREAT',text:'友人やパートナーと、いつもとは違う食事へ。気になる料理から候補を探し、お店ごとの条件を比べてみる。',tags:'料理 / 予算の目安 / 営業情報'}].map(({icon:Icon,...item}) => <article key={item.no}><div className="scene-art"><span>{item.no}</span><Icon size={42} strokeWidth={1} /><small>{item.scene}</small></div><h3>{item.title}</h3><p>{item.text}</p><small>{item.tags}</small></article>)}
    </div></div></section>
    <section className="page-width corporate-section"><div className="corporate-section-title"><div><p className="eyebrow">FOR YOUR COMPANY. FOR YOUR PEOPLE.</p><h2>企業にも、使う人にも、<br />意味のある仕組みへ。</h2></div><p>導入効果を保証するものではありません。<br />双方の使いやすさを確かめながら設計します。</p></div><div className="corporate-audience-switch" role="group" aria-label="知りたい立場を選ぶ">{Object.entries(audiences).map(([key,value]) => <button key={key} aria-pressed={audience===key} onClick={() => setAudience(key as keyof typeof audiences)}>{value.label}<ArrowRight size={16} /></button>)}</div><div className="corporate-audience-panel" aria-live="polite"><div><h3>{panel.title}</h3><p>{panel.intro}</p></div><dl>{panel.points.map(([title,text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl></div></section>
    <section className="corporate-scope"><div className="page-width corporate-section"><div className="corporate-section-title"><div><p className="eyebrow">WHAT THE MEMBERSHIP MEANS</p><h2>会員利用料と、飲食代。<br />役割を分けて考えます。</h2></div><p>飲食代の補助とは別のプランです。<br />下記は設計方針で、提供済みの料金プランではありません。</p></div><div className="corporate-scope-grid"><article><span className="scope-label">基本サービスの方針</span><h3>情報の信頼を、すべての人に。</h3><ul><li>店舗の基本情報と、出典・確認日</li><li>未確認の条件がわかる表示</li><li>基本の店舗情報・レビューは無料の方針</li></ul><p>口コミの公開受付は準備中。店舗からの対価で高評価や上位表示を保証しません。</p></article><article className="scope-premium"><span className="scope-label">法人会員向けに検討中</span><h3>社員の店選びを、もう一歩先へ。</h3><ul><li>企業契約による社員への会員機能の提供</li><li>目的・利用場面に合わせた会員向け編集情報</li><li>合意できた店舗の優待や限定予約枠</li></ul><p>機能・料金は未確定。優待・限定枠はまだ提供しておらず、予約や席を保証しません。</p></article><article><span className="scope-label">会員利用料に含む前提ではないもの</span><h3>食事の費用と予約は、別途。</h3><ul><li>店舗での飲食代・追加料金</li><li>予約代行や予約の確約</li><li>交通費、キャンセル料など</li></ul><p>予約・支払いは店舗の条件に従います。食事補助や一括精算は現在提供していません。</p></article></div></div></section>
    <section className="page-width corporate-section corporate-journey"><div><p className="eyebrow">HOW IT WOULD WORK</p><h2>会社から社員へ。<br />利用までのイメージ。</h2><p>現在は提供準備中です。<br />契約・社員招待・利用権管理の機能はまだありません。</p></div><ol>{[['企業がプランを検討','対象社員、利用地域、必要な会員機能を確認。料金と提供内容に合意してから契約する想定です。'],['対象社員へ利用権を配布','配布方法と本人確認、入退社時の扱いを整備。会社が会員利用料を負担し、対象社員が利用する設計です。'],['社員が、自分の食事で使う','会員向け情報からお店を検討し、店舗の条件を確認して予約・支払い。飲食代が会社負担になるわけではありません。'],['利用実態を見て、継続を判断','利用意向、使いやすさ、満足度を確認する方法を企業と相談。個人の食事履歴を会社へ開示する前提にはしません。']].map(([title,text],i) => <li key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
    <section className="page-width corporate-section corporate-start"><div><p className="eyebrow">A FOCUSED START</p><h2>使える地域と、<br />使いたい場面から。</h2></div><div><p>東京・大阪・名古屋・福岡を見据え、現在の店舗情報は名古屋のみ対応しています。掲載の公開状況は店舗一覧でご確認ください。</p><p>福利厚生の利用地域と社員の生活圏が合うか、特別な日の用途に偏りすぎないか。導入前に確かめたいポイントです。特定業界に限定せず、企業ごとの利用ニーズを伺う準備を進めています。</p><a className="text-link" href="#/nagoya">現在の店舗一覧を見る<ArrowRight size={16} /></a><p className="corporate-secondary-use">業務での会食や幹事の店選びも、副次的な活用方法として検討します。福利厚生利用とは利用目的・社内ルールを分けて設計します。</p></div></section>
    <section className="page-width corporate-section corporate-faq"><p className="eyebrow">BEFORE YOU DECIDE</p><h2>導入前の疑問に。</h2>{[
      ['社員の飲食代も含まれますか？','会社が負担する想定なのは、サイトの有料会員機能の利用料です。飲食代の負担や食事補助は含む前提ではなく、別途検討が必要です。'],
      ['料金・最低人数・開始日は決まっていますか？','いずれも未定です。対象人数、必要な機能、運用方法を踏まえて設計します。現在は申込み・契約・決済を受け付けていません。'],
      ['社員はどんな有料機能を使えますか？','目的に応じた会員向け編集情報など、店選びを助ける機能を検討中です。具体的な提供範囲は未確定です。店舗優待・限定予約枠は、店舗との合意と運用の確認後にご案内します。'],
      ['会員限定店の予約はできますか？','まだできません。特定日時の会員限定枠などを検討していますが、提携店舗・確保済みの席はありません。掲載している店舗が限定予約に参加することを意味しません。'],
      ['社員の利用情報は会社に共有されますか？','個人の食事履歴を会社へ開示する前提ではありません。利用状況をどの範囲で確認するか、目的・保管期間・社員への説明を開始前に定めます。'],
      ['福利厚生費や非課税の扱いになりますか？','法人会員費と食事補助は別の仕組みです。税務上の扱いは各社の制度と利用実態によるため、特定の経費処理・非課税を保証せず、専門家への確認が必要です。'],
    ].map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <section className="corporate-consultation" id="consultation" tabIndex={-1}><div className="page-width corporate-section"><div><p className="eyebrow">LET’S DESIGN A BENEFIT PEOPLE USE</p><h2>社員に届けたい<br />食の体験から、考える。</h2><p>対象社員、使いたい地域、必要な機能。<br />社内での検討に使える確認リストをご用意しました。</p><button className="outline-button" onClick={() => void copy()}>{copyState.startsWith('確認リスト') ? <Check size={16} /> : <Copy size={16} />}確認リストをコピー</button>{copyState && <p role="status">{copyState}</p>}<p className="consultation-disclosure">お問い合わせ窓口は準備中です。このページでは会社名・連絡先などを入力・保存・送信しません。</p></div><pre className="consultation-checklist">{checklist}</pre></div></section>
  </div>;
}

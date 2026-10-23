import { ArrowRight } from 'lucide-react';
import type { Page } from '../types';
export default function About({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return <div className="page-width about-page">
    <div className="page-heading"><p className="eyebrow">ABOUT EXECUTIVE DINING</p><h1>会食専用口コミサイト</h1><p>利用した人の声を、次の会食のお店選びに。</p></div>
    <div className="about-copy">
      <section><h2>接待やビジネスの会食を準備する方へ</h2><p>料理だけでなく、落ち着いて話せたか、接客はどうだったか。Executive Diningは、会食での体験を手がかりにお店を選ぶための口コミサイトです。</p><p>口コミは利用者の体験・感想として掲載し、料金や個室などの公式情報と分けて表示します。</p></section>
      <section><h2>現在の利用範囲</h2><p>口コミの一般投稿受付と会員登録は準備中です。実際に公開された口コミだけを表示し、0件をサンプルの評価で埋めることはありません。</p><p>店舗情報が閲覧できる範囲は、公開状況や接続設定、招待アカウントの権限によって異なります。口コミの下書き画面で保存した内容は、このブラウザ内だけに残り、公開送信はされません。</p><p>閲覧専用デモでは、公開済みの公式情報の記録を使って、一覧・詳細・比較の画面を確認できます。掲載口コミはまだなく、予約・投稿・会員登録はできません。</p></section>
      <section><h2>予約の前に</h2><p>最新の価格やコース、個室の条件、アレルギー対応、キャンセル規定は、公式サイトまたは店舗に直接ご確認ください。個室という表記だけで、防音性や機密性が保証されるものではありません。このサイト内での空席確認・予約・決済には対応していません。</p></section>
      <button className="primary-button" onClick={() => onNavigate('find')}>お店を探す<ArrowRight size={16} aria-hidden="true" /></button>
    </div>
  </div>;
}

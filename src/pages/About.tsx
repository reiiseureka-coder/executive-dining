import { ArrowRight } from "lucide-react";
import type { Page } from "../types";
export default function About({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  return (
    <div className="page-width about-page">
      <div className="page-heading">
        <p className="eyebrow">ABOUT EXECUTIVE DINING</p>
        <h1>Executive Diningについて</h1>
        <p>個室やコース料金を確認しながら、会食のお店を探せます。</p>
      </div>
      <div className="about-copy">
        <section>
          <h2>どんなサービスか</h2>
          <p>
            Executive Diningは、会食のお店を探して比較するためのサービスです。
            個室やコース料金などの公式情報を確認し、情報源と確認日を添えて掲載します。
          </p>
        </section>
        <section>
          <h2>いま使えること</h2>
          <ul>
            <li>
              名古屋の公開情報を店名・住所・料理・確認できる情報から検索
            </li>
            <li>
              候補の保存（このブラウザ内に保存。アカウント間の同期はありません）
            </li>
            <li>検索条件を含むURLの共有と、店舗詳細の閲覧</li>
            <li>
              公式のコース料金・条件・営業のお知らせを出典と確認日付きで閲覧
            </li>
          </ul>
        </section>
        <section>
          <h2>掲載情報と準備中の機能</h2>
          <p>
            公開一覧には、公式情報を確認して掲載を承認したお店を表示します。確認できない項目は「未確認」と表示します。料金や空席、会食への向き・不向きを推測して掲載することはありません。
          </p>
          <p>
            口コミの投稿・掲載申請・AI分析は準備中です。空席の確認や予約もできません。デモ画面では6件のサンプルで検索や下書きの保存を試せます。サンプルの情報は予約には使えません。
          </p>
        </section>
        <section>
          <h2>予約の前に</h2>
          <p>
            最新の価格やコース、個室の条件、アレルギー対応、キャンセル規定を公式サイトまたは店舗に直接ご確認ください。個室という表記だけで、防音性や機密性が保証されるものではありません。
          </p>
        </section>
        <button className="primary-button" onClick={() => onNavigate("nagoya")}>
          お店を探す
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

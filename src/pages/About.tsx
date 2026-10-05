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
        <h1>会食の店選びを、丁寧に。</h1>
        <p>料理だけでなく、会話をする場所としてお店を考える。</p>
      </div>
      <div className="about-copy">
        <section>
          <h2>一席を選ぶために</h2>
          <p>
            予算、個室、アクセス。会食では、おいしい料理と同じくらい大切な条件があります。Executive
            Dining
            は、条件を整理しながら候補を探すためのサービスを目指しています。
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
          <h2>掲載情報と、準備中の機能</h2>
          <p>
            通常の掲載画面は、公式情報を項目ごとに確認した店舗だけを扱います。確認できない情報は未確認と表示し、価格や空席、会食適性を推測して補いません。掲載準備中の候補は公開一覧に表示しません。
          </p>
          <p>
            口コミ受付・掲載申請・AI分析は準備中です。空席照会や予約確定はできません。別のデモ画面では6件のサンプルとローカル下書きを試せますが、予約判断には利用できません。
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

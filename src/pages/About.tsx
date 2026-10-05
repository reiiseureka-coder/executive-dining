import { ArrowRight } from "lucide-react";
import type { Page } from "../types";
import SampleNotice from "../components/SampleNotice";
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
      <SampleNotice />
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
              店名・エリア・料理からの検索と、個室・予算・時間帯の絞り込み
            </li>
            <li>
              候補の保存（このブラウザ内に保存。アカウント間の同期はありません）
            </li>
            <li>検索条件を含むURLの共有と、店舗詳細の閲覧</li>
            <li>
              口コミの下書き保存（このブラウザ内のみ。公開・送信はされません）
            </li>
          </ul>
        </section>
        <section>
          <h2>掲載情報と、準備中の機能</h2>
          <p>
            現在は6店のサンプルデータを使用しています。店舗名が実在していても、写真はイメージであり、価格・個室設備・営業時間・評価・口コミは取材や実体験に基づく情報ではありません。店舗による掲載承認や提携を示すものでもありません。
          </p>
          <p>
            実店舗データと口コミの公開、掲載申請の反映、AI分析は、データ確認・バックエンド整備後に提供予定です。空席照会や予約確定はできません。
          </p>
        </section>
        <section>
          <h2>予約の前に</h2>
          <p>
            最新の価格やコース、個室の条件、アレルギー対応、キャンセル規定を公式サイトまたは店舗に直接ご確認ください。個室という表記だけで、防音性や機密性が保証されるものではありません。
          </p>
        </section>
        <button className="primary-button" onClick={() => onNavigate("search")}>
          お店を探す
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

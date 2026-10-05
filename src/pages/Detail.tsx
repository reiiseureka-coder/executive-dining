import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  MapPin,
  ArrowUpRight,
  Check,
  Save,
  Lock,
} from "lucide-react";
import type { Page } from "../types";
import { restaurants, reviews as allReviews } from "../data/mockData";
import { useSavedRestaurants } from "../hooks/useSavedRestaurants";
import { readDraft } from "../lib/drafts";
import SampleNotice from "../components/SampleNotice";
import StarRating from "../components/StarRating";
interface DetailProps {
  restaurantId: string;
  onNavigate: (page: Page, id?: string) => void;
}
const initialDraft = {
  author: "",
  authorRole: "",
  rating: 0,
  comment: "",
  occasion: "",
  privateRoomDetail: "",
  priceSpent: "",
};
const specLabels = {
  serviceQuality: "接客",
  quietness: "静かさ",
  accessEase: "アクセス",
  confidentiality: "機密性",
  ambiance: "雰囲気",
};
export default function Detail({ restaurantId, onNavigate }: DetailProps) {
  const restaurant = restaurants.find((entry) => entry.id === restaurantId);
  const reviews = allReviews.filter(
    (entry) => entry.restaurantId === restaurantId,
  );
  const { savedIds, toggleSaved, storageWarning } = useSavedRestaurants();
  const draftKey = `executive-dining:review-draft:${restaurantId}`;
  const [draft, setDraft] = useState(() => readDraft(draftKey, initialDraft));
  const [tab, setTab] = useState<"info" | "reviews" | "write">("info");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  if (!restaurant)
    return (
      <div className="page-width empty-state">
        <h1>店舗が見つかりませんでした。</h1>
        <p>URLをご確認いただくか、お店の一覧から探してください。</p>
        <button className="primary-button" onClick={() => onNavigate("search")}>
          お店の一覧へ
        </button>
      </div>
    );
  const saved = savedIds.includes(restaurantId);
  const update = (key: keyof typeof initialDraft, value: string | number) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback("");
    setError("");
  };
  const saveDraft = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback("");
    setError("");
    if (
      !draft.author.trim() ||
      !draft.comment.trim() ||
      draft.rating < 1 ||
      draft.rating > 5
    ) {
      setError("お名前・本文・1〜5の総合評価を入力してください。");
      return;
    }
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          ...draft,
          author: draft.author.trim(),
          comment: draft.comment.trim(),
        }),
      );
      setFeedback(
        "このブラウザに下書きを保存しました。公開・送信はされていません。",
      );
    } catch {
      setError(
        "下書きを保存できませんでした。ブラウザの保存設定や空き容量をご確認ください。入力内容はこの画面に残っています。",
      );
    }
  };
  return (
    <div className="page-width detail-page">
      <div className="detail-navigation">
        <button className="text-link" onClick={() => onNavigate("search")}>
          <ArrowLeft size={16} />
          条件を保って一覧に戻る
        </button>
        <button
          className={`outline-button ${saved ? "saved-detail" : ""}`}
          aria-pressed={saved}
          onClick={() => toggleSaved(restaurantId)}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          {saved ? "候補に保存済み" : "候補に保存"}
        </button>
      </div>
      <SampleNotice />
      {storageWarning && (
        <p role="status" className="form-error">
          {storageWarning}
        </p>
      )}
      <section className="detail-heading">
        <div>
          <p className="eyebrow">
            {restaurant.genre} / {restaurant.area}
          </p>
          <h1>{restaurant.name}</h1>
          <p className="detail-name-en">{restaurant.nameEn}</p>
          <p className="restaurant-station">
            <MapPin size={14} />
            {restaurant.nearestStation}
          </p>
          <div className="detail-summary">
            <span>
              <small>個室の例</small>
              {restaurant.privateRoomType}
            </span>
            <span>
              <small>予算目安の例 / 人</small>¥
              {restaurant.avgPricePerPerson.toLocaleString()}
            </span>
          </div>
          <p className="sample-caption">
            価格・設備はサンプルで、現在の営業情報ではありません。
          </p>
        </div>
        <figure>
          <img
            src={restaurant.imageUrl}
            alt={`${restaurant.genre}のイメージ写真。店舗の実写ではありません。`}
          />
          <figcaption>イメージ写真</figcaption>
        </figure>
      </section>
      <nav className="detail-tabs" aria-label="店舗詳細メニュー">
        {[
          { key: "info", label: "店舗情報" },
          { key: "reviews", label: `口コミ例（${reviews.length}）` },
          { key: "write", label: "口コミの下書き" },
        ].map(({ key, label }) => (
          <button
            key={key}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => setTab(key as typeof tab)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "info" && (
        <div className="detail-columns">
          <div className="detail-main">
            <section className="detail-section">
              <p className="eyebrow">SAMPLE PROFILE</p>
              <h2>お店について</h2>
              <p>{restaurant.description}</p>
              <p className="sample-caption">
                説明文は動作確認用の例です。実店舗による掲載承認や取材に基づく情報ではありません。
              </p>
            </section>
            <section className="detail-section">
              <h2>会食の条件</h2>
              <dl className="details-list">
                {[
                  ["個室", restaurant.privateRoomDetail],
                  ["人数", restaurant.privateRoomCapacity],
                  ["コース", restaurant.courseType],
                  ["価格帯", restaurant.priceRange],
                  ["支払い", restaurant.paymentMethods.join("・")],
                  ["服装", restaurant.dressCode],
                  ["喫煙", restaurant.smokingPolicy],
                  ["営業時間", restaurant.openHours],
                  ["定休日", restaurant.closedDays],
                  ["住所", restaurant.address],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="sample-caption">
                この欄の情報はすべてサンプルです。店舗の公式情報で再確認してください。
              </p>
            </section>
            <section className="detail-section">
              <h2>評価の表示例</h2>
              <p className="sample-caption">
                実際の利用者評価ではありません。店舗間の優劣を示すものではありません。
              </p>
              <div className="sample-scores">
                {Object.entries(restaurant.businessSpecs).map(
                  ([key, value]) => (
                    <div key={key}>
                      <span>{specLabels[key as keyof typeof specLabels]}</span>
                      <meter
                        min={0}
                        max={5}
                        value={value}
                        aria-label={`${specLabels[key as keyof typeof specLabels]}のサンプル評価`}
                      />
                      <span>{value} / 5</span>
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>
          <aside className="detail-aside">
            <h2>予約前の確認メモ</h2>
            <p>サンプルから探した候補は、公式情報で条件を確かめてから。</p>
            <ul>
              {[
                "人数・日時と個室の空き",
                "個室料・サービス料を含む総額",
                "アレルギー・食事制限への対応",
                "席の仕切りと音の通り方",
                "変更・キャンセルの期限と料金",
              ].map((item) => (
                <li key={item}>
                  <Check size={14} />
                  {item}
                </li>
              ))}
            </ul>
            <a
              className="outline-button"
              href={`https://www.google.com/search?q=${encodeURIComponent(`${restaurant.name} ${restaurant.area} 公式サイト`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              公式情報を検索
              <ArrowUpRight size={15} />
            </a>
            <p className="sample-caption">
              Google検索へ移動します。予約の受付・空席確認は行っていません。
            </p>
            <div className="ai-preparation">
              <Lock size={16} />
              <h3>AI分析は準備中</h3>
              <p>確認済みデータと安全なサーバー接続の整備後に公開予定です。</p>
            </div>
          </aside>
        </div>
      )}
      {tab === "reviews" && (
        <section className="review-section">
          <h2>口コミの表示サンプル</h2>
          <p className="sample-caption">
            以下は架空の投稿例です。実際の来店・評価の記録ではありません。
          </p>
          {reviews.length ? (
            reviews.map((review) => (
              <article key={review.id} className="review-example">
                <div>
                  <strong>{review.author}（サンプル）</strong>
                  <span>{review.date}</span>
                </div>
                <StarRating value={review.rating} readonly size={15} />
                <p>{review.comment}</p>
                {review.privateRoomDetail && (
                  <p className="review-room">
                    <Lock size={13} />
                    {review.privateRoomDetail}
                  </p>
                )}
                <small>利用シーン例：{review.occasion}</small>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <p>このお店の口コミサンプルはありません。</p>
            </div>
          )}
        </section>
      )}
      {tab === "write" && (
        <section className="review-section">
          <h2>口コミの下書き</h2>
          <p className="sample-caption">
            入力内容は保存ボタンを押すと、このブラウザ内にのみ保存されます。公開投稿・送信はされません。共有端末では個人情報を入力しないでください。
          </p>
          <form className="review-form" onSubmit={saveDraft}>
            <div className="review-form-row">
              <label>
                お名前（必須）
                <input
                  required
                  maxLength={80}
                  value={draft.author}
                  onChange={(event) => update("author", event.target.value)}
                />
              </label>
              <label>
                役職・立場（任意）
                <input
                  maxLength={100}
                  value={draft.authorRole}
                  onChange={(event) => update("authorRole", event.target.value)}
                />
              </label>
            </div>
            <fieldset>
              <legend>総合評価（必須）</legend>
              <StarRating
                value={draft.rating}
                onChange={(value) => update("rating", value)}
                size={26}
              />
            </fieldset>
            <label>
              利用シーン
              <input
                maxLength={200}
                value={draft.occasion}
                onChange={(event) => update("occasion", event.target.value)}
                placeholder="例：取引先との会食"
              />
            </label>
            <label>
              本文（必須）
              <textarea
                required
                rows={5}
                maxLength={5000}
                value={draft.comment}
                onChange={(event) => update("comment", event.target.value)}
              />
            </label>
            <label>
              個室について
              <textarea
                rows={3}
                maxLength={2000}
                value={draft.privateRoomDetail}
                onChange={(event) =>
                  update("privateRoomDetail", event.target.value)
                }
              />
            </label>
            <label>
              1人あたりの支払い金額
              <input
                value={draft.priceSpent}
                maxLength={80}
                onChange={(event) => update("priceSpent", event.target.value)}
                placeholder="例：20,000円（飲み物・サービス料込み）"
              />
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {feedback && (
              <p role="status" className="sample-notice">
                {feedback}
              </p>
            )}
            <button className="primary-button" type="submit">
              <Save size={16} />
              下書きをこのブラウザに保存
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export default function SampleNotice({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <aside className="sample-notice">
      <span className="eyebrow">PREVIEW</span>
      <p>
        {compact
          ? "掲載情報・写真・評価はサンプルです。ご予約には利用できません。"
          : "このサイトはプレビュー版です。掲載している店舗情報・写真・価格・評価・口コミは動作確認用のサンプルで、実際の店舗の最新情報や体験を保証するものではありません。予約前に必ず公式情報をご確認ください。"}
      </p>
    </aside>
  );
}

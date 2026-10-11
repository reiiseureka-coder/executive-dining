export default function SampleNotice({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <aside className="sample-notice">
      <span className="eyebrow">DEMO</span>
      <p>
        {compact
          ? "掲載情報・写真・評価はサンプルです。ご予約には利用できません。"
          : "この画面はデモです。店舗情報・写真・価格・評価・口コミはサンプルで、実際の営業情報や来店記録ではありません。予約には使わず、公式サイトや店舗で最新情報をご確認ください。"}
      </p>
    </aside>
  );
}

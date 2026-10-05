/** Rendered only inside the workspace after the backend editor-access check succeeds. */
export default function ReviewReadiness() {
  return <details className="review-readiness"><summary>口コミ受付を開始する前の確認</summary><p>現在、口コミの送信・審査・通報の操作は接続していません。店舗の掲載承認とは別工程です。</p><ul><li>本人の投稿一覧、取り下げ、訂正後の再審査と結果確認</li><li>店舗との関係・招待/特典の申告と公開ルール</li><li>通報/公式情報訂正の受付、対応担当、対応履歴</li><li>個人情報・中傷・転載の確認、自己承認の禁止、理由を残した審査</li><li>重複送信防止・送信上限・削除/保存期間・運営窓口</li></ul><p>店舗情報と利用者の体験は別に審査します。ここに架空の口コミや審査待ち件数は表示しません。</p></details>;
}

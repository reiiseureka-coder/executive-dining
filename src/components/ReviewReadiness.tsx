/** Rendered only inside the workspace after the backend editor-access check succeeds. */
export default function ReviewReadiness() {
  return <details className="review-readiness"><summary>口コミ受付を開始する前の確認</summary><p>口コミの送信・審査・通報は、まだ利用できません。受付の開始には、店舗の掲載承認とは別の準備が必要です。</p><ul><li>本人の投稿一覧、取り下げ、訂正後の再審査と結果確認</li><li>店舗との関係、招待・特典の申告と公開ルール</li><li>通報・公式情報の訂正依頼の受付、対応担当、対応履歴</li><li>個人情報・中傷・転載の確認、自分の投稿の承認禁止、審査理由の記録</li><li>重複送信の防止、送信回数の上限、データの削除・保存期間、運営窓口</li></ul><p>店舗情報と利用者の口コミは、それぞれ審査します。架空の口コミや、実際には存在しない審査待ち件数は表示しません。</p></details>;
}

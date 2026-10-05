import { useState } from 'react';
import { currentVisitMonth, decodeReviewDraft, emptyReviewDraft, RELATIONSHIP_LABELS, reviewDraftErrors, type ReviewDraft } from '../domain/reviews';
import { useLocalDraft } from '../hooks/useLocalDraft';
import LocalDraftActions from './LocalDraftActions';
export default function ReviewDraftPanel({ restaurantId }: { restaurantId: string }) {
  const draft = useLocalDraft(`executive-dining:visit-draft:v1:${restaurantId}`, emptyReviewDraft, decodeReviewDraft);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const update = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => { draft.update({ ...draft.value, [key]: value }); setPreview(false); setErrors([]); };
  return <details className="visit-draft"><summary>来店体験を下書きに残す</summary><p>口コミの受付は準備中です。今は自分の体験を整理して保存できます。運営者には届かず、公開されません。</p><p className="draft-privacy-note">訪問日は月まで。会食相手・会社名・連絡先・予約番号・支払い情報は記入しないでください。第三者の口コミの転載や、訪問していない体験の作成はできません。</p>
    <form onSubmit={event => { event.preventDefault(); const next = reviewDraftErrors(draft.value); setErrors(next); setPreview(next.length === 0); }} noValidate>
      <div className="review-draft-grid"><label>公開用ニックネーム<input maxLength={40} autoComplete="off" value={draft.value.displayName} onChange={event => update('displayName', event.target.value)} /></label><label>訪問月<input type="month" min="2000-01" max={currentVisitMonth()} value={draft.value.visitedMonth} onChange={event => update('visitedMonth', event.target.value)} /></label></div>
      <label>店舗との関係<select value={draft.value.relationship} onChange={event => update('relationship', event.target.value as ReviewDraft['relationship'])}><option value="">選択してください</option>{Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <p className="draft-privacy-note">関係性は公開前の審査に必要です。招待・特典がある体験や店舗関係者の扱いは、受付開始までに方針を確定します。</p>
      <label>体験の総合評価<select value={draft.value.rating} onChange={event => update('rating', Number(event.target.value))}><option value={0}>選択してください</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
      <label>本人の体験本文<textarea rows={6} maxLength={2000} value={draft.value.comment} onChange={event => update('comment', event.target.value)} placeholder="実際に体験したことを、自分の言葉で。印象と事実を分けて記録してください。" /></label><p className="draft-privacy-note">{draft.value.comment.length} / 2000文字。公式の設備・料金情報を更新する場合は、下の訂正メモを使ってください。</p>
      <label className="draft-check"><input type="checkbox" checked={draft.value.hasVisited} onChange={event => update('hasVisited', event.target.checked)} />本人が実際に訪問した体験です</label><label className="draft-check"><input type="checkbox" checked={draft.value.privacyChecked} onChange={event => update('privacyChecked', event.target.checked)} />個人情報・会食相手・機密情報を含めていません</label>
      <LocalDraftActions {...draft} /><button className="button-secondary" type="submit">公開前の表示内容を確認</button>
    </form>
    {errors.length > 0 && <div role="alert"><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
    {preview && <section className="review-draft-preview" aria-label="口コミの送信前確認"><h3>表示内容の確認（未送信）</h3><p>{draft.value.displayName} · {draft.value.rating}/5 · {draft.value.visitedMonth}来店</p><p>店舗との関係：{RELATIONSHIP_LABELS[draft.value.relationship as keyof typeof RELATIONSHIP_LABELS]}</p><p className="draft-body">{draft.value.comment}</p><p>これは下書きの見え方です。審査済み・訪問確認済みではありません。</p><button className="button-secondary" disabled>口コミ送信は準備中</button><p>受付開始には投稿規約・個人情報の扱い・本人の取り下げ/訂正・通報対応の整備が必要です。自動送信はしません。</p></section>}
  </details>;
}

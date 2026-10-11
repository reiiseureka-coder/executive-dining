import { useState } from 'react';
import { currentVisitMonth, decodeReviewDraft, emptyReviewDraft, RELATIONSHIP_LABELS, reviewDraftErrors, type ReviewDraft } from '../domain/reviews';
import { useLocalDraft } from '../hooks/useLocalDraft';
import LocalDraftActions from './LocalDraftActions';
export default function ReviewDraftPanel({ restaurantId }: { restaurantId: string }) {
  const draft = useLocalDraft(`executive-dining:visit-draft:v1:${restaurantId}`, emptyReviewDraft, decodeReviewDraft);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const update = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => { draft.update({ ...draft.value, [key]: value }); setPreview(false); setErrors([]); };
  return <details className="visit-draft"><summary>来店の感想を下書きに残す</summary><p>口コミの受付は準備中です。今は、来店したときの体験や感想を下書きとして保存できます。運営者には送信されず、公開もされません。</p><p className="draft-privacy-note">訪問時期は月だけを記録します。会食相手・会社名・連絡先・予約番号・支払い情報は書かないでください。他の人の口コミの転載や、実際には体験していない内容の記入はできません。</p>
    <form onSubmit={event => { event.preventDefault(); const next = reviewDraftErrors(draft.value); setErrors(next); setPreview(next.length === 0); }} noValidate>
      <div className="review-draft-grid"><label>下書きのメモ名（非公開）<input maxLength={40} autoComplete="off" value={draft.value.displayName} onChange={event => update('displayName', event.target.value)} /></label><label>訪問月<input type="month" min="2000-01" max={currentVisitMonth()} value={draft.value.visitedMonth} onChange={event => update('visitedMonth', event.target.value)} /></label></div>
      <label>店舗との関係<select aria-label="店舗との関係" value={draft.value.relationship} onChange={event => update('relationship', event.target.value as ReviewDraft['relationship'])}><option value="">選択してください</option>{Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <p className="draft-privacy-note">店舗との関係は、公開前の審査で確認する予定です。招待や特典を受けた場合、店舗関係者の場合の掲載ルールは、受付開始までに決めます。</p>
      <label>体験の総合評価<select aria-label="体験の総合評価" value={draft.value.rating} onChange={event => update('rating', Number(event.target.value))}><option value={0}>選択してください</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
      <label>来店したときの体験・感想<textarea rows={6} maxLength={2000} value={draft.value.comment} onChange={event => update('comment', event.target.value)} placeholder="実際に体験したことを、ご自身の言葉で書いてください。感想と事実が区別できるように記録しましょう。" /></label><p className="draft-privacy-note">{draft.value.comment.length} / 2000文字。設備や料金などの公式情報に誤りがある場合は、「公式情報の訂正メモ」を使ってください。</p>
      <label className="draft-check"><input type="checkbox" checked={draft.value.hasVisited} onChange={event => update('hasVisited', event.target.checked)} />本人が実際に訪問した体験です</label><label className="draft-check"><input type="checkbox" checked={draft.value.privacyChecked} onChange={event => update('privacyChecked', event.target.checked)} />個人情報・会食相手・機密情報を含めていません</label>
      <LocalDraftActions {...draft} /><button className="button-secondary" type="submit">下書きの内容を確認</button>
    </form>
    {errors.length > 0 && <div role="alert"><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
    {preview && <section className="review-draft-preview" aria-label="口コミの下書き確認"><h3>下書きの確認（未送信）</h3><p>{draft.value.rating}/5 · {draft.value.visitedMonth}来店</p><p>投稿者の情報は、会員登録時にご本人が公開してよいと確認した項目を表示する予定です。この下書きのメモ名は公開しません。</p><p>店舗との関係：{RELATIONSHIP_LABELS[draft.value.relationship as keyof typeof RELATIONSHIP_LABELS]}</p><p className="draft-body">{draft.value.comment}</p><p>この表示は下書きの確認用です。審査や訪問の確認は行っていません。</p><button className="button-secondary" disabled>口コミ送信は準備中</button><p>投稿規約、個人情報の扱い、投稿の取り下げ・訂正、通報対応を整えてから受付を始めます。この下書きが自動で送信されることはありません。</p></section>}
  </details>;
}

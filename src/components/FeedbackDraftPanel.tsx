import { useState } from 'react';
import { FACT_LABELS } from '../domain/dining';
import { decodeFeedbackDraft, emptyFeedbackDraft, feedbackDraftErrors, REPORT_REASONS, type FeedbackDraft } from '../domain/reviews';
import { useLocalDraft } from '../hooks/useLocalDraft';
import LocalDraftActions from './LocalDraftActions';
export default function FeedbackDraftPanel({ restaurantId, reviewId }: { restaurantId: string; reviewId?: string }) {
  const kind = reviewId ? 'report' : 'correction';
  const draft = useLocalDraft(`executive-dining:feedback-draft:v1:${kind}:${restaurantId}:${reviewId ?? 'facts'}`, () => emptyFeedbackDraft(kind), value => { const parsed = decodeFeedbackDraft(value); return parsed?.kind === kind ? parsed : null; });
  const [errors, setErrors] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const update = <K extends keyof FeedbackDraft>(key: K, value: FeedbackDraft[K]) => { draft.update({ ...draft.value, [key]: value }); setErrors([]); setChecked(false); };
  return <details className="feedback-draft"><summary>{kind === 'report' ? 'この口コミの通報メモを作る' : '公式情報の訂正メモを作る'}</summary><p>受付窓口は準備中です。このメモは運営者へ送信されません。保存しても、店舗情報や口コミは変更されません。</p><p className="draft-privacy-note">個人名・連絡先・会食相手などは書かないでください。個人情報を含む箇所を知らせる場合も、そのまま転載せず、どの部分に問題があるかを短く説明してください。</p><form noValidate onSubmit={event => { event.preventDefault(); const next = feedbackDraftErrors(draft.value); setErrors(next); setChecked(!next.length); }}>
    {kind === 'correction' ? <><label>訂正を希望する項目<select aria-label="訂正を希望する項目" value={draft.value.field} onChange={event => update('field', event.target.value as FeedbackDraft['field'])}><option value="">選択してください</option>{Object.entries(FACT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>確認に使える公式ページURL<input type="url" maxLength={2000} value={draft.value.sourceUrl} onChange={event => update('sourceUrl', event.target.value)} /></label></> : <label>通報の理由<select aria-label="通報の理由" value={draft.value.reason} onChange={event => update('reason', event.target.value as FeedbackDraft['reason'])}><option value="">選択してください</option>{Object.entries(REPORT_REASONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
    <label>確認してほしい内容<textarea rows={4} maxLength={2000} value={draft.value.detail} onChange={event => update('detail', event.target.value)} /></label><LocalDraftActions {...draft} /><button className="button-secondary" type="submit">メモの入力内容を確認</button></form>{errors.length > 0 && <div role="alert"><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}{checked && <div className="review-draft-preview" role="status"><p>必要な項目が入力されています。このメモは未送信で、受付番号は発行されていません。</p><button className="button-secondary" disabled>{kind === 'report' ? '通報の受付は準備中' : '訂正依頼の受付は準備中'}</button></div>}</details>;
}

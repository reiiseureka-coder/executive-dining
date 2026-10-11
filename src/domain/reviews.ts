import { FACT_LABELS, safeExternalUrl, type FactField, type ReviewStatus } from './dining.ts';
export const RELATIONSHIP_LABELS = { customer: '通常の利用客', invited: '招待・無償提供・特典を受けた利用客', affiliated: '店舗の経営者・従業員・業務上の関係者' } as const;
export type ReviewRelationship = keyof typeof RELATIONSHIP_LABELS;
export interface ReviewDraft { displayName: string; visitedMonth: string; relationship: ReviewRelationship | ''; rating: number; comment: string; hasVisited: boolean; privacyChecked: boolean }
export const emptyReviewDraft = (): ReviewDraft => ({ displayName: '', visitedMonth: '', relationship: '', rating: 0, comment: '', hasVisited: false, privacyChecked: false });
export const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const bounded = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;
export function decodeReviewDraft(value: unknown): ReviewDraft | null {
  if (!object(value) || !bounded(value.displayName, 40) || !bounded(value.comment, 2000) || !bounded(value.visitedMonth, 7) || typeof value.rating !== 'number' || !Number.isInteger(value.rating) || value.rating < 0 || value.rating > 5 || (value.relationship !== '' && !Object.hasOwn(RELATIONSHIP_LABELS, String(value.relationship)))) return null;
  // Do not restore declarations or arbitrary fields such as email, company, exact date, or author UUID.
  return { displayName: value.displayName, comment: value.comment, visitedMonth: value.visitedMonth, rating: value.rating, relationship: value.relationship as ReviewDraft['relationship'], hasVisited: false, privacyChecked: false };
}
export function currentVisitMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit' }).formatToParts(now);
  return `${parts.find(part => part.type === 'year')!.value}-${parts.find(part => part.type === 'month')!.value}`;
}
export function reviewDraftErrors(draft: ReviewDraft, now = new Date()): string[] {
  const errors: string[] = [];
  if (draft.displayName.length > 40) errors.push('下書きのメモ名は40文字以内で入力してください。');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(draft.visitedMonth) || draft.visitedMonth < '2000-01' || draft.visitedMonth > currentVisitMonth(now)) errors.push('訪問月は2000年1月から今月までの年月で入力してください。');
  if (!Object.hasOwn(RELATIONSHIP_LABELS, draft.relationship)) errors.push('店舗との関係を選択してください。');
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) errors.push('評価を1〜5から選択してください。');
  if (draft.comment.trim().length < 10 || draft.comment.length > 2000) errors.push('体験本文を10〜2000文字で入力してください。');
  if (!draft.hasVisited) errors.push('本人の実際の訪問体験であることを確認してください。');
  if (!draft.privacyChecked) errors.push('個人情報・会食相手・機密情報を含めていないことを確認してください。');
  return errors;
}
export const REPORT_REASONS = { privacy: '個人情報・機密情報', non_visit: '実体験ではない疑い', relationship: '関係性・特典の申告', abuse: '中傷・嫌がらせ', spam: '広告・重複', other: 'その他' } as const;
export interface FeedbackDraft { kind: 'correction' | 'report'; field: FactField | ''; sourceUrl: string; reason: keyof typeof REPORT_REASONS | ''; detail: string }
export const emptyFeedbackDraft = (kind: FeedbackDraft['kind']): FeedbackDraft => ({ kind, field: '', sourceUrl: '', reason: '', detail: '' });
export function decodeFeedbackDraft(value: unknown): FeedbackDraft | null {
  if (!object(value) || !['correction', 'report'].includes(String(value.kind)) || !bounded(value.sourceUrl, 2000) || !bounded(value.detail, 2000) || (value.field !== '' && !Object.hasOwn(FACT_LABELS, String(value.field))) || (value.reason !== '' && !Object.hasOwn(REPORT_REASONS, String(value.reason)))) return null;
  return { kind: value.kind as FeedbackDraft['kind'], field: value.field as FeedbackDraft['field'], sourceUrl: value.sourceUrl, reason: value.reason as FeedbackDraft['reason'], detail: value.detail };
}
export function feedbackDraftErrors(draft: FeedbackDraft): string[] {
  const errors: string[] = [];
  if (draft.detail.trim().length < 10 || draft.detail.length > 2000) errors.push('確認してほしい内容を10〜2000文字で入力してください。');
  if (draft.kind === 'correction') {
    if (!Object.hasOwn(FACT_LABELS, draft.field)) errors.push('訂正を希望する項目を選択してください。');
    if (!safeExternalUrl(draft.sourceUrl)?.startsWith('https:') || draft.sourceUrl.length > 2000) errors.push('確認に使える公式ページのHTTPS URLを入力してください。');
  } else if (!Object.hasOwn(REPORT_REASONS, draft.reason)) errors.push('通報の理由を選択してください。');
  return errors;
}
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = { pending: '審査待ち', approved: '公開中', rejected: '非公開', withdrawn: '本人が取り下げ' };
export interface ModerationReview { id: string; authorId: string | null; status: ReviewStatus; version: number }
/** Client-side preflight only. The server must independently enforce this in the transaction. */
export function moderationPreflight(review: ModerationReview, actorId: string, canModerate: boolean, expectedVersion: number, next: 'approved' | 'rejected', reason: string): string | null {
  if (!canModerate || !isUuid(actorId)) return '審査権限が必要です。';
  if (!review.authorId || review.authorId === actorId || review.status === 'withdrawn') return 'この口コミは審査できません。';
  if (review.version !== expectedVersion || !Number.isInteger(expectedVersion) || expectedVersion < 1) return '内容が更新されています。再読み込みしてください。';
  if (!['approved', 'rejected'].includes(next) || review.status === next) return '状態を確認してください。';
  if (!reason.trim() || reason.length > 1000) return '審査理由を1〜1000文字で入力してください。';
  return null;
}

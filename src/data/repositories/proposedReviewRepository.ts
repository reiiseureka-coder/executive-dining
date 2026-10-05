/** Proposed v2 contract, NOT connected by diningClient or any UI. Existing v1 RPCs must stay ungranted.
 * New server implementation, policy approval, authorization tests and rollout approval are required first.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { feedbackDraftErrors, isUuid, moderationPreflight, reviewDraftErrors, type FeedbackDraft, type ModerationReview, type ReviewDraft, REVIEW_STATUS_LABELS, RELATIONSHIP_LABELS } from '../../domain/reviews.ts';
export type ReviewErrorCode = 'unavailable' | 'denied' | 'invalid' | 'conflict' | 'duplicate' | 'unconfirmed';
const messages: Record<ReviewErrorCode, string> = {
  unavailable: '受付の準備が完了していません。下書きは送信されていません。',
  denied: 'この操作の権限を確認できませんでした。', invalid: '入力内容と受付条件を確認してください。',
  conflict: '内容が更新されています。再読み込みして確認してください。', duplicate: '同じ内容の受付状況を先に確認してください。',
  unconfirmed: '送信結果を確認できません。自動再送はしていません。受付状況を確認してから操作してください。',
};
export class ReviewGatewayError extends Error {
  code: ReviewErrorCode;
  constructor(code: ReviewErrorCode) { super(messages[code]); this.code = code; }
}
export interface ReviewCapabilities { contractVersion: 2; signedIn: boolean; acceptingReviews: boolean; acceptingReports: boolean; acceptingCorrections: boolean; canManageOwn: boolean; canModerate: boolean; policyVersion: string }
export interface SubmissionContext { requestId: string; acceptedPolicyVersion: string }
export interface ReviewReceipt { id: string; version: number; status: 'pending'; requestId: string }
export interface OwnReviewSummary { id: string; restaurantId: string; status: ModerationReview['status']; version: number; displayName: string; visitedMonth: string; relationship: ReviewDraft['relationship']; rating: number; comment: string }
export interface FeedbackReceipt { id: string; status: 'received'; requestId: string }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function decodeReviewCapabilities(value: unknown): ReviewCapabilities {
  if (!record(value) || value.contractVersion !== 2 || !['signedIn','acceptingReviews','acceptingReports','acceptingCorrections','canManageOwn','canModerate'].every(key => typeof value[key] === 'boolean') || typeof value.policyVersion !== 'string' || !value.policyVersion.trim() || value.policyVersion.length > 100) throw new ReviewGatewayError('unavailable');
  return { contractVersion: 2, signedIn: value.signedIn as boolean, acceptingReviews: value.acceptingReviews as boolean, acceptingReports: value.acceptingReports as boolean, acceptingCorrections: value.acceptingCorrections as boolean, canManageOwn: value.canManageOwn as boolean, canModerate: value.canModerate as boolean, policyVersion: value.policyVersion };
}
export function decodeOwnReviews(value: unknown): OwnReviewSummary[] {
  if (!Array.isArray(value) || value.length > 200) throw new ReviewGatewayError('unavailable');
  return value.map(row => {
    if (!record(row) || !isUuid(row.id) || !isUuid(row.restaurantId) || !Object.hasOwn(REVIEW_STATUS_LABELS, String(row.status)) || !Number.isInteger(row.version) || Number(row.version) < 1 || typeof row.displayName !== 'string' || row.displayName.length > 40 || typeof row.comment !== 'string' || row.comment.length > 2000 || typeof row.visitedMonth !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.visitedMonth) || !Object.hasOwn(RELATIONSHIP_LABELS, String(row.relationship)) || !Number.isInteger(row.rating) || Number(row.rating) < 1 || Number(row.rating) > 5) throw new ReviewGatewayError('unavailable');
    return { id: row.id, restaurantId: row.restaurantId, status: row.status as ModerationReview['status'], version: row.version as number, displayName: row.displayName, visitedMonth: row.visitedMonth, relationship: row.relationship as ReviewDraft['relationship'], rating: row.rating as number, comment: row.comment };
  });
}
export class ProposedReviewRepository {
  private client: Pick<SupabaseClient, 'rpc'>;
  constructor(client: Pick<SupabaseClient, 'rpc'>) { this.client = client; }
  private async rpc(name: string, args: Record<string, unknown> = {}, mutation = false): Promise<unknown> {
    let response;
    try { response = await this.client.rpc(name, args); }
    catch { throw new ReviewGatewayError(mutation ? 'unconfirmed' : 'unavailable'); }
    if (response.error) {
      const code = response.error.code;
      throw new ReviewGatewayError(code === '42501' ? 'denied' : code === '40001' ? 'conflict' : code === '23505' ? 'duplicate' : code === 'PGRST202' ? 'unavailable' : mutation ? 'unconfirmed' : 'unavailable');
    }
    return response.data as unknown;
  }
  async capabilities() { return decodeReviewCapabilities(await this.rpc('dining_review_capabilities_v2')); }
  async listMine() {
    const capabilities = await this.capabilities();
    if (!capabilities.signedIn || !capabilities.canManageOwn) throw new ReviewGatewayError('denied');
    // No caller-selected author ID. Server must bind rows to auth.uid(), with bounded pagination before >200.
    return decodeOwnReviews(await this.rpc('dining_my_reviews_v2'));
  }
  async listModeration() {
    const capabilities = await this.capabilities();
    if (!capabilities.signedIn || !capabilities.canModerate) throw new ReviewGatewayError('denied');
    const payload = await this.rpc('dining_review_queue_v2');
    const rows = decodeOwnReviews(payload);
    return rows.map((row, index) => {
      const authorId = (payload as Record<string, unknown>[])[index].authorId;
      if (authorId !== null && !isUuid(authorId)) throw new ReviewGatewayError('unavailable');
      return { ...row, authorId };
    });
  }
  private context(context: SubmissionContext, capabilities: ReviewCapabilities) {
    if (!capabilities.signedIn) throw new ReviewGatewayError('denied');
    if (!isUuid(context.requestId) || context.acceptedPolicyVersion !== capabilities.policyVersion) throw new ReviewGatewayError('invalid');
  }
  async submit(restaurantId: string, draft: ReviewDraft, context: SubmissionContext): Promise<ReviewReceipt> {
    if (!isUuid(restaurantId) || reviewDraftErrors(draft).length) throw new ReviewGatewayError('invalid');
    const capabilities = await this.capabilities();
    if (!capabilities.acceptingReviews || !capabilities.canManageOwn) throw new ReviewGatewayError('unavailable');
    this.context(context, capabilities);
    const result = await this.rpc('dining_submit_review_v2', {
      restaurant_id: restaurantId, request_id: context.requestId, accepted_policy_version: context.acceptedPolicyVersion,
      display_name: draft.displayName.trim(), rating: draft.rating, comment: draft.comment.trim(), visited_month: `${draft.visitedMonth}-01`,
      relationship: draft.relationship, has_visited: draft.hasVisited, privacy_checked: draft.privacyChecked,
    }, true);
    if (!record(result) || !isUuid(result.id) || result.status !== 'pending' || result.version !== 1 || result.requestId !== context.requestId) throw new ReviewGatewayError('unconfirmed');
    return { id: result.id, status: 'pending', version: 1, requestId: context.requestId };
  }
  async feedback(restaurantId: string, reviewId: string | null, draft: FeedbackDraft, context: SubmissionContext): Promise<FeedbackReceipt> {
    if (!isUuid(restaurantId) || feedbackDraftErrors(draft).length || (draft.kind === 'report' ? !isUuid(reviewId) : reviewId !== null)) throw new ReviewGatewayError('invalid');
    const capabilities = await this.capabilities();
    if (!(draft.kind === 'report' ? capabilities.acceptingReports : capabilities.acceptingCorrections)) throw new ReviewGatewayError('unavailable');
    this.context(context, capabilities);
    const result = await this.rpc(draft.kind === 'report' ? 'dining_report_review_v2' : 'dining_suggest_correction_v2', {
      restaurant_id: restaurantId, request_id: context.requestId, accepted_policy_version: context.acceptedPolicyVersion,
      ...(draft.kind === 'report' ? { review_id: reviewId, reason: draft.reason } : { fact_field: draft.field, official_url: draft.sourceUrl }), detail: draft.detail.trim(),
    }, true);
    if (!record(result) || !isUuid(result.id) || result.status !== 'received' || result.requestId !== context.requestId) throw new ReviewGatewayError('unconfirmed');
    return { id: result.id, status: 'received', requestId: context.requestId };
  }
  async withdraw(reviewId: string, expectedVersion: number, requestId: string) {
    if (!isUuid(reviewId) || !isUuid(requestId) || !Number.isInteger(expectedVersion) || expectedVersion < 1) throw new ReviewGatewayError('invalid');
    const capabilities = await this.capabilities();
    if (!capabilities.signedIn || !capabilities.canManageOwn) throw new ReviewGatewayError('denied');
    // Closing new submissions must not strand existing authors without withdrawal.
    const result = await this.rpc('dining_withdraw_review_v2', { review_id: reviewId, expected_version: expectedVersion, request_id: requestId }, true);
    if (!record(result) || result.id !== reviewId || result.status !== 'withdrawn' || result.version !== expectedVersion + 1 || result.requestId !== requestId) throw new ReviewGatewayError('unconfirmed');
    return { id: reviewId, status: 'withdrawn' as const, version: expectedVersion + 1, requestId };
  }
  async moderate(review: ModerationReview, actorId: string, expectedVersion: number, nextStatus: 'approved' | 'rejected', reason: string, requestId: string) {
    const capabilities = await this.capabilities();
    if (!capabilities.signedIn || !capabilities.canModerate) throw new ReviewGatewayError('denied');
    if (!isUuid(review.id) || !isUuid(requestId) || moderationPreflight(review, actorId, capabilities.canModerate, expectedVersion, nextStatus, reason)) throw new ReviewGatewayError('invalid');
    const result = await this.rpc('dining_moderate_review_v2', { review_id: review.id, expected_version: expectedVersion, next_status: nextStatus, reason: reason.trim(), request_id: requestId }, true);
    if (!record(result) || result.id !== review.id || result.status !== nextStatus || result.version !== expectedVersion + 1 || result.requestId !== requestId) throw new ReviewGatewayError('unconfirmed');
    return { id: review.id, status: nextStatus, version: expectedVersion + 1, requestId };
  }
}

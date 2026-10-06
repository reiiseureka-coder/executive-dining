import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeReviewDraft, emptyReviewDraft, reviewDraftErrors, currentVisitMonth, emptyFeedbackDraft, decodeFeedbackDraft, feedbackDraftErrors, moderationPreflight } from '../src/domain/reviews.ts';
import { publicProfileLabel } from '../src/domain/membership.ts';
import { ProposedReviewRepository, decodeReviewCapabilities } from '../src/data/repositories/proposedReviewRepository.ts';
const restaurant = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const author = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const editor = 'cccccccc-cccc-4ccc-cccc-cccccccccccc';
const requestId = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';
const review = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
const valid = () => ({ displayName: '食事メモ', visitedMonth: '2026-09', relationship: 'customer', rating: 4, comment: '自分で来店して食事をした体験の記録です。', hasVisited: true, privacyChecked: true });
const choice = { industry: 'pharmaceutical', companySize: 'large', roleLayer: 'department', familyRomanization: 'Kensho', givenRomanization: 'Taro' };
const snapshot = { profileVersion: 1, industry: choice.industry, companySize: choice.companySize, roleLayer: choice.roleLayer, initials: 'K・T', label: publicProfileLabel(choice), declaration: 'self_declared', operatorAtSubmission: false };
const caps = { contractVersion: 2, privatePilot: true, acceptingProfiles: true, profileReady: true, profileVersion: 1, operatorBadge: null, publicAuthor: snapshot, signedIn: true, acceptingReviews: true, acceptingReports: true, acceptingCorrections: true, canManageOwn: true, canModerate: true, policyVersion: 'test-policy-1' };
const context = { requestId, acceptedPolicyVersion: 'test-policy-1', profileVersion: 1 };
function repository(capabilities = caps, result = { id: review, status: 'pending', version: 1, requestId }) {
  const calls = [];
  const repo = new ProposedReviewRepository({ rpc: async (name, args) => { calls.push({ name, args }); return name === 'dining_review_capabilities_v2' ? { data: capabilities, error: null } : typeof result === 'function' ? result(name, args) : { data: result, error: null }; } });
  return { repo, calls };
}
test('visit drafts retain month and relationship, strip arbitrary identifiers, and never restore declarations', () => {
  const value = decodeReviewDraft({ ...valid(), authorId: author, company: 'not stored', email: 'not stored', exactDate: 'not stored' });
  assert.deepEqual(Object.keys(value).sort(), Object.keys(emptyReviewDraft()).sort());
  assert.equal(value.visitedMonth, '2026-09'); assert.equal(value.relationship, 'customer');
  assert.equal(value.hasVisited, false); assert.equal(value.privacyChecked, false);
  assert.equal(decodeReviewDraft({ ...valid(), rating: 6 }), null);
  assert.equal(decodeReviewDraft({ ...valid(), comment: 'a'.repeat(2001) }), null);
  assert.equal(decodeReviewDraft({ ...valid(), relationship: 'invented' }), null);
});
test('submission preflight requires genuine-visit declarations and month-only dates', () => {
  const now = new Date('2026-10-05T23:00:00Z');
  assert.deepEqual(reviewDraftErrors(valid(), now), []);
  assert.ok(reviewDraftErrors({ ...valid(), visitedMonth: '2026-09-03' }, now).length);
  assert.ok(reviewDraftErrors({ ...valid(), visitedMonth: '2026-11' }, now).length);
  assert.ok(reviewDraftErrors({ ...valid(), hasVisited: false }, now).length);
  assert.ok(reviewDraftErrors({ ...valid(), privacyChecked: false }, now).length);
  assert.equal(currentVisitMonth(new Date('2026-09-30T15:00:00Z')), '2026-10');
});
test('feedback requires official HTTPS evidence or a bounded report reason, without adding contact fields', () => {
  const correction = { ...emptyFeedbackDraft('correction'), field: 'price', sourceUrl: 'https://example.com/official', detail: '公式ページの料金条件が変更されています。' };
  assert.deepEqual(feedbackDraftErrors(correction), []);
  assert.ok(feedbackDraftErrors({ ...correction, sourceUrl: 'https://user:secret@example.com' }).length);
  assert.ok(feedbackDraftErrors({ ...correction, sourceUrl: 'javascript:alert(1)' }).length);
  assert.equal(decodeFeedbackDraft({ ...correction, email: 'do not retain' }).email, undefined);
  assert.ok(feedbackDraftErrors({ ...emptyFeedbackDraft('report'), detail: correction.detail }).length);
  assert.deepEqual(feedbackDraftErrors({ ...emptyFeedbackDraft('report'), reason: 'privacy', detail: correction.detail }), []);
});
test('capabilities fail closed for absent, old or loosely typed contracts', () => {
  for (const input of [null, {}, { ...caps, contractVersion: 1 }, { ...caps, canModerate: 'true' }, { ...caps, policyVersion: '' }]) assert.throws(() => decodeReviewCapabilities(input));
  assert.equal(decodeReviewCapabilities(caps).contractVersion, 2);
});
test('OFF gate makes no mutation and never falls back to the ungranted v1 API', async () => {
  const { repo, calls } = repository({ ...caps, acceptingReviews: false });
  await assert.rejects(repo.submit(restaurant, valid(), context), error => error.code === 'unavailable');
  assert.deepEqual(calls.map(call => call.name), ['dining_review_capabilities_v2']);
});
test('auth and policy mismatch stop submission before any mutation', async () => {
  for (const capabilities of [{ ...caps, signedIn: false }, { ...caps, policyVersion: 'test-policy-2' }, { ...caps, canManageOwn: false }]) {
    const { repo, calls } = repository(capabilities);
    await assert.rejects(repo.submit(restaurant, valid(), context)); assert.equal(calls.length, 1);
  }
});
test('future adapter includes relationship/month/declarations and omits caller-supplied authority', async () => {
  const { repo, calls } = repository();
  const receipt = await repo.submit(restaurant, { ...valid(), authorId: editor, status: 'approved', company: 'secret' }, context);
  assert.equal(receipt.status, 'pending');
  const sent = calls[1]; assert.equal(sent.name, 'dining_submit_review_v2');
  assert.equal(sent.args.relationship, 'customer'); assert.equal(sent.args.visited_month, '2026-09-01');
  assert.equal(sent.args.request_id, requestId); assert.equal(sent.args.has_visited, true);
  assert.equal(sent.args.display_name, undefined); assert.equal(sent.args.profile_version, 1); assert.equal(sent.args.authorId, undefined); assert.equal(sent.args.status, undefined); assert.equal(sent.args.company, undefined);
});
test('capabilities are rechecked for each write and request IDs stay stable for server reconciliation', async () => {
  const { repo, calls } = repository();
  await repo.submit(restaurant, valid(), context); await repo.submit(restaurant, valid(), context);
  assert.equal(calls.filter(call => call.name === 'dining_review_capabilities_v2').length, 2);
  assert.equal(calls[1].args.request_id, calls[3].args.request_id);
});
test('ambiguous network or malformed acknowledgments never claim submission success or retry automatically', async () => {
  for (const result of [() => { throw new Error('private provider detail'); }, { id: review, status: 'approved', version: 1, requestId }, { id: review, status: 'pending', version: 1, requestId: author }]) {
    const { repo, calls } = repository(caps, result);
    await assert.rejects(repo.submit(restaurant, valid(), context), error => error.code === 'unconfirmed' && !error.message.includes('private provider detail'));
    assert.equal(calls.length, 2);
  }
});
test('server permission and stale-version failures remain authoritative and sanitized', async () => {
  for (const [code, expected] of [['42501','denied'], ['40001','conflict'], ['23505','duplicate']]) {
    const { repo } = repository(caps, () => ({ data: null, error: { code, message: 'sensitive backend details' } }));
    await assert.rejects(repo.submit(restaurant, valid(), context), error => error.code === expected && !error.message.includes('sensitive'));
  }
});
test('feedback receipts require server acknowledgments and report ownership is never supplied by client', async () => {
  const { repo, calls } = repository(caps, { id: review, status: 'received', requestId });
  const report = { ...emptyFeedbackDraft('report'), reason: 'privacy', detail: '個人を特定できる記載が含まれています。' };
  await repo.feedback(restaurant, review, report, context);
  assert.equal(calls[1].name, 'dining_report_review_v2'); assert.equal(calls[1].args.review_id, review);
  assert.equal(calls[1].args.reporter_id, undefined);
  await assert.rejects(repo.feedback(restaurant, null, report, context), error => error.code === 'invalid');
});
test('author withdrawal remains callable with new-submission gates closed, subject to server ownership', async () => {
  const { repo, calls } = repository({ ...caps, acceptingReviews: false }, { id: review, status: 'withdrawn', version: 3, requestId });
  await repo.withdraw(review, 2, requestId);
  assert.equal(calls[1].name, 'dining_withdraw_review_v2'); assert.equal(calls[1].args.expected_version, 2);
});
test('moderation preflight forbids self-approval, withdrawn authors, stale versions and empty reasons', () => {
  const row = { id: review, authorId: author, status: 'pending', version: 1 };
  assert.equal(moderationPreflight(row, editor, true, 1, 'approved', '確認しました'), null);
  for (const input of [[row, author, true, 1, 'approved', 'self'], [row, editor, false, 1, 'approved', 'reason'], [row, editor, true, 2, 'approved', 'reason'], [{ ...row, status: 'withdrawn' }, editor, true, 1, 'approved', 'reason'], [{ ...row, authorId: null }, editor, true, 1, 'approved', 'reason'], [row, editor, true, 1, 'approved', '']]) assert.ok(moderationPreflight(...input));
});
test('moderation requires current backend permission and does not send client roles/actor identity', async () => {
  const row = { id: review, authorId: author, status: 'pending', version: 1 };
  const denied = repository({ ...caps, canModerate: false });
  await assert.rejects(denied.repo.moderate(row, editor, 1, 'approved', 'checked', requestId), error => error.code === 'denied');
  assert.equal(denied.calls.length, 1);
  const allowed = repository(caps, { id: review, status: 'approved', version: 2, requestId });
  await allowed.repo.moderate(row, editor, 1, 'approved', 'checked', requestId);
  assert.equal(allowed.calls[1].args.actor_id, undefined); assert.equal(allowed.calls[1].args.role, undefined);
});
test('own-review reads have no caller-selected author and strip unrelated sensitive fields', async () => {
  const { repo, calls } = repository(caps, [{ ...valid(), displayName: snapshot.label, authorSnapshot: snapshot, operatorBadge: null, id: review, restaurantId: restaurant, status: 'pending', version: 1, email: 'private', authorId: author }]);
  const rows = await repo.listMine();
  assert.deepEqual(calls[1], { name: 'dining_my_reviews_v2', args: {} });
  assert.equal(rows[0].email, undefined); assert.equal(rows[0].authorId, undefined);
  assert.equal(rows[0].relationship, 'customer');
});
test('editor queue remains inaccessible when backend role is false, including client metadata claims', async () => {
  const { repo, calls } = repository({ ...caps, canModerate: false, user_metadata: { admin: true } });
  await assert.rejects(repo.listModeration(), error => error.code === 'denied');
  assert.equal(calls.length, 1);
});

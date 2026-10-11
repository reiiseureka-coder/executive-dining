/** Public vocabulary. PublicAuthorSnapshot is the only publishable DTO.
 * PublicProfileChoice includes transient confirmed romanization: never persist or publish that input object. */
export const INDUSTRY_LABELS = { pharmaceutical: '製薬業界', healthcare: '医療・福祉', manufacturing: '製造業', technology: 'IT・情報通信', finance: '金融・保険', professional: '専門サービス', hospitality: '飲食・宿泊', public_sector: '公共・教育', other: 'その他の業種' } as const;
export const COMPANY_SIZE_LABELS = { large: '大規模企業', medium: '中規模企業', small: '小規模企業', independent: '個人・フリーランス', undisclosed: '規模非公開' } as const;
export const ROLE_LAYER_LABELS = { executive: '経営・事業統括', department: '部門マネジメント', team: 'チームマネジメント', professional: '専門職・実務担当', other: 'その他' } as const;
export interface PublicProfileChoice { industry: keyof typeof INDUSTRY_LABELS; companySize: keyof typeof COMPANY_SIZE_LABELS; roleLayer: keyof typeof ROLE_LAYER_LABELS; familyRomanization: string; givenRomanization: string }
export interface PublicAuthorSnapshot { profileVersion: number; industry: keyof typeof INDUSTRY_LABELS; companySize: keyof typeof COMPANY_SIZE_LABELS; roleLayer: keyof typeof ROLE_LAYER_LABELS; initials: string; label: string; declaration: 'self_declared'; operatorAtSubmission: boolean }
export function confirmedInitials(family: string, given: string): string {
  const allowed = /^[A-Za-z][A-Za-z '-]{0,79}$/;
  if (!allowed.test(family.trim()) || !allowed.test(given.trim())) throw new Error('氏と名のローマ字を本人が確認してください。');
  return `${family.trim()[0].toUpperCase()}・${given.trim()[0].toUpperCase()}`;
}
export function publicProfileLabel(choice: PublicProfileChoice): string {
  if (!Object.hasOwn(INDUSTRY_LABELS, choice.industry) || !Object.hasOwn(COMPANY_SIZE_LABELS, choice.companySize) || !Object.hasOwn(ROLE_LAYER_LABELS, choice.roleLayer)) throw new Error('公開属性を確認してください。');
  return `${INDUSTRY_LABELS[choice.industry]}・${COMPANY_SIZE_LABELS[choice.companySize]} / ${ROLE_LAYER_LABELS[choice.roleLayer]} / ${confirmedInitials(choice.familyRomanization, choice.givenRomanization)}`;
}
export function decodeAuthorSnapshot(input: unknown): PublicAuthorSnapshot {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('公開プロフィールを確認できません。');
  const value = input as Record<string, unknown>;
  const keys = ['profileVersion','industry','companySize','roleLayer','initials','label','declaration','operatorAtSubmission'];
  if (Object.keys(value).some(key => !keys.includes(key)) || !Number.isInteger(value.profileVersion) || Number(value.profileVersion) < 1 || typeof value.initials !== 'string' || !/^[A-Z]・[A-Z]$/.test(value.initials) || value.declaration !== 'self_declared' || typeof value.operatorAtSubmission !== 'boolean') throw new Error('公開プロフィールを確認できません。');
  const expected = publicProfileLabel({ industry: value.industry as PublicProfileChoice['industry'], companySize: value.companySize as PublicProfileChoice['companySize'], roleLayer: value.roleLayer as PublicProfileChoice['roleLayer'], familyRomanization: value.initials[0], givenRomanization: value.initials[2] });
  if (value.label !== expected) throw new Error('公開プロフィールが一致しません。');
  return { profileVersion: value.profileVersion as number, industry: value.industry as PublicProfileChoice['industry'], companySize: value.companySize as PublicProfileChoice['companySize'], roleLayer: value.roleLayer as PublicProfileChoice['roleLayer'], initials: value.initials, label: expected, declaration: 'self_declared', operatorAtSubmission: value.operatorAtSubmission };
}
export type OperatorBadge = 'Owner' | null;
export function decodeOperatorBadge(value: unknown): OperatorBadge {
  if (value !== null && value !== 'Owner') throw new Error('運営表示を確認できません。');
  return value;
}
// Recognition and feature entitlements never feed identity verification, review scores or search order.
export const MEMBERSHIP_COPY = {
  member: { name: 'Member', description: '検索、候補の保存、店舗の比較、口コミなど、基本の機能を使うプランです。' },
  plus: { name: 'Plus', description: '会食ごとのリスト作成、検索条件の保存、比較メモの書き出しなどを検討しています。' },
  prime: { name: 'Prime', description: '初期から参加する方の称号です。一部のPlus機能を使える特典を検討しています。内容や期間は未定です。' },
  owner: { name: 'Owner', description: '運営メンバーの表示。会員プランや投稿数で取得することはできません。' },
} as const;

import type { OperatorBadge as Badge } from '../domain/membership';
/** Caller must supply an authoritative server DTO, never user_metadata/plan/contribution state. */
export default function OperatorBadge({ badge }: { badge: Badge }) {
  return badge === 'Owner' ? <span className="operator-badge" title="運営メンバー。口コミの信憑性や評価を保証する表示ではありません。">Owner <small>運営</small></span> : null;
}

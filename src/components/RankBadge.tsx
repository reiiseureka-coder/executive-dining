import type { UserRank } from '../types';

const RANK_CONFIG: Record<UserRank, { label: string; bg: string; text: string; border: string; icon: string }> = {
  'ルビー':  { label: 'Ruby',   bg: 'bg-red-950',    text: 'text-red-300',    border: 'border-red-500/50',    icon: '💎' },
  'ゴールド': { label: 'Gold',   bg: 'bg-yellow-950', text: 'text-yellow-300', border: 'border-yellow-500/50', icon: '🥇' },
  'シルバー': { label: 'Silver', bg: 'bg-slate-800',  text: 'text-slate-300',  border: 'border-slate-400/50',  icon: '🥈' },
  'ブロンズ': { label: 'Bronze', bg: 'bg-orange-950', text: 'text-orange-300', border: 'border-orange-600/50', icon: '🥉' },
};

interface RankBadgeProps {
  rank: UserRank;
  size?: 'sm' | 'md';
}

export default function RankBadge({ rank, size = 'sm' }: RankBadgeProps) {
  const cfg = RANK_CONFIG[rank];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium
        ${cfg.bg} ${cfg.text} ${cfg.border}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

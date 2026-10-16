import { Flame } from 'lucide-react';

interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  if (streak <= 0) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 'var(--r-pill)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-faint)',
          fontSize: 13,
        }}
      >
        <Flame size={14} />
        No streak yet — practice today!
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 'var(--r-pill)',
        background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,146,60,0.2))',
        border: '1px solid rgba(251,191,36,0.4)',
        color: 'var(--warning)',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <Flame size={14} style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
      {streak}-Day Streak
    </div>
  );
}

import { Flame } from 'lucide-react';
import { ANIME_STREAK_BADGES, AnimeBadgeEmblem } from '@/constants/animeBadges';

interface Props {
  streak: number;
  equippedBadges?: string[];
}

export function StreakBadge({ streak, equippedBadges: _equippedBadges }: Props) {
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

  // Find the highest unlocked anime tier
  const unlockedBadges = ANIME_STREAK_BADGES.filter((b) => streak >= b.days);
  const highestBadge = unlockedBadges.length > 0 ? unlockedBadges[unlockedBadges.length - 1] : null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 'var(--r-pill)',
        background: highestBadge
          ? `linear-gradient(135deg, ${highestBadge.accentColor}25, rgba(0,0,0,0.5))`
          : 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,146,60,0.2))',
        border: highestBadge ? `1px solid ${highestBadge.accentColor}60` : '1px solid rgba(251,191,36,0.4)',
        color: highestBadge ? highestBadge.accentColor : 'var(--warning)',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {highestBadge ? (
        <AnimeBadgeEmblem badge={highestBadge} isUnlocked={true} size={18} />
      ) : (
        <Flame size={14} style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
      )}
      <span>{streak}-Day Streak</span>
      {highestBadge && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#ffffff',
            background: `${highestBadge.accentColor}40`,
            padding: '1px 6px',
            borderRadius: 999,
          }}
        >
          {highestBadge.name}
        </span>
      )}
    </div>
  );
}

import { Calendar } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  targetTestDate?: string; // 'YYYY-MM-DD'
  targetUniversity?: string;
}

export function CountdownTimer({ targetTestDate, targetUniversity }: Props) {
  const daysLeft = useMemo(() => {
    if (!targetTestDate) return null;
    const target = new Date(targetTestDate);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [targetTestDate]);

  if (!targetTestDate) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-faint)',
          fontSize: 13,
        }}
      >
        <Calendar size={16} />
        <span>No test date set — <a href="/dashboard/settings" style={{ color: 'var(--brand)', textDecoration: 'none' }}>update profile</a></span>
      </div>
    );
  }

  const isPast = daysLeft !== null && daysLeft < 0;
  const isToday = daysLeft === 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span
        className="tabular-nums font-display"
        style={{
          fontSize: 48,
          fontWeight: 800,
          lineHeight: 1,
          background: isPast
            ? 'var(--danger)'
            : 'linear-gradient(135deg, var(--brand), var(--brand-2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {isToday ? '0' : Math.abs(daysLeft ?? 0)}
      </span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {isPast ? 'days since' : isToday ? 'Test day is TODAY!' : 'days to'}
        </p>
        {targetUniversity && !isToday && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{targetUniversity} test</p>
        )}
      </div>
    </div>
  );
}

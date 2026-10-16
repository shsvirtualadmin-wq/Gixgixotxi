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
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Calendar size={15} />
        <span>No test date set</span>
      </div>
    );
  }

  const isPast = daysLeft !== null && daysLeft < 0;
  const isToday = daysLeft === 0;

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span
        className="font-doto text-4xl font-bold leading-none tracking-tight"
        style={{ color: isPast ? 'var(--red)' : '#FFFFFF' }}
      >
        {isToday ? '0' : Math.abs(daysLeft ?? 0)}
      </span>
      <div>
        <p className="text-xs font-semibold text-[var(--text)]">
          {isPast ? 'days passed' : isToday ? 'Test day TODAY' : 'days left'}
        </p>
        {targetUniversity && !isToday && (
          <p className="text-[11px] text-[var(--muted)]">{targetUniversity}</p>
        )}
      </div>
    </div>
  );
}

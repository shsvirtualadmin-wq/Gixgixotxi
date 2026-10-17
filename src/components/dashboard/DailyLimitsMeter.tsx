import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { Skeleton } from '@/components/ui/Skeleton';
import { FREE_DAILY_TESTS } from '@/constants/limits';

interface UsageData {
  testsStarted?: number;
  practiceAttempts?: number;
  arenaSessions?: number;
  aiTutorTokens?: number;
}

interface Props {
  uid: string;
  isPremium?: boolean;
}

export function DailyLimitsMeter({ uid, isPremium }: Props) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const effectivePlan = useEffectivePlan();

  const dateKey = getPKTDateKey();

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, 'users', uid, 'usage', dateKey),
      (snap) => {
        setUsage(snap.exists() ? (snap.data() as UsageData) : {});
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, dateKey]);

  if (loading || effectivePlan.loading) return <Skeleton height={70} />;

  const hasUnlimited = Boolean(isPremium || effectivePlan.isUnlimited);

  if (hasUnlimited) {
    const planLabel = effectivePlan.isSuperAdmin
      ? 'Superadmin'
      : effectivePlan.source === 'crew'
      ? (effectivePlan.crewName || 'Study Crew')
      : 'Pro';

    return (
      <div className="flex items-center gap-3 py-1">
        <span
          className="font-doto text-3xl font-extrabold leading-none text-[var(--accent)] select-none shrink-0"
          aria-hidden="true"
        >
          ∞
        </span>
        <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
          <span className="text-sm font-semibold text-[var(--text)]">Unlimited</span>
          <span className="text-xs text-[var(--text-muted)] font-medium">· {planLabel}</span>
        </div>
      </div>
    );
  }

  const used = usage?.testsStarted ?? usage?.practiceAttempts ?? 0;
  const max = FREE_DAILY_TESTS;
  const remaining = Math.max(0, max - used);

  return (
    <div className="flex items-center gap-3.5">
      {/* Daily Limit Ring */}
      <div
        className="relative w-12 h-12 rounded-full border-2 border-[var(--accent)] flex flex-col items-center justify-center shrink-0"
        style={{ borderTopColor: 'var(--border)' }}
      >
        <span className="font-doto text-xs font-bold text-[var(--text)] leading-none">
          {remaining}
        </span>
        <span className="text-[8px] text-[var(--text-muted)] font-doto mt-0.5">left</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-[var(--text)] uppercase tracking-wider text-[11px]">TESTS LEFT</span>
          <span className="font-doto text-[var(--text-muted)]">{used}/{max} used</span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)]">
          Resets at 00:00 PKT
        </div>
      </div>
    </div>
  );
}

export default DailyLimitsMeter;

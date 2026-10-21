import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, memo, useRef } from 'react';
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
  onUsageChange?: (used: number) => void;
  onError?: () => void;
}

export const DailyLimitsMeter = memo(function DailyLimitsMeter({
  uid,
  isPremium,
  onUsageChange,
  onError,
}: Props) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const effectivePlan = useEffectivePlan();

  const onUsageChangeRef = useRef(onUsageChange);
  onUsageChangeRef.current = onUsageChange;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const dateKey = getPKTDateKey();

  useEffect(() => {
    if (!uid) {
      // If no uid yet, keep loading or if auth finished without user, fail gracefully
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasError(false);

    const unsubscribe = onSnapshot(
      doc(db, 'users', uid, 'usage', dateKey),
      (snap) => {
        const u = snap.exists() ? (snap.data() as UsageData) : {};
        setUsage(u);
        const count = Number(u.testsStarted ?? u.practiceAttempts ?? 0);
        if (onUsageChangeRef.current) onUsageChangeRef.current(count);
        setLoading(false);
      },
      (err) => {
        console.warn('[DailyLimitsMeter] usage fetch error:', err);
        setHasError(true);
        setLoading(false);
        if (onErrorRef.current) onErrorRef.current();
      }
    );

    return () => unsubscribe();
  }, [uid, dateKey]);

  // If loading, show a small skeleton
  if (loading || effectivePlan.loading) {
    return (
      <div className="w-full space-y-2 py-1">
        <Skeleton height={18} className="w-3/5 rounded-md" />
        <Skeleton height={6} className="w-full rounded-full" />
      </div>
    );
  }

  // If loading fails, never show an empty box — return null and inform parent to hide card
  if (hasError) {
    return null;
  }

  // If the plan is Unlimited (including the superadmin), show "Unlimited practice" with no bar
  const isUnlimitedPlan = Boolean(isPremium || effectivePlan.isUnlimited || effectivePlan.isSuperAdmin);

  if (isUnlimitedPlan) {
    return (
      <div className="flex items-center gap-2.5 py-1">
        <span
          className="font-doto text-2xl font-black text-[var(--accent)] select-none shrink-0"
          aria-hidden="true"
        >
          ∞
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[var(--text)]">Unlimited practice</span>
          <span className="text-[11px] text-[var(--muted)] font-medium">No daily question limits</span>
        </div>
      </div>
    );
  }

  // If the user has a daily limit, show "X of Y questions used today" with a thin progress bar
  const used = Number(usage?.testsStarted ?? usage?.practiceAttempts ?? 0);
  const max = FREE_DAILY_TESTS || 3;
  const pct = Math.min(100, Math.max(0, Math.round((used / max) * 100)));

  return (
    <div className="w-full space-y-2 py-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text)] font-medium">
          <strong className="font-semibold text-[var(--text)]">{used} of {max}</strong> questions used today
        </span>
      </div>

      {/* Thin progress bar */}
      <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--red)] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="text-[10px] text-[var(--muted)]">
        Resets daily at 00:00 PKT
      </div>
    </div>
  );
});

export default DailyLimitsMeter;

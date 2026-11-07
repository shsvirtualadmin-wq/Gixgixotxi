import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState, memo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useAuth } from '@/contexts/AuthContext';
import { LineLoader } from '@/components/ui/LineLoader';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { fetchDailyUsageFromServer } from '@/services/testLimits';

interface UsageData {
  testsStarted?: number;
  practiceAttempts?: number;
  questionsUsed?: number;
  questionsDailyLimit?: number;
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
  const { user, profileLoading } = useAuth();
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
    if (profileLoading) {
      setLoading(true);
      return;
    }

    const effectiveUid = user?.uid || uid;
    if (!effectiveUid) {
      setHasError(true);
      setLoading(false);
      if (onErrorRef.current) onErrorRef.current();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setHasError(false);

    // Only read Firestore usage doc when signed in as the owner (request.auth.uid == userId)
    const firestorePromise =
      user?.uid && user.uid === effectiveUid
        ? getDoc(doc(db, 'users', effectiveUid, 'usage', dateKey)).catch(() => null)
        : Promise.resolve(null);
    const serverPromise = fetchDailyUsageFromServer(effectiveUid);

    Promise.all([firestorePromise, serverPromise])
      .then(([snap, serverUsage]) => {
        if (cancelled) return;
        const fsData = snap && snap.exists() ? (snap.data() as UsageData) : {};
        const fsCount = Number(
          fsData.questionsUsed ?? fsData.testsStarted ?? fsData.practiceAttempts ?? 0
        );
        const srvCount = Number(
          serverUsage?.testsStarted ?? serverUsage?.practiceAttempts ?? 0
        );
        const mergedTestsStarted = Math.max(fsCount, srvCount);
        const merged: UsageData = {
          ...fsData,
          testsStarted: mergedTestsStarted,
          practiceAttempts: Math.max(
            Number(fsData.practiceAttempts ?? 0),
            Number(serverUsage?.practiceAttempts ?? mergedTestsStarted)
          ),
          questionsUsed: mergedTestsStarted,
        };
        setUsage(merged);
        if (onUsageChangeRef.current) onUsageChangeRef.current(mergedTestsStarted);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[DailyLimitsMeter] usage fetch error:', err);
        setHasError(true);
        setLoading(false);
        if (onErrorRef.current) onErrorRef.current();
      });

    return () => {
      cancelled = true;
    };
  }, [uid, user?.uid, profileLoading, dateKey]);

  // If loading or auth/plan resolving, show inline LineLoader
  if (loading || effectivePlan.loading || profileLoading) {
    return <LineLoader context="dashboard" variant="inline" />;
  }

  // If loading fails, hide completely — never show an empty box
  if (hasError) {
    return null;
  }

  // If the plan is Unlimited (including the superadmin), show "Unlimited practice" with no bar
  const isUnlimitedPlan = Boolean(isPremium || effectivePlan.isUnlimited || effectivePlan.isSuperAdmin);

  if (isUnlimitedPlan) {
    return (
      <div className="py-1 space-y-0.5">
        <span
          className="text-sm sm:text-base font-bold text-[var(--text)] block"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Unlimited practice
        </span>
        <span className="text-[11px] text-[var(--muted)] font-medium block">
          No daily limit
        </span>
      </div>
    );
  }

  // If the user has a daily limit, show "X of Y questions used today" with a thin progress bar
  const used = Number(usage?.questionsUsed ?? usage?.testsStarted ?? usage?.practiceAttempts ?? 0);
  const max = Number(usage?.questionsDailyLimit ?? FREE_DAILY_TESTS ?? 3);
  const pct = Math.min(100, Math.max(0, Math.round((used / max) * 100)));

  return (
    <div className="w-full space-y-2 py-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text)] font-medium">
          <strong className="font-semibold text-[var(--text)]">{used} of {max}</strong> questions used today
        </span>
      </div>

      {/* Thin progress bar */}
      <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
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

import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { Skeleton } from '@/components/ui/Skeleton';

interface UsageData {
  practiceAttempts?: number;
  arenaSessions?: number;
  aiTutorTokens?: number;
}

const FREE_LIMITS = {
  practiceAttempts: 10,
  arenaSessions: 3,
  aiTutorTokens: 5,
};

interface Props {
  uid: string;
  isPremium: boolean;
}

export function DailyLimitsMeter({ uid, isPremium }: Props) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Skeleton height={70} />;

  if (isPremium) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--red)] flex items-center justify-center font-doto text-xs font-bold text-[#FFFFFF]">
          ∞
        </div>
        <div>
          <div className="text-xs font-semibold text-[var(--text)]">Unlimited Access</div>
          <div className="text-[11px] text-[var(--muted)]">Pro quota active</div>
        </div>
      </div>
    );
  }

  const used = usage?.practiceAttempts ?? 0;
  const max = FREE_LIMITS.practiceAttempts;
  const pct = Math.min(Math.round((used / max) * 100), 100);

  return (
    <div className="flex items-center gap-3.5">
      {/* Daily Limit Ring */}
      <div className="relative w-12 h-12 rounded-full border-2 border-[var(--red)] border-t-[#2A2A2A] flex flex-col items-center justify-center shrink-0">
        <span className="font-doto text-xs font-bold text-[#FFFFFF] leading-none">
          {used}
        </span>
        <span className="text-[8px] text-[var(--muted)] font-doto">/{max}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-[var(--text)]">Daily Practice Ring</span>
          <span className="font-doto text-[var(--muted)]">{pct}%</span>
        </div>
        <div className="text-[11px] text-[var(--muted)]">
          Resets at midnight PKT
        </div>
      </div>
    </div>
  );
}

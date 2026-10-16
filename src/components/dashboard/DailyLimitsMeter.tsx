import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

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
  const [error, setError] = useState<{ code?: string; message: string; path: string } | null>(null);
  const [retry, setRetry] = useState(0);

  const dateKey = getPKTDateKey();
  const path = `users/${uid}/usage/${dateKey}`;

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, 'users', uid, 'usage', dateKey),
      (snap) => {
        setUsage(snap.exists() ? (snap.data() as UsageData) : {});
        setLoading(false);
      },
      (err) => {
        console.error(`[DailyLimitsMeter] Failed to read ${path}:`, err.code, err.message);
        setError({ code: err.code, message: err.message, path });
        setLoading(false);
      }
    );

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, dateKey, retry]);

  if (loading) return <Skeleton height={80} />;
  if (error) return <ErrorState error={error} path={error.path} onRetry={() => setRetry(r => r + 1)} title="Couldn't load daily usage" />;

  if (isPremium) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--r-input)',
          background: 'rgba(52,211,153,0.1)',
          border: '1px solid rgba(52,211,153,0.3)',
          fontSize: 13,
          color: 'var(--success)',
          fontWeight: 600,
        }}
      >
        ✦ Pro — Unlimited daily practice
      </div>
    );
  }

  const bars = [
    { label: 'Practice', used: usage?.practiceAttempts ?? 0, max: FREE_LIMITS.practiceAttempts },
    { label: 'Arena', used: usage?.arenaSessions ?? 0, max: FREE_LIMITS.arenaSessions },
    { label: 'AI Tutor', used: usage?.aiTutorTokens ?? 0, max: FREE_LIMITS.aiTutorTokens },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
        Today's Usage · {dateKey}
      </p>
      {bars.map(({ label, used, max }) => {
        const pct = Math.min((used / max) * 100, 100);
        const isOverLimit = used >= max;
        return (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ color: isOverLimit ? 'var(--danger)' : 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                {used}/{max}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: 'var(--surface-hover)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 999,
                  background: isOverLimit
                    ? 'var(--danger)'
                    : 'linear-gradient(90deg, var(--brand), var(--brand-2))',
                  transition: 'width 900ms cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

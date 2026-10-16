import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookOpen } from 'lucide-react';

interface Attempt {
  id: string;
  subject?: string;
  university?: string;
  score?: number;
  totalQuestions?: number;
  createdAt?: { seconds: number };
  status?: string;
}

interface Props {
  uid: string;
}

export function RecentAttempts({ uid }: Props) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string; path: string } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const path = `attempts (uid=${uid})`;

    getDocs(
      query(
        collection(db, 'attempts'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
    )
      .then((snap) => {
        setAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attempt)));
        setLoading(false);
      })
      .catch((err: { code?: string; message: string }) => {
        console.error(`[RecentAttempts] Failed to read ${path}:`, err.code, err.message);
        setError({ code: err.code, message: err.message, path });
        setLoading(false);
      });
  }, [uid, retry]);

  if (loading) return <><Skeleton height={60} /><Skeleton height={60} className="" /></>;
  if (error) return <ErrorState error={error} path={error.path} onRetry={() => setRetry(r => r + 1)} title="Couldn't load recent attempts" />;
  if (attempts.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen size={36} />}
        title="No attempts yet"
        description="Start a practice session to see your recent attempts here."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {attempts.map((a) => {
        const score = a.score ?? 0;
        const total = a.totalQuestions ?? 0;
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;
        const date = a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-PK') : '—';

        return (
          <div
            key={a.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--r-input)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.subject ?? 'Practice'} {a.university ? `· ${a.university}` : ''}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{date}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p
                className="tabular-nums"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)',
                }}
              >
                {total > 0 ? `${pct}%` : a.status ?? '—'}
              </p>
              {total > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{score}/{total}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

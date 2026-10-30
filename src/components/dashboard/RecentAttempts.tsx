import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Attempt {
  id: string;
  subject?: string;
  university?: string;
  score?: number;
  totalQuestions?: number;
  total?: number;
  createdAt?: { seconds: number } | string;
  status?: string;
}

interface Props {
  uid: string;
}

const cachedRecentAttemptsByUid = new Map<string, Attempt[]>();

export function RecentAttempts({ uid }: Props) {
  const [attempts, setAttempts] = useState<Attempt[]>(() => {
    return uid && cachedRecentAttemptsByUid.has(uid) ? cachedRecentAttemptsByUid.get(uid)! : [];
  });
  const [loading, setLoading] = useState(() => !uid || !cachedRecentAttemptsByUid.has(uid));

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    if (cachedRecentAttemptsByUid.has(uid)) {
      setAttempts(cachedRecentAttemptsByUid.get(uid)!);
      setLoading(false);
      return;
    }

    setLoading(true);

    getDocs(query(collection(db, 'attempts'), where('userId', '==', uid), limit(5)))
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt));
        cachedRecentAttemptsByUid.set(uid, list);
        setAttempts(list);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[RecentAttempts] Notice reading attempts:', err);
        setLoading(false);
      });
  }, [uid]);

  if (loading) return <div className="space-y-2"><Skeleton height={50} count={3} /></div>;

  if (attempts.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen size={32} />}
        title="No attempts yet"
        description="Launch a practice test or sprint to record your first score."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {(attempts || []).map((a, idx) => {
        const score = Number.isFinite(Number(a?.score)) ? Math.max(0, Number(a?.score)) : 0;
        const total = Number.isFinite(Number(a?.totalQuestions ?? a?.total)) ? Math.max(1, Number(a?.totalQuestions ?? a?.total)) : 10;
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;

        const rawStatus = String(a?.status || 'completed').toLowerCase();
        const friendlyStatus =
          rawStatus === 'in_progress' || rawStatus === 'in-progress' || rawStatus === 'started'
            ? 'In progress'
            : 'Completed';

        const attemptId = a?.id || `attempt-${idx}`;

        return (
          <Link
            key={attemptId}
            to={`/test/${attemptId}/result`}
            className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--text-muted)] flex items-center justify-between gap-3 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div
                className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {a.subject || 'Practice Sprint'} {a.university ? `· ${a.university}` : ''}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Status: {friendlyStatus}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="tabular-nums font-bold text-sm text-[var(--text)]">
                {score} / {total}
              </div>
              <div className="tabular-nums text-[11px] text-[var(--text-muted)]">
                {pct}%
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

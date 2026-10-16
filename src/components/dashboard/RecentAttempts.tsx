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

export function RecentAttempts({ uid }: Props) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Try both userId and uid queries
    Promise.all([
      getDocs(query(collection(db, 'attempts'), where('userId', '==', uid), limit(5))),
      getDocs(query(collection(db, 'attempts'), where('uid', '==', uid), limit(5))),
    ])
      .then(([snapA, snapB]) => {
        const map = new Map<string, Attempt>();
        snapA.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Attempt));
        snapB.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Attempt));
        const list = Array.from(map.values());
        setAttempts(list.slice(0, 5));
        setLoading(false);
      })
      .catch(() => {
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
      {attempts.map((a) => {
        const score = a.score ?? 0;
        const total = a.totalQuestions ?? a.total ?? 10;
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;

        return (
          <Link
            key={a.id}
            to={`/test/${a.id}/result`}
            className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-[var(--border)] hover:border-[var(--muted)] flex items-center justify-between gap-3 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div
                className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {a.subject || 'Practice Sprint'} {a.university ? `· ${a.university}` : ''}
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                Status: {a.status || 'Completed'}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-doto font-bold text-sm text-[#FFFFFF]">
                {score} / {total}
              </div>
              <div className="font-doto text-[11px] text-[var(--muted)]">
                {pct}%
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

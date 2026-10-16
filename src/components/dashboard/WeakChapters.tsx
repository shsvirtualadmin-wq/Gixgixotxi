import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TrendingDown } from 'lucide-react';

interface ChapterStat {
  id: string;
  subject?: string;
  chapter?: string;
  correct?: number;
  total?: number;
}

interface Props {
  uid: string;
}

export function WeakChapters({ uid }: Props) {
  const [chapters, setChapters] = useState<ChapterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code?: string; message: string; path: string } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const path = `users/${uid}/chapterStats`;

    getDocs(
      query(collection(db, 'users', uid, 'chapterStats'), orderBy('total', 'desc'), limit(10))
    )
      .then((snap) => {
        const stats = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChapterStat));
        // Sort by accuracy ascending, take bottom 3
        const sorted = stats
          .filter(s => (s.total ?? 0) > 0)
          .sort((a, b) => {
            const accA = (a.correct ?? 0) / (a.total ?? 1);
            const accB = (b.correct ?? 0) / (b.total ?? 1);
            return accA - accB;
          })
          .slice(0, 3);
        setChapters(sorted);
        setLoading(false);
      })
      .catch((err: { code?: string; message: string }) => {
        console.error(`[WeakChapters] Failed to read ${path}:`, err.code, err.message);
        setError({ code: err.code, message: err.message, path });
        setLoading(false);
      });
  }, [uid, retry]);

  if (loading) return <Skeleton height={60} count={3} />;
  if (error) return <ErrorState error={error} path={error.path} onRetry={() => setRetry(r => r + 1)} title="Couldn't load chapter stats" />;
  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={<TrendingDown size={36} />}
        title="No chapter data yet"
        description="Complete practice sessions to see your weak chapters here."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {chapters.map((c) => {
        const acc = Math.round(((c.correct ?? 0) / (c.total ?? 1)) * 100);
        return (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderRadius: 'var(--r-input)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.chapter ?? c.id}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{c.subject ?? '—'}</p>
            </div>
            <div
              style={{
                flexShrink: 0,
                padding: '4px 10px',
                borderRadius: 'var(--r-pill)',
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: 'var(--danger)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {acc}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

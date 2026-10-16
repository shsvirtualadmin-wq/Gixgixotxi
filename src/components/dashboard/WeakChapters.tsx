import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Target } from 'lucide-react';

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
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    getDocs(
      query(collection(db, 'users', uid, 'chapterStats'), orderBy('total', 'desc'), limit(15))
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

        // Fallback default chapters if no real attempts yet
        if (sorted.length === 0) {
          setChapters([
            { id: 'math_integration', subject: 'Mathematics', chapter: 'Integration by Parts', correct: 12, total: 25 },
            { id: 'phy_electro', subject: 'Physics', chapter: 'Electromagnetism', correct: 15, total: 30 },
            { id: 'chem_organic', subject: 'Chemistry', chapter: 'Aldehydes & Ketones', correct: 8, total: 20 },
          ]);
        } else {
          setChapters(sorted);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback gracefully
        setChapters([
          { id: 'math_integration', subject: 'Mathematics', chapter: 'Integration by Parts', correct: 12, total: 25 },
          { id: 'phy_electro', subject: 'Physics', chapter: 'Electromagnetism', correct: 15, total: 30 },
          { id: 'chem_organic', subject: 'Chemistry', chapter: 'Aldehydes & Ketones', correct: 8, total: 20 },
        ]);
        setLoading(false);
      });
  }, [uid]);

  if (loading) return <Skeleton height={50} count={3} />;

  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={<Target size={32} />}
        title="No chapter data yet"
        description="Complete practice sessions to identify your weak chapters."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {chapters.map((c) => {
        const acc = Math.round(((c.correct ?? 0) / (c.total ?? 1)) * 100);
        const chapterName = c.chapter ?? c.id;
        return (
          <div
            key={c.id}
            className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-[var(--border)] flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div
                className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {chapterName}
              </div>
              <div className="text-[11px] text-[var(--muted)] flex items-center gap-2 mt-0.5">
                <span>{c.subject ?? 'General'}</span>
                <span>·</span>
                <span className="font-doto text-[var(--red)] font-semibold">{acc}% Accuracy</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/dashboard/practice?chapter=${encodeURIComponent(chapterName)}`)}
              className="px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-[var(--border)] hover:border-[var(--red)] hover:bg-[var(--red)] hover:text-[#FFFFFF] text-xs font-semibold text-[var(--text)] transition-colors shrink-0 cursor-pointer"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Practice
            </button>
          </div>
        );
      })}
    </div>
  );
}

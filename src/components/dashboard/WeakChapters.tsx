import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Target, ArrowRight } from 'lucide-react';
import { useUserChapterStats } from '@/hooks/useUserChapterStats';

interface Props {
  uid: string;
  onDrill?: (chapter: string, subject: string) => void;
}

export function WeakChapters({ uid, onDrill }: Props) {
  const { weakChapters, loading } = useUserChapterStats(uid);
  const navigate = useNavigate();

  if (loading) return <Skeleton height={50} count={3} />;

  if (weakChapters.length === 0) {
    return (
      <EmptyState
        icon={<Target size={32} />}
        title="No weak chapters detected"
        description="Chapters where you answer 3+ questions with under 50% accuracy will be flagged here for focused drills."
        action={
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('complete-test-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else navigate('/dashboard');
            }}
            className="btn-outline text-xs px-4 py-2 rounded-xl mt-2 cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Start Complete Test</span>
            <ArrowRight size={13} />
          </button>
        }
      />
    );
  }

  // Display top 3 weakest chapters
  const topWeak = Array.isArray(weakChapters) ? weakChapters.slice(0, 3) : [];

  return (
    <div className="flex flex-col gap-2.5">
      {topWeak.map((c, idx) => {
        const chName = c?.chapter || 'Chapter Drill';
        const subName = c?.subject || 'General';
        const key = c?.id || `${chName}-${idx}`;
        return (
          <div
            key={key}
            className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div
                className="font-bold text-sm text-[var(--text)] truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {chName}
              </div>
              <div className="text-xs text-[var(--muted)] flex items-center gap-2 mt-0.5">
                <span>{subName}</span>
                <span>·</span>
                <span>{c?.total ?? 0} answered</span>
                <span>·</span>
                <span className="text-[var(--red)] font-semibold">{c?.accuracy ?? 0}% acc</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onDrill) {
                  onDrill(chName, subName);
                } else {
                  navigate(`/dashboard?drillChapter=${encodeURIComponent(chName)}&drillSubject=${encodeURIComponent(subName)}`);
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-[var(--red)]/40 text-[var(--red)] text-xs font-semibold hover:bg-[var(--red)] hover:text-white transition-colors cursor-pointer shrink-0"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Drill
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default WeakChapters;

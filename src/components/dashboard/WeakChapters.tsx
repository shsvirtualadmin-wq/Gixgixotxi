import { memo } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import type { D1WeakChapterItem } from '@/services/universityMcqService';

interface Props {
  chapters: D1WeakChapterItem[];
  onDrillChapter?: (item: D1WeakChapterItem) => void;
}

export const WeakChapters = memo(function WeakChapters({
  chapters,
  onDrillChapter,
}: Props) {
  const safeChapters = Array.isArray(chapters) ? chapters : [];

  // Hidden completely until D1 university attempts with weak chapters exist
  if (safeChapters.length === 0) {
    return null;
  }

  return (
    <section
      className="rs-card space-y-3.5"
      aria-label="Weak Chapters"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle size={18} className="shrink-0 text-[var(--rs-red-text)]" />
          <h2 className="rs-doto text-base sm:text-lg text-[var(--rs-text)] truncate">
            Weak Chapters
          </h2>
        </div>
        <span className="rs-body text-xs font-medium text-[var(--rs-muted)] shrink-0">
          From University Tests
        </span>
      </div>

      <div className="space-y-2.5">
        {safeChapters.map((c) => (
          <div
            key={c.id}
            className="rs-card2-row flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="rs-body text-sm font-bold text-[var(--rs-text)] truncate">
                {c.topic}
              </div>
              <div className="rs-body text-xs text-[var(--rs-muted)] truncate">
                {c.universityName} · {c.subject} · {c.answered} answered
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="rs-chip rs-chip--red tabular-nums">
                {c.accuracy}% acc
              </span>
              {c.isUniversityLive && onDrillChapter && (
                <button
                  type="button"
                  onClick={() => onDrillChapter(c)}
                  className="rs-glass-btn rs-glass-btn--red inline-flex items-center justify-center gap-1.5 min-h-[40px] text-xs font-bold px-4 py-2"
                >
                  <span>Drill</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

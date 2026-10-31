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
      className="cockpit-surface-card p-4 sm:p-5 space-y-3"
      aria-label="Weak Chapters"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle size={16} className="shrink-0 text-[var(--accent)]" />
          <h2
            className="text-sm sm:text-base font-bold text-[var(--text)] truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Weak Chapters
          </h2>
        </div>
        <span className="text-[11px] font-medium text-[var(--text-muted)] shrink-0">
          From University Tests
        </span>
      </div>

      <div className="space-y-2">
        {safeChapters.map((c) => (
          <div
            key={c.id}
            className="cockpit-subrow flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <div
                className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {c.topic}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">
                {c.universityName} · {c.subject} · {c.answered} answered
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="cockpit-uni-pill cockpit-uni-pill--live tabular-nums">
                {c.accuracy}% acc
              </span>
              {c.isUniversityLive && onDrillChapter && (
                <button
                  type="button"
                  onClick={() => onDrillChapter(c)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <span>Drill</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

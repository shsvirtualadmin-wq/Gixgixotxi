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
        {safeChapters.map((c) => {
          const pct = Math.max(0, Math.min(100, Math.round(Number(c.accuracy) || 0)));
          const r = 16;
          const circ = 2 * Math.PI * r;
          const dashOffset = circ - (pct / 100) * circ;
          const ringColor =
            pct >= 70 ? 'var(--ok)' : pct >= 45 ? 'var(--warn)' : 'var(--red)';

          return (
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
                <span className="rs-chip rs-chip--red tabular-nums lg-classic-only">
                  {c.accuracy}% acc
                </span>
                <span
                  className="hidden lg-only-inline relative w-10 h-10 items-center justify-center shrink-0"
                  aria-label={`${pct}% accuracy`}
                >
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r={r}
                      fill="none"
                      stroke="var(--edge)"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r={r}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold tabular-nums text-[var(--text)]">
                    {pct}%
                  </span>
                </span>
                {c.isUniversityLive && onDrillChapter && (
                  <button
                    type="button"
                    data-pressable="true"
                    onClick={() => onDrillChapter(c)}
                    className="rs-glass-btn rs-glass-btn--red inline-flex items-center justify-center gap-1.5 min-h-[44px] text-xs font-bold px-4 py-2"
                  >
                    <span>Drill</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { D1WeakChapterItem } from '@/services/universityMcqService';

interface Props {
  chapters: D1WeakChapterItem[];
  onDrillChapter?: (item: D1WeakChapterItem) => void;
}

export const WeakChapters = memo(function WeakChapters({
  chapters,
  onDrillChapter,
}: Props) {
  const { t, formatNumber } = useLanguage();
  const safeChapters = Array.isArray(chapters) ? chapters.slice(0, 5) : [];

  return (
    <section
      className="space-y-3"
      aria-label={t('dashboard.weakChapters')}
      data-testid="weak-chapters-section"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2
          className="text-base sm:text-lg font-black tracking-tight truncate"
          style={{ color: 'var(--text)' }}
        >
          {t('dashboard.weakChapters')}
        </h2>
        <span
          className="text-[11px] font-bold uppercase tracking-wider shrink-0 ltr-nums"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
        >
          01–05
        </span>
      </div>

      {safeChapters.length === 0 ? (
        <div
          className="rounded-[9999px] px-5 py-4 flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="min-w-0 flex-1 text-start">
            <div
              className="text-sm font-bold truncate"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}
            >
              {t('dashboard.weakChapters')}
            </div>
            <div
              className="text-xs truncate"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
            >
              {t('dashboard.noWeakChapters')}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {safeChapters.map((c, idx) => {
            const rankLabel = String(idx + 1).padStart(2, '0');
            const pct = Math.max(0, Math.min(100, Math.round(Number(c.accuracy) || 0)));
            const activeSegments = Math.max(0, Math.min(10, Math.round(pct / 10)));

            return (
              <div
                key={c.id}
                data-testid={`weak-chapter-row-${rankLabel}`}
                className="rounded-[9999px] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--pill-card-bg)',
                  border: '1px solid var(--pill-card-border)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {/* Doto 900 rank 01-05 */}
                <span
                  className="text-lg sm:text-xl font-black tabular-nums shrink-0 w-7 text-center"
                  style={{ fontFamily: 'var(--font-dot)', color: 'var(--accent)' }}
                >
                  {rankLabel}
                </span>

                {/* Chapter name + meta line */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div
                    className="text-sm font-bold truncate"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}
                  >
                    {c.topic}
                  </div>
                  <div
                    className="text-[11px] truncate text-start"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                  >
                    {c.universityName} · {c.subject} · <span className="ltr-nums">{formatNumber(c.answered)} · {formatNumber(pct)}%</span>
                  </div>
                </div>

                {/* 10-segment accuracy meter */}
                <div
                  className="flex items-center gap-[3px] shrink-0"
                  aria-label={`${pct}% accuracy (${activeSegments} of 10 segments)`}
                  title={`${pct}% accuracy`}
                >
                  {Array.from({ length: 10 }).map((_, segIdx) => {
                    const isFilled = segIdx < activeSegments;
                    return (
                      <span
                        key={segIdx}
                        className="w-1.5 h-4 rounded-full"
                        style={{
                          backgroundColor: isFilled ? 'var(--accent)' : 'var(--meter-off)',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Round red arrow button */}
                <button
                  type="button"
                  disabled={!c.isUniversityLive || !onDrillChapter}
                  onClick={() => {
                    if (c.isUniversityLive && onDrillChapter) {
                      onDrillChapter(c);
                    }
                  }}
                  aria-label={`Drill ${c.topic}`}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full inline-flex items-center justify-center shrink-0 transition-transform duration-150 active:scale-95 cursor-pointer disabled:opacity-45"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--text-on-accent)',
                  }}
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

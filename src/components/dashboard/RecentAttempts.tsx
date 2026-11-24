import { memo, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { D1UniversityAttemptRecord } from '@/services/universityMcqService';

interface Props {
  attempts: D1UniversityAttemptRecord[];
  onRetakeUniversity?: (universityId: string, subject?: string, topic?: string) => void;
}

function formatAttemptDate(iso: string): string {
  if (!iso) return 'Recently';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

export const RecentAttempts = memo(function RecentAttempts({
  attempts,
  onRetakeUniversity,
}: Props) {
  const { t, formatNumber, formatDate } = useLanguage();
  const allAttempts = useMemo(
    () => (Array.isArray(attempts) ? attempts : []),
    [attempts]
  );
  const safeAttempts = useMemo(() => allAttempts.slice(0, 5), [allAttempts]);

  const summary = useMemo(() => {
    const count = allAttempts.length;
    if (count === 0) {
      return { count: 0, avgAccuracy: 0, bestAccuracy: 0 };
    }
    let sum = 0;
    let best = 0;
    for (const a of allAttempts) {
      const acc = Math.max(0, Math.min(100, Math.round(Number(a.accuracy) || 0)));
      sum += acc;
      if (acc > best) best = acc;
    }
    return {
      count,
      avgAccuracy: Math.round(sum / count),
      bestAccuracy: best,
    };
  }, [allAttempts]);

  return (
    <section
      className="space-y-3"
      aria-label={t('dashboard.recentAttempts')}
      data-testid="recent-attempts-section"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2
          className="text-base sm:text-lg font-black tracking-tight truncate"
          style={{ color: 'var(--text)' }}
        >
          {t('dashboard.recentAttempts')}
        </h2>
        <span
          className="text-[11px] font-bold uppercase tracking-wider shrink-0 ltr-nums"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
        >
          {formatNumber(safeAttempts.length)}
        </span>
      </div>

      {/* Top strip of 3 pills: attempts, average accuracy, best */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5" data-testid="recent-attempts-summary-strip">
        <div
          className="rounded-full px-3.5 py-2 flex items-center justify-between gap-1.5"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('dashboard.testsCompleted')}
          </span>
          <span
            className="text-sm sm:text-base font-black tabular-nums shrink-0 ltr-nums"
            style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
          >
            {formatNumber(summary.count)}
          </span>
        </div>

        <div
          className="rounded-full px-3.5 py-2 flex items-center justify-between gap-1.5"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('dashboard.accuracy')}
          </span>
          <span
            className="text-sm sm:text-base font-black tabular-nums shrink-0 ltr-nums"
            style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
          >
            {formatNumber(summary.avgAccuracy)}%
          </span>
        </div>

        <div
          className="rounded-full px-3.5 py-2 flex items-center justify-between gap-1.5"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('commons.sortTop')}
          </span>
          <span
            className="text-sm sm:text-base font-black tabular-nums shrink-0 ltr-nums"
            style={{ fontFamily: 'var(--font-dot)', color: 'var(--accent)' }}
          >
            {formatNumber(summary.bestAccuracy)}%
          </span>
        </div>
      </div>

      {/* Pill cards, ALL strictly 100px tall */}
      {safeAttempts.length === 0 ? (
        <div
          className="h-[100px] min-h-[100px] max-h-[100px] rounded-[28px] px-5 flex flex-col justify-center text-center"
          style={{
            backgroundColor: 'var(--pill-card-bg)',
            border: '1px solid var(--pill-card-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <p
            className="text-xs sm:text-sm font-bold truncate"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}
          >
            {t('test.noResultsYet')}
          </p>
          <p
            className="text-xs truncate mt-0.5"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
          >
            {t('dashboard.noRecentAttempts')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {safeAttempts.map((a) => {
            const mins = Math.max(1, Math.round(Number(a.durationSeconds || 60) / 60));
            const pct = Math.max(0, Math.min(100, Math.round(Number(a.accuracy) || 0)));
            const isRetry = pct < 10;
            const badgeText = isRetry ? t('common.retry') : t('test.retakeTest');
            const r = 22;
            const circ = 2 * Math.PI * r;
            const dashOffset = circ - (pct / 100) * circ;

            return (
              <div
                key={a.id}
                data-testid="recent-attempt-pill-card"
                onClick={() =>
                  onRetakeUniversity?.(
                    a.universityId,
                    a.subject !== 'All Subjects' ? a.subject : undefined,
                    a.topic !== 'All Topics' ? a.topic : undefined
                  )
                }
                role={onRetakeUniversity ? 'button' : undefined}
                tabIndex={onRetakeUniversity ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRetakeUniversity && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRetakeUniversity(
                      a.universityId,
                      a.subject !== 'All Subjects' ? a.subject : undefined,
                      a.topic !== 'All Topics' ? a.topic : undefined
                    );
                  }
                }}
                className={`h-[100px] min-h-[100px] max-h-[100px] rounded-[28px] px-4 sm:px-5 flex items-center gap-3.5 overflow-hidden transition-transform duration-150 ${
                  onRetakeUniversity ? 'cursor-pointer active:scale-[0.99]' : ''
                }`}
                style={{
                  height: '100px',
                  minHeight: '100px',
                  maxHeight: '100px',
                  backgroundColor: 'var(--pill-card-bg)',
                  border: '1px solid var(--pill-card-border)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {/* Left: Animated accuracy ring */}
                <div
                  className="relative w-14 h-14 flex items-center justify-center shrink-0"
                  aria-label={`${pct}% accuracy`}
                >
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
                    <circle
                      cx="26"
                      cy="26"
                      r={r}
                      fill="none"
                      stroke="var(--ring-track)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="26"
                      cy="26"
                      r={r}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-xs font-black tabular-nums"
                    style={{ fontFamily: 'var(--font-dot)', color: 'var(--text)' }}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Right: Badge (RETRY <10%, else KEEP GOING), title + subject tag on ONE line, 3 one-line chips */}
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider shrink-0"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: isRetry ? 'var(--tag-danger-bg)' : 'var(--accent-soft)',
                        color: isRetry ? 'var(--tag-danger-text)' : 'var(--accent)',
                      }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  {/* Title + subject tag on ONE line */}
                  <div className="flex items-center gap-2 min-w-0 whitespace-nowrap overflow-hidden">
                    <span
                      className="text-sm font-bold truncate"
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}
                    >
                      {a.universityName}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--pill-chip-bg)',
                        border: '1px solid var(--pill-chip-border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {a.subject || 'Full Pattern'}
                    </span>
                  </div>

                  {/* Three one-line chips: X/Y correct, duration, date */}
                  <div className="flex items-center gap-1.5 min-w-0 whitespace-nowrap overflow-hidden">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                      style={{
                        backgroundColor: 'var(--pill-chip-bg)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span className="ltr-nums">{formatNumber(a.correctCount)}/{formatNumber(a.totalQuestions)}</span>&nbsp;{t('test.correct')}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ltr-nums"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'var(--pill-chip-bg)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {mins}m
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium truncate"
                      style={{
                        backgroundColor: 'var(--pill-chip-bg)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {a.createdAt ? formatDate(a.createdAt, { month: 'short', day: 'numeric' }) : formatAttemptDate(a.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

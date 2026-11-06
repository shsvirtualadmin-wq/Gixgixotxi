import { memo } from 'react';
import { History, Clock, CheckCircle2 } from 'lucide-react';
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
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

export const RecentAttempts = memo(function RecentAttempts({
  attempts,
  onRetakeUniversity,
}: Props) {
  const safeAttempts = Array.isArray(attempts) ? attempts.slice(0, 5) : [];

  return (
    <section
      className="cockpit-surface-card p-4 sm:p-5 space-y-3"
      aria-label="Recent Attempts"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <History size={16} className="shrink-0 text-[var(--text-muted)]" />
          <h2
            className="text-sm sm:text-base font-bold text-[var(--text)] truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Recent Attempts
          </h2>
        </div>
        <span className="text-[11px] font-medium text-[var(--text-muted)] shrink-0">
          Latest 5
        </span>
      </div>

      {safeAttempts.length === 0 ? (
        <div className="cockpit-subrow py-7 px-4 text-center space-y-1.5">
          <p
            className="text-xs sm:text-sm font-semibold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            No university attempts yet
          </p>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Tap any live university above to start a practice test. Your latest 5 attempts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeAttempts.map((a) => {
            const mins = Math.max(1, Math.round(Number(a.durationSeconds || 60) / 60));
            return (
              <div
                key={a.id}
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
                className={`cockpit-subrow flex items-center justify-between gap-3 p-3 ${
                  onRetakeUniversity ? 'cursor-pointer hover:border-[var(--accent)]' : ''
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs sm:text-sm font-bold text-[var(--text)] truncate"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {a.universityName}
                    </span>
                    <span className="cockpit-uni-pill cockpit-uni-pill--soon text-[10px] py-0.5 px-2">
                      {a.subject || 'Full Pattern'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-[var(--accent)]" />
                      {a.correctCount}/{a.totalQuestions} correct
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} />
                      {mins}m
                    </span>
                    <span>{formatAttemptDate(a.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="cockpit-uni-pill cockpit-uni-pill--live tabular-nums">
                    {a.accuracy}%
                  </span>
                  <span className="text-[10px] font-medium text-[var(--text-muted)] tabular-nums">
                    Score: {a.score}/{a.maxScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

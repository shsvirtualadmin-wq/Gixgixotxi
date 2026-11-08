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
      className="rs-card space-y-3.5"
      aria-label="Recent Attempts"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <History size={18} className="shrink-0 text-[var(--rs-muted)]" />
          <h2 className="rs-doto text-base sm:text-lg text-[var(--rs-text)] truncate">
            Recent Attempts
          </h2>
        </div>
        <span className="rs-body text-xs font-medium text-[var(--rs-muted)] shrink-0">
          Latest 5
        </span>
      </div>

      {safeAttempts.length === 0 ? (
        <div className="rs-card2-row py-7 px-4 text-center space-y-1.5">
          <p className="rs-body text-xs sm:text-sm font-bold text-[var(--rs-text)]">
            No university attempts yet
          </p>
          <p className="rs-body text-xs text-[var(--rs-muted)] max-w-md mx-auto">
            Tap any live university above to start a practice test. Your latest 5 attempts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
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
                className={`rs-card2-row flex items-center justify-between gap-3 ${
                  onRetakeUniversity ? 'cursor-pointer' : ''
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rs-body text-sm font-bold text-[var(--rs-text)] truncate">
                      {a.universityName}
                    </span>
                    <span className="rs-chip">
                      {a.subject || 'Full Pattern'}
                    </span>
                  </div>
                  <div className="rs-body flex items-center gap-3 text-xs text-[var(--rs-muted)] flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[var(--rs-red-text)]" />
                      {a.correctCount}/{a.totalQuestions} correct
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {mins}m
                    </span>
                    <span>{formatAttemptDate(a.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="rs-chip rs-chip--red tabular-nums">
                    {a.accuracy}%
                  </span>
                  <span className="rs-body text-[11px] font-medium text-[var(--rs-muted)] tabular-nums">
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

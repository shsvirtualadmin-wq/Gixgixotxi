import React from 'react';
import { Clock, CheckCircle2, XCircle, ChevronRight, Award, Zap, GraduationCap } from 'lucide-react';
import { StoredTestAttempt } from '../../lib/firebase';
import { UniversityLogoBadge } from '../UniversityLogoBadge';

interface StudentHistoryTabProps {
  attempts: StoredTestAttempt[];
  onReviewAttempt: (attempt: StoredTestAttempt) => void;
  onStartNewTest: () => void;
}

export const StudentHistoryTab: React.FC<StudentHistoryTabProps> = ({
  attempts,
  onReviewAttempt,
  onStartNewTest,
}) => {
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Test History
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Review all your completed sprints, mocks, and mistake breakdowns.
        </p>
      </div>

      {attempts.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/80 border border-slate-200/80 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-lg">No tests completed yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Every practice session or sprint you finish will be saved here with detailed accuracy metrics and Boardy AI explanations.
          </p>
          <div className="pt-2">
            <button
              onClick={onStartNewTest}
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Start your first practice test
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((att) => {
            const formattedDate = new Date(att.createdAt).toLocaleDateString('en-PK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const minutesSpent = Math.max(1, Math.round(att.timeSpentSeconds / 60));

            return (
              <div
                key={att.id || att.createdAt}
                onClick={() => onReviewAttempt(att)}
                className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {att.universityId ? (
                    <div className="p-1 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                      <UniversityLogoBadge university={att.universityId} size="md" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900">{att.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{formattedDate}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {minutesSpent} min
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">{att.correctCount} correct</span>
                      <span>·</span>
                      <span className="text-rose-700 font-semibold">{att.wrongCount} wrong</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span
                      className={`text-xl font-black ${
                        att.percentage >= 70
                          ? 'text-emerald-600'
                          : att.percentage >= 50
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {att.percentage}%
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {att.score} / {att.totalQuestions}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group">
                    <span>Review</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

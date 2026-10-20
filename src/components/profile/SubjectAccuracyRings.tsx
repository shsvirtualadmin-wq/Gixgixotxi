import React from 'react';

export interface SubjectAccuracyItem {
  name: string;
  accuracy: number; // 0 - 100
  questionsSolved?: number;
  color?: string;
}

interface SubjectAccuracyRingsProps {
  subjects?: SubjectAccuracyItem[];
  isOwnMode?: boolean;
  accentColor?: string;
}

const DEFAULT_SUBJECTS: SubjectAccuracyItem[] = [
  { name: 'Physics', accuracy: 78, questionsSolved: 320, color: '#3B82F6' },
  { name: 'Chemistry', accuracy: 84, questionsSolved: 410, color: '#10B981' },
  { name: 'Biology', accuracy: 91, questionsSolved: 680, color: '#EC4899' },
  { name: 'Mathematics', accuracy: 72, questionsSolved: 290, color: '#F59E0B' },
  { name: 'English', accuracy: 88, questionsSolved: 195, color: '#8B5CF6' },
];

export const SubjectAccuracyRings: React.FC<SubjectAccuracyRingsProps> = ({
  subjects = DEFAULT_SUBJECTS,
  isOwnMode = false,
  accentColor = '#E11D48',
}) => {
  const displaySubjects = React.useMemo(() => {
    const list = subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;
    // Own mode shows all active subjects, public mode shows top 3
    if (isOwnMode) return list;
    return [...list].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
  }, [subjects, isOwnMode]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-heading font-semibold text-[var(--text)]">
          {isOwnMode ? 'Subject Accuracy' : 'Top Subject Accuracies'}
        </span>
        <span className="font-mono text-[11px]">
          {isOwnMode ? `${displaySubjects.length} subjects` : 'Top 3'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {displaySubjects.map((sub) => {
          const clamped = Math.min(100, Math.max(0, Math.round(sub.accuracy)));
          const barColor = sub.color || accentColor;

          return (
            <div
              key={sub.name}
              className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading font-medium text-xs text-[var(--text)] truncate">
                    {sub.name}
                  </span>
                  <span className="font-mono font-bold text-xs" style={{ color: barColor }}>
                    {clamped}%
                  </span>
                </div>

                {/* Accuracy meter bar */}
                <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${clamped}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>

                {sub.questionsSolved !== undefined && (
                  <span className="text-[10px] text-[var(--muted)] font-mono">
                    {sub.questionsSolved} MCQs attempted
                  </span>
                )}
              </div>

              {/* Small SVG Radial Ring */}
              <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-[var(--border)]"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={barColor}
                    strokeWidth="3"
                    strokeDasharray={88}
                    strokeDashoffset={88 - (88 * clamped) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

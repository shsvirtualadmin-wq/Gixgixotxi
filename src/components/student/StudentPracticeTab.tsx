import React, { useState, useMemo } from 'react';
import { Zap, Clock, ArrowRight, Lock, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUsage } from '../../context/UsageContext';
import { UNIVERSITIES, University } from '../../data/universities';
import { getUniversityPaperConfig } from '../../config/universityPapers';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { UsageMeter } from '../ui/UsageMeter';

interface StudentPracticeTabProps {
  onStartSprint: (subject: string) => void;
  onStartUniversityPaper: (university: University) => void;
  onOpenUsage: () => void;
  onUpgrade: () => void;
}

export const StudentPracticeTab: React.FC<StudentPracticeTabProps> = ({
  onStartSprint,
  onStartUniversityPaper,
  onOpenUsage,
  onUpgrade,
}) => {
  const { profile, user } = useAuth();
  const {
    loading: usageLoading,
    isUnlimited,
    testsLimit,
    testsUsed,
    testsLeft,
    canStartTest,
  } = useUsage();

  const [uniCategoryFilter, setUniCategoryFilter] = useState<'All' | 'Engineering & CS' | 'Business & Finance' | 'NTS'>('All');
  const [showAllSubjects, setShowAllSubjects] = useState(false);

  // Subject chips for Timed Sprint
  const primarySubjects = [
    'Advance Maths',
    'Physics',
    'Chemistry',
    'English',
    'Basic Maths',
    'IQ & Reasoning',
  ];

  const extraSubjects = [
    'Computer Science',
    'Biology',
    'Analytical Reasoning',
    'Quantitative Reasoning',
  ];

  const displayedSubjects = showAllSubjects ? [...primarySubjects, ...extraSubjects] : primarySubjects;

  // Filtered universities
  const filteredUniversities = useMemo(() => {
    return UNIVERSITIES.filter((uni) => {
      if (uniCategoryFilter === 'All') return true;
      if (uniCategoryFilter === 'Engineering & CS') return uni.category === 'Engineering';
      if (uniCategoryFilter === 'Business & Finance') return uni.category === 'Business';
      if (uniCategoryFilter === 'NTS') return uni.id === 'comsats' || uni.id === 'fast' || uni.shortName.includes('NTS');
      return true;
    });
  }, [uniCategoryFilter]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header with Usage Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Practice
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Speed sprints and full university entry test simulations.
          </p>
        </div>

        {/* Unified Usage Meter */}
        <div className="self-start sm:self-auto w-full sm:w-auto">
          <UsageMeter type="tests" showUpgradeButton={true} onUpgrade={onUpgrade} />
        </div>
      </div>

      {/* SECTION 1: Timed Sprint */}
      <section className="space-y-4 animate-fade-in-up">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>Timed sprint · 30 questions · 10 min</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            Rapid single-subject drills to test your formulas, reflex speed, and accuracy under pressure.
          </p>

          {/* Subject chips */}
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-700 block mb-2.5">
              Start one in:
            </span>
            <div className="flex flex-wrap gap-2">
              {displayedSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    if (!canStartTest()) {
                      onUpgrade();
                    } else {
                      onStartSprint(sub);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 active:scale-95 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{sub}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowAllSubjects(!showAllSubjects)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:underline cursor-pointer active:scale-95 transition-transform"
              >
                {showAllSubjects ? 'Fewer subjects' : 'More subjects…'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: University Papers */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              University papers
            </h2>
            <p className="text-xs text-slate-500">
              Official format mocks with sectional timings and real negative marking.
            </p>
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs font-semibold">
            {(['All', 'Engineering & CS', 'Business & Finance', 'NTS'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setUniCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  uniCategoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid of University Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUniversities.map((uni, index) => {
            const paperConfig = getUniversityPaperConfig(uni.id);

            return (
              <div
                key={uni.id}
                style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                className="p-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between animate-fade-in-up"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    {/* University Logo in rounded square */}
                    <div className="p-1 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 shadow-sm">
                      <UniversityLogoBadge university={uni} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base text-slate-900 truncate">
                          {uni.shortName}
                        </h3>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {uni.testName || paperConfig.testName || 'Entrance Test'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {uni.fullName}
                      </p>
                    </div>
                  </div>

                  {/* 3 Stats: Questions, Marks, Minutes */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                    <div>
                      <span className="font-black text-slate-900 block">{paperConfig.totalQuestions}</span>
                      <span className="text-[10px] text-slate-400">Questions</span>
                    </div>
                    <div>
                      <span className="font-black text-slate-900 block">{paperConfig.totalMarks}</span>
                      <span className="text-[10px] text-slate-400">Marks</span>
                    </div>
                    <div>
                      <span className="font-black text-slate-900 block">{paperConfig.durationMinutes}</span>
                      <span className="text-[10px] text-slate-400">Minutes</span>
                    </div>
                  </div>

                  {/* Negative marking line */}
                  <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
                    <span className={paperConfig.negativeMarkingPercent > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'}>
                      {paperConfig.negativeMarkingText}
                    </span>
                    <span className="text-slate-400">{uni.location || 'Pakistan'}</span>
                  </div>
                </div>

                {/* Take Test or upgrade button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {usageLoading ? (
                    <button
                      type="button"
                      disabled={true}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <span>Checking today's limit…</span>
                    </button>
                  ) : !canStartTest() ? (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        disabled={true}
                        className="w-full py-2 px-3 rounded-xl font-bold text-[11px] bg-rose-50 text-rose-700 border border-rose-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>You have used today's free limit. Resets at midnight (PKT)</span>
                      </button>
                      <button
                        type="button"
                        onClick={onUpgrade}
                        className="w-full py-1 text-center text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Upgrade to keep practicing &rarr;
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartUniversityPaper(uni)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Take Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

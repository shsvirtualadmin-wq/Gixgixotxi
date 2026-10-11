import React, { useState, useMemo } from 'react';
import { MapPin, Sparkles, Calculator, ArrowRight, Compass } from 'lucide-react';
import { UNIVERSITIES_CONFIG, UniversityConfig } from '../../config/universities';
import { UniversityLogo } from './UniversityLogo';
import { SeoHead } from '../common/SeoHead';

interface UniversityExplorerProps {
  onNavigateMeritMeter?: (uniId: string) => void;
  onNavigatePredictor?: () => void;
}

type CategoryTab = 'All' | 'Engineering & CS' | 'Medical' | 'Business';

export const UniversityExplorer: React.FC<UniversityExplorerProps> = ({
  onNavigateMeritMeter,
  onNavigatePredictor,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');
  const universityCount = UNIVERSITIES_CONFIG.length;

  const filteredUnis = useMemo(() => {
    if (activeTab === 'All') return UNIVERSITIES_CONFIG;
    return UNIVERSITIES_CONFIG.filter((u) => u.category.includes(activeTab as any));
  }, [activeTab]);

  const handleCalculateClick = (uniId: string) => {
    if (onNavigateMeritMeter) {
      onNavigateMeritMeter(uniId);
    } else {
      const target = `/app/merit-meter?uni=${encodeURIComponent(uniId)}`;
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const handlePredictorClick = () => {
    if (onNavigatePredictor) {
      onNavigatePredictor();
    } else {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/app/predictor');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const tabs: CategoryTab[] = ['All', 'Engineering & CS', 'Medical', 'Business'];

  return (
    <div className="min-h-[100dvh] pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <SeoHead pathname="/universities" />

      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Pakistan University Directory 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0d1b3e] tracking-tight leading-tight">
          Calculate Your <span className="text-indigo-600">University Aggregate</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
          Explore {universityCount} leading Pakistani universities, compare entry test weightage models, and calculate your exact admission chances across engineering, computing, medical, and business programs.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#university-list"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Browse Universities
          </a>
          <button
            type="button"
            onClick={handlePredictorClick}
            className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-[#0d1b3e] border border-slate-200 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            Try the Predictor
          </button>
        </div>
      </section>

      {/* Slightly tilted marquee of university names (Requirement 4) */}
      <div className="mb-14 overflow-hidden py-3 -rotate-1 select-none pointer-events-auto">
        <div className="flex gap-4 animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused] active:[animation-play-state:paused] w-max">
          {[...UNIVERSITIES_CONFIG, ...UNIVERSITIES_CONFIG].map((uni, idx) => (
            <div
              key={`${uni.id}-${idx}`}
              className="px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-indigo-100 shadow-xs text-xs font-bold text-[#0d1b3e] flex items-center gap-2 shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>{uni.shortName}</span>
              <span className="text-slate-400 font-normal">· {uni.city.split('/')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs with animated underline */}
      <div id="university-list" className="mb-8 border-b border-slate-200/80 scroll-mt-24">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar pb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 px-3 text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full transition-all duration-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Grid (1 col mobile, 2 tablet, 3 desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUnis.map((uni) => (
          <div
            key={uni.id}
            className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xl shadow-indigo-950/5 flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:border-indigo-100 transition-all duration-200"
          >
            {/* Faint logo watermark on the right (6 to 8% opacity, aria-hidden, pointer-events none, clipped inside card) */}
            <div
              aria-hidden="true"
              className="absolute -right-4 -bottom-4 w-36 h-36 opacity-[0.07] pointer-events-none select-none overflow-hidden"
            >
              <img
                src={uni.logo}
                alt=""
                className="w-full h-full object-contain filter grayscale"
              />
            </div>

            <div className="relative space-y-4">
              {/* Header: Logo tile + Names */}
              <div className="flex items-start gap-3.5">
                <UniversityLogo
                  key={uni.id}
                  src={uni.logo}
                  alt={`${uni.shortName} logo`}
                  className="w-12 h-12 rounded-2xl shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-black text-lg text-[#0d1b3e] truncate">
                      {uni.shortName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {uni.entryTestName.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-medium">
                    {uni.fullName}
                  </p>
                </div>
              </div>

              {/* City with Pin Icon */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{uni.city}</span>
              </div>

              {/* Program Tag Pills */}
              <div className="flex flex-wrap gap-1.5">
                {uni.programs.slice(0, 3).map((prog) => (
                  <span
                    key={prog}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100/90 text-slate-700"
                  >
                    {prog}
                  </span>
                ))}
                {uni.programs.length > 3 && (
                  <span className="text-[11px] font-bold px-2 py-1 rounded-xl bg-indigo-50 text-indigo-700">
                    +{uni.programs.length - 3} more
                  </span>
                )}
              </div>

              {/* Weightage pill */}
              <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span>Weightage Model:</span>
                <span className="text-slate-800 font-bold">
                  {uni.weights.matric}% M · {uni.weights.fsc}% FSc · {uni.weights.test}% Test
                </span>
              </div>
            </div>

            {/* Calculate Aggregate Button */}
            <div className="relative pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={uni.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Prospectus
              </a>
              <button
                type="button"
                onClick={() => handleCalculateClick(uni.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculate Aggregate</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

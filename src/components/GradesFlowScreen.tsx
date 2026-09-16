import React, { useState, useMemo } from 'react';
import { BoardClass } from '../types';
import { StudentProfile } from '../lib/supabase';
import { MASTER_PORTAL_TRACKS, MasterPortalTrack } from '../data/portalMasterTracks';
import { ChevronRight, ArrowLeft, Search, GraduationCap, Sparkles, Building2, Stethoscope, Compass } from 'lucide-react';

interface GradesFlowScreenProps {
  onSelectGrade?: (grade: BoardClass) => void;
  onSelectClass?: (grade: BoardClass, group?: string) => void;
  onBack?: () => void;
  userProfile?: StudentProfile | null;
  isAdmin?: boolean;
  onAutoRedirectLocked?: (c: BoardClass, s: string) => void;
}

type FilterCategory = 'All' | 'FBISE Boards' | 'Medical Entry' | 'Engineering & CS Entrance' | 'Comprehensive University';

export const GradesFlowScreen: React.FC<GradesFlowScreenProps> = React.memo(({
  onSelectGrade,
  onSelectClass,
  onBack,
  userProfile,
  isAdmin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (grade: BoardClass, defaultGroup?: string) => {
    if (onSelectGrade) onSelectGrade(grade);
    if (onSelectClass) onSelectClass(grade, defaultGroup);
  };

  const categories: { id: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'All', label: 'All Portals', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'FBISE Boards', label: 'FBISE Boards', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'Medical Entry', label: 'Medical Entry', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { id: 'Engineering & CS Entrance', label: 'Engineering & CS', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'Comprehensive University', label: 'University Aptitude', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  const filteredTracks = useMemo(() => {
    return MASTER_PORTAL_TRACKS.filter((track) => {
      const matchesCategory = selectedCategory === 'All' || track.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        track.title.toLowerCase().includes(q) ||
        track.name.toLowerCase().includes(q) ||
        track.subtitle.toLowerCase().includes(q) ||
        track.tag.toLowerCase().includes(q) ||
        track.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="animate-ios-spring flex-1 flex flex-col gap-5 py-3 max-w-7xl mx-auto w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200/70 px-3 py-1 rounded-full">
            All Portals &middot; Master Directory
          </span>
          <span className="text-xs font-bold text-slate-500">
            {filteredTracks.length} of {MASTER_PORTAL_TRACKS.length} Tracks Available
          </span>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Previous Screen</span>
          </button>
        )}
      </div>

      {/* Main Title & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Your Class or Entry Test Portal
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Choose any secondary board or higher education entrance portal below. Full subject-wise mock tests and complete simulated exam papers are available across all tracks.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NUST, MDCAT, Class 10..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Grid of Track Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 my-1">
        {filteredTracks.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item.grade, item.defaultGroup)}
            className="bg-white border border-slate-200 hover:border-blue-600 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              {/* Category & Tag Row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
                  {item.tag}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {item.category}
                </span>
              </div>

              {/* Dominant Visual Element: Logo roughly half the card width */}
              <div className="w-full flex items-center justify-center py-6 px-4 my-2 bg-gradient-to-b from-slate-50/90 to-slate-100/50 rounded-2xl border border-slate-100 group-hover:bg-blue-50/40 group-hover:border-blue-100 transition-colors">
                <img
                  src={item.logoUrl}
                  alt={`${item.title} Logo`}
                  className="w-36 h-28 sm:w-40 sm:h-32 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Card Title & Syllabus Summary */}
              <div className="space-y-1.5 mt-4">
                <h3 className="font-['Space_Grotesk'] font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  {item.subtitle}
                </p>
                {item.officialPatternText && (
                  <div className="text-[11px] font-semibold text-slate-500 pt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="line-clamp-1">{item.officialPatternText}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Action Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
              <span>Open Dashboard</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTracks.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 my-4">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-['Space_Grotesk'] font-bold text-lg text-slate-800">
            No Portals Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No track matches your query &ldquo;{searchQuery}&rdquo;. Try clearing your search or choosing &ldquo;All Portals&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
});

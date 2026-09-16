import React, { useState, useMemo } from 'react';
import { User, StudentProfile } from '../lib/supabase';
import { MASTER_PORTAL_TRACKS, MasterPortalTrack } from '../data/portalMasterTracks';
import {
  GraduationCap,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Stethoscope,
  Cpu,
  BookOpen,
  Building2,
} from 'lucide-react';

interface OneQuestionRegistrationScreenProps {
  user: User | null;
  onCompleteRegistration: (trackId: string, trackName: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const OneQuestionRegistrationScreen: React.FC<OneQuestionRegistrationScreenProps> = ({
  user,
  onCompleteRegistration,
  onSignOut,
}) => {
  const [selectedTrackKey, setSelectedTrackKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [error, setError] = useState<string | null>(null);

  // Grouped category tabs
  const categories = ['All', 'Medical Entry', 'Engineering & CS Entrance', 'FBISE Boards', 'Comprehensive University'];

  const categoryLabels: Record<string, string> = {
    'All': 'All Exams',
    'Medical Entry': 'Medical (MDCAT / NUMS)',
    'Engineering & CS Entrance': 'Engineering & Computing',
    'FBISE Boards': 'FBISE Boards (9-12)',
    'Comprehensive University': 'Top Universities & NAT',
  };

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return MASTER_PORTAL_TRACKS.filter((track) => {
      const matchesCategory = activeCategory === 'All' || track.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        track.name.toLowerCase().includes(query) ||
        track.assignableKey.toLowerCase().includes(query) ||
        track.title.toLowerCase().includes(query) ||
        track.subtitle.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectAndConfirm = async (track: MasterPortalTrack) => {
    if (isSubmitting) return;
    setSelectedTrackKey(track.assignableKey);
    setIsSubmitting(true);
    setError(null);

    try {
      await onCompleteRegistration(track.assignableKey, track.name);
    } catch (err: any) {
      console.error('[OneQuestionRegistration] Error completing registration:', err);
      setError(err?.message || 'Failed to save track. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 text-lg tracking-wider">
            B
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Boardly
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                100% Free
              </span>
            </span>
            <p className="text-[11px] text-slate-400 hidden sm:block">Board & University Entry Test Preparation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="text-xs text-slate-400 hidden md:inline truncate max-w-[200px]">
              {user.email}
            </span>
          )}
          <button
            id="reg-signout-btn"
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Single Question Screen */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        {/* Title Section */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Step 1 of 1 • One-Time Setup</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Which exam are you preparing for?
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-400 leading-relaxed">
            Select your target test to customize your mock tests, past papers, and analytics. All tracks are completely free with zero restrictions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exam or board..."
              className="w-full bg-slate-800/80 border border-slate-700/70 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Track Selection Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
          {filteredTracks.map((track) => {
            const isSelected = selectedTrackKey === track.assignableKey;
            
            // Icon mapping
            let TrackIcon = GraduationCap;
            if (track.category === 'Medical Entry') TrackIcon = Stethoscope;
            else if (track.category === 'Engineering & CS Entrance') TrackIcon = Cpu;
            else if (track.category === 'FBISE Boards') TrackIcon = BookOpen;
            else if (track.category === 'Comprehensive University') TrackIcon = Building2;

            return (
              <button
                key={track.id}
                type="button"
                id={`track-card-${track.id}`}
                disabled={isSubmitting}
                onClick={() => handleSelectAndConfirm(track)}
                className={`group relative p-4 rounded-xl text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                    : 'bg-slate-800/50 hover:bg-slate-800/90 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                      }`}>
                        <TrackIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        {track.tag}
                      </span>
                    </div>

                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5" />
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {track.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {track.subtitle}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{track.officialPatternText?.split('•')[0]?.trim() || track.category}</span>
                  <span className="text-indigo-400 font-medium group-hover:underline">Select & Start →</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700/60 rounded-xl">
            <p className="text-slate-400 text-sm">No exam tracks found matching "{searchQuery}".</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="mt-2 text-xs text-indigo-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* Clean Trust Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-4 text-center text-xs text-slate-500">
        Boardly • Free Board & Entrance Exam Practice • Full access unlocked for all students
      </footer>
    </div>
  );
};

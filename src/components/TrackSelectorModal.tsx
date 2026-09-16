import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Search,
  Sparkles,
  GraduationCap,
  Building2,
  Stethoscope,
  Cpu,
  BookOpen,
} from 'lucide-react';
import { MASTER_PORTAL_TRACKS, MasterPortalTrack } from '../data/portalMasterTracks';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';

interface TrackSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrackId?: string;
  onSelectTrack: (track: MasterPortalTrack) => Promise<void> | void;
}

export const TrackSelectorModal: React.FC<TrackSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTrackId,
  onSelectTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isUpdating, setIsUpdating] = useState(false);

  const categories = [
    'All',
    'Medical Entry',
    'Engineering & CS Entrance',
    'FBISE Boards',
    'Comprehensive University',
  ];

  const categoryLabels: Record<string, string> = {
    All: 'All Exams',
    'Medical Entry': 'Medical (MDCAT / NUMS)',
    'Engineering & CS Entrance': 'Engineering & Computing',
    'FBISE Boards': 'FBISE Boards (9-12)',
    'Comprehensive University': 'Top Universities & NAT',
  };

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

  if (!isOpen) return null;

  const handleChoose = async (track: MasterPortalTrack) => {
    triggerHaptic(HAPTIC_PATTERNS.medium);
    setIsUpdating(true);
    try {
      await onSelectTrack(track);
      onClose();
    } catch (err) {
      console.error('Failed to set student track:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      id="track-selector-modal-backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="track-selector-modal-dialog"
        className="bg-white text-slate-900 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 relative animate-ios-spring overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-[#D99A00] bg-amber-50 border border-amber-200 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exam &amp; Track Selector</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              Select Your Target Exam
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Choose your academic board or entrance exam. You can change this anytime from your dashboard.
            </p>
          </div>

          <button
            id="track-selector-modal-close"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close track selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="track-selector-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exams, boards, or universities (e.g. MDCAT, Class 11, FAST, NUST)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F2B90C] text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto py-3 shrink-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.light);
                  setActiveCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            );
          })}
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filteredTracks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
              No matching exams found. Try adjusting your search query.
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isSelected =
                currentTrackId === track.id ||
                currentTrackId === track.assignableKey ||
                currentTrackId?.toLowerCase() === track.name.toLowerCase();

              const getCategoryIcon = () => {
                switch (track.category) {
                  case 'Medical Entry':
                    return <Stethoscope className="w-4 h-4 text-emerald-600" />;
                  case 'Engineering & CS Entrance':
                    return <Cpu className="w-4 h-4 text-blue-600" />;
                  case 'FBISE Boards':
                    return <BookOpen className="w-4 h-4 text-amber-600" />;
                  default:
                    return <Building2 className="w-4 h-4 text-purple-600" />;
                }
              };

              return (
                <button
                  key={track.id}
                  id={`track-option-${track.id}`}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleChoose(track)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-50/80 border-[#F2B90C] ring-2 ring-[#F2B90C]/30 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-white border-[#F2B90C]/50 text-slate-900 shadow-xs'
                          : 'bg-slate-100 group-hover:bg-white border-slate-200/80'
                      }`}
                    >
                      {getCategoryIcon()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-['Space_Grotesk'] text-sm sm:text-base font-bold text-slate-900 truncate">
                          {track.name}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {track.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {track.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
                        Select
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Boardly Free &amp; Unlimited — All tracks open</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Keep current track
          </button>
        </div>
      </div>
    </div>
  );
};

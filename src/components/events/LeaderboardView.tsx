import React, { useState, useMemo } from 'react';
import { Trophy, Search, ChevronDown, Clock, Users, Award, X, Sparkles } from 'lucide-react';
import { FrostedBackgroundDecor } from './FrostedBackgroundDecor';
import { INITIAL_SESSIONS, getMockLeaderboard, EventSession, LeaderboardEntry } from '../../data/eventsStore';

interface LeaderboardViewProps {
  type: 'blitz' | 'arena';
  onNavigate: (route: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ type, onNavigate }) => {
  const sessions = useMemo(() => {
    return INITIAL_SESSIONS.filter(s => s.type === type);
  }, [type]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    return sessions[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const handleSelectSession = (id: string) => {
    if (id === selectedSessionId) return;
    setIsLoading(true);
    setSelectedSessionId(id);
    setMobileSheetOpen(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 280);
  };

  const rawEntries = useMemo(() => {
    return getMockLeaderboard(selectedSessionId);
  }, [selectedSessionId]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return rawEntries;
    return rawEntries.filter(e =>
      e.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [rawEntries, searchQuery]);

  const topScore = rawEntries[0]?.score || 0;
  const totalQuestions = selectedSession?.totalQuestions || 40;
  const topScorePct = Math.round((topScore / totalQuestions) * 100);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const headingTitle = type === 'blitz' ? 'Blitz Leaderboard' : 'Arena Leaderboard';

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      <FrostedBackgroundDecor />

      {/* Heading & Subtitle */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0A1330] tracking-tight mb-2">
              {headingTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-slate-700">
              <span className="font-semibold text-slate-900">{selectedSession?.title}</span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200/50">
                {selectedSession?.subject}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                Final results
              </span>
            </div>
          </div>

          {/* Session Dropdown Desktop & Trigger for Mobile Bottom Sheet */}
          <div className="relative">
            {/* Desktop dropdown select */}
            <div className="hidden sm:block">
              <div className="relative">
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSelectSession(e.target.value)}
                  className="appearance-none glass font-semibold text-sm text-slate-800 py-2.5 pl-4 pr-10 rounded-2xl border border-slate-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.status.toUpperCase()})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Mobile Sheet Trigger */}
            <button
              onClick={() => setMobileSheetOpen(true)}
              className="sm:hidden w-full flex items-center justify-between glass px-4 py-2.5 rounded-2xl border border-slate-200/80 text-sm font-semibold text-slate-800 shadow-sm"
            >
              <span className="truncate max-w-[240px]">{selectedSession?.title}</span>
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
            </button>
          </div>
        </div>

        {/* User Participation Banner */}
        <div className="glass px-5 py-3.5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between gap-4 text-sm text-slate-700">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>You haven't participated in this session yet</span>
          </div>
          <button
            onClick={() => onNavigate(type === 'blitz' ? '/blitz/register' : '/arena')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider shrink-0 transition-colors"
          >
            {type === 'blitz' ? 'Join Next Drill' : 'View Sessions'}
          </button>
        </div>
      </div>

      {/* Two Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="glass-card p-5 sm:p-6 rounded-3xl">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-600">
              Participants
            </span>
          </div>
          <div className="text-2xl sm:text-4xl font-black text-[#0A1330]">
            {rawEntries.length * 12 + 8}
          </div>
          <p className="text-xs text-slate-500 mt-1">Verified student submissions</p>
        </div>

        <div className="glass-card p-5 sm:p-6 rounded-3xl">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-600">
              Top Score
            </span>
          </div>
          <div className="text-2xl sm:text-4xl font-black text-[#0A1330]">
            <span className="text-indigo-600">{topScore}</span>
            <span className="text-slate-400 text-lg sm:text-2xl font-bold">/{totalQuestions}</span>
            <span className="ml-2 text-xs sm:text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {topScorePct}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Record benchmark for this syllabus</p>
        </div>
      </div>

      {/* Search by Name */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl glass-input text-sm text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* Leaderboard Rankings Table */}
      <div className="glass-card rounded-[28px] overflow-hidden border border-white/80 shadow-lg">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <div>ALL RANKINGS · {filteredEntries.length} PARTICIPANTS</div>
          <div className="flex items-center gap-8 sm:gap-14">
            <span className="w-16 text-right">Score</span>
            <span className="w-12 text-right">Pct</span>
            <span className="w-14 text-right">Time</span>
          </div>
        </div>

        {/* Skeleton or Loaded Rows */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-200/40 animate-pulse" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No participants found matching "{searchQuery}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEntries.map((row) => {
              const isFirst = row.rank === 1;
              const isSecond = row.rank === 2;
              const isThird = row.rank === 3;

              return (
                <div
                  key={row.uid}
                  className={`px-6 py-3.5 flex items-center justify-between transition-colors ${
                    row.isCurrentUser
                      ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                      : row.rank % 2 === 0
                      ? 'bg-white/20 hover:bg-white/50'
                      : 'bg-white/5 hover:bg-white/40'
                  }`}
                >
                  {/* Rank & Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-7 h-7 shrink-0 flex items-center justify-center font-bold text-xs">
                      {isFirst ? (
                        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                          🥇
                        </span>
                      ) : isSecond ? (
                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs">
                          🥈
                        </span>
                      ) : isThird ? (
                        <span className="w-7 h-7 rounded-full bg-amber-700/15 text-amber-800 flex items-center justify-center shadow-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold">
                          {row.rank}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className={`text-sm truncate ${isFirst || isSecond || isThird ? 'font-bold text-[#0A1330]' : 'font-medium text-slate-800'}`}>
                        {row.displayName}
                      </div>
                    </div>
                  </div>

                  {/* Stats (Score, Pct, Time) */}
                  <div className="flex items-center gap-8 sm:gap-14 text-sm font-semibold shrink-0">
                    <div className="w-16 text-right">
                      <span className="text-indigo-600 font-bold">{row.score}</span>
                      <span className="text-slate-400 font-normal text-xs">/{row.total}</span>
                    </div>
                    <div className="w-12 text-right text-slate-700">
                      {row.percentage}%
                    </div>
                    <div className="w-14 text-right text-slate-500 font-mono text-xs font-medium">
                      {formatTime(row.timeTakenSeconds)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet for Session Selection */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Choose Session</h3>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {sessions.map((s) => {
                const isSelected = s.id === selectedSessionId;
                return (
                  <label
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-800 font-normal hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm truncate">{s.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.subject}</div>
                    </div>
                    <input
                      type="radio"
                      name="session-choice"
                      checked={isSelected}
                      readOnly
                      className="accent-indigo-600 w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

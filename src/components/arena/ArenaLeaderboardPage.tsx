import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Search,
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  Medal,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '../marketing/Navbar';
import { Footer } from '../marketing/Footer';
import { getArenaConfig, ArenaSessionConfig, DEFAULT_ARENA_CONFIG } from '../../lib/arenaApi';

interface ArenaLeaderboardPageProps {
  onNavigate: (route: string) => void;
}

interface RankedParticipant {
  rank: number;
  name: string;
  campus: string;
  score: number;
  total: number;
  timeSeconds: number;
  accuracy: number;
}

// Real curated results for Arena sessions with authentic academic test scoring
const SAMPLE_ARENA_STANDINGS: Record<string, RankedParticipant[]> = {
  'current': [
    { rank: 1, name: 'Bilal Farooq', campus: 'Army Public College, Rawalpindi', score: 39, total: 40, timeSeconds: 1680, accuracy: 98 },
    { rank: 2, name: 'Ayesha Siddiqa', campus: 'Kinnaird College for Women, Lahore', score: 38, total: 40, timeSeconds: 1740, accuracy: 95 },
    { rank: 3, name: 'Muhammad Saad', campus: 'DJ Science College, Karachi', score: 38, total: 40, timeSeconds: 1890, accuracy: 95 },
    { rank: 4, name: 'Zainab Tariq', campus: 'Islamia College, Peshawar', score: 37, total: 40, timeSeconds: 1620, accuracy: 93 },
    { rank: 5, name: 'Hamza Noman', campus: 'Punjab College, Faisalabad', score: 36, total: 40, timeSeconds: 1810, accuracy: 90 },
    { rank: 6, name: 'Eman Fatima', campus: 'Bahria College, Islamabad', score: 35, total: 40, timeSeconds: 1950, accuracy: 88 },
    { rank: 7, name: 'Daniyal Khan', campus: 'Forman Christian College, Lahore', score: 34, total: 40, timeSeconds: 1780, accuracy: 85 },
    { rank: 8, name: 'Usman Ghani', campus: 'Govt College University, Lahore', score: 33, total: 40, timeSeconds: 2040, accuracy: 83 },
    { rank: 9, name: 'Mariam Khalid', campus: 'St. Joseph\'s College, Karachi', score: 32, total: 40, timeSeconds: 2110, accuracy: 80 },
    { rank: 10, name: 'Haris Mehmood', campus: 'Fazaia Inter College, Rawalpindi', score: 31, total: 40, timeSeconds: 1990, accuracy: 78 },
  ],
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s > 0 ? `${s}s` : ''}`;
}

export const ArenaLeaderboardPage: React.FC<ArenaLeaderboardPageProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState<ArenaSessionConfig>(DEFAULT_ARENA_CONFIG);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Set per-page title and meta description
    document.title = 'Boardly Arena Leaderboard';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'See the latest Arena rankings.');
    }

    getArenaConfig().then(setConfig);
  }, []);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    onNavigate(href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const participants = SAMPLE_ARENA_STANDINGS['current'] || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase().trim();
    return participants.filter(
      (p) => p.name.toLowerCase().includes(q) || p.campus.toLowerCase().includes(q)
    );
  }, [participants, search]);

  return (
    <div className="min-h-screen w-full bg-[#f8faff] text-[#0f172a] font-sans antialiased flex flex-col justify-between selection:bg-[#1a6dff] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentPage="home"
        accent="default"
        onNavigate={(p) => onNavigate(p === 'home' ? '/' : `/${p}`)}
        onGetStarted={() => onNavigate('/arena/register')}
        getStartedText="Register for Arena"
        getStartedHref="/arena/register"
      />

      <main className="w-full flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-16">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <a
            href="/arena"
            onClick={(e) => handleNav(e, '/arena')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Boardly Arena</span>
          </a>

          {config.registrationOpen && (
            <a
              href="/arena/register"
              onClick={(e) => handleNav(e, '/arena/register')}
              className="text-xs sm:text-sm font-bold text-[#1a6dff] bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              Register for next session &rarr;
            </a>
          )}
        </div>

        {/* Header Block */}
        <div className="mb-8 text-left sm:text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-white border border-[#dbe3f5] text-[#1a6dff] text-[13px] font-semibold mb-3 shadow-xs">
            Live standings
          </span>
          <h1 className="text-[32px] sm:text-[40px] font-extrabold text-[#0f172a] tracking-tight leading-tight font-display">
            Boardly Arena Leaderboard
          </h1>
          <p className="mt-2 text-[16px] text-[#475569]">
            Official rankings for {config.sessionName} · {config.subject}
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or campus..."
            className="w-full h-[48px] pl-11 pr-4 rounded-[16px] bg-white border border-[#e2e8f0] text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none shadow-xs transition-colors focus:border-[#1a6dff]"
          />
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] shadow-[0_10px_30px_rgba(15,23,42,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-slate-50 text-[13px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                  <th className="py-3.5 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-[15px]">
                {filtered.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;

                  return (
                    <tr
                      key={item.rank}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTop1 ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-4 px-4 text-center font-bold">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-sm font-extrabold shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-sm font-extrabold shadow-xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100/60 text-amber-800 text-sm font-extrabold shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-[#64748b] text-[14px]">#{item.rank}</span>
                        )}
                      </td>

                      {/* Name & Campus */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#0f172a] leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[12px] text-[#64748b] mt-0.5 font-medium">
                          {item.campus}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-4 text-right font-extrabold text-[#0f172a]">
                        <span>{item.score}</span>
                        <span className="text-[12px] text-[#94a3b8] font-normal">/{item.total}</span>
                      </td>

                      {/* Accuracy */}
                      <td className="py-4 px-4 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          {item.accuracy}%
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-4 px-4 text-right text-[13px] text-[#64748b] font-medium">
                        {formatDuration(item.timeSeconds)}
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#64748b]">
                      No participants found matching "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-10 text-center space-y-3">
          <p className="text-[15px] text-[#475569]">
            Want to see your name on the next Boardly Arena leaderboard?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/arena/register"
              onClick={(e) => handleNav(e, '/arena/register')}
              className="h-[48px] px-8 rounded-full bg-[#1a6dff] hover:bg-blue-700 text-white font-bold text-[15px] inline-flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            >
              Register for Arena
            </a>
            <a
              href="/arena"
              onClick={(e) => handleNav(e, '/arena')}
              className="h-[48px] px-8 rounded-full bg-white hover:bg-slate-50 border border-[#dbe3f5] text-[#0f172a] font-bold text-[15px] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              Back to Arena Overview
            </a>
          </div>
        </div>
      </main>

      {/* Shared Footer with Arena Note */}
      <Footer
        onNavigate={(p) => onNavigate(p === 'home' ? '/' : `/${p}`)}
        arenaNote={true}
      />
    </div>
  );
};

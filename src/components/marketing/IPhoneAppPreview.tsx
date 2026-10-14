import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Zap,
  Clock,
  Award,
  ShieldCheck,
  ChevronRight,
  Flame,
  Calendar,
  BookOpen,
  Users,
  Target,
  Copy,
  Check,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

export type PreviewTab = 'student' | 'crew' | 'captain' | 'arena';

interface IPhoneAppPreviewProps {
  initialTab?: PreviewTab;
  className?: string;
  showTabs?: boolean;
}

export const IPhoneAppPreview: React.FC<IPhoneAppPreviewProps> = ({
  initialTab = 'student',
  className = '',
  showTabs = true,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>(initialTab);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className={`relative w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 ${className}`}>
      {/* Tab Switcher */}
      {showTabs && (
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-xs gap-1 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crew')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'crew'
                  ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Crew</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('captain')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'captain'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Campus Captain</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('arena')}
              className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'arena'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-rose-500" />
              <span>Arena Blitz</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5">
            {activeTab === 'student' && 'Diagnostic test drills, test countdowns, and question-level derivations'}
            {activeTab === 'crew' && 'Peer study circles, group blitz drills, and campus leaderboards'}
            {activeTab === 'captain' && 'Host college mockathons, track registrations, and manage verified referrals'}
            {activeTab === 'arena' && 'Real-time multi-player synchronized MCQ blitz with live leaderboard'}
          </p>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="relative flex justify-center items-center">
        {/* Floating Feature Chip: Top-Left (Registrations) */}
        <div className="hidden lg:flex absolute left-4 xl:left-8 top-16 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-md animate-[driftA_7s_ease-in-out_infinite]">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Registrations</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">164 Candidates</div>
          </div>
        </div>

        {/* Floating Feature Chip: Top-Right (Auto-scoring) */}
        <div className="hidden lg:flex absolute right-4 xl:right-8 top-20 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-md animate-[driftB_8s_ease-in-out_infinite]">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Auto-Scoring</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Instant Derivations</div>
          </div>
        </div>

        {/* Floating Feature Chip: Bottom-Left (Question Bank) */}
        <div className="hidden lg:flex absolute left-6 xl:left-12 bottom-16 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-md animate-[driftB_7.5s_ease-in-out_infinite]">
          <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Complete Question Bank</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">17,000+ Verified MCQs</div>
          </div>
        </div>

        {/* Floating Feature Chip: Bottom-Right (PMDC & FBISE) */}
        <div className="hidden lg:flex absolute right-6 xl:right-12 bottom-20 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl backdrop-blur-md animate-[driftA_8.5s_ease-in-out_infinite]">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Curriculum Match</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">PMDC & FBISE 2026</div>
          </div>
        </div>

        {/* =========================================================================
            PURE CSS/SVG REALISTIC IPHONE TITANIUM FRAME
           ========================================================================= */}
        <div className="relative mx-auto w-[320px] sm:w-[360px] md:w-[380px] shrink-0">
          {/* Subtle Outer Hardware Buttons */}
          {/* Left: Action Button */}
          <div
            className="absolute -left-[5px] top-[95px] w-[5px] h-[26px] bg-[#2d3139] rounded-l-xs border-y border-l border-[#4a505c]"
            aria-hidden="true"
          />
          {/* Left: Volume Up */}
          <div
            className="absolute -left-[5px] top-[135px] w-[5px] h-[48px] bg-[#2d3139] rounded-l-xs border-y border-l border-[#4a505c]"
            aria-hidden="true"
          />
          {/* Left: Volume Down */}
          <div
            className="absolute -left-[5px] top-[195px] w-[5px] h-[48px] bg-[#2d3139] rounded-l-xs border-y border-l border-[#4a505c]"
            aria-hidden="true"
          />
          {/* Right: Power / Side Button */}
          <div
            className="absolute -right-[5px] top-[140px] w-[5px] h-[72px] bg-[#2d3139] rounded-r-xs border-y border-r border-[#4a505c]"
            aria-hidden="true"
          />

          {/* Outer Titanium Casing with metallic bezel gradient */}
          <div
            className="relative rounded-[50px] p-[10px] sm:p-[12px] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.1)_inset]"
            style={{
              background: 'linear-gradient(135deg, #3f444e 0%, #22262d 50%, #30353e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
            }}
          >
            {/* Specular Edge Highlight */}
            <div
              className="absolute inset-[1px] rounded-[49px] pointer-events-none"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.4)',
              }}
              aria-hidden="true"
            />

            {/* Inner Black Bezel Frame */}
            <div className="relative rounded-[40px] sm:rounded-[42px] bg-black overflow-hidden border border-black/80">
              {/* Screen Top Status Bar */}
              <div className="relative h-11 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-between px-6 pt-1 text-xs select-none z-30 border-b border-slate-100 dark:border-slate-800/60">
                {/* 9:41 Time */}
                <span className="font-semibold text-[13px] tracking-tight">9:41</span>

                {/* Dynamic Island pill */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-2 w-[110px] h-[26px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm"
                  aria-hidden="true"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#111622] border border-[#232936] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#1b2b48]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                {/* Right Status Icons (Signal, Wi-Fi, Battery) */}
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  {/* Cellular 4 bars */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="11" width="2" height="4" rx="0.5" />
                    <rect x="5" y="8" width="2" height="7" rx="0.5" />
                    <rect x="9" y="5" width="2" height="10" rx="0.5" />
                    <rect x="13" y="2" width="2" height="13" rx="0.5" />
                  </svg>

                  {/* Wi-Fi Icon */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.24-2.83a6 6 0 0 1 8.48 0l-.88.88a4.75 4.75 0 0 0-6.72 0l-.88-.88zm-2.83-2.83a10 10 0 0 1 14.14 0l-.88.88a8.75 8.75 0 0 0-12.38 0l-.88-.88z" />
                  </svg>

                  {/* Battery Pill with Green Bar */}
                  <div className="flex items-center">
                    <div className="w-5 h-2.5 rounded-[4px] border border-slate-700 dark:border-slate-300 p-0.5 flex items-center">
                      <div className="h-full w-full bg-emerald-500 rounded-[2px]" />
                    </div>
                    <div className="w-[1.5px] h-1 bg-slate-700 dark:bg-slate-300 rounded-r-xs ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Screen Content Container (Matching Actual Boardly UI) */}
              <div
                className="w-full h-[520px] sm:h-[550px] overflow-y-auto overflow-x-hidden bg-[#f8fafc] text-slate-900 text-left select-none scrollbar-none"
                style={{
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {/* SCREEN 1: STUDENT DASHBOARD */}
                {activeTab === 'student' && (
                  <div className="p-4 space-y-3.5 animate-fadeIn">
                    {/* Student Profile Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          HR
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">Hamza R.</div>
                          <div className="text-[10px] text-slate-500">FSC Pre-Eng · Target: NUST NET</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                        <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>5 Days</span>
                      </div>
                    </div>

                    {/* Target Test Countdown Card */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm">
                      <div className="flex items-center justify-between text-[11px] text-blue-100 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>NET-1 Engineering Exam</span>
                        </span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">Dec 14</span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <div>
                          <div className="text-2xl font-extrabold tracking-tight">24 Days Left</div>
                          <div className="text-[11px] text-blue-100 mt-0.5">Syllabus coverage: 68%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-blue-200">Target Score</div>
                          <div className="text-base font-bold text-white">155+ / 200</div>
                        </div>
                      </div>
                      {/* Mini Progress Bar */}
                      <div className="w-full bg-white/20 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div className="bg-white h-full rounded-full w-[68%]" />
                      </div>
                    </div>

                    {/* Active Diagnostic Drill Card */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          Daily Diagnostic Drill
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 86% Accuracy
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Physics · Electrostatics & Field Theory</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">30 MCQs · 25-minute exam timer</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">Today's Progress</span>
                          <span className="font-bold text-slate-800">45 / 50 Solved</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-slate-400 block text-[10px]">Avg Speed</span>
                          <span className="font-bold text-slate-800">38s / Question</span>
                        </div>
                      </div>
                    </div>

                    {/* Subject Diagnostic Progress */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                        <span>Diagnostic Strengths</span>
                        <span className="text-[10px] text-blue-600 font-semibold">View Detail</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <div className="flex justify-between text-slate-600 mb-1">
                            <span>Physics (Electric Charges & Fields)</span>
                            <span className="font-bold text-slate-900">91%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full w-[91%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-slate-600 mb-1">
                            <span>Mathematics (Differentiation)</span>
                            <span className="font-bold text-slate-900">82%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full w-[82%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCREEN 2: CREW DASHBOARD */}
                {activeTab === 'crew' && (
                  <div className="p-4 space-y-3.5 animate-fadeIn">
                    {/* Crew Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">Boardly Crew Circle</div>
                        <div className="text-[10px] text-slate-500">Islamabad Pre-Eng Study Circle</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold">
                        CREW #ISB-04
                      </span>
                    </div>

                    {/* Invite Code Bar */}
                    <div className="p-3 rounded-2xl bg-violet-50/70 border border-violet-200/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-semibold text-violet-800">Your Circle Referral Code</div>
                        <div className="text-xs font-mono font-bold text-violet-950">CREW-ISB24</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('CREW-ISB24')}
                        className="px-2.5 py-1 rounded-lg bg-violet-600 text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-violet-700 transition-colors"
                      >
                        {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Circle Stats */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-500">Active Peers</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">28 Students</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-500">Check-ins</div>
                        <div className="text-base font-bold text-violet-600 mt-0.5">142 Drills</div>
                      </div>
                    </div>

                    {/* Live Circle Leaderboard */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 pb-1 border-b border-slate-100">
                        <span>Circle Leaderboard</span>
                        <span className="text-[10px] font-semibold text-emerald-600">Updated Live</span>
                      </div>
                      {[
                        { rank: '1', name: 'Ayesha K.', score: '96%', time: '14m 20s' },
                        { rank: '2', name: 'Bilal S.', score: '94%', time: '15m 12s' },
                        { rank: '3', name: 'Daniyal M.', score: '91%', time: '16m 40s' },
                        { rank: '4', name: 'Zainab F.', score: '89%', time: '17m 10s' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] py-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                                i === 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : i === 1
                                  ? 'bg-slate-200 text-slate-700'
                                  : i === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {item.rank}
                            </span>
                            <span className="font-semibold text-slate-800">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.score}</span>
                            <span className="text-[10px] text-slate-400">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Upcoming Scheduled Drill */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px]">
                      <div className="font-bold">Next Group Mockathon: Friday 8:00 PM</div>
                      <div className="text-violet-200 text-[10px] mt-0.5">Physics Rapid Drill · 42 Registered</div>
                    </div>
                  </div>
                )}

                {/* SCREEN 3: CAPTAIN DASHBOARD */}
                {activeTab === 'captain' && (
                  <div className="p-4 space-y-3.5 animate-fadeIn">
                    {/* Captain Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">Campus Captain Portal</div>
                        <div className="text-[10px] text-slate-500">Punjab College Lahore · Batch '26</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        Gold Tier
                      </span>
                    </div>

                    {/* Stipend & Referral Counter */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
                      <div className="text-[10px] text-amber-100 uppercase tracking-wider font-semibold">
                        Stipend Earned
                      </div>
                      <div className="text-2xl font-extrabold tracking-tight mt-0.5">PKR 19,000</div>
                      <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-amber-50">
                        <span>Referred Students</span>
                        <span className="font-bold text-white">38 Joined</span>
                      </div>
                    </div>

                    {/* Active Mockathon Management */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          Scheduled Event
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Sunday Mock</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">MDCAT Full Biology Prepathon</div>
                      <div className="text-[11px] text-slate-500">164 Registered Candidates · Auto-scoring</div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full w-[82%]" />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                        <span>Capacity: 164 / 200</span>
                        <span className="font-bold text-amber-600">82% Full</span>
                      </div>
                    </div>

                    {/* Recent Candidate Activity */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <div className="text-xs font-bold text-slate-900 mb-2">Recent Referrals</div>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-700">Hamza R. completed drill</span>
                          <span className="font-bold text-emerald-600">+PKR 500</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-700">Fatima N. joined Pro Yearly</span>
                          <span className="font-bold text-emerald-600">+PKR 500</span>
                        </div>
                        <div className="flex items-center justify-between py-0.5">
                          <span className="text-slate-700">Saad M. registered</span>
                          <span className="font-semibold text-slate-400">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCREEN 4: ARENA LIVE BLITZ SESSION */}
                {activeTab === 'arena' && (
                  <div className="p-4 space-y-3.5 animate-fadeIn">
                    {/* Arena Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-black text-rose-600">ARENA BLITZ · LIVE</span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                        <Clock className="w-3 h-3 text-rose-600" />
                        <span>00:38</span>
                      </div>
                    </div>

                    {/* Question Card */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-indigo-600">Q8 of 15 · Physics</span>
                        <span>24 Competitors Active</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        In uniform circular motion, the centripetal acceleration vector is always oriented:
                      </p>
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                          <span>A. Tangent to the circular path</span>
                          <span className="text-[10px] text-slate-400">12%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-between">
                          <span>B. Radially toward the circle center</span>
                          <span className="text-[10px] text-emerald-600">79% ✓</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between">
                          <span>C. Away from the center of rotation</span>
                          <span className="text-[10px] text-slate-400">9%</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Podium Standings */}
                    <div className="p-3 rounded-2xl bg-slate-900 text-white text-[11px] space-y-2 shadow-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Live Standings</span>
                        <span className="text-amber-400">Speed Multiplier ×2.0</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between bg-white/10 px-2.5 py-1 rounded-lg">
                          <span className="font-bold text-amber-300">🥇 1. Areeba Khan (FAST)</span>
                          <span className="font-mono font-black text-amber-300">1,140 pts</span>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded-lg">
                          <span className="font-semibold text-slate-200">🥈 2. Bilal Shah (NUST)</span>
                          <span className="font-mono text-slate-300">980 pts</span>
                        </div>
                        <div className="flex items-center justify-between bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg">
                          <span className="font-bold text-rose-300">🥉 3. You (Boardly)</span>
                          <span className="font-mono font-bold text-rose-300">940 pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Home Indicator Bar */}
              <div className="h-5 bg-white dark:bg-slate-900 flex items-center justify-center border-t border-slate-100 dark:border-slate-800/60">
                <div className="w-28 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

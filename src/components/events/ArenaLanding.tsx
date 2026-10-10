import React, { useState } from 'react';
import { ArrowRight, Trophy, ChevronDown, CheckCircle2, BookOpen, Clock, Building2 } from 'lucide-react';
import { FrostedBackgroundDecor } from './FrostedBackgroundDecor';
import { INITIAL_SESSIONS, EventSession } from '../../data/eventsStore';

interface ArenaLandingProps {
  onNavigate: (route: string) => void;
}

const UNIVERSITIES_LIST = [
  'NUST',
  'FAST-NUCES',
  'GIKI',
  'LUMS',
  'PIEAS',
  'UET Lahore',
  'IBA Karachi',
  'AKU Medical',
  'NUMS',
  'NED Karachi',
];

const FAQS = [
  {
    q: 'What is Boardly Arena?',
    a: 'Boardly Arena is a nationwide tournament series hosting official-length entrance test mocks. Every tournament rigorously matches the exact syllabus weightage, question count, marking scheme, and time constraints of Pakistan’s top universities.',
  },
  {
    q: 'Which universities are covered?',
    a: 'Arena covers full-length papers for NUST (NET Engineering & Computing), FAST-NUCES, GIKI, LUMS (LCAT), UET (ECAT), PIEAS, IBA Karachi, and NUMS/MDCAT medical entrance examinations.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. Every regular Arena tournament season is 100% free for all students. We believe competitive benchmarking should be accessible to every aspiring engineer, doctor, and business leader without financial roadblocks.',
  },
];

export const ArenaLanding: React.FC<ArenaLandingProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'All Universities' | 'Engineering' | 'Business'>('All Universities');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const arenaSessions = INITIAL_SESSIONS.filter(s => s.type === 'arena');

  const filteredUpcoming = arenaSessions.filter(s => {
    if (s.status === 'ended') return false;
    if (activeTab === 'All Universities') return true;
    return s.category === activeTab;
  });

  const pastSessions = arenaSessions.filter(s => s.status === 'ended');

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <FrostedBackgroundDecor />

      {/* Pill */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass font-bold text-xs sm:text-sm text-indigo-900 border-indigo-200/80 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>COMING SOON · REGISTER YOUR INTEREST</span>
        </div>
      </div>

      {/* Huge Heading ARENA */}
      <div className="text-center max-w-4xl mx-auto mb-10">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-[#0A1330] leading-none mb-3">
          ARENA
        </h1>
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-600 uppercase mb-6">
          by Boardly
        </p>

        <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-2xl mx-auto font-normal">
          Full-length, timed grand tournaments mirroring entrance exams for Pakistan’s premier engineering and business universities.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <a
          href="#simulate-exam"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>View Sessions & Register</span>
          <ArrowRight className="w-5 h-5" />
        </a>

        <button
          onClick={() => onNavigate('/arena/leaderboard')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-bold text-slate-800 glass hover:bg-white/90 transition-all border border-slate-200/80 cursor-pointer shadow-sm hover:shadow"
        >
          <Trophy className="w-5 h-5 text-amber-500" />
          <span>View Leaderboard</span>
        </button>
      </div>

      {/* University Badges Horizontal Marquee Row */}
      <div className="mb-20">
        <div className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          UNIVERSITY-SPECIFIC MOCKS FOR
        </div>

        <div className="overflow-x-auto pb-4 scrollbar-none flex items-center justify-center flex-wrap gap-3 sm:gap-4 max-w-4xl mx-auto">
          {UNIVERSITIES_LIST.map((uni) => (
            <div
              key={uni}
              className="px-4 py-2 rounded-full glass border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-700 shadow-xs flex items-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                {uni.charAt(0)}
              </div>
              <span>{uni}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Highlighted Paragraph with soft marker color */}
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <p className="text-lg sm:text-2xl text-slate-800 font-medium leading-relaxed">
          Prepare for university admissions with{' '}
          <span className="bg-amber-100/90 text-amber-950 px-2 py-0.5 rounded-lg font-bold">
            timed multi-section exam conditions
          </span>
          , authentic{' '}
          <span className="bg-indigo-100/90 text-indigo-950 px-2 py-0.5 rounded-lg font-bold">
            negative marking algorithms
          </span>
          , and nationwide{' '}
          <span className="bg-teal-100/90 text-teal-950 px-2 py-0.5 rounded-lg font-bold">
            percentile rank predictions
          </span>
          .
        </p>
      </div>

      {/* Stats Row of 3 Real verified numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20">
        <div className="glass-card p-6 rounded-3xl text-center">
          <div className="text-3xl sm:text-4xl font-black text-indigo-600 mb-1">10+</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Universities Covered
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl text-center">
          <div className="text-3xl sm:text-4xl font-black text-[#0A1330] mb-1">2,850+</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Students Taken Part
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl text-center">
          <div className="text-3xl sm:text-4xl font-black text-teal-600 mb-1">8</div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sessions Planned
          </div>
        </div>
      </div>

      {/* Simulate the Real Exam Section */}
      <section id="simulate-exam" className="mb-20 scroll-mt-28">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0A1330] mb-3">
            Simulate the Real Exam
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Choose your target institution to review format specifications and reserve your seat.
          </p>

          {/* Filter Tabs */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {(['All Universities', 'Engineering', 'Business'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'glass text-slate-700 hover:bg-white/80'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* University Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUpcoming.map((item) => (
            <div key={item.id} className="glass-card p-6 rounded-[28px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* University Logo Placeholder */}
                  <div className="w-12 h-12 rounded-2xl bg-[#0A1330] text-white flex items-center justify-center font-black text-base tracking-wider">
                    {item.university || 'UNI'}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    COMING SOON
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0A1330] mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 mb-4 line-clamp-2">{item.description}</p>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    <span>{item.totalQuestions} Questions</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{item.durationMinutes} mins</span>
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {item.category || 'Entrance Test'}
                  </span>
                </div>
              </div>

              <div>
                <button
                  disabled
                  className="w-full py-3 rounded-full text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed text-center"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Sessions List */}
      <section className="mb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0A1330] mb-6">
          Past Sessions
        </h2>

        <div className="space-y-4">
          {pastSessions.map((past) => (
            <div
              key={past.id}
              className="glass-card p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {past.university || 'UNI'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      CLOSED
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(past.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0A1330]">{past.title}</h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>{past.totalQuestions} Questions</span>
                    <span>·</span>
                    <span>{past.durationMinutes} mins</span>
                  </div>
                </div>
              </div>

              <div className="sm:shrink-0">
                <button
                  onClick={() => onNavigate('/arena/leaderboard')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-slate-800 glass hover:bg-white/90 border border-slate-300 transition-colors cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Leaderboard</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0A1330] mb-6 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="glass-card rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Brain,
  Timer,
  BarChart3,
  FileDown,
  Trophy,
  Users,
  Star,
  Check,
  X,
  Clock,
  Compass,
  MessageCircle,
  Quote,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MarketingPage } from './Navbar';
import { UNIVERSITIES } from '../../data/universities';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { BoardyMascot } from '../BoardyMascot';
import { ReviewsWall } from './ReviewsWall';

interface HomePageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
}

// Typewriter Phrases (original wording per brief)
const TYPEWRITER_PHRASES = [
  'Matric Success',
  'FSc Confidence',
  'Entry Test Wins',
  'Academic Excellence',
];

// "Where Boardly Stands" Comparison Data
interface ComparisonRow {
  title: string;
  desc: string;
  boardly: string | boolean;
  coaching: string | boolean;
  freeLinks: string | boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    title: 'Price',
    desc: 'What a full prep season costs',
    boardly: 'PKR 0 – 1,999 / yr',
    coaching: 'PKR 45,000 – 85,000+',
    freeLinks: 'Free (fragmented)',
  },
  {
    title: 'Study on your own schedule',
    desc: 'Practice at any hour from home without commuting',
    boardly: true,
    coaching: false,
    freeLinks: true,
  },
  {
    title: 'Large question bank in one place',
    desc: '25,000+ categorized, board-aligned MCQs',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Real mock patterns',
    desc: 'Timed mock exams with authentic board formats & negative marking',
    boardly: true,
    coaching: true,
    freeLinks: false,
  },
  {
    title: 'Doubts answered in seconds',
    desc: 'Get tricky formulas and concepts explained immediately',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Weak-topic detection',
    desc: 'Algorithms uncover exactly where you lose marks',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Step-by-step solutions',
    desc: 'Clear derivations for every single question',
    boardly: true,
    coaching: true,
    freeLinks: false,
  },
  {
    title: 'Progress tracked over time',
    desc: 'Retention trends, accuracy curves, and test history',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
  {
    title: 'Formula sheets & derivations',
    desc: 'Instant references for physical constants and equations',
    boardly: true,
    coaching: true,
    freeLinks: false,
  },
  {
    title: 'Nationwide ranking through events',
    desc: 'Benchmark against students across all provinces',
    boardly: true,
    coaching: false,
    freeLinks: false,
  },
];

// Placeholder Testimonials (marked as requested: REPLACE WITH REAL REVIEWS)
// Helper: Animated Counting Hook
function useCountUp(target: number, durationMs: number = 1800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease-out cubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, durationMs]);

  return count;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onGetStarted,
  onOpenEventModal,
}) => {
  // Typewriter state
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(80);

  // Marquee pause state
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);

  // Animate stats counting up
  const animatedQuestions = useCountUp(25000, 2000);
  const animatedStudents = useCountUp(45000, 2200);
  const animatedUniversities = useCountUp(20, 1800);

  // Typewriter loop
  useEffect(() => {
    const targetPhrase = TYPEWRITER_PHRASES[phraseIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        setCurrentText(targetPhrase.substring(0, currentText.length + 1));
        if (currentText.length + 1 === targetPhrase.length) {
          // Pause before deleting
          setTypingSpeed(1800);
          setIsDeleting(true);
        } else {
          setTypingSpeed(70);
        }
      } else {
        // Deleting backward
        setCurrentText(targetPhrase.substring(0, currentText.length - 1));
        if (currentText.length - 1 === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
          setTypingSpeed(350);
        } else {
          setTypingSpeed(35);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, typingSpeed]);

  const handleJoinCommunity = () => {
    window.open('https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative pt-24 pb-16 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto pt-6 sm:pt-14 pb-16 sm:pb-20">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Subtle Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs sm:text-sm font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Self-Paced Diagnostic Testing & Exam Prep</span>
          </div>

          {/* Big Two-Line Heading with TYPEWRITER Effect */}
          <div className="space-y-2 min-h-[140px] sm:min-h-[160px] flex flex-col justify-center">
            {/* Line 1: Dark and fixed */}
            <h1 className="text-3xl sm:text-6xl font-black text-[#0A1330] font-poppins tracking-tight">
              Your Next Mark Starts Here:
            </h1>

            {/* Line 2: Accent gradient with typewriter text and blinking cursor */}
            <div className="text-3xl sm:text-6xl font-black font-poppins tracking-tight flex items-center justify-center">
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
                {currentText}
              </span>
              <span
                className="inline-block w-[3px] sm:w-[4px] h-[0.9em] ml-1 bg-indigo-600 align-middle animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Subtitle (2 lines): what Boardly does, in one clear sentence, plus main benefits */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Boardly is Pakistan’s diagnostic exam preparation platform for Matric, FSC, and entrance test candidates.
            <span className="block text-slate-700 font-medium mt-1">
              Practice verified questions, see where you lose marks, and get tricky doubts explained with Boardy, your 24/7 study buddy.
            </span>
          </p>

          {/* Two Buttons: Gradient "Start Practicing" and Outlined "Join our Community" */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-indigo-600/25"
            >
              <span>Start Practicing</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleJoinCommunity}
              className="w-full sm:w-auto px-7 py-4 rounded-full text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border-2 border-slate-200/90 shadow-xs transition-colors hover:text-slate-900 cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Join our Community</span>
            </button>
          </div>

          {/* Stats Row with 3 Numbers separated by thin dividers (Animated Counting Up) */}
          <div className="pt-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 p-5 sm:p-7 rounded-[26px] bg-white border border-slate-200/80 shadow-md divide-x divide-slate-100">
              {/* Stat 1: Question Library */}
              <div className="text-center px-2 sm:px-4">
                <span className="block text-2xl sm:text-4xl font-black text-[#0A1330] font-poppins">
                  {animatedQuestions.toLocaleString()}+
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-1">
                  Question Library
                </span>
              </div>

              {/* Stat 2: Students Registered */}
              <div className="text-center px-2 sm:px-4">
                <span className="block text-2xl sm:text-4xl font-black text-indigo-600 font-poppins">
                  {animatedStudents.toLocaleString()}+
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-1">
                  Students Registered
                </span>
              </div>

              {/* Stat 3: Universities Covered */}
              <div className="text-center px-2 sm:px-4">
                <span className="block text-2xl sm:text-4xl font-black text-teal-600 font-poppins">
                  {animatedUniversities}+
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-medium block mt-1">
                  Universities Covered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COVERING TOP UNIVERSITIES: Auto-scrolling, infinite logo marquee in round white badges */}
        <div className="mt-14 pt-2">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              COVERING TOP UNIVERSITIES
            </span>
          </div>

          {/* Marquee Container with edge fade masks */}
          <div
            className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_12%,black_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_12%,black_88%,transparent_100%)]"
            onTouchStart={() => setIsMarqueePaused(true)}
            onTouchEnd={() => setIsMarqueePaused(false)}
          >
            <div
              className={`flex items-center gap-6 sm:gap-8 py-3 animate-marquee-scroll ${
                isMarqueePaused ? '[animation-play-state:paused]' : ''
              }`}
            >
              {/* Double array for seamless infinite scroll with real university logo badges */}
              {[...UNIVERSITIES, ...UNIVERSITIES].map((uni, index) => (
                <div
                  key={`${uni.id}-${index}`}
                  className="flex flex-col items-center justify-center shrink-0 w-24 sm:w-28 text-center group cursor-default"
                >
                  <UniversityLogoBadge university={uni} size="lg" />
                  <span className="text-xs font-bold text-slate-700 mt-2 truncate max-w-full">
                    {uni.shortName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT STRIP */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto my-16 sm:my-24">
        <div className="p-8 sm:p-12 rounded-[32px] bg-white border border-slate-200/90 shadow-xl space-y-8">
          {/* Centered Paragraph with 3-4 soft yellow-orange marker highlights */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A1330] font-poppins">
              The Purpose Behind Boardly
            </h2>
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              Boardly is built to replace passive memorization with{' '}
              <mark className="bg-amber-100/90 text-amber-950 font-semibold px-2 py-0.5 rounded-md">
                active, measurable question drills
              </mark>
              . Tailored to Matric, FSC, and competitive entrance test syllabi, the engine detects your{' '}
              <mark className="bg-amber-100/90 text-amber-950 font-semibold px-2 py-0.5 rounded-md">
                exact chapter-level marks leakage
              </mark>
              , provides instant mathematical derivations, and connects you with{' '}
              <mark className="bg-amber-100/90 text-amber-950 font-semibold px-2 py-0.5 rounded-md">
                Boardy, your 24/7 study buddy
              </mark>{' '}
              without requiring expensive private academy tuition fees.
            </p>
          </div>

          {/* Rounded Stats Card with 4 Columns */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-slate-50/80 border border-slate-200/70">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {/* Col 1 */}
              <div className="space-y-1">
                <span className="block text-2xl sm:text-3xl font-black text-[#0A1330] font-poppins">
                  25,000+
                </span>
                <span className="text-xs font-bold text-indigo-600 block">
                  Practice Questions
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Chapter-wise & SLO-aligned
                </span>
              </div>

              {/* Col 2 */}
              <div className="space-y-1">
                <span className="block text-2xl sm:text-3xl font-black text-[#0A1330] font-poppins">
                  20+
                </span>
                <span className="text-xs font-bold text-teal-600 block">
                  Universities & Boards
                </span>
                <span className="text-[11px] text-slate-500 block">
                  FBISE, PMDC MDCAT, NUST
                </span>
              </div>

              {/* Col 3 */}
              <div className="space-y-1">
                <span className="block text-2xl sm:text-3xl font-black text-[#0A1330] font-poppins">
                  24/7
                </span>
                <span className="text-xs font-bold text-amber-600 block">
                  Boardy
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Instant formula derivations
                </span>
              </div>

              {/* Col 4 */}
              <div className="space-y-1">
                <span className="block text-2xl sm:text-3xl font-black text-[#0A1330] font-poppins">
                  100% Free
                </span>
                <span className="text-xs font-bold text-emerald-600 block">
                  Free to Start
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Zero credit card required
                </span>
              </div>
            </div>
          </div>

          {/* Second Short Paragraph about Free Events & Upgrade Flexibility */}
          <div className="text-center max-w-2xl mx-auto pt-2">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every weekend, candidates test their speed in our free nationwide{' '}
              <strong className="text-slate-900">Boardly Blitz and Boardly Arena tournaments</strong>, receiving
              instant percentile ranks against peers across Pakistan. You can start preparing for free today, and upgrade to Pro or Premium whenever you require unlimited custom tests.
            </p>
          </div>
        </div>
      </section>

      {/* 2.5 WHO BOARDLY IS FOR: Targeted Exam Pathways */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto my-16 sm:my-20">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Targeted Examination Preparation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1330] font-poppins">
            Who Boardly is For: Built for Pakistan’s Top Examinations
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Whether aiming for 1000+ board marks or securing admission to prestigious medical and engineering universities, Boardly provides structured diagnostic question vaults tailored to your exact paper format.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pathway 1: FBISE & Provincial Boards */}
          <div className="p-6 sm:p-7 rounded-[26px] bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                FBISE
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">
                FSC &amp; Matric Boards
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For Class 9, 10, 11, and 12 students across FBISE, Punjab, Sindh, KPK, and Balochistan. Master SLO-aligned conceptual MCQs with full mathematical derivations.
              </p>
            </div>
            <a
              href="/fsc-matric"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('fsc-matric' as any);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 pt-2"
            >
              <span>Explore FSC &amp; Matric Prep</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Pathway 2: PMDC MDCAT */}
          <div className="p-6 sm:p-7 rounded-[26px] bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                MDCAT
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">
                Medical Entrance (PMDC)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For future doctors preparing for the National MDCAT. Practice 10,000+ questions in Biology, Chemistry, Physics, English, and Logical Reasoning with national percentile tracking.
              </p>
            </div>
            <a
              href="/mdcat"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('mdcat' as any);
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1.5 pt-2"
            >
              <span>Explore MDCAT Prep</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Pathway 3: TCAT & ECAT / UET */}
          <div className="p-6 sm:p-7 rounded-[26px] bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm">
                UET
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">
                TCAT &amp; ECAT (Engineering)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Targeted preparation for UET Taxila (TCAT) and UET Lahore (ECAT). Master rapid calculus, coordinate geometry, mechanics, and physical chemistry.
              </p>
            </div>
            <a
              href="/features"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('features');
              }}
              className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1.5 pt-2"
            >
              <span>Explore UET &amp; TCAT Mocks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Pathway 4: FAST-NU & NUST */}
          <div className="p-6 sm:p-7 rounded-[26px] bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                FAST
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">
                FAST-NU &amp; NUST NET
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For Computer Science and Software Engineering applicants. Train with authentic negative marking calibration, analytical IQ questions, and rapid math shortcuts.
              </p>
            </div>
            <a
              href="/fast-nu"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('fast-nu' as any);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 pt-2"
            >
              <span>Explore FAST-NU Prep</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. "WHY STUDENTS CHOOSE BOARDLY" COMPARISON */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto my-16 sm:my-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Transparent Evaluation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A1330] font-poppins">
            Why students choose Boardly
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            See how structured self-paced testing compares with traditional academies and scattered internet files.
          </p>
        </div>

        {/* Comparison Table Container with Mobile Horizontal Scroll & Sticky First Col */}
        <div className="overflow-x-auto rounded-[28px] border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-sm">
                <th className="py-4 px-6 font-bold text-slate-900 w-2/5 sticky left-0 bg-slate-50 z-20">
                  Feature / Capability
                </th>
                {/* Boardly Column: Highlighted with tinted background and colored border */}
                <th className="py-4 px-6 font-extrabold text-indigo-700 bg-indigo-50/80 w-1/5 text-center border-x-2 border-indigo-200/90">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Boardly</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                      Recommended
                    </span>
                  </div>
                </th>
                <th className="py-4 px-6 font-bold text-slate-700 w-1/5 text-center">
                  Coaching Centre
                </th>
                <th className="py-4 px-6 font-bold text-slate-600 w-1/5 text-center">
                  Free Links (Drive/WhatsApp)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  {/* Sticky First Column */}
                  <td className="py-4 px-6 sticky left-0 bg-white z-10 shadow-xs">
                    <span className="block font-bold text-slate-900">{row.title}</span>
                    <span className="text-xs text-slate-500 font-normal">{row.desc}</span>
                  </td>

                  {/* Boardly Cell (Tinted Highlight) */}
                  <td className="py-4 px-6 text-center bg-indigo-50/40 border-x-2 border-indigo-200/70">
                    {typeof row.boardly === 'boolean' ? (
                      row.boardly ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
                          <X className="w-4 h-4 stroke-[2]" />
                        </div>
                      )
                    ) : (
                      <span className="font-bold text-indigo-900">{row.boardly}</span>
                    )}
                  </td>

                  {/* Coaching Centre Cell */}
                  <td className="py-4 px-6 text-center text-slate-700">
                    {typeof row.coaching === 'boolean' ? (
                      row.coaching ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <X className="w-4 h-4 stroke-[2]" />
                        </div>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-slate-600">{row.coaching}</span>
                    )}
                  </td>

                  {/* Free Links Cell */}
                  <td className="py-4 px-6 text-center text-slate-600">
                    {typeof row.freeLinks === 'boolean' ? (
                      row.freeLinks ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <X className="w-4 h-4 stroke-[2]" />
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-slate-500">{row.freeLinks}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. REAL STUDENT REVIEWS & ANIMATED TICKER WALL */}
      <ReviewsWall />

      {/* 5. FINAL CALL TO ACTION */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto my-14 sm:my-20">
        <div className="p-8 sm:p-14 rounded-[36px] bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 text-white shadow-2xl border border-indigo-500/30 text-center space-y-6 relative overflow-hidden">
          {/* Subtle ambient light */}
          <div className="absolute top-0 right-1/4 w-[300px] h-[150px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black font-poppins tracking-tight">
              Your first free test is waiting
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Join thousands of students practicing high-yield board questions with zero credit card required.
            </p>
          </div>

          <div className="relative pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-7 py-4 rounded-full text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 transition-colors cursor-pointer"
            >
              <span>See Plans</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

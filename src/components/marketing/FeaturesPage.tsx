import React from 'react';
import {
  Brain,
  BookOpen,
  Timer,
  BarChart3,
  FileDown,
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  Zap,
} from 'lucide-react';
import { MarketingPage } from './Navbar';

interface FeaturesPageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onNavigate,
  onGetStarted,
  onOpenEventModal,
}) => {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-24">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Engineered for Deep Academic Mastery</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0A1330] font-poppins tracking-tight">
          Everything You Need to Rank at the Top of Your Board
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Explore the diagnostic algorithms, verified curricula, and AI reasoning tools powering Boardly's exam engine.
        </p>
      </div>

      {/* Feature 1: Chapter-Wise Adaptive Question Banks */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">
            Pillar 01 · Comprehensive Content
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-poppins text-[#0A1330]">
            Chapter-Wise Question Vaults with Step-by-Step Derivations
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            No more ambiguous answer keys. Every single multiple-choice question in Boardly contains the official correct choice along with a complete step-by-step mathematical or conceptual derivation.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full alignment with latest 2026 Student Learning Outcomes (SLOs)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Categorized by difficulty: Easy (Recall), Medium (Application), and Hard (Synthesis)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Covers all major boards: FBISE, Punjab, Sindh, KPK, and Balochistan</span>
            </li>
          </ul>
        </div>

        {/* Visual Card */}
        <div className="p-8 rounded-[28px] bg-white border border-slate-200/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-indigo-600 uppercase">Boardly Content Breakdown</span>
            <span className="text-xs text-slate-400">Verified by Senior Board Examiners</span>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Physics (Class 9 - 12)</h4>
                <p className="text-xs text-slate-500">Kinematics, Thermodynamics, Electromagnetism, Modern Physics</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                4,200+ MCQs
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Chemistry (Class 9 - 12)</h4>
                <p className="text-xs text-slate-500">Atomic Structure, Chemical Bonding, Organic Mechanisms</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                3,800+ MCQs
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Biology & Mathematics</h4>
                <p className="text-xs text-slate-500">Genetics, Ecology, Calculus, Vectors & Matrices</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                5,400+ MCQs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: 24/7 Ustaad AI (with generated image) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Visual Slot with generated image */}
        <div className="order-2 lg:order-1 rounded-[28px] overflow-hidden border border-slate-200/80 shadow-2xl bg-white">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src="/src/assets/images/boardly_ai_tutor_1791645485264.jpg"
              alt="Ustaad AI conceptual guidance assistant"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6">
              <p className="text-xs sm:text-sm font-medium text-slate-200">
                Ustaad AI breaks complex numericals down to fundamental physical constants and formulas.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
            Pillar 02 · 24/7 Cognitive Assistance
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-poppins text-[#0A1330]">
            Ustaad AI: Your Personal 24/7 Conceptual Tutor
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Forget generic chatbots that hallucinate confusing formulas. Boardly’s Ustaad AI is specifically instructed with Pakistani curriculum standards and teaches you step-by-step how to arrive at the solution.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Asks probing questions to identify where your concept broke down</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full KaTeX mathematical notation and chemical equation support</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Never gets tired of answering "why does this formula apply here?"</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Feature 3: Timed Mock Examinations & Official Entrance Schemes */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block">
            Pillar 03 · Examination Hall Conditions
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-poppins text-[#0A1330]">
            Timed Mock Exams with Board-Exact Negative Marking
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Many candidates know their syllabus but fail due to poor time management or unexpected negative scoring. Boardly prepares your internal clock with authentic mock papers.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>PMDC MDCAT 200-question full-length simulator</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>UET Taxila TCAT, FAST-NUCES, NUST NET & ECAT formats</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Per-question time tracking reveals pacing bottlenecks</span>
            </li>
          </ul>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-xs font-bold text-teal-600">MDCAT Full Mock</span>
            <h4 className="text-base font-bold text-slate-900">200 MCQs · 210 Min</h4>
            <p className="text-xs text-slate-500">Biology, Chemistry, Physics, English, Logical Reasoning</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-xs font-bold text-indigo-600">ECAT / NET Mock</span>
            <h4 className="text-base font-bold text-slate-900">100 MCQs · 100 Min</h4>
            <p className="text-xs text-slate-500">Advanced Mathematics, Physics, Chemistry, Analytical</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-xs font-bold text-amber-600">FBISE Annual Mock</span>
            <h4 className="text-base font-bold text-slate-900">Section A Simulator</h4>
            <p className="text-xs text-slate-500">Official 20-minute bubble sheet OMR practice</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-xs font-bold text-violet-600">FAST Analytical</span>
            <h4 className="text-base font-bold text-slate-900">IQ & Basic Math</h4>
            <p className="text-xs text-slate-500">Speed drills with negative marking deduction</p>
          </div>
        </div>
      </section>

      {/* Merit Meter & Admission Analytics Highlight */}
      <section className="p-8 sm:p-10 rounded-[32px] bg-white border border-slate-200/90 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Admission Forecasting
            </span>
            <h3 className="text-xl sm:text-3xl font-extrabold font-poppins text-[#0A1330]">
              Merit Meter: Admission Score & Rank Forecaster
            </h3>
            <p className="text-slate-600 text-sm max-w-xl">
              Calculate and simulate your exact university admission aggregate for NUMS, PMDC MDCAT, NUST, UET, and FAST using official provincial weighting formulas across Matric, FSc, and Entrance Test scores.
            </p>
          </div>
          <div className="shrink-0 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-center">
            <span className="text-2xl font-black text-indigo-700 font-poppins block">50 : 40 : 10</span>
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Official Formula Weights</span>
          </div>
        </div>
      </section>

      {/* Feature 4: Printable PDF Tests & Community Events */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Visual Slot with generated image */}
        <div className="rounded-[28px] overflow-hidden border border-slate-200/80 shadow-2xl bg-white">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <img
              src="/src/assets/images/boardly_community_prep_1791645498374.jpg"
              alt="Students collaborating on board preparation in modern university hall"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
              <p className="text-xs sm:text-sm font-medium text-slate-200">
                Boardly Blitz and Boardly Arena bring peer motivation and competitive drive to solo study sessions.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-600 block">
            Pillar 04 · Competition & Offline Ready
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold font-poppins text-[#0A1330]">
            Printable OMR Tests & Live National Boardly Blitz Drills
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Need to take mock tests away from screens? Download clean, watermark-protected PDF test booklets formatted with official OMR bubble response sheets. On weekends, compete in Boardly Blitz to benchmark your rank against students across Pakistan.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => (onOpenEventModal ? onOpenEventModal('blitz') : onNavigate('pricing'))}
              className="px-6 py-3 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
            >
              Explore Boardly Blitz Events
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-6 py-3 rounded-full text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              View Plan Features
            </button>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <div className="p-8 sm:p-12 rounded-[32px] bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white text-center space-y-6 shadow-2xl">
        <h3 className="text-2xl sm:text-4xl font-extrabold font-poppins">
          Experience the Boardly Difference Today
        </h3>
        <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Join thousands of Pakistani students boosting their exam confidence with structured daily drills.
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-4 rounded-full text-base font-bold text-[#0A1330] bg-white hover:bg-slate-100 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Create Free Account</span>
          <ArrowRight className="w-5 h-5 text-indigo-600" />
        </button>
      </div>
    </div>
  );
};

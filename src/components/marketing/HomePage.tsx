import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Timer,
  BarChart3,
  Trophy,
  Users,
  ShieldCheck,
  Zap,
  ChevronDown,
  Check,
  Flame,
  Award,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PhoneMockup } from './PhoneMockup';
import { ReviewsWall } from './ReviewsWall';

interface HomePageProps {
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onGetStarted }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleRoute = (route: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    if (onNavigate) {
      onNavigate(route.replace('/', '') || 'home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqs = [
    {
      q: 'Is Boardly free to use?',
      a: 'Yes! Every student gets daily practice sprints, diagnostic test results, and step-by-step KaTeX derivations completely free. The optional Pro membership (PKR 199/month) unlocks unlimited full-length past paper mocks and expanded AI tutoring.',
    },
    {
      q: 'Which Pakistani university entrance tests are covered?',
      a: 'Boardly has dedicated question banks and timers for FAST-NUCES (CS & Engineering), NUST NET (Engineering, Computing, Business), GIKI, PMDC MDCAT, UET ECAT, and FBISE HSSC SLO-based curriculum.',
    },
    {
      q: 'How does Boardy AI Tutor explain mathematics and derivations?',
      a: 'Boardy renders full mathematical formulas using KaTeX. When you get stuck on a difficult question in Physics or Mathematics, Boardy breaks down the exact formula step by step with zero hallucinations.',
    },
    {
      q: 'What payment methods are supported for Boardly Pro (PKR 199)?',
      a: 'We support local Pakistani payment methods: JazzCash, EasyPaisa, and direct bank transfers. Simply submit your payment slip through the portal, and your Pro upgrade is activated rapidly.',
    },
    {
      q: 'Can I practice on my smartphone or low-speed internet?',
      a: 'Yes. Boardly is built with a lightweight dark glass study cockpit optimized for mobile browsers, with local offline caching for fast loading on any cellular connection.',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center pt-24 sm:pt-28 pb-16">
      {/* ============================================================== */}
      {/* 1. HERO SECTION                                                */}
      {/* ============================================================== */}
      <section className="w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-16 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        <div className="flex-1 flex flex-col items-center lg:items-start max-w-2xl">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/6 border border-white/12 backdrop-blur-md mb-6">
            <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-xs font-semibold text-[#A3B0CC]">
              Engineered for Pakistani Entrance Exams
            </span>
          </div>

          {/* Hero Headline with 1-2 gradient words */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#EAF0FF] tracking-[-0.03em] leading-[1.08] font-['Oblata_Display',sans-serif]">
            Master University Entrance Tests with{' '}
            <span className="bg-gradient-to-r from-[#2F6BFF] via-[#22D3EE] to-[#7C5CFF] bg-clip-text text-transparent">
              Zero Distraction
            </span>
          </h1>

          {/* Subline */}
          <p className="mt-5 text-base sm:text-lg text-[#A3B0CC] leading-relaxed max-w-xl">
            17,000+ verified MCQs, timed test engines, KaTeX step-by-step formula derivations, and 24/7 AI tutoring for FAST-NUCES, NUST NET, GIKI, MDCAT, and ECAT.
          </p>

          {/* Dual CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleRoute('/signup')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto text-base"
            >
              Start Free Practice
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleRoute('/pricing')}
              className="w-full sm:w-auto text-base"
            >
              Explore Pro (PKR 199)
            </Button>
          </div>

          {/* Trust Chips */}
          <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-left">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#EAF0FF] tabular-nums">17,000+</span>
              <span className="text-xs text-[#A3B0CC]">Verified MCQs</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#22D3EE]">KaTeX Math</span>
              <span className="text-xs text-[#A3B0CC]">Step Derivations</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#34D399]">Live Timers</span>
              <span className="text-xs text-[#A3B0CC]">Negative Marking</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#7C5CFF]">FAST · NUST</span>
              <span className="text-xs text-[#A3B0CC]">MDCAT & GIKI</span>
            </div>
          </div>
        </div>

        {/* Right Hero PhoneMockup (Neutral hardware, 3D tilt, 4 screens) */}
        <div className="flex-1 flex justify-center items-center w-full max-w-md lg:max-w-none">
          <PhoneMockup />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. BENTO-GRID FEATURES SECTION                                */}
      {/* ============================================================== */}
      <section className="w-full max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-left">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="brand" className="mb-3">
            Cockpit Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#EAF0FF] tracking-tight font-['Oblata_Display',sans-serif]">
            Everything You Need to Secure Your University Seat
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#A3B0CC]">
            Say goodbye to disorganized WhatsApp groups and blurry past paper photocopies. Boardly brings structured exam engineering to your screen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* Card 1: Span 8 - Test Cockpit & Timer */}
          <Card
            variant="default"
            className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#2F6BFF]/15 border border-[#2F6BFF]/30 text-[#22D3EE] flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(47,107,255,0.3)]">
                <Timer className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#EAF0FF]">
                Distraction-Free Exam Engine & Countdown Timer
              </h3>
              <p className="text-sm text-[#A3B0CC] mt-2 leading-relaxed max-w-xl">
                Experience the exact stress conditions of exam day. Sticky glass timers turn red under 5 minutes, auto-saving your answers and enforcing exam-specific negative marking rules.
              </p>
            </div>
            {/* Visual simulation strip */}
            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#34D399] animate-pulse" />
                <span className="font-semibold text-[#EAF0FF]">FAST CS Paper in progress</span>
              </div>
              <span className="font-mono font-bold text-[#F87171] bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20 tabular-nums">
                04:32 Left
              </span>
            </div>
          </Card>

          {/* Card 2: Span 4 - 17k Question Bank */}
          <Card variant="default" className="md:col-span-4 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE] flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EAF0FF]">17,000+ Question Vault</h3>
              <p className="text-sm text-[#A3B0CC] mt-2 leading-relaxed">
                Indexed by university, board, subject, chapter, and difficulty level. Never practice obsolete questions.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/8 text-[#EAF0FF]">Mathematics</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/8 text-[#EAF0FF]">Physics</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/8 text-[#EAF0FF]">Chemistry</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/8 text-[#22D3EE]">Analytical IQ</span>
            </div>
          </Card>

          {/* Card 3: Span 4 - KaTeX AI Study Buddy */}
          <Card variant="default" className="md:col-span-4 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF] flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(124,92,255,0.3)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#EAF0FF]">Boardy 24/7 AI Tutor</h3>
              <p className="text-sm text-[#A3B0CC] mt-2 leading-relaxed">
                Step-by-step formula derivations in clean LaTeX math. Ask follow-up questions at 2 AM without waiting for an academy teacher.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/8 text-xs font-mono text-[#22D3EE]">
              {"\\[ \\int_0^{\\pi/2} \\sin^2(x) dx = \\frac{\\pi}{4} \\]"}
            </div>
          </Card>

          {/* Card 4: Span 8 - Live Arena & Blitz */}
          <Card
            variant="default"
            className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#EAF0FF]">
                Boardly Arena & Live Weekend Blitz Mocks
              </h3>
              <p className="text-sm text-[#A3B0CC] mt-2 leading-relaxed max-w-xl">
                Compete synchronously with hundreds of serious students across Lahore, Karachi, Islamabad, and Peshawar. Live nationwide rank updates the second you submit.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Weekly National Entrance Test Sessions
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. LIVE-STYLE ARENA LEADERBOARD STRIP (SAMPLE PREVIEW)         */}
      {/* ============================================================== */}
      <section className="w-full max-w-6xl px-4 sm:px-6 py-8">
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#0E1626]/80 backdrop-blur-2xl border border-white/12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Arena Leaderboard
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/8 text-[#A3B0CC] border border-white/10">
                Sample preview
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#EAF0FF]">
              See How You Rank Against Real Aspirants
            </h3>
            <p className="text-xs sm:text-sm text-[#A3B0CC] mt-2 leading-relaxed">
              Every Sunday mock publishes verified percentile scores. Names are displayed anonymously with privacy safeguards (&quot;First L.&quot;).
            </p>
          </div>

          {/* Mini Leaderboard Podium */}
          <div className="w-full md:w-auto flex-1 max-w-lg flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/6 border border-white/10 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-amber-400 w-5">#1</span>
                <span className="font-bold text-[#EAF0FF]">Hamza K.</span>
                <span className="text-xs text-[#6F7C99]">FAST CS Mock</span>
              </div>
              <span className="font-bold text-[#34D399] tabular-nums">96.7% · 58/60</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/8 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-300 w-5">#2</span>
                <span className="font-bold text-[#EAF0FF]">Ayesha M.</span>
                <span className="text-xs text-[#6F7C99]">MDCAT Sprint</span>
              </div>
              <span className="font-bold text-[#22D3EE] tabular-nums">93.3% · 56/60</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/8 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-600 w-5">#3</span>
                <span className="font-bold text-[#EAF0FF]">Bilal S.</span>
                <span className="text-xs text-[#6F7C99]">NET Engineering</span>
              </div>
              <span className="font-bold text-[#EAF0FF] tabular-nums">90.0% · 54/60</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. 3-STEP HOW IT WORKS                                         */}
      {/* ============================================================== */}
      <section className="w-full max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
        <Badge variant="brand" className="mb-3">
          Methodology
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#EAF0FF] tracking-tight font-['Oblata_Display',sans-serif]">
          How Boardly Prepares You to Rank in Top 1%
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#A3B0CC] max-w-xl mx-auto">
          A scientific 3-step preparation system based on active recall, spaced testing, and real error diagnosis.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <Card variant="default" className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-3xl font-extrabold text-[#2F6BFF] font-['Oblata_Display',sans-serif]">
                01
              </span>
              <h4 className="text-lg font-bold text-[#EAF0FF] mt-3">
                Set Target Exam & Take Diagnostic Baseline
              </h4>
              <p className="text-xs sm:text-sm text-[#A3B0CC] mt-2 leading-relaxed">
                Pick FAST, NUST NET, GIKI, or MDCAT. Complete a rapid 20-question diagnostic to identify your strong and weak chapters automatically.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-[#22D3EE] font-semibold">
              <span>Automatic Weakness Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          <Card variant="default" className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-3xl font-extrabold text-[#22D3EE] font-['Oblata_Display',sans-serif]">
                02
              </span>
              <h4 className="text-lg font-bold text-[#EAF0FF] mt-3">
                Drill Topic Sprints with KaTeX Derivations
              </h4>
              <p className="text-xs sm:text-sm text-[#A3B0CC] mt-2 leading-relaxed">
                Practice chapter-wise MCQs. Whenever you make an error, inspect step-by-step mathematical proofs or ask Boardy AI for alternative approaches.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-[#22D3EE] font-semibold">
              <span>Step-by-step Formulas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>

          <Card variant="default" className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-3xl font-extrabold text-[#7C5CFF] font-['Oblata_Display',sans-serif]">
                03
              </span>
              <h4 className="text-lg font-bold text-[#EAF0FF] mt-3">
                Compete in Arena & Watch Merit Meter Climb
              </h4>
              <p className="text-xs sm:text-sm text-[#A3B0CC] mt-2 leading-relaxed">
                Sit full-length timed mocks. The Merit Meter calculates your aggregate across FAST, NUST, and GIKI formulas so you know exactly where you stand.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-[#7C5CFF] font-semibold">
              <span>Real Aggregate Calculation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Card>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. PRICING SECTION (FREE VS PRO PKR 199/MO)                    */}
      {/* ============================================================== */}
      <section className="w-full max-w-6xl px-4 sm:px-6 py-16 sm:py-24 text-center">
        <Badge variant="brand" className="mb-3">
          Accessible & Transparent
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#EAF0FF] tracking-tight font-['Oblata_Display',sans-serif]">
          High-Yield Test Prep for Less Than a Cup of Chai
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#A3B0CC] max-w-xl mx-auto">
          Physical academies charge PKR 40,000 to PKR 80,000 for outdated notes. Boardly Pro is PKR 199/month with instant digital access.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* Card: Free Starter */}
          <Card variant="default" className="p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A3B0CC]">
                Free Starter
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#EAF0FF] tabular-nums font-['Oblata_Display',sans-serif]">
                  PKR 0
                </span>
                <span className="text-xs text-[#A3B0CC]">/ forever</span>
              </div>
              <p className="text-xs sm:text-sm text-[#A3B0CC] mt-3 leading-relaxed">
                Ideal for quick diagnostic testing and daily revision before your exam.
              </p>

              <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#EAF0FF]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>3 practice sprints per day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>10 Boardy AI questions per day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Full KaTeX answer derivations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Diagnostic weakness tracking</span>
                </li>
              </ul>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => handleRoute('/signup')}
              className="mt-8 w-full"
            >
              Start Free
            </Button>
          </Card>

          {/* Card: Pro Plan (Highlighted with animated gradient border) */}
          <div className="animated-border-card">
            <div className="inner-content p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#22D3EE]">
                    Boardly Pro
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2F6BFF]/20 text-[#22D3EE] text-[11px] font-bold border border-[#22D3EE]/30">
                    Most Popular
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-[#EAF0FF] tabular-nums font-['Oblata_Display',sans-serif]">
                    PKR 199
                  </span>
                  <span className="text-xs text-[#A3B0CC]">/ month</span>
                </div>
                <p className="text-xs sm:text-sm text-[#A3B0CC] mt-3 leading-relaxed">
                  Everything you need for intensive full-season entrance test mastery.
                </p>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#EAF0FF]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span className="font-semibold">Unlimited daily practice sprints</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span className="font-semibold">100 Boardy AI queries per day</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span>Full-length past paper test vault</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span>Sunday Live Arena mock registrations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span>Pakistani payments: JazzCash & EasyPaisa</span>
                  </li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleRoute('/pricing')}
                className="mt-8 w-full"
              >
                Get Pro Pass (PKR 199)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. REVIEWS SECTION (STRICTLY PRESERVED AS REQUIRED BY HARD RULE 1) */}
      {/* ============================================================== */}
      <section className="w-full max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <ReviewsWall />
      </section>

      {/* ============================================================== */}
      {/* 7. FAQ ACCORDION SECTION                                       */}
      {/* ============================================================== */}
      <section className="w-full max-w-4xl px-4 sm:px-6 py-16 sm:py-24 text-left">
        <div className="text-center mb-12">
          <Badge variant="brand" className="mb-3">
            FAQ
          </Badge>
          <h2 className="text-3xl font-extrabold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur-md overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-[#EAF0FF]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A3B0CC] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#22D3EE]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#A3B0CC] leading-relaxed border-t border-white/6 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. FINAL CTA BANNER                                           */}
      {/* ============================================================== */}
      <section className="w-full max-w-6xl px-4 sm:px-6 py-12">
        <div className="p-8 sm:p-14 rounded-[32px] bg-gradient-to-br from-[#2F6BFF]/25 via-[#0E1626] to-[#7C5CFF]/20 border border-white/14 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-center flex flex-col items-center">
          <Badge variant="brand" className="mb-4">
            Start Your Journey Today
          </Badge>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#EAF0FF] font-['Oblata_Display',sans-serif] max-w-2xl">
            Join Thousands of Aspirants Preparing for FAST, NUST & MDCAT
          </h3>
          <p className="mt-3 text-sm sm:text-base text-[#A3B0CC] max-w-lg">
            Create your free account in 30 seconds and take your first diagnostic sprint today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleRoute('/signup')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Free Account
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleRoute('/features')}
            >
              Explore All Features
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

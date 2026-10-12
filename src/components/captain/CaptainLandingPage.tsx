import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  Users,
  Award,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Send,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Briefcase,
  FileText,
  Star,
  Menu,
  X,
  Building,
  GraduationCap,
  Phone,
  Mail,
  User,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Compass,
  Trophy,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SeoHead } from '../common/SeoHead';
import { UnifiedProgramApplicationModal } from '../common/UnifiedProgramApplicationModal';
import { SharedBubbleMenu } from '../common/SharedBubbleMenu';

interface CaptainLandingPageProps {
  currentPath?: string;
  onNavigate: (route: string) => void;
}

export const CaptainLandingPage: React.FC<CaptainLandingPageProps> = ({
  currentPath = '/captain',
  onNavigate,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const howItWorksRef = useRef<HTMLDivElement | null>(null);
  const perksRef = useRef<HTMLDivElement | null>(null);
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);

  const isCaptainApproved =
    isAdmin ||
    profile?.role === 'captain' ||
    profile?.roles?.includes('captain') ||
    profile?.isCrewMember;

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (totalScroll / windowHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTarget = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopySampleCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyCodeSuccess(true);
    setTimeout(() => setCopyCodeSuccess(false), 2000);
  };

  const faqs = [
    {
      q: 'What is Boardly Captain?',
      a: 'Boardly Captain is our premier student ambassador & campus leadership program. Captains represent Boardly at colleges and academies, share exclusive practice discounts, build study batches, and compete on the national leaderboard.',
    },
    {
      q: 'Do Captains get referral links?',
      a: 'Yes! Every approved Boardly Captain receives a unique referral code and tracking link (e.g., boardly.cfd/r/CODE). Every classmate who joins gives you points, leaderboard rank, and leadership rewards.',
    },
    {
      q: 'Can guest students apply without signing in?',
      a: 'Absolutely. You can submit your application right now without creating an account. If you sign in later with the same email, your application and role link automatically.',
    },
    {
      q: 'How does the national leaderboard work?',
      a: 'The national leaderboard updates in real-time as peers register through your link. Top Captains unlock official certificates of ambassadorship, free Boardly Pro upgrades, and recommendation letters.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07061d] text-white selection:bg-amber-500 selection:text-white font-sans relative overflow-x-hidden">
      <SeoHead
        pathname="/captain"
        override={{
          title: "Boardly Captain — Campus Ambassador & Student Leadership Program",
          description: "Represent Boardly at your college or academy. Share referral links, lead campus study cohorts, and unlock exclusive rewards on the national leaderboard.",
        }}
      />

      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-amber-500 via-violet-500 to-teal-400 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Floating Glass Navbar */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-2.5 sm:px-6 max-w-7xl mx-auto">
        <nav
          className="bg-[#0b0a2a]/90 backdrop-blur-xl border border-amber-500/25 shadow-2xl shadow-violet-950/40 rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between transition-all"
          aria-label="Boardly Captain Navigation"
        >
          {/* Exactly ONE logo (icon + "Board" white + "ly" indigo, no gap) + CAPTAIN tag pill */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-0.5"
              aria-label="Return to Boardly Home"
            >
              <img
                src="/assets/boardly-logo-transparent.png"
                alt="Boardly"
                className="h-6 w-6 sm:h-7 sm:w-7 object-contain shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/assets/boardly-logo-solid.png';
                }}
              />
              <span className="font-bold text-base sm:text-lg tracking-normal font-display select-none">
                <span className="text-white">Board</span>
                <span className="text-indigo-400">ly</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.08em] bg-amber-600/70 backdrop-blur-md text-white shadow-sm border border-amber-400/30 shrink-0">
                CAPTAIN
              </span>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-300">
            <button
              onClick={() => scrollToTarget(howItWorksRef)}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToTarget(perksRef)}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Perks & Rewards
            </button>
            <button
              onClick={() => scrollToTarget(dashboardRef)}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Portal Preview
            </button>
            <button
              onClick={() => scrollToTarget(faqRef)}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="px-3.5 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Main Site
            </button>

            {isCaptainApproved ? (
              <button
                onClick={() => onNavigate('/captain/dashboard')}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase font-mono tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                Captain Portal
              </button>
            ) : (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase font-mono tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                Apply as Captain
              </button>
            )}
          </div>

          {/* Mobile Menu Button with animated 3-bar morph */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-sm transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {/* CSS morphing hamburger bars to X over ~300ms */}
              <div className="w-4 h-3.5 relative flex flex-col justify-between pointer-events-none">
                <span
                  style={{
                    transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: mobileMenuOpen ? 'translateY(6px) rotate(45deg)' : 'none',
                  }}
                  className="block h-0.5 w-full bg-white rounded-full origin-center"
                />
                <span
                  style={{
                    transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    opacity: mobileMenuOpen ? 0 : 1,
                  }}
                  className="block h-0.5 w-full bg-white rounded-full"
                />
                <span
                  style={{
                    transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    transform: mobileMenuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
                  }}
                  className="block h-0.5 w-full bg-white rounded-full origin-center"
                />
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* Animated Bubble Hamburger Card Menu */}
      <SharedBubbleMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onGetStarted={() => setIsApplyModalOpen(true)}
      />

      {/* Main Hero Section */}
      <main className="pt-28 sm:pt-36 space-y-24">
        <section ref={heroRef} className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Campus Ambassadorship & Referral Leadership</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display text-white tracking-tight leading-[1.1]">
            Lead Your Batch as a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-teal-300">
              Boardly Captain
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Represent Boardly at your college or academy. Share verified referral links, guide your classmates toward
            authentic entrance test drills, and earn leadership certificates & Pro membership.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-teal-400 hover:opacity-95 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Apply for Boardly Captain</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {isCaptainApproved && (
              <button
                onClick={() => onNavigate('/captain/dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 cursor-pointer transition-all"
              >
                Go to Captain Dashboard
              </button>
            )}
          </div>
        </section>

        {/* SECTION: Phone Mockup of Captain Referral Portal */}
        <section ref={dashboardRef} className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
              Interactive Preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Your Captain Command Center
            </h2>
            <p className="text-slate-300 text-sm">
              Every approved Campus Captain gets a dedicated portal with live referral counts, personal link sharing, and national standing.
            </p>
          </div>

          {/* Phone Frame Device Container */}
          <div className="w-full max-w-[340px] sm:max-w-md mx-auto">
            <div className="relative rounded-[36px] sm:rounded-[40px] p-2.5 sm:p-4 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl shadow-amber-950/40 border-4 border-slate-700/80">
              {/* Speaker & Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-3.5 sm:h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                <div className="w-8 sm:w-10 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Phone Screen Glass Interior */}
              <div className="bg-[#0b0a26] rounded-[28px] sm:rounded-[32px] pt-8 pb-6 px-4 sm:px-6 border border-amber-400/40 overflow-hidden relative shadow-inner">
                {/* Sample Tag watermark */}
                <div className="text-center mb-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase bg-amber-950/90 px-3.5 py-1 rounded-full border border-amber-400/50 shadow-sm inline-block">
                    Sample Captain Portal
                  </span>
                </div>

                {/* Captain Profile Header */}
                <div className="flex items-center justify-between pb-4 border-b border-amber-400/25">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md ring-2 ring-amber-300/40">
                      AK
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-tight font-display">Ali Khan</div>
                      <div className="text-xs text-slate-300 font-medium">FAST-NU Islamabad</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-400/50 shadow-xs">
                    Active Captain
                  </span>
                </div>

                {/* Main Stat Card */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-indigo-950/50 to-violet-950/60 border border-amber-400/40 shadow-md">
                  <div className="text-xs text-amber-200 font-semibold tracking-wide uppercase">Batch Referrals</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-1 flex items-baseline gap-2">
                    42 <span className="text-xs font-sans text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">+6 this week</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-200 pt-2 border-t border-amber-500/30 font-medium">
                    <span>National Rank: <strong className="text-amber-300 font-bold text-sm">#4</strong></span>
                    <span>Status: <strong className="text-emerald-300 font-bold">Level 2 Leader</strong></span>
                  </div>
                </div>

                {/* Share Link Box */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-white/15">
                  <div className="text-xs text-slate-200 mb-1.5 font-bold">Your Unique Referral Link</div>
                  <div className="flex items-center justify-between gap-2 bg-[#050518] p-2.5 rounded-xl border border-amber-400/30 text-xs font-mono text-slate-100 font-semibold">
                    <span className="truncate text-amber-200 font-bold">boardly.cfd/r/FAST-AK42</span>
                    <button
                      onClick={() => handleCopySampleCode('https://boardly.cfd/r/FAST-AK42')}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-sans text-xs font-black transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      {copyCodeSuccess ? <Check className="w-3.5 h-3.5 text-emerald-950 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copyCodeSuccess ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Mini Leaderboard Snapshot */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2">
                    <span className="text-white font-extrabold">Campus Leaderboard</span>
                    <span className="text-xs font-mono text-amber-300 font-bold">May Cohort</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-slate-100 font-medium border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-mono font-black text-sm">1</span>
                        <span className="font-semibold">Sarah M. (NUST)</span>
                      </div>
                      <span className="font-mono font-bold text-amber-300">86 joins</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/25 border-2 border-amber-400/60 text-white font-bold shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-300 font-mono font-black text-sm">4</span>
                        <span className="text-amber-100">Ali Khan (You)</span>
                      </div>
                      <span className="font-mono font-black text-amber-300 text-sm">42 joins</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-slate-100 font-medium border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-mono font-black text-sm">5</span>
                        <span className="font-semibold">Daniyal Z. (GIKI)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-200">39 joins</span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA in Mockup */}
                <div className="mt-5 pt-3 border-t border-amber-400/30 text-center">
                  <button
                    onClick={() => setIsApplyModalOpen(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 cursor-pointer min-h-[44px] transition-all"
                  >
                    Unlock Your Captain Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: How It Works */}
        <section ref={howItWorksRef} className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-500/30">
              The Path to Ambassadorship
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              How the Captain Program Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-violet-500/25 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 font-black font-mono flex items-center justify-center">
                01
              </div>
              <h3 className="text-base font-bold text-white">Apply in 60 Seconds</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Guest applications welcome. Provide your campus and a brief note on how you'll connect classmates with Boardly.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-violet-500/25 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 font-black font-mono flex items-center justify-center">
                02
              </div>
              <h3 className="text-base font-bold text-white">Share Your Link</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Receive your custom referral link. Every classmate who signs up is recorded under your leadership profile.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-violet-500/25 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-400 font-black font-mono flex items-center justify-center">
                03
              </div>
              <h3 className="text-base font-bold text-white">Unlock National Honors</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Top Captains unlock certificates of excellence, Pro subscriptions, and recommendation letters from academic leadership.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: Perks */}
        <section ref={perksRef} className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
              Rewards
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Why Students Become Captains
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <Award className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm text-white">Digital Certificate of Leadership</h4>
                <p className="text-xs text-slate-400 mt-1">Official credential verified by SHS Virtual Academy.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-teal-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm text-white">Free Boardly Pro Membership</h4>
                <p className="text-xs text-slate-400 mt-1">Unlimited mock drills, AI derivations, and offline PDF downloads.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <Trophy className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm text-white">National Ambassador Leaderboard</h4>
                <p className="text-xs text-slate-400 mt-1">Compete against colleges across Lahore, Karachi, and Islamabad.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <FileText className="w-6 h-6 text-sky-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-sm text-white">Recommendation Letters</h4>
                <p className="text-xs text-slate-400 mt-1">Boost your university admission and scholarship applications.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: FAQ */}
        <section ref={faqRef} className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about Boardly Captain</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaqIndex === idx;
              return (
                <div key={idx} className="rounded-2xl bg-slate-900/80 border border-violet-500/20 overflow-hidden">
                  <button
                    onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-amber-400' : 'text-slate-400'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Personalized Boardly Captain Footer */}
      <footer className="relative z-10 border-t border-amber-500/25 bg-[#040412] mt-20 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          {/* Brand info (single display: [B logo icon] + white "Boardly" + amber CAPTAIN pill) */}
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
              <img
                src="/assets/boardly-logo-transparent.png"
                alt="Boardly"
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/assets/boardly-logo-solid.png';
                }}
              />
              <span className="font-bold text-white text-base tracking-normal font-display">
                Boardly
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.08em] bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm border border-amber-300/40">
                CAPTAIN
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Official Campus Ambassador &amp; Student Referral Initiative by{' '}
              <a
                href="https://shsvirtualacademy.pro"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline font-medium"
              >
                SHS Virtual Academy
              </a>
              . Empowering batch leaders across 20+ universities in Pakistan.
            </p>
          </div>

          {/* Legal and Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-300">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-amber-300 transition-colors cursor-pointer min-h-[44px] flex items-center">
              Privacy Policy
            </button>
            <button onClick={() => onNavigate('/terms')} className="hover:text-amber-300 transition-colors cursor-pointer min-h-[44px] flex items-center">
              Terms of Service
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-amber-300 transition-colors cursor-pointer min-h-[44px] flex items-center">
              Contact Support
            </button>
            <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center">
              Main Boardly Portal
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 text-center text-xs text-slate-400 font-mono tracking-[0.08em]">
          &copy; 2026 Boardly Captain by SHS Virtual Academy. All rights reserved.
        </div>
      </footer>

      {/* Unified Application Modal */}
      <UnifiedProgramApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        defaultProgram="captain"
        onSuccess={() => {
          setIsApplyModalOpen(false);
          alert('Application received! Once reviewed, your Captain dashboard will be unlocked.');
        }}
      />
    </div>
  );
};

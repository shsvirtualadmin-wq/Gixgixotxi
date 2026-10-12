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
import {
  submitCrewApplication,
  fetchUserCrewApplication,
  CrewApplication,
} from '../../lib/firebase';
import { SeoHead } from '../common/SeoHead';
import { CREW_OG_IMAGE } from '../../config/seo';
import { UnifiedProgramApplicationModal } from '../common/UnifiedProgramApplicationModal';

interface CrewLandingPageProps {
  currentPath?: string;
  onNavigate: (route: string) => void;
}

export const CrewLandingPage: React.FC<CrewLandingPageProps> = ({
  currentPath = '/crew',
  onNavigate,
}) => {
  const { user, profile, isAdmin, signInGoogle } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isCrewApproved =
    isAdmin ||
    profile?.role === 'crew' ||
    profile?.roles?.includes('crew') ||
    profile?.role === 'organizer' ||
    profile?.roles?.includes('organizer');

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Scroll Progress Tracking
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Application Form States
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [academicLevel, setAcademicLevel] = useState('FSC Pre-Medical / Pre-Engineering');
  const [city, setCity] = useState('');
  const [promotionPlan, setPromotionPlan] = useState('');
  const [networkReach, setNetworkReach] = useState('50 - 150 students');

  const [existingApp, setExistingApp] = useState<CrewApplication | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);

  // FAQ Accordion State
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Ticker Pause State
  const [isTickerPaused, setIsTickerPaused] = useState(false);

  // Refs for scrolling to sections
  const heroRef = useRef<HTMLDivElement | null>(null);
  const howItWorksRef = useRef<HTMLDivElement | null>(null);
  const perksRef = useRef<HTMLDivElement | null>(null);
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);
  const applyRef = useRef<HTMLDivElement | null>(null);

  // Ensure postLoginPath is set so login redirect returns here
  useEffect(() => {
    try {
      sessionStorage.setItem('postLoginPath', '/crew/apply');
    } catch {}
  }, []);

  // Fetch existing Crew application if user is logged in
  useEffect(() => {
    if (user?.uid) {
      setLoadingExisting(true);
      fetchUserCrewApplication(user.uid)
        .then((app) => setExistingApp(app))
        .catch(console.warn)
        .finally(() => setLoadingExisting(false));
    }
  }, [user?.uid]);

  // Pre-fill user data into application form
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(profile?.name || user.displayName || '');
      setEmail(profile?.email || user.email || '');
      if (!phone && profile?.phone) setPhone(profile.phone);
      if (!institution && profile?.targetUniversity) setInstitution(profile.targetUniversity);
    }
  }, [user, profile]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dedicated scroll progress for Section D timeline line draw
  const [timelineProgress, setTimelineProgress] = useState(25);

  useEffect(() => {
    const handleTimelineScroll = () => {
      if (!howItWorksRef.current) return;
      const rect = howItWorksRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const start = windowHeight * 0.85;
      const end = -rect.height * 0.15;
      const current = start - rect.top;
      const total = start - end;
      if (total > 0) {
        const progress = Math.min(100, Math.max(12, (current / total) * 100));
        setTimelineProgress(progress);
      }
    };

    window.addEventListener('scroll', handleTimelineScroll, { passive: true });
    handleTimelineScroll();
    return () => window.removeEventListener('scroll', handleTimelineScroll);
  }, []);

  // Handle route and hash-based scrolling on mount and URL changes
  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/crew';
    const hash = window.location.hash.toLowerCase().replace('#', '');

    const scrollToTarget = (ref: React.RefObject<HTMLDivElement | null>) => {
      setTimeout(() => {
        if (ref.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    };

    if (hash === 'apply' || pathname === '/crew/apply') {
      scrollToTarget(applyRef);
    } else if (hash === 'how-it-works' || pathname === '/crew/how-it-works') {
      scrollToTarget(howItWorksRef);
    } else if (hash === 'perks' || pathname === '/crew/perks') {
      scrollToTarget(perksRef);
    } else if (hash === 'faq' || pathname === '/crew/faq') {
      scrollToTarget(faqRef);
    } else if (hash === 'dashboard' || hash === 'preview') {
      scrollToTarget(dashboardRef);
    }
  }, [currentPath]);

  // Typewriter effect in Hero section
  const typewriterWords = useMemo(
    () => ['Lead your batch.', 'Empower your peers.', 'Build real authority.', 'Unlock your future.'],
    []
  );
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [currentWordText, setCurrentWordText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setCurrentWordText(typewriterWords[0]);
      return;
    }

    const currentWord = typewriterWords[typewriterIndex % typewriterWords.length];
    const typingSpeed = isDeleting ? 45 : 90;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setCurrentWordText(currentWord.slice(0, currentWordText.length + 1));
        if (currentWordText.length + 1 === currentWord.length) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setCurrentWordText(currentWord.slice(0, currentWordText.length - 1));
        if (currentWordText.length <= 1) {
          setIsDeleting(false);
          setTypewriterIndex((prev) => (prev + 1) % typewriterWords.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentWordText, isDeleting, typewriterIndex, typewriterWords, shouldReduceMotion]);

  // Section navigation helper
  const navigateToSection = (section: 'hero' | 'how-it-works' | 'perks' | 'dashboard' | 'faq' | 'apply') => {
    setMobileMenuOpen(false);

    let targetPath = '/crew';
    let targetRef = heroRef;

    if (section === 'how-it-works') {
      targetPath = '/crew/how-it-works';
      targetRef = howItWorksRef;
    } else if (section === 'perks') {
      targetPath = '/crew/perks';
      targetRef = perksRef;
    } else if (section === 'dashboard') {
      targetPath = '/crew#dashboard';
      targetRef = dashboardRef;
    } else if (section === 'faq') {
      targetPath = '/crew/faq';
      targetRef = faqRef;
    } else if (section === 'apply') {
      targetPath = '/crew/apply';
      targetRef = applyRef;
    }

    try {
      window.history.pushState({}, '', targetPath);
    } catch {}

    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Google Sign-in Handler for application form
  const handleGoogleSignInForCrew = async () => {
    setGoogleAuthLoading(true);
    setFormError(null);
    try {
      sessionStorage.setItem('postLoginPath', '/crew/apply');
      const res = await signInGoogle();
      if (!res.success && res.error) {
        setFormError(res.error);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Google sign-in was interrupted. Please try again.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  // Application Form Submit Handler
  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user?.uid) {
      sessionStorage.setItem('postLoginPath', '/crew/apply');
      onNavigate('/login');
      return;
    }

    if (!fullName.trim()) {
      setStep(1);
      setFormError('Please provide your full legal name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setStep(1);
      setFormError('Please enter a valid WhatsApp or contact number (at least 8 digits).');
      return;
    }
    if (!institution.trim()) {
      setStep(2);
      setFormError('Institution or College Name is required so we know your campus.');
      return;
    }
    if (!city.trim()) {
      setStep(2);
      setFormError('Please provide your city/region.');
      return;
    }
    if (!promotionPlan.trim() || promotionPlan.trim().length < 15) {
      setStep(3);
      setFormError('Please share at least 15 characters describing how you will share Boardly with peers.');
      return;
    }

    // Role verification
    if (isAdmin || user.email?.toLowerCase() === 'shsvirtualadmin@gmail.com') {
      setFormError('Administrator accounts cannot submit student ambassador applications.');
      return;
    }

    if (profile?.crewStatus === 'revoked' || existingApp?.status === 'revoked') {
      setFormError('Your previous Crew access was revoked. Contact administration for re-approval.');
      return;
    }

    if (existingApp?.status === 'pending') {
      setFormError('You already have an active application under review.');
      return;
    }

    if (profile?.isCrewMember) {
      setFormError('You are already an active Boardly Crew member!');
      return;
    }

    setSubmitting(true);
    try {
      await submitCrewApplication({
        userId: user.uid,
        fullName: fullName.trim(),
        email: (user.email || email).trim().toLowerCase(),
        phone: phone.trim(),
        institution: `${institution.trim()} (${academicLevel}, ${city.trim()})`,
        promotionPlan: `[Network: ${networkReach}] ${promotionPlan.trim()}`,
      });

      setSubmittedSuccess(true);
      fetchUserCrewApplication(user.uid).then(setExistingApp).catch(console.warn);
    } catch (err: any) {
      console.error('[Crew Landing: Application submit error]', err);
      setFormError(err?.message || 'Failed to submit application. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy referral code mock
  const handleCopySampleCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    } catch {}
  };

  // Determine current page SEO metadata
  const seoTitle = useMemo(() => {
    const cleanPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/crew';
    if (cleanPath === '/crew/apply') return 'Apply to Boardly Crew | Student Event Organizer Program';
    if (cleanPath === '/crew/how-it-works') return 'How Boardly Crew Works | Tournament Organizer Program';
    if (cleanPath === '/crew/perks') return 'Boardly Crew Perks & Organizer Command Center';
    if (cleanPath === '/crew/faq') return 'Boardly Crew FAQ | Organizer Questions Answered';
    return 'Boardly Crew: Host Campus Blitz & Arena Tournaments';
  }, [currentPath]);

  const timelineSteps = [
    {
      number: '01',
      title: 'Apply in 2 Minutes',
      desc: 'Submit your profile with your college, campus, and target test formats. Guest submissions welcome with zero login required.',
      checklist: [
        'Open to all Matric, FSC, ICS & University student organizers',
        'Zero prior tournament hosting experience needed',
        '100% free to apply with zero hidden commitments',
      ],
    },
    {
      number: '02',
      title: 'Get Verified by Boardly',
      desc: 'Our academic leadership team verifies your organizer credentials within 24–48 hours and confirms your access.',
      checklist: [
        'Official welcome email and organizer playbook',
        'Verification of campus and enrollment standing',
        'Direct access to our private Organizer community',
      ],
    },
    {
      number: '03',
      title: 'Unlock Organizer Command Center',
      desc: 'Upon approval, your account unlocks the Crew Dashboard to auto-pick from 17k+ authentic MCQs and set event timers.',
      checklist: [
        'Instant test creation across Physics, Chemistry, Biology, Math & English',
        'Custom timers, difficulty filters, and question swapping',
        'Live participant counter and score analytics',
      ],
    },
    {
      number: '04',
      title: 'Run Tournaments & Publish Results',
      desc: 'Share public event links with your classmates, monitor live scoreboards, and export results as CSV.',
      checklist: [
        'Host Boardly Blitz, Boardly Arena, MDCAT & Engineering sprints',
        'Real-time leaderboards with automated tie-breaking by time',
        'Verified Event Director certificates from SHS Academy',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#06061a] text-slate-100 font-sans selection:bg-[#6d4aff] selection:text-white relative overflow-x-hidden">
      {/* Dynamic SEO Meta Tags for client SPA rendering */}
      <SeoHead
        pathname={window.location.pathname}
        override={{
          title: seoTitle,
          description:
            'Organize live Boardly Blitz, Arena, MDCAT, and university entry-test tournaments for your college or academy. Filter 17,000+ authentic questions, host real-time leaderboards, and export results.',
          canonical: `https://boardly.cfd${window.location.pathname}`,
          ogImage: CREW_OG_IMAGE,
        }}
      />

      {/* Top Thin Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={scrollProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Ambient Dark Glowing Background with Subtle 40px Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.04) 1px, transparent 0),
            radial-gradient(circle at 20% 15%, rgba(109, 74, 255, 0.16) 0%, transparent 55%),
            radial-gradient(circle at 85% 65%, rgba(79, 53, 245, 0.14) 0%, transparent 50%),
            radial-gradient(circle at 50% 90%, rgba(59, 130, 246, 0.12) 0%, transparent 60%)
          `,
          backgroundSize: '40px 40px, 100% 100%, 100% 100%, 100% 100%',
        }}
      />

      {/* Floating Glass Navbar */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-2.5 sm:px-6 max-w-7xl mx-auto">
        <nav
          className="bg-[#0b0a2a]/90 backdrop-blur-xl border border-violet-500/25 shadow-2xl shadow-violet-950/40 rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between transition-all"
          aria-label="Boardly Crew Navigation"
        >
          {/* Brand Logo & Wordmark: [B icon] + white "Boardly" + violet CREW pill (single display with high contrast) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-lg p-0.5"
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
                <span className="text-white">Board</span><span className="text-indigo-400">ly</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.08em] bg-violet-600/70 backdrop-blur-md text-white shadow-sm border border-violet-400/30 shrink-0">
                CREW
              </span>
            </button>
          </div>

          {/* Desktop Nav Links (Hidden on screens under 768px) */}
          <div className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-300">
            <button
              onClick={() => navigateToSection('how-it-works')}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => navigateToSection('perks')}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Perks
            </button>
            <button
              onClick={() => navigateToSection('dashboard')}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigateToSection('faq')}
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </div>

          {/* Desktop Right Actions (>= 768px) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="px-3.5 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Main Site
            </button>
            <button
              onClick={() => navigateToSection('apply')}
              className="px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-[#6d4aff] to-[#4f35f5] text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-violet-400/40 min-h-[44px] flex items-center gap-1.5"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Right Bar (< 768px): Shows Apply Now + Hamburger */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => navigateToSection('apply')}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#6d4aff] to-[#4f35f5] text-white shadow-md shadow-violet-600/30 min-h-[38px] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Apply Now</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Menu (< 768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-20 z-40 bg-[#0b0a2a]/95 backdrop-blur-2xl border border-violet-500/30 shadow-2xl rounded-3xl p-6 md:hidden flex flex-col gap-4 text-center"
          >
            <div className="flex flex-col gap-2 font-semibold text-slate-200">
              <button
                onClick={() => navigateToSection('how-it-works')}
                className="py-3 px-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-left flex items-center justify-between text-base"
              >
                <span>How It Works</span>
                <ArrowRight className="w-4 h-4 text-violet-400" />
              </button>
              <button
                onClick={() => navigateToSection('perks')}
                className="py-3 px-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-left flex items-center justify-between text-base"
              >
                <span>Ambassador Perks</span>
                <ArrowRight className="w-4 h-4 text-violet-400" />
              </button>
              <button
                onClick={() => navigateToSection('dashboard')}
                className="py-3 px-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-left flex items-center justify-between text-base"
              >
                <span>Live Dashboard Preview</span>
                <ArrowRight className="w-4 h-4 text-violet-400" />
              </button>
              <button
                onClick={() => navigateToSection('faq')}
                className="py-3 px-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-left flex items-center justify-between text-base"
              >
                <span>Questions &amp; FAQ</span>
                <ArrowRight className="w-4 h-4 text-violet-400" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('/');
                }}
                className="py-3 px-4 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-left flex items-center justify-between text-base text-slate-300"
              >
                <span>Main Boardly Site</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-3 border-t border-violet-500/20 flex flex-col gap-2.5">
              <button
                onClick={() => navigateToSection('apply')}
                className="w-full py-3.5 rounded-full font-bold text-base bg-gradient-to-r from-[#6d4aff] to-[#4f35f5] text-white shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Apply to Join Crew</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Sections */}
      <main className="relative z-10 pt-28 sm:pt-36 flex flex-col gap-24 sm:gap-32">
        {/* SECTION A: Hero */}
        <section
          ref={heroRef}
          id="hero"
          className="max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center"
        >
          {/* Top Tag Pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/40 text-violet-300 text-xs sm:text-sm font-semibold shadow-lg shadow-violet-950/50 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>By students. For their campuses. Backed by Boardly.</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.15] font-display max-w-4xl"
          >
            Be the face of Boardly at your campus.{' '}
            <span className="block mt-2 sm:mt-3 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-400">
              {currentWordText}
              <span className="inline-block text-sky-400 animate-pulse ml-0.5" aria-hidden="true">
                |
              </span>
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed"
          >
            Run live academic tournaments for your college or academy. Create custom Boardly Blitz, Arena, MDCAT, and entry-test drills from Pakistan&apos;s authentic 17,000+ question bank with real-time leaderboards and CSV exports.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-base bg-gradient-to-r from-[#6d4aff] to-[#4f35f5] text-white shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-violet-400/40 flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>Apply for Boardly Crew</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            {isCrewApproved && (
              <button
                onClick={() => onNavigate('/crew/dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-base bg-white/10 hover:bg-white/15 active:bg-white/20 text-slate-100 border border-violet-400/30 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
              >
                <span>Go to Crew Dashboard</span>
              </button>
            )}
            <button
              onClick={() => navigateToSection('how-it-works')}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-base bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-200 border border-violet-400/25 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>See How It Works</span>
            </button>
          </motion.div>

          {/* Trust stats below hero */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 pt-8 border-t border-violet-500/15 w-full grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
          >
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-bold text-white font-mono">30 Days</div>
              <div className="text-sm text-slate-400 mt-1">Free Pro Access Granted</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-bold text-violet-400 font-mono">1 Year</div>
              <div className="text-sm text-slate-400 mt-1">Official Ambassador Tenure</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-bold text-sky-400 font-mono">100%</div>
              <div className="text-sm text-slate-400 mt-1">Free To Apply &amp; Join</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">Paid</div>
              <div className="text-sm text-slate-400 mt-1">Internship Opportunities</div>
            </div>
          </motion.div>
        </section>

        {/* SECTION B: Scrolling Ticker Band (Pauses on touch/hover) */}
        <section
          className="relative py-4 -rotate-1 sm:-rotate-1.5 overflow-hidden bg-gradient-to-r from-violet-900/40 via-indigo-900/60 to-violet-950/40 border-y border-violet-500/30 shadow-2xl backdrop-blur-md"
          onMouseEnter={() => setIsTickerPaused(true)}
          onMouseLeave={() => setIsTickerPaused(false)}
          onTouchStart={() => setIsTickerPaused(true)}
          onTouchEnd={() => setIsTickerPaused(false)}
        >
          <div className="flex w-max items-center gap-8 py-2">
            <motion.div
              animate={isTickerPaused ? false : { x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 32 }}
              className="flex items-center gap-8 whitespace-nowrap"
            >
              {[
                'Ali K. (FAST Islamabad) — 42 batchmates onboarded',
                'Ayesha M. (King Edward Medical University) — 65 MDCAT drills shared',
                'Hamza S. (NUST SEECS) — Paid Internship Unlocked',
                'Zainab T. (UHS Lahore) — Top Ambassador of the Month',
                'Bilal R. (GIKI Swabi) — 38 engineering mock sessions initiated',
                'Fatima N. (Dow University Karachi) — 50 students mentored',
                'Saad A. (PIEAS Islamabad) — Tier-3 Leadership Badge Earned',
                'Maryam H. (LUMS Lahore) — 72 test preppers guided',
                // Duplicate for infinite seamless marquee loop
                'Ali K. (FAST Islamabad) — 42 batchmates onboarded',
                'Ayesha M. (King Edward Medical University) — 65 MDCAT drills shared',
                'Hamza S. (NUST SEECS) — Paid Internship Unlocked',
                'Zainab T. (UHS Lahore) — Top Ambassador of the Month',
                'Bilal R. (GIKI Swabi) — 38 engineering mock sessions initiated',
                'Fatima N. (Dow University Karachi) — 50 students mentored',
                'Saad A. (PIEAS Islamabad) — Tier-3 Leadership Badge Earned',
                'Maryam H. (LUMS Lahore) — 72 test preppers guided',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm sm:text-base font-semibold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[11px] font-mono text-violet-300 font-bold uppercase tracking-[0.08em] bg-violet-500/20 px-2.5 py-0.5 rounded border border-violet-400/30">
                    Sample Activity
                  </span>
                  <span>{item}</span>
                  <span className="text-violet-500/50 font-bold">/</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTION C: The Gap */}
        <section id="the-gap" className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
              The Movement
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-4 font-display leading-[1.15]">
              One central team cannot reach every campus. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
                Thousands of passionate students can.
              </span>
            </h2>
            <p className="mt-4 text-slate-300 text-base leading-relaxed">
              Every college across Pakistan has unique study cultures, local syllabi challenges, and brilliant students
              who deserve better testing tools. Boardly Crew bridges that gap by empowering local campus champions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 1: Traditional Way */}
            <div className="bg-[#0b0a2a]/60 border border-slate-700/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="text-xs font-mono uppercase tracking-[0.08em] font-bold text-rose-400 bg-rose-950/50 px-3 py-1 rounded-full inline-block border border-rose-500/30 mb-4">
                The Old Centralized Model
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Isolated Academies &amp; Gatekeeping</h3>
              <p className="text-slate-300 text-base leading-relaxed mb-6">
                Commercial coaching centers charge exorbitant fees, keep past paper derivations secret, and leave regional
                college students guessing formulas and cutoffs on their own.
              </p>
              <ul className="space-y-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold mt-0.5">✕</span>
                  <span>Expensive tuition packages with outdated physical booklets</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold mt-0.5">✕</span>
                  <span>No personalized feedback or national peer benchmarks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold mt-0.5">✕</span>
                  <span>Students struggle alone in isolation without campus mentors</span>
                </li>
              </ul>
            </div>

            {/* Card 2: The Crew Way */}
            <div className="bg-gradient-to-br from-violet-950/70 via-[#0d0b38]/80 to-indigo-950/70 border border-violet-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl shadow-violet-950/50">
              <div className="text-xs font-mono uppercase tracking-[0.08em] font-bold text-emerald-300 bg-emerald-950/50 px-3 py-1 rounded-full inline-block border border-emerald-500/30 mb-4">
                The Boardly Crew Way
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Peer-Led Democratic Excellence</h3>
              <p className="text-slate-200 text-base leading-relaxed mb-6">
                A verified Boardly Ambassador leads every college, providing peer study circles with unlimited digital
                MCQs, instant step-by-step derivations, and diagnostic testing.
              </p>
              <ul className="space-y-3 text-sm sm:text-base text-slate-200 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Free Pro access shared across campus batches</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Real-time chapter diagnostics calibrated for FBISE &amp; entrance tests</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Ambassadors earn verifiable CV credentials and leadership distinction</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION D: How It Works (Single column on mobile < 768px, Zigzag on desktop >= 768px) */}
        <section ref={howItWorksRef} id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
              Step-by-Step Path
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-4 font-display leading-[1.15]">
              How Boardly Crew Works
            </h2>
            <p className="mt-3 text-slate-300 text-base leading-[1.65]">
              Four simple milestones from application to national leadership.
            </p>
          </div>

          <div className="relative">
            {/* Desktop Center Vertical Line (>= 768px) with dynamic scroll draw */}
            <div className="absolute left-1/2 top-6 bottom-12 w-0.5 -translate-x-1/2 hidden md:block bg-slate-800/80 overflow-hidden rounded-full">
              <div
                className="w-full bg-gradient-to-b from-violet-500 via-indigo-400 to-sky-400 transition-all duration-200 shadow-[0_0_12px_rgba(139,92,246,0.8)]"
                style={{ height: `${shouldReduceMotion ? 100 : Math.max(12, timelineProgress)}%` }}
              />
            </div>

            {/* Mobile Left Vertical Line (< 768px): exactly centered through circle (circle w-10 = 40px, centered at 20px, left-5 is 20px) */}
            <div className="absolute left-5 top-5 bottom-10 w-0.5 -translate-x-1/2 md:hidden bg-slate-800/80 overflow-hidden rounded-full">
              <div
                className="w-full bg-gradient-to-b from-violet-500 via-indigo-400 to-sky-400 transition-all duration-200 shadow-[0_0_12px_rgba(139,92,246,0.8)]"
                style={{ height: `${shouldReduceMotion ? 100 : Math.max(12, timelineProgress)}%` }}
              />
            </div>

            <div className="space-y-8 md:space-y-16">
              {timelineSteps.map((stepItem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.8, delay: shouldReduceMotion ? 0 : idx * 0.1 }}
                  className="relative"
                >
                  {/* MOBILE VIEW (< 768px): Single column, line on left, circle on line, card to its right at full width */}
                  <div className="flex md:hidden items-start gap-4 sm:gap-6 relative">
                    {/* Numbered circle on the vertical line */}
                    <div className="shrink-0 pt-0.5 z-10">
                      <div className="w-10 h-10 rounded-full bg-violet-950 border-2 border-violet-400 text-white font-mono font-bold text-sm shadow-lg shadow-violet-500/30 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                    </div>

                    {/* Step Card at 100% full width to the right */}
                    <div className="flex-1 min-w-0 bg-[#0b0a2a]/80 border border-violet-500/25 rounded-3xl p-5 sm:p-7 backdrop-blur-xl shadow-xl shadow-violet-950/40 text-left">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl sm:text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
                          {stepItem.number}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-violet-300 uppercase tracking-[0.08em] bg-violet-950/80 px-2.5 py-1 rounded-full border border-violet-500/30">
                          Phase {idx + 1}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">{stepItem.title}</h3>
                      <p className="text-slate-300 text-base leading-[1.65] mb-5">{stepItem.desc}</p>
                      <div className="space-y-2.5 pt-4 border-t border-violet-500/15">
                        {stepItem.checklist.map((chk, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2 text-sm sm:text-base text-slate-300 leading-[1.65]">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{chk}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5">
                        <button
                          onClick={() => navigateToSection('apply')}
                          className="text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
                        >
                          <span>Start this step</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP VIEW (>= 768px): Alternating left/right zigzag */}
                  <div className="hidden md:flex md:items-center md:gap-8">
                    {/* Left Slot: Card if even (idx 0, 2), Empty spacer if odd (idx 1, 3) */}
                    <div className="w-[calc(50%-2.5rem)] shrink-0">
                      {idx % 2 === 0 ? (
                        <div className="bg-[#0b0a2a]/80 border border-violet-500/25 rounded-3xl p-7 lg:p-8 backdrop-blur-xl shadow-xl shadow-violet-950/40 text-left">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl sm:text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
                              {stepItem.number}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-violet-300 uppercase tracking-[0.08em] bg-violet-950/80 px-2.5 py-1 rounded-full border border-violet-500/30">
                              Phase {idx + 1}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">{stepItem.title}</h3>
                          <p className="text-slate-300 text-base leading-[1.65] mb-6">{stepItem.desc}</p>
                          <div className="space-y-2.5 pt-4 border-t border-violet-500/15">
                            {stepItem.checklist.map((chk, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2 text-sm sm:text-base text-slate-300 leading-[1.65]">
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>{chk}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6">
                            <button
                              onClick={() => navigateToSection('apply')}
                              className="text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
                            >
                              <span>Start this step</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Center Circle on the line */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-violet-950 border-2 border-violet-400 text-white font-mono font-bold text-base shadow-lg shadow-violet-500/30 z-10 shrink-0">
                      {idx + 1}
                    </div>

                    {/* Right Slot: Empty spacer if even (idx 0, 2), Card if odd (idx 1, 3) */}
                    <div className="w-[calc(50%-2.5rem)] shrink-0">
                      {idx % 2 === 1 ? (
                        <div className="bg-[#0b0a2a]/80 border border-violet-500/25 rounded-3xl p-7 lg:p-8 backdrop-blur-xl shadow-xl shadow-violet-950/40 text-left">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl sm:text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
                              {stepItem.number}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-violet-300 uppercase tracking-[0.08em] bg-violet-950/80 px-2.5 py-1 rounded-full border border-violet-500/30">
                              Phase {idx + 1}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">{stepItem.title}</h3>
                          <p className="text-slate-300 text-base leading-[1.65] mb-6">{stepItem.desc}</p>
                          <div className="space-y-2.5 pt-4 border-t border-violet-500/15">
                            {stepItem.checklist.map((chk, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2 text-sm sm:text-base text-slate-300 leading-[1.65]">
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>{chk}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-6">
                            <button
                              onClick={() => navigateToSection('apply')}
                              className="text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
                            >
                              <span>Start this step</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION E: Perks */}
        <section ref={perksRef} id="perks" className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
              The Rewards
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-4 font-display leading-[1.15]">
              Unrivaled Ambassador Perks
            </h2>
            <p className="mt-3 text-slate-300 text-base leading-relaxed">
              Tangible value that propels your academic scores and elevates your professional resume.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: '30 Days Free Premium',
                badge: 'Immediate Unlock',
                color: 'from-amber-500/20 to-violet-500/20 text-amber-400 border-amber-500/30',
                desc: 'Full unrestricted access to Boardly Pro upon approval: 25,000+ questions, past paper vaults, and 24/7 Boardy AI tutoring.',
              },
              {
                icon: Trophy,
                title: '1-Year Ambassador Tenure',
                badge: 'Leadership Title',
                color: 'from-violet-500/20 to-indigo-500/20 text-violet-400 border-violet-500/30',
                desc: 'Official designation as Boardly Campus Ambassador representing your college or university across Pakistan.',
              },
              {
                icon: TrendingUp,
                title: 'Live Referral Dashboard',
                badge: 'Real-Time Data',
                color: 'from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30',
                desc: 'Private analytics showing clicks, registrations, active student counts, and your spot on the National Ambassador Leaderboard.',
              },
              {
                icon: Briefcase,
                title: 'Paid Internship Tracks',
                badge: 'Top Performers',
                color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
                desc: 'High-performing ambassadors unlock paid marketing, operations, and academic mentorship internships with SHS Virtual Academy.',
              },
              {
                icon: FileText,
                title: 'Verifiable CV Credentials',
                badge: 'Career Boost',
                color: 'from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 border-fuchsia-500/30',
                desc: 'Signed Letter of Recommendation from Boardly directors and verifiable LinkedIn badge verifying student leadership.',
              },
              {
                icon: Users,
                title: 'Direct Team & Founder Access',
                badge: 'Private Channel',
                color: 'from-indigo-500/20 to-cyan-500/20 text-indigo-400 border-indigo-500/30',
                desc: 'Direct line to Boardly educators and product engineers to suggest exam features and request special batches for your campus.',
              },
            ].map((perk, idx) => {
              const IconComp = perk.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#0b0a2a]/80 border border-violet-500/25 rounded-3xl p-6 sm:p-7 backdrop-blur-xl hover:border-violet-400/50 hover:shadow-2xl hover:shadow-violet-950/60 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${perk.color} border`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.08em] text-slate-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                        {perk.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors mb-2 font-display">
                      {perk.title}
                    </h3>
                    <p className="text-slate-300 text-base leading-[1.65]">{perk.desc}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-violet-500/15">
                    <button
                      onClick={() => navigateToSection('apply')}
                      className="text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Unlock this benefit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION F: Dashboard Preview (Phone Frame Mockup) */}
        <section ref={dashboardRef} id="dashboard" className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
              Interactive Preview
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-4 font-display leading-[1.15]">
              Your Tournament Command Center
            </h2>
            <p className="mt-3 text-slate-300 text-base leading-[1.65]">
              Every approved Crew organizer gets a mobile-optimized dashboard. Create custom events from the authentic 17k MCQ bank, watch live scoreboards, and export results.
            </p>
          </div>

          {/* Phone Frame Device Container */}
          <div className="w-full max-w-[340px] sm:max-w-md mx-auto">
            <div className="relative rounded-[36px] sm:rounded-[40px] p-2.5 sm:p-4 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl shadow-violet-950/80 border-4 border-slate-700/80">
              {/* Speaker & Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-3.5 sm:h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                <div className="w-8 sm:w-10 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Phone Screen Glass Interior */}
              <div className="bg-[#080721] rounded-[28px] sm:rounded-[32px] pt-8 pb-6 px-3.5 sm:px-5 border border-violet-500/30 overflow-hidden relative">
                {/* Sample Tag watermark */}
                <div className="text-center mb-3">
                  <span className="text-[11px] font-mono font-bold tracking-[0.08em] text-teal-300 uppercase bg-teal-950/80 px-3 py-0.5 rounded-full border border-teal-500/40">
                    Sample Organizer Portal
                  </span>
                </div>

                {/* Organizer Profile Header */}
                <div className="flex items-center justify-between pb-4 border-b border-violet-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      HR
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight font-display">Hassan Raza</div>
                      <div className="text-xs text-slate-400">GCU Lahore • Crew Organizer</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    Active Organizer
                  </span>
                </div>

                {/* Sample Live Event Card */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-violet-950/50 border border-violet-500/30 shadow-inner space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      LIVE NOW (Sample)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">48 Registered</span>
                  </div>
                  <div className="text-sm font-bold text-white font-display">
                    Boardly Blitz #18: Physics Mechanics Sprint
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-violet-500/20 font-mono">
                    <span>30 MCQs • 30 Mins</span>
                    <span className="text-teal-300 font-bold">Avg: 78%</span>
                  </div>
                </div>

                {/* Create Event Button inside Mockup */}
                <div className="mt-3">
                  <button
                    onClick={() => navigateToSection('apply')}
                    className="w-full py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>+ Create New Event (Sample)</span>
                  </button>
                </div>

                {/* Mini Leaderboard Snapshot with Fake Names */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Live Leaderboard (Sample)</span>
                    <span className="text-[11px] font-mono text-teal-400">37 Submitted</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-mono font-bold">🥇 1</span>
                        <span>Hamza R.</span>
                      </div>
                      <span className="font-mono font-bold text-teal-300">28/30 (14m 10s)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-mono font-bold">🥈 2</span>
                        <span>Ayesha K.</span>
                      </div>
                      <span className="font-mono font-bold text-teal-300">28/30 (16m 40s)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-mono font-bold">🥉 3</span>
                        <span>Bilal S.</span>
                      </div>
                      <span className="font-mono font-bold text-slate-300">27/30 (15m 12s)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA in Mockup */}
                <div className="mt-5 pt-3 border-t border-violet-500/20 text-center">
                  <button
                    onClick={() => navigateToSection('apply')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 text-white font-bold text-xs shadow-md shadow-violet-700/40 cursor-pointer min-h-[44px]"
                  >
                    Unlock Your Organizer Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION G: Testimonials (Horizontal swipe cards with Verified badges) */}
        <section id="testimonials" className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
              Ambassador Stories
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-4 font-display leading-[1.15]">
              Voices from the Campuses
            </h2>
            <p className="mt-3 text-slate-300 text-base leading-[1.65]">
              Real student experiences across major institutions in Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Muhammad Usman',
                campus: 'FAST-NU Islamabad',
                batch: 'CS Batch 2026',
                quote:
                  'Leading Boardly at FAST gave me real marketing experience. My entire class prepared for semester finals using the chapter mock tests.',
              },
              {
                name: 'Aiman Tariq',
                campus: 'King Edward Medical University',
                batch: 'MBBS Class 2028',
                quote:
                  'The 30 days of free Premium was great, but the official recommendation letter and paid internship opportunity are what truly set this apart.',
              },
              {
                name: 'Hassan Raza',
                campus: 'NUST SEECS Islamabad',
                batch: 'Software Engineering',
                quote:
                  'Sharing Boardly with my college peers was effortless because the question bank and step-by-step derivations are genuinely the best in Pakistan.',
              },
              {
                name: 'Zoya Ahmed',
                campus: 'Dow University of Health Sciences',
                batch: 'MDCAT Mentor',
                quote:
                  'Having a direct dashboard where you see how many peers you’ve helped revise makes serving as an ambassador genuinely rewarding.',
              },
            ].map((testi, idx) => (
              <div
                key={idx}
                className="bg-[#0b0a2a]/80 border border-violet-500/20 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between shadow-lg hover:border-violet-400/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <p className="text-slate-300 text-base leading-[1.65] italic mb-6">
                    &ldquo;{testi.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-violet-500/15">
                  <div className="text-base font-bold text-white font-display">{testi.name}</div>
                  <div className="text-sm text-violet-400 font-medium">{testi.campus}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">{testi.batch}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION H: FAQ (Smooth Accordion with + / x icon) */}
        <section ref={faqRef} id="faq" className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-500/30">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-4 font-display leading-[1.15]">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-300 text-base leading-[1.65]">
              Everything you need to know about joining and succeeding in Boardly Crew.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Who can join Boardly Crew?',
                a: 'Any currently enrolled Matric (SSC), Intermediate (FSC/ICS/A-Levels), or undergraduate university student in Pakistan. We look for passionate individuals who want to help their friends and campus peers excel academically.',
              },
              {
                q: 'How do I apply?',
                a: 'Simply fill out the 3-step application form right below on this page (/crew/apply). It takes less than 2 minutes: provide your name, institution, and a quick sentence on how you plan to share Boardly.',
              },
              {
                q: 'Is it completely free to join?',
                a: 'Yes, 100% free forever. There are zero fees, application charges, or mandatory purchases. In fact, upon approval, you receive 30 days of full Boardly Pro access completely free of charge.',
              },
              {
                q: 'What do I get upon approval?',
                a: 'Approved ambassadors unlock: (1) 30 days of free Boardly Pro access, (2) their personalized referral link and code, (3) access to the live ambassador tracking dashboard, (4) a 1-year tenure title, and (5) qualification for paid internships and signed recommendation letters.',
              },
              {
                q: 'How are student referrals counted?',
                a: 'You receive a unique referral link (e.g. boardly.cfd/r/YOURCODE) and promo code. When students sign up or practice through your link, our system automatically attributes them to your dashboard in real time.',
              },
              {
                q: 'Can my ambassador approval or tenure expire?',
                a: 'Your tenure lasts for 1 full year. To maintain good standing, ambassadors simply share resources and initiate peer study sessions each month. Consistent performers earn tenure extensions and paid internship positions.',
              },
            ].map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#0b0a2a]/80 border border-violet-500/25 rounded-2xl overflow-hidden backdrop-blur-xl transition-all"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:bg-white/5 min-h-[56px]"
                    aria-expanded={isExpanded}
                  >
                    <span className="text-base sm:text-lg font-bold text-white font-display">{faq.q}</span>
                    <span className="w-8 h-8 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0">
                      {isExpanded ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-5 sm:px-6 sm:pb-6 text-slate-300 text-base leading-[1.65] border-t border-violet-500/10 pt-4"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION I & APPLICATION FORM: Multi-Step Application Form */}
        <section ref={applyRef} id="apply" className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
          <div className="bg-gradient-to-br from-violet-950/90 via-[#0d0b38]/95 to-indigo-950/90 border border-violet-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-violet-950/60 backdrop-blur-2xl relative overflow-hidden">
            {/* Header */}
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-mono font-bold tracking-[0.08em] uppercase text-violet-300 bg-violet-900/60 px-3 py-1 rounded-full border border-violet-400/40">
                Official Application
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 font-display leading-[1.15]">
                Apply for Boardly Crew
              </h2>
              <p className="mt-2 text-slate-300 text-base leading-[1.65]">
                Complete your organizer application to host Boardly Blitz, Arena, and entry-test tournaments at your campus. Guest submissions welcome with zero login required.
              </p>
            </div>

            {/* Application Status Logic: Check if user already applied or approved */}
            {isCrewApproved ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2 font-display">You Are an Active Boardly Crew Organizer!</h3>
                <p className="text-slate-200 text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed">
                  Your organizer credentials are active. Create custom events from the 17k question bank, monitor live scoreboards, and manage your campus tournaments.
                </p>
                <button
                  onClick={() => onNavigate('/crew/dashboard')}
                  className="px-6 py-3.5 rounded-full font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2 min-h-[48px]"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Go to Organizer Dashboard</span>
                </button>
              </div>
            ) : existingApp?.status === 'pending' ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-violet-950/60 border border-violet-500/40 text-center">
                <Clock className="w-12 h-12 text-violet-400 mx-auto mb-3 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2 font-display">Application Under Review</h3>
                <p className="text-slate-200 text-sm sm:text-base max-w-md mx-auto mb-4 leading-relaxed">
                  Thank you, <strong className="text-white">{existingApp.fullName}</strong>! Your application submitted on{' '}
                  <strong className="text-white">{new Date(existingApp.createdAt).toLocaleDateString()}</strong> is being
                  reviewed by our campus leadership team.
                </p>
                <div className="inline-block px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-[0.08em] bg-violet-900/60 text-violet-300 border border-violet-500/30 mb-6">
                  Status: Pending Verification (24–48 hours)
                </div>
                <div>
                  <button
                    onClick={() => onNavigate('/')}
                    className="px-6 py-3 rounded-full font-semibold text-sm bg-white/10 text-slate-200 hover:bg-white/15 transition-colors min-h-[44px]"
                  >
                    Back to Boardly
                  </button>
                </div>
              </div>
            ) : existingApp?.status === 'revoked' ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-center">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2 font-display">Ambassador Access Revoked</h3>
                <p className="text-slate-200 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  Your Crew ambassador account has been suspended or revoked. If you believe this is an error, please
                  contact SHS Virtual Academy support at <strong className="text-white">shsvirtualadmin@gmail.com</strong>.
                </p>
              </div>
            ) : submittedSuccess ? (
              <div className="p-8 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2 font-display">Application Submitted!</h3>
                <p className="text-slate-200 text-base max-w-md mx-auto mb-6 leading-relaxed">
                  Welcome to the selection process! Our student community team will review your application within 24–48
                  hours. Check your email for next steps.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => onNavigate('/')}
                    className="px-6 py-3 rounded-full font-bold text-sm sm:text-base bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer min-h-[44px]"
                  >
                    Explore Boardly
                  </button>
                </div>
              </div>
            ) : !user ? (
              /* Guest Application Banner (No sign-in required) */
              <div className="p-6 sm:p-8 rounded-2xl bg-[#080721]/90 border border-violet-500/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-violet-900/60 border border-violet-500/40 text-violet-300 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Apply as a Student Organizer</h3>
                <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  No account required to submit your application. Enter your details as a guest, and we&apos;ll link it automatically whenever you sign in with the same email.
                </p>

                {formError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                  <button
                    onClick={() => setIsApplyModalOpen(true)}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-400 text-white shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <span>Open Application Form (Guest or Account)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleGoogleSignInForCrew}
                    disabled={googleAuthLoading}
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs bg-white text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    <span>Sign In with Google</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Multi-Step Application Form */
              <form onSubmit={handleApplicationSubmit} className="space-y-6">
                {/* Progress Bar & Steps Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs font-mono font-bold tracking-[0.08em] uppercase text-slate-300 mb-2">
                    <span className={step === 1 ? 'text-violet-400' : ''}>1. About You</span>
                    <span className={step === 2 ? 'text-violet-400' : ''}>2. Your Campus</span>
                    <span className={step === 3 ? 'text-violet-400' : ''}>3. Your Plan</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(step / 3) * 100}%` }}
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* STEP 1: About You */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Full Name <span className="text-violet-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ali Khan"
                          className="w-full bg-[#080721] border border-violet-500/30 rounded-xl pl-10 pr-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Email Address <span className="text-violet-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={user.email || email}
                          disabled
                          className="w-full bg-[#080721]/60 border border-slate-700 rounded-xl pl-10 pr-4 py-3.5 text-base text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <span className="text-sm text-slate-400 mt-1 block">
                        Linked directly to your authenticated Boardly account.
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        WhatsApp / Contact Number <span className="text-violet-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 0300 1234567"
                          className="w-full bg-[#080721] border border-violet-500/30 rounded-xl pl-10 pr-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!fullName.trim()) {
                            setFormError('Please enter your full name.');
                            return;
                          }
                          if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
                            setFormError('Please enter a valid phone number (at least 8 digits).');
                            return;
                          }
                          setFormError(null);
                          setStep(2);
                        }}
                        className="px-6 py-3.5 rounded-full font-bold text-base bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-700/40 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[48px]"
                      >
                        <span>Next: Campus Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Your Campus */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Institution / College / University Name <span className="text-violet-400">*</span>
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="e.g. FAST Islamabad, Punjab College Lahore, Army Public School"
                          className="w-full bg-[#080721] border border-violet-500/30 rounded-xl pl-10 pr-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Academic Stream / Class <span className="text-violet-400">*</span>
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={academicLevel}
                          onChange={(e) => setAcademicLevel(e.target.value)}
                          className="w-full bg-[#080721] border border-violet-500/30 rounded-xl pl-10 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-violet-400 transition-colors"
                        >
                          <option value="FSC Pre-Medical (11th & 12th)">FSC Pre-Medical (11th &amp; 12th)</option>
                          <option value="FSC Pre-Engineering (11th & 12th)">FSC Pre-Engineering (11th &amp; 12th)</option>
                          <option value="ICS Computer Science">ICS Computer Science</option>
                          <option value="Matric / SSC (9th & 10th)">Matric / SSC (9th &amp; 10th)</option>
                          <option value="A-Levels / O-Levels">A-Levels / O-Levels</option>
                          <option value="Undergraduate University Student">Undergraduate University Student</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        City / Campus Location <span className="text-violet-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Islamabad, Lahore, Rawalpindi, Karachi, Peshawar, Multan"
                        className="w-full bg-[#080721] border border-violet-500/30 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 transition-colors"
                        required
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-5 py-3 rounded-full font-semibold text-sm bg-white/10 text-slate-300 hover:bg-white/15 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!institution.trim()) {
                            setFormError('Please enter your institution name.');
                            return;
                          }
                          if (!city.trim()) {
                            setFormError('Please provide your city/region.');
                            return;
                          }
                          setFormError(null);
                          setStep(3);
                        }}
                        className="px-6 py-3.5 rounded-full font-bold text-base bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-700/40 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[48px]"
                      >
                        <span>Next: Promotion Plan</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Your Plan */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        Estimated Batch / Peer Reach
                      </label>
                      <select
                        value={networkReach}
                        onChange={(e) => setNetworkReach(e.target.value)}
                        className="w-full bg-[#080721] border border-violet-500/30 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-violet-400 transition-colors"
                      >
                        <option value="20 - 50 students">20 - 50 students (Close class batch)</option>
                        <option value="50 - 150 students">50 - 150 students (Multiple sections)</option>
                        <option value="150 - 500 students">150 - 500 students (Entire college wing / society)</option>
                        <option value="500+ students">500+ students (Campus-wide / multi-college reach)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                        How do you plan to promote Boardly at your campus? <span className="text-violet-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={promotionPlan}
                        onChange={(e) => setPromotionPlan(e.target.value)}
                        placeholder="e.g. Sharing past paper links in class WhatsApp groups, organizing peer study sessions before midterms, and posting on college society boards."
                        className="w-full bg-[#080721] border border-violet-500/30 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 transition-colors resize-none leading-relaxed"
                        required
                      />
                      <span className="text-sm text-slate-400 mt-1 block">
                        Keep it authentic and practical (minimum 15 characters).
                      </span>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-5 py-3 rounded-full font-semibold text-sm bg-white/10 text-slate-300 hover:bg-white/15 transition-colors cursor-pointer min-h-[44px]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 rounded-full font-bold text-base bg-gradient-to-r from-[#6d4aff] to-[#4f35f5] text-white shadow-xl shadow-violet-600/40 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-violet-400/40 min-h-[48px]"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Submitting Application...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Application</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </section>

        {/* SECTION I (Part 2): Final Call to Action */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center pb-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-violet-900/30 via-indigo-900/40 to-violet-950/30 border border-violet-500/30 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <h2 className="text-3xl sm:text-5xl font-bold text-white font-display leading-[1.15]">
              Your campus is waiting for someone to step up.
            </h2>
            <p className="mt-4 text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
              Be the ambassador who brings modern, AI-powered diagnostic test prep to your peers. Applications are
              reviewed on a rolling basis.
            </p>
            <div className="mt-8">
              <button
                onClick={() => navigateToSection('apply')}
                className="px-8 py-4 rounded-full font-bold text-base bg-gradient-to-r from-[#6d4aff] to-[#4f35f5] text-white shadow-xl shadow-violet-600/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2 border border-violet-400/40 min-h-[48px]"
              >
                <span>Apply to Join Crew Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Crew Footer */}
      <footer className="relative z-10 border-t border-violet-500/20 bg-[#040412] mt-16 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          {/* Brand info (single display: [B logo icon] + white "Boardly" + violet CREW pill) */}
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.08em] bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm border border-violet-400/30">
                CREW
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              An educational initiative by{' '}
              <a
                href="https://shsvirtualacademy.pro"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:underline"
              >
                SHS Virtual Academy
              </a>
              . National MCQ practice and student leadership portal across Pakistan.
            </p>
          </div>

          {/* Legal and Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center">
              Privacy Policy
            </button>
            <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center">
              Terms of Service
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center">
              Contact Support
            </button>
            <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center">
              Main Boardly Portal
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 text-center text-xs text-slate-400 font-mono tracking-[0.08em]">
          &copy; 2026 Boardly by SHS Virtual Academy. All rights reserved.
        </div>
      </footer>

      {/* Unified Application Modal for Crew */}
      <UnifiedProgramApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        defaultProgram="crew"
        onSuccess={() => {
          setIsApplyModalOpen(false);
          alert('Application received! Once approved, your Crew Organizer dashboard will be unlocked.');
        }}
      />
    </div>
  );
};

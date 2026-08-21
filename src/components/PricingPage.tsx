import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Stethoscope,
  Cpu,
  Lock,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
  X,
  MessageCircle,
  FileText,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InstitutionBadge } from './InstitutionBadge';
import { StudentProfile } from '../lib/supabase';
import { SegmentedControl } from './SegmentedControl';

export type PricingTrack = 'matric' | 'fsc' | 'tcat' | 'mdcat';
export type BillingCycle = 'daily' | 'monthly' | 'annual' | 'lifetime';

export interface PricingPageProps {
  userProfile?: StudentProfile | null;
  selectedClass?: string;
  selectedGroup?: string;
  selectedTrackOverride?: PricingTrack;
  currentTestsUsed?: number;
  onSelectProPlan?: (track: PricingTrack, cycle: BillingCycle) => void;
  onOpenPaymentModal?: () => void;
  onContinueFree?: () => void;
  onBack?: () => void;
}

export function getPricingTrackFromProfile(
  userProfile?: StudentProfile | null,
  selectedClass?: string,
  selectedGroup?: string
): PricingTrack {
  const gradeStr = String(selectedClass || userProfile?.grade || userProfile?.package_name || '').toLowerCase();
  const streamStr = String(selectedGroup || userProfile?.stream || '').toLowerCase();
  const combined = `${gradeStr} ${streamStr}`;

  if (combined.includes('mdcat')) return 'mdcat';
  if (combined.includes('tcat') || combined.includes('ecat')) return 'tcat';
  if (combined.includes('9') || combined.includes('10') || combined.includes('matric') || combined.includes('ssc')) return 'matric';
  if (combined.includes('11') || combined.includes('12') || combined.includes('fsc') || combined.includes('hssc') || combined.includes('pre-medical') || combined.includes('pre-engineering') || combined.includes('ics')) return 'fsc';

  return 'fsc';
}

interface TrackPricingConfig {
  id: PricingTrack;
  name: string;
  category: string;
  badge: string;
  targetTrack: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  borderAccent: string;
  badgeBg: string;
  badgeText: string;
  prices: {
    daily?: { price: number; formatted: string; label: string };
    monthly: { price: number; formatted: string; label: string };
    annual: { price: number; formatted: string; label: string; monthlyEquivalent: string; savings: string };
    lifetime: { price: number; formatted: string; label: string; savings: string };
  };
  instBadges: string[];
  proFeatures: string[];
}

const TRACK_CONFIGS: Record<PricingTrack, TrackPricingConfig> = {
  matric: {
    id: 'matric',
    name: 'Matric SSC Prep',
    category: 'FBISE Class 9 & 10',
    badge: 'Class 9 – 10',
    targetTrack: 'Matric (SSC Part 1 & Part 2)',
    description: 'Complete preparation for FBISE Class 9th & 10th Computer Science & Pre-Medical.',
    icon: GraduationCap,
    accentColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
    borderAccent: 'border-emerald-500/40 hover:border-emerald-400',
    badgeBg: 'bg-emerald-500/10 ',
    badgeText: 'text-emerald-700  border-emerald-500/30',
    prices: {
      monthly: { price: 499, formatted: 'Rs. 499', label: '/ month' },
      annual: { price: 2999, formatted: 'Rs. 2,999', label: '/ year', monthlyEquivalent: 'Rs. 250/mo', savings: 'Save 50%' },
      lifetime: { price: 4999, formatted: 'Rs. 4,999', label: 'one-time', savings: 'Lifetime Access' },
    },
    instBadges: ['apsacs', 'fgc', 'opf'],
    proFeatures: [
      'Full SSC 9th & 10th chapter-wise practice questions',
      'Unlimited practice tests & custom test builder',
      'Unlimited 24/7 Study Buddy AI tutor',
      'Chapter progress tracking & weak topic detection',
      'Past papers & FBISE exam pattern questions',
      'Printable PDF test generator with answer keys',
    ],
  },
  fsc: {
    id: 'fsc',
    name: 'FSc HSSC Mastery',
    category: 'FBISE Class 11 & 12',
    badge: 'Class 11 – 12',
    targetTrack: 'FSc (HSSC Part 1 & Part 2)',
    description: 'Advanced mastery for FBISE Class 11th & 12th Pre-Medical, Pre-Engineering & ICS.',
    icon: BookOpen,
    accentColor: 'from-blue-500/20 to-indigo-500/20 text-blue-400',
    borderAccent: 'border-blue-500/40 hover:border-blue-400',
    badgeBg: 'bg-blue-500/10 ',
    badgeText: 'text-blue-700  border-blue-500/30',
    prices: {
      monthly: { price: 999, formatted: 'Rs. 999', label: '/ month' },
      annual: { price: 5999, formatted: 'Rs. 5,999', label: '/ year', monthlyEquivalent: 'Rs. 500/mo', savings: 'Save 50%' },
      lifetime: { price: 8999, formatted: 'Rs. 8,999', label: 'one-time', savings: 'Lifetime Access' },
    },
    instBadges: ['kips', 'pgc', 'apsacs'],
    proFeatures: [
      'Full HSSC 11th & 12th chapter-wise practice',
      'Unlimited practice tests & custom AI test builder',
      'Unlimited 24/7 Study Buddy AI tutor',
      'Detailed subject weakness breakdown & analytics',
      'Concept explanations & step-by-step solutions',
      'Printable PDF test generator with answer keys',
    ],
  },
  tcat: {
    id: 'tcat',
    name: 'ECAT / TCAT Engineering',
    category: 'UET Taxila / ECAT / Entry Test',
    badge: 'Engineering Track',
    targetTrack: 'TCAT / ECAT / NUST / FAST / GIKI',
    description: 'Full engineering entrance exam prep with 100-MCQ Full Mock Tests & Speed Analytics.',
    icon: Cpu,
    accentColor: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
    borderAccent: 'border-cyan-500/40 hover:border-cyan-400',
    badgeBg: 'bg-cyan-500/10 ',
    badgeText: 'text-cyan-700  border-cyan-500/30',
    prices: {
      daily: { price: 50, formatted: 'Rs. 50', label: '/ day' },
      monthly: { price: 1499, formatted: 'Rs. 1,499', label: '/ month' },
      annual: { price: 8999, formatted: 'Rs. 8,999', label: '/ year', monthlyEquivalent: 'Rs. 750/mo', savings: 'Save 50%' },
      lifetime: { price: 11999, formatted: 'Rs. 11,999', label: 'one-time', savings: 'Lifetime Access' },
    },
    instBadges: ['nust', 'fast', 'giki', 'ned', 'lums', 'iba'],
    proFeatures: [
      'Full TCAT & ECAT engineering track access',
      '100-MCQ Full Mock Test series with exam timer',
      'Unlimited 24/7 Study Buddy AI tutor',
      'Detailed speed, accuracy & subject analytics',
      'Math, Physics & CS high-yield question bank',
      'Printable PDF test generator & past paper archive',
    ],
  },
  mdcat: {
    id: 'mdcat',
    name: 'MDCAT Medical Prep',
    category: 'PMDC Medical Admissions',
    badge: 'Medical Track',
    targetTrack: 'MDCAT / UHS / DUHS / NUMS / KMU',
    description: 'Ultimate medical entry test track with 180-MCQ Grand Tests & PMDC Syllabus coverage.',
    icon: Stethoscope,
    accentColor: 'from-rose-500/20 to-pink-500/20 text-rose-400',
    borderAccent: 'border-rose-500/40 hover:border-rose-400',
    badgeBg: 'bg-rose-500/10 ',
    badgeText: 'text-rose-700  border-rose-500/30',
    prices: {
      daily: { price: 50, formatted: 'Rs. 50', label: '/ day' },
      monthly: { price: 1499, formatted: 'Rs. 1,499', label: '/ month' },
      annual: { price: 8999, formatted: 'Rs. 8,999', label: '/ year', monthlyEquivalent: 'Rs. 750/mo', savings: 'Save 50%' },
      lifetime: { price: 11999, formatted: 'Rs. 11,999', label: 'one-time', savings: 'Lifetime Access' },
    },
    instBadges: ['uhs', 'duhs', 'nums', 'kmu', 'szabmu'],
    proFeatures: [
      'Full PMDC MDCAT medical track access',
      '180-MCQ Grand Test series with exam timer',
      'Unlimited 24/7 Study Buddy AI tutor',
      'Detailed subject weakness & high-yield topics',
      'Biology, Chemistry & Physics entry test drills',
      'Printable PDF test generator & past paper archive',
    ],
  },
};

const FAQS = [
  {
    q: 'How does the 2 test/month free limit work?',
    a: 'Free tier users receive 2 test attempts every calendar month. Your attempt counter resets automatically on the 1st of every month. Upgrading to Pro removes all limits for unlimited testing.',
  },
  {
    q: 'How do I submit payment for Pro access?',
    a: 'You can pay via EasyPaisa, JazzCash, SadaPay, NayaPay, or Bank Transfer. After sending payment, upload your payment receipt or send a screenshot on WhatsApp (+923222314436) for fast activation within 2–4 hours.',
  },
  {
    q: 'Can I switch my study track or grade after upgrading?',
    a: "Study track and grade changes must be requested through an admin — this isn't a self-service option for students, regardless of subscription tier. Contact support or your admin to request a change.",
  },
  {
    q: 'What is included in the 100/180 MCQ Grand Mocks?',
    a: 'Grand Mocks replicate actual UET/PMDC entrance exams with realistic countdown timers, negative marking options, and detailed subject accuracy reports.',
  },
];

export const PricingPage: React.FC<PricingPageProps> = ({
  userProfile,
  selectedClass,
  selectedGroup,
  selectedTrackOverride,
  currentTestsUsed = 0,
  onSelectProPlan,
  onOpenPaymentModal,
  onContinueFree,
  onBack,
}) => {
  const getInitialTrack = (): PricingTrack => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTrack = (searchParams.get('track') || '').toLowerCase();
      if (urlTrack === 'matric' || urlTrack === 'fsc' || urlTrack === 'tcat' || urlTrack === 'mdcat') {
        return urlTrack as PricingTrack;
      }
    } catch {
      // ignore
    }

    if (selectedTrackOverride) return selectedTrackOverride;

    return getPricingTrackFromProfile(userProfile, selectedClass, selectedGroup);
  };

  const [selectedTrack, setSelectedTrack] = React.useState<PricingTrack>(getInitialTrack);
  const [selectedCycle, setSelectedCycle] = React.useState<BillingCycle>('annual');
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  const userEnrolledTrack = React.useMemo(() => {
    return getPricingTrackFromProfile(userProfile, selectedClass, selectedGroup);
  }, [userProfile?.grade, userProfile?.stream, userProfile?.package_name, selectedClass, selectedGroup]);

  const hasKnownTrack = Boolean(userProfile || selectedClass);

  React.useEffect(() => {
    if (hasKnownTrack) {
      setSelectedTrack(userEnrolledTrack);
    } else {
      setSelectedTrack(getInitialTrack());
    }
  }, [hasKnownTrack, userEnrolledTrack, userProfile?.grade, userProfile?.stream, userProfile?.package_name, selectedClass, selectedGroup, selectedTrackOverride]);

  const activeConfig = TRACK_CONFIGS[selectedTrack];
  const supportsDaily = selectedTrack === 'mdcat' || selectedTrack === 'tcat';

  React.useEffect(() => {
    if (!supportsDaily && selectedCycle === 'daily') {
      setSelectedCycle('monthly');
    }
  }, [supportsDaily, selectedCycle]);

  const activePriceInfo = activeConfig.prices[selectedCycle] || activeConfig.prices.monthly;

  const handleUpgradeClick = () => {
    if (onSelectProPlan) {
      onSelectProPlan(selectedTrack, selectedCycle);
    }
    if (onOpenPaymentModal) {
      onOpenPaymentModal();
    } else {
      // Fallback open WhatsApp link for instant verification
      const waMsg = encodeURIComponent(
        `Hi Boardly Team! I would like to upgrade to ${activeConfig.name} (${selectedCycle.toUpperCase()} Plan - ${activePriceInfo.formatted}). Please guide me with payment verification.`
      );
      window.open(`https://wa.me/923222314436?text=${waMsg}`, '_blank');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-4 px-2 sm:px-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700  border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Simple, Transparent Pricing</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900  tracking-tight">
          Boardly Plans &amp; Pricing — SHS Virtual Academy
        </h1>

        <p className="text-sm sm:text-base text-slate-600  leading-relaxed">
          Start free with <strong className="text-slate-900 ">2 practice tests per month</strong>, or unlock unlimited practice tests, grand mock exams, and 24/7 AI Tutor with <strong className="text-emerald-600  font-extrabold">Boardly Pro</strong>.
        </p>

        {hasKnownTrack && (
          <div className="pt-2 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-[#1E5AFF]/10 text-[#1E5AFF]  border border-[#1E5AFF]/30 shadow-xs max-w-full">
              <GraduationCap className="w-4 h-4 text-[#1E5AFF] shrink-0" />
              <span className="whitespace-nowrap">Enrolled Track:</span>
              <strong className="font-extrabold text-slate-900  whitespace-nowrap">
                {TRACK_CONFIGS[userEnrolledTrack]?.name || 'FSc HSSC Mastery'}
              </strong>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#1E5AFF] text-white whitespace-nowrap shrink-0 inline-flex items-center justify-center min-w-max">
                {TRACK_CONFIGS[userEnrolledTrack]?.badge}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Track Selector Tabs — ONLY shown when user does NOT have a known enrolled track */}
      {!hasKnownTrack && (
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 ">
              Step 1: Select Your Exam Track
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-1.5 bg-slate-200/70  rounded-2xl border border-slate-300/60  max-w-3xl mx-auto">
            {(Object.keys(TRACK_CONFIGS) as PricingTrack[]).map((trackKey) => {
              const config = TRACK_CONFIGS[trackKey];
              const Icon = config.icon;
              const isSelected = selectedTrack === trackKey;

              return (
                <button
                  key={trackKey}
                  onClick={() => setSelectedTrack(trackKey)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer text-center relative ${
                    isSelected
                      ? 'bg-white  text-slate-900  shadow-md border border-slate-300  font-bold'
                      : 'text-slate-600  hover:text-slate-900  hover:bg-slate-300/40  font-medium'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mb-1 ${isSelected ? 'bg-[#1E5AFF]/10 text-[#1E5AFF] ' : 'text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">{config.name}</span>
                  <span className="text-[10px] text-slate-500  whitespace-nowrap">{config.badge}</span>

                  {isSelected && (
                    <motion.div
                      layoutId="activeTrackIndicator"
                      className="absolute -bottom-1 w-6 h-1 bg-[#1E5AFF] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Billing Cycle Selector Toggle */}
      <div className="space-y-2">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 ">
            {hasKnownTrack ? 'Choose Billing Cycle' : 'Step 2: Choose Billing Cycle'}
          </span>
        </div>

        <div className="w-full max-w-xl mx-auto px-1 sm:px-2">
          <SegmentedControl<BillingCycle>
            id="pricing-billing-cycle-segmented"
            options={[
              ...(supportsDaily ? [{ value: 'daily' as BillingCycle, label: 'Daily' }] : []),
              { value: 'monthly', label: 'Monthly' },
              {
                value: 'annual',
                label: 'Annual',
                badge: 'Save 50%',
                badgeClassName:
                  selectedCycle === 'annual'
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-500/20 text-emerald-600',
              },
              {
                value: 'lifetime',
                label: 'Lifetime',
                badge: 'Best Value',
                badgeClassName:
                  selectedCycle === 'lifetime'
                    ? 'bg-white/25 text-white'
                    : 'bg-purple-500/20 text-purple-600',
              },
            ]}
            value={selectedCycle}
            onChange={(cycle) => setSelectedCycle(cycle)}
            theme="light"
            size="md"
            fullWidth
            className="w-full"
          />
        </div>
      </div>

      {/* 2 Plan Cards Grid ONLY (Free vs Pro) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-2">
        {/* FREE TIER CARD */}
        <div className="bg-white  border-2 border-slate-200  rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-sm relative">
          <div className="space-y-4">
            {/* Header / Badge */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100  text-slate-700  border border-slate-200 ">
                Free Starter Tier
              </span>
              <span className="text-[11px] font-bold text-slate-500 ">
                No Credit Card Required
              </span>
            </div>

            {/* Pricing Title & Number */}
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 ">Free Starter</h3>
              <p className="text-xs text-slate-500 ">Explore subjects & sample practice questions</p>
              
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 ">Rs. 0</span>
                <span className="text-xs text-slate-500  font-bold">/ forever</span>
              </div>
            </div>

            {/* Attempt Limit Callout Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-800 ">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 " />
                  Attempt Limit
                </span>
                <span>2 Tests / Month</span>
              </div>
              <p className="text-[11px] text-amber-900/80  leading-snug">
                Free users are limited to 2 practice tests per calendar month. Hard limit enforced server-side.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-slate-900  uppercase tracking-wider">
                What's Included:
              </span>
              <ul className="space-y-2 text-xs text-slate-600 ">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>2 Practice Tests per month</strong> (rolling reset on 1st)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Browse chapters &amp; syllabus outlines</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Basic Study Buddy AI tutor answers (5 msgs/day limit)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Standard score report overview</span>
                </li>
              </ul>
            </div>

            {/* Limitations List */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400  uppercase tracking-wider">
                Limitations:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-500 ">
                <li className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Blocked after 2 tests each month</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>No 100/180 MCQ Grand Mocks</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>No PDF printable test generator</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onContinueFree}
            className="w-full bg-slate-100 hover:bg-slate-200   text-slate-900  font-extrabold py-3 px-4 rounded-2xl text-xs transition-all cursor-pointer text-center border border-slate-300 "
          >
            Continue with Free Plan
          </button>
        </div>

        {/* PRO FULL ACCESS CARD */}
        <div className="bg-gradient-to-b from-slate-900 to-[#0F172A] text-white border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          {/* Top Glow Accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${activeConfig.badgeBg} ${activeConfig.badgeText} whitespace-nowrap shrink-0 inline-flex items-center`}>
                {activeConfig.badge} Pro Access
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-sm animate-pulse whitespace-nowrap shrink-0 inline-flex items-center">
                Recommended
              </span>
            </div>

            {/* Pricing Title & Number */}
            <div>
              <h3 className="text-xl font-black text-white">{activeConfig.name} Pro</h3>
              <p className="text-xs text-slate-300">{activeConfig.description}</p>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white">{activePriceInfo.formatted}</span>
                <span className="text-xs text-slate-300 font-bold">{activePriceInfo.label}</span>

                {selectedCycle === 'annual' && 'monthlyEquivalent' in activePriceInfo && (
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {(activePriceInfo as any).monthlyEquivalent}
                  </span>
                )}
              </div>
            </div>

            {/* Unlimited Attempt Box */}
            <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  Unlimited Attempt License
                </span>
                <span className="uppercase text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md">
                  No Limits
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-snug">
                Generate unlimited practice tests, custom chapter drills, and full grand mocks anytime without restrictions.
              </p>
            </div>

            {/* Target Institutions Badges */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Targeted For Top Institutions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeConfig.instBadges.map((instId) => (
                  <InstitutionBadge key={instId} id={instId} size="sm" />
                ))}
              </div>
            </div>

            {/* Pro Features List */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Everything Unlocked in Pro:
              </span>
              <ul className="space-y-2 text-xs text-slate-200">
                {activeConfig.proFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleUpgradeClick}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-3.5 px-5 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer text-center shadow-lg hover:shadow-emerald-500/25 active:scale-98 flex items-center justify-center gap-2 relative z-10"
          >
            <span>
              {selectedCycle === 'daily'
                ? `Get Daily Access — ${activePriceInfo.formatted}`
                : `Upgrade to Pro — ${activePriceInfo.formatted}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto pt-6 space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-slate-900 ">Feature Comparison</h3>
          <p className="text-xs text-slate-500 ">Free Starter vs Boardly Pro at a glance</p>
        </div>

        <div className="bg-white  rounded-2xl border border-slate-200  overflow-hidden shadow-sm text-xs">
          <div className="grid grid-cols-3 bg-slate-100  p-3.5 font-extrabold text-slate-900  border-b border-slate-200 ">
            <div>Feature</div>
            <div className="text-center">Free Starter</div>
            <div className="text-center text-emerald-600 ">Boardly Pro</div>
          </div>

          <div className="divide-y divide-slate-200 ">
            <div className="grid grid-cols-3 p-3.5 items-center">
              <span className="font-bold text-slate-800 ">Monthly Test Attempts</span>
              <span className="text-center text-amber-600 font-extrabold">2 Tests / Month</span>
              <span className="text-center text-emerald-500 font-black">Unlimited</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 items-center bg-slate-50/50 ">
              <span className="font-bold text-slate-800 ">Grand Mock Exams (100/180 MCQs)</span>
              <span className="text-center text-slate-400">❌ Not Included</span>
              <span className="text-center text-emerald-500 font-black">✅ Full Timed Mocks</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 items-center">
              <span className="font-bold text-slate-800 ">24/7 AI Study Buddy Tutor</span>
              <span className="text-center text-slate-500">5 msgs / day</span>
              <span className="text-center text-emerald-500 font-black">Unlimited 24/7</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 items-center bg-slate-50/50 ">
              <span className="font-bold text-slate-800 ">Printable PDF Test Generator</span>
              <span className="text-center text-slate-400">❌ Muted</span>
              <span className="text-center text-emerald-500 font-black">✅ Unlimited PDFs</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 items-center">
              <span className="font-bold text-slate-800 ">Weakness Detection &amp; Analytics</span>
              <span className="text-center text-slate-500">Basic Score Report</span>
              <span className="text-center text-emerald-500 font-black">Deep Topic Breakdown</span>
            </div>

            <div className="grid grid-cols-3 p-3.5 items-center bg-slate-50/50 ">
              <span className="font-bold text-slate-800 ">Past Papers &amp; Solution Archive</span>
              <span className="text-center text-slate-500">Sample Questions</span>
              <span className="text-center text-emerald-500 font-black">Full Archives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Verification Notice Box */}
      <div className="bg-slate-100  rounded-2xl p-5 border border-slate-200  max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 font-black text-slate-900 ">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Fast Payment Verification &amp; Instant Access</span>
          </div>
          <p className="text-slate-600 ">
            Pay via EasyPaisa, JazzCash, SadaPay, NayaPay, or Bank Transfer. Accounts verified within 2–4 hours.
          </p>
        </div>

        <button
          onClick={handleUpgradeClick}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl cursor-pointer transition-all shrink-0 text-center"
        >
          Verify Payment via WhatsApp
        </button>
      </div>

      {/* FAQs Section */}
      <div className="max-w-3xl mx-auto pt-4 space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-slate-900 ">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-500 ">Have questions before upgrading?</p>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white  border border-slate-200  rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-900  cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600  border-t border-slate-100  pt-2 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

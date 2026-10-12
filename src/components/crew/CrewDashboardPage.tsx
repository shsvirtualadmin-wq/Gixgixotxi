import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Sparkles,
  Copy,
  Check,
  Share2,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Building,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info,
  Send,
  Lock,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCrewStatusInfo, checkAndEnforceCrewExpiration, CREW_TENURE_SIGNUP_TARGET, CREW_INTERNSHIP_SIGNUP_TARGET } from '../../lib/crewLogic';
import { fetchReferralCount } from '../../lib/firebase';
import { SeoHead } from '../common/SeoHead';

interface CrewDashboardPageProps {
  onBackToApp?: () => void;
  onApply?: () => void;
}

export const CrewDashboardPage: React.FC<CrewDashboardPageProps> = ({
  onBackToApp,
  onApply,
}) => {
  const { user, profile, isAdmin, updateProfileData } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [liveReferralCount, setLiveReferralCount] = useState<number | null>(null);

  // Auto-check tenure expiration on mount
  useEffect(() => {
    if (profile && profile.isCrewMember) {
      checkAndEnforceCrewExpiration(profile, updateProfileData).catch(console.warn);
    }
  }, [profile, updateProfileData]);

  const crewInfo = getCrewStatusInfo(profile);
  const isApprovedCrew = profile?.isCrewMember === true || isAdmin;

  // Requirement 4: Live referral count synchronization
  useEffect(() => {
    if (crewInfo.referralCode) {
      fetchReferralCount(crewInfo.referralCode).then((cnt) => {
        setLiveReferralCount(cnt);
      }).catch(console.warn);
    }
  }, [crewInfo.referralCode]);

  const effectiveReferralsCount = typeof liveReferralCount === 'number'
    ? Math.max(liveReferralCount, crewInfo.referralsCount)
    : crewInfo.referralsCount;

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://boardly.cfd';
  const referralUrl = `${appOrigin}/signup?ref=${encodeURIComponent(crewInfo.referralCode)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(crewInfo.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Prepare for your Board exams and entrance tests with Boardly & SHS Virtual Academy. Use my ambassador code ${crewInfo.referralCode} to practice diagnostic mocks and chat with Boardy AI: ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // If user is not an approved Crew member (and not admin), show friendly access screen
  if (!isApprovedCrew) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between pt-24 pb-16 px-4 sm:px-6">
        <SeoHead pathname="/crew-dashboard" />
        <div className="max-w-xl mx-auto w-full my-auto space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm border border-indigo-100">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0d1b3e] tracking-tight">
              Boardly Crew Member Access Only
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              This dashboard is reserved for approved Student Ambassadors representing Boardly and SHS Virtual Academy at their institutions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-left space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800">Ambassador Perks</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  30 days free Premium access upon approval, performance-based paid internship opportunities, 1-year tenure, and a personalized tracking link.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/programs/crew');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Apply for Boardly Crew</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onBackToApp) onBackToApp();
                else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/app');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Return to Student Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate internship progress (target: 25 signups)
  const internshipProgressPercent = Math.min(
    100,
    Math.round((effectiveReferralsCount / CREW_INTERNSHIP_SIGNUP_TARGET) * 100)
  );

  const tenureGoalAchieved = effectiveReferralsCount >= CREW_TENURE_SIGNUP_TARGET;
  const tenureGoalRemaining = Math.max(0, CREW_TENURE_SIGNUP_TARGET - effectiveReferralsCount);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      <SeoHead pathname="/crew-dashboard" />

      {/* Top Breadcrumb & Status Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <button
              type="button"
              onClick={() => {
                if (onBackToApp) onBackToApp();
                else if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/app');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 font-bold">Crew Ambassador Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0d1b3e] tracking-tight">
            Boardly Crew Ambassador Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Campus: <span className="font-bold text-slate-800">{crewInfo.institution}</span> · Representing Boardly &amp; SHS Virtual Academy
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Requirement 3: Link back from the Crew Dashboard to the student app */}
          <button
            type="button"
            onClick={() => {
              if (onBackToApp) onBackToApp();
              else if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/app');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-slate-200 shadow-2xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Return to Student App</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Active Ambassador</span>
          </div>
          {crewInfo.isPaidInternshipEligible && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black animate-scale-in">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Paid Internship Unlocked</span>
            </div>
          )}
        </div>
      </div>

      {/* REVOCATION WARNING BANNER (PART 3 REQUIREMENT: If 0 referrals nearing end of first 30 days) */}
      {crewInfo.hasInactivityWarning && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-black">
                Warning: Inactivity Detected
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                You currently have <strong>0 signups</strong> recorded with only <strong>{crewInfo.daysRemainingInTrial} days remaining</strong> in your 30-day initial period. Your Crew Ambassador status and Premium access may be revoked due to inactivity if no peer signups are recorded before your trial ends.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-xs"
          >
            Share on WhatsApp Now
          </button>
        </div>
      )}

      {/* STATUS COUNTDOWN BANNER (PART 3 REQUIREMENT) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/15 animate-fade-in-up">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>30-Day Premium Access Status</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {tenureGoalAchieved ? (
                <>🎉 1-Year Tenure Secured! ({effectiveReferralsCount} signups recorded)</>
              ) : (
                <>
                  You have <span className="text-amber-300 font-extrabold">{crewInfo.daysRemainingInTrial} days</span> of Premium Access remaining. Get {tenureGoalRemaining} signups to extend your status!
                </>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-xl">
              {tenureGoalAchieved
                ? 'Congratulations! You have crossed the minimum threshold for your 1-year ambassadorship. Keep bringing peers to unlock the Paid Internship tier!'
                : `Every Crew Ambassador receives 30 days of complimentary full Premium access upon joining. Bring in at least ${CREW_TENURE_SIGNUP_TARGET} active students from your campus to maintain your spot for the full 1-year tenure.`}
            </p>

            {/* Quick stats in banner */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-indigo-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Days Active: {crewInfo.daysActive}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Days Remaining: {crewInfo.daysRemainingInTrial}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Tenure Target: {effectiveReferralsCount}/{CREW_TENURE_SIGNUP_TARGET}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200 mb-1">
              Your Referral Code
            </span>
            <div className="text-xl sm:text-2xl font-black tracking-wider text-white font-mono bg-white/15 px-4 py-2 rounded-xl mb-3 border border-white/10">
              {crewInfo.referralCode}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full py-2 px-3 rounded-xl bg-white text-indigo-950 font-black text-xs hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* REFERRAL LINK CARD (PART 3 REQUIREMENT: Large, easily copyable unique link) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-[#0d1b3e]">
              Your Ambassador Referral Link
            </h3>
            <p className="text-xs text-slate-500">
              Share this link directly in batch WhatsApp groups, Discord, or class study squads.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            Auto-Tracks Signups
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/90 font-mono text-xs sm:text-sm text-slate-800 break-all select-all flex items-center justify-between">
            <span>{referralUrl}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* PERFORMANCE METRICS & INTERNSHIP STATUS TRACKER (PART 3 REQUIREMENT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Referrals */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2 card-interactive hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Signups Brought In
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0d1b3e]">
            {effectiveReferralsCount}
          </div>
          <p className="text-[11px] text-slate-400">
            Registered students who joined via your code/link
          </p>
        </div>

        {/* Metric 2: Active Users */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2 card-interactive hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Users
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#0d1b3e]">
            {crewInfo.activeUsersCount}
          </div>
          <p className="text-[11px] text-slate-400">
            Students actively attempting mocks and drills
          </p>
        </div>

        {/* Metric 3: Tenure Status */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2 card-interactive hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1-Year Tenure Status
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0d1b3e]">
            {tenureGoalAchieved ? (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <Check className="w-6 h-6" /> Confirmed
              </span>
            ) : (
              <span className="text-amber-600">
                {effectiveReferralsCount} / {CREW_TENURE_SIGNUP_TARGET}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {tenureGoalAchieved
              ? 'Tenure unlocked for full 365 days'
              : `${tenureGoalRemaining} more signups required`}
          </p>
        </div>
      </div>

      {/* INTERNSHIP STATUS TRACKER WITH PROGRESS BAR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base text-[#0d1b3e]">
                Paid Internship Status Tracker
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Top ambassador performers are awarded official paid remote internship positions with SHS Virtual Academy.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">Progress</span>
            <span className="text-lg font-black text-indigo-600">
              {crewInfo.referralsCount} / {CREW_INTERNSHIP_SIGNUP_TARGET} signups
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${internshipProgressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
            <span>Tier 1: Onboarded (0)</span>
            <span>Tier 2: Tenure Locked (10)</span>
            <span className={crewInfo.isPaidInternshipEligible ? 'text-emerald-600 font-black' : ''}>
              Tier 3: Paid Internship ({CREW_INTERNSHIP_SIGNUP_TARGET})
            </span>
          </div>
        </div>

        {/* Milestone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-950">Ambassador Status</p>
              <p className="text-[11px] text-indigo-700/80">30 days complimentary Premium access active.</p>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${crewInfo.tenureGoalAchieved ? 'bg-emerald-50/70 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${crewInfo.tenureGoalAchieved ? 'text-emerald-600' : 'text-slate-300'}`} />
            <div>
              <p className={`font-bold ${crewInfo.tenureGoalAchieved ? 'text-emerald-950' : 'text-slate-800'}`}>1-Year Tenure</p>
              <p className="text-[11px] text-slate-500">Requires 10 student signups from your campus.</p>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${crewInfo.isPaidInternshipEligible ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
            <Award className={`w-4 h-4 shrink-0 mt-0.5 ${crewInfo.isPaidInternshipEligible ? 'text-amber-600' : 'text-slate-300'}`} />
            <div>
              <p className={`font-bold ${crewInfo.isPaidInternshipEligible ? 'text-amber-950' : 'text-slate-800'}`}>Paid Internship Tier</p>
              <p className="text-[11px] text-slate-500">
                {crewInfo.isPaidInternshipEligible
                  ? 'Eligible! Our coordinator will contact you.'
                  : `${crewInfo.internshipGoalRemaining} more signups to qualify.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AMBASSADOR MISSIONS SECTION (Requirement 4) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-base text-[#0d1b3e]">
                Weekly Ambassador Missions
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Complete action missions to engage classmates and speed up your paid internship unlock.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Active Challenges
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">1. Study Squad Introduction</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">+50 XP</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Share your referral link inside your batch WhatsApp group or study circle.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
              <span className="text-emerald-600 font-bold">Ready to Share</span>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="text-indigo-600 font-extrabold hover:underline cursor-pointer"
              >
                Share Now &rarr;
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">2. First 5 Peer Signups</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {Math.min(5, crewInfo.referralsCount)}/5
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Have 5 classmates register using your ambassador code to unlock the Tenure Tracker milestone.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500">
                {crewInfo.referralsCount >= 5 ? '✓ Completed' : `${Math.max(0, 5 - crewInfo.referralsCount)} more needed`}
              </span>
              <span className="font-bold text-indigo-600">Milestone 1</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">3. Diagnostic Mock Attempt</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Engagement</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Encourage enrolled peers to complete at least 1 full diagnostic mock drill.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500">Active peer users: {crewInfo.activeUsersCount}</span>
              <span className="font-bold text-emerald-600">Active Track</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900">4. Paid Internship Qualification</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {crewInfo.referralsCount}/{CREW_INTERNSHIP_SIGNUP_TARGET}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Reach {CREW_INTERNSHIP_SIGNUP_TARGET} total active peer referrals for remote paid ambassador interview.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500">
                {crewInfo.isPaidInternshipEligible ? '🎉 Eligible' : `${crewInfo.internshipGoalRemaining} referrals remaining`}
              </span>
              <span className="font-bold text-indigo-600">Tier 3</span>
            </div>
          </div>
        </div>
      </div>

      {/* REWARDS TIER SECTION (Requirement 4) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-base text-[#0d1b3e]">
                Ambassador Rewards &amp; Recognition
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Rewards unlocked through verified campus ambassadorship and student engagement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-black text-slate-900">30 Days Premium</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Full access to AI tutor Boardy, mock analytics, and question banks unlocked upon approval.
            </p>
            <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              ✓ Active Now
            </span>
          </div>

          <div className={`p-4 rounded-2xl border space-y-2 ${crewInfo.tenureGoalAchieved ? 'bg-indigo-50/70 border-indigo-200/80' : 'bg-slate-50 border-slate-200/70'}`}>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-black text-slate-900">1-Year Tenure</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Maintain your spot on the official Boardly campus directory for a full 365 days with 10 signups.
            </p>
            <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${crewInfo.tenureGoalAchieved ? 'text-indigo-700 bg-indigo-100' : 'text-slate-500 bg-slate-200'}`}>
              {crewInfo.tenureGoalAchieved ? '✓ Unlocked' : 'Goal: 10 Signups'}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border space-y-2 ${crewInfo.isPaidInternshipEligible ? 'bg-amber-50/70 border-amber-200/80' : 'bg-slate-50 border-slate-200/70'}`}>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-black text-slate-900">Paid Internship</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Remote paid student ambassadorship stipend with SHS Virtual Academy for top 25 performers.
            </p>
            <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${crewInfo.isPaidInternshipEligible ? 'text-amber-800 bg-amber-100' : 'text-slate-500 bg-slate-200'}`}>
              {crewInfo.isPaidInternshipEligible ? '✓ Eligible' : `Goal: ${CREW_INTERNSHIP_SIGNUP_TARGET} Signups`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              4
            </div>
            <h4 className="font-black text-slate-900">Letter of Rec</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Official Letter of Recommendation signed by Academic Directors for college applications.
            </p>
            <span className="inline-block text-[10px] font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              Goal: 50 Signups
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewDashboardPage;

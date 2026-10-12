import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowRight,
  Zap,
  GraduationCap,
  TrendingUp,
  Flame,
  AlertCircle,
  Clock,
  ChevronRight,
  Calendar,
  Sparkles,
  Star,
  CheckCircle,
  Lock,
  Copy,
  Check,
  Share2,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUsage } from '../../context/UsageContext';
import { StoredTestAttempt, fetchCaptainRecord, fetchReferralCount, CaptainRecord, onSnapshot, doc, db } from '../../lib/firebase';
import { getCrewStatusInfo } from '../../lib/crewLogic';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { UNIVERSITIES, findUniversity, University } from '../../data/universities';
import { getTimeUntilKarachiMidnight, getPlanConfig, PlanType } from '../../data/planLimits';
import { SparkLineTrendChart } from '../ui/Charts';
import { Badge } from '../ui/Badge';
import { UsageMeter } from '../ui/UsageMeter';
import { ErrorBoundary } from '../ErrorBoundary';

interface StudentOverviewTabProps {
  onStartSprint: (subject: string) => void;
  onGoToPractice: () => void;
  onGoToEvents?: () => void;
  onWriteReview?: () => void;
  onReviewAttempt?: (attempt: StoredTestAttempt) => void;
  onSelectUniversity?: () => void;
  onUpgrade?: () => void;
  attempts: StoredTestAttempt[];
}

export const StudentOverviewTab: React.FC<StudentOverviewTabProps> = ({
  onStartSprint,
  onGoToPractice,
  onGoToEvents,
  onWriteReview,
  onReviewAttempt,
  onSelectUniversity,
  onUpgrade,
  attempts,
}) => {
  const auth = useAuth();
  const profile = auth?.profile;
  const isAdmin = Boolean(auth?.isAdmin || profile?.role === 'admin' || (Array.isArray(profile?.roles) && profile.roles.includes('admin')));

  const firstName = profile?.name?.trim().split(' ')[0] || 'Student';

  // Ambassador Verification & Live Referral Stats (Live Firestore sync)
  const [captainRecord, setCaptainRecord] = useState<CaptainRecord | null>(null);
  const [liveReferralCount, setLiveReferralCount] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Listen live to captains/{uid}
  useEffect(() => {
    if (!profile?.uid || isAdmin) {
      setCaptainRecord(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'captains', profile.uid), (snap) => {
      if (snap.exists()) {
        setCaptainRecord(snap.data() as CaptainRecord);
      } else {
        setCaptainRecord(null);
      }
    });
    return () => unsub();
  }, [profile?.uid, isAdmin]);

  const isAmbassador = Boolean(
    !isAdmin &&
    profile?.crewStatus !== 'revoked' &&
    captainRecord?.status !== 'revoked' &&
    (captainRecord?.status === 'approved' || (profile?.isCrewMember && profile?.crewStatus === 'approved'))
  );

  const crewInfo = useMemo(() => {
    return getCrewStatusInfo(profile);
  }, [profile]);

  const activeReferralCode = profile?.crewReferralCode || captainRecord?.referralCode || crewInfo.referralCode;

  useEffect(() => {
    if (activeReferralCode) {
      fetchReferralCount(activeReferralCode).then((cnt) => {
        setLiveReferralCount(cnt);
      }).catch(console.warn);
    }
  }, [activeReferralCode]);

  const effectiveSignups = typeof liveReferralCount === 'number'
    ? Math.max(liveReferralCount, crewInfo.referralsCount)
    : crewInfo.referralsCount;

  // Read saved profile fields: targetExam, targetUniversity, examDate
  const chosenUniKey =
    profile?.targetUniversity ||
    profile?.targetUniversityId ||
    profile?.university ||
    profile?.dream_university ||
    profile?.target_university;

  const targetUni: University | undefined = chosenUniKey ? findUniversity(chosenUniKey) : undefined;
  const targetExamName = profile?.targetExam || profile?.testTrack || targetUni?.testName || 'Entrance Test';

  const examDateStr = profile?.examDate || profile?.targetExamDate;
  const daysLeft = useMemo(() => {
    if (!examDateStr) {
      return typeof profile?.targetExamDaysLeft === 'number' ? profile.targetExamDaysLeft : null;
    }
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const target = new Date(examDateStr);
      if (isNaN(target.getTime())) {
        return typeof profile?.targetExamDaysLeft === 'number' ? profile.targetExamDaysLeft : null;
      }
      const diffTime = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return typeof profile?.targetExamDaysLeft === 'number' ? profile.targetExamDaysLeft : null;
    }
  }, [examDateStr, profile?.targetExamDaysLeft]);

  const {
    loading: usageLoading,
    isUnlimited,
    testsLimit,
    testsUsed,
    testsLeft,
    canStartTest,
  } = useUsage();

  // Real streak directly from Firestore user doc
  const streak = typeof profile?.streak === 'number'
    ? profile.streak
    : (typeof profile?.streakDays === 'number' ? profile.streakDays : 0);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  // Use actual Firestore user testHistory array (or loaded attempts)
  const testHistoryList: StoredTestAttempt[] = useMemo(() => {
    if (Array.isArray(profile?.testHistory) && profile.testHistory.length > 0) {
      return profile.testHistory;
    }
    return attempts || [];
  }, [profile?.testHistory, attempts]);

  const hasTestHistory = testHistoryList.length > 0;

  // Real Score Accuracy Trend from actual testHistory (oldest to newest)
  const trendData = useMemo(() => {
    if (!hasTestHistory) return [];
    return [...testHistoryList]
      .reverse()
      .slice(-7)
      .map((a, idx) => ({
        label: `Test ${idx + 1}`,
        value: Math.round(a.percentage || 0),
      }));
  }, [hasTestHistory, testHistoryList]);

  // Real Target Weak Areas computed dynamically from user's test history
  const calculatedWeakAreas = useMemo(() => {
    if (!hasTestHistory) return [];

    const statsMap: Record<string, { correct: number; total: number }> = {};

    testHistoryList.forEach((att) => {
      if (att.topicBreakdown && Object.keys(att.topicBreakdown).length > 0) {
        Object.entries(att.topicBreakdown).forEach(([topic, stats]) => {
          if (!statsMap[topic]) {
            statsMap[topic] = { correct: 0, total: 0 };
          }
          statsMap[topic].correct += stats.correct;
          statsMap[topic].total += stats.total;
        });
      } else if (att.subject) {
        const sub = att.subject;
        if (!statsMap[sub]) {
          statsMap[sub] = { correct: 0, total: 0 };
        }
        statsMap[sub].correct += att.correctCount || 0;
        statsMap[sub].total += att.totalQuestions || 0;
      }
    });

    const results = Object.entries(statsMap)
      .filter(([_, stats]) => stats.total > 0)
      .map(([subject, stats]) => {
        const acc = Math.round((stats.correct / stats.total) * 100);
        const priority = acc < 50 ? 'High' : acc < 70 ? 'Medium' : 'Low';
        return {
          subject,
          accuracy: `${acc}%`,
          accuracyNum: acc,
          priority,
        };
      })
      .sort((a, b) => a.accuracyNum - b.accuracyNum)
      .slice(0, 4);

    return results;
  }, [hasTestHistory, testHistoryList]);

  // Dynamic sprint recommendation: use identified weak area or target weak subject
  const sprintSubject = useMemo(() => {
    if (calculatedWeakAreas.length > 0) {
      return calculatedWeakAreas[0].subject;
    }
    if (profile?.weakSubjects?.[0] && profile.weakSubjects[0] !== 'Not sure, help me find out') {
      return profile.weakSubjects[0];
    }
    return 'Advance Maths';
  }, [calculatedWeakAreas, profile?.weakSubjects]);

  const campusInstitution = profile?.crewInstitution || captainRecord?.institution || targetUni?.shortName || 'Campus';

  return (
    <div className="space-y-6 pb-20">
      {/* ========================================================= */}
      {/* Requirement 1: CREW AMBASSADOR CARD AT THE TOP OF OVERVIEW */}
      {/* (Only for users with an approved captains/{uid} document) */}
      {/* ========================================================= */}
      {isAmbassador && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1b3e] via-indigo-950 to-violet-950 text-white p-5 sm:p-7 shadow-xl shadow-indigo-950/15 border border-indigo-500/20 animate-fade-in">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4 sm:space-y-5">
            {/* Header row with badge & Open Crew Dashboard CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-200 uppercase tracking-wider">
                      Boardly Crew Ambassador
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Campus Ambassador · {campusInstitution}
                  </h2>
                </div>
              </div>

              {/* Open Crew Dashboard Button */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.pushState({}, '', '/crew-dashboard');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-950/30 transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-400/30 shrink-0"
              >
                <span>Open Crew Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stats Row: Referral Code, Total Signups, Tenure Progress (x/10), Premium Days Left */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
              {/* 1. Referral Code */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Referral Code
                </span>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="font-mono font-black text-sm text-amber-300 tracking-wider truncate">
                    {activeReferralCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeReferralCode) {
                        navigator.clipboard.writeText(activeReferralCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }
                    }}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 transition-colors cursor-pointer shrink-0"
                    title="Copy Referral Code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 2. Total Signups */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Total Signups
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-black text-white">
                    {effectiveSignups}
                  </span>
                  <span className="text-[11px] text-indigo-300 font-semibold">peers registered</span>
                </div>
              </div>

              {/* 3. Tenure Progress (x/10) */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                    Tenure Progress
                  </span>
                  <span className="text-xs font-black text-amber-300">
                    {effectiveSignups}/10
                  </span>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((effectiveSignups / 10) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-indigo-200 mt-1 block">
                    {effectiveSignups >= 10 ? '🎉 1-Year Tenure Secured' : `${Math.max(0, 10 - effectiveSignups)} more for 1-yr tenure`}
                  </span>
                </div>
              </div>

              {/* 4. Premium Days Left */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  Premium Access
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-black text-amber-300">
                    {crewInfo.daysRemainingInTrial}
                  </span>
                  <span className="text-[11px] text-indigo-200 font-semibold">days remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date & Greeting Header (Requirement 3: Good afternoon, Hashir · Campus Ambassador (LUMS)) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {todayFormatted}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {isAmbassador ? (
              <span>
                {greeting}, {firstName} · <span className="text-indigo-600 font-black">Campus Ambassador ({campusInstitution})</span>
              </span>
            ) : (
              <span>{greeting}, {firstName}</span>
            )}
          </h1>
          {targetUni ? (
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {daysLeft !== null ? `${daysLeft} days until your ` : 'Preparing for your '}
              <span className="font-extrabold text-slate-900">{targetUni.shortName}</span> entrance test. Stay consistent!
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-600">No target university chosen.</span>
              <button
                type="button"
                onClick={onSelectUniversity || onGoToPractice}
                className="px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black transition-all border border-indigo-200/80 cursor-pointer shadow-xs active:scale-95"
              >
                Choose your target university
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Real streak counter from Firestore */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs font-bold text-amber-800">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span>{streak} Day Streak</span>
          </div>
          {targetUni ? (
            <button
              type="button"
              onClick={onSelectUniversity}
              className="cursor-pointer transition-transform hover:scale-105"
              title={`Target: ${targetUni.fullName}. Click to change.`}
            >
              <UniversityLogoBadge university={targetUni} size="sm" loading="eager" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSelectUniversity || onGoToPractice}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 cursor-pointer transition-all border border-slate-200"
              title="Choose your target university"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Requirement 3: AMBASSADOR-ONLY WEEKLY MISSIONS STRIP */}
      {/* ========================================================= */}
      {isAmbassador && (
        <div className="p-4 sm:p-5 rounded-3xl bg-indigo-50/80 border border-indigo-200/80 shadow-xs animate-fade-in space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#0d1b3e] uppercase tracking-wide">
                  Weekly Ambassador Missions
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Complete weekly activities to level up your ambassadorship and earn tenure points
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://boardly.cfd';
                const shareUrl = `${appOrigin}/signup?ref=${encodeURIComponent(activeReferralCode)}`;
                const text = encodeURIComponent(
                  `Hey! Prepare for your Board exams and entry tests with Boardly & SHS Virtual Academy. Sign up using my ambassador code ${activeReferralCode} to practice diagnostic tests and timed sprints: ${shareUrl}`
                );
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Share on WhatsApp</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            {/* Mission 1 */}
            <div className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Mission 1</span>
                <h4 className="text-xs font-bold text-[#0d1b3e] truncate">Share Referral Code</h4>
                <p className="text-[11px] text-slate-500">Post in your batch WhatsApp or study group</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${effectiveSignups > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {effectiveSignups > 0 ? 'Active' : 'Pending'}
              </span>
            </div>

            {/* Mission 2 */}
            <div className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Mission 2</span>
                <h4 className="text-xs font-bold text-[#0d1b3e] truncate">Tenure Goal: 10 Signups</h4>
                <p className="text-[11px] text-slate-500">Progress: {effectiveSignups}/10 peers joined</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${effectiveSignups >= 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {effectiveSignups >= 10 ? 'Completed' : `${Math.max(0, 10 - effectiveSignups)} left`}
              </span>
            </div>

            {/* Mission 3 */}
            <div className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Mission 3</span>
                <h4 className="text-xs font-bold text-[#0d1b3e] truncate">Paid Internship (25 Signups)</h4>
                <p className="text-[11px] text-slate-500">Progress: {effectiveSignups}/25 signups</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${effectiveSignups >= 25 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {effectiveSignups >= 25 ? 'Unlocked' : `${Math.max(0, 25 - effectiveSignups)} left`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Card: Start Here Sprint */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/15 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all duration-200 animate-fade-in-up">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Recommended Drill</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Timed sprint in {sprintSubject}
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-lg">
              {targetUni
                ? `30 rapid questions in 10 minutes to benchmark speed and formula accuracy for ${targetUni.shortName}.`
                : '30 rapid questions in 10 minutes to benchmark your speed, formula recall, and accuracy.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {usageLoading ? (
                <button
                  type="button"
                  disabled={true}
                  className="py-3 px-6 rounded-2xl bg-white/40 text-indigo-950 font-black text-xs transition-all cursor-not-allowed flex items-center gap-2"
                >
                  <span>Checking today's limit…</span>
                </button>
              ) : !canStartTest() ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <button
                    type="button"
                    disabled={true}
                    className="py-3 px-4 rounded-2xl bg-white/20 text-white font-bold text-xs cursor-not-allowed flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-white shrink-0" />
                    <span>You have used today's free limit. Resets at midnight (PKT)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onUpgrade || onGoToPractice}
                    className="py-3 px-5 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95 font-black text-xs shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Upgrade</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartSprint(sprintSubject)}
                  className="py-3 px-6 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95 font-black text-xs shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2 group"
                >
                  <span>Start Sprint Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              {targetUni ? (
                <button
                  type="button"
                  onClick={onGoToPractice}
                  className="py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  All Subjects
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSelectUniversity || onGoToPractice}
                  className="py-3 px-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Choose your target university</span>
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-4 hidden md:flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            {targetUni ? (
              <>
                <UniversityLogoBadge university={targetUni} size="lg" loading="eager" />
                <span className="font-extrabold text-sm text-white mt-2">{targetUni.shortName}</span>
                <span className="text-[11px] text-indigo-200">{targetUni.testName || targetExamName}</span>
              </>
            ) : (
              <button
                type="button"
                onClick={onSelectUniversity || onGoToPractice}
                className="flex flex-col items-center justify-center cursor-pointer group p-2 rounded-2xl hover:bg-white/5 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="font-black text-xs text-white">Choose your target university</span>
                <span className="text-[10px] text-indigo-200 mt-0.5">Click to select university</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Allowance Rings & Midnight Countdown - Unified Usage Meter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up delay-80">
        <UsageMeter
          type="tests"
          showRefillCountdown={true}
          showUpgradeButton={true}
          onUpgrade={onUpgrade || onGoToPractice}
        />
        <UsageMeter
          type="aiChats"
          showRefillCountdown={true}
          showUpgradeButton={true}
          onUpgrade={onUpgrade || onGoToPractice}
        />
      </div>

      {/* Analytics Trend & Weak Topics - Driven by Real Firestore testHistory or Clean Empty State */}
      {!hasTestHistory ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 text-center space-y-4 animate-fade-in-up delay-120">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Take your first test to see your analytics
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Your score accuracy trends, chapter masteries, and target weak areas will be calculated automatically once you complete your first practice test or timed sprint.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToPractice}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
            >
              <span>Start Practice Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up delay-120">
          {/* Score Trend Chart */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Score Accuracy Trend
                </h3>
                <p className="text-xs text-slate-400">
                  Progression across your recent {trendData.length} test attempt{trendData.length > 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="indigo">Live Analytics</Badge>
            </div>
            <ErrorBoundary
              fallback={
                <div className="h-[190px] flex items-center justify-center p-4 rounded-2xl bg-slate-50 text-xs text-slate-400">
                  Analytics trend unavailable
                </div>
              }
            >
              <SparkLineTrendChart data={trendData} color="#4F46E5" height={190} />
            </ErrorBoundary>
          </div>

          {/* Weak Topics to Drill */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Target Weak Areas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chapters and subjects where extra practice yields maximum aggregate gain
              </p>

              <div className="mt-4 space-y-2.5">
                {calculatedWeakAreas.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium text-center">
                    Great job! All your tested subjects are performing at 75%+ accuracy. Keep drilling to maintain peak confidence.
                  </div>
                ) : (
                  calculatedWeakAreas.map((topic, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800">
                          {topic.subject}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Accuracy: {topic.accuracy} · Priority: {topic.priority}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartSprint(topic.subject)}
                        className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Drill
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review CTA Card (for students with at least 1 attempt) */}
      {hasTestHistory && onWriteReview && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent border border-violet-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900">
                Share your Boardly study experience
              </h4>
              <p className="text-xs text-slate-500">
                You've completed {testHistoryList.length} test{testHistoryList.length > 1 ? 's' : ''}! Write a review to help fellow aspirants.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onWriteReview}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            Write a Review
          </button>
        </div>
      )}
    </div>
  );
};

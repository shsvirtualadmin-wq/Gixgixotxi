import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  History, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  ChevronRight,
  Target,
  AlertCircle,
  FolderOpen,
  BarChart2,
  Flame,
  Trophy,
  Award,
  Check,
  Crown
} from 'lucide-react';
import { User, StudentProfile, fetchStudentWeaknessProfile, StudentWeaknessProfileData, evaluateStudentAccess, isUserProOrPaid, downgradeExpiredProStudent, isAdminEmail, isStudentRegistrationCompleted } from '../lib/supabase';
import { HistoryItem } from '../types';
import { InstitutionBadge, renderTargetUniversityBadge } from './InstitutionBadge';
import { TargetUniversityModal } from './TargetUniversityModal';
import { UserAvatar } from './UserAvatar';
import { AnimatedCounter } from './AnimatedCounter';
import { ResourcesHub } from './ResourcesHub';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { resolveStudentTrackDetails } from '../data/portalMasterTracks';

/**
 * Accuracy threshold percentage cutoff for identifying weak subject/chapter areas.
 * Default cutoff is 50%. Adjust this constant to alter strictness (e.g., 60% or 40%).
 */
export const WEAK_ACCURACY_THRESHOLD = 50;

/**
 * Cumulative XP thresholds to reach each level (1-indexed).
 * Level 1 starts at 0 XP.
 * Level 1 -> 2 requirement: 100 XP (Cumulative threshold = 100 XP)
 * Level 2 -> 3 requirement: 500 XP (Cumulative threshold = 600 XP)
 * Level 3 -> 4 requirement: 1,000 XP (Cumulative threshold = 1,600 XP)
 * Level 4 -> 5 requirement: 1,800 XP (Cumulative threshold = 3,400 XP)
 * Level 5 -> 6 requirement: 2,800 XP (Cumulative threshold = 6,200 XP)
 * Level 6 -> 7 requirement: 4,000 XP (Cumulative threshold = 10,200 XP)
 * Level 7 -> 8 requirement: 5,500 XP (Cumulative threshold = 15,700 XP)
 * Level 8 -> 9 requirement: 7,500 XP (Cumulative threshold = 23,200 XP)
 * Level 9 -> 10 requirement: 10,000 XP (Cumulative threshold = 33,200 XP)
 * Strictly increasing at each level!
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  const thresholds = [0, 0, 100, 600, 1600, 3400, 6200, 10200, 15700, 23200, 33200];
  if (level < thresholds.length) {
    return thresholds[level];
  }
  let xp = thresholds[thresholds.length - 1];
  let req = 10000;
  for (let l = thresholds.length; l <= level; l++) {
    req += 2500;
    xp += req;
  }
  return xp;
}

export function calculateLevelAndProgress(currentXP: number) {
  let level = 1;
  while (currentXP >= getCumulativeXpForLevel(level + 1)) {
    level++;
  }
  const xpForCurrentLevel = getCumulativeXpForLevel(level);
  const xpForNextLevel = getCumulativeXpForLevel(level + 1);
  const xpNeededInCurrentLevel = xpForNextLevel - xpForCurrentLevel;
  const xpEarnedInCurrentLevel = currentXP - xpForCurrentLevel;
  const progressToNextLevel = Math.min(
    100,
    Math.max(0, (xpEarnedInCurrentLevel / xpNeededInCurrentLevel) * 100)
  );

  return {
    currentLevel: level,
    xpForCurrentLevel,
    xpForNextLevel,
    progressToNextLevel,
  };
}

export interface WeakAreaItem {
  subject: string;
  topic?: string;
  displayName: string;
  total: number;
  correct: number;
  accuracy: number;
  message: string;
}

interface StudentHomeDashboardProps {
  currentUser: User;
  userProfile: StudentProfile | null;
  history: HistoryItem[];
  onStartPracticeTest: () => void;
  onNavigateDashboard?: () => void;
  onPracticeWeakTopic?: (subject: string, topic?: string) => void;
  onSelectMdcat?: () => void;
  onSelectTcat?: () => void;
  onOpenLmsPortal: () => void;
  onOpenHistory: () => void;
  onOpenCommunity?: () => void;
  onUpdateProfile?: (updatedProfile: StudentProfile) => void;
  isAdmin?: boolean;
  isTestLimitReached?: boolean;
  monthlyTestCount?: number;
  onUpgradeClick?: () => void;
}

// Parse raw subject/chapter string into clean subject and topic
function parseSubjectAndTopic(rawSubject?: string | null, rawChapter?: string | null): { subject: string; topic?: string } {
  const subjStr = String(rawSubject || 'General').trim();
  const chapStr = rawChapter ? String(rawChapter).trim() : undefined;

  if (chapStr && chapStr !== subjStr && chapStr !== 'General Concepts' && chapStr !== 'General') {
    if (chapStr.includes(' — ')) {
      const parts = chapStr.split(' — ');
      return { subject: parts[0].trim(), topic: parts.slice(1).join(' — ').trim() };
    }
    return { subject: subjStr, topic: chapStr };
  }

  const parenMatch = subjStr.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    return { subject: parenMatch[1].trim(), topic: parenMatch[2].trim() };
  }

  if (subjStr.includes(' — ')) {
    const parts = subjStr.split(' — ');
    return { subject: parts[0].trim(), topic: parts.slice(1).join(' — ').trim() };
  }

  return { subject: subjStr };
}

export const StudentHomeDashboard: React.FC<StudentHomeDashboardProps> = React.memo(({
  currentUser,
  userProfile,
  history,
  onStartPracticeTest,
  onNavigateDashboard,
  onPracticeWeakTopic,
  onSelectMdcat,
  onSelectTcat,
  onOpenLmsPortal,
  onOpenHistory,
  onOpenCommunity,
  onUpdateProfile,
  isAdmin = false,
  isTestLimitReached = false,
  monthlyTestCount = 0,
  onUpgradeClick,
}) => {
  // 1. Detect if this account is an administrator / staff account (permanent, non-expiring access)
  const isEffectiveAdmin = Boolean(
    isAdmin ||
    isAdminEmail(currentUser?.email) ||
    isAdminEmail(userProfile?.email) ||
    userProfile?.role === 'admin' ||
    (userProfile as any)?.is_admin
  );

  const resolvedTrack = resolveStudentTrackDetails(userProfile);

  // Boardly is 100% free with unlimited access for all students
  const isProStudent = true;
  const isProActive = true;
  const countdownString = '';

  const [weaknessProfile, setWeaknessProfile] = useState<StudentWeaknessProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [showUniModal, setShowUniModal] = useState<boolean>(false);

  // Fetch logged-in student's weakness profile securely via API
  useEffect(() => {
    let isMounted = true;
    const effectiveId = currentUser?.id || userProfile?.id;
    const effectiveEmail = currentUser?.email || userProfile?.email;
    if (effectiveId || effectiveEmail) {
      setIsLoadingProfile(true);
      fetchStudentWeaknessProfile(effectiveId || effectiveEmail || '', undefined, effectiveEmail)
        .then((data) => {
          if (isMounted) {
            setWeaknessProfile(data);
            setIsLoadingProfile(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoadingProfile(false);
        });
    } else {
      setIsLoadingProfile(false);
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentUser?.email, userProfile?.id, userProfile?.email]);

  // Calculate subject/chapter accuracy map combining API profile and student history
  const weakAreas = React.useMemo(() => {
    const topicMap: Record<string, { subject: string; topic?: string; displayName: string; total: number; correct: number }> = {};

    // 1. Process API weakness profile
    if (weaknessProfile) {
      const breakdown = weaknessProfile.chapterBreakdown && weaknessProfile.chapterBreakdown.length > 0
        ? weaknessProfile.chapterBreakdown
        : weaknessProfile.weakestTopics || [];

      for (const item of breakdown) {
        const parsed = parseSubjectAndTopic(weaknessProfile.subject || item.chapter, item.chapter);
        const disp = parsed.topic ? `${parsed.subject} — ${parsed.topic}` : parsed.subject;
        const key = `${parsed.subject}::${parsed.topic || 'General'}`.toLowerCase();

        topicMap[key] = {
          subject: parsed.subject,
          topic: parsed.topic,
          displayName: disp,
          total: item.total,
          correct: item.correct,
        };
      }
    }

    // 2. Aggregate local student history items to ensure full coverage
    for (const item of history) {
      const parsed = parseSubjectAndTopic(item.subject);
      const disp = parsed.topic ? `${parsed.subject} — ${parsed.topic}` : parsed.subject;
      const key = `${parsed.subject}::${parsed.topic || 'General'}`.toLowerCase();

      if (!topicMap[key]) {
        topicMap[key] = {
          subject: parsed.subject,
          topic: parsed.topic,
          displayName: disp,
          total: item.total,
          correct: item.score,
        };
      } else {
        topicMap[key].total = Math.max(topicMap[key].total, item.total);
        topicMap[key].correct = Math.max(topicMap[key].correct, item.score);
      }
    }

    // 3. Compute accuracy % and filter topics below WEAK_ACCURACY_THRESHOLD (50%)
    const result: WeakAreaItem[] = [];
    for (const key of Object.keys(topicMap)) {
      const stats = topicMap[key];
      if (stats.total <= 0) continue;

      const accuracy = Math.round((stats.correct / stats.total) * 100);
      if (accuracy < WEAK_ACCURACY_THRESHOLD) {
        let message = 'Needs practice — lower accuracy detected';
        if (accuracy <= 25) {
          message = 'High priority — immediate practice recommended';
        } else if (accuracy <= 40) {
          message = 'Targeted practice needed to reach passing grade';
        } else {
          message = 'Close to target — extra review will help';
        }

        result.push({
          subject: stats.subject,
          topic: stats.topic,
          displayName: stats.displayName,
          total: stats.total,
          correct: stats.correct,
          accuracy,
          message,
        });
      }
    }

    // 4. Sort weak areas from LOWEST accuracy to HIGHEST accuracy
    result.sort((a, b) => {
      if (a.accuracy !== b.accuracy) {
        return a.accuracy - b.accuracy;
      }
      return b.total - a.total;
    });

    return result;
  }, [weaknessProfile, history]);

  // Determine student display name
  const rawName = 
    currentUser.user_metadata?.full_name || 
    currentUser.user_metadata?.name || 
    (userProfile as any)?.full_name || 
    userProfile?.name || 
    currentUser.email?.split('@')[0] || 
    'Student';

  // Capitalize name cleanly
  const studentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // Student locked class & stream format
  const gradeStr = userProfile?.grade;
  const streamStr = userProfile?.stream;
  const isRegistered = isStudentRegistrationCompleted(userProfile, isAdmin);

  const classStreamDisplay = gradeStr && streamStr
    ? `${gradeStr} — ${streamStr}`
    : gradeStr
      ? `${gradeStr}`
      : 'Course Registration Required';

  // Statistics calculation from history
  const getItemPct = (item: HistoryItem): number => {
    if (typeof item.percentage === 'number' && !isNaN(item.percentage) && item.percentage > 0) {
      return item.percentage;
    }
    const score = Number(item.score ?? 0);
    const total = Number(item.total ?? 0);
    if (total > 0) return Math.round((score / total) * 100);
    return typeof item.percentage === 'number' && !isNaN(item.percentage) ? item.percentage : 0;
  };

  const totalMcqsSolved = history.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const correctMcqsSolved = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const wrongMcqsSolved = history.reduce((acc, curr) => acc + Math.max(0, (curr.total || 0) - (curr.score || 0)), 0);
  const avgAccuracy = history.length
    ? Math.round(history.reduce((acc, curr) => acc + getItemPct(curr), 0) / history.length)
    : 0;
  const testsCompleted = history.length;

  // Gamification: XP & Levels
  // Rules: +4 XP per correct answer, -4 XP per wrong answer. Flat completion bonus removed. Floored at 0.
  const rawXP = (correctMcqsSolved * 4) - (wrongMcqsSolved * 4);
  const currentXP = Math.max(0, rawXP);

  const { currentLevel, xpForCurrentLevel, xpForNextLevel, progressToNextLevel } = calculateLevelAndProgress(currentXP);

  // Helper function to safely normalize any date representation into YYYY-MM-DD
  const parseDateToYMD = (dateStr?: string): string => {
    if (!dateStr) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // 1. Direct regex for YYYY-MM-DD (ISO format)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // 2. Direct regex for M/D/YYYY or D/M/YYYY
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const part1 = Number(slashMatch[1]);
      const part2 = Number(slashMatch[2]);
      const year = slashMatch[3];
      let month = part1;
      let day = part2;
      if (part1 > 12) {
        day = part1;
        month = part2;
      }
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // 3. Fallback to JS Date
    const dateObj = new Date(dateStr);
    if (!dateObj || isNaN(dateObj.getTime())) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate daily practice streak based on test history
  const dailyStreak = React.useMemo(() => {
    if (!history || history.length === 0) return 0;

    const uniqueDays = new Set<string>();
    history.forEach((item) => {
      const ymd = parseDateToYMD(item.dateStr);
      if (ymd) uniqueDays.add(ymd);
    });

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const today = new Date();
    const todayStr = formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    let currentCheck = new Date(today);
    if (!uniqueDays.has(todayStr)) {
      if (!uniqueDays.has(yesterdayStr)) {
        return 0;
      }
      currentCheck = yesterday;
    }

    let streak = 0;
    while (true) {
      const dayStr = formatDate(currentCheck);
      if (uniqueDays.has(dayStr)) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [history]);

  // Last 7 days status for weekly activity pills in streak card
  const last7DaysStatus = React.useMemo(() => {
    const days: { dayName: string; isActive: boolean; isToday: boolean }[] = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const uniqueDays = new Set<string>();

    history.forEach((item) => {
      const ymd = parseDateToYMD(item.dateStr);
      if (ymd) uniqueDays.add(ymd);
    });

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${day}`;

      days.push({
        dayName: dayLabels[d.getDay()],
        isActive: uniqueDays.has(dateKey),
        isToday: i === 0,
      });
    }
    return days;
  }, [history]);

  // Milestone logic for streak progress
  const streakMilestone = React.useMemo(() => {
    if (dailyStreak <= 0) return { target: 1, label: '1-Day Ignite', badge: '🌱' };
    if (dailyStreak < 3) return { target: 3, label: '3-Day Spark', badge: '⚡' };
    if (dailyStreak < 7) return { target: 7, label: '7-Day On Fire!', badge: '🔥' };
    if (dailyStreak < 14) return { target: 14, label: '14-Day Unstoppable', badge: '🚀' };
    if (dailyStreak < 30) return { target: 30, label: '30-Day Legend', badge: '👑' };
    return { target: 100, label: '100-Day Master', badge: '🏆' };
  }, [dailyStreak]);

  const streakProgressPct = Math.min(
    100,
    Math.round((dailyStreak / streakMilestone.target) * 100)
  );

  return (
    <section className="animate-ios-spring flex-1 flex flex-col gap-5 py-2">
      {/* Personalized Welcome Card */}
      <div className="bg-white  text-slate-900  rounded-3xl p-6 sm:p-7 border border-black/10  shadow-xl relative overflow-hidden flex flex-col gap-6 transition-colors">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F2B90C]/15  rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          {/* Single Status Label */}
          {isEffectiveAdmin ? (
            <div
              id="student-dashboard-status-label"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 shadow-xs whitespace-nowrap shrink-0"
              title="Staff / Admin Account — Permanent Unlimited Access (999+)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Admin — Unlimited (999+)</span>
            </div>
          ) : (
            <div
              id="student-dashboard-status-label"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full Access — Free Forever</span>
            </div>
          )}
        </div>

        {/* Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4 flex-1">
            <UserAvatar user={currentUser} profile={userProfile} size="lg" shape="square" className="shadow-md border-2 border-[#F2B90C]/40" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#D99A00]  uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Student Dashboard</span>
              </div>
              <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight truncate">
                Welcome back, {studentName}! 👋
              </h1>
              <p className="text-slate-600  text-xs sm:text-sm leading-relaxed font-normal">
                Track your board exam practice performance, review chapter accuracy, and practice targeted MCQs.
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Classes & Test Series Box */}
        {resolvedTrack.assignedClasses && resolvedTrack.assignedClasses.length > 0 && (
          <div className="bg-slate-50/80  border border-slate-200  rounded-2xl p-4 space-y-2 relative z-10">
            <div className="flex items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500  flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Assigned Classes & Active Test Series</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-0.5">
              {resolvedTrack.assignedClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-blue-500/10  border border-blue-500/30 text-blue-700  px-3 py-1.5 rounded-xl text-xs font-extrabold"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>{cls}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Buttons - Personalized to student's registered track */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10 pt-1">
          {resolvedTrack.isEntranceExam ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.medium);
                if (resolvedTrack.grade === 'MDCAT' && onSelectMdcat) {
                  onSelectMdcat();
                } else if (resolvedTrack.grade === 'TCAT' && onSelectTcat) {
                  onSelectTcat();
                } else {
                  onStartPracticeTest();
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-3.5 px-5 rounded-2xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer border border-blue-400/30"
            >
              <Sparkles className="w-4 h-4 text-white fill-white/20" />
              <span>{resolvedTrack.practiceButtonText}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.medium);
                onStartPracticeTest();
              }}
              className="w-full bg-[#F2B90C] hover:bg-[#E0A800] text-[#0A0A0A] font-extrabold py-3.5 px-5 rounded-2xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#0A0A0A] fill-[#0A0A0A]" />
              <span>
                {resolvedTrack.practiceButtonText}
              </span>
            </button>
          )}
        </div>

        {/* Target University Band - Displays only student's selected dream university */}
        <div className="pt-3 border-t border-slate-200  flex flex-wrap items-center gap-2 text-xs relative z-10">
          <span className="font-bold text-slate-500  text-[11px] uppercase tracking-wider">
            Target University:
          </span>
          {renderTargetUniversityBadge(
            resolvedTrack.targetUniversity || userProfile?.dream_university || userProfile?.target_university,
            'sm',
            () => setShowUniModal(true)
          )}
        </div>
      </div>

      {/* NEW SECTION: Areas to Improve / Focus Areas */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[#0A0A0A] flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-500" />
            <span>Areas to Improve &amp; Weakness Detection</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
            Cutoff: &lt;{WEAK_ACCURACY_THRESHOLD}% Accuracy
          </span>
        </div>

        {isLoadingProfile ? null : weakAreas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weakAreas.map((area, idx) => (
              <div
                key={`${area.subject}-${area.topic || idx}`}
                className="bg-white border border-rose-200 hover:border-rose-400 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3 transition-all group relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      {area.subject}
                    </span>
                    <span className="text-xs font-black text-rose-600 font-['Space_Grotesk'] bg-rose-100 border border-rose-300/40 px-2.5 py-0.5 rounded-full">
                      {area.accuracy}% accuracy
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-rose-600 transition-colors leading-snug">
                      {area.displayName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {area.correct}/{area.total} attempted correct
                    </p>
                  </div>

                  <p className="text-[11px] italic font-medium text-rose-600/90 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{area.message}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onPracticeWeakTopic && onPracticeWeakTopic(area.subject, area.topic)}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer mt-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Retry This Subject</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Positive empty state when no weak areas detected below threshold */
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3.5 text-emerald-900 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-xs sm:text-sm">
                Great job! No weak areas detected — keep up the consistent practice.
              </p>
              <p className="text-[11px] text-emerald-700">
                All attempted subjects and chapters are currently performing above the {WEAK_ACCURACY_THRESHOLD}% accuracy threshold.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* RESOURCES HUB (Past Papers & MCQs Drills with R2 Cloud Storage) */}
      <ResourcesHub
        currentUser={currentUser}
        userProfile={userProfile}
        isAdmin={isAdmin}
      />

      {/* STATIC PRACTICE STREAK CARD */}
      <div id="streak-section-card" className="w-full">
        <div
          className={`bg-white border rounded-3xl p-5 sm:p-7 shadow-sm space-y-5 relative overflow-hidden ${
            dailyStreak > 0 ? 'border-orange-500/30' : 'border-slate-200'
          }`}
        >
          {/* Static Soft Background Ambient Glow */}
          <div
            className={`absolute -top-12 -right-12 w-64 h-64 rounded-full pointer-events-none blur-3xl ${
              dailyStreak > 0
                ? 'bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-red-500/5'
                : 'bg-slate-100'
            }`}
          />

          {/* Header Row: Flame Icon + Counter + Status Badge */}
          {(() => {
            const isTodayActive = last7DaysStatus.find((d) => d.isToday)?.isActive || false;
            return (
              <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  {/* Static Flame Icon Container */}
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      dailyStreak > 0
                        ? 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    <Flame
                      className={`w-7 h-7 sm:w-8 sm:h-8 ${
                        dailyStreak > 0
                          ? 'fill-amber-100 text-white'
                          : 'text-slate-400 opacity-60'
                      }`}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] sm:text-xs font-black text-orange-600 uppercase tracking-wider flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        PRACTICE STREAK
                      </span>
                      {dailyStreak > 0 && (
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-orange-200/80">
                          {streakMilestone.badge} {streakMilestone.label}
                        </span>
                      )}
                    </div>

                    <h4 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-black text-slate-900 leading-tight flex items-center gap-2">
                      {dailyStreak > 0 ? (
                        <>
                          <span className="text-orange-600 font-extrabold">
                            {dailyStreak}
                          </span>
                          <span>Day Practice Streak!</span>
                        </>
                      ) : (
                        <span className="text-slate-800">Start Your Daily Streak</span>
                      )}
                    </h4>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {dailyStreak === 0
                        ? 'Complete at least 1 practice test today to ignite your streak!'
                        : isTodayActive
                        ? '🔥 Streak active today! Excellent consistency.'
                        : '⚡ Take a test today to keep your streak active!'}
                    </p>
                  </div>
                </div>

                {/* Static Status Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {isTodayActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Active Today</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-700 border border-amber-500/30 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Practice Needed</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Static Milestone Progress Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Next Milestone Goal: {streakMilestone.label}</span>
              </span>
              <span className="text-orange-600 font-black">
                {dailyStreak} / {streakMilestone.target} Days ({streakProgressPct}%)
              </span>
            </div>

            <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden relative p-0.5">
              <div
                style={{ width: `${streakProgressPct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* 7-Day Static Weekly Activity Grid */}
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <BarChart2 className="w-3.5 h-3.5 text-orange-500" />
                <span>Last 7 Days Practice Tracker</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {last7DaysStatus.filter((d) => d.isActive).length} / 7 Days Completed
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {last7DaysStatus.map((day, idx) => (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center select-none ${
                    day.isToday
                      ? day.isActive
                        ? 'bg-gradient-to-b from-orange-500/20 to-amber-500/10 border-orange-500 text-orange-700 font-black shadow-xs'
                        : 'bg-slate-100 border-amber-400 text-slate-800 font-bold'
                      : day.isActive
                      ? 'bg-orange-500/10 border-orange-300 text-orange-700 font-bold'
                      : 'bg-slate-50/80 border-slate-200/80 text-slate-400 font-medium'
                  }`}
                >
                  {/* Day Label */}
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 font-black">
                    {day.dayName}
                  </span>

                  {/* Day Status Icon */}
                  <div className="flex items-center justify-center h-6 w-6 relative">
                    {day.isActive ? (
                      <Flame className="w-5 h-5 fill-orange-500 text-orange-500 filter drop-shadow-xs" />
                    ) : day.isToday ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Today Indicator Tag */}
                  {day.isToday && (
                    <span className="text-[8px] font-black uppercase tracking-tight text-orange-600 mt-1">
                      Today
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Call to Action */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Consistency boosts exam accuracy by up to 35%!</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(HAPTIC_PATTERNS.medium);
                onStartPracticeTest();
              }}
              className="text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 hover:underline cursor-pointer ml-auto"
            >
              <span>Start Quick Practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <TargetUniversityModal
        isOpen={showUniModal}
        onClose={() => setShowUniModal(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onUniversityUpdated={(updated) => {
          if (onUpdateProfile) {
            onUpdateProfile(updated);
          }
        }}
      />
    </section>
  );
});


import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PathType,
  BoardClass,
  DashboardCategory,
  Question,
  TestConfig,
  UserAnswer,
  TestResult,
  HistoryItem,
  QuestionDifficulty,
  TestMode
} from './types';
import {
  getSeenStemsForStudent,
  recordQuestionsAsSeen,
  selectPrioritizedQuestions,
  syncSeenQuestionsWithServer,
} from './lib/seenQuestionsTracker';
import { checkQuestionTopicRelevance } from './utils/topicValidator';
import { shuffleQuestionOptions, normalizeQuestionStem, deduplicateQuestions, isDuplicateQuestion } from './lib/shuffle';
import { getSubjectsForClassAndGroup } from './data/categories';
import { mapSubject } from './utils/subjectMapper';
import {
  getCategoryFromClassAndGroup,
  getCategoryFromProfile,
  getClassAndGroupFromCategory,
  isCategoryAccessAllowed,
} from './utils/categoryHelpers';
import { resolveStudentTrackDetails } from './data/portalMasterTracks';

import { MainHeader } from './components/MainHeader';
import { HeaderLogo } from './components/HeaderLogo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntroScreen } from './components/IntroScreen';
import { StudentHomeDashboard } from './components/StudentHomeDashboard';
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';
import { lazyWithRetry } from './lib/lazyWithRetry';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { ModalProvider, useModals } from './context/ModalContext';
import { AuthProvider } from './context/AuthContext';
import { BoardlyAppRouter } from './components/BoardlyAppRouter';
import { GlobalModals } from './components/GlobalModals';
import { LeaveConfirmationModal } from './components/LeaveConfirmationModal';
import { setPageMeta, DEFAULT_PAGE_META } from './utils/seo';
import type { MCQContext } from './types';

// Code-split heavy secondary screens with retry and self-healing reload on chunk update
const GradesFlowScreen = lazyWithRetry(() => import('./components/GradesFlowScreen').then(m => ({ default: m.GradesFlowScreen })), 'GradesFlow');
const ClassGroupScreen = lazyWithRetry(() => import('./components/ClassGroupScreen').then(m => ({ default: m.ClassGroupScreen })), 'ClassGroup');
const SubjectScreen = lazyWithRetry(() => import('./components/SubjectScreen').then(m => ({ default: m.SubjectScreen })), 'Subject');
const DurationScreen = lazyWithRetry(() => import('./components/DurationScreen').then(m => ({ default: m.DurationScreen })), 'Duration');
const LmsAuthScreen = lazyWithRetry(() => import('./components/LmsAuthScreen').then(m => ({ default: m.LmsAuthScreen })), 'LmsAuth');
const AdminDashboardScreen = lazyWithRetry(() => import('./components/AdminDashboardScreen').then(m => ({ default: m.AdminDashboardScreen })), 'AdminDashboard');
const ClassStreamDashboard = lazyWithRetry(() => import('./components/ClassStreamDashboard').then(m => ({ default: m.ClassStreamDashboard })), 'ClassStream');
const TestScreen = lazyWithRetry(() => import('./components/TestScreen').then(m => ({ default: m.TestScreen })), 'TestScreen');
const ResultsScreen = lazyWithRetry(() => import('./components/ResultsScreen').then(m => ({ default: m.ResultsScreen })), 'ResultsScreen');
const StudentProfileView = lazyWithRetry(() => import('./components/StudentProfileView').then(m => ({ default: m.StudentProfileView })), 'StudentProfileView');
import { PromoCelebrationModal, PromoModalMode } from './components/PromoCelebrationModal';
import { configValidation } from './lib/firebase';
import {
  extractPromoCodeFromUrl,
  storePendingPromoCode,
  getStoredPendingPromoCode,
  clearPendingPromoCode,
  claimPromoCode,
  validatePromoCode,
} from './lib/promoCode';

import { supabase, isSupabaseConfigured, apiFetch, safeJsonResponse, syncUserProfile, saveStudentRegistration, submitPaymentProofApi, saveTestToSupabase, fetchUserTestHistoryFromSupabase, clearUserTestHistoryInSupabase, fetchStudentProfileFromSupabase, fetchStudentMcqUsage, clearProfileCache, clearAllClientAuthAndSessionData, checkUserExistsInDatabase, isStudentExistingBeforeRule, isAdminEmail, verifyEmailTokenHash, sanitizeStudentForDb, withTimeout, User, StudentProfile, evaluateStudentAccess, downgradeExpiredProStudent, parseAssignedTrack } from './lib/supabase';
import { App as CapacitorApp } from '@capacitor/app';
import { ShieldCheck, WifiOff, AlertTriangle, Lock, ShieldAlert, GraduationCap, Sparkles, ArrowRight, RefreshCw, X, LogOut } from 'lucide-react';
import { cacheGeneratedQuestions, getCachedQuestions, saveHistoryOffline, loadHistoryOffline, clearHistoryOffline } from './lib/offlineCache';
import { BrandedLoadingSpinner } from './components/BrandedLoadingSpinner';
import { BoardlyMarketingApp } from './components/marketing/BoardlyMarketingApp';

export type ScreenType =
  | 'intro'
  | 'marketing'
  | 'plan_selection'
  | 'pricing'
  | 'payment_required'
  | 'grades_flow'
  | 'group'
  | 'dashboard'
  | 'subjects'
  | 'stats'
  | 'subject'
  | 'duration'
  | 'auth'
  | 'test'
  | 'results'
  | 'admin'
  | 'profile'
  | 'checkout';

export const VALID_SCREENS: ScreenType[] = [
  'dashboard',
  'intro',
  'marketing',
  'profile',
  'admin',
  'plan_selection',
  'pricing',
  'payment_required',
  'grades_flow',
  'group',
  'subjects',
  'stats',
  'subject',
  'duration',
  'auth',
  'test',
  'results',
  'checkout',
];

export function checkIsStudentProOrPaid(
  _profile?: StudentProfile | null,
  _isAdmin?: boolean
): boolean {
  return true;
}

export { isTrackAllowedForUser } from './lib/supabase';

const getInitialUrlState = (): {
  screen: ScreenType;
  selectedClass?: BoardClass;
  selectedGroup?: string;
  selectedSubject: string;
} => {
  if (typeof window === 'undefined') {
    return { screen: 'intro', selectedSubject: '' };
  }

  // Check if visitor opened a promotional or referral link (/claim?code=... or ?promo=...)
  const promoFromUrl = extractPromoCodeFromUrl();
  if (promoFromUrl) {
    storePendingPromoCode(promoFromUrl);
    // Requirement 2: If someone clicks the link while already logged in, take them straight to their own dashboard
    const cachedUser = localStorage.getItem('boardly_cached_user');
    if (cachedUser) {
      return { screen: 'dashboard', selectedSubject: '' };
    } else {
      // If logged out or new student, direct them to login/signup
      return { screen: 'auth', selectedSubject: '' };
    }
  }

  // Check if URL contains email confirmation tokens or auth callback parameters
  if (
    window.location.search.includes('token_hash=') ||
    window.location.hash.includes('token_hash=') ||
    window.location.search.includes('code=') ||
    window.location.hash.includes('access_token=') ||
    window.location.search.includes('type=signup') ||
    window.location.hash.includes('type=signup') ||
    window.location.search.includes('type=email') ||
    window.location.hash.includes('type=email') ||
    window.location.search.includes('error=') ||
    window.location.hash.includes('error=')
  ) {
    return { screen: 'auth', selectedSubject: '' };
  }

  const params = new URLSearchParams(window.location.search);
  const rawUrlScreen = params.get('screen')?.trim();
  const pageParam = params.get('page')?.trim();
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '');

  const isMarketingPath = [
    '/blitz',
    '/blitz/register',
    '/blitz/leaderboard',
    '/arena',
    '/arena/leaderboard',
    '/circles',
    '/circles/apply',
    '/boardy',
    '/study-buddy',
    '/ai',
    '/ustaad',
    '/jojo',
    '/zehni',
    '/socratic',
    '/features',
    '/pricing',
    '/faqs',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/about',
  ].includes(pathname);

  // If a marketing page or event route is directly requested (e.g. /blitz, /arena, /boardy, or ?page=...)
  if (pageParam || isMarketingPath) {
    return { screen: 'intro', selectedSubject: '' };
  }

  // Default is 'intro' (marketing website) for new visitors, or cached dashboard for logged-in students
  let initialScreen: ScreenType = 'intro';
  if (rawUrlScreen && VALID_SCREENS.includes(rawUrlScreen as ScreenType)) {
    initialScreen = rawUrlScreen as ScreenType;
  } else if (!params.has('screen')) {
    // Check background/offline resumption
    try {
      // 1. Prioritize active test session resume if present and non-expired
      const savedSession = localStorage.getItem('boardly_active_test_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (
          parsed &&
          parsed.testConfig &&
          Array.isArray(parsed.activeQuestions) &&
          parsed.activeQuestions.length > 0 &&
          (parsed.timeLeftSeconds === undefined || parsed.timeLeftSeconds > 0)
        ) {
          initialScreen = 'test';
        }
      }
      if (initialScreen === 'intro') {
        const cachedUser = localStorage.getItem('boardly_cached_user');
        if (cachedUser) {
          const saved = localStorage.getItem('boardly_active_screen')?.trim();
          if (saved && VALID_SCREENS.includes(saved as ScreenType) && saved !== 'intro') {
            initialScreen = saved as ScreenType;
          } else {
            initialScreen = 'dashboard';
          }
        }
      }
    } catch {}
  } else {
    // When ?screen= was explicitly provided but is empty or invalid
    const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('boardly_cached_user') : null;
    initialScreen = cachedUser ? 'dashboard' : 'intro';
  }

  // If the URL has an empty or invalid screen parameter (?screen= or ?screen=invalid),
  // cleanly normalize it
  if (params.has('screen') && (!rawUrlScreen || !VALID_SCREENS.includes(rawUrlScreen as ScreenType))) {
    try {
      const cleanParams = new URLSearchParams(window.location.search);
      cleanParams.set('screen', initialScreen);
      window.history.replaceState({ screen: initialScreen }, '', `?${cleanParams.toString()}`);
      localStorage.setItem('boardly_active_screen', initialScreen);
    } catch {}
  }

  const rawClass = params.get('class') || params.get('Class');
  const rawGroup = params.get('group') || params.get('Group');
  const rawSubject = params.get('subject') || params.get('Subject');

  let parsedClass: BoardClass | undefined = undefined;
  if (rawClass) {
    const uc = rawClass.trim().toUpperCase();
    if (uc === 'MDCAT') {
      parsedClass = 'MDCAT';
    } else if (uc === 'TCAT') {
      parsedClass = 'TCAT';
    } else {
      const num = parseInt(rawClass, 10);
      if (!isNaN(num) && (num === 9 || num === 10 || num === 11 || num === 12)) {
        parsedClass = num as BoardClass;
      }
    }
  }

  let normalizedGroup = rawGroup ? rawGroup.trim() : undefined;
  if (normalizedGroup && parsedClass) {
    const ngLower = normalizedGroup.toLowerCase();
    if (parsedClass === 9 || parsedClass === 10) {
      if (ngLower.includes('comp') || ngLower.includes('cs') || ngLower.includes('ics')) {
        normalizedGroup = 'Computer Science';
      } else if (ngLower.includes('med')) {
        normalizedGroup = 'Medical';
      }
    } else if (parsedClass === 11 || parsedClass === 12) {
      if (ngLower.includes('eng')) {
        normalizedGroup = 'Pre-Engineering';
      } else if (ngLower.includes('ics') || ngLower.includes('cs') || ngLower.includes('comp')) {
        normalizedGroup = 'ICS';
      } else if (ngLower.includes('med')) {
        normalizedGroup = 'Pre-Medical';
      }
    }
  }

  let effectiveSubject = rawSubject ? rawSubject.trim() : '';
  if (!effectiveSubject && initialScreen === 'test') {
    const subs = getSubjectsForClassAndGroup(parsedClass || 9, normalizedGroup || 'Medical');
    effectiveSubject = subs[0] || 'Physics';
  }

  return {
    screen: initialScreen,
    selectedClass: parsedClass,
    selectedGroup: normalizedGroup,
    selectedSubject: effectiveSubject,
  };
};

const buildUrl = (
  scr: ScreenType,
  modal?: string | null,
  cls?: BoardClass,
  grp?: string,
  sub?: string
) => {
  const safeScreen: ScreenType = (scr && VALID_SCREENS.includes(scr)) ? scr : 'dashboard';
  const params = new URLSearchParams();
  // Always set a non-empty, validated screen parameter
  params.set('screen', safeScreen);

  // Only persist class/group/subject query params during specific test flow screens where they represent user-selected test routes
  const isTestFlowScreen = safeScreen === 'subject' || safeScreen === 'group' || safeScreen === 'duration' || safeScreen === 'test' || safeScreen === 'results';
  if (isTestFlowScreen) {
    if (cls) {
      params.set('class', String(cls));
    }
    if (grp) {
      params.set('group', grp);
    }
    if (sub) {
      params.set('subject', sub);
    }
  }
  if (modal) {
    params.set('modal', modal);
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : window.location.pathname;
};

export function getStudentDefaultClassAndGroup(profile: StudentProfile | null): { classNum: BoardClass; group: string } {
  if (!profile) return { classNum: 11, group: 'Pre-Medical' };
  const parsed = parseAssignedTrack(profile.grade, profile.stream, profile.assigned_classes);
  return {
    classNum: parsed.assignedTrack as BoardClass,
    group: parsed.assignedStream || 'Pre-Medical',
  };
}

export function App() {
  const initialUrlState = useRef(getInitialUrlState()).current;

  const [screen, setScreen] = useState<ScreenType>(initialUrlState.screen);
  const [adminTab, setAdminTab] = useState<'students' | 'payment_requests' | 'activity_logs' | 'tests' | 'progress'>('students');

  const [selectedClass, setSelectedClass] = useState<BoardClass | undefined>(() => {
    if (initialUrlState.selectedClass) return initialUrlState.selectedClass;
    try {
      const cachedUserStr = localStorage.getItem('boardly_cached_user');
      const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;
      let p: StudentProfile | null = null;
      if (cachedUser?.id) {
        const cachedP = localStorage.getItem(`boardly_profile_${cachedUser.id}`);
        if (cachedP) p = JSON.parse(cachedP);
      }
      if (!p) {
        const cachedG = localStorage.getItem('boardly_cached_profile');
        if (cachedG) p = JSON.parse(cachedG);
      }
      if (p) {
        return getStudentDefaultClassAndGroup(p).classNum;
      }
    } catch {}
    return undefined;
  });

  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(() => {
    if (initialUrlState.selectedGroup) return initialUrlState.selectedGroup;
    try {
      const cachedUserStr = localStorage.getItem('boardly_cached_user');
      const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;
      let p: StudentProfile | null = null;
      if (cachedUser?.id) {
        const cachedP = localStorage.getItem(`boardly_profile_${cachedUser.id}`);
        if (cachedP) p = JSON.parse(cachedP);
      }
      if (!p) {
        const cachedG = localStorage.getItem('boardly_cached_profile');
        if (cachedG) p = JSON.parse(cachedG);
      }
      if (p) {
        return getStudentDefaultClassAndGroup(p).group;
      }
    } catch {}
    return undefined;
  });
  const [selectedSubject, setSelectedSubject] = useState<string>(initialUrlState.selectedSubject);
  const [customTopic, setCustomTopic] = useState<string | undefined>(undefined);

  const [showExitToast, setShowExitToast] = useState<boolean>(false);
  const lastExitPressTimeRef = useRef<number>(0);
  const exitToastTimerRef = useRef<any>(null);
  const isNavigatingFromPopstateRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      if (['intro', 'grades_flow', 'group', 'dashboard', 'subjects', 'subject', 'duration', 'admin', 'test'].includes(screen)) {
        localStorage.setItem('boardly_active_screen', screen);
      }
    } catch {}

    // Synchronize page-specific meta description, document title, and canonical URL
    const metaConfig = DEFAULT_PAGE_META[screen] || DEFAULT_PAGE_META.intro;
    let customTitle = metaConfig.title;
    let customDesc = metaConfig.description;

    let canonicalHref = 'https://boardly.cfd/';
    if (screen === 'pricing') {
      canonicalHref = 'https://boardly.cfd/?screen=pricing';
    } else if (screen === 'grades_flow') {
      canonicalHref = 'https://boardly.cfd/?screen=grades_flow';
    } else if (screen === 'group') {
      canonicalHref = `https://boardly.cfd/?screen=group${selectedClass ? `&class=${selectedClass}` : ''}`;
    } else if (screen === 'dashboard') {
      const classLabel = typeof selectedClass === 'number' ? `Class ${selectedClass}` : selectedClass;
      if (classLabel) {
        customTitle = `${classLabel} Dashboard — Boardly by SHS Virtual Academy`;
        customDesc = `Track ${classLabel} board exam practice performance, review chapter accuracy, and practice MCQs on Boardly by SHS Virtual Academy. Visit shsvirtualacademy.pro to learn more.`;
      }
      canonicalHref = `https://boardly.cfd/?screen=dashboard${selectedClass ? `&class=${selectedClass}` : ''}`;
    } else if (screen === 'subjects') {
      canonicalHref = `https://boardly.cfd/?screen=subjects${selectedClass ? `&class=${selectedClass}` : ''}`;
    } else if (screen === 'subject' && selectedSubject) {
      customTitle = `${selectedSubject} MCQs & Tests — Boardly by SHS Virtual Academy`;
      customDesc = `Practice chapter-wise ${selectedSubject} MCQs and questions with AI explanations on Boardly by SHS Virtual Academy. Visit shsvirtualacademy.pro to learn more.`;
      canonicalHref = `https://boardly.cfd/?screen=subject&subject=${encodeURIComponent(selectedSubject)}`;
    } else if (screen === 'auth') {
      canonicalHref = 'https://boardly.cfd/?screen=auth';
    } else if (screen === 'admin') {
      canonicalHref = 'https://boardly.cfd/?screen=admin';
    }

    setPageMeta(customDesc, customTitle, canonicalHref);
  }, [screen, selectedClass, selectedSubject]);

  const path: PathType = 'boards';

  const [testConfig, setTestConfig] = useState<TestConfig | null>(() => {
    try {
      const saved = localStorage.getItem('boardly_active_test_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testConfig) return parsed.testConfig;
      }
    } catch {}
    return null;
  });
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('boardly_active_test_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.activeQuestions) && parsed.activeQuestions.length > 0) {
          return parsed.activeQuestions;
        }
      }
    } catch {}
    return [];
  });
  const [testSessionProgress, setTestSessionProgress] = useState<{
    currentIndex?: number;
    userAnswers?: Record<number, UserAnswer>;
    timeLeftSeconds?: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('boardly_active_test_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentIndex === 'number') {
          return {
            currentIndex: parsed.currentIndex,
            userAnswers: parsed.userAnswers || {},
            timeLeftSeconds: parsed.timeLeftSeconds,
          };
        }
      }
    } catch {}
    return null;
  });
  const [activeTestSessionId, setActiveTestSessionId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('boardly_active_test_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionId) return parsed.sessionId;
      }
    } catch {}
    return null;
  });
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<{
    isOpen: boolean;
    subject: string;
    topic?: string;
    params?: {
      durationMinutes: number;
      questionCount: number;
      difficulty: QuestionDifficulty;
      mode: TestMode;
      instantFeedback: boolean;
      subject?: string;
      customTopic?: string;
    };
    errorMessage?: string;
  } | null>(null);
  const mcqAbortControllerRef = useRef<AbortController | null>(null);
  const bgMcqAbortControllerRef = useRef<AbortController | null>(null);
  const mcqRequestIdRef = useRef<number>(0);
  const [leaveModalConfig, setLeaveModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    stayLabel?: string;
    leaveLabel?: string;
    onConfirm: () => void;
  } | null>(null);
  const {
    showCommunityModal,
    showHistoryModal,
    showPrintModal,
    showLmsModal,
    showPaymentModal,
    showTestLimitModal,
    showStudyBuddy,
    openCommunityModal,
    closeCommunityModal,
    openHistoryModal,
    closeHistoryModal,
    openPrintModal,
    closePrintModal,
    openLmsModal,
    closeLmsModal,
    openPaymentModal,
    closePaymentModal,
    openTestLimitModal,
    closeTestLimitModal,
    openStudyBuddy,
    closeStudyBuddy,
    setStudyBuddyContext,
  } = useModals();
  const [testLimitResetDate, setTestLimitResetDate] = useState<string>('');
  const [mcqUsageCount, setMcqUsageCount] = useState<number>(0);
  const [trackNotice, setTrackNotice] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('boardly_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [userProfile, setUserProfile] = useState<StudentProfile | null>(() => {
    try {
      const cachedUserStr = localStorage.getItem('boardly_cached_user');
      const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;
      let profile: StudentProfile | null = null;
      if (cachedUser?.id) {
        const cachedP = localStorage.getItem(`boardly_profile_${cachedUser.id}`);
        if (cachedP) profile = JSON.parse(cachedP);
      }
      if (!profile) {
        const cachedGeneral = localStorage.getItem('boardly_cached_profile');
        if (cachedGeneral) profile = JSON.parse(cachedGeneral);
      }
      if (!profile && cachedUser?.id) {
        profile = {
          id: cachedUser.id,
          name: cachedUser.user_metadata?.full_name || cachedUser.email?.split('@')[0] || 'Student',
          email: cachedUser.email || '',
          grade: 'Class 11',
          stream: 'General Track',
          sign_up_method: 'Google',
          created_at: new Date().toISOString(),
        };
      }
      const isProfileAdmin = Boolean(
        (profile?.email && isAdminEmail(profile.email)) ||
        profile?.role === 'admin'
      );
      if (!isProfileAdmin && profile && (profile.is_pro || profile.plan_tier === 'pro') && profile.access_expires) {
        const expTime = new Date(profile.access_expires).getTime();
        if (!isNaN(expTime) && expTime <= Date.now()) {
          profile.is_pro = false;
          profile.plan_tier = 'free';
          profile.plan_status = 'free';
          profile.payment_status = 'Free Plan';
          profile.package_name = 'Free Plan';
          profile.subscribed_plans = ['free'];
          profile.access_expires = null;
        }
      }
      return profile;
    } catch {
      return null;
    }
  });

  const [profileSyncing, setProfileSyncing] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authTimedOut, setAuthTimedOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Ensure loading flags are resolved when auth completes
  useEffect(() => {
    if (!authLoading) {
      setAuthTimedOut(false);
    }
  }, [authLoading]);

  // 1-Year Free Pro Promotional Link Modal States
  const [promoModalOpen, setPromoModalOpen] = useState<boolean>(false);
  const [promoModalMode, setPromoModalMode] = useState<PromoModalMode>('confirm');
  const [promoIsActivating, setPromoIsActivating] = useState<boolean>(false);
  const [promoModalData, setPromoModalData] = useState<{
    trackLabel?: string;
    expiresDate?: string | null;
    code?: string;
    campaignLabel?: string;
    studentEmail?: string;
    errorMessage?: string;
  } | null>(null);

  const promoProcessedCodeRef = useRef<string | null>(null);

  // Step 1: Detect promo code on page load / claim link, validate, and show Confirmation Prompt
  useEffect(() => {
    if (!currentUser) return;
    const promoCode = extractPromoCodeFromUrl() || getStoredPendingPromoCode();
    if (!promoCode) return;

    if (promoProcessedCodeRef.current === promoCode && promoModalOpen) return;

    let isMounted = true;
    console.log(`[Promo Engine] Checking promo code "${promoCode}" for student ${currentUser.email}...`);

    validatePromoCode(promoCode, currentUser.id, currentUser.email).then((valResult) => {
      if (!isMounted) return;

      const userAlreadyPro = Boolean(
        userProfile?.is_pro ||
        userProfile?.plan_tier === 'pro' ||
        userProfile?.plan_status === 'verified_pro' ||
        (userProfile?.subscribed_plans && userProfile.subscribed_plans.includes('pro')) ||
        userProfile?.promo_code_redeemed === promoCode ||
        (userProfile?.transaction_reference && String(userProfile.transaction_reference).includes('PROMO:'))
      );

      // If user is already Pro or promo has already been redeemed:
      // Show "Already Activated — Pro valid until <date>" instead of showing the Activate prompt again!
      if (userAlreadyPro || valResult.alreadyRedeemedByAccount || valResult.alreadyRedeemed) {
        promoProcessedCodeRef.current = promoCode;
        clearPendingPromoCode();
        if (window.location.pathname.startsWith('/claim') || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname === '/claim' ? '/' : window.location.pathname);
        }

        const existingExpiry = userProfile?.access_expires || valResult.expiresDate || valResult.grantedUntil;
        setPromoModalMode('already_active');
        setPromoModalData({
          code: promoCode,
          campaignLabel: valResult.label || '1-Year Free Pro Pass',
          expiresDate: existingExpiry,
          trackLabel: userProfile?.grade || userProfile?.stream || 'Boardly Pro Track',
          studentEmail: currentUser.email || undefined,
        });
        setPromoModalOpen(true);
        return;
      }

      if (!valResult.valid) {
        promoProcessedCodeRef.current = promoCode;
        clearPendingPromoCode();
        if (window.location.pathname.startsWith('/claim') || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname === '/claim' ? '/' : window.location.pathname);
        }
        setPromoModalMode('error');
        setPromoModalData({
          code: promoCode,
          errorMessage: valResult.error || 'This promotional link is invalid or has expired.',
        });
        setPromoModalOpen(true);
        return;
      }

      // Requirement 1: Show confirmation screen first ("You've received a 1-Year Free Pro code. Activate it now?")
      // with two clear actions: "Activate" and "Cancel"
      promoProcessedCodeRef.current = promoCode;
      setPromoModalMode('confirm');
      setPromoModalData({
        code: promoCode,
        campaignLabel: valResult.label || '1-Year Free Boardly Pro Campaign',
        trackLabel: userProfile?.grade || userProfile?.stream || 'Your Enrolled Track',
        studentEmail: currentUser.email || undefined,
      });
      setPromoModalOpen(true);
    }).catch((err) => {
      console.warn('[Promo Engine] Validation error:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser, userProfile?.is_pro, userProfile?.access_expires]);

  // Requirement 2: Only when the student taps "Activate" should the backend actually apply the Pro grant
  const handleActivatePromo = useCallback(async () => {
    if (!currentUser || !promoModalData?.code) return;
    const codeToClaim = promoModalData.code;
    setPromoIsActivating(true);

    try {
      console.log(`[Promo Engine] Student confirmed activation. Claiming "${codeToClaim}" for ${currentUser.email}...`);
      const result = await claimPromoCode(codeToClaim, currentUser.id, currentUser.email);

      if (result.success && result.profile) {
        // Update profile in memory and caches
        setUserProfile(result.profile);
        localStorage.setItem('boardly_cached_profile', JSON.stringify(result.profile));
        localStorage.setItem(`boardly_profile_${currentUser.id}`, JSON.stringify(result.profile));
        clearPendingPromoCode();

        if (window.location.pathname.startsWith('/claim') || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname === '/claim' ? '/' : window.location.pathname);
        }

        // Requirement 3: Then show the "1 Year Free Pro Unlocked!" screen with expiry date
        setPromoModalMode('success');
        setPromoModalData({
          trackLabel: result.profile.grade || result.profile.stream || 'Boardly Pro Track',
          expiresDate: result.grantedUntil || result.profile.access_expires,
          code: result.code || codeToClaim,
          campaignLabel: result.label || promoModalData.campaignLabel,
          studentEmail: currentUser.email || undefined,
        });
      } else if (result.alreadyRedeemed) {
        clearPendingPromoCode();
        if (window.location.pathname.startsWith('/claim') || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname === '/claim' ? '/' : window.location.pathname);
        }
        setPromoModalMode('already_active');
        setPromoModalData({
          code: codeToClaim,
          expiresDate: result.grantedUntil || userProfile?.access_expires,
          campaignLabel: result.label || promoModalData.campaignLabel,
          trackLabel: userProfile?.grade || userProfile?.stream || 'Boardly Pro Track',
          studentEmail: currentUser.email || undefined,
        });
      } else {
        setPromoModalMode('error');
        setPromoModalData((prev) => ({
          ...prev,
          errorMessage: result.error || 'Failed to activate promotional code. Please try again.',
        }));
      }
    } catch (err: any) {
      console.error('[Promo Engine] Activation error:', err);
      setPromoModalMode('error');
      setPromoModalData((prev) => ({
        ...prev,
        errorMessage: err?.message || 'A network error occurred while activating your promotional pass.',
      }));
    } finally {
      setPromoIsActivating(false);
    }
  }, [currentUser, promoModalData, userProfile]);

  // Requirement 4: If the student taps 'Cancel', do not apply the grant and dismiss/redirect to dashboard
  const handleCancelPromo = useCallback(() => {
    console.log('[Promo Engine] Student cancelled promo activation.');
    clearPendingPromoCode();
    setPromoModalOpen(false);
    if (window.location.pathname.startsWith('/claim') || window.location.search.includes('code=')) {
      window.history.replaceState(null, '', window.location.pathname === '/claim' ? '/' : window.location.pathname);
    }
    setScreen('dashboard');
  }, []);

  const handleRetryAuth = useCallback(async () => {
    setAuthTimedOut(false);
    setAuthError(null);
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }
    setAuthLoading(true);

    const retryTimeout = setTimeout(() => {
      setAuthLoading(false);
      setProfileSyncing(false);
      setAuthTimedOut(true);
      setAuthError('Connection took too long. Please try again or continue to dashboard.');
    }, 8000);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.getSession(),
        3000,
        { data: { session: null }, error: null } as any,
        'retryGetSession'
      );
      if (error) {
        console.warn('[Retry Auth] getSession returned error:', error);
      }
      const session = data?.session;
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        setProfileSyncing(true);
        const profile = await withTimeout(
          syncUserProfile(user),
          4000,
          null,
          'retrySyncUserProfile'
        );
        if (profile) {
          setUserProfile(profile);
        }
        setProfileSyncing(false);
      } else {
        setUserProfile(null);
      }
      clearTimeout(retryTimeout);
      setAuthTimedOut(false);
    } catch (err: any) {
      console.error('[Retry Auth Exception]:', err);
      setAuthError('Connection took too long. Please try again or continue to dashboard.');
      setAuthTimedOut(true);
    } finally {
      clearTimeout(retryTimeout);
      setAuthLoading(false);
      setProfileSyncing(false);
    }
  }, []);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('boardly_cached_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('boardly_cached_user');
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      if (userProfile) {
        if (currentUser?.id) {
          localStorage.setItem(`boardly_profile_${currentUser.id}`, JSON.stringify(userProfile));
        }
        localStorage.setItem('boardly_cached_profile', JSON.stringify(userProfile));
        const uni = userProfile.dream_university || userProfile.target_university;
        if (uni) {
          localStorage.setItem('boardly_target_university', uni);
        }
      } else if (!currentUser) {
        localStorage.removeItem('boardly_cached_profile');
      }
    } catch {}
  }, [userProfile, currentUser?.id]);

  const isAdmin = Boolean(currentUser?.email && isAdminEmail(currentUser.email));

  // Access Gating Rule: Boardly is 100% free and Pro for all users!
  const isStudentProOrPaid = true;
  const isPaymentApprovedOrExempt = true;

  // Synchronize selectedClass & selectedGroup with student's profile grade & stream
  const lastKnownProfileTrackRef = useRef<string>('');
  useEffect(() => {
    if (userProfile && !isAdmin) {
      const currentTrackKey = `${userProfile.grade || ''}|${userProfile.stream || ''}|${(userProfile.assigned_classes || []).join(',')}`;
      if (lastKnownProfileTrackRef.current && lastKnownProfileTrackRef.current !== currentTrackKey) {
        // Admin changed student track/stream! Update selectedClass and selectedGroup immediately
        const defaultInfo = getStudentDefaultClassAndGroup(userProfile);
        setSelectedClass(defaultInfo.classNum);
        setSelectedGroup(defaultInfo.group);
      } else if (selectedClass === undefined || selectedGroup === undefined) {
        const defaultInfo = getStudentDefaultClassAndGroup(userProfile);
        if (selectedClass === undefined) {
          setSelectedClass(defaultInfo.classNum);
        }
        if (selectedGroup === undefined) {
          setSelectedGroup(defaultInfo.group);
        }
      }
      lastKnownProfileTrackRef.current = currentTrackKey;
    }
  }, [userProfile, isAdmin, selectedClass, selectedGroup]);

  // Keep local storage and backend server synchronized with active test progress
  useEffect(() => {
    if (!isExitingTestRef.current && screen === 'test' && activeQuestions.length > 0 && testConfig) {
      const activeData = {
        sessionId: activeTestSessionId || 'session_active',
        userId: currentUser?.id || 'guest',
        userEmail: currentUser?.email,
        testConfig,
        activeQuestions,
        currentIndex: testSessionProgress?.currentIndex || 0,
        userAnswers: testSessionProgress?.userAnswers || {},
        timeLeftSeconds: testSessionProgress?.timeLeftSeconds ?? (testConfig.durationMinutes * 60),
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
      try {
        localStorage.setItem('boardly_active_test_session', JSON.stringify(activeData));
      } catch {}

      // Send to server immediately for instant answer locking persistence
      apiFetch('/api/update-test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'guest',
          userEmail: currentUser?.email,
          sessionId: activeTestSessionId,
          currentIndex: activeData.currentIndex,
          userAnswers: activeData.userAnswers,
          timeLeftSeconds: activeData.timeLeftSeconds,
          questions: activeQuestions,
          config: testConfig,
        }),
      }).then(res => safeJsonResponse(res)).then(data => {
        if (isExitingTestRef.current) return;
        if (data?.success && data?.userAnswers && Object.keys(data.userAnswers).length > 0) {
          setTestSessionProgress(prev => {
            if (!prev) return prev;
            // Only update state if server returned new answer keys to avoid infinite re-render loop
            const hasNew = Object.keys(data.userAnswers).some(k => !prev.userAnswers[k]);
            if (!hasNew) return prev;
            return { ...prev, userAnswers: { ...data.userAnswers, ...prev.userAnswers } };
          });
        }
      }).catch(() => {});
    }
  }, [screen, activeQuestions, testConfig, testSessionProgress?.currentIndex, testSessionProgress?.userAnswers, activeTestSessionId, currentUser?.id, currentUser?.email]);

  // Active Test Session Restoration on Reload / Refresh
  useEffect(() => {
    let isMounted = true;
    const checkAndResumeActiveSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlScreen = params.get('screen') as ScreenType | null;

      let localParsedSession: any = null;
      // 1. Check local storage immediately
      try {
        const saved = localStorage.getItem('boardly_active_test_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          const ageMs = Date.now() - (parsed.updatedAt || parsed.startedAt || Date.now());
          if (
            ageMs < 7200000 &&
            parsed.testConfig &&
            Array.isArray(parsed.activeQuestions) &&
            parsed.activeQuestions.length > 0 &&
            (parsed.timeLeftSeconds === undefined || parsed.timeLeftSeconds > 0)
          ) {
            localParsedSession = parsed;
            console.log(`[Active Session Resume - LocalCache]: Found local active test session ${parsed.sessionId} for "${parsed.testConfig.subject}" with ${Object.keys(parsed.userAnswers || {}).length} answered questions (Current Index: ${parsed.currentIndex})`);
            if (isMounted) {
              setActiveTestSessionId(parsed.sessionId || 'session_active');
              setTestConfig(parsed.testConfig);
              setActiveQuestions(parsed.activeQuestions);
              setTestSessionProgress({
                currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
                userAnswers: parsed.userAnswers || {},
                timeLeftSeconds: parsed.timeLeftSeconds,
              });
              if (!urlScreen || urlScreen === 'test') {
                if (screen !== 'test') {
                  setScreen('test');
                }
              }
            }
          } else {
            console.log('[Active Session Resume]: Found expired or zero-time session in localStorage, clearing.');
            localStorage.removeItem('boardly_active_test_session');
          }
        }
      } catch (err) {
        console.warn('[Active Session Resume Local Error]:', err);
      }

      // 2. Query backend server for active test session & merge server-locked answers
      try {
        const uId = currentUser?.id || 'guest';
        const uEmail = currentUser?.email || '';
        const sId = localParsedSession?.sessionId || activeTestSessionId || '';
        const res = await apiFetch(`/api/get-active-test-session?userId=${encodeURIComponent(uId)}&userEmail=${encodeURIComponent(uEmail)}&sessionId=${encodeURIComponent(sId)}`);
        const data = await safeJsonResponse(res);
        if (data?.success && data?.active && data?.session) {
          const s = data.session;
          if (s.config && Array.isArray(s.questions) && s.questions.length > 0 && s.timeLeftSeconds > 0) {
            console.log(`[Active Session Resume - Server]: Merging server active test session ${s.sessionId} for "${s.config.subject}"`);
            if (isMounted) {
              // Merge answers from server and local storage (giving precedence to already-answered locked selections)
              const mergedAnswers = {
                ...(s.userAnswers || {}),
                ...(localParsedSession?.userAnswers || {}),
              };

              const targetIndex = typeof localParsedSession?.currentIndex === 'number'
                ? localParsedSession.currentIndex
                : (typeof s.currentIndex === 'number' ? s.currentIndex : 0);

              setActiveTestSessionId(s.sessionId);
              setTestConfig(s.config);
              setActiveQuestions(s.questions.length >= (localParsedSession?.activeQuestions?.length || 0) ? s.questions : localParsedSession.activeQuestions);
              setTestSessionProgress({
                currentIndex: targetIndex,
                userAnswers: mergedAnswers,
                timeLeftSeconds: s.timeLeftSeconds || localParsedSession?.timeLeftSeconds,
              });

              const cacheData = {
                sessionId: s.sessionId,
                userId: uId,
                userEmail: uEmail,
                testConfig: s.config,
                activeQuestions: s.questions,
                currentIndex: targetIndex,
                userAnswers: mergedAnswers,
                timeLeftSeconds: s.timeLeftSeconds,
                startedAt: s.startedAt,
                updatedAt: s.updatedAt,
              };
              localStorage.setItem('boardly_active_test_session', JSON.stringify(cacheData));
              if (!urlScreen || urlScreen === 'test') {
                if (screen !== 'test') {
                  setScreen('test');
                }
              }
            }
            return;
          }
        } else if (data?.active === false || (data?.success === false && localParsedSession)) {
          // Server confirmed active session is finished/exited -> purge stale local storage and reset test state
          console.log('[Active Session Resume]: Server confirmed active session is finished/exited, clearing local cache.');
          localStorage.removeItem('boardly_active_test_session');
          if (isMounted) {
            setActiveTestSessionId(null);
            setTestConfig(null);
            setActiveQuestions([]);
            setTestSessionProgress(null);
          }
        }
      } catch (sErr) {
        console.warn('[Active Session Resume Server Error]:', sErr);
      }

      // 3. Fallback for deep-link / direct navigate to test screen without prior session
      if (screen === 'test' && activeQuestions.length === 0 && !localParsedSession) {
        const targetSub = selectedSubject || getSubjectsForClassAndGroup(selectedClass || 9, selectedGroup || 'Medical')[0] || 'Physics';
        const targetTop = testConfig?.customTopic;
        const { getPrebuiltQuestionsForSubject } = await import('./data/prebuiltQuestions');
        const prebuiltPool = getPrebuiltQuestionsForSubject(targetSub, targetTop);
        if (prebuiltPool && prebuiltPool.length > 0) {
          const shuffled = [...prebuiltPool].sort(() => 0.5 - Math.random()).slice(0, 10);
          if (isMounted) {
            setActiveQuestions(shuffled.map(shuffleQuestionOptions));
          }
        }
      }
    };

    checkAndResumeActiveSession();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentUser?.email]);

  const screenRef = useRef(screen);
  const selectedClassRef = useRef(selectedClass);
  const selectedGroupRef = useRef(selectedGroup);
  const selectedSubjectRef = useRef(selectedSubject);
  const showLmsModalRef = useRef(showLmsModal);
  const showPrintModalRef = useRef(showPrintModal);
  const showHistoryModalRef = useRef(showHistoryModal);
  const showCommunityModalRef = useRef(showCommunityModal);
  const currentUserRef = useRef(currentUser);
  const userProfileRef = useRef(userProfile);
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);
  const isAdminRef = useRef(isAdmin);
  const authBackScreenRef = useRef<ScreenType>('intro');
  const isExitingTestRef = useRef(false);
  const isGeneratingRef = useRef(false);

  const [nextScreenAfterAuth, setNextScreenAfterAuth] = useState<ScreenType | null>(null);
  const [authBackScreen, setAuthBackScreen] = useState<ScreenType>('intro');

  useEffect(() => {
    screenRef.current = screen;
    selectedClassRef.current = selectedClass;
    selectedGroupRef.current = selectedGroup;
    selectedSubjectRef.current = selectedSubject;
    showLmsModalRef.current = showLmsModal;
    showPrintModalRef.current = showPrintModal;
    showHistoryModalRef.current = showHistoryModal;
    showCommunityModalRef.current = showCommunityModal;
    currentUserRef.current = currentUser;
    isAdminRef.current = isAdmin;
    authBackScreenRef.current = authBackScreen;
    isGeneratingRef.current = isGenerating;
  }, [
    screen,
    selectedClass,
    selectedGroup,
    selectedSubject,
    showLmsModal,
    showPrintModal,
    showHistoryModal,
    showCommunityModal,
    currentUser,
    isAdmin,
    authBackScreen,
    isGenerating,
  ]);

  const lastFocusSyncRef = useRef<number>(0);

  const refreshUserProfile = async (uid?: string, email?: string) => {
    const id = uid || currentUser?.id;
    const userEmail = email || currentUser?.email;
    if (!id) {
      setUserProfile((prev) => (prev ? null : prev));
      return;
    }
    const profile = await fetchStudentProfileFromSupabase(id, true, userEmail);
    if (profile) {
      setUserProfile((prev) => {
        if (!prev) return profile;
        // Deep comparison prevents unnecessary state reference churn and component flicker
        if (JSON.stringify(prev) === JSON.stringify(profile)) {
          return prev;
        }
        return profile;
      });
    } else {
      // User does not exist or was deleted from database
      setUserProfile(null);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshUserProfile(currentUser.id, currentUser.email);
    } else {
      setUserProfile(null);
    }
  }, [currentUser?.id, currentUser?.email]);

  // Throttled profile re-sync on window focus / tab visibility change (max once per 30s)
  useEffect(() => {
    const handleFocusSync = () => {
      if (currentUser?.id) {
        const now = Date.now();
        if (now - lastFocusSyncRef.current > 30000) {
          lastFocusSyncRef.current = now;
          refreshUserProfile(currentUser.id, currentUser.email);
        }
      }
    };
    window.addEventListener('focus', handleFocusSync);
    return () => {
      window.removeEventListener('focus', handleFocusSync);
    };
  }, [currentUser?.id, currentUser?.email]);

  // Listen for real-time profile updates (e.g. from Admin "Change Plan" action or promo redemption)
  useEffect(() => {
    const handleProfileUpdated = (event: any) => {
      const detail = event?.detail;
      const targetId = detail?.studentId;
      const targetEmail = detail?.studentEmail || detail?.profile?.email;
      const currentId = currentUserRef.current?.id;
      const currentEmail = currentUserRef.current?.email;

      const isMatch =
        (!targetId && !targetEmail) ||
        (targetId && targetId === currentId) ||
        (targetEmail && currentEmail && targetEmail.toLowerCase() === currentEmail.toLowerCase());

      if (isMatch) {
        console.log('[boardly_profile_updated event received] Syncing userProfile with new data:', detail);
        if (detail?.profile) {
          setUserProfile(detail.profile);
          try {
            if (currentId) localStorage.setItem(`boardly_profile_${currentId}`, JSON.stringify(detail.profile));
            localStorage.setItem('boardly_cached_profile', JSON.stringify(detail.profile));
          } catch {}
        }
        if (currentId) {
          refreshUserProfile(currentId, currentEmail);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === 'boardly_cached_profile' ||
        (currentUserRef.current?.id && e.key === `boardly_profile_${currentUserRef.current.id}`)
      ) {
        if (currentUserRef.current?.id) {
          refreshUserProfile(currentUserRef.current.id, currentUserRef.current.email);
        }
      }
    };

    window.addEventListener('boardly_profile_updated', handleProfileUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('boardly_profile_updated', handleProfileUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Periodic background sync to pick up admin status/plan upgrades automatically (4s poll when on payment_required, 60s otherwise)
  useEffect(() => {
    if (!currentUser?.id) return;
    const syncInterval = screen === 'payment_required' ? 4000 : 60000;
    const intervalId = setInterval(() => {
      refreshUserProfile(currentUser.id, currentUser.email);
    }, syncInterval);
    return () => clearInterval(intervalId);
  }, [currentUser?.id, currentUser?.email, screen]);

  // Auto-redirect off legacy payment/pricing screens to dashboard
  useEffect(() => {
    if (['payment_required', 'pricing', 'plan_selection', 'checkout'].includes(screen)) {
      setScreen('dashboard');
    }
  }, [screen]);

  // Comprehensive Security & Route Guard Enforcement (Auth & RBAC)
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    const enforceSecurity = async () => {
      // 1. Unauthenticated User Protection for Protected Routes
      if (!currentUser) {
        if (['dashboard', 'subject', 'duration', 'test', 'results', 'group', 'grades_flow', 'admin'].includes(screen)) {
          // Double-check active session directly with Supabase before bouncing to auth screen
          const { data: { session } } = await supabase.auth.getSession();
          if (!isMounted) return;

          if (session?.user) {
            console.log('[Security Guard]: Restored active session from Supabase during route guard check.');
            setCurrentUser(session.user);
            return;
          }

          console.warn(`[Security Guard]: Unauthenticated user attempted to access protected screen (${screen}). Redirecting to auth screen...`);
          setNextScreenAfterAuth(screen === 'admin' ? 'admin' : 'dashboard');
          setAuthBackScreen('intro');
          setScreen('auth');
          try {
            localStorage.removeItem('boardly_active_screen');
          } catch {}
        }
        return;
      }

      // 2. Authenticated Non-Admin Student Protection for Admin Route
      if (screen === 'admin' && !isAdmin) {
        console.warn(`[Security Guard]: Non-admin student (${currentUser.email}) attempted to access admin dashboard. Redirecting to subjects dashboard...`);
        setScreen('dashboard');
        try { localStorage.removeItem('boardly_active_screen'); } catch {}
        return;
      }

      // 3. Authenticated Student Navigation Guard
      if (!isAdmin) {
        if (['payment_required', 'pricing', 'plan_selection', 'checkout', 'grades_flow', 'group'].includes(screen)) {
          setScreen('dashboard');
        }
      }
    };

    enforceSecurity();

    return () => {
      isMounted = false;
    };
  }, [screen, currentUser, isAdmin, authLoading, profileSyncing, userProfile, selectedClass, isPaymentApprovedOrExempt]);

  // Admin Route Session Logger (Non-destructive verification)
  useEffect(() => {
    if (screen === 'admin' && currentUser && isAdmin) {
      console.log('[Admin Access Granted]: Verified admin session for:', currentUser.email);
    }
  }, [screen, currentUser, isAdmin]);

  // Route Guard Enforcement for non-admin students
  useEffect(() => {
    if (currentUser && !isAdmin) {
      if (screen === 'grades_flow' || screen === 'group') {
        // Redirect selection screen attempts straight to dashboard
        setScreen('dashboard');
      }
    }
  }, [currentUser, isAdmin, screen]);

  // Clean OAuth URL parameters immediately from browser history on mount
  useEffect(() => {
    const hasHashToken = window.location.hash.includes('access_token');
    const hasSearchCode = window.location.search.includes('code=');
    if (hasHashToken || hasSearchCode) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [screen]);

  // Synchronize internal state with Browser History API and URL query parameters
  useEffect(() => {
    const hasHashToken = window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery');
    const hasSearchCode = window.location.search.includes('code=');
    if (hasHashToken || hasSearchCode) {
      return;
    }

    if (isNavigatingFromPopstateRef.current) {
      isNavigatingFromPopstateRef.current = false;
      return;
    }

    const activeModal = showLmsModal ? 'lms' : showPrintModal ? 'print' : showHistoryModal ? 'history' : showCommunityModal ? 'community' : null;
    const url = buildUrl(screen, activeModal, selectedClass, selectedGroup, selectedSubject);
    const stateObj = {
      screen,
      modal: activeModal,
      selectedClass,
      selectedGroup,
      selectedSubject,
      isRoot: screen === 'intro' && !activeModal,
    };

    const currentQuery = window.location.search || window.location.pathname;
    const isDifferentState =
      window.history.state?.screen !== screen ||
      window.history.state?.modal !== activeModal ||
      (url.includes('class=') && window.history.state?.selectedClass !== selectedClass) ||
      (url.includes('group=') && window.history.state?.selectedGroup !== selectedGroup) ||
      (url.includes('subject=') && window.history.state?.selectedSubject !== selectedSubject);

    if (isDifferentState) {
      if (currentQuery !== url) {
        window.history.pushState(stateObj, '', url);
      } else {
        window.history.replaceState(stateObj, '', url);
      }
    }
  }, [screen, showLmsModal, showPrintModal, showHistoryModal, showCommunityModal, selectedClass, selectedGroup, selectedSubject]);

  // Hardware Back Button & Popstate History Listener
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      isNavigatingFromPopstateRef.current = true;
      const state = e.state;

      // 1. If currently generating MCQs, confirm before leaving
      if (isGeneratingRef.current) {
        window.history.pushState(
          { screen: screenRef.current, selectedClass: selectedClassRef.current, selectedGroup: selectedGroupRef.current, selectedSubject: selectedSubjectRef.current },
          '',
          buildUrl(screenRef.current, null, selectedClassRef.current, selectedGroupRef.current, selectedSubjectRef.current)
        );
        isNavigatingFromPopstateRef.current = false;
        setLeaveModalConfig({
          isOpen: true,
          title: 'Leave this page?',
          message: 'Question generation is still in progress and will be lost.',
          stayLabel: 'Stay',
          leaveLabel: 'Leave Anyway',
          onConfirm: () => {
            handleCancelGeneration();
            handleGlobalBackInternal();
          },
        });
        return;
      }

      // 2. If currently taking active test, confirm before leaving test
      if (screenRef.current === 'test') {
        window.history.pushState(
          { screen: 'test', selectedClass: selectedClassRef.current, selectedGroup: selectedGroupRef.current, selectedSubject: selectedSubjectRef.current },
          '',
          buildUrl('test', null, selectedClassRef.current, selectedGroupRef.current, selectedSubjectRef.current)
        );
        isNavigatingFromPopstateRef.current = false;
        setLeaveModalConfig({
          isOpen: true,
          title: 'Exit Test?',
          message: 'Exiting will count this test as a used attempt and your current progress will be lost. Are you sure you want to exit and return to the dashboard?',
          stayLabel: 'Stay',
          leaveLabel: 'Leave Anyway',
          onConfirm: () => {
            handleExitTestSession();
          },
        });
        return;
      }

      // 2. Close overlay modals first
      if (showLmsModalRef.current) {
        closeLmsModal();
        return;
      }
      if (showPrintModalRef.current) {
        closePrintModal();
        return;
      }
      if (showHistoryModalRef.current) {
        closeHistoryModal();
        return;
      }
      if (showCommunityModalRef.current) {
        closeCommunityModal();
        return;
      }

      // 3. Homepage ('intro') exit handler (Double back to exit within 2 seconds)
      const currentScreen = screenRef.current;
      if (currentScreen === 'intro') {
        const now = Date.now();
        if (now - lastExitPressTimeRef.current < 2000) {
          // Second back press within 2s -> Allow app exit
          try {
            CapacitorApp.exitApp();
          } catch {}
          return;
        } else {
          // First back press -> Show toast and push root guard state
          lastExitPressTimeRef.current = now;
          setShowExitToast(true);
          if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
          exitToastTimerRef.current = setTimeout(() => {
            setShowExitToast(false);
          }, 2000);

          window.history.pushState(
            { screen: 'intro', isRoot: true },
            '',
            buildUrl('intro')
          );
          return;
        }
      }

      // 4. Update screen and parameter states from history state object
      const urlParams = new URLSearchParams(window.location.search);
      const rawUrlScreen = urlParams.get('screen')?.trim();
      const resolvedScreen = (state?.screen && VALID_SCREENS.includes(state.screen))
        ? state.screen
        : (rawUrlScreen && VALID_SCREENS.includes(rawUrlScreen as ScreenType))
          ? (rawUrlScreen as ScreenType)
          : 'dashboard';

      setScreen(resolvedScreen);
      if (state?.selectedClass !== undefined) setSelectedClass(state.selectedClass);
      if (state?.selectedGroup !== undefined) setSelectedGroup(state.selectedGroup);
      if (state?.selectedSubject !== undefined) setSelectedSubject(state.selectedSubject);
    };

    let capListener: any = null;
    try {
      CapacitorApp.addListener('backButton', () => {
        window.history.back();
      }).then((l) => {
        capListener = l;
      });
    } catch {}

    window.addEventListener('popstate', handlePopState);

    return () => {
      if (capListener && typeof capListener.remove === 'function') {
        capListener.remove();
      }
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const [limitExceededError, setLimitExceededError] = useState<{
    message: string;
    currentUsage: number;
    resetDate: string;
  } | null>(null);

  const [pendingTestParams, setPendingTestParams] = useState<{
    durationMinutes: number;
    questionCount: number;
    difficulty: QuestionDifficulty;
    mode: TestMode;
    instantFeedback: boolean;
  } | null>(null);

  const pendingTestParamsRef = useRef(pendingTestParams);
  const nextScreenAfterAuthRef = useRef(nextScreenAfterAuth);
  const executeStartTestRef = useRef<((params: any) => Promise<void>) | null>(null);

  useEffect(() => {
    pendingTestParamsRef.current = pendingTestParams;
    nextScreenAfterAuthRef.current = nextScreenAfterAuth;
  }, [pendingTestParams, nextScreenAfterAuth]);

  useEffect(() => {
    let isSubscribed = true;

    // 0. Explicit Email Confirmation Link & Callback URL Diagnostics
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash);

    const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
    const codeParam = searchParams.get('code') || hashParams.get('code');
    const authType = searchParams.get('type') || hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const urlError = searchParams.get('error') || hashParams.get('error');
    const urlErrorDescription = searchParams.get('error_description') || hashParams.get('error_description');

    if (tokenHash || codeParam || authType || accessToken || urlError || urlErrorDescription) {
      console.log('====================================');
      console.log('[SUPABASE AUTH EMAIL CONFIRMATION CALLBACK DETECTED]');
      console.log('Full URL:', window.location.href);
      console.log('Pathname:', window.location.pathname);
      console.log('Search:', window.location.search);
      console.log('Hash:', window.location.hash);
      console.log('Parsed Parameters:', {
        token_hash: tokenHash,
        code: codeParam,
        type: authType,
        access_token_present: Boolean(accessToken),
        error: urlError,
        error_description: urlErrorDescription,
      });
      console.log('====================================');

      if (tokenHash) {
        console.log('[Auth Callback] Verifying token_hash with Supabase verifyOtp...');
        verifyEmailTokenHash(tokenHash, authType || 'signup').then((res) => {
          console.log('[Auth Callback] token_hash verification result:', res);
          if (res.success && res.session?.user) {
            console.log('[Auth Callback] Verification success! User session set:', res.session.user.email);
            setCurrentUser(res.session.user);
            window.history.replaceState(null, '', window.location.pathname);
          } else if (res.error) {
            console.error('[Auth Callback] token_hash verification error:', res.error);
            setScreen('auth');
          }
        });
      } else if (codeParam) {
        const isPromoCodeParam = Boolean(
          window.location.pathname.startsWith('/claim') ||
          searchParams.has('promo') ||
          searchParams.has('claim') ||
          codeParam.startsWith('BOARDLY-') ||
          codeParam.startsWith('PRO-') ||
          codeParam.startsWith('FREE-')
        );

        if (isPromoCodeParam) {
          console.log('[Auth Callback] Detected promo code parameter, storing intent:', codeParam);
          storePendingPromoCode(codeParam);
        } else {
          console.log('[Auth Callback] Exchanging auth code for session with Supabase...');
          supabase.auth.exchangeCodeForSession(codeParam).then(({ data, error }) => {
            console.log('[Auth Callback] Code exchange result:', { data, error });
            if (!error && data?.session?.user) {
              console.log('[Auth Callback] Code exchange success! User session set:', data.session.user.email);
              setCurrentUser(data.session.user);
              window.history.replaceState(null, '', window.location.pathname);
            } else if (error) {
              console.error('[Auth Callback] Code exchange error:', error);
              setScreen('auth');
            }
          });
        }
      } else if (urlError || urlErrorDescription) {
        console.error('[Auth Callback] URL contains Auth Error:', urlErrorDescription || urlError);
        setScreen('auth');
      }
    }

    const processAuthUser = async (user: User, sourceEvent: string) => {
      const isUserAdmin = Boolean(user.email && isAdminEmail(user.email));

      // 1. Run profile sync FIRST so that new users (Google OAuth or Email) get created in 'students' table
      if (!userProfile) {
        setProfileSyncing(true);
      }
      let profile: StudentProfile | null = null;
      try {
        profile = await withTimeout(
          syncUserProfile(user),
          4000,
          null,
          'syncUserProfile'
        );
        if (isSubscribed && profile) {
          setUserProfile(profile);
        }
      } catch (syncErr) {
        console.error('syncUserProfile error:', syncErr);
      } finally {
        if (isSubscribed) {
          setProfileSyncing(false);
        }
      }

      // 1.1 Preserve pending promo code so the two-step confirmation prompt is shown to the authenticated student
      const pendingPromo = getStoredPendingPromoCode() || extractPromoCodeFromUrl();
      if (pendingPromo) {
        storePendingPromoCode(pendingPromo);
      }

      // Sync student's previously seen questions from server database in the background
      syncSeenQuestionsWithServer(user.id, user.email).catch(() => {});

      // 2. Admin routing stays completely separate
      if (isUserAdmin) {
        const activeScreen = screenRef.current;
        if (activeScreen === 'auth' || activeScreen === 'intro') {
          setScreen('admin');
        }
        return;
      }

      const hasHashToken = window.location.hash.includes('access_token');
      const hasSearchCode = window.location.search.includes('code=');
      const isPendingOAuth = localStorage.getItem('shs_oauth_redirect') === 'true' || sessionStorage.getItem('shs_oauth_redirect') === 'true';

      if (hasHashToken || hasSearchCode || isPendingOAuth) {
        localStorage.removeItem('shs_oauth_redirect');
        sessionStorage.removeItem('shs_oauth_redirect');
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Retrieve preserved target dashboard section/category prior to login
        const savedClass = sessionStorage.getItem('shs_intended_class') || localStorage.getItem('shs_intended_class');
        const savedGroup = sessionStorage.getItem('shs_intended_group') || localStorage.getItem('shs_intended_group');

        if (savedClass) {
          let pClass: BoardClass = savedClass === 'MDCAT' ? 'MDCAT' : savedClass === 'TCAT' ? 'TCAT' : (parseInt(savedClass, 10) as BoardClass || 9);
          setSelectedClass(pClass);
          if (savedGroup) setSelectedGroup(savedGroup);
          sessionStorage.removeItem('shs_intended_class');
          sessionStorage.removeItem('shs_intended_group');
          localStorage.removeItem('shs_intended_class');
          localStorage.removeItem('shs_intended_group');
        }

        console.log('[Auth Flow] Authenticated student detected. Routing directly to destination...');
        const activeScreen = screenRef.current;
        if (activeScreen === 'auth' || activeScreen === 'intro') {
          if (pendingTestParamsRef.current && executeStartTestRef.current) {
            executeStartTestRef.current(pendingTestParamsRef.current);
          } else if (nextScreenAfterAuthRef.current) {
            setScreen(nextScreenAfterAuthRef.current);
            setNextScreenAfterAuth(null);
          } else {
            setScreen('dashboard');
          }
        }
      } else {
        // Authenticated student on normal session restore / refresh / sign-in
        const activeScreen = screenRef.current;
        const params = new URLSearchParams(window.location.search);
        const rawUrlScreen = params.get('screen')?.trim();
        const isAuthOrIntroOrEmpty =
          activeScreen === 'intro' ||
          activeScreen === 'auth' ||
          !rawUrlScreen ||
          rawUrlScreen === 'intro' ||
          rawUrlScreen === 'auth' ||
          !VALID_SCREENS.includes(rawUrlScreen as ScreenType);

        if (isAuthOrIntroOrEmpty) {
          console.log('[Auth Flow] Authenticated student on root/intro/auth screen. Routing to destination...');
          const savedActiveScreen = localStorage.getItem('boardly_active_screen');
          let target: ScreenType = 'dashboard';
          if (savedActiveScreen && VALID_SCREENS.includes(savedActiveScreen as ScreenType) && savedActiveScreen !== 'admin') {
            target = savedActiveScreen as ScreenType;
          }
          if (nextScreenAfterAuthRef.current) {
            target = nextScreenAfterAuthRef.current;
          }
          setScreen(target);
          setNextScreenAfterAuth(null);
        }
      }
    };

    // If Supabase is not configured in this environment, complete auth state immediately without waiting
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setProfileSyncing(false);
      return () => {
        isSubscribed = false;
      };
    }

    // 1. Initial Session Check on app load with explicit safety timeout (4500ms max)
    let initialCheckResolved = false;
    let splashTimeoutTimer: any = setTimeout(() => {
      if (!isSubscribed) return;
      if (!initialCheckResolved) {
        console.warn('[Splash Screen Safety Timeout] Initial session check exceeded threshold. Releasing splash lock to allow user recovery.');
        setAuthTimedOut(true);
        setAuthLoading(false);
        setProfileSyncing(false);
      }
    }, 4500);

    const initSession = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          3000,
          { data: { session: null }, error: null } as any,
          'supabase.auth.getSession'
        );

        if (!isSubscribed) return;
        if (error) {
          console.warn('[getSession warning]:', error);
        }

        const session = data?.session;
        const user = session?.user ?? null;
        setCurrentUser(user);

        if (user) {
          setUserProfile((prev) => prev || {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
            email: user.email || '',
            grade: 'Class 11',
            stream: 'General Track',
            sign_up_method: 'Google',
            created_at: new Date().toISOString(),
          });
          // Process full database profile synchronization in background without blocking initial render
          processAuthUser(user, 'getSession').catch((err) => {
            console.warn('[initSession background profile sync error]:', err);
          });
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('[getSession exception]:', err);
        if (isSubscribed) {
          setAuthError('Unable to connect to authentication server.');
        }
      } finally {
        initialCheckResolved = true;
        if (splashTimeoutTimer) {
          clearTimeout(splashTimeoutTimer);
          splashTimeoutTimer = null;
        }
        if (isSubscribed) {
          setAuthLoading(false);
          setProfileSyncing(false);
        }
      }
    };

    initSession();

    // 2. Real-time Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;

      // Ignore INITIAL_SESSION event because initSession() handles initial load deterministically with full profile sync
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (splashTimeoutTimer) {
        clearTimeout(splashTimeoutTimer);
        splashTimeoutTimer = null;
      }

      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY')) {
        await processAuthUser(user, event);
      } else if (!user) {
        setUserProfile(null);
      }

      setAuthLoading(false);
      setAuthTimedOut(false);
      setAuthError(null);
    });

    return () => {
      isSubscribed = false;
      if (splashTimeoutTimer) {
        clearTimeout(splashTimeoutTimer);
      }
      subscription.unsubscribe();
    };
  }, []);

  // Protected page session retention (do not force sign-out on temporary network errors)
  const lastUserVerificationRef = useRef<number>(Date.now());

  // Listen for permanent user deletion events across tabs/windows
  useEffect(() => {
    const handleUserDeleted = (e: any) => {
      const { studentId, studentEmail } = e?.detail || {};
      if (
        (studentId && currentUser?.id === studentId) ||
        (studentEmail && currentUser?.email && currentUser.email.toLowerCase() === studentEmail.toLowerCase())
      ) {
        console.warn('[User Session] Current user was permanently deleted. Wiping local session and signing out...');
        clearAllClientAuthAndSessionData();
        supabase.auth.signOut().finally(() => {
          setCurrentUser(null);
          setUserProfile(null);
          setScreen('auth');
        });
      }
    };
    window.addEventListener('boardly_user_permanently_deleted', handleUserDeleted);
    return () => window.removeEventListener('boardly_user_permanently_deleted', handleUserDeleted);
  }, [currentUser?.id, currentUser?.email]);

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return loadHistoryOffline(currentUser?.id);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    saveHistoryOffline(history, currentUser?.id);
  }, [history, currentUser?.id]);

  useEffect(() => {
    let isMounted = true;
    if (currentUser?.id) {
      const offlineItems = loadHistoryOffline(currentUser.id);
      fetchUserTestHistoryFromSupabase(currentUser.id, currentUser.email).then((remoteHistory) => {
        if (!isMounted) return;
        setHistory((prev) => {
          const map = new Map<string, HistoryItem>();
          // 1. Put local offline items into map
          for (const item of offlineItems) {
            if (item && item.id) map.set(item.id, item);
          }
          // 2. Put existing state items into map
          for (const item of prev) {
            if (item && item.id) map.set(item.id, item);
          }
          // 3. Merge remote history if available
          if (remoteHistory && Array.isArray(remoteHistory) && remoteHistory.length > 0) {
            for (const item of remoteHistory) {
              if (item && item.id) map.set(item.id, item);
            }
          }
          return Array.from(map.values()).slice(0, 50);
        });
      }).catch((err) => {
        console.warn('Failed to fetch user history from Supabase:', err);
      });
    } else {
      setHistory((prev) => {
        const offlineItems = loadHistoryOffline();
        const map = new Map<string, HistoryItem>();
        for (const item of offlineItems) {
          if (item && item.id) map.set(item.id, item);
        }
        for (const item of prev) {
          if (item && item.id) map.set(item.id, item);
        }
        return Array.from(map.values()).slice(0, 50);
      });
    }
    return () => { isMounted = false; };
  }, [currentUser?.id, currentUser?.email]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchStudentMcqUsage(currentUser.id, currentUser.email, userProfile).then((info) => {
        setMcqUsageCount(info.currentUsage || 0);
      }).catch(() => {});
    }
  }, [currentUser?.id, currentUser?.email, userProfile?.id, userProfile?.tests_used_this_month, history.length]);

  const currentMonthlyTestCount = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthHistoryCount = history.filter(item => {
      let itemDate: Date | null = null;
      if (item.id) {
        if (item.id.startsWith('res-')) {
          const ts = parseInt(item.id.replace('res-', ''), 10);
          if (!isNaN(ts)) itemDate = new Date(ts);
        } else if (item.id.startsWith('tr-')) {
          const parts = item.id.split('-');
          if (parts.length >= 2) {
            const ts = parseInt(parts[1], 10);
            if (!isNaN(ts) && ts > 1000000000000) itemDate = new Date(ts);
          }
        }
      }
      if (!itemDate && item.dateStr) {
        const d = new Date(item.dateStr);
        if (!isNaN(d.getTime())) itemDate = d;
      }
      if (itemDate && !isNaN(itemDate.getTime())) {
        return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
      }
      return false;
    }).length;

    const profileTestsUsed = Number(userProfile?.tests_used_this_month || 0);
    return Math.max(mcqUsageCount, profileTestsUsed, currentMonthHistoryCount);
  }, [history, mcqUsageCount, userProfile?.tests_used_this_month]);

  const usedTestAttempts = 0;
  const isTestLimitReached = false;

  const handleClearHistory = async () => {
    if (currentUser?.id) {
      const res = await clearUserTestHistoryInSupabase(currentUser.id);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete test history from cloud database.');
      }
      // Re-fetch directly from Supabase to confirm data is removed from server
      const confirmedRemote = await fetchUserTestHistoryFromSupabase(currentUser.id);
      setHistory(confirmedRemote);
      clearHistoryOffline(currentUser.id);
    } else {
      setHistory([]);
      clearHistoryOffline();
    }
  };

  // Compute Trail Step
  const getStepNumber = (): number => {
    switch (screen) {
      case 'intro':
        return 0;
      case 'grades_flow':
        return 1;
      case 'group':
        return 2;
      case 'dashboard':
      case 'subject':
        return 3;
      case 'duration':
      case 'auth':
        return 4;
      default:
        return 0;
    }
  };

  const handleExitTestSession = useCallback(() => {
    isExitingTestRef.current = true;
    const sessionToClose = activeTestSessionId;
    const uId = currentUser?.id || 'guest';
    const uEmail = currentUser?.email;

    try {
      localStorage.removeItem('boardly_active_test_session');
      sessionStorage.removeItem('boardly_active_test_session');
      localStorage.removeItem('boardly_active_test_answers');
      localStorage.removeItem('boardly_active_test_time');
      localStorage.setItem('boardly_active_screen', currentUser ? 'dashboard' : 'intro');
    } catch {}

    setTestSessionProgress(null);
    setActiveQuestions([]);
    setTestConfig(null);
    setActiveTestSessionId(null);
    setTestResult(null);

    const targetScreen = currentUser ? 'dashboard' : 'intro';
    setScreen(targetScreen);

    try {
      const newUrl = new URL(window.location.href);
      if (newUrl.searchParams.get('screen') === 'test') {
        newUrl.searchParams.delete('screen');
        if (targetScreen !== 'intro') {
          newUrl.searchParams.set('screen', targetScreen);
        }
        window.history.replaceState({ screen: targetScreen }, '', newUrl.toString());
      }
    } catch {}

    apiFetch('/api/finish-test-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uId,
        userEmail: uEmail,
        sessionId: sessionToClose,
      }),
    }).catch(() => {});
  }, [activeTestSessionId, currentUser]);

  const handleCancelGeneration = useCallback(() => {
    if (mcqAbortControllerRef.current) {
      mcqAbortControllerRef.current.abort();
      mcqAbortControllerRef.current = null;
    }
    if (bgMcqAbortControllerRef.current) {
      bgMcqAbortControllerRef.current.abort();
      bgMcqAbortControllerRef.current = null;
    }
    setIsGenerating(false);
    setPendingTestParams(null);
    setLeaveModalConfig(null);
  }, []);

  const confirmExitTestIfActive = (proceedAction?: () => void): boolean => {
    if (isGeneratingRef.current) {
      setLeaveModalConfig({
        isOpen: true,
        title: 'Leave this page?',
        message: 'Question generation is still in progress and will be lost.',
        stayLabel: 'Stay',
        leaveLabel: 'Leave Anyway',
        onConfirm: () => {
          handleCancelGeneration();
          if (proceedAction) proceedAction();
        },
      });
      return false;
    }
    if (screen === 'test') {
      setLeaveModalConfig({
        isOpen: true,
        title: 'Exit Test?',
        message: 'Exiting will count this test as a used attempt and your current progress will be lost. Are you sure you want to exit and return to the dashboard?',
        stayLabel: 'Stay',
        leaveLabel: 'Leave Anyway',
        onConfirm: () => {
          handleExitTestSession();
          if (proceedAction) proceedAction();
        },
      });
      return false;
    }
    if (proceedAction) {
      proceedAction();
    }
    return true;
  };

  const handleGlobalBackInternal = () => {
    const scr = screenRef.current;
    const isStudent = Boolean(currentUserRef.current && !isAdminRef.current);

    switch (scr) {
      case 'grades_flow':
        setScreen(isStudent ? 'dashboard' : 'intro');
        break;
      case 'group':
        setScreen('grades_flow');
        break;
      case 'subject':
        setScreen(isStudent ? 'dashboard' : 'group');
        break;
      case 'duration':
        setScreen('subject');
        break;
      case 'dashboard':
        setScreen('intro');
        break;
      case 'auth':
        setScreen(authBackScreenRef.current || 'grades_flow');
        break;
      case 'test':
        setLeaveModalConfig({
          isOpen: true,
          title: 'Exit Test?',
          message: 'Exiting will count this test as a used attempt and your current progress will be lost. Are you sure you want to exit and return to the dashboard?',
          stayLabel: 'Stay',
          leaveLabel: 'Leave Anyway',
          onConfirm: () => {
            handleExitTestSession();
          },
        });
        break;
      case 'results':
        setScreen(isStudent ? 'dashboard' : 'intro');
        break;
      case 'admin':
        setScreen('intro');
        break;
      default:
        setScreen('intro');
    }
  };

  const handleGlobalBack = () => {
    if (showLmsModal) { closeLmsModal(); return; }
    if (showPrintModal) { closePrintModal(); return; }
    if (showHistoryModal) { closeHistoryModal(); return; }
    if (showCommunityModal) { closeCommunityModal(); return; }

    if (isGeneratingRef.current) {
      setLeaveModalConfig({
        isOpen: true,
        title: 'Leave this page?',
        message: 'Question generation is still in progress and will be lost.',
        stayLabel: 'Stay',
        leaveLabel: 'Leave Anyway',
        onConfirm: () => {
          handleCancelGeneration();
          handleGlobalBackInternal();
        },
      });
      return;
    }

    if (screen === 'test') {
      setLeaveModalConfig({
        isOpen: true,
        title: 'Exit Test?',
        message: 'Exiting will count this test as a used attempt and your current progress will be lost. Are you sure you want to exit and return to the dashboard?',
        stayLabel: 'Stay',
        leaveLabel: 'Leave Anyway',
        onConfirm: () => {
          handleExitTestSession();
        },
      });
      return;
    }

    if (window.history.state && !window.history.state.isRoot) {
      window.history.back();
    } else {
      handleGlobalBackInternal();
    }
  };

  const handleSelectClass = (cNum: BoardClass, targetGroup?: string) => {
    sessionStorage.setItem('shs_intended_class', String(cNum));
    localStorage.setItem('shs_intended_class', String(cNum));

    if (cNum === 'MDCAT') {
      setSelectedClass('MDCAT');
      setSelectedGroup('MDCAT');
      sessionStorage.setItem('shs_intended_group', 'MDCAT');
      localStorage.setItem('shs_intended_group', 'MDCAT');
      setScreen('subjects');
      return;
    }
    if (cNum === 'TCAT') {
      setSelectedClass('TCAT');
      setSelectedGroup('TCAT');
      sessionStorage.setItem('shs_intended_group', 'TCAT');
      localStorage.setItem('shs_intended_group', 'TCAT');
      setScreen('subjects');
      return;
    }

    // All university entrance tracks go directly to their dedicated dashboard portal
    const entranceTracks: BoardClass[] = [
      'NET', 'FAST', 'ECAT', 'ETEA', 'NUMS', 'GIKI', 'USAT',
      'NED', 'PIEAS', 'NAT', 'IBA', 'AKU', 'MUET', 'LUMS',
      'NUML', 'HITEC', 'NUTECH'
    ];
    if (entranceTracks.includes(cNum)) {
      setSelectedClass(cNum);
      const grp = targetGroup || String(cNum);
      setSelectedGroup(grp);
      sessionStorage.setItem('shs_intended_group', grp);
      localStorage.setItem('shs_intended_group', grp);
      setScreen('subjects');
      return;
    }

    setSelectedClass(cNum);
    if (targetGroup && (cNum === 9 || cNum === 10)) {
      setSelectedGroup(targetGroup);
      sessionStorage.setItem('shs_intended_group', targetGroup);
      localStorage.setItem('shs_intended_group', targetGroup);
      setScreen('subjects');
      return;
    }
    setScreen('group');
  };

  const handleSelectGroup = (group: string) => {
    sessionStorage.setItem('shs_intended_group', group);
    localStorage.setItem('shs_intended_group', group);
    setSelectedGroup(group);

    if (currentUser) {
      setScreen('dashboard');
    } else {
      setNextScreenAfterAuth('dashboard');
      setAuthBackScreen('group');
      setScreen('auth');
    }
  };

  const handleSelectSubject = (subject: string, topic?: string) => {
    setSelectedSubject(subject);
    setCustomTopic(topic);
    setScreen('duration');
  };

  const [bgGenError, setBgGenError] = useState<string | null>(null);

  const startBackgroundGeneration = async (
    fullParams: any,
    initialQuestions: Question[],
    targetTotalCount: number,
    isMdcat: boolean,
    sessionIdParam?: string
  ) => {
    setBgGenError(null);
    if (bgMcqAbortControllerRef.current) {
      bgMcqAbortControllerRef.current.abort();
    }
    const bgAbort = new AbortController();
    bgMcqAbortControllerRef.current = bgAbort;

    const { data: { session } } = await supabase.auth.getSession();
    const activeUser = session?.user || currentUser;
    const targetSubject = mapSubject(fullParams.subject || selectedSubject || 'Physics');
    const targetTopic = fullParams.customTopic !== undefined ? fullParams.customTopic : customTopic;

    // Entrance tracks use strictly verified pre-written questions and must NEVER invoke AI/API background generation
    const entrancePaths = ['mdcat', 'tcat', 'net', 'fast', 'ecat', 'etea', 'nums', 'giki', 'usat', 'ned', 'pieas', 'nat', 'iba', 'aku', 'muet', 'lums', 'numl', 'hitec', 'nutech'];
    const pathLower = String(fullParams?.path || '').toLowerCase();
    const classLower = String(selectedClass || '').toLowerCase();
    const groupLower = String(selectedGroup || '').toLowerCase();
    const subLower = String(fullParams?.subject || targetSubject || '').toLowerCase();
    const isEntrance = isMdcat || fullParams?.isMdcat || entrancePaths.some(p => pathLower.includes(p) || classLower.includes(p) || groupLower.includes(p) || subLower.includes(p));
    if (isEntrance) {
      console.log('[MCQ Background Gen] Entrance track detected: strictly bypassing AI generation, relying solely on verified question bank.');
      return;
    }

    let currentQuestions = [...initialQuestions];

    while (currentQuestions.length < targetTotalCount && !bgAbort.signal.aborted) {
      const nextBatchCount = Math.min(5, targetTotalCount - currentQuestions.length);
      const existingStems = currentQuestions.map((q) => q.q);
      let batchAppended = false;

      // Retry up to 3 times per batch with exponential backoff & timeout
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (bgAbort.signal.aborted) break;
        try {
          const bgStartMs = Date.now();
          console.log(`[MCQ Background Gen Attempt ${attempt}/3] Requesting ${nextBatchCount} questions for "${targetSubject}" (current: ${currentQuestions.length}/${targetTotalCount})`);

          const fetchPromise = apiFetch('/api/generate-mcqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: bgAbort.signal,
            body: JSON.stringify({
              subject: targetSubject,
              customTopic: targetTopic,
              subtopic: fullParams.subtopic,
              chapterName: fullParams.chapterName,
              path: isMdcat ? 'mdcat' : 'boards',
              classNum: selectedClass,
              group: selectedGroup,
              questionCount: nextBatchCount,
              batchOffset: currentQuestions.length,
              excludeStems: existingStems,
              difficulty: fullParams.difficulty,
              mode: fullParams.mode,
              userId: activeUser?.id || 'guest',
              userEmail: activeUser?.email,
              bypassCache: currentQuestions.length >= 15 || fullParams.bypassCache || false,
              isFullMock: fullParams.isFullMock || false,
              groupSubjects: fullParams.groupSubjects,
              isBackgroundBatch: true,
              sessionId: sessionIdParam || activeTestSessionId,
            }),
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            const timer = setTimeout(() => reject(new Error('Live question fetch timed out after 15 seconds')), 15000);
            bgAbort.signal.addEventListener('abort', () => clearTimeout(timer));
          });

          const response = await Promise.race([fetchPromise, timeoutPromise]);

          if (bgAbort.signal.aborted) break;

          console.log(`[MCQ Background Gen Attempt ${attempt}/3] Received HTTP response code: ${response.status} (${response.statusText})`);

          if (!response.ok) {
            const rawText = await response.text();
            console.error(`[MCQ Background Gen HTTP Error ${response.status}] Attempt ${attempt}/3 raw body:`, rawText);
            if (response.status === 403) {
              try {
                const parsedErr = JSON.parse(rawText);
                console.warn('[MCQ Background Generation - Limit Reached Server-Side]:', parsedErr?.error || parsedErr?.message);
              } catch {}
              setIsGenerating(false);
              break;
            }
            throw new Error(`Server returned HTTP status ${response.status}: ${rawText.substring(0, 150)}`);
          }

          const data = await safeJsonResponse(response);

          if (data?.limitExceeded) {
            console.warn('[MCQ Background Generation - Limit Reached Server-Side]:', data?.error || data?.message);
            setIsGenerating(false);
            break;
          }

          if (data?.success && Array.isArray(data.questions) && data.questions.length > 0) {
            const isUrduOrIslamiat = ['urdu', 'islam', 'din'].some((s) => targetSubject.toLowerCase().includes(s));

            let batchValidated: Question[] = [];
            const uniqueDataQuestions = deduplicateQuestions<Question>(data.questions).filter(
              (q: Question) => !currentQuestions.some((cq) => isDuplicateQuestion(cq, q))
            );

            if (isUrduOrIslamiat) {
              batchValidated = uniqueDataQuestions.filter((q: Question) => {
                const hasUrdu = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(q.q || '');
                const qLower = (q.q || '').toLowerCase();
                const isScience = ["vector", "torque", "mechanics", "newton", "velocity", "acceleration", "physics", "chemistry", "biology", "mitochondria", "derivative"].some((k) => qLower.includes(k));
                return hasUrdu && !isScience && checkQuestionTopicRelevance(q.q || '', q.topic, q.options || [], q.explain || '', targetTopic, targetSubject);
              });
            } else {
              batchValidated = uniqueDataQuestions.filter((q: Question) =>
                checkQuestionTopicRelevance(q.q || '', q.topic, q.options || [], q.explain || '', targetTopic, targetSubject)
              );
            }

            if (batchValidated.length > 0) {
              currentQuestions = deduplicateQuestions([...currentQuestions, ...batchValidated]);
              if (currentQuestions.length > targetTotalCount) {
                currentQuestions = currentQuestions.slice(0, targetTotalCount);
              }
              setActiveQuestions([...currentQuestions]);
              batchAppended = true;
              console.log(`[MCQ Background Batch Appended] Total questions now: ${currentQuestions.length} / ${targetTotalCount}`);
              break; // Success! Exit retry loop
            } else {
              console.warn(`[MCQ Background Gen Attempt ${attempt}/3] Returned ${data.questions.length} questions, but 0 passed topic relevance/duplication checks.`);
            }
          } else {
            console.warn(`[MCQ Background Gen Attempt ${attempt}/3] API response success state was false or returned empty questions array. Debug:`, data?.debug || data);
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') break;
          console.error(`[MCQ Background Gen Attempt ${attempt}/3 Exception]:`, err?.message || err);
        }

        if (attempt < 3 && !bgAbort.signal.aborted) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }

      // If API attempt failed or returned no valid questions after retries, top up from authentic scoped prebuilt pool
      if (!batchAppended && !bgAbort.signal.aborted) {
        console.warn(`[MCQ Background Gen] Fallback topping up for ${targetSubject} at index ${currentQuestions.length}`);
        const { getPrebuiltQuestionsForSubject } = await import('./data/prebuiltQuestions');
        const prebuiltPool = getPrebuiltQuestionsForSubject(
          targetSubject,
          targetTopic,
          selectedClass,
          fullParams.chapterName,
          fullParams.subtopic
        );
        const shuffledPrebuilt = [...prebuiltPool].sort(() => 0.5 - Math.random());
        const fallbackBatch: Question[] = [];
        for (const pbq of shuffledPrebuilt) {
          if (fallbackBatch.length >= nextBatchCount) break;
          if (!currentQuestions.some((cq) => isDuplicateQuestion(cq, pbq)) && !fallbackBatch.some((fb) => isDuplicateQuestion(fb, pbq))) {
            fallbackBatch.push({
              ...pbq,
              id: `bg-fallback-${currentQuestions.length + fallbackBatch.length + 1}-${Date.now()}`,
            });
          }
        }

        if (fallbackBatch.length > 0) {
          currentQuestions = deduplicateQuestions([...currentQuestions, ...fallbackBatch]);
          if (currentQuestions.length > targetTotalCount) {
            currentQuestions = currentQuestions.slice(0, targetTotalCount);
          }
          setActiveQuestions([...currentQuestions]);
          console.log(`[MCQ Background Prebuilt Batch Appended] Total questions now: ${currentQuestions.length} / ${targetTotalCount}`);
        } else {
          console.warn(`[MCQ Background Gen] No additional authentic unique questions available for ${targetSubject} at ${currentQuestions.length}/${targetTotalCount}.`);
          break;
        }
      }

      // Next iteration without artificial delay
    }
  };

  const executeStartTest = async (params: {
    durationMinutes: number;
    questionCount: number;
    difficulty: QuestionDifficulty;
    mode: TestMode;
    instantFeedback: boolean;
    subject?: string;
    customTopic?: string;
    topic?: string;
    subtopic?: string;
    chapterName?: string;
    isFullMock?: boolean;
    groupSubjects?: string[];
  }) => {
    // Immediately set generating loading state for instant UI feedback
    setIsGenerating(true);

    // Cancel any background generation running from previous tests
    if (bgMcqAbortControllerRef.current) {
      bgMcqAbortControllerRef.current.abort();
    }

    // Fetch fresh session to avoid stale closures immediately after auth success
    const { data: { session } } = await supabase.auth.getSession();
    const activeUser = session?.user || currentUser;

    const targetSubject = mapSubject(params.subject || selectedSubject || 'Physics');
    const targetTopic = params.customTopic !== undefined
      ? params.customTopic
      : (params.topic !== undefined
          ? params.topic
          : (params.chapterName
              ? (params.subtopic ? `${params.chapterName} - ${params.subtopic}` : params.chapterName)
              : customTopic));

    // Immediately sync state for downstream consumers
    setSelectedSubject(targetSubject);
    setCustomTopic(targetTopic);

    const subLower = targetSubject.toLowerCase();
    const topicLower = String(params.customTopic || params.topic || '').toLowerCase();
    const chapterLower = String(params.chapterName || '').toLowerCase();
    const classStr = String(selectedClass || '').toUpperCase();
    const groupStr = String(selectedGroup || '').toUpperCase();

    const isMdcat = classStr === 'MDCAT' || groupStr === 'MDCAT' || subLower.includes('mdcat') || topicLower.includes('mdcat') || chapterLower.includes('mdcat');
    const isTcat = classStr === 'TCAT' || groupStr === 'TCAT' || subLower.includes('tcat') || topicLower.includes('tcat') || chapterLower.includes('tcat');
    const isNet = classStr === 'NET' || groupStr.includes('NET') || subLower.includes('net') || topicLower.includes('net') || chapterLower.includes('net');
    const isFast = classStr === 'FAST' || groupStr.includes('FAST') || subLower.includes('fast') || topicLower.includes('fast') || chapterLower.includes('fast');
    const isEcat = classStr === 'ECAT' || groupStr.includes('ECAT') || subLower.includes('ecat') || topicLower.includes('ecat') || chapterLower.includes('ecat');
    const isEtea = classStr === 'ETEA' || groupStr.includes('ETEA') || subLower.includes('etea') || topicLower.includes('etea') || chapterLower.includes('etea');
    const isNums = classStr === 'NUMS' || groupStr.includes('NUMS') || subLower.includes('nums') || topicLower.includes('nums') || chapterLower.includes('nums');
    const isGiki = classStr === 'GIKI' || groupStr.includes('GIKI') || subLower.includes('giki') || topicLower.includes('giki') || chapterLower.includes('giki');
    const isUsat = classStr === 'USAT' || groupStr.includes('USAT') || subLower.includes('usat') || topicLower.includes('usat') || chapterLower.includes('usat');
    const isNed = classStr === 'NED' || groupStr.includes('NED') || subLower.includes('ned') || topicLower.includes('ned') || chapterLower.includes('ned');
    const isPieas = classStr === 'PIEAS' || groupStr.includes('PIEAS') || subLower.includes('pieas') || topicLower.includes('pieas') || chapterLower.includes('pieas');
    const isNat = classStr === 'NAT' || groupStr.includes('NAT') || subLower.includes('nat') || topicLower.includes('nat') || chapterLower.includes('nat');
    const isIba = classStr === 'IBA' || groupStr.includes('IBA') || subLower.includes('iba') || topicLower.includes('iba') || chapterLower.includes('iba');
    const isAku = classStr === 'AKU' || groupStr.includes('AKU') || subLower.includes('aku') || topicLower.includes('aku') || chapterLower.includes('aku');
    const isMuet = classStr === 'MUET' || groupStr.includes('MUET') || subLower.includes('muet') || topicLower.includes('muet') || chapterLower.includes('muet');
    const isLums = classStr === 'LUMS' || groupStr.includes('LUMS') || subLower.includes('lums') || topicLower.includes('lums') || chapterLower.includes('lums');
    const isNuml = classStr === 'NUML' || groupStr.includes('NUML') || subLower.includes('numl') || topicLower.includes('numl') || chapterLower.includes('numl');
    const isHitec = classStr === 'HITEC' || groupStr.includes('HITEC') || subLower.includes('hitec') || topicLower.includes('hitec') || chapterLower.includes('hitec');
    const isNutech = classStr === 'NUTECH' || groupStr.includes('NUTECH') || subLower.includes('nutech') || topicLower.includes('nutech') || chapterLower.includes('nutech');

    const isAnyEntranceTrack = isMdcat || isTcat || isNet || isFast || isEcat || isEtea || isNums || isGiki || isUsat || isNed || isPieas || isNat || isIba || isAku || isMuet || isLums || isNuml || isHitec || isNutech;

    const configPath: any = isMdcat ? 'mdcat' : isTcat ? 'tcat' : isNet ? 'net' : isFast ? 'fast' : isEcat ? 'ecat' : isEtea ? 'etea' : isNums ? 'nums' : isGiki ? 'giki' : isUsat ? 'usat' : isNed ? 'ned' : isPieas ? 'pieas' : isNat ? 'nat' : isIba ? 'iba' : isAku ? 'aku' : isMuet ? 'muet' : isLums ? 'lums' : isNuml ? 'numl' : isHitec ? 'hitec' : isNutech ? 'nutech' : 'boards';

    let config: TestConfig = {
      path: configPath,
      classNum: selectedClass,
      group: selectedGroup,
      subject: targetSubject,
      customTopic: targetTopic,
      durationMinutes: params.durationMinutes,
      questionCount: params.questionCount,
      difficulty: params.difficulty,
      mode: params.mode,
      instantFeedback: params.instantFeedback,
      groupSubjects: params.groupSubjects,
      isFullMock: params.isFullMock,
    };

    setTestConfig(config);

    // Cancel any in-flight MCQ generation request
    if (mcqAbortControllerRef.current) {
      mcqAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    mcqAbortControllerRef.current = abortController;
    const currentReqId = ++mcqRequestIdRef.current;

    const targetTotalCount = Math.max(1, params.questionCount || 10);
    let effectiveTargetTotalCount = targetTotalCount;
    // Initial batch target is 5 questions to guarantee instant UI startup within 10 seconds
    const FIRST_BATCH_READY_THRESHOLD = Math.min(5, targetTotalCount);

    console.log(`[MCQ Progressive Fast Start] Subject: "${targetSubject}", First Batch Target: ${FIRST_BATCH_READY_THRESHOLD}, Total Target: ${targetTotalCount}, isTcat: ${isTcat}`);

    const seenStems = getSeenStemsForStudent(activeUser?.id, targetSubject);
    let isReviewSet = false;
    let reviewNote: string | undefined = undefined;
    let initialSet: Question[] = [];

    // Entrance Tracks: Assemble questions from verified hardcoded banks, prioritizing unseen questions
    if (isTcat) {
      const { generateTCATFullMockBank, getTCATPrebuiltQuestions } = await import('./data/tcatPrebuiltQuestions');
      const isTcatMock = params.isFullMock || targetSubject.toLowerCase().includes('tcat full') || targetSubject.toLowerCase().includes('tcat mock') || targetTotalCount >= 100;
      if (isTcatMock) {
        initialSet = deduplicateQuestions(generateTCATFullMockBank(params.groupSubjects || params.chapterName || targetTopic || targetSubject, seenStems));
      } else {
        initialSet = deduplicateQuestions(getTCATPrebuiltQuestions(targetSubject, targetTotalCount, targetTopic, params.chapterName, params.subtopic, seenStems));
      }

      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isMdcat) {
      const { generateMDCATFullMockBank, getMDCATPrebuiltQuestions } = await import('./data/mdcatPrebuiltQuestions');
      // MDCAT Track: Exclusively assemble questions from verified hardcoded bank, prioritizing unseen questions
      const isMdcatMock = params.isFullMock || targetSubject.toLowerCase().includes('mdcat full') || targetSubject.toLowerCase().includes('full mock') || targetTotalCount >= 180;
      if (isMdcatMock) {
        initialSet = deduplicateQuestions(generateMDCATFullMockBank(seenStems));
      } else {
        initialSet = deduplicateQuestions(getMDCATPrebuiltQuestions(targetSubject, targetTotalCount, targetTopic, params.chapterName, params.subtopic, seenStems));
      }

      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isNet || isFast || isEcat || isEtea || isNums || isGiki || isUsat || isNed || isPieas || isNat || isIba || isAku || isMuet || isLums || isNuml || isHitec || isNutech) {
      const {
        generateNetFullMockBank,
        generateFastFullMockBank,
        generateEcatFullMockBank,
        generateEteaFullMockBank,
        generateNumsFullMockBank,
        generateGikiFullMockBank,
        generateUsatFullMockBank,
        generateNedFullMockBank,
        generatePieasFullMockBank,
        generateNatFullMockBank,
        generateIbaFullMockBank,
        generateAkuFullMockBank,
        generateMuetFullMockBank,
        generateLumsFullMockBank,
        generateNumlFullMockBank,
        generateHitecFullMockBank,
        generateNutechFullMockBank,
        getEntranceExamQuestions,
      } = await import('./data/entranceExamQuestions');
      if (isNet) {
        const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 100;
        if (isMock) {
          initialSet = deduplicateQuestions(generateNetFullMockBank(seenStems));
        } else {
          initialSet = deduplicateQuestions(getEntranceExamQuestions('NET', targetSubject, targetTotalCount, seenStems));
        }
        if (initialSet.length < targetTotalCount) {
          effectiveTargetTotalCount = initialSet.length;
        }
    } else if (isFast) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 80;
      if (isMock) {
        initialSet = deduplicateQuestions(generateFastFullMockBank(seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('FAST', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isEcat) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 90;
      const ecatGroupStr = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (typeof params.groupSubjects === 'string' ? params.groupSubjects : (params.chapterName || selectedGroup || ''));
      if (isMock) {
        initialSet = deduplicateQuestions(generateEcatFullMockBank(ecatGroupStr, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('ECAT', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isEtea) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 90;
      const eteaGroupStr = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (typeof params.groupSubjects === 'string' ? params.groupSubjects : (params.chapterName || selectedGroup || ''));
      if (isMock) {
        initialSet = deduplicateQuestions(generateEteaFullMockBank(eteaGroupStr, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('ETEA', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isNums) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 100;
      if (isMock) {
        initialSet = deduplicateQuestions(generateNumsFullMockBank(seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('NUMS', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isGiki) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      if (isMock) {
        initialSet = deduplicateQuestions(generateGikiFullMockBank(seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('GIKI', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isUsat) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 90;
      const usatGroupStr = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (typeof params.groupSubjects === 'string' ? params.groupSubjects : (params.chapterName || selectedGroup || ''));
      if (isMock) {
        initialSet = deduplicateQuestions(generateUsatFullMockBank(usatGroupStr, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('USAT', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isNed) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      if (isMock) {
        initialSet = deduplicateQuestions(generateNedFullMockBank(seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('NED', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isPieas) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      const pieasStream = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (params.chapterName || selectedGroup || 'Pre-Engineering');
      if (isMock) {
        initialSet = deduplicateQuestions(generatePieasFullMockBank(pieasStream, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('PIEAS', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isNat) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      const natCategory = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (params.chapterName || selectedGroup || 'NAT-IE');
      if (isMock) {
        initialSet = deduplicateQuestions(generateNatFullMockBank(natCategory, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('NAT', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isIba) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      if (isMock) {
        initialSet = deduplicateQuestions(generateIbaFullMockBank(seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('IBA', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isAku) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      if (isMock) {
        initialSet = deduplicateQuestions(generateAkuFullMockBank(seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('AKU', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isMuet) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      const muetStream = Array.isArray(params.groupSubjects)
        ? (params.groupSubjects.some(s => s.toLowerCase().includes('bio')) ? 'Pre-Medical' : (params.groupSubjects.some(s => s.toLowerCase().includes('comp') || s.toLowerCase().includes('cs')) ? 'ICS' : 'Pre-Engineering'))
        : (params.chapterName || selectedGroup || 'Pre-Engineering');
      if (isMock) {
        initialSet = deduplicateQuestions(generateMuetFullMockBank(muetStream, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('MUET', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isLums) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      const lumsPath = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (params.chapterName || selectedGroup || 'LCAT');
      if (isMock) {
        initialSet = deduplicateQuestions(generateLumsFullMockBank(lumsPath, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('LUMS', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isNuml) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 50;
      const numlStream = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (params.chapterName || selectedGroup || 'Engineering & CS');
      if (isMock) {
        initialSet = deduplicateQuestions(generateNumlFullMockBank(numlStream, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('NUML', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isHitec) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      const hitecStream = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (params.chapterName || selectedGroup || 'Engineering');
      if (isMock) {
        initialSet = deduplicateQuestions(generateHitecFullMockBank(hitecStream, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('HITEC', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isNutech) {
      const isMock = params.isFullMock || targetSubject.toLowerCase().includes('mock') || targetTotalCount >= 60;
      const nutechStream = Array.isArray(params.groupSubjects) ? params.groupSubjects.join(' ') : (params.chapterName || selectedGroup || 'Engineering');
      if (isMock) {
        initialSet = deduplicateQuestions(generateNutechFullMockBank(nutechStream, seenStems));
      } else {
        initialSet = deduplicateQuestions(getEntranceExamQuestions('NUTECH', targetSubject, targetTotalCount, seenStems));
      }
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    }
  } else {
      // 1. Instantly assemble initial questions from cache & prebuilt bank, prioritizing unseen questions
      const { getPrebuiltQuestionsForSubject } = await import('./data/prebuiltQuestions');
      const cached = getCachedQuestions(targetSubject, targetTopic) || [];
      const prebuiltPool = getPrebuiltQuestionsForSubject(targetSubject, targetTopic, selectedClass, params.chapterName, params.subtopic, seenStems);
      const combinedPool = deduplicateQuestions([...cached, ...prebuiltPool]);

      if (combinedPool.length > 0) {
        const prioritized = selectPrioritizedQuestions(combinedPool, targetTotalCount, seenStems);
        initialSet = prioritized.selected;
        isReviewSet = prioritized.isReviewSet;
        reviewNote = prioritized.reviewNote;
        if (initialSet.length < targetTotalCount) {
          effectiveTargetTotalCount = initialSet.length;
        }
      }

      // If initialSet is empty (no cache or prebuilt questions), fetch the first batch directly from API
      if (initialSet.length === 0) {
        try {
          console.log(`[MCQ Start] No prebuilt/cached questions for "${targetSubject}" - "${targetTopic}". Fetching live first batch (${FIRST_BATCH_READY_THRESHOLD} questions) from API...`);
          const fetchCount = FIRST_BATCH_READY_THRESHOLD;
          let liveSuccess = false;

          for (let liveAttempt = 1; liveAttempt <= 2; liveAttempt++) {
            if (liveSuccess || abortController.signal.aborted) break;
            try {
              const apiStartMs = Date.now();
              console.log(`[MCQ Start Live Fetch Attempt ${liveAttempt}/2] Requesting ${fetchCount} questions for "${targetSubject}" - "${targetTopic}"`);
              const fetchRes = await apiFetch('/api/generate-mcqs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortController.signal,
                body: JSON.stringify({
                  subject: targetSubject,
                  customTopic: targetTopic,
                  subtopic: params.subtopic,
                  chapterName: params.chapterName,
                  path: isMdcat ? 'mdcat' : 'boards',
                  classNum: selectedClass,
                  group: selectedGroup,
                  questionCount: fetchCount,
                  difficulty: params.difficulty,
                  mode: params.mode,
                  userId: activeUser?.id || 'guest',
                  userEmail: activeUser?.email,
                  excludeStems: Array.from(seenStems),
                  isFirstBatch: true,
                }),
              });

              const apiElapsedMs = Date.now() - apiStartMs;
              if (fetchRes.ok) {
                const fetchData = await safeJsonResponse(fetchRes);
                console.log(`[MCQ Initial Batch Latency] HTTP Roundtrip: ${apiElapsedMs}ms | Qs: ${fetchData?.questions?.length || 0}`);
                if (fetchData?.success && Array.isArray(fetchData.questions) && fetchData.questions.length > 0) {
                  initialSet = deduplicateQuestions<Question>(fetchData.questions).slice(0, targetTotalCount);
                  liveSuccess = true;
                  break;
                }
              } else {
                const errData = await safeJsonResponse(fetchRes).catch(() => null);
                console.warn(`[MCQ Live Fetch Non-OK Status ${fetchRes.status}]:`, errData);
              }
            } catch (attemptErr: any) {
              console.warn(`[MCQ Live Fetch Attempt ${liveAttempt} Error]:`, attemptErr?.message || attemptErr);
              if (liveAttempt < 2) {
                await new Promise((r) => setTimeout(r, 1000));
              }
            }
          }
        } catch (liveFetchErr) {
          console.error('[MCQ Start Live Fetch Error]:', liveFetchErr);
        }
      }

      if (initialSet.length === 0) {
        // Fallback: fetch without seen filter to serve revision set
        const { getPrebuiltQuestionsForSubject } = await import('./data/prebuiltQuestions');
        const fallback = getPrebuiltQuestionsForSubject(targetSubject, targetTopic, selectedClass, params.chapterName, params.subtopic);
        if (fallback.length > 0) {
          initialSet = fallback;
          isReviewSet = true;
          reviewNote = "You have completed all questions in this bank! Serving revision set.";
        }
      }

      if (initialSet.length === 0) {
        setIsGenerating(false);
        setGenerationError({
          isOpen: true,
          subject: targetSubject,
          topic: targetTopic,
          params,
          errorMessage: 'Unable to formulate verified questions for this specific subtopic right now.',
        });
        return;
      }

      // If authentic questions are fewer than targetTotalCount, adjust target to actual available count rather than injecting fake/duplicate questions
      if (initialSet.length < targetTotalCount && params.mode !== 'ai-custom') {
        effectiveTargetTotalCount = initialSet.length;
      }
    }

    // Ensure readyQuestions only contains authentic, deduplicated questions
    const readyQuestions = deduplicateQuestions(initialSet.slice(0, effectiveTargetTotalCount)).map(shuffleQuestionOptions);

    // Record questions as seen for this student to ensure subsequent attempts pull fresh questions
    recordQuestionsAsSeen(activeUser?.id, readyQuestions, targetSubject, targetTopic, params.chapterName);

    // Update config with the exact effective question count so total question indicators match exactly
    config = {
      path: configPath,
      classNum: selectedClass,
      group: selectedGroup,
      subject: targetSubject,
      customTopic: targetTopic,
      durationMinutes: params.durationMinutes,
      questionCount: readyQuestions.length,
      difficulty: params.difficulty,
      mode: params.mode,
      instantFeedback: params.instantFeedback,
      groupSubjects: params.groupSubjects,
      isFullMock: params.isFullMock,
      isReviewSet,
      reviewNote,
    };
    setTestConfig(config);

    // Register active session on server FIRST and enforce monthly test limits strictly
    let activeSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    try {
      const startRes = await apiFetch('/api/start-test-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser?.id || 'guest',
          userEmail: activeUser?.email,
          config,
          questions: readyQuestions,
        }),
      });
      const startData = await safeJsonResponse(startRes);

      if (startRes.status === 403 || startData?.limitExceeded || startData?.grandMockRestricted) {
        console.warn('[executeStartTest - Server Limit Exceeded]:', startData?.error || startData?.message);
        setIsGenerating(false);
        if (startData?.grandMockRestricted) {
          setScreen('plan_selection');
          return;
        }
        const resetDate = startData?.resetDate || testLimitResetDate;
        if (startData?.resetDate) setTestLimitResetDate(startData.resetDate);
        const usageToPass = Math.max(currentMonthlyTestCount, startData?.currentUsage ?? 0);
        openTestLimitModal(resetDate, usageToPass);
        return;
      }

      if (startData?.sessionId) {
        activeSessionId = startData.sessionId;
      }
    } catch (startErr) {
      console.warn('[executeStartTest start-test-session call warning]:', startErr);
    }

    // Note: Completed test count is tracked only upon completion in handleFinishTest, not on start
    isExitingTestRef.current = false;
    setActiveTestSessionId(activeSessionId);
    setActiveQuestions(readyQuestions);

    const initialProgress = {
      currentIndex: 0,
      userAnswers: {},
      timeLeftSeconds: config.durationMinutes * 60,
    };
    setTestSessionProgress(initialProgress);

    const sessionObj = {
      sessionId: activeSessionId,
      userId: activeUser?.id || 'guest',
      userEmail: activeUser?.email,
      testConfig: config,
      activeQuestions: readyQuestions,
      currentIndex: 0,
      userAnswers: {},
      timeLeftSeconds: config.durationMinutes * 60,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem('boardly_active_test_session', JSON.stringify(sessionObj));
    } catch {}

    // Immediately open test screen for the student!
    setScreen('test');
    setIsGenerating(false);
    setPendingTestParams(null);

    // 2. Launch background generation to fetch fresh AI-generated questions asynchronously (strictly disabled for entrance exam tracks which have complete authentic banks)
    if (!isAnyEntranceTrack && effectiveTargetTotalCount > readyQuestions.length) {
      startBackgroundGeneration(params, readyQuestions, effectiveTargetTotalCount, isMdcat, activeSessionId);
    }
  };

  const handleStartTest = async (params: {
    durationMinutes: number;
    questionCount: number;
    difficulty: QuestionDifficulty;
    mode: TestMode;
    instantFeedback: boolean;
    subject?: string;
    customTopic?: string;
    topic?: string;
    subtopic?: string;
    chapterName?: string;
    groupSubjects?: string[];
    isFullMock?: boolean;
  }) => {
    if (isGenerating) {
      return;
    }

    // Require sign-in before starting tests so free allowances are tracked to real accounts
    if (!currentUser) {
      setIsGenerating(false);
      setPendingTestParams(params);
      setScreen('auth');
      return;
    }

    // Immediately trigger loading feedback for 1st tap
    setIsGenerating(true);

    const targetSub = mapSubject(params.subject || selectedSubject || 'Physics');
    const targetTop = params.customTopic !== undefined
      ? params.customTopic
      : (params.topic !== undefined
          ? params.topic
          : (params.chapterName
              ? (params.subtopic ? `${params.chapterName} - ${params.subtopic}` : params.chapterName)
              : customTopic));
    const fullParams = { ...params, subject: targetSub, customTopic: targetTop };

    setSelectedSubject(targetSub);
    setCustomTopic(targetTop);
    setPendingTestParams(fullParams);

    if (currentUser) {
      if (!isAdmin) {
        // ALWAYS re-fetch current profile from database to pick up manual admin plan changes
        let freshProfile: StudentProfile | null = null;
        try {
          freshProfile = await fetchStudentProfileFromSupabase(currentUser.id, true, currentUser.email);
          if (freshProfile) {
            setUserProfile(freshProfile);
          }
        } catch (pErr) {
          console.warn('[handleStartTest] Error re-fetching profile:', pErr);
        }

        const effectiveProfile = freshProfile || userProfile;
        const isStudentPro = checkIsStudentProOrPaid(effectiveProfile, isAdmin);

        if (!isStudentPro) {
          // Free tier students proceed directly to test execution without automatic payment modal redirect
        }
      }
      await executeStartTest(fullParams);
    } else {
      setIsGenerating(false);
      setScreen('auth');
    }
  };

  const handleFinishTest = async (userAnswers: UserAnswer[], timeTakenSeconds: number) => {
    try {
      const effectiveConfig: TestConfig = testConfig || {
        path: selectedClass === 'MDCAT' ? 'mdcat' : 'boards',
        subject: selectedSubject || 'Physics',
        classNum: selectedClass || 9,
        group: selectedGroup,
        durationMinutes: 10,
        questionCount: activeQuestions.length || 10,
        difficulty: 'Exam Standard',
        mode: 'instant',
        instantFeedback: true,
      };

      // Strictly evaluate against the questions the student actually took; never inject questions after the test
      const finalQuestions = [...activeQuestions].filter((q) => q && typeof q === 'object');

      let correctCount = 0;
      const topicBreakdown: Record<string, { total: number; correct: number }> = {};

      finalQuestions.forEach((q, idx) => {
        if (!q) return;
        const ans = userAnswers[idx];
        const topicName = q.topic || effectiveConfig.subject;

        if (!topicBreakdown[topicName]) {
          topicBreakdown[topicName] = { total: 0, correct: 0 };
        }
        topicBreakdown[topicName].total += 1;

        if (ans && ans.selectedOption === q.correct) {
          correctCount += 1;
          topicBreakdown[topicName].correct += 1;
        }
      });

      const total = finalQuestions.length || 1;
      const wrongCount = total - correctCount;

      const isFastExam = effectiveConfig.path === 'fast' || String(effectiveConfig.classNum).toUpperCase().includes('FAST') || String(effectiveConfig.group).toUpperCase().includes('FAST');
      const isEcatExam = effectiveConfig.path === 'ecat' || String(effectiveConfig.classNum).toUpperCase().includes('ECAT') || String(effectiveConfig.group).toUpperCase().includes('ECAT');

      let calculatedScore = correctCount;
      let percentage = Math.round((correctCount / total) * 100);

      if (isFastExam) {
        // FAST: Negative marking of -0.25 per wrong answer
        calculatedScore = Math.max(0, Math.round((correctCount - (wrongCount * 0.25)) * 100) / 100);
        percentage = Math.max(0, Math.round((calculatedScore / total) * 100));
      } else if (isEcatExam) {
        // ECAT: 4 marks per correct answer (Total: 400 marks for 100 MCQs)
        calculatedScore = correctCount * 4;
        percentage = Math.round((correctCount / total) * 100);
      }

      const result: TestResult = {
        id: `res-${Date.now()}`,
        timestamp: Date.now(),
        config: effectiveConfig,
        score: calculatedScore,
        total: isEcatExam ? total * 4 : total,
        percentage,
        timeTakenSeconds,
        topicBreakdown,
        userAnswers,
        questions: finalQuestions,
      };

      setTestResult(result);

      // Save to history with track prefix
      let trackPrefix = '';
      if (effectiveConfig.path === 'mdcat' || effectiveConfig.group === 'MDCAT' || String(effectiveConfig.classNum) === 'MDCAT') {
        trackPrefix = 'MDCAT — ';
      } else if (effectiveConfig.path === 'tcat' || effectiveConfig.group === 'TCAT' || String(effectiveConfig.classNum) === 'TCAT') {
        trackPrefix = 'TCAT — ';
      } else if (effectiveConfig.path === 'net' || effectiveConfig.group === 'NET' || String(effectiveConfig.classNum) === 'NET') {
        trackPrefix = 'NET — ';
      } else if (effectiveConfig.path === 'fast' || effectiveConfig.group === 'FAST' || String(effectiveConfig.classNum) === 'FAST') {
        trackPrefix = 'FAST — ';
      } else if (effectiveConfig.path === 'ecat' || effectiveConfig.group === 'ECAT' || String(effectiveConfig.classNum) === 'ECAT') {
        trackPrefix = 'ECAT — ';
      } else if (effectiveConfig.path === 'etea' || effectiveConfig.group === 'ETEA' || String(effectiveConfig.classNum) === 'ETEA') {
        trackPrefix = 'ETEA — ';
      } else if (effectiveConfig.path === 'nums' || effectiveConfig.group === 'NUMS' || String(effectiveConfig.classNum) === 'NUMS') {
        trackPrefix = 'NUMS — ';
      } else if (effectiveConfig.path === 'giki' || effectiveConfig.group === 'GIKI' || String(effectiveConfig.classNum) === 'GIKI') {
        trackPrefix = 'GIKI — ';
      } else if (effectiveConfig.path === 'usat' || effectiveConfig.group === 'USAT' || String(effectiveConfig.classNum) === 'USAT') {
        trackPrefix = 'USAT — ';
      }
      const pathLabel = trackPrefix + (effectiveConfig.chapterName || effectiveConfig.customTopic || `Class ${effectiveConfig.classNum || '9-12'}`);

      const now = new Date();
      const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const historyItem: HistoryItem = {
        id: result.id,
        dateStr: localDateStr,
        subject: effectiveConfig.subject + (effectiveConfig.customTopic ? ` (${effectiveConfig.customTopic})` : ''),
        pathLabel,
        percentage,
        score: correctCount,
        total,
        timeTaken: `${Math.floor(timeTakenSeconds / 60)}m ${timeTakenSeconds % 60}s`,
      };

      setHistory((prev) => {
        const nextHistory = [historyItem, ...prev.slice(0, 49)];
        saveHistoryOffline(nextHistory, currentUser?.id);
        return nextHistory;
      });
      setMcqUsageCount((prev) => prev + 1);

      // Record questions as seen for this student
      recordQuestionsAsSeen(
        currentUser?.id,
        finalQuestions,
        effectiveConfig.subject,
        effectiveConfig.customTopic,
        effectiveConfig.chapterName
      );

      // Switch to results screen immediately
      setScreen('results');

      // Save to Supabase and log MCQ attempts for student weakness profile in background
      const studentIdToLog = currentUser?.id || 'guest-student-1';
      const sessionToPass = activeTestSessionId || undefined;
      saveTestToSupabase(studentIdToLog, historyItem, result, currentUser?.email, sessionToPass)
        .then(() => fetchUserTestHistoryFromSupabase(studentIdToLog, currentUser?.email))
        .then((updatedHistory) => {
          if (updatedHistory && Array.isArray(updatedHistory) && updatedHistory.length > 0) {
            setHistory((prev) => {
              const map = new Map<string, HistoryItem>();
              map.set(historyItem.id, historyItem);
              for (const h of updatedHistory) {
                if (!map.has(h.id)) map.set(h.id, h);
              }
              for (const h of prev) {
                if (!map.has(h.id)) map.set(h.id, h);
              }
              const merged = Array.from(map.values()).slice(0, 50);
              saveHistoryOffline(merged, currentUser?.id);
              return merged;
            });
          }
        })
        .catch((saveErr) => {
          console.warn('[handleFinishTest save error]:', saveErr);
        });

      // Refresh monthly usage counter if currentUser exists
      if (currentUser?.id) {
        fetchStudentMcqUsage(currentUser.id, currentUser.email, userProfile).then((info) => {
          if (typeof info?.currentUsage === 'number' && info.currentUsage > 0) {
            setMcqUsageCount(info.currentUsage);
          }
        }).catch(() => {});
      }
    } catch (finishErr: any) {
      console.error('[handleFinishTest Exception]:', finishErr);
      throw finishErr;
    }
  };

  executeStartTestRef.current = executeStartTest;

  const displayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0];

  if (screen === 'intro' || screen === 'marketing' || screen === 'pricing') {
    const pageParam = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('page') as any) : null;
    const initialPage = screen === 'pricing' ? 'pricing' : pageParam || 'home';

    return (
      <BoardlyMarketingApp
        initialPage={initialPage}
        onLaunchPortal={() => {
          if (currentUser) {
            setScreen('dashboard');
          } else {
            setScreen('auth');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#F8F9FB]  text-slate-900  selection:bg-[#1E5AFF] selection:text-white relative">
      <MainHeader 
        onMenuClick={() => openLmsModal()} 
        currentUser={currentUser}
        userProfile={userProfile}
        selectedClass={selectedClass}
        selectedGroup={selectedGroup}
        currentScreen={screen}
        onTrackClick={() => openLmsModal()}
        onGoBack={handleGlobalBack}
        onGoHome={() => {
          confirmExitTestIfActive(() => {
            if (currentUser) {
              setScreen('dashboard');
            } else {
              setScreen('intro');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }}
        canGoBack={(screen as string) !== 'intro' && screen !== 'dashboard' && screen !== 'admin'}
        isIntroScreen={false}
        historyCount={history.length}
        onOpenHistory={() => openHistoryModal()}
        onOpenLmsPortal={() => openLmsModal()}
        onNavigateProfile={() => {
          confirmExitTestIfActive(() => {
            if (currentUser) {
              setScreen('profile');
            } else {
              setScreen('auth');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }}
        onStartFree={() => {
          confirmExitTestIfActive(() => {
            setScreen('grades_flow');
          });
        }}
        onSignOut={async () => {
          confirmExitTestIfActive(async () => {
            await supabase.auth.signOut();
            clearProfileCache();
            try {
              localStorage.removeItem('boardly_cached_user');
              localStorage.removeItem('boardly_cached_profile');
            } catch {}
            setCurrentUser(null);
            setUserProfile(null);
            setScreen('intro');
          });
        }}
        onNavigateDashboard={() => {
          confirmExitTestIfActive(() => {
            setScreen('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }}
        onNavigateSubjects={() => {
          confirmExitTestIfActive(() => {
            setScreen('subjects');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }}
        onNavigateStats={() => {
          confirmExitTestIfActive(() => {
            setScreen('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }}
        onNavigatePractice={() => {
          confirmExitTestIfActive(() => {
            setScreen('subjects');
          });
        }}
        onOpenStudyBuddy={() => openStudyBuddy()}
        onNavigateSubscription={() => {
          confirmExitTestIfActive(() => {
            setScreen('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }}
        onNavigateAdmin={(tab) => {
          confirmExitTestIfActive(() => {
            if (tab && ['students', 'payment_requests', 'activity_logs', 'tests', 'progress'].includes(tab)) {
              setAdminTab(tab as any);
            } else {
              setAdminTab('students');
            }
            setScreen('admin');
          });
        }}
      />
      
      {isOffline && (
        <div className="w-full bg-[#1E5AFF] text-white text-center text-xs font-bold py-1.5 flex items-center justify-center gap-1.5 border-b border-black/10">
          <WifiOff className="w-3.5 h-3.5" />
          Offline Mode Active — Using cached MCQs
        </div>
      )}

      <main className={`flex-1 w-full mx-auto flex flex-col items-center justify-start p-2 sm:p-6 overflow-x-hidden ${
        ['intro', 'dashboard', 'admin', 'checkout', 'plan_selection'].includes(screen)
          ? 'max-w-7xl'
          : ['grades_flow', 'test', 'results'].includes(screen)
          ? 'max-w-4xl'
          : 'max-w-3xl'
      }`}>
        <div className={`w-full mx-auto relative flex flex-col flex-1 min-w-0 ${
          ['intro', 'dashboard', 'admin', 'checkout', 'plan_selection'].includes(screen)
            ? 'max-w-7xl'
            : ['grades_flow', 'test', 'results'].includes(screen)
            ? 'max-w-3xl'
            : 'max-w-[580px]'
        }`}>
          {/* StepTrail removed */}

          <div className="flex-1 flex flex-col justify-between min-h-0 w-full relative">
            <ErrorBoundary onReset={() => setScreen(currentUser ? 'dashboard' : 'intro')}>
            {currentUser && !isAdmin && userProfile?.status === 'suspended' ? (
              <div className="bg-white  border-2 border-rose-500/50 rounded-[28px] p-6 sm:p-8 max-w-lg mx-auto text-center space-y-5 shadow-2xl animate-ios-spring relative overflow-hidden my-8">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />

                <div className="w-16 h-16 rounded-full bg-rose-100  border-2 border-rose-500/40 flex items-center justify-center text-rose-600  mx-auto shadow-md">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800  bg-rose-100  px-3 py-1 rounded-full inline-block border border-rose-300 ">
                    Account Suspended
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 ">
                    Access Temporarily Restricted
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600  leading-relaxed">
                    Your student account (<strong className="text-slate-900 ">{currentUser.email}</strong>) has been suspended by the SHS Academy Administrator.
                  </p>
                  <p className="text-xs text-slate-500 ">
                    You cannot generate practice tests or access study materials while suspended. Please contact <strong className="text-rose-600 ">shsvirtualadmin@gmail.com</strong> for assistance or account reactivation.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    clearProfileCache();
                    try {
                      localStorage.removeItem('boardly_cached_user');
                      localStorage.removeItem('boardly_cached_profile');
                    } catch {}
                    setUserProfile(null);
                    setCurrentUser(null);
                    setScreen('intro');
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-full text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <ChunkErrorBoundary>
                <React.Suspense fallback={null}>
                {(screen === 'dashboard' || screen === 'stats') && (
                  currentUser && (
                    <StudentHomeDashboard
                      currentUser={currentUser}
                      userProfile={userProfile}
                      history={history}
                      isAdmin={isAdmin}
                      isTestLimitReached={isTestLimitReached}
                      monthlyTestCount={currentMonthlyTestCount}
                      onUpdateProfile={(updated) => setUserProfile(updated)}
                      onTrackChanged={(track) => {
                        const cNum = (typeof track.grade === 'number' ? track.grade : String(track.grade)) as BoardClass;
                        setSelectedClass(cNum);
                        setSelectedGroup(track.defaultGroup || track.name);
                      }}
                      onNavigateDashboard={() => setScreen('subjects')}
                      onSelectMdcat={() => handleSelectClass('MDCAT')}
                      onSelectTcat={() => handleSelectClass('TCAT')}
                      onUpgradeClick={() => setScreen('plan_selection')}
                      onStartPracticeTest={() => {
                        if (isTestLimitReached) {
                          openTestLimitModal(testLimitResetDate, currentMonthlyTestCount);
                          return;
                        }
                        const resolved = resolveStudentTrackDetails(userProfile);
                        setSelectedClass(resolved.grade as BoardClass);
                        setSelectedGroup(resolved.stream);
                        setScreen('subjects');
                      }}
                      onPracticeWeakTopic={(subject, topic) => {
                        if (isTestLimitReached) {
                          openTestLimitModal(testLimitResetDate, currentMonthlyTestCount);
                          return;
                        }
                        const targetSubject = mapSubject(subject);
                        setSelectedSubject(targetSubject);
                        setCustomTopic(topic);
                        setScreen('duration');
                      }}
                      onOpenLmsPortal={() => openLmsModal()}
                      onOpenHistory={() => openHistoryModal()}
                      onOpenCommunity={() => openCommunityModal()}
                    />
                  )
                )}
                {(screen === 'checkout' || screen === 'plan_selection' || screen === 'payment_required') && (
                  <div className="w-full flex justify-center py-12">
                    <BrandedLoadingSpinner label="Redirecting to your free dashboard..." size="md" />
                  </div>
                )}
                {screen === 'grades_flow' && (
                  <GradesFlowScreen
                    onSelectClass={handleSelectClass}
                    onBack={() => setScreen('intro')}
                    userProfile={userProfile}
                    isAdmin={isAdmin}
                    onAutoRedirectLocked={(cNum, grp) => {
                      setSelectedClass(cNum);
                      setSelectedGroup(grp);
                      setScreen('dashboard');
                    }}
                  />
                )}
                {screen === 'group' && (
                  <ClassGroupScreen selectedClass={selectedClass || 11} onSelectGroup={handleSelectGroup} onBack={() => setScreen('grades_flow')} />
                )}
                {screen === 'auth' && (
                  <LmsAuthScreen onSuccess={() => {
                    const isUserAdmin = Boolean(currentUser?.email && isAdminEmail(currentUser.email));
                    if (isUserAdmin || nextScreenAfterAuth === 'admin') {
                      setScreen('admin');
                      setNextScreenAfterAuth(null);
                      return;
                    }
                    setScreen(nextScreenAfterAuth || 'dashboard');
                    setNextScreenAfterAuth(null);
                  }} selectedGradeContext={selectedClass?.toString()} onBack={() => setScreen(authBackScreen || 'intro')} />
                )}
                {screen === 'subjects' && (
                  (() => {
                    const defaultClassGroup = userProfile ? getStudentDefaultClassAndGroup(userProfile) : null;
                    const effectiveClass = selectedClass || defaultClassGroup?.classNum || 11;
                    const effectiveGroup = selectedGroup || defaultClassGroup?.group || 'Pre-Medical';

                    return (
                      <ClassStreamDashboard
                        classNum={effectiveClass}
                        group={effectiveGroup}
                        history={history}
                        isAdmin={isAdmin}
                        currentUser={currentUser}
                        userProfile={userProfile}
                        onUpdateProfile={(updated) => setUserProfile(updated)}
                        isGenerating={isGenerating}
                        isTestLimitReached={isTestLimitReached}
                        onOpenAuth={(intendedParams) => {
                          if (intendedParams) {
                            setPendingTestParams(intendedParams);
                          }
                          setNextScreenAfterAuth('subjects');
                          setAuthBackScreen('subjects');
                          setScreen('auth');
                        }}
                        onSelectStream={(c, g) => {
                          setSelectedClass(c);
                          setSelectedGroup(g);
                        }}
                        onOpenHistory={() => openHistoryModal()}
                        onStartTest={handleStartTest}
                        onBackToClasses={() => {
                          setScreen('grades_flow');
                        }}
                        onUpgradeClick={() => setScreen('plan_selection')}
                      />
                    );
                  })()
                )}
                {screen === 'subject' && (
                  <SubjectScreen 
                    selectedClass={selectedClass}
                    group={selectedGroup}
                    onSelectSubject={(subject, topic) => {
                      setSelectedSubject(subject);
                      setCustomTopic(topic);
                      setScreen('duration');
                    }}
                    onBack={() => setScreen('group')}
                  />
                )}
                {screen === 'duration' && (
                  <DurationScreen 
                    subject={selectedSubject}
                    customTopic={customTopic}
                    currentUser={currentUser}
                    userProfile={userProfile}
                    onStartTest={handleStartTest}
                    onBack={() => setScreen('subject')}
                    isGenerating={isGenerating}
                    isTestLimitReached={isTestLimitReached}
                    onUpgradeClick={() => setScreen('plan_selection')}
                  />
                )}
                {screen === 'test' && (
                  <TestScreen
                    questions={activeQuestions}
                    config={testConfig || {
                      path: 'boards',
                      subject: selectedSubject,
                      classNum: selectedClass || 9,
                      group: selectedGroup,
                      durationMinutes: 10,
                      questionCount: 10,
                      difficulty: 'Exam Standard',
                      mode: 'instant',
                      instantFeedback: true,
                    }}
                    currentUser={currentUser}
                    userProfile={userProfile}
                    bgGenError={bgGenError}
                    onRetryGeneration={() => {
                      setBgGenError(null);
                      if (testConfig) {
                        startBackgroundGeneration(
                          testConfig,
                          activeQuestions,
                          testConfig.questionCount || 25,
                          testConfig.path === 'mdcat'
                        );
                      }
                    }}
                    onLoadPracticeBank={async () => {
                      setBgGenError(null);
                      const targetSub = testConfig?.subject || selectedSubject || 'Physics';
                      const targetTop = testConfig?.customTopic;
                      const targetCount = testConfig?.questionCount || 10;
                      const isTcat = testConfig?.path === 'tcat' || selectedClass === 'TCAT' || selectedGroup === 'TCAT' || targetSub.toLowerCase().includes('tcat');
                      const isMdcatTest = testConfig?.path === 'mdcat' || selectedClass === 'MDCAT' || selectedGroup === 'MDCAT' || targetSub.toLowerCase().includes('mdcat');
                      const seenStems = getSeenStemsForStudent(currentUser?.id, targetSub);
                      
                      const newSet = [...activeQuestions];
                      if (isTcat) {
                        const { getTCATPrebuiltQuestions } = await import('./data/tcatPrebuiltQuestions');
                        const tcatPool = getTCATPrebuiltQuestions(targetSub, targetCount, targetTop, testConfig?.chapterName, undefined, seenStems);
                        for (const q of tcatPool) {
                          if (newSet.length >= targetCount) break;
                          if (!newSet.some(existing => isDuplicateQuestion(existing, q))) {
                            newSet.push(q);
                          }
                        }
                      } else if (isMdcatTest) {
                        const { getMDCATPrebuiltQuestions } = await import('./data/mdcatPrebuiltQuestions');
                        const mdcatPool = getMDCATPrebuiltQuestions(targetSub, targetCount, targetTop, testConfig?.chapterName, undefined, seenStems);
                        for (const q of mdcatPool) {
                          if (newSet.length >= targetCount) break;
                          if (!newSet.some(existing => isDuplicateQuestion(existing, q))) {
                            newSet.push(q);
                          }
                        }
                      } else if (testConfig?.path && ['net', 'fast', 'ecat', 'etea', 'nums', 'giki', 'usat', 'ned', 'pieas', 'nat', 'iba', 'aku', 'muet', 'lums', 'numl', 'hitec', 'nutech'].includes(testConfig.path)) {
                        const { getEntranceExamQuestions } = await import('./data/entranceExamQuestions');
                        const entrancePool = getEntranceExamQuestions(testConfig.path.toUpperCase(), targetSub, targetCount, seenStems);
                        for (const q of entrancePool) {
                          if (newSet.length >= targetCount) break;
                          if (!newSet.some(existing => isDuplicateQuestion(existing, q))) {
                            newSet.push(q);
                          }
                        }
                      } else {
                        const { getPrebuiltQuestionsForSubject } = await import('./data/prebuiltQuestions');
                        const prebuiltPool = getPrebuiltQuestionsForSubject(targetSub, targetTop, selectedClass, testConfig?.chapterName, undefined, seenStems);
                        const prioritized = selectPrioritizedQuestions(prebuiltPool, targetCount, seenStems);
                        
                        for (const pbq of prioritized.selected) {
                          if (newSet.length >= targetCount) break;
                          if (!newSet.some(q => isDuplicateQuestion(q, pbq))) {
                            newSet.push({
                              ...pbq,
                              id: `practice-bank-${newSet.length + 1}-${Date.now()}`
                            });
                          }
                        }
                      }
                      
                      const finalReady = deduplicateQuestions(newSet).slice(0, targetCount);
                      recordQuestionsAsSeen(currentUser?.id, finalReady, targetSub, targetTop, testConfig?.chapterName);
                      setActiveQuestions(finalReady);
                    }}
                    initialCurrentIndex={testSessionProgress?.currentIndex}
                    initialUserAnswers={testSessionProgress?.userAnswers}
                    initialTimeLeftSeconds={testSessionProgress?.timeLeftSeconds}
                    onSessionStateChange={(progress) => {
                      setTestSessionProgress(progress);
                    }}
                    onFinishTest={async (answers, timeTakenSeconds) => {
                      isExitingTestRef.current = true;
                      try {
                        localStorage.removeItem('boardly_active_test_session');
                      } catch {}
                      setTestSessionProgress(null);
                      if (activeTestSessionId) {
                        apiFetch('/api/finish-test-session', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: currentUser?.id || 'guest',
                            userEmail: currentUser?.email,
                            sessionId: activeTestSessionId,
                          }),
                        }).catch(() => {});
                        setActiveTestSessionId(null);
                      }
                      await handleFinishTest(answers, timeTakenSeconds);
                    }}
                    onExitTest={handleExitTestSession}
                    onUpgradeClick={() => setScreen('plan_selection')}
                    onExplainMcq={(mcqCtx) => {
                      setStudyBuddyContext(mcqCtx);
                      openStudyBuddy();
                    }}
                  />
                )}
                {screen === 'results' && (
                  testResult ? (
                    <ResultsScreen
                      result={testResult}
                      currentUser={currentUser}
                      userProfile={userProfile}
                      onTakeAnother={() => {
                        if (testResult?.config?.classNum) {
                          setSelectedClass(testResult.config.classNum);
                          if (testResult.config.group) setSelectedGroup(testResult.config.group);
                          setScreen('subjects');
                        } else {
                          setScreen('grades_flow');
                        }
                      }}
                      onOpenPrintModal={() => openPrintModal(testResult)}
                      onUpgradeClick={() => setScreen('plan_selection')}
                      onBackToHome={() => {
                        if (currentUser) {
                          setScreen('dashboard');
                        } else if (testResult?.config?.classNum) {
                          setSelectedClass(testResult.config.classNum);
                          if (testResult.config.group) setSelectedGroup(testResult.config.group);
                          setScreen('subjects');
                        } else {
                          setScreen('intro');
                        }
                      }}
                      onExplainMcq={(mcqCtx) => {
                        setStudyBuddyContext(mcqCtx);
                        openStudyBuddy();
                      }}
                    />
                  ) : (
                    <div className="bg-white  border border-slate-200  rounded-3xl p-8 max-w-lg mx-auto text-center space-y-5 shadow-2xl animate-ios-spring my-8">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#1E5AFF] mx-auto">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900 ">No Test Results To Display</h2>
                        <p className="text-xs text-slate-600  leading-relaxed">
                          No active test result is currently loaded in session memory. Start a new practice test or view your test history.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          onClick={() => setScreen('subjects')}
                          className="flex-1 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md active:scale-95"
                        >
                          Start Practice Test
                        </button>
                        <button
                          onClick={() => setScreen(currentUser ? 'dashboard' : 'intro')}
                          className="flex-1 bg-slate-100  text-slate-800  font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer hover:bg-slate-200 "
                        >
                          Go to Dashboard
                        </button>
                      </div>
                    </div>
                  )
                )}
                {screen === 'admin' && (
                  isAdmin && currentUser ? (
                    <AdminDashboardScreen currentUser={currentUser} initialTab={adminTab} onBack={() => setScreen('intro')} />
                  ) : (
                    <div className="text-center py-12 animate-ios-spring">
                      <p className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 py-3 px-6 rounded-full inline-block">
                        Unauthorized Route Access. Redirecting...
                      </p>
                    </div>
                  )
                )}
                {screen === 'profile' && (
                  currentUser ? (
                    <div className="max-w-4xl mx-auto w-full py-4 sm:py-8 px-2 sm:px-4">
                      <div className="mb-4 flex items-center justify-between">
                        <button
                          onClick={() => setScreen('dashboard')}
                          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" />
                          <span>Back to Dashboard</span>
                        </button>
                      </div>
                      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-8">
                        <StudentProfileView
                          user={currentUser}
                          profile={userProfile || {
                            id: currentUser.id,
                            email: currentUser.email || '',
                            name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student',
                            grade: 'Class 11',
                            stream: 'Pre-Engineering',
                            sign_up_method: 'Email/Password',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          }}
                          onRefreshProfile={() => refreshUserProfile()}
                          onStartPractice={() => setScreen('subjects')}
                          onSignOut={async () => {
                            await supabase.auth.signOut();
                            clearProfileCache();
                            try {
                              localStorage.removeItem('boardly_cached_user');
                              localStorage.removeItem('boardly_cached_profile');
                            } catch {}
                            setCurrentUser(null);
                            setUserProfile(null);
                            setScreen('intro');
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto w-full py-8 px-4">
                      <LmsAuthScreen
                        onSuccess={(user) => {
                          if (user) {
                            setCurrentUser(user);
                            setScreen('profile');
                          } else {
                            setScreen('dashboard');
                          }
                        }}
                        onBack={() => setScreen('dashboard')}
                      />
                    </div>
                  )
                )}
                {!['intro', 'dashboard', 'stats', 'checkout', 'pricing', 'plan_selection', 'payment_required', 'grades_flow', 'group', 'auth', 'subjects', 'subject', 'duration', 'test', 'results', 'admin', 'profile'].includes(screen) && (
                  !currentUser ? (
                    <IntroScreen
                      onContinue={() => setScreen('auth')}
                      onSelectGradesFlow={() => setScreen('auth')}
                      onSelectMdcat={() => {
                        setSelectedClass('MDCAT');
                        setSelectedGroup('MDCAT');
                        setScreen('auth');
                      }}
                      onSelectTcat={() => {
                        setSelectedClass('TCAT');
                        setSelectedGroup('TCAT');
                        setScreen('auth');
                      }}
                      onSelectEntranceTrack={(track) => {
                        const t = track.toUpperCase() as BoardClass;
                        setSelectedClass(t);
                        setSelectedGroup(String(t));
                        setScreen('auth');
                      }}
                      onOpenCommunity={() => openCommunityModal()}
                      onOpenHistory={() => openHistoryModal()}
                      onOpenLmsPortal={() => setScreen('auth')}
                      onOpenStudyBuddy={() => openStudyBuddy()}
                      historyCount={history.length}
                    />
                  ) : (
                    <StudentHomeDashboard
                      currentUser={currentUser}
                      userProfile={userProfile}
                      history={history}
                      isAdmin={isAdmin}
                      isTestLimitReached={isTestLimitReached}
                      monthlyTestCount={currentMonthlyTestCount}
                      onUpdateProfile={(updated) => setUserProfile(updated)}
                      onTrackChanged={(track) => {
                        const cNum = (typeof track.grade === 'number' ? track.grade : String(track.grade)) as BoardClass;
                        setSelectedClass(cNum);
                        setSelectedGroup(track.defaultGroup || track.name);
                      }}
                      onNavigateDashboard={() => setScreen('subjects')}
                      onSelectMdcat={() => handleSelectClass('MDCAT')}
                      onSelectTcat={() => handleSelectClass('TCAT')}
                      onUpgradeClick={() => setScreen('plan_selection')}
                      onStartPracticeTest={() => {
                        if (isTestLimitReached) {
                          openTestLimitModal(testLimitResetDate, currentMonthlyTestCount);
                          return;
                        }
                        setScreen('subjects');
                      }}
                      onPracticeWeakTopic={(subject, topic) => {
                        if (isTestLimitReached) {
                          openTestLimitModal(testLimitResetDate, currentMonthlyTestCount);
                          return;
                        }
                        const targetSubject = mapSubject(subject);
                        setSelectedSubject(targetSubject);
                        setCustomTopic(topic);
                        setScreen('duration');
                      }}
                      onOpenLmsPortal={() => openLmsModal()}
                      onOpenHistory={() => openHistoryModal()}
                      onOpenCommunity={() => openCommunityModal()}
                    />
                  )
                )}
              </React.Suspense>
            </ChunkErrorBoundary>
          )}
          </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Global Lazy-loaded Modals rendered outside main tree for high performance */}
      <ChunkErrorBoundary fallback={null}>
        <GlobalModals
          currentUser={currentUser}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          history={history}
          handleClearHistory={handleClearHistory}
          isTestLimitReached={isTestLimitReached}
          refreshUserProfile={refreshUserProfile}
          selectedClass={selectedClass}
          selectedGroup={selectedGroup}
          selectedSubject={selectedSubject}
          customTopic={customTopic}
          screen={screen}
          setScreen={setScreen}
        />
      </ChunkErrorBoundary>

      {/* In-App Leave Confirmation Modal */}
      {leaveModalConfig?.isOpen && (
        <LeaveConfirmationModal
          isOpen={leaveModalConfig.isOpen}
          title={leaveModalConfig.title || 'Leave this page?'}
          message={leaveModalConfig.message || 'Question generation is still in progress and will be lost.'}
          stayLabel={leaveModalConfig.stayLabel || 'Stay'}
          leaveLabel={leaveModalConfig.leaveLabel || 'Leave Anyway'}
          onStay={() => setLeaveModalConfig(null)}
          onLeaveAnyway={() => {
            const confirmFn = leaveModalConfig.onConfirm;
            setLeaveModalConfig(null);
            if (confirmFn) {
              confirmFn();
            }
          }}
        />
      )}

      {/* In-App MCQ Generation Error Modal */}
      {generationError?.isOpen && (
        <div className="fixed inset-0 z-[310] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-ios-spring">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 ">
                Unable to Load Questions
              </h3>
              <p className="text-sm text-slate-500  leading-relaxed">
                The question generation service is temporarily busy or took too long to formulate verified questions for this specific subtopic.
              </p>
            </div>

            {(generationError.subject || generationError.topic) && (
              <div className="w-full bg-slate-50  border border-slate-200/80  rounded-2xl p-3.5 text-left text-xs space-y-1.5">
                <div className="text-slate-400  font-medium uppercase tracking-wider text-[10px]">Practice Scope</div>
                <div className="font-semibold text-slate-800  flex items-center gap-1.5 flex-wrap">
                  <span className="bg-[#1E5AFF]/10 text-[#1E5AFF] px-2 py-0.5 rounded-md font-bold">{generationError.subject}</span>
                  {generationError.topic && (
                    <span className="bg-slate-200  text-slate-700  px-2 py-0.5 rounded-md font-medium">{generationError.topic}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  const retryParams = generationError.params;
                  setGenerationError(null);
                  if (retryParams) {
                    executeStartTest(retryParams);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGenerationError(null);
                  setScreen('subjects');
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100  hover:bg-slate-200  text-slate-700  font-bold text-sm transition-all active:scale-[0.98]"
              >
                <span>Choose Topic</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Year Free Pro Promotional Pass Two-Step Confirmation / Celebration Modal */}
      <PromoCelebrationModal
        isOpen={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        mode={promoModalMode}
        isLoading={promoIsActivating}
        trackLabel={promoModalData?.trackLabel}
        expiresDate={promoModalData?.expiresDate}
        code={promoModalData?.code}
        campaignLabel={promoModalData?.campaignLabel}
        studentEmail={promoModalData?.studentEmail || currentUser?.email || undefined}
        errorMessage={promoModalData?.errorMessage}
        onActivate={handleActivatePromo}
        onCancel={handleCancelPromo}
        onGoToDashboard={() => {
          setPromoModalOpen(false);
          setScreen('dashboard');
        }}
      />

      {showExitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95  text-white  font-bold text-xs sm:text-sm px-5 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/20  flex items-center gap-2.5 animate-ios-spring pointer-events-none transition-all">
          <ShieldAlert className="w-4 h-4 text-[#1E5AFF]  shrink-0" />
          <span>Press back again to exit</span>
        </div>
      )}
    </div>
  );
};

export const AppWithSettings: React.FC = () => {
  if (!configValidation.isValid) {
    if (import.meta.env.DEV) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md bg-slate-800 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-xl font-bold text-red-400 mb-2">Firebase Configuration Error</h1>
            <p className="text-sm text-slate-300 mb-4">
              The following required environment variable(s) failed validation or are missing:
            </p>
            <ul className="text-xs font-mono bg-slate-950 p-3 rounded-lg text-amber-300 space-y-1 mb-4 text-left">
              {configValidation.badVars.map((v) => (
                <li key={v}>• {v}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-400">
              Please check your environment configuration variables.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-[#F8F9FB] text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              ⚙️
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">We're fixing something</h1>
            <p className="text-sm text-slate-600 mb-6">
              Please try again shortly. Our team is performing routine maintenance.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition cursor-pointer"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <ModalProvider>
          <AuthProvider>
            <BoardlyAppRouter />
          </AuthProvider>
        </ModalProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  );
};

export default AppWithSettings;

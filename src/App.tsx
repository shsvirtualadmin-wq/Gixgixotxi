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
import { PREBUILT_QUESTIONS, getPrebuiltQuestionsForSubject } from './data/prebuiltQuestions';
import { generateTCATFullMockBank, getTCATPrebuiltQuestions } from './data/tcatPrebuiltQuestions';
import { generateMDCATFullMockBank, getMDCATPrebuiltQuestions } from './data/mdcatPrebuiltQuestions';
import { checkQuestionTopicRelevance } from './utils/topicValidator';
import { shuffleQuestionOptions } from './lib/shuffle';
import { getSubjectsForClassAndGroup } from './data/categories';
import { mapSubject } from './utils/subjectMapper';
import {
  getCategoryFromClassAndGroup,
  getCategoryFromProfile,
  getClassAndGroupFromCategory,
  isCategoryAccessAllowed,
} from './utils/categoryHelpers';

import { MainHeader } from './components/MainHeader';
import { HeaderLogo } from './components/HeaderLogo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntroScreen } from './components/IntroScreen';
import { StudentHomeDashboard } from './components/StudentHomeDashboard';
import { TestScreen } from './components/TestScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { BrandedLoadingSpinner } from './components/BrandedLoadingSpinner';
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';
import { lazyWithRetry } from './lib/lazyWithRetry';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { ModalProvider, useModals } from './context/ModalContext';
import { GlobalModals } from './components/GlobalModals';
import { LeaveConfirmationModal } from './components/LeaveConfirmationModal';
import { PLAN_OPTIONS, type PlanId } from './components/PlanSelectionScreen';
import { getPricingTrackFromProfile, type PricingTrack, type BillingCycle } from './components/PricingPage';
import { setPageMeta, DEFAULT_PAGE_META } from './utils/seo';
import type { SetupWizardData } from './components/GuidedSetupWizard';
import type { MCQContext } from './types';

// Code-split heavy secondary screens with retry and self-healing reload on chunk update
const GradesFlowScreen = lazyWithRetry(() => import('./components/GradesFlowScreen').then(m => ({ default: m.GradesFlowScreen })), 'GradesFlow');
const GuidedSetupWizard = lazyWithRetry(() => import('./components/GuidedSetupWizard').then(m => ({ default: m.GuidedSetupWizard })), 'GuidedSetup');
const StudentRegistrationFlow = lazyWithRetry(() => import('./components/StudentRegistrationFlow').then(m => ({ default: m.StudentRegistrationFlow })), 'Registration');
const ClassGroupScreen = lazyWithRetry(() => import('./components/ClassGroupScreen').then(m => ({ default: m.ClassGroupScreen })), 'ClassGroup');
const SubjectScreen = lazyWithRetry(() => import('./components/SubjectScreen').then(m => ({ default: m.SubjectScreen })), 'Subject');
const DurationScreen = lazyWithRetry(() => import('./components/DurationScreen').then(m => ({ default: m.DurationScreen })), 'Duration');
const LmsAuthScreen = lazyWithRetry(() => import('./components/LmsAuthScreen').then(m => ({ default: m.LmsAuthScreen })), 'LmsAuth');
const AdminDashboardScreen = lazyWithRetry(() => import('./components/AdminDashboardScreen').then(m => ({ default: m.AdminDashboardScreen })), 'AdminDashboard');
const ClassStreamDashboard = lazyWithRetry(() => import('./components/ClassStreamDashboard').then(m => ({ default: m.ClassStreamDashboard })), 'ClassStream');
const PaymentRequiredScreen = lazyWithRetry(() => import('./components/PaymentRequiredScreen').then(m => ({ default: m.PaymentRequiredScreen })), 'PaymentRequired');
const PlanSelectionScreen = lazyWithRetry(() => import('./components/PlanSelectionScreen').then(m => ({ default: m.PlanSelectionScreen })), 'PlanSelection');
const PricingPage = lazyWithRetry(() => import('./components/PricingPage').then(m => ({ default: m.PricingPage })), 'Pricing');

import { supabase, isSupabaseConfigured, apiFetch, safeJsonResponse, syncUserProfile, saveTestToSupabase, fetchUserTestHistoryFromSupabase, clearUserTestHistoryInSupabase, fetchStudentProfileFromSupabase, fetchStudentMcqUsage, clearProfileCache, checkUserExistsInDatabase, isStudentExistingBeforeRule, isAdminEmail, verifyEmailTokenHash, sanitizeStudentForDb, withTimeout, User, StudentProfile } from './lib/supabase';
import { App as CapacitorApp } from '@capacitor/app';
import { ShieldCheck, WifiOff, AlertTriangle, Lock, ShieldAlert, GraduationCap, Sparkles, ArrowRight, RefreshCw, X, LogOut } from 'lucide-react';
import { cacheGeneratedQuestions, getCachedQuestions, saveHistoryOffline, loadHistoryOffline, clearHistoryOffline } from './lib/offlineCache';

type ScreenType =
  | 'intro'
  | 'guided_wizard'
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
  | 'admin';

export function checkIsStudentProOrPaid(
  profile: StudentProfile | null | undefined,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (!profile) return false;

  const rawIsPro = Boolean(profile.is_pro) || profile.payment_status === 'Verified & Paid';

  if (rawIsPro) {
    if (profile.access_expires) {
      const expTime = new Date(profile.access_expires).getTime();
      if (!isNaN(expTime)) {
        return expTime > Date.now();
      }
    }
    return true;
  }

  return false;
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
  const urlScreen = params.get('screen') as ScreenType | null;
  const validScreens: ScreenType[] = [
    'intro', 'guided_wizard', 'plan_selection', 'payment_required', 'grades_flow', 'group', 'dashboard', 'subjects', 'stats', 'subject', 'duration', 'auth', 'test', 'results', 'admin'
  ];

  let initialScreen: ScreenType = 'intro';
  if (urlScreen && validScreens.includes(urlScreen)) {
    initialScreen = urlScreen;
  } else {
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
        const saved = localStorage.getItem('boardly_active_screen');
        if (saved && validScreens.includes(saved as ScreenType)) {
          initialScreen = saved as ScreenType;
        }
      }
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
  const params = new URLSearchParams();
  if (scr !== 'intro') {
    params.set('screen', scr);
  }
  // Only persist class/group/subject query params during specific test flow screens where they represent user-selected test routes
  const isTestFlowScreen = scr === 'subject' || scr === 'group' || scr === 'duration' || scr === 'test' || scr === 'results';
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
  const g = (profile.grade || '').trim();
  const s = (profile.stream || '').trim();
  const gUpper = g.toUpperCase();
  const sUpper = s.toUpperCase();

  if (gUpper.includes('MDCAT') || sUpper.includes('MDCAT')) {
    return { classNum: 'MDCAT', group: 'MDCAT' };
  }
  if (gUpper.includes('TCAT') || sUpper.includes('TCAT')) {
    return { classNum: 'TCAT', group: s || 'Pre-Engineering' };
  }

  let classNum: BoardClass = 11;
  const numMatch = g.match(/\d+/);
  if (numMatch) {
    const parsed = parseInt(numMatch[0], 10);
    if (parsed === 9 || parsed === 10 || parsed === 11 || parsed === 12) {
      classNum = parsed as BoardClass;
    }
  } else {
    if (gUpper.includes('NINTH') || gUpper.includes('SSC PART 1') || gUpper.includes('SSC-1') || gUpper.includes('SSC 1')) {
      classNum = 9;
    } else if (gUpper.includes('TENTH') || gUpper.includes('MATRIC') || gUpper.includes('SSC PART 2') || gUpper.includes('SSC-2') || gUpper.includes('SSC 2')) {
      classNum = 10;
    } else if (gUpper.includes('FIRST YEAR') || gUpper.includes('1ST YEAR') || gUpper.includes('HSSC PART 1') || gUpper.includes('HSSC-1') || gUpper.includes('HSSC 1')) {
      classNum = 11;
    } else if (gUpper.includes('SECOND YEAR') || gUpper.includes('2ND YEAR') || gUpper.includes('HSSC PART 2') || gUpper.includes('HSSC-2') || gUpper.includes('HSSC 2')) {
      classNum = 12;
    }
  }

  const group = s || 'Pre-Medical';
  return { classNum, group };
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

  const [selectedPricingTrack, setSelectedPricingTrack] = useState<PricingTrack>(() => {
    return getPricingTrackFromProfile(null, initialUrlState.selectedClass ? String(initialUrlState.selectedClass) : undefined, initialUrlState.selectedGroup);
  });
  const [selectedPricingCycle, setSelectedPricingCycle] = useState<BillingCycle>('annual');

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
      const savedUni = localStorage.getItem('boardly_target_university');
      if (savedUni && profile) {
        if (!profile.dream_university) profile.dream_university = savedUni;
        if (!profile.target_university) profile.target_university = savedUni;
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

  const handleRetryAuth = useCallback(async () => {
    setAuthTimedOut(false);
    setAuthError(null);
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }
    setAuthLoading(true);
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
        const profile = await syncUserProfile(user);
        setUserProfile(profile);
        setProfileSyncing(false);
      } else {
        setUserProfile(null);
      }
    } catch (err: any) {
      console.error('[Retry Auth Exception]:', err);
      setAuthError('Connection took too long. Please try again or continue to portal.');
    } finally {
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
  const hasGradeAndStream = Boolean(
    userProfile?.grade &&
    userProfile?.grade.trim() &&
    userProfile?.grade !== 'General Student' &&
    userProfile?.stream &&
    userProfile?.stream.trim()
  );
  const isRegisteredStudent = isAdmin ||
    Boolean(userProfile?.is_registered) ||
    hasGradeAndStream ||
    localStorage.getItem('boardly_registration_is_success') === 'true' ||
    userProfile?.payment_status === 'Pending Verification' ||
    userProfile?.plan_status === 'pending_verification';

  // Access Gating Rule: Only Admins OR students whose payment_status is 'Verified & Paid' or is_pro is true have Pro access!
  const isStudentProOrPaid = userProfile?.is_pro === true || userProfile?.payment_status === 'Verified & Paid';
  const isPaymentApprovedOrExempt = isAdmin || isStudentProOrPaid;

  // Synchronize selectedClass & selectedGroup with student's profile grade & stream if not set yet
  useEffect(() => {
    if (userProfile && isRegisteredStudent && !isAdmin) {
      const defaultInfo = getStudentDefaultClassAndGroup(userProfile);
      if (selectedClass === undefined) {
        setSelectedClass(defaultInfo.classNum);
      }
      if (selectedGroup === undefined) {
        setSelectedGroup(defaultInfo.group);
      }
    }
  }, [userProfile, isRegisteredStudent, isAdmin, selectedClass, selectedGroup]);

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
  const isRegisteredStudentRef = useRef(isRegisteredStudent);
  const isAdminRef = useRef(isAdmin);
  const authBackScreenRef = useRef<ScreenType>('intro');
  const isExitingTestRef = useRef(false);
  const isGeneratingRef = useRef(false);

  const [nextScreenAfterAuth, setNextScreenAfterAuth] = useState<ScreenType | null>(null);
  const [authBackScreen, setAuthBackScreen] = useState<ScreenType>('intro');

  const handleWizardComplete = async (data: SetupWizardData) => {
    let targetC: BoardClass = 11;
    let targetG: string = 'Pre-Medical';

    if (data.exam === 'MDCAT') {
      targetC = 'MDCAT';
      targetG = 'MDCAT';
    } else if (data.exam === 'TCAT') {
      targetC = 'TCAT';
      targetG = data.group || 'Pre-Engineering';
    } else {
      targetC = data.classNum || 11;
      targetG = data.group || 'Pre-Medical';
    }

    setSelectedClass(targetC);
    setSelectedGroup(targetG);

    if (currentUser) {
      const provider = currentUser.app_metadata?.provider || 'email';
      const updatedProfile: StudentProfile = {
        ...(userProfile || {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student',
          email: currentUser.email || '',
          sign_up_method: provider === 'google' ? 'Google' : 'Email/Password',
          created_at: new Date().toISOString(),
        }),
        grade: typeof targetC === 'number' ? `Class ${targetC}` : targetC,
        stream: targetG,
        subjects: data.focusSubjects,
        target_exam: data.exam,
        is_registered: true,
        updated_at: new Date().toISOString(),
      };

      setUserProfile(updatedProfile);
      localStorage.setItem(`boardly_profile_${currentUser.id}`, JSON.stringify(updatedProfile));
      localStorage.setItem('boardly_cached_profile', JSON.stringify(updatedProfile));

      try {
        await supabase.from('students').upsert(sanitizeStudentForDb(updatedProfile));
      } catch (err) {
        console.warn('Error saving setup wizard profile:', err);
      }
    }

    setScreen('dashboard');
  };

  const handleSelectPlans = async (selectedPlanIds: PlanId[]) => {
    if (!currentUser) {
      setScreen('auth');
      return;
    }

    const planNames = selectedPlanIds
      .map((id) => PLAN_OPTIONS.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(' + ');

    const hasPaidPlan = selectedPlanIds.some((id) => {
      const opt = PLAN_OPTIONS.find((p) => p.id === id);
      return opt && opt.numericPrice > 0;
    });

    const provider = currentUser.app_metadata?.provider || 'email';

    let nextPaymentStatus = userProfile?.payment_status || 'Unpaid';
    let nextRequiresPayment = true;

    const isAlreadyPro = Boolean(userProfile?.is_pro || userProfile?.payment_status === 'Verified & Paid');

    if (isAlreadyPro) {
      nextPaymentStatus = 'Verified & Paid';
      nextRequiresPayment = false;
    } else if (!hasPaidPlan) {
      nextPaymentStatus = 'Free Plan';
      nextRequiresPayment = false;
    } else {
      if (userProfile?.payment_status === 'Pending Verification') {
        nextPaymentStatus = 'Pending Verification';
        nextRequiresPayment = true;
      } else {
        nextPaymentStatus = 'Unpaid';
        nextRequiresPayment = true;
      }
    }

    const updatedProfile: StudentProfile = {
      ...(userProfile || {
        id: currentUser.id,
        name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student',
        email: currentUser.email || '',
        grade: selectedClass ? selectedClass.toString() : 'General Student',
        sign_up_method: provider === 'google' ? 'Google' : 'Email/Password',
        created_at: new Date().toISOString(),
      }),
      is_registered: true,
      subscribed_plans: selectedPlanIds,
      package_name: planNames || (hasPaidPlan ? 'Paid Subscription' : 'Free Plan'),
      payment_status: nextPaymentStatus,
      requires_payment: nextRequiresPayment,
      updated_at: new Date().toISOString(),
    };

    setUserProfile(updatedProfile);
    localStorage.setItem(`boardly_profile_${currentUser.id}`, JSON.stringify(updatedProfile));
    localStorage.setItem('boardly_cached_profile', JSON.stringify(updatedProfile));

    try {
      await supabase.from('students').upsert(sanitizeStudentForDb(updatedProfile));
    } catch (err) {
      console.warn('Error syncing profile after plan selection:', err);
    }

    if (selectedPlanIds.includes('mdcat')) {
      setSelectedClass('MDCAT');
      setSelectedGroup('MDCAT');
    } else if (selectedPlanIds.includes('tcat')) {
      setSelectedClass('TCAT');
      setSelectedGroup('TCAT');
    } else if (selectedPlanIds.includes('fsc')) {
      setSelectedClass(11);
      setSelectedGroup('Pre-Medical');
    } else if (selectedPlanIds.includes('matric')) {
      setSelectedClass(9);
      setSelectedGroup('Medical');
    }

    setTrackNotice(null);
    setScreen('dashboard');
  };

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
    isRegisteredStudentRef.current = isRegisteredStudent;
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
    isRegisteredStudent,
    isAdmin,
    authBackScreen,
    isGenerating,
  ]);

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
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshUserProfile(currentUser.id, currentUser.email);
    } else {
      setUserProfile(null);
    }
  }, [currentUser?.id, currentUser?.email]);

  // Live profile re-sync on window focus / tab visibility change
  useEffect(() => {
    const handleFocusSync = () => {
      if (currentUser?.id) {
        refreshUserProfile(currentUser.id, currentUser.email);
      }
    };
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);
    return () => {
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, [currentUser?.id, currentUser?.email]);

  // Periodic background sync to pick up admin status/plan upgrades automatically (4s poll when on payment_required, 60s otherwise)
  useEffect(() => {
    if (!currentUser?.id) return;
    const syncInterval = screen === 'payment_required' ? 4000 : 60000;
    const intervalId = setInterval(() => {
      refreshUserProfile(currentUser.id, currentUser.email);
    }, syncInterval);
    return () => clearInterval(intervalId);
  }, [currentUser?.id, currentUser?.email, screen]);

  // Auto-redirect verified/approved students off the payment_required screen to dashboard
  useEffect(() => {
    if (screen === 'payment_required' && isPaymentApprovedOrExempt) {
      console.log('[Payment Guard]: User is verified/approved. Redirecting from payment_required to dashboard automatically.');
      setScreen('dashboard');
    }
  }, [screen, isPaymentApprovedOrExempt]);

  // Comprehensive Security & Route Guard Enforcement (Auth & RBAC)
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;

    const enforceSecurity = async () => {
      // 1. Unauthenticated User Protection for Protected Routes
      if (!currentUser) {
        if (['dashboard', 'subject', 'duration', 'test', 'results', 'guided_wizard', 'plan_selection', 'group', 'grades_flow', 'admin'].includes(screen)) {
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

      // 3. Post-Signup Onboarding & Track Access Guard Enforcement
      if (!isAdmin) {
        if (profileSyncing) return; // Wait for profile sync to finish

        const activeProf = userProfile;
        const isApprovedOrExempt = isAdmin || checkIsStudentProOrPaid(activeProf, isAdmin);

        const isUserRegistered = Boolean(
          activeProf?.is_registered ||
          (activeProf?.grade && activeProf?.stream) ||
          isRegisteredStudent ||
          localStorage.getItem('boardly_registration_is_success') === 'true' ||
          activeProf?.payment_status === 'Pending Verification' ||
          activeProf?.plan_status === 'pending_verification'
        );

        if (!isUserRegistered) {
          if (screen !== 'guided_wizard' && screen !== 'auth' && screen !== 'intro') {
            setScreen('guided_wizard');
          }
        } else {
          // Free-tier and pending-verification students are allowed on dashboard without checks
          if (isApprovedOrExempt) {
            // Verified pro students with valid access_expires are allowed everywhere; auto-redirect off payment_required
            if (screen === 'payment_required') {
              setScreen('dashboard');
            }
            return;
          }

          // Non-pro students (free tier / pending verification) accessing test attempt screens
          if (['subject', 'duration', 'test'].includes(screen)) {
            // Free-tier students are permitted to attempt practice tests without automatic payment redirect
          }
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

  // Route Guard Enforcement for registered non-admin students
  useEffect(() => {
    if (currentUser && !isAdmin && isRegisteredStudent) {
      if (screen === 'grades_flow' || screen === 'group') {
        // Redirect selection screen attempts straight to their authorized dashboard
        setScreen('dashboard');
      }
    }
  }, [currentUser, isAdmin, isRegisteredStudent, screen]);

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
      if (state && state.screen) {
        setScreen(state.screen);
        if (state.selectedClass !== undefined) setSelectedClass(state.selectedClass);
        if (state.selectedGroup !== undefined) setSelectedGroup(state.selectedGroup);
        if (state.selectedSubject !== undefined) setSelectedSubject(state.selectedSubject);
      } else {
        handleGlobalBackInternal();
      }
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
        console.log('[Auth Callback] Exchanging code for session with Supabase...');
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
        profile = await syncUserProfile(user);
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

      // 2. Check registration status
      const validGrade = Boolean(profile?.grade && profile.grade.trim() && profile.grade !== 'General Student');
      const validStream = Boolean(profile?.stream && profile.stream.trim());
      const isReg = isUserAdmin ||
        Boolean(profile?.is_registered) ||
        (validGrade && validStream) ||
        localStorage.getItem('boardly_registration_is_success') === 'true' ||
        profile?.payment_status === 'Pending Verification' ||
        profile?.plan_status === 'pending_verification';

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

        if (!isReg) {
          console.log('[Auth Flow] First-time Google OAuth sign-in detected. Routing to setup wizard...');
          setScreen('guided_wizard');
        } else {
          console.log('[Auth Flow] Returning Google OAuth user detected. Routing to dashboard...');
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
        }
      } else if (!isReg) {
        // Unregistered user on normal session restore
        const currentScreen = screenRef.current;
        const params = new URLSearchParams(window.location.search);
        const urlScreen = params.get('screen') as ScreenType | null;

        if (currentScreen === 'auth' || (currentScreen === 'dashboard' && (!urlScreen || urlScreen === 'guided_wizard'))) {
          console.log('[Auth Flow] Unregistered user detected. Triggering guided setup wizard...');
          setScreen('guided_wizard');
        }
      } else {
        // Registered user on normal session restore / refresh
        const activeScreen = screenRef.current;
        const params = new URLSearchParams(window.location.search);
        const urlScreen = params.get('screen') as ScreenType | null;
        if (!urlScreen && (activeScreen === 'intro' || activeScreen === 'auth')) {
          console.log('[Auth Flow] Authenticated user on root/intro screen. Routing to dashboard...');
          setScreen('dashboard');
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

    // 1. Initial Session Check on app load with explicit safety timeout (3500ms max)
    let splashTimeoutTimer: any = setTimeout(() => {
      if (!isSubscribed) return;
      console.warn('[Splash Screen Safety Timeout] Initial session check exceeded threshold. Releasing splash lock to allow user recovery.');
      setAuthTimedOut(true);
      setAuthLoading(false);
      setProfileSyncing(false);
    }, 3500);

    withTimeout(
      supabase.auth.getSession(),
      2500,
      { data: { session: null }, error: null } as any,
      'supabase.auth.getSession'
    )
      .then(({ data, error }) => {
        if (!isSubscribed) return;
        if (splashTimeoutTimer) {
          clearTimeout(splashTimeoutTimer);
          splashTimeoutTimer = null;
        }
        if (error) {
          console.warn('[getSession warning]:', error);
        }

        const session = data?.session;
        const user = session?.user ?? null;
        setCurrentUser(user);

        if (user) {
          processAuthUser(user, 'getSession');
        } else {
          setUserProfile(null);
        }

        setAuthLoading(false);
      })
      .catch((err) => {
        if (splashTimeoutTimer) {
          clearTimeout(splashTimeoutTimer);
          splashTimeoutTimer = null;
        }
        console.error('[getSession exception]:', err);
        if (isSubscribed) {
          setAuthLoading(false);
          setAuthError('Unable to connect to authentication server.');
        }
      });

    // 2. Real-time Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return;
      if (splashTimeoutTimer) {
        clearTimeout(splashTimeoutTimer);
        splashTimeoutTimer = null;
      }

      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'PASSWORD_RECOVERY')) {
        processAuthUser(user, event);
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

  // Verify active student session exists in database on protected page load / screen transition (throttled to avoid DB churn)
  const lastUserVerificationRef = useRef<number>(0);
  useEffect(() => {
    if (!currentUser) return;
    const isUserAdmin = Boolean(currentUser.email && isAdminEmail(currentUser.email));
    if (isUserAdmin) return;

    const protectedScreens = ['dashboard', 'subject', 'duration', 'test', 'result', 'admin', 'grades_flow', 'group'];
    const now = Date.now();
    // Only check at most once every 60 seconds unless on initial mount
    if (protectedScreens.includes(screen) && (now - lastUserVerificationRef.current > 60000)) {
      lastUserVerificationRef.current = now;
      checkUserExistsInDatabase(currentUser.id, currentUser.email).then((exists) => {
        if (!exists) {
          console.warn('[Protected Page Verification] Student record wiped/deleted in database. Forcing sign-out...');
          supabase.auth.signOut().then(() => {
            clearProfileCache();
            localStorage.removeItem('boardly_cached_user');
            localStorage.removeItem('boardly_cached_profile');
            if (currentUser?.id) {
              localStorage.removeItem(`boardly_profile_${currentUser.id}`);
            }
            setCurrentUser(null);
            setUserProfile(null);
            setScreen('auth');
          });
        }
      });
    }
  }, [screen, currentUser?.id, currentUser?.email]);

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

  const usedTestAttempts = currentMonthlyTestCount;
  const isTestLimitReached = !isPaymentApprovedOrExempt && usedTestAttempts >= 2;

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
    const isRegistered = currentUserRef.current && isRegisteredStudentRef.current && !isAdminRef.current;

    switch (scr) {
      case 'grades_flow':
        setScreen(isRegistered ? 'dashboard' : 'intro');
        break;
      case 'group':
        setScreen('grades_flow');
        break;
      case 'subject':
        setScreen(isRegistered ? 'dashboard' : 'group');
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
        setScreen(isRegistered ? 'dashboard' : 'intro');
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

  const handleSelectClass = (cNum: BoardClass) => {
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
    setSelectedClass(cNum);
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

    // TCAT and MDCAT use strictly verified hardcoded banks and must NEVER invoke AI/API background generation
    const isTcat = fullParams.path === 'tcat' || selectedClass === 'TCAT' || selectedGroup === 'TCAT' || (fullParams.subject || '').toLowerCase().includes('tcat') || targetSubject.toLowerCase().includes('tcat');
    const isMdcatTest = isMdcat || fullParams.path === 'mdcat' || selectedClass === 'MDCAT' || selectedGroup === 'MDCAT' || (fullParams.subject || '').toLowerCase().includes('mdcat') || targetSubject.toLowerCase().includes('mdcat');
    if (isTcat || isMdcatTest) {
      console.log('[MCQ Background Gen] TCAT/MDCAT test detected: strictly bypassing AI generation, relying solely on hardcoded question bank.');
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
            const uniqueDataQuestions = data.questions.filter(
              (q: Question, idx: number, self: Question[]) =>
                idx === self.findIndex((t) => t.q === q.q) &&
                !existingStems.some((e) => e.toLowerCase().trim() === (q.q || '').toLowerCase().trim())
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
              currentQuestions = [...currentQuestions, ...batchValidated];
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

      // If API attempt failed or returned no valid questions after retries, top up from prebuilt/fallback pool
      if (!batchAppended && !bgAbort.signal.aborted) {
        console.warn(`[MCQ Background Gen] Fallback topping up for ${targetSubject} at index ${currentQuestions.length}`);
        const topicPool = getPrebuiltQuestionsForSubject(targetSubject, targetTopic);
        const subjectPool = getPrebuiltQuestionsForSubject(targetSubject, undefined);
        const combinedPool = [...topicPool, ...subjectPool];
        const shuffledPrebuilt = [...combinedPool].sort(() => 0.5 - Math.random());
        const fallbackBatch: Question[] = [];
        for (const pbq of shuffledPrebuilt) {
          if (fallbackBatch.length >= nextBatchCount) break;
          if (!currentQuestions.some((cq) => (cq.q || '').toLowerCase().trim() === (pbq.q || '').toLowerCase().trim())) {
            fallbackBatch.push({
              ...pbq,
              id: `bg-fallback-${currentQuestions.length + fallbackBatch.length + 1}-${Date.now()}`,
            });
          }
        }

        if (fallbackBatch.length > 0) {
          currentQuestions = [...currentQuestions, ...fallbackBatch];
          if (currentQuestions.length > targetTotalCount) {
            currentQuestions = currentQuestions.slice(0, targetTotalCount);
          }
          setActiveQuestions([...currentQuestions]);
          console.log(`[MCQ Background Prebuilt Batch Appended] Total questions now: ${currentQuestions.length} / ${targetTotalCount}`);
        } else {
          console.warn(`[MCQ Background Gen] No additional authentic questions available for ${targetSubject} at ${currentQuestions.length}/${targetTotalCount}.`);
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 400));
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
    const targetTopic = params.customTopic !== undefined ? params.customTopic : customTopic;

    // Immediately sync state for downstream consumers
    setSelectedSubject(targetSubject);
    setCustomTopic(targetTopic);

    const isMdcat = selectedClass === 'MDCAT' || selectedGroup === 'MDCAT';
    const isTcat = selectedClass === 'TCAT' || selectedGroup === 'TCAT' || targetSubject.toLowerCase().includes('tcat');

    const config: TestConfig = {
      path: isMdcat ? 'mdcat' : isTcat ? 'tcat' : 'boards',
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

    let initialSet: Question[] = [];

    // TCAT Track: Exclusively assemble questions from verified hardcoded bank, zero AI/API generation, zero placeholder filler
    if (isTcat) {
      const isTcatMock = params.isFullMock || targetSubject.toLowerCase().includes('tcat full') || targetSubject.toLowerCase().includes('tcat mock') || targetTotalCount >= 100;
      if (isTcatMock) {
        initialSet = generateTCATFullMockBank(params.groupSubjects || params.chapterName || targetTopic || targetSubject);
      } else {
        initialSet = getTCATPrebuiltQuestions(targetSubject, targetTotalCount, targetTopic);
      }

      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else if (isMdcat) {
      // MDCAT Track: Exclusively assemble questions from verified hardcoded bank, zero AI/API generation, zero placeholder filler
      const isMdcatMock = params.isFullMock || targetSubject.toLowerCase().includes('mdcat full') || targetSubject.toLowerCase().includes('full mock') || targetTotalCount >= 180;
      if (isMdcatMock) {
        initialSet = generateMDCATFullMockBank();
      } else {
        initialSet = getMDCATPrebuiltQuestions(targetSubject, targetTotalCount, targetTopic);
      }

      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    } else {
      // 1. Instantly assemble initial questions from cache & prebuilt bank so the test screen opens immediately (< 0.5s)
      initialSet = getCachedQuestions(targetSubject, targetTopic) || [];
      
      // If cached set is larger than targetTotalCount, slice it to targetTotalCount
      if (initialSet.length > targetTotalCount) {
        initialSet = initialSet.slice(0, targetTotalCount);
      }

      // Top up using authentic prebuilt bank if needed
      if (initialSet.length < FIRST_BATCH_READY_THRESHOLD) {
        const prebuiltPool = getPrebuiltQuestionsForSubject(targetSubject, targetTopic);
        const shuffledPrebuilt = [...prebuiltPool].sort(() => 0.5 - Math.random());
        for (const pbq of shuffledPrebuilt) {
          if (initialSet.length >= targetTotalCount) break;
          if (!initialSet.some(q => (q.q || '').toLowerCase().trim() === (pbq.q || '').toLowerCase().trim())) {
            initialSet.push({
              ...pbq,
              id: `q-instant-${initialSet.length + 1}-${Date.now()}`
            });
          }
        }
      }

      // If initialSet is empty (no cache or prebuilt questions), fetch the first batch (5 questions) directly from API
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
                  isFirstBatch: true,
                }),
              });

              const apiElapsedMs = Date.now() - apiStartMs;
              if (fetchRes.ok) {
                const fetchData = await safeJsonResponse(fetchRes);
                console.log(`[MCQ Initial Batch Latency] HTTP Roundtrip: ${apiElapsedMs}ms (${(apiElapsedMs / 1000).toFixed(2)}s) | Server Gemini: ${fetchData?.latency?.geminiMs || 'N/A'}ms | Server Total: ${fetchData?.latency?.totalServerMs || 'N/A'}ms | Qs: ${fetchData?.questions?.length || 0}`);
                if (fetchData?.success && Array.isArray(fetchData.questions) && fetchData.questions.length > 0) {
                  initialSet = fetchData.questions.slice(0, targetTotalCount);
                  liveSuccess = true;
                  break;
                }
              } else {
                const errData = await safeJsonResponse(fetchRes).catch(() => null);
                console.warn(`[MCQ Live Fetch Non-OK Status ${fetchRes.status} in ${apiElapsedMs}ms]:`, errData);
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

      // If initialSet has fewer than targetTotalCount questions, pad BEFORE the test starts using authentic questions
      if (initialSet.length < targetTotalCount) {
        const prebuiltPool = getPrebuiltQuestionsForSubject(targetSubject, targetTopic);
        const shuffledPrebuilt = [...prebuiltPool].sort(() => 0.5 - Math.random());
        for (const pbq of shuffledPrebuilt) {
          if (initialSet.length >= targetTotalCount) break;
          if (!initialSet.some(q => (q.q || '').toLowerCase().trim() === (pbq.q || '').toLowerCase().trim())) {
            initialSet.push({
              ...pbq,
              id: `start-topup-${initialSet.length + 1}-${Date.now()}`
            });
          }
        }
      }

      // If authentic questions are fewer than targetTotalCount, adjust target to actual available count rather than injecting fake questions
      if (initialSet.length < targetTotalCount) {
        effectiveTargetTotalCount = initialSet.length;
      }
    }

    // Ensure readyQuestions only contains authentic questions
    const readyQuestions = initialSet.slice(0, effectiveTargetTotalCount).map(shuffleQuestionOptions);

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

    // 2. Launch background generation to fetch fresh AI-generated questions asynchronously (strictly disabled for TCAT and MDCAT)
    if (!isTcat && !isMdcat && effectiveTargetTotalCount > readyQuestions.length) {
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

    // Grand Mock Exams (100/180 MCQs) are strictly Pro-only
    const isGrandMock = Boolean(
      params.isFullMock ||
      (params.questionCount && params.questionCount >= 100) ||
      (params.subject && params.subject.toLowerCase().includes('full mock'))
    );
    if (isGrandMock && !isPaymentApprovedOrExempt) {
      setIsGenerating(false);
      setScreen('plan_selection');
      return;
    }

    // Pre-flight check against local count
    if (!isPaymentApprovedOrExempt && currentMonthlyTestCount >= 2) {
      setIsGenerating(false);
      openTestLimitModal(testLimitResetDate, currentMonthlyTestCount);
      return;
    }

    // Pre-flight limit check against server endpoint for non-Pro students
    if (!isPaymentApprovedOrExempt) {
      try {
        const checkRes = await apiFetch('/api/check-test-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            userEmail: currentUser.email,
          }),
        });
        const checkData = await safeJsonResponse(checkRes);
        if (checkData?.requiresAuth) {
          setIsGenerating(false);
          setPendingTestParams(params);
          setScreen('auth');
          return;
        }
        if (checkRes.status === 403 && (checkData?.limitExceeded === true || checkData?.allowed === false)) {
          setIsGenerating(false);
          const resetDate = checkData?.resetDate || testLimitResetDate;
          if (checkData?.resetDate) setTestLimitResetDate(checkData.resetDate);
          const usageToPass = Math.max(currentMonthlyTestCount, checkData?.currentUsage ?? 0);
          openTestLimitModal(resetDate, usageToPass);
          return;
        }
      } catch (checkErr) {
        console.warn('[handleStartTest check-test-limit warning]:', checkErr);
      }
    }

    // Immediately trigger loading feedback for 1st tap
    setIsGenerating(true);

    const targetSub = mapSubject(params.subject || selectedSubject || 'Physics');
    const targetTop = params.customTopic !== undefined ? params.customTopic : customTopic;
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
      const percentage = Math.round((correctCount / total) * 100);

      const result: TestResult = {
        id: `res-${Date.now()}`,
        timestamp: Date.now(),
        config: effectiveConfig,
        score: correctCount,
        total,
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

      // Switch to results screen immediately
      setScreen('results');

      // Save to Supabase and log MCQ attempts for student weakness profile in background
      const studentIdToLog = currentUser?.id || 'guest-student-1';
      saveTestToSupabase(studentIdToLog, historyItem, result, currentUser?.email)
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

  const showSplash =
    authLoading ||
    (profileSyncing && (!userProfile || !userProfile.is_registered)) ||
    (authTimedOut && !currentUser && !userProfile);

  if (showSplash) {
    if (authTimedOut || authError) {
      return (
        <div className="min-h-dvh h-dvh sm:min-h-screen bg-[#F8F9FB] text-slate-900 flex flex-col items-center justify-center p-4 relative">
          <div className="rounded-2xl p-6 sm:p-8 max-w-sm w-full flex flex-col items-center gap-4 text-center shadow-lg border border-slate-200 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-['Space_Grotesk'] font-bold text-base text-slate-900">
                Connection Taking Longer Than Usual
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                We're having trouble contacting authentication servers. You can retry connection or continue directly into the portal.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={handleRetryAuth}
                className="w-full py-2.5 px-4 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-bold rounded-xl text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>

              <button
                onClick={() => {
                  setAuthTimedOut(false);
                  setAuthLoading(false);
                  setProfileSyncing(false);
                  setScreen('intro');
                }}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Home Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setAuthTimedOut(false);
                  setAuthLoading(false);
                  setProfileSyncing(false);
                  setScreen('auth');
                }}
                className="text-[11px] font-semibold text-[#1E5AFF] hover:underline pt-1 cursor-pointer"
              >
                Sign In with Email / Password
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-dvh h-dvh sm:min-h-screen bg-[#F8F9FB] text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-[#1E5AFF] rounded-full animate-spin" />
      </div>
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
        canGoBack={screen !== 'intro' && screen !== 'dashboard' && screen !== 'admin'}
        isIntroScreen={screen === 'intro' && !currentUser}
        historyCount={history.length}
        onOpenHistory={() => openHistoryModal()}
        onOpenLmsPortal={() => openLmsModal()}
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
            const userTrack = getPricingTrackFromProfile(userProfile, selectedClass ? String(selectedClass) : undefined, selectedGroup);
            setSelectedPricingTrack(userTrack);
            try {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('screen', 'pricing');
              newUrl.searchParams.set('track', userTrack);
              window.history.pushState({}, '', newUrl.toString());
            } catch {}
            setScreen('pricing');
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
        ['intro', 'dashboard', 'admin', 'guided_wizard', 'plan_selection'].includes(screen)
          ? 'max-w-7xl'
          : ['grades_flow', 'test', 'results'].includes(screen)
          ? 'max-w-4xl'
          : 'max-w-3xl'
      }`}>
        <div className={`w-full mx-auto relative flex flex-col flex-1 min-w-0 ${
          ['intro', 'dashboard', 'admin', 'guided_wizard', 'plan_selection'].includes(screen)
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
                <React.Suspense
                  fallback={
                    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 text-center animate-ios-spring">
                      <BrandedLoadingSpinner size="lg" label="Loading Screen..." sublabel="Preparing module assets..." />
                    </div>
                  }
                >
                {(screen === 'intro' || screen === 'dashboard' || screen === 'stats') && (
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
                      onNavigateDashboard={() => setScreen('subjects')}
                      onSelectMdcat={() => handleSelectClass('MDCAT')}
                      onSelectTcat={() => handleSelectClass('TCAT')}
                      onUpgradeClick={() => setScreen('plan_selection')}
                      onStartPracticeTest={() => {
                        if (isTestLimitReached) {
                          openTestLimitModal(testLimitResetDate, currentMonthlyTestCount);
                          return;
                        }
                        if (userProfile?.grade) {
                          const gUpper = userProfile.grade.toUpperCase();
                          if (gUpper.includes('MDCAT')) {
                            setSelectedClass('MDCAT');
                            setSelectedGroup('MDCAT');
                          } else if (gUpper.includes('TCAT')) {
                            setSelectedClass('TCAT');
                            setSelectedGroup('TCAT');
                          } else {
                            setSelectedClass(userProfile.grade as BoardClass);
                            if (userProfile.stream) setSelectedGroup(userProfile.stream);
                          }
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
                {screen === 'guided_wizard' && (
                  <StudentRegistrationFlow
                    user={currentUser}
                    onRegistrationComplete={async (profile) => {
                      if (profile) {
                        setUserProfile(profile);
                      }
                      localStorage.setItem('boardly_registration_is_success', 'true');
                      localStorage.setItem('boardly_active_screen', 'dashboard');
                      try {
                        await refreshUserProfile();
                      } catch (e) {}
                      setScreen('dashboard');
                    }}
                    onSkipToPractice={() => {
                      localStorage.setItem('boardly_registration_is_success', 'true');
                      localStorage.setItem('boardly_active_screen', 'dashboard');
                      setScreen('dashboard');
                    }}
                  />
                )}
                {(screen === 'pricing' || screen === 'plan_selection') && (
                  <div className="w-full space-y-4 animate-fadeIn">
                    {trackNotice && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center text-xs font-bold text-blue-300 flex items-center justify-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-blue-400" />
                        <span>{trackNotice}</span>
                      </div>
                    )}
                    <PricingPage
                      userProfile={userProfile}
                      selectedClass={selectedClass ? String(selectedClass) : undefined}
                      selectedGroup={selectedGroup}
                      selectedTrackOverride={selectedPricingTrack}
                      currentTestsUsed={history.length}
                      onOpenPaymentModal={() => openPaymentModal(selectedPricingTrack, selectedPricingCycle)}
                      onContinueFree={() => {
                        setScreen(currentUser ? 'dashboard' : 'intro');
                      }}
                      onSelectProPlan={(track, cycle) => {
                        setSelectedPricingTrack(track);
                        setSelectedPricingCycle(cycle);
                        openPaymentModal(track, cycle);
                      }}
                      onBack={() => {
                        setScreen(currentUser ? 'dashboard' : 'intro');
                      }}
                    />
                  </div>
                )}
                {screen === 'payment_required' && (
                  currentUser ? (
                    <PaymentRequiredScreen
                      currentUser={currentUser}
                      userProfile={userProfile}
                      onOpenPaymentModal={() => openPaymentModal(selectedPricingTrack, selectedPricingCycle)}
                      onRefreshProfile={async () => {
                        await refreshUserProfile();
                      }}
                      onSignOut={async () => {
                        await supabase.auth.signOut();
                        setCurrentUser(null);
                        setUserProfile(null);
                        setScreen('intro');
                      }}
                    />
                  ) : (
                    <div className="bg-white  border border-slate-200  rounded-3xl p-8 max-w-lg mx-auto text-center space-y-5 shadow-2xl animate-ios-spring my-8">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#1E5AFF] mx-auto">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900 ">Sign In Required</h2>
                        <p className="text-xs text-slate-600  leading-relaxed">
                          Please sign in to check your subscription status or review payment verification.
                        </p>
                      </div>
                      <button
                        onClick={() => setScreen('auth')}
                        className="w-full bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        Sign In / Register
                      </button>
                    </div>
                  )
                )}
                {screen === 'grades_flow' && (
                  <GradesFlowScreen
                    onSelectClass={handleSelectClass}
                    onBack={() => setScreen('intro')}
                    userProfile={userProfile}
                    isRegisteredStudent={isRegisteredStudent}
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
                    } else if (!userProfile?.is_registered) {
                      setScreen('guided_wizard');
                    } else {
                      setScreen(nextScreenAfterAuth || 'dashboard');
                      setNextScreenAfterAuth(null);
                    }
                  }} selectedGradeContext={selectedClass?.toString()} onBack={() => setScreen(authBackScreen || 'intro')} />
                )}
                {screen === 'subjects' && (
                  (() => {
                    const defaultClassGroup = userProfile ? getStudentDefaultClassAndGroup(userProfile) : null;
                    const effectiveClass = selectedClass || defaultClassGroup?.classNum || 11;
                    const effectiveGroup = selectedGroup || defaultClassGroup?.group || 'Pre-Medical';
                    const isDashboardLoading = authLoading || (Boolean(currentUser) && !userProfile && profileSyncing);

                    if (isDashboardLoading) {
                      return (
                        <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-pulse">
                          <div className="bg-slate-100  border border-slate-200  rounded-3xl p-8 space-y-4">
                            <div className="h-4 w-32 bg-slate-200  rounded-full" />
                            <div className="h-8 w-64 bg-slate-200  rounded-xl" />
                            <div className="h-4 w-96 bg-slate-200  rounded-xl" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="h-48 bg-slate-100  rounded-2xl border border-slate-200 " />
                            <div className="h-48 bg-slate-100  rounded-2xl border border-slate-200 " />
                            <div className="h-48 bg-slate-100  rounded-2xl border border-slate-200 " />
                          </div>
                        </div>
                      );
                    }

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
                    onLoadPracticeBank={() => {
                      setBgGenError(null);
                      const targetSub = testConfig?.subject || selectedSubject || 'Physics';
                      const targetTop = testConfig?.customTopic;
                      const targetCount = testConfig?.questionCount || 10;
                      const isTcat = testConfig?.path === 'tcat' || selectedClass === 'TCAT' || selectedGroup === 'TCAT' || targetSub.toLowerCase().includes('tcat');
                      const isMdcatTest = testConfig?.path === 'mdcat' || selectedClass === 'MDCAT' || selectedGroup === 'MDCAT' || targetSub.toLowerCase().includes('mdcat');
                      
                      const newSet = [...activeQuestions];
                      if (isTcat) {
                        const tcatPool = getTCATPrebuiltQuestions(targetSub, targetCount, targetTop);
                        for (const q of tcatPool) {
                          if (newSet.length >= targetCount) break;
                          if (!newSet.some(existing => (existing.q || '').toLowerCase().trim() === (q.q || '').toLowerCase().trim())) {
                            newSet.push(q);
                          }
                        }
                      } else if (isMdcatTest) {
                        const mdcatPool = getMDCATPrebuiltQuestions(targetSub, targetCount, targetTop);
                        for (const q of mdcatPool) {
                          if (newSet.length >= targetCount) break;
                          if (!newSet.some(existing => (existing.q || '').toLowerCase().trim() === (q.q || '').toLowerCase().trim())) {
                            newSet.push(q);
                          }
                        }
                      } else {
                        const topicPool = getPrebuiltQuestionsForSubject(targetSub, targetTop);
                        const subjectPool = getPrebuiltQuestionsForSubject(targetSub, undefined);
                        const combinedPool = [...topicPool, ...subjectPool];
                        const shuffledPrebuilt = [...combinedPool].sort(() => 0.5 - Math.random());
                        
                        for (const pbq of shuffledPrebuilt) {
                          if (newSet.length >= targetCount) break;
                          if (!newSet.some(q => (q.q || '').toLowerCase().trim() === (pbq.q || '').toLowerCase().trim())) {
                            newSet.push({
                              ...pbq,
                              id: `practice-bank-${newSet.length + 1}-${Date.now()}`
                            });
                          }
                        }
                      }
                      
                      setActiveQuestions(newSet.slice(0, targetCount));
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
                {!['intro', 'dashboard', 'stats', 'guided_wizard', 'pricing', 'plan_selection', 'payment_required', 'grades_flow', 'group', 'auth', 'subjects', 'subject', 'duration', 'test', 'results', 'admin'].includes(screen) && (
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

      {/* MCQ Generation Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[300] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-ios-spring">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-4">
            <BrandedLoadingSpinner
              size="xl"
              label="Generating Your MCQs..."
              sublabel="Crafting curriculum-aligned questions with detailed scientific explanations. Please wait a moment."
            />
            <div className="w-full bg-slate-100  rounded-full h-1.5 overflow-hidden mt-1">
              <div className="bg-[#1E5AFF] h-full animate-pulse w-full" />
            </div>

            {/* Cancel / Exit Button */}
            <button
              type="button"
              id="cancel-generation-btn"
              onClick={() => {
                setLeaveModalConfig({
                  isOpen: true,
                  title: 'Leave this page?',
                  message: 'Question generation is still in progress and will be lost.',
                  stayLabel: 'Stay',
                  leaveLabel: 'Leave Anyway',
                  onConfirm: () => {
                    handleCancelGeneration();
                  },
                });
              }}
              className="mt-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel & Exit</span>
            </button>
          </div>
        </div>
      )}

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
  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  );
};

export default AppWithSettings;

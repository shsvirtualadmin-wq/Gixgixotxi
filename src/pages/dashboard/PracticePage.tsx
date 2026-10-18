import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, doc, getDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Zap,
  BookOpen,
  Target,
  Clock,
  ArrowRight,
  AlertTriangle,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { startTestSessionWithLimit, DailyTestLimitError } from '@/services/testLimits';
import { DailyLimitBlockedSheet } from '@/components/test/DailyLimitBlockedSheet';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { useUserChapterStats } from '@/hooks/useUserChapterStats';

import {
  getAllSubjects,
  getChaptersForSubject,
  formatSubjectName,
  formatChapterName,
  isSubjectPoolSupported,
  getSubjectPoolCollection,
} from '@/constants/taxonomy';
import {
  TARGET_UNIVERSITY_CRITERIA,
  getUniversityCriteria,
} from '@/constants/universityCriteria';
import type { QueryConstraint } from 'firebase/firestore';

export function PracticePage() {
  const { user, profile, university } = useUserProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { statsMap } = useUserChapterStats(user?.uid);

  const allTaxonomySubjects = useMemo(() => getAllSubjects(), []);
  const initialChapterSlug = searchParams.get('chapter') || 'integration-by-parts';

  const [selectedUniversity, setSelectedUniversity] = useState(
    university || profile?.targetUniversity || 'FAST-NUCES'
  );
  const [trackPickerOpen, setTrackPickerOpen] = useState(false);

  // Targeted Chapter Drill Modal State (4-step flow)
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillStep, setDrillStep] = useState<1 | 2 | 3 | 4>(1);
  const [drillSubject, setDrillSubject] = useState('mathematics');
  const [drillChapters, setDrillChapters] = useState<string[]>([initialChapterSlug]);
  const [drillCount, setDrillCount] = useState<number>(20);
  const [drillDifficulty, setDrillDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');

  const [launching, setLaunching] = useState(false);
  const [launchingType, setLaunchingType] = useState<'sprint' | 'full' | 'drill' | null>(null);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [todayAttempts, setTodayAttempts] = useState(0);
  const [blockedSheetOpen, setBlockedSheetOpen] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const launchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (university) {
      setSelectedUniversity(university);
    } else if (profile?.targetUniversity) {
      setSelectedUniversity(profile.targetUniversity);
    }
  }, [university, profile?.targetUniversity]);

  useEffect(() => {
    if (launchError && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [launchError]);

  const effectivePlan = useEffectivePlan();
  const isPro = effectivePlan.isUnlimited;
  const testsLeft = isPro ? 'Unlimited' : Math.max(0, FREE_DAILY_TESTS - todayAttempts);

  // PKT midnight reset timer countdown
  const [timeToMidnight, setTimeToMidnight] = useState('');

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const pktOffset = 5 * 60;
      const localOffset = now.getTimezoneOffset();
      const pktNow = new Date(now.getTime() + (pktOffset + localOffset) * 60 * 1000);

      const midnight = new Date(pktNow);
      midnight.setHours(24, 0, 0, 0);

      const diffMs = midnight.getTime() - pktNow.getTime();
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeToMidnight(
        `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      );
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's usage from Firestore
  useEffect(() => {
    if (!user) return;
    const dateKey = getPKTDateKey();
    getDoc(doc(db, 'users', user.uid, 'usage', dateKey))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTodayAttempts(Number(data?.testsStarted ?? data?.practiceAttempts ?? 0));
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('[PracticePage] Practice usage fetch notice:', err);
        }
      });
  }, [user]);

  // Selected University Criteria
  const currentUniversityCriteria = useMemo(
    () => getUniversityCriteria(selectedUniversity),
    [selectedUniversity]
  );

  // Chapters with accuracy for currently selected drill subject
  const currentSubjectChapters = useMemo(() => {
    const chapters = getChaptersForSubject(drillSubject);
    return chapters.map((ch) => {
      const stat = statsMap[ch.slug] || statsMap[ch.name.toLowerCase()];
      if (!stat || stat.total === 0) {
        return {
          slug: ch.slug,
          name: ch.name,
          statusLabel: 'Not attempted',
          acc: null,
          dots: 0,
          totalAnswered: 0,
        };
      }
      const dots = Math.max(1, Math.min(7, Math.round((stat.accuracy / 100) * 7)));
      const statusLabel = stat.notEnoughData
        ? `${stat.accuracy}% (Needs 3+)`
        : `${stat.accuracy}% accuracy`;
      return {
        slug: ch.slug,
        name: ch.name,
        statusLabel,
        acc: stat.accuracy,
        dots,
        totalAnswered: stat.total,
      };
    });
  }, [drillSubject, statsMap]);

  // Toggle chapter selection in Step 2 of Drill
  const handleToggleDrillChapter = (slug: string) => {
    setDrillChapters((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  };

  // Launch test handler
  const launchTest = async (
    type: 'sprint' | 'full' | 'drill',
    customConfig?: {
      subject?: string;
      chapters?: string[];
      count?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    }
  ) => {
    if (!user) {
      setLaunchError('Please sign in to start a practice test session.');
      return;
    }
    if (launching) return;

    setLaunching(true);
    setLaunchingType(type);
    setLaunchError(null);
    setLaunchStatus('Preparing your questions...');

    // 15-second safety timeout
    if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
    let timedOut = false;
    launchTimeoutRef.current = setTimeout(() => {
      timedOut = true;
      setLaunching(false);
      setLaunchingType(null);
      setLaunchStatus(null);
      setLaunchError(
        'Setting up your test session took longer than expected. Please check your connection and tap Try Again.'
      );
    }, 15000);

    let count = 10;
    let duration = 600; // 10 mins
    let title = '10-Minute Sprint';
    let subjectSlugToUse = 'mathematics';
    let targetChapterSlug = 'general';
    const targetUni = selectedUniversity === 'Any' ? 'FAST-NUCES' : selectedUniversity;

    if (type === 'full') {
      const criteria = currentUniversityCriteria;
      count = criteria.totalQuestions;
      duration = criteria.durationMinutes * 60;
      title = `${criteria.name} Full Mock Test`;
      subjectSlugToUse = 'all';

      // Pre-flight check: verify required subjects have questions
      try {
        const questionsColl = collection(db, 'questions');
        for (const split of criteria.subjectsSplit) {
          const subSlug = split.subject.toLowerCase();
          const qSnap = await getDocs(
            query(
              questionsColl,
              where('status', '==', 'published'),
              where('active', '==', true),
              where('subject', '==', subSlug),
              limit(1)
            )
          );
          if (qSnap.empty) {
            if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
            setLaunchError(
              `Not enough questions yet for ${formatSubjectName(subSlug)}. Please choose another subject or check back soon.`
            );
            setLaunching(false);
            setLaunchingType(null);
            setLaunchStatus(null);
            return;
          }
        }
      } catch (err: unknown) {
        if (import.meta.env.DEV) {
          console.warn('[PracticePage] Full mock pre-flight note:', err);
        }
      }
    } else if (type === 'drill') {
      subjectSlugToUse = customConfig?.subject || drillSubject;
      targetChapterSlug = 'general';
      count = customConfig?.count || drillCount || 20;
      duration = count * 60; // 1 min per MCQ
      title = `${formatSubjectName(subjectSlugToUse)} Drill`;
    }

    // Pre-flight check for sprint & drill
    if (type !== 'full') {
      let questionsCount = 0;
      try {
        if (subjectSlugToUse && isSubjectPoolSupported(subjectSlugToUse)) {
          const poolColl = getSubjectPoolCollection(subjectSlugToUse);
          const poolSnap = await getDocs(
            query(collection(db, poolColl), where('status', '==', 'published'), limit(count))
          );
          questionsCount = poolSnap.size;
        }

        if (questionsCount === 0) {
          const questionsColl = collection(db, 'questions');
          const constraints: QueryConstraint[] = [
            where('status', '==', 'published'),
            where('active', '==', true),
          ];

          if (subjectSlugToUse && subjectSlugToUse !== 'all') {
            constraints.push(where('subject', '==', subjectSlugToUse));
          }

          const snap = await getDocs(query(questionsColl, ...constraints, limit(count)));
          questionsCount = snap.size;

          if (questionsCount === 0 && type !== 'drill') {
            const generalSnap = await getDocs(
              query(questionsColl, where('status', '==', 'published'), where('active', '==', true), limit(count))
            );
            questionsCount = generalSnap.size;
          }
        }
      } catch (qErr: unknown) {
        if (import.meta.env.DEV) {
          console.warn('[PracticePage] Pre-flight query note:', qErr);
        }
        questionsCount = 1;
      }

      if (timedOut) return;

      if (questionsCount === 0) {
        if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
        setLaunchError(
          `Not enough questions yet for ${formatSubjectName(subjectSlugToUse)}. Please choose another subject or check back soon.`
        );
        setLaunching(false);
        setLaunchingType(null);
        setLaunchStatus(null);
        return;
      }
    }

    const newAttemptRef = doc(collection(db, 'attempts'));
    const attemptId = newAttemptRef.id;

    const attemptPayload = {
      id: attemptId,
      userId: user.uid,
      uid: user.uid,
      status: 'preparing' as const,
      mode: type,
      title,
      university: targetUni,
      subject: subjectSlugToUse,
      chapter: targetChapterSlug,
      totalQuestions: count,
      durationSeconds: duration,
      timed: true,
      difficulty: customConfig?.difficulty || drillDifficulty,
      createdAt: serverTimestamp(),
    };

    try {
      await startTestSessionWithLimit({
        uid: user.uid,
        userEmail: user.email,
        isUnlimited: Boolean(effectivePlan.isUnlimited || effectivePlan.isSuperAdmin),
        attemptPayload,
        customAttemptId: attemptId,
      });

      if (timedOut) return;
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);

      navigate(`/test/${attemptId}`, { state: { attempt: attemptPayload } });
    } catch (startErr: unknown) {
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
      setLaunching(false);
      setLaunchingType(null);
      setLaunchStatus(null);

      if (
        startErr instanceof DailyTestLimitError ||
        (startErr as { code?: string })?.code === 'DAILY_TESTS_LIMIT_EXCEEDED'
      ) {
        if (!effectivePlan.isUnlimited && !effectivePlan.isSuperAdmin) {
          setBlockedSheetOpen(true);
        }
        return;
      }

      setLaunchError('Could not start your test session. Please check your connection and try again.');
    }
  };

  return (
    <DashboardErrorBoundary fallbackTitle="Practice Cockpit encountered an issue">
      <div className="flex flex-col gap-6 max-w-[1000px] mx-auto pb-8">
        {/* ── Top Header Banner ── */}
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Badge color="muted">Daily Practice Hub</Badge>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Entrance Drill Engine
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Authentic entrance test simulations with verified negative marking rules &amp; timed pacing.
              </p>
            </div>

            <div className="flex items-center gap-6 self-start sm:self-auto border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-4 sm:pt-0 sm:pl-6 shrink-0">
              <div>
                <div className="text-[10px] uppercase font-semibold text-[var(--muted)] tracking-wider">
                  TESTS LEFT
                </div>
                <div className="font-doto text-2xl sm:text-3xl font-bold text-[var(--text)] mt-0.5">
                  {testsLeft}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-[var(--muted)] tracking-wider flex items-center gap-1">
                  <Clock size={12} className="text-[var(--red)]" />
                  <span>PKT Midnight Reset</span>
                </div>
                <div className="font-doto text-sm sm:text-base font-bold text-[var(--text)] mt-0.5">
                  {timeToMidnight || 'Calculating...'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Launch Status Bar ── */}
        {launchStatus && (
          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-xs flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="font-medium">{launchStatus}</span>
          </div>
        )}

        {/* ── Error Banner ── */}
        {launchError && (
          <div
            ref={errorBannerRef}
            style={{
              backgroundColor: 'rgba(215, 25, 33, 0.08)',
              borderColor: 'var(--accent)',
              color: 'var(--text)',
            }}
            className="p-4 rounded-2xl border text-xs sm:text-sm flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <p className="text-[var(--text)] leading-relaxed font-medium">{launchError}</p>
              </div>
              <button
                type="button"
                onClick={() => setLaunchError(null)}
                className="text-xs font-semibold text-[var(--accent)] hover:underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Practice Options Grid (3 Cards) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 10-Minute Sprint */}
          <Card className="justify-between p-6 flex flex-col">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center shrink-0">
                <Zap size={22} className="text-[var(--text)]" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  10-Minute Sprint
                </h2>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
                  10 mixed questions under strict 60s per-question pacing to build speed and accuracy.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>10 Questions</span>
                <span>·</span>
                <span>10 Minutes</span>
                <span>·</span>
                <span>Standard (+1.0 / 0.0)</span>
              </div>
            </div>

            <button
              onClick={() => launchTest('sprint')}
              disabled={launching}
              className="btn-red w-full mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {launchingType === 'sprint' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting Sprint...</span>
                </>
              ) : (
                <>
                  <span>Start Sprint</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </Card>

          {/* Card 2: Full Mock Test (Formerly Full Past Paper Mock) */}
          <Card className="justify-between p-6 flex flex-col">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-[var(--text)]" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Full Mock Test
                </h2>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
                  Authentic full-length entrance paper matched to your target university syllabus and negative marking scheme.
                </p>
              </div>

              {/* Target Track Picker Trigger */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Target Track:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTrackPickerOpen(true)}
                    className="text-[11px] font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    Change Track
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setTrackPickerOpen(true)}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-left hover:border-[var(--text-muted)] transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text)] truncate">
                      {currentUniversityCriteria.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] truncate">
                      {currentUniversityCriteria.badge}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted)] shrink-0" />
                </button>
              </div>

              {/* University Criteria on Card */}
              <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-[var(--muted)] block text-[10px]">Questions:</span>
                    <strong className="text-[var(--text)] font-semibold font-mono">
                      {currentUniversityCriteria.totalQuestions} MCQs
                    </strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-[var(--muted)] block text-[10px]">Time Allowed:</span>
                    <strong className="text-[var(--text)] font-semibold font-mono">
                      {currentUniversityCriteria.durationMinutes} Mins
                    </strong>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px]">
                  <span className="text-[10px] text-[var(--muted)] block">Marking Scheme:</span>
                  <span
                    className={`font-semibold text-[11px] ${
                      currentUniversityCriteria.hasNegativeMarking
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text)]'
                    }`}
                  >
                    {currentUniversityCriteria.negativeMarking}
                  </span>
                </div>

                <div className="text-[10px] text-[var(--muted)] leading-tight pt-1">
                  <span className="font-semibold text-[var(--text)]">Split: </span>
                  {currentUniversityCriteria.subjectsSplit
                    .map((s) => `${s.name} (${s.count})`)
                    .join(' · ')}
                </div>
              </div>
            </div>

            <button
              onClick={() => launchTest('full')}
              disabled={launching}
              className="btn-outline w-full mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {launchingType === 'full' ? (
                <>
                  <span className="w-4 h-4 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
                  <span>Starting Full Mock Test...</span>
                </>
              ) : (
                <>
                  <span>Start Full Mock Test</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </Card>

          {/* Card 3: Targeted Chapter Drill (Rebuilt with step-by-step popup) */}
          <Card className="justify-between p-6 flex flex-col">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center shrink-0">
                <Target size={22} className="text-[var(--text)]" />
              </div>
              <div>
                <h2
                  className="text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Targeted Chapter Drill
                </h2>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
                  Multi-step targeted generator. Choose subject, specific chapter(s) with accuracy diagnostic, question count, and difficulty.
                </p>
              </div>

              {/* Current Configuration Summary */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--muted)]">Subject:</span>
                  <strong className="text-[var(--text)] font-semibold capitalize">{drillSubject}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--muted)]">Chapters:</span>
                  <strong className="text-[var(--text)] font-semibold truncate max-w-[150px]">
                    {drillChapters.length} Selected
                  </strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--muted)]">Parameters:</span>
                  <strong className="text-[var(--text)] font-semibold">
                    {drillCount} MCQs · {drillDifficulty.toUpperCase()}
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setDrillStep(1);
                setDrillModalOpen(true);
              }}
              disabled={launching}
              className="btn-outline w-full mt-4 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {launchingType === 'drill' ? (
                <>
                  <span className="w-4 h-4 border-2 border-[var(--text)] border-t-transparent rounded-full animate-spin" />
                  <span>Starting Drill...</span>
                </>
              ) : (
                <>
                  <Sliders size={16} />
                  <span>Configure &amp; Start Drill</span>
                </>
              )}
            </button>
          </Card>
        </div>

        {/* ── TARGET TRACK PICKER BOTTOM-SHEET / POPUP MODAL ── */}
        {trackPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl max-h-[85vh] bg-[var(--surface)] border border-[var(--border)] rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-[var(--text)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3
                    className="text-lg font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Select Target University Track
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Official test criteria, negative marking rules, and subject-wise distributions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackPickerOpen(false)}
                  className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tracks List */}
              <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                {TARGET_UNIVERSITY_CRITERIA.map((criteria) => {
                  const isSelected = selectedUniversity === criteria.name || selectedUniversity === criteria.id;
                  return (
                    <div
                      key={criteria.id}
                      onClick={() => {
                        setSelectedUniversity(criteria.name);
                        setTrackPickerOpen(false);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--surface-2)] ring-1 ring-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                : 'border-[var(--border)]'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[var(--text)]">
                              {criteria.name}
                            </span>
                            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">
                              {criteria.badge}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            criteria.hasNegativeMarking
                              ? 'border-red-500/40 bg-red-500/10 text-red-500'
                              : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]'
                          }`}
                        >
                          {criteria.negativeMarking}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {criteria.description}
                      </p>

                      {/* Criteria Highlights: MCQs, Time, Split */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)]/60 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[var(--text)]">
                          {criteria.totalQuestions} MCQs
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] font-mono text-[var(--text)]">
                          {criteria.durationMinutes} Minutes
                        </span>
                        <span className="text-[var(--muted)] truncate max-w-[280px]">
                          {criteria.subjectsSplit.map((s) => `${s.name}: ${s.count}`).join(' · ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-[var(--border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setTrackPickerOpen(false)}
                  className="btn-outline px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP-BY-STEP TARGETED CHAPTER DRILL POPUP MODAL ── */}
        {drillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl max-h-[90vh] bg-[var(--surface)] border border-[var(--border)] rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-[var(--text)]"
            >
              {/* Modal Top Header with Steps Indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                      Step {drillStep} of 2
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">·</span>
                    <span className="text-[10px] text-[var(--muted)]">Practice Drill</span>
                  </div>
                  <h3
                    className="text-lg font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {drillStep === 1 ? 'Choose Subject' : `${formatSubjectName(drillSubject)} Drill Settings`}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setDrillModalOpen(false)}
                  className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── STEP 1: SELECT SUBJECT ── */}
              {drillStep === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--muted)]">
                    Pick a subject to drill. Next, configure your question count and difficulty to start immediately.
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {allTaxonomySubjects.map((sub) => {
                      const isSelected = drillSubject === sub.slug;
                      return (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => {
                            setDrillSubject(sub.slug);
                            setDrillStep(2);
                          }}
                          className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-xs'
                              : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-[var(--text)]">{sub.name}</span>
                            <ChevronRight size={14} className="text-[var(--muted)]" />
                          </div>
                          <span className="text-[11px] text-[var(--muted)]">
                            {isSubjectPoolSupported(sub.slug) ? 'Dedicated Pool' : 'Question Bank'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── STEP 2: NUMBER OF MCQS + DIFFICULTY + START ── */}
              {drillStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--muted)]">Subject:</span>
                      <strong className="text-[var(--text)] font-semibold capitalize font-mono text-sm">
                        {formatSubjectName(drillSubject)}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrillStep(1)}
                      className="text-[11px] text-[var(--accent)] hover:underline font-semibold cursor-pointer"
                    >
                      Change Subject
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2">
                      Number of Questions:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 20, 30, 40].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setDrillCount(num)}
                          className={`py-3 rounded-xl border text-center transition-all cursor-pointer ${
                            drillCount === num
                              ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)] font-bold ring-1 ring-[var(--accent)]'
                              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          <span className="block text-sm">{num}</span>
                          <span className="block text-[10px] text-[var(--muted)]">{num}m</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2">
                      Difficulty Level:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['easy', 'medium', 'hard', 'mixed'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setDrillDifficulty(diff)}
                          className={`py-3 rounded-xl border text-center capitalize text-xs transition-all cursor-pointer ${
                            drillDifficulty === diff
                              ? 'border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)] font-bold ring-1 ring-[var(--accent)]'
                              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setDrillStep(1)}
                      className="btn-outline px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDrillModalOpen(false);
                        launchTest('drill', {
                          subject: drillSubject,
                          count: drillCount,
                          difficulty: drillDifficulty,
                        });
                      }}
                      className="btn-red px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Sparkles size={14} />
                      <span>Start Drill</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Daily Limit Blocked Sheet ── */}
        <DailyLimitBlockedSheet
          isOpen={blockedSheetOpen && !effectivePlan.isUnlimited && !effectivePlan.isSuperAdmin}
          onClose={() => setBlockedSheetOpen(false)}
          testsUsed={todayAttempts >= FREE_DAILY_TESTS ? todayAttempts : FREE_DAILY_TESTS}
        />
      </div>
    </DashboardErrorBoundary>
  );
}

export default PracticePage;

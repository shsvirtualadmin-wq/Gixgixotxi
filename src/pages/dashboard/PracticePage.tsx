import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, doc, getDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
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
  Building2,
  Layers,
  Flag,
} from 'lucide-react';
import {
  fetchUniversities,
  fetchUniversityTopics,
  fetchMcqs,
  submitMcqReport,
} from '@/services/universityMcqService';
import {
  DEFAULT_D1_UNIVERSITIES,
  type D1UniversityRow,
  type D1McqRow,
} from '@/constants/d1Universities';
import { MathText } from '@/components/ui/MathText';
import { repairSplitOrGarbledMcqOptions } from '@/lib/math';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import {
  startTestSessionWithLimit,
  fetchDailyUsageFromServer,
  DailyTestLimitError,
} from '@/services/testLimits';
import { DailyLimitBlockedSheet } from '@/components/test/DailyLimitBlockedSheet';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { isQuotaExhaustedError } from '@/utils/quota';

import {
  getAllSubjects,
  formatSubjectName,
  isSubjectPoolSupported,
  getSubjectPoolCollection,
} from '@/constants/taxonomy';
import {
  TARGET_UNIVERSITY_CRITERIA,
  getUniversityCriteria,
} from '@/constants/universityCriteria';
import {
  USE_FIRESTORE_QUESTION_READER,
  getMultiSourceQuestionCounts,
} from '@/services/multiSourceQuestionBank';

const PKTMidnightCountdown = memo(function PKTMidnightCountdown() {
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

      setTimeToMidnight(
        `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
      );
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);
    return () => clearInterval(interval);
  }, []);

  return <>{timeToMidnight || 'Calculating...'}</>;
});

export function PracticePage() {
  const { user, profile, university } = useUserProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const allTaxonomySubjects = useMemo(() => getAllSubjects(), []);
  const urlUniversity = searchParams.get('university');
  const urlSubject = searchParams.get('subject');
  const initialChapterSlug = searchParams.get('chapter') || 'integration-by-parts';

  const [selectedUniversity, setSelectedUniversityState] = useState(
    urlUniversity || university || 'FAST-NUCES'
  );
  const [trackPickerOpen, setTrackPickerOpen] = useState(false);

  // Targeted Chapter Drill Modal State (4-step flow)
  const [drillModalOpen, setDrillModalOpen] = useState(
    Boolean(urlSubject || searchParams.get('mode') === 'drill')
  );
  const [drillStep, setDrillStep] = useState<1 | 2 | 3 | 4>(urlSubject ? 2 : 1);
  const [drillSubject, setDrillSubject] = useState(urlSubject || 'mathematics');
  const [drillChapters, setDrillChapters] = useState<string[]>([initialChapterSlug]);
  const [drillCount, setDrillCount] = useState<number>(20);
  const [drillDifficulty, setDrillDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');

  const setSelectedUniversity = (nextUni: string) => {
    setSelectedUniversityState(nextUni);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('university', nextUni);
    setSearchParams(nextParams, { replace: true });
  };

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
    if (urlUniversity) {
      setSelectedUniversityState(urlUniversity);
    } else if (university) {
      setSelectedUniversityState(university);
    }
  }, [university, urlUniversity]);

  useEffect(() => {
    if (launchError && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [launchError]);

  const effectivePlan = useEffectivePlan();
  const isPro = effectivePlan.isUnlimited;
  const testsLeft = isPro ? 'Unlimited' : Math.max(0, FREE_DAILY_TESTS - todayAttempts);

  // Fetch today's usage from Server + read-only Firestore usage doc (request.auth.uid == user.uid)
  useEffect(() => {
    if (!user) return;
    const dateKey = getPKTDateKey();
    Promise.all([
      getDoc(doc(db, 'users', user.uid, 'usage', dateKey)).catch(() => null),
      fetchDailyUsageFromServer(user.uid),
    ])
      .then(([snap, serverUsage]) => {
        const fsData = snap && snap.exists() ? snap.data() : null;
        const fsCount = Number(fsData?.testsStarted ?? fsData?.practiceAttempts ?? 0);
        const srvCount = Number(
          serverUsage?.testsStarted ?? serverUsage?.practiceAttempts ?? 0
        );
        setTodayAttempts(Math.max(fsCount, srvCount));
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

  // ── Cloudflare D1 University Subject & Topic Browser State (Zero Firebase) ──
  const [d1Universities, setD1Universities] = useState<D1UniversityRow[]>(DEFAULT_D1_UNIVERSITIES);
  const [d1SubjectsTree, setD1SubjectsTree] = useState<
    Array<{ subject: string; total: number; topics: Array<{ topic: string; count: number }> }>
  >([]);
  const [d1SelectedSubject, setD1SelectedSubject] = useState<string>('all');
  const [d1LoadingTopics, setD1LoadingTopics] = useState<boolean>(false);

  // Interactive D1 Practice Session State
  const [d1PracticeOpen, setD1PracticeOpen] = useState<boolean>(false);
  const [d1PracticeTitle, setD1PracticeTitle] = useState<string>('');
  const [d1PracticeMcqs, setD1PracticeMcqs] = useState<D1McqRow[]>([]);
  const [d1PracticeIndex, setD1PracticeIndex] = useState<number>(0);
  const [d1SelectedAnswers, setD1SelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [d1LoadingPractice, setD1LoadingPractice] = useState<boolean>(false);
  const [d1ReportToast, setD1ReportToast] = useState<string | null>(null);

  const activeD1Uni = useMemo(() => {
    const safeList = Array.isArray(d1Universities) ? d1Universities : DEFAULT_D1_UNIVERSITIES;
    const param = (urlUniversity || selectedUniversity || '').trim().toLowerCase();
    return (
      safeList.find(
        (u) =>
          u.id.toLowerCase() === param ||
          u.slug.toLowerCase() === param ||
          u.name.toLowerCase() === param
      ) ||
      safeList.find((u) => u.mcq_count > 0) ||
      safeList[0] ||
      null
    );
  }, [d1Universities, urlUniversity, selectedUniversity]);

  useEffect(() => {
    let mounted = true;
    fetchUniversities()
      .then((list) => {
        if (mounted && Array.isArray(list) && list.length > 0) {
          setD1Universities(list);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeD1Uni) return;
    let mounted = true;
    setD1LoadingTopics(true);
    fetchUniversityTopics(activeD1Uni.id)
      .then((res) => {
        if (mounted) {
          setD1SubjectsTree(Array.isArray(res?.subjects) ? res.subjects : []);
          setD1LoadingTopics(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setD1SubjectsTree([]);
          setD1LoadingTopics(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [activeD1Uni]);

  const startD1UniversityPractice = async (opts: { subject?: string; topic?: string; label: string }) => {
    if (!activeD1Uni) return;
    setD1LoadingPractice(true);
    setLaunchError(null);
    try {
      const res = await fetchMcqs({
        university_id: activeD1Uni.id,
        subject: opts.subject && opts.subject !== 'all' ? opts.subject : undefined,
        topic: opts.topic && opts.topic !== 'all' ? opts.topic : undefined,
        limit: 50,
        include_answers: true,
      });
      const list = Array.isArray(res?.mcqs) ? res.mcqs : [];
      if (list.length === 0) {
        setLaunchError(`No MCQs found for ${opts.label} in ${activeD1Uni.name} yet.`);
        return;
      }
      setD1PracticeTitle(`${activeD1Uni.name} · ${opts.label}`);
      setD1PracticeMcqs(list);
      setD1PracticeIndex(0);
      setD1SelectedAnswers({});
      setD1PracticeOpen(true);
    } catch {
      setLaunchError('Could not load university practice questions right now. Please try again.');
    } finally {
      setD1LoadingPractice(false);
    }
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
    const targetUni = type === 'sprint' ? 'Standard Sprint' : (selectedUniversity === 'Any' ? 'FAST-NUCES' : selectedUniversity);

    if (type === 'full') {
      const criteria = currentUniversityCriteria;
      count = criteria.totalQuestions;
      duration = criteria.durationMinutes * 60;
      title = `${criteria.name} Full Mock Test`;
      subjectSlugToUse = 'all';

      // Pre-flight check against Cloudflare D1 university MCQ bank
      try {
        const uniResp = await fetch('/api/universities');
        if (uniResp.ok) {
          const uniData = await uniResp.json();
          const list = Array.isArray(uniData?.universities) ? uniData.universities : [];
          const matchedUni = list.find(
            (u: any) =>
              u.slug?.toLowerCase() === selectedUniversity.toLowerCase() ||
              u.name?.toLowerCase() === selectedUniversity.toLowerCase() ||
              u.name?.toLowerCase() === criteria.name.toLowerCase()
          );
          if (matchedUni && Number(matchedUni.mcq_count || 0) <= 0) {
            if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
            setLaunchError(
              `${matchedUni.name} is Coming Soon (0 MCQs in bank yet). Choose a LIVE university or check back soon.`
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

      if (isQuotaExhaustedError(startErr)) {
        setLaunchError('Daily database limit reached, try again later.');
        return;
      }

      const msg = (startErr as { message?: string })?.message;
      if (msg && msg.includes('Not enough questions yet')) {
        setLaunchError(msg);
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
                  <PKTMidnightCountdown />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Launch Status Bar ── */}
        {launchStatus && (
          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <LineLoader context="test" variant="inline" message={launchStatus.slice(0, 30)} />
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

        {/* ── CLOUDFLARE D1 UNIVERSITY SUBJECT & TOPIC PRACTICE BROWSER ── */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={17} className="text-[var(--accent)]" />
                <h2
                  className="text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  University Subject &amp; Topic Bank
                </h2>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Select a LIVE university to practice its subjects and topics, or run a mixed university practice session.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activeD1Uni?.slug || ''}
                onChange={(e) => {
                  setSelectedUniversity(e.target.value);
                  setD1SelectedSubject('all');
                }}
                className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--text)]"
              >
                {(d1Universities || []).map((u) => (
                  <option key={u.id} value={u.slug}>
                    {u.name} ({u.mcq_count > 0 ? `${u.mcq_count} MCQs · LIVE` : 'Coming Soon'})
                  </option>
                ))}
              </select>

              {activeD1Uni && activeD1Uni.mcq_count > 0 && (
                <button
                  type="button"
                  disabled={d1LoadingPractice}
                  onClick={() =>
                    startD1UniversityPractice({
                      label: 'Mixed University Practice',
                    })
                  }
                  className="relative overflow-hidden btn-red px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>
                    {d1LoadingPractice
                      ? 'Preparing test...'
                      : `Practice Mixed (${activeD1Uni.mcq_count})`}
                  </span>
                  {d1LoadingPractice && <ButtonLineLoader />}
                </button>
              )}
            </div>
          </div>

          {d1LoadingTopics ? (
            <LineLoader context="universities" variant="section" />
          ) : !activeD1Uni || activeD1Uni.mcq_count === 0 || (d1SubjectsTree || []).length === 0 ? (
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-[var(--text)]">
                  {activeD1Uni?.name || 'Selected University'} — Coming Soon (0 MCQs)
                </span>
                <p className="text-[var(--muted)] mt-0.5">
                  This university bank will unlock automatically as soon as MCQs are added in the Admin Question Bank.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] shrink-0">
                Coming Soon
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subject Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setD1SelectedSubject('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    d1SelectedSubject === 'all'
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]'
                  }`}
                >
                  All Subjects ({activeD1Uni.mcq_count})
                </button>
                {(d1SubjectsTree || []).map((s) => (
                  <button
                    key={s.subject}
                    type="button"
                    onClick={() => setD1SelectedSubject(s.subject)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      d1SelectedSubject === s.subject
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)]'
                    }`}
                  >
                    {s.subject} ({s.total})
                  </button>
                ))}
              </div>

              {/* Subject & Topic Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(d1SubjectsTree || [])
                  .filter((s) => d1SelectedSubject === 'all' || s.subject === d1SelectedSubject)
                  .map((s) => (
                    <div
                      key={s.subject}
                      className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text)]">{s.subject}</span>
                          <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                            {s.total} MCQs
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {(s.topics || []).map((t) => (
                            <button
                              key={t.topic}
                              type="button"
                              onClick={() =>
                                startD1UniversityPractice({
                                  subject: s.subject,
                                  topic: t.topic,
                                  label: `${s.subject} · ${t.topic}`,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[11px] text-[var(--text)] flex items-center gap-1 cursor-pointer"
                            >
                              <Layers size={10} className="text-[var(--accent)]" />
                              <span>{t.topic}</span>
                              <span className="font-mono text-[10px] text-[var(--muted)]">({t.count})</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          startD1UniversityPractice({
                            subject: s.subject,
                            label: `${s.subject} (All Topics)`,
                          })
                        }
                        className="w-full py-1.5 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-bold text-[var(--text)] flex items-center justify-between cursor-pointer"
                      >
                        <span>Practice {s.subject}</span>
                        <ArrowRight size={13} className="text-[var(--accent)]" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>

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
              className="relative overflow-hidden btn-red w-full mt-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {launchingType === 'sprint' ? (
                <>
                  <span>Starting Sprint...</span>
                  <ButtonLineLoader />
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
                  Authentic full-length practice paper matched to comprehensive curriculum and marking scheme.
                </p>
              </div>

              {/* Target Track Picker Trigger */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Test Track:
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
              className="relative overflow-hidden btn-outline w-full mt-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {launchingType === 'full' ? (
                <>
                  <span>Starting Mock Test...</span>
                  <ButtonLineLoader />
                </>
              ) : (
                <>
                  <span>Start Full Mock Test</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </Card>

          {/* Card 3: Focused Chapter Drill (Rebuilt with step-by-step popup) */}
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
                  Focused Chapter Drill
                </h2>
                <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
                  Multi-step focused generator. Choose subject, specific chapter(s) with accuracy diagnostic, question count, and difficulty.
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
              className="relative overflow-hidden btn-outline w-full mt-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ height: '48px' }}
            >
              {launchingType === 'drill' ? (
                <>
                  <span>Starting Drill...</span>
                  <ButtonLineLoader />
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl max-h-[85vh] glass-panel rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-[var(--text)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
                <div>
                  <h3
                    className="text-lg font-bold text-[var(--text)] font-dot"
                  >
                    Select Test Track
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Official test criteria, negative marking rules, and subject-wise distributions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackPickerOpen(false)}
                  className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={16} />
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
                      className={`p-4 rounded-[20px] transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isSelected
                          ? 'glass-row border-[var(--accent)] ring-1 ring-[var(--accent)]'
                          : 'glass-row hover:border-[var(--glass-border-hover)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                : 'border-[var(--glass-border)]'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[var(--text)]">
                              {criteria.name}
                            </span>
                            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full glass-pill text-[var(--muted)]">
                              {criteria.badge}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            criteria.hasNegativeMarking
                              ? 'border-red-500/40 bg-red-500/10 text-red-500'
                              : 'glass-pill text-[var(--muted)]'
                          }`}
                        >
                          {criteria.negativeMarking}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {criteria.description}
                      </p>

                      {/* Criteria Highlights: MCQs, Time, Split */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--glass-border)] text-[10px]">
                        <span className="px-2 py-0.5 rounded-md glass-pill font-dot font-bold text-[var(--text)]">
                          {criteria.totalQuestions} MCQs
                        </span>
                        <span className="px-2 py-0.5 rounded-md glass-pill font-dot font-bold text-[var(--text)]">
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
              <div className="pt-2 border-t border-[var(--glass-border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setTrackPickerOpen(false)}
                  className="btn-secondary px-4 py-2 rounded-full text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP-BY-STEP TARGETED CHAPTER DRILL POPUP MODAL ── */}
        {drillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overlay-blur bg-black/60 backdrop-blur-md animate-in fade-in">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl max-h-[90vh] glass-panel rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-[var(--text)]"
            >
              {/* Modal Top Header with Steps Indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-dot font-bold uppercase tracking-wider text-[var(--accent)]">
                      Step {drillStep} of 2
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">·</span>
                    <span className="text-[10px] text-[var(--muted)]">Practice Drill</span>
                  </div>
                  <h3
                    className="text-lg font-bold text-[var(--text)] font-dot"
                  >
                    {drillStep === 1 ? 'Choose Subject' : `${formatSubjectName(drillSubject)} Drill Settings`}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setDrillModalOpen(false)}
                  className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <X size={16} />
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
                            setDrillChapters([sub.slug]);
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

        {/* ── FULL-SCREEN UNIVERSITY PRACTICE RUNNER (100dvh, solid surface, no blur) ── */}
        {d1PracticeOpen && d1PracticeMcqs.length > 0 && (
          <div className="fixed inset-0 z-[100] w-screen h-[100dvh] flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-y-auto p-4 sm:p-6">
            <div className="w-full max-w-[760px] mx-auto rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 sm:p-6 space-y-5 text-[var(--text)]">
              {(() => {
                const currentQ = d1PracticeMcqs[d1PracticeIndex] || d1PracticeMcqs[0];
                const chosen = d1SelectedAnswers[currentQ.id];
                const isAnswered = Boolean(chosen);
                const correctCount = d1PracticeMcqs.filter(
                  (m) => d1SelectedAnswers[m.id] && d1SelectedAnswers[m.id] === m.correct_answer
                ).length;
                const answeredCount = Object.keys(d1SelectedAnswers).length;

                return (
                  <>
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-[var(--accent)]">
                          University MCQ Practice
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text)]">
                          {d1PracticeTitle}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">
                          Score: {correctCount}/{answeredCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setD1PracticeOpen(false)}
                          className="p-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {d1ReportToast && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
                        {d1ReportToast}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[var(--surface-2)] border border-[var(--border)]">
                          Q {d1PracticeIndex + 1} / {d1PracticeMcqs.length}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
                          {currentQ.subject} · {currentQ.topic}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] uppercase bg-[var(--surface-2)] border border-[var(--border)]">
                          {currentQ.difficulty}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          await submitMcqReport({
                            mcq_id: currentQ.id,
                            university_id: currentQ.university_id,
                            reason: 'student_flag',
                            details: `Flagged from ${d1PracticeTitle}`,
                            reported_by: user?.uid || 'student',
                          });
                          setD1ReportToast('Question reported to Admin Question Bank.');
                          setTimeout(() => setD1ReportToast(null), 3000);
                        }}
                        className="text-[11px] text-[var(--muted)] hover:text-[var(--accent)] flex items-center gap-1 cursor-pointer"
                      >
                        <Flag size={12} />
                        <span>Report</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-sm sm:text-base leading-relaxed">
                      <MathText text={currentQ.question} block />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {(() => {
                        const cleanOpts = repairSplitOrGarbledMcqOptions([
                          currentQ.option_a,
                          currentQ.option_b,
                          currentQ.option_c,
                          currentQ.option_d,
                        ]);
                        return (
                          [
                            ['A', cleanOpts[0]],
                            ['B', cleanOpts[1]],
                            ['C', cleanOpts[2]],
                            ['D', cleanOpts[3]],
                          ] as const
                        );
                      })().map(([letter, text]) => {
                        const isSelected = chosen === letter;
                        const isCorrect = currentQ.correct_answer === letter;
                        let styleClass =
                          'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]';
                        if (isAnswered) {
                          if (isCorrect) {
                            styleClass = 'border-emerald-500 bg-emerald-500/15 text-[var(--text)]';
                          } else if (isSelected) {
                            styleClass = 'border-red-500 bg-red-500/15 text-[var(--text)]';
                          }
                        }

                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => {
                              if (isAnswered) return;
                              setD1SelectedAnswers((prev) => ({
                                ...prev,
                                [currentQ.id]: letter,
                              }));
                            }}
                            className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${styleClass}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                                isAnswered && isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : isAnswered && isSelected
                                  ? 'bg-red-500 text-white'
                                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
                              }`}
                            >
                              {letter}
                            </span>
                            <div className="text-xs sm:text-sm flex-1 pt-0.5">
                              <MathText text={text} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1.5">
                        <div className="font-bold font-mono uppercase text-[11px] flex items-center gap-2">
                          <span
                            className={
                              chosen === currentQ.correct_answer
                                ? 'text-emerald-500'
                                : 'text-red-500'
                            }
                          >
                            {chosen === currentQ.correct_answer
                              ? 'Correct!'
                              : `Incorrect — Correct Answer is ${currentQ.correct_answer}`}
                          </span>
                        </div>
                        {currentQ.explanation && (
                          <div className="text-[var(--text)] pt-1">
                            <MathText text={currentQ.explanation} block />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                      <button
                        type="button"
                        disabled={d1PracticeIndex === 0}
                        onClick={() => setD1PracticeIndex((i) => Math.max(0, i - 1))}
                        className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft size={14} />
                        <span>Previous</span>
                      </button>

                      <button
                        type="button"
                        disabled={d1PracticeIndex + 1 >= d1PracticeMcqs.length}
                        onClick={() =>
                          setD1PracticeIndex((i) => Math.min(d1PracticeMcqs.length - 1, i + 1))
                        }
                        className="btn-red px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next Question</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </>
                );
              })()}
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

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, doc, getDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Zap, BookOpen, Target, Clock, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { FREE_DAILY_TESTS } from '@/constants/limits';
import { startTestSessionWithLimit, DailyTestLimitError } from '@/services/testLimits';
import { DailyLimitBlockedSheet } from '@/components/test/DailyLimitBlockedSheet';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { useUserChapterStats } from '@/hooks/useUserChapterStats';

const UNIVERSITIES = ['Any', 'FAST-NUCES', 'NUST NET', 'GIKI', 'LUMS', 'NED', 'MDCAT', 'ECAT'];

const SYLLABUS_CHAPTERS = [
  { subject: 'Mathematics', name: 'Integration by Parts' },
  { subject: 'Mathematics', name: 'Calculus & Derivatives' },
  { subject: 'Mathematics', name: 'Conic Sections & Hyperbola' },
  { subject: 'Physics', name: 'Electromagnetism & Induction' },
  { subject: 'Physics', name: 'Work, Energy & Power' },
  { subject: 'Physics', name: 'Nuclear Physics' },
  { subject: 'Chemistry', name: 'Aldehydes & Ketones' },
  { subject: 'Chemistry', name: 'Chemical Equilibrium' },
  { subject: 'Computer Science', name: 'Data Structures & Trees' },
  { subject: 'Computer Science', name: 'Digital Logic & Gates' },
  { subject: 'English', name: 'Sentence Correction & Idioms' },
  { subject: 'Analytical/IQ', name: 'Analytical Reasoning Scenarios' },
];

export function PracticePage() {
  const { user, profile, university } = useUserProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { statsMap } = useUserChapterStats(user?.uid);

  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState<string>(
    searchParams.get('chapter') || 'Integration by Parts'
  );
  const [selectedUniversity, setSelectedUniversity] = useState(university || profile?.targetUniversity || 'FAST-NUCES');
  const [launching, setLaunching] = useState(false);
  const [launchingType, setLaunchingType] = useState<'sprint' | 'full' | 'drill' | null>(null);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [lastLaunchParams, setLastLaunchParams] = useState<{ type: 'sprint' | 'full' | 'drill'; customChapter?: string } | null>(null);
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

  const chaptersWithRealStats = useMemo(() => {
    return SYLLABUS_CHAPTERS.map((ch) => {
      const lookupKey = ch.name.toLowerCase();
      const safeId = ch.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
      const stat = statsMap[lookupKey] || statsMap[safeId];

      if (!stat || stat.total === 0) {
        return {
          ...ch,
          statusLabel: 'Not attempted',
          acc: null,
          dots: 0,
          totalAnswered: 0,
        };
      }

      const dots = Math.max(1, Math.min(7, Math.round((stat.accuracy / 100) * 7)));
      const statusLabel = stat.notEnoughData
        ? `${stat.accuracy}% (Needs 3+)`
        : `${stat.accuracy}%`;

      return {
        ...ch,
        statusLabel,
        acc: stat.accuracy,
        dots,
        totalAnswered: stat.total,
      };
    });
  }, [statsMap]);

  const filteredChapters = useMemo(() => {
    if (selectedSubject === 'All') return chaptersWithRealStats;
    return chaptersWithRealStats.filter(c => c.subject === selectedSubject);
  }, [chaptersWithRealStats, selectedSubject]);

  const launchTest = async (type: 'sprint' | 'full' | 'drill', customChapter?: string) => {
    if (!user) {
      setLaunchError('Please sign in to start a practice test session.');
      return;
    }
    if (launching) return;

    setLastLaunchParams({ type, customChapter });
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
      setLaunchError('Setting up your test session took longer than expected. Please check your connection and try again.');
    }, 15000);

    let count = 10;
    let duration = 600; // 10 mins
    let title = '10-Minute Sprint';

    if (type === 'full') {
      count = 30;
      duration = 1800; // 30 mins
      title = `${selectedUniversity} Full Mock`;
    } else if (type === 'drill') {
      count = 20;
      duration = 1200; // 20 mins
      title = `${customChapter || selectedChapter} Drill`;
    }

    const chapterObj = SYLLABUS_CHAPTERS.find(c => c.name === (customChapter || selectedChapter));
    const subjectToUse = chapterObj ? chapterObj.subject : (selectedSubject !== 'All' ? selectedSubject : 'General');
    const targetUni = selectedUniversity === 'Any' ? 'FAST-NUCES' : selectedUniversity;
    const targetChapter = customChapter || selectedChapter;

    if (import.meta.env.DEV) {
      console.log(`[PracticePage] Launching ${type} test:`, {
        university: targetUni,
        subject: subjectToUse,
        chapter: targetChapter,
        count,
      });
    }

    let questionsCount = 0;
    try {
      const questionsColl = collection(db, 'questions');

      if (type === 'drill' && targetChapter) {
        try {
          const chSnap = await getDocs(query(questionsColl, where('chapter', '==', targetChapter), limit(count)));
          questionsCount = chSnap.size;
        } catch (err: unknown) {
          if (import.meta.env.DEV) {
            console.warn('[PracticePage] Chapter query note:', err);
          }
          questionsCount = 1;
        }
      }

      if (questionsCount === 0 && subjectToUse && subjectToUse !== 'All' && subjectToUse !== 'General') {
        try {
          const subjectQuery = query(
            questionsColl,
            where('subject', '==', subjectToUse),
            limit(count)
          );
          const snap = await getDocs(subjectQuery);
          questionsCount = snap.size;
        } catch (err: unknown) {
          if (import.meta.env.DEV) {
            const errObj = err as { message?: string };
            console.warn('[PracticePage] Filtered subject query exception:', err);
            if (errObj?.message?.includes('index')) {
              console.warn('[PracticePage] Required Firestore index url:', errObj.message);
            }
          }
          questionsCount = 1; // Proceed to test generator
        }
      }

      if (questionsCount === 0) {
        const generalSnap = await getDocs(query(questionsColl, limit(count)));
        questionsCount = generalSnap.size;
      }
    } catch (qErr: unknown) {
      if (import.meta.env.DEV) {
        console.warn('[PracticePage] Query pre-flight check notice:', qErr);
      }
      questionsCount = 1;
    }

    if (timedOut) return;

    if (questionsCount === 0) {
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
      setLaunchError(
        type === 'drill'
          ? `Questions for "${targetChapter}" aren't available yet. Please select another chapter or start a sprint.`
          : `Questions for ${subjectToUse} aren't available yet. Please select another subject or check back soon.`
      );
      setLaunching(false);
      setLaunchingType(null);
      setLaunchStatus(null);
      return;
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
      subject: subjectToUse,
      chapter: targetChapter,
      totalQuestions: count,
      durationSeconds: duration,
      timed: true,
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

      if (import.meta.env.DEV) {
        console.error('[PracticePage] Test start error:', startErr);
      }

      setLaunchError('Could not start your test session. Please check your connection and try again.');
    }
  };

  return (
    <DashboardErrorBoundary fallbackTitle="Practice Cockpit encountered an issue">
      <div className="flex flex-col gap-6 max-w-[1000px] mx-auto">
      {/* ── Header: TESTS LEFT in Dot font & PKT Midnight reset countdown ── */}
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
              Timed MCQs formatted with official university negative marking schemes.
            </p>
          </div>

          <div className="flex items-center gap-6 self-start sm:self-auto border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-4 sm:pt-0 sm:pl-6 shrink-0">
            {/* Tests left today in Doto font */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-[var(--muted)] tracking-wider">
                TESTS LEFT
              </div>
              <div className="font-doto text-2xl sm:text-3xl font-bold text-[var(--text)] mt-0.5">
                {testsLeft}
              </div>
            </div>

            {/* PKT Midnight Reset Countdown in Doto font */}
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

      {/* ── Friendly status indicator ── */}
      {launchStatus && (
        <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-xs flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="font-medium">{launchStatus}</span>
        </div>
      )}

      {/* ── Friendly Error Banner with Try Again Button ── */}
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

          {lastLaunchParams && (
            <div className="pt-2 border-t border-[var(--border)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => launchTest(lastLaunchParams.type, lastLaunchParams.customChapter)}
                className="btn-red text-xs px-3.5 py-1.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                <span>Try again</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Mode Selection: 3 Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: 10-Minute Sprint */}
        <Card className="justify-between p-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center shrink-0">
              <Zap size={22} className="text-[var(--red)]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                10-Minute Sprint
              </h2>
              <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
                Fast diagnostic sprint. 10 rapid-fire questions to test your speed and accuracy.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>10 Questions</span>
              <span>·</span>
              <span>10 Minutes</span>
              <span>·</span>
              <span>Negative 0.25</span>
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

        {/* Card 2: Full Past Paper */}
        <Card className="justify-between p-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center shrink-0">
              <BookOpen size={22} className="text-[var(--text)]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Full Past Paper Mock
              </h2>
              <p className="text-xs text-[var(--muted)] leading-relaxed mt-1">
                Full-length simulation matched to your target university syllabus and negative marking rules.
              </p>
            </div>

            {/* University Selector Dropdown */}
            <div>
              <label
                htmlFor="target-uni-select"
                className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1"
              >
                Target Track:
              </label>
              <select
                id="target-uni-select"
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] px-3 py-2 outline-none cursor-pointer"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {UNIVERSITIES.map(u => (
                  <option key={u} value={u} className="bg-[var(--surface)] text-[var(--text)]">
                    {u}
                  </option>
                ))}
              </select>
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
                <span>Starting Past Paper...</span>
              </>
            ) : (
              <>
                <span>Start Full Past Paper</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </Card>

        {/* Card 3: Targeted Chapter Drill */}
        <Card className="justify-between p-6">
          <div className="space-y-3">
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
                20 questions focused exclusively on a single high-yield chapter to turn weak areas into strengths.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span>20 Questions</span>
              <span>·</span>
              <span>20 Minutes</span>
              <span>·</span>
              <span className="truncate max-w-[120px] font-semibold text-[var(--text)]">
                {selectedChapter}
              </span>
            </div>
          </div>

          <button
            onClick={() => launchTest('drill')}
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
                <span>Start Chapter Drill</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </Card>
      </div>

      {/* ── Below: Chapter Chips with Real Accuracy Dot Rows and Red Start Button ── */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div>
            <h2
              className="text-lg font-bold text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Chapter Bank &amp; Accuracy Diagnostic
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Select a chapter chip to drill targeted past paper questions. Real accuracy calculated from your completed tests.
            </p>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science'].map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter Chips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
          {filteredChapters.map(c => {
            const isSelected = selectedChapter === c.name;
            return (
              <div
                key={c.name}
                onClick={() => setSelectedChapter(c.name)}
                className={`p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-sm'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--text)] truncate">
                    {c.name}
                  </span>
                  <span className={`font-doto text-xs font-bold ${c.acc !== null ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                    {c.statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>{c.subject}</span>
                  {/* Accuracy dots: 7 dots */}
                  <div className="flex items-center gap-1" title={c.acc !== null ? `${c.acc}% accuracy (${c.totalAnswered} answered)` : 'Not attempted yet'}>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < c.dots ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Chapter Action Row with red Start button */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[var(--muted)]">
            Selected Chapter:{' '}
            <strong className="text-[var(--text)] font-semibold">{selectedChapter}</strong>
          </div>

          <button
            onClick={() => launchTest('drill', selectedChapter)}
            disabled={launching}
            className="btn-red w-full sm:w-auto px-6 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ height: '48px' }}
          >
            {launchingType === 'drill' ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting Drill...</span>
              </>
            ) : (
              <>
                <span>Start &ldquo;{selectedChapter}&rdquo; Drill</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </Card>

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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  Compass,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAmbassadorTestById,
  getAllPublicGrandLineTests,
  getMyTestAttemptForTest,
  submitAmbassadorTestAttempt,
  type AmbassadorCustomTest,
  type AmbassadorTestDoc,
  type AmbassadorTestAttempt,
  type GradedAttemptQuestion,
} from '@/services/ambassadorTestService';
import { MathText } from '@/components/ui/MathText';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { extractIdFromSlug } from '@/utils/privacy';
import { routes } from '@/utils/routes';
import { showApiToast } from '@/lib/api';
import { PdfDownloadButton } from '@/components/drill/PdfDownloadButton';
import { BubbleLoader } from '@/components/ui/BubbleLoader';

const DEFAULT_ALREADY_ATTEMPTED_MSG =
  'Each Grand Line test can only be attempted once.';

export function GrandLineTestRunnerPage() {
  const { testId: rawTestId } = useParams<{ testId: string }>();
  const testId = extractIdFromSlug(rawTestId || '');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isResultMode =
    searchParams.get('mode') === 'result' ||
    searchParams.get('view') === 'result' ||
    location.pathname.endsWith('/result');
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading: authLoading } = useAuth();

  const [test, setTest] = useState<AmbassadorCustomTest | null>(null);
  const [otherTests, setOtherTests] = useState<AmbassadorTestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alreadyAttemptedInfo, setAlreadyAttemptedInfo] = useState<{
    message: string;
    attemptId?: string;
    attempt?: Partial<AmbassadorTestAttempt>;
  } | null>(null);
  const [loadingMyResult, setLoadingMyResult] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    attemptId?: string;
    testTitle: string;
    subject: string;
    captainName: string;
    crewName: string;
    studentName: string;
    date?: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    timeTakenSeconds: number;
    gradedQuestions: GradedAttemptQuestion[];
  } | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  const resolveStudentProfileName = useCallback((): string => {
    const fromProfile = String(profile?.displayName || '').trim();
    if (fromProfile && fromProfile.toLowerCase() !== 'student') return fromProfile;
    const fromAuth = String(user?.displayName || '').trim();
    if (fromAuth && fromAuth.toLowerCase() !== 'student') return fromAuth;
    const fromEmail = user?.email ? user.email.split('@')[0].trim() : '';
    if (fromEmail) return fromEmail;
    return fromProfile || fromAuth || 'Student';
  }, [profile, user]);

  const resolveStudentAvatar = useCallback((): string | null => {
    const pAny = profile as any;
    return (
      pAny?.equipped?.avatar ||
      pAny?.equippedAvatar ||
      profile?.photoURL ||
      user?.photoURL ||
      null
    );
  }, [profile, user]);

  const handleViewMyExistingResult = useCallback(async () => {
    if (!testId) return;
    setLoadingMyResult(true);
    try {
      const { attempt, test: testMeta } = await getMyTestAttemptForTest(testId);
      if (testMeta) {
        setTest(testMeta);
      }
      setScoreResult({
        attemptId: attempt.id,
        testTitle: attempt.testTitle || testMeta?.title || test?.title || 'Grand Line Drill',
        subject: attempt.subject || testMeta?.subject || test?.subject || 'General',
        captainName: attempt.captainName || testMeta?.captainName || test?.captainName || 'Captain',
        crewName: testMeta?.crewName || test?.crewName || 'Grand Line Crew',
        studentName: attempt.userName || attempt.studentName || resolveStudentProfileName(),
        date: attempt.date,
        score: attempt.score,
        totalQuestions:
          attempt.totalQuestions ||
          testMeta?.questionCount ||
          (attempt.gradedQuestions?.length ?? 0),
        percentage: attempt.percentage,
        timeTakenSeconds: attempt.timeTakenSeconds || 0,
        gradedQuestions: attempt.gradedQuestions || [],
      });
      setAlreadyAttemptedInfo(null);
      setSubmitted(true);
    } catch (err: any) {
      showApiToast(err?.rawMessage || err?.message || 'Could not load your drill result.', 'error');
    } finally {
      setLoadingMyResult(false);
    }
  }, [testId, test, resolveStudentProfileName]);

  useEffect(() => {
    let active = true;
    getAllPublicGrandLineTests()
      .then((list) => {
        if (active) {
          setOtherTests(list.filter((t) => t.id !== testId));
        }
      })
      .catch(() => {
        // non-fatal
      });
    return () => {
      active = false;
    };
  }, [testId]);

  useEffect(() => {
    if (!testId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    if (authLoading) {
      setLoading(true);
      return;
    }
    let active = true;
    // Reset ALL test states so switching from Test A to Test B never retains stale answers/results
    setLoading(true);
    setTest(null);
    setCurrentIndex(0);
    setAnswers({});
    setSubmitting(false);
    submittingRef.current = false;
    setSubmitted(false);
    setScoreResult(null);
    setNotFound(false);
    setLoadError(null);
    setAlreadyAttemptedInfo(null);

    if (isResultMode) {
      getMyTestAttemptForTest(testId)
        .then(({ attempt, test: testMeta }) => {
          if (!active) return;
          if (testMeta) setTest(testMeta);
          setScoreResult({
            attemptId: attempt.id,
            testTitle: attempt.testTitle || testMeta?.title || 'Grand Line Drill',
            subject: attempt.subject || testMeta?.subject || 'General',
            captainName: attempt.captainName || testMeta?.captainName || 'Captain',
            crewName: testMeta?.crewName || 'Grand Line Crew',
            studentName: attempt.userName || attempt.studentName || resolveStudentProfileName(),
            date: attempt.date,
            score: attempt.score,
            totalQuestions:
              attempt.totalQuestions ||
              testMeta?.questionCount ||
              (attempt.gradedQuestions?.length ?? 0),
            percentage: attempt.percentage,
            timeTakenSeconds: attempt.timeTakenSeconds || 0,
            gradedQuestions: attempt.gradedQuestions || [],
          });
          setSubmitted(true);
        })
        .catch((err: any) => {
          if (!active) return;
          if (err?.status === 404) {
            setNotFound(true);
          } else {
            setLoadError(err?.rawMessage || err?.message || 'Failed to load drill result.');
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }

    getAmbassadorTestById(testId, false, { silentErrorToast: true })
      .then((res) => {
        if (!active) return;
        if (!res) {
          setNotFound(true);
          return;
        }
        setTest(res);
        setTimeLeftSec((res.durationMinutes || 20) * 60);
        startTimeRef.current = Date.now();
      })
      .catch((err: any) => {
        if (!active) return;
        if (err?.status === 409 || err?.code === 'ALREADY_ATTEMPTED' || err?.data?.state === 'already_attempted') {
          setAlreadyAttemptedInfo({
            message: DEFAULT_ALREADY_ATTEMPTED_MSG,
            attemptId: err?.attemptId || err?.data?.attemptId,
            attempt: err?.attempt || err?.data?.attempt,
          });
        } else if (err?.status === 404 || err?.code === 'NOT_FOUND') {
          setNotFound(true);
        } else {
          setLoadError(err?.rawMessage || err?.message || 'Failed to load this drill.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [testId, isResultMode, authLoading, user?.uid, resolveStudentProfileName, retryCount]);

  const handleFinish = useCallback(async () => {
    if (!test || submitted || submitting || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const elapsedSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const answerArray = test.questions.map((_, idx) =>
      answers[idx] !== undefined ? answers[idx] : -1
    );
    const studentName = resolveStudentProfileName();
    const studentAvatar = resolveStudentAvatar();

    try {
      const attempt = await submitAmbassadorTestAttempt({
        testId: test.id,
        answers: answerArray,
        timeTakenSeconds: elapsedSec,
        userName: studentName,
        userAvatar: studentAvatar,
      });

      setScoreResult({
        attemptId: attempt.id,
        testTitle: attempt.testTitle || test.title,
        subject: attempt.subject || test.subject,
        captainName: attempt.captainName || test.captainName,
        crewName: test.crewName || 'Grand Line Crew',
        studentName: attempt.userName || attempt.studentName || studentName,
        date: attempt.date,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions || test.questions.length,
        percentage: attempt.percentage,
        timeTakenSeconds: attempt.timeTakenSeconds || elapsedSec,
        gradedQuestions:
          attempt.gradedQuestions ||
          test.questions.map((q, idx) => ({
            id: q.id,
            position: idx,
            question: q.question,
            options: q.options,
            selectedIndex: answers[idx] ?? -1,
            correctIndex: q.correctIndex ?? 0,
            isCorrect: (answers[idx] ?? -1) === (q.correctIndex ?? 0),
            explanation: q.explanation,
          })),
      });
      setSubmitted(true);
    } catch (err: any) {
      if (err?.status === 409 || err?.code === 'ALREADY_ATTEMPTED') {
        setAlreadyAttemptedInfo({
          message: err?.rawMessage || err?.data?.message || DEFAULT_ALREADY_ATTEMPTED_MSG,
          attemptId: err?.attemptId || err?.data?.attemptId,
          attempt: err?.attempt || err?.data?.attempt,
        });
      } else {
        showApiToast(err?.rawMessage || err?.message || 'Failed to submit test attempt.', 'error');
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [test, submitted, submitting, answers, resolveStudentProfileName, resolveStudentAvatar]);

  // Countdown timer
  useEffect(() => {
    if (!test || submitted || alreadyAttemptedInfo || timeLeftSec <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test, submitted, alreadyAttemptedInfo, timeLeftSec, handleFinish]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <BubbleLoader
            variant="section"
            showSkeletons
            skeletonCount={3}
            messages={['Preparing Grand Line drill...']}
          />
        </div>
      </div>
    );
  }

  // Show 404 screen ONLY when the API genuinely returned 404
  if (notFound) {
    return <NotFoundPage />;
  }

  // Friendly ALREADY_ATTEMPTED screen (HTTP 409)
  if (alreadyAttemptedInfo && !submitted) {
    const prevAttempt = alreadyAttemptedInfo.attempt;
    const hasScore =
      prevAttempt &&
      typeof prevAttempt.score === 'number' &&
      typeof prevAttempt.totalQuestions === 'number';
    const prevPct =
      prevAttempt && typeof prevAttempt.percentage === 'number'
        ? prevAttempt.percentage
        : hasScore && (prevAttempt.totalQuestions || 0) > 0
        ? Math.round(((prevAttempt.score || 0) / (prevAttempt.totalQuestions || 1)) * 100)
        : null;

    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <FileCheck2 size={28} />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Attempted
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--text)]">
              {prevAttempt?.testTitle || 'Drill Already Completed'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Each Grand Line test can only be attempted once.
            </p>
          </div>

          {hasScore && (
            <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4 flex items-center justify-around gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-[var(--muted)] block">
                  Previous Score
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[var(--text)] tabular-nums">
                  {prevAttempt.score} / {prevAttempt.totalQuestions}
                </span>
              </div>
              <div className="h-8 w-px bg-[var(--border)]" />
              <div>
                <span className="text-[11px] font-mono uppercase text-[var(--muted)] block">
                  Accuracy
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[var(--accent)] tabular-nums">
                  {prevPct ?? 0}%
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
            {loadingMyResult ? (
              <div className="w-full sm:w-64 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <BubbleLoader
                  variant="inline"
                  loading={loadingMyResult}
                  messages={['Loading your verified drill report...']}
                />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleViewMyExistingResult}
                  disabled={loadingMyResult}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs sm:text-sm font-bold hover:opacity-95 disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye size={15} />
                  <span>View Result</span>
                </button>

                <PdfDownloadButton
                  variant="secondary"
                  label={isAdmin ? 'Download Report' : 'Download PDF'}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold"
                  onDownload={async (onProgress, signal) => {
                    const { downloadDrillResultPdfByTestId } = await import(
                      '@/utils/testPdfExporter'
                    );
                    await downloadDrillResultPdfByTestId(
                      testId,
                      prevAttempt as AmbassadorTestAttempt | undefined,
                      resolveStudentProfileName(),
                      onProgress,
                      signal,
                      false
                    );
                    showApiToast('Result PDF downloaded successfully!', 'success');
                  }}
                />

                {isAdmin && (
                  <PdfDownloadButton
                    variant="outline"
                    label="Download Answer Key"
                    className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    onDownload={async (onProgress, signal) => {
                      const { downloadDrillResultPdfByTestId } = await import(
                        '@/utils/testPdfExporter'
                      );
                      await downloadDrillResultPdfByTestId(
                        testId,
                        prevAttempt as AmbassadorTestAttempt | undefined,
                        resolveStudentProfileName(),
                        onProgress,
                        signal,
                        true
                      );
                      showApiToast('Answer Key PDF downloaded successfully!', 'success');
                    }}
                  />
                )}
              </>
            )}

            {otherTests.length > 0 && (
              <Link
                to={routes.grandLineTestRun(otherTests[0].id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] inline-flex items-center justify-center gap-2"
              >
                <span>Next Drill: {otherTests[0].title}</span>
                <ArrowRight size={15} />
              </Link>
            )}

            <Link
              to="/grand-line"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft size={15} />
              <span>Back to Grand Line</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && scoreResult) {
    const {
      testTitle,
      subject,
      captainName,
      crewName,
      score,
      totalQuestions,
      percentage,
      timeTakenSeconds,
      gradedQuestions,
    } = scoreResult;
    const takenMins = Math.floor((timeTakenSeconds || 0) / 60);
    const takenSecs = (timeTakenSeconds || 0) % 60;

    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Score Summary Card */}
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 sm:p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Trophy size={28} />
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={12} />
                Attempted
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                {crewName} • {subject}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] mt-1">{testTitle}</h1>
            <p className="text-3xl sm:text-4xl font-extrabold text-[var(--accent)] mt-4 tabular-nums">
              {score} / {totalQuestions}{' '}
              <span className="text-lg font-semibold text-[var(--muted)]">({percentage}%)</span>
            </p>
            <p className="text-xs text-[var(--muted)] mt-2">
              Created by Captain {captainName} • Time taken:{' '}
              {takenMins > 0 ? `${takenMins}m ${takenSecs}s` : `${takenSecs}s`}
            </p>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              Each Grand Line test can only be attempted once.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <PdfDownloadButton
                label={isAdmin ? 'Download My Report' : 'Download PDF'}
                onDownload={async (onProgress, signal) => {
                  if (!scoreResult) return;
                  const { exportDrillResultToPdf } = await import('@/utils/testPdfExporter');
                  await exportDrillResultToPdf({
                    testId: testId || test?.id,
                    testTitle: scoreResult.testTitle,
                    subject: scoreResult.subject,
                    studentName: scoreResult.studentName || resolveStudentProfileName(),
                    date: scoreResult.date,
                    score: scoreResult.score,
                    totalQuestions: scoreResult.totalQuestions,
                    percentage: scoreResult.percentage,
                    timeTakenSeconds: scoreResult.timeTakenSeconds,
                    gradedQuestions: scoreResult.gradedQuestions,
                    signal,
                    onProgress,
                    isAdminAnswerKey: false,
                  });
                  showApiToast('Result PDF downloaded successfully!', 'success');
                }}
              />

              {isAdmin && (
                <PdfDownloadButton
                  variant="outline"
                  label="Download Answer Key"
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                  onDownload={async (onProgress, signal) => {
                    if (!scoreResult) return;
                    const { exportDrillResultToPdf } = await import('@/utils/testPdfExporter');
                    await exportDrillResultToPdf({
                      testId: testId || test?.id,
                      testTitle: scoreResult.testTitle,
                      subject: scoreResult.subject,
                      studentName: scoreResult.studentName || resolveStudentProfileName(),
                      adminName: resolveStudentProfileName(),
                      date: scoreResult.date,
                      score: scoreResult.score,
                      totalQuestions: scoreResult.totalQuestions,
                      percentage: scoreResult.percentage,
                      timeTakenSeconds: scoreResult.timeTakenSeconds,
                      gradedQuestions: scoreResult.gradedQuestions,
                      signal,
                      onProgress,
                      isAdminAnswerKey: true,
                    });
                    showApiToast('Answer Key PDF downloaded successfully!', 'success');
                  }}
                />
              )}

              <Link
                to="/grand-line/leaderboard"
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 flex items-center gap-1.5"
              >
                <Trophy size={14} />
                <span>View Leaderboard</span>
              </Link>

              {otherTests.length > 0 && (
                <Link
                  to={routes.grandLineTestRun(otherTests[0].id)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5"
                >
                  <span>Next Drill</span>
                  <ArrowRight size={14} />
                </Link>
              )}

              <Link
                to="/grand-line"
                className="px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5"
              >
                <Compass size={14} />
                <span>Back to Grand Line</span>
              </Link>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-[var(--text)]">
                Answer Key &amp; Explanations
              </h2>
              <span className="text-xs font-mono text-[var(--muted)]">
                {gradedQuestions.length} Questions
              </span>
            </div>
            {gradedQuestions.map((q, idx) => {
              const userChoice = q.selectedIndex;
              const isCorrect = q.isCorrect;
              return (
                <div
                  key={q.id || idx}
                  className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-mono font-bold text-[var(--muted)]">
                      Q{idx + 1}.
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                        <CheckCircle2 size={13} /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                        <XCircle size={13} /> {userChoice === -1 ? 'Wrong (Skipped)' : 'Wrong'}
                      </span>
                    )}
                  </div>
                  <div dir="auto" className="text-sm font-medium text-[var(--text)]">
                    <MathText text={q.question} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isRightOpt = optIdx === q.correctIndex;
                      const isUserOpt = optIdx === userChoice;
                      let cls = 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]';
                      if (isRightOpt) {
                        cls = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold';
                      } else if (isUserOpt && !isRightOpt) {
                        cls = 'border-red-500/50 bg-red-500/10 text-red-400';
                      }
                      return (
                        <div
                          key={optIdx}
                          dir="auto"
                          className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${cls}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-bold shrink-0">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <MathText text={opt} />
                          </div>
                          {isRightOpt && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                              Correct
                            </span>
                          )}
                          {isUserOpt && !isRightOpt && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 shrink-0">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div
                      dir="auto"
                      className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)]"
                    >
                      <span className="font-semibold text-[var(--text)]">Explanation: </span>
                      <MathText text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !test || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-[var(--card)] border border-[var(--border)] p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-amber-500 mb-3" />
          <h1 className="text-base font-bold text-[var(--text)]">Test Not Available</h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {loadError || 'This test has no questions yet.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            {loadError && (
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            )}
            <Link
              to="/grand-line"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-xs font-bold"
            >
              <ArrowLeft size={14} />
              <span>Back to Grand Line</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalQ = test.questions.length;
  const currentQ = test.questions[currentIndex] || test.questions[0];
  const mins = Math.floor(timeLeftSec / 60);
  const secs = timeLeftSec % 60;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/grand-line')}
                className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Exit
              </button>
              <span className="text-[var(--border)]">•</span>
              <span className="text-xs font-mono text-[var(--accent)] truncate">
                {test.crewName}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-[var(--text)] truncate">
              {test.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums">
              <Clock size={14} className={timeLeftSec < 60 ? 'text-red-500 animate-pulse' : 'text-[var(--muted)]'} />
              <span className={timeLeftSec < 60 ? 'text-red-500' : 'text-[var(--text)]'}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            </div>
            {submitting ? (
              <div className="w-48 px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <BubbleLoader
                  variant="inline"
                  loading={submitting}
                  messages={['Checking your answers...']}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Question Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="font-mono font-semibold tabular-nums">
              Question {currentIndex + 1} of {totalQ}
            </span>
            <span className="tabular-nums">
              {Object.keys(answers).length} / {totalQ} answered
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
            />
          </div>

          {/* Question Stem */}
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5 sm:p-6 space-y-5">
            <div dir="auto" className="text-base sm:text-lg font-medium text-[var(--text)] leading-relaxed">
              <MathText text={currentQ.question} />
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const selected = answers[currentIndex] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    dir="auto"
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentIndex]: idx }))}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] font-semibold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]/40'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        selected
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm">
                      <MathText text={opt} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft size={15} />
            Previous
          </button>

          {currentIndex < totalQ - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(totalQ - 1, i + 1))}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              Next
              <ChevronRight size={15} />
            </button>
          ) : submitting ? (
            <div className="w-56 p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <BubbleLoader
                variant="inline"
                loading={submitting}
                messages={['Checking your answers...']}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              Finish &amp; Score
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default GrandLineTestRunnerPage;


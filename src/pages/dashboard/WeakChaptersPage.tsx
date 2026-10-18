import { useState, useRef, useEffect } from 'react';
import { collection, doc, query, where, limit, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Target, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { startTestSessionWithLimit, DailyTestLimitError } from '@/services/testLimits';
import { DailyLimitBlockedSheet } from '@/components/test/DailyLimitBlockedSheet';
import { useUserChapterStats, type ChapterStatItem } from '@/hooks/useUserChapterStats';

export function WeakChaptersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { weakChapters, statsMap, loading, error: statsError } = useUserChapterStats(user?.uid);

  const [launchError, setLaunchError] = useState<string | null>(null);
  const [lastAttemptedChapter, setLastAttemptedChapter] = useState<ChapterStatItem | null>(null);
  const [launchingChapter, setLaunchingChapter] = useState<string | null>(null);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);
  const [blockedSheetOpen, setBlockedSheetOpen] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement | null>(null);
  const launchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const effectivePlan = useEffectivePlan();

  useEffect(() => {
    return () => {
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (launchError && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [launchError]);

  const handleDrillChapter = async (item: ChapterStatItem) => {
    if (!user) {
      setLaunchError('Please sign in to start a chapter drill.');
      return;
    }
    if (launchingChapter) return;

    setLastAttemptedChapter(item);
    setLaunchingChapter(item.chapter);
    setLaunchError(null);
    setLaunchStatus('Preparing your questions...');

    // 15-second safety timeout
    if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
    let timedOut = false;
    launchTimeoutRef.current = setTimeout(() => {
      timedOut = true;
      setLaunchingChapter(null);
      setLaunchStatus(null);
      setLaunchError('Setting up your drill took longer than expected. Please check your connection and try again.');
    }, 15000);

    try {
      if (import.meta.env.DEV) {
        console.log(`[WeakChapters] Setting up drill for chapter: "${item.chapter}"`);
      }

      // Check if questions are available
      const questionsColl = collection(db, 'questions');
      let questionsCount = 0;

      try {
        const chapterQuery = query(
          questionsColl,
          where('chapter', '==', item.chapter),
          limit(15)
        );
        const snap = await getDocs(chapterQuery);
        questionsCount = snap.size;
      } catch (checkErr: unknown) {
        if (import.meta.env.DEV) {
          const errObj = checkErr as { message?: string };
          console.warn('[WeakChapters] Pre-flight query notice:', checkErr);
          if (errObj?.message?.includes('index')) {
            console.warn('[WeakChapters] Required Firestore index url:', errObj.message);
          }
        }
        questionsCount = 1; // Proceed to attempt initialization
      }

      if (timedOut) return;

      if (questionsCount === 0) {
        // Fallback check on subject
        if (item.subject && item.subject !== 'General') {
          try {
            const subSnap = await getDocs(query(questionsColl, where('subject', '==', item.subject), limit(15)));
            questionsCount = subSnap.size;
          } catch {
            questionsCount = 1;
          }
        }
      }

      if (questionsCount === 0) {
        if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
        setLaunchingChapter(null);
        setLaunchStatus(null);
        setLaunchError(`Questions for ${item.chapter} aren't available yet. Please try another chapter or a general sprint.`);
        return;
      }

      const durationSeconds = 15 * 60; // 15 mins
      const newAttemptRef = doc(collection(db, 'attempts'));
      const attemptId = newAttemptRef.id;

      const attemptPayload = {
        id: attemptId,
        userId: user.uid,
        uid: user.uid,
        subject: item.subject,
        chapter: item.chapter,
        totalQuestions: 15,
        timed: true,
        durationSeconds,
        status: 'preparing' as const,
        createdAt: serverTimestamp(),
      };

      await startTestSessionWithLimit({
        uid: user.uid,
        isUnlimited: Boolean(effectivePlan.isUnlimited || effectivePlan.isSuperAdmin),
        attemptPayload,
        customAttemptId: attemptId,
      });

      if (timedOut) return;
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);

      navigate(`/test/${attemptId}`, { state: { attempt: attemptPayload } });
    } catch (startErr: unknown) {
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current);
      setLaunchingChapter(null);
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
        console.error('[WeakChapters] Drill setup error:', startErr);
      }

      setLaunchError('Could not start your chapter drill. Please check your connection and try again.');
    }
  };

  const allStatsList = Object.values(statsMap).filter((s) => s.total > 0);
  const masteredList = allStatsList.filter((s) => s.total >= 3 && s.accuracy >= 70);
  const developingList = allStatsList.filter((s) => s.total >= 3 && s.accuracy >= 50 && s.accuracy < 70);
  const needDataList = allStatsList.filter((s) => s.notEnoughData);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '1rem' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
          Weak Chapters Diagnostic
        </span>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginTop: 4 }}>
          Priority Weak Chapters
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Auto-diagnosed from completed attempts. Chapters with 3 or more answered questions and under 50% accuracy are prioritized here.
        </p>
      </div>

      {/* ── Status indicator ── */}
      {launchStatus && (
        <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-xs flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="font-medium">{launchStatus}</span>
        </div>
      )}

      {/* ── Error Banner with Try Again Button ── */}
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

          {lastAttemptedChapter && (
            <div className="pt-2 border-t border-[var(--border)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDrillChapter(lastAttemptedChapter)}
                className="btn-red text-xs px-3.5 py-1.5 rounded-xl cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                <span>Try again</span>
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
      ) : statsError ? (
        <EmptyState
          icon={<AlertTriangle size={36} className="text-[var(--accent)]" />}
          title="Could not load chapter analytics"
          description="Please check your connection and refresh the page."
          actionLabel="Refresh Page"
          onAction={() => window.location.reload()}
        />
      ) : weakChapters.length === 0 && allStatsList.length === 0 ? (
        <EmptyState
          icon={<Target size={40} className="text-[var(--text-muted)]" />}
          title="No practice data yet"
          description="Take practice tests in Physics, Math, Chemistry, or Computer Science. Once you complete at least 3 questions in a chapter, your accuracy will be diagnosed here."
          actionLabel="Start a Practice Sprint"
          onAction={() => navigate('/dashboard/practice')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* High Priority (Weak: total >= 3 and acc < 50%) */}
          {weakChapters.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--red)' }}>
                <AlertTriangle size={18} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  High-Risk Topics (Below 50% Accuracy)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {weakChapters.map((ch) => (
                  <GlassCard
                    key={ch.id}
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      borderLeft: '4px solid var(--accent)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-hover)', color: 'var(--text-faint)' }}>
                          {ch.subject}
                        </span>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                          {ch.chapter}
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {ch.correct} / {ch.total} answered correctly ({ch.accuracy}% accuracy)
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span className="font-display tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>
                        {ch.accuracy}%
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDrillChapter(ch)}
                        loading={launchingChapter === ch.chapter}
                      >
                        <Target size={13} /> Drill Topic
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center flex flex-col items-center gap-2">
              <Target size={28} className="text-[var(--text-muted)] opacity-60 mb-1" />
              <p className="text-sm font-semibold text-[var(--text)]">No weak chapters detected</p>
              <p className="text-xs text-[var(--text-muted)] max-w-md">
                None of your attempted chapters are below 50% accuracy with 3+ attempts. Great job maintaining high aggregate accuracy!
              </p>
            </div>
          )}

          {/* Chapters with fewer than 3 attempts */}
          {needDataList.length > 0 && (
            <div>
              <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                Preliminary Chapters (Needs 3+ Questions)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {needDataList.map((ch) => (
                  <GlassCard
                    key={ch.id}
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-hover)', color: 'var(--text-faint)' }}>
                          {ch.subject}
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {ch.chapter}
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ch.total} answered · Not enough data yet to diagnose
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDrillChapter(ch)}
                      loading={launchingChapter === ch.chapter}
                    >
                      <Target size={13} /> Continue Drill
                    </Button>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Developing & Mastered Topics */}
          {(developingList.length > 0 || masteredList.length > 0) && (
            <div>
              <h2 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
                Healthy &amp; Mastered Topics (50%+ Accuracy)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...masteredList, ...developingList].map((ch) => (
                  <GlassCard
                    key={ch.id}
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface-hover)', color: 'var(--text-faint)' }}>
                          {ch.subject}
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {ch.chapter}
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ch.correct} / {ch.total} answered ({ch.accuracy}% accuracy)
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="font-display tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                        {ch.accuracy}%
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDrillChapter(ch)}
                        loading={launchingChapter === ch.chapter}
                      >
                        Practice
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily limit reached modal */}
      <DailyLimitBlockedSheet
        isOpen={blockedSheetOpen}
        onClose={() => setBlockedSheetOpen(false)}
      />
    </div>
  );
}

export default WeakChaptersPage;

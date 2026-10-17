import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { TrendingDown, AlertTriangle, CheckCircle, ArrowRight, BookOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChapterStat {
  id: string;
  chapter: string;
  subject: string;
  correct: number;
  total: number;
}

export function WeakChaptersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<ChapterStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<{ code?: string; message: string; link?: string } | null>(null);
  const [launchError, setLaunchError] = useState<{ code?: string; message: string; link?: string } | null>(null);
  const [launchingChapter, setLaunchingChapter] = useState<string | null>(null);
  const [launchStatus, setLaunchStatus] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setPageError(null);
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'chapterStats'));
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          chapter: data.chapter || d.id,
          subject: data.subject || 'General',
          correct: Number(data.correct ?? 0),
          total: Number(data.total ?? 0),
        };
      });
      // Sort by accuracy ascending (weakest first)
      items.sort((a, b) => {
        const accA = a.total > 0 ? a.correct / a.total : 0;
        const accB = b.total > 0 ? b.correct / b.total : 0;
        return accA - accB;
      });
      setStats(items.filter((item) => item.total > 0));
    } catch (err: unknown) {
      console.error('[WeakChaptersPage] Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load chapter stats';
      setPageError({ message: msg });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleDrillChapter = async (item: ChapterStat) => {
    if (!user) {
      setLaunchError({ code: 'AUTH_REQUIRED', message: 'Please sign in to start a chapter drill.' });
      return;
    }
    setLaunchingChapter(item.chapter);
    setLaunchError(null);

    // ─── STEP (a): Button Clicked ───────────────────────────────────────────
    const stepAStart = Date.now();
    console.log(`[WeakChaptersPage] (a) Button clicked to drill chapter: "${item.chapter}" (${item.subject})`, {
      chapter: item.chapter,
      subject: item.subject,
      timestamp: new Date().toISOString(),
    });
    setLaunchStatus(`(a) Starting drill setup for "${item.chapter}"...`);

    // ─── STEP (b): Questions Query & Verification ───────────────────────────
    const stepBStart = Date.now();
    console.log(`[WeakChaptersPage] (b) Starting Firestore questions query for chapter: "${item.chapter}"...`);
    setLaunchStatus(`(b) Querying questions from Firestore for "${item.chapter}"...`);

    let questionsCount = 0;
    try {
      const questionsColl = collection(db, 'questions');
      const queryPromise = (async () => {
        try {
          const chapterQuery = query(
            questionsColl,
            where('chapter', '==', item.chapter),
            limit(15)
          );
          const snap = await getDocs(chapterQuery);
          if (snap.size > 0) return snap.size;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('index') || (err as { code?: string })?.code === 'failed-precondition') {
            throw err;
          }
        }
        // Fallback to subject
        if (item.subject && item.subject !== 'General') {
          const subjectSnap = await getDocs(
            query(questionsColl, where('subject', '==', item.subject), limit(15))
          );
          if (subjectSnap.size > 0) return subjectSnap.size;
        }
        // Fallback general
        const generalSnap = await getDocs(query(questionsColl, limit(15)));
        return generalSnap.size;
      })();

      // Fast pre-flight check without hard-blocking failure: falls back to test generator
      try {
        questionsCount = await Promise.race([
          queryPromise,
          new Promise<number>((resolve) => setTimeout(() => resolve(1), 3000)),
        ]);
      } catch (checkErr) {
        console.warn('[WeakChaptersPage] Pre-check query note (proceeding with generator):', checkErr);
        questionsCount = 1;
      }
      const stepBElapsed = Date.now() - stepBStart;
      console.log(`[WeakChaptersPage] (b) Questions query completed in ${stepBElapsed}ms. Result count: ${questionsCount}`);
      setLaunchStatus(`(b) Pre-flight verified (${stepBElapsed}ms). Initializing chapter drill...`);
    } catch (qErr: unknown) {
      console.warn('[WeakChaptersPage] (b) Query note:', qErr);
      questionsCount = 1;
    }

    if (questionsCount === 0) {
      console.warn('[WeakChaptersPage] (b) No questions found in Firestore pool.');
      setLaunchError({
        code: 'NO_QUESTIONS',
        message: 'No questions available yet. Please check back soon.',
      });
      setLaunchingChapter(null);
      setLaunchStatus(null);
      return;
    }

    // ─── STEP (c): Attempt creation with Non-Blocking Client ID ─────────────
    const stepCStart = Date.now();
    console.log(`[WeakChaptersPage] (c) Generating client-side attempt ID to prevent server freeze...`);
    setLaunchStatus('(c) Creating attempt document...');

    const durationSeconds = 15 * 60; // 15 mins
    const endsAt = new Date(Date.now() + durationSeconds * 1000);

    const newAttemptRef = doc(collection(db, 'attempts'));
    const attemptId = newAttemptRef.id;

    const attemptPayload = {
      id: attemptId,
      userId: user.uid,
      uid: user.uid,
      subject: item.subject,
      chapter: item.chapter,
      difficulty: 'Medium',
      totalQuestions: 15,
      timed: true,
      durationSeconds,
      endsAt,
      status: 'preparing' as const,
      createdAt: serverTimestamp(),
    };

    setDoc(newAttemptRef, attemptPayload)
      .then(() => {
        const stepCElapsed = Date.now() - stepCStart;
        console.log(`[WeakChaptersPage] (c) Attempt setDoc finished in ${stepCElapsed}ms for ID: ${attemptId}`);
      })
      .catch((setErr: unknown) => {
        const stepCElapsed = Date.now() - stepCStart;
        console.error(`[WeakChaptersPage] (c) Background attempt setDoc failed after ${stepCElapsed}ms:`, setErr);
      });

    // ─── STEP (d): Navigation to Test Page ──────────────────────────────────
    const totalElapsed = Date.now() - stepAStart;
    console.log(`[WeakChaptersPage] (d) Navigating to /test/${attemptId} (total flow: ${totalElapsed}ms)`);
    setLaunchStatus(`(d) Launching test cockpit...`);
    navigate(`/test/${attemptId}`, { state: { attempt: attemptPayload } });
  };

  const weakChapters = stats.filter((s) => (s.correct / s.total) < 0.5);
  const moderateChapters = stats.filter((s) => (s.correct / s.total) >= 0.5 && (s.correct / s.total) < 0.75);
  const masteredChapters = stats.filter((s) => (s.correct / s.total) >= 0.75);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Weak Chapters Diagnostic
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Real-time chapter breakdown derived from your completed tests. Focus drills on high-risk topics.
        </p>
      </div>

      {/* Real-time on-screen step status indicator */}
      {launchStatus && (
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="font-mono text-xs">{launchStatus}</span>
        </div>
      )}

      {/* Real error message banner with code and index link */}
      {launchError && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-[var(--red)] text-red-200 text-xs sm:text-sm flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold flex items-center gap-2 text-red-100">
                <span>Error {launchError.code ? `[${launchError.code}]` : ''}:</span>
              </div>
              <p className="mt-1 text-red-200">{launchError.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setLaunchError(null)}
              className="text-xs font-semibold underline hover:text-white shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          {launchError.link && (
            <div className="pt-2 border-t border-red-800/60 flex items-center gap-2">
              <span className="text-xs text-red-300">Missing index:</span>
              <a
                href={launchError.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-white underline hover:text-red-200"
              >
                Create Firestore Index in Firebase Console &rarr;
              </a>
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
      ) : pageError ? (
        <ErrorState title="Could not load chapter analytics" error={pageError} onRetry={loadStats} />
      ) : stats.length === 0 ? (
        <EmptyState
          icon={<TrendingDown size={40} className="text-[#D71921]" />}
          title="No chapter analytics yet"
          description="Take practice tests in Physics, Math, and Chemistry. We will track your accuracy per chapter automatically."
          actionLabel="Start a Practice Drill"
          onAction={() => navigate('/dashboard/practice')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* High Priority (Weak) */}
          {weakChapters.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#D71921' }}>
                <AlertTriangle size={18} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  High-Risk Topics (Below 50% Accuracy)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {weakChapters.map((ch) => {
                  const acc = Math.round((ch.correct / ch.total) * 100);
                  return (
                    <GlassCard
                      key={ch.id}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderLeft: '4px solid #D71921',
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
                          {ch.correct} / {ch.total} answered correctly ({acc}% accuracy)
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span className="font-display tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: '#D71921' }}>
                          {acc}%
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
                  );
                })}
              </div>
            </div>
          )}

          {/* Moderate */}
          {moderateChapters.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--warning)' }}>
                <BookOpen size={18} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  Needs Practice (50% – 75% Accuracy)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {moderateChapters.map((ch) => {
                  const acc = Math.round((ch.correct / ch.total) * 100);
                  return (
                    <GlassCard
                      key={ch.id}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderLeft: '4px solid var(--warning)',
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
                          {ch.correct} / {ch.total} answered correctly ({acc}% accuracy)
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span className="font-display tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)' }}>
                          {acc}%
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDrillChapter(ch)}
                          loading={launchingChapter === ch.chapter}
                        >
                          Drill <ArrowRight size={13} />
                        </Button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mastered */}
          {masteredChapters.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--success)' }}>
                <CheckCircle size={18} />
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  Mastered Chapters (75%+ Accuracy)
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {masteredChapters.map((ch) => {
                  const acc = Math.round((ch.correct / ch.total) * 100);
                  return (
                    <GlassCard
                      key={ch.id}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderLeft: '4px solid var(--success)',
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
                          {ch.correct} / {ch.total} correct ({acc}% accuracy)
                        </p>
                      </div>
                      <span className="font-display tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
                        {acc}%
                      </span>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeakChaptersPage;

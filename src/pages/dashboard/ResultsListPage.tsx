import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, limit, startAfter, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { LineLoader } from '@/components/ui/LineLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { BookOpen, CheckCircle, Clock, ArrowRight, RefreshCw, BarChart2, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AttemptDoc } from '@/types/index';
import { getMyTestAttempts, type AmbassadorTestAttempt } from '@/services/ambassadorTestService';
import { showApiToast } from '@/lib/api';
import { PdfDownloadButton } from '@/components/drill/PdfDownloadButton';
import { RotatingBoardlyAd } from '@/components/BoardlyAd';
import { useLanguage } from '@/contexts/LanguageContext';

function getTimestampSeconds(val: unknown): number {
  if (!val || typeof val !== 'object') return 0;
  if ('seconds' in val && typeof (val as { seconds: unknown }).seconds === 'number') {
    return (val as { seconds: number }).seconds;
  }
  return 0;
}

function toTimestampDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === 'object' && val !== null) {
    if ('toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
      return new Date((val as { toMillis: () => number }).toMillis());
    }
    if ('seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
      return new Date((val as { seconds: number }).seconds * 1000);
    }
  } else if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return null;
}

function formatDurationLabel(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ResultsListPage() {
  const { user, profile, isAdmin, isGuest } = useAuth();
  const { t, formatNumber, formatDate } = useLanguage();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<AttemptDoc[]>([]);
  const [grandLineAttempts, setGrandLineAttempts] = useState<AmbassadorTestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const studentFallbackName =
    profile?.displayName?.trim() ||
    profile?.username?.trim() ||
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Student';

  const loadAttempts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const grandLinePromise = getMyTestAttempts().catch(() => [] as AmbassadorTestAttempt[]);

      if (isGuest || user.uid.startsWith('guest_')) {
        const [guestAttemptsRes, glList] = await Promise.all([
          fetch('/api/auth/guest/attempts', {
            method: 'GET',
            credentials: 'include',
          })
            .then((r) => r.json())
            .catch(() => ({ ok: false, attempts: [] })),
          grandLinePromise,
        ]);
        setGrandLineAttempts(glList);
        const guestPracticeAttempts = Array.isArray(guestAttemptsRes?.attempts)
          ? (guestAttemptsRes.attempts as AttemptDoc[]).filter(
              (a) =>
                (a.status === 'completed' || a.score !== undefined) &&
                !(a as any).testId
            )
          : [];
        setAttempts(guestPracticeAttempts);
        setLastDoc(null);
        setHasMore(false);
        return;
      }

      // Query attempts matching user ID with limit 20
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const [snap, glList] = await Promise.all([getDocs(q), grandLinePromise]);
      setGrandLineAttempts(glList);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttemptDoc));
      setAttempts(docs.filter((a) => a.status === 'completed' || a.score !== undefined));
      setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === 20);
    } catch (err: unknown) {
      console.warn('[ResultsListPage] Attempt query error:', err);
      // Fallback without compound index if needed
      try {
        const [snap, glList] = await Promise.all([
          getDocs(query(collection(db, 'attempts'), where('userId', '==', user.uid), limit(20))),
          getMyTestAttempts().catch(() => [] as AmbassadorTestAttempt[]),
        ]);
        setGrandLineAttempts(glList);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttemptDoc));
        docs.sort((a, b) => {
          const tA = getTimestampSeconds(a.createdAt);
          const tB = getTimestampSeconds(b.createdAt);
          return tB - tA;
        });
        setAttempts(docs.filter((a) => a.status === 'completed' || a.score !== undefined));
        setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
        setHasMore(snap.docs.length === 20);
      } catch (fallbackErr: unknown) {
        const glList = await getMyTestAttempts().catch(() => [] as AmbassadorTestAttempt[]);
        setGrandLineAttempts(glList);
        if (glList.length === 0) {
          const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load test history';
          setError({ message: msg });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, isGuest]);

  const handleLoadMore = useCallback(async () => {
    if (!user || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(20)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttemptDoc));
      const filtered = docs.filter((a) => a.status === 'completed' || a.score !== undefined);
      setAttempts((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const nextItems = filtered.filter((a) => !existingIds.has(a.id));
        return [...prev, ...nextItems];
      });
      setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === 20);
    } catch (err) {
      console.warn('[ResultsListPage] Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user, lastDoc, loadingMore]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          void handleLoadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, handleLoadMore]);

  const totalTests = attempts.length + grandLineAttempts.length;
  const sumPercentages =
    attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) +
    grandLineAttempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0);
  const avgAccuracy = totalTests > 0 ? Math.round(sumPercentages / totalTests) : 0;
  const totalQuestionsSolved =
    attempts.reduce((sum, a) => sum + (a.correctAnswers ?? 0), 0) +
    grandLineAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="text-start">
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {t('test.resultsTitle')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {t('dashboard.recentAttempts')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={loadAttempts} loading={loading}>
            <RefreshCw size={14} /> {t('common.refresh')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/grand-line')}>
            {t('nav.grandLine')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/practice')}>
            {t('dashboard.startPractice')}
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
            <BarChart2 size={16} />
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboard.testsCompleted')}</span>
          </div>
          <span className="font-display tabular-nums ltr-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
            {formatNumber(totalTests)}
          </span>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
            <CheckCircle size={16} />
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dashboard.accuracy')}</span>
          </div>
          <span
            className="font-display tabular-nums ltr-nums"
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: avgAccuracy >= 70 ? 'var(--success)' : avgAccuracy >= 40 ? 'var(--warning)' : '#D71921',
            }}
          >
            {formatNumber(avgAccuracy)}%
          </span>
        </GlassCard>

        <GlassCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
            <Clock size={16} />
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('test.correct')}</span>
          </div>
          <span className="font-display tabular-nums ltr-nums" style={{ fontSize: 32, fontWeight: 800, color: '#D71921' }}>
            {formatNumber(totalQuestionsSolved)}
          </span>
        </GlassCard>
      </div>

      {/* Attempts List */}
      {loading ? (
        <LineLoader context="results" variant="section" />
      ) : error && grandLineAttempts.length === 0 ? (
        <ErrorState title={t('common.somethingWrong')} error={error} onRetry={loadAttempts} />
      ) : totalTests === 0 ? (
        <EmptyState
          icon={<BookOpen size={40} className="text-[#D71921]" />}
          title={t('test.noResultsYet')}
          description={t('dashboard.noRecentAttempts')}
          actionLabel={t('dashboard.startPractice')}
          onAction={() => navigate('/dashboard/practice')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grandLineAttempts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} className="text-[#D71921]" />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {t('nav.grandLine')} (<span className="ltr-nums">{formatNumber(grandLineAttempts.length)}</span>)
                </h2>
              </div>

              {grandLineAttempts.map((glAtt) => {
                const pct = glAtt.percentage ?? 0;
                const score = glAtt.score ?? 0;
                const total = glAtt.totalQuestions ?? 0;
                const parsedDate = toTimestampDate(glAtt.submittedAt);
                const dateStr = parsedDate
                  ? formatDate(parsedDate, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : t('common.today');

                return (
                  <GlassCard
                    key={glAtt.id || glAtt.testId}
                    style={{
                      padding: '18px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                      cursor: 'pointer',
                      borderInlineStart: `4px solid ${pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : '#D71921'}`,
                    }}
                    onClick={() => navigate(`/grand-line/test/${glAtt.testId}/run?mode=result`)}
                    hover
                  >
                    <div style={{ minWidth: 0, flex: '1 1 240px' }} className="text-start">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                          {glAtt.testTitle || t('nav.grandLine')}
                        </h3>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'var(--surface-hover)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {glAtt.subject || t('nav.practice')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span className="ltr-nums">
                          {formatNumber(score)} / {formatNumber(total)} {t('test.correct')}
                        </span>
                        <span>·</span>
                        <span className="ltr-nums">{formatDurationLabel(glAtt.timeTakenSeconds)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'end', marginInlineEnd: 4 }}>
                        <div
                          className="font-display tabular-nums ltr-nums"
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : '#D71921',
                          }}
                        >
                          {formatNumber(pct)}%
                        </div>
                        <span className="ltr-nums" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatNumber(score)} / {formatNumber(total)}
                        </span>
                      </div>

                      <PdfDownloadButton
                        variant="secondary"
                        label="PDF"
                        className="text-xs py-1.5 px-3 h-8 font-semibold"
                        onDownload={async (onProgress, signal) => {
                          if (!glAtt.testId) return;
                          const { downloadDrillResultPdfByTestId } = await import(
                            '@/utils/testPdfExporter'
                          );
                          await downloadDrillResultPdfByTestId(
                            glAtt.testId,
                            glAtt,
                            studentFallbackName,
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
                          label="Answer Key"
                          className="text-xs py-1.5 px-3 h-8 font-semibold border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                          onDownload={async (onProgress, signal) => {
                            if (!glAtt.testId) return;
                            const { downloadDrillResultPdfByTestId } = await import(
                              '@/utils/testPdfExporter'
                            );
                            await downloadDrillResultPdfByTestId(
                              glAtt.testId,
                              glAtt,
                              studentFallbackName,
                              onProgress,
                              signal,
                              true
                            );
                            showApiToast('Answer Key PDF downloaded successfully!', 'success');
                          }}
                        />
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/grand-line/test/${glAtt.testId}/run?mode=result`);
                        }}
                      >
                        {t('test.viewResults')} <ArrowRight size={13} className="rtl-mirror" />
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {attempts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grandLineAttempts.length > 0 && (
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }} className="text-start">
                  {t('dashboard.recentAttempts')} (<span className="ltr-nums">{formatNumber(attempts.length)}</span>)
                </h2>
              )}
              {attempts.map((att) => {
                const parsedDate = toTimestampDate(att.createdAt);
                const dateStr = parsedDate
                  ? formatDate(parsedDate, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : t('common.today');

                const pct = att.percentage ?? 0;
                const score = att.score ?? 0;
                const total = att.totalQuestions ?? 0;

                return (
                  <GlassCard
                    key={att.id}
                    style={{
                      padding: '18px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                      cursor: 'pointer',
                      borderInlineStart: `4px solid ${pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : '#D71921'}`,
                    }}
                    onClick={() => navigate(`/test/${att.id}/result`)}
                    hover
                  >
                    <div className="text-start">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                          {att.subject ?? t('nav.practice')}
                        </h3>
                        {att.university && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'var(--surface-hover)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {att.university}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-faint)' }}>
                        <span>{dateStr}</span>
                        <span>·</span>
                        <span className="ltr-nums">
                          {formatNumber(att.correctAnswers ?? 0)} {t('test.correct')} / {formatNumber(att.wrongAnswers ?? 0)} {t('test.incorrect')}
                        </span>
                        {att.timeTakenSeconds && (
                          <>
                            <span>·</span>
                            <span className="ltr-nums">{formatNumber(Math.round(att.timeTakenSeconds / 60))} min</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'end' }}>
                        <div
                          className="font-display tabular-nums ltr-nums"
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : '#D71921',
                          }}
                        >
                          {formatNumber(pct)}%
                        </div>
                        <span className="ltr-nums" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatNumber(score)} / {formatNumber(total)}
                        </span>
                      </div>

                      <Button variant="secondary" size="sm" onClick={() => navigate(`/test/${att.id}/result`)}>
                        {t('test.reviewAnswers')} <ArrowRight size={13} className="rtl-mirror" />
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}

              {hasMore && <div ref={sentinelRef} style={{ height: 24, width: '100%' }} />}
              {loadingMore && (
                <div style={{ padding: '12px 0' }}>
                  <LineLoader variant="inline" context="results" message={t('common.loading')} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rotating Boardly Ad in bottom gap (hidden for Pro/Plus with ad-free ON) */}
      <RotatingBoardlyAd
        variant="card"
        slotKey="results_list_bottom"
        wrapperClassName="pt-2 pb-4"
      />
    </div>
  );
}

export default ResultsListPage;

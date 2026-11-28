import React, { useState, useEffect, useCallback } from 'react';
import { Compass, RefreshCw, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllGrandLineTestsForAdmin,
  type AmbassadorCustomTest,
} from '@/services/ambassadorTestService';
import {
  GrandLineStatusPills,
  GrandLineAdminRowControls,
  useServerSyncedClock,
} from './GrandLineScheduleSheet';
import {
  GlassCard,
  DotHeading,
  Pill,
  SkeletonListRows,
} from './AdminGlassPrimitives';
import { pluralize } from '@/utils/adminLabels';

export const GrandLineTestsAdminSection: React.FC = () => {
  const { isAdmin } = useAuth();
  const nowMs = useServerSyncedClock(1000);
  const [tests, setTests] = useState<AmbassadorCustomTest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTests = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const rows = await getAllGrandLineTestsForAdmin();
      setTests(rows);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  if (!isAdmin) return null;

  const handleRowUpdated = (updated: AmbassadorCustomTest) => {
    setTests((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );
  };

  return (
    <GlassCard
      variant="glass"
      padding="md"
      data-admin-section="grand-line-tests"
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Pill tone="accent">
            <Compass size={11} />
            <span>Grand Line Tests &bull; Schedule &amp; Status (PKT)</span>
          </Pill>
          <DotHeading as="h2" size="section">
            Grand Line Tests Management
          </DotHeading>
          <p className="text-xs text-[var(--text-muted)]">
            Control start/end schedules in Pakistan Standard Time (PKT, UTC+5) or manually set tests to Live, Ended, or Draft.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTests}
          disabled={loading}
          className="self-start sm:self-auto min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:border-[#E8353B] border border-[var(--border)] text-xs font-bold text-[var(--text)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-[#E8353B]' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && tests.length === 0 ? (
        <SkeletonListRows rows={3} />
      ) : tests.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-muted)]">
          No Grand Line tests found.
        </div>
      ) : (
        <div className="space-y-2.5">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-3.5 sm:p-4 rounded-[16px] ag-list-row flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill tone="accent" className="text-[10px]">
                    {test.subject}
                  </Pill>
                  <GrandLineStatusPills
                    test={test}
                    nowMs={nowMs}
                    showWindow={true}
                    showCountdown={true}
                  />
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[var(--text)] break-words">
                  {test.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] flex-wrap">
                  <span>By {test.captainName || 'Captain'}</span>
                  <span>&bull;</span>
                  <span>{pluralize(test.questionCount, 'question')}</span>
                  <span>&bull;</span>
                  <span>{pluralize(test.attemptsCount, 'attempt')}</span>
                  {test.reason && (
                    <>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300/90 font-medium">
                        <FileText size={11} />
                        <span>Note: {test.reason}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--border)]">
                <GrandLineAdminRowControls
                  test={test}
                  nowMs={nowMs}
                  onUpdated={handleRowUpdated}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

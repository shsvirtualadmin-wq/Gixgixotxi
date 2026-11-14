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
    <div className="bg-[#111114] border border-white/[0.07] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/30">
            <Compass size={11} />
            <span>Grand Line Tests • Schedule &amp; Status (PKT)</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Grand Line Tests Management
          </h2>
          <p className="text-xs text-[#9a9aa2]">
            Control start/end schedules in Pakistan Standard Time (PKT, UTC+5) or manually set tests to Live, Ended, or Draft.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTests}
          disabled={loading}
          className="self-start sm:self-auto min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-[#f0f0f2] inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && tests.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#9a9aa2]">
          Loading Grand Line tests...
        </div>
      ) : tests.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#9a9aa2]">
          No Grand Line tests found.
        </div>
      ) : (
        <div className="space-y-2.5">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-3.5 sm:p-4 rounded-xl bg-white/[0.025] border border-white/[0.07] flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/25">
                    {test.subject}
                  </span>
                  <GrandLineStatusPills
                    test={test}
                    nowMs={nowMs}
                    showWindow={true}
                    showCountdown={true}
                  />
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white break-words">
                  {test.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-[#9a9aa2] flex-wrap">
                  <span>By {test.captainName || 'Captain'}</span>
                  <span>•</span>
                  <span>{test.questionCount} questions</span>
                  <span>•</span>
                  <span>{test.attemptsCount} attempts</span>
                  {test.reason && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-amber-300/90 font-medium">
                        <FileText size={11} />
                        <span>Note: {test.reason}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
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
    </div>
  );
};

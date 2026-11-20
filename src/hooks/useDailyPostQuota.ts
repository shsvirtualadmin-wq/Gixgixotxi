import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import {
  buildDailyPostQuotaStatus,
  getDailyPostWindow,
  type DailyPostQuotaStatus,
} from '@/config/postLimits';
import { fetchDailyPostQuota } from '@/services/commonsService';

export interface UseDailyPostQuotaResult {
  quota: DailyPostQuotaStatus;
  loading: boolean;
  refreshQuota: () => Promise<void>;
  applyServerQuota: (serverQuota: Partial<DailyPostQuotaStatus> | null | undefined) => void;
  incrementLocalUsed: () => void;
}

/**
 * Live daily post quota hook:
 * - Reacts instantaneously to plan upgrades/downgrades via useEffectivePlan()
 * - Syncs authoritative `usedToday` from GET /api/posts/limit
 * - Automatically updates reset countdown & resets `usedToday` to 0 at midnight PKT
 */
export function useDailyPostQuota(enabled: boolean = true): UseDailyPostQuotaResult {
  const { user, isGuest } = useAuth();
  const { plan, isSuperAdmin } = useEffectivePlan();

  const uid = user?.uid || null;
  const effectivePlan = isSuperAdmin ? 'plus' : plan;

  const [usedState, setUsedState] = useState<{ dateKey: string; usedToday: number }>(() => ({
    dateKey: getDailyPostWindow().dateKey,
    usedToday: 0,
  }));
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState<boolean>(false);

  const applyServerQuota = useCallback(
    (serverQuota: Partial<DailyPostQuotaStatus> | null | undefined) => {
      if (!serverQuota || typeof serverQuota.usedToday !== 'number') return;
      const currentDateKey = serverQuota.dateKey || getDailyPostWindow().dateKey;
      setUsedState({
        dateKey: currentDateKey,
        usedToday: Math.max(0, Math.floor(serverQuota.usedToday)),
      });
      setNowMs(Date.now());
    },
    []
  );

  const incrementLocalUsed = useCallback(() => {
    const todayKey = getDailyPostWindow().dateKey;
    setUsedState((prev) => ({
      dateKey: todayKey,
      usedToday: prev.dateKey === todayKey ? prev.usedToday + 1 : 1,
    }));
    setNowMs(Date.now());
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!enabled || !uid || isGuest || uid.startsWith('guest_')) return;
    setLoading(true);
    try {
      const serverQuota = await fetchDailyPostQuota(effectivePlan);
      applyServerQuota(serverQuota);
    } catch {
      // Non-blocking: fall back to current local count & live client plan
    } finally {
      setLoading(false);
    }
  }, [enabled, uid, isGuest, effectivePlan, applyServerQuota]);

  // Fetch authoritative server count on open / user or plan change
  useEffect(() => {
    if (!enabled || !uid || isGuest || uid.startsWith('guest_')) return;
    void refreshQuota();
  }, [enabled, uid, isGuest, effectivePlan, refreshQuota]);

  // Stay in sync across multiple post composers/modals via CustomEvent
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onQuotaEvent = (e: Event) => {
      const detail = (e as CustomEvent<Partial<DailyPostQuotaStatus>>).detail;
      if (detail) {
        applyServerQuota(detail);
      }
    };
    window.addEventListener('boardly:post-quota-updated', onQuotaEvent);
    return () => window.removeEventListener('boardly:post-quota-updated', onQuotaEvent);
  }, [applyServerQuota]);

  // Refresh countdown every 30s and automatically roll over at midnight PKT
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      const nextNow = Date.now();
      setNowMs(nextNow);
      const latestDateKey = getDailyPostWindow(nextNow).dateKey;
      setUsedState((prev) =>
        prev.dateKey !== latestDateKey ? { dateKey: latestDateKey, usedToday: 0 } : prev
      );
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  const quota = useMemo(() => {
    const currentDateKey = getDailyPostWindow(nowMs).dateKey;
    const effectiveUsed = usedState.dateKey === currentDateKey ? usedState.usedToday : 0;
    return buildDailyPostQuotaStatus({
      plan: effectivePlan,
      usedToday: effectiveUsed,
      nowMs,
    });
  }, [effectivePlan, usedState, nowMs]);

  return {
    quota,
    loading,
    refreshQuota,
    applyServerQuota,
    incrementLocalUsed,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import {
  buildFallbackCreditsStatus,
  cacheAiCreditsStatus,
  fetchAiCreditsStatus,
  getCachedAiCreditsStatus,
  type AiCreditsStatus,
} from '@/services/aiMentorsService';
import { getPktResetInfo } from '@/utils/aiMentorsLogic';

export function useAiCredits() {
  const { user, isGuest, isSuperAdmin } = useAuth();
  const { plan, isPro, isPlus, source } = useEffectivePlan();
  const { config: plansConfig } = usePlansConfig();

  const uid = user?.uid || null;
  const fallback = buildFallbackCreditsStatus({
    plan,
    isPro,
    isPlus,
    isSuperAdmin,
    source,
    plansConfig,
  });

  const [status, setStatus] = useState<AiCreditsStatus>(() => {
    const cached = getCachedAiCreditsStatus(uid);
    if (
      cached &&
      cached.plan === fallback.plan &&
      cached.isSuperAdmin === fallback.isSuperAdmin &&
      cached.dailyLimit === fallback.dailyLimit
    ) {
      return cached;
    }
    return fallback;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [resetLabel, setResetLabel] = useState<string>(() => getPktResetInfo().countdownLabel);

  // Sync live plan or config/plans changes immediately (e.g. when Pro or Plus activates)
  useEffect(() => {
    setStatus((prev) => {
      if (
        prev.plan === fallback.plan &&
        prev.isPro === fallback.isPro &&
        prev.isPlus === fallback.isPlus &&
        prev.isSuperAdmin === fallback.isSuperAdmin &&
        prev.dailyLimit === fallback.dailyLimit
      ) {
        return prev;
      }
      return {
        ...prev,
        isPro: fallback.isPro,
        isPlus: fallback.isPlus,
        isPaid: fallback.isPaid,
        isSuperAdmin: fallback.isSuperAdmin,
        isUnlimited: fallback.isUnlimited,
        deepMaxUnlocked: fallback.deepMaxUnlocked,
        plan: fallback.plan,
        source: fallback.source,
        dailyLimit: fallback.dailyLimit,
        creditsLeft: fallback.isUnlimited
          ? fallback.dailyLimit
          : Math.max(0, fallback.dailyLimit - prev.creditsUsed),
      };
    });
  }, [
    fallback.plan,
    fallback.isPro,
    fallback.isPlus,
    fallback.isPaid,
    fallback.isSuperAdmin,
    fallback.isUnlimited,
    fallback.deepMaxUnlocked,
    fallback.source,
    fallback.dailyLimit,
  ]);

  const refresh = useCallback(async () => {
    if (!uid || isGuest || uid.startsWith('guest_')) return;
    setLoading(true);
    try {
      const live = await fetchAiCreditsStatus(uid, {
        plan,
        isPro,
        isPlus,
        isSuperAdmin,
        source,
        plansConfig,
      });
      setStatus(live);
    } catch {
      // Keep fallback / cached state if server is temporarily unavailable
    } finally {
      setLoading(false);
    }
  }, [uid, isGuest, plan, isPro, isPlus, isSuperAdmin, source, plansConfig]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Listen for cross-component credit updates (e.g. after sending an AI message)
  useEffect(() => {
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<AiCreditsStatus>).detail;
      if (detail) setStatus(detail);
    };
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener('boardly:ai-credits-updated', onUpdated);
    window.addEventListener('boardly:plan-refresh', onFocus);
    return () => {
      window.removeEventListener('boardly:ai-credits-updated', onUpdated);
      window.removeEventListener('boardly:plan-refresh', onFocus);
    };
  }, [refresh]);

  // Keep PKT reset countdown fresh every 60s
  useEffect(() => {
    const updateClock = () => setResetLabel(getPktResetInfo().countdownLabel);
    updateClock();
    const id = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const applyServerUpdate = useCallback(
    (patch: {
      creditsLeft: number;
      creditsUsed?: number;
      dailyLimit?: number;
      callMinutesUsed?: number;
      callMinutesLimit?: number;
      callMinutesLeft?: number;
      isUnlimited?: boolean;
      resetAt?: string;
      dateKey?: string;
    }) => {
      setStatus((prev) => {
        const nextLimit = patch.dailyLimit ?? prev.dailyLimit;
        const nextLeft = patch.creditsLeft;
        const nextUsed =
          patch.creditsUsed ?? Math.max(0, nextLimit - nextLeft);
        const nextCallLimit = patch.callMinutesLimit ?? prev.callMinutesLimit;
        const nextCallUsed = patch.callMinutesUsed ?? prev.callMinutesUsed;
        const nextCallLeft =
          patch.callMinutesLeft ?? Math.max(0, nextCallLimit - nextCallUsed);
        const next: AiCreditsStatus = {
          ...prev,
          creditsLeft: nextLeft,
          creditsUsed: nextUsed,
          dailyLimit: nextLimit,
          callMinutesUsed: nextCallUsed,
          callMinutesLimit: nextCallLimit,
          callMinutesLeft: nextCallLeft,
          isUnlimited: patch.isUnlimited ?? prev.isUnlimited,
          resetAt: patch.resetAt ?? prev.resetAt,
          dateKey: patch.dateKey ?? prev.dateKey,
          syncedFromServer: true,
        };
        cacheAiCreditsStatus(uid, next);
        return next;
      });
    },
    [uid]
  );

  return {
    credits: status,
    remaining: status.creditsLeft,
    used: status.creditsUsed,
    limit: status.dailyLimit,
    unlimited: status.isUnlimited,
    plan: status.plan,
    isPro: status.isPro,
    isPlus: status.isPlus,
    isPaid: status.isPaid,
    deepMaxUnlocked: status.deepMaxUnlocked,
    resetCountdown: resetLabel,
    loading,
    resetLabel,
    refresh,
    applyServerUpdate,
  };
}

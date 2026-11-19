import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
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
  const { isPro, source } = useEffectivePlan();

  const uid = user?.uid || null;
  const fallback = buildFallbackCreditsStatus({
    isPro,
    isSuperAdmin,
    source,
  });

  const [status, setStatus] = useState<AiCreditsStatus>(() => {
    const cached = getCachedAiCreditsStatus(uid);
    if (cached && cached.isPro === fallback.isPro && cached.isSuperAdmin === fallback.isSuperAdmin) {
      return cached;
    }
    return fallback;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [resetLabel, setResetLabel] = useState<string>(() => getPktResetInfo().countdownLabel);

  // Sync live plan changes immediately (e.g. when Pro activates)
  useEffect(() => {
    setStatus((prev) => {
      if (
        prev.isPro === fallback.isPro &&
        prev.isSuperAdmin === fallback.isSuperAdmin &&
        prev.dailyLimit === fallback.dailyLimit
      ) {
        return prev;
      }
      return {
        ...prev,
        isPro: fallback.isPro,
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
    fallback.isPro,
    fallback.isSuperAdmin,
    fallback.isUnlimited,
    fallback.deepMaxUnlocked,
    fallback.plan,
    fallback.source,
    fallback.dailyLimit,
  ]);

  const refresh = useCallback(async () => {
    if (!uid || isGuest || uid.startsWith('guest_')) return;
    setLoading(true);
    try {
      const live = await fetchAiCreditsStatus(uid, { isPro, isSuperAdmin, source });
      setStatus(live);
    } catch {
      // Keep fallback / cached state if server is temporarily unavailable
    } finally {
      setLoading(false);
    }
  }, [uid, isGuest, isPro, isSuperAdmin, source]);

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
      isUnlimited?: boolean;
      resetAt?: string;
      dateKey?: string;
    }) => {
      setStatus((prev) => {
        const nextLimit = patch.dailyLimit ?? prev.dailyLimit;
        const nextLeft = patch.creditsLeft;
        const nextUsed =
          patch.creditsUsed ?? Math.max(0, nextLimit - nextLeft);
        const next: AiCreditsStatus = {
          ...prev,
          creditsLeft: nextLeft,
          creditsUsed: nextUsed,
          dailyLimit: nextLimit,
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
    deepMaxUnlocked: status.deepMaxUnlocked,
    resetCountdown: resetLabel,
    loading,
    resetLabel,
    refresh,
    applyServerUpdate,
  };
}

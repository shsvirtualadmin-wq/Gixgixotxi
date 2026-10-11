import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { doc, getDocFromServer, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { PLAN_LIMITS, normalizePlanId, PlanType, getKarachiTodayString, getTimeUntilKarachiMidnight } from '../data/planLimits';

export interface UsageContextType {
  loading: boolean;
  dateKey: string;
  plan: PlanType;
  isUnlimited: boolean;
  testsLimit: number;
  testsUsed: number;
  testsLeft: number | 'Unlimited';
  aiChatsLimit: number;
  aiChatsUsed: number;
  aiChatsLeft: number | 'Unlimited';
  isTestBlocked: boolean;
  isAiBlocked: boolean;
  refillCountdown: string;
  canStartTest: () => boolean;
  canSendAiMessage: () => boolean;
  consumeTestStart: (sessionId: string) => Promise<boolean>;
  consumeAiChatReply: () => Promise<boolean>;
  refreshUsage: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType | null>(null);

export const UsageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin, authLoading, profileLoading } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [dateKey, setDateKey] = useState<string>(() => getKarachiTodayString());
  const [testsUsed, setTestsUsed] = useState<number>(() => {
    try {
      const today = getKarachiTodayString();
      const saved = localStorage.getItem(`boardly_usage_${today}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.testsUsed === 'number') return parsed.testsUsed;
      }
    } catch {}
    return 0;
  });
  const [aiChatsUsed, setAiChatsUsed] = useState<number>(() => {
    try {
      const today = getKarachiTodayString();
      const saved = localStorage.getItem(`boardly_usage_${today}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.aiChatsUsed === 'number') return parsed.aiChatsUsed;
      }
    } catch {}
    return 0;
  });
  const [activeSessions, setActiveSessions] = useState<string[]>([]);

  // Refill countdown state targeting midnight Pakistan Standard Time (PKT)
  const [countdownStr, setCountdownStr] = useState<string>(() => getTimeUntilKarachiMidnight().formattedCountdown);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownStr(getTimeUntilKarachiMidnight().formattedCountdown);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cache latest usage to prevent flicker on subsequent visits/refreshes
  useEffect(() => {
    try {
      localStorage.setItem(`boardly_usage_${dateKey}`, JSON.stringify({ testsUsed, aiChatsUsed }));
    } catch {}
  }, [dateKey, testsUsed, aiChatsUsed]);

  // Determine user plan and limits
  const userPlan: PlanType = useMemo(() => {
    if (isAdmin) return 'premium';
    return normalizePlanId(profile?.plan);
  }, [isAdmin, profile?.plan]);

  const planConfig = useMemo(() => {
    return PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
  }, [userPlan]);

  const testsLimit = typeof (profile as any)?.testsLimit === 'number'
    ? (profile as any).testsLimit
    : planConfig.testsPerDay;

  const aiChatsLimit = typeof (profile as any)?.boardyLimit === 'number'
    ? (profile as any).boardyLimit
    : planConfig.boardyPerDay;

  const isUnlimited = Boolean(isAdmin || userPlan === 'premium' || testsLimit >= 999);
  const isAiUnlimited = Boolean(isAdmin || userPlan === 'premium' || aiChatsLimit >= 999);

  // Live listener & initial server read
  const isInitializedRef = useRef<boolean>(false);
  const currentUidRef = useRef<string | null>(null);

  const fetchAuthoritativeUsage = useCallback(async (uid: string) => {
    const todayPkt = getKarachiTodayString();
    setDateKey(todayPkt);

    try {
      const userRef = doc(db, 'users', uid);
      // Read authoritative server state first without stale local cache
      const serverSnap = await getDocFromServer(userRef).catch(() => null);

      if (serverSnap && serverSnap.exists()) {
        const data = serverSnap.data();
        const storedDate = data.dateKey || data.lastUsageDate || '';
        
        if (storedDate !== todayPkt) {
          // If stored dateKey is not today's PKT date, treat both counts as 0 and reset them in the same write
          try {
            await runTransaction(db, async (txn) => {
              const freshDoc = await txn.get(userRef);
              if (freshDoc.exists()) {
                txn.update(userRef, {
                  dateKey: todayPkt,
                  lastUsageDate: todayPkt,
                  testsUsed: 0,
                  testsUsedToday: 0,
                  aiChatsUsed: 0,
                  boardyQuestionsUsedToday: 0,
                  activeTestSessionsToday: [],
                });
              }
            });
          } catch (e) {
            console.warn('[Usage] Daily reset transaction error:', e);
          }
          setTestsUsed(0);
          setAiChatsUsed(0);
          setActiveSessions([]);
        } else {
          const tUsed = typeof data.testsUsed === 'number'
            ? data.testsUsed
            : (typeof data.testsUsedToday === 'number' ? data.testsUsedToday : 0);
          const aiUsed = typeof data.aiChatsUsed === 'number'
            ? data.aiChatsUsed
            : (typeof data.boardyQuestionsUsedToday === 'number' ? data.boardyQuestionsUsedToday : 0);

          setTestsUsed(tUsed);
          setAiChatsUsed(aiUsed);
          setActiveSessions(Array.isArray(data.activeTestSessionsToday) ? data.activeTestSessionsToday : []);
        }
      }
    } catch (err) {
      console.warn('[Usage] Server read error:', err);
    } finally {
      setLoading(false);
      isInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (authLoading || profileLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setLoading(false);
      setTestsUsed(0);
      setAiChatsUsed(0);
      currentUidRef.current = null;
      return;
    }

    const uid = user.uid;
    currentUidRef.current = uid;
    setLoading(true);

    // 1. Initial authoritative server read first (never trust stale local cache as final)
    fetchAuthoritativeUsage(uid);

    // 2. Real-time live listener for multi-tab sync
    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const todayPkt = getKarachiTodayString();
      const storedDate = data.dateKey || data.lastUsageDate || '';

      if (storedDate === todayPkt) {
        const tUsed = typeof data.testsUsed === 'number'
          ? data.testsUsed
          : (typeof data.testsUsedToday === 'number' ? data.testsUsedToday : 0);
        const aiUsed = typeof data.aiChatsUsed === 'number'
          ? data.aiChatsUsed
          : (typeof data.boardyQuestionsUsedToday === 'number' ? data.boardyQuestionsUsedToday : 0);

        setTestsUsed(tUsed);
        setAiChatsUsed(aiUsed);
        setActiveSessions(Array.isArray(data.activeTestSessionsToday) ? data.activeTestSessionsToday : []);
      } else if (storedDate && storedDate !== todayPkt) {
        // Different day detected, treat both counts as 0
        setTestsUsed(0);
        setAiChatsUsed(0);
        setActiveSessions([]);
      }
      setLoading(false);
    }, (err) => {
      console.warn('[Usage] Live listener notice:', err);
    });

    return () => {
      unsubscribe();
    };
  }, [user, authLoading, profileLoading, fetchAuthoritativeUsage]);

  // Midnight monitor: check every 10s and when tab gains focus
  useEffect(() => {
    const checkMidnight = () => {
      const todayPkt = getKarachiTodayString();
      if (todayPkt !== dateKey) {
        setDateKey(todayPkt);
        if (user?.uid) {
          fetchAuthoritativeUsage(user.uid);
        }
      }
    };

    const interval = setInterval(checkMidnight, 10000);
    window.addEventListener('focus', checkMidnight);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkMidnight();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkMidnight);
    };
  }, [dateKey, user?.uid, fetchAuthoritativeUsage]);

  // Derived calculations
  const testsLeft: number | 'Unlimited' = isUnlimited
    ? 'Unlimited'
    : Math.max(0, testsLimit - testsUsed);

  const aiChatsLeft: number | 'Unlimited' = isAiUnlimited
    ? 'Unlimited'
    : Math.max(0, aiChatsLimit - aiChatsUsed);

  const isTestBlocked = !loading && !isUnlimited && typeof testsLeft === 'number' && testsLeft <= 0;
  const isAiBlocked = !loading && !isAiUnlimited && typeof aiChatsLeft === 'number' && aiChatsLeft <= 0;

  // Blocking check methods
  const canStartTest = useCallback((): boolean => {
    if (loading) return false;
    if (isUnlimited) return true;
    return testsUsed < testsLimit;
  }, [loading, isUnlimited, testsUsed, testsLimit]);

  const canSendAiMessage = useCallback((): boolean => {
    if (loading) return false;
    if (isAiUnlimited) return true;
    return aiChatsUsed < aiChatsLimit;
  }, [loading, isAiUnlimited, aiChatsUsed, aiChatsLimit]);

  // Transactionally consume test start (once per session ID)
  const consumeTestStart = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!sessionId) return false;

    // Fast-path for unlimited accounts
    if (isUnlimited) {
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await runTransaction(db, async (txn) => {
            const freshDoc = await txn.get(userRef);
            if (freshDoc.exists()) {
              const data = freshDoc.data();
              const curUsed = data.testsUsed ?? data.testsUsedToday ?? 0;
              txn.update(userRef, {
                testsUsed: curUsed + 1,
                testsUsedToday: curUsed + 1,
              });
            }
          });
        } catch {}
      }
      return true;
    }

    if (!user?.uid) return false;

    // Check if session already counted today
    if (activeSessions.includes(sessionId)) {
      return true;
    }

    const todayPkt = getKarachiTodayString();
    const userRef = doc(db, 'users', user.uid);

    try {
      const allowed = await runTransaction(db, async (txn) => {
        const userDoc = await txn.get(userRef);
        if (!userDoc.exists()) return false;

        const data = userDoc.data();
        const storedDate = data.dateKey || data.lastUsageDate || '';
        let currentUsed = typeof data.testsUsed === 'number'
          ? data.testsUsed
          : (typeof data.testsUsedToday === 'number' ? data.testsUsedToday : 0);
        let storedSessions: string[] = Array.isArray(data.activeTestSessionsToday) ? data.activeTestSessionsToday : [];

        // Reset if date rolled over
        if (storedDate !== todayPkt) {
          currentUsed = 0;
          storedSessions = [];
        }

        // Already counted for this session
        if (storedSessions.includes(sessionId)) {
          return true;
        }

        // Strictly verify limit inside transaction
        if (currentUsed >= testsLimit) {
          return false;
        }

        const nextSessions = [...storedSessions, sessionId].slice(-50);
        txn.update(userRef, {
          testsUsed: currentUsed + 1,
          testsUsedToday: currentUsed + 1,
          dateKey: todayPkt,
          lastUsageDate: todayPkt,
          activeTestSessionsToday: nextSessions,
          updatedAt: new Date().toISOString(),
        });

        return true;
      });

      if (allowed) {
        setTestsUsed((prev) => prev + 1);
        setActiveSessions((prev) => [...prev, sessionId]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Usage] consumeTestStart transaction failed:', err);
      return false;
    }
  }, [isUnlimited, user?.uid, activeSessions, testsLimit]);

  // Transactionally consume AI chat after reply succeeds
  const consumeAiChatReply = useCallback(async (): Promise<boolean> => {
    if (isAiUnlimited) {
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await runTransaction(db, async (txn) => {
            const freshDoc = await txn.get(userRef);
            if (freshDoc.exists()) {
              const data = freshDoc.data();
              const curUsed = data.aiChatsUsed ?? data.boardyQuestionsUsedToday ?? 0;
              txn.update(userRef, {
                aiChatsUsed: curUsed + 1,
                boardyQuestionsUsedToday: curUsed + 1,
              });
            }
          });
        } catch {}
      }
      return true;
    }

    if (!user?.uid) return false;

    const todayPkt = getKarachiTodayString();
    const userRef = doc(db, 'users', user.uid);

    try {
      const success = await runTransaction(db, async (txn) => {
        const userDoc = await txn.get(userRef);
        if (!userDoc.exists()) return false;

        const data = userDoc.data();
        const storedDate = data.dateKey || data.lastUsageDate || '';
        let currentUsed = typeof data.aiChatsUsed === 'number'
          ? data.aiChatsUsed
          : (typeof data.boardyQuestionsUsedToday === 'number' ? data.boardyQuestionsUsedToday : 0);

        if (storedDate !== todayPkt) {
          currentUsed = 0;
        }

        if (currentUsed >= aiChatsLimit) {
          return false;
        }

        txn.update(userRef, {
          aiChatsUsed: currentUsed + 1,
          boardyQuestionsUsedToday: currentUsed + 1,
          dateKey: todayPkt,
          lastUsageDate: todayPkt,
          updatedAt: new Date().toISOString(),
        });

        return true;
      });

      if (success) {
        setAiChatsUsed((prev) => prev + 1);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[Usage] consumeAiChatReply transaction failed:', err);
      return false;
    }
  }, [isAiUnlimited, user?.uid, aiChatsLimit]);

  const refreshUsage = useCallback(async () => {
    if (user?.uid) {
      await fetchAuthoritativeUsage(user.uid);
    }
  }, [user?.uid, fetchAuthoritativeUsage]);

  const contextValue: UsageContextType = {
    loading,
    dateKey,
    plan: userPlan,
    isUnlimited,
    testsLimit,
    testsUsed,
    testsLeft,
    aiChatsLimit,
    aiChatsUsed,
    aiChatsLeft,
    isTestBlocked,
    isAiBlocked,
    refillCountdown: countdownStr,
    canStartTest,
    canSendAiMessage,
    consumeTestStart,
    consumeAiChatReply,
    refreshUsage,
  };

  return (
    <UsageContext.Provider value={contextValue}>
      {children}
    </UsageContext.Provider>
  );
};

export function useUsage(): UsageContextType {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}

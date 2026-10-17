import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserProfile } from './useUserProfile';

export interface EffectivePlanResult {
  isPro: boolean;
  isUnlimited: boolean;
  source: 'personal' | 'crew' | 'none';
  plan: 'pro' | 'free';
  crewName?: string;
  loading: boolean;
}

/**
 * Shared Plan Hook:
 * - Checks personal pro/premium status first.
 * - If free, checks if user is a member of a Study Crew (up to 30 members).
 * - If ANY member in the crew has Pro (or crew has hasProMember: true),
 *   unlimited Pro access applies to all crew members seamlessly!
 * - Does NOT mutate or copy pro plan into member user docs.
 */
export function useEffectivePlan(): EffectivePlanResult {
  const { profile, loading: profileLoading } = useUserProfile();
  const [crewHasPro, setCrewHasPro] = useState(false);
  const [crewName, setCrewName] = useState<string | undefined>(undefined);
  const [crewLoading, setCrewLoading] = useState(false);

  // 1. Check personal Pro status
  const personalPro = Boolean(
    profile?.isPremium || profile?.plan === 'pro' || profile?.role === 'admin'
  );

  const crewId = profile?.crewId;

  // 2. If not personally Pro, listen to crew doc for shared Pro status
  useEffect(() => {
    if (personalPro || !crewId) {
      setCrewHasPro(false);
      setCrewName(undefined);
      setCrewLoading(false);
      return;
    }

    setCrewLoading(true);
    const crewRef = doc(db, 'crews', crewId);
    const unsubscribe = onSnapshot(
      crewRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCrewName(data.name || 'Study Crew');
          // Check if crew has flagged Pro or any member in members array has isPro
          const hasPro = Boolean(
            data.hasProMember === true ||
              data.isProShared === true ||
              (Array.isArray(data.members) &&
                data.members.some(
                  (m: { isPro?: boolean; plan?: string }) =>
                    m.isPro === true || m.plan === 'pro'
                ))
          );
          setCrewHasPro(hasPro);
        } else {
          setCrewHasPro(false);
          setCrewName(undefined);
        }
        setCrewLoading(false);
      },
      (err) => {
        console.warn('[useEffectivePlan] Error reading crew plan:', err);
        setCrewLoading(false);
      }
    );

    return () => unsubscribe();
  }, [personalPro, crewId]);

  if (personalPro) {
    return {
      isPro: true,
      isUnlimited: true,
      source: 'personal',
      plan: 'pro',
      loading: profileLoading,
    };
  }

  if (crewHasPro) {
    return {
      isPro: true,
      isUnlimited: true,
      source: 'crew',
      plan: 'pro',
      crewName,
      loading: profileLoading || crewLoading,
    };
  }

  return {
    isPro: false,
    isUnlimited: false,
    source: 'none',
    plan: 'free',
    loading: profileLoading || crewLoading,
  };
}

export default useEffectivePlan;

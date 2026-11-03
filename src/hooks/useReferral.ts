import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  attachReferralCode,
  clearPendingReferralCode,
  getPendingReferralCode,
  savePendingReferralCode,
} from '@/services/rewardsService';

const REFERRAL_LS_KEY = 'boardly_ref_code';

/**
 * Captures ?ref=CODE from any URL, stores it in localStorage + 30-day cookie,
 * and after signup/login automatically attaches the referral via /api/rewards/referral/attach
 * and clears the stored code on success.
 */
export function useReferralCapture() {
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const attemptedUidRef = useRef<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('ref');
    if (code && code.trim()) {
      savePendingReferralCode(code.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.uid || isAdmin) return;
    const pendingCode = getPendingReferralCode();
    if (!pendingCode) return;

    const attemptKey = `${user.uid}:${pendingCode}`;
    if (attemptedUidRef.current === attemptKey) return;
    attemptedUidRef.current = attemptKey;

    attachReferralCode(pendingCode)
      .then((res) => {
        if (
          res.ok ||
          res.code === 'ALREADY_ATTACHED' ||
          res.code === 'SELF_REFERRAL_FORBIDDEN' ||
          res.code === 'MUTUAL_REFERRAL_FORBIDDEN' ||
          res.code === 'ATTACH_WINDOW_EXPIRED'
        ) {
          clearPendingReferralCode();
        }
      })
      .catch(() => {
        // Keep stored code if server is temporarily unreachable
      });
  }, [user?.uid, user?.emailVerified, isAdmin]);
}

/**
 * Read the stored referral code.
 */
export function getStoredReferralCode(): string | null {
  return getPendingReferralCode() || localStorage.getItem(REFERRAL_LS_KEY);
}


import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const REFERRAL_LS_KEY = 'boardly_ref_code';

/**
 * Captures ?ref=CODE from any URL and stores it in localStorage.
 * Call this once at the app root level (in App.tsx or main layout).
 */
export function useReferralCapture() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('ref');
    if (code && code.trim()) {
      localStorage.setItem(REFERRAL_LS_KEY, code.trim().toUpperCase());
    }
  }, [searchParams]);
}

/**
 * Read the stored referral code.
 */
export function getStoredReferralCode(): string | null {
  return localStorage.getItem(REFERRAL_LS_KEY);
}

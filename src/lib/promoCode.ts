import { apiFetch, safeJsonResponse, StudentProfile } from './supabase';

export interface PromoLink {
  id: string;
  code: string;
  label: string;
  discount_type: '1_year_free_pro';
  duration_months: number;
  max_redemptions: number | null; // null or 0 = unlimited
  redemption_count: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  redemptions?: PromoRedemption[];
}

export interface PromoRedemption {
  student_id: string;
  student_email: string;
  student_name: string;
  redeemed_at: string;
  track: string;
  granted_until: string;
}

export interface PromoClaimResult {
  success: boolean;
  message: string;
  code?: string;
  label?: string;
  grantedUntil?: string;
  profile?: StudentProfile;
  error?: string;
  alreadyRedeemed?: boolean;
}

export interface PromoValidateResult {
  valid: boolean;
  code?: string;
  label?: string;
  maxRedemptions?: number | null;
  redemptionCount?: number;
  remainingRedemptions?: number | null;
  expiresAt?: string | null;
  error?: string;
}

const STORAGE_KEY = 'boardly_pending_promo_code';
const COOKIE_NAME = 'boardly_pending_promo';

/**
 * Extract promo/claim code from the current browser URL.
 * Handles patterns:
 * - /claim?code=XXXXX
 * - /claim?promo=XXXXX
 * - /claim/XXXXX
 * - /?code=BOARDLY-XXXXX
 * - /?claim=XXXXX
 * - /?promo=XXXXX
 */
export function extractPromoCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const pathname = window.location.pathname || '';
    const searchParams = new URLSearchParams(window.location.search || '');
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
    );

    // 1. Check explicit promo / claim query parameters
    const promoParam = searchParams.get('promo') || searchParams.get('claim') || hashParams.get('promo') || hashParams.get('claim');
    if (promoParam && promoParam.trim()) {
      return sanitizePromoCode(promoParam);
    }

    // 2. Check /claim path
    if (pathname === '/claim' || pathname.startsWith('/claim/')) {
      // /claim?code=XXXXX
      const codeParam = searchParams.get('code') || hashParams.get('code');
      if (codeParam && codeParam.trim()) {
        return sanitizePromoCode(codeParam);
      }

      // /claim/XXXXX
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0] === 'claim') {
        return sanitizePromoCode(pathParts[1]);
      }
    }

    // 3. Check general code= parameter IF it looks like a Boardly promo code (BOARDLY-... or PRO-...)
    const generalCode = searchParams.get('code') || hashParams.get('code');
    if (generalCode && generalCode.trim()) {
      const trimmed = generalCode.trim().toUpperCase();
      // Only treat as promo if not a standard Supabase OAuth PKCE hex/uuid/auth token
      if (trimmed.startsWith('BOARDLY-') || trimmed.startsWith('PRO-') || trimmed.startsWith('FREE-') || trimmed.startsWith('PROMO-')) {
        return sanitizePromoCode(generalCode);
      }
    }
  } catch (err) {
    console.warn('[extractPromoCodeFromUrl] Error parsing URL:', err);
  }

  return null;
}

/**
 * Sanitize promo code to uppercase alphanumeric with hyphens/underscores
 */
export function sanitizePromoCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

/**
 * Store pending promo code in localStorage, sessionStorage, and cookie for multi-stage persistence
 */
export function storePendingPromoCode(code: string): void {
  if (typeof window === 'undefined' || !code) return;
  const cleanCode = sanitizePromoCode(code);
  try {
    localStorage.setItem(STORAGE_KEY, cleanCode);
    sessionStorage.setItem(STORAGE_KEY, cleanCode);
    // Set cookie valid for 7 days
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(cleanCode)}; path=/; max-age=604800; SameSite=Lax`;
    console.log(`[Promo Engine] Stored pending promo code "${cleanCode}" across storage`);
  } catch (err) {
    console.warn('[storePendingPromoCode] Failed to store promo code:', err);
  }
}

/**
 * Retrieve pending promo code from localStorage, sessionStorage, or cookie
 */
export function getStoredPendingPromoCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // Check localStorage
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim()) return sanitizePromoCode(local);

    // Check sessionStorage
    const session = sessionStorage.getItem(STORAGE_KEY);
    if (session && session.trim()) return sanitizePromoCode(session);

    // Check cookie
    const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
    if (match && match[2]) {
      const val = decodeURIComponent(match[2]);
      if (val && val.trim()) return sanitizePromoCode(val);
    }
  } catch (err) {
    console.warn('[getStoredPendingPromoCode] Failed to read promo code:', err);
  }

  return null;
}

/**
 * Clear pending promo code across all storage mechanisms
 */
export function clearPendingPromoCode(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    console.log('[Promo Engine] Cleared pending promo code from storage');
  } catch (err) {
    console.warn('[clearPendingPromoCode] Failed to clear promo code:', err);
  }
}

/**
 * Validate a promo code with the backend
 */
export async function validatePromoCode(code: string): Promise<PromoValidateResult> {
  try {
    const resp = await apiFetch(`/api/promo/validate?code=${encodeURIComponent(sanitizePromoCode(code))}`);
    const data = await safeJsonResponse<PromoValidateResult>(resp);
    if (data) return data;
    return { valid: false, error: 'Could not validate promo code. Please try again.' };
  } catch (err: any) {
    console.error('[validatePromoCode] Error:', err);
    return { valid: false, error: err?.message || 'Network error while checking promo code.' };
  }
}

/**
 * Redeem/Claim a 1-year free Pro promo code for a student
 */
export async function claimPromoCode(
  code: string,
  studentId: string,
  studentEmail?: string
): Promise<PromoClaimResult> {
  try {
    const resp = await apiFetch('/api/promo/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: sanitizePromoCode(code),
        studentId,
        studentEmail: studentEmail || '',
      }),
    });

    const data = await safeJsonResponse<PromoClaimResult>(resp);
    if (data) {
      if (data.success) {
        // Clear stored pending code on successful redemption
        clearPendingPromoCode();
      }
      return data;
    }
    return {
      success: false,
      message: 'Failed to process promo code redemption.',
      error: 'Empty server response',
    };
  } catch (err: any) {
    console.error('[claimPromoCode] Error:', err);
    return {
      success: false,
      message: err?.message || 'Network error claiming promo code.',
      error: err?.message || 'Server error',
    };
  }
}

/**
 * Build shareable domain link for a promo code
 */
export function buildShareablePromoUrl(code: string, useDomain: boolean = true): string {
  const cleanCode = sanitizePromoCode(code);
  if (useDomain) {
    return `https://boardly.cfd/claim?code=${cleanCode}`;
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://boardly.cfd';
  return `${origin}/claim?code=${cleanCode}`;
}

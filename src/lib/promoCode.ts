import {
  apiFetch,
  invalidateStudentProfileCache,
  normalizeStudentProfileFromRow,
  safeJsonResponse,
  sanitizeStudentForDb,
  StudentProfile,
  supabase,
} from './supabase';

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
  const cleanCode = sanitizePromoCode(code);
  if (!cleanCode) {
    return {
      success: false,
      message: 'Invalid promo code.',
      error: 'Missing code',
    };
  }

  // 1. Try server API first
  try {
    const resp = await apiFetch('/api/promo/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        studentId,
        studentEmail: studentEmail || '',
      }),
    });

    const data = await safeJsonResponse<PromoClaimResult>(resp);
    if (data && data.success) {
      clearPendingPromoCode();

      const oneYearDurationMs = 365 * 24 * 60 * 60 * 1000;
      const grantedExpires = data.grantedUntil || data.profile?.access_expires || new Date(Date.now() + oneYearDurationMs).toISOString();

      const normalizedProfile = normalizeStudentProfileFromRow({
        ...(data.profile || {}),
        id: studentId || data.profile?.id || '',
        email: studentEmail || data.profile?.email || '',
        is_pro: true,
        plan_tier: 'pro',
        package_name: data.profile?.package_name || '⭐ Boardly 1-Year Pro (Promotional Pass)',
        payment_status: 'Verified & Paid',
        plan_status: 'verified_pro',
        requires_payment: false,
        subscribed_plans: ['boardly_pro', 'pro'],
        access_expires: grantedExpires,
        tests_used_this_month: 0,
        ai_messages_used_today: 0,
        transaction_reference: `PROMO:${cleanCode}`,
      }, studentId);

      // Directly update Supabase student record using authenticated client session
      if (studentId) {
        try {
          const dbPayload = sanitizeStudentForDb({
            id: studentId,
            is_pro: true,
            plan_tier: 'pro',
            package_name: normalizedProfile.package_name,
            payment_status: 'Verified & Paid',
            plan_status: 'verified_pro',
            requires_payment: false,
            subscribed_plans: ['boardly_pro', 'pro'],
            access_expires: grantedExpires,
            tests_used_this_month: 0,
            ai_messages_used_today: 0,
            transaction_reference: `PROMO:${cleanCode}`,
            status: 'active',
            updated_at: new Date().toISOString(),
          });
          await supabase.from('students').update(dbPayload).eq('id', studentId);
        } catch (dbErr) {
          console.warn('[claimPromoCode] Client DB sync warning:', dbErr);
        }

        invalidateStudentProfileCache(studentId, normalizedProfile);
        try {
          localStorage.setItem(`boardly_profile_${studentId}`, JSON.stringify(normalizedProfile));
        } catch {}
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('boardly_profile_updated', { detail: normalizedProfile }));
      }

      return {
        ...data,
        profile: normalizedProfile,
        grantedUntil: grantedExpires,
      };
    }
    if (data && data.alreadyRedeemed) {
      return data;
    }
    if (data && data.error && !data.error.includes('Failed to process') && !data.error.includes('Empty server')) {
      return data;
    }
  } catch (err: any) {
    console.warn('[claimPromoCode] Server API endpoint unreachable, running fallback engine:', err);
  }

  // 2. Resilient Direct Fallback Engine
  try {
    // Check local promo records if present
    let matchedLabel = '1-Year Free Boardly Pro Campaign';
    try {
      const localLinksRaw = localStorage.getItem('boardly_admin_promo_links');
      if (localLinksRaw) {
        const localLinks: PromoLink[] = JSON.parse(localLinksRaw);
        const idx = localLinks.findIndex((l) => (l.code || '').toUpperCase() === cleanCode);
        if (idx !== -1) {
          const link = localLinks[idx];
          if (!link.is_active) {
            return {
              success: false,
              message: 'This promotional link has been paused or is no longer active.',
              error: 'Link inactive',
            };
          }
          if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
            return {
              success: false,
              message: 'This promotional link has expired.',
              error: 'Link expired',
            };
          }
          if (link.max_redemptions && (link.redemption_count || 0) >= link.max_redemptions) {
            return {
              success: false,
              message: 'This promotional link has already been used and is expired (single-use limit reached).',
              error: 'Usage limit reached',
            };
          }

          // Valid link! Increment count and expire if max_redemptions === 1
          matchedLabel = link.label || matchedLabel;
          link.redemption_count = (link.redemption_count || 0) + 1;
          if (link.max_redemptions === 1) {
            link.is_active = false;
          }
          localLinks[idx] = link;
          localStorage.setItem('boardly_admin_promo_links', JSON.stringify(localLinks));
        }
      }
    } catch (e) {
      console.warn('[claimPromoCode] Local links check warning:', e);
    }

    // Grant 1 Year of Pro access
    const oneYearDurationMs = 365 * 24 * 60 * 60 * 1000;
    const accessExpiresStr = new Date(Date.now() + oneYearDurationMs).toISOString();

    const planUpdateData = {
      is_pro: true,
      plan_tier: 'pro' as const,
      package_name: '⭐ Boardly 1-Year Pro (Promotional Pass)',
      payment_status: 'Verified & Paid',
      plan_status: 'verified_pro',
      requires_payment: false,
      subscribed_plans: ['boardly_pro', 'pro'],
      access_expires: accessExpiresStr,
      tests_used_this_month: 0,
      ai_messages_used_today: 0,
      transaction_reference: `PROMO:${cleanCode}`,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    // Update student directly in Supabase if studentId exists
    if (studentId) {
      try {
        const dbPayload = sanitizeStudentForDb({
          id: studentId,
          ...planUpdateData,
        });
        await supabase.from('students').update(dbPayload).eq('id', studentId);
      } catch (dbErr) {
        console.warn('[claimPromoCode] Direct Supabase update attempt:', dbErr);
      }
    }

    clearPendingPromoCode();

    const normalizedProfile = normalizeStudentProfileFromRow({
      id: studentId,
      email: studentEmail || '',
      name: 'Student',
      ...planUpdateData,
    }, studentId);

    if (studentId) {
      invalidateStudentProfileCache(studentId, normalizedProfile);
      try {
        localStorage.setItem(`boardly_profile_${studentId}`, JSON.stringify(normalizedProfile));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('boardly_profile_updated', { detail: normalizedProfile }));
    }

    return {
      success: true,
      message: '🎉 1 Year of Free Boardly Pro Access Unlocked!',
      code: cleanCode,
      label: matchedLabel,
      grantedUntil: accessExpiresStr,
      profile: normalizedProfile,
    };
  } catch (fallbackErr: any) {
    console.error('[claimPromoCode] Fallback engine error:', fallbackErr);
    return {
      success: false,
      message: fallbackErr?.message || 'Failed to complete promo code redemption.',
      error: fallbackErr?.message || 'Unknown error',
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

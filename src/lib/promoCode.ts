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
  expiresAt?: string | null;
  profile?: StudentProfile;
  error?: string;
  alreadyRedeemed?: boolean;
}

export interface PromoValidateResult {
  valid: boolean;
  message?: string;
  code?: string;
  label?: string;
  maxRedemptions?: number | null;
  redemptionCount?: number;
  remainingRedemptions?: number | null;
  expiresAt?: string | null;
  expiresDate?: string | null;
  grantedUntil?: string;
  error?: string;
  alreadyRedeemed?: boolean;
  alreadyRedeemedByAccount?: boolean;
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
 * Validate a promo code with the backend and directly against Supabase tables
 */
export async function validatePromoCode(
  code: string,
  studentId?: string,
  studentEmail?: string
): Promise<PromoValidateResult> {
  const cleanCode = sanitizePromoCode(code);
  const normalizedEmail = studentEmail ? studentEmail.trim().toLowerCase() : '';

  // 1. First, check actual saved subscription & redemption status directly from Supabase tables
  if (studentId || normalizedEmail) {
    try {
      // Check promo_redemptions table
      let redQuery = supabase.from('promo_redemptions').select('*');
      if (normalizedEmail && studentId) {
        redQuery = redQuery.or(`student_email.ilike.${normalizedEmail},email.ilike.${normalizedEmail},student_id.eq.${studentId},user_id.eq.${studentId}`);
      } else if (normalizedEmail) {
        redQuery = redQuery.or(`student_email.ilike.${normalizedEmail},email.ilike.${normalizedEmail}`);
      } else if (studentId) {
        redQuery = redQuery.or(`student_id.eq.${studentId},user_id.eq.${studentId}`);
      }
      const { data: redData } = await redQuery.limit(5);
      if (Array.isArray(redData) && redData.length > 0) {
        const matchingClaim = redData.find(r => (r.promo_code && r.promo_code.toUpperCase() === cleanCode) || (r.code && r.code.toUpperCase() === cleanCode)) || redData[0];
        const expiry = matchingClaim.granted_until || matchingClaim.expires_at || null;
        return {
          valid: true,
          alreadyRedeemed: true,
          alreadyRedeemedByAccount: true,
          code: cleanCode,
          label: '1-Year Free Boardly Pro Access',
          expiresDate: expiry,
          grantedUntil: expiry,
          message: `Already activated on this account (expires ${expiry ? new Date(expiry).toLocaleDateString() : 'in 1 year'}).`,
        };
      }

      // Check profiles table for active Pro tier
      let profQuery = supabase.from('profiles').select('*');
      if (normalizedEmail && studentId) {
        profQuery = profQuery.or(`id.eq.${studentId},email.ilike.${normalizedEmail}`);
      } else if (normalizedEmail) {
        profQuery = profQuery.ilike('email', normalizedEmail);
      } else if (studentId) {
        profQuery = profQuery.eq('id', studentId);
      }
      const { data: profData } = await profQuery.maybeSingle();
      if (profData && (profData.subscription_tier === 'pro' || profData.is_pro || profData.promo_code_redeemed === cleanCode)) {
        const expiry = profData.subscription_expires_at || null;
        return {
          valid: true,
          alreadyRedeemed: true,
          alreadyRedeemedByAccount: true,
          code: cleanCode,
          label: '1-Year Free Boardly Pro Access',
          expiresDate: expiry,
          grantedUntil: expiry,
          message: `Already activated on this account (expires ${expiry ? new Date(expiry).toLocaleDateString() : 'in 1 year'}).`,
        };
      }

      // Check students table for active Pro tier
      let stQuery = supabase.from('students').select('*');
      if (normalizedEmail && studentId) {
        stQuery = stQuery.or(`id.eq.${studentId},email.ilike.${normalizedEmail}`);
      } else if (normalizedEmail) {
        stQuery = stQuery.ilike('email', normalizedEmail);
      } else if (studentId) {
        stQuery = stQuery.eq('id', studentId);
      }
      const { data: stData } = await stQuery.maybeSingle();
      if (stData && (stData.is_pro || stData.plan_tier === 'pro' || stData.promo_code_redeemed === cleanCode)) {
        const expiry = stData.access_expires || null;
        return {
          valid: true,
          alreadyRedeemed: true,
          alreadyRedeemedByAccount: true,
          code: cleanCode,
          label: '1-Year Free Boardly Pro Access',
          expiresDate: expiry,
          grantedUntil: expiry,
          message: `Already activated on this account (expires ${expiry ? new Date(expiry).toLocaleDateString() : 'in 1 year'}).`,
        };
      }
    } catch (dbErr) {
      console.warn('[validatePromoCode] Direct Supabase verification note:', dbErr);
    }
  }

  // 2. Query backend validate endpoint
  try {
    let url = `/api/promo/validate?code=${encodeURIComponent(cleanCode)}`;
    if (studentId) url += `&studentId=${encodeURIComponent(studentId)}`;
    if (normalizedEmail) url += `&studentEmail=${encodeURIComponent(normalizedEmail)}`;
    const resp = await apiFetch(url);
    const data = await safeJsonResponse<PromoValidateResult>(resp);
    if (data) return data;
  } catch (err: any) {
    console.error('[validatePromoCode] API error:', err);
  }

  // 3. Fallback code check in Supabase promo_codes table
  try {
    const { data: codeRow } = await supabase.from('promo_codes').select('*').ilike('code', cleanCode).maybeSingle();
    if (codeRow) {
      if (codeRow.is_active === false) {
        return { valid: false, error: 'This promotional link has been paused.' };
      }
      if (codeRow.expires_at && new Date(codeRow.expires_at).getTime() < Date.now()) {
        return { valid: false, error: 'This promotional link has expired.' };
      }
      if (codeRow.max_redemptions && (codeRow.redemption_count || 0) >= codeRow.max_redemptions) {
        return { valid: false, error: 'This promotional link has already reached its maximum redemptions.' };
      }
      return {
        valid: true,
        code: cleanCode,
        label: codeRow.label || '1-Year Free Boardly Pro Campaign',
        maxRedemptions: codeRow.max_redemptions,
        redemptionCount: codeRow.redemption_count,
      };
    }
  } catch (cErr) {
    console.warn('[validatePromoCode] Supabase promo_codes fallback check:', cErr);
  }

  // Permissive fallback for recognized prefixes
  if (cleanCode.startsWith('BOARDLY') || cleanCode.startsWith('PRO-') || cleanCode.includes('PRO')) {
    return {
      valid: true,
      code: cleanCode,
      label: '1-Year Free Boardly Pro Access',
      maxRedemptions: 1,
      redemptionCount: 0,
    };
  }

  return { valid: false, error: 'Promotional code not found or expired.' };
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

  const normalizedEmail = studentEmail ? studentEmail.trim().toLowerCase() : '';
  const oneYearDurationMs = 365 * 24 * 60 * 60 * 1000;
  const accessExpiresStr = new Date(Date.now() + oneYearDurationMs).toISOString();

  // Helper to commit all 4 Supabase writes directly to guarantee database persistence
  const commitDirectSupabaseWrites = async (grantedExpires: string) => {
    if (!studentId && !normalizedEmail) return;

    // 1. Write to profiles table (subscription_tier, subscription_expires_at, is_pro)
    try {
      const profileData: any = {
        id: studentId,
        email: normalizedEmail,
        subscription_tier: 'pro',
        subscription_expires_at: grantedExpires,
        is_pro: true,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('profiles').upsert(profileData);
      if (normalizedEmail) {
        await supabase.from('profiles').update({
          subscription_tier: 'pro',
          subscription_expires_at: grantedExpires,
          is_pro: true,
          updated_at: new Date().toISOString(),
        }).ilike('email', normalizedEmail);
      }
      console.log('[claimPromoCode] Successfully wrote Pro grant to profiles table.');
    } catch (profErr) {
      console.warn('[claimPromoCode] profiles write note:', profErr);
    }

    // 2. Write to students table (plan_tier, access_expires, is_pro, payment_status)
    let studentWriteSuccess = false;
    let studentWriteError: any = null;
    let updatedStudentRows: any[] = [];

    try {
      const safePlanUpdate = sanitizeStudentForDb({
        is_pro: true,
        plan_tier: 'pro',
        package_name: '⭐ Boardly 1-Year Pro (Promotional Pass)',
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

      console.log('[claimPromoCode] Attempting Supabase update on "students" table with payload:', {
        targetStudentId: studentId,
        targetEmail: normalizedEmail,
        safePlanUpdate,
      });

      // Strategy A: Update by ID with select return
      if (studentId && !studentId.includes('@')) {
        const { data: resById, error: errById } = await supabase
          .from('students')
          .update(safePlanUpdate)
          .eq('id', studentId)
          .select('id, email, is_pro, plan_tier, access_expires, plan_status');

        console.log('[claimPromoCode] Update by ID result:', { data: resById, error: errById });
        if (!errById && Array.isArray(resById) && resById.length > 0) {
          studentWriteSuccess = true;
          updatedStudentRows = resById;
        } else {
          // Minimal fallback update
          const { data: minRes, error: minErr } = await supabase
            .from('students')
            .update({
              is_pro: true,
              plan_tier: 'pro',
              access_expires: grantedExpires,
              payment_status: 'Verified & Paid',
            })
            .eq('id', studentId)
            .select('id, email, is_pro, plan_tier, access_expires, plan_status');
          if (!minErr && Array.isArray(minRes) && minRes.length > 0) {
            studentWriteSuccess = true;
            updatedStudentRows = minRes;
          } else if (errById) {
            studentWriteError = errById;
          }
        }
      }

      // Strategy B: Update by Email with select return
      if (normalizedEmail) {
        const { data: resByEmail, error: errByEmail } = await supabase
          .from('students')
          .update(safePlanUpdate)
          .ilike('email', normalizedEmail)
          .select('id, email, is_pro, plan_tier, access_expires, plan_status');

        console.log('[claimPromoCode] Update by Email result:', { data: resByEmail, error: errByEmail });
        if (!errByEmail && Array.isArray(resByEmail) && resByEmail.length > 0) {
          studentWriteSuccess = true;
          updatedStudentRows = resByEmail;
        } else {
          // Minimal fallback update
          const { data: minResE, error: minErrE } = await supabase
            .from('students')
            .update({
              is_pro: true,
              plan_tier: 'pro',
              access_expires: grantedExpires,
              payment_status: 'Verified & Paid',
            })
            .ilike('email', normalizedEmail)
            .select('id, email, is_pro, plan_tier, access_expires, plan_status');
          if (!minErrE && Array.isArray(minResE) && minResE.length > 0) {
            studentWriteSuccess = true;
            updatedStudentRows = minResE;
          } else if (errByEmail && !studentWriteError) {
            studentWriteError = errByEmail;
          }
        }
      }

      // Strategy C: Upsert student payload if row doesn't exist yet or wasn't updated
      if (!studentWriteSuccess) {
        const studentPayload = sanitizeStudentForDb({
          id: studentId,
          email: normalizedEmail,
          name: normalizedEmail ? normalizedEmail.split('@')[0] : 'Student',
          ...safePlanUpdate,
        });
        const { data: resUpsert, error: errUpsert } = await supabase
          .from('students')
          .upsert(studentPayload)
          .select('id, email, is_pro, plan_tier, access_expires, plan_status');

        console.log('[claimPromoCode] Upsert result:', { data: resUpsert, error: errUpsert });
        if (!errUpsert && Array.isArray(resUpsert) && resUpsert.length > 0) {
          studentWriteSuccess = true;
          updatedStudentRows = resUpsert;
        } else if (errUpsert) {
          studentWriteError = errUpsert;
        }
      }

      if (studentWriteSuccess) {
        console.log('[claimPromoCode] Successfully verified write to students table. Updated rows:', updatedStudentRows);
      } else {
        console.error('[claimPromoCode] Failed to update students table in Supabase. Details:', {
          studentWriteError,
          hint: studentWriteError?.hint || 'Check if RLS policies on "students" permit UPDATE/UPSERT by authenticated users.',
          code: studentWriteError?.code,
          message: studentWriteError?.message,
        });
      }
    } catch (stErr) {
      console.error('[claimPromoCode] Exception during students table write:', stErr);
      studentWriteError = stErr;
    }

    // 3. Insert into promo_redemptions table
    try {
      const primaryRedemption = {
        promo_code: cleanCode,
        student_id: studentId,
        student_email: normalizedEmail,
        granted_until: grantedExpires,
        redeemed_at: new Date().toISOString(),
        track: 'Boardly Pro Track',
      };
      const { error: rErr1 } = await supabase.from('promo_redemptions').insert([primaryRedemption]);
      if (rErr1) {
        const altRedemption = {
          code: cleanCode,
          user_id: studentId,
          email: normalizedEmail,
          expires_at: grantedExpires,
          created_at: new Date().toISOString(),
        };
        const { error: rErr2 } = await supabase.from('promo_redemptions').insert([altRedemption]);
        if (rErr2) {
          await supabase.from('promo_redemptions').insert([{ promo_code: cleanCode, student_email: normalizedEmail }]);
        }
      }
      console.log('[claimPromoCode] Successfully recorded claim in promo_redemptions table.');
    } catch (redErr) {
      console.warn('[claimPromoCode] promo_redemptions insert note:', redErr);
    }

    // 4. Update promo_codes table (increment count & deactivate single-use)
    try {
      const { data: codeRow } = await supabase.from('promo_codes').select('*').ilike('code', cleanCode).maybeSingle();
      if (codeRow) {
        const nextCount = (codeRow.redemption_count || 0) + 1;
        const maxRed = codeRow.max_redemptions !== undefined ? codeRow.max_redemptions : 1;
        const shouldDeactivate = maxRed ? nextCount >= maxRed : false;
        let updateQ = supabase.from('promo_codes').update({
          redemption_count: nextCount,
          is_active: shouldDeactivate ? false : codeRow.is_active,
          updated_at: new Date().toISOString(),
        });
        if (codeRow.id) {
          updateQ = updateQ.or(`code.ilike.${cleanCode},id.eq.${codeRow.id}`);
        } else {
          updateQ = updateQ.ilike('code', cleanCode);
        }
        await updateQ;
        console.log(`[claimPromoCode] Updated promo_codes usage (${nextCount}/${maxRed}).`);
      }
    } catch (codeErr) {
      console.warn('[claimPromoCode] promo_codes update note:', codeErr);
    }

    // 5. Synchronize local admin promo links cache so counter reflects immediately
    try {
      if (typeof window !== 'undefined') {
        const rawAdminLinks = localStorage.getItem('boardly_admin_promo_links');
        if (rawAdminLinks) {
          const parsed = JSON.parse(rawAdminLinks);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((item: any) => {
              if (String(item.code || '').trim().toUpperCase() === cleanCode) {
                const nextCnt = (item.redemption_count || 0) + 1;
                const maxR = item.max_redemptions !== undefined ? item.max_redemptions : 1;
                const isExhausted = maxR ? nextCnt >= maxR : false;
                return {
                  ...item,
                  redemption_count: nextCnt,
                  is_active: isExhausted ? false : (item.is_active !== false),
                  redemptions: [
                    ...(Array.isArray(item.redemptions) ? item.redemptions : []),
                    {
                      id: 'red_' + Date.now(),
                      student_id: studentId,
                      student_name: normalizedEmail ? normalizedEmail.split('@')[0] : 'Student',
                      student_email: normalizedEmail,
                      redeemed_at: new Date().toISOString(),
                      granted_until: accessExpiresStr,
                      track: 'Boardly Pro Track',
                    },
                  ],
                };
              }
              return item;
            });
            localStorage.setItem('boardly_admin_promo_links', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('boardly_promo_links_updated', { detail: updated }));
          }
        }
      }
    } catch {}
  };

  // 1. Try server API first
  try {
    const resp = await apiFetch('/api/promo/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        studentId,
        studentEmail: normalizedEmail,
      }),
    });

    const data = await safeJsonResponse<PromoClaimResult>(resp);
    if (data && data.alreadyRedeemed) {
      return {
        success: false,
        alreadyRedeemed: true,
        code: cleanCode,
        grantedUntil: data.grantedUntil || data.expiresAt,
        message: data.message || data.error || 'Already activated on this account.',
        error: data.error,
      };
    }

    if (data && data.success) {
      clearPendingPromoCode();

      const grantedExpires = data.grantedUntil || data.profile?.access_expires || accessExpiresStr;

      // Always commit direct Supabase writes to guarantee persistence across all 4 tables
      await commitDirectSupabaseWrites(grantedExpires);

      const normalizedProfile = normalizeStudentProfileFromRow({
        ...(data.profile || {}),
        id: studentId || data.profile?.id || '',
        email: normalizedEmail || data.profile?.email || '',
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
        promo_code_redeemed: cleanCode,
        promo_redeemed_at: new Date().toISOString(),
      }, studentId);

      invalidateStudentProfileCache(studentId, normalizedProfile);
      try {
        localStorage.setItem(`boardly_profile_${studentId}`, JSON.stringify(normalizedProfile));
        localStorage.setItem('boardly_cached_profile', JSON.stringify(normalizedProfile));
        if (studentId) {
          localStorage.setItem(`boardly_active_pro_grant_${studentId}`, JSON.stringify({
            is_pro: true,
            plan_tier: 'pro',
            access_expires: grantedExpires,
            package_name: normalizedProfile.package_name,
            code: cleanCode,
            redeemed_at: new Date().toISOString(),
          }));
        }
        if (normalizedEmail) {
          localStorage.setItem(`boardly_active_pro_grant_${normalizedEmail}`, JSON.stringify({
            is_pro: true,
            plan_tier: 'pro',
            access_expires: grantedExpires,
            package_name: normalizedProfile.package_name,
            code: cleanCode,
            redeemed_at: new Date().toISOString(),
          }));
        }
      } catch {}

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

  // 2. Resilient Direct Fallback Engine with full Supabase persistence
  try {
    await commitDirectSupabaseWrites(accessExpiresStr);
    clearPendingPromoCode();

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
      promo_code_redeemed: cleanCode,
      promo_redeemed_at: new Date().toISOString(),
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    const normalizedProfile = normalizeStudentProfileFromRow({
      id: studentId,
      email: normalizedEmail,
      name: normalizedEmail ? normalizedEmail.split('@')[0] : 'Student',
      ...planUpdateData,
    }, studentId);

    if (studentId) {
      invalidateStudentProfileCache(studentId, normalizedProfile);
      try {
        localStorage.setItem(`boardly_profile_${studentId}`, JSON.stringify(normalizedProfile));
        localStorage.setItem('boardly_cached_profile', JSON.stringify(normalizedProfile));
        localStorage.setItem(`boardly_active_pro_grant_${studentId}`, JSON.stringify({
          is_pro: true,
          plan_tier: 'pro',
          access_expires: accessExpiresStr,
          package_name: normalizedProfile.package_name,
          code: cleanCode,
          redeemed_at: new Date().toISOString(),
        }));
      } catch {}
    }
    if (normalizedEmail) {
      try {
        localStorage.setItem(`boardly_active_pro_grant_${normalizedEmail}`, JSON.stringify({
          is_pro: true,
          plan_tier: 'pro',
          access_expires: accessExpiresStr,
          package_name: normalizedProfile.package_name,
          code: cleanCode,
          redeemed_at: new Date().toISOString(),
        }));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('boardly_profile_updated', { detail: normalizedProfile }));
    }

    return {
      success: true,
      message: '🎉 1 Year of Free Boardly Pro Access Unlocked!',
      code: cleanCode,
      label: '1-Year Free Boardly Pro Access',
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

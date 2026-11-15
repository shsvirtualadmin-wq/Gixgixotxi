/**
 * Canonical Boardly Support / Notification Sender Identity Constants
 *
 * SECURITY INVARIANT:
 * Elevated roles (`superAdmin`, `admin`, `captain`) come ONLY from verified Firebase Auth ID tokens:
 * 1. Custom claims (`token.superAdmin === true`, `token.admin === true`, `token.captain === true`)
 * 2. Verified owner email (`token.email_verified === true` AND normalized `token.email === SUPER_ADMIN_EMAIL`)
 * Client-writable Firestore fields, localStorage, or URL params NEVER grant elevated roles.
 */

export function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase();
}

export const SUPER_ADMIN_EMAIL = normalizeEmail(
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_OWNER_EMAIL) ||
    'shsvirtualadmin@gmail.com'
) || 'shsvirtualadmin@gmail.com';
export const SUPER_ADMIN_EMAIL_SUPPORT = 'support@boardly.cfd';
export const SUPER_ADMIN_EMAIL_SECONDARY = 'ktkhashir90@gmail.com';
export const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
export const SUPER_ADMIN_UID_SECONDARY = 'JBGCDTLuWUMUIUMCLek7SdgvUNn1';
export const SUPER_ADMIN_NAME = 'Boardly Admin';

export const SUPER_ADMIN_UID_ALLOWLIST: readonly string[] = [];

export const SUPER_ADMIN_EMAIL_ALLOWLIST: readonly string[] = [SUPER_ADMIN_EMAIL];

/**
 * Single client-side check matching `firestore.rules` (`isVerifiedOwnerEmail()`) and
 * server-side `isVerifiedOwnerEmailToken()`. Strictly requires `email_verified === true`.
 */
export function isVerifiedOwnerFromToken(
  claims?: Record<string, unknown> | null,
  user?: { email?: string | null; emailVerified?: boolean | null } | null
): boolean {
  const emailVerified =
    claims?.email_verified === true ||
    (claims?.email_verified === undefined && user?.emailVerified === true);
  if (!emailVerified) return false;

  const candidateEmail = normalizeEmail(
    typeof claims?.email === 'string' ? claims.email : user?.email
  );
  if (!candidateEmail) return false;
  return candidateEmail === SUPER_ADMIN_EMAIL;
}

/**
 * Deprecated unverified client-side identity helper.
 * Always fails CLOSED (`false`) so unverified UID/email/displayName strings never grant admin or superAdmin.
 */
export function isAdminAccount(
  _uidOrEmail?: string | null,
  _displayName?: string | null
): boolean {
  return false;
}

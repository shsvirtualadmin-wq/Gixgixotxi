/**
 * Canonical Boardly Support / Notification Sender Identity Constants
 *
 * SECURITY INVARIANT:
 * Roles (`admin` and `superAdmin`) come ONLY from verified Firebase Auth ID token custom claims
 * (`token.admin === true`, `token.superAdmin === true`), set server-side with the Firebase Admin SDK.
 * Client-side UIDs, emails, display names, Firestore fields, localStorage, or URL params NEVER grant
 * `admin` or `superAdmin` status.
 */

export const SUPER_ADMIN_EMAIL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_OWNER_EMAIL) ||
  'shsvirtualadmin@gmail.com';
export const SUPER_ADMIN_EMAIL_SUPPORT = 'support@boardly.cfd';
export const SUPER_ADMIN_EMAIL_SECONDARY = 'ktkhashir90@gmail.com';
export const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
export const SUPER_ADMIN_UID_SECONDARY = 'JBGCDTLuWUMUIUMCLek7SdgvUNn1';
export const SUPER_ADMIN_NAME = 'Boardly Admin';

export const SUPER_ADMIN_UID_ALLOWLIST: readonly string[] = [];

export const SUPER_ADMIN_EMAIL_ALLOWLIST: readonly string[] = [];

/**
 * Deprecated client-side identity helper.
 * Always fails CLOSED (`false`) so client-side UID/email/displayName checks never grant admin or superAdmin.
 */
export function isAdminAccount(
  _uidOrEmail?: string | null,
  _displayName?: string | null
): boolean {
  return false;
}

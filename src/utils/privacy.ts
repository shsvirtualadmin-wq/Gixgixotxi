import { deriveFallbackShortId } from './shortId';

const ADMIN_IDENTIFIERS = [
  'shsvirtualadmin@gmail.com',
  'support@boardly.cfd',
  'support@scholario.me',
  'a5ymrimdhrcmedwutxtugt2e4hf2',
  'shsvirtualadmin',
];

/**
 * Checks whether an identifier (email, UID, or role) belongs to the Boardly admin account.
 */
export function isAdminAccount(identifier?: string | null): boolean {
  if (!identifier || typeof identifier !== 'string') return false;
  const clean = identifier.toLowerCase().trim();
  return ADMIN_IDENTIFIERS.some((adminId) => clean === adminId || clean.includes('shsvirtualadmin'));
}

/**
 * Checks whether a string looks like an email address.
 */
export function isEmailLike(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.includes('@') && trimmed.includes('.');
}

/**
 * Sanitizes student display name across all public surfaces, leaderboards, profile, and Commons.
 * Rules:
 * 1. Admin account ALWAYS shows "SHS Virtual Academy".
 * 2. Uses real displayName first.
 * 3. Only falls back to "Student" if empty or whitespace (no "Student #43724").
 * 4. Never exposes raw email addresses.
 */
export function sanitizeStudentDisplayName(
  displayName?: string | null,
  uidOrShortId?: string | null
): string {
  // Admin account check: Must show "SHS Virtual Academy"
  if (isAdminAccount(uidOrShortId) || isAdminAccount(displayName)) {
    return 'SHS Virtual Academy';
  }

  if (displayName && typeof displayName === 'string') {
    const trimmed = displayName.trim();

    // Check if displayName itself represents the admin
    if (
      trimmed.toLowerCase() === 'shs virtual academy' ||
      trimmed.toLowerCase() === 'shsvirtualadmin' ||
      trimmed.toLowerCase() === 'shs virtual academy (admin)'
    ) {
      return 'SHS Virtual Academy';
    }

    // Never expose email as display name: if email, extract friendly prefix or fall back to "Student"
    if (isEmailLike(trimmed) || trimmed.includes('@')) {
      const prefix = trimmed.split('@')[0].trim();
      if (prefix && prefix.length >= 2 && !prefix.includes('.')) {
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
      return 'Student';
    }

    if (trimmed.length > 0) {
      // Cap length for clean mobile layout
      if (trimmed.length > 28) {
        return trimmed.slice(0, 26).trim() + '…';
      }
      return trimmed;
    }
  }

  // Fall back to "Student" if empty
  return 'Student';
}

/**
 * Extracts or derives a clean 5-digit short code for a student.
 */
export function getShortDisplayCode(uidOrShortId?: string | null): string {
  if (!uidOrShortId) return '00000';
  const clean = String(uidOrShortId).trim();
  if (/^\d{4,6}$/.test(clean)) {
    return clean;
  }
  return deriveFallbackShortId(clean);
}

/**
 * Mask an email for safe display if ever needed (e.g. j***n@gmail.com).
 * By privacy policy, only shown to the user themselves or the superadmin.
 */
export function maskEmail(email?: string | null): string {
  if (!email || !isEmailLike(email)) return 'Private';
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return 'Private';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
}

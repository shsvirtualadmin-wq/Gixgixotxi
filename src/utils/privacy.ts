import { deriveFallbackShortId } from './shortId';

/**
 * Checks whether a string looks like an email address.
 */
export function isEmailLike(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.includes('@') && trimmed.includes('.');
}

/**
 * Sanitizes student display name across all public surfaces, leaderboards, and crew lists.
 * If displayName is empty, whitespace, or looks like an email address,
 * it returns "Student #" + shortCode (derived from shortId or UID).
 * Ensures emails are NEVER exposed as display names.
 */
export function sanitizeStudentDisplayName(
  displayName?: string | null,
  uidOrShortId?: string | null
): string {
  if (!displayName || typeof displayName !== 'string' || displayName.trim() === '') {
    const code = getShortDisplayCode(uidOrShortId);
    return `Student #${code}`;
  }

  const trimmed = displayName.trim();

  // If the display name looks like an email address (e.g. user@gmail.com)
  if (isEmailLike(trimmed) || trimmed.includes('@')) {
    const code = getShortDisplayCode(uidOrShortId);
    return `Student #${code}`;
  }

  // Cap length for clean mobile display without horizontal overflow
  if (trimmed.length > 28) {
    return trimmed.slice(0, 26).trim() + '…';
  }

  return trimmed;
}

/**
 * Extracts or derives a clean 5-digit short code for a student.
 */
function getShortDisplayCode(uidOrShortId?: string | null): string {
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

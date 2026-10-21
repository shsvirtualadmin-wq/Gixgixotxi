import { isAdminAccount } from './privacy';

export const RESERVED_WORDS = [
  'shs',
  'shsvirtualacademy',
  'boardly',
  'scholario',
  'superadmin',
  'admin',
];

/**
 * Normalizes a candidate username or display name for reserved keyword detection.
 * Strips zero-width characters, accents, spaces, dots, underscores, and translates leetspeak.
 */
export function normalizeForReservedCheck(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let str = input.toLowerCase().trim();

  // Strip invisible unicode & zero-width characters
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');

  // Strip diacritics / accents
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Leetspeak / look-alike character translations:
  // 0 -> o
  // 1, !, | -> l
  // $, 5, § -> s
  // @, 4 -> a
  // 3 -> e
  str = str
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'l')
    .replace(/[0]/g, 'o')
    .replace(/[$5§]/g, 's');

  // Strip all non-alphanumeric characters (spaces, dots, underscores, hyphens, etc.)
  const stripped = str.replace(/[^a-z0-9]/g, '');

  return stripped;
}

/**
 * Checks whether a name contains any reserved keywords or look-alikes.
 */
export function isReservedUsername(name: string): boolean {
  if (!name || typeof name !== 'string') return false;

  const normalized = normalizeForReservedCheck(name);
  if (!normalized) return false;

  // Also check deduplicated / collapsed consecutive characters (e.g., "sshhss" -> "shs")
  const collapsed = normalized.replace(/(.)\1+/g, '$1');

  for (const keyword of RESERVED_WORDS) {
    if (normalized.includes(keyword) || collapsed.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a nickname (display name):
 * 2 to 30 characters, letters, numbers, spaces, and basic punctuation only.
 */
export function validateNickname(
  nickname: string,
  userIdentifier?: string | null,
  isUserAdmin?: boolean
): { valid: boolean; error?: string; isReserved?: boolean } {
  if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
    return { valid: false, error: 'Nickname cannot be empty.' };
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Nickname must be at least 2 characters.' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Nickname cannot exceed 30 characters.' };
  }

  // Letters, numbers, spaces, and basic punctuation only
  const allowedPattern = /^[a-zA-Z0-9\s.,\-_'!?:()]+$/;
  if (!allowedPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Nickname can only contain letters, numbers, spaces, and basic punctuation.',
    };
  }

  const isAdmin = Boolean(isUserAdmin || isAdminAccount(userIdentifier));
  if (!isAdmin && isReservedUsername(trimmed)) {
    return {
      valid: false,
      isReserved: true,
      error: 'This name is reserved. Send a request to use it.',
    };
  }

  return { valid: true };
}

/**
 * Validates username format:
 * Unique, lowercase, letters, numbers, dots, and underscores only (3 to 20 characters).
 */
export function validateUsernameFormat(
  username: string,
  userIdentifier?: string | null,
  isUserAdmin?: boolean
): { valid: boolean; error?: string; isReserved?: boolean } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username cannot be empty.' };
  }

  const clean = username.trim();

  if (clean !== clean.toLowerCase()) {
    return { valid: false, error: 'Username must be all lowercase.' };
  }

  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' };
  }

  if (clean.length > 20) {
    return { valid: false, error: 'Username cannot exceed 20 characters.' };
  }

  const regex = /^[a-z0-9._]+$/;
  if (!regex.test(clean)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, dots, and underscores.',
    };
  }

  const isAdmin = Boolean(isUserAdmin || isAdminAccount(userIdentifier));
  if (!isAdmin && isReservedUsername(clean)) {
    return {
      valid: false,
      isReserved: true,
      error: 'This name is reserved. Send a request to use it.',
    };
  }

  return { valid: true };
}

/**
 * Backwards compatibility for existing imports of validateDisplayName.
 */
export function validateDisplayName(
  name: string,
  userIdentifier?: string | null,
  isUserAdmin?: boolean
): { valid: boolean; error?: string; isReserved?: boolean } {
  return validateNickname(name, userIdentifier, isUserAdmin);
}

/**
 * Checks whether a chosen or custom role attempts to spoof the superadmin or administrator role.
 * Users can never choose or type "Super Admin", "Admin", "Superadmin" or similar as their role.
 */
export function isForbiddenAdminRole(roleStr?: string | null): boolean {
  if (!roleStr || typeof roleStr !== 'string') return false;
  const lower = roleStr.toLowerCase().trim().replace(/[\s\-_.]+/g, '');
  return lower.includes('admin') || lower.includes('superadmin') || lower.includes('administrator');
}

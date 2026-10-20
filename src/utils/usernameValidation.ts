import { isAdminAccount } from './privacy';

export const RESERVED_WORDS = [
  'shs',
  'shsvirtualacademy',
  'boardly',
  'scholario',
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
 * Validates a display name against reserved terms and formatting constraints.
 * Admin users are exempt for official academy branding.
 */
export function validateDisplayName(
  name: string,
  userIdentifier?: string | null,
  isUserAdmin?: boolean
): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Display name cannot be empty.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters.' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Display name cannot exceed 30 characters.' };
  }

  // Exempt official admin accounts
  const isAdmin = Boolean(isUserAdmin || isAdminAccount(userIdentifier));

  if (!isAdmin && isReservedUsername(trimmed)) {
    return {
      valid: false,
      error: 'This name is reserved. Send a request to the admin.',
    };
  }

  return { valid: true };
}

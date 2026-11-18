/**
 * Boardly — Canonical Display Name Helper
 *
 * Strictly separates three distinct identity fields:
 * 1. `display_name` / `displayName` — Public display name chosen by the user.
 * 2. `realName` / `real_name` / `name` — Private real name (fallback only).
 * 3. `username` — Unique handle, ALWAYS rendered with a leading "@" (never as a bare name).
 *
 * Fallback order: display_name -> real name -> "@username" -> "Student"
 */

export interface DisplayNameInput {
  display_name?: string | null;
  displayName?: string | null;
  realName?: string | null;
  real_name?: string | null;
  fullName?: string | null;
  full_name?: string | null;
  name?: string | null;
  username?: string | null;
  handle?: string | null;
  authorDisplayName?: string | null;
  authorName?: string | null;
  authorUsername?: string | null;
  userName?: string | null;
  studentName?: string | null;
  email?: string | null;
}

const INVALID_PLACEHOLDERS = new Set([
  '',
  'unnamed student',
  'unnamed',
  'null',
  'undefined',
  'anonymous',
  'none',
]);

function cleanCandidate(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (INVALID_PLACEHOLDERS.has(trimmed.toLowerCase())) return '';
  // Never treat a raw email address as a display name
  if (trimmed.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return '';
  }
  return trimmed;
}

/**
 * Formats a user's handle strictly as "@username" (or empty string if none exists).
 */
export function getUsernameHandle(user?: DisplayNameInput | null): string {
  if (!user || typeof user !== 'object') return '';
  const raw = String(user.username || user.handle || user.authorUsername || '')
    .trim()
    .replace(/^@+/, '');
  if (!raw || INVALID_PLACEHOLDERS.has(raw.toLowerCase())) return '';
  if (raw.includes('@')) return '';
  return `@${raw}`;
}

/**
 * Returns the raw username without leading "@", or empty string.
 */
export function getRawUsername(user?: DisplayNameInput | null): string {
  const handle = getUsernameHandle(user);
  return handle ? handle.slice(1) : '';
}

/**
 * Single source of truth for displaying a user's name across the entire Boardly UI.
 *
 * Fallback order:
 *   1. `display_name` / `displayName`
 *   2. Real name (`realName` / `real_name` / `fullName` / `full_name` / `name`)
 *   3. `"@username"` (with leading "@")
 *   4. Optional fallback string (default: `"Student"`)
 */
export function getDisplayName(
  user?: DisplayNameInput | null,
  fallback = 'Student'
): string {
  if (!user || typeof user !== 'object') return fallback;

  const rawUsername = getRawUsername(user).toLowerCase();

  // 1. Public display_name / displayName
  const explicitDisplay =
    cleanCandidate(user.display_name) ||
    cleanCandidate(user.displayName) ||
    cleanCandidate(user.authorDisplayName);
  if (explicitDisplay) {
    // If a legacy record accidentally stored "@username" verbatim, normalize it cleanly
    if (explicitDisplay.startsWith('@')) {
      return explicitDisplay;
    }
    return explicitDisplay;
  }

  // 2. Private real name (fallback only — never preferred over display_name)
  const realName =
    cleanCandidate(user.realName) ||
    cleanCandidate(user.real_name) ||
    cleanCandidate(user.fullName) ||
    cleanCandidate(user.full_name) ||
    cleanCandidate(user.name) ||
    cleanCandidate(user.studentName) ||
    cleanCandidate(user.authorName);

  // Guard: if a legacy caller passed the bare username in `name` or `authorName`,
  // fall through to step 3 so it renders properly as "@username".
  if (realName) {
    if (rawUsername && realName.toLowerCase() === rawUsername) {
      return `@${getRawUsername(user)}`;
    }
    if (realName.toLowerCase() !== 'student') {
      return realName;
    }
  }

  // 3. Username formatted strictly as "@username"
  const handle = getUsernameHandle(user);
  if (handle) {
    return handle;
  }

  // 4. Legacy userName fallback (only if it's not empty)
  const legacyUserName = cleanCandidate(user.userName);
  if (legacyUserName) {
    return legacyUserName.startsWith('@') ? legacyUserName : legacyUserName;
  }

  return realName || fallback;
}

/**
 * Returns the initial letter for avatars/badges derived from `getDisplayName(user)`.
 */
export function getDisplayInitial(user?: DisplayNameInput | null, fallback = 'S'): string {
  const name = getDisplayName(user, fallback).replace(/^@+/, '').trim();
  return (name.charAt(0) || fallback).toUpperCase();
}

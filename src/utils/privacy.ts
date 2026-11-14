import { deriveFallbackShortId } from './shortId';

const SUPER_ADMIN_UID_SET = new Set<string>([
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  'uid_superadmin_1',
  'uid_superadmin_2',
]);

/**
 * Checks whether an immutable UID belongs to the Boardly superadmin allowlist.
 * Never checks usernames, display names, email addresses, or substrings.
 */
export function isAdminAccount(uid?: string | null): boolean {
  if (!uid || typeof uid !== 'string') return false;
  return SUPER_ADMIN_UID_SET.has(uid.trim());
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
 * 1. Uses real displayName first (never rewrites normal users to "SHS Virtual Academy").
 * 2. Only falls back to "SHS Virtual Academy" if uid is the real superadmin UID and displayName is empty.
 * 3. Only falls back to "Student" if empty or whitespace.
 * 4. Never exposes raw email addresses.
 */
export function sanitizeStudentDisplayName(
  displayName?: string | null,
  uidOrShortId?: string | null
): string {
  if (displayName && typeof displayName === 'string') {
    const trimmed = displayName.trim();

    // Never expose email as display name: if email, extract friendly prefix or fall back to "Student"
    if (isEmailLike(trimmed) || trimmed.includes('@')) {
      const prefix = trimmed.split('@')[0].trim();
      if (prefix && prefix.length >= 2 && !prefix.includes('.')) {
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
      return isAdminAccount(uidOrShortId) ? 'SHS Virtual Academy' : 'Student';
    }

    if (trimmed.length > 0) {
      // Cap length for clean mobile layout
      if (trimmed.length > 28) {
        return trimmed.slice(0, 26).trim() + '…';
      }
      return trimmed;
    }
  }

  if (isAdminAccount(uidOrShortId)) {
    return 'SHS Virtual Academy';
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

/**
 * Automatically detects and masks phone numbers, email addresses, and WhatsApp invite/chat links
 * in user-generated public text (posts, comments, bios) to protect student privacy.
 */
export function maskPublicUserText(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    // Mask WhatsApp links (wa.me, chat.whatsapp.com, api.whatsapp.com)
    .replace(
      /https?:\/\/(?:chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com)\/[^\s)]+/gi,
      '[WhatsApp link hidden for student privacy]'
    )
    // Mask email addresses in public text
    .replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[email hidden]'
    )
    // Mask Pakistani & international phone numbers (+92 3xx xxxxxxx, 03xx-xxxxxxx, etc.)
    .replace(
      /(?:\+92|0092|0)[\s.-]?3\d{2}[\s.-]?\d{7}\b/g,
      '[phone hidden]'
    );
}

/**
 * Builds a clean SEO-friendly `{id}-{slug}` path segment for posts, materials, tests, and crews.
 */
export function buildEntitySlug(id: string, title?: string | null): string {
  const cleanId = String(id || '').trim();
  if (!title) return cleanId;
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '');
  return slug ? `${cleanId}-${slug}` : cleanId;
}

/**
 * Extracts the Firestore document ID from an `{id}-{slug}` route parameter,
 * or returns the raw parameter if no slug suffix is present.
 */
export function extractIdFromSlug(idSlug?: string | null): string {
  if (!idSlug) return '';
  const trimmed = decodeURIComponent(idSlug).trim();
  if (!trimmed) return '';
  const uuidMatch = trimmed.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-|$)/i
  );
  if (uuidMatch) return uuidMatch[1];
  const anonTopicMatch = trimmed.match(/^(commons_anon_topic_\d+)(?:-|$)/i);
  if (anonTopicMatch) return anonTopicMatch[1];
  const postGenMatch = trimmed.match(/^(post_gen_\d+)(?:-|$)/);
  if (postGenMatch) return postGenMatch[1];
  const postMatch = trimmed.match(/^(post_\d+_[a-zA-Z0-9]+)(?:-|$)/);
  if (postMatch) return postMatch[1];
  const postGenericMatch = trimmed.match(/^(post_[a-zA-Z0-9_]+)(?:-|$)/i);
  if (postGenericMatch) return postGenericMatch[1];
  const glMatch = trimmed.match(/^(gl-[a-z0-9]+-\d+)(?:-|$)/i);
  if (glMatch) return glMatch[1];
  const dashIndex = trimmed.indexOf('-');
  if (dashIndex === -1) return trimmed;
  return trimmed.slice(0, dashIndex);
}



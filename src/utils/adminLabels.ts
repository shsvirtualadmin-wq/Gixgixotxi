/**
 * Human-readable display labels & pluralization helpers for /admin views.
 * Presentation-only: never alters raw API/database keys.
 */

export function pluralize(count: number, singular: string, plural?: string): string {
  const safe = Number.isFinite(count) ? count : 0;
  const word = Math.abs(safe) === 1 ? singular : (plural ?? `${singular}s`);
  return `${safe.toLocaleString()} ${word}`;
}

export function pluralWord(count: number, singular: string, plural?: string): string {
  const safe = Number.isFinite(count) ? count : 0;
  return Math.abs(safe) === 1 ? singular : (plural ?? `${singular}s`);
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  approve_captain_application: 'Approved captain application',
  reject_captain_application: 'Rejected captain application',
  approve_crew_application: 'Approved crew application',
  reject_crew_application: 'Rejected crew application',
  approve_application: 'Approved application',
  reject_application: 'Rejected application',
  approve_payment: 'Approved payment',
  reject_payment: 'Rejected payment',
  verify_payment: 'Verified payment',
  update_user_plan: 'Updated user plan',
  update_user_role: 'Updated user role',
  update_user_override: 'Updated user account',
  update_user: 'Updated user account',
  ban_user: 'Suspended user account',
  unban_user: 'Restored user account',
  delete_user: 'Removed user account',
  grant_kobans: 'Granted Kobans',
  deduct_kobans: 'Deducted Kobans',
  issue_certificate: 'Issued certificate',
  revoke_certificate: 'Revoked certificate',
  restore_certificate: 'Restored certificate',
  update_signature: 'Updated certificate signature',
  create_coupon: 'Created coupon',
  update_coupon: 'Updated coupon',
  delete_coupon: 'Deleted coupon',
  deactivate_coupon: 'Deactivated coupon',
  update_plan: 'Updated plan settings',
  update_plans: 'Updated plan settings',
  update_pricing: 'Updated store pricing',
  update_ad_settings: 'Updated ad settings',
  update_ads: 'Updated ad settings',
  create_announcement: 'Published announcement',
  update_announcement: 'Updated announcement',
  delete_announcement: 'Deleted announcement',
  approve_access_request: 'Approved access request',
  deny_access_request: 'Denied access request',
  reject_access_request: 'Denied access request',
  revoke_admin_access: 'Revoked admin access',
  create_formula: 'Added formula',
  update_formula: 'Updated formula',
  delete_formula: 'Deleted formula',
  create_mcq: 'Added question',
  update_mcq: 'Updated question',
  delete_mcq: 'Deleted question',
  rewards_mode_change: 'Updated rewards mode',
};

export function formatAuditActionLabel(action: string | null | undefined): string {
  const raw = String(action || '').trim();
  if (!raw) return 'Admin action';
  const normalized = raw.toLowerCase().replace(/[\s.-]+/g, '_');
  if (AUDIT_ACTION_LABELS[normalized]) {
    return AUDIT_ACTION_LABELS[normalized];
  }
  const words = normalized.split('_').filter(Boolean);
  if (words.length === 0) return 'Admin action';
  return words
    .map((w, idx) => (idx === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const AD_SLOT_LABELS: Record<string, string> = {
  home_top: 'Home - top',
  home_mid: 'Home - middle',
  home_bottom: 'Home - bottom',
  dashboard_top: 'Dashboard - top',
  dashboard_mid: 'Dashboard - middle',
  dashboard_bottom: 'Dashboard - bottom',
  dashboard_banner: 'Dashboard - banner',
  practice_top: 'Practice - top',
  practice_mid: 'Practice - middle',
  practice_bottom: 'Practice - bottom',
  commons_top: 'Commons - top',
  commons_mid: 'Commons - middle',
  commons_feed: 'Commons - in-feed',
  commons_inline: 'Commons - inline',
  formulas_top: 'Formula Vault - top',
  formulas_mid: 'Formula Vault - middle',
  results_top: 'Results - top',
  results_mid: 'Results - middle',
  results_bottom: 'Results - bottom',
  store_top: 'Store - top',
  store_mid: 'Store - middle',
  grand_line_top: 'Grand Line - top',
  grand_line_mid: 'Grand Line - middle',
  mcqs_top: 'MCQs - top',
  mcqs_mid: 'MCQs - middle',
  material_top: 'Material - top',
  material_mid: 'Material - middle',
};

export function formatAdSlotLabel(slotKey: string | null | undefined, fallbackLabel?: string): string {
  const raw = String(slotKey || '').trim();
  if (!raw) return fallbackLabel || 'Ad placement';
  const normalized = raw.toLowerCase().replace(/[\s-]+/g, '_');
  if (AD_SLOT_LABELS[normalized]) return AD_SLOT_LABELS[normalized];
  if (fallbackLabel && !fallbackLabel.includes('_')) return fallbackLabel;
  const parts = normalized.split('_').filter(Boolean);
  if (parts.length >= 2) {
    const pos = parts[parts.length - 1];
    const posMap: Record<string, string> = {
      mid: 'middle',
      top: 'top',
      bottom: 'bottom',
      inline: 'inline',
      feed: 'in-feed',
      sidebar: 'sidebar',
      banner: 'banner',
    };
    const area = parts
      .slice(0, -1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
    if (posMap[pos]) return `${area} - ${posMap[pos]}`;
  }
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

const THEME_LABELS: Record<string, string> = {
  welcome_to_boardly: 'Welcome banner',
  info: 'Info',
  warning: 'Notice',
  danger: 'Urgent',
  success: 'Success',
  accent: 'Boardly Red',
  red: 'Boardly Red',
  crimson: 'Boardly Red',
  gold: 'Gold highlight',
  dark: 'Dark glass',
  neutral: 'Neutral',
  celebration: 'Celebration',
  maintenance: 'Maintenance',
  promo: 'Promotion',
  update: 'Product update',
};

export function formatThemeLabel(themeKey: string | null | undefined): string {
  const raw = String(themeKey || '').trim();
  if (!raw) return 'Default';
  const normalized = raw.toLowerCase().replace(/[\s-]+/g, '_');
  if (THEME_LABELS[normalized]) return THEME_LABELS[normalized];
  return normalized
    .split('_')
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  user: 'Student',
  guest: 'Guest',
  captain: 'Captain',
  ambassador: 'Captain',
  crew_leader: 'Crew Leader',
  admin: 'Admin',
  superadmin: 'Super Admin',
  super_admin: 'Super Admin',
};

export function formatRoleLabel(role: string | null | undefined): string {
  const raw = String(role || '').trim().toLowerCase();
  if (!raw) return 'Student';
  if (ROLE_LABELS[raw]) return ROLE_LABELS[raw];
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ');
}

export function formatSignatureLabel(version?: string | number | null): string {
  if (version === null || version === undefined || String(version).trim() === '') {
    return 'Active signature';
  }
  const clean = String(version).replace(/^sig:\s*/i, '').replace(/^v/i, '').trim();
  return clean ? `Signature version ${clean}` : 'Active signature';
}

export function formatStorageNote(text: string): string {
  return text
    .replace(/\bCloudflare\s+D1\b/gi, 'database')
    .replace(/\bCloudflare\s+R2\b/gi, 'media storage')
    .replace(/\bD1\s*&\s*R2\b/gi, 'cloud storage')
    .replace(/\bD1\b/g, 'database')
    .replace(/\bR2\b/g, 'storage')
    .replace(/\bFirestore\b/gi, 'cloud records')
    .replace(/welcome_to_boardly/gi, 'Welcome banner');
}

export type NormalizedCouponType = '1_year_free_pro' | 'percent' | 'fixed_pkr' | 'fixed_kobans';

export interface NormalizedAdminCoupon {
  id: string;
  code: string;
  label: string;
  type: NormalizedCouponType;
  percentOff: number | null;
  active: boolean;
  maxRedemptions: number;
  redeemedCount: number;
  expiresAt: string | null;
  // Backwards-compatible aliases
  discountType: string;
  discountPercent: number | null;
  redemptionCount: number;
  isActive: boolean;
}

export interface NormalizedAdminCouponRedemption {
  id: string;
  code: string;
  userName: string;
  userEmail: string;
  userId: string;
  userDisplay: string;
  initials: string;
  planOrTrack: string | null;
  redeemedAt: string | null;
  redeemedAtMs: number | null;
  relativeTime: string;
  fullDate: string;
}

/**
 * Parses Firestore Timestamps ({ seconds, nanoseconds } / { _seconds, _nanoseconds } / toDate()),
 * ISO strings, numeric strings, and epoch seconds or milliseconds into epoch ms.
 */
export function parseFlexibleTimestampMs(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    // Epoch seconds vs milliseconds heuristic (timestamps < 1e11 are seconds)
    return value < 1e11 ? Math.round(value * 1000) : Math.round(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (Number.isFinite(num) && num > 0) {
        return num < 1e11 ? Math.round(num * 1000) : Math.round(num);
      }
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, any>;
    if (typeof obj.toMillis === 'function') {
      const ms = Number(obj.toMillis());
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof obj.toDate === 'function') {
      const d = obj.toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) {
        return d.getTime();
      }
    }
    const secs = obj.seconds ?? obj._seconds;
    const nanos = obj.nanoseconds ?? obj._nanoseconds ?? 0;
    if (typeof secs === 'number' && Number.isFinite(secs)) {
      return Math.round(secs * 1000 + Number(nanos || 0) / 1e6);
    }
    if (typeof obj.timestampValue === 'string') {
      const parsed = Date.parse(obj.timestampValue);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  return null;
}

/**
 * Formats an epoch millisecond timestamp as a concise relative string (e.g. "2h ago", "3d ago").
 */
export function formatRelativeRedemptionTime(
  timestampMs: number | null,
  nowMs = Date.now()
): string {
  if (!timestampMs || !Number.isFinite(timestampMs)) return 'Unknown time';
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));

  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

/**
 * Formats an epoch millisecond timestamp as a full human-readable date and time.
 */
export function formatFullRedemptionDate(timestampMs: number | null): string {
  if (!timestampMs || !Number.isFinite(timestampMs)) return 'Timestamp unavailable';
  try {
    return new Date(timestampMs).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return new Date(timestampMs).toISOString();
  }
}

function parseBooleanActive(raw: Record<string, any>): boolean {
  const candidates = [raw.active, raw.isActive, raw.is_active, raw.enabled, raw.status];
  for (const val of candidates) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'active' || lower === 'enabled') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'disabled' || lower === 'inactive') {
        return false;
      }
    }
  }
  return true;
}

/**
 * Single source of truth mapper for Admin Coupons.
 * Normalizes any raw API / Firestore / JSON coupon record into:
 * { code, label, type, percentOff, active, maxRedemptions, redeemedCount, expiresAt }
 */
export function normalizeAdminCoupon(raw: Record<string, any> | null | undefined): NormalizedAdminCoupon {
  const src = raw && typeof raw === 'object' ? raw : {};
  const code = String(src.code || src.promo_code || src.id || '')
    .trim()
    .toUpperCase();

  const rawTypeStr = String(
    src.type || src.discountType || src.discount_type || src.benefitType || src.benefit_type || ''
  )
    .trim()
    .toLowerCase();

  const durationMonths = Number(src.durationMonths ?? src.duration_months ?? 0);
  const durationDays = Number(src.durationDays ?? src.duration_days ?? 0);

  // Extract explicit percent field if present
  const rawPctCandidate =
    src.percentOff ??
    src.percent_off ??
    src.discountPercent ??
    src.discount_percent ??
    src.percent ??
    src.percentage;

  let explicitPct: number | null = null;
  if (rawPctCandidate !== undefined && rawPctCandidate !== null && rawPctCandidate !== '') {
    const num = Number(rawPctCandidate);
    if (Number.isFinite(num) && num > 0) {
      explicitPct = Math.min(100, Math.max(1, Math.round(num)));
    }
  }

  // Detect 1-Year Free Pro campaign codes (e.g. BOARDLY-1Y-XXXXX or discount_type === '1_year_free_pro')
  const isOneYearProCodePattern = /^BOARDLY-1Y-/i.test(code) || /1[-_]?YEAR[-_]?FREE[-_]?PRO/i.test(rawTypeStr);
  const isFreeProType =
    isOneYearProCodePattern ||
    rawTypeStr === '1_year_free_pro' ||
    rawTypeStr === 'free_pro' ||
    (explicitPct !== null && explicitPct >= 100 && (durationMonths >= 12 || durationDays >= 360));

  let type: NormalizedCouponType = 'percent';
  let percentOff: number | null = explicitPct;

  const amountPkr = Number(src.amountOffPkr ?? src.amount_off_pkr ?? src.discountPkr ?? 0);
  const amountKobans = Number(src.amountOffKobans ?? src.amount_off_kobans ?? src.discountKobans ?? 0);

  if (isFreeProType) {
    type = '1_year_free_pro';
    percentOff = 100;
  } else if (rawTypeStr === 'fixed_pkr' || (amountPkr > 0 && explicitPct === null)) {
    type = 'fixed_pkr';
    percentOff = null;
  } else if (rawTypeStr === 'fixed_kobans' || (amountKobans > 0 && explicitPct === null)) {
    type = 'fixed_kobans';
    percentOff = null;
  } else {
    type = 'percent';
    if (percentOff === null) {
      // Infer percent from code suffix like BOARDLY50, BOARDLY20, NEW20 if not explicitly stored
      const codePctMatch = code.match(/(\d{1,3})$/);
      if (codePctMatch) {
        const parsedFromCode = Number(codePctMatch[1]);
        if (parsedFromCode >= 1 && parsedFromCode <= 100) {
          percentOff = parsedFromCode;
        }
      }
    }
  }

  const maxRedemptionsRaw = Number(
    src.maxRedemptions ?? src.max_redemptions ?? src.maxUses ?? src.max_uses ?? 100
  );
  const maxRedemptions =
    Number.isFinite(maxRedemptionsRaw) && maxRedemptionsRaw >= 1
      ? Math.round(maxRedemptionsRaw)
      : 100;

  const redeemedCountRaw = Number(
    src.redeemedCount ??
      src.redemptionCount ??
      src.redemption_count ??
      src.usedCount ??
      src.used_count ??
      0
  );
  const redeemedCount =
    Number.isFinite(redeemedCountRaw) && redeemedCountRaw >= 0
      ? Math.round(redeemedCountRaw)
      : 0;

  const active = parseBooleanActive(src);

  const expiresAtMs = parseFlexibleTimestampMs(src.expiresAt ?? src.expires_at ?? null);
  const expiresAt = expiresAtMs ? new Date(expiresAtMs).toISOString() : null;

  const rawLabel = String(src.label ?? src.description ?? src.title ?? '').trim();
  const label =
    rawLabel ||
    (type === '1_year_free_pro'
      ? '1-Year Free Pro Campaign'
      : percentOff !== null
        ? `${percentOff}% Off Pro Pass`
        : `${code} Promo`);

  return {
    id: String(src.id || `promo_${code.toLowerCase()}`),
    code,
    label,
    type,
    percentOff,
    active,
    maxRedemptions,
    redeemedCount,
    expiresAt,
    discountType: type,
    discountPercent: percentOff,
    redemptionCount: redeemedCount,
    isActive: active,
  };
}

/**
 * Returns the badge label for a normalized coupon, or null if no valid badge value exists.
 * Never returns "undefined% OFF" or "undefined".
 */
export function getCouponBadgeLabel(coupon: NormalizedAdminCoupon): string | null {
  if (!coupon) return null;
  if (coupon.type === '1_year_free_pro' || /^BOARDLY-1Y-/i.test(coupon.code)) {
    return '1 YEAR FREE PRO';
  }
  if (
    typeof coupon.percentOff === 'number' &&
    Number.isFinite(coupon.percentOff) &&
    coupon.percentOff > 0
  ) {
    if (coupon.percentOff >= 100) {
      return '1 YEAR FREE PRO';
    }
    return `${coupon.percentOff}% OFF`;
  }
  return null;
}

function buildUserInitials(display: string): string {
  const cleaned = String(display || '')
    .replace(/@.*$/, '')
    .replace(/[_\-.]+/g, ' ')
    .trim();
  if (!cleaned) return 'ST';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/**
 * Single source of truth mapper for Coupon Redemptions.
 * Handles snake_case (promo_redemptions.json), camelCase (Firestore couponRedemptions),
 * Firestore Timestamp objects, ISO strings, and epoch numbers.
 */
export function normalizeAdminCouponRedemption(
  raw: Record<string, any> | null | undefined,
  nowMs = Date.now()
): NormalizedAdminCouponRedemption {
  const src = raw && typeof raw === 'object' ? raw : {};

  const code = String(
    src.code || src.promo_code || src.couponCode || src.promoCode || src.coupon_code || ''
  )
    .trim()
    .toUpperCase();

  const userName = String(
    src.userName || src.student_name || src.user_name || src.displayName || src.name || ''
  ).trim();

  const userEmail = String(
    src.userEmail || src.student_email || src.user_email || src.email || ''
  ).trim();

  const userId = String(
    src.userId || src.student_id || src.user_id || src.uid || ''
  ).trim();

  const userDisplay = userEmail || userName || userId || 'Student';
  const initials = buildUserInitials(userName || userEmail || userId);

  const planPart = String(src.planName || src.planId || src.plan_id || src.track || '').trim();
  const modePart = String(src.mode || src.method || src.paymentMethod || '').trim();
  const planOrTrack =
    planPart && modePart
      ? `${planPart} · ${modePart}`
      : planPart || modePart || null;

  const rawTime =
    src.redeemedAt ??
    src.redeemed_at ??
    src.createdAt ??
    src.created_at ??
    src.timestamp ??
    src.grantedAt ??
    src.granted_at ??
    null;

  const redeemedAtMs = parseFlexibleTimestampMs(rawTime);
  const redeemedAt = redeemedAtMs ? new Date(redeemedAtMs).toISOString() : null;
  const relativeTime = formatRelativeRedemptionTime(redeemedAtMs, nowMs);
  const fullDate = formatFullRedemptionDate(redeemedAtMs);

  return {
    id: String(src.id || `red_${code}_${userId || Math.random().toString(36).slice(2, 7)}`),
    code: code || 'PROMO',
    userName,
    userEmail,
    userId,
    userDisplay,
    initials,
    planOrTrack,
    redeemedAt,
    redeemedAtMs,
    relativeTime,
    fullDate,
  };
}

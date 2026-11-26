import { buildPlansCatalog, type PlansCatalog } from '@/config/plans';
import {
  DEFAULT_PLANS_CONFIG,
  getPlan,
  getPlanTierFromPlanId,
  normalizePlanTier,
  normalizePlansConfig,
  parsePlanExpiryMs,
  type PaidPlanId,
  type PlansConfigDoc,
} from '@/lib/planTier';

export interface PlanAnalyticsSnapshot {
  freeCount: number;
  proCount: number;
  plusCount: number;
  expiringSoonCount: number;
  proRevenuePkr: number;
  plusRevenuePkr: number;
  proToPlusConversions: number;
}

export interface PlanAnalyticsDocRecord {
  id: string;
  data: Record<string, any>;
}

const APPROVED_PAYMENT_STATUSES = new Set(['approved', 'verified', 'completed']);
const SEVEN_DAYS_MS = 7 * 86_400_000;

function toPositiveNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Accurately determines whether a paid paymentRequest / planActivation / user record
 * belongs to Boardly Plus or Boardly Pro. Checks explicit Plus indicators across all
 * known fields before falling back to 'pro' so legacy records like
 * `{ plan: 'annual', planTier: 'plus' }` are never misclassified as Pro.
 */
export function resolvePaidRecordTier(rec: Record<string, any>): 'plus' | 'pro' {
  if (rec.isPlus === true) return 'plus';

  const candidates = [
    rec.planTier,
    rec.tier,
    rec.plusPlanId,
    rec.planId,
    rec.plan,
    rec.requestType,
    rec.planName,
    rec.purchaseSubtype,
  ];

  for (const val of candidates) {
    if (typeof val === 'string' && val.trim()) {
      const lower = val.trim().toLowerCase();
      if (getPlanTierFromPlanId(lower) === 'plus' || lower.includes('plus')) {
        return 'plus';
      }
    }
  }

  return 'pro';
}

/**
 * Determines whether a paid record represents an annual or monthly pass.
 */
export function resolvePaidRecordBilling(
  rec: Record<string, any>,
  nowMs: number = Date.now()
): 'annual' | 'monthly' {
  const candidates = [
    rec.billing,
    rec.plusPlanId,
    rec.planId,
    rec.proPlanId,
    rec.plan,
    rec.planName,
  ];

  for (const val of candidates) {
    if (typeof val === 'string' && val.trim()) {
      const lower = val.trim().toLowerCase();
      if (lower.includes('annual') || lower.includes('year') || lower === 'yearly') {
        return 'annual';
      }
      if (lower.includes('month')) {
        return 'monthly';
      }
    }
  }

  const durationDays = Number(rec.daysAdded ?? rec.durationDays ?? 0);
  if (Number.isFinite(durationDays) && durationDays >= 300) {
    return 'annual';
  }

  const durationMonths = Number(rec.durationMonths ?? 0);
  if (Number.isFinite(durationMonths) && durationMonths >= 12) {
    return 'annual';
  }

  // For user documents without an explicit planId/billing field, infer from expiry horizon
  const expiryMs = parsePlanExpiryMs(
    rec.plusUntil ?? rec.planExpiresAt ?? rec.premiumExpiresAt ?? rec.proUntil ?? null
  );
  if (expiryMs !== null) {
    const startMs = parsePlanExpiryMs(rec.planStartedAt ?? null) ?? nowMs;
    if (expiryMs - startMs > 45 * 86_400_000) {
      return 'annual';
    }
  }

  return 'monthly';
}

export function resolvePaidPlanIdForRecord(
  rec: Record<string, any>,
  nowMs: number = Date.now(),
  forcedTier?: 'plus' | 'pro'
): PaidPlanId {
  const tier = forcedTier ?? resolvePaidRecordTier(rec);
  const billing = resolvePaidRecordBilling(rec, nowMs);
  if (tier === 'plus') {
    return billing === 'annual' ? 'plus_annual' : 'plus_monthly';
  }
  return billing === 'annual' ? 'pro_annual' : 'pro_monthly';
}

/**
 * Resolves the real PKR value of a Pro or Plus payment/activation record using
 * live `config/plans` catalog pricing (Plus: PKR 399/mo, PKR 3,591/yr; Pro: PKR 199/mo, PKR 1,791/yr).
 * Never prices a valid Plus or Pro plan at 0.
 */
export function resolvePaidRecordPricePkr(
  rec: Record<string, any>,
  catalog: PlansCatalog,
  kobansPerPkr: number = DEFAULT_PLANS_CONFIG.kobansPerPkr,
  nowMs: number = Date.now(),
  forcedTier?: 'plus' | 'pro'
): number {
  const explicitPkr =
    toPositiveNumber(rec.amount_pkr) ??
    toPositiveNumber(rec.amount) ??
    toPositiveNumber(rec.finalPkr) ??
    toPositiveNumber(rec.pkrAmount) ??
    toPositiveNumber(rec.pkrValue);

  if (explicitPkr !== null) {
    return Math.round(explicitPkr);
  }

  const kobansSpent = toPositiveNumber(rec.kobansSpent);
  if (kobansSpent !== null) {
    const safeRate = Math.max(1, Number(kobansPerPkr) || DEFAULT_PLANS_CONFIG.kobansPerPkr);
    return Math.max(1, Math.round(kobansSpent / safeRate));
  }

  const originalPkr =
    toPositiveNumber(rec.originalAmountPkr) ??
    toPositiveNumber(rec.expectedAmountPkr) ??
    toPositiveNumber(rec.originalPkr);
  if (originalPkr !== null) {
    return Math.round(originalPkr);
  }

  const planId = resolvePaidPlanIdForRecord(rec, nowMs, forcedTier);
  return catalog[planId].price_pkr;
}

export function isProToPlusUpgradeRecord(rec: Record<string, any>): boolean {
  if (rec.upgradedFromPro === true) return true;
  if (Number(rec.proCreditDays ?? 0) > 0) return true;
  if (Number(rec.replacedProDaysRemaining ?? 0) > 0) return true;
  if (normalizePlanTier(rec.previousPlan) === 'pro') return true;
  if (normalizePlanTier(rec.previousTier) === 'pro') return true;
  return false;
}

/**
 * Computes the Admin Overview "Boardly Plans Snapshot" metrics from:
 * 1. Live `config/plans` (authoritative Pro/Plus monthly & annual pricing)
 * 2. Approved/verified/completed `paymentRequests`
 * 3. `planActivations` (Koban purchases & coupon activations, including Pro -> Plus upgrades)
 * 4. Active paid `users` docs (reconciliation fallback for active Pro/Plus users without a
 *    matching payment/activation doc, deduplicated by UID so no user is double-counted)
 */
export function computePlanAnalyticsSnapshot(params: {
  plansConfig?: Partial<PlansConfigDoc> | Record<string, any> | null;
  paymentRequests?: PlanAnalyticsDocRecord[];
  planActivations?: PlanAnalyticsDocRecord[];
  paidUsers?: PlanAnalyticsDocRecord[];
  baseCounts?: {
    freeCount?: number | null;
    proCount?: number | null;
    plusCount?: number | null;
    expiringSoonCount?: number | null;
  };
  nowMs?: number;
}): PlanAnalyticsSnapshot {
  const nowMs = params.nowMs ?? Date.now();
  const normalizedConfig = normalizePlansConfig(
    (params.plansConfig as Record<string, any> | null) ?? null
  );
  const catalog = buildPlansCatalog(normalizedConfig);
  const kobansPerPkr = normalizedConfig.kobansPerPkr;

  let proRevenuePkr = 0;
  let plusRevenuePkr = 0;

  const proAccountedUids = new Set<string>();
  const plusAccountedUids = new Set<string>();
  const convertedKeys = new Set<string>();
  const seenActivationIds = new Set<string>();

  // 1. Approved / verified / completed manual payment requests
  for (const item of params.paymentRequests ?? []) {
    const data = item.data || {};
    const status = String(data.status || '').trim().toLowerCase();
    if (!APPROVED_PAYMENT_STATUSES.has(status)) continue;
    if (String(data.plan || '').trim().toLowerCase() === 'large_crew' || data.crewId) continue;

    const uid = String(data.userId || data.uid || '').trim();
    const tier = resolvePaidRecordTier(data);
    const amt = resolvePaidRecordPricePkr(data, catalog, kobansPerPkr, nowMs, tier);

    if (tier === 'plus') {
      plusRevenuePkr += amt;
      if (uid) plusAccountedUids.add(uid);
      if (isProToPlusUpgradeRecord(data)) {
        convertedKeys.add(uid || `payreq:${item.id}`);
      }
    } else {
      proRevenuePkr += amt;
      if (uid) proAccountedUids.add(uid);
    }
  }

  // 2. Plan activations (Kobans redemptions & coupon activations)
  for (const item of params.planActivations ?? []) {
    const data = item.data || {};
    const source = String(data.source || '').trim().toLowerCase();
    // Never double-count records that originate from paymentRequests
    if (source.startsWith('payment_')) continue;

    const dedupeKey = String(data.id || item.id || '').trim();
    if (dedupeKey) {
      if (seenActivationIds.has(dedupeKey)) continue;
      seenActivationIds.add(dedupeKey);
    }

    const uid = String(data.uid || data.userId || '').trim();
    const tier = resolvePaidRecordTier(data);
    const amt = resolvePaidRecordPricePkr(data, catalog, kobansPerPkr, nowMs, tier);

    if (tier === 'plus') {
      plusRevenuePkr += amt;
      if (uid) plusAccountedUids.add(uid);
      if (isProToPlusUpgradeRecord(data)) {
        convertedKeys.add(uid || `act:${item.id}`);
      }
    } else {
      proRevenuePkr += amt;
      if (uid) proAccountedUids.add(uid);
    }
  }

  // 3. Reconcile active paid users (excluding implicit superAdmin elevation without a paid plan)
  let activeProFromUsers = 0;
  let activePlusFromUsers = 0;
  let expiringSoonFromUsers = 0;
  const seenUserIds = new Set<string>();

  for (const item of params.paidUsers ?? []) {
    const data = item.data || {};
    const uid = String(data.uid || item.id || '').trim();
    if (!uid || seenUserIds.has(uid)) continue;
    seenUserIds.add(uid);

    const activeTier = getPlan(
      {
        ...data,
        uid,
        isSuperAdmin: false,
        isSuperAdminClaim: false,
        role: 'student',
      },
      nowMs
    );

    if (activeTier !== 'pro' && activeTier !== 'plus') continue;

    const expiryMs = parsePlanExpiryMs(
      activeTier === 'plus'
        ? (data.plusUntil ?? data.planExpiresAt ?? data.premiumExpiresAt ?? null)
        : (data.proUntil ?? data.planExpiresAt ?? data.premiumExpiresAt ?? null)
    );
    if (expiryMs !== null && expiryMs > nowMs && expiryMs - nowMs <= SEVEN_DAYS_MS) {
      expiringSoonFromUsers += 1;
    }

    if (activeTier === 'plus') {
      activePlusFromUsers += 1;
      if (!plusAccountedUids.has(uid)) {
        const planId = resolvePaidPlanIdForRecord(data, nowMs, 'plus');
        plusRevenuePkr += catalog[planId].price_pkr;
        plusAccountedUids.add(uid);
      }

      const hadProPlanId = String(data.proPlanId || '')
        .trim()
        .toLowerCase()
        .startsWith('pro');
      if (isProToPlusUpgradeRecord(data) || proAccountedUids.has(uid) || hadProPlanId) {
        convertedKeys.add(uid);
      }
    } else {
      activeProFromUsers += 1;
      if (!proAccountedUids.has(uid)) {
        const planId = resolvePaidPlanIdForRecord(data, nowMs, 'pro');
        proRevenuePkr += catalog[planId].price_pkr;
        proAccountedUids.add(uid);
      }
    }
  }

  // Also detect Pro -> Plus conversions where the same UID appears in both Pro and Plus records
  for (const uid of plusAccountedUids) {
    if (proAccountedUids.has(uid)) {
      convertedKeys.add(uid);
    }
  }

  const base = params.baseCounts ?? {};
  const freeCount =
    typeof base.freeCount === 'number' && Number.isFinite(base.freeCount) ? base.freeCount : 0;
  const proCount =
    typeof base.proCount === 'number' && Number.isFinite(base.proCount)
      ? base.proCount
      : activeProFromUsers;
  const plusCount =
    typeof base.plusCount === 'number' && Number.isFinite(base.plusCount)
      ? base.plusCount
      : activePlusFromUsers;
  const expiringSoonCount =
    typeof base.expiringSoonCount === 'number' && Number.isFinite(base.expiringSoonCount)
      ? base.expiringSoonCount
      : expiringSoonFromUsers;

  return {
    freeCount,
    proCount,
    plusCount,
    expiringSoonCount,
    proRevenuePkr,
    plusRevenuePkr,
    proToPlusConversions: convertedKeys.size,
  };
}

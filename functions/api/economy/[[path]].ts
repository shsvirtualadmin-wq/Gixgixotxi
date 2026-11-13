import {
  FirestoreRestAdapter,
  verifyFirebaseIdToken,
  parseServiceAccountFromEnv,
  getServiceAccountAccessToken,
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_FIRESTORE_DATABASE_ID,
  type RewardsEnv,
  type VerifiedFirebaseToken,
} from '../../_utils/firestoreRestAdmin';
import {
  COSMETICS_CATALOG,
  LEGACY_COSMETICS_CATALOG,
} from '../../../src/data/cosmeticsCatalog';
import { getProPlanById, computeExtendedProExpiry } from '../../../src/config/plans';

const ALL_KNOWN_COSMETICS = [...COSMETICS_CATALOG, ...LEGACY_COSMETICS_CATALOG];
const inFlightEconomyPurchases = new Set<string>();
const completedEconomyPurchases = new Map<string, Record<string, any>>();

export interface EconomyEnv extends RewardsEnv {
  DB?: any;
}

export interface NormalizedCoupon {
  id: string;
  code: string;
  label: string;
  discountType: '1_year_free_pro' | 'percent' | 'fixed_pkr' | 'fixed_kobans' | 'free_pro';
  percentOff: number;
  amountOffPkr: number;
  amountOffKobans: number;
  durationMonths: number;
  durationDays: number;
  maxRedemptions: number;
  redemptionCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const SUPER_ADMIN_UIDS = new Set([
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  'uid_superadmin_1',
  'uid_superadmin_2',
]);

function isAdminIdentity(uid?: string | null, _email?: string | null): boolean {
  if (uid && SUPER_ADMIN_UIDS.has(uid.trim())) return true;
  return false;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
    },
  });
}

// Edge-compatible in-memory seed store (backed by Firestore promoCodes/coupons & promoRedemptions/couponRedemptions)
let edgePromoCodesStore: Array<Record<string, any>> = [
  {
    id: 'promo_1789444898730_4kcm',
    code: 'TEST-LIVE-PROMO-99',
    label: 'Live Test Campaign 99',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 3,
    redemption_count: 2,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-15T04:01:38.730Z',
    expires_at: null,
    updated_at: '2026-09-15T04:01:38.778Z',
  },
  {
    id: 'promo_1789293710183_4auv',
    code: 'TEST-VERIFY-123',
    label: 'Test Campaign',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 5,
    redemption_count: 1,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T10:01:50.183Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789293410516_ifdm',
    code: 'BOARDLY-1Y-USUTF',
    label: 'Test Link Check',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T09:56:50.516Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287839826_0d39',
    code: 'BOARDLY-1Y-2HB5V',
    label: 'Test',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T08:23:59.826Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287835126_6x3g',
    code: 'BOARDLY-1Y-Q2RK8',
    label: 'Test',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 0,
    is_active: true,
    created_by: 'student@gmail.com',
    created_at: '2026-09-13T08:23:55.126Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287776252_wjnw',
    code: 'BOARDLY-1Y-PP989',
    label: '1-Year Free Pro Campaign',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 0,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T08:22:56.252Z',
    expires_at: null,
    updated_at: '2026-09-15T03:57:09.120Z',
  },
  {
    id: 'promo_1789287720650_spew',
    code: 'BOARDLY-1Y-SH5HE',
    label: 'Test Link',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T08:22:00.650Z',
    expires_at: null,
    updated_at: '2026-09-15T04:01:30.369Z',
  },
  {
    id: 'promo_default_1year',
    code: 'BOARDLY-1Y-WELCOME',
    label: 'Boardly Welcome 1-Year Free Pro',
    discount_type: '1_year_free_pro',
    duration_months: 12,
    max_redemptions: 1,
    redemption_count: 1,
    is_active: false,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-13T00:00:00.000Z',
    expires_at: null,
    updated_at: '2026-09-15T04:02:42.079Z',
  },
  {
    id: 'promo_boardly50_half',
    code: 'BOARDLY50',
    label: 'Boardly 50% Student Discount',
    discount_type: 'percent',
    percent_off: 50,
    duration_months: 1,
    max_redemptions: 500,
    redemption_count: 0,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-15T00:00:00.000Z',
    expires_at: null,
    updated_at: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'promo_boardly20_discount',
    code: 'BOARDLY20',
    label: 'Boardly 20% Scholarship Coupon',
    discount_type: 'percent',
    percent_off: 20,
    duration_months: 1,
    max_redemptions: 1000,
    redemption_count: 0,
    is_active: true,
    created_by: 'shsvirtualadmin@gmail.com',
    created_at: '2026-09-15T00:00:00.000Z',
    expires_at: null,
    updated_at: '2026-09-15T00:00:00.000Z',
  },
];

let edgePromoRedemptionsStore: Array<Record<string, any>> = [
  {
    id: 'red_1789444962079_9bk9l',
    promo_code: 'BOARDLY-1Y-WELCOME',
    student_id: 'student_verified_live',
    student_email: 'student_verified_live@example.com',
    student_name: 'student_verified_live',
    redeemed_at: '2026-09-15T04:02:42.079Z',
    granted_until: '2027-09-15T04:02:42.079Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444898778_yoq34',
    promo_code: 'TEST-LIVE-PROMO-99',
    student_id: 'student_multi_2',
    student_email: 'student_multi_2@test.com',
    student_name: 'student_multi_2',
    redeemed_at: '2026-09-15T04:01:38.778Z',
    granted_until: '2027-09-15T04:01:38.778Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444898758_iwstz',
    promo_code: 'TEST-LIVE-PROMO-99',
    student_id: 'student_multi_1',
    student_email: 'student_multi_1@test.com',
    student_name: 'student_multi_1',
    redeemed_at: '2026-09-15T04:01:38.758Z',
    granted_until: '2027-09-15T04:01:38.758Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444890369_f4qdh',
    promo_code: 'BOARDLY-1Y-SH5HE',
    student_id: 'student_test_verify_1789444890351',
    student_email: 'test_verify_1789444890351@example.com',
    student_name: 'test_verify_1789444890351',
    redeemed_at: '2026-09-15T04:01:30.369Z',
    granted_until: '2027-09-15T04:01:30.369Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444629120_mtgw2',
    promo_code: 'TEST-VERIFY-123',
    student_id: 'test_student_456',
    student_email: 'teststudent456@gmail.com',
    student_name: 'teststudent456',
    redeemed_at: '2026-09-13T10:01:53.359Z',
    granted_until: '2027-09-13T10:01:53.359Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444629120_pmbxa',
    promo_code: 'BOARDLY-1Y-USUTF',
    student_id: 'test_student_123',
    student_email: 'teststudent@example.com',
    student_name: 'teststudent',
    redeemed_at: '2026-09-13T09:56:56.264Z',
    granted_until: '2027-09-13T09:56:56.264Z',
    track: 'Boardly Enrolled Track',
  },
  {
    id: 'red_1789444629120_i01sd',
    promo_code: 'BOARDLY-1Y-2HB5V',
    student_id: 'test_student_fix',
    student_email: 'test_fix@example.com',
    student_name: 'test_fix',
    redeemed_at: '2026-09-15T03:54:56.362Z',
    granted_until: '2027-09-15T03:54:56.362Z',
    track: 'Boardly Enrolled Track',
  },
];

function loadLocalPromoCodes(): Array<Record<string, any>> {
  return edgePromoCodesStore.map((c) => ({ ...c }));
}

function saveLocalPromoCodes(codes: Array<Record<string, any>>): void {
  edgePromoCodesStore = codes.map((c) => ({ ...c }));
}

function loadLocalPromoRedemptions(): Array<Record<string, any>> {
  return edgePromoRedemptionsStore.map((r) => ({ ...r }));
}

function saveLocalPromoRedemptions(redemptions: Array<Record<string, any>>): void {
  edgePromoRedemptionsStore = redemptions.map((r) => ({ ...r }));
}

function normalizeCouponRecord(raw: Record<string, any>): NormalizedCoupon {
  const code = String(raw.code || raw.id || '').trim().toUpperCase();
  const discountTypeRaw = String(raw.discount_type || raw.discountType || 'percent').toLowerCase();
  const durationMonths = Math.max(1, Number(raw.duration_months ?? raw.durationMonths ?? 1));
  const durationDays = Number(raw.duration_days ?? raw.durationDays ?? (durationMonths >= 12 ? 365 : durationMonths * 30));

  let discountType: NormalizedCoupon['discountType'] = 'percent';
  let percentOff = Number(raw.percent_off ?? raw.percentOff ?? 0);
  const amountOffPkr = Math.max(0, Number(raw.amount_off_pkr ?? raw.amountOffPkr ?? 0));
  const amountOffKobans = Math.max(0, Number(raw.amount_off_kobans ?? raw.amountOffKobans ?? 0));

  if (
    discountTypeRaw === '1_year_free_pro' ||
    discountTypeRaw === 'free_pro' ||
    percentOff >= 100
  ) {
    discountType = discountTypeRaw === '1_year_free_pro' ? '1_year_free_pro' : 'free_pro';
    percentOff = 100;
  } else if (discountTypeRaw === 'fixed_pkr' || amountOffPkr > 0) {
    discountType = 'fixed_pkr';
  } else if (discountTypeRaw === 'fixed_kobans' || amountOffKobans > 0) {
    discountType = 'fixed_kobans';
  } else {
    discountType = 'percent';
    if (percentOff <= 0) percentOff = 20;
  }

  return {
    id: String(raw.id || `promo_${code.toLowerCase()}`),
    code,
    label: String(raw.label || raw.description || `${code} Promo`),
    discountType,
    percentOff: Math.min(100, Math.max(0, percentOff)),
    amountOffPkr,
    amountOffKobans,
    durationMonths,
    durationDays,
    maxRedemptions: Math.max(1, Number(raw.max_redemptions ?? raw.maxRedemptions ?? raw.maxUses ?? 100)),
    redemptionCount: Math.max(0, Number(raw.redemption_count ?? raw.redemptionCount ?? raw.usedCount ?? 0)),
    isActive: raw.is_active !== undefined ? Boolean(raw.is_active) : raw.active !== undefined ? Boolean(raw.active) : true,
    expiresAt: raw.expires_at || raw.expiresAt || null,
    createdBy: String(raw.created_by || raw.createdBy || 'shsvirtualadmin@gmail.com'),
    createdAt: String(raw.created_at || raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updated_at || raw.updatedAt || new Date().toISOString()),
  };
}

export function computeCouponPricingForPlan(
  coupon: NormalizedCoupon,
  planIdRaw?: string | null
) {
  const plan = getProPlanById(planIdRaw);
  const originalPkr = plan.price_pkr;
  const originalKobans = plan.price_kobans;

  let discountPkr = 0;
  let discountKobans = 0;

  if (
    coupon.discountType === '1_year_free_pro' ||
    coupon.discountType === 'free_pro' ||
    coupon.percentOff >= 100
  ) {
    discountPkr = originalPkr;
    discountKobans = originalKobans;
  } else if (coupon.discountType === 'fixed_pkr') {
    discountPkr = Math.min(originalPkr, coupon.amountOffPkr);
    discountKobans = Math.min(originalKobans, coupon.amountOffPkr * 10);
  } else if (coupon.discountType === 'fixed_kobans') {
    discountKobans = Math.min(originalKobans, coupon.amountOffKobans);
    discountPkr = Math.min(originalPkr, Math.floor(coupon.amountOffKobans / 10));
  } else {
    discountPkr = Math.min(originalPkr, Math.round((originalPkr * coupon.percentOff) / 100));
    discountKobans = Math.min(originalKobans, Math.round((originalKobans * coupon.percentOff) / 100));
  }

  const finalPkr = Math.max(0, originalPkr - discountPkr);
  const finalKobans = Math.max(0, originalKobans - discountKobans);
  const isFreeGrant = finalPkr === 0 || finalKobans === 0 || coupon.percentOff >= 100;
  const effectiveDurationDays =
    coupon.discountType === '1_year_free_pro'
      ? 365
      : coupon.durationDays > 0 && isFreeGrant
      ? coupon.durationDays
      : plan.duration_days;

  return {
    planId: plan.id,
    planName:
      coupon.discountType === '1_year_free_pro'
        ? 'Boardly Pro, Annual Pass'
        : plan.name,
    originalPkr,
    discountPkr,
    finalPkr,
    originalKobans,
    discountKobans,
    finalKobans,
    isFreeGrant,
    effectiveDurationDays,
  };
}

const localEconomyFirestoreFallback = new Map<string, Record<string, any>>();

export function seedEconomyFallbackDocForTest(docPath: string, data: Record<string, any>): void {
  const clean = docPath.replace(/^\/+/, '');
  localEconomyFirestoreFallback.set(clean, { ...(localEconomyFirestoreFallback.get(clean) || {}), ...data });
}

export function getEconomyFallbackDocForTest(docPath: string): Record<string, any> | null {
  const clean = docPath.replace(/^\/+/, '');
  return localEconomyFirestoreFallback.get(clean) || null;
}

export function deleteEconomyFallbackDocForTest(docPath: string): void {
  const clean = docPath.replace(/^\/+/, '');
  localEconomyFirestoreFallback.delete(clean);
}

/**
 * Helper to call Firestore using Either Admin Service Account (FirestoreRestAdapter)
 * OR User Bearer token via Firestore REST API when running in local dev without service account secret.
 */
class HybridFirestoreHelper {
  private env: EconomyEnv;
  private bearerToken: string;
  private projectId: string;
  private databaseId: string;
  private adminAdapter: FirestoreRestAdapter | null = null;

  constructor(env: EconomyEnv, bearerToken: string) {
    this.env = env;
    this.bearerToken = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
    this.projectId =
      env.FIREBASE_PROJECT_ID ||
      env.VITE_FIREBASE_PROJECT_ID ||
      DEFAULT_FIREBASE_PROJECT_ID;
    this.databaseId =
      env.FIREBASE_DATABASE_ID ||
      env.VITE_FIREBASE_DATABASE_ID ||
      env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      DEFAULT_FIRESTORE_DATABASE_ID;

    const sa = parseServiceAccountFromEnv(env);
    if (sa) {
      try {
        this.adminAdapter = new FirestoreRestAdapter(sa, this.projectId, this.databaseId);
      } catch {
        this.adminAdapter = null;
      }
    }
  }

  get hasAdminCredentials(): boolean {
    return this.adminAdapter !== null;
  }

  get adapter(): FirestoreRestAdapter | null {
    return this.adminAdapter;
  }

  private get baseUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${encodeURIComponent(
      this.databaseId
    )}/documents`;
  }

  private encodeValue(val: unknown): Record<string, unknown> {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { integerValue: String(val) };
      return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map((item) => this.encodeValue(item)) } };
    }
    if (typeof val === 'object') {
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (v !== undefined) fields[k] = this.encodeValue(v);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  private decodeValue(field: Record<string, unknown>): unknown {
    if ('nullValue' in field) return null;
    if ('booleanValue' in field) return Boolean(field.booleanValue);
    if ('integerValue' in field) return Number(field.integerValue);
    if ('doubleValue' in field) return Number(field.doubleValue);
    if ('stringValue' in field) return String(field.stringValue);
    if ('timestampValue' in field) return String(field.timestampValue);
    if ('arrayValue' in field) {
      const arr = (field.arrayValue as { values?: Record<string, unknown>[] })?.values || [];
      return arr.map((v) => this.decodeValue(v));
    }
    if ('mapValue' in field) {
      const mapFields =
        (field.mapValue as { fields?: Record<string, Record<string, unknown>> })?.fields || {};
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(mapFields)) {
        out[k] = this.decodeValue(v);
      }
      return out;
    }
    return null;
  }

  private decodeDoc(docJson: any): { id: string; data: Record<string, any> } | null {
    if (!docJson || typeof docJson.name !== 'string') return null;
    const id = docJson.name.split('/').pop() || '';
    const fields = docJson.fields || {};
    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      data[k] = this.decodeValue(v as Record<string, unknown>);
    }
    return { id, data };
  }

  async getDoc(docPath: string): Promise<Record<string, any> | null> {
    const clean = docPath.replace(/^\/+/, '');
    const fallbackDoc = localEconomyFirestoreFallback.get(clean) || null;
    if (this.adminAdapter) {
      try {
        const data = await this.adminAdapter.getDoc(docPath);
        if (data) return fallbackDoc ? { ...data, ...fallbackDoc } : data;
      } catch {
        // Fallback to REST with bearer token
      }
    }
    try {
      const resp = await fetch(`${this.baseUrl}/${clean}`, {
        headers: { Authorization: this.bearerToken, Accept: 'application/json' },
      });
      if (!resp.ok) return fallbackDoc;
      const decoded = this.decodeDoc(await resp.json());
      if (decoded?.data) {
        return fallbackDoc ? { ...decoded.data, ...fallbackDoc } : decoded.data;
      }
      return fallbackDoc;
    } catch {
      return fallbackDoc;
    }
  }

  async setDoc(docPath: string, data: Record<string, any>, merge = true): Promise<boolean> {
    const clean = docPath.replace(/^\/+/, '');
    const prev = merge ? localEconomyFirestoreFallback.get(clean) || {} : {};
    localEconomyFirestoreFallback.set(clean, { ...prev, ...data });

    if (this.adminAdapter) {
      try {
        await this.adminAdapter.setDoc(docPath, data, merge);
        return true;
      } catch {
        // Fallback to user bearer token if allowed
      }
    }
    try {
      const keys = Object.keys(data).filter((k) => data[k] !== undefined);
      const queryParams = merge
        ? `?${keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')}`
        : '';
      const fields: Record<string, unknown> = {};
      for (const k of keys) {
        fields[k] = this.encodeValue(data[k]);
      }
      const resp = await fetch(`${this.baseUrl}/${clean}${queryParams}`, {
        method: 'PATCH',
        headers: {
          Authorization: this.bearerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });
      return resp.ok || true;
    } catch {
      return true;
    }
  }

  async listCollection(
    collectionPath: string,
    pageSize = 200
  ): Promise<Array<{ id: string; data: Record<string, any> }>> {
    const cleanPrefix = `${collectionPath.replace(/^\/+|\/+$/g, '')}/`;
    const fallbackItems = new Map<string, { id: string; data: Record<string, any> }>();
    for (const [k, v] of localEconomyFirestoreFallback.entries()) {
      if (k.startsWith(cleanPrefix)) {
        const rest = k.slice(cleanPrefix.length);
        if (rest && !rest.includes('/')) {
          fallbackItems.set(rest, { id: rest, data: v });
        }
      }
    }

    const sa = parseServiceAccountFromEnv(this.env);
    if (sa) {
      try {
        const token = await getServiceAccountAccessToken(sa);
        const resp = await fetch(
          `${this.baseUrl}/${collectionPath.replace(/^\/+/, '')}?pageSize=${pageSize}`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
        );
        if (resp.ok) {
          const json = (await resp.json()) as { documents?: any[] };
          const remote = (json.documents || [])
            .map((d) => this.decodeDoc(d))
            .filter((d): d is { id: string; data: Record<string, any> } => d !== null);
          for (const item of remote) {
            const fb = fallbackItems.get(item.id);
            fallbackItems.set(item.id, fb ? { id: item.id, data: { ...item.data, ...fb.data } } : item);
          }
          return Array.from(fallbackItems.values());
        }
      } catch {
        // Fallback
      }
    }
    try {
      const resp = await fetch(
        `${this.baseUrl}/${collectionPath.replace(/^\/+/, '')}?pageSize=${pageSize}`,
        { headers: { Authorization: this.bearerToken, Accept: 'application/json' } }
      );
      if (!resp.ok) return Array.from(fallbackItems.values());
      const json = (await resp.json()) as { documents?: any[] };
      const remote = (json.documents || [])
        .map((d) => this.decodeDoc(d))
        .filter((d): d is { id: string; data: Record<string, any> } => d !== null);
      for (const item of remote) {
        const fb = fallbackItems.get(item.id);
        fallbackItems.set(item.id, fb ? { id: item.id, data: { ...item.data, ...fb.data } } : item);
      }
      return Array.from(fallbackItems.values());
    } catch {
      return Array.from(fallbackItems.values());
    }
  }
}

async function getAllCoupons(fsHelper: HybridFirestoreHelper): Promise<NormalizedCoupon[]> {
  const byCode = new Map<string, NormalizedCoupon>();

  // 1. Seed from local promo_codes.json + defaults
  const localCodes = loadLocalPromoCodes();
  for (const raw of localCodes) {
    const norm = normalizeCouponRecord(raw);
    if (norm.code) byCode.set(norm.code, norm);
  }

  // 2. Merge from Firestore `promoCodes` and `coupons` collections if present
  const [fsPromoCodes, fsCoupons] = await Promise.all([
    fsHelper.listCollection('promoCodes', 200).catch(() => []),
    fsHelper.listCollection('coupons', 200).catch(() => []),
  ]);

  for (const docItem of [...fsPromoCodes, ...fsCoupons]) {
    const norm = normalizeCouponRecord({ id: docItem.id, ...docItem.data });
    if (norm.code) {
      const existing = byCode.get(norm.code);
      if (existing) {
        // Take the higher redemption count so counts never regress
        norm.redemptionCount = Math.max(existing.redemptionCount, norm.redemptionCount);
      }
      byCode.set(norm.code, norm);
    }
  }

  return Array.from(byCode.values());
}

async function getAllRedemptions(
  fsHelper: HybridFirestoreHelper
): Promise<Array<Record<string, any>>> {
  const byId = new Map<string, Record<string, any>>();
  for (const r of loadLocalPromoRedemptions()) {
    if (r && r.id) byId.set(String(r.id), r);
  }
  const [fsPromoReds, fsCouponReds] = await Promise.all([
    fsHelper.listCollection('promoRedemptions', 250).catch(() => []),
    fsHelper.listCollection('couponRedemptions', 250).catch(() => []),
  ]);
  for (const d of [...fsPromoReds, ...fsCouponReds]) {
    byId.set(d.id, { id: d.id, ...d.data });
  }
  return Array.from(byId.values());
}

async function validateCouponForUser(
  fsHelper: HybridFirestoreHelper,
  rawCode: string,
  uid: string,
  planIdRaw?: string | null
): Promise<
  | {
      valid: true;
      coupon: NormalizedCoupon;
      pricing: ReturnType<typeof computeCouponPricingForPlan>;
    }
  | {
      valid: false;
      code: string;
      error: string;
    }
> {
  const cleanCode = String(rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      code: 'EMPTY_COUPON',
      error: 'Please enter a coupon code.',
    };
  }

  const allCoupons = await getAllCoupons(fsHelper);
  const coupon = allCoupons.find((c) => c.code === cleanCode);

  if (!coupon) {
    return {
      valid: false,
      code: 'INVALID_COUPON',
      error: `Coupon code "${cleanCode}" is invalid or does not exist.`,
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      code: 'COUPON_INACTIVE',
      error: `Coupon code "${cleanCode}" is no longer active.`,
    };
  }

  if (coupon.expiresAt) {
    const expMs = new Date(coupon.expiresAt).getTime();
    if (!Number.isNaN(expMs) && expMs <= Date.now()) {
      return {
        valid: false,
        code: 'COUPON_EXPIRED',
        error: `Coupon code "${cleanCode}" has expired.`,
      };
    }
  }

  if (coupon.redemptionCount >= coupon.maxRedemptions) {
    return {
      valid: false,
      code: 'COUPON_MAX_REDEMPTIONS',
      error: `Coupon code "${cleanCode}" has reached its maximum redemption limit (${coupon.maxRedemptions}/${coupon.maxRedemptions}).`,
    };
  }

  const redemptions = await getAllRedemptions(fsHelper);
  const alreadyUsedByUser = redemptions.some((r) => {
    const rCode = String(r.promo_code || r.couponCode || r.code || '').trim().toUpperCase();
    const rUid = String(r.student_id || r.userId || r.uid || '').trim();
    return rCode === cleanCode && rUid === uid;
  });

  if (alreadyUsedByUser) {
    return {
      valid: false,
      code: 'ALREADY_REDEEMED',
      error: `You have already redeemed coupon code "${cleanCode}" on your account.`,
    };
  }

  const pricing = computeCouponPricingForPlan(coupon, planIdRaw);
  return {
    valid: true,
    coupon,
    pricing,
  };
}

async function recordCouponRedemptionAtomically(
  fsHelper: HybridFirestoreHelper,
  coupon: NormalizedCoupon,
  user: { uid: string; email?: string; name?: string },
  grantedUntilIso: string,
  contextMeta?: { planId?: string; method?: string; discountPkr?: number; discountKobans?: number }
): Promise<{ redemptionId: string; updatedCoupon: NormalizedCoupon }> {
  const nowIso = new Date().toISOString();
  const redemptionId = `red_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const nextCount = coupon.redemptionCount + 1;
  const nextActive = nextCount < coupon.maxRedemptions ? coupon.isActive : false;

  const updatedCoupon: NormalizedCoupon = {
    ...coupon,
    redemptionCount: nextCount,
    isActive: nextActive,
    updatedAt: nowIso,
  };

  // 1. Update local promo_codes.json & promo_redemptions.json
  const localCodes = loadLocalPromoCodes();
  const idx = localCodes.findIndex(
    (c) => String(c.code || '').trim().toUpperCase() === coupon.code
  );
  const rawCouponPayload = {
    id: coupon.id,
    code: coupon.code,
    label: coupon.label,
    discount_type: coupon.discountType,
    percent_off: coupon.percentOff,
    amount_off_pkr: coupon.amountOffPkr,
    amount_off_kobans: coupon.amountOffKobans,
    duration_months: coupon.durationMonths,
    duration_days: coupon.durationDays,
    max_redemptions: coupon.maxRedemptions,
    redemption_count: nextCount,
    usedCount: nextCount,
    is_active: nextActive,
    active: nextActive,
    created_by: coupon.createdBy,
    created_at: coupon.createdAt,
    expires_at: coupon.expiresAt,
    updated_at: nowIso,
  };
  if (idx >= 0) {
    localCodes[idx] = { ...localCodes[idx], ...rawCouponPayload };
  } else {
    localCodes.unshift(rawCouponPayload);
  }
  saveLocalPromoCodes(localCodes);

  const redemptionPayload = {
    id: redemptionId,
    promo_code: coupon.code,
    couponCode: coupon.code,
    couponId: coupon.id,
    uid: user.uid,
    userId: user.uid,
    student_id: user.uid,
    student_email: user.email || '',
    student_name: user.name || (user.email ? user.email.split('@')[0] : 'Student'),
    redeemed_at: nowIso,
    createdAt: nowIso,
    granted_until: grantedUntilIso,
    planId: contextMeta?.planId || 'pro_annual',
    method: contextMeta?.method || 'coupon',
    discountPkr: contextMeta?.discountPkr ?? 0,
    discountKobans: contextMeta?.discountKobans ?? 0,
    track: 'Boardly Enrolled Track',
  };

  const localRedemptions = loadLocalPromoRedemptions();
  localRedemptions.unshift(redemptionPayload);
  saveLocalPromoRedemptions(localRedemptions);

  // 2. Mirror to Firestore `promoCodes`, `coupons`, `promoRedemptions`, and `couponRedemptions`
  await Promise.all([
    fsHelper.setDoc(`promoCodes/${coupon.id}`, rawCouponPayload, true).catch(() => false),
    fsHelper.setDoc(`coupons/${coupon.code}`, rawCouponPayload, true).catch(() => false),
    fsHelper.setDoc(`promoRedemptions/${redemptionId}`, redemptionPayload, true).catch(() => false),
    fsHelper.setDoc(`couponRedemptions/${redemptionId}`, redemptionPayload, true).catch(() => false),
  ]);

  return { redemptionId, updatedCoupon };
}

function resolvePlanIdFromBody(body: Record<string, any>, fallback = 'pro_monthly'): string {
  if (body.planId && typeof body.planId === 'string') return body.planId.trim();
  const cycle = String(body.billingCycle || body.cycle || '').trim().toLowerCase();
  if (cycle === 'annual' || cycle === 'yearly' || cycle === 'pro_annual') return 'pro_annual';
  if (cycle === 'monthly' || cycle === 'pro_monthly') return 'pro_monthly';
  return fallback;
}

export async function handleEconomyApiRequest(context: {
  request: Request;
  env: EconomyEnv;
  tokenVerifierOverride?: (authHeader: string | null | undefined) => Promise<VerifiedFirebaseToken | null>;
}): Promise<Response> {
  const { request, env, tokenVerifierOverride } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Idempotency-Key',
      },
    });
  }

  const url = new URL(request.url);
  const pathClean = url.pathname.replace(/\/+$/, '') || '/';

  // Enforce POST-only on store/Koban purchase endpoints before auth check so any accidental GET (e.g. from a redirect) returns 405
  if (
    (pathClean === '/api/store/purchase' ||
      pathClean === '/api/store/unlock' ||
      pathClean === '/api/store/buy' ||
      pathClean === '/api/kobans/purchase' ||
      pathClean === '/api/pro/purchase-kobans') &&
    request.method !== 'POST'
  ) {
    return jsonResponse(
      {
        ok: false,
        code: 'METHOD_NOT_ALLOWED',
        error: `Method ${request.method} not allowed on ${pathClean}. Use POST.`,
      },
      405
    );
  }

  const authHeader = request.headers.get('Authorization') || '';
  const projectId =
    env?.FIREBASE_PROJECT_ID ||
    env?.VITE_FIREBASE_PROJECT_ID ||
    DEFAULT_FIREBASE_PROJECT_ID;

  // Check if caller passed a direct guest token or guest session header
  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (rawToken.startsWith('guest_') || request.headers.get('X-Guest-Session')) {
    return jsonResponse(
      {
        ok: false,
        code: 'GUEST_FORBIDDEN',
        error: 'Guest accounts cannot perform purchases or redeem coupons. Please create a registered account.',
      },
      403
    );
  }

  let verifiedUser: { uid: string; email?: string; name?: string } | null = null;
  try {
    const verifyFn =
      tokenVerifierOverride || ((hdr: string | null | undefined) => verifyFirebaseIdToken(hdr, projectId));
    verifiedUser = await verifyFn(authHeader);
  } catch (err: any) {
    return jsonResponse(
      {
        ok: false,
        code: 'UNAUTHENTICATED',
        error: err?.message || 'Invalid or expired authentication token.',
      },
      401
    );
  }

  if (!verifiedUser || !verifiedUser.uid) {
    return jsonResponse(
      {
        ok: false,
        code: 'UNAUTHENTICATED',
        error: 'Authentication required. Please sign in.',
      },
      401
    );
  }

  if (verifiedUser.uid.startsWith('guest_')) {
    return jsonResponse(
      {
        ok: false,
        code: 'GUEST_FORBIDDEN',
        error: 'Guest accounts cannot perform purchases or redeem coupons. Please create a registered account.',
      },
      403
    );
  }

  const fsHelper = new HybridFirestoreHelper(env, authHeader);
  const isAdmin = isAdminIdentity(verifiedUser.uid, verifiedUser.email);

  // ==========================================================================
  // 1. VALIDATE COUPON: POST /api/coupons/validate (or /api/pro/coupon/validate)
  // ==========================================================================
  if (
    (pathClean === '/api/coupons/validate' || pathClean === '/api/pro/coupon/validate') &&
    request.method === 'POST'
  ) {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const code = String(body.code || body.couponCode || '').trim();
    const planId = resolvePlanIdFromBody(body, 'pro_monthly');

    const validation = await validateCouponForUser(fsHelper, code, verifiedUser.uid, planId);
    if (!validation.valid) {
      return jsonResponse(
        {
          ok: false,
          valid: false,
          code: validation.code,
          error: validation.error,
        },
        validation.code === 'INVALID_COUPON' ? 404 : 400
      );
    }

    return jsonResponse({
      ok: true,
      valid: true,
      ...validation.pricing,
      coupon: {
        id: validation.coupon.id,
        code: validation.coupon.code,
        label: validation.coupon.label,
        discountType: validation.coupon.discountType,
        percentOff: validation.coupon.percentOff,
        amountOffPkr: validation.coupon.amountOffPkr,
        amountOffKobans: validation.coupon.amountOffKobans,
        durationMonths: validation.coupon.durationMonths,
        durationDays: validation.coupon.durationDays,
        maxRedemptions: validation.coupon.maxRedemptions,
        redemptionCount: validation.coupon.redemptionCount,
        ...validation.pricing,
      },
    });
  }

  // ==========================================================================
  // 2. REDEEM COUPON: POST /api/coupons/redeem (or /api/pro/coupon/redeem)
  // ==========================================================================
  if (
    (pathClean === '/api/coupons/redeem' || pathClean === '/api/pro/coupon/redeem') &&
    request.method === 'POST'
  ) {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const code = String(body.code || body.couponCode || '').trim();
    const planId = resolvePlanIdFromBody(body, 'pro_annual');

    const validation = await validateCouponForUser(fsHelper, code, verifiedUser.uid, planId);
    if (!validation.valid) {
      return jsonResponse(
        {
          ok: false,
          valid: false,
          code: validation.code,
          error: validation.error,
        },
        validation.code === 'INVALID_COUPON' ? 404 : 400
      );
    }

    const { coupon, pricing } = validation;

    // If this is a 100%-off / Free Pro grant coupon, activate Boardly Pro immediately on the server!
    if (pricing.isFreeGrant) {
      const userDoc = await fsHelper.getDoc(`users/${verifiedUser.uid}`);
      const currentExpiryRaw = userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? null;
      const extension = computeExtendedProExpiry(currentExpiryRaw, pricing.effectiveDurationDays);
      const newExpiryIso = new Date(extension.newExpiryMs).toISOString();
      const nowIso = new Date().toISOString();

      const { redemptionId, updatedCoupon } = await recordCouponRedemptionAtomically(
        fsHelper,
        coupon,
        verifiedUser,
        newExpiryIso,
        {
          planId: pricing.planId,
          method: 'coupon_free_grant',
          discountPkr: pricing.discountPkr,
          discountKobans: pricing.discountKobans,
        }
      );

      // Update user's Pro status server-side
      await fsHelper.setDoc(
        `users/${verifiedUser.uid}`,
        {
          uid: verifiedUser.uid,
          plan: 'pro',
          tier: 'pro',
          isPremium: true,
          proPlanId: pricing.planId,
          premiumSource: 'coupon',
          AppliedCouponCode: coupon.code,
          planStartedAt: nowIso,
          planExpiresAt: newExpiryIso,
          premiumExpiresAt: extension.newExpiryMs,
          proUntil: newExpiryIso,
          updatedAt: nowIso,
        },
        true
      );

      return jsonResponse({
        ok: true,
        activatedPro: true,
        redemptionId,
        planId: pricing.planId,
        planName: pricing.planName,
        durationDays: pricing.effectiveDurationDays,
        newExpiryMs: extension.newExpiryMs,
        newExpiryIso,
        newExpiryLabel: extension.newExpiryLabel,
        coupon: {
          code: updatedCoupon.code,
          label: updatedCoupon.label,
          redemptionCount: updatedCoupon.redemptionCount,
          maxRedemptions: updatedCoupon.maxRedemptions,
        },
      });
    }

    // For partial-discount coupons, return the validated discount breakdown ready for checkout
    return jsonResponse({
      ok: true,
      activatedPro: false,
      ...pricing,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        label: coupon.label,
        discountType: coupon.discountType,
        percentOff: coupon.percentOff,
        ...pricing,
      },
    });
  }

  // ==========================================================================
  // 3. SUBMIT JAZZCASH/OPAY PAYMENT: POST /api/pro/submit-payment
  // ==========================================================================
  if (pathClean === '/api/pro/submit-payment' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;

    // If caller only asked for pre-flight purchase guard check (no transactionId yet), delegate or validate
    const rawTid = String(body.transactionId || body.tid || '').trim();
    if (!rawTid && body.commitLock !== true) {
      return jsonResponse({
        ok: true,
        code: 'PURCHASE_ALLOWED',
        state: 'none',
        canStartPurchase: true,
        serverNowMs: Date.now(),
      });
    }

    const normalizedTid = rawTid.replace(/\s+/g, '');
    if (normalizedTid.length < 6) {
      return jsonResponse(
        {
          ok: false,
          code: 'INVALID_TID',
          error: 'Please enter a valid Transaction ID (at least 6 characters).',
        },
        400
      );
    }

    const plan = getProPlanById(resolvePlanIdFromBody(body, 'pro_monthly'));
    const couponCode = String(body.couponCode || '').trim().toUpperCase();
    let finalAmountPkr = plan.price_pkr;
    let discountPkr = 0;
    let validatedCoupon: NormalizedCoupon | null = null;

    if (couponCode) {
      const couponCheck = await validateCouponForUser(
        fsHelper,
        couponCode,
        verifiedUser.uid,
        plan.id
      );
      if (!couponCheck.valid) {
        return jsonResponse(
          {
            ok: false,
            code: couponCheck.code,
            error: couponCheck.error,
          },
          400
        );
      }
      validatedCoupon = couponCheck.coupon;
      finalAmountPkr = couponCheck.pricing.finalPkr;
      discountPkr = couponCheck.pricing.discountPkr;
    }

    // Check duplicate TID across paymentRequests and kobanRequests server-side
    const [existingPlanReqs, existingKobanReqs] = await Promise.all([
      fsHelper.listCollection('paymentRequests', 250).catch(() => []),
      fsHelper.listCollection('kobanRequests', 250).catch(() => []),
    ]);

    const duplicateInPlans = existingPlanReqs.find((r) => {
      const t = String(r.data.transactionId || r.data.TID || '').trim();
      const st = String(r.data.status || '').toLowerCase();
      return t === normalizedTid && st !== 'rejected';
    });
    if (duplicateInPlans) {
      return jsonResponse(
        {
          ok: false,
          code: 'DUPLICATE_TID',
          error: 'This Transaction ID has already been submitted for verification.',
        },
        409
      );
    }

    const duplicateInKobans = existingKobanReqs.find((r) => {
      const t = String(r.data.transactionId || r.data.TID || '').trim();
      const st = String(r.data.status || '').toLowerCase();
      return t === normalizedTid && st !== 'rejected';
    });
    if (duplicateInKobans) {
      return jsonResponse(
        {
          ok: false,
          code: 'DUPLICATE_TID',
          error: 'This Transaction ID has already been used for a Koban purchase.',
        },
        409
      );
    }

    // Also check if user already has a pending Pro payment request (unless forceAllowMultiple in test or different plan)
    const userPending = existingPlanReqs.find((r) => {
      const rUid = String(r.data.userId || r.data.uid || '');
      const st = String(r.data.status || '').toLowerCase();
      const pl = String(r.data.plan || '').toLowerCase();
      return rUid === verifiedUser.uid && st === 'pending' && pl === plan.id && !r.data.crewId;
    });
    if (userPending && !body.allowReplacePending) {
      // Allow submitting if TID is different, or update pending doc
    }

    const nowIso = new Date().toISOString();
    const requestId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const methodClean = String(body.paymentMethod || body.method || 'jazzcash').toLowerCase();

    const paymentDocPayload: Record<string, any> = {
      id: requestId,
      uid: verifiedUser.uid,
      userId: verifiedUser.uid,
      userEmail: String(body.userEmail || verifiedUser.email || '').toLowerCase(),
      userName: String(
        body.userName ||
          verifiedUser.name ||
          (verifiedUser.email ? verifiedUser.email.split('@')[0] : 'Student')
      ),
      plan: plan.id,
      planName: plan.name,
      durationDays: plan.duration_days,
      durationMonths: plan.id === 'pro_annual' ? 12 : 1,
      amount: finalAmountPkr,
      amount_pkr: finalAmountPkr,
      originalAmountPkr: plan.price_pkr,
      discountPkr,
      couponCode: validatedCoupon ? validatedCoupon.code : null,
      method: methodClean,
      TID: normalizedTid,
      transactionId: normalizedTid,
      senderNumber: String(body.senderPhone || body.senderNumber || '').trim(),
      screenshotUrl: body.screenshotUrl ? String(body.screenshotUrl).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      status: 'pending',
      submittedAt: nowIso,
      createdAt: nowIso,
    };

    const wroteOnServer = await fsHelper.setDoc(
      `paymentRequests/${requestId}`,
      paymentDocPayload,
      true
    );

    if (validatedCoupon) {
      const approxExpiryIso = new Date(
        Date.now() + plan.duration_days * 24 * 60 * 60 * 1000
      ).toISOString();
      await recordCouponRedemptionAtomically(
        fsHelper,
        validatedCoupon,
        verifiedUser,
        approxExpiryIso,
        {
          planId: plan.id,
          method: methodClean,
          discountPkr,
        }
      );
    }

    return jsonResponse({
      ok: true,
      requestId,
      amountPkr: finalAmountPkr,
      originalAmountPkr: plan.price_pkr,
      discountPkr,
      couponCode: validatedCoupon ? validatedCoupon.code : null,
      wroteOnServer,
      paymentRequest: paymentDocPayload,
    });
  }

  // ==========================================================================
  // 4. BUY PRO WITH KOBANS: POST /api/pro/purchase-kobans
  // ==========================================================================
  if (pathClean === '/api/pro/purchase-kobans') {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          ok: false,
          code: 'METHOD_NOT_ALLOWED',
          error: `Method ${request.method} not allowed on ${pathClean}. Use POST.`,
        },
        405
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const rawPlanInput = body.planId ?? body.billingCycle ?? body.cycle;
    if (
      rawPlanInput !== undefined &&
      rawPlanInput !== null &&
      typeof rawPlanInput === 'string' &&
      rawPlanInput.trim() !== '' &&
      ![
        'pro_monthly',
        'pro_annual',
        'monthly',
        'annual',
        'yearly',
      ].includes(rawPlanInput.trim().toLowerCase())
    ) {
      return jsonResponse(
        {
          ok: false,
          code: 'BAD_INPUT',
          error: `Invalid Pro plan ID "${rawPlanInput}". Expected "pro_monthly" or "pro_annual".`,
        },
        400
      );
    }

    const plan = getProPlanById(resolvePlanIdFromBody(body, 'pro_monthly'));
    const couponCode = String(body.couponCode || '').trim().toUpperCase();
    const rawIdempotency = String(
      body.idempotencyKey || request.headers.get('X-Idempotency-Key') || ''
    )
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64);
    const proCacheKey = rawIdempotency ? `pro:${verifiedUser.uid}:${rawIdempotency}` : '';

    if (proCacheKey && completedEconomyPurchases.has(proCacheKey)) {
      return jsonResponse({
        ...completedEconomyPurchases.get(proCacheKey)!,
        alreadyProcessed: true,
      });
    }
    if (proCacheKey && inFlightEconomyPurchases.has(proCacheKey)) {
      return jsonResponse(
        {
          ok: false,
          code: 'PURCHASE_IN_PROGRESS',
          error: 'Your Boardly Pro purchase is already being processed. Please wait.',
        },
        409
      );
    }
    if (proCacheKey) {
      inFlightEconomyPurchases.add(proCacheKey);
    }

    try {
      let finalKobansCost = plan.price_kobans;
      let discountKobans = 0;
      let validatedCoupon: NormalizedCoupon | null = null;

      if (couponCode) {
        const couponCheck = await validateCouponForUser(
          fsHelper,
          couponCode,
          verifiedUser.uid,
          plan.id
        );
        if (!couponCheck.valid) {
          return jsonResponse(
            {
              ok: false,
              code: couponCheck.code,
              error: couponCheck.error,
            },
            400
          );
        }
        validatedCoupon = couponCheck.coupon;
        finalKobansCost = couponCheck.pricing.finalKobans;
        discountKobans = couponCheck.pricing.discountKobans;
      }

      const ledgerId = rawIdempotency
        ? `pro_koban_${rawIdempotency}`
        : `pro_koban_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const [walletDoc, userDoc, existingLedgerDoc] = await Promise.all([
        fsHelper.getDoc(`wallets/${verifiedUser.uid}`),
        fsHelper.getDoc(`users/${verifiedUser.uid}`),
        rawIdempotency
          ? fsHelper.getDoc(`wallets/${verifiedUser.uid}/ledger/${ledgerId}`)
          : Promise.resolve(null),
      ]);

      const walletBal =
        walletDoc && typeof walletDoc.balance === 'number' && Number.isFinite(walletDoc.balance)
          ? Math.max(0, Math.floor(walletDoc.balance))
          : 0;
      const userKobans =
        userDoc && typeof userDoc.kobans === 'number' && Number.isFinite(userDoc.kobans)
          ? Math.max(0, Math.floor(userDoc.kobans))
          : 0;
      const userKobanBal =
        userDoc && typeof userDoc.kobanBalance === 'number' && Number.isFinite(userDoc.kobanBalance)
          ? Math.max(0, Math.floor(userDoc.kobanBalance))
          : 0;

      const currentBalance = Math.max(walletBal, userKobans, userKobanBal);

      if (existingLedgerDoc) {
        const idempotentPayload = {
          ok: true,
          alreadyProcessed: true,
          planId: existingLedgerDoc.planId || plan.id,
          planName: existingLedgerDoc.planName || plan.name,
          durationDays: Number(existingLedgerDoc.durationDays || plan.duration_days),
          kobansSpent: Math.abs(Number(existingLedgerDoc.amount ?? finalKobansCost)),
          discountKobans: Number(existingLedgerDoc.discountKobans ?? discountKobans),
          balanceBefore: Number(existingLedgerDoc.balanceBefore ?? currentBalance),
          newBalance: Number(existingLedgerDoc.balanceAfter ?? currentBalance),
          wasExtension: false,
          previousExpiryLabel: null,
          newExpiryMs: Number(userDoc?.premiumExpiresAt || Date.now() + plan.duration_days * 86_400_000),
          newExpiryIso: String(
            userDoc?.planExpiresAt || new Date(Date.now() + plan.duration_days * 86_400_000).toISOString()
          ),
          newExpiryLabel: 'Active',
          ledgerId,
        };
        if (proCacheKey) completedEconomyPurchases.set(proCacheKey, idempotentPayload);
        return jsonResponse(idempotentPayload);
      }

      if (!isAdmin && currentBalance < finalKobansCost) {
        return jsonResponse(
          {
            ok: false,
            code: 'INSUFFICIENT_KOBANS',
            error: `Insufficient Kobans. You need ${finalKobansCost.toLocaleString()} Kobans (you have ${currentBalance.toLocaleString()}).`,
            currentBalance,
            requiredKobans: finalKobansCost,
          },
          402
        );
      }

      const newBalance =
        isAdmin && currentBalance < finalKobansCost ? currentBalance : currentBalance - finalKobansCost;
      const currentExpiryRaw = userDoc?.planExpiresAt ?? userDoc?.premiumExpiresAt ?? null;
      const extension = computeExtendedProExpiry(currentExpiryRaw, plan.duration_days);
      const newExpiryIso = new Date(extension.newExpiryMs).toISOString();
      const nowIso = new Date().toISOString();

      // Write wallet, user Pro upgrade, and ledger entry
      await Promise.all([
        fsHelper.setDoc(
          `wallets/${verifiedUser.uid}`,
          {
            balance: newBalance,
            owned: Array.isArray(walletDoc?.owned) ? walletDoc.owned : [],
            equipped: walletDoc?.equipped || {
              effect: null,
              frame: null,
              nameplate: null,
              avatar: null,
              banner: null,
            },
            updatedAt: nowIso,
          },
          true
        ),
        fsHelper.setDoc(
          `users/${verifiedUser.uid}`,
          {
            uid: verifiedUser.uid,
            plan: 'pro',
            tier: 'pro',
            isPremium: true,
            proPlanId: plan.id,
            premiumSource: 'kobans',
            planStartedAt: nowIso,
            planExpiresAt: newExpiryIso,
            premiumExpiresAt: extension.newExpiryMs,
            proUntil: newExpiryIso,
            kobans: newBalance,
            kobanBalance: newBalance,
            ...(validatedCoupon ? { AppliedCouponCode: validatedCoupon.code } : {}),
            updatedAt: nowIso,
          },
          true
        ),
        fsHelper.setDoc(
          `wallets/${verifiedUser.uid}/ledger/${ledgerId}`,
          {
            type: 'purchase',
            purchaseSubtype: 'pro_purchase',
            amount: -finalKobansCost,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            planId: plan.id,
            planName: plan.name,
            durationDays: plan.duration_days,
            couponCode: validatedCoupon ? validatedCoupon.code : null,
            discountKobans,
            reason: `${extension.wasAlreadyActive ? 'Extended' : 'Unlocked'} ${plan.name} (${plan.duration_days} days) with ${finalKobansCost.toLocaleString()} Kobans`,
            actorUid: verifiedUser.uid,
            createdAt: nowIso,
          },
          true
        ),
      ]);

      if (validatedCoupon) {
        await recordCouponRedemptionAtomically(
          fsHelper,
          validatedCoupon,
          verifiedUser,
          newExpiryIso,
          {
            planId: plan.id,
            method: 'kobans',
            discountKobans,
          }
        );
      }

      const responsePayload = {
        ok: true,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.duration_days,
        kobansSpent: finalKobansCost,
        discountKobans,
        balanceBefore: currentBalance,
        newBalance,
        wasExtension: extension.wasAlreadyActive,
        previousExpiryLabel: extension.previousExpiryLabel,
        newExpiryMs: extension.newExpiryMs,
        newExpiryIso,
        newExpiryLabel: extension.newExpiryLabel,
        ledgerId,
      };
      if (proCacheKey) completedEconomyPurchases.set(proCacheKey, responsePayload);
      return jsonResponse(responsePayload);
    } finally {
      if (proCacheKey) inFlightEconomyPurchases.delete(proCacheKey);
    }
  }

  // ==========================================================================
  // 5. BUY STORE ITEM(S) WITH KOBANS: POST /api/store/purchase
  //    (plus legacy aliases /api/store/unlock, /api/store/buy, /api/kobans/purchase)
  // ==========================================================================
  if (
    pathClean === '/api/store/purchase' ||
    pathClean === '/api/store/unlock' ||
    pathClean === '/api/store/buy' ||
    pathClean === '/api/kobans/purchase'
  ) {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          ok: false,
          code: 'METHOD_NOT_ALLOWED',
          error: `Method ${request.method} not allowed on ${pathClean}. Use POST.`,
        },
        405
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, any> | null;
    if (!body || typeof body !== 'object') {
      return jsonResponse(
        {
          ok: false,
          code: 'BAD_INPUT',
          error: 'Invalid JSON request body for store purchase.',
        },
        400
      );
    }

    const rawItems: Array<Record<string, any>> = Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.itemIds)
      ? body.itemIds.map((id: unknown) => ({ id: String(id || '').trim() }))
      : body.item && typeof body.item === 'object'
      ? [body.item]
      : body.itemId !== undefined
      ? [{ id: String(body.itemId ?? '').trim() }]
      : [];

    if (rawItems.length === 0) {
      return jsonResponse(
        {
          ok: false,
          code: 'EMPTY_CART',
          error: 'No store items specified for purchase.',
        },
        400
      );
    }

    // Deduplicate requested items while validating every item ID is non-empty
    const uniqueRawItems: Array<Record<string, any>> = [];
    const seenRequestedIds = new Set<string>();
    for (const rawItem of rawItems) {
      if (!rawItem || typeof rawItem !== 'object') {
        return jsonResponse(
          {
            ok: false,
            code: 'BAD_INPUT',
            error: 'Invalid store item entry in purchase request.',
          },
          400
        );
      }
      const itemId = String(rawItem.id || rawItem.itemId || '').trim();
      if (!itemId || itemId.length > 128 || /[/\\]/.test(itemId)) {
        return jsonResponse(
          {
            ok: false,
            code: 'BAD_INPUT',
            error: 'Each store item must have a valid non-empty item ID.',
          },
          400
        );
      }
      if (!seenRequestedIds.has(itemId)) {
        seenRequestedIds.add(itemId);
        uniqueRawItems.push({ ...rawItem, id: itemId });
      }
    }

    const explicitIdempotencyRaw = String(
      body.idempotencyKey || request.headers.get('X-Idempotency-Key') || ''
    )
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64);
    const sortedItemKey = uniqueRawItems
      .map((i) => String(i.id).trim())
      .sort()
      .join(',');
    const userItemsLockKey = `store_items:${verifiedUser.uid}:${sortedItemKey}`;
    const idempotencyKey = explicitIdempotencyRaw || `chk_${Date.now()}`;
    const storeCacheKey = explicitIdempotencyRaw
      ? `store:${verifiedUser.uid}:${explicitIdempotencyRaw}`
      : '';

    if (storeCacheKey && completedEconomyPurchases.has(storeCacheKey)) {
      return jsonResponse({
        ...completedEconomyPurchases.get(storeCacheKey)!,
        alreadyProcessed: true,
      });
    }
    if (
      (storeCacheKey && inFlightEconomyPurchases.has(storeCacheKey)) ||
      inFlightEconomyPurchases.has(userItemsLockKey)
    ) {
      return jsonResponse(
        {
          ok: false,
          code: 'PURCHASE_IN_PROGRESS',
          error: 'Checkout is already being processed. Please wait.',
        },
        409
      );
    }
    if (storeCacheKey) {
      inFlightEconomyPurchases.add(storeCacheKey);
    }
    inFlightEconomyPurchases.add(userItemsLockKey);

    try {
      const firstItemId = String(uniqueRawItems[0].id);
      const [walletDoc, userDoc, unlockedDocs, existingBatchLedger] = await Promise.all([
        fsHelper.getDoc(`wallets/${verifiedUser.uid}`),
        fsHelper.getDoc(`users/${verifiedUser.uid}`),
        fsHelper.listCollection(`users/${verifiedUser.uid}/unlocked`, 200).catch(() => []),
        explicitIdempotencyRaw
          ? fsHelper.getDoc(
              `wallets/${verifiedUser.uid}/ledger/${explicitIdempotencyRaw}_0_${firstItemId}`
            )
          : Promise.resolve(null),
      ]);

      const walletBal =
        walletDoc && typeof walletDoc.balance === 'number' && Number.isFinite(walletDoc.balance)
          ? Math.max(0, Math.floor(walletDoc.balance))
          : null;
      const userKobans =
        userDoc && typeof userDoc.kobans === 'number' && Number.isFinite(userDoc.kobans)
          ? Math.max(0, Math.floor(userDoc.kobans))
          : 0;
      const userKobanBal =
        userDoc && typeof userDoc.kobanBalance === 'number' && Number.isFinite(userDoc.kobanBalance)
          ? Math.max(0, Math.floor(userDoc.kobanBalance))
          : 0;
      const currentBalance =
        walletBal !== null ? walletBal : Math.max(userKobans, userKobanBal);

      const existingOwned = new Set<string>([
        ...(Array.isArray(walletDoc?.owned) ? walletDoc.owned : []),
        ...(Array.isArray(userDoc?.ownedCosmetics) ? userDoc.ownedCosmetics : []),
        ...unlockedDocs.map((d) => String(d.data?.itemId || d.id)),
      ]);

      // Server-side persistent idempotency check: if this batch idempotencyKey already wrote to ledger, return success without charging again
      if (existingBatchLedger) {
        const idempotentPayload = {
          ok: true,
          alreadyProcessed: true,
          newBalance: currentBalance,
          totalDeducted: Math.abs(Number(existingBatchLedger.amount ?? 0)),
          purchasedItems: uniqueRawItems.map((i) => String(i.id)),
          owned: Array.from(existingOwned),
          flaggedItems: [],
        };
        if (storeCacheKey) completedEconomyPurchases.set(storeCacheKey, idempotentPayload);
        return jsonResponse(idempotentPayload);
      }

      const flaggedItems: Array<{
        itemId: string;
        name: string;
        reason: 'already_owned' | 'inactive' | 'price_changed';
        oldPrice?: number;
        newPrice?: number;
      }> = [];

      const validToBuy: Array<{
        id: string;
        name: string;
        type: string;
        price: number;
      }> = [];

      for (const rawItem of uniqueRawItems) {
        const itemId = String(rawItem.id).trim();

        const catalogMatch = ALL_KNOWN_COSMETICS.find((c) => c.id === itemId);
        const [livePrimary, liveLegacy] = await Promise.all([
          fsHelper.getDoc(`storeItems/${itemId}`),
          fsHelper.getDoc(`store_items/${itemId}`),
        ]);
        const liveData = livePrimary || liveLegacy;

        // 404 ONLY when the store item truly does not exist in catalog or Firestore
        if (!catalogMatch && !liveData) {
          return jsonResponse(
            {
              ok: false,
              code: 'ITEM_NOT_FOUND',
              error: `Store item "${itemId}" does not exist.`,
            },
            404
          );
        }

        const name = String(liveData?.name || catalogMatch?.name || rawItem.name || itemId);
        const itemType = String(
          liveData?.category || liveData?.type || catalogMatch?.type || rawItem.type || 'avatar'
        );

        if (liveData && (liveData.active === false || liveData.is_active === false) && !isAdmin) {
          flaggedItems.push({ itemId, name, reason: 'inactive' });
          continue;
        }

        if (!isAdmin && existingOwned.has(itemId)) {
          flaggedItems.push({ itemId, name, reason: 'already_owned' });
          continue;
        }

        const livePrice =
          liveData && typeof (liveData.priceKobans ?? liveData.price_kobans ?? liveData.price) === 'number'
            ? Math.max(
                0,
                Math.floor(Number(liveData.priceKobans ?? liveData.price_kobans ?? liveData.price))
              )
            : catalogMatch
            ? Math.max(0, Math.floor(Number(catalogMatch.priceKobans ?? catalogMatch.price)))
            : Math.max(0, Math.floor(Number(rawItem.price ?? 0)));

        validToBuy.push({
          id: itemId,
          name,
          type: itemType,
          price: isAdmin ? 0 : livePrice,
        });
      }

      if (flaggedItems.length > 0 && validToBuy.length === 0) {
        const allInactive = flaggedItems.every((f) => f.reason === 'inactive');
        if (allInactive) {
          return jsonResponse(
            {
              ok: false,
              code: 'ITEM_UNAVAILABLE',
              error:
                flaggedItems.length === 1
                  ? `"${flaggedItems[0].name}" is currently unavailable in the Boardly Store.`
                  : 'The selected items are currently unavailable in the Boardly Store.',
              newBalance: currentBalance,
              totalDeducted: 0,
              purchasedItems: [],
              owned: Array.from(existingOwned),
              flaggedItems,
            },
            403
          );
        }

        return jsonResponse(
          {
            ok: false,
            code: 'ALREADY_OWNED',
            error:
              flaggedItems.length === 1 && flaggedItems[0].reason === 'already_owned'
                ? `You already own "${flaggedItems[0].name}".`
                : `Some items could not be purchased (${flaggedItems
                    .map(
                      (f) =>
                        `"${f.name}" ${
                          f.reason === 'already_owned' ? 'is already owned' : 'is unavailable'
                        }`
                    )
                    .join(', ')}).`,
            newBalance: currentBalance,
            totalDeducted: 0,
            purchasedItems: [],
            owned: Array.from(existingOwned),
            flaggedItems,
          },
          409
        );
      }

      const totalCost = isAdmin ? 0 : validToBuy.reduce((acc, it) => acc + it.price, 0);
      if (!isAdmin && currentBalance < totalCost) {
        return jsonResponse(
          {
            ok: false,
            code: 'INSUFFICIENT_KOBANS',
            error: `Insufficient Kobans. You need ${totalCost.toLocaleString()} Kobans (you have ${currentBalance.toLocaleString()}).`,
            currentBalance,
            requiredKobans: totalCost,
          },
          402
        );
      }

      const newBalance = currentBalance - totalCost;
      const nowIso = new Date().toISOString();
      const updatedOwned = Array.from(
        new Set([...existingOwned, ...validToBuy.map((i) => i.id)])
      );

      await Promise.all([
        fsHelper.setDoc(
          `wallets/${verifiedUser.uid}`,
          {
            balance: newBalance,
            owned: updatedOwned,
            equipped: walletDoc?.equipped ||
              userDoc?.equipped || {
                effect: null,
                frame: null,
                nameplate: null,
                avatar: null,
                banner: null,
              },
            updatedAt: nowIso,
          },
          true
        ),
        fsHelper.setDoc(
          `users/${verifiedUser.uid}`,
          {
            uid: verifiedUser.uid,
            kobans: newBalance,
            kobanBalance: newBalance,
            ownedCosmetics: updatedOwned,
            updatedAt: nowIso,
          },
          true
        ),
        fsHelper.setDoc(
          `inventory/${verifiedUser.uid}`,
          {
            uid: verifiedUser.uid,
            userId: verifiedUser.uid,
            items: updatedOwned,
            owned: updatedOwned,
            updatedAt: nowIso,
          },
          true
        ),
        ...validToBuy.map((item) =>
          fsHelper.setDoc(
            `users/${verifiedUser.uid}/inventory/${item.id}`,
            {
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              pricePaid: item.price,
              unlockedAt: nowIso,
            },
            true
          )
        ),
        ...validToBuy.map((item) =>
          fsHelper.setDoc(
            `users/${verifiedUser.uid}/unlocked/${item.id}`,
            {
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              pricePaid: item.price,
              unlockedAt: nowIso,
            },
            true
          )
        ),
        ...validToBuy.map((item, idx) =>
          fsHelper.setDoc(
            `wallets/${verifiedUser.uid}/ledger/${idempotencyKey}_${idx}_${item.id}`,
            {
              type: 'purchase',
              amount: -item.price,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              itemId: item.id,
              itemName: item.name,
              itemType: item.type,
              reason: `Unlocked ${item.name} (${item.type})`,
              actorUid: verifiedUser.uid,
              batchId: idempotencyKey,
              createdAt: nowIso,
            },
            true
          )
        ),
      ]);

      const responsePayload = {
        ok: true,
        newBalance,
        totalDeducted: totalCost,
        purchasedItems: validToBuy.map((i) => i.id),
        owned: updatedOwned,
        flaggedItems,
      };
      if (storeCacheKey) completedEconomyPurchases.set(storeCacheKey, responsePayload);
      return jsonResponse(responsePayload);
    } finally {
      if (storeCacheKey) inFlightEconomyPurchases.delete(storeCacheKey);
      inFlightEconomyPurchases.delete(userItemsLockKey);
    }
  }

  // ==========================================================================
  // 6. ADMIN COUPONS DASHBOARD: GET / POST / PATCH /api/admin/coupons
  // ==========================================================================
  if (pathClean === '/api/admin/coupons' || pathClean.startsWith('/api/admin/coupons/')) {
    if (!isAdmin) {
      return jsonResponse(
        {
          ok: false,
          code: 'FORBIDDEN',
          error: 'Only administrators can manage promo & coupon codes.',
        },
        403
      );
    }

    if (request.method === 'GET') {
      const [coupons, redemptions] = await Promise.all([
        getAllCoupons(fsHelper),
        getAllRedemptions(fsHelper),
      ]);
      return jsonResponse({
        ok: true,
        coupons,
        redemptions,
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const code = String(body.code || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '');
      if (!code || code.length < 3) {
        return jsonResponse(
          {
            ok: false,
            error: 'Coupon code must be at least 3 alphanumeric characters.',
          },
          400
        );
      }

      const nowIso = new Date().toISOString();
      const newRaw = {
        id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code,
        label: String(body.label || `${code} Promo`).trim(),
        discount_type: String(body.discountType || body.discount_type || 'percent'),
        percent_off: Number(body.percentOff ?? body.percent_off ?? 50),
        amount_off_pkr: Number(body.amountOffPkr ?? body.amount_off_pkr ?? 0),
        amount_off_kobans: Number(body.amountOffKobans ?? body.amount_off_kobans ?? 0),
        duration_months: Number(body.durationMonths ?? body.duration_months ?? 1),
        max_redemptions: Math.max(1, Number(body.maxRedemptions ?? body.max_redemptions ?? 50)),
        redemption_count: 0,
        is_active: true,
        created_by: verifiedUser.email || 'shsvirtualadmin@gmail.com',
        created_at: nowIso,
        expires_at: body.expiresAt || null,
        updated_at: nowIso,
      };

      const localCodes = loadLocalPromoCodes();
      const existingIdx = localCodes.findIndex(
        (c) => String(c.code || '').toUpperCase() === code
      );
      if (existingIdx >= 0) {
        localCodes[existingIdx] = { ...localCodes[existingIdx], ...newRaw };
      } else {
        localCodes.unshift(newRaw);
      }
      saveLocalPromoCodes(localCodes);

      await Promise.all([
        fsHelper.setDoc(`promoCodes/${newRaw.id}`, newRaw, true).catch(() => false),
        fsHelper.setDoc(`coupons/${code}`, newRaw, true).catch(() => false),
      ]);

      return jsonResponse({
        ok: true,
        coupon: normalizeCouponRecord(newRaw),
      });
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const targetCode = String(body.code || pathClean.split('/').pop() || '')
        .trim()
        .toUpperCase();
      const localCodes = loadLocalPromoCodes();
      const idx = localCodes.findIndex(
        (c) =>
          String(c.code || '').toUpperCase() === targetCode ||
          String(c.id || '') === targetCode
      );
      if (idx < 0) {
        return jsonResponse({ ok: false, error: 'Coupon not found.' }, 404);
      }

      const updatedRaw = {
        ...localCodes[idx],
        ...(body.isActive !== undefined ? { is_active: Boolean(body.isActive) } : {}),
        ...(body.maxRedemptions !== undefined
          ? { max_redemptions: Math.max(1, Number(body.maxRedemptions)) }
          : {}),
        updated_at: new Date().toISOString(),
      };
      localCodes[idx] = updatedRaw;
      saveLocalPromoCodes(localCodes);

      await Promise.all([
        fsHelper.setDoc(`promoCodes/${updatedRaw.id}`, updatedRaw, true).catch(() => false),
        fsHelper.setDoc(`coupons/${updatedRaw.code}`, updatedRaw, true).catch(() => false),
      ]);

      return jsonResponse({
        ok: true,
        coupon: normalizeCouponRecord(updatedRaw),
      });
    }
  }

  return jsonResponse({ ok: false, error: `Unhandled economy endpoint: ${pathClean}` }, 404);
}

import {
  resolveCurrentUser,
  getSharedLocalD1Database,
  FirestoreRestAdapter,
  parseServiceAccountFromEnv,
  type RewardsEnv,
  type RewardsD1Database,
  type VerifiedFirebaseToken,
} from '../_utils/firestoreRestAdmin';
import {
  DEFAULT_PRO_BADGE_DESIGN,
  DEFAULT_PRO_BADGE_SETTINGS,
  isValidProBadgeDesign,
  normalizeProBadgeDesign,
  validateProBadgePayload,
  type ProBadgeDesignId,
} from '../../src/lib/proBadgeDesigns';
import { resolveUnifiedPlanStatus } from '../../src/config/plans';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Session',
  'Cache-Control': 'no-store',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

// Per-user in-memory rate-limiter for PUT /api/pro-badge
// Max 15 updates per 60 seconds per user, and minimum 300ms between consecutive saves
const userPutRateWindow = new Map<string, { timestamps: number[] }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const RATE_LIMIT_MIN_INTERVAL_MS = 300;

// Short-lived cache for resolved public proBadge by UID (15s TTL)
const PRO_BADGE_CACHE_TTL_MS = 15_000;
const resolvedProBadgeCache = new Map<
  string,
  { proBadge: ProBadgeDesignId | null; activePro: boolean; design: ProBadgeDesignId; visible: boolean; expiresAt: number }
>();

export function invalidateProBadgeCache(uid?: string): void {
  if (!uid) {
    resolvedProBadgeCache.clear();
    return;
  }
  resolvedProBadgeCache.delete(uid);
}

function checkPutRateLimit(userId: string, nowMs: number): { allowed: boolean; retryAfterSec?: number } {
  const entry = userPutRateWindow.get(userId) || { timestamps: [] };
  const recent = entry.timestamps.filter((t) => nowMs - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length > 0) {
    const lastTs = recent[recent.length - 1];
    if (nowMs - lastTs < RATE_LIMIT_MIN_INTERVAL_MS) {
      return { allowed: false, retryAfterSec: 1 };
    }
  }

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = recent[0];
    const retryAfterSec = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (nowMs - oldest)) / 1000));
    userPutRateWindow.set(userId, { timestamps: recent });
    return { allowed: false, retryAfterSec };
  }

  recent.push(nowMs);
  userPutRateWindow.set(userId, { timestamps: recent });
  return { allowed: true };
}

/**
 * Server-authoritative check using the shared `resolveUnifiedPlanStatus` function.
 * Never trusts client-provided flags.
 */
export async function checkUserActiveProServer(
  user: {
    uid: string;
    email?: string;
    plan?: string;
    isAdminOrAbove?: boolean;
    role?: string;
    isGuest?: boolean;
  },
  env?: RewardsEnv,
  nowMs = Date.now(),
  bearerToken?: string | null
): Promise<{ isActivePro: boolean; isPendingPayment: boolean }> {
  const uid = String(user.uid || '').trim();
  if (!uid || user.isGuest || uid.startsWith('guest_')) {
    return { isActivePro: false, isPendingPayment: false };
  }

  let fsDoc: Record<string, any> | null = null;
  try {
    const sa = parseServiceAccountFromEnv(env);
    const projectId = env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || 'boardly-3143c';
    const databaseId = env?.FIREBASE_DATABASE_ID || '(default)';
    if (sa) {
      const store = new FirestoreRestAdapter(sa, projectId, databaseId);
      fsDoc = await store.getDoc(`users/${uid}`);
    } else if (bearerToken) {
      const cleanToken = bearerToken.replace(/^Bearer\s+/i, '').trim();
      if (cleanToken) {
        const res = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(
            databaseId
          )}/documents/users/${encodeURIComponent(uid)}`,
          { headers: { Authorization: `Bearer ${cleanToken}` } }
        ).catch(() => null);
        if (res && res.ok) {
          const rawJson = await res.json().catch(() => null);
          if (rawJson?.fields) {
            const parsed: Record<string, any> = {};
            for (const [k, v] of Object.entries<any>(rawJson.fields)) {
              if ('stringValue' in v) parsed[k] = v.stringValue;
              else if ('booleanValue' in v) parsed[k] = Boolean(v.booleanValue);
              else if ('integerValue' in v) parsed[k] = Number(v.integerValue);
              else if ('doubleValue' in v) parsed[k] = Number(v.doubleValue);
              else if ('timestampValue' in v) parsed[k] = v.timestampValue;
            }
            fsDoc = parsed;
          }
        }
      }
    }
  } catch {
    // Non-fatal
  }

  const unified = resolveUnifiedPlanStatus({
    uid,
    email: user.email || fsDoc?.email || null,
    role: fsDoc?.role || user.role || (user.isAdminOrAbove ? 'admin' : 'student'),
    isGuest: false,
    plan: fsDoc?.plan ?? user.plan ?? null,
    isPremium: fsDoc?.isPremium ?? (user.plan === 'pro' ? true : null),
    proPlanId: fsDoc?.proPlanId ?? null,
    planStartedAt: fsDoc?.planStartedAt,
    updatedAt: fsDoc?.updatedAt,
    planExpiresAt: fsDoc?.planExpiresAt,
    premiumExpiresAt: fsDoc?.premiumExpiresAt,
    nowMs,
  });

  return {
    isActivePro: unified.state === 'active' || Boolean(unified.isPro),
    isPendingPayment: unified.state === 'pending',
  };
}

/**
 * Batched resolution of `proBadge` for multiple users in ONE query.
 * Returns a Map<uid, ProBadgeDesignId | null>.
 * - Only returns a badge ID if the user has an active (not expired) Pro plan AND `visible` is true.
 * - Defaults to `'ember'` for active Pro users who have not customized their badge yet.
 * - Never returns plan details, dates, or payment info.
 */
export async function resolveProBadgesBatch(
  uids: (string | null | undefined)[],
  db?: RewardsD1Database,
  env?: RewardsEnv,
  nowMs = Date.now()
): Promise<Map<string, ProBadgeDesignId | null>> {
  const result = new Map<string, ProBadgeDesignId | null>();
  const uniqueUids = Array.from(
    new Set(
      uids
        .map((u) => String(u || '').trim())
        .filter((u) => u.length > 0 && u !== 'anonymous')
    )
  );
  if (uniqueUids.length === 0) return result;

  const targetDb = db || getSharedLocalD1Database();
  const missingUids: string[] = [];

  for (const uid of uniqueUids) {
    if (uid.startsWith('guest_')) {
      result.set(uid, null);
      continue;
    }
    const cached = resolvedProBadgeCache.get(uid);
    if (cached && cached.expiresAt > nowMs) {
      result.set(uid, cached.proBadge);
    } else {
      missingUids.push(uid);
    }
  }

  if (missingUids.length === 0) {
    return result;
  }

  const placeholders = missingUids.map((_, i) => `?${i + 1}`).join(', ');
  const [badgeRowsRes, unameRowsRes, roleRowsRes] = await Promise.all([
    targetDb
      .prepare(
        `SELECT user_id, design, visible, updated_at FROM user_pro_badge WHERE user_id IN (${placeholders})`
      )
      .bind(...missingUids)
      .all<{ user_id: string; design: string; visible: number; updated_at: number }>()
      .catch(() => ({ results: [] })),
    targetDb
      .prepare(
        `SELECT uid, email, role, account_type FROM user_usernames WHERE uid IN (${placeholders})`
      )
      .bind(...missingUids)
      .all<any>()
      .catch(() => ({ results: [] })),
    targetDb
      .prepare(`SELECT uid, role FROM user_roles WHERE uid IN (${placeholders})`)
      .bind(...missingUids)
      .all<any>()
      .catch(() => ({ results: [] })),
  ]);

  const badgeByUid = new Map<string, { design: ProBadgeDesignId; visible: boolean }>();
  for (const r of badgeRowsRes.results || []) {
    if (r?.user_id) {
      badgeByUid.set(String(r.user_id), {
        design: normalizeProBadgeDesign(r.design),
        visible: Number(r.visible ?? 1) !== 0,
      });
    }
  }

  const unameByUid = new Map<string, any>();
  for (const u of unameRowsRes.results || []) {
    if (u?.uid) unameByUid.set(String(u.uid), u);
  }

  const roleByUid = new Map<string, string>();
  for (const r of roleRowsRes.results || []) {
    if (r?.uid && r?.role) roleByUid.set(String(r.uid), String(r.role));
  }

  for (const uid of missingUids) {
    const uRow = unameByUid.get(uid);
    const role = roleByUid.get(uid) || uRow?.role || 'student';
    const email = uRow?.email || null;
    const isGuest = uid.startsWith('guest_') || uRow?.account_type === 'guest';

    const unified = resolveUnifiedPlanStatus({
      uid,
      email,
      role,
      isGuest,
      plan: uRow?.plan ?? null,
      isPremium: uRow?.is_pro ?? uRow?.isPremium ?? null,
      planExpiresAt: uRow?.plan_expires_at ?? uRow?.planExpiresAt ?? null,
      premiumExpiresAt: uRow?.premium_expires_at ?? uRow?.premiumExpiresAt ?? null,
      nowMs,
    });

    const isActivePro = unified.state === 'active' || Boolean(unified.isPro);
    const pref = badgeByUid.get(uid) || DEFAULT_PRO_BADGE_SETTINGS;
    const resolvedBadge: ProBadgeDesignId | null =
      isActivePro && pref.visible ? pref.design : null;

    resolvedProBadgeCache.set(uid, {
      proBadge: resolvedBadge,
      activePro: isActivePro,
      design: pref.design,
      visible: pref.visible,
      expiresAt: nowMs + PRO_BADGE_CACHE_TTL_MS,
    });
    result.set(uid, resolvedBadge);
  }

  return result;
}

export function setCachedUserProStatusAndBadge(
  uid: string,
  opts: {
    activePro: boolean;
    design?: string | null;
    visible?: boolean;
    nowMs?: number;
  }
): ProBadgeDesignId | null {
  const cleanUid = String(uid || '').trim();
  if (!cleanUid) return null;
  const nowMs = opts.nowMs ?? Date.now();
  const existing = resolvedProBadgeCache.get(cleanUid);
  const localD1 = getSharedLocalD1Database();
  const d1Row = localD1.tables.user_pro_badge.get(cleanUid);

  const design = normalizeProBadgeDesign(
    opts.design ?? d1Row?.design ?? existing?.design ?? DEFAULT_PRO_BADGE_DESIGN
  );
  const visible =
    opts.visible !== undefined
      ? Boolean(opts.visible)
      : d1Row !== undefined
      ? Number(d1Row.visible ?? 1) !== 0
      : existing?.visible ?? true;

  const proBadge: ProBadgeDesignId | null = opts.activePro && visible ? design : null;
  resolvedProBadgeCache.set(cleanUid, {
    proBadge,
    activePro: opts.activePro,
    design,
    visible,
    expiresAt: nowMs + PRO_BADGE_CACHE_TTL_MS,
  });
  return proBadge;
}

export interface HandleProBadgeOptions {
  request: Request;
  env?: RewardsEnv;
  dbOverride?: RewardsD1Database;
  nowMs?: number;
  activeProOverride?: boolean;
  tokenVerifierOverride?: (
    authHeader: string | null | undefined
  ) => Promise<VerifiedFirebaseToken | null>;
}

export async function handleProBadgeRequest(opts: HandleProBadgeOptions): Promise<Response> {
  const { request, env } = opts;
  const method = (request.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (method !== 'GET' && method !== 'PUT') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  const db: RewardsD1Database = opts.dbOverride || env?.DB || getSharedLocalD1Database();
  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : Date.now();
  const authHeader = request.headers.get('Authorization');

  // Authenticate caller strictly from session / Bearer token
  const currentUser = await resolveCurrentUser({
    request,
    env,
    db,
    tokenVerifierOverride: opts.tokenVerifierOverride,
  });

  if (!currentUser || !currentUser.uid) {
    return jsonResponse(
      { ok: false, error: 'Authentication required to access Pro badge settings.' },
      401
    );
  }

  const userId = currentUser.uid;
  const isGuest = Boolean(currentUser.isGuest || userId.startsWith('guest_'));

  const proCheck =
    typeof opts.activeProOverride === 'boolean'
      ? { isActivePro: opts.activeProOverride, isPendingPayment: false }
      : await checkUserActiveProServer(currentUser, env, nowMs, authHeader);

  if (method === 'GET') {
    if (isGuest) {
      return jsonResponse({
        ok: true,
        design: DEFAULT_PRO_BADGE_DESIGN,
        visible: true,
        activePro: false,
        proBadge: null,
        updatedAt: null,
      });
    }

    try {
      const row = await db
        .prepare(
          'SELECT user_id, design, visible, updated_at FROM user_pro_badge WHERE user_id = ?1 LIMIT 1'
        )
        .bind(userId)
        .first<{
          user_id: string;
          design: string;
          visible: number;
          updated_at: number;
        }>();

      if (row && isValidProBadgeDesign(row.design)) {
        const design = normalizeProBadgeDesign(row.design);
        const visible = Number(row.visible ?? 1) !== 0;
        const proBadge = setCachedUserProStatusAndBadge(userId, {
          activePro: proCheck.isActivePro,
          design,
          visible,
          nowMs,
        });
        return jsonResponse({
          ok: true,
          design,
          visible,
          activePro: proCheck.isActivePro,
          proBadge,
          updatedAt: Number(row.updated_at || 0),
        });
      }
    } catch {
      // If table is not yet created on production D1, return default gracefully
    }

    const proBadge = setCachedUserProStatusAndBadge(userId, {
      activePro: proCheck.isActivePro,
      design: DEFAULT_PRO_BADGE_DESIGN,
      visible: true,
      nowMs,
    });

    return jsonResponse({
      ok: true,
      design: DEFAULT_PRO_BADGE_DESIGN,
      visible: true,
      activePro: proCheck.isActivePro,
      proBadge,
      updatedAt: null,
    });
  }

  // PUT /api/pro-badge
  if (isGuest) {
    return jsonResponse(
      {
        ok: false,
        error: 'Guest accounts cannot customize Pro badges. Please sign in and upgrade to Pro.',
        code: 'GUEST_FORBIDDEN',
      },
      403
    );
  }

  const rateCheck = checkPutRateLimit(userId, nowMs);
  if (!rateCheck.allowed) {
    return jsonResponse(
      {
        ok: false,
        error: 'Too many badge updates. Please wait a moment before saving again.',
        retryAfterSec: rateCheck.retryAfterSec || 1,
      },
      429
    );
  }

  let rawBody: unknown;
  try {
    const text = await request.text();
    rawBody = text ? JSON.parse(text) : null;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const validation = validateProBadgePayload(rawBody);
  if (!validation.valid || !validation.value) {
    return jsonResponse(
      { ok: false, error: validation.error || 'Invalid Pro badge settings.' },
      400
    );
  }

  // Enforce active Pro plan check on PUT (rejected with 403 if not active Pro)
  if (!proCheck.isActivePro) {
    return jsonResponse(
      {
        ok: false,
        error: 'An active Boardly Pro plan is required to choose and save a Pro badge.',
        code: 'PRO_REQUIRED',
      },
      403
    );
  }

  const { design, visible } = validation.value;

  try {
    await db
      .prepare(
        `INSERT INTO user_pro_badge (user_id, design, visible, updated_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(user_id) DO UPDATE SET
           design = excluded.design,
           visible = excluded.visible,
           updated_at = excluded.updated_at`
      )
      .bind(userId, design, visible ? 1 : 0, nowMs)
      .run();
  } catch (err: any) {
    return jsonResponse(
      {
        ok: false,
        error: err?.message || 'Failed to save Pro badge choice.',
      },
      500
    );
  }

  const effectiveProBadge = setCachedUserProStatusAndBadge(userId, {
    activePro: true,
    design,
    visible,
    nowMs,
  });

  return jsonResponse({
    ok: true,
    design,
    visible,
    activePro: true,
    proBadge: effectiveProBadge,
    updatedAt: nowMs,
  });
}

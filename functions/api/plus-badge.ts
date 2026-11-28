import {
  resolveCurrentUser,
  getSharedLocalD1Database,
  FirestoreRestAdapter,
  parseServiceAccountFromEnv,
  resolveConfiguredOwnerEmail,
  type RewardsEnv,
  type RewardsD1Database,
  type VerifiedFirebaseToken,
} from '../_utils/firestoreRestAdmin';
import {
  DEFAULT_PLUS_BADGE_SETTINGS,
  isValidPlusBadgeId,
  resolvePlusBadgeId,
  validatePlusBadgePayload,
} from '../../src/lib/plusBadgeDesigns';
import { resolveUnifiedPlanStatus } from '../../src/config/plans';
import type { PlanTier } from '../../src/lib/planTier';

function buildCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('Origin')?.trim() || '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Session',
    'Cache-Control': 'no-store',
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  request?: Request
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

// Per-user in-memory rate-limiter for PUT /api/plus-badge
// Max 15 updates per 60 seconds per user, and minimum 300ms between consecutive saves
const userPutRateWindow = new Map<string, { timestamps: number[] }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const RATE_LIMIT_MIN_INTERVAL_MS = 300;

// Short-lived cache for resolved public plusBadge by UID (15s TTL)
const PLUS_BADGE_CACHE_TTL_MS = 15_000;
const resolvedPlusBadgeCache = new Map<
  string,
  {
    plusBadge: number | null;
    activePlus: boolean;
    plus_badge_design: number | null;
    plus_badge_visible: boolean;
    expiresAt: number;
  }
>();

export function invalidatePlusBadgeCache(uid?: string): void {
  if (!uid) {
    resolvedPlusBadgeCache.clear();
    return;
  }
  resolvedPlusBadgeCache.delete(uid);
}

function checkPutRateLimit(
  userId: string,
  nowMs: number
): { allowed: boolean; retryAfterSec?: number } {
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
    const retryAfterSec = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (nowMs - oldest)) / 1000)
    );
    userPutRateWindow.set(userId, { timestamps: recent });
    return { allowed: false, retryAfterSec };
  }

  recent.push(nowMs);
  userPutRateWindow.set(userId, { timestamps: recent });
  return { allowed: true };
}

const ensuredPlusBadgeDbs = new WeakSet<object>();

async function ensureUserPlusBadgeTable(db: RewardsD1Database): Promise<void> {
  if (db && typeof db === 'object' && ensuredPlusBadgeDbs.has(db)) {
    return;
  }
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS user_plus_badge (
          user_id TEXT PRIMARY KEY,
          plus_badge_design INTEGER CHECK (plus_badge_design IS NULL OR (plus_badge_design >= 1 AND plus_badge_design <= 50)),
          plus_badge_visible INTEGER NOT NULL DEFAULT 1 CHECK (plus_badge_visible IN (0, 1)),
          updated_at INTEGER NOT NULL
        )`
      )
      .run();
    if (db && typeof db === 'object') {
      ensuredPlusBadgeDbs.add(db);
    }
  } catch {
    // Local in-memory D1 mock already defines user_plus_badge
  }
}

/**
 * Server-authoritative PLUS plan check using `resolveUnifiedPlanStatus`.
 * Never trusts client-provided flags.
 */
export async function checkUserActivePlusServer(
  user: {
    uid: string;
    email?: string;
    plan?: string;
    isSuperAdmin?: boolean;
    isAdminOrAbove?: boolean;
    role?: string;
    isGuest?: boolean;
  },
  env?: RewardsEnv,
  nowMs = Date.now(),
  bearerToken?: string | null
): Promise<{
  isActivePlus: boolean;
  planTier: PlanTier;
  isPendingPayment: boolean;
  firestoreDesign: number | null | undefined;
  firestoreVisible: boolean | undefined;
}> {
  const uid = String(user.uid || '').trim();
  if (!uid || user.isGuest || uid.startsWith('guest_')) {
    return {
      isActivePlus: false,
      planTier: 'free',
      isPendingPayment: false,
      firestoreDesign: undefined,
      firestoreVisible: undefined,
    };
  }

  let fsDoc: Record<string, any> | null = null;
  try {
    const sa = parseServiceAccountFromEnv(env);
    const projectId =
      env?.FIREBASE_PROJECT_ID ||
      env?.VITE_FIREBASE_PROJECT_ID ||
      'gen-lang-client-0365509316';
    const configuredDb =
      env?.FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      '';
    const dbCandidates = Array.from(
      new Set(
        [
          configuredDb,
          'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712',
          '(default)',
        ].filter(Boolean)
      )
    );

    if (sa) {
      for (const dbId of dbCandidates) {
        const store = new FirestoreRestAdapter(sa, projectId, dbId);
        const doc = await store.getDoc(`users/${uid}`).catch(() => null);
        if (doc) {
          fsDoc = doc;
          break;
        }
      }
    } else if (bearerToken) {
      const cleanToken = bearerToken.replace(/^Bearer\s+/i, '').trim();
      if (cleanToken) {
        for (const dbId of dbCandidates) {
          const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
              projectId
            )}/databases/${encodeURIComponent(dbId)}/documents/users/${encodeURIComponent(uid)}`,
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
                else if ('nullValue' in v) parsed[k] = null;
              }
              fsDoc = parsed;
              break;
            }
          }
        }
      }
    }
  } catch {
    // Non-fatal
  }

  const isSuperAdmin = Boolean(user.isSuperAdmin === true);

  const unified = resolveUnifiedPlanStatus({
    uid,
    email: user.email || fsDoc?.email || null,
    role: fsDoc?.role || user.role || (isSuperAdmin ? 'superadmin' : user.isAdminOrAbove ? 'admin' : 'student'),
    isSuperAdmin,
    isGuest: false,
    plan: fsDoc?.plan ?? user.plan ?? null,
    planTier: fsDoc?.planTier ?? null,
    isPremium: fsDoc?.isPremium ?? (user.plan === 'pro' || user.plan === 'plus' ? true : null),
    isPro: fsDoc?.isPro ?? null,
    isPlus: fsDoc?.isPlus ?? (user.plan === 'plus' ? true : null),
    proPlanId: fsDoc?.proPlanId ?? null,
    plusPlanId: fsDoc?.plusPlanId ?? null,
    planStartedAt: fsDoc?.planStartedAt,
    updatedAt: fsDoc?.updatedAt,
    planExpiresAt: fsDoc?.planExpiresAt,
    premiumExpiresAt: fsDoc?.premiumExpiresAt,
    proUntil: fsDoc?.proUntil,
    plusUntil: fsDoc?.plusUntil,
    nowMs,
  });

  let firestoreDesign: number | null | undefined = undefined;
  if (fsDoc && Object.prototype.hasOwnProperty.call(fsDoc, 'plus_badge_design')) {
    firestoreDesign =
      fsDoc.plus_badge_design === null ? null : resolvePlusBadgeId(fsDoc.plus_badge_design);
  } else if (fsDoc && Object.prototype.hasOwnProperty.call(fsDoc, 'plus_badge_id')) {
    firestoreDesign =
      fsDoc.plus_badge_id === null ? null : resolvePlusBadgeId(fsDoc.plus_badge_id);
  }

  const firestoreVisible: boolean | undefined =
    fsDoc && typeof fsDoc.plus_badge_visible === 'boolean'
      ? fsDoc.plus_badge_visible
      : undefined;

  return {
    isActivePlus: Boolean(unified.isPlus) && unified.state === 'active',
    planTier: unified.planTier,
    isPendingPayment: unified.state === 'pending',
    firestoreDesign,
    firestoreVisible,
  };
}

/**
 * Batched resolution of independent `plusBadge` (integer 1..50 | null) for multiple users in ONE query.
 * Reads ONLY from `user_plus_badge` (never from `user_pro_badge`).
 */
export async function resolvePlusBadgesBatch(
  uids: (string | null | undefined)[],
  db?: RewardsD1Database,
  _env?: RewardsEnv,
  nowMs = Date.now()
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
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
    const cached = resolvedPlusBadgeCache.get(uid);
    if (cached && cached.expiresAt > nowMs) {
      result.set(uid, cached.plusBadge);
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
        `SELECT user_id, plus_badge_design, plus_badge_visible, updated_at FROM user_plus_badge WHERE user_id IN (${placeholders})`
      )
      .bind(...missingUids)
      .all<{
        user_id: string;
        plus_badge_design: number | null;
        plus_badge_visible: number;
        updated_at: number;
      }>()
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

  const badgeByUid = new Map<string, { design: number | null; visible: boolean }>();
  for (const r of badgeRowsRes.results || []) {
    if (r?.user_id) {
      const parsedDesign =
        r.plus_badge_design === null || r.plus_badge_design === undefined
          ? null
          : isValidPlusBadgeId(Number(r.plus_badge_design))
          ? Number(r.plus_badge_design)
          : null;
      badgeByUid.set(String(r.user_id), {
        design: parsedDesign,
        visible: Number(r.plus_badge_visible ?? 1) !== 0,
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

  const ownerEmail = resolveConfiguredOwnerEmail(env as any);

  for (const uid of missingUids) {
    const uRow = unameByUid.get(uid);
    const role = roleByUid.get(uid) || uRow?.role || 'student';
    const email = uRow?.email || null;
    const isGuest = uid.startsWith('guest_') || uRow?.account_type === 'guest';
    const isSuperAdmin =
      !isGuest &&
      (String(role || '').toLowerCase() === 'superadmin' ||
        (Boolean(email) && String(email).trim().toLowerCase() === ownerEmail));

    const unified = resolveUnifiedPlanStatus({
      uid,
      email,
      role,
      isSuperAdmin,
      isGuest,
      plan: uRow?.plan ?? null,
      planTier: uRow?.plan_tier ?? uRow?.planTier ?? null,
      isPremium: uRow?.is_pro ?? uRow?.isPremium ?? null,
      isPlus: uRow?.is_plus ?? uRow?.isPlus ?? null,
      planExpiresAt: uRow?.plan_expires_at ?? uRow?.planExpiresAt ?? null,
      premiumExpiresAt: uRow?.premium_expires_at ?? uRow?.premiumExpiresAt ?? null,
      proUntil: uRow?.pro_until ?? uRow?.proUntil ?? null,
      plusUntil: uRow?.plus_until ?? uRow?.plusUntil ?? null,
      nowMs,
    });

    const activePlus = Boolean(unified.isPlus) && unified.state === 'active';
    const pref = badgeByUid.get(uid);
    const design = pref ? pref.design : null;
    const visible = pref ? pref.visible : DEFAULT_PLUS_BADGE_SETTINGS.plus_badge_visible;
    const resolvedBadge: number | null = activePlus && visible ? design : null;

    resolvedPlusBadgeCache.set(uid, {
      plusBadge: resolvedBadge,
      activePlus,
      plus_badge_design: design,
      plus_badge_visible: visible,
      expiresAt: nowMs + PLUS_BADGE_CACHE_TTL_MS,
    });
    result.set(uid, resolvedBadge);
  }

  return result;
}

export function setCachedUserPlusBadge(
  uid: string,
  opts: {
    activePlus: boolean;
    plus_badge_design?: number | null;
    plus_badge_visible?: boolean;
    nowMs?: number;
  }
): number | null {
  const cleanUid = String(uid || '').trim();
  if (!cleanUid) return null;
  const nowMs = opts.nowMs ?? Date.now();
  const existing = resolvedPlusBadgeCache.get(cleanUid);
  const localD1 = getSharedLocalD1Database();
  const d1Row = localD1.tables.user_plus_badge.get(cleanUid);

  const design: number | null =
    opts.plus_badge_design !== undefined
      ? opts.plus_badge_design === null
        ? null
        : isValidPlusBadgeId(opts.plus_badge_design)
        ? opts.plus_badge_design
        : null
      : d1Row !== undefined
      ? d1Row.plus_badge_design
      : existing?.plus_badge_design ?? null;

  const visible: boolean =
    opts.plus_badge_visible !== undefined
      ? Boolean(opts.plus_badge_visible)
      : d1Row !== undefined
      ? Number(d1Row.plus_badge_visible ?? 1) !== 0
      : existing?.plus_badge_visible ?? true;

  const plusBadge: number | null = opts.activePlus && visible ? design : null;

  resolvedPlusBadgeCache.set(cleanUid, {
    plusBadge,
    activePlus: opts.activePlus,
    plus_badge_design: design,
    plus_badge_visible: visible,
    expiresAt: nowMs + PLUS_BADGE_CACHE_TTL_MS,
  });
  return plusBadge;
}

export interface HandlePlusBadgeOptions {
  request: Request;
  env?: RewardsEnv;
  dbOverride?: RewardsD1Database;
  nowMs?: number;
  activePlusOverride?: boolean;
  tokenVerifierOverride?: (
    authHeader: string | null | undefined
  ) => Promise<VerifiedFirebaseToken | null>;
}

export async function handlePlusBadgeRequest(opts: HandlePlusBadgeOptions): Promise<Response> {
  const { request, env } = opts;
  const method = (request.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
  }

  if (method !== 'GET' && method !== 'PUT') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, request);
  }

  const db: RewardsD1Database = opts.dbOverride || env?.DB || getSharedLocalD1Database();
  const nowMs = typeof opts.nowMs === 'number' ? opts.nowMs : Date.now();
  const authHeader = request.headers.get('Authorization');

  // Authenticate caller strictly from session / Firebase Bearer token
  const currentUser = await resolveCurrentUser({
    request,
    env,
    db,
    tokenVerifierOverride: opts.tokenVerifierOverride,
  });

  if (!currentUser || !currentUser.uid) {
    return jsonResponse(
      { ok: false, error: 'Authentication required to access PLUS badge settings.' },
      401,
      request
    );
  }

  const userId = currentUser.uid;
  const isGuest = Boolean(currentUser.isGuest || userId.startsWith('guest_'));

  const plusCheck =
    typeof opts.activePlusOverride === 'boolean'
      ? {
          isActivePlus: opts.activePlusOverride,
          planTier: (opts.activePlusOverride ? 'plus' : 'free') as PlanTier,
          isPendingPayment: false,
          firestoreDesign: undefined as number | null | undefined,
          firestoreVisible: undefined as boolean | undefined,
        }
      : await checkUserActivePlusServer(currentUser, env, nowMs, authHeader);

  if (method === 'GET') {
    if (isGuest) {
      return jsonResponse(
        {
          ok: true,
          plus_badge_design: null,
          plus_badge_visible: true,
          activePlus: false,
          planTier: 'free',
          plusBadge: null,
          updatedAt: null,
        },
        200,
        request
      );
    }

    try {
      const row = await db
        .prepare(
          'SELECT user_id, plus_badge_design, plus_badge_visible, updated_at FROM user_plus_badge WHERE user_id = ?1 LIMIT 1'
        )
        .bind(userId)
        .first<{
          user_id: string;
          plus_badge_design: number | null;
          plus_badge_visible: number;
          updated_at: number;
        }>();

      if (row) {
        const design =
          row.plus_badge_design === null || row.plus_badge_design === undefined
            ? null
            : isValidPlusBadgeId(Number(row.plus_badge_design))
            ? Number(row.plus_badge_design)
            : null;
        const visible = Number(row.plus_badge_visible ?? 1) !== 0;
        const plusBadge = setCachedUserPlusBadge(userId, {
          activePlus: plusCheck.isActivePlus,
          plus_badge_design: design,
          plus_badge_visible: visible,
          nowMs,
        });
        return jsonResponse(
          {
            ok: true,
            plus_badge_design: design,
            plus_badge_visible: visible,
            activePlus: plusCheck.isActivePlus,
            planTier: plusCheck.planTier,
            plusBadge,
            updatedAt: Number(row.updated_at || 0),
          },
          200,
          request
        );
      }
    } catch {
      // Table may not exist yet on D1; fall back cleanly
    }

    const fallbackDesign =
      plusCheck.firestoreDesign !== undefined
        ? plusCheck.firestoreDesign
        : null;
    const fallbackVisible =
      plusCheck.firestoreVisible !== undefined ? plusCheck.firestoreVisible : true;

    const plusBadge = setCachedUserPlusBadge(userId, {
      activePlus: plusCheck.isActivePlus,
      plus_badge_design: fallbackDesign,
      plus_badge_visible: fallbackVisible,
      nowMs,
    });

    return jsonResponse(
      {
        ok: true,
        plus_badge_design: fallbackDesign,
        plus_badge_visible: fallbackVisible,
        activePlus: plusCheck.isActivePlus,
        planTier: plusCheck.planTier,
        plusBadge,
        updatedAt: null,
      },
      200,
      request
    );
  }

  // PUT /api/plus-badge
  if (isGuest) {
    return jsonResponse(
      {
        ok: false,
        error: 'Guest accounts cannot customize PLUS badges. Please sign in and upgrade to Plus.',
        code: 'GUEST_FORBIDDEN',
      },
      403,
      request
    );
  }

  const rateCheck = checkPutRateLimit(userId, nowMs);
  if (!rateCheck.allowed) {
    return jsonResponse(
      {
        ok: false,
        error: 'Too many PLUS badge updates. Please wait a moment before saving again.',
        retryAfterSec: rateCheck.retryAfterSec || 1,
      },
      429,
      request
    );
  }

  let rawBody: unknown;
  try {
    const text = await request.text();
    rawBody = text ? JSON.parse(text) : null;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400, request);
  }

  const validation = validatePlusBadgePayload(rawBody);
  if (!validation.valid || !validation.value) {
    return jsonResponse(
      { ok: false, error: validation.error || 'Invalid PLUS badge settings.' },
      400,
      request
    );
  }

  const { plus_badge_design, plus_badge_visible } = validation.value;

  // Enforce active Boardly Plus plan server-side
  if (!plusCheck.isActivePlus) {
    return jsonResponse(
      {
        ok: false,
        error: 'An active Boardly Plus plan is required to customize and save a PLUS badge.',
        code: 'PLUS_REQUIRED',
      },
      403,
      request
    );
  }

  try {
    await db
      .prepare(
        `INSERT INTO user_plus_badge (user_id, plus_badge_design, plus_badge_visible, updated_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(user_id) DO UPDATE SET
           plus_badge_design = excluded.plus_badge_design,
           plus_badge_visible = excluded.plus_badge_visible,
           updated_at = excluded.updated_at`
      )
      .bind(userId, plus_badge_design, plus_badge_visible ? 1 : 0, nowMs)
      .run();
  } catch {
    // Auto-create table on D1 if migration 0013 hasn't been applied manually yet, then retry once
    try {
      await ensureUserPlusBadgeTable(db);
      await db
        .prepare(
          `INSERT INTO user_plus_badge (user_id, plus_badge_design, plus_badge_visible, updated_at)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(user_id) DO UPDATE SET
             plus_badge_design = excluded.plus_badge_design,
             plus_badge_visible = excluded.plus_badge_visible,
             updated_at = excluded.updated_at`
        )
        .bind(userId, plus_badge_design, plus_badge_visible ? 1 : 0, nowMs)
        .run();
    } catch (err: any) {
      return jsonResponse(
        {
          ok: false,
          error: err?.message || 'Failed to save PLUS badge settings.',
        },
        500,
        request
      );
    }
  }

  const effectivePlusBadge = setCachedUserPlusBadge(userId, {
    activePlus: plusCheck.isActivePlus,
    plus_badge_design,
    plus_badge_visible,
    nowMs,
  });

  return jsonResponse(
    {
      ok: true,
      plus_badge_design,
      plus_badge_visible,
      activePlus: plusCheck.isActivePlus,
      planTier: plusCheck.planTier,
      plusBadge: effectivePlusBadge,
      updatedAt: nowMs,
    },
    200,
    request
  );
}

// Cloudflare Pages Functions exports so /api/plus-badge is directly routable on boardly.cfd
export async function onRequest(context: {
  request: Request;
  env?: RewardsEnv;
}): Promise<Response> {
  return handlePlusBadgeRequest({
    request: context.request,
    env: context.env,
  });
}

export const onRequestGet = onRequest;
export const onRequestPut = onRequest;
export const onRequestOptions = onRequest;

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
  DEFAULT_KOBAN_STYLE,
  KOBAN_DESIGNS,
  validateKobanStylePayload,
  type KobanStyleSettings,
} from '../../src/lib/kobanStyle';

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

// Per-user in-memory rate-limiter for PUT /api/koban-style
// Max 20 updates per 60 seconds per user, and minimum 350ms between consecutive saves
const userPutRateWindow = new Map<string, { timestamps: number[] }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_MIN_INTERVAL_MS = 350;

export function resetKobanStyleRateLimiterForTests(): void {
  userPutRateWindow.clear();
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

async function userHasActivePlan(
  user: { uid: string; plan?: string; isAdminOrAbove?: boolean; role?: string; isGuest?: boolean },
  env?: RewardsEnv
): Promise<boolean> {
  if (user.isAdminOrAbove || user.role === 'captain' || user.plan === 'pro') {
    return true;
  }
  if (user.isGuest) {
    return false;
  }
  try {
    const sa = parseServiceAccountFromEnv(env);
    if (sa) {
      const store = new FirestoreRestAdapter(
        sa,
        env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID,
        env?.FIREBASE_DATABASE_ID
      );
      const userDoc = await store.getDoc(`users/${user.uid}`);
      if (userDoc) {
        const plan = String(userDoc.plan || userDoc.subscription_tier || '').toLowerCase();
        const isPro = Boolean(userDoc.isPro || userDoc.is_pro || plan === 'pro');
        const subscribedPlans = Array.isArray(userDoc.subscribedPlans)
          ? userDoc.subscribedPlans
          : Array.isArray(userDoc.subscribed_plans)
          ? userDoc.subscribed_plans
          : [];
        if (isPro || subscribedPlans.length > 0) {
          return true;
        }
      }
    }
  } catch {
    // Non-fatal fallback
  }
  return false;
}

export interface HandleKobanStyleOptions {
  request: Request;
  env?: RewardsEnv;
  dbOverride?: RewardsD1Database;
  nowMs?: number;
  tokenVerifierOverride?: (
    authHeader: string | null | undefined
  ) => Promise<VerifiedFirebaseToken | null>;
}

export async function handleKobanStyleRequest(opts: HandleKobanStyleOptions): Promise<Response> {
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

  // Authenticate caller strictly from session / Bearer token (never from request body)
  const currentUser = await resolveCurrentUser({
    request,
    env,
    db,
    tokenVerifierOverride: opts.tokenVerifierOverride,
  });

  if (!currentUser || !currentUser.uid) {
    return jsonResponse(
      { ok: false, error: 'Authentication required to access Koban icon style.' },
      401
    );
  }

  const userId = currentUser.uid;

  if (method === 'GET') {
    try {
      const row = await db
        .prepare(
          'SELECT user_id, design, main_color, accent_color, glow_color, glow, motion, sparkle, updated_at FROM user_koban_style WHERE user_id = ?1 LIMIT 1'
        )
        .bind(userId)
        .first<{
          user_id: string;
          design: string;
          main_color: string;
          accent_color: string;
          glow_color: string;
          glow: number;
          motion: string;
          sparkle: number;
          updated_at: number;
        }>();

      if (row) {
        const candidate = {
          design: row.design,
          mainColor: row.main_color,
          accentColor: row.accent_color,
          glowColor: row.glow_color,
          glow: Number(row.glow),
          motion: row.motion,
          sparkle: Boolean(Number(row.sparkle)),
        };
        const validated = validateKobanStylePayload(candidate);
        if (validated.valid && validated.value) {
          return jsonResponse({
            ok: true,
            style: validated.value,
            updatedAt: Number(row.updated_at || 0),
          });
        }
      }
    } catch {
      // If table is not yet created on production D1, return default gracefully
    }

    return jsonResponse({
      ok: true,
      style: DEFAULT_KOBAN_STYLE,
      updatedAt: null,
    });
  }

  // PUT /api/koban-style
  const rateCheck = checkPutRateLimit(userId, nowMs);
  if (!rateCheck.allowed) {
    return jsonResponse(
      {
        ok: false,
        error: 'Too many style updates. Please wait a moment before saving again.',
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

  // Unwrap `{ style: ... }` if wrapped, or validate top-level object
  const payloadObj =
    rawBody &&
    typeof rawBody === 'object' &&
    !Array.isArray(rawBody) &&
    'style' in (rawBody as Record<string, unknown>) &&
    typeof (rawBody as Record<string, unknown>).style === 'object'
      ? (rawBody as Record<string, unknown>).style
      : rawBody;

  const validation = validateKobanStylePayload(payloadObj);
  if (!validation.valid || !validation.value) {
    return jsonResponse(
      { ok: false, error: validation.error || 'Invalid Koban style settings.' },
      400
    );
  }

  const validStyle: KobanStyleSettings = validation.value;

  // Enforce proOnly check if a design is marked proOnly: true
  const designMeta = KOBAN_DESIGNS.find((d) => d.id === validStyle.design);
  if (designMeta?.proOnly) {
    const hasPro = await userHasActivePlan(currentUser, env);
    if (!hasPro) {
      return jsonResponse(
        {
          ok: false,
          error: 'This Koban icon design requires an active Boardly Pro plan.',
          code: 'PRO_REQUIRED',
        },
        403
      );
    }
  }

  try {
    await db
      .prepare(
        `INSERT INTO user_koban_style (user_id, design, main_color, accent_color, glow_color, glow, motion, sparkle, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(user_id) DO UPDATE SET
           design = excluded.design,
           main_color = excluded.main_color,
           accent_color = excluded.accent_color,
           glow_color = excluded.glow_color,
           glow = excluded.glow,
           motion = excluded.motion,
           sparkle = excluded.sparkle,
           updated_at = excluded.updated_at`
      )
      .bind(
        userId,
        validStyle.design,
        validStyle.mainColor,
        validStyle.accentColor,
        validStyle.glowColor,
        validStyle.glow,
        validStyle.motion,
        validStyle.sparkle ? 1 : 0,
        nowMs
      )
      .run();
  } catch (err: any) {
    return jsonResponse(
      {
        ok: false,
        error: err?.message || 'Failed to save Koban style to database.',
      },
      500
    );
  }

  return jsonResponse({
    ok: true,
    style: validStyle,
    updatedAt: nowMs,
  });
}

/**
 * Boardly AI Mentors — Cloudflare Pages Function (/api/ai)
 *
 * Endpoints:
 * - GET  /api/ai  -> Returns live daily credit balance, plan, Deep/Max unlock status, and PKT reset time
 * - POST /api/ai  -> Validates request, enforces plan & server-side daily credits in Firestore,
 *                    deducts before calling Gemini, refunds automatically on failure, returns answer text.
 *
 * Environment variables read:
 * - GEMINI_API_KEY (or fallback first key from GEMINI_API_KEYS)
 * - GEMINI_MODEL (optional, defaults to "gemini-4-hydrogen" from ai-config.json)
 * - FIREBASE_SERVICE_ACCOUNT (JSON or base64 JSON; fallback GOOGLE_SERVICE_ACCOUNT_KEY)
 * - FIREBASE_PROJECT_ID (optional, fallback VITE_FIREBASE_PROJECT_ID)
 * - FIREBASE_DATABASE_ID (optional, fallback VITE_FIREBASE_DATABASE_ID / VITE_FIREBASE_FIRESTORE_DATABASE_ID)
 * - OWNER_EMAIL (optional, defaults to "shsvirtualadmin@gmail.com")
 */

import aiConfig from '../../ai-config.json';
import {
  AISHA_MENTOR_ID,
  buildModelGenerationConfig,
  getDepthBaseCostForMentor,
  modelSupportsThinkingConfig,
  parseStrictDepthId,
  parseStrictMentorId,
  resolveAiDepthExecution,
  trimContentsForDepth,
} from '../../shared/aiDepthRouter.js';
import {
  hashPhysicsQuestion,
  isPhysicsVisualQuery,
  validatePhysicsScene,
} from '../../shared/aishaSceneSchema.js';

const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0365509316';
const DEFAULT_FIRESTORE_DATABASE_ID =
  'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';
const DEFAULT_OWNER_EMAIL = 'shsvirtualadmin@gmail.com';
const FIRESTORE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/datastore';

// Short-TTL in-memory usage cache (20s, write-through on deduction, bypassed on GET)
// to eliminate redundant Firestore RTT on consecutive messages in a conversation.
const DAILY_USAGE_CACHE_TTL_MS = 20_000;
const dailyUsageCache = new Map();

// ─── Aisha Visual Physics Scene Cache, Daily Caps & Cost Telemetry ────────────
const AISHA_SCENE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const AISHA_SCENE_CACHE_MAX = 400;
const aishaSceneCache = new Map(); // hash -> { sceneJson, scene, depthKey, createdAt }
const aishaDailyAnimatedUsage = new Map(); // `${uid}:${dateKey}` -> count
const aishaLastRefusalByUser = new Map(); // uid -> last refusal string

let aishaDailyStats = null;

function ensureAishaDailyStats(dateKey) {
  if (!aishaDailyStats || aishaDailyStats.dateKey !== dateKey) {
    aishaDailyStats = {
      dateKey,
      totalVisualAnswers: 0,
      cacheHits: 0,
      textFallbacks: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      byDepth: { quick: 0, balanced: 0, deep: 0, max: 0 },
      recentEntries: [],
    };
  }
  return aishaDailyStats;
}

function estimateGeminiCostUsd(modelName, inputTokens = 0, outputTokens = 0) {
  const lower = String(modelName || '').toLowerCase();
  // Conservative blended per-1M token USD pricing estimates
  const isLite = lower.includes('lite');
  const inputRatePerM = isLite ? 0.1 : 0.3;
  const outputRatePerM = isLite ? 0.4 : 1.2;
  const cost = (inputTokens * inputRatePerM + outputTokens * outputRatePerM) / 1_000_000;
  return Number(cost.toFixed(6));
}

function recordAishaVisualTelemetry({
  dateKey,
  depthKey,
  tokens = 0,
  costUsd = 0,
  cacheHit = false,
  textFallback = false,
}) {
  const stats = ensureAishaDailyStats(dateKey);
  if (textFallback) {
    stats.textFallbacks += 1;
  } else {
    stats.totalVisualAnswers += 1;
    if (cacheHit) stats.cacheHits += 1;
    if (depthKey && Object.prototype.hasOwnProperty.call(stats.byDepth, depthKey)) {
      stats.byDepth[depthKey] += 1;
    }
  }
  stats.totalTokens += Math.max(0, Math.round(tokens));
  stats.estimatedCostUsd = Number((stats.estimatedCostUsd + Math.max(0, costUsd)).toFixed(6));
  stats.recentEntries.unshift({
    ts: new Date().toISOString(),
    depth: depthKey || 'balanced',
    tokens: Math.max(0, Math.round(tokens)),
    costUsd: Number(Math.max(0, costUsd).toFixed(6)),
    cacheHit: Boolean(cacheHit),
  });
  if (stats.recentEntries.length > 30) {
    stats.recentEntries.length = 30;
  }
  console.log(
    `[Aisha Visual Telemetry] date=${dateKey} depth=${depthKey} tokens=${Math.round(tokens)} costUsd=${costUsd.toFixed(6)} cacheHit=${cacheHit} textFallback=${textFallback}`
  );
}

function getCachedAishaScene(hash) {
  if (!hash) return null;
  const entry = aishaSceneCache.get(hash);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > AISHA_SCENE_CACHE_TTL_MS) {
    aishaSceneCache.delete(hash);
    return null;
  }
  return entry;
}

function setCachedAishaScene(hash, scene, depthKey) {
  if (!hash || !scene) return;
  if (aishaSceneCache.size >= AISHA_SCENE_CACHE_MAX) {
    const oldestKey = aishaSceneCache.keys().next().value;
    if (oldestKey) aishaSceneCache.delete(oldestKey);
  }
  aishaSceneCache.set(hash, {
    sceneJson: JSON.stringify(scene),
    scene,
    depthKey,
    createdAt: Date.now(),
  });
}

function getLatestUserTextFromContents(contents) {
  if (!Array.isArray(contents) || contents.length === 0) return '';
  for (let i = contents.length - 1; i >= 0; i--) {
    const msg = contents[i];
    if (msg?.role !== 'user' || !Array.isArray(msg.parts)) continue;
    const text = msg.parts
      .filter((p) => typeof p?.text === 'string')
      .map((p) => p.text)
      .join(' ')
      .trim();
    if (text) return text;
  }
  return '';
}

function looksLikeRefusalText(text) {
  const s = String(text || '').toLowerCase();
  return (
    s.includes('physics tutor') ||
    s.includes('physics question') ||
    s.includes('can only help') ||
    s.includes('my focus is physics')
  );
}

// ─── CORS & JSON Helpers ──────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Base64URL & Crypto Helpers ───────────────────────────────────────────────

function base64UrlToUint8Array(base64Url) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    out[i] = rawData.charCodeAt(i);
  }
  return out;
}

function uint8ArrayToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str) {
  return uint8ArrayToBase64Url(new TextEncoder().encode(str));
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Firebase ID Token Verification (Google SecureToken JWKs) ─────────────────

let cachedGoogleJwks = null;

async function getGooglePublicJwks() {
  const now = Date.now();
  if (cachedGoogleJwks && cachedGoogleJwks.expiresAt > now) {
    return cachedGoogleJwks.keys;
  }
  const res = await fetchWithTimeout(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    {},
    10_000
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public JWKs (HTTP ${res.status})`);
  }
  const data = await res.json();
  const keys = Array.isArray(data?.keys) ? data.keys : [];
  cachedGoogleJwks = { keys, expiresAt: now + 50 * 60 * 1000 };
  return keys;
}

async function verifyFirebaseIdToken(authHeader, projectId, env) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { error: 'Missing Authorization token.', status: 401 };
  const token = authHeader.slice(7).trim();
  if (!token || token.startsWith('guest_')) {
    return { error: 'Please sign in with a registered Boardly account to use AI Mentors.', status: 401 };
  }

  const parts = token.split('.');
  if (parts.length !== 3) return { error: 'Invalid authentication token.', status: 401 };

  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(parts[1])));

    if (header.alg !== 'RS256' || !header.kid) {
      return { error: 'Invalid token signature algorithm.', status: 401 };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec - 30) {
      return { error: 'Your session expired. Please refresh and sign in again.', status: 401 };
    }
    if (!payload.iat || payload.iat > nowSec + 300) {
      return { error: 'Invalid token timestamp.', status: 401 };
    }
    if (payload.aud !== projectId) {
      return { error: 'Token audience mismatch.', status: 401 };
    }
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
      return { error: 'Token issuer mismatch.', status: 401 };
    }
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.startsWith('guest_')) {
      return { error: 'Guest accounts cannot use AI Mentors. Please sign in.', status: 403 };
    }

    const signInProvider = String(payload?.firebase?.sign_in_provider || '').toLowerCase();
    if (signInProvider === 'anonymous') {
      return { error: 'Anonymous sessions cannot use AI Mentors. Please sign in.', status: 403 };
    }

    const keys = await getGooglePublicJwks();
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      return { error: 'Unable to verify authentication key.', status: 401 };
    }

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToUint8Array(parts[2]);
    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature,
      signedData
    );
    if (!isValid) {
      return { error: 'Invalid authentication signature.', status: 401 };
    }

    const ownerEmail = String(env?.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
    const email = String(payload.email || '').trim().toLowerCase();
    const emailVerified = payload.email_verified === true;
    const isSuperAdmin =
      payload.superAdmin === true || (emailVerified && email !== '' && email === ownerEmail);

    return {
      user: {
        uid: payload.sub,
        email,
        emailVerified,
        isSuperAdmin,
        isAdmin: isSuperAdmin || payload.admin === true,
      },
    };
  } catch {
    return { error: 'Authentication verification failed.', status: 401 };
  }
}

// ─── Firestore REST Client (Service Account) ──────────────────────────────────

let cachedAccessToken = null;

function parseServiceAccount(env) {
  const raw = String(env?.FIREBASE_SERVICE_ACCOUNT || env?.GOOGLE_SERVICE_ACCOUNT_KEY || '').trim();
  if (!raw) return null;
  try {
    const jsonStr = raw.startsWith('{') ? raw : atob(raw);
    const parsed = JSON.parse(jsonStr);
    if (
      parsed &&
      typeof parsed.client_email === 'string' &&
      parsed.client_email.includes('@') &&
      typeof parsed.private_key === 'string' &&
      parsed.private_key.includes('PRIVATE KEY')
    ) {
      return {
        project_id: parsed.project_id || env?.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, '\n'),
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getServiceAccountAccessToken(sa) {
  const nowMs = Date.now();
  if (
    cachedAccessToken &&
    cachedAccessToken.clientEmail === sa.client_email &&
    cachedAccessToken.expiresAt > nowMs + 60_000
  ) {
    return cachedAccessToken.token;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const unsignedJwt = `${stringToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${stringToBase64Url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      scope: FIRESTORE_OAUTH_SCOPE,
      aud: tokenUri,
      iat: nowSec,
      exp: nowSec + 3600,
    })
  )}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );
  const jwt = `${unsignedJwt}.${uint8ArrayToBase64Url(new Uint8Array(sig))}`;

  const res = await fetchWithTimeout(
    tokenUri,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    },
    10_000
  );

  if (!res.ok) {
    throw new Error(`Service account OAuth2 failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  cachedAccessToken = {
    token: data.access_token,
    clientEmail: sa.client_email,
    expiresAt: nowMs + Number(data.expires_in || 3600) * 1000,
  };
  return data.access_token;
}

function fromFirestoreValue(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if ('nullValue' in raw) return null;
  if ('booleanValue' in raw) return Boolean(raw.booleanValue);
  if ('integerValue' in raw) return Number(raw.integerValue);
  if ('doubleValue' in raw) return Number(raw.doubleValue);
  if ('stringValue' in raw) return String(raw.stringValue);
  if ('timestampValue' in raw) return String(raw.timestampValue);
  if ('arrayValue' in raw) {
    return Array.isArray(raw.arrayValue?.values)
      ? raw.arrayValue.values.map((v) => fromFirestoreValue(v))
      : [];
  }
  if ('mapValue' in raw) {
    const out = {};
    for (const [k, v] of Object.entries(raw.mapValue?.fields || {})) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return null;
}

function fromFirestoreDoc(docObj) {
  if (!docObj || !docObj.fields) return null;
  const out = {};
  for (const [k, v] of Object.entries(docObj.fields)) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  return { stringValue: String(val) };
}

function firestoreDocBaseUrl(projectId, databaseId) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents`;
}

async function getFirestoreDoc(baseUrl, accessToken, docPath) {
  const res = await fetchWithTimeout(
    `${baseUrl}/${docPath}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    10_000
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Firestore read failed for ${docPath} (HTTP ${res.status})`);
  }
  return fromFirestoreDoc(await res.json());
}

async function patchFirestoreDoc(baseUrl, accessToken, docPath, fieldsObj) {
  const fields = {};
  const maskParams = [];
  for (const [k, v] of Object.entries(fieldsObj)) {
    fields[k] = toFirestoreValue(v);
    maskParams.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
  }
  const url = `${baseUrl}/${docPath}?${maskParams.join('&')}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    },
    10_000
  );
  if (!res.ok) {
    throw new Error(`Firestore write failed for ${docPath} (HTTP ${res.status})`);
  }
  return fromFirestoreDoc(await res.json());
}

/**
 * Atomic server-side Firestore credit increment using :commit + FieldTransform.increment.
 * Eliminates read-modify-write lost-update races and prevents double-charges via requestId idempotency.
 */
const deductedRequestCache = new Map(); // requestId -> { ts, creditsUsed }
const inFlightReservedCredits = new Map(); // `${uid}:${dateKey}` -> reserved number
const userPlanCache = new Map(); // uid -> { planInfo, expiresAt }

function pruneIdempotencyCache(now = Date.now()) {
  if (deductedRequestCache.size < 200) return;
  for (const [k, v] of deductedRequestCache.entries()) {
    if (now - v.ts > 10 * 60 * 1000) deductedRequestCache.delete(k);
  }
}

async function atomicIncrementFirestoreCredits({
  projectId,
  databaseId,
  accessToken,
  docPath,
  delta,
  aishaAnimatedDelta = 0,
  dailyLimit,
  dateKey,
  requestId,
}) {
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/${encodeURIComponent(databaseId)}/documents:commit`;
  const fullDocName = `projects/${projectId}/databases/${databaseId}/documents/${docPath}`;

  const fieldTransforms = [
    {
      fieldPath: 'creditsUsed',
      increment: { integerValue: String(Math.trunc(delta)) },
    },
  ];
  if (aishaAnimatedDelta > 0) {
    fieldTransforms.push({
      fieldPath: 'aishaAnimatedCount',
      increment: { integerValue: String(Math.trunc(aishaAnimatedDelta)) },
    });
  }

  const writes = [
    {
      update: {
        name: fullDocName,
        fields: {
          dailyLimit: toFirestoreValue(dailyLimit),
          dateKey: toFirestoreValue(dateKey),
          lastRequestId: toFirestoreValue(requestId),
          updatedAt: toFirestoreValue(new Date().toISOString()),
        },
      },
      updateMask: {
        fieldPaths: ['dailyLimit', 'dateKey', 'lastRequestId', 'updatedAt'],
      },
    },
    {
      transform: {
        document: fullDocName,
        fieldTransforms,
      },
    },
  ];

  const res = await fetchWithTimeout(
    commitUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes }),
    },
    10_000
  );
  if (!res.ok) {
    throw new Error(`Firestore atomic commit failed (HTTP ${res.status})`);
  }
  const commitData = await res.json();
  const transformVal = commitData?.writeResults?.[1]?.transformResults?.[0];
  const updatedCreditsUsed =
    transformVal !== undefined ? Number(fromFirestoreValue(transformVal) ?? 0) : null;
  return updatedCreditsUsed;
}

// ─── Plan, PKT Reset & Credit Math ────────────────────────────────────────────

function parseExpiryMs(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 0 ? (raw < 1e11 ? Math.round(raw * 1000) : Math.round(raw)) : null;
  }
  if (typeof raw === 'string') {
    if (/^\d+$/.test(raw.trim())) {
      const n = Number(raw.trim());
      return n > 0 ? (n < 1e11 ? Math.round(n * 1000) : Math.round(n)) : null;
    }
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function getPktDateAndReset(nowMs = Date.now()) {
  const pktOffsetMs = 5 * 60 * 60 * 1000;
  const pktNow = new Date(nowMs + pktOffsetMs);
  const year = pktNow.getUTCFullYear();
  const month = pktNow.getUTCMonth();
  const day = pktNow.getUTCDate();
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const nextMidnightUtcMs = Date.UTC(year, month, day + 1, 0, 0, 0, 0) - pktOffsetMs;
  return {
    dateKey,
    resetAt: new Date(nextMidnightUtcMs).toISOString(),
  };
}

let cachedPlansCredits = null;

function getFallbackPlansCredits() {
  return {
    free: Number(aiConfig.FREE_CREDITS_PER_DAY || 5),
    pro: Number(aiConfig.PRO_CREDITS_PER_DAY || 50),
    plus: Number(aiConfig.PLUS_CREDITS_PER_DAY || 100),
    aishaAnimationsEnabled: true,
  };
}

async function fetchPlansCreditsConfig(baseUrl, accessToken, bypassCache = false) {
  const now = Date.now();
  if (!bypassCache && cachedPlansCredits && cachedPlansCredits.expiresAt > now) {
    return cachedPlansCredits.credits;
  }
  const fallback = getFallbackPlansCredits();
  try {
    const doc = await getFirestoreDoc(baseUrl, accessToken, 'config/plans');
    const credits = {
      free: Math.max(1, Number(doc?.free?.aiCreditsPerDay || fallback.free)),
      pro: Math.max(1, Number(doc?.pro?.aiCreditsPerDay || fallback.pro)),
      plus: Math.max(1, Number(doc?.plus?.aiCreditsPerDay || fallback.plus)),
      aishaAnimationsEnabled:
        typeof doc?.aishaAnimationsEnabled === 'boolean'
          ? doc.aishaAnimationsEnabled
          : true,
    };
    cachedPlansCredits = { credits, expiresAt: now + 30_000 };
    return credits;
  } catch {
    return fallback;
  }
}

function planTierRank(plan) {
  if (plan === 'plus') return 2;
  if (plan === 'pro') return 1;
  return 0;
}

function resolvePersonalPlanFromUserDoc(userDoc, nowMs) {
  if (!userDoc) return 'free';
  const rawPlan = String(userDoc.planTier || userDoc.plan || '').trim().toLowerCase();
  const isFlaggedPlus =
    userDoc.isPlus === true ||
    rawPlan === 'plus' ||
    rawPlan === 'plus_monthly' ||
    rawPlan === 'plus_annual';

  const plusUntilMs = parseExpiryMs(userDoc.plusUntil);
  const expA = parseExpiryMs(userDoc.planExpiresAt);
  const expB = parseExpiryMs(userDoc.premiumExpiresAt);
  const proUntilMs = parseExpiryMs(userDoc.proUntil);

  // If user is on Plus, Plus expires directly to Free (never drops to Pro).
  if (isFlaggedPlus || plusUntilMs !== null) {
    const plusCandidates = [plusUntilMs, expA, expB].filter((v) => v !== null);
    const plusExpiryMs = plusCandidates.length > 0 ? Math.max(...plusCandidates) : null;
    if (plusExpiryMs !== null) {
      return plusExpiryMs > nowMs ? 'plus' : 'free';
    }
    return isFlaggedPlus ? 'plus' : 'free';
  }

  const proCandidates = [proUntilMs, expA, expB].filter((v) => v !== null);
  const proExpiryMs = proCandidates.length > 0 ? Math.max(...proCandidates) : null;
  const hasFutureExpiry = proExpiryMs !== null && proExpiryMs > nowMs;
  const isExpired = proExpiryMs !== null && proExpiryMs <= nowMs;
  const isFlaggedPro =
    userDoc.isPro === true ||
    userDoc.isPremium === true ||
    rawPlan === 'pro' ||
    rawPlan === 'pro_monthly' ||
    rawPlan === 'pro_annual' ||
    rawPlan === 'premium';

  if (hasFutureExpiry || (isFlaggedPro && !isExpired)) {
    return 'pro';
  }
  return 'free';
}

function resolveCrewMemberPlan(member, nowMs) {
  if (!member || typeof member !== 'object') return 'free';
  const raw = String(member.planTier || member.plan || '').trim().toLowerCase();
  const plusExp = parseExpiryMs(member.plusUntil || member.planExpiresAt);
  if (member.isPlus === true || raw === 'plus' || raw === 'plus_monthly' || raw === 'plus_annual') {
    if (plusExp !== null && plusExp <= nowMs) return 'free';
    return 'plus';
  }
  const proExp = parseExpiryMs(member.proUntil || member.planExpiresAt);
  if (member.isPro === true || raw === 'pro' || raw === 'pro_monthly' || raw === 'pro_annual' || raw === 'premium') {
    if (proExp !== null && proExp <= nowMs) return 'free';
    return 'pro';
  }
  return 'free';
}

function resolveCrewBestPlan(crewDoc, nowMs, options = {}) {
  if (!crewDoc) return 'free';
  let best = 'free';

  const paidUntilMs = parseExpiryMs(crewDoc.paid_until);
  if (crewDoc.tier === 'paid' && paidUntilMs !== null && paidUntilMs > nowMs) {
    best = 'pro';
  }

  if (crewDoc.isProShared !== false) {
    const hasMemberList = Array.isArray(crewDoc.members) && crewDoc.members.length > 0;
    if (hasMemberList) {
      for (const m of crewDoc.members) {
        if (!m || typeof m !== 'object') continue;
        if (options.excludeSelfUid && m.uid && m.uid === options.excludeSelfUid) {
          if (options.selfPersonalPlan && planTierRank(options.selfPersonalPlan) > planTierRank(best)) {
            best = options.selfPersonalPlan;
          }
          continue;
        }
        const mPlan = resolveCrewMemberPlan(m, nowMs);
        if (planTierRank(mPlan) > planTierRank(best)) {
          best = mPlan;
        }
      }
    } else {
      const declared = String(crewDoc.effectivePlan || '').trim().toLowerCase();
      if (declared === 'plus' || crewDoc.hasPlusMember === true) {
        best = 'plus';
      } else if ((declared === 'pro' || crewDoc.hasProMember === true) && planTierRank(best) < 1) {
        best = 'pro';
      }
    }
  }

  return best;
}

async function resolveUserPlanFromFirestore(baseUrl, accessToken, authUser, skipCache = false) {
  const nowMs = Date.now();
  if (!skipCache) {
    const cached = userPlanCache.get(authUser.uid);
    if (cached && cached.expiresAt > nowMs) {
      return cached.planInfo;
    }
  }

  if (authUser.isSuperAdmin) {
    const planCredits = await fetchPlansCreditsConfig(baseUrl, accessToken);
    return {
      plan: 'plus',
      isPro: true,
      isPlus: true,
      isPaid: true,
      isSuperAdmin: true,
      isUnlimited: true,
      deepMaxUnlocked: true,
      source: 'superadmin',
      dailyLimit: planCredits.plus,
      planCredits,
    };
  }

  // Parallelize config/plans and user document read
  const [planCredits, userDoc] = await Promise.all([
    fetchPlansCreditsConfig(baseUrl, accessToken),
    getFirestoreDoc(baseUrl, accessToken, `users/${encodeURIComponent(authUser.uid)}`),
  ]);

  const personalPlan = resolvePersonalPlanFromUserDoc(userDoc, nowMs);
  let crewPlan = 'free';

  // Inherit highest active (non-expired) plan inside Nakama Crew (matches src/hooks/useEffectivePlan.ts)
  const crewId = userDoc?.crewId ? String(userDoc.crewId).trim() : '';
  if (crewId && personalPlan !== 'plus') {
    const crewDoc = await getFirestoreDoc(
      baseUrl,
      accessToken,
      `crews/${encodeURIComponent(crewId)}`
    ).catch(() => null);
    if (crewDoc && crewDoc.isProShared !== false && Array.isArray(crewDoc.members) && crewDoc.members.length > 0) {
      // Verify live sharer expiry against users/{uid} when a member snapshot omits expiry dates
      const hydratedMembers = await Promise.all(
        crewDoc.members.map(async (m) => {
          if (!m || typeof m !== 'object' || !m.uid || m.uid === authUser.uid) return m;
          const snapshotPlan = resolveCrewMemberPlan(m, nowMs);
          if (snapshotPlan === 'free') return m;
          const hasSnapshotExpiry =
            parseExpiryMs(m.plusUntil) !== null ||
            parseExpiryMs(m.proUntil) !== null ||
            parseExpiryMs(m.planExpiresAt) !== null ||
            parseExpiryMs(m.premiumExpiresAt) !== null;
          if (hasSnapshotExpiry) return m;
          const liveSharerDoc = await getFirestoreDoc(
            baseUrl,
            accessToken,
            `users/${encodeURIComponent(String(m.uid))}`
          ).catch(() => null);
          if (!liveSharerDoc) return m;
          const livePlan = resolvePersonalPlanFromUserDoc(liveSharerDoc, nowMs);
          return {
            ...m,
            plan: livePlan,
            planTier: livePlan,
            isPlus: livePlan === 'plus',
            isPro: livePlan === 'pro' || livePlan === 'plus',
            plusUntil: liveSharerDoc.plusUntil ?? null,
            proUntil: liveSharerDoc.proUntil ?? null,
            planExpiresAt: liveSharerDoc.planExpiresAt ?? null,
          };
        })
      );
      crewPlan = resolveCrewBestPlan({ ...crewDoc, members: hydratedMembers }, nowMs, {
        excludeSelfUid: authUser.uid,
        selfPersonalPlan: personalPlan,
      });
    } else {
      crewPlan = resolveCrewBestPlan(crewDoc, nowMs, {
        excludeSelfUid: authUser.uid,
        selfPersonalPlan: personalPlan,
      });
    }
  }

  const useCrew = planTierRank(crewPlan) > planTierRank(personalPlan);
  const effectivePlan = useCrew ? crewPlan : personalPlan;
  const source = effectivePlan === 'free' ? 'none' : useCrew ? 'crew' : 'personal';
  const isPaid = effectivePlan !== 'free';
  const isPlus = effectivePlan === 'plus';
  const dailyLimit =
    effectivePlan === 'plus'
      ? planCredits.plus
      : effectivePlan === 'pro'
      ? planCredits.pro
      : planCredits.free;

  const planInfo = {
    plan: effectivePlan,
    isPro: isPaid,
    isPlus,
    isPaid,
    isSuperAdmin: false,
    isUnlimited: false,
    deepMaxUnlocked: isPaid,
    source,
    dailyLimit,
    planCredits,
  };
  userPlanCache.set(authUser.uid, { planInfo, expiresAt: nowMs + 30_000 });
  return planInfo;
}

function computeServerMessageCost(depth, contents, options = {}) {
  const rules = aiConfig.COST_RULES;
  const baseCost = getDepthBaseCostForMentor(options?.mentorId ?? 0, depth, {
    visualMode: Boolean(options?.visualMode),
    cacheHit: Boolean(options?.cacheHit),
  });

  // Cached Aisha scenes always cost flat 1 credit (no history/text penalty)
  if (options?.mentorId === AISHA_MENTOR_ID && options?.visualMode && options?.cacheHit) {
    return baseCost;
  }

  // Measure the newest user message's text + attachments + total history count
  const lastUserMsg = [...contents].reverse().find((m) => m.role === 'user') || contents[contents.length - 1];
  let textLen = 0;
  let photoCount = 0;
  let pdfCount = 0;

  for (const part of lastUserMsg?.parts || []) {
    if (typeof part.text === 'string') {
      textLen += part.text.length;
    }
    if (part.inlineData?.mimeType) {
      const mime = String(part.inlineData.mimeType).toLowerCase();
      if (mime === 'application/pdf') {
        pdfCount += 1;
      } else if (mime.startsWith('image/')) {
        photoCount += 1;
      }
    }
  }

  const historyMessagesBeforeLatest = Math.max(0, contents.length - 1);
  const textExtra = Math.min(
    rules.maxTextExtraCredits,
    Math.floor(textLen / rules.charsPerExtraCredit)
  );
  const photoExtra = photoCount * rules.photoExtraCredit;
  const pdfExtra = pdfCount * rules.pdfExtraCredit;
  const historyExtra = Math.min(
    rules.maxHistoryExtraCredits,
    Math.floor(historyMessagesBeforeLatest / rules.messagesPerExtraCredit)
  );

  return baseCost + textExtra + photoExtra + pdfExtra + historyExtra;
}

function validateAndSanitizeContents(rawContents) {
  if (!Array.isArray(rawContents) || rawContents.length === 0) {
    return { error: 'Please send at least one message.' };
  }
  const maxMsgs = aiConfig.COST_RULES.maxMessagesServer;
  if (rawContents.length > maxMsgs) {
    return { error: `Too many messages in request (max ${maxMsgs}).` };
  }

  const sanitized = [];
  for (const msg of rawContents) {
    if (!msg || (msg.role !== 'user' && msg.role !== 'model') || !Array.isArray(msg.parts)) {
      return { error: 'Invalid message format.' };
    }
    const cleanParts = [];
    for (const part of msg.parts) {
      if (typeof part?.text === 'string') {
        if (part.text.length > aiConfig.COST_RULES.maxCharsPerMessage) {
          return {
            error: `Message text exceeds the ${aiConfig.COST_RULES.maxCharsPerMessage} character limit.`,
          };
        }
        if (part.text.trim()) {
          cleanParts.push({ text: part.text });
        }
      } else if (part?.inlineData && typeof part.inlineData === 'object') {
        const mimeType = String(part.inlineData.mimeType || '').toLowerCase();
        const data = String(part.inlineData.data || '');
        const allowedMime =
          mimeType === 'image/jpeg' ||
          mimeType === 'image/png' ||
          mimeType === 'image/webp' ||
          mimeType === 'application/pdf';
        if (!allowedMime) {
          return { error: 'Only JPEG/PNG/WebP images and PDF files are supported.' };
        }
        // Estimate decoded bytes from base64 length
        const approxBytes = Math.ceil((data.length * 3) / 4);
        if (approxBytes > aiConfig.COST_RULES.maxPdfBytes) {
          return { error: 'Attached file exceeds the 4 MB limit.' };
        }
        if (!data) {
          return { error: 'Attached file is empty.' };
        }
        cleanParts.push({ inlineData: { mimeType, data } });
      }
    }
    if (cleanParts.length > 0) {
      sanitized.push({ role: msg.role, parts: cleanParts });
    }
  }

  if (sanitized.length === 0 || sanitized[0].role !== 'user') {
    return { error: 'Conversation must start with a user message.' };
  }

  return { contents: sanitized };
}

function resolveGeminiApiKey(env) {
  const direct = String(env?.GEMINI_API_KEY || '').trim();
  if (direct) return direct;
  const pool = String(env?.GEMINI_API_KEYS || '').trim();
  if (pool) {
    const first = pool
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .find(Boolean);
    if (first) return first;
  }
  return '';
}

function resolveFirestoreIds(env, sa) {
  const projectId =
    String(env?.FIREBASE_PROJECT_ID || env?.VITE_FIREBASE_PROJECT_ID || sa?.project_id || DEFAULT_FIREBASE_PROJECT_ID).trim() ||
    DEFAULT_FIREBASE_PROJECT_ID;
  const rawDb = String(
    env?.FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_DATABASE_ID ||
      env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      DEFAULT_FIRESTORE_DATABASE_ID
  ).trim();
  const databaseId =
    !rawDb || rawDb === '(default)' || rawDb === 'default'
      ? DEFAULT_FIRESTORE_DATABASE_ID
      : rawDb;
  return { projectId, databaseId };
}

// Short in-memory circuit breaker so a hanging/503 upstream model doesn't stall every request.
// Auto-recovers after 2 minutes.
const MODEL_COOLDOWN_MS = 120_000;
const unhealthyModelCooldowns = new Map();

function markModelUnhealthy(modelName, reason) {
  const until = Date.now() + MODEL_COOLDOWN_MS;
  unhealthyModelCooldowns.set(modelName, { until, reason });
}

function isModelInCooldown(modelName, nowMs = Date.now()) {
  const entry = unhealthyModelCooldowns.get(modelName);
  if (!entry) return false;
  if (entry.until <= nowMs) {
    unhealthyModelCooldowns.delete(modelName);
    return false;
  }
  return true;
}

function countWords(text) {
  const clean = String(text || '').trim();
  return clean ? clean.split(/\s+/).length : 0;
}

// ─── Main Request Handler (Shared by Cloudflare Pages Function & Vite Dev) ───

export async function handleAiMentorsRequest(request, env) {
  const tStart = Date.now();

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const sa = parseServiceAccount(env);
  const { projectId, databaseId } = resolveFirestoreIds(env, sa);

  // Start body parse (POST), Firebase ID token verification, and Service Account OAuth in PARALLEL!
  const bodyPromise =
    request.method === 'POST'
      ? request
          .json()
          .then((b) => ({ ok: true, body: b }))
          .catch(() => ({ ok: false, body: null }))
      : Promise.resolve({ ok: true, body: null });

  const saTokenPromise = sa
    ? getServiceAccountAccessToken(sa).catch((err) => ({ error: err }))
    : Promise.resolve(null);

  const [authResult, bodyParsed] = await Promise.all([
    verifyFirebaseIdToken(request.headers.get('Authorization'), projectId, env),
    bodyPromise,
  ]);

  if (authResult.error || !authResult.user) {
    console.warn(
      `[AI Mentor Server] auth rejected method=${request.method} status=${authResult.status || 401} reason=${authResult.error || 'Unauthorized'}`
    );
    return jsonResponse({ error: authResult.error || 'Unauthorized.' }, authResult.status || 401);
  }
  const authUser = authResult.user;

  if (request.method === 'POST' && !bodyParsed.ok) {
    return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
  }
  const body = bodyParsed.body;
  const { dateKey, resetAt } = getPktDateAndReset();

  // ── GET /api/ai?adminStats=1 -> Admin Aisha Visual Telemetry & Live Switch ──
  if (request.method === 'GET') {
    const reqUrl = new URL(request.url);
    if (reqUrl.searchParams.get('adminStats') === '1') {
      if (!authUser.isAdmin && !authUser.isSuperAdmin) {
        return jsonResponse({ error: 'Admin access required.' }, 403);
      }
      let liveAishaEnabled = true;
      if (sa) {
        const saTokenRes = await saTokenPromise;
        if (typeof saTokenRes === 'string') {
          const cfg = await fetchPlansCreditsConfig(
            firestoreDocBaseUrl(projectId, databaseId),
            saTokenRes,
            true
          );
          liveAishaEnabled = cfg.aishaAnimationsEnabled !== false;
        }
      }
      const stats = ensureAishaDailyStats(dateKey);
      return jsonResponse({
        ...stats,
        aishaAnimationsEnabled: liveAishaEnabled,
      });
    }
  }

  // ── POST /api/ai { action: 'transcribe' } -> MediaRecorder Audio Fallback ──
  if (request.method === 'POST' && body?.action === 'transcribe') {
    const apiKeyForAudio = resolveGeminiApiKey(env);
    if (!apiKeyForAudio) {
      return jsonResponse(
        { error: 'Voice transcription is unavailable right now.', code: 'MISSING_GEMINI_API_KEY' },
        503
      );
    }
    const audioBase64 = String(body?.audioBase64 || '').trim();
    const rawMime = String(body?.mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    const allowedAudio = new Set([
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/mpeg',
      'audio/wav',
      'audio/aac',
      'audio/x-m4a',
    ]);
    if (!audioBase64 || !allowedAudio.has(rawMime)) {
      return jsonResponse({ error: 'Invalid voice audio payload.' }, 400);
    }
    const approxBytes = Math.ceil((audioBase64.length * 3) / 4);
    if (approxBytes > 2 * 1024 * 1024) {
      return jsonResponse({ error: 'Voice clip is too long. Please keep recordings under 45 seconds.' }, 400);
    }
    const langHint = String(body?.lang || 'en-PK');
    const transcribePrompt =
      langHint.toLowerCase().startsWith('ur')
        ? 'Transcribe this student voice clip cleanly. Preserve Urdu, Roman Urdu, English, and physics/math terms. Return ONLY the transcript text.'
        : 'Transcribe this student voice clip cleanly in English (or Roman Urdu if spoken). Preserve math and physics terms. Return ONLY the transcript text.';

    const audioModels = ['gemini-3.5-transcribe', 'gemini-3.1-flash-lite'];
    for (const audioModel of audioModels) {
      try {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            audioModel
          )}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKeyForAudio,
              'User-Agent': 'aistudio-build',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType: rawMime, data: audioBase64 } },
                    { text: transcribePrompt },
                  ],
                },
              ],
            }),
          },
          18_000
        );
        if (!res.ok) continue;
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const transcript = parts
          .filter((p) => p && typeof p.text === 'string')
          .map((p) => p.text)
          .join(' ')
          .trim();
        return jsonResponse({ transcript, model: audioModel });
      } catch {
        continue;
      }
    }
    return jsonResponse({ error: 'Could not transcribe voice clip right now.' }, 502);
  }

  // Validate POST payload synchronously BEFORE any Firestore reads
  let mentorId = 0;
  let depthId = 1;
  let depthCfg = aiConfig.DEPTHS[1];
  let executionPlan = null;
  let validatedContents = null;
  let requestId = '';
  let wantStream = true;
  let latestUserText = '';
  let sceneCacheHash = '';
  let cachedSceneEntry = null;

  if (request.method === 'POST') {
    const apiKeyCheck = resolveGeminiApiKey(env);
    if (!apiKeyCheck) {
      return jsonResponse(
        {
          error:
            'Server configuration incomplete: GEMINI_API_KEY is not configured in the server environment.',
          code: 'MISSING_GEMINI_API_KEY',
        },
        503
      );
    }

    const maxMentorIdx = aiConfig.MENTORS.length - 1;
    mentorId = parseStrictMentorId(body?.mentor);
    if (mentorId < 0 || mentorId > maxMentorIdx) {
      return jsonResponse({ error: `Invalid mentor selection (expected 0–${maxMentorIdx}).` }, 400);
    }

    // Strict server-side depth validation — never trust client model params
    depthId = parseStrictDepthId(body?.depth);
    if (depthId < 0 || depthId >= aiConfig.DEPTHS.length) {
      return jsonResponse({ error: 'Invalid answer depth (expected 0–3).' }, 400);
    }
    depthCfg = aiConfig.DEPTHS[depthId];

    const validated = validateAndSanitizeContents(body?.contents);
    if (validated.error || !validated.contents) {
      return jsonResponse({ error: validated.error || 'Invalid conversation payload.' }, 400);
    }
    validatedContents = validated.contents;
    latestUserText = getLatestUserTextFromContents(validatedContents);

    // Parallel / synchronous cache lookup for Aisha physics scenes (<0.02ms)
    if (mentorId === AISHA_MENTOR_ID && latestUserText) {
      sceneCacheHash = hashPhysicsQuestion(latestUserText, depthId);
      cachedSceneEntry = getCachedAishaScene(sceneCacheHash);
    }

    requestId =
      typeof body?.requestId === 'string' && body.requestId.trim().length >= 8
        ? body.requestId.trim().slice(0, 96)
        : `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const acceptHeader = String(request.headers.get('Accept') || '').toLowerCase();
    wantStream = body?.stream !== false && (body?.stream === true || acceptHeader.includes('text/event-stream'));
  }

  let accessToken = null;
  let baseUrl = '';
  let usageDocPath = '';
  let planInfo;
  let creditsUsed = 0;
  let aishaAnimatedUsed = 0;

  // 2. Superadmin Unlimited path: verified cryptographically from signed Firebase ID token.
  //    Still follows exact same DEPTH LAWS, simply skips credit deduction & Firestore overhead.
  if (authUser.isSuperAdmin) {
    let superAdminPlanCredits = getFallbackPlansCredits();
    if (sa && mentorId === AISHA_MENTOR_ID) {
      const saTokenRes = await saTokenPromise;
      if (typeof saTokenRes === 'string') {
        superAdminPlanCredits = await fetchPlansCreditsConfig(
          firestoreDocBaseUrl(projectId, databaseId),
          saTokenRes
        );
      }
    }
    planInfo = {
      plan: 'plus',
      isPro: true,
      isPlus: true,
      isPaid: true,
      isSuperAdmin: true,
      isUnlimited: true,
      deepMaxUnlocked: true,
      source: 'superadmin',
      dailyLimit: superAdminPlanCredits.plus,
      planCredits: superAdminPlanCredits,
    };
  } else {
    if (!sa) {
      return jsonResponse(
        {
          error:
            'Server configuration incomplete: FIREBASE_SERVICE_ACCOUNT is not configured for AI Mentors credit enforcement.',
          code: 'MISSING_SERVICE_ACCOUNT',
        },
        503
      );
    }

    const saTokenRes = await saTokenPromise;
    if (!saTokenRes || typeof saTokenRes !== 'string') {
      return jsonResponse(
        { error: 'Unable to authenticate with database service. Please try again shortly.' },
        503
      );
    }
    accessToken = saTokenRes;
    baseUrl = firestoreDocBaseUrl(projectId, databaseId);
    usageDocPath = `users/${encodeURIComponent(authUser.uid)}/aiUsage/${encodeURIComponent(dateKey)}`;

    try {
      const usageCacheKey = `${authUser.uid}:${dateKey}`;
      const cachedUsage = request.method === 'POST' ? dailyUsageCache.get(usageCacheKey) : null;
      const usageHit = cachedUsage && cachedUsage.expiresAt > Date.now();

      // Run plan resolution (cached 30s) and daily usage read (cached 20s on POST) in PARALLEL!
      const [resolvedPlan, existingUsage] = await Promise.all([
        resolveUserPlanFromFirestore(baseUrl, accessToken, authUser, request.method === 'GET'),
        usageHit
          ? Promise.resolve({
              creditsUsed: cachedUsage.creditsUsed,
              aishaAnimatedCount: cachedUsage.aishaAnimatedCount || 0,
            })
          : getFirestoreDoc(baseUrl, accessToken, usageDocPath).catch(() => null),
      ]);
      planInfo = resolvedPlan;
      creditsUsed = Math.max(0, Number(existingUsage?.creditsUsed || 0));
      aishaAnimatedUsed = Math.max(
        Number(existingUsage?.aishaAnimatedCount || 0),
        aishaDailyAnimatedUsage.get(usageCacheKey) || 0
      );
      if (!usageHit) {
        dailyUsageCache.set(usageCacheKey, {
          creditsUsed,
          aishaAnimatedCount: aishaAnimatedUsed,
          expiresAt: Date.now() + DAILY_USAGE_CACHE_TTL_MS,
        });
      }
    } catch {
      return jsonResponse(
        { error: 'Could not verify your subscription status. Please try again.' },
        503
      );
    }
  }

  const reserveKey = `${authUser.uid}:${dateKey}`;
  const currentlyReserved = planInfo.isUnlimited ? 0 : inFlightReservedCredits.get(reserveKey) || 0;
  const effectiveCreditsUsed = creditsUsed + currentlyReserved;
  const creditsLeft = planInfo.isUnlimited
    ? planInfo.dailyLimit
    : Math.max(0, planInfo.dailyLimit - effectiveCreditsUsed);

  // GET /api/ai -> Live credit & plan summary
  if (request.method === 'GET') {
    return jsonResponse({
      creditsUsed,
      creditsLeft: planInfo.isUnlimited
        ? planInfo.dailyLimit
        : Math.max(0, planInfo.dailyLimit - creditsUsed),
      dailyLimit: planInfo.dailyLimit,
      isUnlimited: planInfo.isUnlimited,
      isPro: planInfo.isPro,
      isPlus: Boolean(planInfo.isPlus),
      isPaid: Boolean(planInfo.isPaid ?? planInfo.isPro),
      isSuperAdmin: planInfo.isSuperAdmin,
      deepMaxUnlocked: planInfo.deepMaxUnlocked,
      plan: planInfo.plan,
      source: planInfo.source,
      dateKey,
      resetAt,
    });
  }

  // 3. Enforce plan depth gate & determine Aisha visual mode + exact credit cost
  if (!depthCfg.freeAllowed && !planInfo.deepMaxUnlocked) {
    return jsonResponse(
      {
        error: `${depthCfg.label} thinking is unlocked on Boardly Pro and Boardly Plus. Upgrade to unlock Deep & Max thinking.`,
        code: 'PRO_DEPTH_REQUIRED',
        creditsLeft,
        dailyLimit: planInfo.dailyLimit,
        resetAt,
      },
      403
    );
  }

  const isAisha = mentorId === AISHA_MENTOR_ID;
  const adminAishaAnimationsOn = planInfo.planCredits?.aishaAnimationsEnabled !== false;
  const aishaDailyLimit = planInfo.isUnlimited
    ? 9999
    : planInfo.isPaid
      ? Number(aiConfig.AISHA_VISUAL_CONFIG?.dailyLimits?.paid ?? 50)
      : Number(aiConfig.AISHA_VISUAL_CONFIG?.dailyLimits?.free ?? 5);
  const aishaWithinDailyCap = aishaAnimatedUsed < aishaDailyLimit;
  const useAishaVisualMode =
    isAisha &&
    adminAishaAnimationsOn &&
    body?.visualEnabled !== false &&
    aishaWithinDailyCap &&
    isPhysicsVisualQuery(latestUserText);

  // Single shared depth execution plan used identically by all 6 AI mentors
  executionPlan = resolveAiDepthExecution({
    mentorId,
    depthId,
    env,
    isModelInCooldown: (m) => isModelInCooldown(m),
    visualMode: useAishaVisualMode,
    questionText: latestUserText,
    avoidPreviousRefusal: isAisha ? aishaLastRefusalByUser.get(authUser.uid) || '' : '',
  });

  const isSceneCacheHit = Boolean(useAishaVisualMode && cachedSceneEntry);
  const cost = computeServerMessageCost(depthId, validatedContents, {
    mentorId,
    visualMode: useAishaVisualMode,
    cacheHit: isSceneCacheHit,
  });
  const textFallbackCost = computeServerMessageCost(depthId, validatedContents, {
    mentorId,
    visualMode: false,
    cacheHit: false,
  });

  if (!planInfo.isUnlimited && creditsLeft < cost) {
    const pc = planInfo.planCredits || getFallbackPlansCredits();
    const zeroMsg =
      planInfo.plan === 'plus'
        ? `You have used all ${planInfo.dailyLimit} AI Mentor credits for today. Your credits reset at midnight PKT.`
        : planInfo.plan === 'pro'
        ? `You have used all ${planInfo.dailyLimit} Pro credits for today. Upgrade to Boardly Plus for ${pc.plus} credits/day or wait for the midnight PKT reset.`
        : `You have used all ${planInfo.dailyLimit} Free credits for today. Upgrade to Boardly Pro (${pc.pro}/day) or Boardly Plus (${pc.plus}/day), or wait for the midnight PKT reset.`;
    return jsonResponse(
      {
        error:
          creditsLeft === 0
            ? zeroMsg
            : `This message needs ${cost} credits, but you only have ${creditsLeft} left today.`,
        code: 'INSUFFICIENT_CREDITS',
        cost,
        creditsLeft,
        dailyLimit: planInfo.dailyLimit,
        plan: planInfo.plan,
        resetAt,
      },
      402
    );
  }

  // Reserve credits in-memory immediately (0ms latency) so parallel requests cannot bypass cap
  if (!planInfo.isUnlimited) {
    inFlightReservedCredits.set(reserveKey, currentlyReserved + cost);
  }

  let reservationReleased = false;
  const releaseReservation = () => {
    if (reservationReleased || planInfo.isUnlimited) return;
    reservationReleased = true;
    const cur = inFlightReservedCredits.get(reserveKey) || 0;
    const next = Math.max(0, cur - cost);
    if (next === 0) inFlightReservedCredits.delete(reserveKey);
    else inFlightReservedCredits.set(reserveKey, next);
  };

  // Idempotent atomic credit deduction — supports delayed visual-mode deduction (charge ONLY after scene validates)
  let deductionPromise = null;
  let deductedFinalUsed = creditsUsed;
  const triggerAtomicDeductionOnce = (overrideDelta = cost, aishaAnimatedDelta = 0) => {
    if (aishaAnimatedDelta > 0) {
      const nextCount = (aishaDailyAnimatedUsage.get(reserveKey) || aishaAnimatedUsed) + aishaAnimatedDelta;
      aishaDailyAnimatedUsage.set(reserveKey, nextCount);
    }
    if (planInfo.isUnlimited || overrideDelta <= 0) {
      releaseReservation();
      return Promise.resolve(creditsUsed);
    }
    if (deductionPromise) return deductionPromise;

    pruneIdempotencyCache();
    const prevDeducted = deductedRequestCache.get(requestId);
    if (prevDeducted) {
      deductedFinalUsed = prevDeducted.creditsUsed;
      deductionPromise = Promise.resolve(prevDeducted.creditsUsed);
      return deductionPromise;
    }

    const predictedUsed = creditsUsed + overrideDelta;
    deductedFinalUsed = predictedUsed;
    deductedRequestCache.set(requestId, { ts: Date.now(), creditsUsed: predictedUsed });

    deductionPromise = atomicIncrementFirestoreCredits({
      projectId,
      databaseId,
      accessToken,
      docPath: usageDocPath,
      delta: overrideDelta,
      aishaAnimatedDelta,
      dailyLimit: planInfo.dailyLimit,
      dateKey,
      requestId,
    })
      .then((serverUsed) => {
        if (typeof serverUsed === 'number' && Number.isFinite(serverUsed)) {
          deductedFinalUsed = serverUsed;
          deductedRequestCache.set(requestId, { ts: Date.now(), creditsUsed: serverUsed });
          dailyUsageCache.set(reserveKey, {
            creditsUsed: serverUsed,
            aishaAnimatedCount: aishaDailyAnimatedUsage.get(reserveKey) || aishaAnimatedUsed,
            expiresAt: Date.now() + DAILY_USAGE_CACHE_TTL_MS,
          });
        }
        return deductedFinalUsed;
      })
      .catch((err) => {
        console.warn('[AI Mentor] Atomic credit commit warning:', err?.message || err);
        return deductedFinalUsed;
      })
      .finally(() => {
        releaseReservation();
      });

    return deductionPromise;
  };

  // ── 3B. Aisha Visual Physics Scene Cache Hit Fast Path (1 credit, instant!) ──
  if (isSceneCacheHit && cachedSceneEntry) {
    const cachedText = cachedSceneEntry.sceneJson;
    const finalUsed = await triggerAtomicDeductionOnce(cost, 1);
    const finalCreditsLeft = planInfo.isUnlimited
      ? planInfo.dailyLimit
      : Math.max(0, planInfo.dailyLimit - finalUsed);
    const tEnd = Date.now();
    const timings = {
      ttfbMs: tEnd - tStart,
      ttftMs: tEnd - tStart,
      totalMs: tEnd - tStart,
      authDbMs: tEnd - tStart,
    };

    recordAishaVisualTelemetry({
      dateKey,
      depthKey: executionPlan.depthKey,
      tokens: 0,
      costUsd: 0,
      cacheHit: true,
    });

    if (!wantStream) {
      return jsonResponse({
        text: cachedText,
        creditsLeft: finalCreditsLeft,
        creditsUsed: finalUsed,
        dailyLimit: planInfo.dailyLimit,
        isUnlimited: planInfo.isUnlimited,
        cost: planInfo.isUnlimited ? 0 : cost,
        depth: depthId,
        model: 'aisha-scene-cache',
        isVisualScene: true,
        cacheHit: true,
        tokensUsed: 0,
        estimatedCostUsd: 0,
        resetAt,
        dateKey,
        timings,
      });
    }

    const enc = new TextEncoder();
    const cachedStream = new ReadableStream({
      start(controller) {
        const push = (ev, data) =>
          controller.enqueue(enc.encode(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`));
        push('meta', {
          model: 'aisha-scene-cache',
          depth: depthId,
          depthKey: executionPlan.depthKey,
          visualMode: true,
          cacheHit: true,
          cost: planInfo.isUnlimited ? 0 : cost,
          ttfbMs: timings.ttfbMs,
        });
        push('delta', { text: cachedText });
        push('done', {
          text: cachedText,
          creditsLeft: finalCreditsLeft,
          creditsUsed: finalUsed,
          dailyLimit: planInfo.dailyLimit,
          isUnlimited: planInfo.isUnlimited,
          cost: planInfo.isUnlimited ? 0 : cost,
          depth: depthId,
          depthKey: executionPlan.depthKey,
          model: 'aisha-scene-cache',
          isVisualScene: true,
          cacheHit: true,
          tokensUsed: 0,
          estimatedCostUsd: 0,
          resetAt,
          dateKey,
          timings,
        });
        controller.close();
      },
    });
    return new Response(cachedStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        ...CORS_HEADERS,
      },
    });
  }

  // 4. Invoke Gemini with streaming (:streamGenerateContent?alt=sse) + automatic failover
  const apiKey = resolveGeminiApiKey(env);
  const modelCandidates = executionPlan.modelCandidates;
  const systemInstructionText = executionPlan.systemInstruction;
  const geminiContents = trimContentsForDepth(validatedContents, executionPlan.maxHistoryMessages);

  console.log(
    `[AI Mentor Server] request start requestId=${requestId} uid=${authUser.uid} plan=${planInfo.plan} ` +
      `mentor=${mentorId}(${executionPlan.mentorSlug}) depth=${executionPlan.depthKey} thinking=${executionPlan.thinkingLevel} ` +
      `visual=${useAishaVisualMode} stream=${wantStream} turns=${geminiContents.length}/${validatedContents.length} ` +
      `candidates=${modelCandidates.join(',')}`
  );

  const invokeGeminiStream = async (modelName, includeThinkingConfig, timeoutMs) => {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:streamGenerateContent?alt=sse`;

    const generationConfig = buildModelGenerationConfig(
      modelName,
      {
        maxOutputTokens: executionPlan.maxOutputTokens,
        thinkingLevel: executionPlan.rawThinkingLevel,
        responseMimeType: executionPlan.responseMimeType,
      },
      includeThinkingConfig
    );

    return await fetchWithTimeout(
      geminiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstructionText }],
          },
          contents: geminiContents,
          generationConfig,
        }),
      },
      timeoutMs
    );
  };

  // Single-shot helper used ONLY for Aisha visual schema repair retry (max 1 retry) or warm text fallback
  const invokeGeminiSingleShot = async ({
    modelName,
    systemText,
    contentsPayload,
    maxTokens,
    responseMimeType = null,
    timeoutMs = 14_000,
  }) => {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents: contentsPayload,
          generationConfig: buildModelGenerationConfig(
            modelName,
            { maxOutputTokens: maxTokens, thinkingLevel: 'NONE', responseMimeType },
            false
          ),
        }),
      },
      timeoutMs
    );
    if (!res.ok) return { text: '', inputTokens: 0, outputTokens: 0 };
    const data = await res.json().catch(() => ({}));
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts
      .filter((p) => p && p.thought !== true && typeof p.text === 'string')
      .map((p) => p.text)
      .join('')
      .trim();
    const meta = data?.usageMetadata || {};
    return {
      text,
      inputTokens: Number(meta.promptTokenCount || 0),
      outputTokens: Number(meta.candidatesTokenCount || 0),
    };
  };

  const tGeminiStart = Date.now();
  const MAX_UPSTREAM_SELECT_BUDGET_MS = 32_000;
  let usedModel = modelCandidates[0] || executionPlan.model;
  let geminiRes = null;
  let lastErrorBody = '';
  let lastErrorStatus = 0;
  let lastErrorWasTimeout = false;

  for (let idx = 0; idx < modelCandidates.length; idx++) {
    const candidateModel = modelCandidates[idx];
    const elapsedSelectMs = Date.now() - tGeminiStart;
    const remainingBudgetMs = MAX_UPSTREAM_SELECT_BUDGET_MS - elapsedSelectMs;
    if (idx > 0 && remainingBudgetMs < 4_000) {
      console.warn(
        `[AI Mentor Server] failover budget exhausted requestId=${requestId} elapsed=${elapsedSelectMs}ms`
      );
      break;
    }

    const hasMoreFallbacks = idx < modelCandidates.length - 1;
    // Fast header timeout on first candidate when fallbacks exist so a hung upstream fails over quickly
    const attemptTimeoutMs = Math.min(
      remainingBudgetMs,
      hasMoreFallbacks && idx === 0 ? executionPlan.firstAttemptTimeoutMs : 15_000
    );

    const tAttempt = Date.now();
    usedModel = candidateModel;

    try {
      let res = await invokeGeminiStream(candidateModel, true, attemptTimeoutMs);

      if (res.status === 400 && modelSupportsThinkingConfig(candidateModel)) {
        const err400 = await res.text().catch(() => '');
        console.warn(
          `[AI Mentor Server] HTTP 400 with thinkingConfig requestId=${requestId} model=${candidateModel} retrying without thinkingConfig: ${err400.slice(0, 160)}`
        );
        lastErrorBody = err400;
        res = await invokeGeminiStream(candidateModel, false, Math.min(10_000, attemptTimeoutMs));
      }

      const attemptMs = Date.now() - tAttempt;
      if (res.ok) {
        geminiRes = res;
        console.log(
          `[AI Mentor Server] upstream ready requestId=${requestId} model=${candidateModel} status=${res.status} ttfb=${attemptMs}ms`
        );
        break;
      }

      lastErrorStatus = res.status;
      lastErrorBody = await res.text().catch(() => '');
      lastErrorWasTimeout = false;
      console.warn(
        `[AI Mentor Server] upstream non-OK requestId=${requestId} model=${candidateModel} status=${res.status} elapsed=${attemptMs}ms body=${lastErrorBody.slice(0, 180)}`
      );

      // Auth errors won't be fixed by switching models
      if (res.status === 401 || res.status === 403) {
        geminiRes = res;
        break;
      }

      // Retryable upstream status -> cool down this model & try next candidate
      if (
        res.status === 404 ||
        res.status === 429 ||
        res.status === 500 ||
        res.status === 502 ||
        res.status === 503 ||
        res.status === 504
      ) {
        markModelUnhealthy(candidateModel, `HTTP_${res.status}`);
        continue;
      }

      // Non-retryable 4xx (e.g. invalid request payload)
      geminiRes = res;
      break;
    } catch (err) {
      const attemptMs = Date.now() - tAttempt;
      const isTimeout = err?.name === 'AbortError';
      lastErrorWasTimeout = isTimeout;
      lastErrorStatus = isTimeout ? 504 : 502;
      lastErrorBody = err?.message || String(err);
      console.warn(
        `[AI Mentor Server] upstream ${isTimeout ? 'timeout' : 'network error'} requestId=${requestId} model=${candidateModel} elapsed=${attemptMs}ms err=${lastErrorBody}`
      );
      markModelUnhealthy(candidateModel, isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR');
      continue;
    }
  }

  const tTtfb = Date.now();

  if (!geminiRes) {
    releaseReservation();
    console.error(
      `[AI Mentor Server] all models failed requestId=${requestId} lastStatus=${lastErrorStatus} timeout=${lastErrorWasTimeout} total=${tTtfb - tStart}ms`
    );
    if (lastErrorStatus === 429) {
      return jsonResponse({ error: 'Too many requests. Try again in a minute.', code: 'RATE_LIMITED' }, 429);
    }
    return jsonResponse(
      {
        error: lastErrorWasTimeout
          ? 'The AI Mentor took too long to respond. Your credits were not used — please tap Retry.'
          : 'The AI service is temporarily overloaded. Your credits were not used — please tap Retry.',
        code: lastErrorWasTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
      },
      lastErrorWasTimeout ? 504 : 503
    );
  }

  if (!geminiRes.ok) {
    releaseReservation();
    const errText = lastErrorBody || (await geminiRes.text().catch(() => ''));
    let upstreamMessage = '';
    try {
      const parsed = JSON.parse(errText);
      upstreamMessage = String(parsed?.error?.message || '').trim();
    } catch {
      // ignore non-JSON error body
    }
    console.error(
      `[AI Mentor Server] returning error requestId=${requestId} model=${usedModel} status=${geminiRes.status} msg=${upstreamMessage.slice(0, 180)}`
    );
    if (geminiRes.status === 429) {
      return jsonResponse({ error: 'Too many requests. Try again in a minute.', code: 'RATE_LIMITED' }, 429);
    }
    if (geminiRes.status === 401 || geminiRes.status === 403) {
      return jsonResponse(
        {
          error: 'AI service key was rejected by upstream provider. Your credits were not used.',
          code: 'UPSTREAM_AUTH_ERROR',
        },
        502
      );
    }
    return jsonResponse(
      {
        error: upstreamMessage
          ? `AI Mentor error (HTTP ${geminiRes.status}): ${upstreamMessage.slice(0, 180)}`
          : 'The AI Mentor hit a temporary snag. Your credits were not used — please tap Retry.',
        code: 'UPSTREAM_ERROR',
      },
      502
    );
  }

  // Helper to iterate non-thought text deltas from Gemini SSE stream with strict inactivity + total deadlines
  async function* readGeminiSseDeltas(
    bodyStream,
    { chunkTimeoutMs = 20_000, totalStreamTimeoutMs = 45_000 } = {}
  ) {
    const reader = bodyStream.getReader();
    const decoder = new TextDecoder();
    const streamStartedAt = Date.now();
    let buffer = '';

    const readChunkWithDeadline = async () => {
      const remainingTotal = totalStreamTimeoutMs - (Date.now() - streamStartedAt);
      if (remainingTotal <= 0) {
        const err = new Error('The AI Mentor took too long to finish replying. Please tap Retry.');
        err.code = 'STREAM_TIMEOUT';
        throw err;
      }
      const waitMs = Math.min(chunkTimeoutMs, remainingTotal);
      let timerId = null;
      try {
        return await Promise.race([
          reader.read(),
          new Promise((_, reject) => {
            timerId = setTimeout(() => {
              const err = new Error('The AI Mentor stopped responding mid-reply. Please tap Retry.');
              err.code = 'STREAM_TIMEOUT';
              reject(err);
            }, waitMs);
          }),
        ]);
      } finally {
        if (timerId !== null) clearTimeout(timerId);
      }
    };

    try {
      while (true) {
        const { done, value } = await readChunkWithDeadline();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          let parsed;
          try {
            parsed = JSON.parse(jsonStr);
          } catch {
            continue;
          }
          const candidate = parsed?.candidates?.[0];
          const parts = candidate?.content?.parts || [];
          const usageMeta = parsed?.usageMetadata || null;
          let chunkText = '';
          for (const p of parts) {
            if (p && p.thought !== true && typeof p.text === 'string' && p.text.length > 0) {
              chunkText += p.text;
            }
          }
          if (chunkText || usageMeta) {
            yield { text: chunkText, finishReason: candidate?.finishReason, usageMeta };
          }
        }
      }
      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().slice(5).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const parts = parsed?.candidates?.[0]?.content?.parts || [];
            const chunkText = parts
              .filter((p) => p && p.thought !== true && typeof p.text === 'string')
              .map((p) => p.text)
              .join('');
            if (chunkText || parsed?.usageMetadata) {
              yield { text: chunkText, usageMeta: parsed?.usageMetadata || null };
            }
          } catch {
            // ignore trailing partial
          }
        }
      }
    } catch (err) {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      throw err;
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // ignore
      }
    }
  }

  // Validates Aisha's visual scene JSON; retries ONCE on invalid schema; falls back to text & refunds visual credits if still invalid
  const finalizeAishaVisualResponse = async (rawText, inputTokens, outputTokens) => {
    let totalIn = inputTokens;
    let totalOut = outputTokens;
    let check = validatePhysicsScene(rawText, executionPlan.maxSteps);

    if (!check.valid) {
      console.warn(
        `[Aisha Visual] Schema invalid on first pass (${check.error}); retrying ONCE requestId=${requestId}`
      );
      const retryModel = executionPlan.modelCandidates[0] || usedModel;
      const retryRes = await invokeGeminiSingleShot({
        modelName: retryModel,
        systemText: systemInstructionText,
        contentsPayload: [
          ...geminiContents,
          {
            role: 'user',
            parts: [
              {
                text: `Previous output failed validation (${check.error}). Return ONLY valid raw JSON matching {"title":"...","steps":[{"from":0,"to":3,"narration":"...","equation":"..."}],"animationSvg":"<svg viewBox=\\"0 0 380 240\\">...</svg>"} (plus optional "graph" if a graph was requested) with at most ${executionPlan.maxSteps} steps, SVG under 5.5 KB, NO <script>, NO <foreignObject>, NO on* attributes, and NO external URLs.`,
              },
            ],
          },
        ],
        maxTokens: executionPlan.maxOutputTokens,
        responseMimeType: 'application/json',
      });
      totalIn += retryRes.inputTokens;
      totalOut += retryRes.outputTokens;
      check = validatePhysicsScene(retryRes.text, executionPlan.maxSteps);
    }

    const totalTokens =
      totalIn + totalOut || Math.ceil((rawText.length + latestUserText.length) / 4);
    const estCostUsd = estimateGeminiCostUsd(usedModel, totalIn || Math.round(totalTokens * 0.35), totalOut || Math.round(totalTokens * 0.65));

    if (check.valid && check.scene) {
      const cleanJson = JSON.stringify(check.scene);
      if (sceneCacheHash) {
        setCachedAishaScene(sceneCacheHash, check.scene, executionPlan.depthKey);
      }
      recordAishaVisualTelemetry({
        dateKey,
        depthKey: executionPlan.depthKey,
        tokens: totalTokens,
        costUsd: estCostUsd,
        cacheHit: false,
      });
      return {
        isVisualScene: true,
        text: cleanJson,
        replaced: cleanJson !== rawText.trim(),
        chargeDelta: cost,
        aishaAnimatedDelta: 1,
        tokensUsed: totalTokens,
        estimatedCostUsd: estCostUsd,
      };
    }

    // Both attempts failed schema validation -> DO NOT charge visual credits; fall back cleanly to warm text answer
    console.warn(
      `[Aisha Visual] Retry failed (${check.error}); refunding visual credits and falling back to text requestId=${requestId}`
    );
    const textPlan = resolveAiDepthExecution({
      mentorId: AISHA_MENTOR_ID,
      depthId,
      env,
      isModelInCooldown: (m) => isModelInCooldown(m),
      visualMode: false,
      questionText: latestUserText,
    });
    const fallbackRes = await invokeGeminiSingleShot({
      modelName: textPlan.modelCandidates[0] || usedModel,
      systemText: textPlan.systemInstruction,
      contentsPayload: geminiContents,
      maxTokens: Math.min(1200, textPlan.maxOutputTokens),
      responseMimeType: null,
    });
    const fallbackText =
      fallbackRes.text ||
      'I had trouble sketching that diagram right now, so let me walk you through it in words — could you share which part you want me to break down first?';
    const fbTokens = totalTokens + fallbackRes.inputTokens + fallbackRes.outputTokens;
    const fbCostUsd = Number(
      (
        estCostUsd +
        estimateGeminiCostUsd(usedModel, fallbackRes.inputTokens, fallbackRes.outputTokens)
      ).toFixed(6)
    );
    recordAishaVisualTelemetry({
      dateKey,
      depthKey: executionPlan.depthKey,
      tokens: fbTokens,
      costUsd: fbCostUsd,
      cacheHit: false,
      textFallback: true,
    });
    return {
      isVisualScene: false,
      text: fallbackText,
      replaced: true,
      chargeDelta: fallbackRes.text ? textFallbackCost : 0,
      aishaAnimatedDelta: 0,
      tokensUsed: fbTokens,
      estimatedCostUsd: fbCostUsd,
    };
  };

  // 5A. Non-streaming JSON mode (backwards-compatible when stream: false)
  if (!wantStream || !geminiRes.body) {
    let fullText = '';
    let tFirstToken = null;
    let lastUsageMeta = null;
    try {
      for await (const item of readGeminiSseDeltas(geminiRes.body)) {
        if (item.usageMeta) lastUsageMeta = item.usageMeta;
        if (!item.text) continue;
        if (tFirstToken === null) {
          tFirstToken = Date.now();
          if (!useAishaVisualMode) {
            void triggerAtomicDeductionOnce();
          }
        }
        fullText += item.text;
      }
    } catch (err) {
      releaseReservation();
      console.error(
        `[AI Mentor Server] JSON stream error requestId=${requestId} model=${usedModel} code=${err?.code || 'STREAM_ERROR'} err=${err?.message || err}`
      );
      return jsonResponse(
        {
          error: err?.message || 'The AI stream was interrupted. Please tap Retry.',
          code: err?.code || 'STREAM_ERROR',
        },
        err?.code === 'STREAM_TIMEOUT' ? 504 : 502
      );
    }

    let answerText = fullText.trim();
    let finalIsVisualScene = false;
    let finalChargeDelta = cost;
    let finalAishaAnimatedDelta = 0;
    let tokensUsed;
    let estimatedCostUsd;

    if (useAishaVisualMode) {
      const finalized = await finalizeAishaVisualResponse(
        answerText,
        Number(lastUsageMeta?.promptTokenCount || 0),
        Number(lastUsageMeta?.candidatesTokenCount || 0)
      );
      answerText = finalized.text;
      finalIsVisualScene = finalized.isVisualScene;
      finalChargeDelta = finalized.chargeDelta;
      finalAishaAnimatedDelta = finalized.aishaAnimatedDelta;
      tokensUsed = finalized.tokensUsed;
      estimatedCostUsd = finalized.estimatedCostUsd;
    }

    if (!answerText) {
      releaseReservation();
      console.warn(
        `[AI Mentor Server] empty answer (json) requestId=${requestId} model=${usedModel} depth=${depthCfg.key}`
      );
      return jsonResponse(
        {
          error: 'The mentor could not generate an answer for that message. Your credits were not used.',
          code: 'EMPTY_ANSWER',
        },
        502
      );
    }

    if (isAisha && !finalIsVisualScene && looksLikeRefusalText(answerText)) {
      aishaLastRefusalByUser.set(authUser.uid, answerText.slice(0, 140));
    } else if (isAisha) {
      aishaLastRefusalByUser.delete(authUser.uid);
    }

    const finalUsed = await triggerAtomicDeductionOnce(finalChargeDelta, finalAishaAnimatedDelta);
    releaseReservation();
    const finalCreditsLeft = planInfo.isUnlimited
      ? planInfo.dailyLimit
      : Math.max(0, planInfo.dailyLimit - finalUsed);

    const tEnd = Date.now();
    const timings = {
      ttfbMs: tTtfb - tStart,
      ttftMs: (tFirstToken ?? tEnd) - tStart,
      totalMs: tEnd - tStart,
      authDbMs: tGeminiStart - tStart,
    };
    console.log(
      `[AI Mentor Server] done (json) requestId=${requestId} model=${usedModel} depth=${depthCfg.key} words=${countWords(answerText)} cost=${
        planInfo.isUnlimited ? 0 : finalChargeDelta
      } visual=${finalIsVisualScene} ttfb=${timings.ttfbMs}ms ttft=${timings.ttftMs}ms total=${timings.totalMs}ms`
    );

    return jsonResponse({
      text: answerText,
      creditsLeft: finalCreditsLeft,
      creditsUsed: finalUsed,
      dailyLimit: planInfo.dailyLimit,
      isUnlimited: planInfo.isUnlimited,
      cost: planInfo.isUnlimited ? 0 : finalChargeDelta,
      depth: depthId,
      model: usedModel,
      isVisualScene: finalIsVisualScene,
      cacheHit: false,
      ...(typeof tokensUsed === 'number' ? { tokensUsed } : {}),
      ...(typeof estimatedCostUsd === 'number' ? { estimatedCostUsd } : {}),
      resetAt,
      dateKey,
      timings,
    });
  }

  // 5B. True SSE Streaming mode (zero buffering, first visible token streamed immediately)
  const encoder = new TextEncoder();
  const sseStream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // ignore already-closed controller
        }
      };
      const sendEvent = (eventName, payload) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      let fullText = '';
      let tFirstToken = null;
      let lastUsageMeta = null;
      try {
        sendEvent('meta', {
          model: usedModel,
          depth: depthId,
          depthKey: depthCfg.key,
          visualMode: useAishaVisualMode,
          cacheHit: false,
          ttfbMs: tTtfb - tStart,
        });

        for await (const item of readGeminiSseDeltas(geminiRes.body)) {
          if (item.usageMeta) lastUsageMeta = item.usageMeta;
          if (!item.text) continue;
          if (tFirstToken === null) {
            tFirstToken = Date.now();
            console.log(
              `[AI Mentor Server] first-token requestId=${requestId} model=${usedModel} visual=${useAishaVisualMode} ttft=${tFirstToken - tStart}ms`
            );
            // For non-visual mentors/text replies: fire atomic Firestore increment in parallel (0ms added to TTFT).
            // For Aisha visual mode: defer charge until full scene JSON validates (so invalid scenes NEVER charge).
            if (!useAishaVisualMode) {
              void triggerAtomicDeductionOnce();
            }
          }
          fullText += item.text;
          sendEvent('delta', { text: item.text });
        }

        let answerText = fullText.trim();
        let finalIsVisualScene = false;
        let finalChargeDelta = cost;
        let finalAishaAnimatedDelta = 0;
        let tokensUsed;
        let estimatedCostUsd;

        if (useAishaVisualMode) {
          const finalized = await finalizeAishaVisualResponse(
            answerText,
            Number(lastUsageMeta?.promptTokenCount || 0),
            Number(lastUsageMeta?.candidatesTokenCount || 0)
          );
          answerText = finalized.text;
          finalIsVisualScene = finalized.isVisualScene;
          finalChargeDelta = finalized.chargeDelta;
          finalAishaAnimatedDelta = finalized.aishaAnimatedDelta;
          tokensUsed = finalized.tokensUsed;
          estimatedCostUsd = finalized.estimatedCostUsd;
          if (finalized.replaced && answerText) {
            sendEvent('replace', { text: answerText, isVisualScene: finalIsVisualScene });
          }
        }

        if (!answerText) {
          console.warn(
            `[AI Mentor Server] empty answer (sse) requestId=${requestId} model=${usedModel} depth=${depthCfg.key} elapsed=${Date.now() - tStart}ms`
          );
          sendEvent('error', {
            error: 'The mentor could not generate an answer for that message. Your credits were not used — please tap Retry.',
            code: 'EMPTY_ANSWER',
          });
          return;
        }

        if (isAisha && !finalIsVisualScene && looksLikeRefusalText(answerText)) {
          aishaLastRefusalByUser.set(authUser.uid, answerText.slice(0, 140));
        } else if (isAisha) {
          aishaLastRefusalByUser.delete(authUser.uid);
        }

        const finalUsed = await triggerAtomicDeductionOnce(finalChargeDelta, finalAishaAnimatedDelta);
        const finalCreditsLeft = planInfo.isUnlimited
          ? planInfo.dailyLimit
          : Math.max(0, planInfo.dailyLimit - finalUsed);

        const tEnd = Date.now();
        const timings = {
          ttfbMs: tTtfb - tStart,
          ttftMs: (tFirstToken ?? tEnd) - tStart,
          totalMs: tEnd - tStart,
          authDbMs: tGeminiStart - tStart,
        };
        const words = countWords(answerText);

        console.log(
          `[AI Mentor Server] done (sse) requestId=${requestId} model=${usedModel} depth=${depthCfg.key} words=${words} cost=${
            planInfo.isUnlimited ? 0 : finalChargeDelta
          } visual=${finalIsVisualScene} ttfb=${timings.ttfbMs}ms ttft=${timings.ttftMs}ms total=${timings.totalMs}ms`
        );

        sendEvent('done', {
          text: answerText,
          creditsLeft: finalCreditsLeft,
          creditsUsed: finalUsed,
          dailyLimit: planInfo.dailyLimit,
          isUnlimited: planInfo.isUnlimited,
          cost: planInfo.isUnlimited ? 0 : finalChargeDelta,
          depth: depthId,
          depthKey: depthCfg.key,
          model: usedModel,
          wordCount: words,
          isVisualScene: finalIsVisualScene,
          cacheHit: false,
          ...(typeof tokensUsed === 'number' ? { tokensUsed } : {}),
          ...(typeof estimatedCostUsd === 'number' ? { estimatedCostUsd } : {}),
          resetAt,
          dateKey,
          timings,
        });
      } catch (err) {
        console.error(
          `[AI Mentor Server] SSE stream error requestId=${requestId} model=${usedModel} code=${err?.code || 'STREAM_ERROR'} elapsed=${Date.now() - tStart}ms err=${err?.message || err}`
        );
        if (err?.code === 'STREAM_TIMEOUT') {
          markModelUnhealthy(usedModel, 'STREAM_TIMEOUT');
        }
        sendEvent('error', {
          error: err?.message || 'The AI stream was interrupted. Please tap Retry.',
          code: err?.code || 'STREAM_ERROR',
          status: err?.code === 'STREAM_TIMEOUT' ? 504 : 502,
        });
      } finally {
        releaseReservation();
        safeClose();
      }
    },
    cancel() {
      console.log(`[AI Mentor Server] SSE cancelled by client requestId=${requestId}`);
      releaseReservation();
    },
  });

  return new Response(sseStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      ...CORS_HEADERS,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  return handleAiMentorsRequest(context.request, context.env);
}

export async function onRequestPost(context) {
  return handleAiMentorsRequest(context.request, context.env);
}

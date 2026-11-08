/**
 * Boardly Zero-Dependency Cloudflare Worker REST API (D1 + Web Crypto RS256 Auth)
 * Compatible with pasting directly into the Cloudflare Dashboard editor.
 */

const PUBLIC_PREVIEW = true;
const GOOGLE_JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const MAX_QUESTIONS_PER_TEST = 200;
const MAX_TITLE_LEN = 200;
const MAX_TEXT_LEN = 8000;

let cachedJwks = null;
let cachedJwksExpiresAt = 0;

function base64UrlToUint8Array(base64Url) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function decodeJwtPart(part) {
  const bytes = base64UrlToUint8Array(part);
  const jsonStr = new TextDecoder().decode(bytes);
  return JSON.parse(jsonStr);
}

async function getGooglePublicJwks() {
  const now = Date.now();
  if (cachedJwks && now < cachedJwksExpiresAt) {
    return cachedJwks;
  }

  const resp = await fetch(GOOGLE_JWK_URL, {
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch Google JWKs: HTTP ${resp.status}`);
  }

  let maxAgeSec = 3600;
  const cacheControl = resp.headers.get('cache-control') || '';
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (match && match[1]) {
    maxAgeSec = Math.max(300, parseInt(match[1], 10));
  }

  const data = await resp.json();
  cachedJwks = data.keys || [];
  cachedJwksExpiresAt = now + maxAgeSec * 1000;
  return cachedJwks;
}

async function verifyFirebaseIdToken(token, projectId) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing bearer token');
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT');
  }

  const header = decodeJwtPart(parts[0]);
  const payload = decodeJwtPart(parts[1]);
  const signatureBytes = base64UrlToUint8Array(parts[2]);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported JWT algorithm or missing kid');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec - 30) {
    throw new Error('Token has expired');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Token issued in the future');
  }

  const expectedIss = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIss) {
    throw new Error('Invalid token issuer');
  }
  if (payload.aud !== projectId) {
    throw new Error('Invalid token audience');
  }

  const uid = String(payload.sub || payload.user_id || '').trim();
  if (!uid) {
    throw new Error('Token missing subject UID');
  }

  const jwks = await getGooglePublicJwks();
  let jwk = jwks.find((k) => k.kid === header.kid);
  if (!jwk) {
    cachedJwks = null;
    const freshJwks = await getGooglePublicJwks();
    jwk = freshJwks.find((k) => k.kid === header.kid);
  }
  if (!jwk) {
    throw new Error('Matching JWK public key not found');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureBytes,
    signedData
  );

  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  const emailStr = String(payload.email || '').trim().toLowerCase();
  const tokenName = String(payload.name || '').trim();
  const emailPrefix = emailStr.includes('@') ? emailStr.split('@')[0].trim() : emailStr;

  let claimRole = null;
  if (payload.role === 'superadmin' || payload.superadmin === true) {
    claimRole = 'superadmin';
  } else if (payload.role === 'admin' || payload.admin === true) {
    claimRole = 'admin';
  } else if (payload.role === 'captain' || payload.captain === true) {
    claimRole = 'captain';
  }

  return {
    uid,
    email: emailStr,
    name: tokenName || emailPrefix || 'Student',
    tokenName,
    picture: payload.picture || null,
    claimRole,
    emailVerified: Boolean(payload.email_verified),
    authTime: Number(payload.auth_time || payload.iat || 0),
    signInProvider:
      payload.firebase && payload.firebase.sign_in_provider
        ? String(payload.firebase.sign_in_provider)
        : undefined,
  };
}

function getCorsHeaders(request, env) {
  const configuredOrigin = String(env.ALLOWED_ORIGIN || 'https://boardly.cfd').trim();
  const reqOrigin = request.headers.get('Origin') || '';
  let allowOrigin = configuredOrigin;

  if (
    reqOrigin &&
    (reqOrigin === configuredOrigin ||
      reqOrigin.endsWith('.boardly.cfd') ||
      reqOrigin.endsWith('.run.app') ||
      reqOrigin.startsWith('http://localhost:'))
  ) {
    allowOrigin = reqOrigin;
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...getCorsHeaders(request, env),
    },
  });
}

function errorResponse(request, env, message, code = 'BAD_REQUEST', status = 400) {
  return jsonResponse(request, env, { error: message, code }, status);
}

function cleanStr(val, maxLen = MAX_TITLE_LEN, fallback = '') {
  if (val === undefined || val === null) return fallback;
  return String(val).trim().slice(0, maxLen);
}

let schemaEnsured = false;

async function ensureCaptainSchema(db) {
  if (schemaEnsured || !db) return;
  try {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
        rate_key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        window_start INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS user_roles (
        uid TEXT PRIMARY KEY,
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'student',
        custom_role TEXT DEFAULT NULL,
        is_posting_banned INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT 0
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS crews (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        university TEXT NOT NULL DEFAULT '',
        captain_uid TEXT NOT NULL,
        captain_name TEXT NOT NULL,
        captain_email TEXT NOT NULL DEFAULT '',
        avatar_url TEXT DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        member_count INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS crew_members (
        id TEXT PRIMARY KEY,
        crew_id TEXT NOT NULL,
        user_uid TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL DEFAULT '',
        user_avatar TEXT DEFAULT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        joined_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(crew_id, user_uid)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS captain_tests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL,
        question_count INTEGER NOT NULL DEFAULT 0,
        duration_minutes INTEGER NOT NULL DEFAULT 20,
        visibility TEXT NOT NULL DEFAULT 'public',
        status TEXT NOT NULL DEFAULT 'published',
        captain_uid TEXT NOT NULL,
        captain_name TEXT NOT NULL,
        crew_id TEXT DEFAULT NULL,
        crew_name TEXT NOT NULL DEFAULT '',
        attempts_count INTEGER NOT NULL DEFAULT 0,
        avg_score REAL NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS test_questions (
        id TEXT PRIMARY KEY,
        test_id TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL DEFAULT '[]',
        correct_index INTEGER NOT NULL DEFAULT 0,
        explanation TEXT NOT NULL DEFAULT '',
        topic TEXT NOT NULL DEFAULT 'General',
        difficulty TEXT NOT NULL DEFAULT 'medium',
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS test_attempts (
        id TEXT PRIMARY KEY,
        test_id TEXT NOT NULL,
        test_title TEXT NOT NULL,
        subject TEXT NOT NULL,
        captain_uid TEXT NOT NULL,
        captain_name TEXT NOT NULL,
        user_uid TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT DEFAULT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 0,
        percentage INTEGER NOT NULL DEFAULT 0,
        time_taken_seconds INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS attempt_answers (
        id TEXT PRIMARY KEY,
        attempt_id TEXT NOT NULL,
        test_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        selected_index INTEGER NOT NULL DEFAULT -1,
        correct_index INTEGER NOT NULL DEFAULT 0,
        is_correct INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )`),
    ]);
    await db
      .prepare('ALTER TABLE user_roles ADD COLUMN created_at INTEGER DEFAULT 0')
      .run()
      .catch(() => {});
    await db
      .prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_test_attempts_unique_user_test ON test_attempts(test_id, user_uid)')
      .run()
      .catch(() => {});
    schemaEnsured = true;
  } catch {
    // Allow queries to proceed even if schema check partially fails
  }
}

const inFlightAttemptLocks = new Set();
const ALREADY_ATTEMPTED_MESSAGE =
  'You have already taken this drill. Only one verified attempt per student is permitted for each drill.';

function resolveStudentAttemptName(frontendName, tokenName, email) {
  const fromFrontend = String(frontendName ?? '').trim();
  if (fromFrontend && fromFrontend.toLowerCase() !== 'student') {
    return fromFrontend.slice(0, 120);
  }
  const fromToken = String(tokenName ?? '').trim();
  if (fromToken && fromToken.toLowerCase() !== 'student') {
    return fromToken.slice(0, 120);
  }
  const emailStr = String(email ?? '').trim();
  const emailPrefix = emailStr.includes('@') ? emailStr.split('@')[0].trim() : emailStr;
  if (emailPrefix) {
    return emailPrefix.slice(0, 120);
  }
  if (fromFrontend) return fromFrontend.slice(0, 120);
  if (fromToken) return fromToken.slice(0, 120);
  return 'Student';
}

function resolveLeaderboardRowName(storedName, fallbackEmail) {
  const cleanStored = String(storedName ?? '').trim();
  if (cleanStored) return cleanStored;
  const emailStr = String(fallbackEmail ?? '').trim();
  if (emailStr && emailStr.includes('@')) {
    const prefix = emailStr.split('@')[0].trim();
    if (prefix) return prefix;
  }
  return 'Student';
}

async function checkWriteRateLimit(db, key, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const row = await db
    .prepare('SELECT count, window_start FROM rate_limits WHERE rate_key = ?1')
    .bind(key)
    .first();

  if (!row || now - Number(row.window_start) > windowMs) {
    await db
      .prepare(
        'INSERT INTO rate_limits (rate_key, count, window_start) VALUES (?1, 1, ?2) ON CONFLICT(rate_key) DO UPDATE SET count = 1, window_start = ?2'
      )
      .bind(key, now)
      .run();
    return true;
  }

  if (Number(row.count) >= maxRequests) {
    return false;
  }

  await db
    .prepare('UPDATE rate_limits SET count = count + 1 WHERE rate_key = ?1')
    .bind(key)
    .run();
  return true;
}

const SUPERADMIN_UIDS = new Set([
  'A5YMRimdHRcmeDWutxtUGt2e4hf2',
  'jJfb1nThG1X9phL8fFDZ0G0J7m33',
]);
const SUPERADMIN_EMAILS = new Set([
  'shsvirtualadmin@gmail.com',
  'support@boardly.cfd',
  'scholariosupport@gmail.com',
]);

function extractWorkerGuestToken(request) {
  const headerToken = (request.headers.get('X-Guest-Session') || '').trim();
  if (headerToken) {
    return headerToken.startsWith('guest_guest_') ? headerToken.slice('guest_'.length) : headerToken;
  }
  const authHeader = (request.headers.get('Authorization') || '').trim();
  if (authHeader.startsWith('Bearer guest_')) {
    const raw = authHeader.slice('Bearer '.length).trim();
    return raw.startsWith('guest_guest_') ? raw.slice('guest_'.length) : raw;
  }
  const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie') || '';
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)boardly_guest_session=([^;]+)/);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1].trim());
      } catch {
        return match[1].trim();
      }
    }
  }
  return null;
}

async function computeWorkerGuestTokenHmac(rawToken, env) {
  const secret =
    (env && (env.OTP_HMAC_SECRET || env.EMAIL_VERIFICATION_SECRET || env.INTERNAL_EMAIL_SECRET)) ||
    'boardly-default-otp-hmac-secret-v1-do-not-expose';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret).trim()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`guest_session:v1:${rawToken}`));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function resolveWorkerGuestUser(request, env) {
  if (!env || !env.DB) return null;
  const rawToken = extractWorkerGuestToken(request);
  if (!rawToken || rawToken.length < 16) return null;
  try {
    const tokenHash = await computeWorkerGuestTokenHmac(rawToken, env);
    const now = Date.now();
    const sess = await env.DB.prepare(
      'SELECT session_id, uid, expires_at, revoked FROM guest_sessions WHERE token_hash = ?1 LIMIT 1'
    )
      .bind(tokenHash)
      .first();
    if (!sess || Number(sess.revoked) === 1 || Number(sess.expires_at) <= now) {
      return null;
    }
    const gRow = await env.DB.prepare('SELECT * FROM guest_accounts WHERE uid = ?1 LIMIT 1')
      .bind(sess.uid)
      .first();
    if (
      !gRow ||
      Number(gRow.is_guest) !== 1 ||
      Boolean(gRow.upgraded_to_uid) ||
      Number(gRow.is_suspended) === 1
    ) {
      return null;
    }
    const newExpiresAt = now + 30 * 24 * 60 * 60 * 1000;
    await env.DB.prepare(
      'UPDATE guest_sessions SET last_active_at = ?1, expires_at = ?2 WHERE session_id = ?3'
    )
      .bind(now, newExpiresAt, sess.session_id)
      .run()
      .catch(() => {});
    await env.DB.prepare('UPDATE guest_accounts SET last_active_at = ?1 WHERE uid = ?2')
      .bind(now, gRow.uid)
      .run()
      .catch(() => {});
    const cleanUsername = String(gRow.username || '').trim();
    const cleanName = String(gRow.display_name || cleanUsername || 'Guest').trim();
    return {
      uid: String(gRow.uid),
      email: '',
      name: cleanName,
      displayName: cleanName,
      username: cleanUsername,
      tokenName: cleanName,
      picture: null,
      accountType: 'guest',
      plan: 'free',
      role: 'student',
      customRole: 'Guest',
      isGuest: true,
      isPostingBanned: Boolean(gRow.is_suspended),
      isCaptainOrAbove: false,
      isAdminOrAbove: false,
      isSuperAdmin: false,
    };
  } catch {
    return null;
  }
}

async function authenticateRequest(request, env, requireAuth = true) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ') || authHeader.startsWith('Bearer guest_')) {
    const guestUser = await resolveWorkerGuestUser(request, env);
    if (guestUser) return guestUser;
    if (!requireAuth) return null;
    const err = new Error('Authentication required. Please sign in.');
    err.status = 401;
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  const token = authHeader.slice(7).trim();
  const projectId = String(env.FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316').trim();

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(token, projectId);
  } catch (e) {
    const guestUser = await resolveWorkerGuestUser(request, env);
    if (guestUser) return guestUser;
    if (!requireAuth) return null;
    const err = new Error(e.message || 'Invalid or expired authentication token.');
    err.status = 401;
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  if (decoded.signInProvider !== 'google.com' && env.DB) {
    let sessionVerified = false;
    try {
      const sessionRow = await env.DB.prepare(
        'SELECT user_id, email_verified, verified_auth_time FROM email_verification_sessions WHERE user_id = ?1 LIMIT 1'
      )
        .bind(decoded.uid)
        .first();
      if (sessionRow && Number(sessionRow.email_verified) === 1) {
        sessionVerified =
          decoded.authTime > 0
            ? Number(sessionRow.verified_auth_time || 0) + 5 >= decoded.authTime
            : true;
      }
    } catch {
      // Table may not exist yet
    }
    if (!sessionVerified && (decoded.emailVerified === false || decoded.signInProvider === 'password')) {
      if (!requireAuth) return null;
      const err = new Error('Email verification required before accessing this resource.');
      err.status = 403;
      err.code = 'EMAIL_VERIFICATION_REQUIRED';
      throw err;
    }
  }

  const extraUids = String(env.SUPERADMIN_UIDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const extraEmails = String(env.SUPERADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const isHardcodedSuperAdmin =
    SUPERADMIN_UIDS.has(decoded.uid) ||
    extraUids.includes(decoded.uid) ||
    (decoded.email && (SUPERADMIN_EMAILS.has(decoded.email.toLowerCase()) || extraEmails.includes(decoded.email.toLowerCase()))) ||
    decoded.claimRole === 'superadmin';

  const roleRow = await env.DB.prepare(
    'SELECT uid, email, role, custom_role, is_posting_banned, updated_at, created_at FROM user_roles WHERE uid = ?1'
  )
    .bind(decoded.uid)
    .first()
    .catch(() =>
      env.DB.prepare(
        'SELECT uid, email, role, custom_role, is_posting_banned, updated_at FROM user_roles WHERE uid = ?1'
      )
        .bind(decoded.uid)
        .first()
    );

  let role = isHardcodedSuperAdmin
    ? 'superadmin'
    : roleRow?.role || decoded.claimRole || 'student';

  if (!roleRow || (isHardcodedSuperAdmin && roleRow.role !== 'superadmin')) {
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
       VALUES (?1, ?2, ?3, NULL, 0, ?4, ?5)
       ON CONFLICT(uid) DO UPDATE SET role = excluded.role, email = excluded.email, updated_at = excluded.updated_at`
    )
      .bind(decoded.uid, decoded.email, role, now, now)
      .run()
      .catch(() =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at) VALUES (?1, ?2, ?3, NULL, 0, ?4)'
        )
          .bind(decoded.uid, decoded.email, role, now)
          .run()
      );
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    tokenName: decoded.tokenName || '',
    picture: decoded.picture,
    role,
    customRole: roleRow?.custom_role || null,
    isPostingBanned: Boolean(roleRow?.is_posting_banned),
    isCaptainOrAbove: ['captain', 'admin', 'superadmin'].includes(role),
    isAdminOrAbove: ['admin', 'superadmin'].includes(role),
    isSuperAdmin: role === 'superadmin',
  };
}

function requireRole(user, allowedRoles) {
  if (!user) {
    const err = new Error('Authentication required.');
    err.status = 401;
    err.code = 'UNAUTHENTICATED';
    throw err;
  }
  if (!allowedRoles.includes(user.role)) {
    const err = new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}.`);
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();
    const db = env.DB;

    try {
      await ensureCaptainSchema(db);

      // 1. Health Check
      if (path === '/api/health' && method === 'GET') {
        const check = await db.prepare('SELECT 1 AS ok').first();
        return jsonResponse(request, env, {
          ok: Boolean(check?.ok),
          service: 'boardly-d1-worker',
          timestamp: Date.now(),
        });
      }

      // Rate limit write methods
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const ip = request.headers.get('CF-Connecting-IP') || 'anon';
        const allowed = await checkWriteRateLimit(db, `ip:${ip}`, 90, 60000);
        if (!allowed) {
          return errorResponse(request, env, 'Rate limit exceeded. Please wait a moment.', 'RATE_LIMITED', 429);
        }
      }

      // 2. Current User Role & Role Management
      if (path === '/api/me/role' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        return jsonResponse(request, env, {
          uid: user.uid,
          email: user.email,
          role: user.role,
          customRole: user.customRole,
          isPostingBanned: user.isPostingBanned,
        });
      }

      if (path === '/api/admin/roles' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['admin', 'superadmin']);
        const { results } = await db
          .prepare('SELECT uid, email, role, custom_role, is_posting_banned, updated_at, created_at FROM user_roles ORDER BY updated_at DESC LIMIT 500')
          .all();
        return jsonResponse(request, env, { roles: results || [] });
      }

      if (path === '/api/admin/roles' && method === 'PUT') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['admin', 'superadmin']);
        const body = await request.json();
        const targetUid = cleanStr(body.uid, 128);
        const targetEmail = cleanStr(body.email, 200).toLowerCase();
        const newRole = cleanStr(body.role, 32, 'student');
        if (!targetUid || !['student', 'captain', 'admin', 'superadmin'].includes(newRole)) {
          return errorResponse(request, env, 'Valid uid and role are required.', 'INVALID_INPUT', 400);
        }
        if (newRole === 'superadmin' && !user.isSuperAdmin) {
          return errorResponse(request, env, 'Only a superadmin can grant superadmin role.', 'FORBIDDEN', 403);
        }
        const now = Date.now();
        await db
          .prepare(
            `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
             ON CONFLICT(uid) DO UPDATE SET
               email = CASE WHEN ?2 != '' THEN ?2 ELSE user_roles.email END,
               role = ?3,
               custom_role = COALESCE(?4, user_roles.custom_role),
               is_posting_banned = COALESCE(?5, user_roles.is_posting_banned),
               updated_at = ?6`
          )
          .bind(
            targetUid,
            targetEmail,
            newRole,
            body.customRole ?? null,
            body.isPostingBanned !== undefined ? (body.isPostingBanned ? 1 : 0) : 0,
            now
          )
          .run();
        return jsonResponse(request, env, { ok: true, uid: targetUid, role: newRole });
      }

      // 3. Captain Tests & Grand Line Public Tests
      if (path === '/api/tests/public' && method === 'GET') {
        if (!PUBLIC_PREVIEW) {
          await authenticateRequest(request, env, true);
        }
        const subjectFilter = cleanStr(url.searchParams.get('subject'), 80);
        let stmt;
        if (subjectFilter && subjectFilter.toLowerCase() !== 'all') {
          stmt = db
            .prepare(
              `SELECT id, title, description, subject, question_count AS questionCount, duration_minutes AS durationMinutes,
                      visibility, status, captain_uid AS captainUid, captain_name AS captainName,
                      crew_id AS crewId, crew_name AS crewName, attempts_count AS attemptsCount,
                      avg_score AS avgScore, created_at AS createdAt
               FROM captain_tests
               WHERE visibility = 'public' AND status = 'published' AND lower(subject) = lower(?1)
               ORDER BY created_at DESC LIMIT 100`
            )
            .bind(subjectFilter);
        } else {
          stmt = db.prepare(
            `SELECT id, title, description, subject, question_count AS questionCount, duration_minutes AS durationMinutes,
                    visibility, status, captain_uid AS captainUid, captain_name AS captainName,
                    crew_id AS crewId, crew_name AS crewName, attempts_count AS attemptsCount,
                    avg_score AS avgScore, created_at AS createdAt
             FROM captain_tests
             WHERE visibility = 'public' AND status = 'published'
             ORDER BY created_at DESC LIMIT 100`
          );
        }
        const { results } = await stmt.all();
        return jsonResponse(request, env, { tests: results || [] });
      }

      if (path === '/api/tests/mine' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['captain', 'admin', 'superadmin']);
        const targetUid =
          user.isAdminOrAbove && url.searchParams.get('captainUid')
            ? cleanStr(url.searchParams.get('captainUid'), 128)
            : user.uid;

        const { results } = await db
          .prepare(
            `SELECT id, title, description, subject, question_count AS questionCount, duration_minutes AS durationMinutes,
                    visibility, status, captain_uid AS captainUid, captain_name AS captainName,
                    crew_id AS crewId, crew_name AS crewName, attempts_count AS attemptsCount,
                    avg_score AS avgScore, created_at AS createdAt, updated_at AS updatedAt
             FROM captain_tests
             WHERE captain_uid = ?1
             ORDER BY created_at DESC LIMIT 200`
          )
          .bind(targetUid)
          .all();

        return jsonResponse(request, env, { tests: results || [] });
      }

      if (path === '/api/tests' && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['captain', 'admin', 'superadmin']);
        const body = await request.json();

        const title = cleanStr(body.title, MAX_TITLE_LEN);
        const subject = cleanStr(body.subject, 80, 'Physics');
        const description = cleanStr(body.description, 1000, '');
        const visibility = body.visibility === 'private' ? 'private' : 'public';
        const status = body.status === 'draft' || body.status === 'unpublished' ? body.status : 'published';
        const durationMinutes = Math.max(1, Math.min(240, Number(body.durationMinutes) || 20));
        const questions = Array.isArray(body.questions) ? body.questions : [];

        if (!title) {
          return errorResponse(request, env, 'Test title is required.', 'INVALID_TITLE', 400);
        }
        if (questions.length > MAX_QUESTIONS_PER_TEST) {
          return errorResponse(
            request,
            env,
            `Maximum ${MAX_QUESTIONS_PER_TEST} questions allowed per test.`,
            'TOO_MANY_QUESTIONS',
            400
          );
        }

        const crewRow = await db
          .prepare('SELECT id, name FROM crews WHERE captain_uid = ?1 LIMIT 1')
          .bind(user.uid)
          .first();

        const testId = crypto.randomUUID();
        const now = Date.now();
        const captainName = cleanStr(body.captainName || user.name, 120, 'Captain');
        const crewId = crewRow?.id || null;
        const crewName = cleanStr(body.crewName || crewRow?.name || 'Grand Line Crew', 120);

        const batchStmts = [
          db
            .prepare(
              `INSERT INTO captain_tests (
                id, title, description, subject, question_count, duration_minutes,
                visibility, status, captain_uid, captain_name, crew_id, crew_name,
                attempts_count, avg_score, created_at, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 0, 0, ?13, ?13)`
            )
            .bind(
              testId,
              title,
              description,
              subject,
              questions.length,
              durationMinutes,
              visibility,
              status,
              user.uid,
              captainName,
              crewId,
              crewName,
              now
            ),
        ];

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i] || {};
          const qText = cleanStr(q.question || q.question_text || q.stem, 2000);
          const rawOpts = Array.isArray(q.options) ? q.options.slice(0, 6).map((o) => cleanStr(o, 500)) : [];
          while (rawOpts.length < 4) rawOpts.push('');
          const correctIndex = Math.max(0, Math.min(rawOpts.length - 1, Number(q.correctIndex ?? q.correct_index ?? 0) || 0));
          const explanation = cleanStr(q.explanation, 2000, '');
          const topic = cleanStr(q.topic, 120, subject);
          const difficulty = ['easy', 'medium', 'hard'].includes(String(q.difficulty || '').toLowerCase())
            ? String(q.difficulty).toLowerCase()
            : 'medium';

          if (!qText) continue;

          batchStmts.push(
            db
              .prepare(
                `INSERT INTO test_questions (
                  id, test_id, position, question_text, options_json, correct_index,
                  explanation, topic, difficulty, created_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
              )
              .bind(
                crypto.randomUUID(),
                testId,
                i,
                qText,
                JSON.stringify(rawOpts),
                correctIndex,
                explanation,
                topic,
                difficulty,
                now
              )
          );
        }

        await db.batch(batchStmts);

        return jsonResponse(
          request,
          env,
          {
            id: testId,
            title,
            description,
            subject,
            questionCount: questions.length,
            durationMinutes,
            visibility,
            status,
            captainUid: user.uid,
            captainName,
            crewId,
            crewName,
            attemptsCount: 0,
            avgScore: 0,
            createdAt: now,
          },
          201
        );
      }

      // Get current user's verified attempt + graded questions for a test (used for result view & PDF download): GET /api/tests/:id/my-attempt
      const myAttemptMatch = path.match(/^\/api\/tests\/([^/]+)\/my-attempt$/);
      if (myAttemptMatch && method === 'GET') {
        const testId = decodeURIComponent(myAttemptMatch[1]);
        const user = await authenticateRequest(request, env, true);

        const testRow = await db
          .prepare(
            `SELECT id, title, description, subject, question_count AS questionCount,
                    duration_minutes AS durationMinutes, visibility, status,
                    captain_uid AS captainUid, captain_name AS captainName,
                    crew_id AS crewId, crew_name AS crewName
             FROM captain_tests WHERE id = ?1`
          )
          .bind(testId)
          .first();

        const attemptRow = await db
          .prepare(
            `SELECT ta.id, ta.test_id AS testId, ta.test_title AS testTitle, ta.subject,
                    ta.captain_uid AS captainUid, ta.captain_name AS captainName,
                    ta.user_uid AS userUid, ta.user_name AS userName, ta.user_avatar AS userAvatar,
                    ta.score, ta.total_questions AS totalQuestions, ta.percentage,
                    ta.time_taken_seconds AS timeTakenSeconds, ta.created_at AS createdAt,
                    ur.email AS userEmail
             FROM test_attempts ta
             LEFT JOIN user_roles ur ON ur.uid = ta.user_uid
             WHERE ta.test_id = ?1 AND ta.user_uid = ?2
             ORDER BY ta.created_at DESC LIMIT 1`
          )
          .bind(testId, user.uid)
          .first();

        if (!attemptRow) {
          if (!testRow) {
            return errorResponse(request, env, 'Test not found.', 'NOT_FOUND', 404);
          }

          // Admin bypass: Admins can view/download official Answer Key without taking the test
          if (user.isAdminOrAbove) {
            const { results: qRows } = await db
              .prepare(
                `SELECT id, position, question_text, options_json, correct_index, explanation, topic, difficulty
                 FROM test_questions WHERE test_id = ?1 ORDER BY position ASC`
              )
              .bind(testId)
              .all();

            const adminAnswerKeyQuestions = (qRows || []).map((q, idx) => {
              let options = [];
              try {
                options = JSON.parse(q.options_json || '[]');
              } catch {
                options = [];
              }
              return {
                id: q.id || `q_${idx}`,
                position: typeof q.position === 'number' ? q.position : idx,
                question: q.question_text || '',
                options: Array.isArray(options) ? options : ['A', 'B', 'C', 'D'],
                selectedIndex: -1,
                correctIndex: typeof q.correct_index === 'number' ? q.correct_index : 0,
                isCorrect: true,
                explanation: q.explanation || '',
                topic: q.topic || 'General',
                difficulty: q.difficulty || 'medium',
              };
            });

            return jsonResponse(request, env, {
              attempt: null,
              gradedQuestions: adminAnswerKeyQuestions,
              isAdminAnswerKey: true,
              isAdmin: true,
              test: {
                ...testRow,
                adminName: user.name || (user.email ? user.email.split('@')[0] : 'Admin'),
              },
            });
          }

          return errorResponse(
            request,
            env,
            'You must attempt this drill before viewing or downloading its answer key and result PDF.',
            'ATTEMPT_REQUIRED',
            403
          );
        }

        const [{ results: qRows }, { results: ansRows }] = await Promise.all([
          db
            .prepare(
              `SELECT id, position, question_text, options_json, correct_index, explanation, topic, difficulty
               FROM test_questions WHERE test_id = ?1 ORDER BY position ASC`
            )
            .bind(testId)
            .all(),
          db
            .prepare(
              `SELECT question_id, selected_index, correct_index, is_correct
               FROM attempt_answers WHERE attempt_id = ?1`
            )
            .bind(attemptRow.id)
            .all(),
        ]);

        const ansByQuestionId = new Map();
        for (const a of ansRows || []) {
          ansByQuestionId.set(String(a.question_id), a);
        }

        const gradedQuestions = (qRows || []).map((q, idx) => {
          let options = [];
          try {
            options = JSON.parse(q.options_json || '[]');
          } catch {
            options = [];
          }
          const ans = ansByQuestionId.get(String(q.id));
          const selectedIndex = ans !== undefined ? Number(ans.selected_index) : -1;
          const correctIndex = Number(q.correct_index ?? ans?.correct_index ?? 0);
          const isCorrect = ans !== undefined ? Boolean(ans.is_correct) : selectedIndex === correctIndex;
          return {
            id: q.id,
            position: typeof q.position === 'number' ? q.position : idx,
            question: q.question_text,
            options,
            selectedIndex,
            correctIndex,
            isCorrect,
            explanation: q.explanation || '',
          };
        });

        const resolvedName = resolveLeaderboardRowName(attemptRow.userName, attemptRow.userEmail || user.email);

        return jsonResponse(request, env, {
          attempt: {
            id: attemptRow.id,
            testId: attemptRow.testId,
            testTitle: attemptRow.testTitle || testRow?.title || 'Grand Line Drill',
            subject: attemptRow.subject || testRow?.subject || 'General',
            captainUid: attemptRow.captainUid || testRow?.captainUid || '',
            captainName: attemptRow.captainName || testRow?.captainName || 'Captain',
            userUid: attemptRow.userUid,
            userName: resolvedName,
            studentName: resolvedName,
            name: resolvedName,
            userAvatar: attemptRow.userAvatar || null,
            score: Number(attemptRow.score || 0),
            totalQuestions: Number(attemptRow.totalQuestions || gradedQuestions.length),
            percentage: Number(attemptRow.percentage || 0),
            timeTakenSeconds: Number(attemptRow.timeTakenSeconds || 0),
            createdAt: attemptRow.createdAt,
            gradedQuestions,
          },
          gradedQuestions,
          test: testRow || null,
        });
      }

      // Single test routes: /api/tests/:id
      const testMatch = path.match(/^\/api\/tests\/([^/]+)$/);
      if (testMatch) {
        const testId = decodeURIComponent(testMatch[1]);
        const isInfoOnly = method === 'GET' && url.searchParams.get('view') === 'info';
        const user = await authenticateRequest(request, env, !isInfoOnly);

        const testRow = await db
          .prepare(
            `SELECT id, title, description, subject, question_count AS questionCount,
                    duration_minutes AS durationMinutes, visibility, status,
                    captain_uid AS captainUid, captain_name AS captainName,
                    crew_id AS crewId, crew_name AS crewName,
                    attempts_count AS attemptsCount, avg_score AS avgScore,
                    created_at AS createdAt, updated_at AS updatedAt
             FROM captain_tests WHERE id = ?1`
          )
          .bind(testId)
          .first();

        if (!testRow) {
          return errorResponse(request, env, 'Test not found.', 'NOT_FOUND', 404);
        }

        const isOwnerOrAdmin = Boolean(user && (testRow.captainUid === user.uid || user.isAdminOrAbove));

        if (method === 'GET') {
          if (testRow.visibility === 'private' && !isOwnerOrAdmin) {
            return errorResponse(request, env, 'This test is private.', 'FORBIDDEN', 403);
          }

          if (isInfoOnly) {
            return jsonResponse(request, env, {
              test: {
                ...testRow,
                questions: [],
              },
            });
          }

          const includeAnswers = isOwnerOrAdmin && url.searchParams.get('includeAnswers') === '1';

          // Enforce ONE verified attempt per drill (test_id + user_uid) when student opens/starts test
          if (!includeAnswers && user) {
            const existingAttempt = await db
              .prepare(
                `SELECT id, test_id AS testId, test_title AS testTitle, subject,
                        captain_uid AS captainUid, captain_name AS captainName,
                        user_uid AS userUid, user_name AS userName, user_avatar AS userAvatar,
                        score, total_questions AS totalQuestions, percentage,
                        time_taken_seconds AS timeTakenSeconds, created_at AS createdAt
                 FROM test_attempts
                 WHERE test_id = ?1 AND user_uid = ?2
                 ORDER BY created_at DESC LIMIT 1`
              )
              .bind(testId, user.uid)
              .first();

            if (existingAttempt) {
              const resolvedName = resolveLeaderboardRowName(existingAttempt.userName, user.email);
              return jsonResponse(
                request,
                env,
                {
                  error: ALREADY_ATTEMPTED_MESSAGE,
                  message: ALREADY_ATTEMPTED_MESSAGE,
                  state: 'already_attempted',
                  code: 'ALREADY_ATTEMPTED',
                  attemptId: existingAttempt.id,
                  attempt: {
                    ...existingAttempt,
                    userName: resolvedName,
                    studentName: resolvedName,
                    name: resolvedName,
                  },
                },
                409
              );
            }
          }

          const { results: qRows } = await db
            .prepare(
              `SELECT id, position, question_text, options_json, correct_index, explanation, topic, difficulty
               FROM test_questions WHERE test_id = ?1 ORDER BY position ASC`
            )
            .bind(testId)
            .all();

          const questions = (qRows || []).map((q) => {
            let options = [];
            try {
              options = JSON.parse(q.options_json || '[]');
            } catch {
              options = [];
            }
            const item = {
              id: q.id,
              position: q.position,
              question: q.question_text,
              options,
              topic: q.topic,
              difficulty: q.difficulty,
            };
            if (includeAnswers) {
              item.correctIndex = q.correct_index;
              item.explanation = q.explanation;
            }
            return item;
          });

          return jsonResponse(request, env, {
            test: {
              ...testRow,
              questions,
            },
          });
        }

        if (method === 'PUT') {
          if (!isOwnerOrAdmin) {
            return errorResponse(request, env, 'Only the test owner or an admin can edit this test.', 'FORBIDDEN', 403);
          }
          await ensureCertificateD1Tables(db);
          const body = await request.json();
          const title = cleanStr(body.title ?? testRow.title, MAX_TITLE_LEN);
          const description = cleanStr(body.description ?? testRow.description, 1000);
          const subject = cleanStr(body.subject ?? testRow.subject, 80);
          const visibility = body.visibility ? (body.visibility === 'private' ? 'private' : 'public') : testRow.visibility;
          const status = body.status && ['draft', 'published', 'unpublished'].includes(body.status) ? body.status : testRow.status;
          const durationMinutes = Math.max(1, Math.min(240, Number(body.durationMinutes ?? testRow.durationMinutes) || 20));
          const now = Date.now();

          const rawThemeInput =
            body.certificateThemeId !== undefined
              ? body.certificateThemeId
              : body.certificate_theme_id !== undefined
              ? body.certificate_theme_id
              : undefined;
          const hasThemeUpdate = rawThemeInput !== undefined;
          const normalizedThemeId =
            rawThemeInput === null || rawThemeInput === '' || rawThemeInput === 'auto'
              ? null
              : String(rawThemeInput).trim();

          const stmts = [
            db
              .prepare(
                `UPDATE captain_tests
                 SET title = ?1, description = ?2, subject = ?3, visibility = ?4,
                     status = ?5, duration_minutes = ?6, updated_at = ?7
                 WHERE id = ?8`
              )
              .bind(title, description, subject, visibility, status, durationMinutes, now, testId),
          ];

          if (hasThemeUpdate) {
            stmts.push(
              db
                .prepare('UPDATE captain_tests SET certificate_theme_id = ?1 WHERE id = ?2')
                .bind(normalizedThemeId, testId)
            );
          }

          if (Array.isArray(body.questions)) {
            if (body.questions.length > MAX_QUESTIONS_PER_TEST) {
              return errorResponse(request, env, `Maximum ${MAX_QUESTIONS_PER_TEST} questions allowed.`, 'TOO_MANY_QUESTIONS', 400);
            }
            stmts.push(db.prepare('DELETE FROM test_questions WHERE test_id = ?1').bind(testId));
            let validCount = 0;
            for (let i = 0; i < body.questions.length; i++) {
              const q = body.questions[i] || {};
              const qText = cleanStr(q.question || q.question_text, 2000);
              if (!qText) continue;
              const rawOpts = Array.isArray(q.options) ? q.options.slice(0, 6).map((o) => cleanStr(o, 500)) : [];
              while (rawOpts.length < 4) rawOpts.push('');
              const correctIndex = Math.max(0, Math.min(rawOpts.length - 1, Number(q.correctIndex ?? q.correct_index ?? 0) || 0));
              const explanation = cleanStr(q.explanation, 2000, '');
              const topic = cleanStr(q.topic, 120, subject);
              const difficulty = ['easy', 'medium', 'hard'].includes(String(q.difficulty || '').toLowerCase())
                ? String(q.difficulty).toLowerCase()
                : 'medium';

              stmts.push(
                db
                  .prepare(
                    `INSERT INTO test_questions (
                      id, test_id, position, question_text, options_json, correct_index,
                      explanation, topic, difficulty, created_at
                    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
                  )
                  .bind(
                    crypto.randomUUID(),
                    testId,
                    validCount,
                    qText,
                    JSON.stringify(rawOpts),
                    correctIndex,
                    explanation,
                    topic,
                    difficulty,
                    now
                  )
              );
              validCount++;
            }
            stmts.push(
              db
                .prepare('UPDATE captain_tests SET question_count = ?1 WHERE id = ?2')
                .bind(validCount, testId)
            );
          }

          await db.batch(stmts);
          return jsonResponse(request, env, {
            ok: true,
            id: testId,
            certificateThemeId: hasThemeUpdate ? normalizedThemeId : undefined,
          });
        }

        if (method === 'DELETE') {
          if (!isOwnerOrAdmin) {
            return errorResponse(request, env, 'Only the test owner or an admin can delete this test.', 'FORBIDDEN', 403);
          }
          await db.prepare('DELETE FROM captain_tests WHERE id = ?1').bind(testId).run();
          return jsonResponse(request, env, { ok: true, id: testId });
        }
      }

      // Publish / Unpublish test: POST /api/tests/:id/publish
      const publishMatch = path.match(/^\/api\/tests\/([^/]+)\/publish$/);
      if (publishMatch && method === 'POST') {
        const testId = decodeURIComponent(publishMatch[1]);
        const user = await authenticateRequest(request, env, true);
        const testRow = await db
          .prepare('SELECT id, captain_uid, status, visibility FROM captain_tests WHERE id = ?1')
          .bind(testId)
          .first();

        if (!testRow) {
          return errorResponse(request, env, 'Test not found.', 'NOT_FOUND', 404);
        }
        if (testRow.captain_uid !== user.uid && !user.isAdminOrAbove) {
          return errorResponse(request, env, 'Only the test owner or an admin can change publish status.', 'FORBIDDEN', 403);
        }

        const body = await request.json().catch(() => ({}));
        const nextStatus =
          body.status === 'published' || body.status === 'unpublished'
            ? body.status
            : testRow.status === 'published'
            ? 'unpublished'
            : 'published';
        const nextVisibility =
          body.visibility === 'public' || body.visibility === 'private'
            ? body.visibility
            : testRow.visibility;

        await db
          .prepare('UPDATE captain_tests SET status = ?1, visibility = ?2, updated_at = ?3 WHERE id = ?4')
          .bind(nextStatus, nextVisibility, Date.now(), testId)
          .run();

        return jsonResponse(request, env, { ok: true, id: testId, status: nextStatus, visibility: nextVisibility });
      }

      // Finalise Grand Line mock & issue 1st position certificate(s): POST /api/tests/:id/finalise
      const finaliseMatch = path.match(/^\/api\/tests\/([^/]+)\/finalise$/);
      if (finaliseMatch && method === 'POST') {
        const testId = decodeURIComponent(finaliseMatch[1]);
        const user = await authenticateRequest(request, env, true);
        if (!user.isAdminOrAbove) {
          return errorResponse(request, env, 'Only admins can finalise Grand Line results and issue certificates.', 'FORBIDDEN', 403);
        }
        await ensureCertificateD1Tables(db);
        const testRow = await db
          .prepare('SELECT * FROM captain_tests WHERE id = ?1')
          .bind(testId)
          .first();
        if (!testRow) {
          return errorResponse(request, env, 'Grand Line mock not found.', 'NOT_FOUND', 404);
        }
        const activeSig = await db
          .prepare('SELECT * FROM certificate_signatures WHERE active = 1 ORDER BY version DESC LIMIT 1')
          .first();
        if (!activeSig) {
          return errorResponse(
            request,
            env,
            'Cannot issue certificates: No active admin signature configured. Upload a signature in Admin > Certificates first.',
            'NO_ACTIVE_SIGNATURE',
            400
          );
        }

        const { results: attemptRows } = await db
          .prepare(
            `SELECT * FROM test_attempts
             WHERE test_id = ?1
             ORDER BY score DESC, percentage DESC, time_taken_seconds ASC, created_at ASC`
          )
          .bind(testId)
          .all();

        const attempts = attemptRows || [];
        if (attempts.length === 0) {
          return errorResponse(request, env, 'No verified student attempts found for this Grand Line mock.', 'NO_ATTEMPTS', 400);
        }

        // Deduplicate best attempt per student
        const seenStudents = new Set();
        const bestAttempts = [];
        for (const a of attempts) {
          const uid = String(a.user_uid || '').trim();
          if (!uid || seenStudents.has(uid)) continue;
          seenStudents.add(uid);
          bestAttempts.push(a);
        }

        const topAttempt = bestAttempts[0];
        const winners = bestAttempts.filter(
          (a) =>
            Number(a.score) === Number(topAttempt.score) &&
            Number(a.time_taken_seconds || 0) === Number(topAttempt.time_taken_seconds || 0)
        );

        const countMocksRow = await db
          .prepare('SELECT COUNT(*) AS cnt FROM captain_tests WHERE created_at <= ?1')
          .bind(Number(testRow.created_at || Date.now()))
          .first();
        const mockNumber = Math.max(1, Number(countMocksRow?.cnt || 1));
        const glPad = String(mockNumber).padStart(2, '0');
        const configuredThemeId = testRow.certificate_theme_id ? String(testRow.certificate_theme_id).trim() : null;

        const existingSerialsRes = await db
          .prepare('SELECT serial FROM certificates WHERE grand_line_id = ?1')
          .bind(testId)
          .all();
        let nextSeq = (existingSerialsRes?.results?.length || 0) + 1;

        const issued = [];
        const skipped = [];
        const now = Date.now();

        for (const w of winners) {
          const studentUid = String(w.user_uid);
          const existingCert = await db
            .prepare('SELECT * FROM certificates WHERE student_uid = ?1 AND grand_line_id = ?2')
            .bind(studentUid, testId)
            .first();
          if (existingCert) {
            skipped.push({ studentUid, serial: existingCert.serial, reason: 'already_issued' });
            continue;
          }

          const seqPad = String(nextSeq++).padStart(4, '0');
          const serial = `BDLY-GL${glPad}-${seqPad}`;
          const resolvedThemeObj = resolveWorkerCertThemeColors(testId, configuredThemeId, studentUid);
          const certRow = {
            id: `cert_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
            student_uid: studentUid,
            student_name: resolveLeaderboardRowName(w.user_name, ''),
            student_email: null,
            grand_line_id: testId,
            grand_line_title: String(testRow.title || 'Boardly Grand Line Mock'),
            edition_label: `${String(testRow.subject || 'OFFICIAL').toUpperCase()} · GRAND LINE #${glPad}`,
            rank: 1,
            score: Number(w.score || 0),
            total_questions: Number(w.total_questions || testRow.question_count || 0),
            percentage: Number(w.percentage || 100),
            participants_count: bestAttempts.length,
            serial,
            theme_id: resolvedThemeObj.id || configuredThemeId || 'default',
            signature_version: Number(activeSig.version),
            issued_at: now,
            pdf_r2_key: `certificates/${testId}/${serial}.pdf`,
            png_r2_key: `certificates/${testId}/${serial}.png`,
            status: 'active',
          };

          await renderAndStoreWorkerCertificate(env, certRow, activeSig);
          await db
            .prepare(
              `INSERT INTO certificates (
                id, student_uid, student_name, student_email, grand_line_id, grand_line_title,
                edition_label, rank, score, total_questions, percentage, participants_count,
                serial, theme_id, signature_version, issued_at, pdf_r2_key, png_r2_key, status
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)`
            )
            .bind(
              certRow.id,
              certRow.student_uid,
              certRow.student_name,
              certRow.student_email,
              certRow.grand_line_id,
              certRow.grand_line_title,
              certRow.edition_label,
              certRow.rank,
              certRow.score,
              certRow.total_questions,
              certRow.percentage,
              certRow.participants_count,
              certRow.serial,
              certRow.theme_id,
              certRow.signature_version,
              certRow.issued_at,
              certRow.pdf_r2_key,
              certRow.png_r2_key,
              certRow.status
            )
            .run();

          issued.push({
            id: certRow.id,
            serial: certRow.serial,
            studentUid: certRow.student_uid,
            studentName: certRow.student_name,
            score: certRow.score,
            totalQuestions: certRow.total_questions,
            percentage: certRow.percentage,
            themeId: certRow.theme_id,
          });
        }

        await db
          .prepare('UPDATE captain_tests SET results_finalised = 1, finalised_at = ?1 WHERE id = ?2')
          .bind(now, testId)
          .run()
          .catch(() => {});

        return jsonResponse(request, env, {
          ok: true,
          grandLineId: testId,
          participantsCount: bestAttempts.length,
          issuedCount: issued.length,
          issued,
          skipped,
        });
      }

      // Bulk insert questions: POST /api/tests/:id/questions
      const bulkQuestionsMatch = path.match(/^\/api\/tests\/([^/]+)\/questions$/);
      if (bulkQuestionsMatch && method === 'POST') {
        const testId = decodeURIComponent(bulkQuestionsMatch[1]);
        const user = await authenticateRequest(request, env, true);
        const testRow = await db
          .prepare('SELECT id, captain_uid, subject, question_count FROM captain_tests WHERE id = ?1')
          .bind(testId)
          .first();

        if (!testRow) {
          return errorResponse(request, env, 'Test not found.', 'NOT_FOUND', 404);
        }
        if (testRow.captain_uid !== user.uid && !user.isAdminOrAbove) {
          return errorResponse(request, env, 'Forbidden.', 'FORBIDDEN', 403);
        }

        const body = await request.json();
        const rows = Array.isArray(body.questions) ? body.questions : [];
        const replaceExisting = Boolean(body.replace);

        if (rows.length === 0) {
          return errorResponse(request, env, 'No question rows provided.', 'EMPTY_QUESTIONS', 400);
        }
        if (rows.length > MAX_QUESTIONS_PER_TEST) {
          return errorResponse(request, env, `Maximum ${MAX_QUESTIONS_PER_TEST} questions per test.`, 'TOO_MANY_QUESTIONS', 400);
        }

        const now = Date.now();
        const stmts = [];
        let startPos = replaceExisting ? 0 : Number(testRow.question_count || 0);

        if (replaceExisting) {
          stmts.push(db.prepare('DELETE FROM test_questions WHERE test_id = ?1').bind(testId));
        }

        let inserted = 0;
        for (let i = 0; i < rows.length; i++) {
          const q = rows[i] || {};
          const qText = cleanStr(q.question || q.question_text, 2000);
          if (!qText) continue;
          const opts = Array.isArray(q.options) ? q.options.slice(0, 6).map((o) => cleanStr(o, 500)) : [];
          while (opts.length < 4) opts.push('');
          const correctIndex = Math.max(0, Math.min(opts.length - 1, Number(q.correctIndex ?? q.correct_index ?? 0) || 0));
          const explanation = cleanStr(q.explanation, 2000, '');
          const topic = cleanStr(q.topic, 120, testRow.subject);
          const difficulty = ['easy', 'medium', 'hard'].includes(String(q.difficulty || '').toLowerCase())
            ? String(q.difficulty).toLowerCase()
            : 'medium';

          stmts.push(
            db
              .prepare(
                `INSERT INTO test_questions (
                  id, test_id, position, question_text, options_json, correct_index,
                  explanation, topic, difficulty, created_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
              )
              .bind(
                crypto.randomUUID(),
                testId,
                startPos + inserted,
                qText,
                JSON.stringify(opts),
                correctIndex,
                explanation,
                topic,
                difficulty,
                now
              )
          );
          inserted++;
        }

        const totalQuestions = startPos + inserted;
        stmts.push(
          db
            .prepare('UPDATE captain_tests SET question_count = ?1, updated_at = ?2 WHERE id = ?3')
            .bind(totalQuestions, now, testId)
        );

        await db.batch(stmts);
        return jsonResponse(request, env, { ok: true, inserted, questionCount: totalQuestions });
      }

      // 4. Submit Attempt & Server-Side Scoring: POST /api/tests/:id/attempts
      const attemptMatch = path.match(/^\/api\/tests\/([^/]+)\/attempts$/);
      if (attemptMatch && method === 'POST') {
        const testId = decodeURIComponent(attemptMatch[1]);
        const user = await authenticateRequest(request, env, true);
        const lockKey = `${testId}:${user.uid}`;

        if (inFlightAttemptLocks.has(lockKey)) {
          const existingInFlight = await db
            .prepare(
              `SELECT id, test_id AS testId, test_title AS testTitle, subject,
                      user_uid AS userUid, user_name AS userName, user_avatar AS userAvatar,
                      score, total_questions AS totalQuestions, percentage,
                      time_taken_seconds AS timeTakenSeconds, created_at AS createdAt
               FROM test_attempts WHERE test_id = ?1 AND user_uid = ?2 LIMIT 1`
            )
            .bind(testId, user.uid)
            .first();
          return jsonResponse(
            request,
            env,
            {
              error: ALREADY_ATTEMPTED_MESSAGE,
              message: ALREADY_ATTEMPTED_MESSAGE,
              code: 'ALREADY_ATTEMPTED',
              attemptId: existingInFlight?.id || null,
              attempt: existingInFlight || null,
            },
            409
          );
        }

        inFlightAttemptLocks.add(lockKey);
        try {
          const testRow = await db
            .prepare(
              `SELECT id, title, subject, captain_uid, captain_name, visibility, status
               FROM captain_tests WHERE id = ?1`
            )
            .bind(testId)
            .first();

          if (!testRow) {
            return errorResponse(request, env, 'Test not found.', 'NOT_FOUND', 404);
          }

          const existingAttempt = await db
            .prepare(
              `SELECT id, test_id AS testId, test_title AS testTitle, subject,
                      captain_uid AS captainUid, captain_name AS captainName,
                      user_uid AS userUid, user_name AS userName, user_avatar AS userAvatar,
                      score, total_questions AS totalQuestions, percentage,
                      time_taken_seconds AS timeTakenSeconds, created_at AS createdAt
               FROM test_attempts
               WHERE test_id = ?1 AND user_uid = ?2
               ORDER BY created_at DESC LIMIT 1`
            )
            .bind(testId, user.uid)
            .first();

          if (existingAttempt) {
            const resolvedName = resolveLeaderboardRowName(existingAttempt.userName, user.email);
            return jsonResponse(
              request,
              env,
              {
                error: ALREADY_ATTEMPTED_MESSAGE,
                message: ALREADY_ATTEMPTED_MESSAGE,
                code: 'ALREADY_ATTEMPTED',
                attemptId: existingAttempt.id,
                attempt: {
                  ...existingAttempt,
                  userName: resolvedName,
                  studentName: resolvedName,
                  name: resolvedName,
                },
              },
              409
            );
          }

          const { results: qRows } = await db
            .prepare(
              `SELECT id, position, question_text, options_json, correct_index, explanation
               FROM test_questions WHERE test_id = ?1 ORDER BY position ASC`
            )
            .bind(testId)
            .all();

          const questions = qRows || [];
          if (questions.length === 0) {
            return errorResponse(request, env, 'This test has no questions to score.', 'EMPTY_TEST', 400);
          }

          const body = await request.json();
          const rawAnswers = body.answers || {};
          const timeTakenSeconds = Math.max(0, Math.min(86400, Number(body.timeTakenSeconds) || 0));
          const userName = resolveStudentAttemptName(
            body.userName ?? body.studentName,
            user.tokenName,
            user.email
          );
          const userAvatar = body.userAvatar ? cleanStr(body.userAvatar, 500) : user.picture || null;

          let score = 0;
          const attemptId = crypto.randomUUID();
          const now = Date.now();
          const answerStmts = [];
          const gradedQuestions = [];

          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            let selectedIndex = -1;
            if (Array.isArray(rawAnswers)) {
              selectedIndex = Number(rawAnswers[i] ?? -1);
            } else if (rawAnswers && typeof rawAnswers === 'object') {
              selectedIndex = Number(rawAnswers[q.id] ?? rawAnswers[i] ?? -1);
            }
            if (Number.isNaN(selectedIndex)) selectedIndex = -1;

            const correctIndex = Number(q.correct_index);
            const isCorrect = selectedIndex === correctIndex ? 1 : 0;
            if (isCorrect) score++;

            answerStmts.push(
              db
                .prepare(
                  `INSERT INTO attempt_answers (
                    id, attempt_id, test_id, question_id, selected_index, correct_index, is_correct, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
                )
                .bind(crypto.randomUUID(), attemptId, testId, q.id, selectedIndex, correctIndex, isCorrect, now)
            );

            let options = [];
            try {
              options = JSON.parse(q.options_json || '[]');
            } catch {
              options = [];
            }

            gradedQuestions.push({
              id: q.id,
              position: q.position,
              question: q.question_text,
              options,
              selectedIndex,
              correctIndex,
              isCorrect: Boolean(isCorrect),
              explanation: q.explanation || '',
            });
          }

          const totalQuestions = questions.length;
          const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

          try {
            await db.batch([
              db
                .prepare(
                  `INSERT INTO test_attempts (
                    id, test_id, test_title, subject, captain_uid, captain_name,
                    user_uid, user_name, user_avatar, score, total_questions,
                    percentage, time_taken_seconds, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`
                )
                .bind(
                  attemptId,
                  testId,
                  testRow.title,
                  testRow.subject,
                  testRow.captain_uid,
                  testRow.captain_name,
                  user.uid,
                  userName,
                  userAvatar,
                  score,
                  totalQuestions,
                  percentage,
                  timeTakenSeconds,
                  now
                ),
              ...answerStmts,
              db
                .prepare(
                  `UPDATE captain_tests
                   SET attempts_count = attempts_count + 1,
                       avg_score = ROUND(((avg_score * attempts_count) + ?1) / (attempts_count + 1), 1),
                       updated_at = ?2
                   WHERE id = ?3`
                )
                .bind(percentage, now, testId),
            ]);
          } catch (batchErr) {
            const dupAttempt = await db
              .prepare(
                `SELECT id, test_id AS testId, test_title AS testTitle, subject,
                        user_uid AS userUid, user_name AS userName, user_avatar AS userAvatar,
                        score, total_questions AS totalQuestions, percentage,
                        time_taken_seconds AS timeTakenSeconds, created_at AS createdAt
                 FROM test_attempts WHERE test_id = ?1 AND user_uid = ?2 LIMIT 1`
              )
              .bind(testId, user.uid)
              .first();
            if (dupAttempt) {
              return jsonResponse(
                request,
                env,
                {
                  error: ALREADY_ATTEMPTED_MESSAGE,
                  message: ALREADY_ATTEMPTED_MESSAGE,
                  code: 'ALREADY_ATTEMPTED',
                  attemptId: dupAttempt.id,
                  attempt: dupAttempt,
                },
                409
              );
            }
            throw batchErr;
          }

          return jsonResponse(
            request,
            env,
            {
              attempt: {
                id: attemptId,
                testId,
                testTitle: testRow.title,
                subject: testRow.subject,
                captainUid: testRow.captain_uid,
                captainName: testRow.captain_name,
                userUid: user.uid,
                userName,
                studentName: userName,
                name: userName,
                userAvatar,
                score,
                totalQuestions,
                percentage,
                timeTakenSeconds,
                createdAt: now,
                gradedQuestions,
              },
            },
            201
          );
        } finally {
          inFlightAttemptLocks.delete(lockKey);
        }
      }

      // List my attempts: GET /api/attempts/mine
      if (path === '/api/attempts/mine' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        const { results } = await db
          .prepare(
            `SELECT id, test_id AS testId, test_title AS testTitle, subject,
                    captain_uid AS captainUid, captain_name AS captainName,
                    user_uid AS userUid, user_name AS userName, user_avatar AS userAvatar,
                    score, total_questions AS totalQuestions, percentage,
                    time_taken_seconds AS timeTakenSeconds, created_at AS createdAt
             FROM test_attempts
             WHERE user_uid = ?1
             ORDER BY created_at DESC LIMIT 100`
          )
          .bind(user.uid)
          .all();

        const mapped = (results || []).map((row) => {
          const resolvedName = resolveLeaderboardRowName(row.userName, user.email);
          return {
            ...row,
            userName: resolvedName,
            studentName: resolvedName,
            name: resolvedName,
          };
        });

        return jsonResponse(request, env, { attempts: mapped });
      }

      // Captain / Leaderboard view of results per test: GET /api/tests/:id/results or /api/tests/:id/leaderboard
      const resultsMatch = path.match(/^\/api\/tests\/([^/]+)\/(results|leaderboard)$/);
      if (resultsMatch && method === 'GET') {
        const testId = decodeURIComponent(resultsMatch[1]);
        const mode = resultsMatch[2];
        const user = await authenticateRequest(request, env, mode === 'results');

        const testRow = await db
          .prepare('SELECT id, title, subject, captain_uid, visibility FROM captain_tests WHERE id = ?1')
          .bind(testId)
          .first();

        if (!testRow) {
          return errorResponse(request, env, 'Test not found.', 'NOT_FOUND', 404);
        }

        if (mode === 'results' && testRow.captain_uid !== user.uid && !user.isAdminOrAbove) {
          return errorResponse(request, env, 'Only the test captain or an admin can view full test results.', 'FORBIDDEN', 403);
        }

        const { results } = await db
          .prepare(
            `SELECT ta.id, ta.test_id AS testId, ta.test_title AS testTitle, ta.subject,
                    ta.user_uid AS userUid, ta.user_name AS userName, ta.user_avatar AS userAvatar,
                    ta.score, ta.total_questions AS totalQuestions, ta.percentage,
                    ta.time_taken_seconds AS timeTakenSeconds, ta.created_at AS createdAt,
                    ur.email AS userEmail
             FROM test_attempts ta
             LEFT JOIN user_roles ur ON ur.uid = ta.user_uid
             WHERE ta.test_id = ?1
             ORDER BY ta.percentage DESC, ta.score DESC, ta.time_taken_seconds ASC, ta.created_at ASC
             LIMIT 200`
          )
          .bind(testId)
          .all();

        const ranked = (results || []).map((row, idx) => {
          const resolvedName = resolveLeaderboardRowName(row.userName, row.userEmail);
          return {
            id: row.id,
            testId: row.testId,
            testTitle: row.testTitle,
            subject: row.subject,
            userUid: row.userUid,
            studentUid: row.userUid,
            userName: resolvedName,
            studentName: resolvedName,
            name: resolvedName,
            userAvatar: row.userAvatar || null,
            score: Number(row.score || 0),
            totalQuestions: Number(row.totalQuestions || 0),
            percentage: Number(row.percentage || 0),
            timeTakenSeconds: Number(row.timeTakenSeconds || 0),
            createdAt: row.createdAt,
            rank: idx + 1,
          };
        });

        return jsonResponse(request, env, { results: ranked });
      }

      // Global Grand Line Leaderboard: GET /api/leaderboard/grand-line
      if (path === '/api/leaderboard/grand-line' && method === 'GET') {
        const limitParam = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 50));
        const { results } = await db
          .prepare(
            `SELECT ta.id, ta.test_id AS testId, ta.test_title AS testTitle, ta.subject,
                    ta.user_uid AS userUid, ta.user_name AS userName, ta.user_avatar AS userAvatar,
                    ta.score, ta.total_questions AS totalQuestions, ta.percentage,
                    ta.time_taken_seconds AS timeTakenSeconds, ta.created_at AS createdAt,
                    ur.email AS userEmail
             FROM test_attempts ta
             LEFT JOIN user_roles ur ON ur.uid = ta.user_uid
             ORDER BY ta.percentage DESC, ta.score DESC, ta.time_taken_seconds ASC
             LIMIT 500`
          )
          .all();

        const byUser = new Map();
        for (const row of results || []) {
          const uid = String(row.userUid || '');
          if (!uid) continue;
          const resolvedName = resolveLeaderboardRowName(row.userName, row.userEmail);
          const existing = byUser.get(uid);
          if (!existing) {
            byUser.set(uid, {
              uid,
              userUid: uid,
              displayName: resolvedName,
              userName: resolvedName,
              studentName: resolvedName,
              name: resolvedName,
              userAvatar: row.userAvatar || null,
              testsCompleted: 1,
              totalScore: Number(row.score || 0),
              totalQuestions: Number(row.totalQuestions || 0),
              bestPercentage: Number(row.percentage || 0),
              timeTakenSeconds: Number(row.timeTakenSeconds || 0),
              lastTestTitle: row.testTitle || 'Grand Line Drill',
              updatedAt: row.createdAt,
            });
          } else {
            existing.testsCompleted += 1;
            existing.totalScore += Number(row.score || 0);
            existing.totalQuestions += Number(row.totalQuestions || 0);
            if (Number(row.percentage || 0) > existing.bestPercentage) {
              existing.bestPercentage = Number(row.percentage || 0);
              existing.timeTakenSeconds = Number(row.timeTakenSeconds || 0);
            }
            if (existing.displayName === 'Student' && resolvedName !== 'Student') {
              existing.displayName = resolvedName;
              existing.userName = resolvedName;
              existing.studentName = resolvedName;
              existing.name = resolvedName;
            }
            if (!existing.userAvatar && row.userAvatar) {
              existing.userAvatar = row.userAvatar;
            }
          }
        }

        const leaderboard = Array.from(byUser.values())
          .sort(
            (a, b) =>
              b.bestPercentage - a.bestPercentage ||
              b.totalScore - a.totalScore ||
              a.timeTakenSeconds - b.timeTakenSeconds
          )
          .slice(0, limitParam)
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
          }));

        return jsonResponse(request, env, { leaderboard });
      }

      // 5. Crews & Crew Members
      if (path === '/api/crews' && method === 'GET') {
        const user = await authenticateRequest(request, env, false);
        const includeSuspended = user?.isAdminOrAbove && url.searchParams.get('all') === '1';

        const queryStr = includeSuspended
          ? `SELECT id, code, name, description, university, captain_uid AS captainUid,
                    captain_name AS captainName, captain_email AS captainEmail,
                    avatar_url AS avatarUrl, status, member_count AS memberCount,
                    created_at AS createdAt, updated_at AS updatedAt
             FROM crews ORDER BY created_at DESC LIMIT 200`
          : `SELECT id, code, name, description, university, captain_uid AS captainUid,
                    captain_name AS captainName, captain_email AS captainEmail,
                    avatar_url AS avatarUrl, status, member_count AS memberCount,
                    created_at AS createdAt, updated_at AS updatedAt
             FROM crews WHERE status = 'active' ORDER BY member_count DESC, created_at DESC LIMIT 200`;

        const { results } = await db.prepare(queryStr).all();
        return jsonResponse(request, env, { crews: results || [] });
      }

      if (path === '/api/crews/mine' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        let crew = await db
          .prepare(
            `SELECT id, code, name, description, university, captain_uid AS captainUid,
                    captain_name AS captainName, captain_email AS captainEmail,
                    avatar_url AS avatarUrl, status, member_count AS memberCount,
                    created_at AS createdAt, updated_at AS updatedAt
             FROM crews WHERE captain_uid = ?1 LIMIT 1`
          )
          .bind(user.uid)
          .first();

        if (!crew) {
          const membership = await db
            .prepare('SELECT crew_id FROM crew_members WHERE user_uid = ?1 AND status = \'active\' LIMIT 1')
            .bind(user.uid)
            .first();
          if (membership?.crew_id) {
            crew = await db
              .prepare(
                `SELECT id, code, name, description, university, captain_uid AS captainUid,
                        captain_name AS captainName, captain_email AS captainEmail,
                        avatar_url AS avatarUrl, status, member_count AS memberCount,
                        created_at AS createdAt, updated_at AS updatedAt
                 FROM crews WHERE id = ?1`
              )
              .bind(membership.crew_id)
              .first();
          }
        }

        if (!crew) {
          return jsonResponse(request, env, { crew: null, members: [] });
        }

        const { results: members } = await db
          .prepare(
            `SELECT id, crew_id AS crewId, user_uid AS userUid, user_name AS userName,
                    user_email AS userEmail, user_avatar AS userAvatar, role, status,
                    joined_at AS joinedAt
             FROM crew_members WHERE crew_id = ?1 ORDER BY role ASC, joined_at ASC`
          )
          .bind(crew.id)
          .all();

        return jsonResponse(request, env, { crew, members: members || [] });
      }

      if (path === '/api/crews' && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['captain', 'admin', 'superadmin']);

        const existing = await db
          .prepare('SELECT id FROM crews WHERE captain_uid = ?1 LIMIT 1')
          .bind(user.uid)
          .first();
        if (existing && !user.isAdminOrAbove) {
          return errorResponse(request, env, 'You already lead a crew.', 'CREW_EXISTS', 400);
        }

        const body = await request.json();
        const name = cleanStr(body.name, 100);
        const description = cleanStr(body.description, 500, '');
        const university = cleanStr(body.university, 120, '');
        const captainUid = user.isAdminOrAbove && body.captainUid ? cleanStr(body.captainUid, 128) : user.uid;
        const captainName = cleanStr(body.captainName || user.name, 120, 'Captain');
        const captainEmail = cleanStr(body.captainEmail || user.email, 200, '');

        if (!name) {
          return errorResponse(request, env, 'Crew name is required.', 'INVALID_NAME', 400);
        }

        const crewId = crypto.randomUUID();
        const code =
          cleanStr(body.code, 16).toUpperCase() ||
          `NK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const now = Date.now();

        await db.batch([
          db
            .prepare(
              `INSERT INTO crews (
                id, code, name, description, university, captain_uid, captain_name,
                captain_email, status, member_count, created_at, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'active', 1, ?9, ?9)`
            )
            .bind(crewId, code, name, description, university, captainUid, captainName, captainEmail, now),
          db
            .prepare(
              `INSERT INTO crew_members (
                id, crew_id, user_uid, user_name, user_email, user_avatar, role, status, joined_at, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'captain', 'active', ?7, ?7)`
            )
            .bind(crypto.randomUUID(), crewId, captainUid, captainName, captainEmail, user.picture, now),
        ]);

        return jsonResponse(
          request,
          env,
          {
            crew: {
              id: crewId,
              code,
              name,
              description,
              university,
              captainUid,
              captainName,
              captainEmail,
              status: 'active',
              memberCount: 1,
              createdAt: now,
            },
          },
          201
        );
      }

      // Join crew by code or ID: POST /api/crews/join
      if (path === '/api/crews/join' && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        const body = await request.json();
        const codeOrId = cleanStr(body.code || body.crewId, 128);
        if (!codeOrId) {
          return errorResponse(request, env, 'Crew code or ID is required.', 'INVALID_INPUT', 400);
        }

        const crew = await db
          .prepare('SELECT id, code, name, status FROM crews WHERE id = ?1 OR upper(code) = upper(?1) LIMIT 1')
          .bind(codeOrId)
          .first();

        if (!crew) {
          return errorResponse(request, env, 'Crew not found.', 'NOT_FOUND', 404);
        }
        if (crew.status !== 'active') {
          return errorResponse(request, env, 'This crew is currently suspended.', 'CREW_SUSPENDED', 403);
        }

        const existingMember = await db
          .prepare('SELECT id, status FROM crew_members WHERE crew_id = ?1 AND user_uid = ?2')
          .bind(crew.id, user.uid)
          .first();

        if (existingMember?.status === 'suspended') {
          return errorResponse(request, env, 'You have been suspended from this crew.', 'MEMBER_SUSPENDED', 403);
        }

        const now = Date.now();
        if (!existingMember) {
          await db.batch([
            db
              .prepare(
                `INSERT INTO crew_members (
                  id, crew_id, user_uid, user_name, user_email, user_avatar, role, status, joined_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'member', 'active', ?7, ?7)`
              )
              .bind(crypto.randomUUID(), crew.id, user.uid, user.name, user.email, user.picture, now),
            db
              .prepare(
                `UPDATE crews SET member_count = (SELECT COUNT(*) FROM crew_members WHERE crew_id = ?1 AND status = 'active'), updated_at = ?2 WHERE id = ?1`
              )
              .bind(crew.id, now),
          ]);
        }

        return jsonResponse(request, env, { ok: true, crewId: crew.id, crewName: crew.name });
      }

      // Crew details / delete / suspend / members
      const crewIdMatch = path.match(/^\/api\/crews\/([^/]+)$/);
      if (crewIdMatch) {
        const crewId = decodeURIComponent(crewIdMatch[1]);
        const crew = await db
          .prepare(
            `SELECT id, code, name, description, university, captain_uid AS captainUid,
                    captain_name AS captainName, captain_email AS captainEmail,
                    status, member_count AS memberCount, created_at AS createdAt
             FROM crews WHERE id = ?1`
          )
          .bind(crewId)
          .first();

        if (!crew) {
          return errorResponse(request, env, 'Crew not found.', 'NOT_FOUND', 404);
        }

        if (method === 'GET') {
          await authenticateRequest(request, env, true);
          const { results: members } = await db
            .prepare(
              `SELECT id, crew_id AS crewId, user_uid AS userUid, user_name AS userName,
                      user_email AS userEmail, user_avatar AS userAvatar, role, status,
                      joined_at AS joinedAt
               FROM crew_members WHERE crew_id = ?1 ORDER BY role ASC, joined_at ASC`
            )
            .bind(crewId)
            .all();
          return jsonResponse(request, env, { crew, members: members || [] });
        }

        if (method === 'DELETE') {
          const user = await authenticateRequest(request, env, true);
          if (crew.captainUid !== user.uid && !user.isAdminOrAbove) {
            return errorResponse(request, env, 'Only the crew captain or an admin can delete this crew.', 'FORBIDDEN', 403);
          }
          await db.prepare('DELETE FROM crews WHERE id = ?1').bind(crewId).run();
          return jsonResponse(request, env, { ok: true, id: crewId });
        }
      }

      const crewSuspendMatch = path.match(/^\/api\/crews\/([^/]+)\/suspend$/);
      if (crewSuspendMatch && method === 'POST') {
        const crewId = decodeURIComponent(crewSuspendMatch[1]);
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['admin', 'superadmin']);

        const crew = await db.prepare('SELECT id, status FROM crews WHERE id = ?1').bind(crewId).first();
        if (!crew) {
          return errorResponse(request, env, 'Crew not found.', 'NOT_FOUND', 404);
        }
        const body = await request.json().catch(() => ({}));
        const nextStatus =
          body.status === 'active' || body.status === 'suspended'
            ? body.status
            : crew.status === 'active'
            ? 'suspended'
            : 'active';

        await db
          .prepare('UPDATE crews SET status = ?1, updated_at = ?2 WHERE id = ?3')
          .bind(nextStatus, Date.now(), crewId)
          .run();

        return jsonResponse(request, env, { ok: true, id: crewId, status: nextStatus });
      }

      const crewMembersMatch = path.match(/^\/api\/crews\/([^/]+)\/members$/);
      if (crewMembersMatch && method === 'GET') {
        const crewId = decodeURIComponent(crewMembersMatch[1]);
        await authenticateRequest(request, env, true);
        const { results } = await db
          .prepare(
            `SELECT id, crew_id AS crewId, user_uid AS userUid, user_name AS userName,
                    user_email AS userEmail, user_avatar AS userAvatar, role, status,
                    joined_at AS joinedAt
             FROM crew_members WHERE crew_id = ?1 ORDER BY role ASC, joined_at ASC`
          )
          .bind(crewId)
          .all();
        return jsonResponse(request, env, { members: results || [] });
      }

      const memberActionMatch = path.match(/^\/api\/crews\/([^/]+)\/members\/([^/]+)(?:\/(suspend))?$/);
      if (memberActionMatch) {
        const crewId = decodeURIComponent(memberActionMatch[1]);
        const memberUid = decodeURIComponent(memberActionMatch[2]);
        const isSuspendAction = memberActionMatch[3] === 'suspend';

        const user = await authenticateRequest(request, env, true);
        const crew = await db.prepare('SELECT id, captain_uid FROM crews WHERE id = ?1').bind(crewId).first();
        if (!crew) {
          return errorResponse(request, env, 'Crew not found.', 'NOT_FOUND', 404);
        }
        if (crew.captain_uid !== user.uid && !user.isAdminOrAbove) {
          return errorResponse(request, env, 'Only the crew captain or an admin can manage crew members.', 'FORBIDDEN', 403);
        }

        const now = Date.now();
        if (isSuspendAction && method === 'POST') {
          const member = await db
            .prepare('SELECT id, status, role FROM crew_members WHERE crew_id = ?1 AND user_uid = ?2')
            .bind(crewId, memberUid)
            .first();
          if (!member) {
            return errorResponse(request, env, 'Member not found.', 'NOT_FOUND', 404);
          }
          if (member.role === 'captain') {
            return errorResponse(request, env, 'Cannot suspend the crew captain.', 'BAD_REQUEST', 400);
          }
          const nextStatus = member.status === 'active' ? 'suspended' : 'active';
          await db.batch([
            db
              .prepare('UPDATE crew_members SET status = ?1, updated_at = ?2 WHERE crew_id = ?3 AND user_uid = ?4')
              .bind(nextStatus, now, crewId, memberUid),
            db
              .prepare(
                `UPDATE crews SET member_count = (SELECT COUNT(*) FROM crew_members WHERE crew_id = ?1 AND status = 'active'), updated_at = ?2 WHERE id = ?1`
              )
              .bind(crewId, now),
          ]);
          return jsonResponse(request, env, { ok: true, userUid: memberUid, status: nextStatus });
        }

        if (!isSuspendAction && method === 'DELETE') {
          await db.batch([
            db
              .prepare('DELETE FROM crew_members WHERE crew_id = ?1 AND user_uid = ?2 AND role != \'captain\'')
              .bind(crewId, memberUid),
            db
              .prepare(
                `UPDATE crews SET member_count = (SELECT COUNT(*) FROM crew_members WHERE crew_id = ?1 AND status = 'active'), updated_at = ?2 WHERE id = ?1`
              )
              .bind(crewId, now),
          ]);
          return jsonResponse(request, env, { ok: true, userUid: memberUid });
        }
      }

      // 6. MCQ Bank (/api/mcq-bank and /api/questions) -> uses `questions` table
      if ((path === '/api/mcq-bank' || path === '/api/questions') && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        const bankId = cleanStr(url.searchParams.get('bank_id') || url.searchParams.get('bankId'), 40);
        const subject = cleanStr(url.searchParams.get('subject'), 80);
        const topic = cleanStr(url.searchParams.get('topic'), 120);
        const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 50));
        const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);

        const conditions = [];
        const binds = [];
        if (bankId && bankId !== 'all') {
          binds.push(bankId);
          conditions.push(`bank_id = ?${binds.length}`);
        }
        if (subject && subject !== 'all') {
          binds.push(subject.toLowerCase());
          conditions.push(`lower(subject) = ?${binds.length}`);
        }
        if (topic && topic !== 'all') {
          binds.push(topic);
          conditions.push(`topic = ?${binds.length}`);
        }
        if (!user.isAdminOrAbove) {
          conditions.push(`status = 'published'`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        binds.push(limit, offset);

        const { results } = await db
          .prepare(
            `SELECT id, bank_id, subject, topic, difficulty, status, needs_review,
                    question_text, options_json,
                    ${user.isAdminOrAbove ? 'correct_answer, explanation,' : ''}
                    created_at, updated_at
             FROM questions
             ${whereClause}
             ORDER BY updated_at DESC
             LIMIT ?${binds.length - 1} OFFSET ?${binds.length}`
          )
          .bind(...binds)
          .all();

        return jsonResponse(request, env, { questions: results || [] });
      }

      if ((path === '/api/mcq-bank' || path === '/api/questions') && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['admin', 'superadmin']);
        const body = await request.json();
        const id = cleanStr(body.id, 128) || crypto.randomUUID();
        const bankId = cleanStr(body.bank_id || body.bankId, 40, 'legacy');
        const subject = cleanStr(body.subject, 80, 'physics').toLowerCase();
        const topic = cleanStr(body.topic, 120, 'General');
        const difficulty = cleanStr(body.difficulty, 20, 'medium').toLowerCase();
        const status = cleanStr(body.status, 20, 'published').toLowerCase();
        const questionText = cleanStr(body.question_text || body.questionText || body.question, 3000);
        const options = Array.isArray(body.options) ? body.options.map((o) => cleanStr(o, 500)) : [];
        const correctAnswer = Math.max(0, Math.min(5, Number(body.correct_answer ?? body.correctAnswer ?? 0) || 0));
        const explanation = cleanStr(body.explanation, 3000, '');
        const now = Date.now();

        if (!questionText) {
          return errorResponse(request, env, 'Question text is required.', 'INVALID_QUESTION', 400);
        }

        await db
          .prepare(
            `INSERT INTO questions (
              id, bank_id, subject, topic, difficulty, status, needs_review,
              question_text, options_json, correct_answer, explanation, source_path,
              created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7, ?8, ?9, ?10, ?11, ?12, ?12)
            ON CONFLICT(id) DO UPDATE SET
              subject = ?3, topic = ?4, difficulty = ?5, status = ?6,
              question_text = ?7, options_json = ?8, correct_answer = ?9,
              explanation = ?10, updated_at = ?12`
          )
          .bind(
            id,
            bankId,
            subject,
            topic,
            difficulty,
            status,
            questionText,
            JSON.stringify(options),
            correctAnswer,
            explanation,
            `manual/${id}`,
            now
          )
          .run();

        return jsonResponse(request, env, { ok: true, id }, 201);
      }

      // 7. Community Posts, Comments (post_comments), Likes (post_likes)
      if (path === '/api/posts' && method === 'GET') {
        const subject = cleanStr(url.searchParams.get('subject'), 80);
        const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 30));

        const stmt =
          subject && subject.toLowerCase() !== 'all'
            ? db
                .prepare(
                  `SELECT * FROM posts WHERE is_hidden = 0 AND status = 'published' AND lower(subject) = lower(?1)
                   ORDER BY is_pinned DESC, created_at DESC LIMIT ?2`
                )
                .bind(subject, limit)
            : db
                .prepare(
                  `SELECT * FROM posts WHERE is_hidden = 0 AND status = 'published'
                   ORDER BY is_pinned DESC, created_at DESC LIMIT ?1`
                )
                .bind(limit);

        const { results } = await stmt.all();
        return jsonResponse(request, env, { posts: results || [] });
      }

      if (path === '/api/posts' && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        if (user.isPostingBanned) {
          return errorResponse(request, env, 'Your account is restricted from posting.', 'FORBIDDEN', 403);
        }
        const body = await request.json();
        const id = crypto.randomUUID();
        const title = cleanStr(body.title, MAX_TITLE_LEN);
        const description = cleanStr(body.description, MAX_TEXT_LEN);
        const subject = cleanStr(body.subject, 80, 'General');
        const type = cleanStr(body.type, 40, 'notes');
        const isAnonymous = body.isAnonymous ? 1 : 0;
        const now = Date.now();

        if (!title && !description) {
          return errorResponse(request, env, 'Post title or description is required.', 'INVALID_POST', 400);
        }

        await db
          .prepare(
            `INSERT INTO posts (
              id, slug, type, title, description, subject, tags_json, files_json,
              is_anonymous, author_uid, real_author_uid, author_name, author_avatar,
              author_role, status, visibility, created_at, updated_at
            ) VALUES (?1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'published', 'public', ?14, ?14)`
          )
          .bind(
            id,
            type,
            title,
            description,
            subject,
            JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
            JSON.stringify(Array.isArray(body.files) ? body.files : []),
            isAnonymous,
            isAnonymous ? null : user.uid,
            user.uid,
            isAnonymous ? 'Anonymous Student' : cleanStr(body.authorName || user.name, 120),
            isAnonymous ? null : body.authorAvatar || user.picture,
            user.role,
            now
          )
          .run();

        return jsonResponse(request, env, { ok: true, postId: id, id }, 201);
      }

      const postLikeMatch = path.match(/^\/api\/posts\/([^/]+)\/like$/);
      if (postLikeMatch && method === 'POST') {
        const postId = decodeURIComponent(postLikeMatch[1]);
        const user = await authenticateRequest(request, env, true);
        const existing = await db
          .prepare('SELECT post_id, user_uid FROM post_likes WHERE post_id = ?1 AND user_uid = ?2')
          .bind(postId, user.uid)
          .first();

        const now = Date.now();
        let liked = false;
        if (existing) {
          await db.batch([
            db.prepare('DELETE FROM post_likes WHERE post_id = ?1 AND user_uid = ?2').bind(postId, user.uid),
            db.prepare('UPDATE posts SET upvotes = MAX(0, upvotes - 1), updated_at = ?1 WHERE id = ?2').bind(now, postId),
          ]);
        } else {
          liked = true;
          await db.batch([
            db
              .prepare('INSERT INTO post_likes (post_id, user_uid, created_at) VALUES (?1, ?2, ?3)')
              .bind(postId, user.uid, now),
            db.prepare('UPDATE posts SET upvotes = upvotes + 1, updated_at = ?1 WHERE id = ?2').bind(now, postId),
          ]);
        }

        return jsonResponse(request, env, { ok: true, liked });
      }

      const postCommentsMatch = path.match(/^\/api\/posts\/([^/]+)\/comments$/);
      if (postCommentsMatch) {
        const postId = decodeURIComponent(postCommentsMatch[1]);
        if (method === 'GET') {
          const { results } = await db
            .prepare('SELECT * FROM post_comments WHERE post_id = ?1 ORDER BY created_at ASC LIMIT 200')
            .bind(postId)
            .all();
          return jsonResponse(request, env, { comments: results || [] });
        }
        if (method === 'POST') {
          const user = await authenticateRequest(request, env, true);
          const body = await request.json();
          const text = cleanStr(body.text, 2000);
          if (!text) {
            return errorResponse(request, env, 'Comment text is required.', 'INVALID_COMMENT', 400);
          }
          const commentId = crypto.randomUUID();
          const now = Date.now();
          await db.batch([
            db
              .prepare(
                `INSERT INTO post_comments (
                  id, post_id, text, is_anonymous, author_uid, real_author_uid,
                  author_name, author_avatar, author_role, created_at
                ) VALUES (?1, ?2, ?3, 0, ?4, ?4, ?5, ?6, ?7, ?8)`
              )
              .bind(commentId, postId, text, user.uid, cleanStr(body.authorName || user.name, 120), user.picture, user.role, now),
            db
              .prepare('UPDATE posts SET comment_count = comment_count + 1, updated_at = ?1 WHERE id = ?2')
              .bind(now, postId),
          ]);
          return jsonResponse(request, env, { ok: true, id: commentId }, 201);
        }
      }

      // 8. Notifications (uses user_id)
      if (path === '/api/notifications' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        const { results } = await db
          .prepare(
            `SELECT id, user_id AS userId, user_id AS userUid, type, title, message, link,
                    author_id AS authorId, author_name AS authorName,
                    author_avatar AS authorAvatar, author_frame AS authorFrame,
                    post_id AS postId, post_type AS postType, is_pinned AS isPinned,
                    read, created_at AS createdAt, read_at AS readAt
             FROM notifications
             WHERE user_id = ?1
             ORDER BY is_pinned DESC, created_at DESC LIMIT 100`
          )
          .bind(user.uid)
          .all();

        const notifications = (results || []).map((n) => ({
          ...n,
          read: Boolean(n.read),
        }));
        const unreadCount = notifications.filter((n) => !n.read).length;

        return jsonResponse(request, env, { notifications, unreadCount });
      }

      if ((path === '/api/notifications/mark-read' || path === '/api/notifications/read') && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        const body = await request.json();
        const id = cleanStr(body.id || body.notificationId, 128);
        if (!id) {
          return errorResponse(request, env, 'Notification ID required.', 'INVALID_ID', 400);
        }
        await db
          .prepare('UPDATE notifications SET read = 1, read_at = ?1 WHERE id = ?2 AND user_id = ?3')
          .bind(Date.now(), id, user.uid)
          .run();
        return jsonResponse(request, env, { ok: true, id });
      }

      if ((path === '/api/notifications/mark-all-read' || path === '/api/notifications/read-all') && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        await db
          .prepare('UPDATE notifications SET read = 1, read_at = ?1 WHERE user_id = ?2 AND read = 0')
          .bind(Date.now(), user.uid)
          .run();
        return jsonResponse(request, env, { ok: true });
      }

      // 9. Admin Bot Settings
      if (path === '/api/bots/settings' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['admin', 'superadmin']);
        let settings = await db
          .prepare('SELECT * FROM bot_settings WHERE id = \'default\'')
          .first();
        if (!settings) {
          const now = Date.now();
          await db
            .prepare(
              `INSERT INTO bot_settings (id, enabled, daily_post_limit, posts_per_run, comments_per_run, likes_per_run, updated_at)
               VALUES ('default', 1, 6, 2, 2, 4, ?1)`
            )
            .bind(now)
            .run();
          settings = await db.prepare('SELECT * FROM bot_settings WHERE id = \'default\'').first();
        }
        return jsonResponse(request, env, { settings });
      }

      if (path === '/api/bots/settings' && method === 'PUT') {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['admin', 'superadmin']);
        const body = await request.json();
        const enabled = body.enabled !== undefined ? (body.enabled ? 1 : 0) : 1;
        const dailyPostLimit = Math.max(0, Math.min(50, Number(body.dailyPostLimit ?? 6)));
        const postsPerRun = Math.max(0, Math.min(12, Number(body.postsPerRun ?? 2)));
        const commentsPerRun = Math.max(0, Math.min(20, Number(body.commentsPerRun ?? 2)));
        const likesPerRun = Math.max(0, Math.min(50, Number(body.likesPerRun ?? 4)));
        const now = Date.now();

        await db
          .prepare(
            `INSERT INTO bot_settings (id, enabled, daily_post_limit, posts_per_run, comments_per_run, likes_per_run, updated_at)
             VALUES ('default', ?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
               enabled = ?1, daily_post_limit = ?2, posts_per_run = ?3,
               comments_per_run = ?4, likes_per_run = ?5, updated_at = ?6`
          )
          .bind(enabled, dailyPostLimit, postsPerRun, commentsPerRun, likesPerRun, now)
          .run();

        return jsonResponse(request, env, { ok: true });
      }

      // =======================================================================
      // 10. GRAND LINE CERTIFICATES & PRIVATE ADMIN SIGNATURES (D1 + PRIVATE R2)
      // =======================================================================
      async function ensureCertificateD1Tables(database) {
        await database
          .prepare(
            `CREATE TABLE IF NOT EXISTS certificate_signatures (
              id TEXT PRIMARY KEY,
              r2_key TEXT NOT NULL,
              signatory_name TEXT NOT NULL,
              signatory_title TEXT NOT NULL,
              version INTEGER NOT NULL,
              uploaded_by TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              active INTEGER NOT NULL DEFAULT 1
            )`
          )
          .run();
        await database
          .prepare(
            `CREATE TABLE IF NOT EXISTS certificates (
              id TEXT PRIMARY KEY,
              student_uid TEXT NOT NULL,
              student_name TEXT NOT NULL,
              student_email TEXT NOT NULL DEFAULT '',
              grand_line_id TEXT NOT NULL,
              grand_line_title TEXT NOT NULL,
              edition_label TEXT NOT NULL DEFAULT '',
              rank INTEGER NOT NULL DEFAULT 1,
              score INTEGER NOT NULL DEFAULT 0,
              total_questions INTEGER NOT NULL DEFAULT 0,
              percentage INTEGER NOT NULL DEFAULT 0,
              participants_count INTEGER NOT NULL DEFAULT 1,
              serial TEXT NOT NULL UNIQUE,
              theme_id TEXT NOT NULL,
              signature_version INTEGER NOT NULL DEFAULT 1,
              issued_at INTEGER NOT NULL,
              pdf_r2_key TEXT NOT NULL,
              png_r2_key TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
              UNIQUE(student_uid, grand_line_id)
            )`
          )
          .run();

        await db
          .prepare('ALTER TABLE captain_tests ADD COLUMN certificate_theme_id TEXT DEFAULT NULL')
          .run()
          .catch(() => {});
        await db
          .prepare('ALTER TABLE captain_tests ADD COLUMN results_finalised INTEGER DEFAULT 0')
          .run()
          .catch(() => {});
        await db
          .prepare('ALTER TABLE captain_tests ADD COLUMN finalised_at INTEGER DEFAULT NULL')
          .run()
          .catch(() => {});
      }

      function uint8ArrayToBase64(bytes) {
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
      }

      function base64ToUint8Array(base64) {
        const clean = String(base64 || '').replace(/\s+/g, '');
        const raw = atob(clean);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          out[i] = raw.charCodeAt(i);
        }
        return out;
      }

      function isPngMagicBytes(bytes) {
        return (
          bytes &&
          bytes.length >= 8 &&
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47 &&
          bytes[4] === 0x0d &&
          bytes[5] === 0x0a &&
          bytes[6] === 0x1a &&
          bytes[7] === 0x0a
        );
      }

      async function loadSignatureDataUrlFromR2(r2Bucket, r2Key) {
        if (!r2Bucket || !r2Key) return null;
        try {
          const obj = await r2Bucket.get(r2Key);
          if (!obj) return null;
          const ab = await obj.arrayBuffer();
          const bytes = new Uint8Array(ab);
          if (bytes.byteLength === 0) return null;
          return `data:image/png;base64,${uint8ArrayToBase64(bytes)}`;
        } catch {
          return null;
        }
      }

      async function signWorkerCertToken(certId, fmt, expMs) {
        const secret = String(env.INTERNAL_EMAIL_SECRET || 'boardly_cert_hmac_v1').trim();
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const mac = await crypto.subtle.sign(
          'HMAC',
          key,
          new TextEncoder().encode(`${certId}:${fmt}:${expMs}`)
        );
        return Array.from(new Uint8Array(mac))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }

      async function verifyWorkerCertToken(certId, fmt, token, expMs) {
        const expNum = Number(expMs || 0);
        if (!Number.isFinite(expNum) || expNum < Date.now() || !token) return false;
        const expected = await signWorkerCertToken(certId, fmt, expNum);
        return expected === String(token).trim();
      }

      const WORKER_CERT_THEMES = {
        default: {
          id: 'default',
          bg: '#09090B',
          cardSurface: '#121216',
          border: '#EF4444',
          ink: '#FAFAFA',
          muted: '#A1A1AA',
          accent: '#EF4444',
          secondary: '#E4E4E7',
          sigInk: '#FAFAFA',
        },
        'default-light': {
          id: 'default-light',
          bg: '#F4F4F0',
          cardSurface: '#FFFFFF',
          border: '#09090B',
          ink: '#09090B',
          muted: '#52525B',
          accent: '#DC2626',
          secondary: '#18181B',
          sigInk: '#09090B',
        },
        'red-dark': {
          id: 'red-dark',
          bg: '#160709',
          cardSurface: '#240B0F',
          border: '#F43F5E',
          ink: '#FFF1F2',
          muted: '#FDA4AF',
          accent: '#F43F5E',
          secondary: '#FB923C',
          sigInk: '#FFE4E6',
        },
        'light-red': {
          id: 'light-red',
          bg: '#FAF6F0',
          cardSurface: '#FFFDF9',
          border: '#E11D48',
          ink: '#1C1917',
          muted: '#57534E',
          accent: '#E11D48',
          secondary: '#9F1239',
          sigInk: '#1C1917',
        },
        'blue-dark': {
          id: 'blue-dark',
          bg: '#061024',
          cardSurface: '#0C1D3D',
          border: '#38BDF8',
          ink: '#F0F9FF',
          muted: '#93C5FD',
          accent: '#38BDF8',
          secondary: '#818CF8',
          sigInk: '#E0F2FE',
        },
        'green-dark': {
          id: 'green-dark',
          bg: '#051812',
          cardSurface: '#0A291F',
          border: '#10B981',
          ink: '#ECFDF5',
          muted: '#6EE7B7',
          accent: '#10B981',
          secondary: '#2DD4BF',
          sigInk: '#D1FAE5',
        },
        'amber-dark': {
          id: 'amber-dark',
          bg: '#140E05',
          cardSurface: '#211708',
          border: '#F59E0B',
          ink: '#FFFBEB',
          muted: '#FCD34D',
          accent: '#F59E0B',
          secondary: '#FDE047',
          sigInk: '#FEF08A',
        },
        'mono-light': {
          id: 'mono-light',
          bg: '#FFFFFF',
          cardSurface: '#F8FAFC',
          border: '#0F172A',
          ink: '#0F172A',
          muted: '#475569',
          accent: '#0F172A',
          secondary: '#DC2626',
          sigInk: '#0F172A',
        },
      };

      const WORKER_AUTO_THEMES = [
        {
          id: 'auto-violet-dark',
          bg: '#0F0720',
          cardSurface: '#190D33',
          border: '#A855F7',
          ink: '#FAF5FF',
          muted: '#D8B4FE',
          accent: '#A855F7',
          secondary: '#EC4899',
          sigInk: '#F3E8FF',
        },
        ...Object.values(WORKER_CERT_THEMES),
      ];

      function resolveWorkerCertThemeColors(grandLineId, themeId, studentSeed) {
        if (themeId && WORKER_CERT_THEMES[themeId]) return WORKER_CERT_THEMES[themeId];
        if (!studentSeed && (!themeId || themeId === 'auto')) {
          return WORKER_AUTO_THEMES[0];
        }
        let h = 0x811c9dc5;
        const s = `${grandLineId || 'gl_mock_01'}::${studentSeed || 'sample'}`;
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 0x01000193) >>> 0;
        }
        return WORKER_AUTO_THEMES[h % WORKER_AUTO_THEMES.length];
      }

      function hexToRgb01(hex) {
        const clean = String(hex || '#0A0A0D').replace('#', '');
        const r = parseInt(clean.slice(0, 2), 16) || 10;
        const g = parseInt(clean.slice(2, 4), 16) || 10;
        const b = parseInt(clean.slice(4, 6), 16) || 13;
        return {
          r,
          g,
          b,
          rf: (r / 255).toFixed(3),
          gf: (g / 255).toFixed(3),
          bf: (b / 255).toFixed(3),
        };
      }

      function escapePdfText(str) {
        return String(str || '')
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
      }

      function formatWorkerCertDate(ts) {
        const d = new Date(Number(ts || Date.now()));
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const day = String(d.getUTCDate()).padStart(2, '0');
        const mon = months[d.getUTCMonth()] || 'JAN';
        const yr = d.getUTCFullYear();
        return `${day} ${mon} ${yr}`;
      }

      function buildWorkerCertificatePdfBytes(certRow, sigRow) {
        const palette = resolveWorkerCertThemeColors(certRow.grand_line_id, certRow.theme_id, certRow.student_uid || certRow.serial);
        const bg = hexToRgb01(palette.bg);
        const cardSurface = hexToRgb01(palette.cardSurface || palette.bg);
        const border = hexToRgb01(palette.border || palette.accent);
        const ink = hexToRgb01(palette.ink);
        const muted = hexToRgb01(palette.muted);
        const accent = hexToRgb01(palette.accent);
        const sigInk = hexToRgb01(palette.sigInk || palette.ink);

        const serial = String(certRow.serial || 'BDLY-GL01-0001');
        const studentName = String(certRow.student_name || 'Student');
        const mockTitle = String(certRow.grand_line_title || 'Boardly Grand Line Mock');
        const editionLabel = String(certRow.edition_label || 'OFFICIAL EDITION').toUpperCase();
        const score = Number(certRow.score || 0);
        const totalQ = Number(certRow.total_questions || 0);
        const pct = Number(certRow.percentage || (totalQ > 0 ? Math.round((score / totalQ) * 100) : 100));
        const scoreStr = totalQ > 0 ? `${score}/${totalQ} (${pct}%)` : `${score}`;
        const participants = Number(certRow.participants_count || 1);
        const dateStr = formatWorkerCertDate(certRow.issued_at);
        const sigName = String(sigRow?.signatory_name || 'Boardly Examination Council');
        const sigTitle = String(sigRow?.signatory_title || 'Founder, Boardly');
        const sigVer = Number(sigRow?.version || certRow.signature_version || 1);

        const contentLines = [
          'q',
          `${bg.rf} ${bg.gf} ${bg.bf} rg`,
          '0 0 1123 794 re f',
          `${cardSurface.rf} ${cardSurface.gf} ${cardSurface.bf} rg`,
          '56 48 1011 698 re f',
          `${border.rf} ${border.gf} ${border.bf} RG 2 w`,
          '56 48 1011 698 re S',
          'BT',
          `/F2 22 Tf ${ink.rf} ${ink.gf} ${ink.bf} rg 104 686 Td (BOARDLY .) Tj`,
          `/F2 11 Tf ${muted.rf} ${muted.gf} ${muted.bf} rg 0 -22 Td (GRAND LINE MOCK / ${escapePdfText(editionLabel)}) Tj`,
          `/F2 12 Tf ${accent.rf} ${accent.gf} ${accent.bf} rg 330 -60 Td (CERTIFICATE OF EXCELLENCE) Tj`,
          `/F1 40 Tf ${accent.rf} ${accent.gf} ${accent.bf} rg -20 -58 Td (1ST POSITION) Tj`,
          `/F2 12 Tf ${muted.rf} ${muted.gf} ${muted.bf} rg 35 -48 Td (PROUDLY PRESENTED TO) Tj`,
          `/F1 34 Tf ${ink.rf} ${ink.gf} ${ink.bf} rg -60 -52 Td (${escapePdfText(studentName)}) Tj`,
          `/F1 14 Tf ${muted.rf} ${muted.gf} ${muted.bf} rg -140 -48 Td (for securing First Position in ${escapePdfText(mockTitle)} with a score of ${escapePdfText(scoreStr)}, ahead of ${participants} participants.) Tj`,
          `/F2 11 Tf ${ink.rf} ${ink.gf} ${ink.bf} rg -45 -180 Td (DATE ISSUED: ${escapePdfText(dateStr)}   |   SERIAL: ${escapePdfText(serial)}   |   VERIFY: boardly.cfd/verify/${escapePdfText(serial)}) Tj`,
          `/F1 13 Tf ${sigInk.rf} ${sigInk.gf} ${sigInk.bf} rg 0 -28 Td (AUTHORISED BY: ${escapePdfText(sigName)} - ${escapePdfText(sigTitle)} [Signature v${sigVer}]) Tj`,
          'ET',
          'Q',
        ];
        const streamStr = contentLines.join('\n');

        const objs = [
          '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
          '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
          '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1123 794] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
          '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
          '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n',
          `6 0 obj\n<< /Length ${streamStr.length} >>\nstream\n${streamStr}\nendstream\nendobj\n`,
        ];

        let pdf = '%PDF-1.4\n';
        const offsets = [0];
        for (const o of objs) {
          offsets.push(pdf.length);
          pdf += o;
        }
        const xrefStart = pdf.length;
        pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
        for (let i = 1; i <= objs.length; i++) {
          pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
        }
        pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
        return new TextEncoder().encode(pdf);
      }

      let crcTableCache = null;
      function getCrc32Table() {
        if (crcTableCache) return crcTableCache;
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          }
          table[n] = c >>> 0;
        }
        crcTableCache = table;
        return table;
      }

      function crc32(bytes) {
        const table = getCrc32Table();
        let crc = 0xffffffff;
        for (let i = 0; i < bytes.length; i++) {
          crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
      }

      function adler32(bytes) {
        let a = 1;
        let b = 0;
        const MOD = 65521;
        for (let i = 0; i < bytes.length; i++) {
          a = (a + bytes[i]) % MOD;
          b = (b + a) % MOD;
        }
        return ((b << 16) | a) >>> 0;
      }

      function makePngChunk(typeFourCC, dataBytes) {
        const len = dataBytes.length;
        const out = new Uint8Array(12 + len);
        const view = new DataView(out.buffer);
        view.setUint32(0, len, false);
        for (let i = 0; i < 4; i++) {
          out[4 + i] = typeFourCC.charCodeAt(i);
        }
        out.set(dataBytes, 8);
        const crcInput = out.subarray(4, 8 + len);
        view.setUint32(8 + len, crc32(crcInput), false);
        return out;
      }

      function buildWorkerCertificatePngBytes(certRow, sigRow) {
        const palette = resolveWorkerCertThemeColors(certRow.grand_line_id, certRow.theme_id, certRow.student_uid || certRow.serial);
        const bg = hexToRgb01(palette.bg);
        const cardSurface = hexToRgb01(palette.cardSurface || palette.bg);
        const accent = hexToRgb01(palette.accent);
        const ink = hexToRgb01(palette.ink);

        const w = 112;
        const h = 79;
        const rawScanlines = new Uint8Array(h * (1 + w * 3));
        let ptr = 0;
        for (let y = 0; y < h; y++) {
          rawScanlines[ptr++] = 0; // filter type 0
          for (let x = 0; x < w; x++) {
            const isBorder = x === 5 || x === w - 6 || y === 4 || y === h - 5;
            const isHeaderDot = x >= 22 && x <= 25 && y >= 10 && y <= 13;
            const isCenterBar = y >= 32 && y <= 34 && x >= 20 && x <= w - 20;
            const isInsideCard = x > 5 && x < w - 6 && y > 4 && y < h - 5;
            if (isBorder || isHeaderDot || isCenterBar) {
              rawScanlines[ptr++] = accent.r;
              rawScanlines[ptr++] = accent.g;
              rawScanlines[ptr++] = accent.b;
            } else if (isInsideCard && (x + y) % 11 === 0) {
              rawScanlines[ptr++] = ink.r;
              rawScanlines[ptr++] = ink.g;
              rawScanlines[ptr++] = ink.b;
            } else if (isInsideCard) {
              rawScanlines[ptr++] = cardSurface.r;
              rawScanlines[ptr++] = cardSurface.g;
              rawScanlines[ptr++] = cardSurface.b;
            } else {
              rawScanlines[ptr++] = bg.r;
              rawScanlines[ptr++] = bg.g;
              rawScanlines[ptr++] = bg.b;
            }
          }
        }

        // Wrap rawScanlines in uncompressed Zlib stream (CMF=0x78, FLG=0x01, BFINAL=1, LEN, NLEN, data, Adler32)
        const len = rawScanlines.length;
        const zlib = new Uint8Array(2 + 5 + len + 4);
        zlib[0] = 0x78;
        zlib[1] = 0x01;
        zlib[2] = 0x01; // final uncompressed block
        zlib[3] = len & 0xff;
        zlib[4] = (len >>> 8) & 0xff;
        const nlen = ~len & 0xffff;
        zlib[5] = nlen & 0xff;
        zlib[6] = (nlen >>> 8) & 0xff;
        zlib.set(rawScanlines, 7);
        const adlerView = new DataView(zlib.buffer);
        adlerView.setUint32(7 + len, adler32(rawScanlines), false);

        const ihdr = new Uint8Array(13);
        const ihdrView = new DataView(ihdr.buffer);
        ihdrView.setUint32(0, w, false);
        ihdrView.setUint32(4, h, false);
        ihdr[8] = 8; // bit depth 8
        ihdr[9] = 2; // color type 2 (RGB)
        ihdr[10] = 0;
        ihdr[11] = 0;
        ihdr[12] = 0;

        const metaStr = `BoardlyCertificate\0serial=${certRow.serial};student=${certRow.student_name};mock=${certRow.grand_line_title};sig_v=${sigRow?.version || certRow.signature_version || 1}`;
        const textBytes = new TextEncoder().encode(metaStr);

        const sigHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        const cIhdr = makePngChunk('IHDR', ihdr);
        const cText = makePngChunk('tEXt', textBytes);
        const cIdat = makePngChunk('IDAT', zlib);
        const cIend = makePngChunk('IEND', new Uint8Array(0));

        const total = sigHeader.length + cIhdr.length + cText.length + cIdat.length + cIend.length;
        const out = new Uint8Array(total);
        let offset = 0;
        for (const part of [sigHeader, cIhdr, cText, cIdat, cIend]) {
          out.set(part, offset);
          offset += part.length;
        }
        return out;
      }

      async function renderAndStoreWorkerCertificate(env, certRow, sigRow) {
        if (!env.R2_BUCKET) {
          throw new Error('R2_BUCKET binding is not configured on this Worker.');
        }
        const pdfBytes = buildWorkerCertificatePdfBytes(certRow, sigRow);
        const pngBytes = buildWorkerCertificatePngBytes(certRow, sigRow);

        const pdfKey = certRow.pdf_r2_key || `certificates/${certRow.grand_line_id}/${certRow.serial}.pdf`;
        const pngKey = certRow.png_r2_key || `certificates/${certRow.grand_line_id}/${certRow.serial}.png`;

        await env.R2_BUCKET.put(pdfKey, pdfBytes, {
          httpMetadata: {
            contentType: 'application/pdf',
            cacheControl: 'private, no-store',
          },
        });
        await env.R2_BUCKET.put(pngKey, pngBytes, {
          httpMetadata: {
            contentType: 'image/png',
            cacheControl: 'private, no-store',
          },
        });
        return { pdfKey, pngKey, pdfBytes, pngBytes };
      }

      // Block any direct public/student access to /api/signatures/*
      if (path.startsWith('/api/signatures/')) {
        return errorResponse(
          request,
          env,
          'Forbidden: Signature files are private in R2 and can only be accessed by admins on the server.',
          'SIGNATURE_PRIVATE',
          403
        );
      }

      // Public Verification Endpoint: GET /api/verify/:serial
      const verifyMatch = path.match(/^\/api\/verify\/([^/]+)$/);
      if (verifyMatch && method === 'GET') {
        await ensureCertificateD1Tables(db);
        const serial = decodeURIComponent(verifyMatch[1]).trim().toUpperCase();
        const cert = await db
          .prepare(
            `SELECT serial, student_name, grand_line_title, edition_label, rank, score,
                    total_questions, percentage, participants_count, issued_at, status
             FROM certificates
             WHERE UPPER(serial) = ?1`
          )
          .bind(serial)
          .first();

        if (!cert) {
          return jsonResponse(
            request,
            env,
            { valid: false, status: 'not_found', serial, error: 'Certificate serial not found.' },
            404
          );
        }

        const isRevoked = cert.status === 'revoked';
        const safeCertificate = {
          serial: cert.serial,
          status: isRevoked ? 'revoked' : 'active',
          studentName: cert.student_name,
          mockTitle: cert.grand_line_title,
          grandLineTitle: cert.grand_line_title,
          editionLabel: cert.edition_label,
          rank: Number(cert.rank || 1),
          score: Number(cert.score || 0),
          totalQuestions: Number(cert.total_questions || 0),
          percentage: Number(cert.percentage || 0),
          participantsCount: Number(cert.participants_count || 1),
          issuedAt: Number(cert.issued_at),
        };
        return jsonResponse(request, env, {
          valid: !isRevoked,
          ...safeCertificate,
          certificate: safeCertificate,
        });
      }

      // Student My Certificates: GET /api/certificates/mine
      if (path === '/api/certificates/mine' && method === 'GET') {
        const user = await authenticateRequest(request, env, true);
        await ensureCertificateD1Tables(db);
        const { results } = await db
          .prepare(
            `SELECT * FROM certificates
             WHERE student_uid = ?1 AND status = 'active'
             ORDER BY issued_at DESC`
          )
          .bind(user.uid)
          .all();

        const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
        const mapped = [];
        for (const c of results || []) {
          const pngToken = await signWorkerCertToken(c.id, 'png', exp);
          const pdfToken = await signWorkerCertToken(c.id, 'pdf', exp);
          mapped.push({
            id: c.id,
            serial: c.serial,
            studentUid: c.student_uid,
            studentName: c.student_name,
            grandLineId: c.grand_line_id,
            grandLineTitle: c.grand_line_title,
            editionLabel: c.edition_label,
            rank: Number(c.rank || 1),
            score: Number(c.score || 0),
            totalQuestions: Number(c.total_questions || 0),
            percentage: Number(c.percentage || 0),
            participantsCount: Number(c.participants_count || 1),
            themeId: c.theme_id,
            signatureVersion: Number(c.signature_version || 0),
            issuedAt: Number(c.issued_at),
            status: c.status,
            verifyUrl: `/verify/${encodeURIComponent(c.serial)}`,
            previewPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&inline=1&token=${pngToken}&exp=${exp}`,
            downloadPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&token=${pngToken}&exp=${exp}`,
            downloadPdfUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=pdf&token=${pdfToken}&exp=${exp}`,
          });
        }
        return jsonResponse(request, env, { certificates: mapped });
      }

      // Certificate Share Link: POST /api/certificates/:id/share-link
      const certShareMatch = path.match(/^\/api\/certificates\/([^/]+)\/share-link$/);
      if (certShareMatch && method === 'POST') {
        const user = await authenticateRequest(request, env, true);
        await ensureCertificateD1Tables(db);
        const certId = decodeURIComponent(certShareMatch[1]).trim();
        const cert = await db
          .prepare('SELECT * FROM certificates WHERE id = ?1 OR serial = ?1')
          .bind(certId)
          .first();
        if (!cert) {
          return errorResponse(request, env, 'Certificate not found.', 'NOT_FOUND', 404);
        }
        if (cert.student_uid !== user.uid && !user.isAdminOrAbove) {
          return errorResponse(request, env, 'Forbidden', 'FORBIDDEN', 403);
        }
        const expMs = Date.now() + 1000 * 60 * 60 * 24;
        const pngToken = await signWorkerCertToken(cert.id, 'png', expMs);
        const pdfToken = await signWorkerCertToken(cert.id, 'pdf', expMs);
        return jsonResponse(request, env, {
          ok: true,
          serial: cert.serial,
          verifyUrl: `/verify/${encodeURIComponent(cert.serial)}`,
          signedPngUrl: `/api/certificates/${encodeURIComponent(cert.id)}/download?format=png&token=${pngToken}&exp=${expMs}`,
          signedPdfUrl: `/api/certificates/${encodeURIComponent(cert.id)}/download?format=pdf&token=${pdfToken}&exp=${expMs}`,
          expiresAt: expMs,
        });
      }

      // Certificate Download (Authenticated Owner, Admin, or Signed Token): GET /api/certificates/:id/download
      const certDownloadMatch = path.match(/^\/api\/certificates\/([^/]+)\/download$/);
      if (certDownloadMatch && method === 'GET') {
        await ensureCertificateD1Tables(db);
        const certId = decodeURIComponent(certDownloadMatch[1]).trim();
        const format = url.searchParams.get('format') === 'png' ? 'png' : 'pdf';
        const isInline = url.searchParams.get('inline') === '1';

        const cert = await db
          .prepare('SELECT * FROM certificates WHERE id = ?1 OR serial = ?1')
          .bind(certId)
          .first();
        if (!cert) {
          return errorResponse(request, env, 'Certificate not found.', 'NOT_FOUND', 404);
        }

        const tokenParam = url.searchParams.get('token') || '';
        const expParam = url.searchParams.get('exp') || '';
        const validSigned = await verifyWorkerCertToken(cert.id, format, tokenParam, expParam);

        let isAdmin = false;
        if (!validSigned) {
          const user = await authenticateRequest(request, env, true);
          isAdmin = Boolean(user.isAdminOrAbove);
          if (user.uid !== cert.student_uid && !isAdmin) {
            return errorResponse(
              request,
              env,
              'Forbidden: You can only download certificates belonging to your own account.',
              'FORBIDDEN',
              403
            );
          }
        }

        if (cert.status === 'revoked' && !isAdmin) {
          return errorResponse(request, env, 'This certificate has been revoked.', 'CERTIFICATE_REVOKED', 403);
        }

        const r2Key = format === 'png' ? cert.png_r2_key : cert.pdf_r2_key;
        if (env.R2_BUCKET) {
          let obj = await env.R2_BUCKET.get(r2Key);
          if (!obj) {
            const sigRow = await db
              .prepare('SELECT * FROM certificate_signatures WHERE version = ?1 LIMIT 1')
              .bind(Number(cert.signature_version || 1))
              .first();
            await renderAndStoreWorkerCertificate(env, cert, sigRow);
            obj = await env.R2_BUCKET.get(r2Key);
          }
          if (obj) {
            return new Response(obj.body, {
              status: 200,
              headers: {
                ...getCorsHeaders(request, env),
                'Content-Type': format === 'png' ? 'image/png' : 'application/pdf',
                'Cache-Control': 'private, no-store',
                'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${cert.serial}.${format}"`,
              },
            });
          }
        }
        return errorResponse(request, env, 'Certificate file not found in private R2.', 'NOT_FOUND', 404);
      }

      // Admin Signatures & Admin Certificates (Superadmin / Admin Only)
      if (path.startsWith('/api/admin/signatures') || path.startsWith('/api/admin/certificates')) {
        const user = await authenticateRequest(request, env, true);
        requireRole(user, ['admin', 'superadmin']);
        await ensureCertificateD1Tables(db);

        // 1. POST /api/admin/signatures (super admin / admin only)
        if (path === '/api/admin/signatures' && method === 'POST') {
          const MAX_SIG_BYTES = 2 * 1024 * 1024; // 2 MB
          const contentType = String(request.headers.get('content-type') || '').toLowerCase();

          let pngBytes = null;
          let signatoryName = '';
          let signatoryTitle = '';

          if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            signatoryName = String(
              formData.get('signatory_name') || formData.get('signatoryName') || ''
            )
              .trim()
              .slice(0, 120);
            signatoryTitle = String(
              formData.get('signatory_title') || formData.get('signatoryTitle') || ''
            )
              .trim()
              .slice(0, 140);

            const imageField = formData.get('image') || formData.get('imageBase64') || formData.get('file');
            if (!imageField) {
              return errorResponse(
                request,
                env,
                'Signature image is required.',
                'MISSING_SIGNATURE_IMAGE',
                400
              );
            }
            if (typeof imageField === 'string') {
              const dataUriMatch = /^data:image\/png;base64,(.+)$/i.exec(imageField.trim());
              const b64 = dataUriMatch ? dataUriMatch[1] : imageField.trim();
              try {
                pngBytes = base64ToUint8Array(b64);
              } catch {
                return errorResponse(
                  request,
                  env,
                  'Invalid base64 signature image data.',
                  'INVALID_SIGNATURE_FORMAT',
                  400
                );
              }
            } else if (typeof imageField.arrayBuffer === 'function') {
              const ab = await imageField.arrayBuffer();
              pngBytes = new Uint8Array(ab);
            }
          } else {
            const body = await request.json().catch(() => null);
            if (!body || typeof body !== 'object') {
              return errorResponse(request, env, 'Invalid JSON request body.', 'INVALID_JSON', 400);
            }
            const rawImage = String(body.imageBase64 || body.image || body.dataUrl || '').trim();
            signatoryName = String(body.signatoryName ?? body.signatory_name ?? '')
              .trim()
              .slice(0, 120);
            signatoryTitle = String(body.signatoryTitle ?? body.signatory_title ?? '')
              .trim()
              .slice(0, 140);

            if (!rawImage) {
              return errorResponse(
                request,
                env,
                'Signature image is required (PNG format, max 2 MB).',
                'MISSING_SIGNATURE_IMAGE',
                400
              );
            }

            let b64 = rawImage;
            if (rawImage.startsWith('data:')) {
              const match = /^data:([^;]+);base64,(.+)$/i.exec(rawImage);
              if (!match) {
                return errorResponse(
                  request,
                  env,
                  'Malformed data URL for signature image.',
                  'INVALID_SIGNATURE_FORMAT',
                  400
                );
              }
              const mime = match[1].toLowerCase();
              if (mime !== 'image/png') {
                return errorResponse(
                  request,
                  env,
                  'Signature image must be a PNG file (image/png).',
                  'INVALID_SIGNATURE_FORMAT',
                  400
                );
              }
              b64 = match[2];
            }

            try {
              pngBytes = base64ToUint8Array(b64);
            } catch {
              return errorResponse(
                request,
                env,
                'Invalid base64 encoding for signature image.',
                'INVALID_SIGNATURE_FORMAT',
                400
              );
            }
          }

          if (!signatoryName) {
            return errorResponse(
              request,
              env,
              'Signatory name is required.',
              'MISSING_SIGNATORY_NAME',
              400
            );
          }
          if (!signatoryTitle) {
            return errorResponse(
              request,
              env,
              'Signatory title is required.',
              'MISSING_SIGNATORY_TITLE',
              400
            );
          }
          if (!pngBytes || pngBytes.byteLength === 0) {
            return errorResponse(
              request,
              env,
              'Signature image is empty.',
              'EMPTY_IMAGE',
              400
            );
          }
          if (pngBytes.byteLength > MAX_SIG_BYTES) {
            return errorResponse(
              request,
              env,
              'Signature image exceeds the maximum size of 2 MB.',
              'FILE_TOO_LARGE',
              413
            );
          }
          if (!isPngMagicBytes(pngBytes)) {
            return errorResponse(
              request,
              env,
              'Invalid PNG file: signature image must be a valid PNG.',
              'INVALID_SIGNATURE_FORMAT',
              400
            );
          }

          const maxRow = await db
            .prepare('SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM certificate_signatures')
            .first();
          const version = Number(maxRow?.next_version || 1);
          const now = Date.now();
          const id = crypto.randomUUID();
          const r2Key = `signatures/sig-v${version}-${now}.png`;
          const uploadedBy = user.uid || user.email || 'admin';

          if (!env.R2_BUCKET) {
            return errorResponse(
              request,
              env,
              'Private R2 bucket binding (R2_BUCKET) is not configured on this Worker.',
              'R2_NOT_CONFIGURED',
              500
            );
          }

          await env.R2_BUCKET.put(r2Key, pngBytes, {
            httpMetadata: {
              contentType: 'image/png',
              cacheControl: 'private, max-age=300',
            },
          });

          try {
            await db.batch([
              db.prepare('SELECT COALESCE(MAX(version), 0) + 1 AS version FROM certificate_signatures'),
              db.prepare('UPDATE certificate_signatures SET active = 0 WHERE active = 1'),
              db
                .prepare(
                  `INSERT INTO certificate_signatures
                   (id, r2_key, signatory_name, signatory_title, version, uploaded_by, created_at, active)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1)`
                )
                .bind(id, r2Key, signatoryName, signatoryTitle, version, uploadedBy, now),
            ]);
          } catch (d1Err) {
            await env.R2_BUCKET.delete(r2Key).catch(() => {});
            throw d1Err;
          }

          const previewDataUrl = `data:image/png;base64,${uint8ArrayToBase64(pngBytes)}`;
          return jsonResponse(
            request,
            env,
            {
              ok: true,
              signature: {
                id,
                version,
                signatory_name: signatoryName,
                signatory_title: signatoryTitle,
                created_at: now,
                signatoryName,
                signatoryTitle,
                createdAt: now,
                uploadedBy,
                active: true,
                imageUrl: `/api/admin/signatures/${encodeURIComponent(id)}/image`,
                previewDataUrl,
              },
            },
            201
          );
        }

        // 2. GET /api/admin/signatures (super admin / admin only)
        if (path === '/api/admin/signatures' && method === 'GET') {
          const { results } = await db
            .prepare(
              'SELECT id, r2_key, signatory_name, signatory_title, version, uploaded_by, created_at, active FROM certificate_signatures ORDER BY version DESC'
            )
            .all();

          const history = [];
          for (const r of results || []) {
            const previewDataUrl = await loadSignatureDataUrlFromR2(env.R2_BUCKET, r.r2_key);
            const imageUrl = `/api/admin/signatures/${encodeURIComponent(r.id)}/image`;
            history.push({
              id: r.id,
              version: Number(r.version),
              signatory_name: r.signatory_name,
              signatory_title: r.signatory_title,
              created_at: Number(r.created_at),
              uploaded_by: r.uploaded_by,
              signatoryName: r.signatory_name,
              signatoryTitle: r.signatory_title,
              createdAt: Number(r.created_at),
              uploadedBy: r.uploaded_by,
              active: Boolean(r.active),
              imageUrl,
              previewDataUrl: previewDataUrl || imageUrl,
            });
          }

          const activeSignature = history.find((h) => h.active) || null;
          return jsonResponse(request, env, {
            ok: true,
            hasActiveSignature: Boolean(activeSignature),
            activeSignature,
            history,
          });
        }

        // 3. GET /api/admin/signatures/:id/image (super admin / admin only)
        const sigImageMatch = path.match(/^\/api\/admin\/signatures\/([^/]+)\/image$/);
        if (sigImageMatch && method === 'GET') {
          const sigId = decodeURIComponent(sigImageMatch[1]).trim();
          const sigRow =
            sigId === 'active'
              ? await db
                  .prepare(
                    'SELECT id, r2_key FROM certificate_signatures WHERE active = 1 ORDER BY version DESC LIMIT 1'
                  )
                  .first()
              : await db
                  .prepare('SELECT id, r2_key FROM certificate_signatures WHERE id = ?1 OR CAST(version AS TEXT) = ?1')
                  .bind(sigId)
                  .first();

          if (!sigRow || !sigRow.r2_key) {
            return errorResponse(request, env, 'Signature not found.', 'NOT_FOUND', 404);
          }
          if (!env.R2_BUCKET) {
            return errorResponse(request, env, 'R2_BUCKET binding is missing.', 'R2_NOT_CONFIGURED', 500);
          }
          const obj = await env.R2_BUCKET.get(sigRow.r2_key);
          if (!obj) {
            return errorResponse(request, env, 'Signature image object not found in R2.', 'NOT_FOUND', 404);
          }

          return new Response(obj.body, {
            status: 200,
            headers: {
              ...getCorsHeaders(request, env),
              'Content-Type': 'image/png',
              'Cache-Control': 'private, max-age=300',
            },
          });
        }

        // PUT /api/admin/signatures/active — Update signatory name/title on active signature
        if (path === '/api/admin/signatures/active' && method === 'PUT') {
          const active = await db
            .prepare('SELECT * FROM certificate_signatures WHERE active = 1 ORDER BY version DESC LIMIT 1')
            .first();
          if (!active) {
            return errorResponse(request, env, 'No active signature found.', 'NOT_FOUND', 404);
          }
          const body = await request.json().catch(() => ({}));
          const nextName =
            body.signatoryName !== undefined || body.signatory_name !== undefined
              ? String(body.signatoryName ?? body.signatory_name ?? '').trim().slice(0, 120) || active.signatory_name
              : active.signatory_name;
          const nextTitle =
            body.signatoryTitle !== undefined || body.signatory_title !== undefined
              ? String(body.signatoryTitle ?? body.signatory_title ?? '').trim().slice(0, 140)
              : active.signatory_title;

          await db
            .prepare('UPDATE certificate_signatures SET signatory_name = ?1, signatory_title = ?2 WHERE id = ?3')
            .bind(nextName, nextTitle, active.id)
            .run();

          const previewDataUrl = await loadSignatureDataUrlFromR2(env.R2_BUCKET, active.r2_key);
          const imageUrl = `/api/admin/signatures/${encodeURIComponent(active.id)}/image`;
          return jsonResponse(request, env, {
            ok: true,
            signature: {
              id: active.id,
              version: Number(active.version),
              signatory_name: nextName,
              signatory_title: nextTitle,
              created_at: Number(active.created_at),
              signatoryName: nextName,
              signatoryTitle: nextTitle,
              createdAt: Number(active.created_at),
              uploadedBy: active.uploaded_by,
              active: true,
              imageUrl,
              previewDataUrl: previewDataUrl || imageUrl,
            },
          });
        }

        // POST /api/admin/signatures/:version/restore — Restore a previous signature version
        const sigRestoreMatch = path.match(/^\/api\/admin\/signatures\/([^/]+)\/restore$/);
        if (sigRestoreMatch && method === 'POST') {
          const targetParam = decodeURIComponent(sigRestoreMatch[1]).trim();
          const targetRow = await db
            .prepare('SELECT * FROM certificate_signatures WHERE version = ?1 OR id = ?2')
            .bind(Number(targetParam), targetParam)
            .first();
          if (!targetRow) {
            return errorResponse(request, env, 'Signature version not found.', 'NOT_FOUND', 404);
          }

          await db.batch([
            db.prepare('UPDATE certificate_signatures SET active = 0 WHERE active = 1'),
            db.prepare('UPDATE certificate_signatures SET active = 1 WHERE id = ?1').bind(targetRow.id),
          ]);

          const previewDataUrl = await loadSignatureDataUrlFromR2(env.R2_BUCKET, targetRow.r2_key);
          const imageUrl = `/api/admin/signatures/${encodeURIComponent(targetRow.id)}/image`;
          return jsonResponse(request, env, {
            ok: true,
            activeSignature: {
              id: targetRow.id,
              version: Number(targetRow.version),
              signatory_name: targetRow.signatory_name,
              signatory_title: targetRow.signatory_title,
              created_at: Number(targetRow.created_at),
              signatoryName: targetRow.signatory_name,
              signatoryTitle: targetRow.signatory_title,
              createdAt: Number(targetRow.created_at),
              uploadedBy: targetRow.uploaded_by,
              active: true,
              imageUrl,
              previewDataUrl: previewDataUrl || imageUrl,
            },
          });
        }

        // 4. DELETE /api/admin/signatures/:id (super admin / admin only)
        const sigDeleteMatch = path.match(/^\/api\/admin\/signatures\/([^/]+)$/);
        if (sigDeleteMatch && method === 'DELETE') {
          const targetId = decodeURIComponent(sigDeleteMatch[1]).trim();
          if (targetId === 'active') {
            await db.prepare('UPDATE certificate_signatures SET active = 0 WHERE active = 1').run();
            return jsonResponse(request, env, { ok: true, hasActiveSignature: false });
          }

          const sigRow = await db
            .prepare('SELECT * FROM certificate_signatures WHERE id = ?1 OR CAST(version AS TEXT) = ?1')
            .bind(targetId)
            .first();
          if (!sigRow) {
            return errorResponse(request, env, 'Signature not found.', 'NOT_FOUND', 404);
          }

          const usedCheck = await db
            .prepare('SELECT COUNT(*) AS cnt FROM certificates WHERE signature_version = ?1')
            .bind(Number(sigRow.version))
            .first();
          const usedCount = Number(usedCheck?.cnt || 0);
          if (usedCount > 0) {
            return errorResponse(
              request,
              env,
              `Cannot delete signature v${sigRow.version} because it is already used by ${usedCount} issued certificate(s).`,
              'SIGNATURE_IN_USE',
              409
            );
          }

          const wasActive = Boolean(sigRow.active);
          await db
            .prepare('UPDATE certificate_signatures SET active = 0 WHERE id = ?1')
            .bind(sigRow.id)
            .run();

          let reactivatedSignature = null;
          if (wasActive) {
            const prevRow = await db
              .prepare(
                'SELECT * FROM certificate_signatures WHERE id != ?1 ORDER BY version DESC LIMIT 1'
              )
              .bind(sigRow.id)
              .first();
            if (prevRow) {
              await db
                .prepare('UPDATE certificate_signatures SET active = 1 WHERE id = ?1')
                .bind(prevRow.id)
                .run();
              reactivatedSignature = {
                id: prevRow.id,
                version: Number(prevRow.version),
                signatory_name: prevRow.signatory_name,
                signatory_title: prevRow.signatory_title,
                created_at: Number(prevRow.created_at),
                signatoryName: prevRow.signatory_name,
                signatoryTitle: prevRow.signatory_title,
                createdAt: Number(prevRow.created_at),
                active: true,
              };
            }
          }

          return jsonResponse(request, env, {
            ok: true,
            deactivatedId: sigRow.id,
            deactivatedVersion: Number(sigRow.version),
            activeSignature: reactivatedSignature,
            hasActiveSignature: Boolean(reactivatedSignature),
          });
        }

        if (path === '/api/admin/certificates/preview' && method === 'GET') {
          const format = String(url.searchParams.get('format') || 'json').toLowerCase();
          const requestedTheme = String(url.searchParams.get('themeId') || 'default').trim() || 'default';
          const activeSig = await db
            .prepare('SELECT * FROM certificate_signatures WHERE active = 1 ORDER BY version DESC LIMIT 1')
            .first();
          const previewDataUrl = activeSig
            ? await loadSignatureDataUrlFromR2(env.R2_BUCKET, activeSig.r2_key)
            : null;

          const sampleRow = {
            id: 'preview',
            serial: 'BRD-PREVIEW',
            student_uid: user.uid,
            student_name: String(url.searchParams.get('studentName') || 'Sample Student'),
            grand_line_id: 'default',
            grand_line_title: String(url.searchParams.get('grandLineTitle') || 'Grand Line Mock 1'),
            edition_label: 'EDITION #01 · GRAND LINE',
            rank: 1,
            score: 192,
            total_questions: 200,
            percentage: 96,
            participants_count: 512,
            theme_id: requestedTheme,
            signature_version: Number(activeSig?.version || 1),
            issued_at: Number(activeSig?.created_at || Date.now()),
          };

          if (format === 'png') {
            const pngBytes = buildWorkerCertificatePngBytes(sampleRow, activeSig);
            return new Response(pngBytes, {
              status: 200,
              headers: {
                ...getCorsHeaders(request, env),
                'Content-Type': 'image/png',
                'Cache-Control': 'private, no-store',
              },
            });
          }

          if (format === 'pdf') {
            const pdfBytes = buildWorkerCertificatePdfBytes(sampleRow, activeSig);
            return new Response(pdfBytes, {
              status: 200,
              headers: {
                ...getCorsHeaders(request, env),
                'Content-Type': 'application/pdf',
                'Cache-Control': 'private, no-store',
              },
            });
          }

          return jsonResponse(request, env, {
            ok: true,
            preview: {
              serial: sampleRow.serial,
              studentName: sampleRow.student_name,
              grandLineId: sampleRow.grand_line_id,
              grandLineTitle: sampleRow.grand_line_title,
              editionLabel: sampleRow.edition_label,
              rank: sampleRow.rank,
              score: sampleRow.score,
              totalQuestions: sampleRow.total_questions,
              percentage: sampleRow.percentage,
              participantsCount: sampleRow.participants_count,
              themeId: sampleRow.theme_id,
              signatoryName: activeSig?.signatory_name || 'Boardly Examination Council',
              signatoryTitle: activeSig?.signatory_title || 'Founder, Boardly',
              signatureVersion: sampleRow.signature_version,
              signatureDataUrl: previewDataUrl,
            },
          });
        }

        if (path === '/api/admin/certificates' && method === 'GET') {
          const { results } = await db
            .prepare('SELECT * FROM certificates ORDER BY issued_at DESC LIMIT 250')
            .all();
          const activeSig = await db
            .prepare('SELECT * FROM certificate_signatures WHERE active = 1 ORDER BY version DESC LIMIT 1')
            .first();
          let formattedActiveSig = null;
          if (activeSig) {
            const previewDataUrl = await loadSignatureDataUrlFromR2(env.R2_BUCKET, activeSig.r2_key);
            const imageUrl = `/api/admin/signatures/${encodeURIComponent(activeSig.id)}/image`;
            formattedActiveSig = {
              id: activeSig.id,
              version: Number(activeSig.version),
              signatory_name: activeSig.signatory_name,
              signatory_title: activeSig.signatory_title,
              created_at: Number(activeSig.created_at),
              signatoryName: activeSig.signatory_name,
              signatoryTitle: activeSig.signatory_title,
              createdAt: Number(activeSig.created_at),
              active: true,
              imageUrl,
              previewDataUrl: previewDataUrl || imageUrl,
            };
          }
          const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
          const mappedCerts = [];
          for (const c of results || []) {
            const pngToken = await signWorkerCertToken(c.id, 'png', exp);
            const pdfToken = await signWorkerCertToken(c.id, 'pdf', exp);
            mappedCerts.push({
              id: c.id,
              serial: c.serial,
              studentUid: c.student_uid,
              studentName: c.student_name,
              studentEmail: c.student_email,
              grandLineId: c.grand_line_id,
              grandLineTitle: c.grand_line_title,
              editionLabel: c.edition_label,
              rank: Number(c.rank || 1),
              score: Number(c.score || 0),
              totalQuestions: Number(c.total_questions || 0),
              percentage: Number(c.percentage || 0),
              participantsCount: Number(c.participants_count || 1),
              themeId: c.theme_id,
              signatureVersion: Number(c.signature_version || 0),
              issuedAt: Number(c.issued_at),
              status: c.status,
              verifyUrl: `/verify/${encodeURIComponent(c.serial)}`,
              previewPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&inline=1&token=${pngToken}&exp=${exp}`,
              downloadPngUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=png&token=${pngToken}&exp=${exp}`,
              downloadPdfUrl: `/api/certificates/${encodeURIComponent(c.id)}/download?format=pdf&token=${pdfToken}&exp=${exp}`,
            });
          }
          const { results: rawMocks } = await db
            .prepare(
              `SELECT id, title, subject, status, visibility, question_count, attempts_count,
                      certificate_theme_id, results_finalised, finalised_at, created_at
               FROM captain_tests
               ORDER BY created_at ASC`
            )
            .all()
            .catch(() => ({ results: [] }));

          const mocks = (rawMocks || []).map((m, idx) => ({
            id: m.id,
            title: m.title || `Grand Line Mock #${idx + 1}`,
            subject: m.subject || 'General',
            status: m.status || 'published',
            visibility: m.visibility || 'public',
            questionCount: Number(m.question_count || 0),
            attemptsCount: Number(m.attempts_count || 0),
            certificateThemeId: m.certificate_theme_id || null,
            resultsFinalised: Boolean(m.results_finalised),
            finalisedAt: m.finalised_at ? Number(m.finalised_at) : null,
            mockNumber: idx + 1,
          }));

          return jsonResponse(request, env, {
            ok: true,
            hasActiveSignature: Boolean(formattedActiveSig),
            activeSignature: formattedActiveSig,
            certificates: mappedCerts,
            mocks,
          });
        }

        // POST /api/admin/certificates/regenerate-all (super admin / admin only)
        if (path === '/api/admin/certificates/regenerate-all' && method === 'POST') {
          const activeSig = await db
            .prepare('SELECT * FROM certificate_signatures WHERE active = 1 ORDER BY version DESC LIMIT 1')
            .first();
          if (!activeSig) {
            return errorResponse(
              request,
              env,
              'No active certificate signature found. Please upload or activate a signature first.',
              'NO_ACTIVE_SIGNATURE',
              400
            );
          }

          const activeVersion = Number(activeSig.version);
          const body = await request.json().catch(() => ({}));
          const grandLineId = String(body?.grandLineId || url.searchParams.get('grandLineId') || '').trim();
          const cursor = String(body?.cursor || url.searchParams.get('cursor') || '').trim();
          const batchSize = Math.min(
            25,
            Math.max(1, Number(body?.limit || url.searchParams.get('limit') || 10))
          );

          // Count total active certificates needing regeneration (status = 'active' AND signature_version != activeVersion)
          const countRow = grandLineId
            ? await db
                .prepare(
                  `SELECT COUNT(*) AS cnt FROM certificates
                   WHERE status = 'active' AND signature_version != ?1 AND grand_line_id = ?2`
                )
                .bind(activeVersion, grandLineId)
                .first()
            : await db
                .prepare(
                  `SELECT COUNT(*) AS cnt FROM certificates
                   WHERE status = 'active' AND signature_version != ?1`
                )
                .bind(activeVersion)
                .first();

          const totalPending = Number(countRow?.cnt || 0);
          if (totalPending === 0) {
            return jsonResponse(request, env, {
              ok: true,
              total: 0,
              regenerated: 0,
              regeneratedCount: 0,
              failed: 0,
              errors: [],
              signatureVersion: activeVersion,
              hasMore: false,
              nextCursor: null,
            });
          }

          let batchQuery;
          if (grandLineId && cursor) {
            batchQuery = db
              .prepare(
                `SELECT * FROM certificates
                 WHERE status = 'active' AND signature_version != ?1 AND grand_line_id = ?2 AND id > ?3
                 ORDER BY id ASC LIMIT ?4`
              )
              .bind(activeVersion, grandLineId, cursor, batchSize);
          } else if (grandLineId) {
            batchQuery = db
              .prepare(
                `SELECT * FROM certificates
                 WHERE status = 'active' AND signature_version != ?1 AND grand_line_id = ?2
                 ORDER BY id ASC LIMIT ?3`
              )
              .bind(activeVersion, grandLineId, batchSize);
          } else if (cursor) {
            batchQuery = db
              .prepare(
                `SELECT * FROM certificates
                 WHERE status = 'active' AND signature_version != ?1 AND id > ?2
                 ORDER BY id ASC LIMIT ?3`
              )
              .bind(activeVersion, cursor, batchSize);
          } else {
            batchQuery = db
              .prepare(
                `SELECT * FROM certificates
                 WHERE status = 'active' AND signature_version != ?1
                 ORDER BY id ASC LIMIT ?2`
              )
              .bind(activeVersion, batchSize);
          }

          const { results: batchCerts } = await batchQuery.all();
          const rows = batchCerts || [];

          let regenerated = 0;
          let failed = 0;
          const errors = [];
          let lastId = null;

          for (const cert of rows) {
            lastId = cert.id;
            if (cert.status !== 'active') continue;
            try {
              await renderAndStoreWorkerCertificate(env, cert, activeSig);
              await db
                .prepare(
                  `UPDATE certificates
                   SET signature_version = ?1
                   WHERE id = ?2 AND status = 'active'`
                )
                .bind(activeVersion, cert.id)
                .run();
              regenerated += 1;
            } catch (err) {
              failed += 1;
              errors.push({
                id: cert.id,
                serial: cert.serial,
                error: err?.message || 'Failed to regenerate certificate',
              });
            }
          }

          const remainingAfter = Math.max(0, totalPending - regenerated - failed);
          const hasMore = remainingAfter > 0 && rows.length === batchSize;

          return jsonResponse(request, env, {
            ok: true,
            total: totalPending,
            regenerated,
            regeneratedCount: regenerated,
            failed,
            errors,
            signatureVersion: activeVersion,
            hasMore,
            nextCursor: hasMore ? lastId : null,
            remaining: remainingAfter,
          });
        }

        // POST /api/admin/certificates/:id/regenerate — Regenerate single active certificate with current signature
        const regenOneMatch = path.match(/^\/api\/admin\/certificates\/([^/]+)\/regenerate$/);
        if (regenOneMatch && method === 'POST') {
          const certId = decodeURIComponent(regenOneMatch[1]).trim();
          const activeSig = await db
            .prepare('SELECT * FROM certificate_signatures WHERE active = 1 ORDER BY version DESC LIMIT 1')
            .first();
          if (!activeSig) {
            return errorResponse(
              request,
              env,
              'No active certificate signature found. Please upload or activate a signature first.',
              'NO_ACTIVE_SIGNATURE',
              400
            );
          }

          const cert = await db
            .prepare('SELECT * FROM certificates WHERE id = ?1 OR serial = ?1')
            .bind(certId)
            .first();
          if (!cert) {
            return errorResponse(request, env, 'Certificate not found.', 'NOT_FOUND', 404);
          }
          if (cert.status === 'revoked') {
            return errorResponse(
              request,
              env,
              'Cannot regenerate a revoked certificate.',
              'CERTIFICATE_REVOKED',
              400
            );
          }

          const body = await request.json().catch(() => ({}));
          const nextThemeId =
            typeof body?.themeId === 'string' && body.themeId.trim() && body.themeId.trim() !== 'auto'
              ? body.themeId.trim()
              : cert.theme_id;
          const activeVersion = Number(activeSig.version);

          const updatedCertRow = {
            ...cert,
            theme_id: nextThemeId,
            signature_version: activeVersion,
          };

          await renderAndStoreWorkerCertificate(env, updatedCertRow, activeSig);
          await db
            .prepare(
              `UPDATE certificates
               SET signature_version = ?1, theme_id = ?2
               WHERE id = ?3 AND status = 'active'`
            )
            .bind(activeVersion, nextThemeId, cert.id)
            .run();

          return jsonResponse(request, env, {
            ok: true,
            certificate: {
              id: cert.id,
              serial: cert.serial,
              signatureVersion: activeVersion,
              themeId: nextThemeId,
            },
          });
        }

        const revokeMatch = path.match(/^\/api\/admin\/certificates\/([^/]+)\/(?:revoke|status)$/);
        if (revokeMatch && method === 'POST') {
          const certId = decodeURIComponent(revokeMatch[1]);
          const body = await request.json().catch(() => ({}));
          const cert = await db
            .prepare('SELECT id, serial, status FROM certificates WHERE id = ?1 OR serial = ?1')
            .bind(certId)
            .first();
          if (!cert) return errorResponse(request, env, 'Certificate not found.', 'NOT_FOUND', 404);
          const nextStatus =
            body.status === 'active' || body.status === 'revoked'
              ? body.status
              : cert.status === 'revoked'
              ? 'active'
              : 'revoked';
          await db
            .prepare('UPDATE certificates SET status = ?1 WHERE id = ?2')
            .bind(nextStatus, cert.id)
            .run();
          return jsonResponse(request, env, { ok: true, id: cert.id, serial: cert.serial, status: nextStatus });
        }
      }

      // =======================================================================
      // DAILY STARTER LIMIT SERVER-SIDE ENGINE (PKT Asia/Karachi UTC+5)
      // =======================================================================
      if (path.startsWith('/api/usage/daily')) {
        const FREE_DAILY_STARTER_LIMIT = 10;
        const computeWorkerPKTDateKey = (nowMs = Date.now()) => {
          const pktMs = Number(nowMs) + 5 * 3600 * 1000;
          const d = new Date(pktMs);
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          const day = String(d.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        await db
          .prepare(
            `CREATE TABLE IF NOT EXISTS daily_starter_usage (
              uid TEXT NOT NULL,
              pkt_date TEXT NOT NULL,
              tests_started INTEGER NOT NULL DEFAULT 0,
              practice_attempts INTEGER NOT NULL DEFAULT 0,
              questions_solved INTEGER NOT NULL DEFAULT 0,
              ai_tutor_tokens INTEGER NOT NULL DEFAULT 0,
              updated_at INTEGER NOT NULL,
              PRIMARY KEY (uid, pkt_date)
            )`
          )
          .run();

        if (path === '/api/usage/daily' && method === 'GET') {
          const user = await authenticateRequest(request, env, false);
          const requestedUid = String(url.searchParams.get('uid') || '').trim();
          const uid = user?.uid || requestedUid;
          if (!uid) {
            return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);
          }
          if (user && requestedUid && requestedUid !== user.uid && !user.isAdminOrAbove) {
            return errorResponse(request, env, 'Forbidden: Cannot read another user usage.', 'FORBIDDEN', 403);
          }

          const dateKey = computeWorkerPKTDateKey();
          const row = await db
            .prepare('SELECT * FROM daily_starter_usage WHERE uid = ?1 AND pkt_date = ?2')
            .bind(uid, dateKey)
            .first();

          const testsStarted = Number(row?.tests_started ?? 0);
          const practiceAttempts = Number(row?.practice_attempts ?? testsStarted);
          const questionsSolved = Number(row?.questions_solved ?? 0);
          const aiTutorTokens = Number(row?.ai_tutor_tokens ?? 0);

          return jsonResponse(request, env, {
            ok: true,
            uid,
            dateKey,
            timezone: 'Asia/Karachi',
            testsStarted,
            practiceAttempts,
            questionsUsed: testsStarted,
            questionsSolved,
            aiTutorTokens,
            limit: FREE_DAILY_STARTER_LIMIT,
          });
        }

        if (path === '/api/usage/daily/start-test' && method === 'POST') {
          const user = await authenticateRequest(request, env, false);
          const body = await request.json().catch(() => ({}));
          const isHealthcheck = Boolean(body.healthcheck);
          const requestedUid = String(body.uid || '').trim();

          let effectiveUid = user?.uid || '';
          if (isHealthcheck && requestedUid.startsWith('hc_dummy_')) {
            effectiveUid = requestedUid;
          } else if (!effectiveUid && requestedUid) {
            effectiveUid = requestedUid;
          }

          if (!effectiveUid) {
            return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);
          }
          if (!isHealthcheck && user && requestedUid && requestedUid !== user.uid) {
            return errorResponse(request, env, 'UID mismatch.', 'FORBIDDEN', 403);
          }

          const dateKey = computeWorkerPKTDateKey();
          const isSuper = Boolean(!isHealthcheck && user && user.isAdminOrAbove);
          const isUnlimited = Boolean(body.isUnlimited) || isSuper;
          const attemptId =
            typeof body.customAttemptId === 'string' && body.customAttemptId.trim()
              ? body.customAttemptId.trim()
              : `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

          const existingRow = await db
            .prepare('SELECT * FROM daily_starter_usage WHERE uid = ?1 AND pkt_date = ?2')
            .bind(effectiveUid, dateKey)
            .first();
          const currentTestsStarted = Number(existingRow?.tests_started || 0);

          if (isUnlimited) {
            return jsonResponse(request, env, {
              ok: true,
              blocked: false,
              attemptId,
              uid: effectiveUid,
              dateKey,
              timezone: 'Asia/Karachi',
              testsStarted: currentTestsStarted,
              limit: FREE_DAILY_STARTER_LIMIT,
            });
          }

          if (currentTestsStarted >= FREE_DAILY_STARTER_LIMIT) {
            return jsonResponse(
              request,
              env,
              {
                ok: false,
                blocked: true,
                code: 'DAILY_TESTS_LIMIT_EXCEEDED',
                error: `Daily test limit reached (${currentTestsStarted}/${FREE_DAILY_STARTER_LIMIT} tests). Upgrade or join a Study Crew to practice unlimited.`,
                uid: effectiveUid,
                dateKey,
                timezone: 'Asia/Karachi',
                testsStarted: currentTestsStarted,
                limit: FREE_DAILY_STARTER_LIMIT,
              },
              429
            );
          }

          const now = Date.now();
          const nextTestsStarted = currentTestsStarted + 1;
          await db
            .prepare(
              `INSERT INTO daily_starter_usage (uid, pkt_date, tests_started, practice_attempts, questions_solved, ai_tutor_tokens, updated_at)
               VALUES (?1, ?2, 1, 1, 0, 0, ?3)
               ON CONFLICT(uid, pkt_date) DO UPDATE SET
                 tests_started = daily_starter_usage.tests_started + 1,
                 practice_attempts = MAX(daily_starter_usage.practice_attempts + 1, daily_starter_usage.tests_started + 1),
                 updated_at = excluded.updated_at`
            )
            .bind(effectiveUid, dateKey, now)
            .run();

          return jsonResponse(request, env, {
            ok: true,
            blocked: false,
            attemptId,
            uid: effectiveUid,
            dateKey,
            timezone: 'Asia/Karachi',
            testsStarted: nextTestsStarted,
            limit: FREE_DAILY_STARTER_LIMIT,
          });
        }

        if (path === '/api/usage/daily/record' && method === 'POST') {
          const user = await authenticateRequest(request, env, false);
          const body = await request.json().catch(() => ({}));
          const effectiveUid = user?.uid || String(body.uid || '').trim();
          if (!effectiveUid) {
            return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);
          }
          if (user && body.uid && String(body.uid).trim() !== user.uid) {
            return errorResponse(request, env, 'UID mismatch.', 'FORBIDDEN', 403);
          }

          const dateKey = computeWorkerPKTDateKey();
          const practiceDelta = Math.max(0, Math.floor(Number(body.practiceAttemptsDelta || 0)));
          const solvedDelta = Math.max(0, Math.floor(Number(body.questionsSolvedDelta || 0)));
          const aiDelta = Math.max(0, Math.floor(Number(body.aiTutorTokensDelta || 0)));
          const now = Date.now();

          await db
            .prepare(
              `INSERT INTO daily_starter_usage (uid, pkt_date, tests_started, practice_attempts, questions_solved, ai_tutor_tokens, updated_at)
               VALUES (?1, ?2, 0, ?3, ?4, ?5, ?6)
               ON CONFLICT(uid, pkt_date) DO UPDATE SET
                 practice_attempts = daily_starter_usage.practice_attempts + ?3,
                 questions_solved = daily_starter_usage.questions_solved + ?4,
                 ai_tutor_tokens = daily_starter_usage.ai_tutor_tokens + ?5,
                 updated_at = ?6`
            )
            .bind(effectiveUid, dateKey, practiceDelta, solvedDelta, aiDelta, now)
            .run();

          const updatedRow = await db
            .prepare('SELECT * FROM daily_starter_usage WHERE uid = ?1 AND pkt_date = ?2')
            .bind(effectiveUid, dateKey)
            .first();

          return jsonResponse(request, env, {
            ok: true,
            uid: effectiveUid,
            dateKey,
            timezone: 'Asia/Karachi',
            testsStarted: Number(updatedRow?.tests_started || 0),
            practiceAttempts: Number(updatedRow?.practice_attempts || 0),
            questionsSolved: Number(updatedRow?.questions_solved || 0),
            aiTutorTokens: Number(updatedRow?.ai_tutor_tokens || 0),
          });
        }

        if (path === '/api/usage/daily/cleanup-healthcheck' && method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const targetUid = String(body.uid || '').trim();
          if (!targetUid || !targetUid.startsWith('hc_dummy_')) {
            return errorResponse(request, env, 'Only hc_dummy_* test UIDs can be cleaned up.', 'INVALID_UID', 400);
          }
          await db
            .prepare('DELETE FROM daily_starter_usage WHERE uid = ?1')
            .bind(targetUid)
            .run();
          return jsonResponse(request, env, {
            ok: true,
            uid: targetUid,
            dateKey: computeWorkerPKTDateKey(),
          });
        }
      }

      return errorResponse(request, env, `Route not found: ${method} ${path}`, 'NOT_FOUND', 404);
    } catch (err) {
      const status = err.status || 500;
      const code = err.code || (status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR');
      return errorResponse(request, env, err.message || 'Internal server error', code, status);
    }
  },
};

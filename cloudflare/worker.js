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

  return {
    uid,
    email: emailStr,
    name: tokenName || emailPrefix || 'Student',
    tokenName,
    picture: payload.picture || null,
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

async function authenticateRequest(request, env, requireAuth = true) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
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
    if (!requireAuth) return null;
    const err = new Error(e.message || 'Invalid or expired authentication token.');
    err.status = 401;
    err.code = 'INVALID_TOKEN';
    throw err;
  }

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

  let role = roleRow?.role || 'student';
  if (!roleRow) {
    const now = Date.now();
    await env.DB.prepare(
      'INSERT OR IGNORE INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at) VALUES (?1, ?2, ?3, NULL, 0, ?4, ?5)'
    )
      .bind(decoded.uid, decoded.email, 'student', now, now)
      .run()
      .catch(() =>
        env.DB.prepare(
          'INSERT OR IGNORE INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at) VALUES (?1, ?2, ?3, NULL, 0, ?4)'
        )
          .bind(decoded.uid, decoded.email, 'student', now)
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
          const body = await request.json();
          const title = cleanStr(body.title ?? testRow.title, MAX_TITLE_LEN);
          const description = cleanStr(body.description ?? testRow.description, 1000);
          const subject = cleanStr(body.subject ?? testRow.subject, 80);
          const visibility = body.visibility ? (body.visibility === 'private' ? 'private' : 'public') : testRow.visibility;
          const status = body.status && ['draft', 'published', 'unpublished'].includes(body.status) ? body.status : testRow.status;
          const durationMinutes = Math.max(1, Math.min(240, Number(body.durationMinutes ?? testRow.durationMinutes) || 20));
          const now = Date.now();

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
          return jsonResponse(request, env, { ok: true, id: testId });
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

      return errorResponse(request, env, `Route not found: ${method} ${path}`, 'NOT_FOUND', 404);
    } catch (err) {
      const status = err.status || 500;
      const code = err.code || (status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR');
      return errorResponse(request, env, err.message || 'Internal server error', code, status);
    }
  },
};

import {
  D1Env,
  HttpError,
  authenticateD1Request,
  checkRateLimitD1,
  cleanStr,
  ensureD1Migration002,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
  requireRoleD1,
} from '../_d1Core';

export async function onRequest(context: {
  request: Request;
  env: D1Env;
}): Promise<Response> {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
  }

  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);

    if (method === 'GET') {
      const user = await authenticateD1Request(request, env, true);
      requireRoleD1(user, ['admin', 'superadmin']);
      const { results } = await db
        .prepare('SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 200')
        .all();
      return jsonResponse(request, env, { ok: true, tickets: results || [] });
    }

    if (method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'anon';
      const allowed = await checkRateLimitD1(db, `support:${ip}`, 10, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded. Please wait a minute.', 'RATE_LIMITED', 429);
      }

      const caller = await authenticateD1Request(request, env, false);
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const name = cleanStr(body.name || caller?.name, 120);
      const email = cleanStr(body.email || caller?.email, 200);
      const category = cleanStr(body.category, 64, 'general');
      const subject = cleanStr(body.subject, 200, 'Support Request');
      const message = cleanStr(body.message, 4000);

      if (!email || !message) {
        return errorResponse(request, env, 'Email and message are required.', 'INVALID_INPUT', 400);
      }

      const id = `tkt_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO support_tickets (
            id, uid, name, email, category, subject, message, status, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'open', ?8)`
        )
        .bind(id, caller?.uid || body.uid || null, name, email, category, subject, message, now)
        .run();

      return jsonResponse(request, env, { ok: true, id, createdAt: now }, 201);
    }

    return errorResponse(request, env, 'Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

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
} from '../_d1Core';

function rowToNameRequest(r: Record<string, any>) {
  return {
    id: String(r.id),
    uid: String(r.uid),
    requestedName: String(r.requested_name || ''),
    currentDisplayName: r.current_display_name || undefined,
    userEmail: r.user_email || undefined,
    status: String(r.status || 'pending'),
    reviewedBy: r.reviewed_by || undefined,
    reviewedAt: r.reviewed_at ? Number(r.reviewed_at) : undefined,
    createdAt: Number(r.created_at || Date.now()),
  };
}

export async function onRequest(context: {
  request: Request;
  env: D1Env;
}): Promise<Response> {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);
    const user = await authenticateD1Request(request, env, true);
    if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

    if (method === 'GET') {
      const status = cleanStr(url.searchParams.get('status'), 32);
      const allFlag = url.searchParams.get('all') === '1' && user.isAdminOrAbove;

      let stmt;
      if (allFlag) {
        if (status && status !== 'all') {
          stmt = db
            .prepare('SELECT * FROM name_requests WHERE status = ?1 ORDER BY created_at DESC LIMIT 200')
            .bind(status);
        } else {
          stmt = db.prepare('SELECT * FROM name_requests ORDER BY created_at DESC LIMIT 200');
        }
      } else {
        stmt = db
          .prepare('SELECT * FROM name_requests WHERE uid = ?1 ORDER BY created_at DESC LIMIT 20')
          .bind(user.uid);
      }

      const { results } = await stmt.all();
      const requests = (results || []).map(rowToNameRequest);
      return jsonResponse(request, env, {
        ok: true,
        requests,
        latestRequest: requests[0] || null,
      });
    }

    if (method === 'POST') {
      const allowed = await checkRateLimitD1(db, `name_req:${user.uid}`, 5, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as {
        requestedName?: string;
        currentDisplayName?: string;
      };
      const requestedName = cleanStr(body.requestedName, 60);
      if (!requestedName || requestedName.length < 2) {
        return errorResponse(request, env, 'Requested name must be at least 2 characters.', 'INVALID_NAME', 400);
      }

      const existingPending = await db
        .prepare("SELECT id FROM name_requests WHERE uid = ?1 AND status = 'pending' LIMIT 1")
        .bind(user.uid)
        .first();
      if (existingPending) {
        return errorResponse(
          request,
          env,
          'You already have a pending name change request.',
          'REQUEST_ALREADY_PENDING',
          409
        );
      }

      const id = `nreq_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();
      const currentDisplayName = cleanStr(body.currentDisplayName || user.name, 120);

      await db
        .prepare(
          `INSERT INTO name_requests (
            id, uid, requested_name, current_display_name, user_email, status, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6)`
        )
        .bind(id, user.uid, requestedName, currentDisplayName, user.email, now)
        .run();

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          id,
          request: {
            id,
            uid: user.uid,
            requestedName,
            currentDisplayName,
            userEmail: user.email,
            status: 'pending',
            createdAt: now,
          },
        },
        201
      );
    }

    return errorResponse(request, env, 'Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

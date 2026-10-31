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

function rowToQuestionReport(r: Record<string, any>) {
  return {
    id: String(r.id),
    questionId: String(r.question_id),
    reason: String(r.reason || 'other'),
    comment: String(r.comment || ''),
    userId: String(r.user_id),
    userEmail: r.user_email || undefined,
    status: String(r.status || 'open'),
    resolvedBy: r.resolved_by || undefined,
    resolvedAt: r.resolved_at ? Number(r.resolved_at) : undefined,
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
      let stmt;
      if (user.isAdminOrAbove) {
        if (status && status !== 'all') {
          stmt = db
            .prepare('SELECT * FROM question_reports WHERE status = ?1 ORDER BY created_at DESC LIMIT 200')
            .bind(status);
        } else {
          stmt = db.prepare('SELECT * FROM question_reports ORDER BY created_at DESC LIMIT 200');
        }
      } else {
        stmt = db
          .prepare('SELECT * FROM question_reports WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 50')
          .bind(user.uid);
      }

      const { results } = await stmt.all();
      return jsonResponse(request, env, {
        ok: true,
        reports: (results || []).map(rowToQuestionReport),
      });
    }

    if (method === 'POST') {
      const allowed = await checkRateLimitD1(db, `qrep:${user.uid}`, 15, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const questionId = cleanStr(body.questionId, 128);
      const reason = cleanStr(body.reason, 80, 'other');
      const comment = cleanStr(body.comment || body.details, 1000, '');

      if (!questionId) {
        return errorResponse(request, env, 'Question ID is required.', 'INVALID_QUESTION_ID', 400);
      }

      const id = `qrep_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO question_reports (
            id, question_id, reason, comment, user_id, user_email, status, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'open', ?7)`
        )
        .bind(id, questionId, reason, comment, user.uid, user.email, now)
        .run();

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          id,
          report: {
            id,
            questionId,
            reason,
            comment,
            userId: user.uid,
            userEmail: user.email,
            status: 'open',
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

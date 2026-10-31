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

function rowToReview(r: Record<string, any>) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    userName: String(r.user_name || 'Student'),
    userEmail: r.user_email || undefined,
    university: r.university || undefined,
    rating: Number(r.rating || 5),
    comment: String(r.comment || ''),
    status: String(r.status || 'pending'),
    approvedBy: r.approved_by || undefined,
    approvedAt: r.approved_at ? Number(r.approved_at) : undefined,
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

    if (method === 'GET') {
      const caller = await authenticateD1Request(request, env, false);
      const allFlag = url.searchParams.get('all') === '1' && Boolean(caller?.isAdminOrAbove);

      const stmt = allFlag
        ? db.prepare('SELECT * FROM student_reviews ORDER BY created_at DESC LIMIT 200')
        : db.prepare("SELECT * FROM student_reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100");

      const { results } = await stmt.all();
      return jsonResponse(request, env, {
        ok: true,
        reviews: (results || []).map(rowToReview),
      });
    }

    if (method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const allowed = await checkRateLimitD1(db, `review:${user.uid}`, 5, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const rating = Math.max(1, Math.min(5, Math.floor(Number(body.rating || 5))));
      const comment = cleanStr(body.comment, 1500);
      const university = cleanStr(body.university, 120) || null;
      const userName = cleanStr(body.userName || user.name, 120, 'Student');

      if (!comment) {
        return errorResponse(request, env, 'Review comment is required.', 'INVALID_COMMENT', 400);
      }

      const id = `rev_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO student_reviews (
            id, user_id, user_name, user_email, university, rating, comment, status, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', ?8)`
        )
        .bind(id, user.uid, userName, user.email, university, rating, comment, now)
        .run();

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          id,
          review: {
            id,
            userId: user.uid,
            userName,
            userEmail: user.email,
            university,
            rating,
            comment,
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

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

function rowToPaymentRequest(r: Record<string, any>) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    userEmail: String(r.user_email || ''),
    userName: String(r.user_name || ''),
    plan: String(r.plan || 'pro'),
    crewId: r.crew_id || undefined,
    amount: Number(r.amount || 0),
    durationMonths: Number(r.duration_months || 1),
    method: String(r.method || ''),
    transactionId: String(r.transaction_id || ''),
    status: String(r.status || 'pending'),
    rejectionReason: r.rejection_reason || undefined,
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
    const user = await authenticateD1Request(request, env, true);
    if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

    if (method === 'GET') {
      const allFlag = url.searchParams.get('all') === '1' && user.isAdminOrAbove;
      const stmt = allFlag
        ? db.prepare('SELECT * FROM payment_requests ORDER BY created_at DESC LIMIT 200')
        : db
            .prepare('SELECT * FROM payment_requests WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 50')
            .bind(user.uid);

      const { results } = await stmt.all();
      return jsonResponse(request, env, {
        ok: true,
        requests: (results || []).map(rowToPaymentRequest),
      });
    }

    if (method === 'POST') {
      const allowed = await checkRateLimitD1(db, `pay_req:${user.uid}`, 10, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Too many payment requests. Please wait a minute.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const plan = cleanStr(body.plan, 64, 'pro');
      const crewId = body.crewId ? cleanStr(body.crewId, 128) : null;
      const amount = Math.max(0, Math.floor(Number(body.amount || 0)));
      const durationMonths = Math.max(1, Math.min(24, Math.floor(Number(body.durationMonths || 1))));
      const methodStr = cleanStr(body.method || body.paymentMethod, 64, 'JazzCash');
      const transactionId = cleanStr(body.transactionId, 120);
      const userName = cleanStr(body.userName || user.name, 120, 'Student');

      if (!transactionId) {
        return errorResponse(request, env, 'Transaction ID is required.', 'INVALID_TRANSACTION_ID', 400);
      }

      const dup = await db
        .prepare("SELECT id FROM payment_requests WHERE transaction_id = ?1 AND status != 'rejected' LIMIT 1")
        .bind(transactionId)
        .first();
      if (dup) {
        return errorResponse(
          request,
          env,
          'This Transaction ID has already been submitted.',
          'DUPLICATE_TRANSACTION_ID',
          409
        );
      }

      const id = `pay_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO payment_requests (
            id, user_id, user_email, user_name, plan, crew_id,
            amount, duration_months, method, transaction_id, status, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'pending', ?11)`
        )
        .bind(
          id,
          user.uid,
          user.email,
          userName,
          plan,
          crewId,
          amount,
          durationMonths,
          methodStr,
          transactionId,
          now
        )
        .run();

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          id,
          request: {
            id,
            userId: user.uid,
            userEmail: user.email,
            userName,
            plan,
            crewId,
            amount,
            durationMonths,
            method: methodStr,
            transactionId,
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

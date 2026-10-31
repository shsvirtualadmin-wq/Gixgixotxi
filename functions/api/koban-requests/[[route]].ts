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

function rowToKobanRequest(r: Record<string, any>) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    userEmail: String(r.user_email || ''),
    userName: String(r.user_name || ''),
    amount: Number(r.amount || 0),
    pkrAmount: Number(r.pkr_amount || 0),
    grantedAmount: r.granted_amount !== null && r.granted_amount !== undefined ? Number(r.granted_amount) : undefined,
    transactionId: String(r.transaction_id || ''),
    paymentMethod: String(r.payment_method || ''),
    note: String(r.note || ''),
    status: String(r.status || 'pending'),
    rejectionReason: r.rejection_reason || undefined,
    approvedBy: r.approved_by || undefined,
    approvedAt: r.approved_at ? Number(r.approved_at) : undefined,
    rejectedBy: r.rejected_by || undefined,
    rejectedAt: r.rejected_at ? Number(r.rejected_at) : undefined,
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
      const statusFilter = cleanStr(url.searchParams.get('status'), 32);
      const allFlag = url.searchParams.get('all') === '1' && user.isAdminOrAbove;

      let stmt;
      if (allFlag) {
        if (statusFilter && statusFilter !== 'all') {
          stmt = db
            .prepare('SELECT * FROM koban_requests WHERE status = ?1 ORDER BY created_at DESC LIMIT 200')
            .bind(statusFilter);
        } else {
          stmt = db.prepare('SELECT * FROM koban_requests ORDER BY created_at DESC LIMIT 200');
        }
      } else {
        stmt = db
          .prepare('SELECT * FROM koban_requests WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 50')
          .bind(user.uid);
      }

      const { results } = await stmt.all();
      return jsonResponse(request, env, {
        ok: true,
        requests: (results || []).map(rowToKobanRequest),
      });
    }

    if (method === 'POST') {
      const allowed = await checkRateLimitD1(db, `koban_req:${user.uid}`, 10, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Too many requests. Please wait a minute.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const amount = Math.max(1, Math.min(100000, Math.floor(Number(body.amount || 0))));
      const pkrAmount = Math.max(0, Math.floor(Number(body.pkrAmount || 0)));
      const transactionId = cleanStr(body.transactionId, 120);
      const paymentMethod = cleanStr(body.paymentMethod, 64, 'EasyPaisa');
      const note = cleanStr(body.note, 500, '');
      const userName = cleanStr(body.userName || user.name, 120, 'Student');

      if (!amount || amount <= 0) {
        return errorResponse(request, env, 'Requested Kobans amount must be greater than 0.', 'INVALID_AMOUNT', 400);
      }

      const id = `kreq_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO koban_requests (
            id, user_id, user_email, user_name, amount, pkr_amount,
            transaction_id, payment_method, note, status, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'pending', ?10)`
        )
        .bind(
          id,
          user.uid,
          user.email,
          userName,
          amount,
          pkrAmount,
          transactionId,
          paymentMethod,
          note,
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
            amount,
            pkrAmount,
            transactionId,
            paymentMethod,
            note,
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

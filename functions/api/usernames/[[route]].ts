import {
  D1Env,
  cleanStr,
  ensureD1Migration002,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
} from '../_d1Core';

export async function onRequest(context: {
  request: Request;
  env: D1Env;
}): Promise<Response> {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/usernames\/?/, '').replace(/\/+$/, '');
  const db = env.DB;

  try {
    await ensureD1Migration002(db);

    // GET /api/usernames/check?username=...&uid=...
    if ((subPath === 'check' || subPath === '') && request.method === 'GET') {
      const rawUsername = cleanStr(url.searchParams.get('username'), 32)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');
      const currentUid = cleanStr(url.searchParams.get('uid'), 128);

      if (!rawUsername || rawUsername.length < 3 || rawUsername.length > 20) {
        return jsonResponse(request, env, {
          ok: true,
          available: false,
          reason: 'Username must be 3–20 characters.',
        });
      }

      const row = await db
        .prepare('SELECT uid FROM usernames WHERE username = ?1 LIMIT 1')
        .bind(rawUsername)
        .first();

      const available = !row || (Boolean(currentUid) && row.uid === currentUid);
      return jsonResponse(request, env, {
        ok: true,
        username: rawUsername,
        available,
        ownerUid: row?.uid || null,
      });
    }

    return errorResponse(request, env, 'Usernames endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

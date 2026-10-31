import {
  D1Env,
  HttpError,
  authenticateD1Request,
  buildAuditLogStatement,
  cleanStr,
  ensureD1Migration002,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
  parseJsonSafe,
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

  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/config\/?/, '').replace(/\/+$/, '');
  const configKey = cleanStr(subPath || url.searchParams.get('key'), 80, 'app');
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);

    if (method === 'GET') {
      const row = await db
        .prepare('SELECT * FROM app_config WHERE config_key = ?1 LIMIT 1')
        .bind(configKey)
        .first();

      const value = row ? parseJsonSafe<Record<string, any>>(row.value_json, {}) : null;
      return jsonResponse(request, env, {
        ok: true,
        key: configKey,
        value,
        updatedBy: row?.updated_by || null,
        updatedAt: row?.updated_at ? Number(row.updated_at) : null,
      });
    }

    if (method === 'PUT' || method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      requireRoleD1(user, ['admin', 'superadmin']);

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const valuePayload = body.value !== undefined ? body.value : body;
      const now = Date.now();

      await db.batch([
        db
          .prepare(
            `INSERT INTO app_config (config_key, value_json, updated_by, updated_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(config_key) DO UPDATE SET
               value_json = excluded.value_json,
               updated_by = excluded.updated_by,
               updated_at = excluded.updated_at`
          )
          .bind(configKey, JSON.stringify(valuePayload || {}), user.email || user.uid, now),
        buildAuditLogStatement(db, user, `update_config:${configKey}`, null, null, {
          configKey,
        }),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        key: configKey,
        value: valuePayload,
        updatedAt: now,
      });
    }

    return errorResponse(request, env, 'Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

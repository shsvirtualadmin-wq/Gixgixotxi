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

export async function onRequest(context: {
  request: Request;
  env: D1Env;
}): Promise<Response> {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/study-buddy\/?/, '').replace(/\/+$/, '');
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);
    const user = await authenticateD1Request(request, env, true);
    if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

    const crewId = cleanStr(url.searchParams.get('crewId'), 128, 'global');

    // 1. GET /api/study-buddy?crewId=... (Poll presence, logs, and messages)
    if (subPath === '' && method === 'GET') {
      const cutoff = Date.now() - 2 * 3600 * 1000;
      const [presRows, logRows, msgRows] = await Promise.all([
        db
          .prepare(
            'SELECT * FROM study_buddy_presence WHERE crew_id = ?1 AND updated_at >= ?2 ORDER BY updated_at DESC LIMIT 50'
          )
          .bind(crewId, cutoff)
          .all(),
        db
          .prepare('SELECT * FROM study_buddy_logs WHERE crew_id = ?1 ORDER BY created_at DESC LIMIT 25')
          .bind(crewId)
          .all(),
        db
          .prepare('SELECT * FROM study_buddy_messages WHERE crew_id = ?1 ORDER BY created_at DESC LIMIT 40')
          .bind(crewId)
          .all(),
      ]);

      const presence = (presRows?.results || []).map((r: any) => ({
        uid: String(r.uid),
        displayName: String(r.display_name || 'Student'),
        shortId: String(r.short_id || '00000'),
        subject: String(r.subject || 'Mathematics'),
        status: String(r.status || 'studying'),
        timerMinutes: Number(r.timer_minutes || 25),
        startedAt: Number(r.started_at || Date.now()),
        updatedAt: Number(r.updated_at || Date.now()),
      }));

      const logs = (logRows?.results || []).map((r: any) => ({
        id: String(r.id),
        uid: String(r.uid),
        displayName: String(r.display_name || 'Student'),
        action: String(r.action || ''),
        subject: r.subject || undefined,
        minutes: Number(r.minutes || 0),
        createdAt: Number(r.created_at || Date.now()),
      }));

      const messages = (msgRows?.results || [])
        .map((r: any) => ({
          id: String(r.id),
          uid: String(r.uid),
          displayName: String(r.display_name || 'Student'),
          shortId: r.short_id || undefined,
          text: String(r.text || ''),
          createdAt: Number(r.created_at || Date.now()),
        }))
        .reverse();

      return jsonResponse(request, env, {
        ok: true,
        crewId,
        presence,
        logs,
        messages,
      });
    }

    // 2. POST /api/study-buddy/presence (Update or leave presence)
    if (subPath === 'presence' && (method === 'POST' || method === 'DELETE')) {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const targetCrewId = cleanStr(body.crewId || crewId, 128, 'global');
      const presenceId = `${targetCrewId}_${user.uid}`;

      if (method === 'DELETE' || body.leave === true) {
        await db.prepare('DELETE FROM study_buddy_presence WHERE id = ?1').bind(presenceId).run();
        return jsonResponse(request, env, { ok: true, left: true });
      }

      const displayName = cleanStr(body.displayName || user.name, 120, 'Student');
      const shortId = cleanStr(body.shortId, 16, '00000');
      const subject = cleanStr(body.subject, 80, 'Mathematics');
      const status = cleanStr(body.status, 32, 'studying');
      const timerMinutes = Math.max(5, Math.min(180, Number(body.timerMinutes || 25)));
      const now = Date.now();
      const startedAt = Number(body.startedAt || now);

      await db
        .prepare(
          `INSERT INTO study_buddy_presence (
            id, crew_id, uid, display_name, short_id, subject, status, timer_minutes, started_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
          ON CONFLICT(id) DO UPDATE SET
            display_name = excluded.display_name,
            subject = excluded.subject,
            status = excluded.status,
            timer_minutes = excluded.timer_minutes,
            updated_at = excluded.updated_at`
        )
        .bind(
          presenceId,
          targetCrewId,
          user.uid,
          displayName,
          shortId,
          subject,
          status,
          timerMinutes,
          startedAt,
          now
        )
        .run();

      return jsonResponse(request, env, { ok: true, updatedAt: now });
    }

    // 3. POST /api/study-buddy/logs
    if (subPath === 'logs' && method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const targetCrewId = cleanStr(body.crewId || crewId, 128, 'global');
      const displayName = cleanStr(body.displayName || user.name, 120, 'Student');
      const action = cleanStr(body.action, 200);
      const subject = cleanStr(body.subject, 80) || null;
      const minutes = Math.max(0, Number(body.minutes || 0));
      if (!action) {
        return errorResponse(request, env, 'Action is required.', 'INVALID_ACTION', 400);
      }

      const id = `sblog_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO study_buddy_logs (
            id, crew_id, uid, display_name, action, subject, minutes, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
        )
        .bind(id, targetCrewId, user.uid, displayName, action, subject, minutes, now)
        .run();

      return jsonResponse(request, env, { ok: true, id, createdAt: now }, 201);
    }

    // 4. POST /api/study-buddy/messages
    if (subPath === 'messages' && method === 'POST') {
      const allowed = await checkRateLimitD1(db, `sbmsg:${user.uid}`, 30, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const targetCrewId = cleanStr(body.crewId || crewId, 128, 'global');
      const displayName = cleanStr(body.displayName || user.name, 120, 'Student');
      const shortId = cleanStr(body.shortId, 16) || null;
      const text = cleanStr(body.text, 500);
      if (!text) {
        return errorResponse(request, env, 'Message text is required.', 'INVALID_MESSAGE', 400);
      }

      const id = `sbmsg_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO study_buddy_messages (
            id, crew_id, uid, display_name, short_id, text, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
        )
        .bind(id, targetCrewId, user.uid, displayName, shortId, text, now)
        .run();

      return jsonResponse(
        request,
        env,
        {
          ok: true,
          message: {
            id,
            uid: user.uid,
            displayName,
            shortId,
            text,
            createdAt: now,
          },
        },
        201
      );
    }

    return errorResponse(request, env, 'Study buddy endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

import {
  D1Env,
  HttpError,
  authenticateD1Request,
  cleanStr,
  ensureD1Migration002,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
  parseJsonSafe,
} from '../_d1Core';

function getPktDateKey(ms = Date.now()): string {
  const pktMs = ms + 5 * 3600 * 1000;
  return new Date(pktMs).toISOString().slice(0, 10);
}

function rowToDailyUsage(r: Record<string, any> | null, uid: string, dateKey: string) {
  return {
    id: r?.id ? String(r.id) : `${uid}_${dateKey}`,
    uid,
    dateKey: r?.date_key ? String(r.date_key) : dateKey,
    testsStarted: Number(r?.tests_started || 0),
    practiceAttempts: Number(r?.practice_attempts || 0),
    questionsSolved: Number(r?.questions_solved || 0),
    accuracy: Number(r?.accuracy || 0),
    timeSpentSeconds: Number(r?.time_spent_seconds || 0),
    aiTutorTokens: Number(r?.ai_tutor_tokens || 0),
    arenaSessions: Number(r?.arena_sessions || 0),
    subjects: parseJsonSafe<string[]>(r?.subjects_json, []),
    updatedAt: Number(r?.updated_at || Date.now()),
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

    const targetUid =
      user.isAdminOrAbove && url.searchParams.get('uid')
        ? cleanStr(url.searchParams.get('uid'), 128)
        : user.uid;

    if (method === 'GET') {
      const dateKey = cleanStr(url.searchParams.get('dateKey'), 16) || getPktDateKey();
      const historyDays = Number(url.searchParams.get('days') || 0);

      if (historyDays > 0) {
        const limit = Math.min(90, Math.max(1, historyDays));
        const { results } = await db
          .prepare('SELECT * FROM user_daily_usage WHERE uid = ?1 ORDER BY date_key DESC LIMIT ?2')
          .bind(targetUid, limit)
          .all();

        return jsonResponse(request, env, {
          ok: true,
          history: (results || []).map((r: any) => rowToDailyUsage(r, targetUid, String(r.date_key))),
        });
      }

      const row = await db
        .prepare('SELECT * FROM user_daily_usage WHERE uid = ?1 AND date_key = ?2 LIMIT 1')
        .bind(targetUid, dateKey)
        .first();

      return jsonResponse(request, env, {
        ok: true,
        usage: rowToDailyUsage(row, targetUid, dateKey),
      });
    }

    if (method === 'POST' || method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const dateKey = cleanStr(body.dateKey, 16) || getPktDateKey();
      const incTests = Math.max(0, Number(body.testsStarted || 0));
      const incPractice = Math.max(0, Number(body.practiceAttempts || 0));
      const incQuestions = Math.max(0, Number(body.questionsSolved || 0));
      const incTime = Math.max(0, Number(body.timeSpentSeconds || 0));
      const incTokens = Math.max(0, Number(body.aiTutorTokens || 0));
      const incArena = Math.max(0, Number(body.arenaSessions || 0));
      const now = Date.now();

      await db
        .prepare(
          `INSERT INTO user_daily_usage (
            id, uid, date_key, tests_started, practice_attempts, questions_solved,
            time_spent_seconds, ai_tutor_tokens, arena_sessions, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
          ON CONFLICT(uid, date_key) DO UPDATE SET
            tests_started = user_daily_usage.tests_started + ?4,
            practice_attempts = user_daily_usage.practice_attempts + ?5,
            questions_solved = user_daily_usage.questions_solved + ?6,
            time_spent_seconds = user_daily_usage.time_spent_seconds + ?7,
            ai_tutor_tokens = user_daily_usage.ai_tutor_tokens + ?8,
            arena_sessions = user_daily_usage.arena_sessions + ?9,
            updated_at = ?10`
        )
        .bind(
          `${user.uid}_${dateKey}`,
          user.uid,
          dateKey,
          incTests,
          incPractice,
          incQuestions,
          incTime,
          incTokens,
          incArena,
          now
        )
        .run();

      const updated = await db
        .prepare('SELECT * FROM user_daily_usage WHERE uid = ?1 AND date_key = ?2 LIMIT 1')
        .bind(user.uid, dateKey)
        .first();

      return jsonResponse(request, env, {
        ok: true,
        usage: rowToDailyUsage(updated, user.uid, dateKey),
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

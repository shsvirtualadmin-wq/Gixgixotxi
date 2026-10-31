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

function getPreviousDateKey(dateKey: string, daysBack = 1): string {
  const base = new Date(`${dateKey}T00:00:00.000Z`).getTime();
  return new Date(base - daysBack * 86400000).toISOString().slice(0, 10);
}

export async function computeAndPersistUserStreak(db: any, uid: string): Promise<Record<string, any>> {
  const now = Date.now();
  const todayPkt = getPktDateKey(now);
  const yesterdayPkt = getPreviousDateKey(todayPkt, 1);

  const [usageRows, attemptsRows, userRow, existingStreakRow] = await Promise.all([
    db
      .prepare('SELECT date_key, questions_solved, practice_attempts, tests_started, time_spent_seconds, accuracy, subjects_json FROM user_daily_usage WHERE uid = ?1 ORDER BY date_key DESC LIMIT 60')
      .bind(uid)
      .all(),
    db
      .prepare("SELECT created_at, submitted_at, total_questions, correct_answers, percentage, time_taken_seconds, subject FROM practice_attempts WHERE user_id = ?1 AND status = 'completed' ORDER BY created_at DESC LIMIT 200")
      .bind(uid)
      .all(),
    db.prepare('SELECT streak, longest_streak, streak_freeze_active FROM users WHERE uid = ?1 LIMIT 1').bind(uid).first(),
    db.prepare('SELECT * FROM user_streaks WHERE uid = ?1 LIMIT 1').bind(uid).first(),
  ]);

  const activeByDate = new Map<
    string,
    { questions: number; attempts: number; timeSpent: number; accuracy: number; subjects: Set<string> }
  >();

  for (const u of usageRows?.results || []) {
    const dk = String(u.date_key || '');
    if (!dk) continue;
    const qs = Number(u.questions_solved || 0);
    const att = Number(u.practice_attempts || u.tests_started || 0);
    if (qs > 0 || att > 0) {
      activeByDate.set(dk, {
        questions: qs,
        attempts: att,
        timeSpent: Number(u.time_spent_seconds || 0),
        accuracy: Number(u.accuracy || 0),
        subjects: new Set(parseJsonSafe<string[]>(u.subjects_json, [])),
      });
    }
  }

  for (const a of attemptsRows?.results || []) {
    const ts = Number(a.submitted_at || a.created_at || 0);
    if (!ts) continue;
    const dk = getPktDateKey(ts);
    const cur = activeByDate.get(dk) || {
      questions: 0,
      attempts: 0,
      timeSpent: 0,
      accuracy: 0,
      subjects: new Set<string>(),
    };
    cur.questions += Number(a.total_questions || 0);
    cur.attempts += 1;
    cur.timeSpent += Number(a.time_taken_seconds || 0);
    cur.accuracy = Math.max(cur.accuracy, Number(a.percentage || 0));
    if (a.subject) cur.subjects.add(String(a.subject));
    activeByDate.set(dk, cur);
  }

  const todayActive = activeByDate.has(todayPkt);
  const freezeAvailable = Boolean(userRow?.streak_freeze_active || existingStreakRow?.freeze_active);
  let freezeUsed = false;
  let freezeDate: string | null = existingStreakRow?.freeze_date || null;

  // Compute current streak backwards from today (or yesterday if today is still pending)
  let currentStreak = 0;
  let cursor = todayActive ? todayPkt : yesterdayPkt;

  for (let i = 0; i < 60; i++) {
    if (activeByDate.has(cursor)) {
      currentStreak++;
      cursor = getPreviousDateKey(cursor, 1);
    } else if (!freezeUsed && (freezeAvailable || freezeDate === cursor) && currentStreak > 0) {
      freezeUsed = true;
      freezeDate = cursor;
      cursor = getPreviousDateKey(cursor, 1);
    } else {
      break;
    }
  }

  const longestStreak = Math.max(
    currentStreak,
    Number(userRow?.longest_streak || 0),
    Number(existingStreakRow?.longest_streak || 0)
  );

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const history28 = [];
  for (let i = 27; i >= 0; i--) {
    const dk = getPktDateKey(now - i * 86400000);
    const dObj = new Date(`${dk}T00:00:00.000Z`);
    const info = activeByDate.get(dk);
    const isFreeze = freezeDate === dk && !info;
    history28.push({
      dateKey: dk,
      label: dayLabels[dObj.getUTCDay()],
      dayOfMonth: dObj.getUTCDate(),
      active: Boolean(info),
      freezeUsed: isFreeze,
      isToday: dk === todayPkt,
      isFuture: false,
      attemptsCount: info?.attempts || 0,
      questionsSolved: info?.questions || 0,
      accuracy: info?.accuracy || 0,
      timeSpentSeconds: info?.timeSpent || 0,
      subjects: info ? Array.from(info.subjects) : [],
    });
  }

  const last7Days = history28.slice(-7);
  const activeDaysCount = activeByDate.size;
  const totalSessions = Array.from(activeByDate.values()).reduce((sum, v) => sum + v.attempts, 0);
  const lastActivePkt = Array.from(activeByDate.keys()).sort().pop() || null;

  await db.batch([
    db
      .prepare(
        `INSERT INTO user_streaks (
          uid, current_streak, longest_streak, today_active, today_pending,
          active_days_count, total_sessions, last_active_pkt, freeze_active,
          freeze_used, freeze_date, history28_json, last7_days_json, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
        ON CONFLICT(uid) DO UPDATE SET
          current_streak = excluded.current_streak,
          longest_streak = excluded.longest_streak,
          today_active = excluded.today_active,
          today_pending = excluded.today_pending,
          active_days_count = excluded.active_days_count,
          total_sessions = excluded.total_sessions,
          last_active_pkt = excluded.last_active_pkt,
          freeze_used = excluded.freeze_used,
          freeze_date = excluded.freeze_date,
          history28_json = excluded.history28_json,
          last7_days_json = excluded.last7_days_json,
          updated_at = excluded.updated_at`
      )
      .bind(
        uid,
        currentStreak,
        longestStreak,
        todayActive ? 1 : 0,
        todayActive ? 0 : 1,
        activeDaysCount,
        totalSessions,
        lastActivePkt,
        freezeAvailable && !freezeUsed ? 1 : 0,
        freezeUsed ? 1 : 0,
        freezeDate,
        JSON.stringify(history28),
        JSON.stringify(last7Days),
        now
      ),
    db
      .prepare(
        'UPDATE users SET streak = ?1, longest_streak = ?2, last_active_date = COALESCE(?3, last_active_date), updated_at = ?4 WHERE uid = ?5'
      )
      .bind(currentStreak, longestStreak, lastActivePkt, now, uid),
    db
      .prepare(
        'UPDATE public_profiles SET streak = ?1, longest_streak = ?2, updated_at = ?3 WHERE uid = ?4'
      )
      .bind(currentStreak, longestStreak, now, uid),
  ]);

  return {
    currentStreak,
    longestStreak,
    todayActive,
    todayPending: !todayActive,
    last7Days,
    history28,
    activeDaysCount,
    totalSessions,
    lastActivePKT: lastActivePkt,
    freezeActive: freezeAvailable && !freezeUsed,
    freezeUsed,
    freezeDate,
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
  const subPath = url.pathname.replace(/^\/api\/streaks\/?/, '').replace(/\/+$/, '');
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

    if ((subPath === '' || subPath === 'sync') && (method === 'GET' || method === 'POST')) {
      const result = await computeAndPersistUserStreak(db, targetUid);
      return jsonResponse(request, env, { ok: true, streak: result, ...result });
    }

    return errorResponse(request, env, 'Streaks endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

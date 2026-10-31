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
  parseJsonSafe,
} from '../_d1Core';

function getPktDateKey(ms = Date.now()): string {
  const pktMs = ms + 5 * 3600 * 1000;
  return new Date(pktMs).toISOString().slice(0, 10);
}

function rowToPracticeAttempt(r: Record<string, any>) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    title: String(r.title || 'Practice Session'),
    mode: String(r.mode || 'practice'),
    subject: String(r.subject || 'general'),
    chapter: r.chapter || undefined,
    weightedChapter: r.weighted_chapter || undefined,
    university: r.university || undefined,
    status: String(r.status || 'completed'),
    questions: parseJsonSafe<any[]>(r.questions_json, []),
    userAnswers: parseJsonSafe<Record<string, any>>(r.user_answers_json, {}),
    flagged: parseJsonSafe<number[]>(r.flagged_json, []),
    score: Number(r.score || 0),
    maxMarks: Number(r.max_marks || 0),
    earnedMarks: Number(r.earned_marks || 0),
    totalQuestions: Number(r.total_questions || 0),
    correctAnswers: Number(r.correct_answers || 0),
    wrongAnswers: Number(r.wrong_answers || 0),
    unanswered: Number(r.unanswered || 0),
    percentage: Number(r.percentage || 0),
    timeTakenSeconds: Number(r.time_taken_seconds || 0),
    durationSeconds: Number(r.duration_seconds || 600),
    timed: Boolean(r.timed ?? 1),
    startedAt: r.started_at ? Number(r.started_at) : Number(r.created_at || Date.now()),
    endsAt: r.ends_at ? Number(r.ends_at) : undefined,
    submittedAt: r.submitted_at ? Number(r.submitted_at) : undefined,
    regradedAt: r.regraded_at ? Number(r.regraded_at) : undefined,
    createdAt: Number(r.created_at || Date.now()),
    updatedAt: Number(r.updated_at || Date.now()),
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
  const subPath = url.pathname.replace(/^\/api\/practice-attempts\/?/, '').replace(/\/+$/, '');
  const segments = subPath ? subPath.split('/').map(decodeURIComponent) : [];
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);
    const user = await authenticateD1Request(request, env, true);
    if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

    // 1. GET /api/practice-attempts (List user's attempts or admin lookup)
    if (segments.length === 0 && method === 'GET') {
      const targetUid =
        user.isAdminOrAbove && url.searchParams.get('uid')
          ? cleanStr(url.searchParams.get('uid'), 128)
          : user.uid;
      const status = cleanStr(url.searchParams.get('status'), 32);
      const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 50));

      let stmt;
      if (status) {
        stmt = db
          .prepare(
            'SELECT * FROM practice_attempts WHERE user_id = ?1 AND status = ?2 ORDER BY created_at DESC LIMIT ?3'
          )
          .bind(targetUid, status, limit);
      } else {
        stmt = db
          .prepare(
            'SELECT * FROM practice_attempts WHERE user_id = ?1 ORDER BY created_at DESC LIMIT ?2'
          )
          .bind(targetUid, limit);
      }

      const { results } = await stmt.all();
      return jsonResponse(request, env, {
        ok: true,
        attempts: (results || []).map(rowToPracticeAttempt),
      });
    }

    // 2. POST /api/practice-attempts/start (Start a new practice/mock test & record daily usage)
    if (segments[0] === 'start' && method === 'POST') {
      const allowed = await checkRateLimitD1(db, `prac_start:${user.uid}`, 60, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const id = cleanStr(body.id, 128) || `att_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const title = cleanStr(body.title, 200, 'Practice Session');
      const mode = cleanStr(body.mode, 40, 'practice');
      const subject = cleanStr(body.subject, 80, 'general');
      const chapter = body.chapter ? cleanStr(body.chapter, 120) : null;
      const weightedChapter = body.weightedChapter ? cleanStr(body.weightedChapter, 120) : null;
      const university = body.university ? cleanStr(body.university, 120) : null;
      const questions = Array.isArray(body.questions) ? body.questions : [];
      const durationSeconds = Math.max(30, Math.min(18000, Number(body.durationSeconds || 600)));
      const timed = body.timed !== undefined ? (body.timed ? 1 : 0) : 1;
      const now = Date.now();
      const endsAt = timed ? now + durationSeconds * 1000 : now + 24 * 3600 * 1000;
      const dateKey = getPktDateKey(now);

      await db.batch([
        db
          .prepare(
            `INSERT INTO practice_attempts (
              id, user_id, title, mode, subject, chapter, weighted_chapter, university,
              status, questions_json, user_answers_json, flagged_json, total_questions,
              duration_seconds, timed, started_at, ends_at, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'in_progress', ?9, '{}', '[]', ?10, ?11, ?12, ?13, ?14, ?13, ?13)
            ON CONFLICT(id) DO UPDATE SET updated_at = ?13`
          )
          .bind(
            id,
            user.uid,
            title,
            mode,
            subject,
            chapter,
            weightedChapter,
            university,
            JSON.stringify(questions),
            questions.length,
            durationSeconds,
            timed,
            now,
            endsAt
          ),
        db
          .prepare(
            `INSERT INTO user_daily_usage (
              id, uid, date_key, tests_started, practice_attempts, updated_at
            ) VALUES (?1, ?2, ?3, 1, 1, ?4)
            ON CONFLICT(uid, date_key) DO UPDATE SET
              tests_started = user_daily_usage.tests_started + 1,
              practice_attempts = user_daily_usage.practice_attempts + 1,
              updated_at = ?4`
          )
          .bind(`${user.uid}_${dateKey}`, user.uid, dateKey, now),
      ]);

      const row = await db.prepare('SELECT * FROM practice_attempts WHERE id = ?1 LIMIT 1').bind(id).first();
      return jsonResponse(
        request,
        env,
        {
          ok: true,
          id,
          attempt: row ? rowToPracticeAttempt(row) : null,
        },
        201
      );
    }

    // 3. POST /api/practice-attempts or PUT /api/practice-attempts/:id (Save progress or submit completed attempt)
    if (
      (segments.length === 0 && method === 'POST') ||
      (segments.length === 1 && (method === 'PUT' || method === 'PATCH' || method === 'POST'))
    ) {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const attemptId =
        cleanStr(segments[0] || body.id, 128) || `att_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

      const existing = await db
        .prepare('SELECT * FROM practice_attempts WHERE id = ?1 LIMIT 1')
        .bind(attemptId)
        .first();

      if (existing && existing.user_id !== user.uid && !user.isAdminOrAbove) {
        return errorResponse(request, env, 'Forbidden.', 'FORBIDDEN', 403);
      }

      const now = Date.now();
      const status = cleanStr(body.status || existing?.status, 32, 'completed');
      const title = cleanStr(body.title ?? existing?.title, 200, 'Practice Session');
      const mode = cleanStr(body.mode ?? existing?.mode, 40, 'practice');
      const subject = cleanStr(body.subject ?? existing?.subject, 80, 'general');
      const chapter = body.chapter !== undefined ? cleanStr(body.chapter, 120) || null : existing?.chapter || null;
      const weightedChapter =
        body.weightedChapter !== undefined
          ? cleanStr(body.weightedChapter, 120) || null
          : existing?.weighted_chapter || null;
      const university =
        body.university !== undefined ? cleanStr(body.university, 120) || null : existing?.university || null;

      const questions = Array.isArray(body.questions)
        ? body.questions
        : parseJsonSafe<any[]>(existing?.questions_json, []);
      const userAnswers =
        body.userAnswers && typeof body.userAnswers === 'object'
          ? body.userAnswers
          : parseJsonSafe<Record<string, any>>(existing?.user_answers_json, {});
      const flagged = Array.isArray(body.flagged)
        ? body.flagged
        : parseJsonSafe<number[]>(existing?.flagged_json, []);

      const totalQuestions = Math.max(
        0,
        Number(body.totalQuestions ?? questions.length ?? existing?.total_questions ?? 0)
      );
      const correctAnswers = Math.max(0, Number(body.correctAnswers ?? existing?.correct_answers ?? 0));
      const wrongAnswers = Math.max(0, Number(body.wrongAnswers ?? existing?.wrong_answers ?? 0));
      const unanswered = Math.max(
        0,
        Number(
          body.unanswered ??
            Math.max(0, totalQuestions - correctAnswers - wrongAnswers) ??
            existing?.unanswered ??
            0
        )
      );
      const score = Number(body.score ?? body.percentage ?? existing?.score ?? 0);
      const maxMarks = Number(body.maxMarks ?? totalQuestions ?? existing?.max_marks ?? 0);
      const earnedMarks = Number(body.earnedMarks ?? correctAnswers ?? existing?.earned_marks ?? 0);
      const percentage = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            Number(
              body.percentage ??
                (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0)
            )
          )
        )
      );
      const timeTakenSeconds = Math.max(0, Number(body.timeTakenSeconds ?? existing?.time_taken_seconds ?? 0));
      const durationSeconds = Math.max(30, Number(body.durationSeconds ?? existing?.duration_seconds ?? 600));
      const timed = body.timed !== undefined ? (body.timed ? 1 : 0) : Number(existing?.timed ?? 1);
      const startedAt = Number(body.startedAt ?? existing?.started_at ?? now);
      const submittedAt = status === 'completed' ? Number(body.submittedAt ?? existing?.submitted_at ?? now) : null;

      const wasAlreadyCompleted = existing?.status === 'completed';
      const isNewlyCompleted = status === 'completed' && !wasAlreadyCompleted;

      const stmts: any[] = [
        db
          .prepare(
            `INSERT INTO practice_attempts (
              id, user_id, title, mode, subject, chapter, weighted_chapter, university,
              status, questions_json, user_answers_json, flagged_json,
              score, max_marks, earned_marks, total_questions, correct_answers,
              wrong_answers, unanswered, percentage, time_taken_seconds,
              duration_seconds, timed, started_at, submitted_at, created_at, updated_at
            ) VALUES (
              ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
              ?9, ?10, ?11, ?12,
              ?13, ?14, ?15, ?16, ?17,
              ?18, ?19, ?20, ?21,
              ?22, ?23, ?24, ?25, ?26, ?27
            )
            ON CONFLICT(id) DO UPDATE SET
              status = excluded.status,
              questions_json = excluded.questions_json,
              user_answers_json = excluded.user_answers_json,
              flagged_json = excluded.flagged_json,
              score = excluded.score,
              max_marks = excluded.max_marks,
              earned_marks = excluded.earned_marks,
              total_questions = excluded.total_questions,
              correct_answers = excluded.correct_answers,
              wrong_answers = excluded.wrong_answers,
              unanswered = excluded.unanswered,
              percentage = excluded.percentage,
              time_taken_seconds = excluded.time_taken_seconds,
              submitted_at = COALESCE(practice_attempts.submitted_at, excluded.submitted_at),
              updated_at = excluded.updated_at`
          )
          .bind(
            attemptId,
            existing?.user_id || user.uid,
            title,
            mode,
            subject,
            chapter,
            weightedChapter,
            university,
            status,
            JSON.stringify(questions),
            JSON.stringify(userAnswers),
            JSON.stringify(flagged),
            score,
            maxMarks,
            earnedMarks,
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            unanswered,
            percentage,
            timeTakenSeconds,
            durationSeconds,
            timed,
            startedAt,
            submittedAt,
            Number(existing?.created_at || now),
            now
          ),
      ];

      if (isNewlyCompleted) {
        const answeredCount = correctAnswers + wrongAnswers;
        const dateKey = getPktDateKey(now);

        // Update user_daily_usage
        stmts.push(
          db
            .prepare(
              `INSERT INTO user_daily_usage (
                id, uid, date_key, tests_started, practice_attempts, questions_solved,
                accuracy, time_spent_seconds, updated_at
              ) VALUES (?1, ?2, ?3, 1, 1, ?4, ?5, ?6, ?7)
              ON CONFLICT(uid, date_key) DO UPDATE SET
                questions_solved = user_daily_usage.questions_solved + ?4,
                accuracy = ?5,
                time_spent_seconds = user_daily_usage.time_spent_seconds + ?6,
                updated_at = ?7`
            )
            .bind(
              `${user.uid}_${dateKey}`,
              user.uid,
              dateKey,
              answeredCount,
              percentage,
              timeTakenSeconds,
              now
            )
        );

        // Update chapter stats if chapter Deltas provided or derived from questions
        const chapterDeltas: Record<string, { correct: number; total: number; subject: string }> =
          body.chapterDeltas && typeof body.chapterDeltas === 'object' ? body.chapterDeltas : {};

        if (Object.keys(chapterDeltas).length === 0 && chapter) {
          const slug = chapter.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          chapterDeltas[slug] = {
            correct: correctAnswers,
            total: Math.max(1, answeredCount || totalQuestions),
            subject: subject.toLowerCase(),
          };
        }

        for (const [chSlug, delta] of Object.entries(chapterDeltas)) {
          const cleanSlug = cleanStr(chSlug, 120);
          if (!cleanSlug) continue;
          stmts.push(
            db
              .prepare(
                `INSERT INTO user_chapter_stats (
                  id, uid, chapter_slug, subject_slug, correct, total, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                ON CONFLICT(uid, chapter_slug) DO UPDATE SET
                  correct = user_chapter_stats.correct + ?5,
                  total = user_chapter_stats.total + ?6,
                  updated_at = ?7`
              )
              .bind(
                `${user.uid}_${cleanSlug}`,
                user.uid,
                cleanSlug,
                cleanStr(delta.subject || subject, 80),
                Math.max(0, Number(delta.correct || 0)),
                Math.max(0, Number(delta.total || 0)),
                now
              )
          );
        }

        // Update users and public_profiles aggregate stats
        const uRow = await db
          .prepare('SELECT mcqs_solved, total_questions_solved, tests_completed, score, accuracy FROM users WHERE uid = ?1 LIMIT 1')
          .bind(user.uid)
          .first();

        const prevMcqs = Number(uRow?.mcqs_solved || uRow?.total_questions_solved || 0);
        const prevTests = Number(uRow?.tests_completed || 0);
        const prevScore = Number(uRow?.score || 0);
        const prevAcc = Number(uRow?.accuracy || 0);

        const nextMcqs = prevMcqs + Math.max(answeredCount, totalQuestions);
        const nextTests = prevTests + 1;
        const nextAcc =
          prevTests > 0
            ? Math.round(((prevAcc * prevTests + percentage) / nextTests) * 10) / 10
            : percentage;
        const nextScore = prevScore + earnedMarks * 10;

        stmts.push(
          db
            .prepare(
              `UPDATE users SET
                mcqs_solved = ?1,
                total_questions_solved = ?1,
                tests_completed = ?2,
                accuracy = ?3,
                score = ?4,
                last_active_date = ?5,
                updated_at = ?6
               WHERE uid = ?7`
            )
            .bind(nextMcqs, nextTests, nextAcc, nextScore, dateKey, now, user.uid),
          db
            .prepare(
              `UPDATE public_profiles SET
                mcqs = ?1,
                tests_completed = ?2,
                accuracy = ?3,
                score = ?4,
                last_active_at = ?5,
                updated_at = ?5
               WHERE uid = ?6`
            )
            .bind(nextMcqs, nextTests, nextAcc, nextScore, now, user.uid)
        );
      }

      await db.batch(stmts);

      const saved = await db
        .prepare('SELECT * FROM practice_attempts WHERE id = ?1 LIMIT 1')
        .bind(attemptId)
        .first();

      return jsonResponse(request, env, {
        ok: true,
        id: attemptId,
        attempt: saved ? rowToPracticeAttempt(saved) : null,
      });
    }

    // 4. GET /api/practice-attempts/:id
    if (segments.length === 1 && segments[0] && method === 'GET') {
      const attemptId = cleanStr(segments[0], 128);
      const row = await db
        .prepare('SELECT * FROM practice_attempts WHERE id = ?1 LIMIT 1')
        .bind(attemptId)
        .first();

      if (!row) {
        return errorResponse(request, env, 'Attempt not found.', 'NOT_FOUND', 404);
      }
      if (row.user_id !== user.uid && !user.isAdminOrAbove) {
        return errorResponse(request, env, 'Forbidden.', 'FORBIDDEN', 403);
      }

      return jsonResponse(request, env, {
        ok: true,
        attempt: rowToPracticeAttempt(row),
      });
    }

    return errorResponse(request, env, 'Practice attempts endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

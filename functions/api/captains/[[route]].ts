import {
  D1Env,
  HttpError,
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
  const subPath = url.pathname.replace(/^\/api\/captains\/?/, '').replace(/\/+$/, '');
  const segments = subPath ? subPath.split('/').map(decodeURIComponent) : [];
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);

    // 1. GET /api/captains/leaderboard or GET /api/captains
    if ((segments.length === 0 || segments[0] === 'leaderboard') && method === 'GET') {
      const [capRows, crewRows, testRows] = await Promise.all([
        db.prepare('SELECT * FROM captains ORDER BY points DESC, activated_referrals DESC LIMIT 100').all(),
        db.prepare("SELECT * FROM crews WHERE status = 'active' ORDER BY member_count DESC LIMIT 100").all(),
        db
          .prepare(
            "SELECT captain_uid, COUNT(*) AS tests_count, SUM(attempts_count) AS total_attempts FROM captain_tests WHERE status = 'published' GROUP BY captain_uid"
          )
          .all()
          .catch(() => ({ results: [] })),
      ]);

      const testStatsByUid = new Map<string, { testsCount: number; totalAttempts: number }>();
      for (const t of testRows?.results || []) {
        testStatsByUid.set(String(t.captain_uid), {
          testsCount: Number(t.tests_count || 0),
          totalAttempts: Number(t.total_attempts || 0),
        });
      }

      const crewByCaptain = new Map<string, any>();
      for (const c of crewRows?.results || []) {
        crewByCaptain.set(String(c.captain_uid), c);
      }

      const leaderboardMap = new Map<string, any>();

      for (const r of capRows?.results || []) {
        const uid = String(r.user_id);
        const crew = crewByCaptain.get(uid);
        const ts = testStatsByUid.get(uid) || { testsCount: 0, totalAttempts: 0 };
        leaderboardMap.set(uid, {
          userId: uid,
          uid,
          name: String(r.name || crew?.captain_name || 'Captain'),
          email: String(r.email || ''),
          university: String(r.university || crew?.university || ''),
          city: String(r.city || ''),
          referralCode: String(r.referral_code || crew?.code || ''),
          captainCode: String(r.captain_code || crew?.code || ''),
          points: Number(r.points || 100) + ts.testsCount * 25 + ts.totalAttempts * 5,
          activatedReferrals: Number(r.activated_referrals || crew?.member_count || 0),
          memberCount: Number(crew?.member_count || 1),
          crewId: crew?.id || null,
          crewName: crew?.name || null,
          testsCount: ts.testsCount,
          totalAttempts: ts.totalAttempts,
          tier: String(r.tier || 'Bronze'),
        });
      }

      for (const c of crewRows?.results || []) {
        const uid = String(c.captain_uid);
        if (!leaderboardMap.has(uid)) {
          const ts = testStatsByUid.get(uid) || { testsCount: 0, totalAttempts: 0 };
          leaderboardMap.set(uid, {
            userId: uid,
            uid,
            name: String(c.captain_name || 'Captain'),
            email: String(c.captain_email || ''),
            university: String(c.university || ''),
            city: '',
            referralCode: String(c.code || ''),
            captainCode: String(c.code || ''),
            points: 100 + Number(c.member_count || 1) * 20 + ts.testsCount * 25 + ts.totalAttempts * 5,
            activatedReferrals: Number(c.member_count || 1),
            memberCount: Number(c.member_count || 1),
            crewId: String(c.id),
            crewName: String(c.name || ''),
            testsCount: ts.testsCount,
            totalAttempts: ts.totalAttempts,
            tier: 'Silver',
          });
        }
      }

      const captains = Array.from(leaderboardMap.values())
        .sort((a, b) => b.points - a.points || b.activatedReferrals - a.activatedReferrals)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));

      return jsonResponse(request, env, { ok: true, captains, leaderboard: captains });
    }

    // 2. GET /api/captains/:uidOrCode
    if (segments.length === 1 && segments[0] && method === 'GET') {
      const key = cleanStr(segments[0], 128);
      const [capRow, crewRow, pubRow] = await Promise.all([
        db
          .prepare(
            'SELECT * FROM captains WHERE user_id = ?1 OR lower(referral_code) = lower(?1) OR lower(captain_code) = lower(?1) LIMIT 1'
          )
          .bind(key)
          .first(),
        db
          .prepare(
            'SELECT * FROM crews WHERE captain_uid = ?1 OR id = ?1 OR lower(code) = lower(?1) LIMIT 1'
          )
          .bind(key)
          .first(),
        db
          .prepare(
            'SELECT * FROM public_profiles WHERE uid = ?1 OR lower(username) = lower(?1) OR lower(short_id) = lower(?1) LIMIT 1'
          )
          .bind(key)
          .first(),
      ]);

      const resolvedUid = capRow?.user_id || crewRow?.captain_uid || pubRow?.uid;
      if (!resolvedUid) {
        return errorResponse(request, env, 'Captain not found.', 'NOT_FOUND', 404);
      }

      const { results: tests } = await db
        .prepare(
          `SELECT id, title, description, subject, question_count AS questionCount,
                  duration_minutes AS durationMinutes, visibility, status,
                  captain_uid AS captainUid, captain_name AS captainName,
                  crew_id AS crewId, crew_name AS crewName,
                  attempts_count AS attemptsCount, avg_score AS avgScore,
                  created_at AS createdAt
           FROM captain_tests
           WHERE captain_uid = ?1 AND status = 'published' AND visibility = 'public'
           ORDER BY created_at DESC LIMIT 50`
        )
        .bind(resolvedUid)
        .all()
        .catch(() => ({ results: [] }));

      return jsonResponse(request, env, {
        ok: true,
        captain: {
          uid: resolvedUid,
          userId: resolvedUid,
          name: capRow?.name || crewRow?.captain_name || pubRow?.display_name || 'Captain',
          university: capRow?.university || crewRow?.university || '',
          city: capRow?.city || '',
          referralCode: capRow?.referral_code || crewRow?.code || '',
          points: Number(capRow?.points || 100),
          activatedReferrals: Number(capRow?.activated_referrals || crewRow?.member_count || 0),
          tier: capRow?.tier || 'Silver',
          bio: pubRow?.bio || crewRow?.description || '',
          avatar: pubRow?.avatar || pubRow?.photo_url || null,
          frame: pubRow?.frame || null,
          banner: pubRow?.banner || null,
          crew: crewRow
            ? {
                id: crewRow.id,
                code: crewRow.code,
                name: crewRow.name,
                description: crewRow.description,
                university: crewRow.university,
                memberCount: Number(crewRow.member_count || 1),
                status: crewRow.status,
              }
            : null,
          tests: tests || [],
        },
      });
    }

    return errorResponse(request, env, 'Captains endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

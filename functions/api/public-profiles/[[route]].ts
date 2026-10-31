import {
  D1Env,
  HttpError,
  authenticateD1Request,
  cleanStr,
  ensureD1Migration002,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
  rowToPublicProfile,
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
  const subPath = url.pathname.replace(/^\/api\/public-profiles\/?/, '').replace(/\/+$/, '');
  const segments = subPath ? subPath.split('/').map(decodeURIComponent) : [];
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);

    // 1. GET /api/public-profiles (Search / leaderboard / list)
    if (segments.length === 0 && method === 'GET') {
      const sort = cleanStr(url.searchParams.get('sort'), 32, 'score').toLowerCase();
      const q = cleanStr(url.searchParams.get('q') || url.searchParams.get('search'), 80).toLowerCase();
      const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 20));

      let orderClause = 'score DESC, mcqs DESC, streak DESC';
      if (sort === 'streak') orderClause = 'streak DESC, longest_streak DESC, score DESC';
      else if (sort === 'mcqs') orderClause = 'mcqs DESC, score DESC';
      else if (sort === 'recent') orderClause = 'updated_at DESC';

      let stmt;
      if (q) {
        const likeQ = `%${q}%`;
        stmt = db
          .prepare(
            `SELECT * FROM public_profiles
             WHERE lower(display_name) LIKE ?1 OR lower(username) LIKE ?1 OR lower(short_id) LIKE ?1
             ORDER BY ${orderClause} LIMIT ?2`
          )
          .bind(likeQ, limit);
      } else {
        stmt = db
          .prepare(`SELECT * FROM public_profiles ORDER BY ${orderClause} LIMIT ?1`)
          .bind(limit);
      }

      const { results } = await stmt.all();
      const profiles = (results || []).map(rowToPublicProfile);
      return jsonResponse(request, env, { ok: true, profiles });
    }

    // 2. POST /api/public-profiles/batch
    if (segments[0] === 'batch' && method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { uids?: string[] };
      const uids = Array.isArray(body.uids)
        ? Array.from(new Set(body.uids.map((u) => cleanStr(u, 128)).filter(Boolean))).slice(0, 100)
        : [];

      if (uids.length === 0) {
        return jsonResponse(request, env, { ok: true, profiles: {} });
      }

      const placeholders = uids.map((_, i) => `?${i + 1}`).join(', ');
      const { results } = await db
        .prepare(`SELECT * FROM public_profiles WHERE uid IN (${placeholders})`)
        .bind(...uids)
        .all();

      const map: Record<string, any> = {};
      for (const r of results || []) {
        const p = rowToPublicProfile(r);
        map[p.uid] = p;
      }

      return jsonResponse(request, env, { ok: true, profiles: map });
    }

    // 3. POST /api/public-profiles/sync
    if (segments[0] === 'sync' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const targetUid = user.isAdminOrAbove && body.uid ? cleanStr(body.uid, 128) : user.uid;

      const [uRow, wRow, rRow, followersCnt, followingCnt] = await Promise.all([
        db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
        db.prepare('SELECT role, custom_role FROM user_roles WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
        db.prepare('SELECT COUNT(*) AS cnt FROM follows WHERE following_uid = ?1').bind(targetUid).first(),
        db.prepare('SELECT COUNT(*) AS cnt FROM follows WHERE follower_uid = ?1').bind(targetUid).first(),
      ]);

      const now = Date.now();
      const displayName = cleanStr(
        body.displayName || uRow?.display_name || uRow?.name || user.name,
        120,
        'Student'
      );
      const shortId = cleanStr(body.shortId || body.studentId || uRow?.short_id, 16, '00000');
      const role = rRow?.role || uRow?.role || 'student';
      const customRole = rRow?.custom_role || uRow?.custom_role || null;
      const equippedJson =
        body.equipped && typeof body.equipped === 'object'
          ? JSON.stringify(body.equipped)
          : wRow?.equipped_json || uRow?.equipped_json || '{}';

      const streak = Number(body.streak ?? body.stats?.streak ?? uRow?.streak ?? 0);
      const longestStreak = Number(
        body.longestStreak ?? body.stats?.longestStreak ?? uRow?.longest_streak ?? streak
      );
      const mcqs = Number(
        body.mcqs ?? body.stats?.mcqs ?? uRow?.mcqs_solved ?? uRow?.total_questions_solved ?? 0
      );
      const accuracy = Number(body.accuracy ?? body.stats?.accuracy ?? uRow?.accuracy ?? 0);
      const score = Number(body.score ?? body.stats?.score ?? uRow?.score ?? 0);
      const testsCompleted = Number(
        body.testsCompleted ?? body.stats?.testsCompleted ?? uRow?.tests_completed ?? 0
      );
      const followersCount = Number(followersCnt?.cnt ?? uRow?.followers_count ?? 0);
      const followingCount = Number(followingCnt?.cnt ?? uRow?.following_count ?? 0);

      await db
        .prepare(
          `INSERT INTO public_profiles (
            uid, display_name, nickname, username, student_id, short_id, role, custom_role,
            bio, status, accent, avatar, avatar_key, avatar_variant, avatar_url, photo_url,
            banner, frame, nameplate, effect_id, equipped_json, badges_json,
            pinned_badges_json, pinned_stamps_json, crew_id, crew_name, rank_title,
            streak, longest_streak, mcqs, accuracy, score, tests_completed,
            followers_count, following_count, stats_json, member_since, last_active_at, updated_at
          ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14,
            ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28,
            ?29, ?30, ?31, ?32, ?33, ?34, ?35, ?36, ?36
          )
          ON CONFLICT(uid) DO UPDATE SET
            display_name = excluded.display_name,
            nickname = COALESCE(excluded.nickname, public_profiles.nickname),
            username = COALESCE(excluded.username, public_profiles.username),
            student_id = excluded.student_id,
            short_id = excluded.short_id,
            role = excluded.role,
            custom_role = excluded.custom_role,
            bio = excluded.bio,
            status = excluded.status,
            accent = excluded.accent,
            avatar = COALESCE(excluded.avatar, public_profiles.avatar),
            avatar_key = COALESCE(excluded.avatar_key, public_profiles.avatar_key),
            avatar_variant = COALESCE(excluded.avatar_variant, public_profiles.avatar_variant),
            avatar_url = COALESCE(excluded.avatar_url, public_profiles.avatar_url),
            photo_url = COALESCE(excluded.photo_url, public_profiles.photo_url),
            banner = COALESCE(excluded.banner, public_profiles.banner),
            frame = COALESCE(excluded.frame, public_profiles.frame),
            nameplate = COALESCE(excluded.nameplate, public_profiles.nameplate),
            effect_id = COALESCE(excluded.effect_id, public_profiles.effect_id),
            equipped_json = excluded.equipped_json,
            badges_json = excluded.badges_json,
            pinned_badges_json = excluded.pinned_badges_json,
            pinned_stamps_json = excluded.pinned_stamps_json,
            crew_id = COALESCE(excluded.crew_id, public_profiles.crew_id),
            crew_name = COALESCE(excluded.crew_name, public_profiles.crew_name),
            rank_title = excluded.rank_title,
            streak = excluded.streak,
            longest_streak = excluded.longest_streak,
            mcqs = excluded.mcqs,
            accuracy = excluded.accuracy,
            score = excluded.score,
            tests_completed = excluded.tests_completed,
            followers_count = excluded.followers_count,
            following_count = excluded.following_count,
            stats_json = excluded.stats_json,
            last_active_at = excluded.last_active_at,
            updated_at = excluded.updated_at`
        )
        .bind(
          targetUid,
          displayName,
          body.nickname ?? uRow?.nickname ?? null,
          body.username ?? uRow?.username ?? null,
          shortId,
          role,
          customRole,
          cleanStr(body.bio ?? uRow?.bio, 500, ''),
          cleanStr(body.status ?? uRow?.status, 120, ''),
          cleanStr(body.accent ?? uRow?.accent, 32, '#E11D48'),
          body.avatar ?? uRow?.avatar ?? null,
          body.avatarKey ?? uRow?.avatar_key ?? null,
          body.avatarVariant ?? uRow?.avatar_variant ?? null,
          body.photoURL ?? body.avatarUrl ?? uRow?.photo_url ?? null,
          body.banner ?? uRow?.banner ?? null,
          body.frame ?? uRow?.frame ?? null,
          body.nameplate ?? uRow?.nameplate ?? null,
          body.effectId ?? uRow?.effect_id ?? null,
          equippedJson,
          Array.isArray(body.badges) ? JSON.stringify(body.badges) : uRow?.badges_json || '[]',
          Array.isArray(body.pinnedBadges)
            ? JSON.stringify(body.pinnedBadges)
            : uRow?.pinned_badges_json || '[]',
          Array.isArray(body.pinnedStamps)
            ? JSON.stringify(body.pinnedStamps)
            : uRow?.pinned_stamps_json || '[]',
          body.crewId ?? uRow?.crew_id ?? null,
          body.crewName ?? uRow?.crew_name ?? null,
          cleanStr(body.rankTitle, 80, 'Candidate'),
          streak,
          longestStreak,
          mcqs,
          accuracy,
          score,
          testsCompleted,
          followersCount,
          followingCount,
          JSON.stringify({ streak, longestStreak, mcqs, accuracy, score, testsCompleted }),
          Number(uRow?.created_at || now),
          now
        )
        .run();

      const updated = await db
        .prepare('SELECT * FROM public_profiles WHERE uid = ?1 LIMIT 1')
        .bind(targetUid)
        .first();

      return jsonResponse(request, env, {
        ok: true,
        profile: updated ? rowToPublicProfile(updated) : null,
      });
    }

    // 4. GET /api/public-profiles/:uidOrUsername
    if (segments.length === 1 && segments[0] && method === 'GET') {
      const key = cleanStr(segments[0], 128);
      let row = await db
        .prepare(
          'SELECT * FROM public_profiles WHERE uid = ?1 OR lower(username) = lower(?1) OR lower(short_id) = lower(?1) LIMIT 1'
        )
        .bind(key)
        .first();

      if (!row) {
        const usernameRow = await db
          .prepare('SELECT uid FROM usernames WHERE lower(username) = lower(?1) LIMIT 1')
          .bind(key)
          .first();
        const resolvedUid = usernameRow?.uid || key;
        const uRow = await db
          .prepare(
            'SELECT * FROM users WHERE uid = ?1 OR lower(username) = lower(?1) OR lower(short_id) = lower(?1) LIMIT 1'
          )
          .bind(resolvedUid)
          .first();
        if (uRow) {
          row = {
            uid: uRow.uid,
            display_name: uRow.display_name || uRow.name || 'Student',
            nickname: uRow.nickname,
            username: uRow.username,
            student_id: uRow.short_id || '00000',
            short_id: uRow.short_id || '00000',
            role: uRow.role || 'student',
            custom_role: uRow.custom_role,
            bio: uRow.bio || '',
            status: uRow.status || '',
            accent: uRow.accent || '#E11D48',
            avatar: uRow.avatar,
            avatar_key: uRow.avatar_key,
            avatar_variant: uRow.avatar_variant,
            avatar_url: uRow.avatar_url || uRow.photo_url,
            photo_url: uRow.photo_url,
            banner: uRow.banner,
            frame: uRow.frame,
            nameplate: uRow.nameplate,
            effect_id: uRow.effect_id,
            equipped_json: uRow.equipped_json || '{}',
            badges_json: uRow.badges_json || '[]',
            pinned_badges_json: uRow.pinned_badges_json || '[]',
            pinned_stamps_json: uRow.pinned_stamps_json || '[]',
            crew_id: uRow.crew_id,
            crew_name: uRow.crew_name,
            streak: uRow.streak || 0,
            longest_streak: uRow.longest_streak || 0,
            mcqs: uRow.mcqs_solved || uRow.total_questions_solved || 0,
            accuracy: uRow.accuracy || 0,
            score: uRow.score || 0,
            tests_completed: uRow.tests_completed || 0,
            followers_count: uRow.followers_count || 0,
            following_count: uRow.following_count || 0,
            member_since: uRow.created_at || Date.now(),
            last_active_at: uRow.updated_at || Date.now(),
            updated_at: uRow.updated_at || Date.now(),
          };
        }
      }

      if (!row) {
        return errorResponse(request, env, 'Public profile not found.', 'NOT_FOUND', 404);
      }

      const [followersCnt, followingCnt] = await Promise.all([
        db.prepare('SELECT COUNT(*) AS cnt FROM follows WHERE following_uid = ?1').bind(row.uid).first(),
        db.prepare('SELECT COUNT(*) AS cnt FROM follows WHERE follower_uid = ?1').bind(row.uid).first(),
      ]);

      const profile = rowToPublicProfile(row);
      profile.followersCount = Number(followersCnt?.cnt ?? profile.followersCount ?? 0);
      profile.followingCount = Number(followingCnt?.cnt ?? profile.followingCount ?? 0);

      return jsonResponse(request, env, { ok: true, profile });
    }

    return errorResponse(request, env, 'Public profile endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

import {
  D1Env,
  HttpError,
  authenticateD1Request,
  checkRateLimitD1,
  cleanStr,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
  parseJsonSafe,
  rowToPublicProfile,
  rowToUserProfile,
} from '../_d1Core';

function generateRandomShortId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
  const subPath = url.pathname.replace(/^\/api\/users\/?/, '').replace(/\/+$/, '');
  const segments = subPath ? subPath.split('/').map(decodeURIComponent) : [];
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const ip = request.headers.get('CF-Connecting-IP') || 'anon';
      const allowed = await checkRateLimitD1(db, `users_write:${ip}`, 90, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded. Please wait a moment.', 'RATE_LIMITED', 429);
      }
    }

    // 1. GET /api/users/me
    if (segments[0] === 'me' && segments.length === 1 && method === 'GET') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      let [userRow, walletRow] = await Promise.all([
        db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
      ]);

      const now = Date.now();
      if (!userRow) {
        const shortId = generateRandomShortId();
        const refCode = `NK-${shortId}`;
        await db.batch([
          db
            .prepare(
              `INSERT OR IGNORE INTO users (
                uid, email, name, display_name, short_id, photo_url, role, custom_role,
                plan, class_level, board, crew_referral_code, kobans, welcomed,
                is_posting_banned, created_at, updated_at
              ) VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?7, 'free', '12', 'Federal', ?8, 0, 1, ?9, ?10, ?10)`
            )
            .bind(
              user.uid,
              user.email,
              user.name,
              shortId,
              user.picture,
              user.role,
              user.customRole,
              refCode,
              user.isPostingBanned ? 1 : 0,
              now
            ),
          db
            .prepare(
              `INSERT OR IGNORE INTO public_profiles (
                uid, display_name, student_id, short_id, role, custom_role, photo_url,
                avatar_url, member_since, last_active_at, updated_at
              ) VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?6, ?7, ?7, ?7)`
            )
            .bind(user.uid, user.name, shortId, user.role, user.customRole, user.picture, now),
          db
            .prepare(
              `INSERT OR IGNORE INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
               VALUES (?1, 0, '[]', '{}', ?2)`
            )
            .bind(user.uid, now),
        ]);

        userRow = await db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first();
        walletRow = await db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(user.uid).first();
      } else if (userRow.role !== user.role || Boolean(userRow.is_posting_banned) !== user.isPostingBanned) {
        await db
          .prepare('UPDATE users SET role = ?1, custom_role = ?2, is_posting_banned = ?3, updated_at = ?4 WHERE uid = ?5')
          .bind(user.role, user.customRole, user.isPostingBanned ? 1 : 0, now, user.uid)
          .run()
          .catch(() => {});
        userRow.role = user.role;
        userRow.custom_role = user.customRole;
        userRow.is_posting_banned = user.isPostingBanned ? 1 : 0;
      }

      const profile = rowToUserProfile(userRow || { uid: user.uid, email: user.email, name: user.name }, user.role, walletRow);
      return jsonResponse(request, env, { ok: true, profile });
    }

    // 2. PUT or POST /api/users/me (Safe profile update — never allows client to escalate role, plan, or kobans)
    if (segments[0] === 'me' && segments.length === 1 && (method === 'PUT' || method === 'POST' || method === 'PATCH')) {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      const now = Date.now();

      let existing = await db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first();
      if (!existing) {
        const shortId = cleanStr(body.shortId, 16) || generateRandomShortId();
        await db
          .prepare(
            `INSERT OR IGNORE INTO users (
              uid, email, name, display_name, short_id, role, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?6)`
          )
          .bind(user.uid, user.email, user.name, shortId, user.role, now)
          .run();
        existing = await db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first();
      }

      const nextName =
        body.name !== undefined || body.displayName !== undefined
          ? cleanStr(body.displayName ?? body.name, 120, existing.display_name || user.name)
          : existing.name || user.name;
      const nextDisplayName =
        body.displayName !== undefined || body.name !== undefined
          ? cleanStr(body.displayName ?? body.name, 120, existing.display_name || user.name)
          : existing.display_name || nextName;
      const nextNickname =
        body.nickname !== undefined ? cleanStr(body.nickname, 80) || null : existing.nickname;
      const nextBio = body.bio !== undefined ? cleanStr(body.bio, 500, '') : existing.bio || '';
      const nextStatus = body.status !== undefined ? cleanStr(body.status, 120, 'active') : existing.status || 'active';
      const nextAccent = body.accent !== undefined ? cleanStr(body.accent, 32, '#E11D48') : existing.accent || '#E11D48';
      const nextPhotoUrl =
        body.photoURL !== undefined || body.avatarUrl !== undefined
          ? cleanStr(body.photoURL ?? body.avatarUrl, 1000) || null
          : existing.photo_url;
      const nextAvatar = body.avatar !== undefined ? cleanStr(body.avatar, 200) || null : existing.avatar;
      const nextAvatarKey = body.avatarKey !== undefined ? cleanStr(body.avatarKey, 120) || null : existing.avatar_key;
      const nextAvatarVariant =
        body.avatarVariant !== undefined ? cleanStr(body.avatarVariant, 120) || null : existing.avatar_variant;
      const nextBanner = body.banner !== undefined ? cleanStr(body.banner, 200) || null : existing.banner;
      const nextFrame = body.frame !== undefined ? cleanStr(body.frame, 200) || null : existing.frame;
      const nextNameplate = body.nameplate !== undefined ? cleanStr(body.nameplate, 200) || null : existing.nameplate;
      const nextEffectId = body.effectId !== undefined ? cleanStr(body.effectId, 200) || null : existing.effect_id;

      const nextTrack =
        body.academicTrack !== undefined ? cleanStr(body.academicTrack, 120) || null : existing.academic_track;
      const nextUniversity =
        body.university !== undefined || body.targetUniversity !== undefined
          ? cleanStr(body.university ?? body.targetUniversity, 160) || null
          : existing.university;
      const nextTargetExam =
        body.targetExam !== undefined ? cleanStr(body.targetExam, 120) || null : existing.target_exam;
      const nextTestDate =
        body.testDate !== undefined ? cleanStr(body.testDate, 64) || null : existing.test_date;
      const nextClassLevel =
        body.class !== undefined || body.classLevel !== undefined
          ? cleanStr(body.class ?? body.classLevel, 32, '12')
          : existing.class_level || '12';
      const nextBoard =
        body.board !== undefined ? cleanStr(body.board, 64, 'Federal') : existing.board || 'Federal';

      const nextSubjectsJson = Array.isArray(body.subjects)
        ? JSON.stringify(body.subjects.slice(0, 20).map((s: any) => cleanStr(s, 80)))
        : existing.subjects_json || '[]';

      const nextEquippedJson =
        body.equipped && typeof body.equipped === 'object'
          ? JSON.stringify(body.equipped)
          : existing.equipped_json || '{}';

      const nextPinnedBadgesJson = Array.isArray(body.pinnedBadges)
        ? JSON.stringify(body.pinnedBadges.slice(0, 10))
        : existing.pinned_badges_json || '[]';

      const nextPinnedStampsJson = Array.isArray(body.pinnedStamps)
        ? JSON.stringify(body.pinnedStamps.slice(0, 10))
        : existing.pinned_stamps_json || '[]';

      const nextSeenQuestionsJson =
        body.seenQuestions && typeof body.seenQuestions === 'object'
          ? JSON.stringify(body.seenQuestions)
          : existing.seen_questions_json || '{}';

      const nextHasChosenRole =
        body.hasChosenRole !== undefined ? (body.hasChosenRole ? 1 : 0) : Number(existing.has_chosen_role || 0);
      const nextProfileCompleted =
        body.profileCompleted !== undefined ? (body.profileCompleted ? 1 : 0) : Number(existing.profile_completed || 0);
      const nextOnboardingCompleted =
        body.onboardingCompleted !== undefined
          ? body.onboardingCompleted
            ? 1
            : 0
          : Number(existing.onboarding_completed || 0);
      const nextWelcomed =
        body.welcomed !== undefined ? (body.welcomed ? 1 : 0) : Number(existing.welcomed || 1);

      const nextCrewId = body.crewId !== undefined ? (body.crewId ? cleanStr(body.crewId, 128) : null) : existing.crew_id;
      const nextCrewName =
        body.crewName !== undefined ? (body.crewName ? cleanStr(body.crewName, 160) : null) : existing.crew_name;
      const nextIsCrewMember =
        body.isCrewMember !== undefined ? (body.isCrewMember ? 1 : 0) : Number(existing.is_crew_member || 0);
      const nextCrewStatus =
        body.crewStatus !== undefined ? (body.crewStatus ? cleanStr(body.crewStatus, 40) : null) : existing.crew_status;
      const nextCrewRefCode =
        body.crewReferralCode !== undefined
          ? cleanStr(body.crewReferralCode, 40) || null
          : existing.crew_referral_code;

      const shortId = existing.short_id || cleanStr(body.shortId, 16) || generateRandomShortId();

      await db.batch([
        db
          .prepare(
            `UPDATE users SET
              name = ?1, display_name = ?2, nickname = ?3, short_id = ?4,
              photo_url = ?5, avatar = ?6, avatar_key = ?7, avatar_variant = ?8,
              avatar_url = ?5, banner = ?9, frame = ?10, nameplate = ?11, effect_id = ?12,
              bio = ?13, status = ?14, accent = ?15, has_chosen_role = ?16,
              academic_track = ?17, university = ?18, target_university = ?18,
              target_exam = ?19, test_date = ?20, class_level = ?21, board = ?22,
              subjects_json = ?23, equipped_json = ?24, pinned_badges_json = ?25,
              pinned_stamps_json = ?26, seen_questions_json = ?27,
              profile_completed = ?28, onboarding_completed = ?29, welcomed = ?30,
              crew_id = ?31, crew_name = ?32, is_crew_member = ?33, crew_status = ?34,
              crew_referral_code = ?35, updated_at = ?36
             WHERE uid = ?37`
          )
          .bind(
            nextName,
            nextDisplayName,
            nextNickname,
            shortId,
            nextPhotoUrl,
            nextAvatar,
            nextAvatarKey,
            nextAvatarVariant,
            nextBanner,
            nextFrame,
            nextNameplate,
            nextEffectId,
            nextBio,
            nextStatus,
            nextAccent,
            nextHasChosenRole,
            nextTrack,
            nextUniversity,
            nextTargetExam,
            nextTestDate,
            nextClassLevel,
            nextBoard,
            nextSubjectsJson,
            nextEquippedJson,
            nextPinnedBadgesJson,
            nextPinnedStampsJson,
            nextSeenQuestionsJson,
            nextProfileCompleted,
            nextOnboardingCompleted,
            nextWelcomed,
            nextCrewId,
            nextCrewName,
            nextIsCrewMember,
            nextCrewStatus,
            nextCrewRefCode,
            now,
            user.uid
          ),
        db
          .prepare(
            `INSERT INTO public_profiles (
              uid, display_name, nickname, username, student_id, short_id, role, custom_role,
              bio, status, accent, avatar, avatar_key, avatar_variant, avatar_url, photo_url,
              banner, frame, nameplate, effect_id, equipped_json, pinned_badges_json,
              pinned_stamps_json, crew_id, crew_name, streak, longest_streak, mcqs, accuracy,
              score, tests_completed, member_since, last_active_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30, ?31, ?31)
            ON CONFLICT(uid) DO UPDATE SET
              display_name = excluded.display_name,
              nickname = excluded.nickname,
              student_id = excluded.student_id,
              short_id = excluded.short_id,
              role = excluded.role,
              custom_role = excluded.custom_role,
              bio = excluded.bio,
              status = excluded.status,
              accent = excluded.accent,
              avatar = excluded.avatar,
              avatar_key = excluded.avatar_key,
              avatar_variant = excluded.avatar_variant,
              avatar_url = excluded.avatar_url,
              photo_url = excluded.photo_url,
              banner = excluded.banner,
              frame = excluded.frame,
              nameplate = excluded.nameplate,
              effect_id = excluded.effect_id,
              equipped_json = excluded.equipped_json,
              pinned_badges_json = excluded.pinned_badges_json,
              pinned_stamps_json = excluded.pinned_stamps_json,
              crew_id = excluded.crew_id,
              crew_name = excluded.crew_name,
              last_active_at = excluded.last_active_at,
              updated_at = excluded.updated_at`
          )
          .bind(
            user.uid,
            nextDisplayName,
            nextNickname,
            existing.username || null,
            shortId,
            user.role,
            user.customRole,
            nextBio,
            nextStatus,
            nextAccent,
            nextAvatar,
            nextAvatarKey,
            nextAvatarVariant,
            nextPhotoUrl,
            nextBanner,
            nextFrame,
            nextNameplate,
            nextEffectId,
            nextEquippedJson,
            nextPinnedBadgesJson,
            nextPinnedStampsJson,
            nextCrewId,
            nextCrewName,
            Number(existing.streak || 0),
            Number(existing.longest_streak || 0),
            Number(existing.mcqs_solved || existing.total_questions_solved || 0),
            Number(existing.accuracy || 0),
            Number(existing.score || 0),
            Number(existing.tests_completed || 0),
            Number(existing.created_at || now),
            now
          ),
      ]);

      const [updatedRow, walletRow] = await Promise.all([
        db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        profile: rowToUserProfile(updatedRow, user.role, walletRow),
      });
    }

    // 3. POST /api/users/identity (Atomic username + displayName update)
    if (segments[0] === 'identity' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as {
        username?: string;
        displayName?: string;
      };
      const rawUsername = cleanStr(body.username, 30).toLowerCase().replace(/[^a-z0-9_]/g, '');
      const displayName = cleanStr(body.displayName, 80);

      if (!rawUsername || rawUsername.length < 3 || rawUsername.length > 20 || !/^[a-z0-9_]+$/.test(rawUsername)) {
        return errorResponse(
          request,
          env,
          'Username must be 3–20 characters and contain only lowercase letters, numbers, or underscores.',
          'INVALID_USERNAME',
          400
        );
      }

      const taken = await db
        .prepare('SELECT uid FROM usernames WHERE username = ?1 LIMIT 1')
        .bind(rawUsername)
        .first();
      if (taken && taken.uid !== user.uid) {
        return errorResponse(request, env, 'Username is already taken.', 'USERNAME_TAKEN', 409);
      }

      const existingUser = await db
        .prepare('SELECT username, display_name FROM users WHERE uid = ?1 LIMIT 1')
        .bind(user.uid)
        .first();

      const now = Date.now();
      const stmts: any[] = [
        db
          .prepare(
            'INSERT INTO usernames (username, uid, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(username) DO UPDATE SET uid = ?2, updated_at = ?3'
          )
          .bind(rawUsername, user.uid, now),
        db
          .prepare(
            `UPDATE users SET username = ?1, display_name = COALESCE(?2, display_name), name = COALESCE(?2, name), updated_at = ?3 WHERE uid = ?4`
          )
          .bind(rawUsername, displayName || null, now, user.uid),
        db
          .prepare(
            `UPDATE public_profiles SET username = ?1, display_name = COALESCE(?2, display_name), updated_at = ?3 WHERE uid = ?4`
          )
          .bind(rawUsername, displayName || null, now, user.uid),
      ];

      if (existingUser?.username && existingUser.username !== rawUsername) {
        stmts.unshift(
          db.prepare('DELETE FROM usernames WHERE username = ?1 AND uid = ?2').bind(existingUser.username, user.uid)
        );
      }

      await db.batch(stmts);
      return jsonResponse(request, env, { ok: true, username: rawUsername, displayName });
    }

    // 4. POST /api/users/short-id (Ensure or look up shortId)
    if (segments[0] === 'short-id' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const existing = await db
        .prepare('SELECT short_id FROM users WHERE uid = ?1 LIMIT 1')
        .bind(user.uid)
        .first();

      if (existing?.short_id && String(existing.short_id).length === 6) {
        return jsonResponse(request, env, { ok: true, shortId: String(existing.short_id) });
      }

      let candidate = generateRandomShortId();
      for (let i = 0; i < 5; i++) {
        const collision = await db
          .prepare('SELECT uid FROM users WHERE short_id = ?1 LIMIT 1')
          .bind(candidate)
          .first();
        if (!collision || collision.uid === user.uid) break;
        candidate = generateRandomShortId();
      }

      const now = Date.now();
      await db.batch([
        db.prepare('UPDATE users SET short_id = ?1, updated_at = ?2 WHERE uid = ?3').bind(candidate, now, user.uid),
        db
          .prepare('UPDATE public_profiles SET short_id = ?1, student_id = ?1, updated_at = ?2 WHERE uid = ?3')
          .bind(candidate, now, user.uid),
      ]);

      return jsonResponse(request, env, { ok: true, shortId: candidate });
    }

    // 5. POST /api/users/me/badges (Redeem or toggle equipped anime badges)
    if (segments[0] === 'me' && segments[1] === 'badges' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as {
        action?: 'redeem' | 'toggle';
        badgeId?: string;
        code?: string;
      };
      const row = await db
        .prepare('SELECT redeemed_badges_json, equipped_badges_json FROM users WHERE uid = ?1 LIMIT 1')
        .bind(user.uid)
        .first();

      const redeemed = new Set<string>(parseJsonSafe<string[]>(row?.redeemed_badges_json, []));
      const equipped = new Set<string>(parseJsonSafe<string[]>(row?.equipped_badges_json, []));

      const badgeId = cleanStr(body.badgeId, 80);
      if (!badgeId) {
        return errorResponse(request, env, 'Badge ID is required.', 'INVALID_BADGE', 400);
      }

      if (body.action === 'redeem') {
        redeemed.add(badgeId);
        if (equipped.size < 3) {
          equipped.add(badgeId);
        }
      } else {
        if (equipped.has(badgeId)) {
          equipped.delete(badgeId);
        } else {
          if (equipped.size >= 3) {
            return errorResponse(
              request,
              env,
              'You can equip at most 3 badges at a time.',
              'MAX_BADGES_EQUIPPED',
              400
            );
          }
          equipped.add(badgeId);
        }
      }

      const redeemedArr = Array.from(redeemed);
      const equippedArr = Array.from(equipped);
      const now = Date.now();

      await db.batch([
        db
          .prepare(
            'UPDATE users SET redeemed_badges_json = ?1, equipped_badges_json = ?2, pinned_badges_json = ?2, updated_at = ?3 WHERE uid = ?4'
          )
          .bind(JSON.stringify(redeemedArr), JSON.stringify(equippedArr), now, user.uid),
        db
          .prepare('UPDATE public_profiles SET pinned_badges_json = ?1, updated_at = ?2 WHERE uid = ?3')
          .bind(JSON.stringify(equippedArr), now, user.uid),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        redeemedBadges: redeemedArr,
        equippedBadges: equippedArr,
      });
    }

    // 6. POST /api/users/me/wipe (Reset current user's progress & attempts without deleting user account)
    if (segments[0] === 'me' && segments[1] === 'wipe' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const now = Date.now();
      await db.batch([
        db
          .prepare(
            `UPDATE users SET
              streak = 0, longest_streak = 0, total_questions_solved = 0,
              mcqs_solved = 0, score = 0, accuracy = 0, tests_completed = 0,
              seen_questions_json = '{}', updated_at = ?1
             WHERE uid = ?2`
          )
          .bind(now, user.uid),
        db
          .prepare(
            `UPDATE public_profiles SET
              streak = 0, longest_streak = 0, mcqs = 0, accuracy = 0,
              score = 0, tests_completed = 0, stats_json = '{}', updated_at = ?1
             WHERE uid = ?2`
          )
          .bind(now, user.uid),
        db
          .prepare(
            `UPDATE user_streaks SET
              current_streak = 0, longest_streak = 0, today_active = 0,
              today_pending = 1, active_days_count = 0, total_sessions = 0,
              history28_json = '[]', last7_days_json = '[]', updated_at = ?1
             WHERE uid = ?2`
          )
          .bind(now, user.uid),
        db
          .prepare('UPDATE user_chapter_stats SET correct = 0, total = 0, updated_at = ?1 WHERE uid = ?2')
          .bind(now, user.uid),
      ]);

      return jsonResponse(request, env, { ok: true, wipedAt: now });
    }

    // 7. GET /api/users/:uid/chapter-stats
    if (segments.length === 2 && segments[1] === 'chapter-stats' && method === 'GET') {
      const targetUid = cleanStr(segments[0], 128);
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);
      if (user.uid !== targetUid && !user.isAdminOrAbove) {
        return errorResponse(request, env, 'Forbidden.', 'FORBIDDEN', 403);
      }

      const { results } = await db
        .prepare('SELECT chapter_slug, subject_slug, correct, total, updated_at FROM user_chapter_stats WHERE uid = ?1')
        .bind(targetUid)
        .all();

      const statsMap: Record<string, { correct: number; total: number; subject: string; updatedAt: number }> = {};
      for (const r of results || []) {
        statsMap[String(r.chapter_slug)] = {
          correct: Number(r.correct || 0),
          total: Number(r.total || 0),
          subject: String(r.subject_slug || 'general'),
          updatedAt: Number(r.updated_at || 0),
        };
      }

      return jsonResponse(request, env, { ok: true, stats: statsMap });
    }

    // 8. GET /api/users/:uid
    if (segments.length === 1 && segments[0] && method === 'GET') {
      const targetUid = cleanStr(segments[0], 128);
      const caller = await authenticateD1Request(request, env, false);

      if (caller && (caller.uid === targetUid || caller.isAdminOrAbove)) {
        const [uRow, wRow, rRow] = await Promise.all([
          db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
          db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
          db.prepare('SELECT role FROM user_roles WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
        ]);
        if (!uRow) {
          return errorResponse(request, env, 'User not found.', 'NOT_FOUND', 404);
        }
        return jsonResponse(request, env, {
          ok: true,
          profile: rowToUserProfile(uRow, rRow?.role || uRow.role, wRow),
        });
      }

      const pubRow = await db
        .prepare('SELECT * FROM public_profiles WHERE uid = ?1 OR short_id = ?1 LIMIT 1')
        .bind(targetUid)
        .first();
      if (!pubRow) {
        return errorResponse(request, env, 'Profile not found.', 'NOT_FOUND', 404);
      }
      return jsonResponse(request, env, {
        ok: true,
        profile: rowToPublicProfile(pubRow),
      });
    }

    return errorResponse(request, env, `Users route not found: ${method} /api/users/${subPath}`, 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

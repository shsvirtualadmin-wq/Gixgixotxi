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

function generateReferralCode(shortId?: string): string {
  if (shortId && shortId.length >= 4) {
    return `NK-${shortId.toUpperCase()}`;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NK-${suffix}`;
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
  const subPath = url.pathname.replace(/^\/api\/referrals\/?/, '').replace(/\/+$/, '');
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);
    const user = await authenticateD1Request(request, env, true);
    if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

    // 1. GET /api/referrals/dashboard or GET /api/referrals
    if ((subPath === '' || subPath === 'dashboard') && method === 'GET') {
      const targetUid =
        user.isAdminOrAbove && url.searchParams.get('uid')
          ? cleanStr(url.searchParams.get('uid'), 128)
          : user.uid;

      let uRow = await db
        .prepare('SELECT uid, name, display_name, email, short_id, crew_referral_code, ambassador_bonus_weeks FROM users WHERE uid = ?1 LIMIT 1')
        .bind(targetUid)
        .first();

      let refCode = uRow?.crew_referral_code || '';
      if (!refCode) {
        refCode = generateReferralCode(uRow?.short_id);
        await db
          .prepare('UPDATE users SET crew_referral_code = ?1, updated_at = ?2 WHERE uid = ?3')
          .bind(refCode, Date.now(), targetUid)
          .run()
          .catch(() => {});
      }

      const [refRows, capRow] = await Promise.all([
        db
          .prepare('SELECT * FROM referrals WHERE referrer_uid = ?1 OR referrer_code = ?2 ORDER BY signed_up_at DESC LIMIT 200')
          .bind(targetUid, refCode)
          .all(),
        db.prepare('SELECT * FROM captains WHERE user_id = ?1 LIMIT 1').bind(targetUid).first(),
      ]);

      const referrals = (refRows?.results || []).map((r: any) => ({
        id: String(r.id),
        referrerCode: String(r.referrer_code || refCode),
        referrerUid: String(r.referrer_uid || targetUid),
        referrerShortId: r.referrer_short_id || uRow?.short_id || undefined,
        referredUid: String(r.referred_uid),
        referredEmail: String(r.referred_email || ''),
        referredName: String(r.referred_name || 'Student'),
        referredShortId: r.referred_short_id || undefined,
        track: String(r.track || 'General Entrance'),
        status: String(r.status || 'activated'),
        activated: Boolean(r.activated ?? 1),
        bonusAwarded: Boolean(r.bonus_awarded ?? 1),
        signedUpAt: Number(r.signed_up_at || Date.now()),
      }));

      return jsonResponse(request, env, {
        ok: true,
        referralCode: refCode,
        shortId: uRow?.short_id || '',
        totalReferrals: referrals.length,
        activatedReferrals: referrals.filter((r) => r.activated).length,
        bonusWeeks: Number(uRow?.ambassador_bonus_weeks || referrals.length),
        captainProfile: capRow
          ? {
              userId: String(capRow.user_id),
              name: String(capRow.name || ''),
              email: String(capRow.email || ''),
              university: String(capRow.university || ''),
              city: String(capRow.city || ''),
              referralCode: String(capRow.referral_code || refCode),
              captainCode: String(capRow.captain_code || refCode),
              points: Number(capRow.points || 100),
              activatedReferrals: Number(capRow.activated_referrals || referrals.length),
              tier: String(capRow.tier || 'Bronze'),
            }
          : null,
        referrals,
      });
    }

    // 2. POST /api/referrals/ensure
    if (subPath === 'ensure' && method === 'POST') {
      const uRow = await db
        .prepare('SELECT short_id, crew_referral_code FROM users WHERE uid = ?1 LIMIT 1')
        .bind(user.uid)
        .first();

      let code = uRow?.crew_referral_code || '';
      if (!code) {
        code = generateReferralCode(uRow?.short_id);
        await db
          .prepare('UPDATE users SET crew_referral_code = ?1, updated_at = ?2 WHERE uid = ?3')
          .bind(code, Date.now(), user.uid)
          .run();
      }
      return jsonResponse(request, env, { ok: true, referralCode: code });
    }

    // 3. POST /api/referrals/signup (Process a referral code on student signup)
    if (subPath === 'signup' && method === 'POST') {
      const allowed = await checkRateLimitD1(db, `ref_signup:${user.uid}`, 10, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
      }

      const body = (await request.json().catch(() => ({}))) as {
        referralCode?: string;
        code?: string;
        referredName?: string;
        track?: string;
      };
      const rawCode = cleanStr(body.referralCode || body.code, 40).toUpperCase();
      if (!rawCode) {
        return errorResponse(request, env, 'Referral code is required.', 'INVALID_CODE', 400);
      }

      // Check if user was already referred
      const existingRef = await db
        .prepare('SELECT id FROM referrals WHERE referred_uid = ?1 LIMIT 1')
        .bind(user.uid)
        .first();
      if (existingRef) {
        return jsonResponse(request, env, {
          ok: true,
          alreadyReferred: true,
          referralId: existingRef.id,
        });
      }

      // Look up referrer by crew_referral_code, short_id, or captains.referral_code
      let referrer = await db
        .prepare(
          'SELECT uid, name, display_name, short_id, crew_referral_code FROM users WHERE upper(crew_referral_code) = ?1 OR upper(short_id) = ?1 LIMIT 1'
        )
        .bind(rawCode)
        .first();

      if (!referrer) {
        const cap = await db
          .prepare(
            'SELECT user_id AS uid, name, referral_code AS crew_referral_code FROM captains WHERE upper(referral_code) = ?1 OR upper(captain_code) = ?1 LIMIT 1'
          )
          .bind(rawCode)
          .first();
        if (cap) referrer = cap;
      }

      if (!referrer || referrer.uid === user.uid) {
        return errorResponse(request, env, 'Invalid or self-referral code.', 'INVALID_REFERRAL_CODE', 404);
      }

      const now = Date.now();
      const refId = `ref_${referrer.uid}_${user.uid}`;
      const referredName = cleanStr(body.referredName || user.name, 120, 'Student');
      const track = cleanStr(body.track, 80, 'General Entrance');

      await db.batch([
        db
          .prepare(
            `INSERT OR IGNORE INTO referrals (
              id, referrer_code, referrer_uid, referrer_short_id,
              referred_uid, referred_email, referred_name, track,
              status, activated, bonus_awarded, signed_up_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'activated', 1, 1, ?9)`
          )
          .bind(
            refId,
            rawCode,
            referrer.uid,
            referrer.short_id || null,
            user.uid,
            user.email,
            referredName,
            track,
            now
          ),
        db
          .prepare(
            `UPDATE users SET
              referrer_ambassador_uid = ?1,
              referrer_code = ?2,
              ambassador_bonus_weeks = ambassador_bonus_weeks + 1,
              updated_at = ?3
             WHERE uid = ?4`
          )
          .bind(referrer.uid, rawCode, now, user.uid),
        db
          .prepare(
            `UPDATE users SET
              ambassador_bonus_weeks = ambassador_bonus_weeks + 1,
              kobans = kobans + 50,
              updated_at = ?1
             WHERE uid = ?2`
          )
          .bind(now, referrer.uid),
        db
          .prepare(
            `INSERT INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
             VALUES (?1, 50, '[]', '{}', ?2)
             ON CONFLICT(uid) DO UPDATE SET balance = wallets.balance + 50, updated_at = ?2`
          )
          .bind(referrer.uid, now),
        db
          .prepare(
            `UPDATE captains SET
              points = points + 50,
              activated_referrals = activated_referrals + 1,
              updated_at = ?1
             WHERE user_id = ?2`
          )
          .bind(now, referrer.uid),
        db
          .prepare(
            `INSERT OR IGNORE INTO notifications (
              id, user_id, type, title, message, link, read, is_pinned, created_at
            ) VALUES (?1, ?2, 'referral_reward', 'New Crew Referral Activated!', ?3, '/captain', 0, 0, ?4)`
          )
          .bind(
            `notif_ref_${user.uid}`,
            referrer.uid,
            `${referredName} joined Boardly using your referral code (${rawCode}). +50 Kobans awarded!`,
            now
          ),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        referralId: refId,
        referrerUid: referrer.uid,
        referrerName: referrer.display_name || referrer.name || 'Captain',
      });
    }

    return errorResponse(request, env, 'Referrals endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

import { COSMETICS_CATALOG } from '../../../src/data/cosmeticsCatalog';
import {
  D1Env,
  HttpError,
  authenticateD1Request,
  buildAuditLogStatement,
  checkRateLimitD1,
  cleanStr,
  ensureD1Migration002,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
  parseJsonSafe,
  requireRoleD1,
  rowToUserProfile,
  toMillis,
} from '../_d1Core';
import { computeAndPersistUserStreak } from '../streaks/[[route]]';

/**
 * Helper to build atomic batch statements when a captain is demoted or a crew is disbanded/suspended.
 * Updates `user_roles`, `users`, `captains`, `crews`, and `crew_members` together in one `db.batch(...)`.
 */
function buildCaptainDemoteOrCrewDisableStatements(
  db: any,
  targetCaptainUid: string,
  crewId: string | null,
  crewStatus: 'suspended' | 'disbanded',
  demoteCaptainToStudent: boolean,
  now: number
): any[] {
  const stmts: any[] = [];

  if (demoteCaptainToStudent && targetCaptainUid) {
    stmts.push(
      db
        .prepare(
          "UPDATE user_roles SET role = 'student', updated_at = ?1 WHERE uid = ?2 AND role = 'captain'"
        )
        .bind(now, targetCaptainUid),
      db
        .prepare(
          "UPDATE users SET role = CASE WHEN role = 'captain' THEN 'student' ELSE role END, is_crew_member = 0, crew_status = ?1, updated_at = ?2 WHERE uid = ?3"
        )
        .bind(crewStatus, now, targetCaptainUid),
      db
        .prepare(
          "UPDATE public_profiles SET role = CASE WHEN role = 'captain' THEN 'student' ELSE role END, updated_at = ?1 WHERE uid = ?2"
        )
        .bind(now, targetCaptainUid),
      db
        .prepare("UPDATE captains SET tier = 'Inactive', updated_at = ?1 WHERE user_id = ?2")
        .bind(now, targetCaptainUid)
    );
  }

  if (crewId) {
    stmts.push(
      db
        .prepare('UPDATE crews SET status = ?1, updated_at = ?2 WHERE id = ?3')
        .bind(crewStatus, now, crewId),
      db
        .prepare(
          `UPDATE crew_members SET
            role = CASE WHEN ?1 = 1 AND role = 'captain' THEN 'member' ELSE role END,
            status = ?2,
            updated_at = ?3
           WHERE crew_id = ?4`
        )
        .bind(demoteCaptainToStudent ? 1 : 0, crewStatus === 'disbanded' ? 'removed' : 'suspended', now, crewId)
    );
  } else if (targetCaptainUid) {
    stmts.push(
      db
        .prepare('UPDATE crews SET status = ?1, updated_at = ?2 WHERE captain_uid = ?3')
        .bind(crewStatus, now, targetCaptainUid),
      db
        .prepare(
          `UPDATE crew_members SET
            role = CASE WHEN ?1 = 1 AND role = 'captain' THEN 'member' ELSE role END,
            status = ?2,
            updated_at = ?3
           WHERE crew_id IN (SELECT id FROM crews WHERE captain_uid = ?4)`
        )
        .bind(
          demoteCaptainToStudent ? 1 : 0,
          crewStatus === 'disbanded' ? 'removed' : 'suspended',
          now,
          targetCaptainUid
        )
    );
  }

  return stmts;
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
  const subPath = url.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/+$/, '');
  const segments = subPath ? subPath.split('/').map(decodeURIComponent) : [];
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);
    const user = await authenticateD1Request(request, env, true);
    requireRoleD1(user, ['admin', 'superadmin']);

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const allowed = await checkRateLimitD1(db, `admin_write:${user.uid}`, 120, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
      }
    }

    // ── 1. ROLES (/api/admin/roles) ───────────────────────────────────────────
    if (segments[0] === 'roles' && segments.length === 1) {
      if (method === 'GET') {
        const { results } = await db
          .prepare(
            'SELECT uid, email, role, custom_role, is_posting_banned, updated_at, created_at FROM user_roles ORDER BY updated_at DESC LIMIT 500'
          )
          .all();
        return jsonResponse(request, env, { ok: true, roles: results || [] });
      }

      if (method === 'PUT' || method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const targetUid = cleanStr(body.uid, 128);
        const targetEmail = cleanStr(body.email, 200).toLowerCase();
        const newRole = cleanStr(body.role, 32, 'student') as
          | 'student'
          | 'captain'
          | 'admin'
          | 'superadmin';

        if (!targetUid || !['student', 'captain', 'admin', 'superadmin'].includes(newRole)) {
          return errorResponse(request, env, 'Valid uid and role are required.', 'INVALID_INPUT', 400);
        }
        if (newRole === 'superadmin' && !user.isSuperAdmin) {
          return errorResponse(
            request,
            env,
            'Only a superadmin can grant the superadmin role.',
            'FORBIDDEN',
            403
          );
        }

        const prevRoleRow = await db
          .prepare('SELECT role, email FROM user_roles WHERE uid = ?1 LIMIT 1')
          .bind(targetUid)
          .first();

        const now = Date.now();
        const isPostingBanned =
          body.isPostingBanned !== undefined ? (body.isPostingBanned ? 1 : 0) : null;

        const stmts: any[] = [
          db
            .prepare(
              `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
               VALUES (?1, ?2, ?3, ?4, COALESCE(?5, 0), ?6, ?6)
               ON CONFLICT(uid) DO UPDATE SET
                 email = CASE WHEN ?2 != '' THEN ?2 ELSE user_roles.email END,
                 role = ?3,
                 custom_role = COALESCE(?4, user_roles.custom_role),
                 is_posting_banned = COALESCE(?5, user_roles.is_posting_banned),
                 updated_at = ?6`
            )
            .bind(
              targetUid,
              targetEmail || prevRoleRow?.email || '',
              newRole,
              body.customRole ?? null,
              isPostingBanned,
              now
            ),
          db
            .prepare(
              `UPDATE users SET
                role = ?1,
                custom_role = COALESCE(?2, custom_role),
                is_posting_banned = COALESCE(?3, is_posting_banned),
                updated_at = ?4
               WHERE uid = ?5`
            )
            .bind(newRole, body.customRole ?? null, isPostingBanned, now, targetUid),
          db
            .prepare(
              `UPDATE public_profiles SET
                role = ?1,
                custom_role = COALESCE(?2, custom_role),
                updated_at = ?3
               WHERE uid = ?4`
            )
            .bind(newRole, body.customRole ?? null, now, targetUid),
        ];

        // If demoting a captain to student, atomically suspend their crew and update crew_members
        if (prevRoleRow?.role === 'captain' && newRole === 'student') {
          stmts.push(
            ...buildCaptainDemoteOrCrewDisableStatements(
              db,
              targetUid,
              null,
              'suspended',
              true,
              now
            )
          );
        }

        stmts.push(
          buildAuditLogStatement(
            db,
            user,
            `role_change:${prevRoleRow?.role || 'student'}->${newRole}`,
            targetUid,
            targetEmail || prevRoleRow?.email || null,
            {
              previousRole: prevRoleRow?.role || 'student',
              newRole,
              customRole: body.customRole ?? null,
              isPostingBanned: body.isPostingBanned,
            }
          )
        );

        await db.batch(stmts);
        return jsonResponse(request, env, { ok: true, uid: targetUid, role: newRole });
      }
    }

    // ── 2. DASHBOARD STATS (/api/admin/stats) ─────────────────────────────────
    if (segments[0] === 'stats' && method === 'GET') {
      const [
        usersCnt,
        proCnt,
        captainsCnt,
        crewsCnt,
        questionsCnt,
        practiceCnt,
        capTestsCnt,
        pendingPayCnt,
        pendingCapAppCnt,
        pendingCrewAppCnt,
        pendingKobanCnt,
        pendingNameCnt,
        openQRepCnt,
      ] = await Promise.all([
        db.prepare('SELECT COUNT(*) AS cnt FROM users WHERE deleted = 0').first(),
        db
          .prepare("SELECT COUNT(*) AS cnt FROM users WHERE is_premium = 1 OR plan IN ('pro', 'premium')")
          .first(),
        db.prepare("SELECT COUNT(*) AS cnt FROM user_roles WHERE role = 'captain'").first(),
        db.prepare("SELECT COUNT(*) AS cnt FROM crews WHERE status = 'active'").first(),
        db.prepare('SELECT COUNT(*) AS cnt FROM questions').first().catch(() => ({ cnt: 0 })),
        db.prepare('SELECT COUNT(*) AS cnt FROM practice_attempts').first(),
        db.prepare('SELECT COUNT(*) AS cnt FROM captain_tests').first().catch(() => ({ cnt: 0 })),
        db.prepare("SELECT COUNT(*) AS cnt FROM payment_requests WHERE status = 'pending'").first(),
        db.prepare("SELECT COUNT(*) AS cnt FROM captain_applications WHERE status = 'pending'").first(),
        db.prepare("SELECT COUNT(*) AS cnt FROM crew_applications WHERE status = 'pending'").first(),
        db.prepare("SELECT COUNT(*) AS cnt FROM koban_requests WHERE status = 'pending'").first(),
        db.prepare("SELECT COUNT(*) AS cnt FROM name_requests WHERE status = 'pending'").first(),
        db.prepare("SELECT COUNT(*) AS cnt FROM question_reports WHERE status = 'open'").first(),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        stats: {
          totalUsers: Number(usersCnt?.cnt || 0),
          proUsers: Number(proCnt?.cnt || 0),
          totalCaptains: Number(captainsCnt?.cnt || 0),
          activeCrews: Number(crewsCnt?.cnt || 0),
          totalQuestions: Number(questionsCnt?.cnt || 0),
          totalAttempts: Number(practiceCnt?.cnt || 0) + Number(capTestsCnt?.cnt || 0),
          pendingPayments: Number(pendingPayCnt?.cnt || 0),
          pendingCaptainApps: Number(pendingCapAppCnt?.cnt || 0),
          pendingCrewApps: Number(pendingCrewAppCnt?.cnt || 0),
          pendingKobanRequests: Number(pendingKobanCnt?.cnt || 0),
          pendingNameRequests: Number(pendingNameCnt?.cnt || 0),
          openQuestionReports: Number(openQRepCnt?.cnt || 0),
        },
      });
    }

    // ── 3. USERS MANAGEMENT (/api/admin/users, /api/admin/users/:uid, /api/admin/users/:uid/override) ──
    if (segments[0] === 'users') {
      // GET /api/admin/users
      if (segments.length === 1 && method === 'GET') {
        const q = cleanStr(url.searchParams.get('q') || url.searchParams.get('search'), 100).toLowerCase();
        const roleFilter = cleanStr(url.searchParams.get('role'), 32).toLowerCase();
        const planFilter = cleanStr(url.searchParams.get('plan'), 32).toLowerCase();
        const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit')) || 150));

        const clauses: string[] = [];
        const binds: any[] = [];

        if (q) {
          binds.push(`%${q}%`);
          clauses.push(
            `(lower(u.email) LIKE ?${binds.length} OR lower(u.display_name) LIKE ?${binds.length} OR lower(u.name) LIKE ?${binds.length} OR lower(u.username) LIKE ?${binds.length} OR lower(u.short_id) LIKE ?${binds.length} OR u.uid LIKE ?${binds.length})`
          );
        }
        if (roleFilter && roleFilter !== 'all') {
          binds.push(roleFilter);
          clauses.push(`COALESCE(r.role, u.role) = ?${binds.length}`);
        }
        if (planFilter && planFilter !== 'all') {
          binds.push(planFilter);
          clauses.push(`lower(u.plan) = ?${binds.length}`);
        }

        const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        binds.push(limit);

        const { results } = await db
          .prepare(
            `SELECT u.*, r.role AS d1_role, r.custom_role AS d1_custom_role, r.is_posting_banned AS d1_posting_banned, w.balance AS wallet_balance
             FROM users u
             LEFT JOIN user_roles r ON r.uid = u.uid
             LEFT JOIN wallets w ON w.uid = u.uid
             ${whereSql}
             ORDER BY u.created_at DESC, u.updated_at DESC
             LIMIT ?${binds.length}`
          )
          .bind(...binds)
          .all();

        const usersList = (results || []).map((row: any) => {
          const prof = rowToUserProfile(
            row,
            row.d1_role || row.role,
            row.wallet_balance !== null && row.wallet_balance !== undefined
              ? { balance: row.wallet_balance }
              : null
          );
          prof.isPostingBanned = Boolean(row.d1_posting_banned ?? row.is_posting_banned);
          return prof;
        });

        return jsonResponse(request, env, { ok: true, users: usersList });
      }

      // POST /api/admin/users/delete (Legacy compatibility route for soft-banning / deleting user)
      if (segments[1] === 'delete' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as { targetUid?: string; uid?: string; reason?: string };
        const targetUid = cleanStr(body.targetUid || body.uid, 128);
        if (!targetUid) {
          return errorResponse(request, env, 'Target UID required.', 'INVALID_UID', 400);
        }
        const now = Date.now();
        const stmts = [
          db
            .prepare(
              "UPDATE users SET status = 'banned', suspended = 1, deleted = 1, is_posting_banned = 1, updated_at = ?1 WHERE uid = ?2"
            )
            .bind(now, targetUid),
          db
            .prepare("UPDATE user_roles SET role = 'student', is_posting_banned = 1, updated_at = ?1 WHERE uid = ?2")
            .bind(now, targetUid),
          ...buildCaptainDemoteOrCrewDisableStatements(db, targetUid, null, 'suspended', true, now),
          buildAuditLogStatement(db, user, 'admin_delete_user', targetUid, null, {
            reason: body.reason || 'Admin user deletion',
          }),
        ];
        await db.batch(stmts);
        return jsonResponse(request, env, { ok: true, success: true, uid: targetUid });
      }

      // GET / PUT / DELETE /api/admin/users/:uid or POST /api/admin/users/:uid/override
      if (segments.length >= 2 && segments[1] !== 'delete') {
        const targetUid = cleanStr(segments[1], 128);
        const subAction = segments[2] || '';

        if (!subAction && method === 'GET') {
          const [uRow, rRow, wRow, attemptsRes] = await Promise.all([
            db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
            db.prepare('SELECT * FROM user_roles WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
            db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
            db
              .prepare('SELECT * FROM practice_attempts WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 25')
              .bind(targetUid)
              .all(),
          ]);

          if (!uRow && !rRow) {
            return errorResponse(request, env, 'User not found.', 'NOT_FOUND', 404);
          }

          const profile = rowToUserProfile(
            uRow || { uid: targetUid, email: rRow?.email || '' },
            rRow?.role || uRow?.role || 'student',
            wRow
          );
          return jsonResponse(request, env, {
            ok: true,
            user: profile,
            attempts: attemptsRes?.results || [],
          });
        }

        if (
          (!subAction && (method === 'PUT' || method === 'PATCH' || method === 'POST')) ||
          (subAction === 'override' && method === 'POST')
        ) {
          const body = (await request.json().catch(() => ({}))) as Record<string, any>;
          const [uRow, rRow, wRow] = await Promise.all([
            db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
            db.prepare('SELECT * FROM user_roles WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
            db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
          ]);

          const prevRole = rRow?.role || uRow?.role || 'student';
          const nextRole = cleanStr(body.role ?? prevRole, 32, 'student') as
            | 'student'
            | 'captain'
            | 'admin'
            | 'superadmin';

          if (nextRole === 'superadmin' && !user.isSuperAdmin) {
            return errorResponse(
              request,
              env,
              'Only a superadmin can grant superadmin role.',
              'FORBIDDEN',
              403
            );
          }

          const now = Date.now();
          const nextPlan = cleanStr(body.plan ?? uRow?.plan, 32, 'free');
          const nextIsPremium =
            body.isPremium !== undefined
              ? body.isPremium
                ? 1
                : 0
              : nextPlan === 'pro' || nextPlan === 'premium'
              ? 1
              : Number(uRow?.is_premium || 0);
          const nextStatus = cleanStr(body.status ?? uRow?.status, 32, 'active');
          const nextSuspended =
            body.suspended !== undefined
              ? body.suspended
                ? 1
                : 0
              : nextStatus === 'suspended' || nextStatus === 'banned'
              ? 1
              : Number(uRow?.suspended || 0);
          const nextPostingBanned =
            body.isPostingBanned !== undefined
              ? body.isPostingBanned
                ? 1
                : 0
              : Number(rRow?.is_posting_banned ?? uRow?.is_posting_banned ?? 0);
          const nextCustomRole =
            body.customRole !== undefined
              ? cleanStr(body.customRole, 80) || null
              : rRow?.custom_role ?? uRow?.custom_role ?? null;
          const nextDisplayName = cleanStr(
            body.displayName ?? body.name ?? uRow?.display_name ?? uRow?.name,
            120,
            'Student'
          );
          const nextTrack =
            body.academicTrack !== undefined
              ? cleanStr(body.academicTrack, 120) || null
              : uRow?.academic_track ?? null;
          const nextTargetExam =
            body.targetExam !== undefined
              ? cleanStr(body.targetExam, 120) || null
              : uRow?.target_exam ?? null;
          const nextUniversity =
            body.university !== undefined
              ? cleanStr(body.university, 160) || null
              : uRow?.university ?? null;
          const nextStreak =
            body.streak !== undefined ? Math.max(0, Number(body.streak)) : Number(uRow?.streak ?? 0);
          const nextKobans =
            body.kobans !== undefined
              ? Math.max(0, Math.floor(Number(body.kobans)))
              : Math.max(0, Number(wRow?.balance ?? uRow?.kobans ?? 0));

          const stmts: any[] = [
            db
              .prepare(
                `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
                 ON CONFLICT(uid) DO UPDATE SET
                   role = ?3,
                   custom_role = ?4,
                   is_posting_banned = ?5,
                   updated_at = ?6`
              )
              .bind(
                targetUid,
                uRow?.email || rRow?.email || '',
                nextRole,
                nextCustomRole,
                nextPostingBanned,
                now
              ),
            db
              .prepare(
                `UPDATE users SET
                  display_name = ?1,
                  name = ?1,
                  role = ?2,
                  custom_role = ?3,
                  plan = ?4,
                  is_premium = ?5,
                  status = ?6,
                  suspended = ?7,
                  is_posting_banned = ?8,
                  academic_track = ?9,
                  target_exam = ?10,
                  university = ?11,
                  streak = ?12,
                  kobans = ?13,
                  updated_at = ?14
                 WHERE uid = ?15`
              )
              .bind(
                nextDisplayName,
                nextRole,
                nextCustomRole,
                nextPlan,
                nextIsPremium,
                nextStatus,
                nextSuspended,
                nextPostingBanned,
                nextTrack,
                nextTargetExam,
                nextUniversity,
                nextStreak,
                nextKobans,
                now,
                targetUid
              ),
            db
              .prepare(
                `UPDATE public_profiles SET
                  display_name = ?1,
                  role = ?2,
                  custom_role = ?3,
                  streak = ?4,
                  updated_at = ?5
                 WHERE uid = ?6`
              )
              .bind(nextDisplayName, nextRole, nextCustomRole, nextStreak, now, targetUid),
          ];

          if (body.kobans !== undefined) {
            stmts.push(
              db
                .prepare(
                  `INSERT INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
                   VALUES (?1, ?2, '[]', '{}', ?3)
                   ON CONFLICT(uid) DO UPDATE SET balance = ?2, updated_at = ?3`
                )
                .bind(targetUid, nextKobans, now)
            );
          }

          if (body.resetDailyLimits) {
            stmts.push(
              db.prepare('UPDATE user_daily_usage SET tests_started = 0, practice_attempts = 0, ai_tutor_tokens = 0, updated_at = ?1 WHERE uid = ?2').bind(now, targetUid)
            );
          }

          // If captain was demoted or suspended, update user_roles, crews, and crew_members together
          if (
            (prevRole === 'captain' && nextRole === 'student') ||
            (prevRole === 'captain' && nextSuspended === 1)
          ) {
            stmts.push(
              ...buildCaptainDemoteOrCrewDisableStatements(
                db,
                targetUid,
                null,
                'suspended',
                nextRole === 'student',
                now
              )
            );
          }

          stmts.push(
            buildAuditLogStatement(
              db,
              user,
              'admin_user_override',
              targetUid,
              uRow?.email || rRow?.email || null,
              {
                role: nextRole,
                plan: nextPlan,
                status: nextStatus,
                suspended: Boolean(nextSuspended),
                isPostingBanned: Boolean(nextPostingBanned),
                kobans: nextKobans,
              }
            )
          );

          await db.batch(stmts);

          const [updatedU, updatedW] = await Promise.all([
            db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
            db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
          ]);

          return jsonResponse(request, env, {
            ok: true,
            user: updatedU ? rowToUserProfile(updatedU, nextRole, updatedW) : null,
          });
        }
      }
    }

    // ── 4. CREWS & CAPTAINS ADMIN (/api/admin/crews, /api/admin/captains/:uid/demote) ──
    if (segments[0] === 'crews') {
      if (segments.length === 1 && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM crews ORDER BY created_at DESC LIMIT 200')
          .all();
        return jsonResponse(request, env, { ok: true, crews: results || [] });
      }

      if (segments.length === 3 && segments[2] === 'status' && method === 'POST') {
        const crewId = cleanStr(segments[1], 128);
        const body = (await request.json().catch(() => ({}))) as {
          status?: 'active' | 'suspended' | 'disbanded';
          demoteCaptain?: boolean;
        };
        const crewRow = await db.prepare('SELECT * FROM crews WHERE id = ?1 LIMIT 1').bind(crewId).first();
        if (!crewRow) {
          return errorResponse(request, env, 'Crew not found.', 'NOT_FOUND', 404);
        }

        const nextStatus =
          body.status === 'active' || body.status === 'suspended' || body.status === 'disbanded'
            ? body.status
            : crewRow.status === 'active'
            ? 'suspended'
            : 'active';

        const now = Date.now();
        const stmts: any[] = [];

        if (nextStatus === 'suspended' || nextStatus === 'disbanded') {
          stmts.push(
            ...buildCaptainDemoteOrCrewDisableStatements(
              db,
              String(crewRow.captain_uid),
              crewId,
              nextStatus,
              Boolean(body.demoteCaptain || nextStatus === 'disbanded'),
              now
            )
          );
        } else {
          stmts.push(
            db.prepare("UPDATE crews SET status = 'active', updated_at = ?1 WHERE id = ?2").bind(now, crewId),
            db
              .prepare("UPDATE crew_members SET status = 'active', updated_at = ?1 WHERE crew_id = ?2")
              .bind(now, crewId)
          );
        }

        stmts.push(
          buildAuditLogStatement(
            db,
            user,
            `crew_status:${nextStatus}`,
            String(crewRow.captain_uid),
            crewRow.captain_email || null,
            { crewId, crewName: crewRow.name, nextStatus, demoteCaptain: body.demoteCaptain }
          )
        );

        await db.batch(stmts);
        return jsonResponse(request, env, { ok: true, id: crewId, status: nextStatus });
      }
    }

    if (segments[0] === 'captains' && segments.length === 3 && segments[2] === 'demote' && method === 'POST') {
      const targetUid = cleanStr(segments[1], 128);
      const now = Date.now();
      const stmts = [
        ...buildCaptainDemoteOrCrewDisableStatements(db, targetUid, null, 'suspended', true, now),
        buildAuditLogStatement(db, user, 'demote_captain', targetUid, null, {
          demotedTo: 'student',
          crewsSuspended: true,
        }),
      ];
      await db.batch(stmts);
      return jsonResponse(request, env, { ok: true, uid: targetUid, role: 'student' });
    }

    // ── 5. KOBANS & COUPONS ECONOMY (/api/admin/kobans/*, /api/admin/coupons/*) ──
    if (segments[0] === 'kobans') {
      if (segments[1] === 'stats' && method === 'GET') {
        const [sumRow, countRow, ledgerCnt, reqCnt, cpnCnt] = await Promise.all([
          db.prepare('SELECT SUM(balance) AS total_bal FROM wallets').first(),
          db.prepare('SELECT COUNT(*) AS cnt FROM wallets WHERE balance > 0').first(),
          db.prepare('SELECT COUNT(*) AS cnt FROM wallet_ledger').first(),
          db.prepare("SELECT COUNT(*) AS cnt FROM koban_requests WHERE status = 'pending'").first(),
          db.prepare('SELECT COUNT(*) AS cnt FROM coupons WHERE active = 1').first(),
        ]);

        return jsonResponse(request, env, {
          ok: true,
          stats: {
            totalCirculation: Number(sumRow?.total_bal || 0),
            walletsWithBalance: Number(countRow?.cnt || 0),
            totalTransactions: Number(ledgerCnt?.cnt || 0),
            pendingRequestsCount: Number(reqCnt?.cnt || 0),
            activeCouponsCount: Number(cpnCnt?.cnt || 0),
          },
        });
      }

      if (segments[1] === 'grant' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          uid?: string;
          uids?: string[];
          email?: string;
          amount?: number;
          reason?: string;
        };
        const rawDelta = Math.floor(Number(body.amount || 0));
        if (!rawDelta || !Number.isFinite(rawDelta)) {
          return errorResponse(request, env, 'A non-zero Koban amount is required.', 'INVALID_AMOUNT', 400);
        }

        const reason = cleanStr(body.reason, 300, rawDelta > 0 ? 'Admin Koban Grant' : 'Admin Koban Deduction');
        let targetUids: string[] = [];

        if (Array.isArray(body.uids) && body.uids.length > 0) {
          targetUids = body.uids.map((u) => cleanStr(u, 128)).filter(Boolean).slice(0, 100);
        } else if (body.uid) {
          targetUids = [cleanStr(body.uid, 128)];
        } else if (body.email) {
          const uByEmail = await db
            .prepare('SELECT uid FROM users WHERE lower(email) = lower(?1) LIMIT 1')
            .bind(cleanStr(body.email, 200))
            .first();
          if (uByEmail?.uid) targetUids = [String(uByEmail.uid)];
        }

        if (targetUids.length === 0) {
          return errorResponse(request, env, 'Target user not found.', 'USER_NOT_FOUND', 404);
        }

        const now = Date.now();
        const stmts: any[] = [];
        const updatedBalances: Record<string, number> = {};

        for (const tUid of targetUids) {
          const [wRow, uRow] = await Promise.all([
            db.prepare('SELECT balance FROM wallets WHERE uid = ?1 LIMIT 1').bind(tUid).first(),
            db.prepare('SELECT kobans, email FROM users WHERE uid = ?1 LIMIT 1').bind(tUid).first(),
          ]);
          const curBal = Math.max(0, Number(wRow?.balance ?? uRow?.kobans ?? 0));
          const newBal = Math.max(0, curBal + rawDelta);
          const actualDelta = newBal - curBal;
          updatedBalances[tUid] = newBal;

          stmts.push(
            db
              .prepare(
                `INSERT INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
                 VALUES (?1, ?2, '[]', '{}', ?3)
                 ON CONFLICT(uid) DO UPDATE SET balance = ?2, updated_at = ?3`
              )
              .bind(tUid, newBal, now),
            db
              .prepare('UPDATE users SET kobans = ?1, updated_at = ?2 WHERE uid = ?3')
              .bind(newBal, now, tUid),
            db
              .prepare(
                `INSERT INTO wallet_ledger (
                  id, uid, type, amount, balance_after, reason, admin_email, created_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
              )
              .bind(
                `led_adm_${now}_${crypto.randomUUID().slice(0, 8)}`,
                tUid,
                actualDelta >= 0 ? 'admin_grant' : 'admin_deduct',
                actualDelta,
                newBal,
                reason,
                user.email,
                now
              ),
            db
              .prepare(
                `INSERT INTO notifications (
                  id, user_id, type, title, message, link, read, is_pinned, created_at
                ) VALUES (?1, ?2, 'koban_update', ?3, ?4, '/dashboard/shop', 0, 0, ?5)`
              )
              .bind(
                `notif_kob_${now}_${crypto.randomUUID().slice(0, 6)}`,
                tUid,
                actualDelta >= 0 ? `You received +${actualDelta} Kobans!` : `${actualDelta} Kobans adjusted`,
                `${reason}. New balance: ${newBal} Kobans.`,
                now
              ),
            buildAuditLogStatement(
              db,
              user,
              actualDelta >= 0 ? 'grant_kobans' : 'deduct_kobans',
              tUid,
              uRow?.email || null,
              { delta: actualDelta, newBalance: newBal, reason }
            )
          );
        }

        await db.batch(stmts);
        return jsonResponse(request, env, {
          ok: true,
          updatedCount: targetUids.length,
          balances: updatedBalances,
          newBalance: updatedBalances[targetUids[0]] ?? 0,
        });
      }

      if (segments[1] === 'requests' && segments.length === 2 && method === 'GET') {
        const status = cleanStr(url.searchParams.get('status'), 32);
        const stmt =
          status && status !== 'all'
            ? db
                .prepare('SELECT * FROM koban_requests WHERE status = ?1 ORDER BY created_at DESC LIMIT 200')
                .bind(status)
            : db.prepare('SELECT * FROM koban_requests ORDER BY created_at DESC LIMIT 200');
        const { results } = await stmt.all();
        return jsonResponse(request, env, { ok: true, requests: results || [] });
      }

      if (
        segments[1] === 'requests' &&
        segments.length === 4 &&
        segments[3] === 'review' &&
        method === 'POST'
      ) {
        const reqId = cleanStr(segments[2], 128);
        const body = (await request.json().catch(() => ({}))) as {
          action?: 'approve' | 'reject';
          grantedAmount?: number;
          rejectionReason?: string;
        };
        const reqRow = await db
          .prepare('SELECT * FROM koban_requests WHERE id = ?1 LIMIT 1')
          .bind(reqId)
          .first();

        if (!reqRow) {
          return errorResponse(request, env, 'Koban request not found.', 'NOT_FOUND', 404);
        }
        if (reqRow.status !== 'pending') {
          return errorResponse(
            request,
            env,
            `Request has already been ${reqRow.status}.`,
            'ALREADY_PROCESSED',
            409
          );
        }

        const now = Date.now();
        const targetUid = String(reqRow.user_id);

        if (body.action === 'reject') {
          const reason = cleanStr(body.rejectionReason, 300, 'Request could not be verified.');
          await db.batch([
            db
              .prepare(
                "UPDATE koban_requests SET status = 'rejected', rejection_reason = ?1, rejected_by = ?2, rejected_at = ?3 WHERE id = ?4"
              )
              .bind(reason, user.email, now, reqId),
            db
              .prepare(
                `INSERT INTO notifications (
                  id, user_id, type, title, message, link, read, is_pinned, created_at
                ) VALUES (?1, ?2, 'koban_rejected', 'Koban Request Update', ?3, '/dashboard/shop', 0, 0, ?4)`
              )
              .bind(
                `notif_kreq_${reqId}`,
                targetUid,
                `Your Koban request was declined: ${reason}`,
                now
              ),
            buildAuditLogStatement(db, user, 'reject_koban_request', targetUid, reqRow.user_email, {
              requestId: reqId,
              reason,
            }),
          ]);
          return jsonResponse(request, env, { ok: true, id: reqId, status: 'rejected' });
        }

        const grantAmt = Math.max(
          1,
          Math.floor(Number(body.grantedAmount ?? reqRow.amount ?? 100))
        );
        const [wRow, uRow] = await Promise.all([
          db.prepare('SELECT balance FROM wallets WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
          db.prepare('SELECT kobans FROM users WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
        ]);
        const curBal = Math.max(0, Number(wRow?.balance ?? uRow?.kobans ?? 0));
        const newBal = curBal + grantAmt;

        await db.batch([
          db
            .prepare(
              "UPDATE koban_requests SET status = 'approved', granted_amount = ?1, approved_by = ?2, approved_at = ?3 WHERE id = ?4"
            )
            .bind(grantAmt, user.email, now, reqId),
          db
            .prepare(
              `INSERT INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
               VALUES (?1, ?2, '[]', '{}', ?3)
               ON CONFLICT(uid) DO UPDATE SET balance = ?2, updated_at = ?3`
            )
            .bind(targetUid, newBal, now),
          db
            .prepare('UPDATE users SET kobans = ?1, updated_at = ?2 WHERE uid = ?3')
            .bind(newBal, now, targetUid),
          db
            .prepare(
              `INSERT INTO wallet_ledger (
                id, uid, type, amount, balance_after, reason, admin_email, created_at
              ) VALUES (?1, ?2, 'request_approved', ?3, ?4, ?5, ?6, ?7)`
            )
            .bind(
              `led_kreq_${reqId}`,
              targetUid,
              grantAmt,
              newBal,
              `Approved Koban request (${reqRow.transaction_id || reqId})`,
              user.email,
              now
            ),
          db
            .prepare(
              `INSERT INTO notifications (
                id, user_id, type, title, message, link, read, is_pinned, created_at
              ) VALUES (?1, ?2, 'koban_approved', 'Kobans Credited!', ?3, '/dashboard/shop', 0, 0, ?4)`
            )
            .bind(
              `notif_kreq_${reqId}`,
              targetUid,
              `Your Koban request was approved! +${grantAmt} Kobans added (Balance: ${newBal}).`,
              now
            ),
          buildAuditLogStatement(db, user, 'approve_koban_request', targetUid, reqRow.user_email, {
            requestId: reqId,
            grantedAmount: grantAmt,
            newBalance: newBal,
          }),
        ]);

        return jsonResponse(request, env, {
          ok: true,
          id: reqId,
          status: 'approved',
          grantedAmount: grantAmt,
          newBalance: newBal,
        });
      }
    }

    if (segments[0] === 'coupons') {
      if (segments.length === 1 && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM coupons ORDER BY created_at DESC LIMIT 200')
          .all();
        const coupons = (results || []).map((c: any) => ({
          code: String(c.code),
          description: String(c.description || ''),
          rewardType: String(c.reward_type || 'kobans'),
          rewardValue: Number(c.reward_value || 0),
          discountPercent: Number(c.discount_percent || 0),
          maxUses: Number(c.max_uses || 0),
          usedCount: Number(c.used_count || 0),
          perUserLimit: Number(c.per_user_limit || 1),
          active: Boolean(c.active ?? 1),
          expiresAt: c.expires_at ? Number(c.expires_at) : null,
          createdBy: c.created_by || undefined,
          createdAt: Number(c.created_at || Date.now()),
        }));
        return jsonResponse(request, env, { ok: true, coupons });
      }

      if (segments.length === 1 && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const code = cleanStr(body.code, 64).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (!code || code.length < 3) {
          return errorResponse(request, env, 'Coupon code must be at least 3 characters.', 'INVALID_CODE', 400);
        }

        const description = cleanStr(body.description, 300, '');
        const rewardType = cleanStr(body.rewardType, 32, 'kobans');
        const rewardValue = Math.max(0, Math.floor(Number(body.rewardValue || 0)));
        const discountPercent = Math.max(0, Math.min(100, Math.floor(Number(body.discountPercent || 0))));
        const maxUses = Math.max(0, Math.floor(Number(body.maxUses || 0)));
        const expiresAt = body.expiresAt ? toMillis(body.expiresAt) : null;
        const now = Date.now();

        await db.batch([
          db
            .prepare(
              `INSERT INTO coupons (
                code, description, reward_type, reward_value, discount_percent,
                max_uses, used_count, per_user_limit, active, expires_at,
                created_by, created_at, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 1, 1, ?7, ?8, ?9, ?9)
              ON CONFLICT(code) DO UPDATE SET
                description = excluded.description,
                reward_type = excluded.reward_type,
                reward_value = excluded.reward_value,
                discount_percent = excluded.discount_percent,
                max_uses = excluded.max_uses,
                active = 1,
                expires_at = excluded.expires_at,
                updated_at = excluded.updated_at`
            )
            .bind(
              code,
              description,
              rewardType,
              rewardValue,
              discountPercent,
              maxUses,
              expiresAt,
              user.email,
              now
            ),
          buildAuditLogStatement(db, user, 'create_or_update_coupon', null, null, {
            code,
            rewardType,
            rewardValue,
            discountPercent,
            maxUses,
          }),
        ]);

        return jsonResponse(request, env, { ok: true, code }, 201);
      }

      if (segments.length === 2 && (method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
        const code = cleanStr(segments[1], 64).toUpperCase();
        const now = Date.now();
        if (method === 'DELETE') {
          await db.batch([
            db.prepare('UPDATE coupons SET active = 0, updated_at = ?1 WHERE code = ?2').bind(now, code),
            buildAuditLogStatement(db, user, 'deactivate_coupon', null, null, { code }),
          ]);
          return jsonResponse(request, env, { ok: true, code, active: false });
        }

        const body = (await request.json().catch(() => ({}))) as { active?: boolean };
        const activeVal = body.active !== undefined ? (body.active ? 1 : 0) : 1;
        await db.batch([
          db
            .prepare('UPDATE coupons SET active = ?1, updated_at = ?2 WHERE code = ?3')
            .bind(activeVal, now, code),
          buildAuditLogStatement(db, user, 'toggle_coupon', null, null, {
            code,
            active: Boolean(activeVal),
          }),
        ]);
        return jsonResponse(request, env, { ok: true, code, active: Boolean(activeVal) });
      }
    }

    // ── 6. SHOP PRICING MANAGEMENT (/api/admin/shop/*) ────────────────────────
    if (segments[0] === 'shop') {
      if (segments[1] === 'price-history' && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM store_price_history ORDER BY created_at DESC LIMIT 50')
          .all();
        const history = (results || []).map((r: any) => ({
          id: String(r.id),
          changedBy: String(r.changed_by || ''),
          timestamp: Number(r.created_at || Date.now()),
          filterSummary: String(r.filter_summary || ''),
          affectedCount: Number(r.affected_count || 0),
          mode: String(r.mode || 'single'),
          changesSample: parseJsonSafe<any[]>(r.changes_sample_json, []),
        }));
        return jsonResponse(request, env, { ok: true, history });
      }

      if (segments[1] === 'items' && segments.length === 3 && (method === 'PUT' || method === 'POST')) {
        const itemId = cleanStr(segments[2], 128);
        const body = (await request.json().catch(() => ({}))) as {
          priceKobans?: number;
          active?: boolean;
          name?: string;
        };
        const newPrice = Math.max(0, Math.floor(Number(body.priceKobans ?? 0)));
        const catalogItem = COSMETICS_CATALOG.find((c) => c.id === itemId);
        const existing = await db
          .prepare('SELECT * FROM store_items WHERE id = ?1 LIMIT 1')
          .bind(itemId)
          .first();

        const oldPrice = Number(existing?.price_kobans ?? catalogItem?.priceKobans ?? 0);
        const itemName = cleanStr(body.name || existing?.name || catalogItem?.name || itemId, 120);
        const category =
          existing?.category ||
          (catalogItem?.type === 'frame'
            ? 'avatar_frame'
            : catalogItem?.type === 'effect'
            ? 'profile_effect'
            : catalogItem?.type || 'avatar');
        const itemType = existing?.type || (catalogItem?.animated ? 'animated' : 'static');
        const active = body.active !== undefined ? (body.active ? 1 : 0) : Number(existing?.active ?? 1);
        const now = Date.now();

        await db.batch([
          db
            .prepare(
              `INSERT INTO store_items (
                id, name, category, type, price_kobans, active, rarity, description, preview_color, updated_by, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                price_kobans = excluded.price_kobans,
                active = excluded.active,
                updated_by = excluded.updated_by,
                updated_at = excluded.updated_at`
            )
            .bind(
              itemId,
              itemName,
              category,
              itemType,
              newPrice,
              active,
              catalogItem?.rarity || 'common',
              catalogItem?.description || '',
              catalogItem?.previewColor || null,
              user.email,
              now
            ),
          db
            .prepare(
              `INSERT INTO store_price_history (
                id, changed_by, filter_summary, affected_count, mode, changes_sample_json, created_at
              ) VALUES (?1, ?2, ?3, 1, 'single_edit', ?4, ?5)`
            )
            .bind(
              `ph_${now}_${crypto.randomUUID().slice(0, 6)}`,
              user.email,
              `Single item edit: ${itemName} (${itemId})`,
              JSON.stringify([{ itemId, itemName, oldPrice, newPrice }]),
              now
            ),
          buildAuditLogStatement(db, user, 'update_store_item_price', null, null, {
            itemId,
            itemName,
            oldPrice,
            newPrice,
          }),
        ]);

        return jsonResponse(request, env, { ok: true, itemId, oldPrice, newPrice });
      }

      if (segments[1] === 'bulk-price' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          updates?: Array<{
            id: string;
            name: string;
            category: string;
            type: string;
            oldPrice: number;
            newPrice: number;
          }>;
          filterSummary?: string;
          mode?: string;
        };
        const updates = Array.isArray(body.updates) ? body.updates.slice(0, 300) : [];
        if (updates.length === 0) {
          return errorResponse(request, env, 'No items provided for bulk price update.', 'EMPTY_UPDATES', 400);
        }

        const now = Date.now();
        const stmts: any[] = [];
        for (const u of updates) {
          const id = cleanStr(u.id, 128);
          if (!id) continue;
          const newPrice = Math.max(0, Math.floor(Number(u.newPrice ?? 0)));
          stmts.push(
            db
              .prepare(
                `INSERT INTO store_items (
                  id, name, category, type, price_kobans, active, updated_by, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?7)
                ON CONFLICT(id) DO UPDATE SET
                  price_kobans = excluded.price_kobans,
                  updated_by = excluded.updated_by,
                  updated_at = excluded.updated_at`
              )
              .bind(
                id,
                cleanStr(u.name || id, 120),
                cleanStr(u.category, 40, 'avatar'),
                cleanStr(u.type, 32, 'static'),
                newPrice,
                user.email,
                now
              )
          );
        }

        stmts.push(
          db
            .prepare(
              `INSERT INTO store_price_history (
                id, changed_by, filter_summary, affected_count, mode, changes_sample_json, created_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
            )
            .bind(
              `ph_${now}_${crypto.randomUUID().slice(0, 6)}`,
              user.email,
              cleanStr(body.filterSummary, 300, 'Bulk price adjustment'),
              updates.length,
              cleanStr(body.mode, 40, 'bulk'),
              JSON.stringify(
                updates.slice(0, 15).map((u) => ({
                  itemId: u.id,
                  itemName: u.name,
                  oldPrice: u.oldPrice,
                  newPrice: u.newPrice,
                }))
              ),
              now
            ),
          buildAuditLogStatement(db, user, 'bulk_update_store_prices', null, null, {
            affectedCount: updates.length,
            filterSummary: body.filterSummary,
            mode: body.mode,
          })
        );

        await db.batch(stmts);
        return jsonResponse(request, env, { ok: true, affectedCount: updates.length });
      }
    }

    // ── 7. APPLICATIONS REVIEW (/api/admin/applications/captain, /api/admin/applications/crew) ──
    if (segments[0] === 'applications') {
      const appType = segments[1]; // 'captain' or 'crew'
      const appId = segments[2];
      const action = segments[3]; // 'review'

      if (appType === 'captain' && !appId && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM captain_applications ORDER BY created_at DESC LIMIT 200')
          .all();
        return jsonResponse(request, env, { ok: true, applications: results || [] });
      }

      if (appType === 'captain' && appId && action === 'review' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          status?: 'approved' | 'rejected';
          rejectionReason?: string;
        };
        const appRow = await db
          .prepare('SELECT * FROM captain_applications WHERE id = ?1 LIMIT 1')
          .bind(appId)
          .first();
        if (!appRow) {
          return errorResponse(request, env, 'Captain application not found.', 'NOT_FOUND', 404);
        }

        const nextStatus = body.status === 'rejected' ? 'rejected' : 'approved';
        const now = Date.now();
        const applicantUid = String(appRow.user_id);

        if (nextStatus === 'rejected') {
          const reason = cleanStr(body.rejectionReason, 300, 'Application did not meet criteria.');
          await db.batch([
            db
              .prepare(
                "UPDATE captain_applications SET status = 'rejected', rejection_reason = ?1, reviewed_by = ?2, reviewed_at = ?3 WHERE id = ?4"
              )
              .bind(reason, user.email, now, appId),
            db
              .prepare(
                `INSERT INTO notifications (
                  id, user_id, type, title, message, link, read, is_pinned, created_at
                ) VALUES (?1, ?2, 'captain_application', 'Captain Application Update', ?3, '/captain/apply', 0, 0, ?4)`
              )
              .bind(`notif_capapp_${appId}`, applicantUid, `Your Captain application was reviewed: ${reason}`, now),
            buildAuditLogStatement(db, user, 'reject_captain_application', applicantUid, appRow.email, {
              applicationId: appId,
              reason,
            }),
          ]);
          return jsonResponse(request, env, { ok: true, id: appId, status: 'rejected' });
        }

        const refCode = `NK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const crewId = `crew_${applicantUid}`;
        const crewName = `${appRow.university || appRow.name || 'Nakama'} Crew`;

        await db.batch([
          db
            .prepare(
              "UPDATE captain_applications SET status = 'approved', approved_by = ?1, approved_at = ?2, reviewed_by = ?1, reviewed_at = ?2 WHERE id = ?3"
            )
            .bind(user.email, now, appId),
          db
            .prepare(
              `INSERT INTO user_roles (uid, email, role, custom_role, is_posting_banned, updated_at, created_at)
               VALUES (?1, ?2, 'captain', 'Nakama Captain', 0, ?3, ?3)
               ON CONFLICT(uid) DO UPDATE SET role = 'captain', custom_role = COALESCE(user_roles.custom_role, 'Nakama Captain'), updated_at = ?3`
            )
            .bind(applicantUid, appRow.email || '', now),
          db
            .prepare(
              `UPDATE users SET
                role = 'captain',
                custom_role = COALESCE(custom_role, 'Nakama Captain'),
                crew_id = COALESCE(crew_id, ?1),
                crew_name = COALESCE(crew_name, ?2),
                is_crew_member = 1,
                crew_status = 'active',
                crew_referral_code = COALESCE(crew_referral_code, ?3),
                updated_at = ?4
               WHERE uid = ?5`
            )
            .bind(crewId, crewName, refCode, now, applicantUid),
          db
            .prepare(
              `UPDATE public_profiles SET
                role = 'captain',
                custom_role = COALESCE(custom_role, 'Nakama Captain'),
                crew_id = COALESCE(crew_id, ?1),
                crew_name = COALESCE(crew_name, ?2),
                updated_at = ?3
               WHERE uid = ?4`
            )
            .bind(crewId, crewName, now, applicantUid),
          db
            .prepare(
              `INSERT INTO captains (
                user_id, name, email, university, city, referral_code, captain_code, points, activated_referrals, tier, created_at, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, 100, 0, 'Silver', ?7, ?7)
              ON CONFLICT(user_id) DO UPDATE SET tier = 'Silver', updated_at = ?7`
            )
            .bind(
              applicantUid,
              appRow.name || 'Captain',
              appRow.email || '',
              appRow.university || '',
              appRow.city || '',
              refCode,
              now
            ),
          db
            .prepare(
              `INSERT OR IGNORE INTO crews (
                id, code, name, description, university, captain_uid, captain_name, captain_email, status, member_count, created_at, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'active', 1, ?9, ?9)`
            )
            .bind(
              crewId,
              refCode,
              crewName,
              `Official study crew led by Captain ${appRow.name}`,
              appRow.university || '',
              applicantUid,
              appRow.name || 'Captain',
              appRow.email || '',
              now
            ),
          db
            .prepare(
              `INSERT OR IGNORE INTO crew_members (
                id, crew_id, user_uid, user_name, user_email, role, status, joined_at, updated_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, 'captain', 'active', ?6, ?6)`
            )
            .bind(
              `cm_${crewId}_${applicantUid}`,
              crewId,
              applicantUid,
              appRow.name || 'Captain',
              appRow.email || '',
              now
            ),
          db
            .prepare(
              `INSERT INTO notifications (
                id, user_id, type, title, message, link, read, is_pinned, created_at
              ) VALUES (?1, ?2, 'captain_approved', 'Welcome Aboard, Nakama Captain!', ?3, '/captain', 0, 1, ?4)`
            )
            .bind(
              `notif_capapp_${appId}`,
              applicantUid,
              `Your Captain application has been approved! Your referral code is ${refCode}.`,
              now
            ),
          buildAuditLogStatement(db, user, 'approve_captain_application', applicantUid, appRow.email, {
            applicationId: appId,
            crewId,
            refCode,
          }),
        ]);

        return jsonResponse(request, env, { ok: true, id: appId, status: 'approved', referralCode: refCode });
      }

      if (appType === 'crew' && !appId && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM crew_applications ORDER BY created_at DESC LIMIT 200')
          .all();
        return jsonResponse(request, env, { ok: true, applications: results || [] });
      }

      if (appType === 'crew' && appId && action === 'review' && method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          status?: 'approved' | 'rejected';
          rejectionReason?: string;
        };
        const appRow = await db
          .prepare('SELECT * FROM crew_applications WHERE id = ?1 LIMIT 1')
          .bind(appId)
          .first();
        if (!appRow) {
          return errorResponse(request, env, 'Crew application not found.', 'NOT_FOUND', 404);
        }

        const nextStatus = body.status === 'rejected' ? 'rejected' : 'approved';
        const now = Date.now();
        const applicantUid = String(appRow.user_id);

        if (nextStatus === 'rejected') {
          const reason = cleanStr(body.rejectionReason, 300, 'Application declined.');
          await db.batch([
            db
              .prepare(
                "UPDATE crew_applications SET status = 'rejected', rejection_reason = ?1, reviewed_by = ?2, reviewed_at = ?3 WHERE id = ?4"
              )
              .bind(reason, user.email, now, appId),
            buildAuditLogStatement(db, user, 'reject_crew_application', applicantUid, appRow.email, {
              applicationId: appId,
              reason,
            }),
          ]);
          return jsonResponse(request, env, { ok: true, id: appId, status: 'rejected' });
        }

        const refCode = `NK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await db.batch([
          db
            .prepare(
              "UPDATE crew_applications SET status = 'approved', approved_by = ?1, approved_at = ?2, reviewed_by = ?1, reviewed_at = ?2 WHERE id = ?3"
            )
            .bind(user.email, now, appId),
          db
            .prepare(
              `UPDATE users SET
                is_crew_member = 1,
                crew_status = 'approved',
                crew_referral_code = COALESCE(crew_referral_code, ?1),
                updated_at = ?2
               WHERE uid = ?3`
            )
            .bind(refCode, now, applicantUid),
          db
            .prepare(
              `INSERT INTO notifications (
                id, user_id, type, title, message, link, read, is_pinned, created_at
              ) VALUES (?1, ?2, 'crew_approved', 'Boardly Crew Application Approved!', ?3, '/crew/dashboard', 0, 0, ?4)`
            )
            .bind(
              `notif_crewapp_${appId}`,
              applicantUid,
              `Your Boardly Crew application has been approved! Your referral code is ${refCode}.`,
              now
            ),
          buildAuditLogStatement(db, user, 'approve_crew_application', applicantUid, appRow.email, {
            applicationId: appId,
            refCode,
          }),
        ]);

        return jsonResponse(request, env, { ok: true, id: appId, status: 'approved', referralCode: refCode });
      }
    }

    // ── 8. PAYMENTS REVIEW (/api/admin/payments, /api/admin/payments/:id/review) ──
    if (segments[0] === 'payments') {
      if (segments.length === 1 && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM payment_requests ORDER BY created_at DESC LIMIT 200')
          .all();
        return jsonResponse(request, env, { ok: true, payments: results || [] });
      }

      if (segments.length === 3 && segments[2] === 'review' && method === 'POST') {
        const payId = cleanStr(segments[1], 128);
        const body = (await request.json().catch(() => ({}))) as {
          status?: 'approved' | 'rejected';
          rejectionReason?: string;
          durationMonths?: number;
        };
        const payRow = await db
          .prepare('SELECT * FROM payment_requests WHERE id = ?1 LIMIT 1')
          .bind(payId)
          .first();
        if (!payRow) {
          return errorResponse(request, env, 'Payment request not found.', 'NOT_FOUND', 404);
        }

        const nextStatus = body.status === 'rejected' ? 'rejected' : 'approved';
        const now = Date.now();
        const targetUid = String(payRow.user_id);

        if (nextStatus === 'rejected') {
          const reason = cleanStr(body.rejectionReason, 300, 'Payment verification failed.');
          await db.batch([
            db
              .prepare(
                "UPDATE payment_requests SET status = 'rejected', rejection_reason = ?1, reviewed_by = ?2, reviewed_at = ?3 WHERE id = ?4"
              )
              .bind(reason, user.email, now, payId),
            db
              .prepare(
                `INSERT INTO notifications (
                  id, user_id, type, title, message, link, read, is_pinned, created_at
                ) VALUES (?1, ?2, 'payment_rejected', 'Payment Verification Update', ?3, '/dashboard/plans', 0, 0, ?4)`
              )
              .bind(`notif_pay_${payId}`, targetUid, `Your payment request could not be verified: ${reason}`, now),
            buildAuditLogStatement(db, user, 'reject_payment_request', targetUid, payRow.user_email, {
              paymentId: payId,
              reason,
            }),
          ]);
          return jsonResponse(request, env, { ok: true, id: payId, status: 'rejected' });
        }

        const months = Math.max(1, Number(body.durationMonths || payRow.duration_months || 1));
        const expiresAt = now + months * 30 * 86400000;

        await db.batch([
          db
            .prepare(
              "UPDATE payment_requests SET status = 'approved', approved_by = ?1, approved_at = ?2, reviewed_by = ?1, reviewed_at = ?2 WHERE id = ?3"
            )
            .bind(user.email, now, payId),
          db
            .prepare(
              "UPDATE users SET plan = 'pro', is_premium = 1, premium_source = 'payment', plan_expires_at = ?1, premium_expires_at = ?1, updated_at = ?2 WHERE uid = ?3"
            )
            .bind(expiresAt, now, targetUid),
          db
            .prepare(
              `INSERT INTO notifications (
                id, user_id, type, title, message, link, read, is_pinned, created_at
              ) VALUES (?1, ?2, 'payment_approved', 'Boardly Pro Activated!', ?3, '/dashboard', 0, 1, ?4)`
            )
            .bind(
              `notif_pay_${payId}`,
              targetUid,
              `Your payment (${payRow.transaction_id}) was verified and Boardly Pro is now active!`,
              now
            ),
          buildAuditLogStatement(db, user, 'approve_payment_request', targetUid, payRow.user_email, {
            paymentId: payId,
            transactionId: payRow.transaction_id,
            months,
            expiresAt,
          }),
        ]);

        return jsonResponse(request, env, { ok: true, id: payId, status: 'approved', expiresAt });
      }
    }

    // ── 9. NAME REQUESTS REVIEW (/api/admin/name-requests, /api/admin/name-requests/:id/review) ──
    if (segments[0] === 'name-requests') {
      if (segments.length === 1 && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM name_requests ORDER BY created_at DESC LIMIT 200')
          .all();
        return jsonResponse(request, env, { ok: true, requests: results || [] });
      }

      if (segments.length === 3 && segments[2] === 'review' && method === 'POST') {
        const reqId = cleanStr(segments[1], 128);
        const body = (await request.json().catch(() => ({}))) as {
          status?: 'approved' | 'rejected';
        };
        const reqRow = await db
          .prepare('SELECT * FROM name_requests WHERE id = ?1 LIMIT 1')
          .bind(reqId)
          .first();
        if (!reqRow) {
          return errorResponse(request, env, 'Name request not found.', 'NOT_FOUND', 404);
        }

        const nextStatus = body.status === 'rejected' ? 'rejected' : 'approved';
        const now = Date.now();
        const targetUid = String(reqRow.uid);
        const requestedName = String(reqRow.requested_name);

        const stmts: any[] = [
          db
            .prepare(
              'UPDATE name_requests SET status = ?1, reviewed_by = ?2, reviewed_at = ?3 WHERE id = ?4'
            )
            .bind(nextStatus, user.email, now, reqId),
          buildAuditLogStatement(db, user, `review_name_request:${nextStatus}`, targetUid, reqRow.user_email, {
            requestId: reqId,
            requestedName,
          }),
        ];

        if (nextStatus === 'approved') {
          stmts.push(
            db
              .prepare('UPDATE users SET name = ?1, display_name = ?1, updated_at = ?2 WHERE uid = ?3')
              .bind(requestedName, now, targetUid),
            db
              .prepare('UPDATE public_profiles SET display_name = ?1, updated_at = ?2 WHERE uid = ?3')
              .bind(requestedName, now, targetUid)
          );
        }

        await db.batch(stmts);
        return jsonResponse(request, env, { ok: true, id: reqId, status: nextStatus });
      }
    }

    // ── 10. REVIEWS & QUESTION REPORTS (/api/admin/reviews/*, /api/admin/question-reports/*) ──
    if (segments[0] === 'reviews') {
      if (segments.length === 1 && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM student_reviews ORDER BY created_at DESC LIMIT 200')
          .all();
        return jsonResponse(request, env, { ok: true, reviews: results || [] });
      }

      if (segments.length === 3 && segments[2] === 'status' && method === 'POST') {
        const revId = cleanStr(segments[1], 128);
        const body = (await request.json().catch(() => ({}))) as { status?: string };
        const nextStatus = cleanStr(body.status, 32, 'approved');
        const now = Date.now();

        await db.batch([
          db
            .prepare(
              'UPDATE student_reviews SET status = ?1, approved_by = ?2, approved_at = ?3, reviewed_by = ?2, reviewed_at = ?3 WHERE id = ?4'
            )
            .bind(nextStatus, user.email, now, revId),
          buildAuditLogStatement(db, user, `review_status:${nextStatus}`, null, null, { reviewId: revId }),
        ]);

        return jsonResponse(request, env, { ok: true, id: revId, status: nextStatus });
      }
    }

    if (segments[0] === 'question-reports') {
      if (segments.length === 1 && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM question_reports ORDER BY created_at DESC LIMIT 200')
          .all();
        return jsonResponse(request, env, { ok: true, reports: results || [] });
      }

      if (segments.length === 3 && segments[2] === 'resolve' && method === 'POST') {
        const repId = cleanStr(segments[1], 128);
        const now = Date.now();
        await db.batch([
          db
            .prepare(
              "UPDATE question_reports SET status = 'resolved', resolved_by = ?1, resolved_at = ?2 WHERE id = ?3"
            )
            .bind(user.email, now, repId),
          buildAuditLogStatement(db, user, 'resolve_question_report', null, null, { reportId: repId }),
        ]);
        return jsonResponse(request, env, { ok: true, id: repId, status: 'resolved' });
      }
    }

    // ── 11. AUDIT LOGS & ANNOUNCEMENTS (/api/admin/audit-logs, /api/admin/announcements) ──
    if (segments[0] === 'audit-logs') {
      if (method === 'GET') {
        const limit = Math.max(1, Math.min(300, Number(url.searchParams.get('limit')) || 100));
        const { results } = await db
          .prepare('SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT ?1')
          .bind(limit)
          .all();

        const logs = (results || []).map((r: any) => ({
          id: String(r.id),
          actorUid: String(r.actor_uid || ''),
          actorEmail: String(r.actor_email || ''),
          adminEmail: String(r.actor_email || ''),
          action: String(r.action || ''),
          targetUid: r.target_uid || undefined,
          targetEmail: r.target_email || undefined,
          details: parseJsonSafe<Record<string, any>>(r.details_json, {}),
          createdAt: Number(r.created_at || Date.now()),
          timestamp: Number(r.created_at || Date.now()),
        }));

        return jsonResponse(request, env, { ok: true, logs });
      }

      if (method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const stmt = buildAuditLogStatement(
          db,
          user,
          cleanStr(body.action, 120, 'admin_action'),
          body.targetUid ? cleanStr(body.targetUid, 128) : null,
          body.targetEmail ? cleanStr(body.targetEmail, 200) : null,
          body.details || {}
        );
        await stmt.run();
        return jsonResponse(request, env, { ok: true }, 201);
      }
    }

    if (segments[0] === 'announcements') {
      if (segments.length === 1 && method === 'GET') {
        const { results } = await db
          .prepare('SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC LIMIT 100')
          .all()
          .catch(() => ({ results: [] }));
        return jsonResponse(request, env, { ok: true, announcements: results || [] });
      }
      if (segments.length === 1 && method === 'POST') {
        requireRoleD1(user, ['superadmin']);
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const title = cleanStr(body.title, 200);
        const message = cleanStr(body.message, 4000);
        if (!title || !message) {
          return errorResponse(request, env, 'Title and message are required.', 'INVALID_INPUT', 400);
        }
        const now = Date.now();
        const id = `ann_${now}_${crypto.randomUUID().slice(0, 6)}`;
        await db.batch([
          db
            .prepare(
              `INSERT INTO announcements (
                id, title, message, is_pinned, author_uid, author_email, author_name, created_at, updated_at
              ) VALUES (?1, ?2, ?3, 0, ?4, ?5, ?6, ?7, ?7)`
            )
            .bind(id, title, message, user.uid, user.email, body.authorName || 'Superadmin', now),
          buildAuditLogStatement(db, user, 'create_announcement', null, null, { id, title }),
        ]);
        return jsonResponse(request, env, { ok: true, id }, 201);
      }
      if (segments.length === 2 && method === 'DELETE') {
        requireRoleD1(user, ['superadmin']);
        const id = cleanStr(segments[1], 128);
        const now = Date.now();
        await db.batch([
          db.prepare('UPDATE announcements SET is_pinned = 0, updated_at = ?1 WHERE id = ?2').bind(now, id),
          buildAuditLogStatement(db, user, 'archive_announcement', null, null, { id }),
        ]);
        return jsonResponse(request, env, { ok: true, id });
      }
    }

    // ── 12. BACKFILL PUBLIC PROFILES & RECALCULATE STREAKS & CAPTAINS REFERRALS ──
    if (segments[0] === 'backfill-public-profiles' && method === 'POST') {
      const { results: allUsers } = await db.prepare('SELECT * FROM users LIMIT 500').all();
      const now = Date.now();
      const stmts: any[] = [];
      for (const u of allUsers || []) {
        stmts.push(
          db
            .prepare(
              `INSERT INTO public_profiles (
                uid, display_name, nickname, username, student_id, short_id, role, custom_role,
                bio, status, accent, avatar, avatar_key, avatar_variant, avatar_url, photo_url,
                banner, frame, nameplate, effect_id, equipped_json, badges_json,
                pinned_badges_json, pinned_stamps_json, crew_id, crew_name,
                streak, longest_streak, mcqs, accuracy, score, tests_completed,
                member_since, last_active_at, updated_at
              ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14,
                ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24,
                ?25, ?26, ?27, ?28, ?29, ?30, ?31, ?32, ?32
              )
              ON CONFLICT(uid) DO UPDATE SET
                display_name = excluded.display_name,
                role = excluded.role,
                streak = excluded.streak,
                longest_streak = excluded.longest_streak,
                mcqs = excluded.mcqs,
                score = excluded.score,
                updated_at = excluded.updated_at`
            )
            .bind(
              u.uid,
              u.display_name || u.name || 'Student',
              u.nickname || null,
              u.username || null,
              u.short_id || '00000',
              u.role || 'student',
              u.custom_role || null,
              u.bio || '',
              u.status || '',
              u.accent || '#E11D48',
              u.avatar || null,
              u.avatar_key || null,
              u.avatar_variant || null,
              u.photo_url || null,
              u.banner || null,
              u.frame || null,
              u.nameplate || null,
              u.effect_id || null,
              u.equipped_json || '{}',
              u.badges_json || '[]',
              u.pinned_badges_json || '[]',
              u.pinned_stamps_json || '[]',
              u.crew_id || null,
              u.crew_name || null,
              Number(u.streak || 0),
              Number(u.longest_streak || 0),
              Number(u.mcqs_solved || u.total_questions_solved || 0),
              Number(u.accuracy || 0),
              Number(u.score || 0),
              Number(u.tests_completed || 0),
              Number(u.created_at || now),
              now
            )
        );
      }
      if (stmts.length > 0) await db.batch(stmts);
      return jsonResponse(request, env, { ok: true, synced: stmts.length, failed: 0 });
    }

    if (segments[0] === 'streaks' && segments[1] === 'recalculate' && method === 'POST') {
      const { results: uRows } = await db.prepare('SELECT uid FROM users LIMIT 200').all();
      let updated = 0;
      for (const r of uRows || []) {
        await computeAndPersistUserStreak(db, String(r.uid));
        updated++;
      }
      return jsonResponse(request, env, { ok: true, updated, totalUsers: updated });
    }

    if (segments[0] === 'captains-referrals' && method === 'GET') {
      const [capRows, refRows, crewRows] = await Promise.all([
        db.prepare('SELECT * FROM captains ORDER BY points DESC LIMIT 200').all(),
        db.prepare('SELECT * FROM referrals ORDER BY signed_up_at DESC LIMIT 300').all(),
        db.prepare('SELECT * FROM crews ORDER BY member_count DESC LIMIT 200').all(),
      ]);
      return jsonResponse(request, env, {
        ok: true,
        captains: capRows?.results || [],
        referrals: refRows?.results || [],
        crews: crewRows?.results || [],
      });
    }

    if (segments[0] === 'health-check' && method === 'GET') {
      const tables = [
        'users',
        'public_profiles',
        'user_roles',
        'wallets',
        'store_items',
        'coupons',
        'koban_requests',
        'payment_requests',
        'practice_attempts',
        'user_daily_usage',
        'user_streaks',
        'referrals',
        'captains',
        'captain_applications',
        'crew_applications',
        'crews',
        'crew_members',
        'captain_tests',
        'questions',
        'posts',
        'notifications',
        'admin_audit_log',
      ];
      const counts: Record<string, number> = {};
      for (const tbl of tables) {
        try {
          const r = await db.prepare(`SELECT COUNT(*) AS cnt FROM ${tbl}`).first();
          counts[tbl] = Number(r?.cnt || 0);
        } catch {
          counts[tbl] = 0;
        }
      }
      return jsonResponse(request, env, {
        ok: true,
        database: 'boardly-posts-db',
        binding: 'DB',
        tableCounts: counts,
        checkedAt: Date.now(),
      });
    }

    // ── 13. ONE-TIME FIRESTORE -> D1 BATCH IMPORTER (POST /api/admin/import-firestore) ──
    if (segments[0] === 'import-firestore' && method === 'POST') {
      requireRoleD1(user, ['superadmin']);

      const body = (await request.json().catch(() => ({}))) as {
        collection?: string;
        documents?: Array<Record<string, any>>;
      };

      const col = cleanStr(body.collection, 80);
      const docs = Array.isArray(body.documents) ? body.documents : [];

      if (!col) {
        return errorResponse(request, env, 'Collection name is required.', 'INVALID_COLLECTION', 400);
      }
      if (docs.length > 50) {
        return errorResponse(
          request,
          env,
          'Maximum 50 documents per batch request.',
          'BATCH_TOO_LARGE',
          400
        );
      }

      const now = Date.now();
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      const stmts: any[] = [];

      for (const docItem of docs) {
        try {
          const id = cleanStr(docItem.id || docItem.uid || docItem.code, 128);
          if (!id) {
            skipped++;
            continue;
          }

          if (col === 'users') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO users (
                    uid, email, name, display_name, nickname, username, short_id,
                    photo_url, avatar, banner, frame, nameplate, effect_id, bio, status,
                    role, custom_role, plan, is_premium, academic_track, university,
                    target_exam, class_level, board, subjects_json, equipped_json,
                    kobans, streak, longest_streak, total_questions_solved, mcqs_solved,
                    score, accuracy, tests_completed, crew_id, crew_name, is_crew_member,
                    crew_referral_code, welcomed, profile_completed, onboarding_completed,
                    created_at, updated_at
                  ) VALUES (
                    ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15,
                    ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28,
                    ?29, ?30, ?30, ?31, ?32, ?33, ?34, ?35, ?36, ?37, 1, ?38, ?39, ?40, ?41
                  )`
                )
                .bind(
                  id,
                  cleanStr(docItem.email, 200),
                  cleanStr(docItem.name || docItem.displayName, 120, 'Student'),
                  cleanStr(docItem.displayName || docItem.name, 120, 'Student'),
                  docItem.nickname || null,
                  docItem.username || null,
                  docItem.shortId || null,
                  docItem.photoURL || docItem.avatarUrl || null,
                  docItem.avatar || null,
                  docItem.banner || null,
                  docItem.frame || null,
                  docItem.nameplate || null,
                  docItem.effectId || null,
                  cleanStr(docItem.bio, 500, ''),
                  cleanStr(docItem.status, 40, 'active'),
                  cleanStr(docItem.role, 32, 'student'),
                  docItem.customRole || null,
                  cleanStr(docItem.plan, 32, 'free'),
                  docItem.isPremium || docItem.plan === 'pro' ? 1 : 0,
                  docItem.academicTrack || null,
                  docItem.university || docItem.targetUniversity || null,
                  docItem.targetExam || null,
                  cleanStr(docItem.class || docItem.classLevel, 32, '12'),
                  cleanStr(docItem.board, 64, 'Federal'),
                  JSON.stringify(Array.isArray(docItem.subjects) ? docItem.subjects : []),
                  JSON.stringify(docItem.equipped && typeof docItem.equipped === 'object' ? docItem.equipped : {}),
                  Number(docItem.kobans || 0),
                  Number(docItem.streak || 0),
                  Number(docItem.longestStreak || docItem.streak || 0),
                  Number(docItem.totalQuestionsSolved || docItem.mcqsSolved || 0),
                  Number(docItem.score || 0),
                  Number(docItem.accuracy || 0),
                  Number(docItem.testsCompleted || 0),
                  docItem.crewId || null,
                  docItem.crewName || null,
                  docItem.isCrewMember ? 1 : 0,
                  docItem.crewReferralCode || null,
                  docItem.profileCompleted ? 1 : 0,
                  docItem.onboardingCompleted ? 1 : 0,
                  toMillis(docItem.createdAt, now),
                  toMillis(docItem.updatedAt, now)
                ),
              db
                .prepare(
                  `INSERT OR IGNORE INTO user_roles (
                    uid, email, role, custom_role, is_posting_banned, updated_at, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
                )
                .bind(
                  id,
                  cleanStr(docItem.email, 200),
                  cleanStr(docItem.role, 32, 'student'),
                  docItem.customRole || null,
                  docItem.isPostingBanned ? 1 : 0,
                  toMillis(docItem.updatedAt, now),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'publicProfiles' || col === 'public_profiles') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO public_profiles (
                    uid, display_name, nickname, username, student_id, short_id, role, custom_role,
                    bio, status, accent, avatar, photo_url, banner, frame, nameplate, effect_id,
                    equipped_json, streak, longest_streak, mcqs, accuracy, score, tests_completed,
                    member_since, last_active_at, updated_at
                  ) VALUES (
                    ?1, ?2, ?3, ?4, ?5, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16,
                    ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?25
                  )`
                )
                .bind(
                  id,
                  cleanStr(docItem.displayName || docItem.name, 120, 'Student'),
                  docItem.nickname || null,
                  docItem.username || null,
                  cleanStr(docItem.shortId || docItem.studentId, 16, '00000'),
                  cleanStr(docItem.role, 32, 'student'),
                  docItem.customRole || null,
                  cleanStr(docItem.bio, 500, ''),
                  cleanStr(docItem.status, 120, ''),
                  cleanStr(docItem.accent, 32, '#E11D48'),
                  docItem.avatar || null,
                  docItem.photoURL || docItem.avatarUrl || null,
                  docItem.banner || null,
                  docItem.frame || null,
                  docItem.nameplate || null,
                  docItem.effectId || null,
                  JSON.stringify(docItem.equipped || {}),
                  Number(docItem.streak ?? docItem.stats?.streak ?? 0),
                  Number(docItem.longestStreak ?? docItem.stats?.longestStreak ?? 0),
                  Number(docItem.mcqs ?? docItem.stats?.mcqs ?? 0),
                  Number(docItem.accuracy ?? docItem.stats?.accuracy ?? 0),
                  Number(docItem.score ?? docItem.stats?.score ?? 0),
                  Number(docItem.testsCompleted ?? docItem.stats?.testsCompleted ?? 0),
                  toMillis(docItem.memberSince || docItem.createdAt, now),
                  toMillis(docItem.updatedAt, now)
                )
            );
            imported++;
          } else if (col === 'usernames') {
            stmts.push(
              db
                .prepare(
                  'INSERT OR IGNORE INTO usernames (username, uid, updated_at) VALUES (?1, ?2, ?3)'
                )
                .bind(
                  id.toLowerCase(),
                  cleanStr(docItem.uid, 128),
                  toMillis(docItem.updatedAt, now)
                )
            );
            imported++;
          } else if (col === 'wallets') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
                   VALUES (?1, ?2, ?3, ?4, ?5)`
                )
                .bind(
                  id,
                  Math.max(0, Number(docItem.balance ?? docItem.kobans ?? 0)),
                  JSON.stringify(Array.isArray(docItem.owned) ? docItem.owned : []),
                  JSON.stringify(docItem.equipped && typeof docItem.equipped === 'object' ? docItem.equipped : {}),
                  toMillis(docItem.updatedAt, now)
                )
            );
            imported++;
          } else if (col === 'store_items' || col === 'storeItems') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO store_items (
                    id, name, category, type, price_kobans, active, rarity, description, updated_by, updated_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
                )
                .bind(
                  id,
                  cleanStr(docItem.name || id, 120),
                  cleanStr(docItem.category, 40, 'avatar'),
                  cleanStr(docItem.type, 32, 'static'),
                  Math.max(0, Math.floor(Number(docItem.priceKobans ?? docItem.price ?? 0))),
                  docItem.active === false ? 0 : 1,
                  cleanStr(docItem.rarity, 32, 'common'),
                  cleanStr(docItem.description, 300, ''),
                  docItem.updatedBy || user.email,
                  toMillis(docItem.updatedAt, now)
                )
            );
            imported++;
          } else if (col === 'coupons') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO coupons (
                    code, description, reward_type, reward_value, discount_percent,
                    max_uses, used_count, active, expires_at, created_by, created_at, updated_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)`
                )
                .bind(
                  id.toUpperCase(),
                  cleanStr(docItem.description, 300, ''),
                  cleanStr(docItem.rewardType, 32, 'kobans'),
                  Number(docItem.rewardValue || 0),
                  Number(docItem.discountPercent || 0),
                  Number(docItem.maxUses || 0),
                  Number(docItem.usedCount || 0),
                  docItem.active === false ? 0 : 1,
                  docItem.expiresAt ? toMillis(docItem.expiresAt) : null,
                  docItem.createdBy || user.email,
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'kobanRequests' || col === 'koban_requests') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO koban_requests (
                    id, user_id, user_email, user_name, amount, pkr_amount,
                    transaction_id, payment_method, note, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
                )
                .bind(
                  id,
                  cleanStr(docItem.userId || docItem.uid, 128),
                  cleanStr(docItem.userEmail || docItem.email, 200),
                  cleanStr(docItem.userName || docItem.name, 120),
                  Number(docItem.amount || 0),
                  Number(docItem.pkrAmount || 0),
                  cleanStr(docItem.transactionId, 120),
                  cleanStr(docItem.paymentMethod, 64),
                  cleanStr(docItem.note, 500),
                  cleanStr(docItem.status, 32, 'pending'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'paymentRequests' || col === 'payment_requests') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO payment_requests (
                    id, user_id, user_email, user_name, plan, crew_id, amount,
                    duration_months, method, transaction_id, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
                )
                .bind(
                  id,
                  cleanStr(docItem.userId || docItem.uid, 128),
                  cleanStr(docItem.userEmail || docItem.email, 200),
                  cleanStr(docItem.userName || docItem.name, 120),
                  cleanStr(docItem.plan, 64, 'pro'),
                  docItem.crewId || null,
                  Number(docItem.amount || 0),
                  Number(docItem.durationMonths || 1),
                  cleanStr(docItem.method || docItem.paymentMethod, 64),
                  cleanStr(docItem.transactionId, 120),
                  cleanStr(docItem.status, 32, 'pending'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'attempts' || col === 'practice_attempts') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO practice_attempts (
                    id, user_id, title, mode, subject, chapter, university, status,
                    questions_json, user_answers_json, score, total_questions,
                    correct_answers, wrong_answers, percentage, time_taken_seconds,
                    created_at, updated_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`
                )
                .bind(
                  id,
                  cleanStr(docItem.userId || docItem.uid, 128),
                  cleanStr(docItem.title, 200, 'Practice Session'),
                  cleanStr(docItem.mode, 40, 'practice'),
                  cleanStr(docItem.subject, 80, 'general'),
                  docItem.chapter || null,
                  docItem.university || null,
                  cleanStr(docItem.status, 32, 'completed'),
                  JSON.stringify(Array.isArray(docItem.questions) ? docItem.questions : []),
                  JSON.stringify(docItem.userAnswers || {}),
                  Number(docItem.score || 0),
                  Number(docItem.totalQuestions || 0),
                  Number(docItem.correctAnswers || 0),
                  Number(docItem.wrongAnswers || 0),
                  Number(docItem.percentage || 0),
                  Number(docItem.timeTakenSeconds || 0),
                  toMillis(docItem.createdAt, now),
                  toMillis(docItem.updatedAt || docItem.submittedAt, now)
                )
            );
            imported++;
          } else if (col === 'streaks' || col === 'user_streaks') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO user_streaks (
                    uid, current_streak, longest_streak, today_active, today_pending,
                    active_days_count, total_sessions, last_active_pkt, updated_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
                )
                .bind(
                  id,
                  Number(docItem.currentStreak || docItem.streak || 0),
                  Number(docItem.longestStreak || 0),
                  docItem.todayActive ? 1 : 0,
                  docItem.todayPending ? 1 : 0,
                  Number(docItem.activeDaysCount || 0),
                  Number(docItem.totalSessions || 0),
                  docItem.lastActivePKT || null,
                  toMillis(docItem.updatedAt, now)
                )
            );
            imported++;
          } else if (col === 'referrals') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO referrals (
                    id, referrer_code, referrer_uid, referred_uid, referred_email,
                    referred_name, track, status, activated, bonus_awarded, signed_up_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10)`
                )
                .bind(
                  id,
                  cleanStr(docItem.referrerCode || docItem.code, 40),
                  cleanStr(docItem.referrerUid || docItem.ambassadorUid, 128),
                  cleanStr(docItem.referredUid || docItem.userId || id, 128),
                  cleanStr(docItem.referredEmail || docItem.email, 200),
                  cleanStr(docItem.referredName || docItem.name, 120, 'Student'),
                  cleanStr(docItem.track, 80, 'General Entrance'),
                  cleanStr(docItem.status, 32, 'activated'),
                  docItem.activated === false ? 0 : 1,
                  toMillis(docItem.signedUpAt || docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'captains') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO captains (
                    user_id, name, email, university, city, referral_code, captain_code,
                    points, activated_referrals, tier, created_at, updated_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
                )
                .bind(
                  cleanStr(docItem.userId || id, 128),
                  cleanStr(docItem.name, 120, 'Captain'),
                  cleanStr(docItem.email, 200),
                  cleanStr(docItem.university, 160),
                  cleanStr(docItem.city, 80),
                  cleanStr(docItem.referralCode || docItem.captainCode, 40),
                  cleanStr(docItem.captainCode || docItem.referralCode, 40),
                  Number(docItem.points || 100),
                  Number(docItem.activatedReferrals || 0),
                  cleanStr(docItem.tier, 32, 'Bronze'),
                  toMillis(docItem.createdAt, now),
                  toMillis(docItem.updatedAt, now)
                )
            );
            imported++;
          } else if (col === 'captainApplications' || col === 'captain_applications') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO captain_applications (
                    id, user_id, name, email, phone, whatsapp, university, city,
                    motivation, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
                )
                .bind(
                  id,
                  cleanStr(docItem.userId || docItem.uid, 128),
                  cleanStr(docItem.name, 120),
                  cleanStr(docItem.email, 200),
                  cleanStr(docItem.phone, 40),
                  docItem.whatsapp || null,
                  cleanStr(docItem.university, 160),
                  cleanStr(docItem.city, 80),
                  cleanStr(docItem.motivation, 2000),
                  cleanStr(docItem.status, 32, 'pending'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'crewApplications' || col === 'applications' || col === 'crew_applications') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO crew_applications (
                    id, user_id, name, email, phone, city, college, why_join, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
                )
                .bind(
                  id,
                  cleanStr(docItem.userId || docItem.uid, 128),
                  cleanStr(docItem.name, 120),
                  cleanStr(docItem.email, 200),
                  cleanStr(docItem.phone, 40),
                  cleanStr(docItem.city, 80),
                  cleanStr(docItem.college || docItem.university, 160),
                  cleanStr(docItem.whyJoin || docItem.motivation, 2000),
                  cleanStr(docItem.status, 32, 'pending'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'crews') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO crews (
                    id, code, name, description, university, captain_uid, captain_name,
                    captain_email, status, member_count, created_at, updated_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
                )
                .bind(
                  id,
                  cleanStr(docItem.code || `NK-${id.slice(0, 6).toUpperCase()}`, 40),
                  cleanStr(docItem.name, 160, 'Crew'),
                  cleanStr(docItem.description, 1000, ''),
                  cleanStr(docItem.university, 160, ''),
                  cleanStr(docItem.captainUid || docItem.ambassadorUid || docItem.ownerId, 128),
                  cleanStr(docItem.captainName || docItem.ambassadorName, 120, 'Captain'),
                  cleanStr(docItem.captainEmail, 200, ''),
                  cleanStr(docItem.status, 32, 'active'),
                  Number(docItem.memberCount || 1),
                  toMillis(docItem.createdAt, now),
                  toMillis(docItem.updatedAt, now)
                )
            );
            imported++;
          } else if (col === 'nameRequests' || col === 'name_requests') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO name_requests (
                    id, uid, requested_name, current_display_name, user_email, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
                )
                .bind(
                  id,
                  cleanStr(docItem.uid || docItem.userId, 128),
                  cleanStr(docItem.requestedName, 80),
                  docItem.currentDisplayName || null,
                  docItem.userEmail || null,
                  cleanStr(docItem.status, 32, 'pending'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'reviews' || col === 'student_reviews') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO student_reviews (
                    id, user_id, user_name, user_email, university, rating, comment, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
                )
                .bind(
                  id,
                  cleanStr(docItem.userId || docItem.uid, 128),
                  cleanStr(docItem.userName || docItem.name, 120, 'Student'),
                  docItem.userEmail || null,
                  docItem.university || null,
                  Number(docItem.rating || 5),
                  cleanStr(docItem.comment, 1500),
                  cleanStr(docItem.status, 32, 'approved'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'questionReports' || col === 'question_reports') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO question_reports (
                    id, question_id, reason, comment, user_id, user_email, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
                )
                .bind(
                  id,
                  cleanStr(docItem.questionId, 128),
                  cleanStr(docItem.reason, 80, 'other'),
                  cleanStr(docItem.comment, 1000, ''),
                  cleanStr(docItem.userId || docItem.uid, 128),
                  docItem.userEmail || null,
                  cleanStr(docItem.status, 32, 'open'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'supportTickets' || col === 'support_tickets') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO support_tickets (
                    id, uid, name, email, category, subject, message, status, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
                )
                .bind(
                  id,
                  docItem.uid || null,
                  cleanStr(docItem.name, 120),
                  cleanStr(docItem.email, 200),
                  cleanStr(docItem.category, 64, 'general'),
                  cleanStr(docItem.subject, 200),
                  cleanStr(docItem.message, 4000),
                  cleanStr(docItem.status, 32, 'open'),
                  toMillis(docItem.createdAt, now)
                )
            );
            imported++;
          } else if (col === 'config' || col === 'app_config') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO app_config (config_key, value_json, updated_by, updated_at)
                   VALUES (?1, ?2, ?3, ?4)`
                )
                .bind(id, JSON.stringify(docItem), user.email, now)
            );
            imported++;
          } else if (col === 'auditLogs' || col === 'admin_audit_log') {
            stmts.push(
              db
                .prepare(
                  `INSERT OR IGNORE INTO admin_audit_log (
                    id, actor_uid, actor_email, action, target_uid, target_email, details_json, created_at
                  ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
                )
                .bind(
                  id,
                  cleanStr(docItem.actorUid || docItem.adminUid || user.uid, 128),
                  cleanStr(docItem.actorEmail || docItem.adminEmail || user.email, 200),
                  cleanStr(docItem.action, 120, 'legacy_audit'),
                  docItem.targetUid || null,
                  docItem.targetEmail || null,
                  JSON.stringify(docItem.details || docItem),
                  toMillis(docItem.createdAt || docItem.timestamp, now)
                )
            );
            imported++;
          } else {
            skipped++;
          }
        } catch {
          failed++;
        }
      }

      if (stmts.length > 0) {
        stmts.push(
          buildAuditLogStatement(db, user, `import_firestore_batch:${col}`, null, null, {
            collection: col,
            batchSize: docs.length,
            imported,
            skipped,
            failed,
          })
        );
        await db.batch(stmts);
      }

      return jsonResponse(request, env, {
        ok: true,
        collection: col,
        imported,
        skipped,
        failed,
      });
    }

    return errorResponse(request, env, `Admin endpoint not found: ${method} /api/admin/${subPath}`, 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

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

function rowToCaptainApp(r: Record<string, any>) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: String(r.name || ''),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    whatsapp: r.whatsapp || undefined,
    university: String(r.university || ''),
    city: String(r.city || ''),
    semester: r.semester || undefined,
    cgpa: r.cgpa || undefined,
    motivation: String(r.motivation || ''),
    experience: r.experience || undefined,
    socialLinks: r.social_links || undefined,
    status: String(r.status || 'pending'),
    rejectionReason: r.rejection_reason || undefined,
    approvedBy: r.approved_by || undefined,
    approvedAt: r.approved_at ? Number(r.approved_at) : undefined,
    reviewedBy: r.reviewed_by || undefined,
    reviewedAt: r.reviewed_at ? Number(r.reviewed_at) : undefined,
    createdAt: Number(r.created_at || Date.now()),
  };
}

function rowToCrewApp(r: Record<string, any>) {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: String(r.name || ''),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    city: String(r.city || ''),
    college: String(r.college || ''),
    targetExam: r.target_exam || undefined,
    promotionPlan: r.promotion_plan || undefined,
    whyJoin: String(r.why_join || ''),
    status: String(r.status || 'pending'),
    rejectionReason: r.rejection_reason || undefined,
    approvedBy: r.approved_by || undefined,
    approvedAt: r.approved_at ? Number(r.approved_at) : undefined,
    reviewedBy: r.reviewed_by || undefined,
    reviewedAt: r.reviewed_at ? Number(r.reviewed_at) : undefined,
    createdAt: Number(r.created_at || Date.now()),
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
  const subPath = url.pathname.replace(/^\/api\/applications\/?/, '').replace(/\/+$/, '');
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);
    const user = await authenticateD1Request(request, env, true);
    if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

    // 1. Captain Applications (/api/applications/captain)
    if (subPath === 'captain') {
      if (method === 'GET') {
        const allFlag = url.searchParams.get('all') === '1' && user.isAdminOrAbove;
        const stmt = allFlag
          ? db.prepare('SELECT * FROM captain_applications ORDER BY created_at DESC LIMIT 200')
          : db
              .prepare('SELECT * FROM captain_applications WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 20')
              .bind(user.uid);
        const { results } = await stmt.all();
        const applications = (results || []).map(rowToCaptainApp);
        return jsonResponse(request, env, {
          ok: true,
          applications,
          application: applications[0] || null,
        });
      }

      if (method === 'POST') {
        const allowed = await checkRateLimitD1(db, `cap_app:${user.uid}`, 5, 60000);
        if (!allowed) {
          return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
        }

        const existingPending = await db
          .prepare("SELECT id FROM captain_applications WHERE user_id = ?1 AND status = 'pending' LIMIT 1")
          .bind(user.uid)
          .first();
        if (existingPending) {
          return errorResponse(
            request,
            env,
            'You already have a pending Captain application under review.',
            'APPLICATION_EXISTS',
            409
          );
        }

        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const name = cleanStr(body.name || user.name, 120);
        const email = cleanStr(body.email || user.email, 200);
        const phone = cleanStr(body.phone || body.whatsapp, 40);
        const whatsapp = cleanStr(body.whatsapp || body.phone, 40) || null;
        const university = cleanStr(body.university || body.college, 160);
        const city = cleanStr(body.city, 80);
        const semester = cleanStr(body.semester, 40) || null;
        const cgpa = cleanStr(body.cgpa, 20) || null;
        const motivation = cleanStr(body.motivation || body.whyJoin, 2000);
        const experience = cleanStr(body.experience || body.promotionPlan, 2000) || null;
        const socialLinks = cleanStr(body.socialLinks, 500) || null;

        if (!name || !university || !motivation) {
          return errorResponse(
            request,
            env,
            'Name, university, and motivation are required.',
            'INVALID_INPUT',
            400
          );
        }

        const id = `cap_app_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const now = Date.now();

        await db
          .prepare(
            `INSERT INTO captain_applications (
              id, user_id, name, email, phone, whatsapp, university, city,
              semester, cgpa, motivation, experience, social_links, status, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'pending', ?14)`
          )
          .bind(
            id,
            user.uid,
            name,
            email,
            phone,
            whatsapp,
            university,
            city,
            semester,
            cgpa,
            motivation,
            experience,
            socialLinks,
            now
          )
          .run();

        const created = await db
          .prepare('SELECT * FROM captain_applications WHERE id = ?1 LIMIT 1')
          .bind(id)
          .first();

        return jsonResponse(
          request,
          env,
          {
            ok: true,
            id,
            application: created ? rowToCaptainApp(created) : null,
          },
          201
        );
      }
    }

    // 2. Crew Applications (/api/applications/crew)
    if (subPath === 'crew') {
      if (method === 'GET') {
        const allFlag = url.searchParams.get('all') === '1' && user.isAdminOrAbove;
        const stmt = allFlag
          ? db.prepare('SELECT * FROM crew_applications ORDER BY created_at DESC LIMIT 200')
          : db
              .prepare('SELECT * FROM crew_applications WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 20')
              .bind(user.uid);
        const { results } = await stmt.all();
        const applications = (results || []).map(rowToCrewApp);
        return jsonResponse(request, env, {
          ok: true,
          applications,
          application: applications[0] || null,
        });
      }

      if (method === 'POST') {
        const allowed = await checkRateLimitD1(db, `crew_app:${user.uid}`, 5, 60000);
        if (!allowed) {
          return errorResponse(request, env, 'Rate limit exceeded.', 'RATE_LIMITED', 429);
        }

        const existingPending = await db
          .prepare("SELECT id FROM crew_applications WHERE user_id = ?1 AND status = 'pending' LIMIT 1")
          .bind(user.uid)
          .first();
        if (existingPending) {
          return errorResponse(
            request,
            env,
            'You already have a pending Crew application under review.',
            'APPLICATION_EXISTS',
            409
          );
        }

        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const name = cleanStr(body.name || user.name, 120);
        const email = cleanStr(body.email || user.email, 200);
        const phone = cleanStr(body.phone || body.whatsapp, 40);
        const city = cleanStr(body.city, 80);
        const college = cleanStr(body.college || body.university, 160);
        const targetExam = cleanStr(body.targetExam, 120) || null;
        const promotionPlan = cleanStr(body.promotionPlan, 2000) || null;
        const whyJoin = cleanStr(body.whyJoin || body.motivation, 2000);

        if (!name || !whyJoin) {
          return errorResponse(request, env, 'Name and reason to join are required.', 'INVALID_INPUT', 400);
        }

        const id = `crew_app_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const now = Date.now();

        await db
          .prepare(
            `INSERT INTO crew_applications (
              id, user_id, name, email, phone, city, college,
              target_exam, promotion_plan, why_join, status, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'pending', ?11)`
          )
          .bind(
            id,
            user.uid,
            name,
            email,
            phone,
            city,
            college,
            targetExam,
            promotionPlan,
            whyJoin,
            now
          )
          .run();

        const created = await db
          .prepare('SELECT * FROM crew_applications WHERE id = ?1 LIMIT 1')
          .bind(id)
          .first();

        return jsonResponse(
          request,
          env,
          {
            ok: true,
            id,
            application: created ? rowToCrewApp(created) : null,
          },
          201
        );
      }
    }

    return errorResponse(request, env, 'Applications endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}

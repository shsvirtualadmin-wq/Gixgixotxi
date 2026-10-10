import { createClient } from "../../_utils/supabaseStub.js";

interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

function getSupabaseAdminClient(env: Record<string, string | undefined>) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
  const serviceKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    "";
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const ADMIN_EMAILS = [
    "shsvirtualadmin@gmail.com",
    "support@boardly.cfd",
  ];
  return ADMIN_EMAILS.includes(normalized);
}

const handleRemoveStudent = async (context: PagesContext) => {
  const { request, env } = context;

  // Enable CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, PATCH, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty or URL params used
    }

    const urlParams = new URL(request.url).searchParams;
    const requesterEmail = body.requesterEmail || urlParams.get("requesterEmail") || "";
    let studentId = (body.studentId || urlParams.get("studentId") || "").trim();
    let studentEmail = (body.studentEmail || urlParams.get("studentEmail") || "").trim().toLowerCase();

    const isAdmin = isAdminEmail(requesterEmail);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: Only administrators can wipe student accounts." }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (!studentId && !studentEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing parameters: studentId or studentEmail is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const db = getSupabaseAdminClient(env);
    const errors: string[] = [];
    const wipedTables: Record<string, boolean> = {};

    if (db) {
      // If one of studentId / studentEmail is missing, resolve the other from students or profiles
      if (!studentEmail && studentId) {
        try {
          const { data: s } = await db.from("students").select("email").eq("id", studentId).maybeSingle();
          if (s?.email) studentEmail = s.email.trim().toLowerCase();
          if (!studentEmail) {
            const { data: p } = await db.from("profiles").select("email").eq("id", studentId).maybeSingle();
            if (p?.email) studentEmail = p.email.trim().toLowerCase();
          }
        } catch {}
      } else if (!studentId && studentEmail) {
        try {
          const { data: s } = await db.from("students").select("id").ilike("email", studentEmail).maybeSingle();
          if (s?.id) studentId = s.id;
          if (!studentId) {
            const { data: p } = await db.from("profiles").select("id").ilike("email", studentEmail).maybeSingle();
            if (p?.id) studentId = p.id;
          }
        } catch {}
      }

      // Step 1: Storage files cleanup
      const safeUserId = (studentId || studentEmail).replace(/[^a-zA-Z0-9_-]/g, "_");
      try {
        if (db.storage) {
          const { data: avatarFiles } = await db.storage.from("avatars").list("avatars");
          if (Array.isArray(avatarFiles) && avatarFiles.length > 0) {
            const matches = avatarFiles
              .filter((f) => f.name.includes(safeUserId) || (studentId && f.name.includes(studentId)))
              .map((f) => `avatars/${f.name}`);
            if (matches.length > 0) {
              await db.storage.from("avatars").remove(matches);
            }
          }
        }
      } catch (stgErr) {
        console.warn("Storage cleanup note:", stgErr);
      }

      // Step 2: Delete from child tables in dependency order (ensures no FK constraint violations)
      const childTasks: Array<{ table: string; field: string; val: string }> = [];

      if (studentId) {
        childTasks.push(
          { table: "test_results", field: "student_id", val: studentId },
          { table: "mcq_attempts", field: "student_id", val: studentId },
          { table: "student_attempted_mcqs", field: "student_id", val: studentId },
          { table: "student_mcq_usage", field: "student_id", val: studentId },
          { table: "mcq_usage", field: "student_id", val: studentId },
          { table: "student_progress", field: "student_id", val: studentId },
          { table: "ai_history", field: "student_id", val: studentId },
          { table: "study_buddy_history", field: "student_id", val: studentId },
          { table: "study_buddy_usage", field: "student_id", val: studentId },
          { table: "student_achievements", field: "student_id", val: studentId },
          { table: "achievements", field: "student_id", val: studentId },
          { table: "payment_requests", field: "student_id", val: studentId },
          { table: "admin_activity_logs", field: "target_student_id", val: studentId }
        );
      }

      if (studentEmail) {
        childTasks.push(
          { table: "test_results", field: "student_email", val: studentEmail },
          { table: "mcq_attempts", field: "student_email", val: studentEmail },
          { table: "student_mcq_usage", field: "email", val: studentEmail },
          { table: "mcq_usage", field: "email", val: studentEmail },
          { table: "study_buddy_usage", field: "email", val: studentEmail },
          { table: "payment_requests", field: "student_email", val: studentEmail },
          { table: "admin_activity_logs", field: "target_student_email", val: studentEmail }
        );
      }

      for (const task of childTasks) {
        try {
          const { error } = await db.from(task.table).delete().eq(task.field, task.val);
          if (error && !error.message?.includes("does not exist")) {
            errors.push(`${task.table}(${task.field}): ${error.message}`);
          } else {
            wipedTables[task.table] = true;
          }
        } catch (tErr: any) {
          console.warn(`Exception deleting from ${task.table}:`, tErr?.message || String(tErr));
        }
      }

      // Step 3: Promo code redemptions cleanup & restore count on promo_codes
      try {
        let promoCodesAffected: string[] = [];
        if (studentId || studentEmail) {
          let q = db.from("promo_redemptions").select("promo_code");
          if (studentId && studentEmail) {
            q = q.or(`student_id.eq.${studentId},student_email.ilike.${studentEmail}`);
          } else if (studentId) {
            q = q.eq("student_id", studentId);
          } else {
            q = q.ilike("student_email", studentEmail);
          }
          const { data: reds } = await q;
          if (Array.isArray(reds) && reds.length > 0) {
            promoCodesAffected = Array.from(
              new Set(reds.map((r: any) => String(r.promo_code || "").trim().toUpperCase()).filter(Boolean))
            );
          }

          if (studentId) {
            await db.from("promo_redemptions").delete().eq("student_id", studentId);
          }
          if (studentEmail) {
            await db.from("promo_redemptions").delete().ilike("student_email", studentEmail);
          }
          wipedTables["promo_redemptions"] = true;

          // Re-sync promo_codes count
          for (const code of promoCodesAffected) {
            const { count } = await db
              .from("promo_redemptions")
              .select("*", { count: "exact", head: true })
              .ilike("promo_code", code);
            const liveCount = count || 0;
            const { data: codeRow } = await db
              .from("promo_codes")
              .select("max_redemptions")
              .ilike("code", code)
              .maybeSingle();
            const maxR = codeRow?.max_redemptions || 1;
            await db
              .from("promo_codes")
              .update({
                redemption_count: liveCount,
                is_active: liveCount < maxR,
                updated_at: new Date().toISOString(),
              })
              .ilike("code", code);
          }
        }
      } catch (pErr) {
        console.warn("Exception during promo_redemptions wipe:", pErr);
      }

      // Step 4: Delete from profiles & students
      if (studentId) {
        try {
          await db.from("profiles").delete().eq("id", studentId);
          await db.from("students").delete().eq("id", studentId);
          wipedTables["profiles"] = true;
          wipedTables["students"] = true;
        } catch (sErr: any) {
          console.error(`Exception deleting student profile by id (${studentId}):`, sErr);
        }
      }

      if (studentEmail) {
        try {
          await db.from("profiles").delete().ilike("email", studentEmail);
          await db.from("students").delete().ilike("email", studentEmail);
          wipedTables["profiles"] = true;
          wipedTables["students"] = true;
        } catch (seErr: any) {
          console.warn(`Exception deleting student profile by email:`, seErr);
        }
      }

      // Step 5: Delete Supabase Auth User record (auth.users)
      let authUserDeleted = false;
      const authAdmin = (db as any).auth?.admin;
      if (authAdmin && typeof authAdmin.deleteUser === "function") {
        // A. Look up user by email in auth.users
        if (studentEmail && typeof authAdmin.listUsers === "function") {
          try {
            const { data: authList, error: listErr } = await authAdmin.listUsers({ page: 1, perPage: 1000 });
            if (!listErr && authList?.users) {
              const matchedAuth = authList.users.find(
                (u: any) => (u.email || "").trim().toLowerCase() === studentEmail.toLowerCase()
              );
              if (matchedAuth?.id) {
                const { error: delAuthErr } = await authAdmin.deleteUser(matchedAuth.id);
                if (!delAuthErr) {
                  authUserDeleted = true;
                } else {
                  console.warn("auth.admin.deleteUser by email error:", delAuthErr.message);
                }
              }
            }
          } catch (listException) {
            console.warn("Exception listing auth users for deletion:", listException);
          }
        }

        // B. If studentId is a UUID and not deleted yet, call deleteUser with studentId directly
        if (!authUserDeleted && studentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
          try {
            const { error: delIdErr } = await authAdmin.deleteUser(studentId);
            if (!delIdErr) {
              authUserDeleted = true;
            }
          } catch (aErr: any) {
            console.warn(`Exception deleting auth user by id:`, aErr?.message || String(aErr));
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Student user and all associated data permanently wiped across entire system.",
          details: {
            studentId,
            studentEmail,
            authUserDeleted,
            wipedTables: Object.keys(wipedTables),
            warnings: errors.length > 0 ? errors : undefined,
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Student account wipe request processed.",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to remove student account" }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestPost = handleRemoveStudent;
export const onRequestDelete = handleRemoveStudent;
export const onRequestPatch = handleRemoveStudent;
export const onRequestPut = handleRemoveStudent;
export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, DELETE, PATCH, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

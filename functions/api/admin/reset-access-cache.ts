import { createClient } from "../../_utils/supabaseStub.js";
import { requireAdmin } from "../../_utils/verifyAdmin.js";

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

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const adminEmail = await requireAdmin(request, env);

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { studentId, studentEmail } = body;
    if (!studentId && !studentEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing parameter: studentId or studentEmail required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database client unavailable." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const nowIso = new Date().toISOString();
    const resetPayload = {
      tests_used_this_month: 0,
      free_tests_used_this_month: 0,
      ai_messages_used_today: 0,
      free_tests_reset_at: nowIso,
      updated_at: nowIso,
    };

    let targetId = studentId;
    let targetEmail = studentEmail;

    if (studentId) {
      const { data: s } = await supabaseAdmin
        .from("students")
        .update(resetPayload)
        .eq("id", studentId)
        .select()
        .maybeSingle();
      if (s?.email) targetEmail = s.email;
      await supabaseAdmin.from("profiles").update(resetPayload).eq("id", studentId);
    }

    if (!targetId && targetEmail) {
      const { data: s } = await supabaseAdmin
        .from("students")
        .update(resetPayload)
        .ilike("email", targetEmail)
        .select()
        .maybeSingle();
      if (s?.id) targetId = s.id;
      await supabaseAdmin.from("profiles").update(resetPayload).ilike("email", targetEmail);
    }

    // Clear usage tracking records in child tables
    if (targetId) {
      try {
        await supabaseAdmin.from("mcq_usage").delete().eq("student_id", targetId);
        await supabaseAdmin.from("study_buddy_usage").delete().eq("student_id", targetId);
      } catch (childErr) {
        console.warn("[reset-access-cache] Child cleanup note:", childErr);
      }
    }

    // Log to admin_audit_log
    try {
      await supabaseAdmin.from("admin_audit_log").insert([
        {
          admin_email: adminEmail,
          action: "RESET_STUDENT_ACCESS_CACHE",
          target_student_id: targetId || null,
          target_student_email: targetEmail || null,
          details: { resetFields: Object.keys(resetPayload), timestamp: nowIso },
          created_at: nowIso,
        },
      ]);
    } catch (auditErr) {
      console.warn("[reset-access-cache] audit log note:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Student access cache, monthly test counts, and AI limits successfully reset.",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

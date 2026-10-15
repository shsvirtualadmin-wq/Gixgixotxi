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

const handleUpdateStudentStatus = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // Verify caller holds a valid Firebase ID token for an admin account
    const adminEmail = await requireAdmin(request, env);

    let body: any = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    const urlParams = new URL(request.url).searchParams;
    const studentId = body.studentId || urlParams.get("studentId") || "";
    const studentEmail = body.studentEmail || urlParams.get("studentEmail") || "";
    const status = body.status || urlParams.get("status") || "";
    const reason = body.reason || "";

    const validStatuses = ["active", "suspended", "deleted"];
    if ((!studentId && !studentEmail) || !status || !validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid parameters: studentId and valid status ('active', 'suspended', 'deleted') are required.",
        }),
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
    const updateData: Record<string, any> = {
      status,
      updated_at: nowIso,
    };

    if (status === "suspended") {
      updateData.suspended = true;
      updateData.is_suspended = true;
    } else if (status === "active") {
      updateData.suspended = false;
      updateData.is_suspended = false;
    } else if (status === "deleted") {
      updateData.is_deleted = true;
      updateData.deleted_at = nowIso;
    }

    // Update in students table
    let updatedProfile: any = null;
    let targetEmail = studentEmail;

    if (studentId) {
      const { data: sRes } = await supabaseAdmin
        .from("students")
        .update(updateData)
        .eq("id", studentId)
        .select()
        .maybeSingle();
      if (sRes) {
        updatedProfile = sRes;
        if (sRes.email) targetEmail = sRes.email;
      }

      // Also mirror update to profiles table
      await supabaseAdmin.from("profiles").update(updateData).eq("id", studentId);
    }

    if (!updatedProfile && targetEmail) {
      const { data: sResByEmail } = await supabaseAdmin
        .from("students")
        .update(updateData)
        .ilike("email", targetEmail)
        .select()
        .maybeSingle();
      if (sResByEmail) updatedProfile = sResByEmail;

      await supabaseAdmin.from("profiles").update(updateData).ilike("email", targetEmail);
    }

    // Log admin action to admin_audit_log table
    try {
      const actionName =
        status === "suspended"
          ? "SUSPEND_STUDENT"
          : status === "active"
          ? "UNSUSPEND_STUDENT"
          : "SOFT_DELETE_STUDENT";

      await supabaseAdmin.from("admin_audit_log").insert([
        {
          admin_email: adminEmail,
          action: actionName,
          target_student_id: studentId || updatedProfile?.id || null,
          target_student_email: targetEmail || updatedProfile?.email || null,
          details: { status, reason, timestamp: nowIso },
          created_at: nowIso,
        },
      ]);
    } catch (auditErr) {
      console.warn("[update-student-status] audit log warning:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Student status successfully updated to ${status}.`,
        status,
        profile: updatedProfile,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[functions/api/admin/update-student-status exception]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to update student status." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestPost = handleUpdateStudentStatus;
export const onRequestPatch = handleUpdateStudentStatus;
export const onRequestPut = handleUpdateStudentStatus;
export const onRequestDelete = handleUpdateStudentStatus;
export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

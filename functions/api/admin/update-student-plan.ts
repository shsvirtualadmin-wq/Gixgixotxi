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
    "Access-Control-Allow-Methods": "POST, PATCH, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // Verify caller holds a valid Firebase ID token for an admin account
    const requestedByEmail = await requireAdmin(request, env);

    let body: any = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    const {
      studentId,
      studentEmail,
      action, // 'extend' | 'cancel' | 'restore' | 'update'
      extendDays,
      subscribedPlans,
      assignedClasses,
      packageName,
      paymentStatus = "Verified & Paid",
      isPro,
      expirationMonths = 12,
      adminNote,
      grade: reqGrade,
      stream: reqStream,
      target_university: reqTargetUni,
    } = body || {};

    if (!studentId && !studentEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request parameters: studentId or studentEmail is required.",
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

    // Fetch existing student record
    let currentStudent: any = null;
    const searchId = studentId && !studentId.includes("@") ? studentId : null;
    const searchEmail = studentEmail || (studentId && studentId.includes("@") ? studentId : null);

    if (searchId) {
      const { data: sById } = await supabaseAdmin.from("students").select("*").eq("id", searchId).maybeSingle();
      if (sById) currentStudent = sById;
      if (!currentStudent) {
        const { data: pById } = await supabaseAdmin.from("profiles").select("*").eq("id", searchId).maybeSingle();
        if (pById) currentStudent = pById;
      }
    }

    if (!currentStudent && searchEmail) {
      const { data: sByEmail } = await supabaseAdmin.from("students").select("*").ilike("email", searchEmail).maybeSingle();
      if (sByEmail) currentStudent = sByEmail;
      if (!currentStudent) {
        const { data: pByEmail } = await supabaseAdmin.from("profiles").select("*").ilike("email", searchEmail).maybeSingle();
        if (pByEmail) currentStudent = pByEmail;
      }
    }

    if (!currentStudent) {
      return new Response(
        JSON.stringify({ success: false, error: "Student record not found." }),
        { status: 404, headers: corsHeaders }
      );
    }

    const targetStudentId = currentStudent.id;
    const targetStudentEmail = currentStudent.email;
    const now = new Date();
    const nowIso = now.toISOString();

    let dbUpdatePayload: Record<string, any> = {
      updated_at: nowIso,
    };
    let auditAction = "UPDATE_STUDENT_PLAN";
    let auditDetails: Record<string, any> = {};

    // Handle Subscription Extension (+N Days)
    if (action === "extend" || (extendDays && Number(extendDays) > 0)) {
      const days = Number(extendDays) || 30;
      let baseTime = now.getTime();
      const existingExpires = currentStudent.access_expires || currentStudent.pro_expires_at;
      if (existingExpires) {
        const parsed = new Date(existingExpires).getTime();
        if (parsed > baseTime) {
          baseTime = parsed;
        }
      }
      const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

      dbUpdatePayload = {
        subscription_tier: "pro",
        plan_tier: "pro",
        is_pro: true,
        package_name: currentStudent.package_name && currentStudent.package_name !== "Free Plan" ? currentStudent.package_name : "Pro Extended",
        access_expires: newExpiry,
        pro_expires_at: newExpiry,
        payment_status: "Verified & Paid",
        status: "active",
        updated_at: nowIso,
      };

      auditAction = "EXTEND_SUBSCRIPTION";
      auditDetails = { daysAdded: days, newExpiry, previousExpiry: existingExpires };
    }
    // Handle Subscription Cancellation / Removal
    else if (action === "cancel" || action === "remove") {
      dbUpdatePayload = {
        subscription_tier: "free",
        plan_tier: "free",
        is_pro: false,
        package_name: "Free Plan",
        subscribed_plans: ["free"],
        access_expires: nowIso,
        pro_expires_at: nowIso,
        plan_status: "cancelled",
        payment_status: "Free Plan",
        updated_at: nowIso,
      };

      auditAction = "CANCEL_SUBSCRIPTION";
      auditDetails = { previousPlan: currentStudent.package_name || currentStudent.subscription_tier };
    }
    // Handle Subscription Restoration
    else if (action === "restore") {
      const restoredExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      dbUpdatePayload = {
        subscription_tier: "pro",
        plan_tier: "pro",
        is_pro: true,
        package_name: packageName || "Pro Restored",
        subscribed_plans: ["pro"],
        access_expires: restoredExpiry,
        pro_expires_at: restoredExpiry,
        plan_status: "verified_pro",
        payment_status: "Verified & Paid",
        status: "active",
        updated_at: nowIso,
      };

      auditAction = "RESTORE_SUBSCRIPTION";
      auditDetails = { restoredExpiry, plan: dbUpdatePayload.package_name };
    }
    // Standard Plan Override
    else {
      const finalIsPro = typeof isPro === "boolean" ? isPro : packageName !== "Free Plan";
      const expMonths = Number(expirationMonths) || 12;
      const accessExpiresStr = finalIsPro
        ? new Date(Date.now() + expMonths * 30 * 24 * 3600 * 1000).toISOString()
        : nowIso;

      dbUpdatePayload = {
        subscription_tier: finalIsPro ? "pro" : "free",
        plan_tier: finalIsPro ? "pro" : "free",
        pro_expires_at: finalIsPro ? accessExpiresStr : null,
        access_expires: accessExpiresStr,
        is_pro: finalIsPro,
        package_name: packageName || (finalIsPro ? "Pro Plan" : "Free Plan"),
        payment_status: finalIsPro ? paymentStatus : "Free Plan",
        plan_status: finalIsPro ? "verified_pro" : "trial",
        requires_payment: !finalIsPro,
        status: "active",
        updated_at: nowIso,
      };

      if (subscribedPlans) dbUpdatePayload.subscribed_plans = subscribedPlans;
      if (assignedClasses) dbUpdatePayload.assigned_classes = assignedClasses;
      if (reqGrade) dbUpdatePayload.grade = reqGrade;
      if (reqStream) dbUpdatePayload.stream = reqStream;
      if (reqTargetUni) dbUpdatePayload.target_university = reqTargetUni;

      auditAction = "UPDATE_STUDENT_PLAN";
      auditDetails = {
        newPlan: dbUpdatePayload.package_name,
        isPro: finalIsPro,
        accessExpires: accessExpiresStr,
        note: adminNote,
      };
    }

    // Persist to students table
    const { data: updatedData, error: updateErr } = await supabaseAdmin
      .from("students")
      .update(dbUpdatePayload)
      .eq("id", targetStudentId)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("[update-student-plan] Update error:", updateErr);
      return new Response(
        JSON.stringify({ success: false, error: updateErr.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Mirror to profiles table
    try {
      await supabaseAdmin.from("profiles").update(dbUpdatePayload).eq("id", targetStudentId);
    } catch (profErr) {
      console.warn("[update-student-plan] Mirroring to profiles failed:", profErr);
    }

    // Log to admin_audit_log table
    try {
      await supabaseAdmin.from("admin_audit_log").insert([
        {
          admin_email: requestedByEmail,
          action: auditAction,
          target_student_id: targetStudentId,
          target_student_email: targetStudentEmail,
          details: auditDetails,
          created_at: nowIso,
        },
      ]);
    } catch (auditErr) {
      console.warn("[update-student-plan] audit log insert skipped:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Plan update successfully executed for ${currentStudent.name || currentStudent.email}!`,
        profile: updatedData || { ...currentStudent, ...dbUpdatePayload },
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

export const onRequestPatch = onRequestPost;
export const onRequestPut = onRequestPost;

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, PATCH, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

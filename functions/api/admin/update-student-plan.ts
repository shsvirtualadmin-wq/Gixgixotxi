import { createClient } from "../../_utils/supabaseStub.js";

interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

function getSupabaseAdminClient(env: Record<string, string | undefined>) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const ADMIN_EMAILS = [
  "shsvirtualadmin@gmail.com",
  "dj.khadijajameel19@gmail.com",
  "syedrayyanf1@gmail.com",
];

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized);
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
      subscribedPlans,
      assignedClasses,
      packageName,
      paymentStatus = "Verified & Paid",
      isPro,
      expirationMonths = 12,
      adminNote,
      adminEmail,
      grade: reqGrade,
      stream: reqStream,
      target_university: reqTargetUni,
      dream_university: reqDreamUni,
    } = body || {};

    const requestedByEmail = (adminEmail || "").trim().toLowerCase();
    const isAdmin = isAdminEmail(requestedByEmail);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Forbidden: Manual plan changes are strictly restricted to authorized administrators.",
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    if ((!studentId && !studentEmail) || !Array.isArray(subscribedPlans) || !packageName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request parameters. Required: studentId or studentEmail, subscribedPlans (array), packageName.",
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
    }

    if (!currentStudent && searchEmail) {
      const { data: sByEmail } = await supabaseAdmin.from("students").select("*").eq("email", searchEmail).maybeSingle();
      if (sByEmail) currentStudent = sByEmail;
    }

    if (!currentStudent) {
      return new Response(
        JSON.stringify({ success: false, error: "Student record not found." }),
        { status: 404, headers: corsHeaders }
      );
    }

    const oldPlan = currentStudent.package_name || (currentStudent.subscribed_plans && currentStudent.subscribed_plans.join(", ")) || "Free Plan";

    const isFree = (subscribedPlans.includes("free") && subscribedPlans.length === 1) || isPro === false;
    const finalIsPro = typeof isPro === "boolean" ? isPro : !isFree;
    const finalPaymentStatus = finalIsPro ? "Verified & Paid" : "Free Plan";
    const finalRequiresPayment = !finalIsPro;
    const finalPlanStatus = finalIsPro ? "verified_pro" : "trial";

    const expMonths = Number(expirationMonths) || 12;
    const accessExpiresStr = finalIsPro
      ? new Date(Date.now() + expMonths * 30 * 24 * 3600 * 1000).toISOString()
      : new Date().toISOString();

    // Deduce grade, stream, and target university atomically
    let finalGrade = (reqGrade || "").trim();
    let finalStream = (reqStream || "").trim();
    let finalTargetUni = (reqTargetUni || reqDreamUni || "").trim();

    const topClassRaw = Array.isArray(assignedClasses) && assignedClasses.length > 0 ? String(assignedClasses[0]).trim() : "";
    const topClassUpper = topClassRaw.toUpperCase();

    if (!finalStream) {
      if (topClassUpper.includes("FAST")) finalStream = "CS & Engineering Stream";
      else if (topClassUpper.includes("PRE-ENGINEERING") || topClassUpper.includes("ENGINEERING")) finalStream = "Pre-Engineering Stream";
      else if (topClassUpper.includes("PRE-MEDICAL") || topClassUpper.includes("MEDICAL")) finalStream = "Pre-Medical Stream";
      else if (topClassUpper.includes("ICS") || topClassUpper.includes("COMPUTER")) finalStream = "ICS Stream";
    }

    if (!finalGrade) {
      if (topClassUpper.includes("NET") || topClassUpper.includes("NUST")) finalGrade = "NET";
      else if (topClassUpper.includes("MDCAT")) finalGrade = "MDCAT";
      else if (topClassUpper.includes("TCAT")) finalGrade = "TCAT";
      else if (topClassUpper.includes("FAST")) finalGrade = "FAST";
      else if (topClassUpper.includes("11")) finalGrade = "Class 11";
      else if (topClassUpper.includes("12")) finalGrade = "Class 12";
      else finalGrade = currentStudent.grade || "Class 11";
    }

    if (!finalStream) {
      if (finalGrade === "FAST") finalStream = "CS & Engineering Stream";
      else if (finalGrade === "NET" || finalGrade === "TCAT" || finalGrade === "ECAT") finalStream = "Pre-Engineering Stream";
      else if (finalGrade === "MDCAT" || finalGrade === "NUMS") finalStream = "Pre-Medical Stream";
      else finalStream = currentStudent.stream || "Pre-Engineering Stream";
    }

    if (!finalTargetUni || finalTargetUni === "HEC / Board Standard") {
      const gUpper = (finalGrade || topClassUpper).toUpperCase();
      if (gUpper.includes("FAST")) finalTargetUni = "FAST-NUCES";
      else if (gUpper.includes("NET") || gUpper.includes("NUST")) finalTargetUni = "NUST Islamabad";
      else if (gUpper.includes("MDCAT")) finalTargetUni = "King Edward / UHS / PMDC";
      else if (gUpper.includes("TCAT")) finalTargetUni = "UET Taxila";
      else if (gUpper.includes("ECAT")) finalTargetUni = "UET Lahore";
      else finalTargetUni = currentStudent.target_university || currentStudent.dream_university || "FBISE Board Examinations";
    }

    let finalAssignedClasses: string[] = Array.isArray(assignedClasses) && assignedClasses.length > 0 ? [...assignedClasses] : [];
    if (finalAssignedClasses.length === 0 && finalGrade) {
      finalAssignedClasses = [`${finalGrade}${finalStream ? " • " + finalStream : ""}`];
    }

    const planData = {
      subscription_tier: finalIsPro ? "pro" : "free",
      pro_expires_at: finalIsPro ? accessExpiresStr : null,
      registration_completed: true,
      enrolled_track_id: finalGrade,
      enrolled_stream_id: finalStream,
      enrolled_university_id: finalTargetUni,
      free_tests_used_this_month: finalIsPro ? 0 : Number(currentStudent.free_tests_used_this_month ?? currentStudent.tests_used_this_month ?? 0),
      subscribed_plans: finalIsPro ? subscribedPlans : ["free"],
      is_pro: finalIsPro,
      package_name: finalIsPro ? packageName : "Free Plan",
      payment_status: finalPaymentStatus,
      plan_status: finalPlanStatus,
      requires_payment: finalRequiresPayment,
      access_expires: accessExpiresStr,
      grade: finalGrade,
      stream: finalStream,
      target_university: finalTargetUni,
      dream_university: finalTargetUni,
      assigned_classes: finalAssignedClasses,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    let updatedStudent = { ...currentStudent, ...planData };

    const dbUpdatePayload: any = {
      subscription_tier: finalIsPro ? "pro" : "free",
      pro_expires_at: finalIsPro ? accessExpiresStr : null,
      registration_completed: true,
      enrolled_track_id: finalGrade,
      enrolled_stream_id: finalStream,
      enrolled_university_id: finalTargetUni,
      free_tests_used_this_month: finalIsPro ? 0 : Number(currentStudent.free_tests_used_this_month ?? currentStudent.tests_used_this_month ?? 0),
      subscribed_plans: finalIsPro ? subscribedPlans : ["free"],
      is_pro: finalIsPro,
      plan_tier: finalIsPro ? "pro" : "free",
      package_name: finalIsPro ? packageName : "Free Plan",
      payment_status: finalPaymentStatus,
      plan_status: finalPlanStatus,
      requires_payment: finalRequiresPayment,
      access_expires: accessExpiresStr,
      grade: finalGrade,
      stream: finalStream,
      target_university: finalTargetUni,
      dream_university: finalTargetUni,
      assigned_classes: finalAssignedClasses,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    if (finalIsPro) {
      dbUpdatePayload.tests_used_this_month = 0;
      dbUpdatePayload.ai_messages_used_today = 0;
    }

    const { data: updatedStudentData, error: updateErr } = await supabaseAdmin
      .from("students")
      .update(dbUpdatePayload)
      .eq("id", currentStudent.id)
      .select();

    if (updateErr) {
      console.error("[update-student-plan] Database Update Error:", updateErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: updateErr.message || "Failed to persist plan update in database.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (updatedStudentData && updatedStudentData[0]) {
      updatedStudent = { ...updatedStudentData[0], ...planData, access_expires: accessExpiresStr };
    }

    // Log admin activity
    const logRecord = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      admin_email: requestedByEmail || "shsvirtualadmin@gmail.com",
      target_student_id: currentStudent.id,
      target_student_name: currentStudent.name || "Student",
      target_student_email: currentStudent.email,
      action_type: "manual_plan_change",
      old_plan: oldPlan,
      new_plan: packageName,
      note: adminNote || "Manual subscription plan override by administrator",
      created_at: new Date().toISOString(),
    };

    try {
      await supabaseAdmin.from("admin_activity_logs").insert([logRecord]);
    } catch (logErr) {
      console.warn("Notice: admin_activity_logs insert skipped:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Plan successfully updated to "${packageName}" for ${currentStudent.name || "Student"}!`,
        profile: updatedStudent,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
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

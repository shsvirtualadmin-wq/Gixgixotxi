import { createClient } from "@supabase/supabase-js";

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

function sanitizeGrade(raw: string): string {
  if (!raw) return "11th";
  const u = raw.toString().trim().toUpperCase();
  if (u.includes("MDCAT") || u.includes("MEDICAL ENTRANCE")) return "MDCAT";
  if (u.includes("TCAT") || u.includes("ENGINEERING ENTRANCE")) return "TCAT";
  if (u.includes("9")) return "9th";
  if (u.includes("10")) return "10th";
  if (u.includes("12")) return "12th";
  if (u.includes("11")) return "11th";
  return raw.toString().trim();
}

function sanitizeStream(rawStream: string, rawGrade?: string): string {
  if (!rawStream) return "Pre-Medical Stream";
  const u = rawStream.toString().trim().toUpperCase();
  const normGrade = sanitizeGrade(rawGrade || "");

  if (normGrade === "MDCAT") {
    if (u.includes("PRE-MEDICAL") || u.includes("BIOLOGY")) return "Pre-Medical Stream";
    return "MDCAT Stream";
  }
  if (normGrade === "TCAT") {
    if (u.includes("ICS") || u.includes("COMPUTER")) return "ICS Stream";
    if (u.includes("TCAT")) return "TCAT Stream";
    return "Pre-Engineering Stream";
  }
  if (u.includes("ENGINEERING") || u.includes("PRE-ENG")) return "Pre-Engineering Stream";
  if (u.includes("ICS") || u.includes("COMPUTER") || u.includes("CS")) return "ICS Stream";
  if (u.includes("BIOLOGY")) return "Biology Stream";
  if (u.includes("MEDICAL") || u.includes("PRE-MED")) return "Pre-Medical Stream";
  return rawStream.toString().trim();
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

    console.log("[functions/api/admin/update-student-grade-stream] Payload:", body);

    const {
      studentId,
      studentEmail,
      grade,
      stream,
      subjects = [],
      requesterEmail,
      adminEmail,
    } = body || {};

    const requestedByEmail = (adminEmail || requesterEmail || "").trim().toLowerCase();
    const isAdmin = isAdminEmail(requestedByEmail);

    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Forbidden: Class and Stream updates are strictly restricted to authorized administrators.",
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    if ((!studentId && !studentEmail) || !grade || !stream) {
      console.error("[functions/api/admin/update-student-grade-stream] Missing parameters:", body);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters: studentId or studentEmail, grade, and stream are required.",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanGrade = sanitizeGrade(grade);
    const cleanStream = sanitizeStream(stream, cleanGrade);
    const assignedClassStr = `${cleanGrade} ${cleanStream}`.trim();
    const assigned_classes = [assignedClassStr];

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database client unavailable." }),
        { status: 500, headers: corsHeaders }
      );
    }

    let targetId = studentId;
    let targetEmail = studentEmail;

    if (!targetId && targetEmail) {
      const { data: sRow } = await supabaseAdmin.from("students").select("id").eq("email", targetEmail).maybeSingle();
      if (sRow?.id) targetId = sRow.id;
    }

    let updateRes: any = null;
    if (targetId && !targetId.includes("@")) {
      updateRes = await supabaseAdmin
        .from("students")
        .update({
          grade: cleanGrade,
          stream: cleanStream,
          subjects,
          assigned_classes,
          is_registered: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId)
        .select()
        .maybeSingle();
    }

    if ((!updateRes || updateRes.error || !updateRes.data) && (targetEmail || (studentId && studentId.includes("@")))) {
      const fallbackEmail = targetEmail || studentId;
      updateRes = await supabaseAdmin
        .from("students")
        .update({
          grade: cleanGrade,
          stream: cleanStream,
          subjects,
          assigned_classes,
          is_registered: true,
          updated_at: new Date().toISOString(),
        })
        .eq("email", fallbackEmail)
        .select()
        .maybeSingle();
    }

    if (updateRes && updateRes.error && (updateRes.error.message?.includes("subjects") || updateRes.error.code === 'PGRST204')) {
      console.warn("[functions/api/admin/update-student-grade-stream] Retrying update without subjects...");
      const updatePayload = {
        grade: cleanGrade,
        stream: cleanStream,
        is_registered: true,
        updated_at: new Date().toISOString(),
      };
      if (targetId) {
        updateRes = await supabaseAdmin.from("students").update(updatePayload).eq("id", targetId).select().maybeSingle();
      } else if (targetEmail) {
        updateRes = await supabaseAdmin.from("students").update(updatePayload).eq("email", targetEmail).select().maybeSingle();
      }
    }

    if (updateRes && updateRes.error) {
      console.error("Payload:", body);
      console.error("Database Error:", updateRes.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: updateRes.error.message || "Database rejected grade/stream update.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: updateRes?.data || { id: targetId, email: targetEmail, grade: cleanGrade, stream: cleanStream, subjects },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Payload:", context.request);
    console.error("Database Error / Exception:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Failed to update grade/stream",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

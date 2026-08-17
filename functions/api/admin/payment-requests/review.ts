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

    const { requestId, status, adminNote, reviewerEmail } = body || {};

    if (!requestId || !status || !["approved", "rejected"].includes(status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid parameters. Required: requestId, status ('approved'|'rejected').",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase client configuration missing." }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 1. Fetch payment request
    const { data: requestRow, error: fetchErr } = await supabaseAdmin
      .from("payment_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchErr || !requestRow) {
      console.error("[review.ts] Could not find payment request:", fetchErr);
      return new Response(
        JSON.stringify({ success: false, error: fetchErr?.message || "Payment request record not found." }),
        { status: 404, headers: corsHeaders }
      );
    }

    const reviewer = reviewerEmail || "shsvirtualadmin@gmail.com";
    const reviewedAt = new Date().toISOString();

    // 2. Update payment request record
    const { error: updateReqErr } = await supabaseAdmin
      .from("payment_requests")
      .update({
        status,
        admin_note: adminNote || null,
        reviewed_at: reviewedAt,
        reviewed_by: reviewer,
      })
      .eq("id", requestId);

    if (updateReqErr) {
      console.error("[review.ts] Error updating payment_requests:", updateReqErr);
      return new Response(
        JSON.stringify({ success: false, error: updateReqErr.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 3. If approved, upgrade student in students table
    if (status === "approved") {
      const studentId = requestRow.student_id;
      const studentEmail = requestRow.student_email;

      const updateData: Record<string, any> = {
        payment_status: "Verified & Paid",
        requires_payment: false,
        package_name: requestRow.package_name || "Boardly Premium Access",
        status: "active",
        is_pro: true,
        access_expires: new Date(Date.now() + 365 * 24 * 3600 * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        updated_at: new Date().toISOString(),
      };

      if (studentId) {
        await supabaseAdmin
          .from("students")
          .update(updateData)
          .eq("id", studentId);
      }

      if (studentEmail) {
        await supabaseAdmin
          .from("students")
          .update(updateData)
          .eq("email", studentEmail);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment request successfully ${status}.`,
        requestId,
        status,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[review.ts exception]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error reviewing payment request." }),
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

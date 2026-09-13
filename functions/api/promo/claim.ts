import { createClient } from "@supabase/supabase-js";

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
  return createClient(url, serviceKey);
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    },
  });
};

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
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

    const { code, studentId, studentEmail, studentName } = body;
    const cleanCode = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    if (!cleanCode) {
      return new Response(
        JSON.stringify({ success: false, error: "A valid promo code is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!studentId && !studentEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Student identification (ID or email) is required to claim." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient(env);
    const oneYearDurationMs = 365 * 24 * 60 * 60 * 1000;
    const accessExpiresStr = new Date(Date.now() + oneYearDurationMs).toISOString();

    const planUpdateData = {
      is_pro: true,
      plan_tier: "pro",
      package_name: "⭐ Boardly 1-Year Pro (Promotional Pass)",
      payment_status: "Verified & Paid",
      plan_status: "verified_pro",
      requires_payment: false,
      subscribed_plans: ["boardly_pro", "pro"],
      access_expires: accessExpiresStr,
      tests_used_this_month: 0,
      ai_messages_used_today: 0,
      transaction_reference: `PROMO:${cleanCode}`,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    let studentRecord: any = null;
    if (supabaseAdmin) {
      if (studentId && !studentId.includes("@")) {
        const { data } = await supabaseAdmin.from("students").select("*").eq("id", studentId).maybeSingle();
        if (data) studentRecord = data;
      }
      if (!studentRecord && studentEmail) {
        const { data } = await supabaseAdmin.from("students").select("*").eq("email", studentEmail).maybeSingle();
        if (data) studentRecord = data;
      }

      // Check anti-stacking
      const hasRedeemed = studentRecord && (
        studentRecord.promo_code_redeemed ||
        studentRecord.promo_redeemed_at ||
        (studentRecord.transaction_reference && String(studentRecord.transaction_reference).startsWith("PROMO:"))
      );
      if (hasRedeemed) {
        return new Response(
          JSON.stringify({
            success: false,
            alreadyRedeemed: true,
            error: "This student account has already redeemed a 1-Year Free Pro promo code.",
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Update student record in Supabase
      const finalId = studentRecord?.id || studentId;
      if (finalId) {
        await supabaseAdmin.from("students").update(planUpdateData).eq("id", finalId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "🎉 1 Year of Free Boardly Pro Access Unlocked!",
        code: cleanCode,
        label: "1-Year Free Boardly Pro Campaign",
        grantedUntil: accessExpiresStr,
        profile: {
          ...(studentRecord || {}),
          id: studentRecord?.id || studentId,
          email: studentRecord?.email || studentEmail,
          name: studentRecord?.name || studentName || "Student",
          ...planUpdateData,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to process claim." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

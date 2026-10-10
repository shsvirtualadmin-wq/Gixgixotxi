import { createClient } from "../_utils/supabaseStub.js";

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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const onRequestGet = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const url = new URL(request.url);
    const id = String(url.searchParams.get("id") || "").trim();
    const email = String(url.searchParams.get("email") || "").trim().toLowerCase();

    if (!id && !email) {
      return new Response(JSON.stringify({ error: "Student id or email required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseAdmin = getSupabaseAdminClient(env);
    let studentRecord: any = null;

    if (supabaseAdmin) {
      if (id && !id.includes("@")) {
        const { data } = await supabaseAdmin.from("students").select("*").eq("id", id).maybeSingle();
        if (data) studentRecord = data;
      }
      if (!studentRecord && email) {
        const { data } = await supabaseAdmin.from("students").select("*").eq("email", email).maybeSingle();
        if (data) studentRecord = data;
      }

      // Check promo_redemptions table
      try {
        let redRow: any = null;
        if (id && !id.includes("@")) {
          const { data: r1 } = await supabaseAdmin.from("promo_redemptions").select("*").eq("student_id", id).maybeSingle();
          if (r1) redRow = r1;
        }
        if (!redRow && email) {
          const { data: r2 } = await supabaseAdmin.from("promo_redemptions").select("*").ilike("student_email", email).maybeSingle();
          if (r2) redRow = r2;
        }
        if (redRow && redRow.granted_until && new Date(redRow.granted_until).getTime() > Date.now()) {
          if (!studentRecord) {
            studentRecord = {
              id: id || redRow.student_id,
              email: email || redRow.student_email,
              name: redRow.student_name || "Student",
              grade: "Class 11",
              stream: "Pre-Engineering",
            };
          }
          studentRecord.is_pro = true;
          studentRecord.plan_tier = "pro";
          studentRecord.package_name = "⭐ Boardly 1-Year Pro (Promotional Pass)";
          studentRecord.payment_status = "Verified & Paid";
          studentRecord.plan_status = "verified_pro";
          studentRecord.requires_payment = false;
          studentRecord.access_expires = redRow.granted_until;
          studentRecord.transaction_reference = `PROMO:${redRow.promo_code}`;
          studentRecord.promo_code_redeemed = redRow.promo_code;
          studentRecord.promo_redeemed_at = redRow.redeemed_at;
        }
      } catch {}
    }

    if (!studentRecord) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ profile: studentRecord }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Server error fetching student profile." }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

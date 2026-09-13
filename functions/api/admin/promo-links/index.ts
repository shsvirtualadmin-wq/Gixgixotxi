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

const ADMIN_EMAILS = [
  "shsvirtualadmin@gmail.com",
  "dj.khadijajameel19@gmail.com",
  "syedrayyanf1@gmail.com",
];

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized) ||
    normalized.includes("admin") ||
    normalized.endsWith("@boardly.cfd") ||
    normalized.endsWith("@boardly.com");
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    },
  });
};

export const onRequestGet = async (context: PagesContext) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    "Content-Type": "application/json",
  };

  const adminEmail = url.searchParams.get("adminEmail") || request.headers.get("x-admin-email") || "";
  if (adminEmail && !isAdminEmail(adminEmail)) {
    return new Response(
      JSON.stringify({ success: false, error: "Forbidden: Access restricted to authorized administrators." }),
      { status: 403, headers: corsHeaders }
    );
  }

  const supabaseAdmin = getSupabaseAdminClient(env);
  if (supabaseAdmin) {
    try {
      const { data: dbCodes, error: codesErr } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!codesErr && Array.isArray(dbCodes) && dbCodes.length > 0) {
        // Fetch all redemptions
        let allRedemptions: any[] = [];
        try {
          const { data: rData } = await supabaseAdmin.from("promo_redemptions").select("*");
          if (Array.isArray(rData)) allRedemptions = rData;
        } catch {}

        const mappedLinks = dbCodes.map((c: any) => {
          const codeUpper = (c.code || "").toUpperCase();
          const redemptionsForCode = allRedemptions.filter(
            (r: any) => (r.promo_code || r.code || "").toUpperCase() === codeUpper
          );

          return {
            id: c.id || "promo_" + codeUpper,
            code: codeUpper,
            label: c.label || "1-Year Free Pro Campaign",
            discount_type: c.discount_type || "1_year_free_pro",
            duration_months: c.duration_months || 12,
            max_redemptions: c.max_redemptions,
            redemption_count: c.redemption_count || redemptionsForCode.length || 0,
            is_active: c.is_active !== false,
            created_by: c.created_by || "admin",
            created_at: c.created_at || new Date().toISOString(),
            expires_at: c.expires_at || null,
            redemptions: redemptionsForCode.map((r: any) => ({
              id: r.id,
              student_id: r.student_id || r.user_id,
              student_name: r.student_name || "Student",
              student_email: r.student_email || r.email,
              redeemed_at: r.redeemed_at || r.created_at,
              granted_until: r.granted_until || r.expires_at,
              track: r.track || "General Track",
            })),
          };
        });

        return new Response(JSON.stringify({ success: true, links: mappedLinks }), {
          status: 200,
          headers: corsHeaders,
        });
      }
    } catch (dbErr) {
      console.warn("[promo-links] DB query note:", dbErr);
    }
  }

  // Fallback default link if DB table is empty
  const defaultLinks = [
    {
      id: "promo_1y_free_official",
      code: "BOARDLY-1Y-PRO",
      label: "Official 1-Year Free Boardly Pro Campaign",
      discount_type: "1_year_free_pro",
      duration_months: 12,
      max_redemptions: 1,
      redemption_count: 0,
      is_active: true,
      created_by: "shsvirtualadmin@gmail.com",
      created_at: new Date().toISOString(),
      expires_at: null,
      redemptions: [],
    },
  ];

  return new Response(JSON.stringify({ success: true, links: defaultLinks }), {
    status: 200,
    headers: corsHeaders,
  });
};


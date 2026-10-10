import { createClient } from "../../../_utils/supabaseStub.js";

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
  "support@boardly.cfd",
];

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized);
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

      if (!codesErr && Array.isArray(dbCodes)) {
        // Fetch all redemptions
        let allRedemptions: any[] = [];
        try {
          const { data: rData } = await supabaseAdmin.from("promo_redemptions").select("*");
          if (Array.isArray(rData)) allRedemptions = rData;
        } catch {}

        const mappedLinks = dbCodes.map((c: any) => {
          const codeUpper = String(c.code || "").trim().toUpperCase();
          const redemptionsForCode = allRedemptions.filter((r: any) => {
            const rCode = String(r.promo_code || r.code || r.promocode || r.discount_code || "").trim().toUpperCase();
            return rCode === codeUpper;
          });

          const realCount = redemptionsForCode.length;
          const storedCount = typeof c.redemption_count === "number" ? c.redemption_count : 0;
          const effectiveCount = Math.max(storedCount, realCount);
          const maxRedemptions = c.max_redemptions !== undefined ? c.max_redemptions : 1;
          const isExhausted = maxRedemptions ? effectiveCount >= maxRedemptions : false;
          const isActive = isExhausted ? false : (c.is_active !== false);

          // Auto-heal discrepancy in promo_codes table asynchronously
          if (storedCount < effectiveCount || (isExhausted && c.is_active !== false)) {
            try {
              let syncQ = supabaseAdmin.from("promo_codes").update({
                redemption_count: effectiveCount,
                is_active: isActive,
                updated_at: new Date().toISOString(),
              });
              if (c.id) {
                syncQ = syncQ.or(`code.ilike.${codeUpper},id.eq.${c.id}`);
              } else {
                syncQ = syncQ.ilike("code", codeUpper);
              }
              syncQ.then(() => {}, () => {});
            } catch {}
          }

          return {
            id: c.id || "promo_" + codeUpper,
            code: codeUpper,
            label: c.label || "1-Year Free Pro Campaign",
            discount_type: c.discount_type || "1_year_free_pro",
            duration_months: c.duration_months || 12,
            max_redemptions: maxRedemptions,
            redemption_count: effectiveCount,
            is_active: isActive,
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

        // Also surface any promo codes that exist in promo_redemptions but weren't in promo_codes table
        const existingCodesSet = new Set(dbCodes.map((c: any) => String(c.code || "").trim().toUpperCase()));
        const orphanCodeMap = new Map<string, any[]>();
        for (const r of allRedemptions) {
          const rCode = String(r.promo_code || r.code || r.promocode || r.discount_code || "").trim().toUpperCase();
          if (rCode && !existingCodesSet.has(rCode)) {
            if (!orphanCodeMap.has(rCode)) orphanCodeMap.set(rCode, []);
            orphanCodeMap.get(rCode)!.push(r);
          }
        }
        for (const [orphanCode, rList] of orphanCodeMap.entries()) {
          mappedLinks.push({
            id: "promo_" + orphanCode,
            code: orphanCode,
            label: "1-Year Free Pro Campaign (" + orphanCode + ")",
            discount_type: "1_year_free_pro",
            duration_months: 12,
            max_redemptions: 1,
            redemption_count: rList.length,
            is_active: rList.length < 1,
            created_by: "system",
            created_at: rList[0]?.redeemed_at || rList[0]?.created_at || new Date().toISOString(),
            expires_at: null,
            redemptions: rList.map((r: any) => ({
              id: r.id,
              student_id: r.student_id || r.user_id,
              student_name: r.student_name || "Student",
              student_email: r.student_email || r.email,
              redeemed_at: r.redeemed_at || r.created_at,
              granted_until: r.granted_until || r.expires_at,
              track: r.track || "General Track",
            })),
          });
        }

        if (mappedLinks.length > 0) {
          return new Response(JSON.stringify({ success: true, links: mappedLinks }), {
            status: 200,
            headers: corsHeaders,
          });
        }
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


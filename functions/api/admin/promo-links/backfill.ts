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
  return (
    ADMIN_EMAILS.includes(normalized) ||
    normalized.includes("admin") ||
    normalized.endsWith("@boardly.cfd") ||
    normalized.endsWith("@boardly.com")
  );
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    },
  });
};

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    "Content-Type": "application/json",
  };

  try {
    let body: any = {};
    try {
      const text = await request.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch {
      body = {};
    }

    const headerAdminEmail = (request.headers.get("x-admin-email") || "").trim().toLowerCase();
    const bodyAdminEmail = ((body.adminEmail as string) || "").trim().toLowerCase();
    const requestedBy = bodyAdminEmail || headerAdminEmail || "shsvirtualadmin@gmail.com";

    if (!isAdminEmail(requestedBy)) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: Access restricted to authorized administrators." }),
        { status: 403, headers: corsHeaders }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase admin client not initialized." }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 1. Fetch all records from promo_redemptions
    const { data: allRedemptions, error: redErr } = await supabaseAdmin
      .from("promo_redemptions")
      .select("*");

    if (redErr) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch promo_redemptions: " + redErr.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 2. Group redemptions by normalized code
    const countsByCode = new Map<string, { count: number; studentEmails: string[]; lastRedeemedAt?: string }>();
    if (Array.isArray(allRedemptions)) {
      for (const r of allRedemptions) {
        const code = String(r.promo_code || r.code || r.promocode || r.discount_code || "").trim().toUpperCase();
        if (!code) continue;

        if (!countsByCode.has(code)) {
          countsByCode.set(code, { count: 0, studentEmails: [] });
        }
        const entry = countsByCode.get(code)!;
        entry.count += 1;
        const email = String(r.student_email || r.email || "").trim().toLowerCase();
        if (email && !entry.studentEmails.includes(email)) {
          entry.studentEmails.push(email);
        }
        if (r.redeemed_at || r.created_at) {
          entry.lastRedeemedAt = r.redeemed_at || r.created_at;
        }
      }
    }

    // 3. Fetch existing promo_codes
    const { data: existingCodes } = await supabaseAdmin.from("promo_codes").select("*");
    const existingCodeMap = new Map<string, any>();
    if (Array.isArray(existingCodes)) {
      for (const c of existingCodes) {
        const cCode = String(c.code || "").trim().toUpperCase();
        if (cCode) existingCodeMap.set(cCode, c);
      }
    }

    const backfilledResults: any[] = [];

    // 4. Update each promo_code that has redemptions
    for (const [code, info] of countsByCode.entries()) {
      const existing = existingCodeMap.get(code);
      const maxRedemptions = existing?.max_redemptions !== undefined ? existing.max_redemptions : 1;
      const shouldDeactivate = maxRedemptions ? info.count >= maxRedemptions : false;

      if (existing) {
        let updateQ = supabaseAdmin.from("promo_codes").update({
          redemption_count: info.count,
          is_active: shouldDeactivate ? false : (existing.is_active !== false),
          updated_at: new Date().toISOString(),
        });
        if (existing.id) {
          updateQ = updateQ.or(`code.ilike.${code},id.eq.${existing.id}`);
        } else {
          updateQ = updateQ.ilike("code", code);
        }
        await updateQ;
      } else {
        // Upsert code into promo_codes if it didn't exist
        await supabaseAdmin.from("promo_codes").upsert({
          code: code,
          label: `Campaign for ${code}`,
          discount_type: "1_year_free_pro",
          duration_months: 12,
          max_redemptions: 1,
          redemption_count: info.count,
          is_active: shouldDeactivate ? false : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      backfilledResults.push({
        code,
        previousCount: existing?.redemption_count ?? 0,
        newCount: info.count,
        studentCount: info.studentEmails.length,
        studentEmails: info.studentEmails,
        isActive: !shouldDeactivate,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully backfilled ${backfilledResults.length} promo code(s) from promo_redemptions table.`,
        totalRedemptionsInDb: allRedemptions?.length || 0,
        codesUpdated: backfilledResults,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to backfill promo redemption counts." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

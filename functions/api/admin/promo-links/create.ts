import { createClient } from "../../../_utils/supabaseStub.js";
import { requireAdmin } from "../../../_utils/verifyAdmin.js";

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
    // Verify caller holds a valid Firebase ID token for an admin account
    const requestedBy = await requireAdmin(request, env);

    let body: any = {};
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    const { label, customCode, maxRedemptions, expiresDays } = body;
    if (!label || !String(label).trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "A label or campaign name is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    let finalCode = "";
    if (customCode && String(customCode).trim()) {
      finalCode = String(customCode).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    } else {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let rand = "";
      for (let i = 0; i < 5; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      finalCode = `BOARDLY-1Y-${rand}`;
    }

    let expiresAt: string | null = null;
    if (expiresDays && Number(expiresDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000).toISOString();
    }

    // Default to 1-time use
    let parsedMaxRedemptions: number | null = 1;
    if (maxRedemptions === null || maxRedemptions === "unlimited" || maxRedemptions === 0) {
      parsedMaxRedemptions = null;
    } else if (maxRedemptions !== undefined && Number(maxRedemptions) > 0) {
      parsedMaxRedemptions = Number(maxRedemptions);
    }

    const newLink = {
      id: "promo_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      code: finalCode,
      label: String(label).trim(),
      discount_type: "1_year_free_pro",
      duration_months: 12,
      max_redemptions: parsedMaxRedemptions,
      redemption_count: 0,
      is_active: true,
      created_by: requestedBy,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      redemptions: [],
    };

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from("promo_codes").upsert({
          code: finalCode,
          label: newLink.label,
          discount_type: newLink.discount_type,
          duration_months: newLink.duration_months,
          max_redemptions: newLink.max_redemptions,
          redemption_count: 0,
          is_active: true,
          created_by: requestedBy,
          created_at: newLink.created_at,
          expires_at: newLink.expires_at,
          updated_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("[create] promo_codes DB insert note:", dbErr);
      }
    }

    return new Response(JSON.stringify({ success: true, link: newLink }), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to create promo link." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

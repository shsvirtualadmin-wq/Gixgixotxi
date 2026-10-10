import { createClient } from "../../_utils/supabaseStub.js";

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

  const rawCode = url.searchParams.get("code") || "";
  const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  if (!cleanCode) {
    return new Response(
      JSON.stringify({ valid: false, error: "Promo code query parameter is missing." }),
      { status: 400, headers: corsHeaders }
    );
  }

  const studentId = (url.searchParams.get("studentId") || "").trim();
  const studentEmail = (url.searchParams.get("studentEmail") || "").trim().toLowerCase();

  const supabaseAdmin = getSupabaseAdminClient(env);

  if (supabaseAdmin) {
    try {
      // 1. Check promo_codes table
      let codeRow: any = null;
      try {
        const { data, error } = await supabaseAdmin
          .from("promo_codes")
          .select("*")
          .ilike("code", cleanCode)
          .maybeSingle();
        if (!error && data) codeRow = data;
      } catch (err) {
        console.warn("[validate] promo_codes table check note:", err);
      }

      if (codeRow) {
        if (codeRow.is_active === false) {
          return new Response(
            JSON.stringify({
              valid: false,
              code: cleanCode,
              error: "This promotional code is no longer active or has been paused.",
            }),
            { status: 200, headers: corsHeaders }
          );
        }

        if (codeRow.expires_at && new Date(codeRow.expires_at).getTime() < Date.now()) {
          return new Response(
            JSON.stringify({
              valid: false,
              code: cleanCode,
              error: `This promotional code expired on ${new Date(codeRow.expires_at).toLocaleDateString()}.`,
            }),
            { status: 200, headers: corsHeaders }
          );
        }

        if (codeRow.max_redemptions && (codeRow.redemption_count || 0) >= codeRow.max_redemptions) {
          // Check if THIS student was the one who redeemed it before returning error
          let isSelfRedeemed = false;
          let selfExpiry: string | null = null;

          try {
            const { data: claims } = await supabaseAdmin
              .from("promo_redemptions")
              .select("*")
              .or(`promo_code.ilike.${cleanCode},code.ilike.${cleanCode}`);

            if (Array.isArray(claims)) {
              for (const c of claims) {
                const cEmail = (c.student_email || c.email || "").trim().toLowerCase();
                const cId = c.student_id || c.user_id || "";
                if ((studentEmail && cEmail === studentEmail) || (studentId && cId === studentId)) {
                  isSelfRedeemed = true;
                  selfExpiry = c.granted_until || c.expires_at || null;
                  break;
                }
              }
            }
          } catch {}

          if (isSelfRedeemed) {
            return new Response(
              JSON.stringify({
                valid: true,
                alreadyRedeemed: true,
                alreadyRedeemedByAccount: true,
                code: cleanCode,
                label: codeRow.label || "1-Year Free Boardly Pro Pass",
                expiresDate: selfExpiry,
                grantedUntil: selfExpiry,
                message: "Already activated on this account.",
              }),
              { status: 200, headers: corsHeaders }
            );
          }

          return new Response(
            JSON.stringify({
              valid: false,
              code: cleanCode,
              error: "This promotional link has already been used and is expired. Promotional links are strictly one-time usable.",
            }),
            { status: 200, headers: corsHeaders }
          );
        }
      }

      // 2. Check promo_redemptions table for prior claims by this account
      let studentRedemption: any = null;
      if (studentEmail || studentId) {
        try {
          let q = supabaseAdmin.from("promo_redemptions").select("*");
          if (studentEmail && studentId) {
            q = q.or(`student_email.ilike.${studentEmail},email.ilike.${studentEmail},student_id.eq.${studentId},user_id.eq.${studentId}`);
          } else if (studentEmail) {
            q = q.or(`student_email.ilike.${studentEmail},email.ilike.${studentEmail}`);
          } else {
            q = q.or(`student_id.eq.${studentId},user_id.eq.${studentId}`);
          }
          const { data } = await q.order("created_at", { ascending: false }).limit(5);
          if (Array.isArray(data) && data.length > 0) {
            studentRedemption = data[0];
          }
        } catch (err) {
          console.warn("[validate] promo_redemptions check note:", err);
        }
      }

      // 3. Check profiles table for active Pro status
      let profileRecord: any = null;
      if (studentEmail || studentId) {
        try {
          if (studentEmail) {
            const { data } = await supabaseAdmin.from("profiles").select("*").ilike("email", studentEmail).maybeSingle();
            if (data) profileRecord = data;
          }
          if (!profileRecord && studentId) {
            const { data } = await supabaseAdmin.from("profiles").select("*").eq("id", studentId).maybeSingle();
            if (data) profileRecord = data;
          }
        } catch (err) {
          console.warn("[validate] profiles check note:", err);
        }
      }

      // 4. Check students table for active Pro status
      let studentRecord: any = null;
      if (studentEmail || studentId) {
        try {
          if (studentEmail) {
            const { data } = await supabaseAdmin.from("students").select("*").ilike("email", studentEmail).maybeSingle();
            if (data) studentRecord = data;
          }
          if (!studentRecord && studentId) {
            const { data } = await supabaseAdmin.from("students").select("*").eq("id", studentId).maybeSingle();
            if (data) studentRecord = data;
          }
        } catch (err) {
          console.warn("[validate] students check note:", err);
        }
      }

      const hasActiveProfilePro = Boolean(
        profileRecord &&
        (profileRecord.subscription_tier === "pro" || profileRecord.is_pro) &&
        (!profileRecord.subscription_expires_at || new Date(profileRecord.subscription_expires_at).getTime() > Date.now())
      );

      const hasActiveStudentPro = Boolean(
        studentRecord &&
        (studentRecord.is_pro || studentRecord.plan_tier === "pro") &&
        (!studentRecord.access_expires || new Date(studentRecord.access_expires).getTime() > Date.now())
      );

      const alreadyRedeemed = Boolean(
        studentRedemption ||
        hasActiveProfilePro ||
        hasActiveStudentPro ||
        profileRecord?.promo_code_redeemed === cleanCode ||
        studentRecord?.promo_code_redeemed === cleanCode ||
        (studentRecord?.transaction_reference && String(studentRecord.transaction_reference).includes(cleanCode))
      );

      if (alreadyRedeemed) {
        const existingExpiry =
          studentRedemption?.granted_until ||
          studentRedemption?.expires_at ||
          profileRecord?.subscription_expires_at ||
          studentRecord?.access_expires ||
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

        return new Response(
          JSON.stringify({
            valid: true,
            alreadyRedeemed: true,
            alreadyRedeemedByAccount: true,
            code: cleanCode,
            label: codeRow?.label || "1-Year Free Boardly Pro Pass",
            expiresDate: existingExpiry,
            grantedUntil: existingExpiry,
            message: `Already activated on this account — expires ${new Date(existingExpiry).toLocaleDateString()}`,
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Code is valid and available to activate
      return new Response(
        JSON.stringify({
          valid: true,
          code: cleanCode,
          label: codeRow?.label || "1-Year Free Boardly Pro Campaign",
          maxRedemptions: codeRow?.max_redemptions ?? 1,
          redemptionCount: codeRow?.redemption_count || 0,
          remainingRedemptions: codeRow?.max_redemptions ? Math.max(0, codeRow.max_redemptions - (codeRow.redemption_count || 0)) : null,
          expiresAt: codeRow?.expires_at || null,
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      console.error("[validate] Global error:", err);
    }
  }

  // Fallback for valid code format when DB is offline
  return new Response(
    JSON.stringify({
      valid: true,
      code: cleanCode,
      label: "1-Year Free Boardly Pro Campaign",
      maxRedemptions: 1,
      redemptionCount: 0,
      remainingRedemptions: 1,
      expiresAt: null,
    }),
    { status: 200, headers: corsHeaders }
  );
};


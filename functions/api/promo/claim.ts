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

    const sanitizeStudentForPostgres = (data: Record<string, any>): Record<string, any> => {
      const allowed = [
        'id', 'name', 'email', 'phone', 'grade', 'stream', 'is_registered',
        'subjects', 'status', 'sign_up_method', 'package_name', 'payment_status', 'plan_status',
        'requires_payment', 'is_pro', 'plan_tier', 'subscribed_plans', 'assigned_classes',
        'access_expires', 'transaction_reference', 'tests_used_this_month', 'ai_messages_used_today',
        'last_ai_message_date', 'created_at', 'updated_at',
        'dream_university', 'target_university', 'avatar_url'
      ];
      const clean: Record<string, any> = {};
      for (const col of allowed) {
        if (data[col] !== undefined) clean[col] = data[col];
      }
      return clean;
    };

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
    let profileRecord: any = null;
    let promoCodeRecord: any = null;
    let campaignLabel = "1-Year Free Boardly Pro Campaign";

    if (supabaseAdmin) {
      // 1. Fetch promo_codes table record
      try {
        const { data: codeData } = await supabaseAdmin
          .from("promo_codes")
          .select("*")
          .ilike("code", cleanCode)
          .maybeSingle();
        if (codeData) {
          promoCodeRecord = codeData;
          if (codeData.label) campaignLabel = codeData.label;

          // Check if promo code is active
          if (codeData.is_active === false) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "This promotional code is no longer active or has been paused.",
              }),
              { status: 400, headers: corsHeaders }
            );
          }

          // Check expiry
          if (codeData.expires_at && new Date(codeData.expires_at).getTime() < Date.now()) {
            return new Response(
              JSON.stringify({
                success: false,
                error: `This promotional code expired on ${new Date(codeData.expires_at).toLocaleDateString()}.`,
              }),
              { status: 400, headers: corsHeaders }
            );
          }

          // Check max usage
          if (codeData.max_redemptions && (codeData.redemption_count || 0) >= codeData.max_redemptions) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "This promotional link has already been used and is expired. Promotional links are strictly one-time usable.",
              }),
              { status: 400, headers: corsHeaders }
            );
          }
        }
      } catch (err) {
        console.warn("[claim] promo_codes fetch note:", err);
      }

      // 2. Fetch existing student record
      const cleanStudentEmail = (studentEmail || "").trim().toLowerCase();
      if (studentId && !studentId.includes("@")) {
        const { data } = await supabaseAdmin.from("students").select("*").eq("id", studentId).maybeSingle();
        if (data) studentRecord = data;
      }
      if (!studentRecord && cleanStudentEmail) {
        const { data } = await supabaseAdmin.from("students").select("*").ilike("email", cleanStudentEmail).maybeSingle();
        if (data) studentRecord = data;
      }

      // 3. Fetch existing profile record
      try {
        if (cleanStudentEmail) {
          const { data: p } = await supabaseAdmin.from("profiles").select("*").ilike("email", cleanStudentEmail).maybeSingle();
          if (p) profileRecord = p;
        }
        if (!profileRecord && studentId) {
          const { data: p } = await supabaseAdmin.from("profiles").select("*").eq("id", studentId).maybeSingle();
          if (p) profileRecord = p;
        }
      } catch (err) {
        console.warn("[claim] profiles fetch note:", err);
      }

      // 4. Check promo_redemptions table for anti-stacking
      let existingRedemption: any = null;
      try {
        let q = supabaseAdmin.from("promo_redemptions").select("*");
        if (cleanStudentEmail && studentId) {
          q = q.or(`student_email.ilike.${cleanStudentEmail},email.ilike.${cleanStudentEmail},student_id.eq.${studentId},user_id.eq.${studentId}`);
        } else if (cleanStudentEmail) {
          q = q.or(`student_email.ilike.${cleanStudentEmail},email.ilike.${cleanStudentEmail}`);
        } else if (studentId) {
          q = q.or(`student_id.eq.${studentId},user_id.eq.${studentId}`);
        }
        const { data: rList } = await q.limit(1);
        if (Array.isArray(rList) && rList.length > 0) {
          existingRedemption = rList[0];
        }
      } catch (err) {
        console.warn("[claim] promo_redemptions check note:", err);
      }

      // Check anti-stacking / already active
      const hasStudentRedeemed = studentRecord && (
        studentRecord.promo_code_redeemed ||
        studentRecord.promo_redeemed_at ||
        (studentRecord.transaction_reference && String(studentRecord.transaction_reference).startsWith("PROMO:"))
      );
      const hasProfilePro = profileRecord && (
        (profileRecord.subscription_tier === "pro" || profileRecord.is_pro) &&
        (!profileRecord.subscription_expires_at || new Date(profileRecord.subscription_expires_at).getTime() > Date.now())
      );
      const hasStudentPro = studentRecord && (
        (studentRecord.is_pro || studentRecord.plan_tier === "pro") &&
        (!studentRecord.access_expires || new Date(studentRecord.access_expires).getTime() > Date.now())
      );

      if (existingRedemption || hasStudentRedeemed || hasProfilePro || hasStudentPro) {
        const existingExpiry =
          existingRedemption?.granted_until ||
          existingRedemption?.expires_at ||
          profileRecord?.subscription_expires_at ||
          studentRecord?.access_expires ||
          accessExpiresStr;

        return new Response(
          JSON.stringify({
            success: false,
            alreadyRedeemed: true,
            code: cleanCode,
            label: campaignLabel,
            grantedUntil: existingExpiry,
            expiresDate: existingExpiry,
            error: `This student account has already redeemed a 1-Year Free Pro promo code (expires ${new Date(existingExpiry).toLocaleDateString()}).`,
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      const finalId = studentRecord?.id || profileRecord?.id || studentId || ("student_" + Date.now());
      const finalEmail = cleanStudentEmail || studentRecord?.email || profileRecord?.email || "";
      const finalName = studentRecord?.name || profileRecord?.name || studentName || (finalEmail ? finalEmail.split("@")[0] : "Student");

      // 5. INSERT into promo_redemptions table
      try {
        const primaryRedemption = {
          promo_code: cleanCode,
          student_id: finalId,
          student_email: finalEmail,
          student_name: finalName,
          redeemed_at: new Date().toISOString(),
          granted_until: accessExpiresStr,
          track: studentRecord?.grade || studentRecord?.stream || "Boardly Pro Track",
        };
        const { error: redErr1 } = await supabaseAdmin.from("promo_redemptions").insert([primaryRedemption]);
        if (redErr1) {
          console.warn("[claim] promo_redemptions primary insert note:", redErr1);
          const altRedemption = {
            code: cleanCode,
            user_id: finalId,
            email: finalEmail,
            created_at: new Date().toISOString(),
            expires_at: accessExpiresStr,
          };
          const { error: redErr2 } = await supabaseAdmin.from("promo_redemptions").insert([altRedemption]);
          if (redErr2) {
            console.warn("[claim] promo_redemptions alt insert note:", redErr2);
            await supabaseAdmin.from("promo_redemptions").insert([{ promo_code: cleanCode, student_email: finalEmail }]);
          }
        }
      } catch (rErr) {
        console.warn("[claim] promo_redemptions insert exception:", rErr);
      }

      // 6. UPDATE or UPSERT promo_codes table (increment redemption_count)
      try {
        if (promoCodeRecord) {
          const newCount = (promoCodeRecord.redemption_count || 0) + 1;
          const shouldDeactivate = promoCodeRecord.max_redemptions && newCount >= promoCodeRecord.max_redemptions;
          await supabaseAdmin
            .from("promo_codes")
            .update({
              redemption_count: newCount,
              is_active: shouldDeactivate ? false : promoCodeRecord.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", promoCodeRecord.id);
        } else {
          // Record code creation and redemption in promo_codes table
          await supabaseAdmin.from("promo_codes").upsert({
            code: cleanCode,
            label: campaignLabel,
            discount_type: "1_year_free_pro",
            duration_months: 12,
            max_redemptions: 1,
            redemption_count: 1,
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (cErr) {
        console.warn("[claim] promo_codes update note:", cErr);
      }

      // 7. UPSERT / UPDATE profiles table
      try {
        const profilePayload = {
          id: finalId,
          email: finalEmail,
          name: finalName,
          subscription_tier: "pro",
          subscription_expires_at: accessExpiresStr,
          is_pro: true,
          updated_at: new Date().toISOString(),
        };
        const { error: profErr } = await supabaseAdmin.from("profiles").upsert(profilePayload);
        if (profErr && finalEmail) {
          await supabaseAdmin.from("profiles").update({
            subscription_tier: "pro",
            subscription_expires_at: accessExpiresStr,
            is_pro: true,
            updated_at: new Date().toISOString(),
          }).ilike("email", finalEmail);
        }
      } catch (pErr) {
        console.warn("[claim] profiles upsert note:", pErr);
      }

      // 8. UPSERT / UPDATE students table
      try {
        const safePlanUpdates = sanitizeStudentForPostgres(planUpdateData);

        // 8a. Update existing student record by ID
        if (finalId && !finalId.includes("@")) {
          const { error: idErr } = await supabaseAdmin
            .from("students")
            .update(safePlanUpdates)
            .eq("id", finalId);
          if (idErr) console.warn("[claim] update student by id note:", idErr);
        }

        // 8b. Update existing student record by email
        if (finalEmail) {
          const { error: emailErr } = await supabaseAdmin
            .from("students")
            .update(safePlanUpdates)
            .ilike("email", finalEmail);
          if (emailErr) console.warn("[claim] update student by email note:", emailErr);
        }

        // 8b-2. Minimal core fallback update
        const coreUpdate = {
          is_pro: true,
          plan_tier: "pro",
          access_expires: accessExpiresStr,
          payment_status: "Verified & Paid",
          plan_status: "verified_pro",
        };
        if (finalId && !finalId.includes("@")) {
          await supabaseAdmin.from("students").update(coreUpdate).eq("id", finalId);
        }
        if (finalEmail) {
          await supabaseAdmin.from("students").update(coreUpdate).ilike("email", finalEmail);
        }

        // 8c. Upsert student record to guarantee row existence and Pro columns
        const studentCleanPayload = sanitizeStudentForPostgres({
          id: finalId,
          email: finalEmail,
          name: finalName,
          grade: studentRecord?.grade || "General Student",
          stream: studentRecord?.stream || "",
          is_registered: true,
          ...planUpdateData,
        });

        const { error: studErr } = await supabaseAdmin.from("students").upsert(studentCleanPayload);
        if (studErr) {
          console.warn("[claim] students upsert note:", studErr);
        }
      } catch (sErr) {
        console.warn("[claim] students upsert exception:", sErr);
      }

      // 9. INSERT admin_activity_logs record
      try {
        await supabaseAdmin.from("admin_activity_logs").insert([{
          id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          admin_email: promoCodeRecord?.created_by || "system_promo",
          target_student_id: finalId,
          target_student_name: finalName,
          target_student_email: finalEmail,
          action_type: "promo_1year_redeemed",
          old_plan: studentRecord?.package_name || "Free Plan",
          new_plan: "⭐ Boardly 1-Year Pro (Promotional Pass)",
          note: `Redeemed 1-Year Free Pro Promo Link "${cleanCode}" — 1 Full Year Pro granted until ${new Date(accessExpiresStr).toLocaleDateString()}`,
          created_at: new Date().toISOString(),
        }]);
      } catch {}
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "🎉 1 Year of Free Boardly Pro Access Unlocked!",
        code: cleanCode,
        label: campaignLabel,
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

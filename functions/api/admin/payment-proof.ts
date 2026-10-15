import { createClient } from "../../_utils/supabaseStub.js";
import { requireAdmin } from "../../_utils/verifyAdmin.js";

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
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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
    const adminEmail = await requireAdmin(request, env);

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { proofId, studentId, studentEmail, action, reason } = body;
    if ((!proofId && !studentId && !studentEmail) || !["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters: proofId/studentId and action ('approve' | 'reject')." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Database client unavailable." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const nowIso = new Date().toISOString();
    const isApprove = action === "approve";

    // 1. Update payment_proofs / payment_requests table
    if (proofId) {
      try {
        await supabaseAdmin
          .from("payment_proofs")
          .update({
            status: isApprove ? "approved" : "rejected",
            reviewed_by: adminEmail,
            reviewed_at: nowIso,
            rejection_reason: isApprove ? null : reason || "Rejected by administrator",
            updated_at: nowIso,
          })
          .eq("id", proofId);
      } catch (pErr) {
        console.warn("[payment-proof] payment_proofs update exception:", pErr);
      }

      try {
        await supabaseAdmin
          .from("payment_requests")
          .update({
            status: isApprove ? "approved" : "rejected",
            reviewed_by: adminEmail,
            reviewed_at: nowIso,
            rejection_reason: isApprove ? null : reason || "Rejected by administrator",
            updated_at: nowIso,
          })
          .eq("id", proofId);
      } catch (prErr) {
        console.warn("[payment-proof] payment_requests update exception:", prErr);
      }
    }

    // 2. Update Student's subscription if approved
    let targetStudentId = studentId;
    let targetStudentEmail = studentEmail;

    if (!targetStudentId && targetStudentEmail) {
      const { data: s } = await supabaseAdmin.from("students").select("id").ilike("email", targetStudentEmail).maybeSingle();
      if (s?.id) targetStudentId = s.id;
    }

    if (targetStudentId || targetStudentEmail) {
      const oneYearExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const studentUpdate: Record<string, any> = isApprove
        ? {
            payment_status: "Verified & Paid",
            subscription_tier: "pro",
            plan_tier: "pro",
            is_pro: true,
            package_name: "Pro Annual",
            access_expires: oneYearExpiry,
            pro_expires_at: oneYearExpiry,
            status: "active",
            updated_at: nowIso,
          }
        : {
            payment_status: "Rejected",
            updated_at: nowIso,
          };

      if (targetStudentId) {
        await supabaseAdmin.from("students").update(studentUpdate).eq("id", targetStudentId);
        await supabaseAdmin.from("profiles").update(studentUpdate).eq("id", targetStudentId);
      } else if (targetStudentEmail) {
        await supabaseAdmin.from("students").update(studentUpdate).ilike("email", targetStudentEmail);
        await supabaseAdmin.from("profiles").update(studentUpdate).ilike("email", targetStudentEmail);
      }
    }

    // 3. Log to admin_audit_log
    try {
      await supabaseAdmin.from("admin_audit_log").insert([
        {
          admin_email: adminEmail,
          action: isApprove ? "APPROVE_PAYMENT_PROOF" : "REJECT_PAYMENT_PROOF",
          target_student_id: targetStudentId || null,
          target_student_email: targetStudentEmail || null,
          details: { proofId, action, reason, timestamp: nowIso },
          created_at: nowIso,
        },
      ]);
    } catch (auditErr) {
      console.warn("[payment-proof] audit log warning:", auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment proof ${isApprove ? "approved and subscription activated" : "rejected"} successfully.`,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error." }),
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

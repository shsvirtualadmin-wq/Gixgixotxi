import { createClient } from "@supabase/supabase-js";

interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

function getSupabaseAdminClient(env: Record<string, any>) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const handleSubmitPaymentRequest = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const contentType = request.headers.get("content-type") || "";
    let student_id = "";
    let student_name = "Student";
    let student_email = "";
    let payment_method = "";
    let amount = "";
    let transaction_reference = "";
    let course_tier = "";
    let proofUrl: string | undefined = undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json() as any;
      student_id = body.student_id || body.studentId || "";
      student_name = body.student_name || body.studentName || "Student";
      student_email = body.student_email || body.studentEmail || "";
      payment_method = body.payment_method || body.paymentMethod || "";
      amount = body.amount || "";
      transaction_reference = body.transaction_reference || body.transactionRef || "";
      course_tier = body.course_tier || body.tier || "";
      proofUrl = body.proof_url || body.screenshot_url || undefined;
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      student_id = formData.get("student_id")?.toString() || formData.get("studentId")?.toString() || "";
      student_name = formData.get("student_name")?.toString() || formData.get("studentName")?.toString() || "Student";
      student_email = formData.get("student_email")?.toString() || formData.get("studentEmail")?.toString() || "";
      payment_method = formData.get("payment_method")?.toString() || formData.get("paymentMethod")?.toString() || "";
      amount = formData.get("amount")?.toString() || "";
      transaction_reference = formData.get("transaction_reference")?.toString() || formData.get("transactionRef")?.toString() || "";
      course_tier = formData.get("course_tier")?.toString() || formData.get("tier")?.toString() || "";

      const file = formData.get("file") as File | null;
      if (file && typeof file.arrayBuffer === "function") {
        try {
          const r2Bucket = env.RESOURCES_BUCKET;
          const sanitizedFileName = (file.name || "payment-proof.png").replace(/[^a-zA-Z0-9.-]/g, "_");
          const objectKey = `proofs/${Date.now()}-${sanitizedFileName}`;
          const arrayBuffer = await file.arrayBuffer();

          if (r2Bucket && typeof r2Bucket.put === "function") {
            await r2Bucket.put(objectKey, arrayBuffer, {
              httpMetadata: {
                contentType: file.type || "image/png",
                contentDisposition: `inline; filename="${sanitizedFileName}"`,
              },
            });
          }

          const publicDomain = (
            env.PUBLIC_R2_DOMAIN ||
            env.R2_PUBLIC_DOMAIN ||
            env.VITE_R2_PUBLIC_DOMAIN ||
            "pub-51ccade1f191417389ac7df61830c670.r2.dev"
          ).replace(/\/$/, "");

          proofUrl = publicDomain.startsWith("http")
            ? `${publicDomain}/${objectKey}`
            : `https://${publicDomain}/${objectKey}`;
        } catch (uploadErr) {
          console.warn("[R2 Payment Proof Upload Error]:", uploadErr);
        }
      }
    }

    if (!student_email || !payment_method || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: student_email, payment_method, amount." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const driveFileId = `wa-${Date.now()}`;
    const driveFileUrl = proofUrl || "WhatsApp Submission (+923222314436)";

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase client configuration is missing or invalid." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const cleanTxRef = String(transaction_reference || "").trim();
    const cleanEmail = String(student_email || "").toLowerCase().trim();
    const validStudentUuid = student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student_id) ? student_id : null;

    // Check for existing pending request with same transaction_ref to avoid duplicates
    if (cleanTxRef) {
      const { data: existingRef } = await supabaseAdmin
        .from("payment_requests")
        .select("*")
        .eq("transaction_ref", cleanTxRef)
        .maybeSingle();

      if (existingRef) {
        console.log("[submit.ts] Existing payment_request found for transaction_ref:", cleanTxRef);
        return new Response(
          JSON.stringify({ success: true, data: existingRef, message: "Payment request already recorded." }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    const newRecord: Record<string, any> = {
      student_id: validStudentUuid,
      student_name: String(student_name || "Student"),
      student_email: cleanEmail,
      transaction_ref: cleanTxRef,
      package_name: String(course_tier || "Boardly Premium").trim(),
      status: "pending",
      proof_url: proofUrl,
      screenshot_url: proofUrl,
      payment_proof_url: proofUrl,
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("payment_requests")
      .insert(newRecord)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[Supabase Insert Error payment_requests]:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    const insertedData = data || newRecord;

    // Update student payment status in students table
    try {
      await supabaseAdmin
        .from("students")
        .update({
          payment_status: "Pending Verification",
          requires_payment: true,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${student_id},email.eq.${student_email}`);
    } catch (stErr) {
      console.warn("[Error updating student payment_status]:", stErr);
    }

    return new Response(
      JSON.stringify({ success: true, data: insertedData }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[functions/api/payment-requests/submit exception]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error submitting payment proof." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestPost = handleSubmitPaymentRequest;
export const onRequestPut = handleSubmitPaymentRequest;
export const onRequestPatch = handleSubmitPaymentRequest;
export const onRequestDelete = handleSubmitPaymentRequest;
export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

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

export const onRequestGet = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // Verify caller is an authenticated admin via Firebase token + role lookup
    await requireAdmin(request, env);

    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase client configuration missing on server." }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Attempt to read from students table first
    let studentsList: any[] = [];
    const { data: sData, error: sError } = await supabaseAdmin
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (!sError && Array.isArray(sData) && sData.length > 0) {
      studentsList = sData;
    } else {
      // Fallback or augment with profiles table
      const { data: pData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (Array.isArray(pData)) {
        studentsList = pData;
      }
    }

    // Normalize student records with all fields required by Admin Dashboard
    const formattedStudents = studentsList.map((s) => {
      const isSuspended = Boolean(s.status === "suspended" || s.suspended === true || s.is_suspended === true);
      const isDeleted = Boolean(s.status === "deleted" || s.is_deleted === true);
      const expiry = s.access_expires || s.pro_expires_at || s.premium_expires_at || null;
      const isExpired = Boolean(expiry && new Date(expiry).getTime() < Date.now());

      let computedStatus = "active";
      if (isDeleted) computedStatus = "deleted";
      else if (isSuspended) computedStatus = "suspended";
      else if (isExpired) computedStatus = "expired";
      else if (s.payment_status === "pending" || s.payment_status === "pending_verification") computedStatus = "pending";

      return {
        id: s.id,
        uid: s.id,
        name: s.name || s.display_name || (s.email ? s.email.split("@")[0] : "Student"),
        displayName: s.name || s.display_name || (s.email ? s.email.split("@")[0] : "Student"),
        email: s.email || "",
        grade: s.grade || s.class || s.enrolled_track_id || "Class 11",
        class: s.grade || s.class || s.enrolled_track_id || "Class 11",
        stream: s.stream || s.enrolled_stream_id || "Pre-Engineering",
        targetUniversity: s.target_university || s.dream_university || s.university || "—",
        university: s.target_university || s.dream_university || s.university || "—",
        subscriptionTier: s.subscription_tier || s.plan || (s.is_pro ? "pro" : "free"),
        plan: s.subscription_tier || s.plan || (s.is_pro ? "pro" : "free"),
        packageName: s.package_name || (s.is_pro ? "Pro Plan" : "Free Plan"),
        isPro: Boolean(s.is_pro || s.subscription_tier === "pro" || s.subscription_tier === "premium"),
        accessExpires: expiry,
        expiryDate: expiry,
        paymentStatus: s.payment_status || (s.is_pro ? "Verified & Paid" : "Free"),
        attendanceSummary: s.attendance_summary || s.attendance_count ? `${s.attendance_count ?? s.attendance_summary} sessions` : "0 sessions",
        lastActive: s.last_active_at || s.updated_at || s.created_at || "—",
        createdAt: s.created_at || "—",
        status: computedStatus,
        suspended: isSuspended,
        role: s.role || "student",
      };
    });

    return new Response(
      JSON.stringify({ success: true, students: formattedStudents, count: formattedStudents.length }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Error fetching students" }),
      { status: 500, headers: corsHeaders }
    );
  }
};

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

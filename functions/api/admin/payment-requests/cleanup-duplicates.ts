import { createClient } from "@supabase/supabase-js";
import { findDuplicatePaymentGroups } from "../../../../src/lib/paymentDeduplication";

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

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase admin client configuration is missing or invalid on server.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    let targetEmail: string | undefined = undefined;
    try {
      const text = await request.text();
      if (text && text.trim()) {
        const body = JSON.parse(text);
        targetEmail = body.targetEmail || body.studentEmail || undefined;
      }
    } catch {
      // Body parsing optional
    }

    // 1. Fetch all payment requests with Service Role client to bypass RLS
    let query = supabaseAdmin
      .from("payment_requests")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (targetEmail && targetEmail.includes("@")) {
      query = query.ilike("student_email", targetEmail.trim().toLowerCase());
    }

    const { data: allRequests, error: fetchErr } = await query;
    if (fetchErr) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch payment requests: ${fetchErr.message}`,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const requests = allRequests || [];
    const duplicateGroups = findDuplicatePaymentGroups(requests);

    const duplicateIdsToDelete: string[] = [];
    const keptIds: string[] = [];

    for (const group of duplicateGroups) {
      keptIds.push(group.primary.id);
      for (const dupe of group.duplicates) {
        duplicateIdsToDelete.push(dupe.id);
      }
    }

    if (duplicateIdsToDelete.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          removedCount: 0,
          removedIds: [],
          keptIds: [],
          message: "No duplicate payment submissions found. All records are unique!",
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 2. Delete duplicates using the admin service client
    const { error: deleteErr, count } = await supabaseAdmin
      .from("payment_requests")
      .delete({ count: "exact" })
      .in("id", duplicateIdsToDelete);

    if (deleteErr) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to delete duplicate records from Supabase: ${deleteErr.message}`,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const actuallyRemoved = count !== null && count !== undefined ? count : duplicateIdsToDelete.length;

    return new Response(
      JSON.stringify({
        success: true,
        removedCount: actuallyRemoved,
        removedIds: duplicateIdsToDelete,
        keptIds,
        message: `Successfully deleted ${actuallyRemoved} duplicate payment submission(s) from database. Kept primary verified records.`,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Internal error during duplicate cleanup.",
      }),
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

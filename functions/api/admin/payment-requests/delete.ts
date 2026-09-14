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

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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

    let requestId: string | undefined = undefined;
    let adminEmail: string | undefined = undefined;

    try {
      const text = await request.text();
      if (text && text.trim()) {
        const body = JSON.parse(text);
        requestId = body.requestId || body.id;
        adminEmail = body.adminEmail;
      }
    } catch {
      // Body parsing error handled below
    }

    if (!requestId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameter: requestId.",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { error: deleteErr, count } = await supabaseAdmin
      .from("payment_requests")
      .delete({ count: "exact" })
      .eq("id", requestId);

    if (deleteErr) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to delete payment request: ${deleteErr.message}`,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: count ?? 1,
        message: `Payment request ${requestId} deleted successfully.`,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Internal error during payment request deletion.",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestDelete = onRequestPost;

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

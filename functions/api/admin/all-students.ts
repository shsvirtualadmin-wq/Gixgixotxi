import { createClient } from "../../_utils/supabaseStub.js";

interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

function getSupabaseAdminClient(env: Record<string, string | undefined>) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export const onRequestGet = async (context: PagesContext) => {
  const { env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const supabaseAdmin = getSupabaseAdminClient(env);
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase client configuration missing." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, students: data || [] }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
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

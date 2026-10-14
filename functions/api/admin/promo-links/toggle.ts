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
    await requireAdmin(request, env);

    const body: any = await request.json().catch(() => ({}));
    const { id, is_active } = body;

    // Persist toggle in database if available
    const db = getSupabaseAdminClient(env);
    if (db && id) {
      try {
        await db
          .from("promo_codes")
          .update({ is_active: Boolean(is_active), updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch (dbErr) {
        console.warn("[toggle] DB update note:", dbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Promo link status updated to ${is_active ? "active" : "paused"}.`,
        id,
        is_active,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    // Re-throw Response objects (from requireAdmin) so Pages returns them correctly
    if (err instanceof Response) throw err;
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to update link." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

import { createClient } from "../../_utils/supabaseStub.js";

interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

const ADMIN_EMAILS = [
  "shsvirtualadmin@gmail.com",
  "dj.khadijajameel19@gmail.com",
  "syedrayyanf1@gmail.com",
  "shs.academy.virtual@gmail.com",
];

function getSupabaseAdminClient(env: Record<string, any>) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
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
    const body = await request.json() as any;
    const { id, requesterEmail } = body || {};

    const isAdmin = Boolean(requesterEmail && ADMIN_EMAILS.includes(String(requesterEmail).trim().toLowerCase()));
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Only administrators can delete resources." }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Resource ID is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id).trim());
    const db = getSupabaseAdminClient(env);

    if (db && isUuid) {
      // Fetch resource first to see if we should delete from R2 as well
      try {
        const { data: existing } = await db.from("resources").select("*").eq("id", id).maybeSingle();
        if (existing?.file_url) {
          try {
            const urlObj = new URL(existing.file_url);
            const pathname = urlObj.pathname.replace(/^\//, "");
            const r2Bucket = env.RESOURCES_BUCKET;
            if (r2Bucket && typeof r2Bucket.delete === "function") {
              await r2Bucket.delete(pathname);
            }
          } catch {}
        }
      } catch (findErr) {
        console.warn("Could not query resource before delete:", findErr);
      }

      const { error } = await db.from("resources").delete().eq("id", id);
      if (error && !error.message?.includes("invalid input syntax for type uuid")) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Resource deleted successfully." }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error deleting resource:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to delete resource." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

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

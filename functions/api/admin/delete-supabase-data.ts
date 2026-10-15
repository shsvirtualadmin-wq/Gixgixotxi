import { requireAdmin } from "../../_utils/verifyAdmin.js";

interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

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

export const onRequestPost = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // 1. Authenticate that caller is verified admin
    const adminEmail = await requireAdmin(request, env);

    // 2. Parse confirmation body
    const body = await request.json().catch(() => ({})) as any;
    if (body.confirmation !== "DELETE SUPABASE") {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden: Confirmation phrase "DELETE SUPABASE" is strictly required.',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Resolve Supabase Service Role Key
    const supabaseUrl =
      env.VITE_SUPABASE_URL ||
      env.SUPABASE_URL ||
      "https://wbvzbbnapowwmrjecdyt.supabase.co";

    const serviceKey =
      env.SUPABASE_SERVICE_ROLE_KEY ||
      env.SUPABASE_SERVICE_KEY ||
      env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase service-role key (SUPABASE_SERVICE_ROLE_KEY) is not set in Cloudflare Worker environment. Please add it temporarily to execute deletion.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const deletionLogs: string[] = [];
    const pushLog = (msg: string) => {
      deletionLogs.push(`[${new Date().toISOString()}] ${msg}`);
      console.log(`[DeleteSupabaseData] ${msg}`);
    };

    pushLog(`Admin "${adminEmail}" authorized full Supabase purge.`);

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    // 4. Purge Database Tables
    const tablesToPurge = [
      "mcq_attempts",
      "student_attempted_mcqs",
      "student_mcq_usage",
      "mcq_usage",
      "test_results",
      "student_progress",
      "student_achievements",
      "achievements",
      "study_buddy_history",
      "study_buddy_usage",
      "ai_history",
      "payment_requests",
      "promo_redemptions",
      "promo_codes",
      "resources",
      "shared_custom_topics",
      "students",
      "profiles",
    ];

    let totalRowsPurged = 0;

    for (const table of tablesToPurge) {
      try {
        const delUrl = `${supabaseUrl}/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`;
        const resp = await fetch(delUrl, {
          method: "DELETE",
          headers,
        });

        if (resp.ok) {
          const deletedRows = await resp.json().catch(() => []);
          const count = Array.isArray(deletedRows) ? deletedRows.length : 0;
          totalRowsPurged += count;
          pushLog(`Table "${table}": purged ${count} rows.`);
        } else if (resp.status === 404 || resp.status === 400) {
          pushLog(`Table "${table}": bypassed (${resp.statusText || "table not found in schema"}).`);
        } else {
          pushLog(`Table "${table}": purge warning (${resp.status} ${resp.statusText}).`);
        }
      } catch (tableErr: any) {
        pushLog(`Table "${table}": error during purge - ${tableErr?.message || tableErr}`);
      }
    }

    // 5. Purge Storage Buckets
    const bucketsToPurge = ["avatars"];
    let totalFilesPurged = 0;

    for (const bucket of bucketsToPurge) {
      try {
        const listUrl = `${supabaseUrl}/storage/v1/object/list/${bucket}`;
        const listResp = await fetch(listUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ limit: 1000, prefix: "" }),
        });

        if (listResp.ok) {
          const files = (await listResp.json().catch(() => [])) as Array<{ name: string }>;
          if (Array.isArray(files) && files.length > 0) {
            const prefixes = files.map((f) => f.name);
            const delUrl = `${supabaseUrl}/storage/v1/object/${bucket}`;
            const delResp = await fetch(delUrl, {
              method: "DELETE",
              headers,
              body: JSON.stringify({ prefixes }),
            });
            if (delResp.ok) {
              totalFilesPurged += prefixes.length;
              pushLog(`Bucket "${bucket}": deleted ${prefixes.length} files.`);
            } else {
              pushLog(`Bucket "${bucket}": delete request returned ${delResp.status}.`);
            }
          } else {
            pushLog(`Bucket "${bucket}": 0 files found.`);
          }
        } else {
          pushLog(`Bucket "${bucket}": list returned ${listResp.status} (empty or not found).`);
        }
      } catch (bucketErr: any) {
        pushLog(`Bucket "${bucket}": error during purge - ${bucketErr?.message || bucketErr}`);
      }
    }

    // 6. Purge Supabase Auth Users
    let totalUsersPurged = 0;
    try {
      const usersListUrl = `${supabaseUrl}/auth/v1/admin/users?per_page=1000`;
      const usersResp = await fetch(usersListUrl, {
        method: "GET",
        headers,
      });

      if (usersResp.ok) {
        const usersData = (await usersResp.json().catch(() => ({}))) as { users?: Array<{ id: string; email?: string }> };
        const users = usersData?.users || [];
        for (const u of users) {
          try {
            const userDelUrl = `${supabaseUrl}/auth/v1/admin/users/${u.id}`;
            const uDelResp = await fetch(userDelUrl, {
              method: "DELETE",
              headers,
            });
            if (uDelResp.ok) {
              totalUsersPurged++;
              pushLog(`Auth User: deleted user ${u.email || u.id}`);
            }
          } catch (uErr: any) {
            pushLog(`Auth User ${u.id}: delete notice - ${uErr?.message || uErr}`);
          }
        }
      }
    } catch (authErr: any) {
      pushLog(`Auth Users purge error: ${authErr?.message || authErr}`);
    }

    pushLog(
      `Purge finished: ${totalRowsPurged} database rows, ${totalFilesPurged} storage files, ${totalUsersPurged} auth users permanently wiped.`
    );

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalRowsPurged,
          totalFilesPurged,
          totalUsersPurged,
        },
        logs: deletionLogs,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[delete-supabase-data] Fatal error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error during deletion." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

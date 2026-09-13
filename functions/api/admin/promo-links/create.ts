interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

const ADMIN_EMAILS = [
  "shsvirtualadmin@gmail.com",
  "dj.khadijajameel19@gmail.com",
  "syedrayyanf1@gmail.com",
];

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized) ||
    normalized.includes("admin") ||
    normalized.endsWith("@boardly.cfd") ||
    normalized.endsWith("@boardly.com");
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

    const headerAdminEmail = (request.headers.get("x-admin-email") || "").trim().toLowerCase();
    const bodyAdminEmail = ((body.adminEmail as string) || "").trim().toLowerCase();
    const requestedBy = bodyAdminEmail || headerAdminEmail || "shsvirtualadmin@gmail.com";

    if (!isAdminEmail(requestedBy)) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden: Access restricted to authorized administrators." }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { label, customCode, maxRedemptions, expiresDays } = body;
    if (!label || !String(label).trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "A label or campaign name is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    let finalCode = "";
    if (customCode && String(customCode).trim()) {
      finalCode = String(customCode).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    } else {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let rand = "";
      for (let i = 0; i < 5; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      finalCode = `BOARDLY-1Y-${rand}`;
    }

    let expiresAt: string | null = null;
    if (expiresDays && Number(expiresDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000).toISOString();
    }

    // Default to 1-time use
    let parsedMaxRedemptions: number | null = 1;
    if (maxRedemptions === null || maxRedemptions === "unlimited" || maxRedemptions === 0) {
      parsedMaxRedemptions = null;
    } else if (maxRedemptions !== undefined && Number(maxRedemptions) > 0) {
      parsedMaxRedemptions = Number(maxRedemptions);
    }

    const newLink = {
      id: "promo_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      code: finalCode,
      label: String(label).trim(),
      discount_type: "1_year_free_pro",
      duration_months: 12,
      max_redemptions: parsedMaxRedemptions,
      redemption_count: 0,
      is_active: true,
      created_by: requestedBy,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      redemptions: [],
    };

    return new Response(JSON.stringify({ success: true, link: newLink }), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to create promo link." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

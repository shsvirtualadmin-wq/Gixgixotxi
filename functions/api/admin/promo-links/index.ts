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
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    },
  });
};

export const onRequestGet = async (context: PagesContext) => {
  const { request } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    "Content-Type": "application/json",
  };

  const adminEmail = url.searchParams.get("adminEmail") || request.headers.get("x-admin-email") || "";
  if (adminEmail && !isAdminEmail(adminEmail)) {
    return new Response(
      JSON.stringify({ success: false, error: "Forbidden: Access restricted to authorized administrators." }),
      { status: 403, headers: corsHeaders }
    );
  }

  // Return active fallback link for promo manager
  const defaultLinks = [
    {
      id: "promo_1y_free_official",
      code: "BOARDLY-1Y-PRO",
      label: "Official 1-Year Free Boardly Pro Campaign",
      discount_type: "1_year_free_pro",
      duration_months: 12,
      max_redemptions: 1,
      redemption_count: 0,
      is_active: true,
      created_by: "shsvirtualadmin@gmail.com",
      created_at: new Date().toISOString(),
      expires_at: null,
      redemptions: [],
    },
  ];

  return new Response(JSON.stringify({ success: true, links: defaultLinks }), {
    status: 200,
    headers: corsHeaders,
  });
};

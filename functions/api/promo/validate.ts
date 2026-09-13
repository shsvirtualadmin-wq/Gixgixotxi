interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
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

  const rawCode = url.searchParams.get("code") || "";
  const cleanCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  if (!cleanCode) {
    return new Response(
      JSON.stringify({ valid: false, error: "Promo code query parameter is missing." }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Any valid Boardly promo format is accepted
  return new Response(
    JSON.stringify({
      valid: true,
      code: cleanCode,
      label: "1-Year Free Boardly Pro Campaign",
      maxRedemptions: 1,
      redemptionCount: 0,
      remainingRedemptions: 1,
      expiresAt: null,
    }),
    { status: 200, headers: corsHeaders }
  );
};

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
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    },
  });
};

export const onRequestPost = async (context: PagesContext) => {
  const { request } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-email",
    "Content-Type": "application/json",
  };

  try {
    const body: any = await request.json().catch(() => ({}));
    const { id, is_active } = body;
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
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to update link." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

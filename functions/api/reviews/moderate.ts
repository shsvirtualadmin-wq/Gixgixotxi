export async function onRequestPost(context: any) {
  try {
    const { request } = context;
    const body: any = await request.json().catch(() => ({}));
    const { adminUid, reviewAuthorUid, action, reason } = body;

    if (!adminUid) {
      return new Response(JSON.stringify({ error: "Admin authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // MANDATORY CONSTRAINT: Trying to approve your own review MUST fail
    if (action === "approve" && adminUid === reviewAuthorUid) {
      return new Response(
        JSON.stringify({
          error: "Conflict: You cannot approve your own submitted review.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        reason: reason || "",
        moderatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

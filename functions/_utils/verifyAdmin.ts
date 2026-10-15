/**
 * verifyAdmin.ts
 *
 * Server-side Firebase ID-token verification for Cloudflare Pages Functions.
 * Uses the Firebase REST "accounts:lookup" endpoint so no Admin SDK is required.
 *
 * Usage:
 *   import { requireAdmin } from "../_utils/verifyAdmin.js";
 *   const adminEmail = await requireAdmin(request, env); // throws Response on failure
 */

/** Canonical admin email list – must match the client-side ADMIN_EMAILS constant. */
const ADMIN_EMAILS: readonly string[] = [
  "shsvirtualadmin@gmail.com",
  "support@boardly.cfd",
];

/**
 * The Firebase Web API key for project boardly-8c0cd.
 * This is the **public** key already embedded in the frontend bundle.
 * Cloudflare workers can also override it via VITE_FIREBASE_API_KEY env var.
 */
const FIREBASE_PUBLIC_API_KEY = "AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs";

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns null if missing or malformed.
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1] || null;
}

/**
 * Verifies a Firebase ID token via the REST accounts:lookup API.
 * Returns the email from the verified token, or throws a Response object.
 *
 * @param request  - The incoming Cloudflare Pages Request
 * @param env      - The Cloudflare Pages env bindings (for optional VITE_FIREBASE_API_KEY override)
 * @returns        The verified email address (always lowercase)
 * @throws         A Response with 401 or 403 status on auth failure
 */
export async function requireAdmin(
  request: Request,
  env: Record<string, string | undefined>
): Promise<string> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  const idToken = extractBearerToken(request);
  if (!idToken) {
    throw new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Missing or invalid Authorization header." }),
      { status: 401, headers: corsHeaders }
    );
  }

  // Resolve the Firebase API key (prefer env var for future flexibility)
  const apiKey =
    (env?.VITE_FIREBASE_API_KEY || env?.FIREBASE_API_KEY || FIREBASE_PUBLIC_API_KEY).trim();

  let verifiedEmail: string | null = null;

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.warn("[verifyAdmin] Firebase token lookup failed:", resp.status, errText);
      throw new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Token verification failed." }),
        { status: 401, headers: corsHeaders }
      );
    }

    const data: any = await resp.json();
    const users: any[] = data?.users || [];
    if (!users.length || !users[0]?.email) {
      throw new Response(
        JSON.stringify({ success: false, error: "Unauthorized: No user associated with this token." }),
        { status: 401, headers: corsHeaders }
      );
    }
    verifiedEmail = String(users[0].email).trim().toLowerCase();
  } catch (err: any) {
    // Re-throw Response objects as-is; wrap network errors
    if (err instanceof Response) throw err;
    console.error("[verifyAdmin] Token verification exception:", err?.message || err);
    throw new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Could not verify identity token." }),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!isAdminEmail(verifiedEmail)) {
    // Check if role = 'admin' in Supabase profiles or students table
    try {
      const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
      const serviceKey =
        env.SUPABASE_SERVICE_ROLE_KEY ||
        env.SUPABASE_SERVICE_KEY ||
        env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
        env.VITE_SUPABASE_ANON_KEY ||
        env.SUPABASE_ANON_KEY ||
        "";
      if (url && serviceKey) {
        const { createClient } = await import("./supabaseStub.js");
        const client = createClient(url, serviceKey);
        if (client) {
          const { data: p } = await client.from("profiles").select("role").ilike("email", verifiedEmail).maybeSingle();
          if (p?.role === "admin") {
            return verifiedEmail;
          }
          const { data: s } = await client.from("students").select("role").ilike("email", verifiedEmail).maybeSingle();
          if (s?.role === "admin") {
            return verifiedEmail;
          }
        }
      }
    } catch (checkErr) {
      console.warn("[verifyAdmin] Database admin role lookup exception:", checkErr);
    }

    throw new Response(
      JSON.stringify({
        success: false,
        error: "Forbidden: Access restricted to authorized administrators.",
      }),
      { status: 403, headers: corsHeaders }
    );
  }

  return verifiedEmail;
}

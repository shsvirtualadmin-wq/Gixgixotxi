import { createClient } from "@supabase/supabase-js";

interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

function getSupabaseAdminClient(env: Record<string, any>) {
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
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;
    const userId = (formData.get("userId") as string || "").trim();
    const userEmail = (formData.get("userEmail") as string || "").trim().toLowerCase();

    if (!file || typeof file.arrayBuffer !== "function") {
      return new Response(
        JSON.stringify({ success: false, error: "No image file provided. Please choose a picture to upload." }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!userId && !userEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "User identification is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate size (5MB limit)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return new Response(
        JSON.stringify({ success: false, error: "Image exceeds 5MB limit. Please select a smaller photo." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type
    const mime = file.type.toLowerCase();
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/svg+xml",
    ];

    if (!allowedMimes.includes(mime) && !mime.startsWith("image/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Please upload a valid image file (JPEG, PNG, WebP, GIF, AVIF)." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Empty file buffer. Please select a valid picture." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const safeId = (userId || userEmail).replace(/[^a-zA-Z0-9_-]/g, "_");
    const timestamp = Date.now();
    let ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ext || ext.length > 5 || ext === ".") {
      ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : mime.includes("gif") ? ".gif" : ".jpg";
    }

    const filename = `avatar-${safeId}-${timestamp}${ext}`;
    const objectKey = `avatars/${filename}`;

    // Upload to Cloudflare R2 native bucket binding if available
    const r2Bucket = env.AVATARS_BUCKET || env.RESOURCES_BUCKET || env.R2_BUCKET;
    let r2Uploaded = false;

    if (r2Bucket && typeof r2Bucket.put === "function") {
      try {
        await r2Bucket.put(objectKey, arrayBuffer, {
          httpMetadata: {
            contentType: file.type || "image/jpeg",
            contentDisposition: `inline; filename="${filename}"`,
          },
          customMetadata: {
            userId: safeId,
            userEmail,
            uploadedAt: new Date().toISOString(),
          },
        });
        r2Uploaded = true;
      } catch (r2Err: any) {
        console.warn("[Cloudflare Pages R2 Put error]:", r2Err?.message);
      }
    }

    // Compute public file URL
    const publicDomain = (
      env.PUBLIC_R2_DOMAIN ||
      env.R2_PUBLIC_DOMAIN ||
      env.VITE_R2_PUBLIC_DOMAIN ||
      "pub-51ccade1f191417389ac7df61830c670.r2.dev"
    ).replace(/\/$/, "");

    const avatarUrl = publicDomain.startsWith("http")
      ? `${publicDomain}/${objectKey}`
      : `https://${publicDomain}/${objectKey}`;

    // Update student database record in Supabase
    const db = getSupabaseAdminClient(env);
    let updatedProfile = null;

    if (db) {
      try {
        let query = db.from("students").update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

        if (userId) {
          query = query.eq("id", userId);
        } else {
          query = query.eq("email", userEmail);
        }

        const { data, error } = await query.select("*").maybeSingle();
        if (!error && data) {
          updatedProfile = data;
        }

        // Also update auth user metadata if admin client is available
        if (userId && (db as any).auth?.admin) {
          await (db as any).auth.admin
            .updateUserById(userId, {
              user_metadata: { avatar_url: avatarUrl, picture: avatarUrl },
            })
            .catch(() => {});
        }
      } catch (dbErr: any) {
        console.warn("[upload-avatar db error]:", dbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        avatarUrl,
        r2Uploaded,
        profile: updatedProfile,
        message: "Profile picture updated successfully!",
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[functions/api/user/upload-avatar error]:", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Failed to upload profile picture." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

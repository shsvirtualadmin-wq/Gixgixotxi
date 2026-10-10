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

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

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
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string || "").trim();
    const subject = (formData.get("subject") as string || "").trim() || "General";
    const targetClass = (formData.get("class") as string || "").trim() || "All";
    const category = (formData.get("category") as string || "").trim() as "past_paper" | "mcq_drill";
    const requesterEmail = (formData.get("requesterEmail") as string || "").trim().toLowerCase();

    // Check admin authorization
    const isAdmin = Boolean(requesterEmail && ADMIN_EMAILS.includes(requesterEmail));
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Only administrators can upload resources." }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing or invalid file. Please attach a PDF file." }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!title) {
      return new Response(
        JSON.stringify({ success: false, error: "Resource title is required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (category !== "past_paper" && category !== "mcq_drill") {
      return new Response(
        JSON.stringify({ success: false, error: "Category must be 'past_paper' or 'mcq_drill'." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate clean file name and object key
    const sanitizedFileName = (file.name || "document.pdf").replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const objectKey = `resources/${category}/${timestamp}-${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength < 64) {
      return new Response(
        JSON.stringify({ success: false, error: "Upload failed — file appears corrupted, please try again" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify PDF Magic Bytes (%PDF-) within the first 1024 bytes
    const inspectLength = Math.min(1024, arrayBuffer.byteLength);
    const headerBytes = new Uint8Array(arrayBuffer.slice(0, inspectLength));
    let headerText = "";
    for (let i = 0; i < inspectLength; i++) {
      headerText += String.fromCharCode(headerBytes[i]);
    }

    if (!headerText.includes("%PDF-")) {
      return new Response(
        JSON.stringify({ success: false, error: "Upload failed — file appears corrupted, please try again" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const fileSizeFormatted = formatBytes(file.size || arrayBuffer.byteLength);

    // Native Cloudflare R2 Upload via env.RESOURCES_BUCKET binding
    const r2Bucket = env.RESOURCES_BUCKET;
    if (r2Bucket && typeof r2Bucket.put === "function") {
      await r2Bucket.put(objectKey, arrayBuffer, {
        httpMetadata: {
          contentType: file.type || "application/pdf",
          contentDisposition: `inline; filename="${sanitizedFileName}"`,
        },
        customMetadata: {
          title,
          subject,
          class: targetClass,
          category,
          uploadedBy: requesterEmail,
          size: fileSizeFormatted,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    // Compute public file URL
    const publicDomain = (
      env.PUBLIC_R2_DOMAIN ||
      env.R2_PUBLIC_DOMAIN ||
      env.VITE_R2_PUBLIC_DOMAIN ||
      "pub-51ccade1f191417389ac7df61830c670.r2.dev"
    ).replace(/\/$/, "");

    const fileUrl = publicDomain.startsWith("http")
      ? `${publicDomain}/${objectKey}`
      : `https://${publicDomain}/${objectKey}`;

    // Insert record into Supabase resources table
    const db = getSupabaseAdminClient(env);
    const newResource = {
      title,
      subject,
      class: targetClass,
      category,
      file_url: fileUrl,
      file_size: fileSizeFormatted,
      uploaded_by: requesterEmail,
      created_at: new Date().toISOString(),
    };

    let savedData = null;
    if (db) {
      const { data, error } = await db.from("resources").insert([newResource]).select().single();
      if (error) {
        console.error("Error inserting resource into Supabase:", error);
      } else {
        savedData = data;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        resource: savedData || {
          id: `res-${timestamp}`,
          ...newResource,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error uploading resource:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to process resource upload." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

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

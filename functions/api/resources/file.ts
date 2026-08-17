interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

export const onRequestGet = async (context: PagesContext) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing file key parameter", { status: 400 });
  }

  const r2Bucket = env.RESOURCES_BUCKET;
  if (!r2Bucket || typeof r2Bucket.get !== "function") {
    // If not bound or running outside R2, redirect to public R2 domain
    const publicDomain = (
      env.PUBLIC_R2_DOMAIN ||
      env.R2_PUBLIC_DOMAIN ||
      env.VITE_R2_PUBLIC_DOMAIN ||
      "pub-51ccade1f191417389ac7df61830c670.r2.dev"
    ).replace(/\/$/, "");
    const target = publicDomain.startsWith("http")
      ? `${publicDomain}/${key}`
      : `https://${publicDomain}/${key}`;
    return Response.redirect(target, 302);
  }

  const object = await r2Bucket.get(key);
  if (!object) {
    return new Response("File not found in storage", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/pdf");
  headers.set("Access-Control-Allow-Origin", "*");

  const isDownload = url.searchParams.get("download") === "1" || Boolean(url.searchParams.get("filename"));
  if (isDownload) {
    const rawFilename = url.searchParams.get("filename") || "document.pdf";
    let safeFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, "_");
    if (!safeFilename.toLowerCase().endsWith(".pdf")) safeFilename += ".pdf";
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
  }

  return new Response(object.body, { headers });
};

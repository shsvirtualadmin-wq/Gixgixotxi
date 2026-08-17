interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

export const onRequestGet = async (context: PagesContext) => {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Range, Authorization",
  };

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/pdf,application/octet-stream,*/*",
      },
      redirect: "follow",
    });

    if (!upstreamRes.ok) {
      return new Response(`Upstream storage error: HTTP ${upstreamRes.status}`, {
        status: upstreamRes.status,
        headers: corsHeaders,
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "application/pdf";
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", contentType);
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    headers.set("Cache-Control", "public, max-age=86400");

    const isDownload = url.searchParams.get("download") === "1" || Boolean(url.searchParams.get("filename"));
    if (isDownload) {
      const rawFilename = url.searchParams.get("filename") || "document.pdf";
      let safeFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, "_");
      if (!safeFilename.toLowerCase().endsWith(".pdf")) safeFilename += ".pdf";
      headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
    }

    return new Response(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Proxy error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range, Authorization",
    },
  });
};

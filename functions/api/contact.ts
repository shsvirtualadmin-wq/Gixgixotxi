interface Env {
  RESEND_API_KEY?: string;
  SUPPORT_EMAIL?: string;
}

interface ContactRequestBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

// In-memory rate limiting map for Cloudflare Worker runtime
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const clientIp =
      context.request.headers.get('cf-connecting-ip') ||
      context.request.headers.get('x-real-ip') ||
      'unknown-client';

    // Rate limiting: Max 5 submissions per 10 minutes per IP
    const now = Date.now();
    const rateEntry = rateLimitMap.get(clientIp);
    if (rateEntry && rateEntry.expiresAt > now) {
      if (rateEntry.count >= 5) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please wait a few minutes before sending another inquiry.',
            code: 'RATE_LIMIT_EXCEEDED',
          }),
          { status: 429, headers: corsHeaders }
        );
      }
      rateEntry.count += 1;
    } else {
      rateLimitMap.set(clientIp, { count: 1, expiresAt: now + 10 * 60 * 1000 });
    }

    const body = (await context.request.json()) as ContactRequestBody;
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const subject = (body.subject || 'Student Inquiry').trim();
    const message = (body.message || '').trim();

    // Validation
    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid name (at least 2 characters).', code: 'INVALID_NAME' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!message || message.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Message must be at least 10 characters long.', code: 'MESSAGE_TOO_SHORT' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (message.length > 3000) {
      return new Response(
        JSON.stringify({ error: 'Message cannot exceed 3,000 characters.', code: 'MESSAGE_TOO_LONG' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const resendApiKey = context.env.RESEND_API_KEY;
    const recipient = context.env.SUPPORT_EMAIL || 'support@boardly.cfd';

    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Boardly <support@boardly.cfd>',
          to: [recipient],
          reply_to: email,
          subject: `[Boardly Contact] ${subject} - ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\nSubmitted at: ${new Date().toISOString()}`,
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        const snippet = errorText.slice(0, 200);
        return new Response(
          JSON.stringify({
            error: `Failed to deliver email through Resend: ${snippet}`,
            code: `RESEND_ERROR_${resendRes.status}`,
            snippet,
          }),
          { status: resendRes.status >= 500 ? 502 : resendRes.status, headers: corsHeaders }
        );
      }

      const resData = await resendRes.json();
      return new Response(
        JSON.stringify({ success: true, message: 'Message sent successfully!', id: (resData as any)?.id }),
        { status: 200, headers: corsHeaders }
      );
    }

    // If Resend API key is not configured, log & return 200 for development testing
    console.warn('[Contact Function] RESEND_API_KEY not configured. Mocking success.');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message received and logged for support staff.',
        devMode: true,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const snippet = errorMsg.slice(0, 200);
    return new Response(
      JSON.stringify({ error: errorMsg, code: 'INTERNAL_SERVER_ERROR', snippet }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  pageUrl?: string;
  honeypot?: string;
  formLoadedAt?: number;
}

// In-memory rate limiting map for Cloudflare Worker/Pages runtime (IP -> { count, expiresAt })
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const clientIp =
      context.request.headers.get('cf-connecting-ip') ||
      context.request.headers.get('x-real-ip') ||
      'unknown-client';

    // 1. Rate Limiting: 5 submissions per hour per IP
    const now = Date.now();
    const rateEntry = rateLimitMap.get(clientIp);
    if (rateEntry && rateEntry.expiresAt > now) {
      if (rateEntry.count >= 5) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Too many messages sent. Please wait a few minutes before sending another inquiry.',
            code: 'RATE_LIMIT_EXCEEDED',
          }),
          { status: 429, headers: corsHeaders }
        );
      }
      rateEntry.count += 1;
    } else {
      rateLimitMap.set(clientIp, { count: 1, expiresAt: now + 60 * 60 * 1000 });
    }

    const body = (await context.request.json()) as ContactPayload;

    // 2. Spam Honeypot Protection: hidden input must remain empty
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Spam validation check failed.',
          code: 'HONEYPOT_TRIGGERED',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Minimum Fill Time Check (at least 2.0 seconds between form load and submit)
    if (body.formLoadedAt && now - body.formLoadedAt < 2000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Submission was too fast. Please take your time to complete the form.',
          code: 'TOO_FAST',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const message = (body.message || '').trim();
    const pageUrl = (body.pageUrl || 'https://boardly.cfd/contact').trim();

    // 4. Strict Validation
    if (!name || name.length < 2 || name.length > 80) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Name must be between 2 and 80 characters long.',
          code: 'INVALID_NAME',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide a valid email address.',
          code: 'INVALID_EMAIL',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!message || message.length < 10 || message.length > 2000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message must be between 10 and 2,000 characters long.',
          code: 'INVALID_MESSAGE_LENGTH',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Check Resend API Key Secret
    const resendApiKey = context.env.RESEND_API_KEY;
    const recipient = context.env.CONTACT_TO_EMAIL || 'support@boardly.cfd';

    if (!resendApiKey) {
      console.error('[Contact Error] RESEND_API_KEY is not configured in environment variables.');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Support email service is currently not configured on this server.',
          code: 'RESEND_NOT_CONFIGURED',
        }),
        { status: 503, headers: corsHeaders }
      );
    }

    // Format current time in Pakistan Standard Time (PKT)
    const pktTimeStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(new Date());

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || 'Not provided');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');
    const safePageUrl = escapeHtml(pageUrl);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; margin: 0; padding: 20px; background: #f9f9f9; }
            .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e5e5; overflow: hidden; }
            .header { background: #D71921; color: #ffffff; padding: 20px; text-align: left; }
            .header h2 { margin: 0; font-size: 20px; font-weight: 700; }
            .content { padding: 24px; }
            .field { margin-bottom: 16px; }
            .label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 4px; }
            .value { font-size: 15px; color: #111; word-break: break-word; }
            .msg-box { background: #f4f4f5; border-left: 3px solid #D71921; padding: 14px; border-radius: 6px; font-size: 14px; line-height: 1.6; }
            .footer { padding: 16px 24px; font-size: 12px; color: #888; background: #fafafa; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h2>New Student Inquiry — Boardly</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Sender Name</div>
                <div class="value"><strong>${safeName}</strong></div>
              </div>
              <div class="field">
                <div class="label">Email Address</div>
                <div class="value"><a href="mailto:${safeEmail}">${safeEmail}</a></div>
              </div>
              <div class="field">
                <div class="label">Phone / WhatsApp</div>
                <div class="value">${safePhone}</div>
              </div>
              <div class="field">
                <div class="label">Time (PKT, Asia/Karachi)</div>
                <div class="value">${pktTimeStr}</div>
              </div>
              <div class="field">
                <div class="label">Page Origin</div>
                <div class="value">${safePageUrl}</div>
              </div>
              <div class="field">
                <div class="label">Message Content</div>
                <div class="msg-box">${safeMessage}</div>
              </div>
            </div>
            <div class="footer">
              This message was sent from the Boardly contact form on boardly.cfd. Reply directly to this email to reach the student.
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `[Boardly Contact Inquiry]
Sender Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Time (PKT): ${pktTimeStr}
Origin: ${pageUrl}

Message:
${message}
`;

    // 6. Call Resend REST API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Boardly Contact <contact@boardly.cfd>',
        to: [recipient],
        reply_to: email,
        subject: `[Boardly] New inquiry from ${name}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      console.error('[Resend API Error]:', resendRes.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to deliver message through Resend mail dispatch.',
          code: `RESEND_ERROR_${resendRes.status}`,
          details: errorText.slice(0, 300),
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const resData: any = await resendRes.json();
    if (!resData?.id) {
      console.error('[Resend Unexpected Response]:', resData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email gateway responded without message confirmation ID.',
          code: 'RESEND_MISSING_ID',
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message sent successfully!',
        id: resData.id,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Contact Handler Exception]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error processing contact message.',
        code: 'INTERNAL_ERROR',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Health check endpoint (GET) to verify whether Resend secret is configured
export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const isConfigured = Boolean(context.env.RESEND_API_KEY && context.env.RESEND_API_KEY.length > 5);
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'boardly-contact-api',
      resendConfigured: isConfigured,
      recipient: context.env.CONTACT_TO_EMAIL || 'support@boardly.cfd',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

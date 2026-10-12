/**
 * Cloudflare Pages Function: /api/contact
 * Handles student contact/enquiry submissions and health checks.
 * Uses only Cloudflare Workers runtime APIs: Request, Response, fetch, crypto.subtle.
 */

interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

// In-memory sliding rate limiter (3 requests per hour per IP or email)
interface RateRecord {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateRecord>();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count += 1;
  return false;
}

// Periodic cleanup of stale rate limits
function cleanupRateLimits() {
  const now = Date.now();
  if (rateLimits.size > 500) {
    for (const [key, record] of rateLimits.entries()) {
      if (now > record.resetAt) {
        rateLimits.delete(key);
      }
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Health check endpoint
 * GET /api/contact -> { ok: true, configured: { resend: boolean, firestore: boolean } }
 */
export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const { env } = context;

  const resendConfigured = Boolean(env.RESEND_API_KEY && String(env.RESEND_API_KEY).trim().length > 0);
  const firestoreConfigured = Boolean(
    (env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || env.GOOGLE_SERVICE_ACCOUNT_KEY)
  );

  return new Response(
    JSON.stringify({
      ok: true,
      configured: {
        resend: resendConfigured,
        firestore: firestoreConfigured,
      },
    }),
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
};

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

/**
 * Main form handler
 * POST /api/contact
 */
export const onRequestPost = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;

  console.log('[contact] Request received');

  try {
    cleanupRateLimits();

    // Extract client IP
    const clientIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown-ip';

    // Parse JSON or form data
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, any> = {};

    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid JSON request payload.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }
    } else if (contentType.includes('form')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        body[key] = value.toString();
      }
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: 'Unsupported Content-Type header. Expected application/json.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const topic = String(body.topic || body.category || 'General Academic').trim();
    const message = String(body.message || '').trim();
    const honeypot = String(body._hp || body.honeypot || body.company || body.website || '').trim();
    const renderedAt = Number(body.renderedAt || body.timestamp || 0);

    // 1. Honeypot check
    if (honeypot) {
      console.log('[contact] Honeypot triggered, discarding silently');
      return new Response(
        JSON.stringify({ ok: false, error: 'Spam submission detected.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 2. Minimum 3 seconds check
    if (renderedAt > 0) {
      const elapsed = Date.now() - renderedAt;
      if (elapsed < 3000) {
        console.log('[contact] Submission was too quick (<3s)');
        return new Response(
          JSON.stringify({ ok: false, error: 'Submission was too fast. Please take a moment to review your message.' }),
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

    // 3. Field Validations
    if (!name || name.length < 2 || name.length > 80) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Name must be between 2 and 80 characters.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 100) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Please provide a valid email address.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!message || message.length < 10 || message.length > 2000) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Message must be between 10 and 2000 characters.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (phone.length > 30) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Phone number is too long (maximum 30 characters).' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 4. Rate Limiting (3 per hour per IP and per Email)
    if (clientIp !== 'unknown-ip' && isRateLimited(`ip:${clientIp}`)) {
      console.log('[contact] Rate limit exceeded for IP');
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Rate limit reached: maximum 3 inquiries per hour. Please message us on WhatsApp for urgent assistance.',
        }),
        { status: 429, headers: CORS_HEADERS }
      );
    }

    if (isRateLimited(`email:${email}`)) {
      console.log('[contact] Rate limit exceeded for email');
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Rate limit reached: maximum 3 inquiries per hour for this email. Please message us on WhatsApp for urgent assistance.',
        }),
        { status: 429, headers: CORS_HEADERS }
      );
    }

    console.log('[contact] Validation passed');

    // Ticket Identifier
    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();
    let emailStatus = 'pending';

    // 5. Save to Firestore "supportTickets" collection first (named database)
    const projectId =
      env.FIREBASE_PROJECT_ID ||
      env.VITE_FIREBASE_PROJECT_ID ||
      'gen-lang-client-0365509316';
    const databaseId =
      env.FIREBASE_DATABASE_ID ||
      env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
      'ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712';
    const apiKey =
      env.FIREBASE_API_KEY ||
      env.VITE_FIREBASE_API_KEY ||
      'AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs';

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/${encodeURIComponent(databaseId)}/documents/supportTickets?documentId=${encodeURIComponent(
      ticketId
    )}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;

    try {
      const fsRes = await fetch(firestoreUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            ticketId: { stringValue: ticketId },
            name: { stringValue: name },
            email: { stringValue: email },
            phone: { stringValue: phone },
            topic: { stringValue: topic },
            message: { stringValue: message },
            source: { stringValue: 'contact_form' },
            status: { stringValue: 'new' },
            emailStatus: { stringValue: emailStatus },
            clientIp: { stringValue: clientIp },
            createdAt: { timestampValue: nowIso },
          },
        }),
      });

      if (fsRes.ok) {
        console.log('[contact] Saved to Firestore');
      } else {
        console.error('[contact] Firestore save error status:', fsRes.status);
      }
    } catch (fsErr) {
      console.error('[contact] Firestore connection error');
    }

    // 6. Send Email through Resend HTTP API
    const resendApiKey = env.RESEND_API_KEY;
    const contactTo = env.CONTACT_TO || 'support@boardly.cfd';
    const contactFrom = env.CONTACT_FROM || 'Boardly <noreply@boardly.cfd>';

    if (resendApiKey) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0A1330 0%, #1E5AFF 100%); padding: 24px 32px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 800;">Boardly Student Inquiry</h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Ticket ID: ${ticketId}</p>
            </div>
            <div style="padding: 28px 32px; font-size: 14px; line-height: 1.6;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 100px; font-weight: 600;">Student:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #2563eb;"><a href="mailto:${escapeHtml(email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(email)}</a></td>
                </tr>
                ${phone ? `<tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phone:</td><td style="padding: 8px 0; color: #0f172a;">${escapeHtml(phone)}</td></tr>` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Topic:</td>
                  <td style="padding: 8px 0; color: #4338ca; font-weight: 700;">${escapeHtml(topic)}</td>
                </tr>
              </table>
              <div style="margin-top: 16px; padding: 16px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #4f46e5;">
                <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Message</div>
                <div style="color: #0f172a; white-space: pre-wrap; word-break: break-word;">${escapeHtml(message)}</div>
              </div>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 12px; color: #94a3b8; text-align: center;">
              Routed via Cloudflare Pages Function to ${escapeHtml(contactTo)}
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = `Boardly Inquiry [${topic}]\nTicket: ${ticketId}\n\nStudent: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nTopic: ${topic}\n\nMessage:\n${message}\n\nSubmitted: ${nowIso}`;

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: contactFrom,
            to: [contactTo],
            reply_to: email,
            subject: `[Boardly Inquiry] [${topic}] New message from ${name}`,
            html: emailHtml,
            text: emailText,
          }),
        });

        if (resendRes.ok) {
          console.log('[contact] Email sent');
          emailStatus = 'sent';
        } else {
          console.error('[contact] Resend error code:', resendRes.status);
          emailStatus = 'failed';
        }
      } catch (err) {
        console.error('[contact] Resend network error');
        emailStatus = 'failed';
      }

      // Send confirmation to the student (ignore failure if any)
      try {
        const studentConfirmHtml = `
          <!DOCTYPE html>
          <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
            <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <h2 style="color: #0A1330; margin-top: 0;">We received your inquiry</h2>
              <p>Hi ${escapeHtml(name)},</p>
              <p>Thank you for reaching out to Boardly Academic Support. Our team has received your message regarding <strong>${escapeHtml(topic)}</strong> (Reference: <code>${ticketId}</code>) and will get back to you shortly.</p>
              <div style="padding: 14px; background: #f1f5f9; border-radius: 10px; border-left: 3px solid #6366f1; margin: 18px 0; font-size: 13px; color: #334155;">
                ${escapeHtml(message).replace(/\n/g, '<br/>')}
              </div>
              <p style="font-size: 13px; color: #64748b;">If your query is urgent, you can also reach our team directly via WhatsApp: <a href="https://wa.me/923058969050" style="color: #2563eb;">+92 305 8969050</a>.</p>
              <p style="margin-bottom: 0; font-size: 13px; color: #334155;">Best regards,<br/><strong>Boardly Academic Team</strong><br/><a href="https://boardly.cfd" style="color: #2563eb;">boardly.cfd</a></p>
            </div>
          </body>
          </html>
        `;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: contactFrom,
            to: [email],
            subject: 'We received your message - Boardly Academic Support',
            html: studentConfirmHtml,
            text: `Hi ${name},\n\nWe received your inquiry regarding "${topic}" (Ref: ${ticketId}). Our team will get back to you shortly.\n\nSummary:\n${message}\n\nBest regards,\nBoardly Academic Team\nhttps://boardly.cfd`,
          }),
        });
      } catch {
        // Confirmation email to student failure is safely ignored
      }
    } else {
      console.log('[contact] RESEND_API_KEY not configured, skipping email dispatch');
      emailStatus = 'skipped';
    }

    // Always return { ok: true } if validated and saved to Firestore (even if email failed)
    return new Response(
      JSON.stringify({
        ok: true,
        success: true,
        message: 'Your inquiry has been received. Our team will get back to you shortly.',
        ticketId,
        emailStatus,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('[contact] Unhandled error code 500');
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'An internal error occurred while processing your inquiry. Please try again or message via WhatsApp.',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

/**
 * Cloudflare Pages Function: /api/crew/notify
 * Handles email notifications for Boardly Crew:
 * 1. Admin notification on application submission (to support@boardly.cfd & shsvirtualadmin@gmail.com)
 * 2. Applicant approval notification with referral code & premium access details
 * 3. Applicant rejection notification with optional feedback note
 */

interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const { env } = context;
  return new Response(
    JSON.stringify({
      ok: true,
      service: 'boardly-crew-notifications',
      configured: {
        resend: Boolean(env.RESEND_API_KEY),
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
    headers: CORS_HEADERS,
  });
};

export const onRequestPost = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;

  console.log('[crew/notify] Notification request received');

  try {
    const body = await request.json() as Record<string, any>;
    const type = String(body.type || 'submit').trim();

    const resendApiKey = env.RESEND_API_KEY;
    const fromAddress = env.CONTACT_FROM || 'Boardly <noreply@boardly.cfd>';
    const adminRecipients = ['support@boardly.cfd', 'shsvirtualadmin@gmail.com'];

    // 1. SUBMISSION NOTIFICATION (Sent to Admins)
    if (type === 'submit') {
      const name = String(body.name || body.fullName || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const phone = String(body.phone || '').trim();
      const institution = String(body.institution || '').trim();
      const promotionPlan = String(body.promotionPlan || '').trim();
      const nowIso = new Date().toISOString();

      console.log(`[crew/notify] Sending admin notification for applicant: ${name} (${institution})`);

      if (!resendApiKey) {
        console.warn('[crew/notify] RESEND_API_KEY not configured. Skipping email dispatch.');
        return new Response(
          JSON.stringify({ ok: true, notice: 'RESEND_API_KEY missing, logged locally' }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0A1330 0%, #4338ca 100%); padding: 26px 32px; color: #ffffff;">
              <span style="display: inline-block; background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                Boardly Crew Application
              </span>
              <h2 style="margin: 0; font-size: 22px; font-weight: 800;">New Ambassador Application</h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Submitted at ${nowIso}</p>
            </div>
            <div style="padding: 28px 32px; font-size: 14px; line-height: 1.6;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 120px; font-weight: 600;">Applicant:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${escapeHtml(name)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email:</td>
                  <td style="padding: 8px 0; color: #2563eb;"><a href="mailto:${escapeHtml(email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(email)}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phone:</td>
                  <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${escapeHtml(phone)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Institution:</td>
                  <td style="padding: 8px 0; color: #4338ca; font-weight: 700;">${escapeHtml(institution)}</td>
                </tr>
              </table>
              <div style="margin-top: 16px; padding: 16px; background-color: #f1f5f9; border-radius: 12px; border-left: 4px solid #4f46e5;">
                <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em;">Campus Promotion Plan</div>
                <div style="color: #0f172a; white-space: pre-wrap; word-break: break-word;">${escapeHtml(promotionPlan)}</div>
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://boardly.cfd/admin" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px;">
                  Open Admin Dashboard &rarr;
                </a>
              </div>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 32px; font-size: 12px; color: #94a3b8; text-align: center;">
              Boardly Ambassador Dispatch · Routed via Cloudflare Pages Function
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: adminRecipients,
            reply_to: email,
            subject: `[Boardly Crew] New Ambassador Application: ${name} (${institution})`,
            html: emailHtml,
            text: `New Boardly Crew Application\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nInstitution: ${institution}\n\nPromotion Plan:\n${promotionPlan}\n\nReview at: https://boardly.cfd/admin`,
          }),
        });

        if (resendRes.ok) {
          console.log('[crew/notify] Admin notification email sent successfully');
        } else {
          console.error('[crew/notify] Resend error for admin notification:', resendRes.status);
        }
      } catch (err) {
        console.error('[crew/notify] Resend fetch exception:', err);
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
    }

    // 2. APPROVAL NOTIFICATION (Sent to Student)
    if (type === 'approve') {
      const applicantEmail = String(body.to || body.email || '').trim().toLowerCase();
      const applicantName = String(body.name || body.fullName || 'Student').trim();
      const referralCode = String(body.referralCode || '').trim();
      const institution = String(body.institution || '').trim();

      if (!applicantEmail) {
        return new Response(JSON.stringify({ ok: false, error: 'Recipient email required' }), { status: 400, headers: CORS_HEADERS });
      }

      console.log(`[crew/notify] Sending approval email to: ${applicantEmail}`);

      if (!resendApiKey) {
        console.warn('[crew/notify] RESEND_API_KEY missing. Skipping email.');
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
      }

      const referralLink = `https://boardly.cfd/signup?ref=${encodeURIComponent(referralCode)}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0A1330 0%, #16a34a 100%); padding: 26px 32px; color: #ffffff;">
              <span style="display: inline-block; background: rgba(255,255,255,0.25); font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                Application Approved
              </span>
              <h2 style="margin: 0; font-size: 24px; font-weight: 800;">Welcome to Boardly Crew! 🎉</h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.95;">Official Campus Ambassador for ${escapeHtml(institution || 'your institution')}</p>
            </div>
            <div style="padding: 28px 32px; font-size: 14px; line-height: 1.6;">
              <p>Hi <strong>${escapeHtml(applicantName)}</strong>,</p>
              <p>We are excited to inform you that your application for the <strong>Boardly Crew Student Ambassador Program</strong> has been <strong>approved</strong> by our academic director team!</p>
              
              <div style="margin: 20px 0; padding: 18px; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">
                <h4 style="margin: 0 0 8px; color: #1e40af; font-size: 14px;">✨ Your Ambassador Privileges Are Active:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 13px;">
                  <li style="margin-bottom: 6px;"><strong>30 Days of Free Premium Access</strong> unlocked on your account.</li>
                  <li style="margin-bottom: 6px;">Access to the <strong>Crew Ambassador Dashboard</strong> to track signups and peer activity.</li>
                  <li style="margin-bottom: 6px;">Earn 1-Year Ambassador Tenure with 10 student signups.</li>
                  <li>Unlock Paid Remote Internship consideration at 25 signups.</li>
                </ul>
              </div>

              ${referralCode ? `
              <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Your Unique Referral Code</div>
                <div style="font-family: monospace; font-size: 20px; font-weight: 800; color: #4338ca; letter-spacing: 0.05em;">${escapeHtml(referralCode)}</div>
                <p style="font-size: 12px; color: #64748b; margin: 8px 0 0;">Link: <a href="${referralLink}" style="color: #2563eb;">${referralLink}</a></p>
              </div>
              ` : ''}

              <div style="margin: 24px 0; text-align: center;">
                <a href="https://boardly.cfd/crew-dashboard" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 13px;">
                  Open Your Crew Dashboard &rarr;
                </a>
              </div>

              <p style="font-size: 13px; color: #64748b;">If you need assistance or promotion materials, contact us on WhatsApp: <a href="https://wa.me/923058969050" style="color: #2563eb;">+92 305 8969050</a>.</p>
              <p style="margin-bottom: 0; font-size: 13px;">Best regards,<br/><strong>Boardly Academic &amp; Ambassador Team</strong><br/><a href="https://boardly.cfd" style="color: #2563eb;">boardly.cfd</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [applicantEmail],
            subject: "🎉 You're Approved for Boardly Crew!",
            html: emailHtml,
            text: `Hi ${applicantName},\n\nCongratulations! Your application for Boardly Crew has been approved.\nYour account has been upgraded to 30 Days of Free Premium Access.\n\nYour Referral Code: ${referralCode}\nYour Link: ${referralLink}\n\nAccess your dashboard at: https://boardly.cfd/crew-dashboard\n\nBest regards,\nBoardly Academic Team`,
          }),
        });
      } catch (err) {
        console.error('[crew/notify] Resend approval error:', err);
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
    }

    // 3. REJECTION NOTIFICATION (Sent to Student)
    if (type === 'reject') {
      const applicantEmail = String(body.to || body.email || '').trim().toLowerCase();
      const applicantName = String(body.name || body.fullName || 'Student').trim();
      const reason = String(body.reason || '').trim();

      if (!applicantEmail) {
        return new Response(JSON.stringify({ ok: false, error: 'Recipient email required' }), { status: 400, headers: CORS_HEADERS });
      }

      console.log(`[crew/notify] Sending rejection email to: ${applicantEmail}`);

      if (!resendApiKey) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0A1330 0%, #334155 100%); padding: 24px 30px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 800;">Boardly Crew Application Update</h2>
            </div>
            <div style="padding: 26px 30px; font-size: 14px; line-height: 1.6;">
              <p>Hi ${escapeHtml(applicantName)},</p>
              <p>Thank you for your interest in joining <strong>Boardly Crew</strong>. After careful review, our coordinator team is unable to move forward with your application for this cohort.</p>
              
              ${reason ? `
              <div style="margin: 16px 0; padding: 14px; background: #f8fafc; border-radius: 10px; border-left: 3px solid #64748b; font-size: 13px; color: #334155;">
                <strong>Coordinator Feedback:</strong><br/>
                ${escapeHtml(reason)}
              </div>
              ` : ''}

              <p style="font-size: 13px; color: #64748b;">You can continue preparing with diagnostic mock tests and AI drills on Boardly. Applications for upcoming cohorts will reopen in the future.</p>
              <p style="margin-bottom: 0; font-size: 13px;">Best regards,<br/><strong>Boardly Academic Team</strong><br/><a href="https://boardly.cfd" style="color: #2563eb;">boardly.cfd</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [applicantEmail],
            subject: 'Boardly Crew Application Status',
            html: emailHtml,
            text: `Hi ${applicantName},\n\nThank you for applying to Boardly Crew. Unfortunately we are unable to accept your application for this cohort.\n${reason ? `Feedback: ${reason}\n` : ''}\nBest regards,\nBoardly Academic Team`,
          }),
        });
      } catch (err) {
        console.error('[crew/notify] Resend rejection error:', err);
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Unknown notification type' }), { status: 400, headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('[crew/notify] Error processing request:', err);
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), { status: 500, headers: CORS_HEADERS });
  }
};

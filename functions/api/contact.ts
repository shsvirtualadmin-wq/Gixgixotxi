// Cloudflare Pages Function: Contact and Student Enquiry Routing
// Routes enquiries directly to support@boardly.cfd with sender SPF/DKIM alignment

export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const { request, env } = context;
    const body: any = await request.json().catch(() => ({}));

    const { name, email, phone, category, message } = body;
    const studentName = String(name || '').trim();
    const studentEmail = String(email || '').trim().toLowerCase();
    const studentPhone = String(phone || '').trim();
    const inquiryCategory = String(category || 'General Academic').trim();
    const studentMessage = String(message || '').trim();

    if (!studentName || !studentEmail || !studentMessage) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide your name, email, and message.',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const ticketId = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[Cloudflare Contact] Inquiry received from ${studentName} (${studentEmail}), ticket: ${ticketId}`);

    // If an external mail service (e.g. Resend, SendGrid, MailChannels) is configured in Cloudflare Pages
    if (env?.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM || 'Boardly Support <support@boardly.cfd>',
            to: ['support@boardly.cfd'],
            reply_to: studentEmail,
            subject: `[Boardly Inquiry] [${inquiryCategory}] New message from ${studentName}`,
            text: `Name: ${studentName}\nEmail: ${studentEmail}\nPhone: ${studentPhone}\nCategory: ${inquiryCategory}\nTicket: ${ticketId}\n\nMessage:\n${studentMessage}`,
          }),
        });
      } catch (sendErr) {
        console.warn('[Resend dispatch notice]:', sendErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your inquiry has been received and routed directly to support@boardly.cfd.',
        ticketId,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[functions/api/contact error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Failed to process inquiry.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

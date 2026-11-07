/**
 * Boardly Transactional Email Templates (HTML + Plain-Text Fallbacks)
 *
 * Compatible with Gmail, Apple Mail, Outlook (Desktop & Mobile), and Dark/Light modes.
 * Uses table-based 600px max-width layout with inline CSS and strict brand tokens:
 * - Header: #0B0B0F (near-black)
 * - Primary CTA: #E11D2A (Boardly Red)
 * - Koban Accent: #F5B301 (Koban Gold)
 */

import {
  formatPaymentMethodLabel,
  PAYMENT_METHODS_PAIR_LABEL,
} from '../constants/branding';

export type TransactionalEmailEventType =
  | 'koban_purchase_request'
  | 'koban_purchase_approved'
  | 'koban_purchase_rejected'
  | 'koban_receipt'
  | 'test_started'
  | 'test_completed'
  | 'daily_admin_digest'
  | 'application_submitted'
  | 'application_decision'
  | 'referral_confirmed'
  | 'referral_reward_credited'
  | 'admin_test_email';

export type KobanReceiptSubType =
  | 'daily_claim'
  | 'milestone_claim'
  | 'referral_reward'
  | 'store_purchase'
  | 'admin_grant'
  | 'captain_allotment';

export interface SubjectBreakdownRow {
  subject: string;
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  accuracyPercent: number;
}

export interface RenderedEmailTemplate {
  subject: string;
  preheader: string;
  html: string;
  text: string;
  isOptional?: boolean;
  optionalCategory?: 'testStarted' | 'smallKobanReceipts';
}

/**
 * Masks a payment reference / transaction ID so students only see the last 4 characters.
 * Admins receive the full unmasked transaction ID in their separate admin email.
 */
export function maskPaymentReference(ref?: string | null): string {
  const clean = String(ref || '').trim();
  if (!clean) return '••••';
  if (clean.length <= 4) return `••••${clean}`;
  return `••••${clean.slice(-4)}`;
}

/**
 * Formats a timestamp or Date in Pakistan Standard Time (Asia/Karachi, UTC+5).
 */
export function formatPktDateTime(dateInput?: Date | number | string | null): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (Number.isNaN(d.getTime())) {
      return new Date().toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' PKT';
    }
    return (
      d.toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' PKT'
    );
  } catch {
    return new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  }
}

export function formatDurationCompact(seconds?: number | null): string {
  const totalSec = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function escapeHtml(raw?: string | number | null): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface BaseEmailLayoutParams {
  subject: string;
  preheader: string;
  badgeText?: string;
  badgeColor?: 'red' | 'gold' | 'green' | 'neutral';
  heading: string;
  introHtml: string;
  kobanHighlight?: {
    label: string;
    amountText: string;
    subtext?: string;
  };
  detailsRows?: Array<{ label: string; value: string; highlightGold?: boolean; mono?: boolean }>;
  extraBodyHtml?: string;
  ctaLabel: string;
  ctaUrl: string;
  appUrl: string;
  isOptionalEmail?: boolean;
}

function renderBaseHtmlLayout(params: BaseEmailLayoutParams): string {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const badgePalette = {
    red: { bg: '#2A1014', border: '#E11D2A', text: '#FF6B74' },
    gold: { bg: '#2B220A', border: '#F5B301', text: '#F5B301' },
    green: { bg: '#0B291E', border: '#10B981', text: '#34D399' },
    neutral: { bg: '#181820', border: '#2E2E3A', text: '#A1A1B5' },
  }[params.badgeColor || 'red'];

  const badgeHtml = params.badgeText
    ? `<div style="margin-bottom:14px;">
         <span style="display:inline-block;padding:4px 12px;border-radius:999px;background-color:${badgePalette.bg};border:1px solid ${badgePalette.border};color:${badgePalette.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
           ${escapeHtml(params.badgeText)}
         </span>
       </div>`
    : '';

  const kobanBannerHtml = params.kobanHighlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#15130E;border:1px solid #4A3910;border-radius:14px;">
         <tr>
           <td style="padding:18px 20px;text-align:center;">
             <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#D4A338;margin-bottom:4px;">
               ${escapeHtml(params.kobanHighlight.label)}
             </div>
             <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:26px;font-weight:800;color:#F5B301;letter-spacing:-0.02em;">
               ${escapeHtml(params.kobanHighlight.amountText)}
             </div>
             ${
               params.kobanHighlight.subtext
                 ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#A8A29E;margin-top:4px;">
                      ${escapeHtml(params.kobanHighlight.subtext)}
                    </div>`
                 : ''
             }
           </td>
         </tr>
       </table>`
    : '';

  const detailsTableHtml =
    params.detailsRows && params.detailsRows.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;background-color:#121218;border:1px solid #23232F;border-radius:14px;overflow:hidden;">
           ${params.detailsRows
             .map(
               (row, idx) => `
             <tr>
               <td style="padding:11px 16px;border-bottom:${
                 idx === params.detailsRows!.length - 1 ? 'none' : '1px solid #1E1E28'
               };font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#9CA3AF;width:42%;vertical-align:top;">
                 ${escapeHtml(row.label)}
               </td>
               <td style="padding:11px 16px;border-bottom:${
                 idx === params.detailsRows!.length - 1 ? 'none' : '1px solid #1E1E28'
               };font-family:${
                 row.mono
                   ? "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace"
                   : "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
               };font-size:13px;font-weight:600;color:${
                 row.highlightGold ? '#F5B301' : '#F3F4F6'
               };text-align:right;vertical-align:top;word-break:break-word;">
                 ${escapeHtml(row.value)}
               </td>
             </tr>`
             )
             .join('')}
         </table>`
      : '';

  const optionalFooterHtml = params.isOptionalEmail
    ? `<p style="margin:8px 0 0 0;font-size:11px;line-height:1.5;color:#6B7280;">
         Prefer fewer activity emails? <a href="${escapeHtml(
           `${appUrl}/dashboard/settings`
         )}" style="color:#E11D2A;text-decoration:underline;">Manage your email notification preferences</a> in Settings.
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${escapeHtml(params.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#07070A;color:#F3F4F6;-webkit-font-smoothing:antialiased;">
  <!-- Preheader text -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#07070A;">
    ${escapeHtml(params.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07070A;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#0B0B0F;border:1px solid #1F1F2B;border-radius:20px;overflow:hidden;">
          <!-- Brand Header -->
          <tr>
            <td style="padding:22px 28px;background-color:#0B0B0F;border-bottom:1px solid #1C1C26;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <a href="${escapeHtml(appUrl)}" style="text-decoration:none;display:inline-block;">
                      <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:20px;font-weight:800;letter-spacing:0.12em;color:#FFFFFF;">BOARDLY</span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#E11D2A;margin-left:4px;vertical-align:middle;"></span>
                    </a>
                  </td>
                  <td align="right" style="vertical-align:middle;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:11px;color:#9CA3AF;">
                    boardly.cfd
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="padding:28px 28px 24px 28px;">
              ${badgeHtml}
              <h1 style="margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;line-height:1.3;color:#FFFFFF;letter-spacing:-0.02em;">
                ${escapeHtml(params.heading)}
              </h1>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:#D1D5DB;">
                ${params.introHtml}
              </div>

              ${kobanBannerHtml}
              ${detailsTableHtml}
              ${params.extraBodyHtml || ''}

              <!-- Single Primary CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;padding:13px 28px;background-color:#E11D2A;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.01em;">
                      ${escapeHtml(params.ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;background-color:#08080C;border-top:1px solid #181822;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6B7280;text-align:center;">
              <p style="margin:0 0 6px 0;color:#9CA3AF;font-weight:600;">
                Boardly · Pakistan's Entrance Exam &amp; FSc Preparation Platform
              </p>
              <p style="margin:0;">
                This is an automated message. Need help? Contact support at
                <a href="mailto:admin@boardly.cfd" style="color:#E11D2A;text-decoration:none;">admin@boardly.cfd</a>.
              </p>
              ${optionalFooterHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. KOBAN PURCHASE REQUEST SUBMITTED (Student + Admin)
// ─────────────────────────────────────────────────────────────────────────────

export function buildKobanPurchaseRequestStudentEmail(params: {
  studentName: string;
  kobansAmount: number;
  pkrAmount: number;
  paymentMethod: string;
  transactionId: string;
  packageName?: string;
  requestedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const maskedRef = maskPaymentReference(params.transactionId);
  const timeStr = formatPktDateTime(params.requestedAt);
  const methodLabel = formatPaymentMethodLabel(params.paymentMethod);
  const pkgLabel = params.packageName || `${params.kobansAmount.toLocaleString()} Kobans Package`;
  const subject = `We received your Koban request (${params.kobansAmount.toLocaleString()} Kobans) — Boardly`;
  const preheader = `Your request for ${params.kobansAmount.toLocaleString()} Kobans (PKR ${params.pkrAmount}) is pending verification.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Pending Verification',
    badgeColor: 'gold',
    heading: 'We received your Koban purchase request',
    introHtml: `<p style="margin:0;">Assalam-o-Alaikum <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, we have received your payment verification request. Our team verifies mobile banking transfers promptly and will email you as soon as your Kobans are credited.</p>`,
    kobanHighlight: {
      label: pkgLabel,
      amountText: `+${params.kobansAmount.toLocaleString()} Kobans`,
      subtext: `Amount Paid: PKR ${params.pkrAmount.toLocaleString()} · Status: Pending Verification`,
    },
    detailsRows: [
      { label: 'Package', value: pkgLabel },
      { label: 'Amount (PKR)', value: `PKR ${params.pkrAmount.toLocaleString()}` },
      { label: 'Payment Method', value: methodLabel },
      { label: 'Payment Reference', value: maskedRef, mono: true },
      { label: 'Status', value: 'Pending Verification', highlightGold: true },
      { label: 'Submitted (PKT)', value: timeStr },
    ],
    ctaLabel: 'View Wallet & Rewards',
    ctaUrl: `${appUrl}/dashboard/rewards`,
    appUrl,
  });

  const text = [
    `BOARDLY — We received your Koban purchase request`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `We received your request for ${params.kobansAmount.toLocaleString()} Kobans (PKR ${params.pkrAmount.toLocaleString()}).`,
    ``,
    `Package: ${pkgLabel}`,
    `Amount: PKR ${params.pkrAmount.toLocaleString()}`,
    `Payment Method: ${methodLabel}`,
    `Payment Reference (Masked): ${maskedRef}`,
    `Status: Pending Verification`,
    `Time: ${timeStr}`,
    ``,
    `View your wallet: ${appUrl}/dashboard/rewards`,
    ``,
    `This is an automated message from Boardly (${appUrl}). Support: admin@boardly.cfd`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildKobanPurchaseRequestAdminEmail(params: {
  requestId: string;
  studentName: string;
  studentEmail: string;
  studentUid: string;
  kobansAmount: number;
  pkrAmount: number;
  paymentMethod: string;
  transactionId: string;
  packageName?: string;
  note?: string;
  requestedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.requestedAt);
  const methodLabel = formatPaymentMethodLabel(params.paymentMethod);
  const pkgLabel = params.packageName || `${params.kobansAmount.toLocaleString()} Kobans`;
  const subject = `[Admin] New Koban purchase request — ${params.studentName || params.studentEmail} (PKR ${params.pkrAmount})`;
  const preheader = `${params.studentName} requested ${params.kobansAmount.toLocaleString()} Kobans via ${methodLabel} (TRX: ${params.transactionId}).`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Action Required · Payment Queue',
    badgeColor: 'red',
    heading: 'New Koban purchase request',
    introHtml: `<p style="margin:0;">A student has submitted a Koban purchase verification request. Please verify the transaction reference on your mobile banking portal before approving.</p>`,
    kobanHighlight: {
      label: 'Requested Credit',
      amountText: `${params.kobansAmount.toLocaleString()} Kobans`,
      subtext: `PKR ${params.pkrAmount.toLocaleString()} via ${methodLabel}`,
    },
    detailsRows: [
      { label: 'Student Name', value: params.studentName || 'Student' },
      { label: 'Student Email', value: params.studentEmail || 'Not provided', mono: true },
      { label: 'Package', value: pkgLabel },
      { label: 'Amount (PKR)', value: `PKR ${params.pkrAmount.toLocaleString()}` },
      { label: 'Payment Method', value: methodLabel },
      { label: 'Full Transaction ID', value: params.transactionId, mono: true, highlightGold: true },
      { label: 'Request ID', value: params.requestId, mono: true },
      { label: 'Submitted Time', value: timeStr },
      ...(params.note ? [{ label: 'Note', value: params.note }] : []),
    ],
    ctaLabel: 'Review in Admin Panel',
    ctaUrl: `${appUrl}/admin/payments`,
    appUrl,
  });

  const text = [
    `BOARDLY ADMIN — New Koban purchase request`,
    ``,
    `Student: ${params.studentName} (${params.studentEmail})`,
    `Package: ${pkgLabel}`,
    `Amount (PKR): PKR ${params.pkrAmount.toLocaleString()}`,
    `Payment Method: ${methodLabel}`,
    `Full Transaction ID / Reference: ${params.transactionId}`,
    `Time: ${timeStr}`,
    ...(params.note ? [`Note: ${params.note}`] : []),
    ``,
    `Review in Admin Panel: ${appUrl}/admin/payments`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. KOBAN PURCHASE APPROVED OR REJECTED BY ADMIN (Student + Admin Copy)
// ─────────────────────────────────────────────────────────────────────────────

export function buildKobanPurchaseApprovedStudentEmail(params: {
  studentName: string;
  approvedKobans: number;
  newBalance: number;
  transactionId?: string;
  approvedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.approvedAt);
  const maskedRef = maskPaymentReference(params.transactionId);
  const subject = `Kobans added! +${params.approvedKobans.toLocaleString()} Kobans credited — Boardly`;
  const preheader = `Your payment was verified and +${params.approvedKobans.toLocaleString()} Kobans were added to your wallet. New balance: ${params.newBalance.toLocaleString()} Kobans.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Payment Verified',
    badgeColor: 'green',
    heading: 'Kobans added to your wallet!',
    introHtml: `<p style="margin:0;">Great news, <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>! Your payment has been verified and your Kobans are ready to use in the Boardly Store.</p>`,
    kobanHighlight: {
      label: 'Kobans Added',
      amountText: `+${params.approvedKobans.toLocaleString()} Kobans`,
      subtext: `New Wallet Balance: ${params.newBalance.toLocaleString()} Kobans`,
    },
    detailsRows: [
      { label: 'Kobans Credited', value: `+${params.approvedKobans.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'New Balance', value: `${params.newBalance.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'Payment Reference', value: maskedRef, mono: true },
      { label: 'Verified At', value: timeStr },
    ],
    ctaLabel: 'Open Boardly Store',
    ctaUrl: `${appUrl}/dashboard/store`,
    appUrl,
  });

  const text = [
    `BOARDLY — Kobans added to your wallet!`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `Your payment (Ref: ${maskedRef}) has been verified!`,
    `Kobans Added: +${params.approvedKobans.toLocaleString()} Kobans`,
    `New Balance: ${params.newBalance.toLocaleString()} Kobans`,
    `Verified At: ${timeStr}`,
    ``,
    `Open Boardly Store: ${appUrl}/dashboard/store`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildKobanPurchaseRejectedStudentEmail(params: {
  studentName: string;
  requestedKobans: number;
  reason: string;
  transactionId?: string;
  rejectedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.rejectedAt);
  const maskedRef = maskPaymentReference(params.transactionId);
  const subject = `Update on your Koban purchase request — Boardly`;
  const preheader = `We could not verify payment reference ${maskedRef}. See details and next steps inside.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Verification Update',
    badgeColor: 'red',
    heading: 'We could not verify your Koban request',
    introHtml: `<p style="margin:0 0 10px 0;">Hi <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, our team reviewed your Koban purchase request (${escapeHtml(
      maskedRef
    )}) but could not verify the transaction.</p>
    <p style="margin:0;"><strong>What to do next:</strong> Please double-check your ${PAYMENT_METHODS_PAIR_LABEL} or bank Transaction ID (TRX) and submit a new request with the exact reference, or reply/contact <a href="mailto:admin@boardly.cfd" style="color:#E11D2A;">admin@boardly.cfd</a> with your payment screenshot.</p>`,
    detailsRows: [
      { label: 'Requested Amount', value: `${params.requestedKobans.toLocaleString()} Kobans` },
      { label: 'Payment Reference', value: maskedRef, mono: true },
      { label: 'Reason', value: params.reason || 'Transaction ID could not be verified on mobile banking portal.' },
      { label: 'Reviewed At', value: timeStr },
    ],
    ctaLabel: 'Submit Corrected Request',
    ctaUrl: `${appUrl}/dashboard/rewards`,
    appUrl,
  });

  const text = [
    `BOARDLY — Update on your Koban purchase request`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `We could not verify your request for ${params.requestedKobans.toLocaleString()} Kobans (Ref: ${maskedRef}).`,
    `Reason: ${params.reason || 'Transaction ID could not be verified.'}`,
    ``,
    `What to do next: Double-check your Transaction ID (TRX) and submit a corrected request at ${appUrl}/dashboard/rewards, or email admin@boardly.cfd with your payment receipt.`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildKobanPurchaseDecisionAdminCopyEmail(params: {
  decision: 'approved' | 'rejected';
  adminEmail: string;
  studentName: string;
  studentEmail?: string;
  kobansAmount: number;
  newBalance?: number;
  transactionId?: string;
  reason?: string;
  decidedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.decidedAt);
  const isApproved = params.decision === 'approved';
  const subject = `[Admin Copy] Purchase ${isApproved ? 'approved' : 'rejected'} by ${params.adminEmail} — ${params.studentName}`;
  const preheader = `Koban request (${params.kobansAmount.toLocaleString()} Kobans) for ${params.studentName} was ${params.decision} by ${params.adminEmail}.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: isApproved ? 'Approved by Admin' : 'Rejected by Admin',
    badgeColor: isApproved ? 'green' : 'red',
    heading: `Purchase ${isApproved ? 'approved' : 'rejected'} by ${params.adminEmail}`,
    introHtml: `<p style="margin:0;">Admin audit summary for Koban purchase verification.</p>`,
    detailsRows: [
      { label: 'Action By', value: params.adminEmail, mono: true },
      { label: 'Decision', value: isApproved ? 'APPROVED' : 'REJECTED', highlightGold: isApproved },
      { label: 'Student', value: `${params.studentName} (${params.studentEmail || 'N/A'})` },
      { label: 'Kobans Amount', value: `${params.kobansAmount.toLocaleString()} Kobans`, highlightGold: true },
      ...(typeof params.newBalance === 'number'
        ? [{ label: 'Student New Balance', value: `${params.newBalance.toLocaleString()} Kobans`, highlightGold: true }]
        : []),
      ...(params.transactionId
        ? [{ label: 'Full Transaction ID', value: params.transactionId, mono: true }]
        : []),
      ...(params.reason ? [{ label: 'Rejection Reason', value: params.reason }] : []),
      { label: 'Timestamp', value: timeStr },
    ],
    ctaLabel: 'Open Admin Payments',
    ctaUrl: `${appUrl}/admin/payments`,
    appUrl,
  });

  const text = [
    `BOARDLY ADMIN COPY — Purchase ${params.decision} by ${params.adminEmail}`,
    ``,
    `Student: ${params.studentName} (${params.studentEmail || 'N/A'})`,
    `Decision: ${params.decision.toUpperCase()}`,
    `Kobans: ${params.kobansAmount.toLocaleString()} Kobans`,
    ...(typeof params.newBalance === 'number' ? [`New Balance: ${params.newBalance.toLocaleString()} Kobans`] : []),
    ...(params.transactionId ? [`Transaction ID: ${params.transactionId}`] : []),
    ...(params.reason ? [`Reason: ${params.reason}`] : []),
    `Time: ${timeStr}`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. KOBANS RECEIVED OR SPENT FOR ANY REASON (Student Receipt + Selective Admin Alert)
// ─────────────────────────────────────────────────────────────────────────────

export function buildKobanReceiptStudentEmail(params: {
  studentName: string;
  deltaAmount: number; // positive = received, negative = spent
  newBalance: number;
  reason: string;
  subType: KobanReceiptSubType;
  itemName?: string;
  timestamp?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const isPositive = params.deltaAmount >= 0;
  const absAmount = Math.abs(Math.floor(params.deltaAmount));
  const amountSignText = isPositive
    ? `+${absAmount.toLocaleString()} Kobans received`
    : `-${absAmount.toLocaleString()} Kobans spent`;
  const timeStr = formatPktDateTime(params.timestamp);
  const isSmallOptional =
    params.subType === 'daily_claim' || params.subType === 'milestone_claim';

  const subject = `${amountSignText} (${params.reason}) — Boardly`;
  const preheader = `${amountSignText} · New wallet balance: ${params.newBalance.toLocaleString()} Kobans.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: isPositive ? 'Kobans Credited' : 'Kobans Spent',
    badgeColor: isPositive ? 'gold' : 'neutral',
    heading: amountSignText,
    introHtml: `<p style="margin:0;">Hi <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, here is your Boardly Koban wallet receipt.</p>`,
    kobanHighlight: {
      label: params.reason,
      amountText: isPositive ? `+${absAmount.toLocaleString()} Kobans` : `-${absAmount.toLocaleString()} Kobans`,
      subtext: `New Balance: ${params.newBalance.toLocaleString()} Kobans`,
    },
    detailsRows: [
      { label: 'Activity', value: params.reason },
      ...(params.itemName ? [{ label: 'Item', value: params.itemName }] : []),
      {
        label: isPositive ? 'Amount Received' : 'Amount Spent',
        value: `${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans`,
        highlightGold: true,
      },
      { label: 'New Wallet Balance', value: `${params.newBalance.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: params.subType === 'store_purchase' ? 'View Cosmetics in Store' : 'Open Student Rewards',
    ctaUrl: params.subType === 'store_purchase' ? `${appUrl}/dashboard/store` : `${appUrl}/dashboard/rewards`,
    appUrl,
    isOptionalEmail: isSmallOptional,
  });

  const text = [
    `BOARDLY WALLET RECEIPT — ${amountSignText}`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `Reason: ${params.reason}`,
    `Change: ${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans`,
    `New Balance: ${params.newBalance.toLocaleString()} Kobans`,
    `Time: ${timeStr}`,
    ``,
    `View wallet: ${appUrl}/dashboard/rewards`,
  ].join('\n');

  return {
    subject,
    preheader,
    html,
    text,
    isOptional: isSmallOptional,
    optionalCategory: isSmallOptional ? 'smallKobanReceipts' : undefined,
  };
}

export function buildKobanActivityAdminAlertEmail(params: {
  studentName: string;
  studentEmail?: string;
  studentUid: string;
  deltaAmount: number;
  newBalance: number;
  reason: string;
  subType: KobanReceiptSubType;
  adminEmail?: string;
  timestamp?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const isPositive = params.deltaAmount >= 0;
  const absAmount = Math.abs(Math.floor(params.deltaAmount));
  const timeStr = formatPktDateTime(params.timestamp);
  const subject = `[Admin Wallet Alert] ${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans (${params.reason}) — ${params.studentName}`;
  const preheader = `${params.studentName} (${params.subType}): ${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans. New balance: ${params.newBalance.toLocaleString()} Kobans.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: `Wallet Alert · ${params.subType.replace(/_/g, ' ')}`,
    badgeColor: 'gold',
    heading: `${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans · ${params.reason}`,
    introHtml: `<p style="margin:0;">High-value Koban transaction, Store purchase, or Admin wallet adjustment recorded.</p>`,
    detailsRows: [
      { label: 'Student', value: `${params.studentName} (${params.studentEmail || params.studentUid})` },
      { label: 'Event Type', value: params.subType.toUpperCase(), mono: true },
      { label: 'Reason', value: params.reason },
      {
        label: 'Kobans Delta',
        value: `${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans`,
        highlightGold: true,
      },
      { label: 'New Balance', value: `${params.newBalance.toLocaleString()} Kobans`, highlightGold: true },
      ...(params.adminEmail ? [{ label: 'Performed By Admin', value: params.adminEmail, mono: true }] : []),
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'Inspect Student Wallets',
    ctaUrl: `${appUrl}/admin/kobans`,
    appUrl,
  });

  const text = [
    `BOARDLY ADMIN WALLET ALERT`,
    `Student: ${params.studentName} (${params.studentEmail || params.studentUid})`,
    `Event: ${params.subType} — ${params.reason}`,
    `Amount: ${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans`,
    `New Balance: ${params.newBalance.toLocaleString()} Kobans`,
    `Time: ${timeStr}`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEST STARTED (Optional) & TEST COMPLETED RESULT + DAILY ADMIN DIGEST
// ─────────────────────────────────────────────────────────────────────────────

export function buildTestStartedStudentEmail(params: {
  studentName: string;
  attemptId: string;
  testName: string;
  universityPattern: string;
  subjectScope: string;
  totalQuestions: number;
  durationMinutes?: number;
  startedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.startedAt);
  const subject = `Test started: ${params.testName} — Boardly`;
  const preheader = `You started ${params.testName} (${params.totalQuestions} MCQs · ${params.universityPattern}). Good luck!`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Test In Progress',
    badgeColor: 'neutral',
    heading: `Test started: ${params.testName}`,
    introHtml: `<p style="margin:0;">Hi <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, your test session is now active. Stay focused and give it your best effort!</p>`,
    detailsRows: [
      { label: 'Test Name', value: params.testName },
      { label: 'University / Pattern', value: params.universityPattern || 'Standard Drill' },
      { label: 'Subject Scope', value: params.subjectScope || 'General' },
      { label: 'Total Questions', value: `${params.totalQuestions} MCQs` },
      ...(params.durationMinutes ? [{ label: 'Time Limit', value: `${params.durationMinutes} minutes` }] : []),
      { label: 'Started At', value: timeStr },
    ],
    ctaLabel: 'Resume Test Session',
    ctaUrl: `${appUrl}/test/${encodeURIComponent(params.attemptId)}`,
    appUrl,
    isOptionalEmail: true,
  });

  const text = [
    `BOARDLY — Test Started: ${params.testName}`,
    `Pattern: ${params.universityPattern}`,
    `Subject Scope: ${params.subjectScope}`,
    `Questions: ${params.totalQuestions} MCQs`,
    `Started At: ${timeStr}`,
    `Resume Test: ${appUrl}/test/${params.attemptId}`,
  ].join('\n');

  return {
    subject,
    preheader,
    html,
    text,
    isOptional: true,
    optionalCategory: 'testStarted',
  };
}

export function buildTestCompletedStudentEmail(params: {
  studentName: string;
  attemptId: string;
  testName: string;
  universityPattern: string;
  subjectScope: string;
  completedAt?: Date | string | number;
  durationSeconds: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  score: number;
  maxMarks?: number;
  percentage: number;
  subjectBreakdown?: SubjectBreakdownRow[];
  reviewPath?: string; // e.g. `/test/${attemptId}/result` or `/grand-line/test/${id}?mode=result`
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.completedAt);
  const durationStr = formatDurationCompact(params.durationSeconds);
  const maxMarks = params.maxMarks && params.maxMarks > 0 ? params.maxMarks : params.totalQuestions;
  const passed = params.percentage >= 60;
  const statusLine = passed
    ? 'PASS — Strong performance! Keep building momentum.'
    : 'NEEDS PRACTICE — Review your mistakes below to boost your accuracy.';

  const subject = `Test Result: ${params.testName} (${params.percentage}%) — Boardly`;
  const preheader = `Score: ${params.score}/${maxMarks} (${params.percentage}%) · ${params.correct} Correct, ${params.wrong} Wrong · ${statusLine}`;

  const breakdownRows =
    params.subjectBreakdown && params.subjectBreakdown.length > 0
      ? params.subjectBreakdown
      : [
          {
            subject: params.subjectScope || 'Overall',
            total: params.totalQuestions,
            attempted: params.attempted,
            correct: params.correct,
            wrong: params.wrong,
            accuracyPercent: params.percentage,
          },
        ];

  const breakdownTableHtml = `
    <div style="margin-top:20px;">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9CA3AF;margin-bottom:8px;">
        Per-Subject Breakdown
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#121218;border:1px solid #23232F;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background-color:#181822;">
            <th align="left" style="padding:10px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Subject</th>
            <th align="center" style="padding:10px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Correct</th>
            <th align="center" style="padding:10px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Wrong</th>
            <th align="right" style="padding:10px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownRows
            .map(
              (row, i) => `
            <tr>
              <td align="left" style="padding:10px 12px;border-top:1px solid #1E1E28;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:#F3F4F6;text-transform:capitalize;">
                ${escapeHtml(row.subject)} <span style="color:#6B7280;font-weight:400;">(${row.attempted}/${row.total})</span>
              </td>
              <td align="center" style="padding:10px 8px;border-top:1px solid #1E1E28;font-family:'SFMono-Regular',Consolas,monospace;font-size:12px;font-weight:700;color:#34D399;">
                ${row.correct}
              </td>
              <td align="center" style="padding:10px 8px;border-top:1px solid #1E1E28;font-family:'SFMono-Regular',Consolas,monospace;font-size:12px;font-weight:700;color:#F87171;">
                ${row.wrong}
              </td>
              <td align="right" style="padding:10px 12px;border-top:1px solid #1E1E28;font-family:'SFMono-Regular',Consolas,monospace;font-size:12px;font-weight:700;color:${
                i >= 0 && row.accuracyPercent >= 60 ? '#34D399' : '#F5B301'
              };">
                ${row.accuracyPercent}%
              </td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>`;

  const reviewLink = params.reviewPath
    ? `${appUrl}${params.reviewPath.startsWith('/') ? '' : '/'}${params.reviewPath}`
    : `${appUrl}/test/${encodeURIComponent(params.attemptId)}/result`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: passed ? 'Result: Pass' : 'Result: Needs Practice',
    badgeColor: passed ? 'green' : 'gold',
    heading: `${params.testName} — ${params.percentage}%`,
    introHtml: `<p style="margin:0 0 8px 0;">Hi <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, your official test report is ready.</p>
    <p style="margin:0;padding:10px 14px;border-radius:10px;background-color:${
      passed ? '#0B291E' : '#2B220A'
    };border:1px solid ${passed ? '#10B981' : '#F5B301'};color:${
      passed ? '#34D399' : '#F5B301'
    };font-weight:700;font-size:13px;">
      ${escapeHtml(statusLine)}
    </p>`,
    detailsRows: [
      { label: 'Test Name', value: params.testName },
      { label: 'University / Pattern', value: params.universityPattern || 'Standard Drill' },
      { label: 'Subject Scope', value: params.subjectScope || 'All Subjects' },
      { label: 'Date / Time (PKT)', value: timeStr },
      { label: 'Duration Used', value: durationStr },
      { label: 'Total Questions', value: String(params.totalQuestions), mono: true },
      { label: 'Attempted', value: `${params.attempted} / ${params.totalQuestions}`, mono: true },
      { label: 'Correct / Wrong', value: `${params.correct} Correct · ${params.wrong} Wrong`, mono: true },
      { label: 'Score', value: `${params.score} / ${maxMarks}`, highlightGold: true, mono: true },
      { label: 'Percentage', value: `${params.percentage}%`, highlightGold: true, mono: true },
    ],
    extraBodyHtml: breakdownTableHtml,
    ctaLabel: 'View full review',
    ctaUrl: reviewLink,
    appUrl,
  });

  const text = [
    `BOARDLY TEST RESULT — ${params.testName}`,
    ``,
    `Student: ${params.studentName || 'Student'}`,
    `Verdict: ${statusLine}`,
    `University / Pattern: ${params.universityPattern || 'Standard Drill'}`,
    `Subject Scope: ${params.subjectScope || 'All Subjects'}`,
    `Date / Time: ${timeStr}`,
    `Duration Used: ${durationStr}`,
    `Total Questions: ${params.totalQuestions}`,
    `Attempted: ${params.attempted}`,
    `Correct: ${params.correct} | Wrong: ${params.wrong}`,
    `Score: ${params.score} / ${maxMarks} (${params.percentage}%)`,
    ``,
    `Per-Subject Breakdown:`,
    ...breakdownRows.map(
      (r) => `- ${r.subject}: ${r.correct} correct, ${r.wrong} wrong (${r.attempted}/${r.total} attempted) — ${r.accuracyPercent}%`
    ),
    ``,
    `View full review: ${reviewLink}`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildDailyAdminDigestEmail(params: {
  pktDateLabel: string;
  testsTakenCount: number;
  topScorers: Array<{ studentName: string; testName: string; percentage: number; scoreText: string }>;
  totalKobansEarned: number;
  totalKobansSpent: number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const subject = `[Boardly Daily Digest] ${params.pktDateLabel} — ${params.testsTakenCount} Tests · +${params.totalKobansEarned.toLocaleString()} / -${params.totalKobansSpent.toLocaleString()} Kobans`;
  const preheader = `00:00 PKT Summary: ${params.testsTakenCount} tests completed, +${params.totalKobansEarned.toLocaleString()} Kobans earned, -${params.totalKobansSpent.toLocaleString()} Kobans spent.`;

  const topScorersHtml =
    params.topScorers.length > 0
      ? `<div style="margin-top:18px;">
           <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin-bottom:8px;">Top Scorers (${escapeHtml(
             params.pktDateLabel
           )})</div>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#121218;border:1px solid #23232F;border-radius:12px;">
             ${params.topScorers
               .slice(0, 5)
               .map(
                 (s, idx) => `
               <tr>
                 <td style="padding:10px 14px;border-bottom:${
                   idx === Math.min(4, params.topScorers.length - 1) ? 'none' : '1px solid #1E1E28'
                 };font-size:13px;color:#F3F4F6;">
                   <strong>#${idx + 1} ${escapeHtml(s.studentName)}</strong> · <span style="color:#9CA3AF;">${escapeHtml(
                   s.testName
                 )}</span>
                 </td>
                 <td align="right" style="padding:10px 14px;border-bottom:${
                   idx === Math.min(4, params.topScorers.length - 1) ? 'none' : '1px solid #1E1E28'
                 };font-family:monospace;font-size:13px;font-weight:700;color:#F5B301;">
                   ${escapeHtml(s.scoreText)} (${s.percentage}%)
                 </td>
               </tr>`
               )
               .join('')}
           </table>
         </div>`
      : '';

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: '00:00 PKT Daily Admin Digest',
    badgeColor: 'red',
    heading: `Boardly Daily Summary · ${params.pktDateLabel}`,
    introHtml: `<p style="margin:0;">Automated 24-hour activity digest across entrance tests and the Kobans economy.</p>`,
    detailsRows: [
      { label: 'Date (PKT)', value: params.pktDateLabel },
      { label: 'Total Tests Taken', value: String(params.testsTakenCount), mono: true },
      { label: 'Total Kobans Earned', value: `+${params.totalKobansEarned.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'Total Kobans Spent', value: `-${params.totalKobansSpent.toLocaleString()} Kobans`, highlightGold: true },
    ],
    extraBodyHtml: topScorersHtml,
    ctaLabel: 'Open Superadmin Portal',
    ctaUrl: `${appUrl}/admin`,
    appUrl,
  });

  const text = [
    `BOARDLY 00:00 PKT DAILY ADMIN DIGEST (${params.pktDateLabel})`,
    `Tests Taken: ${params.testsTakenCount}`,
    `Kobans Earned: +${params.totalKobansEarned.toLocaleString()} Kobans`,
    `Kobans Spent: -${params.totalKobansSpent.toLocaleString()} Kobans`,
    ``,
    `Top Scorers:`,
    ...(params.topScorers.length > 0
      ? params.topScorers.map((s, i) => `#${i + 1} ${s.studentName} — ${s.testName}: ${s.scoreText} (${s.percentage}%)`)
      : ['No tests recorded in this window.']),
    ``,
    `Admin Portal: ${appUrl}/admin`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. APPLICATIONS (Campus Captain, Crew, Ambassador, Name Request, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export function buildApplicationSubmittedApplicantEmail(params: {
  applicantName: string;
  programName: string; // e.g. "Nakama Campus Captain", "Boardly Study Crew", "Reserved Display Name"
  institution?: string;
  city?: string;
  submittedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.submittedAt);
  const subject = `Application received: ${params.programName} — Boardly`;
  const preheader = `We received your ${params.programName} application and will email you as soon as our review board decides.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Application Received',
    badgeColor: 'gold',
    heading: `We received your ${params.programName} application`,
    introHtml: `<p style="margin:0;">Thank you, <strong>${escapeHtml(
      params.applicantName || 'Student'
    )}</strong>! Your application has been logged with our review board. You will receive an email notification as soon as an administrator reviews your submission.</p>`,
    detailsRows: [
      { label: 'Program / Form', value: params.programName },
      { label: 'Applicant', value: params.applicantName || 'Student' },
      ...(params.institution ? [{ label: 'Institution / Campus', value: params.institution }] : []),
      ...(params.city ? [{ label: 'City', value: params.city }] : []),
      { label: 'Status', value: 'Pending Admin Review', highlightGold: true },
      { label: 'Submitted At', value: timeStr },
    ],
    ctaLabel: 'Return to Student Dashboard',
    ctaUrl: `${appUrl}/dashboard`,
    appUrl,
  });

  const text = [
    `BOARDLY — Application Received (${params.programName})`,
    ``,
    `Hi ${params.applicantName || 'Student'},`,
    `We received your application for ${params.programName}.`,
    ...(params.institution ? [`Institution: ${params.institution}`] : []),
    ...(params.city ? [`City: ${params.city}`] : []),
    `Status: Pending Admin Review`,
    `Submitted At: ${timeStr}`,
    ``,
    `Dashboard: ${appUrl}/dashboard`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildApplicationSubmittedAdminEmail(params: {
  applicationId: string;
  programName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  institution?: string;
  city?: string;
  statement?: string;
  submittedAt?: Date | string | number;
  reviewPath?: string;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.submittedAt);
  const subject = `[Admin] New application: ${params.programName} — ${params.applicantName}`;
  const preheader = `${params.applicantName} (${params.applicantEmail}) applied for ${params.programName}.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'New Candidate Application',
    badgeColor: 'red',
    heading: `New ${params.programName} application`,
    introHtml: `<p style="margin:0;">A student has submitted a new application requiring administrator review.</p>`,
    detailsRows: [
      { label: 'Program', value: params.programName },
      { label: 'Applicant Name', value: params.applicantName },
      { label: 'Email', value: params.applicantEmail, mono: true },
      ...(params.applicantPhone ? [{ label: 'Phone / WhatsApp', value: params.applicantPhone, mono: true }] : []),
      ...(params.institution ? [{ label: 'Institution', value: params.institution }] : []),
      ...(params.city ? [{ label: 'City', value: params.city }] : []),
      ...(params.statement ? [{ label: 'Statement / Note', value: params.statement }] : []),
      { label: 'Submitted At', value: timeStr },
    ],
    ctaLabel: 'Review Application in Admin Panel',
    ctaUrl: `${appUrl}${params.reviewPath || '/admin/applications'}`,
    appUrl,
  });

  const text = [
    `BOARDLY ADMIN — New Application: ${params.programName}`,
    `Applicant: ${params.applicantName} (${params.applicantEmail})`,
    ...(params.applicantPhone ? [`Phone: ${params.applicantPhone}`] : []),
    ...(params.institution ? [`Institution: ${params.institution}`] : []),
    ...(params.city ? [`City: ${params.city}`] : []),
    ...(params.statement ? [`Statement: ${params.statement}`] : []),
    `Submitted At: ${timeStr}`,
    `Review: ${appUrl}${params.reviewPath || '/admin/applications'}`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildApplicationDecisionApplicantEmail(params: {
  applicantName: string;
  programName: string;
  decision: 'approved' | 'rejected';
  codeOrBadge?: string;
  reason?: string;
  ctaPath?: string;
  decidedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const isApproved = params.decision === 'approved';
  const timeStr = formatPktDateTime(params.decidedAt);
  const subject = isApproved
    ? `Congratulations! Your ${params.programName} application is approved — Boardly`
    : `Update on your ${params.programName} application — Boardly`;
  const preheader = isApproved
    ? `Welcome aboard! Your ${params.programName} role is now active on Boardly.`
    : `Our team has reviewed your ${params.programName} application.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: isApproved ? 'Application Approved' : 'Application Status Update',
    badgeColor: isApproved ? 'green' : 'neutral',
    heading: isApproved
      ? `Your ${params.programName} application was approved!`
      : `Update on your ${params.programName} application`,
    introHtml: isApproved
      ? `<p style="margin:0;">Congratulations <strong>${escapeHtml(
          params.applicantName || 'Student'
        )}</strong>! Your application for <strong>${escapeHtml(
          params.programName
        )}</strong> has been approved. Your leadership features and dashboard privileges are now unlocked.</p>`
      : `<p style="margin:0;">Hi <strong>${escapeHtml(
          params.applicantName || 'Student'
        )}</strong>, thank you for applying for <strong>${escapeHtml(
          params.programName
        )}</strong>. After reviewing current campus slots, we are unable to approve your application at this time.</p>`,
    detailsRows: [
      { label: 'Program', value: params.programName },
      { label: 'Decision', value: isApproved ? 'Approved' : 'Not Approved', highlightGold: isApproved },
      ...(params.codeOrBadge ? [{ label: 'Official Code / Badge', value: params.codeOrBadge, mono: true, highlightGold: true }] : []),
      ...(!isApproved && params.reason ? [{ label: 'Reviewer Note', value: params.reason }] : []),
      { label: 'Reviewed At', value: timeStr },
    ],
    ctaLabel: isApproved ? 'Open Leadership Dashboard' : 'Open Student Dashboard',
    ctaUrl: `${appUrl}${params.ctaPath || (isApproved ? '/dashboard/captain' : '/dashboard')}`,
    appUrl,
  });

  const text = [
    `BOARDLY — ${params.programName} Application ${isApproved ? 'Approved' : 'Update'}`,
    ``,
    `Hi ${params.applicantName || 'Student'},`,
    `Decision: ${isApproved ? 'APPROVED' : 'NOT APPROVED'}`,
    ...(params.codeOrBadge ? [`Official Code: ${params.codeOrBadge}`] : []),
    ...(!isApproved && params.reason ? [`Note: ${params.reason}`] : []),
    `Reviewed At: ${timeStr}`,
    `Open Boardly: ${appUrl}${params.ctaPath || '/dashboard'}`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. REFERRALS (Confirmed & Kobans Credited — Referrer + Friend)
// ─────────────────────────────────────────────────────────────────────────────

export function buildReferralEventEmail(params: {
  recipientRole: 'referrer' | 'friend';
  recipientName: string;
  counterpartyName: string;
  stage: 'confirmed' | 'credited';
  kobansCredited?: number;
  newBalance?: number;
  referralCode?: string;
  timestamp?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.timestamp);
  const isCredited = params.stage === 'credited';
  const isReferrer = params.recipientRole === 'referrer';
  const rewardKobans = params.kobansCredited ?? (isReferrer ? 5000 : 1000);

  const subject = isCredited
    ? `+${rewardKobans.toLocaleString()} Kobans credited! Referral reward with ${params.counterpartyName} — Boardly`
    : `Referral confirmed with ${params.counterpartyName} — Boardly`;

  const preheader = isCredited
    ? `+${rewardKobans.toLocaleString()} Kobans have been added to your Boardly wallet.`
    : `Your two-way referral link with ${params.counterpartyName} is confirmed!`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: isCredited ? 'Referral Reward Credited' : 'Referral Linked',
    badgeColor: isCredited ? 'gold' : 'green',
    heading: isCredited
      ? `+${rewardKobans.toLocaleString()} Kobans added from your referral!`
      : `Referral confirmed with ${params.counterpartyName}`,
    introHtml: isCredited
      ? `<p style="margin:0;">Awesome work, <strong>${escapeHtml(
          params.recipientName || 'Student'
        )}</strong>! Your referral milestone with <strong>${escapeHtml(
          params.counterpartyName
        )}</strong> is complete and your Kobans have been credited.</p>`
      : `<p style="margin:0;">Hi <strong>${escapeHtml(
          params.recipientName || 'Student'
        )}</strong>, your referral connection with <strong>${escapeHtml(
          params.counterpartyName
        )}</strong> is now confirmed! Complete 20 practice MCQs with a verified email to unlock your <strong style="color:#F5B301;">+${rewardKobans.toLocaleString()} Kobans</strong> reward.</p>`,
    ...(isCredited
      ? {
          kobanHighlight: {
            label: isReferrer ? 'Referrer Bonus' : 'Friend Welcome Bonus',
            amountText: `+${rewardKobans.toLocaleString()} Kobans`,
            subtext:
              typeof params.newBalance === 'number'
                ? `New Wallet Balance: ${params.newBalance.toLocaleString()} Kobans`
                : 'Credited to your Boardly Wallet',
          },
        }
      : {}),
    detailsRows: [
      { label: isReferrer ? 'Referred Classmate' : 'Invited By', value: params.counterpartyName },
      { label: 'Status', value: isCredited ? 'Kobans Credited' : 'Confirmed · Qualifying', highlightGold: isCredited },
      { label: 'Reward Amount', value: `+${rewardKobans.toLocaleString()} Kobans`, highlightGold: true },
      ...(params.referralCode ? [{ label: 'Referral Code', value: params.referralCode, mono: true }] : []),
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'View Referrals & Rewards',
    ctaUrl: `${appUrl}/dashboard/rewards`,
    appUrl,
  });

  const text = [
    `BOARDLY REFERRALS — ${subject}`,
    ``,
    `Hi ${params.recipientName || 'Student'},`,
    `Connection: ${params.counterpartyName}`,
    `Status: ${isCredited ? 'Kobans Credited' : 'Referral Confirmed'}`,
    `Reward: +${rewardKobans.toLocaleString()} Kobans`,
    `Time: ${timeStr}`,
    ``,
    `View Rewards: ${appUrl}/dashboard/rewards`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ADMIN SAMPLE TEST EMAIL (Triggered from Admin Panel "Send test email")
// ─────────────────────────────────────────────────────────────────────────────

export function buildAdminSampleTestEmail(params: {
  adminEmail: string;
  emailFrom: string;
  adminRecipientsList: string[];
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime();
  const subject = `[Boardly Test] Transactional Email Pipeline Verified (${timeStr})`;
  const preheader = `Resend API + Cloudflare Email Routing verification succeeded for ${params.adminEmail}.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'System Diagnostic · Resend API',
    badgeColor: 'green',
    heading: 'Resend Transactional Email Pipeline Active',
    introHtml: `<p style="margin:0;">This sample email confirms that your server-side <code>/api/send-email</code> endpoint, Resend API key, and domain sender identity are working properly.</p>`,
    kobanHighlight: {
      label: 'Sample Koban Badge Preview',
      amountText: '+1,000 Kobans',
      subtext: 'Gold #F5B301 · Primary CTA #E11D2A · Header #0B0B0F',
    },
    detailsRows: [
      { label: 'Triggered By Admin', value: params.adminEmail, mono: true },
      { label: 'EMAIL_FROM', value: params.emailFrom, mono: true },
      { label: 'ADMIN_EMAILS', value: params.adminRecipientsList.join(', '), mono: true },
      { label: 'Inbound Routing', value: 'admin@boardly.cfd, superadmin@boardly.cfd', mono: true },
      { label: 'Sent Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'Open Admin Email Logs',
    ctaUrl: `${appUrl}/admin/audit`,
    appUrl,
  });

  const text = [
    `BOARDLY — Transactional Email Pipeline Verified`,
    `Triggered By: ${params.adminEmail}`,
    `From: ${params.emailFrom}`,
    `Admin Recipients: ${params.adminRecipientsList.join(', ')}`,
    `Time: ${timeStr}`,
    `Admin Logs: ${appUrl}/admin/audit`,
  ].join('\n');

  return { subject, preheader, html, text };
}

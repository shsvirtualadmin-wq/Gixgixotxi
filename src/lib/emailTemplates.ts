/**
 * Boardly Transactional & Notification Email Templates
 * ============================================================================
 * Inline-styled HTML + Plain-Text fallback builders for all 7 Boardly email flows:
 * 1. Welcome & Onboarding (after signup)
 * 2. Koban Purchase Request Submitted & Approved / Rejected
 * 3. Kobans Received or Spent Receipt (Store purchases, daily claim, milestones, admin grants, referrals)
 * 4. Test Started (optional) & Test Completed Result Report + 00:00 PKT Daily Admin Digest
 * 5. Applications (Captain, Crew, Ambassador, Name request) Submitted & Approved / Rejected
 * 6. Referrals Confirmed & Referral Kobans Credited (both Referrer and Friend)
 * 7. Admin Sample Test Email
 *
 * Brand System:
 * - Outer canvas: #0B0B0F
 * - Card surface: #14141C (border #262635)
 * - Primary accent / CTA: #E11D2A
 * - Koban highlight gold: #F5B301
 * - Debit / Spent red: #FF6B74
 * - Text primary: #F4F4F6, muted: #A0A0B0
 */

import {
  PAYMENT_METHODS_PAIR_LABEL,
  formatPaymentMethodLabel,
} from '../constants/branding';
import { REFUND_POLICY_TEXT } from '../config/plans';

export type EmailEventType =
  | 'welcome_onboarding'
  | 'koban_purchase_request'
  | 'koban_purchase_approved'
  | 'koban_purchase_rejected'
  | 'koban_receipt'
  | 'pro_request_received'
  | 'pro_activated'
  | 'pro_request_rejected'
  | 'test_started'
  | 'test_completed'
  | 'daily_admin_digest'
  | 'application_submitted'
  | 'application_approved'
  | 'application_rejected'
  | 'application_decision'
  | 'referral_confirmed'
  | 'referral_reward_credited'
  | 'admin_sample_test'
  | 'admin_test_email';

export type TransactionalEmailEventType = EmailEventType;

/**
 * Sanity check before sending any email that displays a balance:
 * balance_after must equal balance_before + delta.
 */
export function verifyEmailBalanceSanity(params: {
  balanceBefore?: unknown;
  delta?: unknown;
  balanceAfter?: unknown;
  context?: string;
}): {
  valid: boolean;
  balanceBefore: number;
  delta: number;
  balanceAfter: number;
  error?: string;
} {
  const beforeNum = Number(params.balanceBefore);
  const deltaNum = Number(params.delta);
  const afterNum = Number(params.balanceAfter);

  if (
    params.balanceBefore === undefined ||
    params.balanceBefore === null ||
    params.balanceAfter === undefined ||
    params.balanceAfter === null ||
    !Number.isFinite(beforeNum) ||
    !Number.isFinite(deltaNum) ||
    !Number.isFinite(afterNum)
  ) {
    const err = `[EmailBalanceSanity] Missing or non-numeric balance figures (${params.context || 'unknown'}): balanceBefore=${String(
      params.balanceBefore
    )}, delta=${String(params.delta)}, balanceAfter=${String(params.balanceAfter)}`;
    console.error(err);
    return {
      valid: false,
      balanceBefore: 0,
      delta: Number.isFinite(deltaNum) ? Math.floor(deltaNum) : 0,
      balanceAfter: 0,
      error: err,
    };
  }

  const bBefore = Math.floor(beforeNum);
  const d = Math.floor(deltaNum);
  const bAfter = Math.floor(afterNum);

  if (bAfter !== bBefore + d) {
    const err = `[EmailBalanceSanity] Mismatch in ${params.context || 'email'}: balanceAfter (${bAfter}) !== balanceBefore (${bBefore}) + delta (${d})`;
    console.error(err);
    return {
      valid: false,
      balanceBefore: bBefore,
      delta: d,
      balanceAfter: bAfter,
      error: err,
    };
  }

  return {
    valid: true,
    balanceBefore: bBefore,
    delta: d,
    balanceAfter: bAfter,
  };
}

export type KobanReceiptSubType =
  | 'store_purchase'
  | 'pro_pass_purchase'
  | 'daily_claim'
  | 'daily_checkin'
  | 'milestone_claim'
  | 'referral_reward'
  | 'admin_grant'
  | 'captain_allotment'
  | 'koban_purchase_approved'
  | 'koban_purchase_rejected';

/**
 * Shared logo constants (2x PNG exported at 480x120, rendered at 160px wide)
 */
export const EMAIL_LOGO_PATH = '/email/boardly-logo.png';
export const EMAIL_LOGO_DARK_PATH = '/email/boardly-logo-dark.png';
export const EMAIL_LOGO_URL = 'https://boardly.cfd/email/boardly-logo.png';

export function getEmailLogoUrl(appUrl = 'https://boardly.cfd'): string {
  const cleanBase = String(appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  return `${cleanBase}${EMAIL_LOGO_PATH}`;
}

/**
 * Shared human-readable event label map for admin & student emails.
 * Never display raw enum codes in email bodies or subjects.
 */
export const EMAIL_EVENT_LABELS: Record<string, string> = {
  STORE_PURCHASE: 'Store purchase',
  PRO_PASS_PURCHASE: 'Pro pass purchase',
  PRO_REQUEST_RECEIVED: 'Pro request received',
  PRO_PASS_ACTIVATED: 'Pro pass activated',
  PRO_REQUEST_REJECTED: 'Pro request rejected',
  KOBAN_PURCHASE_APPROVED: 'Koban purchase approved',
  KOBAN_PURCHASE_REJECTED: 'Koban purchase rejected',
  KOBAN_PURCHASE_REQUEST: 'Koban purchase request',
  DAILY_CHECKIN: 'Daily check-in',
  DAILY_CLAIM: 'Daily check-in',
  MILESTONE_CLAIM: 'Milestone reward',
  REFERRAL_REWARD: 'Referral reward',
  REFERRAL_REWARD_CREDITED: 'Referral reward',
  ADMIN_GRANT: 'Admin grant',
  CAPTAIN_ALLOTMENT: 'Captain allotment',
};

/**
 * Formats an event code into a human-readable label using EMAIL_EVENT_LABELS,
 * with a fallback that turns any unknown code into Title Case with underscores removed.
 */
export function formatEmailEventLabel(code?: string | null): string {
  const raw = String(code || '').trim();
  if (!raw) return 'Wallet activity';
  const upperKey = raw.toUpperCase().replace(/[\s-]+/g, '_');
  if (EMAIL_EVENT_LABELS[upperKey]) {
    return EMAIL_EVENT_LABELS[upperKey];
  }
  const cleaned = raw.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return 'Wallet activity';
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export interface EmailNotificationPreferences {
  testStarted: boolean; // default: false (opt-in)
  smallKobanReceipts: boolean; // default: true (daily check-in & milestone Koban claims)
  marketingTips: boolean; // default: true (welcome & study tips)
}

export const DEFAULT_EMAIL_PREFERENCES: EmailNotificationPreferences = {
  testStarted: false,
  smallKobanReceipts: true,
  marketingTips: true,
};

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
  optionalCategory?: keyof EmailNotificationPreferences;
}

export function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats date and time in Pakistan Standard Time (Asia/Karachi) on a single line,
 * e.g. "7 Nov 2026, 06:19 AM PKT".
 */
export function formatPktDateTime(dateInput?: Date | string | number): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
    const datePart = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(safeDate);
    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(safeDate);
    return `${datePart}, ${timePart} PKT`;
  } catch {
    return `${new Date().toISOString()} (PKT)`;
  }
}

export function formatShortTxId(txId?: string | null): string {
  const clean = String(txId || '').trim();
  if (!clean) return 'N/A';
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 8)}…${clean.slice(-4)}`;
}

export function maskPaymentReference(ref?: string): string {
  const clean = String(ref || '').trim();
  if (!clean) return 'N/A';
  if (clean.length <= 4) return `***${clean}`;
  return `${'*'.repeat(Math.min(6, clean.length - 4))}${clean.slice(-4)}`;
}

export function formatDurationCompact(seconds?: number): string {
  const totalSec = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export interface EmailDetailRow {
  label: string;
  value: string;
  highlightGold?: boolean;
  highlightRed?: boolean;
  highlightGreen?: boolean;
  mutedSmall?: boolean;
  mono?: boolean;
}

export interface AdminStudentIdentityBlock {
  name: string;
  email?: string;
  uid?: string;
  transactionId?: string;
}

interface BaseEmailLayoutOptions {
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
    isNegative?: boolean;
  };
  studentIdentity?: AdminStudentIdentityBlock;
  detailsRows?: EmailDetailRow[];
  extraBodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  footerNoteHtml?: string;
  appUrl?: string;
  isOptionalEmail?: boolean;
  isAdminEmail?: boolean;
}

/**
 * Shared Email Header Component:
 * Renders the 2x dot-matrix Boardly logo PNG wrapped in a link to the app inside a dark
 * #0B0B0F table cell with color:#E11D2A so blocked images still show "Boardly" in red.
 */
export function renderEmailHeader(appUrl = 'https://boardly.cfd'): string {
  const cleanBase = String(appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const logoSrc = getEmailLogoUrl(cleanBase);
  return `
    <tr>
      <td bgcolor="#0B0B0F" style="padding:20px 24px;background-color:#0B0B0F;color:#E11D2A;border-bottom:1px solid #1C1C26;">
        <a href="${escapeHtml(cleanBase)}" target="_blank" style="display:inline-block;text-decoration:none;color:#E11D2A;">
          <img
            src="${escapeHtml(logoSrc)}"
            width="160"
            height="auto"
            alt="Boardly"
            style="display:block;border:0;outline:none;text-decoration:none;width:160px;height:auto;color:#E11D2A;font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:800;letter-spacing:0.06em;"
          />
        </a>
      </td>
    </tr>
  `.trim();
}

function renderStudentIdentityHtml(identity: AdminStudentIdentityBlock): string {
  const safeName = escapeHtml(identity.name || 'Student');
  const safeEmail = identity.email ? escapeHtml(identity.email) : '';
  const safeUid = identity.uid ? escapeHtml(identity.uid) : '';
  const safeTx = identity.transactionId ? escapeHtml(formatShortTxId(identity.transactionId)) : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;background-color:#111118;border:1px solid #262635;border-left:3px solid #E11D2A;border-radius:12px;">
      <tr>
        <td style="padding:14px 16px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#A0A0B0;margin-bottom:4px;">
            Student Account
          </div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:800;color:#F4F4F6;line-height:1.3;">
            ${safeName}
          </div>
          ${
            safeEmail
              ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#A0A0B0;margin-top:2px;word-break:break-all;">
                   <a href="mailto:${safeEmail}" style="color:#A0A0B0;text-decoration:none;">${safeEmail}</a>
                 </div>`
              : ''
          }
          <div style="margin-top:6px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:11px;color:#8E8EA0;line-height:1.5;word-break:break-all;">
            ${safeUid ? `<span>UID: <strong style="color:#D1D5DB;">${safeUid}</strong></span>` : ''}
            ${safeUid && safeTx ? `<span style="margin:0 6px;color:#3F3F52;">•</span>` : ''}
            ${safeTx ? `<span>TX: <strong style="color:#D1D5DB;">${safeTx}</strong></span>` : ''}
          </div>
        </td>
      </tr>
    </table>
  `.trim();
}

function renderBaseHtmlLayout(opts: BaseEmailLayoutOptions): string {
  const appUrl = (opts.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const settingsUrl = `${appUrl}/dashboard/settings`;
  const supportEmail = 'support@boardly.cfd';

  const badgeColors: Record<
    NonNullable<BaseEmailLayoutOptions['badgeColor']>,
    { bg: string; border: string; text: string }
  > = {
    red: { bg: '#2A0D12', border: '#E11D2A', text: '#FF6B74' },
    gold: { bg: '#2B220A', border: '#F5B301', text: '#F5B301' },
    green: { bg: '#0B291E', border: '#10B981', text: '#34D399' },
    neutral: { bg: '#1E1E2A', border: '#38384A', text: '#D1D5DB' },
  };

  const badgeStyle = badgeColors[opts.badgeColor || 'red'];

  const badgeHtml = opts.badgeText
    ? `<div style="margin-bottom:16px;">
         <span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:${badgeStyle.bg};border:1px solid ${badgeStyle.border};color:${badgeStyle.text};font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
           ${escapeHtml(opts.badgeText)}
         </span>
       </div>`
    : '';

  const isNegHighlight = Boolean(opts.kobanHighlight?.isNegative);
  const highlightBorderColor = isNegHighlight ? '#E11D2A' : '#F5B301';
  const highlightBgColor = isNegHighlight ? '#1E1115' : '#1B170D';
  const highlightTextColor = isNegHighlight ? '#FF6B74' : '#F5B301';

  const kobanHighlightHtml = opts.kobanHighlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:${highlightBgColor};border:1px solid ${highlightBorderColor};border-radius:14px;">
         <tr>
           <td style="padding:18px 20px;text-align:center;">
             <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#D4AF37;margin-bottom:4px;">
               ${escapeHtml(opts.kobanHighlight.label)}
             </div>
             <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:28px;font-weight:800;color:${highlightTextColor};line-height:1.2;">
               ${escapeHtml(opts.kobanHighlight.amountText)}
             </div>
             ${
               opts.kobanHighlight.subtext
                 ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#E5E7EB;margin-top:6px;font-weight:600;">
                      ${escapeHtml(opts.kobanHighlight.subtext)}
                    </div>`
                 : ''
             }
           </td>
         </tr>
       </table>`
    : '';

  const studentIdentityHtml = opts.studentIdentity
    ? renderStudentIdentityHtml(opts.studentIdentity)
    : '';

  const detailsTableHtml =
    opts.detailsRows && opts.detailsRows.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#101017;border:1px solid #23232F;border-radius:12px;overflow:hidden;">
           ${opts.detailsRows
             .map((row, idx) => {
               const isLast = idx === opts.detailsRows!.length - 1;
               const borderBottom = isLast ? 'none' : '1px solid #1E1E28';

               let valueColor = '#F3F4F6';
               let valueFontSize = '14px';
               let valueFontWeight = '600';

               if (row.highlightGold) {
                 valueColor = '#F5B301';
                 valueFontWeight = '800';
               } else if (row.highlightRed) {
                 valueColor = '#FF6B74';
                 valueFontWeight = '800';
               } else if (row.highlightGreen) {
                 valueColor = '#34D399';
                 valueFontWeight = '800';
               } else if (row.mutedSmall) {
                 valueColor = '#9CA3AF';
                 valueFontSize = '12px';
                 valueFontWeight = '500';
               }

               const fontFamily = row.mono
                 ? "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace"
                 : "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

               return `
                 <tr>
                   <td style="padding:12px 16px;border-bottom:${borderBottom};">
                     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bd-row-table">
                       <tr class="bd-row-inner-tr">
                         <td class="bd-row-label" style="display:block;width:100%;padding:0 0 4px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9CA3AF;text-align:left;">
                           ${escapeHtml(row.label)}
                         </td>
                         <td class="bd-row-value" style="display:block;width:100%;padding:0;font-family:${fontFamily};font-size:${valueFontSize};font-weight:${valueFontWeight};color:${valueColor};text-align:left;word-break:break-word;">
                           ${escapeHtml(row.value)}
                         </td>
                       </tr>
                     </table>
                   </td>
                 </tr>`;
             })
             .join('')}
         </table>`
      : '';

  const ctaHtml =
    opts.ctaLabel && opts.ctaUrl
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px 0;">
           <tr>
             <td align="left">
               <a href="${escapeHtml(opts.ctaUrl)}" target="_blank" style="display:inline-block;padding:13px 24px;background-color:#E11D2A;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
                 ${escapeHtml(opts.ctaLabel)} &rarr;
               </a>
               ${
                 opts.secondaryCtaLabel && opts.secondaryCtaUrl
                   ? `<a href="${escapeHtml(opts.secondaryCtaUrl)}" target="_blank" style="display:inline-block;margin-left:10px;padding:12px 18px;background-color:#1E1E2A;border:1px solid #323246;color:#E5E7EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;border-radius:10px;">
                        ${escapeHtml(opts.secondaryCtaLabel)}
                      </a>`
                   : ''
               }
             </td>
           </tr>
         </table>`
      : '';

  const footerContentHtml = opts.isAdminEmail
    ? `<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#8E8EA0;line-height:1.6;font-weight:600;">
         Internal admin notification
       </p>
       <p style="margin:4px 0 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#6B7280;line-height:1.5;">
         Boardly Admin · <a href="${escapeHtml(appUrl)}/admin" style="color:#9CA3AF;text-decoration:none;">boardly.cfd/admin</a>
       </p>`
    : `<p style="margin:0 0 6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#8E8EA0;line-height:1.6;">
         Need help? Contact us at <a href="mailto:${supportEmail}" style="color:#E11D2A;text-decoration:none;font-weight:600;">${supportEmail}</a>
       </p>
       <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#6B7280;line-height:1.5;">
         Boardly · Pakistan’s Entrance Exam &amp; Study Platform · <a href="${escapeHtml(appUrl)}" style="color:#9CA3AF;text-decoration:none;">boardly.cfd</a>
         ${
           opts.isOptionalEmail
             ? ` · <a href="${escapeHtml(settingsUrl)}" style="color:#9CA3AF;text-decoration:underline;">Manage email preferences</a>`
             : ''
         }
       </p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark light" />
  <title>${escapeHtml(opts.subject)}</title>
  <style>
    .bd-row-table { width: 100% !important; border-collapse: collapse !important; }
    .bd-row-label { display: block !important; width: 100% !important; text-align: left !important; padding: 0 0 4px 0 !important; }
    .bd-row-value { display: block !important; width: 100% !important; text-align: left !important; padding: 0 !important; }
    @media only screen and (min-width: 481px) {
      .bd-row-inner-tr { display: table-row !important; }
      .bd-row-label { display: table-cell !important; width: 42% !important; padding: 0 12px 0 0 !important; vertical-align: middle !important; white-space: nowrap !important; }
      .bd-row-value { display: table-cell !important; width: 58% !important; padding: 0 !important; text-align: right !important; vertical-align: middle !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0B0B0F;color:#F4F4F6;-webkit-font-smoothing:antialiased;">
  <!-- Hidden preheader text -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${escapeHtml(opts.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0B0F;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#14141C;border:1px solid #262635;border-radius:16px;overflow:hidden;">
          <!-- Brand Header -->
          ${renderEmailHeader(appUrl)}

          <!-- Main Content -->
          <tr>
            <td style="padding:28px 24px 24px 24px;">
              ${badgeHtml}
              <h1 style="margin:0 0 14px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;color:#FFFFFF;line-height:1.3;letter-spacing:-0.01em;">
                ${escapeHtml(opts.heading)}
              </h1>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#D1D5DB;">
                ${opts.introHtml}
              </div>

              ${studentIdentityHtml}
              ${kobanHighlightHtml}
              ${detailsTableHtml}
              ${opts.extraBodyHtml || ''}
              ${ctaHtml}

              ${
                opts.footerNoteHtml
                  ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #222230;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#9CA3AF;">
                       ${opts.footerNoteHtml}
                     </div>`
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 24px;background-color:#0E0E14;border-top:1px solid #1E1E2A;">
              ${footerContentHtml}
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
// 1. WELCOME & ONBOARDING EMAIL (After Signup)
// ─────────────────────────────────────────────────────────────────────────────

export function buildWelcomeOnboardingEmail(params: {
  studentName: string;
  studentEmail?: string;
  referralCode?: string;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const firstName = (params.studentName || 'Student').trim().split(/\s+/)[0] || 'Student';
  const subject = `Welcome to Boardly, ${firstName}! Your Entrance Prep Starts Now`;
  const preheader = `Practice MDCAT, ECAT, NET, FAST & NTS MCQs, claim daily Kobans, and climb the Grand Line leaderboard.`;

  const stepsHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;background-color:#101017;border:1px solid #242432;border-radius:12px;">
      <tr>
        <td style="padding:16px 18px;border-bottom:1px solid #1E1E2A;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;">
            1. Take Your First Timed Practice Test
          </div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#9CA3AF;margin-top:4px;">
            Pick your target university pattern (MDCAT, NET, FAST, ECAT, NTS) and get instant per-subject accuracy analytics.
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 18px;border-bottom:1px solid #1E1E2A;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#F5B301;">
            2. Claim Daily Check-In &amp; Milestone Kobans
          </div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#9CA3AF;margin-top:4px;">
            Earn free Kobans every day and unlock profile frames, nameplates, and aura effects in the Boardly Store.
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;">
            3. Invite Friends (+5,000 Kobans Each)
          </div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#9CA3AF;margin-top:4px;">
            Share your personal invite link from the Rewards Hub. When a friend verifies their email and completes 20 MCQs, you earn <strong style="color:#F5B301;">5,000 Kobans</strong> and they get <strong style="color:#F5B301;">1,000 Kobans</strong>.
          </div>
        </td>
      </tr>
    </table>
  `;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Welcome Aboard',
    badgeColor: 'red',
    heading: `Welcome to Boardly, ${firstName}!`,
    introHtml: `<p style="margin:0 0 12px 0;">Your account is ready. Boardly is built to help you master university entrance tests with real exam simulations, subject-level analytics, and competitive study squads.</p>`,
    extraBodyHtml: stepsHtml,
    ctaLabel: 'Start Practising Now',
    ctaUrl: `${appUrl}/dashboard/practice`,
    secondaryCtaLabel: 'Open Rewards Hub',
    secondaryCtaUrl: `${appUrl}/dashboard/rewards`,
    appUrl,
  });

  const text = [
    `Welcome to Boardly, ${firstName}!`,
    ``,
    `Your account is ready. Here is how to get started:`,
    `1. Take a timed practice test: ${appUrl}/dashboard/practice`,
    `2. Claim daily check-in Kobans & Store cosmetics: ${appUrl}/dashboard/rewards`,
    `3. Invite friends to earn +5,000 Kobans per qualified referral.`,
    ``,
    `Need help? Contact us at support@boardly.cfd`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. KOBAN PURCHASE REQUEST, APPROVAL & REJECTION
// ─────────────────────────────────────────────────────────────────────────────

export function buildKobanPurchaseRequestStudentEmail(params: {
  studentName: string;
  requestId?: string;
  kobansAmount: number;
  pkrAmount: number;
  paymentMethod: string;
  transactionId: string;
  packageName?: string;
  createdAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const maskedRef = maskPaymentReference(params.transactionId);
  const timeStr = formatPktDateTime(params.createdAt);
  const pkgLabel = params.packageName || `${params.kobansAmount.toLocaleString()} Kobans Pack`;

  const subject = `We received your Koban request (${params.kobansAmount.toLocaleString()} Kobans) — Boardly`;
  const preheader = `Your payment verification (${maskedRef}) for ${params.kobansAmount.toLocaleString()} Kobans is under admin review.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Verification Pending',
    badgeColor: 'gold',
    heading: 'We received your Koban purchase request',
    introHtml: `<p style="margin:0;">Hi <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, we have received your payment details and our admin team is verifying your transfer. You will receive an email confirmation as soon as your Kobans are credited.</p>`,
    kobanHighlight: {
      label: pkgLabel,
      amountText: `${params.kobansAmount.toLocaleString()} Kobans`,
      subtext: `PKR ${params.pkrAmount.toLocaleString()} via ${formatPaymentMethodLabel(params.paymentMethod)}`,
    },
    detailsRows: [
      { label: 'Package', value: pkgLabel },
      { label: 'Kobans Requested', value: `${params.kobansAmount.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'Amount Paid', value: `PKR ${params.pkrAmount.toLocaleString()}` },
      { label: 'Payment Method', value: formatPaymentMethodLabel(params.paymentMethod) },
      { label: 'Payment Reference', value: maskedRef, mono: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'Check Wallet Status',
    ctaUrl: `${appUrl}/dashboard/rewards`,
    appUrl,
  });

  const text = [
    `BOARDLY — We received your Koban purchase request`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `We received your payment verification request and our team is reviewing it.`,
    ``,
    `Package: ${pkgLabel}`,
    `Kobans Requested: ${params.kobansAmount.toLocaleString()} Kobans`,
    `Amount Paid: PKR ${params.pkrAmount.toLocaleString()}`,
    `Payment Method: ${formatPaymentMethodLabel(params.paymentMethod)}`,
    `Payment Reference: ${maskedRef}`,
    `Time (PKT): ${timeStr}`,
    ``,
    `Check your wallet: ${appUrl}/dashboard/rewards`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildKobanPurchaseRequestAdminEmail(params: {
  requestId?: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  kobansAmount: number;
  pkrAmount: number;
  paymentMethod: string;
  transactionId: string;
  packageName?: string;
  note?: string;
  createdAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.createdAt);
  const pkgLabel = params.packageName || `${params.kobansAmount.toLocaleString()} Kobans Pack`;
  const eventLabel = formatEmailEventLabel('KOBAN_PURCHASE_REQUEST');
  const txId = params.transactionId || params.requestId || 'N/A';

  const subject = `${eventLabel}: +${params.kobansAmount.toLocaleString()} Kobans (PKR ${params.pkrAmount.toLocaleString()}) by ${params.studentName || 'Student'}`;
  const preheader = `${params.studentName} (${params.studentEmail}) submitted TRX ${params.transactionId} via ${formatPaymentMethodLabel(params.paymentMethod)}.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: eventLabel,
    badgeColor: 'red',
    heading: `${eventLabel}: +${params.kobansAmount.toLocaleString()} Kobans`,
    introHtml: `<p style="margin:0;">A student submitted a mobile payment transfer for verification.</p>`,
    studentIdentity: {
      name: params.studentName || 'Student',
      email: params.studentEmail,
      uid: params.studentUid,
      transactionId: txId,
    },
    detailsRows: [
      { label: 'Event type', value: eventLabel },
      { label: 'Package', value: pkgLabel },
      { label: 'Kobans received (pending)', value: `+${params.kobansAmount.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'PKR amount', value: `PKR ${params.pkrAmount.toLocaleString()}` },
      { label: 'Payment method', value: formatPaymentMethodLabel(params.paymentMethod) },
      { label: 'Transaction ID', value: formatShortTxId(txId), mono: true },
      { label: 'Full reference', value: params.transactionId, mono: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'View this transaction',
    ctaUrl: `${appUrl}/admin/wallets/${encodeURIComponent(params.studentUid)}?tx=${encodeURIComponent(txId)}`,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY ADMIN — ${subject}`,
    ``,
    `Student: ${params.studentName} (${params.studentEmail})`,
    `User ID: ${params.studentUid}`,
    `Event type: ${eventLabel}`,
    `Package: ${pkgLabel}`,
    `Kobans requested: +${params.kobansAmount.toLocaleString()} Kobans`,
    `PKR amount: PKR ${params.pkrAmount.toLocaleString()}`,
    `Payment method: ${formatPaymentMethodLabel(params.paymentMethod)}`,
    `Transaction ID: ${txId}`,
    `Time (PKT): ${timeStr}`,
    ``,
    `View this transaction: ${appUrl}/admin/wallets/${encodeURIComponent(params.studentUid)}?tx=${encodeURIComponent(txId)}`,
    `Internal admin notification`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildKobanPurchaseApprovedStudentEmail(params: {
  requestId?: string;
  studentName: string;
  kobansCredited?: number;
  approvedKobans?: number;
  kobansAmount?: number;
  balanceBefore?: number;
  newBalance: number;
  transactionId?: string;
  approvedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.approvedAt);
  const maskedRef = maskPaymentReference(params.transactionId);
  const credited = Math.max(
    0,
    Math.floor(Number(params.kobansCredited ?? params.approvedKobans ?? params.kobansAmount) || 0)
  );
  const afterBal = Math.max(0, Math.floor(Number(params.newBalance) || 0));
  const beforeBal =
    typeof params.balanceBefore === 'number' && Number.isFinite(params.balanceBefore)
      ? Math.max(0, Math.floor(params.balanceBefore))
      : Math.max(0, afterBal - credited);

  const subject = `+${credited.toLocaleString()} Kobans Added to Your Wallet! — Boardly`;
  const preheader = `Your payment has been verified. Balance before: ${beforeBal.toLocaleString()} Kobans · New wallet balance: ${afterBal.toLocaleString()} Kobans.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Payment Approved',
    badgeColor: 'gold',
    heading: `+${credited.toLocaleString()} Kobans credited to your wallet!`,
    introHtml: `<p style="margin:0;">Great news, <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>! Your payment request has been verified and your Kobans are now ready to spend in the Boardly Store.</p>`,
    kobanHighlight: {
      label: 'Kobans Credited',
      amountText: `+${credited.toLocaleString()} Kobans`,
      subtext: `Balance before: ${beforeBal.toLocaleString()} Kobans  •  New Balance: ${afterBal.toLocaleString()} Kobans`,
    },
    detailsRows: [
      { label: 'Status', value: 'Approved & Credited' },
      { label: 'Kobans credited', value: `+${credited.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'Balance before', value: `${beforeBal.toLocaleString()} Kobans`, mutedSmall: true },
      { label: 'New balance', value: `${afterBal.toLocaleString()} Kobans`, highlightGold: true },
      ...(params.transactionId ? [{ label: 'Payment reference', value: maskedRef, mono: true }] : []),
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'Visit Boardly Store',
    ctaUrl: `${appUrl}/store`,
    secondaryCtaLabel: 'Open Wallet',
    secondaryCtaUrl: `${appUrl}/dashboard/rewards`,
    appUrl,
  });

  const text = [
    `BOARDLY — +${credited.toLocaleString()} Kobans Added to Your Wallet!`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `Your Koban purchase request has been approved!`,
    ``,
    `Kobans Credited: +${credited.toLocaleString()} Kobans`,
    `Balance Before: ${beforeBal.toLocaleString()} Kobans`,
    `New Balance: ${afterBal.toLocaleString()} Kobans`,
    ...(params.transactionId ? [`Payment Reference: ${maskedRef}`] : []),
    `Time (PKT): ${timeStr}`,
    ``,
    `Spend your Kobans in the Boardly Store: ${appUrl}/store`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildKobanPurchaseRejectedStudentEmail(params: {
  studentName: string;
  requestedKobans: number;
  transactionId?: string;
  reason: string;
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
      { label: 'Requested amount', value: `${params.requestedKobans.toLocaleString()} Kobans` },
      { label: 'Payment reference', value: maskedRef, mono: true },
      { label: 'Reason', value: params.reason || 'Transaction ID could not be verified on mobile banking portal.' },
      { label: 'Time (PKT)', value: timeStr },
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
    `Time (PKT): ${timeStr}`,
    ``,
    `What to do next: Double-check your Transaction ID (TRX) and submit a corrected request at ${appUrl}/dashboard/rewards, or email admin@boardly.cfd with your payment receipt.`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildKobanPurchaseDecisionAdminCopyEmail(params: {
  decision: 'approved' | 'rejected';
  adminEmail: string;
  studentUid?: string;
  studentName: string;
  studentEmail?: string;
  kobansAmount: number;
  balanceBefore?: number;
  newBalance?: number;
  transactionId?: string;
  ledgerId?: string;
  reason?: string;
  decidedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.decidedAt);
  const isApproved = params.decision === 'approved';
  const eventCode = isApproved ? 'KOBAN_PURCHASE_APPROVED' : 'KOBAN_PURCHASE_REJECTED';
  const eventLabel = formatEmailEventLabel(eventCode);
  const amount = Math.max(0, Math.floor(Number(params.kobansAmount) || 0));
  const hasNewBal = typeof params.newBalance === 'number' && Number.isFinite(params.newBalance);
  const afterBal = hasNewBal ? Math.max(0, Math.floor(params.newBalance!)) : undefined;
  const beforeBal =
    typeof params.balanceBefore === 'number' && Number.isFinite(params.balanceBefore)
      ? Math.max(0, Math.floor(params.balanceBefore))
      : afterBal !== undefined && isApproved
      ? Math.max(0, afterBal - amount)
      : undefined;

  const txId = params.ledgerId || params.transactionId || 'N/A';
  const uidForUrl = params.studentUid || 'search';

  const subject = isApproved
    ? `${eventLabel}: +${amount.toLocaleString()} Kobans by ${params.studentName || 'Student'}`
    : `${eventLabel}: ${amount.toLocaleString()} Kobans by ${params.studentName || 'Student'}`;

  const preheader = `${eventLabel} (${isApproved ? '+' : ''}${amount.toLocaleString()} Kobans) for ${params.studentName}${
    afterBal !== undefined ? ` · New balance: ${afterBal.toLocaleString()} Kobans` : ''
  }.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: eventLabel,
    badgeColor: isApproved ? 'green' : 'red',
    heading: `${eventLabel} · ${params.studentName || 'Student'}`,
    introHtml: `<p style="margin:0;">Processed by administrator <strong>${escapeHtml(params.adminEmail)}</strong>.</p>`,
    studentIdentity: {
      name: params.studentName || 'Student',
      email: params.studentEmail,
      uid: params.studentUid,
      transactionId: txId,
    },
    detailsRows: [
      { label: 'Event type', value: eventLabel },
      ...(beforeBal !== undefined
        ? [{ label: 'Balance before', value: `${beforeBal.toLocaleString()} Kobans`, mutedSmall: true }]
        : []),
      {
        label: isApproved ? 'Kobans received' : 'Requested amount',
        value: `${isApproved ? '+' : ''}${amount.toLocaleString()} Kobans`,
        highlightGold: isApproved,
        highlightRed: !isApproved,
      },
      ...(afterBal !== undefined
        ? [{ label: 'New balance', value: `${afterBal.toLocaleString()} Kobans`, highlightGold: true }]
        : []),
      { label: 'Transaction ID', value: formatShortTxId(txId), mono: true },
      { label: 'Action by', value: params.adminEmail, mono: true },
      ...(params.reason ? [{ label: 'Rejection reason', value: params.reason }] : []),
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'View this transaction',
    ctaUrl: `${appUrl}/admin/wallets/${encodeURIComponent(uidForUrl)}?tx=${encodeURIComponent(txId)}`,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY ADMIN — ${subject}`,
    ``,
    `Student: ${params.studentName} (${params.studentEmail || 'N/A'})`,
    ...(params.studentUid ? [`User ID: ${params.studentUid}`] : []),
    `Event type: ${eventLabel}`,
    ...(beforeBal !== undefined ? [`Balance before: ${beforeBal.toLocaleString()} Kobans`] : []),
    `${isApproved ? 'Kobans received' : 'Requested amount'}: ${isApproved ? '+' : ''}${amount.toLocaleString()} Kobans`,
    ...(afterBal !== undefined ? [`New balance: ${afterBal.toLocaleString()} Kobans`] : []),
    `Transaction ID: ${txId}`,
    `Action by: ${params.adminEmail}`,
    ...(params.reason ? [`Reason: ${params.reason}`] : []),
    `Time (PKT): ${timeStr}`,
    ``,
    `View this transaction: ${appUrl}/admin/wallets/${encodeURIComponent(uidForUrl)}?tx=${encodeURIComponent(txId)}`,
    `Internal admin notification`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. KOBANS RECEIVED OR SPENT FOR ANY REASON (Student Receipt + Selective Admin Alert)
// ─────────────────────────────────────────────────────────────────────────────

export interface KobanReceiptLineItem {
  id?: string;
  name: string;
  category?: string;
  priceKobans: number;
}

export function buildKobanReceiptStudentEmail(params: {
  studentName: string;
  deltaAmount?: number; // positive = received, negative = spent
  amount?: number;
  balanceBefore?: number;
  newBalance: number;
  reason: string;
  subType?: KobanReceiptSubType;
  eventType?: KobanReceiptSubType;
  itemName?: string;
  itemNames?: string[];
  items?: KobanReceiptLineItem[];
  transactionId?: string;
  timestamp?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const rawDelta = Number(params.deltaAmount ?? params.amount ?? 0);
  const subTypeVal = (params.subType || params.eventType || 'store_purchase') as KobanReceiptSubType;
  const isPositive = rawDelta >= 0;
  const absAmount = Math.abs(Math.floor(rawDelta));
  const afterBal = Math.max(0, Math.floor(Number(params.newBalance) || 0));
  const beforeBal =
    typeof params.balanceBefore === 'number' && Number.isFinite(params.balanceBefore)
      ? Math.max(0, Math.floor(params.balanceBefore))
      : Math.max(0, afterBal - Math.floor(rawDelta));

  const amountSignText = isPositive
    ? `+${absAmount.toLocaleString()} Kobans received`
    : `-${absAmount.toLocaleString()} Kobans spent`;
  const timeStr = formatPktDateTime(params.timestamp);
  const isSmallOptional =
    subTypeVal === 'daily_claim' ||
    subTypeVal === 'daily_checkin' ||
    subTypeVal === 'milestone_claim';

  const lineItems = Array.isArray(params.items)
    ? params.items.filter((it) => it && typeof it.name === 'string')
    : [];

  const subject = `${amountSignText} (${params.reason}) — Boardly`;
  const preheader = `${amountSignText} · Balance before: ${beforeBal.toLocaleString()} Kobans · New balance: ${afterBal.toLocaleString()} Kobans.`;

  const itemizedTableHtml =
    lineItems.length > 0
      ? `<div style="margin:18px 0 6px 0;">
           <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;margin-bottom:8px;">
             Itemized Store Receipt (${lineItems.length} ${lineItems.length === 1 ? 'Item' : 'Items'})
           </div>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#121218;border:1px solid #23232F;border-radius:14px;overflow:hidden;">
             <tr style="background-color:#181822;">
               <th align="left" style="padding:10px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9CA3AF;border-bottom:1px solid #23232F;">
                 Item
               </th>
               <th align="right" style="padding:10px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9CA3AF;border-bottom:1px solid #23232F;">
                 Price
               </th>
             </tr>
             ${lineItems
               .map(
                 (it, idx) => `
               <tr>
                 <td style="padding:10px 14px;border-bottom:${
                   idx === lineItems.length - 1 ? '1px solid #23232F' : '1px solid #1E1E28'
                 };font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#F3F4F6;font-weight:600;">
                   ${escapeHtml(it.name)}
                   ${
                     it.category
                       ? `<div style="font-size:11px;color:#9CA3AF;font-weight:400;text-transform:capitalize;margin-top:2px;">${escapeHtml(
                           it.category
                         )}</div>`
                       : ''
                   }
                 </td>
                 <td align="right" style="padding:10px 14px;border-bottom:${
                   idx === lineItems.length - 1 ? '1px solid #23232F' : '1px solid #1E1E28'
                 };font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:13px;font-weight:700;color:#F5B301;white-space:nowrap;">
                   ${Math.max(0, Math.floor(Number(it.priceKobans) || 0)).toLocaleString()} Kobans
                 </td>
               </tr>`
               )
               .join('')}
             <tr style="background-color:#15130E;">
               <td style="padding:11px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#FFFFFF;">
                 Total Spent
               </td>
               <td align="right" style="padding:11px 14px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:14px;font-weight:800;color:#FF6B74;white-space:nowrap;">
                 -${absAmount.toLocaleString()} Kobans
               </td>
             </tr>
           </table>
         </div>`
      : '';

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: isPositive ? 'Kobans Credited' : 'Kobans Spent',
    badgeColor: isPositive ? 'gold' : 'red',
    heading: amountSignText,
    introHtml: `<p style="margin:0;">Hi <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, here is your Boardly Koban wallet receipt.</p>`,
    kobanHighlight: {
      label: formatEmailEventLabel(subTypeVal),
      amountText: isPositive ? `+${absAmount.toLocaleString()} Kobans` : `-${absAmount.toLocaleString()} Kobans`,
      subtext: `Balance before: ${beforeBal.toLocaleString()} Kobans  •  New Balance: ${afterBal.toLocaleString()} Kobans`,
      isNegative: !isPositive,
    },
    extraBodyHtml: itemizedTableHtml,
    detailsRows: [
      { label: 'Event type', value: formatEmailEventLabel(subTypeVal) },
      { label: 'Activity', value: params.reason },
      ...(params.itemName && lineItems.length === 0 ? [{ label: 'Item', value: params.itemName }] : []),
      {
        label: isPositive ? 'Kobans received' : 'Kobans spent',
        value: `${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans`,
        highlightGold: isPositive,
        highlightRed: !isPositive,
      },
      { label: 'Balance before', value: `${beforeBal.toLocaleString()} Kobans`, mutedSmall: true },
      { label: 'New balance', value: `${afterBal.toLocaleString()} Kobans`, highlightGold: true },
      ...(params.transactionId
        ? [{ label: 'Transaction ID', value: formatShortTxId(params.transactionId), mono: true }]
        : []),
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: subTypeVal === 'store_purchase' ? 'View Cosmetics in Store' : 'Open Student Rewards',
    ctaUrl: subTypeVal === 'store_purchase' ? `${appUrl}/store` : `${appUrl}/dashboard/rewards`,
    appUrl,
    isOptionalEmail: isSmallOptional,
  });

  const itemizedTextLines =
    lineItems.length > 0
      ? [
          ``,
          `ITEMIZED RECEIPT:`,
          ...lineItems.map(
            (it) =>
              `- ${it.name}${it.category ? ` (${it.category})` : ''}: ${Math.max(
                0,
                Math.floor(Number(it.priceKobans) || 0)
              ).toLocaleString()} Kobans`
          ),
          `Total Spent: -${absAmount.toLocaleString()} Kobans`,
        ]
      : [];

  const text = [
    `BOARDLY WALLET RECEIPT — ${amountSignText}`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `Event: ${formatEmailEventLabel(subTypeVal)}`,
    `Reason: ${params.reason}`,
    ...itemizedTextLines,
    `${isPositive ? 'Kobans received' : 'Kobans spent'}: ${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans`,
    `Balance before: ${beforeBal.toLocaleString()} Kobans`,
    `New balance: ${afterBal.toLocaleString()} Kobans`,
    ...(params.transactionId ? [`Transaction ID: ${formatShortTxId(params.transactionId)}`] : []),
    `Time (PKT): ${timeStr}`,
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
  deltaAmount?: number;
  amount?: number;
  balanceBefore?: number;
  newBalance: number;
  reason: string;
  subType?: KobanReceiptSubType;
  eventType?: KobanReceiptSubType;
  itemName?: string;
  itemNames?: string[];
  items?: KobanReceiptLineItem[];
  transactionId?: string;
  adminEmail?: string;
  timestamp?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const rawDelta = Number(params.deltaAmount ?? params.amount ?? 0);
  const subTypeVal = (params.subType || params.eventType || 'store_purchase') as KobanReceiptSubType;
  const isPositive = rawDelta >= 0;
  const absAmount = Math.abs(Math.floor(rawDelta));
  const afterBal = Math.max(0, Math.floor(Number(params.newBalance) || 0));
  const beforeBal =
    typeof params.balanceBefore === 'number' && Number.isFinite(params.balanceBefore)
      ? Math.max(0, Math.floor(params.balanceBefore))
      : Math.max(0, afterBal - Math.floor(rawDelta));

  const timeStr = formatPktDateTime(params.timestamp);
  const eventLabel = formatEmailEventLabel(subTypeVal);

  const lineItems = Array.isArray(params.items)
    ? params.items.filter((it) => it && typeof it.name === 'string')
    : [];
  const itemsSummary =
    lineItems.length > 0
      ? lineItems
          .map((it) => `${it.name} (${Math.max(0, Math.floor(Number(it.priceKobans) || 0)).toLocaleString()} Kobans)`)
          .join(', ')
      : undefined;

  const primaryItemLabel =
    lineItems.length === 1
      ? lineItems[0].name
      : lineItems.length > 1
      ? `${lineItems[0].name} +${lineItems.length - 1} more`
      : params.itemName || (Array.isArray(params.itemNames) && params.itemNames[0]) || params.reason.replace(/^Store Purchase:\s*/i, '').trim() || eventLabel;

  const signedKobansText = `${isPositive ? '+' : '-'}${absAmount.toLocaleString()} Kobans`;
  const studentDisplay = params.studentName || params.studentEmail || params.studentUid || 'Student';
  const txId = params.transactionId || `${subTypeVal}_${Date.now()}`;

  // Informative subject line, e.g. "Store purchase: Sakura Blade Ring (-840 Kobans) by <student name>"
  const subject = `${eventLabel}: ${primaryItemLabel} (${signedKobansText}) by ${studentDisplay}`;
  const preheader = `${eventLabel} by ${studentDisplay}: ${signedKobansText}. Balance before: ${beforeBal.toLocaleString()} Kobans → New balance: ${afterBal.toLocaleString()} Kobans.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: eventLabel,
    badgeColor: isPositive ? 'gold' : 'red',
    heading: `${eventLabel}: ${primaryItemLabel}`,
    introHtml: `<p style="margin:0;">Wallet transaction recorded for <strong>${escapeHtml(studentDisplay)}</strong>.</p>`,
    studentIdentity: {
      name: studentDisplay,
      email: params.studentEmail,
      uid: params.studentUid,
      transactionId: txId,
    },
    detailsRows: [
      { label: 'Event type', value: eventLabel },
      { label: 'Description', value: params.reason },
      ...(itemsSummary ? [{ label: `Items (${lineItems.length})`, value: itemsSummary }] : []),
      { label: 'Balance before', value: `${beforeBal.toLocaleString()} Kobans`, mutedSmall: true },
      {
        label: isPositive ? 'Kobans received' : 'Kobans spent',
        value: signedKobansText,
        highlightGold: isPositive,
        highlightRed: !isPositive,
      },
      { label: 'New balance', value: `${afterBal.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'Transaction ID', value: formatShortTxId(txId), mono: true },
      ...(params.adminEmail ? [{ label: 'Performed by admin', value: params.adminEmail, mono: true }] : []),
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'View this transaction',
    ctaUrl: `${appUrl}/admin/wallets/${encodeURIComponent(params.studentUid)}?tx=${encodeURIComponent(txId)}`,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY ADMIN — ${subject}`,
    ``,
    `Student: ${studentDisplay} (${params.studentEmail || 'N/A'})`,
    `User ID: ${params.studentUid}`,
    `Event type: ${eventLabel}`,
    `Description: ${params.reason}`,
    ...(itemsSummary ? [`Items: ${itemsSummary}`] : []),
    `Balance before: ${beforeBal.toLocaleString()} Kobans`,
    `${isPositive ? 'Kobans received' : 'Kobans spent'}: ${signedKobansText}`,
    `New balance: ${afterBal.toLocaleString()} Kobans`,
    `Transaction ID: ${formatShortTxId(txId)}`,
    ...(params.adminEmail ? [`Performed by admin: ${params.adminEmail}`] : []),
    `Time (PKT): ${timeStr}`,
    ``,
    `View this transaction: ${appUrl}/admin/wallets/${encodeURIComponent(params.studentUid)}?tx=${encodeURIComponent(txId)}`,
    `Internal admin notification`,
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
      { label: 'Test name', value: params.testName },
      { label: 'University / Pattern', value: params.universityPattern || 'Standard Drill' },
      { label: 'Subject scope', value: params.subjectScope || 'General' },
      { label: 'Total questions', value: `${params.totalQuestions} MCQs` },
      ...(params.durationMinutes ? [{ label: 'Time limit', value: `${params.durationMinutes} minutes` }] : []),
      { label: 'Time (PKT)', value: timeStr },
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
    `Time (PKT): ${timeStr}`,
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
      { label: 'Test name', value: params.testName },
      { label: 'University / Pattern', value: params.universityPattern || 'Standard Drill' },
      { label: 'Subject scope', value: params.subjectScope || 'All Subjects' },
      { label: 'Time (PKT)', value: timeStr },
      { label: 'Duration used', value: durationStr },
      { label: 'Total questions', value: String(params.totalQuestions), mono: true },
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
    `Time (PKT): ${timeStr}`,
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
  const timeStr = formatPktDateTime();
  const subject = `Daily digest (${params.pktDateLabel}): ${params.testsTakenCount} tests · +${params.totalKobansEarned.toLocaleString()} / -${params.totalKobansSpent.toLocaleString()} Kobans`;
  const preheader = `00:00 PKT Summary: ${params.testsTakenCount} tests completed, +${params.totalKobansEarned.toLocaleString()} Kobans received, -${params.totalKobansSpent.toLocaleString()} Kobans spent.`;

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
    badgeText: 'Daily Admin Digest',
    badgeColor: 'red',
    heading: `Boardly Daily Summary · ${params.pktDateLabel}`,
    introHtml: `<p style="margin:0;">Automated 24-hour activity digest across entrance tests and the Kobans economy.</p>`,
    detailsRows: [
      { label: 'Date window (PKT)', value: params.pktDateLabel },
      { label: 'Total tests taken', value: String(params.testsTakenCount), mono: true },
      { label: 'Kobans received (total)', value: `+${params.totalKobansEarned.toLocaleString()} Kobans`, highlightGold: true },
      { label: 'Kobans spent (total)', value: `-${params.totalKobansSpent.toLocaleString()} Kobans`, highlightRed: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    extraBodyHtml: topScorersHtml,
    ctaLabel: 'Open Superadmin Portal',
    ctaUrl: `${appUrl}/admin`,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY 00:00 PKT DAILY ADMIN DIGEST (${params.pktDateLabel})`,
    `Tests Taken: ${params.testsTakenCount}`,
    `Kobans Received: +${params.totalKobansEarned.toLocaleString()} Kobans`,
    `Kobans Spent: -${params.totalKobansSpent.toLocaleString()} Kobans`,
    `Time (PKT): ${timeStr}`,
    ``,
    `Top Scorers:`,
    ...(params.topScorers.length > 0
      ? params.topScorers.map((s, i) => `#${i + 1} ${s.studentName} — ${s.testName}: ${s.scoreText} (${s.percentage}%)`)
      : ['No tests recorded in this window.']),
    ``,
    `Admin Portal: ${appUrl}/admin`,
    `Internal admin notification`,
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
      { label: 'Time (PKT)', value: timeStr },
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
    `Time (PKT): ${timeStr}`,
    ``,
    `Dashboard: ${appUrl}/dashboard`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildApplicationSubmittedAdminEmail(params: {
  applicationId: string;
  applicantUid?: string;
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
  const subject = `New application: ${params.programName} by ${params.applicantName}`;
  const preheader = `${params.applicantName} (${params.applicantEmail}) applied for ${params.programName}.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Candidate Application',
    badgeColor: 'red',
    heading: `New ${params.programName} application`,
    introHtml: `<p style="margin:0;">A student has submitted a new application requiring administrator review.</p>`,
    studentIdentity: {
      name: params.applicantName || 'Student',
      email: params.applicantEmail,
      uid: params.applicantUid || params.applicationId,
      transactionId: params.applicationId,
    },
    detailsRows: [
      { label: 'Program', value: params.programName },
      ...(params.applicantPhone ? [{ label: 'Phone / WhatsApp', value: params.applicantPhone, mono: true }] : []),
      ...(params.institution ? [{ label: 'Institution', value: params.institution }] : []),
      ...(params.city ? [{ label: 'City', value: params.city }] : []),
      ...(params.statement ? [{ label: 'Statement / Note', value: params.statement }] : []),
      { label: 'Application ID', value: formatShortTxId(params.applicationId), mono: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'Review Application in Admin Panel',
    ctaUrl: `${appUrl}${params.reviewPath || '/admin/applications'}`,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY ADMIN — ${subject}`,
    `Applicant: ${params.applicantName} (${params.applicantEmail})`,
    ...(params.applicantPhone ? [`Phone: ${params.applicantPhone}`] : []),
    ...(params.institution ? [`Institution: ${params.institution}`] : []),
    ...(params.city ? [`City: ${params.city}`] : []),
    ...(params.statement ? [`Statement: ${params.statement}`] : []),
    `Application ID: ${params.applicationId}`,
    `Time (PKT): ${timeStr}`,
    `Review: ${appUrl}${params.reviewPath || '/admin/applications'}`,
    `Internal admin notification`,
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
      ...(params.codeOrBadge ? [{ label: 'Official code / badge', value: params.codeOrBadge, mono: true, highlightGold: true }] : []),
      ...(!isApproved && params.reason ? [{ label: 'Reviewer note', value: params.reason }] : []),
      { label: 'Time (PKT)', value: timeStr },
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
    `Time (PKT): ${timeStr}`,
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
  balanceBefore?: number;
  newBalance?: number;
  referralCode?: string;
  transactionId?: string;
  timestamp?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.timestamp);
  const isCredited = params.stage === 'credited';
  const isReferrer = params.recipientRole === 'referrer';
  const rewardKobans = Math.max(0, Math.floor(Number(params.kobansCredited ?? (isReferrer ? 5000 : 1000))));
  const hasNewBal = typeof params.newBalance === 'number' && Number.isFinite(params.newBalance);
  const afterBal = hasNewBal ? Math.max(0, Math.floor(params.newBalance!)) : undefined;
  const beforeBal =
    typeof params.balanceBefore === 'number' && Number.isFinite(params.balanceBefore)
      ? Math.max(0, Math.floor(params.balanceBefore))
      : afterBal !== undefined
      ? Math.max(0, afterBal - rewardKobans)
      : undefined;

  const subject = isCredited
    ? `+${rewardKobans.toLocaleString()} Kobans credited! Referral reward with ${params.counterpartyName} — Boardly`
    : `Referral confirmed with ${params.counterpartyName} — Boardly`;

  const preheader = isCredited
    ? `+${rewardKobans.toLocaleString()} Kobans have been added to your Boardly wallet${
        afterBal !== undefined ? ` · New balance: ${afterBal.toLocaleString()} Kobans` : ''
      }.`
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
              afterBal !== undefined && beforeBal !== undefined
                ? `Balance before: ${beforeBal.toLocaleString()} Kobans  •  New Balance: ${afterBal.toLocaleString()} Kobans`
                : afterBal !== undefined
                ? `New Wallet Balance: ${afterBal.toLocaleString()} Kobans`
                : 'Credited to your Boardly Wallet',
          },
        }
      : {}),
    detailsRows: [
      { label: isReferrer ? 'Referred classmate' : 'Invited by', value: params.counterpartyName },
      { label: 'Event type', value: formatEmailEventLabel('REFERRAL_REWARD') },
      { label: 'Status', value: isCredited ? 'Kobans Credited' : 'Confirmed · Qualifying', highlightGold: isCredited },
      { label: 'Kobans received', value: `+${rewardKobans.toLocaleString()} Kobans`, highlightGold: true },
      ...(isCredited && beforeBal !== undefined
        ? [{ label: 'Balance before', value: `${beforeBal.toLocaleString()} Kobans`, mutedSmall: true }]
        : []),
      ...(isCredited && afterBal !== undefined
        ? [{ label: 'New balance', value: `${afterBal.toLocaleString()} Kobans`, highlightGold: true }]
        : []),
      ...(params.referralCode ? [{ label: 'Referral code', value: params.referralCode, mono: true }] : []),
      ...(params.transactionId
        ? [{ label: 'Transaction ID', value: formatShortTxId(params.transactionId), mono: true }]
        : []),
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
    `Event type: ${formatEmailEventLabel('REFERRAL_REWARD')}`,
    `Status: ${isCredited ? 'Kobans Credited' : 'Referral Confirmed'}`,
    `Kobans received: +${rewardKobans.toLocaleString()} Kobans`,
    ...(isCredited && beforeBal !== undefined ? [`Balance before: ${beforeBal.toLocaleString()} Kobans`] : []),
    ...(isCredited && afterBal !== undefined ? [`New balance: ${afterBal.toLocaleString()} Kobans`] : []),
    `Time (PKT): ${timeStr}`,
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
  const subject = `System diagnostic: Transactional Email Pipeline Verified (${timeStr})`;
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
      subtext: 'Balance before: 14,000 Kobans  •  New Balance: 15,000 Kobans',
    },
    detailsRows: [
      { label: 'Event type', value: formatEmailEventLabel('KOBAN_PURCHASE_APPROVED') },
      { label: 'Triggered by admin', value: params.adminEmail, mono: true },
      { label: 'EMAIL_FROM', value: params.emailFrom, mono: true },
      { label: 'ADMIN_EMAILS', value: params.adminRecipientsList.join(', '), mono: true },
      { label: 'Inbound routing', value: 'admin@boardly.cfd, superadmin@boardly.cfd', mono: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'Open Admin Email Logs',
    ctaUrl: `${appUrl}/admin/health`,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY TEST — Transactional Email Pipeline Verified`,
    `Triggered By: ${params.adminEmail}`,
    `EMAIL_FROM: ${params.emailFrom}`,
    `ADMIN_EMAILS: ${params.adminRecipientsList.join(', ')}`,
    `Time (PKT): ${timeStr}`,
    `Internal admin notification`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FIREBASE PASSWORD RESET & EMAIL VERIFICATION TEMPLATES
//    Uses the same hosted dot-matrix logo (https://boardly.cfd/email/boardly-logo.png)
// ─────────────────────────────────────────────────────────────────────────────

export function buildFirebasePasswordResetEmail(params: {
  studentName?: string;
  studentEmail: string;
  resetUrl?: string;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const resetLink = params.resetUrl || '%LINK%';
  const subject = 'Reset your Boardly password';
  const preheader = 'Follow this link to reset your Boardly student account password.';

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Account Security',
    badgeColor: 'red',
    heading: 'Reset your password',
    introHtml: `<p style="margin:0;">Hi <strong>${escapeHtml(
      params.studentName || params.studentEmail
    )}</strong>, we received a request to reset the password for your Boardly account (<code>${escapeHtml(
      params.studentEmail
    )}</code>). Click the button below to choose a new password.</p>`,
    detailsRows: [
      { label: 'Account email', value: params.studentEmail, mono: true },
      { label: 'Requested at', value: formatPktDateTime() },
    ],
    ctaLabel: 'Reset Password',
    ctaUrl: resetLink,
    footerNote: 'If you did not request a password reset, you can safely ignore this email.',
    appUrl,
  });

  const text = [
    `BOARDLY — Reset your password`,
    ``,
    `Hi ${params.studentName || params.studentEmail},`,
    `Follow this link to reset your Boardly password for ${params.studentEmail}:`,
    `${resetLink}`,
    ``,
    `If you didn't ask to reset your password, you can ignore this email.`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildFirebaseEmailVerificationEmail(params: {
  studentName?: string;
  studentEmail: string;
  verifyUrl?: string;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const verifyLink = params.verifyUrl || '%LINK%';
  const subject = 'Verify your email for Boardly';
  const preheader = 'Confirm your email address to verify your Boardly student account.';

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Email Verification',
    badgeColor: 'gold',
    heading: 'Verify your email address',
    introHtml: `<p style="margin:0;">Hi <strong>${escapeHtml(
      params.studentName || params.studentEmail
    )}</strong>, please confirm your email address (<code>${escapeHtml(
      params.studentEmail
    )}</code>) to complete your Boardly profile verification.</p>`,
    detailsRows: [
      { label: 'Account email', value: params.studentEmail, mono: true },
      { label: 'Requested at', value: formatPktDateTime() },
    ],
    ctaLabel: 'Verify Email Address',
    ctaUrl: verifyLink,
    footerNote: 'If you did not create a Boardly account, you can safely ignore this email.',
    appUrl,
  });

  const text = [
    `BOARDLY — Verify your email address`,
    ``,
    `Hi ${params.studentName || params.studentEmail},`,
    `Follow this link to verify your email address (${params.studentEmail}):`,
    `${verifyLink}`,
  ].join('\n');

  return { subject, preheader, html, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. BOARDLY PRO PASS EMAILS (Request Received, Activated, Rejected + Admin Copies)
// ─────────────────────────────────────────────────────────────────────────────

export function buildProRequestReceivedStudentEmail(params: {
  studentName: string;
  planName: string;
  durationDays: number;
  amountPkr?: number;
  pkrAmount?: number;
  paymentMethod: string;
  transactionId: string;
  submittedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.submittedAt);
  const pkr = Number(params.pkrAmount ?? params.amountPkr ?? 199);
  const methodDisplay = formatPaymentMethodLabel(params.paymentMethod);
  const subject = `Pro request received: ${params.planName} — Boardly`;
  const preheader = `We received your ${methodDisplay} payment reference (${params.transactionId}) for ${params.planName}.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Pro Request Received',
    badgeColor: 'gold',
    heading: 'We received your Boardly Pro request',
    introHtml: `<p style="margin:0;">Thank you, <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>! Your payment transfer reference for <strong>${escapeHtml(
      params.planName
    )}</strong> is in our verification queue. We will verify it within 2 hours and email you as soon as Pro is active.</p>`,
    detailsRows: [
      { label: 'Plan', value: `${params.planName} (${params.durationDays} days)` },
      { label: 'Amount', value: `PKR ${pkr.toLocaleString()}`, highlightGold: true },
      { label: 'Payment method', value: methodDisplay },
      { label: 'Transaction ID (TID)', value: params.transactionId, mono: true },
      { label: 'Status', value: 'Pending Verification' },
      { label: 'Time (PKT)', value: timeStr },
    ],
    extraBodyHtml: `<p style="margin:14px 0 0 0;font-size:12px;color:#9CA3AF;">${escapeHtml(
      REFUND_POLICY_TEXT
    )}</p>`,
    ctaLabel: 'View Plan Status',
    ctaUrl: `${appUrl}/dashboard/plans`,
    appUrl,
  });

  const text = [
    `BOARDLY — Pro request received (${params.planName})`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `We received your payment request for ${params.planName} (${params.durationDays} days).`,
    `Amount: PKR ${pkr.toLocaleString()}`,
    `Payment method: ${methodDisplay}`,
    `Transaction ID: ${params.transactionId}`,
    `Time (PKT): ${timeStr}`,
    ``,
    REFUND_POLICY_TEXT,
    `View status: ${appUrl}/dashboard/plans`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildProRequestReceivedAdminEmail(params: {
  requestId: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  planName: string;
  durationDays: number;
  amountPkr?: number;
  pkrAmount?: number;
  paymentMethod: string;
  transactionId: string;
  submittedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.submittedAt);
  const pkr = Number(params.pkrAmount ?? params.amountPkr ?? 199);
  const methodDisplay = formatPaymentMethodLabel(params.paymentMethod);
  const eventLabel = formatEmailEventLabel('PRO_REQUEST_RECEIVED');
  const subject = `${eventLabel}: ${params.planName} (PKR ${pkr.toLocaleString()}) by ${params.studentName || 'Student'}`;
  const preheader = `${params.studentName} (${params.studentEmail}) submitted TID ${params.transactionId} via ${methodDisplay}.`;
  const reviewUrl = `${appUrl}/admin/payments?type=pro&request_id=${encodeURIComponent(params.requestId)}`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: eventLabel,
    badgeColor: 'red',
    heading: `${eventLabel}: ${params.planName}`,
    introHtml: `<p style="margin:0;">A student submitted a PKR payment transfer for Boardly Pro verification.</p>`,
    studentIdentity: {
      name: params.studentName || 'Student',
      email: params.studentEmail,
      uid: params.studentUid,
      transactionId: params.transactionId || params.requestId,
    },
    detailsRows: [
      { label: 'Event type', value: eventLabel },
      { label: 'Plan', value: `${params.planName} (${params.durationDays} days)` },
      { label: 'Amount (PKR)', value: `PKR ${pkr.toLocaleString()}`, highlightGold: true },
      { label: 'Payment method', value: methodDisplay },
      { label: 'Transaction ID (TID)', value: params.transactionId, mono: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'Review in Admin Payments',
    ctaUrl: reviewUrl,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY ADMIN — ${subject}`,
    ``,
    `Student: ${params.studentName} (${params.studentEmail})`,
    `User ID: ${params.studentUid}`,
    `Plan: ${params.planName} (${params.durationDays} days)`,
    `Amount: PKR ${pkr.toLocaleString()}`,
    `Method: ${methodDisplay}`,
    `TID: ${params.transactionId}`,
    `Time (PKT): ${timeStr}`,
    ``,
    `Review: ${reviewUrl}`,
    `Internal admin notification`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildProActivatedStudentEmail(params: {
  studentName: string;
  planName: string;
  durationDays: number;
  expiryFormatted?: string;
  expiresAtLabel?: string;
  wasExtension?: boolean;
  previousExpiryLabel?: string | null;
  paymentMethod?: string;
  paidWith?: 'kobans' | 'pkr';
  amountPkr?: number;
  pkrAmount?: number;
  kobansSpent?: number;
  balanceBefore?: number;
  newBalance?: number;
  transactionId?: string;
  activatedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.activatedAt);
  const expiryLabel = params.expiresAtLabel || params.expiryFormatted || 'Active';
  const isKobanPayment =
    params.paidWith === 'kobans' ||
    (typeof params.kobansSpent === 'number' && params.kobansSpent > 0);
  const spent = isKobanPayment ? Math.abs(Math.floor(params.kobansSpent || 0)) : 0;
  const pkr = Number(params.pkrAmount ?? params.amountPkr ?? 199);
  const methodLabel = isKobanPayment
    ? 'Kobans Wallet'
    : formatPaymentMethodLabel(params.paymentMethod || 'jazzcash');
  const amountDisplay = isKobanPayment
    ? `${spent.toLocaleString()} Kobans (PKR ${Math.round(spent / 10).toLocaleString()})`
    : `PKR ${pkr.toLocaleString()}`;

  const subject = `Pro activated: ${params.planName} active until ${expiryLabel} — Boardly`;
  const preheader = `Your ${params.planName} is active until ${expiryLabel}. Start practicing with unlimited tests and AI derivations.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: params.wasExtension ? 'Pro Extended' : 'Pro Activated',
    badgeColor: 'green',
    heading: `Boardly Pro active until ${expiryLabel}!`,
    introHtml: `<p style="margin:0;">Congratulations, <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>! Your <strong>${escapeHtml(
      params.planName
    )}</strong> is now active${
      params.wasExtension && params.previousExpiryLabel
        ? ` (extended from ${escapeHtml(params.previousExpiryLabel)} to ${escapeHtml(expiryLabel)})`
        : ''
    }. Enjoy unlimited practice tests, Arena National Mocks, and Boardy AI derivations.</p>`,
    ...(isKobanPayment &&
    typeof params.balanceBefore === 'number' &&
    typeof params.newBalance === 'number'
      ? {
          kobanHighlight: {
            label: 'Pro Pass Purchase',
            amountText: `-${spent.toLocaleString()} Kobans`,
            subtext: `Balance before: ${params.balanceBefore.toLocaleString()} Kobans  •  New Balance: ${params.newBalance.toLocaleString()} Kobans`,
            isNegative: true,
          },
        }
      : {}),
    detailsRows: [
      { label: 'Plan', value: `${params.planName} (${params.durationDays} days)` },
      { label: 'Pro active until', value: expiryLabel, highlightGold: true },
      { label: 'Payment method', value: methodLabel },
      ...(isKobanPayment
        ? [
            {
              label: 'Kobans spent',
              value: `-${spent.toLocaleString()} Kobans`,
              highlightRed: true,
            },
            ...(typeof params.balanceBefore === 'number'
              ? [
                  {
                    label: 'Balance before',
                    value: `${params.balanceBefore.toLocaleString()} Kobans`,
                    mutedSmall: true,
                  },
                ]
              : []),
            ...(typeof params.newBalance === 'number'
              ? [
                  {
                    label: 'New balance',
                    value: `${params.newBalance.toLocaleString()} Kobans`,
                    highlightGold: true,
                  },
                ]
              : []),
          ]
        : [{ label: 'Amount paid', value: amountDisplay, highlightGold: true }]),
      ...(params.transactionId
        ? [{ label: 'Transaction ID', value: formatShortTxId(params.transactionId), mono: true }]
        : []),
      { label: 'Time (PKT)', value: timeStr },
    ],
    extraBodyHtml: `<p style="margin:14px 0 0 0;font-size:12px;color:#9CA3AF;">${escapeHtml(
      REFUND_POLICY_TEXT
    )}</p>`,
    ctaLabel: 'Start Practicing Now',
    ctaUrl: `${appUrl}/dashboard/practice`,
    secondaryCtaLabel: 'View Plans & Status',
    secondaryCtaUrl: `${appUrl}/dashboard/plans`,
    appUrl,
  });

  const text = [
    `BOARDLY PRO ACTIVATED — ${params.planName}`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `Your ${params.planName} (${params.durationDays} days) is now active until ${expiryLabel}!`,
    `Payment method: ${methodLabel}`,
    `Amount: ${amountDisplay}`,
    ...(isKobanPayment && typeof params.balanceBefore === 'number'
      ? [`Balance before: ${params.balanceBefore.toLocaleString()} Kobans`]
      : []),
    ...(isKobanPayment && typeof params.newBalance === 'number'
      ? [`New balance: ${params.newBalance.toLocaleString()} Kobans`]
      : []),
    `Time (PKT): ${timeStr}`,
    ``,
    REFUND_POLICY_TEXT,
    `Start practicing: ${appUrl}/dashboard/practice`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildProActivatedAdminEmail(params: {
  studentUid: string;
  studentName: string;
  studentEmail?: string;
  planName: string;
  durationDays: number;
  expiryFormatted?: string;
  expiresAtLabel?: string;
  paymentMethod?: string;
  paidWith?: 'kobans' | 'pkr';
  amountPkr?: number;
  pkrAmount?: number;
  kobansSpent?: number;
  balanceBefore?: number;
  newBalance?: number;
  transactionId?: string;
  adminEmail?: string;
  activatedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.activatedAt);
  const expiryLabel = params.expiresAtLabel || params.expiryFormatted || 'Active';
  const isKobanPayment =
    params.paidWith === 'kobans' ||
    (typeof params.kobansSpent === 'number' && params.kobansSpent > 0);
  const spent = isKobanPayment ? Math.abs(Math.floor(params.kobansSpent || 0)) : 0;
  const pkr = Number(params.pkrAmount ?? params.amountPkr ?? 199);
  const eventLabel = formatEmailEventLabel(
    isKobanPayment ? 'PRO_PASS_PURCHASE' : 'PRO_PASS_ACTIVATED'
  );
  const methodLabel = isKobanPayment
    ? 'Kobans Wallet'
    : formatPaymentMethodLabel(params.paymentMethod || 'jazzcash');
  const txId = params.transactionId || `pro_${Date.now()}`;

  const subject = isKobanPayment
    ? `${eventLabel}: ${params.planName} (-${spent.toLocaleString()} Kobans) by ${params.studentName || 'Student'}`
    : `${eventLabel}: ${params.planName} (PKR ${pkr.toLocaleString()}) by ${params.studentName || 'Student'}`;

  const preheader = `${params.studentName} activated ${params.planName} until ${expiryLabel}.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: eventLabel,
    badgeColor: 'green',
    heading: `${eventLabel} · ${params.studentName || 'Student'}`,
    introHtml: `<p style="margin:0;">Boardly Pro was activated via <strong>${escapeHtml(
      methodLabel
    )}</strong>${params.adminEmail ? ` (approved by ${escapeHtml(params.adminEmail)})` : ''}.</p>`,
    studentIdentity: {
      name: params.studentName || 'Student',
      email: params.studentEmail || 'Not linked',
      uid: params.studentUid,
      transactionId: txId,
    },
    detailsRows: [
      { label: 'Event type', value: eventLabel },
      { label: 'Plan', value: `${params.planName} (${params.durationDays} days)` },
      { label: 'Pro active until', value: expiryLabel, highlightGold: true },
      { label: 'Payment method', value: methodLabel },
      ...(isKobanPayment
        ? [
            ...(typeof params.balanceBefore === 'number'
              ? [
                  {
                    label: 'Balance before',
                    value: `${params.balanceBefore.toLocaleString()} Kobans`,
                    mutedSmall: true,
                  },
                ]
              : []),
            {
              label: 'Kobans spent',
              value: `-${spent.toLocaleString()} Kobans`,
              highlightRed: true,
            },
            ...(typeof params.newBalance === 'number'
              ? [
                  {
                    label: 'New balance',
                    value: `${params.newBalance.toLocaleString()} Kobans`,
                    highlightGold: true,
                  },
                ]
              : []),
          ]
        : [
            {
              label: 'Amount paid',
              value: `PKR ${pkr.toLocaleString()}`,
              highlightGold: true,
            },
          ]),
      { label: 'Transaction ID', value: formatShortTxId(txId), mono: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    ctaLabel: 'View this transaction',
    ctaUrl: `${appUrl}/admin/wallets/${encodeURIComponent(params.studentUid)}?tx=${encodeURIComponent(txId)}`,
    appUrl,
    isAdminEmail: true,
  });

  const text = [
    `BOARDLY ADMIN — ${subject}`,
    ``,
    `Student: ${params.studentName} (${params.studentEmail || 'Not linked'})`,
    `User ID: ${params.studentUid}`,
    `Plan: ${params.planName} (${params.durationDays} days)`,
    `Active until: ${expiryLabel}`,
    `Method: ${methodLabel}`,
    ...(isKobanPayment && typeof params.balanceBefore === 'number'
      ? [`Balance before: ${params.balanceBefore.toLocaleString()} Kobans`]
      : []),
    ...(isKobanPayment ? [`Kobans spent: -${spent.toLocaleString()} Kobans`] : []),
    ...(isKobanPayment && typeof params.newBalance === 'number'
      ? [`New balance: ${params.newBalance.toLocaleString()} Kobans`]
      : []),
    `Transaction ID: ${txId}`,
    `Time (PKT): ${timeStr}`,
    ``,
    `View this transaction: ${appUrl}/admin/wallets/${encodeURIComponent(params.studentUid)}?tx=${encodeURIComponent(txId)}`,
    `Internal admin notification`,
  ].join('\n');

  return { subject, preheader, html, text };
}

export function buildProRequestRejectedStudentEmail(params: {
  studentName: string;
  planName: string;
  amountPkr?: number;
  pkrAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  reason: string;
  rejectedAt?: Date | string | number;
  appUrl?: string;
}): RenderedEmailTemplate {
  const appUrl = (params.appUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const timeStr = formatPktDateTime(params.rejectedAt);
  const pkr = Number(params.pkrAmount ?? params.amountPkr ?? 199);
  const subject = `Pro request rejected: ${params.planName} — Boardly`;
  const preheader = `We could not verify your payment reference for ${params.planName}. See details inside.`;

  const html = renderBaseHtmlLayout({
    subject,
    preheader,
    badgeText: 'Pro Request Rejected',
    badgeColor: 'red',
    heading: `We could not verify your ${params.planName} request`,
    introHtml: `<p style="margin:0 0 10px 0;">Hi <strong>${escapeHtml(
      params.studentName || 'Student'
    )}</strong>, our team reviewed your payment request for <strong>${escapeHtml(
      params.planName
    )}</strong> but could not verify the transaction.</p>
    <p style="margin:0;">Please double-check your ${PAYMENT_METHODS_PAIR_LABEL} Transaction ID (TID) and submit a new request from the Plans page or Boardly Store.</p>`,
    detailsRows: [
      { label: 'Plan', value: params.planName },
      { label: 'Amount', value: `PKR ${pkr.toLocaleString()}` },
      ...(params.transactionId
        ? [{ label: 'Transaction ID (TID)', value: params.transactionId, mono: true }]
        : []),
      { label: 'Reason', value: params.reason || 'Transaction ID could not be verified.', highlightRed: true },
      { label: 'Time (PKT)', value: timeStr },
    ],
    extraBodyHtml: `<p style="margin:14px 0 0 0;font-size:12px;color:#9CA3AF;">${escapeHtml(
      REFUND_POLICY_TEXT
    )}</p>`,
    ctaLabel: 'Submit Corrected Request',
    ctaUrl: `${appUrl}/dashboard/plans`,
    appUrl,
  });

  const text = [
    `BOARDLY — Pro request rejected (${params.planName})`,
    ``,
    `Hi ${params.studentName || 'Student'},`,
    `We could not verify your payment request for ${params.planName} (PKR ${pkr.toLocaleString()}).`,
    `Reason: ${params.reason || 'Transaction ID could not be verified.'}`,
    `Time (PKT): ${timeStr}`,
    ``,
    REFUND_POLICY_TEXT,
    `Submit a corrected request: ${appUrl}/dashboard/plans`,
  ].join('\n');

  return { subject, preheader, html, text };
}



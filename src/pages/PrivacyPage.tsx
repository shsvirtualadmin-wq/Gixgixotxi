import React from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import {
  LEGAL_LAST_UPDATED_LABEL,
  LEGAL_VERSION_DISPLAY,
} from '@/constants/legalConsent';

const SECTIONS = [
  { id: 'summary', title: 'Quick Summary' },
  { id: 'who-we-are', title: '1. Who We Are & Legal Context' },
  { id: 'data-table', title: '2. Personal Data We Collect & Why' },
  { id: 'guest-accounts', title: '3. Temporary Guest Accounts & Retention' },
  { id: 'cookies-storage', title: '4. Cookies & Local Browser Storage' },
  { id: 'third-parties', title: '5. Third-Party Services & International Transfers' },
  { id: 'visibility-moderation', title: '6. Public Visibility, Anonymous Posts & Admin Access' },
  { id: 'security', title: '7. How We Protect Your Data' },
  { id: 'retention', title: '8. Data Retention & Cleanup Schedules' },
  { id: 'emails', title: '9. Transactional Emails Only (No Marketing)' },
  { id: 'your-rights', title: '10. Your Rights & Account Deletion' },
  { id: 'minors', title: '11. Children & Minors (Age 13+)' },
  { id: 'changes-contact', title: '12. Policy Updates & Contact Details' },
];

export const PrivacyPage: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <PageMeta
        title="Privacy Policy | Boardly"
        description="Learn what personal data Boardly collects, where it is stored (Firebase & Cloudflare), how guest accounts and 2FA work, and how to exercise your privacy rights."
        canonicalPath="/privacy"
      />
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 mb-4 flex-wrap justify-center">
          <span className="section-chip-red inline-block">PRIVACY · {LEGAL_VERSION_DISPLAY}</span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">
            Last updated: {LEGAL_LAST_UPDATED_LABEL}
          </span>
        </div>
        <h1 className="font-dot text-4xl sm:text-5xl text-[var(--text)] mb-4">
          Privacy Policy
        </h1>
        <p className="text-[var(--muted)] text-base sm:text-lg leading-relaxed">
          A transparent, factual breakdown of what data Boardly collects, where it is stored, who
          processes it, and how you stay in control.
        </p>
      </div>

      {/* Mobile Table of Contents */}
      <div className="lg:hidden glass-card p-5 mb-8">
        <h2 className="font-dot text-xs text-[var(--muted)] uppercase tracking-wider mb-3">
          Jump to a Section
        </h2>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="px-3 py-1.5 rounded-full text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--red)] transition-colors cursor-pointer"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 sm:gap-12 items-start">
        {/* Sticky Sidebar TOC (Desktop) */}
        <aside className="hidden lg:block glass-card p-6 sticky top-28">
          <h3 className="font-dot text-sm text-[var(--muted)] uppercase tracking-wider mb-4">
            Contents
          </h3>
          <ul className="space-y-2.5 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className="text-[var(--muted)] hover:text-[var(--text)] transition-colors text-left w-full truncate cursor-pointer"
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)] space-y-2">
            <p>Looking for our platform rules?</p>
            <Link
              to="/terms"
              className="text-[var(--red)] font-semibold hover:underline inline-block"
            >
              Read our Terms of Service →
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-3 glass-card p-6 sm:p-8 md:p-12 space-y-12 text-[var(--muted)] leading-relaxed text-sm sm:text-base">
          {/* Top Summary Box (5-7 bullets) */}
          <section
            id="summary"
            className="scroll-mt-28 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-5 sm:p-6 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-dot text-lg sm:text-xl text-[var(--text)]">
                Summary (Key Points in Plain English)
              </h2>
              <span className="text-xs font-mono text-[var(--red)] font-semibold">
                {LEGAL_VERSION_DISPLAY} · {LEGAL_LAST_UPDATED_LABEL}
              </span>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[var(--text)]/90">
              <li>
                <strong>Operated by SHS Virtual Academy:</strong> Boardly is a product of{' '}
                <strong>SHS Virtual Academy</strong>, based in Rawalpindi, Pakistan. For all
                privacy, support, data request, and legal inquiries, email us at{' '}
                <a
                  href="mailto:shsvirtualadmin@gmail.com"
                  className="text-[var(--red)] hover:underline font-mono"
                >
                  shsvirtualadmin@gmail.com
                </a>
                .
              </li>
              <li>
                <strong>We do not sell your personal data:</strong> Boardly never sells or rents
                student emails, phone numbers, test scores, or personal data to advertisers or third
                parties.
              </li>
              <li>
                <strong>Your email &amp; Google photo stay private:</strong> Your email address is
                used for sign-in, security codes, and transactional notifications and is never shown
                publicly. Your Google / Gmail profile photo is never used as your avatar or exposed
                to other users.
              </li>
              <li>
                <strong>Passwords &amp; security secrets are protected:</strong> Passwords are
                managed by Google Firebase Authentication (we never see or store plaintext
                passwords). Verification codes, backup codes, and IP/device rate-limit identifiers
                are stored as one-way HMAC-SHA256 hashes, and Authenticator App (TOTP) secrets are
                encrypted with AES-GCM (256-bit).
              </li>
              <li>
                <strong>Temporary Guest accounts auto-delete:</strong> Guest accounts store only
                your chosen guest username, test progress, and hashed session/rate-limit tokens.
                They are automatically deleted 7 days after confirmed logout or after 30 days of
                inactivity.
              </li>
              <li>
                <strong>Manual payment verification &amp; zero refunds:</strong> Payment details and
                payment proof are collected solely to verify your purchase manually and activate
                your plan within 24 hours. All Pro and Premium purchases are final and
                non-refundable once submitted or activated.
              </li>
              <li>
                <strong>Transactional emails only (zero marketing):</strong> We do not send
                marketing or promotional emails. We only send transactional emails (verification
                codes, security alerts, and purchase/plan updates).
              </li>
            </ul>
          </section>

          <section id="who-we-are" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              1. Who We Are &amp; Legal Context
            </h2>
            <p>
              <strong>Boardly</strong> is an educational exam preparation service operated by{' '}
              <strong>SHS Virtual Academy</strong> (parent organization), located in{' '}
              <strong>Rawalpindi, Pakistan</strong>. This Privacy Policy explains how SHS Virtual
              Academy collects, uses, stores, and protects your information when you use Boardly in
              accordance with applicable Pakistani law (including electronic data and consumer
              protection principles in Pakistan) and general data protection standards.
            </p>
          </section>

          <section id="data-table" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              2. Personal Data We Collect, Purpose &amp; Where It Is Stored
            </h2>
            <p>
              We only collect data that is necessary to run Boardly&apos;s features. Below is the
              exact list of data categories collected by the app today:
            </p>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)] text-[var(--text)] border-b border-[var(--border)]">
                    <th className="p-3 font-semibold">Category &amp; Data Collected</th>
                    <th className="p-3 font-semibold">Why We Collect It</th>
                    <th className="p-3 font-semibold">Where It Is Stored</th>
                    <th className="p-3 font-semibold">Who Receives It / Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="p-3 align-top">
                      <strong className="text-[var(--text)]">Account &amp; Identity</strong>
                      <br />
                      Email address, display name, `@username`, equipped store avatar or
                      deterministic UID-seeded matrix avatar, role, target university, password
                      (handled by Firebase Auth; never readable by Boardly), Google OAuth account ID
                      (if using Google Sign-In; your Google/Gmail profile photo is never saved or
                      displayed).
                    </td>
                    <td className="p-3 align-top">
                      Create and authenticate your account, allow username sign-in, and display your
                      public student profile.
                    </td>
                    <td className="p-3 align-top">
                      Firebase Authentication, Cloud Firestore (`users`, `publicProfiles`,
                      `usernames`), Cloudflare D1 (`user_usernames`, `user_roles`).
                    </td>
                    <td className="p-3 align-top">
                      Google Firebase &amp; Cloudflare. Kept while your account is active until
                      deletion.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">
                      <strong className="text-[var(--text)]">Security, Verification &amp; 2FA</strong>
                      <br />
                      Email OTP code hashes, 2FA settings, AES-GCM encrypted TOTP secret, hashed
                      backup codes, trusted device token hashes, user agent, and HMAC-SHA256 hashed
                      IP/email/device identifiers.
                    </td>
                    <td className="p-3 align-top">
                      Verify email ownership, enforce optional Two-Step Verification, remember
                      trusted devices for 30 days, prevent brute-force attacks, and log security
                      events.
                    </td>
                    <td className="p-3 align-top">
                      Cloudflare D1 (`email_verification_codes`, `email_verification_sessions`,
                      `email_verification_send_logs`, `user_2fa`, `user_2fa_backup_codes`,
                      `trusted_devices`, `pending_2fa_challenges`, `login_rate_limits`,
                      `security_audit_logs`).
                    </td>
                    <td className="p-3 align-top">
                      Cloudflare &amp; Resend (for sending email codes). OTP codes expire in 10
                      minutes; trusted devices expire in 30 days.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">
                      <strong className="text-[var(--text)]">Guest Account Data</strong>
                      <br />
                      Guest UID (`guest_*`), username, display name, practice stats/attempts JSON,
                      session token hash, user agent, IP hash, and device ID hash.
                    </td>
                    <td className="p-3 align-top">
                      Provide temporary passwordless access to practice tests and prevent automated
                      guest account spam.
                    </td>
                    <td className="p-3 align-top">
                      Cloudflare D1 (`guest_accounts`, `guest_sessions`,
                      `guest_creation_rate_limits`).
                    </td>
                    <td className="p-3 align-top">
                      Cloudflare. Purged 7 days after confirmed logout or after 30 days of
                      inactivity (unless upgraded to a registered account).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">
                      <strong className="text-[var(--text)]">Study Activity &amp; Certificates</strong>
                      <br />
                      Practice test attempts, selected answers, scores, solve times, daily streaks,
                      Zenryu companion state, and Grand Line 1st Position certificates (student
                      name, score, rank, `cert_id`).
                    </td>
                    <td className="p-3 align-top">
                      Calculate scores, track streaks, rank Grand Line leaderboards, and issue
                      verifiable achievement certificates.
                    </td>
                    <td className="p-3 align-top">
                      Cloud Firestore (`attempts`, `users`), Cloudflare D1 (`certificates`,
                      `test_attempts`), Cloudflare R2 (`boardly-commons-r2` for certificate PDFs/PNGs).
                    </td>
                    <td className="p-3 align-top">
                      Google Firebase &amp; Cloudflare. Leaderboard scores and certificate
                      verification pages (`/verify/:certId`) are publicly viewable.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">
                      <strong className="text-[var(--text)]">Commons, Crews &amp; Chat</strong>
                      <br />
                      Commons posts, comments, likes, saves, uploaded PDFs/images, reports, Study
                      Crew memberships/applications, follows, direct chat requests, and chat
                      messages.
                    </td>
                    <td className="p-3 align-top">
                      Enable peer-to-peer note sharing, campus Study Crews, Nakama Captain programs,
                      and student messaging.
                    </td>
                    <td className="p-3 align-top">
                      Cloudflare D1 (`commons_posts`, `commons_post_comments`, `commons_post_likes`,
                      `commons_post_saves`, `commons_post_reports`, `notifications`), Cloudflare R2
                      (uploaded files), Cloud Firestore (`crews`, `crew_requests`, `applications`,
                      `follows`, `chatRequests`, `conversations` &amp; `messages`).
                    </td>
                    <td className="p-3 align-top">
                      Cloudflare &amp; Google Firebase. Kept until deleted by you or removed by
                      moderation.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">
                      <strong className="text-[var(--text)]">Rewards, Kobans &amp; Pro Payments</strong>
                      <br />
                      Koban wallet balance and ledger, daily/milestone reward claims, referral codes
                      and IP hashes, Pro plan status/expiry, and manual payment verification records
                      (payment method such as JazzCash/Opay, PKR amount, Transaction ID / TID, and
                      payment proof if submitted).
                    </td>
                    <td className="p-3 align-top">
                      Maintain your Koban balance, prevent referral farming, and manually verify
                      your purchase to activate your plan within 24 hours. Payment proof and payment
                      details are collected <strong>only</strong> to verify the purchase. All Pro
                      and Premium purchases are final and non-refundable once submitted or
                      activated.
                    </td>
                    <td className="p-3 align-top">
                      Cloud Firestore (`wallets`, `wallets/{'{uid}'}/ledger`, `payments`,
                      `pro_requests`, `kobanRequests`), Cloudflare D1 (`reward_daily_claims`,
                      `reward_milestone_claims`, `referral_codes`, `referrals`).
                    </td>
                    <td className="p-3 align-top">
                      Google Firebase, Cloudflare, and Resend (for transactional purchase and plan
                      update emails).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 align-top">
                      <strong className="text-[var(--text)]">AI Derivations &amp; Study Buddy</strong>
                      <br />
                      MCQ prompt context (question stem, options, chosen answer) or study questions
                      submitted to Boardy AI / Study Buddy, plus usage logs (`study_buddy_logs`).
                    </td>
                    <td className="p-3 align-top">
                      Generate step-by-step math/science derivations and track daily AI usage caps.
                    </td>
                    <td className="p-3 align-top">
                      Processed via server-side API calls to Google Gemini; usage and prompt logs
                      stored in server/Firestore records.
                    </td>
                    <td className="p-3 align-top">
                      Google Gemini API (`@google/genai` / `generativelanguage.googleapis.com`).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="guest-accounts" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              3. Temporary Guest Accounts &amp; Automatic Deletion
            </h2>
            <p>
              When you choose &ldquo;Continue as guest&rdquo;, we create a temporary profile in
              Cloudflare D1 (`guest_accounts`) with your chosen username and a random guest ID. To
              protect the platform from automated bot abuse without collecting an email address, we
              store a one-way HMAC-SHA256 hash of your IP address and device identifier
              (`guest_creation_rate_limits`, limited to 5 guest creations per hour / 15 per day per
              IP, and 3 per hour / 8 per day per device).
            </p>
            <p>
              <strong>Automatic Cleanup:</strong> If you confirm logout from a guest account, it
              enters a <strong>7-day grace period</strong> (`status = &apos;abandoned&apos;`) and is
              then permanently deleted along with its sessions and username reservation. Any guest
              account that is inactive for <strong>30 days</strong> is also permanently deleted by
              our daily scheduled cleanup job (`0 3 * * *` UTC).
            </p>
          </section>

          <section id="cookies-storage" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              4. Cookies &amp; Local Browser Storage
            </h2>
            <p>
              Boardly uses strictly necessary cookies and local browser storage (`localStorage` and
              `sessionStorage`) to keep you signed in and remember your preferences. We do{' '}
              <strong>not</strong> use third-party advertising or cross-site tracking cookies.
            </p>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Firebase Auth Session Storage:</strong> Stores your authenticated Firebase
                session tokens in browser storage (`indexedDB` / `localStorage`) so you stay logged
                in across page reloads.
              </li>
              <li>
                <strong>`boardly_guest_session` (Cookie) &amp; `boardly_guest_session_token`
                (`localStorage`):</strong> `HttpOnly; SameSite=Lax` cookie (max age 30 days) and
                local backup token used to authenticate temporary guest sessions.
              </li>
              <li>
                <strong>`boardly_trusted_device` (Cookie):</strong> `HttpOnly; Secure; SameSite=Lax`
                cookie (max age 30 days) set only when you explicitly check &ldquo;Remember this
                device for 30 days&rdquo; during Two-Step Verification.
              </li>
              <li>
                <strong>`boardly_device_id` (`localStorage`):</strong> Random identifier used in
                hashed form to enforce guest creation rate limits.
              </li>
              <li>
                <strong>`boardly-theme` (`localStorage`):</strong> Remembers your dark or light mode
                display preference.
              </li>
              <li>
                <strong>`boardly_legal_consent_v2_*` (`localStorage`):</strong> Remembers that you
                have accepted or dismissed the latest Terms and Privacy Policy notice on your
                device, alongside our server-side consent table (`legal_consent_records`).
              </li>
            </ul>
          </section>

          <section id="third-parties" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              5. Third-Party Service Providers &amp; International Transfers
            </h2>
            <p>
              We share data only with the infrastructure and service providers needed to operate
              Boardly:
            </p>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Google Firebase (Google LLC):</strong> Provides Authentication (Email/Password
                and Google OAuth), Cloud Firestore database, and Cloud Storage.
              </li>
              <li>
                <strong>Cloudflare, Inc.:</strong> Provides edge hosting (Cloudflare Pages &amp;
                Workers), D1 serverless SQL database (`boardly-posts-db`), and R2 object storage
                (`boardly-commons-r2`) for Commons attachments and certificates.
              </li>
              <li>
                <strong>Resend (`api.resend.com`):</strong> Sends strictly transactional emails
                (verification codes, 2FA security alerts, and purchase/plan updates).
              </li>
              <li>
                <strong>Google Gemini API (Google LLC):</strong> Processes MCQ derivations,
                explanations, and Study Buddy prompts when you invoke an AI feature.
              </li>
              <li>
                <strong>Manual Payment Channels (JazzCash &amp; Opay):</strong> When you purchase a
                Boardly Pro or Premium pass or Kobans in PKR, you transfer funds through your own
                JazzCash or Opay account and submit the payment details and proof (Transaction ID /
                TID) to Boardly. We collect payment proof and payment details <strong>only</strong>{' '}
                to manually verify your purchase and activate your plan within 24 hours. Boardly
                does not collect or store your bank card numbers or mobile wallet PINs. All Pro and
                Premium purchases are final and non-refundable once submitted or activated (zero
                refunds).
              </li>
            </ul>
            <p>
              <strong>Where Data Is Processed (International Transfers):</strong> Because Google
              Firebase, Cloudflare, and Resend operate distributed cloud infrastructure, your data
              is processed and stored on secure cloud servers that may be located outside Pakistan
              (including in the United States, Europe, and Asia-Pacific).
            </p>
          </section>

          <section id="visibility-moderation" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              6. Public Visibility, Anonymous Posts &amp; Administrator Access
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>What Other Students Can See:</strong> Your display name, `@username`,
                equipped store avatar (or deterministic matrix avatar generated from your user ID),
                equipped profile cosmetics, role badge, target university, public Commons
                posts/comments, Study Crew membership, and leaderboard/Grand Line mock rankings are
                visible to other users. Your email address, Google/Gmail profile photo, password,
                2FA settings, and private payment TIDs are <strong>never</strong> shown publicly.
              </li>
              <li>
                <strong>How Anonymous Commons Posts Work:</strong> If you publish a post or comment
                with &ldquo;Anonymous&rdquo; enabled, other students only see &ldquo;Anonymous
                Student&rdquo; and cannot see your username or profile. However, our database stores
                your account UID (`author_uid` / `real_author_uid`) internally so you can manage
                your comment and so administrators can act against spam, harassment, or policy
                violations.
              </li>
              <li>
                <strong>What Administrators Can See:</strong> Authorized Boardly administrators at
                SHS Virtual Academy can view user profiles, Commons posts/comments, community
                reports, Captain/Crew applications, manual payment verification requests, security
                audit logs (such as 2FA resets), and AI Study Buddy logs (`study_buddy_logs`) for
                moderation, support, and payment verification. Direct messages between students are
                stored in Cloud Firestore and are not end-to-end encrypted.
              </li>
            </ul>
          </section>

          <section id="security" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              7. How We Protect Your Data
            </h2>
            <p>
              We implement technical safeguards across our frontend and backend services, including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>HTTPS/TLS encryption for all data in transit.</li>
              <li>
                HMAC-SHA256 hashing with a server-side secret for email verification codes, 2FA
                backup codes, session tokens, and IP/device rate-limit identifiers, verified using
                constant-time comparison.
              </li>
              <li>
                AES-GCM (256-bit) authenticated encryption for Authenticator App (TOTP) secrets at
                rest in Cloudflare D1.
              </li>
              <li>
                Strict file upload filtering (blocking executable/script extensions and enforcing a
                25 MB limit) and rate limiting on login, OTP, and guest creation endpoints.
              </li>
            </ul>
            <p>
              No internet service can guarantee 100% security. We encourage you to use a strong,
              unique password and enable Two-Step Verification in Settings.
            </p>
          </section>

          <section id="retention" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              8. Data Retention &amp; Cleanup Schedules
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Registered Accounts:</strong> Kept for as long as your account remains
                active, or until you request account deletion.
              </li>
              <li>
                <strong>Temporary Guest Accounts:</strong> Deleted <strong>7 days</strong> after
                confirmed logout (`ABANDONED_GUEST_GRACE_PERIOD_MS`) or after{' '}
                <strong>30 days of inactivity</strong> (`INACTIVE_GUEST_TTL_MS`) via our daily cron
                job.
              </li>
              <li>
                <strong>Verification &amp; 2FA Tokens:</strong> Email verification codes expire
                after <strong>10 minutes</strong>; pending 2FA login challenges expire after{' '}
                <strong>10 minutes</strong>; trusted device tokens expire after{' '}
                <strong>30 days</strong>.
              </li>
              <li>
                <strong>Payment &amp; Security Audit Records:</strong> Payment verification records
                and security audit logs are retained as needed to verify purchases, prevent
                duplicate or fraudulent transactions, and maintain account security.
              </li>
            </ul>
          </section>

          <section id="emails" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              9. Transactional Emails Only (No Marketing Emails)
            </h2>
            <p>
              <strong>Zero Marketing Emails:</strong> Boardly does <strong>not</strong> send
              marketing, promotional, or advertising emails, and we never share your email address
              with third-party marketers.
            </p>
            <p>
              <strong>Transactional Emails Only:</strong> We only send transactional emails
              triggered by your account activity — specifically verification codes (sign-up and 2FA
              codes), security alerts (such as password resets and 2FA changes), and purchase or
              plan updates (such as Pro payment verification, plan activation, and Koban receipts).
              In <em>Settings &gt; Email Notifications</em>, you can also toggle non-essential
              activity notifications on or off at any time.
            </p>
          </section>

          <section id="your-rights" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              10. Your Rights &amp; How to Request Account Deletion
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Access &amp; Update:</strong> View and update your username, custom role,
                avatar, password, 2FA settings, trusted devices, and email notification preferences
                directly in{' '}
                <Link to="/dashboard/settings" className="text-[var(--red)] hover:underline">
                  Settings
                </Link>
                , or submit a display name change request.
              </li>
              <li>
                <strong>Delete Posts &amp; Comments:</strong> Delete your own comments or posts in
                Boardly Commons at any time.
              </li>
              <li>
                <strong>Request Full Account Deletion or Data Copy:</strong> You may request
                permanent deletion of your Boardly account (or a copy of your stored account data)
                by emailing{' '}
                <a
                  href="mailto:shsvirtualadmin@gmail.com"
                  className="text-[var(--red)] hover:underline font-mono"
                >
                  shsvirtualadmin@gmail.com
                </a>{' '}
                from your registered email address with the subject line{' '}
                <code className="font-mono text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
                  Account Deletion Request
                </code>
                . Our administrators will verify your identity and process your request.
              </li>
            </ul>
          </section>

          <section id="minors" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              11. Children &amp; Minors (Minimum Age 13)
            </h2>
            <p>
              You must be at least <strong>13 years old</strong> to create an account or use
              Boardly. Users under <strong>18 years of age</strong> should use Boardly with the
              knowledge of a parent or legal guardian. We do not knowingly collect personal data
              from children under 13. If you are a parent or guardian and believe your child has
              provided personal information on Boardly, you can email us at{' '}
              <a
                href="mailto:shsvirtualadmin@gmail.com"
                className="text-[var(--red)] hover:underline font-mono"
              >
                shsvirtualadmin@gmail.com
              </a>{' '}
              to request deletion of the account and associated data.
            </p>
          </section>

          <section id="changes-contact" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              12. Policy Updates &amp; Contact Details
            </h2>
            <p>
              When we update this Privacy Policy, we will revise the version number and &ldquo;Last
              updated&rdquo; date at the top of this page and show a one-time notice to logged-in
              users.
            </p>
            <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4 text-xs sm:text-sm space-y-1.5">
              <p className="text-[var(--text)] font-semibold">
                Privacy, Support, Data Request &amp; Legal Contact:
              </p>
              <p>
                <strong>Service Name:</strong> Boardly
              </p>
              <p>
                <strong>Operator / Parent Organization:</strong> SHS Virtual Academy
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:shsvirtualadmin@gmail.com"
                  className="text-[var(--red)] hover:underline font-mono"
                >
                  shsvirtualadmin@gmail.com
                </a>
              </p>
              <p>
                <strong>Address:</strong> Rawalpindi, Pakistan
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
export default PrivacyPage;

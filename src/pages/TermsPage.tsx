import React from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import {
  LEGAL_LAST_UPDATED_LABEL,
  LEGAL_VERSION_DISPLAY,
} from '@/constants/legalConsent';

const SECTIONS = [
  { id: 'summary', title: 'Quick Summary' },
  { id: 'acceptance', title: '1. Acceptance & Operator Details' },
  { id: 'accounts', title: '2. Accounts, Guest Mode & Sign-In' },
  { id: 'security-2fa', title: '3. Email Verification & Two-Step Security' },
  { id: 'usernames', title: '4. Usernames, Display Names & Impersonation' },
  { id: 'features', title: '5. Practice Tests, Streaks, Certificates & AI' },
  { id: 'commons-community', title: '6. Boardly Commons, Crews & Direct Chat' },
  { id: 'moderation-admin', title: '7. Moderation & Administrator Access' },
  { id: 'rewards-kobans', title: '8. Rewards, Referrals & Kobans' },
  { id: 'pro-payments', title: '9. Boardly Pro, Manual Payments & Zero Refunds' },
  { id: 'acceptable-use', title: '10. Acceptable Use & Anti-Abuse Rules' },
  { id: 'intellectual-property', title: '11. Intellectual Property & User Content' },
  { id: 'university-disclaimer', title: '12. University & Exam Non-Affiliation' },
  { id: 'mobile-android', title: '13. Web, PWA & Mobile / Android Access' },
  { id: 'termination', title: '14. Suspension, Termination & Disclaimers' },
  { id: 'governing-law', title: '15. Governing Law & Contact' },
];

export const TermsPage: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <PageMeta
        title="Terms of Service | Boardly"
        description="Read the Terms of Service for Boardly covering registered and guest accounts, two-step verification, Commons, Study Crews, Kobans, Boardly Pro, and exam prep tools."
        canonicalPath="/terms"
      />
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 mb-4 flex-wrap justify-center">
          <span className="section-chip-red inline-block">LEGAL · {LEGAL_VERSION_DISPLAY}</span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)]">
            Last updated: {LEGAL_LAST_UPDATED_LABEL}
          </span>
        </div>
        <h1 className="font-dot text-4xl sm:text-5xl text-[var(--text)] mb-4">
          Terms of Service
        </h1>
        <p className="text-[var(--muted)] text-base sm:text-lg leading-relaxed">
          Plain-language rules for using Boardly&apos;s practice tests, Grand Line national mocks,
          Boardly Commons, Study Crews, Kobans rewards, and Boardly Pro.
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
            <p>Looking for how we handle your data?</p>
            <Link
              to="/privacy"
              className="text-[var(--red)] font-semibold hover:underline inline-block"
            >
              Read our Privacy Policy →
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
                <strong>SHS Virtual Academy</strong> (Rawalpindi, Pakistan). You must be at least
                13 years old to use Boardly, and users under 18 should use Boardly with the
                knowledge of a parent or guardian.
              </li>
              <li>
                <strong>Two ways to use Boardly:</strong> You can create a registered account (email
                &amp; password or Google) or try Boardly with a temporary Guest account. Guest
                accounts have no password, cannot be recovered after logging out or clearing browser
                data, cannot use Rewards or Boardly Pro, and are automatically deleted after a
                7-day post-logout grace period or 30 days of inactivity.
              </li>
              <li>
                <strong>Account security &amp; 2FA:</strong> Email sign-ups require a 6-digit email
                verification code. You can enable optional Two-Step Verification (Authenticator App
                or Email codes) and 30-day trusted devices in Settings. Losing 2FA access triggers a
                24-hour cooling-off recovery period.
              </li>
              <li>
                <strong>Usernames &amp; fair play:</strong> Usernames are 3–20 characters,
                case-insensitively unique, and subject to a 14-day cooldown between changes. We block
                impersonation, lookalike handles, and multi-account reward farming.
              </li>
              <li>
                <strong>Community &amp; anonymous posts:</strong> When you post or comment
                anonymously in Boardly Commons, your name is hidden from other students, but our
                system retains your internal user ID for safety, abuse prevention, and moderation.
              </li>
              <li>
                <strong>Manual payment verification (within 24 hours) &amp; zero refunds:</strong>{' '}
                Payments are verified manually. After you submit your payment and proof, we verify
                it and activate your plan within 24 hours. All Pro and Premium purchases are final
                and non-refundable once submitted or activated (zero refunds).
              </li>
              <li>
                <strong>Independent platform:</strong> Boardly is an independent educational
                platform and is not affiliated with or endorsed by NUST, FAST-NUCES, IBA, LUMS, UET,
                GIKI, PMDC/MDCAT, or any university or examination board.
              </li>
            </ul>
          </section>

          <section id="acceptance" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              1. Acceptance &amp; Operator Details
            </h2>
            <p>
              Welcome to <strong>Boardly</strong> (&ldquo;Boardly&rdquo;, &ldquo;we&rdquo;,
              &ldquo;our&rdquo;, or &ldquo;us&rdquo;). Boardly is a product of and is operated by{' '}
              <strong>SHS Virtual Academy</strong> (parent organization), located in{' '}
              <strong>Rawalpindi, Pakistan</strong>. By creating an account, continuing as a guest,
              or using our website (`boardly.cfd`), Progressive Web App (PWA), or related services,
              you agree to these Terms of Service and our{' '}
              <Link to="/privacy" className="text-[var(--red)] hover:underline font-medium">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              <strong>Minimum Age &amp; Minors:</strong> You must be at least{' '}
              <strong>13 years old</strong> to use Boardly. Users under{' '}
              <strong>18 years of age</strong> should use Boardly with the knowledge of a parent or
              legal guardian. We do not knowingly collect data from children under 13, and a parent
              or guardian can email us at{' '}
              <a
                href="mailto:shsvirtualadmin@gmail.com"
                className="text-[var(--red)] hover:underline font-mono"
              >
                shsvirtualadmin@gmail.com
              </a>{' '}
              to request deletion of an account.
            </p>
          </section>

          <section id="accounts" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              2. Accounts, Guest Mode &amp; Sign-In
            </h2>
            <p>Boardly offers two types of student accounts:</p>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Registered Accounts:</strong> Created using an email address and password
                (minimum 6 characters) or via Google Sign-In. Registered
                users can sign in using either their email address or their unique `@username`. You
                are responsible for keeping your password confidential.
              </li>
              <li>
                <strong>Temporary Guest Accounts:</strong> You may try Boardly without an email or
                password by choosing a guest username. Guest accounts are bound to your current
                browser via an `HttpOnly` session cookie (`boardly_guest_session`, valid for up to
                30 days) and local browser backup tokens.
              </li>
            </ul>
            <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4 text-xs sm:text-sm space-y-2">
              <p className="text-[var(--text)] font-semibold">
                Important Rules for Temporary Guest Accounts:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Guest accounts have <strong>no password or linked email</strong>. If you log out,
                  clear your browser cookies/storage, or switch devices without upgrading to a
                  registered account first, <strong>you cannot recover the guest account</strong>.
                </li>
                <li>
                  Guest accounts <strong>cannot</strong> access Boardly Rewards, claim or spend
                  Kobans, use referral codes, or purchase Boardly Pro.
                </li>
                <li>
                  When you confirm logout from a guest account, the account is marked as abandoned
                  and permanently deleted after a <strong>7-day grace period</strong>. Guest
                  accounts that remain inactive for <strong>30 consecutive days</strong> are also
                  automatically purged by our scheduled cleanup job, releasing the username.
                </li>
                <li>
                  You can upgrade a guest account in place at any time by linking an email &amp;
                  password or Google account, which preserves your username, test attempts, and
                  progress.
                </li>
              </ul>
            </div>
          </section>

          <section id="security-2fa" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              3. Email Verification &amp; Two-Step Security
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Email Verification at Sign-Up:</strong> New email and password sign-ups
                require verifying your email address with a 6-digit verification code (or
                verification link) sent via our email delivery provider (Resend). Codes expire after
                10 minutes and allow up to 5 attempts per code.
              </li>
              <li>
                <strong>Optional Two-Step Verification (2FA):</strong> Registered students can turn
                on Two-Step Verification in <em>Settings &gt; Security</em> using an Authenticator
                App (TOTP 6-digit codes) and/or Email 2FA codes.
              </li>
              <li>
                <strong>Backup Codes:</strong> When enabling 2FA, Boardly generates 10 one-time
                backup codes (`XXXX-XXXX`). Each backup code can be used only once. You are
                responsible for storing your backup codes safely.
              </li>
              <li>
                <strong>Remember This Device (30 Days):</strong> During 2FA verification, you can
                choose &ldquo;Remember this device for 30 days&rdquo;, which sets a secure cookie
                (`boardly_trusted_device`) so you are not prompted for a 2FA code on every login
                from that browser for 30 days unless you revoke trusted devices in Settings.
              </li>
              <li>
                <strong>Lost 2FA Access &amp; Recovery:</strong> If you lose access to your
                authenticator app and backup codes, you can verify ownership of your account email
                to initiate a 2FA recovery request. For your protection, disabling 2FA via recovery
                is subject to a mandatory <strong>24-hour cooling-off waiting period</strong> (or
                manual verification and reset by a Boardly Super Administrator).
              </li>
            </ul>
          </section>

          <section id="usernames" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              4. Usernames, Display Names &amp; Impersonation
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Format &amp; Uniqueness:</strong> Usernames must be 3 to 20 characters long
                and may contain only letters (`a–z`), numbers (`0–9`), dots (`.`), and underscores
                (`_`), without leading, trailing, or consecutive dots/underscores. Usernames are
                globally unique (case-insensitive) across all registered and active guest accounts.
              </li>
              <li>
                <strong>Anti-Impersonation &amp; Reserved Handles:</strong> Our system normalizes
                lookalike characters (such as `0`/`o` or `1`/`i`/`l`) to prevent impersonation and
                blocks reserved handles (including `boardly`, `shs`, `admin`, `superadmin`,
                `moderator`, `captain`, `founder`, `official`, and `support`).
              </li>
              <li>
                <strong>Username &amp; Display Name Changes:</strong> Username changes are subject
                to a <strong>14-day cooldown</strong> between changes. Display name change requests
                are reviewed by administrators (up to 2 requests per month).
              </li>
              <li>
                <strong>Right to Reclaim or Rename:</strong> Boardly reserves the right to reclaim,
                reset, or change any username or display name that is offensive, misleading,
                infringes trademarks, or impersonates another student, teacher, Captain, or staff
                member.
              </li>
            </ul>
          </section>

          <section id="features" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              5. Practice Tests, Streaks, Certificates &amp; AI Study Tools
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Practice Tests &amp; University MCQ Banks:</strong> Boardly provides timed
                practice tests, subject drills, and Grand Line competitive mocks. Free accounts have
                daily practice limits (such as 2 practice tests, 3 Arena mocks, and 5 Boardy AI
                derivations per day), while Boardly Pro unlocks unlimited daily access.
              </li>
              <li>
                <strong>Daily Streaks &amp; Zenryu Dragon Egg Companion:</strong> Daily study
                streaks reset at midnight Pakistan Standard Time (`Asia/Karachi`, UTC+5) and track
                your consistent practice and in-app Zenryu companion progression.
              </li>
              <li>
                <strong>Grand Line 1st Position Certificates:</strong> Students who achieve 1st
                Position on qualifying Grand Line national mocks may receive an automatically
                generated digital achievement certificate with a unique verification ID (`cert_id`)
                and public verification page (`/verify/:certId`). Certificates are recognition of
                in-app mock performance only and are not formal academic credentials.
              </li>
              <li>
                <strong>Boardy AI Derivations &amp; Study Buddy:</strong> Boardly uses Google Gemini
                AI models to generate step-by-step MCQ derivations, formula explanations, and study
                assistance. AI outputs may occasionally contain errors or inaccuracies; always
                cross-check critical formulas and textbook concepts.
              </li>
            </ul>
          </section>

          <section id="commons-community" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              6. Boardly Commons, Study Crews &amp; Direct Chat
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Boardly Commons (Posts, Notes &amp; PDFs):</strong> Students can share study
                notes, MCQs, discussions, and file attachments (images and PDFs up to 25 MB; scripts
                and executable files are blocked). You must only upload study materials that you own
                or have the right to share.
              </li>
              <li>
                <strong>Anonymous Posting &amp; Commenting:</strong> When you toggle
                &ldquo;Anonymous&rdquo; on a Commons post or comment, your display name, username,
                and avatar are hidden from public view (shown as &ldquo;Anonymous Student&rdquo;).
                However, <strong>your internal account ID (`author_uid` / `real_author_uid`) is
                still recorded on our server</strong> to prevent spam, enforce community rules, and
                allow you to delete your own comment.
              </li>
              <li>
                <strong>Nakama Captains &amp; Study Crews:</strong> Students can apply to become
                Nakama Captains or join campus Study Crews (up to 30 members per standard squad).
                Captains and administrators can manage crew membership, review join requests, and
                publish crew practice tests.
              </li>
              <li>
                <strong>Direct Messages &amp; Chat Requests:</strong> Direct messaging requires
                either a mutual follow or an accepted chat request (up to 280 characters for an
                introductory request). If a chat request is declined, a 24-hour cooldown applies
                before another request can be sent. Harassment, spam, or abusive messages are
                strictly prohibited.
              </li>
            </ul>
          </section>

          <section id="moderation-admin" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              7. Moderation &amp; Administrator Access
            </h2>
            <p>
              To keep Boardly safe for students, our moderation systems and administrators operate
              as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Community Reports &amp; Auto-Hide:</strong> Students can report posts or
                comments. Posts that receive 3 or more community reports are automatically hidden
                pending administrator review.
              </li>
              <li>
                <strong>What Administrators Can Access:</strong> Boardly administrators and super
                administrators at SHS Virtual Academy can view and moderate public and hidden
                Commons posts, comments (including internal author records for anonymous posts when
                investigating abuse), user reports, Nakama Captain and crew applications, payment
                verification requests, and AI Study Buddy logs (`study_buddy_logs`).
              </li>
              <li>
                <strong>Direct Messages Storage:</strong> Direct chat messages and chat requests are
                stored securely on our servers (`conversations` and `chatRequests`
                records) so they sync across your devices. While there is no routine admin chat
                browsing panel in the standard interface, messages are not end-to-end encrypted and
                may be accessed in server records if required to investigate severe safety reports
                or legal obligations.
              </li>
            </ul>
          </section>

          <section id="rewards-kobans" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              8. Rewards, Referrals &amp; Kobans
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Virtual Credits Only (No Cash Value):</strong> &ldquo;Kobans&rdquo; are
                virtual in-app points used solely within Boardly to unlock profile cosmetics
                (avatars, frames, effects, banners) or redeem Boardly Pro passes. Kobans have{' '}
                <strong>no real-world monetary or cash value</strong>, are not a currency or
                financial instrument, cannot be withdrawn or exchanged for cash, and cannot be
                transferred between accounts.
              </li>
              <li>
                <strong>Earning Kobans &amp; Referral Rules:</strong> Registered users (excluding
                guests) may earn Kobans through daily check-ins, MCQ practice milestones, and
                verified student referrals when the Rewards program is active. Referral rewards
                require two-way confirmation, require the invited student to complete at least 20
                MCQs, are capped at a maximum of 10 paid referrals per calendar month, and are
                screened via IP address hashes to prevent self-referrals.
              </li>
              <li>
                <strong>Anti-Farming &amp; Revocation:</strong> Creating multiple accounts, using
                bots or scripts, or exploiting bugs to farm Kobans is prohibited. We may adjust,
                freeze, or revoke Koban balances obtained through fraud, abuse, or technical errors,
                and we may modify or pause reward rates at any time.
              </li>
            </ul>
          </section>

          <section id="pro-payments" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              9. Boardly Pro, Manual Payments &amp; Zero Refunds
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong>Plans &amp; Pricing:</strong> Boardly offers fixed-duration Pro passes,
                including the Monthly Pass (30 days, PKR 199 or 1,990 Kobans) and Annual Pass (365
                days, PKR 1,791 or 17,910 Kobans), as well as optional Koban packs. Prices are
                displayed in Pakistani Rupees (PKR) before checkout.
              </li>
              <li>
                <strong>How Payment &amp; Manual Verification Work:</strong> Payments are verified
                manually. When you pay via Pakistani mobile wallet or bank transfer (currently{' '}
                <strong>JazzCash</strong> and <strong>Opay</strong>), you send the exact PKR amount
                to the official account shown at checkout and submit your payment details and proof
                (Transaction ID / TID). After you submit your payment and proof, our team verifies
                it and activates your plan <strong>within 24 hours</strong> (we do not promise
                instant activation for manual payments). You may also redeem an existing in-app
                Koban balance toward a Pro pass.
              </li>
              <li>
                <strong>When Your Plan Starts &amp; Expiry Extension:</strong> Your Pro pass starts
                once your payment is verified and activated (or if you already have an active Pro
                pass, the new duration is added onto your current expiry date). Passes do not
                auto-renew or auto-charge your account when they expire. Submitting fake, altered,
                or duplicate Transaction IDs will result in rejection and may lead to account
                suspension.
              </li>
              <li>
                <strong>Zero Refunds Policy (All Purchases Final):</strong> We have a strict{' '}
                <strong>zero refunds</strong> policy. All Pro, Premium, and Koban purchases are{' '}
                <strong>final and non-refundable once submitted or activated</strong>. Please verify
                your selected plan and payment amount carefully before submitting your payment.
              </li>
            </ul>
          </section>

          <section id="acceptable-use" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              10. Acceptable Use &amp; Anti-Abuse Rules
            </h2>
            <p>When using Boardly, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Scrape, copy, bulk-download, or redistribute Boardly&apos;s MCQ question banks,
                explanations, or mock tests (PDF downloads are rate-limited to 1 download per hour
                for personal study only).
              </li>
              <li>
                Use automated bots, scripts, or headless browsers to submit tests, manipulate Grand
                Line leaderboards, or farm streaks and Kobans.
              </li>
              <li>
                Upload malware, executable files (`.exe`, `.bat`, `.sh`, `.apk`, `.js`, etc.),
                unlawful content, hate speech, harassment, or copyrighted materials you do not have
                permission to share.
              </li>
              <li>
                Attempt to bypass rate limits, authentication checks, Two-Step Verification, or
                server security controls.
              </li>
            </ul>
          </section>

          <section id="intellectual-property" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              11. Intellectual Property &amp; User Content
            </h2>
            <p>
              <strong>Boardly Content:</strong> All platform software, visual designs, logos,
              Zenryu companion artwork, curated MCQ explanations, and original study materials are
              owned by SHS Virtual Academy (Boardly) or its licensors and are protected by copyright
              and intellectual property laws. You receive a personal, non-exclusive,
              non-transferable license to use Boardly solely for your own exam preparation.
            </p>
            <p>
              <strong>Your Content:</strong> You retain ownership of the original notes, posts, and
              comments you upload to Boardly Commons. By posting content on Boardly Commons, you
              grant SHS Virtual Academy (operating Boardly) a worldwide, royalty-free, non-exclusive
              license to host, display, format, and distribute that content to other students on the
              platform.
            </p>
          </section>

          <section id="university-disclaimer" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              12. University &amp; Exam Non-Affiliation Disclaimer
            </h2>
            <p>
              Boardly is an independent educational preparation platform operated by SHS Virtual
              Academy. We are <strong>not affiliated with, associated with, authorized by, endorsed
              by, or in any way officially connected with</strong> any university, college, or
              examination authority — including but not limited to NUST (NET), FAST-NUCES, IBA
              Karachi, LUMS, GIKI, UET (ECAT), PIEAS, NED, NUMS, Aga Khan University (AKU), ETEA,
              NTS (NAT), HEC (USAT), PMDC (MDCAT), or any Federal or Provincial Board of
              Intermediate and Secondary Education (BISE). All university and exam names are used
              strictly for identification of study tracks. Practice scores and mock rankings on
              Boardly do not guarantee admission or official exam results.
            </p>
          </section>

          <section id="mobile-android" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              13. Web, PWA &amp; Mobile / Android Access
            </h2>
            <p>
              You may access Boardly through a standard web browser, by installing our Progressive
              Web App (PWA) to your home screen, or through any official mobile/Android application
              we release. You are responsible for any mobile data charges incurred while using
              Boardly. If you download or access Boardly via Google Play or another app store in the
              future, your use is also subject to that store&apos;s standard terms, while{' '}
              <strong>SHS Virtual Academy</strong> (and not Google Play) remains solely responsible
              for the Boardly app and student support.
            </p>
          </section>

          <section id="termination" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              14. Suspension, Termination &amp; Disclaimers
            </h2>
            <p>
              <strong>Suspension &amp; Termination:</strong> You may stop using Boardly at any time
              or request account deletion as described in our{' '}
              <Link to="/privacy" className="text-[var(--red)] hover:underline font-medium">
                Privacy Policy
              </Link>
              . We may suspend, restrict, or permanently delete accounts that violate these Terms,
              submit fraudulent payment TIDs, abuse community features, or compromise platform
              security.
            </p>
            <p>
              <strong>Service Provided &ldquo;As Is&rdquo;:</strong> Boardly is provided on an
              &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of
              uninterrupted availability or error-free content. To the fullest extent permitted by
              law, SHS Virtual Academy&apos;s total liability for any claim arising out of your use
              of Boardly is limited to the total amount you paid for Boardly Pro access in the
              twelve (12) months preceding the claim.
            </p>
          </section>

          <section id="governing-law" className="scroll-mt-28 space-y-4">
            <h2 className="font-dot text-2xl text-[var(--text)]">
              15. Governing Law, Updates &amp; Contact
            </h2>
            <p>
              <strong>Governing Law:</strong> These Terms are governed by the laws of the{' '}
              <strong>Islamic Republic of Pakistan</strong>. Any disputes arising from these Terms
              or your use of Boardly shall be subject to the jurisdiction of the courts in
              Rawalpindi, Pakistan.
            </p>
            <p>
              <strong>Updates to These Terms:</strong> When we make material changes to these Terms,
              we will update the version number and &ldquo;Last updated&rdquo; date at the top of
              this page and display a notice inside the app for logged-in users.
            </p>
            <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-4 text-xs sm:text-sm space-y-1.5">
              <p className="text-[var(--text)] font-semibold">
                Legal, Support, Privacy &amp; Data Request Contact:
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
export default TermsPage;

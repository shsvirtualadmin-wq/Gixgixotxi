import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';

const TOC = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'accounts', title: '2. Student Account Registration & Security' },
  { id: 'plans', title: '3. Plans, Subscriptions & Payment Verification' },
  { id: 'refunds', title: '4. Refund & Cancellation Policy' },
  { id: 'acceptable-use', title: '5. Acceptable Use & Academic Integrity' },
  { id: 'intellectual-property', title: '6. Content & Question Bank Ownership' },
  { id: 'disclaimer', title: '7. University Non-Affiliation & Results Disclaimer' },
  { id: 'crew-captain', title: '8. Study Crew & Campus Captain Rules' },
  { id: 'termination', title: '9. Account Suspension & Termination' },
  { id: 'liability', title: '10. Limitation of Liability' },
  { id: 'governing-law', title: '11. Governing Law & Jurisdiction' },
  { id: 'contact', title: '12. Contact Information' },
];

export function TermsPage() {
  return (
    <>
      <PageMeta
        title="Terms of Service — Boardly Technologies"
        description="Read the official terms and conditions governing the use of Boardly test preparation services, Pro plans, Study Crews, and exam simulation tools. Effective date: 17 October 2026."
      />

      <div className="pt-28 pb-20 boardly-container page-enter space-y-12">
        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <Badge color="red">Legal &amp; Terms</Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Effective Date: <strong className="text-[var(--text)]">17 October 2026</strong> &bull; Boardly Technologies, Pakistan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Table of Contents Sticky Sidebar */}
          <div className="lg:col-span-4 sticky top-28 hidden lg:block">
            <Card className="p-5 space-y-3">
              <h3
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-faint)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Table of Contents
              </h3>
              <nav className="flex flex-col space-y-1.5 text-xs text-[var(--muted)]">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="hover:text-[var(--red)] transition-colors py-1 block"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)] space-y-1">
                <p>Questions regarding our terms?</p>
                <a href="mailto:support@boardly.cfd" className="text-[var(--red)] font-semibold hover:underline block">
                  support@boardly.cfd
                </a>
              </div>
            </Card>
          </div>

          {/* Main Legal Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1 */}
            <Card id="acceptance" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                1. Acceptance of Terms
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Student&rdquo;, or &ldquo;you&rdquo;) and <strong className="text-[var(--text)]">Boardly Technologies</strong> (&ldquo;Boardly&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing our website, creating an account, or using our test engines and Study Crew rooms, you agree to comply with and be bound by these Terms. If you do not agree to these Terms, you must discontinue using Boardly immediately.
              </p>
            </Card>

            {/* Section 2 */}
            <Card id="accounts" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                2. Student Account Registration &amp; Security
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5">
                <li>You must provide accurate, current, and complete information during registration.</li>
                <li>Each student account is strictly personal. Sharing login credentials, account pooling in coaching academies, or concurrent multi-device automated testing is prohibited.</li>
                <li>You are responsible for maintaining the confidentiality of your credentials. Notify us immediately at <a href="mailto:support@boardly.cfd" className="text-[var(--red)] hover:underline">support@boardly.cfd</a> if you suspect unauthorized access.</li>
              </ul>
            </Card>

            {/* Section 3 */}
            <Card id="plans" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                3. Plans, Subscriptions &amp; Payment Verification
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly offers two straightforward membership tiers:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5">
                <li><strong className="text-[var(--text)]">Free Plan (PKR 0):</strong> Includes 10 tests per day, 3 Arena mocks, 5 AI Tutor derivation tokens, and full KaTeX formula derivations, refreshing at 12:00 AM PKT.</li>
                <li><strong className="text-[var(--text)]">Pro Plan (PKR 199 / month):</strong> Grants 30 days of unlimited tests, unlimited Arena mocks, full university past paper vaults, and weak chapter diagnostics.</li>
              </ul>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] space-y-1.5 mt-2">
                <p className="font-semibold text-[var(--text)]">Payment Verification &amp; Manual Approval Flow:</p>
                <p>
                  Payments are accepted via local Pakistani channels: JazzCash, EasyPaisa, SadaPay, and direct bank transfer (IBAN). After completing your transfer, you must submit your transaction ID (TRX) and receipt screenshot on the Plans page. Your subscription is marked as &ldquo;pending&rdquo; and reviewed by an administrator. Once confirmed against our bank ledger, 30-day Pro access is unlocked.
                </p>
              </div>
            </Card>

            {/* Section 4 */}
            <Card id="refunds" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                4. Refund &amp; Cancellation Policy
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Because Boardly does not use automatic recurring card billing, you are never charged without your direct manual action. Subscriptions expire automatically after 30 days unless you choose to renew.
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                If a duplicate payment is made in error, or if technical issues prevent access to verified Pro features within 48 hours of approval, you may request a refund by emailing <a href="mailto:support@boardly.cfd" className="text-[var(--red)] font-semibold hover:underline">support@boardly.cfd</a> with proof of payment. Verified duplicate payments are refunded to the original sending wallet within 3 to 5 business days.
              </p>
            </Card>

            {/* Section 5 */}
            <Card id="acceptable-use" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                5. Acceptable Use &amp; Academic Integrity
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                To protect academic fairness and platform stability, you agree not to:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5">
                <li>Scrape, extract, crawl, or harvest questions, solutions, or student rosters through automated scripts.</li>
                <li>Attempt to manipulate live Arena or Grand Line leaderboards through bot submissions, answer leaks, or reverse engineering.</li>
                <li>Share, sell, or publicly re-distribute proprietary question bank compilations.</li>
                <li>Abuse referral links, promotional codes, or ambassador rewards through fake account creation.</li>
                <li>Post abusive, harassing, or defamatory comments in support inquiries or review submissions.</li>
              </ul>
            </Card>

            {/* Section 6 */}
            <Card id="intellectual-property" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                6. Content &amp; Question Bank Ownership
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                The Boardly software, test engine algorithms, UI design, KaTeX math conversions, curated explanations, and brand assets are the proprietary property of Boardly Technologies and protected under Pakistani copyright and intellectual property laws.
              </p>
            </Card>

            {/* Section 7 */}
            <Card id="disclaimer" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                7. University Non-Affiliation &amp; Results Disclaimer
              </h2>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] space-y-2">
                <p className="font-bold text-[var(--red)] uppercase tracking-wide">Important Disclaimer:</p>
                <p>
                  Boardly is an independent educational preparatory platform. We are <strong>NOT affiliated with, endorsed by, or partnered with FAST-NUCES, NUST, GIKI, LUMS, NED University, PMDC, or any university admissions testing authority</strong>. All university trademarks belong exclusively to their respective institutions.
                </p>
                <p>
                  Practice test scores, aggregate calculations, and Boardy AI explanations are intended solely for academic training and self-assessment. High scores on Boardly do not guarantee admission or selection in any official entrance examination.
                </p>
              </div>
            </Card>

            {/* Section 8 */}
            <Card id="crew-captain" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                8. Study Crew &amp; Campus Captain Rules
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5">
                <li>Study crews are limited to 30 members per squad room to preserve focus and study quality.</li>
                <li>Squad leaders have the discretion to accept, reject, or remove members from their private squad.</li>
                <li>Campus Captains and Crew Ambassadors act as student representatives and must conduct themselves ethically. Fraudulent referral generation or misleading claims regarding official university affiliation will result in immediate revocation of ambassador status.</li>
              </ul>
            </Card>

            {/* Section 9 */}
            <Card id="termination" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                9. Account Suspension &amp; Termination
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these Terms, engage in automated scraping, abuse promotional codes, or circulate harmful materials. In cases of severe terms violation, access may be revoked without refund.
              </p>
            </Card>

            {/* Section 10 */}
            <Card id="liability" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                10. Limitation of Liability
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                To the maximum extent permitted by applicable law, Boardly Technologies and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use or inability to use the platform, including any test date scheduling errors or official admission decisions.
              </p>
            </Card>

            {/* Section 11 */}
            <Card id="governing-law" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                11. Governing Law &amp; Jurisdiction
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Pakistan.
              </p>
            </Card>

            {/* Section 12 */}
            <Card id="contact" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                12. Contact Information
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                For questions about these Terms of Service or to report a terms violation, contact our desk:
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1.5">
                <p><strong className="text-[var(--text)]">Email:</strong> <a href="mailto:support@boardly.cfd" className="text-[var(--red)] hover:underline">support@boardly.cfd</a></p>
                <p><strong className="text-[var(--text)]">WhatsApp / Phone:</strong> <a href="tel:+923058969050" className="hover:underline">0305 8969050</a> (<a href="https://wa.me/923058969050" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">WhatsApp</a>)</p>
                <p><strong className="text-[var(--text)]">Helpdesk:</strong> <Link to="/contact" className="text-[var(--red)] hover:underline">Contact Desk</Link></p>
              </div>
            </Card>

            {/* Footer nav */}
            <div className="p-6 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>Read our Privacy Policy:</span>
              <div className="flex gap-2">
                <Link to="/privacy" className="btn-red text-xs px-4" style={{ height: '38px' }}>
                  Privacy Policy
                </Link>
                <Link to="/contact" className="btn-outline text-xs px-4" style={{ height: '38px' }}>
                  Contact Desk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TermsPage;

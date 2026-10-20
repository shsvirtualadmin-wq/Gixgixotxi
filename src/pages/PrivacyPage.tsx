import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';

const TOC = [
  { id: 'identity', title: '1. Who We Are & Contact' },
  { id: 'collection', title: '2. Information We Collect' },
  { id: 'public-profile', title: '3. Student Public Profiles & Cosmetics Privacy' },
  { id: 'purpose', title: '4. Why We Use Your Information' },
  { id: 'processors', title: '5. Third-Party Services We Use' },
  { id: 'no-sale', title: '6. We Do Not Sell Personal Data' },
  { id: 'cookies', title: '7. Cookies & Local Storage' },
  { id: 'retention', title: '8. Data Retention' },
  { id: 'rights', title: '9. Access, Correction & Deletion Requests' },
  { id: 'security', title: '10. Security Measures' },
  { id: 'minors', title: '11. Children, Minors & Parental Permission' },
  { id: 'changes', title: '12. Policy Changes & Effective Date' },
];

export function PrivacyPage() {
  return (
    <>
      <PageMeta
        title="Privacy Policy — Boardly Technologies"
        description="Learn how Boardly Technologies collects, uses, and safeguards student preparation data in compliance with data privacy standards. Last updated: 20 October 2026."
      />

      <div className="pt-28 pb-20 boardly-container page-enter space-y-12">
        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <Badge color="red">Legal &amp; Privacy</Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Last updated: <strong className="text-[var(--text)]">20 October 2026</strong> &bull; Boardly Technologies, Pakistan
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
                <p>Have privacy questions?</p>
                <a href="mailto:support@boardly.cfd" className="text-[var(--red)] font-semibold hover:underline block">
                  support@boardly.cfd
                </a>
              </div>
            </Card>
          </div>

          {/* Main Legal Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1 */}
            <Card id="identity" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                1. Who We Are &amp; Contact Details
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                This Privacy Policy applies to the online services, web application, and digital platforms operated by <strong className="text-[var(--text)]">Boardly Technologies</strong> (&ldquo;Boardly&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), registered in Pakistan.
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1.5">
                <p><strong className="text-[var(--text)]">Email:</strong> <a href="mailto:support@boardly.cfd" className="text-[var(--red)] hover:underline">support@boardly.cfd</a></p>
                <p><strong className="text-[var(--text)]">Phone / WhatsApp:</strong> <a href="tel:+923058969050" className="hover:underline">0305 8969050</a> (<a href="https://wa.me/923058969050" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">WhatsApp direct</a>)</p>
                <p><strong className="text-[var(--text)]">Official Web Domain:</strong> <a href="https://boardly.cfd" className="hover:underline">https://boardly.cfd</a></p>
              </div>
            </Card>

            {/* Section 2 */}
            <Card id="collection" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                2. Information We Collect
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We collect only the minimum personal and academic data necessary to provide a high-performance entrance test-prep experience:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5">
                <li><strong className="text-[var(--text)]">Account Profile:</strong> Full name, display name, email address, optional contact phone number, and avatar when registering directly or through Google Sign-In.</li>
                <li><strong className="text-[var(--text)]">Academic Preferences:</strong> Target university (e.g. FAST-NUCES, NUST NET, GIKI, MDCAT), target examination date, academic track (FSc Pre-Engineering, Pre-Medical, ICS, A-Levels), and subject priorities.</li>
                <li><strong className="text-[var(--text)]">Practice Test Responses:</strong> Questions answered, option choices, time taken per question, test scores, net scores after negative marking deductions, and consecutive daily streak logs.</li>
                <li><strong className="text-[var(--text)]">Wallet &amp; Payment Records:</strong> Kobans balance, immutable wallet ledger transactions, payment transaction IDs (TRX), sender wallet phone or account numbers, payment method (JazzCash, EasyPaisa, SadaPay, Bank Transfer), and uploaded receipt screenshots for manual verification.</li>
                <li><strong className="text-[var(--text)]">Support Inquiries:</strong> Messages, ticket logs, and technical questions submitted through the helpdesk or contact form.</li>
                <li><strong className="text-[var(--text)]">Technical &amp; Device Data:</strong> IP address, browser type, operating system, and HTTP request headers to protect against automated scraping and enforce rate limits.</li>
              </ul>
            </Card>

            {/* Section 3: Public Profiles & Privacy */}
            <Card id="public-profile" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                3. Student Public Profiles &amp; Cosmetics Privacy
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We enforce strict data minimization for student identities across social and competitive platform features:
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm text-[var(--muted)] space-y-2">
                <p>
                  <strong className="text-[var(--text)]">What other users see:</strong> Other students on public leaderboards, Grand Line rankings, and Study Crew squad lists can see <strong>ONLY</strong> your sanitized display name, avatar, equipped cosmetics (avatar frame, nameplate, aura effect), squad name, and public academic stats (streak, test score, rank).
                </p>
                <p>
                  <strong className="text-[var(--text)]">Never exposed publicly:</strong> Your registered <strong>email address and phone number are NEVER shown to other users</strong>, crew leaders, or competitors. They are strictly confidential and visible only to the superadmin for administrative verification, account recovery, and payment audit.
                </p>
                <p>
                  <strong className="text-[var(--text)]">Wallet &amp; Ledger Security:</strong> Your Kobans balance, ledger transactions, and payment reference numbers are private records accessible solely to you and the superadmin.
                </p>
              </div>
            </Card>

            {/* Section 4 */}
            <Card id="purpose" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                4. Why We Use Your Information
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We process your data exclusively for legitimate educational and platform operations:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5">
                <li>To deliver personalized practice tests, 10-minute sprints, and chapter-level drills.</li>
                <li>To calculate authentic university negative marking penalties (such as FAST-NUCES -0.25).</li>
                <li>To diagnose weak chapters and plot historical accuracy curves over your preparation season.</li>
                <li>To maintain predictable daily usage quotas (10 tests/day on Free) refreshing at midnight Pakistan Standard Time (PKT).</li>
                <li>To operate Study Crew squad rooms, squad leaderboards, and national competitive Arena sessions.</li>
                <li>To verify Pro subscription payments and Kobans credit requests against mobile banking logs.</li>
              </ul>
            </Card>

            {/* Section 5 */}
            <Card id="processors" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                5. Third-Party Services We Use
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We rely on trusted enterprise infrastructure providers to host, secure, and deliver Boardly:
              </p>
              <div className="space-y-3 pt-1 text-xs sm:text-sm text-[var(--muted)]">
                <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <strong className="text-[var(--text)]">Google Firebase (Authentication &amp; Cloud Firestore):</strong> Manages encrypted user credentials, OAuth tokens, and stores user profiles, test sessions, wallets, and support tickets under strict security rules.
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <strong className="text-[var(--text)]">Cloudflare:</strong> Provides global Content Delivery Network (CDN) caching, SSL/TLS encryption, DDoS defense, and serverless edge functions.
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <strong className="text-[var(--text)]">Resend:</strong> Used solely to transmit email notifications for support tickets and account verifications from our verified domain (<code className="text-[var(--text)]">boardly.cfd</code>).
                </div>
              </div>
            </Card>

            {/* Section 6 */}
            <Card id="no-sale" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                6. We Do Not Sell Personal Data
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We do not sell, rent, license, or monetize your personal information, test scores, or contact details to third-party advertisers, data brokers, or private academies. Your academic scores and mistakes exist solely for your own preparation.
              </p>
            </Card>

            {/* Section 7 */}
            <Card id="cookies" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                7. Cookies &amp; Local Storage
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly does not use invasive cross-site advertising trackers. We utilize modern browser <code className="text-[var(--text)]">localStorage</code> strictly for functional platform features:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5">
                <li><code className="text-[var(--text)]">boardly-theme</code>: Remembers your light or dark mode visual preference.</li>
                <li><code className="text-[var(--text)]">boardly-wallpaper</code>: Remembers your selected Nothing OS background wallpaper.</li>
                <li><code className="text-[var(--text)]">pending_join_crew_code</code>: Preserves your squad invite code during sign-in.</li>
                <li>Session authentication tokens required by Firebase to keep you signed in securely.</li>
              </ul>
            </Card>

            {/* Section 8 */}
            <Card id="retention" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                8. Data Retention
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We retain your account profile and test history as long as your account remains active. If you discontinue using Boardly and request account removal, your records are deleted or permanently anonymized in accordance with Section 9.
              </p>
            </Card>

            {/* Section 9 */}
            <Card id="rights" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                9. Access, Correction &amp; Deletion Requests
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                You have the right to request a copy of your stored personal data, request corrections to inaccurate profile details, or request permanent deletion of your account and test attempts.
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                To submit a privacy or data deletion request, email our desk from your registered email address at <a href="mailto:support@boardly.cfd" className="text-[var(--red)] font-semibold hover:underline">support@boardly.cfd</a> with the subject line &ldquo;Data Request&rdquo;. Requests are processed within 7 business days. You can also self-delete your account directly via Settings.
              </p>
            </Card>

            {/* Section 10 */}
            <Card id="security" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                10. Security Measures
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We implement industry-standard technical measures including full-site HTTPS encryption, secure Firestore granular security rules forbidding cross-user unauthorized reads, edge DDoS mitigation, and encrypted password authentication.
              </p>
            </Card>

            {/* Section 11 */}
            <Card id="minors" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                11. Children, Minors &amp; Parental Permission
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly is designed for secondary school (Matric/FSc), A-Level, and college students preparing for university entrance exams.
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] space-y-1.5">
                <p className="font-bold text-[var(--red)]">Parental Permission Requirement:</p>
                <p>
                  Account holders under 18 years of age must obtain the explicit knowledge and permission of a parent or legal guardian before creating an account, upgrading to Pro, or purchasing Kobans virtual currency.
                </p>
              </div>
            </Card>

            {/* Section 12 */}
            <Card id="changes" className="p-6 sm:p-8 space-y-3 scroll-mt-28">
              <h2
                className="text-xl font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                12. Policy Changes &amp; Effective Date
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We may periodically update this Privacy Policy to reflect platform improvements or statutory compliance requirements. The current effective version is dated <strong className="text-[var(--text)]">20 October 2026</strong>. Continued use of Boardly after changes are published constitutes your acceptance of the updated terms.
              </p>
            </Card>

            {/* Helpdesk banner */}
            <div className="p-6 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>Have additional privacy questions?</span>
              <div className="flex gap-2">
                <Link to="/contact" className="btn-outline text-xs px-4" style={{ height: '38px' }}>
                  Contact Desk
                </Link>
                <Link to="/terms" className="btn-red text-xs px-4" style={{ height: '38px' }}>
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPage;

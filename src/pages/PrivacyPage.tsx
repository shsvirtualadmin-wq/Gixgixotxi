import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const TOC = [
  { id: 'identity', title: '1. Who We Are & Operator' },
  { id: 'collection', title: '2. Information We Collect' },
  { id: 'commons-privacy', title: '3. Boardly Commons & Anonymous Posting' },
  { id: 'payments', title: '4. Payments & Verification' },
  { id: 'purpose', title: '5. How We Use Your Information' },
  { id: 'services', title: '6. Service Providers We Use' },
  { id: 'no-sale', title: '7. We Never Sell Your Data' },
  { id: 'cookies', title: '8. Cookies & Local Storage' },
  { id: 'security-retention', title: '9. Security & Data Retention' },
  { id: 'rights', title: '10. Your Rights & Data Deletion' },
  { id: 'contact', title: '11. Contact Information' },
];

export function PrivacyPage() {
  return (
    <>
      <PageMeta
        title="Privacy Policy — Boardly"
        description="Learn how SHS Virtual Academy and Boardly protect student data. Details on Firebase authentication, Commons posting, anonymous posts, and data privacy."
      />

        <div className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12">
        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <span className="section-chip-red">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
              Legal &amp; Privacy
            </span>
          </div>
          <h1
            className="text-3xl sm:text-5xl font-black text-[var(--text)] tracking-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Last updated: <strong className="text-[var(--text)]">20 October 2026</strong> &bull; SHS Virtual Academy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Table of Contents Sticky Sidebar */}
          <div className="lg:col-span-4 sticky top-28 hidden lg:block">
            <div className="glass-card p-5 sm:p-6 rounded-[24px] space-y-4 ">
              <h3
                className="text-xs font-black uppercase tracking-wider text-[var(--text-faint)] font-dot"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                Table of Contents
              </h3>
              <nav className="flex flex-col space-y-1 text-xs text-[var(--muted)]">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="hover:text-[var(--text)] hover:bg-white/[0.04] transition-all py-1.5 px-2 rounded-xl block"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>

              <div className="pt-4 border-t border-white/[0.08] text-xs text-[var(--muted)] space-y-1">
                <p>Have privacy questions?</p>
                <a href="mailto:support@boardly.cfd" className="text-[#D71921] font-semibold hover:underline block">
                  support@boardly.cfd
                </a>
              </div>
            </div>
          </div>

          {/* Main Legal Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1 */}
            <div id="identity" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                1. Who We Are &amp; Operator Information
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                This Privacy Policy applies to <strong className="text-[var(--text)]">Boardly</strong> (&ldquo;Boardly&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a general MCQ practice and learning platform built to make quality education accessible to every student.
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly is owned and operated by <strong className="text-[var(--text)]">SHS Virtual Academy</strong> (<a href="https://shsvirtualacademy.pro" target="_blank" rel="noopener noreferrer" className="text-[#D71921] hover:underline">https://shsvirtualacademy.pro</a>), founded by <strong className="text-[var(--text)]">Muhammad Hashir</strong>.
              </p>
              <div className="glass-row p-4 sm:p-5 rounded-2xl  text-xs space-y-1.5">
                <p><strong className="text-[var(--text)]">Organization:</strong> SHS Virtual Academy</p>
                <p><strong className="text-[var(--text)]">Founder:</strong> Muhammad Hashir</p>
                <p><strong className="text-[var(--text)]">Email:</strong> <a href="mailto:support@boardly.cfd" className="text-[#D71921] hover:underline">support@boardly.cfd</a></p>
                <p><strong className="text-[var(--text)]">Official Helpline:</strong> <a href="tel:+923058969050" className="hover:underline">0305 8969050</a></p>
                <p><strong className="text-[var(--text)]">Website:</strong> <a href="https://boardly.cfd" className="hover:underline">https://boardly.cfd</a></p>
              </div>
            </div>

            {/* Section 2 */}
            <div id="collection" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                2. Information We Collect
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We collect only the minimum information necessary to operate your learning account and provide practice features:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5 leading-relaxed">
                <li><strong className="text-[var(--text)]">Account Credentials:</strong> Email address and password created via Firebase Authentication, or your Google account profile information (display name, email address, profile picture) if you choose to sign in with Google.</li>
                <li><strong className="text-[var(--text)]">Student Profile Details:</strong> Your chosen display name, avatar style, and optional grade or subject preferences.</li>
                <li><strong className="text-[var(--text)]">Learning &amp; Practice Activity:</strong> MCQ practice history, test scores, chosen answers, chapter-level accuracy metrics, and daily practice streaks stored in Google Cloud Firestore.</li>
                <li><strong className="text-[var(--text)]">Virtual Economy (Kobans):</strong> Your virtual Koban coin balance and equipped cosmetic items (frames, nameplates, and effects).</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div id="commons-privacy" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                3. Boardly Commons &amp; Anonymous Posting
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly Commons is our student community feed where learners share study notes, ask questions, and discuss solutions. All content in Commons is user-generated.
              </p>
              <div className="glass-row p-4 sm:p-5 rounded-2xl  text-xs space-y-2 leading-relaxed">
                <p className="font-bold text-[var(--text)]">How Anonymous Posting Works:</p>
                <p className="text-[var(--muted)]">
                  When you select &ldquo;Post Anonymously&rdquo;, your real name and avatar are hidden from other students in the public feed, allowing you to ask questions freely without social anxiety.
                </p>
                <p className="text-[var(--muted)]">
                  However, Boardly&apos;s system retains an internal, private record linking the post to your account identifier (<code className="font-mono text-[var(--text)]">authorUid</code>). This internal record is accessible only to authorized administrators strictly for student safety, spam prevention, and community rule enforcement.
                </p>
                <p className="text-[var(--muted)]">
                  Posting anonymously does not shield abusive conduct. Any user who bullies, harasses, posts harmful scripts, or violates community rules can be identified, moderated, and suspended from the platform.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div id="payments" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                4. Payments &amp; Verification Data
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly offers simple and transparent paid options: Unlimited access at 199 PKR, and Koban cosmetic packs at 50 PKR for 500 kobans.
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Payments are made through local Pakistani payment services (JazzCash, Opay, SadaPay, or direct bank transfer). When submitting payment proof, you provide your Transaction ID (TRX) and an optional receipt image for manual verification. We do not process or store credit card numbers, debit card details, or automated bank mandates.
              </p>
            </div>

            {/* Section 5 */}
            <div id="purpose" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                5. How We Use Your Information
              </h2>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5 leading-relaxed">
                <li>To maintain your student account and provide uninterrupted access to practice tests.</li>
                <li>To calculate your chapter accuracy and help you identify weak topics.</li>
                <li>To display your public display name, avatar, and rank on leaderboards and in Commons.</li>
                <li>To calculate and preserve your consecutive daily practice streaks.</li>
                <li>To verify and activate paid Unlimited access or credit Koban balances upon receipt verification.</li>
                <li>To ensure community safety and enforce our anti-harassment standards.</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div id="services" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                6. Service Providers We Use
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We partner with established cloud infrastructure providers to run Boardly:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5 leading-relaxed">
                <li><strong className="text-[var(--text)]">Google Firebase:</strong> Manages authentication securely, hosts encrypted database records in Firestore, and stores user-uploaded study attachments in Firebase Storage.</li>
                <li><strong className="text-[var(--text)]">Google Gemini AI:</strong> Powers the Boardy 24/7 AI tutor to generate step-by-step math and science explanations.</li>
                <li><strong className="text-[var(--text)]">Resend:</strong> Delivers transactional messages sent via the contact support form.</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div id="no-sale" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                7. We Never Sell Your Data
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly does not sell, rent, monetize, or trade student personal information, test scores, or study notes to third-party advertisers, data brokers, or coaching institutes. Your learning journey belongs strictly to you.
              </p>
            </div>

            {/* Section 8 */}
            <div id="cookies" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                8. Cookies &amp; Local Storage
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                We use browser <code className="font-mono text-xs text-[var(--text)]">localStorage</code> strictly for functional purposes: keeping you signed in across browser refreshes and saving your preferred theme mode (dark or light). We do not use third-party tracking pixels or cross-site advertising cookies.
              </p>
            </div>

            {/* Section 9 */}
            <div id="security-retention" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                9. Security &amp; Data Retention
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                All data transmission between your browser and our servers is encrypted using standard HTTPS/TLS protocols. Access to administrative moderation tools is strictly restricted to verified staff members. We retain your practice data and study records as long as your account remains active.
              </p>
            </div>

            {/* Section 10 */}
            <div id="rights" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                10. Your Rights &amp; Data Deletion
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                You have the right to request access to your stored personal information, update your profile details, or request full deletion of your student account and associated data. To submit a deletion or correction request, email our team at <a href="mailto:support@boardly.cfd" className="text-[#D71921] font-semibold hover:underline">support@boardly.cfd</a>.
              </p>
            </div>

            {/* Section 11 */}
            <div id="contact" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                11. Contact Information
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                If you have any questions regarding this Privacy Policy or our data handling practices, please contact us:
              </p>
              <div className="glass-row p-4 sm:p-5 rounded-2xl  text-xs space-y-1">
                <p><strong className="text-[var(--text)]">Email:</strong> support@boardly.cfd</p>
                <p><strong className="text-[var(--text)]">Phone / WhatsApp:</strong> 0305 8969050</p>
                <p><strong className="text-[var(--text)]">Organization:</strong> SHS Virtual Academy (<a href="https://shsvirtualacademy.pro" target="_blank" rel="noopener noreferrer" className="text-[#D71921] hover:underline">shsvirtualacademy.pro</a>)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrivacyPage;

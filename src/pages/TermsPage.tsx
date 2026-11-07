import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const TOC = [
  { id: 'acceptance', title: '1. Acceptance & Operator' },
  { id: 'accounts', title: '2. Student Accounts & Eligibility' },
  { id: 'pricing-payments', title: '3. Pricing, Unlimited Access & Payment Verification' },
  { id: 'kobans', title: '4. Kobans Virtual Credits & Profile Cosmetics' },
  { id: 'commons-rules', title: '5. Boardly Commons & User-Generated Content' },
  { id: 'anonymous-conduct', title: '6. Anonymous Posting & Safety Standards' },
  { id: 'study-crews', title: '7. Study Crews & Collaborative Learning' },
  { id: 'intellectual-property', title: '8. Intellectual Property & Shared Materials' },
  { id: 'termination', title: '9. Suspension & Account Removal' },
  { id: 'disclaimer', title: '10. General Service Disclaimer' },
  { id: 'contact', title: '11. Contact Information' },
];

export function TermsPage() {
  return (
    <>
      <PageMeta
        title="Terms of Service — Boardly"
        description="Official terms governing Boardly's MCQ practice platform, Study Crews, Boardly Commons, 199 PKR Unlimited access, and 50 PKR Koban packs. Operated by SHS Virtual Academy."
      />

      <div className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12">
        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <span className="section-chip-red">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
              Legal &amp; Terms
            </span>
          </div>
          <h1
            className="text-3xl sm:text-5xl font-black text-[var(--text)] tracking-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            Terms of Service
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
                <p>Questions regarding our terms?</p>
                <a href="mailto:support@boardly.cfd" className="text-[#D71921] font-semibold hover:underline block">
                  support@boardly.cfd
                </a>
              </div>
            </div>
          </div>

          {/* Main Legal Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1 */}
            <div id="acceptance" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                1. Acceptance of Terms &amp; Operator Information
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a binding agreement between you (&ldquo;User&rdquo;, &ldquo;Student&rdquo;, or &ldquo;you&rdquo;) and <strong className="text-[var(--text)]">SHS Virtual Academy</strong> (<a href="https://shsvirtualacademy.pro" target="_blank" rel="noopener noreferrer" className="text-[#D71921] hover:underline">https://shsvirtualacademy.pro</a>), founded by <strong className="text-[var(--text)]">Muhammad Hashir</strong>, regarding the operation and use of the <strong className="text-[var(--text)]">Boardly</strong> platform.
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                By creating an account, practicing MCQs, or participating in Boardly Commons, you agree to be bound by these Terms.
              </p>
            </div>

            {/* Section 2 */}
            <div id="accounts" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                2. Student Accounts &amp; Eligibility
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5 leading-relaxed">
                <li>Accounts are personal to each individual student. You agree not to share your login credentials or attempt automated scraping of practice questions.</li>
                <li>Students under the age of 18 represent that they have received parental or guardian permission before registering an account or initiating any optional payment.</li>
                <li>You are responsible for safeguarding your login credentials and for all activities that occur under your student profile.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div id="pricing-payments" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                3. Pricing, Unlimited Access &amp; Payment Verification
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly is built to make education accessible to all students. Our platform structure consists of:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5 leading-relaxed">
                <li><strong className="text-[var(--text)]">Free Tier:</strong> The free tier is generous and enough for students to practice and learn every day. Access to Boardly Commons and sharing study material is always free with no limit.</li>
                <li><strong className="text-[var(--text)]">Unlimited Access (199 PKR):</strong> Students who wish to unlock unlimited practice tests, unlimited Boardy AI queries, full chapter analytics, and complete question bank access can purchase Unlimited access for 199 PKR.</li>
              </ul>
              <div className="glass-row p-4 sm:p-5 rounded-2xl  text-xs space-y-1.5 leading-relaxed">
                <p className="font-bold text-[var(--text)]">How Payments Work:</p>
                <p className="text-[var(--muted)]">
                  Payments are conducted via manual local mobile and bank transfers in Pakistan (JazzCash, Opay, SadaPay, or direct bank transfer). After transferring the amount, you submit your Transaction ID (TRX) and receipt screenshot on the billing page. An administrator manually verifies the transaction against official bank records before activating your account.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div id="kobans" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                4. Kobans Virtual Credits &amp; Profile Cosmetics
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5 leading-relaxed">
                <li><strong className="text-[var(--text)]">Koban Pack (50 PKR for 500 Kobans):</strong> Kobans are virtual in-app credits used exclusively to customize your student profile.</li>
                <li><strong className="text-[var(--text)]">Purely Aesthetic:</strong> Kobans can be used to unlock dot-matrix avatar frames, animated nameplates, and aura effects. They provide zero academic advantage or altered test scores.</li>
                <li><strong className="text-[var(--text)]">Virtual Nature:</strong> Kobans have no real-world cash or monetary value, cannot be redeemed for fiat currency, and cannot be transferred between accounts. Unused Koban balances remain in your student wallet indefinitely.</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div id="commons-rules" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                5. Boardly Commons &amp; User-Generated Content
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly Commons allows students to share study materials, notes, formula sheets, and questions freely with each other. All content published in Commons is user-generated.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--muted)] list-disc pl-5 leading-relaxed">
                <li><strong className="text-[var(--text)]">User Responsibility:</strong> You are solely responsible for the material, notes, and messages you post or share. You agree to share only educational materials that you have the right to share.</li>
                <li><strong className="text-[var(--text)]">Community Rules:</strong> All members must be respectful, stay on academic topics, avoid spam or advertising, and never post malicious scripts or illegal content.</li>
                <li><strong className="text-[var(--text)]">Prohibited Content:</strong> Commercial promotions, exam paper leaks, offensive language, executable binaries (.exe, .apk, .bat, etc.), and harassment of any kind are strictly prohibited.</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div id="anonymous-conduct" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                6. Anonymous Posting &amp; Safety Standards
              </h2>
              <div className="glass-row p-4 sm:p-5 rounded-2xl  text-xs space-y-2 leading-relaxed">
                <p className="font-bold text-[var(--text)]">Anonymity &amp; Accountability:</p>
                <p className="text-[var(--muted)]">
                  When posting anonymously in Commons, other students see an anonymous pseudonym rather than your name or profile picture.
                </p>
                <p className="text-[var(--muted)]">
                  However, to protect community safety, Boardly maintains internal author records for every post and comment. Anonymous users must still adhere strictly to all community standards. Any user engaging in bullying, harassment, hate speech, or abuse while posting anonymously can and will be identified by administrators and removed from the platform.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div id="study-crews" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                7. Study Crews &amp; Collaborative Learning
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Students can create or join Study Crews using unique room codes. Study Crews are collaborative study groups designed for coordinating practice drills, tracking shared streaks, and staying motivated. Squad leaders and members agree to maintain a positive, supportive academic culture.
              </p>
            </div>

            {/* Section 8 */}
            <div id="intellectual-property" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                8. Intellectual Property &amp; Shared Materials
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                The Boardly platform, its visual design, UI components, code, logo, and KaTeX derivation formats are the intellectual property of SHS Virtual Academy. When you share original notes or study material in Commons, you retain your ownership rights while granting Boardly a royalty-free license to display that material to other students on the platform.
              </p>
            </div>

            {/* Section 9 */}
            <div id="termination" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                9. Suspension &amp; Account Removal
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                SHS Virtual Academy reserves the right to suspend or permanently terminate student accounts that repeatedly violate community rules, engage in harassment or abusive behavior, attempt unauthorized access or security breaches, or submit fraudulent payment verification requests.
              </p>
            </div>

            {/* Section 10 */}
            <div id="disclaimer" className="glass-card p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] space-y-3.5 scroll-mt-28 ">
              <h2
                className="text-lg sm:text-xl font-black text-[var(--text)] font-dot tracking-tight"
                style={{ fontFamily: 'var(--font-dot)' }}
              >
                10. General Service Disclaimer
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Boardly is an independent educational practice platform and is not affiliated with, endorsed by, or partnered with any government testing agency or university board. Practice questions and AI derivations are provided for learning and self-study purposes.
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
                For questions regarding these Terms of Service or to report a violation, please contact our administrative desk:
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

export default TermsPage;

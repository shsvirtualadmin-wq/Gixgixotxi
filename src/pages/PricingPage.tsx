import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Check, X, Shield } from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { FREE_DAILY_TESTS, FREE_DAILY_TOKEN_LIMIT, FREE_DAILY_ARENA_LIMIT } from '@/constants/limits';

const COMPARISON_ROWS = [
  { feature: 'Daily Practice Tests & Sprints', free: `${FREE_DAILY_TESTS} / day`, pro: 'Unlimited' },
  { feature: 'Sharing Study Material in Commons', free: 'Free & Unlimited', pro: 'Free & Unlimited' },
  { feature: 'Boardy AI Concept Explanations', free: `${FREE_DAILY_TOKEN_LIMIT} / day`, pro: 'Unlimited' },
  { feature: 'Public Grand Line Tests', free: `${FREE_DAILY_ARENA_LIMIT} / day`, pro: 'Unlimited' },
  { feature: 'KaTeX Formula Step Derivations', free: true, pro: true },
  { feature: 'Study Crew Squad Membership (up to 30)', free: true, pro: true },
  { feature: 'Complete Subject Question Bank Access', free: 'Core Sets', pro: 'Full Access' },
  { feature: 'Weak Chapter Analytics & Mistake Tracking', free: 'Basic', pro: 'Comprehensive' },
  { feature: 'PKT Midnight Quota Refresh (Asia/Karachi)', free: true, pro: true },
  { feature: 'Priority Support via WhatsApp & Email', free: false, pro: true },
];

const PAYMENT_METHODS = [
  {
    name: 'JazzCash',
    desc: 'Instant wallet transfer via JazzCash mobile account.',
    icon: '📱',
  },
  {
    name: 'EasyPaisa',
    desc: 'Instant mobile account transfer via EasyPaisa app or agent.',
    icon: '🟢',
  },
  {
    name: 'SadaPay / NayaPay',
    desc: 'Zero-fee IBAN bank transfer from digital banking apps.',
    icon: '⚡',
  },
  {
    name: 'Bank Transfer (IBAN)',
    desc: 'Direct online bank transfer from any Pakistani banking portal.',
    icon: '🏦',
  },
];

export function PricingPage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="Pricing — Honest & Accessible for Every Student"
        description="Simple and fair pricing for every student: Free tier is enough to practice and learn, 199 PKR for unlimited use, and 50 PKR for 500 kobans to customize your profile."
      />

      <div className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <div className="section-chip section-chip-red">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
            <span>Accessible To Every Student</span>
          </div>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
          >
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            Education should never be a privilege. Our free tier is enough for students to practice and learn, with low-cost options for extras.
          </p>
        </div>

        {/* 3-Column Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Free Tier Card */}
          <div className="glass-card p-7 sm:p-8 flex flex-col justify-between rounded-[28px]">
            <div className="space-y-5">
              <span className="glass-pill px-3 py-1 text-xs font-semibold text-[var(--muted)]">Free</span>
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl sm:text-5xl font-bold text-[var(--text)] font-dot"
                    style={{ fontFamily: 'var(--font-dot)' }}
                  >
                    0 PKR
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-2">
                  The free tier is enough for students to practice and learn.
                </p>
              </div>

              <div className="border-t border-white/10 dark:border-white/10 pt-5 space-y-3">
                {[
                  'The free tier is enough to practice and learn',
                  'Sharing material in Commons is always free with no limit',
                  `${FREE_DAILY_TESTS} practice tests per day`,
                  `${FREE_DAILY_TOKEN_LIMIT} Boardy AI derivation tokens / day`,
                  'KaTeX mathematical derivations for all questions',
                  'Join or create Study Crews (up to 30 members)',
                  'PKT midnight quota reset (Asia/Karachi UTC+5)',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--muted)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <Link to="/signup" className="btn-secondary w-full" style={{ height: '52px' }}>
                Start Free
              </Link>
            </div>
          </div>

          {/* Unlimited Tier Card */}
          <div className="glass-card p-7 sm:p-8 flex flex-col justify-between rounded-[28px] relative border-[#D71921]/60 shadow-[0_20px_50px_rgba(215,25,33,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)]">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="glass-pill px-3 py-1 text-xs font-bold text-[#D71921] border-[#D71921]/40 bg-[#D71921]/15">
                  Unlimited
                </span>
                <span className="text-xs font-semibold text-[var(--red)] uppercase tracking-wider font-mono">
                  Full Access
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl sm:text-5xl font-bold text-[var(--text)] font-dot"
                    style={{ fontFamily: 'var(--font-dot)' }}
                  >
                    199 PKR
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-2">
                  199 PKR for unlimited use across the platform.
                </p>
              </div>

              <div className="border-t border-white/10 dark:border-white/10 pt-5 space-y-3">
                {[
                  '199 PKR for unlimited use',
                  'Unlimited practice tests & sprint drills',
                  'Unlimited Boardy AI step derivations',
                  'Complete subject question banks unlocked',
                  'Advanced weak chapter diagnostics & mistake curves',
                  'Unlimited Grand Line & public Arena tests',
                  'Priority support desk via WhatsApp & Email',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              {user ? (
                <Link to="/dashboard/plans" className="btn-primary w-full" style={{ height: '52px' }}>
                  Get Unlimited (199 PKR)
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    requireAuth(
                      'upgrade to the Unlimited plan (199 PKR)',
                      () => navigate('/dashboard/plans'),
                      '/dashboard/plans'
                    )
                  }
                  className="btn-primary w-full cursor-pointer"
                  style={{ height: '52px' }}
                >
                  Get Unlimited (199 PKR)
                </button>
              )}
            </div>
          </div>

          {/* Koban Pack Card */}
          <div className="glass-card p-7 sm:p-8 flex flex-col justify-between rounded-[28px] relative border-amber-500/35 shadow-[0_20px_50px_rgba(232,163,23,0.12),inset_0_1px_1px_rgba(255,255,255,0.14)]">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="glass-pill px-3 py-1 text-xs font-semibold text-[var(--muted)]">Koban Pack</span>
                <div className="flex items-center gap-1 text-xs text-[#E8A317] font-semibold">
                  <KobanIcon size={14} />
                  <span>500 Kobans</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl sm:text-5xl font-bold text-[var(--text)] font-dot"
                    style={{ fontFamily: 'var(--font-dot)' }}
                  >
                    50 PKR
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-2">
                  50 PKR for 500 kobans. Kobans are used to customize your profile.
                </p>
              </div>

              <div className="border-t border-white/10 dark:border-white/10 pt-5 space-y-3">
                {[
                  '50 PKR for 500 kobans to personalize your student profile',
                  'Unlock dot-matrix avatar frames in the Store',
                  'Equip animated student nameplates',
                  'Collect rising profile card aura effects',
                  '100% aesthetic with zero unfair academic advantage',
                  'Purchased Kobans never expire in your student wallet',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--muted)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8A317] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <Link to="/store" className="btn-secondary w-full" style={{ height: '52px' }}>
                Explore Store &amp; Kobans
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-6 max-w-[880px] mx-auto">
          <div className="section-header text-center">
            <div className="section-chip">Direct Comparison</div>
            <h2 className="font-dot">Plan Capabilities Matrix</h2>
          </div>

          <div className="glass-panel rounded-[28px] overflow-hidden p-2 sm:p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    <th className="p-4 sm:p-5 font-bold text-[var(--text)]">Feature</th>
                    <th className="p-4 sm:p-5 font-bold text-[var(--muted)] text-center">Free Starter</th>
                    <th className="p-4 sm:p-5 font-bold text-[var(--red)] text-center font-dot">
                      Unlimited (199 PKR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-4 sm:p-5 text-[var(--text)] font-medium">{row.feature}</td>
                      <td className="p-4 sm:p-5 text-center text-[var(--muted)]">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check size={18} className="text-[var(--text)] mx-auto" />
                          ) : (
                            <X size={18} className="text-[var(--muted)] mx-auto opacity-30" />
                          )
                        ) : (
                          row.free
                        )}
                      </td>
                      <td className="p-4 sm:p-5 text-center text-[var(--text)] font-semibold">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check size={18} className="text-[var(--red)] mx-auto" />
                          ) : (
                            <X size={18} className="text-[var(--muted)] mx-auto opacity-30" />
                          )
                        ) : (
                          row.pro
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Payment Methods & Verification Flow ── */}
        <div className="space-y-8 max-w-[880px] mx-auto">
          <div className="section-header text-center">
            <div className="section-chip">Local Payment Support</div>
            <h2 className="font-dot">How Payment &amp; Activation Works</h2>
            <p>
              Designed for Pakistani students without credit cards. Transparent, manual verification with zero recurring auto-debits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAYMENT_METHODS.map((pm) => (
              <div key={pm.name} className="glass-card p-5 flex flex-col justify-between rounded-[22px]">
                <div>
                  <div className="text-2xl mb-2">{pm.icon}</div>
                  <h3
                    className="text-base font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {pm.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">{pm.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Step Box */}
          <div className="glass-card p-6 sm:p-8 space-y-4 rounded-[28px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 text-[var(--red)] flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  3-Step Payment Approval Flow
                </h3>
                <p className="text-xs sm:text-sm text-[var(--muted)]">
                  Guaranteed safe verification by our administrative desk.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl glass-row text-xs space-y-2">
                <span className="font-bold text-[var(--red)]">1. Transfer PKR 199</span>
                <p className="text-[var(--muted)]">
                  Send PKR 199 via JazzCash, EasyPaisa, SadaPay, or local bank transfer to the account details provided on your dashboard.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-row text-xs space-y-2">
                <span className="font-bold text-[var(--red)]">2. Submit Transaction Proof</span>
                <p className="text-[var(--muted)]">
                  Enter your Transaction ID (TRX) and attach your payment screenshot on the Plans &amp; Billing page. Your request is logged as &ldquo;pending&rdquo;.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-row text-xs space-y-2">
                <span className="font-bold text-[var(--red)]">3. Admin Approval &amp; Unlock</span>
                <p className="text-[var(--muted)]">
                  An administrator verifies the slip against bank ledger entries and approves your request, immediately unlocking full Unlimited access.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 sm:p-12 rounded-[32px] glass-panel text-center space-y-6 max-w-3xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--text)] font-dot"
            style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
          >
            Have a question about plans or billing?
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-lg mx-auto">
            Our student desk is available on WhatsApp at <strong className="text-[var(--text)]">0305 8969050</strong> or via email at <strong className="text-[var(--text)]">support@boardly.cfd</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="btn-primary" style={{ height: '52px' }}>
              Contact Student Support
            </Link>
            <a
              href="https://wa.me/923058969050"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ height: '52px' }}
            >
              WhatsApp Us (0305 8969050)
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default PricingPage;

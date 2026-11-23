import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { PageMeta } from '@/components/ui/PageMeta';
import { Check, X, Shield } from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { GuestProBlockedView } from '@/components/plans/GuestProBlockedView';
import { ProLockedStateCard } from '@/components/plans/ProLockedStateCard';
import { FREE_DAILY_TESTS, FREE_DAILY_ARENA_LIMIT } from '@/constants/limits';
import { PAYMENT_METHODS as OFFICIAL_PAYMENT_METHODS } from '@/constants/branding';
import { buildPlansCatalog, REFUND_POLICY_TEXT } from '@/config/plans';
import { usePlansConfig } from '@/hooks/usePlansConfig';

function getComparisonRows(freeAi: number, proAi: number, plusAi: number) {
  return [
    { feature: 'Daily Practice Tests & Sprints', free: `${FREE_DAILY_TESTS} / day`, pro: 'Unlimited', plus: 'Unlimited' },
    { feature: 'Sharing Study Material in Commons', free: 'Free & Unlimited', pro: 'Free & Unlimited', plus: 'Free & Unlimited' },
    { feature: 'AI Mentor Credits / Day', free: `${freeAi} / day`, pro: `${proAi} / day`, plus: `${plusAi} / day (2x Pro)` },
    { feature: 'AI Thinking Depths', free: 'Quick & Balanced', pro: 'Quick, Balanced, Deep & Max', plus: 'Quick, Balanced, Deep & Max' },
    { feature: 'Public Grand Line Tests', free: `${FREE_DAILY_ARENA_LIMIT} / day`, pro: 'Unlimited', plus: 'Unlimited' },
    { feature: 'KaTeX Formula Step Derivations', free: true, pro: true, plus: true },
    { feature: 'Study Crew Squad Membership (up to 30)', free: true, pro: true, plus: true },
    { feature: 'Complete Subject Question Bank Access', free: 'Core Sets', pro: 'Full Access', plus: 'Full Access' },
    { feature: 'Weak Chapter Analytics & Mistake Tracking', free: 'Basic', pro: 'Comprehensive', plus: 'Comprehensive' },
    { feature: 'Profile Badge', free: false, pro: 'Pro badge', plus: 'PLUS badge (50 designs)' },
    { feature: 'Ad-free experience', free: false, pro: true, plus: true },
  ];
}

const PAYMENT_METHODS = [
  {
    name: OFFICIAL_PAYMENT_METHODS.jazzcash.displayName,
    desc: `Instant wallet transfer via ${OFFICIAL_PAYMENT_METHODS.jazzcash.displayName} mobile account (${OFFICIAL_PAYMENT_METHODS.jazzcash.number}).`,
    icon: '📱',
  },
  {
    name: OFFICIAL_PAYMENT_METHODS.opay.displayName,
    desc: `Instant mobile account transfer via ${OFFICIAL_PAYMENT_METHODS.opay.displayName} app (${OFFICIAL_PAYMENT_METHODS.opay.number}).`,
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
  const { user, isGuest } = useAuth();
  const { requireAuth } = useAuthGate();
  const { planStatus, refreshPlanStatus } = useEffectivePlan();
  const { config: plansConfig } = usePlansConfig();
  const catalog = buildPlansCatalog(plansConfig);
  const comparisonRows = getComparisonRows(
    plansConfig.free.aiCreditsPerDay,
    plansConfig.pro.aiCreditsPerDay,
    plansConfig.plus.aiCreditsPerDay
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid || isGuest) return;
    refreshPlanStatus().catch(() => {});
    const onFocus = () => {
      refreshPlanStatus().catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('boardly:plan-refresh', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('boardly:plan-refresh', onFocus);
    };
  }, [user?.uid, isGuest, refreshPlanStatus]);

  if (isGuest) {
    return <GuestProBlockedView variant="page" />;
  }

  const isPurchaseLocked = Boolean(
    user && (planStatus.state === 'pending' || planStatus.isPersonalPlus)
  );

  return (
    <>
      <PageMeta
        title="Pricing — Honest & Accessible for Every Student"
        description="Simple and fair pricing for every student: Free tier is enough to practice and learn, 199 PKR for unlimited use, and 50 PKR for 500 kobans to customize your profile."
      />

      <div data-student-page="pricing" className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12 sm:space-y-16">
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

        {/* Locked state when Active or Pending vs 3-Column Pricing Cards */}
        {isPurchaseLocked ? (
          <div className="max-w-4xl mx-auto">
            <ProLockedStateCard planStatus={planStatus} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto items-stretch">
            {/* Free Tier Card */}
            <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[28px]">
              <div className="space-y-5">
                <span className="glass-pill px-3 py-1 text-xs font-semibold text-[var(--muted)]">Free</span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl sm:text-4xl font-bold text-[var(--text)] font-dot"
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
                    'Sharing material in Commons is always free with no limit',
                    `${FREE_DAILY_TESTS} practice tests per day`,
                    `${plansConfig.free.aiCreditsPerDay} AI Mentor credits / day (Quick & Balanced)`,
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
                <Link to={user ? '/dashboard' : '/signup'} className="btn-secondary w-full" style={{ height: '50px' }}>
                  {user ? 'Current Free Tier' : 'Start Free'}
                </Link>
              </div>
            </div>

            {/* Boardly Pro Tier Card */}
            <div className="glass-card-highlight p-6 sm:p-7 flex flex-col justify-between rounded-[28px] relative">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="glass-pill px-3 py-1 text-xs font-bold text-[#D71921] border-[#D71921]/40 bg-[#D71921]/15">
                    Boardly Pro
                  </span>
                  <span className="text-xs font-semibold text-[var(--red)] uppercase tracking-wider font-mono">
                    Popular
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl sm:text-4xl font-bold text-[var(--text)] font-dot"
                      style={{ fontFamily: 'var(--font-dot)' }}
                    >
                      PKR {catalog.pro_monthly.price_pkr.toLocaleString()}
                    </span>
                    <span className="text-xs text-[var(--muted)] font-medium">/ mo</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--muted)] mt-2">
                    {catalog.pro_monthly.price_kobans.toLocaleString()} Kobans/mo, or PKR {catalog.pro_annual.price_pkr.toLocaleString()}/yr (Save {plansConfig.annualDiscountPercent}%).
                  </p>
                </div>

                <div className="border-t border-white/10 dark:border-white/10 pt-5 space-y-3">
                  {[
                    'Unlimited practice tests & sprint drills',
                    `${plansConfig.pro.aiCreditsPerDay} AI Mentor credits / day`,
                    'Deep & Max AI thinking unlocked',
                    'Complete subject question banks unlocked',
                    'Advanced weak chapter diagnostics & mistake curves',
                    'Pro badge',
                    'Ad-free experience',
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
                  <Link to="/dashboard/plan" className="btn-primary w-full" style={{ height: '50px' }}>
                    {planStatus.isPersonalPro ? 'Current Pro Plan' : `Get Pro (PKR ${catalog.pro_monthly.price_pkr})`}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      requireAuth(
                        `upgrade to Boardly Pro (PKR ${catalog.pro_monthly.price_pkr})`,
                        () => navigate('/dashboard/plan'),
                        '/dashboard/plan'
                      )
                    }
                    className="btn-primary w-full cursor-pointer"
                    style={{ height: '50px' }}
                  >
                    Get Pro (PKR {catalog.pro_monthly.price_pkr})
                  </button>
                )}
              </div>
            </div>

            {/* Boardly Plus Tier Card */}
            <div className="glass-card-gold p-6 sm:p-7 flex flex-col justify-between rounded-[28px] relative border border-amber-500/40">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="glass-pill px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-300 border-amber-500/40 bg-amber-500/15">
                    Boardly Plus
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wider font-mono">
                    Best value
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl sm:text-4xl font-bold text-[var(--text)] font-dot"
                      style={{ fontFamily: 'var(--font-dot)' }}
                    >
                      PKR {catalog.plus_monthly.price_pkr.toLocaleString()}
                    </span>
                    <span className="text-xs text-[var(--muted)] font-medium">/ mo</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--muted)] mt-2">
                    {catalog.plus_monthly.price_kobans.toLocaleString()} Kobans/mo, or PKR {catalog.plus_annual.price_pkr.toLocaleString()}/yr (Save {plansConfig.annualDiscountPercent}%).
                  </p>
                </div>

                <div className="border-t border-white/10 dark:border-white/10 pt-5 space-y-3">
                  {[
                    'Everything in Boardly Pro',
                    `${plansConfig.plus.aiCreditsPerDay} AI Mentor credits per day (2x Pro)`,
                    'Deep & Max AI thinking unlocked',
                    'PLUS badge: choose from 50 unique animated designs and show it everywhere',
                    'Unused Pro days credited automatically on upgrade',
                    'Share Plus benefits with your Nakama Crew',
                    'Ad-free experience',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                {user ? (
                  <Link to="/dashboard/plan" className="btn-primary w-full" style={{ height: '50px' }}>
                    {planStatus.isPersonalPro ? 'Upgrade to Plus' : `Get Plus (PKR ${catalog.plus_monthly.price_pkr})`}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      requireAuth(
                        `upgrade to Boardly Plus (PKR ${catalog.plus_monthly.price_pkr})`,
                        () => navigate('/dashboard/plan'),
                        '/dashboard/plan'
                      )
                    }
                    className="btn-primary w-full cursor-pointer"
                    style={{ height: '50px' }}
                  >
                    Get Plus (PKR {catalog.plus_monthly.price_pkr})
                  </button>
                )}
              </div>
            </div>

            {/* Koban Pack Card */}
            <div className="glass-card p-6 sm:p-7 flex flex-col justify-between rounded-[28px] relative">
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
                      className="text-3xl sm:text-4xl font-bold text-[var(--text)] font-dot"
                      style={{ fontFamily: 'var(--font-dot)' }}
                    >
                      50 PKR
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--muted)] mt-2">
                    Use Kobans for profile cosmetics or instant Pro &amp; Plus activation.
                  </p>
                </div>

                <div className="border-t border-white/10 dark:border-white/10 pt-5 space-y-3">
                  {[
                    '50 PKR for 500 kobans (10 Kobans = PKR 1)',
                    'Redeem Kobans for Boardly Pro or Boardly Plus',
                    'Unlock dot-matrix avatar frames in the Store',
                    'Equip animated student nameplates & aura effects',
                    'Purchased Kobans never expire in your wallet',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-xs sm:text-sm text-[var(--muted)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8A317] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link to="/store" className="btn-secondary w-full" style={{ height: '50px' }}>
                  Explore Store &amp; Kobans
                </Link>
              </div>
            </div>
          </div>
        )}

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
                    <th className="p-4 sm:p-5 font-bold text-[var(--muted)] text-center">Free</th>
                    <th className="p-4 sm:p-5 font-bold text-[var(--red)] text-center font-dot">
                      Pro (PKR {catalog.pro_monthly.price_pkr})
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-amber-500 text-center font-dot">
                      Plus (PKR {catalog.plus_monthly.price_pkr})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {comparisonRows.map((row) => (
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
                      <td className="p-4 sm:p-5 text-center text-amber-600 dark:text-amber-300 font-semibold">
                        {typeof row.plus === 'boolean' ? (
                          row.plus ? (
                            <Check size={18} className="text-amber-500 mx-auto" />
                          ) : (
                            <X size={18} className="text-[var(--muted)] mx-auto opacity-30" />
                          )
                        ) : (
                          row.plus
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
              <div className="icon-tile w-10 h-10 rounded-full text-[var(--red)] flex items-center justify-center shrink-0">
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
                <span className="font-bold text-[var(--red)]">1. Transfer Plan Amount</span>
                <p className="text-[var(--muted)]">
                  Send PKR {catalog.pro_monthly.price_pkr} (Pro) or PKR {catalog.plus_monthly.price_pkr} (Plus) monthly — or annual passes — via {OFFICIAL_PAYMENT_METHODS.jazzcash.displayName} or {OFFICIAL_PAYMENT_METHODS.opay.displayName}, or redeem your Kobans balance.
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-row text-xs space-y-2">
                <span className="font-bold text-[var(--red)]">2. Submit Transaction Proof</span>
                <p className="text-[var(--muted)]">
                  Enter your Transaction ID (TID) and payment proof on the Plans &amp; Billing page. {REFUND_POLICY_TEXT}
                </p>
              </div>

              <div className="p-4 rounded-2xl glass-row text-xs space-y-2">
                <span className="font-bold text-[var(--red)]">3. Manual Verification (Within 24 Hours)</span>
                <p className="text-[var(--muted)]">
                  Payments are verified manually by our team, and your plan is activated within 24 hours of submission.
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
            Our student desk is available on WhatsApp at <strong className="text-[var(--text)]">0305 8969050</strong> or via email at <strong className="text-[var(--text)]">shsvirtualadmin@gmail.com</strong>.
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

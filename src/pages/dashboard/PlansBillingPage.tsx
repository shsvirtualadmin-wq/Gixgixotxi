import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Users,
  ShieldCheck,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useWallet } from '@/hooks/useWallet';
import {
  PLANS,
  REFUND_POLICY_TEXT,
  ANNUAL_SAVINGS_PERCENT,
  PLAN_COMPARISON_ROWS,
  getProStatusSummary,
  type ProPlanId,
} from '@/config/plans';
import { StatusBanner } from '@/components/plans/StatusBanner';
import { PlanCard } from '@/components/plans/PlanCard';
import { ProCheckoutSheet } from '@/components/plans/ProCheckoutSheet';
import { GetKobansModal } from '@/components/koban/GetKobansModal';
import { fetchStudentProRequests } from '@/services/proSubscriptionService';
import type { PaymentRequest } from '@/types';

export function PlansBillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { plan: currentPlan, isPro, source } = useEffectivePlan();
  const isCrew = source === 'crew';
  const { balance } = useWallet();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<ProPlanId>('pro_monthly');
  const [proCardCycle, setProCardCycle] = useState<ProPlanId>('pro_monthly');

  // Get Kobans modal (only opened when student clicks "Get Kobans" inside ProCheckoutSheet due to low balance)
  const [getKobansOpen, setGetKobansOpen] = useState(false);
  const [getKobansInitialAmount, setGetKobansInitialAmount] = useState<number | undefined>(
    undefined
  );

  const [studentProRequests, setStudentProRequests] = useState<PaymentRequest[]>([]);

  const loadProRequests = useCallback(async () => {
    if (!user?.uid) return;
    const list = await fetchStudentProRequests(user.uid);
    setStudentProRequests(list);
  }, [user?.uid]);

  useEffect(() => {
    loadProRequests();
  }, [loadProRequests]);

  const rawExpiresAt = profile?.planExpiresAt ?? (profile as any)?.premiumExpiresAt ?? null;
  const proSummary = getProStatusSummary(rawExpiresAt);
  const effectiveIsPro = isPro || proSummary.isActive;

  const pendingProRequest =
    studentProRequests.find(
      (r) => r.status === 'pending' && r.plan !== 'large_crew'
    ) || null;
  const latestRejectedProRequest =
    studentProRequests.find(
      (r) => r.status === 'rejected' && r.plan !== 'large_crew'
    ) || null;

  const openProCheckout = (plan: ProPlanId) => {
    setSelectedCheckoutPlan(plan);
    setCheckoutOpen(true);
  };

  const activeProOption = PLANS[proCardCycle];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-28 sm:pb-24 space-y-6">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--red)] font-semibold">
          Account Subscription
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[var(--text)] tracking-tight">
          Plans &amp; Billing
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
          Upgrade your practice capacity with Boardly Pro or team up with classmates in a Nakama
          Crew. {REFUND_POLICY_TEXT}
        </p>
      </div>

      {/* ─── ACTIVE PLAN STATUS BANNER (Uniform 1px border, no left-edge curve artifact) ─── */}
      <StatusBanner
        planId={effectiveIsPro ? 'pro' : isCrew ? 'crew' : 'free'}
        planExpiresAtRaw={rawExpiresAt}
        pendingProRequest={pendingProRequest}
        latestRejectedProRequest={latestRejectedProRequest}
        onUpgradeOrExtend={() => openProCheckout('pro_monthly')}
      />

      {/* ─── COMPACT 3-COLUMN COMPARISON SUMMARY (Free vs Pro vs Crew) ──────── */}
      <div className="rounded-[22px] bg-[var(--card)] border border-[var(--border)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--border)] flex items-center justify-between gap-2 bg-[var(--surface-2)]/60">
          <span className="font-heading font-bold text-xs sm:text-sm text-[var(--text)]">
            Quick Plan Comparison
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Key Limits &amp; Perks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                <th className="py-2.5 px-3.5 sm:px-5 font-semibold">Feature</th>
                <th className="py-2.5 px-2.5 sm:px-4 font-semibold text-center">Free</th>
                <th className="py-2.5 px-2.5 sm:px-4 font-bold text-center text-[var(--red)] bg-[var(--red)]/[0.05]">
                  Pro
                </th>
                <th className="py-2.5 px-2.5 sm:px-4 font-semibold text-center">Crew</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {PLAN_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                  <td className="py-2.5 px-3.5 sm:px-5 font-medium text-[var(--text)]">
                    {row.feature}
                  </td>
                  <td className="py-2.5 px-2.5 sm:px-4 text-center font-mono text-[11px] text-[var(--muted)]">
                    {row.free}
                  </td>
                  <td className="py-2.5 px-2.5 sm:px-4 text-center font-mono text-[11px] font-bold text-[var(--text)] bg-[var(--red)]/[0.05]">
                    {row.pro}
                  </td>
                  <td className="py-2.5 px-2.5 sm:px-4 text-center font-mono text-[11px] text-[var(--muted)]">
                    {row.crew}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── THREE CONSISTENT PLAN CARDS (Free, Boardly Pro, Nakama Crew) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {/* 1. Free Tier Card */}
        <PlanCard
          title={PLANS.free.name}
          subtitle={PLANS.free.shortName}
          icon={<BookOpen size={17} />}
          pricePkr={PLANS.free.price_pkr}
          cadenceLabel={PLANS.free.cadenceLabel}
          priceSubtext={PLANS.free.description}
          features={PLANS.free.features}
          featured={false}
          ctaLabel={currentPlan === 'free' && !effectiveIsPro ? 'Current Plan' : 'Included Base Tier'}
          ctaVariant="disabled-current"
        />

        {/* 2. Boardly Pro Card (Only card with red border & subtle red glow; POPULAR badge inside top-right) */}
        <PlanCard
          title="Boardly Pro"
          subtitle={
            proCardCycle === 'pro_annual'
              ? `Annual Pass · Save ${ANNUAL_SAVINGS_PERCENT}%`
              : 'Monthly Pass · Full Access'
          }
          durationBadge={`${activeProOption.duration_days} Days`}
          topRightBadge="POPULAR"
          topRightBadgeTone="pro"
          icon={<Zap size={17} />}
          pricePkr={activeProOption.price_pkr}
          cadenceLabel={activeProOption.cadenceLabel}
          priceKobans={activeProOption.price_kobans}
          regularPricePkr={activeProOption.regular_price_pkr}
          priceSubtext={activeProOption.description}
          features={activeProOption.features}
          featured={true}
          ctaLabel={
            effectiveIsPro
              ? `Extend Pro — PKR ${activeProOption.price_pkr.toLocaleString()}`
              : proCardCycle === 'pro_annual'
              ? `Get Annual Pass, PKR ${PLANS.pro_annual.price_pkr.toLocaleString()}`
              : `Upgrade to Pro, PKR ${PLANS.pro_monthly.price_pkr}/mo`
          }
          ctaIcon={<Zap size={15} />}
          ctaVariant="primary-red"
          onCtaClick={() => openProCheckout(proCardCycle)}
          footerSlot={
            <div className="pt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setProCardCycle((prev) =>
                    prev === 'pro_monthly' ? 'pro_annual' : 'pro_monthly'
                  )
                }
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)]/40 border border-[var(--border)] text-xs font-heading font-semibold text-[var(--text)] flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#E8342A]" />
                  <span>
                    {proCardCycle === 'pro_monthly'
                      ? `Switch to Annual (PKR ${PLANS.pro_annual.price_pkr.toLocaleString()}/yr)`
                      : `Switch to Monthly (PKR ${PLANS.pro_monthly.price_pkr}/mo)`}
                  </span>
                </span>
                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#E8342A]/15 text-[#E8342A]">
                  Save {ANNUAL_SAVINGS_PERCENT}%
                </span>
              </button>
            </div>
          }
        />

        {/* 3. Nakama Crew Card */}
        <PlanCard
          title={PLANS.crew.name}
          subtitle={PLANS.crew.shortName}
          icon={<Users size={17} />}
          pricePkr={PLANS.crew.price_pkr}
          cadenceLabel={PLANS.crew.cadenceLabel}
          priceSubtext={PLANS.crew.description}
          features={PLANS.crew.features}
          featured={false}
          ctaLabel={isCrew ? 'Manage Your Crew' : 'Join or Create Crew'}
          ctaIcon={<Users size={15} />}
          ctaVariant="outlined"
          onCtaClick={() => navigate('/dashboard/crew')}
        />
      </div>

      {/* ─── REFUND POLICY & PAYMENT NOTE FOOTER ────────────────────────────── */}
      <div className="rounded-[20px] bg-[var(--card)] border border-[var(--border)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
          <span>
            <strong className="text-[var(--text)]">Terms:</strong> {REFUND_POLICY_TEXT} Instant
            activation when paying with Kobans, or within 2 hours via JazzCash / Opay.
          </span>
        </div>
        <button
          type="button"
          onClick={() => openProCheckout('pro_annual')}
          className="font-heading font-bold text-xs text-[var(--red)] hover:underline shrink-0 text-left sm:text-right cursor-pointer"
        >
          View Annual Pass (Save {ANNUAL_SAVINGS_PERCENT}%) →
        </button>
      </div>

      {/* ─── DEDICATED PRO CHECKOUT SHEET ───────────────────────────────────── */}
      <ProCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        initialPlanId={selectedCheckoutPlan}
        uid={user?.uid}
        userEmail={user?.email || profile?.email}
        userName={profile?.displayName || profile?.name || user?.displayName}
        kobanBalance={balance}
        currentProExpiresAt={rawExpiresAt}
        hasPendingProRequest={Boolean(pendingProRequest)}
        onOpenGetKobans={(needed) => {
          setCheckoutOpen(false);
          setGetKobansInitialAmount(needed);
          setGetKobansOpen(true);
        }}
        onSuccess={() => {
          loadProRequests();
        }}
        onStartPracticing={() => navigate('/practice')}
      />

      {/* ─── GET KOBANS MODAL (Only triggered when user clicks "Get Kobans" on low balance) ─── */}
      <GetKobansModal
        isOpen={getKobansOpen}
        onClose={() => {
          setGetKobansOpen(false);
          setGetKobansInitialAmount(undefined);
        }}
        initialAmount={getKobansInitialAmount}
      />
    </div>
  );
}

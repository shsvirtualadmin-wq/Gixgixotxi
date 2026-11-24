import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Palette,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import { useWallet } from '@/hooks/useWallet';
import { useAiCredits } from '@/hooks/useAiCredits';
import {
  REFUND_POLICY_TEXT,
  buildPlansCatalog,
  buildPlanComparisonRows,
  calculatePlanExpiryPkt,
  evaluatePlanPurchaseEligibility,
  type ProPlanId,
} from '@/config/plans';
import { ProCheckoutSheet } from '@/components/plans/ProCheckoutSheet';
import { GuestProBlockedView } from '@/components/plans/GuestProBlockedView';
import { GetKobansModal } from '@/components/koban/GetKobansModal';
import { fetchStudentProRequests } from '@/services/proSubscriptionService';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { PageMeta } from '@/components/ui/PageMeta';
import { getDisplayName } from '@/utils/displayName';
import {
  measureRequest,
  readSwrCache,
  writeSwrCache,
} from '@/utils/userStateSource';
import type { PaymentRequest } from '@/types';

export function PlansBillingPage() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUserProfile();
  const { config: plansConfig } = usePlansConfig();
  const {
    plan: currentPlan,
    source,
    planStatus,
    paymentRequests: streamedPaymentRequests,
    refreshPlanStatus,
  } = useEffectivePlan();
  const isCrew = source === 'crew';
  const { kobanBalance, balanceLoaded, refreshWallet } = useWallet();
  const aiCredits = useAiCredits();

  const catalog = useMemo(() => buildPlansCatalog(plansConfig), [plansConfig]);
  const comparisonRows = useMemo(() => buildPlanComparisonRows(plansConfig), [plansConfig]);
  const discountPercent = plansConfig.annualDiscountPercent;

  useEffect(() => {
    if (location.hash === '#boardly-pro-card' || location.hash === '#boardly-plus-card') {
      const targetId = location.hash.slice(1);
      const timer = window.setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [location.hash]);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<ProPlanId>('pro_monthly');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const [getKobansOpen, setGetKobansOpen] = useState(false);
  const [getKobansInitialAmount, setGetKobansInitialAmount] = useState<number | undefined>(
    undefined
  );

  const cacheKey = user?.uid ? `plans:requests:${user.uid}` : '';
  const [studentProRequests, setStudentProRequests] = useState<PaymentRequest[]>(
    () => (cacheKey ? readSwrCache<PaymentRequest[]>(cacheKey) : null) || []
  );
  const [requestsError, setRequestsError] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(streamedPaymentRequests) && streamedPaymentRequests.length > 0) {
      setStudentProRequests(streamedPaymentRequests);
      if (cacheKey) writeSwrCache(cacheKey, streamedPaymentRequests);
    }
  }, [streamedPaymentRequests, cacheKey]);

  const loadProRequests = useCallback(async () => {
    if (!user?.uid || isGuest) return;
    setRequestsError(null);
    try {
      const [, list] = await measureRequest(
        'plans:status-and-requests',
        () => Promise.all([refreshPlanStatus(), fetchStudentProRequests(user.uid)]),
        8000
      );
      setStudentProRequests(list);
      writeSwrCache(`plans:requests:${user.uid}`, list);
    } catch (err: any) {
      setRequestsError(err?.message || 'Could not refresh subscription status.');
    }
  }, [user?.uid, isGuest, refreshPlanStatus]);

  useEffect(() => {
    if (!user?.uid || isGuest) return;
    void loadProRequests();
    const onFocusOrRefresh = () => {
      void loadProRequests();
    };
    window.addEventListener('focus', onFocusOrRefresh);
    window.addEventListener('boardly:plan-refresh', onFocusOrRefresh);
    return () => {
      window.removeEventListener('focus', onFocusOrRefresh);
      window.removeEventListener('boardly:plan-refresh', onFocusOrRefresh);
    };
  }, [user?.uid, isGuest, loadProRequests]);

  const rawExpiresAt =
    (profile as any)?.plusUntil ??
    profile?.planExpiresAt ??
    (profile as any)?.premiumExpiresAt ??
    (profile as any)?.proUntil ??
    null;

  const isPendingVerification = planStatus.state === 'pending';
  const isPersonalPlus = planStatus.isPersonalPlus || planStatus.isSuperAdmin;
  const isPersonalProOnly = planStatus.isPersonalPro && !isPersonalPlus;

  const pendingProRequest = useMemo(
    () =>
      studentProRequests.find((r) => r.status === 'pending' && r.plan !== 'large_crew') || null,
    [studentProRequests]
  );

  const latestRejectedProRequest = useMemo(
    () =>
      studentProRequests.find((r) => r.status === 'rejected' && r.plan !== 'large_crew') || null,
    [studentProRequests]
  );

  const activeProPlanId: ProPlanId = billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';
  const activePlusPlanId: ProPlanId = billingCycle === 'annual' ? 'plus_annual' : 'plus_monthly';
  const activeProOption = catalog[activeProPlanId];
  const activePlusOption = catalog[activePlusPlanId];

  const proEligibility = useMemo(
    () => evaluatePlanPurchaseEligibility(planStatus, activeProPlanId, plansConfig),
    [planStatus, activeProPlanId, plansConfig]
  );
  const plusEligibility = useMemo(
    () => evaluatePlanPurchaseEligibility(planStatus, activePlusPlanId, plansConfig),
    [planStatus, activePlusPlanId, plansConfig]
  );

  const currentPersonalTier = planStatus.isPersonalPlus
    ? 'plus'
    : planStatus.isPersonalPro
      ? 'pro'
      : 'free';

  const activeProExpiryPreview = useMemo(
    () =>
      calculatePlanExpiryPkt({
        currentTier: currentPersonalTier,
        targetTier: 'pro',
        currentExpiryRaw: planStatus.expiryMs ?? rawExpiresAt,
        purchasedDays: activeProOption.duration_days,
      }),
    [currentPersonalTier, planStatus.expiryMs, rawExpiresAt, activeProOption.duration_days]
  );

  const activePlusExpiryPreview = useMemo(
    () =>
      calculatePlanExpiryPkt({
        currentTier: currentPersonalTier,
        targetTier: 'plus',
        currentExpiryRaw: planStatus.expiryMs ?? rawExpiresAt,
        purchasedDays: activePlusOption.duration_days,
      }),
    [currentPersonalTier, planStatus.expiryMs, rawExpiresAt, activePlusOption.duration_days]
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/settings');
    }
  };

  if (isGuest) {
    return (
      <SettingsPage title="Plans and billing" onBack={handleBack}>
        <PageMeta title="Plans and billing — Boardly" />
        <GuestProBlockedView variant="page" />
      </SettingsPage>
    );
  }

  const openCheckout = (planId: ProPlanId) => {
    const check = evaluatePlanPurchaseEligibility(planStatus, planId, plansConfig);
    if (!check.allowed) return;
    setSelectedCheckoutPlan(planId);
    setCheckoutOpen(true);
  };

  const scrollToPlusCard = () => {
    document.getElementById('boardly-plus-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const displayName = getDisplayName(
    {
      display_name: profile?.display_name ?? profile?.displayName,
      realName: profile?.realName ?? profile?.name ?? user?.displayName,
      username: profile?.username,
    },
    ''
  );

  const aiPlanLabel = aiCredits.unlimited
    ? 'Superadmin'
    : aiCredits.plan === 'plus'
    ? 'Boardly Plus'
    : aiCredits.plan === 'pro'
    ? 'Boardly Pro'
    : 'Free';

  return (
    <SettingsPage title="Plans and billing" onBack={handleBack}>
      <PageMeta
        title="Plans and billing — Boardly"
        description="Manage your Boardly Pro and Boardly Plus subscription, Kobans balance, and study plans."
      />

      {/* Inline Retry Error Banner */}
      {requestsError && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between gap-3 rounded-[24px] px-5 py-4"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--danger-border)',
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" style={{ color: 'var(--danger)' }} />
            <p className="text-[14px] leading-snug" style={{ color: 'var(--text)' }}>
              {requestsError}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadProRequests()}
            className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* 1. YOUR PLAN */}
      {isPendingVerification ? (
        <SettingsGroup
          label="Your plan"
          helperText="Payments are verified manually and plans are activated within 24 hours. New purchases are locked while verification is pending."
        >
          <SettingsRow
            icon={<Clock />}
            label="Payment pending verification"
            subtitle={
              planStatus.pendingRequest
                ? `${planStatus.pendingRequest.planName} · PKR ${planStatus.pendingRequest.amountPkr.toLocaleString()}`
                : pendingProRequest
                ? `PKR ${Number(pendingProRequest.amount || 0).toLocaleString()} submitted`
                : 'Awaiting manual verification'
            }
            value="Pending"
            chevron="none"
          />
          {(planStatus.pendingRequest?.tid || pendingProRequest?.TID) && (
            <SettingsRow
              label="Transaction ID"
              value={planStatus.pendingRequest?.tid || pendingProRequest?.TID || ''}
              chevron="none"
            />
          )}
          {planStatus.pendingRequest?.submittedFormatted && (
            <SettingsRow
              label="Submitted"
              value={planStatus.pendingRequest.submittedFormatted}
              chevron="none"
            />
          )}
        </SettingsGroup>
      ) : (
        <section className="mb-6" data-testid="your-plan-card">
          <h2
            className="mb-2 pl-4 text-[14px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            Your plan
          </h2>
          <div
            className="rounded-[32px] p-5"
            style={{
              backgroundColor: 'var(--card)',
              border: isPersonalPlus
                ? '1.5px solid rgba(245, 158, 11, 0.55)'
                : isPersonalProOnly
                ? '1.5px solid color-mix(in srgb, var(--accent) 45%, transparent)'
                : '1px solid var(--border)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {isPersonalPlus ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  ) : isPersonalProOnly ? (
                    <Crown className="h-5 w-5 shrink-0" style={{ color: 'var(--accent)' }} />
                  ) : null}
                  <div className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                    {isPersonalPlus
                      ? planStatus.isSuperAdmin
                        ? 'Boardly Plus (Superadmin)'
                        : 'Boardly Plus'
                      : isPersonalProOnly
                      ? 'Boardly Pro'
                      : isCrew
                      ? planStatus.planName
                      : 'Free tier'}
                  </div>
                </div>
                <p className="mt-1 text-[14px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {isPersonalPlus
                    ? planStatus.isSuperAdmin
                      ? 'Unlimited Superadmin access · All Pro & Plus features unlocked'
                      : `Active until ${planStatus.expiryFormatted || 'Active'}${
                          planStatus.timeLeftLabel ? ` · ${planStatus.timeLeftLabel}` : ''
                        }`
                    : isPersonalProOnly
                    ? `Active until ${planStatus.expiryFormatted || 'Active'}${
                        planStatus.timeLeftLabel ? ` · ${planStatus.timeLeftLabel}` : ''
                      }`
                    : isCrew
                    ? `${
                        currentPlan === 'plus'
                          ? `${plansConfig.plus.aiCreditsPerDay} AI credits/day via crew`
                          : `${plansConfig.pro.aiCreditsPerDay} AI credits/day via crew`
                      }`
                    : `2 practice tests/day · ${plansConfig.free.aiCreditsPerDay} AI Mentor credits/day`}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={
                  isPersonalPlus
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(217, 119, 6, 0.16), rgba(245, 158, 11, 0.22))',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        color: 'var(--koban)',
                      }
                    : isPersonalProOnly
                    ? {
                        backgroundColor: 'var(--accent-soft)',
                        border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                        color: 'var(--accent)',
                      }
                    : {
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }
                }
              >
                {isPersonalPlus
                  ? 'Plus'
                  : isPersonalProOnly
                  ? 'Pro'
                  : isCrew
                  ? 'Crew'
                  : 'Current'}
              </span>
            </div>

            {latestRejectedProRequest && !isPersonalPlus && !isPersonalProOnly && (
              <div
                className="mt-3 rounded-2xl px-3.5 py-2.5 text-[13px]"
                style={{
                  backgroundColor: 'var(--tag-danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                }}
              >
                Your previous payment request (TID: {latestRejectedProRequest.TID || 'N/A'}) was
                not approved. You can submit a new payment below.
              </div>
            )}

            {/* Action row per plan tier */}
            {isPersonalPlus ? (
              <div
                className="mt-4 flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: 'var(--text)',
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>
                    {planStatus.isSuperAdmin
                      ? 'Active · Unlimited'
                      : `Active until ${planStatus.expiryFormatted || 'Active'}`}
                  </span>
                </span>
                <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Highest tier
                </span>
              </div>
            ) : isPersonalProOnly ? (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => openCheckout(activePlusPlanId)}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Upgrade to Plus</span>
                </button>
                <p className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  Starts a fresh Boardly Plus pass from today (replaces your active Pro pass)
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={() => openCheckout(activeProPlanId)}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Zap className="h-4 w-4" />
                  <span>Upgrade to Pro</span>
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={scrollToPlusCard}
                    className="text-[13px] font-semibold underline underline-offset-4 cursor-pointer"
                    style={{ color: 'var(--koban)' }}
                  >
                    See Plus ({plansConfig.plus.aiCreditsPerDay} AI credits/day)
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 1B. AI MENTOR CREDITS TODAY */}
      <section className="mb-6" data-testid="plans-ai-credits-card">
        <h2
          className="mb-2 pl-4 text-[14px] font-medium leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          AI Mentor credits today
        </h2>
        <div
          className="rounded-[32px] p-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles
                  className="h-4 w-4 shrink-0"
                  style={{ color: aiCredits.plan === 'plus' ? 'var(--koban)' : 'var(--accent)' }}
                />
                <span className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                  {aiCredits.unlimited
                    ? 'Unlimited credits'
                    : `${aiCredits.remaining} of ${aiCredits.limit} credits left`}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: aiCredits.plan === 'plus' ? 'var(--koban)' : 'var(--text-muted)',
                  }}
                >
                  {aiPlanLabel}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                {aiCredits.unlimited
                  ? 'Superadmin access · Quick, Balanced, Deep & Max unlocked'
                  : `Resets in ${aiCredits.resetCountdown} (PKT) · ${
                      aiCredits.plan === 'plus' || aiCredits.plan === 'pro'
                        ? 'Quick, Balanced, Deep & Max unlocked'
                        : 'Quick & Balanced unlocked'
                    }`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/ai')}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              Open AI
            </button>
          </div>
          <div
            className="mt-3.5 h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  aiCredits.unlimited
                    ? 100
                    : Math.max(
                        0,
                        Math.min(
                          100,
                          Math.round((aiCredits.remaining / Math.max(1, aiCredits.limit)) * 100)
                        )
                      )
                }%`,
                background:
                  aiCredits.plan === 'plus'
                    ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                    : 'var(--accent)',
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. KOBANS */}
      <SettingsGroup label="Kobans">
        <SettingsRow
          leadingElement={<KobanIcon size={24} decorative />}
          label="Kobans balance"
          subtitle="Use Kobans for instant Boardly Pro or Plus activation"
          chevron="none"
          rightElement={
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold tabular-nums"
              style={{
                backgroundColor: 'var(--koban-bg)',
                border: '1px solid var(--koban-border)',
                color: 'var(--koban)',
              }}
            >
              <KobanIcon size={15} decorative />
              {!balanceLoaded || kobanBalance === null ? (
                <span
                  className="inline-block h-3.5 w-12 animate-pulse rounded-full"
                  style={{ backgroundColor: 'var(--skeleton)' }}
                  aria-label="Loading Kobans balance"
                />
              ) : (
                <span>{kobanBalance.toLocaleString()}</span>
              )}
            </span>
          }
        />
        <SettingsRow
          icon={<Palette />}
          label="Customize Koban"
          onClick={() => navigate('/settings/koban-icon')}
        />
      </SettingsGroup>

      {/* 3. CHOOSE A PLAN */}
      {!isPendingVerification && (
        <section className="mb-6 space-y-4">
          <h2
            className="mb-2 pl-4 text-[14px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            Choose a plan
          </h2>

          {/* Monthly | Annual (-25%) segmented pill controlling BOTH Pro and Plus cards */}
          <div
            role="tablist"
            aria-label="Billing cycle"
            className="grid grid-cols-2 gap-1.5 rounded-full p-1.5"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={billingCycle === 'monthly'}
              onClick={() => setBillingCycle('monthly')}
              className="min-h-[44px] rounded-full px-4 text-[14px] font-semibold transition-colors cursor-pointer"
              style={
                billingCycle === 'monthly'
                  ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                  : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
              }
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billingCycle === 'annual'}
              onClick={() => setBillingCycle('annual')}
              className="min-h-[44px] rounded-full px-4 text-[14px] font-semibold transition-colors cursor-pointer"
              style={
                billingCycle === 'annual'
                  ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                  : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
              }
            >
              Annual (−{discountPercent}%)
            </button>
          </div>

          {/* Boardly Pro Card */}
          <div
            id="boardly-pro-card"
            data-testid="boardly-pro-card"
            className="rounded-[32px] p-5"
            style={{
              backgroundColor: 'var(--card)',
              border: '1.5px solid var(--accent)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  <h3 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                    Boardly Pro
                  </h3>
                </div>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {billingCycle === 'annual'
                    ? `Annual pass · ${activeProOption.duration_days} days · Save ${discountPercent}%`
                    : `Monthly pass · ${activeProOption.duration_days} days`}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                {billingCycle === 'annual' ? `Popular · Save ${discountPercent}%` : 'Popular'}
              </span>
            </div>

            {/* Pricing & Koban Equivalent */}
            <div
              className="mt-4 rounded-2xl p-4 space-y-2"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="text-[26px] font-bold tabular-nums"
                  style={{ color: 'var(--text)' }}
                >
                  PKR {activeProOption.price_pkr.toLocaleString()}
                </span>
                <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                  {activeProOption.cadenceLabel}
                </span>
                {activeProOption.regular_price_pkr && (
                  <span
                    className="text-[13px] line-through tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    PKR {activeProOption.regular_price_pkr.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span
                  className="inline-flex items-center gap-1.5 font-semibold"
                  style={{ color: 'var(--koban)' }}
                >
                  <KobanIcon size={15} decorative />
                  <span>{activeProOption.price_kobans.toLocaleString()} Kobans</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {activeProOption.duration_days} days · Active until{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {activeProExpiryPreview.newExpiryLabel}
                  </strong>
                </span>
              </div>
            </div>

            {/* Feature Check Rows */}
            <ul className="mt-4 space-y-2.5">
              {activeProOption.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: 'var(--text)' }}
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: 'var(--accent)' }}
                    strokeWidth={2.4}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isPersonalPlus ? (
              <div
                className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                <span>Included in Plus</span>
              </div>
            ) : isPersonalProOnly ? (
              <div
                className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Current plan</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={!proEligibility.allowed}
                onClick={() => openCheckout(activeProPlanId)}
                className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Zap className="h-4 w-4" />
                <span>
                  {billingCycle === 'annual'
                    ? `Upgrade to Pro · PKR ${activeProOption.price_pkr.toLocaleString()}/yr`
                    : `Upgrade to Pro · PKR ${activeProOption.price_pkr}/mo`}
                </span>
              </button>
            )}
          </div>

          {/* Boardly Plus Card — directly after Boardly Pro */}
          <div
            id="boardly-plus-card"
            data-testid="boardly-plus-card"
            className="rounded-[32px] p-5 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--card)',
              border: '1.5px solid rgba(245, 158, 11, 0.72)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            {/* Subtle amber/gold top accent glow readable in light and dark */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
              style={{
                background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
              }}
            />

            <div className="flex items-start justify-between gap-3 pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 60%, #FBBF24 100%)',
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                    Boardly Plus
                  </h3>
                </div>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {billingCycle === 'annual'
                    ? `Annual pass · ${activePlusOption.duration_days} days · Save ${discountPercent}%`
                    : `Monthly pass · ${activePlusOption.duration_days} days`}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(217, 119, 6, 0.16), rgba(245, 158, 11, 0.24))',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: 'var(--koban)',
                }}
              >
                {billingCycle === 'annual' ? `Best value · Save ${discountPercent}%` : 'Best value'}
              </span>
            </div>

            {/* Pricing & Koban Equivalent */}
            <div
              className="mt-4 rounded-2xl p-4 space-y-2"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="text-[26px] font-bold tabular-nums"
                  style={{ color: 'var(--text)' }}
                >
                  PKR {activePlusOption.price_pkr.toLocaleString()}
                </span>
                <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                  {activePlusOption.cadenceLabel}
                </span>
                {activePlusOption.regular_price_pkr && (
                  <span
                    className="text-[13px] line-through tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    PKR {activePlusOption.regular_price_pkr.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span
                  className="inline-flex items-center gap-1.5 font-semibold"
                  style={{ color: 'var(--koban)' }}
                >
                  <KobanIcon size={15} decorative />
                  <span>{activePlusOption.price_kobans.toLocaleString()} Kobans</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {activePlusExpiryPreview.daysAdded} days · Active until{' '}
                  <strong style={{ color: 'var(--text)' }}>
                    {activePlusExpiryPreview.newExpiryLabel}
                  </strong>
                </span>
              </div>
            </div>

            {/* Plus Feature List */}
            <ul className="mt-4 space-y-2.5">
              {activePlusOption.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: 'var(--text)' }}
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                    strokeWidth={2.4}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {planStatus.isSuperAdmin ? (
              <div
                className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                <span>Active · Superadmin</span>
              </div>
            ) : isPersonalPlus ? (
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => openCheckout(activePlusPlanId)}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {billingCycle === 'annual'
                      ? `Extend Plus · PKR ${activePlusOption.price_pkr.toLocaleString()}/yr`
                      : `Extend Plus · PKR ${activePlusOption.price_pkr}/mo`}
                  </span>
                </button>
                <p className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  Active until {planStatus.expiryFormatted || 'Active'} · Extending adds days onto
                  your current Plus pass
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  disabled={!plusEligibility.allowed}
                  onClick={() => openCheckout(activePlusPlanId)}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {billingCycle === 'annual'
                      ? `Upgrade to Plus · PKR ${activePlusOption.price_pkr.toLocaleString()}/yr`
                      : `Upgrade to Plus · PKR ${activePlusOption.price_pkr}/mo`}
                  </span>
                </button>
                {isPersonalProOnly && (
                  <p
                    className="text-center text-[12px] font-medium"
                    style={{ color: 'var(--koban)' }}
                  >
                    Replaces your active Pro pass ({activePlusExpiryPreview.daysAdded} days from today)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Nakama Crew Card */}
          <div
            className="rounded-[32px] p-5"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: 'var(--text)' }} />
                  <h3 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                    {catalog.crew.name}
                  </h3>
                </div>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {catalog.crew.description}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                Free squad
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {catalog.crew.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: 'var(--text)' }}
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    strokeWidth={2.2}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => navigate('/dashboard/crew')}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold cursor-pointer transition-colors hover:bg-[var(--settings-row-hover)]"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <Users className="h-4 w-4" />
              <span>{isCrew ? 'Manage your crew' : 'Join or create crew'}</span>
            </button>
          </div>

          {/* Free Tier Card */}
          <div
            className="rounded-[32px] p-5"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                  {catalog.free.name}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  PKR 0 / forever · {catalog.free.description}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {currentPlan === 'free' ? 'Current plan' : 'Base tier'}
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {catalog.free.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 4. COMPARE PLANS — 4 tiles per block (Free, Pro red accent, Plus amber/gold accent, Crew) */}
      <section className="mb-6" data-testid="compare-plans-section">
        <h2
          className="mb-2 pl-4 text-[14px] font-medium leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          Compare plans
        </h2>
        <div
          className="overflow-hidden rounded-[32px]"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--settings-card-shadow)',
          }}
        >
          {comparisonRows.map((row, idx) => (
            <div
              key={row.feature}
              className="px-5 py-4"
              style={
                idx < comparisonRows.length - 1
                  ? { borderBottom: '1px solid var(--border)' }
                  : undefined
              }
            >
              <div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                {row.feature}
              </div>
              <div className="mt-2.5 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    Free
                  </div>
                  <div className="mt-0.5 text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                    {row.free}
                  </div>
                </div>

                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    border: '1px solid color-mix(in srgb, var(--accent) 32%, transparent)',
                  }}
                >
                  <div className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                    Pro
                  </div>
                  <div className="mt-0.5 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                    {row.pro}
                  </div>
                </div>

                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(245, 158, 11, 0.16))',
                    border: '1px solid rgba(245, 158, 11, 0.42)',
                  }}
                >
                  <div
                    className="text-[11px] font-semibold inline-flex items-center gap-1"
                    style={{ color: 'var(--koban)' }}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Plus</span>
                  </div>
                  <div className="mt-0.5 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                    {row.plus}
                  </div>
                </div>

                <div
                  className="rounded-2xl px-3 py-2"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    Crew
                  </div>
                  <div className="mt-0.5 text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                    {row.crew}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Terms & refunds helper text under the last card */}
        <p className="mt-3 px-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {REFUND_POLICY_TEXT} Payments via JazzCash or Opay are verified manually and plans are
          activated within 24 hours. Review our{' '}
          <Link to="/terms" className="underline" style={{ color: 'var(--accent)' }}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline" style={{ color: 'var(--accent)' }}>
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      {/* Dedicated Pro / Plus Checkout Sheet */}
      <ProCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        initialPlanId={selectedCheckoutPlan}
        uid={user?.uid}
        userEmail={user?.email || profile?.email}
        userName={displayName}
        kobanBalance={kobanBalance}
        balanceLoaded={balanceLoaded}
        currentProExpiresAt={rawExpiresAt}
        hasPendingProRequest={isPendingVerification || Boolean(pendingProRequest)}
        onOpenGetKobans={(needed) => {
          setCheckoutOpen(false);
          setGetKobansInitialAmount(needed);
          setGetKobansOpen(true);
        }}
        onSuccess={() => {
          void loadProRequests();
          void refreshWallet();
        }}
        onStartPracticing={() => navigate('/practice')}
      />

      {/* Get Kobans Modal */}
      <GetKobansModal
        isOpen={getKobansOpen}
        onClose={() => {
          setGetKobansOpen(false);
          setGetKobansInitialAmount(undefined);
        }}
        initialAmount={getKobansInitialAmount}
      />
    </SettingsPage>
  );
}

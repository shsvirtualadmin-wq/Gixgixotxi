import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarClock,
  Check,
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
import { useWallet } from '@/hooks/useWallet';
import { useAiCredits } from '@/hooks/useAiCredits';
import {
  PLANS,
  REFUND_POLICY_TEXT,
  ANNUAL_SAVINGS_PERCENT,
  PLAN_COMPARISON_ROWS,
  computeExtendedProExpiry,
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

  useEffect(() => {
    if (location.hash === '#boardly-pro-card') {
      const timer = window.setTimeout(() => {
        document
          .getElementById('boardly-pro-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [location.hash]);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<ProPlanId>('pro_monthly');
  const [proCardCycle, setProCardCycle] = useState<ProPlanId>('pro_monthly');

  // Get Kobans modal (triggered from ProCheckoutSheet when balance is short)
  const [getKobansOpen, setGetKobansOpen] = useState(false);
  const [getKobansInitialAmount, setGetKobansInitialAmount] = useState<number | undefined>(
    undefined
  );

  // SWR-cached payment requests so rows render immediately without long spinners
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

  // Initial background SWR refresh + focus/event listeners
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

  const rawExpiresAt = profile?.planExpiresAt ?? (profile as any)?.premiumExpiresAt ?? null;
  const effectiveIsPro = planStatus.state === 'active';
  const isPendingVerification = planStatus.state === 'pending';
  const isPurchaseLocked = effectiveIsPro || isPendingVerification;

  const pendingProRequest = useMemo(
    () =>
      studentProRequests.find(
        (r) => r.status === 'pending' && r.plan !== 'large_crew'
      ) || null,
    [studentProRequests]
  );

  const latestRejectedProRequest = useMemo(
    () =>
      studentProRequests.find(
        (r) => r.status === 'rejected' && r.plan !== 'large_crew'
      ) || null,
    [studentProRequests]
  );

  const activeProOption = PLANS[proCardCycle];
  const activeProExpiryPreview = useMemo(
    () => computeExtendedProExpiry(rawExpiresAt, activeProOption.duration_days),
    [rawExpiresAt, activeProOption.duration_days]
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

  const openProCheckout = (plan: ProPlanId) => {
    if (isPurchaseLocked) return;
    setSelectedCheckoutPlan(plan);
    setCheckoutOpen(true);
  };

  const displayName = getDisplayName(
    {
      display_name: profile?.display_name ?? profile?.displayName,
      realName: profile?.realName ?? profile?.name ?? user?.displayName,
      username: profile?.username,
    },
    'Student'
  );

  const proLockHelperText = planStatus.expiryFormatted
    ? `New purchases are locked while your membership is active. You can renew after ${planStatus.expiryFormatted}.`
    : 'New purchases are locked while your membership is active.';

  return (
    <SettingsPage title="Plans and billing" onBack={handleBack}>
      <PageMeta
        title="Plans and billing — Boardly"
        description="Manage your Boardly Pro subscription, Kobans balance, and study plans."
      />

      {/* Inline Retry Error Banner (8s timeout / network error) */}
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
      {effectiveIsPro ? (
        <SettingsGroup label="Your plan" helperText={proLockHelperText}>
          <SettingsRow
            icon={<Crown />}
            label="Active plan"
            value={planStatus.planName}
            chevron="none"
          />
          <SettingsRow
            icon={<CalendarClock />}
            label="Expires"
            value={planStatus.expiryDateTimeFormatted || planStatus.expiryFormatted || 'Active'}
            chevron="none"
          />
          <SettingsRow
            icon={<Clock />}
            label="Time remaining"
            value={planStatus.timeLeftLabel || 'Active'}
            chevron="none"
          />
        </SettingsGroup>
      ) : isPendingVerification ? (
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
        <section className="mb-6">
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
              border: '1px solid var(--border)',
              boxShadow: 'var(--settings-card-shadow)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                  {isCrew ? planStatus.planName : 'Free tier'}
                </div>
                <p className="mt-1 text-[14px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  2 practice tests/day, 10 questions/test
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
                Current
              </span>
            </div>

            {latestRejectedProRequest && (
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

            <button
              type="button"
              onClick={() => openProCheckout(proCardCycle)}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Sparkles className="h-4 w-4" />
              <span>Upgrade to Pro</span>
            </button>
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
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                  {aiCredits.unlimited
                    ? 'Unlimited credits'
                    : `${aiCredits.remaining} of ${aiCredits.limit} credits left`}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                {aiCredits.unlimited
                  ? 'Superadmin access · Quick, Balanced, Deep & Max unlocked'
                  : `Resets in ${aiCredits.resetCountdown} (PKT) · ${
                      aiCredits.plan === 'pro'
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
                        Math.min(100, Math.round((aiCredits.remaining / Math.max(1, aiCredits.limit)) * 100))
                      )
                }%`,
                backgroundColor: 'var(--accent)',
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
          subtitle="Use Kobans for instant Boardly Pro activation"
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

      {/* 3. CHOOSE A PLAN (Hidden for active Pro & pending users so purchase actions stay locked) */}
      {!isPurchaseLocked && (
        <section className="mb-6 space-y-4">
          <h2
            className="mb-2 pl-4 text-[14px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            Choose a plan
          </h2>

          {/* Monthly | Annual (-25%) segmented pill */}
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
              aria-selected={proCardCycle === 'pro_monthly'}
              onClick={() => setProCardCycle('pro_monthly')}
              className="min-h-[44px] rounded-full px-4 text-[14px] font-semibold transition-colors cursor-pointer"
              style={
                proCardCycle === 'pro_monthly'
                  ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                  : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
              }
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={proCardCycle === 'pro_annual'}
              onClick={() => setProCardCycle('pro_annual')}
              className="min-h-[44px] rounded-full px-4 text-[14px] font-semibold transition-colors cursor-pointer"
              style={
                proCardCycle === 'pro_annual'
                  ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                  : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
              }
            >
              Annual (−{ANNUAL_SAVINGS_PERCENT}%)
            </button>
          </div>

          {/* Boardly Pro Card */}
          <div
            id="boardly-pro-card"
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
                  {proCardCycle === 'pro_annual'
                    ? `Annual pass · ${activeProOption.duration_days} days · Save ${ANNUAL_SAVINGS_PERCENT}%`
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
                {proCardCycle === 'pro_annual' ? `Save ${ANNUAL_SAVINGS_PERCENT}%` : 'Popular'}
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
                <span className="text-[26px] font-bold tabular-nums" style={{ color: 'var(--text)' }}>
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
                <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--koban)' }}>
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

            <button
              type="button"
              onClick={() => openProCheckout(proCardCycle)}
              className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold text-white cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Zap className="h-4 w-4" />
              <span>
                {proCardCycle === 'pro_annual'
                  ? `Get Annual Pass · PKR ${PLANS.pro_annual.price_pkr.toLocaleString()}`
                  : `Upgrade to Pro · PKR ${PLANS.pro_monthly.price_pkr}/mo`}
              </span>
            </button>
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
                    {PLANS.crew.name}
                  </h3>
                </div>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {PLANS.crew.description}
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
              {PLANS.crew.features.map((feature) => (
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
                  {PLANS.free.name}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  PKR 0 / forever · {PLANS.free.description}
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
              {PLANS.free.features.map((feature) => (
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

      {/* 4. COMPARE PLANS (Stacked readable feature rows — no cramped 4-column table) */}
      <section className="mb-6">
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
          {PLAN_COMPARISON_ROWS.map((row, idx) => (
            <div
              key={row.feature}
              className="px-5 py-4"
              style={
                idx < PLAN_COMPARISON_ROWS.length - 1
                  ? { borderBottom: '1px solid var(--border)' }
                  : undefined
              }
            >
              <div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                {row.feature}
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
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

      {/* Dedicated Pro Checkout Sheet (uses SettingsSheet) */}
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

      {/* Get Kobans Modal (triggered when user clicks "Get Kobans" on low balance) */}
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

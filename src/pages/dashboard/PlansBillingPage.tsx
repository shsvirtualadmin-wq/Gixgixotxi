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
  buildPlansCatalog,
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
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPlanLabel } from '@/lib/planTier';

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
  const { t, formatPKR, formatNumber } = useLanguage();
  const { kobanBalance, balanceLoaded, refreshWallet } = useWallet();
  const aiCredits = useAiCredits();

  const catalog = useMemo(() => buildPlansCatalog(plansConfig), [plansConfig]);
  const discountPercent = plansConfig.annualDiscountPercent;

  const localizedFeatures = useMemo(() => {
    const freeCredits = formatNumber(plansConfig.free.aiCreditsPerDay);
    const proCredits = formatNumber(plansConfig.pro.aiCreditsPerDay);
    const plusCredits = formatNumber(plansConfig.plus.aiCreditsPerDay);
    return {
      free: [
        t('plans.featFreeTests'),
        t('plans.featFreeArena'),
        t('plans.featFreeDerivations'),
        t('plans.featFreeAiCredits', { credits: freeCredits }),
        t('plans.featFreeCommons'),
        t('plans.featFreeStreak'),
      ],
      pro_monthly: [
        t('plans.featProTests'),
        t('plans.featProArena'),
        t('plans.featProDerivations'),
        t('plans.featProAiCredits', { credits: proCredits }),
        t('plans.featProFastOptimizer'),
        t('plans.featProMistakes'),
        t('plans.featAdFree'),
      ],
      pro_annual: [
        t('plans.featProAnnualEverything'),
        t('plans.featProAiCredits', { credits: proCredits }),
        t('plans.featProAnnualMocks'),
        t('plans.featProAnnualSupport'),
        t('plans.featProAnnualWeakness'),
        t('plans.featProBadge'),
        t('plans.featAdFree'),
      ],
      plus: [
        t('plans.featPlusEverythingPro'),
        t('plans.featPlusAiCredits', { credits: plusCredits }),
        t('plans.featPlusDeepMax'),
        t('plans.featPlusBadge'),
        t('plans.featAdFree'),
      ],
      crew: [
        t('plans.featCrewMembers'),
        t('plans.featCrewLeaderboards'),
        t('plans.featCrewChallenges'),
        t('plans.featCrewSharedPlan'),
        t('plans.featCrewRewards'),
        t('plans.featCrewUpgrade'),
      ],
    };
  }, [plansConfig, t, formatNumber]);

  const comparisonRows = useMemo(
    () => [
      {
        feature: t('plans.cmpDailyTests'),
        free: t('plans.cmpFreeTests'),
        pro: t('plans.unlimited'),
        plus: t('plans.unlimited'),
        crew: t('plans.cmpCrewShared'),
      },
      {
        feature: t('plans.cmpArenaMocks'),
        free: t('plans.cmpFreeArena'),
        pro: t('plans.unlimited'),
        plus: t('plans.unlimited'),
        crew: t('plans.cmpCrewRanked'),
      },
      {
        feature: t('plans.cmpDerivations'),
        free: t('plans.cmpFreeDerivations'),
        pro: t('plans.unlimited'),
        plus: t('plans.unlimited'),
        crew: t('plans.cmpBestInSquad'),
      },
      {
        feature: t('plans.cmpAiMentors'),
        free: t('plans.cmpFreeAi', { credits: formatNumber(plansConfig.free.aiCreditsPerDay) }),
        pro: t('plans.cmpProAi', { credits: formatNumber(plansConfig.pro.aiCreditsPerDay) }),
        plus: t('plans.cmpProAi', { credits: formatNumber(plansConfig.plus.aiCreditsPerDay) }),
        crew: t('plans.cmpBestInSquad'),
      },
      {
        feature: t('plans.cmpAnalytics'),
        free: t('plans.cmpBasic'),
        pro: t('plans.cmpFullDiagnostics'),
        plus: t('plans.cmpFullDiagnostics'),
        crew: t('plans.cmpSquadLeaderboard'),
      },
      {
        feature: t('plans.cmpBadges'),
        free: t('plans.cmpStandard'),
        pro: t('plans.cmpProBadgeKobans'),
        plus: t('plans.cmpPlusBadgeKobans'),
        crew: t('plans.cmpCrewTag'),
      },
      {
        feature: t('plans.featAdFree'),
        free: t('plans.cmpAdSupported'),
        pro: t('plans.featAdFree'),
        plus: t('plans.featAdFree'),
        crew: t('plans.cmpBestInSquad'),
      },
    ],
    [plansConfig, t, formatNumber]
  );

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
      setRequestsError(err?.message || t('plans.refreshStatusError'));
    }
  }, [user?.uid, isGuest, refreshPlanStatus, t]);

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
      <SettingsPage title={t('plans.title')} onBack={handleBack}>
        <PageMeta title={`${t('plans.title')} — Boardly`} />
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
    ? t('plans.superadmin')
    : formatPlanLabel(aiCredits.plan, { freeLabel: t('plans.free') });

  return (
    <SettingsPage title={t('plans.title')} onBack={handleBack}>
      <PageMeta
        title={`${t('plans.title')} — Boardly`}
        description={t('plans.metaDescription')}
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
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* 1. YOUR PLAN */}
      {isPendingVerification ? (
        <SettingsGroup
          label={t('plans.yourPlan')}
          helperText={t('plans.pendingHelperText')}
        >
          <SettingsRow
            icon={<Clock />}
            label={t('plans.paymentPendingVerification')}
            subtitle={
              planStatus.pendingRequest
                ? `${planStatus.pendingRequest.planName} · ${formatPKR(planStatus.pendingRequest.amountPkr)}`
                : pendingProRequest
                ? t('plans.amountSubmitted', { amount: formatPKR(Number(pendingProRequest.amount || 0)) })
                : t('plans.awaitingManualVerification')
            }
            value={t('plans.pending')}
            chevron="none"
          />
          {(planStatus.pendingRequest?.tid || pendingProRequest?.TID) && (
            <SettingsRow
              label={t('plans.transactionId')}
              value={planStatus.pendingRequest?.tid || pendingProRequest?.TID || ''}
              chevron="none"
            />
          )}
          {planStatus.pendingRequest?.submittedFormatted && (
            <SettingsRow
              label={t('plans.submitted')}
              value={planStatus.pendingRequest.submittedFormatted}
              chevron="none"
            />
          )}
        </SettingsGroup>
      ) : (
        <section className="mb-6" data-testid="your-plan-card">
          <h2
            className="mb-2 ps-4 text-[14px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('plans.yourPlan')}
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
                        ? t('plans.boardlyPlusSuperadmin')
                        : formatPlanLabel('plus')
                      : isPersonalProOnly
                      ? formatPlanLabel('pro')
                      : isCrew
                      ? planStatus.planName
                      : t('plans.freeTier')}
                  </div>
                </div>
                <p className="mt-1 text-[14px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {isPersonalPlus
                    ? planStatus.isSuperAdmin
                      ? t('plans.superadminSubtitle')
                      : t('plans.activeUntilShort', {
                          date: planStatus.expiryFormatted || t('plans.active'),
                          extra: planStatus.timeLeftLabel ? ` · ${planStatus.timeLeftLabel}` : '',
                        })
                    : isPersonalProOnly
                    ? t('plans.activeUntilShort', {
                        date: planStatus.expiryFormatted || t('plans.active'),
                        extra: planStatus.timeLeftLabel ? ` · ${planStatus.timeLeftLabel}` : '',
                      })
                    : isCrew
                    ? t('plans.crewAiCreditsPerDay', {
                        credits: formatNumber(
                          currentPlan === 'plus'
                            ? plansConfig.plus.aiCreditsPerDay
                            : plansConfig.pro.aiCreditsPerDay
                        ),
                      })
                    : t('plans.freeTierSubtitle', {
                        credits: formatNumber(plansConfig.free.aiCreditsPerDay),
                      })}
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
                  ? t('plans.crew')
                  : t('plans.current')}
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
                {t('plans.rejectedNotice', { tid: latestRejectedProRequest.TID || 'N/A' })}
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
                      ? t('plans.activeUnlimited')
                      : t('plans.activeUntilOnly', {
                          date: planStatus.expiryFormatted || t('plans.active'),
                        })}
                  </span>
                </span>
                <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.highestTier')}
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
                  <span>{t('plans.upgradeToPlus')}</span>
                </button>
                <p className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.startsFreshPlusNote')}
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
                  <span>{t('plans.upgradeToPro')}</span>
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={scrollToPlusCard}
                    className="text-[13px] font-semibold underline underline-offset-4 cursor-pointer"
                    style={{ color: 'var(--koban)' }}
                  >
                    {t('plans.seePlusCredits', {
                      credits: formatNumber(plansConfig.plus.aiCreditsPerDay),
                    })}
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
          className="mb-2 ps-4 text-[14px] font-medium leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('plans.aiCreditsToday')}
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
                    ? t('plans.unlimitedCredits')
                    : t('plans.creditsLeftOf', {
                        remaining: formatNumber(aiCredits.remaining),
                        limit: formatNumber(aiCredits.limit),
                      })}
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
                  ? t('plans.aiSuperadminUnlocked')
                  : t('plans.aiResetLine', {
                      countdown: aiCredits.resetCountdown,
                      modes:
                        aiCredits.plan === 'plus' || aiCredits.plan === 'pro'
                          ? t('plans.aiModesAll')
                          : t('plans.aiModesBasic'),
                    })}
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
              {t('plans.openAi')}
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
          label={t('plans.kobansBalance')}
          subtitle={t('plans.kobansBalanceSub')}
          chevron="none"
          rightElement={
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-semibold tabular-nums ltr-nums"
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
                  aria-label={t('plans.loadingKobansBalance')}
                />
              ) : (
                <span>{formatNumber(kobanBalance)}</span>
              )}
            </span>
          }
        />
        <SettingsRow
          icon={<Palette />}
          label={t('settings.customizeKoban')}
          onClick={() => navigate('/settings/koban-icon')}
        />
      </SettingsGroup>

      {/* 3. CHOOSE A PLAN */}
      {!isPendingVerification && (
        <section className="mb-6 space-y-4">
          <h2
            className="mb-2 ps-4 text-[14px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('plans.chooseAPlan')}
          </h2>

          {/* Monthly | Annual (-25%) segmented pill controlling BOTH Pro and Plus cards */}
          <div
            role="tablist"
            aria-label={t('plans.billingCycle')}
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
              {t('plans.monthly')}
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
              {t('plans.annualDiscount', { percent: formatNumber(discountPercent) })}
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
                    ? t('plans.annualPassMeta', {
                        days: formatNumber(activeProOption.duration_days),
                        percent: formatNumber(discountPercent),
                      })
                    : t('plans.monthlyPassMeta', {
                        days: formatNumber(activeProOption.duration_days),
                      })}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                {billingCycle === 'annual'
                  ? t('plans.popularSave', { percent: formatNumber(discountPercent) })
                  : t('plans.popular')}
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
                  className="text-[26px] font-bold tabular-nums ltr-nums"
                  style={{ color: 'var(--text)' }}
                >
                  {formatPKR(activeProOption.price_pkr)}
                </span>
                <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                  {billingCycle === 'annual' ? t('plans.perYear') : t('plans.perMonth')}
                </span>
                {activeProOption.regular_price_pkr && (
                  <span
                    className="text-[13px] line-through tabular-nums ltr-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatPKR(activeProOption.regular_price_pkr)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span
                  className="inline-flex items-center gap-1.5 font-semibold ltr-nums"
                  style={{ color: 'var(--koban)' }}
                >
                  <KobanIcon size={15} decorative />
                  <span>{formatNumber(activeProOption.price_kobans)} Kobans</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {t('plans.daysActiveUntil', {
                    days: formatNumber(activeProOption.duration_days),
                    date: activeProExpiryPreview.newExpiryLabel,
                  })}
                </span>
              </div>
            </div>

            {/* Feature Check Rows */}
            <ul className="mt-4 space-y-2.5">
              {(billingCycle === 'annual'
                ? localizedFeatures.pro_annual
                : localizedFeatures.pro_monthly
              ).map((feature) => (
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
                <span>{t('plans.includedInPlus')}</span>
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
                <span>{t('plans.currentPlan')}</span>
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
                <span className="ltr-nums">
                  {billingCycle === 'annual'
                    ? t('plans.upgradeToProYr', { price: formatPKR(activeProOption.price_pkr) })
                    : t('plans.upgradeToProMo', { price: formatPKR(activeProOption.price_pkr) })}
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
                    ? t('plans.annualPassMeta', {
                        days: formatNumber(activePlusOption.duration_days),
                        percent: formatNumber(discountPercent),
                      })
                    : t('plans.monthlyPassMeta', {
                        days: formatNumber(activePlusOption.duration_days),
                      })}
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
                {billingCycle === 'annual'
                  ? t('plans.bestValueSave', { percent: formatNumber(discountPercent) })
                  : t('plans.bestValue')}
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
                  className="text-[26px] font-bold tabular-nums ltr-nums"
                  style={{ color: 'var(--text)' }}
                >
                  {formatPKR(activePlusOption.price_pkr)}
                </span>
                <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                  {billingCycle === 'annual' ? t('plans.perYear') : t('plans.perMonth')}
                </span>
                {activePlusOption.regular_price_pkr && (
                  <span
                    className="text-[13px] line-through tabular-nums ltr-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatPKR(activePlusOption.regular_price_pkr)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                <span
                  className="inline-flex items-center gap-1.5 font-semibold ltr-nums"
                  style={{ color: 'var(--koban)' }}
                >
                  <KobanIcon size={15} decorative />
                  <span>{formatNumber(activePlusOption.price_kobans)} Kobans</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {t('plans.daysActiveUntil', {
                    days: formatNumber(activePlusExpiryPreview.daysAdded),
                    date: activePlusExpiryPreview.newExpiryLabel,
                  })}
                </span>
              </div>
            </div>

            {/* Plus Feature List */}
            <ul className="mt-4 space-y-2.5">
              {localizedFeatures.plus.map((feature) => (
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
                <span>{t('plans.activeSuperadmin')}</span>
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
                  <span className="ltr-nums">
                    {billingCycle === 'annual'
                      ? t('plans.extendPlusYr', { price: formatPKR(activePlusOption.price_pkr) })
                      : t('plans.extendPlusMo', { price: formatPKR(activePlusOption.price_pkr) })}
                  </span>
                </button>
                <p className="text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.extendingAddsDays', {
                    date: planStatus.expiryFormatted || t('plans.active'),
                  })}
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
                  <span className="ltr-nums">
                    {billingCycle === 'annual'
                      ? t('plans.upgradeToPlusYr', { price: formatPKR(activePlusOption.price_pkr) })
                      : t('plans.upgradeToPlusMo', { price: formatPKR(activePlusOption.price_pkr) })}
                  </span>
                </button>
                {isPersonalProOnly && (
                  <p
                    className="text-center text-[12px] font-medium"
                    style={{ color: 'var(--koban)' }}
                  >
                    {t('plans.replacesProPass', {
                      days: formatNumber(activePlusExpiryPreview.daysAdded),
                    })}
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
                    {t('plans.nakamaCrew')}
                  </h3>
                </div>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.crewDesc')}
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
                {t('plans.freeSquad')}
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {localizedFeatures.crew.map((feature) => (
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
              <span>{isCrew ? t('plans.manageCrew') : t('plans.joinOrCreateCrew')}</span>
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
                  {t('plans.freeTier')}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {t('plans.freeForeverLine', { price: formatPKR(0) })}
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
                {currentPlan === 'free' ? t('plans.currentPlan') : t('plans.baseTier')}
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {localizedFeatures.free.map((feature) => (
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
          className="mb-2 ps-4 text-[14px] font-medium leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('plans.comparePlans')}
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
                    {t('plans.free')}
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
                    {t('plans.crew')}
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
          {t('plans.refundPolicy')} {t('plans.manualVerificationNote')}{' '}
          <Link to="/terms" className="underline" style={{ color: 'var(--accent)' }}>
            {t('settings.termsOfService')}
          </Link>{' '}
          {t('common.and')}{' '}
          <Link to="/privacy" className="underline" style={{ color: 'var(--accent)' }}>
            {t('settings.privacyPolicy')}
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

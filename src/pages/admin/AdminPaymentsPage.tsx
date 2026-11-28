import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Tag,
  Plus,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  AdminDiagnosticBanner,
  type AdminDiagnosticError,
} from '@/components/admin/AdminDiagnosticBanner';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import {
  approvePaymentRequest,
  rejectPaymentRequest,
  fetchAdminJsonWithRetry,
} from '@/services/adminService';
import {
  approveKobanRequest,
  rejectKobanRequest,
} from '@/services/kobanService';
import {
  getCachedAdminPayments,
  fetchAdminPaymentsSWR,
  invalidateAdminPaymentsCache,
} from '@/services/adminTabCache';
import { KobanIcon } from '@/components/koban/KobanIcon';
import {
  PAYMENT_METHODS_LIST,
  PAYMENT_METHODS_PAIR_LABEL,
  formatPaymentMethodLabel,
  isLegacyPaymentMethod,
} from '@/constants/branding';
import {
  normalizeAdminCoupon,
  normalizeAdminCouponRedemption,
  getCouponBadgeLabel,
  type NormalizedAdminCoupon,
  type NormalizedAdminCouponRedemption,
} from '@/utils/couponMapper';
import type { PaymentRequest, KobanRequest } from '@/types';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import {
  getPlanTierFromPlanId,
  getBillingFromPlanId,
  computeAnnualPrice,
} from '@/lib/planTier';
import {
  AdminButton,
  AdminEmptyState,
  AdminOverlay,
  AdminSearchFilterBar,
  AdminStatGrid,
  DotHeading,
  Field,
  GlassCard,
  MonoLabel,
  Pill,
  Segmented,
  SkeletonListRows,
  useDebouncedValue,
} from '@/components/admin/AdminGlassPrimitives';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';

const PAYMENTS_PAGE_SIZE = 20;

const TAB_ITEMS: Array<{
  id: 'plans' | 'kobans' | 'coupons';
  label: string;
  shortLabel: string;
}> = [
  { id: 'plans', label: 'Plan Subscriptions', shortLabel: 'Plans' },
  { id: 'kobans', label: 'Kobans Purchases', shortLabel: 'Kobans' },
  { id: 'coupons', label: 'Coupons & Promos', shortLabel: 'Coupons' },
];

export function AdminPaymentsPage() {
  const { user, isAdmin, isSuperAdmin, tokenClaims, profileLoading } = useAuth();
  const { enabled: glassEnabled } = useAdminGlassFlag();
  const hasAdminAccess = Boolean(
    isAdmin || isSuperAdmin || tokenClaims?.admin === true || tokenClaims?.superAdmin === true
  );
  const superadminEmail = user?.email || 'shsvirtualadmin@gmail.com';

  const [paymentType, setPaymentType] = useState<'plans' | 'kobans' | 'coupons'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('type');
      if (t === 'kobans') return 'kobans';
      if (t === 'coupons' || t === 'promos') return 'coupons';
      if (t === 'pro' || t === 'plans') return 'plans';
    }
    return 'plans';
  });
  const initialPaymentsCache = getCachedAdminPayments();
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAYMENTS_PAGE_SIZE);

  const [loading, setLoading] = useState<boolean>(() => !initialPaymentsCache);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(() => Boolean(initialPaymentsCache));
  const [error, setError] = useState<AdminDiagnosticError | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Pro Plan Requests
  const [planRequests, setPlanRequests] = useState<PaymentRequest[]>(
    () => initialPaymentsCache?.payments ?? []
  );

  // Koban Requests
  const [kobanRequestsList, setKobanRequestsList] = useState<KobanRequest[]>(
    () => initialPaymentsCache?.kobanRequests ?? []
  );

  // Coupons & Redemptions (Normalized via single mapper)
  const [couponsList, setCouponsList] = useState<NormalizedAdminCoupon[]>([]);
  const [couponRedemptions, setCouponRedemptions] = useState<NormalizedAdminCouponRedemption[]>([]);
  const [expandedRedemptionIds, setExpandedRedemptionIds] = useState<Record<string, boolean>>({});

  const { config: plansConfig } = usePlansConfig();
  // Create Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponLabel, setNewCouponLabel] = useState('');
  const [newCouponDiscountPct, setNewCouponDiscountPct] = useState<string>('50');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<string>('100');
  const [newCouponAppliesTo, setNewCouponAppliesTo] = useState<string>('all');
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Plan Reject modal dialog
  const [planRejectTarget, setPlanRejectTarget] = useState<PaymentRequest | null>(null);
  const [planRejectReason, setPlanRejectReason] = useState(
    `Transaction ID could not be verified on ${PAYMENT_METHODS_PAIR_LABEL} portal.`
  );

  // Koban Approve Modal
  const [kobanApproveTarget, setKobanApproveTarget] = useState<KobanRequest | null>(null);
  const [kobanEditableAmount, setKobanEditableAmount] = useState<number>(0);
  const [kobanApproving, setKobanApproving] = useState(false);

  // Koban Reject Modal
  const [kobanRejectTarget, setKobanRejectTarget] = useState<KobanRequest | null>(null);
  const [kobanRejectReason, setKobanRejectReason] = useState(
    'Transaction ID could not be verified on mobile banking portal.'
  );
  const [kobanRejecting, setKobanRejecting] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const showErrorToast = useCallback((msg: string) => {
    setToastError(msg);
    window.setTimeout(() => {
      setToastError((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyPaymentsCache = useCallback(
    (data: { payments: PaymentRequest[]; kobanRequests: KobanRequest[] }) => {
      if (!isMountedRef.current) return;
      setPlanRequests(data.payments);
      setKobanRequestsList(data.kobanRequests);
      setHasLoadedOnce(true);
    },
    []
  );

  const loadData = useCallback(
    async (force = false) => {
      if (!user || !hasAdminAccess) {
        if (isMountedRef.current) setLoading(false);
        return;
      }
      const requestId = ++loadRequestIdRef.current;
      const activeTab = paymentType;
      const cached = getCachedAdminPayments();
      if (activeTab === 'coupons' ? couponsList.length === 0 : !cached) {
        setLoading(true);
      }
      if (force && activeTab !== 'coupons') {
        invalidateAdminPaymentsCache();
      }
      setError(null);
      let safetyTimer: ReturnType<typeof setTimeout> | null = null;
      try {
        const runTabFetch = async () => {
          if (activeTab === 'plans' || activeTab === 'kobans') {
            const data = await fetchAdminPaymentsSWR({
              force,
              onUpdate: applyPaymentsCache,
            });
            if (isMountedRef.current && loadRequestIdRef.current === requestId) {
              applyPaymentsCache(data);
            }
          } else {
            const { ok, data: payload, errorMessage } = await fetchAdminJsonWithRetry<any>(
              '/api/admin/coupons',
              undefined,
              10000
            );
            if (!ok || !payload?.ok) {
              const couponErr: any = new Error(errorMessage || 'Failed to load coupons from server.');
              couponErr.code = payload?.reason || payload?.code || 'PAYMENTS_LOAD_FAILED';
              throw couponErr;
            }
            const rawCoupons = Array.isArray(payload.coupons) ? payload.coupons : [];
            const rawRedemptions = Array.isArray(payload.redemptions) ? payload.redemptions : [];

            if (isMountedRef.current && loadRequestIdRef.current === requestId) {
              setCouponsList(rawCoupons.map((item: any) => normalizeAdminCoupon(item)));
              setCouponRedemptions(
                rawRedemptions
                  .map((item: any) => normalizeAdminCouponRedemption(item))
                  .sort((a: NormalizedAdminCouponRedemption, b: NormalizedAdminCouponRedemption) => {
                    return (b.redeemedAtMs || 0) - (a.redeemedAtMs || 0);
                  })
              );
              setHasLoadedOnce(true);
            }
          }
        };

        await Promise.race([
          runTabFetch(),
          new Promise<never>((_, reject) => {
            safetyTimer = setTimeout(() => {
              const timeoutErr: any = new Error(
                'Request timed out while refreshing payment records. Please try again.'
              );
              timeoutErr.code = 'DEADLINE_EXCEEDED';
              reject(timeoutErr);
            }, 15000);
          }),
        ]);
      } catch (err: unknown) {
        if (!isMountedRef.current || loadRequestIdRef.current !== requestId) return;
        console.error('[AdminPaymentsPage] Failed to load payment requests:', err);
        const e = err as Partial<AdminDiagnosticError>;
        setError({
          code: e?.code || 'PAYMENTS_LOAD_FAILED',
          message: e?.message || 'Failed to load payment records. Please retry.',
          collection: activeTab === 'plans' ? 'paymentRequests' : activeTab,
          operation: 'loadData',
        });
      } finally {
        if (safetyTimer) clearTimeout(safetyTimer);
        if (isMountedRef.current && loadRequestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [user, hasAdminAccess, paymentType, applyPaymentsCache, couponsList.length]
  );

  useEffect(() => {
    if (profileLoading) return;
    if (!user || !hasAdminAccess) {
      setLoading(false);
      return;
    }
    void loadData(false);
  }, [profileLoading, user, hasAdminAccess, loadData]);

  useEffect(() => {
    setVisibleCount(PAYMENTS_PAGE_SIZE);
  }, [paymentType, statusFilter, methodFilter, debouncedSearch]);

  const handleCreateCoupon = async () => {
    const cleanCode = newCouponCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) return;

    const parsedPct = Math.max(1, Math.min(100, Math.round(Number(newCouponDiscountPct) || 50)));
    const parsedMaxUses = Math.max(1, Math.round(Number(newCouponMaxUses) || 100));
    const isOneYearPro = /^BOARDLY-1Y-/i.test(cleanCode) || parsedPct >= 100;
    const rawTrimmedLabel = newCouponLabel.trim();

    // Prevent label from accidentally receiving the max-uses number if left blank or mis-typed
    const cleanLabel =
      rawTrimmedLabel && rawTrimmedLabel !== String(parsedMaxUses)
        ? rawTrimmedLabel
        : isOneYearPro
          ? '1-Year Free Pro Campaign'
          : `${parsedPct}% Off Pro Pass`;

    setCreatingCoupon(true);
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: cleanCode,
          label: cleanLabel,
          type: isOneYearPro ? '1_year_free_pro' : 'percent',
          discountType: isOneYearPro ? '1_year_free_pro' : 'percent',
          benefitType: isOneYearPro ? '1_year_free_pro' : 'percentage_discount',
          percentOff: isOneYearPro ? 100 : parsedPct,
          discountPercent: isOneYearPro ? 100 : parsedPct,
          maxRedemptions: parsedMaxUses,
          appliesTo: newCouponAppliesTo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const reason = data?.reason || data?.error || `HTTP ${res.status}`;
        showErrorToast(
          res.status === 403
            ? `Permission denied (403): ${reason}`
            : `Failed to save coupon: ${reason}`
        );
        return;
      }

      if (data.coupon) {
        const createdNorm = normalizeAdminCoupon(data.coupon);
        setCouponsList((prev) => {
          const filtered = prev.filter((item) => item.code !== createdNorm.code);
          return [createdNorm, ...filtered];
        });
      } else {
        await loadData();
      }

      setNewCouponCode('');
      setNewCouponLabel('');
      setBannerNotice(`Created coupon ${cleanCode}.`);
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      console.error('Failed to create coupon:', err);
      showErrorToast('Network error while creating coupon.');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (coupon: NormalizedAdminCoupon) => {
    const previousActive = coupon.active;
    const nextActive = !previousActive;

    // 1. Optimistic UI update
    setCouponsList((prev) =>
      prev.map((item) =>
        item.code === coupon.code
          ? { ...item, active: nextActive, isActive: nextActive }
          : item
      )
    );
    setActionInProgress(coupon.code);

    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: coupon.code,
          active: nextActive,
          isActive: nextActive,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        // Rollback optimistic update on 403 or server failure
        setCouponsList((prev) =>
          prev.map((item) =>
            item.code === coupon.code
              ? { ...item, active: previousActive, isActive: previousActive }
              : item
          )
        );
        const reason = data?.reason || data?.error || `HTTP ${res.status}`;
        showErrorToast(
          res.status === 403
            ? `Permission denied (403): Could not update ${coupon.code}`
            : `Could not update ${coupon.code}: ${reason}`
        );
        return;
      }

      if (data.coupon) {
        const updatedNorm = normalizeAdminCoupon(data.coupon);
        setCouponsList((prev) =>
          prev.map((item) => (item.code === coupon.code ? updatedNorm : item))
        );
      }
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
      // Rollback optimistic update on network error
      setCouponsList((prev) =>
        prev.map((item) =>
          item.code === coupon.code
            ? { ...item, active: previousActive, isActive: previousActive }
            : item
        )
      );
      showErrorToast(`Network error: Rolled back ${coupon.code}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Plan actions
  const handleApprovePlan = async (req: PaymentRequest) => {
    if (!user?.email) return;
    setActionInProgress(req.id);
    try {
      await approvePaymentRequest(user.email, req);
      const isPlusReq =
        getPlanTierFromPlanId(String((req as any).planId || req.plan || '')) === 'plus' ||
        (req as any).planTier === 'plus';
      setBannerNotice(
        `Approved ${isPlusReq ? 'Boardly Plus' : 'Boardly Pro'} upgrade for ${req.userName || req.userEmail}.`
      );
      setTimeout(() => setBannerNotice(null), 3000);
      await loadData(true);
    } catch (err) {
      console.error('Failed to approve payment:', err);
      showErrorToast('Failed to approve plan payment.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmRejectPlan = async () => {
    if (!planRejectTarget || !user?.email) return;
    setActionInProgress(planRejectTarget.id);
    try {
      await rejectPaymentRequest(
        user.email,
        planRejectTarget.id,
        planRejectTarget.userId,
        planRejectTarget.userEmail || '',
        planRejectReason
      );
      setPlanRejectTarget(null);
      setBannerNotice('Payment request rejected.');
      setTimeout(() => setBannerNotice(null), 3000);
      await loadData(true);
    } catch (err) {
      console.error('Failed to reject payment:', err);
      showErrorToast('Failed to reject payment request.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Koban actions
  const handleOpenKobanApprove = (req: KobanRequest) => {
    setKobanApproveTarget(req);
    setKobanEditableAmount(req.amount);
  };

  const handleConfirmKobanApprove = async () => {
    if (!kobanApproveTarget) return;
    setKobanApproving(true);
    try {
      await approveKobanRequest(
        superadminEmail,
        kobanApproveTarget.id,
        kobanApproveTarget.userId,
        kobanEditableAmount,
        kobanApproveTarget.transactionId
      );
      setKobanApproveTarget(null);
      setBannerNotice(`Credited +${kobanEditableAmount.toLocaleString()} Kobans to student.`);
      setTimeout(() => setBannerNotice(null), 3500);
      await loadData(true);
    } catch (err: unknown) {
      showErrorToast((err as Error).message || 'Failed to approve Koban request');
    } finally {
      setKobanApproving(false);
    }
  };

  const handleConfirmKobanReject = async () => {
    if (!kobanRejectTarget) return;
    setKobanRejecting(true);
    try {
      await rejectKobanRequest(
        superadminEmail,
        kobanRejectTarget.id,
        kobanRejectTarget.userId,
        kobanRejectReason
      );
      setKobanRejectTarget(null);
      setBannerNotice('Koban request rejected.');
      setTimeout(() => setBannerNotice(null), 3000);
      await loadData(true);
    } catch (err: unknown) {
      showErrorToast((err as Error).message || 'Failed to reject Koban request');
    } finally {
      setKobanRejecting(false);
    }
  };

  const matchesMethodFilter = useCallback(
    (rawMethod?: string | null) => {
      if (methodFilter === 'all') return true;
      const lower = String(rawMethod || '')
        .trim()
        .toLowerCase();
      if (methodFilter === 'legacy') return isLegacyPaymentMethod(lower);
      return lower === methodFilter.toLowerCase();
    },
    [methodFilter]
  );

  const pendingPlansCount = useMemo(
    () => planRequests.filter((r) => r.status === 'pending').length,
    [planRequests]
  );
  const pendingKobansCount = useMemo(
    () => kobanRequestsList.filter((r) => r.status === 'pending').length,
    [kobanRequestsList]
  );

  const filteredPlanRequests = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return planRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!matchesMethodFilter(r.method)) return false;
      if (!q) return true;
      const hay = [r.userName, r.userEmail, r.TID, r.transactionId, r.method, (r as any).couponCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [planRequests, statusFilter, matchesMethodFilter, debouncedSearch]);

  const filteredKobanRequests = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return kobanRequestsList.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!matchesMethodFilter(r.paymentMethod)) return false;
      if (!q) return true;
      const hay = [r.userName, r.transactionId, r.paymentMethod, String(r.amount)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [kobanRequestsList, statusFilter, matchesMethodFilter, debouncedSearch]);

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) + (methodFilter !== 'all' ? 1 : 0);

  return (
    <div
      data-admin-page="payments"
      className="flex flex-col gap-5 w-full max-w-full overflow-x-hidden pb-28 sm:pb-20"
      style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ─── FLOATING SHORT ERROR TOAST ────────────────────────────────────── */}
      {toastError && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-sm rounded-[18px] bg-[#161616] border border-[#E8353B]/50 px-4 py-3 text-xs text-[#f5f5f7] flex items-center gap-2.5 shadow-2xl"
        >
          <AlertCircle size={15} className="text-[#E8353B] shrink-0" />
          <span className="font-medium leading-snug">{toastError}</span>
        </div>
      )}

      {/* ─── QUESTION-BANK HERO SUMMARY CARD ───────────────────────────────── */}
      <GlassCard variant="hero" padding="lg" className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <MonoLabel>Billing &amp; Receipt Verification</MonoLabel>
            <DotHeading as="h1" size="page">
              Payments &amp; Promos
            </DotHeading>
            <p className="text-[13px] text-[var(--text-muted)] max-w-xl">
              Verify {PAYMENT_METHODS_PAIR_LABEL} receipts for Pro/Plus plans, Kobans economy, and promo coupon redemptions.
            </p>
          </div>

          <AdminButton
            variant="secondary"
            onClick={() => void loadData(true)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </AdminButton>
        </div>

        <AdminStatGrid
          columns={4}
          items={[
            {
              label: 'Plan Requests',
              value: loading && !hasLoadedOnce ? '—' : planRequests.length,
              sublabel: 'Pro & Plus upgrades',
            },
            {
              label: 'Pending Plans',
              value: loading && !hasLoadedOnce ? '—' : pendingPlansCount,
              tone: pendingPlansCount > 0 ? 'accent' : 'default',
              sublabel: 'Needs verification',
            },
            {
              label: 'Koban Orders',
              value: loading && !hasLoadedOnce ? '—' : kobanRequestsList.length,
              sublabel: 'Top-up receipts',
            },
            {
              label: 'Pending Kobans',
              value: loading && !hasLoadedOnce ? '—' : pendingKobansCount,
              tone: pendingKobansCount > 0 ? 'warning' : 'default',
              sublabel: 'Awaiting credit',
            },
          ]}
        />
      </GlassCard>

      {/* ─── DIAGNOSTIC ALERT ── */}
      <AdminDiagnosticBanner
        error={error}
        collectionName={paymentType === 'plans' ? 'paymentRequests' : paymentType}
        onRetry={() => void loadData(true)}
        retrying={loading}
      />

      {bannerNotice && (
        <GlassCard variant="glass" padding="sm" className="text-xs text-emerald-300 flex items-center gap-2.5 border-emerald-500/40">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{bannerNotice}</span>
        </GlassCard>
      )}

      {/* ─── QUESTION-BANK PILL TAB BAR + SEARCH & FILTERS ── */}
      <GlassCard variant="glass" padding="md" className="space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <Segmented
            ariaLabel="Payments and coupons sections"
            value={paymentType}
            onChange={(val) => setPaymentType(val)}
            options={TAB_ITEMS.map((tab) => ({
              value: tab.id,
              label: tab.label,
              count:
                tab.id === 'plans'
                  ? pendingPlansCount
                  : tab.id === 'kobans'
                  ? pendingKobansCount
                  : undefined,
              icon:
                tab.id === 'plans' ? (
                  <CreditCard size={14} />
                ) : tab.id === 'kobans' ? (
                  <KobanIcon size={13} />
                ) : (
                  <Tag size={14} />
                ),
            }))}
          />

          {paymentType !== 'coupons' && (
            <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ].map(({ id, label }) => (
                <AdminButton
                  key={id}
                  variant={statusFilter === id ? 'primary' : 'pill'}
                  onClick={() => setStatusFilter(id)}
                  className="!min-h-[36px] !py-1.5 !px-3 !text-xs"
                >
                  {label}
                </AdminButton>
              ))}
            </div>
          )}
        </div>

        {paymentType !== 'coupons' && (
          <AdminSearchFilterBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search student name, email, TID/TRX, or coupon…"
            onOpenFilters={() => setFiltersOpen(true)}
            activeFilterCount={activeFilterCount}
          />
        )}
      </GlassCard>

      {/* ─── PRO PLANS LIST ─────────────────────────────────────────────────── */}
      {paymentType === 'plans' && (
        <div className="space-y-3">
          {loading && !hasLoadedOnce ? (
            <SkeletonListRows rows={4} />
          ) : filteredPlanRequests.length === 0 ? (
            <AdminEmptyState
              icon={<CreditCard size={22} />}
              title="No plan subscription payments found"
              description="Try adjusting your status, payment method, or search filter."
              action={
                (debouncedSearch.trim() || activeFilterCount > 0) && (
                  <AdminButton
                    variant="secondary"
                    onClick={() => {
                      setSearchInput('');
                      setStatusFilter('all');
                      setMethodFilter('all');
                    }}
                  >
                    Clear filters
                  </AdminButton>
                )
              }
            />
          ) : (
            <>
            {filteredPlanRequests.slice(0, visibleCount).map((req) => {
              const reqAny = req as Record<string, any>;
              const rawPlanId = String(reqAny.planId || req.plan || 'pro_monthly');
              const isCrewReq = req.plan === 'large_crew';
              const isPlusReq =
                !isCrewReq &&
                (getPlanTierFromPlanId(rawPlanId) === 'plus' || reqAny.planTier === 'plus');
              const isAnnualReq =
                getBillingFromPlanId(rawPlanId) === 'annual' ||
                req.durationDays === 365 ||
                (req.durationMonths ?? 1) >= 12;
              const expectedPkr = isCrewReq
                ? null
                : isPlusReq
                  ? isAnnualReq
                    ? computeAnnualPrice(plansConfig.plus.pricePkrMonthly, plansConfig.annualDiscountPercent)
                    : plansConfig.plus.pricePkrMonthly
                  : isAnnualReq
                    ? computeAnnualPrice(plansConfig.pro.pricePkrMonthly, plansConfig.annualDiscountPercent)
                    : plansConfig.pro.pricePkrMonthly;
              const paidPkr = Number(req.amount_pkr ?? req.amount ?? 0);
              const hasPriceMismatch =
                expectedPkr !== null && !reqAny.couponCode && paidPkr > 0 && paidPkr !== expectedPkr;

              return (
                <GlassCard
                  key={req.id}
                  variant="flat"
                  padding="md"
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-[var(--text)]">
                        {req.userName || req.userEmail || 'Student'}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                          isPlusReq
                            ? 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                            : 'border-[#D71921]/45 bg-[#D71921]/15 text-[#ff6b72]'
                        }`}
                      >
                        {isCrewReq
                          ? 'Large Crew Pass'
                          : isPlusReq
                            ? isAnnualReq
                              ? 'Plus Pass · Annual (365d)'
                              : 'Plus Pass · Monthly (30d)'
                            : isAnnualReq
                              ? 'Pro Pass · Annual (365d)'
                              : 'Pro Pass · Monthly (30d)'}
                      </span>
                      {reqAny.couponCode && (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold inline-flex items-center gap-1">
                          <Tag size={10} />
                          <span>Coupon: {reqAny.couponCode}</span>
                        </span>
                      )}
                      {hasPriceMismatch && (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold inline-flex items-center gap-1">
                          <AlertCircle size={10} />
                          <span>Expected PKR {expectedPkr?.toLocaleString()}</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                          req.status === 'approved'
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : req.status === 'rejected'
                              ? 'border-[#D71921]/50 bg-[#D71921]/15 text-[#ff6b72]'
                              : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                        PKR {paidPkr.toLocaleString()} via{' '}
                        {formatPaymentMethodLabel(req.method)}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-3 flex-wrap pt-1">
                      <div className="flex items-center gap-1.5 lg-nothing-pill px-3 py-1">
                        <span>TID:</span>
                        <strong className="text-[var(--text)]">
                          {req.TID || req.transactionId}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(req.TID || req.transactionId, req.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--text)] p-1"
                          title="Copy TID"
                        >
                          {copiedId === req.id ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      {req.userEmail && (
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {req.userEmail}
                        </span>
                      )}
                      {req.screenshotUrl && (
                        <a
                          href={req.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#ff6b72] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          <span>Receipt</span>
                        </a>
                      )}
                    </div>
                    {req.rejectionReason && (
                      <p className="text-xs text-[#ff6b72] mt-1">
                        Rejection reason: {req.rejectionReason}
                      </p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                      <AdminButton
                        variant="danger"
                        disabled={actionInProgress === req.id}
                        onClick={() => {
                          setPlanRejectTarget(req);
                          setPlanRejectReason(
                            `Transaction ID could not be verified on ${PAYMENT_METHODS_PAIR_LABEL} portal.`
                          );
                        }}
                        className="!min-h-[40px] !py-1.5 !px-3.5 !text-xs"
                      >
                        Reject
                      </AdminButton>
                      <AdminButton
                        variant="primary"
                        disabled={actionInProgress === req.id}
                        onClick={() => handleApprovePlan(req)}
                        className="!min-h-[40px] !py-1.5 !px-4 !text-xs"
                      >
                        <CheckCircle2 size={13} />
                        <span>
                          {isCrewReq
                            ? 'Approve Crew'
                            : isPlusReq
                              ? 'Approve & Activate Plus'
                              : 'Approve & Activate Pro'}
                        </span>
                      </AdminButton>
                    </div>
                  )}
                </GlassCard>
              );
            })}
            {filteredPlanRequests.length > visibleCount && (
              <div className="pt-2 flex justify-center">
                <AdminButton
                  variant="secondary"
                  onClick={() => setVisibleCount((prev) => prev + PAYMENTS_PAGE_SIZE)}
                >
                  Load more payments ({filteredPlanRequests.length - visibleCount} remaining)
                </AdminButton>
              </div>
            )}
            </>
          )}
        </div>
      )}

      {/* ─── KOBANS PURCHASES LIST ─────────────────────────────────────────── */}
      {paymentType === 'kobans' && (
        <div className="space-y-3">
          {loading && !hasLoadedOnce ? (
            <SkeletonListRows rows={4} />
          ) : filteredKobanRequests.length === 0 ? (
            <AdminEmptyState
              icon={<KobanIcon size={22} />}
              title="No Koban purchase requests found"
              description="Try adjusting your status, payment method, or search filter."
              action={
                (debouncedSearch.trim() || activeFilterCount > 0) && (
                  <AdminButton
                    variant="secondary"
                    onClick={() => {
                      setSearchInput('');
                      setStatusFilter('all');
                      setMethodFilter('all');
                    }}
                  >
                    Clear filters
                  </AdminButton>
                )
              }
            />
          ) : (
            <>
            {filteredKobanRequests.slice(0, visibleCount).map((req) => (
              <GlassCard
                key={req.id}
                variant="flat"
                padding="md"
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      {req.userName || 'Student'}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border border-[#FFD66B]/40 bg-[#FFD66B]/10 text-[#FFD66B] font-bold">
                      Koban Top-Up
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${
                        req.status === 'approved'
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                          : req.status === 'rejected'
                            ? 'border-[#D71921]/50 bg-[#D71921]/15 text-[#ff6b72]'
                            : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      via {formatPaymentMethodLabel(req.paymentMethod)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-xs font-mono flex-wrap">
                    <div className="flex items-center gap-1.5 lg-nothing-pill px-3 py-1">
                      <span className="text-[var(--text-muted)]">TRX:</span>
                      <span className="font-bold text-[var(--text)]">{req.transactionId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(req.transactionId, req.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] p-1"
                        title="Copy TRX"
                      >
                        {copiedId === req.id ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>

                    <div className="text-[var(--text-muted)] tabular-nums">
                      Amount:{' '}
                      <strong className="text-[#FFD66B]">
                        {req.amount.toLocaleString()} Kobans
                      </strong>{' '}
                      (PKR {req.pkrAmount})
                    </div>
                  </div>

                  {req.rejectionReason && (
                    <p className="text-xs text-[#ff6b72] mt-1">
                      Rejection reason: {req.rejectionReason}
                    </p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    <AdminButton
                      variant="danger"
                      onClick={() => {
                        setKobanRejectTarget(req);
                        setKobanRejectReason(
                          'Transaction ID could not be verified on mobile banking portal.'
                        );
                      }}
                      className="!min-h-[40px] !py-1.5 !px-3.5 !text-xs"
                    >
                      Reject
                    </AdminButton>

                    <AdminButton
                      variant="primary"
                      onClick={() => handleOpenKobanApprove(req)}
                      className="!min-h-[40px] !py-1.5 !px-4 !text-xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve &amp; Credit</span>
                    </AdminButton>
                  </div>
                )}
              </GlassCard>
            ))}
            {filteredKobanRequests.length > visibleCount && (
              <div className="pt-2 flex justify-center">
                <AdminButton
                  variant="secondary"
                  onClick={() => setVisibleCount((prev) => prev + PAYMENTS_PAGE_SIZE)}
                >
                  Load more Koban orders ({filteredKobanRequests.length - visibleCount} remaining)
                </AdminButton>
              </div>
            )}
            </>
          )}
        </div>
      )}

      {/* ─── COUPONS & PROMO REDEMPTIONS TAB ───────────────────────────────── */}
      {paymentType === 'coupons' && (
        <div className="space-y-6">
          {/* 1. Create Coupon Glass Card */}
          <GlassCard variant="glass" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <DotHeading as="h2" size="section" className="flex items-center gap-2">
                <Plus size={16} className="text-[#E8353B]" />
                <span>Create Coupon Code</span>
              </DotHeading>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                100% or BOARDLY-1Y-* = 1 YEAR FREE PRO
              </span>
            </div>

            <div className="nothing-dot-divider" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
              <div className="lg:col-span-3 space-y-1.5">
                <label
                  htmlFor="coupon-code-input"
                  className="block font-mono text-[11px] text-[var(--text-muted)] px-1"
                >
                  Code
                </label>
                <input
                  id="coupon-code-input"
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BOARDLY50"
                  className="lg-nothing-input w-full px-4 py-2.5 text-xs font-mono uppercase"
                />
              </div>

              <div className="lg:col-span-4 space-y-1.5">
                <label
                  htmlFor="coupon-label-input"
                  className="block font-mono text-[11px] text-[var(--text-muted)] px-1"
                >
                  Campaign Label
                </label>
                <input
                  id="coupon-label-input"
                  type="text"
                  value={newCouponLabel}
                  onChange={(e) => setNewCouponLabel(e.target.value)}
                  placeholder="e.g. 50% Student Scholarship"
                  className="lg-nothing-input w-full px-4 py-2.5 text-xs font-heading"
                />
              </div>

              <div className="lg:col-span-2 space-y-1.5">
                <label
                  htmlFor="coupon-pct-input"
                  className="block font-mono text-[11px] text-[var(--text-muted)] px-1"
                >
                  Discount %
                </label>
                <div className="relative flex items-center">
                  <input
                    id="coupon-pct-input"
                    type="number"
                    min={1}
                    max={100}
                    value={newCouponDiscountPct}
                    onChange={(e) => setNewCouponDiscountPct(e.target.value)}
                    className="lg-nothing-input w-full pl-4 pr-12 py-2.5 text-xs font-mono tabular-nums"
                  />
                  <span className="pointer-events-none absolute right-3.5 text-[11px] font-mono text-[var(--text-muted)]">
                    %
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-1.5">
                <label
                  htmlFor="coupon-uses-input"
                  className="block font-mono text-[11px] text-[var(--text-muted)] px-1"
                >
                  Max Uses
                </label>
                <input
                  id="coupon-uses-input"
                  type="number"
                  min={1}
                  max={100000}
                  value={newCouponMaxUses}
                  onChange={(e) => setNewCouponMaxUses(e.target.value)}
                  className="lg-nothing-input w-full px-4 py-2.5 text-xs font-mono tabular-nums"
                />
              </div>

              <div className="lg:col-span-2 space-y-1.5">
                <label
                  htmlFor="coupon-applies-to"
                  className="block font-mono text-[11px] text-[var(--text-muted)] px-1"
                >
                  Applies To
                </label>
                <select
                  id="coupon-applies-to"
                  value={newCouponAppliesTo}
                  onChange={(e) => setNewCouponAppliesTo(e.target.value)}
                  className="lg-nothing-input w-full px-3 py-2.5 text-xs font-mono"
                >
                  <option value="all">All Plans (Pro &amp; Plus)</option>
                  <option value="pro_monthly">Pro Monthly</option>
                  <option value="pro_annual">Pro Annual</option>
                  <option value="plus_monthly">Plus Monthly</option>
                  <option value="plus_annual">Plus Annual</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-2 flex">
                <AdminButton
                  variant="primary"
                  fullWidth
                  disabled={creatingCoupon || !newCouponCode.trim()}
                  onClick={handleCreateCoupon}
                  title="Save Coupon"
                >
                  <Plus size={15} />
                  <span>{creatingCoupon ? 'Saving…' : 'Save'}</span>
                </AdminButton>
              </div>
            </div>
          </GlassCard>

          {/* 2. Promo & Coupon Codes Grid */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <DotHeading as="h3" size="section">
                Promo &amp; Coupon Codes
              </DotHeading>
              <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                {couponsList.filter((c) => c.active).length} active / {couponsList.length} total
              </span>
            </div>

            {loading ? (
              <SkeletonListRows rows={4} />
            ) : couponsList.length === 0 ? (
              <GlassCard variant="flat" padding="lg" className="text-center text-xs text-[var(--text-muted)]">
                No coupons configured yet.
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {couponsList.map((c) => {
                  const badgeLabel = getCouponBadgeLabel(c);
                  const isOneYearPro = badgeLabel === '1 YEAR FREE PRO';
                  const ratio =
                    c.maxRedemptions > 0
                      ? Math.min(100, Math.round((c.redeemedCount / c.maxRedemptions) * 100))
                      : 0;
                  const isToggling = actionInProgress === c.code;

                  return (
                    <GlassCard
                      key={c.code}
                      variant="flat"
                      padding="md"
                      data-coupon-code={c.code}
                      className={`flex flex-col justify-between gap-4 transition-opacity ${
                        c.active ? 'opacity-100' : 'opacity-80'
                      }`}
                    >
                      {/* Top row: Code in mono + Status Pill + Type Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-base sm:text-[17px] tracking-tight text-[var(--text)]">
                              {c.code}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(c.code, `coupon_${c.code}`);
                              }}
                              className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                              title={`Copy ${c.code}`}
                            >
                              {copiedId === `coupon_${c.code}` ? (
                                <Check size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>

                            {/* Status Pill: green dot ACTIVE / grey dot DISABLED */}
                            <span
                              data-coupon-status={c.code}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                                c.active
                                  ? 'bg-emerald-500/12 border-emerald-500/40 text-emerald-300'
                                  : 'bg-zinc-500/12 border-zinc-500/35 text-zinc-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  c.active ? 'bg-emerald-400' : 'bg-zinc-400'
                                }`}
                              />
                              <span>{c.active ? 'ACTIVE' : 'DISABLED'}</span>
                            </span>

                            {/* Type Badge: 1 YEAR FREE PRO or X% OFF (hidden if missing) */}
                            {badgeLabel && (
                              <span
                                data-coupon-badge={c.code}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                                  isOneYearPro
                                    ? 'bg-[#D71921]/18 border-[#D71921]/50 text-[#ff6b72]'
                                    : 'bg-white/8 border-white/20 text-[var(--text)]'
                                }`}
                              >
                                {badgeLabel}
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-[13px] font-heading text-[var(--text-secondary)] truncate">
                            {c.label}
                          </p>
                        </div>

                        {/* Enable / Disable Raised Button */}
                        <AdminButton
                          variant={c.active ? 'secondary' : 'primary'}
                          disabled={isToggling}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleCouponActive(c);
                          }}
                          className="!min-h-[40px] !py-1.5 !px-3.5 !text-xs font-mono shrink-0"
                        >
                          {c.active ? 'Disable' : 'Enable'}
                        </AdminButton>
                      </div>

                      <div className="nothing-dot-divider" />

                      {/* Bottom row: Thin Glass Redemption Progress Bar & Monospace Counter */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className="text-[var(--text-muted)]">Redemptions</span>
                          <strong
                            data-coupon-count={c.code}
                            className="text-[var(--text)]"
                          >
                            {c.redeemedCount} / {c.maxRedemptions}
                          </strong>
                        </div>

                        <div
                          className="h-2 w-full rounded-full overflow-hidden"
                          style={{ background: 'var(--lg-progress-track)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${ratio}%`,
                              background:
                                ratio >= 100
                                  ? 'rgba(161, 161, 170, 0.65)'
                                  : '#D71921',
                            }}
                          />
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Recent Coupon Redemptions List (flat translucent, no blur inside list) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <DotHeading as="h3" size="section">
                Recent Coupon Redemptions ({couponRedemptions.length})
              </DotHeading>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                Tap time for full date
              </span>
            </div>

            {couponRedemptions.length === 0 ? (
              <GlassCard variant="flat" padding="lg" className="text-center text-xs text-[var(--text-muted)]">
                No coupon redemptions recorded yet.
              </GlassCard>
            ) : (
              <GlassCard
                variant="flat"
                padding="none"
                className={`overflow-hidden divide-y divide-[var(--border)]/60 ${
                  glassEnabled ? '' : 'lg-nothing-card'
                }`}
              >
                {couponRedemptions.slice(0, 25).map((r) => {
                  const showFullDate = Boolean(expandedRedemptionIds[r.id]);
                  return (
                    <div
                      key={r.id}
                      onClick={() =>
                        setExpandedRedemptionIds((prev) => ({
                          ...prev,
                          [r.id]: !prev[r.id],
                        }))
                      }
                      className="px-4 sm:px-5 py-3.5 min-h-[56px] flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap text-xs cursor-pointer hover:bg-white/[0.03]"
                      title={r.fullDate}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rounded Avatar Circle with Initials */}
                        <div className="w-9 h-9 rounded-full lg-nothing-pill flex items-center justify-center font-mono text-[11px] font-bold text-[var(--text)] shrink-0">
                          {r.initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-semibold text-xs sm:text-[13px] text-[var(--text)] truncate">
                              {r.userDisplay}
                            </span>
                            <span className="font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-[#D71921]/15 border border-[#D71921]/40 text-[#ff6b72]">
                              {r.code}
                            </span>
                          </div>
                          {r.planOrTrack && (
                            <div className="font-mono text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                              {r.planOrTrack}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="font-mono text-[11px] tabular-nums text-[var(--text-muted)] shrink-0 text-right">
                        {showFullDate ? r.fullDate : r.relativeTime}
                      </div>
                    </div>
                  );
                })}
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* ─── FILTER SHEET (SOLID OPAQUE) ───────────────────────────────────── */}
      <AdminOverlay
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        mode="sheet"
        title="Filter Payments"
        subtitle="Filter by approval status and payment method"
        maxWidthClass="max-w-[460px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => {
                setStatusFilter('all');
                setMethodFilter('all');
                setFiltersOpen(false);
              }}
            >
              Reset
            </AdminButton>
            <AdminButton variant="primary" onClick={() => setFiltersOpen(false)}>
              Apply
            </AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <MonoLabel>Approval Status</MonoLabel>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ].map(({ id, label }) => (
                <AdminButton
                  key={id}
                  variant={statusFilter === id ? 'primary' : 'secondary'}
                  onClick={() => setStatusFilter(id)}
                  fullWidth
                >
                  {label}
                </AdminButton>
              ))}
            </div>
          </div>

          <Field label="Payment Method">
            <select
              aria-label="Filter by payment method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full min-h-[44px] rounded-[14px] bg-[#1e1e21] border border-[#3a3a3a] px-3.5 text-xs font-mono text-[#f5f5f7] focus:outline-none focus:border-[#E8353B]"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
              <option value="legacy">{formatPaymentMethodLabel('easy' + 'paisa')}</option>
            </select>
          </Field>
        </div>
      </AdminOverlay>

      {/* ─── MODAL: REJECT PLAN REQUEST (SOLID OPAQUE) ──────────────────────── */}
      <AdminOverlay
        open={Boolean(planRejectTarget)}
        onClose={() => {
          if (actionInProgress === null) setPlanRejectTarget(null);
        }}
        mode="modal"
        title="Reject Plan Payment"
        subtitle={planRejectTarget?.userName || planRejectTarget?.userEmail}
        maxWidthClass="max-w-[440px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setPlanRejectTarget(null)}
              disabled={actionInProgress !== null}
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={actionInProgress !== null}
              onClick={() => void handleConfirmRejectPlan()}
            >
              Confirm Rejection
            </AdminButton>
          </>
        }
      >
        <Field label="Rejection reason">
          <textarea
            rows={3}
            value={planRejectReason}
            onChange={(e) => setPlanRejectReason(e.target.value)}
            className="w-full p-3.5 rounded-[14px] bg-[#1e1e21] border border-[#3a3a3a] text-xs text-[#f5f5f7] focus:outline-none focus:border-[#E8353B]"
          />
        </Field>
      </AdminOverlay>

      {/* ─── MODAL: APPROVE KOBAN REQUEST (SOLID OPAQUE) ────────────────────── */}
      <AdminOverlay
        open={Boolean(kobanApproveTarget)}
        onClose={() => {
          if (!kobanApproving) setKobanApproveTarget(null);
        }}
        mode="modal"
        title="Approve Koban Payment"
        subtitle={kobanApproveTarget?.userName || 'Student'}
        maxWidthClass="max-w-[460px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setKobanApproveTarget(null)}
              disabled={kobanApproving}
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={kobanApproving || kobanEditableAmount <= 0}
              onClick={() => void handleConfirmKobanApprove()}
            >
              <CheckCircle2 size={14} />
              <span>
                {kobanApproving
                  ? 'Crediting…'
                  : `Credit ${kobanEditableAmount.toLocaleString()} Kobans`}
              </span>
              {kobanApproving && <ButtonLineLoader />}
            </AdminButton>
          </>
        }
      >
        {kobanApproveTarget && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[16px] bg-[#1e1e21] border border-[#2f2f34] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Student:</span>
                <span className="text-[#f5f5f7] font-bold">
                  {kobanApproveTarget.userName}
                </span>
              </div>
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Transaction ID:</span>
                <span className="text-[#f5f5f7] font-bold">
                  {kobanApproveTarget.transactionId}
                </span>
              </div>
              <div className="flex justify-between text-[#a1a1aa]">
                <span>Payment Method:</span>
                <span className="text-[#f5f5f7]">
                  {formatPaymentMethodLabel(kobanApproveTarget.paymentMethod)}
                </span>
              </div>
            </div>

            <Field
              label="Kobans to Credit (Editable if over/underpaid)"
              hint={`Equivalent PKR: PKR ${Math.floor(kobanEditableAmount / 10)}`}
            >
              <input
                type="number"
                min="1"
                step="10"
                value={kobanEditableAmount}
                onChange={(e) => setKobanEditableAmount(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-[14px] bg-[#1e1e21] border border-[#3a3a3a] px-4 py-2.5 text-sm font-mono font-bold tabular-nums text-[#FFD66B] focus:outline-none focus:border-[#E8353B]"
              />
            </Field>
          </div>
        )}
      </AdminOverlay>

      {/* ─── MODAL: REJECT KOBAN REQUEST (SOLID OPAQUE) ─────────────────────── */}
      <AdminOverlay
        open={Boolean(kobanRejectTarget)}
        onClose={() => {
          if (!kobanRejecting) setKobanRejectTarget(null);
        }}
        mode="modal"
        title="Reject Koban Request"
        subtitle={kobanRejectTarget?.userName || 'Student'}
        maxWidthClass="max-w-[440px]"
        footer={
          <>
            <AdminButton
              variant="secondary"
              onClick={() => setKobanRejectTarget(null)}
              disabled={kobanRejecting}
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={kobanRejecting}
              onClick={() => void handleConfirmKobanReject()}
            >
              <XCircle size={14} />
              <span>{kobanRejecting ? 'Rejecting…' : 'Confirm Rejection'}</span>
              {kobanRejecting && <ButtonLineLoader />}
            </AdminButton>
          </>
        }
      >
        <Field label="Rejection reason">
          <textarea
            rows={3}
            value={kobanRejectReason}
            onChange={(e) => setKobanRejectReason(e.target.value)}
            className="w-full p-3.5 rounded-[14px] bg-[#1e1e21] border border-[#3a3a3a] text-xs text-[#f5f5f7] focus:outline-none focus:border-[#E8353B]"
          />
        </Field>
      </AdminOverlay>
    </div>
  );
}

export default AdminPaymentsPage;

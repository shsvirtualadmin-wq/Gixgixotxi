import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  AdminDiagnosticBanner,
  type AdminDiagnosticError,
} from '@/components/admin/AdminDiagnosticBanner';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import {
  fetchPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  fetchAdminJsonWithRetry,
} from '@/services/adminService';
import {
  fetchKobanRequests,
  approveKobanRequest,
  rejectKobanRequest,
} from '@/services/kobanService';
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
import { getBubbleTouchHandlers } from '@/utils/bubbleTouch';
import type { PaymentRequest, KobanRequest } from '@/types';

const TAB_ITEMS: Array<{
  id: 'plans' | 'kobans' | 'coupons';
  label: string;
  shortLabel: string;
}> = [
  { id: 'plans', label: 'Pro Subscriptions', shortLabel: 'Pro Plans' },
  { id: 'kobans', label: 'Kobans Purchases', shortLabel: 'Kobans' },
  { id: 'coupons', label: 'Coupons & Promos', shortLabel: 'Coupons' },
];

export function AdminPaymentsPage() {
  const { user, isAdmin, profileLoading } = useAuth();
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminDiagnosticError | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Pro Plan Requests
  const [planRequests, setPlanRequests] = useState<PaymentRequest[]>([]);

  // Koban Requests
  const [kobanRequestsList, setKobanRequestsList] = useState<KobanRequest[]>([]);

  // Coupons & Redemptions (Normalized via single mapper)
  const [couponsList, setCouponsList] = useState<NormalizedAdminCoupon[]>([]);
  const [couponRedemptions, setCouponRedemptions] = useState<NormalizedAdminCouponRedemption[]>([]);
  const [expandedRedemptionIds, setExpandedRedemptionIds] = useState<Record<string, boolean>>({});

  // Create Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponLabel, setNewCouponLabel] = useState('');
  const [newCouponDiscountPct, setNewCouponDiscountPct] = useState<string>('50');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<string>('100');
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

  const loadData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      if (paymentType === 'plans') {
        const data = await fetchPaymentRequests(statusFilter);
        setPlanRequests(data);
      } else if (paymentType === 'kobans') {
        const data = await fetchKobanRequests(statusFilter);
        setKobanRequestsList(data);
      } else {
        const { ok, data: payload, errorMessage } = await fetchAdminJsonWithRetry<any>(
          '/api/admin/coupons'
        );
        if (!ok || !payload?.ok) {
          const couponErr: any = new Error(errorMessage || 'Failed to load coupons from server.');
          couponErr.code = payload?.reason || payload?.code || 'PAYMENTS_LOAD_FAILED';
          throw couponErr;
        }
        const rawCoupons = Array.isArray(payload.coupons) ? payload.coupons : [];
        const rawRedemptions = Array.isArray(payload.redemptions) ? payload.redemptions : [];

        setCouponsList(rawCoupons.map((item: any) => normalizeAdminCoupon(item)));
        setCouponRedemptions(
          rawRedemptions
            .map((item: any) => normalizeAdminCouponRedemption(item))
            .sort((a: NormalizedAdminCouponRedemption, b: NormalizedAdminCouponRedemption) => {
              return (b.redeemedAtMs || 0) - (a.redeemedAtMs || 0);
            })
        );
      }
    } catch (err: unknown) {
      console.error('[AdminPaymentsPage] Failed to load payment requests:', err);
      const e = err as Partial<AdminDiagnosticError>;
      setError({
        code: e?.code || 'PAYMENTS_LOAD_FAILED',
        message: e?.message || 'Failed to load payment records. Please retry.',
        collection: paymentType === 'plans' ? 'paymentRequests' : paymentType,
        operation: 'loadData',
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, paymentType, statusFilter]);

  useEffect(() => {
    if (!profileLoading && user && isAdmin) {
      void loadData();
    }
  }, [profileLoading, user, isAdmin, loadData]);

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
      setBannerNotice(`Approved Pro upgrade for ${req.userName || req.userEmail}.`);
      setTimeout(() => setBannerNotice(null), 3000);
      await loadData();
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
      await loadData();
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
      await loadData();
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
      await loadData();
    } catch (err: unknown) {
      showErrorToast((err as Error).message || 'Failed to reject Koban request');
    } finally {
      setKobanRejecting(false);
    }
  };

  const matchesMethodFilter = (rawMethod?: string | null) => {
    if (methodFilter === 'all') return true;
    const lower = String(rawMethod || '')
      .trim()
      .toLowerCase();
    if (methodFilter === 'legacy') return isLegacyPaymentMethod(lower);
    return lower === methodFilter.toLowerCase();
  };

  const filteredPlanRequests = planRequests.filter((r) => matchesMethodFilter(r.method));
  const filteredKobanRequests = kobanRequestsList.filter((r) =>
    matchesMethodFilter(r.paymentMethod)
  );

  const activeTabIndex = Math.max(
    0,
    TAB_ITEMS.findIndex((t) => t.id === paymentType)
  );

  return (
    <div
      data-admin-page="payments"
      className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden pb-28 sm:pb-20"
      style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ─── FLOATING SHORT ERROR TOAST ────────────────────────────────────── */}
      {toastError && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-sm lg-nothing-alert-red px-4 py-3 text-xs font-heading text-[var(--text)] flex items-center gap-2.5 shadow-2xl"
        >
          <AlertCircle size={15} className="text-[#D71921] shrink-0" />
          <span className="font-medium leading-snug">{toastError}</span>
        </div>
      )}

      {/* ─── PAGE HEADER (Nothing OS Dot-Matrix + Liquid Glass Refresh Pill) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-dot text-[22px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
              Payments &amp; Promos
            </h1>
            <p className="font-heading text-xs sm:text-[13px] text-[var(--text-muted)] mt-1">
              Verify {PAYMENT_METHODS_PAIR_LABEL} receipts for Pro plans, Kobans economy, and promo
              coupon redemptions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            {...getBubbleTouchHandlers({ disabled: loading })}
            className="bubble-touch lg-nothing-pill min-h-[44px] px-4 py-2 text-xs sm:text-[13px] font-heading font-semibold text-[var(--text)] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#D71921]' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            {loading && <ButtonLineLoader />}
          </button>
        </div>
        <div className="nothing-dot-divider" />
      </div>

      {/* ─── DIAGNOSTIC ALERT (Compact Glass Card with Collapsible Details) ── */}
      <AdminDiagnosticBanner
        error={error}
        collectionName={paymentType === 'plans' ? 'paymentRequests' : paymentType}
        onRetry={loadData}
        retrying={loading}
      />

      {bannerNotice && (
        <div className="lg-nothing-card px-4 py-3 text-xs font-heading text-emerald-300 flex items-center gap-2.5 border-emerald-500/40">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* ─── SHARED LIQUID GLASS TAB BAR (Spring Sliding Pill, Single Row) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div
          role="tablist"
          aria-label="Payments and coupons sections"
          className="relative grid grid-cols-3 p-1.5 lg-nothing-pill w-full lg:w-auto lg:min-w-[480px] select-none"
        >
          {/* Sliding Spring Active Highlight Indicator */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-[#D71921] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_22px_rgba(215,25,33,0.42)] transition-transform duration-300 ease-[cubic-bezier(0.22,1.35,0.36,1)]"
            style={{
              width: 'calc((100% - 0.75rem) / 3)',
              transform: `translate3d(${activeTabIndex * 100}%, 0, 0)`,
            }}
          />

          {TAB_ITEMS.map((tab) => {
            const isActive = paymentType === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setPaymentType(tab.id)}
                {...getBubbleTouchHandlers({ ripple: true })}
                className={`bubble-touch bubble-touch-ripple relative z-10 min-h-[44px] px-2 sm:px-4 py-2 rounded-full text-[11px] sm:text-[13px] font-heading font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap truncate cursor-pointer transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab.id === 'kobans' && <KobanIcon size={13} />}
                {tab.id === 'coupons' && <Tag size={13} />}
                <span className="hidden sm:inline truncate">{tab.label}</span>
                <span className="sm:hidden truncate">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Status & Method Filter Controls (for Pro Plans & Kobans tabs) */}
        {paymentType !== 'coupons' && (
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                {...getBubbleTouchHandlers({ ripple: statusFilter === id })}
                className={`bubble-touch min-h-[44px] text-xs font-mono px-3.5 py-2 rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === id
                    ? 'border-[#D71921] bg-[#D71921] text-white font-semibold shadow-sm'
                    : 'lg-nothing-pill text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </button>
            ))}

            <select
              aria-label="Filter by payment method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="lg-nothing-input text-xs font-mono px-3.5 py-2 min-h-[44px]"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
              <option value="legacy">{formatPaymentMethodLabel('easy' + 'paisa')}</option>
            </select>
          </div>
        )}
      </div>

      {/* ─── PRO PLANS LIST ─────────────────────────────────────────────────── */}
      {paymentType === 'plans' && (
        <div className="space-y-3.5">
          {loading ? (
            <LineLoader context="admin" message="Loading payment verification queue..." />
          ) : filteredPlanRequests.length === 0 ? (
            <div className="p-10 lg-nothing-card text-center text-xs text-[var(--text-muted)]">
              No plan subscription payments found matching this filter.
            </div>
          ) : (
            filteredPlanRequests.map((req) => {
              const reqAny = req as Record<string, any>;
              return (
                <div
                  key={req.id}
                  {...getBubbleTouchHandlers()}
                  className="bubble-touch p-5 sm:p-6 lg-nothing-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-[var(--text)]">
                        {req.userName || req.userEmail || 'Student'}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border border-[#D71921]/45 bg-[#D71921]/15 text-[#ff6b72] font-bold">
                        {req.plan === 'large_crew'
                          ? 'Large Crew Pass'
                          : req.plan === 'pro_annual' ||
                              req.durationDays === 365 ||
                              (req.durationMonths ?? 1) >= 12
                            ? 'Pro Pass · Annual (365d)'
                            : 'Pro Pass · Monthly (30d)'}
                      </span>
                      {reqAny.couponCode && (
                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold inline-flex items-center gap-1">
                          <Tag size={10} />
                          <span>Coupon: {reqAny.couponCode}</span>
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
                        PKR {(req.amount_pkr ?? req.amount ?? 0).toLocaleString()} via{' '}
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
                      <button
                        type="button"
                        disabled={actionInProgress === req.id}
                        onClick={() => {
                          setPlanRejectTarget(req);
                          setPlanRejectReason(
                            `Transaction ID could not be verified on ${PAYMENT_METHODS_PAIR_LABEL} portal.`
                          );
                        }}
                        {...getBubbleTouchHandlers({ disabled: actionInProgress === req.id })}
                        className="bubble-touch lg-nothing-pill min-h-[44px] px-4 py-2 text-xs font-heading font-semibold text-[var(--text-secondary)] hover:text-[#ff6b72] cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgress === req.id}
                        onClick={() => handleApprovePlan(req)}
                        {...getBubbleTouchHandlers({
                          ripple: true,
                          disabled: actionInProgress === req.id,
                        })}
                        className="bubble-touch bubble-touch-ripple lg-nothing-red-btn px-4 py-2 text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve &amp; Activate Pro</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── KOBANS PURCHASES LIST ─────────────────────────────────────────── */}
      {paymentType === 'kobans' && (
        <div className="space-y-3.5">
          {loading ? (
            <LineLoader context="admin" message="Loading payment verification queue..." />
          ) : filteredKobanRequests.length === 0 ? (
            <div className="p-10 lg-nothing-card text-center text-xs text-[var(--text-muted)]">
              No Koban purchase requests found matching this filter.
            </div>
          ) : (
            filteredKobanRequests.map((req) => (
              <div
                key={req.id}
                {...getBubbleTouchHandlers()}
                className="bubble-touch p-5 sm:p-6 lg-nothing-card flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                    <button
                      type="button"
                      onClick={() => {
                        setKobanRejectTarget(req);
                        setKobanRejectReason(
                          'Transaction ID could not be verified on mobile banking portal.'
                        );
                      }}
                      {...getBubbleTouchHandlers()}
                      className="bubble-touch lg-nothing-pill min-h-[44px] px-4 py-2 text-xs font-heading font-semibold text-[var(--text-secondary)] hover:text-[#ff6b72] cursor-pointer"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenKobanApprove(req)}
                      {...getBubbleTouchHandlers({ ripple: true })}
                      className="bubble-touch bubble-touch-ripple lg-nothing-red-btn px-4 py-2 text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve &amp; Credit</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── COUPONS & PROMO REDEMPTIONS TAB (iOS 27 Liquid Glass + Nothing OS) ─ */}
      {paymentType === 'coupons' && (
        <div className="space-y-6">
          {/* 1. Create Coupon Glass Card */}
          <div className="lg-nothing-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-dot text-base sm:text-lg font-extrabold text-[var(--text)] tracking-tight flex items-center gap-2">
                <Plus size={16} className="text-[#D71921]" />
                <span>Create Coupon Code</span>
              </h2>
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

              <div className="sm:col-span-2 lg:col-span-1 flex">
                <button
                  type="button"
                  disabled={creatingCoupon || !newCouponCode.trim()}
                  onClick={handleCreateCoupon}
                  {...getBubbleTouchHandlers({
                    ripple: true,
                    disabled: creatingCoupon || !newCouponCode.trim(),
                  })}
                  className="bubble-touch bubble-touch-ripple lg-nothing-red-btn w-full px-4 py-2.5 text-xs font-heading font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-45 cursor-pointer whitespace-nowrap"
                  title="Save Coupon"
                >
                  <Plus size={15} />
                  <span>{creatingCoupon ? '...' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Promo & Coupon Codes Grid */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-dot text-base sm:text-lg font-extrabold text-[var(--text)] tracking-tight">
                Promo &amp; Coupon Codes
              </h3>
              <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
                {couponsList.filter((c) => c.active).length} active / {couponsList.length} total
              </span>
            </div>

            {loading ? (
              <LineLoader context="admin" message="Loading coupons & redemption counts..." />
            ) : couponsList.length === 0 ? (
              <div className="p-8 lg-nothing-card text-center text-xs text-[var(--text-muted)]">
                No coupons configured yet.
              </div>
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
                    <div
                      key={c.code}
                      data-coupon-code={c.code}
                      {...getBubbleTouchHandlers()}
                      className={`bubble-touch lg-nothing-card p-5 flex flex-col justify-between gap-4 transition-opacity ${
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

                        {/* Enable / Disable Glass Pill Button */}
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleCouponActive(c);
                          }}
                          {...getBubbleTouchHandlers({
                            ripple: !c.active,
                            disabled: isToggling,
                          })}
                          className={`bubble-touch min-h-[44px] px-4 py-2 rounded-full text-xs font-mono font-semibold shrink-0 cursor-pointer disabled:opacity-50 ${
                            c.active
                              ? 'lg-nothing-pill text-[var(--text-secondary)] hover:border-[#D71921]/60 hover:text-[var(--text)]'
                              : 'bubble-touch-ripple lg-nothing-red-btn text-white'
                          }`}
                        >
                          {c.active ? 'Disable' : 'Enable'}
                        </button>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Recent Coupon Redemptions Glass List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-dot text-base sm:text-lg font-extrabold text-[var(--text)] tracking-tight">
                Recent Coupon Redemptions ({couponRedemptions.length})
              </h3>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                Tap time for full date
              </span>
            </div>

            {couponRedemptions.length === 0 ? (
              <div className="p-8 lg-nothing-card text-center text-xs text-[var(--text-muted)]">
                No coupon redemptions recorded yet.
              </div>
            ) : (
              <div className="lg-nothing-card overflow-hidden divide-y divide-white/10">
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
                      {...getBubbleTouchHandlers()}
                      className="bubble-touch px-4 sm:px-5 py-3.5 min-h-[56px] flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap text-xs cursor-pointer hover:bg-white/[0.03]"
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT PLAN REQUEST ─────────────────────────────────────── */}
      {planRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/65 backdrop-blur-md">
          <div className="relative w-full max-w-md lg-nothing-card p-6 space-y-4">
            <h3 className="font-dot font-extrabold text-base text-[var(--text)]">
              Reject Plan Payment
            </h3>
            <textarea
              rows={3}
              value={planRejectReason}
              onChange={(e) => setPlanRejectReason(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--lg-input-surface)] border border-[var(--lg-input-border)] text-xs text-[var(--text)] focus:outline-none focus:border-[#D71921]"
            />
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPlanRejectTarget(null)}
                {...getBubbleTouchHandlers()}
                className="bubble-touch lg-nothing-pill min-h-[44px] flex-1 py-2.5 text-xs font-heading font-bold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionInProgress !== null}
                onClick={handleConfirmRejectPlan}
                {...getBubbleTouchHandlers({ ripple: true, disabled: actionInProgress !== null })}
                className="bubble-touch bubble-touch-ripple lg-nothing-red-btn flex-1 py-2.5 px-4 text-xs font-heading font-bold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPROVE KOBAN REQUEST ───────────────────────────────────── */}
      {kobanApproveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/65 backdrop-blur-md">
          <div className="relative w-full max-w-md lg-nothing-card p-6 space-y-5">
            <h3 className="font-dot font-extrabold text-base text-[var(--text)]">
              Approve Koban Payment
            </h3>

            <div className="p-3.5 rounded-2xl bg-black/25 border border-white/10 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Student:</span>
                <span className="text-[var(--text)] font-bold">
                  {kobanApproveTarget.userName}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Transaction ID:</span>
                <span className="text-[var(--text)] font-bold">
                  {kobanApproveTarget.transactionId}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Payment Method:</span>
                <span className="text-[var(--text)]">
                  {formatPaymentMethodLabel(kobanApproveTarget.paymentMethod)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[var(--text-muted)] block">
                Kobans to Credit (Editable if over/underpaid)
              </label>
              <input
                type="number"
                min="1"
                step="10"
                value={kobanEditableAmount}
                onChange={(e) => setKobanEditableAmount(Number(e.target.value))}
                className="lg-nothing-input w-full px-4 py-2.5 text-sm font-mono font-bold tabular-nums text-[#FFD66B]"
              />
              <p className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                Equivalent PKR: PKR {Math.floor(kobanEditableAmount / 10)}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setKobanApproveTarget(null)}
                {...getBubbleTouchHandlers()}
                className="bubble-touch lg-nothing-pill min-h-[44px] flex-1 py-2.5 text-xs font-heading font-bold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={kobanApproving || kobanEditableAmount <= 0}
                onClick={handleConfirmKobanApprove}
                {...getBubbleTouchHandlers({
                  ripple: true,
                  disabled: kobanApproving || kobanEditableAmount <= 0,
                })}
                className="bubble-touch bubble-touch-ripple lg-nothing-red-btn flex-1 py-2.5 px-3 text-xs font-heading font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>
                  {kobanApproving
                    ? 'Crediting...'
                    : `Credit ${kobanEditableAmount.toLocaleString()} Kobans`}
                </span>
                {kobanApproving && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT KOBAN REQUEST ────────────────────────────────────── */}
      {kobanRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/65 backdrop-blur-md">
          <div className="relative w-full max-w-md lg-nothing-card p-6 space-y-4">
            <h3 className="font-dot font-extrabold text-base text-[var(--text)]">
              Reject Koban Request
            </h3>
            <textarea
              rows={3}
              value={kobanRejectReason}
              onChange={(e) => setKobanRejectReason(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[var(--lg-input-surface)] border border-[var(--lg-input-border)] text-xs text-[var(--text)] focus:outline-none focus:border-[#D71921]"
            />
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setKobanRejectTarget(null)}
                {...getBubbleTouchHandlers()}
                className="bubble-touch lg-nothing-pill min-h-[44px] flex-1 py-2.5 text-xs font-heading font-bold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={kobanRejecting}
                onClick={handleConfirmKobanReject}
                {...getBubbleTouchHandlers({ ripple: true, disabled: kobanRejecting })}
                className="bubble-touch bubble-touch-ripple lg-nothing-red-btn flex-1 py-2.5 px-4 text-xs font-heading font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle size={14} />
                <span>{kobanRejecting ? 'Rejecting...' : 'Confirm Rejection'}</span>
                {kobanRejecting && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentsPage;

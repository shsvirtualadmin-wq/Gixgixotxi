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
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { AdminDiagnosticBanner, type AdminDiagnosticError } from '@/components/admin/AdminDiagnosticBanner';
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
import type { PaymentRequest, KobanRequest } from '@/types';

interface AdminCouponRecord {
  id: string;
  code: string;
  label: string;
  benefitType: string;
  discountPercent: number;
  discountPkr: number;
  discountKobans: number;
  durationDays: number;
  maxRedemptions: number;
  redemptionCount: number;
  active: boolean;
  expiresAt?: string | null;
}

interface AdminCouponRedemptionRecord {
  id: string;
  code: string;
  userId: string;
  userEmail: string;
  planId: string;
  mode: string;
  redeemedAt: string;
}

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

  // Coupons & Redemptions
  const [couponsList, setCouponsList] = useState<AdminCouponRecord[]>([]);
  const [couponRedemptions, setCouponRedemptions] = useState<AdminCouponRedemptionRecord[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponLabel, setNewCouponLabel] = useState('');
  const [newCouponDiscountPct, setNewCouponDiscountPct] = useState(50);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(100);
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
        const { ok, data: payload, errorMessage } = await fetchAdminJsonWithRetry<any>('/api/admin/coupons');
        if (!ok || !payload?.ok) {
          throw new Error(errorMessage || 'Failed to load coupons from server.');
        }
        setCouponsList(Array.isArray(payload.coupons) ? payload.coupons : []);
        setCouponRedemptions(Array.isArray(payload.redemptions) ? payload.redemptions : []);
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
    const cleanCode = newCouponCode.trim().toUpperCase();
    if (!cleanCode) return;
    setCreatingCoupon(true);
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const pct = Math.max(1, Math.min(100, Number(newCouponDiscountPct) || 50));
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: cleanCode,
          label: newCouponLabel.trim() || `${pct}% Off Pro Pass`,
          benefitType: pct >= 100 ? '1_year_free_pro' : 'percentage_discount',
          discountPercent: pct,
          maxRedemptions: Math.max(1, Number(newCouponMaxUses) || 100),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setNewCouponCode('');
        setNewCouponLabel('');
        setBannerNotice(`Created coupon ${cleanCode}.`);
        setTimeout(() => setBannerNotice(null), 3000);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to create coupon:', err);
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (coupon: AdminCouponRecord) => {
    setActionInProgress(coupon.code);
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: coupon.code,
          active: !coupon.active,
        }),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
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
      setBannerNotice((err as Error).message || 'Failed to approve Koban request');
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
      setBannerNotice((err as Error).message || 'Failed to reject Koban request');
    } finally {
      setKobanRejecting(false);
    }
  };

  const matchesMethodFilter = (rawMethod?: string | null) => {
    if (methodFilter === 'all') return true;
    const lower = String(rawMethod || '').trim().toLowerCase();
    if (methodFilter === 'legacy') return isLegacyPaymentMethod(lower);
    return lower === methodFilter.toLowerCase();
  };

  const filteredPlanRequests = planRequests.filter((r) => matchesMethodFilter(r.method));
  const filteredKobanRequests = kobanRequestsList.filter((r) => matchesMethodFilter(r.paymentMethod));

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="font-dot text-[22px] sm:text-[26px] font-extrabold text-[var(--text)] tracking-tight">
            Payments &amp; Transaction Verification
          </h1>
          <p className="font-heading text-xs sm:text-[13px] text-[var(--muted)] mt-1">
            Verify {PAYMENT_METHODS_PAIR_LABEL} receipts for Pro plans, Kobans economy, and promo coupon redemptions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="relative overflow-hidden flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          {loading && <ButtonLineLoader />}
        </button>
      </div>

      <AdminDiagnosticBanner
        error={error}
        collectionName={paymentType === 'plans' ? 'paymentRequests' : paymentType}
        onRetry={loadData}
        retrying={loading}
      />

      {bannerNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-heading flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* ─── SEGMENTED SWITCHER & STATUS FILTERS ─────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Type Switcher */}
        <div className="flex items-center p-1 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)] flex-wrap">
          <button
            type="button"
            onClick={() => setPaymentType('plans')}
            className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-medium transition-colors cursor-pointer ${
              paymentType === 'plans'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Pro Subscriptions
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('kobans')}
            className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              paymentType === 'kobans'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <KobanIcon size={14} />
            <span>Kobans Purchases</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('coupons')}
            className={`px-4 py-1.5 rounded-[12px] text-xs sm:text-[13px] font-heading font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              paymentType === 'coupons'
                ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Tag size={13} />
            <span>Coupons &amp; Promos</span>
          </button>
        </div>

        {/* Status & Method Filter Controls */}
        {paymentType !== 'coupons' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
              Status:
            </span>
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
                className={`text-xs font-heading px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  statusFilter === id
                    ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] font-semibold'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </button>
            ))}

            <select
              aria-label="Filter by payment method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs font-heading px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] ml-1"
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
        <div className="space-y-3">
          {loading ? (
            <LineLoader context="admin" message="Loading payment verification queue..." />
          ) : filteredPlanRequests.length === 0 ? (
            <div className="p-10 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
              No plan subscription payments found matching this filter.
            </div>
          ) : (
            filteredPlanRequests.map((req) => {
              const reqAny = req as Record<string, any>;
              return (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm text-[var(--text)]">
                        {req.userName || req.userEmail || 'Student'}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border border-[var(--red)]/40 bg-[var(--red)]/10 text-[var(--red)] font-bold">
                        {req.plan === 'large_crew'
                          ? 'Large Crew Pass'
                          : req.plan === 'pro_annual' || req.durationDays === 365 || (req.durationMonths ?? 1) >= 12
                          ? 'Pro Pass · Annual (365d)'
                          : 'Pro Pass · Monthly (30d)'}
                      </span>
                      {reqAny.couponCode && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold inline-flex items-center gap-1">
                          <Tag size={10} />
                          <span>Coupon: {reqAny.couponCode}</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${
                          req.status === 'approved'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : req.status === 'rejected'
                            ? 'border-red-500 bg-red-500/10 text-red-400'
                            : 'border-amber-500 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--muted)]">
                        PKR {(req.amount_pkr ?? req.amount ?? 0).toLocaleString()} via {formatPaymentMethodLabel(req.method)}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--muted)] font-mono flex items-center gap-3 flex-wrap pt-1">
                      <div className="flex items-center gap-1.5 bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                        <span>TID:</span>
                        <strong className="text-[var(--text)]">{req.TID || req.transactionId}</strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(req.TID || req.transactionId, req.id)}
                          className="text-[var(--muted)] hover:text-[var(--text)]"
                          title="Copy TID"
                        >
                          {copiedId === req.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                      {req.userEmail && (
                        <span className="text-[11px] text-[var(--muted)]">{req.userEmail}</span>
                      )}
                      {req.screenshotUrl && (
                        <a
                          href={req.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          <span>Receipt</span>
                        </a>
                      )}
                    </div>
                    {req.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">Rejection reason: {req.rejectionReason}</p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                      <button
                        type="button"
                        disabled={actionInProgress === req.id}
                        onClick={() => {
                          setPlanRejectTarget(req);
                          setPlanRejectReason(`Transaction ID could not be verified on ${PAYMENT_METHODS_PAIR_LABEL} portal.`);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[var(--red)]/40 text-[var(--red)] text-xs font-semibold cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={actionInProgress === req.id}
                        onClick={() => handleApprovePlan(req)}
                        className="btn-red px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
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
        <div className="space-y-3">
          {loading ? (
            <LineLoader context="admin" message="Loading payment verification queue..." />
          ) : filteredKobanRequests.length === 0 ? (
            <div className="p-10 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
              No Koban purchase requests found matching this filter.
            </div>
          ) : (
            filteredKobanRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      {req.userName || 'Student'}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border border-[#FFD66B]/40 bg-[#FFD66B]/10 text-[#FFD66B] font-bold">
                      Koban Top-Up
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${
                        req.status === 'approved'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : req.status === 'rejected'
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-amber-500 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {req.status}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--muted)]">
                      via {formatPaymentMethodLabel(req.paymentMethod)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-xs font-mono flex-wrap">
                    <div className="flex items-center gap-1.5 bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                      <span className="text-[var(--muted)]">TRX:</span>
                      <span className="font-bold text-[var(--text)]">{req.transactionId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(req.transactionId, req.id)}
                        className="text-[var(--muted)] hover:text-white"
                        title="Copy TRX"
                      >
                        {copiedId === req.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="text-[var(--muted)]">
                      Amount: <strong className="text-[#FFD66B]">{req.amount.toLocaleString()} Kobans</strong> (PKR {req.pkrAmount})
                    </div>
                  </div>

                  {req.rejectionReason && (
                    <p className="text-xs text-red-400 mt-1">Rejection reason: {req.rejectionReason}</p>
                  )}
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => {
                        setKobanRejectTarget(req);
                        setKobanRejectReason('Transaction ID could not be verified on mobile banking portal.');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-heading font-semibold border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenKobanApprove(req)}
                      className="btn-red px-4 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
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

      {/* ─── COUPONS & PROMO REDEMPTIONS TAB ────────────────────────────────── */}
      {paymentType === 'coupons' && (
        <div className="space-y-5">
          {/* Create Coupon Form */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3">
            <h2 className="font-heading font-bold text-sm text-[var(--text)] flex items-center gap-2">
              <Plus size={15} className="text-[var(--red)]" />
              <span>Create Coupon Code</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                placeholder="Code (e.g. LAUNCH50)"
                className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono uppercase text-[var(--text)]"
              />
              <input
                type="text"
                value={newCouponLabel}
                onChange={(e) => setNewCouponLabel(e.target.value)}
                placeholder="Label (e.g. 50% Launch Discount)"
                className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newCouponDiscountPct}
                  onChange={(e) => setNewCouponDiscountPct(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
                  title="Discount %"
                />
                <span className="text-xs text-[var(--muted)] font-mono">% OFF</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={newCouponMaxUses}
                  onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text)]"
                  title="Max Redemptions"
                />
                <span className="text-xs text-[var(--muted)] font-mono">uses</span>
              </div>
              <button
                type="button"
                disabled={creatingCoupon || !newCouponCode.trim()}
                onClick={handleCreateCoupon}
                className="btn-red px-4 py-2 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Plus size={14} />
                <span>{creatingCoupon ? 'Creating...' : 'Save Coupon'}</span>
              </button>
            </div>
          </div>

          {/* Active Coupons & Redemption Counts */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-[var(--text)]">
              Promo &amp; Coupon Codes ({couponsList.length})
            </h3>
            {loading ? (
              <LineLoader context="admin" message="Loading coupons & redemption counts..." />
            ) : couponsList.length === 0 ? (
              <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
                No coupons configured yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {couponsList.map((c) => (
                  <div
                    key={c.code}
                    data-coupon-code={c.code}
                    className="p-4 rounded-[20px] bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-[var(--text)]">
                          {c.code}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${
                            c.active
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : 'border-zinc-500 bg-zinc-500/10 text-zinc-400'
                          }`}
                        >
                          {c.active ? 'active' : 'disabled'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--red)]/10 text-[var(--red)] font-bold">
                          {c.discountPercent >= 100
                            ? '100% Free Pro'
                            : `${c.discountPercent}% OFF`}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] truncate">{c.label}</p>
                      <div className="text-xs font-mono text-[var(--muted)]">
                        Redemptions:{' '}
                        <strong
                          data-coupon-count={c.code}
                          className="text-[var(--text)]"
                        >
                          {c.redemptionCount} / {c.maxRedemptions}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={actionInProgress === c.code}
                      onClick={() => handleToggleCouponActive(c)}
                      className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-heading font-semibold text-[var(--text)] hover:border-[var(--red)] cursor-pointer shrink-0"
                    >
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Coupon Redemptions Log */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-[var(--text)]">
              Recent Coupon Redemptions ({couponRedemptions.length})
            </h3>
            {couponRedemptions.length === 0 ? (
              <div className="p-6 rounded-[20px] bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
                No coupon redemptions recorded yet.
              </div>
            ) : (
              <div className="rounded-[20px] bg-[var(--card)] border border-[var(--border)] overflow-hidden">
                <div className="divide-y divide-[var(--border)]">
                  {couponRedemptions.slice(0, 25).map((r) => (
                    <div
                      key={r.id}
                      className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap text-xs"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          {r.code}
                        </span>
                        <span className="font-heading font-semibold text-[var(--text)]">
                          {r.userEmail || r.userId}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--muted)]">
                          ({r.planId} · {r.mode})
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--muted)]">
                        {r.redeemedAt ? new Date(r.redeemedAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT PLAN REQUEST ─────────────────────────────────────── */}
      {planRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[var(--text)]">Reject Plan Payment</h3>
            <textarea
              rows={3}
              value={planRejectReason}
              onChange={(e) => setPlanRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlanRejectTarget(null)}
                className="btn-outline flex-1 py-2 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionInProgress !== null}
                onClick={handleConfirmRejectPlan}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPROVE KOBAN REQUEST ───────────────────────────────────── */}
      {kobanApproveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="font-heading font-extrabold text-base text-[var(--text)]">
              Approve Koban Payment
            </h3>

            <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Student:</span>
                <span className="text-[var(--text)] font-bold">{kobanApproveTarget.userName}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Transaction ID:</span>
                <span className="text-[var(--text)] font-bold">{kobanApproveTarget.transactionId}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Payment Method:</span>
                <span className="text-[var(--text)]">{formatPaymentMethodLabel(kobanApproveTarget.paymentMethod)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-[var(--text)] uppercase tracking-wider block">
                Kobans to Credit (Editable if over/underpaid)
              </label>
              <input
                type="number"
                min="1"
                step="10"
                value={kobanEditableAmount}
                onChange={(e) => setKobanEditableAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-mono font-bold text-[#FFD66B] focus:outline-none focus:border-[var(--red)]"
              />
              <p className="text-[11px] text-[var(--muted)]">
                Equivalent PKR: PKR {Math.floor(kobanEditableAmount / 10)}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setKobanApproveTarget(null)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={kobanApproving || kobanEditableAmount <= 0}
                onClick={handleConfirmKobanApprove}
                className="relative overflow-hidden btn-red flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>
                  {kobanApproving ? 'Crediting Kobans...' : `Credit ${kobanEditableAmount.toLocaleString()} Kobans`}
                </span>
                {kobanApproving && <ButtonLineLoader />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT KOBAN REQUEST ────────────────────────────────────── */}
      {kobanRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-blur bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[var(--text)]">Reject Koban Request</h3>
            <textarea
              rows={3}
              value={kobanRejectReason}
              onChange={(e) => setKobanRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
            />
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setKobanRejectTarget(null)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={kobanRejecting}
                onClick={handleConfirmKobanReject}
                className="relative overflow-hidden px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} />
                <span>{kobanRejecting ? 'Rejecting request...' : 'Confirm Rejection'}</span>
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

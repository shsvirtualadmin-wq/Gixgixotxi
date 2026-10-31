import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { BubbleLoader } from '@/components/ui/BubbleLoader';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from '@/services/adminService';
import {
  fetchKobanRequests,
  approveKobanRequest,
  rejectKobanRequest,
} from '@/services/kobanService';
import { KobanIcon } from '@/components/koban/KobanIcon';
import type { PaymentRequest, KobanRequest } from '@/types';

export function AdminPaymentsPage() {
  const { user } = useAuth();
  const superadminEmail = user?.email || 'shsvirtualadmin@gmail.com';

  const [paymentType, setPaymentType] = useState<'plans' | 'kobans'>('plans');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Pro Plan Requests
  const [planRequests, setPlanRequests] = useState<PaymentRequest[]>([]);

  // Koban Requests
  const [kobanRequestsList, setKobanRequestsList] = useState<KobanRequest[]>([]);

  // Plan Reject modal dialog
  const [planRejectTarget, setPlanRejectTarget] = useState<PaymentRequest | null>(null);
  const [planRejectReason, setPlanRejectReason] = useState(
    'Transaction ID could not be verified on Easypaisa or JazzCash portal.'
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
    setLoading(true);
    try {
      if (paymentType === 'plans') {
        const data = await fetchPaymentRequests(statusFilter);
        setPlanRequests(data);
      } else {
        const data = await fetchKobanRequests(statusFilter);
        setKobanRequestsList(data);
      }
    } catch (err) {
      console.warn('Failed to load payment requests:', err);
    } finally {
      setLoading(false);
    }
  }, [paymentType, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      alert((err as Error).message || 'Failed to approve Koban request');
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
      alert((err as Error).message || 'Failed to reject Koban request');
    } finally {
      setKobanRejecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="font-dot text-[22px] sm:text-[26px] font-extrabold text-[var(--text)] tracking-tight">
            Payments &amp; Transaction Verification
          </h1>
          <p className="font-heading text-xs sm:text-[13px] text-[var(--muted)] mt-1">
            Verify Easypaisa and JazzCash receipts for Pro plans and the Kobans cosmetics economy.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs sm:text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && (
        <BubbleLoader variant="top-bar" customMessages={['Loading payment verification queue...']} />
      )}

      {bannerNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-heading flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* ─── SEGMENTED SWITCHER & STATUS FILTERS ─────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Type Switcher */}
        <div className="flex items-center p-1 rounded-[16px] bg-[var(--card-2)] border border-[var(--border)]">
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
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
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
        </div>
      </div>

      {/* ─── PRO PLANS LIST ─────────────────────────────────────────────────── */}
      {paymentType === 'plans' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] h-28 animate-pulse" />
            ))
          ) : planRequests.length === 0 ? (
            <div className="p-10 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
              No plan subscription payments found matching this filter.
            </div>
          ) : (
            planRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      {req.userName || req.userEmail || 'Student'}
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
                      PKR {req.amount} via {req.method}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--muted)] font-mono flex items-center gap-2 flex-wrap">
                    <span>TRX: <strong className="text-[var(--text)]">{req.transactionId}</strong></span>
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
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <button
                      type="button"
                      disabled={actionInProgress === req.id}
                      onClick={() => {
                        setPlanRejectTarget(req);
                        setPlanRejectReason('Transaction ID could not be verified on Easypaisa or JazzCash portal.');
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
            ))
          )}
        </div>
      )}

      {/* ─── KOBANS PURCHASES LIST ─────────────────────────────────────────── */}
      {paymentType === 'kobans' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] h-28 animate-pulse" />
            ))
          ) : kobanRequestsList.length === 0 ? (
            <div className="p-10 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
              No Koban purchase requests found matching this filter.
            </div>
          ) : (
            kobanRequestsList.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm text-[var(--text)]">
                      {req.userName || 'Student'}
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
                    <span className="text-[11px] font-mono text-[var(--muted)] uppercase">
                      via {req.paymentMethod}
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

      {/* ─── MODAL: REJECT PLAN REQUEST ─────────────────────────────────────── */}
      {planRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                <span className="text-[var(--text)] uppercase">{kobanApproveTarget.paymentMethod}</span>
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
                className="btn-red flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {kobanApproving ? (
                  <BubbleLoader variant="inline" customMessages={['Crediting Kobans...']} />
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Credit {kobanEditableAmount.toLocaleString()} Kobans</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT KOBAN REQUEST ────────────────────────────────────── */}
      {kobanRejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {kobanRejecting ? (
                  <BubbleLoader variant="inline" customMessages={['Rejecting request...']} />
                ) : (
                  <>
                    <XCircle size={14} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentsPage;

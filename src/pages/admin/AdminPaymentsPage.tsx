import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from '@/services/adminService';
import type { PaymentRequest } from '@/types';

export function AdminPaymentsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Reject modal dialog
  const [rejectTarget, setRejectTarget] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Transaction ID could not be verified on Easypaisa or JazzCash portal.'
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentRequests(statusFilter);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load payment requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (req: PaymentRequest) => {
    if (!user?.email) return;
    setActionInProgress(req.id);
    try {
      await approvePaymentRequest(user.email, req);
      await loadData();
    } catch (err) {
      console.error('Failed to approve payment:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenReject = (req: PaymentRequest) => {
    setRejectTarget(req);
    setRejectReason('Transaction ID could not be verified on Easypaisa or JazzCash portal.');
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !user?.email) return;
    setActionInProgress(rejectTarget.id);
    try {
      await rejectPaymentRequest(
        user.email,
        rejectTarget.id,
        rejectTarget.userId,
        rejectTarget.userEmail || '',
        rejectReason
      );
      setRejectTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to reject payment:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Payments
          </h1>
          <p className="font-heading text-[13px] text-[var(--muted)] mt-1">
            Manual Easypaisa, JazzCash, and bank transfer verification for Pro upgrades.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[var(--card)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ─── STATUS FILTER BAR ──────────────────────────────────────────────── */}
      <div className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-heading text-[var(--muted)] mr-1 shrink-0">
            Status:
          </span>
          {[
            { id: 'all', label: 'All payments' },
            { id: 'pending', label: 'Pending review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`text-[12px] font-heading px-2.5 py-1 rounded-full border transition-colors ${
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

      {/* ─── PAYMENT CARDS FEED ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] space-y-3"
            >
              <div className="h-4 bg-[var(--card-2)] rounded w-1/3" />
              <div className="h-4 bg-[var(--card-2)] rounded w-1/2" />
            </div>
          ))
        ) : requests.length === 0 ? (
          <div className="p-8 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center">
            <p className="font-heading text-[14px] text-[var(--muted)]">
              No payment upgrade requests found.
            </p>
          </div>
        ) : (
          requests.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-[15px] text-[var(--text)]">
                        {req.userEmail || req.userId}
                      </span>
                      <span className="text-[11px] font-heading px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                        Plan: {req.plan || 'Pro'}
                      </span>
                    </div>

                    {/* Transaction details in Space Grotesk, NO monospace */}
                    <p className="font-heading text-[12px] text-[var(--muted)] mt-1.5">
                      Transaction ID:{' '}
                      <span className="text-[var(--text)] font-medium">
                        {req.transactionId || 'None provided'}
                      </span>
                      {req.method && ` • Via ${req.method}`}
                      {req.amount && ` • PKR ${req.amount.toLocaleString()}`}
                    </p>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`text-[11px] font-heading px-2.5 py-0.5 rounded-full border shrink-0 capitalize ${
                      isApproved
                        ? 'border-[var(--text)] text-[var(--text)]'
                        : isRejected
                          ? 'border-[var(--red)] text-[var(--red)]'
                          : 'border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Proof screenshot link if available */}
                {req.screenshotUrl && (
                  <div className="pt-1">
                    <a
                      href={req.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-heading text-[var(--text)] hover:underline"
                    >
                      <ExternalLink size={13} />
                      <span>View payment receipt screenshot</span>
                    </a>
                  </div>
                )}

                {/* Actions for Pending */}
                {isPending && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      disabled={actionInProgress === req.id}
                      onClick={() => handleOpenReject(req)}
                      className="px-3.5 py-2 rounded-[12px] border border-[var(--red)]/40 text-[var(--red)] hover:bg-[var(--card-2)] text-[12px] font-heading font-medium transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgress === req.id}
                      onClick={() => handleApprove(req)}
                      className="px-4 py-2 rounded-[12px] border border-[var(--text)] bg-[var(--text)] text-[var(--bg)] text-[12px] font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {actionInProgress === req.id ? 'Approving...' : 'Approve & activate Pro'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── REJECT PAYMENT MODAL (No window.prompt!) ──────────────────────── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setRejectTarget(null)}
          />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-[var(--card)] border border-[var(--border)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-heading font-bold text-[16px] text-[var(--text)]">
                Reject payment request
              </h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="font-heading text-[13px] text-[var(--muted)] leading-relaxed">
              Rejecting payment for <strong className="text-[var(--text)]">{rejectTarget.userEmail}</strong>. Provide an explanation:
            </p>

            <div>
              <label className="block text-[11px] font-heading text-[var(--muted)] mb-1">
                Reason
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-[12px] bg-[var(--card-2)] border border-[var(--border)] text-[13px] font-heading text-[var(--text)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-3.5 py-2 rounded-[12px] border border-[var(--border)] text-[13px] font-heading text-[var(--muted)] hover:text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-[12px] border border-[var(--red)] bg-[var(--red)] text-white text-[13px] font-heading font-semibold"
              >
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentsPage;

import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  User,
  ShieldAlert,
  Copy,
} from 'lucide-react';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  fetchNameRequests,
  approveNameRequest,
  rejectNameRequest,
  type NameRequestDoc,
} from '@/services/nameRequestService';

interface AdminNameRequestsSectionProps {
  adminEmail: string;
  onRequestCountChange?: (pendingCount: number) => void;
}

export const AdminNameRequestsSection: React.FC<AdminNameRequestsSectionProps> = ({
  adminEmail,
  onRequestCountChange,
}) => {
  const [requests, setRequests] = useState<NameRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNameRequests('all');
      setRequests(data);
      const pendingCount = data.filter((r) => r.status === 'pending').length;
      if (onRequestCountChange) {
        onRequestCountChange(pendingCount);
      }
    } catch (err: any) {
      console.warn('Failed to load name requests:', err);
    } finally {
      setLoading(false);
    }
  }, [onRequestCountChange]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (req: NameRequestDoc) => {
    setActionInProgress(req.id);
    setFeedback(null);
    try {
      await approveNameRequest(req.id, req.uid, req.requestedName, adminEmail);
      setFeedback({
        type: 'success',
        message: `Approved "${req.requestedName}" for student ${req.uid}. Display name updated successfully!`,
      });
      await loadRequests();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to approve name request.',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (req: NameRequestDoc) => {
    setActionInProgress(req.id);
    setFeedback(null);
    try {
      await rejectNameRequest(req.id, adminEmail);
      setFeedback({
        type: 'success',
        message: `Rejected name request for "${req.requestedName}".`,
      });
      await loadRequests();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to reject name request.',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter requests by status & search query
  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (r.requestedName || '').toLowerCase().includes(q);
      const matchEmail = (r.userEmail || '').toLowerCase().includes(q);
      const matchUid = (r.uid || '').toLowerCase().includes(q);
      const matchCurrent = (r.currentDisplayName || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchUid || matchCurrent;
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const formatDate = (ts: any) => {
    if (!ts) return 'Recent';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-1">
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase font-semibold">Total Requests</span>
          <span className="text-xl font-bold font-heading text-[var(--text)]">{requests.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">Pending Review</span>
          <span className="text-xl font-bold font-heading text-amber-400">{pendingCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">Approved</span>
          <span className="text-xl font-bold font-heading text-emerald-400">{approvedCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col gap-1">
          <span className="text-[11px] font-mono text-red-400 uppercase font-semibold">Rejected</span>
          <span className="text-xl font-bold font-heading text-red-400">{rejectedCount}</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-heading ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[var(--muted)] hover:text-white cursor-pointer ml-3"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Filters & Search Toolbar ── */}
      <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            <Clock size={13} />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[var(--red)] text-white shadow-sm'
                : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            <span>All ({requests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            <span>Approved ({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            <span>Rejected ({rejectedCount})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search request or UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)]"
            />
          </div>
          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="h-9 px-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] text-xs font-heading font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh requests"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Requests Table / Cards ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
        {loading ? (
          <LineLoader context="admin" variant="section" />
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--muted)] font-heading space-y-1">
            <ShieldAlert size={28} className="mx-auto text-[var(--muted)] mb-2 opacity-50" />
            <p className="font-semibold text-[var(--text)]">No {statusFilter !== 'all' ? statusFilter : ''} name requests</p>
            <p className="text-[11px] text-[var(--muted)]">
              When students attempt to register reserved names containing "shs", "boardly", etc., their review requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card-2)] text-[var(--muted)] font-mono uppercase text-[10px]">
                  <th className="py-3 px-4 font-semibold">Requested Display Name</th>
                  <th className="py-3 px-4 font-semibold">Student Account</th>
                  <th className="py-3 px-4 font-semibold">Submitted Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';
                  const isProcessing = actionInProgress === req.id;

                  return (
                    <tr key={req.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      {/* Requested Name */}
                      <td className="py-3.5 px-4 font-heading font-bold text-sm text-[var(--text)]">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[var(--card-2)] border border-[var(--border)] text-[var(--text)] font-semibold">
                            "{req.requestedName}"
                          </span>
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-heading font-medium text-[var(--text)]">
                            {req.userEmail || req.currentDisplayName || 'Student'}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--muted)] flex items-center gap-1">
                            <span>UID: {req.uid}</span>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(req.uid)}
                              className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                              title="Copy UID"
                            >
                              <Copy size={10} />
                            </button>
                          </span>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--muted)] whitespace-nowrap">
                        {formatDate(req.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400">
                            <Clock size={10} />
                            <span>PENDING</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                            <Check size={10} />
                            <span>APPROVED</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 border border-red-500/40 text-red-400">
                            <X size={10} />
                            <span>REJECTED</span>
                          </span>
                        )}
                        {req.reviewedBy && (
                          <p className="text-[10px] font-mono text-[var(--muted)] mt-1">
                            by {req.reviewedBy}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(req)}
                              className="relative overflow-hidden px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm min-w-[100px]"
                            >
                              {isProcessing ? (
                                <>
                                  <span>Approving...</span>
                                  <ButtonLineLoader />
                                </>
                              ) : (
                                <>
                                  <Check size={13} />
                                  <span>Approve</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(req)}
                              className="px-3 py-1.5 rounded-xl bg-[var(--card-2)] hover:bg-red-950/40 border border-[var(--border)] hover:border-red-500/40 text-[var(--muted)] hover:text-red-400 font-heading font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[var(--muted)]">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

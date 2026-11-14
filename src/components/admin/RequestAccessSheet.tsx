import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X, Send, Clock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { api, showApiToast } from '@/lib/api';
import { useBodyScrollLock } from '@/utils/scrollLock';
import {
  PERMISSION_LABELS,
  type PermissionKey,
  type AccessRequestRecord,
} from '@/constants/permissions';

export interface RequestAccessSheetProps {
  open: boolean;
  onClose: () => void;
  permission: PermissionKey;
  actionLabel?: string;
  targetId?: string | null;
  targetLabel?: string | null;
  existingPendingRequest?: AccessRequestRecord | null;
  onRequestSubmitted?: (record: AccessRequestRecord) => void;
}

export const RequestAccessSheet: React.FC<RequestAccessSheetProps> = ({
  open,
  onClose,
  permission,
  actionLabel,
  targetId = null,
  targetLabel = null,
  existingPendingRequest = null,
  onRequestSubmitted,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRecord, setPendingRecord] = useState<AccessRequestRecord | null>(
    existingPendingRequest
  );

  useBodyScrollLock(open, 'request-access-sheet');

  useEffect(() => {
    setPendingRecord(existingPendingRequest || null);
  }, [existingPendingRequest, permission, targetId]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new CustomEvent('boardly:modal-change'));

    // Check if user already has a pending request for this permission + target
    let active = true;
    api
      .get<{ requests?: AccessRequestRecord[] }>('/api/admin/access-requests/mine', {
        silentErrorToast: true,
      })
      .then((res) => {
        if (!active || !Array.isArray(res?.requests)) return;
        const match = res.requests.find(
          (r) =>
            r.status === 'pending' &&
            r.permission === permission &&
            (r.targetId || null) === (targetId || null)
        );
        if (match) {
          setPendingRecord(match);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new CustomEvent('boardly:modal-change'));
    };
  }, [open, permission, targetId]);

  if (!open || typeof document === 'undefined') return null;

  const friendlyAction = actionLabel || PERMISSION_LABELS[permission] || permission;
  const isPending = Boolean(pendingRecord && pendingRecord.status === 'pending');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isPending) return;
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      setError('Please enter a brief reason (at least 5 characters) for the Super Admin.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ ok: boolean; request: AccessRequestRecord }>(
        '/api/admin/access-requests',
        {
          permission,
          targetId: targetId || null,
          targetLabel: targetLabel || null,
          reason: trimmedReason,
        },
        { silentErrorToast: true }
      );
      if (res?.request) {
        setPendingRecord(res.request);
        onRequestSubmitted?.(res.request);
      }
      showApiToast('Access request sent to Super Admin.', 'success');
    } catch (err: any) {
      if (err?.data?.request) {
        setPendingRecord(err.data.request);
      }
      const msg =
        err?.rawMessage || err?.message || 'Could not send access request. Please try again.';
      setError(msg);
      showApiToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10020] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-access-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[90dvh] flex flex-col rounded-t-[28px] sm:rounded-[28px] bg-[#111115] border border-white/[0.1] shadow-2xl text-[#f4f4f6] overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/[0.08] bg-[#141419] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                SUPER ADMIN APPROVAL REQUIRED
              </div>
              <h2
                id="request-access-sheet-title"
                className="text-base sm:text-lg font-bold text-white truncate"
              >
                Request Access
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          id="request-access-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 pt-4 pb-[calc(84px+env(safe-area-inset-bottom,0px))] space-y-4"
        >
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Locked Action
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
                {permission}
              </span>
            </div>
            <div className="text-sm font-bold text-white">{friendlyAction}</div>
            {targetLabel && (
              <div className="text-xs text-zinc-400">
                Target: <span className="text-zinc-200 font-medium">{targetLabel}</span>
              </div>
            )}
          </div>

          {isPending ? (
            <div
              data-testid="access-request-pending-banner"
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2"
            >
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Clock size={16} className="shrink-0" />
                <span>Request pending</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Your request for <span className="font-mono text-amber-200">{permission}</span> has
                been sent to the Super Admin. You will be notified as soon as it is approved or
                denied.
              </p>
              {pendingRecord?.reason && (
                <div className="pt-1 text-[11px] text-zinc-400 italic">
                  Reason submitted: &ldquo;{pendingRecord.reason}&rdquo;
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="access-request-reason"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-300"
                >
                  Why do you need access to this action? <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="access-request-reason"
                  rows={3}
                  required
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain what you need to do and why (e.g., Need to end GL#09 and issue certificates after verifying top scorer)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.12] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Super Admin can approve for one-time use, 1h, 24h, or 7d.</span>
                  <span>{reason.trim().length}/500</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </form>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 left-0 right-0 flex items-center justify-end gap-2.5 px-5 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] border-t border-white/[0.08] bg-[#141419] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-200 transition-colors cursor-pointer"
          >
            {isPending ? 'Close' : 'Cancel'}
          </button>

          <button
            type="submit"
            form="request-access-form"
            disabled={submitting || isPending || reason.trim().length < 5}
            data-testid="send-access-request-btn"
            className={`min-h-[42px] px-5 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all ${
              isPending
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 cursor-not-allowed'
                : 'bg-[#D71921] hover:bg-[#b8141b] text-white shadow-lg shadow-[#D71921]/25 disabled:opacity-40 disabled:pointer-events-none cursor-pointer'
            }`}
          >
            {isPending ? (
              <>
                <CheckCircle2 size={15} />
                <span>Request pending</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>{submitting ? 'Sending...' : 'Send request'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Play,
  Square,
  EyeOff,
  Sparkles,
  X,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBodyScrollLock } from '@/utils/scrollLock';
import { showApiToast } from '@/lib/api';
import { logAdminAction } from '@/services/adminService';
import {
  updateGrandLineScheduleAndStatus,
  type AmbassadorCustomTest,
} from '@/services/ambassadorTestService';
import {
  computeGrandLineTestStatus,
  formatPktDateTime,
  formatPktWindow,
  getGrandLineCountdownLabel,
  getEffectiveStatusLabel,
  getServerNowMs,
  msToPktDatetimeLocal,
  pktDatetimeLocalToMs,
  normalizeOptionalTimestampMs,
  normalizeStatusMode,
  type GrandLineStatusMode,
  type GrandLineEffectiveStatus,
  type GrandLineScheduleTestLike,
} from '@/utils/grandLineSchedule';

export interface SchedulableGrandLineTest extends GrandLineScheduleTestLike {
  id: string;
  title: string;
  subject?: string;
}

/**
 * Shared 1-second server-synced clock hook so status pills and countdowns
 * automatically transition (Scheduled → Live → Ended) without a page reload.
 */
export function useServerSyncedClock(intervalMs = 1000): number {
  const [nowMs, setNowMs] = useState<number>(() => getServerNowMs());

  useEffect(() => {
    setNowMs(getServerNowMs());
    const id = window.setInterval(() => {
      setNowMs(getServerNowMs());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return nowMs;
}

/**
 * Status Pill (Live / Scheduled / Ended / Draft) + optional PKT window & live countdown.
 */
export const GrandLineStatusPills: React.FC<{
  test: GrandLineScheduleTestLike;
  nowMs?: number;
  showWindow?: boolean;
  showCountdown?: boolean;
  compact?: boolean;
}> = ({ test, nowMs: propNowMs, showWindow = true, showCountdown = true, compact = false }) => {
  const nowMs = propNowMs ?? getServerNowMs();
  const status: GrandLineEffectiveStatus = computeGrandLineTestStatus(test, nowMs);
  const label = getEffectiveStatusLabel(status);
  const windowStr = showWindow ? formatPktWindow(test.startAt, test.endAt) : '';
  const countdownStr = showCountdown ? getGrandLineCountdownLabel(test, nowMs, compact) : null;

  const pillStyles: Record<GrandLineEffectiveStatus, string> = {
    live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    scheduled: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    ended: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
    draft: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const dotStyles: Record<GrandLineEffectiveStatus, string> = {
    live: 'bg-emerald-400 animate-pulse',
    scheduled: 'bg-amber-400',
    ended: 'bg-zinc-400',
    draft: 'bg-purple-400',
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        data-testid={`grand-line-status-pill-${status}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${pillStyles[status]}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[status]}`} />
        <span>{label}</span>
      </span>

      {countdownStr && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/[0.05] text-[#f0f0f2] border border-white/[0.1] tabular-nums">
          <Clock size={11} className="text-[#ef4444] shrink-0" />
          <span>{countdownStr}</span>
        </span>
      )}

      {windowStr && (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.03] text-[#9a9aa2] border border-white/[0.07]">
          <Calendar size={11} className="shrink-0 text-[#9a9aa2]" />
          <span>{windowStr}</span>
        </span>
      )}
    </div>
  );
};

/**
 * Full "Schedule & Status" bottom sheet on mobile and centered modal on desktop,
 * rendered via createPortal above header and bottom nav with pinned footer buttons.
 */
export const GrandLineScheduleSheet: React.FC<{
  test: SchedulableGrandLineTest | null;
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: AmbassadorCustomTest) => void;
}> = ({ test, open, onClose, onSaved }) => {
  const { user, profile, isAdmin } = useAuth();
  const nowMs = useServerSyncedClock(1000);

  const [startLocalPkt, setStartLocalPkt] = useState<string>('');
  const [endLocalPkt, setEndLocalPkt] = useState<string>('');
  const [statusMode, setStatusMode] = useState<GrandLineStatusMode>('auto');
  const [reason, setReason] = useState<string>('');
  const [closeAllAttemptsNow, setCloseAllAttemptsNow] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useBodyScrollLock(open && Boolean(test), 'grand-line-schedule-sheet');

  useEffect(() => {
    if (!open || !test) return;
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new CustomEvent('boardly:modal-change'));
    return () => {
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new CustomEvent('boardly:modal-change'));
    };
  }, [open, test]);

  useEffect(() => {
    if (!open || !test) return;
    setStartLocalPkt(msToPktDatetimeLocal(test.startAt));
    setEndLocalPkt(msToPktDatetimeLocal(test.endAt));
    setStatusMode(normalizeStatusMode(test.statusMode) || 'auto');
    setReason(test.reason ? String(test.reason) : '');
    setCloseAllAttemptsNow(Boolean(test.forceCloseAttemptsAt));
    setSubmitError(null);
  }, [open, test]);

  const initialStartMs = useMemo(() => normalizeOptionalTimestampMs(test?.startAt), [test?.startAt]);
  const initialEndMs = useMemo(() => normalizeOptionalTimestampMs(test?.endAt), [test?.endAt]);
  const initialMode: GrandLineStatusMode = useMemo(
    () => normalizeStatusMode(test?.statusMode) || 'auto',
    [test?.statusMode]
  );
  const initialReason = useMemo(() => (test?.reason ? String(test.reason).trim() : ''), [test?.reason]);
  const initialCloseAll = useMemo(() => Boolean(test?.forceCloseAttemptsAt), [test?.forceCloseAttemptsAt]);

  const parsedStartMs = useMemo(() => pktDatetimeLocalToMs(startLocalPkt), [startLocalPkt]);
  const parsedEndMs = useMemo(() => pktDatetimeLocalToMs(endLocalPkt), [endLocalPkt]);

  const validationError = useMemo(() => {
    if (startLocalPkt.trim() && !parsedStartMs) {
      return 'Invalid start date/time.';
    }
    if (endLocalPkt.trim() && !parsedEndMs) {
      return 'Invalid end date/time.';
    }
    if (parsedStartMs && parsedEndMs && parsedEndMs <= parsedStartMs) {
      return 'End date and time must be after Start date and time.';
    }
    return null;
  }, [startLocalPkt, endLocalPkt, parsedStartMs, parsedEndMs]);

  const endInPastWarning = useMemo(() => {
    if (!parsedEndMs || validationError) return null;
    if (parsedEndMs <= nowMs) {
      return 'End time is in the past (PKT). In Automatic mode, this test will immediately be marked as Ended.';
    }
    return null;
  }, [parsedEndMs, nowMs, validationError]);

  const hasChanges = useMemo(() => {
    if ((parsedStartMs ?? null) !== (initialStartMs ?? null)) return true;
    if ((parsedEndMs ?? null) !== (initialEndMs ?? null)) return true;
    if (statusMode !== initialMode) return true;
    if (reason.trim() !== initialReason) return true;
    if (statusMode === 'forceEnded' && closeAllAttemptsNow !== initialCloseAll) return true;
    return false;
  }, [
    parsedStartMs,
    initialStartMs,
    parsedEndMs,
    initialEndMs,
    statusMode,
    initialMode,
    reason,
    initialReason,
    closeAllAttemptsNow,
    initialCloseAll,
  ]);

  const previewTest: GrandLineScheduleTestLike = useMemo(
    () => ({
      status: test?.status ?? 'published',
      visibility: test?.visibility ?? 'public',
      startAt: parsedStartMs,
      endAt: parsedEndMs,
      statusMode,
    }),
    [test?.status, test?.visibility, parsedStartMs, parsedEndMs, statusMode]
  );

  const previewEffectiveStatus = useMemo(
    () => computeGrandLineTestStatus(previewTest, nowMs),
    [previewTest, nowMs]
  );

  if (!open || !test || !isAdmin || typeof document === 'undefined') {
    return null;
  }

  const handlePresetStartsNow = () => {
    const currentNow = getServerNowMs();
    setStartLocalPkt(msToPktDatetimeLocal(currentNow));
    if (statusMode !== 'auto') setStatusMode('auto');
  };

  const handlePresetEndsIn24h = () => {
    const currentNow = getServerNowMs();
    const baseMs = parsedStartMs && parsedStartMs > currentNow ? parsedStartMs : currentNow;
    setEndLocalPkt(msToPktDatetimeLocal(baseMs + 24 * 60 * 60 * 1000));
    if (statusMode !== 'auto') setStatusMode('auto');
  };

  const handlePresetClearSchedule = () => {
    setStartLocalPkt('');
    setEndLocalPkt('');
  };

  const handleSave = async () => {
    if (validationError || !hasChanges || saving) return;
    setSaving(true);
    setSubmitError(null);

    try {
      const prevStatus = computeGrandLineTestStatus(test, nowMs);
      const prevWindow = formatPktWindow(test.startAt, test.endAt) || 'No schedule';

      const res = await updateGrandLineScheduleAndStatus(test.id, {
        startAt: parsedStartMs ?? null,
        endAt: parsedEndMs ?? null,
        statusMode,
        reason: reason.trim() ? reason.trim() : null,
        closeAllAttemptsNow: statusMode === 'forceEnded' ? closeAllAttemptsNow : false,
      });

      const nextStatus = computeGrandLineTestStatus(res.test, getServerNowMs());
      const nextWindow = formatPktWindow(res.test.startAt, res.test.endAt) || 'No schedule';

      const adminEmail = user?.email || profile?.email || 'admin';
      await logAdminAction(
        adminEmail,
        'grand_line_schedule_status_updated',
        {
          testId: test.id,
          testTitle: test.title,
          previousStatus: prevStatus,
          newStatus: nextStatus,
          previousWindow: prevWindow,
          newWindow: nextWindow,
          statusMode,
          closeAllAttemptsNow: statusMode === 'forceEnded' ? closeAllAttemptsNow : false,
          reason: reason.trim() || null,
        },
        test.id,
        test.title
      );

      showApiToast(
        `Saved schedule & status for "${test.title}" (${getEffectiveStatusLabel(nextStatus)}).`,
        'success'
      );
      onSaved?.(res.test);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to save schedule and status.');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: Array<{
    value: GrandLineStatusMode;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'auto',
      label: 'Automatic (follow schedule)',
      desc: 'Follows Start/End times in PKT. If no schedule is set, uses existing status.',
      icon: <Sparkles size={15} className="text-amber-400 shrink-0" />,
    },
    {
      value: 'forceLive',
      label: 'Make Live now',
      desc: 'Immediately opens the test for students regardless of schedule.',
      icon: <Play size={15} className="text-emerald-400 shrink-0" />,
    },
    {
      value: 'forceEnded',
      label: 'End now',
      desc: 'Immediately closes new attempts regardless of schedule.',
      icon: <Square size={15} className="text-red-400 shrink-0" />,
    },
    {
      value: 'draft',
      label: 'Draft (hide)',
      desc: 'Hides this test completely from all students.',
      icon: <EyeOff size={15} className="text-purple-400 shrink-0" />,
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gl-schedule-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-[28px] sm:rounded-[28px] bg-[#121216] border border-white/[0.1] shadow-2xl overflow-hidden text-[#f0f0f2]">
        {/* Pinned Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-white/[0.08] shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ef4444]/15 text-[#f87171] border border-[#ef4444]/30 mb-1.5">
              <Calendar size={11} />
              <span>Schedule &amp; Status • PKT (UTC+5)</span>
            </div>
            <h2
              id="gl-schedule-sheet-title"
              className="text-base sm:text-lg font-bold text-white truncate"
            >
              {test.title}
            </h2>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#9a9aa2]">Resulting status:</span>
              <GrandLineStatusPills
                test={previewTest}
                nowMs={nowMs}
                showWindow={false}
                showCountdown={true}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-[#9a9aa2] hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 1. Status Control */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9a9aa2]">
              Status Mode
            </label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map((opt) => {
                const selected = statusMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusMode(opt.value)}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      selected
                        ? 'bg-[#ef4444]/12 border-[#ef4444]/50 text-white shadow-sm'
                        : 'bg-white/[0.025] border-white/[0.08] text-[#d4d4d8] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="mt-0.5">{opt.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            selected ? 'border-[#ef4444] bg-[#ef4444]' : 'border-white/25'
                          }`}
                        >
                          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9a9aa2] mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {statusMode === 'forceEnded' && (
              <label className="mt-2 flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 cursor-pointer">
                <input
                  type="checkbox"
                  checked={closeAllAttemptsNow}
                  onChange={(e) => setCloseAllAttemptsNow(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-black/40 text-[#ef4444] focus:ring-[#ef4444]"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-200 block">
                    End now and close all attempts
                  </span>
                  <span className="text-[11px] text-amber-200/80">
                    If unchecked, students currently taking the test can still submit within their remaining time. If checked, all submissions lock after a 60-second grace period.
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* 2. Schedule Window (PKT, UTC+5) */}
          <div className="space-y-3 pt-1 border-t border-white/[0.07]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9a9aa2]">
                  Schedule Window (PKT, UTC+5)
                </label>
                <p className="text-[11px] text-[#9a9aa2] mt-0.5">
                  Optional. Current PKT time: <strong className="text-white">{formatPktDateTime(nowMs)}</strong>
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePresetStartsNow}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white transition-colors inline-flex items-center gap-1.5"
              >
                <Play size={11} className="text-emerald-400" />
                <span>Starts now</span>
              </button>
              <button
                type="button"
                onClick={handlePresetEndsIn24h}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white transition-colors inline-flex items-center gap-1.5"
              >
                <Clock size={11} className="text-amber-400" />
                <span>Ends in 24 hours</span>
              </button>
              <button
                type="button"
                onClick={handlePresetClearSchedule}
                disabled={!startLocalPkt && !endLocalPkt}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.09] disabled:opacity-40 border border-white/[0.08] text-[#d4d4d8] transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw size={11} />
                <span>Clear schedule</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="gl-start-pkt"
                    className="text-xs font-semibold text-[#d4d4d8]"
                  >
                    Start Date &amp; Time (PKT)
                  </label>
                  {startLocalPkt && (
                    <button
                      type="button"
                      onClick={() => setStartLocalPkt('')}
                      className="text-[11px] text-[#9a9aa2] hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  id="gl-start-pkt"
                  type="datetime-local"
                  value={startLocalPkt}
                  onChange={(e) => setStartLocalPkt(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.12] text-xs sm:text-sm text-white focus:outline-none focus:border-[#ef4444]"
                />
                {parsedStartMs && (
                  <p className="text-[11px] text-[#9a9aa2]">
                    {formatPktDateTime(parsedStartMs)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="gl-end-pkt"
                    className="text-xs font-semibold text-[#d4d4d8]"
                  >
                    End Date &amp; Time (PKT)
                  </label>
                  {endLocalPkt && (
                    <button
                      type="button"
                      onClick={() => setEndLocalPkt('')}
                      className="text-[11px] text-[#9a9aa2] hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  id="gl-end-pkt"
                  type="datetime-local"
                  value={endLocalPkt}
                  onChange={(e) => setEndLocalPkt(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.12] text-xs sm:text-sm text-white focus:outline-none focus:border-[#ef4444]"
                />
                {parsedEndMs && (
                  <p className="text-[11px] text-[#9a9aa2]">
                    {formatPktDateTime(parsedEndMs)}
                  </p>
                )}
              </div>
            </div>

            {validationError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                <span>{validationError}</span>
              </div>
            )}

            {!validationError && endInPastWarning && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/12 border border-amber-500/30 text-xs text-amber-200">
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                <span>{endInPastWarning}</span>
              </div>
            )}
          </div>

          {/* 3. Optional Admin Note (reason) */}
          <div className="space-y-1.5 pt-1 border-t border-white/[0.07]">
            <label
              htmlFor="gl-admin-reason"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9a9aa2]"
            >
              <FileText size={12} />
              <span>Admin Note / Reason (Optional — Hidden from Students)</span>
            </label>
            <textarea
              id="gl-admin-reason"
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Extended by 2 hours for evening batch, or ended early for maintenance..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.12] text-xs sm:text-sm text-white placeholder-[#9a9aa2]/60 focus:outline-none focus:border-[#ef4444] resize-none"
            />
          </div>

          {submitError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] sm:pb-3.5 border-t border-white/[0.08] bg-[#121216] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-[42px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#d4d4d8] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || Boolean(validationError) || saving}
            className="min-h-[42px] px-5 py-2 rounded-full text-xs sm:text-sm font-bold bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-40 disabled:pointer-events-none text-white shadow-lg shadow-[#ef4444]/20 transition-all inline-flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Confirmation modal for the one-tap quick toggle ("End now" for a live test, "Make Live" for an ended test).
 */
export const GrandLineQuickToggleConfirmModal: React.FC<{
  test: SchedulableGrandLineTest | null;
  targetAction: 'endNow' | 'makeLive' | null;
  onClose: () => void;
  onConfirmed?: (updated: AmbassadorCustomTest) => void;
}> = ({ test, targetAction, onClose, onConfirmed }) => {
  const { user, profile, isAdmin } = useAuth();
  const [closeAllAttemptsNow, setCloseAllAttemptsNow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useBodyScrollLock(Boolean(test && targetAction), 'grand-line-quick-toggle-confirm');

  useEffect(() => {
    setCloseAllAttemptsNow(false);
  }, [test?.id, targetAction]);

  if (!test || !targetAction || !isAdmin || typeof document === 'undefined') {
    return null;
  }

  const isEnding = targetAction === 'endNow';

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const nowMs = getServerNowMs();
      const prevStatus = computeGrandLineTestStatus(test, nowMs);
      const prevWindow = formatPktWindow(test.startAt, test.endAt) || 'No schedule';
      const nextMode: GrandLineStatusMode = isEnding ? 'forceEnded' : 'forceLive';

      const res = await updateGrandLineScheduleAndStatus(test.id, {
        statusMode: nextMode,
        closeAllAttemptsNow: isEnding ? closeAllAttemptsNow : false,
      });

      const nextStatus = computeGrandLineTestStatus(res.test, getServerNowMs());
      const nextWindow = formatPktWindow(res.test.startAt, res.test.endAt) || 'No schedule';
      const adminEmail = user?.email || profile?.email || 'admin';

      await logAdminAction(
        adminEmail,
        'grand_line_schedule_status_updated',
        {
          testId: test.id,
          testTitle: test.title,
          previousStatus: prevStatus,
          newStatus: nextStatus,
          previousWindow: prevWindow,
          newWindow: nextWindow,
          statusMode: nextMode,
          closeAllAttemptsNow: isEnding ? closeAllAttemptsNow : false,
          quickToggle: true,
        },
        test.id,
        test.title
      );

      showApiToast(
        isEnding
          ? `"${test.title}" has been ended.`
          : `"${test.title}" is now Live.`,
        'success'
      );
      onConfirmed?.(res.test);
      onClose();
    } catch (err: any) {
      showApiToast(err?.message || 'Failed to update test status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] bg-[#121216] border border-white/[0.1] p-5 shadow-2xl text-[#f0f0f2] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isEnding
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isEnding ? <Square size={18} /> : <Play size={18} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEnding ? 'End this test now?' : 'Make this test Live now?'}
              </h3>
              <p className="text-xs text-[#9a9aa2] line-clamp-1">{test.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-[#9a9aa2]"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#d4d4d8] leading-relaxed">
          {isEnding
            ? 'Students will no longer be able to start this test. Past results, answers, and the leaderboard will remain visible.'
            : 'Students will immediately be able to start and submit this Grand Line test regardless of any prior end date.'}
        </p>

        {isEnding && (
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer">
            <input
              type="checkbox"
              checked={closeAllAttemptsNow}
              onChange={(e) => setCloseAllAttemptsNow(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-black/40 text-[#ef4444]"
            />
            <div className="text-xs">
              <span className="font-bold text-white block">
                End now and close all in-progress attempts
              </span>
              <span className="text-[11px] text-[#9a9aa2]">
                Leave unchecked to let students who already started finish within their remaining timer. Check to lock all submissions after a 60s grace period.
              </span>
            </div>
          </label>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[40px] px-4 py-2 rounded-full text-xs font-bold bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-[#d4d4d8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`min-h-[40px] px-5 py-2 rounded-full text-xs font-bold text-white inline-flex items-center gap-1.5 ${
              isEnding
                ? 'bg-[#ef4444] hover:bg-[#dc2626]'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isEnding ? <Square size={13} /> : <Play size={13} />}
            <span>
              {submitting
                ? 'Updating...'
                : isEnding
                ? 'End Test Now'
                : 'Make Live Now'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Admin-only action bar for any Grand Line test row/card:
 * - "Schedule & Status" button (opens sheet/modal)
 * - One-tap quick toggle ("End now" for a live test, "Make Live" for an ended test) with confirmation
 */
export const GrandLineAdminRowControls: React.FC<{
  test: SchedulableGrandLineTest;
  nowMs?: number;
  onUpdated?: (updated: AmbassadorCustomTest) => void;
  compact?: boolean;
}> = ({ test, nowMs: propNowMs, onUpdated, compact = false }) => {
  const { isAdmin } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<'endNow' | 'makeLive' | null>(null);

  if (!isAdmin) return null;

  const nowMs = propNowMs ?? getServerNowMs();
  const status = computeGrandLineTestStatus(test, nowMs);

  return (
    <>
      <div className="inline-flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full font-bold border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.1] text-[#f0f0f2] transition-colors ${
            compact ? 'min-h-[34px] px-3 py-1 text-[11px]' : 'min-h-[38px] px-3.5 py-1.5 text-xs'
          }`}
        >
          <Calendar size={compact ? 12 : 13} className="text-[#ef4444] shrink-0" />
          <span>Schedule &amp; Status</span>
        </button>

        {status === 'live' && (
          <button
            type="button"
            onClick={() => setQuickAction('endNow')}
            className={`inline-flex items-center gap-1.5 rounded-full font-bold border border-red-500/30 bg-red-500/12 hover:bg-red-500/20 text-red-300 transition-colors ${
              compact ? 'min-h-[34px] px-3 py-1 text-[11px]' : 'min-h-[38px] px-3.5 py-1.5 text-xs'
            }`}
          >
            <Square size={compact ? 11 : 12} className="shrink-0" />
            <span>End now</span>
          </button>
        )}

        {status === 'ended' && (
          <button
            type="button"
            onClick={() => setQuickAction('makeLive')}
            className={`inline-flex items-center gap-1.5 rounded-full font-bold border border-emerald-500/30 bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-300 transition-colors ${
              compact ? 'min-h-[34px] px-3 py-1 text-[11px]' : 'min-h-[38px] px-3.5 py-1.5 text-xs'
            }`}
          >
            <Play size={compact ? 11 : 12} className="shrink-0" />
            <span>Make Live</span>
          </button>
        )}
      </div>

      <GrandLineScheduleSheet
        test={test}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={(updated) => onUpdated?.(updated)}
      />

      <GrandLineQuickToggleConfirmModal
        test={test}
        targetAction={quickAction}
        onClose={() => setQuickAction(null)}
        onConfirmed={(updated) => onUpdated?.(updated)}
      />
    </>
  );
};

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Crown,
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { UnifiedPlanStatusResult } from '@/config/plans';

interface ProLockedStateCardProps {
  planStatus: UnifiedPlanStatusResult;
  compact?: boolean;
}

export const ProLockedStateCard: React.FC<ProLockedStateCardProps> = ({
  planStatus,
  compact = false,
}) => {
  if (planStatus.state === 'active') {
    const expiryDisplay =
      planStatus.expiryDateTimeFormatted ||
      planStatus.expiryFormatted ||
      'Active membership';
    const timeLeftDisplay = planStatus.timeLeftLabel || 'Active';

    return (
      <div
        data-testid="pro-locked-active-card"
        className={`relative overflow-hidden rounded-2xl border border-emerald-500/30 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.07] via-[var(--bg-card)] to-amber-500/[0.05] shadow-sm ${
          compact ? 'p-5' : 'p-6 sm:p-8'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Active Membership · Purchase Locked
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">
                You already have Boardly Pro
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                Your <span className="font-bold text-[var(--text-primary)]">{planStatus.planName}</span> is currently active on your account with full unlimited access.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold shrink-0 self-start">
            <Sparkles className="w-3.5 h-3.5" />
            {timeLeftDisplay}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Active Plan
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)]">
              {planStatus.planName}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Exact Expiry Date
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)]">
              {expiryDisplay}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              Time Remaining
            </div>
            <div className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
              {timeLeftDisplay}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            New purchases and plan upgrades are locked while your membership is active.{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              You can buy or renew Boardly Pro again after your current plan expires
              {planStatus.expiryFormatted && planStatus.expiryFormatted !== 'Unlimited' && !planStatus.expiryFormatted.startsWith('Active')
                ? ` on ${planStatus.expiryFormatted}`
                : ''}.
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (planStatus.state === 'pending' && planStatus.pendingRequest) {
    const req = planStatus.pendingRequest;
    const methodLabel = req.method.toLowerCase() === 'opay' ? 'Opay' : 'JazzCash';

    return (
      <div
        data-testid="pro-locked-pending-card"
        className={`relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/[0.08] via-[var(--bg-card)] to-amber-500/[0.03] shadow-sm ${
          compact ? 'p-5' : 'p-6 sm:p-8'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <Clock className="w-3 h-3" />
                Verification In Progress · Purchase Locked
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">
                Your payment is being verified. This usually takes up to 24 hours.
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                We have received your payment submission for{' '}
                <span className="font-bold text-[var(--text-primary)]">{req.planName}</span>. Our team verifies payments manually and will activate your plan as soon as verification completes.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-extrabold shrink-0 self-start">
            <ShieldCheck className="w-3.5 h-3.5" />
            Awaiting Verification
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              Submitted Plan
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)]">
              {req.planName} (PKR {req.amountPkr.toLocaleString()})
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Submitted Date
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)]">
              {req.submittedFormatted}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Payment Reference
            </div>
            <div className="mt-1 text-sm font-mono font-bold text-[var(--text-primary)] truncate">
              {methodLabel}{req.tid ? ` · TID ${req.tid}` : ''}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            To prevent duplicate charges, starting another purchase is disabled while your payment is being verified. You will receive an in-app notification and email as soon as your plan is activated.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default ProLockedStateCard;

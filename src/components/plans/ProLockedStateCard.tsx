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
import { useLanguage } from '@/contexts/LanguageContext';

interface ProLockedStateCardProps {
  planStatus: UnifiedPlanStatusResult;
  compact?: boolean;
}

export const ProLockedStateCard: React.FC<ProLockedStateCardProps> = ({
  planStatus,
  compact = false,
}) => {
  const { t, formatPKR } = useLanguage();

  if (planStatus.state === 'active') {
    const expiryDisplay =
      planStatus.expiryDateTimeFormatted ||
      planStatus.expiryFormatted ||
      t('plans.activeMembership');
    const timeLeftDisplay = planStatus.timeLeftLabel || t('plans.active');
    const isPlus = planStatus.isPersonalPlus || planStatus.isSuperAdmin;

    return (
      <div
        data-testid="pro-locked-active-card"
        className={`relative overflow-hidden rounded-2xl border ${
          isPlus
            ? 'border-amber-500/35 bg-gradient-to-br from-amber-500/[0.08] via-[var(--bg-card)] to-yellow-500/[0.05]'
            : 'border-emerald-500/30 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.07] via-[var(--bg-card)] to-amber-500/[0.05]'
        } shadow-sm ${compact ? 'p-5' : 'p-6 sm:p-8'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isPlus
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isPlus ? <Sparkles className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
            </div>
            <div>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest mb-1.5 ${
                  isPlus
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {t('plans.activeMembership')}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">
                {isPlus ? t('plans.alreadyHavePlus') : t('plans.alreadyHavePro')}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                {t('plans.activePlanDesc', {
                  planName: planStatus.planName || (isPlus ? 'Boardly Plus' : 'Boardly Pro'),
                })}
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
              {t('plans.activePlan')}
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)]">
              {planStatus.planName}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              {t('plans.exactExpiryDate')}
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)] ltr-nums">
              {expiryDisplay}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              {t('plans.timeRemaining')}
            </div>
            <div className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
              {timeLeftDisplay}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isPlus ? t('plans.alreadyHavePlusNote') : t('plans.alreadyHaveProNote')}
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
                {t('plans.verificationInProgressLocked')}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">
                {t('plans.paymentVerifyingTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                {t('plans.paymentSubmissionReceived', { planName: req.planName || 'Boardly Pro' })}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-extrabold shrink-0 self-start">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('plans.awaitingVerification')}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              {t('plans.submittedPlan')}
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)]">
              {req.planName} (<span className="ltr-nums">{formatPKR(req.amountPkr)}</span>)
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              {t('plans.submittedDate')}
            </div>
            <div className="mt-1 text-sm font-black text-[var(--text-primary)] ltr-nums">
              {req.submittedFormatted}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              {t('plans.paymentReference')}
            </div>
            <div className="mt-1 text-sm font-mono font-bold text-[var(--text-primary)] truncate ltr-nums">
              {methodLabel}{req.tid ? ` · TID ${req.tid}` : ''}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t('plans.duplicateChargeNote')}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default ProLockedStateCard;

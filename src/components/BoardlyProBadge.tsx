import React from 'react';
import { Crown, Sparkles, ShieldCheck } from 'lucide-react';
import { StudentProfile, isUserProOrPaid, isAdminEmail } from '../lib/supabase';

export interface BoardlyProBadgeProps {
  userProfile?: StudentProfile | null;
  isAdmin?: boolean;
  className?: string;
  showOnlyIfPro?: boolean;
  /** Optional custom text override if needed */
  label?: string;
}

/**
 * Shared Boardly Pro badge component.
 * Displays a distinctive admin badge for admins, or gold crown status marker
 * for active Pro / paid subscribers.
 */
export const BoardlyProBadge: React.FC<BoardlyProBadgeProps> = ({
  userProfile,
  isAdmin = false,
  className = '',
  showOnlyIfPro = true,
  label = 'Boardly Pro',
}) => {
  const isEffectiveAdmin = Boolean(
    isAdmin ||
    isAdminEmail(userProfile?.email) ||
    userProfile?.role === 'admin'
  );

  if (isEffectiveAdmin) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs shrink-0 select-none whitespace-nowrap ${className}`}
        title="Admin Account — Permanent Unlimited Access (999+)"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span className="whitespace-nowrap">Admin — Unlimited (999+)</span>
      </span>
    );
  }

  const isPro = isUserProOrPaid(userProfile, null, false);

  if (!isPro) {
    if (showOnlyIfPro) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600 shrink-0 select-none whitespace-nowrap ${className}`}>
        <span>Free Tier</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-xs border border-amber-300/80 shrink-0 select-none whitespace-nowrap ${className}`}
      title="Active Boardly Pro Subscription — Unlimited Access Unlocked"
    >
      <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950/90 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};

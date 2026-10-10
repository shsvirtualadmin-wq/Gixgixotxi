import React from 'react';

export type StatusPillType = 'active' | 'pending' | 'approved' | 'rejected' | 'completed' | 'live' | 'suspended' | 'cancelled' | 'free' | 'pro' | 'premium';

export interface StatusPillProps {
  status: StatusPillType | string;
  label?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className = '' }) => {
  const norm = String(status || '').toLowerCase().trim();

  let dotColor = 'bg-slate-400';
  let pillStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'active' || norm === 'approved' || norm === 'completed') {
    dotColor = 'bg-emerald-500';
    pillStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
  } else if (norm === 'live') {
    dotColor = 'bg-rose-500 animate-pulse';
    pillStyle = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 font-black';
  } else if (norm === 'pending' || norm === 'draft') {
    dotColor = 'bg-amber-500';
    pillStyle = 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
  } else if (norm === 'rejected' || norm === 'suspended' || norm === 'cancelled' || norm === 'disabled') {
    dotColor = 'bg-rose-500';
    pillStyle = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
  } else if (norm === 'premium') {
    dotColor = 'bg-violet-500';
    pillStyle = 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60 font-black';
  } else if (norm === 'pro') {
    dotColor = 'bg-indigo-500';
    pillStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 font-black';
  } else if (norm === 'free') {
    dotColor = 'bg-slate-500';
    pillStyle = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }

  const displayLabel = label || norm.charAt(0).toUpperCase() + norm.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pillStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
};

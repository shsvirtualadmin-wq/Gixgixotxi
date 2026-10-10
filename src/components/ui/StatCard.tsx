import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  accent?: 'indigo' | 'violet' | 'teal' | 'amber' | 'emerald';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  accent = 'indigo',
  onClick,
  className = '',
}) => {
  const accentGradients = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-600 dark:text-indigo-400',
    violet: 'from-violet-500/10 to-violet-600/5 text-violet-600 dark:text-violet-400',
    teal: 'from-teal-500/10 to-teal-600/5 text-teal-600 dark:text-teal-400',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 dark:text-amber-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${accentGradients[accent]} flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800`}
          >
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.positive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

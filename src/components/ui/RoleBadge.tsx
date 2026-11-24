import React from 'react';
import { Shield, ShieldCheck, Crown, GraduationCap, BookOpen, Bot } from 'lucide-react';
import { resolveRoleBadgeDisplay } from '@/lib/profileRoles';

export interface RoleBadgeProps {
  role?: string | null;
  customRole?: string | null;
  isSuperAdmin?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * Shared RoleBadge component used across Profile, Commons, Leaderboards, Chat, and Crews.
 * Canonical display names: Student (or selected student/aspirant/university track),
 * Teacher, Captain, Admin, and "Super Admin".
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  customRole,
  isSuperAdmin = false,
  size = 'md',
  className = '',
}) => {
  const { label, kind } = resolveRoleBadgeDisplay({
    role,
    customRole,
    isSuperAdmin,
  });

  const isSmall = size === 'sm';
  const sizeClass = isSmall
    ? 'h-[20px] px-2 text-[11px]'
    : 'h-[26px] px-2.5 text-[12px]';
  const iconSize = isSmall ? 10 : 12;

  if (kind === 'superadmin') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-sans font-semibold select-none shrink-0 shadow-xs border ${sizeClass} ${className}`}
        style={{
          backgroundColor: '#D71921',
          color: '#FFFFFF',
          borderColor: '#B8141B',
        }}
        title="Super Admin"
      >
        <Shield size={iconSize} className="shrink-0 text-white" />
        <span className="leading-none whitespace-nowrap">{label}</span>
      </span>
    );
  }

  if (kind === 'admin') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-sans font-semibold select-none shrink-0 border ${sizeClass} bg-[#D71921]/14 text-[#D71921] border-[#D71921]/35 dark:bg-[#D71921]/20 dark:text-[#ff6b72] dark:border-[#D71921]/45 ${className}`}
        title="Admin"
      >
        <ShieldCheck size={iconSize} className="shrink-0" />
        <span className="leading-none whitespace-nowrap">{label}</span>
      </span>
    );
  }

  if (kind === 'captain') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-sans font-semibold select-none shrink-0 border ${sizeClass} bg-amber-500/12 text-amber-700 border-amber-500/35 dark:bg-amber-500/18 dark:text-amber-300 dark:border-amber-500/40 ${className}`}
        title="Captain"
      >
        <Crown size={iconSize} className="shrink-0" />
        <span className="leading-none whitespace-nowrap">{label}</span>
      </span>
    );
  }

  if (kind === 'teacher') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-sans font-semibold select-none shrink-0 border ${sizeClass} bg-indigo-500/12 text-indigo-700 border-indigo-500/30 dark:bg-indigo-500/18 dark:text-indigo-300 dark:border-indigo-400/35 ${className}`}
        title="Teacher"
      >
        <BookOpen size={iconSize} className="shrink-0" />
        <span className="leading-none whitespace-nowrap">{label}</span>
      </span>
    );
  }

  if (kind === 'bot') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-sans font-semibold select-none shrink-0 border ${sizeClass} bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/40 ${className}`}
        title={customRole || 'Automated Study Bot'}
      >
        <Bot size={iconSize + 1} className="shrink-0" />
        <span className="leading-none whitespace-nowrap">Bot</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-sans font-medium select-none shrink-0 border transition-colors ${sizeClass} bg-[#E5E7EB] text-[#1F2937] border-[#D1D5DB] dark:bg-[#26262B] dark:text-[#E5E7EB] dark:border-[#383842] ${className}`}
      title={label}
    >
      <GraduationCap size={iconSize + 1} className="shrink-0 opacity-80" />
      <span className="leading-none truncate max-w-[160px]">{label}</span>
    </span>
  );
};

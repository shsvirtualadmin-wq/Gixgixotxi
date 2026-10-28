import React from 'react';
import { Shield, GraduationCap, BookOpen, Heart, User, Bot } from 'lucide-react';

export interface RoleBadgeProps {
  role?: string | null;
  customRole?: string | null;
  isSuperAdmin?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * Normalizes role text for display.
 */
function formatRoleName(role?: string | null, customRole?: string | null): string {
  if (!role) return 'Student';
  const clean = role.trim();
  const lower = clean.toLowerCase();

  if (lower === 'superadmin' || lower === 'super admin' || lower === 'admin') {
    return 'Super Admin';
  }
  if (lower === 'bot') {
    return 'Bot';
  }
  if (lower === 'student') return 'Student';
  if (lower === 'teacher') return 'Teacher';
  if (lower === 'parent') return 'Parent';
  if (lower === 'other') {
    return customRole?.trim() || 'Other';
  }

  // Capitalize custom role string
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Standardized RoleBadge across Profile, Commons posts, comments, and chats.
 * - Superadmin: Solid deep red pill (#D71921), white text, small shield icon.
 * - Bot: Distinct visible Bot badge with Bot icon.
 * - Other roles: Calm neutral style (light grey in light mode, dark grey in dark mode).
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  customRole,
  isSuperAdmin = false,
  size = 'md',
  className = '',
}) => {
  const lower = (role || '').toLowerCase().trim();
  const lowerCustom = (customRole || '').toLowerCase().trim();
  const isSuper =
    isSuperAdmin || lower === 'superadmin' || lower === 'super admin' || lower === 'admin';
  const isBot = lower === 'bot' || lowerCustom.includes('bot');
  const displayName = isSuper
    ? 'Super Admin'
    : isBot
    ? 'Bot'
    : formatRoleName(role, customRole);

  const isSmall = size === 'sm';

  // Super Admin: Solid deep red pill, white text, shield icon
  if (isSuper) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-sans font-medium select-none shrink-0 shadow-xs border ${
          isSmall
            ? 'h-[20px] px-2 text-[11px]'
            : 'h-[24px] px-2.5 text-[12.5px]'
        } ${className}`}
        style={{
          backgroundColor: '#D71921',
          color: '#FFFFFF',
          borderColor: '#B8141B',
        }}
        title="Super Admin"
      >
        <Shield size={isSmall ? 10 : 12} className="shrink-0 text-white" />
        <span className="leading-none">{displayName}</span>
      </span>
    );
  }

  // Bot Badge: Distinct visible Bot pill
  if (isBot) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-sans font-semibold select-none shrink-0 border ${
          isSmall
            ? 'h-[20px] px-2 text-[11px]'
            : 'h-[24px] px-2.5 text-[12.5px]'
        } bg-sky-500/15 text-sky-400 border-sky-500/40 ${className}`}
        title={customRole || 'Automated Study Bot'}
      >
        <Bot size={isSmall ? 11 : 13} className="shrink-0 text-sky-400" />
        <span className="leading-none">Bot</span>
      </span>
    );
  }

  // Determine icon for neutral roles
  const roleType =
    lower === 'teacher'
      ? 'teacher'
      : lower === 'parent'
      ? 'parent'
      : lower === 'other' || customRole
      ? 'other'
      : 'student';

  const renderIcon = () => {
    const iconSize = isSmall ? 10 : 12;
    switch (roleType) {
      case 'teacher':
        return <BookOpen size={iconSize} className="shrink-0 opacity-80" />;
      case 'parent':
        return <Heart size={iconSize} className="shrink-0 opacity-80" />;
      case 'other':
        return <User size={iconSize} className="shrink-0 opacity-80" />;
      case 'student':
      default:
        return <GraduationCap size={iconSize + 1} className="shrink-0 opacity-80" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-sans font-medium select-none shrink-0 border transition-colors ${
        isSmall
          ? 'h-[20px] px-2 text-[11px]'
          : 'h-[24px] px-2.5 text-[12.5px]'
      } bg-[#E5E7EB] text-[#1F2937] border-[#D1D5DB] dark:bg-[#26262B] dark:text-[#E5E7EB] dark:border-[#383842] ${className}`}
      title={displayName}
    >
      {renderIcon()}
      <span className="leading-none truncate max-w-[140px]">{displayName}</span>
    </span>
  );
};

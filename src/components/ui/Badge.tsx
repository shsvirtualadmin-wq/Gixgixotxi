import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'brand'
    | 'student'
    | 'crew'
    | 'captain'
    | 'admin'
    | 'success'
    | 'warning'
    | 'danger'
    | 'neutral'
    | 'indigo'
    | 'violet'
    | 'teal'
    | 'amber'
    | 'emerald'
    | 'rose'
    | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-7 px-2.5 text-[11px] gap-1',
    md: 'h-8 px-3.5 text-xs gap-1.5', // 32px height
  };

  const variantClasses: Record<string, string> = {
    brand: 'bg-[#2F6BFF]/12 text-[#22D3EE] border-[#2F6BFF]/30',
    student: 'bg-[#2F6BFF]/12 text-[#22D3EE] border-[#2F6BFF]/30',
    crew: 'bg-[#7C5CFF]/12 text-[#E879F9] border-[#7C5CFF]/30',
    captain: 'bg-[#F59E0B]/12 text-[#FB923C] border-[#F59E0B]/30',
    admin: 'bg-[#10B981]/12 text-[#34D399] border-[#10B981]/30',
    success: 'bg-[#34D399]/12 text-[#34D399] border-[#34D399]/30',
    warning: 'bg-[#FBBF24]/12 text-[#FBBF24] border-[#FBBF24]/30',
    danger: 'bg-[#F87171]/12 text-[#F87171] border-[#F87171]/30',
    neutral: 'bg-white/8 text-[#A3B0CC] border-white/12',
    indigo: 'bg-[#2F6BFF]/12 text-[#22D3EE] border-[#2F6BFF]/30',
    violet: 'bg-[#7C5CFF]/12 text-[#E879F9] border-[#7C5CFF]/30',
    teal: 'bg-[#22D3EE]/12 text-[#22D3EE] border-[#22D3EE]/30',
    amber: 'bg-[#F59E0B]/12 text-[#FB923C] border-[#F59E0B]/30',
    emerald: 'bg-[#10B981]/12 text-[#34D399] border-[#10B981]/30',
    rose: 'bg-[#F87171]/12 text-[#F87171] border-[#F87171]/30',
    slate: 'bg-white/8 text-[#A3B0CC] border-white/12',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold rounded-full border backdrop-blur-md select-none shrink-0 ${sizeClasses[size]} ${
        variantClasses[variant] || variantClasses.neutral
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

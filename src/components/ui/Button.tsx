import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'crew' | 'captain' | 'admin';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // 48px default height, 44px min tap target
    const sizeClasses = {
      sm: 'h-10 px-4 text-xs font-semibold rounded-xl min-w-[36px]',
      md: 'h-12 px-5 text-sm font-semibold rounded-xl min-w-[44px]',
      lg: 'h-14 px-7 text-base font-bold rounded-2xl min-w-[48px]',
    };

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-[#2F6BFF] to-[#22D3EE] text-white shadow-[0_0_24px_-4px_rgba(47,107,255,0.45)] hover:shadow-[0_0_32px_-2px_rgba(47,107,255,0.6)] border border-white/20 active:scale-[0.98]',
      secondary:
        'bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#EAF0FF] border border-white/12 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] active:scale-[0.98]',
      ghost:
        'bg-transparent hover:bg-white/6 text-[#A3B0CC] hover:text-[#EAF0FF] border border-transparent active:scale-[0.98]',
      danger:
        'bg-red-500/15 hover:bg-red-500/25 text-[#F87171] border border-red-500/30 hover:border-red-500/50 shadow-[0_0_20px_-4px_rgba(248,113,113,0.3)] active:scale-[0.98]',
      crew:
        'bg-gradient-to-r from-[#7C5CFF] to-[#E879F9] text-white shadow-[0_0_24px_-4px_rgba(124,92,255,0.45)] hover:shadow-[0_0_32px_-2px_rgba(232,121,249,0.6)] border border-white/20 active:scale-[0.98]',
      captain:
        'bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-white shadow-[0_0_24px_-4px_rgba(245,158,11,0.45)] hover:shadow-[0_0_32px_-2px_rgba(251,146,60,0.6)] border border-white/20 active:scale-[0.98]',
      admin:
        'bg-gradient-to-r from-[#10B981] to-[#34D399] text-white shadow-[0_0_24px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_-2px_rgba(52,211,153,0.6)] border border-white/20 active:scale-[0.98]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`relative inline-flex items-center justify-center gap-2 select-none font-medium transition-all duration-160 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B14] ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

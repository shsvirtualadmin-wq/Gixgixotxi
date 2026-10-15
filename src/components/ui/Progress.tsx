import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'brand' | 'crew' | 'captain' | 'admin' | 'success';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'brand',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantGradients = {
    brand: 'bg-gradient-to-r from-[#2F6BFF] to-[#22D3EE] shadow-[0_0_16px_rgba(34,211,238,0.4)]',
    crew: 'bg-gradient-to-r from-[#7C5CFF] to-[#E879F9] shadow-[0_0_16px_rgba(232,121,249,0.4)]',
    captain: 'bg-gradient-to-r from-[#F59E0B] to-[#FB923C] shadow-[0_0_16px_rgba(251,146,60,0.4)]',
    admin: 'bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-[0_0_16px_rgba(52,211,153,0.4)]',
    success: 'bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-[0_0_16px_rgba(52,211,153,0.4)]',
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-[#A3B0CC]">{label}</span>}
          {showValue && (
            <span className="text-[#EAF0FF] tabular-nums font-bold">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2.5 bg-white/8 rounded-full overflow-hidden border border-white/8 p-0.5 backdrop-blur-xs">
        <div
          className={`h-full rounded-full transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${variantGradients[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

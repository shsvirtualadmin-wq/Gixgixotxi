import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-[24px] bg-white/[0.04] backdrop-blur-xl border border-dashed border-white/12 flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-white/6 border border-white/10 text-[#22D3EE] flex items-center justify-center shadow-[0_0_20px_-4px_rgba(34,211,238,0.3)]">
        {icon || <Sparkles className="w-6 h-6" />}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h4 className="font-bold text-base sm:text-lg text-[#EAF0FF] tracking-tight">
          {title}
        </h4>
        {description && (
          <p className="text-xs sm:text-sm text-[#A3B0CC] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          variant="primary"
          size="sm"
          onClick={action.onClick}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

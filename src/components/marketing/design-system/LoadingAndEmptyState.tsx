import React from 'react';
import { AlertCircle, RefreshCw, FolderSearch, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface SkeletonListProps {
  count?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 4, className = '' }) => {
  return (
    <div className={`space-y-3 w-full max-w-xl mx-auto ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 animate-pulse flex items-center justify-between"
        >
          <div className="flex items-center gap-3 w-2/3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/2" />
            </div>
          </div>
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export interface FriendlyErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const FriendlyError: React.FC<FriendlyErrorProps> = ({
  title = 'Unable to Load Data',
  message = 'We encountered a momentary network issue while fetching this list. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center max-w-md mx-auto shadow-sm space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            iconPosition="left"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No results yet',
  message = 'No active records or events found for this filter.',
  icon,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-800 text-center max-w-md mx-auto space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{message}</p>
      </div>
      {actionText && onAction && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  error: Error | string | unknown;
  path?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  error,
  path,
  onRetry,
  className = '',
}) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as any).message)
      : 'An unexpected error occurred while communicating with the server.';

  return (
    <div
      className={`p-6 sm:p-10 text-center rounded-[24px] bg-red-500/[0.04] backdrop-blur-xl border border-red-500/20 shadow-[0_20px_50px_-20px_rgba(248,113,113,0.15)] flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 text-[#F87171] flex items-center justify-center shadow-[0_0_20px_-4px_rgba(248,113,113,0.3)]">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h4 className="font-bold text-base sm:text-lg text-[#EAF0FF] tracking-tight">
          {title}
        </h4>
        <p className="text-xs sm:text-sm text-[#F87171] leading-relaxed break-words font-mono bg-black/30 p-2.5 rounded-xl border border-red-500/15">
          {errorMessage}
        </p>
        {path && (
          <p className="text-[11px] text-[#A3B0CC] font-mono mt-1">
            Path context: <span className="text-[#22D3EE]">{path}</span>
          </p>
        )}
      </div>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="mt-2 text-xs"
        >
          Retry Request
        </Button>
      )}
    </div>
  );
};

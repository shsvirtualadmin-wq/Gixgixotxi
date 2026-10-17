import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SyncingIndicatorProps {
  isSyncing: boolean;
  message?: string;
  className?: string;
}

export const SyncingIndicator: React.FC<SyncingIndicatorProps> = ({
  isSyncing,
  message = 'Saved on this device, syncing...',
  className = '',
}) => {
  if (!isSyncing) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono animate-pulse ${className}`}
      role="status"
      aria-live="polite"
    >
      <RefreshCw size={13} className="animate-spin text-amber-400" />
      <span>{message}</span>
    </div>
  );
};

export default SyncingIndicator;

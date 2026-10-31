import React from 'react';
import { BubbleLoader } from './BubbleLoader';

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
      className={`inline-flex items-center px-3.5 py-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      <BubbleLoader
        variant="inline"
        loading={isSyncing}
        messages={[message]}
        successText="Synced!"
      />
    </div>
  );
};

export default SyncingIndicator;

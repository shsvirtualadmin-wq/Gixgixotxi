import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'No data to display.',
  icon,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '3rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}
    >
      <div
        className="glass-pill"
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        {icon ?? <Inbox size={32} />}
      </div>
      <div>
        <p className="font-dot" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{title}</p>
        <p style={{ fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>{description}</p>
      </div>
      {action && <div>{action}</div>}
      {!action && actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-secondary text-xs px-5 py-2.5 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

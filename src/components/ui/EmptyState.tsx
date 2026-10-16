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
      <div style={{ color: 'var(--text-faint)', opacity: 0.6 }}>
        {icon ?? <Inbox size={40} />}
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 14 }}>{description}</p>
      </div>
      {action && <div>{action}</div>}
      {!action && actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--r-input)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

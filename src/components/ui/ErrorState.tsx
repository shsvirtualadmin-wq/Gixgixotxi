import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | { code?: string; message?: string } | string | null;
  path?: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message: customMessage,
  error,
  path,
  onRetry,
  onBack,
  backLabel = 'Go back',
}: ErrorStateProps) {
  const message =
    customMessage ??
    (typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : (error as { message?: string } | null)?.message ?? '');

  const code =
    error && typeof error === 'object' && 'code' in error
      ? (error as { code?: string }).code
      : undefined;

  return (
    <div
      className="glass"
      style={{
        borderRadius: 'var(--r-card)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 480,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <div style={{ color: 'var(--danger)', display: 'flex', justifyContent: 'center' }}>
        <AlertTriangle size={36} />
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
      {code && (
        <code
          style={{
            fontSize: 12,
            color: 'var(--danger)',
            background: 'rgba(248,113,113,0.1)',
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          {code}
        </code>
      )}
      {message && (
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{message}</p>
      )}
      {import.meta.env.DEV && path && (
        <p style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
          Debug Path: {path}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
        {onBack && (
          <Button variant="secondary" size="sm" onClick={onBack}>
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

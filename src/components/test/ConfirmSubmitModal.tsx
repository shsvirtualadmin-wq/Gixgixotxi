import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  totalQuestions: number;
  answeredCount: number;
  flaggedCount: number;
  secondsRemaining: number | null;
}

export function ConfirmSubmitModal({
  open,
  onClose,
  onConfirm,
  submitting,
  totalQuestions,
  answeredCount,
  flaggedCount,
  secondsRemaining,
}: ConfirmSubmitModalProps) {
  if (!open) return null;

  const unansweredCount = totalQuestions - answeredCount;
  const hasUnanswered = unansweredCount > 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => !submitting && onClose()}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 11, 20, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal Card */}
      <div
        className="glass"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          borderRadius: 'var(--r-card)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          textAlign: 'center',
          animation: 'page-enter 240ms var(--ease-out)',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: hasUnanswered
              ? 'rgba(251, 191, 36, 0.15)'
              : 'rgba(52, 211, 153, 0.15)',
            border: `1px solid ${
              hasUnanswered ? 'rgba(251, 191, 36, 0.3)' : 'rgba(52, 211, 153, 0.3)'
            }`,
            color: hasUnanswered ? 'var(--warning)' : 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          {hasUnanswered ? <AlertTriangle size={26} /> : <CheckCircle size={26} />}
        </div>

        <div>
          <h3
            className="font-display"
            style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}
          >
            Submit Test Attempt?
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            {hasUnanswered
              ? `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Unanswered questions receive 0 points.`
              : 'All questions answered! Ready to see your score and detailed explanations?'}
          </p>
        </div>

        {/* Stats Pill Matrix */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            padding: '12px',
            borderRadius: 'var(--r-input)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>
              {answeredCount}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Answered</p>
          </div>

          <div>
            <p
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: hasUnanswered ? 'var(--warning)' : 'var(--text-muted)',
              }}
            >
              {unansweredCount}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Unanswered</p>
          </div>

          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--warning)' }}>
              {flaggedCount}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Flagged</p>
          </div>
        </div>

        {secondsRemaining !== null && secondsRemaining > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <Clock size={13} />
            <span>Time remaining: {formatTime(secondsRemaining)}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={submitting}
          >
            Keep Practicing
          </Button>

          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={submitting}
            onClick={onConfirm}
          >
            Submit Test
          </Button>
        </div>
      </div>
    </div>
  );
}

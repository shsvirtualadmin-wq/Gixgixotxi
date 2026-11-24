import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, formatNumber } = useLanguage();

  if (!open) return null;

  const unansweredCount = totalQuestions - answeredCount;
  const hasUnanswered = unansweredCount > 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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
        className="overlay-blur bg-black/60 backdrop-blur-md"
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* Modal Card */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          borderRadius: 28,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          textAlign: 'center',
          animation: 'page-enter 200ms var(--ease-out)',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: hasUnanswered
              ? 'rgba(245, 158, 11, 0.15)'
              : 'rgba(52, 211, 153, 0.15)',
            border: `1px solid ${
              hasUnanswered ? 'rgba(245, 158, 11, 0.35)' : 'rgba(52, 211, 153, 0.35)'
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
            className="font-dot"
            style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}
          >
            {t('test.confirmSubmitTitle')}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            {hasUnanswered
              ? `${t('test.confirmSubmitDesc', { answered: formatNumber(answeredCount), total: formatNumber(totalQuestions) })} ${t('test.unansweredWarning', { count: formatNumber(unansweredCount) })}`
              : t('test.confirmSubmitDesc', { answered: formatNumber(answeredCount), total: formatNumber(totalQuestions) })}
          </p>
        </div>

        {/* Stats Pill Matrix */}
        <div
          className="glass-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            padding: '14px 12px',
            borderRadius: 20,
          }}
        >
          <div>
            <p className="font-dot ltr-nums" style={{ fontSize: 20, fontWeight: 800, color: '#D71921' }}>
              {formatNumber(answeredCount)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t('test.answered')}</p>
          </div>

          <div>
            <p
              className="font-dot ltr-nums"
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: hasUnanswered ? 'var(--warning)' : 'var(--text-muted)',
              }}
            >
              {formatNumber(unansweredCount)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t('test.unanswered')}</p>
          </div>

          <div>
            <p className="font-dot ltr-nums" style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)' }}>
              {formatNumber(flaggedCount)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t('test.flagged')}</p>
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
            <span>
              {t('test.timeLeft')}: <span className="ltr-nums">{formatTime(secondsRemaining)}</span>
            </span>
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
            {t('test.stayInTest')}
          </Button>

          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={submitting}
            loadingMessages={[t('common.submitting')]}
            onClick={onConfirm}
          >
            {t('test.submitNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}

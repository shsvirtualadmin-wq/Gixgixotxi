import { Clock, LayoutGrid, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TestHeaderProps {
  title: string;
  currentIndex: number;
  totalQuestions: number;
  secondsRemaining: number | null;
  timed: boolean;
  answeredCount: number;
  flaggedCount: number;
  onOpenPalette: () => void;
  onRequestSubmit: () => void;
}

export function TestHeader({
  title,
  currentIndex,
  totalQuestions,
  secondsRemaining,
  timed,
  answeredCount: _answeredCount,
  flaggedCount,
  onOpenPalette,
  onRequestSubmit,
}: TestHeaderProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isWarning = secondsRemaining !== null && secondsRemaining < 300 && secondsRemaining >= 60;
  const isDanger = secondsRemaining !== null && secondsRemaining < 60;

  return (
    <header
      className="glass"
      style={{
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        borderBottom: '1px solid var(--border)',
        borderRadius: 0,
      }}
    >
      {/* Left: Test title & index */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h2
            className="font-display"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
      </div>

      {/* Center: Live Server Timer */}
      {timed && secondsRemaining !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 'var(--r-pill)',
            background: isDanger
              ? 'rgba(248, 113, 113, 0.15)'
              : isWarning
              ? 'rgba(251, 191, 36, 0.15)'
              : 'rgba(47, 107, 255, 0.12)',
            border: `1px solid ${
              isDanger
                ? 'var(--danger)'
                : isWarning
                ? 'var(--warning)'
                : 'rgba(47, 107, 255, 0.3)'
            }`,
            color: isDanger
              ? 'var(--danger)'
              : isWarning
              ? 'var(--warning)'
              : 'var(--brand-2)',
            animation: isDanger ? 'pulse-glow 1s ease-in-out infinite' : undefined,
          }}
        >
          <Clock size={16} />
          <span
            className="tabular-nums"
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {formatTime(secondsRemaining)}
          </span>
        </div>
      )}

      {/* Right: Palette & Submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onOpenPalette}
          className="glass-hover"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 'var(--r-input)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Open Question Palette"
        >
          <LayoutGrid size={16} />
          <span className="hidden sm:inline">Palette</span>
          {flaggedCount > 0 && (
            <span
              style={{
                background: 'rgba(251, 191, 36, 0.25)',
                color: 'var(--warning)',
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 'var(--r-pill)',
                fontWeight: 700,
              }}
            >
              {flaggedCount}
            </span>
          )}
        </button>

        <Button
          variant="primary"
          size="sm"
          onClick={onRequestSubmit}
          style={{ gap: 6 }}
        >
          <CheckCircle size={15} />
          <span>Finish</span>
        </Button>
      </div>
    </header>
  );
}

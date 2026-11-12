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
    const safe = Math.max(0, Math.floor(secs));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isWarning = secondsRemaining !== null && secondsRemaining < 300 && secondsRemaining >= 60;
  const isDanger = secondsRemaining !== null && secondsRemaining < 60;

  return (
    <header
      style={{
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        borderRadius: 0,
      }}
    >
      {/* Left: Question counter */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] font-mono text-xs font-semibold text-[var(--text)] whitespace-nowrap">
          Q {currentIndex + 1} <span className="text-[var(--text-muted)]">/ {totalQuestions}</span>
        </div>
      </div>

      {/* Center: Title & Timer in a Single Row (never wrapping) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-0 flex-1 px-2">
        <span
          className="font-display text-xs sm:text-sm font-bold text-[var(--text)] tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-[340px] whitespace-nowrap"
          title={title}
        >
          {title}
        </span>

        {timed && secondsRemaining !== null && (
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full shrink-0"
            style={{
              background: isDanger
                ? 'rgba(248, 113, 113, 0.15)'
                : isWarning
                ? 'rgba(251, 191, 36, 0.15)'
                : 'rgba(215, 25, 33, 0.08)',
              border: `1px solid ${
                isDanger
                  ? 'var(--danger)'
                  : isWarning
                  ? 'var(--warning)'
                  : 'var(--accent)'
              }`,
              color: isDanger
                ? 'var(--danger)'
                : isWarning
                ? 'var(--warning)'
                : 'var(--accent)',
              animation: isDanger ? 'pulse-glow 1s ease-in-out infinite' : undefined,
            }}
          >
            <Clock size={13} className="shrink-0" />
            <span
              className="tabular-nums font-mono text-xs sm:text-sm font-bold tracking-wide"
            >
              {formatTime(secondsRemaining)}
            </span>
          </div>
        )}
      </div>

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

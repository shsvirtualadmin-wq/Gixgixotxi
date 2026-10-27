import { memo } from 'react';
import { X, Bookmark } from 'lucide-react';

interface QuestionPaletteProps {
  open: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentIndex: number;
  userAnswers: Record<string, number>;
  flagged: number[];
  onSelectIndex: (index: number) => void;
}

export const QuestionPalette = memo(function QuestionPalette({
  open,
  onClose,
  totalQuestions,
  currentIndex,
  userAnswers,
  flagged,
  onSelectIndex,
}: QuestionPaletteProps) {
  if (!open) return null;

  const answeredCount = Object.keys(userAnswers).length;
  const flaggedCount = flagged.length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop (no backdrop-filter during active test for distraction-free speed) */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
        }}
      />

      {/* Drawer */}
      <div
        className="glass-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          height: '100%',
          borderLeft: '1px solid var(--glass-border)',
          borderRadius: '28px 0 0 28px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101,
          animation: 'page-enter 200ms var(--ease-out)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              className="font-dot"
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}
            >
              Question Palette
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Jump to any question instantly
            </p>
          </div>

          <button
            onClick={onClose}
            className="glass-pill"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Legend */}
        <div
          style={{
            padding: '1rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            borderBottom: '1px solid var(--glass-border)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: 'rgba(215, 25, 33, 0.22)',
                border: '1px solid #D71921',
              }}
            />
            <span>Answered ({answeredCount})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid var(--warning)',
              }}
            />
            <span>Flagged ({flaggedCount})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: 'var(--glass-row-bg)',
                border: '1px solid var(--glass-border)',
              }}
            />
            <span>Unanswered ({unansweredCount})</span>
          </div>
        </div>

        {/* Question Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            alignContent: 'start',
          }}
        >
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const isAnswered = userAnswers[String(i)] !== undefined;
            const isItemFlagged = flagged.includes(i);
            const isCurrent = currentIndex === i;

            return (
              <button
                key={i}
                onClick={() => {
                  onSelectIndex(i);
                  onClose();
                }}
                className="font-dot"
                style={{
                  height: 48,
                  borderRadius: 14,
                  border: isCurrent
                    ? '2px solid #D71921'
                    : isItemFlagged
                    ? '1px solid var(--warning)'
                    : isAnswered
                    ? '1px solid rgba(215, 25, 33, 0.55)'
                    : '1px solid var(--glass-border)',
                  background: isCurrent
                    ? '#D71921'
                    : isAnswered
                    ? 'rgba(215, 25, 33, 0.16)'
                    : isItemFlagged
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'var(--glass-row-bg)',
                  color: isCurrent
                    ? '#ffffff'
                    : isAnswered
                    ? 'var(--text)'
                    : 'var(--text-muted)',
                  fontSize: 14,
                  fontWeight: isCurrent || isAnswered ? 700 : 500,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrent ? '0 6px 16px -4px rgba(215, 25, 33, 0.45)' : undefined,
                }}
              >
                {i + 1}
                {isItemFlagged && (
                  <Bookmark
                    size={10}
                    fill="var(--warning)"
                    color="var(--warning)"
                    style={{ position: 'absolute', top: 4, right: 4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

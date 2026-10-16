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

export function QuestionPalette({
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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 11, 20, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Drawer */}
      <div
        className="glass"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          height: '100%',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--border)',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101,
          animation: 'page-enter 240ms var(--ease-out)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              className="font-display"
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}
            >
              Question Palette
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Jump to any question instantly
            </p>
          </div>

          <button
            onClick={onClose}
            className="glass-hover"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
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
            padding: '1rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
              }}
            />
            <span>Answered ({answeredCount})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: 'rgba(251, 191, 36, 0.4)',
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
                borderRadius: 3,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
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
            padding: '1.25rem',
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
                className="glass-hover"
                style={{
                  height: 48,
                  borderRadius: 'var(--r-input)',
                  border: isCurrent
                    ? '2px solid var(--brand-2)'
                    : isItemFlagged
                    ? '1px solid var(--warning)'
                    : isAnswered
                    ? '1px solid var(--brand)'
                    : '1px solid var(--border)',
                  background: isAnswered
                    ? 'linear-gradient(135deg, rgba(47, 107, 255, 0.3), rgba(34, 211, 238, 0.2))'
                    : isItemFlagged
                    ? 'rgba(251, 191, 36, 0.15)'
                    : 'var(--surface)',
                  color: isCurrent
                    ? 'var(--brand-2)'
                    : isAnswered
                    ? '#ffffff'
                    : 'var(--text-muted)',
                  fontSize: 14,
                  fontWeight: isCurrent || isAnswered ? 700 : 500,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrent ? '0 0 12px rgba(34, 211, 238, 0.35)' : undefined,
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
}

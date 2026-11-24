import { memo } from 'react';
import { X, Bookmark } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, formatNumber } = useLanguage();

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
        className="overlay-blur bg-black/60 backdrop-blur-md"
        style={{
          position: 'absolute',
          inset: 0,
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
          borderInlineStart: '1px solid var(--glass-border)',
          borderStartStartRadius: 28,
          borderEndStartRadius: 28,
          borderStartEndRadius: 0,
          borderEndEndRadius: 0,
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
          <div className="text-start">
            <h3
              className="font-dot"
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}
            >
              {t('test.paletteTitle')}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {t('test.questionOf', { current: currentIndex + 1, total: totalQuestions })}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label={t('common.close')}
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
                flexShrink: 0,
              }}
            />
            <span>{t('test.answered')} (<span className="ltr-nums">{formatNumber(answeredCount)}</span>)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid var(--warning)',
                flexShrink: 0,
              }}
            />
            <span>{t('test.flagged')} (<span className="ltr-nums">{formatNumber(flaggedCount)}</span>)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                background: 'var(--glass-row-bg)',
                border: '1px solid var(--glass-border)',
                flexShrink: 0,
              }}
            />
            <span>{t('test.unanswered')} (<span className="ltr-nums">{formatNumber(unansweredCount)}</span>)</span>
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
                className="font-dot ltr-nums"
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
                {formatNumber(i + 1)}
                {isItemFlagged && (
                  <Bookmark
                    size={10}
                    fill="var(--warning)"
                    color="var(--warning)"
                    style={{ position: 'absolute', top: 4, insetInlineEnd: 4 }}
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

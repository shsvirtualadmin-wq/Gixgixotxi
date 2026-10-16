import { Bookmark, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { MathText } from '@/components/ui/MathText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AttemptQuestion } from '@/types/index';

interface QuestionCardProps {
  question: AttemptQuestion;
  index: number;
  total: number;
  selectedAnswer: number | undefined;
  isFlagged: boolean;
  onSelectAnswer: (optionIdx: number) => void;
  onClearAnswer: () => void;
  onToggleFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function QuestionCard({
  question,
  index,
  total,
  selectedAnswer,
  isFlagged,
  onSelectAnswer,
  onClearAnswer,
  onToggleFlag,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: QuestionCardProps) {
  return (
    <div
      style={{
        maxWidth: 820,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Top Meta Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge color="brand">Question {index + 1} of {total}</Badge>
          {question.subject && <Badge color="violet">{question.subject}</Badge>}
          {question.chapter && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-faint)',
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {question.chapter}
            </span>
          )}
        </div>

        {/* Flag button */}
        <button
          onClick={onToggleFlag}
          className="glass-hover"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--r-pill)',
            border: `1px solid ${isFlagged ? 'rgba(251, 191, 36, 0.5)' : 'var(--border)'}`,
            background: isFlagged ? 'rgba(251, 191, 36, 0.15)' : 'var(--surface)',
            color: isFlagged ? 'var(--warning)' : 'var(--text-muted)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 160ms',
          }}
          title="Press 'F' to flag for review"
        >
          <Bookmark size={14} fill={isFlagged ? 'currentColor' : 'none'} />
          <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
          <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 2 }}>(F)</span>
        </button>
      </div>

      {/* Main Glass Question Box */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--r-card)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Question Stem */}
        <div
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.6,
          }}
        >
          <MathText block>{question.q}</MathText>
        </div>

        {/* Options Grid / List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {question.options.map((optText, optIdx) => {
            const isSelected = selectedAnswer === optIdx;
            const letter = OPTION_LABELS[optIdx] ?? String(optIdx + 1);

            return (
              <button
                key={optIdx}
                onClick={() => onSelectAnswer(optIdx)}
                className="glass-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderRadius: 'var(--r-input)',
                  border: isSelected
                    ? '1px solid var(--brand)'
                    : '1px solid var(--border)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(47, 107, 255, 0.18), rgba(34, 211, 238, 0.08))'
                    : 'var(--surface)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 160ms var(--ease-out)',
                  boxShadow: isSelected
                    ? '0 0 16px rgba(47, 107, 255, 0.25)'
                    : undefined,
                }}
              >
                {/* Option badge / key indicator */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                    background: isSelected
                      ? 'linear-gradient(135deg, var(--brand), var(--brand-2))'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? 'white' : 'var(--text-muted)',
                    border: isSelected
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    transition: 'all 160ms',
                  }}
                >
                  {letter}
                </div>

                {/* Option Text with KaTeX */}
                <div style={{ flex: 1, fontSize: 15, lineHeight: 1.5 }}>
                  <MathText>{optText}</MathText>
                </div>
              </button>
            );
          })}
        </div>

        {/* Clear Option action */}
        {selectedAnswer !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClearAnswer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-faint)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'color 160ms',
              }}
              className="hover:text-[var(--text-muted)]"
            >
              <RotateCcw size={12} />
              Clear selection
            </button>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Button
          variant="secondary"
          size="md"
          onClick={onPrev}
          disabled={!canPrev}
          style={{ gap: 6 }}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>(P)</span>
        </Button>

        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
          Tip: Press 1-4 or A-D to answer
        </span>

        <Button
          variant="primary"
          size="md"
          onClick={onNext}
          disabled={!canNext}
          style={{ gap: 6 }}
        >
          <span>Next</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>(N)</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

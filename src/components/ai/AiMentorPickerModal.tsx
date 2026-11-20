import React, { useEffect } from 'react';
import { Check, ChevronRight, Gauge, X } from 'lucide-react';
import {
  AI_MENTORS,
  getDepthConfig,
  type AiDepthId,
  type AiMentorId,
} from '@/utils/aiMentorsLogic';
import { MentorAvatar } from './MentorAvatar';

interface AiMentorPickerModalProps {
  open: boolean;
  selectedMentor: AiMentorId;
  selectedDepth: AiDepthId;
  onSelectMentor: (mentorId: AiMentorId) => void;
  onOpenDepthGauge: () => void;
  onClose: () => void;
}

export const AiMentorPickerModal: React.FC<AiMentorPickerModalProps> = ({
  open,
  selectedMentor,
  selectedDepth,
  onSelectMentor,
  onOpenDepthGauge,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const depthCfg = getDepthConfig(selectedDepth);

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-end lg:items-center justify-center p-0 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose AI Mentor"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-[460px] rounded-t-[32px] lg:rounded-[32px] p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] lg:pb-5 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border)] lg:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3
              className="text-[18px] font-bold leading-tight"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif", color: 'var(--text)' }}
            >
              Choose Mentor
            </h3>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Each mentor keeps its own active chat thread
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mentor picker"
            className="flex h-9 w-9 items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {AI_MENTORS.map((m) => {
            const active = m.id === selectedMentor;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectMentor(m.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 rounded-[22px] px-3.5 py-3 text-left transition-colors cursor-pointer"
                style={{
                  backgroundColor: active
                    ? `color-mix(in srgb, ${m.accent} 10%, var(--bg))`
                    : 'var(--bg)',
                  border: active ? `1.5px solid ${m.accent}` : '1px solid var(--border)',
                }}
              >
                <MentorAvatar mentorId={m.id} size={42} active={active} eager />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                      {m.name}
                    </span>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${m.accent} 14%, transparent)`,
                        color: m.accent,
                      }}
                    >
                      {m.role}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-snug line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                    {m.description}
                  </p>
                </div>
                {active && (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: m.accent }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Answer depth row */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenDepthGauge();
          }}
          className="mt-4 w-full flex items-center justify-between gap-3 rounded-full px-4 py-3.5 text-left transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Gauge className="h-5 w-5 shrink-0" style={{ color: 'var(--accent)' }} />
            <div className="min-w-0">
              <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                Answer depth
              </div>
              <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {depthCfg.label} · {depthCfg.baseCost} credit{depthCfg.baseCost === 1 ? '' : 's'} base
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import {
  AI_DEPTHS,
  getDepthConfig,
  type AiDepthId,
} from '@/utils/aiMentorsLogic';
import { useAiDepthMotion } from '@/utils/aiDepthMotionFlag';
import {
  AiDepthGaugeSvg,
  DEPTH_ANGLES,
  getMetricBarTransition,
} from './AiDepthMotion';

interface AiDepthGaugeModalProps {
  open: boolean;
  selectedDepth: AiDepthId;
  deepMaxUnlocked: boolean;
  accentColor: string;
  onSelectDepth: (depth: AiDepthId) => void;
  onLockedDepthClick: (depthLabel: string) => void;
  onClose: () => void;
}

function triggerMaxHapticIfSupported(motionEnabled: boolean): void {
  if (!motionEnabled || typeof navigator === 'undefined') return;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(18);
    }
  } catch {
    // Ignore unsupported vibration APIs
  }
}

export const AiDepthGaugeModal: React.FC<AiDepthGaugeModalProps> = ({
  open,
  selectedDepth,
  deepMaxUnlocked,
  accentColor,
  onSelectDepth,
  onLockedDepthClick,
  onClose,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectionSeq, setSelectionSeq] = useState(0);
  const { motionEnabled } = useAiDepthMotion();

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

  const activeCfg = getDepthConfig(selectedDepth);

  const commitDepth = (depthId: AiDepthId) => {
    setSelectionSeq((n) => n + 1);
    if (depthId === 3) {
      triggerMaxHapticIfSupported(motionEnabled);
    }
    onSelectDepth(depthId);
  };

  const pickDepthFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.86;
    const dx = clientX - cx;
    const dy = Math.min(-4, clientY - cy);
    // Angle from vertical up: -90 (left) to +90 (right)
    const rad = Math.atan2(dx, -dy);
    const deg = (rad * 180) / Math.PI;

    let nearest: AiDepthId = 0;
    let bestDist = Infinity;
    DEPTH_ANGLES.forEach((targetDeg, idx) => {
      const dist = Math.abs(deg - targetDeg);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = idx as AiDepthId;
      }
    });

    const targetCfg = getDepthConfig(nearest);
    if (!targetCfg.freeAllowed && !deepMaxUnlocked) {
      onLockedDepthClick(targetCfg.label);
      setDragging(false);
      return;
    }
    if (nearest !== selectedDepth) {
      commitDepth(nearest);
    }
  };

  const handleDepthButton = (depthId: AiDepthId) => {
    const cfg = getDepthConfig(depthId);
    if (!cfg.freeAllowed && !deepMaxUnlocked) {
      onLockedDepthClick(cfg.label);
      return;
    }
    commitDepth(depthId);
  };

  const barTransition = getMetricBarTransition(selectedDepth, motionEnabled);

  return (
    <div
      className="fixed inset-0 z-[10055] flex items-end lg:items-center justify-center p-0 lg:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Answer depth"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-[440px] rounded-t-[32px] lg:rounded-[32px] p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] lg:pb-5 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border)] lg:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3
              className="text-[18px] font-bold leading-tight"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif", color: 'var(--text)' }}
            >
              Think harder
            </h3>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Drag the needle or pick an answer depth
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close depth gauge"
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

        {/* Semicircle SVG Gauge with Draggable Needle & Per-Depth Motion */}
        <div className="mt-3 flex flex-col items-center">
          <AiDepthGaugeSvg
            svgRef={svgRef}
            depthId={selectedDepth}
            accentColor={accentColor}
            dragging={dragging}
            selectionSeq={selectionSeq}
            onPointerDown={(e) => {
              setDragging(true);
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore
              }
              pickDepthFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (!dragging) return;
              pickDepthFromPointer(e.clientX, e.clientY);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          />

          <div className="mt-1 flex items-center gap-2">
            <span
              className="text-[18px] font-bold"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif", color: 'var(--text)' }}
            >
              {activeCfg.label}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                color: accentColor,
              }}
            >
              {activeCfg.baseCost} credit{activeCfg.baseCost === 1 ? '' : 's'} base
            </span>
          </div>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {activeCfg.subtitle}
          </p>
        </div>

        {/* 4 Depth Buttons */}
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {AI_DEPTHS.map((d) => {
            const isSelected = d.id === selectedDepth;
            const isLocked = !d.freeAllowed && !deepMaxUnlocked;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleDepthButton(d.id)}
                className="flex flex-col items-center justify-center gap-0.5 rounded-[18px] py-2.5 px-1.5 text-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: isSelected
                    ? accentColor
                    : 'var(--bg)',
                  border: isSelected ? `1px solid ${accentColor}` : '1px solid var(--border)',
                  color: isSelected ? '#ffffff' : 'var(--text)',
                }}
              >
                <span className="flex items-center gap-1 text-[13px] font-semibold">
                  {isLocked && <Lock className="h-3 w-3 shrink-0 opacity-80" />}
                  <span>{d.label}</span>
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}
                >
                  {d.baseCost} cr
                </span>
              </button>
            );
          })}
        </div>

        {/* Speed / Detail / Accuracy Bars (GPU transform: scaleX only — zero layout animation) */}
        <div
          className="mt-4 rounded-[22px] p-3.5 space-y-2.5"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
          }}
        >
          {[
            { label: 'Speed', value: activeCfg.speed },
            { label: 'Detail', value: activeCfg.detail },
            { label: 'Accuracy', value: activeCfg.accuracy },
          ].map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: 'var(--text-muted)' }}>{metric.label}</span>
                <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                  {metric.value}%
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--border)' }}
              >
                <div
                  className="h-full w-full rounded-full will-change-transform"
                  style={{
                    transformOrigin: 'left center',
                    transform: `scaleX(${Math.max(0, Math.min(1, metric.value / 100))})`,
                    transition: barTransition,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex min-h-[46px] w-full items-center justify-center rounded-full text-[14px] font-semibold text-white cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

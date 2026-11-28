import React, { useId } from 'react';
import { getDepthConfig, type AiDepthId } from '@/utils/aiMentorsLogic';
import { useAiDepthMotion } from '@/utils/aiDepthMotionFlag';

export const DEPTH_ANGLES: readonly [number, number, number, number] = [-72, -24, 24, 72];

/**
 * Returns the CSS transform transition string for the needle at each depth level.
 */
export function getNeedleTransition(depthId: AiDepthId, dragging: boolean, motionEnabled: boolean): string {
  if (dragging || !motionEnabled) return 'none';
  switch (depthId) {
    case 0: // Quick: snaps fast (~150ms)
      return 'transform 150ms cubic-bezier(0.22, 1, 0.36, 1)';
    case 1: // Balanced: smooth ease-in-out
      return 'transform 340ms ease-in-out';
    case 2: // Deep: slower needle with weight
      return 'transform 560ms cubic-bezier(0.16, 1, 0.3, 1)';
    case 3: // Max: deliberate, high-energy sweep
      return 'transform 460ms cubic-bezier(0.2, 0.9, 0.25, 1.04)';
  }
}

/**
 * Returns the CSS transform transition string for Speed / Detail / Accuracy bars (GPU scaleX only).
 */
export function getMetricBarTransition(depthId: AiDepthId, motionEnabled: boolean): string {
  if (!motionEnabled) return 'none';
  switch (depthId) {
    case 0: // Quick: bars jump fast with crisp overshoot
      return 'transform 160ms cubic-bezier(0.34, 1.4, 0.64, 1)';
    case 1: // Balanced: calm smooth transition
      return 'transform 320ms ease-in-out';
    case 2: // Deep: bars fill slowly with weight
      return 'transform 560ms cubic-bezier(0.16, 1, 0.3, 1)';
    case 3: // Max: energetic full sweep
      return 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)';
  }
}

interface AiDepthGaugeSvgProps {
  depthId: AiDepthId;
  accentColor: string;
  dragging?: boolean;
  /** Incremented whenever the user actively selects a depth (drives quick spark & max burst) */
  selectionSeq?: number;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  onPointerMove?: React.PointerEventHandler<SVGSVGElement>;
  onPointerUp?: React.PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: React.PointerEventHandler<SVGSVGElement>;
  className?: string;
  interactive?: boolean;
}

/**
 * Semicircle SVG Answer-Depth Gauge with GPU-composited (transform + opacity only)
 * per-depth animations. Used in AiDepthGaugeModal and mirrored in AiDepthThinkingIndicator.
 */
export const AiDepthGaugeSvg: React.FC<AiDepthGaugeSvgProps> = ({
  depthId,
  accentColor,
  dragging = false,
  selectionSeq = 0,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  className = 'w-full max-w-[260px] select-none touch-none cursor-pointer',
  interactive = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const { motionEnabled, tabHidden } = useAiDepthMotion();
  const angleDeg = DEPTH_ANGLES[depthId] ?? -24;
  const maxGradId = `ai-max-arc-${uid}`;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 260 154"
      className={`ai-depth-svg ${motionEnabled ? 'ai-depth-motion-on' : 'ai-depth-motion-off'} ${className}`}
      data-depth-key={getDepthConfig(depthId).key}
      data-tab-hidden={tabHidden ? 'true' : 'false'}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerCancel={interactive ? onPointerCancel : undefined}
      style={{ ['--depth-accent' as any]: accentColor }}
    >
      <defs>
        <linearGradient id={maxGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.45" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.98" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Base track arc */}
      <path
        d="M 28 130 A 102 102 0 0 1 232 130"
        fill="none"
        stroke="var(--border)"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Depth 0 (Quick): short crisp spark streak near the left quick arc */}
      {motionEnabled && depthId === 0 && (
        <g key={`quick-spark-${selectionSeq}`} className="ai-depth-quick-spark" style={{ transformOrigin: '130px 130px' }}>
          <path
            d="M 33 98 A 102 102 0 0 1 62 55"
            fill="none"
            stroke={accentColor}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="52" cy="64" r="3.5" fill={accentColor} />
        </g>
      )}

      {/* Depth 1 (Balanced): calm steady pulse along the arc */}
      {motionEnabled && depthId === 1 && (
        <path
          d="M 28 130 A 102 102 0 0 1 232 130"
          fill="none"
          stroke={accentColor}
          strokeWidth="14"
          strokeLinecap="round"
          className="ai-depth-balanced-pulse"
          style={{ transformOrigin: '130px 130px' }}
        />
      )}

      {/* Depth 2 (Deep): concentric ripple rings spreading from the hub */}
      {motionEnabled && depthId === 2 && (
        <g aria-hidden="true">
          <circle
            cx="130"
            cy="130"
            r="26"
            fill="none"
            stroke={accentColor}
            strokeWidth="2.4"
            className="ai-depth-deep-ripple ai-depth-deep-ripple--1"
            style={{ transformOrigin: '130px 130px' }}
          />
          <circle
            cx="130"
            cy="130"
            r="26"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            className="ai-depth-deep-ripple ai-depth-deep-ripple--2"
            style={{ transformOrigin: '130px 130px' }}
          />
          <circle
            cx="130"
            cy="130"
            r="26"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.6"
            className="ai-depth-deep-ripple ai-depth-deep-ripple--3"
            style={{ transformOrigin: '130px 130px' }}
          />
        </g>
      )}

      {/* Depth 3 (Max): glow gradient arc fill + orbiting particles + one-shot selection burst */}
      {depthId === 3 && (
        <g aria-hidden="true">
          {/* Luminous glow gradient arc fill (opacity shimmer only — no animated blur) */}
          <path
            d="M 28 130 A 102 102 0 0 1 232 130"
            fill="none"
            stroke={`url(#${maxGradId})`}
            strokeWidth="14"
            strokeLinecap="round"
            className={motionEnabled ? 'ai-depth-max-arc-glow' : undefined}
            opacity={motionEnabled ? undefined : 0.72}
          />
          {motionEnabled && (
            <>
              <path
                d="M 28 130 A 102 102 0 0 1 232 130"
                fill="none"
                stroke={`url(#${maxGradId})`}
                strokeWidth="22"
                strokeLinecap="round"
                className="ai-depth-max-halo"
              />

              {/* Orbiting micro-particles circling the gauge hub (CSS rotate only) */}
              <g className="ai-depth-max-orbit ai-depth-max-orbit--1" style={{ transformOrigin: '130px 130px' }}>
                <circle cx="130" cy="72" r="3.6" fill={accentColor} />
              </g>
              <g className="ai-depth-max-orbit ai-depth-max-orbit--2" style={{ transformOrigin: '130px 130px' }}>
                <circle cx="130" cy="84" r="2.8" fill="#fbbf24" />
              </g>
              <g className="ai-depth-max-orbit ai-depth-max-orbit--3" style={{ transformOrigin: '130px 130px' }}>
                <circle cx="130" cy="64" r="2.4" fill={accentColor} />
              </g>

              {/* Small celebratory burst on selection */}
              <g
                key={`max-burst-${selectionSeq}`}
                className="ai-depth-max-burst"
                style={{ transformOrigin: '130px 130px' }}
              >
                <circle cx="130" cy="130" r="28" fill="none" stroke={accentColor} strokeWidth="3" />
                <circle cx="130" cy="130" r="18" fill="none" stroke="#fbbf24" strokeWidth="2" />
              </g>
            </>
          )}
        </g>
      )}

      {/* Tick markers */}
      {DEPTH_ANGLES.map((deg, idx) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const x = 130 + 102 * Math.cos(rad);
        const y = 130 + 102 * Math.sin(rad);
        const active = idx <= depthId;
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={idx === depthId ? 6 : 4}
            fill={active ? accentColor : 'var(--text-muted)'}
            opacity={active ? 1 : 0.45}
          />
        );
      })}

      {/* Needle (GPU transform rotate around 130, 130) */}
      <g
        style={{
          transformOrigin: '130px 130px',
          transform: `rotate(${angleDeg}deg)`,
          transition: getNeedleTransition(depthId, dragging, motionEnabled),
        }}
      >
        <line
          x1="130"
          y1="130"
          x2="130"
          y2="46"
          stroke={accentColor}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="130" cy="46" r="5" fill={accentColor} />
      </g>

      {/* Hub */}
      <circle cx="130" cy="130" r="10" fill={accentColor} />
      <circle cx="130" cy="130" r="4.5" fill="var(--card)" />
    </svg>
  );
};

interface AiDepthThinkingIndicatorProps {
  depthId: AiDepthId;
  mentorName: string;
  accentColor: string;
}

/**
 * Compact live "thinking" indicator that plays the EXACT same depth-specific animation
 * (Quick spark, Balanced steady pulse, Deep hub ripples, Max glow arc + orbiting particles)
 * while the AI is answering at that depth.
 */
export const AiDepthThinkingIndicator: React.FC<AiDepthThinkingIndicatorProps> = ({
  depthId,
  mentorName,
  accentColor,
}) => {
  const depthCfg = getDepthConfig(depthId);
  const { motionEnabled, tabHidden } = useAiDepthMotion();

  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full pl-2.5 pr-4 py-1.5 text-[13.5px]"
      data-depth-key={depthCfg.key}
      data-tab-hidden={tabHidden ? 'true' : 'false'}
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {/* Mini animated depth gauge mirroring the active depth's exact motion */}
      <span
        className={`relative flex h-7 w-10 shrink-0 items-center justify-center overflow-visible ${
          motionEnabled ? 'ai-depth-thinking-active' : ''
        }`}
        aria-hidden="true"
      >
        <AiDepthGaugeSvg
          depthId={depthId}
          accentColor={accentColor}
          interactive={false}
          className="h-7 w-10 overflow-visible"
        />
      </span>

      <span className="truncate font-medium" style={{ color: 'var(--text)' }}>
        {mentorName} is thinking…
      </span>

      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{
          backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
          color: accentColor,
        }}
      >
        {depthCfg.label}
      </span>
    </div>
  );
};

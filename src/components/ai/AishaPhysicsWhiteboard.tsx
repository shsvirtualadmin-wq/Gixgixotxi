import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Square,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { ensureKatexLoaded } from '@/components/ui/MathText';
import type {
  PhysicsScene,
  PhysicsSceneShape,
} from '@/utils/aiMentorsLogic';

interface AishaPhysicsWhiteboardProps {
  scene: PhysicsScene;
  accentColor?: string;
  isStreaming?: boolean;
  cacheHit?: boolean;
}

const SPEED_OPTIONS = [1, 1.5, 2] as const;
type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];

/**
 * Ensures labels and strokes stay high-contrast on the crisp white classroom board.
 */
function ensureBoardContrast(color: string | undefined, fallback = '#0f172a'): string {
  const c = String(color || '').trim().toLowerCase();
  if (!c) return fallback;
  if (
    c === '#fff' ||
    c === '#ffffff' ||
    c === 'white' ||
    c === '#f8fafc' ||
    c === '#f1f5f9' ||
    c === '#e2e8f0' ||
    c === '#cbd5e1'
  ) {
    return fallback;
  }
  return color || fallback;
}

/**
 * Builds a smooth SVG path string from curve control points.
 */
function buildSmoothCurvePath(points: Array<[number, number]>): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
  }
  if (points.length === 3) {
    return `M ${points[0][0]} ${points[0][1]} Q ${points[1][0]} ${points[1][1]} ${points[2][0]} ${points[2][1]}`;
  }
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i][0] + points[i + 1][0]) / 2;
    const yc = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q ${points[i][0]} ${points[i][1]} ${xc} ${yc}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

function estimatePathLength(shape: PhysicsSceneShape): number {
  if (shape.type === 'line' || shape.type === 'arrow') {
    return Math.max(24, Math.ceil(Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1)));
  }
  if (shape.type === 'curve') {
    let total = 0;
    for (let i = 1; i < shape.points.length; i++) {
      total += Math.hypot(
        shape.points[i][0] - shape.points[i - 1][0],
        shape.points[i][1] - shape.points[i - 1][1]
      );
    }
    return Math.max(40, Math.ceil(total * 1.15));
  }
  return 200;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export const AishaPhysicsWhiteboard: React.FC<AishaPhysicsWhiteboardProps> = ({
  scene,
  accentColor = '#0ea5e9',
  isStreaming = false,
  cacheHit = false,
}) => {
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const totalSteps = scene.steps.length;

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(() =>
    reducedMotion && totalSteps > 0 ? totalSteps - 1 : 0
  );
  const [playing, setPlaying] = useState<boolean>(() => !reducedMotion);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [listening, setListening] = useState<boolean>(false);
  const [replayNonce, setReplayNonce] = useState<number>(0);
  const [katexMod, setKatexMod] = useState<any>(null);

  const listeningRef = useRef(false);
  const speedRef = useRef<PlaybackSpeed>(speed);
  speedRef.current = speed;

  // Keep currentStepIdx in bounds if steps array updates during streaming
  useEffect(() => {
    if (totalSteps === 0) return;
    if (isStreaming) {
      // During live streaming, reveal each newly completed step immediately!
      setCurrentStepIdx(totalSteps - 1);
      return;
    }
    setCurrentStepIdx((prev) => Math.max(0, Math.min(totalSteps - 1, prev)));
  }, [totalSteps, isStreaming]);

  // Lazy-load KaTeX ONLY if any step contains an equation
  const hasAnyEquation = useMemo(
    () => scene.steps.some((st) => Boolean(st.equation && st.equation.trim())),
    [scene.steps]
  );

  useEffect(() => {
    if (!hasAnyEquation) return;
    let active = true;
    void Promise.all([import('katex'), ensureKatexLoaded()])
      .then(([mod]) => {
        if (active) setKatexMod(mod.default || mod);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [hasAnyEquation]);

  // Auto-play timer (pauses while streaming or while speech synthesis is driving steps)
  useEffect(() => {
    if (!playing || reducedMotion || isStreaming || listening || totalSteps <= 1) return;
    if (currentStepIdx >= totalSteps - 1) {
      setPlaying(false);
      return;
    }
    const baseDelayMs = 2600;
    const delayMs = Math.max(700, Math.round(baseDelayMs / speed));
    const timer = window.setTimeout(() => {
      setCurrentStepIdx((prev) => {
        if (prev + 1 >= totalSteps) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [playing, reducedMotion, isStreaming, listening, currentStepIdx, totalSteps, speed]);

  const stopSpeech = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const speakStepAt = useCallback(
    (index: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        stopSpeech();
        return;
      }
      if (!listeningRef.current || index >= scene.steps.length) {
        stopSpeech();
        return;
      }
      setCurrentStepIdx(index);
      const step = scene.steps[index];
      const textToRead = step?.narration || '';
      if (!textToRead) {
        speakStepAt(index + 1);
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textToRead);
        utter.rate = speedRef.current;
        utter.onend = () => {
          if (!listeningRef.current) return;
          if (index + 1 < scene.steps.length) {
            speakStepAt(index + 1);
          } else {
            stopSpeech();
          }
        };
        utter.onerror = () => {
          stopSpeech();
        };
        window.speechSynthesis.speak(utter);
      } catch {
        stopSpeech();
      }
    },
    [scene.steps, stopSpeech]
  );

  const handleToggleListen = () => {
    if (listening) {
      stopSpeech();
      return;
    }
    if (totalSteps === 0) return;
    setPlaying(false);
    listeningRef.current = true;
    setListening(true);
    const startIdx = currentStepIdx >= totalSteps - 1 ? 0 : currentStepIdx;
    speakStepAt(startIdx);
  };

  const handlePlayPause = () => {
    if (totalSteps === 0) return;
    if (listening) stopSpeech();
    if (playing) {
      setPlaying(false);
      return;
    }
    if (currentStepIdx >= totalSteps - 1) {
      setCurrentStepIdx(0);
      setReplayNonce((n) => n + 1);
    }
    setPlaying(true);
  };

  const handleNext = () => {
    if (totalSteps === 0) return;
    if (listening) stopSpeech();
    setPlaying(false);
    setCurrentStepIdx((prev) => (prev + 1) % totalSteps);
  };

  const handleReplay = () => {
    if (totalSteps === 0) return;
    if (listening) stopSpeech();
    setCurrentStepIdx(0);
    setReplayNonce((n) => n + 1);
    setPlaying(!reducedMotion);
  };

  const handleCycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const nextSpeed = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setSpeed(nextSpeed);
  };

  const safeStepIdx = totalSteps > 0 ? Math.min(currentStepIdx, totalSteps - 1) : 0;
  const activeStep = scene.steps[safeStepIdx];

  // Collect unique arrow stroke colors for SVG marker defs
  const arrowColors = useMemo(() => {
    const set = new Set<string>();
    if (activeStep) {
      for (const sh of activeStep.shapes) {
        if (sh.type === 'arrow') {
          set.add(ensureBoardContrast(sh.stroke, '#e11d48'));
        }
      }
    }
    return Array.from(set);
  }, [activeStep]);

  const equationHtml = useMemo(() => {
    const eq = activeStep?.equation?.trim();
    if (!eq) return null;
    const cleanEq = eq.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').trim();
    const renderer =
      (typeof window !== 'undefined' && (window as any).katex?.renderToString
        ? (window as any).katex
        : null) || katexMod;
    if (!renderer?.renderToString) return null;
    try {
      return renderer.renderToString(cleanEq, {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return null;
    }
  }, [activeStep?.equation, katexMod]);

  const animDurationMs = Math.max(240, Math.round(580 / speed));
  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div
      data-aisha-whiteboard="true"
      className="w-full max-w-full overflow-hidden rounded-[22px] border shadow-sm"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Top Header */}
      <div
        className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
              color: accentColor,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <h4
            className="text-[13.5px] font-bold leading-snug truncate"
            style={{ color: 'var(--text)' }}
          >
            {scene.title || 'Physics Whiteboard'}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {cacheHit && (
            <span
              className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                color: accentColor,
              }}
            >
              Instant
            </span>
          )}
          <span
            className="text-[11.5px] font-semibold tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {totalSteps > 0 ? `${safeStepIdx + 1}/${totalSteps}` : '…'}
          </span>
        </div>
      </div>

      {/* Whiteboard Canvas (clean light paper surface for maximum diagram legibility) */}
      <div className="relative bg-[#fbfcfe] px-2 py-2.5 sm:px-3">
        <svg
          key={`wb_${safeStepIdx}_${replayNonce}`}
          viewBox="0 0 400 240"
          className="w-full h-auto block select-none rounded-[14px] border border-slate-200/80 bg-white"
          role="img"
          aria-label={`${scene.title || 'Physics diagram'} — step ${safeStepIdx + 1}`}
        >
          <defs>
            <pattern
              id="aisha-wb-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.85" fill="#e2e8f0" />
            </pattern>
            {arrowColors.map((col, idx) => (
              <marker
                key={col}
                id={`aisha-arrow-${idx}`}
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={col} />
              </marker>
            ))}
          </defs>

          <rect x="0" y="0" width="400" height="240" fill="url(#aisha-wb-grid)" />

          {activeStep?.shapes.map((shape, idx) => {
            const delayMs = reducedMotion ? 0 : idx * Math.round(90 / speed);
            const commonAnimStyle: React.CSSProperties = reducedMotion
              ? {}
              : {
                  animationDelay: `${delayMs}ms`,
                  animationDuration: `${animDurationMs}ms`,
                };

            if (shape.type === 'line') {
              const stroke = ensureBoardContrast(shape.stroke, '#0ea5e9');
              const len = estimatePathLength(shape);
              return (
                <g key={idx}>
                  <line
                    x1={shape.x1}
                    y1={shape.y1}
                    x2={shape.x2}
                    y2={shape.y2}
                    stroke={stroke}
                    strokeWidth={shape.strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={shape.dashed ? '6 4' : `${len}`}
                    className={
                      reducedMotion || shape.dashed ? 'aisha-wb-fade' : 'aisha-wb-stroke'
                    }
                    style={{
                      ...commonAnimStyle,
                      ['--wb-len' as any]: `${len}`,
                    }}
                  />
                  {shape.label && (
                    <text
                      x={(shape.x1 + shape.x2) / 2}
                      y={(shape.y1 + shape.y2) / 2 - 7}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#0f172a"
                      className={reducedMotion ? undefined : 'aisha-wb-fade'}
                      style={commonAnimStyle}
                    >
                      {shape.label}
                    </text>
                  )}
                </g>
              );
            }

            if (shape.type === 'arrow') {
              const stroke = ensureBoardContrast(shape.stroke, '#e11d48');
              const markerIdx = Math.max(0, arrowColors.indexOf(stroke));
              const len = estimatePathLength(shape);
              const mx = (shape.x1 + shape.x2) / 2;
              const my = (shape.y1 + shape.y2) / 2;
              return (
                <g key={idx}>
                  <line
                    x1={shape.x1}
                    y1={shape.y1}
                    x2={shape.x2}
                    y2={shape.y2}
                    stroke={stroke}
                    strokeWidth={shape.strokeWidth}
                    strokeLinecap="round"
                    markerEnd={`url(#aisha-arrow-${markerIdx})`}
                    strokeDasharray={shape.dashed ? '6 4' : `${len}`}
                    className={
                      reducedMotion || shape.dashed ? 'aisha-wb-fade' : 'aisha-wb-stroke'
                    }
                    style={{
                      ...commonAnimStyle,
                      ['--wb-len' as any]: `${len}`,
                    }}
                  />
                  {shape.label && (
                    <text
                      x={mx}
                      y={my - 8}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill={stroke}
                      className={reducedMotion ? undefined : 'aisha-wb-fade'}
                      style={commonAnimStyle}
                    >
                      {shape.label}
                    </text>
                  )}
                </g>
              );
            }

            if (shape.type === 'rect') {
              const stroke = ensureBoardContrast(shape.stroke, '#0ea5e9');
              return (
                <g
                  key={idx}
                  className={reducedMotion ? undefined : 'aisha-wb-pop'}
                  style={{
                    ...commonAnimStyle,
                    transformOrigin: `${shape.x + shape.w / 2}px ${shape.y + shape.h / 2}px`,
                  }}
                >
                  <rect
                    x={shape.x}
                    y={shape.y}
                    width={shape.w}
                    height={shape.h}
                    rx="4"
                    stroke={stroke}
                    strokeWidth={shape.strokeWidth}
                    strokeDasharray={shape.dashed ? '5 4' : undefined}
                    fill={shape.fill === 'none' ? 'rgba(14,165,233,0.06)' : shape.fill}
                  />
                  {shape.label && (
                    <text
                      x={shape.x + shape.w / 2}
                      y={shape.y + shape.h / 2 + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#0f172a"
                    >
                      {shape.label}
                    </text>
                  )}
                </g>
              );
            }

            if (shape.type === 'circle') {
              const stroke = ensureBoardContrast(shape.stroke, '#10b981');
              return (
                <g
                  key={idx}
                  className={reducedMotion ? undefined : 'aisha-wb-pop'}
                  style={{
                    ...commonAnimStyle,
                    transformOrigin: `${shape.cx}px ${shape.cy}px`,
                  }}
                >
                  <circle
                    cx={shape.cx}
                    cy={shape.cy}
                    r={shape.r}
                    stroke={stroke}
                    strokeWidth={shape.strokeWidth}
                    strokeDasharray={shape.dashed ? '5 4' : undefined}
                    fill={shape.fill === 'none' ? 'rgba(16,185,129,0.12)' : shape.fill}
                  />
                  {shape.label && (
                    <text
                      x={shape.cx}
                      y={shape.cy + 4}
                      textAnchor="middle"
                      fontSize="10.5"
                      fontWeight="700"
                      fill="#0f172a"
                    >
                      {shape.label}
                    </text>
                  )}
                </g>
              );
            }

            if (shape.type === 'curve') {
              const stroke = ensureBoardContrast(shape.stroke, '#0ea5e9');
              const d = buildSmoothCurvePath(shape.points);
              const len = estimatePathLength(shape);
              const midPt = shape.points[Math.floor(shape.points.length / 2)] || shape.points[0];
              return (
                <g key={idx}>
                  <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={shape.strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={shape.dashed ? '6 4' : `${len}`}
                    className={
                      reducedMotion || shape.dashed ? 'aisha-wb-fade' : 'aisha-wb-stroke'
                    }
                    style={{
                      ...commonAnimStyle,
                      ['--wb-len' as any]: `${len}`,
                    }}
                  />
                  {shape.label && midPt && (
                    <text
                      x={midPt[0]}
                      y={Math.max(16, midPt[1] - 9)}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill={stroke}
                      className={reducedMotion ? undefined : 'aisha-wb-fade'}
                      style={commonAnimStyle}
                    >
                      {shape.label}
                    </text>
                  )}
                </g>
              );
            }

            if (shape.type === 'label') {
              const fill = ensureBoardContrast(shape.color, '#0f172a');
              return (
                <text
                  key={idx}
                  x={shape.x}
                  y={shape.y}
                  textAnchor="middle"
                  fontSize={shape.size}
                  fontWeight="600"
                  fill={fill}
                  className={reducedMotion ? undefined : 'aisha-wb-fade'}
                  style={commonAnimStyle}
                >
                  {shape.text}
                </text>
              );
            }

            return null;
          })}
        </svg>

        {isStreaming && (
          <div className="mt-1.5 flex items-center justify-end gap-1.5 px-1 text-[11px] font-medium text-slate-500">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span>Drawing step {Math.max(1, totalSteps)}…</span>
          </div>
        )}
      </div>

      {/* Step Dots / Scrubber */}
      {totalSteps > 1 && (
        <div className="flex items-center gap-1 px-3.5 pt-2.5">
          {scene.steps.map((_, idx) => {
            const isCurrent = idx === safeStepIdx;
            const isPast = idx < safeStepIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (listening) stopSpeech();
                  setPlaying(false);
                  setCurrentStepIdx(idx);
                }}
                aria-label={`Go to step ${idx + 1}`}
                className="h-1.5 flex-1 rounded-full transition-opacity cursor-pointer"
                style={{
                  backgroundColor: isCurrent || isPast ? accentColor : 'var(--border)',
                  opacity: isCurrent ? 1 : isPast ? 0.55 : 0.7,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Active Step Equation & Narration (highlighted during Listen) */}
      {activeStep && (
        <div
          className="px-3.5 py-2.5 space-y-2 transition-colors"
          style={{
            backgroundColor: listening
              ? `color-mix(in srgb, ${accentColor} 8%, transparent)`
              : 'transparent',
          }}
        >
          {activeStep.equation && (
            <div
              className="overflow-x-auto rounded-xl px-3 py-1.5 text-[13.5px] font-medium"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              {equationHtml ? (
                <span dangerouslySetInnerHTML={{ __html: equationHtml }} />
              ) : (
                <code className="font-mono text-[12.5px]">{activeStep.equation}</code>
              )}
            </div>
          )}

          <p
            className="text-[13.5px] leading-[1.55] break-words"
            style={{
              color: 'var(--text)',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            <span
              className="mr-1.5 inline-block text-[11.5px] font-bold uppercase tracking-wide"
              style={{ color: accentColor }}
            >
              Step {safeStepIdx + 1}:
            </span>
            {activeStep.narration}
          </p>
        </div>
      )}

      {/* Playback Controls — cleanly wraps on 380px screens */}
      <div
        className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 border-t"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
      >
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={handlePlayPause}
            disabled={totalSteps === 0 || isStreaming}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-45"
            style={{ backgroundColor: accentColor }}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={totalSteps <= 1}
            aria-label="Next step"
            title="Next step"
            className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold cursor-pointer transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span>Next</span>
          </button>

          <button
            type="button"
            onClick={handleReplay}
            disabled={totalSteps === 0}
            aria-label="Replay animation"
            title="Replay"
            className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold cursor-pointer transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden min-[400px]:inline">Replay</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCycleSpeed}
            aria-label={`Playback speed ${speed}x. Tap to change.`}
            title="Playback speed"
            className="inline-flex h-8 min-w-[42px] items-center justify-center rounded-full px-2 text-[12px] font-bold tabular-nums cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            {speed}x
          </button>

          {speechSupported && (
            <button
              type="button"
              onClick={handleToggleListen}
              disabled={totalSteps === 0 || isStreaming}
              aria-label={listening ? 'Stop reading steps' : 'Listen to steps'}
              title={listening ? 'Stop' : 'Listen'}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold cursor-pointer transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-40"
              style={{
                backgroundColor: listening
                  ? `color-mix(in srgb, ${accentColor} 16%, var(--card))`
                  : 'var(--card)',
                border: listening
                  ? `1px solid ${accentColor}`
                  : '1px solid var(--border)',
                color: listening ? accentColor : 'var(--text)',
              }}
            >
              {listening ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{listening ? 'Stop' : 'Listen'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AishaPhysicsWhiteboard;

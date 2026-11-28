import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Square, Gauge, Sparkles } from 'lucide-react';
import { ensureKatexLoaded } from '@/components/ui/MathText';
import {
  buildGraphSvg,
  renderAiMarkdownWithKatex,
  sanitizeAnimationSvg,
  stripLatexForSpeech,
  type PhysicsScene,
} from '@/utils/aiMentorsLogic';

interface AishaPhysicsWhiteboardProps {
  scene: PhysicsScene;
  accentColor: string;
  isStreaming?: boolean;
  cacheHit?: boolean;
}

const SPEEDS = [1, 1.5, 2] as const;

function scaleTimeToken(numStr: string, unit: string, speed: number): string {
  const sec = unit === 'ms' ? Number(numStr) / 1000 : Number(numStr);
  return `${+(sec / speed).toFixed(3)}s`;
}

/** Scales CSS/SMIL durations by playback speed and offsets start time without JS inside iframe. */
function retimeSvgMarkup(svg: string, speed: number, offsetSec: number): string {
  const safeSpeed = speed > 0 ? speed : 1;
  const shift = Math.max(0, offsetSec) / safeSpeed;
  // Scale SMIL dur/begin attributes
  let out = svg.replace(
    /\b(dur|begin)\s*=\s*"(\d*\.?\d+)(m?s)"/gi,
    (_m, attr, num, unit) => {
      const scaled = (unit === 'ms' ? Number(num) / 1000 : Number(num)) / safeSpeed;
      const val = attr.toLowerCase() === 'begin' ? +(scaled - shift).toFixed(3) : +Math.max(0.05, scaled).toFixed(3);
      return `${attr}="${val}s"`;
    }
  );
  // Scale CSS animation-duration / animation-delay and shorthand animation durations inside <style>
  out = out.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
    let next = css.replace(
      /(animation-duration\s*:\s*)(\d*\.?\d+)(m?s)/gi,
      (_a, pre, n, u) => `${pre}${scaleTimeToken(n, u, safeSpeed)}`
    );
    next = next.replace(
      /(animation-delay\s*:\s*)(-?\d*\.?\d+)(m?s)/gi,
      (_a, pre, n, u) => {
        const s = (u === 'ms' ? Number(n) / 1000 : Number(n)) / safeSpeed - shift;
        return `${pre}${+s.toFixed(3)}s`;
      }
    );
    next = next.replace(
      /(animation\s*:\s*[^;{}]*?)(\d*\.?\d+)(m?s)/gi,
      (_a, pre, n, u) => `${pre}${scaleTimeToken(n, u, safeSpeed)}`
    );
    return `<style>${next}</style>`;
  });
  return out;
}

export function buildSandboxedAnimationDoc(
  svgBody: string,
  opts: { playing: boolean; speed: number; offsetSec: number; reducedMotion: boolean }
): string {
  const retimed = retimeSvgMarkup(svgBody, opts.speed, opts.offsetSec);
  const shiftCss =
    !opts.reducedMotion && opts.offsetSec > 0 && !/animation-delay\s*:/i.test(retimed)
      ? `svg *{animation-delay:-${(opts.offsetSec / opts.speed).toFixed(3)}s}`
      : '';
  const stateCss = opts.reducedMotion
    ? '*,*::before,*::after{animation:none!important}'
    : !opts.playing
    ? '*,*::before,*::after{animation-play-state:paused!important}'
    : '';
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">` +
    `<style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;display:flex;flex-direction:column;` +
    `align-items:center;justify-content:center;gap:6px}svg{width:100%;height:auto;max-height:100%;display:block}` +
    `${shiftCss}${stateCss}</style></head><body>${retimed}</body></html>`
  );
}

export const AishaPhysicsWhiteboard: React.FC<AishaPhysicsWhiteboardProps> = ({
  scene,
  accentColor,
  isStreaming = false,
  cacheHit = false,
}) => {
  const steps = useMemo(() => scene.steps || [], [scene.steps]);
  const totalDuration = Math.max(
    1,
    scene.totalDuration || (steps.length > 0 ? steps[steps.length - 1].to : 3)
  );
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [isPlaying, setIsPlaying] = useState(!reducedMotion);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [iframeAnchor, setIframeAnchor] = useState({ offsetSec: 0, runId: 0 });
  const [speaking, setSpeaking] = useState(false);
  const [lazyKatex, setLazyKatex] = useState<any>(() =>
    typeof window !== 'undefined' && (window as any).katex?.renderToString
      ? (window as any).katex
      : null
  );

  const speed = SPEEDS[speedIdx];
  const lastTickRef = useRef<number>(Date.now());

  const safeAnimationSvg = useMemo(() => {
    if (!scene.animationSvg) return '';
    const res = sanitizeAnimationSvg(scene.animationSvg);
    return res.ok ? res.svg : '';
  }, [scene.animationSvg]);

  const activeStepIdx = useMemo(() => {
    if (steps.length === 0) return 0;
    const idx = steps.findIndex((s) => elapsedSec >= s.from && elapsedSec < s.to);
    return idx >= 0 ? idx : steps.length - 1;
  }, [steps, elapsedSec]);

  const activeStep = steps[activeStepIdx] || steps[0];
  const graphSvg = useMemo(
    () =>
      scene.graph
        ? buildGraphSvg(scene.graph, {
            totalDuration,
            activePhase: Math.min(activeStepIdx, Math.max(0, scene.graph.phases.length - 1)),
          })
        : '',
    [scene.graph, totalDuration, activeStepIdx]
  );

  const isGraphOnly = Boolean(scene.graphOnly || (!safeAnimationSvg && graphSvg));
  const combinedSvg = useMemo(() => {
    if (isGraphOnly) return graphSvg;
    if (safeAnimationSvg && graphSvg) return `${safeAnimationSvg}${graphSvg}`;
    return safeAnimationSvg || graphSvg;
  }, [isGraphOnly, safeAnimationSvg, graphSvg]);

  const hasVisual = Boolean(combinedSvg);

  // Auto-play once animation SVG finishes streaming
  useEffect(() => {
    if (!isStreaming && hasVisual && !reducedMotion) {
      setElapsedSec(0);
      setIsPlaying(true);
      setIframeAnchor((prev) => ({ offsetSec: 0, runId: prev.runId + 1 }));
    }
  }, [isStreaming, hasVisual, reducedMotion]);

  // Playback clock driving step highlight (does NOT reload iframe)
  useEffect(() => {
    if (!isPlaying || isStreaming || !hasVisual || reducedMotion) return;
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = ((now - lastTickRef.current) / 1000) * speed;
      lastTickRef.current = now;
      setElapsedSec((prev) => {
        const next = prev + dt;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [isPlaying, isStreaming, hasVisual, reducedMotion, speed, totalDuration]);

  // Lazy-load KaTeX when any step has an equation
  const hasEquation = useMemo(() => steps.some((s) => Boolean(s.equation)), [steps]);
  useEffect(() => {
    if (!hasEquation || lazyKatex) return;
    let active = true;
    void Promise.all([import('katex'), ensureKatexLoaded()])
      .then(([mod]) => {
        if (!active) return;
        const winKatex = (window as any).katex?.renderToString ? (window as any).katex : null;
        setLazyKatex(winKatex || mod.default || mod);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [hasEquation, lazyKatex]);

  // Stop speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const srcDoc = useMemo(() => {
    if (!combinedSvg) return '';
    return buildSandboxedAnimationDoc(combinedSvg, {
      playing: isPlaying,
      speed,
      offsetSec: iframeAnchor.offsetSec,
      reducedMotion: Boolean(reducedMotion),
    });
  }, [combinedSvg, isPlaying, speed, iframeAnchor.offsetSec, reducedMotion]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      setIframeAnchor((prev) => ({ offsetSec: elapsedSec, runId: prev.runId }));
    } else {
      const startAt = elapsedSec >= totalDuration - 0.05 ? 0 : elapsedSec;
      setElapsedSec(startAt);
      setIsPlaying(true);
      setIframeAnchor((prev) => ({ offsetSec: startAt, runId: prev.runId + 1 }));
    }
  }, [isPlaying, elapsedSec, totalDuration]);

  const handleReplay = useCallback(() => {
    setElapsedSec(0);
    setIsPlaying(true);
    setIframeAnchor((prev) => ({ offsetSec: 0, runId: prev.runId + 1 }));
  }, []);

  const handleCycleSpeed = useCallback(() => {
    setSpeedIdx((i) => (i + 1) % SPEEDS.length);
    setIframeAnchor((prev) => ({ offsetSec: elapsedSec, runId: prev.runId + 1 }));
  }, [elapsedSec]);

  const handleJumpToStep = useCallback((stepIdx: number) => {
    const target = steps[stepIdx];
    if (!target) return;
    setElapsedSec(target.from);
    setIframeAnchor((prev) => ({ offsetSec: target.from, runId: prev.runId + 1 }));
  }, [steps]);

  const handleListen = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const spoken = activeStep
        ? stripLatexForSpeech(`${activeStep.narration}. ${activeStep.equation || ''}`)
        : '';
      if (!spoken) return;
      const utter = new SpeechSynthesisUtterance(spoken);
      utter.rate = speed;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  }, [speaking, activeStep, speed]);

  const equationHtml = useMemo(() => {
    if (!activeStep?.equation) return '';
    return renderAiMarkdownWithKatex(`$$${activeStep.equation}$$`, lazyKatex || undefined);
  }, [activeStep?.equation, lazyKatex]);

  const showDualStack = Boolean(!isGraphOnly && safeAnimationSvg && graphSvg);

  return (
    <div
      className="w-full max-w-full rounded-[22px] border overflow-hidden"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
          <h4 className="text-[14px] font-bold truncate" style={{ color: 'var(--text)' }}>
            {scene.title}
          </h4>
          {cacheHit && (
            <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              Instant
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          Step {Math.min(activeStepIdx + 1, Math.max(1, steps.length))}/{Math.max(1, steps.length)}
        </span>
      </div>

      {/* Sandboxed SVG Animation Stage */}
      {hasVisual ? (
        <div className="w-full bg-slate-50 dark:bg-slate-900/60 border-b" style={{ borderColor: 'var(--border)' }}>
          <iframe
            key={`${iframeAnchor.runId}-${isPlaying ? 'p' : 's'}-${speed}`}
            title={scene.title}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className={`w-full block border-0 ${showDualStack ? 'h-[430px] sm:h-[480px]' : 'aspect-[380/240] min-h-[210px]'}`}
          />
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 px-4 py-4 text-[13px] font-medium border-b"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
          <span>Drawing animated physics scene…</span>
        </div>
      )}

      {/* Player Controls */}
      {hasVisual && !isStreaming && (
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 border-b flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor, color: '#ffffff' }}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={handleReplay}
              aria-label="Replay animation"
              className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium border cursor-pointer hover:bg-[var(--surface-hover)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Replay</span>
            </button>
            <button
              type="button"
              onClick={handleCycleSpeed}
              aria-label={`Animation speed ${speed}x`}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold border cursor-pointer hover:bg-[var(--surface-hover)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <Gauge className="h-3.5 w-3.5" />
              <span>{speed}x</span>
            </button>
          </div>
          {typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button
              type="button"
              onClick={handleListen}
              aria-label={speaking ? 'Stop narration' : 'Listen to narration'}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium border cursor-pointer hover:bg-[var(--surface-hover)]"
              style={{
                borderColor: speaking ? accentColor : 'var(--border)',
                color: speaking ? accentColor : 'var(--text)',
              }}
            >
              {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{speaking ? 'Stop' : 'Listen'}</span>
            </button>
          )}
        </div>
      )}

      {/* Active Step Equation (KaTeX) + Highlighted Step Narration List */}
      <div className="p-3.5 space-y-2.5">
        {equationHtml && (
          <div
            className="rounded-xl px-3 py-2 text-center overflow-x-auto border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            dangerouslySetInnerHTML={{ __html: equationHtml }}
          />
        )}
        <div className="space-y-1.5">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIdx;
            return (
              <button
                key={`${idx}-${step.from}`}
                type="button"
                onClick={() => handleJumpToStep(idx)}
                className="w-full text-left rounded-xl px-3 py-2 text-[13.5px] leading-relaxed transition-colors cursor-pointer border"
                style={{
                  backgroundColor: isActive ? `${accentColor}16` : 'transparent',
                  borderColor: isActive ? accentColor : 'transparent',
                  color: 'var(--text)',
                }}
              >
                <span className="font-bold mr-1.5" style={{ color: isActive ? accentColor : 'var(--text-muted)' }}>
                  {idx + 1}.
                </span>
                <span>{step.narration}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AishaPhysicsWhiteboard;

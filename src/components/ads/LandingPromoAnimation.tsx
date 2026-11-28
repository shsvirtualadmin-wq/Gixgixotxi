import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';

const LOOP_SECONDS = 28;

const PROMO_CSS = `
.bpa-stage * { will-change: transform, opacity; }
.bpa-paused, .bpa-paused * { animation-play-state: paused !important; }

@keyframes bpa-s1 { 0%{opacity:0;transform:translateY(10px)} 3%,17%{opacity:1;transform:translateY(0)} 20%,100%{opacity:0;transform:translateY(-8px)} }
@keyframes bpa-s2 { 0%,19%{opacity:0;transform:translateY(12px)} 23%,37%{opacity:1;transform:translateY(0)} 40%,100%{opacity:0;transform:translateY(-8px)} }
@keyframes bpa-s3 { 0%,39%{opacity:0;transform:translateY(12px)} 43%,57%{opacity:1;transform:translateY(0)} 60%,100%{opacity:0;transform:translateY(-8px)} }
@keyframes bpa-s4 { 0%,59%{opacity:0;transform:translateY(12px)} 63%,77%{opacity:1;transform:translateY(0)} 80%,100%{opacity:0;transform:translateY(-8px)} }
@keyframes bpa-s5 { 0%,79%{opacity:0;transform:scale(0.96)} 83%,96%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.02)} }
@keyframes bpa-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes bpa-flame { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.08) translateY(-3px)} }
@keyframes bpa-ring { 0%,59%{stroke-dashoffset:264} 68%,78%{stroke-dashoffset:11} 82%,100%{stroke-dashoffset:264} }
@keyframes bpa-progress { 0%{transform:scaleX(0)} 100%{transform:scaleX(1)} }
@keyframes bpa-lamp { 0%,100%{opacity:0.45} 50%{opacity:0.75} }

.bpa-scene-1 { animation: bpa-s1 ${LOOP_SECONDS}s ease-in-out infinite; }
.bpa-scene-2 { animation: bpa-s2 ${LOOP_SECONDS}s ease-in-out infinite; }
.bpa-scene-3 { animation: bpa-s3 ${LOOP_SECONDS}s ease-in-out infinite; }
.bpa-scene-4 { animation: bpa-s4 ${LOOP_SECONDS}s ease-in-out infinite; }
.bpa-scene-5 { animation: bpa-s5 ${LOOP_SECONDS}s ease-in-out infinite; }
.bpa-float-a { animation: bpa-float 3.2s ease-in-out infinite; }
.bpa-float-b { animation: bpa-float 3.8s ease-in-out infinite 0.5s; }
.bpa-float-c { animation: bpa-float 3.5s ease-in-out infinite 1s; }
.bpa-flame { transform-box: fill-box; transform-origin: center bottom; animation: bpa-flame 1.4s ease-in-out infinite; }
.bpa-ring-arc { stroke-dasharray: 264; stroke-dashoffset: 264; animation: bpa-ring ${LOOP_SECONDS}s ease-out infinite; }
.bpa-progress-bar { transform-origin: left center; animation: bpa-progress ${LOOP_SECONDS}s linear infinite; }
.bpa-lamp { animation: bpa-lamp 2.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .bpa-stage, .bpa-stage * { animation: none !important; transition: none !important; }
}
`;

export const LandingPromoAnimation: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq) {
      setReducedMotion(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const handleStart = () => {
    setStarted(true);
    setPlaying(true);
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!started) {
      handleStart();
      return;
    }
    setPlaying((p) => !p);
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRunKey((k) => k + 1);
    setStarted(true);
    setPlaying(true);
  };

  const isPaused = !playing || tabHidden || reducedMotion;

  return (
    <div
      data-landing-promo-animation="true"
      className="relative w-full aspect-[9/13] sm:aspect-[16/9] max-h-[440px] sm:max-h-[400px] overflow-hidden bg-[#07080C] text-white select-none"
      onClick={() => handleTogglePlay()}
      role="region"
      aria-label="Boardly animated showcase"
    >
      <style>{PROMO_CSS}</style>

      {/* Ambient dark radial glow + dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(232,53,59,0.22), transparent 52%), radial-gradient(circle at 82% 78%, rgba(245,183,59,0.18), transparent 50%), #07080C',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Poster frame (shown initially or under prefers-reduced-motion) */}
      {!started || reducedMotion ? (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#E8353B]" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#F5B73B]">
              NUST · ACCA · CA
            </span>
          </div>
          <h3
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
          >
            Boardly. Education for everyone.
          </h3>
          <p className="max-w-md text-xs sm:text-sm text-white/70">
            Thousands of MCQs, Commons, Grand Line &amp; AI Mentors. Free to start — unlimited for 199 PKR.
          </p>
          {!reducedMotion && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
              aria-label="Play Boardly showcase animation"
              className="mt-1 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#07080C] shadow-[0_0_32px_rgba(232,53,59,0.45)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="h-7 w-7 translate-x-0.5 fill-current" />
            </button>
          )}
          <span className="text-[11px] font-mono text-white/50">boardly.cfd</span>
        </div>
      ) : (
        /* 5-Scene Looping Animated Stage (transform / opacity / stroke-dashoffset only) */
        <div
          key={runKey}
          className={`bpa-stage relative z-10 h-full w-full ${isPaused ? 'bpa-paused' : ''}`}
        >
          {/* SCENE 1: Tired student at night with books */}
          <div className="bpa-scene-1 absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <svg viewBox="0 0 260 150" className="w-56 sm:w-64 h-auto" aria-hidden="true">
              {/* Night window + moon */}
              <rect x="24" y="14" width="66" height="54" rx="8" fill="#101524" stroke="rgba(255,255,255,0.18)" />
              <circle cx="52" cy="36" r="10" fill="#F5B73B" />
              <circle cx="57" cy="33" r="9" fill="#101524" />
              <circle cx="74" cy="28" r="1.5" fill="#fff" opacity="0.7" />
              <circle cx="38" cy="52" r="1.3" fill="#fff" opacity="0.6" />
              {/* Desk lamp glow */}
              <polygon className="bpa-lamp" points="200,38 148,118 242,118" fill="rgba(245,183,59,0.22)" />
              <path d="M214 118 L214 52 L198 38" stroke="#9CA3AF" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M188 42 L208 32 L212 46 Z" fill="#F5B73B" />
              {/* Books stack */}
              <rect x="34" y="96" width="54" height="10" rx="2" fill="#E8353B" />
              <rect x="38" y="85" width="48" height="10" rx="2" fill="#2A3142" />
              <rect x="32" y="107" width="60" height="11" rx="2" fill="#F5B73B" />
              {/* Tired student silhouette resting head near open book */}
              <circle cx="136" cy="76" r="15" fill="#E5E7EB" />
              <path d="M108 118 C110 96, 162 96, 166 118 Z" fill="#374151" />
              <path d="M104 116 L176 116 L170 107 L110 107 Z" fill="#F8FAFC" opacity="0.9" />
              <rect x="18" y="118" width="224" height="6" rx="3" fill="rgba(255,255,255,0.2)" />
            </svg>
            <p
              className="max-w-md text-xl sm:text-2xl font-bold leading-snug"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
            >
              Exams are close. Where do you practice?
            </p>
          </div>

          {/* SCENE 2: Boardly logo + glass cards for NUST, ACCA, CA */}
          <div className="bpa-scene-2 absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8353B] text-lg font-black shadow-[0_0_24px_rgba(232,53,59,0.5)]">
                B
              </span>
              <span
                className="text-xl font-bold tracking-wide"
                style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
              >
                BOARDLY
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-md">
              {[
                { name: 'NUST', sub: 'NET Prep', cls: 'bpa-float-a', accent: '#E8353B' },
                { name: 'ACCA', sub: 'BT · FA · MA', cls: 'bpa-float-b', accent: '#F5B73B' },
                { name: 'CA', sub: 'PRC · CAF', cls: 'bpa-float-c', accent: '#E8353B' },
              ].map((card) => (
                <div
                  key={card.name}
                  className={`${card.cls} rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-3.5 backdrop-blur-md`}
                >
                  <div
                    className="text-base sm:text-lg font-bold"
                    style={{ fontFamily: "'Doto', var(--font-dot), sans-serif", color: card.accent }}
                  >
                    {card.name}
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-white/65">{card.sub}</div>
                </div>
              ))}
            </div>
            <p
              className="max-w-md text-lg sm:text-2xl font-bold leading-snug"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
            >
              Thousands of MCQs. Free to start.
            </p>
          </div>

          {/* SCENE 3: Commons, Grand Line, streak flame */}
          <div className="bpa-scene-3 absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="bpa-float-a rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur-md">
                <div className="text-xs font-semibold text-[#F5B73B]">Commons</div>
                <div className="text-[11px] text-white/65">Notes &amp; Doubts</div>
              </div>
              <div className="bpa-float-b flex flex-col items-center rounded-2xl border border-[#E8353B]/45 bg-[#E8353B]/15 px-4 py-3 backdrop-blur-md">
                <svg viewBox="0 0 40 44" className="h-9 w-9 bpa-flame" aria-hidden="true">
                  <path
                    d="M21 3 C28 12, 34 19, 32 29 C30 37, 25 41, 20 41 C12 41, 8 34, 9 26 C10 19, 15 15, 16 11 C18 14, 19 16, 21 3 Z"
                    fill="#E8353B"
                  />
                  <path
                    d="M20 17 C24 22, 26 27, 25 32 C24 36, 22 38, 19 38 C15 38, 13 34, 14 29 C15 24, 18 21, 20 17 Z"
                    fill="#F5B73B"
                  />
                </svg>
                <div className="mt-1 text-xs font-bold text-white">14-Day Streak</div>
              </div>
              <div className="bpa-float-c rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur-md">
                <div className="text-xs font-semibold text-[#E8353B]">Grand Line</div>
                <div className="text-[11px] text-white/65">Live Rank Arena</div>
              </div>
            </div>
            <p
              className="max-w-md text-xl sm:text-2xl font-bold leading-snug"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
            >
              Practice. Compete. Share. Grow.
            </p>
          </div>

          {/* SCENE 4: High score + 199 PKR */}
          <div className="bpa-scene-4 absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 110 110" className="h-28 w-28" aria-hidden="true">
                <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                <circle
                  cx="55"
                  cy="55"
                  r="42"
                  fill="none"
                  stroke="#F5B73B"
                  strokeWidth="8"
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  className="bpa-ring-arc"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-2xl font-bold text-[#F5B73B]"
                  style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
                >
                  96%
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/60">Top Score</span>
              </div>
            </div>
            <p
              className="max-w-md text-lg sm:text-2xl font-bold leading-snug"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
            >
              Free for every student. Unlimited for just <span className="text-[#F5B73B]">199 PKR</span>.
            </p>
          </div>

          {/* SCENE 5: Logo + Boardly. Education for everyone. + boardly.cfd */}
          <div className="bpa-scene-5 absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8353B] text-3xl font-black shadow-[0_0_36px_rgba(232,53,59,0.55)]">
              B
            </span>
            <p
              className="max-w-md text-2xl sm:text-3xl font-bold leading-tight"
              style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
            >
              Boardly. Education for everyone.
            </p>
            <span className="rounded-full border border-[#F5B73B]/40 bg-[#F5B73B]/15 px-4 py-1 font-mono text-xs font-semibold text-[#F5B73B]">
              boardly.cfd
            </span>
          </div>

          {/* Controls: Play / Pause + Replay */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={playing ? 'Pause animation' : 'Play animation'}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md hover:bg-black/75 cursor-pointer"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-[0.5px]" />}
            </button>
            <button
              type="button"
              onClick={handleReplay}
              aria-label="Replay animation"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md hover:bg-black/75 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Thin loop progress indicator (transform only) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div className="bpa-progress-bar h-full w-full bg-gradient-to-r from-[#E8353B] to-[#F5B73B]" />
          </div>
        </div>
      )}
    </div>
  );
};

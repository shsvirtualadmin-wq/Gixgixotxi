import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Zap, Target } from 'lucide-react';

interface PhoneMockupProps {
  screen?: 0 | 1 | 2 | 3;
  onScreenChange?: (screen: 0 | 1 | 2 | 3) => void;
}

const TABS: { id: 0 | 1 | 2 | 3; label: string }[] = [
  { id: 0, label: 'Cockpit' },
  { id: 1, label: 'Crew' },
  { id: 2, label: 'Captain' },
  { id: 3, label: 'Arena' },
];

export function PhoneMockup({
  screen: externalScreen,
  onScreenChange,
}: PhoneMockupProps) {
  const [internalScreen, setInternalScreen] = useState<0 | 1 | 2 | 3>(0);
  const activeScreen = externalScreen !== undefined ? externalScreen : internalScreen;

  // Track user interaction pause
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const pauseAutoRotation = useCallback(() => {
    isInteractingRef.current = true;
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      setIsPaused(false);
    }, 11000); // Resumes after 11 seconds of inactivity
  }, []);

  const changeScreen = useCallback(
    (next: 0 | 1 | 2 | 3, userInitiated = true) => {
      if (userInitiated) {
        pauseAutoRotation();
      }
      if (onScreenChange) {
        onScreenChange(next);
      } else {
        setInternalScreen(next);
      }
    },
    [onScreenChange, pauseAutoRotation]
  );

  const handlePrev = useCallback(() => {
    const next = ((activeScreen + 3) % 4) as 0 | 1 | 2 | 3;
    changeScreen(next, true);
  }, [activeScreen, changeScreen]);

  const handleNext = useCallback(() => {
    const next = ((activeScreen + 1) % 4) as 0 | 1 | 2 | 3;
    changeScreen(next, true);
  }, [activeScreen, changeScreen]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(true);

  // Track viewport visibility so timers and idle float animations pause when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-rotation every 5.5s (only while in viewport and tab is visible)
  useEffect(() => {
    if (externalScreen !== undefined || !isInView) return;

    const interval = setInterval(() => {
      if (!isInteractingRef.current && !document.hidden) {
        setInternalScreen((prev) => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [externalScreen, isInView]);

  // Page visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else if (!isInteractingRef.current) {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keyboard navigation (ArrowLeft & ArrowRight, only while in viewport)
  useEffect(() => {
    if (!isInView) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, isInView]);

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    pauseAutoRotation();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Horizontal swipe threshold 40px, more horizontal than vertical
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center w-full max-w-[480px] lg:max-w-[450px] mx-auto select-none ${
        !isInView ? 'pause-animations-offscreen' : ''
      }`}
      onMouseEnter={pauseAutoRotation}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glow behind the cluster (static radial-gradient, zero blur filter) */}
      <div
        className="absolute -top-12 -right-8 w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none opacity-45"
        style={{
          background: 'radial-gradient(circle, rgba(215, 25, 33, 0.22) 0%, rgba(255, 255, 255, 0.03) 42%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-8 -left-8 w-64 h-64 sm:w-80 sm:h-80 rounded-full pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(215, 25, 33, 0.12) 48%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Floating Glass Widgets Layered Composition */}
      <div className="relative w-full min-h-[380px] sm:min-h-[420px] flex flex-col justify-center py-2 sm:py-4">
        {/* VIEW 0: COCKPIT */}
        {activeScreen === 0 && (
          <div className="w-full flex flex-col gap-3 sm:gap-4 transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
            {/* Widget 1: Daily Goal & Track (top bubble, offset right) */}
            <div className="w-full sm:w-[94%] ml-auto p-4 sm:p-5 rounded-[28px] glass-card animate-float-1 transition-transform">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D71921] animate-pulse" />
                  Active Track
                </span>
                <span className="text-[#D71921] font-semibold">Mathematics &amp; Science</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-[var(--text)] font-dot tracking-tight">
                Daily Goal: 25 MCQs
              </div>
              <div className="mt-2.5 w-full bg-[var(--border-strong)] rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-[#D71921] to-[#ff4d56] h-full rounded-full w-[72%]" />
              </div>
            </div>

            {/* Widget 2: 7-Day Streak & Daily Ring (middle bubble, overlapping, offset left) */}
            <div className="w-full sm:w-[96%] mr-auto p-4 sm:p-5 rounded-[30px] glass-card flex items-center justify-between gap-4 animate-float-2 transition-transform">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs mb-2.5 text-[var(--text)] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#D71921]" />
                  <span>7-Day Streak</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D71921]/15 text-[#D71921] font-bold">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <span
                        className={`w-3 h-3 rounded-full transition-all ${
                          idx < 5
                            ? 'bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.6)]'
                            : 'bg-[var(--border-strong)]'
                        }`}
                      />
                      <span className="text-[10px] font-medium text-[var(--text-muted)]">{day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Ring Display Widget (non-button) */}
              <div className="flex flex-col items-center justify-center shrink-0 pl-3 border-l border-white/10">
                <div className="w-14 h-14 rounded-full border-[3px] border-[#D71921] border-t-[var(--border-strong)] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(215,25,33,0.2)]">
                  <span className="font-dot text-sm font-bold text-[var(--text)] leading-none">18</span>
                  <span className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">/25</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-medium mt-1">Daily Ring</span>
              </div>
            </div>

            {/* Widget 3: Weak Chapters (< 50%) (bottom bubble) */}
            <div className="w-full p-4 sm:p-5 rounded-[28px] glass-card flex flex-col gap-2.5 animate-float-3 transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  Weak Chapters (&lt; 50%)
                </span>
                <span className="text-[10px] text-[#D71921] font-mono font-medium">Smart AI Diagnostics</span>
              </div>

              <div className="p-3 rounded-[20px] glass-row flex items-center justify-between gap-3 hover:bg-white/[0.07] transition-colors">
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] text-[var(--text)] font-semibold truncate">
                    Integration by Parts
                  </div>
                  <div className="font-dot text-[#D71921] text-[11px] font-medium">Calculus &amp; Math</div>
                </div>
                <button
                  type="button"
                  onClick={pauseAutoRotation}
                  className="px-3.5 py-1.5 text-xs font-heading font-semibold rounded-full bg-[#D71921] hover:bg-[#b8141b] text-white shrink-0 shadow-[0_4px_14px_rgba(215,25,33,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Drill
                </button>
              </div>

              <div className="p-3 rounded-[20px] glass-row flex items-center justify-between gap-3 hover:bg-white/[0.07] transition-colors">
                <div className="min-w-0">
                  <div className="text-xs sm:text-[13px] text-[var(--text)] font-semibold truncate">
                    Electromagnetism
                  </div>
                  <div className="font-dot text-[#D71921] text-[11px] font-medium">Physics Track</div>
                </div>
                <button
                  type="button"
                  onClick={pauseAutoRotation}
                  className="px-3.5 py-1.5 text-xs font-heading font-semibold rounded-full bg-[#D71921] hover:bg-[#b8141b] text-white shrink-0 shadow-[0_4px_14px_rgba(215,25,33,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Drill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: CREW */}
        {activeScreen === 1 && (
          <div className="w-full flex flex-col gap-3 sm:gap-4 transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
            {/* Widget 1: Weekly Squad Goal */}
            <div className="w-full sm:w-[94%] ml-auto p-4 sm:p-5 rounded-[28px] glass-card flex items-center justify-between gap-3 animate-float-1 transition-transform">
              <div>
                <span className="text-[11px] text-[var(--text-muted)] uppercase font-semibold block mb-1">
                  Weekly Squad Goal
                </span>
                <div className="text-base sm:text-lg font-bold text-[var(--text)] font-dot">
                  500 <span className="text-xs font-normal text-[var(--text-muted)] font-sans">Completed MCQs</span>
                </div>
                <div className="mt-2 w-36 bg-[var(--border-strong)] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#D71921] h-full rounded-full w-[84%]" />
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[#D71921] flex flex-col items-center justify-center font-dot text-xs font-bold text-[var(--text)] shrink-0 shadow-[0_0_14px_rgba(215,25,33,0.25)]">
                PKT
              </div>
            </div>

            {/* Widget 2: Squad Synergy */}
            <div className="w-full sm:w-[96%] mr-auto p-4 sm:p-5 rounded-[30px] glass-card flex flex-col gap-2.5 animate-float-2 transition-transform">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                Squad Synergy
              </span>
              <div className="p-3 px-4 rounded-[20px] glass-row flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[var(--text)] font-medium">Shared Streaks</span>
                <span className="font-dot text-[#D71921] font-semibold">Daily Active</span>
              </div>
              <div className="p-3 px-4 rounded-[20px] glass-row flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[var(--text)] font-medium">Mistake Diagnostics</span>
                <span className="font-dot text-[var(--text-muted)]">Aggregated</span>
              </div>
            </div>

            {/* Widget 3: Squad-Wide Pro Benefit */}
            <div className="w-full p-4 sm:p-5 rounded-[28px] glass-card-highlight flex items-center gap-3 animate-float-3 transition-transform">
              <div className="w-9 h-9 rounded-full bg-[#D71921] text-white flex items-center justify-center shrink-0 shadow-md">
                <Zap size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-[13px] font-bold text-white">
                  1 Pro Member Unlocks Squad-Wide Pro
                </div>
                <div className="text-[11px] text-white/70">
                  Study squad peers gain full unlimited access automatically
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CAPTAIN */}
        {activeScreen === 2 && (
          <div className="w-full flex flex-col gap-3 sm:gap-4 transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
            {/* Widget 1: Campus Ambassador & Commission */}
            <div className="w-full sm:w-[94%] ml-auto p-4 sm:p-5 rounded-[28px] glass-card animate-float-1 transition-transform">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                <span>Campus Ambassador</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D71921]/15 text-[#D71921] font-semibold text-[10px]">
                  Verified
                </span>
              </div>
              <div className="text-base sm:text-lg font-bold text-[var(--text)] font-dot">
                20% <span className="text-xs font-normal text-[var(--text-muted)] font-sans">Direct Commission</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1.5 font-dot">
                PKR 40 per Pro Subscription
              </div>
            </div>

            {/* Widget 2: Captain Perks */}
            <div className="w-full sm:w-[96%] mr-auto p-4 sm:p-5 rounded-[30px] glass-card flex flex-col gap-2.5 animate-float-2 transition-transform">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                Captain Perks
              </span>
              <div className="p-3 px-4 rounded-[20px] glass-row flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[var(--text)] font-medium">Instant Free Pro</span>
                <span className="text-xs text-[#D71921] font-semibold">Unlocked</span>
              </div>
              <div className="p-3 px-4 rounded-[20px] glass-row flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[var(--text)] font-medium">JazzCash / EasyPaisa</span>
                <span className="text-xs text-[var(--text-muted)] font-medium">Direct Payouts</span>
              </div>
            </div>

            {/* Widget 3: Unique Referral */}
            <div className="w-full p-4 sm:p-5 rounded-[28px] glass-card flex items-center justify-between gap-3 animate-float-3 transition-transform">
              <div>
                <span className="text-xs sm:text-[13px] font-semibold text-[var(--text)] block">
                  Unique Referral Link &amp; Code
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Instant student registration &amp; payout ledger
                </span>
              </div>
              <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-white/[0.08] text-white border border-white/10 shrink-0">
                Live
              </span>
            </div>
          </div>
        )}

        {/* VIEW 3: ARENA */}
        {activeScreen === 3 && (
          <div className="w-full flex flex-col gap-3 sm:gap-4 transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
            {/* Widget 1: Grand Line Arena */}
            <div className="w-full sm:w-[94%] ml-auto p-4 sm:p-5 rounded-[28px] glass-card-highlight animate-float-1 transition-transform">
              <div className="text-xs text-[#D71921] font-semibold mb-1 flex items-center gap-1.5">
                <Target size={14} />
                Grand Line Arena
              </div>
              <div className="text-base sm:text-lg font-bold text-[var(--text)] font-dot">
                Public Tests by Captains
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Synchronized competitive practice across Pakistan
              </div>
            </div>

            {/* Widget 2: Arena Details */}
            <div className="w-full sm:w-[96%] mr-auto p-4 sm:p-5 rounded-[30px] glass-card flex flex-col gap-2.5 animate-float-2 transition-transform">
              <div className="p-3 px-4 rounded-[20px] glass-row flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[var(--text)] font-medium">Live Test Timer</span>
                <span className="font-dot text-[#D71921] font-semibold">Synchronized</span>
              </div>
              <div className="p-3 px-4 rounded-[20px] glass-row flex items-center justify-between text-xs sm:text-[13px]">
                <span className="text-[var(--text)] font-medium">Nationwide Percentile</span>
                <span className="font-dot text-[var(--text-muted)]">Instant</span>
              </div>
            </div>

            {/* Widget 3: Live Queue Banner */}
            <div className="w-full p-4 rounded-[28px] bg-[#D71921] shadow-[0_20px_45px_rgba(215,25,33,0.38)] flex items-center justify-between text-white animate-float-3 transition-transform px-5">
              <div className="min-w-0">
                <div className="text-xs sm:text-[13px] font-bold">Queue Active</div>
                <div className="text-[11px] text-white/85">Sunday 8:00 PM PKT</div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-full bg-white/20 text-white shrink-0">
                LIVE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Compact, Glass Pill Control Bar under the widgets */}
      <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1.5 w-full">
        <div
          role="tablist"
          aria-label="Preview views"
          className="inline-flex items-center gap-1 p-1 sm:p-1.5 rounded-full glass-card"
        >
          {/* Back Arrow button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous preview"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer active:scale-90"
            title="Previous preview (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>

          {/* 4 View Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => changeScreen(tab.id, true)}
                  className={`h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-heading font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-[#D71921] text-white shadow-[0_4px_14px_rgba(215,25,33,0.45)]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Next Arrow button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next preview"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer active:scale-90"
            title="Next preview (Right Arrow)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Small quiet caption underneath */}
        <div className="flex items-center gap-2 text-[11px] font-heading text-white/50">
          <span>Sample preview</span>
          {isPaused && (
            <span className="text-[10px] text-[#D71921]/90 font-mono">· paused</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhoneMockup;

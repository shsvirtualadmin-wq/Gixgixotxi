import { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  D1UniversityAttemptRecord,
  D1WeakChapterItem,
} from '@/services/universityMcqService';
import { useSmoothMode } from '@/utils/smoothMode';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BoardlyCoPilotCardProps {
  firstName: string;
  streak: number;
  recentAttempts: D1UniversityAttemptRecord[];
  weakChapters: D1WeakChapterItem[];
  questionsSolved: number;
}

function formatClock(now: Date): string {
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

const CoPilotLiveClock = memo(function CoPilotLiveClock({ clockText }: { clockText: string }) {
  return (
    <span
      className="text-[10.5px] sm:text-[11px] font-bold tabular-nums shrink-0"
      style={{
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
      }}
      data-testid="copilot-live-clock"
    >
      {clockText}
    </span>
  );
});

export const BoardlyCoPilotCard = memo(function BoardlyCoPilotCard({
  firstName,
  streak,
  recentAttempts,
  weakChapters,
  questionsSolved,
}: BoardlyCoPilotCardProps) {
  const { smoothMode } = useSmoothMode();
  const { t, formatNumber } = useLanguage();
  const rawName = (firstName || '').trim();
  const safeName = rawName && rawName.toLowerCase() !== 'student' ? rawName : '';
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const [inViewport, setInViewport] = useState(true);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        setInViewport(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build messages strictly from real loaded data (never invent counts)
  const messages = useMemo<string[]>(() => {
    const list: string[] = [];
    const safeAttempts = Array.isArray(recentAttempts) ? recentAttempts : [];
    const safeWeak = Array.isArray(weakChapters) ? weakChapters : [];
    const latestAttempt = safeAttempts[0];
    const hour = new Date().getHours();
    const greetingKey =
      hour < 12
        ? 'dashboard.greetingMorning'
        : hour < 17
        ? 'dashboard.greetingAfternoon'
        : 'dashboard.greetingEvening';
    const greetingLine = safeName
      ? `${t(greetingKey, { name: safeName })}! ${t('dashboard.readyToPractice')}`
      : t('dashboard.readyToPractice');

    if (safeAttempts.length === 0 && questionsSolved <= 0) {
      list.push(greetingLine);
      list.push(t('dashboard.universitiesSubtitle'));
      if (streak > 0) {
        list.push(
          `${streak === 1 ? t('dashboard.streakDay') : t('dashboard.streakDays', { count: formatNumber(streak) })} — ${t('dashboard.keepStreakAlive')}`
        );
      }
      return list;
    }

    if (latestAttempt) {
      list.push(
        `${latestAttempt.universityName} · ${formatNumber(Math.round(Number(latestAttempt.accuracy) || 0))}% ${t('dashboard.accuracy')}`
      );
    }

    if (safeWeak.length > 0) {
      const weakest = safeWeak[0];
      list.push(
        `${weakest.topic} (${weakest.subject}) · ${formatNumber(Math.round(Number(weakest.accuracy) || 0))}%`
      );
    }

    if (streak > 0) {
      list.push(
        `${streak === 1 ? t('dashboard.streakDay') : t('dashboard.streakDays', { count: formatNumber(streak) })} — ${t('dashboard.keepStreakAlive')}`
      );
    }

    list.push(greetingLine);

    return list;
  }, [safeName, streak, recentAttempts, weakChapters, questionsSolved, t, formatNumber]);

  const [msgIndex, setMsgIndex] = useState(0);
  const activeMessage =
    messages[msgIndex % messages.length] || t('dashboard.readyToPractice');
  const [typedLen, setTypedLen] = useState<number>(() => (smoothMode ? activeMessage.length : 0));
  const [mouthFrame, setMouthFrame] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  const isTyping = !smoothMode && typedLen < activeMessage.length;

  // Reset typewriter when activeMessage changes
  useEffect(() => {
    if (smoothMode) {
      setTypedLen(activeMessage.length);
      return;
    }
    setTypedLen(0);
  }, [activeMessage, smoothMode]);

  // Typewriter effect & mouth movement ONLY while typing
  useEffect(() => {
    if (smoothMode || typedLen >= activeMessage.length) {
      setMouthFrame(0);
      return;
    }
    const timer = setTimeout(() => {
      setTypedLen((prev) => Math.min(activeMessage.length, prev + 1));
      setMouthFrame((prev) => (prev + 1) % 3);
    }, 26);
    return () => clearTimeout(timer);
  }, [typedLen, activeMessage, smoothMode]);

  const [clockText, setClockText] = useState<string>(() => formatClock(new Date()));
  const tickCountRef = useRef(0);

  // Single consolidated 1s timer driving clock, 9s message rotation, and ~4s eye blink.
  // Completely pauses (clears interval) when off-screen or when document.visibilityState === 'hidden'.
  useEffect(() => {
    if (!inViewport) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (blinkTimeout !== null) {
        clearTimeout(blinkTimeout);
        blinkTimeout = null;
      }
    };

    const startTimerIfVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        clearTimers();
        return;
      }
      setClockText(formatClock(new Date()));
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          clearTimers();
          return;
        }
        tickCountRef.current += 1;
        const tick = tickCountRef.current;
        setClockText(formatClock(new Date()));

        if (messages.length > 1 && tick % 9 === 0) {
          setMsgIndex((prev) => (prev + 1) % messages.length);
        }

        if (!smoothMode && tick % 4 === 0) {
          setIsBlinking(true);
          if (blinkTimeout !== null) clearTimeout(blinkTimeout);
          blinkTimeout = setTimeout(() => {
            setIsBlinking(false);
            blinkTimeout = null;
          }, 150);
        }
      }, 1000);
    };

    startTimerIfVisible();
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        clearTimers();
      } else {
        startTimerIfVisible();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimers();
    };
  }, [inViewport, messages.length, smoothMode]);

  // Tap skips typing if currently typing, or rotates immediately to next message
  const handleCardTap = useCallback(() => {
    if (typedLen < activeMessage.length) {
      setTypedLen(activeMessage.length);
      setMouthFrame(0);
    } else if (messages.length > 1) {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }
  }, [typedLen, activeMessage.length, messages.length]);

  const displayedText = activeMessage.slice(0, typedLen);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={handleCardTap}
      aria-label="Boardly Co-Pilot"
      data-testid="boardly-copilot-card"
      className="w-full text-start rounded-[28px] px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-3.5 sm:gap-4 transition-transform duration-150 active:scale-[0.99] cursor-pointer select-none"
      style={{
        backgroundColor: 'var(--copilot-bg)',
        border: '1px solid var(--copilot-border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Dot-matrix robot face with antenna */}
      <div className="relative flex flex-col items-center shrink-0 pt-2">
        {/* Antenna */}
        <div className="flex flex-col items-center -mb-0.5" aria-hidden="true">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: 'var(--accent)',
              opacity: isTyping ? 1 : 0.85,
              transform: isTyping ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 150ms ease, opacity 150ms ease',
            }}
          />
          <span
            className="w-[2px] h-1.5"
            style={{ backgroundColor: 'var(--copilot-border)' }}
          />
        </div>

        {/* Dark screen with white dot eyes and smile */}
        <div
          className="w-12 h-11 rounded-[14px] flex flex-col items-center justify-center gap-1.5 px-2 py-1.5 relative overflow-hidden"
          style={{
            backgroundColor: 'var(--copilot-screen-bg)',
            border: '1px solid var(--copilot-screen-border)',
          }}
          aria-hidden="true"
        >
          {/* Dot Eyes (blink via scaleY transform) */}
          <div
            className="flex items-center justify-between w-6"
            style={{
              transform: isBlinking ? 'scaleY(0.15)' : 'scaleY(1)',
              opacity: isBlinking ? 0.5 : 1,
              transition: 'transform 90ms ease, opacity 90ms ease',
            }}
          >
            <div className="grid grid-cols-2 gap-[1.5px]">
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
            </div>
            <div className="grid grid-cols-2 gap-[1.5px]">
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
              <span className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: 'var(--copilot-dot)' }} />
            </div>
          </div>

          {/* Dot Smile — mouth moves ONLY while typing */}
          <div className="flex items-end justify-center gap-[2px] h-2.5">
            <span
              className="w-[3px] h-[3px] rounded-full -translate-y-[2px]"
              style={{ backgroundColor: 'var(--copilot-dot)' }}
            />
            <span
              className="w-[3px] h-[3px] rounded-full"
              style={{
                backgroundColor: 'var(--copilot-dot)',
                transform:
                  isTyping && mouthFrame === 1
                    ? 'translateY(-1.5px) scaleY(1.35)'
                    : 'translateY(0px) scaleY(1)',
                transition: 'transform 80ms ease',
              }}
            />
            <span
              className="w-[3px] h-[3px] rounded-full"
              style={{
                backgroundColor: 'var(--copilot-dot)',
                transform:
                  isTyping && mouthFrame === 2
                    ? 'translateY(1px) scaleY(1.45)'
                    : isTyping && mouthFrame === 1
                    ? 'translateY(-1px) scaleY(0.8)'
                    : 'translateY(0px) scaleY(1)',
                transition: 'transform 80ms ease',
              }}
            />
            <span
              className="w-[3px] h-[3px] rounded-full"
              style={{
                backgroundColor: 'var(--copilot-dot)',
                transform:
                  isTyping && mouthFrame === 1
                    ? 'translateY(-1.5px) scaleY(1.35)'
                    : 'translateY(0px) scaleY(1)',
                transition: 'transform 80ms ease',
              }}
            />
            <span
              className="w-[3px] h-[3px] rounded-full -translate-y-[2px]"
              style={{ backgroundColor: 'var(--copilot-dot)' }}
            />
          </div>
        </div>
      </div>

      {/* Right Column: Header line + Typewriter message */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 min-w-0">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
              aria-hidden="true"
            />
            <span
              className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
              }}
            >
              BOARDLY CO-PILOT · {t('common.live')}
            </span>
          </div>

          <CoPilotLiveClock clockText={clockText} />
        </div>

        <p
          className="text-[13.5px] sm:text-[14.5px] font-semibold leading-snug min-h-[38px] flex items-center"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--text)',
          }}
          data-testid="copilot-live-message"
        >
          <span>
            {displayedText}
            {isTyping && (
              <span
                className="inline-block w-1.5 h-3.5 ms-0.5 align-middle"
                style={{ backgroundColor: 'var(--accent)' }}
                aria-hidden="true"
              />
            )}
          </span>
        </p>
      </div>
    </button>
  );
});

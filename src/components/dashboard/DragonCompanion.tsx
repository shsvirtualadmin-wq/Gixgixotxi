import React, {
  Component,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  Flame,
  X,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Compass,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadD1UniversityAttempts,
  type D1WeakChapterItem,
} from '@/services/universityMcqService';
import { type D1McqRow } from '@/constants/d1Universities';
import { MathText } from '@/components/ui/MathText';
import { LineLoader, ButtonLineLoader } from '@/components/ui/LineLoader';
import { useSmoothMode } from '@/utils/smoothMode';

// ── Single Constant for Dragon Name & Unlock Threshold ──────────────────────
export const DRAGON_COMPANION_NAME = 'Zenryu';
export const DRAGON_UNLOCK_THRESHOLD = 1000;

const FEATURE_FLAG_KEY = 'dragon_companion_enabled';
const HIDE_DRAGON_STORAGE_KEY = 'boardly_hide_dragon_companion';
const HIDE_DRAGON_EVENT = 'boardly-dragon-visibility-changed';
const AWAKENED_STORAGE_PREFIX = 'boardly_zenryu_awakened_v1_';
const SOUND_ENABLED_STORAGE_KEY = 'boardly_zenryu_sound_enabled';

// ── Layered Transparent WebP Asset Paths (/assets/zenryu/*) ─────────────────
export const ZENRYU_ASSETS = {
  wingLeft: '/assets/zenryu/wing-l.webp',
  tail: '/assets/zenryu/tail.webp',
  body: '/assets/zenryu/zenryu-body.webp',
  wingRight: '/assets/zenryu/wing-r.webp',
  head: '/assets/zenryu/head.webp',
  eyesGlow: '/assets/zenryu/eyes-glow.webp',
  flameRoar: '/assets/zenryu/flame-roar.webp',
  egg: '/assets/zenryu/dragon-egg.webp',
} as const;

/**
 * Feature flag check (`dragon_companion_enabled`, default ON).
 */
export function isDragonCompanionEnabled(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const winFlag = (window as unknown as Record<string, unknown>)[FEATURE_FLAG_KEY];
      if (winFlag === false || winFlag === 'false' || winFlag === '0') {
        return false;
      }
      const stored = window.localStorage.getItem(FEATURE_FLAG_KEY);
      if (stored === 'false' || stored === '0' || stored === 'off') {
        return false;
      }
    }
    const envVal = (import.meta as unknown as { env?: Record<string, string> })?.env
      ?.VITE_DRAGON_COMPANION_ENABLED;
    if (envVal === 'false' || envVal === '0') {
      return false;
    }
  } catch {
    // Ignore storage access errors and keep default ON
  }
  return true;
}

/**
 * Persisted user preference for "Hide dragon" in Settings (default false = shown).
 */
export function getHideDragonPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(HIDE_DRAGON_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setHideDragonPreference(hide: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (hide) {
      window.localStorage.setItem(HIDE_DRAGON_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(HIDE_DRAGON_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(HIDE_DRAGON_EVENT, { detail: hide }));
  } catch {
    // Ignore storage quota errors
  }
}

export function useDragonHiddenPreference() {
  const [hideDragon, setHideDragonState] = useState<boolean>(() =>
    getHideDragonPreference()
  );

  useEffect(() => {
    const onCustomChange = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      if (typeof custom.detail === 'boolean') {
        setHideDragonState(custom.detail);
      } else {
        setHideDragonState(getHideDragonPreference());
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === HIDE_DRAGON_STORAGE_KEY) {
        setHideDragonState(e.newValue === 'true');
      }
    };
    window.addEventListener(HIDE_DRAGON_EVENT, onCustomChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(HIDE_DRAGON_EVENT, onCustomChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setHideDragon = useCallback((next: boolean) => {
    setHideDragonState(next);
    setHideDragonPreference(next);
  }, []);

  return { hideDragon, setHideDragon };
}

// ── Server-Side Verified Role Cache (Never Trust Client Input) ──────────────
type VerifiedServerRole = 'admin' | 'superadmin' | 'student' | 'captain' | null;
const verifiedRoleMemoryCache = new Map<string, VerifiedServerRole>();

async function fetchVerifiedServerRole(uid: string): Promise<VerifiedServerRole> {
  if (!uid) return null;
  if (verifiedRoleMemoryCache.has(uid)) {
    return verifiedRoleMemoryCache.get(uid) ?? null;
  }
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) return null;
    const idToken = await currentUser.getIdToken();
    if (!idToken) return null;

    const res = await fetch('/api/me/role', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { role?: string | null };
    const rawRole = typeof data?.role === 'string' ? data.role.trim().toLowerCase() : '';
    const role: VerifiedServerRole =
      rawRole === 'superadmin'
        ? 'superadmin'
        : rawRole === 'admin'
        ? 'admin'
        : rawRole === 'captain'
        ? 'captain'
        : rawRole === 'student'
        ? 'student'
        : null;
    verifiedRoleMemoryCache.set(uid, role);
    return role;
  } catch {
    return null;
  }
}

/**
 * Read-only calculation of lifetime correct MCQ answers from existing D1 attempt records.
 */
function computeLifetimeCorrectMcqs(uid?: string | null): number {
  try {
    const attempts = loadD1UniversityAttempts(uid);
    if (!Array.isArray(attempts) || attempts.length === 0) return 0;
    let totalCorrect = 0;
    for (const att of attempts) {
      const c = Number(att?.correctCount || 0);
      if (Number.isFinite(c) && c > 0) {
        totalCorrect += Math.floor(c);
      }
    }
    return totalCorrect;
  } catch {
    return 0;
  }
}

/**
 * Optional soft synthesized dragon roar (Web Audio API, zero external audio files,
 * muted by default and only played when user explicitly enables sound).
 */
function playSoftDragonRoarSound(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.42);

    sub.type = 'triangle';
    sub.frequency.setValueAtTime(72, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.48);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.5);
    sub.stop(now + 0.5);
    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 650);
  } catch {
    // Ignore audio errors
  }
}

// ── Layered Transparent WebP Dragon Rig (NO SVG Dragon Fallback) ─────────────
interface ZenryuLayeredRigProps {
  isSleeping: boolean;
  isRoaring: boolean;
  isStaticMode: boolean;
  headRef?: React.RefObject<HTMLDivElement | null>;
  compactAvatar?: boolean;
}

const ZenryuLayeredRig = memo(function ZenryuLayeredRig({
  isSleeping,
  isRoaring,
  isStaticMode,
  headRef,
  compactAvatar = false,
}: ZenryuLayeredRigProps) {
  const [bodyLoaded, setBodyLoaded] = useState(false);
  const [missingSlot, setMissingSlot] = useState<string | null>(null);

  const rigStateClass = isRoaring
    ? 'zenryu-rig--roaring'
    : isSleeping
    ? 'zenryu-rig--sleeping'
    : isStaticMode
    ? 'zenryu-rig--static'
    : 'zenryu-rig--flying';

  return (
    <div
      className={`zenryu-rig ${
        compactAvatar ? 'zenryu-rig--avatar' : 'zenryu-rig--stage'
      } ${rigStateClass}`}
      aria-hidden="true"
    >
      {/* Soft Glow Placeholder until lazy-loaded WebP layers finish decoding */}
      {!bodyLoaded && !missingSlot && (
        <div className="zenryu-rig-placeholder" />
      )}

      {/* Named Asset Slot Fallback if a developer deletes /assets/zenryu/*.webp */}
      {missingSlot ? (
        <div className="zenryu-slot-notice">
          <span>Asset slot: /assets/zenryu/{missingSlot}</span>
        </div>
      ) : (
        <>
          {/* Layer 1: Far/Left Swept Wing (wing-l.webp) */}
          <img
            src={ZENRYU_ASSETS.wingLeft}
            alt=""
            decoding="async"
            draggable={false}
            onError={() => setMissingSlot('wing-l.webp')}
            className="zenryu-layer zenryu-layer--wing-l"
          />

          {/* Layer 2: Long Spiked Whip Tail (tail.webp) */}
          <img
            src={ZENRYU_ASSETS.tail}
            alt=""
            decoding="async"
            draggable={false}
            onError={() => setMissingSlot('tail.webp')}
            className="zenryu-layer zenryu-layer--tail"
          />

          {/* Layer 3: Armored Crimson & Black Scaled Body (zenryu-body.webp) */}
          <img
            src={ZENRYU_ASSETS.body}
            alt=""
            decoding="async"
            draggable={false}
            onLoad={() => setBodyLoaded(true)}
            onError={() => setMissingSlot('zenryu-body.webp')}
            className="zenryu-layer zenryu-layer--body"
          />

          {/* Layer 4: Near/Right Foreground Wing with Visible Veins (wing-r.webp) */}
          <img
            src={ZENRYU_ASSETS.wingRight}
            alt=""
            decoding="async"
            draggable={false}
            onError={() => setMissingSlot('wing-r.webp')}
            className="zenryu-layer zenryu-layer--wing-r"
          />

          {/* Layer 5 & 6: Articulated Horned Head + Glowing Ember Eyes (Follows Finger) */}
          <div ref={headRef} className="zenryu-head-pivot">
            <img
              src={ZENRYU_ASSETS.head}
              alt=""
              decoding="async"
              draggable={false}
              onError={() => setMissingSlot('head.webp')}
              className="zenryu-layer zenryu-layer--head"
            />
            <img
              src={ZENRYU_ASSETS.eyesGlow}
              alt=""
              decoding="async"
              draggable={false}
              onError={() => setMissingSlot('eyes-glow.webp')}
              className={`zenryu-layer zenryu-layer--eyes ${
                isSleeping ? 'zenryu-layer--eyes-sleeping' : ''
              }`}
            />
            {/* Layer 7: Roar Flame Burst (flame-roar.webp) */}
            <img
              src={ZENRYU_ASSETS.flameRoar}
              alt=""
              decoding="async"
              draggable={false}
              className={`zenryu-layer zenryu-layer--flame ${
                isRoaring ? 'zenryu-layer--flame-active' : ''
              }`}
            />
          </div>
        </>
      )}
    </div>
  );
});

// ── Props Interface ─────────────────────────────────────────────────────────
export interface DragonCompanionProps {
  weakChapters?: D1WeakChapterItem[];
  currentMcq?: D1McqRow | null;
  isTestModalOpen?: boolean;
}

interface ZenryuChatMessage {
  id: string;
  role: 'zenryu' | 'user';
  content: string;
  timestamp: string;
}

const QUICK_CHIPS = [
  {
    id: 'explain-mcq',
    label: 'Explain this MCQ',
    icon: BookOpen,
  },
  {
    id: 'weak-chapters',
    label: 'My weak chapters',
    icon: Compass,
  },
  {
    id: 'plan-day',
    label: 'Plan my day',
    icon: Calendar,
  },
] as const;

function getTimeLabel(): string {
  try {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Now';
  }
}

function detectLowEndDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    const cores = navigator.hardwareConcurrency;
    if (typeof cores === 'number' && cores > 0 && cores <= 2) return true;
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData === true) return true;
  } catch {
    // Ignore
  }
  return false;
}

// ── Inner Component ─────────────────────────────────────────────────────────
function DragonCompanionInner({
  weakChapters = [],
  currentMcq = null,
  isTestModalOpen = false,
}: DragonCompanionProps) {
  const { user } = useAuth();
  const { smoothMode } = useSmoothMode();
  const { hideDragon } = useDragonHiddenPreference();

  // Feature flag check (default ON)
  const featureEnabled = useMemo(() => isDragonCompanionEnabled(), []);

  // Lazy-load assets after first paint so Cockpit initial paint is never delayed
  const [postPaintReady, setPostPaintReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      const timerId = window.setTimeout(() => {
        if (!cancelled) setPostPaintReady(true);
      }, 60);
      return () => window.clearTimeout(timerId);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  // 1. Server-verified role check (default null = treated as locked)
  const [verifiedRole, setVerifiedRole] = useState<VerifiedServerRole>(null);
  useEffect(() => {
    let active = true;
    if (!user?.uid) {
      setVerifiedRole(null);
      return;
    }
    void fetchVerifiedServerRole(user.uid).then((r) => {
      if (active) setVerifiedRole(r);
    });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  // 2. Read-only lifetime correct MCQs count
  const [correctCount, setCorrectCount] = useState<number>(() =>
    computeLifetimeCorrectMcqs(user?.uid)
  );

  useEffect(() => {
    const refreshCount = () => {
      setCorrectCount(computeLifetimeCorrectMcqs(user?.uid));
    };
    refreshCount();
    window.addEventListener('boardly-d1-attempts-updated', refreshCount);
    window.addEventListener('storage', refreshCount);
    return () => {
      window.removeEventListener('boardly-d1-attempts-updated', refreshCount);
      window.removeEventListener('storage', refreshCount);
    };
  }, [user?.uid]);

  const isAdminBypass =
    verifiedRole === 'admin' || verifiedRole === 'superadmin';
  const isUnlockedByCount = correctCount >= DRAGON_UNLOCK_THRESHOLD;
  const isUnlocked = isAdminBypass || isUnlockedByCount;

  // 3. One-time unlock celebration state (for students hitting 1,000 correct answers)
  const [showAwakeningCelebration, setShowAwakeningCelebration] = useState(false);

  useEffect(() => {
    if (!user?.uid || isAdminBypass || !isUnlockedByCount) return;
    try {
      const storageKey = `${AWAKENED_STORAGE_PREFIX}${user.uid}`;
      const alreadyCelebrated = window.localStorage.getItem(storageKey) === 'true';
      if (!alreadyCelebrated) {
        window.localStorage.setItem(storageKey, 'true');
        setShowAwakeningCelebration(true);
        const timer = window.setTimeout(() => {
          setShowAwakeningCelebration(false);
        }, 4600);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user?.uid, isAdminBypass, isUnlockedByCount]);

  // Reduced motion & low-end device detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const isLowEndDevice = useMemo(() => detectLowEndDevice(), []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isStaticPose = prefersReducedMotion || smoothMode || isLowEndDevice;

  // ── Stage-Contained Flight, Sleep, Roar, Head-Tracking & Drag State ───────
  const [isSleeping, setIsSleeping] = useState(false);
  const [isRoaring, setIsRoaring] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [isStageVisible, setIsStageVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(SOUND_ENABLED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        if (next) {
          window.localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, 'true');
        } else {
          window.localStorage.removeItem(SOUND_ENABLED_STORAGE_KEY);
        }
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const stageRef = useRef<HTMLElement | null>(null);
  const dragonMoverRef = useRef<HTMLDivElement | null>(null);
  const headPivotRef = useRef<HTMLDivElement | null>(null);
  const emberRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lastInteractionRef = useRef<number>(Date.now());
  const isSleepingRef = useRef<boolean>(false);

  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  const markActivity = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (isSleepingRef.current) {
      isSleepingRef.current = false;
      setIsSleeping(false);
    }
  }, []);

  // Pause when browser tab is hidden
  useEffect(() => {
    const onVisChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  // Pause when the Dragon Stage is scrolled off-screen
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsStageVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [postPaintReady, isUnlocked]);

  // Idle timer -> Perch on the right edge of the stage & sleep after 20s idle
  useEffect(() => {
    if (!isUnlocked || hideDragon || isStaticPose || isSheetOpen) return;
    const interval = window.setInterval(() => {
      if (Date.now() - lastInteractionRef.current >= 20000 && !isSleepingRef.current) {
        isSleepingRef.current = true;
        setIsSleeping(true);
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [isUnlocked, hideDragon, isStaticPose, isSheetOpen]);

  // ── Stage-Contained Flight, Head Tracking & Ember Physics Loop ────────────
  const stageFlightRef = useRef({
    phase: 0,
    x: 0,
    y: 0,
    facing: 1, // 1 = facing right, -1 = facing left
    bankDeg: 0,
    headAngleDeg: 0,
    targetHeadAngleDeg: 0,
    pointerLocalX: null as number | null,
    pointerLocalY: null as number | null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    pointerStartX: 0,
    pointerStartY: 0,
    movedDistance: 0,
    initialized: false,
    emberTick: 0,
    embers: Array.from({ length: 7 }, () => ({
      x: 0,
      y: 0,
      life: 0,
      scale: 1,
    })),
  });

  // Compute safe bounds strictly inside the Dragon Stage
  const getStageMetrics = useCallback(() => {
    const stageEl = stageRef.current;
    const stageW = stageEl ? stageEl.clientWidth : 360;
    const stageH = stageEl ? stageEl.clientHeight : 204;
    const moverEl = dragonMoverRef.current;
    const dragonW = moverEl && moverEl.offsetWidth > 0
      ? moverEl.offsetWidth
      : stageW < 520
      ? Math.min(272, Math.max(220, stageW * 0.68))
      : Math.min(365, Math.max(280, stageW * 0.48));
    const dragonH = dragonW * (640 / 960);

    const minX = 4;
    const maxX = Math.max(minX, stageW - dragonW - 4);
    const minY = -Math.round(dragonH * 0.06);
    const maxY = Math.max(minY, stageH - dragonH * 0.86);

    // Right-edge perch coordinates inside the stage
    const perchX = maxX;
    const perchY = Math.round((minY + maxY) * 0.52);

    return {
      stageW,
      stageH,
      dragonW,
      dragonH,
      minX,
      maxX,
      minY,
      maxY,
      perchX,
      perchY,
    };
  }, []);

  useEffect(() => {
    if (
      !postPaintReady ||
      !isUnlocked ||
      hideDragon ||
      isTabHidden ||
      !isStageVisible ||
      isSheetOpen ||
      isTestModalOpen
    ) {
      return;
    }

    const mover = dragonMoverRef.current;
    if (!mover) return;

    const st = stageFlightRef.current;
    const initialMetrics = getStageMetrics();

    if (!st.initialized) {
      st.x = initialMetrics.perchX;
      st.y = initialMetrics.perchY;
      st.facing = -1;
      st.initialized = true;
    }

    // Static perched pose on right edge for prefers-reduced-motion / Smooth Mode / low-end devices
    if (isStaticPose) {
      const m = getStageMetrics();
      st.x = m.perchX;
      st.y = m.perchY;
      st.facing = -1;
      mover.style.transform = `translate3d(${Math.round(st.x)}px, ${Math.round(
        st.y
      )}px, 0) scaleX(-1)`;
      if (headPivotRef.current) {
        headPivotRef.current.style.transform = 'rotate(0deg)';
      }
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const m = getStageMetrics();
      const centerX = (m.minX + m.maxX) * 0.5;
      const spanX = Math.max(8, (m.maxX - m.minX) * 0.48);
      const centerY = (m.minY + m.maxY) * 0.46;
      const spanY = Math.max(6, (m.maxY - m.minY) * 0.42);

      if (!st.isDragging) {
        if (isSleepingRef.current) {
          // Glide to the right-edge perch inside the stage and sleep
          const dx = m.perchX - st.x;
          const dy = m.perchY - st.y;
          st.x += dx * Math.min(1, dt * 3.0);
          st.y += dy * Math.min(1, dt * 3.0);
          st.bankDeg += (0 - st.bankDeg) * Math.min(1, dt * 6);
          st.facing = -1;
        } else {
          // Smooth figure-8 gliding path strictly inside the stage
          st.phase += dt * 0.68;
          const targetX = centerX + Math.sin(st.phase) * spanX;
          const targetY = centerY + Math.sin(st.phase * 2) * spanY;

          const prevX = st.x;
          st.x += (targetX - st.x) * Math.min(1, dt * 3.6);
          st.y += (targetY - st.y) * Math.min(1, dt * 3.6);

          // Clamp strictly to stage bounds
          st.x = Math.max(m.minX, Math.min(m.maxX, st.x));
          st.y = Math.max(m.minY, Math.min(m.maxY, st.y));

          const velX = (st.x - prevX) / dt;
          if (Math.abs(velX) > 3.5) {
            st.facing = velX >= 0 ? 1 : -1;
          }
          const desiredBank = Math.max(-9, Math.min(9, velX * 0.055));
          st.bankDeg += (desiredBank - st.bankDeg) * Math.min(1, dt * 6);
        }
      }

      if (mover) {
        mover.style.transform = `translate3d(${st.x.toFixed(1)}px, ${st.y.toFixed(
          1
        )}px, 0) rotate(${st.bankDeg.toFixed(1)}deg) scaleX(${st.facing})`;
      }

      // Head turn that follows the user's finger/cursor inside the stage
      if (
        !isSleepingRef.current &&
        st.pointerLocalX !== null &&
        st.pointerLocalY !== null
      ) {
        const headCenterX =
          st.x + (st.facing === 1 ? m.dragonW * 0.72 : m.dragonW * 0.28);
        const headCenterY = st.y + m.dragonH * 0.36;
        const dx = (st.pointerLocalX - headCenterX) * st.facing;
        const dy = st.pointerLocalY - headCenterY;
        const rawAngle = Math.atan2(dy, Math.max(28, dx)) * (180 / Math.PI);
        st.targetHeadAngleDeg = Math.max(-18, Math.min(18, rawAngle * 0.55));
      } else {
        st.targetHeadAngleDeg = isSleepingRef.current ? 8 : 0;
      }

      st.headAngleDeg +=
        (st.targetHeadAngleDeg - st.headAngleDeg) * Math.min(1, dt * 8);
      if (headPivotRef.current) {
        headPivotRef.current.style.transform = `rotate(${st.headAngleDeg.toFixed(
          1
        )}deg)`;
      }

      // Stage-contained ember particles (GPU transform/opacity only)
      st.emberTick += dt;
      if (st.emberTick >= 0.085) {
        st.emberTick = 0;
        const slot = st.embers.find((e) => e.life <= 0.05) || st.embers[0];
        if (slot) {
          slot.x =
            st.x + m.dragonW * 0.48 + (Math.random() - 0.5) * (m.dragonW * 0.42);
          slot.y =
            st.y + m.dragonH * 0.55 + (Math.random() - 0.5) * (m.dragonH * 0.24);
          slot.life = 1;
          slot.scale = 0.65 + Math.random() * 0.65;
        }
      }

      for (let i = 0; i < st.embers.length; i++) {
        const emp = st.embers[i];
        const el = emberRefs.current[i];
        if (!el) continue;
        if (emp.life > 0) {
          emp.life = Math.max(0, emp.life - dt * 1.75);
          emp.y -= dt * 22;
          emp.x -= st.facing * dt * 10;
          el.style.opacity = (emp.life * 0.82).toFixed(2);
          el.style.transform = `translate3d(${emp.x.toFixed(1)}px, ${emp.y.toFixed(
            1
          )}px, 0) scale(${(emp.scale * emp.life).toFixed(2)})`;
        } else {
          el.style.opacity = '0';
        }
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [
    postPaintReady,
    isUnlocked,
    hideDragon,
    isTabHidden,
    isStageVisible,
    isSheetOpen,
    isTestModalOpen,
    isStaticPose,
    getStageMetrics,
  ]);

  // Track finger/pointer inside the stage so Zenryu's head follows it
  const handleStagePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      stageFlightRef.current.pointerLocalX = e.clientX - rect.left;
      stageFlightRef.current.pointerLocalY = e.clientY - rect.top;
      markActivity();
    },
    [markActivity]
  );

  const handleStagePointerLeave = useCallback(() => {
    stageFlightRef.current.pointerLocalX = null;
    stageFlightRef.current.pointerLocalY = null;
  }, []);

  // ── Tap (Roar + Flame Burst + Open Sheet) & Stage-Clamped Drag Handlers ───
  const openCompanionSheet = useCallback(() => {
    markActivity();
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(18);
      }
    } catch {
      // Ignore vibrate restrictions
    }
    if (soundEnabled) {
      playSoftDragonRoarSound();
    }
    setIsRoaring(true);
    window.setTimeout(() => {
      setIsRoaring(false);
      setIsSheetOpen(true);
    }, 380);
  }, [markActivity, soundEnabled]);

  const handleDragonPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      markActivity();
      const st = stageFlightRef.current;
      st.isDragging = true;
      st.pointerStartX = e.clientX;
      st.pointerStartY = e.clientY;
      st.dragStartX = st.x;
      st.dragStartY = st.y;
      st.movedDistance = 0;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture errors
      }
    },
    [markActivity]
  );

  const handleDragonPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const st = stageFlightRef.current;
      if (!st.isDragging) return;
      const dx = e.clientX - st.pointerStartX;
      const dy = e.clientY - st.pointerStartY;
      st.movedDistance = Math.hypot(dx, dy);

      const m = getStageMetrics();
      const nextX = Math.max(m.minX, Math.min(m.maxX, st.dragStartX + dx));
      const nextY = Math.max(m.minY, Math.min(m.maxY, st.dragStartY + dy));

      if (Math.abs(dx) > 3) {
        st.facing = dx >= 0 ? 1 : -1;
      }
      st.x = nextX;
      st.y = nextY;

      const mover = dragonMoverRef.current;
      if (mover) {
        mover.style.transform = `translate3d(${st.x.toFixed(1)}px, ${st.y.toFixed(
          1
        )}px, 0) scaleX(${st.facing})`;
      }
    },
    [getStageMetrics]
  );

  const handleDragonPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const st = stageFlightRef.current;
      if (!st.isDragging) return;
      st.isDragging = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      // If movement was under 10px, treat as a tap -> roar + flame burst + open sheet
      if (st.movedDistance < 10) {
        openCompanionSheet();
      }
    },
    [openCompanionSheet]
  );

  // ── Zenryu AI Companion Sheet State & Handlers ────────────────────────────
  const [messages, setMessages] = useState<ZenryuChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'zenryu',
      content: `Greetings. I am **${DRAGON_COMPANION_NAME}**, guardian dragon of the Boardly Cockpit. Tap a quick action below or ask me to break down an entry-test concept.`,
      timestamp: getTimeLabel(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [sendingPrompt, setSendingPrompt] = useState(false);
  const [aiComingSoon, setAiComingSoon] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Sheet swipe-down to close state
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetSwipeRef = useRef({ active: false, startY: 0 });

  useEffect(() => {
    if (!isSheetOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    let pushedState = false;
    try {
      window.history.pushState({ zenryuSheet: true }, '');
      pushedState = true;
    } catch {
      // Ignore
    }

    const onPopState = () => {
      pushedState = false;
      setIsSheetOpen(false);
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      if (pushedState && window.history.state?.zenryuSheet) {
        try {
          window.history.back();
        } catch {
          // Ignore
        }
      }
    };
  }, [isSheetOpen]);

  useEffect(() => {
    if (!isSheetOpen) return;
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, sendingPrompt, isSheetOpen]);

  const sendMessageToZenryu = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || sendingPrompt) return;

      const userMsg: ZenryuChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: getTimeLabel(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputPrompt('');
      setSendingPrompt(true);

      try {
        const res = await fetch('/api/ai-tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            subject: currentMcq?.subject || 'Entry Test',
            examTrack: 'MDCAT / NET / FAST',
            mode: 'Concept Breakdown',
            systemInstruction: `You are ${DRAGON_COMPANION_NAME}, the fierce, ancient, yet encouraging crimson dragon companion of Boardly. Speak with calm authority, sharp precision, and concise academic clarity for Pakistani MDCAT, NUMS, NET, and FAST entry-test students. Never ramble.`,
            history: messages.slice(-6).map((m) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          setAiComingSoon(true);
          return;
        }

        const data = (await res.json()) as {
          reply?: string;
          isFallback?: boolean;
        };

        if (!data?.reply || data.isFallback === true) {
          setAiComingSoon(true);
          return;
        }

        setAiComingSoon(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `zenryu-${Date.now()}`,
            role: 'zenryu',
            content: data.reply || '',
            timestamp: getTimeLabel(),
          },
        ]);
      } catch {
        setAiComingSoon(true);
      } finally {
        setSendingPrompt(false);
      }
    },
    [sendingPrompt, currentMcq, messages]
  );

  const handleQuickChip = useCallback(
    (chipId: (typeof QUICK_CHIPS)[number]['id']) => {
      if (chipId === 'explain-mcq') {
        if (currentMcq) {
          const prompt = `Explain this ${currentMcq.subject} (${currentMcq.topic}) MCQ step by step: "${currentMcq.question}" — Options: A) ${currentMcq.option_a}, B) ${currentMcq.option_b}, C) ${currentMcq.option_c}, D) ${currentMcq.option_d}.`;
          void sendMessageToZenryu(prompt);
        } else {
          void sendMessageToZenryu(
            'Explain how to eliminate wrong options quickly on a tough entry-test MCQ.'
          );
        }
        return;
      }

      if (chipId === 'weak-chapters') {
        if (weakChapters.length > 0) {
          const summary = weakChapters
            .slice(0, 3)
            .map((w) => `${w.subject} — ${w.topic} (${w.accuracy}% accuracy)`)
            .join('; ');
          void sendMessageToZenryu(
            `My current weak chapters in the Cockpit are: ${summary}. Give me a focused recovery strategy for these chapters.`
          );
        } else {
          void sendMessageToZenryu(
            'How should I identify and fix my weak chapters while practicing university MCQs?'
          );
        }
        return;
      }

      if (chipId === 'plan-day') {
        void sendMessageToZenryu(
          `I have solved ${correctCount.toLocaleString()} correct university MCQs so far. Build me a high-focus daily study and MCQ drill plan for today.`
        );
      }
    },
    [currentMcq, weakChapters, correctCount, sendMessageToZenryu]
  );

  // Collapse the stage completely with zero leftover gap when disabled or hidden
  if (!featureEnabled || hideDragon) {
    return null;
  }

  const clampedCorrect = Math.min(DRAGON_UNLOCK_THRESHOLD, Math.max(0, correctCount));
  const progressPct = Math.min(
    100,
    Math.round((clampedCorrect / DRAGON_UNLOCK_THRESHOLD) * 100)
  );

  return (
    <>
      {/* ── DEDICATED GLASS DRAGON STAGE (Between Greeting & Choose Your University) ── */}
      {!isUnlocked ? (
        /* STATE A: Locked (< 1,000 Correct MCQs & Not Admin) -> Dragon Egg Card in Stage Slot */
        <section
          ref={stageRef}
          className="zenryu-stage zenryu-stage--egg p-4 sm:p-5"
          aria-label={`${DRAGON_COMPANION_NAME} Dragon Egg Progress`}
        >
          <div className="zenryu-stage-decor" aria-hidden="true" />
          <div className="relative z-10 flex items-center gap-3.5 sm:gap-5 w-full">
            <div className="zenryu-egg-icon-wrap">
              <img
                src={ZENRYU_ASSETS.egg}
                alt=""
                decoding="async"
                draggable={false}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain select-none zenryu-egg--pulse"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="zenryu-badge">
                    <Flame size={11} className="shrink-0" />
                    <span>Dragon Egg</span>
                  </span>
                  <h2
                    className="text-sm sm:text-base font-bold text-[var(--text)] truncate"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {DRAGON_COMPANION_NAME} Slumbers Within
                  </h2>
                </div>
                <span className="text-xs font-bold text-[var(--accent)] tabular-nums">
                  {progressPct}%
                </span>
              </div>

              <p className="text-xs sm:text-[13px] font-medium text-[var(--text-secondary)] leading-snug">
                {DRAGON_COMPANION_NAME} awakens at {DRAGON_UNLOCK_THRESHOLD.toLocaleString()}{' '}
                correct answers ({clampedCorrect.toLocaleString()} /{' '}
                {DRAGON_UNLOCK_THRESHOLD.toLocaleString()})
              </p>

              {/* Progress Bar with 25% / 50% / 75% Crack Milestones */}
              <div className="relative h-2 w-full rounded-full overflow-hidden bg-[var(--surface-2)] border border-[var(--glass-border)]">
                <div
                  className="zenryu-egg-progress-fill h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--text-muted)] tabular-nums">
                <span className={progressPct >= 25 ? 'text-[var(--accent)]' : ''}>
                  25% First Crack
                </span>
                <span className={progressPct >= 50 ? 'text-[var(--accent)]' : ''}>
                  50% Ember Core
                </span>
                <span className={progressPct >= 75 ? 'text-[var(--accent)]' : ''}>
                  75% Shell Split
                </span>
                <span>1,000 Awakens</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* STATE B: Unlocked Dragon Stage (180–240px Tall Glass Hero Strip, Strict Overflow Clipping) */
        <section
          ref={stageRef}
          onPointerMove={handleStagePointerMove}
          onPointerLeave={handleStagePointerLeave}
          className="zenryu-stage zenryu-stage--active"
          aria-label={`${DRAGON_COMPANION_NAME} Dragon Companion Stage`}
        >
          {/* Stage Atmospheric Gradient & Decorative Ridge Silhouette (pointer-events: none) */}
          <div className="zenryu-stage-decor" aria-hidden="true" />
          <div className="zenryu-stage-horizon" aria-hidden="true" />

          {/* One-Time Awakening Toast Inside Stage Top-Left */}
          {showAwakeningCelebration && (
            <div
              className="zenryu-awakening-pill"
              role="status"
              aria-live="polite"
            >
              <Sparkles size={13} className="text-[var(--accent)] shrink-0" />
              <span>{DRAGON_COMPANION_NAME} has awakened!</span>
              <button
                type="button"
                onClick={() => setShowAwakeningCelebration(false)}
                aria-label="Dismiss awakening notice"
                className="ml-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Fast-Fading Pooled Ember Trail Particles Inside the Stage (pointer-events: none) */}
          {postPaintReady &&
            !isStaticPose &&
            Array.from({ length: 7 }).map((_, idx) => (
              <span
                key={idx}
                ref={(el) => {
                  emberRefs.current[idx] = el;
                }}
                className="zenryu-stage-ember"
                aria-hidden="true"
              />
            ))}

          {/* Reserved Stage Placeholder Glow Before First Paint */}
          {!postPaintReady ? (
            <div className="zenryu-stage-loading-glow" aria-hidden="true" />
          ) : (
            /* Moving Dragon Container Strictly Inside the Stage */
            <div ref={dragonMoverRef} className="zenryu-stage-mover">
              <button
                type="button"
                onPointerDown={handleDragonPointerDown}
                onPointerMove={handleDragonPointerMove}
                onPointerUp={handleDragonPointerUp}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCompanionSheet();
                  }
                }}
                aria-label={`Summon ${DRAGON_COMPANION_NAME}, your Boardly dragon companion`}
                title={`${DRAGON_COMPANION_NAME} — Tap to roar & open companion, drag within stage`}
                className="zenryu-hitbox"
              >
                <div className="zenryu-bob-wrapper">
                  <ZenryuLayeredRig
                    isSleeping={isSleeping}
                    isRoaring={isRoaring}
                    isStaticMode={isStaticPose}
                    headRef={headPivotRef}
                  />
                </div>
              </button>
            </div>
          )}

          {/* Stationary Bottom-Left Glass Label Pill (12px text, never moves with the dragon) */}
          <div className="zenryu-stage-corner-label">
            <span
              className={`zenryu-status-dot ${
                isSleeping ? 'zenryu-status-dot--sleeping' : ''
              }`}
              aria-hidden="true"
            />
            <span className="zenryu-stage-corner-name">{DRAGON_COMPANION_NAME}</span>
            <span className="zenryu-stage-corner-hint">
              {isSleeping ? 'Resting · Tap to wake' : 'Tap to summon'}
            </span>
          </div>
        </section>
      )}

      {/* ── STATE C: Zenryu Glass Bottom Sheet (~85% Height) ─────────────────── */}
      {isSheetOpen && (
        <div
          className="zenryu-sheet-backdrop"
          onClick={() => {
            setSheetDragY(0);
            setIsSheetOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${DRAGON_COMPANION_NAME} AI Companion`}
        >
          <div
            className="zenryu-sheet-panel"
            style={
              sheetDragY > 0
                ? { transform: `translate3d(0, ${sheetDragY}px, 0)` }
                : undefined
            }
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle (Swipe down to close) */}
            <div
              className="zenryu-sheet-handle-bar"
              onTouchStart={(e) => {
                sheetSwipeRef.current.active = true;
                sheetSwipeRef.current.startY = e.touches[0]?.clientY ?? 0;
              }}
              onTouchMove={(e) => {
                if (!sheetSwipeRef.current.active) return;
                const dy = (e.touches[0]?.clientY ?? 0) - sheetSwipeRef.current.startY;
                if (dy > 0) {
                  setSheetDragY(dy);
                }
              }}
              onTouchEnd={() => {
                sheetSwipeRef.current.active = false;
                if (sheetDragY > 90) {
                  setSheetDragY(0);
                  setIsSheetOpen(false);
                } else {
                  setSheetDragY(0);
                }
              }}
            >
              <span className="zenryu-sheet-pill" />
            </div>

            {/* Sheet Header: Zenryu Avatar, Title, Sound Mute Toggle & Close */}
            <div className="zenryu-sheet-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="zenryu-avatar-badge">
                  <ZenryuLayeredRig
                    isSleeping={false}
                    isRoaring={false}
                    isStaticMode
                    compactAvatar
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-base sm:text-lg font-bold text-[var(--text)] truncate"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {DRAGON_COMPANION_NAME}
                    </h2>
                    <span className="zenryu-badge">
                      <Flame size={11} />
                      <span>{aiComingSoon ? 'Coming soon' : 'Awakened'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    Crimson Cockpit Guardian ·{' '}
                    {isAdminBypass
                      ? 'Admin Unlocked'
                      : `${correctCount.toLocaleString()} Correct MCQs`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={soundEnabled ? 'Mute dragon sound' : 'Unmute dragon sound'}
                  title={
                    soundEnabled
                      ? 'Dragon roar sound on (tap to mute)'
                      : 'Dragon roar sound muted (tap to enable)'
                  }
                  className="zenryu-icon-btn"
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSheetDragY(0);
                    setIsSheetOpen(false);
                  }}
                  aria-label={`Close ${DRAGON_COMPANION_NAME} sheet`}
                  className="zenryu-icon-btn"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Quick-Action Chips Row */}
            <div className="zenryu-chips-row">
              {QUICK_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={sendingPrompt}
                    onClick={() => handleQuickChip(chip.id)}
                    className="zenryu-chip-btn"
                  >
                    <Icon size={13} className="text-[var(--accent)] shrink-0" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Thread Area */}
            <div ref={chatScrollRef} className="zenryu-chat-thread">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'zenryu-msg-bubble zenryu-msg-bubble--user'
                        : 'zenryu-msg-bubble zenryu-msg-bubble--dragon'
                    }
                  >
                    <MathText text={m.content} />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] px-1">
                    {m.role === 'user' ? 'You' : DRAGON_COMPANION_NAME} · {m.timestamp}
                  </span>
                </div>
              ))}

              {/* Line Loader Only (No spinners) */}
              {sendingPrompt && (
                <div className="zenryu-msg-bubble zenryu-msg-bubble--dragon space-y-2 max-w-xs">
                  <div className="text-xs font-semibold text-[var(--text-secondary)]">
                    {DRAGON_COMPANION_NAME} is channeling a response...
                  </div>
                  <LineLoader context="general" variant="inline" />
                </div>
              )}

              {/* Honest "Coming soon" notice if live AI endpoint is not configured */}
              {aiComingSoon && (
                <div className="zenryu-coming-soon-box">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text)]">
                      {DRAGON_COMPANION_NAME} Live AI Chat — Coming soon
                    </span>
                    <span className="zenryu-badge">Coming soon</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {DRAGON_COMPANION_NAME} is awake and patrolling your Cockpit stage, while
                    live AI tutoring responses are currently marked as{' '}
                    <strong className="text-[var(--text)]">Coming soon</strong> on this server.
                  </p>
                </div>
              )}
            </div>

            {/* Sticky Bottom Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessageToZenryu(inputPrompt);
              }}
              className="zenryu-sheet-footer"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={sendingPrompt || aiComingSoon}
                placeholder={
                  aiComingSoon
                    ? `${DRAGON_COMPANION_NAME} live chat coming soon...`
                    : `Ask ${DRAGON_COMPANION_NAME} about an MCQ or chapter...`
                }
                className="zenryu-chat-input"
              />
              <button
                type="submit"
                disabled={sendingPrompt || aiComingSoon || !inputPrompt.trim()}
                aria-label={`Send message to ${DRAGON_COMPANION_NAME}`}
                className="zenryu-send-btn"
              >
                <Send size={15} />
                {sendingPrompt && <ButtonLineLoader />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Self-Contained Error Boundary (Fails Silently & Never Breaks Cockpit) ────
interface ErrorBoundaryState {
  hasError: boolean;
}

class DragonErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Fail silently per hard rules so the Cockpit is never disrupted
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const DragonCompanion = memo(function DragonCompanion(
  props: DragonCompanionProps
) {
  return (
    <DragonErrorBoundary>
      <DragonCompanionInner {...props} />
    </DragonErrorBoundary>
  );
});

export default DragonCompanion;

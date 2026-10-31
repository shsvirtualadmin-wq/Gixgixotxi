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
import type {
  ZenryuEngineController,
  ZenryuPose,
  ZenryuCameraPreset,
} from './zenryuEngine3D';

// ── Single Constant for Dragon Name & Unlock Threshold ──────────────────────
export const DRAGON_COMPANION_NAME = 'Zenryu';
export const DRAGON_UNLOCK_THRESHOLD = 1000;

const FEATURE_FLAG_KEY = 'dragon_companion_enabled';
const HIDE_DRAGON_STORAGE_KEY = 'boardly_hide_dragon_companion';
const HIDE_DRAGON_EVENT = 'boardly-dragon-visibility-changed';
const AWAKENED_STORAGE_PREFIX = 'boardly_zenryu_awakened_v1_';
const SOUND_ENABLED_STORAGE_KEY = 'boardly_zenryu_sound_enabled';

export const ZENRYU_EGG_ASSET = '/assets/zenryu/dragon-egg.webp';
export const ZENRYU_STATIC_BODY_ASSET = '/assets/zenryu/zenryu-body.webp';
export const ZENRYU_STATIC_WING_L_ASSET = '/assets/zenryu/wing-l.webp';
export const ZENRYU_STATIC_WING_R_ASSET = '/assets/zenryu/wing-r.webp';
export const ZENRYU_STATIC_TAIL_ASSET = '/assets/zenryu/tail.webp';
export const ZENRYU_STATIC_HEAD_ASSET = '/assets/zenryu/head.webp';
export const ZENRYU_STATIC_EYES_ASSET = '/assets/zenryu/eyes-glow.webp';

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

// ── 12 CSS Ember Particles Configuration Inside Stage ───────────────────────
const STAGE_CSS_EMBERS = [
  { left: '12%', delay: '0s', duration: '3.6s', size: 5 },
  { left: '21%', delay: '0.7s', duration: '4.1s', size: 4 },
  { left: '29%', delay: '1.4s', duration: '3.4s', size: 6 },
  { left: '37%', delay: '0.3s', duration: '3.9s', size: 4 },
  { left: '45%', delay: '1.9s', duration: '4.3s', size: 5 },
  { left: '53%', delay: '0.9s', duration: '3.5s', size: 6 },
  { left: '61%', delay: '2.2s', duration: '4.0s', size: 4 },
  { left: '68%', delay: '0.5s', duration: '3.7s', size: 5 },
  { left: '75%', delay: '1.6s', duration: '4.2s', size: 6 },
  { left: '82%', delay: '1.1s', duration: '3.8s', size: 4 },
  { left: '88%', delay: '2.5s', duration: '3.6s', size: 5 },
  { left: '93%', delay: '0.2s', duration: '4.4s', size: 4 },
] as const;

// ── Static Soft-Glow Fallback Pose (For Reduced Motion, Low-End or WebGL Fallback) ──
const StaticDragonFallback = memo(function StaticDragonFallback({
  onSummon,
  compact = false,
}: {
  onSummon?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onSummon}
      role={onSummon ? 'button' : undefined}
      tabIndex={onSummon ? 0 : undefined}
      onKeyDown={
        onSummon
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSummon();
              }
            }
          : undefined
      }
      aria-label={
        onSummon ? `Summon ${DRAGON_COMPANION_NAME}, your Boardly dragon companion` : undefined
      }
      className={
        compact
          ? 'zenryu-rig zenryu-rig--avatar'
          : 'zenryu-static-fallback-btn'
      }
    >
      <div className={compact ? 'relative w-full h-full' : 'zenryu-rig zenryu-rig--stage'}>
        <img
          src={ZENRYU_STATIC_WING_L_ASSET}
          alt=""
          decoding="async"
          draggable={false}
          className="zenryu-layer"
        />
        <img
          src={ZENRYU_STATIC_TAIL_ASSET}
          alt=""
          decoding="async"
          draggable={false}
          className="zenryu-layer"
        />
        <img
          src={ZENRYU_STATIC_BODY_ASSET}
          alt=""
          decoding="async"
          draggable={false}
          className="zenryu-layer"
        />
        <img
          src={ZENRYU_STATIC_WING_R_ASSET}
          alt=""
          decoding="async"
          draggable={false}
          className="zenryu-layer"
        />
        <img
          src={ZENRYU_STATIC_HEAD_ASSET}
          alt=""
          decoding="async"
          draggable={false}
          className="zenryu-layer"
        />
        <img
          src={ZENRYU_STATIC_EYES_ASSET}
          alt=""
          decoding="async"
          draggable={false}
          className="zenryu-layer"
        />
      </div>
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

// ── Inner Cockpit Component ─────────────────────────────────────────────────
function DragonCompanionInner({
  weakChapters = [],
  currentMcq = null,
  isTestModalOpen = false,
}: DragonCompanionProps) {
  const { user } = useAuth();
  const { smoothMode } = useSmoothMode();
  const { hideDragon } = useDragonHiddenPreference();

  const featureEnabled = useMemo(() => isDragonCompanionEnabled(), []);

  // Wait until after first paint before importing Three.js or building 3D geometry
  const [postPaintReady, setPostPaintReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      const timerId = window.setTimeout(() => {
        if (!cancelled) setPostPaintReady(true);
      }, 65);
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

  const shouldUseStaticPose = prefersReducedMotion || smoothMode || isLowEndDevice;

  // ── 3D Engine Lifecycle, Sleep, Roar, Pointer-Follow & Drag State ─────────
  const [isSleeping, setIsSleeping] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
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
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ZenryuEngineController | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const isSleepingRef = useRef<boolean>(false);

  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  const wakeAndMarkActivity = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (isSleepingRef.current) {
      isSleepingRef.current = false;
      setIsSleeping(false);
      if (engineRef.current && engineRef.current.getPose() === 'sleep') {
        engineRef.current.setPose('fly');
      }
    }
  }, []);

  // Dynamic import of Three.js & zenryuEngine3D ONLY after first paint and ONLY when unlocked
  useEffect(() => {
    if (
      !postPaintReady ||
      !isUnlocked ||
      hideDragon ||
      shouldUseStaticPose ||
      webglFailed
    ) {
      return;
    }

    const mountNode = canvasMountRef.current;
    if (!mountNode) return;

    let cancelled = false;
    let instance: ZenryuEngineController | null = null;

    void import('./zenryuEngine3D')
      .then((mod) => {
        if (cancelled || !canvasMountRef.current) return;
        const probe = mod.detectSoftwareWebGL();
        if (!probe.supported) {
          setWebglFailed(true);
          return;
        }
        instance = mod.createZenryu3DEngine({
          container: canvasMountRef.current,
          initialPose: 'fly',
          initialCamera: 'stage',
        });
        engineRef.current = instance;
        setEngineReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setWebglFailed(true);
        }
      });

    const onResize = () => {
      engineRef.current?.resize();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      if (instance) {
        instance.dispose();
      }
      engineRef.current = null;
      setEngineReady(false);
    };
  }, [postPaintReady, isUnlocked, hideDragon, shouldUseStaticPose, webglFailed]);

  // Pause 3D render loop when tab is hidden, stage is off-screen, or modal/sheet is open
  useEffect(() => {
    const onVisChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

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

  useEffect(() => {
    const shouldPause = isTabHidden || !isStageVisible || isSheetOpen || isTestModalOpen;
    engineRef.current?.setPaused(shouldPause);
  }, [isTabHidden, isStageVisible, isSheetOpen, isTestModalOpen, engineReady]);

  // Idle 20 seconds -> transition to SLEEP pose
  useEffect(() => {
    if (!isUnlocked || hideDragon || shouldUseStaticPose || isSheetOpen) return;
    const interval = window.setInterval(() => {
      if (Date.now() - lastInteractionRef.current >= 20000 && !isSleepingRef.current) {
        isSleepingRef.current = true;
        setIsSleeping(true);
        engineRef.current?.setPose('sleep');
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [isUnlocked, hideDragon, shouldUseStaticPose, isSheetOpen]);

  // ── Canvas Pointer-Follow, Drag (+-60deg Yaw) & Tap (Roar + Open Sheet) ───
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    movedDist: 0,
  });

  const triggerRoarAndOpenSheet = useCallback(() => {
    wakeAndMarkActivity();
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
    if (engineRef.current) {
      engineRef.current.triggerRoar();
      window.setTimeout(() => {
        setIsSheetOpen(true);
      }, 620);
    } else {
      setIsSheetOpen(true);
    }
  }, [wakeAndMarkActivity, soundEnabled]);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      wakeAndMarkActivity();
      const st = dragStateRef.current;
      st.active = true;
      st.startX = e.clientX;
      st.startY = e.clientY;
      st.movedDist = 0;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    },
    [wakeAndMarkActivity]
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      wakeAndMarkActivity();
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        engineRef.current?.setPointerNorm(nx, ny);
      }

      const st = dragStateRef.current;
      if (!st.active) return;
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;
      st.movedDist = Math.hypot(dx, dy);

      // Drag rotates the whole dragon within +-60deg yaw
      const maxYaw = Math.PI / 3;
      const yawRad = Math.max(
        -maxYaw,
        Math.min(maxYaw, (dx / Math.max(180, rect.width * 0.5)) * maxYaw)
      );
      engineRef.current?.setDragYaw(yawRad, true);
    },
    [wakeAndMarkActivity]
  );

  const handleCanvasPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = dragStateRef.current;
      if (!st.active) return;
      st.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      engineRef.current?.setDragYaw(0, false);

      // Tap (< 10px drag distance): roar, vibrate lightly, then open the Zenryu sheet
      if (st.movedDist < 10) {
        triggerRoarAndOpenSheet();
      }
    },
    [triggerRoarAndOpenSheet]
  );

  const handleCanvasPointerLeave = useCallback(() => {
    engineRef.current?.setPointerNorm(null, null);
    if (dragStateRef.current.active) {
      dragStateRef.current.active = false;
      engineRef.current?.setDragYaw(0, false);
    }
  }, []);

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
        /* STATE A: Locked (< 1,000 Correct MCQs & Not Admin) -> Dragon Egg Card (Downloads Zero 3D Code) */
        <section
          ref={stageRef}
          className="zenryu-stage zenryu-stage--egg p-4 sm:p-5"
          aria-label={`${DRAGON_COMPANION_NAME} Dragon Egg Progress`}
        >
          <div className="zenryu-stage-decor" aria-hidden="true" />
          <div className="relative z-10 flex items-center gap-3.5 sm:gap-5 w-full">
            <div className="zenryu-egg-icon-wrap">
              <img
                src={ZENRYU_EGG_ASSET}
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
        /* STATE B: Unlocked 3D Dragon Stage (240–280px Tall Glass Hero Strip) */
        <section
          ref={stageRef}
          className="zenryu-stage zenryu-stage--active"
          aria-label={`${DRAGON_COMPANION_NAME} 3D Dragon Companion Stage`}
        >
          {/* Dark-Red Radial Glow & Stage Vignette (pointer-events: none) */}
          <div className="zenryu-stage-decor" aria-hidden="true" />
          <div className="zenryu-stage-vignette" aria-hidden="true" />

          {/* Up to 12 CSS Ember Particles Inside Stage (pointer-events: none) */}
          {!shouldUseStaticPose &&
            STAGE_CSS_EMBERS.map((emb, idx) => (
              <span
                key={idx}
                className="zenryu-css-ember"
                style={{
                  left: emb.left,
                  width: `${emb.size}px`,
                  height: `${emb.size}px`,
                  animationDelay: emb.delay,
                  animationDuration: emb.duration,
                }}
                aria-hidden="true"
              />
            ))}

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

          {/* Soft Red Glow Placeholder While Building 3D Scene */}
          {!engineReady && !shouldUseStaticPose && !webglFailed && (
            <div className="zenryu-stage-loading-glow" aria-hidden="true" />
          )}

          {/* Static Soft-Glow Pose Fallback (Reduced Motion, Low-End Device, or WebGL Failure) */}
          {shouldUseStaticPose || webglFailed ? (
            <StaticDragonFallback onSummon={triggerRoarAndOpenSheet} />
          ) : (
            /* 3D WebGL Canvas Mount (Pointer-Events Apply ONLY to the Canvas) */
            <div
              ref={canvasMountRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerLeave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerRoarAndOpenSheet();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Summon ${DRAGON_COMPANION_NAME}, your 3D Boardly dragon companion`}
              title={`${DRAGON_COMPANION_NAME} — Tap to roar & summon, drag to rotate`}
              className="zenryu-canvas-mount"
            />
          )}

          {/* Stationary Bottom-Left 12px Glass Pill ("Zenryu · Tap to summon") */}
          <div className="zenryu-stage-corner-label">
            <span
              className={`zenryu-status-dot ${
                isSleeping ? 'zenryu-status-dot--sleeping' : ''
              }`}
              aria-hidden="true"
            />
            <span className="zenryu-stage-corner-name">
              {DRAGON_COMPANION_NAME} · {isSleeping ? 'Resting' : 'Tap to summon'}
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
                  <StaticDragonFallback compact />
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

// ============================================================================
// 8. DEV-ONLY PREVIEW ROUTE (/dev/zenryu — Disabled in Production)
// ============================================================================
export function ZenryuDevPreviewPage() {
  const { user, isAdmin } = useAuth();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stagePhoneMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ZenryuEngineController | null>(null);
  const phoneEngineRef = useRef<ZenryuEngineController | null>(null);

  const [pose, setPoseState] = useState<ZenryuPose>('fly');
  const [camPreset, setCamPresetState] = useState<ZenryuCameraPreset>('three-quarter');
  const [showPhoneStage, setShowPhoneStage] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // Disabled in production builds
  const isDevBuild = Boolean(import.meta.env.DEV);

  useEffect(() => {
    if (!isDevBuild) return;
    const node = mountRef.current;
    if (!node) return;

    let cancelled = false;
    let ctrl: ZenryuEngineController | null = null;

    void import('./zenryuEngine3D').then((mod) => {
      if (cancelled || !mountRef.current) return;
      ctrl = mod.createZenryu3DEngine({
        container: mountRef.current,
        initialPose: 'fly',
        initialCamera: 'three-quarter',
        enableOrbitControls: true,
        opaqueStageBackground: true,
      });
      engineRef.current = ctrl;
    });

    const onResize = () => engineRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      ctrl?.dispose();
      engineRef.current = null;
    };
  }, [isDevBuild]);

  useEffect(() => {
    if (!isDevBuild || !showPhoneStage || !stagePhoneMountRef.current) return;
    let cancelled = false;
    let ctrl: ZenryuEngineController | null = null;

    void import('./zenryuEngine3D').then((mod) => {
      if (cancelled || !stagePhoneMountRef.current) return;
      ctrl = mod.createZenryu3DEngine({
        container: stagePhoneMountRef.current,
        initialPose: pose,
        initialCamera: 'stage',
      });
      phoneEngineRef.current = ctrl;
    });

    return () => {
      cancelled = true;
      ctrl?.dispose();
      phoneEngineRef.current = null;
    };
  }, [isDevBuild, showPhoneStage, pose]);

  if (!isDevBuild) {
    return null;
  }

  // In dev mode, allow admin or local dev inspection
  const allowed = isAdmin || Boolean(user) || isDevBuild;
  if (!allowed) {
    return null;
  }

  const handlePose = (next: ZenryuPose) => {
    setPoseState(next);
    if (next === 'roar') {
      engineRef.current?.triggerRoar();
      phoneEngineRef.current?.triggerRoar();
    } else {
      engineRef.current?.setPose(next);
      phoneEngineRef.current?.setPose(next);
    }
  };

  const handleCamera = (next: ZenryuCameraPreset) => {
    setCamPresetState(next);
    engineRef.current?.setCameraPreset(next);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0608] text-white select-none">
      {/* Top-Left Minimal Spec Badge */}
      <div className="fixed top-4 left-4 z-20 px-3.5 py-2 rounded-2xl bg-black/75 border border-white/15 text-xs flex items-center gap-3">
        <span className="font-bold text-red-500">ZENRYU 3D INSPECTOR</span>
        <span className="text-zinc-400">
          Pose: <strong className="text-white uppercase">{pose}</strong>
        </span>
        <span className="text-zinc-400">
          View: <strong className="text-white uppercase">{camPreset}</strong>
        </span>
      </div>

      {/* Main Full-Viewport 3D OrbitControls Canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Optional 390px Phone Cockpit Stage Overlay for Silhouette Check */}
      {showPhoneStage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-[390px] max-w-[95vw] p-3 rounded-3xl bg-[#110b0e] border border-white/15 shadow-2xl space-y-2.5">
          <div className="text-xs font-bold text-zinc-300 px-1">
            390px Phone Cockpit Stage Preview (256px height)
          </div>
          <div className="zenryu-stage zenryu-stage--active">
            <div className="zenryu-stage-decor" />
            <div className="zenryu-stage-vignette" />
            <div ref={stagePhoneMountRef} className="zenryu-canvas-mount" />
            <div className="zenryu-stage-corner-label">
              <span className="zenryu-status-dot" />
              <span className="zenryu-stage-corner-name">
                {DRAGON_COMPANION_NAME} · Tap to summon
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center transition-transform duration-200"
        style={{
          transform: dockCollapsed
            ? 'translate(-50%, calc(100% - 32px))'
            : 'translate(-50%, 0)',
        }}
      >
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="px-3.5 py-1 rounded-t-xl bg-zinc-900/95 border border-b-0 border-white/15 text-[11px] font-semibold text-zinc-300 cursor-pointer"
        >
          {dockCollapsed ? '▴ Show Controls' : '▾ Hide Controls'}
        </button>
        <div className="px-4 py-3 rounded-2xl bg-zinc-900/95 border border-white/15 shadow-2xl flex items-center gap-3 flex-wrap justify-center max-w-[94vw]">
          {/* Pose Buttons */}
          <div className="flex items-center gap-1.5">
            {(['fly', 'roar', 'sleep'] as const).map((p) => (
              <button
                key={p}
                type="button"
                data-pose={p}
                onClick={() => handlePose(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                  pose === p
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-white/15" />

          {/* Camera Angle Presets */}
          <div className="flex items-center gap-1.5">
            {(
              [
                ['three-quarter', '3/4 View'],
                ['front', 'Front'],
                ['side', 'Side'],
                ['stage', 'Stage Framing'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-camera={id}
                onClick={() => handleCamera(id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  camPreset === id
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-white/15" />

          <button
            type="button"
            data-phone-toggle="true"
            onClick={() => setShowPhoneStage((s) => !s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              showPhoneStage
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            390px Stage Overlay
          </button>
        </div>
      </div>
    </div>
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

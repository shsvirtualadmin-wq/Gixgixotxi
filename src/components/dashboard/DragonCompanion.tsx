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

    // Low draconic resonance + ember breath filter
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

// ── Layered Sleek Crimson & Obsidian Anime Dragon SVG ───────────────────────
interface ZenryuSvgProps {
  isSleeping: boolean;
  isRoaring: boolean;
  isStaticMode: boolean;
  sizeClass?: string;
}

const ZenryuDragonSvg = memo(function ZenryuDragonSvg({
  isSleeping,
  isRoaring,
  isStaticMode,
  sizeClass = 'w-[136px] h-[104px] sm:w-[154px] sm:h-[118px]',
}: ZenryuSvgProps) {
  const stateClass = isRoaring
    ? 'zenryu-svg--roaring'
    : isSleeping
    ? 'zenryu-svg--sleeping'
    : isStaticMode
    ? 'zenryu-svg--static'
    : 'zenryu-svg--flying';

  return (
    <svg
      viewBox="0 0 220 165"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`zenryu-svg select-none pointer-events-none ${sizeClass} ${stateClass}`}
      aria-hidden="true"
    >
      <defs>
        {/* Crimson Core Aura */}
        <radialGradient id="zenryuAuraGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e11d2a" stopOpacity="0.44" />
          <stop offset="55%" stopColor="#991b1b" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#e11d2a" stopOpacity="0" />
        </radialGradient>

        {/* Wing Membrane Crimson-Obsidian Gradient */}
        <linearGradient id="zenryuWingMembrane" x1="25" y1="15" x2="145" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="45%" stopColor="#b91c1c" />
          <stop offset="85%" stopColor="#450a0a" />
          <stop offset="100%" stopColor="#140709" />
        </linearGradient>

        {/* Back Wing Deeper Crimson */}
        <linearGradient id="zenryuBackWingMembrane" x1="20" y1="10" x2="130" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="60%" stopColor="#450a0a" />
          <stop offset="100%" stopColor="#0f070a" />
        </linearGradient>

        {/* Obsidian Armor Scales */}
        <linearGradient id="zenryuObsidianArmor" x1="60" y1="45" x2="175" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="45%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>

        {/* Crimson Chest Belly Scales */}
        <linearGradient id="zenryuCrimsonBelly" x1="95" y1="68" x2="165" y2="118" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="35%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>

        {/* Horn & Spine Metallic Ember */}
        <linearGradient id="zenryuHornGrad" x1="125" y1="32" x2="178" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>

        {/* Roar Flame Burst Gradient */}
        <linearGradient id="zenryuRoarFlameGrad" x1="172" y1="64" x2="218" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f97316" />
          <stop offset="75%" stopColor="#e11d2a" />
          <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Ambient Crimson Fire Aura */}
      <ellipse
        cx="118"
        cy="88"
        rx="74"
        ry="52"
        fill="url(#zenryuAuraGrad)"
        className="zenryu-part-aura"
      />

      {/* 2. Far / Back Articulated Dragon Wing */}
      <g className="zenryu-part-wing-back">
        {/* Wing Membrane */}
        <path
          d="M112 72 C96 42, 66 20, 26 14 C38 34, 42 50, 34 66 C54 56, 70 60, 78 74 C90 68, 102 70, 112 76 Z"
          fill="url(#zenryuBackWingMembrane)"
          stroke="#dc2626"
          strokeWidth="1.2"
          strokeOpacity="0.65"
        />
        {/* Wing Bone Struts */}
        <path
          d="M112 72 C92 44, 64 22, 26 14 M82 40 L34 66 M94 54 L78 74"
          stroke="#18181b"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>

      {/* 3. Long Sinuous Armored Tail + Bladed Crimson Flame Tip */}
      <g className="zenryu-part-tail">
        {/* Tail Dorsal Spines */}
        <path
          d="M84 94 L72 84 L74 96 L58 86 L61 98 L44 90 L48 101 L30 94 L35 104"
          fill="#dc2626"
        />
        {/* Main Whip Tail Body */}
        <path
          d="M94 94 C72 98, 54 114, 34 110 C20 107, 13 94, 18 82 C22 73, 31 72, 26 82 C22 90, 27 99, 39 101 C56 103, 73 86, 92 85 Z"
          fill="url(#zenryuObsidianArmor)"
          stroke="#ef4444"
          strokeWidth="1.1"
          strokeOpacity="0.55"
        />
        {/* Tail Bladed Crimson Spade Tip */}
        <path
          d="M18 82 L6 73 L14 66 L26 60 L23 73 L32 76 L21 84 Z"
          fill="url(#zenryuWingMembrane)"
          stroke="#fca5a5"
          strokeWidth="0.9"
        />
      </g>

      {/* 4. Sleek Armored Dragon Body, Chest Plates & Talons */}
      <g className="zenryu-part-body">
        {/* Dorsal Ridge Spines along Back */}
        <path
          d="M96 82 L89 70 L99 76 L98 63 L109 71 L112 58 L122 68 L128 56 L136 66"
          fill="#e11d2a"
        />

        {/* Core Obsidian Torso */}
        <path
          d="M86 92 C92 74, 114 64, 138 66 C154 67, 165 77, 162 92 C158 106, 138 112, 114 108 C98 105, 84 100, 86 92 Z"
          fill="url(#zenryuObsidianArmor)"
          stroke="#3f3f46"
          strokeWidth="1.2"
        />

        {/* Glowing Crimson Armored Chest & Belly Plates */}
        <path
          d="M102 98 C116 105, 142 104, 156 92 C160 86, 157 78, 149 76 C139 86, 118 92, 102 98 Z"
          fill="url(#zenryuCrimsonBelly)"
        />
        {/* Scale Plate Segment Lines */}
        <path
          d="M114 96 L120 103 M127 94 L133 102 M140 90 L146 98 M150 83 L156 90"
          stroke="#450a0a"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* Hind Leg & Obsidian Talons */}
        <path
          d="M104 102 L96 116 L105 122 L99 127 M105 122 L106 128 M105 122 L111 125"
          stroke="#18181b"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M99 127 L96 130 M106 128 L105 132 M111 125 L114 128"
          stroke="#ef4444"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Foreleg & Razor Talons */}
        <path
          d="M142 98 L148 113 L157 116"
          stroke="#18181b"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M157 116 L163 115 M157 116 L162 120 M157 116 L156 122"
          stroke="#ef4444"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>

      {/* 5. Near / Foreground Swept Anime Dragon Wing */}
      <g className="zenryu-part-wing-front">
        {/* Main Swept Wing Membrane */}
        <path
          d="M124 78 C108 42, 74 16, 18 18 C34 38, 38 58, 26 78 C50 66, 68 70, 74 88 C90 76, 106 78, 116 90 C121 85, 124 81, 124 78 Z"
          fill="url(#zenryuWingMembrane)"
          stroke="#f87171"
          strokeWidth="1.35"
        />
        {/* Inner Wing Energy Veins */}
        <path
          d="M92 42 L26 78 M104 54 L74 88 M114 66 L116 90"
          stroke="#fca5a5"
          strokeWidth="1.1"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
        {/* Obsidian Leading Wing Arm & Claw */}
        <path
          d="M124 78 C106 42, 74 18, 18 18"
          stroke="#09090b"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M124 78 C106 42, 74 18, 18 18"
          stroke="#ef4444"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Wing Apex Talon */}
        <path
          d="M82 28 L76 16 L88 22 Z"
          fill="#fca5a5"
        />
      </g>

      {/* 6. Fierce Draconic Head, Swept Horns, Glowing Eyes & Roar Flame */}
      <g className="zenryu-part-head">
        {/* Armored Neck */}
        <path
          d="M134 68 C142 54, 154 48, 166 50 C166 62, 158 76, 146 82 Z"
          fill="url(#zenryuObsidianArmor)"
        />

        {/* Back Swept Elder Horn */}
        <path
          d="M156 48 C142 34, 124 26, 104 26 C118 33, 134 42, 148 54 Z"
          fill="url(#zenryuHornGrad)"
        />

        {/* Primary Crown Swept Horn */}
        <path
          d="M164 49 C150 31, 132 19, 108 16 C124 26, 140 38, 154 54 Z"
          fill="url(#zenryuHornGrad)"
          stroke="#fca5a5"
          strokeWidth="0.7"
          strokeOpacity="0.6"
        />

        {/* Cheek Fin Spike */}
        <path
          d="M158 63 L143 66 L154 71 Z"
          fill="#dc2626"
        />

        {/* Upper Skull & Snout */}
        <path
          d="M152 50 C166 46, 184 50, 196 58 C192 64, 182 66, 168 65 L154 62 Z"
          fill="url(#zenryuObsidianArmor)"
          stroke="#52525b"
          strokeWidth="1.1"
        />

        {/* Nasal Crest Horn */}
        <path
          d="M184 53 L191 45 L190 55 Z"
          fill="#ef4444"
        />

        {/* Lower Hinged Jaw (opens wider when roaring) */}
        <path
          d={
            isRoaring
              ? 'M156 63 L188 73 L193 68 L170 62 Z'
              : 'M156 62 L190 65 L193 61 L168 60 Z'
          }
          fill="#18181b"
          stroke="#ef4444"
          strokeWidth="0.9"
        />

        {/* Crimson Fang Highlights */}
        <path
          d="M178 62 L180 65 L182 62 M186 62 L188 65 L190 62"
          stroke="#fecaca"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        {/* Glowing Ember-Red Slit Eye (or Closed Sleeping Eyelid) */}
        {isSleeping ? (
          <path
            d="M167 56 Q173 59 178 56"
            stroke="#f87171"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        ) : (
          <g className="zenryu-part-eye">
            {/* Outer Eye Glow */}
            <path
              d="M165 55 L178 53 L174 59 L166 58 Z"
              fill="#ef4444"
              opacity="0.45"
            />
            {/* Fierce Angular Anime Dragon Eye */}
            <path
              d="M167 55.5 L177 54 L174 58 L168 57.5 Z"
              fill="#fef08a"
              stroke="#dc2626"
              strokeWidth="0.8"
            />
            {/* Slit Pupil */}
            <path
              d="M172.5 54.5 L172 58"
              stroke="#7f1d1d"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Roar Flame Burst from Jaws */}
        {isRoaring && (
          <g className="zenryu-part-roar-flame">
            <path
              d="M188 62 C198 52, 210 48, 219 52 C212 58, 214 63, 220 67 C209 69, 200 72, 194 76 C196 69, 192 66, 188 62 Z"
              fill="url(#zenryuRoarFlameGrad)"
            />
            <circle cx="206" cy="58" r="2.2" fill="#fef08a" />
            <circle cx="213" cy="65" r="1.6" fill="#f97316" />
          </g>
        )}
      </g>
    </svg>
  );
});

// ── Cracked Crimson Dragon Egg SVG (For Locked State < 1,000 Correct) ───────
interface ZenryuEggSvgProps {
  progressPct: number;
  isHatching?: boolean;
}

const ZenryuEggSvg = memo(function ZenryuEggSvg({
  progressPct,
  isHatching = false,
}: ZenryuEggSvgProps) {
  const crackStage = isHatching
    ? 4
    : progressPct >= 75
    ? 3
    : progressPct >= 50
    ? 2
    : progressPct >= 25
    ? 1
    : 0;

  return (
    <svg
      viewBox="0 0 88 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-14 h-16 sm:w-16 sm:h-[74px] shrink-0 select-none ${
        isHatching ? 'zenryu-egg--hatching' : 'zenryu-egg--pulse'
      }`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="zenryuEggGlow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#e11d2a" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#991b1b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#e11d2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="zenryuEggShell" x1="20" y1="12" x2="68" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3f3f46" />
          <stop offset="35%" stopColor="#18181b" />
          <stop offset="75%" stopColor="#450a0a" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="zenryuEggCoreFire" x1="44" y1="20" x2="44" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#e11d2a" />
        </linearGradient>
      </defs>

      {/* Ambient Ember Halo */}
      <ellipse cx="44" cy="56" rx="38" ry="42" fill="url(#zenryuEggGlow)" />

      {/* Egg Silhouette */}
      <path
        d="M44 12 C25 12, 14 38, 14 61 C14 81, 27 92, 44 92 C61 92, 74 81, 74 61 C74 38, 63 12, 44 12 Z"
        fill="url(#zenryuEggShell)"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeOpacity="0.65"
      />

      {/* Dragon Scale Etchings on Egg */}
      <path
        d="M32 34 Q44 42 56 34 M24 52 Q36 60 44 52 Q52 60 64 52 M26 70 Q44 79 62 70"
        stroke="#dc2626"
        strokeWidth="1.1"
        strokeOpacity="0.42"
        strokeLinecap="round"
      />

      {/* Stage 1 Crack (25%+) */}
      {crackStage >= 1 && (
        <path
          d="M44 22 L39 33 L46 40 L41 48"
          stroke="url(#zenryuEggCoreFire)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Stage 2 Crack (50%+) */}
      {crackStage >= 2 && (
        <path
          d="M46 40 L55 46 L50 57 L58 64 M39 33 L29 39"
          stroke="url(#zenryuEggCoreFire)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Stage 3 Crack (75%+ & 100%) */}
      {crackStage >= 3 && (
        <>
          <path
            d="M41 48 L31 56 L36 68 L27 75 M50 57 L43 72 L49 82"
            stroke="url(#zenryuEggCoreFire)"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="43" cy="46" r="3" fill="#fef08a" opacity="0.85" />
          <circle cx="51" cy="58" r="2.2" fill="#f97316" opacity="0.85" />
        </>
      )}
    </svg>
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

  // Lazy activation after first paint so Cockpit load speed is untouched
  const [postPaintReady, setPostPaintReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      const timerId = window.setTimeout(() => {
        if (!cancelled) setPostPaintReady(true);
      }, 90);
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

  // ── Flight, Sleep, Roar, Drag & Visibility State ──────────────────────────
  const [isSleeping, setIsSleeping] = useState(false);
  const [isRoaring, setIsRoaring] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [isAnchorVisible, setIsAnchorVisible] = useState(true);
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

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const dragonMoverRef = useRef<HTMLDivElement | null>(null);
  const emberRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lastInteractionRef = useRef<number>(Date.now());
  const isSleepingRef = useRef<boolean>(false);

  // Sync ref for rAF loop
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

  // Pause when Cockpit top anchor is scrolled out of view
  useEffect(() => {
    const el = anchorRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsAnchorVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [postPaintReady]);

  // Idle timer -> Perch & Sleep after 20 seconds without interaction
  useEffect(() => {
    if (!isUnlocked || hideDragon || isStaticPose || isSheetOpen) return;
    const onUserEvent = () => {
      lastInteractionRef.current = Date.now();
    };
    window.addEventListener('pointerdown', onUserEvent, { passive: true });
    window.addEventListener('keydown', onUserEvent, { passive: true });

    const interval = window.setInterval(() => {
      if (Date.now() - lastInteractionRef.current >= 20000 && !isSleepingRef.current) {
        isSleepingRef.current = true;
        setIsSleeping(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('pointerdown', onUserEvent);
      window.removeEventListener('keydown', onUserEvent);
      window.clearInterval(interval);
    };
  }, [isUnlocked, hideDragon, isStaticPose, isSheetOpen]);

  // ── Smooth 60fps GPU Flight & Drag Physics Loop ───────────────────────────
  const flightStateRef = useRef({
    phase: 0,
    x: 0,
    y: 0,
    vx: 0,
    facing: 1, // 1 = right, -1 = left
    bankDeg: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    pointerStartX: 0,
    pointerStartY: 0,
    movedDistance: 0,
    initialized: false,
    emberTick: 0,
    embers: Array.from({ length: 5 }, () => ({
      x: 0,
      y: 0,
      life: 0,
      scale: 1,
    })),
  });

  const getSafePerchPosition = useCallback(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const dragonW = vw < 640 ? 136 : 154;
    const x = Math.max(12, vw - dragonW - 18);
    const y = vw < 640 ? 66 : 74;
    return { x, y };
  }, []);

  useEffect(() => {
    if (
      !postPaintReady ||
      !isUnlocked ||
      hideDragon ||
      isTabHidden ||
      !isAnchorVisible ||
      isSheetOpen ||
      isTestModalOpen
    ) {
      return;
    }

    const mover = dragonMoverRef.current;
    if (!mover) return;

    const st = flightStateRef.current;
    if (!st.initialized) {
      const perch = getSafePerchPosition();
      st.x = perch.x;
      st.y = perch.y;
      st.initialized = true;
    }

    // Static perched mode for prefers-reduced-motion / Smooth Mode / low-end devices
    if (isStaticPose) {
      const perch = getSafePerchPosition();
      st.x = perch.x;
      st.y = perch.y;
      mover.style.transform = `translate3d(${Math.round(st.x)}px, ${Math.round(
        st.y
      )}px, 0) scaleX(-1)`;
      return;
    }

    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const vw = window.innerWidth;
      const dragonW = vw < 640 ? 136 : 154;
      const minX = 12;
      const maxX = Math.max(24, vw - dragonW - 14);
      const centerX = (minX + maxX) * 0.5;
      const radiusX = Math.max(28, (maxX - minX) * 0.44);
      const baseTopY = vw < 640 ? 72 : 82;
      const radiusY = vw < 640 ? 18 : 24;

      if (!st.isDragging) {
        if (isSleepingRef.current) {
          // Glide gently to top-right perch and rest
          const perch = getSafePerchPosition();
          const dx = perch.x - st.x;
          const dy = perch.y - st.y;
          st.x += dx * Math.min(1, dt * 3.2);
          st.y += dy * Math.min(1, dt * 3.2);
          st.bankDeg += (0 - st.bankDeg) * Math.min(1, dt * 6);
          st.facing = -1;
        } else {
          // Smooth Lissajous / Figure-8 aerial patrol across the upper Cockpit sky
          st.phase += dt * 0.62;
          const targetX = centerX + Math.sin(st.phase) * radiusX;
          const targetY = baseTopY + Math.sin(st.phase * 2) * radiusY;

          const prevX = st.x;
          st.x += (targetX - st.x) * Math.min(1, dt * 3.8);
          st.y += (targetY - st.y) * Math.min(1, dt * 3.8);

          const velX = (st.x - prevX) / dt;
          if (Math.abs(velX) > 4) {
            st.facing = velX >= 0 ? 1 : -1;
          }
          const desiredBank = Math.max(-11, Math.min(11, velX * 0.065));
          st.bankDeg += (desiredBank - st.bankDeg) * Math.min(1, dt * 6);
        }
      }

      if (mover) {
        mover.style.transform = `translate3d(${st.x.toFixed(1)}px, ${st.y.toFixed(
          1
        )}px, 0) rotate(${st.bankDeg.toFixed(1)}deg) scaleX(${st.facing})`;
      }

      // Fast-fading ember trail particles (pooled, GPU transform/opacity only)
      st.emberTick += dt;
      if (!isSleepingRef.current && st.emberTick >= 0.09) {
        st.emberTick = 0;
        const slot = st.embers.find((e) => e.life <= 0.05) || st.embers[0];
        if (slot) {
          slot.x = st.x + dragonW * 0.45 + (Math.random() - 0.5) * 16;
          slot.y = st.y + 48 + (Math.random() - 0.5) * 12;
          slot.life = 1;
          slot.scale = 0.7 + Math.random() * 0.6;
        }
      }

      for (let i = 0; i < st.embers.length; i++) {
        const emp = st.embers[i];
        const el = emberRefs.current[i];
        if (!el) continue;
        if (emp.life > 0) {
          emp.life = Math.max(0, emp.life - dt * 1.9);
          emp.y -= dt * 18;
          el.style.opacity = (emp.life * 0.75).toFixed(2);
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
    isAnchorVisible,
    isSheetOpen,
    isTestModalOpen,
    isStaticPose,
    getSafePerchPosition,
  ]);

  // ── Touch / Drag & Tap Handlers on Zenryu ─────────────────────────────────
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
    }, 340);
  }, [markActivity, soundEnabled]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      markActivity();
      const st = flightStateRef.current;
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

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const st = flightStateRef.current;
    if (!st.isDragging) return;
    const dx = e.clientX - st.pointerStartX;
    const dy = e.clientY - st.pointerStartY;
    st.movedDistance = Math.hypot(dx, dy);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dragonW = vw < 640 ? 136 : 154;
    const nextX = Math.max(6, Math.min(vw - dragonW - 6, st.dragStartX + dx));
    // Never let the dragon be dragged over the bottom navigation bar
    const nextY = Math.max(52, Math.min(vh - 180, st.dragStartY + dy));

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
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const st = flightStateRef.current;
      if (!st.isDragging) return;
      st.isDragging = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      // If movement was under 10px, treat as a tap -> roar & open Zenryu sheet
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

  // History / Android back button & Escape key support when sheet is open
  useEffect(() => {
    if (!isSheetOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Push a lightweight history entry so Android back button closes the sheet cleanly
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

  // Auto-scroll chat thread on new messages
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

        // Per hard rules: if no live AI backend is configured or it returns a canned fallback,
        // mark chat as "Coming soon" without faking AI responses.
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

  // If feature flag is off or user turned on "Hide dragon" in Settings, render nothing
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
      {/* Invisible Cockpit Anchor to detect when user is on the Cockpit viewport */}
      <div ref={anchorRef} className="w-full h-0 pointer-events-none" aria-hidden="true" />

      {/* ── STATE A: Locked (< 1,000 Correct MCQs & Not Admin/Superadmin) -> Glass Dragon Egg Card ── */}
      {!isUnlocked && (
        <section
          className="zenryu-egg-card p-4 sm:p-5"
          aria-label={`${DRAGON_COMPANION_NAME} Dragon Egg Progress`}
        >
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="zenryu-egg-icon-wrap">
              <ZenryuEggSvg progressPct={progressPct} />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="zenryu-badge">
                    <Flame size={11} className="shrink-0" />
                    <span>Dragon Egg</span>
                  </span>
                  <h3
                    className="text-sm sm:text-base font-bold text-[var(--text)] truncate"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {DRAGON_COMPANION_NAME} Slumbers Within
                  </h3>
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
      )}

      {/* ── STATE B: One-Time Awakening Celebration Banner (At 1,000 Correct) ── */}
      {isUnlocked && showAwakeningCelebration && (
        <section
          className="zenryu-awakening-banner p-4 sm:p-5"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <ZenryuEggSvg progressPct={100} isHatching />
              <div className="min-w-0 space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  <Sparkles size={12} />
                  <span>1,000 Correct Answers Milestone</span>
                </div>
                <h3
                  className="text-base sm:text-lg font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {DRAGON_COMPANION_NAME} has awakened!
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Your crimson dragon companion now patrols the Cockpit. Tap{' '}
                  {DRAGON_COMPANION_NAME} anytime to summon your companion.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAwakeningCelebration(false)}
              aria-label="Dismiss awakening banner"
              className="w-8 h-8 rounded-full cockpit-subrow flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        </section>
      )}

      {/* ── STATE C: Unlocked Flying / Perched Dragon Overlay (Pointer-Events None Layer) ── */}
      {postPaintReady && isUnlocked && !isTestModalOpen && (
        <div
          className="zenryu-flight-stage"
          aria-hidden={isSheetOpen ? 'true' : undefined}
        >
          {/* Fast-fading pooled ember particles (pointer-events: none) */}
          {!isStaticPose &&
            Array.from({ length: 5 }).map((_, idx) => (
              <span
                key={idx}
                ref={(el) => {
                  emberRefs.current[idx] = el;
                }}
                className="zenryu-ember-particle"
              />
            ))}

          {/* Moving Dragon Bounding Box (pointer-events: auto ONLY on the dragon itself) */}
          <div
            ref={dragonMoverRef}
            className="zenryu-mover"
          >
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openCompanionSheet();
                }
              }}
              aria-label={`Summon ${DRAGON_COMPANION_NAME}, your Boardly dragon companion`}
              title={`${DRAGON_COMPANION_NAME} — Tap to open companion, drag to move`}
              className="zenryu-hitbox group"
            >
              <div className="zenryu-bob-wrapper">
                <ZenryuDragonSvg
                  isSleeping={isSleeping}
                  isRoaring={isRoaring}
                  isStaticMode={isStaticPose}
                />
                {/* Subtle Glass Name Tag Pill on Hover / Perch */}
                <span className="zenryu-name-pill">
                  <span className="zenryu-status-dot" />
                  <span>{DRAGON_COMPANION_NAME}</span>
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── STATE D: Zenryu Glass Bottom Sheet (~85% Height) ─────────────────── */}
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
                  <ZenryuDragonSvg
                    isSleeping={false}
                    isRoaring={false}
                    isStaticMode
                    sizeClass="w-14 h-11"
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
                    {DRAGON_COMPANION_NAME} is awake and patrolling your Cockpit, while live
                    AI tutoring responses are currently marked as{' '}
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

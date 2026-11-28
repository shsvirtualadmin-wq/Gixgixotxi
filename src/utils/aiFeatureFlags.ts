/**
 * Feature flags for Boardly AI Mentors upgrades.
 *
 * Every new capability in this release is gated behind a clean, instantly toggleable flag:
 * - `aishaVisualPhysics`: Aisha's animated SVG physics whiteboard mode (also controlled live by the Admin "Aisha animations" switch).
 * - `voiceInputV2`: Enhanced voice capture (direct getUserMedia, granular error handling, in-app browser check, MediaRecorder fallback).
 *
 * Overrides (highest priority first):
 * 1. URL query param (?aishaVisual=0|1, ?voiceV2=0|1)
 * 2. localStorage ('boardly_flag_aisha_visual', 'boardly_flag_voice_v2')
 * 3. Vite env var (VITE_AISHA_VISUAL_PHYSICS, VITE_VOICE_INPUT_V2)
 * 4. Default: ON (true)
 */

const AISHA_VISUAL_STORAGE_KEY = 'boardly_flag_aisha_visual';
const VOICE_V2_STORAGE_KEY = 'boardly_flag_voice_v2';
const AI_CALLS_STORAGE_KEY = 'boardly_flag_ai_calls';

function parseBoolFlag(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === '0' || s === 'false' || s === 'off' || s === 'no') return false;
  if (s === '1' || s === 'true' || s === 'on' || s === 'yes') return true;
  return null;
}

function readFlag(queryKey: string, storageKey: string, envKey: string, defaultVal = true): boolean {
  if (typeof window !== 'undefined') {
    try {
      const q = parseBoolFlag(new URLSearchParams(window.location.search).get(queryKey));
      if (q !== null) return q;
    } catch {
      // ignore
    }
    try {
      const ls = parseBoolFlag(window.localStorage.getItem(storageKey));
      if (ls !== null) return ls;
    } catch {
      // ignore
    }
  }
  const envVal = parseBoolFlag((import.meta as any)?.env?.[envKey]);
  if (envVal !== null) return envVal;
  return defaultVal;
}

export function isAishaVisualPhysicsFlagEnabled(adminAnimationsEnabled?: boolean): boolean {
  if (adminAnimationsEnabled === false) return false;
  return readFlag('aishaVisual', AISHA_VISUAL_STORAGE_KEY, 'VITE_AISHA_VISUAL_PHYSICS', true);
}

export function isVoiceInputV2FlagEnabled(): boolean {
  return readFlag('voiceV2', VOICE_V2_STORAGE_KEY, 'VITE_VOICE_INPUT_V2', true);
}

export function isAiCallsFlagEnabled(adminCallsEnabled?: boolean): boolean {
  if (adminCallsEnabled === false) return false;
  return readFlag('aiCalls', AI_CALLS_STORAGE_KEY, 'VITE_AI_CALLS_ENABLED', true);
}

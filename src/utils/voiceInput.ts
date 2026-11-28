/**
 * Boardly AI Voice Input utilities (shared across all 6 AI mentors).
 */

export type VoiceLangCode = 'en-US' | 'ur-PK';

export const VOICE_ERROR_MESSAGES = {
  notAllowed: 'Microphone is blocked, tap the lock icon and allow Microphone',
  network: 'No connection to the speech service',
  audioCapture: 'Microphone busy or missing',
  noSpeech: 'Nothing heard, try again',
  inAppBrowser: 'Open in Chrome to use voice',
  unsupported: 'Voice works in Chrome',
  insecureContext: 'Voice input requires a secure HTTPS connection.',
  generic: 'Voice input could not start right now. Please try again.',
} as const;

export function isInAppBrowser(userAgent?: string): boolean {
  const ua =
    typeof userAgent === 'string'
      ? userAgent
      : typeof navigator !== 'undefined'
      ? navigator.userAgent || ''
      : '';
  if (!ua) return false;
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok|BytedanceWebview|Musical_ly|MicroMessenger|Twitter|LinkedInApp|; wv\)/i.test(
    ua
  );
}

export function isSecureVoiceContext(): boolean {
  if (typeof window === 'undefined') return true;
  if (typeof window.isSecureContext === 'boolean') return window.isSecureContext;
  const host = window.location?.hostname || '';
  return (
    window.location?.protocol === 'https:' ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
}

export function resolveVoiceLanguage(opts?: {
  preferredLang?: VoiceLangCode | string | null;
  draftText?: string;
  navigatorLanguage?: string;
}): VoiceLangCode {
  const pref = String(opts?.preferredLang || '').trim().toLowerCase();
  if (pref === 'ur' || pref === 'ur-pk' || pref === 'urdu') return 'ur-PK';
  if (pref === 'en' || pref === 'en-us' || pref === 'en-pk' || pref === 'english') return 'en-US';
  if (opts?.draftText && /[\u0600-\u06FF]/.test(opts.draftText)) return 'ur-PK';
  const navLang = (
    opts?.navigatorLanguage ||
    (typeof navigator !== 'undefined' ? navigator.language : '')
  ).toLowerCase();
  if (navLang.startsWith('ur')) return 'ur-PK';
  return 'en-US';
}

export function stopMediaStreamTracks(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export function mapMicrophoneError(
  err: unknown,
  opts?: { userAgent?: string; logToConsole?: boolean }
): { code: string; message: string; isInApp: boolean } {
  const inApp = isInAppBrowser(opts?.userAgent);
  const rawName =
    typeof err === 'string'
      ? err
      : String((err as any)?.error || (err as any)?.name || '').trim();
  const rawMessage = String((err as any)?.message || '').toLowerCase();

  if (opts?.logToConsole !== false) {
    console.error('[Boardly Voice Input] mic error:', rawName || err);
  }

  if (
    rawName === 'not-allowed' ||
    rawName === 'service-not-allowed' ||
    rawName === 'NotAllowedError' ||
    rawName === 'PermissionDeniedError' ||
    rawName === 'SecurityError'
  ) {
    return inApp
      ? { code: 'IN_APP_BLOCKED', message: VOICE_ERROR_MESSAGES.inAppBrowser, isInApp: true }
      : { code: 'not-allowed', message: VOICE_ERROR_MESSAGES.notAllowed, isInApp: false };
  }

  if (rawName === 'network') {
    return { code: 'network', message: VOICE_ERROR_MESSAGES.network, isInApp: inApp };
  }

  if (
    rawName === 'audio-capture' ||
    rawName === 'NotFoundError' ||
    rawName === 'DevicesNotFoundError' ||
    rawName === 'NotReadableError' ||
    rawName === 'TrackStartError' ||
    rawMessage.includes('requested device not found') ||
    rawMessage.includes('could not start audio source') ||
    rawMessage.includes('device in use')
  ) {
    return { code: 'audio-capture', message: VOICE_ERROR_MESSAGES.audioCapture, isInApp: inApp };
  }

  if (rawName === 'no-speech') {
    return { code: 'no-speech', message: VOICE_ERROR_MESSAGES.noSpeech, isInApp: inApp };
  }

  if (rawName === 'language-not-supported') {
    return { code: 'language-not-supported', message: '', isInApp: inApp };
  }

  if (inApp) {
    return { code: 'IN_APP_BLOCKED', message: VOICE_ERROR_MESSAGES.inAppBrowser, isInApp: true };
  }

  return { code: rawName || 'UNKNOWN', message: VOICE_ERROR_MESSAGES.generic, isInApp: false };
}

export function getVoiceCapabilities(): {
  hasSpeechRecognition: boolean;
  hasMediaRecorder: boolean;
  hasGetUserMedia: boolean;
  isSecure: boolean;
  isInApp: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      hasSpeechRecognition: false,
      hasMediaRecorder: false,
      hasGetUserMedia: false,
      isSecure: true,
      isInApp: false,
    };
  }
  const hasSpeechRecognition = Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
  const hasMediaRecorder = typeof (window as any).MediaRecorder !== 'undefined';
  const hasGetUserMedia = Boolean(navigator?.mediaDevices?.getUserMedia);
  return {
    hasSpeechRecognition,
    hasMediaRecorder,
    hasGetUserMedia,
    isSecure: isSecureVoiceContext(),
    isInApp: isInAppBrowser(),
  };
}

// ─── Pluggable Mentor TTS & Gendered Voice Selection ──────────────────────────

export type MentorVoiceGender = 'female' | 'male';

export interface SpeechVoiceLike {
  name: string;
  lang: string;
  voiceURI?: string;
  default?: boolean;
}

export interface VoiceSelectionResult<T extends SpeechVoiceLike = SpeechSynthesisVoice> {
  voice: T | null;
  matchedGender: boolean;
  pitch: number;
  rate: number;
}

export interface SpeakMentorOptions {
  text: string;
  mentorSlug: string;
  gender: MentorVoiceGender;
  lang?: VoiceLangCode;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

/** Single swap-point for plugging in a cloud TTS provider later (e.g. fixed female voice for Aisha). */
export interface MentorTtsProvider {
  speak: (opts: SpeakMentorOptions) => void | Promise<void>;
  stop: () => void;
}

const VOICE_PREF_PREFIX = 'boardly_ai_voice_v1:';
const FEMALE_VOICE_HINTS = [
  'zira',
  'uzma',
  'samantha',
  'google uk english female',
  'google hindi',
  'heera',
  'neerja',
  'female',
  'woman',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'veena',
  'aria',
  'jenny',
  'sonia',
  'libby',
  'ava',
  'allison',
  'susan',
  'catherine',
  'kathy',
  'hazel',
  'kalpana',
  'swara',
];
const MALE_VOICE_HINTS = [
  'david',
  'mark',
  'daniel',
  'alex',
  'rishi',
  'prabhat',
  'google uk english male',
  'george',
  'james',
  'ryan',
  'guy',
  'fred',
  'arthur',
  'male',
  'man',
];

function isFemaleVoiceName(name: string): boolean {
  const lower = String(name || '').toLowerCase();
  return FEMALE_VOICE_HINTS.some((hint) => lower.includes(hint));
}

function isMaleVoiceName(name: string): boolean {
  const lower = String(name || '').toLowerCase();
  if (isFemaleVoiceName(lower)) return false;
  return MALE_VOICE_HINTS.some((hint) => {
    if (hint === 'male' || hint === 'man') {
      return new RegExp(`\\b${hint}\\b`).test(lower);
    }
    return lower.includes(hint);
  });
}

function voiceMatchesLang(voiceLang: string, target: VoiceLangCode): number {
  const vl = String(voiceLang || '').toLowerCase().replace('_', '-');
  if (target === 'ur-PK') {
    if (vl === 'ur-pk') return 3;
    if (vl.startsWith('ur')) return 2;
    if (vl === 'hi-in' || vl.startsWith('hi')) return 1;
    return 0;
  }
  if (vl === 'en-us') return 3;
  if (vl.startsWith('en-gb') || vl.startsWith('en-in') || vl.startsWith('en-au')) return 2;
  if (vl.startsWith('en')) return 1;
  return 0;
}

export function getSavedVoiceForMentor(mentorSlug: string): string {
  if (typeof window === 'undefined' || !mentorSlug) return '';
  try {
    return window.localStorage.getItem(`${VOICE_PREF_PREFIX}${mentorSlug}`) || '';
  } catch {
    return '';
  }
}

export function setSavedVoiceForMentor(mentorSlug: string, voiceKey: string): void {
  if (typeof window === 'undefined' || !mentorSlug) return;
  try {
    const key = `${VOICE_PREF_PREFIX}${mentorSlug}`;
    const clean = String(voiceKey || '').trim();
    if (!clean) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, clean);
  } catch {
    // ignore quota errors
  }
}

export function selectVoiceForMentor<T extends SpeechVoiceLike>(params: {
  voices: T[];
  gender: MentorVoiceGender;
  lang?: VoiceLangCode;
  preferredVoiceKey?: string;
}): VoiceSelectionResult<T> {
  const list = Array.isArray(params.voices) ? params.voices : [];
  const targetLang: VoiceLangCode = params.lang || 'en-US';
  const pref = String(params.preferredVoiceKey || '').trim();

  if (pref && list.length > 0) {
    const exact = list.find((v) => v.voiceURI === pref || v.name === pref);
    if (exact) {
      return { voice: exact, matchedGender: true, pitch: 1.0, rate: 1.0 };
    }
  }

  if (list.length === 0) {
    return {
      voice: null,
      matchedGender: false,
      pitch: params.gender === 'female' ? 1.15 : 1.0,
      rate: 1.0,
    };
  }

  const matchesGender = (v: T) =>
    params.gender === 'female' ? isFemaleVoiceName(v.name) : isMaleVoiceName(v.name);

  // Rank: language match first, then gender name match, then default voice
  const langMatched = list
    .map((v) => ({ v, langScore: voiceMatchesLang(v.lang, targetLang) }))
    .filter((item) => item.langScore > 0)
    .sort((a, b) => b.langScore - a.langScore);

  const pool = langMatched.length > 0 ? langMatched : list.map((v) => ({ v, langScore: 0 }));

  const genderInPool = pool.find((item) => matchesGender(item.v));
  if (genderInPool) {
    return { voice: genderInPool.v, matchedGender: true, pitch: 1.0, rate: 1.0 };
  }

  // Fallback across all voices if gender voice exists in another English/Hindi locale
  const genderAny = list.find((v) => matchesGender(v));
  if (genderAny && (targetLang === 'en-US' ? voiceMatchesLang(genderAny.lang, 'en-US') > 0 : true)) {
    return { voice: genderAny, matchedGender: true, pitch: 1.0, rate: 1.0 };
  }

  // Best available voice; raise pitch slightly (~1.15) for female mentors when no female voice exists
  const best = pool[0]?.v || list.find((v) => v.default) || list[0] || null;
  return {
    voice: best,
    matchedGender: false,
    pitch: params.gender === 'female' ? 1.15 : 1.0,
    rate: 1.0,
  };
}

let voicesLoadedPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function loadDeviceVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }
  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);
  if (voicesLoadedPromise) return voicesLoadedPromise;

  voicesLoadedPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      voicesLoadedPromise = null;
      try {
        window.speechSynthesis.removeEventListener('voiceschanged', onChanged);
      } catch {
        // ignore
      }
      resolve(window.speechSynthesis.getVoices());
    };
    const onChanged = () => {
      if (window.speechSynthesis.getVoices().length > 0) finish();
    };
    try {
      window.speechSynthesis.addEventListener('voiceschanged', onChanged);
    } catch {
      // older Safari fallback
      window.speechSynthesis.onvoiceschanged = onChanged;
    }
    window.setTimeout(finish, timeoutMs);
  });
  return voicesLoadedPromise;
}

export const browserSpeechTtsProvider: MentorTtsProvider = {
  async speak(opts: SpeakMentorOptions) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      opts.onError?.(new Error('speechSynthesis unavailable'));
      return;
    }
    const cleanText = String(opts.text || '').trim();
    if (!cleanText) {
      opts.onEnd?.();
      return;
    }
    try {
      const lang = opts.lang || (/[\u0600-\u06FF]/.test(cleanText) ? 'ur-PK' : 'en-US');
      const voices = await loadDeviceVoices();
      const savedKey = getSavedVoiceForMentor(opts.mentorSlug);
      const picked = selectVoiceForMentor({
        voices,
        gender: opts.gender,
        lang,
        preferredVoiceKey: savedKey,
      });

      // Remember chosen voice per AI once matched
      if (!savedKey && picked.voice && picked.matchedGender) {
        setSavedVoiceForMentor(opts.mentorSlug, picked.voice.voiceURI || picked.voice.name);
      }

      const utter = new SpeechSynthesisUtterance(cleanText);
      if (picked.voice) utter.voice = picked.voice;
      utter.lang = picked.voice?.lang || lang;
      utter.pitch = picked.pitch;
      utter.rate = typeof opts.rate === 'number' && opts.rate > 0 ? opts.rate : picked.rate;
      utter.onstart = () => opts.onStart?.();
      utter.onend = () => opts.onEnd?.();
      utter.onerror = (ev) => {
        if ((ev as any)?.error !== 'interrupted' && (ev as any)?.error !== 'canceled') {
          console.warn('[Boardly TTS] SpeechSynthesis error:', (ev as any)?.error || ev);
        }
        opts.onError?.(ev);
      };
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn('[Boardly TTS] Failed to speak:', err);
      opts.onError?.(err);
    }
  },
  stop() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  },
};

let activeTtsProvider: MentorTtsProvider = browserSpeechTtsProvider;

export function setActiveTtsProvider(provider: MentorTtsProvider): void {
  activeTtsProvider = provider;
}

export function stopMentorSpeech(): void {
  activeTtsProvider.stop();
}

export function speakWithMentorVoice(opts: SpeakMentorOptions, cancelPrevious = true): void {
  if (cancelPrevious) activeTtsProvider.stop();
  void activeTtsProvider.speak(opts);
}

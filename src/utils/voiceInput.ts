/**
 * Boardly AI Voice Input utilities (shared across all 6 AI mentors).
 *
 * Handles:
 * - Granular microphone error mapping (NotAllowedError, NotFoundError, NotReadableError, etc.)
 * - In-app browser detection (Instagram, Facebook, TikTok, Snapchat, Line, Android WebView)
 * - HTTPS / secure context validation
 * - Student language selection (English en-PK / Urdu ur-PK + Roman Urdu support)
 * - MediaStream track cleanup
 */

export type VoiceLangCode = 'en-PK' | 'ur-PK';

export const VOICE_ERROR_MESSAGES = {
  notAllowed:
    'Microphone is blocked. Tap the lock icon in the address bar, allow Microphone, then try again.',
  notFound: 'No microphone found.',
  notReadable: 'Another app is using the microphone.',
  inAppBrowser: 'Open in Chrome to use voice',
  insecureContext: 'Voice input requires a secure HTTPS connection.',
  unsupported: 'Voice input is not supported in this browser.',
  noSpeech: 'No speech detected. Tap the mic and try again.',
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

/**
 * Resolves the best SpeechRecognition / transcription language from explicit choice,
 * current draft text (Urdu script detection), or browser locale.
 */
export function resolveVoiceLanguage(opts?: {
  preferredLang?: VoiceLangCode | string | null;
  draftText?: string;
  navigatorLanguage?: string;
}): VoiceLangCode {
  const pref = String(opts?.preferredLang || '').trim().toLowerCase();
  if (pref === 'ur' || pref === 'ur-pk' || pref === 'urdu') return 'ur-PK';
  if (pref === 'en' || pref === 'en-pk' || pref === 'en-us' || pref === 'english') return 'en-PK';

  // Detect Urdu / Arabic script in current composer draft
  if (opts?.draftText && /[\u0600-\u06FF]/.test(opts.draftText)) {
    return 'ur-PK';
  }

  const navLang = (
    opts?.navigatorLanguage ||
    (typeof navigator !== 'undefined' ? navigator.language : '')
  ).toLowerCase();
  if (navLang.startsWith('ur')) return 'ur-PK';
  return 'en-PK';
}

export function stopMediaStreamTracks(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {
        // ignore individual track stop failure
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Maps any DOMException (getUserMedia), SpeechRecognitionErrorEvent, or runtime error
 * to the exact user-friendly message required. Always logs unknown errors to console.
 */
export function mapMicrophoneError(
  err: unknown,
  opts?: { userAgent?: string; logToConsole?: boolean }
): { code: string; message: string; isInApp: boolean } {
  const inApp = isInAppBrowser(opts?.userAgent);
  const rawName =
    typeof err === 'string'
      ? err
      : String((err as any)?.name || (err as any)?.error || '').trim();
  const rawMessage = String((err as any)?.message || '').toLowerCase();

  if (
    rawName === 'NotAllowedError' ||
    rawName === 'PermissionDeniedError' ||
    rawName === 'not-allowed' ||
    rawName === 'service-not-allowed' ||
    rawName === 'SecurityError'
  ) {
    if (inApp) {
      return {
        code: 'IN_APP_BLOCKED',
        message: VOICE_ERROR_MESSAGES.inAppBrowser,
        isInApp: true,
      };
    }
    return {
      code: 'NotAllowedError',
      message: VOICE_ERROR_MESSAGES.notAllowed,
      isInApp: false,
    };
  }

  if (
    rawName === 'NotFoundError' ||
    rawName === 'DevicesNotFoundError' ||
    rawName === 'audio-capture' ||
    rawMessage.includes('requested device not found')
  ) {
    return {
      code: 'NotFoundError',
      message: VOICE_ERROR_MESSAGES.notFound,
      isInApp: inApp,
    };
  }

  if (
    rawName === 'NotReadableError' ||
    rawName === 'TrackStartError' ||
    rawName === 'AbortError' ||
    rawMessage.includes('could not start audio source') ||
    rawMessage.includes('device in use')
  ) {
    return {
      code: 'NotReadableError',
      message: VOICE_ERROR_MESSAGES.notReadable,
      isInApp: inApp,
    };
  }

  if (rawName === 'no-speech') {
    return {
      code: 'no-speech',
      message: VOICE_ERROR_MESSAGES.noSpeech,
      isInApp: inApp,
    };
  }

  if (inApp) {
    return {
      code: 'IN_APP_BLOCKED',
      message: VOICE_ERROR_MESSAGES.inAppBrowser,
      isInApp: true,
    };
  }

  if (opts?.logToConsole !== false) {
    console.error('[Boardly Voice Input] unexpected microphone error:', err);
  }
  return {
    code: rawName || 'UNKNOWN',
    message: VOICE_ERROR_MESSAGES.generic,
    isInApp: false,
  };
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

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

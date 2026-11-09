/**
 * Single source of truth for Boardly Terms of Service & Privacy Policy
 * versioning, effective dates, and client/server consent recording.
 */

export const LEGAL_DOCUMENT_VERSION = '2026-11-08-v2.0';
export const LEGAL_VERSION_DISPLAY = 'Version 2.0';
export const LEGAL_LAST_UPDATED_LABEL = '8 November 2026';

const LOCAL_CONSENT_PREFIX = 'boardly_legal_consent_v2_';

export type LegalConsentActionContext =
  | 'email_signup'
  | 'google_signin'
  | 'guest_signin'
  | 'guest_upgrade'
  | 'existing_user_notice';

export interface RecordLegalConsentParams {
  userId: string;
  accountType?: 'registered' | 'guest';
  actionContext?: LegalConsentActionContext;
  documentVersion?: string;
  idToken?: string | null;
}

export function getLocalConsentAcceptedAt(
  userId: string,
  version: string = LEGAL_DOCUMENT_VERSION
): number | null {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${LOCAL_CONSENT_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      documentVersion?: string;
      acceptedAt?: number;
    };
    if (parsed.documentVersion === version && typeof parsed.acceptedAt === 'number') {
      return parsed.acceptedAt;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function setLocalConsentAccepted(
  userId: string,
  acceptedAt: number = Date.now(),
  version: string = LEGAL_DOCUMENT_VERSION
): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${LOCAL_CONSENT_PREFIX}${userId}`,
      JSON.stringify({
        userId,
        documentVersion: version,
        acceptedAt,
      })
    );
  } catch {
    // ignore storage errors
  }
}

export async function recordLegalConsentOnServer(
  params: RecordLegalConsentParams
): Promise<{ ok: boolean; acceptedAt: number; documentVersion: string }> {
  const userId = String(params.userId || '').trim();
  const documentVersion = params.documentVersion || LEGAL_DOCUMENT_VERSION;
  const acceptedAt = Date.now();

  if (userId) {
    setLocalConsentAccepted(userId, acceptedAt, documentVersion);
  }

  if (!userId) {
    return { ok: false, acceptedAt, documentVersion };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (params.idToken) {
      headers.Authorization = `Bearer ${params.idToken}`;
    }

    const res = await fetch('/api/auth/legal-consent', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        userId,
        accountType: params.accountType || (userId.startsWith('guest_') ? 'guest' : 'registered'),
        documentVersion,
        actionContext: params.actionContext || 'email_signup',
        acceptedAt,
      }),
    });

    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        acceptedAt?: number;
        documentVersion?: string;
      };
      const serverTs = typeof data.acceptedAt === 'number' ? data.acceptedAt : acceptedAt;
      setLocalConsentAccepted(userId, serverTs, documentVersion);
      return {
        ok: true,
        acceptedAt: serverTs,
        documentVersion: data.documentVersion || documentVersion,
      };
    }
  } catch {
    // Non-blocking fallback: local storage already recorded
  }

  return { ok: true, acceptedAt, documentVersion };
}

export async function checkUserLegalConsentStatus(params: {
  userId: string;
  idToken?: string | null;
  documentVersion?: string;
}): Promise<{ accepted: boolean; acceptedAt: number | null; documentVersion: string }> {
  const userId = String(params.userId || '').trim();
  const version = params.documentVersion || LEGAL_DOCUMENT_VERSION;

  if (!userId) {
    return { accepted: false, acceptedAt: null, documentVersion: version };
  }

  const localTs = getLocalConsentAcceptedAt(userId, version);
  if (localTs) {
    return { accepted: true, acceptedAt: localTs, documentVersion: version };
  }

  try {
    const headers: Record<string, string> = {};
    if (params.idToken) {
      headers.Authorization = `Bearer ${params.idToken}`;
    }
    const res = await fetch(
      `/api/auth/legal-consent?userId=${encodeURIComponent(userId)}&version=${encodeURIComponent(version)}`,
      {
        method: 'GET',
        headers,
        credentials: 'include',
      }
    );
    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        accepted?: boolean;
        acceptedAt?: number | null;
      };
      if (data.accepted && data.acceptedAt) {
        setLocalConsentAccepted(userId, data.acceptedAt, version);
        return {
          accepted: true,
          acceptedAt: data.acceptedAt,
          documentVersion: version,
        };
      }
    }
  } catch {
    // ignore network errors
  }

  return { accepted: false, acceptedAt: null, documentVersion: version };
}

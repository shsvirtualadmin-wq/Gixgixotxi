import { auth } from '../lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

const SESSION_ID_STORAGE_KEY = 'boardly_active_session_id_v1';
const DEFAULT_TIMEOUT_MS = 8000;

let sessionRevokedHandler: (() => void) | null = null;

export function registerSessionRevokedHandler(handler: (() => void) | null): void {
  sessionRevokedHandler = handler;
}

export function getStoredSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionId(sessionId: string | null): void {
  try {
    if (sessionId) {
      localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
    } else {
      localStorage.removeItem(SESSION_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export interface SecurityRecommendation {
  id: 'no_passkey' | 'two_factor_off' | 'unknown_session';
  title: string;
  subtitle: string;
  actionLabel: string;
  targetSection: 'passkeys' | 'mfa' | 'sessions';
}

export interface SecuritySummary {
  twoFactor: {
    twoFactorEnabled: boolean;
    totpEnabled: boolean;
    email2faEnabled: boolean;
    emailCodeEnabled: boolean;
    backupCodesRemaining: number;
    trustedDevicesCount: number;
    rememberedDevices: number;
    recoveryPending: boolean;
    recoveryDisableAt: number | null;
  };
  passkeysCount: number;
  activeSessionsCount: number;
  trustedDevicesCount: number;
  unknownSessionsCount: number;
  recommendations: SecurityRecommendation[];
  hasRecommendations: boolean;
}

export interface PasskeyItem {
  id: string;
  credentialId: string;
  name: string;
  deviceType: 'platform' | 'cross-platform' | string;
  transports: string[];
  createdAt: number;
  lastUsedAt: number | null;
}

export interface ActiveSessionItem {
  id: string;
  deviceLabel: string;
  browser: string;
  os: string;
  locationHint: string;
  createdAt: number;
  lastSeenAt: number;
  isCurrent: boolean;
}

export interface TrustedDeviceItem {
  id: string;
  deviceLabel: string;
  browser: string;
  os: string;
  createdAt: number;
  lastUsedAt: number;
  expiresAt: number;
  isCurrent: boolean;
}

export interface SecurityEventItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  deviceLabel: string;
  metadata: Record<string, unknown>;
  createdAt: number;
}

function bufferToBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  );
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { requireAuth?: boolean; timeoutMs?: number } = {}
): Promise<Response> {
  const { requireAuth = true, timeoutMs = DEFAULT_TIMEOUT_MS, headers: rawHeaders, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(rawHeaders || {});
    if (requireAuth) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Sign in to access security settings.');
      }
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    }
    const sessionId = getStoredSessionId();
    if (sessionId) {
      headers.set('X-Boardly-Session', sessionId);
    }

    const res = await fetch(url, {
      ...rest,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    if (res.status === 401) {
      const clone = res.clone();
      const data = await clone.json().catch(() => null);
      if (data?.code === 'SESSION_REVOKED') {
        setStoredSessionId(null);
        if (sessionRevokedHandler) {
          sessionRevokedHandler();
        }
        throw new Error('This session was signed out from another device.');
      }
    }

    return res;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Request failed (${res.status}).`);
  }
  return data as T;
}

export async function fetchSecuritySummary(): Promise<SecuritySummary> {
  const res = await fetchWithTimeout('/api/auth/security/summary', { method: 'GET' });
  return parseJsonResponse<SecuritySummary>(res);
}

export async function heartbeatSession(): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    const res = await fetchWithTimeout('/api/auth/sessions/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await parseJsonResponse<{ ok: true; sessionId: string }>(res);
    if (data.sessionId) {
      setStoredSessionId(data.sessionId);
      return data.sessionId;
    }
  } catch {
    // Non-fatal on background heartbeat
  }
  return getStoredSessionId();
}

export async function listSessions(): Promise<{ sessions: ActiveSessionItem[]; currentSessionId: string | null }> {
  const res = await fetchWithTimeout('/api/auth/sessions', { method: 'GET' });
  return parseJsonResponse<{ sessions: ActiveSessionItem[]; currentSessionId: string | null }>(res);
}

export async function revokeSession(sessionId: string): Promise<{ revokedCurrent: boolean }> {
  const res = await fetchWithTimeout(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
  const data = await parseJsonResponse<{ ok: true; revokedCurrent: boolean }>(res);
  if (data.revokedCurrent) {
    setStoredSessionId(null);
  }
  return { revokedCurrent: Boolean(data.revokedCurrent) };
}

export async function revokeAllSessions(keepCurrent = false): Promise<void> {
  const res = await fetchWithTimeout('/api/auth/sessions/revoke-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keepCurrent }),
  });
  await parseJsonResponse(res);
  if (!keepCurrent) {
    setStoredSessionId(null);
  }
}

export async function listPasskeys(): Promise<PasskeyItem[]> {
  const res = await fetchWithTimeout('/api/auth/passkeys', { method: 'GET' });
  const data = await parseJsonResponse<{ ok: true; passkeys: PasskeyItem[] }>(res);
  return data.passkeys || [];
}

export async function registerPasskey(customName?: string): Promise<PasskeyItem> {
  if (!isWebAuthnSupported()) {
    throw new Error('Passkeys are not supported on this browser or device.');
  }

  const optRes = await fetchWithTimeout('/api/auth/passkeys/register/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const optData = await parseJsonResponse<{
    ok: true;
    challengeId: string;
    options: {
      challenge: string;
      rp: { name: string; id: string };
      user: { id: string; name: string; displayName: string };
      pubKeyCredParams: PublicKeyCredentialParameters[];
      timeout: number;
      attestation: AttestationConveyancePreference;
      authenticatorSelection: AuthenticatorSelectionCriteria;
      excludeCredentials?: Array<{ id: string; type: 'public-key' }>;
    };
  }>(optRes);

  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToUint8Array(optData.options.challenge) as BufferSource,
    rp: optData.options.rp,
    user: {
      id: base64UrlToUint8Array(optData.options.user.id) as BufferSource,
      name: optData.options.user.name,
      displayName: optData.options.user.displayName,
    },
    pubKeyCredParams: optData.options.pubKeyCredParams,
    timeout: optData.options.timeout,
    attestation: optData.options.attestation,
    authenticatorSelection: optData.options.authenticatorSelection,
    excludeCredentials: (optData.options.excludeCredentials || []).map((c) => ({
      id: base64UrlToUint8Array(c.id) as BufferSource,
      type: 'public-key',
    })),
  };

  let credential: Credential | null = null;
  try {
    credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      throw new Error('Passkey setup was cancelled.');
    }
    if (err?.name === 'InvalidStateError') {
      throw new Error('This device already has a passkey for your account.');
    }
    throw new Error(err?.message || 'Could not create passkey on this device.');
  }

  if (!credential || credential.type !== 'public-key') {
    throw new Error('No passkey credential returned.');
  }

  const pubCred = credential as PublicKeyCredential;
  const response = pubCred.response as AuthenticatorAttestationResponse;

  let publicKeyB64 = 'attestation-only';
  let algorithm = -7;
  let transports: string[] = [];

  if (typeof response.getPublicKey === 'function') {
    const spki = response.getPublicKey();
    if (spki) publicKeyB64 = bufferToBase64Url(spki);
  }
  if (typeof response.getPublicKeyAlgorithm === 'function') {
    algorithm = response.getPublicKeyAlgorithm();
  }
  if (typeof response.getTransports === 'function') {
    transports = response.getTransports() || [];
  }

  const verifyRes = await fetchWithTimeout('/api/auth/passkeys/register/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId: optData.challengeId,
      credentialId: bufferToBase64Url(pubCred.rawId),
      publicKey: publicKeyB64,
      algorithm,
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      transports,
      name: customName || undefined,
      deviceType: transports.includes('internal') ? 'platform' : 'cross-platform',
    }),
  });
  const verifyData = await parseJsonResponse<{ ok: true; passkey: PasskeyItem }>(verifyRes);
  return verifyData.passkey;
}

export async function renamePasskey(passkeyId: string, name: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/auth/passkeys/${encodeURIComponent(passkeyId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  await parseJsonResponse(res);
}

export async function deletePasskey(passkeyId: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/auth/passkeys/${encodeURIComponent(passkeyId)}`, {
    method: 'DELETE',
  });
  await parseJsonResponse(res);
}

export async function signInWithPasskey(identifier?: string): Promise<{
  uid: string;
  passkeyName: string;
  signedInWithCustomToken: boolean;
}> {
  if (!isWebAuthnSupported()) {
    throw new Error('Passkeys are not supported on this browser or device.');
  }

  const optRes = await fetchWithTimeout('/api/auth/passkeys/login/options', {
    method: 'POST',
    requireAuth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: identifier || '' }),
  });
  const optData = await parseJsonResponse<{
    ok: true;
    challengeId: string;
    options: {
      challenge: string;
      rpId: string;
      timeout: number;
      userVerification: UserVerificationRequirement;
      allowCredentials?: Array<{ id: string; type: 'public-key'; transports?: AuthenticatorTransport[] }>;
    };
  }>(optRes);

  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge: base64UrlToUint8Array(optData.options.challenge) as BufferSource,
    rpId: optData.options.rpId,
    timeout: optData.options.timeout,
    userVerification: optData.options.userVerification,
    ...(optData.options.allowCredentials && optData.options.allowCredentials.length > 0
      ? {
          allowCredentials: optData.options.allowCredentials.map((c) => ({
            id: base64UrlToUint8Array(c.id) as BufferSource,
            type: 'public-key' as const,
            ...(c.transports ? { transports: c.transports } : {}),
          })),
        }
      : {}),
  };

  let assertion: Credential | null = null;
  try {
    assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      throw new Error('Passkey sign-in was cancelled.');
    }
    throw new Error(err?.message || 'Passkey verification failed.');
  }

  if (!assertion || assertion.type !== 'public-key') {
    throw new Error('No passkey selected.');
  }

  const pubCred = assertion as PublicKeyCredential;
  const response = pubCred.response as AuthenticatorAssertionResponse;

  const verifyRes = await fetchWithTimeout('/api/auth/passkeys/login/verify', {
    method: 'POST',
    requireAuth: false,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId: optData.challengeId,
      credentialId: bufferToBase64Url(pubCred.rawId),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      signature: bufferToBase64Url(response.signature),
    }),
  });

  const verifyData = await parseJsonResponse<{
    ok: true;
    uid: string;
    passkeyName: string;
    customToken?: string;
  }>(verifyRes);

  if (verifyData.customToken) {
    await signInWithCustomToken(auth, verifyData.customToken);
    return {
      uid: verifyData.uid,
      passkeyName: verifyData.passkeyName,
      signedInWithCustomToken: true,
    };
  }

  throw new Error(
    'Passkey verified, but server-side Firebase custom token signing is not configured in this environment. Sign in with password or Google.'
  );
}

export async function listTrustedDevices(): Promise<TrustedDeviceItem[]> {
  const res = await fetchWithTimeout('/api/auth/trusted-devices', { method: 'GET' });
  const data = await parseJsonResponse<{ ok: true; devices: TrustedDeviceItem[] }>(res);
  return data.devices || [];
}

export async function removeTrustedDevice(deviceId: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/auth/trusted-devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
  await parseJsonResponse(res);
}

export async function fetchSecurityEvents(
  page = 1,
  limit = 20
): Promise<{
  events: SecurityEventItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}> {
  const res = await fetchWithTimeout(
    `/api/auth/security-events?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`,
    { method: 'GET' }
  );
  return parseJsonResponse(res);
}

export async function logClientSecurityEvent(
  type: 'sign_in' | 'failed_sign_in' | 'password_changed' | 'device_unlock_enabled' | 'device_unlock_disabled',
  detail?: string
): Promise<void> {
  if (!auth.currentUser) return;
  try {
    await fetchWithTimeout('/api/auth/security-events/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, detail }),
    });
  } catch {
    // Non-fatal
  }
}

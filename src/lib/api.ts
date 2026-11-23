import { auth } from './firebase';
import {
  FRIENDLY_ERROR_MESSAGE,
  isTechnicalErrorMessage,
} from '@/utils/safeErrorMessage';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  attemptId?: string;
  attempt?: any;
  rawMessage?: string;
  data?: any;
}

export type ToastKind = 'error' | 'success' | 'info';

/**
 * Lightweight, zero-dependency DOM toast notification so API messages
 * are shown clearly without leaking raw infrastructure or database errors.
 */
export function showApiToast(message: string, kind: ToastKind = 'error'): void {
  if (typeof document === 'undefined' || !message) return;

  const trimmed = message.trim();
  const normalizedMessage =
    kind === 'error' && isTechnicalErrorMessage(trimmed)
      ? FRIENDLY_ERROR_MESSAGE
      : trimmed;
  if (!normalizedMessage) return;

  let container = document.getElementById('boardly-api-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'boardly-api-toast-container';
    container.className =
      'fixed top-4 right-4 left-4 sm:left-auto sm:max-w-sm z-[10050] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  // Dedupe: if an identical toast message is already visible, reset its timer instead of stacking a second one
  const toastKey = `${kind}:${normalizedMessage.toLowerCase()}`;
  const existingToast = container.querySelector(
    `[data-toast-key="${CSS.escape(toastKey)}"]`
  ) as HTMLElement | null;
  if (existingToast) {
    const prevTimer = Number(existingToast.dataset.timerId || '0');
    if (prevTimer) window.clearTimeout(prevTimer);
    const nextTimer = window.setTimeout(() => {
      if (existingToast.parentNode) existingToast.remove();
    }, 4000);
    existingToast.dataset.timerId = String(nextTimer);
    return;
  }

  const toast = document.createElement('div');
  toast.setAttribute('data-toast-key', toastKey);
  const borderClass =
    kind === 'error'
      ? 'border-[#D71921]/60 bg-[#140c0d] text-red-200'
      : kind === 'success'
      ? 'border-emerald-500/50 bg-[#0b1512] text-emerald-200'
      : 'border-white/20 bg-[#141417] text-zinc-100';

  toast.className = `pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-sans transition-all duration-200 ${borderClass}`;

  const textSpan = document.createElement('span');
  textSpan.className = 'leading-snug break-words flex-1';
  textSpan.textContent = normalizedMessage;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'text-current opacity-70 hover:opacity-100 font-bold text-xs px-1 cursor-pointer';
  closeBtn.textContent = '✕';
  closeBtn.onclick = () => {
    toast.remove();
  };

  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  const timerId = window.setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 4000);
  toast.dataset.timerId = String(timerId);
}

/**
 * Normalizes any API path into a relative same-site `/api/...` path.
 */
function resolveApiPath(path: string): string {
  const cleanPath = String(path || '').trim();
  if (!cleanPath) return '/api';
  const withLeadingSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  if (withLeadingSlash.startsWith('/api/') || withLeadingSlash === '/api') {
    return withLeadingSlash;
  }
  return `/api${withLeadingSlash}`;
}

const GUEST_SESSION_STORAGE_KEY = 'boardly_guest_session_backup_v1';
const TRUSTED_DEVICE_STORAGE_KEY = 'boardly_trusted_device_token';

export function getStoredTrustedDeviceToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = window.localStorage.getItem(TRUSTED_DEVICE_STORAGE_KEY);
    if (fromLocal && fromLocal.trim()) return fromLocal.trim();
  } catch {
    // Ignore storage error
  }
  return null;
}

export function setStoredTrustedDeviceToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token && token.trim()) {
      window.localStorage.setItem(TRUSTED_DEVICE_STORAGE_KEY, token.trim());
    } else {
      window.localStorage.removeItem(TRUSTED_DEVICE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage error
  }
}

export function getStoredGuestSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (fromLocal && fromLocal.trim()) return fromLocal.trim();
  } catch {
    // Ignore storage error
  }
  try {
    const fromSession = window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (fromSession && fromSession.trim()) return fromSession.trim();
  } catch {
    // Ignore storage error
  }
  return null;
}

export function setStoredGuestSessionToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token && token.trim()) {
      window.localStorage.setItem(GUEST_SESSION_STORAGE_KEY, token.trim());
      window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, token.trim());
    } else {
      window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage error
  }
}

export async function getBearerToken(forceRefresh = false): Promise<string | null> {
  try {
    let user = auth.currentUser;
    const guestToken = getStoredGuestSessionToken();
    if (!user && !guestToken && typeof (auth as any).authStateReady === 'function') {
      await Promise.race([
        (auth as any).authStateReady(),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      user = auth.currentUser;
    }
    if (user) {
      return await Promise.race([
        user.getIdToken(forceRefresh),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);
    }
    if (guestToken) {
      return guestToken.startsWith('guest_') ? guestToken : `guest_${guestToken}`;
    }
  } catch {
    // ignore token lookup error
  }
  return null;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  silentErrorToast?: boolean;
  requireAuth?: boolean;
  timeoutMs?: number;
}

/**
 * Shared REST API helper using relative `/api/...` paths on the same site.
 * Always sends `credentials: 'include'` (so the HttpOnly `boardly_guest_session` cookie is sent),
 * plus `Authorization: Bearer <token>` and `X-Guest-Session` when available,
 * logs failed status codes and response bodies to console.error, and shows actionable error messages.
 */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    body,
    headers: customHeaders,
    silentErrorToast = false,
    requireAuth: _requireAuth = false,
    timeoutMs = 15000,
    signal: externalSignal,
    ...rest
  } = options;

  const token = await getBearerToken(false);
  const guestSessionToken = getStoredGuestSessionToken();
  const trustedDeviceToken = getStoredTrustedDeviceToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (guestSessionToken && !headers['X-Guest-Session']) {
    headers['X-Guest-Session'] = guestSessionToken;
  }
  if (trustedDeviceToken && !headers['X-Trusted-Device']) {
    headers['X-Trusted-Device'] = trustedDeviceToken;
  }

  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    if (
      typeof body === 'string' ||
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof Blob
    ) {
      serializedBody = body as BodyInit;
    } else {
      serializedBody = JSON.stringify(body);
    }
  }

  const url = resolveApiPath(path);
  const method = String(rest.method || 'GET').toUpperCase();
  const controller = new AbortController();
  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => {
          controller.abort(new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s (${url})`));
        }, timeoutMs)
      : null;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), {
        once: true,
      });
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      credentials: 'include',
      headers,
      body: serializedBody,
      signal: controller.signal,
    });
  } catch (networkErr: any) {
    const isAbort =
      networkErr?.name === 'AbortError' ||
      controller.signal.aborted ||
      String(networkErr?.message || '').toLowerCase().includes('abort') ||
      String(networkErr?.message || '').toLowerCase().includes('timed out');
    const rawMsg = isAbort
      ? `Request timed out after ${Math.round(timeoutMs / 1000)}s (${url}).`
      : networkErr?.message || 'Network error while contacting server.';
    console.error(`[API Network Error] ${method} ${url}:`, rawMsg, networkErr);
    const safeMsg = FRIENDLY_ERROR_MESSAGE;
    const wrappedErr: ApiError = new Error(safeMsg);
    wrappedErr.code = isAbort ? 'REQUEST_TIMEOUT' : networkErr?.code || 'NETWORK_ERROR';
    wrappedErr.rawMessage = safeMsg;
    if (!silentErrorToast) showApiToast(safeMsg, 'error');
    throw wrappedErr;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const rawText = await response.text().catch(() => '');
  let data: any = {};
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText.slice(0, 300) };
    }
  }

  if (!response.ok) {
    console.error(`[API Error] ${method} ${url} -> HTTP ${response.status}:`, rawText || data);

    const rawServerError =
      typeof data?.error === 'string' && data.error.trim()
        ? data.error.trim()
        : typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : `HTTP ${response.status} ${response.statusText || ''}`.trim();
    const serverCode =
      typeof data?.code === 'string' && data.code.trim() ? data.code.trim() : undefined;

    const isSigningOutActive =
      typeof window !== 'undefined' && Boolean((window as any).__boardlySigningOut);

    let serverError = rawServerError;
    const isGuestExpiredOrInvalid =
      response.status === 401 &&
      (serverCode === 'GUEST_SESSION_EXPIRED' ||
        Boolean(guestSessionToken) ||
        /^unauthorized$/i.test(rawServerError) ||
        (!auth.currentUser && rawServerError.toLowerCase().includes('authentication required')));

    if (isGuestExpiredOrInvalid) {
      // Requirement 4: If a guest session is expired or invalid, treat it as signed-out:
      // sign out, clear it, show the sign-in screen. Never show a "guest expired / permission denied" error.
      setStoredGuestSessionToken(null);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('boardly_guest_session_token');
          window.sessionStorage.removeItem('boardly_guest_session_token');
          window.dispatchEvent(new CustomEvent('boardly:guest-expired'));
        }
      } catch {
        // Ignore storage error
      }
      serverError = 'Session ended. Please sign in to continue.';
    } else if (/^unauthorized$/i.test(rawServerError)) {
      serverError = 'Your session has expired or you are not signed in. Please sign in to continue.';
    } else if (serverCode === 'EMAIL_VERIFICATION_REQUIRED') {
      serverError = 'Please verify your email to continue.';
    }

    const isInternalOrTechnical =
      response.status >= 500 || isTechnicalErrorMessage(serverError);
    const safeUserMessage = isInternalOrTechnical
      ? FRIENDLY_ERROR_MESSAGE
      : serverError;

    const err: ApiError = new Error(safeUserMessage);
    err.status = response.status;
    err.code = serverCode || `HTTP_${response.status}`;
    err.rawMessage = safeUserMessage;
    err.attemptId = data?.attemptId;
    err.attempt = data?.attempt;
    err.data = data;
    if (
      !silentErrorToast &&
      !isSigningOutActive &&
      !isGuestExpiredOrInvalid &&
      serverCode !== 'EMAIL_VERIFICATION_REQUIRED'
    ) {
      showApiToast(safeUserMessage, 'error');
    }
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T = any>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T = any>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T = any>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};


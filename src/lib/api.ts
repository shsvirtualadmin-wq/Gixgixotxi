import { auth } from './firebase';

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
 * Lightweight, zero-dependency DOM toast notification so real API error
 * messages ({ error, code }) are always shown clearly in the UI.
 */
export function showApiToast(message: string, kind: ToastKind = 'error'): void {
  if (typeof document === 'undefined' || !message) return;

  let container = document.getElementById('boardly-api-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'boardly-api-toast-container';
    container.className =
      'fixed top-4 right-4 left-4 sm:left-auto sm:max-w-sm z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const borderClass =
    kind === 'error'
      ? 'border-[#D71921]/60 bg-[#140c0d] text-red-200'
      : kind === 'success'
      ? 'border-emerald-500/50 bg-[#0b1512] text-emerald-200'
      : 'border-white/20 bg-[#141417] text-zinc-100';

  toast.className = `pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-sans transition-all duration-200 ${borderClass}`;

  const textSpan = document.createElement('span');
  textSpan.className = 'leading-snug break-words flex-1';
  textSpan.textContent = message;

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

  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 5000);
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

export async function getBearerToken(forceRefresh = false): Promise<string | null> {
  try {
    let user = auth.currentUser;
    if (!user && typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
      user = auth.currentUser;
    }
    if (user) {
      return await user.getIdToken(forceRefresh);
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
}

/**
 * Shared REST API helper using relative `/api/...` paths on the same site.
 * Sends `Authorization: Bearer <Firebase ID token>` and `Content-Type: application/json`
 * on every request, and surfaces `{ error, code }` from the response body in a toast on failure.
 */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    body,
    headers: customHeaders,
    silentErrorToast = false,
    requireAuth = false,
    ...rest
  } = options;

  const token = await getBearerToken(false);
  if (requireAuth && !token) {
    const err: ApiError = new Error('Authentication required. Please sign in.');
    err.status = 401;
    err.code = 'UNAUTHENTICATED';
    if (!silentErrorToast) showApiToast(`${err.message} [UNAUTHENTICATED]`, 'error');
    throw err;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: serializedBody,
    });
  } catch (networkErr: any) {
    const msg = networkErr?.message || 'Network error while contacting server.';
    if (!silentErrorToast) showApiToast(msg, 'error');
    throw networkErr;
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
    const serverError =
      typeof data?.error === 'string' && data.error.trim()
        ? data.error.trim()
        : typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : `HTTP ${response.status} ${response.statusText || ''}`.trim();
    const serverCode =
      typeof data?.code === 'string' && data.code.trim() ? data.code.trim() : undefined;

    const fullMessage = serverCode ? `${serverError} (${serverCode})` : serverError;
    const err: ApiError = new Error(fullMessage);
    err.status = response.status;
    err.code = serverCode || `HTTP_${response.status}`;
    err.rawMessage = serverError;
    err.attemptId = data?.attemptId;
    err.attempt = data?.attempt;
    err.data = data;
    if (!silentErrorToast) {
      showApiToast(fullMessage, 'error');
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


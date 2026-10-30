import { auth } from './firebase';

/**
 * Single Worker API URL configuration variable.
 * Set VITE_WORKER_API_URL in your environment (or edit the fallback below)
 * to point to your deployed Cloudflare Worker (e.g. "https://boardly-d1-api-worker.<subdomain>.workers.dev").
 * When empty, requests use relative `/api/...` routes.
 */
export const WORKER_API_URL: string = (
  (import.meta as any).env?.VITE_WORKER_API_URL || ''
).replace(/\/+$/, '');

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export type ToastKind = 'error' | 'success' | 'info';

/**
 * Lightweight, zero-dependency DOM toast notification so real API error
 * messages are always shown clearly without using `window.alert`.
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
  }, 4500);
}

export function buildWorkerUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!WORKER_API_URL) return normalizedPath;
  return `${WORKER_API_URL}${normalizedPath}`;
}

export async function getBearerToken(forceRefresh = false): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(forceRefresh);
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
 * Shared Cloudflare Worker REST API helper.
 * Automatically attaches `Authorization: Bearer <token>` and handles JSON errors.
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
    const err: ApiError = new Error('Please sign in to continue.');
    err.status = 401;
    err.code = 'UNAUTHENTICATED';
    if (!silentErrorToast) showApiToast(err.message, 'error');
    throw err;
  }

  const headers: Record<string, string> = {
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
      headers['Content-Type'] = 'application/json';
      serializedBody = JSON.stringify(body);
    }
  }

  const url = buildWorkerUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: serializedBody,
    });
  } catch (networkErr: any) {
    const msg = networkErr?.message || 'Network error while contacting the server.';
    if (!silentErrorToast) showApiToast(msg, 'error');
    throw networkErr;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed (${response.status})`;
    const err: ApiError = new Error(message);
    err.status = response.status;
    err.code = data?.code || `HTTP_${response.status}`;
    if (!silentErrorToast) {
      showApiToast(message, 'error');
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

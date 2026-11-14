import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { getSmoothMode, applySmoothModeToDocument } from '@/utils/smoothMode';
import App from './App';
import './index.css';

// Initialize Smooth Mode synchronously before first render so low-end devices skip heavy CSS effects
applySmoothModeToDocument(getSmoothMode());

const CHUNK_RELOAD_KEY = 'boardly_chunk_retry_reloaded';

function isChunkLoadError(errOrMsg: unknown): boolean {
  const msg =
    errOrMsg instanceof Error
      ? `${errOrMsg.name} ${errOrMsg.message}`
      : String(errOrMsg || '');
  return /failed to fetch dynamically imported module|chunkloaderror|loading chunk [\w-]+ failed|importing a module script failed|error loading dynamically imported module/i.test(
    msg
  );
}

function tryOneTimeChunkReload(): boolean {
  try {
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
    const now = Date.now();
    if (!lastReload || now - lastReload > 15000) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      window.location.reload();
      return true;
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

function renderFatalFallbackIfRootUnmounted(errorMessage?: string) {
  if (typeof document === 'undefined') return;
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  // Only replace #root if React has not mounted or only the boot skeleton is present
  const hasOnlyBootShell =
    rootEl.children.length === 0 ||
    (rootEl.children.length === 1 && rootEl.firstElementChild?.classList.contains('b-boot-shell'));
  if (!hasOnlyBootShell) return;

  const safeMsg = String(errorMessage || 'Unable to load the application bundle.')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:var(--bg,#0a0a0c);color:var(--text,#f5f5f7);font-family:'Inter',system-ui,-apple-system,sans-serif;">
      <div style="width:100%;max-width:460px;padding:28px 24px;border-radius:24px;background:var(--surface,#121216);border:1px solid rgba(255,255,255,0.1);text-align:center;">
        <div style="width:48px;height:48px;border-radius:9999px;background:rgba(215,25,33,0.12);border:1px solid #D71921;color:#D71921;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-weight:700;font-size:20px;">!</div>
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;">Something went wrong</h2>
        <p style="margin:0 0 16px;font-size:13px;line-height:1.5;opacity:0.75;">We couldn't finish loading Boardly. Please reload the page or return to the home screen.</p>
        <div style="margin:0 0 20px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);font-family:monospace;font-size:11px;opacity:0.75;word-break:break-word;text-align:left;max-height:80px;overflow-y:auto;">${safeMsg}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
          <button type="button" onclick="try{sessionStorage.removeItem('boardly_chunk_retry_reloaded');}catch(e){}window.location.reload();" style="padding:10px 20px;border-radius:9999px;background:#D71921;color:#fff;border:none;font-size:13px;font-weight:600;cursor:pointer;">Reload</button>
          <a href="/" onclick="try{sessionStorage.removeItem('boardly_chunk_retry_reloaded');}catch(e){}" style="padding:10px 20px;border-radius:9999px;background:rgba(255,255,255,0.06);color:inherit;border:1px solid rgba(255,255,255,0.14);font-size:13px;font-weight:600;text-decoration:none;">Home</a>
        </div>
      </div>
    </div>
  `;
}

if (typeof window !== 'undefined') {
  // Clean up any stale service workers and old caches once on startup so stale index.html/chunks are never served
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});
  }
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => {
        for (const key of keys) {
          if (key.startsWith('boardly-')) {
            caches.delete(key).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }

  // Handle Vite module preload errors (e.g. stale hashed chunk after deploy)
  window.addEventListener('vite:preloadError', (event) => {
    console.error('[Boardly] vite:preloadError:', event);
    event.preventDefault();
    if (!tryOneTimeChunkReload()) {
      renderFatalFallbackIfRootUnmounted('A newer version of Boardly is available. Please reload.');
    }
  });

  // Global window.onerror & unhandledrejection protection
  window.addEventListener('error', (event) => {
    const err = event.error || event.message;
    console.error('[Boardly] Global error:', err);
    if (isChunkLoadError(err)) {
      if (tryOneTimeChunkReload()) return;
    }
    renderFatalFallbackIfRootUnmounted(
      event.error?.message || event.message || 'Unexpected runtime error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    console.error('[Boardly] Unhandled promise rejection:', reason);
    if (isChunkLoadError(reason)) {
      event.preventDefault();
      if (tryOneTimeChunkReload()) return;
      renderFatalFallbackIfRootUnmounted(
        reason?.message || String(reason || 'Failed to load page module')
      );
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
      gcTime: 1000 * 60 * 30, // 30 minutes in memory
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <DashboardErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </QueryClientProvider>
        </DashboardErrorBoundary>
      </StrictMode>
    );
    // Clear the chunk reload guard once the app has stayed alive for 10s
    setTimeout(() => {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } catch {
        // ignore
      }
    }, 10000);
  } catch (err) {
    console.error('[Boardly] Root mount failure:', err);
    renderFatalFallbackIfRootUnmounted(
      err instanceof Error ? err.message : 'Application failed to mount'
    );
  }
}

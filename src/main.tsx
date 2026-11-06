import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Handle dynamic chunk import failures cleanly with safe single-reload guard
if (typeof window !== 'undefined') {
  const buildInfo = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev');
  console.log(`[Boardly] Initializing client bundle. Build ID: ${buildInfo}`);
  
  // Safely check and unregister any legacy service workers/caches without throwing in sandboxed iframes
  try {
    const clearPromises: Promise<unknown>[] = [];
    if ('serviceWorker' in navigator) {
      clearPromises.push(
        navigator.serviceWorker
          .getRegistrations()
          .then(async (registrations) => {
            let hadRegistration = false;
            for (const registration of registrations) {
              hadRegistration = true;
              await registration.unregister().catch(() => {});
            }
            return hadRegistration;
          })
          .catch(() => false)
      );
    }
    if ('caches' in window) {
      clearPromises.push(
        window.caches
          .keys()
          .then(async (names) => {
            let hadCache = false;
            for (const name of names) {
              hadCache = true;
              await window.caches.delete(name).catch(() => {});
            }
            return hadCache;
          })
          .catch(() => false)
      );
    }
    if (clearPromises.length > 0) {
      Promise.all(clearPromises)
        .then((results) => {
          const hadStaleSwOrCache = results.some(Boolean);
          const purgeReloadKey = 'boardly_sw_cache_purged_v9';
          if (hadStaleSwOrCache && !sessionStorage.getItem(purgeReloadKey)) {
            sessionStorage.setItem(purgeReloadKey, '1');
            window.location.reload();
          }
        })
        .catch(() => {});
    }
  } catch {
    // Ignore restricted iframe sandbox security errors
  }

  // Prevent uncaught cross-origin script error noise from breaking user execution
  window.addEventListener('error', (event) => {
    if (event.message === 'Script error.' || !event.filename) {
      event.preventDefault?.();
    }
  });

  window.addEventListener('vite:preloadError', (event) => {
    const hasReloaded = sessionStorage.getItem('boardly-preload-reloaded');
    if (!hasReloaded) {
      sessionStorage.setItem('boardly-preload-reloaded', 'true');
      window.location.reload();
    } else {
      sessionStorage.removeItem('boardly-preload-reloaded');
      console.error('[Vite Preload Error]', event);
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
